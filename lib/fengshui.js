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

// 形勢巒頭與空間六事煞氣完整資料庫 (24種外局形煞與內局空間格局)
const SHA_DATABASE = {
    // 外局形煞 (External Landform & Sha Qi)
    '天斬煞': { category: '外局形煞', desc: '兩座高樓之間狹窄空隙如刀劈下，風切氣流劇烈衝擊', effect: '易引發血光之災、手術意外或財運突發大破耗', remedy: '受煞方位懸掛開光山海鎮、太極八卦凸鏡，陽台種植厚葉常綠灌木阻隔風刀。' },
    '路沖煞': { category: '外局形煞', desc: '道路、走廊或巷弄筆直正對大門、客廳陽台或臥房窗戶', effect: '車流人流動能直沖家宅，主家宅不寧、多口舌官非、破財與健康受損', remedy: '大門內設玄關屏風轉折氣流，窗臺安放泰山石敢當、開光山海鎮或闊葉盆栽化煞生權。' },
    '槍煞': { category: '外局形煞', desc: '筆直走廊或大路正對房門，如長槍直刺', effect: '主血光意外、事業突遭阻礙與胸口心肺不適', remedy: '門前掛過膝珠簾、安放金屬五帝錢或設置隔屏緩衝。' },
    '壁刀煞': { category: '外局形煞', desc: '對面或鄰近建築物的外牆邊角如刀刃切向自家房舍', effect: '氣流順牆切入，主家人易生意外挫傷、人際是非及呼吸道疾患', remedy: '切入方位安裝八卦凸鏡反射煞氣，或懸掛山海鎮、常關百葉窗簾阻隔。' },
    '反弓煞': { category: '外局形煞', desc: '道路、高架橋或河流呈弧形反弓背對大門或窗戶', effect: '氣場離散不聚，形如鐮刀割腿，主財氣難聚、家道起伏、子孫叛逆', remedy: '受煞方安置泰山石敢當、五帝錢，沿邊種植圓弧狀綠籬以柔克剛。' },
    '反弓水': { category: '外局形煞', desc: '河道、水渠呈弧形反弓割宅', effect: '水隨弓走，主退財破敗、事業挫折與泌尿系統欠安', remedy: '設置凸面八卦鏡，面向水流方擺設聚寶盆或泰山石鎮住地氣。' },
    '鐮刀煞': { category: '外局形煞', desc: '高架橋或陸橋之弧形彎道橫切住宅中低樓層', effect: '車速風切動能割裂氣場，主事業波折、運程受阻與神經耗損', remedy: '窗臺懸掛山海鎮，加裝雙層隔音氣密窗，室內擺設黑曜石或白水晶七星陣。' },
    '穿心煞': { category: '外局形煞', desc: '大樓底部有捷運、地下道、車道穿過，或門前直對路燈柱/大樹幹', effect: '地氣懸空不穩，主宅基動盪、心臟疾病與投資失利', remedy: '室內安放白水晶柱或黃玉球引土氣鎮基，門口鋪設黃色地毯加五帝錢。' },
    '白虎煞': { category: '外局形煞', desc: '住宅右側（白虎方）動土施工，或右側建物明顯高於左側（青龍方）', effect: '白虎抬頭欺青龍，主易遭小人暗算、是非官司、女性健康欠安', remedy: '青龍方增置高大綠植、懸掛青龍圖騰增旺龍邊氣勢，白虎方安放銅麒麟制煞。' },
    '孤陽煞': { category: '外局形煞', desc: '緊鄰廟宇、教堂、加油站、變電所或大型發射台', effect: '陽火之氣過於燥烈，主脾氣暴躁、家庭口角不睦、難聚正財', remedy: '室內擺設陶土/陶瓷容器或太極八卦鎮洩去燥火，增添水景滋潤氣場。' },
    '獨陰煞': { category: '外局形煞', desc: '緊鄰醫院、殯儀館、公墓、公廁或老舊廢墟', effect: '陰煞穢氣凝聚，主精神萎靡、睡眠多夢、陰虛體弱', remedy: '室內增強暖色調柔和照明，門窗處懸掛天然開光銅葫蘆吸納穢氣。' },
    '探頭煞': { category: '外局形煞', desc: '屋前建築物後方露出更高建築的一角，形如小人探頭窺伺', effect: '主易遭偷盜竊賊、小人暗中中傷或名譽受損', remedy: '面對探頭方向懸掛凸面八卦鏡或銅製八卦桃木劍。' },
    '頂心煞': { category: '外局形煞', desc: '大門或窗前正對路燈桿、電線桿、廣告柱或大樹', effect: '視線與氣流受阻，主眼疾、頭痛、脾氣暴躁與事業卡關', remedy: '門口設屏風玄關，懸掛獅咬劍或山海鎮化解阻礙。' },
    '火形煞': { category: '外局形煞', desc: '屋外正對高壓電塔、尖銳屋頂、變壓器或三角尖狀建築', effect: '火形尖角衝射，主心血管疾病、火氣過盛與突發破財', remedy: '懸掛銅葫蘆或黑曜石神獸化火為土，調和五行。' },

    // 內局空間六事 (Internal Layout & Form)
    '穿堂煞': { category: '內局空間六事', desc: '大門一開正對客廳落地窗、陽台或後門，前後一眼望穿', effect: '氣流直進直出無法藏風聚氣，為第一大破財格局，主財來財去守不住', remedy: '在大門與落地窗之間設置不透光玄關櫃、屏風、厚重門簾或大葉闊葉盆栽阻隔。' },
    '門沖床': { category: '內局空間六事', desc: '臥房房門直沖床頭或床身', effect: '氣流擾動睡眠磁場，主失眠多夢、神經衰弱及對應沖射部位病痛', remedy: '移動床位避開直線衝射，房門加掛長過膝蓋之門簾並在門檻安放五帝錢。' },
    '樑壓床': { category: '內局空間六事', desc: '臥房床頭上方有橫樑橫跨壓過', effect: '氣流順橫樑下沈壓迫，主偏頭痛、焦慮緊張、胸悶與運勢受壓', remedy: '做平頂天花板包覆橫樑，或使用厚床頭櫃將床頭移出樑下，橫樑兩側懸掛天然葫蘆。' },
    '橫樑壓頂': { category: '內局空間六事', desc: '客廳沙發、書房書桌或辦公椅正上方有橫樑壓過', effect: '主思緒受阻、工作壓力沉重、升遷受制與頸椎不適', remedy: '調整沙發或書桌位置避開樑下，或樑下兩端懸掛開光銅葫蘆或五帝錢化解。' },
    '樑壓灶': { category: '內局空間六事', desc: '廚房瓦斯爐上方有橫樑壓過', effect: '灶君受壓，主女主人婦科腸胃健康欠佳、家庭財庫受損', remedy: '以廚櫃包覆橫樑，或橫樑下方懸掛銅葫蘆、五帝錢化解重壓。' },
    '門沖灶': { category: '內局空間六事', desc: '廚房門或大門正對瓦斯爐灶', effect: '門風吹動爐火，主火氣直沖、家庭爭吵、女主人健康受損與開銷無度', remedy: '廚房門加裝不透光長門簾，或調整瓦斯爐位置使其不與門直沖。' },
    '水火相沖': { category: '內局空間六事', desc: '廚房瓦斯爐與水槽緊鄰（小於45公分）或正對冰箱', effect: '水火不容，氣場激盪，主家庭成員口舌紛爭不斷、腸胃消化不良', remedy: '瓦斯爐與水槽間放置綠色木質隔板或隔水砧板（水生木、木生火通關）。' },
    '廁居中宮': { category: '內局空間六事', desc: '衛生間浴廁位於整個房屋九宮的正中心位置', effect: '中央為全宅心臟腹地，穢氣濕氣散發全宅，主心臟腸胃疾、全家運勢低迷', remedy: '保持浴廁常開抽風機、門常閉，內放黃金葛加植物生長燈，擺放天然粗鹽碗或白水晶球淨化。' },
    '開門見灶': { category: '內局空間六事', desc: '一進大門視線直接看見廚房瓦斯爐', effect: '開門見灶、錢財多耗，主收入難聚、意外開銷大', remedy: '玄關處設屏風阻擋視線，或廚房加裝不透光拉門常關。' },
    '開門見廁': { category: '內局空間六事', desc: '一進大門正對衛生間洗手間門', effect: '進門穢氣迎客，主貴人退避、財運受阻、人際運勢低迷', remedy: '廁所門常關閉並掛上長門簾，玄關處設立隔斷屏風，擺放綠色開運植栽。' }
};

