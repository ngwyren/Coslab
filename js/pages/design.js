/* ==========================================================
   COSLAB — Design route: container picker
   Two short lists (round / square) on one side, the selected container
   in 3D with its catalogue spec on the other. Hover previews, a click locks the choice, ←→
   switch; "Start designing" opens the Studio with that container.
   ========================================================== */
(function (CL) {
  CL.pages = CL.pages || {};

  CL.pages.design = {
    titleKey: 'nav.design',
    appMode: false,

    render(container) {
      const FORMS = CL.models.MODELS;
      // Start on the container of the current draft when there is one
      const draft = CL.store.getDraft();
      let active = draft ? FORMS.indexOf(CL.models.getModel(draft.model)) : 0;

      // Renders of the clear 3D containers (same view as the live 3D card)
      const thumbSrc = (m) => `assets/models/thumbs/${m.id}.webp?v=10`;
      let locked = false;

      const looks = FORMS.map((m) => CL.templates.createForModel(m.id));
      const item = (m, i) => CL.h('button.lp-ct', {
        type: 'button',
        role: 'option',
        // Hover previews freely until one is clicked; a click locks it, clicking it again unlocks
        onmouseenter: () => { if (!locked) setActive(i); },
        onclick: (e) => {
          if (e.detail > 1) return; // second click of a double-click
          const same = locked && i === active;
          setActive(i);
          setLocked(!same);
        },
        ondblclick: () => { setActive(i); start(); },
      },
        CL.h('span.lp-ct-thumb', null, CL.h('img', { src: thumbSrc(m), alt: '' })),
        CL.h('span.lp-ct-text', null,
          CL.h('strong', { text: m.name })
        ));
      const items = FORMS.map(item);
      const group = (shape) => CL.h('div.lp-ct-group', null,
        CL.h('h3', { text: t('models.' + shape) }),
        FORMS.map((m, i) => (m.shape === shape ? items[i] : null)).filter(Boolean));

      const visual = CL.h('div.lp-ct-visual');
      const still = CL.h('img.lp-ct-still', { alt: '' });
      const glHost = CL.h('div.lp-ct-gl');
      visual.append(still, glHost);
      const name = CL.h('h3.lp-ct-name');
      const specs = CL.h('dl.lp-ct-specs');

      const stage = CL.h('div.lp-ss-stage.is-static', { tabindex: '-1' },
        CL.h('div.lp-ss-side.lp-ct-side', null,
          CL.h('div.lp-ss-head', null,
            CL.h('h1', { text: t('flow.pickShape') })
          ),
          CL.h('div.lp-ct-list', { role: 'listbox', 'aria-label': t('landing.forms') }, group('round'), group('square'))
        ),
        CL.h('div.lp-ss-card.lp-ct-card', null,
          visual,
          CL.h('div.lp-ct-foot', null,
            CL.h('div.lp-ct-info', null, name, specs),
            CL.h('button.lp-ss-cta', {
              type: 'button',
              onclick: () => start(),
              html: `<span>${t('nav.design')}</span>`,
            })
          )
        )
      );

      let preview = null;
      let shown = -1;
      let timer = 0;
      let alive = true;

      /** Swap the still for the live 3D container once it is ready (the still stays if 3D is unavailable). */
      function load3D(i) {
        clearTimeout(timer);
        timer = setTimeout(async () => {
          if (!alive) return;
          try { await CL.loadThree(); } catch (e) { return; } // the still stays
          if (!alive || i !== active) return;
          if (!preview) {
            try { preview = new CL.Preview3D(glHost, { autoRotate: true }); } catch (e) { preview = { ok: false }; }
          }
          if (!preview.ok) return;
          const done = await preview.setDesign(looks[i]);
          if (alive && done && i === active) {
            visual.classList.add('is-3d');
            preloadRest();
          }
        }, shown < 0 ? 0 : 60);
      }

      /** Fetch the other containers one by one while the page is idle, so switching is instant. */
      let preloaded = false;
      async function preloadRest() {
        if (preloaded || (navigator.connection && navigator.connection.saveData)) return;
        preloaded = true;
        for (const m of FORMS) {
          if (!alive) return;
          await CL.Preview3D.preload(m.id);
        }
      }

      function setLocked(v) {
        locked = v;
        stage.classList.toggle('is-locked', v);
      }

      function setActive(i) {
        const n = FORMS.length;
        active = ((i % n) + n) % n;
        if (active === shown) return;
        const m = FORMS[active];
        items.forEach((el, k) => {
          el.classList.toggle('is-active', k === active);
          el.setAttribute('aria-selected', String(k === active));
        });
        // phones: the list is a horizontal strip — keep the selected container in view
        const strip = items[active].closest('.lp-ct-list');
        if (strip && strip.scrollWidth > strip.clientWidth + 4) {
          const a = items[active].getBoundingClientRect(), b = strip.getBoundingClientRect();
          strip.scrollBy({ left: a.left + a.width / 2 - (b.left + b.width / 2), behavior: shown < 0 ? 'auto' : 'smooth' });
        }
        name.textContent = m.name;
        specs.replaceChildren(...CL.models.specRows(m, true).map(([k, v]) => CL.h('div', null, CL.h('dt.sr-only', { text: k }), CL.h('dd', { text: v }))));
        // once 3D runs, the live tube is swapped in place (no jump back to the smaller still)
        if (!visual.classList.contains('is-3d')) still.src = thumbSrc(m);
        load3D(active);
        shown = active;
      }

      function start() {
        const m = FORMS[active];
        // Keep the user's work if a draft exists — only swap its container; otherwise start from the clear container
        const d = CL.store.getDraft();
        const edited = d && d.parts && d.parts.cap && ((d.layers || []).length
          || JSON.stringify(d.parts) !== JSON.stringify(CL.templates.createForModel(d.model).parts));
        if (edited) { d.model = m.id; CL.store.saveDraft(d); }
        else CL.store.saveDraft(CL.templates.createForModel(m.id));
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

      container.appendChild(CL.h('div.page.lp.design-pick', null, CL.h('div.container', null, stage)));
      setActive(Math.max(0, active));

      return () => {
        alive = false;
        clearTimeout(timer);
        window.removeEventListener('keydown', onKey);
        if (preview && preview.dispose) preview.dispose();
      };
    },
  };
})(window.CL);
