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
}

function bindMeihuaEvents() {
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);

    var radios = document.querySelectorAll('input[name="timeMode"]');
    radios.forEach(function(radio) {
        radio.addEventListener('change', function() {
            toggleCustomTimeInput(this.value === 'custom');
        });
    });

    var qiguaBtn = document.getElementById('qiguaBtn');
    if (qiguaBtn) {
        qiguaBtn.addEventListener('click', async function() {
            var mode = document.querySelector('input[name="timeMode"]:checked').value;
            var params;

            if (mode === 'custom') {
                var customInput = document.getElementById('customDateTime').value;
                if (!customInput) {
                    alert('請選擇自定義時間');
                    return;
                }
                var customDate = new Date(customInput);
                if (Number.isNaN(customDate.getTime())) {
                    alert('時間格式無效');
                    return;
                }
                params = getLocalTimeParams(customDate);
            } else {
                params = getLocalTimeParams(new Date());
            }

            qiguaBtn.disabled = true;
            qiguaBtn.textContent = '起卦中...';

            try {
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
                if (result.success) {
                    updateResult(result.data);
                } else {
                    alert(`起卦失敗: ${result.error || '未知錯誤'}`);
                }
            } catch (error) {
                alert(`起卦失敗: ${error.message}`);
            } finally {
                qiguaBtn.disabled = false;
                qiguaBtn.textContent = '起卦';
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', bindMeihuaEvents);
