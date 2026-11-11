/* ==========================================================
   COSLAB — Luxury Atelier Color Picker
   Curated K-Beauty MLBB Shades & Packaging Metals + Custom Precision Spectrum
   ========================================================== */
(function (CL) {
  // Korean K-Beauty MLBB & Tint Shades
  const K_TINTS = [
    { c: '#b85c66', n: 'Velvet Rosé' },
    { c: '#a84d59', n: 'Muted Mauve' },
    { c: '#be5d69', n: 'Rose Petal' },
    { c: '#9e5967', n: 'Deep Plum' },
    { c: '#8a4c58', n: 'Vintage Fig' },
    { c: '#783c47', n: 'Blackberry' },
    { c: '#df705e', n: 'Chili Sunset' },
    { c: '#a63428', n: 'Warm Brick' },
    { c: '#c94d5b', n: 'Crimson Dew' },
    { c: '#e26b77', n: 'Cherry Berry' },
    { c: '#d96758', n: 'Coral Maple' },
    { c: '#96382b', n: 'Seoul Terra' },
    { c: '#df8b7d', n: 'Peach Mousse' },
    { c: '#c98d79', n: 'Almond Beige' },
    { c: '#bb6f62', n: 'Toasted Rose' },
    { c: '#da877c', n: 'Soft Apricot' },
    { c: '#c76671', n: 'Cold Blossom' },
    { c: '#e89098', n: 'Baby Pink Dew' }
  ];

  // Korean Atelier Packaging (Frosted, Porcelain, Chrome, Obsidian, Bone)
  const K_PACK = [
    { c: '#fbfaf7', n: 'Pure Porcelain' },
    { c: '#f4f2ec', n: 'Bone Alabaster' },
    { c: '#eae5da', n: 'Ivory Glaze' },
    { c: '#d9d9d9', n: 'Cold Chrome' },
    { c: '#c4bfb6', n: 'Frosted Silver' },
    { c: '#8e887e', n: 'Brushed Titanium' },
    { c: '#171615', n: 'Seoul Obsidian' },
    { c: '#242220', n: 'Noir Lacquer' },
    { c: '#3b3834', n: 'Dark Umber' },
    { c: '#c5a367', n: '24K Mirror Gold' },
    { c: '#d4a896', n: 'Champagne Rose' },
    { c: '#e8c4b8', n: 'Warm Copper' },
    { c: '#202938', n: 'Midnight Marine' },
    { c: '#2b3933', n: 'Forest Pine' },
    { c: '#dedad2', n: 'Ceramic Mist' },
    { c: '#ffffff', n: 'Atelier White' }
  ];

  const RKEY = 'coslab.recentColors';
  const getRecent = () => { try { return JSON.parse(localStorage.getItem(RKEY)) || []; } catch (e) { return []; } };
  const pushRecent = (hex) => {
    const r = [hex, ...getRecent().filter((c) => c !== hex)].slice(0, 12);
    try { localStorage.setItem(RKEY, JSON.stringify(r)); } catch (e) { }
  };

  CL.ColorPicker = function ({ value = '#b85c66', onChange, showSwatches = true, compact = false }) {
    let hsv = CL.color.rgbToHsv(CL.color.hexToRgb(value));
    let hex = CL.color.normalize(value);
    let currentMode = compact ? 'spectrum' : 'palette';
    let currentCat = 'tints';

    const root = CL.h('div.cp' + (compact ? '.cp-compact' : ''));

    // Top Segmented Mode Switcher (Palette vs Custom Spectrum)
    let modeSwitch = null;
    if (!compact && showSwatches) {
      modeSwitch = CL.h('div.cp-mode-switch', null,
        CL.h('button.cp-mode-btn' + (currentMode === 'palette' ? '.is-active' : ''), {
          type: 'button',
          text: 'K-Beauty Palettes',
          onclick: () => switchMode('palette'),
        }),
        CL.h('button.cp-mode-btn' + (currentMode === 'spectrum' ? '.is-active' : ''), {
          type: 'button',
          text: 'Custom Spectrum',
          onclick: () => switchMode('spectrum'),
        })
      );
      root.appendChild(modeSwitch);
    }

    // 1. Palette View Container
    const paletteContainer = CL.h('div.cp-palette-view', { style: { display: currentMode === 'palette' ? 'grid' : 'none' } });

    // Category Selector (MLBB / Packaging / Recent)
    const catSelector = CL.h('div.cp-cat-selector', null,
      CL.h('button.cp-cat-btn' + (currentCat === 'tints' ? '.is-active' : ''), {
        type: 'button',
        text: 'MLBB Tint',
        onclick: () => switchCat('tints'),
      }),
      CL.h('button.cp-cat-btn' + (currentCat === 'pack' ? '.is-active' : ''), {
        type: 'button',
        text: 'Packaging',
        onclick: () => switchCat('pack'),
      }),
      CL.h('button.cp-cat-btn' + (currentCat === 'recent' ? '.is-active' : ''), {
        type: 'button',
        text: 'Recent',
        onclick: () => switchCat('recent'),
      })
    );
    paletteContainer.appendChild(catSelector);

    // Swatches Grid
    const swatchesGrid = CL.h('div.cp-cosmetic-grid');
    paletteContainer.appendChild(swatchesGrid);
    root.appendChild(paletteContainer);

    // 2. Custom Spectrum Container
    const spectrumContainer = CL.h('div.cp-spectrum-view', { style: { display: currentMode === 'spectrum' ? 'grid' : 'none' } });
    const sv = CL.h('div.cp-sv', null, CL.h('div.cp-sv-knob'));
    const hue = CL.h('div.cp-hue', null, CL.h('div.cp-hue-knob'));
    spectrumContainer.append(sv, hue);
    root.appendChild(spectrumContainer);

    // 3. Bottom Control Row (Shared across both modes)
    const preview = CL.h('span.cp-preview');
    const hexIn = CL.h('input.input.input-sm.cp-hex', {
      value: hex.toUpperCase(),
      maxlength: 7,
      spellcheck: 'false',
      'aria-label': 'HEX Color'
    });
    const dropBtn = CL.h('button.icon-btn.sm.cp-eyedropper', {
      type: 'button',
      html: CL.icon('pipette'),
      title: 'Pick Color from Screen'
    });
    if (!('EyeDropper' in window)) dropBtn.disabled = true;

    const bottomRow = CL.h('div.cp-bottom-bar', null,
      preview,
      hexIn,
      dropBtn
    );
    root.appendChild(bottomRow);

    function switchMode(m) {
      currentMode = m;
      if (modeSwitch) {
        modeSwitch.querySelectorAll('.cp-mode-btn').forEach((b, i) =>
          b.classList.toggle('is-active', (i === 0 && m === 'palette') || (i === 1 && m === 'spectrum'))
        );
      }
      paletteContainer.style.display = m === 'palette' ? 'grid' : 'none';
      spectrumContainer.style.display = m === 'spectrum' ? 'grid' : 'none';
    }

    function switchCat(cat) {
      currentCat = cat;
      catSelector.querySelectorAll('.cp-cat-btn').forEach((b) => {
        const text = b.textContent.toLowerCase();
        b.classList.toggle('is-active', text.includes(cat === 'tints' ? 'mlbb' : cat === 'pack' ? 'pack' : 'rec'));
      });
      renderSwatches();
    }

    function renderSwatches() {
      swatchesGrid.innerHTML = '';
      let list = [];
      if (currentCat === 'tints') list = K_TINTS;
      else if (currentCat === 'pack') list = K_PACK;
      else if (currentCat === 'recent') {
        const rec = getRecent();
        list = rec.length ? rec.map((c) => ({ c, n: c.toUpperCase() })) : [{ c: '#b85c66', n: 'Default Rosé' }];
      }

      list.forEach((item) => {
        const sw = CL.h('button.cp-cosmetic-sw' + (item.c.toLowerCase() === hex.toLowerCase() ? '.is-active' : ''), {
          type: 'button',
          style: { background: item.c },
          title: `${item.n} (${item.c.toUpperCase()})`,
          'data-c': item.c,
          onclick: () => set(item.c, true),
        });
        swatchesGrid.appendChild(sw);
      });
    }

    function paint() {
      const pure = CL.color.rgbToHex(CL.color.hsvToRgb({ h: hsv.h, s: 1, v: 1 }));
      sv.style.background = `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, ${pure})`;
      sv.firstChild.style.left = (hsv.s * 100) + '%';
      sv.firstChild.style.top = ((1 - hsv.v) * 100) + '%';
      sv.firstChild.style.background = hex;
      hue.firstChild.style.left = ((hsv.h / 360) * 100) + '%';
      preview.style.background = hex;

      if (document.activeElement !== hexIn) {
        hexIn.value = hex.toUpperCase();
      }

      root.querySelectorAll('.cp-cosmetic-sw').forEach((b) => {
        b.classList.toggle('is-active', b.dataset.c.toLowerCase() === hex.toLowerCase());
      });
    }

    let commitT;
    function emit(final) {
      onChange && onChange(hex, final);
      clearTimeout(commitT);
      if (final) {
        pushRecent(hex);
        if (currentCat === 'recent') renderSwatches();
      } else {
        commitT = setTimeout(() => {
          pushRecent(hex);
          if (currentCat === 'recent') renderSwatches();
        }, 1200);
      }
    }

    function set(v, final) {
      if (!CL.color.isHex(v)) return;
      hex = CL.color.normalize(v);
      hsv = CL.color.rgbToHsv(CL.color.hexToRgb(hex));
      paint();
      emit(final);
    }

    function drag(el, fn) {
      el.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        el.setPointerCapture(e.pointerId);
        const move = (ev) => {
          const r = el.getBoundingClientRect();
          fn(CL.clamp((ev.clientX - r.left) / r.width, 0, 1), CL.clamp((ev.clientY - r.top) / r.height, 0, 1));
          emit(false);
        };
        const up = () => {
          el.removeEventListener('pointermove', move);
          el.removeEventListener('pointerup', up);
          emit(true);
        };
        el.addEventListener('pointermove', move);
        el.addEventListener('pointerup', up);
        move(e);
      });
    }

    drag(sv, (x, y) => {
      hsv.s = x;
      hsv.v = 1 - y;
      hex = CL.color.rgbToHex(CL.color.hsvToRgb(hsv));
      paint();
    });

    drag(hue, (x) => {
      hsv.h = Math.min(359.9, x * 360);
      hex = CL.color.rgbToHex(CL.color.hsvToRgb(hsv));
      paint();
    });

    hexIn.addEventListener('input', () => {
      if (CL.color.isHex(hexIn.value) && hexIn.value.replace('#', '').length === 6) {
        set(hexIn.value, false);
      }
    });
    hexIn.addEventListener('change', () => set(hexIn.value, true));
    hexIn.addEventListener('blur', () => { hexIn.value = hex.toUpperCase(); });

    dropBtn.addEventListener('click', async () => {
      try {
        const r = await new window.EyeDropper().open();
        set(r.sRGBHex, true);
      } catch (e) { }
    });

    renderSwatches();
    paint();

    root.setValue = (v) => {
      if (!CL.color.isHex(v)) return;
      hex = CL.color.normalize(v);
      hsv = CL.color.rgbToHsv(CL.color.hexToRgb(hex));
      paint();
    };

    return root;
  };

  CL.ColorPicker.K_TINTS = K_TINTS;
  CL.ColorPicker.K_PACK = K_PACK;
})(window.CL);
