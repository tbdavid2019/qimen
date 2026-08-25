const DIRECTIONS = ['北', '東北', '東', '東南', '南', '西南', '西', '西北'];
const HOUSE_BY_FACING = { 南: '坎宅', 北: '離宅', 西: '震宅', 東: '兌宅', 東南: '乾宅', 西北: '巽宅', 東北: '坤宅', 西南: '艮宅' };
const MING_GUA = { 1: '坎', 2: '坤', 3: '震', 4: '巽', 6: '乾', 7: '兌', 8: '艮', 9: '離' };
const EIGHT_MANSIONS = {
    坎宅: ['伏位', '五鬼', '天醫', '生氣', '延年', '絕命', '禍害', '六煞'],
    坤宅: ['絕命', '生氣', '禍害', '五鬼', '六煞', '伏位', '天醫', '延年'],
    震宅: ['天醫', '六煞', '伏位', '延年', '生氣', '禍害', '絕命', '五鬼'],
    巽宅: ['生氣', '絕命', '延年', '伏位', '天醫', '五鬼', '六煞', '禍害'],
    乾宅: ['六煞', '天醫', '五鬼', '禍害', '絕命', '延年', '生氣', '伏位'],
    兌宅: ['禍害', '延年', '絕命', '六煞', '五鬼', '天醫', '伏位', '生氣'],
    艮宅: ['五鬼', '伏位', '六煞', '絕命', '禍害', '生氣', '延年', '天醫'],
    離宅: ['延年', '禍害', '生氣', '天醫', '伏位', '六煞', '五鬼', '絕命']
};
const PALACES = ['中', '西北', '西', '東北', '南', '北', '西南', '東', '東南'];

function reduceNumber(value) { return String(value).split('').reduce((sum, digit) => sum + Number(digit), 0); }
function mingGua(year, sex) {
    let number = reduceNumber(year % 100); while (number > 9) number = reduceNumber(number);
    number = sex === '女' ? (5 + number) % 9 || 9 : 10 - number;
    if (number === 5) number = sex === '女' ? 2 : 8;
    return { number, name: MING_GUA[number] || '坤' };
}
function fly(start) { return Object.fromEntries(PALACES.map((palace, index) => [palace, ((start - 1 + index) % 9) + 1])); }
function calculateFengShui({ facing, moveInYear, residentYear, sex, year = new Date().getFullYear() } = {}) {
    if (!HOUSE_BY_FACING[facing]) throw new Error('請提供有效的房屋朝向');
    const house = HOUSE_BY_FACING[facing];
    const directions = Object.fromEntries(DIRECTIONS.map((direction, index) => [direction, EIGHT_MANSIONS[house][index]]));
    const annualStart = ((11 - (year % 9)) % 9) + 1;
    return { facing, moveInYear: Number(moveInYear) || null, period: 9, eightMansions: { house, directions }, flyingStars: { base: fly(9), annual: fly(annualStart), year }, resident: { year: Number(residentYear), sex, mingGua: mingGua(Number(residentYear), sex) } };
}
module.exports = { calculateFengShui, mingGua };
