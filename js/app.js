/* ==========================================================
   App bootstrap: router, header, language switcher
   ========================================================== */
(function (CL) {
  CL.pages = CL.pages || {};
  const app = document.getElementById('app');
  let cleanup = null;
  let current = null;

  const ROUTES = {
    '': { page: 'home', nav: 'home' },
    works: { page: 'home', nav: 'home', anchor: 'worksSection' },
    about: { page: 'home', nav: 'home', anchor: 'about' },
    media: { page: 'home', nav: 'home', anchor: 'media' },
    design: { page: 'design', nav: 'design' },
    editor: { page: 'editor', nav: 'design' },
    gallery: { page: 'gallery', nav: 'gallery' },
    'my-designs': { page: 'my-designs', nav: 'my-designs' },
  };

  function parse() {
    const raw = location.hash.replace(/^#\/?/, '');
    const [pathPart, qs] = raw.split('?');
    const segs = pathPart.split('/').filter(Boolean);
    const query = Object.fromEntries(new URLSearchParams(qs || ''));
    return { segs, key: segs[0] || '', sub: segs[1] || '', query };
  }

  /** Split a link's words into letters that roll up on hover (the link keeps its name for screen readers). */
  CL.rollLetters = (root = document) => {
    root.querySelectorAll('a.roll-me').forEach((a) => {
      const text = a.textContent.trim();
      if (!text || a.querySelector('.roll')) return; // already split (a language change puts plain text back)
      a.setAttribute('aria-label', text);
      const roll = document.createElement('span');
      roll.className = 'roll';
      roll.setAttribute('aria-hidden', 'true');
      [...text].forEach((c, i) => {
        const ch = document.createElement('span');
        ch.className = 'roll-ch';
        ch.style.setProperty('--i', i);
        const glyph = c === ' ' ? '\u00a0' : c;
        ch.innerHTML = '<span></span><span></span>';
        ch.firstChild.textContent = glyph;
        ch.lastChild.textContent = glyph;
        roll.append(ch);
      });
      a.replaceChildren(roll);
    });
  };

  CL.go = (hash) => { if (location.hash === hash) render(); else location.hash = hash; };

  // Framer Scroll Reveal & Luxury Motion Engine
  let scrollObserver = null;
  function setupFramerMotion() {
    try {
      if (!('IntersectionObserver' in window)) return;
      if (scrollObserver) {
        scrollObserver.disconnect();
      }

      scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            scrollObserver.unobserve(entry.target);
          }
        });
      }, {
        threshold: 0.08,
        rootMargin: '0px 0px -40px 0px'
      });

      // Stagger child elements in editorial grids and rows
      const groupSelectors = ['.orchard-bento-grid', '.standards-bento-grid', '.orchard-journal-grid'];
      groupSelectors.forEach((sel) => {
        document.querySelectorAll(sel).forEach((group) => {
          Array.from(group.children).forEach((child, idx) => {
            child.classList.add(`stagger-${(idx % 5) + 1}`);
          });
        });
      });

      // Target home editorial cards and rows for scroll reveal
      const targets = document.querySelectorAll(
        '.orchard-work-card, .orchard-table-row, .orchard-journal-card, .orchard-connect-box, .framer-reveal'
      );

      const winH = window.innerHeight;
      targets.forEach((el) => {
        el.classList.add('framer-reveal');
        const rect = el.getBoundingClientRect();
        if (rect.top < winH * 0.92 && rect.bottom > 0) {
          el.classList.add('is-revealed');
        } else {
          scrollObserver.observe(el);
        }
      });
    } catch (err) {
      console.warn('Framer motion init:', err);
    }
  }

  // Page change: fade the old page out, then build the new one and let it rise in
  let leaving = 0;
  // The menu answers at once: its pill slides to the new page while the old one fades out, so the
  // slide is over before the work of building the new page begins (that work would stall it).
  function markNav(route) {
    document.querySelectorAll('.main-nav a').forEach((a) => a.classList.toggle('is-active', a.dataset.route === route.nav));
    if (CL.nav) { CL.nav.close(); CL.nav.sync(); }
  }

  function navigate() {
    markNav(ROUTES[parse().key] || ROUTES['']);
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !app.firstChild) { render(); return; }
    const id = ++leaving;
    app.classList.add('is-leaving');
    setTimeout(() => {
      if (id !== leaving) return;
      app.classList.remove('is-leaving');
      app.classList.add('is-entering');
      render();
      requestAnimationFrame(() => requestAnimationFrame(() => app.classList.remove('is-entering')));
    }, 260);
  }

  function render(opts = {}) {
    const r = parse();
    const route = ROUTES[r.key] || ROUTES[''];
    const page = CL.pages[route.page];
    if (typeof cleanup === 'function') { try { cleanup(); } catch (e) { console.error(e); } }
    cleanup = null;
    CL.closeMenu();
    app.innerHTML = '';
    document.body.classList.toggle('app-mode', !!page.appMode);
    markNav(route);
    // the Studio remembers which page it was opened from: its way back leads there
    if (route.page === 'editor' && current && current.route.page !== 'editor') {
      CL.studioOrigin = { hash: ROUTES[current.r.key] ? '#/' + current.r.key : '#/', nav: current.route.nav };
      try { sessionStorage.setItem('coslab.studioOrigin', JSON.stringify(CL.studioOrigin)); } catch (e) { /* no storage: this visit's own memory is enough */ }
    }
    current = { route, r };
    cleanup = page.render(app, { query: r.query, sub: r.sub, anchor: route.anchor, rerender: !!opts.rerender });
    I18N.apply(document);
    CL.rollLetters();
    // place the black pill again once the new page is laid out
    requestAnimationFrame(() => { if (CL.nav) CL.nav.sync(); if (CL.paceFooter) CL.paceFooter(); });
    document.title = route.page === 'home' ? 'CosLab' : `${t(page.titleKey || 'nav.home')} — CosLab`;
    if (!opts.rerender) {
      if (route.anchor) setTimeout(() => { const el = document.getElementById(route.anchor); el && el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 60);
      else window.scrollTo({ top: 0 });
    }
    setTimeout(setupFramerMotion, 40);
  }

  /* ---------- Language switcher (Minimalist K-Beauty Style) ---------- */
  function buildLangSwitch() {
    const host = document.getElementById('langSwitch');
    if (!host) return;
    host.innerHTML = '';
    const meta = I18N.meta;
    const btn = CL.h('button.lang-btn', {
      type: 'button',
      'aria-haspopup': 'menu',
      'aria-expanded': 'false',
      html: `<span class="lang-code-pill">${meta.code.toUpperCase()}</span><span class="lang-label">${meta.name}</span><svg class="lang-chevron" viewBox="0 0 10 6" fill="none"><path d="M1 1L5 5L9 1" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`
    });
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      CL.menu(btn, I18N.LANGS.map((l) => ({
        label: l.name,
        code: l.code.toUpperCase(),
        active: l.code === I18N.lang,
        onClick: () => CL.setLang(l.code),
      })), { align: 'end', type: 'lang' });
    });
    host.appendChild(btn);
  }

  CL.setLang = (code) => {
    CL.store.saveSettings({ lang: code });
    I18N.setLang(code);
  };

  function init() {
    document.getElementById('year').textContent = new Date().getFullYear();
    // Set the language before any change listener exists: the first page is then built once, below
    I18N.setLang(CL.store.settings.lang || 'vi');
    CL.nav.init();
    // footer name runs at a steady ~90 px a second, whatever the screen width
    // Mail links: open the mail app if there is one, and always copy the address with a short note
    document.querySelectorAll('a[data-copy-mail]').forEach((a) => a.addEventListener('click', () => {
      const mail = a.getAttribute('href').replace('mailto:', '');
      const done = () => CL.toast && CL.toast(t('ui.emailCopied', { mail }));
      if (navigator.clipboard) navigator.clipboard.writeText(mail).then(done, done); else done();
    }));
    const track = document.querySelector('.mq-track');
    // measured again on every page: the footer is hidden in the Studio, where its width reads 0 (no motion)
    const pace = () => { if (track && track.scrollWidth) track.style.setProperty('--mq-dur', `${track.scrollWidth / 2 / 90}s`); };
    CL.paceFooter = pace;
    pace();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(pace);
    window.addEventListener('resize', CL.debounce(pace, 150), { passive: true });
    const giant = document.querySelector('.footer-giant');
    const fitGiant = () => {
      if (!giant) return;
      giant.style.fontSize = '100px';
      giant.style.fontSize = `${(document.documentElement.clientWidth / (giant.scrollWidth || 1)) * 100 * 0.98}px`;
    };
    fitGiant();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitGiant);
    window.addEventListener('resize', CL.debounce(fitGiant, 100), { passive: true });
    const header = document.getElementById('siteHeader');
    window.addEventListener('scroll', () => header.classList.toggle('scrolled', window.scrollY > 4), { passive: true });

    // Light / dark, remembered
    const themeBtn = document.getElementById('themeBtn');
    const setTheme = (mode) => {
      document.documentElement.setAttribute('data-theme', mode);
      if (themeBtn) {
        themeBtn.innerHTML = CL.icon(mode === 'dark' ? 'sun' : 'moon');
        themeBtn.setAttribute('aria-label', t(mode === 'dark' ? 'ui.lightTheme' : 'ui.darkTheme'));
        themeBtn.title = themeBtn.getAttribute('aria-label');
      }
    };
    setTheme(CL.store.settings.theme === 'dark' ? 'dark' : 'light');
    // relabel the theme button when the language changes
    I18N.onChange(() => setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'));
    if (themeBtn) themeBtn.addEventListener('click', () => {
      const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      CL.store.saveSettings({ theme: next });
      setTheme(next);
    });
    I18N.onChange(() => {
      buildLangSwitch();
      I18N.apply(document);
      render({ rerender: true });
    });
    window.addEventListener('hashchange', navigate);
    window.addEventListener('resize', () => setTimeout(setupFramerMotion, 100), { passive: true });

    if (!I18N.LANGS.length) return;
    buildLangSwitch();
    render();
  }

  document.addEventListener('DOMContentLoaded', init);
})(window.CL);
