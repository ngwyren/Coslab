/* ==========================================================
   COSLAB — Gallery page: K-Beauty Liptint Showcase
   Live templates ready to customize directly or download.
   ========================================================== */
(function (CL) {
  CL.pages = CL.pages || {};

  CL.pages.gallery = {
    titleKey: 'nav.gallery',
    appMode: false,

    render(container) {
      let activeFilter = 'all';

      const root = CL.h('div.page.container', { style: { paddingBottom: '80px' } });

      const head = CL.h('div.page-head', null,
        CL.h('div.hero-meta-row', null,
          CL.h('span.pill-tag', { text: 'ARCHIVE VAULT' }),
          CL.h('span.index-num', { text: '(CURATED EDITIONS)' })
        ),
        CL.h('div.page-head-row', null,
          CL.h('div', null,
            CL.h('h1', { text: t('gallery.title') }),
            CL.h('p', { text: t('gallery.subtitle') })
          ),
          CL.h('div.gallery-head-actions', null,
            CL.h('a.btn.btn-primary', { href: '#/design', html: CL.icon('plus') + `<span>${t('nav.start')}</span>` })
          )
        ),
        CL.h('div.chips#galleryFilter', { style: { marginTop: '16px' } },
          [
            ['all', 'gallery.filterAll'],
            ['k-velvet', 'gallery.filterKVelvet'],
            ['k-dewy', 'gallery.filterKDewy'],
            ['k-luxury', 'gallery.filterKLuxury'],
            ['k-tamburins', 'gallery.filterKTamburins'],
            ['k-gradient', 'gallery.filterKGradient'],
            ['k-minimal', 'gallery.filterKMinimal'],
          ].map(([k, key]) =>
            CL.h('button.chip' + (k === activeFilter ? '.is-active' : ''), {
              text: t(key),
              'data-filter': k,
              onclick: (e) => {
                activeFilter = k;
                document.querySelectorAll('#galleryFilter .chip').forEach((c) => c.classList.toggle('is-active', c.dataset.filter === k));
                renderCards();
              },
            })
          )
        )
      );

      const grid = CL.h('div.gallery-grid#galleryGrid');

      root.append(head, grid);
      container.appendChild(root);

      function renderCards() {
        grid.innerHTML = '';
        const samples = CL.templates.SAMPLES;

        samples.forEach(([tplId, modelId]) => {
          const tpl = CL.templates.TEMPLATES.find((t) => t.templateId === tplId) || CL.templates.TEMPLATES[0];
          if (activeFilter !== 'all' && tpl.category !== activeFilter) return;

          const design = CL.templates.createDesign(tplId, modelId);
          const m = CL.models.getModel(modelId);
          design.name = `${t('templates.' + tplId)} (${t(m.nameKey)})`;

          const card = CL.h('div.gallery-card', null,
            CL.h('div.gallery-media', {
              title: t('gallery.editAsTemplate'),
              onclick: () => {
                CL.store.saveDraft(design);
                CL.go('#/editor');
              },
            },
              CL.h('div.gallery-badge', { text: tpl.category.replace('k-', '') }),
              CL.h('div', { html: CL.render.renderSVG(design, { width: 220, height: 290, shadow: true }) })
            ),
            CL.h('div.gallery-body', null,
              CL.h('div.gallery-meta', null,
                CL.h('h4', { text: t('templates.' + tplId) }),
                CL.h('p', { text: t(m.nameKey) })
              ),
              CL.h('div.gallery-actions', null,
                CL.h('button.btn.btn-sm.btn-primary', {
                  html: CL.icon('edit') + `<span>${t('gallery.editAsTemplate')}</span>`,
                  onclick: () => {
                    CL.store.saveDraft(design);
                    CL.go('#/editor');
                  },
                }),
                CL.h('button.btn.btn-sm.btn-outline', {
                  title: t('common.download'),
                  html: CL.icon('download') + `<span>${t('common.download')}</span>`,
                  onclick: (e) => {
                    CL.menu(e.currentTarget, CL.exportMenuItems(() => design), { align: 'end' });
                  },
                })
              )
            )
          );

          grid.appendChild(card);
        });
      }

      renderCards();

      return () => {};
    },
  };
})(window.CL);
