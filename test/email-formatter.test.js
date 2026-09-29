const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
    isRawJsonPayload,
    formatHumanReadableReport,
    formatChartSummary,
    formatSubject
} = require('../lib/email-formatter');
const {
    generateConversationEmailHtml
} = require('../lib/email');

test('Email Formatter: isRawJsonPayload 精準辨別 raw JSON 與代碼塊', () => {
    assert.equal(isRawJsonPayload('```json\n{"success": true}\n```'), true);
    assert.equal(isRawJsonPayload('{"success": true, "result": {}}'), true);
    assert.equal(isRawJsonPayload('## 這是正常的 Markdown\n- 項目一'), false);
    assert.equal(isRawJsonPayload('單純的文字訊息'), false);
});

test('Email Formatter: 姓名分析取名推薦輸出人類友善 Markdown 與標題', () => {
    const mockGenerate = {
        success: true,
        result: {
            surname: '江',
            givenNameLength: 2,
            nameStyle: { label: '偏女性化風格' },
            candidates: [
                {
                    name: '江宛樂',
                    givenName: '宛樂',
                    analysis: {
                        characters: [
                            { char: '江', pinyin: 'jiāng', element: '水', stroke: 7, definition: '大河名' },
                            { char: '宛', pinyin: 'wǎn', element: '土', stroke: 8, definition: '屈也，順也' },
                            { char: '樂', pinyin: 'lè', element: '火', stroke: 15, definition: '喜悅安康' }
                        ],
                        fiveGrid: {
                            values: {
                                heaven: { number: 8, classification: '吉', element: '金' },
                                person: { number: 15, classification: '吉', element: '土' },
                                earth: { number: 23, classification: '吉', element: '火' },
                                outer: { number: 16, classification: '吉', element: '土' },
                                total: { number: 30, classification: '平', element: '水' }
                            },
                            talents: {
                                heavenPerson: { elements: ['金', '土'], relation: '受生' },
                                personEarth: { elements: ['土', '火'], relation: '受生' }
                            }
                        }
                    }
                }
            ]
        }
    };

    const md = formatHumanReadableReport('中文姓名分析', mockGenerate);
    assert.ok(md.includes('👶 【江】姓取名候選推薦報告'), '必須包含友善大標題');
    assert.ok(md.includes('江宛樂'), '必須包含候選名字');
    assert.ok(md.includes('jiāng'), '必須包含讀音');
    assert.ok(md.includes('五格數理格局'), '必須包含五格格局');
    assert.ok(!md.includes('```json'), '絕對不得含有 raw JSON 代碼塊');

    const summary = formatChartSummary('中文姓名分析', mockGenerate);
    assert.ok(!summary.includes('/api/'), '摘要絕不能含有 /api/ 程式路徑');
    assert.ok(summary.includes('江') && summary.includes('康熙'));

    const subject = formatSubject('中文姓名分析', mockGenerate);
    assert.ok(subject.includes('江姓') && subject.includes('取名候選推薦報告'));
});

test('Email Formatter: 姓名分析評估報告結構完整且無程式碼', () => {
    const mockVerify = {
        success: true,
        result: {
            name: '江宛樂',
            characters: [
                { char: '江', pinyin: 'jiāng', element: '水', stroke: 7, definition: '大河也' },
                { char: '宛', pinyin: 'wǎn', element: '土', stroke: 8, definition: '順從也' },
                { char: '樂', pinyin: 'lè', element: '火', stroke: 15, definition: '安樂也' }
            ],
            fiveGrid: {
                available: true,
                values: {
                    heaven: { number: 8, classification: '吉', element: '金' },
                    person: { number: 15, classification: '吉', element: '土' },
                    earth: { number: 23, classification: '吉', element: '火' },
                    outer: { number: 16, classification: '吉', element: '土' },
                    total: { number: 30, classification: '平', element: '水' }
                }
            },
            interpretation: '格局穩健，五行相生。'
        }
    };

    const md = formatHumanReadableReport('中文姓名分析', mockVerify);
    assert.ok(md.includes('【江宛樂】姓名學完整分析評估報告'));
    assert.ok(md.includes('天格'));
    assert.ok(md.includes('格局穩健，五行相生。'));
    assert.ok(!md.includes('```json'));
});

