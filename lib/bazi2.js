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
    const solarDateStr = `${lunar.getSolar().getYear()}-${String(lunar.getSolar().getMonth()).padStart(2, '0')}-${String(lunar.getSolar().getDay()).padStart(2, '0')}`;

    // 袁天罡稱骨算命與五運六氣
    const chenggu = calculateChenggu(lunar, Math.floor((hour + 1) / 2) % 12);
    let yunqiWellness = null;
    try {
        const { calculateYunqiWellness } = require('./advanced-wisdom');
        yunqiWellness = calculateYunqiWellness({ birthDate: solarDateStr });
    } catch {
        yunqiWellness = null;
    }

    return {
        profile: {
            ...input,
            time: computedTime,
            solarDate: solarDateStr,
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
        chenggu,
        yunqiWellness,
        luckCycles,
        annualCycles,
        luckSummary: { startYunAge }
    };
}

// ==========================================
// 袁天罡稱骨算命數據與演算法 (Chenggu Numerology)
// ==========================================
const CHENGGU_YEAR_WEIGHTS = {
    '甲子': 12, '乙丑': 9, '丙寅': 6, '丁卯': 7, '戊辰': 12, '己巳': 5, '庚午': 9, '辛未': 8, '壬申': 7, '癸酉': 8,
    '甲戌': 15, '乙亥': 9, '丙子': 16, '丁丑': 8, '戊寅': 8, '己卯': 19, '庚辰': 12, '辛巳': 6, '壬午': 8, '癸未': 7,
    '甲申': 5, '乙酉': 15, '丙戌': 6, '丁亥': 16, '戊子': 15, '己丑': 7, '庚寅': 9, '辛卯': 12, '壬辰': 10, '癸巳': 7,
    '甲午': 15, '乙未': 6, '丙申': 5, '丁酉': 14, '戊戌': 14, '己亥': 9, '庚子': 7, '辛丑': 7, '壬寅': 9, '癸卯': 12,
    '甲辰': 8, '乙巳': 7, '丙午': 13, '丁未': 5, '戊申': 14, '己酉': 5, '庚戌': 9, '辛亥': 17, '壬子': 5, '癸丑': 7,
    '甲寅': 12, '乙卯': 8, '丙辰': 8, '丁巳': 6, '戊午': 19, '己未': 6, '庚申': 8, '辛酉': 16, '壬戌': 10, '癸亥': 6
};

const CHENGGU_MONTH_WEIGHTS = [6, 7, 18, 9, 5, 16, 9, 15, 18, 8, 9, 5];

const CHENGGU_DAY_WEIGHTS = [
    5, 10, 8, 15, 16, 15, 8, 16, 8, 16,
    9, 17, 8, 17, 10, 8, 9, 18, 5, 15,
    10, 9, 8, 9, 15, 18, 7, 8, 16, 6
];

const CHENGGU_HOUR_WEIGHTS = {
    '子': 16, '丑': 6, '寅': 7, '卯': 10, '辰': 9, '巳': 16,
    '午': 10, '未': 8, '申': 8, '酉': 9, '戌': 6, '亥': 6
};

