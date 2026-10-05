// public/js/meihua.js - 梅花易數前端互動邏輯 (Punchy & Prominent Ritual Flow)

// 浮動 Toast 通知工具 (取代阻斷式原生 alert)
function showToast(message, type) {
    type = type || 'warning';
    var container = document.getElementById('meihuaToastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'meihuaToastContainer';
        container.className = 'meihua-toast-container';
        document.body.appendChild(container);
    }
    var toast = document.createElement('div');
    toast.className = 'meihua-toast meihua-toast-' + type;

    var iconName = 'info';
    if (type === 'success') iconName = 'check-circle';
    else if (type === 'error') iconName = 'alert-triangle';
    else if (type === 'warning') iconName = 'alert-circle';

    toast.innerHTML = '<span class="toast-icon"><i data-lucide="' + iconName + '"></i></span><span class="toast-text">' + message + '</span>';
    container.appendChild(toast);

    if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
    }

    function removeToast() {
        if (!toast.classList.contains('closing')) {
            toast.classList.add('closing');
            setTimeout(function() {
                if (toast.parentNode) toast.parentNode.removeChild(toast);
            }, 250);
        }
    }
    toast.addEventListener('click', removeToast);
    setTimeout(removeToast, 4000);
}

function updateCurrentTime() {
    var now = new Date();
    var timeString = now.toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    var currentTimeEl = document.getElementById('currentTime');
    if (currentTimeEl) {
        currentTimeEl.textContent = timeString;
    }
}

function getLocalTimeParams(date) {
    var localDate = date || new Date();
    var year = localDate.getFullYear();
    var month = String(localDate.getMonth() + 1).padStart(2, '0');
    var day = String(localDate.getDate()).padStart(2, '0');
    var hours = String(localDate.getHours()).padStart(2, '0');
    var minutes = String(localDate.getMinutes()).padStart(2, '0');
    var seconds = String(localDate.getSeconds()).padStart(2, '0');
    var userDateTime = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;

    return {
        userDateTime: userDateTime,
        timestamp: localDate.getTime(),
        timezoneOffset: localDate.getTimezoneOffset()
    };
}

function toggleCustomTimeInput(show) {
    var customGroup = document.getElementById('customTimeGroup');
    if (!customGroup) {
        return;
    }
    customGroup.style.display = show ? 'block' : 'none';
}

function renderHexagramLines(containerId, binary, dongYao) {
    var container = document.getElementById(containerId);
    if (!container || !binary) {
        return;
    }
    container.innerHTML = '';

    for (var i = 5; i >= 0; i -= 1) {
        var line = document.createElement('div');
        line.className = 'meihua-yao-line';
        if (binary[i] === '0') {
            line.classList.add('meihua-yao-yin');
        }
        if (dongYao && 6 - i === dongYao) {
            line.classList.add('meihua-yao-changing');
        }
        container.appendChild(line);
    }
}

