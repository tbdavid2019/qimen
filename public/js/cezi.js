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
            errorEl.textContent = `⚠️ 測字推演失敗：${err.message}`;
            errorEl.style.display = 'block';
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
            <article class="name-result-card cezi-card" style="border: 1.5px solid var(--suite-border); border-radius: 14px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06);">
                <header class="name-result-hero" style="background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); border-bottom: 1.5px solid #f59e0b; padding: 20px 22px;">
                    <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:16px;">
                        <div style="display:flex; align-items:center; gap:16px;">
                            <div class="cezi-glyph-box" style="width:72px; height:72px; border-radius:14px; background:#fff; border:2.5px solid #f59e0b; display:flex; align-items:center; justify-content:center; font-size:42px; font-weight:800; color:#b45309; box-shadow:0 4px 14px rgba(245,158,11,0.2);">
                                ${esc(res.char)}
                            </div>
                            <div>
                                <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                                    <span class="suite-tag" style="background:#b45309; color:#fff; font-weight:800; font-size:12.5px;">✍️ 測字占斷</span>
                                    <h2 style="margin:0; font-size:22px; font-weight:800; color:#78350f;">測「${esc(res.char)}」字 · 象數理直斷</h2>
                                </div>
                                <p style="margin:0; font-size:14px; color:#92400e; font-weight:600;">求問事項：【${esc(res.question || questionInput.value)}】</p>
                            </div>
                        </div>
                        <span class="suite-tag ${judgmentBadgeClass}" style="font-size:16px; font-weight:800; padding:6px 16px;">
                            ${esc(res.judgment || '大吉')}
                        </span>
                    </div>
                </header>

                <!-- 1. 漢字造字與五行 -->
                <section class="name-result-section" style="padding: 18px 22px;">
                    <div class="name-section-title" style="margin-bottom:12px;">
                        <span>01</span><h3>字形構造與易理五行</h3><small>康熙字典考據</small>
                    </div>
                    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(130px, 1fr)); gap:12px; margin-bottom:12px;">
                        <div style="background:var(--suite-bg-card, rgba(255,255,255,0.03)); border:1px solid var(--suite-border); border-radius:8px; padding:10px; text-align:center;">
                            <div style="font-size:12px; color:var(--suite-text-muted);">康熙筆畫</div>
                            <div style="font-size:18px; font-weight:800; color:var(--suite-primary);">${esc(res.stroke)} 畫</div>
                        </div>
                        <div style="background:var(--suite-bg-card, rgba(255,255,255,0.03)); border:1px solid var(--suite-border); border-radius:8px; padding:10px; text-align:center;">
                            <div style="font-size:12px; color:var(--suite-text-muted);">字音讀音</div>
                            <div style="font-size:16px; font-weight:700;">${esc(res.pinyin || '—')}</div>
                        </div>
                        <div style="background:var(--suite-bg-card, rgba(255,255,255,0.03)); border:1px solid var(--suite-border); border-radius:8px; padding:10px; text-align:center;">
                            <div style="font-size:12px; color:var(--suite-text-muted);">五行歸屬</div>
                            <div style="font-size:18px; font-weight:800; color:#059669;">${esc(res.element)}行</div>
                        </div>
                        <div style="background:var(--suite-bg-card, rgba(255,255,255,0.03)); border:1px solid var(--suite-border); border-radius:8px; padding:10px; text-align:center;">
                            <div style="font-size:12px; color:var(--suite-text-muted);">字形結構</div>
                            <div style="font-size:16px; font-weight:700;">${esc(res.structure || '獨體')}</div>
                        </div>
                    </div>
                    <div style="font-size:13.5px; color:var(--suite-text); background:rgba(0,0,0,0.02); padding:10px 14px; border-radius:6px; line-height:1.6;">
                        <strong>🏛️ 拆字機鋒：</strong>${esc(res.structureMeaning || res.glyphDeconstruction || '字理聚氣，順勢而為')}
                        ${res.definition ? `<br><small style="color:var(--suite-text-muted);">📖 字典訓詁：${esc(res.definition)}</small>` : ''}
                    </div>
                </section>

                <!-- 2. 梅花字卦與 81 數理 -->
                <section class="name-result-section" style="padding: 18px 22px; border-top:1px solid var(--suite-border);">
                    <div class="name-section-title" style="margin-bottom:12px;">
                        <span>02</span><h3>梅花易數成卦 ✕ 81數理</h3><small>象數合參</small>
                    </div>
                    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:12px; margin-bottom:12px;">
                        <div style="background:linear-gradient(135deg, #fdf4ff 0%, #fae8ff 100%); border:1px solid #d8b4fe; border-radius:10px; padding:14px;">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                                <strong style="color:#7e22ce; font-size:15px;">🌸 梅花字卦：【${esc(hex.name || '成卦')}】</strong>
                                <span class="suite-tag" style="background:#a855f7; color:#fff; font-weight:700;">${esc(hex.grade || '吉')}</span>
                            </div>
                            <div style="font-size:13px; color:#581c87; line-height:1.5;">${esc(hex.judgment || hex.relation || '卦象清純，動靜皆宜。')}</div>
                        </div>
                        <div style="background:linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); border:1px solid #fde68a; border-radius:10px; padding:14px;">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                                <strong style="color:#92400e; font-size:15px;">🔢 81數理：第 ${esc(n81.number || res.stroke)} 數</strong>
                                <span class="suite-tag" style="background:#f59e0b; color:#fff; font-weight:700;">${esc(n81.classification || '吉')}</span>
                            </div>
                            <div style="font-size:13px; color:#78350f; line-height:1.5;">${esc(n81.meaning || '象數相成，得時得運。')}</div>
                        </div>
                    </div>
                </section>

                <!-- 3. 八字喜忌互補 (若有生辰) -->
                ${bazi.evaluation || bazi.analysis || bazi.summary ? `
                    <section class="name-result-section" style="padding: 18px 22px; border-top:1px solid var(--suite-border);">
                        <div class="name-section-title" style="margin-bottom:8px;">
                            <span>03</span><h3>八字五行喜忌對照</h3>
                        </div>
                        <div style="background:rgba(16,185,129,0.08); border-left:4px solid #10b981; padding:12px 14px; border-radius:6px; font-size:13.5px; line-height:1.6;">
                            <strong>🌱 命盤五行互補：</strong>${esc(bazi.evaluation || bazi.analysis || bazi.summary)}
                        </div>
                    </section>
                ` : ''}

                <!-- 4. 宗師斷語與行動錦囊 -->
                <section class="name-result-section" style="padding: 20px 22px; background:linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-top:1.5px solid #3b82f6;">
                    <div style="margin-bottom:10px;">
                        <strong style="font-size:15px; color:#1e40af;">🎯 測字宗師直斷 (Judgment)：</strong>
                        <div style="font-size:15px; font-weight:700; color:#1e3a8a; line-height:1.6; margin-top:4px;">
                            ${esc(res.judgment ? `綜合斷語：【${res.judgment}】` : '氣機通達，謀定後動')}
                        </div>
                    </div>
                    ${adviceStr ? `
                        <div style="margin-top:10px; padding-top:10px; border-top:1px dashed #93c5fd;">
                            <strong style="font-size:14px; color:#1e40af;">💡 行動錦囊指引 (Action Advice)：</strong>
                            <div style="font-size:14px; color:#1e3a8a; line-height:1.6; margin-top:4px;">
                                ${esc(adviceStr)}
                            </div>
                        </div>
                    ` : ''}
                </section>
                <div class="suite-followup-actions-bar" style="padding: 14px 22px; background: var(--suite-bg-card, rgba(255,255,255,0.02));">
                    <button type="button" class="suite-btn-email-inline js-open-result-email">
                        ✉️ 將完整測字占事報告寄到我的信箱 ➔
                    </button>
                </div>
            </article>
        `;

        resultCard.style.display = 'block';
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
                    <div class="markdown-body" style="font-size:14px; line-height:1.6;">${answerHtml}</div>
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
