/**
 * Resend Email Service for Divination Consultation History
 * 
 * 品牌規範：
 * - 核心品牌名稱：【333 一句提醒·照見當下】（杜絕任何未經定義之名稱）
 * - 核心理念：「傳統智慧，理性解讀；照見當下，指引行動」
 * 
 * 安全說明：
 * - RESEND_API_KEY 由伺服端環境變數 (process.env.RESEND_API_KEY) 讀取，
 *   在 Vercel 雲端環境中嚴格隔離於 Serverless Function 內部，不會傳輸或洩露至任何前端客戶端。
 */

const MarkdownRenderer = require('../public/js/markdown-renderer');

const RESEND_API_URL = 'https://api.resend.com/emails';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BRAND_NAME = '333 一句提醒·照見當下';

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
 * 將 Markdown 與語意化 HTML 轉換為適合跨郵件客戶端（Gmail, Apple Mail, Outlook）的行內樣式 HTML
 * 
 * @param {string} md - 原始 Markdown 字串
 * @param {string} [existingHtml] - 若前端已渲染好的 HTML 可直接注入並賦予 Email 樣式
 * @returns {string} 包含完整 inline CSS 的 HTML 字串
 */
function markdownToEmailHtml(md, existingHtml) {
    let rawHtml = '';
    if (existingHtml && typeof existingHtml === 'string' && existingHtml.trim()) {
        rawHtml = existingHtml;
    } else if (md) {
        rawHtml = MarkdownRenderer.render(md);
    } else {
        return '';
    }

    let html = rawHtml;

    // 表格容器與表格樣式（解決 Email 客戶端表格寬度破版或邊框丟失）
    html = html.replace(/<div class="markdown-table-wrapper">/g, '<div style="width:100%;overflow-x:auto;margin:14px 0;-webkit-overflow-scrolling:touch;">');
    html = html.replace(/<table>/g, '<table style="width:100%;min-width:100%;border-collapse:collapse;margin:12px 0;font-size:13.5px;background:#ffffff;border:1.5px solid #ebd9c8;border-radius:6px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.03);">');
    html = html.replace(/<thead[^>]*>/g, '<thead style="background:#fbf7f2;">');
    html = html.replace(/<th class="text-center">/g, '<th style="background:#fbf7f2;color:#8c432a;font-weight:700;padding:9px 12px;border:1px solid #ebd9c8;text-align:center;font-size:13px;line-height:1.4;">');
    html = html.replace(/<th class="text-right">/g, '<th style="background:#fbf7f2;color:#8c432a;font-weight:700;padding:9px 12px;border:1px solid #ebd9c8;text-align:right;font-size:13px;line-height:1.4;">');
    html = html.replace(/<th class="text-left">/g, '<th style="background:#fbf7f2;color:#8c432a;font-weight:700;padding:9px 12px;border:1px solid #ebd9c8;text-align:left;font-size:13px;line-height:1.4;">');
    html = html.replace(/<th>/g, '<th style="background:#fbf7f2;color:#8c432a;font-weight:700;padding:9px 12px;border:1px solid #ebd9c8;text-align:left;font-size:13px;line-height:1.4;">');
    html = html.replace(/<td class="text-center">/g, '<td style="padding:9px 12px;border:1px solid #ebd9c8;color:#3d3834;vertical-align:top;font-size:13.5px;text-align:center;line-height:1.5;">');
    html = html.replace(/<td class="text-right">/g, '<td style="padding:9px 12px;border:1px solid #ebd9c8;color:#3d3834;vertical-align:top;font-size:13.5px;text-align:right;line-height:1.5;">');
    html = html.replace(/<td class="text-left">/g, '<td style="padding:9px 12px;border:1px solid #ebd9c8;color:#3d3834;vertical-align:top;font-size:13.5px;text-align:left;line-height:1.5;">');
    html = html.replace(/<td>/g, '<td style="padding:9px 12px;border:1px solid #ebd9c8;color:#3d3834;vertical-align:top;font-size:13.5px;line-height:1.5;">');

    // 標題層級微調（信件主標為 H1，對話內容由 H2 ~ H5 承接）
    html = html.replace(/<h([1-4])>/g, (match, level) => {
        const targetLevel = Math.min(Number(level) + 1, 5);
        const fontSizes = { 2: '17px', 3: '16px', 4: '15px', 5: '14px' };
        const margins = { 2: '16px 0 8px 0', 3: '14px 0 6px 0', 4: '12px 0 6px 0', 5: '10px 0 4px 0' };
        const fontSize = fontSizes[targetLevel] || '14px';
        const margin = margins[targetLevel] || '10px 0 4px 0';
        return `<h${targetLevel} style="color:#8c432a;font-size:${fontSize};margin:${margin};font-weight:700;line-height:1.4;">`;
    });
    html = html.replace(/<\/h([1-4])>/g, (match, level) => {
        const targetLevel = Math.min(Number(level) + 1, 5);
        return `</h${targetLevel}>`;
    });

    // 段落與列表
    html = html.replace(/<p>/g, '<p style="margin:8px 0;color:#2d2a26;line-height:1.7;font-size:14px;">');
    html = html.replace(/<ul>/g, '<ul style="margin:8px 0;padding-left:22px;color:#2d2a26;line-height:1.7;font-size:14px;">');
    html = html.replace(/<ol>/g, '<ol style="margin:8px 0;padding-left:22px;color:#2d2a26;line-height:1.7;font-size:14px;">');
    html = html.replace(/<li>/g, '<li style="margin-bottom:6px;color:#2d2a26;line-height:1.6;">');

    // 引言區塊（一句提醒亮點）
    html = html.replace(/<blockquote>/g, '<blockquote style="margin:12px 0;padding:10px 16px;background:#fcf9f5;border-left:4px solid #cc6b49;color:#5a493d;border-radius:0 8px 8px 0;font-size:13.5px;line-height:1.6;font-style:italic;">');

    // 程式碼區塊與行內代碼
    html = html.replace(/<pre><code>/g, '<pre style="background:#2d2a26;color:#f8f9fa;padding:12px 14px;border-radius:8px;overflow-x:auto;font-family:Consolas,Monaco,monospace;font-size:12.5px;line-height:1.5;margin:12px 0;"><code style="background:transparent;color:inherit;padding:0;border:none;">');
    html = html.replace(/<code>/g, '<code style="background:#f6f1eb;color:#8c432a;padding:2px 6px;border-radius:4px;font-family:Consolas,Monaco,monospace;font-size:12.5px;border:1px solid #ebd9c8;">');

    // 強調文字
    html = html.replace(/<strong>/g, '<strong style="color:#2d2a26;font-weight:700;">');
    html = html.replace(/<em>/g, '<em style="color:#5c5650;">');

    return html;
}

