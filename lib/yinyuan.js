const crypto = require('crypto');
const fortuneSticksData = require('../data/fortune-sticks-100.json');
const { Solar, Lunar } = require('lunar-javascript');

const ZODIACS = ['鼠', '牛', '虎', '兔', '龍', '蛇', '馬', '羊', '猴', '雞', '狗', '豬'];
const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];

const STEM_ELEMENT = { 甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土', 己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水' };
const BRANCH_ELEMENT = { 子: '水', 丑: '土', 寅: '木', 卯: '木', 辰: '土', 巳: '火', 午: '火', 未: '土', 申: '金', 酉: '金', 戌: '土', 亥: '水' };

// 納音五行
const NAYIN_TABLE = {
    '甲子': '海中金', '乙丑': '海中金', '丙寅': '爐中火', '丁卯': '爐中火', '戊辰': '大林木', '己巳': '大林木',
    '庚午': '路旁土', '辛未': '路旁土', '壬申': '劍鋒金', '癸酉': '劍鋒金', '甲戌': '山頭火', '乙亥': '山頭火',
    '丙子': '澗下水', '丁丑': '澗下水', '戊寅': '城牆土', '己卯': '城牆土', '庚辰': '白蠟金', '辛巳': '白蠟金',
    '壬午': '楊柳木', '癸未': '楊柳木', '甲申': '泉中水', '乙酉': '泉中水', '丙戌': '屋上土', '丁亥': '屋上土',
    '戊子': '霹靂火', '己丑': '霹靂火', '庚寅': '松柏木', '辛卯': '松柏木', '壬辰': '長流水', '癸巳': '長流水',
    '甲午': '砂石金', '乙未': '砂石金', '丙申': '山下火', '丁酉': '山下火', '戊戌': '平地木', '己亥': '平地木',
    '庚子': '壁上土', '辛丑': '壁上土', '壬寅': '金箔金', '癸卯': '金箔金', '甲辰': '覆燈火', '乙巳': '覆燈火',
    '丙午': '天河水', '丁未': '天河水', '戊申': '大驛土', '己酉': '大驛土', '庚戌': '釵釧金', '辛亥': '釵釧金',
    '壬子': '桑柘木', '癸丑': '桑柘木', '甲寅': '大溪水', '乙卯': '大溪水', '丙辰': '沙中土', '丁巳': '沙中土',
    '戊午': '天上火', '己未': '天上火', '庚申': '石榴木', '辛酉': '石榴木', '壬戌': '大海水', '癸亥': '大海水'
};

const ZODIAC_TO_BRANCH = {
    鼠: '子', 牛: '丑', 虎: '寅', 兔: '卯', 龍: '辰', 蛇: '巳',
    馬: '午', 羊: '未', 猴: '申', 雞: '酉', 狗: '戌', 豬: '亥'
};

const BRANCH_TO_ZODIAC = {
    子: '鼠', 丑: '牛', 寅: '虎', 卯: '兔', 辰: '龍', 巳: '蛇',
    午: '馬', 未: '羊', 申: '猴', 酉: '雞', 戌: '狗', 亥: '豬'
};

const SIX_HARMONY_PAIRS = {
    '鼠-牛': { element: '土', desc: '子丑合化土。鼠的機靈配上牛的踏實，互補型佳偶。鼠提供靈感，牛負責落地。' },
    '虎-豬': { element: '木', desc: '寅亥合化木。虎的霸氣遇上豬的溫柔，剛柔並濟。豬能包容虎的脾氣。' },
    '兔-狗': { element: '火', desc: '卯戌合化火。兔的細膩遇到狗的忠誠，相知相守。兩人都很重感情。' },
    '龍-雞': { element: '金', desc: '辰酉合化金。龍的遠見配上雞的精細，互相欣賞。是彼此的頭號粉絲。' },
    '蛇-猴': { element: '水', desc: '巳申合化水。蛇的深沉遇上猴的靈動，棋逢對手。精神層面很契合。' },
    '馬-羊': { element: '土', desc: '午未合化土。馬的熱情遇上羊的溫順，溫暖相伴。天生一對歡喜冤家。' }
};

