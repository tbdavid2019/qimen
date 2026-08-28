const { Solar, Lunar } = require('lunar-javascript');

const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

const YANG_STEMS = new Set(['甲', '丙', '戊', '庚', '壬']);
const YANG_BRANCHES = new Set(['子', '寅', '辰', '午', '申', '戌']);

const PALACE_NAMES = [
    '命宮', '兄弟宮', '夫妻宮', '子女宮', '財帛宮', '疾厄宮',
    '遷移宮', '僕役宮', '官祿宮', '田宅宮', '福德宮', '父母宮'
];

const NAYIN_TABLE = {
    '甲子': '海中金', '乙丑': '海中金', '丙寅': '爐中火', '丁卯': '爐中火', '戊辰': '大林木', '己巳': '大林木',
    '庚午': '路旁土', '辛未': '路旁土', '壬申': '劍鋒金', '癸酉': '劍鋒金', '甲戌': '山頭火', '乙亥': '山頭火',
    '丙子': '澗下水', '丁丑': '澗下水', '戊寅': '城牆土', '己卯': '城牆土', '庚辰': '白蠟金', '辛巳': '白蠟金',
    '壬午': '楊柳木', '癸未': '楊柳木', '甲申': '泉中水', '乙酉': '泉中水', '丙戌': '屋上土', '丁亥': '屋上土',
    '戊子': '霹靂火', '己丑': '霹靂火', '庚寅': '松柏木', '辛卯': '松柏木', '壬辰': '長流水', '癸巳': '長流水',
    '甲午': '砂石金', '乙未': '砂石金', '丙申': '山下火', '丁酉': '山下火', '戊戌': '平地木', '己亥': '平地木',
    '庚子': '壁上土', '辛丑': '壁上土', '壬寅': '金箔金', '癸卯': '金箔金', '甲辰': '覆燈火', '乙巳': '覆燈火',
    '丙午': '天河水', '丁未': '天河水', '戊申': '大驛土', '己酉': '大驛土', '庚戌': '釵釧金', '辛亥': '釵釧金',
    '壬子': '桑柘木', '癸丑': '桑柘木', '甲寅': '大溪水', '乙卯': '大溪水', '丙辰': '沙中土', '丁巳': '沙中土',
    '戊午': '天上火', '己未': '天上火', '庚申': '石榴木', '辛酉': '石榴木', '壬戌': '大海水', '癸亥': '大海水'
};

const BUREAU_NAMES = {
    水: { name: '水二局', number: 2 },
    木: { name: '木三局', number: 3 },
    金: { name: '金四局', number: 4 },
    土: { name: '土五局', number: 5 },
    火: { name: '火六局', number: 6 }
};

// 十四主星廟旺平陷表 (對應地支 0:子, 1:丑, 2:寅, 3:卯, 4:辰, 5:巳, 6:午, 7:未, 8:申, 9:酉, 10:戌, 11:亥)
const STAR_BRIGHTNESS = {
    紫微: ['平', '廟', '廟', '旺', '得', '旺', '廟', '廟', '得', '旺', '得', '平'],
    天機: ['廟', '陷', '得', '旺', '利', '平', '廟', '陷', '得', '旺', '利', '平'],
    太陽: ['陷', '不', '旺', '廟', '旺', '旺', '廟', '得', '得', '平', '不', '陷'],
    武曲: ['旺', '廟', '得', '利', '廟', '平', '旺', '廟', '得', '利', '廟', '平'],
    天同: ['旺', '不', '利', '平', '平', '廟', '陷', '不', '旺', '平', '平', '廟'],
    廉貞: ['平', '利', '廟', '平', '旺', '陷', '平', '利', '廟', '平', '旺', '陷'],
    天府: ['廟', '廟', '廟', '得', '廟', '得', '旺', '廟', '得', '旺', '廟', '得'],
    太陰: ['廟', '廟', '不', '陷', '陷', '陷', '陷', '不', '得', '旺', '旺', '廟'],
    貪狼: ['旺', '廟', '平', '利', '廟', '陷', '旺', '廟', '平', '利', '廟', '陷'],
    巨門: ['廟', '不', '廟', '廟', '陷', '平', '廟', '不', '廟', '廟', '陷', '旺'],
    天相: ['廟', '廟', '廟', '陷', '得', '得', '廟', '得', '廟', '陷', '得', '得'],
    天梁: ['廟', '旺', '廟', '廟', '旺', '陷', '廟', '旺', '陷', '得', '廟', '陷'],
    七殺: ['旺', '廟', '廟', '平', '廟', '平', '旺', '廟', '廟', '平', '廟', '平'],
    破軍: ['廟', '旺', '得', '陷', '旺', '平', '廟', '旺', '得', '陷', '旺', '平']
};

