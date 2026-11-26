/* ==========================================================
   COSLAB — Home Page
   Editorial layout: a giant fitted wordmark with a quiet info row,
   then a tight grid of studio renders with labels set on the image.
   Minimal copy throughout.
   ========================================================== */
(function (CL) {
  CL.pages = CL.pages || {};

  // Studio renders shown as an image-only grid (rows of 2, then full-width rows)
  const WORKS = [
    [
      { src: 'assets/home/dmc-12', alt: 'Lip gloss jars on a coffee table in a sunlit living room' },
      { src: 'assets/home/dmc-346', alt: 'Two eyeshadow palettes in clear cases' },
    ],
    [{ src: 'assets/home/dmc-2355', alt: 'Oversized lip gloss jar in a warm, sunlit room' }],
    [{ src: 'assets/home/dmc-12345', alt: 'Lip gloss jar suspended between two rock forms' }],
  ];

  CL.pages.home = {
    titleKey: 'nav.home',
    appMode: false,

    render(container) {
      const observers = [];
      const root = CL.h('div.page.page-home.lp');

      /* ---------- 1. Hero ---------- */
      // Two words as separate spans: one line on desktop, stacked on phones (see home.css)
      const title = CL.h('h1.lp-title', { 'aria-label': 'COSLAB ATELIER' },
        // the L gets its own span: with tight tracking its foot would touch the next A
        CL.h('span.lp-title-word', null, 'COS', CL.h('span.lp-kern-l', { text: 'L' }), 'AB'), ' ',
        CL.h('span.lp-title-word', { text: 'ATELIER' }));
      const hero = CL.h('section.lp-hero', null,
        CL.h('div.container.lp-hero-grid', null,
          title,
          // One large action, centred under the wordmark
          CL.h('div.lp-hero-note', null,
            CL.h('a.btn.btn-primary.btn-lg.lp-hero-cta', {
              href: '#/design',
              html: `<span data-i18n="nav.start">${t('nav.start')}</span>`,
            })
          )
        )
      );

      /* ---------- 2. Works grid ----------
         Tight gutters, thin page margin, square corners; images only, no labels. */
      const tile = (w, full) => CL.h('figure.lp-work', null,
        CL.h('img', {
          src: `${w.src}-2000.webp`,
          srcset: `${w.src}-900.webp 900w, ${w.src}-2000.webp 2000w`,
          sizes: full ? '100vw' : '(max-width: 760px) 100vw, 50vw',
          width: 2000, height: 1125, alt: w.alt, loading: 'lazy', decoding: 'async',
        }));
      const works = CL.h('section.lp-works#worksSection', { 'aria-label': 'COSLAB studio' },
        WORKS.map((row) => CL.h('div.lp-works-row' + (row.length === 1 ? '.is-full' : ''), null, row.map((w) => tile(w, row.length === 1)))));

      if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
          entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
        }, { threshold: 0.25 }); // reveal only once a quarter of the tile is on screen
        works.querySelectorAll('.lp-work').forEach((el) => io.observe(el));
        observers.push(io);
      } else {
        works.querySelectorAll('.lp-work').forEach((el) => el.classList.add('is-in'));
      }

      root.append(hero, works);
      container.appendChild(root);

      // Fit the wordmark to the container width exactly (measure at a reference size, then scale)
      const fitTitle = () => {
        const box = title.parentElement;
        if (!box) return;
        const cs = getComputedStyle(box);
        const avail = box.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
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
