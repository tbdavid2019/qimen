const { Solar, Lunar } = require('lunar-javascript');
const { calculateTrueSolarTime, resolveCoordinates } = require('./solar-time');

const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

const STEM_ELEMENT = { 甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土', 己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水' };
const BRANCH_ELEMENT = { 子: '水', 丑: '土', 寅: '木', 卯: '木', 辰: '土', 巳: '火', 午: '火', 未: '土', 申: '金', 酉: '金', 戌: '土', 亥: '水' };
const HIDDEN = {
    子: ['癸'],
    丑: ['己', '癸', '辛'],
    寅: ['甲', '丙', '戊'],
    卯: ['乙'],
    辰: ['戊', '乙', '癸'],
    巳: ['丙', '庚', '戊'],
    午: ['丁', '己'],
    未: ['己', '丁', '乙'],
    申: ['庚', '壬', '戊'],
    酉: ['辛'],
    戌: ['戊', '辛', '丁'],
    亥: ['壬', '甲']
};

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

const SHICHEN_HOURS = {
    子: 0, 丑: 2, 寅: 4, 卯: 6, 辰: 8, 巳: 10,
    午: 12, 未: 14, 申: 16, 酉: 18, 戌: 20, 亥: 22
};
const CONTROL = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' };
const GENERATE = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' };
const YANG_STEMS = new Set(['甲', '丙', '戊', '庚', '壬']);

// 十二長生表
const CHANGSHENG_TABLE = {
    甲: { 亥: '長生', 子: '沐浴', 丑: '冠帶', 寅: '臨官', 卯: '帝旺', 辰: '衰', 巳: '病', 午: '死', 未: '墓', 申: '絕', 酉: '胎', 戌: '養' },
    乙: { 午: '長生', 巳: '沐浴', 辰: '冠帶', 卯: '臨官', 寅: '帝旺', 丑: '衰', 子: '病', 亥: '死', 戌: '墓', 酉: '絕', 申: '胎', 未: '養' },
    丙: { 寅: '長生', 卯: '沐浴', 辰: '冠帶', 巳: '臨官', 午: '帝旺', 未: '衰', 申: '病', 酉: '死', 戌: '墓', 亥: '絕', 子: '胎', 丑: '養' },
    丁: { 酉: '長生', 申: '沐浴', 未: '冠帶', 午: '臨官', 巳: '帝旺', 辰: '衰', 卯: '病', 寅: '死', 丑: '墓', 子: '絕', 亥: '胎', 戌: '養' },
    戊: { 寅: '長生', 卯: '沐浴', 辰: '冠帶', 巳: '臨官', 午: '帝旺', 未: '衰', 申: '病', 酉: '死', 戌: '墓', 亥: '絕', 子: '胎', 丑: '養' },
    己: { 酉: '長生', 申: '沐浴', 未: '冠帶', 午: '臨官', 巳: '帝旺', 辰: '衰', 卯: '病', 寅: '死', 丑: '墓', 子: '絕', 亥: '胎', 戌: '養' },
    庚: { 巳: '長生', 午: '沐浴', 未: '冠帶', 申: '臨官', 酉: '帝旺', 戌: '衰', 亥: '病', 子: '死', 丑: '墓', 寅: '絕', 卯: '胎', 辰: '養' },
    辛: { 子: '長生', 亥: '沐浴', 戌: '冠帶', 酉: '臨官', 申: '帝旺', 未: '衰', 午: '病', 巳: '死', 辰: '墓', 卯: '絕', 寅: '胎', 丑: '養' },
    壬: { 申: '長生', 酉: '沐浴', 戌: '冠帶', 亥: '臨官', 子: '帝旺', 丑: '衰', 寅: '病', 卯: '死', 辰: '墓', 巳: '絕', 午: '胎', 未: '養' },
    癸: { 卯: '長生', 寅: '沐浴', 丑: '冠帶', 子: '臨官', 亥: '帝旺', 戌: '衰', 酉: '病', 申: '死', 未: '墓', 午: '絕', 巳: '胎', 辰: '養' }
};

