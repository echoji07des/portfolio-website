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

            "settings.title": "Settings",
            "settings.font": "Accessible font",
            "settings.theme": "Light / Dark theme",

            "about.open": "Open to work",
            "about.available": "Available: Mon-fri (10:00 - 18:00)",
            "about.p1": "Hi, I’m Angelina, a UI/UX & Product Designer. I find answers and build products that solve your problems. I develop desktop and mobile websites, as well as Android & iOS apps.",
            "about.niches": "Working in the following niches:",
            "about.p3": "I have a 9-year art school background and a degree in Graphic Design. I was mentored by a Senior UI/UX Designer and still do illustration today. I’ve studied English since childhood so I have B1–B2.",

            "cta.cv": "Download and explore my experience",
            "cta.download": "Download CV",
            "cta.connect": "Let’s connect and build a product!",
            "cta.order": "Order Service",
            "cta.projects": "Check out more about my projects",

            "columns.title": "Columns",
            "columns.about": "About Me",
            "columns.contacts": "Contacts",
            "columns.experience": "Experience",
            "columns.education": "Education",
            "columns.skills": "Skills & Tools",

            "h.contacts": "Contacts",
            "h.experience": "Experience",
            "h.education": "Education",
            "h.skills": "Skills & tools",

            "contacts.copy": "Copy",
            "contacts.copied": "Copied",
            "contacts.failed": "Copy failed",
            "contacts.direct": "— for direct contact",

            "exp1.title": "Freelance - UI/UX designer (May 2026 - Present)",
            "exp1.a.name": "Garden Prostir",
            "exp1.a.text": "— end-to-end mobile website for an event agency, streamlining service discovery and boosting consultation bookings.",
            "exp1.b.name": "GD Cashmere",
            "exp1.b.text": "— desktop and mobile redesign for a premium clothing brand, elevating brand aesthetics and streamlining catalog navigation and checkout.",
            "exp2.title": "Junior UI/UX - Assistance for Senior UI/UX designer (Jan 2026 - Apr 2026)",
            "exp2.a.name": "Olena Petrochenko",
            "exp2.a.text": "— designed a high-converting website and mobile experience to establish a mentor’s personal brand.",
            "exp3.title": "Freelance - Digital 2D Illustrator / Concept Art (Dec 2023 - Jan 2025)",
            "exp3.a": "Creating character designs for commercial use — offered for sale on platforms such as VGen and DeviantArt — and producing custom illustrations for clients’ personal use.",

            "edu1.title": "\"Universum\" Professional College of Borys Grinchenko Kyiv Metropolitan University (2023–2027)",
            "edu1.a.name": "Graphic Design",
            "edu1.a.text": "— strong foundation in branding, market positioning, and business-driven visual communication. Deep expertise in typography, composition, color theory, print production, and physical material applications.",
            "edu2.title": "Art school (2014–2023)",
            "edu2.a": "I studied fine arts (drawing and painting), color theory, applied arts, and art history. In the applied arts course, we covered some of the material taught in graphic design (such as stylization, layout, and print production)."
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
            "search.placeholder": "Пошук за ключовими словами...",
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

            "settings.title": "Налаштування",
            "settings.font": "Доступний шрифт",
            "settings.theme": "Світла / темна тема",

            "about.open": "Відкрита до роботи",
            "about.available": "Доступна: пн–пт (10:00 – 18:00)",
            "about.p1": "Привіт, я Ангеліна, UI/UX та Product-дизайнерка. Я шукаю відповіді та створюю продукти, які розв’язують ваші проблеми. Розробляю десктопні та мобільні вебсайти, а також застосунки для Android та iOS.",
            "about.niches": "Працюю в таких нішах:",
            "about.p3": "Маю 9 років мистецької школи та диплом із графічного дизайну. Мене наставляв Senior UI/UX дизайнер, і я досі займаюся ілюстрацією. Англійську вивчаю з дитинства, тож мій рівень — B1–B2.",

            "cta.cv": "Завантажте резюме та ознайомтеся з моїм досвідом",
            "cta.download": "Завантажити резюме",
            "cta.connect": "Давайте зв’яжемося та створимо продукт!",
            "cta.order": "Замовити послугу",
            "cta.projects": "Дізнайтеся більше про мої проєкти",

            "columns.title": "Розділи",
            "columns.about": "Про мене",
            "columns.contacts": "Контакти",
            "columns.experience": "Досвід",
            "columns.education": "Освіта",
            "columns.skills": "Навички та інструменти",

            "h.contacts": "Контакти",
            "h.experience": "Досвід",
            "h.education": "Освіта",
            "h.skills": "Навички та інструменти",

            "contacts.copy": "Копіювати",
            "contacts.copied": "Скопійовано",
            "contacts.failed": "Не вдалося",
            "contacts.direct": "— для прямого зв’язку",

            "exp1.title": "Фріланс — UI/UX дизайнерка (травень 2026 — дотепер)",
            "exp1.a.name": "Garden Prostir",
            "exp1.a.text": "— мобільний вебсайт «під ключ» для івент-агенції, що спрощує пошук послуг і збільшує кількість записів на консультацію.",
            "exp1.b.name": "GD Cashmere",
            "exp1.b.text": "— редизайн десктопної та мобільної версій для преміального бренду одягу: підсилена естетика бренду, простіші навігація каталогом і оформлення замовлення.",
            "exp2.title": "Junior UI/UX — асистування Senior UI/UX дизайнеру (січень 2026 — квітень 2026)",
            "exp2.a.name": "Olena Petrochenko",
            "exp2.a.text": "— спроєктовано висококонверсійний вебсайт і мобільну версію для побудови особистого бренду наставниці.",
            "exp3.title": "Фріланс — Digital 2D ілюстраторка / Concept Art (грудень 2023 — січень 2025)",
            "exp3.a": "Створення дизайнів персонажів для комерційного використання (на продаж на платформах VGen і DeviantArt) та авторських ілюстрацій на замовлення для особистого використання клієнтів.",

            "edu1.title": "Фаховий коледж «Universum» Київського столичного університету імені Бориса Грінченка (2023–2027)",
            "edu1.a.name": "Графічний дизайн",
            "edu1.a.text": "— міцна база з брендингу, ринкового позиціонування та візуальної комунікації, орієнтованої на бізнес. Глибока експертиза в типографіці, композиції, теорії кольору, друкованій продукції та роботі з фізичними матеріалами.",
            "edu2.title": "Художня школа (2014–2023)",
            "edu2.a": "Вивчала образотворче мистецтво (малюнок і живопис), теорію кольору, прикладне мистецтво та історію мистецтв. На курсі прикладного мистецтва ми проходили частину матеріалу з графічного дизайну (стилізація, верстка, підготовка до друку)."
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
