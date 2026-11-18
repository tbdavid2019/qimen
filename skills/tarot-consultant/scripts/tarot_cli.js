#!/usr/bin/env node
/**
 * 塔羅抽牌標準 CLI 工具 (純 Node.js 零依賴實作)
 * 支援 --spread, --question, --seed, --time-factor, --variant
 */

const _rt = (() => { const _fs = require('node:fs'), _path = require('node:path'), _os = require('node:os'); const _eh = process.env.QIMEN_FORTUNE_HOME || process.env.FORTUNE_HOME; const _c = [_path.join(__dirname, '../../_shared/runtime.js'), ...(_eh ? [_path.join(_eh, 'engine', 'skills/_shared/runtime.js'), _path.join(_eh, 'skills/_shared/runtime.js')] : []), _path.join(_os.homedir(), '.888qi-fortune', 'engine', 'skills/_shared/runtime.js')].find((p) => _fs.existsSync(p)); if (!_c) throw new Error('888qi-fortune runtime not found. Run: npx -y 888qi-fortune@latest install'); return require(_c); })();
const path = require('path');
const { drawCards, SPREADS, calculateTarotNumerology } = _rt.requireLib('tarot.js');

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
        } else if ((arg === '--birth-date' || arg === '--birthDate' || arg === '-d') && args[i + 1]) {
            params.birthDate = args[++i];
            params.mode = 'numerology';
        } else if (arg === '--numerology') {
            params.mode = 'numerology';
        }
    }

    return params;
}

function run() {
    try {
        const params = parseArgs();
        if (params.mode === 'numerology' || params.birthDate) {
            const numResult = calculateTarotNumerology(params.birthDate);
            if (numResult.error) {
                console.error(JSON.stringify({ success: false, error: numResult.error }));
                process.exit(1);
            }
            console.log(JSON.stringify({ success: true, ...numResult }, null, 2));
            return;
        }
        const result = drawCards(params);
        console.log(JSON.stringify(result, null, 2));
    } catch (err) {
        console.error(JSON.stringify({ success: false, error: err.message }));
        process.exit(1);
    }
}

run();
