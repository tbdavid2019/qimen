#!/usr/bin/env node

/**
 * Qimen suite MCP Bridge
 * Zero-dependency bridge for qi.david888.com
 * Supports JSON-RPC 2.0 over stdio
 */

const https = require('https');
const readline = require('readline');

// The production API endpoint
const API_BASE = `${(process.env.QIMEN_API_BASE_URL || 'https://qi.david888.com').replace(/\/$/, '')}/api`;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

/**
 * Sends a JSON-RPC 2.0 response to stdout
 */
function sendResponse(id, result = null, error = null) {
  const response = {
    jsonrpc: '2.0',
    id
  };
  if (error) {
    response.error = error;
  } else {
    response.result = result;
  }
  process.stdout.write(JSON.stringify(response) + '\n');
}

/**
 * Sends a JSON-RPC 2.0 error
 */
function sendError(id, code, message) {
  sendResponse(id, null, { code, message });
}

/**
 * Makes a POST request to the remote API using built-in https module
 */
async function makeApiRequest(endpoint, payload) {
  return new Promise((resolve, reject) => {
    const url = `${API_BASE}/${endpoint}`;
    const data = JSON.stringify(payload);

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
      timeout: 30000, // 30s timeout
    };

    const req = https.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          if (res.statusCode >= 400) {
            resolve({ success: false, message: `Server returned status ${res.statusCode}` });
            return;
          }
          resolve(JSON.parse(body));
        } catch (e) {
          reject(new Error('Invalid JSON response from server'));
        }
      });
    });

    req.on('error', (e) => reject(new Error(`Network error: ${e.message}`)));
    req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timed out'));
    });
    
    req.write(data);
    req.end();
  });
}