const THREE_HARMONY_PAIRS = {
    '猴-鼠': { group: '申子辰水局', desc: '水上雙子，默契滿分。都是聰明人，溝通零障礙。' },
    '猴-龍': { group: '申子辰水局', desc: '靈猴配神龍，互相激發創造力。做情侶做搭檔都強。' },
    '鼠-龍': { group: '申子辰水局', desc: '鼠的精細配上龍的格局，小處大處都能打配合。' },
    '虎-馬': { group: '寅午戌火局', desc: '熱情碰撞，生活不會無聊。行動力爆表的一對。' },
    '虎-狗': { group: '寅午戌火局', desc: '虎的霸氣配上狗的忠義，義氣相投的伴侶。' },
    '馬-狗': { group: '寅午戌火局', desc: '馬的自由加上狗的守候，一個跑一個等，最終殊途同歸。' },
    '蛇-雞': { group: '巳酉丑金局', desc: '精英組合，審美一致。兩人都追求完美。' },
    '蛇-牛': { group: '巳酉丑金局', desc: '蛇的智慧配上牛的勤懇，悶聲發大財型情侶。' },
    '雞-牛': { group: '巳酉丑金局', desc: '雞的條理配上牛的穩定，日子過得井井有條。' },
    '豬-兔': { group: '亥卯未木局', desc: '溫柔鄉裡兩顆心，歲月靜好型配對。' },
    '豬-羊': { group: '亥卯未木局', desc: '兩個溫和的靈魂，生活中充滿善意和體貼。' },
    '兔-羊': { group: '亥卯未木局', desc: '兔的優雅遇上羊的浪漫，文藝清新型戀人。' }
};

const SIX_CONFLICT_PAIRS = {
    '鼠-馬': { desc: '子午相沖，水火交戰。鼠重細節，馬重自由；鼠慢熱，馬奔放。', fix: '給彼此空間，尊重差異。中間人/生肖：虎（三合馬，與鼠不沖）' },
    '牛-羊': { desc: '丑未相沖，同氣相斥。都較固執，容易冷戰。', fix: '學會主動低頭，輪流讓步。中間人/生肖：蛇或雞（三合牛）' },
    '虎-猴': { desc: '寅申相沖，金木交戰。虎直接，猴靈活；都愛主導。', fix: '明確分工，不要搶同一個方向盤。中間人/生肖：鼠（三合猴）' },
    '兔-雞': { desc: '卯酉相沖，金木相剋。兔感性，雞理性；節奏不同頻。', fix: '多做對方喜歡的事，用行動彌補頻率差。中間人/生肖：牛或蛇（三合雞）' },
    '龍-狗': { desc: '辰戌相沖，同性相斥。都有主見，容易較勁。', fix: '分清「大事」和「小事」，小事讓步大事商量。' },
    '蛇-豬': { desc: '巳亥相沖，水火交戰。蛇深沉，豬直爽；猜疑 vs 透明。', fix: '保持坦誠溝通，減少內心戲。中間人/生肖：兔或羊（三合豬）' }
};

const SIX_HARM_PAIRS = {
    '鼠-羊': { desc: '子未相害。關心方式不被對方接受。', fix: '多問對方需要什麼，不要自以為好地付出。' },
    '牛-馬': { desc: '丑午相害。節奏不一致，牛慢馬快。', fix: '找到雙方都舒適的節奏，不強求同步。' },
    '虎-蛇': { desc: '寅巳相害。好意容易被誤解。', fix: '表達時注意方式，減少誤解空間。' },
    '兔-龍': { desc: '卯辰相害。小事容易積累矛盾。', fix: '及時溝通小問題，不要積壓心裡。' },
    '申-亥': { desc: '申亥相害。信任容易出裂痕。', fix: '建立透明溝通機制，不要讓對方猜。' },
    '酉-戌': { desc: '酉戌相害。表面和諧暗有分歧。', fix: '定期深入交流，坦率說出想法。' }
};

// 輔助：根據年份或生肖字串取得生肖
function zodiacFromYear(year) {
    if (typeof year === 'string' && ZODIACS.includes(year)) return year;
    const num = Number(year);
    if (!Number.isInteger(num)) return '鼠';
    return ZODIACS[(num - 4 + 12000) % 12];
}

