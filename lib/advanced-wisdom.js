/**
 * lib/advanced-wisdom.js - 高階術數智慧與三卜合參引擎 (Advanced Metaphysics Wisdom Suite)
 * 
 * 涵蓋核心經典算法：
 * 1. searchAuspiciousTimes: 奇門 × 八字「吉時獵手・反向條件擇日」
 * 2. evaluateDecisionCombo: 重大決策「奇門 × 六爻 × 梅花」三卜合參引擎
 * 3. analyzeCezi: 測字占事（康熙筆畫、五行易理、八十一數理、梅花字卦、八字喜忌合參）
 * 4. calculateYunqiWellness: 五運六氣 × 二十四節氣 × 十二時辰子午流注養生
 * 5. buildFactChecklist & verifyAnalysisClaims: 確定性事實鎖定清單與防幻覺核驗機制
 */

const { Lunar, Solar } = require('lunar-javascript');
const qimen = require('./qimen');
const { calculateLiuyao } = require('./liuyao');
const meihua = require('./meihua');
const nameAnalysis = require('./name-analysis');
const n81 = require('../data/name-analysis/81-numerology.json');

// 八卦九宮方位映射
const GONG_DIRECTIONS = {
    '1': '正北 (坎一宮)',
    '2': '西南 (坤二宮)',
    '3': '正東 (震三宮)',
    '4': '東南 (巽四宮)',
    '6': '西北 (乾六宮)',
    '7': '正西 (兌七宮)',
    '8': '東北 (艮八宮)',
    '9': '正南 (離九宮)'
};

const DIRECTION_TO_GONG = {
    '北': 1, '正北': 1, '坎': 1,
    '西南': 2, '坤': 2,
    '東': 3, '正東': 3, '震': 3,
    '東南': 4, '巽': 4,
    '西北': 6, '乾': 6,
    '西': 7, '正西': 7, '兌': 7,
    '東北': 8, '艮': 8,
    '南': 9, '正南': 9, '離': 9
};

// 地支六沖對應表
const CLASH_MAP = {
    '子': '午', '午': '子',
    '丑': '未', '未': '丑',
    '寅': '申', '申': '寅',
    '卯': '酉', '酉': '卯',
    '辰': '戌', '戌': '辰',
    '巳': '亥', '亥': '巳'
};

// 12 時辰時段表
const SHICHEN_HOURS = [
    { hour: 0, time: '00:00', shichen: '子時 (23:00-00:59)' },
    { hour: 2, time: '02:00', shichen: '丑時 (01:00-02:59)' },
    { hour: 4, time: '04:00', shichen: '寅時 (03:00-04:59)' },
    { hour: 6, time: '06:00', shichen: '卯時 (05:00-06:59)' },
    { hour: 8, time: '08:00', shichen: '辰時 (07:00-08:59)' },
    { hour: 10, time: '10:00', shichen: '巳時 (09:00-10:59)' },
    { hour: 12, time: '12:00', shichen: '午時 (11:00-12:59)' },
    { hour: 14, time: '14:00', shichen: '未時 (13:00-14:59)' },
    { hour: 16, time: '16:00', shichen: '申時 (15:00-16:59)' },
    { hour: 18, time: '18:00', shichen: '酉時 (17:00-18:59)' },
    { hour: 20, time: '20:00', shichen: '戌時 (19:00-20:59)' },
    { hour: 22, time: '22:00', shichen: '亥時 (21:00-22:59)' }
];

// 二十四節氣養生數據庫
const SOLAR_TERM_DATABASE = {
    '立春': { seasonElement: '木', dietAdvice: '少酸增辛，宜食韭菜、生薑、蔥白，助升發陽氣', lifestyleAdvice: '早起散步，舒展形體，使春氣暢達', acupointAdvice: '太衝穴、風池穴' },
    '雨水': { seasonElement: '木', dietAdvice: '宜食山藥、蓮子、紅棗健脾除濕', lifestyleAdvice: '春捂防寒，注意下半身與足部保暖', acupointAdvice: '足三里、陰陵泉' },
    '驚蟄': { seasonElement: '木', dietAdvice: '清淡潤燥，宜食梨、銀耳、蜂蜜滋陰清熱', lifestyleAdvice: '早睡早起，順應陽氣升發，預防季節過敏', acupointAdvice: '合谷穴、曲池穴' },
    '春分': { seasonElement: '木', dietAdvice: '平衡膳食，寒熱搭配，宜食枸杞葉、菠菜', lifestyleAdvice: '作息規律，陰陽相半，保持情緒舒暢調達', acupointAdvice: '太溪穴、神闕穴' },
    '清明': { seasonElement: '木', dietAdvice: '宜食薺菜、菊花茶清肝明目，少食油膩生冷', lifestyleAdvice: '多至戶外踏青吐故納新，避免大喜大悲', acupointAdvice: '行間穴、陽陵泉' },
    '穀雨': { seasonElement: '木', dietAdvice: '加強健脾祛濕，宜食赤小豆、薏苡仁、茯苓', lifestyleAdvice: '降濕防關節酸痛，保持室內乾燥通風', acupointAdvice: '三陰交、脾俞穴' },
    '立夏': { seasonElement: '火', dietAdvice: '清心降火，宜食苦瓜、綠豆、蓮子心清心火', lifestyleAdvice: '宜午時小憩，養心安神，戒躁戒怒', acupointAdvice: '勞宮穴、內關穴' },
    '小滿': { seasonElement: '火', dietAdvice: '清熱利濕，宜食冬瓜、絲瓜、綠豆薏米湯', lifestyleAdvice: '防皮膚濕疹，汗出切勿立即吹風沖冷水', acupointAdvice: '大椎穴、曲澤穴' },
    '芒種': { seasonElement: '火', dietAdvice: '益氣生津，宜食烏梅、山楂、西洋參飲', lifestyleAdvice: '晚睡早起，午睡充沛精力，防梅雨濕氣困脾', acupointAdvice: '委中穴、承山穴' },
    '夏至': { seasonElement: '火', dietAdvice: '宜苦酸相兼，生薑配清茶冬病夏治', lifestyleAdvice: '陽極陰生，夜臥早起，避烈日暴曬', acupointAdvice: '百會穴、湧泉穴' },
    '小暑': { seasonElement: '火', dietAdvice: '溫補脾陽，適當飲用生薑紅糖水除伏邪', lifestyleAdvice: '少動多靜，切忌長時間直吹冷氣', acupointAdvice: '氣海穴、中脘穴' },
    '大暑': { seasonElement: '土', dietAdvice: '防暑降溫，宜食綠豆湯、西瓜翠衣、冬瓜湯', lifestyleAdvice: '避暑熱防中暑，保持室內涼爽通風', acupointAdvice: '大陵穴、關元穴' },
    '立秋': { seasonElement: '金', dietAdvice: '潤燥養肺，少辛增酸，宜食百合、梨、芝麻', lifestyleAdvice: '早睡早起以斂肺氣，增減衣物防秋涼', acupointAdvice: '太淵穴、列缺穴' },
    '處暑': { seasonElement: '金', dietAdvice: '宜食石斛、玉竹、沙參防秋乏與溫燥', lifestyleAdvice: '保證充足睡眠，中午補覺緩解疲乏', acupointAdvice: '迎香穴、尺澤穴' },
    '白露': { seasonElement: '金', dietAdvice: '滋陰生津，宜食龍眼、番薯、秋梨膏', lifestyleAdvice: '白露身不露，夜間注意覆蓋腹部與關節', acupointAdvice: '肺俞穴、腎俞穴' },
    '秋分': { seasonElement: '金', dietAdvice: '平補潤燥，宜食銀耳蓮子羹、糯米粥', lifestyleAdvice: '防涼燥傷肺，適度晨練散步，放鬆情志', acupointAdvice: '神門穴、照海穴' },
    '寒露': { seasonElement: '金', dietAdvice: '宜多食酸甘潤肺之品，如柿子、香蕉、枸杞', lifestyleAdvice: '腳部防寒，寒從腳起，睡前宜熱水泡腳', acupointAdvice: '湧泉穴、崑崙穴' },
    '霜降': { seasonElement: '土', dietAdvice: '宜平補健脾，宜食栗子、牛肉、柿子補氣血', lifestyleAdvice: '深秋防寒保暖，加強四肢關節保護', acupointAdvice: '足三里、命門穴' },
    '立冬': { seasonElement: '水', dietAdvice: '滋陰補陽，宜食羊肉、黑芝麻、核桃', lifestyleAdvice: '早睡晚起，必待日光，收斂心神陽氣', acupointAdvice: '太溪穴、關元穴' },
    '小雪': { seasonElement: '水', dietAdvice: '溫補清火兼顧，宜食白蘿蔔燉羊肉、黑豆', lifestyleAdvice: '室內注意通風防燥熱，調節情志防冬季抑鬱', acupointAdvice: '膻中穴、三陰交' },
    '大雪': { seasonElement: '水', dietAdvice: '補腎固精，宜食枸杞、黑芝麻粥、山藥', lifestyleAdvice: '防寒保暖，頭頸背足勿受風寒', acupointAdvice: '命門穴、腎俞穴' },
    '冬至': { seasonElement: '水', dietAdvice: '一陽初生，宜食水餃、補腎養陰之湯品', lifestyleAdvice: '早睡晚起，避免劇烈耗汗出汗，靜養元神', acupointAdvice: '神闕穴、湧泉穴' },
    '小寒': { seasonElement: '水', dietAdvice: '溫陽防大寒，宜食羊肉蘿蔔湯、當歸生薑飲', lifestyleAdvice: '加強頭部與胸背保暖，注意室內外溫差', acupointAdvice: '大椎穴、關元穴' },
    '大寒': { seasonElement: '水', dietAdvice: '冬春過渡，固表兼疏肝，宜食山藥、胡蘿蔔', lifestyleAdvice: '隨氣溫添減衣物，逐步開展舒緩伸展運動', acupointAdvice: '足三里、太衝穴' }
};

