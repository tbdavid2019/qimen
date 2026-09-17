/**
 * 易經風水顧問 · 電子羅盤與中州派九宮物件標註互動模組
 * 包含：
 * 1. 跨平台 PWA 電子羅盤（iOS webkitCompassHeading / Android deviceorientationabsolute + 螢幕旋轉校正）
 * 2. 圓周低通濾波與傾角 (±15°) 穩定度防呆門檻
 * 3. 24 山度數映射、下卦 / 兼向替卦 / 大小空亡線判定與坐向鎖定
 * 4. 7 大類 63 項 Canonical 住宅物件目錄與南上北下九宮格落位標註
 * 5. 最後入路 (entryPath) 循跡與通暢度 (pathQuality) 設定
 * 6. 版本化 localStorage 快照 (fengshui-layout:v1) 與資料不足誠實原則
 */

(function() {
    'use strict';

    // 63 種 Canonical 住宅物件目錄。生產環境唯一來源為 data/fengshui/layout-catalog.json。
    let CATALOG = { version: null, categories: [], items: [] };
    let CATALOG_MAP = new Map();
    async function loadCatalog() {
        try {
            const response = await fetch('/data/fengshui/layout-catalog.json', { credentials: 'same-origin' });
            if (!response.ok) throw new Error(`catalog HTTP ${response.status}`);
            const data = await response.json();
            if (!data || typeof data.version !== 'string' || !Array.isArray(data.categories) || !Array.isArray(data.items) || data.items.length !== 63) {
                throw new Error('invalid layout catalog');
            }
            CATALOG = data;
            CATALOG_MAP = new Map(data.items.map(it => [it.id, it]));
        } catch (error) {
            console.error('無法載入住宅物件目錄，已停用落位標註', error);
            CATALOG = { version: null, categories: [], items: [] };
            CATALOG_MAP = new Map();
        }
    }

    // 24 山幾何常數
    const MOUNTAINS = [
        { name: '子', center: 0, trigram: '坎', palace: '北' },
        { name: '癸', center: 15, trigram: '坎', palace: '北' },
        { name: '丑', center: 30, trigram: '艮', palace: '東北' },
        { name: '艮', center: 45, trigram: '艮', palace: '東北' },
        { name: '寅', center: 60, trigram: '艮', palace: '東北' },
        { name: '甲', center: 75, trigram: '震', palace: '東' },
        { name: '卯', center: 90, trigram: '震', palace: '東' },
        { name: '乙', center: 105, trigram: '震', palace: '東' },
        { name: '辰', center: 120, trigram: '巽', palace: '東南' },
        { name: '巽', center: 135, trigram: '巽', palace: '東南' },
        { name: '巳', center: 150, trigram: '巽', palace: '東南' },
        { name: '丙', center: 165, trigram: '離', palace: '南' },
        { name: '午', center: 180, trigram: '離', palace: '南' },
        { name: '丁', center: 195, trigram: '離', palace: '南' },
        { name: '未', center: 210, trigram: '坤', palace: '西南' },
        { name: '坤', center: 225, trigram: '坤', palace: '西南' },
        { name: '申', center: 240, trigram: '坤', palace: '西南' },
        { name: '庚', center: 255, trigram: '兌', palace: '西' },
        { name: '酉', center: 270, trigram: '兌', palace: '西' },
        { name: '辛', center: 285, trigram: '兌', palace: '西' },
        { name: '戌', center: 300, trigram: '乾', palace: '西北' },
        { name: '乾', center: 315, trigram: '乾', palace: '西北' },
        { name: '亥', center: 330, trigram: '乾', palace: '西北' },
        { name: '壬', center: 345, trigram: '坎', palace: '北' }
    ];

    const TRIGRAM_BOUNDARIES = [22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5];
    const MOUNTAIN_BOUNDARIES = [
        7.5, 22.5, 37.5, 52.5, 67.5, 82.5, 97.5, 112.5,
        127.5, 142.5, 157.5, 172.5, 187.5, 202.5, 217.5, 232.5,
        247.5, 262.5, 277.5, 292.5, 307.5, 322.5, 337.5, 352.5
    ];

    function circularDist(a, b) {
        const diff = Math.abs(a - b) % 360;
        return diff > 180 ? 360 - diff : diff;
    }

    function calcMountain(deg) {
        const norm = ((deg % 360) + 360) % 360;
        let nearestFacing = MOUNTAINS[0];
        let minFDist = 999;
        for (const m of MOUNTAINS) {
            const d = circularDist(norm, m.center);
            if (d < minFDist) { minFDist = d; nearestFacing = m; }
        }
        const sitDeg = (norm + 180) % 360;
        let nearestSitting = MOUNTAINS[0];
        let minSDist = 999;
        for (const m of MOUNTAINS) {
            const d = circularDist(sitDeg, m.center);
            if (d < minSDist) { minSDist = d; nearestSitting = m; }
        }

        // 空亡與格局檢驗
        let minB = 999;
        let nearB = 0;
        for (const b of MOUNTAIN_BOUNDARIES) {
            const d = circularDist(norm, b);
            if (d < minB) { minB = d; nearB = b; }
        }

        let chartType = 'pure';
        let badgeText = '正向下卦';
        let badgeClass = 'badge-pure';

        if (minB <= 1.5) {
            const isTrigram = TRIGRAM_BOUNDARIES.some(tb => Math.abs(tb - nearB) < 0.01);
            chartType = 'void';
            badgeText = isTrigram ? '⚠️ 大空亡線（出卦）' : '⚠️ 小空亡線（差錯）';
            badgeClass = 'badge-void';
        } else if (minFDist > 4.5 && minFDist < 6.0) {
            chartType = 'substitute';
            badgeText = '兼向替卦 (兼星出頭)';
            badgeClass = 'badge-sub';
        } else if (minFDist >= 6.0) {
            chartType = 'candidate';
            badgeText = '兼向邊界';
            badgeClass = 'badge-candidate';
        }

        return {
            heading: norm,
            facingMountain: nearestFacing.name,
            sittingMountain: nearestSitting.name,
            mountKey: `${nearestSitting.name}山${nearestFacing.name}向`,
            facingDir: nearestFacing.palace,
            sittingDir: nearestSitting.palace,
            deviation: Math.round(minFDist * 10) / 10,
            chartType,
            badgeText,
            badgeClass
        };
    }

    // 狀態管理
    const state = {
        compass: {
            heading: null,
            smoothHeading: 180,
            isLocked: false,
            isListening: false,
            northReference: 'magnetic',
            declination: 0,
            headingSource: 'manual',
            accuracy: null,
            pitch: 0,
            roll: 0,
            isTilted: false,
            recentHeadings: [],
            isStable: false
        },
        layout: {
            // 九宮物件：palace -> Array of item ID
            '東南': [], '南': [], '西南': [],
            '東': [],   '中': [], '西': [],
            '東北': [], '北': [], '西北': []
        },
        activeCategoryId: 'spaces',
        activeItemId: null,
        entryPath: [],
        pathQuality: 'unknown'
    };

    const STORAGE_KEY = 'fengshui-layout:v1';

    // 本地存儲快照
    function saveLayoutSnapshot() {
        try {
            const data = {
                version: '1.0.0',
                layout: state.layout,
                entryPath: state.entryPath,
                pathQuality: state.pathQuality,
                updatedAt: new Date().toISOString()
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) {}
    }

    function loadLayoutSnapshot() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return false;
            const data = JSON.parse(raw);
            const validPalaces = Object.keys(state.layout);
            const validLayout = data && data.version === CATALOG.version && data.layout &&
                validPalaces.every(palace => Array.isArray(data.layout[palace])) &&
                Object.keys(data.layout).every(palace => validPalaces.includes(palace)) &&
                validPalaces.every(palace => data.layout[palace].every(id => CATALOG_MAP.has(id)));
            if (!validLayout) {
                localStorage.removeItem(STORAGE_KEY);
                return false;
            }
            state.layout = data.layout;
            if (Array.isArray(data.entryPath)) state.entryPath = data.entryPath;
            if (['open', 'obstructed', 'unknown'].includes(data.pathQuality)) state.pathQuality = data.pathQuality;
            return true;
        } catch (e) {
            try { localStorage.removeItem(STORAGE_KEY); } catch (ignore) {}
            return false;
        }
    }

    // 更新 DOM 與隱藏欄位
    function syncHiddenInputs() {
        const hHeading = document.getElementById('fsHeading');
        const hNorth = document.getElementById('fsNorthReference');
        const hDecl = document.getElementById('fsDeclination');
        const hSource = document.getElementById('fsHeadingSource');
        const hLayout = document.getElementById('fsLayoutObjects');
        const hPath = document.getElementById('fsEntryPath');
        const hQual = document.getElementById('fsPathQuality');

        if (hHeading) hHeading.value = state.compass.heading === null ? '' : state.compass.heading.toFixed(1);
        if (hNorth) hNorth.value = state.compass.northReference;
        if (hDecl) hDecl.value = state.compass.declination;
        if (hSource) hSource.value = state.compass.headingSource;
        if (hLayout) hLayout.value = JSON.stringify(state.layout);
        if (hPath) hPath.value = JSON.stringify(state.entryPath);
        if (hQual) hQual.value = state.pathQuality;

        // 有明確度數時，自動選取下拉表單的 24 山或 8 大方位；未測量時保留使用者選擇
        if (state.compass.heading !== null) {
            const mInfo = calcMountain(state.compass.heading);
            const selectEl = document.getElementById('fengshuiFacing');
            if (selectEl) {
                // 優先比對 24 山，若無比對方位
                let found = false;
                for (let i = 0; i < selectEl.options.length; i++) {
                    if (selectEl.options[i].value === mInfo.mountKey) {
                        selectEl.selectedIndex = i;
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    for (let i = 0; i < selectEl.options.length; i++) {
                        if (selectEl.options[i].value === mInfo.facingDir) {
                            selectEl.selectedIndex = i;
                            break;
                        }
                    }
                }
            }
        }
    }

    // 羅盤角度平滑濾波 (Circular Low-pass Filter)
    function applyHeadingFilter(newDeg) {
        let current = state.compass.smoothHeading;
        let diff = newDeg - current;
        if (diff > 180) diff -= 360;
        if (diff < -180) diff += 360;
        state.compass.smoothHeading = ((current + diff * 0.3) + 360) % 360;
        return state.compass.smoothHeading;
    }

    // 檢查 500ms 內穩定度 (離差 <= 2°)
    function checkStability(deg) {
        const now = Date.now();
        state.compass.recentHeadings.push({ deg, time: now });
        state.compass.recentHeadings = state.compass.recentHeadings.filter(h => now - h.time <= 500);
        if (state.compass.recentHeadings.length < 3) {
            state.compass.isStable = false;
            return false;
        }
        let maxDev = 0;
        for (const h of state.compass.recentHeadings) {
            const d = circularDist(deg, h.deg);
            if (d > maxDev) maxDev = d;
        }
        state.compass.isStable = maxDev <= 2.5;
        return state.compass.isStable;
    }

    function renderCompassUI(deg, accuracy) {
        const displayDeg = Number.isFinite(Number(deg)) ? Number(deg) : 180;
        const mInfo = calcMountain(displayDeg);
        const degText = `${displayDeg.toFixed(1)}°`;
        const degEl = document.getElementById('compassDegreeDisplay');
        const mountEl = document.getElementById('compassMountDisplay');
        const badgeEl = document.getElementById('compassChartTypeBadge');
        const dialNeedle = document.getElementById('compassNeedle');
        const provenanceEl = document.getElementById('compassProvenance');
        const lockBtn = document.getElementById('btnLockCompass');

        if (degEl) degEl.textContent = degText;
        if (mountEl) mountEl.textContent = `${mInfo.mountKey} · ${mInfo.facingDir}方 (偏${mInfo.deviation}°)`;
        if (badgeEl) {
            badgeEl.textContent = mInfo.badgeText;
            badgeEl.className = `compass-badge ${mInfo.badgeClass}`;
        }
        if (dialNeedle) {
            // 旋轉指針 (順時針度數)
            dialNeedle.style.transform = `rotate(${displayDeg}deg)`;
        }
        if (provenanceEl) {
            const accText = accuracy !== null && accuracy !== undefined && Number.isFinite(accuracy) ? `±${Math.round(accuracy)}°` : '未知';
            const srcText = state.compass.headingSource === 'sensor' ? '感測器實時' : '手動微調';
            const tiltText = state.compass.isTilted ? '⚠️ 傾斜' : '水平';
            provenanceEl.textContent = `基準：磁北 | 來源：${srcText} | 精度：${accText} | 姿態：${tiltText}`;
        }

        // 傾角防呆：超過 ±15° 禁止鎖定
        const tiltWarnEl = document.getElementById('compassTiltWarning');
        if (tiltWarnEl) {
            tiltWarnEl.style.display = state.compass.isTilted ? 'block' : 'none';
        }
        if (lockBtn) {
            lockBtn.disabled = state.compass.heading === null || state.compass.isTilted ||
                (state.compass.isListening && !state.compass.isStable);
        }

        syncHiddenInputs();
    }

    // 感測器適配器 (iOS Safari / Android Chrome)
    function handleOrientationEvent(event) {
        if (state.compass.isLocked) return;

        let rawHeading = null;
        let accuracy = null;

        // 檢驗傾角
        const beta = event.beta !== null ? event.beta : 0;
        const gamma = event.gamma !== null ? event.gamma : 0;
        state.compass.pitch = beta;
        state.compass.roll = gamma;
        state.compass.isTilted = Math.abs(beta) > 15 || Math.abs(gamma) > 15;

        // iOS: webkitCompassHeading (0-360° 順時針)
        if (event.webkitCompassHeading !== undefined && event.webkitCompassHeading !== null) {
            rawHeading = Number(event.webkitCompassHeading);
            accuracy = event.webkitCompassAccuracy !== undefined ? Number(event.webkitCompassAccuracy) : null;
            state.compass.northReference = 'magnetic';
            state.compass.headingSource = 'sensor';
        }
        // Android: absolute orientation 的 alpha 以逆時針方向表示。
        // 標準 absolute event 保證 absolute=true；部分瀏覽器可能不填該欄位，
        // 因此也以 event.type 作為可信的 absolute 訊號。一般相對事件不可當羅盤北向。
        else if (event.alpha !== null && event.alpha !== undefined &&
                 (event.type === 'deviceorientationabsolute' || event.absolute === true)) {
            const screenAngle = (window.screen && window.screen.orientation && window.screen.orientation.angle) || 0;
            // 逆時針轉換為順時針地磁方位角並校正螢幕方向
            rawHeading = ((360 - event.alpha + screenAngle) % 360 + 360) % 360;
            state.compass.northReference = 'magnetic';
            state.compass.headingSource = 'sensor';
        }

        if (rawHeading !== null && Number.isFinite(rawHeading)) {
            const smoothed = applyHeadingFilter(rawHeading);
            checkStability(smoothed);
            state.compass.heading = smoothed;
            state.compass.accuracy = accuracy;
            renderCompassUI(smoothed, accuracy);
        }
    }

    function markSensorListening(btn) {
        window.addEventListener('deviceorientationabsolute', handleOrientationEvent, true);
        window.addEventListener('deviceorientation', handleOrientationEvent, true);
        state.compass.isListening = true;
        if (btn) {
            btn.innerHTML = '<span class="compass-icon">🧭</span> 羅盤感測中（點擊停止）';
            btn.classList.add('active');
        }
    }

    async function startSensorCompass() {
        const btn = document.getElementById('btnStartCompass');
        state.compass.recentHeadings = [];
        state.compass.isStable = false;

        if (window.isSecureContext === false) {
            alert('電子羅盤需要 HTTPS 安全連線，已保留手動度數輸入與滑桿調整。');
            return;
        }

        // iOS 12.2+ requires a user gesture before requesting sensor permission.
        if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
            try {
                const permission = await DeviceOrientationEvent.requestPermission(true);
                if (permission === 'granted') {
                    markSensorListening(btn);
                } else {
                    alert('未獲取指南針感測權限，已保留下方手動度數輸入與滑桿調整。');
                }
            } catch (e) {
                alert('感測器請求受限：' + (e.message || e));
            }
        }
        // Android 與支援 deviceorientationabsolute 之瀏覽器
        else if ('ondeviceorientationabsolute' in window || 'ondeviceorientation' in window) {
            markSensorListening(btn);
        } else {
            alert('此裝置或環境不支援方向感測器，已啟用手動度數輸入與滑桿調整。');
        }
    }

    function stopSensorCompass() {
        window.removeEventListener('deviceorientation', handleOrientationEvent, true);
        window.removeEventListener('deviceorientationabsolute', handleOrientationEvent, true);
        state.compass.isListening = false;
        state.compass.recentHeadings = [];
        state.compass.isStable = false;
        const btn = document.getElementById('btnStartCompass');
        if (btn) {
            btn.innerHTML = '<span class="compass-icon">🧭</span> 啟動實時電子羅盤';
            btn.classList.remove('active');
        }
    }

    // 鎖定與解鎖坐向
    function lockHeading() {
        if (state.compass.heading === null || !Number.isFinite(state.compass.heading)) {
            alert('尚未取得有效向首度數，請先使用感測器或手動輸入角度。');
            return;
        }
        if (state.compass.isTilted) {
            alert('手機當前傾角較大，請平放握持後再點擊鎖定。');
            return;
        }
        if (state.compass.isListening && (!state.compass.isStable || state.compass.recentHeadings.length < 3)) {
            alert('感測資料仍在穩定中，請稍候再鎖定。');
            return;
        }
        state.compass.isLocked = true;
        const lockBtn = document.getElementById('btnLockCompass');
        const unlockBtn = document.getElementById('btnUnlockCompass');
        if (lockBtn) lockBtn.style.display = 'none';
        if (unlockBtn) unlockBtn.style.display = 'inline-block';
        syncHiddenInputs();
        renderNineGrid();
    }

    function unlockHeading() {
        state.compass.isLocked = false;
        const lockBtn = document.getElementById('btnLockCompass');
        const unlockBtn = document.getElementById('btnUnlockCompass');
        if (lockBtn) lockBtn.style.display = 'inline-block';
        if (unlockBtn) unlockBtn.style.display = 'none';
        syncHiddenInputs();
        renderNineGrid();
    }

    // 手動滑桿 / 數字輸入事件
    function handleManualDegree(newVal) {
        const numericValue = Number(newVal);
        if (!Number.isFinite(numericValue)) return;
        state.compass.heading = ((numericValue % 360) + 360) % 360;
        state.compass.smoothHeading = state.compass.heading;
        state.compass.headingSource = 'manual';
        state.compass.isStable = true;
        state.compass.recentHeadings = [];
        const slider = document.getElementById('compassHeadingSlider');
        const input = document.getElementById('compassHeadingInput');
        if (slider) slider.value = state.compass.heading.toFixed(1);
        if (input) input.value = state.compass.heading.toFixed(1);
        renderCompassUI(state.compass.heading, null);
    }

    // STEP 2: 快速九宮物件標註器邏輯
    function renderCategoryPills() {
        const container = document.getElementById('fsCategoryPills');
        if (!container) return;
        container.innerHTML = CATALOG.categories.map(cat => `
            <button type="button" class="fs-cat-btn ${cat.id === state.activeCategoryId ? 'active' : ''}" data-cat="${cat.id}" role="tab" aria-selected="${cat.id === state.activeCategoryId}">
                ${cat.label} <span class="badge">${cat.count}</span>
            </button>
        `).join('');

        // 綁定類別切換點擊
        container.querySelectorAll('.fs-cat-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                state.activeCategoryId = btn.getAttribute('data-cat');
                renderCategoryPills();
                renderItemButtons();
            });
        });
    }

    function renderItemButtons() {
        const container = document.getElementById('fsItemButtons');
        if (!container) return;
        const items = CATALOG.items.filter(it => it.category === state.activeCategoryId);

        container.innerHTML = items.map(it => `
            <button type="button" class="fs-item-pill ${it.id === state.activeItemId ? 'selected' : ''}" data-id="${it.id}" role="button" aria-pressed="${it.id === state.activeItemId}">
                ${it.label}
            </button>
        `).join('');

        container.querySelectorAll('.fs-item-pill').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                if (state.activeItemId === id) {
                    state.activeItemId = null; // 取消選取
                    announceAria('已取消選取物件');
                } else {
                    state.activeItemId = id;
                    const it = CATALOG_MAP.get(id);
                    if (it) {
                        announceAria(`已選取【${it.label}】，請點選九宮格中相應宮位進行放置`);
                    }
                }
                updateActiveItemDisplay();
                renderItemButtons();
            });
        });
    }

    function updateActiveItemDisplay() {
        const labelEl = document.getElementById('fsActiveItemLabel');
        const hintEl = document.getElementById('fsActiveItemHint');
        if (!labelEl) return;

        if (state.activeItemId) {
            const item = CATALOG_MAP.get(state.activeItemId);
            labelEl.textContent = item ? item.label : state.activeItemId;
            labelEl.classList.add('highlight');
            if (hintEl) {
                hintEl.textContent = item && item.placementMode === 'single'
                    ? '（單一物件：點選新宮位會自動從舊宮位移出）'
                    : '（可放置於多個宮位，再次點擊可移除）';
            }
        } else {
            labelEl.textContent = '尚未選擇（請先點選上方物件標籤）';
            labelEl.classList.remove('highlight');
            if (hintEl) hintEl.textContent = '';
        }
    }

    function announceAria(message) {
        const el = document.getElementById('fsAriaStatus');
        if (el) el.textContent = message;
    }

    // 宮位物件放置與切換 (南在頂、北在底 順序)
    function handlePalaceClick(palaceKey) {
        if (!state.activeItemId) {
            // 如果未選取物件，可提示
            alert(`請先在上方點擊一個要擺放的物件（例如「大門」或「主臥室」），再點選【${palaceKey}】宮。`);
            return;
        }

        const item = CATALOG_MAP.get(state.activeItemId);
        if (!item) return;

        const currentPalaceItems = state.layout[palaceKey] || [];
        const hasItem = currentPalaceItems.includes(state.activeItemId);

        if (hasItem) {
            // 已在該宮位，點擊即移除 (Toggle)
            state.layout[palaceKey] = currentPalaceItems.filter(id => id !== state.activeItemId);
            if (state.activeItemId === 'door.main' && state.entryPath.length > 0 && state.entryPath[0] === palaceKey) {
                state.entryPath.shift();
            }
            announceAria(`已從【${palaceKey}】宮移除【${item.label}】`);
        } else {
            // 若為單一放置模式，先從其他宮位移除
            if (item.placementMode === 'single') {
                for (const p of Object.keys(state.layout)) {
                    state.layout[p] = (state.layout[p] || []).filter(id => id !== state.activeItemId);
                }
            }
            // 放入當前宮位
            state.layout[palaceKey] = [...(state.layout[palaceKey] || []), state.activeItemId];
            if (state.activeItemId === 'door.main') {
                if (state.entryPath.length > 0) {
                    state.entryPath[0] = palaceKey;
                } else {
                    state.entryPath = [palaceKey];
                }
            }
            announceAria(`已將【${item.label}】放置於【${palaceKey}】宮`);
        }

        saveLayoutSnapshot();
        renderNineGrid();
        syncHiddenInputs();
    }

    function removePalaceItem(palaceKey, itemId, event) {
        if (event) event.stopPropagation();
        const it = CATALOG_MAP.get(itemId);
        state.layout[palaceKey] = (state.layout[palaceKey] || []).filter(id => id !== itemId);
        announceAria(`已從【${palaceKey}】宮移除【${it ? it.label : itemId}】`);
        saveLayoutSnapshot();
        renderNineGrid();
        syncHiddenInputs();
    }

    // 24山坐向與三元龍定義（供 Step 2 互動九宮格實時排布玄空飛星）
    const TWENTY_FOUR_MOUNTAINS_MAP = {
        '壬山丙向': { facingDir: '南', sittingDir: '北', dragon: '地' },
        '子山午向': { facingDir: '南', sittingDir: '北', dragon: '天' },
        '癸山丁向': { facingDir: '南', sittingDir: '北', dragon: '人' },
        '丑山未向': { facingDir: '西南', sittingDir: '東北', dragon: '地' },
        '艮山坤向': { facingDir: '西南', sittingDir: '東北', dragon: '天' },
        '寅山申向': { facingDir: '西南', sittingDir: '東北', dragon: '人' },
        '甲山庚向': { facingDir: '西', sittingDir: '東', dragon: '地' },
        '卯山酉向': { facingDir: '西', sittingDir: '東', dragon: '天' },
        '乙山辛向': { facingDir: '西', sittingDir: '東', dragon: '人' },
        '辰山戌向': { facingDir: '西北', sittingDir: '東南', dragon: '地' },
        '巽山乾向': { facingDir: '西北', sittingDir: '東南', dragon: '天' },
        '巳山亥向': { facingDir: '西北', sittingDir: '東南', dragon: '人' },
        '丙山壬向': { facingDir: '北', sittingDir: '南', dragon: '地' },
        '午山子向': { facingDir: '北', sittingDir: '南', dragon: '天' },
        '丁山癸向': { facingDir: '北', sittingDir: '南', dragon: '人' },
        '未山丑向': { facingDir: '東北', sittingDir: '西南', dragon: '地' },
        '坤山艮向': { facingDir: '東北', sittingDir: '西南', dragon: '天' },
        '申山寅向': { facingDir: '東北', sittingDir: '西南', dragon: '人' },
        '庚山甲向': { facingDir: '東', sittingDir: '西', dragon: '地' },
        '酉山卯向': { facingDir: '東', sittingDir: '西', dragon: '天' },
        '辛山乙向': { facingDir: '東', sittingDir: '西', dragon: '人' },
        '戌山辰向': { facingDir: '東南', sittingDir: '西北', dragon: '地' },
        '乾山巽向': { facingDir: '東南', sittingDir: '西北', dragon: '天' },
        '亥山巳向': { facingDir: '東南', sittingDir: '西北', dragon: '人' }
    };

    const PALACE_DRAGONS_MAP = {
        1: { 地: { polarity: '陽' }, 天: { polarity: '陰' }, 人: { polarity: '陰' } },
        2: { 地: { polarity: '陰' }, 天: { polarity: '陽' }, 人: { polarity: '陽' } },
        3: { 地: { polarity: '陽' }, 天: { polarity: '陰' }, 人: { polarity: '陰' } },
        4: { 地: { polarity: '陰' }, 天: { polarity: '陽' }, 人: { polarity: '陽' } },
        5: { 地: { polarity: '陰' }, 天: { polarity: '陽' }, 人: { polarity: '陽' } },
        6: { 地: { polarity: '陰' }, 天: { polarity: '陽' }, 人: { polarity: '陽' } },
        7: { 地: { polarity: '陽' }, 天: { polarity: '陰' }, 人: { polarity: '陰' } },
        8: { 地: { polarity: '陰' }, 天: { polarity: '陽' }, 人: { polarity: '陽' } },
        9: { 地: { polarity: '陽' }, 天: { polarity: '陰' }, 人: { polarity: '陰' } }
    };

    const LUOSHU_ORDER = ['中', '西北', '西', '東北', '南', '北', '西南', '東', '東南'];

    function flyLuoshuClient(centerStar, isForward) {
        const res = {};
        LUOSHU_ORDER.forEach((palace, step) => {
            const star = isForward
                ? (centerStar - 1 + step) % 9 + 1
                : (centerStar - 1 - step + 18) % 9 + 1;
            res[palace] = star;
        });
        return res;
    }

    function getPeriodClient(year) {
        const y = Number(year) || new Date().getFullYear();
        if (y >= 2024 && y <= 2043) return 9;
        if (y >= 2004 && y <= 2023) return 8;
        if (y >= 1984 && y <= 2003) return 7;
        if (y >= 1964 && y <= 1983) return 6;
        if (y >= 1944 && y <= 1963) return 5;
        if (y >= 1924 && y <= 1943) return 4;
        if (y >= 1904 && y <= 1923) return 3;
        if (y >= 1884 && y <= 1903) return 2;
        if (y >= 1864 && y <= 1883) return 1;
        const diff = y - 1864;
        const cyclePos = ((diff % 180) + 180) % 180;
        return Math.floor(cyclePos / 20) + 1;
    }

    function calculateEditorFlyingStars() {
        const selectEl = document.getElementById('fengshuiFacing');
        const yearEl = document.getElementById('moveInYear');
        const moveInYear = yearEl && yearEl.value ? (parseInt(yearEl.value, 10) || 2024) : 2024;

        let facingInput = selectEl && selectEl.value ? selectEl.value : '南';
        if (state.compass.isLocked && state.compass.heading !== null) {
            const mInfo = calcMountain(state.compass.heading);
            facingInput = mInfo.mountKey;
        }

        let mountKey = Object.keys(TWENTY_FOUR_MOUNTAINS_MAP).find(k => k === facingInput || k.includes(facingInput));
        if (!mountKey) {
            const map8 = { 南: '子山午向', 北: '午山子向', 東: '酉山卯向', 西: '卯山酉向', 東南: '乾山巽向', 西北: '巽山乾向', 東北: '坤山艮向', 西南: '艮山坤向' };
            mountKey = map8[facingInput] || '子山午向';
        }

        const mountInfo = TWENTY_FOUR_MOUNTAINS_MAP[mountKey];
        if (!mountInfo) return null;

        const period = getPeriodClient(moveInYear);
        const periodChart = flyLuoshuClient(period, true);

        const sittingDir = mountInfo.sittingDir;
        const facingDir = mountInfo.facingDir;
        const dragonType = mountInfo.dragon;

        const sittingBaseStar = periodChart[sittingDir];
        const sittingDragon = PALACE_DRAGONS_MAP[sittingBaseStar]?.[dragonType] || { polarity: '陽' };
        const isMountainForward = sittingDragon.polarity === '陽';
        const mountainChart = flyLuoshuClient(sittingBaseStar, isMountainForward);

        const facingBaseStar = periodChart[facingDir];
        const facingDragon = PALACE_DRAGONS_MAP[facingBaseStar]?.[dragonType] || { polarity: '陽' };
        const isFacingForward = facingDragon.polarity === '陽';
        const facingChart = flyLuoshuClient(facingBaseStar, isFacingForward);

        return {
            mountKey,
            period,
            periodChart,
            mountainChart,
            facingChart
        };
    }

    // 渲染南上北下九宮盤
    const PALACE_ORDER = [
        { key: '東南', trigram: '巽', name: '東南' },
        { key: '南',   trigram: '離', name: '南' },
        { key: '西南', trigram: '坤', name: '西南' },
        { key: '東',   trigram: '震', name: '東' },
        { key: '中',   trigram: '',   name: '中宮' },
        { key: '西',   trigram: '兌', name: '西' },
        { key: '東北', trigram: '艮', name: '東北' },
        { key: '北',   trigram: '坎', name: '北' },
        { key: '西北', trigram: '乾', name: '西北' }
    ];

    function renderNineGrid() {
        const container = document.getElementById('fsNineGridBoard');
        if (!container) return;

        const mInfo = state.compass.heading === null ? null : calcMountain(state.compass.heading);
        const starsData = calculateEditorFlyingStars();

        container.innerHTML = PALACE_ORDER.map(p => {
            const items = state.layout[p.key] || [];
            const isSitting = mInfo ? mInfo.sittingDir === p.key : false;
            const isFacing = mInfo ? mInfo.facingDir === p.key : false;

            let tagDesc = '';
            if (isSitting) tagDesc = '<span class="fs-sit-face-tag sit">坐山</span>';
            if (isFacing) tagDesc = '<span class="fs-sit-face-tag face">向首</span>';

            let starsHtml = '';
            let starsAria = '';
            if (starsData) {
                const isCenter = p.key === '中';
                const pStar = isCenter ? starsData.period : (starsData.periodChart[p.key] || '-');
                const mStar = starsData.mountainChart[p.key] || '-';
                const fStar = starsData.facingChart[p.key] || '-';
                starsHtml = `
                    <div class="fs-cell-stars-preview" title="運星 ${pStar} · 山星 ${mStar} · 向星 ${fStar}">
                        <span class="fs-pstar-period">${pStar}運</span>
                        <span class="fs-pstar-m">山${mStar}</span>
                        <span class="fs-pstar-f">向${fStar}</span>
                    </div>
                `;
                starsAria = `，運星${pStar}，山星${mStar}，向星${fStar}`;
            }

            const itemsHtml = items.map(id => {
                const it = CATALOG_MAP.get(id);
                const label = it ? it.label : id;
                return `
                    <span class="fs-grid-tag" title="${label}">
                        ${label}
                        <button type="button" class="fs-tag-remove" data-palace="${p.key}" data-id="${id}" aria-label="從${p.key}宮移除${label}">×</button>
                    </span>
                `;
            }).join('');

            return `
                <div class="fs-palace-cell ${p.key === '中' ? 'center-cell' : ''}" data-palace="${p.key}" tabindex="0" role="button" aria-label="${p.key}宮位${starsAria}">
                    <div class="fs-palace-header">
                        <div class="fs-palace-name-row">
                            <span class="fs-palace-name">${p.name} ${p.trigram ? `(${p.trigram})` : ''}</span>
                            ${tagDesc}
                        </div>
                        ${starsHtml}
                    </div>
                    <div class="fs-palace-items-box">
                        ${itemsHtml || '<span class="fs-empty-hint">點此放置物件</span>'}
                    </div>
                </div>
            `;
        }).join('');

        // 綁定宮位點擊與鍵盤事件
        container.querySelectorAll('.fs-palace-cell').forEach(cell => {
            cell.addEventListener('click', () => {
                const palace = cell.getAttribute('data-palace');
                handlePalaceClick(palace);
            });
            cell.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    handlePalaceClick(cell.getAttribute('data-palace'));
                }
            });
        });

        // 綁定個別標籤移除點擊與鍵盤事件
        container.querySelectorAll('.fs-tag-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const palace = btn.getAttribute('data-palace');
                const id = btn.getAttribute('data-id');
                removePalaceItem(palace, id, e);
            });
            btn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    const palace = btn.getAttribute('data-palace');
                    const id = btn.getAttribute('data-id');
                    removePalaceItem(palace, id, e);
                }
            });
        });

        renderEntryPathUI();
    }

    // 入路與通暢度 UI
    function renderEntryPathUI() {
        const pathDisplay = document.getElementById('fsEntryPathDisplay');
        const qualitySelect = document.getElementById('fsPathQualitySelect');

        if (pathDisplay) {
            if (state.entryPath.length > 0) {
                pathDisplay.innerHTML = state.entryPath.map((p, idx) => `
                    <span class="fs-path-step">${p}</span>
                    ${idx < state.entryPath.length - 1 ? '<span class="fs-path-arrow">→</span>' : ''}
                `).join('') + ' <button type="button" id="btnClearPath" class="btn btn-xs btn-default" style="margin-left:8px;">清空入路</button>';

                const clearBtn = document.getElementById('btnClearPath');
                if (clearBtn) {
                    clearBtn.addEventListener('click', () => {
                        state.entryPath = [];
                        announceAria('已清空進門入路動線');
                        saveLayoutSnapshot();
                        renderEntryPathUI();
                        syncHiddenInputs();
                    });
                }
            } else {
                pathDisplay.innerHTML = '<span class="text-muted">未設定（可依序點擊宮位建立入路循跡）</span>';
            }
        }

        if (qualitySelect) {
            qualitySelect.value = state.pathQuality;
        }
    }

    // 初始化與綁定
    async function init() {
        await loadCatalog();
        loadLayoutSnapshot();

        // 渲染類別與初始清單
        renderCategoryPills();
        renderItemButtons();
        updateActiveItemDisplay();
        renderNineGrid();

        // 綁定電子羅盤啟動按鈕
        const btnCompass = document.getElementById('btnStartCompass');
        if (btnCompass) {
            btnCompass.addEventListener('click', () => {
                if (state.compass.isListening) {
                    stopSensorCompass();
                } else {
                    startSensorCompass();
                }
            });
        }

        // 綁定鎖定 / 解鎖按鈕
        const lockBtn = document.getElementById('btnLockCompass');
        const unlockBtn = document.getElementById('btnUnlockCompass');
        if (lockBtn) lockBtn.addEventListener('click', lockHeading);
        if (unlockBtn) unlockBtn.addEventListener('click', unlockHeading);

        // 綁定手動微調滑桿與輸入框
        const slider = document.getElementById('compassHeadingSlider');
        const numInput = document.getElementById('compassHeadingInput');
        if (slider) {
            slider.addEventListener('input', (e) => handleManualDegree(e.target.value));
        }
        if (numInput) {
            numInput.addEventListener('change', (e) => handleManualDegree(e.target.value));
        }

        // 清空格局按鈕
        const clearGridBtn = document.getElementById('btnClearNineGrid');
        if (clearGridBtn) {
            clearGridBtn.addEventListener('click', () => {
                if (confirm('確定要清空目前九宮中所有的住宅物件標註嗎？')) {
                    for (const p of Object.keys(state.layout)) {
                        state.layout[p] = [];
                    }
                    state.entryPath = [];
                    announceAria('已清空九宮中所有住宅物件標註');
                    saveLayoutSnapshot();
                    renderNineGrid();
                    syncHiddenInputs();
                }
            });
        }

        // 入路通暢度選擇
        const qualitySelect = document.getElementById('fsPathQualitySelect');
        if (qualitySelect) {
            qualitySelect.addEventListener('change', (e) => {
                state.pathQuality = e.target.value;
                saveLayoutSnapshot();
                syncHiddenInputs();
            });
        }

        // 入路新增宮位按鈕組
        const addPathContainer = document.getElementById('fsAddPathPalaces');
        if (addPathContainer) {
            addPathContainer.querySelectorAll('.fs-add-path-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const palace = btn.getAttribute('data-palace');
                    const doorPalace = Object.entries(state.layout).find(([, items]) => items.includes('door.main'))?.[0];
                    if (state.entryPath.length === 0 && doorPalace && palace !== doorPalace) {
                        alert(`大門已標註於【${doorPalace}】宮，進門動線第一步必須為大門所在宮位。已自動為您由【${doorPalace}】開始！`);
                        state.entryPath.push(doorPalace);
                        announceAria(`已自動將大門所在【${doorPalace}】宮作為入路第一步`);
                        if (state.entryPath.length < 9) {
                            state.entryPath.push(palace);
                            announceAria(`已將【${palace}】宮加入進門入路動線`);
                        }
                    } else if (state.entryPath.length < 9) {
                        state.entryPath.push(palace);
                        announceAria(`已將【${palace}】宮加入進門入路動線`);
                    }
                    saveLayoutSnapshot();
                    renderEntryPathUI();
                    syncHiddenInputs();
                });
            });
        }

        // 房屋朝向與入住年份變更時即時重排九宮星曜
        const facingSelect = document.getElementById('fengshuiFacing');
        if (facingSelect) {
            facingSelect.addEventListener('change', () => {
                renderNineGrid();
            });
        }

        const moveInYearInput = document.getElementById('moveInYear');
        if (moveInYearInput) {
            moveInYearInput.addEventListener('input', () => {
                renderNineGrid();
            });
            moveInYearInput.addEventListener('change', () => {
                renderNineGrid();
            });
        }

        // 初始度數渲染
        renderCompassUI(state.compass.heading, null);
    }

    // 暴露全域 Payload Hook 給 divination-suite.js 使用
    window.getFengshuiLayoutPayload = function() {
        return {
            ...(state.compass.heading !== null ? {
                heading: Number(state.compass.heading.toFixed(1)),
                northReference: state.compass.northReference,
                declination: state.compass.declination,
                headingSource: state.compass.headingSource
            } : {}),
            layoutObjects: state.layout,
            entryPath: state.entryPath,
            pathQuality: state.pathQuality
        };
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
