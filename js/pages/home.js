/* ==========================================================
   COSLAB — Home Page
   Editorial layout: a giant fitted wordmark with a quiet info row,
   then a tight grid of studio renders with labels set on the image.
   Minimal copy throughout.
   ========================================================== */
(function (CL) {
  CL.pages = CL.pages || {};

  // Studio renders. Titles/tags are short placeholders — rename freely.
  // tone: 'light' = white label (dark photo), 'dark' = black label (bright photo)
  const WORKS = [
    [
      { src: 'assets/home/dmc-12.jpg', title: 'Jam Gloss', tags: 'Glass jar · Lip gloss', tone: 'light', alt: 'Lip gloss jars on a coffee table in a sunlit living room' },
      { src: 'assets/home/dmc-346.jpg', title: 'Palette', tags: 'Eyeshadow · Clear case', tone: 'dark', alt: 'Two eyeshadow palettes in clear cases' },
    ],
    [{ src: 'assets/home/dmc-2355.jpg', title: 'Living Room', tags: 'Scene · 3D render', tone: 'light', alt: 'Oversized lip gloss jar in a warm, sunlit room' }],
    [{ src: 'assets/home/dmc-12345.jpg', title: 'Monolith', tags: 'Concept · Still life', tone: 'dark', alt: 'Lip gloss jar suspended between two rock forms' }],
  ];

  CL.pages.home = {
    titleKey: 'nav.home',
    appMode: false,

    render(container) {
      const observers = [];
      const root = CL.h('div.page.page-home.lp');

      /* ---------- 1. Hero ---------- */
      const title = CL.h('h1.lp-title', { text: 'COSLAB ATELIER' });
      const hero = CL.h('section.lp-hero', null,
        CL.h('div.container.lp-hero-grid', null,
          title,
          // Compact note tucked under the wordmark: narrow paragraph (first line indented) + one action
          CL.h('div.lp-hero-note', null,
            // one sentence per line (break after . ! ? 。) — the page re-renders on language change
            CL.h('p.lp-tagline', {
              html: String(t('landing.tagline')).split(/(?<=[.!?。！？])\s*/).filter(Boolean).map(CL.esc).join('<br/>'),
            }),
            CL.h('a.btn.btn-primary.btn-sm.lp-hero-cta', {
              href: '#/design',
              html: `<span data-i18n="landing.start">${t('landing.start')}</span>` + CL.icon('arrowRight'),
            })
          )
        )
      );

      /* ---------- 2. Works grid ----------
         Tight gutters, thin page margin, square corners; title on the left
         and tags on the right, both set on the image. */
      const tile = (w) => CL.h('figure.lp-work' + (w.tone === 'dark' ? '.is-dark' : ''), null,
        CL.h('img', { src: w.src, alt: w.alt, loading: 'lazy', decoding: 'async' }),
        CL.h('figcaption.lp-work-cap', null,
          CL.h('span.lp-work-title', { text: w.title }),
          CL.h('span.lp-work-tags', { text: w.tags })
        ));
      const works = CL.h('section.lp-works#worksSection', { 'aria-label': 'COSLAB studio' },
        WORKS.map((row) => CL.h('div.lp-works-row' + (row.length === 1 ? '.is-full' : ''), null, row.map(tile))));

      if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
          entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
        }, { threshold: 0.12 });
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