function updateResult(data) {
    var resultEl = document.getElementById('meihuaResult');
    if (!resultEl) return;
    resultEl.style.display = 'block';

    // 1. 本卦
    document.getElementById('benguaName').textContent = `${data.bengua.num} ${data.bengua.name}`;
    document.getElementById('benguaSymbol').textContent = `${data.bengua.upperGua.symbol} ${data.bengua.lowerGua.symbol}`;
    document.getElementById('benguaUpper').textContent = `${data.bengua.upperGua.name}（${data.bengua.upperGua.element} · ${data.bengua.upperGua.symbol}）`;
    document.getElementById('benguaLower').textContent = `${data.bengua.lowerGua.name}（${data.bengua.lowerGua.element} · ${data.bengua.lowerGua.symbol}）`;
    document.getElementById('benguaDongYao').textContent = `第 ${data.bengua.dongYao} 爻生變`;

    var dongYaoInfo = data.bengua.dongYaoInfo;
    var dongYaoTextEl = document.getElementById('benguaDongYaoText');
    if (dongYaoTextEl && dongYaoInfo) {
        dongYaoTextEl.innerHTML = `<div style="margin-top: 8px; padding: 8px 12px; background: rgba(225,29,72,0.08); border: 1px solid rgba(225,29,72,0.25); border-radius: 6px;">
            <strong>爻辭：</strong>${dongYaoInfo.text || '動爻生變'}<br>
            <small style="color: var(--suite-text-muted);">${dongYaoInfo.vernacular || ''}</small>
        </div>`;
    }

    // 2. 體用分析
    document.getElementById('tiGua').textContent = `${data.tigua.name} (${data.tigua.element})`;
    document.getElementById('yongGua').textContent = `${data.yonggua.name} (${data.yonggua.element})`;
    document.getElementById('wuxingRelation').textContent = data.wuxingRelation;
    document.getElementById('wuxingJudgement').textContent = data.wuxing?.judgement || '';
    document.getElementById('wuxingDetail').textContent = data.wuxing?.detail || '';

    var seasonalEl = document.getElementById('tiYongSeasonal');
    if (seasonalEl) {
        seasonalEl.textContent = `${data.wuxing?.tiStatus || ''} · ${data.wuxing?.yongStatus || ''}`;
    }

    // 3. 應期與計算說明
    var timingEl = document.getElementById('timingDesc');
    if (timingEl) {
        timingEl.textContent = data.timing?.timingDesc || '吉凶相扣，順應時勢而動。';
    }

    var methodDisplayEl = document.getElementById('calcMethodDisplay');
    var extraDetailEl = document.getElementById('calcExtraDetail');
    if (methodDisplayEl) {
        if (data.method === 'text') {
            methodDisplayEl.textContent = `漢字占「${data.text}」（總筆劃 ${data.totalStrokes}）`;
            if (extraDetailEl) extraDetailEl.textContent = `上卦餘數 ${data.calculations?.upperGua} / 下卦餘數 ${data.calculations?.lowerGua} / 動爻 ${data.calculations?.dongYao}`;
        } else if (data.method === 'numbers' || data.method === 'number') {
            methodDisplayEl.textContent = `三數起卦（${data.numbers?.num1}, ${data.numbers?.num2}, ${data.numbers?.num3}）`;
            if (extraDetailEl) extraDetailEl.textContent = `上卦 ${data.calculations?.upperGua} / 下卦 ${data.calculations?.lowerGua} / 動爻 ${data.calculations?.dongYao}`;
        } else {
            methodDisplayEl.textContent = `時間起卦（${data.lunar ? `${data.lunar.year}年${data.lunar.month}月${data.lunar.day}日 ${data.shichen?.name || ''}時` : '當前時間'}）`;
            if (extraDetailEl) extraDetailEl.textContent = `年數${data.calculations?.yearSum}+月${data.calculations?.month}+日${data.calculations?.day}+時${data.calculations?.shichenNum}`;
        }
    }

    // 4. 五卦全息（互、變、錯、綜）
    document.getElementById('huguaName').textContent = `${data.hugua.num} ${data.hugua.name}`;
    document.getElementById('bianguaName').textContent = `${data.biangua.num} ${data.biangua.name}`;
    if (data.cuogua) {
        var cuoEl = document.getElementById('cuoguaName');
        if (cuoEl) cuoEl.textContent = `${data.cuogua.num} ${data.cuogua.name}`;
    }
    if (data.zonggua) {
        var zongEl = document.getElementById('zongguaName');
        if (zongEl) zongEl.textContent = `${data.zonggua.num} ${data.zonggua.name}`;
    }

    renderHexagramLines('benguaLines', data.bengua.binary, data.bengua.dongYao);
    renderHexagramLines('huguaLines', data.hugua.binary, null);
    renderHexagramLines('bianguaLines', data.biangua.binary, null);
    if (data.cuogua) renderHexagramLines('cuoguaLines', data.cuogua.binary, null);
    if (data.zonggua) renderHexagramLines('zongguaLines', data.zonggua.binary, null);

    // 5. 卦辭與爻辭詳表
    var textPanel = document.getElementById('meihuaTexts');
    if (textPanel && data.texts && data.texts.bengua) {
        var benguaText = data.texts.bengua;
        document.getElementById('guaCiTitle').textContent = `本卦卦辭：${benguaText.num} ${benguaText.name}`;
        document.getElementById('guaCi').textContent = benguaText.guaCi || '';

        var tbody = document.getElementById('yaoCiTable');
        if (tbody && benguaText.yaoci) {
            tbody.innerHTML = '';
            benguaText.yaoci.forEach(function(item) {
                var row = document.createElement('tr');
                if (item.index === data.bengua.dongYao) {
                    row.className = 'warning';
                    row.style.fontWeight = 'bold';
                }
                var posCell = document.createElement('td');
                var textCell = document.createElement('td');
                var plainCell = document.createElement('td');

                posCell.textContent = item.position || `第${item.index}爻${item.index === data.bengua.dongYao ? ' (動爻)' : ''}`;
                textCell.textContent = item.text || '';
                plainCell.textContent = item.plain || '';

                row.appendChild(posCell);
                row.appendChild(textCell);
                row.appendChild(plainCell);
                tbody.appendChild(row);
            });
        }
        textPanel.style.display = 'block';
    }

    window.currentMeihuaData = data;

    // 平滑滾動到結果盤面
    resultEl.scrollIntoView({ behavior: 'smooth', block: 'start' });

    if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
    }
}

