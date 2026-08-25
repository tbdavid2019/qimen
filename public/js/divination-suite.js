(() => {
    'use strict';

    const page = document.body.dataset.suite;
    const form = document.getElementById('suiteForm');
    const visualBoard = document.getElementById('suiteVisualBoard');
    const aiSection = document.getElementById('suiteAiSection');
    const aiLoading = document.getElementById('suiteAiLoading');
    const conversationStream = document.getElementById('suiteConversation');
    const followUpForm = document.getElementById('suiteFollowUpForm');
    const followUpInput = document.getElementById('suiteFollowUpInput');
    const submitBtn = document.getElementById('suiteSubmitBtn');

    let lastResult = null;
    let conversationHistory = [];

    const escapeHtml = (str) => String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    const renderMarkdown = (text) => {
        if (window.MarkdownRenderer && typeof window.MarkdownRenderer.render === 'function') {
            return window.MarkdownRenderer.render(text);
        }
        return `<p>${escapeHtml(text).replace(/\n/g, '<br>')}</p>`;
    };

    const elementClass = (element) => {
        const map = { 木: 'element-wood', 火: 'element-fire', 土: 'element-earth', 金: 'element-metal', 水: 'element-water' };
        return map[element] || '';
    };

    // --- Visual Board Renderers ---

    function renderTarot(reading) {
        if (!reading || !reading.cards) return;
        const cardsHtml = reading.cards.map((card) => {
            const isUpright = card.orientation === '正位';
            return `
                <div class="tarot-card-item">
                    <span class="tarot-pos-badge">${escapeHtml(card.position)}</span>
                    <div class="tarot-card-name">${escapeHtml(card.name)}</div>
                    <span class="tarot-orientation ${isUpright ? 'upright' : 'reversed'}">${escapeHtml(card.orientation)}</span>
                    ${card.isMajor ? '<div class="tarot-major-tag">★ 大阿爾克那</div>' : ''}
                </div>
            `;
        }).join('');

        visualBoard.innerHTML = `
            <div class="suite-board-title">🔮 牌陣開牌結果（${escapeHtml(reading.spreadName || reading.spread)}）</div>
            <div class="tarot-cards-grid">${cardsHtml}</div>
        `;
        visualBoard.hidden = false;
    }

    function renderBazi(chart) {
        if (!chart || !chart.fourPillars) return;
        const pillars = chart.fourPillars;
        const tableHtml = `
            <table class="bazi-pillars-table">
                <thead>
                    <tr>${pillars.map((p) => `<th class="bazi-pillar-head">${escapeHtml(p.label)}</th>`).join('')}</tr>
                </thead>
                <tbody>
                    <tr>${pillars.map((p) => `<td class="bazi-god-cell">${escapeHtml(p.tenGod || '日主')}</td>`).join('')}</tr>
                    <tr>${pillars.map((p) => `<td><span class="bazi-char-cell ${elementClass(p.element)}">${escapeHtml(p.stem)}</span><br><span class="bazi-element-pill">${escapeHtml(p.element)}</span></td>`).join('')}</tr>
                    <tr>${pillars.map((p) => `<td><span class="bazi-char-cell ${elementClass(p.branch ? chart.profile?.branchElement || '' : '')}">${escapeHtml(p.branch)}</span></td>`).join('')}</tr>
                    <tr>${pillars.map((p) => `<td class="bazi-hidden-cell">${(p.hiddenStems || []).map((h) => `${escapeHtml(h.stem)} <small>(${escapeHtml(h.tenGod)})</small>`).join('<br>')}</td>`).join('')}</tr>
                </tbody>
            </table>
        `;

        const counts = chart.fiveElements?.counts || {};
        const elementsHtml = `
            <div class="five-elements-meter">
                <div style="font-size:12px; font-weight:700; margin-bottom:8px; color:var(--suite-text-muted);">
                    五行分佈（日主：<strong class="${elementClass(chart.dayMaster?.element)}">${escapeHtml(chart.dayMaster?.stem)}[${escapeHtml(chart.dayMaster?.element)}]</strong>）
                </div>
                <div class="five-elements-grid">
                    <div class="element-item element-wood">木 <span class="element-count-badge">${counts.木 || 0}</span></div>
                    <div class="element-item element-fire">火 <span class="element-count-badge">${counts.火 || 0}</span></div>
                    <div class="element-item element-earth">土 <span class="element-count-badge">${counts.土 || 0}</span></div>
                    <div class="element-item element-metal">金 <span class="element-count-badge">${counts.金 || 0}</span></div>
                    <div class="element-item element-water">水 <span class="element-count-badge">${counts.水 || 0}</span></div>
                </div>
            </div>
        `;

        const luckCyclesHtml = (chart.luckCycles || []).length > 0 ? `
            <div style="font-size:12px; font-weight:700; margin-bottom:6px; color:var(--suite-text-muted);">大運排盤</div>
            <div class="luck-cycles-scroller">
                ${chart.luckCycles.map((c) => `
                    <div class="luck-cycle-card">
                        <div class="luck-cycle-ganzhi">${escapeHtml(c.ganzhi)}</div>
                        <div class="luck-cycle-age">${escapeHtml(c.startAge)}~${escapeHtml(c.endAge)}歲</div>
                    </div>
                `).join('')}
            </div>
        ` : '';

        visualBoard.innerHTML = `
            <div class="suite-board-title">📜 四柱八字命盤</div>
            ${tableHtml}
            ${elementsHtml}
            ${luckCyclesHtml}
        `;
        visualBoard.hidden = false;
    }

    function renderFengShui(report) {
        if (!report || !report.eightMansions) return;
        const dir = report.eightMansions.directions || {};
        const house = report.eightMansions.house || '';
        const annual = report.flyingStars?.annual || {};

        // Traditional 3x3 layout: SE, S, SW / E, Center, W / NE, N, NW
        const layout = [
            { key: '東南', name: '東南 (巽)' }, { key: '南', name: '南 (離)' }, { key: '西南', name: '西南 (坤)' },
            { key: '東', name: '東 (震)' },     { key: '中', name: '中宮' },     { key: '西', name: '西 (兌)' },
            { key: '東北', name: '東北 (艮)' }, { key: '北', name: '北 (坎)' }, { key: '西北', name: '西北 (乾)' }
        ];

        const auspiciousStars = new Set(['生氣', '天醫', '延年', '伏位']);

        const gridHtml = layout.map((item) => {
            if (item.key === '中') {
                return `
                    <div class="fengshui-cell center-palace">
                        <div class="fengshui-dir-title">${item.name}</div>
                        <div style="font-size:12px; font-weight:700; margin:6px 0; color:var(--suite-primary);">${escapeHtml(house)}</div>
                        <div class="fengshui-flying-star">九運 · 流年星 ${annual['中'] || 9}</div>
                    </div>
                `;
            }
            const star = dir[item.key] || '';
            const isAuspicious = auspiciousStars.has(star);
            const starBadgeClass = isAuspicious ? 'auspicious' : 'inauspicious';
            const starLabel = isAuspicious ? `${star} (吉)` : `${star} (凶)`;

            return `
                <div class="fengshui-cell">
                    <div class="fengshui-dir-title">${item.name}</div>
                    <span class="fengshui-star-badge ${starBadgeClass}">${escapeHtml(starLabel)}</span>
                    <div class="fengshui-flying-star">流年飛星: ${annual[item.key] || '一'}</div>
                </div>
            `;
        }).join('');

        const mingGuaName = report.resident?.mingGua?.name || '';
        visualBoard.innerHTML = `
            <div class="suite-board-title">🏡 八宅九星與流年飛星盤（${escapeHtml(house)} · 坐向：${escapeHtml(report.facing || '')}）</div>
            <div style="font-size:13px; margin-bottom:12px; color:var(--suite-text-muted);">
                居住者命卦：<strong>${escapeHtml(mingGuaName)}卦</strong> | 建造/入住：<strong>九運</strong>
            </div>
            <div class="fengshui-grid">${gridHtml}</div>
        `;
        visualBoard.hidden = false;
    }

    function renderYinyuan(result, mode) {
        if (!result) return;
        let contentHtml = '';

        if (result.title && result.poem) {
            // Fortune Stick
            contentHtml = `
                <div class="fortune-scroll">
                    <span class="fortune-scroll-badge">🏮 月老靈籤 第 ${escapeHtml(result.number || 1)} 籤 · ${escapeHtml(result.title)}</span>
                    <div class="fortune-scroll-poem">「${escapeHtml(result.poem)}」</div>
                </div>
            `;
        } else if (result.relationship) {
            // Zodiac match
            contentHtml = `
                <div class="zodiac-match-box">
                    <div class="zodiac-pair-display">${escapeHtml(result.first?.zodiac || '')} ✕ ${escapeHtml(result.second?.zodiac || '')}</div>
                    <div style="font-size:15px; font-weight:700; color:var(--suite-primary);">${escapeHtml(result.relationship)}</div>
                    <div class="zodiac-score-bar">
                        <div class="zodiac-score-fill" style="width:${Math.min(result.score || 70, 100)}%;"></div>
                    </div>
                    <div style="font-size:13px; color:var(--suite-text-muted);">緣分契合度指數：<strong>${escapeHtml(result.score || 70)} 分</strong></div>
                </div>
            `;
        } else if (result.favorableDirection) {
            // Peach Blossom
            contentHtml = `
                <div class="zodiac-match-box">
                    <div style="font-size:18px; font-weight:700; margin-bottom:8px;">🌸 ${escapeHtml(result.zodiac || '')}年桃花與人際指南</div>
                    <div style="font-size:15px; color:var(--suite-primary); margin-bottom:8px;">吉利桃花方位：<strong>${escapeHtml(result.favorableDirection)}</strong></div>
                    <p style="font-size:13px; color:var(--suite-text-muted); margin:0;">${escapeHtml(result.summary || '')}</p>
                </div>
            `;
        } else if (result.summary) {
            contentHtml = `
                <div class="zodiac-match-box">
                    <div style="font-size:16px; font-weight:700; margin-bottom:8px; color:var(--suite-primary);">💍 命盤姻緣特質解析</div>
                    <p style="font-size:14px; margin:0;">${escapeHtml(result.summary)}</p>
                </div>
            `;
        }

        visualBoard.innerHTML = `
            <div class="suite-board-title">🏮 月老測算結果</div>
            ${contentHtml}
        `;
        visualBoard.hidden = false;
    }

    function renderVisual(data, payload) {
        if (page === 'tarot') renderTarot(data);
        else if (page === 'bazi2') renderBazi(data);
        else if (page === 'fengshui') renderFengShui(data);
        else if (page === 'yinyuan') renderYinyuan(data, payload?.mode);
    }

    // --- Message Stream Helper ---

    function appendMessage(role, content) {
        const bubble = document.createElement('div');
        bubble.className = `suite-message-bubble ${role}`;
        if (role === 'assistant') {
            bubble.innerHTML = renderMarkdown(content);
        } else {
            bubble.textContent = content;
        }
        conversationStream.appendChild(bubble);
        conversationStream.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // --- Form Payload Builder ---

    const val = (name) => form.elements[name]?.value?.trim() || '';

    function buildPayload() {
        const question = val('question');
        if (page === 'tarot') {
            return { spread: val('spread') || 'three', question };
        }
        if (page === 'bazi2') {
            return {
                name: val('name'),
                formerName: val('formerName'),
                calendar: val('calendar') || 'solar',
                date: val('date'),
                time: val('time') || '12:00',
                sex: val('sex') || '男',
                place: val('place'),
                question
            };
        }
        if (page === 'fengshui') {
            return {
                facing: val('facing') || '南',
                moveInYear: Number(val('moveInYear')) || 2024,
                residentYear: Number(val('residentYear')) || 1990,
                sex: val('sex') || '女',
                year: Number(val('year')) || new Date().getFullYear(),
                question
            };
        }
        if (page === 'yinyuan') {
            return {
                mode: val('mode') || 'fortune',
                firstYear: Number(val('firstYear')) || 1990,
                secondYear: Number(val('secondYear')) || 1991,
                status: val('status') || '單身',
                question
            };
        }
        return { question };
    }

    // --- One-Click Main Flow ---

    const endpointMap = {
        tarot: '/api/tarot/reading',
        fengshui: '/api/fengshui/report',
        bazi2: '/api/bazi2/chart',
        yinyuan: '/api/yinyuan/reading'
    };

    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = buildPayload();

        // Basic date validation for bazi2
        if (page === 'bazi2' && !payload.date) {
            alert('請選擇出生日期');
            return;
        }

        if (submitBtn) submitBtn.disabled = true;
        aiSection.hidden = false;
        aiLoading.hidden = false;
        conversationStream.innerHTML = '';
        conversationHistory = [];

        try {
            // Step 1: Run Calculation
            const calcRes = await fetch(endpointMap[page], {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const calcData = await calcRes.json();
            if (!calcData.success) throw new Error(calcData.error || '排盤計算失敗');

            lastResult = calcData.reading || calcData.report || calcData.chart || calcData.result;
            renderVisual(lastResult, payload);

            // Step 2: Auto Call AI Analysis
            const userQuestion = payload.question || '請為我進行全盤深度解讀與具體指引。';
            const aiRes = await fetch(`/api/${page}/llm-analysis`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    result: lastResult,
                    question: userQuestion,
                    conversationHistory: []
                })
            });

            const aiData = await aiRes.json();
            aiLoading.hidden = true;

            if (aiData.success && aiData.analysis) {
                conversationHistory.push({ role: 'user', content: userQuestion });
                conversationHistory.push({ role: 'assistant', content: aiData.analysis });
                appendMessage('assistant', aiData.analysis);
                if (followUpForm) followUpForm.hidden = false;
            } else {
                appendMessage('assistant', `⚠️ AI 解讀暫不可用：${aiData.error || '請稍後重試'}`);
            }
        } catch (err) {
            aiLoading.hidden = true;
            alert(`錯誤：${err.message}`);
        } finally {
            if (submitBtn) submitBtn.disabled = false;
        }
    });

    // --- Follow-up Questions Flow ---

    followUpForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const question = followUpInput.value.trim();
        if (!question || !lastResult) return;

        followUpInput.value = '';
        appendMessage('user', question);

        const typingBubble = document.createElement('div');
        typingBubble.className = 'suite-message-bubble assistant';
        typingBubble.innerHTML = '<span class="suite-spinner" style="width:16px; height:16px; vertical-align:middle; margin-right:6px;"></span> 大師思考中…';
        conversationStream.appendChild(typingBubble);

        try {
            const aiRes = await fetch(`/api/${page}/llm-analysis`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    result: lastResult,
                    question,
                    conversationHistory
                })
            });
            const aiData = await aiRes.json();
            conversationStream.removeChild(typingBubble);

            if (aiData.success && aiData.analysis) {
                conversationHistory.push({ role: 'user', content: question });
                conversationHistory.push({ role: 'assistant', content: aiData.analysis });
                appendMessage('assistant', aiData.analysis);
            } else {
                appendMessage('assistant', `⚠️ 解讀失敗：${aiData.error || '無法取得回應'}`);
            }
        } catch (err) {
            if (typingBubble.parentNode) conversationStream.removeChild(typingBubble);
            appendMessage('assistant', `⚠️ 網路異常：${err.message}`);
        }
    });

    // --- Mode Switcher Helper for Yinyuan ---
    const modeSelect = form?.elements['mode'];
    if (modeSelect) {
        const updateYinyuanFields = () => {
            const mode = modeSelect.value;
            const secondYearGroup = document.getElementById('secondYearGroup');
            const statusGroup = document.getElementById('statusGroup');
            if (secondYearGroup) secondYearGroup.style.display = (mode === 'zodiac' || mode === 'bazi-match') ? 'block' : 'none';
            if (statusGroup) statusGroup.style.display = mode === 'peach-blossom' ? 'block' : 'none';
        };
        modeSelect.addEventListener('change', updateYinyuanFields);
        updateYinyuanFields();
    }
})();
