const { Lunar, Solar } = require('lunar-javascript');

const DIRECTIONS_8 = ['北', '東北', '東', '東南', '南', '西南', '西', '西北'];
const PALACES_9 = ['中', '西北', '西', '東北', '南', '北', '西南', '東', '東南'];
const LUOSHU_PALACE_ORDER = ['中', '西北', '西', '東北', '南', '北', '西南', '東', '東南'];

// 八宅明鏡：各宅坐向對應宅卦
const HOUSE_BY_FACING = {
    南: '坎宅 (坐北朝南)',
    北: '離宅 (坐南朝北)',
    西: '震宅 (坐東朝西)',
    東: '兌宅 (坐西朝東)',
    東南: '乾宅 (坐西北朝東南)',
    西北: '巽宅 (坐東南朝西北)',
    東北: '坤宅 (坐西南朝東北)',
    西南: '艮宅 (坐東北朝西南)'
};

// 24山三元龍與陰陽配置 (九運五黃寄艮八宮：天元艮陽，地元丑陰，人元寅陽)
const PALACE_DRAGONS = {
    1: { 地: { stem: '壬', polarity: '陽' }, 天: { stem: '子', polarity: '陰' }, 人: { stem: '癸', polarity: '陰' } },
    2: { 地: { stem: '未', polarity: '陰' }, 天: { stem: '坤', polarity: '陽' }, 人: { stem: '申', polarity: '陽' } },
    3: { 地: { stem: '甲', polarity: '陽' }, 天: { stem: '卯', polarity: '陰' }, 人: { stem: '乙', polarity: '陰' } },
    4: { 地: { stem: '辰', polarity: '陰' }, 天: { stem: '巽', polarity: '陽' }, 人: { stem: '巳', polarity: '陽' } },
    5: { 地: { stem: '丑', polarity: '陰' }, 天: { stem: '艮', polarity: '陽' }, 人: { stem: '寅', polarity: '陽' } },
    6: { 地: { stem: '戌', polarity: '陰' }, 天: { stem: '乾', polarity: '陽' }, 人: { stem: '亥', polarity: '陽' } },
    7: { 地: { stem: '庚', polarity: '陽' }, 天: { stem: '酉', polarity: '陰' }, 人: { stem: '辛', polarity: '陰' } },
    8: { 地: { stem: '丑', polarity: '陰' }, 天: { stem: '艮', polarity: '陽' }, 人: { stem: '寅', polarity: '陽' } },
    9: { 地: { stem: '丙', polarity: '陽' }, 天: { stem: '午', polarity: '陰' }, 人: { stem: '丁', polarity: '陰' } }
};

