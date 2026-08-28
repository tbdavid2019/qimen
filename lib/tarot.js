const crypto = require('crypto');

/**
 * Python 标准库 random.Random (MT19937) 兼容生成器
 * 用于与上游 draw.py 实现 100% 相同 seed/time_factor 的抽牌结果对齐
 */
class PythonRandom {
    constructor(seed = 0) {
        this.mt = new Uint32Array(624);
        this.index = 624;
        this.init(seed);
    }
    init(seed) {
        this.mt[0] = 19650218 >>> 0;
        for (let i = 1; i < 624; i++) {
            const s = this.mt[i - 1] ^ (this.mt[i - 1] >>> 30);
            this.mt[i] = (Math.imul(1812433253, s) + i) >>> 0;
        }
        let i = 1, j = 0;
        let numSeed = typeof seed === 'number' ? seed : (parseInt(seed, 10) || 0);
        let key = [numSeed >>> 0];
        let k = 624 > key.length ? 624 : key.length;
        for (; k; k--) {
            const s = this.mt[i - 1] ^ (this.mt[i - 1] >>> 30);
            this.mt[i] = ((this.mt[i] ^ Math.imul(1664525, s)) + key[j] + j) >>> 0;
            i++; j++;
            if (i >= 624) { this.mt[0] = this.mt[623]; i = 1; }
            if (j >= key.length) j = 0;
        }
        for (k = 623; k; k--) {
            const s = this.mt[i - 1] ^ (this.mt[i - 1] >>> 30);
            this.mt[i] = ((this.mt[i] ^ Math.imul(1566083941, s)) - i) >>> 0;
            i++;
            if (i >= 624) { this.mt[0] = this.mt[623]; i = 1; }
        }
        this.mt[0] = 0x80000000 >>> 0;
    }
    genrand_int32() {
        if (this.index >= 624) {
            const mag01 = [0, 0x9908b0df];
            let kk;
            for (kk = 0; kk < 227; kk++) {
                const y = (this.mt[kk] & 0x80000000) | (this.mt[kk + 1] & 0x7fffffff);
                this.mt[kk] = this.mt[kk + 397] ^ (y >>> 1) ^ mag01[y & 1];
            }
            for (; kk < 623; kk++) {
                const y = (this.mt[kk] & 0x80000000) | (this.mt[kk + 1] & 0x7fffffff);
                this.mt[kk] = this.mt[kk - 227] ^ (y >>> 1) ^ mag01[y & 1];
            }
            const y = (this.mt[623] & 0x80000000) | (this.mt[0] & 0x7fffffff);
            this.mt[623] = this.mt[396] ^ (y >>> 1) ^ mag01[y & 1];
            this.index = 0;
        }
        let y = this.mt[this.index++];
        y ^= (y >>> 11);
        y ^= (y << 7) & 0x9d2c5680;
        y ^= (y << 15) & 0xefc60000;
        y ^= (y >>> 18);
        return y >>> 0;
    }
    random() {
        const a = this.genrand_int32() >>> 5;
        const b = this.genrand_int32() >>> 6;
        return (a * 67108864.0 + b) / 9007199254740992.0;
    }
    choices(population, weights) {
        let cum = [];
        let acc = 0;
        for (let w of weights) {
            acc += w;
            cum.push(acc);
        }
        const total = acc;
        const randVal = this.random() * total;
        let lo = 0, hi = cum.length;
        while (lo < hi) {
            const mid = (lo + hi) >> 1;
            if (randVal < cum[mid]) hi = mid;
            else lo = mid + 1;
        }
        return population[lo];
    }
}

// 上游 78 张标准塔罗牌（与 draw.py 100% 相同排序与定义）
const MAJORS = '愚者 魔术师 女祭司 女皇 皇帝 教皇 恋人 战车 力量 隐士 命运之轮 正义 倒吊人 死神 节制 恶魔 高塔 星星 月亮 太阳 审判 世界'.split(' ');
const SUITS = { '权杖': '火', '圣杯': '水', '宝剑': '风', '星币': '土' };
const RANKS = 'Ace 二 三 四 五 六 七 八 九 十 侍从 骑士 皇后 国王'.split(' ');
const MINORS = Object.keys(SUITS).flatMap((s) => RANKS.map((r) => `${s}${r}`));
const CARDS = [...MAJORS, ...MINORS];

