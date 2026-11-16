/* Data Justa · Serie Policy Brief (2026) */
(() => {
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const root = document.documentElement;
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const isMobile = () => window.matchMedia('(max-width: 900px)').matches;

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  /* ---------------- Tema de color ---------------- */
  const swatches = $$('[data-theme-set]');
  function setTheme(name) {
    if (name === 'orange' || !name) root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', name);
    swatches.forEach(s => s.setAttribute('aria-pressed', String(s.dataset.themeSet === (name || 'orange'))));
    store.set('dj-theme', name || 'orange');
  }
  setTheme(store.get('dj-theme') || 'orange');
  swatches.forEach(s => s.addEventListener('click', () => setTheme(s.dataset.themeSet)));

  /* ---------------- Tamaño de letra de los cuadros ---------------- */
  const fsRange = $('#fsRange');
  function setFs(v) {
    root.style.setProperty('--fs', v);
    fsRange.value = v;
    store.set('dj-fs', v);
  }
  setFs(store.get('dj-fs') || 1);
  fsRange.addEventListener('input', () => setFs(fsRange.value));

  /* ---------------- Botón de opciones ---------------- */
  const theme = $('#theme');
  const toggle = $('#themeToggle');
  function setOptions(open) {
    theme.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
  }
  toggle.addEventListener('click', () => setOptions(!theme.classList.contains('open')));
  document.addEventListener('click', e => { if (!theme.contains(e.target)) setOptions(false); });

  /* ---------------- Barra superior / botón visibles fuera del índice ---------------- */
  const index = $('#index');
  const topbar = $('.topbar');
  new IntersectionObserver(([entry]) => {
    const onIndex = entry.intersectionRatio > 0.5;
    topbar.classList.toggle('show', !onIndex);
    theme.classList.toggle('show', !onIndex);
    if (onIndex) setOptions(false);
  }, { threshold: [0, 0.5, 1] }).observe(index);

  /* ---------------- Índice: expansión y filas ---------------- */
  const list = $('.idx-list');
  const items = $$('.idx-item');
  let hoverTimer = null;
  let lockUntil = 0;

  function openItem(item) {
    if (!item.style.getPropertyValue('--fit')) fitTitles();
    items.forEach(i => i.classList.toggle('open', i === item));
    index.classList.add('is-open');
  }
  function closeIndex() {
    items.forEach(i => i.classList.remove('open'));
    index.classList.remove('is-open');
  }

  if (canHover) {
    list.addEventListener('mouseenter', () => index.classList.add('is-open'));
    list.addEventListener('mouseleave', () => { clearTimeout(hoverTimer); closeIndex(); });
    items.forEach(item => {
      item.addEventListener('mouseenter', () => {
        clearTimeout(hoverTimer);
        if (item.classList.contains('open')) return;
        // pequeña espera para evitar parpadeos mientras las filas cambian de alto
        const wait = Math.max(110, lockUntil - performance.now());
        hoverTimer = setTimeout(() => {
          openItem(item);
          lockUntil = performance.now() + 500;
        }, wait);
      });
      item.addEventListener('mouseleave', () => clearTimeout(hoverTimer));
    });
  }

  items.forEach(item => {
    const head = $('.idx-item-head', item);
    // En pantallas táctiles: primer toque abre la fila, el segundo lleva a la sección
    head.addEventListener('click', e => {
      if (!canHover && !item.classList.contains('open')) {
        e.preventDefault();
        openItem(item);
      }
    });
    head.addEventListener('focus', () => openItem(item));
  });
  list.addEventListener('focusout', e => { if (!list.contains(e.relatedTarget)) closeIndex(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeIndex(); setOptions(false); } });

  /* Ajusta el tamaño del título desplegado para que quepa en una línea */
  function fitTitles() {
    if (isMobile()) { items.forEach(i => i.style.removeProperty('--fit')); return; }
    const u = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
    const avail = index.clientWidth - (25 + 192 + 15 + 24) * u;
    items.forEach(item => {
      const name = $('.idx-name', item);
      const probe = name.cloneNode(true);
      probe.style.cssText = 'position:absolute;left:0;top:0;visibility:hidden;transition:none;' +
        'font-size:100px;font-weight:500;letter-spacing:-.005em;width:max-content;';
      name.parentNode.appendChild(probe);
      const w100 = probe.getBoundingClientRect().width || 1;
      probe.remove();
      const size = Math.min(118 * u, (avail / w100) * 100);
      item.style.setProperty('--fit', size.toFixed(2) + 'px');
    });
  }
  if (document.fonts && document.fonts.load) {
    document.fonts.load('500 100px "Work Sans"', 'Marisol víctima').then(fitTitles, fitTitles);
  }
  window.addEventListener('load', fitTitles);
  fitTitles();
  window.addEventListener('resize', fitTitles);

  /* ---------------- Pestañas de cada página ---------------- */
  $$('.tabs').forEach(tabs => {
    const page = tabs.closest('.page');
    const lis = $$('.tab-list li', tabs);
    const panels = $$('.panel', tabs);

    lis.forEach((li, i) => {
      const id = `${page.id}-panel-${i}`;
      panels[i].id = id;
      panels[i].setAttribute('tabindex', '0');
      li.querySelector('button').setAttribute('aria-controls', id);
    });

    function activate(i, open = true) {
      lis.forEach((li, j) => {
        li.classList.toggle('active', j === i);
        li.querySelector('button').setAttribute('aria-expanded', String(open && j === i));
      });
      panels.forEach((p, j) => p.classList.toggle('active', j === i));
      tabs.classList.toggle('open', open);
      page.classList.toggle('tabs-open', open);
    }
    const close = () => activate(0, false);
    activate(0, false);

    lis.forEach((li, i) => {
      const btn = li.querySelector('button');
      if (canHover) btn.addEventListener('mouseenter', () => activate(i));
      btn.addEventListener('click', () => {
        if (!canHover && !isMobile() && tabs.classList.contains('open') && li.classList.contains('active')) close();
        else activate(i);
      });
      btn.addEventListener('focus', () => activate(i));
    });

    if (canHover) tabs.addEventListener('mouseleave', close);
    tabs.addEventListener('focusout', e => { if (!tabs.contains(e.relatedTarget)) close(); });
  });
})();
