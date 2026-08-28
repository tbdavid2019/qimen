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

const MAJORS = [
    '愚者', '魔術師', '女祭司', '皇后', '皇帝', '教皇', '戀人', '戰車',
    '力量', '隱者', '命運之輪', '正義', '倒吊人', '死神', '節制', '惡魔',
    '高塔', '星星', '月亮', '太陽', '審判', '世界'
];

const SUITS = {
    權杖: { element: '火', theme: '行動、創造、意志與熱情' },
    聖杯: { element: '水', theme: '情感、關係、直覺與人際' },
    寶劍: { element: '風', theme: '思維、理性、決策與挑戰' },
    錢幣: { element: '土', theme: '物質、財務、身體與事業' }
};

const RANKS = ['Ace', '二', '三', '四', '五', '六', '七', '八', '九', '十', '侍從', '騎士', '皇后', '國王'];

const MINORS = Object.keys(SUITS).flatMap((suit) => RANKS.map((rank) => `${suit}${rank}`));
const FULL_DECK = [...MAJORS, ...MINORS];

const MAJOR_ELEMENT_LIST = '風 風 水 土 火 土 風 水 火 土 火 風 水 水 火 土 火 風 水 火 火 土'.split(' ');
const ELEMENTS = {};
MAJORS.forEach((m, idx) => ELEMENTS[m] = MAJOR_ELEMENT_LIST[idx]);
MINORS.forEach(c => ELEMENTS[c] = SUITS[c.slice(0, 2)]?.element || '火');

const SPREADS = {
    single: { name: '單張指引牌', raw: '當前核心指引,1,0', positions: ['當前核心指引'] },
    three: { name: '三牌陣 (時間線 / 關係 / 選擇)', raw: '過去,0,0|現在,1,0|未來,0,1', positions: ['過去 (起因)', '現在 (現狀)', '未來 (趨勢)'] },
    diamond: { name: '五牌陣 (鑽石展開)', raw: '核心現狀,1,0|潛在根源,0,0|主要阻力,0,0|突破潛力,0,0|行動建議,1,1', positions: ['核心現狀', '潛在根源', '主要阻力', '突破潛力', '行動建議'] },
    moon: { name: '月亮週期牌陣', raw: '新月 (意圖),1,0|上弦月 (行動),0,0|滿月 (覺察),1,0|下弦月 (釋放),0,0', positions: ['新月 (意圖)', '上弦月 (行動)', '滿月 (覺察)', '下弦月 (釋放)'] },
    horseshoe: {
        name: '七星馬蹄形牌陣',
        raw: '遠期過去,0,0|近期過去,0,0|當前焦點,1,0|近期未來,0,0|周圍環境/外部影響,1,0|具體建議,0,1|最終結果,1,1',
        positions: ['遠期過去', '近期過去', '當前焦點', '近期未來', '周圍環境/外部影響', '具體建議', '最終結果']
    },
    celtic: {
        name: '凱爾特十字牌陣 (十牌深度)',
        raw: '核心現狀,1,0|交叉障礙,0,0|意識目標,0,0|潛意識根基,0,0|過去影響,1,0|未來走向,0,0|自我態度,0,0|環境影響,0,0|希望與恐懼,0,0|最終結果,1,1',
        positions: ['核心現狀', '交叉障礙', '意識目標', '潛意識根基', '過去影響', '未來走向', '自我態度', '環境影響', '希望與恐懼', '最終結果']
    }
};

const TIME_FACTORS = {
    morning: { name: '晨間 (火/風能量加持)', suits: ['火', '風'] },
    afternoon: { name: '午後 (水/土能量加持)', suits: ['水', '土'] },
    night: { name: '夜間 (大阿卡納深層潛意識加持)', suits: ['major'] }
};

const CLASSIC_COMBOS = [
    { pair: ['死神', '星星'], meaning: '結束後的深層療癒與新生希望' },
    { pair: ['高塔', '星星'], meaning: '瓦解崩塌後的重建與真理閃現' },
    { pair: ['死神', '審判'], meaning: '方向的徹底重估與靈魂覺醒' },
    { pair: ['月亮', '太陽'], meaning: '穿透幻象、迎來真相與光明' },
    { pair: ['惡魔', '力量'], meaning: '正視並馴化內在陰影與執念' },
    { pair: ['女祭司', '魔術師'], meaning: '直覺洞察與外在行動的最佳校時與契合' },
    { pair: ['隱者', '戀人'], meaning: '在獨處與親密連結之間尋找智慧平衡' },
    { pair: ['皇帝', '命運之輪'], meaning: '控制欲正受到外在命運變革的考驗' },
    { pair: ['正義', '命運之輪'], meaning: '過往選擇所迎來的因果時機回響' },
    { pair: ['高塔', '寶劍十'], meaning: '舊有僵化結構的徹底終結，黎明即將到來' }
];

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
    const base = (60 / 28) * (Number(key) * major) || 1.0;
    const hit = (boosted.includes('major') && major) || (boosted.includes(ELEMENTS[card]));
    return base * (hit ? 1.08 : 1.0);
}