function bindMeihuaEvents() {
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);

    // 起卦模式頁籤切換
    var modeTabs = document.querySelectorAll('.meihua-tab-btn');
    modeTabs.forEach(function(tab) {
        tab.addEventListener('click', function() {
            var mode = this.getAttribute('data-mode');
            modeTabs.forEach(function(t) { t.classList.remove('active'); });
            this.classList.add('active');

            var timeSec = document.getElementById('modeTimeSection');
            var numSec = document.getElementById('modeNumberSection');
            var textSec = document.getElementById('modeTextSection');

            if (timeSec) timeSec.style.display = (mode === 'time') ? 'block' : 'none';
            if (numSec) numSec.style.display = (mode === 'number') ? 'block' : 'none';
            if (textSec) textSec.style.display = (mode === 'text') ? 'block' : 'none';

            if (window.lucide && typeof window.lucide.createIcons === 'function') {
                window.lucide.createIcons();
            }
        });
    });

    // 時間起卦單選膠囊樣式
    var timePills = document.querySelectorAll('.meihua-time-pill');
    timePills.forEach(function(pill) {
        pill.addEventListener('click', function() {
            timePills.forEach(function(p) { p.classList.remove('active'); });
            this.classList.add('active');
            var radio = this.querySelector('input[type="radio"]');
            if (radio) {
                radio.checked = true;
                toggleCustomTimeInput(radio.value === 'custom');
            }
        });
    });

    // 階段 1：占問焦點膠囊連動
    var categoryPills = document.querySelectorAll('#meihuaPillCluster .meihua-pill');
    categoryPills.forEach(function(pill) {
        pill.addEventListener('click', function() {
            categoryPills.forEach(function(p) { p.classList.remove('active'); });
            this.classList.add('active');
            var prompt = this.getAttribute('data-prompt');
            var qInput = document.getElementById('meihuaQuestion');
            if (qInput && prompt) {
                qInput.value = prompt;
                showToast('已代入占問焦點：「' + this.textContent.trim() + '」', 'success');
            }
        });
    });

    // 快捷操作列按鈕綁定
    var copyGuaBtn = document.getElementById('btnCopyMeihua');
    if (copyGuaBtn) {
        copyGuaBtn.addEventListener('click', function() {
            if (!window.currentMeihuaData) {
                showToast('尚未有起卦結果可供複製', 'warning');
                return;
            }
            var d = window.currentMeihuaData;
            var text = [
                '【梅花易數 · 五卦全息象義】',
                '起卦方式：' + (document.getElementById('calcMethodDisplay')?.textContent || ''),
                '本卦：' + d.bengua.num + ' ' + d.bengua.name + '（上' + d.bengua.upperGua.name + '下' + d.bengua.lowerGua.name + '）',
                '動爻：第 ' + d.bengua.dongYao + ' 爻生變',
                '體卦：' + d.tigua.name + '（' + d.tigua.element + '） ｜ 用卦：' + d.yonggua.name + '（' + d.yonggua.element + '）',
                '五行生剋：' + d.wuxingRelation + ' · ' + (d.wuxing?.judgement || ''),
                '應期指引：' + (d.timing?.timingDesc || ''),
                '互卦：' + d.hugua.num + ' ' + d.hugua.name + ' ｜ 變卦：' + d.biangua.num + ' ' + d.biangua.name,
                d.cuogua ? '錯卦：' + d.cuogua.num + ' ' + d.cuogua.name + ' ｜ 綜卦：' + d.zonggua.num + ' ' + d.zonggua.name : ''
            ].filter(Boolean).join('\n');
            copyTextToClipboard(text, copyGuaBtn);
            showToast('已複製梅花卦象推演結果！', 'success');
        });
    }

    var emailBtn = document.getElementById('btnEmailMeihua');
    if (emailBtn) {
        emailBtn.addEventListener('click', function() {
            var openBtn = document.getElementById('suiteResultEmailOpen');
            if (openBtn) {
                openBtn.click();
            } else {
                var dialog = document.getElementById('suiteResultEmailDialog');
                if (dialog && typeof dialog.showModal === 'function') dialog.showModal();
            }
        });
    }

    var restartBtn = document.getElementById('btnRestartMeihua');
    if (restartBtn) {
        restartBtn.addEventListener('click', function() {
            var mainCard = document.querySelector('.meihua-main-card');
            if (mainCard) {
                mainCard.scrollIntoView({ behavior: 'smooth' });
            }
            showToast('已重設，請虔心重新起卦', 'info');
        });
    }

    async function requestQiguaData() {
        var modeRadio = document.querySelector('input[name="timeMode"]:checked');
        var mode = modeRadio ? modeRadio.value : 'current';
        var params;

        if (mode === 'custom') {
            var customInput = document.getElementById('customDateTime').value;
            if (!customInput) {
                throw new Error('請選擇自定義時間');
            }
            var customDate = new Date(customInput);
            if (Number.isNaN(customDate.getTime())) {
                throw new Error('時間格式無效');
            }
            params = getLocalTimeParams(customDate);
        } else {
            params = getLocalTimeParams(new Date());
        }

        var input = {
            method: 'time',
            userDateTime: params.userDateTime,
            timestamp: params.timestamp,
            timezoneOffset: params.timezoneOffset
        };
        window.currentMeihuaInput = input;
        var response = await fetch('/api/meihua/qigua', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(input)
        });

        var result = await response.json();
        if (!result.success) {
            throw new Error(result.error || '未知錯誤');
        }

        updateResult(result.data);
        toggleMeihuaLLM(true);
        return result.data;
    }

    function parseNumberInput(id) {
        var value = document.getElementById(id).value;
        var parsed = Number.parseInt(value, 10);
        if (!Number.isInteger(parsed)) {
            throw new Error('請輸入 1 到 100 的整數');
        }
        if (parsed < 1 || parsed > 100) {
            throw new Error('數字範圍需在 1 到 100');
        }
        return parsed;
    }

    async function requestNumberQiguaData() {
        var num1 = parseNumberInput('meihuaNum1');
        var num2 = parseNumberInput('meihuaNum2');
        var num3 = parseNumberInput('meihuaNum3');

        var input = { method: 'number', num1: num1, num2: num2, num3: num3 };
        window.currentMeihuaInput = input;
        var response = await fetch('/api/meihua/qigua', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(input)
        });

        var result = await response.json();
        if (!result.success) {
            throw new Error(result.error || '未知錯誤');
        }

        updateResult(result.data);
        toggleMeihuaLLM(true);
        return result.data;
    }

    async function requestTextQiguaData() {
        var textInput = document.getElementById('meihuaText');
        var text = textInput ? textInput.value.trim() : '';
        if (!text) {
            throw new Error('請輸入占測文字或詞語');
        }

        var input = { method: 'text', text: text, hour: new Date().getHours() };
        window.currentMeihuaInput = input;
        var response = await fetch('/api/meihua/qigua', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(input)
        });

        var result = await response.json();
        if (!result.success) {
            throw new Error(result.error || '未知錯誤');
        }

        updateResult(result.data);
        toggleMeihuaLLM(true);
        return result.data;
    }

    var radios = document.querySelectorAll('input[name="timeMode"]');
    radios.forEach(function(radio) {
        radio.addEventListener('change', function() {
            toggleCustomTimeInput(this.value === 'custom');
        });
    });

    var qiguaBtn = document.getElementById('qiguaBtn');
    if (qiguaBtn) {
        qiguaBtn.addEventListener('click', async function() {
            qiguaBtn.disabled = true;
            qiguaBtn.textContent = '起卦中...';

            try {
                await requestQiguaData();
                showToast('起卦成功！五卦全息推演已完成。', 'success');
            } catch (error) {
                showToast(`起卦失敗: ${error.message}`, 'error');
            } finally {
                qiguaBtn.disabled = false;
                qiguaBtn.innerHTML = '<i data-lucide="sparkles"></i> 感應時空起卦 ➔';
                if (window.lucide && typeof window.lucide.createIcons === 'function') {
                    window.lucide.createIcons();
                }
            }
        });
    }

    var diceBtn = document.getElementById('meihuaDice');
    if (diceBtn) {
        diceBtn.addEventListener('click', function() {
            var num1 = Math.floor(Math.random() * 100) + 1;
            var num2 = Math.floor(Math.random() * 100) + 1;
            var num3 = Math.floor(Math.random() * 100) + 1;
            document.getElementById('meihuaNum1').value = num1;
            document.getElementById('meihuaNum2').value = num2;
            document.getElementById('meihuaNum3').value = num3;
            showToast('已隨機生成三數：' + num1 + ', ' + num2 + ', ' + num3, 'info');
        });
    }

    var numberQiguaBtn = document.getElementById('numberQiguaBtn');
    if (numberQiguaBtn) {
        numberQiguaBtn.addEventListener('click', async function() {
            numberQiguaBtn.disabled = true;
            numberQiguaBtn.textContent = '起卦中...';

            try {
                await requestNumberQiguaData();
                showToast('起卦成功！五卦全息推演已完成。', 'success');
            } catch (error) {
                showToast(`起卦失敗: ${error.message}`, 'error');
            } finally {
                numberQiguaBtn.disabled = false;
                numberQiguaBtn.innerHTML = '<i data-lucide="sparkles"></i> 數字起卦 ➔';
                if (window.lucide && typeof window.lucide.createIcons === 'function') {
                    window.lucide.createIcons();
                }
            }
        });
    }

    var textQiguaBtn = document.getElementById('textQiguaBtn');
    if (textQiguaBtn) {
        textQiguaBtn.addEventListener('click', async function() {
            textQiguaBtn.disabled = true;
            textQiguaBtn.textContent = '起卦中...';

            try {
                await requestTextQiguaData();
                showToast('起卦成功！五卦全息推演已完成。', 'success');
            } catch (error) {
                showToast(`起卦失敗: ${error.message}`, 'error');
            } finally {
                textQiguaBtn.disabled = false;
                textQiguaBtn.innerHTML = '<i data-lucide="type"></i> 報字起卦 ➔';
                if (window.lucide && typeof window.lucide.createIcons === 'function') {
                    window.lucide.createIcons();
                }
            }
        });
    }

    var askBtn = document.getElementById('meihuaAsk');
    // 梅花解卦 Cloudflare Turnstile 人機驗證
    var meihuaTurnstileWidgetId = null;
    var currentMeihuaTurnstileToken = '';
    var meihuaTurnstileRenderRetries = 0;

    function loadTurnstileScript(callback) {
        if (typeof window.turnstile !== 'undefined' && typeof window.turnstile.render === 'function') {
            return callback(null);
        }
        var existing = document.querySelector('script[src*="challenges.cloudflare.com/turnstile"]');
        if (existing) {
            existing.addEventListener('load', function() { callback(null); });
            existing.addEventListener('error', function(err) { callback(err || new Error('Turnstile script failed to load')); });
            return;
        }
        var script = document.createElement('script');
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.async = true;
        script.defer = true;
        script.onload = function() { callback(null); };
        script.onerror = function(err) { callback(err || new Error('Turnstile script failed to load')); };
        document.head.appendChild(script);
    }

    function renderMeihuaTurnstile() {
        var container = document.getElementById('meihua-turnstile');
        if (!container) return;
        var sitekey = container.getAttribute('data-sitekey');
        if (!sitekey) return;

        loadTurnstileScript(function(err) {
            if (err) {
                console.warn('[Turnstile] Meihua widget failed to load:', err);
                return;
            }
            if (!window.turnstile || typeof window.turnstile.render !== 'function') {
                if (meihuaTurnstileRenderRetries < 20) {
                    meihuaTurnstileRenderRetries++;
                    setTimeout(renderMeihuaTurnstile, 250);
                }
                return;
            }
            meihuaTurnstileRenderRetries = 0;
            if (meihuaTurnstileWidgetId === null) {
                try {
                    var action = container.getAttribute('data-action') || 'llm_analysis';
                    meihuaTurnstileWidgetId = window.turnstile.render(container, {
                        sitekey: sitekey,
                        action: action,
                        theme: 'auto',
                        size: 'flexible',
                        callback: function(token) {
                            currentMeihuaTurnstileToken = token;
                        },
                        'expired-callback': function() {
                            currentMeihuaTurnstileToken = '';
                        },
                        'error-callback': function() {
                            currentMeihuaTurnstileToken = '';
                        }
                    });
                    window.meihuaTurnstileWidgetId = meihuaTurnstileWidgetId;
                } catch (e) {
                    console.warn('[Turnstile] Meihua render error:', e);
                }
            }
        });
    }

    function resetMeihuaTurnstile() {
        currentMeihuaTurnstileToken = '';
        if (window.turnstile && typeof window.turnstile.reset === 'function') {
            try {
                if (meihuaTurnstileWidgetId !== null) {
                    window.turnstile.reset(meihuaTurnstileWidgetId);
                } else {
                    var container = document.getElementById('meihua-turnstile');
                    if (container) window.turnstile.reset(container);
                }
            } catch (e) {}
        }
    }
    window.resetMeihuaTurnstile = resetMeihuaTurnstile;

    renderMeihuaTurnstile();

    if (askBtn) {
        askBtn.addEventListener('click', async function() {
            if (!window.enableLLM) {
                showToast('解讀功能尚未開放，請先完成服務設定', 'warning');
                return;
            }

            if (!window.currentMeihuaData) {
                try {
                    await requestQiguaData();
                } catch (error) {
                    showToast(`起卦失敗: ${error.message}`, 'error');
                    return;
                }
            }

            var questionInput = document.getElementById('meihuaQuestion');
            var question = questionInput.value.trim();
            if (!question) {
                showToast('請輸入您的問題', 'warning');
                return;
            }

            // 驗證 Turnstile 人機驗證 (若前端有渲染且啟用)
            var container = document.getElementById('meihua-turnstile');
            var mToken = currentMeihuaTurnstileToken;
            if (!mToken && window.turnstile && meihuaTurnstileWidgetId !== null) {
                try {
                    mToken = window.turnstile.getResponse(meihuaTurnstileWidgetId);
                } catch (e) {}
            }
            if (!mToken && container && container.getAttribute('data-sitekey')) {
                showToast('請先勾選並完成下方的人機安全驗證 (Cloudflare Turnstile) 後再點擊梅花解卦！', 'warning');
                return;
            }

            askBtn.disabled = true;
            askBtn.textContent = '分析中...';
            document.getElementById('meihuaClear').disabled = true;

            try {
                var response = await fetch('/api/meihua/llm-analysis', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        meihuaData: window.currentMeihuaData,
                        qiguaInput: window.currentMeihuaInput || null,
                        userQuestion: question,
                        conversationHistory: window.meihuaConversationHistory || [],
                        purpose: '綜合',
                        lang: 'zh-tw',
                        'cf-turnstile-response': mToken || undefined,
                        turnstileToken: mToken || undefined
                    })
                });

                var result = await response.json();
                if (result.success) {
                    if (!Array.isArray(window.meihuaConversationHistory)) {
                        window.meihuaConversationHistory = [];
                    }
                    window.meihuaConversationHistory.push({ role: 'user', content: question });
                    window.meihuaConversationHistory.push({ role: 'assistant', content: result.analysis });
                    renderMeihuaConversation();
                    questionInput.value = '';
                    showToast('宗師解卦完成！', 'success');
                } else {
                    showToast(`解讀失敗: ${result.error || result.message || '未知錯誤'}`, 'error');
                }
            } catch (error) {
                showToast(`解讀失敗: ${error.message}`, 'error');
            } finally {
                resetMeihuaTurnstile();
                askBtn.disabled = false;
                askBtn.innerHTML = '<i data-lucide="sparkles"></i> 🌸 梅花解卦 ➔';
                document.getElementById('meihuaClear').disabled = false;
                if (window.lucide && typeof window.lucide.createIcons === 'function') {
                    window.lucide.createIcons();
                }
            }
        });
    }

    var clearBtn = document.getElementById('meihuaClear');
    if (clearBtn) {
        clearBtn.addEventListener('click', function() {
            if (!confirm('確定要清除對話記錄嗎？')) {
                return;
            }
            window.meihuaConversationHistory = [];
            renderMeihuaConversation();
            showToast('已清除對話記錄', 'info');
        });
    }

    if (!Array.isArray(window.meihuaConversationHistory)) {
        window.meihuaConversationHistory = [];
    }
    toggleMeihuaLLM(window.enableLLM);

    if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
    }
}