// 子午流注 12 時辰經絡表
const MERIDIAN_FLOW = [
    { shichen: '子時', hours: '23:00 - 00:59', meridian: '足少陽膽經', organ: '膽', action: '膽經主決斷，此時務必熟睡入眠，蓄積一陽初生之生氣。' },
    { shichen: '丑時', hours: '01:00 - 02:59', meridian: '足厥陰肝經', organ: '肝', action: '肝藏血主解毒，深層睡眠有助肝血回流滋養臟腑，切忌熬夜。' },
    { shichen: '寅時', hours: '03:00 - 04:59', meridian: '手太陰肺經', organ: '肺', action: '肺朝百脈，深度睡眠利於氣血重新分配周身，平靜調息。' },
    { shichen: '卯時', hours: '05:00 - 06:59', meridian: '手陽明大腸經', organ: '大腸', action: '天門開地戶開，晨起溫開水一杯，促進大腸傳導通便排毒。' },
    { shichen: '辰時', hours: '07:00 - 08:59', meridian: '足陽明胃經', organ: '胃', action: '胃經當令陽氣旺盛，宜享用溫暖豐盛早餐，生發化生氣血。' },
    { shichen: '巳時', hours: '09:00 - 10:59', meridian: '足太陰脾經', organ: '脾', action: '脾主運化與思維，精力最充沛時段，適宜專注工作與重大決策。' },
    { shichen: '午時', hours: '11:00 - 12:59', meridian: '手少陰心經', organ: '心', action: '心經當令子午相稱，宜食營養午餐後小憩15至30分鐘養心神。' },
    { shichen: '未時', hours: '13:00 - 14:59', meridian: '手太陽小腸經', organ: '小腸', action: '小腸分清泌濁，吸收營養精華，適量補水，有利循環代謝。' },
    { shichen: '申時', hours: '15:00 - 16:59', meridian: '足太陽膀胱經', organ: '膀胱', action: '體溫最高代謝旺盛，宜多飲溫水、適度運動或進行高強度工作。' },
    { shichen: '酉時', hours: '17:00 - 18:59', meridian: '足少陰腎經', organ: '腎', action: '腎主藏精固本，宜享用清淡七分飽晚餐，防過度勞損精力。' },
    { shichen: '戌時', hours: '19:00 - 20:59', meridian: '手厥陰心包經', organ: '心包', action: '心包護心，宜放鬆身心、靜心閱讀、散步談心，保持愉悅平靜。' },
    { shichen: '亥時', hours: '21:00 - 22:59', meridian: '手少陽三焦經', organ: '三焦', action: '三焦通百脈，宜溫水泡腳、調和陰陽氣血，準備進入安眠狀態。' }
];

/**
 * QimenDunjia 兼容封裝類
 */
class QimenDunjia {
    calculate(dateStr, timeStr, purpose = '綜合', question = '') {
        const d = new Date(`${dateStr}T${timeStr}:00`);
        const validDate = isNaN(d.getTime()) ? new Date() : d;
        return qimen.calculate(validDate, { purpose, question });
    }
}

/**
 * MeihuaYishu 兼容封裝類
 */
class MeihuaYishu {
    calculateByTime(dateStr, timeStr) {
        const d = new Date(`${dateStr}T${timeStr}:00`);
        const validDate = isNaN(d.getTime()) ? new Date() : d;
        return meihua.qiguaByGregorianTime(validDate);
    }
}

/**
 * 1. searchAuspiciousTimes (Tier 1A: 奇門 × 八字「吉時獵手・反向條件擇日」)
 */
