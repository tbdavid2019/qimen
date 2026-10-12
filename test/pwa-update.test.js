const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const deploymentConfig = require('../vercel.json');
const app = require('../app');

function createButton() {
  const listeners = {};
  return {
    dataset: {},
    disabled: false,
    hidden: false,
    attributes: {},
    addEventListener(name, callback) { listeners[name] = callback; },
    click() { listeners.click(); },
    setAttribute(name, value) { this.attributes[name] = value; },
    removeAttribute(name) { delete this.attributes[name]; }
  };
}

async function loadUpdateBanner(storage, language = 'zh-tw', hasWaitingUpdate = true) {
  const banner = { hidden: true };
  const message = { textContent: '' };
  const updateButton = createButton();
  updateButton.textContent = '立即更新 ➜';
  const laterButton = createButton();
  const containerListeners = {};
  const waitingMessages = [];
  const waitingWorker = { postMessage(message) { waitingMessages.push(message); } };
  const installListeners = {};
  const installingWorker = hasWaitingUpdate ? null : {
    state: 'installing',
    addEventListener(name, callback) { installListeners[name] = callback; }
  };
  const registration = {
    waiting: hasWaitingUpdate ? waitingWorker : null,
    installing: installingWorker,
    addEventListener() {},
    update: () => Promise.resolve()
  };
  const serviceWorker = {
    controller: {},
    addEventListener(name, callback) { containerListeners[name] = callback; },
    register: () => Promise.resolve(registration)
  };
  const elements = {
    'pwa-update-banner': banner,
    'pwa-update-message': message,
    'pwa-update-action': updateButton,
    'pwa-update-later': laterButton
  };
  const document = {
    documentElement: { lang: language },
    querySelector: () => ({ content: 'release-a' }),
    getElementById: (id) => elements[id],
    addEventListener() {}
  };
  const context = {
    document,
    navigator: { serviceWorker },
    localStorage: {
      getItem: (key) => storage.get(key) || null,
      setItem: (key, value) => storage.set(key, value)
    },
    Date,
    window: { location: { reload() { context.reloaded = true; } } }
  };
  const source = fs.readFileSync(path.join(__dirname, '../public/js/pwa-update.js'), 'utf8');
  vm.runInNewContext(source, context);
  await new Promise((resolve) => setImmediate(resolve));
  return { banner, message, updateButton, laterButton, containerListeners, waitingMessages, installingWorker, installListeners, context };
}

test('奇門遁甲頁面提供帶部署版本的 PWA 更新服務工作者', async (t) => {
  assert.ok(deploymentConfig.routes.some((route) => route.src === '/sw\\.js' && route.dest === '/app.js'));

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));

  const response = await fetch(`http://127.0.0.1:${server.address().port}/sw.js`);
  const source = await response.text();

  assert.equal(response.status, 200);
  assert.match(source, /const BUILD_ID = "[^"]+"/);
  assert.match(response.headers.get('content-type'), /javascript/);
  assert.match(response.headers.get('cache-control'), /no-store/);
  assert.doesNotMatch(source, /__PWA_BUILD_ID__/);
  assert.match(source, /SKIP_WAITING/);
});

test('奇門遁甲頁面載入更新提示元件與部署版本', async (t) => {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));

  const response = await fetch(`http://127.0.0.1:${server.address().port}/`);
  const html = await response.text();

  assert.equal(response.status, 200);
  const buildMatch = html.match(/meta name="pwa-build-id" content="([^"]+)"/);
  assert.ok(buildMatch, 'the page should expose its deployment id');
  assert.match(html, /id="pwa-update-banner"/);
  assert.match(html, /js\/pwa-update\.js/);

  const serviceWorkerResponse = await fetch(`http://127.0.0.1:${server.address().port}/sw.js`);
  const serviceWorker = await serviceWorkerResponse.text();
  assert.ok(serviceWorker.includes(`const BUILD_ID = ${JSON.stringify(buildMatch[1])};`));
});

test('更新確認後先啟用新版，再等使用者決定重新載入', async () => {
  const ui = await loadUpdateBanner(new Map());

  assert.equal(ui.banner.hidden, false);
  ui.updateButton.click();
  assert.equal(ui.waitingMessages.length, 1);
  assert.equal(ui.waitingMessages[0].type, 'SKIP_WAITING');
  assert.equal(ui.context.reloaded, undefined);

  ui.containerListeners.controllerchange();
  assert.equal(ui.message.textContent, '新版已備妥，重新載入後套用。');
  assert.equal(ui.updateButton.dataset.action, 'reload');
  assert.equal(ui.context.reloaded, undefined);

  ui.updateButton.click();
  assert.equal(ui.context.reloaded, true);
});

test('新 Service Worker 安裝完成後才顯示更新提示', async () => {
  const ui = await loadUpdateBanner(new Map(), 'zh-tw', false);

  assert.equal(ui.banner.hidden, true);
  ui.installingWorker.state = 'installed';
  ui.installListeners.statechange();
  assert.equal(ui.banner.hidden, false);
});

test('Service Worker 只接受明確的立即更新訊息', async () => {
  const source = fs.readFileSync(path.join(__dirname, '../lib/pwa-sw.js'), 'utf8')
    .replace('__PWA_BUILD_ID__', '"test-build"');
  const listeners = {};
  let skipWaitingCalls = 0;
  const workerContext = {
    self: {
      addEventListener(name, callback) { listeners[name] = callback; },
      skipWaiting() { skipWaitingCalls += 1; return Promise.resolve(); }
    }
  };
  vm.runInNewContext(source, workerContext);

  let waitUntilPromise;
  listeners.message({ data: { type: 'OTHER' }, waitUntil(promise) { waitUntilPromise = promise; } });
  assert.equal(skipWaitingCalls, 0);
  listeners.message({ data: { type: 'SKIP_WAITING' }, waitUntil(promise) { waitUntilPromise = promise; } });
  await waitUntilPromise;
  assert.equal(skipWaitingCalls, 1);
});

test('稍後會在目前版本暫緩提示', async () => {
  const storage = new Map();
  const firstOpen = await loadUpdateBanner(storage);
  firstOpen.laterButton.click();

  assert.equal(firstOpen.banner.hidden, true);
  const nextOpen = await loadUpdateBanner(storage);
  assert.equal(nextOpen.banner.hidden, true);
});

test('簡體中文頁面使用對應的更新提示文字', async () => {
  const ui = await loadUpdateBanner(new Map(), 'zh-cn');
  ui.updateButton.click();
  ui.containerListeners.controllerchange();

  assert.equal(ui.message.textContent, '新版已就绪，重新加载后应用。');
  assert.equal(ui.updateButton.textContent, '重新加载 ➜');
});
