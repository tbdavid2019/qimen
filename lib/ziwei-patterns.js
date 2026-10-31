'use strict';

/*
 * 紫微斗數古籍格局判定庫。
 * 演算法來源與溯源依據：
 * - 原始開源庫：https://github.com/Renhuai123/ziwei-doushu (MIT License)
 * - 上游模組：lib/ziwei/patterns.ts (34種正統古籍名局成格與破格判定)
 * - 典籍出處：《紫微斗數全書》、《紫微斗數全集》、《骨髓賦》
 * 這裡只做本命盤的星曜結構判斷，不把格局當成絕對命定；每筆結果都保留
 * required / bonus / breaking，供 API、CLI 和前端呈現可核對的依據。
 */

const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const SHA = new Set(['擎羊', '陀羅', '火星', '鈴星', '地空', '地劫']);
const HARD_SHA = new Set(['擎羊', '陀羅', '火星', '鈴星']);
const KONG_SHA = new Set(['地空', '地劫']);

function branchIndex(value) {
    if (typeof value === 'number') return ((value % 12) + 12) % 12;
    const index = BRANCHES.indexOf(value);
    return index >= 0 ? index : null;
}

function mingBranch(chart) {
    return branchIndex(chart.mingGongBranch ?? chart.mingPalaceBranch ?? chart.palaces?.find((p) => p.isMing)?.branch);
}

function shenBranch(chart) {
    return branchIndex(chart.shenGongBranch ?? chart.shenPalaceBranch ?? chart.palaces?.find((p) => p.isShen)?.branch);
}

function palaceBranch(palace) { return branchIndex(palace?.branch); }
function stars(palace) { return (palace?.stars || []).map((star) => star.name); }
function has(palace, name) { return stars(palace).includes(name); }
function majorNames(palace) { return (palace?.stars || []).filter((s) => s.type === 'major' || !s.type).map((s) => s.name); }
function findStar(chart, name) { return chart.palaces?.find((p) => has(p, name)); }
function samePalace(chart, first, second) {
    const a = findStar(chart, first); const b = findStar(chart, second);
    return Boolean(a && b && palaceBranch(a) === palaceBranch(b));
}
function sihua(star) { return star?.sihua ?? star?.siHua ?? null; }
function starWithSihua(palace, kind) { return (palace?.stars || []).find((s) => sihua(s) === kind); }
function sanFangPalaces(chart) {
    const m = mingBranch(chart);
    if (m === null || m === undefined) return [];
    const branches = [m, (m + 4) % 12, (m + 8) % 12, (m + 6) % 12];
    return (chart.palaces || []).filter((p) => branches.includes(palaceBranch(p)));
}
function sanFangSet(chart) { return new Set(sanFangPalaces(chart).flatMap(stars)); }
function hasInSanFang(chart, name) { return sanFangSet(chart).has(name); }
function countSha(chart, set = HARD_SHA) {
    return sanFangPalaces(chart).reduce((n, palace) => n + stars(palace).filter((s) => set.has(s)).length, 0);
}
function getMing(chart) { return (chart.palaces || []).find((p) => palaceBranch(p) === mingBranch(chart)) || chart.palaces?.find((p) => p.isMing); }
function getByName(chart, name) { return (chart.palaces || []).find((p) => p.name === name || p.name === name.replace('宮', '')); }
function opposite(chart, branch) { return (chart.palaces || []).find((p) => palaceBranch(p) === (branch + 6) % 12); }
function neighbors(chart, branch) {
    return (chart.palaces || []).filter((p) => {
        const b = palaceBranch(p); return b === (branch + 1) % 12 || b === (branch + 11) % 12;
    });
}
function bright(palace, name) {
    const star = (palace?.stars || []).find((s) => s.name === name);
    return Boolean(star && ['廟', '旺', '得'].includes(star.brightness));
}
function dim(palace, name) {
    const star = (palace?.stars || []).find((s) => s.name === name);
    return Boolean(star && ['陷', '不'].includes(star.brightness));
}
function pushPattern(list, spec) {
    const level = spec.level || 'neutral';
    const type = spec.type || (level === 'caution' ? '課題格' : level === 'neutral' ? '平格' : '吉格');
    const conditions = {
        required: spec.required || [],
        bonus: spec.bonus || [],
        breaking: spec.breaking || []
    };
    list.push({
        name: spec.name,
        level,
        type,
        desc: spec.desc,
        description: spec.desc,
        palaces: spec.palaces || ['命宮'],
        conditions,
        source: spec.source || '《紫微斗數全書》'
    });
}
function pairPattern(chart, list, name, first, second, spec = {}) {
    const a = findStar(chart, first); const b = findStar(chart, second);
    if (!a || !b || palaceBranch(a) !== palaceBranch(b)) return false;
    const p = a;
    const breaking = [...(spec.breaking || [])];
    if (stars(p).some((s) => HARD_SHA.has(s))) breaking.push('同宮見煞星，格局力量受損');
    pushPattern(list, {
        name, level: breaking.length ? 'caution' : (spec.level || 'good'),
        desc: spec.desc || `${first}${second}同宮，主星性互補，須看廟旺與煞忌會照。`,
        palaces: [p.name], required: [`${first}${second}同宮`], bonus: spec.bonus || [], breaking,
        source: spec.source
    });
    return true;
}

