#!/usr/bin/env node

/**
 * ask_liuyao.js
 * Standalone CLI script for Liu Yao Divination (六爻神卦 / 京房納甲) Consultant Skill
 * Usage:
 *   node ask_liuyao.js '{"question":"今年事業發展","method":"time","category":"事業升遷"}'
 *   node ask_liuyao.js --question "這筆投資能賺錢嗎？" --method coins --category "求財投資"
 *   node ask_liuyao.js --question "何時有轉機" --lines 789687
 *   node ask_liuyao.js "今年考試能錄取嗎？" "time" "考試學業"
 */

const _rt = (() => { const _fs = require('node:fs'), _path = require('node:path'), _os = require('node:os'); const _eh = process.env.QIMEN_FORTUNE_HOME || process.env.FORTUNE_HOME; const _c = [_path.join(__dirname, '../../_shared/runtime.js'), ...(_eh ? [_path.join(_eh, 'engine', 'skills/_shared/runtime.js'), _path.join(_eh, 'skills/_shared/runtime.js')] : []), _path.join(_os.homedir(), '.888qi-fortune', 'engine', 'skills/_shared/runtime.js')].find((p) => _fs.existsSync(p)); if (!_c) throw new Error('888qi-fortune runtime not found. Run: npx -y 888qi-fortune@latest install'); return require(_c); })();
const { readJsonOrStdin } = _rt;
const { calculateLiuyao } = _rt.requireLib('liuyao');
const { evaluateDecisionCombo } = _rt.requireLib('advanced-wisdom');

async function readInput() {
    return readJsonOrStdin(
        process.argv.slice(2),
        ['question', 'method', 'category'],
        { method: 'coins', category: '綜合運勢', gender: '男' }
    );
}

async function main() {
    const input = await readInput();
    if (!input.question && !input.lines) {
        process.stderr.write('Error: question or lines is required\nUsage: node ask_liuyao.js <question|json>\n');
        process.exitCode = 1;
        return;
    }

    if (input.mode === 'combo' || input.method === 'combo' || input.combo === true) {
        const combo = evaluateDecisionCombo({
            question: input.question,
            datetime: input.datetime,
            category: input.category,
            purpose: input.purpose
        });
        process.stdout.write(`${JSON.stringify({ success: true, combo, ...combo }, null, 2)}\n`);
        return;
    }

    const baseUrl = (process.env.QIMEN_API_BASE_URL || '').replace(/\/$/, '');

    // 若設定遠端 QIMEN_API_BASE_URL，優先呼叫 HTTP API；否則直接本地計算（便於本機離線與快速測試）
    if (baseUrl) {
        const response = await fetch(`${baseUrl}/api/liuyao-question`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(input)
        });
        const body = await response.json();
        process.stdout.write(`${JSON.stringify(body, null, 2)}\n`);
        if (!response.ok || body.success === false) process.exitCode = 1;
    } else {
        const result = calculateLiuyao(input);
        const output = {
            success: true,
            result,
            input
        };
        process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
    }
}

main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
});
