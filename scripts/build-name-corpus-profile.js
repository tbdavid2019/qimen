#!/usr/bin/env node
'use strict';

// Build compact aggregate character/bigram counts from the CCNC TSV corpus.
// Usage: node scripts/build-name-corpus-profile.js /path/to/ccnc.txt [output.json]
const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline');
const crypto = require('node:crypto');

const sourcePath = process.argv[2];
if (!sourcePath) {
  process.stderr.write('Usage: node scripts/build-name-corpus-profile.js <ccnc.txt> [output.json]\n');
  process.exit(2);
}
const root = path.join(__dirname, '..');
const outputPath = path.resolve(process.argv[3] || path.join(root, 'data/name-analysis/name-corpus-profile.json'));
const curated = require('../data/name-analysis/curated-given-name-chars.json').characters;
const curatedSet = new Set([...curated]);
const hanOnly = /^\p{Script=Han}+$/u;
const characters = new Map();
const pairs = new Map();
const totals = { rows: 0, male: 0, female: 0, unknown: 0, invalid: 0, eligibleGivenNames: 0, oneCharacterGivenNames: 0, twoCharacterGivenNames: 0, longerGivenNames: 0 };
const sexKey = (value) => value === 'M' || value === '男' ? 'm' : value === 'F' || value === '女' ? 'f' : 'u';
const countRow = (map, key, gender) => {
  let row = map.get(key);
  if (!row) { row = { m: 0, f: 0, u: 0 }; map.set(key, row); }
  row[gender] += 1;
};

async function main() {
  const lines = readline.createInterface({ input: fs.createReadStream(sourcePath, { encoding: 'utf8' }), crlfDelay: Infinity });
  for await (const line of lines) {
    const fields = line.replace(/^\uFEFF/, '').split('\t');
    if (fields[0] === '姓' || fields.length < 4) continue;
    totals.rows += 1;
    const given = String(fields[1] || '').normalize('NFC').trim();
    const gender = sexKey(String(fields[3] || '').trim());
    totals[gender === 'm' ? 'male' : gender === 'f' ? 'female' : 'unknown'] += 1;
    if (!given || !hanOnly.test(given) || [...given].length > 4) { totals.invalid += 1; continue; }
    totals.eligibleGivenNames += 1;
    const chars = [...given];
    if (chars.length === 1) totals.oneCharacterGivenNames += 1;
    else if (chars.length === 2) totals.twoCharacterGivenNames += 1;
    else totals.longerGivenNames += 1;
    for (const char of chars) countRow(characters, char, gender);
    for (let i = 0; i < chars.length - 1; i += 1) {
      const left = chars[i];
      const right = chars[i + 1];
      if (curatedSet.has(left) && curatedSet.has(right)) countRow(pairs, left + right, gender);
    }
  }

  const pairRows = [...pairs.entries()]
    .filter(([, row]) => row.m + row.f >= 5)
    .sort((a, b) => (b[1].m + b[1].f) - (a[1].m + a[1].f) || a[0].localeCompare(b[0], 'zh-Hant'))
    .slice(0, 30000);
  const digest = crypto.createHash('sha256');
  for await (const chunk of fs.createReadStream(sourcePath)) digest.update(chunk);
  const payload = {
    version: 'ccnc-derived-name-profile-v1',
    source: {
      name: 'CCNC: A Comprehensive Chinese Name Corpus',
      url: 'https://github.com/jaaack-wang/ccnc',
      license: 'GPL-3.0-only',
      corpusSha256: digest.digest('hex'),
      aggregation: 'Counts labelled male/female/unknown given-name characters and adjacent pairs; exports aggregate counts only, never full names.',
      scope: 'The source is a mainland Chinese corpus and overwhelmingly contains one- or two-character given names; it is a soft ordering signal, not a Taiwanese birth registry or identity classifier.'
    },
    totals,
    characters: Object.fromEntries([...characters.entries()].sort((a, b) => a[0].localeCompare(b[0], 'zh-Hant'))),
    pairs: Object.fromEntries(pairRows)
  };
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(payload)}\n`);
  process.stdout.write(`Wrote ${outputPath}\nRows: ${totals.rows}; eligible given names: ${totals.eligibleGivenNames}; characters: ${characters.size}; retained pairs: ${pairRows.length}\n`);
}

main().catch((error) => { process.stderr.write(`${error.stack || error}\n`); process.exitCode = 1; });
