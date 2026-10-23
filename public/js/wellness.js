/**
 * public/js/wellness.js
 * 獨立五運六氣 · 節氣經絡養生互動腳本
 */
(() => {
    'use strict';

    const form = document.getElementById('wellnessForm');
    if (!form) return;

    const targetYearInput = document.getElementById('wellnessTargetYear');
    const targetHourSelect = document.getElementById('wellnessTargetHour');
    const birthDateInput = document.getElementById('wellnessBirthDate');
    const submitBtn = document.getElementById('btnSubmitWellness');
    const loadingEl = document.getElementById('wellnessLoading');
    const errorEl = document.getElementById('wellnessError');
    const resultContainer = document.getElementById('wellnessResultContainer');
    const followUpSection = document.getElementById('wellnessFollowUpSection');
    const followUpHistory = document.getElementById('wellnessFollowUpHistory');
    const followUpInput = document.getElementById('wellnessFollowUpInput');
    const askFollowupBtn = document.getElementById('btnWellnessAskFollowup');

    let currentWellnessData = null;
    window.conversationHistory = [];

    const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[c]);

    // --- Cloudflare Turnstile Verification ---
    let suiteTurnstileWidgetId = null;
    let currentSuiteTurnstileToken = '';
    let suiteTurnstileRenderRetries = 0;

    let suiteFollowUpWidgetId = null;
    let currentFollowUpTurnstileToken = '';
    let suiteFollowUpRenderRetries = 0;

    function loadTurnstileScript(callback) {
        if (typeof window.turnstile !== 'undefined' && typeof window.turnstile.render === 'function') {
            return callback(null);
        }
        const existing = document.querySelector('script[src*="challenges.cloudflare.com/turnstile"]');
        if (existing) {
            existing.addEventListener('load', () => callback(null));
            existing.addEventListener('error', (err) => callback(err || new Error('Turnstile script failed to load')));
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.async = true;
        script.defer = true;
        script.onload = () => callback(null);
        script.onerror = (err) => callback(err || new Error('Turnstile script failed to load'));
        document.head.appendChild(script);
    }

    function renderSuiteTurnstile() {
        const container = document.getElementById('suite-turnstile');
        if (!container || typeof container.getAttribute !== 'function') return;
        const sitekey = container.getAttribute('data-sitekey');
        if (!sitekey) return;

        loadTurnstileScript((err) => {
            if (err) {
                console.warn('[Turnstile] Wellness suite widget failed to load:', err);
                return;
            }
            if (!window.turnstile || typeof window.turnstile.render !== 'function') {
                if (suiteTurnstileRenderRetries < 20) {
                    suiteTurnstileRenderRetries++;
                    setTimeout(renderSuiteTurnstile, 250);
                }
                return;
            }
            suiteTurnstileRenderRetries = 0;
            if (suiteTurnstileWidgetId === null) {
                try {
                    const action = container.getAttribute('data-action') || 'divination_analysis';
                    suiteTurnstileWidgetId = window.turnstile.render(container, {
                        sitekey: sitekey,
                        action: action,
                        theme: 'auto',
                        size: 'flexible',
                        callback: (token) => { currentSuiteTurnstileToken = token; },
                        'expired-callback': () => { currentSuiteTurnstileToken = ''; },
                        'error-callback': () => { currentSuiteTurnstileToken = ''; }
                    });
                } catch (e) {
                    console.warn('[Turnstile] Wellness suite render error:', e);
                }
            }
        });
    }

    function renderSuiteFollowUpTurnstile() {
        const container = document.getElementById('suite-followup-turnstile');
        if (!container || typeof container.getAttribute !== 'function') return;
        const sitekey = container.getAttribute('data-sitekey');
        if (!sitekey) return;

        loadTurnstileScript((err) => {
            if (err) {
                console.warn('[Turnstile] Wellness followup widget failed to load:', err);
                return;
            }
            if (!window.turnstile || typeof window.turnstile.render !== 'function') {
                if (suiteFollowUpRenderRetries < 20) {
                    suiteFollowUpRenderRetries++;
                    setTimeout(renderSuiteFollowUpTurnstile, 250);
                }
                return;
            }
            suiteFollowUpRenderRetries = 0;
            if (suiteFollowUpWidgetId === null) {
                try {
                    const action = container.getAttribute('data-action') || 'llm_analysis';
                    suiteFollowUpWidgetId = window.turnstile.render(container, {
                        sitekey: sitekey,
                        action: action,
                        theme: 'auto',
                        size: 'flexible',
                        callback: (token) => { currentFollowUpTurnstileToken = token; },
                        'expired-callback': () => { currentFollowUpTurnstileToken = ''; },
                        'error-callback': () => { currentFollowUpTurnstileToken = ''; }
                    });
                } catch (e) {
                    console.warn('[Turnstile] Wellness followup render error:', e);
                }
            }
        });
    }

    renderSuiteTurnstile();

    // 初始化當前小時
    try {
        const currentH = new Date().getHours();
        if (targetHourSelect) {
            // 尋找最適時辰
            const options = Array.from(targetHourSelect.options);
            for (let i = 0; i < options.length; i++) {
                const h = Number(options[i].value);
                if (h === currentH || (currentH % 2 === 0 && h === currentH) || (currentH % 2 === 1 && h === currentH - 1) || (currentH === 23 && h === 0)) {
                    targetHourSelect.selectedIndex = i;
                    break;
                }
            }
        }
    } catch (_) {}

    // 表單提交
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const targetYear = Number(targetYearInput?.value || new Date().getFullYear());
        const currentHour = Number(targetHourSelect?.value ?? new Date().getHours());
        const birthDate = birthDateInput?.value ? birthDateInput.value.trim() : undefined;

        if (isNaN(targetYear) || targetYear < 1900 || targetYear > 2100) {
            alert('請輸入有效西元年份（1900 ~ 2100）');
            targetYearInput?.focus();
            return;
        }

        // 驗證 Turnstile 人機驗證 (若前端有渲染且啟用)
        let sToken = currentSuiteTurnstileToken;
        if (!sToken && window.turnstile && suiteTurnstileWidgetId !== null) {
            try { sToken = window.turnstile.getResponse(suiteTurnstileWidgetId); } catch (e) {}
        }
        const suiteTurnstileElem = document.getElementById('suite-turnstile');
        if (!sToken && suiteTurnstileElem && typeof suiteTurnstileElem.getAttribute === 'function' && suiteTurnstileElem.getAttribute('data-sitekey')) {
            alert('請先勾選並完成人機驗證（Cloudflare Turnstile）');
            return;
        }

        errorEl.style.display = 'none';
        resultContainer.style.display = 'none';
        followUpSection.style.display = 'none';
        loadingEl.style.display = 'block';
        submitBtn.disabled = true;

        try {
            const resp = await fetch('/api/bazi2/yunqi-wellness', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    targetYear,
                    currentHour,
                    date: birthDate,
                    turnstileToken: sToken || undefined,
                    'cf-turnstile-response': sToken || undefined
                })
            });
            const data = await resp.json();
            if (!resp.ok || !data.success) {
                throw new Error(data.error || '五運六氣推演失敗');
            }

            currentWellnessData = data;
            renderWellnessResult(data);

            // 註冊至全域郵件發送器
            if (typeof window.publishSuiteEmailResult === 'function') {
                window.publishSuiteEmailResult('五運六氣養生', data, data.summary || `五運六氣養生報告 · ${targetYear}年`);
            }
            if (typeof window !== 'undefined') {
                window.lastSuiteResult = data;
            }

            // 開啟追問區
            if (followUpSection) {
                followUpSection.style.display = 'block';
                followUpHistory.innerHTML = '';
                window.conversationHistory = [
                    { role: 'user', content: `查詢年份：${targetYear}，查詢時辰：${currentHour}時，出生日期：${birthDate || '未填寫'}` },
                    { role: 'assistant', content: data.summary || `完成推演：${targetYear}年歲運為【${data.suiYun}】，司天【${data.siTian}】，在泉【${data.zaiQuan}】。` }
                ];
                renderSuiteFollowUpTurnstile();
            }
        } catch (err) {
            errorEl.innerHTML = `<i data-lucide="alert-circle" style="width: 16px; height: 16px; vertical-align: -2px;"></i> 推演失敗：${esc(err.message)}`;
            errorEl.style.display = 'block';
            if (window.lucide && typeof window.lucide.createIcons === 'function') {
                window.lucide.createIcons();
            }
        } finally {
            loadingEl.style.display = 'none';
            submitBtn.disabled = false;
            if (window.turnstile && suiteTurnstileWidgetId !== null) {
                try { window.turnstile.reset(suiteTurnstileWidgetId); } catch (e) {}
                currentSuiteTurnstileToken = '';
            }
            if (window.lucide && typeof window.lucide.createIcons === 'function') {
                window.lucide.createIcons();
            }
        }
    });

    function renderWellnessResult(data) {
        const annual = data.annualYunqi || {};
        const birth = data.birthYunqi || null;
        const solar = data.solarTermWellness || {};
        const clock = data.meridianClock || {};
        const advice = data.wellnessAdvice || {};
        const allShichen = clock.allShichen || [];
        const activeShichen = clock.activeShichen || {};

        let birthHtml = '';
        if (birth && birth.birthYear) {
            birthHtml = `
                <section class="suite-section-card" style="background: rgba(59, 130, 246, 0.02);">
                    <div class="suite-section-title-wrap">
                        <i data-lucide="dna" style="width: 18px; height: 18px; color: var(--suite-primary);"></i>
                        <h3>先天本命體質稟賦</h3>
                        <span class="suite-tag" style="margin-left: auto;">出生命盤氣質</span>
                    </div>
                    <div class="suite-kv-grid" style="grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));">
                        <div class="suite-kv-card">
                            <div class="suite-kv-label">出生年干支</div>
                            <div class="suite-kv-value" style="font-size: var(--type-label);">${esc(birth.birthYear)}（${esc(birth.birthGanZhi || '')}年）</div>
                        </div>
                        <div class="suite-kv-card">
                            <div class="suite-kv-label">先天歲運稟賦</div>
                            <div class="suite-kv-value" style="font-size: var(--type-label);">${esc(birth.birthMovement?.nature || '')}（${esc(birth.birthMovement?.tone || '')}）</div>
                        </div>
                        <div class="suite-kv-card">
                            <div class="suite-kv-label">先天司天 · 在泉</div>
                            <div class="suite-kv-value" style="font-size: var(--type-label);">${esc(birth.birthSixQi?.siTian || '')} ｜ ${esc(birth.birthSixQi?.zaiQuan || '')}</div>
                        </div>
                    </div>
                    ${birth.constitutionalAnalysis ? `
                        <div class="suite-quote-box" style="margin-top: 10px;">
                            <strong style="color: var(--suite-primary);"><i data-lucide="sparkles" style="width: 14px; height: 14px; vertical-align: -2px;"></i> 體質調養指引：</strong>${esc(birth.constitutionalAnalysis)}
                        </div>
                    ` : ''}
                </section>
            `;
        }

        const clockCardsHtml = allShichen.map((item) => {
            const isActive = item.isCurrent;
            const cardClass = isActive ? 'meridian-shichen-card active' : 'meridian-shichen-card';
            return `
                <div class="${cardClass}" data-shichen="${esc(item.shichen)}">
                    <div class="meridian-card-time">
                        ${esc(item.timeRange || '')}
                        ${isActive ? '<span class="suite-tag suite-tag-gold" style="float: right; font-size: var(--type-meta); padding: 2px 6px;">當令</span>' : ''}
                    </div>
                    <div class="meridian-card-name">${esc(item.shichen)} · ${esc(item.meridian)}</div>
                    <div class="meridian-card-action">${esc(item.action)}</div>
                    ${item.acupoint ? `<div style="font-size: var(--type-meta); color: var(--suite-text-muted); margin-top: 4px;"><i data-lucide="target" style="width: 12px; height: 12px; vertical-align: -1px;"></i> 重點穴位：<strong>${esc(item.acupoint)}</strong></div>` : ''}
                </div>
            `;
        }).join('');

        resultContainer.innerHTML = `
            <article class="name-result-card wellness-card" style="border: 1.5px solid var(--suite-border); border-radius: 14px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06);">
                <header class="wellness-result-hero">
                    <div style="display: flex; align-items: center; gap: 14px;">
                        <div class="wellness-hero-icon">
                            <i data-lucide="heart-pulse" style="width: 24px; height: 24px;"></i>
                        </div>
                        <div>
                            <div class="suite-result-heading-group">
                                <span class="suite-tag badge-wellness">五運六氣</span>
                                <h2 class="suite-result-title">${esc(data.year)}（${esc(data.yearGanZhi)}年）養生報告</h2>
                            </div>
                            <p class="suite-result-sub">
                                歲運：【${esc(data.suiYun)}】 · 司天：【${esc(data.siTian)}】 · 在泉：【${esc(data.zaiQuan)}】
                            </p>
                        </div>
                    </div>
                    <span class="suite-tag badge-wellness" style="padding: 6px 12px; font-weight: 700;">
                        當令節氣：${esc(solar.currentTerm || data.solarTerm || '立春')}
                    </span>
                </header>

                <!-- 1. 流年客氣天時氣候 -->
                <section class="suite-section-card">
                    <div class="suite-section-title-wrap">
                        <i data-lucide="cloud-sun" style="width: 18px; height: 18px; color: var(--suite-primary);"></i>
                        <h3>流年歲運與客氣氣候節奏</h3>
                        <span class="suite-tag" style="margin-left: auto;">天地升降</span>
                    </div>
                    <div class="suite-kv-grid" style="grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));">
                        <div class="suite-kv-card" style="text-align: left; padding: 12px 14px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                                <span class="suite-kv-label">歲運（中運）：<strong>${esc(annual.greatMovement?.nature || data.suiYun)}</strong></span>
                                <span class="suite-tag" style="font-size: var(--type-meta);">${esc(annual.greatMovement?.tone || '五音')}</span>
                            </div>
                            <div style="font-size: var(--type-reading); line-height: var(--leading-reading); color: var(--suite-text);">
                                ${esc(annual.greatMovement?.impact || '氣運流轉，順應中和。')}
                            </div>
                        </div>
                        <div class="suite-kv-card" style="text-align: left; padding: 12px 14px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                                <span class="suite-kv-label">司天在泉（六氣主客）</span>
                                <span class="suite-tag" style="font-size: var(--type-meta);">客氣循行</span>
                            </div>
                            <div style="font-size: var(--type-reading); line-height: var(--leading-reading); color: var(--suite-text);">
                                上半年司天：<strong>${esc(data.siTian)}</strong>；下半年在泉：<strong>${esc(data.zaiQuan)}</strong>。<br>
                                ${esc(annual.sixQi?.impact || '六氣相循，注意寒溫調和。')}
                            </div>
                        </div>
                    </div>
                </section>

                <!-- 2. 本命體質 (選填) -->
                ${birthHtml}

                <!-- 3. 二十四節氣食養起居 -->
                <section class="suite-section-card">
                    <div class="suite-section-title-wrap">
                        <i data-lucide="sun" style="width: 18px; height: 18px; color: var(--suite-primary);"></i>
                        <h3>【${esc(solar.currentTerm || data.solarTerm)}】當令節氣食養起居</h3>
                        <span class="suite-tag" style="margin-left: auto;">順應節氣</span>
                    </div>
                    <div class="suite-kv-grid" style="grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));">
                        <div class="suite-kv-card" style="text-align: left; padding: 12px 14px;">
                            <div class="suite-kv-label" style="font-weight: 700; color: var(--suite-primary); display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
                                <i data-lucide="utensils" style="width: 14px; height: 14px;"></i> 飲食調和宜忌
                            </div>
                            <div style="font-size: var(--type-reading); line-height: var(--leading-reading); color: var(--suite-text);">
                                ${esc(solar.dietAdvice || advice.diet || '清淡溫熱，少食辛辣')}
                            </div>
                        </div>
                        <div class="suite-kv-card" style="text-align: left; padding: 12px 14px;">
                            <div class="suite-kv-label" style="font-weight: 700; color: var(--suite-primary); display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
                                <i data-lucide="moon" style="width: 14px; height: 14px;"></i> 起居作息指引
                            </div>
                            <div style="font-size: var(--type-reading); line-height: var(--leading-reading); color: var(--suite-text);">
                                ${esc(solar.lifestyleAdvice || advice.lifestyle || '早睡早起，順應日照')}
                            </div>
                        </div>
                    </div>
                </section>

                <!-- 4. 十二時辰子午流注經絡鐘 -->
                <section class="suite-section-card">
                    <div class="suite-section-title-wrap">
                        <i data-lucide="clock" style="width: 18px; height: 18px; color: var(--suite-primary);"></i>
                        <h3>十二時辰子午流注經絡鐘</h3>
                        <span class="suite-tag" style="margin-left: auto;">氣血循行</span>
                    </div>
                    <div style="font-size: var(--type-caption); color: var(--suite-text-muted); margin-bottom: 10px;">
                        當前查詢時辰為【<strong>${esc(activeShichen.shichen || clock.shichen)} · ${esc(activeShichen.meridian || clock.meridian)}</strong>】
                    </div>
                    <div class="meridian-clock-grid">
                        ${clockCardsHtml}
                    </div>
                </section>

                <!-- 5. 總結指引與郵件寄送 -->
                <section class="suite-section-card" style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.04) 100%);">
                    <div class="suite-section-title-wrap" style="margin-bottom: 6px;">
                        <i data-lucide="compass" style="width: 18px; height: 18px; color: #059669;"></i>
                        <h3 style="color: #065f46;">黃帝內經養生心法錦囊</h3>
                    </div>
                    <div class="suite-quote-box" style="border-left-color: #10b981;">
                        ${esc(data.summary)}
                    </div>
                    ${Array.isArray(advice.acupuncturePoints) && advice.acupuncturePoints.length ? `
                        <div style="margin-top: 10px; font-size: var(--type-caption); color: #047857; display: flex; align-items: center; gap: 6px;">
                            <i data-lucide="target" style="width: 14px; height: 14px;"></i> 推薦保養穴位：<strong>${esc(advice.acupuncturePoints.join('、'))}</strong>
                        </div>
                    ` : ''}
                </section>
                <div class="suite-followup-actions-bar" style="padding: 14px 20px;">
                    <button type="button" class="suite-btn-email-inline js-open-result-email">
                        <i data-lucide="mail"></i> 將完整五運六氣與子午流注養生報告寄到我的信箱 ➔
                    </button>
                </div>
            </article>
        `;

        resultContainer.style.display = 'block';
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
        }
        resultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // 追問處理
    askFollowupBtn?.addEventListener('click', async () => {
        const q = (followUpInput?.value || '').trim();
        if (!q) return;
        if (!currentWellnessData) return;

        // 驗證追問 Turnstile 人機驗證 (若前端有渲染且啟用)
        let fuToken = currentFollowUpTurnstileToken;
        if (!fuToken && window.turnstile && suiteFollowUpWidgetId !== null) {
            try { fuToken = window.turnstile.getResponse(suiteFollowUpWidgetId); } catch (e) {}
        }
        const fuElem = document.getElementById('suite-followup-turnstile');
        if (!fuToken && fuElem && typeof fuElem.getAttribute === 'function' && fuElem.getAttribute('data-sitekey')) {
            alert('請先勾選並完成追問人機驗證（Cloudflare Turnstile）');
            return;
        }

        askFollowupBtn.disabled = true;
        askFollowupBtn.textContent = '分析中…';

        try {
            const resp = await fetch('/api/wellness/question', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    targetYear: currentWellnessData.year,
                    currentHour: currentWellnessData.meridianClock?.currentHour,
                    birthDate: currentWellnessData.birthYunqi?.birthDate || birthDateInput?.value,
                    question: q,
                    conversationHistory: window.conversationHistory || [],
                    turnstileToken: fuToken || undefined,
                    'cf-turnstile-response': fuToken || undefined
                })
            });
            const data = await resp.json();
            if (data.success && data.analysis) {
                const answerHtml = window.MarkdownRenderer?.render
                    ? window.MarkdownRenderer.render(data.analysis)
                    : esc(data.analysis).replace(/\n/g, '<br>');

                const turnDiv = document.createElement('div');
                turnDiv.className = 'suite-conversation-turn';
                turnDiv.style.marginBottom = '14px';
                turnDiv.style.padding = '14px';
                turnDiv.style.background = 'var(--suite-bg-card, rgba(255,255,255,0.03))';
                turnDiv.style.borderRadius = '10px';
                turnDiv.style.border = '1px solid var(--suite-border)';

                turnDiv.innerHTML = `
                    <div style="font-weight: 700; color: var(--suite-primary); margin-bottom: 6px;">問：${esc(q)}</div>
                    <div class="markdown-body" style="font-size: var(--type-reading); line-height: var(--leading-reading);">${answerHtml}</div>
                `;
                followUpHistory.appendChild(turnDiv);
                followUpInput.value = '';

                window.conversationHistory.push({ role: 'user', content: q });
                window.conversationHistory.push({ role: 'assistant', content: data.analysis });

                if (typeof window.publishSuiteEmailResult === 'function') {
                    window.publishSuiteEmailResult('五運六氣養生', currentWellnessData, { supplement: data.analysis });
                }
            } else {
                alert('追問未能完成：' + (data.error || '請稍後再試'));
            }
        } catch (e) {
            alert('追問出錯：' + e.message);
        } finally {
            askFollowupBtn.disabled = false;
            askFollowupBtn.innerHTML = '<i data-lucide="send"></i> 送出提問 ➔';
            if (window.turnstile && suiteFollowUpWidgetId !== null) {
                try { window.turnstile.reset(suiteFollowUpWidgetId); } catch (e) {}
                currentFollowUpTurnstileToken = '';
            }
            if (window.lucide && typeof window.lucide.createIcons === 'function') {
                window.lucide.createIcons();
            }
        }
    });
})();
