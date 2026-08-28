#!/usr/bin/env node
/**
 * 紫微斗數標準排盤 CLI 工具 (純 Node.js 零依賴實作)
 * 輸出標準十二宮、十四主星、廟旺、六吉六煞、生年四化、大限流年與格局 JSON
 */

const fs = require('fs');
const path = require('path');
const { calculateZiweiChart } = require(path.join(__dirname, '../../../lib/ziwei.js'));

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

    let rawInline = null;

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === '--input' && args[i + 1]) {
            inputFile = args[++i];
        } else if (arg === '--output' && args[i + 1]) {
            outputFile = args[++i];
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

        const chart = calculateZiweiChart(inputData);
        const jsonString = JSON.stringify(chart, null, 2);

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
