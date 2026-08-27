const crypto = require('crypto');

const MAJORS = [
    '愚者', '魔術師', '女祭司', '皇后', '皇帝', '教皇', '戀人', '戰車',
    '力量', '隱者', '命運之輪', '正義', '倒吊人', '死神', '節制', '惡魔',
    '高塔', '星星', '月亮', '太陽', '審判', '世界'
];

const MAJOR_ELEMENTS = {
    愚者: '風', 魔術師: '風', 女祭司: '水', 皇后: '土', 皇帝: '火', 教皇: '土', 戀人: '風', 戰車: '水',
    力量: '火', 隱者: '土', 命運之輪: '火', 正義: '風', 倒吊人: '水', 死神: '水', 節制: '火', 惡魔: '土',
    高塔: '火', 星星: '風', 月亮: '水', 太陽: '火', 審判: '火', 世界: '土'
};

const SUITS = {
    權杖: { element: '火', theme: '行動、創造、意志與熱情' },
    聖杯: { element: '水', theme: '情感、關係、直覺與人際' },
    寶劍: { element: '風', theme: '思維、理性、決策與挑戰' },
    錢幣: { element: '土', theme: '物質、財務、身體與事業' }
};

const RANKS = ['Ace', '二', '三', '四', '五', '六', '七', '八', '九', '十', '侍從', '騎士', '皇后', '國王'];

const MINORS = Object.keys(SUITS).flatMap((suit) => RANKS.map((rank) => `${suit}${rank}`));
const FULL_DECK = [...MAJORS, ...MINORS];

const SPREADS = {
    single: {
        name: '單張指引牌',
        positions: ['當前核心指引']
    },
    three: {
        name: '三牌陣 (時間線 / 關係 / 選擇)',
        positions: ['過去 (起因)', '現在 (現狀)', '未來 (趨勢)']
    },
    diamond: {
        name: '五牌陣 (鑽石展開)',
        positions: ['核心現狀', '潛在根源', '主要阻力', '突破潛力', '行動建議']
    },
    moon: {
        name: '月亮週期牌陣',
        positions: ['新月 (意圖)', '上弦月 (行動)', '滿月 (覺察)', '下弦月 (釋放)']
    },
    horseshoe: {
        name: '七星馬蹄形牌陣',
        positions: ['遠期過去', '近期過去', '當前焦點', '近期未來', '周圍環境/外部影響', '具體建議', '最終結果']
    },
    celtic: {
        name: '凱爾特十字牌陣 (十牌深度)',
        positions: ['核心現狀', '交叉障礙', '意識目標', '潛意識根基', '過去影響', '未來走向', '自我態度', '環境影響', '希望與恐懼', '最終結果']
    }
};

const TIME_FACTORS = {
    morning: { name: '晨間 (火/風能量加持)', suits: ['權杖', '寶劍'] },
    afternoon: { name: '午後 (水/土能量加持)', suits: ['聖杯', '錢幣'] },
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

function getTimeFactor() {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    return 'night';
}

function seededRandom(seed, index) {
    const hash = crypto.createHash('sha256').update(`${seed}:${index}`).digest();
    return hash.readUInt32BE(0) / 0x100000000;
}

function analyzeCardRelations(cards) {
    const total = cards.length;
    const majorCount = cards.filter((c) => c.isMajor).length;
    const majorRatio = Math.round((majorCount / total) * 100);

    let majorTheme = '日常主導（行動與個人選擇是關鍵推進力量）';
    if (majorRatio >= 50) majorTheme = '重大轉折（命中主題突出，面臨關鍵轉型節點）';
    else if (majorRatio >= 30) majorTheme = '命運與選擇並存（既有宏觀轉機，亦需微觀積極抉擇）';

    // 元素分佈
    const elementCounts = { 火: 0, 水: 0, 風: 0, 土: 0 };
    cards.forEach((c) => {
        const el = c.element || '火';
        elementCounts[el] = (elementCounts[el] || 0) + 1;
    });

    const dominantElements = Object.entries(elementCounts)
        .filter(([_, count]) => count >= 2)
        .map(([el, _]) => el);

    const missingElements = Object.entries(elementCounts)
        .filter(([_, count]) => count === 0)
        .map(([el, _]) => el);

    // 經典組合匹配
    const cardNames = new Set(cards.map((c) => c.name));
    const matchedCombos = [];
    CLASSIC_COMBOS.forEach((combo) => {
        if (cardNames.has(combo.pair[0]) && cardNames.has(combo.pair[1])) {
            matchedCombos.push(`【${combo.pair[0]} + ${combo.pair[1]}】${combo.meaning}`);
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

function drawCards({ spread = 'three', question = '', seed = null, variant = null } = {}) {
    const spreadConfig = SPREADS[spread] || SPREADS['three'];
    const timeFactor = getTimeFactor();
    const finalSeed = seed || crypto.randomBytes(16).toString('hex');

    let positions = [...spreadConfig.positions];
    if (spread === 'three' && variant === 'relationship') {
        positions = ['我的狀態', '對方的狀態', '雙方的關係走向'];
    } else if (spread === 'three' && variant === 'decision') {
        positions = ['當前面臨的情境', '可採取的行動方案', '預期的後續結果'];
    }

    const pool = [...FULL_DECK];
    const cards = positions.map((pos, index) => {
        const pickIndex = Math.floor(seededRandom(finalSeed, index) * pool.length);
        const cardName = pool.splice(pickIndex, 1)[0];
        const isMajor = MAJORS.includes(cardName);
        const isUpright = seededRandom(finalSeed, index + 200) < 0.65;
        const orientation = isUpright ? '正位' : '逆位';

        let element = '火';
        let suit = '大阿爾克那';
        if (isMajor) {
            element = MAJOR_ELEMENTS[cardName] || '火';
        } else {
            const suitPrefix = cardName.slice(0, 2);
            suit = suitPrefix;
            element = SUITS[suitPrefix]?.element || '火';
        }

        return {
            position: pos,
            name: cardName,
            orientation,
            isMajor,
            element,
            suit,
            summary: `${cardName}（${orientation}，屬${element}）`
        };
    });

    const relations = analyzeCardRelations(cards);

    return {
        seed: finalSeed,
        timeFactor: TIME_FACTORS[timeFactor].name,
        question: question || '請給予我當前最清晰的心靈與行動指引',
        spread,
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
    drawCards
};
