/* ==========================================================
   COSLAB — Home Page (Minimalist Editorial + 4K Visual Showcase)
   Massive edge-to-edge 4K campaign carousel, diptych gallery, 3x2 lab grid.
   ========================================================== */
(function (CL) {
  CL.pages = CL.pages || {};

  const CAMPAIGN_SLIDES = [
    {
      src: 'assets/campaign-hero.jpg',
      tag: '01 / MASTER TRIAD',
      tabVi: '01 Triad Collection',
      tabEn: '01 Triad Collection',
      alt: 'COSLAB Atelier Bespoke Lip Tint Collection - Master Triad',
    },
    {
      src: 'assets/campaign-duo.jpg',
      tag: '02 / SCULPTURAL DUO',
      tabVi: '02 Velvet & Chrome',
      tabEn: '02 Velvet & Chrome',
      alt: 'COSLAB Sculptural Duo on Italian Travertine - Velvet and Chrome',
    },
    {
      src: 'assets/campaign-detail.jpg',
      tabVi: '03 Crystal & Silk',
      tabEn: '03 Crystal & Silk',
      tag: '03 / CRYSTAL CRAFT',
      alt: 'COSLAB Macro Detail Crystal Glass Applicator and Raw Silk',
    },
  ];

  CL.pages.home = {
    titleKey: 'nav.home',
    appMode: false,

    render(container) {
      const root = CL.h('div.page.page-home');
      const isVi = I18N.lang === 'vi';

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

      // 2. Massive Full-Bleed (Tràn Viền) 4K Editorial Campaign Carousel
      let activeSlideIdx = 0;
      let slideTimer = null;

      const slideEls = CAMPAIGN_SLIDES.map((slide, idx) =>
        CL.h('a.campaign-slide' + (idx === 0 ? '.is-active' : ''), {
          href: '#/design',
          'aria-label': slide.tag,
        },
          CL.h('img.campaign-slide-img', {
            src: slide.src,
            alt: slide.alt,
            loading: idx === 0 ? 'eager' : 'lazy',
            decoding: 'async',
            fetchpriority: idx === 0 ? 'high' : 'auto',
          })
        )
      );

      const tabBtns = CAMPAIGN_SLIDES.map((slide, idx) =>
        CL.h('button.campaign-tab-btn' + (idx === 0 ? '.is-active' : ''), {
          type: 'button',
          text: isVi ? slide.tabVi : slide.tabEn,
          onclick: (e) => {
            e.preventDefault();
            e.stopPropagation();
            switchSlide(idx);
          },
        })
      );

      function switchSlide(targetIdx) {
        activeSlideIdx = targetIdx;
        slideEls.forEach((el, i) => el.classList.toggle('is-active', i === activeSlideIdx));
        tabBtns.forEach((btn, i) => btn.classList.toggle('is-active', i === activeSlideIdx));
      }

      function startSlideLoop() {
        stopSlideLoop();
        slideTimer = setInterval(() => {
          switchSlide((activeSlideIdx + 1) % CAMPAIGN_SLIDES.length);
        }, 6500);
      }

      function stopSlideLoop() {
        if (slideTimer) {
          clearInterval(slideTimer);
          slideTimer = null;
        }
      }

      const campaignCarousel = CL.h('div.fullbleed-campaign-carousel', {
        onmouseenter: stopSlideLoop,
        onmouseleave: startSlideLoop,
      },
        ...slideEls,
        CL.h('div.campaign-nav-overlay', null,
          CL.h('div.campaign-nav-tabs', null, ...tabBtns),
          CL.h('a.campaign-cta-pill', {
            href: '#/design',
            html: `<span data-i18n="home.launchStudio">${t('home.launchStudio')}</span>`,
          })
        )
      );

      const campaignSection = CL.h('section.fullbleed-campaign-section#worksSection', null, campaignCarousel);
      startSlideLoop();

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

      // 4. Curated 4K Editorial Diptych (2 Companion Visuals: Velvet/Chrome Duo + Crystal Applicator)
      const diptychSection = CL.h('section.orchard-diptych-section', null,
        CL.h('div.container', null,
          CL.h('div.section-meta-head', null,
            CL.h('h2', { text: isVi ? 'Kỹ Nghệ & Chất Liệu Hoàn Thiện' : 'Editorial Craft & Materials' }),
            CL.h('span.mono.muted', { text: '4K EDITORIAL · ARCHIVE' })
          ),
          CL.h('div.diptych-grid', null,
            CL.h('a.diptych-card', {
              href: '#/design',
              'aria-label': 'Cloud Velvet & Minimal Chrome Edition',
            },
              CL.h('div.diptych-media', null,
                CL.h('img.diptych-img', {
                  src: 'assets/campaign-duo.jpg',
                  alt: 'COSLAB Sculptural Duo on Italian Travertine',
                  loading: 'lazy',
                  decoding: 'async',
                }),
                CL.h('span.diptych-badge', { text: '02 / SCULPTURAL DUO' })
              ),
              CL.h('div.diptych-info', null,
                CL.h('h3', { text: isVi ? 'Cloud Velvet & Minimal Chrome' : 'Cloud Velvet & Minimal Chrome' }),
                CL.h('p', {
                  text: isVi
                    ? 'Chất son nhung mờ sương mịn kết hợp cùng vỏ kim loại gương 24K chế tác từ phôi nguyên khối trên đá travertine.'
                    : 'A dialogue between ultra-soft matte velvet tint and mirror-polished architectural chrome atop Italian travertine stone.',
                }),
                CL.h('span.diptych-action', {
                  html: `<span>${isVi ? 'Thiết kế mẫu này' : 'Customize Form'}</span>` + CL.icon('arrowRight'),
                })
              )
            ),
            CL.h('a.diptych-card', {
              href: '#/design',
              'aria-label': 'Dew Drop Crystal & Raw Silk Edition',
            },
              CL.h('div.diptych-media', null,
                CL.h('img.diptych-img', {
                  src: 'assets/campaign-detail.jpg',
                  alt: 'COSLAB Dew Drop Crystal Glass and Raw Silk',
                  loading: 'lazy',
                  decoding: 'async',
                }),
                CL.h('span.diptych-badge', { text: '03 / CRYSTAL & SILK' })
              ),
              CL.h('div.diptych-info', null,
                CL.h('h3', { text: isVi ? 'Dew Drop Crystal & Raw Silk' : 'Dew Drop Crystal & Raw Silk' }),
                CL.h('p', {
                  text: isVi
                    ? 'Chi tiết đầu cọ pha lê cùng giọt son cánh hoa căng mọng, lấy cảm hứng từ cấu trúc acrylic 2 lớp chống tràn khí.'
                    : 'Macro close-up of sculpted glass applicator with glistening dewy rose droplet on ivory raw silk and pale alabaster.',
                }),
                CL.h('span.diptych-action', {
                  html: `<span>${isVi ? 'Thiết kế mẫu này' : 'Customize Form'}</span>` + CL.icon('arrowRight'),
                })
              )
            )
          )
        )
      );

      // 5. Archive Notes / Engineering (Compact 3-Column Grid)
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

      // 6. Connect Bar (Horizontal 2-Column Split Grid)
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

      root.append(hero, campaignSection, standardsSection, diptychSection, journalSection, connectSection);
      container.appendChild(root);

      return () => {
        stopSlideLoop();
      };
    },
  };
})(window.CL);
