#!/usr/bin/env node
/**
 * 奇門遁甲標準排盤 CLI 工具 (純 Node.js 零依賴實作)
 * 輸出完整 mainline-cn-v1 JSON 格式，全面對齊 FANzR-arch/Numerologist_skills
 */

const fs = require('fs');
const path = require('path');
const { Lunar, Solar } = require('lunar-javascript');
const qimen = require(path.join(__dirname, '../../../lib/qimen.js'));

const GENERATE = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' };
const CONTROL = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' };

const STAR_ELEMENTS = {
    天蓬: '水', 天芮: '土', 天衝: '木', 天輔: '木',
    天禽: '土', 天心: '金', 天柱: '金', 天任: '土', 天英: '火'
};

const DOOR_ELEMENTS = {
    休門: '水', 生門: '土', 傷門: '木', 杜門: '木',
    景門: '火', 死門: '土', 驚門: '金', 開門: '金'
};

const XUN_YI = {
    甲子: '戊',
    甲戌: '己',
    甲申: '庚',
    甲午: '辛',
    甲辰: '壬',
    甲寅: '癸'
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

function getElementRelation(elA, elB) {
    if (!elA || !elB) return '—';
    if (elA === elB) return '比和';
    if (GENERATE[elA] === elB) return '我生他';
    if (GENERATE[elB] === elA) return '他生我';
    if (CONTROL[elA] === elB) return '我克他';
    if (CONTROL[elB] === elA) return '他克我';
    return '相生';
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
    if (inputFile && fs.existsSync(inputFile)) {
        return JSON.parse(fs.readFileSync(inputFile, 'utf-8'));
    }
    return {
        question: '綜合運勢分析',
        question_type: '綜合',
        time_input: null,
        calendar_type: 'now',
        ruleset: 'mainline-cn-v1'
    };
}

function parseTargetDate(inputData) {
    if (!inputData.time_input) return new Date();

    if (inputData.calendar_type === 'lunar' && typeof inputData.time_input === 'string') {
        const parts = inputData.time_input.split(/[- :]/).map(Number);
        if (parts.length >= 3) {
            const lunar = Lunar.fromYmd(parts[0], parts[1], parts[2]);
            const solar = lunar.getSolar();
            return new Date(solar.getYear(), solar.getMonth() - 1, solar.getDay(), parts[3] || 12, parts[4] || 0);
        }
    }

    return new Date(inputData.time_input);
}

function run() {
    try {
        const { inputFile, outputFile } = parseArgs();
        const inputData = readInput(inputFile);
        const targetDate = parseTargetDate(inputData);

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
            const palElement = gongElements[k] || '土';
            const starEl = star ? (STAR_ELEMENTS[star] || '土') : '';
            const doorEl = door ? (DOOR_ELEMENTS[door] || '木') : '';

            if (door && i !== 5) doorIndex[door] = i;
            if (star) starIndex[star] = i;

            palaces.push({
                palace: i,
                name: gongNames[k] || `${i}宮`,
                direction: gongDirections[k] || '',
                trigram: gongNames[k] || '',
                element: palElement,
                earth_stem: earthStem,
                sky_stem: skyStem,
                stem_relation: skyStem && earthStem ? (skyStem === earthStem ? '比和' : '克應') : '常態',
                star: star,
                star_element: starEl,
                star_palace_relation: getElementRelation(starEl, palElement),
                door: i === 5 ? null : door,
                door_element: doorEl,
                door_palace_relation: i === 5 ? null : getElementRelation(doorEl, palElement),
                god: i === 5 ? null : god,
                is_center: i === 5,
                hosts_center: i === 2,
                hosting_note: i === 2 ? '天禽星隨天芮星落坤二宮' : null
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
        const dayBranchChar = panResult.siZhu?.day?.[1] || '子';
        const yearStemChar = panResult.siZhu?.year?.[0] || '';
        const monthStemChar = panResult.siZhu?.month?.[0] || '';
        const timeStemChar = panResult.siZhu?.time?.[0] || '';

        const dayXun = getXun(panResult.siZhu?.day);
        const timeXun = getXun(panResult.siZhu?.time);
        const hiddenYi = XUN_YI[panResult.xunShou] || '戊';

        // 時干為甲時改用旬首隱儀定位落宮
        const effectiveTimeStem = timeStemChar === '甲' ? hiddenYi : timeStemChar;

        // 依日支三合查驛馬
        const yima = YIMA_MAP[dayBranchChar] || { branch: '寅', palace: 8 };

        const warnings = [];
        if (!inputData.time_input) {
            warnings.push('使用執行當前時間自動起盤');
        }

        const standardOutput = {
            schema_version: 'mainline-cn-v1',
            normalized_input: {
                question: inputData.question || '綜合運勢分析',
                question_type: inputData.question_type || '綜合',
                calendar_type: inputData.calendar_type || 'solar',
                solar_time: targetDate.toISOString().replace('T', ' ').substring(0, 19),
                lunar_time: panResult.solarTerm?.name || '',
                location: inputData.location || { province: '標準', city: '標準', timezone: 'Asia/Taipei' },
                ruleset: inputData.ruleset || 'mainline-cn-v1'
            },
            ganzhi: {
                year: panResult.siZhu?.year || '',
                month: panResult.siZhu?.month || '',
                day: panResult.siZhu?.day || '',
                time: panResult.siZhu?.time || '',
                day_xun: dayXun,
                time_xun: timeXun,
                jieqi: panResult.solarTerm?.name || '',
                ju: panResult.ju || '陽遁一局'
            },
            chart: {
                palaces,
                zhifu: {
                    star: panResult.zhiFu || '天禽',
                    original_palace: 5,
                    current_palace: starIndex[panResult.zhiFu] || 2
                },
                zhishi: {
                    door: panResult.zhiShi || '死門',
                    original_palace: 2,
                    current_palace: doorIndex[panResult.zhiShi] || 2
                },
                xunshou: panResult.xunShou || '甲子',
                hidden_yi: hiddenYi,
                yima: yima,
                day_stem: {
                    stem: dayStemChar,
                    palace: findStemPalace(dayStemChar)
                },
                hour_stem: {
                    stem: timeStemChar,
                    effective_stem: effectiveTimeStem,
                    palace: findStemPalace(effectiveTimeStem)
                },
                year_stem: {
                    stem: yearStemChar,
                    palace: findStemPalace(yearStemChar)
                },
                month_stem: {
                    stem: monthStemChar,
                    palace: findStemPalace(monthStemChar)
                },
                yongshen: panResult.yongshen || {}
            },
            warnings
        };

        const jsonStr = JSON.stringify(standardOutput, null, 2);
        if (outputFile) {
            fs.writeFileSync(outputFile, jsonStr, 'utf-8');
        } else {
            console.log(jsonStr);
        }
    } catch (err) {
        console.error(JSON.stringify({ success: false, error: err.message }));
        process.exit(1);
    }
}

run();
