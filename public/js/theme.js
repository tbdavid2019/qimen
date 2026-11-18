(function() {
    var storageKey = 'theme';

    function isValidTheme(val) {
        return val === 'light' || val === 'dark';
    }

    function getStoredTheme() {
        try {
            var v = localStorage.getItem(storageKey);
            return isValidTheme(v) ? v : null;
        } catch (_error) {
            return null;
        }
    }

    function setStoredTheme(theme) {
        try {
            if (isValidTheme(theme)) {
                localStorage.setItem(storageKey, theme);
            } else {
                localStorage.removeItem(storageKey);
            }
        } catch (_error) {
            // Ignore storage errors.
        }
    }

    function getPreferredTheme() {
        try {
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                return 'dark';
            }
        } catch (_error) {}
        return 'light';
    }

    function updateColorSchemeMeta(metaContent) {
        var meta = document.querySelector('meta[name="color-scheme"]');
        if (!meta && document.head) {
            meta = document.createElement('meta');
            meta.name = 'color-scheme';
            document.head.appendChild(meta);
        }
        if (meta) {
            meta.setAttribute('content', metaContent);
        }
    }

    function syncToggleUI(theme) {
        var toggle = document.getElementById('darkModeToggle');
        if (!toggle) {
            return;
        }

        var label = toggle.querySelector('.dark-mode-label');
        var labelLight = toggle.getAttribute('data-label-light') || 'Dark';
        var labelDark = toggle.getAttribute('data-label-dark') || 'Light';
        var titleLight = toggle.getAttribute('data-title-light') || 'Switch to dark mode';
        var titleDark = toggle.getAttribute('data-title-dark') || 'Switch to light mode';
        var isDark = theme === 'dark';

        toggle.setAttribute('aria-pressed', isDark ? 'true' : 'false');
        toggle.setAttribute('title', isDark ? titleDark : titleLight);
        if (label) {
            label.textContent = isDark ? labelDark : labelLight;
        }
    }

    function applyTheme(theme, options) {
        var opts = options || {};
        var resolved = isValidTheme(theme) ? theme : getPreferredTheme();
        var persist = opts.persist !== false;
        var preferred = getPreferredTheme();

        document.documentElement.setAttribute('data-theme', resolved);

        if (persist) {
            if (opts.forcePin || resolved !== preferred) {
                setStoredTheme(resolved);
                updateColorSchemeMeta(resolved);
            } else {
                setStoredTheme(null);
                updateColorSchemeMeta('light dark');
            }
        } else {
            var stored = getStoredTheme();
            updateColorSchemeMeta(stored ? stored : 'light dark');
        }

        syncToggleUI(resolved);
        return resolved;
    }

    function showToast(message, type) {
        var kind = type || 'warning';
        var text = String(message == null ? '' : message);
        var container = document.getElementById('suiteToastContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'suiteToastContainer';
            container.className = 'suite-toast-container';
            container.setAttribute('role', 'status');
            container.setAttribute('aria-live', 'polite');
            container.setAttribute('aria-atomic', 'true');
            document.body.appendChild(container);
        }

        var toast = document.createElement('div');
        toast.className = 'suite-toast suite-toast-' + kind;

        var iconWrap = document.createElement('span');
        iconWrap.className = 'toast-icon';
        iconWrap.setAttribute('aria-hidden', 'true');
        var iconName = 'info';
        if (kind === 'success') iconName = 'check-circle';
        else if (kind === 'error') iconName = 'alert-triangle';
        else if (kind === 'warning') iconName = 'alert-circle';
        var iconEl = document.createElement('i');
        iconEl.setAttribute('data-lucide', iconName);
        iconWrap.appendChild(iconEl);

        var textEl = document.createElement('span');
        textEl.className = 'toast-text';
        textEl.textContent = text;

        toast.appendChild(iconWrap);
        toast.appendChild(textEl);
        container.appendChild(toast);

        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
        }

        var reduced = false;
        try {
            reduced = Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
        } catch (_e) {}

        function removeToast() {
            if (!toast.classList.contains('closing')) {
                if (reduced) {
                    if (toast.parentNode) toast.parentNode.removeChild(toast);
                    return;
                }
                toast.classList.add('closing');
                setTimeout(function() {
                    if (toast.parentNode) toast.parentNode.removeChild(toast);
                }, 220);
            }
        }
        toast.addEventListener('click', removeToast);
        setTimeout(removeToast, kind === 'error' ? 5500 : 4000);
    }

    function showFieldError(inputEl, message) {
        if (!inputEl) {
            showToast(message, 'warning');
            return;
        }
        var errId = (inputEl.id || 'field') + '-inline-error';
        var existing = document.getElementById(errId);
        if (!existing) {
            existing = document.createElement('div');
            existing.id = errId;
            existing.className = 'suite-field-error';
            existing.setAttribute('role', 'alert');
            var parent = inputEl.closest('.input-group, .form-group, .suite-form-group') || inputEl.parentNode;
            if (parent) {
                parent.appendChild(existing);
            }
        }
        existing.textContent = String(message == null ? '' : message);
        inputEl.classList.add('suite-input-invalid');
        inputEl.setAttribute('aria-invalid', 'true');
        var prevDesc = (inputEl.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
        if (prevDesc.indexOf(errId) === -1) {
            prevDesc.push(errId);
            inputEl.setAttribute('aria-describedby', prevDesc.join(' '));
        }
        try {
            inputEl.focus({ preventScroll: false });
        } catch (_e) {
            if (typeof inputEl.focus === 'function') inputEl.focus();
        }
        if (!inputEl.dataset.suiteErrorBound) {
            inputEl.dataset.suiteErrorBound = '1';
            var clearErr = function() {
                inputEl.classList.remove('suite-input-invalid');
                inputEl.removeAttribute('aria-invalid');
                var el = document.getElementById(errId);
                if (el && el.parentNode) el.parentNode.removeChild(el);
                var cleaned = (inputEl.getAttribute('aria-describedby') || '')
                    .split(/\s+/)
                    .filter(function(token) { return token && token !== errId; });
                if (cleaned.length) inputEl.setAttribute('aria-describedby', cleaned.join(' '));
                else inputEl.removeAttribute('aria-describedby');
            };
            inputEl.addEventListener('input', clearErr);
            inputEl.addEventListener('change', clearErr);
        }
    }

    window.applySuiteTheme = applyTheme;
    window.showToast = showToast;
    window.showSuiteToast = showToast;
    window.showSuiteFieldError = showFieldError;

    function centerActiveNavItem() {
        if (!document || typeof document.querySelectorAll !== 'function') return;
        var navContainers = document.querySelectorAll('.navbar-inverse .navbar-collapse.collapse, .suite-nav-inner');
        for (var i = 0; i < navContainers.length; i++) {
            var navInner = navContainers[i];
            if (!navInner || navInner.scrollWidth <= navInner.clientWidth) continue;
            var activeItem = navInner.querySelector('li.active, .suite-nav-pill.active');
            if (!activeItem) {
                var link = navInner.querySelector('a[href="' + location.pathname + '"]');
                if (link) activeItem = link.parentElement || link;
            }
            if (activeItem) {
                var targetLeft = Math.max(0, activeItem.offsetLeft - navInner.clientWidth / 2 + activeItem.offsetWidth / 2);
                if (typeof navInner.scrollTo === 'function') {
                    navInner.scrollTo({ left: targetLeft, behavior: 'auto' });
                } else {
                    navInner.scrollLeft = targetLeft;
                }
            }
        }
    }

    function init() {
        var stored = getStoredTheme();
        applyTheme(stored || getPreferredTheme(), { persist: false });
        centerActiveNavItem();

        window.addEventListener('storage', function(event) {
            if (event.key === storageKey) {
                applyTheme(isValidTheme(event.newValue) ? event.newValue : getPreferredTheme(), { persist: false });
            }
        });

        try {
            var mq = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
            if (mq && typeof mq.addEventListener === 'function') {
                mq.addEventListener('change', function() {
                    if (!getStoredTheme()) {
                        applyTheme(getPreferredTheme(), { persist: false });
                    }
                });
            }
        } catch (_error) {}

        var toggle = document.getElementById('darkModeToggle');
        if (!toggle) {
            return;
        }

        toggle.addEventListener('click', function(event) {
            event.preventDefault();
            var current = document.documentElement.getAttribute('data-theme') || 'light';
            var next = current === 'dark' ? 'light' : 'dark';
            applyTheme(next, { persist: true });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