function detectAllPatterns(chart) {
    const result = [];
    const ming = getMing(chart);
    if (!ming) return result;
    const m = mingBranch(chart);
    const sf = sanFangSet(chart);
    const sfPalaces = sanFangPalaces(chart);
    const sfSihua = new Set(sfPalaces.flatMap((p) => (p.stars || []).map(sihua).filter(Boolean)));

    // 上格與主星組合
    if (has(ming, '紫微') && sf.has('左輔') && sf.has('右弼')) {
        const breaking = countSha(chart, KONG_SHA) >= 2 ? ['地空地劫雙重會照，紫微貴氣減弱'] : [];
        pushPattern(result, { name: '君臣慶會', level: breaking.length ? 'good' : 'excellent', desc: '紫微入命，左右輔弼同會，象徵統籌力與團隊資源同時到位。', palaces: ['命宮'], required: ['紫微入命', '左輔右弼同會三方四正'], bonus: ['昌曲或魁鉞加照'].filter((x) => (x.startsWith('昌') && (sf.has('文昌') || sf.has('文曲'))) || (x.startsWith('魁') && (sf.has('天魁') || sf.has('天鉞')))), breaking, source: '《骨髓賦》' });
    }
    const zi = findStar(chart, '紫微'); const fu = findStar(chart, '天府');
    if (zi && fu && palaceBranch(zi) === palaceBranch(fu)) {
        pushPattern(result, { name: '紫府同宮', level: palaceBranch(zi) === m ? 'excellent' : 'good', desc: '紫微與天府同宮，兼具領導、資源整合與守成能力。', palaces: [zi.name], required: ['紫微天府同宮'], bonus: sf.has('左輔') && sf.has('右弼') ? ['輔弼同會'] : [], breaking: stars(zi).some((s) => KONG_SHA.has(s)) ? ['同宮見空劫'] : [], source: '《紫微斗數全書·紫府同宮格》' });
    }
    const fuPalace = findStar(chart, '天府'); const xiangPalace = findStar(chart, '天相');
    if (fuPalace && xiangPalace && sfPalaces.includes(fuPalace) && sfPalaces.includes(xiangPalace) && palaceBranch(fuPalace) !== palaceBranch(xiangPalace)) {
        pushPattern(result, { name: '府相朝垣', level: 'excellent', desc: '天府與天相在命宮三方四正互相拱照，資源、秩序與執行力俱備。', palaces: [fuPalace.name, xiangPalace.name], required: ['天府、天相同會命宮三方四正'], bonus: sf.has('祿存') ? ['祿存會照'] : [], breaking: countSha(chart) >= 3 ? ['三方四正煞星過多'] : [], source: '《府相朝垣》' });
    }
    if (['太陽', '天梁', '文昌', '祿存'].every((x) => sf.has(x))) {
        const sun = findStar(chart, '太陽');
        pushPattern(result, { name: '陽梁昌祿', level: dim(sun, '太陽') ? 'good' : 'excellent', desc: '太陽、天梁、文昌、祿存會照，利於專業表達、考試名聲與制度型發展。', palaces: sfPalaces.filter((p) => ['太陽', '天梁', '文昌', '祿存'].some((s) => has(p, s))).map((p) => p.name), required: ['太陽、天梁、文昌、祿存齊會'], bonus: bright(sun, '太陽') ? ['太陽廟旺'] : [], breaking: dim(sun, '太陽') ? ['太陽落陷'] : [], source: '《陽梁昌祿》' });
    }
    pairPattern(chart, result, '武貪格', '武曲', '貪狼', { level: 'excellent', desc: '武曲與貪狼同宮，務實財星與人脈才藝交會，宜中年後厚積薄發。', source: '《骨髓賦》' });
    if (['七殺', '破軍', '貪狼'].every((x) => sf.has(x))) pushPattern(result, { name: '殺破狼', level: countSha(chart) >= 3 ? 'caution' : 'good', desc: '七殺、破軍、貪狼在命宮三方四正成系統，代表高變動、高開創與重整能力。', palaces: ['命宮'], required: ['七殺、破軍、貪狼三星齊會'], bonus: sfSihua.has('祿') || sfSihua.has('權') ? ['祿權助動'] : [], breaking: countSha(chart) >= 3 ? ['煞星過重'] : [], source: '《紫微斗數全書·殺破狼》' });
    if (['天機', '太陰', '天同', '天梁'].every((x) => sf.has(x))) pushPattern(result, { name: '機月同梁', level: countSha(chart) >= 3 ? 'good' : 'excellent', desc: '天機、太陰、天同、天梁齊會，長於規劃、服務、研究與穩定累積。', palaces: sfPalaces.filter((p) => ['天機', '太陰', '天同', '天梁'].some((s) => has(p, s))).map((p) => p.name), required: ['天機太陰天同天梁四星齊會'], bonus: sf.has('文昌') || sf.has('文曲') ? ['昌曲同會'] : [], breaking: countSha(chart) >= 3 ? ['煞星過多'] : [], source: '《機月同梁格》' });
    pairPattern(chart, result, '廉貞天相格', '廉貞', '天相', { level: 'good', desc: '廉貞天相同宮，重視規範、判斷與協調，適合管理、法務與行政。' });
    pairPattern(chart, result, '武曲七殺', '武曲', '七殺', { level: 'good', desc: '武曲七殺同宮，果斷、務實、能扛責任，財務與行動力並重。' });
    pairPattern(chart, result, '天同天梁格', '天同', '天梁', { level: 'good', desc: '天同天梁同宮，溫和與責任感並行，適合助人、教育與照護型工作。' });

    const sun = findStar(chart, '太陽'); const moon = findStar(chart, '太陰');
    if (sun && moon && palaceBranch(sun) === palaceBranch(moon) && [1, 7].includes(palaceBranch(sun))) {
        const breaking = stars(sun).some((s) => HARD_SHA.has(s)) ? ['日月同宮見煞星，光明受損'] : [];
        const dayMoonSpec = { level: breaking.length ? 'good' : (palaceBranch(sun) === m ? 'excellent' : 'good'), desc: '太陽太陰同宮，陰陽互補；仍須檢查亮度、四化與煞星。', palaces: [sun.name], required: [`太陽太陰同入${BRANCHES[palaceBranch(sun)]}宮`], bonus: palaceBranch(sun) === 7 ? ['未宮日月雙美'] : [], breaking, source: '《紫微斗數全書·日月同宮格》' };
        pushPattern(result, { name: '日月同宮', ...dayMoonSpec });
        // 舊版 API 曾以「日月並明格」命名同一條件，保留別名避免既有消費端失效。
        pushPattern(result, { name: '日月並明格', ...dayMoonSpec, source: '《紫微斗數全書·日月並明》' });
    }
    const ns = neighbors(chart, m); const nsStars = ns.flatMap(stars);
    if (nsStars.includes('太陽') && nsStars.includes('太陰')) pushPattern(result, { name: '日月夾命', level: 'excellent', desc: '太陽太陰分居命宮前後，象徵名望與支持系統可互相照應。', palaces: ['命宮', ...ns.map((p) => p.name)], required: ['太陽太陰分居命宮前後兩宮'], bonus: bright(ns.find((p) => has(p, '太陽')), '太陽') ? ['太陽廟旺'] : [], breaking: ns.some((p) => dim(p, '太陽') || dim(p, '太陰')) ? ['日月落陷'] : [], source: '《日月夾命》' });
    const ju = findStar(chart, '巨門');
    if (ju && sun && palaceBranch(ju) === palaceBranch(sun) && [2, 8].includes(palaceBranch(ju))) pushPattern(result, { name: '巨日同宮', level: palaceBranch(ju) === 8 ? 'caution' : 'good', desc: '巨門得太陽同宮，適合以口才、傳播、研究與專業表達建立影響力。', palaces: [ju.name], required: [`巨門太陽同入${BRANCHES[palaceBranch(ju)]}宮`], bonus: palaceBranch(ju) === 2 ? ['寅宮太陽明朗'] : [], breaking: palaceBranch(ju) === 8 ? ['申宮日斜，暗曜力量增加'] : [], source: '《巨日同宮》' });
    if (has(ming, '巨門') && [0, 6].includes(m)) pushPattern(result, { name: '石中隱玉', level: 'excellent', desc: '巨門坐子午命宮，內在思辨與專業需要時間打磨，成熟後更能顯才。', palaces: ['命宮'], required: [`巨門入命於${BRANCHES[m]}宮`], bonus: sf.has('文昌') ? ['文昌會照'] : [], breaking: sihua(hasStarWith(ming, '巨門')) === '忌' ? ['巨門化忌'] : [], source: '《骨髓賦·石中隱玉》' });
    if (m === 7 && majorNames(ming).length === 0 && has(opposite(chart, m), '太陽') && has(opposite(chart, m), '太陰')) pushPattern(result, { name: '明珠出海', level: 'excellent', desc: '未宮空宮，對宮日月相照，後天選擇與外部舞台能放大自身能力。', palaces: ['命宮', opposite(chart, m).name], required: ['命宮在未為空宮', '對宮日月同度'], bonus: sf.has('文昌') || sf.has('文曲') ? ['昌曲會照'] : [], breaking: countSha(chart) >= 2 ? ['煞星會照'] : [], source: '《紫微斗數全集·明珠出海》' });
    if (has(ming, '紫微') && !has(ming, '天府')) pushPattern(result, { name: '紫微入命', level: sf.has('左輔') || sf.has('右弼') ? 'excellent' : 'good', desc: '紫微獨坐命宮，重視主導、格局與責任；輔弼會照時更能把領導力落地。', palaces: ['命宮'], required: ['紫微獨坐命宮'], bonus: sf.has('左輔') && sf.has('右弼') ? ['輔弼同會'] : [], breaking: stars(ming).some((s) => KONG_SHA.has(s)) ? ['紫微遇空劫'] : [], source: '《紫微斗數全書》' });

    // 夾宮、四化與煞忌格
    const prevNext = ns;
    function crossed(a, b) { return (has(prevNext[0], a) && has(prevNext[1], b)) || (has(prevNext[0], b) && has(prevNext[1], a)); }
    if (crossed('左輔', '右弼')) pushPattern(result, { name: '輔弼夾命', level: 'excellent', desc: '左輔右弼分居命宮兩側，遇到團隊與組織議題時容易得到支援。', palaces: ['命宮', ...prevNext.map((p) => p.name)], required: ['左輔右弼分居命宮前後'], bonus: sf.has('天魁') || sf.has('天鉞') ? ['魁鉞同會'] : [], source: '《輔弼夾命》' });
    if (crossed('文昌', '文曲')) pushPattern(result, { name: '昌曲夾命', level: 'excellent', desc: '文昌文曲夾命，利於文字、學習、研究與審美表達。', palaces: ['命宮', ...prevNext.map((p) => p.name)], required: ['文昌文曲分居命宮前後'], source: '《紫微斗數全書》' });
    if (crossed('天魁', '天鉞')) pushPattern(result, { name: '魁鉞夾命', level: 'good', desc: '天魁天鉞夾命，關鍵時刻較容易遇到願意提攜的貴人。', palaces: ['命宮', ...prevNext.map((p) => p.name)], required: ['天魁天鉞分居命宮前後'], source: '《紫微斗數全書》' });
    if (sf.has('祿存') && sfSihua.has('祿')) pushPattern(result, { name: '雙祿朝垣', level: 'excellent', desc: '祿存與化祿同會，資源與收入主題較容易形成正向循環。', palaces: sfPalaces.map((p) => p.name), required: ['祿存、化祿同會三方四正'], breaking: stars(ming).some((s) => KONG_SHA.has(s)) ? ['命坐空劫，聚財需要制度'] : [], source: '《雙祿朝垣》' });
    if (['祿', '權', '科'].every((x) => sfSihua.has(x))) pushPattern(result, { name: '三奇加會', level: 'excellent', desc: '化祿、化權、化科齊會，資源、執行與名聲可互相加乘。', palaces: sfPalaces.map((p) => p.name), required: ['化祿、化權、化科齊會'], source: '《三奇加會》' });

    const ji = starWithSihua(ming, '忌');
    if (ji) {
        const n = neighbors(chart, m);
        if (n.length === 2 && crossed('擎羊', '陀羅')) pushPattern(result, { name: '羊陀夾忌', level: 'caution', type: '破格警示', desc: '化忌坐命又受羊陀夾制，提醒把壓力拆成可管理的步驟，避免在情緒高點決策。', palaces: ['命宮', ...n.map((p) => p.name)], required: ['化忌坐命', '擎羊陀羅分居兩側'], source: '《骨髓賦·羊陀夾忌》' });
    }
    if (crossed('火星', '鈴星')) pushPattern(result, { name: '火鈴夾命', level: 'caution', type: '破格警示', desc: '火鈴夾命，做事反應快但容易過熱；重要決策宜預留冷靜期。', palaces: ['命宮', ...prevNext.map((p) => p.name)], required: ['火星鈴星分居命宮前後'], source: '《紫微斗數全書》' });
    if (crossed('地空', '地劫')) pushPattern(result, { name: '空劫夾命', level: 'caution', type: '破格警示', desc: '空劫夾命，創意與抽離感強；財務和承諾宜用具體規則落地。', palaces: ['命宮', ...prevNext.map((p) => p.name)], required: ['地空地劫分居命宮前後'], source: '《紫微斗數全書》' });
    if (['廉貞', '七殺', '擎羊'].every((x) => sf.has(x))) pushPattern(result, { name: '廉殺羊', level: 'caution', type: '破格警示', desc: '廉貞、七殺、擎羊同會，衝勁強但需留意急躁與衝突成本。', required: ['廉貞七殺擎羊會照'], source: '《紫微斗數全書·廉殺羊》' });
    if (['巨門', '火星', '擎羊'].every((x) => sf.has(x))) pushPattern(result, { name: '巨火羊', level: 'caution', type: '破格警示', desc: '巨門火羊會照，直言與情緒容易放大；練習留白和溫和表達有助於轉化。', required: ['巨門火星擎羊會照'], source: '《骨髓賦·巨火羊》' });
    if (['鈴星', '文昌', '陀羅', '武曲'].every((x) => sf.has(x))) pushPattern(result, { name: '鈴昌陀武', level: 'caution', type: '破格警示', desc: '鈴昌陀武同會，壓力來時宜保守處理契約、財務和作息。', required: ['鈴星文昌陀羅武曲會照'], source: '《骨髓賦·鈴昌陀武》' });
    if (m === 6 && has(ming, '擎羊')) pushPattern(result, { name: '馬頭帶箭', level: sf.has('七殺') || sf.has('破軍') ? 'good' : 'caution', desc: '擎羊坐午命，行動果決、競爭性強；有吉星支持時更能成為執行優勢。', required: ['擎羊於午宮坐命'], bonus: sf.has('七殺') || sf.has('破軍') ? ['七殺或破軍會照'] : [], source: '《骨髓賦·馬頭帶箭》' });
    const cai = getByName(chart, '財帛宮') || getByName(chart, '財帛');
    if (cai && starWithSihua(cai, '祿')) pushPattern(result, { name: '化祿入財', level: 'good', desc: `${starWithSihua(cai, '祿').name}化祿入財帛，適合把專長轉成可持續的收入系統。`, palaces: [cai.name], required: [`${starWithSihua(cai, '祿').name}化祿入財帛宮`], source: '《紫微斗數全書·四化論》' });
    const guan = getByName(chart, '官祿宮') || getByName(chart, '官祿');
    if (guan && starWithSihua(guan, '權')) pushPattern(result, { name: '化權入官', level: 'good', desc: `${starWithSihua(guan, '權').name}化權入官祿，事業上有承擔、主導和解決問題的傾向。`, palaces: [guan.name], required: [`${starWithSihua(guan, '權').name}化權入官祿宮`], source: '《紫微斗數全書·四化論》' });
    const partial = ['天機', '太陰', '天同', '天梁'].filter((x) => sf.has(x));
    if (partial.length === 3) pushPattern(result, { name: '機月同梁三星會', level: 'neutral', desc: `機月同梁四星中會齊三星（${partial.join('、')}），有穩定與規劃優勢，但仍須補看缺位星曜。`, required: [`三方四正會${partial.join('、')}`], source: '《紫微斗數全書·機月同梁格》' });
    if (sf.has('左輔') && sf.has('右弼') && !result.some((p) => p.name === '輔弼夾命')) pushPattern(result, { name: '輔弼同會', level: 'good', desc: '左輔右弼同會命宮三方四正，合作、人脈與資源整合是重要優勢。', required: ['左輔右弼同會三方四正'], source: '《紫微斗數全書·輔弼論》' });
    if (sf.has('天魁') && sf.has('天鉞') && !result.some((p) => p.name === '魁鉞夾命')) pushPattern(result, { name: '魁鉞同會', level: 'good', desc: '天魁天鉞同會，面對轉折時較容易得到關鍵人士的協助。', required: ['天魁天鉞同會三方四正'], source: '《紫微斗數全書·魁鉞論》' });
    if (sfSihua.has('科') && sfSihua.has('權')) pushPattern(result, { name: '科權雙會', level: 'good', desc: '化科與化權同會，適合走專業權威、管理與責任並重的路線。', required: ['化科化權同會三方四正'], source: '《紫微斗數全書·四化會照》' });
    return result;
}

function hasStarWith(palace, name) { return (palace?.stars || []).find((s) => s.name === name); }

module.exports = { detectAllPatterns, detectPatterns: detectAllPatterns };
