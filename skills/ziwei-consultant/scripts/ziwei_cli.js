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
        // Fallback
    }

    return {
        date: '1990-05-15',
        time: '12:00',
        sex: '男',
        calendar: 'solar'
    };
}

function run() {
    try {
        const { inputFile, outputFile } = parseArgs();
        const inputData = readInput(inputFile);

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