// 輔助：八字排盤轉換
function parseBaziSimple(input) {
    if (!input || !input.date) return null;
    const [y, m, d] = input.date.split('-').map(Number);
    const hour = input.time ? Number(input.time.split(':')[0]) : 12;
    const minute = input.time ? Number(input.time.split(':')[1]) : 0;
    try {
        const lunar = input.calendar === 'lunar'
            ? Lunar.fromYmd(y, input.leap ? -m : m, d).getSolar().getLunar()
            : Solar.fromYmdHms(y, m, d, hour, minute, 0).getLunar();
        const eight = lunar.getEightChar();
        const yearGanZhi = eight.getYear();
        const monthGanZhi = eight.getMonth();
        const dayGanZhi = eight.getDay();
        const timeGanZhi = eight.getTime();

        const fourPillars = [
            { label: '年柱', value: yearGanZhi, stem: yearGanZhi[0], branch: yearGanZhi[1], nayin: NAYIN_TABLE[yearGanZhi] || '' },
            { label: '月柱', value: monthGanZhi, stem: monthGanZhi[0], branch: monthGanZhi[1], nayin: NAYIN_TABLE[monthGanZhi] || '' },
            { label: '日柱', value: dayGanZhi, stem: dayGanZhi[0], branch: dayGanZhi[1], nayin: NAYIN_TABLE[dayGanZhi] || '' },
            { label: '時柱', value: timeGanZhi, stem: timeGanZhi[0], branch: timeGanZhi[1], nayin: NAYIN_TABLE[timeGanZhi] || '' }
        ];

        const dayMaster = { stem: dayGanZhi[0], element: STEM_ELEMENT[dayGanZhi[0]] };
        const counts = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
        fourPillars.forEach(p => {
            counts[STEM_ELEMENT[p.stem]] = (counts[STEM_ELEMENT[p.stem]] || 0) + 1;
            counts[BRANCH_ELEMENT[p.branch]] = (counts[BRANCH_ELEMENT[p.branch]] || 0) + 1;
        });

        return {
            lunar: lunar.toString(),
            fourPillars,
            dayMaster,
            spousePalace: dayGanZhi[1],
            fiveElements: { counts, total: Object.values(counts).reduce((a, b) => a + b, 0) },
            yearZodiac: BRANCH_TO_ZODIAC[yearGanZhi[1]] || '鼠'
        };
    } catch (e) {
        return null;
    }
}

// 1. 求籤問姻緣 (100籤)
function drawFortuneStick(question = '', name = '', seedInput = null, stickNum = null) {
    if (typeof question === 'object' && question !== null) {
        const opt = question;
        question = opt.question || '';
        name = opt.name || '';
        seedInput = opt.seed || null;
        stickNum = opt.stickNum || opt.number || null;
    }
    let finalSeed = seedInput;
    let index = 0;
    if (stickNum !== null && stickNum !== undefined && stickNum !== '') {
        const num = Number(stickNum);
        if (Number.isInteger(num) && num >= 1 && num <= 100) {
            index = num - 1;
            finalSeed = `stick-${num}`;
        }
    } else if (!finalSeed) {
        if (question || name) {
            finalSeed = `seed-${question}-${name}`;
            let charSum = 0;
            const str = String(name) + String(question);
            for (let i = 0; i < str.length; i++) {
                charSum += str.charCodeAt(i);
            }
            index = charSum % 100;
        } else {
            finalSeed = crypto.randomBytes(16).toString('hex');
            index = crypto.createHash('sha256').update(finalSeed).digest().readUInt32BE(0) % 100;
        }
    } else {
        index = crypto.createHash('sha256').update(String(finalSeed)).digest().readUInt32BE(0) % 100;
    }

    const stick = fortuneSticksData[index] || fortuneSticksData[0];
    const spiritualIndex = 70 + (crypto.createHash('sha256').update(`${finalSeed}:spirit`).digest().readUInt32BE(0) % 26);

    return {
        number: stick.number,
        title: stick.title,
        grade: stick.grade,
        poem: stick.poem,
        explanation: stick.explanation,
        reading: stick.reading,
        spiritualIndex: `${spiritualIndex}%`,
        guidance: '心誠則靈，同一問題今日不宜再簽，給緣分一點時間。',
        seed: finalSeed
    };
}

