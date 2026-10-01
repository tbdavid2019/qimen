/**
 * public/js/liuyao.js
 * 
 * 六爻神卦互動客戶端
 * - 三枚銅錢連續 6 次搖卦動畫與音效
 * - 神速起卦一鍵成卦
 * - 大衍筮法、年月日時、手動爻值多模式切換
 * - 雙卦排盤、用神直斷、動變生剋渲染
 * - 宗師 AI 解讀與對話追問
 */

(function () {
    let tossHistory = [];
    let currentCategory = '求財投資';
    let currentMode = 'coins';
    let audioCtx = null;
    let isFlipping = false;
    let latestDivinationResult = null;

    // 播放銅錢金屬輕鳴音效 (Web Audio API 合成音，無需外部音檔)
    function playCoinChime() {
        try {
            if (!audioCtx) {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1200 + Math.random() * 400, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.35);
            gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.35);
        } catch (e) {
            // Audio not allowed or failed
        }
    }

    function triggerHaptic() {
        if (navigator.vibrate) {
            try { navigator.vibrate(25); } catch (e) {}
        }
    }

    // 初始化頁面事件
    document.addEventListener('DOMContentLoaded', () => {
        initCategoryPills();
        initModeTabs();
        initCoinTossControls();
        initOtherCastingForms();
        initAIAnalysisControls();
    });

    // 分類選擇膠囊
    function initCategoryPills() {
        const pills = document.querySelectorAll('.liuyao-pill');
        pills.forEach(pill => {
            pill.addEventListener('click', () => {
                pills.forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                currentCategory = pill.getAttribute('data-cat') || pill.textContent.trim();
                const catInput = document.getElementById('liuyaoCategory');
                if (catInput) catInput.value = currentCategory;
            });
        });
    }

    // 起卦模式切換
    function initModeTabs() {
        const tabs = document.querySelectorAll('.liuyao-tab-btn');
        const sections = {
            coins: document.getElementById('modeCoinsSection'),
            dayan: document.getElementById('modeDayanSection'),
            datetime: document.getElementById('modeDatetimeSection'),
            manual: document.getElementById('modeManualSection')
        };

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                currentMode = tab.getAttribute('data-mode');

                Object.keys(sections).forEach(mode => {
                    if (sections[mode]) {
                        sections[mode].style.display = (mode === currentMode) ? 'block' : 'none';
                    }
                });
            });
        });
    }

    // 銅錢搖卦控制
    function initCoinTossControls() {
        const tossBtn = document.getElementById('btnTossOnce');
        const quickTossBtn = document.getElementById('btnQuickToss');
        const resetTossBtn = document.getElementById('btnResetToss');

        if (tossBtn) {
            tossBtn.addEventListener('click', () => {
                if (isFlipping || tossHistory.length >= 6) return;
                performOneToss();
            });
        }

        if (quickTossBtn) {
            quickTossBtn.addEventListener('click', () => {
                if (isFlipping) return;
                performQuickToss();
            });
        }

        if (resetTossBtn) {
            resetTossBtn.addEventListener('click', () => {
                resetCoinToss();
            });
        }
    }

    function performOneToss(callback) {
        isFlipping = true;
        const coins = document.querySelectorAll('.coin');
        coins.forEach(c => c.classList.add('flipping'));
        playCoinChime();
        triggerHaptic();

        setTimeout(() => {
            coins.forEach(c => c.classList.remove('flipping'));

            // 模擬三枚銅錢 (2=背, 3=字)
            const c1 = Math.random() < 0.5 ? 2 : 3;
            const c2 = Math.random() < 0.5 ? 2 : 3;
            const c3 = Math.random() < 0.5 ? 2 : 3;
            const sum = c1 + c2 + c3; // 6, 7, 8, 9

            // 更新銅錢外觀
            updateCoinFaces([c1, c2, c3]);

            tossHistory.push(sum);
            const lineIndex = tossHistory.length; // 1~6

            // 更新階梯指示塔
            updateTowerStep(lineIndex, sum);

            isFlipping = false;

            if (tossHistory.length === 6) {
                document.getElementById('tossStatusText').textContent = '🎉 六爻齊備！正在起卦排盤中...';
                submitLiuyaoDivination({
                    method: 'manual',
                    lines: tossHistory.join('')
                });
            } else {
                const nextYao = ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻'][tossHistory.length];
                document.getElementById('tossStatusText').textContent = `已搖出第 ${lineIndex} 爻，請搖第 ${lineIndex + 1} 爻（${nextYao}）`;
            }

            if (callback) callback();
        }, 650);
    }

    function performQuickToss() {
        resetCoinToss();
        isFlipping = true;
        let step = 0;
        document.getElementById('tossStatusText').textContent = '⚡ 神速起卦中...';

        const interval = setInterval(() => {
            step++;
            const c1 = Math.random() < 0.5 ? 2 : 3;
            const c2 = Math.random() < 0.5 ? 2 : 3;
            const c3 = Math.random() < 0.5 ? 2 : 3;
            const sum = c1 + c2 + c3;
            updateCoinFaces([c1, c2, c3]);
            tossHistory.push(sum);
            updateTowerStep(step, sum);
            playCoinChime();

            if (step >= 6) {
                clearInterval(interval);
                isFlipping = false;
                document.getElementById('tossStatusText').textContent = '🎉 神速起卦完成，正在生成納甲排盤...';
                submitLiuyaoDivination({
                    method: 'manual',
                    lines: tossHistory.join('')
                });
            }
        }, 140);
    }

    function resetCoinToss() {
        tossHistory = [];
        isFlipping = false;
        document.getElementById('tossStatusText').textContent = '點擊「擲錢起爻」開始，由初爻逐次搖至上爻';
        for (let i = 1; i <= 6; i++) {
            const stepEl = document.getElementById(`towerStep${i}`);
            if (stepEl) {
                stepEl.className = 'tower-step';
                stepEl.innerHTML = `<span>第 ${i} 爻</span><span class="text-muted">待搖</span>`;
            }
        }
        document.getElementById('liuyaoResultContainer').style.display = 'none';
    }

    function updateCoinFaces(vals) {
        vals.forEach((v, idx) => {
            const el = document.getElementById(`coin${idx + 1}`);
            if (el) {
                el.textContent = v === 3 ? '字' : '背';
                el.style.background = v === 3
                    ? 'radial-gradient(circle at 35% 35%, #fde047, #d97706)'
                    : 'radial-gradient(circle at 35% 35%, #fb923c, #9a3412)';
            }
        });
    }

    function updateTowerStep(lineIndex, sum) {
        const stepEl = document.getElementById(`towerStep${lineIndex}`);
        if (!stepEl) return;

        stepEl.classList.add('done');
        let symbolHtml = '';
        if (sum === 7) {
            symbolHtml = '<span class="yao-bar-yang">▅▅▅▅▅</span> <small>(少陽)</small>';
        } else if (sum === 8) {
            symbolHtml = '<span class="yao-bar-yin">▅▅　▅▅</span> <small>(少陰)</small>';
        } else if (sum === 9) {
            symbolHtml = '<span class="yao-bar-yang">▅▅▅▅▅</span> <span class="moving-indicator">○ (老陽動)</span>';
        } else if (sum === 6) {
            symbolHtml = '<span class="yao-bar-yin">▅▅　▅▅</span> <span class="moving-indicator">× (老陰動)</span>';
        }
        stepEl.innerHTML = `<span>第 ${lineIndex} 爻</span><span>${symbolHtml}</span>`;
    }

    // 其他起卦模式
    function initOtherCastingForms() {
        // 大衍筮法按鈕
        const btnDayanCast = document.getElementById('btnDayanCast');
        if (btnDayanCast) {
            btnDayanCast.addEventListener('click', () => {
                submitLiuyaoDivination({ method: 'dayan' });
            });
        }

        // 時間起卦按鈕
        const btnDatetimeCast = document.getElementById('btnDatetimeCast');
        if (btnDatetimeCast) {
            btnDatetimeCast.addEventListener('click', () => {
                const dtVal = document.getElementById('datetimeInput')?.value;
                submitLiuyaoDivination({
                    method: 'datetime',
                    datetime: dtVal || undefined
                });
            });
        }

        // 手動爻值按鈕
        const btnManualCast = document.getElementById('btnManualCast');
        if (btnManualCast) {
            btnManualCast.addEventListener('click', () => {
                const lines = document.getElementById('manualLinesInput')?.value?.trim();
                if (!lines || lines.length !== 6) {
                    alert('請輸入完整的 6 位爻值（由初爻至上爻，如 789687）');
                    return;
                }
                submitLiuyaoDivination({
                    method: 'manual',
                    lines
                });
            });
        }
    }

    // 發送排盤請求
    async function submitLiuyaoDivination(extraParams = {}) {
        const question = document.getElementById('userQuestionInput')?.value?.trim() || '';
        const gender = document.querySelector('input[name="gender"]:checked')?.value || '男';
        const loadingEl = document.getElementById('liuyaoLoading');
        const resultContainer = document.getElementById('liuyaoResultContainer');

        if (loadingEl) loadingEl.style.display = 'block';
        if (resultContainer) resultContainer.style.display = 'none';

        try {
            const payload = {
                category: currentCategory,
                question,
                gender,
                analyze: true,
                ...extraParams
            };

            const resp = await fetch('/api/liuyao', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await resp.json();
            if (!data.success) {
                alert('起卦失敗：' + (data.error || '未知錯誤'));
                return;
            }

            latestDivinationResult = data.result;
            renderLiuyaoBoard(data.result);

            if (data.analysis) {
                renderAIAnalysis(data.analysis);
            } else {
                triggerLLMAnalysis(data.result, question);
            }

            if (resultContainer) {
                resultContainer.style.display = 'block';
                resultContainer.scrollIntoView({ behavior: 'smooth' });
            }
        } catch (e) {
            alert('連線失敗：' + e.message);
        } finally {
            if (loadingEl) loadingEl.style.display = 'none';
        }
    }

    // 渲染六爻雙卦排盤盤面
    function renderLiuyaoBoard(result) {
        const boardEl = document.getElementById('liuyaoBoard');
        if (!boardEl) return;

        const ben = result.benGua || {};
        const zhi = result.zhiGua || {};
        const gz = result.ganzhi || {};
        const ys = result.yongshen || {};
        const zx = result.zhuxiRule || {};
        const fushen = result.fushen || {};

        // 用神橫幅
        let yongshenHtml = `
            <div class="yongshen-banner">
                <div class="yongshen-title">🎯 專題用神鎖定：${escapeHtml(ys.name || '事態')}</div>
                <div class="yongshen-desc">${escapeHtml(ys.summary || '')}</div>
            </div>
        `;

        // 朱熹變爻斷法橫幅
        let zhuxiHtml = `
            <div class="zhuxi-card">
                <div class="zhuxi-title">📜 朱熹《易學啟蒙》考變占斷法：${escapeHtml(zx.mainRule || '')}</div>
                <div class="text-muted" style="font-size: 13.5px;">${escapeHtml(zx.explanation || '')}</div>
            </div>
        `;

        // 本卦表格
        const benRows = (ben.lines || []).slice().reverse().map(l => {
            const isShi = l.position === ben.shi ? '<span class="badge-shi">世</span>' : '';
            const isYing = l.position === ben.ying ? '<span class="badge-ying">應</span>' : '';
            const fu = fushen[l.position]
                ? `<span class="badge-fushen">伏:${fushen[l.position].liuqin}${fushen[l.position].branch}</span>`
                : '';
            const isKong = gz.xunKong && gz.xunKong.includes(l.branch) ? '<span class="badge-kong">空</span>' : '';
            const broken = l.isMonthBroken ? '<span class="badge-kong">破</span>' : '';
            const lineClass = l.isYang ? 'yao-bar-yang' : 'yao-bar-yin';

            return `
                <tr class="gua-line-row">
                    <td><small class="text-muted">${l.position}</small></td>
                    <td><strong>${l.liushen}</strong></td>
                    <td>${fu}</td>
                    <td><span class="${lineClass}">${l.lineSymbol}</span> ${l.movingSymbol ? `<strong class="text-danger">${l.movingSymbol}</strong>` : ''}</td>
                    <td><strong>${l.liuqin}</strong></td>
                    <td>${l.stem}${l.branch}${l.element} ${isKong}${broken}</td>
                    <td><small class="text-muted">${l.seasonal}</small></td>
                    <td>${isShi}${isYing}</td>
                </tr>
            `;
        }).join('');

        // 之卦表格
        const zhiRows = (zhi.lines || []).slice().reverse().map(l => {
            const isShi = l.position === zhi.shi ? '<span class="badge-shi">世</span>' : '';
            const isYing = l.position === zhi.ying ? '<span class="badge-ying">應</span>' : '';
            const lineClass = l.isYang ? 'yao-bar-yang' : 'yao-bar-yin';

            return `
                <tr class="gua-line-row">
                    <td><small class="text-muted">${l.position}</small></td>
                    <td><span class="${lineClass}">${l.lineSymbol}</span></td>
                    <td><strong>${l.liuqin}</strong></td>
                    <td>${l.stem}${l.branch}${l.element}</td>
                    <td>${isShi}${isYing}</td>
                </tr>
            `;
        }).join('');

        boardEl.innerHTML = `
            <div class="liuyao-header-banner">
                <div>
                    <h3 style="margin:0 0 4px 0; font-weight:800; font-size:18px;">
                        【${escapeHtml(ben.name)}】 之 【${escapeHtml(zhi.name)}】
                    </h3>
                    <div class="liuyao-time-meta">
                        ${escapeHtml(result.lunarText || '')} ｜ 
                        ${gz.year}年 ${gz.month}月 ${gz.day}日 ${gz.time}時 ｜ 
                        旬空：<strong>${gz.xunKong || '無'}</strong>
                    </div>
                </div>
                <div>
                    <span class="liuyao-badge liuyao-badge-gold">${ben.palace}宮·${ben.palaceElement} (${ben.type})</span>
                </div>
            </div>

            ${yongshenHtml}

            <div class="gua-matrix-grid">
                <div class="gua-card">
                    <div class="gua-card-title">
                        <span>本卦：${escapeHtml(ben.name)}</span>
                        <small class="text-muted">${ben.palace}宮·五行${ben.palaceElement}</small>
                    </div>
                    <table class="gua-lines-table">
                        <thead>
                            <tr class="text-muted" style="font-size:12px;">
                                <th>爻</th><th>六神</th><th>伏神</th><th>爻象</th><th>六親</th><th>干支</th><th>旺衰</th><th>世應</th>
                            </tr>
                        </thead>
                        <tbody>${benRows}</tbody>
                    </table>
                </div>

                <div class="gua-card">
                    <div class="gua-card-title">
                        <span>之卦：${escapeHtml(zhi.name)}</span>
                        <small class="text-muted">${zhi.palace}宮·變爻轉化</small>
                    </div>
                    <table class="gua-lines-table">
                        <thead>
                            <tr class="text-muted" style="font-size:12px;">
                                <th>爻</th><th>爻象</th><th>六親</th><th>干支</th><th>世應</th>
                            </tr>
                        </thead>
                        <tbody>${zhiRows}</tbody>
                    </table>
                </div>
            </div>

            ${zhuxiHtml}
        `;
    }

    // 渲染 LLM 解讀
    function renderAIAnalysis(markdownText) {
        const aiContainer = document.getElementById('liuyaoAIAnalysis');
        if (!aiContainer) return;

        // 簡單將 Markdown 標題與段落轉為乾淨 HTML
        let html = escapeHtml(markdownText)
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
            .replace(/\n\n/gim, '<br><br>')
            .replace(/\n- (.*$)/gim, '<li>$1</li>');

        aiContainer.innerHTML = html;
        document.getElementById('liuyaoAISection').style.display = 'block';
    }

    // 若 API 回傳未包含即時 AI，前端單獨請求
    async function triggerLLMAnalysis(result, question) {
        const aiContainer = document.getElementById('liuyaoAIAnalysis');
        if (!aiContainer) return;
        aiContainer.innerHTML = '<div class="text-center py-4 text-muted"><span class="glyphicon glyphicon-refresh glyphicon-spin"></span> 正在邀請宗師依據納甲用神深度推演...</div>';
        document.getElementById('liuyaoAISection').style.display = 'block';

        try {
            const resp = await fetch('/api/suite-ai/liuyao', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    result,
                    question
                })
            });
            const data = await resp.json();
            if (data.success && data.analysis) {
                renderAIAnalysis(data.analysis);
                if (typeof window !== 'undefined') {
                    window.conversationHistory = window.conversationHistory || [];
                    window.conversationHistory.push({ role: 'user', content: question || '六爻神卦排盤分析' });
                    window.conversationHistory.push({ role: 'assistant', content: data.analysis });
                    window.lastSuiteResult = result;
                }
            } else {
                aiContainer.innerHTML = '<div class="alert alert-warning">未能取得即時解讀，已保留上述卦盤結構供您參詳。</div>';
            }
        } catch (e) {
            aiContainer.innerHTML = `<div class="text-muted">解讀服務連線暫緩：${escapeHtml(e.message)}</div>`;
        }
    }

    // 追問與對話互動
    function initAIAnalysisControls() {
        const askBtn = document.getElementById('btnAskFollowup');
        const askInput = document.getElementById('followupQuestionInput');

        if (askBtn && askInput) {
            askBtn.addEventListener('click', async () => {
                const q = askInput.value.trim();
                if (!q) return;
                if (!latestDivinationResult) {
                    alert('請先起卦');
                    return;
                }
                askBtn.disabled = true;
                askBtn.textContent = '分析中...';
                try {
                    const resp = await fetch('/api/suite-ai/liuyao', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            result: latestDivinationResult,
                            question: q
                        })
                    });
                    const data = await resp.json();
                    if (data.success && data.analysis) {
                        const historyEl = document.getElementById('followupHistory');
                        if (historyEl) {
                            const newEntry = document.createElement('div');
                            newEntry.className = 'well mt-3';
                            newEntry.innerHTML = `<strong>問：${escapeHtml(q)}</strong><hr style="margin:8px 0;">${escapeHtml(data.analysis).replace(/\n/g, '<br>')}`;
                            historyEl.appendChild(newEntry);
                            askInput.value = '';
                        }
                        if (typeof window !== 'undefined') {
                            window.conversationHistory = window.conversationHistory || [];
                            window.conversationHistory.push({ role: 'user', content: q });
                            window.conversationHistory.push({ role: 'assistant', content: data.analysis });
                        }
                    }
                } catch (e) {
                    alert('追問失敗：' + e.message);
                } finally {
                    askBtn.disabled = false;
                    askBtn.textContent = '送出追問 ➔';
                }
            });
        }
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
})();
