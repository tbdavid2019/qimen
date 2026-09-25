const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const dataDir = path.join(__dirname, '..', 'data', 'name-analysis');
const loadJson = (file) => JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf8'));
const loadGzipJson = (file) => JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(dataDir, file))).toString('utf8'));
const charData = loadGzipJson('chars.json.gz');
const defs = loadGzipJson('definitions.json.gz');
const structures = loadGzipJson('structure.json.gz');
const surnames = new Set(loadJson('surname-index.json').forms);
const numerology = new Map(loadJson('81-numerology.json').entries.map((row) => [row.number, row.classification]));
const methodManifest = loadJson('method-profiles.json');
const nameStyleProfiles = loadJson('name-style-profiles.json');
const nameCorpusProfile = loadJson('name-corpus-profile.json');
const curatedNameChars = [...new Set([...loadJson('curated-given-name-chars.json').characters])];
const curatedRank = new Map(curatedNameChars.map((char, index) => [char, index]));
const chars = charData.chars;
const DATA_VERSION = 'name-data-2026-09-v2';
const PROFILE = {
  taiwanKangxi: { id: 'taiwan-kangxi-v1', strokeField: 'kx', description: '康熙字典筆畫資料；缺值不補猜。' },
  modern: { id: 'modern-stroke-v1', strokeField: 'bs', description: '現代筆畫資料；缺值不補猜。' }
};
const isHan = (s) => /^\p{Script=Han}+$/u.test(s);
const digitElement = ['水', '木', '木', '火', '火', '土', '土', '金', '金', '水'];
const elemRelation = (a, b) => {
  const generates = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' };
  const controls = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' };
  if (!a || !b) return '資料不足';
  if (a === b) return '同氣';
  if (generates[a] === b) return '相生';
  if (generates[b] === a) return '受生';
  if (controls[a] === b) return '相克';
  return '受克';
};

function corpusStyleScore(counts, style, scale = 1) {
  if (!counts || !['feminine', 'masculine', 'neutral'].includes(style)) return 0;
  const male = Number(counts.m) || 0;
  const female = Number(counts.f) || 0;
  const support = male + female;
  if (!support) return 0;
  const logOdds = Math.log((female + 12) / (male + 12));
  const confidence = support / (support + 80);
  if (style === 'feminine') return Math.max(-1.7, Math.min(1.7, logOdds)) * 7 * confidence * scale;
  if (style === 'masculine') return Math.max(-1.7, Math.min(1.7, -logOdds)) * 7 * confidence * scale;
  return -Math.min(1.7, Math.abs(logOdds)) * 3 * confidence * scale;
}

function corpusNameEvidence(givenName, style) {
  const characters = [...givenName].map((char) => {
    const counts = nameCorpusProfile.characters[char] || { m: 0, f: 0, u: 0 };
    return { char, masculineExamples: counts.m, feminineExamples: counts.f, unknownGenderExamples: counts.u };
  });
  const firstPair = [...givenName].slice(0, 2).join('');
  const pairCounts = firstPair.length === 2 ? (nameCorpusProfile.pairs[firstPair] || { m: 0, f: 0, u: 0 }) : null;
  const characterScore = [...givenName].reduce((sum, char) => sum + corpusStyleScore(nameCorpusProfile.characters[char], style), 0);
  const pairScore = pairCounts ? corpusStyleScore(pairCounts, style, 0.8) : 0;
  return {
    score: Math.round((characterScore + pairScore) * 100) / 100,
    characters,
    firstPair: pairCounts ? { pair: firstPair, masculineExamples: pairCounts.m, feminineExamples: pairCounts.f, unknownGenderExamples: pairCounts.u } : null,
    source: nameCorpusProfile.source.name
  };
}

function candidatesFor(name) {
  const candidates = [];
  const points = [...name];
  for (let i = 1; i < points.length; i++) {
    const surname = points.slice(0, i).join('');
    if (surnames.has(surname)) candidates.push({ surname, givenName: points.slice(i).join('') });
  }
  return candidates.sort((a, b) => b.surname.length - a.surname.length);
}

