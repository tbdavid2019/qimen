$(document).ready(function() {
    // 檢查是否需要用本地時間重新載入頁面
    if (!ensureTimezoneParams()) {
        // 只有在不需要重新載入時才繼續執行
        
        // 顯示時區調試信息
        displayTimezoneDebugInfo();
        
        // 頁面載入時檢查URL參數並設置正確的模式
        const urlParams = new URLSearchParams(window.location.search);
        // 預設為進階模式，只有明確指定時才切換回傳統模式
        const currentMode = urlParams.get('timePrecisionMode') || 'advanced';
        // 初始化模式顯示
        initializeTimePrecisionMode(currentMode);
    }
    
    // 初始化函數
    function initializeTimePrecisionMode(mode) {
        if (mode === 'advanced') {
            $('#traditionalModeBtn').removeClass('active');
            $('#advancedModeBtn').addClass('active');
            var radioBtn = $('input[name="timeMode"][value="advanced"]');
            radioBtn.data('programmatic', true).prop('checked', true);
            $('#advancedModeInfo').show();
            $('#timePrecision').text('進階模式');
            updateTimePrecisionDisplay(mode);
        } else {
            $('#traditionalModeBtn').addClass('active');
            $('#advancedModeBtn').removeClass('active');
            var radioBtn = $('input[name="timeMode"][value="traditional"]');
            radioBtn.data('programmatic', true).prop('checked', true);
            $('#advancedModeInfo').hide();
            $('#timePrecision').text('傳統模式');
            $('#timeSegmentInfo').hide();
        }
    }

    // 自定义排盘表单提交
    $('#submitCustomPan').click(function() {
        $('#customPanForm').submit();
    });

    // 高對比度模式切換
    $('#contrastToggle').click(function() {
        $('body').toggleClass('high-contrast-mode');
        $(this).toggleClass('active');
        
        // 保存用戶偏好設定到 localStorage
        const isHighContrast = $('body').hasClass('high-contrast-mode');
        localStorage.setItem('highContrastMode', isHighContrast);
        
        if (isHighContrast) {
            $(this).html('<i class="glyphicon glyphicon-adjust"></i> 標準');
            $(this).attr('title', '切換回標準模式');
        } else {
            $(this).html('<i class="glyphicon glyphicon-adjust"></i> 高對比');
            $(this).attr('title', '切換高對比度模式 (適合色弱用戶)');
        }
    });

    // 載入用戶的高對比度偏好設定
    function loadHighContrastPreference() {
        const isHighContrast = localStorage.getItem('highContrastMode') === 'true';
        if (isHighContrast) {
            $('body').addClass('high-contrast-mode');
            $('#contrastToggle').addClass('active')
                .html('<i class="glyphicon glyphicon-adjust"></i> 標準')
                .attr('title', '切換回標準模式');
        }
    }

    // 初始化高對比度設定
    loadHighContrastPreference();

    // 統一的模式切換處理函數
    function switchTimePrecisionMode(mode) {
        if (mode === 'advanced') {
            $('#traditionalModeBtn').removeClass('active');
            $('#advancedModeBtn').addClass('active');
            $('#advancedModeInfo').show();
            $('#timePrecision').text('進階模式');
            updateTimePrecisionDisplay(mode);
        } else {
            $('#traditionalModeBtn').addClass('active');
            $('#advancedModeBtn').removeClass('active');
            $('#advancedModeInfo').hide();
            $('#timePrecision').text('傳統模式');
            $('#timeSegmentInfo').hide();
        }
        
        // 重新計算排盤
        reloadWithTimePrecision(mode);
    }

    // 時間精度模式切換 - radio button change事件
    $('input[name="timeMode"]').change(function() {
        // 如果是程式設定的，不要重複觸發
        if ($(this).data('programmatic')) {
            $(this).removeData('programmatic');
            return;
        }
        var selectedMode = $(this).val();
        switchTimePrecisionMode(selectedMode);
    });

    // 模式按鈕點擊事件 - 直接處理按鈕點擊
    $('#traditionalModeBtn').click(function(e) {
        e.preventDefault();
        if (!$(this).hasClass('active')) {
            var radioBtn = $('input[name="timeMode"][value="traditional"]');
            radioBtn.data('programmatic', true).prop('checked', true);
            switchTimePrecisionMode('traditional');
        }
    });
    
    $('#advancedModeBtn').click(function(e) {
        e.preventDefault();
        if (!$(this).hasClass('active')) {
            var radioBtn = $('input[name="timeMode"][value="advanced"]');
            radioBtn.data('programmatic', true).prop('checked', true);
            switchTimePrecisionMode('advanced');
        }
    });

    // 根據時間精度模式重新載入頁面
    function reloadWithTimePrecision(mode) {
        var currentUrl = new URL(window.location.href);
        
        // 確保包含最新的時區信息
        const now = new Date();
        const timestamp = now.getTime();
        const timezoneOffset = now.getTimezoneOffset();
        
        // 建立本地時間字串
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const userDateTime = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
        
        if (mode === 'advanced') {
            // 進階模式為預設，保持 URL 簡潔
            currentUrl.searchParams.delete('timePrecisionMode');
        } else {
            // 傳統模式時顯式帶上參數
            currentUrl.searchParams.set('timePrecisionMode', mode);
        }
        
        // 更新時區參數
        currentUrl.searchParams.set('userDateTime', userDateTime);
        currentUrl.searchParams.set('timestamp', timestamp.toString());
        currentUrl.searchParams.set('timezoneOffset', timezoneOffset.toString());
        
        // 移除 fromMeditation 參數（如果存在）
        currentUrl.searchParams.delete('fromMeditation');
        
        console.log('切換模式並更新時區參數:', mode);
        window.location.href = currentUrl.toString();
    }

    // 更新時間精度顯示
    function updateTimePrecisionDisplay(mode) {
        if (mode === 'advanced' && window.qimenData && window.qimenData.timePrecision) {
            var timeInfo = window.qimenData.timePrecision;
            $('#timeSegmentInfo').html(
                ' - 第 ' + timeInfo.segment + ' 段 (' + 
                timeInfo.segmentTime + ')'
            ).show();
        }
    }

    // 確保九宮格始終保持正方形比例
    function maintainAspectRatio() {
        var gridWidth = $('.pan-grid').width();
        $('.gong').css('height', gridWidth / 3 + 'px');
    }

    maintainAspectRatio();
    $(window).resize(maintainAspectRatio);

    // AI 解盤主要功能
    $('#startLLMAnalysis').click(function() {
        performLLMAnalysis();
    });

    // 重新解盤
    $('#reAnalyzeButton').click(function() {
        performLLMAnalysis();
    });

    // 重試解盤
    $('#retryLLMAnalysis').click(function() {
        performLLMAnalysis();
    });

    // 執行 LLM 解盤的核心函數
    function performLLMAnalysis() {
        // 隱藏所有面板
        $('#llmInitialPanel, #llmResultPanel, #llmErrorPanel').hide();
        
        // 顯示載入狀態
        $('#llmLoadingPanel').show();

        // 準備奇門數據
        var qimenData = window.qimenData || {};

        // 發送請求到 LLM API
        $.ajax({
            url: '/api/llm-analysis',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                qimenData: qimenData,
                userQuestion: '',
                purpose: '綜合',
                lang: $('html').attr('lang') || 'zh-tw'
            }),
            success: function(response) {
                $('#llmLoadingPanel').hide();
                
                if (response.success) {
                    // 顯示成功結果
                    var cleanContent = response.analysis
                        .replace(/<[^>]*>/g, '')  // 移除 HTML 標籤
                        .replace(/\n/g, '<br>');  // 轉換換行為 <br>
                    
                    $('#llmAnalysisContent').html(cleanContent);
                    $('#llmTimestamp').text('解盤時間：' + new Date().toLocaleString('zh-TW'));
                    
                    if (response.provider && response.model) {
                        $('#llmProviderInfo').text(response.provider + ' / ' + response.model);
                    }
                    
                    $('#llmResultPanel').show();
                } else {
                    // 顯示錯誤狀態
                    var fallbackContent = (response.fallback || '請稍後再試。')
                        .replace(/<[^>]*>/g, '')
                        .replace(/\n/g, '<br>');
                    $('#llmErrorContent').html(fallbackContent);
                    $('#llmErrorPanel').show();
                }
            },
            error: function(xhr, status, error) {
                $('#llmLoadingPanel').hide();
                $('#llmErrorContent').html('網路錯誤：' + error);
                $('#llmErrorPanel').show();
            }
        });
    }

    // LLM 問答功能
    $('#askLLMQuestion').click(function() {
        var question = $('#userQuestion').val().trim();
        if (!question) {
            alert('請輸入您的問題');
            return;
        }

        var $button = $(this);
        var $responseDiv = $('#llmQuestionResponse');
        var $responseContent = $responseDiv.find('.response-content');
        var $responseTime = $responseDiv.find('.response-time');

        // 顯示載入狀態
        $button.prop('disabled', true).html('<i class="glyphicon glyphicon-refresh glyphicon-refresh-animate"></i> 分析中...');
        $responseDiv.show();
        $responseContent.html('<i class="glyphicon glyphicon-refresh glyphicon-refresh-animate"></i> AI 大師正在思考您的問題...');

        // 準備奇門數據（從頁面獲取）
        var qimenData = window.qimenData || {};

        // 發送請求到 LLM API
        $.ajax({
            url: '/api/llm-analysis',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                qimenData: qimenData,
                userQuestion: question,
                purpose: '綜合',
                lang: $('html').attr('lang') || 'zh-tw'
            }),
            success: function(response) {
                if (response.success) {
                    // 清理任何可能的 HTML 標籤，然後轉換換行
                    var cleanContent = response.analysis
                        .replace(/<[^>]*>/g, '')  // 移除 HTML 標籤
                        .replace(/\n/g, '<br>');  // 轉換換行為 <br>
                    $responseContent.html(cleanContent);
                    $responseTime.text('回答時間：' + new Date().toLocaleString('zh-TW'));
                } else {
                    var fallbackContent = (response.fallback || '請稍後再試。')
                        .replace(/<[^>]*>/g, '')
                        .replace(/\n/g, '<br>');
                    $responseContent.html('<div class="alert alert-warning">抱歉，AI 暫時無法回答您的問題。<br>' + 
                                        fallbackContent + '</div>');
                }
            },
            error: function(xhr, status, error) {
                $responseContent.html('<div class="alert alert-danger">網路錯誤，請稍後再試：' + error + '</div>');
            },
            complete: function() {
                $button.prop('disabled', false).html('<i class="glyphicon glyphicon-comment"></i> 詢問');
            }
        });
    });

    // 回車鍵提交問題
    $('#userQuestion').keypress(function(e) {
        if (e.which == 13) {
            $('#askLLMQuestion').click();
        }
    });
});