const MAJOR_ELEMENT_LIST = '风 风 水 土 火 土 风 水 火 土 火 风 水 水 火 土 火 风 水 火 火 土'.split(' ');
const ELEMENTS = {};
MAJORS.forEach((m, idx) => ELEMENTS[m] = MAJOR_ELEMENT_LIST[idx]);
MINORS.forEach(c => ELEMENTS[c] = SUITS[c.slice(0, 2)]);

// 繁体中文映射（用于台湾本地化 UI 展示）
const SIMP_TO_TRAD = {
    '愚者': '愚者', '魔术师': '魔術師', '女祭司': '女祭司', '女皇': '女皇', '皇帝': '皇帝', '教皇': '教皇', '恋人': '戀人', '战车': '戰車',
    '力量': '力量', '隐士': '隱士', '命运之轮': '命運之輪', '正义': '正義', '倒吊人': '倒吊人', '死神': '死神', '节制': '節制', '恶魔': '惡魔',
    '高塔': '高塔', '星星': '星星', '月亮': '月亮', '太阳': '太陽', '审判': '審判', '世界': '世界',
    '权杖': '權杖', '圣杯': '聖杯', '宝剑': '寶劍', '星币': '星幣'
};

function toTradName(simpCard) {
    if (MAJORS.includes(simpCard)) return SIMP_TO_TRAD[simpCard] || simpCard;
    const suit = simpCard.slice(0, 2);
    const rank = simpCard.slice(2);
    const tradSuit = SIMP_TO_TRAD[suit] || suit;
    const tradRank = rank.replace('侍从', '侍從');
    return `${tradSuit}${tradRank}`;
}

const SPREADS = {
    single: { name: '單張牌', name_simp: '单张牌', raw: '当前指引,1,0', positions: ['當前指引'] },
    three: { name: '三牌陣', name_simp: '三牌阵', raw: '过去,0,0|现在,1,0|未来,0,1', positions: ['過去', '現在', '未來'] },
    diamond: { name: '五牌陣', name_simp: '五牌阵', raw: '核心,1,0|根源,0,0|阻力,0,0|潜力,0,0|建议,1,1', positions: ['核心', '根源', '阻力', '潛力', '建議'] },
    moon: { name: '月亮牌陣', name_simp: '月亮牌阵', raw: '新月,1,0|上弦,0,0|满月,1,0|下弦,0,0', positions: ['新月', '上弦', '滿月', '下弦'] },
    horseshoe: {
        name: '馬蹄形牌陣',
        name_simp: '马蹄形',
        raw: '远期过去,0,0|近期过去,0,0|当前,1,0|近期未来,0,0|外部影响,1,0|建议,0,1|结果,1,1',
        positions: ['遠期過去', '近期過去', '當前', '近期未來', '外部影響', '建議', '結果']
    },
    celtic: {
        name: '凱爾特十字牌陣',
        name_simp: '凯尔特十字',
        raw: '核心,1,0|交叉,0,0|意识目标,0,0|根基过去,0,0|近期过去,1,0|近期未来,0,0|自我,0,0|环境,0,0|希望与恐惧,0,0|结果,1,1',
        positions: ['核心', '交叉', '意識目標', '根基過去', '近期過去', '近期未來', '自我', '環境', '希望與恐懼', '結果']
    }
};

const TIME_FACTORS = {
    morning: { name: '晨間 (火/風能量加持)', suits: ['火', '风', '風'] },
    afternoon: { name: '午後 (水/土能量加持)', suits: ['水', '土'] },
    night: { name: '夜間 (大阿卡納深層潛意識加持)', suits: ['major'] }
};

function getTimeFactor(hour = null) {
    const h = hour !== null ? hour : new Date().getHours();
    if (h >= 6 && h < 12) return 'morning';
    if (h >= 12 && h < 18) return 'afternoon';
    return 'night';
}

function makeSeed(question = '') {
    const data = crypto.randomBytes(32).toString('hex') + Date.now().toString() + question;
    const hash = crypto.createHash('sha256').update(data).digest('hex');
    return parseInt(hash.slice(0, 12), 16);
}

function weight(card, key, boosted) {
    const major = MAJORS.includes(card);
    const base = Number(key) * major ? (60 / 28) : 1.0;
    const hit = (boosted.includes('major') && major) || boosted.includes(ELEMENTS[card]);
    return base * (hit ? 1.08 : 1.0);
}