function searchAuspiciousTimes(input = {}) {
    const purpose = input.purpose || '祈福';
    let start;
    if (input.startDate) {
        start = new Date(`${input.startDate}T00:00:00`);
    } else if (input.year && input.month) {
        start = new Date(Number(input.year), Number(input.month) - 1, 1);
    } else {
        start = new Date();
    }
    if (isNaN(start.getTime())) start = new Date();

    const resolvedStartDate = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
    const daysScanned = Math.max(1, Math.min(14, Number(input.days) || 7));

    // 解析生肖與年命地支
    let birthYearBranch = null;
    if (input.birthYear) {
        try {
            birthYearBranch = Lunar.fromYmd(Number(input.birthYear), 6, 1).getYearInGanZhi().slice(1);
        } catch {
            birthYearBranch = null;
        }
    }

    const allSlots = [];

    for (let d = 0; d < daysScanned; d++) {
        const curr = new Date(start.getFullYear(), start.getMonth(), start.getDate() + d);
        const dateStr = `${curr.getFullYear()}-${String(curr.getMonth() + 1).padStart(2, '0')}-${String(curr.getDate()).padStart(2, '0')}`;

        for (const slot of SHICHEN_HOURS) {
            const slotDate = new Date(curr.getFullYear(), curr.getMonth(), curr.getDate(), slot.hour, 0, 0);
            const lunar = Lunar.fromDate(slotDate);
            const jianchu = lunar.getZhiXing();
            const yi = lunar.getDayYi();
            const ji = lunar.getDayJi();
            const dayGanZhi = lunar.getDayInGanZhi();
            const timeGanZhi = lunar.getTimeInGanZhi();

            // 奇門排盤計算
            let qm;
            try {
                qm = qimen.calculate(slotDate, { purpose });
            } catch {
                continue;
            }

            // 判定宮位：若用戶指定方位則定位至該宮，否則取奇門全局最佳宮
            let targetGongNum = qm.analysis?.bestGong || 1;
            if (input.direction && DIRECTION_TO_GONG[input.direction]) {
                targetGongNum = DIRECTION_TO_GONG[input.direction];
            }

            const gongInfo = qm.jiuGongAnalysis?.[targetGongNum] || {};
            const door = qm.baMen?.[targetGongNum] || gongInfo.men || '';
            const star = qm.jiuXing?.[targetGongNum] || gongInfo.xing || '';
            const deity = qm.baShen?.[targetGongNum] || gongInfo.shen || '';
            const diPanGan = qm.diPan?.[targetGongNum] || '';
            const bestDirection = gongInfo.direction ? `${gongInfo.direction} (${gongInfo.gongName || ''}宮)` : GONG_DIRECTIONS[targetGongNum] || '東南 (巽四宮)';

            // 三奇檢驗 (乙、丙、丁)
            const sanqiHit = ['乙', '丙', '丁'].includes(diPanGan) ||
                (qm.geju?.allPatterns || []).some(p => p.gong == targetGongNum && p.name && p.name.includes('奇'));

            const isAuspiciousDoor = ['開門', '休門', '生門'].includes(door);

            // 評分演算法（0-100分基準）
            let score = 60;
            if (yi.some(item => item.includes(purpose) || purpose.includes(item))) score += 15;
            if (ji.some(item => item.includes(purpose) || purpose.includes(item))) score -= 20;
            if (['成', '開', '定', '滿', '除'].includes(jianchu)) score += 12;
            if (isAuspiciousDoor && sanqiHit) score += 15;
            if (qm.analysis?.overallJiXiong === 'da_ji' || qm.analysis?.overallJiXiong === 'ji') score += 8;

            let clashWarning = false;
            if (birthYearBranch && CLASH_MAP[birthYearBranch] === dayGanZhi.slice(1)) {
                score -= 25;
                clashWarning = true;
            }

            score = Math.min(100, Math.max(20, score));
            const grade = score >= 85 ? '天顯大吉' : score >= 75 ? '奇門吉時' : '平穩可用';

            const reasonParts = [];
            reasonParts.push(`建除【${jianchu}日】`);
            if (door) reasonParts.push(`${door}值吉`);
            if (sanqiHit) reasonParts.push('三奇同宮聚氣');
            if (clashWarning) reasonParts.push('注意沖犯生肖年命');
            const reason = reasonParts.join('，') + `，宜於${bestDirection}開展行動。`;

            allSlots.push({
                date: dateStr,
                time: slot.time,
                shichen: slot.shichen,
                dayGanZhi,
                timeGanZhi,
                jianchu,
                qimenDun: qm.juShu?.fullName || '陽遁時局',
                bestDirection,
                door: door || '生門',
                star: star || '天任',
                deity: deity || '值符',
                sanqiHit,
                score,
                grade,
                clashWarning,
                reason
            });
        }
    }

    // 依分數高低排序，取最優前 5 個時段
    allSlots.sort((a, b) => b.score - a.score);
    const topSlots = allSlots.slice(0, 5).map((s, idx) => ({
        rank: idx + 1,
        ...s
    }));

    const summary = `【吉時獵手・擇日評估】在 ${resolvedStartDate} 起共 ${daysScanned} 天（檢索 ${allSlots.length} 個時辰時段）中，針對「${purpose}」精選出前 ${topSlots.length} 個吉時。首選時段為 ${topSlots[0]?.date || ''} ${topSlots[0]?.shichen || ''}（評分：${topSlots[0]?.score || 0}分 · ${topSlots[0]?.grade || ''}），吉方首選【${topSlots[0]?.bestDirection || ''}】。`;

    return {
        purpose,
        window: { startDate: resolvedStartDate, daysScanned },
        totalEvaluated: allSlots.length,
        topSlots,
        summary
    };
}

/**
 * 2. evaluateDecisionCombo (Tier 2B: 重大決策「奇門 × 六爻 × 梅花」三卜合參引擎)
 */