// 檢查並調整時區
function checkAndAdjustTimezone() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // 獲取用戶本地時間和時區
    const now = new Date();
    const timestamp = now.getTime();
    const timezoneOffset = now.getTimezoneOffset(); // 分鐘為單位，UTC偏移
    
    // 建立本地時間字串（ISO 格式但不含時區信息）
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const userDateTime = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    
    // 檢查是否需要更新時區參數
    const existingUserDateTime = urlParams.get('userDateTime');
    const existingTimestamp = urlParams.get('timestamp');
    const existingTimezoneOffset = urlParams.get('timezoneOffset');
    
    let needsUpdate = false;
    
    // 優先使用 userDateTime 參數
    if (!existingUserDateTime && !existingTimestamp) {
        needsUpdate = true;
        console.log('缺少時間參數，需要添加');
    } else if (existingTimezoneOffset && parseInt(existingTimezoneOffset) !== timezoneOffset) {
        needsUpdate = true;
        console.log('時區偏移已改變，需要更新');
    } else if (existingUserDateTime) {
        // 檢查時間是否過期（超過5分鐘）
        const existingTime = new Date(existingUserDateTime);
        const timeDiff = Math.abs(now.getTime() - existingTime.getTime());
        if (timeDiff > 5 * 60 * 1000) { // 5分鐘
            needsUpdate = true;
            console.log('時間過期，需要更新');
        }
    } else if (existingTimestamp) {
        // 檢查時間戳是否過期（超過5分鐘）
        const timestampAge = timestamp - parseInt(existingTimestamp);
        if (timestampAge > 5 * 60 * 1000) { // 5分鐘
            needsUpdate = true;
            console.log('時間戳過期，需要更新');
        }
    }
    
    if (needsUpdate) {
        // 添加/更新時間參數到URL
        urlParams.set('userDateTime', userDateTime);
        urlParams.set('timestamp', timestamp.toString());
        urlParams.set('timezoneOffset', timezoneOffset.toString());
        
        // 保持其他參數不變，重新載入頁面
        const newUrl = window.location.pathname + '?' + urlParams.toString();
        
        console.log('調整時區，使用本地時間重新載入頁面...');
        console.log('本地時間:', now.toString());
        console.log('本地時間字串:', userDateTime);
        console.log('時區偏移:', timezoneOffset, '分鐘');
        window.location.href = newUrl;
    } else {
        console.log('時區參數正確，無需調整');
    }
}