document.addEventListener('DOMContentLoaded', bindMeihuaEvents);

function copyTextToClipboard(text, btn) {
    if (!text) return;
    function showSuccess() {
        if (btn) {
            var origHtml = btn.innerHTML;
            btn.innerHTML = '<i data-lucide="check" style="color:#10b981;"></i> 已複製！';
            if (window.lucide && typeof window.lucide.createIcons === 'function') {
                window.lucide.createIcons();
            }
            setTimeout(function() {
                btn.innerHTML = origHtml;
                if (window.lucide && typeof window.lucide.createIcons === 'function') {
                    window.lucide.createIcons();
                }
            }, 2000);
        }
    }
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(showSuccess).catch(function() {
            fallbackCopy(text);
            showSuccess();
        });
    } else {
        fallbackCopy(text);
        showSuccess();
    }
}

function fallbackCopy(text) {
    var textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
        document.execCommand('copy');
    } catch (err) {
        console.error('Fallback copy failed', err);
    }
    document.body.removeChild(textArea);
}

document.addEventListener('click', function(e) {
    var btn = e.target.closest('.meihua-copy-btn');
    if (btn) {
        var idx = parseInt(btn.getAttribute('data-msg-idx'), 10);
        var msgs = window.meihuaConversationHistory || [];
        if (!isNaN(idx) && msgs[idx]) {
            copyTextToClipboard(msgs[idx].content, btn);
        }
    }
});

