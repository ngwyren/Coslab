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
          design.name = `${t('templates.' + tplId)} (${m.name})`;

          /* Showcase card: closed = image + overlaid name bar with "+";
             open = card grows and spec rows rise in one after another. */
          const P = design.parts;
          const surface = (part) => t(CL.pantone.surfaceKey(P[part]));
          const swatch = (part) => {
            const f = P[part] && P[part].fill;
            const bg = !f ? '#ccc' : f.type === 'linear'
              ? `linear-gradient(135deg, ${f.stops.map((s) => s.c).join(', ')})` : f.color;
            return CL.h('i.sc-swatch', { style: { background: bg }, title: t('editor.partsShort.' + part) });
          };
          const fonts = [...new Set((design.layers || []).filter((l) => l.type === 'text').map((l) => l.text.font))];
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
              CL.h('div.sc-tube', null, CL.h('img', { src: `assets/archive/${tplId}.webp?v=4`, alt: t('templates.' + tplId), loading: 'lazy', decoding: 'async' })),
              CL.h('div.sc-bar', null,
                CL.h('div.sc-title', null,
                  CL.h('h4', { text: t('templates.' + tplId) }),
                  CL.h('p', { text: m.name })
                ),
                toggle
              )
            ),
            CL.h('div.sc-expand', null,
              CL.h('div.sc-inner', null,
                row(t('pdf.model'), `${m.name} · ${CL.models.sizeLabel(m)}`),
                row(t('surface.title'), [...new Set([surface('cap'), surface('base')])].join(' · ')),
                row(t('editor.tabs.colors'), swatch('cap'), swatch('base')),
                row(t('editor.tabs.text'), fonts.join(', ') || '—'),
                CL.h('div.sc-actions', null,
                  CL.h('button.btn.btn-primary.btn-sm', {
                    type: 'button',
                    html: `<span>${t('gallery.editAsTemplate')}</span>` + CL.icon('arrowRight'),
                    onclick: openStudio,
                  }),
                  CL.h('button.icon-btn.sm', {
                    type: 'button',
                    title: t('common.download'),
                    html: CL.icon('download'),
                    onclick: (e) => CL.menu(e.currentTarget, CL.exportMenuItems(() => design), { align: 'end' }),
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