// 2. 生肖配對
function zodiacMatch(firstInput, secondInput) {
    const z1 = zodiacFromYear(firstInput);
    const z2 = zodiacFromYear(secondInput);
    const pair1 = `${z1}-${z2}`;
    const pair2 = `${z2}-${z1}`;

    let matchType = '普通配對';
    let score = 70;
    let detail = '價值觀各有所長，無明顯衝突亦無天然合局，感情好壞完全取決於雙方的用心經營與真誠溝通。';
    let fixAdvice = '平日多傾聽、創造共同話題與回憶，感情自然長久穩定。';
    let sweetness = 72;
    let conflict = 38;
    let longevity = 75;

    if (SIX_HARMONY_PAIRS[pair1] || SIX_HARMONY_PAIRS[pair2]) {
        const item = SIX_HARMONY_PAIRS[pair1] || SIX_HARMONY_PAIRS[pair2];
        matchType = '⭐⭐⭐⭐⭐ 六合（天作之合）';
        score = 88;
        detail = item.desc;
        fixAdvice = '底子極好，但也不要因為天然契合而忽略日常表達，保持彼此的專屬儀式感。';
        sweetness = 95;
        conflict = 15;
        longevity = 96;
    } else if (THREE_HARMONY_PAIRS[pair1] || THREE_HARMONY_PAIRS[pair2]) {
        const item = THREE_HARMONY_PAIRS[pair1] || THREE_HARMONY_PAIRS[pair2];
        matchType = `⭐⭐⭐⭐ 三合（${item.group}）`;
        score = 85;
        detail = item.desc;
        fixAdvice = '步調一致、互相成就，遇到重大決定時多商量即可如虎添翼。';
        sweetness = 88;
        conflict = 25;
        longevity = 89;
    } else if (SIX_CONFLICT_PAIRS[pair1] || SIX_CONFLICT_PAIRS[pair2]) {
        const item = SIX_CONFLICT_PAIRS[pair1] || SIX_CONFLICT_PAIRS[pair2];
        matchType = '⭐⭐ 六沖（性格激盪）';
        score = 52;
        detail = item.desc;
        fixAdvice = item.fix;
        sweetness = 65;
        conflict = 72;
        longevity = 60;
    } else if (SIX_HARM_PAIRS[pair1] || SIX_HARM_PAIRS[pair2]) {
        const item = SIX_HARM_PAIRS[pair1] || SIX_HARM_PAIRS[pair2];
        matchType = '⭐⭐⭐ 六害（暗藏磨合）';
        score = 60;
        detail = item.desc;
        fixAdvice = item.fix;
        sweetness = 68;
        conflict = 55;
        longevity = 66;
    } else if (z1 === z2) {
        matchType = '⭐⭐⭐ 同生肖相聚';
        score = 75;
        detail = '同生肖價值觀相似，容易共鳴；但也容易有相似的盲點或脾氣。';
        fixAdvice = '遇到意見分歧時，避免硬碰硬，換位思考能化解許多不必要的執著。';
        sweetness = 76;
        conflict = 42;
        longevity = 78;
    }

    return {
        first: { zodiac: z1, input: firstInput },
        second: { zodiac: z2, input: secondInput },
        relationship: matchType,
        score,
        sweetness: `${sweetness}%`,
        conflict: `${conflict}%`,
        longevity: `${longevity}%`,
        detail,
        fixAdvice,
        summary: `【${z1} ✕ ${z2}】${matchType}。契合指數：${score}分。${detail} 建議：${fixAdvice}`
    };
}

const { calculateZiweiChart } = require('./ziwei');

