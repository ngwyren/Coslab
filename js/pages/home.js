/* ==========================================================
   COSLAB — Home Page (Orchard Studio® Minimalist Architecture)
   Exact aesthetic of https://orchard.framer.website/
   Giant display typography, screen-filling editorial media,
   3D PBR WebGL center stage, standards table, and atelier journal.
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
            text: 'C R E A T I V E   S T U D I O   B A S E D   I N   S E O U L   S P E C I A L I Z I N G   I N   L I P   T I N T   O E M   ·   O D M',
          }),

          // Massive Editorial Headline (Orchard Style)
          CL.h('div.hero-title-block', null,
            CL.h('h1.hero-giant-title.reveal-up', { text: 'COSLAB ATELIER®' }),
            CL.h('p.orchard-manifesto.reveal-up.stagger-1', {
              text: 'Coslab turns liquid tint formulas into a cohesive bespoke packaging language — designed to scale across global cosmetics houses.',
            }),
            CL.h('p.orchard-manifesto-sub.reveal-up.stagger-2', {
              text: 'We design silhouettes and formulate bespoke Korean liptints with the same level of intention. From velvet matte to dewy crystal glass and cold chrome sequences, Coslab builds packaging with strong rhythm, clean structure, and a finish that feels premium.',
            })
          ),

          // Center Stage 3D Showcase (Pure White Studio on Ceramic Podium)
          CL.h('div.showcase-canvas-box.reveal-up.stagger-2', { style: { height: '620px', marginTop: '16px' } },
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
              html: CL.icon('cube') + '<span> Drag to rotate 360° · Scroll to zoom · PBR Specular</span>',
            })
          ),

          // Action buttons below 3D stage
          CL.h('div.hero-actions-bar.reveal-up.stagger-3', { style: { justifyContent: 'flex-start', marginTop: '24px' } },
            CL.h('a.btn.btn-primary.btn-lg', {
              href: '#/design',
              html: `<span>Launch 3D Studio</span>` + CL.icon('arrowRight'),
            }),
            CL.h('button.btn.btn-outline.btn-lg', {
              onclick: () => {
                document.getElementById('worksSection')?.scrollIntoView({ behavior: 'smooth' });
              },
              html: `<span>Explore Works ↓</span>`,
            })
          ),

          // Architectural 3-Column Metrics Grid (Orchard / Laconic style)
          CL.h('div.hero-metrics-grid.reveal-up.stagger-4', null,
            CL.h('div.hero-metric-item', null,
              CL.h('div.metric-header', null,
                CL.h('span', { text: '(01) STANDARD' }),
                CL.h('span', { text: 'OEM · ODM' })
              ),
              CL.h('div.metric-val', { text: 'CGMP & ISO' }),
              CL.h('div.metric-sub', { text: 'Korean Cleanroom Formulation' })
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
              CL.h('span.index-num', { text: '(01) SELECTED WORKS & FORMULAS' }),
              CL.h('h2', { text: 'Packaging Silhouettes & Formulations.' })
            ),
            CL.h('p', { text: 'Formulated in Seoul, engineered to 0.1mm tolerance for global cosmetic houses.' })
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
                alt: 'Dew Drop Crystal Tint',
                loading: 'lazy',
              }),
              CL.h('div.orchard-work-overlay', null,
                CL.h('span.orchard-work-badge', { text: '01 / DEW DROP GLASS TINT' }),
                CL.h('div.orchard-work-info', null,
                  CL.h('div', null,
                    CL.h('h3.orchard-work-title', { text: 'Dew Drop Crystal Acrylic.' }),
                    CL.h('p.orchard-work-desc', { text: 'Double-wall transparent refraction with cherry rose fluid core and polished divider collar.' })
                  ),
                  CL.h('span.orchard-work-btn', { html: '<span>Customize in 3D</span>' + CL.icon('arrowRight') })
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
                  alt: 'Cloud Velvet MLBB',
                  loading: 'lazy',
                }),
                CL.h('div.orchard-work-overlay', null,
                  CL.h('span.orchard-work-badge', { text: '02 / CLOUD VELVET' }),
                  CL.h('div.orchard-work-info', null,
                    CL.h('div', null,
                      CL.h('h3.orchard-work-title', { text: 'Cloud Velvet MLBB.' }),
                      CL.h('p.orchard-work-desc', { text: 'Cashmere-touch frosted barrel with weightless air-fit tint formula.' })
                    ),
                    CL.h('span.orchard-work-btn', { html: '<span>Design 3D</span>' + CL.icon('arrowRight') })
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
                  alt: 'Seoul Noir Monolith',
                  loading: 'lazy',
                }),
                CL.h('div.orchard-work-overlay', null,
                  CL.h('span.orchard-work-badge', { text: '03 / SEOUL NOIR' }),
                  CL.h('div.orchard-work-info', null,
                    CL.h('div', null,
                      CL.h('h3.orchard-work-title', { text: 'Deep Lacquer & Mirror Gold.' }),
                      CL.h('p.orchard-work-desc', { text: 'Monolithic square prism with cold electroplated 24K mirror divider ring.' })
                    ),
                    CL.h('span.orchard-work-btn', { html: '<span>Design 3D</span>' + CL.icon('arrowRight') })
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
                  alt: 'Cold Chrome Phial',
                  loading: 'lazy',
                }),
                CL.h('div.orchard-work-overlay', null,
                  CL.h('span.orchard-work-badge', { text: '04 / CHROME ATELIER' }),
                  CL.h('div.orchard-work-info', null,
                    CL.h('div', null,
                      CL.h('h3.orchard-work-title', { text: 'Cold Chrome Minimal.' }),
                      CL.h('p.orchard-work-desc', { text: 'Slender architectural phial with polished specular electroplating.' })
                    ),
                    CL.h('span.orchard-work-btn', { html: '<span>Design 3D</span>' + CL.icon('arrowRight') })
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
                  alt: 'Porcelain Ivory & Gold',
                  loading: 'lazy',
                }),
                CL.h('div.orchard-work-overlay', null,
                  CL.h('span.orchard-work-badge', { text: '05 / PORCELAIN ESSENCE' }),
                  CL.h('div.orchard-work-info', null,
                    CL.h('div', null,
                      CL.h('h3.orchard-work-title', { text: 'Porcelain Ivory & Gold.' }),
                      CL.h('p.orchard-work-desc', { text: 'Glazed ceramic tactile touch with warm bone undertone.' })
                    ),
                    CL.h('span.orchard-work-btn', { html: '<span>Design 3D</span>' + CL.icon('arrowRight') })
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
              CL.h('span.index-num', { text: '(02) STANDARDS & COMPLIANCE' }),
              CL.h('h2', { text: 'Global Cosmetic Engineering.' })
            ),
            CL.h('span.pill-tag', { text: 'CGMP / ISO CERTIFIED' })
          ),

          CL.h('div.orchard-table', null,
            [
              ['[ 01 ]', 'CGMP Certified Foundry', 'South Korea Ministry of Food & Drug Safety verified facility', 'SOUTH KOREA'],
              ['[ 02 ]', 'ISO 22716 International Standard', 'Cleanroom cosmetic manufacturing and packaging compliance', 'INCHEON LAB'],
              ['[ 03 ]', 'Micro-Pigment Dispersion Lab', 'Korean MLBB velvet emulsion and water-gel formulations', 'GANGNAM SEOUL'],
              ['[ 04 ]', 'Rapid Prototyping Laboratory', '72-Hour vector artwork to physical molded specimen turnaround', 'RAPID 72H'],
              ['[ 05 ]', 'Clean & Vegan Formulation Standard', 'EWG Green grade ingredients and cruelty-free certified', 'VEGAN VERIFIED'],
              ['[ 06 ]', 'Global Regulatory Export Dossier', 'Full compliance packaging files for EU, US FDA, ASEAN', 'WORLDWIDE READY'],
            ].map(([idx, title, desc, tag]) =>
              CL.h('div.orchard-table-row', null,
                CL.h('span.index-num', { text: idx }),
                CL.h('h3', { text: title }),
                CL.h('p', { text: desc }),
                CL.h('span.orchard-table-tag', { text: tag })
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
              CL.h('span.index-num', { text: '(03) ATELIER JOURNAL & INSIGHTS' }),
              CL.h('h2', { text: 'Engineering & Technical Workflows.' })
            ),
            CL.h('a.btn.btn-outline.btn-sm', { href: '#/gallery', html: '<span>View Archive</span>' + CL.icon('arrowRight') })
          ),

          CL.h('div.orchard-journal-grid', null,
            [
              ['AUG 2026', '3D Product Visuals: Lighting That Feels Expensive', 'How real-time PBR shading and softbox specular highlights bridge the gap between digital vector and physical plastic injection.'],
              ['JUL 2026', 'Designing Packaging Systems That Survive Scale', 'Inside Coslab\'s 0.1mm tolerance molding process for seamless fit between Up Liptint and Button Liptint parts.'],
              ['JUN 2026', 'From Moodboard to Key Specimen: Our 72h Lab Workflow', 'How Korean cosmetic founders validate formulations from Pinterest boards to factory physical proofs in 3 days.'],
              ['MAY 2026', 'The Korean MLBB Tint: Dispersion, Water-Gel & Velvet Sheen', 'Analyzing the microscopic emulsion stability of dewy water tints vs. cloud velvet textures.'],
            ].map(([date, title, desc]) =>
              CL.h('div.orchard-journal-card', {
                onclick: () => {
                  CL.toast('Atelier Journal: ' + title);
                },
              },
                CL.h('span.orchard-journal-date', { text: date }),
                CL.h('h4', { text: title }),
                CL.h('p', { text: desc })
              )
            )
          )
        )
      );

      // 6. Orchard Connect / Newsletter Callout (Orchard Stay Connected Box)
      const emailInput = CL.h('input.input', { placeholder: 'Enter your brand email...', type: 'email' });
      const connectSection = CL.h('section.orchard-connect-section', null,
        CL.h('div.container', null,
          CL.h('div.orchard-connect-box', null,
            CL.h('span.index-num', { text: '(04) STAY CONNECTED' }),
            CL.h('h2', { text: 'Stay connected with Coslab Atelier®.' }),
            CL.h('p', { text: 'New silhouettes, refined Korean formulations, and packaging engineering — delivered occasionally. Maximum two updates monthly — only meaningful releases.' }),
            CL.h('div.orchard-connect-form', null,
              emailInput,
              CL.h('button.btn.btn-primary', {
                text: 'Subscribe',
                onclick: () => {
                  if (emailInput.value.includes('@')) {
                    CL.toast('Cảm ơn bạn đã kết nối cùng Coslab Atelier!');
                    emailInput.value = '';
                  } else {
                    CL.toast('Vui lòng nhập địa chỉ email hợp lệ.');
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
