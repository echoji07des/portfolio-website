/* ==========================================================
   Сторінка Design side:
   1) бічне меню: відкрите при завантаженні, кнопка хрестик <-> бургер
   2) Settings: меню при наведенні з тумблерами (шрифт, тема)
   3) списки Experience / Education, що розкриваються (незалежно один від одного)
   4) копіювання пошти в Contacts
   Розділи меню (Order service, Portfolio, Products, Legal) — окремі сторінки,
   крапка біля поточної сторінки стоїть у розмітці (клас is-active).
   ========================================================== */

(function () {
    "use strict";

    const body    = document.body;
    const mobile  = window.matchMedia("(max-width: 900px)");
    const canHover = window.matchMedia("(hover: hover)");

    function t(key, fallback) {
        const i18n = window.SiteI18n;
        return i18n && i18n.t ? i18n.t(key) : fallback;
    }

    /* ---------- 1. Меню ---------- */

    (function initMenu() {
        const toggle = document.getElementById("menu-toggle");
        const menu   = document.getElementById("site-menu");
        if (!toggle || !menu) return;

        function setOpen(open) {
            body.classList.toggle("menu-open", open);
            toggle.setAttribute("aria-expanded", open ? "true" : "false");
            toggle.setAttribute("aria-label", open ? t("menu.close", "Close menu") : t("menu.open", "Open menu"));
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
    })();

    /* ---------- 2. Settings ---------- */

    (function initSettings() {
        const box = document.getElementById("settings");
        const btn = document.getElementById("settings-btn");
        if (!box || !btn) return;

        // На комп'ютері меню відкривається наведенням (чистий CSS) і з клавіатури (focus).
        // На сенсорних екранах, де наведення немає, воно відкривається дотиком.
        function setOpen(open) {
            box.classList.toggle("is-open", open);
            btn.setAttribute("aria-expanded", open ? "true" : "false");
        }

        btn.addEventListener("click", () => {
            if (canHover.matches) return;
            setOpen(!box.classList.contains("is-open"));
        });

        document.addEventListener("click", e => {
            if (!box.contains(e.target)) setOpen(false);
        });

        document.addEventListener("keydown", e => {
            if (e.key === "Escape" && box.classList.contains("is-open")) {
                setOpen(false);
                btn.focus();
            }
        });

        // Тумблери
        const prefs = window.SitePrefs;
        if (!prefs) return;

        function bindSwitch(id, getState, setState) {
            const el = document.getElementById(id);
            if (!el) return;
            const paint = () => el.setAttribute("aria-checked", getState() ? "true" : "false");
            paint();
            el.addEventListener("click", () => {
                setState(!getState());
                paint();
            });
        }

        bindSwitch("switch-font",
            () => prefs.isAccessibleFont(),
            on => prefs.setAccessibleFont(on));

        bindSwitch("switch-theme",
            () => prefs.getTheme() === "dark",
            on => prefs.setTheme(on ? "dark" : "light"));
    })();

    /* ---------- 3. Списки, що розкриваються ---------- */
    // Кожен список розкривається й закривається окремо: відкриття наступного
    // не закриває попередні, тож можна відкрити хоч усі одразу.

    (function initAccordions() {
        document.querySelectorAll(".acc-head").forEach(head => {
            head.addEventListener("click", () => {
                const open = head.getAttribute("aria-expanded") !== "true";
                head.setAttribute("aria-expanded", open ? "true" : "false");
                const item = head.closest(".acc-item");
                if (item) item.classList.toggle("is-open", open);
            });
        });
    })();

    /* ---------- 4. Пошта: копіювання ---------- */

    (function initEmail() {
        const link   = document.getElementById("email-link");
        const btn    = document.getElementById("copy-email");
        const status = document.getElementById("copy-status");
        if (!link || !btn) return;

        const label = btn.querySelector("span");
        let timer = null;

        // Адреса береться з тексту посилання — змінювати її потрібно лише в одному місці
        const address = () => link.textContent.trim();
        link.href = "mailto:" + address();

        async function copyText(text) {
            if (navigator.clipboard && window.isSecureContext) {
                try {
                    await navigator.clipboard.writeText(text);
                    return true;
                } catch (e) { /* пробуємо запасний спосіб */ }
            }
            const area = document.createElement("textarea");
            area.value = text;
            area.setAttribute("readonly", "");
            area.style.position = "fixed";
            area.style.opacity = "0";
            document.body.appendChild(area);
            area.select();
            let ok = false;
            try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
            area.remove();
            return ok;
        }

        btn.addEventListener("click", async () => {
            const ok = await copyText(address());
            const message = t(ok ? "contacts.copied" : "contacts.failed", ok ? "Copied" : "Copy failed");
            label.textContent = message;
            btn.classList.toggle("is-copied", ok);
            if (status) status.textContent = message;

            clearTimeout(timer);
            timer = setTimeout(() => {
                label.textContent = t("contacts.copy", "Copy");
                btn.classList.remove("is-copied");
                if (status) status.textContent = "";
            }, 1800);
        });
    })();
})();
