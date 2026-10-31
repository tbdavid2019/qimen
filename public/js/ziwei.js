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
        const item = (title, data) => `<article class="ziwei-match-item"><strong>${escapeHtml(title)}</strong><span class="ziwei-match-score">${escapeHtml(data?.score ?? 0)} / 100</span><p>${escapeHtml(data?.desc || '')}</p></article>`;
        return `<section class="ziwei-match-report"><div class="ziwei-match-score-hero"><span>合盤契合指數</span><strong>${escapeHtml(report.score)}<small>/100</small></strong><p>${escapeHtml(report.summary)}</p></div><div class="ziwei-match-grid">${item('命宮主星相合度', report.synastryAnalysis?.mingCompatibility)}${item('夫妻宮投射契合', report.synastryAnalysis?.fuqiProjection)}${item('四化互照', report.synastryAnalysis?.sihuaInteraction)}${item('煞星對衝', report.synastryAnalysis?.shaClash)}</div><div class="ziwei-match-advice"><strong>理性相處指南</strong><p>${escapeHtml(report.advice)}</p></div></section>`;
    }

    window.ZiweiUI = { renderPatterns, renderShensha, renderMatchReport };

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
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setupMatchForm); else setupMatchForm();
})(window, document);
