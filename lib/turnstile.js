/**
 * lib/turnstile.js
 * Cloudflare Turnstile verification module & Express middleware.
 *
 * Implements canonical server-side siteverify against challenges.cloudflare.com
 * with support for action validation, hostname checking, replay detection,
 * and graceful fallback for tests and development.
 */

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/**
 * Checks whether Turnstile verification is actively enabled.
 * Returns false during tests unless TURNSTILE_FORCE_ENABLE is true.
 */
function isTurnstileEnabled() {
    const secret = (process.env.TURNSTILE_SECRET || '').trim();
    const siteKey = (process.env.TURNSTILE_SITE_KEY || '').trim();
    const hasValidCreds = Boolean(
        secret &&
        siteKey &&
        !secret.includes('xxxxxxxx') &&
        !siteKey.includes('xxxxxxxx')
    );

    if (process.env.TURNSTILE_FORCE_ENABLE === 'true') {
        return hasValidCreds || Boolean(secret && !secret.includes('xxxxxxxx'));
    }
    if (process.env.NODE_ENV === 'test' || process.env.npm_lifecycle_event === 'test') {
        return false;
    }
    if (process.env.TURNSTILE_ENABLED === 'false' || process.env.TURNSTILE_ENABLED === '0') {
        return false;
    }
    return hasValidCreds;
}

/**
 * Detects if Turnstile configuration is in an incomplete / misconfigured state.
 * For instance, secret is configured, but siteKey is missing, or vice-versa.
 * When partially configured, the endpoint must fail-closed rather than silently bypassing.
 */
function getTurnstileConfigError() {
    const secret = (process.env.TURNSTILE_SECRET || '').trim();
    const siteKey = (process.env.TURNSTILE_SITE_KEY || '').trim();
    const hasSecret = Boolean(secret && !secret.includes('xxxxxxxx'));
    const hasSiteKey = Boolean(siteKey && !siteKey.includes('xxxxxxxx'));

    // 1. Force enable takes highest precedence and strictly enforces fail-closed
    if (process.env.TURNSTILE_FORCE_ENABLE === 'true') {
        if (!hasSecret && !hasSiteKey) {
            return 'TURNSTILE_FORCE_ENABLE 已啟用，但尚未配置有效之 TURNSTILE_SECRET 與 TURNSTILE_SITE_KEY，系統已自動阻擋以策安全 (Fail-Closed)';
        }
        if (!hasSecret) {
            return 'TURNSTILE_FORCE_ENABLE 已啟用，但遺漏有效之 TURNSTILE_SECRET，系統已自動阻擋以策安全 (Fail-Closed)';
        }
        if (!hasSiteKey) {
            return 'TURNSTILE_FORCE_ENABLE 已啟用，但遺漏有效之 TURNSTILE_SITE_KEY，系統已自動阻擋以策安全 (Fail-Closed)';
        }
        return null;
    }

    if (process.env.NODE_ENV === 'test' || process.env.npm_lifecycle_event === 'test') {
        return null;
    }
    if (process.env.TURNSTILE_ENABLED === 'false' || process.env.TURNSTILE_ENABLED === '0') {
        return null;
    }

    if (hasSecret && !hasSiteKey) {
        return 'TURNSTILE_SECRET 已配置，但遺漏 TURNSTILE_SITE_KEY，系統已自動阻擋以策安全 (Fail-Closed)';
    }
    if (!hasSecret && hasSiteKey) {
        return 'TURNSTILE_SITE_KEY 已配置，但遺漏 TURNSTILE_SECRET，系統已自動阻擋以策安全 (Fail-Closed)';
    }
    return null;
}

/**
 * Returns the configured Turnstile Site Key for client-side embedding.
 */
function getSiteKey() {
    return (process.env.TURNSTILE_SITE_KEY || '').trim();
}

/**
 * Parses comma-separated hostnames into a Set of lowercase strings.
 */
function parseHostnames(raw) {
    if (!raw) return null;
    if (raw instanceof Set) return raw;
    if (Array.isArray(raw)) {
        const list = raw.map((h) => String(h).trim().toLowerCase()).filter(Boolean);
        return list.length > 0 ? new Set(list) : null;
    }
    const list = String(raw)
        .split(',')
        .map((h) => h.trim().toLowerCase())
        .filter(Boolean);
    return list.length > 0 ? new Set(list) : null;
}

