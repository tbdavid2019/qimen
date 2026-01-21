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
    if (!container) {
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
    document.getElementById('meihuaResult').style.display = 'block';

    document.getElementById('benguaName').textContent = `${data.bengua.num} ${data.bengua.name}`;
    document.getElementById('benguaSymbol').textContent = `${data.bengua.upperGua.symbol} ${data.bengua.lowerGua.symbol}`;
    document.getElementById('benguaUpper').textContent = `${data.bengua.upperGua.name} ${data.bengua.upperGua.symbol}`;
    document.getElementById('benguaLower').textContent = `${data.bengua.lowerGua.name} ${data.bengua.lowerGua.symbol}`;
    document.getElementById('benguaDongYao').textContent = `第${data.bengua.dongYao}爻`;
    document.getElementById('benguaBinary').textContent = data.bengua.binary;

    document.getElementById('tiGua').textContent = `${data.tigua.name} (${data.tigua.element})`;
    document.getElementById('yongGua').textContent = `${data.yonggua.name} (${data.yonggua.element})`;
    document.getElementById('wuxingRelation').textContent = data.wuxingRelation;
    document.getElementById('wuxingJudgement').textContent = data.wuxing?.judgement || '';
    document.getElementById('wuxingDetail').textContent = data.wuxing?.detail || '';

    document.getElementById('huguaName').textContent = `${data.hugua.num} ${data.hugua.name}`;
    document.getElementById('bianguaName').textContent = `${data.biangua.num} ${data.biangua.name}`;

    renderHexagramLines('benguaLines', data.bengua.binary, data.bengua.dongYao);
    renderHexagramLines('huguaLines', data.hugua.binary, null);
    renderHexagramLines('bianguaLines', data.biangua.binary, null);

    if (data.calculations) {
        document.getElementById('calcYearSum').textContent = data.calculations.yearSum;
        document.getElementById('calcMonth').textContent = data.calculations.month;
        document.getElementById('calcDay').textContent = data.calculations.day;
        document.getElementById('calcShichen').textContent = `${data.shichen.name} (${data.calculations.shichenNum})`;
        document.getElementById('calcUpper').textContent = `${data.calculations.upperSum} mod 8 = ${data.calculations.upperGua}`;
        document.getElementById('calcLower').textContent = `${data.calculations.lowerSum} mod 8 = ${data.calculations.lowerGua}`;
        document.getElementById('calcDongYao').textContent = `${data.calculations.lowerSum} mod 6 = ${data.calculations.dongYao}`;
    }

    var textPanel = document.getElementById('meihuaTexts');
    if (textPanel && data.texts && data.texts.bengua) {
        var benguaText = data.texts.bengua;
        document.getElementById('guaCiTitle').textContent = `本卦：${benguaText.num} ${benguaText.name}`;
        document.getElementById('guaCi').textContent = benguaText.guaCi || '';

        var tbody = document.getElementById('yaoCiTable');
        tbody.innerHTML = '';
        benguaText.yaoci.forEach(function(item) {
            var row = document.createElement('tr');
            var posCell = document.createElement('td');
            var textCell = document.createElement('td');
            var plainCell = document.createElement('td');

            posCell.textContent = item.position || `第${item.index}爻`;
            textCell.textContent = item.text || '';
            plainCell.textContent = item.plain || '';

            row.appendChild(posCell);
            row.appendChild(textCell);
            row.appendChild(plainCell);
            tbody.appendChild(row);
        });

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
                askBtn.textContent = 'AI 大師解卦';
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
    messages.forEach(function(msg) {
        if (msg.role === 'user') {
            html += '<div class="conversation-msg user-msg">';
            html += '<span class="label label-primary">您</span> ';
            html += `<div class="conversation-bubble user-bubble">${escapeHtml(msg.content)}</div>`;
            html += '</div>';
        } else {
            html += '<div class="conversation-msg assistant-msg">';
            html += '<span class="label label-success">AI 大師</span><br>';
            html += `<div class="conversation-bubble assistant-bubble markdown-body">${parseMarkdown(msg.content)}</div>`;
            html += '</div>';
        }
    });
    history.innerHTML = html;
    history.style.display = 'block';
    history.scrollTop = history.scrollHeight;
}

function escapeHtml(text) {
    return String(text || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function parseMarkdown(text) {
    var escaped = escapeHtml(text);
    var codeBlocks = [];

    escaped = escaped.replace(/```([\s\S]*?)```/g, function(match, code) {
        var index = codeBlocks.length;
        codeBlocks.push(code);
        return `@@CODEBLOCK_${index}@@`;
    });

    var lines = escaped.split(/\r?\n/);
    var htmlLines = [];
    var inList = false;
    var listType = null;

    function closeList() {
        if (inList) {
            htmlLines.push(listType === 'ol' ? '</ol>' : '</ul>');
            inList = false;
            listType = null;
        }
    }

    lines.forEach(function(line) {
        if (!line.trim()) {
            closeList();
            htmlLines.push('<br>');
            return;
        }

        var headingMatch = line.match(/^(#{1,4})\s+(.*)$/);
        if (headingMatch) {
            closeList();
            var level = headingMatch[1].length;
            htmlLines.push(`<h${level}>${inlineMarkdown(headingMatch[2])}</h${level}>`);
            return;
        }

        var olMatch = line.match(/^\s*\d+\.\s+(.*)$/);
        if (olMatch) {
            if (!inList || listType !== 'ol') {
                closeList();
                inList = true;
                listType = 'ol';
                htmlLines.push('<ol>');
            }
            htmlLines.push(`<li>${inlineMarkdown(olMatch[1])}</li>`);
            return;
        }

        var ulMatch = line.match(/^\s*[-*]\s+(.*)$/);
        if (ulMatch) {
            if (!inList || listType !== 'ul') {
                closeList();
                inList = true;
                listType = 'ul';
                htmlLines.push('<ul>');
            }
            htmlLines.push(`<li>${inlineMarkdown(ulMatch[1])}</li>`);
            return;
        }

        closeList();
        htmlLines.push(`<p>${inlineMarkdown(line)}</p>`);
    });

    closeList();

    var html = htmlLines.join('');
    html = html.replace(/@@CODEBLOCK_(\d+)@@/g, function(match, index) {
        var code = codeBlocks[Number(index)] || '';
        return `<pre><code>${code}</code></pre>`;
    });

    return html;
}

function inlineMarkdown(text) {
    var output = text;
    output = output.replace(/`([^`]+)`/g, '<code>$1</code>');
    output = output.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    output = output.replace(/__([^_]+)__/g, '<strong>$1</strong>');
    output = output.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    output = output.replace(/_([^_]+)_/g, '<em>$1</em>');
    return output;
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
