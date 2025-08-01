/**
 * 奇門遁甲核心計算庫
 * 實現完整的奇門遁甲排盤系統
 */

const {Lunar, Solar, JieQi} = require('lunar-javascript');
const jiuXingModule = require('./jiuxing');
const baMenModule = require('./bamen');
const baShenModule = require('./bashen');
const diPanModule = require('./dipan');
const constants = require('./constants');
const i18n = constants.i18n;

/**
 * 天幹地支對應
 */
const TIAN_GAN = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
const DI_ZHI = ["子", "醜", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

/**
 * 三奇六儀(天盤)
 */
const SAN_QI = ["戊", "己", "庚"];
const LIU_YI = ["辛", "壬", "癸", "丁", "丙", "乙"];

/**
 * 九宮位置信息 (根據語言動態產生)
 */
function getJiuGong(langCode = null) {
    const diPan = constants.getDiPan(langCode);
    return {
        '1': { name: diPan['1'].name, direction: diPan['1'].direction, element: 'shui', color: '#03A9F4', yinyang: '陰' },
        '2': { name: diPan['2'].name, direction: diPan['2'].direction, element: 'tu', color: '#795548', yinyang: '陰' },
        '3': { name: diPan['3'].name, direction: diPan['3'].direction, element: 'mu', color: '#4CAF50', yinyang: '陽' },
        '4': { name: diPan['4'].name, direction: diPan['4'].direction, element: 'mu', color: '#4CAF50', yinyang: '陽' },
        '5': { name: diPan['5'].name, direction: diPan['5'].direction, element: 'tu', color: '#795548', yinyang: '陰陽' },
        '6': { name: diPan['6'].name, direction: diPan['6'].direction, element: 'jin', color: '#FF9800', yinyang: '陽' },
        '7': { name: diPan['7'].name, direction: diPan['7'].direction, element: 'jin', color: '#FF9800', yinyang: '陰' },
        '8': { name: diPan['8'].name, direction: diPan['8'].direction, element: 'tu', color: '#795548', yinyang: '陽' },
        '9': { name: diPan['9'].name, direction: diPan['9'].direction, element: 'huo', color: '#F44336', yinyang: '陽' }
    };
}

// 為了向後兼容，保留原始的 JIU_GONG 物件
const JIU_GONG = getJiuGong();

/**
 * 九星信息 (根據語言動態產生)
 */
function getJiuXing(langCode = null) {
    const jiuxing = constants.getXing(langCode);
    const jiuxingAlias = constants.getXingAlias(langCode);
    
    return {
        [jiuxing['1']]: { alias: jiuxingAlias[jiuxing['1']], element: 'shui', color: '#03A9F4', feature: '主智慧、口才、機變' },
        [jiuxing['2']]: { alias: jiuxingAlias[jiuxing['2']], element: 'tu', color: '#795548', feature: '主穩重、忠厚、堅韌' },
        [jiuxing['3']]: { alias: jiuxingAlias[jiuxing['3']], element: 'mu', color: '#4CAF50', feature: '主衝擊、變化、快速' },
        [jiuxing['4']]: { alias: jiuxingAlias[jiuxing['4']], element: 'mu', color: '#4CAF50', feature: '主扶助、支持、輔佐' },
        [jiuxing['5']]: { alias: jiuxingAlias[jiuxing['5']], element: 'tu', color: '#795548', feature: '為中宮之神，主樞紐、核心' },
        [jiuxing['6']]: { alias: jiuxingAlias[jiuxing['6']], element: 'jin', color: '#FF9800', feature: '主決斷、判斷、果決' },
        [jiuxing['7']]: { alias: jiuxingAlias[jiuxing['7']], element: 'jin', color: '#FF9800', feature: '主堅固、支撐、頂天立地' },
        [jiuxing['8']]: { alias: jiuxingAlias[jiuxing['8']], element: 'tu', color: '#795548', feature: '主責任、重擔、實際' },
        [jiuxing['9']]: { alias: jiuxingAlias[jiuxing['9']], element: 'huo', color: '#F44336', feature: '主文采、明亮、智慧' }
    };
}

// 為了向後兼容，保留原始的 JIU_XING 物件
const JIU_XING = getJiuXing();

/**
 * 八門信息
 */
const BA_MEN = {
    '休門': { feature: '為吉門，主休養、安寧、平和。適合休息與調養。', type: 'ji', element: 'shui', color: '#03A9F4' },
    '生門': { feature: '為吉門，主生發、成長、喜慶。適合開始新事物。', type: 'ji', element: 'mu', color: '#4CAF50' },
    '傷門': { feature: '為兇門，主傷害、損失、疾病。需避免沖突與傷害。', type: 'xiong', element: 'mu', color: '#4CAF50' },
    '杜門': { feature: '為兇門，主阻塞、停滯、困難。事情易受阻礙。', type: 'xiong', element: 'tu', color: '#795548' },
    '景門': { feature: '為吉門，主光明、展示、明亮。適合公開場合與展示。', type: 'ji', element: 'huo', color: '#F44336' },
    '死門': { feature: '為兇門，主衰敗、結束、死亡。不宜開始重要事情。', type: 'xiong', element: 'tu', color: '#795548' },
    '驚門': { feature: '為兇門，主驚嚇、變故、突發狀況。需註意意外變化。', type: 'xiong', element: 'jin', color: '#FF9800' },
    '開門': { feature: '為吉門，主通達、順暢、開始。萬事順利，有好的開端。', type: 'ji', element: 'jin', color: '#FF9800' }
};

/**
 * 八神信息
 */
const BA_SHEN = {
    '值符': { feature: '為貴神，主吉慶、貴人、福星。', type: 'ji' },
    '騰蛇': { feature: '為兇神，主口舌是非、波動起伏。', type: 'xiong' },
    '太陰': { feature: '為吉神，主柔和、隱藏、內斂。', type: 'ji' },
    '六合': { feature: '為吉神，主和諧、團結、合作。', type: 'ji' },
    '白虎': { feature: '為兇神，主兇猛、傷害、災禍。', type: 'xiong' },
    '玄武': { feature: '為兇神，主隱秘、盜竊、欺詐。', type: 'xiong' },
    '九地': { feature: '為吉神，主地利、豐收、穩固。', type: 'ji' },
    '九天': { feature: '為吉神，主高升、貴人、成功。', type: 'ji' }
};

/**
 * 節氣與局數的映射關系
 */
const JIE_QI_JU_SUAN = [
    { jieqi: '冬至', type: 'yang', numbers: '174' },
    { jieqi: '驚蟄', type: 'yang', numbers: '174' },
    { jieqi: '小寒', type: 'yang', numbers: '285' },
    { jieqi: '大寒', type: 'yang', numbers: '396' },
    { jieqi: '春分', type: 'yang', numbers: '396' },
    { jieqi: '雨水', type: 'yang', numbers: '963' },
    { jieqi: '清明', type: 'yang', numbers: '417' },
    { jieqi: '立夏', type: 'yang', numbers: '417' },
    { jieqi: '立春', type: 'yang', numbers: '852' },
    { jieqi: '谷雨', type: 'yang', numbers: '528' },
    { jieqi: '小滿', type: 'yang', numbers: '528' },
    { jieqi: '芒種', type: 'yang', numbers: '639' },
    { jieqi: '夏至', type: 'yin', numbers: '936' },
    { jieqi: '白露', type: 'yin', numbers: '936' },
    { jieqi: '小暑', type: 'yin', numbers: '825' },
    { jieqi: '大暑', type: 'yin', numbers: '714' },
    { jieqi: '秋分', type: 'yin', numbers: '714' },
    { jieqi: '立秋', type: 'yin', numbers: '258' },
    { jieqi: '寒露', type: 'yin', numbers: '693' },
    { jieqi: '立冬', type: 'yin', numbers: '693' },
    { jieqi: '處暑', type: 'yin', numbers: '147' },
    { jieqi: '霜降', type: 'yin', numbers: '582' },
    { jieqi: '小雪', type: 'yin', numbers: '582' },
    { jieqi: '大雪', type: 'yin', numbers: '471' }
];

/**
 * 計算陰陽遁局數
 * @param {Date} date 日期時間
 * @param {String} method 排盤方法：'時家', '日家', '月家', '年家'
 * @returns {Object} 局數信息
 */
function calculateJuShu(date, method = '時家') {
    // 使用lunar-javascript獲取當前節氣信息
    const lunar = Lunar.fromDate(date);
    const solar = Solar.fromDate(date);
    
    // 根據排盤方法選擇不同的時間單位
    let jieQiName;
    if (method === '時家' || method === '日家') {
        // 獲取最近的節氣
        jieQiName = lunar.getPrevJieQi(true).getName();
    } else if (method === '月家') {
        // 獲取當月的節氣
        jieQiName = lunar.getJieQiList()[lunar.getMonth() * 2].getName();
    } else if (method === '年家') {
        // 獲取當年的立春
        const year = lunar.getYear();
        const liChun = Lunar.fromYmd(year, 2, 4).getPrevJieQi(true); // 立春一般在2月4日前後
        jieQiName = liChun.getName();
    }
    
    // 確定上中下元 - 修正元的確定方法
    // 需要根據幹支確定元
    let ganZhi = '';
    if (method === '時家') {
        ganZhi = lunar.getTimeInGanZhi();
    } else if (method === '日家') {
        ganZhi = lunar.getDayInGanZhi();
    } else if (method === '月家') {
        ganZhi = lunar.getMonthInGanZhi();
    } else if (method === '年家') {
        ganZhi = lunar.getYearInGanZhi();
    }
    
    // 提取地支
    const diZhi = ganZhi.substring(1);
    
    // 根據地支確定上中下元
    let yuan;
    // 四仲(孟)—子、午、卯、酉為上元
    if (['子', '午', '卯', '酉'].includes(diZhi)) {
        yuan = 0; // 上元
    } 
    // 四孟(仲)—寅、申、巳、亥為中元
    else if (['寅', '申', '巳', '亥'].includes(diZhi)) {
        yuan = 1; // 中元
    } 
    // 四季—辰、戌、醜、未為下元
    else {
        yuan = 2; // 下元
    }
    
    // 判斷陰陽遁
    // 冬至到夏至前這段時間是陽遁，夏至到冬至前這段是陰遁
    const solarYear = solar.getYear();
    const dongZhiDate = Solar.fromYmd(solarYear - 1, 12, 22); // 去年的冬至，約12月22日
    const xiaZhiDate = Solar.fromYmd(solarYear, 6, 21); // 今年的夏至，約6月21日
    const nextDongZhiDate = Solar.fromYmd(solarYear, 12, 22); // 今年的冬至
    
    // 判斷當前日期是在什麽時段內
    let yinYangType;
    if ((date >= dongZhiDate && date < xiaZhiDate) || 
        (date >= nextDongZhiDate)) {
        yinYangType = 'yang'; // 陽遁
    } else {
        yinYangType = 'yin'; // 陰遁
    }
    
    // 查找當前節氣對應的局數 - 修復節氣與局數的映射關系
    let juNumber = '1';
    
    // 在映射中查找當前節氣
    for (const item of JIE_QI_JU_SUAN) {
        if (item.jieqi === jieQiName) {
            // 使用正確的陰陽遁類型，而不是從節氣映射表獲取
            juNumber = item.numbers.charAt(yuan);
            break;
        }
    }
    
    return {
        jieQiName: jieQiName,
        type: yinYangType,
        number: juNumber,
        yuan: ['上元', '中元', '下元'][yuan],
        fullName: `${yinYangType === 'yin' ? '陰遁' : '陽遁'}${juNumber}局 (${['上元', '中元', '下元'][yuan]})`,
        formatCode: `${yinYangType}-${juNumber}`
    };
}

/**
 * 根據陰陽遁和局數排布三奇六儀
 * @param {Object} juShuInfo 局數信息對象
 * @returns {Object} 三奇六儀分布
 */
function distributeSanQiLiuYi(juShuInfo) {
    const type = juShuInfo.type; // 陰遁或陽遁
    const num = parseInt(juShuInfo.number); // 局數
    const result = {};
    
    // 在奇門遁甲中，相對應的天幹地支
    // 天幹的順序: 戊己庚辛壬癸丁丙乙 (註意其中不含甲)
    // 九宮數字與宮位對應：1坎、 2坤、 3震、 4巽、 5中、 6乾、 7兌、 8艮、 9離
    
    // 正確的三奇六儀順序
    const sanQiLiuYi = ['戊', '己', '庚', '辛', '壬', '癸', '丁', '丙', '乙'];
    
    // 中宮永遠是戊
    result['5'] = '戊';
    
    if (type === 'yin') { // 陰遁
        // 陰遁局數概念，1到9局
        const yinDunJu = {
            '1': { startGong: '9', direction: 'clockwise' },   // 陰遁一局，己入九宮（離）
            '2': { startGong: '8', direction: 'clockwise' },   // 陰遁二局，己入八宮（艮）
            '3': { startGong: '7', direction: 'clockwise' },   // 陰遁三局，己入七宮（兌）
            '4': { startGong: '6', direction: 'clockwise' },   // 陰遁四局，己入六宮（乾）
            '5': { startGong: '4', direction: 'clockwise' },   // 陰遁五局，己入四宮（巽）
            '6': { startGong: '3', direction: 'clockwise' },   // 陰遁六局，己入三宮（震）
            '7': { startGong: '2', direction: 'clockwise' },   // 陰遁七局，己入二宮（坤）
            '8': { startGong: '1', direction: 'clockwise' },   // 陰遁八局，己入一宮（坎）
            '9': { startGong: '9', direction: 'clockwise' }    // 陰遁九局，己入九宮（離）
        };
        
        // 得到當前局數的起始宮位和方向
        const juConfig = yinDunJu[num.toString()];
        
        // 如果沒有對應的局數配置，返回空結果
        if (!juConfig) return result;
        
        // 得到己幹的宮位
        const jiGong = juConfig.startGong;
        result[jiGong] = '己';
        
        // 根據方向排列其余七幹
        // 宮位順序（順時針，不含中宮）
        const clockwiseGongOrder = ['9', '8', '7', '6', '4', '3', '2', '1'];
        
        // 找到己在宮位序列中的位置
        const jiIndex = clockwiseGongOrder.indexOf(jiGong);
        
        if (jiIndex === -1) return result; // 如果沒有找到，返回結果
        
        // 從己開始順時針排其余七幹
        for (let i = 1; i <= 7; i++) {
            // 計算當前幹的位置
            const currentIndex = (jiIndex + i) % 8;
            const currentGong = clockwiseGongOrder[currentIndex];
            
            // 設置當前宮位的天幹（從己後面的天幹開始）
            result[currentGong] = sanQiLiuYi[(i + 1) % 9]; // 修正這裏的索引計算，使用模9確保不越界
        }
    } else { // 陽遁
        // 陽遁局數概念，1到9局
        const yangDunJu = {
            '1': { startGong: '1', direction: 'counterclockwise' }, // 陽遁一局，己入一宮（坎）
            '2': { startGong: '2', direction: 'counterclockwise' }, // 陽遁二局，己入二宮（坤）
            '3': { startGong: '3', direction: 'counterclockwise' }, // 陽遁三局，己入三宮（震）
            '4': { startGong: '4', direction: 'counterclockwise' }, // 陽遁四局，己入四宮（巽）
            '5': { startGong: '6', direction: 'counterclockwise' }, // 陽遁五局，己入六宮（乾）
            '6': { startGong: '7', direction: 'counterclockwise' }, // 陽遁六局，己入七宮（兌）
            '7': { startGong: '8', direction: 'counterclockwise' }, // 陽遁七局，己入八宮（艮）
            '8': { startGong: '9', direction: 'counterclockwise' }, // 陽遁八局，己入九宮（離）
            '9': { startGong: '1', direction: 'counterclockwise' }  // 陽遁九局，己入一宮（坎）
        };
        
        // 得到當前局數的起始宮位和方向
        const juConfig = yangDunJu[num.toString()];
        
        // 如果沒有對應的局數配置，返回空結果
        if (!juConfig) return result;
        
        // 得到己幹的宮位
        const jiGong = juConfig.startGong;
        result[jiGong] = '己';
        
        // 根據方向排列其余七幹
        // 宮位順序（逆時針，不含中宮）
        const counterClockwiseGongOrder = ['1', '2', '3', '4', '6', '7', '8', '9'];
        
        // 找到己在宮位序列中的位置
        const jiIndex = counterClockwiseGongOrder.indexOf(jiGong);
        
        if (jiIndex === -1) return result; // 如果沒有找到，返回結果
        
        // 從己開始逆時針排其余七幹
        for (let i = 1; i <= 7; i++) {
            // 計算當前幹的位置（逆時針，所以是減）
            const currentIndex = (jiIndex - i + 8) % 8; // +8確保結果為正
            const currentGong = counterClockwiseGongOrder[currentIndex];
            
            // 設置當前宮位的天幹（從己後面的天幹開始）
            result[currentGong] = sanQiLiuYi[(i + 1) % 9]; // 修正這裏的索引計算，使用模9確保不越界
        }
    }
    
    return result;
}

/**
 * 排布九星
 * @param {Object} sanQiLiuYi 三奇六儀分布
 * @param {String} xunShou 旬首
 * @returns {Object} 九星分布和值符信息
 */
function distributeJiuXing(sanQiLiuYi, xunShou) {
    // 查找旬首所在宮
    let zhiFuGong = '';
    for (const gong in sanQiLiuYi) {
        if (sanQiLiuYi[gong] === xunShou) {
            zhiFuGong = gong;
            break;
        }
    }
    
    // 如果找不到旬首，默認在中宮
    if (!zhiFuGong) {
        zhiFuGong = '5';
    }
    
    // 宮位對應的九星
    const gongToXing = {
        '1': '天蓬',
        '2': '天芮',
        '3': '天沖',
        '4': '天輔',
        '5': '天禽',
        '6': '天心',
        '7': '天柱',
        '8': '天任',
        '9': '天英'
    };
    
    // 確定值符星
    const zhiFuXing = gongToXing[zhiFuGong];
    
    // 九星順序
    const xingOrder = ['天蓬', '天任', '天沖', '天輔', '天英', '天芮', '天柱', '天心'];
    
    // 宮位順序（順時針，不含中宮）
    const gongOrder = ['1', '8', '3', '4', '9', '2', '7', '6'];
    
    // 九星分布結果
    const jiuXing = {};
    
    // 中宮永遠是天禽
    jiuXing['5'] = '天禽';
    
    // 值符星在值符宮
    if (zhiFuGong !== '5') {
        jiuXing[zhiFuGong] = zhiFuXing;
        
        // 找到值符星在星序中的位置
        const zhiFuXingIndex = xingOrder.indexOf(zhiFuXing);
        
        // 值符宮在宮序中的位置
        const zhiFuGongIndex = gongOrder.indexOf(zhiFuGong);
        
        if (zhiFuXingIndex !== -1 && zhiFuGongIndex !== -1) {
            // 從值符宮開始按順序排列其他星
            for (let i = 1; i < gongOrder.length; i++) {
                const currentGong = gongOrder[(zhiFuGongIndex + i) % gongOrder.length];
                const currentXing = xingOrder[(zhiFuXingIndex + i) % xingOrder.length];
                jiuXing[currentGong] = currentXing;
            }
        }
    } else {
        // 如果值符在中宮，使用默認排布
        for (let i = 0; i < gongOrder.length; i++) {
            jiuXing[gongOrder[i]] = xingOrder[i];
        }
    }
    
    return {
        zhiFuGong,
        zhiFuXing,
        jiuXing
    };
}

/**
 * 排布八門
 * @param {String} zhiFuGong 值符宮
 * @param {String} shiGan 時幹
 * @param {Object} sanQiLiuYi 三奇六儀分布
 * @returns {Object} 八門分布和值使信息
 */
function distributeBaMen(zhiFuGong, shiGan, sanQiLiuYi) {
    // 查找時幹落宮
    let luoGong = '';
    for (const gong in sanQiLiuYi) {
        if (sanQiLiuYi[gong] === shiGan) {
            luoGong = gong;
            break;
        }
    }
    
    // 如果找不到時幹，查找時幹寄宮
    if (!luoGong) {
        // 甲己寄生在戊，乙庚寄生在己，丙辛寄生在庚...
        const jiShengMap = {
            '甲': '戊', '己': '戊',
            '乙': '己', '庚': '己',
            '丙': '庚', '辛': '庚',
            '丁': '辛', '壬': '辛',
            '戊': '壬', '癸': '壬'
        };
        
        const jiGan = jiShengMap[shiGan];
        for (const gong in sanQiLiuYi) {
            if (sanQiLiuYi[gong] === jiGan) {
                luoGong = gong;
                break;
            }
        }
    }
    
    // 基本八門分布 - 修正八門的宮位對應關系
    const basicGongToMen = {
        '1': '休門',
        '8': '生門',
        '3': '傷門',
        '4': '杜門',
        '9': '景門',
        '2': '死門',
        '7': '驚門',
        '6': '開門',
        '5': '' // 中宮無門
    };
    
    // 確定值使門 - 這裏需要修改，值使門應該由時幹所在的落宮決定
    const zhiShiMen = basicGongToMen[luoGong] || '';
    
    // 宮位順序（順時針，不含中宮）
    const clockwiseGongOrder = ['1', '8', '3', '4', '9', '2', '7', '6'];
    
    // 八門順序
    const menOrder = ['休門', '生門', '傷門', '杜門', '景門', '死門', '驚門', '開門'];
    
    // 八門分布結果
    const baMen = {};
    
    // 中宮沒有門
    baMen['5'] = '';
    
    // 如果時幹落宮找到
    if (luoGong && luoGong !== '5') {
        // 值使門落在時幹所在宮
        baMen[luoGong] = zhiShiMen;
        
        // 找到值使門在門序中的位置
        const zhiShiMenIndex = menOrder.indexOf(zhiShiMen);
        
        // 時幹落宮在宮序中的位置
        const luoGongIndex = clockwiseGongOrder.indexOf(luoGong);
        
        if (zhiShiMenIndex !== -1 && luoGongIndex !== -1) {
            // 從值使門開始順時針排列其他門
            for (let i = 1; i < clockwiseGongOrder.length; i++) {
                const currentGong = clockwiseGongOrder[(luoGongIndex + i) % clockwiseGongOrder.length];
                const currentMen = menOrder[(zhiShiMenIndex + i) % menOrder.length];
                baMen[currentGong] = currentMen;
            }
        }
    } else {
        // 如果找不到落宮或落宮在中宮，使用默認排布
        for (const gong in basicGongToMen) {
            baMen[gong] = basicGongToMen[gong];
        }
    }
    
    return {
        zhiShiGong: luoGong,
        zhiShiMen,
        baMen
    };
}

/**
 * 排布八神
 * @param {String} zhiFuGong 值符宮
 * @returns {Object} 八神分布
 */
function distributeBaShen(zhiFuGong) {
    // 八神順序
    const shenOrder = ['值符', '騰蛇', '太陰', '六合', '白虎', '玄武', '九地', '九天'];
    
    // 宮位順序（不含中宮）
    const gongOrder = ['1', '8', '3', '4', '9', '2', '7', '6'];
    
    // 八神分布結果
    const baShen = {
        '1': '',
        '2': '',
        '3': '',
        '4': '',
        '5': '', // 中宮沒有神
        '6': '',
        '7': '',
        '8': '',
        '9': ''
    };
    
    // 值符在值符宮
    if (zhiFuGong !== '5') {
        baShen[zhiFuGong] = '值符';
        
        // 值符宮在宮序中的位置
        const zhiFuGongIndex = gongOrder.indexOf(zhiFuGong);
        
        if (zhiFuGongIndex !== -1) {
            // 從值符宮開始按順序排列其他神
            for (let i = 1; i < gongOrder.length; i++) {
                const currentGong = gongOrder[(zhiFuGongIndex + i) % gongOrder.length];
                const currentShen = shenOrder[i];
                baShen[currentGong] = currentShen;
            }
        }
    } else {
        // 如果值符在中宮，使用默認排布
        for (let i = 0; i < gongOrder.length; i++) {
            baShen[gongOrder[i]] = shenOrder[i];
        }
    }
    
    return baShen;
}

/**
 * 獲取旬首
 * @param {Lunar} lunar 農歷對象
 * @param {String} method 排盤方法
 * @returns {String} 旬首
 */
/**
 * 獲取空亡地支
 * @param {Lunar} lunar 農歷對象
 * @param {String} method 排盤方法
 * @returns {Array} 空亡地支數組
 */
function getKongWang(lunar, method) {
    try {
        let gan, zhi, ganZhi;
        if (method === '時家') {
            gan = lunar.getTimeGan();
            zhi = lunar.getTimeZhi();
            ganZhi = lunar.getTimeInGanZhi();
        } else if (method === '日家') {
            gan = lunar.getDayGan();
            zhi = lunar.getDayZhi();
            ganZhi = lunar.getDayInGanZhi();
        } else if (method === '月家') {
            gan = lunar.getMonthGan();
            zhi = lunar.getMonthZhi();
            ganZhi = lunar.getMonthInGanZhi();
        } else if (method === '年家') {
            gan = lunar.getYearGan();
            zhi = lunar.getYearZhi();
            ganZhi = lunar.getYearInGanZhi();
        }
        
        // 空亡計算公式：天幹的序數+地支的序數=11(歸貧法) 或者 23(歸貧法)
        const ganIndex = TIAN_GAN.indexOf(gan) + 1; // 天幹序數（從1開始））
        
        // 計算需要找到的兩個空亡地支的序數
        const kongWangIndex1 = 11 - ganIndex;
        const kongWangIndex2 = 23 - ganIndex;
        
        // 考慮循環，序數需要取余
        const index1 = (kongWangIndex1 <= 0) ? kongWangIndex1 + 12 : kongWangIndex1;
        const index2 = (kongWangIndex2 > 12) ? kongWangIndex2 - 12 : kongWangIndex2;
        
        // 地支序數是從1開始計算的，而數組索引從0開始，需要減1
        const kongWang1 = DI_ZHI[index1 - 1];
        const kongWang2 = DI_ZHI[index2 - 1];
        
        // 返回空亡地支數組
        return [kongWang1, kongWang2];
    } catch (e) {
        console.error('獲取空亡地支出錯:', e);
        return [];
    }
}

/**
 * 獲取空亡宮位
 * @param {Array} kongWangZhi 空亡地支數組
 * @returns {Array} 空亡宮位數組
 */
function getKongWangGong(kongWangZhi) {
    // 地支對應的宮位（正確的玄空九宮飛星與地支對應關系）
    const zhiToGong = {
        '子': '1', // 坎宮
        '醜': '8', // 艮宮
        '寅': '3', // 震宮
        '卯': '4', // 巽宮
        '辰': '9', // 離宮
        '巳': '2', // 坤宮
        '午': '7', // 兌宮
        '未': '6', // 乾宮
        '申': '1', // 坎宮
        '酉': '8', // 艮宮
        '戌': '3', // 震宮
        '亥': '4'  // 巽宮
    };
    
    return kongWangZhi.map(zhi => zhiToGong[zhi]).filter(gong => gong);
}

/**
 * 獲取旬首
 * @param {Lunar} lunar 農歷對象
 * @param {String} method 排盤方法
 * @returns {String} 旬首
 */
function getXunShou(lunar, method) {
    let xun = '';
    let ganZhi = '';
    
    try {
        if (method === '時家') {
            ganZhi = lunar.getTimeInGanZhi();
            xun = lunar.getTimeXun();
        } else if (method === '日家') {
            ganZhi = lunar.getDayInGanZhi();
            xun = lunar.getDayXun();
        } else if (method === '月家') {
            ganZhi = lunar.getMonthInGanZhi();
            xun = lunar.getMonthXun();
        } else if (method === '年家') {
            ganZhi = lunar.getYearInGanZhi();
            xun = lunar.getYearXun();
        }
        
        // 如果xun為空，手動計算旬首
        if (!xun) {
            // 使用常量xunShouMap找到對應的旬首
            const tianGan = ganZhi.substring(0, 1);
            const diZhi = ganZhi.substring(1);
            
            // 推算旬首
            // 六十甲子中以甲開始的有：甲子、甲戌、甲申、甲午、甲辰、甲寅
            // 我們知道甲子的旬首為甲，對應戊
            // 甲戌的旬首為甲，對應己
            // 甲申的旬首為甲，對應庚
            // 甲午的旬首為甲，對應辛
            // 甲辰的旬首為甲，對應壬
            // 甲寅的旬首為甲，對應癸
            
            // 簡化處理，根據幹支計算處於哪個旬
            const xunShouMap = {
                '甲子': '戊', '乙醜': '戊', '丙寅': '戊', '丁卯': '戊', '戊辰': '戊', '己巳': '戊', '庚午': '戊', '辛未': '戊', '壬申': '戊', '癸酉': '戊',
                '甲戌': '己', '乙亥': '己', '丙子': '己', '丁醜': '己', '戊寅': '己', '己卯': '己', '庚辰': '己', '辛巳': '己', '壬午': '己', '癸未': '己',
                '甲申': '庚', '乙酉': '庚', '丙戌': '庚', '丁亥': '庚', '戊子': '庚', '己醜': '庚', '庚寅': '庚', '辛卯': '庚', '壬辰': '庚', '癸巳': '庚',
                '甲午': '辛', '乙未': '辛', '丙申': '辛', '丁酉': '辛', '戊戌': '辛', '己亥': '辛', '庚子': '辛', '辛醜': '辛', '壬寅': '辛', '癸卯': '辛',
                '甲辰': '壬', '乙巳': '壬', '丙午': '壬', '丁未': '壬', '戊申': '壬', '己酉': '壬', '庚戌': '壬', '辛亥': '壬', '壬子': '壬', '癸醜': '壬',
                '甲寅': '癸', '乙卯': '癸', '丙辰': '癸', '丁巳': '癸', '戊午': '癸', '己未': '癸', '庚申': '癸', '辛酉': '癸', '壬戌': '癸', '癸亥': '癸'
            };
            
            return xunShouMap[ganZhi] || '戊';
        }
        
        return xun.charAt(0) || '戊'; // 返回天幹部分
    } catch (e) {
        console.error('獲取旬首出錯:', e);
    }
    
    // 默認返回戊
    return '戊';
}

/**
 * 獲取落宮幹支
 * @param {Lunar} lunar 農歷對象
 * @param {String} method 排盤方法
 * @returns {String} 幹支
 */
function getLuoGongGanZhi(lunar, method) {
    try {
        if (method === '時家') {
            return lunar.getTimeInGanZhi().substring(0, 1); // 只取時幹
        } else if (method === '日家') {
            return lunar.getDayInGanZhi().substring(0, 1); // 只取日幹
        } else if (method === '月家') {
            return lunar.getMonthInGanZhi().substring(0, 1); // 只取月幹
        } else if (method === '年家') {
            return lunar.getYearInGanZhi().substring(0, 1); // 只取年幹
        }
    } catch (e) {
        console.error('獲取幹支出錯:', e);
    }
    
    // 默認返回甲
    return '甲';
}

/**
 * 分析宮位吉兇
 * @param {Number} gongNumber 宮位數字
 * @param {Object} jiuXing 九星分布
 * @param {Object} baMen 八門分布
 * @param {Object} baShen 八神分布
 * @returns {Object} 宮位分析結果
 */
function analyzeGong(gongNumber, jiuXing, baMen, baShen) {
    const gongStr = gongNumber.toString();
    const xing = jiuXing[gongStr] || '';
    const men = baMen[gongStr] || '';
    const shen = baShen[gongStr] || '';
    
    // 基本宮位信息
    const gongInfo = JIU_GONG[gongStr] || {};
    
    // 九星信息
    const xingInfo = xing ? JIU_XING[xing] || {} : {};
    
    // 八門信息
    const menInfo = men ? BA_MEN[men] || {} : {};
    
    // 八神信息
    const shenInfo = shen ? BA_SHEN[shen] || {} : {};
    
    // 判斷宮位吉兇
    let jiXiong = 'ping'; // 默認平
    let jiXiongScore = 0;
    
    // 根據九星判斷
    if (xingInfo.element === 'jin' || xingInfo.element === 'huo') {
        jiXiongScore += 1; // 金火為吉
    } else if (xingInfo.element === 'tu') {
        jiXiongScore += 0; // 土為平
    } else {
        jiXiongScore -= 1; // 水木為兇
    }
    
    // 根據八門判斷
    if (men && menInfo.type === 'ji') {
        jiXiongScore += 1; // 吉門
    } else if (men && menInfo.type === 'xiong') {
        jiXiongScore -= 1; // 兇門
    }
    
    // 根據八神判斷
    if (shen && shenInfo.type === 'ji') {
        jiXiongScore += 1; // 吉神
    } else if (shen && shenInfo.type === 'xiong') {
        jiXiongScore -= 1; // 兇神
    }
    
    // 最終吉兇判斷
    if (jiXiongScore >= 2) {
        jiXiong = 'da_ji'; // 大吉
    } else if (jiXiongScore === 1) {
        jiXiong = 'xiao_ji'; // 小吉
    } else if (jiXiongScore === 0) {
        jiXiong = 'ping'; // 平
    } else if (jiXiongScore === -1) {
        jiXiong = 'xiao_xiong'; // 小兇
    } else {
        jiXiong = 'da_xiong'; // 大兇
    }
    
    // 宮位分析
    const analysis = {
        gongNumber: gongStr,
        gongName: gongInfo.name || '',
        direction: gongInfo.direction || '',
        element: gongInfo.element || '',
        xing: xing,
        xingAlias: xingInfo.alias || '',
        xingFeature: xingInfo.feature || '',
        men: men,
        menFeature: menInfo.feature || '',
        shen: shen,
        shenFeature: shenInfo.feature || '',
        jiXiong: jiXiong,
        jiXiongText: ['大兇', '小兇', '平', '小吉', '大吉'][jiXiongScore + 2],
        explain: generateGongExplanation(gongStr, gongInfo, xing, xingInfo, men, menInfo, shen, shenInfo, jiXiong)
    };
    
    return analysis;
}

/**
 * 生成宮位解釋文字
 * @param {String} gongStr 宮位數字字符串
 * @param {Object} gongInfo 宮位信息
 * @param {String} xing 九星名
 * @param {Object} xingInfo 九星信息
 * @param {String} men 八門名
 * @param {Object} menInfo 八門信息
 * @param {String} shen 八神名
 * @param {Object} shenInfo 八神信息
 * @param {String} jiXiong 吉兇等級
 * @returns {String} 解釋文字
 */
function generateGongExplanation(gongStr, gongInfo, xing, xingInfo, men, menInfo, shen, shenInfo, jiXiong) {
    const gongExplain = {
        '1': "坎宮主水，與事業、財運、流動資金有關。",
        '2': "坤宮主土，與婚姻、母親、女性長輩有關。",
        '3': "震宮主木，與創業、開始、長子有關。",
        '4': "巽宮主木，與女性、柔和、文書有關。",
        '5': "中宮為核心，統領八方，與自身狀態有關。",
        '6': "乾宮主金，與父親、權威、領導有關。",
        '7': "兌宮主金，與口舌、溝通、少女有關。",
        '8': "艮宮主土，與停止、障礙、少男有關。",
        '9': "離宮主火，與名聲、眼睛、光明有關。"
    };
    
    // 基本宮位解釋
    let explanation = gongExplain[gongStr] || "此宮位信息缺失。";
    
    // 添加九星解釋
    if (xing) {
        explanation += ` ${xing}${xingInfo.alias ? '(' + xingInfo.alias + ')' : ''}入${gongStr}宮，${xingInfo.feature || ''}`;
    }
    
    // 添加八門解釋
    if (men) {
        explanation += ` ${men}入${gongStr}宮，${menInfo.feature || ''}`;
    }
    
    // 添加八神解釋
    if (shen) {
        explanation += ` ${shen}入${gongStr}宮，${shenInfo.feature || ''}`;
    }
    
    // 根據吉兇添加解釋
    switch (jiXiong) {
        case 'da_ji':
            explanation += " 此宮大吉，事情進展順利，可主動出擊。";
            break;
        case 'xiao_ji':
            explanation += " 此宮小吉，事情有貴人相助，穩步推進為宜。";
            break;
        case 'ping':
            explanation += " 此宮平常，事情進展一般，需謹慎行事。";
            break;
        case 'xiao_xiong':
            explanation += " 此宮小兇，事情多有阻礙，宜守不宜進。";
            break;
        case 'da_xiong':
            explanation += " 此宮大兇，事情多有險阻，最好避開此方位活動。";
            break;
    }
    
    return explanation;
}

/**
 * 綜合分析奇門盤
 * @param {Object} jiuGongAnalysis 九宮分析結果
 * @param {String} zhiFuGong 值符宮
 * @param {String} zhiShiGong 值使宮
 * @param {String} purpose 排盤目的
 * @returns {Object} 綜合分析結果
 */
function overallAnalysis(jiuGongAnalysis, zhiFuGong, zhiShiGong, purpose) {
    // 值符、值使宮的吉兇
    const zhiFuJiXiong = jiuGongAnalysis[zhiFuGong] ? jiuGongAnalysis[zhiFuGong].jiXiong : 'ping';
    const zhiShiJiXiong = jiuGongAnalysis[zhiShiGong] ? jiuGongAnalysis[zhiShiGong].jiXiong : 'ping';
    
    // 判斷總體吉兇
    let overallJiXiong;
    if (zhiFuJiXiong === 'da_ji' && zhiShiJiXiong === 'da_ji') {
        overallJiXiong = 'da_ji';
    } else if (zhiFuJiXiong.includes('ji') && zhiShiJiXiong.includes('ji')) {
        overallJiXiong = 'xiao_ji';
    } else if (zhiFuJiXiong.includes('xiong') && zhiShiJiXiong.includes('xiong')) {
        overallJiXiong = 'da_xiong';
    } else if (zhiFuJiXiong.includes('xiong') || zhiShiJiXiong.includes('xiong')) {
        overallJiXiong = 'xiao_xiong';
    } else {
        overallJiXiong = 'ping';
    }
    
    // 根據目的找出最有利的宮位
    let bestGong = '';
    let bestScore = -3;
    
    for (const gong in jiuGongAnalysis) {
        const analysis = jiuGongAnalysis[gong];
        let score = 0;
        
        // 根據吉兇評分
        switch (analysis.jiXiong) {
            case 'da_ji': score += 2; break;
            case 'xiao_ji': score += 1; break;
            case 'ping': break;
            case 'xiao_xiong': score -= 1; break;
            case 'da_xiong': score -= 2; break;
        }
        
        // 根據目的加分
        if (purpose === '事業' && ['1', '6', '9'].includes(gong)) {
            score += 1;
        } else if (purpose === '財運' && ['1', '7', '6'].includes(gong)) {
            score += 1;
        } else if (purpose === '婚姻' && ['2', '7', '9'].includes(gong)) {
            score += 1;
        } else if (purpose === '健康' && ['3', '9', '4'].includes(gong)) {
            score += 1;
        } else if (purpose === '學業' && ['4', '9', '3'].includes(gong)) {
            score += 1;
        }
        
        // 更新最佳宮位
        if (score > bestScore) {
            bestScore = score;
            bestGong = gong;
        }
    }
    
    // 生成建議
    let suggestions = [];
    
    switch (overallJiXiong) {
        case 'da_ji':
            suggestions.push("當前時運極佳，可大膽行事，推進重要計劃。");
            suggestions.push("貴人運強，適合社交活動和尋求支持。");
            suggestions.push("財運亨通，可考慮投資或財務規劃。");
            break;
        case 'xiao_ji':
            suggestions.push("時運較好，可穩步推進計劃，但需謹慎。");
            suggestions.push("有貴人相助，但也需自身努力。");
            suggestions.push("財運平穩，宜守不宜進。");
            break;
        case 'ping':
            suggestions.push("時運平平，宜按部就班行事，不宜冒險。");
            suggestions.push("人際關系一般，需多加維護。");
            suggestions.push("財運一般，宜節製開支。");
            break;
        case 'xiao_xiong':
            suggestions.push("時運不佳，宜守不宜進，避免冒險。");
            suggestions.push("謹防小人，保持低調。");
            suggestions.push("財務宜節約，避免大額支出。");
            break;
        case 'da_xiong':
            suggestions.push("當前時運不佳，宜避開重要活動，保持低調。");
            suggestions.push("謹防小人和突發事件，避免沖突。");
            suggestions.push("財務宜嚴格控製，避免任何投資和大額支出。");
            break;
    }
    
    // 根據最佳宮位添加具體建議
    if (bestGong) {
        const bestGongInfo = jiuGongAnalysis[bestGong];
        suggestions.push(`最有利方位在${bestGongInfo.direction}方(${bestGongInfo.gongName}宮)，可多往此方位活動。`);
        
        if (purpose === '事業') {
            suggestions.push("事業方面，註重穩紮穩打，積累經驗和人脈，時機成熟再大展拳腳。");
        } else if (purpose === '財運') {
            suggestions.push("財運方面，建議穩健理財，避免投機，重視積累和長期規劃。");
        } else if (purpose === '婚姻') {
            suggestions.push("婚姻方面，註重溝通和理解，創造和諧的家庭氛圍。");
        } else if (purpose === '健康') {
            suggestions.push("健康方面，註意作息規律，適當運動，保持心情愉快。");
        } else if (purpose === '學業') {
            suggestions.push("學業方面，製定合理計劃，堅持不懈，善於利用資源和請教他人。");
        }
    }
    
    return {
        overallJiXiong,
        overallJiXiongText: {
            'da_ji': '大吉',
            'xiao_ji': '小吉',
            'ping': '平',
            'xiao_xiong': '小兇',
            'da_xiong': '大兇'
        }[overallJiXiong],
        bestGong,
        suggestions
    };
}

/**
 * 計算奇門遁甲盤
 * @param {Date} date 日期時間
 * @param {Object} options 選項
 * @returns {Object} 排盤結果
 */
function calculate(date, options = {}) {
    const defaultOptions = {
        type: '四柱', // 三元或四柱
        method: '時家', // 時家, 日家, 月家, 年家
        purpose: '綜合', // 事業, 財運, 婚姻, 健康, 學業, 綜合
        location: '默認位置'
    };
    
    const opts = { ...defaultOptions, ...options };
    
    try {
        // 獲取農歷信息
        const lunar = Lunar.fromDate(date);
        const solar = Solar.fromDate(date);
        
        // 獲取四柱
        const siZhu = {
            year: lunar.getYearInGanZhi(),
            month: lunar.getMonthInGanZhi(),
            day: lunar.getDayInGanZhi(),
            time: lunar.getTimeInGanZhi()
        };
        
        // 計算局數
        const juShu = calculateJuShu(date, opts.method);
        
        // 獲取旬首
        const xunShou = getXunShou(lunar, opts.method);
        
        // 獲取落宮幹
        const luoGongGan = getLuoGongGanZhi(lunar, opts.method);
        
        // 獲取空亡信息
        const kongWangZhi = getKongWang(lunar, opts.method);
        const kongWangGong = getKongWangGong(kongWangZhi);
        
        // 排布三奇六儀
        const sanQiLiuYi = distributeSanQiLiuYi(juShu);
        
        // 排布九星
        const jiuXingResult = jiuXingModule.distributeJiuXing(sanQiLiuYi, xunShou);
        
        // 排布八門
        const baMenResult = baMenModule.distributeBaMen(jiuXingResult.zhiFuGong, luoGongGan, sanQiLiuYi);
        
        // 排布八神
        const baShen = baShenModule.distributeBaShen(jiuXingResult.zhiFuGong);
        
        // 分析九宮吉兇
        const jiuGongAnalysis = {};
        for (let i = 1; i <= 9; i++) {
            jiuGongAnalysis[i] = analyzeGong(i, jiuXingResult.jiuXing, baMenResult.baMen, baShen);
        }
        
        // 綜合分析
        const analysis = overallAnalysis(jiuGongAnalysis, jiuXingResult.zhiFuGong, baMenResult.zhiShiGong, opts.purpose);
        
        // 獲取正確的地盤幹分布
        const diPan = diPanModule.getBasicDiPan();
        
        // 整合結果
        return {
            basicInfo: {
                date: solar.toFullString(),
                lunarDate: lunar.toString(),
                type: opts.type,
                method: opts.method,
                purpose: opts.purpose,
                location: opts.location
            },
            siZhu,
            juShu,
            xunShou,
            luoGongGan,
            sanQiLiuYi,
            jiuXing: jiuXingResult.jiuXing,
            baMen: baMenResult.baMen,
            baShen,
            diPan, // 添加地盤幹
            zhiFuGong: jiuXingResult.zhiFuGong,
            zhiFuXing: jiuXingResult.zhiFuXing,
            zhiShiGong: baMenResult.zhiShiGong,
            zhiShiMen: baMenResult.zhiShiMen,
            kongWangZhi, // 空亡地支
            kongWangGong, // 空亡宮位
            jiuGongAnalysis,
            analysis
        };
    } catch (e) {
        console.error('奇門遁甲計算出錯:', e);
        
        // 返回一個基本的錯誤對象
        return {
            error: true,
            message: e.message,
            basicInfo: {
                date: date.toLocaleString(),
                type: opts.type,
                method: opts.method,
                purpose: opts.purpose,
                location: opts.location
            }
        };
    }
}

/**
 * 根據語言代碼獲取九宮信息
 * @param {string} langCode 語言代碼
 * @returns {Object} 九宮信息
 */
function getJiuGongForLang(langCode) {
    return getJiuGong(langCode);
}

/**
 * 根據語言代碼獲取九星信息
 * @param {string} langCode 語言代碼
 * @returns {Object} 九星信息
 */
function getJiuXingForLang(langCode) {
    return getJiuXing(langCode);
}

/**
 * 根據語言代碼獲取八門信息
 * @param {string} langCode 語言代碼
 * @returns {Object} 八門信息
 */
function getBaMenForLang(langCode) {
    // 這裡可以根據需要擴展八門的多語言支援
    return BA_MEN;
}

// 導出模塊
module.exports = {
    calculate,
    getKongWang,
    getKongWangGong,
    JIU_GONG,
    JIU_XING,
    BA_MEN,
    BA_SHEN,
    distributeSanQiLiuYi,
    jiuXingModule,
    baMenModule,
    baShenModule,
    diPanModule,
    getJiuGongForLang,
    getJiuXingForLang,
    getBaMenForLang,
    getJiuGong,
    getJiuXing
};
