(() => {
  'use strict';
  const modal = document.getElementById('suiteResultEmailDialog');
  const launcher = document.getElementById('suiteResultEmailLauncher');
  if (!modal || !launcher || window.__suiteResultEmailReady) return;
  window.__suiteResultEmailReady = true;

  const serviceNames = {
    'name-analysis': '中文姓名分析', 'tarot': '韋特塔羅／生命靈數', 'ziwei': '紫微斗數',
    'meihua': '梅花易數', 'bazi2': '八字命理', 'fengshui': '易經風水',
    'yinyuan': '月老姻緣', 'answerbook': '解答之書'
  };
  const routeService = () => {
    const segment = location.pathname.split('/').filter(Boolean)[0];
    return serviceNames[segment] || serviceNames[document.body.dataset.suite] || '命理分析';
  };
  let lastReport = null;
  let widgetId = null;
  let token = '';
  let turnstilePromise = null;
  const status = document.getElementById('suiteResultEmailStatus');
  const sendButton = document.getElementById('suiteResultEmailSend');
  const input = document.getElementById('suiteResultEmailInput');
  const widget = document.getElementById('suite-result-email-turnstile');

  function publish(service, report, summary) {
    if (!report) return;
    const text = typeof report === 'string' ? report : JSON.stringify(report, null, 2);
    if (!text || !text.trim()) return;
    lastReport = { service: service || routeService(), summary: summary || '', text, raw: report, module: service || routeService() };
    launcher.hidden = false;
    document.body.classList.add('has-suite-email-result');
    window.lastSuiteResult = report;
  }
  window.publishSuiteEmailResult = publish;

  const relevantPath = (path) => /\/api\/(name-analysis(?:\/(verify|generate)|-question)|tarot(?:\/numerology|\/reading|-question|\/llm-analysis)|ziwei(?:\/chart|\/spouse|\/male-size|-question|\/llm-analysis)?|meihua(?:-question|\/qigua|\/llm-analysis)?|(?:bazi2|fengshui|yinyuan)(?:-question|\/chart|\/report|\/reading|\/llm-analysis|\/evaluate-layout|\/luantou)|answerbook(?:-question|\/llm-analysis)|[a-z0-9-]+\/llm-analysis|llm-analysis)/i.test(path);
  const originalFetch = window.fetch.bind(window);
  window.fetch = async (...args) => {
    const response = await originalFetch(...args);
    try {
      const url = new URL(typeof args[0] === 'string' ? args[0] : args[0].url, location.href);
      if (url.origin === location.origin && relevantPath(url.pathname) && response.ok) {
        response.clone().json().then((data) => {
          if (data && (data.success === true || data.result || data.analysis || data.chart || data.reading || data.report)) {
            const safe = { ...data };
            delete safe.discord;
            delete safe.webhook;
            const service = routeService();
            const summary = `${url.pathname} · ${new Date().toLocaleString('zh-TW')}`;
            const isSupplement = /\/llm-analysis$/i.test(url.pathname);
            if (isSupplement && lastReport?.module === service) {
              const supplement = safe.analysis || safe.result || safe;
              lastReport.text += `\n\n## AI 補充解讀\n\n${typeof supplement === 'string' ? supplement : JSON.stringify(supplement, null, 2)}`;
              lastReport.summary += `；${summary}`;
              window.lastSuiteResult = { calculation: lastReport.raw, supplement };
            } else {
              publish(service, safe, summary);
            }
          }
        }).catch(() => {});
      }
    } catch (_) {}
    return response;
  };

  function ensureTurnstile() {
    if (!widget || !widget.dataset.sitekey) return Promise.resolve();
    if (window.turnstile?.render) return renderWidget();
    if (turnstilePromise) return turnstilePromise;
    turnstilePromise = new Promise((resolve, reject) => {
      let script = document.querySelector('script[src*="challenges.cloudflare.com/turnstile"]');
      const ready = () => {
        const until = Date.now() + 10000;
        const poll = setInterval(() => {
          if (window.turnstile?.render) { clearInterval(poll); renderWidget().then(resolve, reject); }
          else if (Date.now() > until) { clearInterval(poll); reject(new Error('Turnstile 載入逾時，請重新開啟寄送視窗。')); }
        }, 120);
      };
      if (!script) {
        script = document.createElement('script');
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.async = true; script.defer = true; document.head.appendChild(script);
      }
      ready();
      script.addEventListener('error', () => reject(new Error('Turnstile 載入失敗。')), { once: true });
    });
    turnstilePromise = turnstilePromise.catch((error) => { turnstilePromise = null; throw error; });
    return turnstilePromise;
  }
  function renderWidget() {
    if (widgetId !== null || !widget?.dataset.sitekey) return Promise.resolve();
    return new Promise((resolve) => {
      widgetId = window.turnstile.render(widget, {
        sitekey: widget.dataset.sitekey, action: 'send_email', theme: 'auto', size: 'flexible',
        callback: (value) => { token = value; }, 'expired-callback': () => { token = ''; }, 'error-callback': () => { token = ''; }
      });
      resolve();
    });
  }

  document.getElementById('suiteResultEmailOpen').addEventListener('click', async () => {
    status.textContent = ''; status.dataset.state = '';
    try { input.value = localStorage.getItem('user_consultation_email') || ''; } catch (_) {}
    if (typeof modal.showModal === 'function') modal.showModal(); else modal.setAttribute('open', '');
    try { await ensureTurnstile(); } catch (error) { status.textContent = error.message; status.dataset.state = 'error'; }
  });
  modal.querySelector('.suite-email-close').addEventListener('click', () => modal.close());
  modal.querySelector('.suite-email-cancel').addEventListener('click', () => modal.close());
  sendButton.addEventListener('click', async () => {
    status.textContent = ''; status.dataset.state = '';
    const email = input.value.trim();
    if (!lastReport) { status.textContent = '目前沒有可寄送的分析結果。'; status.dataset.state = 'error'; return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { status.textContent = '請輸入有效的電子郵件地址。'; status.dataset.state = 'error'; input.focus(); return; }
    if (widget?.dataset.sitekey && !token && widgetId !== null) {
      try { token = window.turnstile.getResponse(widgetId) || ''; } catch (_) {}
    }
    if (widget?.dataset.sitekey && !token) { status.textContent = '請先完成 Cloudflare 人機驗證。'; status.dataset.state = 'error'; return; }
    sendButton.disabled = true; sendButton.textContent = '正在寄送…';
    try {
      try { localStorage.setItem('user_consultation_email', email); } catch (_) {}
      const history = [{ role: 'assistant', content: `# ${lastReport.service}結果\n\n${lastReport.summary}\n\n\`\`\`json\n${lastReport.text}\n\`\`\`` }];
      const payload = { email, service: lastReport.service, subject: `【333】${lastReport.service}結果`, chartSummary: lastReport.summary, history, 'cf-turnstile-response': token };
      if (new TextEncoder().encode(JSON.stringify(payload)).length > 900 * 1024) {
        throw new Error('本次結果超過郵件安全大小上限，尚未寄出；請改寄較短的單一分析結果。');
      }
      const response = await originalFetch('/api/conversation/send-email', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || '寄送失敗，請稍後再試。');
      status.textContent = data.message || '結果已寄到你的信箱。'; status.dataset.state = 'success';
    } catch (error) { status.textContent = error.message; status.dataset.state = 'error'; }
    finally {
      token = '';
      if (widgetId !== null) { try { window.turnstile.reset(widgetId); } catch (_) {} }
      sendButton.disabled = false; sendButton.textContent = '確認寄送 ➔';
    }
  });
})();
