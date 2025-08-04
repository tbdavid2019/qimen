$(document).ready(function() {
    // 檢查是否需要用本地時間重新載入頁面
    checkAndAdjustTimezone();
    
    // 顯示時區調試信息
    displayTimezoneDebugInfo();
    
    // 頁面載入時檢查URL參數並設置正確的模式
    const urlParams = new URLSearchParams(window.location.search);
    const currentMode = urlParams.get('timePrecisionMode') || 'traditional';
    
    // 初始化模式顯示
    initializeTimePrecisionMode(currentMode);
    
    // 初始化函數
    function initializeTimePrecisionMode(mode) {
        if (mode === 'advanced') {
            $('#traditionalModeBtn').removeClass('active');
            $('#advancedModeBtn').addClass('active');
            $('input[name="timeMode"][value="advanced"]').prop('checked', true);
            $('#advancedModeInfo').show();
            $('#timePrecision').text('進階模式');
            updateTimePrecisionDisplay(mode);
        } else {
            $('#traditionalModeBtn').addClass('active');
            $('#advancedModeBtn').removeClass('active');
            $('input[name="timeMode"][value="traditional"]').prop('checked', true);
            $('#advancedModeInfo').hide();
            $('#timePrecision').text('傳統模式');
            $('#timeSegmentInfo').hide();
        }
    }

    // 自定义排盘表单提交
    $('#submitCustomPan').click(function() {
        $('#customPanForm').submit();
    });

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
        var selectedMode = $(this).val();
        switchTimePrecisionMode(selectedMode);
    });

    // 模式按鈕點擊事件 - 直接處理按鈕點擊
    $('#traditionalModeBtn').click(function() {
        $('input[name="timeMode"][value="traditional"]').prop('checked', true);
        switchTimePrecisionMode('traditional');
    });
    
    $('#advancedModeBtn').click(function() {
        $('input[name="timeMode"][value="advanced"]').prop('checked', true);
        switchTimePrecisionMode('advanced');
    });

    // 根據時間精度模式重新載入頁面
    function reloadWithTimePrecision(mode) {
        var currentUrl = new URL(window.location.href);
        
        if (mode === 'traditional') {
            // 傳統模式時移除參數（因為預設就是傳統模式）
            currentUrl.searchParams.delete('timePrecisionMode');
        } else {
            // 進階模式時設置參數
            currentUrl.searchParams.set('timePrecisionMode', mode);
        }
        
        // 確保保持本地時間參數
        if (!currentUrl.searchParams.has('timestamp')) {
            const now = new Date();
            currentUrl.searchParams.set('timestamp', now.getTime().toString());
            currentUrl.searchParams.set('timezoneOffset', now.getTimezoneOffset().toString());
        }
        
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
    
    // 如果URL中已經有timestamp參數，說明已經用本地時間載入了，不需要重複調整
    if (urlParams.has('timestamp')) {
        return;
    }
    
    // 獲取用戶本地時間和時區
    const now = new Date();
    const timestamp = now.getTime();
    const timezoneOffset = now.getTimezoneOffset(); // 分鐘為單位，UTC偏移
    
    // 添加時間和時區參數到URL
    urlParams.set('timestamp', timestamp.toString());
    urlParams.set('timezoneOffset', timezoneOffset.toString());
    
    // 保持其他參數不變，重新載入頁面
    const newUrl = window.location.pathname + '?' + urlParams.toString();
    
    // 避免無限重新載入：檢查URL是否真的需要改變
    if (window.location.search !== '?' + urlParams.toString()) {
        console.log('調整時區，使用本地時間重新載入頁面...');
        window.location.href = newUrl;
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