/**
 * Verifies a Turnstile response token with Cloudflare siteverify endpoint.
 *
 * @param {Object} params
 * @param {string} params.token - The cf-turnstile-response token from client
 * @param {string} [params.secret] - Optional secret override (defaults to env)
 * @param {string} [params.remoteip] - Client IP address
 * @param {string|string[]} [params.expectedAction] - Optional action(s) to match
 * @param {string|string[]|Set<string>} [params.expectedHostnames] - Optional allowed hostnames
 * @param {string} [params.bypassToken] - Optional secret bypass token
 * @returns {Promise<{ success: boolean, bypassed?: boolean, error?: string, code?: string, status?: number, data?: any, details?: any }>}
 */
async function verifyTurnstile({
    token,
    secret,
    remoteip,
    expectedAction,
    expectedHostnames,
    currentHost,
    bypassToken
} = {}) {
    const activeSecret = (secret || process.env.TURNSTILE_SECRET || '').trim();

    // 1. Fail closed if force enabled but active secret is missing
    if (process.env.TURNSTILE_FORCE_ENABLE === 'true' && !activeSecret) {
        return {
            success: false,
            status: 503,
            code: 'TURNSTILE_CONFIG_INCOMPLETE',
            error: 'TURNSTILE_FORCE_ENABLE 已啟用，但未配置有效之 TURNSTILE_SECRET (Fail-Closed)'
        };
    }

    // 2. If not enabled, return bypassed success
    if (!isTurnstileEnabled() || !activeSecret) {
        return { success: true, bypassed: true };
    }

    // 2. Check for authorized bypass token (e.g. from internal CLI or server-to-server)
    const configuredBypass = (process.env.TURNSTILE_BYPASS_TOKEN || '').trim();
    if (configuredBypass && bypassToken && bypassToken.trim() === configuredBypass) {
        return { success: true, bypassed: true };
    }

    // 3. Token validation
    if (typeof token !== 'string' || token.trim().length === 0) {
        return {
            success: false,
            status: 403,
            code: 'TURNSTILE_TOKEN_MISSING',
            error: '請完成人機安全驗證 (Cloudflare Turnstile verification required)'
        };
    }

    const trimmedToken = token.trim();
    if (trimmedToken.length > 2048) {
        return {
            success: false,
            status: 403,
            code: 'TURNSTILE_TOKEN_INVALID',
            error: '人機驗證憑證格式無效 (Invalid Turnstile token)'
        };
    }

    // 4. Resolve allowed hostnames
    const allowedHostnames = parseHostnames(expectedHostnames || process.env.TURNSTILE_HOSTNAMES);

    // 5. Send POST to Cloudflare siteverify
    let verifyData;
    try {
        const bodyParams = new URLSearchParams({
            secret: activeSecret,
            response: trimmedToken
        });
        if (remoteip) {
            bodyParams.append('remoteip', remoteip);
        }

        const res = await fetch(SITEVERIFY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            signal: AbortSignal.timeout(10000),
            body: bodyParams
        });

        if (!res.ok) {
            return {
                success: false,
                status: 403,
                code: 'TURNSTILE_HTTP_ERROR',
                error: `驗證服務響應異常 (HTTP ${res.status})`
            };
        }

        verifyData = await res.json();
    } catch (err) {
        return {
            success: false,
            status: 403,
            code: 'TURNSTILE_NETWORK_ERROR',
            error: '無法連線至人機驗證服務，請稍後重試'
        };
    }

    // 6. Inspect siteverify outcome
    if (!verifyData || !verifyData.success) {
        const errorCodes = verifyData?.['error-codes'] || [];
        const isReplayOrExpired = errorCodes.includes('timeout-or-duplicate');
        return {
            success: false,
            status: 403,
            code: isReplayOrExpired ? 'TURNSTILE_EXPIRED' : 'TURNSTILE_FAILED',
            error: isReplayOrExpired
                ? '驗證已過期或已使用，請重新驗證'
                : '人機安全驗證未通過，請重試',
            details: errorCodes
        };
    }

    // 7. Verify hostname if allowlist or current deployment host is configured (fail closed if missing)
    if ((allowedHostnames && allowedHostnames.size > 0) || currentHost) {
        if (!verifyData.hostname) {
            return {
                success: false,
                status: 403,
                code: 'TURNSTILE_HOSTNAME_MISMATCH',
                error: '驗證回應缺少來源網域名稱'
            };
        }
        const responseHostname = String(verifyData.hostname).toLowerCase().trim();
        if (allowedHostnames && allowedHostnames.size > 0 && !allowedHostnames.has(responseHostname)) {
            return {
                success: false,
                status: 403,
                code: 'TURNSTILE_HOSTNAME_MISMATCH',
                error: '來源網域名稱不符合安全設定'
            };
        }
        if (currentHost) {
            const normalizedCurrentHost = String(currentHost).toLowerCase().split(':')[0].trim();
            const isLocalCurrent = (normalizedCurrentHost === 'localhost' || normalizedCurrentHost === '127.0.0.1');
            const isLocalResponse = (responseHostname === 'localhost' || responseHostname === '127.0.0.1');
            const match = (responseHostname === normalizedCurrentHost) || (isLocalCurrent && isLocalResponse);
            if (!match) {
                return {
                    success: false,
                    status: 403,
                    code: 'TURNSTILE_HOSTNAME_MISMATCH',
                    error: `來源網域名稱 (${responseHostname}) 與目前部署網域 (${normalizedCurrentHost}) 不符`
                };
            }
        }
    }

    // 8. Verify action if expectedAction configured (fail closed if missing)
    if (expectedAction) {
        if (!verifyData.action) {
            return {
                success: false,
                status: 403,
                code: 'TURNSTILE_ACTION_MISMATCH',
                error: '驗證回應缺少操作類別'
            };
        }
        const validActions = Array.isArray(expectedAction) ? expectedAction : [expectedAction];
        if (!validActions.includes(verifyData.action)) {
            return {
                success: false,
                status: 403,
                code: 'TURNSTILE_ACTION_MISMATCH',
                error: '操作類別不符合安全設定'
            };
        }
    }

    return {
        success: true,
        data: verifyData
    };
}

