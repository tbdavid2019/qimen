/* 紫微進階 UI：格局條件、三組十二神煞與雙人合盤。 */
(function (window, document) {
    'use strict';

    function escapeHtml(value) {
        return String(value == null ? '' : value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
    }

    function levelLabel(pattern) {
        if (pattern.type === '破格警示' || pattern.level === 'caution') return '課題格';
        if (pattern.level === 'excellent') return '吉格';
        if (pattern.level === 'good') return '貴格';
        return '平格';
    }

    function renderPatterns(patterns) {
        if (!Array.isArray(patterns) || !patterns.length) return '<div class="ziwei-pattern-empty">本盤暫未觸發明確古籍格局，仍可從命宮與三方四正觀察。</div>';
        return patterns.map((pattern) => {
            const conditions = pattern.conditions || {};
            const list = (title, values, cls) => values?.length ? `<div class="ziwei-pattern-condition ${cls}"><strong>${title}</strong><span>${values.map(escapeHtml).join('、')}</span></div>` : '';
            return `<details class="ziwei-pattern-card level-${escapeHtml(pattern.level || 'neutral')}">
                <summary><span class="ziwei-pattern-badge">${escapeHtml(levelLabel(pattern))}</span><strong>${escapeHtml(pattern.name)}</strong><span class="ziwei-pattern-summary">${escapeHtml(pattern.desc || pattern.description || '')}</span></summary>
                <div class="ziwei-pattern-body">${list('成格條件', conditions.required, 'required')}${list('加分項', conditions.bonus, 'bonus')}${list('破格警示', conditions.breaking, 'breaking')}<div class="ziwei-pattern-source">古籍出處：${escapeHtml(pattern.source || '《紫微斗數全書》')}</div></div>
            </details>`;
        }).join('');
    }

    function renderShensha(shensha) {
        if (!shensha) return '';
        return `<div class="ziwei-shensha-chips" aria-label="十二神煞"><span class="ziwei-shensha-chip sui">歲前 ${escapeHtml(shensha.suiQian)}</span><span class="ziwei-shensha-chip jiang">將前 ${escapeHtml(shensha.jiangQian)}</span><span class="ziwei-shensha-chip boshi">博士 ${escapeHtml(shensha.boshi)}</span></div>`;
    }

    function renderMatchReport(report) {
        if (!report) return '';
        const item = (title, data) => `
            <article class="ziwei-match-item">
                <header class="ziwei-match-item-head">
                    <strong class="ziwei-match-item-title">${escapeHtml(title)}</strong>
                    <span class="ziwei-match-score"><span class="ziwei-match-num">${escapeHtml(data?.score ?? 0)}</span><span class="ziwei-match-denom"> / 100</span></span>
                </header>
                <p class="ziwei-match-item-desc">${escapeHtml(data?.desc || '')}</p>
            </article>`;
        return `
            <section class="ziwei-match-report">
                <div class="ziwei-match-score-hero">
                    <span class="ziwei-match-hero-label">合盤契合指數</span>
                    <strong class="ziwei-match-hero-score">${escapeHtml(report.score)}<small class="ziwei-match-hero-denom"> / 100</small></strong>
                    <p class="ziwei-match-hero-desc">${escapeHtml(report.summary)}</p>
                </div>
                <div class="ziwei-match-grid">
                    ${item('命宮主星相合度', report.synastryAnalysis?.mingCompatibility)}
                    ${item('夫妻宮投射契合', report.synastryAnalysis?.fuqiProjection)}
                    ${item('四化互照', report.synastryAnalysis?.sihuaInteraction)}
                    ${item('煞星對衝', report.synastryAnalysis?.shaClash)}
                </div>
                <div class="ziwei-match-advice">
                    <strong class="ziwei-match-advice-title">理性相處指南</strong>
                    <p class="ziwei-match-advice-desc">${escapeHtml(report.advice)}</p>
                </div>
            </section>`;
    }

    const PALACE_TO_TOPIC = {
        命宮: 'personality',
        兄弟宮: 'family',
        夫妻宮: 'love',
        子女宮: 'children',
        財帛宮: 'wealth',
        疾厄宮: 'health',
        遷移宮: 'move',
        僕役宮: 'friends',
        交友宮: 'friends',
        官祿宮: 'career',
        事業宮: 'career',
        田宅宮: 'home',
        福德宮: 'spirit',
        父母宮: 'parents'
    };

    function renderDomainCard(d) {
        if (!d) return '';
        const starsText = (d.majorStars || []).map((s) => `${escapeHtml(s.name)}${s.brightness ? `（${escapeHtml(s.brightness)}）` : ''}`).join('、') || (d.isBorrowed ? '借對宮主星' : '無主星');
        const sihuaChips = (d.sihuaList || []).map((sh) => `<span class="ziwei-sihua-badge ${sh === '祿' ? 'lu' : sh === '權' ? 'quan' : sh === '科' ? 'ke' : 'ji'}">${escapeHtml(sh)}</span>`).join('');
        const shenshaText = d.shensha ? `歲前【${escapeHtml(d.shensha.suiQian || '')}】· 將前【${escapeHtml(d.shensha.jiangQian || '')}】· 博士【${escapeHtml(d.shensha.boshi || '')}】` : '';

        return `
            <article class="ziwei-domain-card" data-domain="${escapeHtml(d.key)}">
                <header class="ziwei-domain-card-header">
                    <div class="ziwei-domain-card-title-group">
                        <span class="ziwei-domain-card-badge">${escapeHtml(d.label)}</span>
                        <h4 class="ziwei-domain-card-heading">${escapeHtml(d.palaceName)}${d.palaceBranch ? `【${escapeHtml(d.palaceBranch)}】` : ''} · ${starsText}</h4>
                    </div>
                    <div class="ziwei-domain-card-meta">
                        ${sihuaChips}
                        ${d.dayun ? `<span class="ziwei-domain-dayun">大限 ${escapeHtml(d.dayun)}</span>` : ''}
                    </div>
                </header>

                <div class="ziwei-domain-dingdiao">
                    <span class="ziwei-dingdiao-icon">🎯 一句話定調：</span>
                    <strong class="ziwei-dingdiao-text">${escapeHtml(d.dingdiao)}</strong>
                </div>

                <div class="ziwei-domain-body">
                    <div class="ziwei-domain-section">
                        <h5 class="ziwei-domain-section-title">🏛️ 星情格局深度論斷</h5>
                        <div class="ziwei-domain-prose">${escapeHtml(d.coreAnalysis).replace(/\n\n/g, '<br><br>')}</div>
                    </div>

                    <div class="ziwei-domain-section">
                        <h5 class="ziwei-domain-section-title">🧭 三方四正與行運聯動</h5>
                        <div class="ziwei-domain-prose">${escapeHtml(d.sanfangAnalysis)}</div>
                    </div>

                    <div class="ziwei-domain-section ziwei-domain-advice-box">
                        <h5 class="ziwei-domain-section-title">💡 理性實踐與行動指南</h5>
                        <div class="ziwei-domain-prose">${escapeHtml(d.practicalAdvice)}</div>
                    </div>

                    <div class="ziwei-domain-source">
                        <span>📜 正統古籍出處依據：</span>
                        <em>${escapeHtml(d.classicQuote)}</em>
                    </div>
                </div>

                <footer class="ziwei-domain-card-footer">
                    <button type="button" class="btn suite-btn-secondary btn-sm js-ask-ai-domain" data-topic="${escapeHtml(d.key)}" data-label="${escapeHtml(d.label)}">
                        🤖 請 AI 針對「${escapeHtml(d.label)}」深入解讀 ➔
                    </button>
                </footer>
            </article>
        `;
    }

    function renderDomainExplorer(chart) {
        if (!chart || !chart.domains) return '';
        const domains = chart.domains;
        const keys = Object.keys(domains);
        if (!keys.length) return '';

        window.ZiweiUI._currentChart = chart;

        const navHtml = keys.map((key, idx) => {
            const d = domains[key];
            const isActive = idx === 0;
            return `
                <button type="button" role="tab" aria-selected="${isActive ? 'true' : 'false'}" class="ziwei-domain-tab-btn ${isActive ? 'active' : ''}" data-domain-key="${escapeHtml(key)}">
                    <span class="ziwei-domain-tab-icon">${d.icon || '✦'}</span>
                    <span class="ziwei-domain-tab-text">${escapeHtml(d.label)}</span>
                </button>
            `;
        }).join('');

        const firstDomain = domains[keys[0]];
        const cardHtml = renderDomainCard(firstDomain);

        return `
            <section class="ziwei-domains-section" id="ziweiDomainsSection">
                <div class="ziwei-domains-header">
                    <div class="ziwei-domains-title">
                        <span>📜 十三專題與宮位深度全息解讀</span>
                        <span class="ziwei-inline-badge">完整正統論斷</span>
                    </div>
                    <div class="ziwei-domains-subtitle">點選下方人生主題標籤或點擊上方命盤任一宮位，即可無延遲切換該宮位主星、吉煞、生年四化與三方聯動之全套深度論斷。</div>
                </div>
                <div class="ziwei-domains-nav-scroll" role="tablist" aria-label="紫微十三大主題導覽">
                    <div class="ziwei-domains-nav-track">
                        ${navHtml}
                    </div>
                </div>
                <div class="ziwei-domain-card-container" id="ziweiDomainCardContainer">
                    ${cardHtml}
                </div>
            </section>
        `;
    }

    function switchDomain(key) {
        const chart = window.ZiweiUI._currentChart;
        if (!chart || !chart.domains || !chart.domains[key]) return;

        // 更新 tabs active 狀態
        const tabs = document.querySelectorAll('.ziwei-domain-tab-btn');
        tabs.forEach((tab) => {
            const isMatch = tab.getAttribute('data-domain-key') === key;
            tab.setAttribute('aria-selected', isMatch ? 'true' : 'false');
            if (isMatch) {
                tab.classList.add('active');
                tab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            } else {
                tab.classList.remove('active');
            }
        });

        // 重新渲染卡片
        const container = document.getElementById('ziweiDomainCardContainer');
        if (container) {
            container.innerHTML = renderDomainCard(chart.domains[key]);
        }
    }

    function setupDomainInteractions() {
        document.addEventListener('click', (event) => {
            // 點擊主題 Tab
            const tabBtn = event.target.closest('.ziwei-domain-tab-btn');
            if (tabBtn) {
                const key = tabBtn.getAttribute('data-domain-key');
                if (key) switchDomain(key);
                return;
            }

            // 點擊命盤中的宮位 Cell
            const palaceCell = event.target.closest('.ziwei-palace-cell');
            if (palaceCell) {
                const palaceName = palaceCell.getAttribute('data-palace') || palaceCell.querySelector('.ziwei-palace-name')?.textContent?.replace(/\(命\)|\(身\)/g, '').trim();
                if (palaceName && PALACE_TO_TOPIC[palaceName]) {
                    const topicKey = PALACE_TO_TOPIC[palaceName];
                    switchDomain(topicKey);

                    // 高亮點選的宮位
                    document.querySelectorAll('.ziwei-palace-cell').forEach((c) => c.classList.remove('is-selected-cell'));
                    palaceCell.classList.add('is-selected-cell');

                    const section = document.getElementById('ziweiDomainsSection');
                    if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
                return;
            }

            // 點擊中宮資訊卡
            const centerInfo = event.target.closest('.ziwei-center-info');
            if (centerInfo) {
                switchDomain('overview');
                const section = document.getElementById('ziweiDomainsSection');
                if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                return;
            }

            // 點擊「請 AI 針對此主題深入解讀」
            const askAiBtn = event.target.closest('.js-ask-ai-domain');
            if (askAiBtn) {
                const label = askAiBtn.getAttribute('data-label') || '專題';
                const input = document.getElementById('suiteFollowUpInput');
                const aiSection = document.getElementById('suiteAiSection');
                const followUpForm = document.getElementById('suiteFollowUpForm');
                if (aiSection) aiSection.hidden = false;
                if (followUpForm) {
                    followUpForm.hidden = false;
                    if (typeof window.renderSuiteFollowUpTurnstile === 'function') {
                        window.renderSuiteFollowUpTurnstile();
                    }
                }
                if (input) {
                    input.value = `請紫微大師針對我的【${label}】進行更深入透徹的命理解讀與行動指引：`;
                    input.focus();
                    input.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
                return;
            }
        });
    }

    window.ZiweiUI = { renderPatterns, renderShensha, renderMatchReport, renderDomainExplorer, renderDomainCard, switchDomain, PALACE_TO_TOPIC };

    function setupMatchForm() {
        const form = document.getElementById('ziweiMatchForm');
        const panel = document.getElementById('ziweiMatchPanel');
        const result = document.getElementById('ziweiMatchResult');
        const trigger = document.getElementById('btnModeMatch');
        if (!form || !panel) return;
        if (window.location.pathname.includes('/match')) {
            panel.hidden = false;
        }
        trigger?.addEventListener('click', () => {
            panel.hidden = !panel.hidden;
            if (!panel.hidden) {
                if (window.history && window.history.pushState) window.history.pushState(null, '', '/ziwei/match');
                panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                if (window.history && window.history.pushState) window.history.pushState(null, '', '/ziwei');
            }
        });
        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            const data = new FormData(form);
            const party = (prefix) => ({
                name: data.get(`${prefix}Name`),
                date: data.get(`${prefix}Date`),
                time: data.get(`${prefix}Time`) || '12:00',
                sex: data.get(`${prefix}Sex`),
                calendar: data.get(`${prefix}Calendar`) || 'solar'
            });
            const button = form.querySelector('button[type="submit"]');
            if (button) button.disabled = true;
            try {
                const response = await fetch('/api/ziwei/match', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ first: party('first'), second: party('second') }) });
                const payload = await response.json();
                if (!response.ok || !payload.success) throw new Error(payload.error || '合盤計算失敗');
                result.innerHTML = renderMatchReport(payload.match || payload);
                result.hidden = false;
            } catch (error) {
                result.innerHTML = `<div class="ziwei-match-error">${escapeHtml(error.message)}</div>`;
                result.hidden = false;
            } finally {
                if (button) button.disabled = false;
            }
        });
    }
    function init() {
        setupMatchForm();
        setupDomainInteractions();
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})(window, document);
