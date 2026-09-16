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
            params.__explicitFacing = true;
        } else if (arg === '--heading' && args[i + 1]) {
            params.heading = Number(args[++i]);
        } else if (arg === '--north-reference' && args[i + 1]) {
            params.northReference = args[++i];
        } else if (arg === '--declination' && args[i + 1]) {
            params.declination = Number(args[++i]);
        } else if (arg === '--heading-source' && args[i + 1]) {
            params.headingSource = args[++i];
        } else if ((arg === '--layout' || arg === '--layout-objects') && args[i + 1]) {
            const raw = args[++i];
            try {
                if (fs.existsSync(raw)) {
                    params.layoutObjects = JSON.parse(fs.readFileSync(raw, 'utf-8'));
                } else {
                    params.layoutObjects = JSON.parse(raw);
                }
            } catch {
                params.layoutObjects = raw;
            }
        } else if (arg === '--entry-path' && args[i + 1]) {
            const raw = args[++i];
            try {
                params.entryPath = JSON.parse(raw);
            } catch {
                params.entryPath = raw.split(',').map(s => s.trim());
            }
        } else if (arg === '--path-quality' && args[i + 1]) {
            params.pathQuality = args[++i];
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
            const parsed = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));
            return Object.assign({}, defaultParams, parsed, { __explicitFacing: defaultParams.__explicitFacing === true || Object.prototype.hasOwnProperty.call(parsed, 'facing') });
        }
        try {
            const parsed = JSON.parse(inputFile);
            return Object.assign({}, defaultParams, parsed, { __explicitFacing: defaultParams.__explicitFacing === true || Object.prototype.hasOwnProperty.call(parsed, 'facing') });
        } catch {}
    }

    if (rawInline) {
        try {
            const parsed = JSON.parse(rawInline);
            return Object.assign({}, defaultParams, parsed, { __explicitFacing: defaultParams.__explicitFacing === true || Object.prototype.hasOwnProperty.call(parsed, 'facing') });
        } catch {}
    }

    if (!process.stdin.isTTY) {
        try {
            const stdinBuffer = fs.readFileSync(0, 'utf-8');
            if (stdinBuffer.trim().startsWith('{')) {
                const parsed = JSON.parse(stdinBuffer.trim());
                return Object.assign({}, defaultParams, parsed, { __explicitFacing: defaultParams.__explicitFacing === true || Object.prototype.hasOwnProperty.call(parsed, 'facing') });
            }
        } catch {}
    }

    return defaultParams;
}

function run() {
    try {
        const { inputFile, outputFile, rawInline, params } = parseArgs();
        const inputData = readInput(inputFile, rawInline, params);
        // A heading is authoritative when no explicit --facing was supplied;
        // the default 南 must not create a false conflict for CLI callers.
        if (inputData.heading !== undefined && !inputData.__explicitFacing) {
            delete inputData.facing;
        }
        delete inputData.__explicitFacing;

        let result;
        if (inputData.mode === 'shaqi') {
            result = diagnoseShaqi(inputData.shaType || inputData.question || '天斬煞');
        } else if (inputData.mode === 'luantou') {
            result = diagnoseLuantou(inputData.shaList || [inputData.shaType || '天斬煞']);
        } else if (inputData.mode === 'zeri') {
            result = chooseZeri(inputData.matter || '入宅/喬遷', inputData.year || 2026, inputData.month || 5);
        } else if (inputData.mode === 'evaluate-layout') {
            // Keep CLI semantics identical to the deterministic HTTP endpoint:
            // calculate orientation and flying-star chart before layout evaluation.
            const report = calculateFengShui(inputData);
            result = {
                success: true,
                orientation: report.orientation || null,
                chart: {
                    period: report.period,
                    pattern: report.pattern,
                    patternDesc: report.patternDesc,
                    flyingStars: report.flyingStars,
                    eightMansions: report.eightMansions
                },
                chartQualification: report.chartQualification || null,
                layoutEvaluation: report.layoutEvaluation || null,
                missingData: report.missingData || [],
                dataQuality: (report.missingData && report.missingData.length > 0) ? 'insufficient' : 'complete'
            };
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
