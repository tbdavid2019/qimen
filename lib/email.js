/**
 * Resend Email Service for Divination Consultation History
 * 
 * 安全說明：
 * - RESEND_API_KEY 由伺服端環境變數 (process.env.RESEND_API_KEY) 讀取，
 *   在 Vercel 雲端環境中嚴格隔離於 Serverless Function 內部，不會傳輸或洩露至任何前端客戶端。
 */

const RESEND_API_URL = 'https://api.resend.com/emails';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * 簡易 HTML 跳脫
 */
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * 簡易 Markdown 轉換為 HTML (適用於 Email 客戶端，避免依賴大型模組)
 */
function simpleMarkdownToEmailHtml(md) {
    if (!md) return '';
    let html = escapeHtml(md);

    // 處理標題 ###, ##, #
    html = html.replace(/^### (.*$)/gim, '<h4 style="color:#8c432a;margin:12px 0 6px 0;font-size:15px;font-weight:700;">$1</h4>');
    html = html.replace(/^## (.*$)/gim, '<h3 style="color:#8c432a;margin:16px 0 8px 0;font-size:16px;font-weight:700;">$1</h3>');
    html = html.replace(/^# (.*$)/gim, '<h2 style="color:#8c432a;margin:18px 0 8px 0;font-size:18px;font-weight:700;">$1</h2>');

    // 粗體 **text**
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong style="color:#2d2a26;font-weight:700;">$1</strong>');

    // 引用區塊 > text
    html = html.replace(/^\&gt; (.*$)/gim, '<blockquote style="margin:8px 0;padding:8px 12px;background:#fdfaf6;border-left:3px solid #cc6b49;color:#5c5650;font-style:italic;">$1</blockquote>');

    // 列表項目 - text 或 * text
    html = html.replace(/^\s*[-*]\s+(.*$)/gim, '<li style="margin-bottom:4px;color:#3d3834;line-height:1.6;">$1</li>');
    html = html.replace(/(<li.*<\/li>)/s, '<ul style="margin:6px 0;padding-left:20px;">$1</ul>');

    // 編號列表 1. text
    html = html.replace(/^\s*(\d+)\.\s+(.*$)/gim, '<li style="margin-bottom:4px;color:#3d3834;line-height:1.6;">$2</li>');

    // 換行
    html = html.replace(/\n\n+/g, '<div style="height:8px;"></div>');
    html = html.replace(/\n/g, '<br/>');

    return html;
}

/**
 * 產生高品質 HTML Email 模板
 */
function generateConversationEmailHtml(options) {
    const {
        serviceName = '奇門遁甲',
        chartSummary = null,
        history = [],
        timestamp = new Date()
    } = options;

    const formattedTime = new Date(timestamp).toLocaleString('zh-TW', {
        timeZone: 'Asia/Taipei',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });

    let chartSummaryHtml = '';
    if (chartSummary) {
        if (typeof chartSummary === 'string') {
            chartSummaryHtml = `<div style="background:#fcf9f5;border:1px solid #ebd9c8;border-radius:8px;padding:12px 16px;margin-bottom:20px;font-size:13.5px;color:#5a493d;line-height:1.5;">${escapeHtml(chartSummary)}</div>`;
        } else if (typeof chartSummary === 'object') {
            const items = [];
            if (chartSummary.date) items.push(`<strong>排盤時間：</strong>${escapeHtml(chartSummary.date)} ${escapeHtml(chartSummary.time || '')}`);
            if (chartSummary.dun) items.push(`<strong>遁局：</strong>${escapeHtml(chartSummary.dun)}`);
            if (chartSummary.zhifu) items.push(`<strong>值符：</strong>${escapeHtml(chartSummary.zhifu)}`);
            if (chartSummary.zhishi) items.push(`<strong>值使：</strong>${escapeHtml(chartSummary.zhishi)}`);
            if (chartSummary.category) items.push(`<strong>占問類別：</strong>${escapeHtml(chartSummary.category)}`);

            if (items.length > 0) {
                chartSummaryHtml = `
                <div style="background:#fcf9f5;border:1px solid #ebd9c8;border-radius:8px;padding:12px 16px;margin-bottom:20px;font-size:13.5px;color:#5a493d;line-height:1.6;">
                    ${items.join(' &nbsp; | &nbsp; ')}
                </div>`;
            }
        }
    }

    let conversationHtml = '';
    history.forEach((msg, idx) => {
        if (msg.role === 'user') {
            conversationHtml += `
            <div style="margin-bottom:16px;text-align:right;">
                <div style="font-size:12px;color:#8c827a;margin-bottom:4px;font-weight:600;">您問道 👤</div>
                <div style="display:inline-block;background:#cc6b49;color:#ffffff;border-radius:12px 12px 2px 12px;padding:10px 14px;font-size:14px;line-height:1.5;max-width:85%;text-align:left;box-shadow:0 2px 6px rgba(204,107,73,0.2);">
                    ${escapeHtml(msg.content)}
                </div>
            </div>`;
        } else {
            conversationHtml += `
            <div style="margin-bottom:24px;text-align:left;">
                <div style="font-size:12px;color:#8c432a;margin-bottom:4px;font-weight:700;">🔮 ${escapeHtml(serviceName)} 大師解讀</div>
                <div style="background:#ffffff;border:1.5px solid #ebd9c8;border-radius:12px 12px 12px 2px;padding:14px 18px;font-size:14px;line-height:1.65;color:#2d2a26;box-shadow:0 2px 8px rgba(0,0,0,0.04);">
                    ${simpleMarkdownToEmailHtml(msg.content)}
                </div>
            </div>`;
        }
    });

    return `
<!DOCTYPE html>
<html lang="zh-Hant-TW">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>333 易學占斷諮詢紀錄</title>
</head>
<body style="margin:0;padding:24px 12px;background-color:#f6f3ee;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#2d2a26;">
    <div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #e5dcce;border-radius:14px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.06);">
        <!-- 頂部品牌 Header -->
        <div style="background:linear-gradient(135deg, #1b262c 0%, #0f171c 100%);padding:22px 24px;text-align:center;border-bottom:3px solid #cc6b49;">
            <div style="color:#cc6b49;font-size:13px;letter-spacing:1px;font-weight:700;margin-bottom:4px;">333 一句提醒 · 照見當下</div>
            <h1 style="color:#ffffff;font-size:20px;margin:0;font-weight:800;letter-spacing:0.5px;">${escapeHtml(serviceName)} 命理諮詢對話紀錄</h1>
            <div style="color:#a0aab2;font-size:12px;margin-top:6px;">諮詢時間：${formattedTime}</div>
        </div>

        <!-- 主體內容區塊 -->
        <div style="padding:24px 20px;">
            ${chartSummaryHtml}

            <div style="margin-bottom:12px;font-size:13px;font-weight:700;color:#786c62;border-bottom:1px solid #ebd9c8;padding-bottom:6px;">
                💬 諮詢問答脈絡存檔（共 ${history.length} 則互動）
            </div>

            <div style="margin-top:16px;">
                ${conversationHtml}
            </div>
        </div>

        <!-- 底部落款與指引 -->
        <div style="background:#faf7f2;border-top:1px solid #ebd9c8;padding:18px 20px;text-align:center;">
            <div style="color:#8c432a;font-size:13.5px;font-weight:700;margin-bottom:4px;">
                傳統智慧，理性解讀；照見當下，指引行動
            </div>
            <div style="color:#8c827a;font-size:12px;line-height:1.5;">
                本信件由 <a href="https://qi.david888.com" style="color:#cc6b49;text-decoration:none;font-weight:600;">333 易學占斷系統</a> 自動寄發，請勿直接回覆此郵件。<br/>
                隨時歡迎回到網站進行深入探討與複盤！
            </div>
        </div>
    </div>
</body>
</html>`;
}

/**
 * 透過 Resend API 發送對話紀錄郵件
 * 
 * @param {Object} options
 * @param {string} options.to - 收件人 Email
 * @param {string} [options.subject] - 郵件標題
 * @param {string} [options.serviceName] - 占斷服務名稱（預設：奇門遁甲）
 * @param {Object|string} [options.chartSummary] - 盤面摘要
 * @param {Array<{role: string, content: string}>} options.history - 對話歷史紀錄
 * @returns {Promise<{success: boolean, id?: string, error?: string}>}
 */
async function sendConversationEmail(options) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        return {
            success: false,
            error: '未配置 RESEND_API_KEY 環境變數。請在 Vercel 專案設定 (Settings -> Environment Variables) 中填入 RESEND_API_KEY。'
        };
    }

    const {
        to,
        subject,
        serviceName = '奇門遁甲',
        chartSummary,
        history
    } = options || {};

    if (!to || typeof to !== 'string' || !EMAIL_REGEX.test(to.trim())) {
        return {
            success: false,
            error: '請提供有效的收件電子郵件地址。'
        };
    }

    if (!Array.isArray(history) || history.length === 0) {
        return {
            success: false,
            error: '對話紀錄為空，無法寄出空白對話。'
        };
    }

    const recipientEmail = to.trim();
    const finalSubject = subject && subject.trim() 
        ? subject.trim() 
        : `【333 ${serviceName}】您的命理諮詢對話紀錄（${new Date().toLocaleDateString('zh-TW')}）`;

    const htmlContent = generateConversationEmailHtml({
        serviceName,
        chartSummary,
        history,
        timestamp: new Date()
    });

    const fromAddress = process.env.RESEND_FROM_EMAIL || '333 易學占斷 <onboarding@resend.dev>';

    try {
        const response = await fetch(RESEND_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: fromAddress,
                to: [recipientEmail],
                subject: finalSubject,
                html: htmlContent
            })
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            let errorMsg = data.message || `Resend API 回傳錯誤碼 ${response.status}`;
            if (response.status === 403 && fromAddress.includes('resend.dev')) {
                errorMsg = '使用 Resend 免費測試網域 (onboarding@resend.dev) 時，僅能寄送給 Resend 帳號註冊信箱。若需寄給任意使用者，請在 Resend 控制台完成自訂網域驗證並設定 RESEND_FROM_EMAIL。';
            }
            return {
                success: false,
                error: errorMsg,
                status: response.status,
                raw: data
            };
        }

        return {
            success: true,
            id: data.id,
            message: `對話紀錄已成功寄送至 ${recipientEmail}！`
        };
    } catch (err) {
        return {
            success: false,
            error: `發送郵件時發生網路或系統錯誤：${err.message}`
        };
    }
}

module.exports = {
    sendConversationEmail,
    generateConversationEmailHtml,
    simpleMarkdownToEmailHtml
};