// 顯示時區調試信息
function displayTimezoneDebugInfo() {
    const localTimeElement = document.getElementById('localTime');
    if (localTimeElement) {
        const now = new Date();
        const timeString = now.toLocaleString('zh-TW', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            timeZoneName: 'short'
        });
        localTimeElement.textContent = timeString;
        
        // 添加時區狀態指示
        const urlParams = new URLSearchParams(window.location.search);
        const hasTimezone = urlParams.has('timestamp') && urlParams.has('timezoneOffset');
        
        if (hasTimezone) {
            localTimeElement.style.color = '#5cb85c'; // 綠色表示正常
            localTimeElement.title = '時區參數正常';
        } else {
            localTimeElement.style.color = '#d9534f'; // 紅色表示異常
            localTimeElement.title = '缺少時區參數，可能影響準確性';
        }
    }
    
    // 如果不是生產環境，顯示詳細的時區信息
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        console.log('=== 時區調試信息 ===');
        const now = new Date();
        console.log('本地時間:', now.toString());
        console.log('UTC 時間:', now.toUTCString());
        console.log('ISO 時間:', now.toISOString());
        console.log('時區偏移:', now.getTimezoneOffset(), '分鐘');
        console.log('時間戳:', now.getTime());
        
        const urlParams = new URLSearchParams(window.location.search);
        console.log('URL 時間戳:', urlParams.get('timestamp'));
        console.log('URL 時區偏移:', urlParams.get('timezoneOffset'));
        console.log('==================');
    }
}