function validateInput(input, mode = 'verify') {
  if (!input || typeof input !== 'object') throw Object.assign(new Error('請提供有效的 JSON 物件'), { code: 'INVALID_INPUT', statusCode: 400 });
  const name = String(input.name || '').normalize('NFC').trim();
  if (!isHan(name) || [...name].length < 2 || [...name].length > 8) throw Object.assign(new Error('姓名須為 2 至 8 個漢字'), { code: 'INVALID_NAME', statusCode: 400 });
  const explicit = input.surname == null ? '' : String(input.surname).normalize('NFC').trim();
  if (explicit && (!isHan(explicit) || [...explicit].length >= [...name].length || !name.startsWith(explicit))) throw Object.assign(new Error('姓氏須為姓名開頭的漢字，且保留至少一個名字字'), { code: 'INVALID_SURNAME', statusCode: 400 });
  const segments = explicit ? [{ surname: explicit, givenName: [...name].slice([...explicit].length).join('') }] : candidatesFor(name);
  if (!segments.length) throw Object.assign(new Error('字庫無法判斷姓氏，請明確輸入姓氏'), { code: 'SURNAME_REQUIRED', statusCode: 400 });
  const choice = input.surname ? segments[0] : segments[0];
  const ambiguity = !explicit && segments.length > 1;
  const profileName = input.profile || 'taiwanKangxi';
  if (!PROFILE[profileName]) throw Object.assign(new Error('profile 僅支援 taiwanKangxi 或 modern'), { code: 'INVALID_PROFILE', statusCode: 400 });
  return { name, ...choice, explicit: Boolean(explicit), alternatives: ambiguity ? segments : [], ambiguity, profile: PROFILE[profileName], profileName, mode };
}

function characterInfo(char, profile) {
  const row = chars[char];
  const aliasTarget = charData.alias?.[char] || null;
  if (!row) return { char, known: false, variant: Boolean(aliasTarget), aliasTarget, stroke: null, kangxiStroke: null, modernStroke: null, pinyin: null, radical: null, element: null, definition: null, structure: null };
  return {
    char, known: true, variant: Boolean(aliasTarget), aliasTarget, stroke: Number.isInteger(row[profile.strokeField]) ? row[profile.strokeField] : null,
    kangxiStroke: Number.isInteger(row.kx) ? row.kx : null, modernStroke: Number.isInteger(row.bs) ? row.bs : null,
    pinyin: row.py || null, radical: row.rad || null, element: row.wx || null,
    definition: defs[char] || null, structure: structures[char] || null
  };
}