const SIHUA_TABLE = {
    甲: { 祿: '廉貞', 權: '破軍', 科: '武曲', 忌: '太陽' },
    乙: { 祿: '天機', 權: '天梁', 科: '紫微', 忌: '太陰' },
    丙: { 祿: '天同', 權: '天機', 科: '文昌', 忌: '廉貞' },
    丁: { 祿: '太陰', 權: '天同', 科: '天機', 忌: '巨門' },
    戊: { 祿: '貪狼', 權: '太陰', 科: '右弼', 忌: '天機' },
    己: { 祿: '武曲', 權: '貪狼', 科: '天梁', 忌: '文曲' },
    庚: { 祿: '太陽', 權: '武曲', 科: '太陰', 忌: '天同' },
    辛: { 祿: '巨門', 權: '太陽', 科: '文曲', 忌: '文昌' },
    壬: { 祿: '天梁', 權: '紫微', 科: '左輔', 忌: '武曲' },
    癸: { 祿: '破軍', 權: '巨門', 科: '太陰', 忌: '貪狼' }
};

const MINGZHU_TABLE = {
    子: '貪狼', 丑: '巨門', 寅: '祿存', 卯: '文曲', 辰: '廉貞', 巳: '武曲',
    午: '破軍', 未: '武曲', 申: '廉貞', 酉: '文曲', 戌: '祿存', 亥: '巨門'
};

const SHENZHU_TABLE = {
    子: '火星', 丑: '天相', 寅: '天梁', 卯: '天同', 辰: '文昌', 巳: '天機',
    午: '火星', 未: '天相', 申: '天梁', 酉: '天同', 戌: '文昌', 亥: '天機'
};

const SHICHEN_HOURS = { 子: 0, 丑: 2, 寅: 4, 卯: 6, 辰: 8, 巳: 10, 午: 12, 未: 14, 申: 16, 酉: 18, 戌: 20, 亥: 22 };

// 安紫微星演算法 (標準安紫微星訣)
function calcZiweiBranch(bureauNum, lunarDay) {
    const q = Math.ceil(lunarDay / bureauNum);
    const r = q * bureauNum - lunarDay;
    const base = (2 + q - 1) % 12; // 寅宮起1 (寅宮index=2)
    if (r === 0) return base;
    if (r % 2 === 1) {
        return (base - r + 120) % 12;
    }
    return (base + r) % 12;
}

// 根據生年干起寅首天干
function getYearYinStem(yearStem) {
    const stemMap = { 甲: '丙', 己: '丙', 乙: '戊', 庚: '戊', 丙: '庚', 辛: '庚', 丁: '壬', 壬: '壬', 戊: '甲', 癸: '甲' };
    return stemMap[yearStem] || '丙';
}

function getFiveBureau(mingStem, mingBranch) {
    const stem = typeof mingStem === 'number' ? STEMS[mingStem] : mingStem;
    const branch = typeof mingBranch === 'number' ? BRANCHES[mingBranch] : mingBranch;
    const ganzhi = `${stem}${branch}`;
    const nayin = NAYIN_TABLE[ganzhi] || '海中金';
    const nayinElement = nayin.slice(-1);
    return BUREAU_NAMES[nayinElement] || BUREAU_NAMES['金'];
}

