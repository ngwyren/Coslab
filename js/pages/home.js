/* ==========================================================
   COSLAB — Home Page (Orchard Studio® Minimalist Architecture)
   Exact aesthetic of https://orchard.framer.website/
   Giant display typography, screen-filling editorial media,
   3D PBR WebGL center stage, standards table, and atelier journal.
   Fully internationalized with reactive multi-language switching.
   ========================================================== */
(function (CL) {
  CL.pages = CL.pages || {};

  CL.pages.home = {
    titleKey: 'nav.home',
    appMode: false,

    render(container) {
      const root = CL.h('div.page.page-home');

      // 1. Hero Section (Orchard Studio Style)
      const hero = CL.h('section.hero', null,
        CL.h('div.container.hero-inner', null,
          // Massive Editorial Headline (Orchard Style)
          CL.h('div.hero-title-block', null,
            CL.h('h1.hero-giant-title.reveal-up', { text: 'COSLAB ATELIER' }),
            CL.h('p.orchard-manifesto.reveal-up.stagger-1', {
              'data-i18n': 'home.manifesto1',
              text: t('home.manifesto1'),
            })
          ),

          // Action buttons
          CL.h('div.hero-actions-bar.reveal-up.stagger-2', { style: { justifyContent: 'flex-start', marginTop: '24px' } },
            CL.h('a.btn.btn-primary.btn-lg', {
              href: '#/design',
              html: `<span data-i18n="home.launchStudio">${t('home.launchStudio')}</span>` + CL.icon('arrowRight'),
            }),
            CL.h('button.btn.btn-outline.btn-lg', {
              onclick: () => {
                document.getElementById('worksSection')?.scrollIntoView({ behavior: 'smooth' });
              },
              html: `<span data-i18n="home.exploreWorks">${t('home.exploreWorks')}</span>`,
            })
          )
        )
      );

      // 2. Subtle Marquee Ticker (Orchard Style)
      const marqueeText = 'COSLAB ATELIER · BESPOKE LIPTINT · SEOUL LAB · 3D PACKAGING ENGINE · OEM / ODM · VELVET & GLASS · CGMP KOREA · ';
      const marquee = CL.h('div.marquee-band', null,
        CL.h('div.marquee-track', null,
          CL.h('span.marquee-item', { text: marqueeText }),
          CL.h('span.marquee-item', { text: marqueeText }),
          CL.h('span.marquee-item', { text: marqueeText }),
          CL.h('span.marquee-item', { text: marqueeText })
        )
      );

      // 3. Orchard Works Showcase (Full-Screen & Split Large Media Cards)
      const worksSection = CL.h('section.orchard-works-section#worksSection', null,
        CL.h('div.container', null,
          CL.h('div.section-meta-head', null,
            CL.h('h2', { 'data-i18n': 'home.worksHeading', text: t('home.worksHeading') })
          ),

          CL.h('div.orchard-works-grid', null,
            // Work 01: Full-Width Massive Hero Showcase (Orchard style)
            CL.h('div.orchard-work-card.full-width', {
              onclick: () => {
                const d = CL.templates.createDesign('dewy-glass', 'dewy-crystal');
                CL.store.saveDraft(d);
                CL.go('#/editor');
              },
            },
              CL.h('img.orchard-work-img', {
                src: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=1200&q=80',
                alt: t('home.work1Title'),
                loading: 'eager',
                decoding: 'async',
              }),
              CL.h('div.orchard-work-overlay', null,
                CL.h('span.orchard-work-badge', { 'data-i18n': 'home.work1Badge', text: t('home.work1Badge') }),
                CL.h('div.orchard-work-info', null,
                  CL.h('div', null,
                    CL.h('h3.orchard-work-title', { 'data-i18n': 'home.work1Title', text: t('home.work1Title') }),
                    CL.h('p.orchard-work-desc', { 'data-i18n': 'home.work1Desc', text: t('home.work1Desc') })
                  ),
                  CL.h('span.orchard-work-btn', { html: `<span data-i18n="home.customize3d">${t('home.customize3d')}</span>` + CL.icon('arrowRight') })
                )
              )
            ),

            // Work 02 & 03: Split 2-Column Row (Orchard style)
            CL.h('div.orchard-works-row', null,
              CL.h('div.orchard-work-card.half-width', {
                onclick: () => {
                  const d = CL.templates.createDesign('velvet-rose', 'velvet-round');
                  CL.store.saveDraft(d);
                  CL.go('#/editor');
                },
              },
                CL.h('img.orchard-work-img', {
                  src: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=800&q=80',
                  alt: t('home.work2Title'),
                  loading: 'lazy',
                  decoding: 'async',
                }),
                CL.h('div.orchard-work-overlay', null,
                  CL.h('span.orchard-work-badge', { 'data-i18n': 'home.work2Badge', text: t('home.work2Badge') }),
                  CL.h('div.orchard-work-info', null,
                    CL.h('div', null,
                      CL.h('h3.orchard-work-title', { 'data-i18n': 'home.work2Title', text: t('home.work2Title') }),
                      CL.h('p.orchard-work-desc', { 'data-i18n': 'home.work2Desc', text: t('home.work2Desc') })
                    ),
                    CL.h('span.orchard-work-btn', { html: `<span data-i18n="home.design3d">${t('home.design3d')}</span>` + CL.icon('arrowRight') })
                  )
                )
              ),

              CL.h('div.orchard-work-card.half-width', {
                onclick: () => {
                  const d = CL.templates.createDesign('seoul-noir', 'square-monolith');
                  CL.store.saveDraft(d);
                  CL.go('#/editor');
                },
              },
                CL.h('img.orchard-work-img', {
                  src: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=800&q=80',
                  alt: t('home.work3Title'),
                  loading: 'lazy',
                  decoding: 'async',
                }),
                CL.h('div.orchard-work-overlay', null,
                  CL.h('span.orchard-work-badge', { 'data-i18n': 'home.work3Badge', text: t('home.work3Badge') }),
                  CL.h('div.orchard-work-info', null,
                    CL.h('div', null,
                      CL.h('h3.orchard-work-title', { 'data-i18n': 'home.work3Title', text: t('home.work3Title') }),
                      CL.h('p.orchard-work-desc', { 'data-i18n': 'home.work3Desc', text: t('home.work3Desc') })
                    ),
                    CL.h('span.orchard-work-btn', { html: `<span data-i18n="home.design3d">${t('home.design3d')}</span>` + CL.icon('arrowRight') })
                  )
                )
              )
            ),

            // Work 04 & 05: Split 2-Column Row (Orchard style)
            CL.h('div.orchard-works-row', null,
              CL.h('div.orchard-work-card.half-width', {
                onclick: () => {
                  const d = CL.templates.createDesign('chrome-minimal', 'slim-atelier');
                  CL.store.saveDraft(d);
                  CL.go('#/editor');
                },
              },
                CL.h('img.orchard-work-img', {
                  src: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80',
                  alt: t('home.work4Title'),
                  loading: 'lazy',
                  decoding: 'async',
                }),
                CL.h('div.orchard-work-overlay', null,
                  CL.h('span.orchard-work-badge', { 'data-i18n': 'home.work4Badge', text: t('home.work4Badge') }),
                  CL.h('div.orchard-work-info', null,
                    CL.h('div', null,
                      CL.h('h3.orchard-work-title', { 'data-i18n': 'home.work4Title', text: t('home.work4Title') }),
                      CL.h('p.orchard-work-desc', { 'data-i18n': 'home.work4Desc', text: t('home.work4Desc') })
                    ),
                    CL.h('span.orchard-work-btn', { html: `<span data-i18n="home.design3d">${t('home.design3d')}</span>` + CL.icon('arrowRight') })
                  )
                )
              ),

              CL.h('div.orchard-work-card.half-width', {
                onclick: () => {
                  const d = CL.templates.createDesign('porcelain-ivory', 'velvet-round');
                  CL.store.saveDraft(d);
                  CL.go('#/editor');
                },
              },
                CL.h('img.orchard-work-img', {
                  src: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=800&q=80',
                  alt: t('home.work5Title'),
                  loading: 'lazy',
                  decoding: 'async',
                }),
                CL.h('div.orchard-work-overlay', null,
                  CL.h('span.orchard-work-badge', { 'data-i18n': 'home.work5Badge', text: t('home.work5Badge') }),
                  CL.h('div.orchard-work-info', null,
                    CL.h('div', null,
                      CL.h('h3.orchard-work-title', { 'data-i18n': 'home.work5Title', text: t('home.work5Title') }),
                      CL.h('p.orchard-work-desc', { 'data-i18n': 'home.work5Desc', text: t('home.work5Desc') })
                    ),
                    CL.h('span.orchard-work-btn', { html: `<span data-i18n="home.design3d">${t('home.design3d')}</span>` + CL.icon('arrowRight') })
                  )
                )
              )
            )
          )
        )
      );

      // 4. Orchard Standards & Foundry Table (Orchard Client Table Style)
      const standardsSection = CL.h('section.orchard-standards-section', null,
        CL.h('div.container', null,
          CL.h('div.section-meta-head', null,
            CL.h('h2', { 'data-i18n': 'home.standardsHeading', text: t('home.standardsHeading') })
          ),

          CL.h('div.orchard-table', null,
            [
              ['home.std1Title', 'home.std1Desc', 'home.std1Tag'],
              ['home.std2Title', 'home.std2Desc', 'home.std2Tag'],
              ['home.std3Title', 'home.std3Desc', 'home.std3Tag'],
              ['home.std4Title', 'home.std4Desc', 'home.std4Tag'],
              ['home.std5Title', 'home.std5Desc', 'home.std5Tag'],
              ['home.std6Title', 'home.std6Desc', 'home.std6Tag'],
            ].map(([titleKey, descKey, tagKey]) =>
              CL.h('div.orchard-table-row', null,
                CL.h('h3', { 'data-i18n': titleKey, text: t(titleKey) }),
                CL.h('p', { 'data-i18n': descKey, text: t(descKey) }),
                CL.h('span.orchard-table-tag', { 'data-i18n': tagKey, text: t(tagKey) })
              )
            )
          )
        )
      );

      // 5. Orchard Studio Journal & Insights (Orchard News/Blog 4-Card Grid)
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
                  CL.toast('Atelier Journal: ' + articleTitle);
                },
              },
                CL.h('span.orchard-journal-date', { 'data-i18n': dateKey, text: t(dateKey) }),
                CL.h('h4', { 'data-i18n': titleKey, text: articleTitle }),
                CL.h('p', { 'data-i18n': descKey, text: t(descKey) })
              );
            })
          )
        )
      );

      // 6. Orchard Connect / Newsletter Callout (Orchard Stay Connected Box)
      const emailInput = CL.h('input.input', { placeholder: t('home.connectPlaceholder'), 'data-i18n-ph': 'home.connectPlaceholder', type: 'email' });
      const connectSection = CL.h('section.orchard-connect-section', null,
        CL.h('div.container', null,
          CL.h('div.orchard-connect-box', null,
            CL.h('h2', { 'data-i18n': 'home.connectHeading', text: t('home.connectHeading') }),
            CL.h('p', { 'data-i18n': 'home.connectDesc', text: t('home.connectDesc') }),
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

      root.append(hero, marquee, worksSection, standardsSection, journalSection, connectSection);
      container.appendChild(root);

      return () => {};
    },
  };
})(window.CL);
