/* ==========================================================
   Shared UI helpers: toast, confirm modal, dropdown menus
   ========================================================== */
(function (CL) {
  CL.toast = function (msg, icon = 'check') {
    const host = document.getElementById('toastHost');
    const el = CL.h('div.toast', { html: CL.icon(icon) + '<span></span>' });
    el.querySelector('span').textContent = msg;
    host.appendChild(el);
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 260); }, 2600);
  };

  /** Take an element away with its leave animation (CSS: .is-leaving) instead of at once. */
  CL.fadeOut = function (el, ms = 180) {
    if (!el || !el.isConnected) return;
    el.classList.add('is-leaving');
    el.style.pointerEvents = 'none';
    setTimeout(() => el.remove(), matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : ms);
  };

  CL.confirm = function ({ title, message, body, okText, cancelText, danger }) {
    return new Promise((resolve) => {
      const host = document.getElementById('modalHost');
      const close = (v) => { CL.fadeOut(bd); document.removeEventListener('keydown', onKey); resolve(v); };
      const onKey = (e) => {
        if (e.key === 'Escape') { e.preventDefault(); close(false); return; }
        if (e.key === 'Enter') {
          // A focused modal button handles Enter itself (native click) — don't override Cancel.
          const f = document.activeElement;
          if (f && f.tagName === 'BUTTON' && host.contains(f)) return;
          e.preventDefault();
          close(true);
        }
      };
      const bd = CL.h('div.modal-backdrop', { onclick: (e) => { if (e.target === bd) close(false); } },
        CL.h('div.modal', { role: 'dialog', 'aria-modal': 'true' },
          CL.h('h3', { text: title }),
          message ? CL.h('p', { text: message }) : null,
          body || null,
          CL.h('div.modal-actions', null,
            CL.h('button.btn.btn-ghost', { onclick: () => close(false), text: cancelText || t('common.cancel') }),
            CL.h('button.btn.btn-primary', { onclick: () => close(true), text: okText || t('common.confirm') }))));
      host.innerHTML = ''; host.appendChild(bd);
      document.addEventListener('keydown', onKey);
      setTimeout(() => bd.querySelector('.btn-primary').focus(), 30);
    });
  };

  /** Open a dropdown menu anchored to an element. items: [{label, icon, onClick, active, sep, note, disabled, code}] */
  let openMenu = null;
  let menuAnchor = null;
  CL.menu = function (anchor, items, opts = {}) {
    CL.closeMenu();
    menuAnchor = anchor;
    if (anchor) {
      anchor.classList.add('menu-open');
      anchor.setAttribute('aria-expanded', 'true');
    }
    const isLang = opts.type === 'lang';
    const m = CL.h('div.menu' + (isLang ? '.menu-simple-lang' : '') + (opts.className ? '.' + opts.className : ''), { role: 'menu' });
    items.forEach((it) => {
      if (it.sep) return m.appendChild(CL.h('div.menu-sep'));
      if (it.note) return m.appendChild(CL.h('div.menu-note', { text: it.note }));
      
      let b;
      if (isLang) {
        b = CL.h('button.menu-lang-opt' + (it.active ? '.is-active' : ''), {
          role: 'menuitem',
          html: `<span class="lang-opt-name">${it.label}</span><span class="lang-opt-code">${it.code || ''}</span>`
        });
      } else {
        b = CL.h('button.menu-item' + (it.active ? '.is-active' : ''), {
          role: 'menuitem',
          disabled: it.disabled,
          html: (it.icon ? `<span class="menu-icon-left">${CL.icon(it.icon)}</span>` : '') +
                `<span class="menu-item-text">${it.label}</span>` +
                (it.right ? `<span class="menu-item-right">${it.right}</span>` : '')
        });
        if (it.disabled) b.style.opacity = .5;
      }
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        CL.closeMenu();
        it.onClick && it.onClick();
      });
      m.appendChild(b);
    });
    const r = anchor.getBoundingClientRect();
    m.style.position = 'fixed';
    document.body.appendChild(m);
    const mw = m.offsetWidth, mh = m.offsetHeight;
    let left = opts.align === 'start' ? r.left : r.right - mw;
    if (document.dir === 'rtl') left = opts.align === 'start' ? r.right - mw : r.left;
    left = CL.clamp(left, 8, window.innerWidth - mw - 8);
    let top = r.bottom + 6;
    if (top + mh > window.innerHeight - 8) top = Math.max(8, r.top - mh - 6);
    m.style.left = left + 'px';
    m.style.top = top + 'px';
    openMenu = m;
    setTimeout(() => document.addEventListener('pointerdown', outside), 0);
    function outside(e) { if (!m.contains(e.target)) CL.closeMenu(); }
    m._outside = outside;
    return m;
  };
  CL.closeMenu = function () {
    if (menuAnchor) {
      menuAnchor.classList.remove('menu-open');
      menuAnchor.setAttribute('aria-expanded', 'false');
      menuAnchor = null;
    }
    if (openMenu) {
      document.removeEventListener('pointerdown', openMenu._outside);
      CL.fadeOut(openMenu, 120);
      openMenu = null;
    }
  };
  window.addEventListener('resize', () => CL.closeMenu());
  window.addEventListener('hashchange', () => CL.closeMenu());

  /** Save dialog: pick 2D/3D and a file format, see the result, then save. */
  CL.openExport = function (source) {
    const design = CL.clone(source);
    const saved = CL.store.settings;
    const FORMATS = [['png', 'image', 'editor.exportPng'], ['jpg', 'image', 'editor.exportJpg'], ['pdf', 'file', 'editor.exportPdf'], ['svg', 'shapes', 'editor.exportSvg']];
    let view = saved.exportView === '3d' ? '3d' : '2d';
    let fmt = FORMATS.some(([id]) => id === saved.exportFormat) ? saved.exportFormat : 'png';
    let dpi = [150, 300, 600].includes(saved.exportDPI) ? saved.exportDPI : 300;

    const host = document.getElementById('modalHost');
    const opener = document.activeElement;
    let open = true;
    const close = () => {
      open = false;
      [...host.children].forEach((el) => CL.fadeOut(el));
      window.removeEventListener('hashchange', close);
      if (opener && opener.isConnected) opener.focus();
    };

    /* ---- choices ---- */
    const choice = (cls, label, options, get, set) => {
      const el = CL.h('div' + cls, { role: 'radiogroup', 'aria-label': label });
      options.forEach(([id, ...parts]) => el.append(CL.h('button', {
        type: 'button', role: 'radio', 'data-id': String(id), onclick: () => { set(id); sync(); },
      }, ...parts)));
      el._sync = () => el.querySelectorAll('button').forEach((b) => {
        const on = b.dataset.id === String(get());
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-checked', String(on));
      });
      return el;
    };
    const viewPick = choice('.segmented.block.ex-view', '2D / 3D', [['2d', '2D'], ['3d', '3D']], () => (fmt === 'svg' ? '2d' : view), (v) => { view = v; });
    const fmtPick = choice('.ex-formats', t('editor.export'),
      FORMATS.map(([id, icon, key]) => [id, CL.h('i', { html: CL.icon(icon), 'aria-hidden': 'true' }), CL.h('span', null, CL.h('strong', { text: id.toUpperCase() }), CL.h('small', { text: t(key) }))]),
      () => fmt, (v) => { fmt = v; });
    const dpiPick = choice('.segmented.block', t('prefs.pdfQuality'), [[150, t('prefs.q150')], [300, t('prefs.q300')], [600, t('prefs.q600')]], () => dpi, (v) => { dpi = v; });
    const dpiRow = CL.h('div.ex-quality', null, CL.h('span', { text: t('prefs.pdfQuality') }), dpiPick);

    /* ---- preview ---- */
    const stage = CL.h('div.ex-preview', { 'aria-live': 'polite' });
    const cache = new Map();
    let shown = '';
    const draw = (v, f) => {
      const X = CL.exporter;
      if (f === 'pdf') return X.buildSpecPages(design, v, 150);
      if (f === 'svg') return X.renderCanvas(design, { scale: 1.5, dieline: (CL.store.settings || {}).outlineVector !== false }).then((c) => [c]);
      if (v === '3d') return X.renderCanvas3D(design, { pixelRatio: 1 }).then((c) => [c]);
      return X.renderCanvas(design, { scale: 1.5 }).then((c) => [c]);
    };
    async function preview() {
      const v = fmt === 'svg' ? '2d' : view;
      const kind = fmt === 'pdf' || fmt === 'svg' ? fmt : 'image';
      const key = v + kind;
      stage.dataset.format = fmt;
      if (shown === key && !stage.classList.contains('is-loading')) return;
      shown = key;
      stage.classList.add('is-loading');
      if (!cache.has(key)) cache.set(key, draw(v, kind));
      try {
        const pages = await cache.get(key);
        if (!open || shown !== key) return;
        stage.replaceChildren(...pages);
      } catch (e) {
        console.error(e);
        cache.delete(key);
        if (!open || shown !== key) return;
        shown = '';
        stage.replaceChildren(CL.h('p', { text: t('editor.exportFailed') }));
      }
      stage.classList.remove('is-loading');
    }

    function sync() {
      viewPick._sync(); fmtPick._sync(); dpiPick._sync();
      // SVG artwork is flat by nature
      viewPick.querySelector('[data-id="3d"]').disabled = fmt === 'svg';
      dpiRow.hidden = fmt !== 'pdf';
      preview();
    }

    const saveBtn = CL.h('button.btn.btn-primary', {
      type: 'button',
      html: CL.icon('download') + `<span>${t('common.download')}</span>`,
      onclick: async () => {
        saveBtn.disabled = true;
        CL.store.saveSettings({ exportView: view, exportFormat: fmt, exportDPI: dpi });
        const ok = await CL.exporter.exportDesign(design, fmt, view);
        saveBtn.disabled = false;
        if (ok && open) close();
      },
    });

    const modal = CL.h('div.modal.ex-modal', { role: 'dialog', 'aria-modal': 'true', 'aria-label': t('editor.export') },
      stage,
      CL.h('div.ex-side', null,
        CL.h('div.ex-head', null,
          CL.h('h3', { text: t('editor.export') }),
          CL.h('button.icon-btn.sm', { type: 'button', 'aria-label': t('common.close'), html: CL.icon('close'), onclick: close })),
        viewPick, fmtPick, dpiRow,
        CL.h('div.modal-actions', null,
          CL.h('button.btn.btn-ghost', { type: 'button', text: t('common.cancel'), onclick: close }),
          saveBtn))
    );
    const bd = CL.h('div.modal-backdrop', { onclick: (e) => { if (e.target === bd) close(); } }, modal);
    // Keys stay in the dialog (the Studio behind it has its own shortcuts)
    bd.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Escape') { e.preventDefault(); close(); return; }
      if (e.key !== 'Tab') return;
      const list = [...modal.querySelectorAll('button:not(:disabled)')].filter((b) => b.offsetParent);
      const first = list[0], last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    window.addEventListener('hashchange', close);
    host.replaceChildren(bd);
    sync();
    saveBtn.focus();
  };
})(window.CL);
