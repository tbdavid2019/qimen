#!/usr/bin/env node
/**
 * 八字命理標準排盤 CLI 工具 (純 Node.js 零依賴實作)
 * 支援 --date/--solar, --lunar, --time, --hour, --shichen, --sex, --place, --deceased-year, --allow-unknown-hour
 */

const fs = require('fs');
const path = require('path');
const { calculateBazi } = require(path.join(__dirname, '../../../lib/bazi2.js'));

function parseArgs() {
    const args = process.argv.slice(2);
    const params = {
        calendar: 'solar',
        sex: '男'
    };

    let rawInline = null;

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if ((arg === '--solar' || arg === '--date') && args[i + 1]) {
            params.date = args[++i];
            params.calendar = 'solar';
        } else if (arg === '--lunar' && args[i + 1]) {
            params.date = args[++i];
            params.calendar = 'lunar';
        } else if (arg === '--leap') {
            params.leap = true;
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
        } else if (arg === '--zi-mode' && args[i + 1]) {
            params.ziMode = args[++i];
        } else if (arg === '--deceased-year' && args[i + 1]) {
            params.deceasedYear = args[++i];
        } else if (arg === '--allow-unknown-hour') {
            params.allowUnknownHour = true;
        } else if (arg === '--input' && args[i + 1]) {
            const raw = args[++i];
            try {
                const parsed = JSON.parse(raw);
                Object.assign(params, parsed);
            } catch {
                if (fs.existsSync(raw)) {
                    Object.assign(params, JSON.parse(fs.readFileSync(raw, 'utf-8')));
                }
            }
        } else if (!arg.startsWith('--')) {
            rawInline = arg;
        }
    }

    if (rawInline) {
        try {
            Object.assign(params, JSON.parse(rawInline));
        } catch {}
    }

    // Try reading from stdin if available synchronously
    try {
        const stdinBuf = fs.readFileSync(0, 'utf-8');
        if (stdinBuf && stdinBuf.trim().startsWith('{')) {
            Object.assign(params, JSON.parse(stdinBuf.trim()));
        }
    } catch {}

    if (!params.date) {
        params.date = '1990-05-15';
    }

    return params;
}

function run() {
    try {
        const input = parseArgs();
        const result = calculateBazi(input);
        console.log(JSON.stringify(result, null, 2));
    } catch (err) {
        console.error(JSON.stringify({ success: false, error: err.message }));
        process.exit(1);
    }
}

run();