test('Email Formatter: 韋特塔羅抽牌與生命靈數人類化排版', () => {
    const mockTarot = {
        success: true,
        result: {
            spreadName: '三牌陣',
            question: '職涯發展',
            cards: [
                { position: '過去', name: '命運之輪', isReversed: false, meaning: '轉變之契機' },
                { position: '現在', name: '聖杯Ace', isReversed: false, meaning: '內在熱情萌芽' },
                { position: '未來', name: '權杖三', isReversed: false, meaning: '放眼遠大平台' }
            ]
        }
    };
    const mdTarot = formatHumanReadableReport('韋特塔羅', mockTarot);
    assert.ok(mdTarot.includes('韋特塔羅占卜解析報告'));
    assert.ok(mdTarot.includes('命運之輪'));
    assert.ok(mdTarot.includes('過去'));
    assert.ok(!mdTarot.includes('```json'));

    const mockNum = {
        success: true,
        result: {
            birthDate: '1990-05-15',
            lifeNumber: 3,
            lifeProfile: { title: '表達與創意', essence: '天生具備豐富的語言天賦' },
            soulCard: { name: '女皇', meaning: '豐饒與創造力' }
        }
    };
    const mdNum = formatHumanReadableReport('韋特塔羅／生命靈數', mockNum);
    assert.ok(mdNum.includes('塔羅生命靈數與靈魂象徵牌報告'));
    assert.ok(mdNum.includes('3 號人'));
    assert.ok(mdNum.includes('女皇'));
    assert.ok(!mdNum.includes('```json'));
});

test('Email Service: generateConversationEmailHtml 自動攔截 raw JSON payload 並轉換為人類郵件', () => {
    const rawJsonPayload = '```json\n' + JSON.stringify({
        success: true,
        result: {
            surname: '李',
            candidates: [
                {
                    name: '李安康',
                    analysis: {
                        characters: [{ char: '李' }, { char: '安' }, { char: '康' }]
                    }
                }
            ]
        }
    }) + '\n```';

    const html = generateConversationEmailHtml({
        serviceName: '中文姓名分析',
        chartSummary: '/api/name-analysis/generate · 2026/09/29 10:43:31',
        history: [{ role: 'assistant', content: rawJsonPayload }]
    });

    assert.ok(!html.includes('```json'), '郵件中不得含有 ```json');
    assert.ok(!html.includes('&quot;surname&quot;'), '郵件中不得含有原始 JSON 鍵名');
    assert.ok(!html.includes('/api/name-analysis/generate'), '郵件摘要中不得含有 API 路由');
    assert.ok(html.includes('【李】姓取名候選推薦報告'), '必須轉換為人類標題');
    assert.ok(html.includes('李安康'), '必須包含候選名字');
});

test('Front-end result-email.js: 包含成功按鈕切換「已成功寄送 ✓」、鎖定防重複點擊與自動關閉機制', () => {
    const script = fs.readFileSync(path.join(__dirname, '../public/js/result-email.js'), 'utf8');
    assert.ok(script.includes('已成功寄送 ✓'), '必須在成功時切換按鈕文字');
    assert.ok(script.includes('sendButton.disabled = true;'), '成功時必須鎖定按鈕避免二次點擊');
    assert.ok(script.includes('setTimeout('), '必須具有定時器');
    assert.ok(script.includes('modal.close()'), '必須自動關閉彈窗');
    assert.ok(!script.includes('```json\\n${lastReport.text}'), '不得在 history 中包裝原始 JSON 代碼塊');
});
