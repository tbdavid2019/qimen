const { Solar, Lunar } = require('lunar-javascript');
const { calculateTrueSolarTime } = require('./solar-time');

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
    const rawDate = input?.date || input?.birthDate;
    if (!rawDate) throw new Error('請提供出生日期 (格式: YYYY-MM-DD)');
    const [year, month, day] = rawDate.split('-').map(Number);
    if (!year || !month || !day) throw new Error('出生日期格式無效');
    if (input && !input.date) input.date = rawDate;

    let hour = 12;
    let minute = 0;
    if (input.shichen && SHICHEN_HOURS[input.shichen] !== undefined && (!input.time || (input.time === '12:00' && input.shichen !== '午'))) {
        hour = SHICHEN_HOURS[input.shichen];
        minute = 0;
        input.time = `${hour < 10 ? '0' + hour : hour}:00`;
    } else if (input.time) {
        const parts = input.time.split(':').map(Number);
        hour = parts[0] || 0;
        minute = parts[1] || 0;
    } else if (input.shichen && SHICHEN_HOURS[input.shichen] !== undefined) {
        hour = SHICHEN_HOURS[input.shichen];
        input.time = `${hour < 10 ? '0' + hour : hour}:00`;
    } else if (input.hour !== undefined && input.hour !== null && input.hour !== '') {
        const h = parseInt(input.hour, 10);
        if (!isNaN(h)) hour = h;
        input.time = `${hour < 10 ? '0' + hour : hour}:00`;
    }

    let solarTimeInfo = null;
    let calcYear = year;
    let calcMonth = month;
    let calcDay = day;
    let calcHour = hour;
    let calcMinute = minute;

    if (input.place || input.longitude !== undefined || input.useSolarTime) {
        solarTimeInfo = calculateTrueSolarTime({
            date: rawDate,
            hour,
            minute,
            place: input.place,
            longitude: input.longitude,
            latitude: input.latitude,
            ziMode: input.ziMode || 'early_late'
        });

        if (input.useSolarTime !== false) {
            const [sy, sm, sd] = solarTimeInfo.solarDate.split('-').map(Number);
            calcYear = sy;
            calcMonth = sm;
            calcDay = sd;
            calcHour = solarTimeInfo.solarHour;
            calcMinute = solarTimeInfo.solarMinute;
        }
    }

    let lunar;
    if (input.calendar === 'lunar') {
        const isLeap = input.leap === true || input.leap === 'true' || input.leap === 1 || input.leap === '1';
        const lunarMonth = isLeap ? -month : month;
        lunar = Lunar.fromYmdHms(year, lunarMonth, day, hour, minute, 0);
    } else {
        const solar = Solar.fromYmdHms(calcYear, calcMonth, calcDay, calcHour, calcMinute, 0);
        lunar = solar.getLunar();
    }

    return { lunar, hour: calcHour, minute: calcMinute, rawHour: hour, rawMinute: minute, solarTimeInfo };
}

// 計算紫微斗數全盤
function calculateZiweiChart(input) {
    const { lunar, hour, minute, rawHour, rawMinute, solarTimeInfo } = parseInputDate(input);
    const sex = (input.sex === '女' || input.sex === 'female') ? '女' : '男';

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
        solarTimeInfo,
        summary: `命宮位於【${mingBranch}宮】（${mingStem}${mingBranch} / ${bureau.name}），命主【${mingzhu}】，身主【${shenzhu}】。生年四化：${yearStem}干【${sihua.祿}化祿、${sihua.權}化權、${sihua.科}化科、${sihua.忌}化忌】。格局特徵：${detectedPatterns.map((p) => p.name).join('、') || '常規格局'}`,
        maleSize: (sex === '男' || sex === 'male') ? evaluateMaleSize({ palaces, sex: '男' }) : null,
        futureSpouse: evaluateFutureSpouse({ palaces, sex })
    };
}

