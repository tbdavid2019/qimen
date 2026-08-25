const crypto = require('crypto');
const ZODIACS = ['鼠', '牛', '虎', '兔', '龍', '蛇', '馬', '羊', '猴', '雞', '狗', '豬'];
const SIX_HARMONY = new Set(['鼠-牛', '虎-豬', '兔-狗', '龍-雞', '蛇-猴', '馬-羊']);
const FORTUNES = [{ number: 1, title: '上上籤', poem: '花開月滿，緣分宜以真誠相待。' }, { number: 18, title: '中吉籤', poem: '緩步經營，關係會在理解中清明。' }, { number: 42, title: '平籤', poem: '先安頓自己，再辨識真正的心意。' }, { number: 66, title: '上吉籤', poem: '良緣可期，主動而不強求。' }, { number: 88, title: '中籤', poem: '放下執著，為新的互動留下空間。' }];
function zodiac(year) { return ZODIACS[(Number(year) - 4 + 1200) % 12]; }
function zodiacMatch(firstYear, secondYear) { const first = { year: Number(firstYear), zodiac: zodiac(firstYear) }; const second = { year: Number(secondYear), zodiac: zodiac(secondYear) }; const pair = `${first.zodiac}-${second.zodiac}`; const relationship = SIX_HARMONY.has(pair) || SIX_HARMONY.has(`${second.zodiac}-${first.zodiac}`) ? '六合：互相扶持、容易建立默契' : first.zodiac === second.zodiac ? '同生肖：價值觀相近，需避免互相固執' : '一般關係：以溝通與共同目標經營'; return { first, second, relationship, score: relationship.startsWith('六合') ? 88 : first.zodiac === second.zodiac ? 72 : 65 }; }
function drawFortuneStick(seed = crypto.randomBytes(16).toString('hex')) { const index = crypto.createHash('sha256').update(String(seed)).digest().readUInt32BE(0) % FORTUNES.length; return { seed, ...FORTUNES[index] }; }
function redThreadReading(chart) { const counts = chart?.fiveElements?.counts || {}; const weakest = ['木', '火', '土', '金', '水'].sort((a, b) => (counts[a] || 0) - (counts[b] || 0))[0]; return { weakestElement: weakest, summary: `感情互動宜補足${weakest}行特質：保持真誠、給彼此具體而穩定的回應。` }; }
function baziMatch(firstChart, secondChart) {
    if (!firstChart?.dayMaster || !secondChart?.dayMaster) throw new Error('八字合婚需要雙方命盤');
    const same = firstChart.dayMaster.element === secondChart.dayMaster.element;
    return { firstDayMaster: firstChart.dayMaster, secondDayMaster: secondChart.dayMaster, score: same ? 76 : 70, summary: same ? '日主同五行，容易理解彼此，但需避免相互消耗。' : '日主五行不同，可從互補與溝通中建立穩定關係。' };
}
function marriagePalace(chart) {
    const day = chart?.fourPillars?.find((pillar) => pillar.label === '日柱');
    if (!day) throw new Error('夫妻宮需要完整八字命盤');
    return { palace: day.branch, dayPillar: day.value, summary: `日支${day.branch}為夫妻宮；宜將其作為關係互動與承諾模式的文化參考。` };
}
function peachBlossom(year, status = '單身') { const animal = zodiac(year); const supports = { 鼠: '西方', 馬: '東方', 兔: '南方', 雞: '北方' }; return { zodiac: animal, status, favorableDirection: supports[animal] || '東南方', summary: `以${animal}年生肖作參考，近期宜透過共同興趣與穩定社交擴展緣分。` }; }
module.exports = { zodiacMatch, drawFortuneStick, redThreadReading, baziMatch, marriagePalace, peachBlossom };
