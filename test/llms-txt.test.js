const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const app = require('../app');

test('llms.txt follows the required Markdown structure and indexes all service groups', async (t) => {
  const file = fs.readFileSync(path.join(__dirname, '..', 'llms.txt'), 'utf8');
  assert.match(file, /^# .+\n\n> .+\n/s);
  assert.match(file, /^## Modules$/m);
  assert.match(file, /^## APIs and Agent Tools$/m);
  assert.match(file, /^## Optional$/m);
  assert.match(file, /llmstxt\.org/);
  for (const name of ['Qimen Dunjia', 'Ziwei Doushu', 'Meihua Yishu', 'Bazi', 'Yinyuan', 'Fengshui', 'Waite Tarot', 'Answerbook', 'Chinese name analysis', 'Time range']) {
    assert.ok(file.includes(name), `llms.txt should list ${name}`);
  }

  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  t.after(() => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));
  const response = await fetch(`http://127.0.0.1:${server.address().port}/llms.txt`);
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /text\/plain/);
  assert.equal(await response.text(), file);
});
