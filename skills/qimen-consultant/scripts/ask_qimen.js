#!/usr/bin/env node

/**
 * ask_qimen.js
 * Standalone CLI script for Qimen Dunjia Consultant Skill
 * Usage:
 *   node ask_qimen.js '{"question":"今天適合換工作嗎？","purpose":"事業","mode":"advanced"}'
 *   node ask_qimen.js "今天適合換工作嗎？" "2026-08-27T10:00:00" "事業"
 */

const _rt = (() => { const _fs = require('node:fs'), _path = require('node:path'), _os = require('node:os'); const _eh = process.env.QIMEN_FORTUNE_HOME || process.env.FORTUNE_HOME; const _c = [_path.join(__dirname, '../../_shared/runtime.js'), ...(_eh ? [_path.join(_eh, 'engine', 'skills/_shared/runtime.js'), _path.join(_eh, 'skills/_shared/runtime.js')] : []), _path.join(_os.homedir(), '.888qi-fortune', 'engine', 'skills/_shared/runtime.js')].find((p) => _fs.existsSync(p)); if (!_c) throw new Error('888qi-fortune runtime not found. Run: npx -y 888qi-fortune@latest install'); return require(_c); })();
const { readJsonOrStdin } = _rt;

async function readInput() {
    return readJsonOrStdin(process.argv.slice(2), ['question', 'datetime', 'purpose', 'mode'], { mode: 'advanced', purpose: '綜合' });
}

async function main() {
    const input = await readInput();
    if (!input.question) {
        process.stderr.write('Error: question is required\nUsage: node ask_qimen.js <question|json>\n');
        process.exitCode = 1;
        return;
    }
    const baseUrl = (process.env.QIMEN_API_BASE_URL || 'https://qi.david888.com').replace(/\/$/, '');
    const response = await fetch(`${baseUrl}/api/qimen-question`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
    });
    const body = await response.json();
    process.stdout.write(`${JSON.stringify(body, null, 2)}\n`);
    if (!response.ok || body.success === false) process.exitCode = 1;
}

main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
});