// 24山坐向詳細定義
const TWENTY_FOUR_MOUNTAINS = {
    '壬山丙向': { house: '坎宅 (坐北朝南)', facingDir: '南', sittingDir: '北', sittingPalace: 1, facingPalace: 9, dragon: '地' },
    '子山午向': { house: '坎宅 (坐北朝南)', facingDir: '南', sittingDir: '北', sittingPalace: 1, facingPalace: 9, dragon: '天' },
    '癸山丁向': { house: '坎宅 (坐北朝南)', facingDir: '南', sittingDir: '北', sittingPalace: 1, facingPalace: 9, dragon: '人' },
    '丑山未向': { house: '艮宅 (坐東北朝西南)', facingDir: '西南', sittingDir: '東北', sittingPalace: 8, facingPalace: 2, dragon: '地' },
    '艮山坤向': { house: '艮宅 (坐東北朝西南)', facingDir: '西南', sittingDir: '東北', sittingPalace: 8, facingPalace: 2, dragon: '天' },
    '寅山申向': { house: '艮宅 (坐東北朝西南)', facingDir: '西南', sittingDir: '東北', sittingPalace: 8, facingPalace: 2, dragon: '人' },
    '甲山庚向': { house: '震宅 (坐東朝西)', facingDir: '西', sittingDir: '東', sittingPalace: 3, facingPalace: 7, dragon: '地' },
    '卯山酉向': { house: '震宅 (坐東朝西)', facingDir: '西', sittingDir: '東', sittingPalace: 3, facingPalace: 7, dragon: '天' },
    '乙山辛向': { house: '震宅 (坐東朝西)', facingDir: '西', sittingDir: '東', sittingPalace: 3, facingPalace: 7, dragon: '人' },
    '辰山戌向': { house: '巽宅 (坐東南朝西北)', facingDir: '西北', sittingDir: '東南', sittingPalace: 4, facingPalace: 6, dragon: '地' },
    '巽山乾向': { house: '巽宅 (坐東南朝西北)', facingDir: '西北', sittingDir: '東南', sittingPalace: 4, facingPalace: 6, dragon: '天' },
    '巳山亥向': { house: '巽宅 (坐東南朝西北)', facingDir: '西北', sittingDir: '東南', sittingPalace: 4, facingPalace: 6, dragon: '人' },
    '丙山壬向': { house: '離宅 (坐南朝北)', facingDir: '北', sittingDir: '南', sittingPalace: 9, facingPalace: 1, dragon: '地' },
    '午山子向': { house: '離宅 (坐南朝北)', facingDir: '北', sittingDir: '南', sittingPalace: 9, facingPalace: 1, dragon: '天' },
    '丁山癸向': { house: '離宅 (坐南朝北)', facingDir: '北', sittingDir: '南', sittingPalace: 9, facingPalace: 1, dragon: '人' },
    '未山丑向': { house: '坤宅 (坐西南朝東北)', facingDir: '東北', sittingDir: '西南', sittingPalace: 2, facingPalace: 8, dragon: '地' },
    '坤山艮向': { house: '坤宅 (坐西南朝東北)', facingDir: '東北', sittingDir: '西南', sittingPalace: 2, facingPalace: 8, dragon: '天' },
    '申山寅向': { house: '坤宅 (坐西南朝東北)', facingDir: '東北', sittingDir: '西南', sittingPalace: 2, facingPalace: 8, dragon: '人' },
    '庚山甲向': { house: '兌宅 (坐西朝東)', facingDir: '東', sittingDir: '西', sittingPalace: 7, facingPalace: 3, dragon: '地' },
    '酉山卯向': { house: '兌宅 (坐西朝東)', facingDir: '東', sittingDir: '西', sittingPalace: 7, facingPalace: 3, dragon: '天' },
    '辛山乙向': { house: '兌宅 (坐西朝東)', facingDir: '東', sittingDir: '西', sittingPalace: 7, facingPalace: 3, dragon: '人' },
    '戌山辰向': { house: '乾宅 (坐西北朝東南)', facingDir: '東南', sittingDir: '西北', sittingPalace: 6, facingPalace: 4, dragon: '地' },
    '乾山巽向': { house: '乾宅 (坐西北朝東南)', facingDir: '東南', sittingDir: '西北', sittingPalace: 6, facingPalace: 4, dragon: '天' },
    '亥山巳向': { house: '乾宅 (坐西北朝東南)', facingDir: '東南', sittingDir: '西北', sittingPalace: 6, facingPalace: 4, dragon: '人' }
};

const MING_GUA = { 1: '坎', 2: '坤', 3: '震', 4: '巽', 6: '乾', 7: '兌', 8: '艮', 9: '離' };

const EIGHT_MANSIONS = {
    '坎宅': { 北: '伏位', 東北: '五鬼', 東: '天醫', 東南: '生氣', 南: '延年', 西南: '絕命', 西: '禍害', 西北: '六煞' },
    '坤宅': { 北: '絕命', 東北: '生氣', 東: '禍害', 東南: '五鬼', 南: '六煞', 西南: '伏位', 西: '天醫', 西北: '延年' },
    '震宅': { 北: '天醫', 東北: '六煞', 東: '伏位', 東南: '延年', 南: '生氣', 西南: '禍害', 西: '絕命', 西北: '五鬼' },
    '巽宅': { 北: '生氣', 東北: '絕命', 東: '延年', 東南: '伏位', 南: '天醫', 西南: '五鬼', 西: '六煞', 西北: '禍害' },
    '乾宅': { 北: '六煞', 東北: '天醫', 東: '五鬼', 東南: '禍害', 南: '絕命', 西南: '延年', 西: '生氣', 西北: '伏位' },
    '兌宅': { 北: '禍害', 東北: '延年', 東: '絕命', 東南: '六煞', 南: '五鬼', 西南: '天醫', 西: '伏位', 西北: '生氣' },
    '艮宅': { 北: '五鬼', 東北: '伏位', 東: '六煞', 東南: '絕命', 南: '禍害', 西南: '生氣', 西: '延年', 西北: '天醫' },
    '離宅': { 北: '延年', 東北: '禍害', 東: '生氣', 東南: '天醫', 南: '伏位', 西南: '六煞', 西: '五鬼', 西北: '絕命' }
};

