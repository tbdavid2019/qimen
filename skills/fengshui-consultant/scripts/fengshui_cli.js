#!/usr/bin/env node
/**
 * 易經風水與形勢巒頭標準排盤 CLI 工具 (純 Node.js 零依賴實作)
 * 支援 24山三元玄空排盤、八宅明鏡、巒頭形煞診斷與協紀辨方擇日
 */

const fs = require('fs');
const path = require('path');
const { calculateFengShui, diagnoseShaqi, diagnoseLuantou, getAllShaQiLibrary, chooseZeri } = require(path.join(__dirname, '../../../lib/fengshui.js'));

function parseArgs() {
    const args = process.argv.slice(2);
    let inputFile = null;
    let outputFile = null;
    const params = {
        mode: 'yangzhai',
        facing: '南',
        moveInYear: 2026,
        residentYear: 1990,
        sex: '男',
        year: 2026
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
        } else if (arg === '--facing' && args[i + 1]) {
            params.facing = args[++i];
        } else if (arg === '--move-in' && args[i + 1]) {
            params.moveInYear = Number(args[++i]);
        } else if (arg === '--resident-year' && args[i + 1]) {
            params.residentYear = Number(args[++i]);
        } else if (arg === '--sex' && args[i + 1]) {
            params.sex = args[++i];
        } else if (arg === '--year' && args[i + 1]) {
            params.year = Number(args[++i]);
        } else if (arg === '--sha' && args[i + 1]) {
            params.shaType = args[++i];
            params.mode = 'shaqi';
        } else if (arg === '--sha-list' && args[i + 1]) {
            params.shaList = args[++i].split(',');
            params.mode = 'luantou';
        } else if (arg === '--matter' && args[i + 1]) {
            params.matter = args[++i];
            params.mode = 'zeri';
        } else if (arg === '--month' && args[i + 1]) {
            params.month = Number(args[++i]);
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
        if (inputData.mode === 'shaqi') {
            result = diagnoseShaqi(inputData.shaType || inputData.question || '天斬煞');
        } else if (inputData.mode === 'luantou') {
            result = diagnoseLuantou(inputData.shaList || [inputData.shaType || '天斬煞']);
        } else if (inputData.mode === 'zeri') {
            result = chooseZeri(inputData.matter || '入宅/喬遷', inputData.year || 2026, inputData.month || 5);
        } else {
            result = calculateFengShui(inputData);
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
