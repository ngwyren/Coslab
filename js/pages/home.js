/* ==========================================================
   COSLAB — Home Page (Minimalist Editorial + Full-Bleed Visual)
   Massive edge-to-edge campaign visual, 3x2 lab grid, zero clutter.
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

      // 2. Massive Full-Bleed (Tràn Viền) Editorial Campaign Visual
      const campaignSection = CL.h('section.fullbleed-campaign-section#worksSection', null,
        CL.h('a.fullbleed-campaign-frame', {
          href: '#/design',
          'aria-label': 'COSLAB Bespoke Liptint Campaign',
        },
          CL.h('img.fullbleed-campaign-img', {
            src: 'assets/campaign-hero.jpg',
            alt: 'COSLAB Atelier Bespoke Lip Tint Collection',
            loading: 'eager',
            decoding: 'async',
            fetchpriority: 'high',
          }),
          CL.h('div.fullbleed-campaign-cta', null,
            CL.h('span', { 'data-i18n': 'home.launchStudio', text: t('home.launchStudio') })
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

      root.append(hero, campaignSection, standardsSection, journalSection, connectSection);
      container.appendChild(root);

      return () => {};
    },
  };
})(window.CL);
