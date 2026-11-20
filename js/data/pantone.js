/* ==========================================================
   COSLAB — Curated Pantone palette
   Customers pick colours by Pantone code (no free HEX input).
   `screen` values are approximate sRGB previews only — they MUST be
   checked against a physical PANTONE Formula Guide before use, and
   final colours are approved on a physical swatch / mockup.
   ========================================================== */
(function (CL) {
  const LIST = [
    // Print ink (not a Pantone C code) — used for text / logo printing only
    { code: 'Opaque White', name: 'Opaque white ink', screen: '#ffffff', group: 'ink', special: true },
    // Lip tint reds & roses
    { code: '186 C', name: 'Classic Red', screen: '#c8102e', group: 'tint' },
    { code: '1945 C', name: 'Cherry', screen: '#a6192e', group: 'tint' },
    { code: '7622 C', name: 'Brick', screen: '#93272c', group: 'tint' },
    { code: '7427 C', name: 'Berry', screen: '#97233f', group: 'tint' },
    { code: '7418 C', name: 'Rosé', screen: '#cd545b', group: 'tint' },
    { code: '7416 C', name: 'Coral', screen: '#e5554f', group: 'tint' },
    { code: '7625 C', name: 'Chili', screen: '#e1523d', group: 'tint' },
    { code: '4995 C', name: 'Dusty Rose', screen: '#a56e75', group: 'tint' },
    { code: '7430 C', name: 'Petal', screen: '#eab8c3', group: 'tint' },
    { code: '4985 C', name: 'Fig', screen: '#844551', group: 'tint' },
    { code: '5125 C', name: 'Plum', screen: '#6a4c6b', group: 'tint' },
    // Packaging materials (not Pantone inks): clear acrylic and plain white plastic
    { code: 'Clear', name: 'Clear acrylic', screen: '#fbfaf7', group: 'pack', special: true, material: true },
    { code: 'White', name: 'Solid white', screen: '#f4f2ec', group: 'pack', special: true, material: true },
    // Packaging neutrals
    { code: '4685 C', name: 'Nude', screen: '#e0c6ad', group: 'pack' },
    { code: '7521 C', name: 'Cinnamon', screen: '#c09c83', group: 'pack' },
    { code: '7506 C', name: 'Cream', screen: '#efdbb2', group: 'pack' },
    { code: '7527 C', name: 'Ivory', screen: '#d6d2c4', group: 'pack' },
    { code: '7541 C', name: 'Porcelain', screen: '#d9e1e2', group: 'pack' },
    { code: 'Cool Gray 1 C', name: 'Mist', screen: '#d9d9d6', group: 'pack' },
    { code: 'Cool Gray 11 C', name: 'Graphite', screen: '#53565a', group: 'pack' },
    { code: 'Black 6 C', name: 'Noir', screen: '#101820', group: 'pack' },
    { code: '871 C', name: 'Gold (metallic)', screen: '#84754e', group: 'pack' },
    { code: '877 C', name: 'Silver (metallic)', screen: '#8a8d8f', group: 'pack' },
  ];

  const byCode = new Map(LIST.map((p) => [p.code, p]));

  function dist(a, b) {
    const A = CL.color.hexToRgb(a), B = CL.color.hexToRgb(b);
    // weighted RGB distance — good enough to snap legacy colours to the palette
    const rm = (A.r + B.r) / 2;
    const dr = A.r - B.r, dg = A.g - B.g, db = A.b - B.b;
    return Math.sqrt((2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db);
  }

  /**
   * Closest palette entry to any colour (used for templates / older designs).
   * Packaging fills may snap to materials (clear / white) but never to print ink;
   * print colours (opts.ink: text / logo) may snap to ink but never to a material.
   */
  function nearest(hex, opts = {}) {
    let best = null, bd = Infinity;
    for (const p of LIST) {
      if (p.special && (p.material ? opts.ink : !opts.ink)) continue;
      const d = dist(hex, p.screen);
      if (d < bd) { bd = d; best = p; }
    }
    return best;
  }

  /** Pantone entry for a stored colour: exact code when saved with one, else nearest. */
  function of(colorOrFill, opts) {
    if (!colorOrFill) return null;
    if (typeof colorOrFill === 'object') {
      if (colorOrFill.pantone && byCode.has(colorOrFill.pantone)) return byCode.get(colorOrFill.pantone);
      return nearest(colorOrFill.color || (colorOrFill.stops && colorOrFill.stops[0] && colorOrFill.stops[0].c) || '#000000', opts);
    }
    return nearest(colorOrFill, opts);
  }

  // Materials read as their name ("Clear acrylic"), inks as "Opaque White (ink)", the rest as Pantone codes
  const label = (p) => (!p ? '—' : p.material ? p.name : p.special ? `${p.code} (ink)` : `PANTONE ${p.code}`);

  /** Human label for a part fill, e.g. "PANTONE 4995 C" or "PANTONE 7416 C → PANTONE 186 C". */
  function describeFill(fill) {
    if (!fill) return '—';
    if (fill.type === 'linear' && fill.stops) return fill.stops.map((s) => label(nearest(s.c))).join(' → ');
    return label(of(fill));
  }

  /** A solid fill object for a palette entry. */
  const fillFor = (p) => ({ type: 'solid', color: p.screen, pantone: p.code });

  /**
   * Snap every printable colour of a design to the palette (in place), so what is
   * drawn on screen always matches the Pantone code shown. Logo images are untouched.
   */
  function normalizeDesign(d) {
    if (!d) return d;
    Object.values(d.parts || {}).forEach((part) => {
      const f = part && part.fill;
      if (!f) return;
      if (f.type === 'linear' && f.stops) {
        f.stops.forEach((s) => { const p = nearest(s.c); s.c = p.screen; s.pantone = p.code; });
      } else if (!f.pantone || !byCode.has(f.pantone)) {
        Object.assign(part, { fill: fillFor(nearest(f.color || '#b85c66')) });
      }
    });
    (d.layers || []).forEach((l) => {
      if (l.type === 'text' && l.text && (!l.text.pantone || !byCode.has(l.text.pantone))) {
        const p = nearest(l.text.color || '#ffffff', { ink: true });
        l.text.color = p.screen;
        l.text.pantone = p.code;
      }
      if (l.type === 'shape' && l.shape) {
        ['fill', 'stroke'].forEach((k) => {
          const c = l.shape[k];
          if (c && c !== 'none') l.shape[k] = nearest(c, { ink: true }).screen;
        });
      }
    });
    return d;
  }

  CL.pantone = { LIST, byCode, nearest, of, label, describeFill, fillFor, normalizeDesign };
})(window.CL);
