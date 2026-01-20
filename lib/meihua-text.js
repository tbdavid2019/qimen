const fs = require('fs');
const path = require('path');

const YAOCI_PATH = path.join(__dirname, '..', 'meihua-yishu', 'references', 'yaoci.md');

const POSITION_INDEX = {
    '初九': 1, '初六': 1,
    '九二': 2, '六二': 2,
    '九三': 3, '六三': 3,
    '九四': 4, '六四': 4,
    '九五': 5, '六五': 5,
    '上九': 6, '上六': 6
};

let cache = null;

function loadTextData() {
    if (cache) {
        return cache;
    }

    const content = fs.readFileSync(YAOCI_PATH, 'utf8');
    const lines = content.split(/\r?\n/);
    const data = {};
    let current = null;

    lines.forEach((line) => {
        const headerMatch = line.match(/^###\s*第(\d+)卦\s+(.+?)\s/);
        if (headerMatch) {
            const num = Number.parseInt(headerMatch[1], 10);
            const name = headerMatch[2].trim();
            current = { num, name, guaCi: '', yaoci: {}, extras: [] };
            data[num] = current;
            return;
        }

        if (!current) {
            return;
        }

        const guaciMatch = line.match(/^\*\*卦辭\*\*：(.+)/);
        if (guaciMatch) {
            current.guaCi = guaciMatch[1].trim();
            return;
        }

        if (line.startsWith('|')) {
            const cells = line.split('|').map((cell) => cell.trim()).filter(Boolean);
            if (cells.length < 2 || cells[0] === '爻位' || cells[0].startsWith('---')) {
                return;
            }

            const position = cells[0];
            const text = cells[1] || '';
            const plain = cells[2] || '';
            const index = POSITION_INDEX[position];

            if (index) {
                current.yaoci[index] = { index, position, text, plain };
            } else {
                current.extras.push({ position, text, plain });
            }
        }
    });

    cache = data;
    return data;
}

function getHexagramText(num) {
    const data = loadTextData();
    const entry = data[num];
    if (!entry) {
        return null;
    }

    const yaoci = [];
    for (let i = 1; i <= 6; i += 1) {
        yaoci.push(entry.yaoci[i] || { index: i, position: '', text: '', plain: '' });
    }

    return {
        num: entry.num,
        name: entry.name,
        guaCi: entry.guaCi,
        yaoci,
        extras: entry.extras || []
    };
}

module.exports = {
    getHexagramText
};