function renderMeihuaConversation() {
    var history = document.getElementById('meihuaConversation');
    if (!history) {
        return;
    }

    var messages = window.meihuaConversationHistory || [];
    if (messages.length === 0) {
        history.style.display = 'none';
        history.innerHTML = '';
        return;
    }

    var html = '';
    messages.forEach(function(msg, index) {
        if (msg.role === 'user') {
            html += '<div class="conversation-msg user-msg" style="margin-bottom: 16px; text-align: right;">';
            html += '<div class="conversation-user-wrap">';
            html += '  <div class="conversation-msg-label">您問道</div>';
            html += `  <div class="conversation-bubble user-bubble conversation-user-bubble">${MarkdownRenderer.escapeHtml(msg.content)}</div>`;
            html += '</div>';
            html += '</div>';
        } else {
            html += '<div class="conversation-msg assistant-msg" style="margin-bottom: 20px;">';
            html += '<div class="conversation-msg-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">';
            html += '  <span class="conversation-result-label" style="font-weight:700; color:#e11d48;"><i data-lucide="sparkles"></i> 🌸 梅花解卦</span>';
            html += `  <button type="button" class="btn btn-default btn-xs meihua-copy-btn conversation-copy-button" data-msg-idx="${index}" title="複製解讀內容">`;
            html += '    <i data-lucide="copy"></i> 複製內容';
            html += '  </button>';
            html += '</div>';
            html += `<div class="conversation-bubble assistant-bubble markdown-body conversation-answer">${MarkdownRenderer.render(msg.content)}</div>`;
            html += '</div>';
        }
    });
    history.innerHTML = html;
    history.style.display = 'block';
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
    }
    history.scrollTop = history.scrollHeight;
}

function toggleMeihuaLLM(enabled) {
    var section = document.getElementById('meihuaLLMSection');
    if (!section) {
        return;
    }

    var status = section.querySelector('.meihua-llm-status');
    var askBtn = document.getElementById('meihuaAsk');
    var clearBtn = document.getElementById('meihuaClear');
    var questionInput = document.getElementById('meihuaQuestion');

    if (!enabled) {
        if (status) {
            status.textContent = '解卦功能尚未開放，請先完成服務設定。';
        }
        if (askBtn) askBtn.disabled = true;
        if (clearBtn) clearBtn.disabled = true;
        if (questionInput) questionInput.disabled = true;
    } else {
        if (status) {
            status.textContent = '結合體用生剋、本變互綜全息盤與周易動爻辭，直面提問，提供理性指引與實踐建議。';
        }
        if (askBtn) askBtn.disabled = false;
        if (clearBtn) clearBtn.disabled = false;
        if (questionInput) questionInput.disabled = false;
    }
}