function tenGod(dayStem, stem) {
    if (!dayStem || !stem) return '—';
    const self = STEM_ELEMENT[dayStem];
    const other = STEM_ELEMENT[stem];
    const samePolarity = YANG_STEMS.has(dayStem) === YANG_STEMS.has(stem);
    if (self === other) return samePolarity ? '比肩' : '劫財';
    if (GENERATE[self] === other) return samePolarity ? '食神' : '傷官';
    if (GENERATE[other] === self) return samePolarity ? '偏印' : '正印';
    if (CONTROL[self] === other) return samePolarity ? '偏財' : '正財';
    if (CONTROL[other] === self) return samePolarity ? '七殺' : '正官';
    return '比肩';
}

function getXun(ganzhi) {
    if (!ganzhi || ganzhi.length < 2) return '甲子';
    const stems = '甲乙丙丁戊己庚辛壬癸';
    const branches = '子丑寅卯辰巳午未申酉戌亥';
    const sIdx = stems.indexOf(ganzhi[0]);
    const bIdx = branches.indexOf(ganzhi[1]);
    if (sIdx === -1 || bIdx === -1) return '甲子';
    const diff = (bIdx - sIdx + 12) % 12;
    const xunBranches = { 0: '甲子', 10: '甲戌', 8: '甲申', 6: '甲午', 4: '甲辰', 2: '甲寅' };
    return xunBranches[diff] || '甲子';
}

function parseHour(val) {
    if (val === undefined || val === null || val === '') return null;
    if (typeof val === 'number') return isNaN(val) ? null : val;
    const str = String(val).trim();
    if (str.includes(':')) {
        const h = parseInt(str.split(':')[0], 10);
        return isNaN(h) ? null : h;
    }
    const num = Number(str);
    return isNaN(num) ? null : num;
}

function parseMinute(val) {
    if (val === undefined || val === null || val === '') return 0;
    const str = String(val).trim();
    if (str.includes(':')) {
        const m = parseInt(str.split(':')[1], 10);
        return isNaN(m) ? 0 : m;
    }
    return 0;
}