function evaluateDecisionCombo(input = {}) {
    const question = input.question || '此決策近期推進是否順利？';
    const category = input.category || '事業';
    const purpose = input.purpose || category;

    // 解析時間
    let d;
    if (input.datetime) {
        d = new Date(input.datetime.replace(' ', 'T'));
    } else {
        d = new Date();
    }
    if (isNaN(d.getTime())) d = new Date();

    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

    // 1. 奇門遁甲 (Qimen Dunjia)
    let qm;
    try {
        qm = new QimenDunjia().calculate(dateStr, timeStr, purpose, question);
    } catch {
        qm = qimen.calculate(d, { purpose, question });
    }

    const qmBestGongNum = qm.analysis?.bestGong || 1;
    const qmGong = qm.jiuGongAnalysis?.[qmBestGongNum] || {};
    const qmIsJi = qm.analysis?.overallJiXiong === 'da_ji' || qm.analysis?.overallJiXiong === 'ji';
    const qmIsXiong = qm.analysis?.overallJiXiong === 'da_xiong' || qm.analysis?.overallJiXiong === 'xiao_xiong';
    const qmSignal = qmIsJi ? '吉' : qmIsXiong ? '凶' : '平';
    const qmScore = qmIsJi ? 86 : qmIsXiong ? 38 : 62;

    const qimenVerdict = {
        system: '奇門遁甲',
        signal: qmSignal,
        grade: qmSignal,
        score: qmScore,
        door: qmGong.men || qmGong.door || qm.zhiShiMen || '生門',
        star: qmGong.star || qmGong.xing || '天任',
        deity: qmGong.god || qmGong.shen || '值符',
        direction: qmGong.direction || '正南',
        bestDirection: qmGong.direction || '正南',
        headline: `奇門起局【${qm.juShu?.fullName || '時家奇門'}】，吉氣位居【${qmGong.direction || '東南'}·${qmGong.men || '吉門'}】`,
        evidence: `值符落${qm.zhiFuGong}宮，值使【${qm.zhiShiMen}】落${qm.zhiShiGong}宮，全局定調為【${qm.analysis?.overallJiXiongText || qm.analysis?.overallJiXiong || '平順'}】。`,
        summary: `起局【${qm.juShu?.fullName || '時家奇門'}】，值符落${qm.zhiFuGong}宮，值使【${qm.zhiShiMen}】落${qm.zhiShiGong}宮，全局定調為【${qm.analysis?.overallJiXiongText || qm.analysis?.overallJiXiong || '平順'}】。`
    };

    // 2. 六爻神卦 (Liuyao)
    let ly;
    try {
        ly = calculateLiuyao({ mode: 'time', datetime: `${dateStr} ${timeStr}`, category, question });
    } catch (e) {
        ly = { benGua: { name: '乾為天' }, zhiGua: { name: '乾為天' }, yongshen: { summary: '用神平穩' }, zhuxiRule: { mainRule: '卦象清純' } };
    }

    const lyYongStrong = ly.yongshen?.summary?.includes('旺') || ly.yongshen?.summary?.includes('相');
    const lyMovingCount = ly.zhuxiRule?.movingCount || 0;
    const lySignal = lyYongStrong ? '吉' : lyMovingCount >= 4 ? '凶' : '平';
    const lyScore = lySignal === '吉' ? 82 : lySignal === '凶' ? 42 : 60;

    const liuyaoVerdict = {
        system: '六爻神卦',
        signal: lySignal,
        grade: lySignal,
        score: lyScore,
        hexagram: ly.benGua?.name || '乾為天',
        guaName: `${ly.benGua?.name || '本卦'} ➔ ${ly.zhiGua?.name || '之卦'}`,
        yongShen: ly.yongshen?.target || '世爻用神',
        headline: `六爻得【${ly.benGua?.name || '本卦'}】變【${ly.zhiGua?.name || '之卦'}】，鎖定用神【${ly.yongshen?.target || '用神'}】`,
        evidence: `${ly.yongshen?.summary || '用神得令'}。朱熹占斷原則：${ly.zhuxiRule?.mainRule || '循序推進'}。`,
        summary: `${ly.yongshen?.summary || '用神得令'}。朱熹考變占：${ly.zhuxiRule?.mainRule || '循序推進'}。`
    };

    // 3. 梅花易數 (Meihua Yishu)
    let mh;
    try {
        mh = new MeihuaYishu().calculateByTime(dateStr, timeStr);
    } catch {
        mh = meihua.qiguaByGregorianTime(d);
    }

    const mhJudge = mh.wuxing?.judgement;
    const mhRel = mh.wuxing?.relation || '';
    const mhSignal = (mhJudge === '吉' || mhRel === '用生體' || mhRel === '體克用' || mhRel === '體剋用' || mhRel === '比和')
        ? '吉'
        : (mhRel === '用剋體' || mhRel === '用克體') ? '凶' : '平';
    const mhScore = mhSignal === '吉' ? 84 : mhSignal === '凶' ? 40 : 64;

    const meihuaVerdict = {
        system: '梅花易數',
        signal: mhSignal,
        grade: mhSignal,
        score: mhScore,
        bengua: mh.bengua?.name || '乾為天',
        hexagram: `${mh.bengua?.name || '本卦'} ➔ ${mh.biangua?.name || '變卦'}`,
        tiYong: mh.wuxing?.summary || mhRel || '體用生剋',
        headline: `梅花得【${mh.bengua?.name || '本卦'}】變【${mh.biangua?.name || '變卦'}】，體用生剋【${mh.wuxing?.summary || mhRel || '生克調和'}】`,
        evidence: `體卦屬【${mh.tigua?.element || ''}】，用卦屬【${mh.yonggua?.element || ''}】。易理斷語：${mh.wuxing?.detail || '動靜相生，順勢而為'}。`,
        summary: `體卦屬【${mh.tigua?.element || ''}】，用卦屬【${mh.yonggua?.element || ''}】。易理斷語：${mh.wuxing?.detail || '動靜相生，順勢而為'}。`
    };

    // 4. 三卜全息共識與矛盾對照分析 (Cross-Validation Consensus)
    const signals = [qmSignal, lySignal, mhSignal];
    const jiCount = signals.filter(s => s === '吉').length;
    const xiongCount = signals.filter(s => s === '凶').length;

    let alignment;
    let confidenceScore;
    if (jiCount === 3) {
        alignment = '三盤同吉';
        confidenceScore = 95;
    } else if (xiongCount === 3) {
        alignment = '三盤同凶';
        confidenceScore = 92;
    } else if (jiCount >= 2) {
        alignment = '多數偏吉';
        confidenceScore = 80;
    } else if (xiongCount >= 2) {
        alignment = '多數偏凶';
        confidenceScore = 78;
    } else {
        alignment = '吉凶分歧（宜緩不宜急）';
        confidenceScore = 65;
    }

    // 提煉共同趨向點
    const convergentPoints = [];
    if (jiCount >= 2) {
        convergentPoints.push('多數卦象共振支持主動進取，外部資源與時機窗口已經敞開。');
    } else if (xiongCount >= 2) {
        convergentPoints.push('多數卦盤揭示潛在阻力較大，外部阻滯與內部消耗同在，切忌孤注一擲。');
    } else {
        convergentPoints.push('三盤動態呈現交錯，表明事態處於轉型換軌之關鍵磨合期。');
    }

    if (qmGong.direction) {
        convergentPoints.push(`行動空間指針明確指向【${qmGong.direction}】，順此方位布局更易獲取貴人奧援。`);
    }

    // 提煉誠實揭露的系統分歧點 (Never average away contradictions)
    const divergentPoints = [];
    if (qmSignal !== lySignal || qmSignal !== mhSignal || lySignal !== mhSignal) {
        if (qmSignal === '吉' && (lySignal === '凶' || mhSignal === '凶')) {
            divergentPoints.push('奇門外盤得吉門大吉，但六爻或梅花內部體用有剋，揭示「外部市場/大勢機會雖好，但內部自身準備或落地細節仍有硬傷需克服」。');
        } else if (qmSignal === '凶' && (lySignal === '吉' || mhSignal === '吉')) {
            divergentPoints.push('奇門宏觀時空局勢偏弱或逢凶神，但六爻用神旺相或梅花生體，象徵「大環境阻力雖在，但個人實力過硬，憑藉精準執行仍可破局成事」。');
        } else {
            divergentPoints.push('各系統在時空節奏上出現微幅錯位，提示切莫急於在單一時間點全面鋪開，應採階段性推進。');
        }
    } else {
        divergentPoints.push('三盤高度同向無顯著對立，可堅定貫徹既定決策路徑。');
    }

    const actionGuide = {
        節奏建議: jiCount >= 2
            ? '順勢而為，把握未來 1 至 3 個月的主動推進期，速戰速決。'
            : '暫緩擴張，以守代攻，優先優化自身風險準備與合約防護。',
        破局方位: `${qmGong.direction || '東南'}（順應奇門生門與吉神生發之氣）`,
        風險防線: `重點關注六爻動爻轉折【${(ly.zhuxiRule?.movingLines || []).join('、') || '主變'}爻】，做好備案防範波折。`
    };

    const summary = `【三卜合參決策指引】針對「${question}」，奇門定調【${qmSignal}】、六爻定調【${lySignal}】、梅花定調【${mhSignal}】。綜合研判定調為【${alignment}】（信心指數：${confidenceScore}%）。行動指引：${actionGuide.節奏建議} 方位佈局可擇${actionGuide.破局方位}。`;

    const actionGuideText = `1. 節奏建議：${actionGuide.節奏建議} 2. 破局方位：${actionGuide.破局方位} 3. 風險防線：${actionGuide.風險防線}`;

    return {
        question,
        category,
        datetime: `${dateStr} ${timeStr}`,
        systems: {
            qimen: qimenVerdict,
            liuyao: liuyaoVerdict,
            meihua: meihuaVerdict
        },
        qimen: qimenVerdict,
        liuyao: liuyaoVerdict,
        meihua: meihuaVerdict,
        convergentPoints,
        divergentPoints,
        actionGuide,
        actionGuideText,
        consensus: {
            alignment,
            verdict: alignment,
            rating: `${alignment} (${confidenceScore}分)`,
            score: confidenceScore,
            confidenceScore,
            convergentPoints,
            divergentPoints,
            actionGuide
        },
        synthesis: {
            synthesisScore: confidenceScore,
            verdict: alignment,
            strategy: actionGuide.節奏建議,
            timingGuide: actionGuide.節奏建議
        },
        summary
    };
}

