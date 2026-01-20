const path = require('path');
const { execFileSync } = require('child_process');

const meihua = require('./lib/meihua');

const scriptPath = path.join(__dirname, 'meihua-yishu', 'scripts', 'meihua_calc.py');
const pythonBin = process.env.MEIHUA_PYTHON || 'python3';

function runPython(args) {
    try {
        return execFileSync(pythonBin, [scriptPath, ...args], { encoding: 'utf8' });
    } catch (error) {
        if (pythonBin === 'python3') {
            return execFileSync('python', [scriptPath, ...args], { encoding: 'utf8' });
        }
        throw error;
    }
}

function parsePythonOutput(output) {
    const hexMatches = [...output.matchAll(/第\s*(\d+)\s*卦：([^\r\n]+)/g)];
    const bengua = hexMatches[0] ? { num: Number(hexMatches[0][1]), name: hexMatches[0][2].trim() } : null;
    const biangua = hexMatches[1] ? { num: Number(hexMatches[1][1]), name: hexMatches[1][2].trim() } : null;
    const huguaMatch = output.match(/【四、互卦】\s*\r?\n\s*([^（\r\n]+)/);
    const hugua = huguaMatch ? { name: huguaMatch[1].trim() } : null;
    const wuxingMatch = output.match(/生克：([^\r\n]+)/);
    const wuxingRelation = wuxingMatch ? wuxingMatch[1].trim() : null;

    return { bengua, biangua, hugua, wuxingRelation };
}

function compareResult(label, jsResult, pyResult) {
    const issues = [];

    if (!pyResult.bengua || !pyResult.biangua || !pyResult.hugua) {
        issues.push('無法解析 Python 輸出');
    } else {
        if (jsResult.bengua.num !== pyResult.bengua.num || jsResult.bengua.name !== pyResult.bengua.name) {
            issues.push(`本卦不一致：JS(${jsResult.bengua.num} ${jsResult.bengua.name}) vs PY(${pyResult.bengua.num} ${pyResult.bengua.name})`);
        }
        if (jsResult.biangua.num !== pyResult.biangua.num || jsResult.biangua.name !== pyResult.biangua.name) {
            issues.push(`變卦不一致：JS(${jsResult.biangua.num} ${jsResult.biangua.name}) vs PY(${pyResult.biangua.num} ${pyResult.biangua.name})`);
        }
        if (jsResult.hugua.name !== pyResult.hugua.name) {
            issues.push(`互卦不一致：JS(${jsResult.hugua.name}) vs PY(${pyResult.hugua.name})`);
        }
        if (pyResult.wuxingRelation && jsResult.wuxingRelation !== pyResult.wuxingRelation) {
            issues.push(`五行生克不一致：JS(${jsResult.wuxingRelation}) vs PY(${pyResult.wuxingRelation})`);
        }
    }

    if (issues.length === 0) {
        console.log(`✅ ${label} 一致`);
    } else {
        console.log(`❌ ${label} 不一致`);
        issues.forEach((issue) => console.log(`   - ${issue}`));
    }
}

function testTimeCase() {
    const args = ['gregorian', '2026', '1', '20', '15'];
    const output = runPython(args);
    const pyResult = parsePythonOutput(output);
    const jsResult = meihua.qiguaByGregorianComponents(2026, 1, 20, 15);

    compareResult('時間起卦 (2026-01-20 15:00)', jsResult, pyResult);
}

function testNumberCase() {
    const args = ['num', '6', '8', '3'];
    const output = runPython(args);
    const pyResult = parsePythonOutput(output);
    const jsResult = meihua.qiguaByNumbers(6, 8, 3);

    compareResult('數字起卦 (6, 8, 3)', jsResult, pyResult);
}

console.log('=== 梅花易數 JS vs Python 對照測試 ===');
testTimeCase();
testNumberCase();
