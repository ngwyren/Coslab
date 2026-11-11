/* ==========================================================
   Gallery page: live sample products, direct edit-as-template,
   and instant download of PDF / PNG / JPG.
   ========================================================== */
(function (CL) {
  CL.pages = CL.pages || {};

  CL.pages.gallery = {
    titleKey: 'nav.gallery',
    appMode: false,

    render(container) {
      let activeFilter = 'all';

      const root = CL.h('div.page.container', { style: { paddingBottom: '60px' } });

      // Head
      const head = CL.h('div.page-head', null,
        CL.h('span.eyebrow', { text: 'COSLAB Factory Samples' }),
        CL.h('div.page-head-row', null,
          CL.h('div', null,
            CL.h('h1', { text: t('gallery.title') }),
            CL.h('p', { text: t('gallery.subtitle') })
          ),
          CL.h('div.gallery-head-actions', null,
            CL.h('a.btn.btn-primary', { href: '#/design', html: CL.icon('plus') + `<span>${t('nav.start')}</span>` })
          )
        ),
        CL.h('div.chips#galleryFilter', null,
          ['all', 'minimal', 'luxury', 'gradient', 'typographic'].map((k) =>
            CL.h('button.chip' + (k === activeFilter ? '.is-active' : ''), {
              text: t('gallery.filter' + k.charAt(0).toUpperCase() + k.slice(1)),
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

      // Auto update note
      const note = CL.h('div', {
        style: {
          display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px',
          background: 'var(--surface-2)', borderRadius: 'var(--r-md)', fontSize: '13px', color: 'var(--muted)',
          marginBlock: '12px 20px',
        },
        html: CL.icon('sparkles') + `<span>${t('gallery.autoUpdateNote')}</span>`,
      });

      // Grid
      const grid = CL.h('div.gallery-grid#galleryGrid');

      root.append(head, note, grid);
      container.appendChild(root);

      function renderCards() {
        grid.innerHTML = '';
        const samples = CL.templates.SAMPLES;

        samples.forEach(([tplId, modelId]) => {
          const tpl = CL.templates.TEMPLATES.find((t) => t.templateId === tplId) || CL.templates.TEMPLATES[0];
          if (activeFilter !== 'all' && tpl.category !== activeFilter) return;

          const design = CL.templates.createDesign(tplId, modelId);
          design.name = `${t('templates.' + tplId)} (${t('models.' + modelId)})`;

          const card = CL.h('div.gallery-card', null,
            // Media preview
            CL.h('div.gallery-media', {
              title: t('gallery.editAsTemplate'),
              onclick: () => {
                CL.store.saveDraft(design);
                CL.go('#/editor');
              },
            },
              CL.h('div.gallery-badge', { text: tpl.category }),
              CL.h('div', { html: CL.render.renderSVG(design, { width: 220, height: 280, shadow: true }) })
            ),
            // Body
            CL.h('div.gallery-body', null,
              CL.h('div.gallery-meta', null,
                CL.h('h4', { text: t('templates.' + tplId) }),
                CL.h('p', { text: t('models.' + modelId) })
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
