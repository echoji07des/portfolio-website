/* ==========================================================
   Сторінка Order Service:
   1) маска телефону +380 (XX) XXX XX XX
   2) поле «Description of Task» росте разом з текстом
   3) перевірка контактної форми та відправлення
   Меню, Settings і список послуг, що розкривається, — у design.js / settings.js.

   Відправлення:
   - якщо в <form> є data-endpoint="https://..." (Formspree, Getform тощо),
     дані надсилаються туди через fetch (JSON);
   - інакше відкривається лист у поштовій програмі на адресу з data-mailto.
   ========================================================== */

(function () {
    "use strict";

    const form = document.getElementById("order-form");
    if (!form) return;

    const nameEl    = document.getElementById("order-name");
    const emailEl   = document.getElementById("order-email");
    const phoneEl   = document.getElementById("order-phone");
    const taskEl    = document.getElementById("order-task");
    const consentEl = document.getElementById("order-consent");
    const submitBtn = document.getElementById("order-submit");
    const statusEl  = document.getElementById("order-status");

    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    function t(key) {
        const i18n = window.SiteI18n;
        return i18n && i18n.t ? i18n.t(key) : key;
    }

    /* ---------- 1. Телефон ---------- */

    const PHONE_PREFIX = "+380 (";

    // Лишає тільки 9 цифр після коду країни (вставлений номер +380…, 380… або 0… теж підходить)
    function localDigits(value) {
        let d = value.replace(/\D/g, "");
        if (d.startsWith("380")) d = d.slice(3);
        if (d.startsWith("0")) d = d.slice(1);
        return d.slice(0, 9);
    }

    function formatPhone(d) {
        if (!d) return PHONE_PREFIX;
        let out = PHONE_PREFIX + d.slice(0, 2);
        if (d.length >= 2) out += ")";
        if (d.length > 2) out += " " + d.slice(2, 5);
        if (d.length > 5) out += " " + d.slice(5, 7);
        if (d.length > 7) out += " " + d.slice(7, 9);
        return out;
    }

    let lastPhone = "";

    phoneEl.addEventListener("focus", () => {
        if (!phoneEl.value) {
            phoneEl.value = PHONE_PREFIX;
            lastPhone = PHONE_PREFIX;
        }
    });

    phoneEl.addEventListener("input", e => {
        let d = localDigits(phoneEl.value);
        let next = formatPhone(d);

        // Backspace на роздільнику («)» чи пробіл) мав би нічого не змінити — тоді видаляємо ще й цифру
        const deleting = e.inputType && e.inputType.startsWith("delete");
        if (deleting && next === lastPhone && d) {
            d = d.slice(0, -1);
            next = formatPhone(d);
        }

        phoneEl.value = next;
        lastPhone = next;
    });

    phoneEl.addEventListener("blur", () => {
        if (phoneEl.value === PHONE_PREFIX) {
            phoneEl.value = "";
            lastPhone = "";
        }
    });

    /* ---------- 2. Поле опису росте разом з текстом ---------- */

    function autosize() {
        taskEl.style.height = "auto";
        taskEl.style.height = (taskEl.scrollHeight + 1) + "px";   // +1 — нижня лінія
    }

    taskEl.addEventListener("input", autosize);
    window.addEventListener("resize", autosize);

    /* ---------- 3. Перевірка і відправлення ---------- */

    let statusKey = "";
    let statusError = false;

    function setStatus(key, isError) {
        statusKey = key || "";
        statusError = !!isError;
        statusEl.textContent = statusKey ? t(statusKey) : "";
        statusEl.classList.toggle("is-error", statusError);
    }

    // Повідомлення перекладається разом із сайтом
    document.addEventListener("sitelanguagechange", () => {
        if (statusKey) setStatus(statusKey, statusError);
    });

    function setInvalid(el, bad) {
        const target = el === consentEl ? el.closest(".order-check") : el;
        if (target) target.classList.toggle("is-invalid", bad);
        if (bad) el.setAttribute("aria-invalid", "true");
        else el.removeAttribute("aria-invalid");
    }

    [nameEl, emailEl, phoneEl, taskEl, consentEl].forEach(el => {
        el.addEventListener(el === consentEl ? "change" : "input", () => setInvalid(el, false));
    });

    function validate() {
        const name  = nameEl.value.trim();
        const email = emailEl.value.trim();
        const task  = taskEl.value.trim();
        const phoneDigits = phoneEl.value === PHONE_PREFIX ? "" : localDigits(phoneEl.value);

        const missing = {
            name:    name.length < 2,
            email:   email.length === 0,
            task:    task.length === 0,
            consent: !consentEl.checked
        };
        const badEmail = !missing.email && !EMAIL_RE.test(email);
        const badPhone = phoneDigits.length > 0 && phoneDigits.length < 9;

        setInvalid(nameEl, missing.name);
        setInvalid(emailEl, missing.email || badEmail);
        setInvalid(phoneEl, badPhone);
        setInvalid(taskEl, missing.task);
        setInvalid(consentEl, missing.consent);

        let key = "";
        if (missing.name || missing.email || missing.task || missing.consent) key = "order.status.required";
        else if (badEmail) key = "order.status.email";
        else if (badPhone) key = "order.status.phone";

        if (!key) return true;

        setStatus(key, true);
        const firstBad = [nameEl, emailEl, phoneEl, taskEl, consentEl].find(el => el.getAttribute("aria-invalid") === "true");
        if (firstBad) firstBad.focus();
        return false;
    }

    function resetForm() {
        form.reset();
        lastPhone = "";
        autosize();
    }

    form.addEventListener("submit", async e => {
        e.preventDefault();
        if (!validate()) return;

        const phoneDigits = phoneEl.value === PHONE_PREFIX ? "" : localDigits(phoneEl.value);
        const data = {
            name:  nameEl.value.trim(),
            email: emailEl.value.trim(),
            phone: phoneDigits ? "+380" + phoneDigits : "",
            task:  taskEl.value.trim()
        };

        const endpoint = form.dataset.endpoint;

        if (endpoint) {
            submitBtn.disabled = true;
            try {
                const res = await fetch(endpoint, {
                    method: "POST",
                    headers: { "Accept": "application/json", "Content-Type": "application/json" },
                    body: JSON.stringify(data)
                });
                if (!res.ok) throw new Error("HTTP " + res.status);
                resetForm();
                setStatus("order.status.sent", false);
            } catch (err) {
                setStatus("order.status.failed", true);
            } finally {
                submitBtn.disabled = false;
            }
            return;
        }

        // Запасний варіант без сервера: готовий лист у поштовій програмі
        const to = form.dataset.mailto || "";
        const lines = [
            "Name: " + data.name,
            "E-mail: " + data.email,
            data.phone ? "Phone: " + data.phone : "",
            "",
            data.task
        ].filter((line, i) => line !== "" || i === 3);

        const subject = encodeURIComponent("Order service — " + data.name);
        const body = encodeURIComponent(lines.join("\r\n"));
        window.location.href = "mailto:" + to + "?subject=" + subject + "&body=" + body;
        setStatus("order.status.mailto", false);
    });
})();
