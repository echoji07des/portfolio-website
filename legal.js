/* ==========================================================
   Сторінка Legal
   1) Перемикання документів (Privacy Policy / TOS): вкладка показує свій текст
      і свою навігацію по розділах; адреса #terms-of-service або #tos-nda
      відкриває потрібний документ одразу.
   2) Вирівнювання тексту документа й заголовків за літерою «P» у заголовку сторінки,
      а блока Sections — за лівим краєм рядка Local Time.
      Положення залежить від шрифту, мови, ширини вікна й відкритого меню.
   ========================================================== */
(function () {
    var layout = document.querySelector('.legal-layout');
    var sidebar = layout && layout.querySelector('.legal-sidebar');
    var title = document.getElementById('legal-title');
    var localTime = document.querySelector('.local-time');
    var main = document.querySelector('main');
    if (!layout || !sidebar || !title || !localTime) return;

    var ctx = document.createElement('canvas').getContext('2d');

    /* ---------- Вирівнювання ---------- */

    /* Перший текстовий вузол елемента */
    function textNode(el) {
        var node = el.firstChild;
        while (node && node.nodeType !== 3) node = node.nextSibling;
        return node;
    }

    /* Ліва межа самого символу (а не його рамки): враховує внутрішній відступ гліфа.
       Для великого заголовка він помітний, тому без цього «P» виглядало б зсунутим. */
    function inkLeft(el, index) {
        var node = textNode(el);
        if (!node || index < 0 || index >= node.length) return null;
        var range = document.createRange();
        range.setStart(node, index);
        range.setEnd(node, index + 1);
        var box = range.getBoundingClientRect();
        var cs = getComputedStyle(el);
        var ch = node.data.charAt(index);
        if (cs.textTransform === 'uppercase') ch = ch.toUpperCase();
        ctx.font = cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
        var bearing = -ctx.measureText(ch).actualBoundingBoxLeft;   // відступ гліфа від рамки
        return box.left + (isFinite(bearing) ? bearing : 0);
    }

    function clear() {
        layout.style.removeProperty('--legal-article-x');
        layout.style.removeProperty('--legal-title-shift');
        layout.style.removeProperty('--legal-sidebar-x');
    }

    function update() {
        /* Вузька область: колонки йдуть одна під одною, вирівнювання не потрібне */
        if (getComputedStyle(layout).gridTemplateColumns.trim().split(/\s+/).length < 2) {
            clear();
            return;
        }

        /* Початок другого слова заголовка («PAGE»); якщо слово одне — початок заголовка */
        var tNode = textNode(title);
        var tText = tNode ? tNode.data : '';
        var wordAt = tText.search(/\s\S/);
        var pLeft = inkLeft(title, wordAt === -1 ? 0 : wordAt + 1);

        var layoutLeft = layout.getBoundingClientRect().left;

        layout.style.setProperty('--legal-sidebar-x', '0px');
        var sideLeft = sidebar.getBoundingClientRect().left;
        var timeLeft = localTime.getBoundingClientRect().left;
        layout.style.setProperty('--legal-sidebar-x', (timeLeft - sideLeft) + 'px');

        if (pLeft !== null) {
            layout.style.setProperty('--legal-article-x', Math.max(0, pLeft - layoutLeft) + 'px');

            /* Заголовок документа теж стоїть літера в літеру з основним текстом.
               Беремо той документ, який зараз показаний (у TOS перша літера інша, ніж у Privacy). */
            layout.style.removeProperty('--legal-title-shift');
            var visible = layout.querySelector('.legal-article:not([hidden])');
            var articleTitle = visible && visible.querySelector('.legal-policy-title');
            if (articleTitle) {
                var own = inkLeft(articleTitle, 0);
                var boxLeft = articleTitle.getBoundingClientRect().left;
                if (own !== null) {
                    layout.style.setProperty('--legal-title-shift', -(own - boxLeft) + 'px');
                }
            }
        }
    }

    var frame = 0;
    function schedule() {
        if (frame) return;
        frame = requestAnimationFrame(function () {
            frame = 0;
            update();
        });
    }

    /* ---------- Перемикання документів ---------- */

    var articles = layout.querySelectorAll('.legal-article');
    var tocs = sidebar.querySelectorAll('.legal-toc');
    var tabs = document.querySelectorAll('.legal-tab[data-doc]');

    function showDoc(id) {
        var exists = false;
        articles.forEach(function (a) { if (a.id === id) exists = true; });
        if (!exists) id = articles[0].id;

        articles.forEach(function (a) { a.hidden = a.id !== id; });
        tocs.forEach(function (t) { t.hidden = t.getAttribute('data-doc') !== id; });
        tabs.forEach(function (tab) {
            var active = tab.getAttribute('data-doc') === id;
            tab.classList.toggle('is-active', active);
            if (active) tab.setAttribute('aria-current', 'page');
            else tab.removeAttribute('aria-current');
        });
        schedule();
    }

    /* Документ за адресою: #terms-of-service або будь-який розділ усередині нього (#tos-nda) */
    function docFromHash() {
        var hash = decodeURIComponent(location.hash.replace(/^#/, ''));
        if (!hash) return null;
        var target = document.getElementById(hash);
        var article = target && target.closest('.legal-article');
        return article ? article.id : null;
    }

    tabs.forEach(function (tab) {
        tab.addEventListener('click', function (e) {
            e.preventDefault();
            var id = tab.getAttribute('data-doc');
            showDoc(id);
            if (history.replaceState) history.replaceState(null, '', '#' + id);
            window.scrollTo({ top: 0 });
        });
    });

    window.addEventListener('hashchange', function () {
        var id = docFromHash();
        if (id) {
            showDoc(id);
            var target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
            if (target) target.scrollIntoView();
        }
    });

    showDoc(docFromHash() || articles[0].id);
    if (docFromHash()) {
        var firstTarget = document.getElementById(decodeURIComponent(location.hash.slice(1)));
        if (firstTarget) firstTarget.scrollIntoView();
    }

    /* ---------- Слідкуємо за змінами, від яких залежить вирівнювання ---------- */

    window.addEventListener('resize', schedule);
    window.addEventListener('load', schedule);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(schedule);

    /* Меню відкривається/закривається плавно, ширина області змінюється — слідкуємо за нею */
    if (window.ResizeObserver) {
        var ro = new ResizeObserver(schedule);
        [main, title, localTime].forEach(function (el) { if (el) ro.observe(el); });
    }

    /* Зміна мови (текст заголовка) і Accessible Font (клас на <html>) */
    if (window.MutationObserver) {
        var mo = new MutationObserver(schedule);
        mo.observe(title, { childList: true, characterData: true, subtree: true });
        mo.observe(localTime, { childList: true, characterData: true, subtree: true });
        mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'lang'] });
    }

    schedule();
})();
