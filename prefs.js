/* ==========================================================
   Налаштування відвідувача (зберігаються в браузері):
   1) Accessible font — увесь сайт переходить на Atkinson Hyperlegible
   2) Light / Dark theme — ставить data-theme="light" або "dark" на <html>.
      Стилів темної теми поки немає — їх додасть власниця сайту:
          html[data-theme="dark"] { ... }
   Підключається в <head>, щоб налаштування застосувалися до першого малювання сторінки.
   ========================================================== */

(function () {
    "use strict";

    var FONT_KEY  = "echoji07-font";    // "accessible" | "default"
    var THEME_KEY = "echoji07-theme";   // "light" | "dark"
    var FONT_URL  = "https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&display=swap";
    var root = document.documentElement;

    function read(key) {
        try { return localStorage.getItem(key); } catch (e) { return null; }
    }

    function write(key, value) {
        try { localStorage.setItem(key, value); } catch (e) { /* приватний режим */ }
    }

    // Шрифт підвантажується лише тоді, коли його вмикають (решті відвідувачів він не потрібен)
    function loadFontOnce() {
        if (document.getElementById("a11y-font-css")) return;
        var link = document.createElement("link");
        link.id = "a11y-font-css";
        link.rel = "stylesheet";
        link.href = FONT_URL;
        document.head.appendChild(link);
    }

    function applyFont(on) {
        root.classList.toggle("font-accessible", on);
        if (on) loadFontOnce();
    }

    function applyTheme(theme) {
        root.setAttribute("data-theme", theme);
    }

    window.SitePrefs = {
        isAccessibleFont: function () {
            return root.classList.contains("font-accessible");
        },
        setAccessibleFont: function (on) {
            applyFont(!!on);
            write(FONT_KEY, on ? "accessible" : "default");
        },
        getTheme: function () {
            return root.getAttribute("data-theme") === "dark" ? "dark" : "light";
        },
        setTheme: function (theme) {
            var next = theme === "dark" ? "dark" : "light";
            applyTheme(next);
            write(THEME_KEY, next);
        }
    };

    applyFont(read(FONT_KEY) === "accessible");
    applyTheme(read(THEME_KEY) === "dark" ? "dark" : "light");
})();
