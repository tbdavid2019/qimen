const test = require('node:test');
const assert = require('node:assert/strict');
const { zodiacMatch, drawFortuneStick, redThreadReading } = require('../lib/yinyuan');

test('姻緣生肖配對回傳相容分數與關係', () => {
    const result = zodiacMatch(1990, 1991);
    assert.equal(result.first.zodiac, '馬');
    assert.equal(result.second.zodiac, '羊');
    assert.equal(result.score, 88);
    assert.match(result.relationship, /六合/);
});

test('姻緣籤以 seed 可重現且紅線測算可使用八字結果', () => {
    assert.deepEqual(drawFortuneStick('abc'), drawFortuneStick('abc'));
    const result = redThreadReading({ fiveElements: { counts: { 木: 3, 火: 1, 土: 1, 金: 2, 水: 1 } } });
    assert.ok(result.summary);
});