// Tool definitions conforming to MCP standard
const tools = [
  {
    name: "qimen_divination",
    description: "奇門遁甲專業排盤與大師分析。提供十干克應、三遁吉格、專題用神與主客動靜深度解讀。建議提供具體問題與占問事項。",
    inputSchema: {
      type: "object",
      properties: {
        question: { type: "string", description: "您的具體問題或當前狀況描述" },
        datetime: { type: "string", description: "選擇性的日期時間（ISO 格式，如 2026-03-19T10:00:00），預設為當前時間" },
        purpose: { type: "string", description: "分析目的，如：綜合、求財、事業、感情、考試、健康、出行、官司", default: "綜合" },
        mode: { type: "string", enum: ["advanced", "traditional"], default: "advanced", description: "時間精度模式" },
        conversationHistory: { type: "array", description: "可選的續問對話歷史" }
      },
      required: ["question"]
    }
  },
  {
    name: "meihua_divination",
    description: "梅花易數大師解卦。支援時間起卦、數字起卦與漢字起卦，計算本互變錯綜五卦全息盤面與爻辭。",
    inputSchema: {
      type: "object",
      properties: {
        question: { type: "string", description: "您的具體問題" },
        method: { type: "string", enum: ["time", "numbers", "text"], default: "time", description: "起卦方式" },
        text: { type: "string", description: "漢字起卦字串" },
        num1: { type: "integer", description: "第一個數字 (1-100)" },
        num2: { type: "integer", description: "第二個數字 (1-100)" },
        num3: { type: "integer", description: "第三個數字 (1-100)" },
        purpose: { type: "string", description: "分析目的，預設為 '綜合'" },
        conversationHistory: { type: "array", description: "可選的續問對話歷史" }
      },
      required: ["question"]
    }
  },
  {
    name: "tarot_divination",
    description: "韋特塔羅 78 張牌、6 大牌陣抽牌與四維透鏡 AI 深度解讀。",
    inputSchema: {
      type: "object",
      properties: {
        question: { type: "string", description: "您的塔羅問題" },
        spread: { type: "string", enum: ["single", "three", "diamond", "moon", "horseshoe", "celtic"], default: "three", description: "牌陣" },
        variant: { type: "string", enum: ["timeline", "situation", "relationship"], description: "三牌陣變體解讀維度" },
        seed: { type: "string", description: "可選的可重現抽牌種子" },
        cards: { type: "array", description: "可選的指定牌組陣列" },
        lang: { type: "string", enum: ["zh-tw", "zh-cn"], default: "zh-tw" },
        conversationHistory: { type: "array", description: "可選的續問對話歷史" }
      },
      required: ["question"]
    }
  },
  {
    name: "fengshui_consultation",
    description: "三元玄空飛星、八宅明鏡、形煞化解及協紀辨方擇日風水報告及生活化建議。",
    inputSchema: {
      type: "object",
      properties: {
        question: { type: "string", description: "您的空間或擇日問題" },
        mode: { type: "string", enum: ["yangzhai", "shaqi", "zeri"], default: "yangzhai", description: "風水模式" },
        facing: { type: "string", enum: ["南", "北", "東", "西", "東南", "西北", "東北", "西南"], default: "南" },
        moveInYear: { type: "integer", minimum: 1, maximum: 9999 },
        residentYear: { type: "integer", minimum: 1, maximum: 9999 },
        sex: { type: "string", enum: ["男", "女"] },
        year: { type: "integer", minimum: 1, maximum: 9999 },
        shaType: { type: "string", enum: ["road_rush", "tianzan", "bidau", "fangong", "chuangtang", "beam", "mirror"] },
        matter: { type: "string", enum: ["movein", "open", "renovate", "marry"] },
        zeriYear: { type: "integer" },
        zeriMonth: { type: "integer", minimum: 1, maximum: 12 },
        lang: { type: "string", enum: ["zh-tw", "zh-cn"], default: "zh-tw" },
        conversationHistory: { type: "array", description: "可選的續問對話歷史" }
      },
      required: ["question"]
    }
  },
  {
    name: "bazi2_analysis",
    description: "子平生辰八字四柱、十神藏干、神煞、五行旺衰格局與大運流年 AI 命理解讀。",
    inputSchema: {
      type: "object",
      properties: {
        question: { type: "string", description: "您的命理問題" },
        date: { type: "string", description: "出生日期 YYYY-MM-DD" },
        time: { type: "string", default: "12:00", description: "出生時間 HH:mm" },
        sex: { type: "string", enum: ["男", "女"], default: "男" },
        calendar: { type: "string", enum: ["solar", "lunar"], default: "solar" },
        name: { type: "string", description: "姓名（可選）" },
        formerName: { type: "string", description: "曾用名（可選）" },
        place: { type: "string", description: "出生地（可選）" },
        lang: { type: "string", enum: ["zh-tw", "zh-cn"], default: "zh-tw" },
        conversationHistory: { type: "array", description: "可選的續問對話歷史" }
      },
      required: ["question", "date"]
    }
  },
  {
    name: "yinyuan_reading",
    description: "月老靈籤（100籤）、生肖配對、紫微夫妻宮、桃花運勢、八字合婚與紅線測算 AI 指引。",
    inputSchema: {
      type: "object",
      properties: {
        question: { type: "string", description: "您的感情問題" },
        mode: { type: "string", enum: ["fortune", "zodiac", "red-thread", "bazi-match", "marriage-palace", "ziwei", "ziwei-marriage", "taohua", "peach-blossom"], default: "fortune" },
        firstYear: { type: "integer", minimum: 1, maximum: 9999 },
        secondYear: { type: "integer", minimum: 1, maximum: 9999 },
        firstZodiac: { type: "string" },
        secondZodiac: { type: "string" },
        name: { type: "string" },
        sex: { type: "string", enum: ["男", "女"] },
        stickNum: { type: "integer", minimum: 1, maximum: 100 },
        calendar: { type: "string", enum: ["solar", "lunar"] },
        date: { type: "string" },
        time: { type: "string" },
        first: { type: "object" },
        second: { type: "object" },
        stage: { type: "string" },
        seekingSex: { type: "string", enum: ["男", "女"] },
        preference: { type: "string" },
        status: { type: "string", default: "單身" },
        scope: { type: "string" },
        seed: { type: "string" },
        chart: { type: "object" },
        firstChart: { type: "object" },
        secondChart: { type: "object" },
        lang: { type: "string", enum: ["zh-tw", "zh-cn"], default: "zh-tw" },
        conversationHistory: { type: "array", description: "可選的續問對話歷史" }
      },
      required: ["question"]
    }
  },
  {
    name: "ziwei_analysis",
    description: "紫微斗數安星排盤、十二宮位、十四主星廟旺、生年四化、大限流年與 AI 命理解讀。",
    inputSchema: {
      type: "object",
      properties: {
        question: { type: "string", description: "使用者的命理諮詢問題" },
        date: { type: "string", description: "出生日期 YYYY-MM-DD" },
        time: { type: "string", description: "出生時間 HH:mm" },
        shichen: { type: "string", enum: ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"], description: "出生時辰地支" },
        sex: { type: "string", enum: ["男", "女"], default: "男", description: "性別" },
        calendar: { type: "string", enum: ["solar", "lunar"], default: "solar", description: "曆法" },
        leap: { type: "boolean", default: false, description: "農曆是否閏月" },
        name: { type: "string", description: "姓名或稱謂（可選）" },
        lang: { type: "string", enum: ["zh-tw", "zh-cn"], default: "zh-tw" },
        conversationHistory: { type: "array", description: "可選的續問對話歷史" }
      },
      required: ["question", "date"]
    }
  },
  {
    name: "answerbook_reading",
    description: "解答之書直接默念取得提醒，或輸入問題後取得答案並由 AI 解讀。",
    inputSchema: {
      type: "object",
      properties: {
        mode: { type: "string", enum: ["direct", "question"], default: "direct", description: "direct 直接默念；question 輸入問題並由 AI 解讀" },
        question: { type: "string", description: "問題模式使用的具體問題；直接模式可省略" },
        lang: { type: "string", enum: ["zh-tw", "zh-cn"], default: "zh-tw" },
        conversationHistory: { type: "array", description: "問題模式的續問對話歷史" }
      },
      required: []
    }
  }
];

// Handle JSON-RPC messages from stdin
rl.on('line', async (line) => {
  if (!line.trim()) return;
  
  try {
    const request = JSON.parse(line);
    const { method, params, id } = request;

    // MCP Lifecycle: initialize
    if (method === 'initialize') {
      return sendResponse(id, {
        protocolVersion: "2024-11-05",
        capabilities: {
           tools: {}
        },
        serverInfo: { name: "qimen-mcp-bridge", version: "1.0.0" }
      });
    }

    // MCP Discovery: listTools
    if (method === 'tools/list' || method === 'listTools') {
      return sendResponse(id, { tools });
    }

    // MCP Execution: callTool
    if (method === 'tools/call' || method === 'callTool') {
      const toolName = params.name || '';
      const args = params.arguments || {};

      if (toolName === 'qimen_divination') {
        const payload = {
          question: args.question,
          datetime: args.datetime || null,
          purpose: args.purpose || '綜合',
          mode: 'advanced'
        };
        try {
          const result = await makeApiRequest('qimen-question', payload);
          const responseText = result.success ? result.answer : `Error: ${result.message || result.error || 'Unknown error'}`;
          return sendResponse(id, { content: [{ type: 'text', text: responseText }] });
        } catch (err) {
          return sendResponse(id, { content: [{ type: 'text', text: `Failed to connect to divination service: ${err.message}` }], isError: true });
        }
      }

      if (toolName === 'meihua_divination') {
        const payload = {
          question: args.question,
          method: 'time',
          purpose: args.purpose || '綜合'
        };
        try {
          const result = await makeApiRequest('meihua-question', payload);
          const responseText = result.success ? result.answer : `Error: ${result.message || result.error || 'Unknown error'}`;
          return sendResponse(id, { content: [{ type: 'text', text: responseText }] });
        } catch (err) {
          return sendResponse(id, { content: [{ type: 'text', text: `Failed to connect to divination service: ${err.message}` }], isError: true });
        }
      }

      const suiteEndpoints = {
        ziwei_analysis: 'ziwei-question',
        tarot_divination: 'tarot-question',
        fengshui_consultation: 'fengshui-question',
        bazi2_analysis: 'bazi2-question',
        yinyuan_reading: 'yinyuan-question',
        answerbook_reading: 'answerbook-question'
      };
      if (suiteEndpoints[toolName]) {
        try {
          const result = await makeApiRequest(suiteEndpoints[toolName], args);
          const responseText = result.success
            ? `${result.answer || 'No reading generated.'}${result.analysis ? `\n\nAI 解讀：\n${result.analysis}` : ''}\n\n${JSON.stringify(result.result || result.reading || result.report || result.chart || null, null, 2)}`
            : `Error: ${result.message || result.error || 'Unknown error'}`;
          return sendResponse(id, { content: [{ type: 'text', text: responseText }], isError: !result.success });
        } catch (err) {
          return sendResponse(id, { content: [{ type: 'text', text: `Failed to connect to divination service: ${err.message}` }], isError: true });
        }
      }

      return sendError(id, -32601, `Tool not found: ${toolName}`);
    }
    
    // Notifications (no id)
    if (!id) return;

    // Handle other required MCP methods or send error
    if (method === 'notifications/initialized') return;

    sendError(id, -32601, `Method not found: ${method}`);

  } catch (err) {
    // Parse error should nominally send a response if possible
    // process.stderr.write(`Protocol error: ${err.message}\n`);
  }
});

// Explicitly handle stream close
rl.on('close', () => {
    process.exit(0);
});

// Basic signal handling
process.on('SIGINT', () => {
    rl.close();
});
