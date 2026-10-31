'use strict';

/**
 * 紫微斗數夫妻宮深層斷語與雙人合盤評估算法。
 * 演算法來源與溯源依據：
 * - 原始開源庫：https://github.com/Renhuai123/ziwei-doushu (MIT License)
 * - 上游模組：lib/ziwei/heming-knowledge.ts
 * - 評估依據：命宮相合度 (30%)、夫妻宮投射 (30%)、四化互照 (25%)、煞星對衝 (15%)
 */

const STAR_IN_FUQI_GU = {
    紫微: { appearance: '端正有氣度，重視品質與體面。', personality: '主見強、有責任感，習慣承擔與規劃。', timing: '偏好成熟或心智穩重的關係，宜先建立互相尊重。', summary: '尊貴主導型伴侶' },
    天機: { appearance: '清俊靈活，眼神敏銳，帶知性氣質。', personality: '反應快、善溝通，但思緒多時容易猶豫。', timing: '多由同學、同事或共同學習圈結緣，重視智性同頻。', summary: '智性同儕型伴侶' },
    太陽: { appearance: '明朗大方，笑容開闊，氣場有光。', personality: '熱心、直率、願意扛責任，需注意過度操心。', timing: '女命常重視成熟擔當；男命多以夥伴式相處較順。', summary: '陽光擔當型伴侶' },
    武曲: { appearance: '輪廓俐落，氣質精幹，重實用與效率。', personality: '務實果決、理財觀清楚，情感表達偏行動派。', timing: '適合共同打拼，財務與分工說清楚後更穩。', summary: '務實戰友型伴侶' },
    天同: { appearance: '溫和秀氣，親和感強，帶赤子氣。', personality: '知足、和平、重舒適，壓力大時可能先逃避。', timing: '容易在熟人圈或休閒活動中發展，宜保持穩定節奏。', summary: '溫柔赤子型伴侶' },
    廉貞: { appearance: '辨識度高，魅力濃烈，風格鮮明。', personality: '愛恨分明、重感受與界線，需把信任說清楚。', timing: '吸引力來得快，宜拉長觀察期後再定承諾。', summary: '濃烈魅力型伴侶' },
    天府: { appearance: '穩重端莊，重生活品味與品質。', personality: '可靠、重承諾、善守成，對安全感要求高。', timing: '適合以生活規劃、財務與家庭共識建立長期關係。', summary: '安穩守護型伴侶' },
    太陰: { appearance: '清秀柔和，審美細膩，氣質安靜。', personality: '體貼敏感、重精神交流，有時把情緒收在心裡。', timing: '男命常偏好溫柔細膩型；落陷或化忌時宜晚一些確認。', summary: '細膩知心型伴侶' },
    貪狼: { appearance: '明艷有魅力，社交感與才藝感明顯。', personality: '風趣多才、追求新鮮，需建立清楚的信任邊界。', timing: '多在聚會、興趣、娛樂或旅行中相遇，晚婚較能穩住節奏。', summary: '社交才藝型伴侶' },
    巨門: { appearance: '眼神有思辨感，談吐是重要魅力。', personality: '善分析、口才強，爭執時要避免把討論變成攻防。', timing: '同學、工作或知識社群易結緣，長期溝通能力最關鍵。', summary: '知辯溝通型伴侶' },
    天相: { appearance: '整潔得體，重禮貌與穿搭。', personality: '善協調、重公平，不喜歡公開衝突。', timing: '熟識、同事或共同合作關係容易轉為伴侶。', summary: '協調合作者型伴侶' },
    天梁: { appearance: '穩重成熟，給人可靠與照顧感。', personality: '有原則、責任感強，偶爾帶說教傾向。', timing: '常有年齡或心智成熟差距，婚前磨合後反而更穩。', summary: '成熟庇護型伴侶' },
    七殺: { appearance: '輪廓分明，英氣強，行動節奏快。', personality: '獨立果斷、敢愛敢做，但衝突時需暫停機制。', timing: '宜晚一些確立承諾，先觀察壓力下的相處方式。', summary: '開創將星型伴侶' },
    破軍: { appearance: '風格獨特，氣質不拘常規。', personality: '追求自由、勇於改變，關係中需要空間與新鮮感。', timing: '不宜倉促定局，將生活目標與界線談清楚再承諾。', summary: '自由變革型伴侶' }
};

const SIHUA_IN_FUQI_GU = {
    化祿: '緣分與照顧感較強，適合把喜歡落實成共享生活與資源。',
    祿: '緣分與照顧感較強，適合把喜歡落實成共享生活與資源。',
    化權: '關係中主導性較明顯，需事前約定決策方式與彼此空間。',
    權: '關係中主導性較明顯，需事前約定決策方式與彼此空間。',
    化科: '有互相欣賞、尊重專業與協調的傾向，適合共同成長。',
    科: '有互相欣賞、尊重專業與協調的傾向，適合共同成長。',
    化忌: '容易把期待或壓力投射到關係上，宜延後衝動承諾並建立溝通規則。',
    忌: '容易把期待或壓力投射到關係上，宜延後衝動承諾並建立溝通規則。'
};

