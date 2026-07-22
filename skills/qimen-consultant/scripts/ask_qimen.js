#!/usr/bin/env node

/**
 * ask_qimen.js
 * A standalone script for the qimen-consultant skill to query qi.david888.com
 * Usage: node ask_qimen.js "What is my career outlook?" ["2026-03-19T10:00:00"] ["事業"]
 */

const https = require('https');

const API_URL = 'https://qi.david888.com/api/qimen-question';

const question = process.argv[2];
const datetime = process.argv[3] || null;
const purpose = process.argv[4] || '綜合';

if (!question) {
  console.error('Error: You must provide a question.');
  console.error('Usage: node ask_qimen.js <question> [datetime] [purpose]');
  process.exit(1);
}

const payload = JSON.stringify({
  question,
  datetime,
  purpose,
  mode: 'advanced'
});

const options = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
};

const req = https.request(API_URL, options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      if (result.success) {
        console.log("=== Qimen Analysis ===");
        console.log(result.answer || result.fallback);
      } else {
        console.log("Failed to get reading:", result.error || result.message);
      }
    } catch (e) {
      console.log("Error parsing response:", e.message);
    }
  });
});

req.on('error', (e) => {
  console.error(`Status Request Error: ${e.message}`);
});

req.write(payload);
req.end();
