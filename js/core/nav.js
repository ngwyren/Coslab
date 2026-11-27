/* ==========================================================
   COSLAB — Navigation
   Desktop: floating pill nav with a sliding black indicator
            (stays on the active route; hover only changes the text colour,
            keyboard focus still moves it so the focused item is visible).
   Mobile:  "Menu" button opens a full-screen overlay with
            large numbered links and a language row.
   ========================================================== */
(function (CL) {
  const LINKS = [
    { href: '#/', route: 'home', key: 'nav.home' },
    { href: '#/gallery', route: 'gallery', key: 'nav.gallery' },
    { href: '#/design', route: 'design', key: 'nav.design' },
    { href: '#/my-designs', route: 'my-designs', key: 'nav.myDesigns' },
  ];

  let nav, indicator, toggle, overlay, isOpen = false, lastFocus = null;

  /* ---------- Desktop sliding indicator ---------- */
  function moveIndicatorTo(el, instant) {
    if (!indicator) return;
    if (!el || nav.offsetParent === null) {
      // nothing to sit under (menu hidden, e.g. in the Studio): no white text on the light pill either
      indicator.style.opacity = '0';
      nav.querySelectorAll('a').forEach((a) => a.classList.remove('is-lit'));
      return;
    }
    const navBox = nav.getBoundingClientRect();
    const box = el.getBoundingClientRect();
    if (indicator.style.opacity !== '1') instant = true; // it was hidden: appear in place, do not slide in from where it last was
    if (instant) indicator.classList.add('no-anim');
    indicator.style.opacity = '1';
    const [mid, endA, endB] = indicator.children;
    const h = indicator.offsetHeight, x = box.left - navBox.left - nav.clientLeft, w = box.width;
    endA.style.width = endB.style.width = h + 'px';
    endA.style.transform = `translateX(${x}px)`;
    endB.style.transform = `translateX(${x + w - h}px)`;
    mid.style.transform = `translateX(${x + h / 2}px) scaleX(${Math.max(w - h, 0) / 100})`; // from one end's middle to the other's
    if (instant) { void indicator.offsetWidth; indicator.classList.remove('no-anim'); }
    nav.querySelectorAll('a').forEach((a) => a.classList.toggle('is-lit', a === el));
  }
  const activeLink = () => nav && nav.querySelector('a.is-active');

  function sync(instant) {
    moveIndicatorTo(activeLink(), instant);
    if (overlay) {
      const route = activeLink()?.dataset.route;
      overlay.querySelectorAll('.nav-ov-link').forEach((a) => a.classList.toggle('is-active', a.dataset.route === route));
    }
  }

  /* ---------- Mobile overlay ---------- */
  function buildOverlay() {
    const route = activeLink()?.dataset.route;
    overlay.innerHTML = '';
    const list = CL.h('nav.nav-ov-links', { 'aria-label': t('ui.mainNav') },
      LINKS.map((l, i) =>
        CL.h('a.nav-ov-link' + (l.route === route ? '.is-active' : ''), {
          href: l.href,
          'data-route': l.route,
          style: { '--i': String(i) },
          onclick: () => close(),
        },
          CL.h('span.nav-ov-text', { text: t(l.key) })
        ))
    );
    const langs = CL.h('div.nav-ov-langs', null,
      I18N.LANGS.map((l) =>
        CL.h('button.nav-ov-lang' + (l.code === I18N.lang ? '.is-active' : ''), {
          type: 'button',
          title: l.name,
          text: l.code.toUpperCase(),
          onclick: () => CL.setLang(l.code),
        }))
    );
    const foot = CL.h('div.nav-ov-foot', null,
      langs
    );
    overlay.append(list, foot);
  }

  function setToggleUI() {
    toggle.setAttribute('aria-expanded', String(isOpen));
    toggle.setAttribute('aria-label', isOpen ? t('common.close') : t('ui.menu'));
    toggle.classList.toggle('is-open', isOpen);
  }

  function open() {
    if (isOpen) return;
    isOpen = true;
    lastFocus = document.activeElement;
    buildOverlay();
    overlay.hidden = false;
    void overlay.offsetWidth; // start transition from closed state
    document.body.classList.add('nav-ov-open');
    setToggleUI();
    setTimeout(() => overlay.querySelector('.nav-ov-link')?.focus({ preventScroll: true }), 120);
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;
    document.body.classList.remove('nav-ov-open');
    setToggleUI();
    setTimeout(() => { if (!isOpen) overlay.hidden = true; }, 420);
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
  }

  function init() {
    nav = document.getElementById('mainNav');
    toggle = document.getElementById('navToggle');
    if (!nav || !toggle) return;

    // a stretching middle and two round ends (see the stylesheet for why it is in pieces)
    indicator = CL.h('span.nav-indicator', { 'aria-hidden': 'true' }, CL.h('i.ni-mid'), CL.h('i.ni-end'), CL.h('i.ni-end'));
    nav.prepend(indicator);
    nav.querySelectorAll('a').forEach((a) => {
      a.addEventListener('focus', () => moveIndicatorTo(a));
    });
    nav.addEventListener('focusout', (e) => { if (!nav.contains(e.relatedTarget)) sync(); });

    toggle.innerHTML = '<span class="nav-toggle-label">Menu</span><span class="nav-toggle-bars"><i></i><i></i></span>';
    toggle.setAttribute('aria-controls', 'navOverlay');
    toggle.addEventListener('click', () => (isOpen ? close() : open()));

    overlay = CL.h('div.nav-overlay#navOverlay', { hidden: true });
    document.body.appendChild(overlay);

    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && isOpen) close(); });
    window.addEventListener('resize', CL.debounce(() => {
      sync(true);
      if (isOpen && window.innerWidth > 960) close();
    }, 120), { passive: true });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => sync(true));
    I18N.onChange(() => {
      requestAnimationFrame(() => sync(true));
      if (isOpen) buildOverlay();
      setToggleUI();
    });
  }

  CL.nav = { init, sync, open, close, get isOpen() { return isOpen; } };
})(window.CL);
