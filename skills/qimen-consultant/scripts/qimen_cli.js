#!/usr/bin/env node
/**
 * 奇門遁甲標準排盤 CLI 工具 (純 Node.js 零依賴實作)
 * 遵循 mainline-cn-v1 標準規格輸出結構化排盤 JSON
 */

const fs = require('fs');
const path = require('path');
const qimen = require(path.join(__dirname, '../../../lib/qimen.js'));

function parseArgs() {
    const args = process.argv.slice(2);
    let inputFile = null;
    let outputFile = null;

    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--input' && args[i + 1]) {
            inputFile = args[++i];
        } else if (args[i] === '--output' && args[i + 1]) {
            outputFile = args[++i];
        }
    }

    return { inputFile, outputFile };
}

function readInput(inputFile) {
    if (inputFile) {
        if (fs.existsSync(inputFile)) {
            return JSON.parse(fs.readFileSync(inputFile, 'utf-8'));
        }
        try {
            return JSON.parse(inputFile);
        } catch {
            throw new Error(`無法讀取輸入檔案或 JSON: ${inputFile}`);
        }
    }

    try {
        const stdinBuffer = fs.readFileSync(0, 'utf-8');
        if (stdinBuffer.trim()) {
            return JSON.parse(stdinBuffer);
        }
    } catch {
        // Fallback to default
    }

    return {
        question_type: 'general',
        question_goal: '當下吉凶指引',
        time_input: new Date().toISOString(),
        calendar_type: 'now',
        ruleset: 'mainline-cn-v1'
    };
}

function run() {
    try {
        const { inputFile, outputFile } = parseArgs();
        const inputData = readInput(inputFile);

        const targetDate = inputData.time_input ? new Date(inputData.time_input) : new Date();

        // 呼叫本地完整奇門排盤核心
        const panResult = qimen.calculate(targetDate, {
            method: '時家',
            timePrecisionMode: 'traditional',
            purpose: inputData.question_type || '綜合'
        });

        const doorIndex = {};
        const starIndex = {};
        const palaces = [];

        const gongNames = { '1': '坎', '2': '坤', '3': '震', '4': '巽', '5': '中', '6': '乾', '7': '兌', '8': '艮', '9': '離' };
        const gongDirections = { '1': '正北', '2': '西南', '3': '正東', '4': '東南', '5': '中央', '6': '西北', '7': '正西', '8': '東北', '9': '正南' };
        const gongElements = { '1': '水', '2': '土', '3': '木', '4': '木', '5': '土', '6': '金', '7': '金', '8': '土', '9': '火' };

        // 整理九宮
        for (let i = 1; i <= 9; i++) {
            const k = String(i);
            const door = panResult.baMen?.[k] || null;
            const star = panResult.jiuXing?.[k] || (i === 5 ? '天禽' : null);
            const god = panResult.baShen?.[k] || null;
            const earthStem = panResult.diPan?.[k] || '';
            const skyStem = panResult.sanQiLiuYi?.[k] || '';

            if (door && i !== 5) doorIndex[door] = i;
            if (star) starIndex[star] = i;

            palaces.push({
                palace: i,
                name: gongNames[k] || `${i}宮`,
                direction: gongDirections[k] || '',
                trigram: gongNames[k] || '',
                element: gongElements[k] || '',
                earth_stem: earthStem,
                sky_stem: skyStem,
                stem_relation: '比和',
                star: star,
                star_element: '',
                door: i === 5 ? null : door,
                door_element: '',
                god: i === 5 ? null : god,
                is_center: i === 5,
                hosts_center: i === 2
            });
        }

        const standardOutput = {
            schema_version: 'mainline-cn-v1',
            normalized_input: {
                question_type: inputData.question_type || 'general',
                question_goal: inputData.question_goal || '綜合分析',
                time: targetDate.toISOString(),
                location: inputData.location || { country: '台灣', city: '台北', timezone: 'Asia/Taipei' },
                ruleset: inputData.ruleset || 'mainline-cn-v1'
            },
            calendar: {
                solar: panResult.basicInfo?.date || targetDate.toLocaleDateString('zh-TW'),
                lunar: panResult.basicInfo?.lunarDate || '',
                solar_term: panResult.juShu?.jieQiName || '常規節氣'
            },
            ganzhi: {
                year: panResult.siZhu?.year || '',
                month: panResult.siZhu?.month || '',
                day: panResult.siZhu?.day || '',
                time: panResult.siZhu?.time || '',
                day_xun: '',
                time_xun: ''
            },
            chart: {
                dun_type: panResult.juShu?.type === 'yin' ? '陰遁' : '陽遁',
                yuan: panResult.juShu?.yuan || '上元',
                ju_number: Number(panResult.juShu?.number || 1),
                xunshou: panResult.xunShou || '甲子',
                hidden_yi: '戊',
                kongwang: panResult.kongWangZhi || [],
                kongwang_palaces: panResult.kongWangGong || [],
                day_kongwang: [],
                day_kongwang_palaces: [],
                time_stem_visible: panResult.siZhu?.time?.[0] || '',
                day_stem: {
                    stem: panResult.siZhu?.day?.[0] || '',
                    palace: 1,
                    note: '求測者本人落宮'
                },
                year_stem: {
                    stem: panResult.siZhu?.year?.[0] || '',
                    palace: 9,
                    note: '太歲/主管/大環境落宮'
                },
                month_stem: {
                    stem: panResult.siZhu?.month?.[0] || '',
                    palace: 3,
                    note: '同輩/競爭對手落宮'
                },
                yima: { branch: '申', palace: 2 },
                zhifu: { palace: Number(panResult.zhiFuGong || 1), star: panResult.zhiFuXing || '天蓬' },
                zhishi: { palace: Number(panResult.zhiShiGong || 1), door: panResult.zhiShiMen || '休門' },
                door_index: doorIndex,
                star_index: starIndex,
                detected_patterns: panResult.geju || [],
                yongshen: panResult.yongshen || null,
                palaces: palaces
            },
            warnings: []
        };

        const jsonString = JSON.stringify(standardOutput, null, 2);

        if (outputFile) {
            fs.writeFileSync(outputFile, jsonString, 'utf-8');
        } else {
            console.log(jsonString);
        }
    } catch (err) {
        console.error('Qimen CLI Error:', err.message);
        process.exit(1);
    }
}

run();