// 3. 紫微夫妻宮 (真實排盤)
function ziweiMarriage(input = {}) {
    const date = input.date || input.birthDate;
    if (!date) throw new Error('請提供出生日期（YYYY-MM-DD）以排定紫微夫妻宮');
    const ziweiChart = calculateZiweiChart({ ...input, date });

    const spousePalace = ziweiChart.palaces.find((p) => p.name === '夫妻宮') || ziweiChart.palaces[2];
    const spouseBranch = spousePalace.branch;
    const majorStars = spousePalace.stars.filter((s) => s.type === 'major');
    const auxStars = spousePalace.stars.filter((s) => s.type !== 'major');

    const STAR_INTERPRETATIONS = {
        紫微: { trait: '配偶有氣質、有主見、自尊心強且略帶貴氣', mode: '重視精神共鳴與尊重，期望伴侶是優秀有擔當的強者', challenge: '雙方都太有主見時容易較勁，需學會輪流作主與包容', advice: '找一個你真心佩服的人，彼此欣賞、相敬如賓。' },
        天機: { trait: '聰明靈活、思維敏捷、擅長溝通但略帶神經質', mode: '喜歡智性戀，容易被對方的頭腦、談吐與才華吸引', challenge: '思慮過多容易猶豫不決，感情中需要多一點果斷與信任', advice: '別把感情當算術題反覆權衡，跟隨心靈的直覺走。' },
        太陽: { trait: '熱情開朗、樂於助人、光明磊落有擔當', mode: '光明正大的戀愛，不喜曖昧，願意為伴侶無私付出', challenge: '付出太多容易心累，需學會平衡自我需求與接受關愛', advice: '找一個懂得心疼你付出的人，把光芒留給彼此。' },
        武曲: { trait: '務實能幹、財務觀念強、性格剛毅果斷', mode: '重行動輕言語，用踏實的物質保障與責任表達愛意', challenge: '過於務實理性可能缺少浪漫情調或顯得強勢', advice: '在穩健踏實的柴米油鹽裡，偶爾製造一些浪漫驚喜。' },
        天同: { trait: '溫和善良、知足常樂、童心未泯有文藝氣質', mode: '追求和諧舒適且少衝突的關係，重視生活情趣', challenge: '過於隨和容易逃避矛盾，缺乏面對現實風浪的魄力', advice: '溫柔是優點，但在關鍵原則問題上要堅定底線。' },
        廉貞: { trait: '性格鮮明、魅力獨具、愛恨分明且交際力佳', mode: '感情濃烈深沉，對情感要求純粹且具強烈吸引力', challenge: '占有欲或敏感情緒容易引發誤解與摩擦', advice: '信任是關係的基石，學會給彼此適度的個人空間。' },
        天府: { trait: '穩重可靠、善於理財、重家庭與生活品質', mode: '追求穩定長久的承諾與富足安穩的家庭環境', challenge: '生活作風可能過於保守或缺少激情變化', advice: '在踏實守成中加入小冒險，打破日常例行公式。' },
        太陰: { trait: '溫柔細膩、重視感情、審美品味高且體貼入微', mode: '深情的浪漫主義者，注重心靈交流與情感細節', challenge: '內心敏感脆弱容易受傷，情緒起伏考驗關係', advice: '找一個情緒穩定成熟的伴侶，給予彼此充實的安全感。' },
        貪狼: { trait: '多才多藝、幽默風趣、異性緣佳且富生活情趣', mode: '魅力四射，感情經歷生動豐富，追求新鮮與浪漫', challenge: '外界誘惑或人際交際較多，需要認定心中唯一', advice: '桃花旺是魅力天賦，關鍵在於認定一人、擇一而終。' },
        巨門: { trait: '口才出眾、洞察力敏銳、求真務實且心思縝密', mode: '重視深層次的深度溝通與知心理解', challenge: '言語過於直白犀利容易無意中傷人，易生猜疑', advice: '溝通是雙刃劍，學會溫柔且包容地表達愛意。' },
        天相: { trait: '注重形象、善於協調、得體大方有教養', mode: '追求相敬如賓的和諧伴侶關係，注重門當戶對與外在形象', challenge: '太在意外界眼光或表面和諧而壓抑內心真實感受', advice: '做真實的自己，不要為了維持完美表象而委屈內心。' },
        天梁: { trait: '正直善良、有長輩緣、成熟穩重如良師益友', mode: '互相扶持成長，重視伴侶的人品與道德底線', challenge: '容易過於說教或嚴肅，缺少熱戀時的輕鬆熱情', advice: '偶爾卸下成熟防備，享受被呵護被寵愛的感覺。' },
        七殺: { trait: '個性獨立、有冒險精神、果敢利落敢愛敢恨', mode: '轟轟烈烈的真摯愛情，不喜拖泥帶水與虛情假意', challenge: '個性強烈固執容易產生正面碰撞與爭執', advice: '找一個你能真心佩服與信任的人，把鋒芒化為彼此的守護。' },
        破軍: { trait: '有魄力、敢破敢立、不循常規且富有開創力', mode: '感情波瀾壯闊，敢於打破傳統束縛追求所愛', challenge: '情緒與生活變動較大，需要學會穩固維繫感情', advice: '在成熟與沉澱之後，你的正緣將無比堅定深厚。' }
    };

    let mainStarName = '天相';
    let interp = STAR_INTERPRETATIONS['天相'];

    if (majorStars.length > 0) {
        mainStarName = majorStars.map((s) => s.name).join('、');
        interp = STAR_INTERPRETATIONS[majorStars[0].name] || STAR_INTERPRETATIONS['天相'];
    } else {
        mainStarName = '借對宮主星（無主星）';
        interp = {
            trait: '感情隨和適應力強，伴侶特質多元易受外界與環境影響',
            mode: '重視陪伴與默契，容易配合伴侶的生活步調',
            challenge: '自身定位不明確時容易在關係中迷失方向',
            advice: '先明確自己想要的人生方向，再尋找同頻共振的伴侶。'
        };
    }

    const sihuaStars = spousePalace.stars.filter((s) => s.sihua);
    const sihuaText = sihuaStars.length > 0
        ? sihuaStars.map((s) => `${s.name}化${s.sihua}`).join('、')
        : '本宮無生年四化星（氣息平穩）';

    return {
        spousePalace: spouseBranch,
        palaceGanzhi: spousePalace.ganzhi,
        mainStar: mainStarName,
        majorStars: majorStars.map((s) => `${s.name}(${s.brightness || '平'})`),
        auxStars: auxStars.map((s) => s.name),
        trait: interp.trait,
        relationshipMode: interp.mode,
        challenge: interp.challenge,
        advice: interp.advice,
        fourTransformations: sihuaText,
        summary: `夫妻宮位於【${spousePalace.ganzhi} / ${spouseBranch}宮】，主星為【${mainStarName}】，四化為【${sihuaText}】。配偶特質傾向：${interp.trait}。月老建議：${interp.advice}`
    };
}

