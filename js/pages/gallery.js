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

      /* ---------- Fan / arc carousel ----------
         Cards hang on a big circle below the stage; rotating the circle
         brings the next card to the top-centre. Arrows, dots, drag/swipe,
         clicking a side card and ←/→ keys all move it. */
      const SAMPLES = CL.templates.SAMPLES;
      let fanIdx = 0;
      const fanCards = SAMPLES.map(([tplId, modelId], i) => {
        const d = CL.templates.createDesign(tplId, modelId);
        return CL.h('button.fan-card', {
          type: 'button',
          title: t('templates.' + tplId),
          style: { '--tint': CL.render.tintOf(d, 0.84) },
          onclick: () => {
            if (fanMoved) return;
            if (i === fanIdx) openTemplate(tplId, modelId);
            else setFan(i);
          },
        }, CL.h('div.fan-tube', { html: CL.render.renderTight(d, { width: 130 }) }));
      });
      const fanDots = SAMPLES.map((_, i) =>
        CL.h('button.fan-dot', { type: 'button', 'aria-label': String(i + 1), onclick: () => setFan(i) }));
      const fanName = CL.h('strong.fan-name');
      const fanModel = CL.h('span.fan-model');
      const fanStage = CL.h('div.fan-stage', { tabindex: '0', 'aria-roledescription': 'carousel' },
        CL.h('div.fan-ring', null, fanCards),
        CL.h('div.fan-bar', null,
          CL.h('button.fan-arrow', { type: 'button', 'aria-label': 'Previous', html: CL.icon('arrowLeft'), onclick: () => setFan(fanIdx - 1) }),
          CL.h('div.fan-dots', null, fanDots),
          CL.h('button.fan-arrow', { type: 'button', 'aria-label': 'Next', html: CL.icon('arrowRight'), onclick: () => setFan(fanIdx + 1) })
        )
      );
      const fanInfo = CL.h('div.fan-info', null,
        CL.h('div', null, fanName, fanModel),
        CL.h('button.btn.btn-primary', {
          type: 'button',
          html: `<span>${t('gallery.editAsTemplate')}</span>` + CL.icon('arrowRight'),
          onclick: () => openTemplate(...SAMPLES[fanIdx]),
        })
      );

      function openTemplate(tplId, modelId) {
        CL.store.saveDraft(CL.templates.createDesign(tplId, modelId));
        CL.go('#/editor');
      }
      function setFan(i) {
        const n = SAMPLES.length;
        fanIdx = ((i % n) + n) % n;
        const rtl = document.dir === 'rtl' ? -1 : 1;
        fanCards.forEach((el, k) => {
          // shortest signed distance around the loop
          let d = k - fanIdx;
          if (d > n / 2) d -= n;
          if (d < -n / 2) d += n;
          const ad = Math.abs(d);
          el.style.setProperty('--a', `${d * 13 * rtl}deg`);
          el.style.setProperty('--s', String(ad === 0 ? 1 : Math.max(0.78, 1 - ad * 0.07)));
          el.style.zIndex = String(100 - ad);
          el.style.opacity = ad > 3 ? '0' : '1';
          el.classList.toggle('is-active', d === 0);
          el.tabIndex = d === 0 ? 0 : -1;
        });
        fanDots.forEach((dot, k) => dot.classList.toggle('is-active', k === fanIdx));
        const [tplId, modelId] = SAMPLES[fanIdx];
        fanName.textContent = t('templates.' + tplId);
        fanModel.textContent = t(CL.models.getModel(modelId).nameKey);
      }

      // Drag / swipe to rotate
      let fanStartX = null, fanMoved = false;
      fanStage.addEventListener('pointerdown', (e) => { fanStartX = e.clientX; fanMoved = false; });
      fanStage.addEventListener('pointermove', (e) => {
        if (fanStartX === null) return;
        const dx = e.clientX - fanStartX;
        if (Math.abs(dx) > 50) {
          fanMoved = true;
          setFan(fanIdx + (dx < 0 ? 1 : -1) * (document.dir === 'rtl' ? -1 : 1));
          fanStartX = e.clientX;
        }
      });
      const endDrag = () => { fanStartX = null; setTimeout(() => { fanMoved = false; }, 0); };
      fanStage.addEventListener('pointerup', endDrag);
      fanStage.addEventListener('pointerleave', endDrag);
      fanStage.addEventListener('keydown', (e) => {
        const dir = document.dir === 'rtl' ? -1 : 1;
        if (e.key === 'ArrowRight') { setFan(fanIdx + dir); e.preventDefault(); }
        if (e.key === 'ArrowLeft') { setFan(fanIdx - dir); e.preventDefault(); }
      });
      setFan(0);

      root.append(head, CL.h('section.fan-wrap', null, fanStage, fanInfo), grid);
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

          /* Showcase card: closed = image + overlaid name bar with "+";
             open = card grows and spec rows rise in one after another. */
          const P = design.parts;
          const finish = (part) => t('editor.finishesShort.' + ((P[part] && P[part].finish) || 'matte'));
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
              style: { '--tint': CL.render.tintOf(design) },
              onclick: () => setOpen(!card.classList.contains('is-open')),
            },
              CL.h('div.gallery-badge', { text: t(FILTERS.find(([k]) => k === tpl.category)?.[1] || 'gallery.filterAll') }),
              CL.h('div.sc-tube', { html: CL.render.renderTight(design, { width: 120 }) }),
              CL.h('div.sc-bar', null,
                CL.h('div.sc-title', null,
                  CL.h('h4', { text: t('templates.' + tplId) }),
                  CL.h('p', { text: t(m.nameKey) })
                ),
                toggle
              )
            ),
            CL.h('div.sc-expand', null,
              CL.h('div.sc-inner', null,
                row(t('pdf.model'), t(m.nameKey)),
                row(t('editor.colors.finish'), `${finish('cap')} · ${finish('base')}`),
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