const CHENGGU_POEMS = {
    '2.1': { poem: '短命非業謂大愁，平生浪費苦不休。殃及親戚無相靠，尋求衣食若打油。', grade: '先苦後甘', interp: '早年運勢多蹇滯，宜修心積德，憑藉一技之長踏實立足。' },
    '2.2': { poem: '身寒骨冷苦伶仃，此命推來行乞人。勞碌奔波無度日，中年衣食尚難求。', grade: '先苦後甘', interp: '孤身在外多奔波，宜早尋專業技藝安身，持之以恆方見起色。' },
    '2.3': { poem: '此命推來骨肉輕，求謀作事事難成。妻兒兄弟實難靠，獨自奔波活計生。', grade: '先苦後甘', interp: '六親緣分較淡，宜自立自強，謹慎守成，切莫投機冒進。' },
    '2.4': { poem: '此命推來福祿無，門庭困苦總難榮。六親骨肉皆無靠，流落他鄉作客過。', grade: '平穩自強', interp: '宜離鄉發展或主動開拓新領域，中年之後漸入佳境。' },
    '2.5': { poem: '此命推來祖業微，門庭蕭條薄如紙。六親冷淡難相靠，一生事業總蹉跎。', grade: '平穩自強', interp: '祖業底子較薄，全憑雙手開創，注重儲蓄與實業積累。' },
    '2.6': { poem: '平生衣祿苦中求，獨自營謀事不休。離祖出門宜早計，晚來衣祿自無憂。', grade: '平穩自強', interp: '自食其力勤儉起家，出外闖蕩更有施展空間，晚年衣食無憂。' },
    '2.7': { poem: '一生作事少商量，難靠祖宗作主張。獨馬單槍空做去，早年晚歲總無長。', grade: '平穩自強', interp: '為人有主見，但宜多聽取他人良言，合作共贏方能成就大業。' },
    '2.8': { poem: '一生行事似飄蓬，祖宗產業在夢中。若不過房並改姓，也當移徒二三通。', grade: '平穩自強', interp: '生平多變動遷徙，適宜在流動性或跨地域業務中展現才幹。' },
    '2.9': { poem: '初年運限未曾亨，縱有功名在後程。須過四旬方可立，移居改姓始為良。', grade: '先苦後甘', interp: '早年辛苦摸索，年過四十步入大運，名利雙收晚景亨通。' },
    '3.0': { poem: '勞勞碌碌苦中求，東奔西走何日休。若使終身勤與儉，老來稍可免憂愁。', grade: '平穩自強', interp: '勤儉持家之良相，雖少偏財暴富，但細水長流家運綿長。' },
    '3.1': { poem: '忙忙碌碌苦中求，何日雲開見日頭。難得祖基家可立，中年衣食漸能周。', grade: '平穩自強', interp: '早運雖受磨礪，中年轉機顯現，漸入安康周全之境。' },
    '3.2': { poem: '初年運氣未曾亨，作事徒勞受折磨。四十年前多蹇滯，交過四十漸安寧。', grade: '先苦後甘', interp: '大器晚成格局，前行之路皆為經驗資產，四十歲後得心應手。' },
    '3.3': { poem: '早年做事事難成，百年勤勞枉費心。半世自尋空費力，晚年衣祿自安寧。', grade: '先苦後甘', interp: '歷經風雨方顯沉穩，晚年收穫豐盈，享福享壽自得其樂。' },
    '3.4': { poem: '此命福氣果如何，僧道門中衣祿多。離祖出家方得好，終朝拜佛念彌陀。', grade: '平穩自強', interp: '心性慈悲與玄學文化有深緣，重精神追求勝過世俗名利。' },
    '3.5': { poem: '生平福量不周全，祖業難招少田園。目下營求且安分，交過四旬日向榮。', grade: '平穩自強', interp: '步步為營穩紮穩打，待到中年運勢開展，家業欣欣向榮。' },
    '3.6': { poem: '不須勞碌過春秋，客商營謀皆有收。成家立業自清泰，富貴榮華在晚頭。', grade: '中上福祿', interp: '具經商經營之天賦，外出謀求利潤豐盈，晚年福祿雙全。' },
    '3.7': { poem: '此命般般事不成，弟兄少力自孤行。雖然祖業須防損，過了中年漸得亨。', grade: '先苦後甘', interp: '獨立開拓自力更生，過了中年時來運轉，事業亨通。' },
    '3.8': { poem: '一身骨肉最清高，早入簧門姓名標。待到年將三十六，藍衫脫去換紅袍。', grade: '中上福祿', interp: '文采出眾清貴之象，早歲求學即現光彩，仕途事業步步高升。' },
    '3.9': { poem: '此命終身運不通，勞勞碌碌盡皆空。苦心竭力成家計，到得那時在夢中。', grade: '平穩自強', interp: '凡事莫過於執著強求，放寬心態從容處世，自有平淡是福。' },
    '4.0': { poem: '平生衣祿是綿長，件件心中自主張。前面風霜多受過，後來必定享安康。', grade: '中上福祿', interp: '為人沉穩有主見，歷經磨練心智堅定，中年之後福澤悠長。' },
    '4.1': { poem: '此命推來自不同，為人能幹異凡庸。中年還有不稱意，晚歲名利福祿榮。', grade: '中上福祿', interp: '才智過人辦事幹練，歷經波折不改初心，晚年名利亨通。' },
    '4.2': { poem: '得寬懷處且寬懷，何用雙眉皺不開。若使中年命運濟，那時名利一齊來。', grade: '中上福祿', interp: '心胸寬廣自能納福，中年風雲際會，事業名聲齊頭並進。' },
    '4.3': { poem: '為人心性最聰明，作事軒昂近貴人。衣祿一生天注定，不須勞碌是豐亨。', grade: '上上格局', interp: '天生聰慧氣度軒昂，常得貴人引薦提拔，一生福祿優裕順遂。' },
    '4.4': { poem: '萬事由天莫苦求，須知福祿賴前修。當年財帛難如意，晚景欣然便不憂。', grade: '中上福祿', interp: '命中自有福澤護佑，不必過分焦慮當下，晚年景象豐足安詳。' },
    '4.5': { poem: '名利推求竟若何，前番辛苦後奔波。命中擺渡重重過，直到榮華始得和。', grade: '中上福祿', interp: '前程寬闊但需經過幾重關卡考驗，終究能成就榮華基業。' },
    '4.6': { poem: '東西南北盡皆通，出姓移居更覺隆。衣祿無虧天數定，中年晚景一般同。', grade: '上上格局', interp: '四方通達貴人相助，適應力強，一生衣食無憂享盡清福。' },
    '4.7': { poem: '此命推來旺末年，妻榮子貴自怡然。平生原有滔滔福，可有榮華富貴全。', grade: '上上格局', interp: '後福無窮家庭和樂，配偶賢能子女成才，一生富貴吉祥。' },
    '4.8': { poem: '初年運道未曾通，幾番厄運在其中。交過五十方得遂，家成業就顯門庭。', grade: '先苦後甘', interp: '歷經千錘百鍊，年過五十終成大器，光耀門楣受人景仰。' },
    '4.9': { poem: '此命推來福不輕，自成自立顯門庭。從來富貴人欽敬，使婢差奴過一生。', grade: '上上格局', interp: '天生福厚威儀具足，白手起家聲名顯赫，一生受人尊崇。' },
    '5.0': { poem: '為名為利日雙雙，走馬揚鞭走四方。若使中年運程好，晚景榮華大吉昌。', grade: '上上格局', interp: '胸懷大志縱橫四海，中年事業大展宏圖，晚運昌隆富貴綿延。' },
    '5.1': { poem: '一世榮華事事通，不須勞碌自亨通。弟兄叔侄皆如意，家業成時福祿豐。', grade: '上上格局', interp: '家運興旺滿堂和順，事業推進順水推舟，一生享盡天倫福祿。' },
    '5.2': { poem: '一世亨通事事能，不須勞苦自然寧。宗族欣然心皆好，家業豐亨自稱心。', grade: '上上格局', interp: '才德兼備四海順遂，深受宗族同仁愛戴，家業繁榮萬事順意。' },
    '5.3': { poem: '此格推來氣象真，興家立業在其中。一生福祿安排定，卻是人間一富翁。', grade: '上上格局', interp: '富貴天成財庫豐厚，善於聚財理財，實為人間大富之命。' },
    '5.4': { poem: '此命推來厚且清，平生衣祿自崢嶸。黃金白銀皆豐足，安享榮華度一生。', grade: '上上格局', interp: '品貌清奇福德深厚，財帛豐盈用之不竭，安享一世尊榮富貴。' },
    '5.5': { poem: '走馬揚鞭爭利名，少年做事總天成。一朝福祿源源至，富貴榮華震大名。', grade: '上上格局', interp: '少年得志意氣風發，名利雙收威震一方，成就不凡功名大業。' },
    '5.6': { poem: '此格推來禮義通，一生福祿用無窮。甜酸苦辣皆嘗過，財富榮華百事通。', grade: '上上格局', interp: '知書達禮通曉人情，歷練豐富處事圓融，富貴顯達福氣長久。' },
    '5.7': { poem: '福祿豐盈萬事全，一身榮貴樂天年。名齊大地人欽敬，此格人間第一流。', grade: '上上格局', interp: '當世頂級富貴格局，德望與威名兼備，為社會棟樑與時代領袖。' },
    '5.8': { poem: '平生福祿自然來，名利兼全福壽齊。雁塔題名為貴客，紫袍玉帶走金階。', grade: '上上格局', interp: '金榜題名官運亨通，位居高位受重用，福祿壽三全之極品名造。' },
    '5.9': { poem: '細推此格妙且清，必定才高八斗成。甲第高登人共仰，真箇人間富貴人。', grade: '上上格局', interp: '才高八斗學富五車，深受眾人欽佩，名揚天下安享榮華。' },
    '6.0': { poem: '一朝金榜快題名，顯祖榮宗立大名。衣食無虧名利就，滿門富貴喜盈盈。', grade: '上上格局', interp: '大顯身手光耀祖先，名利雙收富貴盈門，滿門吉慶榮華無比。' },
    '6.1': { poem: '不作朝中金榜客，定為世上一財翁。聰明富貴由天定，安享榮華百事通。', grade: '上上格局', interp: '非貴即富之象，商場稱雄財源滾滾，天賦異稟處處亨通。' },
    '6.2': { poem: '此命生來福不窮，讀書必定顯親宗。紫袍玉帶為卿相，富貴榮華走大同。', grade: '上上格局', interp: '官至極品重臣顯赫，治國理政棟樑之材，功垂青史福祿永存。' },
    '6.3': { poem: '命主為官福祿長，得神庇佑顯明堂。富貴雙全人敬佩，門庭光彩壽綿長。', grade: '上上格局', interp: '得神天佑福壽綿長，名門望族威震四方，人人敬重讚譽有加。' },
    '6.4': { poem: '此命威權不可當，紫袍金帶坐高堂。榮華富貴人人羨，積玉堆金壽命長。', grade: '上上格局', interp: '手握重權位高權重，積金累玉福壽康寧，堪稱世間難得之尊貴。' },
    '6.5': { poem: '細推此命福不輕，安居樂業富貴榮。家道豐盈名利立，代代簪纓永世興。', grade: '上上格局', interp: '家業永固世世昌盛，積善之家必有餘慶，代代出英才永續繁榮。' },
    '6.6': { poem: '人間富貴數此豪，名利雙收氣象高。此格必定身居貴，安享天年樂陶陶。', grade: '上上格局', interp: '人間巨擘豪氣萬千，富甲一方或貴為名公，安享晚年得其所哉。' },
    '6.7': { poem: '官職榮遷祿位高，此命生成非等閒。富貴榮華享不盡，名垂青史福無邊。', grade: '上上格局', interp: '仕途青雲直上，非同凡響之棟樑，享不盡人間富貴與美名。' },
    '6.8': { poem: '富貴由天莫苦求，萬事亨通樂悠悠。命中注定名利就，福祿雙全到白頭。', grade: '上上格局', interp: '天賜洪福樂道安貧，自然豐足無憂無慮，壽登期頤福澤綿長。' },
    '6.9': { poem: '君是人間福祿星，一生衣食自然豐。作事順遂多吉慶，滿堂兒孫受浩恩。', grade: '上上格局', interp: '福星高照澤被後世，行善積德福蔭子孫，全家同沐浩蕩恩澤。' },
    '7.0': { poem: '此命推來福不輕，不須愁慮苦勞生。一生自有衣食在，富貴榮華自天成。', grade: '上上格局', interp: '造化鍾靈天然成就，一生免於塵世辛勞，尊榮富貴自然匯聚。' },
    '7.1': { poem: '此命生成大不同，公侯卿相在其中。一生自有高人敬，富貴榮華極品隆。', grade: '上上格局', interp: '王侯將相之才，受萬人仰戴景仰，富貴崇高已登峰造極。' },
    '7.2': { poem: '此格生來大吉昌，天下無雙第一郎。若非帝王將相客，也是人間大富翁。', grade: '上上格局', interp: '天下無雙第一等命格，乾坤浩蕩氣象萬千，千古難遇之非凡大造。' }
};

