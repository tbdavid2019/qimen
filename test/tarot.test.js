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