function wrap81(n) { return ((n - 1) % 81) + 1; }
function analyzeName(input) {
  const parsed = validateInput(input);
  const { name, surname, givenName, profile, profileName } = parsed;
  const charsInfo = [...name].map((char) => characterInfo(char, profile));
  const missing = charsInfo.filter((c) => !c.known || c.stroke == null).map((c) => c.char);
  const strokeList = [...name].map((char) => characterInfo(char, profile).stroke);
  const complete = strokeList.every(Number.isInteger);
  const family = [...surname].map((c) => characterInfo(c, profile).stroke);
  const given = [...givenName].map((c) => characterInfo(c, profile).stroke);
  const traditional = profileName === 'taiwanKangxi';
  const extended = [...givenName].length > 2;
  const grids = complete && !parsed.ambiguity ? {
    heaven: family.reduce((a, b) => a + b, 0) + (family.length === 1 ? 1 : 0),
    person: family[family.length - 1] + given[0],
    earth: given.reduce((a, b) => a + b, 0) + (given.length === 1 ? 1 : 0),
    outer: (family.reduce((a, b) => a + b, 0) + (family.length === 1 ? 1 : 0)) + (given.reduce((a, b) => a + b, 0) + (given.length === 1 ? 1 : 0)) - (family[family.length - 1] + given[0]),
    total: wrap81(strokeList.reduce((a, b) => a + b, 0))
  } : null;
  const gridResult = grids && Object.fromEntries(Object.entries(grids).map(([key, number]) => {
    const lookup = wrap81(number);
    return [key, { number, lookupNumber: lookup, classification: numerology.get(lookup) || null, element: digitElement[lookup % 10] }];
  }));
  const talents = gridResult ? {
    heavenPerson: { elements: [gridResult.heaven.element, gridResult.person.element], relation: elemRelation(gridResult.heaven.element, gridResult.person.element) },
    personEarth: { elements: [gridResult.person.element, gridResult.earth.element], relation: elemRelation(gridResult.person.element, gridResult.earth.element) }
  } : null;
  const result = {
    name, surname: parsed.ambiguity ? null : surname, givenName: parsed.ambiguity ? null : givenName, segmentation: { explicit: Boolean(parsed.explicit), ambiguous: parsed.ambiguity, alternatives: parsed.alternatives },
    profile: { ...profile, dataVersion: DATA_VERSION, extendedLongGivenName: extended, methodLabel: extended ? '姓名學五格對三字以上名字的延伸算法；流派口徑不一' : '傳統五格常見算法' },
    methods: {
      segmentation: methodManifest.sharedMethods.surnameSegmentation,
      fiveGrid: { id: `${traditional ? 'taiwan-kangxi' : 'modern-stroke'}-five-grid-v1`, source: 'method-profiles.json', extension: extended ? methodManifest.sharedMethods.longGivenNameExtension : null },
      numerology81: methodManifest.sharedMethods.numerology81,
      threeTalents: { id: `${traditional ? 'taiwan-kangxi' : 'modern-stroke'}-three-talents-v1`, source: 'method-profiles.json' },
      characterElements: methodManifest.sharedMethods.characterElements,
      characterReading: methodManifest.sharedMethods.characterReading
    },
    characters: charsInfo,
    fiveGrid: { available: Boolean(grids), method: traditional ? 'kangxi-strokes' : 'modern-strokes', values: gridResult, talents, notice: parsed.ambiguity ? '姓氏切分有歧義，請明確指定姓氏後再計算五格。' : (complete ? null : '部分字缺少此筆畫口徑，五格未計算。') },
    characterElements: charsInfo.map(({ char, element }) => ({ char, element, available: Boolean(element) })),
    pronunciation: charsInfo.map(({ char, pinyin }) => ({ char, pinyin })),
    dataQuality: { missingCharactersOrStrokes: [...new Set(missing)], unknownElementCharacters: charsInfo.filter((c) => !c.element).map((c) => c.char) },
    interpretation: '姓名數理與五行屬傳統文化參考，不代表可驗證的人生預測；請同時考量讀音、字義、書寫與個人偏好。'
  };
  if (input.baziLens) result.baziLens = attachBaziLens(result, input.baziLens);
  return result;
}

function attachBaziLens(nameResult, lens) {
  const usefulElements = Array.isArray(lens?.usefulElements) ? [...new Set(lens.usefulElements.filter((e) => ['木', '火', '土', '金', '水'].includes(e)))] : [];
  const matchingCharacters = nameResult.characters.filter((c) => c.element && usefulElements.includes(c.element)).map((c) => ({ char: c.char, element: c.element }));
  const countByElement = Object.fromEntries(usefulElements.map((element) => [element, matchingCharacters.filter((c) => c.element === element).length]));
  return {
    method: 'local-bazi-useful-element-alignment-v1',
    usefulElements,
    matchingCharacters,
    countByElement,
    summary: lens.summary || null,
    assumptions: lens.assumptions || {},
    notice: '此項只列出字庫所標五行與本地八字計算喜用五行的對照，不是適配分數或命運結論。八字喜用五行本身亦受算法與出生時間資料影響。'
  };
}

