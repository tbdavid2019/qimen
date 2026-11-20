(() => {
  'use strict';
  const modal = document.getElementById('suiteResultEmailDialog');
  const launcher = document.getElementById('suiteResultEmailLauncher');
  if (!modal || !launcher || window.__suiteResultEmailReady) return;
  window.__suiteResultEmailReady = true;

  const serviceNames = {
    'name-analysis': '中文姓名分析', 'tarot': '韋特塔羅／生命靈數', 'ziwei': '紫微斗數',
    'meihua': '梅花易數', 'bazi2': '八字命理', 'fengshui': '易經風水',
    'yinyuan': '月老姻緣', 'answerbook': '解答之書', 'liuyao': '六爻神卦',
    'cezi': '測字占事', 'wellness': '五運六氣養生'
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

  // 使用共用的 UMD 郵件格式化模組 (/js/email-formatter.js)，保留極簡安全後備
  const FallbackFormatter = {
    formatHumanReadableReport(_service, data, opts = {}) {
      if (opts && opts.supplement && (!data || Object.keys(data).length === 0)) {
        return String(opts.supplement);
      }
      return JSON.stringify(data || {}, null, 2);
    },
    formatReport(service, data, opts = {}) {
      return this.formatHumanReadableReport(service, data, opts);
    },
    formatSummary(service) {
      return `${service || '命理諮詢'} ｜ 諮詢日期：${new Date().toLocaleDateString('zh-TW')}`;
    },
    formatSubject(service) {
      return `【333 一句提醒·照見當下】您的${service || '命理'}諮詢結果`;
    }
  };

  const getFormatter = () => window.DivinationEmailFormatter || FallbackFormatter;

  function publish(service, report, summary, opts = {}) {
    if (!report) return;
    if (summary && typeof summary === 'object') {
      opts = summary;
      summary = opts.summary || (opts.question ? `占問：${opts.question}` : '');
    }
    const sName = service || routeService();
    const fmt = getFormatter();

    // 僅在明確傳入 opts.supplement 或同一次排盤物件重發時保留已存在的 AI 解讀，避免新排盤沿用舊解讀
    const isSameReport = Boolean(
      lastReport &&
      lastReport.module === sName &&
      (lastReport.raw === report || (lastReport.raw && lastReport.raw.result && lastReport.raw.result === report))
    );
    let supplement = opts.supplement || '';
    if (!supplement && isSameReport) {
      supplement = lastReport.initialSupplement || lastReport.supplement || '';
    }

    const formatOpts = supplement ? { supplement, ...opts } : { ...opts };
    const humanSummary = (fmt.formatChartSummary ? fmt.formatChartSummary(sName, report, summary) : (fmt.formatSummary ? fmt.formatSummary(sName, report) : summary)) || summary || '';
    const humanText = fmt.formatHumanReadableReport ? fmt.formatHumanReadableReport(sName, report, formatOpts) : fmt.formatReport(sName, report, formatOpts);
    const humanSubject = fmt.formatSubject(sName, report);
    
    lastReport = {
      service: sName,
      summary: humanSummary,
      text: humanText,
      subject: humanSubject,
      raw: report,
      module: sName,
      supplement: supplement || '',
      initialSupplement: supplement || (isSameReport ? (lastReport?.initialSupplement || '') : '')
    };
    const openBtn = document.getElementById('suiteResultEmailOpen');
    if (openBtn) {
      openBtn.textContent = lastReport.supplement ? '✉️ 寄送完整結果與問答' : '✉️ 寄送結果至信箱';
    }
    launcher.hidden = false;
    document.body.classList.add('has-suite-email-result');
    window.lastSuiteResult = report;
  }
  window.publishSuiteEmailResult = publish;

  const relevantPath = (path) => /\/api\/(name-analysis(?:\/(verify|generate)|-question)|name-analysis\/cezi|tarot(?:\/numerology|\/reading|-question|\/llm-analysis)|ziwei(?:\/chart|\/spouse|\/male-size|\/match|-question|\/llm-analysis)?|meihua(?:-question|\/qigua|\/llm-analysis)?|liuyao(?:-question|\/toss-coin|\/cast-dayan|\/cast-datetime|\/cast-manual|\/llm-analysis)?|suite-ai\/liuyao|(?:bazi2|fengshui|yinyuan)(?:-question|\/chart|\/report|\/reading|\/llm-analysis|\/evaluate-layout|\/luantou|\/yunqi-wellness)|wellness(?:-question|\/question)|answerbook(?:-question|\/llm-analysis)|[a-z0-9-]+\/llm-analysis|llm-analysis)/i.test(path);
  const originalFetch = window.fetch.bind(window);
  window.fetch = async (...args) => {
    const response = await originalFetch(...args);
    try {
      const url = new URL(typeof args[0] === 'string' ? args[0] : args[0].url, location.href);
      if (url.origin === location.origin && relevantPath(url.pathname) && response.ok) {
        response.clone().json().then((data) => {
          if (data && (data.success === true || data.result || data.analysis || data.chart || data.reading || data.report || data.data)) {
            const safe = { ...data };
            delete safe.discord;
            delete safe.webhook;
            const service = routeService();
            const summary = `${url.pathname} · ${new Date().toLocaleString('zh-TW')}`;
            const hasPrimaryCalculation = Boolean(
              (safe.result && (safe.result.characters || safe.result.candidates || safe.result.stickNumber || safe.result.cards)) ||
              safe.chart || safe.cards || safe.report || safe.data?.bengua || safe.reading?.answer || safe.reading?.stickNumber
            );
            const isSupplement = /\/llm-analysis$/i.test(url.pathname) || (/\/name-analysis-question$/i.test(url.pathname) && !hasPrimaryCalculation) || (!hasPrimaryCalculation && Boolean(safe.analysis));
            if (isSupplement && lastReport?.module === service) {
              const supplement = safe.analysis || safe.result || safe;
              const suppText = typeof supplement === 'string' ? supplement : (supplement.analysis || JSON.stringify(supplement, null, 2));
              lastReport.initialSupplement = lastReport.initialSupplement || suppText;
              lastReport.supplement = suppText;
              const fmt = getFormatter();
              lastReport.text = fmt.formatHumanReadableReport ? fmt.formatHumanReadableReport(service, lastReport.raw, { supplement: suppText }) : fmt.formatReport(service, lastReport.raw, { supplement: suppText });
              window.lastSuiteResult = { calculation: lastReport.raw, supplement };
              const openBtn = document.getElementById('suiteResultEmailOpen');
              if (openBtn) {
                openBtn.textContent = '✉️ 寄送完整結果與問答';
              }
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

  async function openEmailDialog() {
    status.textContent = ''; status.dataset.state = '';
    sendButton.disabled = false; sendButton.textContent = '確認寄送 ➔';
    try { input.value = localStorage.getItem('user_consultation_email') || ''; } catch (_) {}
    if (typeof modal.showModal === 'function') {
      if (!modal.open) {
        try { modal.showModal(); } catch (_) { modal.setAttribute('open', ''); }
      }
    } else {
      modal.setAttribute('open', '');
    }
    try { await ensureTurnstile(); } catch (error) { status.textContent = error.message; status.dataset.state = 'error'; }
  }
  window.openSuiteResultEmailDialog = openEmailDialog;

  const openBtn = document.getElementById('suiteResultEmailOpen');
  if (openBtn) {
    openBtn.addEventListener('click', openEmailDialog);
  }

  // 全域內嵌按鈕點擊代理（Event Delegation），任何頁面的 .js-open-result-email 皆可觸發開啟彈窗
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.js-open-result-email, [data-open-result-email]');
    if (btn) {
      e.preventDefault();
      openEmailDialog();
    }
  });

  modal.querySelector('.suite-email-close').addEventListener('click', () => modal.close());
  modal.querySelector('.suite-email-cancel').addEventListener('click', () => modal.close());

  function buildExportHistory() {
    const rawConv = (Array.isArray(window.conversationHistory) && window.conversationHistory.length > 0)
      ? window.conversationHistory
      : (Array.isArray(window.meihuaConversationHistory) && window.meihuaConversationHistory.length > 0
          ? window.meihuaConversationHistory
          : []);

    if (!lastReport) {
      if (rawConv.length > 0) {
        return rawConv.map(msg => ({ role: msg.role, content: msg.content }));
      }
      return [];
    }

    if (rawConv.length > 0) {
      const fmt = getFormatter();
      // 第一筆放純排盤／命盤／姓名報告（不帶 supplement 以免與 rawConv 內第一輪重複）
      const chartOnlyText = fmt.formatHumanReadableReport
        ? fmt.formatHumanReadableReport(lastReport.service, lastReport.raw, {})
        : fmt.formatReport(lastReport.service, lastReport.raw, {});
      const history = [{ role: 'assistant', content: chartOnlyText }];
      for (const msg of rawConv) {
        if (msg && msg.role && msg.content) {
          history.push({ role: msg.role, content: msg.content });
        }
      }
      return history;
    }

    return [{ role: 'assistant', content: lastReport.text || `# ${lastReport.service}結果\n\n${lastReport.summary}` }];
  }
  window.buildSuiteEmailExportHistory = buildExportHistory;

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
      const history = buildExportHistory();
      const payload = {
        email,
        service: lastReport.service,
        subject: lastReport.subject || `【333】${lastReport.service}結果`,
        chartSummary: lastReport.summary,
        history,
        'cf-turnstile-response': token
      };
      if (new TextEncoder().encode(JSON.stringify(payload)).length > 900 * 1024) {
        throw new Error('本次結果超過郵件安全大小上限，尚未寄出；請改寄較短的單一分析結果。');
      }
      const response = await originalFetch('/api/conversation/send-email', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || '寄送失敗，請稍後再試。');
      
      // 成功狀態：更新按鈕為已寄送、鎖定按鈕，並於 1.8 秒後自動關閉彈窗
      status.textContent = '✅ 分析結果已成功寄送至你的信箱！';
      status.dataset.state = 'success';
      sendButton.textContent = '已成功寄送 ✓';
      sendButton.disabled = true;
      setTimeout(() => {
        if (typeof modal.close === 'function') modal.close();
        else modal.removeAttribute('open');
        sendButton.disabled = false;
        sendButton.textContent = '確認寄送 ➔';
      }, 1800);
    } catch (error) {
      status.textContent = error.message;
      status.dataset.state = 'error';
      sendButton.disabled = false;
      sendButton.textContent = '重新寄送 ➔';
    } finally {
      token = '';
      if (widgetId !== null) { try { window.turnstile.reset(widgetId); } catch (_) {} }
    }
  });
})();
