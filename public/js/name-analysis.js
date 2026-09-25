(() => {
  const form = document.getElementById('nameForm');
  if (!form) return;

  let mode = 'verify';
  let lastRequest = {};
  let turnstileConfig = null;
  let turnstileWidgetId = null;
  let turnstileToken = '';
  let turnstileLoadPromise = null;

  const byId = (id) => document.getElementById(id);
  const status = byId('nameStatus');
  const results = byId('nameResults');
  const llmEnabled = document.body.dataset.llmEnabled === 'true';
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);

  function birthData() {
    const date = byId('birthDate').value;
    if (!date) return undefined;
    const time = byId('birthTime').value;
    return {
      date,
      sex: byId('birthSex').value,
      calendar: byId('birthCalendar').value,
      time: time || undefined,
      leap: byId('birthCalendar').value === 'lunar' && byId('birthLeap').checked,
      ziMode: byId('birthZiMode').value,
      allowUnknownHour: !time && byId('unknownBirthHour').checked
    };
  }

  function compactGloss(definition) {
    if (!definition) return '字義資料未收錄';
    const entries = String(definition).split(/[；;]/u).map((entry) => entry.trim()).filter(Boolean);
    const glosses = [];
    for (const entry of entries) {
      let gloss = entry.replace(/^（[^）]*）/u, '').trim();
      if (!gloss) continue;
      gloss = gloss.split(/[：:]/u)[0].split(/[，,。]/u)[0].trim();
      if (!gloss || gloss.length < 2 || /^(姓|又同|同上)$/u.test(gloss)) continue;
      if (!glosses.includes(gloss)) glosses.push(gloss.slice(0, 24));
      if (glosses.length === 2) break;
    }
    return glosses.length ? glosses.join('；') : '字典資料有收錄，請參考原始方法來源';
  }

  function renderCharacters(characters, selectedProfile) {
    return characters.map((character, index) => {
      const role = index === 0 ? '姓氏' : '名字';
      const gloss = compactGloss(character.definition);
      const strokeLabel = selectedProfile === 'modern' ? '現代' : '康熙';
      const stroke = character.stroke == null ? '未收錄' : `${character.stroke} 畫`;
      const element = character.element ? `<span class="name-element-tag element-${({ 木: 'wood', 火: 'fire', 土: 'earth', 金: 'metal', 水: 'water' })[character.element] || 'unknown'}">${esc(character.element)}行</span>` : '<span class="name-element-tag is-unknown">五行未收錄</span>';
      return `<article class="name-character-card">
        <div class="name-character-top"><span class="name-character-glyph">${esc(character.char)}</span><span class="name-character-role">${role}</span></div>
        <div class="name-character-pronunciation">${esc(character.pinyin || '讀音未收錄')}</div>
        <div class="name-character-tags">${element}<span class="name-stroke-tag">${strokeLabel} ${esc(stroke)}</span></div>
        <p class="name-character-gloss"><b>字典義節錄</b>${esc(gloss)}</p>
      </article>`;
    }).join('');
  }

  function renderGrid(grid) {
    if (!grid?.available || !grid.values) return `<div class="name-data-note">${esc(grid?.notice || '資料不足，無法計算五格。')}</div>`;
    const labels = { heaven: '天格', person: '人格', earth: '地格', outer: '外格', total: '總格' };
    const cells = Object.entries(grid.values).map(([key, value]) => `<div class="name-grid-cell">
      <span class="name-grid-label">${labels[key] || key}</span><strong>${value.number}</strong>
      <span class="name-grid-rating rating-${value.classification === '吉' ? 'good' : value.classification === '凶' ? 'caution' : 'neutral'}">${esc(value.classification || '未分類')}</span>
      <small>${esc(value.element)}行</small>
    </div>`).join('');
    const talents = grid.talents ? `<div class="name-talents-row">
      <span>天格・人格 <b>${grid.talents.heavenPerson.elements.map(esc).join(' → ')}</b> ${esc(grid.talents.heavenPerson.relation)}</span>
      <span>人格・地格 <b>${grid.talents.personEarth.elements.map(esc).join(' → ')}</b> ${esc(grid.talents.personEarth.relation)}</span>
    </div>` : '';
    return `<div class="name-grid-wrap"><div class="name-grid-cells">${cells}</div>${talents}</div>`;
  }

  function renderBazi(lens) {
    if (!lens?.summary) return '';
    const summary = lens.summary;
    const elements = summary.fiveElements?.counts || {};
    const elementColors = { 木: '#159669', 火: '#e35b45', 土: '#c58b22', 金: '#718096', 水: '#2684c7' };
    const bars = ['木', '火', '土', '金', '水'].map((element) => {
      const percentage = summary.fiveElements?.percentages?.[element] || 0;
      return `<div class="name-element-bar"><span>${element}</span><div class="name-bar-track"><i style="width:${Math.max(0, Math.min(100, percentage))}%;background:${elementColors[element]}"></i></div><b>${elements[element] || 0}</b><small>${percentage}%</small></div>`;
    }).join('');
    const pillars = (summary.fourPillars || []).map((pillar) => `<div class="name-pillar"><small>${esc(pillar.label)}</small><strong>${esc(pillar.value)}</strong></div>`).join('');
    const matched = (lens.matchingCharacters || []).map((item) => `<span class="name-match-tag">${esc(item.char)}・${esc(item.element)}行</span>`).join('') || '<span class="name-muted">字庫沒有可對照的姓名用字</span>';
    const assumptions = lens.assumptions || {};
    return `<section class="name-bazi-section">
      <div class="name-result-heading"><div><span class="name-kicker">LOCAL BAZI REFERENCE</span><h3>生辰八字與姓名用字對照</h3></div><span class="name-sex-pill">${esc(summary.sex)}命盤</span></div>
      <div class="name-bazi-overview"><div class="name-bazi-facts"><span>日主<strong>${esc(summary.dayMaster?.stem || '—')}・${esc(summary.dayMaster?.element || '—')}行</strong></span><span>日主強弱<strong>${esc(summary.strength || '未判定')}</strong></span><span>起運<strong>${esc(summary.startingLuckAge || '未提供')}</strong></span><span>首步大運<strong>${esc(summary.firstLuckCycle || '未排定')}</strong></span></div>
        <div class="name-pillars">${pillars}</div>
      </div>
      <div class="name-bazi-detail-grid"><div class="name-element-panel"><h4>五行分布</h4>${bars}</div><div class="name-useful-panel"><h4>喜用與姓名字</h4><p><b>喜用參考：</b>${esc(summary.usefulGod || lens.usefulElements.join('、') || '資料未得出')}</p><p><b>忌神參考：</b>${esc(summary.tabooGod || '資料未得出')}</p><div class="name-matched-characters">${matched}</div></div></div>
      <p class="name-assumption-note">使用${assumptions.calendar === 'lunar' ? '農曆' : '公曆'}・${esc(assumptions.birthHour || '出生時辰未提供')}・${assumptions.lunarLeapMonth ? '閏月' : '平月/不適用'}。${esc((summary.strengthBasis || []).join('；'))}。未提供出生地，未作真太陽時校正。${esc(lens.notice || '')}</p>
    </section>`;
  }

  function renderAnalysis(result) {
    const pinyin = (result.pronunciation || []).map((item) => item.pinyin).filter(Boolean).join(' · ');
    const selectedProfile = result.profile?.strokeField === 'bs' ? 'modern' : 'taiwanKangxi';
    const segmentation = result.segmentation?.ambiguous
      ? `<div class="name-segmentation-warning"><b>姓氏切分待確認</b><span>可能切分：${result.segmentation.alternatives.map((item) => `${esc(item.surname)}｜${esc(item.givenName)}`).join('、')}。請在上方明確指定姓氏後重新分析。</span></div>`
      : `<div class="name-segmentation-line"><span>姓 <b>${esc(result.surname || '—')}</b></span><i></i><span>名 <b>${esc(result.givenName || '—')}</b></span></div>`;
    const dataNotes = [];
    if (result.dataQuality?.missingCharactersOrStrokes?.length) dataNotes.push(`筆畫資料缺漏：${result.dataQuality.missingCharactersOrStrokes.join('、')}`);
    if (result.dataQuality?.unknownElementCharacters?.length) dataNotes.push(`字五行未收錄：${result.dataQuality.unknownElementCharacters.join('、')}`);
    return `<article class="name-result-card">
      <header class="name-result-hero"><div class="name-result-mark">名</div><div><span class="name-kicker">NAME PROFILE</span><h2>${esc(result.name)}</h2><p>${esc(pinyin || '字音資料未完整')} ${result.profile?.extendedLongGivenName ? '<span class="name-extended-tag">多字名延伸算法</span>' : ''}</p></div><span class="name-profile-pill">${esc(result.profile?.methodLabel || '姓名資料')}</span></header>
      ${segmentation}
      <section class="name-result-section"><div class="name-section-title"><span>01</span><h3>逐字解析</h3><small>依字庫資料呈現</small></div><div class="name-character-grid">${renderCharacters(result.characters || [], selectedProfile)}</div><p class="name-gloss-disclaimer">字義為字典釋義節錄，不直接推定個人性格；多音字未作語境判讀。</p></section>
      <section class="name-result-section"><div class="name-section-title"><span>02</span><h3>五格與三才</h3><small>${esc(selectedProfile === 'modern' ? '現代筆畫' : '康熙筆畫')}</small></div>${renderGrid(result.fiveGrid)}<p class="name-method-note">${esc(result.profile?.description || '')} ${esc(result.profile?.methodLabel || '')}。81 數理與三才屬傳統文化方法，適合作為參考。</p></section>
      ${result.baziLens ? `<section class="name-result-section">${renderBazi(result.baziLens)}</section>` : ''}
      ${dataNotes.length ? `<div class="name-data-note">${dataNotes.map(esc).join('　｜　')}；缺漏資料不作推測。</div>` : ''}
      <p class="name-result-disclaimer">${esc(result.interpretation || '')}</p>
    </article>`;
  }

  function loadTurnstileScript() {
    if (window.turnstile?.render) return Promise.resolve();
    if (turnstileLoadPromise) return turnstileLoadPromise;
    turnstileLoadPromise = new Promise((resolve, reject) => {
      let script = document.querySelector('script[src*="challenges.cloudflare.com/turnstile"]');
      if (!script) {
        script = document.createElement('script');
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }
      const timer = setTimeout(() => reject(new Error('Cloudflare Turnstile 載入逾時')), 12000);
      script.addEventListener('load', () => { clearTimeout(timer); resolve(); }, { once: true });
      script.addEventListener('error', () => { clearTimeout(timer); reject(new Error('Cloudflare Turnstile 載入失敗')); }, { once: true });
      const poll = setInterval(() => {
        if (window.turnstile?.render) { clearInterval(poll); clearTimeout(timer); resolve(); }
      }, 150);
    });
    return turnstileLoadPromise;
  }

  async function prepareTurnstile() {
    const wrapper = byId('nameTurnstileWrapper');
    const note = byId('nameTurnstileNote');
    const button = byId('nameQuestionForm').querySelector('button[type="submit"]');
    wrapper.hidden = false;
    try {
      const response = await fetch('/api/turnstile/config');
      turnstileConfig = await response.json();
      if (!turnstileConfig.enabled || !turnstileConfig.siteKey) {
        button.disabled = true;
        note.textContent = '本站尚未啟用人機驗證，AI 補充解讀暫不可用；姓名與八字計算仍可使用。';
        return;
      }
      await loadTurnstileScript();
      const container = byId('name-turnstile');
      button.disabled = true;
      if (turnstileWidgetId === null) {
        turnstileWidgetId = window.turnstile.render(container, {
          sitekey: turnstileConfig.siteKey,
          action: container.dataset.action || 'llm_analysis',
          theme: 'auto',
          size: 'flexible',
          callback: (token) => { turnstileToken = token; note.textContent = ''; button.disabled = false; },
          'expired-callback': () => { turnstileToken = ''; button.disabled = true; note.textContent = '驗證已過期，請重新完成驗證。'; },
          'error-callback': () => { turnstileToken = ''; button.disabled = true; note.textContent = '驗證載入失敗，請重新整理後再試。'; }
        });
      }
    } catch (error) {
      button.disabled = true;
      note.textContent = `${error.message}；請重新整理後再試。`;
    }
  }

  async function showQuestionForm() {
    const questionForm = byId('nameQuestionForm');
    if (!llmEnabled) return;
    questionForm.hidden = false;
    await prepareTurnstile();
  }

  byId('birthCalendar').addEventListener('change', () => {
    byId('birthLeapField').hidden = byId('birthCalendar').value !== 'lunar';
  });

  document.querySelectorAll('.name-tab').forEach((button) => button.addEventListener('click', () => {
    mode = button.dataset.mode;
    document.querySelectorAll('.name-tab').forEach((tab) => {
      const active = tab === button;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', String(active));
    });
    byId('fullNameField').hidden = mode !== 'verify';
    byId('lengthField').hidden = mode !== 'generate';
    byId('constraintFields').hidden = mode !== 'generate';
    byId('surname').maxLength = mode === 'generate' ? 3 : 7;
    byId('surname').required = mode === 'generate';
    byId('fullName').required = mode === 'verify';
    byId('submitName').textContent = mode === 'verify' ? '立即分析姓名 ➔' : '立即產生命名候選 ➔';
    byId('nameQuestionForm').hidden = true;
    status.textContent = '';
    results.replaceChildren();
  }));

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const surname = String(formData.get('surname') || '').trim();
    const birth = birthData();
    if (birth && !['男', '女'].includes(birth.sex)) {
      status.textContent = '填入出生日期時，請選擇排盤性別。';
      byId('birthSex').focus();
      return;
    }
    if (birth && !birth.time && !birth.allowUnknownHour) {
      status.textContent = '請填出生時間，或勾選「我不清楚出生時辰」。';
      byId('birthTime').focus();
      return;
    }
    if (mode === 'generate' && !surname) {
      status.textContent = '取名模式請先填入姓氏。';
      byId('surname').focus();
      return;
    }

    let endpoint = '/api/name-analysis/verify';
    let body = { name: String(formData.get('name') || '').trim(), surname: surname || undefined, profile: formData.get('profile'), birthData: birth, mode: 'verify' };
    lastRequest = { ...body };
    if (mode === 'generate') {
      endpoint = '/api/name-analysis/generate';
      body = {
        surname,
        profile: formData.get('profile'),
        givenNameLength: Number(formData.get('givenNameLength')),
        includeChars: [...byId('includeChars').value.trim()],
        excludeChars: [...byId('excludeChars').value.trim()],
        desiredElements: byId('desiredElements').value ? [byId('desiredElements').value] : [],
        nameStyle: byId('nameStyle').value,
        birthData: birth
      };
      lastRequest = { ...body, mode: 'generate' };
    }

    status.textContent = '正在整理姓名與生辰資料…';
    results.replaceChildren();
    byId('nameQuestionForm').hidden = true;
    if (window.turnstile && turnstileWidgetId !== null) {
      turnstileToken = '';
      try { window.turnstile.reset(turnstileWidgetId); } catch (error) {}
    }
    try {
      const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || '計算失敗');
      if (mode === 'verify') {
        results.innerHTML = renderAnalysis(data.result);
      } else {
        const style = data.result.nameStyle;
        const styleIntro = style ? `<div class="name-data-note"><b>命名風格：${esc(style.label)}</b>　依${style.requested === 'auto' ? '出生性別的常見用字傾向' : '你選擇的用字傾向'}排序；這只調整候選先後，不限制可選名字，也不判斷個人性別。你可以隨時更改偏好。姓名語料取自 365 萬筆 CCNC，主要反映中國大陸一至二字名字，只作參考排序。</div>` : '';
        const cards = data.result.candidates.map((candidate, index) => {
          const stylePreference = candidate.preferences?.nameStyle || {};
          const corpus = stylePreference.corpusEvidence;
          const charCounts = corpus?.characters?.map((item) => `${esc(item.char)}（女 ${Number(item.feminineExamples || 0).toLocaleString()}／男 ${Number(item.masculineExamples || 0).toLocaleString()}）`).join('　') || '';
          const pairCounts = corpus?.firstPair ? `；名字字組「${esc(corpus.firstPair.pair)}」：女 ${Number(corpus.firstPair.feminineExamples || 0).toLocaleString()} 次／男 ${Number(corpus.firstPair.masculineExamples || 0).toLocaleString()} 次` : '';
          const evidence = corpus ? `<div class="name-corpus-evidence">語料觀察（非性別判定）：${charCounts}${pairCounts}</div>` : '';
          return `<div class="name-candidate-rank"><span>候選 ${String(index + 1).padStart(2, '0')} · ${esc(stylePreference.label || '')}${stylePreference.conflictingCharacters?.length ? ` · 風格不同字：${esc(stylePreference.conflictingCharacters.join('、'))}` : ''} · 語料排序 ${Number(stylePreference.corpusScore || 0) > 0 ? '+' : ''}${Number(stylePreference.corpusScore || 0)}</span>${evidence}${renderAnalysis(candidate.analysis)}</div>`;
        }).join('');
        results.innerHTML = styleIntro + (cards || '<div class="name-empty-state">目前條件下找不到完整候選。請放寬條件或調整字數後重試。</div>');
      }
      status.textContent = mode === 'verify' ? '姓名與生辰資料已整理完成。' : `已依條件整理 ${data.result.candidates.length} 個候選。`;
      await showQuestionForm();
    } catch (error) {
      status.textContent = error.message;
    }
  });

  byId('nameQuestionForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const question = byId('nameQuestion').value.trim();
    const answer = byId('nameQuestionAnswer');
    if (!question) { answer.textContent = '請先寫下想了解的問題。'; return; }
    if (turnstileConfig?.enabled && !turnstileToken) {
      byId('nameTurnstileNote').textContent = '請先完成 Cloudflare 人機驗證。';
      return;
    }
    const button = byId('nameQuestionForm').querySelector('button[type="submit"]');
    button.disabled = true;
    answer.textContent = '正在整理補充解讀…';
    try {
      const response = await fetch('/api/name-analysis-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...lastRequest, question, turnstileToken, 'cf-turnstile-response': turnstileToken })
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || '補充解讀失敗');
      answer.innerHTML = data.analysis && window.MarkdownRenderer?.render
        ? window.MarkdownRenderer.render(data.analysis)
        : esc(data.analysis || '已完成確定性姓名分析。');
    } catch (error) {
      answer.textContent = error.message;
    } finally {
      if (window.turnstile && turnstileWidgetId !== null) {
        try { window.turnstile.reset(turnstileWidgetId); } catch (error) {}
      }
      turnstileToken = '';
      button.disabled = false;
    }
  });
})();
