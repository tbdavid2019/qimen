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

    function setMode(mode) {
        modeInput.value = mode;
        questionGroup.hidden = mode !== 'question';
        questionInput.required = mode === 'question';
        document.querySelectorAll('.answerbook-mode-btn').forEach((button) => {
            const active = button.dataset.mode === mode;
            button.classList.toggle('active', active);
            button.setAttribute('aria-selected', active ? 'true' : 'false');
        });
        submitButton.querySelector('span').textContent = mode === 'question' ? '✨ 取得答案並請 AI 解讀' : '📖 默念後取得解答';
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
        errorBox.hidden = true;
        resultBox.hidden = true;
        analysisCard.hidden = true;
        loadingText.textContent = mode === 'question' ? '正在取得答案並請 AI 解讀…' : '解答之書正在回應…';
        loading.hidden = false;
        submitButton.disabled = true;
        try {
            const response = await fetch('/api/answerbook-question', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mode, ...(question ? { question } : {}) })
            });
            const data = await response.json();
            if (!response.ok || !data.success) throw new Error(data.message || data.error || '解答之書暫時無法回應');
            answerBox.textContent = data.answer || '';
            if (data.analysis) {
                analysisBox.innerHTML = renderMarkdown(data.analysis);
                analysisCard.hidden = false;
            }
            statusBox.textContent = data.analysisSuccess === false ? '原始答案已取得，但 AI 解讀暫時不可用。' : (mode === 'question' ? '已完成解答與 AI 解讀。' : '已取得原始答案。');
            resultBox.hidden = false;
        } catch (error) {
            errorBox.textContent = `取得失敗：${error.message}`;
            errorBox.hidden = false;
        } finally {
            loading.hidden = true;
            submitButton.disabled = false;
        }
    });

    setMode('direct');
})();
