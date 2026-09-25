const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const { analyzeName, generateNames, characterInfo, PROFILE, formatQuestionPrompt } = require('../lib/name-analysis');
const app = require('../app');

test('驗證台灣康熙筆畫與現代筆畫，分開回報來源欄位', () => {
  const kangxi = analyzeName({ name: '王小明', surname: '王' });
  const modern = analyzeName({ name: '王小明', surname: '王', profile: 'modern' });
  assert.equal(kangxi.profile.id, 'taiwan-kangxi-v1');
  assert.equal(modern.profile.id, 'modern-stroke-v1');
  assert.equal(kangxi.fiveGrid.values.person.number, kangxi.characters[0].kangxiStroke + kangxi.characters[1].kangxiStroke);
  assert.equal(modern.characters[0].stroke, modern.characters[0].modernStroke);
});

test('支援八字姓名、複姓明確指定與多種姓氏切分提示', () => {
  const result = analyzeName({ name: '歐陽明月清風', surname: '歐陽' });
  assert.equal(result.givenName, '明月清風');
  assert.equal(result.profile.extendedLongGivenName, true);
  assert.match(result.profile.methodLabel, /延伸/);
  const inferred = analyzeName({ name: '歐陽清風' });
  assert.equal(inferred.segmentation.ambiguous, true);
  assert.equal(inferred.surname, null);
  assert.equal(inferred.fiveGrid.available, false);
  assert.ok(inferred.segmentation.alternatives.some((x) => x.surname === '歐陽'));
});

test('拒絕非漢字、長度越界和姓名中不存在的明確姓氏', () => {
  assert.throws(() => analyzeName({ name: 'A明' }), { code: 'INVALID_NAME' });
  assert.throws(() => analyzeName({ name: '王小明', surname: '李' }), { code: 'INVALID_SURNAME' });
  assert.throws(() => analyzeName({ name: '王小明你好嗎很棒呀' }), { code: 'INVALID_NAME' });
});

test('未知漢字不補造筆畫或五行', () => {
  const info = characterInfo('𱍐', PROFILE.taiwanKangxi);
  assert.equal(info.known, false);
  assert.equal(info.stroke, null);
  const result = analyzeName({ name: '𱍐明', surname: '𱍐' });
  assert.equal(result.fiveGrid.available, false);
  assert.ok(result.dataQuality.missingCharactersOrStrokes.includes('𱍐'));
});

test('打包的字表與 81 數理資料欄位完整且可稽核', () => {
  const dataDir = path.join(__dirname, '..', 'data', 'name-analysis');
  const records = JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(dataDir, 'chars.json.gz'))).toString('utf8')).chars;
  assert.equal(Object.keys(records).length, 20794);
  for (const [character, row] of Object.entries(records)) {
    assert.equal([...character].length, 1);
    assert.ok(Number.isInteger(row.kx) && row.kx > 0);
    assert.ok(Number.isInteger(row.ts) && row.ts > 0);
    for (const field of ['bs', 'py', 'rad', 'wx']) assert.ok(row[field] == null || typeof row[field] === 'string' || Number.isInteger(row[field]));
  }
  const entries = require('../data/name-analysis/81-numerology.json').entries;
  assert.equal(entries.length, 81);
  assert.deepEqual(entries.map((x) => x.number), Array.from({ length: 81 }, (_, i) => i + 1));
});

test('命名候選長度、硬性字條件、排除條件與結果穩定', () => {
  const args = { surname: '王', givenNameLength: 3, includeChars: ['安'], excludeChars: ['凶'], limit: 10 };
  const a = generateNames(args).candidates;
  const b = generateNames(args).candidates;
  assert.deepEqual(a.map((x) => x.name), b.map((x) => x.name));
  assert.ok(a.length > 0);
  for (const item of a) {
    assert.equal([...item.givenName].length, 3);
    assert.ok(item.givenName.includes('安'));
    assert.ok(!item.givenName.includes('凶'));
  }
  assert.throws(() => generateNames({ surname: '王', givenNameLength: 5 }), { code: 'INVALID_GIVEN_NAME_LENGTH' });
});

test('依排盤性別套用可覆寫的命名風格，女生候選不再以男性風格字堆榜', () => {
  const female = generateNames({ surname: '江', givenNameLength: 2, birthData: { sex: '女' }, limit: 20 });
  const male = generateNames({ surname: '江', givenNameLength: 2, birthData: { sex: '男' }, limit: 20 });
  const neutral = generateNames({ surname: '江', givenNameLength: 2, limit: 20 });
  assert.equal(female.nameStyle.effective, 'feminine');
  assert.equal(male.nameStyle.effective, 'masculine');
  assert.equal(neutral.nameStyle.effective, 'neutral');
  assert.ok(female.candidates.some((candidate) => candidate.name === '江婉婷'));
  assert.ok(female.candidates.every((candidate) => candidate.preferences.nameStyle.conflictingCharacters.length === 0));
  assert.ok(male.candidates.some((candidate) => candidate.name === '江浩然'));
  assert.equal(generateNames({ surname: '江', nameStyle: 'neutral' }).nameStyle.effective, 'neutral');
  assert.throws(() => generateNames({ surname: '江', nameStyle: 'girl' }), { code: 'INVALID_NAME_STYLE' });
});