// 紫微斗數男生真實尺寸與體質雙核評估引擎
function evaluateMaleSize(input) {
    const inputSex = input?.sex;
    if (inputSex === '女' || inputSex === 'female') {
        return {
            isApplicable: false,
            tier: '不適用',
            cmRange: '不適用',
            title: '女性命盤不適用',
            ziStars: '不適用',
            ziPalace: '子',
            jieStars: '不適用',
            jiePalace: '疾厄宮',
            appearance: '男生真實尺寸評估僅適用於男性命盤。',
            physique: '女性生理體質與婦科調和，請參照疾厄宮主星之陰陽五行吉凶。',
            endurance: '不適用',
            advice: '此項測算為男性生理機能與尺寸評估，若需測算請切換性別為「男」。',
            summary: '【不適用】男生真實尺寸評估僅適用於男性命盤。女性生理健康請參照疾厄宮主星分析。'
        };
    }

    let chart;
    if (input && Array.isArray(input.palaces)) {
        chart = input;
    } else {
        chart = calculateZiweiChart(input);
    }

    const ziPalace = chart.palaces.find((p) => p.branch === '子');
    const wuPalace = chart.palaces.find((p) => p.branch === '午');
    const jiePalace = chart.palaces.find((p) => p.name === '疾厄宮');

    if (!ziPalace || !jiePalace) {
        throw new Error('紫微命盤宮位結構不完整，無法進行男生尺寸推算');
    }

    // 1. 子位分析（出廠外觀氣象）
    let ziMajorStars = ziPalace.stars.filter((s) => s.type === 'major');
    let isZiBorrowed = false;
    if (ziMajorStars.length === 0 && wuPalace) {
        ziMajorStars = wuPalace.stars.filter((s) => s.type === 'major');
        isZiBorrowed = true;
    }
    const ziMajorNames = ziMajorStars.map((s) => s.name);
    const ziAllStars = ziPalace.stars.map((s) => s.name);

    // 2. 疾厄宮分析（實質肉身規格）
    let jieMajorStars = jiePalace.stars.filter((s) => s.type === 'major');
    let isJieBorrowed = false;
    const oppJieBranch = jiePalace.aspects?.opposite;
    const oppJiePalace = oppJieBranch ? chart.palaces.find((p) => p.branch === oppJieBranch) : null;
    if (jieMajorStars.length === 0 && oppJiePalace) {
        jieMajorStars = oppJiePalace.stars.filter((s) => s.type === 'major');
        isJieBorrowed = true;
    }
    const jieMajorNames = jieMajorStars.map((s) => s.name);
    const jieAllStars = jiePalace.stars.map((s) => s.name);

    // 關鍵特質煞曜與吉曜（以疾厄宮肉身主導，不混淆子位外觀）
    const jieHasQingyang = jieAllStars.includes('擎羊');
    const jieHasTuoluo = jieAllStars.includes('陀羅');
    const jieHasHuoLing = jieAllStars.includes('火星') || jieAllStars.includes('鈴星');
    const jieHasTianma = jieAllStars.includes('天馬');
    const ziHasLingxingOnly = ziAllStars.includes('鈴星') && ziMajorNames.length === 0;

    // 定位外觀分級 (Appearance: XL | STD | SM)
    const isZiXL = (ziMajorNames.includes('武曲') && ziMajorNames.includes('天府')) ||
                   ziMajorNames.includes('太陽') ||
                   ziMajorNames.includes('巨門');

    // 定位肉身實裝分級 (Physique: XL | STD | SM)
    const isJieXL = (jieMajorNames.includes('武曲') && jieMajorNames.includes('天府')) ||
                    jieMajorNames.includes('太陽') ||
                    jieMajorNames.includes('巨門');

    // 雙核交叉判定
    let tier = '大/中杯';
    let cmRange = '11 - 15 cm';
    let title = '實戰長青型';

    // 真·特大杯：子位特大，且疾厄宮亦為特大或子疾同宮，且無孤煞破局
    const isTrueXL = (isZiXL && isJieXL) || (jiePalace.branch === '子' && isZiXL);

    if (isTrueXL) {
        tier = '特大杯';
        cmRange = '＞16 cm';
        if (ziMajorNames.includes('巨門') || jieMajorNames.includes('巨門')) {
            title = '深潛重砲型';
        } else if (ziMajorNames.includes('太陽') || jieMajorNames.includes('太陽')) {
            title = '重磅核武型';
        } else {
            title = '鋼鐵硬漢型';
        }
    } else if (ziHasLingxingOnly && !isJieXL) {
        tier = '小杯';
        cmRange = '＜10 cm';
        title = '靈動巧致型';
    } else {
        tier = '大/中杯';
        if (jieHasQingyang) {
            cmRange = '11 - 13 cm';
            title = '鋒刃破表·精鋼硬漢型';
        } else if (jieHasTuoluo) {
            cmRange = '11 - 13 cm';
            title = '慢工細活·耐磨長跑型';
        } else if (jieMajorNames.includes('貪狼') || jieMajorNames.includes('廉貞')) {
            cmRange = '12 - 15 cm';
            title = jieHasTianma ? '深藏不露·實戰永動機' : '情趣長青·狂暴續航型';
        } else if (jieMajorNames.includes('天相') || ziMajorNames.includes('天機')) {
            cmRange = '11 - 14 cm';
            title = '斯文雅致·情調掌控型';
        } else if (jieMajorNames.includes('破軍') || jieMajorNames.includes('七殺')) {
            cmRange = '12 - 15 cm';
            title = '衝鋒陷陣·將軍霸王型';
        } else {
            cmRange = '11 - 15 cm';
            title = '黃金常規·實用長青型';
        }
    }

    // 雙核解碼文案
    const ziStarStr = (ziMajorStars.length > 0 ? ziMajorStars.map(s => s.name + (s.sihua ? `(${s.sihua})` : '')).join('、') : (ziAllStars.length > 0 ? ziAllStars.join('、') : '無主星')) + (isZiBorrowed ? '（借對宮午位）' : '');
    const jieStarStr = (jieMajorStars.length > 0 ? jieMajorStars.map(s => s.name + (s.sihua ? `(${s.sihua})` : '')).join('、') : (jieAllStars.length > 0 ? jieAllStars.join('、') : '無主星')) + (isJieBorrowed ? `（借對宮${oppJieBranch}位）` : '');

    let appearanceDesc = '';
    if (ziMajorNames.includes('巨門')) {
        appearanceDesc = '巨門主暗曜管道，出廠外貌自帶「深藏不露」屬性，平常低調收斂，充血備戰時氣場突現。';
    } else if (ziMajorNames.includes('太陽')) {
        appearanceDesc = '太陽為陽火盛極，出廠外貌雄健威儀、向上昂然，天生自帶奪目氣勢。';
    } else if (ziMajorNames.includes('武曲') && ziMajorNames.includes('天府')) {
        appearanceDesc = '武曲剛金配天府土庫，出廠外觀剛挺飽滿、骨肉相得益彰，極具份量。';
    } else if (ziMajorNames.includes('太陰') || ziMajorNames.includes('天同')) {
        appearanceDesc = '太陰天同雙水潤澤，出廠外觀溫潤斯文、線條流暢，主打親和協調。';
    } else {
        appearanceDesc = `子位坐【${ziStarStr}】，形意內斂和諧，不走浮誇路線。`;
    }

    let physiqueDesc = '';
    if (jieHasQingyang) {
        physiqueDesc = `疾厄宮坐【${jiePalace.branch}宮】見擎羊金煞，骨幹堅實剛直如刃，硬度指標極高，講究精準與實質破壞力。`;
    } else if (jieMajorNames.includes('貪狼') || jieMajorNames.includes('廉貞')) {
        physiqueDesc = `疾厄宮坐【${jiePalace.branch}宮】逢廉貞貪狼桃花星系，肉身荷爾蒙充沛，生命動能旺盛，對氣氛與情慾極具感召力。`;
    } else if (jieMajorNames.includes('破軍') || jieMajorNames.includes('七殺')) {
        physiqueDesc = `疾厄宮坐【${jiePalace.branch}宮】逢殺破大將之星，骨架強韌，實戰爆發力強，節奏強悍直接。`;
    } else {
        physiqueDesc = `疾厄宮坐【${jiePalace.branch}宮】逢【${jieStarStr}】，肉身生理機能平衡，日常代謝與耐力穩定。`;
    }

    let enduranceScore = 82;
    let enduranceDesc = '';
    if (jieHasTianma) {
        enduranceScore = 95;
        enduranceDesc = '疾厄宮帶天馬奔馳，生理機能循環極快，具備「戰鬥永動機」之耐力，續航力堪稱天花板。';
    } else if (jieHasTuoluo) {
        enduranceScore = 88;
        enduranceDesc = '疾厄逢陀羅星，節奏沈著拖長，慢工出細活，善打持久攻堅戰。';
    } else if (jieHasHuoLing) {
        enduranceScore = 78;
        enduranceDesc = '帶火鈴煞星，爆發力極快、感官敏銳，注重瞬間點燃與節奏切換。';
    } else if (jieHasQingyang) {
        enduranceScore = 85;
        enduranceDesc = '疾厄坐擎羊剛毅之星，骨幹堅實，爆發硬度極高，作風強悍俐落。';
    } else {
        enduranceScore = 82;
        enduranceDesc = '節奏穩定均衡，能適應各種情境，表現耐力持久不拉垮。';
    }

    const advice = tier === '特大杯'
        ? '天生神力是老天賞飯吃，但再猛的硬體也需溫柔相待；懂得前戲細膩與尊重對方感受，才是真正頂級的雄性魅力。'
        : tier === '小杯'
        ? '尺寸是出廠隨機發放，靈魂深度才是後天修行；真誠細膩的愛撫與深層情感共鳴，遠比純數字更能帶給對方極致愉悅。'
        : '老天爺賞賜的 11-15cm 是全球最實用適配的黃金規格！放下不切實際的數字焦慮，專注於情緒價值、情趣節奏與體貼陪伴，就是無懈可擊的最佳伴侶。';

    const disclaimer = '本測算為紫微斗數星曜文化之趣味推演，非醫學檢驗指標，實際生理特質受遺傳與發育影響，請理性看待。';

    return {
        tier,
        cmRange,
        title,
        ziStars: ziStarStr,
        ziPalace: '子',
        jieStars: jieStarStr,
        jiePalace: jiePalace.branch,
        appearance: appearanceDesc,
        physique: physiqueDesc,
        endurance: enduranceDesc,
        enduranceScore,
        disclaimer,
        advice,
        summary: `【${tier} · ${cmRange}】${title}。子位出廠【${ziStarStr}】，疾厄肉身【${jieStarStr}】。耐力評分：${enduranceScore}。${advice}`
    };
}

