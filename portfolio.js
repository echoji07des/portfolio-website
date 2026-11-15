(function () {
    "use strict";

    const tabs = Array.from(document.querySelectorAll('.tabs [role="tab"]'));
    const projectGrid = document.getElementById("portfolio-projects");
    const typeFilter = document.getElementById("portfolio-type-filter");
    const typeToggle = document.getElementById("portfolio-type-toggle");
    const typeMenu = document.getElementById("portfolio-type-menu");
    const typeLabel = typeFilter && typeFilter.querySelector(".portfolio-type-label");
    const typeOptions = typeMenu
        ? Array.from(typeMenu.querySelectorAll(".portfolio-type-option"))
        : [];
    const sortControl = document.getElementById("portfolio-sort-control");
    const sortButton = document.getElementById("portfolio-sort");
    const sortMenu = document.getElementById("portfolio-sort-menu");
    const sortOptions = sortMenu
        ? Array.from(sortMenu.querySelectorAll(".portfolio-sort-option"))
        : [];
    if (!tabs.length || !projectGrid || !typeToggle || !typeMenu || !typeLabel || !sortControl || !sortButton || !sortMenu) return;

    const keyOf = tab => tab.id.replace(/^tab-/, "");
    const initialTab = tabs.find(tab => tab.getAttribute("aria-selected") === "true") || tabs[0];
    let activeCategory = keyOf(initialTab);
    let activeType = typeLabel.dataset.type;
    let activeSort = "relevant";
    const sourceOrder = new WeakMap();
    const cardAnimations = new WeakMap();
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    function showCard(card, animate) {
        const state = cardAnimations.get(card) || { token: 0, animation: null };
        if (!card.hidden && !state.animation) return;
        state.token += 1;
        if (state.animation) state.animation.cancel();
        card.hidden = false;

        if (!animate || prefersReducedMotion.matches || typeof card.animate !== "function") {
            cardAnimations.set(card, { token: state.token, animation: null });
            return;
        }

        const token = state.token;
        const animation = card.animate(
            [
                { opacity: 0, transform: "translateY(12px)" },
                { opacity: 1, transform: "translateY(0)" }
            ],
            { duration: 420, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }
        );
        state.animation = animation;
        cardAnimations.set(card, state);
        animation.onfinish = () => {
            const current = cardAnimations.get(card);
            if (current && current.token === token) {
                current.animation = null;
                animation.cancel();
            }
        };
    }

    function hideCard(card, animate) {
        const state = cardAnimations.get(card) || { token: 0, animation: null };
        state.token += 1;
        if (state.animation) state.animation.cancel();

        if (!animate || prefersReducedMotion.matches || typeof card.animate !== "function") {
            card.hidden = true;
            cardAnimations.set(card, { token: state.token, animation: null });
            return;
        }

        const token = state.token;
        const animation = card.animate(
            [
                { opacity: 1, transform: "translateY(0)" },
                { opacity: 0, transform: "translateY(-8px)" }
            ],
            { duration: 280, easing: "ease-in" }
        );
        state.animation = animation;
        cardAnimations.set(card, state);
        animation.onfinish = () => {
            const current = cardAnimations.get(card);
            if (current && current.token === token) {
                card.hidden = true;
                current.animation = null;
                animation.cancel();
            }
        };
    }

    function select(tab, options) {
        const opts = options || {};
        tabs.forEach(t => {
            const on = t === tab;
            t.setAttribute("aria-selected", on ? "true" : "false");
            t.tabIndex = on ? 0 : -1;
        });
        activeCategory = keyOf(tab);
        projectGrid.setAttribute("aria-labelledby", tab.id);
        updateProjects(true);
        if (opts.focus) tab.focus();
        if (opts.updateUrl !== false) {
            // replaceState: адреса оновлюється без стрибка сторінки й без зайвих записів в історії
            history.replaceState(null, "", "#" + keyOf(tab));
        }
    }

    function updateProjects(animate) {
        const cards = projectGrid.querySelectorAll(".portfolio-card");
        cards.forEach(card => {
            const matchesCategory = activeCategory === "all" || card.dataset.category === activeCategory;
            const shouldShow = matchesCategory && card.dataset.type === activeType;
            if (shouldShow) {
                showCard(card, animate);
            } else if (!card.hidden) {
                hideCard(card, animate);
            }
        });
        typeOptions.forEach(option => {
            const selected = option.dataset.type === activeType;
            option.setAttribute("aria-checked", selected ? "true" : "false");
        });
    }

    function setFilterOpen(open) {
        typeMenu.hidden = !open;
        typeToggle.setAttribute("aria-expanded", open ? "true" : "false");
    }

    function setSortOpen(open) {
        sortMenu.hidden = !open;
        sortButton.setAttribute("aria-expanded", open ? "true" : "false");
    }

    function sortProjects() {
        const cards = Array.from(projectGrid.querySelectorAll(".portfolio-card"));
        cards.forEach((card, index) => {
            if (!sourceOrder.has(card)) sourceOrder.set(card, index);
        });
        cards.sort((a, b) => {
            const valueA = Number(a.dataset.order);
            const valueB = Number(b.dataset.order);
            const orderA = Number.isFinite(valueA) ? valueA : sourceOrder.get(a);
            const orderB = Number.isFinite(valueB) ? valueB : sourceOrder.get(b);
            if (activeSort === "relevant") return orderA - orderB;

            const dateA = Date.parse(a.dataset.date || "");
            const dateB = Date.parse(b.dataset.date || "");
            const hasDateA = Number.isFinite(dateA);
            const hasDateB = Number.isFinite(dateB);
            if (hasDateA !== hasDateB) return hasDateA ? -1 : 1;
            if (hasDateA && dateA !== dateB) {
                return activeSort === "new-to-old" ? dateB - dateA : dateA - dateB;
            }
            return orderA - orderB;
        });
        cards.forEach(card => projectGrid.appendChild(card));
        sortOptions.forEach(option => {
            option.setAttribute("aria-checked", option.dataset.sort === activeSort ? "true" : "false");
        });
    }

    tabs.forEach((tab, i) => {
        tab.addEventListener("click", () => select(tab));

        tab.addEventListener("keydown", e => {
            let next = null;
            if (e.key === "ArrowRight") next = tabs[(i + 1) % tabs.length];
            if (e.key === "ArrowLeft")  next = tabs[(i - 1 + tabs.length) % tabs.length];
            if (e.key === "Home")       next = tabs[0];
            if (e.key === "End")        next = tabs[tabs.length - 1];
            if (next) {
                e.preventDefault();
                select(next, { focus: true });
            }
        });
    });

    typeToggle.addEventListener("click", () => {
        const open = typeMenu.hidden;
        setSortOpen(false);
        setFilterOpen(open);
    });

    typeMenu.addEventListener("click", event => {
        const option = event.target.closest(".portfolio-type-option");
        if (!option || option.hidden) return;
        activeType = option.dataset.type;
        typeLabel.dataset.type = activeType;
        const label = option.querySelector("[data-i18n]");
        if (!label) return;
        typeLabel.dataset.i18n = label.dataset.i18n;
        typeLabel.textContent = label.textContent;
        sortProjects();
        updateProjects(true);
        setFilterOpen(false);
        typeToggle.focus();
    });

    sortButton.addEventListener("click", () => {
        const open = sortMenu.hidden;
        setFilterOpen(false);
        setSortOpen(open);
    });

    sortMenu.addEventListener("click", event => {
        const option = event.target.closest(".portfolio-sort-option");
        if (!option) return;
        activeSort = option.dataset.sort;
        sortProjects();
        setSortOpen(false);
        sortButton.focus();
    });

    document.addEventListener("click", event => {
        if (!typeFilter.contains(event.target)) setFilterOpen(false);
        if (!sortControl.contains(event.target)) setSortOpen(false);
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && !typeMenu.hidden) {
            setFilterOpen(false);
            typeToggle.focus();
        } else if (event.key === "Escape" && !sortMenu.hidden) {
            setSortOpen(false);
            sortButton.focus();
        }
    });

    function fromHash() {
        const key = location.hash.replace("#", "");
        const match = tabs.find(t => keyOf(t) === key);
        if (match) select(match, { updateUrl: false });
    }

    updateProjects();
    sortProjects();
    window.addEventListener("hashchange", fromHash);
    fromHash();
})();
