/* ==========================================================
   COSLAB — Settings
   One column, four plain groups: language, brand (for the PDF),
   PDF quality, and data (back up / restore / reset).
   Everything else keeps its sensible default.
   ========================================================== */
(function (CL) {
  CL.pages = CL.pages || {};

  /** Keep only safe, expected values from a restored design (backup files are untrusted input). */
  function sanitizeDesign(d) {
    if (!d || typeof d !== 'object' || !d.parts || typeof d.parts !== 'object') return null;
    const safeId = (v) => (typeof v === 'string' && /^[\w-]{1,64}$/.test(v) ? v : null);
    const out = {
      id: safeId(d.id),
      name: String(d.name || '').slice(0, 120),
      model: CL.models.getModel(d.model).id,
      templateId: safeId(d.templateId) || 'velvet-rose',
      parts: {},
      layers: [],
      createdAt: Number(d.createdAt) || null,
      updatedAt: Number(d.updatedAt) || null,
    };
    ['cap', 'base'].forEach((k) => {
      const p = d.parts[k] || {};
      out.parts[k] = {
        fill: p.fill && p.fill.type === 'linear' && Array.isArray(p.fill.stops)
          ? { type: 'linear', angle: 180, stops: p.fill.stops.slice(0, 2).map((s, i) => ({ o: i, c: '#000000', pantone: String((s && s.pantone) || '') })) }
          : { type: 'solid', color: '#000000', pantone: String((p.fill && p.fill.pantone) || '') },
        finish: ['matte', 'gloss', 'satin', 'metallic'].includes(p.finish) ? p.finish : 'matte',
        surface: ['clear', 'shimmer', 'solid', 'solid-gradient', 'clear-gradient'].includes(p.surface) ? p.surface : undefined,
      };
      // colours are rebuilt from Pantone codes / snapped below — never trusted as raw strings
      const src = p.fill || {};
      if (out.parts[k].fill.type === 'linear') {
        out.parts[k].fill.stops.forEach((s, i) => { s.c = CL.color.isHex(src.stops[i] && src.stops[i].c) ? CL.color.normalize(src.stops[i].c) : '#b85c66'; });
      } else {
        out.parts[k].fill.color = CL.color.isHex(src.color) ? CL.color.normalize(src.color) : '#b85c66';
      }
    });
    (Array.isArray(d.layers) ? d.layers : []).slice(0, 40).forEach((l) => {
      if (!l || !['text', 'image', 'shape'].includes(l.type)) return;
      const base = {
        id: safeId(l.id) || CL.uid('ly'),
        type: l.type,
        part: l.part === 'cap' ? 'cap' : 'base',
        name: String(l.name || '').slice(0, 60),
        x: CL.clamp(Number(l.x) || 0.5, 0, 1),
        y: CL.clamp(Number(l.y) || 0.5, 0, 1),
        rotation: CL.clamp(Number(l.rotation) || 0, -360, 360),
        opacity: CL.clamp(Number(l.opacity ?? 1), 0, 1),
        visible: l.visible !== false,
        locked: !!l.locked,
        flipX: !!l.flipX,
        flipY: !!l.flipY,
      };
      if (l.type === 'text' && l.text) {
        base.text = {
          content: String(l.text.content || '').slice(0, 200),
          font: /^[\w .-]{1,40}$/.test(l.text.font || '') ? l.text.font : 'Plus Jakarta Sans',
          size: CL.clamp(Number(l.text.size) || 13, 6, 72),
          weight: CL.clamp(Number(l.text.weight) || 400, 100, 900),
          italic: !!l.text.italic,
          color: CL.color.isHex(l.text.color) ? CL.color.normalize(l.text.color) : '#ffffff',
          pantone: String(l.text.pantone || ''),
          spacing: CL.clamp(Number(l.text.spacing) || 0, -10, 40),
          align: ['left', 'center', 'right'].includes(l.text.align) ? l.text.align : 'center',
          lineHeight: CL.clamp(Number(l.text.lineHeight) || 1.2, 0.6, 3),
        };
      } else if (l.type === 'image' && l.image && /^data:image\/(png|jpeg|webp|svg\+xml);base64,[A-Za-z0-9+/=]+$/.test(l.image.src || '')) {
        base.image = { src: l.image.src, w: CL.clamp(Number(l.image.w) || 40, 4, 200), h: CL.clamp(Number(l.image.h) || 40, 4, 200) };
      } else if (l.type === 'shape' && l.shape) {
        base.shape = {
          kind: ['rect', 'circle', 'line', 'diamond', 'star', 'heart'].includes(l.shape.kind) ? l.shape.kind : 'circle',
          w: CL.clamp(Number(l.shape.w) || 24, 2, 200),
          h: CL.clamp(Number(l.shape.h) || 24, 2, 200),
          fill: CL.color.isHex(l.shape.fill) ? CL.color.normalize(l.shape.fill) : 'none',
          stroke: CL.color.isHex(l.shape.stroke) ? CL.color.normalize(l.shape.stroke) : null,
          strokeWidth: CL.clamp(Number(l.shape.strokeWidth) || 0, 0, 10),
        };
      } else {
        return;
      }
      out.layers.push(base);
    });
    return CL.pantone.normalizeDesign(out);
  }

  CL.sanitizeDesign = sanitizeDesign;

  CL.pages.settings = {
    titleKey: 'nav.settings',
    appMode: false,

    render(container) {
      const s = CL.store.settings;
      const author = s.author || {};
      const root = CL.h('div.page.container.prefs', { style: { paddingBottom: '72px' } });

      const head = CL.h('div.page-head', null, CL.h('h1', { text: t('settings.title') }));

      const group = (title, note, ...content) => CL.h('section.prefs-group', null,
        CL.h('div.prefs-label', null,
          CL.h('h3', { text: title }),
          note ? CL.h('p', { text: note }) : null
        ),
        CL.h('div.prefs-body', null, ...content)
      );

      // 1. Language
      const langs = CL.h('div.prefs-chips', null,
        I18N.LANGS.map((l) =>
          CL.h('button.chip' + (l.code === I18N.lang ? '.is-active' : ''), {
            type: 'button',
            text: l.name,
            onclick: () => CL.setLang(l.code),
          })));

      // 2. Brand (printed on the PDF spec sheet) — saved on change
      const field = (key, label, type, ph) => {
        const input = CL.h('input.input', { type: type || 'text', value: author[key] || '', placeholder: ph || '' });
        input.addEventListener('change', () => {
          CL.store.saveSettings({ author: Object.assign({}, CL.store.settings.author, { [key]: input.value.trim() }) });
          CL.toast(t('settings.savedToast'));
        });
        return CL.h('label.prefs-field', null, CL.h('span', { text: label }), input);
      };
      const brand = CL.h('div.prefs-fields', null,
        field('name', t('settings.name')),
        field('brand', t('settings.brand')),
        field('email', t('settings.email'), 'email', 'name@brand.com'),
        field('phone', t('settings.phone'), 'tel'));

      // 3. PDF quality
      const quality = CL.h('div.segmented.prefs-seg', null,
        [[150, 'prefs.q150'], [300, 'prefs.q300'], [600, 'prefs.q600']].map(([dpi, key]) =>
          CL.h('button' + ((s.exportDPI || 300) === dpi ? '.is-active' : ''), {
            type: 'button',
            text: t(key),
            onclick: (e) => {
              CL.store.saveSettings({ exportDPI: dpi });
              e.currentTarget.parentElement.querySelectorAll('button').forEach((b) => b.classList.toggle('is-active', b === e.currentTarget));
              CL.toast(t('settings.savedToast'));
            },
          })));

      // 4. Data — back up / restore / reset
      const backup = () => {
        const data = { app: 'coslab', exportedAt: new Date().toISOString(), designs: CL.store.listDesigns() };
        const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
        CL.download(url, 'coslab-designs.json');
        setTimeout(() => URL.revokeObjectURL(url), 2000);
      };
      const restore = () => {
        const input = CL.h('input', { type: 'file', accept: '.json,application/json' });
        input.onchange = () => {
          const file = input.files && input.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const parsed = JSON.parse(reader.result);
              const list = Array.isArray(parsed && parsed.designs) ? parsed.designs : [];
              const clean = list.map(sanitizeDesign).filter(Boolean);
              if (!clean.length) throw new Error('empty');
              clean.forEach((d) => CL.store.saveDesign(d));
              CL.toast(t('settings.savedToast'));
              CL.go('#/my-designs');
            } catch (e) {
              CL.toast(t('prefs.restoreFail'), 'info');
            }
          };
          reader.readAsText(file);
        };
        input.click();
      };
      const reset = async () => {
        const ok = await CL.confirm({ title: t('prefs.reset'), message: t('prefs.resetConfirm') });
        if (ok) {
          try { localStorage.removeItem('coslab.settings'); } catch (e) { /* storage blocked */ }
          location.reload();
        }
      };
      const data = CL.h('div.prefs-actions', null,
        CL.h('button.btn.btn-outline.btn-sm', { type: 'button', text: t('prefs.backup'), onclick: backup }),
        CL.h('button.btn.btn-outline.btn-sm', { type: 'button', text: t('prefs.restore'), onclick: restore }),
        CL.h('button.btn.btn-ghost.btn-sm.prefs-danger', { type: 'button', text: t('prefs.reset'), onclick: reset }));

      root.append(head,
        group(t('settings.languages'), null, langs),
        group(t('settings.author'), t('prefs.brandNote'), brand),
        group(t('prefs.pdfQuality'), null, quality),
        group(t('prefs.data'), null, data));
      container.appendChild(root);
      return () => {};
    },
  };
})(window.CL);