/**
 * 3. analyzeCezi (Tier 3A: 測字占事)
 */
function analyzeCezi(input = {}) {
    const rawChar = String(typeof input === 'string' ? input : (input.char || input.character || input.text || '')).trim();
    const singleChar = rawChar.match(/[\u4e00-\u9fa5]/)?.[0];
    if (!singleChar) {
        const err = new Error('請輸入至少一個有效繁/簡中文字進行測字');
        err.statusCode = 400;
        throw err;
    }

    const question = (typeof input === 'object' && (input.question || input.matter)) ? (input.question || input.matter) : '請解此字所示之事態吉凶';
    const profileKey = (typeof input === 'object' && input.profile) ? input.profile : 'taiwanKangxi';
    const profile = nameAnalysis.PROFILE[profileKey] || nameAnalysis.PROFILE.taiwanKangxi;

    // 檢索字元屬性
    const info = nameAnalysis.characterInfo(singleChar, profile);
    if (!info || !info.known || !info.stroke) {
        const err = new Error(`康熙字典庫中未收錄漢字「${singleChar}」，請輸入常用正體或簡體漢字。`);
        err.statusCode = 400;
        throw err;
    }
    const stroke = info.stroke;
    const structure = info.structure || '獨體';
    const element = info.element || ['水', '木', '木', '火', '火', '土', '土', '金', '金', '水'][stroke % 10];

    // 拆字易理解構
    let structureMeaning;
    switch (structure) {
        case '左右':
            structureMeaning = '主客並立、分工合作與人際互動，事態成敗高度取決於外部協作與雙向溝通。';
            break;
        case '上下':
            structureMeaning = '尊卑有序、承上啟下與階段遞進，需依序而行，尊重規律或階層，切忌踰矩。';
            break;
        case '包圍':
        case '半包圍':
            structureMeaning = '守成蓄勢、外圍有局限需尋突破口，內在蘊含機遇，目前宜固本培元，待時而發。';
            break;
        case '獨體':
            structureMeaning = '獨立自主、一氣呵成，全憑自身實力開拓，不受外界牽制亦無現成奧援，考驗恆心。';
            break;
        default:
            structureMeaning = '多方相合，脈絡多元，需理清主次與核心焦點。';
            break;
    }

    // 梅花易數測字起卦 (上卦、下卦、動爻)
    const upperNum = Math.floor(stroke / 2) || 1;
    const lowerNum = (stroke - upperNum) || 1;
    const upperGua = meihua.numToGua(upperNum);
    const lowerGua = meihua.numToGua(lowerNum);
    const movingYao = meihua.numToYao(stroke % 6 || 6);
    const hexAnalysis = meihua.analyzeHexagram(upperGua, lowerGua, movingYao, { month: new Date().getMonth() + 1 });

    const n81Entry = n81.entries?.find(e => e.number === stroke) || { number: stroke, classification: '吉' };
    const numerology81 = {
        number: stroke,
        classification: n81Entry.classification,
        fortune: n81Entry.classification,
        luck: n81Entry.classification,
        meaning: `康熙筆畫第 ${stroke} 數，81數理定性為【${n81Entry.classification}】。`
    };

    // 若傳入生日，與八字五行喜用神合參
    let baziComplement = null;
    if (input.birthDate) {
        try {
            const bazi2 = require('./bazi2');
            const baziRes = bazi2.calculateBazi({ date: input.birthDate, sex: input.sex || '男' });
            const usefulGodStr = baziRes.strengthAnalysis?.usefulGod || '';
            const isComplementary = usefulGodStr.includes(element);
            const evalText = isComplementary
                ? `此字五行屬【${element}】，恰好吻合命盤喜用神（${usefulGodStr}），字氣大助運勢！`
                : `此字五行屬【${element}】，與命盤日主【${baziRes.dayMaster?.stem || ''}${baziRes.dayMaster?.element || ''}】（喜用：${usefulGodStr}）呈現調適互補之象。`;
            baziComplement = {
                dayMaster: baziRes.dayMaster,
                usefulGod: usefulGodStr,
                charElement: element,
                isComplementary,
                evaluation: evalText,
                analysis: evalText,
                summary: evalText
            };
        } catch {
            baziComplement = null;
        }
    }

    // 吉凶綜合斷定
    const hexJudge = hexAnalysis.wuxing?.judgement;
    let judgment;
    if (numerology81.classification === '吉' && hexJudge === '吉') {
        judgment = '大吉';
    } else if (numerology81.classification === '吉' || hexJudge === '吉') {
        judgment = '中吉';
    } else if (numerology81.classification === '凶' && hexJudge === '凶') {
        judgment = '小凶';
    } else {
        judgment = '平';
    }

    const advice = {
        字形機鋒: `此字為【${structure}結構】，部首為【${info.radical || '部首'}】。${structureMeaning}`,
        五行應對: `五行屬【${element}】，卦應【${hexAnalysis.bengua?.name || '本卦'}】變【${hexAnalysis.biangua?.name || '變卦'}】，體用【${hexAnalysis.wuxing?.summary || '相生'}】。`,
        行動錦囊: `針對「${question}」，測得象數調和為【${judgment}】。凡事宜循字理行事，重視${structure === '左右' ? '人脈協調' : structure === '上下' ? '次序步驟' : '內在實力'}。`
    };
    const adviceText = `${advice.字形機鋒} ${advice.五行應對} ${advice.行動錦囊}`;

    const summary = `【測字占事結果】字元：『${singleChar}』（康熙筆畫：${stroke}畫 · 五行：${element} · 結構：${structure}）。卦象成【${hexAnalysis.bengua?.name || ''}】變【${hexAnalysis.biangua?.name || ''}】，數理定性為【${numerology81.classification}】，綜合斷定為【${judgment}】。${advice.行動錦囊}`;

    return {
        char: singleChar,
        character: singleChar,
        question,
        stroke,
        strokeCount: stroke,
        pinyin: info.pinyin || '',
        radical: info.radical || '',
        element,
        fiveElement: element,
        definition: info.definition || '',
        structure,
        radicalStructure: structure,
        structureMeaning,
        glyphDeconstruction: structureMeaning,
        charHexagram: {
            name: `${hexAnalysis.bengua?.name || '本卦'} ➔ ${hexAnalysis.biangua?.name || '變卦'}`,
            guaName: hexAnalysis.bengua?.name,
            bengua: hexAnalysis.bengua?.name,
            biangua: hexAnalysis.biangua?.name,
            hugua: hexAnalysis.hugua?.name,
            relation: hexAnalysis.wuxing?.summary,
            judgement: hexAnalysis.wuxing?.judgement,
            grade: hexAnalysis.wuxing?.judgement || '平',
            judgment: hexAnalysis.wuxing?.detail || hexAnalysis.wuxing?.summary || '卦氣相符，動靜得宜。'
        },
        yijingHexagram: hexAnalysis.bengua?.name || '',
        numerology81,
        baziComplement,
        judgment,
        advice,
        adviceText,
        categoryAnalysis: advice,
        summary
    };
}

