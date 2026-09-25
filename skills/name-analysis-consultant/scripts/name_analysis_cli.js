#!/usr/bin/env node
const { analyzeName, generateNames } = require('../../../lib/name-analysis');
const { calculateBazi } = require('../../../lib/bazi2');

function parseArgs(args) {
  const out = {};
  for (let i = 0; i < args.length; i++) {
    const token = args[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    if (key === 'generate' || key === 'verify') { out.mode = key; continue; }
    if (key === 'unknown-hour') { out.allowUnknownHour = true; continue; }
    if (key === 'leap-month') { out.leap = true; continue; }
    const value = args[i + 1];
    if (value === undefined || value.startsWith('--')) throw new Error(`缺少 --${key} 的值`);
    out[key] = value; i++;
  }
  if (out.length) out.givenNameLength = Number(out.length);
  if (out.include) out.includeChars = [...out.include];
  if (out.exclude) out.excludeChars = [...out.exclude];
  if (out.element) out.desiredElements = out.element.split(',').filter(Boolean);
  if (out.limit) out.limit = Number(out.limit);
  if (out['birth-date']) out.birthData = { ...(out.birthData || {}), date: out['birth-date'] };
  if (out['birth-sex']) out.birthData = { ...(out.birthData || {}), sex: out['birth-sex'] };
  if (out['birth-time']) out.birthData = { ...(out.birthData || {}), time: out['birth-time'] };
  if (out['birth-calendar']) out.birthData = { ...(out.birthData || {}), calendar: out['birth-calendar'] };
  if (out['zi-mode']) out.birthData = { ...(out.birthData || {}), ziMode: out['zi-mode'] };
  if (out.birthData && out.allowUnknownHour) out.birthData.allowUnknownHour = true;
  if (out.birthData && out.leap) out.birthData.leap = true;
  return out;
}

async function main() {
  let input;
  if (!process.stdin.isTTY) {
    const raw = await new Promise((resolve, reject) => { let data = ''; process.stdin.setEncoding('utf8'); process.stdin.on('data', (chunk) => { data += chunk; }); process.stdin.on('end', () => resolve(data)); process.stdin.on('error', reject); });
    if (raw.trim()) input = JSON.parse(raw);
  }
  input = { ...(input || {}), ...parseArgs(process.argv.slice(2)) };
  if (input.birthData) {
    const birth = input.birthData;
    if (!birth.date || !['男', '女'].includes(birth.sex)) throw new Error('八字參考需提供 birthData.date 與 birthData.sex');
    if (!birth.time && !birth.shichen && birth.allowUnknownHour !== true) throw new Error('請提供 birthData.time 或明確指定 allowUnknownHour=true');
    const chart = calculateBazi({ ...birth, time: birth.time || '', allowUnknownHour: !birth.time && !birth.shichen });
    const matches = String(chart.strengthAnalysis?.usefulGod || '').match(/\[([木火土金水])\]/g) || [];
    input.baziLens = { usefulElements: [...new Set(matches.map((text) => text.slice(1, -1)))], assumptions: { source: '本地 lib/bazi2.js 計算', calendar: birth.calendar || 'solar', lunarLeapMonth: (birth.calendar || 'solar') === 'lunar' && Boolean(birth.leap), birthHour: birth.time || birth.shichen ? '使用者提供' : '未知；以三柱參考', ziMode: birth.ziMode || 'early_late', solarTimeCorrection: '未提供出生地座標，未作真太陽時校正' } };
    if (input.mode === 'generate' && !input.desiredElements) input.desiredElements = input.baziLens.usefulElements;
  }
  const result = input.mode === 'generate' ? generateNames(input) : analyzeName(input);
  process.stdout.write(`${JSON.stringify({ success: true, result }, null, 2)}\n`);
}

main().catch((error) => { process.stderr.write(`${error.code || 'ERROR'}: ${error.message}\n`); process.exitCode = 1; });
