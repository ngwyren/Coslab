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
          // Tracked-out Eyebrow (Orchard Style)
          CL.h('div.orchard-eyebrow', {
            'data-i18n': 'home.eyebrow',
            text: t('home.eyebrow'),
          }),

          // Massive Editorial Headline (Orchard Style)
          CL.h('div.hero-title-block', null,
            CL.h('h1.hero-giant-title.reveal-up', { text: 'COSLAB ATELIER®' }),
            CL.h('p.orchard-manifesto.reveal-up.stagger-1', {
              'data-i18n': 'home.manifesto1',
              text: t('home.manifesto1'),
            }),
            CL.h('p.orchard-manifesto-sub.reveal-up.stagger-2', {
              'data-i18n': 'home.manifesto2',
              text: t('home.manifesto2'),
            })
          ),

          // Center Stage 3D Showcase (Pure White Studio on Ceramic Podium)
          CL.h('div.showcase-canvas-box.reveal-up.stagger-2', { style: { height: '620px', marginTop: '16px' } },
            CL.h('div.showcase-hud-tag', null,
              CL.h('span.pill-tag', { 'data-i18n': 'home.pbrStage', text: t('home.pbrStage') }),
              CL.h('span.index-num', { 'data-i18n': 'home.ceramicPodium', text: t('home.ceramicPodium') })
            ),
            CL.h('div.showcase-controls-topright', null,
              CL.h('button.showcase-ctrl-btn.is-active#btnHomeRotate', {
                'data-i18n': 'home.autoRotate',
                text: t('home.autoRotate'),
                onclick: (e) => {
                  if (!preview) return;
                  preview.opts.autoRotate = !preview.opts.autoRotate;
                  e.currentTarget.classList.toggle('is-active', preview.opts.autoRotate);
                },
              }),
              CL.h('button.showcase-ctrl-btn', {
                'data-i18n': 'home.resetAngle',
                text: t('home.resetAngle'),
                onclick: () => {
                  if (!preview) return;
                  preview.targetRotY = -0.35;
                  preview.targetRotX = 0.08;
                  preview.targetDist = 14;
                },
              })
            ),
            CL.h('div#hero3dTarget', { style: { width: '100%', height: '100%' } }),
            CL.h('div.showcase-hud-bottom', {
              html: CL.icon('cube') + `<span data-i18n="home.dragHint">${t('home.dragHint')}</span>`,
            })
          ),

          // Action buttons below 3D stage
          CL.h('div.hero-actions-bar.reveal-up.stagger-3', { style: { justifyContent: 'flex-start', marginTop: '24px' } },
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
          ),

          // Architectural 3-Column Metrics Grid (Orchard / Laconic style)
          CL.h('div.hero-metrics-grid.reveal-up.stagger-4', null,
            CL.h('div.hero-metric-item', null,
              CL.h('div.metric-header', null,
                CL.h('span', { text: '(01) STANDARD' }),
                CL.h('span', { 'data-i18n': 'home.metric1Tag', text: t('home.metric1Tag') })
              ),
              CL.h('div.metric-val', { 'data-i18n': 'home.metric1Val', text: t('home.metric1Val') }),
              CL.h('div.metric-sub', { 'data-i18n': 'home.metric1Sub', text: t('home.metric1Sub') })
            ),
            CL.h('div.hero-metric-item', null,
              CL.h('div.metric-header', null,
                CL.h('span', { text: '(02) SIMULATION' }),
                CL.h('span', { 'data-i18n': 'home.metric2Tag', text: t('home.metric2Tag') })
              ),
              CL.h('div.metric-val', { 'data-i18n': 'home.metric2Val', text: t('home.metric2Val') }),
              CL.h('div.metric-sub', { 'data-i18n': 'home.metric2Sub', text: t('home.metric2Sub') })
            ),
            CL.h('div.hero-metric-item', null,
              CL.h('div.metric-header', null,
                CL.h('span', { text: '(03) PROTOTYPE' }),
                CL.h('span', { 'data-i18n': 'home.metric3Tag', text: t('home.metric3Tag') })
              ),
              CL.h('div.metric-val', { 'data-i18n': 'home.metric3Val', text: t('home.metric3Val') }),
              CL.h('div.metric-sub', { 'data-i18n': 'home.metric3Sub', text: t('home.metric3Sub') })
            )
          )
        )
      );

      // 2. Subtle Marquee Ticker (Orchard Style)
      const marqueeText = 'COSLAB ATELIER® · BESPOKE LIPTINT · SEOUL LAB · 3D PACKAGING ENGINE · OEM / ODM · VELVET & GLASS · CGMP KOREA · ';
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
            CL.h('div', null,
              CL.h('span.index-num', { 'data-i18n': 'home.worksSectionNum', text: t('home.worksSectionNum') }),
              CL.h('h2', { 'data-i18n': 'home.worksHeading', text: t('home.worksHeading') })
            ),
            CL.h('p', { 'data-i18n': 'home.worksDesc', text: t('home.worksDesc') })
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
                src: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=1600&q=85',
                alt: t('home.work1Title'),
                loading: 'lazy',
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
                  src: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=1000&q=85',
                  alt: t('home.work2Title'),
                  loading: 'lazy',
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
                  src: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=1000&q=85',
                  alt: t('home.work3Title'),
                  loading: 'lazy',
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
                  src: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=1000&q=85',
                  alt: t('home.work4Title'),
                  loading: 'lazy',
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
                  src: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=1000&q=85',
                  alt: t('home.work5Title'),
                  loading: 'lazy',
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
            CL.h('div', null,
              CL.h('span.index-num', { 'data-i18n': 'home.standardsSectionNum', text: t('home.standardsSectionNum') }),
              CL.h('h2', { 'data-i18n': 'home.standardsHeading', text: t('home.standardsHeading') })
            ),
            CL.h('span.pill-tag', { 'data-i18n': 'home.standardsBadge', text: t('home.standardsBadge') })
          ),

          CL.h('div.orchard-table', null,
            [
              ['[ 01 ]', 'home.std1Title', 'home.std1Desc', 'home.std1Tag'],
              ['[ 02 ]', 'home.std2Title', 'home.std2Desc', 'home.std2Tag'],
              ['[ 03 ]', 'home.std3Title', 'home.std3Desc', 'home.std3Tag'],
              ['[ 04 ]', 'home.std4Title', 'home.std4Desc', 'home.std4Tag'],
              ['[ 05 ]', 'home.std5Title', 'home.std5Desc', 'home.std5Tag'],
              ['[ 06 ]', 'home.std6Title', 'home.std6Desc', 'home.std6Tag'],
            ].map(([idx, titleKey, descKey, tagKey]) =>
              CL.h('div.orchard-table-row', null,
                CL.h('span.index-num', { text: idx }),
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
            CL.h('div', null,
              CL.h('span.index-num', { 'data-i18n': 'home.journalSectionNum', text: t('home.journalSectionNum') }),
              CL.h('h2', { 'data-i18n': 'home.journalHeading', text: t('home.journalHeading') })
            ),
            CL.h('a.btn.btn-outline.btn-sm', { href: '#/gallery', html: `<span data-i18n="home.viewArchive">${t('home.viewArchive')}</span>` + CL.icon('arrowRight') })
          ),

          CL.h('div.orchard-journal-grid', null,
            [
              ['home.j1Date', 'home.j1Title', 'home.j1Desc'],
              ['home.j2Date', 'home.j2Title', 'home.j2Desc'],
              ['home.j3Date', 'home.j3Title', 'home.j3Desc'],
              ['home.j4Date', 'home.j4Title', 'home.j4Desc'],
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
            CL.h('span.index-num', { 'data-i18n': 'home.connectSectionNum', text: t('home.connectSectionNum') }),
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
