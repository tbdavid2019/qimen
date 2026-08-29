const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
function read(file) { return fs.readFileSync(path.join(root, file), 'utf8'); }

test('README 與 LLM 文件列出解答之書一站式 API', () => {
    const text = `${read('README.md')}\n${read('LLM-INTEGRATION.md')}`;
    for (const endpoint of ['ziwei-question', 'tarot-question', 'fengshui-question', 'bazi2-question', 'yinyuan-question', 'answerbook-question']) {
        assert.match(text, new RegExp(endpoint), endpoint);
    }
    for (const skill of ['ziwei-consultant', 'tarot-consultant', 'fengshui-consultant', 'bazi2-consultant', 'yinyuan-consultant', 'answerbook-consultant']) {
        assert.match(text, new RegExp(skill), skill);
    }
});

test('所有主要頁面導覽都包含解答之書與紫微斗數', () => {
    for (const file of ['views/index.html', 'views/meihua.html', 'views/ziwei.html', 'views/tarot.html', 'views/fengshui.html', 'views/bazi2.html', 'views/yinyuan.html', 'views/answerbook.html']) {
        assert.match(read(file), /href="\/answerbook"[^>]*>解答之書/, file);
        assert.match(read(file), /href="\/ziwei"[^>]*>紫微斗數/, file);
    }
});

