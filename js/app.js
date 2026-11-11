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
    I18N.apply(app);
    document.title = `${t(page.titleKey || 'nav.home')} — COSLAB`;
    if (!opts.rerender) {
      if (route.anchor) setTimeout(() => { const el = document.getElementById(route.anchor); el && el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 60);
      else window.scrollTo({ top: 0 });
    }
  }

  /* ---------- Language switcher ---------- */
  function buildLangSwitch() {
    const host = document.getElementById('langSwitch');
    host.innerHTML = '';
    const meta = I18N.meta;
    const btn = CL.h('button.lang-btn', { type: 'button', 'aria-haspopup': 'menu', html: CL.icon('globe') + `<span class="lang-name"></span>` + CL.icon('chevronDown') });
    btn.querySelector('.lang-name').textContent = meta.name;
    btn.addEventListener('click', () => {
      CL.menu(btn, I18N.LANGS.map((l) => ({
        label: l.name, active: l.code === I18N.lang, right: `<span class="code">${l.code}</span>`,
        icon: l.code === I18N.lang ? 'check' : null,
        onClick: () => CL.setLang(l.code),
      })));
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

    document.documentElement.setAttribute('data-theme', 'light'); // light only for now
    I18N.onChange(() => { buildLangSwitch(); render({ rerender: true }); });
    I18N.setLang(CL.store.settings.lang || 'vi');
    window.addEventListener('hashchange', () => render());
    if (!I18N.LANGS.length) return;
    buildLangSwitch();
    render();
  }

  document.addEventListener('DOMContentLoaded', init);
})(window.CL);