// 保持與舊版相容之別名導出
const simpleMarkdownToEmailHtml = markdownToEmailHtml;

/**
 * 取得寄件者 From 地址（確保包含官方品牌名稱「333 一句提醒·照見當下」）
 */
function getFromAddress() {
    const envFrom = process.env.RESEND_FROM_EMAIL;
    if (!envFrom || !envFrom.trim()) {
        return `${BRAND_NAME} <onboarding@resend.dev>`;
    }
    const trimmed = envFrom.trim();
    if (trimmed.includes('<') && trimmed.includes('>')) {
        return trimmed.replace(/333\s*易學占斷/g, BRAND_NAME);
    }
    return `${BRAND_NAME} <${trimmed}>`;
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
    history.forEach((msg) => {
        if (msg.role === 'user') {
            conversationHtml += `
            <div style="margin-bottom:18px;text-align:right;">
                <div style="font-size:12px;color:#8c827a;margin-bottom:4px;font-weight:600;">您問道 👤</div>
                <div style="display:inline-block;background:#cc6b49;color:#ffffff;border-radius:12px 12px 2px 12px;padding:10px 15px;font-size:14px;line-height:1.5;max-width:85%;text-align:left;box-shadow:0 2px 6px rgba(204,107,73,0.2);">
                    ${escapeHtml(msg.content)}
                </div>
            </div>`;
        } else {
            conversationHtml += `
            <div style="margin-bottom:26px;text-align:left;">
                <div style="font-size:12px;color:#8c432a;margin-bottom:5px;font-weight:700;">🔮 ${escapeHtml(serviceName)} 大師解讀</div>
                <div style="background:#ffffff;border:1.5px solid #ebd9c8;border-radius:12px 12px 12px 2px;padding:16px 20px;font-size:14px;line-height:1.65;color:#2d2a26;box-shadow:0 2px 8px rgba(0,0,0,0.04);">
                    <div class="markdown-body">
                        ${markdownToEmailHtml(msg.content, msg.html)}
                    </div>
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
    <title>333 一句提醒·照見當下 - ${escapeHtml(serviceName)} 諮詢紀錄</title>
    <style>
        body {
            margin: 0;
            padding: 24px 12px;
            background-color: #f6f3ee;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            color: #2d2a26;
            -webkit-font-smoothing: antialiased;
        }
        .markdown-body {
            font-size: 14px;
            line-height: 1.7;
            color: #2d2a26;
        }
        .markdown-body h1, .markdown-body h2, .markdown-body h3, .markdown-body h4, .markdown-body h5 {
            color: #8c432a;
            margin: 14px 0 6px 0;
            font-weight: 700;
            line-height: 1.4;
        }
        .markdown-body p {
            margin: 8px 0;
            color: #2d2a26;
            line-height: 1.7;
        }
        .markdown-body ul, .markdown-body ol {
            margin: 8px 0;
            padding-left: 22px;
            color: #2d2a26;
            line-height: 1.7;
        }
        .markdown-body li {
            margin-bottom: 5px;
            color: #2d2a26;
            line-height: 1.6;
        }
        .markdown-body table {
            width: 100%;
            border-collapse: collapse;
            margin: 14px 0;
            font-size: 13.5px;
            background: #ffffff;
            border: 1px solid #ebd9c8;
            border-radius: 6px;
        }
        .markdown-body th {
            background: #fbf7f2;
            color: #8c432a;
            font-weight: 700;
            padding: 9px 12px;
            border: 1px solid #ebd9c8;
            text-align: left;
        }
        .markdown-body td {
            padding: 9px 12px;
            border: 1px solid #ebd9c8;
            color: #3d3834;
            vertical-align: top;
        }
        .markdown-body blockquote {
            margin: 12px 0;
            padding: 10px 16px;
            background: #fcf9f5;
            border-left: 4px solid #cc6b49;
            color: #5a493d;
            border-radius: 0 8px 8px 0;
            font-style: italic;
        }
        .markdown-body code {
            background: #f6f1eb;
            color: #8c432a;
            padding: 2px 5px;
            border-radius: 4px;
            font-family: Consolas, Monaco, monospace;
            font-size: 12.5px;
            border: 1px solid #ebd9c8;
        }
        .markdown-body pre {
            background: #2d2a26;
            color: #f8f9fa;
            padding: 12px 14px;
            border-radius: 8px;
            overflow-x: auto;
            font-family: Consolas, Monaco, monospace;
            font-size: 12.5px;
            line-height: 1.5;
            margin: 12px 0;
        }
        .markdown-body strong {
            color: #1b1917;
            font-weight: 700;
        }
    </style>
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

            <div style="margin-bottom:14px;font-size:13px;font-weight:700;color:#786c62;border-bottom:1px solid #ebd9c8;padding-bottom:6px;">
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
                本信件由 <a href="https://qi.david888.com" style="color:#cc6b49;text-decoration:none;font-weight:600;">333 一句提醒·照見當下</a> 平台自動寄發，請勿直接回覆此郵件。<br/>
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
 * @param {Array<{role: string, content: string, html?: string}>} options.history - 對話歷史紀錄
 * @returns {Promise<{success: boolean, id?: string, error?: string, status?: number, message?: string}>}
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
        : `【333 一句提醒·照見當下】您的${serviceName}諮詢對話紀錄（${new Date().toLocaleDateString('zh-TW')}）`;

    const htmlContent = generateConversationEmailHtml({
        serviceName,
        chartSummary,
        history,
        timestamp: new Date()
    });

    const fromAddress = getFromAddress();

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
    markdownToEmailHtml,
    simpleMarkdownToEmailHtml,
    getFromAddress,
    BRAND_NAME
};