// 確保時區參數始終正確的函數
function ensureTimezoneParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const now = new Date();
    const currentTimestamp = now.getTime();
    const currentTimezoneOffset = now.getTimezoneOffset();
    
    // 建立當前本地時間字串
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const currentUserDateTime = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    
    const urlUserDateTime = urlParams.get('userDateTime');
    const urlTimestamp = urlParams.get('timestamp');
    const urlTimezoneOffset = urlParams.get('timezoneOffset');
    
    // 檢查是否需要添加或更新時區參數
    let needsUpdate = false;
    let reason = '';
    
    if (!urlUserDateTime && !urlTimestamp) {
        needsUpdate = true;
        reason = '缺少時間參數';
    } else if (urlTimezoneOffset && parseInt(urlTimezoneOffset) !== currentTimezoneOffset) {
        needsUpdate = true;
        reason = '時區偏移不匹配';
    } else if (urlUserDateTime) {
        // 檢查時間是否太舊（超過10分鐘）
        const urlTime = new Date(urlUserDateTime);
        const timeDiff = Math.abs(now.getTime() - urlTime.getTime());
        if (timeDiff > 10 * 60 * 1000) {
            needsUpdate = true;
            reason = '時間過期';
        }
    } else if (urlTimestamp) {
        // 檢查時間戳是否太舊（超過10分鐘）
        const timestampAge = currentTimestamp - parseInt(urlTimestamp);
        if (timestampAge > 10 * 60 * 1000) {
            needsUpdate = true;
            reason = '時間戳過期';
        }
    }
    
    if (needsUpdate) {
        console.log(`時區參數需要更新: ${reason}`);
        urlParams.set('userDateTime', currentUserDateTime);
        urlParams.set('timestamp', currentTimestamp.toString());
        urlParams.set('timezoneOffset', currentTimezoneOffset.toString());
        
        const newUrl = window.location.pathname + '?' + urlParams.toString();
        window.location.href = newUrl;
        return true; // 表示正在重新載入
    }
    
    return false; // 表示不需要重新載入
}

// 檢查時區設定狀態
function checkTimezoneStatus() {
    const urlParams = new URLSearchParams(window.location.search);
    const hasTimestamp = urlParams.has('timestamp');
    const hasTimezoneOffset = urlParams.has('timezoneOffset');
    
    if (hasTimestamp && hasTimezoneOffset) {
        // 驗證時區參數是否有效
        const timestamp = parseInt(urlParams.get('timestamp'));
        const timezoneOffset = parseInt(urlParams.get('timezoneOffset'));
        const currentOffset = new Date().getTimezoneOffset();
        
        if (timezoneOffset === currentOffset) {
            console.log('✅ 時區設定正確');
            return 'correct';
        } else {
            console.log('⚠️ 時區偏移不匹配');
            return 'offset_mismatch';
        }
    } else {
        console.log('❌ 缺少時區參數');
        return 'missing';
    }
}

// CSS 動畫樣式（需要添加到 CSS 文件中）
// .glyphicon-refresh-animate {
//     -animation: spin .7s infinite linear;
//     -webkit-animation: spin2 .7s infinite linear;
// }
// 
// @-webkit-keyframes spin2 {
//     from { -webkit-transform: rotate(0deg);}
//     to { -webkit-transform: rotate(360deg);}
// }
// 
// @keyframes spin {
//     from { transform: scale(1) rotate(0deg);}
//     to { transform: scale(1) rotate(360deg);}
// }
