/**
 * 八門分布計算模塊
 */

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
    
    // 基本八門分布
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
    
    // 確定值使門
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
            // 排列其他門
            for (let i = 1; i < clockwiseGongOrder.length; i++) {
                const currentGong = clockwiseGongOrder[(luoGongIndex + i) % clockwiseGongOrder.length];
                const currentMen = menOrder[(zhiShiMenIndex + i) % menOrder.length];
                baMen[currentGong] = currentMen;
            }
        }
    } else {
        // 如果找不到落宮或落宮在中宮，使用預設排布
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

module.exports = {
    distributeBaMen
};