test('手機版導覽不使用漢堡選單並提供橫向滑動功能列', () => {
    const css = read('public/css/style-new.css');
    const mobileStart = css.indexOf('@media (max-width: 767px)');
    assert.ok(mobileStart >= 0, '共用樣式應包含手機版導覽規則');
    const mobileCss = css.slice(mobileStart, css.indexOf('/* Claude 面板與卡片 */', mobileStart));
    assert.match(mobileCss, /\.navbar-inverse \.navbar-toggle\s*\{[\s\S]*?display:\s*none\s*!important/);
    assert.match(mobileCss, /\.navbar-inverse \.navbar-collapse\.collapse\s*\{[\s\S]*?overflow-x:\s*auto\s*!important/);
    assert.match(mobileCss, /\.navbar-inverse \.navbar-nav\s*\{[\s\S]*?width:\s*max-content/);
    assert.match(mobileCss, /\.navbar-inverse \.navbar-nav\s*>\s*li\s*>\s*a\s*\{[\s\S]*?white-space:\s*nowrap/);
    assert.match(read('public/css/divination-suite.css'), /@media \(max-width: 767px\)[\s\S]*?body\.suite-page[\s\S]*?padding-top:\s*112px/);
    assert.match(read('public/css/meihua.css'), /@media \(max-width: 767px\)[\s\S]*?body\.meihua-page[\s\S]*?padding-top:\s*112px/);
});

test('888人生K線外部站連結位於導覽最右側並另開新視窗', () => {
    for (const file of ['views/index.html', 'views/meihua.html', 'views/tarot.html', 'views/fengshui.html', 'views/bazi2.html', 'views/yinyuan.html', 'views/answerbook.html']) {
        const html = read(file);
        const mainNavStart = html.indexOf('<ul class="nav navbar-nav">');
        const rightNavStart = html.indexOf('<ul class="nav navbar-nav navbar-right">');
        const externalLink = '<a href="https://bazi.david888.com/" target="_blank" rel="noopener">888人生K線</a>';
        assert.ok(mainNavStart >= 0 && rightNavStart > mainNavStart, `${file} 應有左右導覽列`);
        assert.ok(html.indexOf(externalLink) > rightNavStart, `${file} 外部站連結應位於右側導覽列`);
        assert.doesNotMatch(html.slice(mainNavStart, rightNavStart), /生辰八字<\/a>/, file);
        assert.doesNotMatch(html, /<a href="https:\/\/bazi\.david888\.com\/"[^>]*>生辰八字<\/a>/, file);
    }
});

test('目前網站模板不再引用靜心問事入口', () => {
    for (const file of ['views/index.html', 'views/meihua.html', 'views/tarot.html', 'views/fengshui.html', 'views/bazi2.html', 'views/yinyuan.html']) {
        assert.doesNotMatch(read(file), /\/start|靜心問事/, file);
    }
});

test('根目錄 CHANGELOG 記錄新增整合來源', () => {
    const changelog = read('CHANGELOG.md');
    for (const source of ['daman-ovo-0404/tarot-skill', 'voidforall/fengshui.skill', 'jinchenma94/bazi-skill', 'Ming-H/yinyuan-skills', 'answerbook.david888.com']) {
        assert.match(changelog, new RegExp(source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), source);
    }
});

test('全站使用新的網站標題與統一 footer', () => {
    const siteTitle = '333 一句提醒·照見當下';
    const seoTitle = '333 一句提醒·照見當下｜奇門遁甲、梅花易數、塔羅、風水與八字 AI 解析平台｜線上人生決策工具｜免費線上服務';
    const footer = read('views/partials/site-footer.html');
    for (const file of ['lang/zh-tw.json', 'lang/zh-cn.json']) {
        const lang = read(file);
        assert.match(lang, new RegExp(`"title":\\s*"${seoTitle}"`), `${file} SEO title`);
        assert.match(lang, new RegExp(`"navbar":\\s*\\{\\s*"title":\\s*"${siteTitle}"`), `${file} navbar title`);
    }
    const manifest = read('public/site.webmanifest');
    assert.match(manifest, /"name":\s*"333 一句提醒·照見當下"/);
    assert.match(manifest, /"short_name":\s*"333 一句提醒"/);
    assert.doesNotMatch(footer, /333奇門遁甲梅花易數排盤系統 © 2026/);
    assert.match(footer, /技術提供\s*<a href="https:\/\/david888\.com" target="_blank" rel="noopener">(?:https:\/\/)?david888\.com<\/a>\s*\|\s*2026/);

    for (const file of ['views/index.html', 'views/meihua.html', 'views/tarot.html', 'views/fengshui.html', 'views/bazi2.html', 'views/yinyuan.html', 'views/answerbook.html']) {
        const html = read(file);
        assert.match(html, /partials\/site-footer\.html/, `${file} footer partial`);
    }

    for (const file of ['views/meihua.html', 'views/tarot.html', 'views/fengshui.html', 'views/bazi2.html', 'views/yinyuan.html', 'views/answerbook.html']) {
        assert.match(read(file), new RegExp(`<a class="navbar-brand"[^>]*>${siteTitle}<\\/a>`), `${file} navbar title`);
    }
});

test('首頁 SEO 與社群分享 metadata 使用完整 OG 圖片規格', () => {
    const html = read('views/index.html');
    const description = '免費使用奇門遁甲、梅花易數、塔羅、風水、生辰八字、姻緣與解答之書，結合結構化排盤與多輪問答，提供工作、感情、財運與居家布局的實用線索與決策方向，協助你看清當下、做出更好的下一步。支援繁體與簡體中文介面，立即開始線上探索。';
    assert.match(html, /<meta name="description" content="[^"]{110,160}">/);
    assert.match(html, new RegExp(`meta name="description" content="${description}"`));
    assert.match(html, /<meta property="og:image" content="https:\/\/qi\.david888\.com\/og-image\.png">/);
    assert.match(html, /<meta property="og:image:width" content="1200">/);
    assert.match(html, /<meta property="og:image:height" content="630">/);
    assert.match(html, /<meta property="og:image:type" content="image\/png">/);
    assert.match(html, /<meta property="og:image:secure_url" content="https:\/\/qi\.david888\.com\/og-image\.png">/);
    assert.match(html, /<meta name="twitter:card" content="summary_large_image">/);
    assert.match(html, /<meta name="twitter:image" content="https:\/\/qi\.david888\.com\/og-image\.png">/);
    assert.match(html, /<meta name="twitter:image:alt" content="[^"]+">/);
});
