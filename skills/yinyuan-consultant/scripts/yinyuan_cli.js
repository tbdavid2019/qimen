#!/usr/bin/env node
/**
 * 月老姻緣與情感測算標準排盤 CLI 工具 (純 Node.js 零依賴實作)
 * 支援 6 大模式：月老靈籤、生肖配對、紫微夫妻宮、桃花運勢、八字合婚、紅線測算
 */

const fs = require('fs');
const path = require('path');
const {
    drawFortuneStick,
    zodiacMatch,
    ziweiMarriage,
    peachBlossomLuck,
    baziMatchFull,
    redThreadFull
} = require(path.join(__dirname, '../../../lib/yinyuan.js'));

function parseArgs() {
    const args = process.argv.slice(2);
    let inputFile = null;
    let outputFile = null;
    const params = {
        mode: 'fortune',
        question: '姻緣指引'
    };

    let rawInline = null;

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === '--input' && args[i + 1]) {
            inputFile = args[++i];
        } else if (arg === '--output' && args[i + 1]) {
            outputFile = args[++i];
        } else if (arg === '--mode' && args[i + 1]) {
            params.mode = args[++i];
        } else if (arg === '--question' && args[i + 1]) {
            params.question = args[++i];
        } else if (arg === '--name' && args[i + 1]) {
            params.name = args[++i];
        } else if (arg === '--date' && args[i + 1]) {
            params.date = args[++i];
        } else if (arg === '--time' && args[i + 1]) {
            params.time = args[++i];
        } else if (arg === '--sex' && args[i + 1]) {
            params.sex = args[++i];
        } else if (arg === '--first' && args[i + 1]) {
            params.firstZodiac = args[++i];
        } else if (arg === '--second' && args[i + 1]) {
            params.secondZodiac = args[++i];
        } else if (arg === '--first-date' && args[i + 1]) {
            params.firstDate = args[++i];
        } else if (arg === '--second-date' && args[i + 1]) {
            params.secondDate = args[++i];
        } else if (arg === '--seed' && args[i + 1]) {
            params.seed = Number(args[++i]);
        } else if (arg === '--stick-num' && args[i + 1]) {
            params.stickNum = Number(args[++i]);
        } else if (arg === '--status' && args[i + 1]) {
            params.status = args[++i];
        } else if (!arg.startsWith('--')) {
            rawInline = arg;
        }
    }

    return { inputFile, outputFile, rawInline, params };
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

    try {
        const stdinBuffer = fs.readFileSync(0, 'utf-8');
        if (stdinBuffer.trim().startsWith('{')) {
            return Object.assign({}, defaultParams, JSON.parse(stdinBuffer.trim()));
        }
    } catch {}

    return defaultParams;
}

function run() {
    try {
        const { inputFile, outputFile, rawInline, params } = parseArgs();
        const inputData = readInput(inputFile, rawInline, params);

        let result;
        const mode = inputData.mode || 'fortune';

        if (mode === 'zodiac') {
            result = zodiacMatch(inputData.firstZodiac || inputData.first, inputData.secondZodiac || inputData.second);
        } else if (mode === 'ziwei-marriage' || mode === 'marriage-palace') {
            result = ziweiMarriage(inputData);
        } else if (mode === 'peach-blossom' || mode === 'taohua-luck') {
            result = peachBlossomLuck(inputData.firstYear || inputData.date || 1990, inputData.status || '單身');
        } else if (mode === 'bazi-match') {
            result = baziMatchFull(inputData.first || { date: inputData.firstDate }, inputData.second || { date: inputData.secondDate });
        } else if (mode === 'red-thread') {
            result = redThreadFull(inputData);
        } else {
            result = drawFortuneStick(inputData.question, inputData.name, inputData.seed, inputData.stickNum);
        }

        const jsonString = JSON.stringify(result, null, 2);

        if (outputFile) {
            fs.writeFileSync(outputFile, jsonString, 'utf-8');
        } else {
            console.log(jsonString);
        }
    } catch (error) {
        console.error(JSON.stringify({ error: error.message }, null, 2));
        process.exit(1);
    }
}

if (require.main === module) {
    run();
}

module.exports = { run };