// 4. 桃花運勢
function peachBlossomLuck(inputYear, status = '單身', scope = '2026年度') {
    const zodiac = zodiacFromYear(inputYear);
    const PEACH_DIRECTIONS = {
        虎: { dir: '正東 (卯)', branch: '卯', element: '木', desc: '東方遇桃花，充滿活力與社交機遇。' },
        馬: { dir: '正東 (卯)', branch: '卯', element: '木', desc: '東方遇桃花，熱情直率，行動力強。' },
        狗: { dir: '正東 (卯)', branch: '卯', element: '木', desc: '東方遇桃花，忠誠可靠，緣分常現於共同圈子。' },
        猴: { dir: '正西 (酉)', branch: '酉', element: '金', desc: '西方遇桃花，講究精緻，易遇優秀知性對象。' },
        鼠: { dir: '正西 (酉)', branch: '酉', element: '金', desc: '西方遇桃花，靈動細膩，心有靈犀。' },
        龍: { dir: '正西 (酉)', branch: '酉', element: '金', desc: '西方遇桃花，大氣從容，易得貴人撮合。' },
        蛇: { dir: '正南 (午)', branch: '午', element: '火', desc: '南方遇桃花，熱烈真誠，魅力四射。' },
        雞: { dir: '正南 (午)', branch: '午', element: '火', desc: '南方遇桃花，精緻出眾，容易吸引目光。' },
        牛: { dir: '正南 (午)', branch: '午', element: '火', desc: '南方遇桃花，溫厚踏實，漸入佳境。' },
        豬: { dir: '正北 (子)', branch: '子', element: '水', desc: '北方遇桃花，溫柔體貼，浪漫感性。' },
        兔: { dir: '正北 (子)', branch: '子', element: '水', desc: '北方遇桃花，優雅知性，歲月靜好。' },
        羊: { dir: '正北 (子)', branch: '子', element: '水', desc: '北方遇桃花，溫順體貼，善解人意。' }
    };

    const info = PEACH_DIRECTIONS[zodiac] || PEACH_DIRECTIONS['馬'];

    const MONTH_LUCK = {
        鼠: { best: ['農曆七月(申月)', '農曆八月(酉月)', '農曆十二月(丑月)'], rest: '農曆五月(午月)' },
        牛: { best: ['農曆四月(巳月)', '農曆八月(酉月)', '農曆十一月(子月)'], rest: '農曆六月(未月)' },
        虎: { best: ['農曆五月(午月)', '農曆九月(戌月)', '農曆十月(亥月)'], rest: '農曆七月(申月)' },
        兔: { best: ['農曆二月(卯月)', '農曆六月(未月)', '農曆十月(亥月)'], rest: '農曆八月(酉月)' },
        龍: { best: ['農曆四月(巳月)', '農曆八月(申月)', '農曆十一月(子月)'], rest: '農曆九月(戌月)' },
        蛇: { best: ['農曆三月(辰月)', '農曆七月(申月)', '農曆十一月(子月)'], rest: '農曆十月(亥月)' },
        馬: { best: ['農曆正月(寅月)', '農曆六月(未月)', '農曆十月(戌月)'], rest: '農曆十一月(子月)' },
        羊: { best: ['農曆二月(卯月)', '農曆七月(午月)', '農曆十月(亥月)'], rest: '農曆十二月(丑月)' },
        猴: { best: ['農曆四月(巳月)', '農曆八月(酉月)', '農曆十一月(子月)'], rest: '農曆正月(寅月)' },
        雞: { best: ['農曆三月(辰月)', '農曆九月(戌月)', '農曆十二月(丑月)'], rest: '農曆二月(卯月)' },
        狗: { best: ['農曆正月(寅月)', '農曆五月(午月)', '農曆二月(卯月)'], rest: '農曆三月(辰月)' },
        豬: { best: ['農曆二月(卯月)', '農曆六月(未月)', '農曆正月(寅月)'], rest: '農曆四月(巳月)' }
    }[zodiac] || { best: ['春季(二~四月)', '秋季(八~十月)'], rest: '冬季' };

    return {
        zodiac,
        status,
        scope,
        favorableDirection: info.dir,
        peachBranch: info.branch,
        nature: '正緣桃花星動',
        bestMonths: MONTH_LUCK.best,
        cautionMonth: MONTH_LUCK.rest,
        luckyTips: `可在臥室【${info.dir}】擺放水生植物或粉水晶，穿著溫暖柔和色系，有助於催旺正緣磁場。`,
        summary: `生肖屬【${zodiac}】，本命桃花位在【${info.dir}】。目前狀態【${status}】，今年桃花能量整體向好，最旺月份為 ${MONTH_LUCK.best.join('、')}。`
    };
}

