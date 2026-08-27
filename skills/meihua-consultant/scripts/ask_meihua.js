#!/usr/bin/env node

/**
 * ask_meihua.js
 * Standalone CLI script for Meihua Yishu Consultant Skill
 * Usage:
 *   node ask_meihua.js '{"question":"明天面試順利嗎？","method":"time","purpose":"事業"}'
 *   node ask_meihua.js '{"question":"投資計畫如何？","method":"text","text":"吉祥如意"}'
 *   node ask_meihua.js "明天天氣如何？" "time" "綜合"
 */

async function readInput() {
    if (process.argv[2]) {
        try {
            return JSON.parse(process.argv[2]);
        } catch (_e) {
            return {
                question: process.argv[2],
                method: process.argv[3] || 'time',
                purpose: process.argv[4] || '綜合'
            };
        }
    }
    if (process.stdin.isTTY) return {};
    const chunks = [];
    for await (const chunk of process.stdin) chunks.push(chunk);
    const text = Buffer.concat(chunks).toString('utf8').trim();
    return text ? JSON.parse(text) : {};
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
