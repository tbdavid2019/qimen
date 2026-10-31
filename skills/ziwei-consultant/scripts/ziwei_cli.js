#!/usr/bin/env node
/**
 * 紫微斗數標準排盤 CLI 工具 (純 Node.js 零依賴實作)
 * 輸出標準十二宮、十四主星、廟旺、六吉六煞、生年四化、大限流年與格局 JSON
 */

const fs = require('fs');
const path = require('path');
const { calculateZiweiChart, evaluateMaleSize, evaluateFutureSpouse } = require(path.join(__dirname, '../../../lib/ziwei.js'));
const { evaluateZiweiMatch } = require(path.join(__dirname, '../../../lib/ziwei-match.js'));

function parseArgs() {
    const args = process.argv.slice(2);
    let inputFile = null;
    let outputFile = null;
    const params = {
        date: '1990-05-15',
        time: '12:00',
        sex: '男',
        calendar: 'solar'
    };
    let firstInline = null;
    let secondInline = null;

    let rawInline = null;

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === '--input' && args[i + 1]) {
            inputFile = args[++i];
        } else if (arg === '--output' && args[i + 1]) {
            outputFile = args[++i];
        } else if (arg === '--mode' && args[i + 1]) {
            params.mode = args[++i];
        } else if (arg === '--male-size') {
            params.mode = 'male-size';
        } else if (arg === '--spouse' || arg === '--future-spouse') {
            params.mode = 'spouse';
        } else if (arg === '--match') {
            params.mode = 'match';
        } else if (arg === '--patterns') {
            params.mode = 'patterns';
            if (args[i + 1] && !args[i + 1].startsWith('--')) params.patterns = args[++i];
        } else if (arg === '--domain' && args[i + 1]) {
            params.mode = 'domain';
            params.domain = args[++i];
        } else if (arg === '--all-domains') {
            params.mode = 'all-domains';
        } else if (arg === '--first' && args[i + 1]) {
            firstInline = args[++i];
        } else if (arg === '--second' && args[i + 1]) {
            secondInline = args[++i];
        } else if ((arg === '--date' || arg === '--solar') && args[i + 1]) {
            params.date = args[++i];
            params.calendar = 'solar';
        } else if (arg === '--lunar' && args[i + 1]) {
            params.date = args[++i];
            params.calendar = 'lunar';
        } else if (arg === '--time' && args[i + 1]) {
            params.time = args[++i];
        } else if (arg === '--hour' && args[i + 1]) {
            params.hour = args[++i];
        } else if (arg === '--shichen' && args[i + 1]) {
            params.shichen = args[++i];
            delete params.time;
        } else if (arg === '--sex' && args[i + 1]) {
            params.sex = args[++i];
        } else if (arg === '--place' && args[i + 1]) {
            params.place = args[++i];
        } else if (arg === '--longitude' && args[i + 1]) {
            params.longitude = Number(args[++i]);
        } else if (arg === '--latitude' && args[i + 1]) {
            params.latitude = Number(args[++i]);
        } else if (!arg.startsWith('--')) {
            rawInline = arg;
        }
    }

    return { inputFile, outputFile, rawInline, params, firstInline, secondInline };
}

function readInput(inputFile, rawInline, defaultParams) {
    if (inputFile) {
        if (fs.existsSync(inputFile)) {
            return Object.assign({}, defaultParams, JSON.parse(fs.readFileSync(inputFile, 'utf-8')));
        }
        try {
            return Object.assign({}, defaultParams, JSON.parse(inputFile));
        } catch {}
    }

    if (rawInline) {
        try {
            return Object.assign({}, defaultParams, JSON.parse(rawInline));
        } catch {}
    }

    if (!process.stdin.isTTY) {
        try {
            const stdinBuffer = fs.readFileSync(0, 'utf-8');
            if (stdinBuffer.trim().startsWith('{')) {
                return Object.assign({}, defaultParams, JSON.parse(stdinBuffer.trim()));
            }
        } catch {}
    }

    return defaultParams;
}

function run() {
    try {
        const { inputFile, outputFile, rawInline, params, firstInline, secondInline } = parseArgs();
        const inputData = readInput(inputFile, rawInline, params);

        if (firstInline) {
            try { inputData.first = JSON.parse(firstInline); } catch { throw new Error('--first 必須是 JSON 物件'); }
        }
        if (secondInline) {
            try { inputData.second = JSON.parse(secondInline); } catch { throw new Error('--second 必須是 JSON 物件'); }
        }

        let result;
        if (inputData.mode === 'match') {
            if (!inputData.first || !inputData.second) throw new Error('--match 需要 first 與 second 雙方出生資料（可用 JSON stdin、--input、--first/--second）');
            result = evaluateZiweiMatch({ first: inputData.first, second: inputData.second });
        } else if (inputData.mode === 'patterns') {
            const chart = calculateZiweiChart(inputData);
            const filter = inputData.patterns && inputData.patterns !== true
                ? String(inputData.patterns).split(',').map((name) => name.trim()).filter(Boolean)
                : null;
            result = {
                patterns: filter ? chart.patterns.filter((pattern) => filter.includes(pattern.name)) : chart.patterns
            };
            if (inputData.full || inputData.chart) {
                result.chart = chart;
            }
        } else if (inputData.mode === 'domain') {
            const chart = calculateZiweiChart(inputData);
            const topic = inputData.domain || 'overview';
            result = {
                topic,
                domain: chart.domains?.[topic] || chart.domains?.overview
            };
        } else if (inputData.mode === 'all-domains') {
            const chart = calculateZiweiChart(inputData);
            result = {
                domains: chart.domains,
                topics: chart.topics
            };
        } else if (inputData.mode === 'male-size') {
            const rawSex = inputData.sex;
            const normalizedSex = (rawSex === '男' || rawSex === 'male') ? '男' : (rawSex === '女' || rawSex === 'female') ? '女' : (rawSex === undefined ? '男' : null);
            if (!normalizedSex) {
                throw new Error('請選擇有效性別（男），男生真實尺寸評估僅適用於男性命盤。');
            }
            if (normalizedSex !== '男') {
                throw new Error('男生真實尺寸評估僅適用於男性命盤。女性生理健康請參照疾厄宮主星分析。');
            }
            inputData.sex = '男';
            result = evaluateMaleSize(inputData);
        } else if (inputData.mode === 'spouse' || inputData.mode === 'future-spouse') {
            result = evaluateFutureSpouse(inputData);
        } else {
            result = calculateZiweiChart(inputData);
        }
        const jsonString = JSON.stringify(result, null, 2);

        if (outputFile) {
            fs.writeFileSync(outputFile, jsonString, 'utf-8');
        } else {
            console.log(jsonString);
        }
    } catch (err) {
        console.error('Ziwei CLI Error:', err.message);
        process.exit(1);
    }
}

run();
