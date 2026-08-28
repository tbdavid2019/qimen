const { Solar, Lunar } = require('lunar-javascript');

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

const SHICHEN_HOURS = { 子: 0, 丑: 2, 寅: 4, 卯: 6, 辰: 8, 巳: 10, 午: 12, 未: 14, 申: 16, 酉: 18, 戌: 20, 亥: 22 };
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

function parseLunarInput(input) {
    if (!input?.date) throw new Error('請提供出生日期');
    const [year, month, day] = input.date.split('-').map(Number);
    const hour = input.time ? Number(input.time.split(':')[0]) : (SHICHEN_HOURS[input.shichen] ?? 12);
    const minute = input.time ? Number(input.time.split(':')[1]) : 0;

    if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
        throw new Error('出生日期格式錯誤');
    }

    const check = new Date(Date.UTC(year, month - 1, day));
    if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) {
        throw new Error('出生日期無效');
    }

    try {
        return input.calendar === 'lunar'
            ? Lunar.fromYmd(year, input.leap ? -month : month, day).getSolar().getLunar()
            : Solar.fromYmdHms(year, month, day, hour, minute, 0).getLunar();
    } catch {
        throw new Error('出生日期無效');
    }
}

// 完整神煞計算
function calculateShensha(fourPillars, dayMasterStem, sex, yearStem) {
    const yearBranch = fourPillars[0].branch;
    const monthBranch = fourPillars[1].branch;
    const dayBranch = fourPillars[2].branch;
    const timeBranch = fourPillars[3].branch;
    const allBranches = [yearBranch, monthBranch, dayBranch, timeBranch];
    const allStems = fourPillars.map(p => p.stem);

    const results = [];

    // 天乙貴人
    const tianyiMap = { 甲: ['丑', '未'], 戊: ['丑', '未'], 乙: ['子', '申'], 己: ['子', '申'], 丙: ['亥', '酉'], 丁: ['亥', '酉'], 壬: ['卯', '巳'], 癸: ['卯', '巳'], 庚: ['丑', '未', '寅', '午'], 辛: ['寅', '午'] };
    const tianyiTargets = new Set([...(tianyiMap[yearStem] || []), ...(tianyiMap[dayMasterStem] || [])]);
    allBranches.forEach(b => {
        if (tianyiTargets.has(b) && !results.some(r => r.name === '天乙貴人' && r.branch === b)) {
            results.push({ name: '天乙貴人', type: '吉', desc: '遇難呈祥，得貴人提攜相助', branch: b });
        }
    });

    // 天德貴人 (月支查天干/地支)
    const tiandeMap = { 寅: '丁', 卯: '申', 辰: '壬', 巳: '辛', 午: '亥', 未: '甲', 申: '癸', 酉: '寅', 戌: '丙', 亥: '乙', 子: '巳', 丑: '庚' };
    const tdTarget = tiandeMap[monthBranch];
    if (allStems.includes(tdTarget) || allBranches.includes(tdTarget)) {
        results.push({ name: '天德貴人', type: '吉', desc: '天德照命，仁慈寬厚，逢凶化吉，一生少險', target: tdTarget });
    }

    // 月德貴人
    const yuedeMap = { 寅: '丙', 午: '丙', 戌: '丙', 申: '壬', 子: '壬', 辰: '壬', 亥: '甲', 卯: '甲', 未: '甲', 巳: '庚', 酉: '庚', 丑: '庚' };
    const ydTarget = yuedeMap[monthBranch];
    if (allStems.includes(ydTarget)) {
        results.push({ name: '月德貴人', type: '吉', desc: '福力深厚，逢凶化吉，一生吉祥平安', stem: ydTarget });
    }

    // 文昌貴人
    const wenchangMap = { 甲: '巳', 乙: '午', 丙: '申', 丁: '酉', 戊: '申', 己: '酉', 庚: '亥', 辛: '子', 壬: '寅', 癸: '卯' };
    const wcTarget = wenchangMap[dayMasterStem];
    if (allBranches.includes(wcTarget)) {
        results.push({ name: '文昌貴人', type: '吉', desc: '聰明過人，利學業仕途與文藝創作', branch: wcTarget });
    }

    // 太極貴人
    const taijiMap = { 甲: ['子', '午'], 乙: ['子', '午'], 丙: ['卯', '酉'], 丁: ['卯', '酉'], 戊: ['辰', '戌', '丑', '未'], 己: ['辰', '戌', '丑', '未'], 庚: ['寅', '亥'], 辛: ['寅', '亥'], 壬: ['巳', '申'], 癸: ['巳', '申'] };
    const tjTargets = taijiMap[dayMasterStem] || [];
    tjTargets.forEach(b => {
        if (allBranches.includes(b) && !results.some(r => r.name === '太極貴人' && r.branch === b)) {
            results.push({ name: '太極貴人', type: '吉', desc: '聰明好學，鑽研術數哲學，始終得福', branch: b });
        }
    });

    // 國印貴人
    const guoyinMap = { 甲: '戌', 乙: '亥', 丙: '丑', 丁: '寅', 戊: '丑', 己: '寅', 庚: '辰', 辛: '巳', 壬: '未', 癸: '申' };
    const gyTarget = guoyinMap[dayMasterStem];
    if (allBranches.includes(gyTarget)) {
        results.push({ name: '國印貴人', type: '吉', desc: '誠實可靠，掌管印綬權柄，利公職仕途', branch: gyTarget });
    }

    // 金輿
    const jinyuMap = { 甲: '辰', 乙: '巳', 丙: '未', 丁: '申', 戊: '未', 己: '申', 庚: '戌', 辛: '亥', 壬: '丑', 癸: '寅' };
    const jyTarget = jinyuMap[dayMasterStem];
    if (allBranches.includes(jyTarget)) {
        results.push({ name: '金輿', type: '吉', desc: '出入乘輿，得賢妻貴夫，晚景安泰', branch: jyTarget });
    }

    // 學堂 (長生位)
    const xuetangMap = { 木: '亥', 火: '寅', 土: '申', 金: '巳', 水: '申' };
    const xtTarget = xuetangMap[STEM_ELEMENT[dayMasterStem]];
    if (allBranches.includes(xtTarget)) {
        results.push({ name: '學堂', type: '吉', desc: '利讀書考試、文思泉湧、功名在身', branch: xtTarget });
    }

    // 天醫 (月支前一位)
    const tianyiDocMap = { 寅: '丑', 卯: '寅', 辰: '卯', 巳: '辰', 午: '巳', 未: '午', 申: '未', 酉: '申', 戌: '酉', 亥: '戌', 子: '亥', 丑: '子' };
    const tyDoc = tianyiDocMap[monthBranch];
    if (allBranches.includes(tyDoc)) {
        results.push({ name: '天醫', type: '吉', desc: '醫藥哲學天賦，能治病救人，身體抵抗力強', branch: tyDoc });
    }

    // 祿神
    const luMap = { 甲: '寅', 乙: '卯', 丙: '巳', 丁: '午', 戊: '巳', 己: '午', 庚: '申', 辛: '酉', 壬: '亥', 癸: '子' };
    const lu = luMap[dayMasterStem];
    if (allBranches.includes(lu)) {
        results.push({ name: '祿神', type: '吉', desc: '衣食無憂，財運亨通，自食其力', branch: lu });
    }

    // 羊刃
    const yangrenMap = { 甲: '卯', 乙: '寅', 丙: '午', 丁: '巳', 戊: '午', 己: '巳', 庚: '酉', 辛: '申', 壬: '子', 癸: '亥' };
    const yr = yangrenMap[dayMasterStem];
    if (allBranches.includes(yr)) {
        results.push({ name: '羊刃', type: '凶', desc: '性情剛烈果決，需修身養性以防衝動', branch: yr });
    }

    // 驛馬
    const yimaMap = { 寅: '申', 午: '申', 戌: '申', 申: '寅', 子: '寅', 辰: '寅', 巳: '亥', 酉: '亥', 丑: '亥', 亥: '巳', 卯: '巳', 未: '巳' };
    const ym = yimaMap[yearBranch] || yimaMap[dayBranch];
    if (allBranches.includes(ym)) {
        results.push({ name: '驛馬', type: '吉', desc: '志在四方，利外出發展、經商與跨界', branch: ym });
    }

    // 桃花 / 咸池
    const taohuaMap = { 寅: '卯', 午: '卯', 戌: '卯', 申: '酉', 子: '酉', 辰: '酉', 巳: '午', 酉: '午', 丑: '午', 亥: '子', 卯: '子', 未: '子' };
    const th = taohuaMap[yearBranch] || taohuaMap[dayBranch];
    if (allBranches.includes(th)) {
        results.push({ name: '桃花 (咸池)', type: '中', desc: '風度翩翩，魅力出眾，異性緣佳', branch: th });
    }

    // 華蓋
    const huagaiMap = { 寅: '戌', 午: '戌', 戌: '戌', 申: '辰', 子: '辰', 辰: '辰', 巳: '丑', 酉: '丑', 丑: '丑', 亥: '未', 卯: '未', 未: '未' };
    const hg = huagaiMap[yearBranch] || huagaiMap[dayBranch];
    if (allBranches.includes(hg)) {
        results.push({ name: '華蓋', type: '吉', desc: '才華出眾，具有哲學、文藝與精神探索天賦', branch: hg });
    }

    // 將星
    const jiangxingMap = { 寅: '午', 午: '午', 戌: '午', 申: '子', 子: '子', 辰: '子', 巳: '酉', 酉: '酉', 丑: '酉', 亥: '卯', 卯: '卯', 未: '卯' };
    const jx = jiangxingMap[yearBranch] || jiangxingMap[dayBranch];
    if (allBranches.includes(jx)) {
        results.push({ name: '將星', type: '吉', desc: '具備領導力與決斷力，利掌權管理', branch: jx });
    }

    // 劫煞 (申子辰在巳，寅午戌在亥，巳酉丑在寅，亥卯未在申)
    const jieshaMap = { 申: '巳', 子: '巳', 辰: '巳', 寅: '亥', 午: '亥', 戌: '亥', 巳: '寅', 酉: '寅', 丑: '寅', 亥: '申', 卯: '申', 未: '申' };
    const js = jieshaMap[yearBranch] || jieshaMap[dayBranch];
    if (allBranches.includes(js)) {
        results.push({ name: '劫煞', type: '凶', desc: '多阻礙爭奪，行事務必穩健謹慎', branch: js });
    }

    // 災煞 (申子辰在午，寅午戌在子，巳酉丑在卯，亥卯未在酉)
    const zaishaMap = { 申: '午', 子: '午', 辰: '午', 寅: '子', 午: '子', 戌: '子', 巳: '卯', 酉: '卯', 丑: '卯', 亥: '酉', 卯: '酉', 未: '酉' };
    const zs = zaishaMap[yearBranch] || zaishaMap[dayBranch];
    if (allBranches.includes(zs)) {
        results.push({ name: '災煞', type: '凶', desc: '注意意外與是非，遵紀守法保平安', branch: zs });
    }

    // 亡神 (申子辰在亥，寅午戌在巳，巳酉丑在申，亥卯未在寅)
    const wangshenMap = { 申: '亥', 子: '亥', 辰: '亥', 寅: '巳', 午: '巳', 戌: '巳', 巳: '申', 酉: '申', 丑: '申', 亥: '寅', 卯: '寅', 未: '寅' };
    const ws = wangshenMap[yearBranch] || wangshenMap[dayBranch];
    if (allBranches.includes(ws)) {
        results.push({ name: '亡神', type: '凶', desc: '思維敏銳但易有偏激，需修心靜氣', branch: ws });
    }

    // 孤辰 / 寡宿
    const guchenMap = { 亥: '寅', 子: '寅', 丑: '寅', 寅: '巳', 卯: '巳', 辰: '巳', 巳: '申', 午: '申', 未: '申', 申: '亥', 酉: '亥', 戌: '亥' };
    const guasuMap = { 亥: '戌', 子: '戌', 丑: '戌', 寅: '丑', 卯: '丑', 辰: '丑', 巳: '辰', 午: '辰', 未: '辰', 申: '未', 酉: '未', 戌: '未' };
    const gc = guchenMap[yearBranch];
    const gs = guasuMap[yearBranch];
    if (allBranches.includes(gc)) results.push({ name: '孤辰', type: '中', desc: '性情清高孤芳，喜獨立獨處', branch: gc });
    if (allBranches.includes(gs)) results.push({ name: '寡宿', type: '中', desc: '內心寧靜獨居，重視精神私密世界', branch: gs });

    return results;
}

