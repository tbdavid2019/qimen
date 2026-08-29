#!/usr/bin/env node

const { readJsonOrStdin } = require('../../_shared/cli-input');

async function readInput() {
    return readJsonOrStdin(process.argv.slice(2), [], {});
}

async function main() {
    const input = await readInput();
    const baseUrl = (process.env.QIMEN_API_BASE_URL || 'https://qi.david888.com').replace(/\/$/, '');
    const response = await fetch(`${baseUrl}/api/tarot-question`, {
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
