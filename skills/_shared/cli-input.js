#!/usr/bin/env node

/**
 * Shared input reader for consultant Skill scripts.
 * Supports inline JSON, JSON from stdin, and --key value CLI arguments.
 */
async function readCliInput(argv, positionalKeys = [], defaults = {}) {
    const args = Array.isArray(argv) ? argv : [];
    if (args[0]) {
        try {
            const parsed = JSON.parse(args[0]);
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return { ...defaults, ...parsed };
        } catch (_error) {
            // Continue with flag/positional parsing.
        }
    }

    const input = { ...defaults };
    let positionalIndex = 0;
    for (let i = 0; i < args.length; i += 1) {
        const arg = args[i];
        if (arg.startsWith('--')) {
            const token = arg.slice(2);
            const equalsIndex = token.indexOf('=');
            const rawKey = equalsIndex >= 0 ? token.slice(0, equalsIndex) : token;
            const key = rawKey.replace(/-([a-z])/g, (_match, letter) => letter.toUpperCase());
            const inlineValue = equalsIndex >= 0 ? token.slice(equalsIndex + 1) : undefined;
            if (inlineValue !== undefined) {
                input[key] = parseStructuredValue(key, inlineValue);
            } else if (args[i + 1] && !args[i + 1].startsWith('--')) {
                input[key] = parseStructuredValue(key, args[++i]);
            } else {
                input[key] = true;
            }
        } else if (positionalKeys[positionalIndex]) {
            input[positionalKeys[positionalIndex]] = arg;
            positionalIndex += 1;
        }
    }
    if (input.allowUnknownHour === 'true') input.allowUnknownHour = true;
    if (input.allowUnknownHour === 'false') input.allowUnknownHour = false;
    return input;
}

function parseStructuredValue(key, value) {
    if (!/history|chart|^first$|^second$|cards/i.test(key)) return value;
    try {
        return JSON.parse(value);
    } catch (_error) {
        return value;
    }
}

async function readJsonOrStdin(argv, positionalKeys = [], defaults = {}) {
    if (argv.length > 0) return readCliInput(argv, positionalKeys, defaults);
    if (process.stdin.isTTY) return { ...defaults };
    const chunks = [];
    for await (const chunk of process.stdin) chunks.push(chunk);
    const text = Buffer.concat(chunks).toString('utf8').trim();
    if (!text) return { ...defaults };
    return readCliInput([text], positionalKeys, defaults);
}

module.exports = { readCliInput, readJsonOrStdin };
