const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
function read(file) { return fs.readFileSync(path.join(root, file), 'utf8'); }

test('README 與 LLM 文件列出解答之書一站式 API', () => {
    const text = `${read('README.md')}\n${read('LLM-INTEGRATION.md')}`;
    for (const endpoint of ['tarot-question', 'fengshui-question', 'bazi2-question', 'yinyuan-question', 'answerbook-question']) {
        assert.match(text, new RegExp(endpoint), endpoint);
    }
    for (const skill of ['tarot-consultant', 'fengshui-consultant', 'bazi2-consultant', 'yinyuan-consultant', 'answerbook-consultant']) {
        assert.match(text, new RegExp(skill), skill);
    }
});

test('所有主要頁面導覽都包含解答之書', () => {
    for (const file of ['views/index.html', 'views/meihua.html', 'views/tarot.html', 'views/fengshui.html', 'views/bazi2.html', 'views/yinyuan.html', 'views/answerbook.html']) {
        assert.match(read(file), /href="\/answerbook"[^>]*>解答之書/, file);
    }
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
    const footer = read('views/partials/site-footer.html');
    assert.match(read('lang/zh-tw.json'), new RegExp(siteTitle));
    assert.match(read('lang/zh-cn.json'), new RegExp(siteTitle));
    assert.match(footer, /333奇門遁甲梅花易數排盤系統 © 2026/);
    assert.match(footer, /技術提供\s*<a href="https:\/\/david888\.com" target="_blank" rel="noopener">https:\/\/david888\.com<\/a>\s*\|\s*2026/);

    for (const file of ['views/index.html', 'views/meihua.html', 'views/tarot.html', 'views/fengshui.html', 'views/bazi2.html', 'views/yinyuan.html', 'views/answerbook.html']) {
        const html = read(file);
        assert.match(html, /partials\/site-footer\.html/, `${file} footer partial`);
    }

    for (const file of ['views/meihua.html', 'views/tarot.html', 'views/fengshui.html', 'views/bazi2.html', 'views/yinyuan.html', 'views/answerbook.html']) {
        assert.match(read(file), new RegExp(`<a class="navbar-brand"[^>]*>${siteTitle}<\\/a>`), `${file} navbar title`);
    }
});