const NUM_TO_CHINESE = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];

/**
 * 稱骨算命核心計算
 */
function calculateChenggu(lunarOrYear, arg2 = 6, arg3 = 1, arg4 = '午') {
    const branches = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
    let yearGanZhi, m, d, hBranch;

    if (lunarOrYear && typeof lunarOrYear.getYearInGanZhi === 'function') {
        yearGanZhi = lunarOrYear.getYearInGanZhi();
        m = Math.abs(lunarOrYear.getMonth());
        d = lunarOrYear.getDay();
        const hourIndex = typeof arg2 === 'number' ? arg2 : 6;
        hBranch = branches[hourIndex % 12] || '午';
    } else if (typeof lunarOrYear === 'object' && lunarOrYear !== null) {
        if (lunarOrYear.lunar && typeof lunarOrYear.lunar.getYearInGanZhi === 'function') {
            return calculateChenggu(lunarOrYear.lunar, lunarOrYear.hourIndex ?? arg2);
        }
        yearGanZhi = lunarOrYear.yearGanZhi || lunarOrYear.year || '甲子';
        m = Math.abs(Number(lunarOrYear.month) || 1);
        d = Math.abs(Number(lunarOrYear.day) || 1);
        const rawH = lunarOrYear.hour !== undefined ? lunarOrYear.hour : '午';
        hBranch = typeof rawH === 'number' ? (branches[rawH % 12] || '午') : String(rawH).slice(-1);
    } else {
        yearGanZhi = String(lunarOrYear || '甲子');
        m = Math.abs(Number(arg2) || 1);
        d = Math.abs(Number(arg3) || 1);
        hBranch = typeof arg4 === 'number' ? (branches[arg4 % 12] || '午') : String(arg4 || '午').slice(-1);
    }

    const yWeight = CHENGGU_YEAR_WEIGHTS[yearGanZhi] || 10;
    const mWeight = CHENGGU_MONTH_WEIGHTS[m - 1] || 8;
    const dWeight = CHENGGU_DAY_WEIGHTS[d - 1] || 10;
    const hWeight = CHENGGU_HOUR_WEIGHTS[hBranch] || 10;

    const totalQian = yWeight + mWeight + dWeight + hWeight;
    const taels = Math.floor(totalQian / 10);
    const qian = totalQian % 10;
    const totalTaels = Number((totalQian / 10).toFixed(1));

    const key = totalTaels.toFixed(1);
    const poemData = CHENGGU_POEMS[key] || CHENGGU_POEMS['4.0'];

    const weightLabel = `${NUM_TO_CHINESE[taels] || taels}兩${qian === 0 ? '' : (NUM_TO_CHINESE[qian] || qian) + '錢'}`;

    return {
        totalQian,
        totalTaels,
        totalWeight: totalTaels,
        weightText: weightLabel,
        weightLabel,
        weights: {
            yearWeight: Number((yWeight / 10).toFixed(1)),
            monthWeight: Number((mWeight / 10).toFixed(1)),
            dayWeight: Number((dWeight / 10).toFixed(1)),
            hourWeight: Number((hWeight / 10).toFixed(1))
        },
        grade: poemData.grade,
        level: poemData.grade,
        poem: poemData.poem,
        interpretation: poemData.interp,
        meaning: poemData.interp
    };
}