// 洛書九星飛布
function flyLuoshu(centerStar, isForward = true) {
    const res = {};
    LUOSHU_PALACE_ORDER.forEach((palace, step) => {
        const star = isForward
            ? (centerStar - 1 + step) % 9 + 1
            : (centerStar - 1 - step + 18) % 9 + 1;
        res[palace] = star;
    });
    return res;
}

// 命卦計算
function calculateMingGua(year, sex) {
    const numYear = Number(year);
    if (!Number.isInteger(numYear)) return { number: 9, name: '離', type: '東四命' };
    let sum = String(numYear % 100).split('').reduce((a, b) => Number(a) + Number(b), 0);
    while (sum > 9) {
        sum = String(sum).split('').reduce((a, b) => Number(a) + Number(b), 0);
    }

    let guaNum = sex === '女' ? (sum + 5) % 9 || 9 : (10 - sum + 9) % 9 || 9;
    if (guaNum === 5) guaNum = sex === '女' ? 2 : 8;

    const isEast = [1, 3, 4, 9].includes(guaNum);
    return {
        number: guaNum,
        name: MING_GUA[guaNum] || '離',
        type: isEast ? '東四命' : '西四命'
    };
}

// 流年中宮星計算
function getAnnualCenterStar(year) {
    const y = Number(year) || new Date().getFullYear();
    const star = ((11 - (y % 9)) % 9) || 9;
    return star;
}

// 玄空三元九運計算
function getPeriod(moveInYear) {
    const y = Number(moveInYear) || new Date().getFullYear();
    if (y >= 2024 && y <= 2043) return 9;
    if (y >= 2004 && y <= 2023) return 8;
    if (y >= 1984 && y <= 2003) return 7;
    if (y >= 1964 && y <= 1983) return 6;
    if (y >= 1944 && y <= 1963) return 5;
    if (y >= 1924 && y <= 1943) return 4;
    return 9;
}

