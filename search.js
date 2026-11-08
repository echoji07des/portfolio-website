/* ==========================================================
   Пошук: кнопка очищення + випадаючий список підказок.
   Контент для пошуку ще не готовий, тому масив порожній і список
   не показується. Коли з'являться сторінки, додайте записи:
   { title: "Назва", side: "design" | "art", url: "сторінка.html" }
   ========================================================== */

const SUGGESTIONS = [];

const SIDE_LABEL = { design: "Design side", art: "Artist side" };

(function () {
    const box     = document.querySelector(".search");
    if (!box) return;
    const input   = box.querySelector(".search-input");
    const clear   = box.querySelector(".search-clear");
    const results = box.querySelector(".search-results");

    function render() {
        const q = input.value.trim().toLowerCase();
        clear.hidden = input.value.length === 0;
        results.innerHTML = "";

        const found = q
            ? SUGGESTIONS.filter(s => s.title.toLowerCase().includes(q))
            : [];

        found.forEach(s => {
            const a = document.createElement("a");
            a.className = "search-result";
            a.href = s.url;

            const title = document.createElement("span");
            title.className = "search-result-title";
            title.textContent = s.title;

            const side = document.createElement("span");
            side.className = "search-result-side";
            side.textContent = SIDE_LABEL[s.side] || "";

            const arrow = document.createElement("img");
            arrow.className = "search-result-arrow";
            arrow.src = "images/arrow-right-icon.svg";
            arrow.alt = "";

            a.append(title, side, arrow);
            results.appendChild(a);
        });

        box.classList.toggle("is-open", found.length > 0);
    }

    input.addEventListener("input", render);

    clear.addEventListener("click", () => {
        input.value = "";
        render();
        input.focus();
    });

    document.addEventListener("keydown", e => {
        if (e.key === "Escape") {
            input.value = "";
            render();
            input.blur();
        }
    });

    document.addEventListener("click", e => {
        if (!box.contains(e.target)) box.classList.remove("is-open");
    });

    input.addEventListener("focus", () => {
        if (results.children.length) box.classList.add("is-open");
    });
})();
