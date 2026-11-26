/* ==========================================================
   COSLAB — Drag a colour, get the closest Pantone code.
   The tube always shows the Pantone colour, never the free one.
   ========================================================== */
(function (CL) {
  let open = false;
  let last = null; // { hsv, code }: keeps the dragged spot while the panel re-renders

  /**
   * value: current Pantone entry · ink: print colour (text) or material
   * onInput(entry): code changed while dragging · onCommit(): drag finished
   */
  CL.PantonePicker = function ({ value, ink = false, onInput, onCommit }) {
    const isVi = I18N.lang === 'vi';
    const toHex = (c) => CL.color.rgbToHex(CL.color.hsvToRgb(c));
    const hsv = last && value && last.code === value.code && last.ink === ink
      ? Object.assign({}, last.hsv)
      : CL.color.rgbToHsv(CL.color.hexToRgb(value ? value.screen : '#c8102e'));
    let code = value ? value.code : '';

    const dot = CL.h('i.pp-dot');
    const area = CL.h('div.pp-area', { tabindex: '0', role: 'slider', 'aria-label': isVi ? 'Đậm nhạt và sáng tối' : 'Saturation and brightness' }, dot);
    const hue = CL.h('input.pp-hue', { type: 'range', min: '0', max: '360', step: '1', value: String(Math.round(hsv.h)), 'aria-label': isVi ? 'Tông màu' : 'Hue' });
    const swFree = CL.h('i'), swPt = CL.h('i');
    const name = CL.h('strong');
    const near = CL.h('div.pp-near');

    function paint() {
      const hex = toHex(hsv);
      area.style.backgroundColor = toHex({ h: hsv.h, s: 1, v: 1 });
      dot.style.left = hsv.s * 100 + '%';
      dot.style.top = (1 - hsv.v) * 100 + '%';
      dot.style.background = hex;
      const list = CL.pantone.closest(hex, 5, { ink });
      const p = CL.pantone.byCode.get(code) && list.find((x) => x.code === code) || list[0];
      swFree.style.background = hex;
      swPt.style.background = p.screen;
      name.textContent = CL.pantone.label(p);
      area.setAttribute('aria-valuetext', CL.pantone.label(p));
      near.replaceChildren(...list.map((x) => CL.h('button', {
        type: 'button',
        class: x.code === p.code ? 'is-active' : '',
        title: CL.pantone.label(x),
        'aria-label': CL.pantone.label(x),
        onclick: () => { take(x); onCommit(); },
      }, CL.h('i', { style: { background: x.screen } }), CL.h('span', { text: x.special ? 'White' : x.code }))));
    }

    function take(p) {
      last = { hsv: Object.assign({}, hsv), code: p.code, ink };
      if (p.code === code) return;
      code = p.code;
      onInput(p);
    }

    function change() {
      take(CL.pantone.closest(toHex(hsv), 1, { ink })[0]);
      paint();
    }

    area.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      area.focus({ preventScroll: true });
      area.setPointerCapture(e.pointerId);
      const move = (ev) => {
        const b = area.getBoundingClientRect();
        hsv.s = CL.clamp((ev.clientX - b.left) / b.width, 0, 1);
        hsv.v = 1 - CL.clamp((ev.clientY - b.top) / b.height, 0, 1);
        change();
      };
      const up = () => {
        area.removeEventListener('pointermove', move);
        area.removeEventListener('pointerup', up);
        area.removeEventListener('pointercancel', up);
        onCommit();
      };
      area.addEventListener('pointermove', move);
      area.addEventListener('pointerup', up);
      area.addEventListener('pointercancel', up);
      move(e);
    });
    area.addEventListener('keydown', (e) => {
      const d = { ArrowLeft: [-3, 0], ArrowRight: [3, 0], ArrowUp: [0, 3], ArrowDown: [0, -3] }[e.key];
      if (!d) return;
      e.preventDefault();
      e.stopPropagation();
      hsv.s = CL.clamp(hsv.s + d[0] / 100, 0, 1);
      hsv.v = CL.clamp(hsv.v + d[1] / 100, 0, 1);
      change();
    });
    area.addEventListener('keyup', (e) => { if (e.key.startsWith('Arrow')) { e.stopPropagation(); onCommit(); } });
    hue.addEventListener('input', () => { hsv.h = Number(hue.value); change(); });
    hue.addEventListener('change', () => onCommit());

    paint();
    const box = CL.h('details.pp', null,
      CL.h('summary', null, CL.h('i', { 'aria-hidden': 'true' }), CL.h('span', { text: isVi ? 'Tự kéo màu' : 'Drag your own colour' })),
      area, hue,
      CL.h('div.pp-result', null,
        CL.h('span.pp-pair', { 'aria-hidden': 'true' }, swFree, swPt),
        CL.h('span.pp-text', null, CL.h('small', { text: isVi ? 'Mã màu gần nhất' : 'Closest colour code' }), name)),
      near
    );
    box.open = open;
    box.addEventListener('toggle', () => { open = box.open; });
    return box;
  };
})(window.CL);
