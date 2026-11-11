/* ==========================================================
   COSLAB — Colour Picker (Illustrator-style + K-Beauty Curated Palettes)
   MLBB Velvet Shades, Water Glow Tints, and Chrome/Porcelain Packaging
   ========================================================== */
(function (CL) {
  // Korean K-Beauty MLBB & Tint Shades
  const K_TINTS = [
    '#b85c66', '#a84d59', '#be5d69', '#9e5967', '#8a4c58', '#783c47',
    '#df705e', '#a63428', '#c94d5b', '#e26b77', '#d96758', '#96382b',
    '#df8b7d', '#c98d79', '#bb6f62', '#da877c', '#c76671', '#e89098'
  ];

  // Korean Atelier Packaging (Frosted, Porcelain, Chrome, Obsidian, Bone)
  const K_PACK = [
    '#fbfaf7', '#f4f2ec', '#eae5da', '#d9d9d9', '#c4bfb6', '#8e887e',
    '#171615', '#242220', '#3b3834', '#c5a367', '#d4a896', '#e8c4b8',
    '#202938', '#2b3933', '#dedad2', '#fdfbf9'
  ];

  const RKEY = 'coslab.recentColors';
  const getRecent = () => { try { return JSON.parse(localStorage.getItem(RKEY)) || []; } catch (e) { return []; } };
  const pushRecent = (hex) => {
    const r = [hex, ...getRecent().filter((c) => c !== hex)].slice(0, 8);
    try { localStorage.setItem(RKEY, JSON.stringify(r)); } catch (e) { }
  };

  CL.ColorPicker = function ({ value = '#171615', onChange, showSwatches = true, compact = false }) {
    let hsv = CL.color.rgbToHsv(CL.color.hexToRgb(value));
    let hex = CL.color.normalize(value);

    const root = CL.h('div.cp' + (compact ? '.cp-compact' : ''));
    const sv = CL.h('div.cp-sv', null, CL.h('div.cp-sv-knob'));
    const hue = CL.h('div.cp-hue', null, CL.h('div.cp-hue-knob'));
    const hexIn = CL.h('input.input.input-sm.cp-hex', { value: hex.toUpperCase(), maxlength: 7, spellcheck: 'false', 'aria-label': 'HEX' });
    const preview = CL.h('span.cp-preview');
    const dropBtn = CL.h('button.icon-btn.sm', { type: 'button', html: CL.icon('pipette'), title: t('editor.colors.eyedropper') });
    if (!('EyeDropper' in window)) dropBtn.disabled = true;

    root.append(sv, hue, CL.h('div.cp-row', null, preview, hexIn, dropBtn));

    if (showSwatches) {
      const group = (title, colors) => CL.h('div.cp-group', null,
        CL.h('div.cp-group-title', { text: title }),
        CL.h('div.cp-swatches', null, colors.map((c) => CL.h('button.cp-sw', { type: 'button', style: { background: c }, title: c.toUpperCase(), 'data-c': c }))));
      const recent = getRecent();
      if (recent.length) root.append(group(t('editor.colors.recent'), recent));
      root.append(group('K-Beauty Tint Shades (MLBB)', K_TINTS), group('K-Beauty Packaging & Metals', K_PACK));
      root.addEventListener('click', (e) => {
        const b = e.target.closest('.cp-sw'); if (!b) return;
        set(b.dataset.c, true);
      });
    }

    function paint() {
      const pure = CL.color.rgbToHex(CL.color.hsvToRgb({ h: hsv.h, s: 1, v: 1 }));
      sv.style.background = `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, ${pure})`;
      sv.firstChild.style.left = hsv.s * 100 + '%';
      sv.firstChild.style.top = (1 - hsv.v) * 100 + '%';
      sv.firstChild.style.background = hex;
      hue.firstChild.style.left = (hsv.h / 360) * 100 + '%';
      preview.style.background = hex;
      if (document.activeElement !== hexIn) hexIn.value = hex.toUpperCase();
      root.querySelectorAll('.cp-sw').forEach((b) => b.classList.toggle('is-active', b.dataset.c.toLowerCase() === hex));
    }

    let commitT;
    function emit(final) {
      onChange && onChange(hex, final);
      clearTimeout(commitT);
      if (final) pushRecent(hex);
      else commitT = setTimeout(() => pushRecent(hex), 1200);
    }

    function set(v, final) {
      if (!CL.color.isHex(v)) return;
      hex = CL.color.normalize(v);
      hsv = CL.color.rgbToHsv(CL.color.hexToRgb(hex));
      paint(); emit(final);
    }

    function drag(el, fn) {
      el.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        el.setPointerCapture(e.pointerId);
        const move = (ev) => { const r = el.getBoundingClientRect(); fn(CL.clamp((ev.clientX - r.left) / r.width, 0, 1), CL.clamp((ev.clientY - r.top) / r.height, 0, 1)); emit(false); };
        const up = () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); emit(true); };
        el.addEventListener('pointermove', move); el.addEventListener('pointerup', up);
        move(e);
      });
    }
    drag(sv, (x, y) => { hsv.s = x; hsv.v = 1 - y; hex = CL.color.rgbToHex(CL.color.hsvToRgb(hsv)); paint(); });
    drag(hue, (x) => { hsv.h = Math.min(359.9, x * 360); hex = CL.color.rgbToHex(CL.color.hsvToRgb(hsv)); paint(); });

    hexIn.addEventListener('input', () => { if (CL.color.isHex(hexIn.value) && hexIn.value.replace('#', '').length === 6) set(hexIn.value, false); });
    hexIn.addEventListener('change', () => set(hexIn.value, true));
    hexIn.addEventListener('blur', () => { hexIn.value = hex.toUpperCase(); });
    dropBtn.addEventListener('click', async () => {
      try { const r = await new window.EyeDropper().open(); set(r.sRGBHex, true); } catch (e) { }
    });

    paint();
    root.setValue = (v) => { if (!CL.color.isHex(v)) return; hex = CL.color.normalize(v); hsv = CL.color.rgbToHsv(CL.color.hexToRgb(hex)); paint(); };
    return root;
  };

  CL.ColorPicker.K_TINTS = K_TINTS;
  CL.ColorPicker.K_PACK = K_PACK;
})(window.CL);