const COMPATIBILITY = {
    '紫微:天府': 1, '天府:紫微': 1, '太陽:太陰': 0.92, '太陰:太陽': 0.92,
    '天梁:天同': 0.9, '天同:天梁': 0.9, '天相:紫微': 0.88, '紫微:天相': 0.88,
    '天相:天府': 0.88, '天府:天相': 0.88, '武曲:天同': 0.76, '天同:武曲': 0.76,
    '七殺:七殺': 0.42, '破軍:破軍': 0.4, '廉貞:七殺': 0.35, '七殺:廉貞': 0.35,
    '廉貞:破軍': 0.35, '破軍:廉貞': 0.35
};

function majorNames(palace) { return (palace?.stars || []).filter((s) => s.type === 'major' || !s.type).map((s) => s.name); }
function findPalace(chart, name) { return chart?.palaces?.find((p) => p.name === name || p.name === name.replace('宮', '')); }
function ming(chart) { return chart?.palaces?.find((p) => p.isMing) || findPalace(chart, '命宮'); }
function spouse(chart) { return findPalace(chart, '夫妻宮'); }
function getSihuaNames(palace) { return (palace?.stars || []).map((s) => s.sihua || s.siHua).filter(Boolean); }
function uniqueMajor(palace) { return [...new Set(majorNames(palace))]; }
function overlap(a, b) {
    const left = new Set(a); const right = new Set(b);
    const common = [...left].filter((x) => right.has(x)).length;
    return common ? common / Math.max(left.size, right.size, 1) : 0;
}
function pairCompatibility(a, b) {
    if (!a.length || !b.length) return 0.58;
    const scores = [];
    for (const first of a) for (const second of b) scores.push(COMPATIBILITY[`${first}:${second}`] ?? (first === second ? 0.7 : 0.58));
    return scores.reduce((sum, value) => sum + value, 0) / scores.length;
}
function shaRatio(chart) {
    const m = ming(chart); const f = spouse(chart);
    const all = [...(m?.stars || []), ...(f?.stars || [])];
    const hard = all.filter((s) => ['擎羊', '陀羅', '火星', '鈴星'].includes(s.name)).length;
    return Math.min(1, hard / 4);
}
function analyzeSpousePalace(chart, sex = '男') {
    const palace = spouse(chart);
    if (!palace) throw new Error('紫微命盤宮位結構不完整，無法解析夫妻宮');
    let sourcePalace = palace;
    let isBorrowed = false;
    let major = uniqueMajor(palace);
    if (!major.length) {
        const oppositeBranch = palace.aspects?.opposite;
        sourcePalace = chart.palaces.find((p) => p.branch === oppositeBranch) || palace;
        major = uniqueMajor(sourcePalace);
        isBorrowed = true;
    }
    const profiles = major.map((name) => STAR_IN_FUQI_GU[name]).filter(Boolean);
    const sihuaNames = getSihuaNames(palace);
    const sihuaInsights = sihuaNames.map((name) => SIHUA_IN_FUQI_GU[name]).filter(Boolean);
    const first = profiles[0] || STAR_IN_FUQI_GU.天相;
    return {
        palace: palace.branch,
        majorStars: major,
        isBorrowed,
        appearance: profiles.map((p) => p.appearance).join(' '),
        personality: profiles.map((p) => p.personality).join(' '),
        timing: profiles.map((p) => p.timing).join(' '),
        summary: `${first.summary}：${profiles.map((p) => p.personality).join(' ') || '以夫妻宮對宮星曜參考。'}`,
        sihua: sihuaInsights,
        targetGender: sex === '女' || sex === 'female' ? '男性伴侶（丈夫）' : '女性伴侶（妻子）'
    };
}

function findStarPalaceName(chart, starName) {
    if (!starName) return null;
    return (chart?.palaces || []).find((p) => (p.stars || []).some((s) => s.name === starName))?.name || null;
}

