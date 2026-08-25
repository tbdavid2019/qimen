const crypto = require('crypto');

const MAJORS = '愚者 魔術師 女祭司 皇后 皇帝 教皇 戀人 戰車 力量 隱者 命運之輪 正義 倒吊人 死神 節制 惡魔 高塔 星星 月亮 太陽 審判 世界'.split(' ');
const SUITS = ['權杖', '聖杯', '寶劍', '錢幣'];
const RANKS = '王牌 二 三 四 五 六 七 八 九 十 侍從 騎士 皇后 國王'.split(' ');
const MINORS = SUITS.flatMap((suit) => RANKS.map((rank) => `${suit}${rank}`));
const DECK = [...MAJORS, ...MINORS];

const SPREADS = {
    single: ['當前指引'],
    three: ['過去', '現在', '未來'],
    diamond: ['核心', '根源', '阻力', '潛力', '建議'],
    moon: ['新月', '上弦', '滿月', '下弦'],
    horseshoe: ['遠期過去', '近期過去', '當前', '近期未來', '外部影響', '建議', '結果'],
    celtic: ['核心', '交叉', '意識目標', '根基過去', '近期過去', '近期未來', '自我', '環境', '希望與恐懼', '結果']
};

function seededNumber(seed, index) {
    return crypto.createHash('sha256').update(`${seed}:${index}`).digest().readUInt32BE(0) / 0x100000000;
}

function drawCards({ spread = 'three', question = '', seed } = {}) {
    if (!SPREADS[spread]) throw new Error('不支援的塔羅牌陣');
    const finalSeed = seed || crypto.randomBytes(32).toString('hex');
    const pool = [...DECK];
    const cards = SPREADS[spread].map((position, index) => {
        const pick = Math.floor(seededNumber(finalSeed, index) * pool.length);
        const name = pool.splice(pick, 1)[0];
        return { position, name, orientation: seededNumber(finalSeed, index + 100) < 0.7 ? '正位' : '逆位', isMajor: MAJORS.includes(name) };
    });
    return { seed: finalSeed, question, spread, spreadName: spread, cards, deckSize: DECK.length };
}

module.exports = { DECK, SPREADS, drawCards };
