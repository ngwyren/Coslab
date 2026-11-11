/* ==========================================================
   My Designs page: client workspace of locally saved lipstick designs
   ========================================================== */
(function (CL) {
  CL.pages = CL.pages || {};

  CL.pages['my-designs'] = {
    titleKey: 'nav.myDesigns',
    appMode: false,

    render(container) {
      const root = CL.h('div.page.container', { style: { paddingBottom: '80px' } });

      const head = CL.h('div.page-head', null,
        CL.h('div.hero-meta-row', null,
          CL.h('span.pill-tag', { text: 'CLIENT VAULT' }),
          CL.h('span.index-num', { text: '(STORAGE)' })
        ),
        CL.h('div.page-head-row', null,
          CL.h('div', null,
            CL.h('h1', { text: t('myDesigns.title') }),
            CL.h('p', { text: t('myDesigns.subtitle') })
          ),
          CL.h('div', null,
            CL.h('a.btn.btn-primary', { href: '#/design', html: CL.icon('plus') + `<span>${t('myDesigns.newDesign')}</span>` })
          )
        )
      );

      const content = CL.h('div#myDesignsContent');
      root.append(head, content);
      container.appendChild(root);

      function renderList() {
        content.innerHTML = '';
        const list = CL.store.listDesigns();

        if (!list || !list.length) {
          const empty = CL.h('div.empty', null,
            CL.h('div.empty-icon', { html: CL.icon('lipstick') }),
            CL.h('h3', { text: t('myDesigns.emptyTitle') }),
            CL.h('p.muted', { text: t('myDesigns.emptyDesc') }),
            CL.h('a.btn.btn-primary', { href: '#/design', html: CL.icon('star') + `<span>${t('myDesigns.newDesign')}</span>` })
          );
          content.appendChild(empty);
          return;
        }

        const grid = CL.h('div.gallery-grid');
        list.forEach((dsn) => {
          const card = CL.h('div.gallery-card', null,
            CL.h('div.gallery-media', {
              title: t('myDesigns.editDesign'),
              onclick: () => {
                CL.store.saveDraft(dsn);
                CL.go('#/editor');
              },
            },
              CL.h('div', { html: CL.render.renderSVG(dsn, { width: 220, height: 280, shadow: true }) })
            ),
            CL.h('div.gallery-body', null,
              CL.h('div.gallery-meta', null,
                CL.h('h4', { text: dsn.name || t('editor.untitled') }),
                CL.h('p', { text: t('myDesigns.lastModified', { date: CL.formatDate(dsn.updatedAt || dsn.createdAt || Date.now()) }) })
              ),
              CL.h('div.gallery-actions', null,
                CL.h('button.btn.btn-sm.btn-primary', {
                  html: CL.icon('edit') + `<span>${t('common.edit')}</span>`,
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
                      CL.store.duplicateDesign(dsn.id);
                      CL.toast(t('common.copy'));
                      renderList();
                    },
                  }),
                  CL.h('button.icon-btn.sm', {
                    title: t('common.download'),
                    html: CL.icon('download'),
                    onclick: (e) => {
                      CL.menu(e.currentTarget, CL.exportMenuItems(() => dsn), { align: 'end' });
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
      }

      renderList();

      return () => {};
    },
  };
})(window.CL);
