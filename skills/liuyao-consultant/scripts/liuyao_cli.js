#!/usr/bin/env node
/**
 * 六爻神卦純排盤 CLI 工具 (純 Node.js 零依賴離線實作)
 * 支援 --question, --category, --method (coins, dayan, datetime, manual), --lines, --datetime, --gender
 */

const fs = require('fs');
const path = require('path');
const { calculateLiuyao } = require(path.join(__dirname, '../../../lib/liuyao.js'));

function parseArgs() {
    const args = process.argv.slice(2);
    const params = {
        method: 'coins',
        category: '綜合運勢',
        gender: '男'
    };

    let rawInline = null;

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === '--question' && args[i + 1]) {
            params.question = args[++i];
        } else if (arg === '--category' && args[i + 1]) {
            params.category = args[++i];
        } else if (arg === '--method' && args[i + 1]) {
            params.method = args[++i];
        } else if (arg === '--lines' && args[i + 1]) {
            const rawLines = args[++i];
            try {
                params.lines = JSON.parse(rawLines);
            } catch {
                if (typeof rawLines === 'string') {
                    // 支援 "789687" 或 "7,8,9,6,8,7"
                    params.lines = rawLines.includes(',')
                        ? rawLines.split(',').map(n => Number(n.trim())).filter(n => !isNaN(n))
                        : rawLines.split('').map(n => Number(n)).filter(n => !isNaN(n));
                }
            }
        } else if (arg === '--datetime' && args[i + 1]) {
            params.datetime = args[++i];
        } else if (arg === '--gender' || arg === '--sex') {
            if (args[i + 1]) params.gender = args[++i];
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
    if (!process.stdin.isTTY) {
        try {
            const stdinBuf = fs.readFileSync(0, 'utf-8');
            if (stdinBuf && stdinBuf.trim().startsWith('{')) {
                Object.assign(params, JSON.parse(stdinBuf.trim()));
            }
        } catch {}
    }

    if (params.lines !== undefined) {
        if (Array.isArray(params.lines)) {
            params.lines = params.lines.join('');
        } else {
            params.lines = String(params.lines);
        }
    }

    return params;
}

function run() {
    try {
        const input = parseArgs();
        const result = calculateLiuyao(input);
        console.log(JSON.stringify(result, null, 2));
    } catch (err) {
        console.error(JSON.stringify({ success: false, error: err.message }));
        process.exit(1);
    }
}

run();
