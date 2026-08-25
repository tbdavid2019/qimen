(() => {
    const page = document.body.dataset.suite;
    const form = document.getElementById('suiteForm');
    const output = document.getElementById('suiteResult');
    const analysisButton = document.getElementById('suiteAnalyze');
    let lastResult = null;
    const show = (value) => { output.textContent = typeof value === 'string' ? value : JSON.stringify(value, null, 2); output.hidden = false; };
    const value = (name) => form.elements[name]?.value?.trim();
    function payload() {
        if (page === 'tarot') return { spread: value('spread'), question: value('question') };
        if (page === 'fengshui') return { facing: value('facing'), moveInYear: Number(value('moveInYear')), residentYear: Number(value('residentYear')), sex: value('sex'), year: Number(value('year')) };
        if (page === 'bazi2') return { name: value('name'), formerName: value('formerName'), calendar: value('calendar'), date: value('date'), time: value('time'), sex: value('sex'), place: value('place') };
        return { mode: value('mode'), firstYear: Number(value('firstYear')), secondYear: Number(value('secondYear')) };
    }
    const endpoint = { tarot: '/api/tarot/reading', fengshui: '/api/fengshui/report', bazi2: '/api/bazi2/chart', yinyuan: '/api/yinyuan/reading' }[page];
    form?.addEventListener('submit', async (event) => {
        event.preventDefault(); show('計算中…');
        try {
            const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload()) });
            const data = await response.json(); if (!data.success) throw new Error(data.error || '計算失敗');
            lastResult = data.reading || data.report || data.chart || data.result; show(lastResult); analysisButton.hidden = false;
        } catch (error) { show(`錯誤：${error.message}`); }
    });
    analysisButton?.addEventListener('click', async () => {
        if (!lastResult) return; show('AI 解讀中…');
        try {
            const response = await fetch(`/api/${page}/llm-analysis`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ result: lastResult, question: value('question') || '' }) });
            const data = await response.json(); if (!data.success) throw new Error(data.error || 'AI 解讀失敗'); show(data.analysis);
        } catch (error) { show(`錯誤：${error.message}`); }
    });
})();
