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

    // Шаблон збігається з placeholder: при кліку поле не змінює вигляд, цифри лише заповнюють «_»
    const PHONE_TEMPLATE = "+380 (__) ___ __ __";

    // Лишає тільки 9 цифр після коду країни (вставлений номер +380…, 380… або 0… теж підходить)
    function localDigits(value) {
        let d = value.replace(/\D/g, "");
        if (d.startsWith("380")) d = d.slice(3);
        if (d.startsWith("0")) d = d.slice(1);
        return d.slice(0, 9);
    }

    // Підставляє цифри замість «_» у шаблоні
    function formatPhone(d) {
        let i = 0;
        return PHONE_TEMPLATE.replace(/_/g, () => d[i++] || "_");
    }

    // Курсор — на першому вільному місці (або в кінці, якщо номер заповнено)
    function caretToFree() {
        const pos = phoneEl.value.indexOf("_");
        const at = pos === -1 ? phoneEl.value.length : pos;
        phoneEl.setSelectionRange(at, at);
    }

    // Введені цифри й фіксована частина — 100%, незаповнені «_» і все після них — 32%.
    // У самому <input> різним кольором фарбувати частину тексту не можна, тому поверх нього
    // рисується дзеркало (CSS: .order-phone-wrap), а текст самого поля прозорий.
    const phoneWrap = document.createElement("div");
    phoneWrap.className = "order-phone-wrap";
    phoneEl.parentNode.insertBefore(phoneWrap, phoneEl);
    phoneWrap.appendChild(phoneEl);

    const phoneMirror = document.createElement("div");
    phoneMirror.className = "order-phone-mirror";
    phoneMirror.setAttribute("aria-hidden", "true");
    phoneWrap.appendChild(phoneMirror);

    function paintMirror() {
        const v = phoneEl.value;
        const i = v.indexOf("_");
        const filled = document.createElement("span");
        const free = document.createElement("span");
        free.className = "is-free";
        filled.textContent = i === -1 ? v : v.slice(0, i);
        free.textContent = i === -1 ? "" : v.slice(i);
        phoneMirror.replaceChildren(filled, free);
    }

    let lastPhone = "";

    phoneEl.addEventListener("focus", () => {
        if (!phoneEl.value) {
            phoneEl.value = PHONE_TEMPLATE;
            lastPhone = PHONE_TEMPLATE;
        }
        // Після кліку браузер ставить курсор куди завгодно — переносимо на перший «_»
        paintMirror();
        setTimeout(caretToFree, 0);
    });

    phoneEl.addEventListener("click", () => {
        if (!localDigits(phoneEl.value)) caretToFree();
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
        paintMirror();
        caretToFree();
    });

    phoneEl.addEventListener("blur", () => {
        // Нічого не введено — повертаємо порожнє поле з placeholder
        if (!localDigits(phoneEl.value)) {
            phoneEl.value = "";
            lastPhone = "";
        }
        paintMirror();
    });

    /* ---------- 2. Поле опису росте разом з текстом ---------- */

    function autosize() {
        taskEl.style.height = "auto";
        taskEl.style.height = (taskEl.scrollHeight + 1) + "px";   // +1 — нижня лінія
    }

    taskEl.addEventListener("input", autosize);
    window.addEventListener("resize", autosize);

    /* ---------- 2б. Бажане місце переписки (спадний список) ---------- */

    const selectWrap    = document.getElementById("order-select");
    const selectToggle  = document.getElementById("order-contact");
    const selectLabel   = document.getElementById("order-contact-label");
    const selectMenu    = document.getElementById("order-contact-menu");
    const contactInput  = document.getElementById("order-contact-value");
    const selectOptions = Array.from(selectMenu.querySelectorAll(".portfolio-type-option"));

    let contactKey = "";

    // Підпис на кнопці: поки нічого не обрано — підказка (32%), після вибору — обраний пункт (100%)
    function paintSelect() {
        const opt = selectOptions.find(o => o.dataset.value === contactKey);
        const hint = t("order.form.contact");
        const text = opt ? opt.querySelector("span").textContent : hint;
        selectLabel.textContent = text;
        selectToggle.classList.toggle("has-value", !!opt);
        selectToggle.setAttribute("aria-label", opt ? hint + " " + text : hint);
        contactInput.value = contactKey;
        selectOptions.forEach(o => o.setAttribute("aria-selected", String(o === opt)));
    }

    function setSelectOpen(open) {
        selectMenu.hidden = !open;
        selectToggle.setAttribute("aria-expanded", String(open));
    }

    selectToggle.addEventListener("click", () => setSelectOpen(selectMenu.hidden));

    selectToggle.addEventListener("keydown", e => {
        if (e.key !== "ArrowDown") return;
        e.preventDefault();
        setSelectOpen(true);
        (selectOptions.find(o => o.dataset.value === contactKey) || selectOptions[0]).focus();
    });

    selectMenu.addEventListener("keydown", e => {
        const n = selectOptions.length;
        const i = selectOptions.indexOf(document.activeElement);
        if (e.key === "ArrowDown") { e.preventDefault(); selectOptions[(i + 1) % n].focus(); }
        if (e.key === "ArrowUp")   { e.preventDefault(); selectOptions[(i - 1 + n) % n].focus(); }
    });

    selectOptions.forEach(opt => {
        opt.addEventListener("click", () => {
            contactKey = opt.dataset.value;
            paintSelect();
            setSelectOpen(false);
            setInvalid(selectToggle, false);
            selectToggle.focus();
        });
    });

    // Клік у будь-яке інше місце або Esc закривають список
    document.addEventListener("click", e => {
        if (!selectWrap.contains(e.target)) setSelectOpen(false);
    });

    document.addEventListener("keydown", e => {
        if (e.key === "Escape" && !selectMenu.hidden) {
            setSelectOpen(false);
            selectToggle.focus();
        }
    });

    document.addEventListener("sitelanguagechange", paintSelect);
    paintSelect();

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
        const phoneDigits = localDigits(phoneEl.value);

        const missing = {
            name:    name.length < 2,
            email:   email.length === 0,
            task:    task.length === 0,
            contact: !contactKey,
            consent: !consentEl.checked
        };
        const badEmail = !missing.email && !EMAIL_RE.test(email);
        const badPhone = phoneDigits.length > 0 && phoneDigits.length < 9;

        setInvalid(nameEl, missing.name);
        setInvalid(emailEl, missing.email || badEmail);
        setInvalid(phoneEl, badPhone);
        setInvalid(selectToggle, missing.contact);
        setInvalid(taskEl, missing.task);
        setInvalid(consentEl, missing.consent);

        let key = "";
        if (missing.name || missing.email || missing.task || missing.contact || missing.consent) key = "order.status.required";
        else if (badEmail) key = "order.status.email";
        else if (badPhone) key = "order.status.phone";

        if (!key) return true;

        // Підказки під кнопкою немає: незаповнені поля просто підсвічуються лінією
        setStatus("");
        const firstBad = [nameEl, emailEl, phoneEl, selectToggle, taskEl, consentEl].find(el => el.getAttribute("aria-invalid") === "true");
        if (firstBad) firstBad.focus();
        return false;
    }

    function resetForm() {
        form.reset();
        contactKey = "";
        paintSelect();
        lastPhone = "";
        paintMirror();
        autosize();
    }

    form.addEventListener("submit", async e => {
        e.preventDefault();
        if (!validate()) return;

        const phoneDigits = localDigits(phoneEl.value);
        const data = {
            name:  nameEl.value.trim(),
            email: emailEl.value.trim(),
            phone: phoneDigits ? "+380" + phoneDigits : "",
            contact: (selectOptions.find(o => o.dataset.value === contactKey) || {}).dataset.label,
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
            "Preferred way to contact: " + data.contact
        ];
        if (data.phone) lines.push("Phone: " + data.phone);
        lines.push("", data.task);

        const subject = encodeURIComponent("Order service — " + data.name);
        const body = encodeURIComponent(lines.join("\r\n"));
        window.location.href = "mailto:" + to + "?subject=" + subject + "&body=" + body;
        setStatus("order.status.mailto", false);
    });
})();
