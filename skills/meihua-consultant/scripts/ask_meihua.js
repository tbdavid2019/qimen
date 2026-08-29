#!/usr/bin/env node

/**
 * ask_meihua.js
 * Standalone CLI script for Meihua Yishu Consultant Skill
 * Usage:
 *   node ask_meihua.js '{"question":"明天面試順利嗎？","method":"time","purpose":"事業"}'
 *   node ask_meihua.js '{"question":"投資計畫如何？","method":"text","text":"吉祥如意"}'
 *   node ask_meihua.js "明天天氣如何？" "time" "綜合"
 */

const { readJsonOrStdin } = require('../../_shared/cli-input');

async function readInput() {
    return readJsonOrStdin(process.argv.slice(2), ['question', 'method', 'purpose'], { method: 'time', purpose: '綜合' });
}

async function main() {
    const input = await readInput();
    if (!input.question) {
        process.stderr.write('Error: question is required\nUsage: node ask_meihua.js <question|json>\n');
        process.exitCode = 1;
        return;
    }
    const baseUrl = (process.env.QIMEN_API_BASE_URL || 'https://qi.david888.com').replace(/\/$/, '');
    const response = await fetch(`${baseUrl}/api/meihua-question`, {
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