// 5. 八字合婚
function baziMatchFull(firstInput, secondInput) {
    const c1 = parseBaziSimple(firstInput);
    const c2 = parseBaziSimple(secondInput);

    if (!c1 || !c2) {
        // Fallback to zodiac match if incomplete
        const zRes = zodiacMatch(firstInput?.firstYear || firstInput?.date || 1990, secondInput?.secondYear || secondInput?.date || 1991);
        return {
            mode: 'zodiac-fallback',
            ...zRes
        };
    }

    const y1 = c1.fourPillars[0];
    const y2 = c2.fourPillars[0];
    const d1 = c1.fourPillars[2];
    const d2 = c2.fourPillars[2];

    // 年柱分析
    const stemHarmonies = new Set(['甲己', '己甲', '乙庚', '庚乙', '丙辛', '辛丙', '丁壬', '壬丁', '戊癸', '癸戊']);
    const yearStemMatch = stemHarmonies.has(`${y1.stem}${y2.stem}`);
    const zPair = `${c1.yearZodiac}-${c2.yearZodiac}`;
    const yearBranchMatch = SIX_HARMONY_PAIRS[zPair] || SIX_HARMONY_PAIRS[`${c2.yearZodiac}-${c1.yearZodiac}`] ? '六合' :
        THREE_HARMONY_PAIRS[zPair] || THREE_HARMONY_PAIRS[`${c2.yearZodiac}-${c1.yearZodiac}`] ? '三合' :
        SIX_CONFLICT_PAIRS[zPair] || SIX_CONFLICT_PAIRS[`${c2.yearZodiac}-${c1.yearZodiac}`] ? '六沖' : '相安';

    // 日柱天干五合或生剋
    const dayStemPair = `${d1.stem}${d2.stem}`;
    const dayStemHarmony = stemHarmonies.has(dayStemPair);
    const e1 = c1.dayMaster.element;
    const e2 = c2.dayMaster.element;
    const GENERATE = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' };
    const CONTROL = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' };

    let dayRelation = '比肩平合';
    if (dayStemHarmony) dayRelation = '天干五合（天賜良緣、心靈相吸）';
    else if (GENERATE[e1] === e2) dayRelation = `一方五行生旺另一方（${e1}生${e2}，溫柔包容）`;
    else if (GENERATE[e2] === e1) dayRelation = `得到對方的滋養與照顧（${e2}生${e1}，安全感足）`;
    else if (CONTROL[e1] === e2 || CONTROL[e2] === e1) dayRelation = '五行相制（棋逢對手，需多坦誠溝通）';

    // 五行互補計算
    const counts1 = c1.fiveElements.counts;
    const counts2 = c2.fiveElements.counts;
    let complementScore = 70;
    ['木', '火', '土', '金', '水'].forEach(el => {
        if ((counts1[el] === 0 && counts2[el] >= 2) || (counts2[el] === 0 && counts1[el] >= 2)) {
            complementScore += 6;
        }
    });
    complementScore = Math.min(complementScore, 98);

    // 總分計算
    let totalScore = 65;
    if (yearStemMatch) totalScore += 8;
    if (yearBranchMatch === '六合') totalScore += 12;
    else if (yearBranchMatch === '三合') totalScore += 8;
    else if (yearBranchMatch === '六沖') totalScore -= 8;

    if (dayStemHarmony) totalScore += 15;
    else if (dayRelation.includes('生')) totalScore += 8;

    if (y1.nayin === y2.nayin) totalScore += 5;

    totalScore = Math.max(45, Math.min(totalScore, 96));

    let grade = '佳偶天成';
    if (totalScore >= 90) grade = '天作之合（姻緣極深）';
    else if (totalScore >= 75) grade = '佳偶天成（互補有情）';
    else if (totalScore >= 60) grade = '尚可配對（需多磨合）';
    else grade = '需要用心經營（溝通為重）';

    return {
        first: { name: firstInput.name || '男方/甲方', dayMaster: c1.dayMaster, yearZodiac: c1.yearZodiac, fourPillars: c1.fourPillars, counts: counts1 },
        second: { name: secondInput.name || '女方/乙方', dayMaster: c2.dayMaster, yearZodiac: c2.yearZodiac, fourPillars: c2.fourPillars, counts: counts2 },
        yearPillarMatch: `年柱配對：${y1.value}(${y1.nayin}) ✕ ${y2.value}(${y2.nayin}) → ${yearBranchMatch}`,
        dayPillarMatch: `日柱互動：${d1.stem}[${e1}] ✕ ${d2.stem}[${e2}] → ${dayRelation}`,
        complementScore: `${complementScore}%`,
        score: totalScore,
        grade,
        summary: `【八字合婚結果】綜合評分：${totalScore}分（${grade}）。年柱${yearBranchMatch}，日柱呈現${dayRelation}，五行互補度達${complementScore}%。`
    };
}

