#!/usr/bin/env node
/**
 * 塔羅抽牌標準 CLI 工具 (純 Node.js 零依賴實作)
 * 支援 --spread, --question, --seed, --time-factor, --variant
 */

const path = require('path');
const { drawCards, SPREADS } = require(path.join(__dirname, '../../../lib/tarot.js'));

function parseArgs() {
    const args = process.argv.slice(2);
    const params = {
        spread: 'three',
        question: ''
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === '--spread' && args[i + 1]) {
            params.spread = args[++i];
        } else if (arg === '--question' && args[i + 1]) {
            params.question = args[++i];
        } else if (arg === '--seed' && args[i + 1]) {
            params.seed = args[++i];
        } else if (arg === '--time-factor' && args[i + 1]) {
            params.timeFactor = args[++i];
        } else if (arg === '--variant' && args[i + 1]) {
            params.variant = args[++i];
        }
    }

    return params;
}

function run() {
    try {
        const params = parseArgs();
        const result = drawCards(params);
        console.log(JSON.stringify(result, null, 2));
    } catch (err) {
        console.error(JSON.stringify({ success: false, error: err.message }));
        process.exit(1);
    }
}

run();
