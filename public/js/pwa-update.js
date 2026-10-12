(function () {
    var buildMeta = document.querySelector('meta[name="pwa-build-id"]');
    var banner = document.getElementById('pwa-update-banner');
    var message = document.getElementById('pwa-update-message');
    var updateButton = document.getElementById('pwa-update-action');
    var laterButton = document.getElementById('pwa-update-later');
    var buildId = buildMeta && buildMeta.content;
    var storageKey = 'qimen-pwa-update-dismissed';
    var simplifiedChinese = document.documentElement.lang.toLowerCase() === 'zh-cn';

    if (!buildId || !banner || !message || !updateButton || !laterButton || !('serviceWorker' in navigator)) {
        return;
    }

    var registration = null;
    var applyingUpdate = false;

    function isDismissedForThisRelease() {
        try {
            var dismissed = JSON.parse(localStorage.getItem(storageKey) || 'null');
            return dismissed && dismissed.buildId === buildId && Date.now() - dismissed.at < 24 * 60 * 60 * 1000;
        } catch (error) {
            return false;
        }
    }

    function showUpdate() {
        if (isDismissedForThisRelease()) return;
        banner.hidden = false;
    }

    function dismissUpdate() {
        try {
            localStorage.setItem(storageKey, JSON.stringify({ buildId: buildId, at: Date.now() }));
        } catch (error) {
            // Keep the current page usable when storage is unavailable.
        }
        banner.hidden = true;
    }

    laterButton.addEventListener('click', dismissUpdate);

    updateButton.addEventListener('click', function () {
        if (updateButton.dataset.action === 'reload') {
            window.location.reload();
            return;
        }

        var waitingWorker = registration && registration.waiting;
        if (!waitingWorker) {
            banner.hidden = true;
            return;
        }

        applyingUpdate = true;
        updateButton.disabled = true;
        updateButton.setAttribute('aria-busy', 'true');
        message.textContent = simplifiedChinese ? '正在准备更新…' : '正在準備更新…';
        waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    });

    navigator.serviceWorker.addEventListener('controllerchange', function () {
        if (!applyingUpdate) return;

        applyingUpdate = false;
        message.textContent = simplifiedChinese ? '新版已就绪，重新加载后应用。' : '新版已備妥，重新載入後套用。';
        updateButton.dataset.action = 'reload';
        updateButton.textContent = simplifiedChinese ? '重新加载 ➜' : '重新載入 ➜';
        updateButton.disabled = false;
        updateButton.removeAttribute('aria-busy');
        laterButton.hidden = false;
    });

    navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).then(function (serviceWorkerRegistration) {
        registration = serviceWorkerRegistration;
        if (registration.waiting) showUpdate();

        var observedInstallingWorker = null;
        function watchInstallingWorker() {
            var installingWorker = registration.installing;
            if (!installingWorker || installingWorker === observedInstallingWorker) return;

            observedInstallingWorker = installingWorker;
            installingWorker.addEventListener('statechange', function () {
                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    showUpdate();
                }
            });
        }

        registration.addEventListener('updatefound', function () {
            watchInstallingWorker();
        });
        watchInstallingWorker();

        document.addEventListener('visibilitychange', function () {
            if (document.visibilityState === 'visible') registration.update().catch(function () {});
        });
    }).catch(function () {
        // PWA update support is optional; the online page continues to work without it.
    });
})();
