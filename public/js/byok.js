/**
 * public/js/byok.js
 * BYOK Hub (自備金鑰中心) 客戶端管理腳本
 * 無痕轉發規範：金鑰僅暫存於使用者瀏覽器，伺服器單次記憶體轉發後銷毀，不持久化儲存
 */

(function () {
    const STORAGE_KEY = 'byok_config';

    const PROVIDER_HINTS = {
        'cloudflare': '預設 Cloudflare (本站伺服器端推論)',
        'gemini': 'Google 官方端點 (支援 Gemini 2.0 / 1.5 系列)',
        'groq': 'Groq 推理服務 (極速推理支援)',
        'openai': 'OpenAI 官方端點',
        'xai': 'xAI 官方端點',
        'anthropic': 'Anthropic 官方端點',
        'qwen': '阿里通義千問端點',
        'custom': '自訂相容端點 (如地端 Ollama 或 API 轉發網關)'
    };

    /**
     * 讀取本地端 BYOK 設定（優先檢查 sessionStorage，若無則讀取 localStorage）
     */
    function getBYOKConfig() {
        try {
            const raw = sessionStorage.getItem(STORAGE_KEY) || localStorage.getItem(STORAGE_KEY);
            if (!raw) return { provider: 'cloudflare', apiKey: '', model: '', baseURL: '', remember: true };
            const parsed = JSON.parse(raw);
            return {
                provider: parsed.provider || 'cloudflare',
                apiKey: parsed.apiKey || '',
                model: parsed.model || '',
                baseURL: parsed.baseURL || '',
                remember: parsed.remember !== false
            };
        } catch (e) {
            console.warn('[BYOK] 讀取設定失敗:', e);
            return { provider: 'cloudflare', apiKey: '', model: '', baseURL: '', remember: true };
        }
    }

    /**
     * 儲存 BYOK 設定至 sessionStorage 或 localStorage
     */
    function saveBYOKConfig(config) {
        try {
            if (!config || config.provider === 'cloudflare' || !config.apiKey) {
                sessionStorage.removeItem(STORAGE_KEY);
                localStorage.removeItem(STORAGE_KEY);
            } else {
                const payload = JSON.stringify(config);
                if (config.remember) {
                    localStorage.setItem(STORAGE_KEY, payload);
                    sessionStorage.removeItem(STORAGE_KEY);
                } else {
                    sessionStorage.setItem(STORAGE_KEY, payload);
                    localStorage.removeItem(STORAGE_KEY);
                }
            }
            updateNavbarIndicator();
            return true;
        } catch (e) {
            console.error('[BYOK] 儲存失敗:', e);
            return false;
        }
    }

    /**
     * 取得發送請求所需的 BYOK Headers
     */
    function getBYOKHeaders() {
        const cfg = getBYOKConfig();
        if (cfg && cfg.provider && cfg.provider !== 'cloudflare' && cfg.apiKey && cfg.apiKey.trim()) {
            return {
                'X-BYOK-Provider': cfg.provider.trim(),
                'X-BYOK-Key': cfg.apiKey.trim(),
                'X-BYOK-Model': (cfg.model || '').trim(),
                'X-BYOK-BaseURL': (cfg.baseURL || '').trim()
            };
        }
        return {};
    }

    /**
     * 檢查網址是否屬於合法且受保護之占卜 AI 解盤端點（同源嚴格白名單）
     */
    function shouldInjectBYOK(rawUrl) {
        if (!rawUrl) return false;
        try {
            const parsed = new URL(rawUrl, window.location.origin);
            // 嚴格同源校驗，杜絕將使用者金鑰注入至第三方或跨域請求
            if (parsed.origin !== window.location.origin) {
                return false;
            }
            const path = parsed.pathname;
            // 排除單純讀取系統設定的端點
            if (path === '/api/llm-config') {
                return false;
            }
            // 嚴格白名單匹配
            const isMatch = path === '/api/llm-analysis' ||
                path === '/api/qimen-question' ||
                path === '/api/meihua-question' ||
                path === '/api/name-analysis' ||
                path === '/api/answerbook-question' ||
                path === '/api/liuyao-question' ||
                path === '/api/yinyuan-question' ||
                /^\/api\/[a-z0-9_-]+\/llm-analysis$/.test(path);

            return isMatch;
        } catch {
            return false;
        }
    }

    // 暴露全域輔助函式
    window.getBYOKConfig = getBYOKConfig;
    window.saveBYOKConfig = saveBYOKConfig;
    window.getBYOKHeaders = getBYOKHeaders;

    /**
     * 更新導航列 BYOK 按鈕的啟用指示燈
     */
    function updateNavbarIndicator() {
        const cfg = getBYOKConfig();
        const isEnabled = cfg && cfg.provider !== 'cloudflare' && cfg.apiKey && cfg.apiKey.trim();
        const indicators = document.querySelectorAll('.byok-active-indicator');
        indicators.forEach(function (el) {
            el.style.display = isEnabled ? 'inline' : 'none';
        });

        const navBtns = document.querySelectorAll('.byok-nav-btn');
        navBtns.forEach(function (btn) {
            if (isEnabled) {
                btn.title = `自備金鑰中 (${cfg.provider.toUpperCase()})`;
            } else {
                btn.title = '進階設定：自備金鑰中心 (BYOK Hub)';
            }
        });
    }

    /**
     * 顯示狀態訊息
     */
    function showAlert(msg, type = 'info') {
        const alertBox = document.getElementById('byokAlert');
        if (!alertBox) return;
        alertBox.className = `byok-status-alert alert-${type}`;
        alertBox.textContent = msg;
        alertBox.style.display = 'block';
    }

    function clearAlert() {
        const alertBox = document.getElementById('byokAlert');
        if (alertBox) {
            alertBox.style.display = 'none';
            alertBox.textContent = '';
        }
    }

    /**
     * 初始化 Modal 表單互動
     */
    function initBYOKModal() {
        const providerSelect = document.getElementById('byokProvider');
        const customFields = document.getElementById('byokCustomFields');
        const providerHint = document.getElementById('byokProviderHint');
        const apiKeyInput = document.getElementById('byokApiKey');
        const modelInput = document.getElementById('byokModel');
        const modelSelect = document.getElementById('byokModelSelect');
        const baseURLInput = document.getElementById('byokBaseURL');
        const rememberCheckbox = document.getElementById('byokRememberDevice');
        const btnFetchModels = document.getElementById('byokBtnFetchModels');
        const btnTest = document.getElementById('byokBtnTest');
        const btnSave = document.getElementById('byokBtnSave');
        const btnReset = document.getElementById('byokBtnReset');
        const btnToggleVis = document.getElementById('byokToggleKeyVis');

        if (!providerSelect) return;

        // 載入當前設定
        function syncFormWithConfig() {
            const cfg = getBYOKConfig();
            providerSelect.value = cfg.provider || 'cloudflare';
            apiKeyInput.value = cfg.apiKey || '';
            modelInput.value = cfg.model || '';
            baseURLInput.value = cfg.baseURL || '';
            if (rememberCheckbox) {
                rememberCheckbox.checked = cfg.remember !== false;
            }
            updateProviderView(cfg.provider);
            clearAlert();
        }

        function updateProviderView(provider) {
            providerHint.textContent = PROVIDER_HINTS[provider] || '';
            if (provider === 'cloudflare') {
                customFields.style.display = 'none';
                if (btnTest) btnTest.style.display = 'none';
            } else {
                customFields.style.display = 'block';
                if (btnTest) btnTest.style.display = 'inline-block';
            }
        }

        providerSelect.addEventListener('change', function () {
            updateProviderView(this.value);
            // 供應商切換時重設動態模型選單，避免不同供應商模型名稱混淆
            if (modelSelect) {
                modelSelect.innerHTML = '<option value="">-- 請先點擊動態拉取清單，或手動在下方輸入 --</option>';
                modelSelect.style.display = 'none';
            }
            modelInput.value = '';
            clearAlert();
        });

        // 顯示/隱藏金鑰明文
        if (btnToggleVis) {
            btnToggleVis.addEventListener('click', function () {
                const isPassword = apiKeyInput.type === 'password';
                apiKeyInput.type = isPassword ? 'text' : 'password';
                btnToggleVis.innerHTML = isPassword
                    ? '<i data-lucide="eye-off" style="width: 16px; height: 16px;"></i>'
                    : '<i data-lucide="eye" style="width: 16px; height: 16px;"></i>';
                if (window.lucide && typeof window.lucide.createIcons === 'function') {
                    window.lucide.createIcons();
                }
            });
        }

        // 動態獲取可用模型清單
        if (btnFetchModels) {
            btnFetchModels.addEventListener('click', async function () {
                const provider = providerSelect.value;
                const apiKey = apiKeyInput.value.trim();
                const baseURL = baseURLInput.value.trim();

                if (!apiKey) {
                    showAlert('請先填入 API Key 才能取得模型清單', 'danger');
                    apiKeyInput.focus();
                    return;
                }

                btnFetchModels.disabled = true;
                btnFetchModels.innerHTML = '<i data-lucide="loader" style="width: 13px; height: 13px;"></i> 正在取得清單…';
                if (window.lucide) window.lucide.createIcons();
                showAlert('正在連線向供應商取得可用模型清單…', 'info');

                try {
                    const resp = await fetch('/api/byok/models', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ provider, apiKey, baseURL })
                    });
                    const data = await resp.json();

                    if (!data.success) {
                        throw new Error(data.error || '取得模型失敗');
                    }

                    const models = data.models || [];
                    if (models.length === 0) {
                        showAlert('成功連線，但供應商未回傳任何可用模型', 'info');
                    } else {
                        modelSelect.innerHTML = '<option value="">-- 請由清單選擇模型 --</option>';
                        models.forEach(function (m) {
                            const opt = document.createElement('option');
                            opt.value = m;
                            opt.textContent = m;
                            if (m === modelInput.value.trim()) {
                                opt.selected = true;
                            }
                            modelSelect.appendChild(opt);
                        });
                        modelSelect.style.display = 'block';
                        showAlert(`成功取得 ${models.length} 個可用模型，請直接下拉選取！`, 'success');
                    }
                } catch (err) {
                    showAlert(`取得模型失敗: ${err.message}`, 'danger');
                } finally {
                    btnFetchModels.disabled = false;
                    btnFetchModels.innerHTML = '<i data-lucide="refresh-cw" style="width: 13px; height: 13px;"></i> 動態取得可用模型清單';
                    if (window.lucide) window.lucide.createIcons();
                }
            });
        }

        // 下拉選單選擇時同步到輸入框
        if (modelSelect) {
            modelSelect.addEventListener('change', function () {
                if (this.value) {
                    modelInput.value = this.value;
                }
            });
        }

        // 測試連線
        if (btnTest) {
            btnTest.addEventListener('click', async function () {
                const provider = providerSelect.value;
                const apiKey = apiKeyInput.value.trim();
                const model = modelInput.value.trim();
                const baseURL = baseURLInput.value.trim();

                if (!apiKey) {
                    showAlert('請先填入 API Key 才能測試連線', 'danger');
                    apiKeyInput.focus();
                    return;
                }

                btnTest.disabled = true;
                btnTest.textContent = '測試中…';
                showAlert('正在發送測試請求至供應商…', 'info');

                try {
                    const resp = await fetch('/api/byok/test', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ provider, apiKey, model, baseURL })
                    });
                    const data = await resp.json();
                    if (!data.success) {
                        throw new Error(data.error || '連線測試失敗');
                    }
                    showAlert(`✅ 連線成功！供應商回應:「${data.reply || 'OK'}」 (模型: ${data.model || '預設'})`, 'success');
                } catch (err) {
                    showAlert(`❌ 測試失敗: ${err.message}`, 'danger');
                } finally {
                    btnTest.disabled = false;
                    btnTest.innerHTML = '<i data-lucide="zap" style="width: 14px; height: 14px;"></i> 測試連線';
                    if (window.lucide) window.lucide.createIcons();
                }
            });
        }

        // 儲存設定
        if (btnSave) {
            btnSave.addEventListener('click', function () {
                const provider = providerSelect.value;
                const apiKey = apiKeyInput.value.trim();
                const model = modelInput.value.trim();
                const baseURL = baseURLInput.value.trim();
                const remember = rememberCheckbox ? rememberCheckbox.checked : true;

                if (provider !== 'cloudflare' && !apiKey) {
                    showAlert('請填入 API Key，或切換回「Cloudflare (預設)」', 'danger');
                    apiKeyInput.focus();
                    return;
                }

                const config = { provider, apiKey, model, baseURL, remember };
                const saved = saveBYOKConfig(config);

                if (saved) {
                    showAlert('設定已成功儲存！即刻生效。', 'success');
                    setTimeout(function () {
                        if (window.jQuery && typeof window.jQuery.fn.modal === 'function') {
                            window.jQuery('#byokModal').modal('hide');
                        }
                    }, 800);
                } else {
                    showAlert('儲存設定時發生錯誤', 'danger');
                }
            });
        }

        // 清除設定
        if (btnReset) {
            btnReset.addEventListener('click', function () {
                saveBYOKConfig(null);
                syncFormWithConfig();
                showAlert('已還原為本站預設推論模式。', 'info');
            });
        }

        // 當 modal 開啟時重新同步
        if (window.jQuery) {
            window.jQuery('#byokModal').on('show.bs.modal', function () {
                syncFormWithConfig();
                if (window.lucide && typeof window.lucide.createIcons === 'function') {
                    setTimeout(window.lucide.createIcons, 100);
                }
            });
        }

        syncFormWithConfig();
    }

    /**
     * 自動為全站所有導航列掛載 BYOK 入口按鈕（若尚未包含）
     */
    function mountNavbarButton() {
        const navRights = document.querySelectorAll('.navbar-right');
        navRights.forEach(function (navRight) {
            if (!navRight.querySelector('#byokHubToggle')) {
                const li = document.createElement('li');
                li.innerHTML = `
                    <a href="#" id="byokHubToggle" class="byok-nav-btn" role="button" title="自備金鑰中心 (BYOK Hub)">
                        <i data-lucide="key" style="width: 14px; height: 14px; margin-right: 4px; vertical-align: -2px;"></i>
                        <span class="byok-nav-label">BYOK</span>
                        <span class="byok-active-indicator" style="display: none;">●</span>
                    </a>
                `;
                // 插在暗黑切換按鈕旁邊
                const darkModeLi = navRight.querySelector('.dark-mode-toggle')?.closest('li');
                if (darkModeLi) {
                    navRight.insertBefore(li, darkModeLi);
                } else {
                    navRight.prepend(li);
                }
            }
        });

        // 綁定點擊事件喚起 Modal
        document.addEventListener('click', function (e) {
            const btn = e.target.closest('#byokHubToggle');
            if (btn) {
                e.preventDefault();
                if (window.jQuery && typeof window.jQuery.fn.modal === 'function') {
                    window.jQuery('#byokModal').modal('show');
                }
            }
        });

        updateNavbarIndicator();
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
        }
    }

    /**
     * 全域 fetch 攔截器：若使用者啟用了自備金鑰，自動在所有占卜問答/解盤請求附帶 BYOK Headers
     */
    function installFetchInterceptor() {
        const originalFetch = window.fetch;
        window.fetch = async function (url, options = {}) {
            const urlStr = typeof url === 'string' ? url : url?.url || '';

            if (shouldInjectBYOK(urlStr)) {
                const byokHeaders = getBYOKHeaders();
                if (Object.keys(byokHeaders).length > 0) {
                    const currentHeaders = options.headers || {};
                    if (currentHeaders instanceof Headers) {
                        Object.keys(byokHeaders).forEach(function (k) {
                            currentHeaders.set(k, byokHeaders[k]);
                        });
                        options.headers = currentHeaders;
                    } else if (Array.isArray(currentHeaders)) {
                        Object.keys(byokHeaders).forEach(function (k) {
                            options.headers.push([k, byokHeaders[k]]);
                        });
                    } else {
                        options.headers = {
                            ...currentHeaders,
                            ...byokHeaders
                        };
                    }
                }
            }

            return originalFetch.apply(this, [url, options]);
        };

        // jQuery Ajax 攔截器（支援 index.html 首頁的 $.ajax 呼叫）
        if (window.jQuery && typeof window.jQuery.ajaxPrefilter === 'function') {
            window.jQuery.ajaxPrefilter(function (options, originalOptions, jqXHR) {
                const urlStr = options.url || '';
                if (shouldInjectBYOK(urlStr)) {
                    const byokHeaders = getBYOKHeaders();
                    Object.keys(byokHeaders).forEach(function (k) {
                        jqXHR.setRequestHeader(k, byokHeaders[k]);
                    });
                }
            });
        }
    }

    // DOM Ready 初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            mountNavbarButton();
            initBYOKModal();
            installFetchInterceptor();
        });
    } else {
        mountNavbarButton();
        initBYOKModal();
        installFetchInterceptor();
    }
})();
