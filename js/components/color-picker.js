/* ==========================================================
   COSLAB — Luxury Atelier Color Picker (Compact & Minimalist)
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
    let activeView = compact ? 'spectrum' : 'tints'; // 'tints' | 'pack' | 'spectrum'

    const root = CL.h('div.cp' + (compact ? '.cp-compact' : ''));

    // 1 Single Compact Category Bar (3 tabs: MLBB Tint, Packaging, Spectrum)
    let navBar = null;
    if (!compact && showSwatches) {
      navBar = CL.h('div.cp-nav-bar', null,
        CL.h('button.cp-nav-btn' + (activeView === 'tints' ? '.is-active' : ''), {
          type: 'button',
          text: 'MLBB Tint',
          onclick: () => setView('tints'),
        }),
        CL.h('button.cp-nav-btn' + (activeView === 'pack' ? '.is-active' : ''), {
          type: 'button',
          text: 'Packaging',
          onclick: () => setView('pack'),
        }),
        CL.h('button.cp-nav-btn' + (activeView === 'spectrum' ? '.is-active' : ''), {
          type: 'button',
          text: 'Spectrum',
          onclick: () => setView('spectrum'),
        })
      );
      root.appendChild(navBar);
    }

    // Swatches Container (for 'tints' and 'pack')
    const swatchesContainer = CL.h('div.cp-swatches-view', {
      style: { display: activeView !== 'spectrum' ? 'block' : 'none' }
    });
    const swatchesGrid = CL.h('div.cp-cosmetic-grid');
    swatchesContainer.appendChild(swatchesGrid);
    root.appendChild(swatchesContainer);

    // Spectrum Container (for 'spectrum')
    const spectrumContainer = CL.h('div.cp-spectrum-view', {
      style: { display: activeView === 'spectrum' ? 'grid' : 'none' }
    });
    const sv = CL.h('div.cp-sv', null, CL.h('div.cp-sv-knob'));
    const hue = CL.h('div.cp-hue', null, CL.h('div.cp-hue-knob'));
    spectrumContainer.append(sv, hue);
    root.appendChild(spectrumContainer);

    // Bottom Bar (Swatch + HEX + Eyedropper)
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
      title: 'Pick Color'
    });
    if (!('EyeDropper' in window)) dropBtn.disabled = true;

    const bottomRow = CL.h('div.cp-bottom-bar', null,
      preview,
      hexIn,
      dropBtn
    );
    root.appendChild(bottomRow);

    function setView(v) {
      activeView = v;
      if (navBar) {
        navBar.querySelectorAll('.cp-nav-btn').forEach((b, i) => {
          b.classList.toggle('is-active', (i === 0 && v === 'tints') || (i === 1 && v === 'pack') || (i === 2 && v === 'spectrum'));
        });
      }
      swatchesContainer.style.display = v !== 'spectrum' ? 'block' : 'none';
      spectrumContainer.style.display = v === 'spectrum' ? 'grid' : 'none';
      if (v !== 'spectrum') renderSwatches();
    }

    function renderSwatches() {
      swatchesGrid.innerHTML = '';
      const list = activeView === 'pack' ? K_PACK : K_TINTS;
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
      if (final) pushRecent(hex);
      else commitT = setTimeout(() => pushRecent(hex), 1200);
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
