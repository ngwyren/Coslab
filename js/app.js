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
    settings: { page: 'settings', nav: 'settings' },
  };

  function parse() {
    const raw = location.hash.replace(/^#\/?/, '');
    const [pathPart, qs] = raw.split('?');
    const segs = pathPart.split('/').filter(Boolean);
    const query = Object.fromEntries(new URLSearchParams(qs || ''));
    return { segs, key: segs[0] || '', sub: segs[1] || '', query };
  }

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
      const groupSelectors = ['.orchard-works-row', '.orchard-journal-grid', '.orchard-table'];
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

  function render(opts = {}) {
    const r = parse();
    const route = ROUTES[r.key] || ROUTES[''];
    const page = CL.pages[route.page];
    if (typeof cleanup === 'function') { try { cleanup(); } catch (e) { console.error(e); } }
    cleanup = null;
    CL.closeMenu();
    app.innerHTML = '';
    document.body.classList.toggle('app-mode', !!page.appMode);
    document.querySelectorAll('.main-nav a').forEach((a) => a.classList.toggle('is-active', a.dataset.route === route.nav));
    document.getElementById('mainNav').classList.remove('open');
    current = { route, r };
    cleanup = page.render(app, { query: r.query, sub: r.sub, anchor: route.anchor, rerender: !!opts.rerender });
    I18N.apply(document);
    document.title = `${t(page.titleKey || 'nav.home')} — COSLAB`;
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
    document.getElementById('navToggle').innerHTML = CL.icon('menu');
    document.getElementById('navToggle').addEventListener('click', () => document.getElementById('mainNav').classList.toggle('open'));
    const header = document.getElementById('siteHeader');
    window.addEventListener('scroll', () => header.classList.toggle('scrolled', window.scrollY > 4), { passive: true });

    document.documentElement.setAttribute('data-theme', 'light');
    I18N.onChange(() => {
      buildLangSwitch();
      I18N.apply(document);
      render({ rerender: true });
    });
    I18N.setLang(CL.store.settings.lang || 'vi');
    window.addEventListener('hashchange', () => render());
    window.addEventListener('resize', () => setTimeout(setupFramerMotion, 100), { passive: true });

    if (!I18N.LANGS.length) return;
    buildLangSwitch();
    render();
  }

  document.addEventListener('DOMContentLoaded', init);
})(window.CL);
