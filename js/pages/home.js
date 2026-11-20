/* ==========================================================
   COSLAB — Home Page
   Typographic hero, then full-bleed studio renders.
   Minimal copy throughout.
   ========================================================== */
(function (CL) {
  CL.pages = CL.pages || {};

  CL.pages.home = {
    titleKey: 'nav.home',
    appMode: false,

    render(container) {
      const observers = [];
      const root = CL.h('div.page.page-home.lp');

      /* ---------- 1. Hero ---------- */
      // One giant line that spans the full width, then tagline ← → buttons on one row
      const title = CL.h('h1.lp-title', { text: 'COSLAB ATELIER' });
      const hero = CL.h('section.lp-hero', null,
        CL.h('div.container.lp-hero-grid', null,
          title,
          CL.h('div.lp-hero-row', null,
            CL.h('p.lp-tagline', { 'data-i18n': 'landing.tagline', text: t('landing.tagline') }),
            CL.h('div.lp-actions', null,
              CL.h('a.btn.btn-primary.btn-lg', {
                href: '#/design',
                html: `<span data-i18n="landing.start">${t('landing.start')}</span>` + CL.icon('arrowRight'),
              }),
              CL.h('a.btn.btn-ghost.btn-lg', {
                href: '#/gallery',
                html: `<span data-i18n="landing.explore">${t('landing.explore')}</span>`,
              })
            )
          )
        )
      );

      /* ---------- 2. Full-bleed studio renders (edge to edge, no copy) ----------
         Each image eases from a slight zoom to rest as it scrolls into view. */
      const FB = (src, alt) => CL.h('figure.lp-fb-item', null,
        CL.h('img', { src, alt, loading: 'lazy', decoding: 'async' }));
      const fullbleed = CL.h('section.lp-fb#worksSection', { 'aria-label': 'COSLAB studio' },
        FB('assets/home/dmc-12.jpg', 'Lip gloss jars on a coffee table in a sunlit living room'),
        CL.h('div.lp-fb-row', null,
          FB('assets/home/dmc-346.jpg', 'Two eyeshadow palettes in clear cases'),
          FB('assets/home/dmc-2355.jpg', 'Oversized lip gloss jar in a warm, sunlit room')
        ),
        FB('assets/home/dmc-12345.jpg', 'Lip gloss jar suspended between two rock forms')
      );
      if ('IntersectionObserver' in window) {
        const fbIo = new IntersectionObserver((entries) => {
          entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); fbIo.unobserve(e.target); } });
        }, { threshold: 0.15 });
        fullbleed.querySelectorAll('.lp-fb-item').forEach((el) => fbIo.observe(el));
        observers.push(fbIo);
      } else {
        fullbleed.querySelectorAll('.lp-fb-item').forEach((el) => el.classList.add('is-in'));
      }

      root.append(hero, fullbleed);
      container.appendChild(root);

      // Fit the title to the container width exactly (measure at a reference size, then scale)
      const fitTitle = () => {
        const box = title.parentElement;
        if (!box) return;
        const avail = box.clientWidth - parseFloat(getComputedStyle(box).paddingLeft) - parseFloat(getComputedStyle(box).paddingRight);
        title.style.fontSize = '100px';
        const w = title.scrollWidth || 1;
        title.style.fontSize = `${Math.max(40, Math.floor((avail / w) * 100 * 0.995))}px`;
      };
      fitTitle();
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitTitle);
      const onResize = CL.debounce(fitTitle, 80);
      window.addEventListener('resize', onResize, { passive: true });

      return () => {
        observers.forEach((io) => io && io.disconnect());
        window.removeEventListener('resize', onResize);
      };
    },
  };
})(window.CL);
