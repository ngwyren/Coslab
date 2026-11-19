/* ==========================================================
   COSLAB — Design route: silhouette picker
   Big name list on one side (active dark, the rest faded) and a
   large live tube card on the other. Hover / focus / click / ←→
   switch the silhouette with a rise-and-untilt entrance;
   "Start designing" opens the Studio with that shape.
   ========================================================== */
(function (CL) {
  CL.pages = CL.pages || {};

  CL.pages.design = {
    titleKey: 'nav.design',
    appMode: false,

    render(container) {
      const FORMS = CL.templates.SAMPLES.slice(0, 5);
      // Start on the shape of the current draft when there is one
      const draft = CL.store.getDraft();
      let active = Math.max(0, FORMS.findIndex(([, modelId]) => draft && draft.model === modelId));

      const names = FORMS.map(([, modelId], i) =>
        CL.h('button.lp-ss-name', {
          type: 'button',
          onmouseenter: () => setActive(i),
          onfocus: () => setActive(i),
          onclick: () => setActive(i),
        }, t(CL.models.getModel(modelId).nameKey)));

      const visuals = FORMS.map(([tplId, modelId]) => {
        const d = CL.templates.createDesign(tplId, modelId);
        return CL.h('div.lp-ss-visual', { style: { '--tint': CL.render.tintOf(d, 0.86) } },
          CL.h('div.lp-ss-tube', { html: CL.render.renderTight(d, { width: 220 }) }));
      });
      const metas = FORMS.map(([, modelId]) =>
        CL.h('span.lp-ss-meta', { text: t(CL.models.getModel(modelId).descKey) }));
      const count = CL.h('span.lp-ss-count');

      const stage = CL.h('div.lp-ss-stage.is-static', { tabindex: '-1' },
        CL.h('div.lp-ss-side', null,
          CL.h('div.lp-ss-head', null,
            CL.h('h2', { 'data-i18n': 'landing.forms', text: t('landing.forms') }),
            count
          ),
          CL.h('div.lp-ss-names', { role: 'listbox', 'aria-label': t('landing.forms') }, names)
        ),
        CL.h('div.lp-ss-card', null,
          visuals,
          CL.h('div.lp-ss-card-foot', null,
            CL.h('div.lp-ss-metas', null, metas),
            CL.h('button.lp-ss-cta', {
              type: 'button',
              onclick: () => start(),
              html: `<span data-i18n="landing.start">${t('landing.start')}</span>` + CL.icon('arrowRight'),
            })
          )
        )
      );

      function setActive(i) {
        const n = FORMS.length;
        active = ((i % n) + n) % n;
        [names, visuals, metas].forEach((list) => list.forEach((el, k) => el.classList.toggle('is-active', k === active)));
        names.forEach((el, k) => el.setAttribute('aria-selected', String(k === active)));
        count.textContent = `${String(active + 1).padStart(2, '0')} / ${String(n).padStart(2, '0')}`;
      }

      function start() {
        const [tplId, modelId] = FORMS[active];
        // Keep the user's work if a draft exists — only swap its shape; otherwise start from the sample
        const d = CL.store.getDraft();
        if (d && d.parts && d.parts.cap) { d.model = modelId; CL.store.saveDraft(d); }
        else CL.store.saveDraft(CL.templates.createDesign(tplId, modelId));
        CL.go('#/editor');
      }

      const onKey = (e) => {
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
        const dir = document.dir === 'rtl' ? -1 : 1;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { setActive(active + (e.key === 'ArrowRight' ? dir : 1)); e.preventDefault(); }
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { setActive(active - (e.key === 'ArrowLeft' ? dir : 1)); e.preventDefault(); }
        if (e.key === 'Enter' && !e.target.closest('button, a')) start();
      };
      window.addEventListener('keydown', onKey);

      setActive(active);
      container.appendChild(CL.h('div.page.lp.design-pick', null, CL.h('div.container', null, stage)));

      return () => window.removeEventListener('keydown', onKey);
    },
  };
})(window.CL);
