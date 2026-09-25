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

test('塔羅抽牌包含圖片路徑、英文名、正逆位關鍵字等完整屬性', () => {
    const reading = drawCards({ spread: 'three', question: '事業走向', seed: 'test-meta-seed' });
    for (const card of reading.cards) {
        assert.ok(card.imageUrl && card.imageUrl.startsWith('/images/tarot/cards/'));
        assert.ok(card.nameEn);
        assert.ok(card.keywords);
        assert.ok(card.keywords.upright && card.keywords.upright.theme);
        assert.ok(card.keywords.reversed && card.keywords.reversed.theme);
    }
});

test('78 張偉特塔羅牌圖片全數存在於 public/images/tarot/cards/ 且檔案完整', () => {
    const fs = require('fs');
    const path = require('path');
    const { getAllTarotCards } = require('../lib/tarot');
    const allCards = getAllTarotCards('all');
    assert.equal(allCards.length, 78);

    for (const card of allCards) {
        const filePath = path.join(__dirname, '../public/images/tarot/cards', card.image);
        assert.ok(fs.existsSync(filePath), `圖片檔案不存在：${card.image}`);
        const stat = fs.statSync(filePath);
        assert.ok(stat.size > 1000, `圖片檔案異常過小：${card.image}`);
    }
});

test('塔羅生命靈數正確歸約計算並對應大阿爾克那靈魂象徵牌', () => {
    const { calculateTarotNumerology } = require('../lib/tarot');
    // 1981-08-11: 1+9+8+1+0+8+1+1 = 29 -> 11 -> 2 (女祭司)
    const res1 = calculateTarotNumerology('1981-08-11');
    assert.equal(res1.lifeNumber, 2);
    assert.equal(res1.soulCard.name, '女祭司');
    assert.equal(res1.soulCard.nameEn, 'The High Priestess');
    assert.equal(res1.soulCard.image, 'major_02.jpg');
    assert.ok(res1.soulCard.summary.includes('深藏智慧'));

    // 1990-05-15: 1+9+9+0+0+5+1+5 = 30 -> 3 (皇后)
    const res2 = calculateTarotNumerology('1990-05-15');
    assert.equal(res2.lifeNumber, 3);
    assert.equal(res2.soulCard.name, '皇后');

    // 錯誤輸入處理與真實西曆有效性驗證
    const errRes = calculateTarotNumerology('bad-date');
    assert.ok(errRes.error);

    // 不存在的日期檢驗（如 1981-99-99、非閏年 2023-02-29、4月31日）
    assert.ok(calculateTarotNumerology('1981-99-99').error);
    assert.ok(calculateTarotNumerology('2023-02-29').error);
    assert.ok(calculateTarotNumerology('2024-04-31').error);

    // 正確閏年日期（2024-02-29: 2+0+2+4+0+2+2+9 = 21 -> 3）
    const leapRes = calculateTarotNumerology('2024-02-29');
    assert.equal(leapRes.lifeNumber, 3);
    assert.equal(leapRes.birthDate, '2024-02-29');
});

test('塔羅生命靈數獨立 CLI 腳本 (tarot_numerology.js) 正常獨立執行', () => {
    const { execSync } = require('child_process');
    const stdout = execSync('node skills/tarot-consultant/scripts/tarot_numerology.js --birth-date 1981-08-11', { encoding: 'utf-8' });
    const result = JSON.parse(stdout);
    assert.equal(result.success, true);
    assert.equal(result.lifeNumber, 2);
    assert.equal(result.soulCard.name, '女祭司');
});

test('塔羅 API /api/tarot/numerology 與 /api/tarot/cards 正常運作', async () => {
    const http = require('node:http');
    const app = require('../app');
    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const baseUrl = `http://127.0.0.1:${server.address().port}`;

    try {
        // 1. POST /api/tarot/numerology
        const resNum = await fetch(`${baseUrl}/api/tarot/numerology`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ birthDate: '1981-08-11' })
        });
        assert.equal(resNum.status, 200);
        const dataNum = await resNum.json();
        assert.equal(dataNum.success, true);
        assert.equal(dataNum.lifeNumber, 2);
        assert.equal(dataNum.soulCard.name, '女祭司');

        // 2. GET /api/tarot/cards
        const resCards = await fetch(`${baseUrl}/api/tarot/cards?suit=major`);
        assert.equal(resCards.status, 200);
        const dataCards = await resCards.json();
        assert.equal(dataCards.success, true);
        assert.equal(dataCards.count, 22);

        // 3. GET /tarot/numerology and /tarot/gallery HTML routes
        const resPageNum = await fetch(`${baseUrl}/tarot/numerology`);
        assert.equal(resPageNum.status, 200);
        const resPageGal = await fetch(`${baseUrl}/tarot/gallery`);
        assert.equal(resPageGal.status, 200);
    } finally {
        await new Promise((resolve) => server.close(resolve));
    }
});

