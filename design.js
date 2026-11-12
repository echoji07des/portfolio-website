/* ==========================================================
   Сторінка Design side:
   1) бічне меню: відкрите при завантаженні, кнопка хрестик <-> бургер
   2) кнопка налаштувань cookie (поп-ап буде пізніше)
   Розділи меню (Order service, Portfolio, Products, Legal) — окремі сторінки,
   крапка біля поточної сторінки стоїть у розмітці (клас is-active).
   ========================================================== */

(function () {
    "use strict";

    const body    = document.body;
    const toggle  = document.getElementById("menu-toggle");
    const menu    = document.getElementById("site-menu");
    if (!toggle || !menu) return;

    const mobile = window.matchMedia("(max-width: 900px)");

    function label(key, fallback) {
        const t = window.SiteI18n && window.SiteI18n.t;
        return t ? t(key) : fallback;
    }

    /* ---------- Меню ---------- */

    function setOpen(open) {
        body.classList.toggle("menu-open", open);
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
        toggle.setAttribute("aria-label", open ? label("menu.close", "Close menu") : label("menu.open", "Open menu"));
    }

    // При відкритті сторінки меню завжди відкрите
    setOpen(true);

    toggle.addEventListener("click", () => {
        setOpen(!body.classList.contains("menu-open"));
    });

    // На планшеті й телефоні меню лежить поверх сторінки — після кліку по поточній сторінці закриваємо
    menu.querySelectorAll(".menu-link").forEach(link => {
        link.addEventListener("click", () => {
            if (mobile.matches) setOpen(false);
        });
    });

    document.addEventListener("keydown", e => {
        if (e.key === "Escape" && mobile.matches && body.classList.contains("menu-open")) {
            setOpen(false);
        }
    });

    // Підпис кнопки оновлюємо при зміні мови
    document.addEventListener("sitelanguagechange", () => {
        setOpen(body.classList.contains("menu-open"));
    });

    /* ---------- Налаштування cookie ---------- */

    const cookieBtn = document.getElementById("cookie-settings");
    if (cookieBtn) {
        // Поп-ап і сторінка налаштувань будуть пізніше: тут лише подія, на яку їх можна повісити
        cookieBtn.addEventListener("click", () => {
            document.dispatchEvent(new CustomEvent("cookiesettings:open"));
        });
    }
})();
