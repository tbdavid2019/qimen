const DIRECTIONS_8 = ['北', '東北', '東', '東南', '南', '西南', '西', '西北'];
const PALACES_9 = ['中', '西北', '西', '東北', '南', '北', '西南', '東', '東南'];

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

// 24山坐向與八宅對應
const TWENTY_FOUR_MOUNTAINS = {
    '壬山丙向': { house: '坎宅 (坐北朝南)', facingDir: '南', sittingDir: '北', period9Pattern: '雙星到向' },
    '子山午向': { house: '坎宅 (坐北朝南)', facingDir: '南', sittingDir: '北', period9Pattern: '上山下水' },
    '癸山丁向': { house: '坎宅 (坐北朝南)', facingDir: '南', sittingDir: '北', period9Pattern: '上山下水' },
    '丑山未向': { house: '艮宅 (坐東北朝西南)', facingDir: '西南', sittingDir: '東北', period9Pattern: '雙星到坐' },
    '艮山坤向': { house: '艮宅 (坐東北朝西南)', facingDir: '西南', sittingDir: '東北', period9Pattern: '旺山旺向' },
    '寅山申向': { house: '艮宅 (坐東北朝西南)', facingDir: '西南', sittingDir: '東北', period9Pattern: '旺山旺向' },
    '甲山庚向': { house: '震宅 (坐東朝西)', facingDir: '西', sittingDir: '東', period9Pattern: '雙星到向' },
    '卯山酉向': { house: '震宅 (坐東朝西)', facingDir: '西', sittingDir: '東', period9Pattern: '雙星到向' },
    '乙山辛向': { house: '震宅 (坐東朝西)', facingDir: '西', sittingDir: '東', period9Pattern: '雙星到向' },
    '辰山戌向': { house: '巽宅 (坐東南朝西北)', facingDir: '西北', sittingDir: '東南', period9Pattern: '雙星到向' },
    '巽山乾向': { house: '巽宅 (坐東南朝西北)', facingDir: '西北', sittingDir: '東南', period9Pattern: '旺山旺向' },
    '巳山亥向': { house: '巽宅 (坐東南朝西北)', facingDir: '西北', sittingDir: '東南', period9Pattern: '旺山旺向' },
    '丙山壬向': { house: '離宅 (坐南朝北)', facingDir: '北', sittingDir: '南', period9Pattern: '雙星到坐' },
    '午山子向': { house: '離宅 (坐南朝北)', facingDir: '北', sittingDir: '南', period9Pattern: '旺山旺向' },
    '丁山癸向': { house: '離宅 (坐南朝北)', facingDir: '北', sittingDir: '南', period9Pattern: '旺山旺向' },
    '未山丑向': { house: '坤宅 (坐西南朝東北)', facingDir: '東北', sittingDir: '西南', period9Pattern: '雙星到向' },
    '坤山艮向': { house: '坤宅 (坐西南朝東北)', facingDir: '東北', sittingDir: '西南', period9Pattern: '上山下水' },
    '申山寅向': { house: '坤宅 (坐西南朝東北)', facingDir: '東北', sittingDir: '西南', period9Pattern: '上山下水' },
    '庚山甲向': { house: '兌宅 (坐西朝東)', facingDir: '東', sittingDir: '西', period9Pattern: '雙星到坐' },
    '酉山卯向': { house: '兌宅 (坐西朝東)', facingDir: '東', sittingDir: '西', period9Pattern: '雙星到坐' },
    '辛山乙向': { house: '兌宅 (坐西朝東)', facingDir: '東', sittingDir: '西', period9Pattern: '雙星到坐' },
    '戌山辰向': { house: '乾宅 (坐西北朝東南)', facingDir: '東南', sittingDir: '西北', period9Pattern: '雙星到坐' },
    '乾山巽向': { house: '乾宅 (坐西北朝東南)', facingDir: '東南', sittingDir: '西北', period9Pattern: '上山下水' },
    '亥山巳向': { house: '乾宅 (坐西北朝東南)', facingDir: '東南', sittingDir: '西北', period9Pattern: '上山下水' }
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
function flyStars(centerStar, isForward = true) {
    const sequence = isForward
        ? [5, 6, 7, 8, 9, 1, 2, 3, 4]
        : [5, 4, 3, 2, 1, 9, 8, 7, 6];
    
    // 宮位順序：中(0)、西北(1)、西(2)、東北(3)、南(4)、北(5)、西南(6)、東(7)、東南(8)
    const result = {};
    const offset = (centerStar - 5 + 9) % 9;
    
    PALACES_9.forEach((palace, index) => {
        const step = isForward ? (index + offset) % 9 : (offset - index + 18) % 9;
        result[palace] = sequence[step];
    });
    return result;
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
    // 2024: 4, 2025: 3, 2026: 2, 2027: 1, 2028: 9...
    const star = ((11 - (y % 9)) % 9) || 9;
    return star;
}

// 1. 陽宅玄空飛星與八宅分析
function calculateFengShui(input = {}) {
    const facingRaw = input.facing || '南';
    let facing = facingRaw;
    let houseKey = '坎宅';
    let houseName = '坎宅 (坐北朝南)';
    let period9Pattern = '旺山旺向';

    if (TWENTY_FOUR_MOUNTAINS[facingRaw]) {
        const m = TWENTY_FOUR_MOUNTAINS[facingRaw];
        houseName = m.house;
        houseKey = m.house.split(' ')[0];
        facing = m.facingDir;
        period9Pattern = m.period9Pattern;
    } else if (HOUSE_BY_FACING[facingRaw]) {
        houseName = HOUSE_BY_FACING[facingRaw];
        houseKey = houseName.split(' ')[0];
    }

    const eightMansionsMap = EIGHT_MANSIONS[houseKey] || EIGHT_MANSIONS['坎宅'];

    const moveInYear = Number(input.moveInYear) || 2024;
    // 判定元運
    let period = 9;
    if (moveInYear >= 2024) period = 9;
    else if (moveInYear >= 2004) period = 8;
    else if (moveInYear >= 1984) period = 7;
    else period = 8;

    const currentYear = Number(input.year) || new Date().getFullYear();
    const annualCenter = getAnnualCenterStar(currentYear);
    const annualFly = flyStars(annualCenter, true);
    const baseFly = flyStars(period, true);

    // 居住者命卦
    const resident = {
        year: Number(input.residentYear) || 1990,
        sex: input.sex || '男',
        mingGua: calculateMingGua(input.residentYear || 1990, input.sex || '男')
    };

    // 煞星方位 (五黃、二黑)
    let wuhuangDir = '西北';
    let erheiDir = '西';
    for (const [p, star] of Object.entries(annualFly)) {
        if (star === 5) wuhuangDir = p;
        if (star === 2) erheiDir = p;
    }

    return {
        mode: 'yangzhai',
        facing: facingRaw,
        house: houseName,
        period,
        pattern: period9Pattern,
        currentYear,
        annualCenter,
        flyingStars: {
            base: baseFly,
            annual: annualFly,
            wuhuangPosition: `${wuhuangDir} (五黃大煞，忌動土裝修，宜放銅器化解)`,
            erheiPosition: `${erheiDir} (二黑病符星，留意老人婦女健康)`
        },
        eightMansions: {
            house: houseKey,
            directions: eightMansionsMap
        },
        resident,
        summary: `【${houseName} · ${period}運陽宅】九運格局為【${period9Pattern}】。居住者命卦為【${resident.mingGua.name}卦 (${resident.mingGua.type})】。${currentYear}年流年中宮星為【${annualCenter}白】，五黃煞飛臨【${wuhuangDir}】，二黑病符飛臨【${erheiDir}】。`
    };
}

// 2. 形煞與內外煞診斷
function diagnoseShaqi(shaType) {
    const SHAS = {
        路沖煞: { type: '外煞 (形煞)', desc: '大門或主要窗戶正對直來筆直道路，氣流衝擊劇烈。', remedy: '設置玄關、遮擋屏風，或於門外安放泰山石敢當、凸面鏡化解衝煞。' },
        天斬煞: { type: '外煞 (形煞)', desc: '兩座高樓之間的窄縫正對本宅窗戶或陽台，風刃劈面。', remedy: '懸掛天然葫蘆、開光銅貔貅朝外化解，窗戶常裝厚實窗簾或百葉窗。' },
        壁刀煞: { type: '外煞 (形煞)', desc: '鄰棟建築牆角如刀切般正切本宅。', remedy: '在受煞方位懸掛凸透鏡、五帝錢或擺放高大茂密綠色植物遮擋。' },
        反弓煞: { type: '外煞 (形煞)', desc: '道路或河流彎道如弓背般向外頂著住宅。', remedy: '加設防護綠植、石敢當，避免在此方位開設主要進出門扇。' },
        穿堂風: { type: '內煞 (理氣)', desc: '大門一開直對後門或落地大陽台，前後通透，財氣直來直去無法聚氣。', remedy: '在進門處設立玄關櫃、隔斷屏風，或擺放闊葉盆栽阻隔直線氣流。' },
        廁所衝財位: { type: '內煞 (格局)', desc: '住宅向星旺位或客廳明財位剛好坐落衛生間，穢氣染財。', remedy: '保持衛生間乾燥通風、隨手關門，擺放黃金葛水生植物及粗鹽淨化。' },
        橫梁壓頂: { type: '內煞 (格局)', desc: '床頭、沙發或書桌上方有外露橫梁直接壓迫。', remedy: '首選「移形易位」挪開家具；若無法挪動，可做吊頂天花包覆，或懸掛五帝錢化解。' },
        鏡對床: { type: '內煞 (格局)', desc: '臥室梳妝鏡或衣櫃鏡正對睡床，夜間易受驚擾、神經衰弱。', remedy: '移動鏡子位置，或夜間以布簾遮蓋。' }
    };

    const target = SHAS[shaType] || SHAS['穿堂風'];
    return {
        mode: 'shaqi',
        shaName: shaType || '穿堂風',
        ...target,
        summary: `【${shaType}診斷】屬${target.type}。${target.desc} 化解建議：${target.remedy}`
    };
}

// 3. 擇日學吉日推薦
function chooseZeri(matter = '入宅/喬遷', year = new Date().getFullYear(), month = 5) {
    const SUI_PO_MAP = { 2024: '西北 (戌位)', 2025: '西北 (亥位)', 2026: '北方 (子位)', 2027: '東北 (丑位)' };
    const SAN_SHA_MAP = { 2024: '南方 (巳午未)', 2025: '東方 (寅卯辰)', 2026: '北方 (亥子丑)', 2027: '西方 (申酉戌)' };

    const suiPo = SUI_PO_MAP[year] || '北方 (子位)';
    const sanSha = SAN_SHA_MAP[year] || '北方 (亥子丑)';

    const auspiciousDates = [
        { day: `${year}年${month}月08日`, stemBranch: '丙寅日', jianXing: '成日 (大吉)', gods: '天德、天恩、月德合', bestHours: '巳時 (09:00-11:00)、午時 (11:00-13:00)' },
        { day: `${year}年${month}月16日`, stemBranch: '甲戌日', jianXing: '開日 (大吉)', gods: '月德、母倉、三合', bestHours: '辰時 (07:00-09:00)、巳時 (09:00-11:00)' },
        { day: `${year}年${month}月28日`, stemBranch: '丙戌日', jianXing: '定日 (吉)', gods: '天德合、益後、黃道', bestHours: '卯時 (05:00-07:00)、午時 (11:00-13:00)' }
    ];

    return {
        mode: 'zeri',
        matter,
        year,
        month,
        suiPoWarning: `歲破方位：【${suiPo}】，重大事項避免朝此方位大動干戈。`,
        sanShaWarning: `流年三煞方位：【${sanSha}】，修造動土切忌在此方起工。`,
        auspiciousDates,
        summary: `【${matter} · ${year}年${month}月吉日推薦】擇取成日與開日吉期，避開歲破與三煞。宜從宅主命卦生氣方入門最吉。`
    };
}

module.exports = {
    calculateFengShui,
    diagnoseShaqi,
    chooseZeri,
    calculateMingGua,
    flyStars,
    TWENTY_FOUR_MOUNTAINS,
    HOUSE_BY_FACING,
    EIGHT_MANSIONS
};