// 判定格局
function determineGeJu(fourPillars, dayMasterStem) {
    const monthBranch = fourPillars[1].branch;
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
    const monthBranch = fourPillars[1].branch;
    const dayElement = STEM_ELEMENT[dayMasterStem];
    const monthElement = BRANCH_ELEMENT[monthBranch];

    const sameOrGenerate = (e) => e === dayElement || GENERATE[e] === dayElement;

    // 得令判定
    const isDeLing = sameOrGenerate(monthElement);

    // 得地判定（地支藏干中是否有同類五行）
    let deDiCount = 0;
    fourPillars.forEach(p => {
        const hidden = HIDDEN[p.branch] || [];
        hidden.forEach(h => {
            if (STEM_ELEMENT[h] === dayElement) deDiCount++;
        });
    });

    // 得勢判定（天干是否有印比）
    let deShiCount = 0;
    fourPillars.forEach((p, idx) => {
        if (idx !== 2 && sameOrGenerate(STEM_ELEMENT[p.stem])) deShiCount++;
    });

    let strength = '身弱';
    if (isDeLing && (deDiCount >= 2 || deShiCount >= 1)) {
        strength = '身旺';
    } else if (!isDeLing && (deDiCount >= 3 || (deDiCount >= 2 && deShiCount >= 2))) {
        strength = '身旺';
    }

    // 喜用神判定
    let usefulGod = '';
    let tabooGod = '';
    if (strength === '身旺') {
        const draining = GENERATE[dayElement]; // 食傷
        const controlling = CONTROL[dayElement]; // 財星
        usefulGod = `食傷[${draining}]、財星[${controlling}]為喜用神（泄秀生財）`;
        tabooGod = `印星[${Object.keys(GENERATE).find(k => GENERATE[k] === dayElement)}]、比劫[${dayElement}]為忌神`;
    } else {
        const mother = Object.keys(GENERATE).find(k => GENERATE[k] === dayElement); // 印
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
    const lunar = parseLunarInput(input);
    const eight = lunar.getEightChar();
    const values = [eight.getYear(), eight.getMonth(), eight.getDay(), eight.getTime()];
    const labels = ['年柱', '月柱', '日柱', '時柱'];
    const dayStem = eight.getDayGan();

    const fourPillars = values.map((value, index) => ({
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
    }));

    const counts = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
    fourPillars.forEach((pillar) => {
        counts[pillar.element] += 1;
        counts[pillar.branchElement] += 1;
    });

    const totalElements = Object.values(counts).reduce((a, b) => a + b, 0);
    const elementPercentages = {};
    for (const [k, v] of Object.entries(counts)) {
        elementPercentages[k] = Math.round((v / totalElements) * 100);
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
    if (input.time) {
        const [h, m] = input.time.split(':').map(Number);
        if (Number.isInteger(h) && Number.isInteger(m)) {
            const isOddHour = h % 2 === 1;
            if ((isOddHour && m <= 15) || (!isOddHour && m >= 45)) {
                timeBorderWarning = '出生時間靠近時辰交界（±15分鐘），若有出生地真太陽時偏差可能跨時辰，建議結合前後時辰印證。';
            }
        }
    }

    return {
        profile: {
            ...input,
            solarDate: `${lunar.getSolar().getYear()}-${String(lunar.getSolar().getMonth()).padStart(2, '0')}-${String(lunar.getSolar().getDay()).padStart(2, '0')}`,
            lunar: lunar.toString(),
            startYunAge,
            timeBorderWarning
        },
        fourPillars,
        dayMaster: { stem: dayStem, element: STEM_ELEMENT[dayStem] },
        fiveElements: { counts, percentages: elementPercentages, total: totalElements },
        geju,
        strengthAnalysis,
        shensha,
        luckCycles,
        annualCycles
    };
}

module.exports = { calculateBazi, STEM_ELEMENT, BRANCH_ELEMENT, tenGod, CHANGSHENG_TABLE };