/**
 * lookupBaziDates (Tier 1B: 八字四柱反查西曆生辰)
 */
function lookupBaziDates(input = {}) {
    let yP = input.yearPillar;
    let mP = input.monthPillar;
    let dP = input.dayPillar;
    let hP = input.hourPillar;

    if (input.pillars && typeof input.pillars === 'string') {
        const tokens = input.pillars.trim().replace(/[年月日時\s]+/g, ' ').trim().split(/\s+/);
        if (tokens.length >= 4) {
            [yP, mP, dP, hP] = tokens;
        }
    }

    if (!yP || !mP || !dP || !hP) {
        const err = new Error('必須提供完整的年柱、月柱、日柱與時柱干支（例如：庚午 辛巳 庚辰 壬午）');
        err.statusCode = 400;
        throw err;
    }

    // 驗證 60 甲子
    for (const [name, p] of [['年柱', yP], ['月柱', mP], ['日柱', dP], ['時柱', hP]]) {
        if (!NAYIN_TABLE[p]) {
            const err = new Error(`無效的${name}干支【${p}】，請輸入正確的六十甲子`);
            err.statusCode = 400;
            throw err;
        }
    }

    const startYear = Number(input.startYear) || 1930;
    const endYear = Number(input.endYear) || 2035;

    let rawSolars = [];
    try {
        rawSolars = Solar.fromBaZi(yP, mP, dP, hP, 2, startYear);
    } catch {
        rawSolars = [];
    }

    const matches = rawSolars
        .filter(s => s.getYear() >= startYear && s.getYear() <= endYear)
        .map(s => {
            const y = s.getYear();
            const m = String(s.getMonth()).padStart(2, '0');
            const d = String(s.getDay()).padStart(2, '0');
            const h = String(s.getHour()).padStart(2, '0');
            return {
                solarDate: `${y}-${m}-${d}`,
                time: `${h}:00`,
                year: y,
                lunarText: s.getLunar().toString(),
                shichen: `${hP.slice(1)}時`,
                pillars: `${yP} ${mP} ${dP} ${hP}`
            };
        });

    return {
        pillars: { yearPillar: yP, monthPillar: mP, dayPillar: dP, hourPillar: hP },
        range: { startYear, endYear },
        count: matches.length,
        matches
    };
}

