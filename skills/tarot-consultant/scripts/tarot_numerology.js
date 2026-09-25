#!/usr/bin/env node
/**
 * 塔羅生命靈數與靈魂象徵牌 CLI 工具 (純 Node.js 零依賴實作)
 * 支援 --birth-date (或 -d), stdin JSON, inline JSON
 * 演算法：西元出生年月日各數位相加歸約至個位數（1~9），對應大阿爾克那靈魂原型牌
 */

const fs = require('fs');
const path = require('path');
const { calculateTarotNumerology } = require(path.join(__dirname, '../../../lib/tarot.js'));

function parseArgs() {
    const args = process.argv.slice(2);
    let birthDate = '';
    let question = '';

    // Check for inline JSON argument
    if (args.length === 1 && args[0].startsWith('{') && args[0].endsWith('}')) {
        try {
            const parsed = JSON.parse(args[0]);
            return {
                birthDate: parsed.birthDate || parsed.birth_date || parsed.date || '',
                question: parsed.question || ''
            };
        } catch (e) {}
    }

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if ((arg === '--birth-date' || arg === '--birthDate' || arg === '-d') && args[i + 1]) {
            birthDate = args[++i];
        } else if ((arg === '--question' || arg === '-q') && args[i + 1]) {
            question = args[++i];
        }
    }

    return { birthDate, question };
}

function run() {
    // If input is piped via stdin
    if (!process.stdin.isTTY) {
        try {
            const input = fs.readFileSync(0, 'utf-8').trim();
            if (input) {
                const parsed = JSON.parse(input);
                const birthDate = parsed.birthDate || parsed.birth_date || parsed.date || '';
                const result = calculateTarotNumerology(birthDate);
                if (result.error) {
                    console.error(JSON.stringify({ success: false, error: result.error }, null, 2));
                    process.exit(1);
                }
                console.log(JSON.stringify({ success: true, ...result }, null, 2));
                return;
            }
        } catch (err) {
            // fallback to CLI args
        }
    }

    const { birthDate, question } = parseArgs();
    if (!birthDate) {
        console.error(JSON.stringify({
            success: false,
            error: '請提供西元出生年月日（例如：--birth-date 1981-08-11）'
        }, null, 2));
        process.exit(1);
    }

    const result = calculateTarotNumerology(birthDate);
    if (result.error) {
        console.error(JSON.stringify({ success: false, error: result.error }, null, 2));
        process.exit(1);
    }

    console.log(JSON.stringify({ success: true, question, ...result }, null, 2));
}

run();
