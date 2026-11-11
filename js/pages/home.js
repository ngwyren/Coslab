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
          CL.h('div.showcase-canvas-box.reveal-up.stagger-2', { style: { height: '600px', marginTop: '12px' } },
            CL.h('div.showcase-hud-tag', null,
              CL.h('span.pill-tag', { text: '360° PBR STAGE' }),
              CL.h('span.index-num', { text: 'CERAMIC PODIUM' })
            ),
            CL.h('div.showcase-controls-topright', null,
              CL.h('button.showcase-ctrl-btn.is-active#btnHomeRotate', {
                text: '360° Auto-Rotate',
                onclick: (e) => {
                  if (!preview) return;
                  preview.opts.autoRotate = !preview.opts.autoRotate;
                  e.currentTarget.classList.toggle('is-active', preview.opts.autoRotate);
                },
              }),
              CL.h('button.showcase-ctrl-btn', {
                text: 'Reset Angle',
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
              html: CL.icon('cube') + '<span> Drag to rotate 360° · Scroll to zoom · PBR Shaders</span>',
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
          ),

          // Architectural 3-Column Metrics Grid (Clean Grid Layout)
          CL.h('div.hero-metrics-grid.reveal-up.stagger-4', null,
            CL.h('div.hero-metric-item', null,
              CL.h('div.metric-header', null,
                CL.h('span', { text: '(01) STANDARD' }),
                CL.h('span', { text: 'OEM · ODM' })
              ),
              CL.h('div.metric-val', { text: 'CGMP & ISO' }),
              CL.h('div.metric-sub', { text: 'Korean Clean Formulation' })
            ),
            CL.h('div.hero-metric-item', null,
              CL.h('div.metric-header', null,
                CL.h('span', { text: '(02) SIMULATION' }),
                CL.h('span', { text: 'REAL-TIME' })
              ),
              CL.h('div.metric-val', { text: '360° PBR 3D' }),
              CL.h('div.metric-sub', { text: 'Velvet, Glass & Chrome' })
            ),
            CL.h('div.hero-metric-item', null,
              CL.h('div.metric-header', null,
                CL.h('span', { text: '(03) PROTOTYPE' }),
                CL.h('span', { text: 'RAPID LAB' })
              ),
              CL.h('div.metric-val', { text: '72h Specimen' }),
              CL.h('div.metric-sub', { text: 'Vector Artwork to Print' })
            )
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

      // 3. Korean Lip Tint Editorial Showcase (Pinterest & Orchard Full-Screen Style)
      const editorialSection = CL.h('section.editorial-section', null,
        CL.h('div.container', null,
          CL.h('div.section-meta-head', null,
            CL.h('div', null,
              CL.h('span.index-num', { text: '(01) EDITORIAL ARCHIVE · PINTEREST CURATION' }),
              CL.h('h2', { text: 'Korean Lip Tint Aesthetics.' })
            ),
            CL.h('p', { text: 'High-aesthetic dewy crystal refractions, cloud velvet MLBB pigments, and minimalist packaging silhouettes.' })
          ),
          CL.h('div.editorial-grid', null,
            // Card 1 (Span 7)
            CL.h('div.editorial-card.span-7', {
              onclick: () => {
                const d = CL.templates.createDesign('dewy-glass', 'dewy-crystal');
                CL.store.saveDraft(d);
                CL.go('#/editor');
              },
            },
              CL.h('img.editorial-img', {
                src: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=1400&q=85',
                alt: 'Dewy Crystal Tint',
                loading: 'lazy',
              }),
              CL.h('div.editorial-overlay', null,
                CL.h('span.editorial-badge', { text: '01 / DEWY WATER TINT' }),
                CL.h('div.editorial-info', null,
                  CL.h('h3', { text: 'Water-Glow Acrylic Glass.' }),
                  CL.h('p', { text: 'Double-wall transparent refraction with cherry rose fluid core.' }),
                  CL.h('span.editorial-action-btn', { html: '<span>Customize in 3D</span>' + CL.icon('arrowRight') })
                )
              )
            ),

            // Card 2 (Span 5)
            CL.h('div.editorial-card.span-5', {
              onclick: () => {
                const d = CL.templates.createDesign('velvet-rose', 'velvet-round');
                CL.store.saveDraft(d);
                CL.go('#/editor');
              },
            },
              CL.h('img.editorial-img', {
                src: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=1000&q=85',
                alt: 'Cloud Velvet MLBB',
                loading: 'lazy',
              }),
              CL.h('div.editorial-overlay', null,
                CL.h('span.editorial-badge', { text: '02 / CLOUD VELVET' }),
                CL.h('div.editorial-info', null,
                  CL.h('h3', { text: 'Frosted Velvet Touch.' }),
                  CL.h('p', { text: 'Soft-focus matte finish with weightless air-fit MLBB texture.' }),
                  CL.h('span.editorial-action-btn', { html: '<span>Customize in 3D</span>' + CL.icon('arrowRight') })
                )
              )
            ),

            // Card 3 (Span 4)
            CL.h('div.editorial-card.span-4', {
              onclick: () => {
                const d = CL.templates.createDesign('chrome-minimal', 'slim-atelier');
                CL.store.saveDraft(d);
                CL.go('#/editor');
              },
            },
              CL.h('img.editorial-img', {
                src: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=85',
                alt: 'Architectural Slim Atelier',
                loading: 'lazy',
              }),
              CL.h('div.editorial-overlay', null,
                CL.h('span.editorial-badge', { text: '03 / SLIM ATELIER' }),
                CL.h('div.editorial-info', null,
                  CL.h('h3', { text: 'Slender Phial.' }),
                  CL.h('p', { text: 'Architectural Tamburins-inspired profile.' }),
                  CL.h('span.editorial-action-btn', { html: '<span>Customize in 3D</span>' + CL.icon('arrowRight') })
                )
              )
            ),

            // Card 4 (Span 8)
            CL.h('div.editorial-card.span-8', {
              onclick: () => {
                const d = CL.templates.createDesign('seoul-noir', 'square-monolith');
                CL.store.saveDraft(d);
                CL.go('#/editor');
              },
            },
              CL.h('img.editorial-img', {
                src: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=1400&q=85',
                alt: 'Seoul Lacquer Black & Mirror Gold',
                loading: 'lazy',
              }),
              CL.h('div.editorial-overlay', null,
                CL.h('span.editorial-badge', { text: '04 / SEOUL NOIR' }),
                CL.h('div.editorial-info', null,
                  CL.h('h3', { text: 'Deep Lacquer Black & Cold Gold.' }),
                  CL.h('p', { text: 'Electroplated mirror divider ring with high-gloss monolithic barrel.' }),
                  CL.h('span.editorial-action-btn', { html: '<span>Customize in 3D</span>' + CL.icon('arrowRight') })
                )
              )
            ),

            // Card 5 (Span 6)
            CL.h('div.editorial-card.span-6', {
              onclick: () => {
                const d = CL.templates.createDesign('porcelain-ivory', 'velvet-round');
                CL.store.saveDraft(d);
                CL.go('#/editor');
              },
            },
              CL.h('img.editorial-img', {
                src: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=1000&q=85',
                alt: 'Porcelain Ivory & Warm Gold',
                loading: 'lazy',
              }),
              CL.h('div.editorial-overlay', null,
                CL.h('span.editorial-badge', { text: '05 / PORCELAIN ESSENCE' }),
                CL.h('div.editorial-info', null,
                  CL.h('h3', { text: 'Porcelain Touch & Gold.' }),
                  CL.h('p', { text: 'Glazed ceramic tactile packaging engineered for luxury houses.' }),
                  CL.h('span.editorial-action-btn', { html: '<span>Customize in 3D</span>' + CL.icon('arrowRight') })
                )
              )
            ),

            // Card 6 (Span 6)
            CL.h('div.editorial-card.span-6', {
              onclick: () => {
                const d = CL.templates.createDesign('chili-gradient', 'chubby-pot');
                CL.store.saveDraft(d);
                CL.go('#/editor');
              },
            },
              CL.h('img.editorial-img', {
                src: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1000&q=85',
                alt: 'Vibrant Pigment Swatches',
                loading: 'lazy',
              }),
              CL.h('div.editorial-overlay', null,
                CL.h('span.editorial-badge', { text: '06 / PIGMENT LAB' }),
                CL.h('div.editorial-info', null,
                  CL.h('h3', { text: 'Micro-Fine MLBB Dispersion.' }),
                  CL.h('p', { text: 'Clean Korean lip tint formulation with 72h sample turnaround.' }),
                  CL.h('span.editorial-action-btn', { html: '<span>Customize in 3D</span>' + CL.icon('arrowRight') })
                )
              )
            )
          )
        )
      );

      // 4. Minimal Silhouettes Table (Clean 1-Click Launch)
      const modelsSection = CL.h('section.models-index-section', null,
        CL.h('div.container', null,
          CL.h('div.section-meta-head', null,
            CL.h('div', null,
              CL.h('span.index-num', { text: '(02) SILHOUETTES' }),
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

      // 5. Clean White CTA
      const cta = CL.h('section.strip-cta', null,
        CL.h('div.container', null,
          CL.h('span.index-num', { text: '(03) CREATION' }),
          CL.h('h2', { text: t('home.ctaBanner.title') }),
          CL.h('div', { style: { marginTop: '20px' } },
            CL.h('a.btn.btn-primary.btn-lg', {
              href: '#/design',
              html: `<span>${t('home.ctaBanner.btn')}</span>` + CL.icon('arrowRight'),
            })
          )
        )
      );

      root.append(hero, marquee, editorialSection, modelsSection, cta);
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
