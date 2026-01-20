(function() {
    var storageKey = 'theme';

    function getStoredTheme() {
        try {
            return localStorage.getItem(storageKey);
        } catch (error) {
            return null;
        }
    }

    function setStoredTheme(theme) {
        try {
            localStorage.setItem(storageKey, theme);
        } catch (error) {
            // Ignore storage errors.
        }
    }

    function getPreferredTheme() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    }

    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        setStoredTheme(theme);

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

    function init() {
        var stored = getStoredTheme();
        var theme = stored || getPreferredTheme();
        applyTheme(theme);

        var toggle = document.getElementById('darkModeToggle');
        if (!toggle) {
            return;
        }

        toggle.addEventListener('click', function(event) {
            event.preventDefault();
            var current = document.documentElement.getAttribute('data-theme') || 'light';
            var next = current === 'dark' ? 'light' : 'dark';
            applyTheme(next);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
