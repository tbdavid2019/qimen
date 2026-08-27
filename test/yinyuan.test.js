const test = require('node:test');
const assert = require('node:assert/strict');
const {
    zodiacMatch,
    drawFortuneStick,
    redThreadReading,
    ziweiMarriage,
    peachBlossomLuck,
    baziMatchFull,
    redThreadFull
} = require('../lib/yinyuan');

test('姻緣生肖配對回傳相容分數與關係', () => {
    const result = zodiacMatch(1990, 1991);
    assert.equal(result.first.zodiac, '馬');
    assert.equal(result.second.zodiac, '羊');
    assert.equal(result.score, 88);
    assert.match(result.relationship, /六合/);

    const directZodiac = zodiacMatch('虎', '豬');
    assert.equal(directZodiac.first.zodiac, '虎');
    assert.equal(directZodiac.second.zodiac, '豬');
    assert.match(directZodiac.relationship, /六合/);
});

test('姻緣籤以 seed 可重現且支援指定籤號', () => {
    assert.deepEqual(drawFortuneStick('abc'), drawFortuneStick('abc'));
    const stick1 = drawFortuneStick('', '', null, 1);
    assert.equal(stick1.number, 1);
    const stick50 = drawFortuneStick({ stickNum: 50 });
    assert.equal(stick50.number, 50);
});

test('紫微夫妻宮、桃花運勢、八字合婚與紅線測算支援豐富參數', () => {
    const ziwei = ziweiMarriage({ date: '1995-08-18', time: '12:00', sex: '女', status: '單身' });
    assert.ok(ziwei.mainStar);
    assert.ok(ziwei.spousePalace);

    const peach = peachBlossomLuck('1995-06-20', '單身', '2026年度整體');
    assert.ok(peach.favorableDirection);
    assert.ok(peach.bestMonths.length > 0);

    const bazi = baziMatchFull(
        { name: '男方', date: '1992-04-10', time: '10:00', sex: '男' },
        { name: '女方', date: '1994-09-22', time: '14:00', sex: '女' }
    );
    assert.ok(bazi.score >= 0);
    assert.ok(bazi.grade);

    const red = redThreadFull({ date: '1996-03-12', time: '09:00', sex: '女', status: '單身' });
    assert.ok(red.profile.trait);
    assert.ok(red.timeWindows.nearestRedThread);
});