function analyzeCardRelations(cards) {
    const total = cards.length;
    const majorCount = cards.filter((c) => c.isMajor).length;
    const majorRatio = Math.round((majorCount / total) * 100);

    let majorTheme = '日常主導（行動與個人選擇是關鍵推進力量）';
    if (majorRatio >= 50) majorTheme = '重大轉折（命中主題突出，面臨關鍵轉型節點）';
    else if (majorRatio >= 30) majorTheme = '命運與選擇並存（既有宏觀轉機，亦需微觀積極抉擇）';

    const elementCounts = { 火: 0, 水: 0, 風: 0, 土: 0 };
    cards.forEach((c) => {
        const el = c.element || '火';
        elementCounts[el] = (elementCounts[el] || 0) + 1;
    });

    const dominantElements = Object.entries(elementCounts)
        .filter(([, count]) => count >= 2)
        .map(([el]) => el);

    const missingElements = Object.entries(elementCounts)
        .filter(([, count]) => count === 0)
        .map(([el]) => el);

    const cardNames = new Set(cards.map((c) => c.name));
    const matchedCombos = [];
    CLASSIC_COMBOS.forEach((combo) => {
        if (combo.pair.every((name) => cardNames.has(name))) {
            matchedCombos.push(`【${combo.pair.join(' + ')}】${combo.meaning}`);
        }
    });

    return {
        majorCount,
        majorRatio: `${majorRatio}%`,
        majorTheme,
        elementCounts,
        dominantElements: dominantElements.length > 0 ? dominantElements.join('、') : '均勻分佈',
        missingElements: missingElements.length > 0 ? missingElements.join('、') : '無缺項',
        matchedCombos: matchedCombos.length > 0 ? matchedCombos : ['各牌各自發揮獨立能量，依牌位依序推進']
    };
}

function drawCards(input = {}) {
    const spreadKey = input.spread || 'three';
    const question = input.question || '';
    const variant = input.variant || null;
    const finalFactor = input.time_factor || input.timeFactor || getTimeFactor();
    const displaySeed = input.seed !== undefined && input.seed !== null && input.seed !== '' 
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
        raw = '我的狀態,1,0|對方的狀態,1,0|雙方的關係走向,1,1';
    } else if (spreadKey === 'three' && (variant === 'decision' || variant === 'choice')) {
        raw = '當前面臨的情境,1,0|可採取的行動方案,0,0|預期的後續結果,1,1';
    } else if (spreadKey === 'three' && (variant === 'situation' || variant === 'state')) {
        raw = '當前處境,1,0|核心阻礙,0,0|突破建議,1,1';
    } else if (spreadKey === 'three' && (variant === 'timeline' || variant === 'time')) {
        raw = '過去 (起因),0,0|現在 (現狀),1,0|未來 (趨勢),0,1';
    }

    const rng = new PythonRandom(numericSeed);
    const pool = [...FULL_DECK];
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
        const suit = isMajor ? '大阿爾克那' : picked.slice(0, 2);

        cards.push({
            position: name,
            name: picked,
            orientation,
            isMajor,
            element,
            suit,
            summary: `${picked}（${orientation}，屬${element}）`
        });
    }

    const relations = analyzeCardRelations(cards);

    return {
        seed: displaySeed,
        timeFactor: TIME_FACTORS[finalFactor]?.name || finalFactor,
        time_factor: finalFactor,
        question: question || '請給予我當前最清晰的心靈與行動指引',
        spread: spreadKey,
        spreadName: spreadConfig.name,
        cards,
        deckSize: FULL_DECK.length,
        relations,
        summary: `【${spreadConfig.name}】開出 ${cards.length} 張牌。大阿卡納佔比 ${relations.majorRatio}（${relations.majorTheme}）。元素主導：${relations.dominantElements}。`
    };
}

module.exports = {
    FULL_DECK,
    MAJORS,
    SUITS,
    SPREADS,
    TIME_FACTORS,
    drawCards,
    PythonRandom
};
