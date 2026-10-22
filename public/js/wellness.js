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

        errorEl.style.display = 'none';
        resultContainer.style.display = 'none';
        followUpSection.style.display = 'none';
        loadingEl.style.display = 'block';
        submitBtn.disabled = true;

        try {
            const resp = await fetch('/api/bazi2/yunqi-wellness', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetYear, currentHour, date: birthDate })
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
            }
        } catch (err) {
            errorEl.textContent = `⚠️ 推演失敗：${err.message}`;
            errorEl.style.display = 'block';
        } finally {
            loadingEl.style.display = 'none';
            submitBtn.disabled = false;
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
                <section class="name-result-section" style="padding: 18px 22px; border-top: 1px solid var(--suite-border); background: rgba(59, 130, 246, 0.03);">
                    <div class="name-section-title" style="margin-bottom: 12px;">
                        <span>02</span><h3>先天本命體質稟賦（先天五運六氣）</h3><small>出生命盤氣質底色</small>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; margin-bottom: 12px;">
                        <div style="background: var(--suite-bg-card, rgba(255,255,255,0.03)); border: 1px solid var(--suite-border); border-radius: 8px; padding: 12px;">
                            <div style="font-size: 12px; color: var(--suite-text-muted);">出生年干支</div>
                            <div style="font-size: 16px; font-weight: 800; color: var(--suite-primary);">${esc(birth.birthYear)}（${esc(birth.birthGanZhi || '')}年）</div>
                        </div>
                        <div style="background: var(--suite-bg-card, rgba(255,255,255,0.03)); border: 1px solid var(--suite-border); border-radius: 8px; padding: 12px;">
                            <div style="font-size: 12px; color: var(--suite-text-muted);">先天歲運稟賦</div>
                            <div style="font-size: 16px; font-weight: 800; color: #b45309;">${esc(birth.birthMovement?.nature || '')}（${esc(birth.birthMovement?.tone || '')}）</div>
                        </div>
                        <div style="background: var(--suite-bg-card, rgba(255,255,255,0.03)); border: 1px solid var(--suite-border); border-radius: 8px; padding: 12px;">
                            <div style="font-size: 12px; color: var(--suite-text-muted);">先天司天 · 在泉</div>
                            <div style="font-size: 15px; font-weight: 700;">${esc(birth.birthSixQi?.siTian || '')} ｜ ${esc(birth.birthSixQi?.zaiQuan || '')}</div>
                        </div>
                    </div>
                    ${birth.constitutionalAnalysis ? `
                        <div style="background: rgba(16, 185, 129, 0.08); border-left: 4px solid #10b981; padding: 12px 14px; border-radius: 6px; font-size: 13.5px; line-height: 1.6;">
                            <strong>🧬 體質調養指引：</strong>${esc(birth.constitutionalAnalysis)}
                        </div>
                    ` : ''}
                </section>
            `;
        }

        const clockCardsHtml = allShichen.map((item) => {
            const isActive = item.isCurrent;
            const cardClass = isActive ? 'meridian-shichen-card active' : 'meridian-shichen-card';
            return `
                <div class="${cardClass}" data-shichen="${esc(item.shichen)}" style="cursor: pointer;">
                    <div class="meridian-card-time">
                        ${esc(item.timeRange || '')}
                        ${isActive ? '<span class="suite-tag suite-tag-gold" style="float: right; font-size: 10px; padding: 2px 6px;">當令</span>' : ''}
                    </div>
                    <div class="meridian-card-name">${esc(item.shichen)} · ${esc(item.meridian)}</div>
                    <div class="meridian-card-action">${esc(item.action)}</div>
                    ${item.acupoint ? `<div style="font-size: 11.5px; color: var(--suite-text-muted); margin-top: 4px;">📍 重點穴位：<strong>${esc(item.acupoint)}</strong></div>` : ''}
                </div>
            `;
        }).join('');

        resultContainer.innerHTML = `
            <article class="name-result-card wellness-card" style="border: 1.5px solid var(--suite-border); border-radius: 14px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06);">
                <header class="name-result-hero" style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-bottom: 1.5px solid #10b981; padding: 20px 22px;">
                    <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;">
                        <div style="display: flex; align-items: center; gap: 14px;">
                            <div style="width: 58px; height: 58px; border-radius: 14px; background: #fff; border: 2px solid #10b981; display: flex; align-items: center; justify-content: center; font-size: 30px; box-shadow: 0 4px 12px rgba(16,185,129,0.2);">
                                🌿
                            </div>
                            <div>
                                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                                    <span class="suite-tag" style="background: #047857; color: #fff; font-weight: 800; font-size: 12.5px;">黃帝內經</span>
                                    <h2 style="margin: 0; font-size: 22px; font-weight: 800; color: #064e3b;">${esc(data.year)}（${esc(data.yearGanZhi)}年）五運六氣養生報告</h2>
                                </div>
                                <p style="margin: 0; font-size: 13.5px; color: #065f46; font-weight: 600;">
                                    歲運：【${esc(data.suiYun)}】 ｜ 司天：【${esc(data.siTian)}】 ｜ 在泉：【${esc(data.zaiQuan)}】
                                </p>
                            </div>
                        </div>
                        <span class="suite-tag" style="background: #059669; color: #fff; font-size: 15px; font-weight: 800; padding: 6px 14px;">
                            當令節氣：${esc(solar.currentTerm || data.solarTerm || '立春')}
                        </span>
                    </div>
                </header>

                <!-- 1. 流年客氣天時氣候 -->
                <section class="name-result-section" style="padding: 18px 22px;">
                    <div class="name-section-title" style="margin-bottom: 12px;">
                        <span>01</span><h3>流年歲運與客氣氣候節奏</h3><small>天地之氣盛衰</small>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 12px; margin-bottom: 12px;">
                        <div style="background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); border: 1px solid #fde68a; border-radius: 10px; padding: 14px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                                <strong style="color: #92400e; font-size: 15px;">🌟 歲運（中運）：${esc(annual.greatMovement?.nature || data.suiYun)}</strong>
                                <span class="suite-tag" style="background: #f59e0b; color: #fff; font-weight: 700;">${esc(annual.greatMovement?.tone || '五音')}</span>
                            </div>
                            <div style="font-size: 13px; color: #78350f; line-height: 1.55;">
                                ${esc(annual.greatMovement?.impact || '氣運流轉，順應中和。')}
                            </div>
                        </div>
                        <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border: 1px solid #bfdbfe; border-radius: 10px; padding: 14px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                                <strong style="color: #1e40af; font-size: 15px;">🌀 司天在泉（六氣主客）</strong>
                                <span class="suite-tag" style="background: #3b82f6; color: #fff; font-weight: 700;">天地升降</span>
                            </div>
                            <div style="font-size: 13px; color: #1e3a8a; line-height: 1.55;">
                                上半年司天：<strong>${esc(data.siTian)}</strong>；下半年在泉：<strong>${esc(data.zaiQuan)}</strong>。<br>
                                ${esc(annual.sixQi?.impact || '六氣相循，注意寒溫調和。')}
                            </div>
                        </div>
                    </div>
                </section>

                <!-- 2. 本命體質 (選填) -->
                ${birthHtml}

                <!-- 3. 二十四節氣食養起居 -->
                <section class="name-result-section" style="padding: 18px 22px; border-top: 1px solid var(--suite-border);">
                    <div class="name-section-title" style="margin-bottom: 12px;">
                        <span>03</span><h3>【${esc(solar.currentTerm || data.solarTerm)}】當令節氣食養起居</h3><small>順應二十四節氣</small>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px;">
                        <div style="background: var(--suite-bg-card, rgba(255,255,255,0.03)); border: 1px solid var(--suite-border); border-radius: 10px; padding: 14px;">
                            <div style="font-weight: 700; color: #059669; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
                                <span>🥗 飲食調和宜忌</span>
                            </div>
                            <div style="font-size: 13.5px; line-height: 1.55; color: var(--suite-text);">${esc(solar.dietAdvice || advice.diet || '清淡溫熱，少食辛辣')}</div>
                        </div>
                        <div style="background: var(--suite-bg-card, rgba(255,255,255,0.03)); border: 1px solid var(--suite-border); border-radius: 10px; padding: 14px;">
                            <div style="font-weight: 700; color: #2563eb; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
                                <span>🌅 起居作息指引</span>
                            </div>
                            <div style="font-size: 13.5px; line-height: 1.55; color: var(--suite-text);">${esc(solar.lifestyleAdvice || advice.lifestyle || '早睡早起，順應日照')}</div>
                        </div>
                    </div>
                </section>

                <!-- 4. 十二時辰子午流注經絡鐘 -->
                <section class="name-result-section" style="padding: 18px 22px; border-top: 1px solid var(--suite-border);">
                    <div class="name-section-title" style="margin-bottom: 8px;">
                        <span>04</span><h3>十二時辰子午流注經絡鐘</h3><small>氣血循行當令穴位</small>
                    </div>
                    <div style="font-size: 13px; color: var(--suite-text-muted); margin-bottom: 10px;">
                        人體氣血依十二時辰巡行於十二經脈。當前查詢時辰為【<strong>${esc(activeShichen.shichen || clock.shichen)} · ${esc(activeShichen.meridian || clock.meridian)}</strong>】。點擊各時辰卡片可查看當令穴位指引：
                    </div>
                    <div class="meridian-clock-grid">
                        ${clockCardsHtml}
                    </div>
                </section>

                <!-- 5. 總結指引與郵件寄送 -->
                <section class="name-result-section" style="padding: 20px 22px; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-top: 1.5px solid #10b981;">
                    <div style="margin-bottom: 8px;">
                        <strong style="font-size: 15px; color: #065f46;">🎯 黃帝內經養生心法錦囊：</strong>
                        <div style="font-size: 14.5px; color: #064e3b; line-height: 1.65; margin-top: 4px;">
                            ${esc(data.summary)}
                        </div>
                    </div>
                    ${Array.isArray(advice.acupuncturePoints) && advice.acupuncturePoints.length ? `
                        <div style="margin-top: 10px; font-size: 13.5px; color: #047857;">
                            📍 推薦保養穴位：<strong>${esc(advice.acupuncturePoints.join('、'))}</strong>
                        </div>
                    ` : ''}
                </section>
                <div class="suite-followup-actions-bar" style="padding: 14px 22px; background: var(--suite-bg-card, rgba(255,255,255,0.02));">
                    <button type="button" class="suite-btn-email-inline js-open-result-email">
                        ✉️ 將完整五運六氣與子午流注養生報告寄到我的信箱 ➔
                    </button>
                </div>
            </article>
        `;

        resultContainer.style.display = 'block';
        resultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // 追問處理
    askFollowupBtn?.addEventListener('click', async () => {
        const q = (followUpInput?.value || '').trim();
        if (!q) return;
        if (!currentWellnessData) return;

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
                    <div style="font-weight: 700; color: var(--suite-primary); margin-bottom: 6px;">問：${esc(q)}</div>
                    <div class="markdown-body" style="font-size: 14px; line-height: 1.6;">${answerHtml}</div>
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
            if (window.lucide && typeof window.lucide.createIcons === 'function') {
                window.lucide.createIcons();
            }
        }
    });
})();