/**
 * 4. calculateYunqiWellness (Tier 3B: 五運六氣 × 二十四節氣 × 十二時辰子午流注養生)
 */
function calculateYunqiWellness(input = {}, hourArg) {
    let dateStr = null;
    let targetYear = null;
    let currentHour = null;

    if (typeof input === 'string') {
        dateStr = input;
        const [y] = input.split('-').map(Number);
        targetYear = y || new Date().getFullYear();
        if (hourArg !== undefined) {
            currentHour = typeof hourArg === 'number' ? hourArg : Number(String(hourArg).split(':')[0]);
        }
    } else if (typeof input === 'object' && input !== null) {
        dateStr = input.date || input.datetime || null;
        if (dateStr) {
            targetYear = Number(dateStr.split('-')[0]);
        } else {
            targetYear = Number(input.targetYear || input.year) || new Date().getFullYear();
        }
        if (input.currentHour !== undefined) {
            currentHour = Number(input.currentHour);
        } else if (input.time || input.hour) {
            currentHour = Number(String(input.time || input.hour).split(':')[0]);
        }
    }

    if (!targetYear) targetYear = new Date().getFullYear();
    if (currentHour === null || isNaN(currentHour)) currentHour = new Date().getHours();

    // 1. 流年五運六氣 (Great Movement & Six Qi)
    const yearLunar = Lunar.fromYmd(targetYear, 6, 1);
    const yearGanZhi = yearLunar.getYearInGanZhi();
    const stem = yearGanZhi.slice(0, 1);
    const branch = yearGanZhi.slice(1, 2);

    // 歲運（大運/中運）：甲己土、乙庚金、丙辛水、丁壬木、戊癸火
    const GREAT_MOVEMENT_TABLE = {
        '甲': { element: '土', tone: '太宮', nature: '土運太過', impact: '雨濕流行，腎水受邪，脾土偏盛，注意脾濕與水腫。' },
        '己': { element: '土', tone: '少宮', nature: '土運不及', impact: '風乃大行，木剋土，脾胃易虛，注意消化系統與四肢倦怠。' },
        '乙': { element: '金', tone: '少商', nature: '金運不及', impact: '炎火乃行，火剋金，肺金受制，注意呼吸系統與皮膚乾癢。' },
        '庚': { element: '金', tone: '太商', nature: '金運太過', impact: '燥氣流行，肝木受邪，氣管咽喉燥熱，宜潤燥滋陰。' },
        '丙': { element: '水', tone: '太羽', nature: '水運太過', impact: '寒氣流行，邪害心火，心腎不交，注意心血管與畏寒腰酸。' },
        '辛': { element: '水', tone: '少羽', nature: '水運不及', impact: '濕乃大行，土剋水，腎水不足，注意水液代謝與骨骼關節。' },
        '丁': { element: '木', tone: '少角', nature: '木運不及', impact: '燥乃大行，金剋木，肝氣不舒，注意情緒鬱結與兩脅脹痛。' },
        '壬': { element: '木', tone: '太角', nature: '木運太過', impact: '風氣流行，脾土受邪，肝氣亢盛，注意血壓偏高與頭目眩暈。' },
        '戊': { element: '火', tone: '太徵', nature: '火運太過', impact: '炎暑流行，肺金受邪，火氣太旺，注意心火上炎與口舌生瘡。' },
        '癸': { element: '火', tone: '少徵', nature: '火運不及', impact: '寒乃大行，水剋火，心陽不振，注意畏寒乏力與心神不寧。' }
    };

    // 司天與在泉（地支決標）：
    const SIX_QI_TABLE = {
        '子': { siTian: '少陰君火司天', zaiQuan: '陽明燥金在泉', organMatch: '心·肺', guidance: '上半年熱氣偏盛，下半年燥氣流行，注意清心養陰與潤肺保津。' },
        '午': { siTian: '少陰君火司天', zaiQuan: '陽明燥金在泉', organMatch: '心·肺', guidance: '上半年君火主權宜防溫熱發散，下半年燥金在泉需防秋燥傷肺。' },
        '丑': { siTian: '太陰濕土司天', zaiQuan: '太陽寒水在泉', organMatch: '脾·腎', guidance: '上半年濕土主權防脾濕水困，下半年寒水在泉需溫補腎陽。' },
        '未': { siTian: '太陰濕土司天', zaiQuan: '太陽寒水在泉', organMatch: '脾·腎', guidance: '濕氣兼寒，宜溫中健脾、利水祛濕，少食冷飲冰品。' },
        '寅': { siTian: '少陽相火司天', zaiQuan: '厥陰風木在泉', organMatch: '膽·肝', guidance: '上半年相火升發防肝火擾動，下半年風木行令注意筋骨酸軟。' },
        '申': { siTian: '少陽相火司天', zaiQuan: '厥陰風木在泉', organMatch: '膽·肝', guidance: '火風相扇，宜平肝潛陽、調和氣血，避免情緒過度激動。' },
        '卯': { siTian: '陽明燥金司天', zaiQuan: '少陰君火在泉', organMatch: '大腸·心', guidance: '上半年燥金主政防肺胃燥結，下半年君火回流注意心火與睡眠。' },
        '酉': { siTian: '陽明燥金司天', zaiQuan: '少陰君火在泉', organMatch: '大腸·心', guidance: '金燥火熱，宜以甘涼滋潤為主，多食水梨、甘蔗、百合。' },
        '辰': { siTian: '太陽寒水司天', zaiQuan: '太陰濕土在泉', organMatch: '膀胱·脾', guidance: '上半年寒氣較重注意關節防寒，下半年濕土當權注意脾胃化濕。' },
        '戌': { siTian: '太陽寒水司天', zaiQuan: '太陰濕土在泉', organMatch: '膀胱·脾', guidance: '寒濕同犯，宜溫腎健脾、艾灸固陽，多食用生薑與羊肉溫補。' },
        '巳': { siTian: '厥陰風木司天', zaiQuan: '少陽相火在泉', organMatch: '肝·心包', guidance: '上半年春風早行防肝氣過旺，下半年相火伏藏注意保養心神。' },
        '亥': { siTian: '厥陰風木司天', zaiQuan: '少陽相火在泉', organMatch: '肝·心包', guidance: '風木兼火，宜滋水涵木，保持充足睡眠與心平氣和。' }
    };

    const greatMovement = GREAT_MOVEMENT_TABLE[stem] || GREAT_MOVEMENT_TABLE['丙'];
    const sixQi = SIX_QI_TABLE[branch] || SIX_QI_TABLE['午'];

    const annualSummaryText = `【${yearGanZhi}年】五運為【${greatMovement.nature}】（${greatMovement.tone}），六氣為【${sixQi.siTian}，${sixQi.zaiQuan}】。重點調理臟腑為【${sixQi.organMatch}】。${greatMovement.impact} ${sixQi.guidance}`;
    const annualYunqi = {
        year: targetYear,
        yearGanZhi,
        greatMovement,
        sixQi,
        overallClimateWellness: annualSummaryText,
        summary: annualSummaryText
    };

    // 2. 本命五運六氣（若提供出生日期）
    let birthYunqi = null;
    if (input.birthDate || dateStr) {
        try {
            const bDate = new Date(input.birthDate || dateStr);
            if (!isNaN(bDate.getTime())) {
                const bLunar = Lunar.fromDate(bDate);
                const bYearGanZhi = bLunar.getYearInGanZhi();
                const bStem = bYearGanZhi.slice(0, 1);
                const bBranch = bYearGanZhi.slice(1, 2);
                const bMovement = GREAT_MOVEMENT_TABLE[bStem] || GREAT_MOVEMENT_TABLE['甲'];
                const bSixQi = SIX_QI_TABLE[bBranch] || SIX_QI_TABLE['子'];
                const birthAdviceText = `本命出生逢【${bMovement.nature}】，先天【${bMovement.element}】氣偏${bMovement.nature.includes('太過') ? '盛' : '弱'}。入【${targetYear} ${yearGanZhi}年】需注意本命氣質與流年氣候之同氣相乘或相剋調和。`;
                birthYunqi = {
                    birthYearGanZhi: bYearGanZhi,
                    greatMovement: bMovement,
                    sixQi: bSixQi,
                    constitutionalAdvice: birthAdviceText,
                    summary: birthAdviceText
                };
            }
        } catch {
            birthYunqi = null;
        }
    }

    // 3. 當前節氣養生 (Current Solar Term)
    const nowLunar = Solar.fromDate(new Date()).getLunar();
    let currentTerm = '立春';
    let nextTerm = '雨水';
    try {
        const prevJq = nowLunar.getPrevJieQi(true);
        const nextJq = nowLunar.getNextJieQi(true);
        if (prevJq) currentTerm = prevJq.getName();
        if (nextJq) nextTerm = nextJq.getName();
    } catch {
        currentTerm = '立春';
    }

    const termData = SOLAR_TERM_DATABASE[currentTerm] || SOLAR_TERM_DATABASE['立春'];
    const solarTermWellness = {
        currentTerm,
        currentSolarTerm: currentTerm,
        nextTerm,
        seasonElement: termData.seasonElement,
        dietAdvice: termData.dietAdvice,
        lifestyleAdvice: termData.lifestyleAdvice,
        acupointAdvice: termData.acupointAdvice
    };

    // 4. 十二時辰子午流注鐘 (Meridian Clock)
    // 找出當前 active 時辰
    let activeIndex = 0;
    if (currentHour === 23 || currentHour === 0) activeIndex = 0; // 子
    else if (currentHour >= 1 && currentHour <= 2) activeIndex = 1; // 丑
    else if (currentHour >= 3 && currentHour <= 4) activeIndex = 2; // 寅
    else if (currentHour >= 5 && currentHour <= 6) activeIndex = 3; // 卯
    else if (currentHour >= 7 && currentHour <= 8) activeIndex = 4; // 辰
    else if (currentHour >= 9 && currentHour <= 10) activeIndex = 5; // 巳
    else if (currentHour >= 11 && currentHour <= 12) activeIndex = 6; // 午
    else if (currentHour >= 13 && currentHour <= 14) activeIndex = 7; // 未
    else if (currentHour >= 15 && currentHour <= 16) activeIndex = 8; // 申
    else if (currentHour >= 17 && currentHour <= 18) activeIndex = 9; // 酉
    else if (currentHour >= 19 && currentHour <= 20) activeIndex = 10; // 戌
    else if (currentHour >= 21 && currentHour <= 22) activeIndex = 11; // 亥

    const activeShichen = MERIDIAN_FLOW[activeIndex];
    const meridianClock = {
        currentHour,
        shichen: activeShichen.shichen,
        meridian: activeShichen.meridian,
        action: activeShichen.action,
        activeShichen: {
            ...activeShichen,
            isCurrent: true
        },
        allShichen: MERIDIAN_FLOW.map((item, idx) => ({
            ...item,
            isCurrent: idx === activeIndex
        }))
    };

    const summary = `【五運六氣與子午流注】${targetYear}（${yearGanZhi}年）歲運為【${greatMovement.nature}】，${sixQi.siTian}、${sixQi.zaiQuan}。當前處於【${currentTerm}】節氣（五行屬${termData.seasonElement}），養生重點：${termData.dietAdvice}。當前時辰為【${activeShichen.shichen}·${activeShichen.meridian}】，當令建議：${activeShichen.action}`;

    return {
        date: dateStr || `${targetYear}-01-01`,
        year: targetYear,
        yearGanZhi,
        suiYun: greatMovement.nature,
        siTian: sixQi.siTian,
        zaiQuan: sixQi.zaiQuan,
        solarTerm: currentTerm,
        meridianFlow: activeShichen,
        wellnessAdvice: {
            diet: termData.dietAdvice,
            lifestyle: termData.lifestyleAdvice,
            acupuncturePoints: activeShichen.acupoint ? [activeShichen.acupoint] : ['足三里', '太衝', '湧泉'],
            taboo: termData.taboo || termData.lifestyleAdvice || '避免暴飲暴食，忌熬夜過勞'
        },
        birthYunqi,
        annualYunqi,
        solarTermWellness,
        meridianClock,
        summary
    };
}