// 24山動態玄空飛星排盤
function calculateXuanKong24(facingInput, moveInYear, year) {
    let mountKey = Object.keys(TWENTY_FOUR_MOUNTAINS).find(k => k === facingInput || k.includes(facingInput));
    if (!mountKey) {
        const map8 = { 南: '子山午向', 北: '午山子向', 東: '酉山卯向', 西: '卯山酉向', 東南: '乾山巽向', 西北: '巽山乾向', 東北: '坤山艮向', 西南: '艮山坤向' };
        mountKey = map8[facingInput] || '子山午向';
    }

    const mountInfo = TWENTY_FOUR_MOUNTAINS[mountKey];
    const period = getPeriod(moveInYear);
    const periodChart = flyLuoshu(period, true);

    const sittingDir = mountInfo.sittingDir;
    const facingDir = mountInfo.facingDir;
    const dragonType = mountInfo.dragon;

    // 山星入中與順逆
    const sittingBaseStar = periodChart[sittingDir];
    const sittingDragon = PALACE_DRAGONS[sittingBaseStar]?.[dragonType] || { polarity: '陽' };
    const isMountainForward = sittingDragon.polarity === '陽';
    const mountainChart = flyLuoshu(sittingBaseStar, isMountainForward);

    // 向星入中與順逆
    const facingBaseStar = periodChart[facingDir];
    const facingDragon = PALACE_DRAGONS[facingBaseStar]?.[dragonType] || { polarity: '陽' };
    const isFacingForward = facingDragon.polarity === '陽';
    const facingChart = flyLuoshu(facingBaseStar, isFacingForward);

    // 流年飛星
    const annualCenter = getAnnualCenterStar(year);
    const annualChart = flyLuoshu(annualCenter, true);

    // 格局判定 (旺山旺向 / 雙星到向 / 雙星到坐 / 上山下水)
    const sittingMountainStar = mountainChart[sittingDir];
    const sittingFacingStar = facingChart[sittingDir];
    const facingMountainStar = mountainChart[facingDir];
    const facingFacingStar = facingChart[facingDir];

    let pattern = '常規格局';
    let patternDesc = '各宮星氣流通，依吉凶配置佈局';

    if (sittingMountainStar === period && facingFacingStar === period) {
        pattern = '旺山旺向';
        patternDesc = '丁財兩旺（坐山見山利人丁健康，向首見水利財源廣進）';
    } else if (facingMountainStar === period && facingFacingStar === period) {
        pattern = '雙星到向';
        patternDesc = '旺財不旺丁（向首丁財二星交會，最宜開闊明堂或水景聚財）';
    } else if (sittingMountainStar === period && sittingFacingStar === period) {
        pattern = '雙星到坐';
        patternDesc = '旺丁不旺財（坐山丁財二星齊聚，利人丁興旺，財運宜在坐方補氣）';
    } else if (facingMountainStar === period && sittingFacingStar === period) {
        pattern = '上山下水';
        patternDesc = '損丁破財之局（坐向顛倒，宜用轉向、屏風或五行吉祥物化解）';
    }

    return {
        mountKey,
        house: mountInfo.house,
        facingDir,
        sittingDir,
        period,
        pattern,
        patternDesc,
        charts: {
            period: periodChart,
            mountain: mountainChart,
            facing: facingChart,
            annual: annualChart
        }
    };
}

// 綜合陽宅風水分析
function calculateFengShui(input = {}) {
    const facing = input.facing || '南';
    const moveInYear = Number(input.moveInYear) || new Date().getFullYear();
    const residentYear = Number(input.residentYear) || 1990;
    const sex = input.sex || '男';
    const year = Number(input.year) || new Date().getFullYear();

    const xk = calculateXuanKong24(facing, moveInYear, year);
    const houseName = xk.house.split(' ')[0];
    const eightMansions = EIGHT_MANSIONS[houseName] || EIGHT_MANSIONS['坎宅'];
    const residentGua = calculateMingGua(residentYear, sex);

    const palaceDetails = PALACES_9.map((palace) => {
        if (palace === '中') {
            return {
                direction: '中宮',
                type: '太極立極',
                periodStar: xk.charts.period['中'],
                mountainStar: xk.charts.mountain['中'],
                facingStar: xk.charts.facing['中'],
                annualStar: xk.charts.annual['中'],
                mansions: '立極核心',
                nature: '樞紐'
            };
        }

        const mStar = xk.charts.mountain[palace];
        const fStar = xk.charts.facing[palace];
        const aStar = xk.charts.annual[palace];
        const pStar = xk.charts.period[palace];
        const mansion = eightMansions[palace] || '平';

        const isGoodMansion = ['生氣', '天醫', '延年', '伏位'].includes(mansion);
        const isGoodFacing = [8, 9, 1].includes(fStar);

        let advice = '平穩氣場，宜保持通風明亮';
        if (aStar === 5) advice = '【五黃大煞】宜靜不宜動，避免動土，可掛六帝錢或金屬風鈴化解';
        else if (aStar === 2) advice = '【二黑病符】注意腸胃健康，忌見紅黃，宜用銅葫蘆化解';
        else if (fStar === 9) advice = '【九紫當令旺氣】當運財星，最宜作客廳、大門、主臥或開窗納氣';
        else if (mansion === '生氣') advice = '【生氣大吉】八宅第一吉位，生氣勃發，利事業升遷與學業';
        else if (mansion === '絕命') advice = '【絕命凶位】八宅破財耗損位，忌作大門或臥房，宜作衛浴或儲藏室壓煞';

        return {
            direction: palace,
            periodStar: pStar,
            mountainStar: mStar,
            facingStar: fStar,
            annualStar: aStar,
            mansions: mansion,
            nature: (isGoodMansion || isGoodFacing) ? '吉' : '凶',
            advice
        };
    });

    return {
        period: xk.period,
        pattern: xk.pattern,
        patternDesc: xk.patternDesc,
        profile: {
            facing: xk.mountKey,
            house: xk.house,
            period: `${xk.period}運 (2024-2043)`,
            pattern: xk.pattern,
            patternDesc: xk.patternDesc,
            residentYear,
            residentGua: `${residentGua.name}卦 (${residentGua.type})`,
            annualYear: `${year}年`
        },
        flyingStars: {
            base: xk.charts.period,
            mountain: xk.charts.mountain,
            facing: xk.charts.facing,
            annual: xk.charts.annual
        },
        eightMansions: {
            house: houseName,
            directions: eightMansions
        },
        resident: {
            mingGua: residentGua
        },
        palaceDetails,
        summary: `【${xk.mountKey} · ${xk.house}】處於三元玄空${xk.period}運。格局為【${xk.pattern}】（${xk.patternDesc}）。宅主命卦為【${residentGua.name}卦】（${residentGua.type}）。`
    };
}

