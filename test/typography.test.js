const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = (file) => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

test('字體優先順序：fonts.css 將 Gen Jyuu Gothic 排在 JetBrains Mono 之前，避免混排時英文數字體積過大', () => {
    const fontsCss = read('public/css/fonts.css');
    const primaryMatch = fontsCss.match(/--font-primary:\s*([^;]+);/);
    assert.ok(primaryMatch, 'fonts.css 應定義 --font-primary');
    
    const fontPrimary = primaryMatch[1];
    const genJyuuIdx = fontPrimary.indexOf('Gen Jyuu Gothic');
    const jetBrainsIdx = fontPrimary.indexOf('JetBrains Mono');
    
    assert.ok(genJyuuIdx !== -1, '--font-primary 應包含 Gen Jyuu Gothic');
    assert.ok(jetBrainsIdx !== -1, '--font-primary 應包含 JetBrains Mono');
    assert.ok(genJyuuIdx < jetBrainsIdx, 'Gen Jyuu Gothic 應排在 JetBrains Mono 之前');
    
    // 驗證 tabular-nums
    assert.match(fontsCss, /font-variant-numeric:\s*tabular-nums;/);
});

test('字體優先順序：style-new.css、divination-suite.css 與 meihua.css body 宣告均將 Gen Jyuu Gothic 排在 JetBrains Mono 之前', () => {
    const styleCss = read('public/css/style-new.css');
    const suiteCss = read('public/css/divination-suite.css');
    const meihuaCss = read('public/css/meihua.css');

    for (const [name, css] of [['style-new.css', styleCss], ['divination-suite.css', suiteCss], ['meihua.css', meihuaCss]]) {
        const bodyFontMatch = css.match(/body[^{]*\{[^}]*font-family:\s*([^;]+);/);
        assert.ok(bodyFontMatch, `${name} 應有 body font-family 宣告`);
        const fontVal = bodyFontMatch[1];
        const genJyuuIdx = fontVal.indexOf('Gen Jyuu Gothic');
        const jetBrainsIdx = fontVal.indexOf('JetBrains Mono');
        assert.ok(genJyuuIdx !== -1, `${name} body font-family 應包含 Gen Jyuu Gothic`);
        assert.ok(jetBrainsIdx !== -1, `${name} body font-family 應包含 JetBrains Mono`);
        assert.ok(genJyuuIdx < jetBrainsIdx, `${name} body 中 Gen Jyuu Gothic 應排在 JetBrains Mono 之前`);
    }
});

test('字級階層：:root 具備平衡的字級 Token，桌機與手機基準字級收斂至 16px', () => {
    const styleCss = read('public/css/style-new.css');
    
    // 桌機 Token 驗證
    assert.match(styleCss, /--type-hero-title:\s*24px;/);
    assert.match(styleCss, /--type-panel-title:\s*19px;/);
    assert.match(styleCss, /--type-display:\s*17\.5px;/);
    assert.match(styleCss, /--type-body:\s*16px;/);
    assert.match(styleCss, /--type-reading:\s*16px;/);
    assert.match(styleCss, /--type-label:\s*15px;/);
    assert.match(styleCss, /--type-meta:\s*14px;/);
    assert.match(styleCss, /--type-caption:\s*13\.5px;/);
    assert.match(styleCss, /--type-micro:\s*12\.5px;/);
    assert.match(styleCss, /--leading-body:\s*1\.65;/);
    assert.match(styleCss, /--leading-reading:\s*1\.75;/);

    // 手機版 Token 驗證
    const mobileBlockMatch = styleCss.match(/@media\s*\(max-width:\s*767px\)\s*\{\s*:root\s*\{([^}]+)\}/);
    assert.ok(mobileBlockMatch, 'style-new.css 應包含手機版 :root 字級定義');
    const mobileBlock = mobileBlockMatch[1];
    assert.match(mobileBlock, /--type-hero-title:\s*21px;/);
    assert.match(mobileBlock, /--type-panel-title:\s*18px;/);
    assert.match(mobileBlock, /--type-display:\s*17px;/);
    assert.match(mobileBlock, /--type-body:\s*16px;/);
    assert.match(mobileBlock, /--type-reading:\s*16px;/);
    assert.match(mobileBlock, /--type-label:\s*15px;/);
    assert.match(mobileBlock, /--type-meta:\s*14px;/);
    assert.match(mobileBlock, /--type-caption:\s*13\.5px;/);
    assert.match(mobileBlock, /--type-micro:\s*12\.5px;/);
});

test('清理暴力覆寫：style-new.css 與 divination-suite.css 已完全移除破壞性 :where 規則與 inline 字級攔截器', () => {
    const styleCss = read('public/css/style-new.css');
    const suiteCss = read('public/css/divination-suite.css');

    for (const [name, css] of [['style-new.css', styleCss], ['divination-suite.css', suiteCss]]) {
        // 不得存在 :where(p, li, td, th... max(18px / 19px) !important
        assert.doesNotMatch(css, /:where\([^)]*p[^)]*\)\s*\{[^}]*font-size:\s*max\(\s*18px/i, `${name} 不應有 max(18px) :where 暴力覆寫`);
        assert.doesNotMatch(css, /:where\([^)]*p[^)]*\)\s*\{[^}]*font-size:\s*max\(\s*19px/i, `${name} 不應有 max(19px) :where 暴力覆寫`);
        
        // 不得存在 [style*="font-size: 攔截器
        assert.doesNotMatch(css, /\[style\*=["']font-size:/, `${name} 不應有 [style*="font-size: 攔截器`);
    }

    // 驗證採用乾淨的語意化類別
    assert.match(styleCss, /\.markdown-body,\s*\.conversation-answer,\s*\.suite-message-bubble\s*\{/);
    assert.doesNotMatch(suiteCss, /\.suite-message-bubble\s*\{[^}]*font-size:\s*15px/);
});
