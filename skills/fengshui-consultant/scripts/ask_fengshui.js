#!/usr/bin/env node

const { readJsonOrStdin } = require('../../_shared/cli-input');

async function readInput() {
    return readJsonOrStdin(process.argv.slice(2), [], {});
}

async function main() {
    const input = await readInput();
    // Keep documented --layout/--entry-path flags equivalent to API JSON.
    if (typeof input.layout === 'string' && input.layoutObjects === undefined) {
        try { input.layoutObjects = JSON.parse(input.layout); } catch { input.layoutObjects = input.layout; }
        delete input.layout;
    }
    if (typeof input.layoutObjects === 'string') {
        try { input.layoutObjects = JSON.parse(input.layoutObjects); } catch {}
    }
    if (typeof input.entryPath === 'string') {
        try { input.entryPath = JSON.parse(input.entryPath); } catch { input.entryPath = input.entryPath.split(',').map(value => value.trim()).filter(Boolean); }
    }
    const baseUrl = (process.env.QIMEN_API_BASE_URL || 'https://qi.david888.com').replace(/\/$/, '');
    const endpoint = input.mode === 'evaluate-layout' ? '/api/fengshui/evaluate-layout' : '/api/fengshui-question';
    if (input.mode === 'evaluate-layout') delete input.question;
    const response = await fetch(`${baseUrl}${endpoint}`, {
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
