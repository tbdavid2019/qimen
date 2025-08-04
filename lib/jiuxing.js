/**
 * 九星分布計算模塊
 */

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
    
    // 宮位對應的九星 - 標準布局
    const basicGongToXing = {
        '1': '天蓬', // 天蓬-貪狼
        '8': '天任', // 天任-巨門
        '3': '天沖', // 天沖-祿存
        '4': '天輔', // 天輔-文曲
        '9': '天英', // 天英-廉貞
        '2': '天芮', // 天芮-武曲
        '7': '天柱', // 天柱-破軍
        '6': '天心', // 天心-左輔
        '5': '天禽'  // 天禽在中宮
    };
    
    // 確定值符星
    const zhiFuXing = basicGongToXing[zhiFuGong];
    
    // 九星順序（不含天禽）
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
            // 從值符宮開始順時針排列其他星
            for (let i = 1; i < gongOrder.length; i++) {
                const currentGong = gongOrder[(zhiFuGongIndex + i) % gongOrder.length];
                const currentXing = xingOrder[(zhiFuXingIndex + i) % xingOrder.length];
                jiuXing[currentGong] = currentXing;
            }
        }
    } else {
        // 如果值符在中宮，使用基本排布
        for (const gong in basicGongToXing) {
            if (gong !== '5') {  // 中宮已經設置為天禽
                jiuXing[gong] = basicGongToXing[gong];
            }
        }
    }
    
    return {
        zhiFuGong,
        zhiFuXing,
        jiuXing
    };
}

module.exports = {
    distributeJiuXing
};
