(() => {
    'use strict';

    const form = document.getElementById('answerbookForm');
    const modeInput = document.getElementById('answerbookMode');
    const questionGroup = document.getElementById('answerbookQuestionGroup');
    const questionInput = document.getElementById('answerbookQuestion');
    const submitButton = document.getElementById('answerbookSubmit');
    const loading = document.getElementById('answerbookLoading');
    const loadingText = document.getElementById('answerbookLoadingText');
    const errorBox = document.getElementById('answerbookError');
    const resultBox = document.getElementById('answerbookResult');
    const answerBox = document.getElementById('answerbookAnswer');
    const analysisCard = document.getElementById('answerbookAnalysisCard');
    const analysisBox = document.getElementById('answerbookAnalysis');
    const statusBox = document.getElementById('answerbookStatus');

    const renderMarkdown = (text) => {
        if (window.MarkdownRenderer && typeof window.MarkdownRenderer.render === 'function') return window.MarkdownRenderer.render(text);
        return `<p>${String(text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')}</p>`;
    };

    const turnstileWrapper = document.getElementById('answerbookTurnstileWrapper');

    let answerbookTurnstileWidgetId = null;
    let currentAnswerbookTurnstileToken = '';
    let answerbookTurnstileRenderRetries = 0;

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

    function renderAnswerbookTurnstile() {
        const container = document.getElementById('answerbook-turnstile');
        if (!container) return;
        const sitekey = container.getAttribute('data-sitekey');
        if (!sitekey) return;

        loadTurnstileScript((err) => {
            if (err) {
                console.warn('[Turnstile] Answerbook widget failed to load:', err);
                return;
            }
            if (!window.turnstile || typeof window.turnstile.render !== 'function') {
                if (answerbookTurnstileRenderRetries < 20) {
                    answerbookTurnstileRenderRetries++;
                    setTimeout(renderAnswerbookTurnstile, 250);
                }
                return;
            }
            answerbookTurnstileRenderRetries = 0;
            if (answerbookTurnstileWidgetId === null) {
                try {
                    const action = container.getAttribute('data-action') || 'llm_analysis';
                    answerbookTurnstileWidgetId = window.turnstile.render(container, {
                        sitekey: sitekey,
                        action: action,
                        theme: 'auto',
                        size: 'flexible',
                        callback: (token) => { currentAnswerbookTurnstileToken = token; },
                        'expired-callback': () => { currentAnswerbookTurnstileToken = ''; },
                        'error-callback': () => { currentAnswerbookTurnstileToken = ''; }
                    });
                    window.answerbookTurnstileWidgetId = answerbookTurnstileWidgetId;
                } catch (e) {
                    console.warn('[Turnstile] Answerbook render error:', e);
                }
            }
        });
    }

    function resetAnswerbookTurnstile() {
        currentAnswerbookTurnstileToken = '';
        if (window.turnstile && typeof window.turnstile.reset === 'function') {
            try {
                if (answerbookTurnstileWidgetId !== null) {
                    window.turnstile.reset(answerbookTurnstileWidgetId);
                } else {
                    const container = document.getElementById('answerbook-turnstile');
                    if (container) window.turnstile.reset(container);
                }
            } catch (e) {}
        }
    }

    window.resetAnswerbookTurnstile = resetAnswerbookTurnstile;
    renderAnswerbookTurnstile();

    function setMode(mode) {
        modeInput.value = mode;
        questionGroup.hidden = mode !== 'question';
        questionInput.required = mode === 'question';
        if (turnstileWrapper) {
            turnstileWrapper.hidden = mode !== 'question';
        }
        document.querySelectorAll('.answerbook-mode-btn').forEach((button) => {
            const active = button.dataset.mode === mode;
            button.classList.toggle('active', active);
            button.setAttribute('aria-selected', active ? 'true' : 'false');
        });
        submitButton.querySelector('span').textContent = mode === 'question' ? '✨ 取得答案並解讀' : '📖 默念後取得解答';
    }

    document.querySelectorAll('.answerbook-mode-btn').forEach((button) => button.addEventListener('click', () => setMode(button.dataset.mode)));

    form?.addEventListener('submit', async (event) => {
        event.preventDefault();
        const mode = modeInput.value;
        const question = questionInput.value.trim();
        if (mode === 'question' && !question) {
            errorBox.textContent = '請先輸入想詢問的問題。';
            errorBox.hidden = false;
            return;
        }

        // 驗證 Turnstile 人機驗證 (模式為 question 且前端有配置時)
        let abToken = currentAnswerbookTurnstileToken;
        if (!abToken && window.turnstile && answerbookTurnstileWidgetId !== null) {
            try { abToken = window.turnstile.getResponse(answerbookTurnstileWidgetId); } catch (e) {}
        }
        const abTurnstileElem = document.getElementById('answerbook-turnstile');
        if (mode === 'question' && !abToken && abTurnstileElem && abTurnstileElem.getAttribute('data-sitekey')) {
            errorBox.textContent = '請先勾選並完成下方的人機安全驗證 (Cloudflare Turnstile) 後再點擊解讀！';
            errorBox.hidden = false;
            return;
        }

        errorBox.hidden = true;
        resultBox.hidden = true;
        analysisCard.hidden = true;
        loadingText.textContent = mode === 'question' ? '正在取得答案並整理解讀…' : '解答之書正在回應…';
        loading.hidden = false;
        submitButton.disabled = true;
        try {
            // Step 1: 取得解答之書原始答案
            const drawRes = await fetch('/api/answerbook-question', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mode: 'direct' })
            });
            const drawData = await drawRes.json();
            if (!drawRes.ok || !drawData.success) throw new Error(drawData.message || drawData.error || '解答之書暫時無法回應');
            
            const rawAnswer = drawData.answer || '';
            answerBox.textContent = rawAnswer;
            resultBox.hidden = false;

            let analysisText = '';
            // Step 2: 若為提問解讀模式，透過受 Turnstile 保護的 LLM 分析端點取得文字解讀
            if (mode === 'question') {
                const aiRes = await fetch('/api/answerbook/llm-analysis', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        result: { answer: rawAnswer, rawAnswer: drawData.rawAnswer || rawAnswer },
                        question,
                        conversationHistory: [],
                        'cf-turnstile-response': abToken || undefined,
                        turnstileToken: abToken || undefined
                    })
                });
                const aiData = await aiRes.json();
                if (aiData.success && aiData.analysis) {
                    analysisText = aiData.analysis;
                    analysisBox.innerHTML = renderMarkdown(analysisText);
                    analysisCard.hidden = false;
                } else {
                    analysisBox.innerHTML = `<p class="text-muted">⚠️ 文字解讀暫不可用：${aiData.error || '請稍後重試'}</p>`;
                    analysisCard.hidden = false;
                }
            }

            if (typeof window !== 'undefined') {
                if (!Array.isArray(window.conversationHistory)) window.conversationHistory = [];
                if (question) {
                    window.conversationHistory.push({ role: 'user', content: question });
                }
                const answerRecord = analysisText ? `【答案】${rawAnswer}\n\n【解讀】\n${analysisText}` : `【解答之書】${rawAnswer}`;
                window.conversationHistory.push({ role: 'assistant', content: answerRecord });
            }
            statusBox.textContent = (mode === 'question' && analysisText) ? '已完成解答與文字解讀。' : (mode === 'question' ? '已取得原始答案，解讀生成失敗。' : '已取得原始答案。');
        } catch (error) {
            errorBox.textContent = `取得失敗：${error.message}`;
            errorBox.hidden = false;
        } finally {
            resetAnswerbookTurnstile();
            loading.hidden = true;
            submitButton.disabled = false;
        }
    });

    setMode('direct');
})();