// 6. 紅線測算 (正緣畫像與時間)
function redThreadFull(input) {
    const chart = parseBaziSimple(input);
    const spouseBranch = chart?.spousePalace || '午';
    const ziwei = ziweiMarriage(input);
    const peach = peachBlossomLuck(input?.date ? input.date.split('-')[0] : 1990, input?.status || '單身');

    const PROFILES = {
        子: { trait: '聰明靈巧、善於溝通、思維敏捷', appearance: '清秀靈動、眼神有神', career: '文創/科技/金融/專業顧問', scenario: '學習場合、朋友聚會或線上知心交流' },
        丑: { trait: '踏實穩重、責任感強、內斂專一', appearance: '端莊沉穩、氣質溫厚', career: '工程/管理/公職/專業技術', scenario: '工作合作、長輩介紹或穩定的社交場合' },
        寅: { trait: '熱情大方、有魄力與抱負、保護欲強', appearance: '身材挺拔、氣場陽光', career: '創業/商務/管理/體育', scenario: '戶外活動、商務會議或共同興趣小組' },
        卯: { trait: '溫柔細膩、文雅知性、體貼入微', appearance: '面容清秀、氣質儒雅優雅', career: '教育/藝術/設計/醫療心理', scenario: '文藝展覽、咖啡館、圖書館或校園' },
        辰: { trait: '有主見、格局開闊、自信大度', appearance: '大氣從容、五官立體', career: '領導管理/法務/科技', scenario: '行業峰會、大型社團或高端社交圈' },
        巳: { trait: '深沉內斂、洞察力強、有神秘感', appearance: '精緻幹練、穿著講究', career: '研究/金融/醫療/分析師', scenario: '專業研討會、靜態沙龍或老友重聚' },
        午: { trait: '熱情開朗、幽默風趣、行動力強', appearance: '陽光開朗、笑容感染力強', career: '行銷傳媒/公關/自由職業/文娛', scenario: '旅行途中、節慶聚會或熱鬧社交場合' },
        未: { trait: '溫和親切、重視家庭、善解人意', appearance: '親切溫婉、給人舒適安全感', career: '教育培訓/服務業/公益/人力資源', scenario: '日常生活圈、志工活動或溫馨聚餐' },
        申: { trait: '機智敏銳、幽默善談、應變能力強', appearance: '精神幹練、動作敏捷', career: '商務貿易/科技互聯網/媒體', scenario: '跨界交流會、出差合作或歡樂派對' },
        酉: { trait: '注重細節、審美水準高、自律體面', appearance: '五官精緻、儀態得體講究', career: '設計/時尚/法律/金融精算', scenario: '精緻聚會、藝術空間或同窗好友圈' },
        戌: { trait: '忠誠正直、有擔當、講義氣', appearance: '穩健大方、給人極高信任感', career: '工程技術/安全管理/公職人員', scenario: '熟人牽線、團隊合作或共同奮鬥歷程中' },
        亥: { trait: '善良包容、隨和感性、智慧通透', appearance: '隨和親切、氣質柔和', career: '學術文化/心理諮詢/傳媒藝術', scenario: '心靈讀書會、慢節奏旅行或知己牽線' }
    };

    const targetProfile = PROFILES[spouseBranch] || PROFILES['午'];
    const currentYear = new Date().getFullYear();

    return {
        spouseBranch,
        ziweiStar: ziwei.mainStar,
        favorableDirection: peach.favorableDirection,
        profile: {
            trait: targetProfile.trait,
            appearance: targetProfile.appearance,
            career: targetProfile.career,
            scenario: targetProfile.scenario,
            direction: peach.favorableDirection
        },
        timeWindows: {
            nearestRedThread: `${currentYear}年 下半年 ~ ${currentYear + 1}年 上半年`,
            goldenMarriageYears: `${currentYear + 1}年 - ${currentYear + 2}年`
        },
        advice: '保持真實自信的狀態，多在吉祥方位參與自己熱愛的活動，正緣往往在你最放鬆發光的時刻悄然而至。',
        summary: `【紅線測算 · 正緣畫像】正緣特質：${targetProfile.trait}；外貌傾向：${targetProfile.appearance}；容易相遇於：${targetProfile.scenario}；吉祥方位：${peach.favorableDirection}。`
    };
}

module.exports = {
    drawFortuneStick,
    zodiacMatch,
    ziweiMarriage,
    peachBlossomLuck,
    baziMatchFull,
    redThreadFull,
    redThreadReading: redThreadFull,
    baziMatch: baziMatchFull,
    marriagePalace: ziweiMarriage,
    peachBlossom: peachBlossomLuck,
    zodiacFromYear,
    parseBaziSimple
};
