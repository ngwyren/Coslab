/* ==========================================================
   COSLAB — Home Page (Pure White K-Beauty Editorial Layout)
   Minimal copy, pure white background, floating 3D center stage,
   and instant silhouette launcher.
   ========================================================== */
(function (CL) {
  CL.pages = CL.pages || {};

  CL.pages.home = {
    titleKey: 'nav.home',
    appMode: false,

    render(container) {
      const root = CL.h('div.page.page-home');

      // 1. Hero Stage: Pure White & Centered 3D Liptint
      const hero = CL.h('section.hero', null,
        CL.h('div.container.hero-inner', null,
          // Top metadata line
          CL.h('div.hero-meta-row', null,
            CL.h('span.pill-tag', { text: 'COSLAB · SEOUL LAB' }),
            CL.h('span.index-num', { text: 'EST. 2026' })
          ),

          // Central Minimalist Headline
          CL.h('div.hero-title-block', null,
            CL.h('h1.reveal-up', { text: t('home.hero.title') }),
            CL.h('p.reveal-up.stagger-1', { text: t('home.hero.desc') })
          ),

          // Center Stage 3D Showcase (Pure White Studio)
          CL.h('div.showcase-canvas-box.reveal-up.stagger-2', { style: { height: '540px', marginTop: '12px' } },
            CL.h('div.showcase-hud-tag', null,
              CL.h('span.pill-tag', { text: '360° PBR' }),
              CL.h('span.index-num', { text: 'LIVE ROTATION' })
            ),
            CL.h('div#hero3dTarget', { style: { width: '100%', height: '100%' } }),
            CL.h('div.showcase-hud-bottom', {
              html: CL.icon('cube') + '<span> Drag to rotate · Scroll to zoom</span>',
            })
          ),

          // Action buttons below 3D stage
          CL.h('div.hero-actions-bar.reveal-up.stagger-3', { style: { justifyContent: 'center', marginTop: '20px' } },
            CL.h('a.btn.btn-primary.btn-lg', {
              href: '#/design',
              html: `<span>${t('home.hero.cta')}</span>` + CL.icon('arrowRight'),
            }),
            CL.h('a.btn.btn-outline.btn-lg', {
              href: '#/gallery',
              html: `<span>${t('home.hero.galleryCta')}</span>`,
            })
          )
        )
      );

      // 2. Subtle Marquee Ticker (Pure White style)
      const marqueeText = 'COSLAB ATELIER · BESPOKE LIPTINT · SEOUL LAB · 3D PACKAGING ENGINE · OEM / ODM · VELVET & GLASS · ';
      const marquee = CL.h('div.marquee-band', null,
        CL.h('div.marquee-track', null,
          CL.h('span.marquee-item', { text: marqueeText }),
          CL.h('span.marquee-item', { text: marqueeText }),
          CL.h('span.marquee-item', { text: marqueeText }),
          CL.h('span.marquee-item', { text: marqueeText })
        )
      );

      // 3. Minimal Silhouettes Table (Clean 1-Click Launch)
      const modelsSection = CL.h('section.models-index-section', null,
        CL.h('div.container', null,
          CL.h('div.section-meta-head', null,
            CL.h('div', null,
              CL.h('span.index-num', { text: '(01) SILHOUETTES' }),
              CL.h('h2', { text: 'Packaging Models.' })
            ),
            CL.h('a.btn.btn-outline.btn-sm', {
              href: '#/design',
              html: `<span>View All</span>` + CL.icon('arrowRight'),
            })
          ),
          CL.h('div.models-table', null,
            CL.models.MODELS.map((m, idx) =>
              CL.h('div.model-row-item', {
                onclick: () => {
                  const dsn = CL.templates.createDesign('velvet-rose', m.id);
                  CL.store.saveDraft(dsn);
                  CL.go('#/editor');
                },
              },
                CL.h('span.index-num', { text: `[0${idx + 1}]` }),
                CL.h('h3', { text: t(m.nameKey) }),
                CL.h('p', { text: t(m.descKey) }),
                CL.h('span.model-row-action', {
                  html: '<span>Design</span>' + CL.icon('arrowRight'),
                })
              )
            )
          )
        )
      );

      // 4. Clean White CTA
      const cta = CL.h('section.strip-cta', null,
        CL.h('div.container', null,
          CL.h('span.index-num', { text: '(02) CREATION' }),
          CL.h('h2', { text: t('home.ctaBanner.title') }),
          CL.h('div', { style: { marginTop: '20px' } },
            CL.h('a.btn.btn-primary.btn-lg', {
              href: '#/design',
              html: `<span>${t('home.ctaBanner.btn')}</span>` + CL.icon('arrowRight'),
            })
          )
        )
      );

      root.append(hero, marquee, modelsSection, cta);
      container.appendChild(root);

      // Initialize 3D Engine in the central stage
      let preview = null;
      const target = document.getElementById('hero3dTarget');
      if (target && window.THREE) {
        preview = new CL.Preview3D(target, { autoRotate: true, interactive: true });
        const demoDesign = CL.templates.createDesign('velvet-rose', 'velvet-round');
        preview.setDesign(demoDesign);
      }

      return () => {
        if (preview) preview.dispose();
      };
    },
  };
})(window.CL);