// 煞氣診斷
function diagnoseShaqi(shaType = '天斬煞') {
    const SHA_DATABASE = {
        '天斬煞': { desc: '兩座高樓之間狹窄空隙如刀劈下，氣流劇烈衝擊', effect: '易引發血光之災、手術或財運突發破耗', remedy: '在受煞方位懸掛泰山石敢當、開光八卦凸鏡或擺放厚重綠植屏風阻擋。' },
        '路衝煞': { desc: '道路或走廊筆直正對大門或陽台', effect: '氣流直衝宅第，家宅不寧，多口舌是非與破財', remedy: '設置玄關、屏風阻隔，外置泰山石敢當或山海鎮化解。' },
        '尖角煞': { desc: '鄰近建物屋角正對窗戶或大門', effect: '造成心理壓迫感，易有意外擦傷或人際衝突', remedy: '懸掛八卦凸鏡反射煞氣，或窗台種植闊葉植物緩衝。' },
        '反弓煞': { desc: '道路或河流呈弧形反弓背對大門', effect: '氣場離散，不易聚財，人丁易生叛逆或離鄉', remedy: '設置綠色灌木帶、水景聚氣或懸掛山海鎮。' },
        '壁刀煞': { desc: '對面建築物的一側牆面正切自家房屋', effect: '如刀刃切入，主家人健康欠佳，易有意外', remedy: '於切入方位安裝凸鏡、懸掛五帝錢或厚重窗簾常閉。' },
        '白虎煞': { desc: '住宅右側（白虎方）動土或建物高於左側（青龍方）', effect: '易遭小人算計、是非官司或女性健康欠安', remedy: '青龍方增置高大綠植或青龍吉祥物增旺龍邊，白虎方安放銅麒麟制煞。' },
        '穿堂煞': { desc: '大門正對客廳陽台或後門，前後一眼望穿', effect: '氣流直進直出，無法藏風聚氣，財來財去不聚財', remedy: '於玄關設置不透光屏風、屏門或厚重珠簾，使氣流曲折迂迴。' }
    };

    const foundKey = Object.keys(SHA_DATABASE).find(k => shaType.includes(k)) || '天斬煞';
    const info = SHA_DATABASE[foundKey];

    return {
        shaType: foundKey,
        description: info.desc,
        influence: info.effect,
        remedy: info.remedy,
        summary: `【${foundKey}診斷】${info.desc}。影響：${info.effect}。化解之策：${info.remedy}`
    };
}