// 煞氣診斷核心
function diagnoseShaqi(shaType = '天斬煞') {
    const foundKey = Object.keys(SHA_DATABASE).find(k => shaType.includes(k) || k.includes(shaType)) || '天斬煞';
    const info = SHA_DATABASE[foundKey];

    return {
        shaType: foundKey,
        category: info.category,
        description: info.desc,
        influence: info.effect,
        remedy: info.remedy,
        summary: `【${info.category} · ${foundKey}】${info.desc}。影響：${info.effect}。化解之策：${info.remedy}`
    };
}

// 巒頭形勢多重診斷
function diagnoseLuantou(shaList = []) {
    const list = Array.isArray(shaList) ? shaList : [shaList];
    const results = list.map(item => diagnoseShaqi(item));
    return {
        totalIssues: results.length,
        items: results,
        summary: results.map(r => r.summary).join('\n\n')
    };
}

function getAllShaQiLibrary() {
    return Object.entries(SHA_DATABASE).map(([name, val]) => ({
        name,
        category: val.category,
        desc: val.desc,
        effect: val.effect,
        remedy: val.remedy
    }));
}

// 協紀辨方黃道吉時與五鼠遁推算
function getAuspiciousHours(dayGan, dayZhi) {
    const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
    const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
    const HOURS_RANGE = [
        '23:00-01:00', '01:00-03:00', '03:00-05:00', '05:00-07:00',
        '07:00-09:00', '09:00-11:00', '11:00-13:00', '13:00-15:00',
        '15:00-17:00', '17:00-19:00', '19:00-21:00', '21:00-23:00'
    ];

    // 黃道十二神：0青龍(吉), 1明堂(吉), 2天刑(凶), 3朱雀(凶), 4金匱(吉), 5寶光(吉), 6白虎(凶), 7玉堂(吉), 8天牢(凶), 9玄武(凶), 10司命(吉), 11勾陳(凶)
    const SPIRIT_NAMES = ['青龍', '明堂', '天刑', '朱雀', '金匱', '寶光', '白虎', '玉堂', '天牢', '玄武', '司命', '勾陳'];
    const LUCKY_OFFSETS = [
        { offset: 0, spirit: '青龍' },
        { offset: 1, spirit: '明堂' },
        { offset: 4, spirit: '金匱' },
        { offset: 5, spirit: '寶光' },
        { offset: 7, spirit: '玉堂' },
        { offset: 10, spirit: '司命' }
    ];

    // 子午日申起青龍，卯酉日在寅，寅申日居子，巳亥日居午，辰戌日居辰，丑未日居戌
    const QINGLONG_START = {
        子: 8, 午: 8,
        卯: 2, 酉: 2,
        寅: 0, 申: 0,
        巳: 6, 亥: 6,
        辰: 4, 戌: 4,
        丑: 10, 未: 10
    };

    const startZhiIdx = QINGLONG_START[dayZhi] !== undefined ? QINGLONG_START[dayZhi] : 8;

    // 五鼠遁起時干 (甲己起甲子0, 乙庚起丙子2, 丙辛起戊子4, 丁壬起庚子6, 戊癸起壬子8)
    const WUSHUDUN_MAP = { 甲: 0, 己: 0, 乙: 2, 庚: 2, 丙: 4, 辛: 4, 丁: 6, 壬: 6, 戊: 8, 癸: 8 };
    const baseGanIdx = WUSHUDUN_MAP[dayGan] !== undefined ? WUSHUDUN_MAP[dayGan] : 0;

    const luckyHours = LUCKY_OFFSETS.map(({ offset, spirit }) => {
        const zhiIdx = (startZhiIdx + offset) % 12;
        const ganIdx = (baseGanIdx + zhiIdx) % 10;
        const stem = STEMS[ganIdx];
        const branch = BRANCHES[zhiIdx];
        const range = HOURS_RANGE[zhiIdx];
        return `${stem}${branch}時 (${range} ${spirit})`;
    });

    // 取前 3 個最利時辰
    return luckyHours.slice(0, 3).join('、');
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

    const sanShaBranchesMap = {
        申: ['巳', '午', '未'], 子: ['巳', '午', '未'], 辰: ['巳', '午', '未'],
        寅: ['亥', '子', '丑'], 午: ['亥', '子', '丑'], 戌: ['亥', '子', '丑'],
        巳: ['寅', '卯', '辰'], 酉: ['寅', '卯', '辰'], 丑: ['寅', '卯', '辰'],
        亥: ['申', '酉', '戌'], 卯: ['申', '酉', '戌'], 未: ['申', '酉', '戌']
    };
    const sanShaZhis = sanShaBranchesMap[yearZhi] || [];
    const sanShaDirMap = { 申: '南方 (巳午未)', 子: '南方 (巳午未)', 辰: '南方 (巳午未)', 寅: '北方 (亥子丑)', 午: '北方 (亥子丑)', 戌: '北方 (亥子丑)', 巳: '東方 (寅卯辰)', 酉: '東方 (寅卯辰)', 丑: '東方 (寅卯辰)', 亥: '西方 (申酉戌)', 卯: '西方 (申酉戌)', 未: '西方 (申酉戌)' };
    const sanShaDir = sanShaDirMap[yearZhi] || '北方 (亥子丑)';

    // 依 matter 事項過濾吉神與建除神
    let suitableJianXing = ['開', '成', '定', '滿'];
    if (matter.includes('開業') || matter.includes('開市') || matter === 'open') {
        suitableJianXing = ['開', '成', '滿', '執'];
    } else if (matter.includes('修造') || matter.includes('動土') || matter === 'renovate') {
        suitableJianXing = ['除', '定', '成', '滿'];
    } else if (matter.includes('嫁娶') || matter.includes('結婚') || matter === 'marry') {
        suitableJianXing = ['成', '定', '開', '執'];
    }

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

            // 嚴格排除歲破日與流年三煞日
            if (dayZhi === suiPoZhi) continue;
            if (sanShaZhis.includes(dayZhi)) continue;

            if (suitableJianXing.includes(jianXing)) {
                const bestHours = getAuspiciousHours(dayGan, dayZhi);
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
    diagnoseLuantou,
    getAllShaQiLibrary,
    SHA_DATABASE,
    chooseZeri
};
