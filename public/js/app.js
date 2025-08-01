$(document).ready(function() {
    // 自定义排盘表单提交
    $('#submitCustomPan').click(function() {
        $('#customPanForm').submit();
    });

    // 确保九宫格始终保持正方形比例
    function maintainAspectRatio() {
        var gridWidth = $('.pan-grid').width();
        $('.gong').css('height', gridWidth / 3 + 'px');
    }

    maintainAspectRatio();
    $(window).resize(maintainAspectRatio);

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
        var qimenData = extractQimenDataFromPage();

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

    // 從頁面提取奇門數據的函數
    function extractQimenDataFromPage() {
        // 這裡需要從頁面的各個元素中提取奇門數據
        // 為了簡化，我們可以通過服務器端直接傳遞數據
        return window.qimenData || {};
    }
});

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
