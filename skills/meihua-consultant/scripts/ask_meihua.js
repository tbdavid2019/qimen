#!/usr/bin/env node

/**
 * ask_meihua.js
 * A standalone script for the meihua-consultant skill to query qi.david888.com
 * Usage: node ask_meihua.js "Will it rain tomorrow?" ["time"] ["綜合"]
 */

const https = require('https');

const API_URL = 'https://qi.david888.com/api/meihua-question';

const question = process.argv[2];
const method = process.argv[3] || 'time';
const purpose = process.argv[4] || '綜合';

if (!question) {
  console.error('Error: You must provide a question.');
  console.error('Usage: node ask_meihua.js <question> [method: time/number] [purpose]');
  process.exit(1);
}

const payload = JSON.stringify({
  question,
  method,
  purpose
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
        console.log("=== Meihua Analysis ===");
        console.log(result.answer);
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
