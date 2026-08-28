const test = require('node:test');
const assert = require('node:assert/strict');
const { drawCards, SPREADS } = require('../lib/tarot');

test('塔羅以可重現 seed 抽出不重複的三張牌', () => {
    const reading = drawCards({ spread: 'three', question: '工作方向', seed: 'fixed-seed' });
    assert.equal(reading.cards.length, 3);
    assert.equal(new Set(reading.cards.map((card) => card.name)).size, 3);
    assert.equal(reading.seed, 'fixed-seed');
    assert.deepEqual(drawCards({ spread: 'three', question: '工作方向', seed: 'fixed-seed' }).cards, reading.cards);
});

test('塔羅完整提供六種牌陣', () => {
    assert.deepEqual(Object.keys(SPREADS), ['single', 'three', 'diamond', 'moon', 'horseshoe', 'celtic']);
});

test('塔羅 CLI 腳本可正常執行並輸出 JSON', () => {
    const { execSync } = require('child_process');
    const stdout = execSync('node skills/tarot-consultant/scripts/tarot_cli.js --spread three --seed 12345 --time-factor night', { encoding: 'utf-8' });
    const result = JSON.parse(stdout);
    assert.equal(result.cards.length, 3);
    assert.equal(result.time_factor, 'night');
});
