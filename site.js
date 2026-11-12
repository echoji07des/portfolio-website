/* ==========================================================
   Загальна логіка сайту:
   1) переклад EN <-> UA (словник нижче, текст береться з data-i18n)
   2) годинник за київським часом (з автоматичним переходом
      на літній/зимовий час, не залежить від часового поясу відвідувача)
   ========================================================== */

(function () {
    "use strict";

    /* ---------- Словник перекладів ---------- */
    const I18N = {
        en: {
            "design.title": "Design Side",
            "design.desc": "Hi! I’m Anhelina, UI/UX designer that don’t just design interfaces — I bring them to life with code, creating digital products from idea to launch.",
            "art.title": "Artist Side",
            "art.desc": "Hi! I’m Anhelina, an artist who specializes in digital 2D illustration with original characters. I also write stories about them.",
            "explore": "explore",
            "chip.order": "Order Service",
            "chip.about": "About Me",
            "chip.legal": "Legal",
            "chip.uiux": "UI/UX Projects",
            "chip.products": "Products",
            "chip.cv": "CV",
            "chip.graphic": "Graphic design Projects",
            "chip.characters": "Characters",
            "chip.stories": "Stories",
            "chip.commission": "Commission Price",
            "chip.gallery": "Art Gallery",
            "chip.shop": "Shop",
            "search.placeholder": "Search by keywords...",
            "time.label": "Local time (Kyiv):",
            "side.design": "Design side",
            "side.art": "Artist side",
            "menu.about": "About me",
            "menu.order": "Order service",
            "menu.portfolio": "Portfolio",
            "menu.products": "Products",
            "menu.legal": "Legal",
            "menu.open": "Open menu",
            "menu.close": "Close menu",
            "nav.home": "Home Page",
            "nav.art": "Art Side",
            "cookie.settings": "Settings",
            "cookie.aria": "Cookie settings",
            "about.p1": "Hi, I’m Angelina, and I design websites. The development process begins with competitor research to determine how best to help your specific business and make it stand out.",
            "about.p2": "I seek a development approach that is both original and practical—ensuring a seamless user experience for future clients while making the development process smooth for programmers."
        },
        uk: {
            "design.title": "Дизайн",
            "design.desc": "Привіт! Я Ангеліна, UI/UX-дизайнерка, яка не просто створює інтерфейси — я оживляю їх кодом, створюючи цифрові продукти від ідеї до запуску.",
            "art.title": "Арт",
            "art.desc": "Привіт! Я Ангеліна, художниця, що спеціалізується на цифровій 2D-ілюстрації з авторськими персонажами. Також пишу історії про них.",
            "explore": "відкрити",
            "chip.order": "Замовити послугу",
            "chip.about": "Про мене",
            "chip.legal": "Правова інформація",
            "chip.uiux": "UI/UX-проєкти",
            "chip.products": "Продукти",
            "chip.cv": "Резюме",
            "chip.graphic": "Графічний дизайн",
            "chip.characters": "Персонажі",
            "chip.stories": "Історії",
            "chip.commission": "Прайс на комішки",
            "chip.gallery": "Арт-галерея",
            "chip.shop": "Магазин",
            "search.placeholder": "Пошук за словами...",
            "time.label": "Місцевий час (Київ):",
            "side.design": "Дизайн-сторона",
            "side.art": "Арт-сторона",
            "menu.about": "Про мене",
            "menu.order": "Замовити послугу",
            "menu.portfolio": "Портфоліо",
            "menu.products": "Продукти",
            "menu.legal": "Правова інформація",
            "menu.open": "Відкрити меню",
            "menu.close": "Закрити меню",
            "nav.home": "На головну",
            "nav.art": "Арт Сторінка",
            "cookie.settings": "Налаштування",
            "cookie.aria": "Налаштування cookie",
            "about.p1": "Привіт, я Ангеліна, і я проєктую вебсайти. Розробка починається з аналізу конкурентів, щоб визначити, як найкраще допомогти саме вашому бізнесу та виділити його серед інших.",
            "about.p2": "Я шукаю підхід, який є і оригінальним, і практичним: зручний досвід для майбутніх клієнтів і зрозумілий, плавний процес розробки для програмістів."
        }
    };

    const STORAGE_KEY = "echoji07-lang";
    let lang = "en";

    function t(key) {
        const dict = I18N[lang] || I18N.en;
        return dict[key] !== undefined ? dict[key] : (I18N.en[key] || key);
    }

    /* ---------- Київський час ---------- */
    const TZ_CANDIDATES = ["Europe/Kyiv", "Europe/Kiev"];
    const formatters = {};

    function kyivFormatter(kind) {
        if (formatters[kind]) return formatters[kind];
        for (const tz of TZ_CANDIDATES) {
            try {
                const opts = kind === "offset"
                    ? { timeZone: tz, timeZoneName: "shortOffset" }
                    : kind === "en"
                        ? { timeZone: tz, hour: "numeric", minute: "2-digit", hour12: true }
                        : { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false };
                const locale = kind === "uk" ? "en-GB" : "en-US";
                formatters[kind] = new Intl.DateTimeFormat(locale, opts);
                return formatters[kind];
            } catch (e) { /* пробуємо наступну назву зони */ }
        }
        return null;
    }

    function updateClock() {
        const el = document.getElementById("kyiv-time");
        if (!el) return;
        const now = new Date();
        const fmt = kyivFormatter(lang === "uk" ? "uk" : "en");
        if (!fmt) { el.textContent = ""; return; }

        // EN: "4:56PM" (без пробілу, як у макеті), UA: "16:56"
        let text = fmt.format(now).replace(/\s/g, "");
        if (lang === "uk") text = text.replace(/^24:/, "00:");
        el.textContent = text;

        // Підказка при наведенні: поточне зміщення відносно UTC (допомагає іноземцям)
        const offFmt = kyivFormatter("offset");
        if (offFmt) {
            try {
                const part = offFmt.formatToParts(now).find(p => p.type === "timeZoneName");
                if (part) el.parentElement.title = "Kyiv: " + part.value.replace("GMT", "UTC");
            } catch (e) { /* підказка не критична */ }
        }
    }

    /* ---------- Застосування мови ---------- */
    function applyLang(next) {
        lang = I18N[next] ? next : "en";
        document.documentElement.lang = lang === "uk" ? "uk" : "en";

        document.querySelectorAll("[data-i18n]").forEach(el => {
            el.textContent = t(el.getAttribute("data-i18n"));
        });
        document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
            el.setAttribute("placeholder", t(el.getAttribute("data-i18n-placeholder")));
        });
        document.querySelectorAll("[data-i18n-aria]").forEach(el => {
            el.setAttribute("aria-label", t(el.getAttribute("data-i18n-aria")));
        });
        document.querySelectorAll("[data-i18n-title]").forEach(el => {
            el.setAttribute("title", t(el.getAttribute("data-i18n-title")));
        });

        document.querySelectorAll(".lang-btn").forEach(btn => {
            const active = btn.getAttribute("data-lang") === lang;
            btn.classList.toggle("is-active", active);
            btn.setAttribute("aria-pressed", active ? "true" : "false");
        });

        try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* приватний режим */ }
        updateClock();
        document.dispatchEvent(new CustomEvent("sitelanguagechange", { detail: { lang } }));
    }

    // Доступно для інших скриптів (наприклад, search.js)
    window.SiteI18n = { t, getLang: () => lang, setLang: applyLang };

    document.querySelectorAll(".lang-btn").forEach(btn => {
        btn.addEventListener("click", () => applyLang(btn.getAttribute("data-lang")));
    });

    let saved = null;
    try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) { /* ігноруємо */ }
    applyLang(saved === "uk" ? "uk" : "en");

    updateClock();
    setInterval(updateClock, 5000);
})();
