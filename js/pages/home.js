/* ==========================================================
   COSLAB — Home Page (Orchard Studio® & Laconic Studio Layout)
   Minimal copy, massive editorial typography, continuous marquee,
   live 3D inspection showcase, interactive model table.
   ========================================================== */
(function (CL) {
  CL.pages = CL.pages || {};

  CL.pages.home = {
    titleKey: 'nav.home',
    appMode: false,

    render(container) {
      const root = CL.h('div.page.page-home');

      // 1. Minimalist Hero Section
      const hero = CL.h('section.hero', null,
        CL.h('div.container.hero-inner', null,
          CL.h('div.hero-meta-row', null,
            CL.h('div.pill-tag', { text: t('home.hero.badge') }),
            CL.h('span.index-num', { text: 'SEOUL · EST. 2026' })
          ),
          CL.h('div.hero-title-block', null,
            CL.h('h1.reveal-up', { text: t('home.hero.title') }),
            CL.h('p.reveal-up.stagger-1', { text: t('home.hero.desc') })
          ),
          CL.h('div.hero-actions-bar.reveal-up.stagger-2', null,
            CL.h('a.btn.btn-primary.btn-lg', {
              href: '#/design',
              html: `<span>${t('home.hero.cta')}</span>` + CL.icon('arrowRight'),
            }),
            CL.h('a.btn.btn-outline.btn-lg', {
              href: '#/gallery',
              html: `<span>${t('home.hero.galleryCta')}</span>`,
            })
          ),
          // 3 Metrics: (01), (02), (03)
          CL.h('div.hero-metrics-grid.reveal-up.stagger-3', null,
            CL.h('div.hero-metric-item', null,
              CL.h('div.metric-header', null, CL.h('span', { text: t('home.hero.stat1') }), CL.h('span', { text: 'ISO' })),
              CL.h('div.metric-val', { text: 'CGMP Certified' }),
              CL.h('div.metric-sub', { text: t('home.hero.stat1Desc') })
            ),
            CL.h('div.hero-metric-item', null,
              CL.h('div.metric-header', null, CL.h('span', { text: t('home.hero.stat2') }), CL.h('span', { text: 'PBR' })),
              CL.h('div.metric-val', { text: 'Real-time WebGL' }),
              CL.h('div.metric-sub', { text: t('home.hero.stat2Desc') })
            ),
            CL.h('div.hero-metric-item', null,
              CL.h('div.metric-header', null, CL.h('span', { text: t('home.hero.stat3') }), CL.h('span', { text: 'PROTOTYPE' })),
              CL.h('div.metric-val', { text: '72h Specimen' }),
              CL.h('div.metric-sub', { text: t('home.hero.stat3Desc') })
            )
          )
        )
      );

      // 2. Marquee Ticker Band (Orchard style continuous motion)
      const marqueeText = 'COSLAB ATELIER · BESPOKE LIPTINT · SEOUL LAB · 3D PACKAGING ENGINE · OEM / ODM · VELVET & GLASS · ';
      const marquee = CL.h('div.marquee-band', null,
        CL.h('div.marquee-track', null,
          CL.h('span.marquee-item', { text: marqueeText }),
          CL.h('span.marquee-item', { text: marqueeText }),
          CL.h('span.marquee-item', { text: marqueeText }),
          CL.h('span.marquee-item', { text: marqueeText })
        )
      );

      // 3. Live 3D Inspection Showcase (Orchard Frame)
      const showcase = CL.h('section.showcase-section#media', null,
        CL.h('div.container', null,
          CL.h('div.section-meta-head', null,
            CL.h('div', null,
              CL.h('span.index-num', { text: t('home.media.eyebrow') }),
              CL.h('h2', { text: t('home.media.title') })
            ),
            CL.h('p', { text: t('home.media.desc') })
          ),
          CL.h('div.showcase-canvas-box', null,
            CL.h('div.showcase-hud-tag', null,
              CL.h('span.pill-tag', { text: 'PBR Shading · 360°' }),
              CL.h('span.index-num', { text: 'ROTATION ACTIVE' })
            ),
            CL.h('div#showcase3dTarget', { style: { width: '100%', height: '100%' } }),
            CL.h('div.showcase-hud-bottom', {
              html: CL.icon('cube') + '<span> Drag to rotate · Scroll to zoom</span>',
            })
          )
        )
      );

      // 4. Interactive Silhouettes Table (Orchard Project Row style)
      const modelsSection = CL.h('section.models-index-section', null,
        CL.h('div.container', null,
          CL.h('div.section-meta-head', null,
            CL.h('div', null,
              CL.h('span.index-num', { text: '(03) SILHOUETTES' }),
              CL.h('h2', { text: 'Curated Packaging.' })
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
                  html: '<span>Launch</span>' + CL.icon('arrowRight'),
                })
              )
            )
          )
        )
      );

      // 5. Punchy Minimalist CTA Strip (Laconic Style)
      const cta = CL.h('section.strip-cta', null,
        CL.h('div.container', null,
          CL.h('span.index-num', { text: '(04) CREATION' }),
          CL.h('h2', { text: t('home.ctaBanner.title') }),
          CL.h('p', { text: t('home.ctaBanner.desc') }),
          CL.h('div', { style: { marginTop: '16px' } },
            CL.h('a.btn.btn-primary.btn-lg', {
              href: '#/design',
              html: `<span>${t('home.ctaBanner.btn')}</span>` + CL.icon('arrowRight'),
            })
          )
        )
      );

      root.append(hero, marquee, showcase, modelsSection, cta);
      container.appendChild(root);

      // Mount 3D engine on showcase box
      let preview = null;
      const target = document.getElementById('showcase3dTarget');
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
