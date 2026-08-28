#!/usr/bin/env node
/**
 * 奇門遁甲標準排盤 CLI 工具 (純 Node.js 零依賴實作)
 * 遵循 mainline-cn-v1 標準規格輸出結構化排盤 JSON
 */

const fs = require('fs');
const path = require('path');
const qimen = require(path.join(__dirname, '../../../lib/qimen.js'));

const STAR_ELEMENTS = {
    天蓬: '水', 天任: '土', 天沖: '木', 天輔: '木', 天禽: '土', 天英: '火', 天芮: '土', 天柱: '金', 天心: '金'
};
const DOOR_ELEMENTS = {
    休門: '水', 生門: '土', 傷門: '木', 杜門: '木', 景門: '火', 死門: '土', 驚門: '金', 開門: '金'
};
const XUN_YI = {
    甲子: '戊', 甲戌: '己', 甲申: '庚', 甲午: '辛', 甲辰: '壬', 甲寅: '癸'
};
const YIMA_MAP = {
    申: { branch: '寅', palace: 8 }, 子: { branch: '寅', palace: 8 }, 辰: { branch: '寅', palace: 8 },
    寅: { branch: '申', palace: 2 }, 午: { branch: '申', palace: 2 }, 戌: { branch: '申', palace: 2 },
    巳: { branch: '亥', palace: 6 }, 酉: { branch: '亥', palace: 6 }, 丑: { branch: '亥', palace: 6 },
    亥: { branch: '巳', palace: 4 }, 卯: { branch: '巳', palace: 4 }, 未: { branch: '巳', palace: 4 }
};

function getXun(ganzhi) {
    if (!ganzhi || ganzhi.length < 2) return '甲子';
    const stems = '甲乙丙丁戊己庚辛壬癸';
    const branches = '子丑寅卯辰巳午未申酉戌亥';
    const sIdx = stems.indexOf(ganzhi[0]);
    const bIdx = branches.indexOf(ganzhi[1]);
    if (sIdx === -1 || bIdx === -1) return '甲子';
    const diff = (bIdx - sIdx + 12) % 12;
    const xunBranches = { 0: '甲子', 10: '甲戌', 8: '甲申', 6: '甲午', 4: '甲辰', 2: '甲寅' };
    return xunBranches[diff] || '甲子';
}

function parseArgs() {
    const args = process.argv.slice(2);
    let inputFile = null;
    let outputFile = null;

    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--input' && args[i + 1]) {
            inputFile = args[++i];
        } else if (args[i] === '--output' && args[i + 1]) {
            outputFile = args[++i];
        }
    }

    return { inputFile, outputFile };
}

function readInput(inputFile) {
    if (inputFile) {
        if (fs.existsSync(inputFile)) {
            return JSON.parse(fs.readFileSync(inputFile, 'utf-8'));
        }
        try {
            return JSON.parse(inputFile);
        } catch {
            throw new Error(`無法讀取輸入檔案或 JSON: ${inputFile}`);
        }
    }

    try {
        const stdinBuffer = fs.readFileSync(0, 'utf-8');
        if (stdinBuffer.trim()) {
            return JSON.parse(stdinBuffer);
        }
    } catch {
        // Fallback to default
    }

    return {
        question_type: 'general',
        question_goal: '當下吉凶指引',
        time_input: new Date().toISOString(),
        calendar_type: 'now',
        ruleset: 'mainline-cn-v1'
    };
}

