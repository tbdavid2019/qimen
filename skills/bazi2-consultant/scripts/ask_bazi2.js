#!/usr/bin/env node

const _rt = (() => { const _fs = require('node:fs'), _path = require('node:path'), _os = require('node:os'); const _eh = process.env.QIMEN_FORTUNE_HOME || process.env.FORTUNE_HOME; const _c = [_path.join(__dirname, '../../_shared/runtime.js'), ...(_eh ? [_path.join(_eh, 'engine', 'skills/_shared/runtime.js'), _path.join(_eh, 'skills/_shared/runtime.js')] : []), _path.join(_os.homedir(), '.888qi-fortune', 'engine', 'skills/_shared/runtime.js')].find((p) => _fs.existsSync(p)); if (!_c) throw new Error('888qi-fortune runtime not found. Run: npx -y 888qi-fortune@latest install'); return require(_c); })();
const { readJsonOrStdin } = _rt;

async function readInput() {
    return readJsonOrStdin(process.argv.slice(2), [], {});
}

async function main() {
    const input = await readInput();
    const baseUrl = (process.env.QIMEN_API_BASE_URL || 'https://qi.david888.com').replace(/\/$/, '');
    const response = await fetch(`${baseUrl}/api/bazi2-question`, {
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