// 紫微斗數未來另一半（夫妻宮正緣畫像與年齡差深度解析引擎）
function evaluateFutureSpouse(input) {
    let chart;
    let sex = (input?.sex === '女' || input?.sex === 'female') ? '女' : '男';
    if (input && Array.isArray(input.palaces)) {
        chart = input;
    } else if (input && input.chart && Array.isArray(input.chart.palaces)) {
        chart = input.chart;
        if (input.chart.sex) sex = (input.chart.sex === '女' || input.chart.sex === 'female') ? '女' : '男';
    } else {
        chart = calculateZiweiChart(input);
    }

    const spousePalace = chart.palaces.find((p) => p.name === '夫妻宮');
    if (!spousePalace) {
        throw new Error('紫微命盤宮位結構不完整，無法定位夫妻宮');
    }

    // 取得夫妻宮星曜
    let majorStars = spousePalace.stars.filter((s) => s.type === 'major');
    let auxStars = spousePalace.stars.filter((s) => s.type !== 'major');
    let isBorrowed = false;

    // 若夫妻宮無主星，借對宮（官祿宮）主星
    const oppBranch = spousePalace.aspects?.opposite;
    const oppPalace = oppBranch ? chart.palaces.find((p) => p.branch === oppBranch) : null;
    if (majorStars.length === 0 && oppPalace) {
        majorStars = oppPalace.stars.filter((s) => s.type === 'major');
        isBorrowed = true;
    }

    const majorNames = majorStars.map((s) => s.name);
    const auxNames = auxStars.map((s) => s.name);
    const sihuaStars = spousePalace.stars.filter((s) => s.sihua);
    const targetGender = sex === '男' ? '女性伴侶（妻子）' : '男性伴侶（丈夫）';

    // 1. 年齡差推定（Age Gap Estimation）
    let ageTier = '同齡或差距不大 (上下 1-3 歲以內)';
    let ageDesc = '';
    let psychAge = '同儕共鳴 · 默契協調型';

    if (majorNames.includes('天梁')) {
        if (majorNames.includes('天同')) {
            ageTier = '顯著年齡差距 (多大 3-6 歲以上，或小 2-4 歲)';
            ageDesc = '夫妻宮逢天同天梁同宮，星性剛柔互見。天梁為長者蔭星，天同為赤子福星，因此雙方歲數極少為純同齡。最常見模式為伴侶大你 3-6 歲以上（穩重如兄長或師長般包容呵護）；若另一半比你小，則多半帶著赤子童心，需要你細心體貼。';
            psychAge = '亦師亦友 · 互補長幼型';
        } else {
            ageTier = '比你大 3-6 歲或以上';
            ageDesc = '天梁為長者星、蔭星。伴侶思想成熟老成，行事有原則，自帶長輩照顧者光環，通常比你大 3-6 歲以上，相處時能給予你豐厚的安全感與長輩般的實質庇護。';
            psychAge = '成熟穩健 · 長者庇護型';
        }
    } else if (majorNames.includes('紫微') && majorNames.includes('天府')) {
        ageTier = '比你大 3-5 歲或思想成熟之同齡';
        ageDesc = '紫微帝星與天府令星齊聚，伴侶氣場尊貴、自尊心強且極有主見與事業抱負。通常年齡比你大 3-5 歲，或在同儕中屬於極早熟、有威望的領袖型人物。';
        psychAge = '大氣尊貴 · 頂樑柱型';
    } else if (majorNames.includes('紫微')) {
        ageTier = '比你大 2-5 歲或極具成熟威嚴';
        ageDesc = '紫微為帝座，伴侶自尊心強、有責任感，行事有主導慾。多偏好比自己年長、或心智年齡比同齡成熟沉穩的伴侶，相處重視彼此尊重與體面。';
        psychAge = '具威望主導 · 穩重型';
    } else if (majorNames.includes('天府')) {
        ageTier = '比你大 2-4 歲或經濟沉穩型';
        ageDesc = '天府為南斗令星兼財庫，伴侶性格敦厚穩健、重生活品味、善於理財守成。年齡往往比你略大 2-4 歲，能帶來安穩踏實的家庭物質基石。';
        psychAge = '踏實持重 · 守護型';
    } else if (majorNames.includes('太陽')) {
        const sunStar = majorStars.find((s) => s.name === '太陽');
        const isBright = sunStar && (sunStar.brightness === '廟' || sunStar.brightness === '旺');
        if (sex === '女') {
            if (isBright) {
                ageTier = '比你大 3 歲以上';
                ageDesc = '女命夫妻宮太陽廟旺，夫星光芒萬丈、光明坦蕩有擔當，在社會上多具名望或領導力，歲數通常大你 3 歲以上，是值得託付的正義型伴侶。';
                psychAge = '陽光擔當 · 頂天立地型';
            } else {
                ageTier = '同齡或小於你 (或需你操心照料)';
                ageDesc = '太陽落陷，夫星光芒較收斂或較為辛勞，對象年紀可能與你相仿或略小，性格雖善良但常需你多予鼓勵張羅。';
                psychAge = '赤誠隨和 · 需互勵型';
            }
        } else {
            ageTier = '同齡或相差不大 (上下 1-3 歲以內)';
            ageDesc = '男命夫妻宮坐太陽，妻子熱情大方、心直口快、善於操持，具備女強人或大姐風範。年齡多與你相仿或稍小，相處如熱情夥伴。';
            psychAge = '幹練爽朗 · 夥伴型';
        }
    } else if (majorNames.includes('天同')) {
        ageTier = '比你小 2-5 歲 (或心態極純真)';
        ageDesc = '天同為福星、赤子之宿。伴侶溫和柔順、知足常樂，通常年齡比你小 2-5 歲；即便戶籍年齡相近，其言行舉止與心態也常保赤子之美，依賴心與親和力強。';
        psychAge = '赤子童真 · 親和隨性型';
    } else if (majorNames.includes('太陰')) {
        if (sex === '男') {
            ageTier = '比你小 1-4 歲或同齡清秀型';
            ageDesc = '男命夫妻宮太陰為正配之星，妻子溫柔體貼、內斂文靜、重視家庭與生活細節。年齡多比你小 1-4 歲，如水般潤物細無聲。';
            psychAge = '溫柔似水 · 賢淑型';
        } else {
            ageTier = '同齡或略小 (溫柔文質之伴侶)';
            ageDesc = '女命夫妻宮坐太陰，伴侶文質彬彬、性格細膩深情、審美品味高，年齡相仿或稍小，善解人意。';
            psychAge = '深情細膩 · 知心型';
        }
    } else if (majorNames.includes('武曲') && majorNames.includes('貪狼')) {
        ageTier = '同齡或差距不大 (上下 1-3 歲以內)';
        ageDesc = '武曲金與貪狼木同宮，剛柔兼濟。伴侶兼具務實幹練與社交情調，事業上能獨當一面，生活中懂浪漫樂趣。年齡多為同齡或相差 1-3 歲以內，為勢均力敵、一同奮鬥的黃金拍檔。';
        psychAge = '精明能幹 · 情調平衡型';
    } else if (majorNames.includes('武曲')) {
        ageTier = '同齡或相差不大 (大/小 1-3 歲以內)';
        ageDesc = '武曲性格耿直果決、務實理智，重行動多於言語。伴侶年齡多與自己相仿，在事業與財務上有共同打拼的默契。';
        psychAge = '務實剛毅 · 行動力強型';
    } else if (majorNames.includes('貪狼')) {
        ageTier = '同齡或相仿 (上下 1-3 歲以內)';
        ageDesc = '貪狼為桃花才藝之星，伴侶幽默風趣、擅長社交、懂吃喝玩樂與人情世故。雙方多因共同興趣圈、聚會活動相識，年齡層非常相近。';
        psychAge = '風趣活潑 · 社交同頻型';
    } else if (majorNames.includes('天機')) {
        ageTier = '同齡或相差 1-2 歲以內';
        ageDesc = '天機主智慧同儕，伴侶思維敏捷、擅長溝通，多為同學、同事或同行圈結緣，智識同頻，年齡相差極微。';
        psychAge = '智性聰穎 · 同儕共鳴型';
    } else if (majorNames.includes('天相')) {
        ageTier = '同齡或相仿 (上下 2 歲以內)';
        ageDesc = '天相為掌印貴星，伴侶端莊得體、講究門當戶對與外在形象。年齡多在同儕階段，步調相稱、相敬如賓。';
        psychAge = '體面得體 · 相敬如賓型';
    } else if (majorNames.includes('巨門')) {
        ageTier = '同齡或差距不大 (上下 2 歲以內)';
        ageDesc = '巨門為言談思辨之星，重視心靈深層溝通。伴侶年齡相差無幾，如同學友伴，在思想切磋與生活傾訴中建立深厚感情。';
        psychAge = '善思敏銳 · 知心切磋型';
    } else if (majorNames.includes('七殺') || majorNames.includes('破軍')) {
        ageTier = '年齡差距懸殊 (大 4-6 歲以上或小 3 歲以上)';
        ageDesc = '七殺、破軍屬將星與開創星，個性強烈、敢愛敢恨。夫妻宮逢之，年齡通常呈現極端分佈（要麼另一半比你大很多能穩住局勢，要麼比你小很多讓你包容）；跨越年齡界限的靈魂契合反能讓感情更為純粹。';
        psychAge = '敢愛敢恨 · 個性鮮明型';
    } else if (majorNames.includes('廉貞')) {
        ageTier = '年齡跨度彈性大 (依感覺與魅力引動)';
        ageDesc = '廉貞次桃花星，愛恨分明、魅力獨具。年齡不是彼此的核心考量，往往因某個眼神或強烈吸引力而陷入熱戀，跨歲數包容力高。';
        psychAge = '深沉濃烈 · 魅力至上型';
    } else {
        ageTier = '隨和多變 (多相仿或由緣分機遇主導)';
        ageDesc = '夫妻宮無主星借對宮，感情心態隨和包容、適應力強，另一半年齡差距彈性極高，多隨後天社交機遇而定。';
        psychAge = '隨緣適應 · 默契共生型';
    }

    // 煞曜與吉曜之年齡及相處微調
    const hasSha = auxNames.some((s) => ['擎羊', '陀羅', '火星', '鈴星'].includes(s));
    const hasGui = auxNames.some((s) => ['天魁', '天鉞', '左輔', '右弼'].includes(s));
    let shaAdvice = '';
    if (hasSha) {
        shaAdvice = '宮位逢煞星（擎羊/陀羅/火星/鈴星），代表雙方個性都有鮮明稜角，早期相處容易針鋒相對，強烈建議晚婚（30歲後）或在心智成熟後確立關係，歲月沉澱方得長久。';
    }

    // 2. 外貌氣質畫像（Appearance Profile）
    let appearanceStyle = '端莊大方 · 氣度自然';
    let appearanceFeatures = '五官和諧，身形勻稱，言談舉止親和自然，給人舒適信賴感。';
    let appearanceAura = '低調內斂，不喜浮誇，但在熟人圈中極受歡迎。';

    if (majorNames.includes('紫微') || majorNames.includes('天府')) {
        appearanceStyle = '尊貴氣宇 · 雍容大度';
        appearanceFeatures = '五官輪廓立體端正，體態穩重有威儀，站坐有相，神情不怒自威。著裝講究品質與剪裁，自帶名家風範。';
        appearanceAura = '自帶領袖氣場，走進任何場合都能自然成為視覺重心。';
    } else if (majorNames.includes('天相')) {
        appearanceStyle = '得體優雅 · 衣品出眾';
        appearanceFeatures = '相貌清秀端正，膚質良好，極懂穿搭配色，儀表始終保持一絲不苟與得體禮貌。';
        appearanceAura = '優雅溫潤，舉手投足散發受過良好教養的貴族氣質。';
    } else if (majorNames.includes('太陰') || majorNames.includes('天同')) {
        appearanceStyle = '溫潤如水 · 親和秀美';
        appearanceFeatures = '五官柔和清麗，眼神純淨帶笑意，膚色偏白，自帶令人放鬆的治癒感與文藝氣質。';
        appearanceAura = '溫暖無害，如沐春風，讓人情不自禁想要靠近與守護。';
    } else if (majorNames.includes('貪狼') || majorNames.includes('廉貞')) {
        appearanceStyle = '明艷迷人 · 電眼桃花';
        appearanceFeatures = '五官辨識度極高，眼神帶電且神采飛揚，體態修長靈動，善於透過髮型與香氛展現獨特魅力。';
        appearanceAura = '異性緣極佳，舉手投足自帶神秘又熱烈的情感引力。';
    } else if (majorNames.includes('太陽')) {
        appearanceStyle = '明朗陽光 · 英氣勃發';
        appearanceFeatures = '骨骼大氣，笑容燦爛開朗，眼神光明磊落，說話聲音宏亮清透，給人滿滿正能量。';
        appearanceAura = '熱情慷慨，像冬日暖陽般照耀身邊每一個人。';
    } else if (majorNames.includes('武曲') || majorNames.includes('七殺') || majorNames.includes('破軍')) {
        appearanceStyle = '精幹俐落 · 英氣十足';
        appearanceFeatures = '輪廓線條分明，眼神堅定專注，體格緊實勻稱，動作迅捷乾脆，透著不服輸的精幹美。';
        appearanceAura = '氣場強大果敢，帶有一種雷厲風行、巾幗/鐵漢的不俗英氣。';
    } else if (majorNames.includes('天機') || majorNames.includes('巨門')) {
        appearanceStyle = '知性儒雅 · 思辨清俊';
        appearanceFeatures = '神情機敏專注，眼神銳利有神，說話條理分明，透著濃厚的書卷氣或專業菁英氣質。';
        appearanceAura = '聰穎智性，在談吐交流中散發無窮的頭腦魅力。';
    }

    // 3. 性格與脾氣特徵（Personality Traits）
    const personalityTags = [];
    let strengthsDesc = '';
    let weaknessesDesc = '';

    if (majorNames.includes('武曲') && majorNames.includes('貪狼')) {
        personalityTags.push('務實幹練', '八面玲瓏', '金錢觀強', '懂生活情趣', '好勝有原則');
        strengthsDesc = '事業上精明果斷、實事求是；生活中懂情調、善交際，能將理性物質與感性浪漫完美平衡。';
        weaknessesDesc = '個性都偏硬、自尊心強，意見不合時容易互不相讓，需學會彼此退一步。';
    } else if (majorNames.includes('天梁')) {
        personalityTags.push('正直有擔當', '成熟老練', '熱心助人', '原則性強', '長輩風範');
        strengthsDesc = '處事公正沉穩、有強烈責任心，在逆境中能為你遮風擋雨，是極其可靠的人生避風港。';
        weaknessesDesc = '偶爾略帶說教傾向或過於嚴肅，相處時需要多一點幽默與鬆弛感。';
    } else if (majorNames.includes('紫微') || majorNames.includes('天府')) {
        personalityTags.push('大局觀強', '追求卓越', '重視體面', '重家庭承諾', '領導力');
        strengthsDesc = '目光遠大、行事穩健大器，對家庭有全方位的責任感與保護慾，能獨當一面。';
        weaknessesDesc = '好面子、掌控慾較強，不喜歡被公開反駁或指責，需多給予對方台階與讚美。';
    } else if (majorNames.includes('天同')) {
        personalityTags.push('知足常樂', '溫柔隨和', '童心未泯', '重視舒適', '愛好和平');
        strengthsDesc = '心地純良、情緒平穩包容，不喜爭執，能為家庭營造溫馨輕鬆的港灣。';
        weaknessesDesc = '偶爾較為隨性或缺乏抗壓韌性，面臨重大考驗時容易逃避，需你多予鼓舞引導。';
    } else if (majorNames.includes('太陰')) {
        personalityTags.push('心思細膩', '體貼入微', '追求完美', '重精神交流', '審美品味佳');
        strengthsDesc = '極具同理心，擅長照顧伴侶的情緒細節，生活起居打理得井井有條。';
        weaknessesDesc = '內心敏感情緒化，遇到誤會容易悶在心裡生悶氣，需要主動給予安全感與溝通。';
    } else if (majorNames.includes('貪狼') || majorNames.includes('廉貞')) {
        personalityTags.push('魅力四射', '敢愛敢恨', '多才多藝', '追求新鮮感', '社交達人');
        strengthsDesc = '戀愛氛圍感極佳、趣味十足，永遠能給關係帶來驚喜與激情，愛意濃烈深沉。';
        weaknessesDesc = '異性緣較旺且情緒波動大，對情感要求極致純粹，需要堅定給予彼此信任。';
    } else if (majorNames.includes('七殺') || majorNames.includes('破軍')) {
        personalityTags.push('果斷利落', '勇於突破', '真性情', '獨立自主', '不拘常規');
        strengthsDesc = '對感情真摯赤誠，一旦認定便傾盡全力，危難關頭是最值得信賴的戰友。';
        weaknessesDesc = '脾氣來得急、言行直接剛烈，容易在衝動下說氣話，需雙方學會冷靜暫停機制。';
    } else {
        personalityTags.push('溫和適應', '重視溝通', '知足安穩', '真誠友善');
        strengthsDesc = '性格隨和好相處，懂得體諒他人，能靈活融入對方的家庭與生活節奏。';
        weaknessesDesc = '主見較弱時容易猶豫不決，需雙方共同商議重大決定。';
    }

    // 4. 相遇場景與契機（Meeting Occasion）
    let meetingPlaces = '日常社交活動、同好興趣社團、或是朋友同事的聚餐聚會中。';
    if (majorNames.includes('武曲') || majorNames.includes('天府') || majorNames.includes('天相')) {
        meetingPlaces = '職場業務往來、商務會議、專業培訓進修、或是金融/管理等專業場合。';
    } else if (majorNames.includes('天梁') || hasGui) {
        meetingPlaces = '家族長輩親友引薦、師長前輩介紹、公益慈善活動、或是在尋求指導/諮詢時結緣。';
    } else if (majorNames.includes('貪狼') || majorNames.includes('廉貞')) {
        meetingPlaces = '文娛活動、展覽酒會、朋友派對、旅行戶外、或是帶有浪漫休閒氣息的社交聚會。';
    } else if (majorNames.includes('天機') || majorNames.includes('巨門')) {
        meetingPlaces = '學校同窗、學術研討會、網路論壇技術交流、書店或社群互動中。';
    } else if (majorNames.includes('太陽')) {
        meetingPlaces = '戶外運動、陽光公益場合、公眾演講、或是跨部門/跨組織的大型公開合作中。';
    }

    // 5. 月老感情錦囊
    let relationshipAdvice = '感情貴在相互成全。多給予彼此欣賞與讚美，在穩定的柴米油鹽裡保有初見時的溫柔，正緣自會歷久彌新。';
    if (majorNames.includes('武曲') && majorNames.includes('貪狼')) {
        relationshipAdvice = '你們是「勢均力敵」的黃金組合。財務與事業上互相給予空間，生活中多創造兩人私密的浪漫驚喜，晚婚比早婚幸福指數高出數倍！';
    } else if (majorNames.includes('天梁')) {
        relationshipAdvice = '珍惜伴侶如長輩般的呵護與智慧，但也要偶爾引導他放下包袱、享受純粹被愛的輕鬆，亦師亦友是你們最舒服的相處節奏。';
    } else if (hasSha) {
        relationshipAdvice = '雙方都是有主見的人，吵架時「贏了爭論便會輸了感情」。學會就事論事、各退一步，30歲後心智成熟時感情會越走越甜。';
    }

    const starDisplayList = majorStars.map((s) => `${s.name}(${s.brightness || '平'})`);
    const starStr = starDisplayList.length > 0 ? starDisplayList.join('、') : '無主星（借對宮）';
    const sihuaStr = sihuaStars.length > 0 ? sihuaStars.map((s) => `${s.name}化${s.sihua}`).join('、') : '無生年四化';

    const summary = `【夫妻宮位於${spousePalace.ganzhi}宮 · 主星：${starStr}】。未來${targetGender}年齡特徵為【${ageTier}】，心智年齡呈現【${psychAge}】。外貌氣質呈【${appearanceStyle}】。性格特質包含【${personalityTags.slice(0, 3).join('、')}】。相遇機緣多在【${meetingPlaces}】。${shaAdvice ? shaAdvice + ' ' : ''}${relationshipAdvice}`;

    return {
        palace: spousePalace.branch,
        ganzhi: spousePalace.ganzhi,
        majorStars: starDisplayList,
        auxStars: auxNames,
        sihuaStars: sihuaStars.map((s) => `${s.name}化${s.sihua}`),
        isBorrowed,
        targetGender,
        ageGap: {
            tier: ageTier,
            desc: ageDesc,
            psychologicalAge: psychAge
        },
        appearance: {
            style: appearanceStyle,
            features: appearanceFeatures,
            aura: appearanceAura
        },
        personality: {
            tags: personalityTags,
            strengths: strengthsDesc,
            weaknesses: weaknessesDesc,
            pattern: psychAge
        },
        meetingScenario: {
            places: meetingPlaces,
            shaAdvice: shaAdvice || '宮位星氣和諧，感情磨合順遂。'
        },
        relationshipAdvice,
        summary
    };
}

module.exports = {
    calculateZiweiChart,
    evaluateMaleSize,
    evaluateFutureSpouse,
    getFiveBureau,
    calcZiweiBranch,
    STAR_BRIGHTNESS,
    SIHUA_TABLE,
    BUREAU_NAMES,
    PALACE_NAMES,
    STEMS,
    BRANCHES
};

