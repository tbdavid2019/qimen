/**
 * public/js/cezi.js
 * 獨立測字占事互動腳本
 */
(() => {
    const form = document.getElementById('standaloneCeziForm');
    if (!form) return;

    const charInput = document.getElementById('ceziCharInput');
    const questionInput = document.getElementById('ceziQuestionInput');
    const birthDateInput = document.getElementById('ceziBirthDateInput');
    const sexInput = document.getElementById('ceziSexInput');
    const submitBtn = document.getElementById('btnSubmitCezi');
    const loadingEl = document.getElementById('ceziLoading');
    const errorEl = document.getElementById('ceziError');
    const resultCard = document.getElementById('ceziResultCard');
    const followUpSection = document.getElementById('ceziFollowUpSection');
    const followUpHistory = document.getElementById('ceziFollowUpHistory');
    const followUpInput = document.getElementById('ceziFollowUpInput');
    const askFollowupBtn = document.getElementById('btnCeziAskFollowup');

    let currentCeziData = null;
    window.conversationHistory = [];

    const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[c]);

    // 快捷問事膠囊點選
    document.querySelectorAll('.cezi-purpose-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            document.querySelectorAll('.cezi-purpose-pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            if (questionInput) {
                questionInput.value = pill.getAttribute('data-text') || '';
                questionInput.focus();
            }
        });
    });

    // 表單提交
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const char = (charInput?.value || '').trim();
        const question = (questionInput?.value || '').trim();
        const birthDate = birthDateInput?.value || undefined;
        const sex = sexInput?.value || '男';

        if (!char) {
            alert('請輸入欲測之單個漢字！');
            charInput?.focus();
            return;
        }
        if (!question) {
            alert('請填寫欲占問之具體事項！');
            questionInput?.focus();
            return;
        }

        errorEl.style.display = 'none';
        resultCard.style.display = 'none';
        followUpSection.style.display = 'none';
        loadingEl.style.display = 'block';
        submitBtn.disabled = true;

        try {
            const resp = await fetch('/api/name-analysis/cezi', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ char, question, birthDate, sex })
            });
            const data = await resp.json();
            if (!resp.ok || !data.success) {
                throw new Error(data.error || '測字占事推演失敗');
            }

            currentCeziData = data.result || data;
            renderResult(currentCeziData);

            // 供郵件匯出模組讀取
            if (typeof window !== 'undefined') {
                window.lastNameAnalysisState = {
                    mode: 'cezi',
                    result: currentCeziData,
                    question
                };
            }

            // 開啟追問區
            if (followUpSection) {
                followUpSection.style.display = 'block';
                followUpHistory.innerHTML = '';
                window.conversationHistory = [
                    { role: 'user', content: `測字問事：字「${currentCeziData.char}」，所問事項：【${question}】` },
                    { role: 'assistant', content: currentCeziData.summary || `測得象數調和為【${currentCeziData.judgment}】。` }
                ];
            }
        } catch (err) {
            errorEl.innerHTML = `<i data-lucide="alert-circle" style="width: 16px; height: 16px; vertical-align: -2px;"></i> 測字推演失敗：${esc(err.message)}`;
            errorEl.style.display = 'block';
            if (window.lucide && typeof window.lucide.createIcons === 'function') {
                window.lucide.createIcons();
            }
        } finally {
            loadingEl.style.display = 'none';
            submitBtn.disabled = false;
            if (window.lucide && typeof window.lucide.createIcons === 'function') {
                window.lucide.createIcons();
            }
        }
    });

    function renderResult(res) {
        const hex = res.charHexagram || {};
        const n81 = res.numerology81 || {};
        const bazi = res.baziComplement || {};
        const rawAdvice = res.adviceText || res.advice || '';
        const adviceStr = typeof rawAdvice === 'object' && rawAdvice !== null
            ? Object.entries(rawAdvice).map(([k, v]) => `【${k}】${v}`).join(' ')
            : String(rawAdvice);

        const judgmentBadgeClass = res.judgment === '大吉' || res.judgment === '中吉' ? 'auspicious' : 'inauspicious';

        resultCard.innerHTML = `
            <article class="suite-card cezi-card" style="padding: 0; overflow: hidden;">
                <header class="cezi-result-hero">
                    <div style="display: flex; align-items: center; gap: 14px;">
                        <div class="cezi-glyph-box">
                            ${esc(res.char)}
                        </div>
                        <div>
                            <div class="suite-result-heading-group">
                                <span class="suite-badge"><i data-lucide="feather" style="width: 13px; height: 13px; vertical-align: -1px;"></i> 測字直斷</span>
                                <h2 class="suite-result-title">測「${esc(res.char)}」字</h2>
                            </div>
                            <p class="suite-result-sub">占問事項：${esc(res.question || questionInput.value)}</p>
                        </div>
                    </div>
                    <span class="suite-tag ${judgmentBadgeClass}" style="font-size: var(--type-label); font-weight: 800; padding: 6px 14px;">
                        ${esc(res.judgment || '大吉')}
                    </span>
                </header>

                <!-- 1. 漢字造字與五行 -->
                <section class="suite-section-card">
                    <div class="suite-section-title-wrap">
                        <i data-lucide="book-open" style="width: 16px; height: 16px; color: var(--suite-primary);"></i>
                        <h3>字形構造與易理五行</h3>
                    </div>
                    <div class="suite-kv-grid">
                        <div class="suite-kv-card">
                            <div class="suite-kv-label">康熙筆畫</div>
                            <div class="suite-kv-value">${esc(res.stroke)} 畫</div>
                        </div>
                        <div class="suite-kv-card">
                            <div class="suite-kv-label">字音讀音</div>
                            <div class="suite-kv-value">${esc(res.pinyin || '—')}</div>
                        </div>
                        <div class="suite-kv-card">
                            <div class="suite-kv-label">五行歸屬</div>
                            <div class="suite-kv-value">${esc(res.element)}行</div>
                        </div>
                        <div class="suite-kv-card">
                            <div class="suite-kv-label">字形結構</div>
                            <div class="suite-kv-value">${esc(res.structure || '獨體')}</div>
                        </div>
                    </div>
                    <div class="suite-quote-box">
                        <strong>拆字機鋒：</strong>${esc(res.structureMeaning || res.glyphDeconstruction || '字理聚氣，順勢而為')}
                        ${res.definition ? `<br><small style="color: var(--suite-text-muted);">字典訓詁：${esc(res.definition)}</small>` : ''}
                    </div>
                </section>

                <!-- 2. 梅花字卦與 81 數理 -->
                <section class="suite-section-card">
                    <div class="suite-section-title-wrap">
                        <i data-lucide="sparkles" style="width: 16px; height: 16px; color: var(--suite-primary);"></i>
                        <h3>梅花易數成卦與 81 數理</h3>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 10px;">
                        <div class="suite-kv-card" style="text-align: left; padding: 12px 14px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                                <strong style="color: #7e22ce;">梅花字卦：【${esc(hex.name || '成卦')}】</strong>
                                <span class="suite-tag" style="background: #a855f7; color: #fff;">${esc(hex.grade || '吉')}</span>
                            </div>
                            <div style="font-size: var(--type-caption); color: var(--suite-text-muted); line-height: 1.5;">${esc(hex.judgment || hex.relation || '卦象清純，動靜皆宜。')}</div>
                        </div>
                        <div class="suite-kv-card" style="text-align: left; padding: 12px 14px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                                <strong style="color: #92400e;">81數理：第 ${esc(n81.number || res.stroke)} 數</strong>
                                <span class="suite-tag" style="background: #f59e0b; color: #fff;">${esc(n81.classification || '吉')}</span>
                            </div>
                            <div style="font-size: var(--type-caption); color: var(--suite-text-muted); line-height: 1.5;">${esc(n81.meaning || '象數相成，得時得運。')}</div>
                        </div>
                    </div>
                </section>

                <!-- 3. 八字喜忌互補 (若有生辰) -->
                ${bazi.evaluation || bazi.analysis || bazi.summary ? `
                    <section class="suite-section-card">
                        <div class="suite-section-title-wrap">
                            <i data-lucide="scale" style="width: 16px; height: 16px; color: var(--suite-primary);"></i>
                            <h3>八字五行喜忌對照</h3>
                        </div>
                        <div class="suite-quote-box">
                            <strong>命盤五行互補：</strong>${esc(bazi.evaluation || bazi.analysis || bazi.summary)}
                        </div>
                    </section>
                ` : ''}

                <!-- 4. 宗師斷語與行動錦囊 -->
                <section class="suite-section-card" style="background: rgba(59, 130, 246, 0.04);">
                    <div class="suite-section-title-wrap">
                        <i data-lucide="compass" style="width: 16px; height: 16px; color: var(--suite-primary);"></i>
                        <h3>宗師斷語與行動指引</h3>
                    </div>
                    <div style="font-size: var(--type-reading); font-weight: 700; color: var(--suite-primary); margin-bottom: 6px;">
                        綜合判定：【${esc(res.judgment || '大吉')}】
                    </div>
                    ${adviceStr ? `
                        <div style="font-size: var(--type-reading); line-height: var(--leading-reading); color: var(--suite-text);">
                            ${esc(adviceStr)}
                        </div>
                    ` : ''}
                </section>

                <div class="suite-followup-actions-bar" style="padding: 14px 20px; background: var(--suite-bg);">
                    <button type="button" class="btn suite-btn-primary js-open-result-email">
                        <i data-lucide="mail"></i> 寄送完整報告至信箱 ➔
                    </button>
                </div>
            </article>
        `;

        resultCard.style.display = 'block';
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
        }
        resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // 追問處理
    askFollowupBtn?.addEventListener('click', async () => {
        const q = (followUpInput?.value || '').trim();
        if (!q) return;
        if (!currentCeziData) return;

        askFollowupBtn.disabled = true;
        askFollowupBtn.textContent = '分析中…';

        try {
            const resp = await fetch('/api/name-analysis-question', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mode: 'cezi',
                    character: currentCeziData.char,
                    question: q,
                    birthDate: currentCeziData.baziComplement ? birthDateInput?.value : undefined,
                    conversationHistory: window.conversationHistory || []
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
                    <div style="font-weight:700; color:var(--suite-primary); margin-bottom:6px;">問：${esc(q)}</div>
                    <div class="markdown-body" style="font-size: var(--type-reading); line-height: var(--leading-reading);">${answerHtml}</div>
                `;
                followUpHistory.appendChild(turnDiv);
                followUpInput.value = '';

                window.conversationHistory.push({ role: 'user', content: q });
                window.conversationHistory.push({ role: 'assistant', content: data.analysis });
            } else {
                alert('追問未能完成：' + (data.error || '請稍後再試'));
            }
        } catch (e) {
            alert('追問出錯：' + e.message);
        } finally {
            askFollowupBtn.disabled = false;
            askFollowupBtn.innerHTML = '<i data-lucide="send"></i> 送出追問 ➔';
            if (window.lucide && typeof window.lucide.createIcons === 'function') {
                window.lucide.createIcons();
            }
        }
    });
})();
