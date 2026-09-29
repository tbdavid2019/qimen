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

  // 人類友善格式化核心函式（若 window.DivinationEmailFormatter 已載入則優先使用，否則使用內建模組）
  const Formatter = window.DivinationEmailFormatter || {
    formatGloss(def) {
      if (!def) return '';
      const entries = String(def).split(/[；;]/u).map(e => e.trim()).filter(Boolean);
      const res = [];
      for (const e of entries) {
        let c = e.replace(/^（[^）]*）/u, '').trim();
        if (!c) continue;
        c = c.split(/[：:]/u)[0].split(/[，,。]/u)[0].trim();
        if (!c || c.length < 2 || /^(姓|又同|同上)$/u.test(c)) continue;
        if (!res.includes(c)) res.push(c.slice(0, 24));
        if (res.length >= 2) break;
      }
      return res.length ? res.join('；') : String(def).slice(0, 30);
    },
    formatReport(service, data, opts = {}) {
      const root = (data && typeof data === 'object') ? (data.result || data.chart || data.report || data.data || data) : {};
      const s = String(service || '').toLowerCase();
      const lines = [];

      if (s.includes('姓名') || s.includes('name')) {
        if (Array.isArray(root.candidates) && root.candidates.length > 0) {
          const surname = root.surname || '—';
          lines.push(`## 👶 【${surname}】姓取名推薦候選方案報告\n`);
          lines.push(`> 依據康熙字典筆畫與傳統三才五格數理，為您精心整理的命名候選方案（風格：${root.nameStyle?.label || '通用'}）：\n`);
          const limit = Math.min(root.candidates.length, 10);
          for (let i = 0; i < limit; i++) {
            const cand = root.candidates[i];
            const name = cand.name || `${surname}${cand.givenName || ''}`;
            const analysis = cand.analysis || {};
            const chars = analysis.characters || [];
            const grid = analysis.fiveGrid?.values || {};
            const talents = analysis.fiveGrid?.talents;

            lines.push(`### 候選 ${String(i + 1).padStart(2, '0')}：${name}`);
            if (chars.length > 0) {
              const charDetails = chars.map(c => {
                const py = c.pinyin ? ` · 讀音 ${c.pinyin}` : '';
                const elem = c.element || c.wx || '';
                const elemStr = elem ? ` · ${elem}行` : '';
                const stroke = c.stroke != null ? ` · 康熙 ${c.stroke} 畫` : '';
                const gloss = Formatter.formatGloss(c.definition || c.def);
                return `  - **${c.char}**（${c.char === surname ? '姓氏' : '名字'}${py}${elemStr}${stroke}）：${gloss || '字典收錄字'}`;
              }).join('\n');
              lines.push(`- **逐字字典解析**：\n${charDetails}`);
            }
            if (grid.heaven || grid.person || grid.total) {
              const h = grid.heaven ? `天格 ${grid.heaven.number}（${grid.heaven.classification || ''}・${grid.heaven.element || ''}）` : '';
              const p = grid.person ? `人格 ${grid.person.number}（${grid.person.classification || ''}・${grid.person.element || ''}）` : '';
              const d = grid.earth ? `地格 ${grid.earth.number}（${grid.earth.classification || ''}・${grid.earth.element || ''}）` : '';
              const o = grid.outer ? `外格 ${grid.outer.number}（${grid.outer.classification || ''}・${grid.outer.element || ''}）` : '';
              const t = grid.total ? `總格 ${grid.total.number}（${grid.total.classification || ''}・${grid.total.element || ''}）` : '';
              lines.push(`- **五格格局**：${[h, p, d, o, t].filter(Boolean).join(' ｜ ')}`);
            }
            if (talents) {
              const hp = talents.heavenPerson ? `${talents.heavenPerson.elements?.join(' → ')}（${talents.heavenPerson.relation}）` : '';
              const pe = talents.personEarth ? `${talents.personEarth.elements?.join(' → ')}（${talents.personEarth.relation}）` : '';
              lines.push(`- **三才配置**：天人【${hp}】 ｜ 人地【${pe}】`);
            }
            lines.push('');
          }
          if (root.baziLens?.summary) {
            lines.push(`### 🏛️ 生辰八字五行參考`);
            lines.push(`- **日主**：【${root.baziLens.summary.dayMaster?.stem || ''}${root.baziLens.summary.dayMaster?.element || ''}行】（${root.baziLens.summary.strength || '均衡'}）`);
            if (root.baziLens.usefulElements?.length) lines.push(`- **喜用五行建議**：${root.baziLens.usefulElements.join('、')}`);
            lines.push('');
          }
          lines.push(`### 💡 命理命名心法指引\n> 傳統五格與三才數理為古典統計文化參考，取名核心更在於父母寄寓的美好祝願與字義品格。選用順口、字義明亮、無不雅諧音的名字，即是最好的吉祥開局。`);
        } else {
          const name = root.name || '姓名';
          const chars = root.characters || [];
          const grid = root.fiveGrid?.values || {};
          const talents = root.fiveGrid?.talents;
          lines.push(`## 📜 【${name}】姓名學完整分析評估報告\n`);
          if (chars.length > 0) {
            lines.push(`### 逐字字形、筆畫與字典義`);
            chars.forEach((c, idx) => {
              const role = idx === 0 ? '姓氏' : '名字';
              const py = c.pinyin ? ` · 讀音 ${c.pinyin}` : '';
              const elem = c.element || c.wx || '';
              const elemStr = elem ? ` · 五行屬${elem}` : '';
              const stroke = c.stroke != null ? ` · 康熙 ${c.stroke} 畫` : '';
              const gloss = Formatter.formatGloss(c.definition || c.def);
              lines.push(`- **${c.char}**（${role}${py}${elemStr}${stroke}）：${gloss || '字典收錄字'}`);
            });
            lines.push('');
          }
          if (root.fiveGrid?.available && (grid.heaven || grid.person || grid.total)) {
            lines.push(`### 三才五格數理格局評估`);
            lines.push(`| 宮位 | 數理 | 五行 | 吉凶評價 | 象徵影響領域 |`);
            lines.push(`| :--- | :---: | :---: | :---: | :--- |`);
            if (grid.heaven) lines.push(`| 天格 | ${grid.heaven.number} | ${grid.heaven.element}行 | ${grid.heaven.classification || '平'} | 祖德根基、長輩與上級關聯 |`);
            if (grid.person) lines.push(`| 人格 | ${grid.person.number} | ${grid.person.element}行 | ${grid.person.classification || '平'} | 性格主運、內在才智與核心能力 |`);
            if (grid.earth) lines.push(`| 地格 | ${grid.earth.number} | ${grid.earth.element}行 | ${grid.earth.classification || '平'} | 中年前運、家庭手足與下屬緣分 |`);
            if (grid.outer) lines.push(`| 外格 | ${grid.outer.number} | ${grid.outer.element}行 | ${grid.outer.classification || '平'} | 社交人際、外在環境與貴人運 |`);
            if (grid.total) lines.push(`| 總格 | ${grid.total.number} | ${grid.total.element}行 | ${grid.total.classification || '平'} | 晚年成就、一生綜合實力總匯 |`);
            lines.push('');
            if (talents) {
              const hp = talents.heavenPerson ? `${talents.heavenPerson.elements?.join(' → ')}（${talents.heavenPerson.relation}）` : '';
              const pe = talents.personEarth ? `${talents.personEarth.elements?.join(' → ')}（${talents.personEarth.relation}）` : '';
              lines.push(`- **三才氣場配置**：天人【${hp}】 ｜ 人地【${pe}】\n`);
            }
          }
          if (root.interpretation) lines.push(`### 💡 綜合評定啟示\n> ${root.interpretation}`);
        }
      } else if (s.includes('塔羅') || s.includes('tarot') || s.includes('靈數')) {
        if (root.lifeNumber || root.lifePathNumber || root.soulCard) {
          lines.push(`## 🌟 塔羅生命靈數與靈魂象徵牌報告\n`);
          if (root.birthDate) lines.push(`- **出生日期**：${root.birthDate}`);
          lines.push(`- **生命靈數**：**${root.lifeNumber || root.lifePathNumber} 號人**${root.lifeProfile?.title ? `（${root.lifeProfile.title}）` : ''}\n`);
          if (root.lifeProfile?.essence) lines.push(`### 靈魂特質核心解析\n> ${root.lifeProfile.essence}\n`);
          if (root.soulCard) lines.push(`### 🔮 靈魂象徵牌：【${root.soulCard.name || ''}】\n- **啟示**：${root.soulCard.meaning || root.soulCard.traits || '象徵生命核心天賦'}\n`);
        } else {
          lines.push(`## 🃏 韋特塔羅占卜解析報告\n- **牌陣**：${root.spreadName || root.spread_name || '塔羅占卜'}\n`);
          if (root.question) lines.push(`- **占問事由**：${root.question}\n`);
          (root.cards || []).forEach((c, idx) => {
            const state = (c.isReversed || c.reversed) ? '逆位' : '正位';
            lines.push(`#### ${idx + 1}. 【${c.position || c.pos || '牌位'}】${c.name || c.card_tw || '塔羅牌'}（${state}）`);
            if (c.meaning || c.desc) lines.push(`- **牌意解讀**：${c.meaning || c.desc}`);
            lines.push('');
          });
        }
      } else if (s.includes('紫微') || s.includes('ziwei')) {
        lines.push(`## 🌌 紫微斗數命盤解析報告\n`);
        const input = root.normalized_input || root;
        if (input.date || input.solarDate) lines.push(`- **生辰資料**：${input.date || input.solarDate} ${input.time || ''}（${input.gender || input.sex || '陽造'}）`);
        if (root.bureau) lines.push(`- **命盤局數**：${root.bureau} ｜ 命宮：【${root.mingPalaceBranch || root.mingGong || ''}宮】\n`);
        if (root.futureSpouse) {
          const sp = root.futureSpouse;
          lines.push(`### 💕 正緣畫像與夫妻宮解析`);
          if (sp.majorStars?.length) lines.push(`- **主星星曜**：${sp.majorStars.join('、')}`);
          if (sp.ageGap?.desc) lines.push(`- **年齡差距**：${sp.ageGap.tier}（${sp.ageGap.desc}）`);
          if (sp.appearance?.desc) lines.push(`- **外型氣質**：${sp.appearance.desc}`);
          if (sp.personality?.desc) lines.push(`- **性格特質**：${sp.personality.desc}`);
          if (sp.advice) lines.push(`- **相處建議**：${sp.advice}`);
          lines.push('');
        }
        if (root.maleSize && root.maleSize.tier) {
          lines.push(`### ⚡ 男性體能與尺寸命理速測`);
          lines.push(`- **規格格局**：【${root.maleSize.title || root.maleSize.tier}】（${root.maleSize.cmRange || ''}）\n`);
        }
      } else if (s.includes('梅花') || s.includes('meihua')) {
        lines.push(`## 🌸 梅花易數卦象解析報告\n`);
        if (root.bengua) lines.push(`- **本卦**：【${root.bengua.name || ''}】 ｜ **變卦**：【${root.biangua?.name || ''}】`);
        if (root.tiYong) lines.push(`- **體用關係**：【${root.tiYong.relation || ''}】（${root.tiYong.judgment || ''}）\n`);
      } else if (s.includes('八字') || s.includes('bazi')) {
        lines.push(`## 🏛️ 生辰八字命理格局報告\n`);
        if (root.dayMaster) lines.push(`- **日主元神**：【${root.dayMaster}】（${root.strength || '穩定'}）`);
        if (root.usefulGod) lines.push(`- **喜用神建議**：${root.usefulGod}\n`);
      } else if (s.includes('風水') || s.includes('fengshui')) {
        lines.push(`## 🏡 易經玄空風水佈局報告\n`);
        if (root.mountain) lines.push(`- **座向山向**：【${root.mountain}】（九運佈局）\n`);
      } else if (s.includes('姻緣') || s.includes('yinyuan')) {
        lines.push(`## 🌹 月老靈籤·姻緣解析報告\n`);
        if (root.stickNumber) lines.push(`### 第 ${root.stickNumber} 籤【${root.sign || '吉'}】${root.title ? ` - ${root.title}` : ''}\n> ${root.poem || ''}\n`);
      } else if (s.includes('解答之書') || s.includes('answerbook')) {
        lines.push(`## 📖 解答之書·當下啟示\n`);
        lines.push(`> ### 「${root.answer || root.quote || '傾聽您內心的聲音'}」\n`);
      } else {
        lines.push(`## 🔮 ${service || '命理諮詢'}成果報告\n`);
      }

      if (opts.supplement) {
        lines.push(`\n---\n\n### 🔮 大師深度解讀\n\n${opts.supplement}`);
      }
      return lines.join('\n');
    },
    formatSummary(service, data) {
      const root = (data && typeof data === 'object') ? (data.result || data.chart || data.report || data.data || data) : {};
      const dateStr = new Date().toLocaleDateString('zh-TW');
      const s = String(service || '').toLowerCase();
      if (s.includes('姓名') || s.includes('name')) {
        if (root.candidates) return `姓氏：${root.surname || '—'} ｜ 候選：${root.candidates.length} 組 ｜ 康熙筆畫`;
        if (root.name) return `姓名：${root.name} ｜ 筆畫口徑：康熙字典筆畫`;
      }
      if (s.includes('塔羅') || s.includes('tarot')) {
        if (root.lifeNumber || root.lifePathNumber) return `生命靈數：${root.lifeNumber || root.lifePathNumber} 號人 ｜ ${dateStr}`;
        return `牌陣：${root.spreadName || root.spread_name || '塔羅占卜'} ｜ ${dateStr}`;
      }
      if (s.includes('紫微') || s.includes('ziwei')) {
        return `紫微命盤 ｜ 局數：${root.bureau || '木三局'} ｜ ${dateStr}`;
      }
      if (s.includes('梅花') || s.includes('meihua')) {
        return `本卦：${root.bengua?.name || '起卦'} ｜ 變卦：${root.biangua?.name || ''}`;
      }
      return `${service || '命理諮詢'} ｜ ${dateStr}`;
    },
    formatSubject(service, data) {
      const root = (data && typeof data === 'object') ? (data.result || data.chart || data.report || data.data || data) : {};
      const s = String(service || '').toLowerCase();
      if (s.includes('姓名') || s.includes('name')) {
        if (root.candidates) return `【333】${root.surname || ''}姓 · 取名候選推薦報告（共 ${root.candidates.length} 組精選）`;
        if (root.name) return `【333】${root.name} · 姓名學完整分析評估報告`;
      }
      if (s.includes('塔羅') || s.includes('tarot')) {
        if (root.lifeNumber || root.lifePathNumber) return `【333】您的塔羅生命靈數與靈魂象徵牌報告（${root.lifeNumber || root.lifePathNumber} 號人）`;
        return `【333】韋特塔羅 · ${root.spreadName || root.spread_name || '占卜'}結果詳解`;
      }
      if (s.includes('紫微') || s.includes('ziwei')) return `【333】紫微斗數命盤解析與未來正緣畫像報告`;
      if (s.includes('梅花') || s.includes('meihua')) return `【333】梅花易數 · ${root.bengua?.name || ''}卦象解析與行動指引`;
      return `【333 一句提醒·照見當下】您的${service || '命理'}諮詢結果`;
    }
  };

  const getFormatter = () => window.DivinationEmailFormatter || Formatter;

  function publish(service, report, summary) {
    if (!report) return;
    const sName = service || routeService();
    const fmt = getFormatter();
    const humanSummary = (fmt.formatChartSummary ? fmt.formatChartSummary(sName, report, summary) : (fmt.formatSummary ? fmt.formatSummary(sName, report) : summary)) || summary || '';
    const humanText = fmt.formatHumanReadableReport ? fmt.formatHumanReadableReport(sName, report) : fmt.formatReport(sName, report);
    const humanSubject = fmt.formatSubject(sName, report);
    
    lastReport = {
      service: sName,
      summary: humanSummary,
      text: humanText,
      subject: humanSubject,
      raw: report,
      module: sName
    };
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
              lastReport.supplement = suppText;
              const fmt = getFormatter();
              lastReport.text = fmt.formatHumanReadableReport ? fmt.formatHumanReadableReport(service, lastReport.raw, { supplement: suppText }) : fmt.formatReport(service, lastReport.raw, { supplement: suppText });
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
    sendButton.disabled = false; sendButton.textContent = '確認寄送 ➔';
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
      const history = [{ role: 'assistant', content: lastReport.text || `# ${lastReport.service}結果\n\n${lastReport.summary}` }];
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
