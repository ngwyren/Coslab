/* ==========================================================
   COSLAB — Home Page
   Visual-first landing: hero with live tubes, 4-step flow,
   stat strip, three campaign photos and a closing CTA.
   Minimal copy throughout.
   ========================================================== */
(function (CL) {
  CL.pages = CL.pages || {};

  const STEPS = [
    { key: 'landing.step1', viz: 'shape' },
    { key: 'landing.step2', viz: 'color' },
    { key: 'landing.step3', viz: 'type' },
    { key: 'landing.step4', viz: 'logo' },
  ];

  const STATS = [
    { value: 72, suffix: 'h', key: 'landing.s1' },
    { value: 0.1, suffix: 'mm', decimals: 1, key: 'landing.s2' },
    { value: 4, suffix: '', key: 'landing.s4' },
    { text: 'ISO 22716', key: 'landing.s3' },
  ];

  const tube = (tplId, modelId, w, opts = {}) =>
    CL.render.renderTight(CL.templates.createDesign(tplId, modelId), Object.assign({ width: w }, opts));


  /** Animate numbers from 0 → value once visible. */
  function countUp(el, value, decimals = 0, suffix = '') {
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fmt = (v) => v.toFixed(decimals) + suffix;
    if (reduce || !('IntersectionObserver' in window)) { el.textContent = fmt(value); return null; }
    el.textContent = fmt(0);
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      const t0 = performance.now(), dur = 1100;
      const step = (now) => {
        const p = Math.min(1, (now - t0) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = fmt(value * eased);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, { threshold: 0.4 });
    io.observe(el);
    return io;
  }

  function stepVisual(kind) {
    if (kind === 'shape') {
      return '<svg viewBox="0 0 60 60" aria-hidden="true"><rect x="22" y="6" width="16" height="20" rx="4" fill="none" stroke="currentColor" stroke-width="1.6"/><rect x="22" y="27" width="16" height="27" rx="4" fill="currentColor"/></svg>';
    }
    if (kind === 'color') {
      const dots = ['#b85c66', '#8d4a5c', '#d98b8b', '#171615'];
      return '<svg viewBox="0 0 60 60" aria-hidden="true">' +
        dots.map((c, i) => `<circle cx="${14 + (i % 2) * 22 + 5}" cy="${16 + Math.floor(i / 2) * 22 + 3}" r="9" fill="${c}"/>`).join('') + '</svg>';
    }
    if (kind === 'type') {
      return '<svg viewBox="0 0 60 60" aria-hidden="true"><text x="30" y="40" text-anchor="middle" font-family="Italiana, serif" font-size="30" fill="currentColor">Aa</text></svg>';
    }
    return '<svg viewBox="0 0 60 60" aria-hidden="true"><circle cx="30" cy="30" r="17" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M30 19 L33 27 L41 30 L33 33 L30 41 L27 33 L19 30 L27 27 Z" fill="currentColor"/></svg>';
  }

  CL.pages.home = {
    titleKey: 'nav.home',
    appMode: false,

    render(container) {
      const observers = [];
      const root = CL.h('div.page.page-home.lp');

      /* ---------- 1. Hero ---------- */
      const hero = CL.h('section.lp-hero', null,
        CL.h('div.container.lp-hero-grid', null,
          CL.h('div.lp-hero-copy', null,
            CL.h('h1.lp-title', { html: 'COSLAB<br/>ATELIER' }),
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
          ),
          CL.h('div.lp-hero-stage', { 'aria-hidden': 'true' },
            CL.h('div.lp-hero-tube.t1', { html: tube('fig-mauve', 'velvet-round', 160) }),
            CL.h('div.lp-hero-tube.t2', { html: tube('dewy-glass', 'dewy-crystal', 200) }),
            CL.h('div.lp-hero-tube.t3', { html: tube('seoul-noir', 'square-monolith', 160) })
          )
        )
      );


      /* ---------- 5. Four steps ---------- */
      const steps = CL.h('section.lp-section', null,
        CL.h('div.container', null,
          CL.h('div.lp-head.framer-reveal', null,
            CL.h('h2', { 'data-i18n': 'landing.howTitle', text: t('landing.howTitle') })
          ),
          CL.h('div.lp-steps', null,
            STEPS.map((s, i) =>
              CL.h('a.lp-step.framer-reveal', { href: i === 0 ? '#/design' : `#/editor?step=${i}` },
                CL.h('span.lp-step-num', { text: String(i + 1).padStart(2, '0') }),
                CL.h('div.lp-step-viz', { html: stepVisual(s.viz) }),
                CL.h('span.lp-step-name', { 'data-i18n': s.key, text: t(s.key) })
              ))
          )
        )
      );

      /* ---------- 6. Stats ---------- */
      const stats = CL.h('section.lp-section.lp-stats-section', null,
        CL.h('div.container', null,
          CL.h('div.lp-stats', null,
            STATS.map((s) => {
              const num = CL.h('span.lp-stat-value');
              if (s.text) { num.textContent = s.text; num.classList.add('is-text'); }
              else observers.push(countUp(num, s.value, s.decimals || 0, s.suffix));
              return CL.h('div.lp-stat.framer-reveal', null,
                num,
                CL.h('span.lp-stat-label', { 'data-i18n': s.key, text: t(s.key) })
              );
            })
          )
        )
      );

      /* ---------- 6b. Collection — three large photos ---------- */
      const PHOTOS = [
        { src: 'assets/campaign-hero.jpg', title: 'Triad', key: 'landing.c1', alt: 'COSLAB lip tint trio' },
        { src: 'assets/campaign-duo.jpg', title: 'Velvet & Chrome', key: 'landing.c2', alt: 'Velvet and chrome lip tint duo' },
        { src: 'assets/campaign-detail.jpg', title: 'Crystal & Silk', key: 'landing.c3', alt: 'Crystal glass applicator on silk' },
      ];
      const photos = CL.h('section.lp-section#worksSection', null,
        CL.h('div.container', null,
          CL.h('div.lp-head.framer-reveal', null,
            CL.h('h2', { 'data-i18n': 'landing.collection', text: t('landing.collection') }),
            CL.h('a.lp-link', { href: '#/gallery', html: `<span data-i18n="landing.explore">${t('landing.explore')}</span>` + CL.icon('arrowRight') })
          ),
          CL.h('div.lp-photos', null,
            PHOTOS.map((p) =>
              CL.h('a.lp-photo.framer-reveal', { href: '#/design' },
                CL.h('div.lp-photo-media', null,
                  CL.h('img', { src: p.src, alt: p.alt, loading: 'lazy', decoding: 'async' })),
                CL.h('div.lp-photo-cap', null,
                  CL.h('strong', { text: p.title }),
                  CL.h('span', { 'data-i18n': p.key, text: t(p.key) })
                )
              ))
          )
        )
      );

      /* ---------- 7. Closing CTA ---------- */
      const cta = CL.h('section.lp-section', null,
        CL.h('div.container', null,
          CL.h('div.lp-cta.framer-reveal', null,
            CL.h('h2', { 'data-i18n': 'landing.ctaTitle', text: t('landing.ctaTitle') }),
            CL.h('a.btn.btn-lg.lp-cta-btn', {
              href: '#/design',
              html: `<span data-i18n="landing.start">${t('landing.start')}</span>` + CL.icon('arrowRight'),
            }),
            CL.h('div.lp-cta-tubes', { 'aria-hidden': 'true' },
              CL.h('div', { html: tube('velvet-rose', 'velvet-round', 120) }),
              CL.h('div', { html: tube('dewy-glass', 'dewy-crystal', 120) })
            )
          )
        )
      );

      root.append(hero, steps, stats, photos, cta);
      container.appendChild(root);

      return () => {
        observers.forEach((io) => io && io.disconnect());
      };
    },
  };
})(window.CL);