function analyzeCardRelations(cards) {
    const total = cards.length;
    const majorCount = cards.filter((c) => c.is_major || c.isMajor).length;
    const majorRatio = Math.round((majorCount / total) * 100);

    let majorTheme = '日常主導（行動與個人選擇是關鍵推進力量）';
    if (majorRatio >= 50) majorTheme = '重大轉折（命中主題突出，面臨關鍵轉型節點）';

    const elementCounts = { 火: 0, 水: 0, 風: 0, 土: 0 };
    cards.forEach((c) => {
        if (elementCounts[c.element] !== undefined) elementCounts[c.element] += 1;
    });

    const dominantElements = Object.entries(elementCounts)
        .filter(([, count]) => count >= 2)
        .map(([elem]) => elem);

    const missingElements = Object.entries(elementCounts)
        .filter(([, count]) => count === 0)
        .map(([elem]) => elem);

    return {
        majorCount,
        majorRatio: `${majorRatio}%`,
        majorTheme,
        elementCounts,
        dominantElements: dominantElements.length > 0 ? dominantElements.join('、') : '均勻分佈',
        missingElements: missingElements.length > 0 ? missingElements.join('、') : '無缺項'
    };
}

function drawCards(input = {}) {
    const spreadKey = typeof input === 'string' ? input : (input.spread || 'three');
    const question = (typeof input === 'object' && input.question) || '';
    const variant = (typeof input === 'object' && input.variant) || null;
    const finalFactor = (typeof input === 'object' && (input.time_factor || input.timeFactor)) || getTimeFactor();
    const displaySeed = (typeof input === 'object' && input.seed !== undefined && input.seed !== null && input.seed !== '')
        ? input.seed
        : makeSeed(question);

    let numericSeed = 12345;
    if (typeof displaySeed === 'number') {
        numericSeed = displaySeed;
    } else if (typeof displaySeed === 'string') {
        if (/^\d+$/.test(displaySeed)) {
            numericSeed = parseInt(displaySeed, 10);
        } else {
            const h = crypto.createHash('sha256').update(displaySeed).digest('hex');
            numericSeed = parseInt(h.slice(0, 8), 16);
        }
    }

    const spreadConfig = SPREADS[spreadKey] || SPREADS['three'];
    let raw = spreadConfig.raw;

    if (spreadKey === 'three' && variant === 'relationship') {
        raw = '我的状态,1,0|对方的状态,1,0|双方的关系走向,1,1';
    } else if (spreadKey === 'three' && (variant === 'decision' || variant === 'choice')) {
        raw = '当前面临的情境,1,0|可采取的行动方案,0,0|预期的后续结果,1,1';
    } else if (spreadKey === 'three' && (variant === 'situation' || variant === 'state')) {
        raw = '当前处境,1,0|核心阻碍,0,0|突破建议,1,1';
    }

    const rng = new PythonRandom(numericSeed);
    const pool = [...CARDS];
    const boosted = TIME_FACTORS[finalFactor]?.suits || ['major'];
    const cards = [];

    for (const item of raw.split('|')) {
        const [name, key, upright] = item.split(',');
        const weights = pool.map((c) => weight(c, key, boosted));
        const picked = rng.choices(pool, weights);
        pool.splice(pool.indexOf(picked), 1);

        const isUpright = rng.random() < (Number(upright) ? 0.7 : 0.6);
        const orientation = isUpright ? '正位' : '逆位';
        const isMajor = MAJORS.includes(picked);
        const element = ELEMENTS[picked] || '火';
        const tradCard = toTradName(picked);
        const suit = isMajor ? '大阿爾克那' : tradCard.slice(0, 2);

        cards.push({
            position: name,
            pos: name,
            card: picked,
            card_tw: tradCard,
            name: tradCard,
            orientation,
            is_major: isMajor,
            isMajor,
            element,
            suit,
            summary: `${tradCard}（${orientation}，屬${element}）`
        });
    }

    const relations = analyzeCardRelations(cards);

    return {
        seed: displaySeed,
        spread: spreadKey,
        spread_name: spreadConfig.name_simp,
        spreadName: spreadConfig.name,
        question: question || '請給予我當前最清晰的心靈與行動指引',
        time_factor: finalFactor,
        timeFactor: TIME_FACTORS[finalFactor]?.name || finalFactor,
        cards,
        deckSize: CARDS.length,
        relations,
        summary: `【${spreadConfig.name}】開出 ${cards.length} 張牌。大阿卡納佔比 ${relations.majorRatio}（${relations.majorTheme}）。元素主導：${relations.dominantElements}。`
    };
}

module.exports = {
    FULL_DECK: CARDS,
    MAJORS,
    SUITS,
    RANKS,
    SPREADS,
    TIME_FACTORS,
    drawCards,
    makeSeed,
    getTimeFactor
};