/**
 * Express middleware to enforce Cloudflare Turnstile token validation.
 *
 * @param {Object} [options]
 * @param {string|string[]|Function} [options.action] - Expected action or dynamic getter
 * @param {string|string[]|Set<string>} [options.expectedHostnames] - Allowed hostnames
 */
function turnstileMiddleware(options = {}) {
    return async function (req, res, next) {
        // Fail closed on incomplete configuration to avoid exposing protected endpoints
        const configError = getTurnstileConfigError();
        if (configError) {
            console.error('[Turnstile Security] Fail-closed due to incomplete configuration:', configError);
            return res.status(503).json({
                success: false,
                error: '人機安全驗證服務設定不完整，系統已自動阻擋連線以策安全。',
                code: 'TURNSTILE_CONFIG_INCOMPLETE',
                field: 'turnstile',
                details: configError
            });
        }

        if (!isTurnstileEnabled()) {
            return next();
        }

        const token = req.body?.['cf-turnstile-response'] ||
                      req.body?.turnstileToken ||
                      req.headers['cf-turnstile-response'] ||
                      req.headers['x-turnstile-token'];

        // Only accept secure dedicated bypass header; never accept query strings or unrelated api keys
        const bypassToken = req.headers['x-turnstile-bypass'];

        const clientIp = req.headers['cf-connecting-ip'] ||
                         req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                         req.socket?.remoteAddress;

        const expectedAction = typeof options.action === 'function'
            ? options.action(req)
            : (options.action || req.body?.action);

        const expectedHostnames = options.expectedHostnames || process.env.TURNSTILE_HOSTNAMES;

        const reqHostname = (req.hostname || req.headers?.['host']?.split(':')[0] || '').toLowerCase().trim();

        const verification = await verifyTurnstile({
            token,
            remoteip: clientIp,
            expectedAction,
            expectedHostnames,
            currentHost: reqHostname,
            bypassToken
        });

        if (!verification.success) {
            return res.status(verification.status || 403).json({
                success: false,
                error: verification.error,
                code: verification.code,
                field: 'turnstile',
                details: verification.details
            });
        }

        req.turnstile = verification.data || { bypassed: true };
        next();
    };
}

module.exports = {
    SITEVERIFY_URL,
    isTurnstileEnabled,
    getTurnstileConfigError,
    getSiteKey,
    parseHostnames,
    verifyTurnstile,
    turnstileMiddleware
};