test('指定字可出現在名字任意位置，並依所選筆畫口徑檢查字庫', () => {
  const result = generateNames({ surname: '王', givenNameLength: 3, includeChars: ['月'], profile: 'modern', limit: 50 });
  assert.equal(result.candidates.length, 50);
  assert.ok(result.candidates.every((item) => item.givenName.includes('月')));
  assert.ok(result.candidates.some((item) => item.givenName.indexOf('月') > 0));
  assert.ok(result.candidates.every((item) => item.analysis.characters.every((character) => Number.isInteger(character.modernStroke))));
  assert.throws(() => generateNames({ surname: '王', includeChars: ['𱍐'], profile: 'modern' }), { code: 'INVALID_CHAR_CONSTRAINT' });
});

test('補充問答封裝計算結果與限制，不會自行補齊缺漏資料', () => {
  const result = analyzeName({ name: '王小明' });
  const prompt = formatQuestionPrompt(result, '這個名字有哪些特色？');
  assert.equal(prompt.deterministicResult, result);
  assert.match(prompt.instruction, /不得推斷缺失/);
});

test('姓名分析頁展示生辰性別欄位、分層結果與明確 Turnstile 元件', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'views', 'name-analysis.html'), 'utf8');
  const js = fs.readFileSync(path.join(__dirname, '..', 'public', 'js', 'name-analysis.js'), 'utf8');
  assert.match(html, /id="birthDate"/);
  assert.match(html, /id="birthSex"/);
  assert.match(html, /id="nameStyle"/);
  assert.match(js, /nameStyle: byId\('nameStyle'\)\.value/);
  assert.match(fs.readFileSync(path.join(__dirname, '..', 'public', 'js', 'webmcp.js'), 'utf8'), /nameStyle: \{ type: "string", enum: \["auto", "feminine", "masculine", "neutral"\]/);
  assert.match(html, /id="name-turnstile"[^>]*data-action="llm_analysis"/);
  assert.match(html, /navbar-ex1-collapse/);
  assert.match(js, /name-bazi-section/);
  assert.match(js, /window\.turnstile\.render/);
  assert.match(js, /請先完成 Cloudflare 人機驗證/);
});

test('HTTP 驗名、取名與本地八字 lens 共用核心引擎', async (t) => {
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  t.after(() => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));
  const base = `http://127.0.0.1:${server.address().port}`;
  const pageResponse = await fetch(`${base}/name-analysis`);
  assert.equal(pageResponse.status, 200);
  assert.match(await pageResponse.text(), /驗證現有名字/);
  const docsResponse = await fetch(`${base}/api/docs`);
  const docs = await docsResponse.json();
  assert.equal(docs.endpoints.nameAnalysisVerify.path, '/api/name-analysis/verify');
  assert.equal(docs.endpoints.nameAnalysisGenerate.path, '/api/name-analysis/generate');
  assert.deepEqual(docs.endpoints.nameAnalysisGenerate.parameters.nameStyle.enum, ['auto', 'feminine', 'masculine', 'neutral']);
  assert.equal(docs.endpoints.nameStyleProfiles.path, '/data/name-analysis/name-style-profiles.json');
  const styleProfilesResponse = await fetch(`${base}/data/name-analysis/name-style-profiles.json`);
  const styleProfiles = await styleProfilesResponse.json();
  assert.equal(styleProfilesResponse.status, 200);
  assert.ok(styleProfiles.profiles.feminine.patterns.includes('婉婷'));
  const verify = await fetch(`${base}/api/name-analysis/verify`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: '歐陽明月清風', surname: '歐陽' }) });
  const verified = await verify.json();
  assert.equal(verify.status, 200);
  assert.equal(verified.result.givenName, '明月清風');
  const generatedResponse = await fetch(`${base}/api/name-analysis/generate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ surname: '王', givenNameLength: 3, limit: 3, birthData: { date: '1981-08-11', sex: '男', calendar: 'solar', allowUnknownHour: true } }) });
  const generated = await generatedResponse.json();
  assert.equal(generatedResponse.status, 200);
  assert.equal(generated.result.candidates.length, 3);
  assert.ok(generated.result.baziLens.usefulElements.length > 0);
  const baziSummary = generated.result.candidates[0].analysis.baziLens.summary;
  assert.equal(baziSummary.sex, '男');
  assert.equal(baziSummary.fourPillars.length, 4);
  assert.equal(baziSummary.fourPillars[3].value, '未知');
  assert.ok(baziSummary.fiveElements.counts);
  assert.equal(JSON.stringify(generated.result).includes('1981-08-11'), false);
  const femaleResponse = await fetch(`${base}/api/name-analysis/generate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ surname: '江', givenNameLength: 2, limit: 20, birthData: { date: '2017-11-04', time: '02:30', sex: '女', calendar: 'solar' } }) });
  const femaleResult = await femaleResponse.json();
  assert.equal(femaleResponse.status, 200);
  assert.equal(femaleResult.result.nameStyle.effective, 'feminine');
  assert.ok(femaleResult.result.candidates.some((candidate) => candidate.name === '江婉婷'));
  assert.ok(femaleResult.result.candidates.every((candidate) => candidate.preferences.nameStyle.conflictingCharacters.length === 0));
  const questionResponse = await fetch(`${base}/api/name-analysis-question`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: '王小明', surname: '王', birthData: { date: '1981-08-11', time: '10:00', sex: '男' } }) });
  const questioned = await questionResponse.json();
  assert.equal(questionResponse.status, 200);
  assert.equal(JSON.stringify(questioned.result).includes('1981-08-11'), false);
});