function parseLunarInput(input) {
    if (!input?.date) throw new Error('請提供出生日期');
    const [year, month, day] = input.date.split('-').map(Number);

    let hour = 12;
    let minute = 0;
    let hasExplicitTime = false;

    if (input.time !== undefined && input.time !== null && input.time !== '') {
        const parsedH = parseHour(input.time);
        if (parsedH !== null) {
            hour = parsedH;
            minute = parseMinute(input.time);
            hasExplicitTime = true;
        }
    } else if (input.shichen && SHICHEN_HOURS[input.shichen] !== undefined) {
        hour = SHICHEN_HOURS[input.shichen];
        minute = 0;
        hasExplicitTime = true;
    } else if (input.hour !== undefined && input.hour !== null && input.hour !== '') {
        const parsedH = parseHour(input.hour);
        if (parsedH !== null) {
            hour = parsedH;
            minute = parseMinute(input.hour);
            hasExplicitTime = true;
        }
    }

    if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
        throw new Error('出生日期格式錯誤');
    }

    const check = new Date(Date.UTC(year, month - 1, day));
    if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) {
        throw new Error('出生日期無效');
    }

    let solarTimeInfo = null;
    let calcYear = year;
    let calcMonth = month;
    let calcDay = day;
    let calcHour = hour;
    let calcMinute = minute;

    if (input.place || input.longitude !== undefined || input.useSolarTime) {
        solarTimeInfo = calculateTrueSolarTime({
            date: input.date,
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

    try {
        const lunar = input.calendar === 'lunar'
            ? Lunar.fromYmd(year, input.leap ? -month : month, day).getSolar().getLunar()
            : Solar.fromYmdHms(calcYear, calcMonth, calcDay, calcHour, calcMinute, 0).getLunar();
        return { lunar, hour: calcHour, minute: calcMinute, rawHour: hour, rawMinute: minute, hasExplicitTime, solarTimeInfo };
    } catch {
        throw new Error('出生日期無效');
    }
}

// ---------------------------------------------------------------------------
// 核心神煞體系 (100% 對齊上游 pai_pan.py 口徑)
// ---------------------------------------------------------------------------
const TIANYI_TABLE = {
    甲: ['丑', '未'],
    戊: ['丑', '未'],
    乙: ['子', '申'],
    己: ['子', '申'],
    丙: ['亥', '酉'],
    丁: ['亥', '酉'],
    壬: ['卯', '巳'],
    癸: ['卯', '巳'],
    庚: ['丑', '未', '寅', '午'],
    辛: ['寅', '午']
};

const TIANDE_TABLE = {
    寅: { kind: 'gan', word: '丁' }, 卯: { kind: 'zhi', word: '申' }, 辰: { kind: 'gan', word: '壬' },
    巳: { kind: 'gan', word: '辛' }, 午: { kind: 'zhi', word: '亥' }, 未: { kind: 'gan', word: '甲' },
    申: { kind: 'gan', word: '癸' }, 酉: { kind: 'zhi', word: '寅' }, 戌: { kind: 'gan', word: '丙' },
    亥: { kind: 'gan', word: '乙' }, 子: { kind: 'gan', word: '己' }, 丑: { kind: 'gan', word: '庚' }
};

const YUEDE_TABLE = {
    寅: '丙', 午: '丙', 戌: '丙',
    申: '壬', 子: '壬', 辰: '壬',
    巳: '庚', 酉: '庚', 丑: '庚',
    亥: '甲', 卯: '甲', 未: '甲'
};

const WENCHANG_TABLE = { 甲: '巳', 乙: '午', 丙: '申', 丁: '酉', 戊: '申', 己: '酉', 庚: '亥', 辛: '子', 壬: '寅', 癸: '卯' };
const XUETANG_TABLE = { 甲: '亥', 乙: '午', 丙: '寅', 丁: '酉', 戊: '寅', 己: '酉', 庚: '巳', 辛: '子', 壬: '申', 癸: '卯' };
const CIGUAN_TABLE = { 甲: '寅', 乙: '卯', 丙: '巳', 丁: '午', 戊: '巳', 己: '午', 庚: '申', 辛: '酉', 壬: '亥', 癸: '子' };
const JINYU_TABLE = { 甲: '辰', 乙: '巳', 丙: '未', 丁: '申', 戊: '未', 己: '申', 庚: '戌', 辛: '亥', 壬: '丑', 癸: '寅' };
const YANGBLADE_TABLE = { 甲: '卯', 乙: '寅', 丙: '午', 丁: '巳', 戊: '午', 己: '巳', 庚: '酉', 辛: '子', 壬: '子', 癸: '亥' };

const SANHE_MAP = {
    寅: '火', 午: '火', 戌: '火',
    申: '水', 子: '水', 辰: '水',
    巳: '金', 酉: '金', 丑: '金',
    亥: '木', 卯: '木', 未: '木'
};

const JIANGXING_MAP = { 火: '午', 水: '子', 金: '酉', 木: '卯' };
const HUAGAI_MAP = { 火: '戌', 水: '辰', 金: '丑', 木: '未' };
const YIMA_MAP = { 火: '申', 水: '寅', 金: '亥', 木: '巳' };
const JIESHA_MAP = { 水: '巳', 火: '亥', 金: '寅', 木: '申' };
const ZAISHA_MAP = { 水: '午', 火: '子', 金: '卯', 木: '酉' };
const WANGSHEN_MAP = { 水: '亥', 火: '巳', 金: '申', 木: '寅' };
const TAOHUA_MAP = { 火: '卯', 水: '酉', 金: '午', 木: '子' };

const GUCHEN_TABLE = {
    亥: '寅', 子: '寅', 丑: '寅',
    寅: '巳', 卯: '巳', 辰: '巳',
    巳: '申', 午: '申', 未: '申',
    申: '亥', 酉: '亥', 戌: '亥'
};

const GUASU_TABLE = {
    亥: '戌', 子: '戌', 丑: '戌',
    寅: '丑', 卯: '丑', 辰: '丑',
    巳: '辰', 午: '辰', 未: '辰',
    申: '未', 酉: '未', 戌: '未'
};

const YUANCHEN_FORWARD_MAP = { 子: '未', 丑: '申', 寅: '酉', 卯: '戌', 辰: '亥', 巳: '子', 午: '丑', 未: '寅', 申: '卯', 酉: '辰', 戌: '巳', 亥: '午' };
const YUANCHEN_REVERSE_MAP = { 子: '巳', 丑: '午', 寅: '未', 卯: '申', 辰: '酉', 巳: '戌', 午: '亥', 未: '子', 申: '丑', 酉: '寅', 戌: '卯', 亥: '辰' };

const XUEREN_TABLE = {
    寅: '午', 卯: '未', 辰: '申', 巳: '酉', 午: '戌', 未: '亥',
    申: '子', 酉: '丑', 戌: '寅', 亥: '卯', 子: '辰', 丑: '巳'
};

function getKongwangZhi(dayGan, dayZhi) {
    const ganIdx = STEMS.indexOf(dayGan);
    const zhiIdx = BRANCHES.indexOf(dayZhi);
    if (ganIdx === -1 || zhiIdx === -1) return [];
    const start = (zhiIdx - ganIdx + 12) % 12;
    return [BRANCHES[(start - 2 + 12) % 12], BRANCHES[(start - 1 + 12) % 12]];
}

function getSanheNeedles(yearZhi, dayZhi, table) {
    const res = new Set();
    if (SANHE_MAP[yearZhi] && table[SANHE_MAP[yearZhi]]) res.add(table[SANHE_MAP[yearZhi]]);
    if (SANHE_MAP[dayZhi] && table[SANHE_MAP[dayZhi]]) res.add(table[SANHE_MAP[dayZhi]]);
    return Array.from(res);
}

function calculateShensha(fourPillars, dayMasterStem, sex, yearStem) {
    const list = [];
    const labels = ['年柱', '月柱', '日柱', '時柱'];
    const ganPositions = fourPillars.map((p, idx) => ({ gan: p.stem, label: labels[idx] })).filter(x => x.gan && x.gan !== '—');
    const zhiPositions = fourPillars.map((p, idx) => ({ zhi: p.branch, label: labels[idx] })).filter(x => x.zhi && x.zhi !== '—');
    const mdhZhiPositions = zhiPositions.slice(1);

    const yearZhi = fourPillars[0]?.branch;
    const monthZhi = fourPillars[1]?.branch;
    const dayZhi = fourPillars[2]?.branch;

    function addCheck(name, type, hits, desc) {
        if (hits && hits.length > 0) {
            list.push({
                name,
                type,
                desc: `${desc}（見於${hits.join('、')}）`
            });
        }
    }

    // 1. 天乙貴人
    const tianyiNeed = new Set([...(TIANYI_TABLE[yearStem] || []), ...(TIANYI_TABLE[dayMasterStem] || [])]);
    const tianyiHits = zhiPositions.filter(p => tianyiNeed.has(p.zhi)).map(p => p.label);
    addCheck('天乙貴人', '吉神', tianyiHits, '逢凶化吉，一生多得長輩貴人提攜');

    // 2. 天德
    const tdInfo = TIANDE_TABLE[monthZhi];
    if (tdInfo) {
        if (tdInfo.kind === 'gan') {
            const tdHits = ganPositions.filter(p => p.gan === tdInfo.word).map(p => p.label);
            addCheck('天德', '吉神', tdHits, '祖蔭庇佑，福德深厚，災厄易解');
        } else {
            const tdHits = zhiPositions.filter(p => p.zhi === tdInfo.word).map(p => p.label);
            addCheck('天德', '吉神', tdHits, '祖蔭庇佑，福德深厚，災厄易解');
        }
    }

    // 3. 月德
    const ydWord = YUEDE_TABLE[monthZhi];
    if (ydWord) {
        const ydHits = ganPositions.filter(p => p.gan === ydWord).map(p => p.label);
        addCheck('月德', '吉神', ydHits, '性情溫和，人緣廣結，逢凶化吉');
    }

    // 4. 文昌
    const wenchangNeed = new Set([WENCHANG_TABLE[yearStem], WENCHANG_TABLE[dayMasterStem]]);
    const wenchangHits = zhiPositions.filter(p => wenchangNeed.has(p.zhi)).map(p => p.label);
    addCheck('文昌', '吉神', wenchangHits, '聰明過人，利於學業功名與文筆才華');

    // 5. 學堂
    const xuetangWord = XUETANG_TABLE[dayMasterStem];
    const xuetangHits = zhiPositions.filter(p => p.zhi === xuetangWord).map(p => p.label);
    addCheck('學堂', '吉神', xuetangHits, '學識淵博，具深研鑽研之才智');

    // 6. 詞館
    const ciguanWord = CIGUAN_TABLE[dayMasterStem];
    const ciguanHits = zhiPositions.filter(p => p.zhi === ciguanWord).map(p => p.label);
    addCheck('詞館', '吉神', ciguanHits, '才思敏捷，利於文章著述與口才表達');

    // 7. 將星
    const jiangxingNeed = new Set(getSanheNeedles(yearZhi, dayZhi, JIANGXING_MAP));
    const jiangxingHits = zhiPositions.filter(p => jiangxingNeed.has(p.zhi)).map(p => p.label);
    addCheck('將星', '吉神', jiangxingHits, '領導威望，具決策魄力與統禦才能');

    // 8. 華蓋
    const huagaiNeed = new Set(getSanheNeedles(yearZhi, dayZhi, HUAGAI_MAP));
    const huagaiHits = zhiPositions.filter(p => huagaiNeed.has(p.zhi)).map(p => p.label);
    addCheck('華蓋', '吉凶參半', huagaiHits, '悟性出眾，喜哲學藝術，亦主清高孤獨');

    // 9. 驛馬
    const yimaNeed = new Set(getSanheNeedles(yearZhi, dayZhi, YIMA_MAP));
    const yimaHits = zhiPositions.filter(p => yimaNeed.has(p.zhi)).map(p => p.label);
    addCheck('驛馬', '中性', yimaHits, '主奔波變動，利遠方求財與遷徙拓展');

    // 10. 天醫
    const tianyiZhi = BRANCHES[(BRANCHES.indexOf(monthZhi) - 1 + 12) % 12];
    const tianyiMedHits = zhiPositions.filter(p => p.zhi === tianyiZhi).map(p => p.label);
    addCheck('天醫', '吉神', tianyiMedHits, '身心自愈力強，適合從事醫藥、心理與療癒領域');

    // 11. 祿神
    const luWord = CIGUAN_TABLE[dayMasterStem];
    const luHits = zhiPositions.filter(p => p.zhi === luWord).map(p => p.label);
    addCheck('祿神', '吉神', luHits, '財氣亨通，一生衣食無缺，正財穩固');

    // 12. 金輿
    const jinyuWord = JINYU_TABLE[dayMasterStem];
    const jinyuHits = zhiPositions.filter(p => p.zhi === jinyuWord).map(p => p.label);
    addCheck('金輿', '吉神', jinyuHits, '主乘車騎行之福，出行順遂，婚姻易獲良配');

    // 13. 羊刃
    const yangbladeWord = YANGBLADE_TABLE[dayMasterStem];
    const yangbladeHits = zhiPositions.filter(p => p.zhi === yangbladeWord).map(p => p.label);
    addCheck('羊刃', '凶煞', yangbladeHits, '性格剛烈勇猛，需防急躁衝動或血光意外');

    // 14. 劫煞
    const jieshaNeed = new Set(getSanheNeedles(yearZhi, dayZhi, JIESHA_MAP));
    const jieshaHits = zhiPositions.filter(p => jieshaNeed.has(p.zhi)).map(p => p.label);
    addCheck('劫煞', '凶煞', jieshaHits, '外來阻礙爭端，行事宜步步為營，防意外破耗');

    // 15. 災煞
    const zaishaNeed = new Set(getSanheNeedles(yearZhi, dayZhi, ZAISHA_MAP));
    const zaishaHits = zhiPositions.filter(p => zaishaNeed.has(p.zhi)).map(p => p.label);
    addCheck('災煞', '凶煞', zaishaHits, '需防小人妒忌或突發波折，凡事謹慎為上');

    // 16. 亡神
    const wangshenNeed = new Set(getSanheNeedles(yearZhi, dayZhi, WANGSHEN_MAP));
    const wangshenHits = zhiPositions.filter(p => wangshenNeed.has(p.zhi)).map(p => p.label);
    addCheck('亡神', '凶煞', wangshenHits, '主心思深沉或謀事周折，吉則奇謀，凶則招非');

    // 17. 咸池桃花
    const taohuaNeed = new Set(getSanheNeedles(yearZhi, dayZhi, TAOHUA_MAP));
    const taohuaHits = zhiPositions.filter(p => taohuaNeed.has(p.zhi)).map(p => p.label);
    addCheck('桃花/咸池', '中性', taohuaHits, '異性緣佳，魅力四射，多才多藝');

    // 18. 孤辰
    const guchenWord = GUCHEN_TABLE[yearZhi];
    const guchenHits = zhiPositions.filter(p => p.zhi === guchenWord).map(p => p.label);
    addCheck('孤辰', '凶煞', guchenHits, '性情獨立內向，宜培養廣泛社交與親和力');

    // 19. 寡宿
    const guasuWord = GUASU_TABLE[yearZhi];
    const guasuHits = zhiPositions.filter(p => p.zhi === guasuWord).map(p => p.label);
    addCheck('寡宿', '凶煞', guasuHits, '內心較具孤獨感，宜多敞開心胸與伴侶交流');

    // 20. 空亡/旬空
    const kongwangNeed = new Set(getKongwangZhi(dayMasterStem, dayZhi));
    const kongwangHits = zhiPositions.filter(p => kongwangNeed.has(p.zhi)).map(p => p.label);
    addCheck('空亡/旬空', '中性', kongwangHits, '該柱氣場虛靈，主悟性高遠，亦有緣分起伏之象');

    // 21. 元辰
    const isYangYear = STEMS.indexOf(yearStem) % 2 === 0;
    const isForward = isYangYear === (sex === '男');
    const yuanchenWord = (isForward ? YUANCHEN_FORWARD_MAP : YUANCHEN_REVERSE_MAP)[yearZhi];
    const yuanchenHits = mdhZhiPositions.filter(p => p.zhi === yuanchenWord).map(p => p.label);
    addCheck('元辰', '凶煞', yuanchenHits, '大耗之煞，運程易生波折，宜沉著應變');

    // 22. 血刃
    const xuerenWord = XUEREN_TABLE[monthZhi];
    const xuerenHits = zhiPositions.filter(p => p.zhi === xuerenWord).map(p => p.label);
    addCheck('血刃', '凶煞', xuerenHits, '需注意日常磕碰與體質調養，宜多行善積德');

    return list;
}

// 判定格局
function determineGeJu(fourPillars, dayMasterStem) {
    const monthBranch = fourPillars[1]?.branch;
    const hiddenStems = HIDDEN[monthBranch] || [];
    const mainStem = hiddenStems[0];
    const tg = tenGod(dayMasterStem, mainStem);

    const patterns = {
        正官: '正官格（為人正直守法，有貴氣與管理才能）',
        七殺: '七殺格（魄力非凡，具開拓精神與威嚴）',
        正財: '正財格（勤勞踏實，理財穩健，重視家庭信用）',
        偏財: '偏財格（慷慨仗義，機遇敏銳，利商業投資）',
        正印: '正印格（仁慈端莊，學養深厚，得長輩關照）',
        偏印: '偏印格（思維獨特，洞察敏銳，適合專業學術）',
        食神: '食神格（溫和寬厚，才華橫溢，享福祿口福）',
        傷官: '傷官格（才思敏捷，敢於創新突破，多才多藝）',
        比肩: '建祿格（自立自強，白手起家，意志堅韌）',
        劫財: '陽刃格（剛毅果決，勇於拼搏，需修和諧之道）'
    };

    return {
        name: tg + (tg.endsWith('格') ? '' : '格'),
        description: patterns[tg] || '普通格局'
    };
}

// 計算日主旺衰強弱與喜用神
function determineStrengthAndUsefulGod(fourPillars, dayMasterStem, counts) {
    const monthBranch = fourPillars[1]?.branch;
    const dayElement = STEM_ELEMENT[dayMasterStem];
    const monthElement = BRANCH_ELEMENT[monthBranch];

    const sameOrGenerate = (e) => e === dayElement || GENERATE[e] === dayElement;

    const isDeLing = sameOrGenerate(monthElement);

    let deDiCount = 0;
    fourPillars.forEach(p => {
        if (!p?.branch) return;
        const hidden = HIDDEN[p.branch] || [];
        hidden.forEach(h => {
            if (STEM_ELEMENT[h] === dayElement) deDiCount++;
        });
    });

    let deShiCount = 0;
    fourPillars.forEach((p, idx) => {
        if (idx !== 2 && p?.stem && sameOrGenerate(STEM_ELEMENT[p.stem])) deShiCount++;
    });

    let strength = '身弱';
    if (isDeLing && (deDiCount >= 2 || deShiCount >= 1)) {
        strength = '身旺';
    } else if (!isDeLing && (deDiCount >= 3 || (deDiCount >= 2 && deShiCount >= 2))) {
        strength = '身旺';
    }

    let usefulGod = '';
    let tabooGod = '';
    if (strength === '身旺') {
        const draining = GENERATE[dayElement];
        const controlling = CONTROL[dayElement];
        usefulGod = `食傷[${draining}]、財星[${controlling}]為喜用神（泄秀生財）`;
        tabooGod = `印星[${Object.keys(GENERATE).find(k => GENERATE[k] === dayElement)}]、比劫[${dayElement}]為忌神`;
    } else {
        const mother = Object.keys(GENERATE).find(k => GENERATE[k] === dayElement);
        usefulGod = `印星[${mother}]、比劫[${dayElement}]為喜用神（生扶助身）`;
        tabooGod = `官殺[${CONTROL[dayElement] || ''}]、克泄耗五行為忌神`;
    }

    return {
        strength,
        isDeLing: isDeLing ? '得月令生旺' : '不得月令',
        deDi: `得地${deDiCount}處`,
        deShi: `得天干印比${deShiCount}處`,
        usefulGod,
        tabooGod
    };
}

function calculateBazi(input = {}) {
    if (!['男', '女'].includes(input.sex)) throw new Error('請選擇性別');
    const { lunar, hour, minute, hasExplicitTime, solarTimeInfo } = parseLunarInput(input);
    const eight = lunar.getEightChar();
    if (typeof eight.setSect === 'function') {
        eight.setSect(input.ziMode === 'next_day' ? 1 : 2);
    }
    const isUnknownTime = input.allowUnknownHour && !hasExplicitTime;

    const values = [
        eight.getYear(),
        eight.getMonth(),
        eight.getDay(),
        isUnknownTime ? null : eight.getTime()
    ];
    const labels = ['年柱', '月柱', '日柱', '時柱'];
    const dayStem = eight.getDayGan();

    const fourPillars = values.map((value, index) => {
        if (!value) {
            return {
                label: labels[index],
                value: '未知',
                stem: '—',
                branch: '—',
                element: '—',
                branchElement: '—',
                nayin: '—',
                changsheng: '—',
                tenGod: '—',
                hiddenStems: []
            };
        }
        return {
            label: labels[index],
            value,
            stem: value[0],
            branch: value[1],
            element: STEM_ELEMENT[value[0]],
            branchElement: BRANCH_ELEMENT[value[1]],
            nayin: NAYIN_TABLE[value] || '',
            changsheng: CHANGSHENG_TABLE[dayStem]?.[value[1]] || '平',
            tenGod: index === 2 ? '日主 (元神)' : tenGod(dayStem, value[0]),
            hiddenStems: (HIDDEN[value[1]] || []).map((stem) => ({
                stem,
                element: STEM_ELEMENT[stem],
                tenGod: tenGod(dayStem, stem)
            }))
        };
    });

    const counts = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
    fourPillars.forEach((pillar) => {
        if (pillar.element !== '—') counts[pillar.element] += 1;
        if (pillar.branchElement !== '—') counts[pillar.branchElement] += 1;
    });

    const totalElements = Object.values(counts).reduce((a, b) => a + b, 0);
    const elementPercentages = {};
    for (const [k, v] of Object.entries(counts)) {
        elementPercentages[k] = totalElements > 0 ? Math.round((v / totalElements) * 100) : 0;
    }

    const yun = eight.getYun(input.sex === '男' ? 1 : 0);
    const startYunAge = `${yun.getStartYear()}歲${yun.getStartMonth() ? yun.getStartMonth() + '個月' : ''}`;
    const luckCycles = yun.getDaYun().slice(1, 9).map((cycle) => ({
        ganzhi: cycle.getGanZhi(),
        startYear: cycle.getStartYear(),
        endYear: cycle.getEndYear(),
        startAge: cycle.getStartAge(),
        endAge: cycle.getEndAge()
    }));

    const currentYear = new Date().getFullYear();
    let maxYear = 80;
    if (input.deceasedYear && Number(input.deceasedYear) > 0) {
        maxYear = Number(input.deceasedYear);
    }
    const annualCycles = luckCycles.flatMap((cycle) =>
        Array.from({ length: 10 }, (_, index) => ({
            year: cycle.startYear + index,
            luckCycle: cycle.ganzhi,
            isCurrent: cycle.startYear + index === currentYear
        }))
    ).filter(a => !input.deceasedYear || a.year <= maxYear).slice(0, 80);

    const shensha = calculateShensha(fourPillars, dayStem, input.sex, fourPillars[0].stem);
    const geju = determineGeJu(fourPillars, dayStem);
    const strengthAnalysis = determineStrengthAndUsefulGod(fourPillars, dayStem, counts);

    let timeBorderWarning = null;
    if (hasExplicitTime) {
        const isOddHour = hour % 2 === 1;
        if ((isOddHour && minute <= 15) || (!isOddHour && minute >= 45)) {
            timeBorderWarning = '出生時間靠近時辰交界（±15分鐘），若有出生地真太陽時偏差可能跨時辰，建議結合前後時辰印證。';
        }
    }

    const computedTime = isUnknownTime ? '未知' : `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

    return {
        profile: {
            ...input,
            time: computedTime,
            solarDate: `${lunar.getSolar().getYear()}-${String(lunar.getSolar().getMonth()).padStart(2, '0')}-${String(lunar.getSolar().getDay()).padStart(2, '0')}`,
            lunar: lunar.toString(),
            startYunAge,
            timeBorderWarning,
            solarTimeInfo
        },
        fourPillars,
        dayMaster: { stem: dayStem, element: STEM_ELEMENT[dayStem] },
        fiveElements: { counts, percentages: elementPercentages, total: totalElements },
        geju,
        strengthAnalysis,
        shensha,
        luckCycles,
        annualCycles,
        luckSummary: { startYunAge }
    };
}

module.exports = { calculateBazi, STEM_ELEMENT, BRANCH_ELEMENT, tenGod, CHANGSHENG_TABLE, calculateShensha, getXun };
