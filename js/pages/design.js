/* ==========================================================
   COSLAB — Design setup page: Choose Liptint Model & Template
   ========================================================== */
(function (CL) {
  CL.pages = CL.pages || {};

  CL.pages.design = {
    titleKey: 'nav.design',
    appMode: false,

    render(container) {
      let selectedModel = 'velvet-round';
      let selectedTemplate = 'velvet-rose';

      const root = CL.h('div.page.container', { style: { paddingBottom: '60px' } });

      const head = CL.h('div.page-head', null,
        CL.h('h1', { text: t('design.title') }),
        CL.h('p', { text: t('design.subtitle') })
      );

      // Step 1: Choose Model
      const step1 = CL.h('div.setup-step', null,
        CL.h('div.setup-step-head', null,
          CL.h('h2', { text: t('design.step1') })
        ),
        CL.h('div.setup-grid#modelGrid')
      );

      // Step 2: Choose Template
      const step2 = CL.h('div.setup-step', { style: { marginTop: '48px' } },
        CL.h('div.setup-step-head', null,
          CL.h('h2', { text: t('design.step2') })
        ),
        CL.h('div.setup-grid#templateGrid')
      );

      // Floating proceed bar
      const floatBar = CL.h('div.setup-floating-bar', null,
        CL.h('div', null,
          CL.h('div', { id: 'summaryText', style: { fontWeight: '600', fontSize: '14px' } }),
          CL.h('div.muted.mono', { text: 'BESPOKE LIPTINT', style: { fontSize: '10px' } })
        ),
        CL.h('button.btn.btn-primary#btnProceed', {
          html: `<span>${t('nav.start')}</span>` + CL.icon('arrowRight'),
          onclick: () => {
            const dsn = CL.templates.createDesign(selectedTemplate, selectedModel);
            CL.store.saveDraft(dsn);
            CL.go('#/editor');
          },
        })
      );

      root.append(head, step1, step2, floatBar);
      container.appendChild(root);

      function updateSummary() {
        const m = CL.models.getModel(selectedModel);
        const mName = t(m.nameKey);
        const tName = t('templates.' + selectedTemplate);
        document.getElementById('summaryText').textContent = `${mName}  ·  ${tName}`;
      }

      // Render Models (1 cây son liptint trong mỗi thẻ preview)
      const mGrid = document.getElementById('modelGrid');
      CL.models.MODELS.forEach((m) => {
        const card = CL.h('div.card-choice', {
          'data-model': m.id,
          class: m.id === selectedModel ? 'is-selected' : '',
          onclick: () => {
            selectedModel = m.id;
            mGrid.querySelectorAll('.card-choice').forEach((c) => c.classList.toggle('is-selected', c.dataset.model === m.id));
            renderTemplates();
            updateSummary();
          },
        },
          CL.h('div.choice-preview-box', {
            html: CL.render.renderSVG(CL.templates.createDesign('velvet-rose', m.id), { width: 140, height: 190, shadow: false }),
          }),
          CL.h('div.choice-info', null,
            CL.h('h4', { text: t(m.nameKey) }),
            CL.h('p', { text: t(m.descKey) })
          )
        );
        mGrid.appendChild(card);
      });

      // Render Templates
      const tGrid = document.getElementById('templateGrid');
      function renderTemplates() {
        tGrid.innerHTML = '';
        CL.templates.TEMPLATES.forEach((tpl) => {
          const card = CL.h('div.card-choice', {
            'data-template': tpl.templateId,
            class: tpl.templateId === selectedTemplate ? 'is-selected' : '',
            onclick: () => {
              selectedTemplate = tpl.templateId;
              tGrid.querySelectorAll('.card-choice').forEach((c) => c.classList.toggle('is-selected', c.dataset.template === tpl.templateId));
              updateSummary();
            },
          },
            CL.h('div.choice-preview-box', {
              html: CL.render.renderSVG(CL.templates.createDesign(tpl.templateId, selectedModel), { width: 140, height: 190, shadow: false }),
            }),
            CL.h('div.choice-info', null,
              CL.h('h4', { text: t('templates.' + tpl.templateId) }),
              CL.h('p', { text: t('templates.' + tpl.templateId + 'Desc') })
            )
          );
          tGrid.appendChild(card);
        });
      }

      renderTemplates();
      updateSummary();

      return () => {};
    },
  };
})(window.CL);
