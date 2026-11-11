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

  CL.confirm = function ({ title, message, okText, cancelText, danger }) {
    return new Promise((resolve) => {
      const host = document.getElementById('modalHost');
      const close = (v) => { host.innerHTML = ''; document.removeEventListener('keydown', onKey); resolve(v); };
      const onKey = (e) => { if (e.key === 'Escape') close(false); if (e.key === 'Enter') close(true); };
      const bd = CL.h('div.modal-backdrop', { onclick: (e) => { if (e.target === bd) close(false); } },
        CL.h('div.modal', { role: 'dialog', 'aria-modal': 'true' },
          CL.h('h3', { text: title }),
          message ? CL.h('p', { text: message }) : null,
          CL.h('div.modal-actions', null,
            CL.h('button.btn.btn-ghost', { onclick: () => close(false), text: cancelText || t('common.cancel') }),
            CL.h('button.btn.btn-primary', { onclick: () => close(true), text: okText || t('common.confirm') }))));
      host.innerHTML = ''; host.appendChild(bd);
      document.addEventListener('keydown', onKey);
      setTimeout(() => bd.querySelector('.btn-primary').focus(), 30);
    });
  };

  /** Open a dropdown menu anchored to an element. items: [{label, icon, onClick, active, sep, note, disabled}] */
  let openMenu = null;
  CL.menu = function (anchor, items, opts = {}) {
    CL.closeMenu();
    const m = CL.h('div.menu', { role: 'menu' });
    items.forEach((it) => {
      if (it.sep) return m.appendChild(CL.h('div.menu-sep'));
      if (it.note) return m.appendChild(CL.h('div.menu-note', { text: it.note }));
      const b = CL.h('button', { role: 'menuitem', class: it.active ? 'is-active' : '', disabled: it.disabled, html: (it.icon ? CL.icon(it.icon) : '') + '<span></span>' + (it.right || '') });
      b.querySelector('span').textContent = it.label;
      if (it.disabled) b.style.opacity = .5;
      b.addEventListener('click', (e) => { e.stopPropagation(); CL.closeMenu(); it.onClick && it.onClick(); });
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
    m.style.left = left + 'px'; m.style.top = top + 'px';
    openMenu = m;
    setTimeout(() => document.addEventListener('pointerdown', outside), 0);
    function outside(e) { if (!m.contains(e.target)) CL.closeMenu(); }
    m._outside = outside;
    return m;
  };
  CL.closeMenu = function () {
    if (openMenu) { document.removeEventListener('pointerdown', openMenu._outside); openMenu.remove(); openMenu = null; }
  };
  window.addEventListener('resize', () => CL.closeMenu());
  window.addEventListener('hashchange', () => CL.closeMenu());

  /** Export menu items shared by editor, gallery and my-designs. */
  CL.exportMenuItems = function (getDesign) {
    const run = (fmt) => CL.exporter.exportDesign(getDesign(), fmt);
    return [
      { label: t('editor.exportPng'), icon: 'image', onClick: () => run('png') },
      { label: t('editor.exportJpg'), icon: 'image', onClick: () => run('jpg') },
      { label: t('editor.exportPdf'), icon: 'file', onClick: () => run('pdf') },
      { sep: true },
      { label: t('editor.exportSvg'), icon: 'shapes', onClick: () => run('svg') },
    ];
  };
})(window.CL);