function evaluateZiweiMatch(input) {
    const ziwei = require('./ziwei');
    const firstInput = { ...(input?.first || {}) };
    delete firstInput.palaces;
    const secondInput = { ...(input?.second || {}) };
    delete secondInput.palaces;
    const firstChart = ziwei.calculateZiweiChart(firstInput);
    const secondChart = ziwei.calculateZiweiChart(secondInput);
    const firstSex = firstInput.sex || firstChart.normalized_input?.sex || '男';
    const secondSex = secondInput.sex || secondChart.normalized_input?.sex || '男';
    const firstMing = uniqueMajor(ming(firstChart));
    const secondMing = uniqueMajor(ming(secondChart));
    const firstSpouse = analyzeSpousePalace(firstChart, firstSex);
    const secondSpouse = analyzeSpousePalace(secondChart, secondSex);

    const mingScore = pairCompatibility(firstMing, secondMing);
    const projectionScore = (pairCompatibility(firstSpouse.majorStars, secondMing) + pairCompatibility(secondSpouse.majorStars, firstMing)) / 2;

    // 雙方生年四化交互互照：甲方四化落入乙方重要宮位，與乙方四化落入甲方重要宮位
    const keyPalaces = new Set(['命宮', '夫妻宮', '財帛宮', '官祿宮', '福德宮']);
    const fSihua = firstChart.sihua || {};
    const sSihua = secondChart.sihua || {};
    let positive = 0;
    let negative = 0;

    if (fSihua.祿 && keyPalaces.has(findStarPalaceName(secondChart, fSihua.祿))) positive++;
    if (fSihua.權 && keyPalaces.has(findStarPalaceName(secondChart, fSihua.權))) positive++;
    if (fSihua.科 && keyPalaces.has(findStarPalaceName(secondChart, fSihua.科))) positive++;
    if (fSihua.忌 && ['命宮', '夫妻宮'].includes(findStarPalaceName(secondChart, fSihua.忌))) negative++;

    if (sSihua.祿 && keyPalaces.has(findStarPalaceName(firstChart, sSihua.祿))) positive++;
    if (sSihua.權 && keyPalaces.has(findStarPalaceName(firstChart, sSihua.權))) positive++;
    if (sSihua.科 && keyPalaces.has(findStarPalaceName(firstChart, sSihua.科))) positive++;
    if (sSihua.忌 && ['命宮', '夫妻宮'].includes(findStarPalaceName(firstChart, sSihua.忌))) negative++;

    const firstMingSihua = getSihuaNames(ming(firstChart));
    const secondMingSihua = getSihuaNames(ming(secondChart));
    positive += firstMingSihua.filter((x) => ['祿', '權', '科', '化祿', '化權', '化科'].includes(x)).length +
        secondMingSihua.filter((x) => ['祿', '權', '科', '化祿', '化權', '化科'].includes(x)).length;
    negative += firstMingSihua.filter((x) => ['忌', '化忌'].includes(x)).length +
        secondMingSihua.filter((x) => ['忌', '化忌'].includes(x)).length;

    const sihuaScore = Math.max(0.25, Math.min(1, 0.58 + positive * 0.07 - negative * 0.09));
    const clash = Math.min(1, (shaRatio(firstChart) + shaRatio(secondChart)) / 2);
    const score = Math.round(Math.max(0, Math.min(100, mingScore * 30 + projectionScore * 30 + sihuaScore * 25 + (1 - clash) * 15)));
    const synastryAnalysis = {
        mingCompatibility: { score: Math.round(mingScore * 100), stars: { first: firstMing, second: secondMing }, desc: mingScore >= 0.8 ? '雙方命宮星性互補，容易互相成就。' : '雙方命宮各有主見，需把差異轉成分工。' },
        fuqiProjection: { score: Math.round(projectionScore * 100), desc: projectionScore >= 0.8 ? '夫妻宮畫像與對方命宮特質有明顯呼應。' : '夫妻宮期待與對方表現有落差，宜用對話校準。' },
        sihuaInteraction: { score: Math.round(sihuaScore * 100), positive, negative, desc: negative ? '四化互照帶有期待與責任壓力，先談界線再談承諾。' : '四化互照偏向支持、欣賞與資源加乘，適合共同成長。' },
        shaClash: { score: Math.round((1 - clash) * 100), ratio: Number(clash.toFixed(2)), desc: clash > 0.5 ? '雙方夫妻/命宮煞星較多，衝突時要有冷靜與修復流程。' : '煞星衝突比例可控，重點在穩定溝通。' }
    };
    const summary = score >= 80 ? '契合度高，適合把欣賞落實成共同目標與穩定分工。' : score >= 60 ? '有互補基礎，也有需要磨合的棱角；清楚溝通會比猜測更重要。' : '差異與壓力訊號較明顯，先從界線、節奏和衝突修復方式建立安全感。';
    return {
        score,
        summary,
        firstChart,
        secondChart,
        firstSpouseAnalysis: firstSpouse,
        secondSpouseAnalysis: secondSpouse,
        synastryAnalysis,
        advice: '把命盤當作觀察語言：固定安排一次不帶手機的對話，確認金錢、時間、家庭與衝突後的修復方式，再用實際相處持續校準。'
    };
}

module.exports = { STAR_IN_FUQI_GU, SIHUA_IN_FUQI_GU, analyzeSpousePalace, evaluateZiweiMatch };