function parseInputDate(input) {
    if (!input?.date) throw new Error('請提供出生日期 (格式: YYYY-MM-DD)');
    const [year, month, day] = input.date.split('-').map(Number);
    if (!year || !month || !day) throw new Error('出生日期格式無效');

    let hour = 12;
    let minute = 0;
    if (input.time) {
        const parts = input.time.split(':').map(Number);
        hour = parts[0] || 0;
        minute = parts[1] || 0;
    } else if (input.shichen && SHICHEN_HOURS[input.shichen] !== undefined) {
        hour = SHICHEN_HOURS[input.shichen];
    }

    let lunar;
    if (input.calendar === 'lunar') {
        const lunarMonth = input.leap ? -month : month;
        lunar = Lunar.fromYmdHms(year, lunarMonth, day, hour, minute, 0);
    } else {
        const solar = Solar.fromYmdHms(year, month, day, hour, minute, 0);
        lunar = solar.getLunar();
    }

    return { lunar, hour, minute };
}

// 計算紫微斗數全盤
function calculateZiweiChart(input) {
    const { lunar, hour, minute } = parseInputDate(input);
    const sex = input.sex === '女' ? '女' : '男';

    const lunarYear = lunar.getYear();
    const lunarMonth = Math.abs(lunar.getMonth());
    const lunarDay = lunar.getDay();
    const isLeap = lunar.getMonth() < 0;

    const yearGanZhi = lunar.getYearInGanZhi();
    const monthGanZhi = lunar.getMonthInGanZhi();
    const dayGanZhi = lunar.getDayInGanZhi();
    const timeGanZhi = lunar.getTimeInGanZhi();

    const yearStem = yearGanZhi[0];
    const yearBranch = yearGanZhi[1];
    const hourBranch = timeGanZhi[1];

    const yearBranchIndex = BRANCHES.indexOf(yearBranch);
    const hourBranchIndex = BRANCHES.indexOf(hourBranch);

    // 1. 定命宮與身宮
    // 寅宮起正月順數至生月，再逆數至生時定命宮
    const monthStartBranchIndex = (2 + lunarMonth - 1) % 12;
    const mingBranchIndex = (monthStartBranchIndex - hourBranchIndex + 120) % 12;
    const shenBranchIndex = (monthStartBranchIndex + hourBranchIndex) % 12;

    // 2. 起寅首天干，排出十二地支對應的天干
    const yinStem = getYearYinStem(yearStem);
    const yinStemIndex = STEMS.indexOf(yinStem);

    const palaceStems = {}; // 地支 -> 天干
    for (let i = 0; i < 12; i++) {
        const branchIndex = (2 + i) % 12; // 從寅開始
        const stemIndex = (yinStemIndex + i) % 10;
        palaceStems[BRANCHES[branchIndex]] = STEMS[stemIndex];
    }

    // 3. 定五行局 (命宮天干 + 命宮地支 的納音)
    const mingBranch = BRANCHES[mingBranchIndex];
    const mingStem = palaceStems[mingBranch];
    const mingGanzhi = `${mingStem}${mingBranch}`;
    const nayin = NAYIN_TABLE[mingGanzhi] || '海中金';
    const nayinElement = nayin.slice(-1); // 金、木、水、火、土
    const bureau = BUREAU_NAMES[nayinElement] || BUREAU_NAMES['金'];

    // 4. 安紫微星與天府星
    const ziweiBranchIndex = calcZiweiBranch(bureau.number, lunarDay);
    const tianfuBranchIndex = (4 - ziweiBranchIndex + 12) % 12;

    // 5. 安十四主星
    const palaceStars = Array.from({ length: 12 }, () => []);

    // 紫微星系
    const ziweiSystem = [
        { name: '紫微', offset: 0 },
        { name: '天機', offset: -1 },
        { name: '太陽', offset: -3 },
        { name: '武曲', offset: -4 },
        { name: '天同', offset: -5 },
        { name: '廉貞', offset: -8 }
    ];
    ziweiSystem.forEach((star) => {
        const bIdx = (ziweiBranchIndex + star.offset + 120) % 12;
        const brightness = STAR_BRIGHTNESS[star.name][bIdx];
        palaceStars[bIdx].push({ name: star.name, type: 'major', brightness });
    });

    // 天府星系
    const tianfuSystem = [
        { name: '天府', offset: 0 },
        { name: '太陰', offset: 1 },
        { name: '貪狼', offset: 2 },
        { name: '巨門', offset: 3 },
        { name: '天相', offset: 4 },
        { name: '天梁', offset: 5 },
        { name: '七殺', offset: 6 },
        { name: '破軍', offset: 10 }
    ];
    tianfuSystem.forEach((star) => {
        const bIdx = (tianfuBranchIndex + star.offset) % 12;
        const brightness = STAR_BRIGHTNESS[star.name][bIdx];
        palaceStars[bIdx].push({ name: star.name, type: 'major', brightness });
    });

    // 6. 安六吉星
    // 文昌 (戌逆時)、文曲 (辰順時)
    const wenchangBranchIdx = (10 - hourBranchIndex + 120) % 12;
    const wenquBranchIdx = (4 + hourBranchIndex) % 12;
    palaceStars[wenchangBranchIdx].push({ name: '文昌', type: 'lucky' });
    palaceStars[wenquBranchIdx].push({ name: '文曲', type: 'lucky' });

    // 左輔 (辰順月)、右弼 (戌逆月)
    const zuofuBranchIdx = (4 + (lunarMonth - 1)) % 12;
    const youbiBranchIdx = (10 - (lunarMonth - 1) + 120) % 12;
    palaceStars[zuofuBranchIdx].push({ name: '左輔', type: 'lucky' });
    palaceStars[youbiBranchIdx].push({ name: '右弼', type: 'lucky' });

    // 天魁、天鉞
    const kuiYueMap = {
        甲: { kui: '丑', yue: '未' }, 戊: { kui: '丑', yue: '未' }, 庚: { kui: '丑', yue: '未' },
        乙: { kui: '子', yue: '申' }, 己: { kui: '子', yue: '申' },
        丙: { kui: '亥', yue: '酉' }, 丁: { kui: '酉', yue: '亥' },
        辛: { kui: '午', yue: '寅' }, 壬: { kui: '卯', yue: '巳' }, 癸: { kui: '卯', yue: '巳' }
    };
    const ky = kuiYueMap[yearStem] || { kui: '丑', yue: '未' };
    palaceStars[BRANCHES.indexOf(ky.kui)].push({ name: '天魁', type: 'lucky' });
    palaceStars[BRANCHES.indexOf(ky.yue)].push({ name: '天鉞', type: 'lucky' });

    // 7. 安六煞星與祿存
    const lucunMap = { 甲: '寅', 乙: '卯', 丙: '巳', 戊: '巳', 丁: '午', 己: '午', 庚: '申', 辛: '酉', 壬: '亥', 癸: '子' };
    const lucunBranch = lucunMap[yearStem] || '寅';
    const lucunIdx = BRANCHES.indexOf(lucunBranch);
    palaceStars[lucunIdx].push({ name: '祿存', type: 'lucky' });

    // 擎羊 (祿前一)、陀羅 (祿後一)
    const qingyangIdx = (lucunIdx + 1) % 12;
    const tuoluoIdx = (lucunIdx - 1 + 12) % 12;
    palaceStars[qingyangIdx].push({ name: '擎羊', type: 'bad' });
    palaceStars[tuoluoIdx].push({ name: '陀羅', type: 'bad' });

    // 火星、鈴星
    const fireOrigin = {
        寅: { huo: '丑', ling: '卯' }, 午: { huo: '丑', ling: '卯' }, 戌: { huo: '丑', ling: '卯' },
        申: { huo: '寅', ling: '戌' }, 子: { huo: '寅', ling: '戌' }, 辰: { huo: '寅', ling: '戌' },
        巳: { huo: '卯', ling: '戌' }, 酉: { huo: '卯', ling: '戌' }, 丑: { huo: '卯', ling: '戌' },
        亥: { huo: '酉', ling: '戌' }, 卯: { huo: '酉', ling: '戌' }, 未: { huo: '酉', ling: '戌' }
    }[yearBranch] || { huo: '丑', ling: '卯' };

    const huoIdx = (BRANCHES.indexOf(fireOrigin.huo) + hourBranchIndex) % 12;
    const lingIdx = (BRANCHES.indexOf(fireOrigin.ling) + hourBranchIndex) % 12;
    palaceStars[huoIdx].push({ name: '火星', type: 'bad' });
    palaceStars[lingIdx].push({ name: '鈴星', type: 'bad' });

    // 地空 (亥逆時)、地劫 (亥順時)
    const dikongIdx = (11 - hourBranchIndex + 120) % 12;
    const dijieIdx = (11 + hourBranchIndex) % 12;
    palaceStars[dikongIdx].push({ name: '地空', type: 'bad' });
    palaceStars[dijieIdx].push({ name: '地劫', type: 'bad' });

    // 天馬
    const tianmaBranch = { 寅: '申', 午: '申', 戌: '申', 申: '寅', 子: '寅', 辰: '寅', 巳: '亥', 酉: '亥', 丑: '亥', 亥: '巳', 卯: '巳', 未: '巳' }[yearBranch] || '申';
    palaceStars[BRANCHES.indexOf(tianmaBranch)].push({ name: '天馬', type: 'aux' });

    // 紅鸞 (卯逆年支)、天喜 (紅鸞對宮)
    const hongluanIdx = (3 - yearBranchIndex + 120) % 12;
    const tianxiIdx = (hongluanIdx + 6) % 12;
    palaceStars[hongluanIdx].push({ name: '紅鸞', type: 'peach' });
    palaceStars[tianxiIdx].push({ name: '天喜', type: 'peach' });

    // 8. 生年四化
    const sihua = SIHUA_TABLE[yearStem] || SIHUA_TABLE['甲'];

    // 9. 大限順逆
    // 陽男陰女順行，陰男陽女逆行
    const isYangYear = YANG_STEMS.has(yearStem);
    const isShun = (isYangYear && sex === '男') || (!isYangYear && sex === '女');

    // 10. 組裝十二宮結構
    // 命宮在地支 mingBranchIndex，十二宮逆時針排列（地支依序逆退）
    const palaces = [];
    for (let i = 0; i < 12; i++) {
        const palaceName = PALACE_NAMES[i];
        const bIdx = (mingBranchIndex - i + 120) % 12;
        const branch = BRANCHES[bIdx];
        const stem = palaceStems[branch];

        // 大限年齡區間
        const step = isShun ? i : (12 - i) % 12;
        const dayunStart = bureau.number + step * 10;
        const dayunEnd = dayunStart + 9;

        // 三方四正地支
        const oppositeBIdx = (bIdx + 6) % 12;
        const sanhe1BIdx = (bIdx + 4) % 12;
        const sanhe2BIdx = (bIdx + 8) % 12;

        const stars = palaceStars[bIdx].map((s) => {
            let sh = null;
            if (sihua.祿 === s.name) sh = '祿';
            else if (sihua.權 === s.name) sh = '權';
            else if (sihua.科 === s.name) sh = '科';
            else if (sihua.忌 === s.name) sh = '忌';
            return { ...s, sihua: sh };
        });

        palaces.push({
            index: i,
            name: palaceName,
            branch,
            stem,
            ganzhi: `${stem}${branch}`,
            isMing: i === 0,
            isShen: bIdx === shenBranchIndex,
            dayun: `${dayunStart}-${dayunEnd}`,
            stars,
            aspects: {
                opposite: BRANCHES[oppositeBIdx],
                trine: [BRANCHES[sanhe1BIdx], BRANCHES[sanhe2BIdx]],
                neighbors: [BRANCHES[(bIdx + 1) % 12], BRANCHES[(bIdx + 11) % 12]]
            }
        });
    }

    // 11. 格局檢測 (Patterns - 依據 patterns.md 完整 18 大經典格局)
    const mingPalace = palaces[0];
    const mingStarNames = new Set(mingPalace.stars.map((s) => s.name));
    const sanfangStars = new Set();
    const sanfangSihuas = new Set();

    [mingPalace.branch, mingPalace.aspects.opposite, ...mingPalace.aspects.trine].forEach((b) => {
        const p = palaces.find((x) => x.branch === b);
        if (p) {
            p.stars.forEach((s) => {
                sanfangStars.add(s.name);
                if (s.sihua) sanfangSihuas.add(s.sihua);
            });
        }
    });

    const parentPalace = palaces.find((p) => p.name === '父母宮') || palaces[11];
    const siblingPalace = palaces.find((p) => p.name === '兄弟宮') || palaces[1];
    const guanluPalace = palaces.find((p) => p.name === '官祿宮') || palaces[8];

    const parentStars = new Set(parentPalace?.stars?.map((s) => s.name) || []);
    const siblingStars = new Set(siblingPalace?.stars?.map((s) => s.name) || []);
    const guanluStars = new Set(guanluPalace?.stars?.map((s) => s.name) || []);

    const detectedPatterns = [];

    // 1. 紫府同宮
    if (mingStarNames.has('紫微') && mingStarNames.has('天府')) {
        detectedPatterns.push({ name: '紫府同宮格', type: '吉格', desc: '紫微與天府同守命宮，權柄、資源與穩定性兼具，衣祿豐足，具備領袖風範。' });
    }
    // 2. 紫殺同宮
    if (mingStarNames.has('紫微') && mingStarNames.has('七殺')) {
        detectedPatterns.push({ name: '紫殺同宮格', type: '吉格', desc: '紫微七殺同守命宮，魄力宏大，敢擔事，適合帶隊或開創局面。' });
    }
    // 3. 武府同宮
    if (mingStarNames.has('武曲') && mingStarNames.has('天府')) {
        detectedPatterns.push({ name: '武府同宮格', type: '吉格', desc: '武曲天府同守，理財、守成與資源管理能力強，穩健累積財富。' });
    }
    // 4. 日月並明
    if (sanfangStars.has('太陽') && sanfangStars.has('太陰')) {
        detectedPatterns.push({ name: '日月並明格', type: '吉格', desc: '太陽太陰同在較佳位置會照命宮，陰陽協調，名望與生活質量兼顧。' });
    }
    // 5. 日照雷門 (巨日同宮)
    if ((mingStarNames.has('巨門') && mingStarNames.has('太陽')) || (mingStarNames.has('太陽') && mingBranch === '卯')) {
        detectedPatterns.push({ name: '日照雷門格', type: '吉格', desc: '太陽驅散巨門之暗，口才、表達、傳播與公眾影響力突出。' });
    }
    // 6. 陽梁昌祿
    if (sanfangStars.has('太陽') && sanfangStars.has('天梁') && sanfangStars.has('文昌') && (sanfangStars.has('祿存') || sihua.lu === '太陽' || sihua.lu === '天梁')) {
        detectedPatterns.push({ name: '陽梁昌祿格', type: '大吉格', desc: '太陽、天梁、文昌、祿存會照，利於學術考運、公職仕途與名譽體系。' });
    }
    // 7. 機月同梁
    if (sanfangStars.has('天機') && sanfangStars.has('太陰') && sanfangStars.has('天同') && sanfangStars.has('天梁')) {
        detectedPatterns.push({ name: '機月同梁格', type: '吉格', desc: '天機、太陰、天同、天梁分佈於命宮三方四正，思維縝密，擅長企劃策劃與系統型發展。' });
    }
    // 8. 火貪格 / 鈴貪格
    if ((mingStarNames.has('貪狼') || sanfangStars.has('貪狼')) && (sanfangStars.has('火星') || sanfangStars.has('鈴星'))) {
        detectedPatterns.push({ name: '火貪格/鈴貪格', type: '吉格', desc: '貪狼與火星或鈴星會照同度，具爆發力與舞台感，機會來得快。' });
    }
    // 9. 祿馬交馳
    if (sanfangStars.has('祿存') && sanfangStars.has('天馬')) {
        detectedPatterns.push({ name: '祿馬交馳格', type: '吉格', desc: '祿存天馬同宮或會照，動中求財，因流動、出差或遠方開拓而得利。' });
    }
    // 10. 三奇加會
    if (sanfangSihuas.has('祿') && sanfangSihuas.has('權') && sanfangSihuas.has('科')) {
        detectedPatterns.push({ name: '三奇加會格', type: '大吉格', desc: '化祿、化權、化科集中於命宮三方四正，資源、執行與名聲同時發力。' });
    }
    // 11. 雙祿朝垣
    if (sanfangStars.has('祿存') && sanfangSihuas.has('祿')) {
        detectedPatterns.push({ name: '雙祿朝垣格', type: '吉格', desc: '祿存與化祿同時加會命宮三方四正，財祿條件佳，資源兌現力強。' });
    }
    // 12. 命無正曜
    if (mingPalace.stars.filter((s) => s.type === 'major').length === 0) {
        detectedPatterns.push({ name: '命無正曜格', type: '課題格', desc: '命宮無十四主星，更受對宮與三方四正牽引，隨和適應力強。' });
    }
    // 13. 羊陀夾命
    if ((parentStars.has('擎羊') && siblingStars.has('陀羅')) || (parentStars.has('陀羅') && siblingStars.has('擎羊'))) {
        detectedPatterns.push({ name: '羊陀夾命格', type: '課題格', desc: '擎羊陀羅分居命宮兩側夾制，雖有壓力阻滯感，但亦能激發強大執行力。' });
    }
    // 14. 空劫夾命
    if ((parentStars.has('地空') && siblingStars.has('地劫')) || (parentStars.has('地劫') && siblingStars.has('地空')) || (mingStarNames.has('地空') && mingStarNames.has('地劫'))) {
        detectedPatterns.push({ name: '空劫夾命格', type: '課題格', desc: '地空地劫夾命或坐命，思維跳脫，利於創意哲思與藝術精神探索。' });
    }
    // 15. 巨機化忌
    if ((mingStarNames.has('巨門') && sihua.ji === '巨門') || (mingStarNames.has('天機') && sihua.ji === '天機') || (guanluStars.has('巨門') && sihua.ji === '巨門') || (guanluStars.has('天機') && sihua.ji === '天機')) {
        detectedPatterns.push({ name: '巨機化忌格', type: '課題格', desc: '巨門或天機化忌臨命宮或官祿宮，想法多且思慮重，需注意溝通與專注。' });
    }
    // 16. 廉貞七殺
    if (mingStarNames.has('廉貞') && mingStarNames.has('七殺')) {
        detectedPatterns.push({ name: '廉貞七殺格', type: '開拓格', desc: '廉貞七殺同守命宮，進取心強，敢冒險拼搏，吉星相助則成大開創。' });
    }
    // 17. 刑忌夾印
    if (mingStarNames.has('天相') && (sanfangSihuas.has('忌') || parentStars.has('擎羊') || siblingStars.has('擎羊'))) {
        detectedPatterns.push({ name: '刑忌夾印格', type: '課題格', desc: '天相受煞忌夾制，事業與評價體系承壓，行事宜低調謹慎守規。' });
    }
    // 18. 殺破狼
    if (sanfangStars.has('七殺') && sanfangStars.has('破軍') && sanfangStars.has('貪狼')) {
        detectedPatterns.push({ name: '殺破狼格', type: '開拓格', desc: '七殺、破軍、貪狼在命宮三方四正成系統分佈，強變動強開創，不安於現狀。' });
    }

    // 命主與身主
    const mingzhu = MINGZHU_TABLE[mingBranch];
    const shenzhu = SHENZHU_TABLE[yearBranch];

    return {
        normalized_input: {
            date: input.date,
            time: input.time || `${hour}:${minute < 10 ? '0' + minute : minute}`,
            sex,
            calendar: input.calendar || 'solar',
            isLeap
        },
        lunar: {
            year: lunarYear,
            month: lunarMonth,
            day: lunarDay,
            isLeap,
            ganzhi: `${yearGanZhi}年 ${monthGanZhi}月 ${dayGanZhi}日 ${timeGanZhi}時`
        },
        bureau: bureau.name,
        bureauNumber: bureau.number,
        mingPalaceBranch: mingBranch,
        shenPalaceBranch: BRANCHES[shenBranchIndex],
        mingzhu,
        shenzhu,
        sihua: {
            yearStem,
            lu: sihua.祿,
            quan: sihua.權,
            ke: sihua.科,
            ji: sihua.忌
        },
        palaces,
        patterns: detectedPatterns,
        summary: `命宮位於【${mingBranch}宮】（${mingStem}${mingBranch} / ${bureau.name}），命主【${mingzhu}】，身主【${shenzhu}】。生年四化：${yearStem}干【${sihua.祿}化祿、${sihua.權}化權、${sihua.科}化科、${sihua.忌}化忌】。格局特徵：${detectedPatterns.map((p) => p.name).join('、') || '常規格局'}`
    };
}

module.exports = {
    calculateZiweiChart,
    getFiveBureau,
    calcZiweiBranch,
    STAR_BRIGHTNESS,
    SIHUA_TABLE,
    BUREAU_NAMES,
    PALACE_NAMES,
    STEMS,
    BRANCHES
};