/**
 * 5. buildFactChecklist (Tier 4A: 確定性事實鎖定清單)
 */
function buildFactChecklist(serviceKey, data) {
    if (!data) return { serviceKey, count: 0, facts: [] };

    const facts = [];

    switch (serviceKey) {
        case 'bazi':
        case 'bazi2': {
            if (data.fourPillars && Array.isArray(data.fourPillars)) {
                facts.push(`四柱干支：${data.fourPillars.map(p => `${p.label || ''}【${p.value || (p.stem + p.branch)}】`).join('、')}`);
                data.fourPillars.forEach(p => {
                    if (p.label) facts[p.label] = p.value || (p.stem + p.branch);
                });
            }
            if (data.dayMaster?.stem) {
                facts.push(`日主元神：天干【${data.dayMaster.stem}】（五行屬${data.dayMaster.element || ''}）`);
                facts['日主 (日元)'] = `${data.dayMaster.stem}${data.dayMaster.element || ''}`;
                facts['日主'] = data.dayMaster.stem;
            }
            if (data.strengthAnalysis?.strength) {
                facts.push(`日主身強身弱：【${data.strengthAnalysis.strength}】`);
                facts['身強身弱'] = data.strengthAnalysis.strength;
            }
            if (data.strengthAnalysis?.usefulGod) {
                facts.push(`命盤喜用神：【${data.strengthAnalysis.usefulGod}】`);
                facts['喜用神'] = data.strengthAnalysis.usefulGod;
            }
            if (data.geju?.name || data.geju?.pattern) {
                facts.push(`八字格局：【${data.geju?.name || data.geju?.pattern}】`);
                facts['八字格局'] = data.geju?.name || data.geju?.pattern;
            }
            if (data.chenggu?.weightLabel) {
                facts.push(`袁天罡稱骨重量：【${data.chenggu.weightLabel}】`);
                facts['稱骨重量'] = data.chenggu.weightLabel;
            }
            break;
        }

        case 'ziwei': {
            const ming = data.mingPalaceBranch || data.chart?.mingPalaceBranch;
            const shen = data.shenPalaceBranch || data.chart?.shenPalaceBranch;
            const bureau = data.bureau || data.chart?.bureau;
            const stars = data.mingMainStars || data.chart?.mingMainStars;

            if (ming) facts.push(`命宮地支位置：【${ming}宮】`);
            if (shen) facts.push(`身宮地支位置：【${shen}宮】`);
            if (bureau) facts.push(`五行局：【${bureau}】`);
            if (stars) facts.push(`命宮主星：【${Array.isArray(stars) && stars.length > 0 ? stars.join('、') : '無主星（借對宮）'}】`);
            break;
        }

        case 'liuyao': {
            if (data.benGua?.name) facts.push(`本卦卦名：【${data.benGua.name}】`);
            if (data.zhiGua?.name) facts.push(`之卦（變卦）卦名：【${data.zhiGua.name}】`);
            if (data.yongshen?.target || data.yongshen?.name) {
                facts.push(`選定用神：【${data.yongshen.target || data.yongshen.name}】`);
            }
            if (data.zhuxiRule?.movingLines) {
                const lines = data.zhuxiRule.movingLines;
                facts.push(`發動爻位：【${lines.length > 0 ? `第 ${lines.join('、')} 爻動` : '無動爻（靜卦）'}】`);
            }
            break;
        }

        case 'meihua': {
            if (data.bengua?.name) facts.push(`本卦：【${data.bengua.name}】`);
            if (data.hugua?.name) facts.push(`互卦：【${data.hugua.name}】`);
            if (data.biangua?.name) facts.push(`變卦：【${data.biangua.name}】`);
            if (data.tigua?.name && data.yonggua?.name) {
                facts.push(`體用定位：體卦為【${data.tigua.name}·${data.tigua.element || ''}】，用卦為【${data.yonggua.name}·${data.yonggua.element || ''}】`);
            }
            break;
        }

        case 'qimen': {
            if (data.juShu?.fullName || data.basicInfo?.juInfo) {
                facts.push(`遁局立極：【${data.juShu?.fullName || data.basicInfo?.juInfo}】`);
            }
            if (data.zhiFuGong) facts.push(`值符落宮：【第 ${data.zhiFuGong} 宮】`);
            if (data.zhiShiMen && data.zhiShiGong) facts.push(`值使門位：【${data.zhiShiMen}落第 ${data.zhiShiGong} 宮】`);
            if (data.analysis?.bestGong) facts.push(`全局最優吉方宮位：【第 ${data.analysis.bestGong} 宮】`);
            break;
        }

        case 'fengshui': {
            const facing = data.facing || data.basicInfo?.facing;
            const house = data.eightMansions?.house;
            const mingGua = data.resident?.mingGua?.name;
            const mzz = data.menZhuZao?.patternName;

            if (facing) facts.push(`二十四山房屋坐向：【坐${data.sitting || ''}向${facing}】`);
            if (house) facts.push(`八宅宅卦：【${house}】`);
            if (mingGua) facts.push(`居住者本命命卦：【${mingGua}】`);
            if (mzz) facts.push(`門主灶配星格局：【${mzz}】`);
            break;
        }

        case 'yinyuan': {
            if (data.score !== undefined) facts.push(`合盤綜合評分：【${data.score} 分】`);
            if (data.grade) facts.push(`合盤等級契合度：【${data.grade}】`);
            if (data.sceneLabel) facts.push(`諮詢合盤場景：【${data.sceneLabel}】`);
            break;
        }

        case 'nameAnalysis': {
            if (data.char) {
                facts.push(`測字漢字：【${data.char}】（康熙筆畫：${data.stroke}畫 · 五行屬${data.element} · 結構：${data.structure}）`);
                if (data.charHexagram?.name) facts.push(`梅花字卦：【${data.charHexagram.name}】`);
                if (data.numerology81?.classification) facts.push(`81數理定性：【${data.numerology81.classification}】`);
            }
            if (data.name) facts.push(`姓名全名：【${data.name}】`);
            if (data.grids) {
                facts.push(`五格數理：天格【${data.grids.tian}】、人格【${data.grids.ren}】、地格【${data.grids.di}】、外格【${data.grids.wai}】、總格【${data.grids.zong}】`);
            }
            if (data.sancai?.pattern || data.sancai?.elements) {
                facts.push(`三才配置五行：【${data.sancai.elements || data.sancai.pattern}】`);
            }
            break;
        }

        default:
            break;
    }

    return {
        service: serviceKey,
        serviceKey,
        count: facts.length,
        facts,
        keyRules: [
            '不得捏造或顛倒排盤給定的日主天干與五行',
            '不得虛構未發動的六爻爻位或篡改本卦變卦',
            '嚴格依據命盤格局與用神論斷，禁止矛盾推演'
        ]
    };
}