function generateNames(input) {
  const surname = String(input.surname || '').normalize('NFC').trim();
  const length = Number(input.givenNameLength || 2);
  if (!isHan(surname) || [...surname].length < 1 || [...surname].length > 3) throw Object.assign(new Error('請輸入 1 至 3 個漢字姓氏'), { code: 'INVALID_SURNAME', statusCode: 400 });
  if (!Number.isInteger(length) || length < 1 || length > 4) throw Object.assign(new Error('名字字數須為 1 至 4 個漢字'), { code: 'INVALID_GIVEN_NAME_LENGTH', statusCode: 400 });
  if (!PROFILE[input.profile || 'taiwanKangxi']) throw Object.assign(new Error('profile 僅支援 taiwanKangxi 或 modern'), { code: 'INVALID_PROFILE', statusCode: 400 });
  const limit = input.limit == null ? 20 : Number(input.limit);
  if (!Number.isInteger(limit) || limit < 1 || limit > 50) throw Object.assign(new Error('候選數量 limit 須為 1 至 50'), { code: 'INVALID_LIMIT', statusCode: 400 });
  const requestedStyle = input.nameStyle || 'auto';
  if (!['auto', 'feminine', 'masculine', 'neutral'].includes(requestedStyle)) throw Object.assign(new Error('nameStyle 僅支援 auto、feminine、masculine 或 neutral'), { code: 'INVALID_NAME_STYLE', statusCode: 400 });
  const inferredStyle = requestedStyle === 'auto'
    ? (input.birthData?.sex === '女' ? 'feminine' : input.birthData?.sex === '男' ? 'masculine' : 'neutral')
    : requestedStyle;
  const styleProfile = nameStyleProfiles.profiles[inferredStyle];
  const preferredStyleChars = new Set([...styleProfile.preferred]);
  const avoidedStyleChars = new Set([...styleProfile.avoid]);
  const stylePatternChars = styleProfile.patterns.map((pattern) => [...pattern]);
  const stylePatternPairs = new Set(stylePatternChars.flatMap((pattern) => pattern.slice(1).map((char, index) => pattern[index] + char)));
  const stylePatternStarts = new Set(stylePatternChars.map((pattern) => pattern[0]));
  const asCharList = (value) => {
    if (value == null) return [];
    if (typeof value === 'string') return [...value];
    if (Array.isArray(value)) return value;
    throw Object.assign(new Error('字詞條件須為漢字字串或陣列'), { code: 'INVALID_CHAR_CONSTRAINT', statusCode: 400 });
  };
  const include = [...new Set(asCharList(input.includeChars))];
  const exclude = new Set(asCharList(input.excludeChars));
  if ([...include, ...exclude].some((x) => typeof x !== 'string' || [...x].length !== 1 || !isHan(x))) throw Object.assign(new Error('指定字與排除字都須為單一漢字陣列'), { code: 'INVALID_CHAR_CONSTRAINT', statusCode: 400 });
  if (include.length > length) throw Object.assign(new Error('指定字數不可多於名字字數'), { code: 'TOO_MANY_REQUIRED_CHARS', statusCode: 400 });
  const excluded = new Set(exclude);
  if (input.desiredElements != null && !Array.isArray(input.desiredElements)) throw Object.assign(new Error('desiredElements 須為五行陣列'), { code: 'INVALID_ELEMENTS', statusCode: 400 });
  const desired = Array.isArray(input.desiredElements) ? input.desiredElements : (input.baziLens?.usefulElements || []);
  if (desired.some((element) => !['木', '火', '土', '金', '水'].includes(element))) throw Object.assign(new Error('desiredElements 僅支援木、火、土、金、水'), { code: 'INVALID_ELEMENTS', statusCode: 400 });
  const strokeField = PROFILE[input.profile || 'taiwanKangxi'].strokeField;
  const eligible = (char) => chars[char]?.src === 'b' && !excluded.has(char) && Number.isInteger(chars[char][strokeField]) && defs[char] && !input.excludeRadicals?.includes(chars[char].rad);
  const invalidIncluded = include.filter((char) => !eligible(char));
  if (invalidIncluded.length) throw Object.assign(new Error(`指定字不在符合所選筆畫口徑的可用字庫中：${invalidIncluded.join('、')}`), { code: 'INVALID_CHAR_CONSTRAINT', statusCode: 400 });
  const pool = [...new Set([...curatedNameChars, ...include])].filter(eligible);
  const ranked = [];
  let beam = [''];
  for (let i = 0; i < length; i++) {
    const next = [];
    const slotsAfterThis = length - i - 1;
    const width = Math.max(500, limit * 10);
    for (const prefix of beam) {
      for (const char of pool) {
        const row = chars[char];
        if (!row || excluded.has(char) || !Number.isInteger(row[strokeField]) || !defs[char]) continue;
        if (prefix.includes(char)) continue;
        const value = prefix + char;
        const missingRequired = include.filter((requiredChar) => !value.includes(requiredChar));
        if (missingRequired.length > slotsAfterThis) continue;
        const order = curatedRank.has(char) ? Math.max(0, 12 - curatedRank.get(char) / 12) : 0;
        const styleScore = (preferredStyleChars.has(char) ? 36 : avoidedStyleChars.has(char) ? -36 : 0) + (!prefix && stylePatternStarts.has(char) ? 200 : 0);
        const previous = [...prefix].at(-1);
        const patternScore = previous && stylePatternPairs.has(previous + char) ? 80 : 0;
        const corpusCharacterScore = corpusStyleScore(nameCorpusProfile.characters[char], inferredStyle);
        const corpusPairScore = prefix.length === 1 ? corpusStyleScore(nameCorpusProfile.pairs[prefix + char], inferredStyle, 0.8) : 0;
        const score = (desired.includes(row.wx) ? 20 : 0) + (row.wx ? 1 : 0) + order + styleScore + patternScore + corpusCharacterScore + corpusPairScore + (include.includes(char) ? 100 : 0);
        next.push({ value, score });
      }
    }
    beam = next.sort((a, b) => b.score - a.score || a.value.localeCompare(b.value, 'zh-Hant')).slice(0, width).map((x) => x.value);
  }
  for (const givenName of beam) {
    if (include.some((c) => !givenName.includes(c))) continue;
    const name = surname + givenName;
    try {
      const preferredStyleMatches = [...givenName].filter((char) => preferredStyleChars.has(char));
      const avoidedStyleMatches = [...givenName].filter((char) => avoidedStyleChars.has(char));
      const styleMatch = preferredStyleMatches.length - avoidedStyleMatches.length;
      const corpusEvidence = corpusNameEvidence(givenName, inferredStyle);
      ranked.push({ name, givenName, preferences: { matchedDesiredElements: [...new Set([...givenName].map((c) => chars[c]?.wx).filter((e) => e && desired.includes(e)))], curatedCharacterOrder: [...givenName].map((char) => curatedRank.has(char) ? curatedRank.get(char) : null), nameStyle: { id: inferredStyle, label: styleProfile.label, matchedCharacters: preferredStyleMatches, conflictingCharacters: avoidedStyleMatches, match: styleMatch, corpusScore: corpusEvidence.score, corpusEvidence } }, analysis: analyzeName({ name, surname, profile: input.profile || 'taiwanKangxi', baziLens: input.baziLens }) });
    } catch (_) {}
  }
  return { surname, givenNameLength: length, profile: input.profile || 'taiwanKangxi', nameStyle: { requested: requestedStyle, effective: inferredStyle, label: styleProfile.label, method: nameStyleProfiles.method, notice: `${nameStyleProfiles.notice} ${nameCorpusProfile.source.scope}` }, baziLens: input.baziLens ? { method: 'local-bazi-useful-element-alignment-v1', usefulElements: desired, summary: input.baziLens.summary || null, assumptions: input.baziLens.assumptions || {}, notice: '僅用來提高喜用五行相符字的排序；不代表命名適配分數或命運結論。' } : null, ranking: { method: 'curated-character-order-plus-editorial-style-plus-ccnc-character-and-bigram-evidence-v3', signals: ['獨立整理的姓名用字池順序', '可明確選擇的常見命名風格字表', 'CCNC 姓名語料的性別標記用字與首對名字字共現次數', '使用者指定五行偏好相符數'], corpus: { name: nameCorpusProfile.source.name, license: nameCorpusProfile.source.license, examples: nameCorpusProfile.totals.rows, notice: nameCorpusProfile.source.scope }, noObjectiveScore: true }, candidates: ranked.slice(0, limit), constraints: { includeChars: include, excludeChars: [...excluded], desiredElements: desired }, note: '姓名語料與命名風格只用來調整候選順序，不是性別判定或命名品質分數；候選只供命名參考，不構成命運判定。' };
}

function formatQuestionPrompt(result, question) {
  return { question: String(question || '請解讀這份姓名分析結果並提供實用命名建議。').slice(0, 1000), deterministicResult: result, instruction: '只解釋提供的計算結果與資料來源。不得推斷缺失的筆畫、字義或五行；須指出五格與三才屬文化方法、長名字數屬延伸口徑，不可作人生確定預測。不要要求或重述出生資料。' };
}

module.exports = { analyzeName, generateNames, validateInput, characterInfo, attachBaziLens, formatQuestionPrompt, PROFILE, DATA_VERSION };
