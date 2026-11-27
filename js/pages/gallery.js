/* ==========================================================
   COSLAB — Gallery page: K-Beauty Liptint Archive (4-Column Grid)
   ========================================================== */
(function (CL) {
  CL.pages = CL.pages || {};

  CL.pages.gallery = {
    titleKey: 'nav.gallery',
    appMode: false,

    render(container) {
      const root = CL.h('div.page.container', { style: { paddingBottom: '72px' } });

      const head = CL.h('div.page-head', null,
        CL.h('div.page-head-row', null,
          CL.h('div', { style: { display: 'flex', alignItems: 'baseline', gap: '14px', flexWrap: 'wrap' } },
            CL.h('h1', { text: t('gallery.title') }),
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
          const design = CL.templates.createDesign(tplId, modelId);
          const m = CL.models.getModel(modelId);
          design.name = `${t('templates.' + tplId)} (${m.name})`;

          /* Showcase card: closed = image + overlaid name bar with "+";
             open = card grows and spec rows rise in one after another. */
          const P = design.parts;
          const swatch = (part) => {
            const f = P[part] && P[part].fill;
            const bg = !f ? '#ccc' : f.type === 'linear'
              ? `linear-gradient(135deg, ${f.stops.map((s) => s.c).join(', ')})` : f.color;
            return CL.h('i.sc-swatch', { style: { background: bg }, title: t('editor.partsShort.' + part) });
          };
          const openStudio = () => { CL.store.saveDraft(design); CL.go('#/editor'); };

          const row = (label, ...value) => CL.h('div.sc-row', null,
            CL.h('span.sc-label', { text: label }), CL.h('span.sc-value', null, ...value));

          const toggle = CL.h('button.sc-toggle', {
            type: 'button',
            'aria-expanded': 'false',
            'aria-label': t('templates.' + tplId),
            html: '<i></i><i></i>',
            onclick: (e) => { e.stopPropagation(); setOpen(!card.classList.contains('is-open')); },
          });

          const card = CL.h('article.sc-card', null,
            CL.h('div.sc-media', {
              style: { '--tint': CL.render.tintOf(design, 0.8) },
              onclick: () => setOpen(!card.classList.contains('is-open')),
            },
              CL.h('div.sc-tube', null, CL.h('img', { src: `assets/archive/${tplId}.webp?v=19`, alt: t('templates.' + tplId), loading: 'lazy', decoding: 'async' })),
              CL.h('div.sc-bar', null,
                CL.h('div.sc-title', null,
                  CL.h('h4', { text: t('templates.' + tplId) })
                ),
                toggle
              )
            ),
            CL.h('div.sc-expand', null,
              CL.h('div.sc-inner', null,
                row(t('pdf.model'), `${m.name} · ${CL.models.sizeLabel(m)}`),
                row(t('editor.tabs.colors'), swatch('cap'), swatch('base')),
                CL.h('div.sc-actions', null,
                  CL.h('button.btn.btn-primary.btn-sm', {
                    type: 'button',
                    text: t('gallery.editAsTemplate'),
                    onclick: openStudio,
                  }),
                  CL.h('button.icon-btn.sm', {
                    type: 'button',
                    title: t('common.download'),
                    html: CL.icon('download'),
                    onclick: () => CL.openExport(design),
                  })
                )
              )
            )
          );

          function setOpen(open) {
            // one card open at a time
            if (open) grid.querySelectorAll('.sc-card.is-open').forEach((c) => { if (c !== card) c._close(); });
            card.classList.toggle('is-open', open);
            toggle.setAttribute('aria-expanded', String(open));
          }
          card._close = () => setOpen(false);

          grid.appendChild(card);
        });
      }

      renderCards();

      return () => {};
    },
  };
})(window.CL);
