/**
 * public/js/liuyao.js
 * 
 * 六爻神卦互動客戶端
 * - 三枚銅錢連續 6 次搖卦動畫與音效
 * - 神速起卦一鍵成卦
 * - 大衍筮法、年月日時、手動爻值多模式切換
 * - 雙卦排盤、用神直斷、動變生剋渲染
 * - Cloudflare Turnstile 人機驗證防護
 * - 完整快捷操作列：複製卦象與解盤、寄送 Email 結果、重新起卦
 * - 宗師 AI 解讀與對話追問 (對齊 Lucide 圖標系統與 Impeccable 設計規範)
 */

(function () {
    'use strict';

    let tossHistory = [];
    let currentCategory = '求財投資';
    let currentMode = 'coins';
    let audioCtx = null;
    let isFlipping = false;
    let latestDivinationResult = null;
    let latestAiAnalysisText = '';

    // 重新渲染頁面上所有 Lucide 圖標
    function refreshIcons() {
        if (typeof window !== 'undefined' && window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
        }
    }

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
        } catch (e) {}
    }

    function triggerHaptic() {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            try { navigator.vibrate(25); } catch (e) {}
        }
    }

    // Cloudflare Turnstile 人機驗證管理
    let suiteTurnstileWidgetId = null;
    let currentSuiteTurnstileToken = '';
    let suiteTurnstileRenderRetries = 0;

    let followupTurnstileWidgetId = null;
    let currentFollowupTurnstileToken = '';
    let followupTurnstileRenderRetries = 0;

    function loadTurnstileScript(callback) {
        if (typeof window !== 'undefined' && window.turnstile && typeof window.turnstile.render === 'function') {
            return callback(null);
        }
        const existing = document.querySelector('script[src*="challenges.cloudflare.com/turnstile"]');
        if (existing) {
            existing.addEventListener('load', () => callback(null), { once: true });
            existing.addEventListener('error', (err) => callback(err || new Error('Turnstile script failed to load')), { once: true });
            if (typeof window.turnstile !== 'undefined' && typeof window.turnstile.render === 'function') {
                return callback(null);
            }
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

    function renderSuiteTurnstile() {
        const container = document.getElementById('suite-turnstile');
        if (!container || typeof container.getAttribute !== 'function') return;
        const sitekey = container.getAttribute('data-sitekey');
        if (!sitekey) return;

        loadTurnstileScript((err) => {
            if (err) {
                console.warn('[Turnstile] Liuyao suite widget failed to load:', err);
                return;
            }
            if (!window.turnstile || typeof window.turnstile.render !== 'function') {
                if (suiteTurnstileRenderRetries < 30) {
                    suiteTurnstileRenderRetries++;
                    setTimeout(renderSuiteTurnstile, 200);
                }
                return;
            }
            suiteTurnstileRenderRetries = 0;
            if (suiteTurnstileWidgetId === null) {
                try {
                    const action = container.getAttribute('data-action') || 'llm_analysis';
                    const theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'auto';
                    suiteTurnstileWidgetId = window.turnstile.render(container, {
                        sitekey: sitekey,
                        action: action,
                        theme: theme,
                        size: 'flexible',
                        callback: (token) => {
                            currentSuiteTurnstileToken = token;
                            container.dataset.token = token;
                            const promptBox = document.querySelector('.suite-turnstile-prompt-box');
                            if (promptBox && latestDivinationResult) {
                                promptBox.innerHTML = '<p style="color:#10b981; font-weight:700;"><i data-lucide="check-circle"></i> 驗證完成，正在啟動宗師深度推演…</p>';
                                refreshIcons();
                                setTimeout(() => {
                                    triggerLLMAnalysis(latestDivinationResult, document.getElementById('userQuestionInput')?.value?.trim() || '');
                                }, 300);
                            }
                        },
                        'expired-callback': () => {
                            currentSuiteTurnstileToken = '';
                            delete container.dataset.token;
                        },
                        'error-callback': () => {
                            currentSuiteTurnstileToken = '';
                            delete container.dataset.token;
                        }
                    });
                    container.dataset.widgetId = suiteTurnstileWidgetId;
                    window.suiteTurnstileWidgetId = suiteTurnstileWidgetId;
                } catch (e) {
                    console.warn('[Turnstile] Liuyao suite render error:', e);
                }
            }
        });
    }

    function renderFollowupTurnstile() {
        const container = document.getElementById('suite-followup-turnstile');
        if (!container || typeof container.getAttribute !== 'function') return;
        const sitekey = container.getAttribute('data-sitekey');
        if (!sitekey) return;

        loadTurnstileScript((err) => {
            if (err) {
                console.warn('[Turnstile] Liuyao followup widget failed to load:', err);
                return;
            }
            if (!window.turnstile || typeof window.turnstile.render !== 'function') {
                if (followupTurnstileRenderRetries < 30) {
                    followupTurnstileRenderRetries++;
                    setTimeout(renderFollowupTurnstile, 200);
                }
                return;
            }
            followupTurnstileRenderRetries = 0;
            if (followupTurnstileWidgetId === null) {
                try {
                    const action = container.getAttribute('data-action') || 'llm_analysis';
                    const theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'auto';
                    followupTurnstileWidgetId = window.turnstile.render(container, {
                        sitekey: sitekey,
                        action: action,
                        theme: theme,
                        size: 'flexible',
                        callback: (token) => {
                            currentFollowupTurnstileToken = token;
                            container.dataset.token = token;
                        },
                        'expired-callback': () => {
                            currentFollowupTurnstileToken = '';
                            delete container.dataset.token;
                        },
                        'error-callback': () => {
                            currentFollowupTurnstileToken = '';
                            delete container.dataset.token;
                        }
                    });
                    container.dataset.widgetId = followupTurnstileWidgetId;
                    window.suiteFollowUpWidgetId = followupTurnstileWidgetId;
                } catch (e) {
                    console.warn('[Turnstile] Liuyao followup render error:', e);
                }
            }
        });
    }

    // Turnstile 驗證碼獲取與重置
    function getTurnstileToken(widgetContainerId) {
        if (widgetContainerId === 'suite-turnstile') {
            if (currentSuiteTurnstileToken) return currentSuiteTurnstileToken;
            const container = document.getElementById('suite-turnstile');
            if (container) {
                const hiddenInput = container.querySelector('input[name="cf-turnstile-response"]');
                if (hiddenInput && hiddenInput.value) return hiddenInput.value;
            }
            if (typeof window !== 'undefined' && window.turnstile && suiteTurnstileWidgetId !== null) {
                try {
                    const t = window.turnstile.getResponse(suiteTurnstileWidgetId);
                    if (t) return t;
                } catch (_) {}
            }
        } else if (widgetContainerId === 'suite-followup-turnstile') {
            if (currentFollowupTurnstileToken) return currentFollowupTurnstileToken;
            const container = document.getElementById('suite-followup-turnstile');
            if (container) {
                const hiddenInput = container.querySelector('input[name="cf-turnstile-response"]');
                if (hiddenInput && hiddenInput.value) return hiddenInput.value;
            }
            if (typeof window !== 'undefined' && window.turnstile && followupTurnstileWidgetId !== null) {
                try {
                    const t = window.turnstile.getResponse(followupTurnstileWidgetId);
                    if (t) return t;
                } catch (_) {}
            }
            if (currentSuiteTurnstileToken) return currentSuiteTurnstileToken;
        }

        if (typeof window !== 'undefined' && window.turnstile) {
            try {
                const el = document.getElementById(widgetContainerId);
                if (el && el.dataset.widgetId) {
                    const t = window.turnstile.getResponse(el.dataset.widgetId);
                    if (t) return t;
                }
                return window.turnstile.getResponse() || '';
            } catch (_) {}
        }
        return '';
    }

    function resetTurnstile(widgetContainerId) {
        if (widgetContainerId === 'suite-turnstile') {
            currentSuiteTurnstileToken = '';
            const container = document.getElementById('suite-turnstile');
            if (container) delete container.dataset.token;
            if (typeof window !== 'undefined' && window.turnstile) {
                try {
                    if (suiteTurnstileWidgetId !== null) {
                        window.turnstile.reset(suiteTurnstileWidgetId);
                    } else if (container) {
                        window.turnstile.reset(container);
                    }
                } catch (_) {}
            }
        } else if (widgetContainerId === 'suite-followup-turnstile') {
            currentFollowupTurnstileToken = '';
            const container = document.getElementById('suite-followup-turnstile');
            if (container) delete container.dataset.token;
            if (typeof window !== 'undefined' && window.turnstile) {
                try {
                    if (followupTurnstileWidgetId !== null) {
                        window.turnstile.reset(followupTurnstileWidgetId);
                    } else if (container) {
                        window.turnstile.reset(container);
                    }
                } catch (_) {}
            }
        } else {
            if (typeof window !== 'undefined' && window.turnstile) {
                try {
                    const el = document.getElementById(widgetContainerId);
                    if (el && el.dataset.widgetId) {
                        window.turnstile.reset(el.dataset.widgetId);
                    } else {
                        window.turnstile.reset();
                    }
                } catch (_) {}
            }
        }
    }

    // 浮動輕量級 Toast 通知系統 (取代阻斷式原生 alert)
    function showToast(message, type = 'info') {
        let container = document.getElementById('liuyaoToastContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'liuyaoToastContainer';
            container.className = 'liuyao-toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `liuyao-toast liuyao-toast-${type}`;

        const iconMap = {
            success: 'check-circle-2',
            warning: 'alert-triangle',
            error: 'alert-circle',
            info: 'info'
        };
        const iconName = iconMap[type] || 'info';

        toast.innerHTML = `
            <i data-lucide="${iconName}" class="toast-icon"></i>
            <span>${escapeHtml(message)}</span>
        `;

        const closeToast = () => {
            if (toast.classList.contains('closing')) return;
            toast.classList.add('closing');
            setTimeout(() => {
                if (toast.parentNode) toast.parentNode.removeChild(toast);
            }, 250);
        };

        toast.addEventListener('click', closeToast);
        container.appendChild(toast);
        refreshIcons();

        setTimeout(closeToast, 3500);
    }

    // 複製到剪貼簿工具函式（含視覺動畫回饋）
    function copyTextWithFeedback(text, btnElement) {
        if (!text) return;
        const doSuccess = () => {
            if (btnElement) {
                const origHtml = btnElement.innerHTML;
                btnElement.innerHTML = '<i data-lucide="check" style="color:#10b981;"></i> 已複製！';
                refreshIcons();
                setTimeout(() => {
                    btnElement.innerHTML = origHtml;
                    refreshIcons();
                }, 2000);
            }
        };

        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).then(doSuccess).catch(() => {
                fallbackCopy(text);
                doSuccess();
            });
        } else {
            fallbackCopy(text);
            doSuccess();
        }
    }

    function fallbackCopy(text) {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        ta.style.top = '-9999px';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        try {
            document.execCommand('copy');
        } catch (_) {}
        document.body.removeChild(ta);
    }

    // 格式化完整卦象與解讀為易讀文字供剪貼簿使用
    function formatDivinationCopyText(result, aiText) {
        if (!result) return '';
        const ben = result.benGua || {};
        const zhi = result.zhiGua || {};
        const gz = result.ganzhi || {};
        const ys = result.yongshen || {};
        const zx = result.zhuxiRule || {};
        const q = result.question || document.getElementById('userQuestionInput')?.value?.trim() || '';

        const lines = [
            `【333 六爻神卦 · 京房納甲排盤】`,
            q ? `占問事項：${q}` : '',
            result.category ? `占問分類：${result.category}` : '',
            `占卦時間：${result.datetime || ''}（農曆：${result.lunarText || ''}）`,
            `干支：${gz.year}年 ${gz.month}月 ${gz.day}日 ${gz.time}時 ｜ 月建：${gz.monthBranch || ''} ｜ 日辰：${gz.dayBranch || ''} ｜ 旬空：${gz.xunKong || ''}`,
            `----------------------------------------`,
            `本卦：【${ben.name}】（${ben.palace}宮·五行屬${ben.palaceElement}·${ben.type}） 世在第${ben.shi}爻 應在第${ben.ying}爻`,
            (zhi.name && zhi.name !== ben.name) ? `之卦：【${zhi.name}】（${zhi.palace}宮·${zhi.type}） 世在第${zhi.shi}爻 應在第${zhi.ying}爻` : '',
            ys.summary ? `專題用神：${ys.name}（以【${ys.target}】為用神）- ${ys.summary}` : '',
            zx.mainRule ? `考變占斷法：${zx.mainRule}（發動 ${zx.movingCount || 0} 爻）` : '',
            `----------------------------------------`,
            aiText ? `【宗師解盤】\n${aiText}` : ''
        ].filter(Boolean);

        return lines.join('\n');
    }

    // 初始化頁面事件
    document.addEventListener('DOMContentLoaded', () => {
        initCategoryPills();
        initGenderPills();
        initModeTabs();
        initCoinTossControls();
        initOtherCastingForms();
        initActionBar();
        initAIAnalysisControls();
        initKeyboardShortcuts();
        renderSuiteTurnstile();
        refreshIcons();
    });

    if (typeof document !== 'undefined' && (document.readyState === 'interactive' || document.readyState === 'complete')) {
        renderSuiteTurnstile();
    }

    // 性別切換現代膠囊
    function initGenderPills() {
        const pills = document.querySelectorAll('.liuyao-gender-pill');
        pills.forEach(pill => {
            pill.addEventListener('click', () => {
                pills.forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                const val = pill.getAttribute('data-gender') || '男';
                const hiddenInput = document.getElementById('liuyaoGenderInput');
                if (hiddenInput) hiddenInput.value = val;
            });
        });
    }

    // 鍵盤加速鍵支援 (Space 擲錢、U 撤銷、Enter 手動排盤)
    function initKeyboardShortcuts() {
        window.addEventListener('keydown', (e) => {
            const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
            const isEditing = tag === 'input' || tag === 'textarea' || (e.target && e.target.isContentEditable);

            if (e.code === 'Space' && !isEditing) {
                if (currentMode === 'coins') {
                    e.preventDefault();
                    const tossBtn = document.getElementById('btnTossOnce');
                    if (tossBtn && !tossBtn.disabled && !isFlipping && tossHistory.length < 6) {
                        performOneToss();
                    }
                }
            } else if ((e.key === 'u' || e.key === 'U') && !isEditing) {
                if (currentMode === 'coins' && tossHistory.length > 0 && !isFlipping) {
                    e.preventDefault();
                    undoLastToss();
                }
            } else if (e.key === 'Enter') {
                if (currentMode === 'manual' && document.activeElement && document.activeElement.id === 'manualLinesInput') {
                    e.preventDefault();
                    document.getElementById('btnManualCast')?.click();
                }
            }
        });
    }

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
                refreshIcons();
            });
        });
    }

    // 銅錢搖卦控制
    function initCoinTossControls() {
        const tossBtn = document.getElementById('btnTossOnce');
        const undoBtn = document.getElementById('btnUndoToss');
        const quickTossBtn = document.getElementById('btnQuickToss');
        const resetTossBtn = document.getElementById('btnResetToss');

        if (tossBtn) {
            tossBtn.addEventListener('click', () => {
                if (isFlipping || tossHistory.length >= 6) return;
                performOneToss();
            });
        }

        if (undoBtn) {
            undoBtn.addEventListener('click', () => {
                undoLastToss();
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

            // 更新撤銷按鈕狀態
            const undoBtn = document.getElementById('btnUndoToss');
            if (undoBtn) undoBtn.disabled = false;

            isFlipping = false;

            if (tossHistory.length === 6) {
                document.getElementById('tossStatusText').textContent = '🎉 六爻齊備！正在生成納甲排盤...';
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
                const undoBtn = document.getElementById('btnUndoToss');
                if (undoBtn) undoBtn.disabled = false;
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
        const undoBtn = document.getElementById('btnUndoToss');
        if (undoBtn) undoBtn.disabled = true;

        const statusEl = document.getElementById('tossStatusText');
        if (statusEl) statusEl.textContent = '點擊「擲錢起爻」開始，由初爻逐次搖至上爻（共 6 次）';

        for (let i = 1; i <= 6; i++) {
            const stepEl = document.getElementById(`towerStep${i}`);
            if (stepEl) {
                stepEl.className = 'tower-step';
                stepEl.innerHTML = `<span class="step-label">第 ${i} 爻</span><span class="step-value text-muted">待搖</span>`;
            }
        }
        const container = document.getElementById('liuyaoResultContainer');
        if (container) container.style.display = 'none';
        refreshIcons();
    }

    // 撤銷上一爻重新擲錢
    function undoLastToss() {
        if (isFlipping || tossHistory.length === 0) return;
        const lastLineIndex = tossHistory.length;
        tossHistory.pop();

        const stepEl = document.getElementById(`towerStep${lastLineIndex}`);
        if (stepEl) {
            stepEl.className = 'tower-step';
            stepEl.innerHTML = `<span class="step-label">第 ${lastLineIndex} 爻</span><span class="step-value text-muted">待搖</span>`;
        }

        const undoBtn = document.getElementById('btnUndoToss');
        if (undoBtn) undoBtn.disabled = (tossHistory.length === 0);

        const statusEl = document.getElementById('tossStatusText');
        if (statusEl) {
            if (tossHistory.length === 0) {
                statusEl.textContent = '點擊「擲錢起爻」開始，由初爻逐次搖至上爻（共 6 次）';
            } else {
                const nextYao = ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻'][tossHistory.length];
                statusEl.textContent = `已撤銷第 ${lastLineIndex} 爻。目前第 ${tossHistory.length} 爻，請搖第 ${tossHistory.length + 1} 爻（${nextYao}）`;
            }
        }
        showToast(`已撤銷第 ${lastLineIndex} 爻，請重新擲錢`, 'info');
    }

    function updateCoinFaces(vals) {
        vals.forEach((v, idx) => {
            const el = document.getElementById(`coin${idx + 1}`);
            if (el) {
                const face = el.querySelector('.coin-face');
                if (face) face.textContent = v === 3 ? '字' : '背';
            }
        });
    }

    function updateTowerStep(lineIndex, sum) {
        const stepEl = document.getElementById(`towerStep${lineIndex}`);
        if (!stepEl) return;

        stepEl.classList.add('done');
        let symbolHtml = '';
        if (sum === 7) {
            symbolHtml = '<span class="yao-bar-yang">▅▅▅▅▅</span> <small class="text-muted">(少陽 ⚊)</small>';
        } else if (sum === 8) {
            symbolHtml = '<span class="yao-bar-yin">▅▅　▅▅</span> <small class="text-muted">(少陰 ⚋)</small>';
        } else if (sum === 9) {
            symbolHtml = '<span class="yao-bar-yang">▅▅▅▅▅</span> <span class="moving-indicator">○ (老陽動)</span>';
        } else if (sum === 6) {
            symbolHtml = '<span class="yao-bar-yin">▅▅　▅▅</span> <span class="moving-indicator">× (老陰動)</span>';
        }
        stepEl.innerHTML = `<span class="step-label">第 ${lineIndex} 爻</span><span>${symbolHtml}</span>`;
    }

    // 其他起卦模式
    function initOtherCastingForms() {
        const btnDayanCast = document.getElementById('btnDayanCast');
        if (btnDayanCast) {
            btnDayanCast.addEventListener('click', () => {
                submitLiuyaoDivination({ method: 'dayan' });
            });
        }

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

        const btnManualCast = document.getElementById('btnManualCast');
        if (btnManualCast) {
            btnManualCast.addEventListener('click', () => {
                const lines = document.getElementById('manualLinesInput')?.value?.trim();
                if (!lines || lines.length !== 6) {
                    showToast('請輸入完整的 6 位爻值（由初爻至上爻，如 789687）', 'warning');
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
        const gender = document.getElementById('liuyaoGenderInput')?.value ||
                       document.querySelector('input[name="gender"]:checked')?.value || '男';
        const loadingEl = document.getElementById('liuyaoLoading');
        const resultContainer = document.getElementById('liuyaoResultContainer');

        if (loadingEl) loadingEl.style.display = 'block';
        if (resultContainer) resultContainer.style.display = 'none';

        try {
            const payload = {
                category: currentCategory,
                question,
                gender,
                analyze: false,
                ...extraParams
            };

            const resp = await fetch('/api/liuyao', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await resp.json();
            if (!data.success) {
                showToast('起卦失敗：' + (data.error || '未知錯誤'), 'error');
                return;
            }

            latestDivinationResult = data.result;
            renderLiuyaoBoard(data.result);

            if (data.analysis) {
                renderAIAnalysis(data.analysis);
            } else {
                triggerLLMAnalysis(data.result, question);
            }

            // 更新全站郵件寄送快照
            if (typeof window !== 'undefined') {
                window.lastSuiteResult = {
                    calculation: data.result,
                    analysis: data.analysis || ''
                };
                if (typeof window.publishSuiteEmailResult === 'function') {
                    window.publishSuiteEmailResult('六爻神卦', data.result, `【${data.result.benGua?.name || '六爻卦'}】排盤解讀`);
                }
            }

            if (resultContainer) {
                resultContainer.style.display = 'block';
                resultContainer.scrollIntoView({ behavior: 'smooth' });
            }
            refreshIcons();
        } catch (e) {
            showToast('連線失敗：' + e.message, 'error');
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
                <div class="yongshen-title"><i data-lucide="target"></i> 專題用神鎖定：${escapeHtml(ys.name || '事態')}</div>
                <div class="yongshen-desc">${escapeHtml(ys.summary || '')}</div>
            </div>
        `;

        // 朱熹變爻斷法橫幅
        let zhuxiHtml = `
            <div class="zhuxi-card">
                <div class="zhuxi-title"><i data-lucide="book-open"></i> 朱熹《易學啟蒙》考變占斷法：${escapeHtml(zx.mainRule || '')}</div>
                <div class="text-muted" style="font-size: 14px; line-height: 1.6;">${escapeHtml(zx.explanation || '')}</div>
            </div>
        `;

        // 本卦表格行
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

        // 之卦表格行
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
                    <h3 style="margin:0 0 6px 0; font-weight:800; font-size:18px;">
                        【${escapeHtml(ben.name)}】 之 【${escapeHtml(zhi.name)}】
                    </h3>
                    <div class="liuyao-time-meta">
                        ${escapeHtml(result.lunarText || '')} ｜ 
                        ${gz.year}年 ${gz.month}月 ${gz.day}日 ${gz.time}時 ｜ 
                        月建：<strong>${gz.monthBranch || ''}</strong> ｜ 日辰：<strong>${gz.dayBranch || ''}</strong> ｜ 
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
                        <small class="text-muted">${ben.palace}宮·五行屬${ben.palaceElement}</small>
                    </div>
                    <div class="gua-table-responsive">
                        <table class="gua-lines-table">
                            <thead>
                                <tr class="text-muted" style="font-size:13px;">
                                    <th title="爻位（由初爻至上爻）">爻</th>
                                    <th title="六神（青龍、朱雀、勾陳、螣蛇、白虎、玄武）">六神</th>
                                    <th title="伏神（若用神不上卦，尋伏於本宮首卦相應爻下）">伏神</th>
                                    <th title="陰陽爻象與動爻標記（○老陽動、×老陰動）">爻象</th>
                                    <th title="六親（父母、兄弟、子孫、妻財、官鬼）">六親</th>
                                    <th title="納甲干支與五行">干支</th>
                                    <th title="得月建日辰生扶之旺衰狀態">旺衰</th>
                                    <th title="世爻為自己、應爻為對方或事態">世應</th>
                                </tr>
                            </thead>
                            <tbody>${benRows}</tbody>
                        </table>
                    </div>
                </div>

                <div class="gua-card">
                    <div class="gua-card-title">
                        <span>之卦：${escapeHtml(zhi.name)}</span>
                        <small class="text-muted">${zhi.palace}宮·變爻轉化</small>
                    </div>
                    <div class="gua-table-responsive">
                        <table class="gua-lines-table">
                            <thead>
                                <tr class="text-muted" style="font-size:13px;">
                                    <th title="爻位">爻</th>
                                    <th title="變爻轉化後之陰陽爻象">爻象</th>
                                    <th title="之卦六親">六親</th>
                                    <th title="之卦干支五行">干支</th>
                                    <th title="之卦世應位">世應</th>
                                </tr>
                            </thead>
                            <tbody>${zhiRows}</tbody>
                        </table>
                    </div>
                </div>
            </div>

            ${zhuxiHtml}
        `;
        refreshIcons();
    }

    // 渲染 LLM 宗師深度解讀
    function renderAIAnalysis(markdownText) {
        latestAiAnalysisText = markdownText || '';
        const aiContainer = document.getElementById('liuyaoAIAnalysis');
        if (!aiContainer) return;

        if (window.MarkdownRenderer && typeof window.MarkdownRenderer.render === 'function') {
            aiContainer.innerHTML = window.MarkdownRenderer.render(markdownText);
        } else {
            aiContainer.innerHTML = escapeHtml(markdownText).replace(/\n/g, '<br>');
        }
        document.getElementById('liuyaoAISection').style.display = 'block';
        refreshIcons();
    }

    // 前端單獨請求 AI 深度解讀（支援 Turnstile 防護）
    async function triggerLLMAnalysis(result, question) {
        const aiContainer = document.getElementById('liuyaoAIAnalysis');
        if (!aiContainer) return;
        const aiSection = document.getElementById('liuyaoAISection');
        if (aiSection) aiSection.style.display = 'block';

        const token = getTurnstileToken('suite-turnstile');
        const container = document.getElementById('suite-turnstile');
        const isTurnstileConfigured = Boolean(container && container.getAttribute('data-sitekey'));

        if (isTurnstileConfigured && !token) {
            aiContainer.innerHTML = `
                <div class="suite-turnstile-prompt-box" style="text-align: center; padding: 24px 18px; background: rgba(232, 121, 79, 0.06); border: 1.5px dashed var(--suite-primary, #b45309); border-radius: 14px; margin: 12px 0;">
                    <div style="font-size: 28px; margin-bottom: 8px;">🛡️</div>
                    <p style="font-weight: 800; color: var(--suite-primary, #b45309); margin-bottom: 8px; font-size: 16px;">
                        請完成上方的人機安全驗證 (Cloudflare Turnstile)
                    </p>
                    <p style="font-size: 13.5px; color: var(--suite-text-muted, #667085); margin-bottom: 16px; line-height: 1.5;">
                        卦象已排定！請在上方 Step 2 完成 Turnstile 勾選驗證，即可啟動宗師納甲深度推演與吉凶指引。
                    </p>
                    <button type="button" id="btnRetryTurnstileLLM" class="btn suite-btn-primary">
                        <i data-lucide="sparkles"></i> 驗證完成，獲取宗師解讀 ➔
                    </button>
                </div>
            `;
            refreshIcons();
            const retryBtn = document.getElementById('btnRetryTurnstileLLM');
            if (retryBtn) {
                retryBtn.addEventListener('click', () => {
                    const freshToken = getTurnstileToken('suite-turnstile');
                    if (!freshToken && isTurnstileConfigured) {
                        showToast('請先完成上方 Step 2 的 Cloudflare 人機安全驗證！', 'warning');
                        return;
                    }
                    triggerLLMAnalysis(result, question);
                });
            }
            return;
        }

        aiContainer.innerHTML = '<div class="text-center py-4 text-muted" style="display:flex; align-items:center; justify-content:center; gap:8px;"><i data-lucide="loader-2" class="suite-spinner-icon" style="animation: spin 1s linear infinite;"></i> 正在邀請宗師依據納甲用神深度推演...</div>';
        refreshIcons();

        try {
            const resp = await fetch('/api/liuyao/llm-analysis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    result,
                    question,
                    'cf-turnstile-response': token || undefined,
                    turnstileToken: token || undefined
                })
            });
            const data = await resp.json();
            if (data.success && data.analysis) {
                renderAIAnalysis(data.analysis);
                if (typeof window !== 'undefined') {
                    window.conversationHistory = window.conversationHistory || [];
                    window.conversationHistory.push({ role: 'user', content: question || '六爻神卦排盤分析' });
                    window.conversationHistory.push({ role: 'assistant', content: data.analysis });
                    window.lastSuiteResult = { calculation: result, analysis: data.analysis };
                    if (typeof window.publishSuiteEmailResult === 'function') {
                        window.publishSuiteEmailResult('六爻神卦', result, `【${result.benGua?.name || '六爻卦'}】排盤解讀`);
                    }
                }
                // 當主解讀完成並展開追問時，初始化追問專用 Turnstile
                renderFollowupTurnstile();
            } else {
                aiContainer.innerHTML = `<div class="alert alert-warning">未能取得即時解讀：${escapeHtml(data.error || '服務暫忙，請稍後重試')}。已保留上述卦盤結構供您參詳。</div>`;
            }
        } catch (e) {
            aiContainer.innerHTML = `<div class="text-muted">解讀服務連線暫緩：${escapeHtml(e.message)}</div>`;
        } finally {
            resetTurnstile('suite-turnstile');
            refreshIcons();
        }
    }

    // 快捷操作列（複製卦象、Email 寄送、重新起卦）
    function initActionBar() {
        const copyBtn = document.getElementById('btnCopyLiuyao');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                const report = formatDivinationCopyText(latestDivinationResult, latestAiAnalysisText);
                copyTextWithFeedback(report, copyBtn);
            });
        }

        const emailBtn = document.getElementById('btnEmailLiuyao');
        if (emailBtn) {
            emailBtn.addEventListener('click', () => {
                const launcherBtn = document.getElementById('suiteResultEmailOpen');
                if (launcherBtn) {
                    launcherBtn.click();
                } else {
                    const dialog = document.getElementById('suiteResultEmailDialog');
                    if (dialog && typeof dialog.showModal === 'function') dialog.showModal();
                }
            });
        }

        const restartBtn = document.getElementById('btnRestartLiuyao');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                resetCoinToss();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }

        const copyAiBtn = document.getElementById('btnCopyAiAnalysis');
        if (copyAiBtn) {
            copyAiBtn.addEventListener('click', () => {
                if (latestAiAnalysisText) {
                    copyTextWithFeedback(latestAiAnalysisText, copyAiBtn);
                }
            });
        }
    }

    // 追問與對話互動（支援 Turnstile 防護）
    function initAIAnalysisControls() {
        const askBtn = document.getElementById('btnAskFollowup');
        const askInput = document.getElementById('followupQuestionInput');

        if (askBtn && askInput) {
            askBtn.addEventListener('click', async () => {
                const q = askInput.value.trim();
                if (!q) return;
                if (!latestDivinationResult) {
                    showToast('請先完成起卦後再送出追問', 'warning');
                    return;
                }

                const fuContainer = document.getElementById('suite-followup-turnstile');
                const isFuTurnstileConfigured = Boolean(fuContainer && fuContainer.getAttribute('data-sitekey'));
                const token = getTurnstileToken('suite-followup-turnstile');

                if (isFuTurnstileConfigured && !token) {
                    showToast('請先完成下方的人機安全驗證 (Cloudflare Turnstile) 後再送出追問！', 'warning');
                    document.getElementById('suiteFollowUpTurnstileWrapper')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    return;
                }

                askBtn.disabled = true;
                askBtn.textContent = '分析中...';

                try {
                    const resp = await fetch('/api/liuyao/llm-analysis', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            result: latestDivinationResult,
                            question: q,
                            conversationHistory: window.conversationHistory || [],
                            'cf-turnstile-response': token || undefined,
                            turnstileToken: token || undefined
                        })
                    });
                    const data = await resp.json();
                    if (data.success && data.analysis) {
                        const historyEl = document.getElementById('followupHistory');
                        if (historyEl) {
                            const newEntry = document.createElement('div');
                            newEntry.className = 'suite-message-bubble assistant markdown-body';
                            newEntry.style.marginTop = '14px';

                            const renderedAnswer = window.MarkdownRenderer && typeof window.MarkdownRenderer.render === 'function'
                                ? window.MarkdownRenderer.render(data.analysis)
                                : escapeHtml(data.analysis).replace(/\n/g, '<br>');

                            newEntry.innerHTML = `
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; border-bottom: 1px solid var(--suite-border); padding-bottom: 6px;">
                                    <span style="font-weight:700; color:var(--suite-primary, #b45309); display: inline-flex; align-items: center; gap: 4px;">
                                        <i data-lucide="help-circle"></i> 問：${escapeHtml(q)}
                                    </span>
                                    <button type="button" class="suite-copy-btn btn-copy-msg" title="複製此回答內容">
                                        <i data-lucide="copy"></i> 複製內容
                                    </button>
                                </div>
                                <div class="followup-answer-content">${renderedAnswer}</div>
                            `;

                            const copyMsgBtn = newEntry.querySelector('.btn-copy-msg');
                            if (copyMsgBtn) {
                                copyMsgBtn.addEventListener('click', () => {
                                    copyTextWithFeedback(data.analysis, copyMsgBtn);
                                });
                            }

                            historyEl.appendChild(newEntry);
                            askInput.value = '';
                        }
                        if (typeof window !== 'undefined') {
                            window.conversationHistory = window.conversationHistory || [];
                            window.conversationHistory.push({ role: 'user', content: q });
                            window.conversationHistory.push({ role: 'assistant', content: data.analysis });
                        }
                    } else {
                        showToast('未能獲取追問解讀：' + (data.error || '請稍後再試'), 'warning');
                    }
                } catch (e) {
                    showToast('追問失敗：' + e.message, 'error');
                } finally {
                    resetTurnstile('suite-followup-turnstile');
                    askBtn.disabled = false;
                    askBtn.innerHTML = '<i data-lucide="send"></i> 送出追問 ➔';
                    refreshIcons();
                }
            });
        }
    }

    function escapeHtml(str) {
        if (window.MarkdownRenderer && typeof window.MarkdownRenderer.escapeHtml === 'function') {
            return window.MarkdownRenderer.escapeHtml(str);
        }
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    if (typeof window !== 'undefined') {
        window.renderSuiteTurnstile = renderSuiteTurnstile;
        window.renderFollowupTurnstile = renderFollowupTurnstile;
        window.resetLiuyaoTurnstile = resetTurnstile;
        window.getLiuyaoTurnstileToken = getTurnstileToken;
    }
})();