/**
 * analyzeBaziTimeSensitivity (Tier 1C: 時辰不確定敏感度分析)
 */
function analyzeBaziTimeSensitivity(input = {}) {
    if (!input.date) {
        const err = new Error('必須提供出生日期（date）');
        err.statusCode = 400;
        throw err;
    }

    const TIME_RANGES = {
        all: ['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'],
        morning: ['04:00', '06:00', '08:00', '10:00'],
        afternoon: ['12:00', '14:00', '16:00'],
        evening: ['18:00', '20:00', '22:00'],
        night: ['00:00', '02:00']
    };

    const timeRangeKey = input.timeRange || 'all';
    const candidateTimes = TIME_RANGES[timeRangeKey] || TIME_RANGES.all;

    const candidates = [];
    const fullResults = [];

    for (const timeStr of candidateTimes) {
        try {
            const res = calculateBazi({
                date: input.date,
                time: timeStr,
                calendar: input.calendar || 'solar',
                sex: input.sex || '男',
                isLeapMonth: Boolean(input.isLeapMonth)
            });
            fullResults.push(res);

            const hp = res.fourPillars[3];
            candidates.push({
                shichen: `${hp.branch}時`,
                time: timeStr,
                hourPillar: hp.value,
                tenGod: hp.tenGod,
                strength: res.strengthAnalysis.strength,
                usefulGod: res.strengthAnalysis.usefulGod,
                gejuPattern: res.geju.name || res.geju.description || '正格',
                chengguWeight: res.chenggu?.weightLabel || ''
            });
        } catch {
            continue;
        }
    }

    if (candidates.length === 0) {
        const err = new Error('無法計算候選時辰八字');
        err.statusCode = 400;
        throw err;
    }

    const first = fullResults[0];
    const strengths = new Set(candidates.map(c => c.strength));
    const usefulGods = new Set(candidates.map(c => c.usefulGod));
    const gejus = new Set(candidates.map(c => c.gejuPattern));

    const stableFacts = {
        yearPillar: first.fourPillars[0].value,
        monthPillar: first.fourPillars[1].value,
        dayPillar: first.fourPillars[2].value,
        dayMaster: first.dayMaster,
        isStrengthConsistent: strengths.size === 1,
        isUsefulGodConsistent: usefulGods.size === 1,
        isGejuConsistent: gejus.size === 1
    };

    const calibrationQuestions = [
        '【個人精力高峰與睡眠習性】：時辰帶食神傷官（如辰、巳、申時）者多為夜型人、思維跳躍富創意；時柱帶正官正印者多為晨型人、重視作息紀律。',
        '【事業推進與決策風格】：時柱透偏財、七殺者魄力大、敢於承擔風險開拓；時柱透正財、正官者講究穩健務實、重視契約與制度。',
        '【晚年願景與家庭互動】：時柱逢長生帝旺者晚運活躍自主、精神矍鑠；時柱逢墓絕衰死者晚運崇尚安靜少擾、注重心靈與健康養生。'
    ];

    return {
        date: input.date,
        birthDate: input.date,
        sex: input.sex || '男',
        timeRange: timeRangeKey,
        baseHour: input.hour || input.time || '12:00',
        candidatesCount: candidates.length,
        stableFacts,
        dayMaster: stableFacts.dayMaster,
        currentPattern: first.geju.name || first.geju.description || '正格',
        allShichenPatterns: candidates,
        candidates,
        stabilityScore: stableFacts.isStrengthConsistent && stableFacts.isUsefulGodConsistent ? 85 : 60,
        stabilityLevel: stableFacts.isStrengthConsistent ? '高度穩定' : '中度敏感',
        recommendation: stableFacts.isUsefulGodConsistent ? '喜用神全天一致，時辰不確定不影響大運核心吉凶。' : '時辰微調會改變用神取向，建議透過定盤問卷進一步核驗。',
        calibrationQuestions
    };
}

module.exports = {
    calculateBazi,
    calculateChenggu,
    lookupBaziDates,
    analyzeBaziTimeSensitivity,
    STEM_ELEMENT,
    BRANCH_ELEMENT,
    tenGod,
    CHANGSHENG_TABLE,
    calculateShensha,
    getXun
};