function run() {
    try {
        const { inputFile, outputFile } = parseArgs();
        const inputData = readInput(inputFile);

        const targetDate = inputData.time_input ? new Date(inputData.time_input) : new Date();

        // 呼叫本地完整奇門排盤核心
        const panResult = qimen.calculate(targetDate, {
            method: '時家',
            timePrecisionMode: 'traditional',
            purpose: inputData.question_type || '綜合'
        });

        const doorIndex = {};
        const starIndex = {};
        const palaces = [];

        const gongNames = { '1': '坎', '2': '坤', '3': '震', '4': '巽', '5': '中', '6': '乾', '7': '兌', '8': '艮', '9': '離' };
        const gongDirections = { '1': '正北', '2': '西南', '3': '正東', '4': '東南', '5': '中央', '6': '西北', '7': '正西', '8': '東北', '9': '正南' };
        const gongElements = { '1': '水', '2': '土', '3': '木', '4': '木', '5': '土', '6': '金', '7': '金', '8': '土', '9': '火' };

        // 整理九宮
        for (let i = 1; i <= 9; i++) {
            const k = String(i);
            const door = panResult.baMen?.[k] || null;
            const star = panResult.jiuXing?.[k] || (i === 5 ? '天禽' : null);
            const god = panResult.baShen?.[k] || null;
            const earthStem = panResult.diPan?.[k] || '';
            const skyStem = panResult.sanQiLiuYi?.[k] || '';

            if (door && i !== 5) doorIndex[door] = i;
            if (star) starIndex[star] = i;

            palaces.push({
                palace: i,
                name: gongNames[k] || `${i}宮`,
                direction: gongDirections[k] || '',
                trigram: gongNames[k] || '',
                element: gongElements[k] || '',
                earth_stem: earthStem,
                sky_stem: skyStem,
                stem_relation: skyStem && earthStem ? (skyStem === earthStem ? '比和' : '克應') : '常態',
                star: star,
                star_element: star ? (STAR_ELEMENTS[star] || '土') : '',
                door: i === 5 ? null : door,
                door_element: door ? (DOOR_ELEMENTS[door] || '木') : '',
                god: i === 5 ? null : god,
                is_center: i === 5,
                hosts_center: i === 2
            });
        }

        function findStemPalace(stem) {
            if (!stem) return 1;
            for (let i = 1; i <= 9; i++) {
                if (panResult.sanQiLiuYi?.[String(i)] === stem) return i;
            }
            for (let i = 1; i <= 9; i++) {
                if (panResult.diPan?.[String(i)] === stem) return i;
            }
            return 1;
        }

        const dayStemChar = panResult.siZhu?.day?.[0] || '';
        const yearStemChar = panResult.siZhu?.year?.[0] || '';
        const monthStemChar = panResult.siZhu?.month?.[0] || '';
        const timeStemChar = panResult.siZhu?.time?.[0] || '';
        const timeBranchChar = panResult.siZhu?.time?.[1] || panResult.siZhu?.day?.[1] || '子';

        const dayXun = getXun(panResult.siZhu?.day);
        const timeXun = getXun(panResult.siZhu?.time);
        const hiddenYi = XUN_YI[panResult.xunShou] || '戊';
        const yima = YIMA_MAP[timeBranchChar] || { branch: '寅', palace: 8 };

        const standardOutput = {
            schema_version: 'mainline-cn-v1',
            normalized_input: {
                question_type: inputData.question_type || 'general',
                question_goal: inputData.question_goal || '綜合分析',
                time: targetDate.toISOString(),
                location: inputData.location || { country: '台灣', city: '台北', timezone: 'Asia/Taipei' },
                ruleset: inputData.ruleset || 'mainline-cn-v1'
            },
            calendar: {
                solar: panResult.basicInfo?.date || targetDate.toLocaleDateString('zh-TW'),
                lunar: panResult.basicInfo?.lunarDate || '',
                solar_term: panResult.juShu?.jieQiName || '常規節氣'
            },
            ganzhi: {
                year: panResult.siZhu?.year || '',
                month: panResult.siZhu?.month || '',
                day: panResult.siZhu?.day || '',
                time: panResult.siZhu?.time || '',
                day_xun: dayXun,
                time_xun: timeXun
            },
            chart: {
                dun_type: panResult.juShu?.type === 'yin' ? '陰遁' : '陽遁',
                yuan: panResult.juShu?.yuan || '上元',
                ju_number: Number(panResult.juShu?.number || 1),
                xunshou: panResult.xunShou || '甲子',
                hidden_yi: hiddenYi,
                kongwang: panResult.kongWangZhi || [],
                kongwang_palaces: panResult.kongWangGong || [],
                day_kongwang: panResult.dayKongWangZhi || [],
                day_kongwang_palaces: panResult.dayKongWangGong || [],
                time_stem_visible: timeStemChar,
                day_stem: {
                    stem: dayStemChar,
                    palace: findStemPalace(dayStemChar),
                    note: '求測者本人落宮'
                },
                year_stem: {
                    stem: yearStemChar,
                    palace: findStemPalace(yearStemChar),
                    note: '太歲/主管/大環境落宮'
                },
                month_stem: {
                    stem: monthStemChar,
                    palace: findStemPalace(monthStemChar),
                    note: '同輩/競爭對手落宮'
                },
                yima: yima,
                zhifu: { palace: Number(panResult.zhiFuGong || 1), star: panResult.zhiFuXing || '天蓬' },
                zhishi: { palace: Number(panResult.zhiShiGong || 1), door: panResult.zhiShiMen || '休門' },
                door_index: doorIndex,
                star_index: starIndex,
                detected_patterns: panResult.geju || [],
                yongshen: panResult.yongshen || null,
                palaces: palaces
            },
            warnings: []
        };

        const jsonString = JSON.stringify(standardOutput, null, 2);

        if (outputFile) {
            fs.writeFileSync(outputFile, jsonString, 'utf-8');
        } else {
            console.log(jsonString);
        }
    } catch (err) {
        console.error('Qimen CLI Error:', err.message);
        process.exit(1);
    }
}

run();