// 五鼠遁推算吉時
function getAuspiciousHours(dayGan) {
    const WUSHUDUN_START = { 甲: 0, 己: 0, 乙: 2, 庚: 2, 丙: 4, 辛: 4, 丁: 6, 壬: 6, 戊: 8, 癸: 8 };
    const hoursDesc = [
        '子時 (23:00-01:00)', '丑時 (01:00-03:00)', '寅時 (03:00-05:00)', '卯時 (05:00-07:00)',
        '辰時 (07:00-09:00)', '巳時 (09:00-11:00)', '午時 (11:00-13:00)', '未時 (13:00-15:00)',
        '申時 (15:00-17:00)', '酉時 (17:00-19:00)', '戌時 (19:00-21:00)', '亥時 (21:00-23:00)'
    ];

    const luckyIndices = [4, 5, 6];
    const res = luckyIndices.map(idx => hoursDesc[idx]);
    return res.join('、');
}

// 動態協紀辨方擇日
function chooseZeri(matter = '入宅/喬遷', year = 2026, month = 5) {
    const y = Number(year) || 2026;
    const m = Number(month) || 5;

    const branches = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
    const yearZhiIdx = (y - 4) % 12;
    const yearZhi = branches[yearZhiIdx];

    const suiPoZhi = branches[(yearZhiIdx + 6) % 12];
    const suiPoDir = { 子: '正北 (子位)', 丑: '東北 (丑位)', 寅: '東北 (寅位)', 卯: '正東 (卯位)', 辰: '東南 (辰位)', 巳: '東南 (巳位)', 午: '正南 (午位)', 未: '西南 (未位)', 申: '西南 (申位)', 酉: '正西 (酉位)', 戌: '西北 (戌位)', 亥: '西北 (亥位)' }[suiPoZhi];

    const sanShaMap = {
        申: '南方 (巳午未)', 子: '南方 (巳午未)', 辰: '南方 (巳午未)',
        寅: '北方 (亥子丑)', 午: '北方 (亥子丑)', 戌: '北方 (亥子丑)',
        巳: '東方 (寅卯辰)', 酉: '東方 (寅卯辰)', 丑: '東方 (寅卯辰)',
        亥: '西方 (申酉戌)', 卯: '西方 (申酉戌)', 未: '西方 (申酉戌)'
    };
    const sanShaDir = sanShaMap[yearZhi] || '北方 (亥子丑)';

    const auspiciousDates = [];
    const daysInMonth = new Date(y, m, 0).getDate();

    for (let d = 1; d <= daysInMonth; d++) {
        try {
            const solar = Solar.fromYmd(y, m, d);
            const lunar = solar.getLunar();
            const jianXing = lunar.getZhiXing();
            const ganzhi = lunar.getDayInGanZhi();
            const dayGan = ganzhi[0];
            const dayZhi = ganzhi[1];

            if (dayZhi === suiPoZhi) continue;

            if (['成', '開', '定', '執'].includes(jianXing)) {
                const bestHours = getAuspiciousHours(dayGan);
                const gods = lunar.getDayJiShen().slice(0, 3).join('、') || '天德、天恩、三合';

                auspiciousDates.push({
                    day: `${y}年${String(m).padStart(2, '0')}月${String(d).padStart(2, '0')}日`,
                    stemBranch: `${ganzhi}日`,
                    jianXing: `${jianXing}日 (大吉)`,
                    gods,
                    bestHours
                });
            }
        } catch {}
    }

    const selectedDates = auspiciousDates.slice(0, 3);

    return {
        mode: 'zeri',
        matter,
        year: y,
        month: m,
        suiPoWarning: `歲破方位：【${suiPoDir}】，重大事項避免朝此方位大動干戈。`,
        sanShaWarning: `流年三煞方位：【${sanShaDir}】，修造動土切忌在此方起工。`,
        auspiciousDates: selectedDates,
        summary: `【${matter} · ${y}年${m}月協紀辨方擇日】依建除十二神與神煞精選吉期，避開歲破【${suiPoDir}】與三煞【${sanShaDir}】。宜從宅主命卦生氣方入門最吉。`
    };
}

module.exports = {
    DIRECTIONS_8,
    PALACES_9,
    TWENTY_FOUR_MOUNTAINS,
    HOUSE_BY_FACING,
    EIGHT_MANSIONS,
    calculateMingGua,
    getAnnualCenterStar,
    getPeriod,
    flyLuoshu,
    calculateXuanKong24,
    calculateFengShui,
    diagnoseShaqi,
    chooseZeri
};
