/* ==========================================================
   My Designs page: client workspace of locally saved lipstick designs
   ========================================================== */
(function (CL) {
  CL.pages = CL.pages || {};

  CL.pages['my-designs'] = {
    titleKey: 'nav.myDesigns',
    appMode: false,

    render(container) {

      CL.fonts.load();
      const root = CL.h('div.page.container', { style: { paddingBottom: '80px' } });

      const head = CL.h('div.page-head', null,
        CL.h('div.page-head-row', null,
          CL.h('div', null,
            CL.h('h1', { text: t('myDesigns.title') })
          ),
          CL.h('div', null,
            CL.h('a.btn.btn-primary', { href: '#/design', html: CL.icon('plus') + `<span>${t('myDesigns.newDesign')}</span>` })
          )
        )
      );

      const content = CL.h('div#myDesignsContent');
      root.append(head, content);
      container.appendChild(root);

      /* Card pictures: the flat drawing shows at once, then the 3D picture of the same design
         takes its place. 3D pictures are made one at a time and kept for the visit. */
      const shots = CL._shots3d || (CL._shots3d = new Map());
      const shotKey = (dsn) => `${dsn.id}:${dsn.updatedAt || 0}`;
      const shotImg = (url) => CL.h('img.gallery-shot', { src: url, alt: '', draggable: 'false' });
      let pass = 0, queue = [];
      function tubeOf(dsn) {
        const url = shots.get(shotKey(dsn));
        if (url) return CL.h('div.gallery-tube.is-3d', null, shotImg(url));
        const el = CL.h('div.gallery-tube', { html: CL.render.renderTight(dsn, { width: 120 }) });
        queue.push([dsn, el]);
        return el;
      }
      async function fillShots(jobs, id) {
        for (const [dsn, el] of jobs) {
          if (id !== pass || !el.isConnected) return;
          try {
            const c = await CL.exporter.renderCanvas3D(dsn, { pixelRatio: 0.6 });
            const url = c.toDataURL('image/webp', 0.9);
            shots.set(shotKey(dsn), url);
            if (id !== pass || !el.isConnected) return;
            el.replaceChildren(shotImg(url));
            el.classList.add('is-3d');
          } catch (e) {
            // no 3D on this device: the flat drawing stays
          }
        }
      }

      function renderList() {
        content.innerHTML = '';
        queue = [];
        const id = ++pass;
        const list = CL.store.listDesigns();

        if (!list || !list.length) {
          content.appendChild(CL.h('p.vault-empty', { text: t('myDesigns.emptyTitle') }));
          return;
        }

        const grid = CL.h('div.gallery-grid');
        list.forEach((dsn) => {
          const card = CL.h('div.gallery-card', null,
            CL.h('div.gallery-media', {
              title: t('myDesigns.editDesign'),
              style: { '--tint': CL.render.tintOf(dsn) },
              onclick: () => {
                CL.store.saveDraft(dsn);
                CL.go('#/editor');
              },
            },
              tubeOf(dsn)
            ),
            CL.h('div.gallery-body', null,
              CL.h('div.gallery-meta', null,
                CL.h('h4', { text: dsn.name || t('editor.untitled') }),
                CL.h('p', { text: t('myDesigns.lastModified', { date: CL.formatDate(dsn.updatedAt || dsn.createdAt || Date.now()) }) })
              ),
              CL.h('div.gallery-actions', null,
                CL.h('button.icon-btn.sm', {
                  title: t('common.edit'),
                  'aria-label': t('common.edit'),
                  html: CL.icon('edit'),
                  onclick: () => {
                    CL.store.saveDraft(dsn);
                    CL.go('#/editor');
                  },
                }),
                CL.h('div', { style: { display: 'flex', gap: '4px' } },
                  CL.h('button.icon-btn.sm', {
                    title: t('common.copy'),
                    html: CL.icon('copy'),
                    onclick: () => {
                      if (CL.store.duplicateDesign(dsn.id)) CL.toast(t('common.copy'));
                      else CL.toast(t('editor.quotaWarning'), 'info');
                      renderList();
                    },
                  }),
                  CL.h('button.icon-btn.sm', {
                    title: t('common.download'),
                    html: CL.icon('download'),
                    onclick: () => {
                      CL.openExport(dsn);
                    },
                  }),
                  CL.h('button.icon-btn.sm', {
                    title: t('common.delete'),
                    html: CL.icon('trash'),
                    onclick: async () => {
                      const ok = await CL.confirm({
                        title: t('common.delete'),
                        message: t('myDesigns.deleteConfirm'),
                      });
                      if (ok) {
                        CL.store.deleteDesign(dsn.id);
                        CL.toast(t('common.delete'));
                        renderList();
                      }
                    },
                  })
                )
              )
            )
          );
          grid.appendChild(card);
        });
        content.appendChild(grid);
        fillShots(queue, id);
      }

      renderList();

      return () => { pass++; };
    },
  };
})(window.CL);
