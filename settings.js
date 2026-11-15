/* ==========================================================
   Меню Settings (головна сторінка і Design side):
   - на комп'ютері меню з'являється при наведенні (чистий CSS) і при фокусі з клавіатури;
   - на сенсорних екранах, де наведення немає, воно відкривається дотиком;
   - тумблери «Accessible Font» і «Light / Dark theme» працюють через prefs.js.
   Стрілки праворуч у рядках — заготовки під сторінки налаштувань
   (замініть <span class="settings-go"> на <a class="settings-go" href="...">).
   ========================================================== */

(function () {
    "use strict";

    const box = document.getElementById("settings");
    const btn = document.getElementById("settings-btn");
    if (!box || !btn) return;

    const canHover = window.matchMedia("(hover: hover)");

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
