#!/usr/bin/env node

/**
 * Qimen/Meihua MCP Bridge
 * Zero-dependency bridge for qi.david888.com
 * Supports JSON-RPC 2.0 over stdio
 */

const https = require('https');
const readline = require('readline');

// The production API endpoint
const API_BASE = 'https://qi.david888.com/api';

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
    description: "奇門遁甲專業排盤與大師分析。提供事業、財運、感情、健康等方面的深度解讀。建議提供具體問題與時間。",
    inputSchema: {
      type: "object",
      properties: {
        question: { type: "string", description: "您的具體問題或當前狀況描述" },
        datetime: { type: "string", description: "選擇性的日期時間（ISO 格式，如 2026-03-19T10:00:00），預設為當前時間" },
        purpose: { type: "string", description: "分析目的，預設為 '綜合'，或是：事業、財運、婚姻、健康、學業", default: "綜合" }
      },
      required: ["question"]
    }
  },
  {
    name: "meihua_divination",
    description: "梅花易數快速占卜與決策建議。適合快速獲取卦象啟示。",
    inputSchema: {
      type: "object",
      properties: {
        question: { type: "string", description: "您的具體問題" },
        purpose: { type: "string", description: "分析目的，預設為 '綜合'" }
      },
      required: ["question"]
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
