/* ==========================================================
   COSLAB — Gallery page: K-Beauty Liptint Archive (4-Column Grid)
   ========================================================== */
(function (CL) {
  CL.pages = CL.pages || {};

  const FILTERS = [
    ['all', 'gallery.filterAll'],
    ['k-velvet', 'gallery.filterKVelvet'],
    ['k-dewy', 'gallery.filterKDewy'],
    ['k-luxury', 'gallery.filterKLuxury'],
    ['k-tamburins', 'gallery.filterKTamburins'],
    ['k-gradient', 'gallery.filterKGradient'],
    ['k-minimal', 'gallery.filterKMinimal'],
  ];

  CL.pages.gallery = {
    titleKey: 'nav.gallery',
    appMode: false,

    render(container) {
      let activeFilter = 'all';

      const root = CL.h('div.page.container', { style: { paddingBottom: '72px' } });

      const head = CL.h('div.page-head', null,
        CL.h('div.page-head-row', null,
          CL.h('div', { style: { display: 'flex', alignItems: 'baseline', gap: '14px', flexWrap: 'wrap' } },
            CL.h('h1', { text: t('gallery.title') }),
            CL.h('span.mono.muted', { text: t('gallery.subtitle') })
          ),
          CL.h('div.chips#galleryFilter', null,
            FILTERS.map(([k, key]) =>
              CL.h('button.chip' + (k === activeFilter ? '.is-active' : ''), {
                text: t(key),
                'data-filter': k,
                onclick: () => {
                  activeFilter = k;
                  document.querySelectorAll('#galleryFilter .chip').forEach((c) => c.classList.toggle('is-active', c.dataset.filter === k));
                  renderCards();
                },
              })
            )
          )
        )
      );

      const grid = CL.h('div.gallery-grid.grid-4#galleryGrid');

      root.append(head, grid);
      container.appendChild(root);

      function renderCards() {
        grid.innerHTML = '';
        const samples = CL.templates.SAMPLES;

        samples.forEach(([tplId, modelId]) => {
          const tpl = CL.templates.TEMPLATES.find((item) => item.templateId === tplId) || CL.templates.TEMPLATES[0];
          if (activeFilter !== 'all' && tpl.category !== activeFilter) return;

          const design = CL.templates.createDesign(tplId, modelId);
          const m = CL.models.getModel(modelId);
          design.name = `${t('templates.' + tplId)} (${t(m.nameKey)})`;

          const card = CL.h('div.gallery-card', null,
            CL.h('div.gallery-media', {
              title: t('gallery.editAsTemplate'),
              style: { '--tint': CL.render.tintOf(design) },
              onclick: () => {
                CL.store.saveDraft(design);
                CL.go('#/editor');
              },
            },
              CL.h('div.gallery-badge', { text: t(FILTERS.find(([k]) => k === tpl.category)?.[1] || 'gallery.filterAll') }),
              CL.h('div.gallery-tube', { html: CL.render.renderTight(design, { width: 120 }) })
            ),
            CL.h('div.gallery-body', null,
              CL.h('div.gallery-meta', null,
                CL.h('h4', { text: t('templates.' + tplId) }),
                CL.h('p', { text: t(m.nameKey) })
              ),
              CL.h('div.gallery-actions', { style: { display: 'flex', gap: '6px', alignItems: 'center' } },
                CL.h('button.btn.btn-sm.btn-primary', {
                  html: `<span>${t('gallery.editAsTemplate')}</span>`,
                  onclick: () => {
                    CL.store.saveDraft(design);
                    CL.go('#/editor');
                  },
                }),
                CL.h('button.icon-btn.sm', {
                  title: t('common.download'),
                  html: CL.icon('download'),
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
