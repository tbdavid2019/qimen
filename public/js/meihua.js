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
        dongYaoTextEl.innerHTML = `<div style="margin-top: 8px; padding: 6px 10px; background: rgba(220,53,69,0.08); border-left: 3px solid #dc3545; border-radius: 3px;">
            <strong>爻辭：</strong>${dongYaoInfo.text || '動爻生變'}<br>
            <small style="color: var(--text-secondary);">${dongYaoInfo.vernacular || ''}</small>
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
}

function bindMeihuaEvents() {
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);

    async function requestQiguaData() {
        var mode = document.querySelector('input[name="timeMode"]:checked').value;
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

        var response = await fetch('/api/meihua/qigua', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                method: 'time',
                userDateTime: params.userDateTime,
                timestamp: params.timestamp,
                timezoneOffset: params.timezoneOffset
            })
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

        var response = await fetch('/api/meihua/qigua', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                method: 'number',
                num1: num1,
                num2: num2,
                num3: num3
            })
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

        var response = await fetch('/api/meihua/qigua', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                method: 'text',
                text: text,
                hour: new Date().getHours()
            })
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
            } catch (error) {
                alert(`起卦失敗: ${error.message}`);
            } finally {
                qiguaBtn.disabled = false;
                qiguaBtn.textContent = '起卦';
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
        });
    }

    var numberQiguaBtn = document.getElementById('numberQiguaBtn');
    if (numberQiguaBtn) {
        numberQiguaBtn.addEventListener('click', async function() {
            numberQiguaBtn.disabled = true;
            numberQiguaBtn.textContent = '起卦中...';

            try {
                await requestNumberQiguaData();
            } catch (error) {
                alert(`起卦失敗: ${error.message}`);
            } finally {
                numberQiguaBtn.disabled = false;
                numberQiguaBtn.textContent = '起卦';
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
            } catch (error) {
                alert(`起卦失敗: ${error.message}`);
            } finally {
                textQiguaBtn.disabled = false;
                textQiguaBtn.textContent = '報字起卦';
            }
        });
    }

    var askBtn = document.getElementById('meihuaAsk');
    if (askBtn) {
        askBtn.addEventListener('click', async function() {
            if (!window.enableLLM) {
                alert('AI 功能尚未開放，請先設定 LLM API Key');
                return;
            }

            if (!window.currentMeihuaData) {
                try {
                    await requestQiguaData();
                } catch (error) {
                    alert(`起卦失敗: ${error.message}`);
                    return;
                }
            }

            var questionInput = document.getElementById('meihuaQuestion');
            var question = questionInput.value.trim();
            if (!question) {
                alert('請輸入您的問題');
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
                        userQuestion: question,
                        conversationHistory: window.meihuaConversationHistory || [],
                        purpose: '綜合',
                        lang: 'zh-tw'
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
                } else {
                    alert(`AI 分析失敗: ${result.error || '未知錯誤'}`);
                }
            } catch (error) {
                alert(`AI 分析失敗: ${error.message}`);
            } finally {
                askBtn.disabled = false;
                askBtn.textContent = '🤖 大師解卦';
                document.getElementById('meihuaClear').disabled = false;
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
        });
    }

    if (!Array.isArray(window.meihuaConversationHistory)) {
        window.meihuaConversationHistory = [];
    }
    toggleMeihuaLLM(window.enableLLM);
}

document.addEventListener('DOMContentLoaded', bindMeihuaEvents);

function copyTextToClipboard(text, btn) {
    if (!text) return;
    function showSuccess() {
        if (btn) {
            var origHtml = btn.innerHTML;
            btn.innerHTML = '<i class="glyphicon glyphicon-ok" style="color:#10b981;"></i> 已複製！';
            setTimeout(function() {
                btn.innerHTML = origHtml;
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
            html += '<div style="display: inline-block; max-width: 85%; text-align: left;">';
            html += '  <div style="font-size: 11px; font-weight: 600; color: var(--claude-text-muted, #8C7E74); margin-bottom: 4px; text-align: right;">您問道</div>';
            html += `  <div class="conversation-bubble user-bubble" style="background: var(--claude-bg-subtle, #EFE9E0); color: var(--claude-text-main, #2C221E); padding: 10px 16px; border-radius: 16px 16px 4px 16px; font-size: 14.5px; line-height: 1.5; border: 1px solid var(--claude-border, #E8E0D6);">${MarkdownRenderer.escapeHtml(msg.content)}</div>`;
            html += '</div>';
            html += '</div>';
        } else {
            html += '<div class="conversation-msg assistant-msg" style="margin-bottom: 20px;">';
            html += '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">';
            html += '  <span style="display: inline-flex; align-items: center; gap: 4px; background: var(--claude-primary-gradient, linear-gradient(135deg, #D97757 0%, #C15F3D 100%)); color: #fff; padding: 3px 10px; border-radius: 6px; font-size: 12px; font-weight: 600;">🌸 梅花大師解卦</span>';
            html += `  <button type="button" class="btn btn-default btn-xs meihua-copy-btn" data-msg-idx="${index}" style="padding: 3px 10px; font-size: 12px; border-radius: 6px; color: var(--claude-primary, #CC6B49); background: var(--claude-card, #fff); border: 1px solid var(--claude-border, #E8E0D6);" title="複製解讀內容">`;
            html += '    <i class="glyphicon glyphicon-copy"></i> 複製內容';
            html += '  </button>';
            html += '</div>';
            html += `<div class="conversation-bubble assistant-bubble markdown-body" style="background: var(--claude-card, #fff); padding: 16px 20px; border-radius: 16px 16px 16px 4px; display: block; width: 100%; border: 1px solid var(--claude-border, #E8E0D6); box-shadow: var(--claude-shadow-xs, 0 1px 3px rgba(0,0,0,0.04)); color: var(--claude-text-body, #4A3F39); font-size: 14px; line-height: 1.6;">${MarkdownRenderer.render(msg.content)}</div>`;
            html += '</div>';
        }
    });
    history.innerHTML = html;
    history.style.display = 'block';
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
            status.textContent = 'AI 解卦功能尚未開放，請先設定 LLM API Key。';
        }
        if (askBtn) askBtn.disabled = true;
        if (clearBtn) clearBtn.disabled = true;
        if (questionInput) questionInput.disabled = true;
    } else {
        if (status) {
            status.textContent = '可針對本卦提出問題，AI 會結合卦辭與動爻提供建議。';
        }
        if (askBtn) askBtn.disabled = false;
        if (clearBtn) clearBtn.disabled = false;
        if (questionInput) questionInput.disabled = false;
    }
}
