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
    const designFilter = document.getElementById("portfolio-design-filter");
    const designToggle = document.getElementById("portfolio-design-toggle");
    const designMenu = document.getElementById("portfolio-design-menu");
    const designLabel = designFilter && designFilter.querySelector(".portfolio-design-label");
    const designOptions = designMenu
        ? Array.from(designMenu.querySelectorAll(".portfolio-type-option"))
        : [];
    const industryFilters = Array.from(document.querySelectorAll(".portfolio-industry-filter"));
    const caseFilters = Array.from(document.querySelectorAll(".portfolio-case-filter"));
    const sortControl = document.getElementById("portfolio-sort-control");
    const sortButton = document.getElementById("portfolio-sort");
    const sortMenu = document.getElementById("portfolio-sort-menu");
    const sortOptions = sortMenu
        ? Array.from(sortMenu.querySelectorAll(".portfolio-sort-option"))
        : [];
    const pagination = document.getElementById("portfolio-pagination");
    const pageNumbers = document.getElementById("portfolio-page-numbers");
    if (!tabs.length || !projectGrid || !typeToggle || !typeMenu || !typeLabel || !designToggle || !designMenu || !designLabel || !sortControl || !sortButton || !sortMenu || !pagination || !pageNumbers) return;

    const keyOf = tab => tab.id.replace(/^tab-/, "");
    const pageSize = 5;
    const initialTab = tabs.find(tab => tab.getAttribute("aria-selected") === "true") || tabs[0];
    let activeCategory = keyOf(initialTab);
    let activeType = typeLabel.dataset.type;
    let activeDesignType = "";
    let activePage = 1;
    const activeIndustries = new Set();
    const activeTags = new Set();
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

        if (!animate || document.hidden || prefersReducedMotion.matches || typeof card.animate !== "function") {
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

        if (!animate || document.hidden || prefersReducedMotion.matches || typeof card.animate !== "function") {
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
        activePage = 1;
        projectGrid.setAttribute("aria-labelledby", tab.id);
        updateProjects(true);
        if (opts.focus) tab.focus();
        if (opts.updateUrl !== false) {
            // replaceState: адреса оновлюється без стрибка сторінки й без зайвих записів в історії
            history.replaceState(null, "", "#" + keyOf(tab));
        }
    }

    function updateProjects(animate) {
        const cards = Array.from(projectGrid.querySelectorAll(".portfolio-card"));
        const matchingCards = [];
        cards.forEach(card => {
            const matchesCategory = activeCategory === "all" || card.dataset.category === activeCategory;
            const matchesType = card.dataset.type === activeType;
            const matchesDesignType = !activeDesignType || card.dataset.designType === activeDesignType;
            const cardIndustries = (card.dataset.industries || "").split(",").map(industry => industry.trim()).filter(Boolean);
            const matchesIndustries = !activeIndustries.size || cardIndustries.some(industry => activeIndustries.has(industry));
            const cardTags = (card.dataset.tags || "").split(",").map(tag => tag.trim()).filter(Boolean);
            const matchesTags = !activeTags.size || cardTags.some(tag => activeTags.has(tag));
            if (matchesCategory && matchesType && matchesDesignType && matchesIndustries && matchesTags) {
                matchingCards.push(card);
            }
        });

        const pageCount = Math.ceil(matchingCards.length / pageSize);
        activePage = Math.min(activePage, Math.max(pageCount, 1));
        const firstCardIndex = (activePage - 1) * pageSize;
        const visibleCards = new Set(matchingCards.slice(firstCardIndex, firstCardIndex + pageSize));
        cards.forEach(card => {
            if (visibleCards.has(card)) {
                showCard(card, animate);
            } else if (!card.hidden) {
                hideCard(card, animate);
            }
        });
        updatePagination(pageCount);
        typeOptions.forEach(option => {
            const selected = option.dataset.type === activeType;
            option.setAttribute("aria-checked", selected ? "true" : "false");
        });
        designOptions.forEach(option => {
            option.setAttribute("aria-checked", option.dataset.designType === activeDesignType ? "true" : "false");
        });
        industryFilters.forEach(filter => {
            filter.setAttribute("aria-pressed", activeIndustries.has(filter.dataset.industry) ? "true" : "false");
        });
        caseFilters.forEach(filter => {
            filter.setAttribute("aria-pressed", activeTags.has(filter.dataset.tag) ? "true" : "false");
        });
    }

    function updatePagination(pageCount) {
        const displayedPageCount = Math.max(pageCount, 2);
        const previousButton = pagination.querySelector('[data-page-direction="-1"]');
        const nextButton = pagination.querySelector('[data-page-direction="1"]');
        previousButton.disabled = activePage <= 1;
        nextButton.disabled = activePage >= pageCount;
        pageNumbers.replaceChildren();

        for (let page = 1; page <= displayedPageCount; page += 1) {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "portfolio-page-number";
            button.textContent = String(page);
            const pageLabel = document.documentElement.lang === "uk" ? "Сторінка" : "Page";
            button.setAttribute("aria-label", `${pageLabel} ${page}`);
            if (page === activePage) button.setAttribute("aria-current", "page");
            if (page > pageCount) button.disabled = true;
            pageNumbers.appendChild(button);
        }
    }

    function setFilterOpen(open) {
        typeMenu.hidden = !open;
        typeToggle.setAttribute("aria-expanded", open ? "true" : "false");
    }

    function setDesignFilterOpen(open) {
        designMenu.hidden = !open;
        designToggle.setAttribute("aria-expanded", open ? "true" : "false");
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
        setDesignFilterOpen(false);
        setSortOpen(false);
        setFilterOpen(open);
    });

    typeMenu.addEventListener("click", event => {
        const option = event.target.closest(".portfolio-type-option");
        if (!option || option.hidden) return;
        activeType = option.dataset.type;
        activePage = 1;
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

    designToggle.addEventListener("click", () => {
        const open = designMenu.hidden;
        setFilterOpen(false);
        setSortOpen(false);
        setDesignFilterOpen(open);
    });

    designMenu.addEventListener("click", event => {
        const option = event.target.closest(".portfolio-type-option");
        if (!option) return;
        const label = option.querySelector("[data-i18n]");
        if (!label) return;
        const isSelected = activeDesignType === option.dataset.designType;
        activeDesignType = isSelected ? "" : option.dataset.designType;
        activePage = 1;
        const labelKey = isSelected ? "portfolio.designType.label" : label.dataset.i18n;
        designLabel.dataset.i18n = labelKey;
        designLabel.textContent = window.SiteI18n
            ? window.SiteI18n.t(labelKey)
            : isSelected ? "Design type" : label.textContent;
        updateProjects(true);
        setDesignFilterOpen(false);
        designToggle.focus();
    });

    caseFilters.forEach(filter => {
        filter.addEventListener("click", () => {
            const tag = filter.dataset.tag;
            if (activeTags.has(tag)) activeTags.delete(tag);
            else activeTags.add(tag);
            activePage = 1;
            updateProjects(true);
        });
    });

    industryFilters.forEach(filter => {
        filter.addEventListener("click", () => {
            const industry = filter.dataset.industry;
            if (activeIndustries.has(industry)) activeIndustries.delete(industry);
            else activeIndustries.add(industry);
            activePage = 1;
            updateProjects(true);
        });
    });

    pagination.addEventListener("click", event => {
        const pageButton = event.target.closest(".portfolio-page-number");
        const directionButton = event.target.closest("[data-page-direction]");
        if (pageButton && !pageButton.disabled) {
            activePage = Number(pageButton.textContent);
        } else if (directionButton && !directionButton.disabled) {
            activePage += Number(directionButton.dataset.pageDirection);
        } else {
            return;
        }
        updateProjects(true);
        const selectedPage = pageNumbers.querySelector('[aria-current="page"]');
        if (selectedPage) selectedPage.focus();
    });

    sortButton.addEventListener("click", () => {
        const open = sortMenu.hidden;
        setFilterOpen(false);
        setDesignFilterOpen(false);
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
        if (!designFilter.contains(event.target)) setDesignFilterOpen(false);
        if (!sortControl.contains(event.target)) setSortOpen(false);
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && !typeMenu.hidden) {
            setFilterOpen(false);
            typeToggle.focus();
        } else if (event.key === "Escape" && !designMenu.hidden) {
            setDesignFilterOpen(false);
            designToggle.focus();
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
