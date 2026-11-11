/* ==========================================================
   Home page: Hero, About Us, 3D Showcase, Factory OEM credentials
   ========================================================== */
(function (CL) {
  CL.pages = CL.pages || {};

  CL.pages.home = {
    titleKey: 'nav.home',
    appMode: false,

    render(container, { anchor }) {
      const root = CL.h('div.page.page-home');

      // 1. Hero
      const hero = CL.h('section.hero', null,
        CL.h('div.container.hero-content', null,
          CL.h('div.hero-badge', { text: t('home.hero.badge') }),
          CL.h('h1', { text: t('home.hero.title') }),
          CL.h('p', { text: t('home.hero.desc') }),
          CL.h('div.hero-actions', null,
            CL.h('a.btn.btn-primary.btn-lg', { href: '#/design', html: CL.icon('star') + `<span>${t('home.hero.cta')}</span>` }),
            CL.h('a.btn.btn-outline.btn-lg', { href: '#/gallery', html: CL.icon('grid') + `<span>${t('home.hero.galleryCta')}</span>` })
          ),
          CL.h('div.hero-stats', null,
            CL.h('div.hero-stat', null, CL.h('div.hero-stat-val', { text: t('home.hero.stat1') }), CL.h('div.hero-stat-desc', { text: t('home.hero.stat1Desc') })),
            CL.h('div.hero-stat', null, CL.h('div.hero-stat-val', { text: t('home.hero.stat2') }), CL.h('div.hero-stat-desc', { text: t('home.hero.stat2Desc') })),
            CL.h('div.hero-stat', null, CL.h('div.hero-stat-val', { text: t('home.hero.stat3') }), CL.h('div.hero-stat-desc', { text: t('home.hero.stat3Desc') }))
          )
        )
      );

      // 2. About us
      const about = CL.h('section.section#about', null,
        CL.h('div.container', null,
          CL.h('div.about-hero-grid', null,
            CL.h('div.about-text', null,
              CL.h('span.eyebrow', { text: t('home.about.eyebrow') }),
              CL.h('h2', { text: t('home.about.title') }),
              CL.h('p.muted', { text: t('home.about.desc1') }),
              CL.h('p.muted', { text: t('home.about.desc2') })
            ),
            CL.h('div.about-preview', null,
              CL.h('div.about-preview-badge', { text: 'OEM / ODM Manufacturing' }),
              CL.h('div.card-preview-svg', { html: CL.render.renderSVG(CL.templates.createDesign('velvet-rose', 'velvet-round'), { width: 320, height: 420, shadow: true }) })
            )
          ),
          CL.h('div.grid-features', null,
            CL.h('div.card-feature', null,
              CL.h('div.feature-icon-box', { html: CL.icon('flask') }),
              CL.h('h3', { text: t('home.about.pillar1Title') }),
              CL.h('p', { text: t('home.about.pillar1Desc') })
            ),
            CL.h('div.card-feature', null,
              CL.h('div.feature-icon-box', { html: CL.icon('box') }),
              CL.h('h3', { text: t('home.about.pillar2Title') }),
              CL.h('p', { text: t('home.about.pillar2Desc') })
            ),
            CL.h('div.card-feature', null,
              CL.h('div.feature-icon-box', { html: CL.icon('factory') }),
              CL.h('h3', { text: t('home.about.pillar3Title') }),
              CL.h('p', { text: t('home.about.pillar3Desc') })
            )
          )
        )
      );

      // 3. 3D Showcase & Media
      const media = CL.h('section.section#media', { style: { background: 'var(--bg-soft)' } },
        CL.h('div.container', null,
          CL.h('div.section-head', null,
            CL.h('span.eyebrow', { text: t('home.media.eyebrow') }),
            CL.h('h2', { text: t('home.media.title') }),
            CL.h('p', { text: t('home.media.desc') })
          ),
          CL.h('div.showcase-3d-wrapper', null,
            CL.h('div.showcase-info', null,
              CL.h('h3', { text: 'Real-time WebGL Engine', style: { marginBottom: '16px' } }),
              CL.h('div', { style: { display: 'grid', gap: '14px', marginBottom: '24px' } },
                CL.h('div', { style: { display: 'flex', gap: '10px', alignItems: 'center' }, html: CL.icon('check') + `<span>${t('home.media.feature1')}</span>` }),
                CL.h('div', { style: { display: 'flex', gap: '10px', alignItems: 'center' }, html: CL.icon('check') + `<span>${t('home.media.feature2')}</span>` }),
                CL.h('div', { style: { display: 'flex', gap: '10px', alignItems: 'center' }, html: CL.icon('check') + `<span>${t('home.media.feature3')}</span>` })
              ),
              CL.h('a.btn.btn-primary', { href: '#/design', html: CL.icon('star') + `<span>${t('nav.start')}</span>` })
            ),
            CL.h('div.showcase-preview-target#showcase3dTarget', null,
              CL.h('div.showcase-controls', { html: CL.icon('cube') + '<span> Drag to rotate 360°</span>' })
            )
          )
        )
      );

      // 4. CTA Banner
      const cta = CL.h('section.container', null,
        CL.h('div.cta-banner', null,
          CL.h('h2', { text: t('home.ctaBanner.title') }),
          CL.h('p', { text: t('home.ctaBanner.desc') }),
          CL.h('a.btn.btn-lg', { href: '#/design', html: CL.icon('star') + `<span>${t('home.ctaBanner.btn')}</span>` })
        )
      );

      root.append(hero, about, media, cta);
      container.appendChild(root);

      // Mount 3D showcase
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
