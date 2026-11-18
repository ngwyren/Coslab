/* ==========================================================
   COSLAB — Home Page (Minimalist Swiss / Bento Grid Architecture)
   High-contrast editorial layout, optimized WebP media, concise specs,
   zero prose clutter, and reactive multi-language switching.
   ========================================================== */
(function (CL) {
  CL.pages = CL.pages || {};

  CL.pages.home = {
    titleKey: 'nav.home',
    appMode: false,

    render(container) {
      const root = CL.h('div.page.page-home');

      // 1. Hero Section (2-Column Swiss Architectural Grid)
      const hero = CL.h('section.hero', null,
        CL.h('div.container.hero-grid', null,
          CL.h('div.hero-title-block', null,
            CL.h('span.orchard-eyebrow', { 'data-i18n': 'home.eyebrow', text: t('home.eyebrow') }),
            CL.h('h1.hero-giant-title.reveal-up', { text: 'COSLAB ATELIER' })
          ),
          CL.h('div.hero-aside-block.reveal-up.stagger-1', null,
            CL.h('p.orchard-manifesto', {
              'data-i18n': 'home.manifesto1',
              text: t('home.manifesto1'),
            }),
            CL.h('div.hero-actions-bar', null,
              CL.h('a.btn.btn-primary.btn-lg', {
                href: '#/design',
                html: `<span data-i18n="home.launchStudio">${t('home.launchStudio')}</span>`,
              }),
              CL.h('button.btn.btn-outline.btn-lg', {
                onclick: () => {
                  document.getElementById('worksSection')?.scrollIntoView({ behavior: 'smooth' });
                },
                html: `<span data-i18n="home.exploreWorks">${t('home.exploreWorks')}</span>`,
              })
            )
          )
        )
      );

      // 2. Silhouettes & Finishes (12-Column Asymmetric Bento Grid)
      const worksData = [
        {
          span: 'bento-span-7',
          tpl: 'dewy-glass',
          model: 'dewy-crystal',
          img: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&fm=webp&w=900&q=75',
          badge: 'home.work1Badge',
          title: 'home.work1Title',
          desc: 'home.work1Desc',
          eager: true,
        },
        {
          span: 'bento-span-5',
          tpl: 'velvet-rose',
          model: 'velvet-round',
          img: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&fm=webp&w=700&q=75',
          badge: 'home.work2Badge',
          title: 'home.work2Title',
          desc: 'home.work2Desc',
          eager: true,
        },
        {
          span: 'bento-span-4',
          tpl: 'seoul-noir',
          model: 'square-monolith',
          img: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&fm=webp&w=600&q=75',
          badge: 'home.work3Badge',
          title: 'home.work3Title',
          desc: 'home.work3Desc',
        },
        {
          span: 'bento-span-4',
          tpl: 'chrome-minimal',
          model: 'slim-atelier',
          img: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&fm=webp&w=600&q=75',
          badge: 'home.work4Badge',
          title: 'home.work4Title',
          desc: 'home.work4Desc',
        },
        {
          span: 'bento-span-4',
          tpl: 'porcelain-ivory',
          model: 'velvet-round',
          img: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&fm=webp&w=600&q=75',
          badge: 'home.work5Badge',
          title: 'home.work5Title',
          desc: 'home.work5Desc',
        },
      ];

      const worksSection = CL.h('section.orchard-works-section#worksSection', null,
        CL.h('div.container', null,
          CL.h('div.section-meta-head', null,
            CL.h('h2', { 'data-i18n': 'home.worksHeading', text: t('home.worksHeading') }),
            CL.h('span.mono.muted', { 'data-i18n': 'home.worksSectionNum', text: t('home.worksSectionNum') })
          ),

          CL.h('div.orchard-bento-grid', null,
            worksData.map((w) =>
              CL.h(`div.orchard-work-card.${w.span}`, {
                onclick: () => {
                  const d = CL.templates.createDesign(w.tpl, w.model);
                  CL.store.saveDraft(d);
                  CL.go('#/editor');
                },
              },
                CL.h('img.orchard-work-img', {
                  src: w.img,
                  alt: t(w.title),
                  loading: w.eager ? 'eager' : 'lazy',
                  decoding: 'async',
                }),
                CL.h('div.orchard-work-overlay', null,
                  CL.h('span.orchard-work-badge', { 'data-i18n': w.badge, text: t(w.badge) }),
                  CL.h('div.orchard-work-info', null,
                    CL.h('div', null,
                      CL.h('h3.orchard-work-title', { 'data-i18n': w.title, text: t(w.title) }),
                      CL.h('p.orchard-work-desc', { 'data-i18n': w.desc, text: t(w.desc) })
                    ),
                    CL.h('span.orchard-work-icon-btn', { html: CL.icon('arrowRight') })
                  )
                )
              )
            )
          )
        )
      );

      // 3. Lab Standards (3x2 Architectural Hairline Grid)
      const standardsSection = CL.h('section.orchard-standards-section', null,
        CL.h('div.container', null,
          CL.h('div.section-meta-head', null,
            CL.h('h2', { 'data-i18n': 'home.standardsHeading', text: t('home.standardsHeading') }),
            CL.h('span.mono.muted', { 'data-i18n': 'home.standardsBadge', text: t('home.standardsBadge') })
          ),

          CL.h('div.standards-bento-grid', null,
            [
              ['home.std1Tag', 'home.std1Title', 'home.std1Desc'],
              ['home.std2Tag', 'home.std2Title', 'home.std2Desc'],
              ['home.std3Tag', 'home.std3Title', 'home.std3Desc'],
              ['home.std4Tag', 'home.std4Title', 'home.std4Desc'],
              ['home.std5Tag', 'home.std5Title', 'home.std5Desc'],
              ['home.std6Tag', 'home.std6Title', 'home.std6Desc'],
            ].map(([tagKey, titleKey, descKey]) =>
              CL.h('div.orchard-std-cell.orchard-table-row', null,
                CL.h('span.orchard-table-tag', { 'data-i18n': tagKey, text: t(tagKey) }),
                CL.h('h3', { 'data-i18n': titleKey, text: t(titleKey) }),
                CL.h('p', { 'data-i18n': descKey, text: t(descKey) })
              )
            )
          )
        )
      );

      // 4. Archive Notes / Engineering (Compact 3-Column Grid)
      const journalSection = CL.h('section.orchard-journal-section', null,
        CL.h('div.container', null,
          CL.h('div.section-meta-head', null,
            CL.h('h2', { 'data-i18n': 'home.journalHeading', text: t('home.journalHeading') }),
            CL.h('a.btn.btn-outline.btn-sm', { href: '#/gallery', html: `<span data-i18n="home.viewArchive">${t('home.viewArchive')}</span>` + CL.icon('arrowRight') })
          ),

          CL.h('div.orchard-journal-grid', null,
            [
              ['home.j1Date', 'home.j1Title', 'home.j1Desc'],
              ['home.j2Date', 'home.j2Title', 'home.j2Desc'],
              ['home.j3Date', 'home.j3Title', 'home.j3Desc'],
            ].map(([dateKey, titleKey, descKey]) => {
              const articleTitle = t(titleKey);
              return CL.h('div.orchard-journal-card', {
                onclick: () => {
                  CL.toast(articleTitle);
                },
              },
                CL.h('div.journal-card-top', null,
                  CL.h('span.orchard-journal-date', { 'data-i18n': dateKey, text: t(dateKey) }),
                  CL.h('span.journal-arrow', { html: '↗' })
                ),
                CL.h('h4', { 'data-i18n': titleKey, text: articleTitle }),
                CL.h('p', { 'data-i18n': descKey, text: t(descKey) })
              );
            })
          )
        )
      );

      // 5. Connect Bar (Horizontal 2-Column Split Grid)
      const emailInput = CL.h('input.input', { placeholder: t('home.connectPlaceholder'), 'data-i18n-ph': 'home.connectPlaceholder', type: 'email' });
      const connectSection = CL.h('section.orchard-connect-section', null,
        CL.h('div.container', null,
          CL.h('div.orchard-connect-box', null,
            CL.h('div.connect-copy', null,
              CL.h('h2', { 'data-i18n': 'home.connectHeading', text: t('home.connectHeading') }),
              CL.h('p', { 'data-i18n': 'home.connectDesc', text: t('home.connectDesc') })
            ),
            CL.h('div.orchard-connect-form', null,
              emailInput,
              CL.h('button.btn.btn-primary', {
                'data-i18n': 'home.subscribe',
                text: t('home.subscribe'),
                onclick: () => {
                  if (emailInput.value.includes('@')) {
                    CL.toast(t('home.subscribeSuccess'));
                    emailInput.value = '';
                  } else {
                    CL.toast(t('home.subscribeError'));
                  }
                },
              })
            )
          )
        )
      );

      root.append(hero, worksSection, standardsSection, journalSection, connectSection);
      container.appendChild(root);

      return () => {};
    },
  };
})(window.CL);
