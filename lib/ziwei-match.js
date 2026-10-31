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

const STAR_NATURES = {
    紫微: '帝座之尊，格局宏闊、重體面主導，喜受尊重，不耐瑣碎指責。',
    天機: '智慧謀略，心思敏捷、善觀察企劃，精神追求高但思慮易多。',
    太陽: '光明博愛，胸懷坦蕩、慷慨有擔當，好為人師且易操心過度。',
    武曲: '財帛剛星，求真務實、重諾守信、節奏明快，情感表達質樸直接。',
    天同: '福德赤子，隨和溫厚、重視情調舒適，厭惡激烈衝突，喜和樂安穩。',
    廉貞: '次桃花主，自尊剛毅、愛恨分明、敏銳重原則，極重彼此界線信任。',
    天府: '令星財庫，溫厚穩健、重生活品味、善守成治理，追求踏實安全感。',
    太陰: '月曜母性，溫婉柔和、情感細膩、同理心強，心思內斂注重精神共鳴。',
    貪狼: '才藝桃花，靈動風趣、多才多藝、善於社交，渴望生活趣味與探索。',
    巨門: '暗曜思辨，明察秋毫、善分析實證、言辭犀利，宜防心結口角。',
    天相: '印星宰輔，體貼優雅、熱心協調、處事公平，注重外在體面與和諧。',
    天梁: '蔭星長者，老成持重、正義感強、善庇護照顧，偶帶長輩說教心態。',
    七殺: '將星開創，英氣勃發、果斷敢當、雷厲風行，喜直截了當厭拖泥帶水。',
    破軍: '變革先鋒，破舊立新、不拘常規、敢愛敢恨，需要充分個人自由度。'
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

function getStarTraits(stars) {
    if (!stars || !stars.length) return '氣息虛靈靈動，隨和能適應外在環境';
    return stars.map((s) => `${STAR_NATURES[s] || '星力純粹'}`).join('；');
}

function buildMingCompatibilityDesc(firstMing, secondMing, firstLabel, secondLabel, mingScore) {
    const fStars = firstMing.length ? firstMing.join('、') : '命無主星（借對宮）';
    const sStars = secondMing.length ? secondMing.join('、') : '命無主星（借對宮）';
    
    let dynamics = '';
    const commonStars = firstMing.filter((s) => secondMing.includes(s));
    if (commonStars.length > 0) {
        dynamics = `雙方命宮同臨【${commonStars.join('、')}】，核心心性極為相似，容易產生「相知恨晚」的默契，一眼看穿對方的心思；但也因性格鏡像，在面臨分歧時容易互不相讓，最忌將自我堅持強加於對方。`;
    } else {
        dynamics = `${firstLabel}命宮為【${fStars}】（${getStarTraits(firstMing)}）；${secondLabel}命宮為【${sStars}】（${getStarTraits(secondMing)}）。彼此先天心性構架不同，初識時常因特質互異而產生強烈好奇與吸引力。`;
    }

    let harmonyAdvice = '';
    if (mingScore >= 0.8) {
        harmonyAdvice = `星曜氣場相生互旺，雙方在思維維度與價值追求上具備高度共鳴，能自然形成「一人開拓、一人守成」或「一人決策、一人輔佐」的良性格局。`;
    } else if (mingScore >= 0.55) {
        harmonyAdvice = `雙方星性各具鮮明主張與獨立人格。相處之道在於「承認差異、各自主場」：在共同生活與重大決策中劃分權限，多傾聽包容，避免在彼此擅長的領域過度干預或質疑對方的決策模式。`;
    } else {
        harmonyAdvice = `雙方星曜剛柔氣質落差較為顯著，處事風格與步調迥異。必須建立明確的尊重界線，遇分歧時先處理情緒再論是非，切忌試圖改變或改造對方之本命心性。`;
    }

    return `${firstLabel}命宮坐守【${fStars}】，${secondLabel}命宮坐守【${sStars}】。\n\n${dynamics}\n\n${harmonyAdvice}`;
}

function buildFuqiProjectionDesc(firstSpouse, secondMing, secondSpouse, firstMing, firstLabel, secondLabel, projectionScore) {
    const fExpect = firstSpouse.majorStars.length ? firstSpouse.majorStars.join('、') : '無主星（借對宮）';
    const sExpect = secondSpouse.majorStars.length ? secondSpouse.majorStars.join('、') : '無主星（借對宮）';
    const sActual = secondMing.length ? secondMing.join('、') : '無主星（借對宮）';
    const fActual = firstMing.length ? firstMing.join('、') : '無主星（借對宮）';

    const p1 = `【${firstLabel}理想伴侶投射 vs ${secondLabel}真實心性】\n${firstLabel}夫妻宮坐守【${fExpect}】，先天潛意識渴望的伴侶畫像是：${firstSpouse.summary || '追求心靈理解與生活安穩'}。而${secondLabel}實際命宮坐守【${sActual}】（${getStarTraits(secondMing)}）。雙方在真實相處中若出現「期待與真實的落差」，需理解對方的個性特質乃天賦自然，宜用對話校準期待。`;
    
    const p2 = `【${secondLabel}理想伴侶投射 vs ${firstLabel}真實心性】\n${secondLabel}夫妻宮坐守【${sExpect}】，心中嚮往的伴侶畫像是：${secondSpouse.summary || '追求有擔當與深度共鳴之伴侶'}。而${firstLabel}實際命宮坐守【${fActual}】（${getStarTraits(firstMing)}）。這構成了${secondLabel}對${firstLabel}的核心吸引力來源。`;

    const p3 = projectionScore >= 0.75
        ? `總體而言，雙方夫妻宮之投射與對方真實性情具備高度呼應，容易在相處中看見彼此最迷人的特質，情感歸屬感強烈。`
        : `值得注意的是，彼此內心深處對伴侶的理想範本與真實個性存在部分反差。相處關鍵在於放下「完美伴侶」的刻板投射，以真誠欣賞代替期待落差。`;

    return `${p1}\n\n${p2}\n\n${p3}`;
}

function buildSihuaInteractionDesc(firstChart, secondChart, fSihua, sSihua, positive, negative, firstLabel, secondLabel, sihuaScore) {
    const hits1 = [];
    const hits2 = [];

    for (const type of ['祿', '權', '科', '忌']) {
        const star = fSihua[type];
        if (star) {
            const pName = findStarPalaceName(secondChart, star);
            if (pName) hits1.push(`${firstLabel}生年【化${type}·${star}】落入${secondLabel}之【${pName}】`);
        }
    }
    for (const type of ['祿', '權', '科', '忌']) {
        const star = sSihua[type];
        if (star) {
            const pName = findStarPalaceName(firstChart, star);
            if (pName) hits2.push(`${secondLabel}生年【化${type}·${star}】落入${firstLabel}之【${pName}】`);
        }
    }

    const mappingText = [...hits1, ...hits2].slice(0, 4).join('；') || '雙方四化星力在三方四正中流動互照';

    let effectText = '';
    if (sihuaScore >= 0.7) {
        effectText = `四化交匯以化祿、化權、化科之正面催化為主，象徵彼此能在事業發展、財富資源或心靈滋養上互為貴人，能互相激發生活動能與社會成就。`;
    } else {
        effectText = `四化互照中伴隨化忌或執著能量的牽引，代表關係中承載著較深的情感責任與現實考驗。在金錢邊界、家庭責任或時間分配上宜先明確規則，避免因過度期待而生埋怨。`;
    }

    return `雙方天干四化氣機深層交織：${mappingText}。\n\n${effectText}\n\n這表明兩人相處不僅是性格相逢，更在人生實踐層面牽動著深層的資源流轉與命運課題。`;
}

function buildShaClashDesc(firstChart, secondChart, clash, firstLabel, secondLabel) {
    const shaStars = ['擎羊', '陀羅', '火星', '鈴星', '地空', '地劫'];
    const fSha = (ming(firstChart)?.stars || []).concat(spouse(firstChart)?.stars || []).filter((s) => shaStars.includes(s.name)).map((s) => s.name);
    const sSha = (ming(secondChart)?.stars || []).concat(spouse(secondChart)?.stars || []).filter((s) => shaStars.includes(s.name)).map((s) => s.name);

    let shaPresence = '';
    if (fSha.length || sSha.length) {
        shaPresence = `${fSha.length ? `${firstLabel}命/妻宮見【${[...new Set(fSha)].join('、')}】` : `${firstLabel}關鍵宮位無惡煞衝照`}；${sSha.length ? `${secondLabel}命/妻宮見【${[...new Set(sSha)].join('、')}】` : `${secondLabel}關鍵宮位無惡煞衝照`}。`;
    } else {
        shaPresence = `雙方命宮與夫妻宮吉星拱照，六煞星（羊陀火鈴空劫）未在核心宮位形成直接重度對衝。`;
    }

    let warning = '';
    if (clash > 0.4) {
        warning = `煞星交織提醒：在遭遇生活壓力或意見分歧時，容易因剛直衝動（擎羊、火星）或暗結心結、冷戰翻舊帳（陀羅、鈴星）而傷及感情。必須約定「爭吵不過夜、禁止人身攻擊」的冷靜機制。`;
    } else {
        warning = `煞星衝突比例在安全可控範圍之內，關係穩定度高。相處時最大的考驗並非不可調和的矛盾，而在於日常瑣碎中之溝通耐心，避免將外部工作壓力帶回家中。`;
    }

    return `${shaPresence}\n\n${warning}\n\n建議建立「衝突降溫協議」，爭執發生時給予彼此 15-30 分鐘冷靜期，以理性對話代替情緒對決。`;
}

function buildPersonalizedAdvice(firstMing, secondMing, firstSpouse, secondSpouse, score, firstLabel, secondLabel) {
    const fStars = firstMing.join('、') || '命主星';
    const sStars = secondMing.join('、') || '命主星';

    return `【相處實戰指引 · 照見當下】\n\n` +
        `1. 🎯 溝通之道（重情勝於爭理）：${firstLabel}【${fStars}】與${secondLabel}【${sStars}】同聚，交流重在「共情而非辯論」。遇爭執時，先傾聽 3 分鐘不急於反駁，確認聽懂情緒後再商討對策，切忌在氣頭上爭道理長短。\n\n` +
        `2. ⚖️ 權責劃分（各自擁有主場）：在外部社交、投資或家庭重大事務上明確分工，依各自星曜優勢落實「一人主導、另一人全力支持」，杜絕無休止的權力拉鋸。\n\n` +
        `3. 💡 衝突修復（黃金和解默契）：建立定期的無干擾「深度交流時間」，放下手機坦誠核對金錢、家庭與情感需求，將命盤差異轉化為長期攜手成長之互補基石。`;
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
    const fSihuaNorm = {
        祿: fSihua.lu || fSihua.祿,
        權: fSihua.quan || fSihua.權,
        科: fSihua.ke || fSihua.科,
        忌: fSihua.ji || fSihua.忌
    };
    const sSihuaNorm = {
        祿: sSihua.lu || sSihua.祿,
        權: sSihua.quan || sSihua.權,
        科: sSihua.ke || sSihua.科,
        忌: sSihua.ji || sSihua.忌
    };
    let positive = 0;
    let negative = 0;

    if (fSihuaNorm.祿 && keyPalaces.has(findStarPalaceName(secondChart, fSihuaNorm.祿))) positive++;
    if (fSihuaNorm.權 && keyPalaces.has(findStarPalaceName(secondChart, fSihuaNorm.權))) positive++;
    if (fSihuaNorm.科 && keyPalaces.has(findStarPalaceName(secondChart, fSihuaNorm.科))) positive++;
    if (fSihuaNorm.忌 && ['命宮', '夫妻宮'].includes(findStarPalaceName(secondChart, fSihuaNorm.忌))) negative++;

    if (sSihuaNorm.祿 && keyPalaces.has(findStarPalaceName(firstChart, sSihuaNorm.祿))) positive++;
    if (sSihuaNorm.權 && keyPalaces.has(findStarPalaceName(firstChart, sSihuaNorm.權))) positive++;
    if (sSihuaNorm.科 && keyPalaces.has(findStarPalaceName(firstChart, sSihuaNorm.科))) positive++;
    if (sSihuaNorm.忌 && ['命宮', '夫妻宮'].includes(findStarPalaceName(firstChart, sSihuaNorm.忌))) negative++;

    const firstMingSihua = getSihuaNames(ming(firstChart));
    const secondMingSihua = getSihuaNames(ming(secondChart));
    positive += firstMingSihua.filter((x) => ['祿', '權', '科', '化祿', '化權', '化科'].includes(x)).length +
        secondMingSihua.filter((x) => ['祿', '權', '科', '化祿', '化權', '化科'].includes(x)).length;
    negative += firstMingSihua.filter((x) => ['忌', '化忌'].includes(x)).length +
        secondMingSihua.filter((x) => ['忌', '化忌'].includes(x)).length;

    const sihuaScore = Math.max(0.25, Math.min(1, 0.58 + positive * 0.07 - negative * 0.09));
    const clash = Math.min(1, (shaRatio(firstChart) + shaRatio(secondChart)) / 2);
    const score = Math.round(Math.max(0, Math.min(100, mingScore * 30 + projectionScore * 30 + sihuaScore * 25 + (1 - clash) * 15)));
    const firstLabel = firstInput.name ? `${firstInput.name}` : (firstSex === '女' ? '女方' : '男方');
    const secondLabel = secondInput.name ? `${secondInput.name}` : (secondSex === '女' ? '女方' : '男方');

    const synastryAnalysis = {
        mingCompatibility: {
            score: Math.round(mingScore * 100),
            stars: { first: firstMing, second: secondMing },
            desc: buildMingCompatibilityDesc(firstMing, secondMing, firstLabel, secondLabel, mingScore)
        },
        fuqiProjection: {
            score: Math.round(projectionScore * 100),
            desc: buildFuqiProjectionDesc(firstSpouse, secondMing, secondSpouse, firstMing, firstLabel, secondLabel, projectionScore)
        },
        sihuaInteraction: {
            score: Math.round(sihuaScore * 100),
            positive,
            negative,
            desc: buildSihuaInteractionDesc(firstChart, secondChart, fSihuaNorm, sSihuaNorm, positive, negative, firstLabel, secondLabel, sihuaScore)
        },
        shaClash: {
            score: Math.round((1 - clash) * 100),
            ratio: Number(clash.toFixed(2)),
            desc: buildShaClashDesc(firstChart, secondChart, clash, firstLabel, secondLabel)
        }
    };
    const summary = score >= 80
        ? `合盤契合度高（${score}分）：星曜氣場相得益彰，容易將彼此之欣賞轉化為共同長遠之人生願景與生活分工。`
        : score >= 60
        ? `合盤互補具備良好基石（${score}分）：有相互吸引之特質，亦有處事步調之磨合稜角；坦誠對話、確立界線會比互相猜測更具建設性。`
        : `合盤個性差異與考驗較顯著（${score}分）：星曜剛柔落差大，建議先從彼此之價值界線、生活節奏與衝突冷靜機制建立基本安全感。`;

    return {
        score,
        summary,
        firstChart,
        secondChart,
        firstSpouseAnalysis: firstSpouse,
        secondSpouseAnalysis: secondSpouse,
        synastryAnalysis,
        advice: buildPersonalizedAdvice(firstMing, secondMing, firstSpouse, secondSpouse, score, firstLabel, secondLabel)
    };
}

module.exports = { STAR_IN_FUQI_GU, SIHUA_IN_FUQI_GU, analyzeSpousePalace, evaluateZiweiMatch };