/**
 * verifyAnalysisClaims (Tier 4A: 防幻覺核驗機制)
 */
function verifyAnalysisClaims(arg1, arg2, arg3) {
    let serviceKey, data, analysisText;
    if (typeof arg1 === 'string' && typeof arg2 === 'object' && arg2 !== null && arg3 === undefined) {
        // Called as verifyAnalysisClaims(analysisText, checklist)
        analysisText = arg1;
        const checklist = arg2;
        serviceKey = checklist.serviceKey || checklist.service || 'bazi2';
        data = checklist.data || checklist.factsData || {};
        if (checklist.facts) {
            const rawFacts = checklist.facts;
            const dmFact = rawFacts['日主 (日元)'] || rawFacts['日主'] || (Array.isArray(rawFacts) ? rawFacts.find(f => f.includes('日主')) : '');
            if (dmFact) {
                const match = dmFact.match(/[甲乙丙丁戊己庚辛壬癸]/);
                if (match) {
                    data.dayMaster = { stem: match[0] };
                }
            }
        }
    } else {
        serviceKey = arg1;
        data = arg2 || {};
        analysisText = arg3 || '';
    }

    if (!analysisText || typeof analysisText !== 'string') {
        return { passed: true, checkedCount: 0, matchedFacts: [], warnings: [], contradictions: [] };
    }

    const checklistResult = buildFactChecklist(serviceKey, data);
    const facts = checklistResult.facts;
    const matchedFacts = [];
    const warnings = [];

    // 檢查八字日主不被篡改
    if ((serviceKey === 'bazi' || serviceKey === 'bazi2') && data.dayMaster?.stem) {
        const correctStem = data.dayMaster.stem;
        const allStems = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
        for (const wrongStem of allStems) {
            if (wrongStem !== correctStem) {
                if (
                    analysisText.includes(`日主${wrongStem}`) ||
                    analysisText.includes(`日主為${wrongStem}`) ||
                    analysisText.includes(`日主是${wrongStem}`) ||
                    analysisText.includes(`日元${wrongStem}`) ||
                    analysisText.includes(`日元為${wrongStem}`) ||
                    analysisText.includes(`日元是${wrongStem}`)
                ) {
                    warnings.push(`AI 生成內容疑似捏造錯誤的日主天干【${wrongStem}】，系統確定日主為【${correctStem}】`);
                }
            }
        }
    }

    // 檢查六爻卦名不被捏造
    if (serviceKey === 'liuyao' && data.benGua?.name) {
        if (analysisText.includes(data.benGua.name)) {
            matchedFacts.push(`本卦【${data.benGua.name}】一致`);
        }
    }

    // 檢查梅花卦名
    if (serviceKey === 'meihua' && data.bengua?.name) {
        if (analysisText.includes(data.bengua.name)) {
            matchedFacts.push(`本卦【${data.bengua.name}】一致`);
        }
    }

    return {
        passed: warnings.length === 0,
        checkedCount: facts.length,
        matchedFacts,
        warnings,
        contradictions: warnings
    };
}

module.exports = {
    QimenDunjia,
    MeihuaYishu,
    searchAuspiciousTimes,
    evaluateDecisionCombo,
    analyzeCezi,
    calculateYunqiWellness,
    buildFactChecklist,
    verifyAnalysisClaims
};
