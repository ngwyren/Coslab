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
    { code: 'Clear', name: 'Transparent', screen: '#fbfaf7', group: 'pack', special: true, material: true },
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

  // Wider range behind the colour dragger (not shown as chips). Screen values are
  // approximate and, like the list above, must be checked against a physical guide.
  [
    ['Yellow C', '#fedd00'], ['100 C', '#f6eb61'], ['102 C', '#fce300'], ['109 C', '#ffd100'], ['116 C', '#ffcd00'],
    ['123 C', '#ffc72c'], ['1235 C', '#ffb81c'], ['130 C', '#f2a900'], ['137 C', '#ffa300'], ['151 C', '#ff8200'],
    ['1505 C', '#ff6900'], ['Orange 021 C', '#fe5000'], ['1585 C', '#ff6a13'], ['158 C', '#e87722'], ['165 C', '#ff671f'],
    ['1655 C', '#fc4c02'], ['172 C', '#fa4616'], ['Warm Red C', '#f9423a'], ['1788 C', '#ee2737'], ['485 C', '#da291c'],
    ['Red 032 C', '#ef3340'], ['185 C', '#e4002b'], ['192 C', '#e40046'], ['199 C', '#d50032'], ['200 C', '#ba0c2f'],
    ['201 C', '#9d2235'], ['202 C', '#862633'], ['188 C', '#76232f'], ['1815 C', '#7c2529'], ['Rubine Red C', '#ce0058'],
    ['206 C', '#ce0037'], ['207 C', '#a50034'], ['208 C', '#861f41'], ['209 C', '#6f263d'], ['213 C', '#e31c79'],
    ['219 C', '#da1884'], ['222 C', '#6c1d45'], ['229 C', '#672146'], ['235 C', '#840b55'], ['Rhodamine Red C', '#e10098'],
    ['225 C', '#df1995'], ['210 C', '#f99fc9'], ['189 C', '#f8a3bc'], ['196 C', '#ecc7cd'], ['182 C', '#fabbcb'],
    ['1767 C', '#fcafc0'], ['176 C', '#ffb1bb'], ['177 C', '#ff808b'], ['178 C', '#ff585d'], ['1775 C', '#ff8da1'],
    ['700 C', '#f2acb9'], ['701 C', '#e68699'], ['702 C', '#d25b73'], ['703 C', '#b83a4b'], ['704 C', '#9e2a2f'],
    ['705 C', '#f5dadf'], ['488 C', '#ecbaa8'], ['487 C', '#eaa794'], ['486 C', '#e8927c'], ['162 C', '#ffbe9f'],
    ['163 C', '#ff9d6e'], ['1555 C', '#ffb990'], ['170 C', '#ff8674'], ['169 C', '#ffb3ab'], ['Purple C', '#bb29bb'],
    ['Violet C', '#440099'], ['2587 C', '#8246af'], ['2577 C', '#a77bca'], ['263 C', '#d7c6e6'], ['264 C', '#c1a7e2'],
    ['265 C', '#9063cd'], ['266 C', '#753bbd'], ['2685 C', '#330072'], ['511 C', '#612c51'], ['512 C', '#833177'],
    ['513 C', '#93328e'], ['514 C', '#d48bc8'], ['518 C', '#4b3048'], ['519 C', '#59315f'], ['520 C', '#642f6c'],
    ['521 C', '#a57fb2'], ['Reflex Blue C', '#001489'], ['Blue 072 C', '#10069f'], ['286 C', '#0033a0'], ['300 C', '#005eb8'],
    ['Process Blue C', '#0085ca'], ['299 C', '#00a3e0'], ['2985 C', '#5bc2e7'], ['290 C', '#b9d9eb'], ['277 C', '#abcae9'],
    ['278 C', '#8bb8e8'], ['279 C', '#418fde'], ['280 C', '#012169'], ['282 C', '#041e42'], ['289 C', '#0c2340'],
    ['295 C', '#002855'], ['312 C', '#00a9ce'], ['319 C', '#2cccd3'], ['324 C', '#9cdbd9'], ['3252 C', '#2ad2c9'],
    ['Green C', '#00ab84'], ['3405 C', '#00af66'], ['347 C', '#009a44'], ['348 C', '#00843d'], ['349 C', '#046a38'],
    ['350 C', '#2c5234'], ['354 C', '#00b140'], ['361 C', '#43b02a'], ['368 C', '#78be20'], ['375 C', '#97d700'],
    ['372 C', '#d4eb8e'], ['351 C', '#a2e4b8'], ['344 C', '#a0dab3'], ['364 C', '#4a7729'], ['371 C', '#546223'],
    ['5625 C', '#708573'], ['5635 C', '#94a596'], ['452 C', '#b0aa7e'], ['451 C', '#9b945f'], ['465 C', '#b9975b'],
    ['466 C', '#c6aa76'], ['467 C', '#d3bc8d'], ['468 C', '#ddcba4'], ['4645 C', '#b58150'], ['4655 C', '#bf9474'],
    ['4665 C', '#cda788'], ['4675 C', '#dcbfa6'], ['4695 C', '#5b3427'], ['469 C', '#693f23'], ['476 C', '#4e3629'],
    ['477 C', '#623b2a'], ['478 C', '#703f2a'], ['7529 C', '#b7a99a'], ['7530 C', '#a39382'], ['7531 C', '#7a6855'],
    ['7532 C', '#63513d'], ['7533 C', '#473729'], ['Warm Gray 1 C', '#d7d2cb'], ['Warm Gray 3 C', '#bfb8af'], ['Warm Gray 5 C', '#aca39a'],
    ['Warm Gray 7 C', '#968c83'], ['Warm Gray 9 C', '#83786f'], ['Warm Gray 11 C', '#6e6259'], ['Cool Gray 3 C', '#c8c9c7'], ['Cool Gray 5 C', '#b1b3b3'],
    ['Cool Gray 7 C', '#97999b'], ['Cool Gray 9 C', '#75787b'], ['Black C', '#2d2926'], ['7547 C', '#131e29'], ['432 C', '#333f48'],
    ['433 C', '#1d252d'], ['424 C', '#707372'], ['428 C', '#c1c6c8'], ['427 C', '#d0d3d4'], ['7499 C', '#f1e6b2'],
    ['7500 C', '#dfd1a7'], ['7501 C', '#d9c89e'], ['7502 C', '#ceb888'], ['7411 C', '#e6a65d'], ['7415 C', '#e6baa8'],
    ['7417 C', '#e04e39'], ['7419 C', '#b04a5a'], ['7420 C', '#9b2242'], ['7421 C', '#651d32'], ['7423 C', '#e0628a'],
    ['7425 C', '#b52555'], ['7426 C', '#a4123f'], ['7428 C', '#6a2c3e'], ['7432 C', '#b55c80'],
    ['646 C', '#5e8ab4'], ['647 C', '#236192'], ['648 C', '#002e5d'], ['5415 C', '#5b7f95'], ['5425 C', '#7a99ac'],
    ['5435 C', '#a6bbc8'], ['5445 C', '#b7c9d3'], ['5405 C', '#4f758b'], ['7544 C', '#768692'], ['7545 C', '#425563'],
    ['7546 C', '#253746'], ['7543 C', '#98a4ae'], ['7542 C', '#a4bcc2'], ['5477 C', '#3e5d58'], ['5487 C', '#5d7975'],
    ['7539 C', '#8e9089'], ['7538 C', '#949a90'], ['5285 C', '#8d89a5'], ['5275 C', '#595478'], ['5265 C', '#403a60'],
    ['5295 C', '#b3b0c4'], ['5145 C', '#9b7793'], ['5155 C', '#bea1b1'], ['5205 C', '#86647a'], ['5215 C', '#af95a3'],
    ['5225 C', '#c7b2be'], ['5235 C', '#d0bec8'], ['4975 C', '#3f2021'], ['437 C', '#7b6469'], ['436 C', '#ab989d'],
    ['435 C', '#c1b2b6'], ['438 C', '#584446'], ['439 C', '#453536'], ['7633 C', '#c4a4a7'], ['7635 C', '#c63663'],
    ['7636 C', '#bc204b'], ['7523 C', '#ab5c57'], ['7522 C', '#b46a55'], ['7524 C', '#a4493d'], ['7525 C', '#9a6a4f'],
    ['7526 C', '#8a391b'], ['7515 C', '#c58b68'], ['7520 C', '#eabeb0'], ['7519 C', '#5e4b3c'], ['7518 C', '#6d4f47'],
    ['7517 C', '#85431e'], ['7606 C', '#d6938a'], ['7607 C', '#c26e60'], ['7608 C', '#a4343a'], ['7609 C', '#823b34'],
    ['7618 C', '#c66e4e'], ['7619 C', '#c04c36'], ['7620 C', '#b7312c'], ['7621 C', '#ab2328'], ['7623 C', '#8a2a2b'],
    ['7624 C', '#802f2d'], ['7626 C', '#c63527'], ['7627 C', '#a72b2a'], ['7628 C', '#9e2a2b'], ['7629 C', '#6d3332'],
    ['7647 C', '#a83d72'], ['7648 C', '#991e66'], ['5555 C', '#638c80'], ['5565 C', '#86a69d'], ['5575 C', '#92aca0'],
    ['556 C', '#6fa287'], ['557 C', '#85b09a'], ['558 C', '#9abeaa'], ['7494 C', '#9caf88'], ['7495 C', '#8f993e'],
    ['7493 C', '#bbc592'], ['7492 C', '#bfcc80'], ['5777 C', '#a2a569'], ['7407 C', '#cba052'], ['7409 C', '#f0b323'],
    ['7403 C', '#eed484'], ['7404 C', '#f4da40'], ['7402 C', '#ecd898'],
  ].forEach(([code, screen]) => LIST.push({ code, name: '', screen, group: 'more' }));

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

  /* CIE Lab: distances close to what the eye sees */
  function lab(hex) {
    const { r, g, b } = CL.color.hexToRgb(hex);
    const [R, G, B] = [r, g, b].map((v) => { v /= 255; return v > 0.04045 ? ((v + 0.055) / 1.055) ** 2.4 : v / 12.92; });
    const f = (v) => (v > 0.008856 ? Math.cbrt(v) : 7.787 * v + 16 / 116);
    const x = f((0.4124 * R + 0.3576 * G + 0.1805 * B) / 0.95047);
    const y = f(0.2126 * R + 0.7152 * G + 0.0722 * B);
    const z = f((0.0193 * R + 0.1192 * G + 0.9505 * B) / 1.08883);
    return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
  }
  const labOf = new Map();

  /** The `n` Pantone entries closest to a dragged colour (no metallics, no clear plastic). */
  function closest(hex, n = 5, opts = {}) {
    const T = lab(hex);
    return LIST
      .filter((p) => !/metallic/i.test(p.name) && p.code !== 'Clear' && !(p.special && (p.material ? opts.ink : !opts.ink)))
      .map((p) => {
        if (!labOf.has(p.code)) labOf.set(p.code, lab(p.screen));
        const L = labOf.get(p.code);
        return [Math.hypot(T[0] - L[0], T[1] - L[1], T[2] - L[2]), p];
      })
      .sort((a, b) => a[0] - b[0])
      .slice(0, n)
      .map(([, p]) => p);
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
  // On screen just the code ("7416 C"); `full` adds the word PANTONE for documents sent to the factory
  const label = (p, full = false) => (!p ? '—' : p.material ? p.name : p.special ? `${p.code} (ink)` : full ? `PANTONE ${p.code}` : p.code);

  /** Human label for a part fill, e.g. "PANTONE 4995 C" or "PANTONE 7416 C → PANTONE 186 C". */
  function describeFill(fill, full = false) {
    if (!fill) return '—';
    if (fill.type === 'linear' && fill.stops) return [...new Set(fill.stops.map((s) => label(of({ color: s.c, pantone: s.pantone }), full)))].join(' → ');
    return label(of(fill), full);
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
      // the lip colour inside a clear body is a Pantone too
      if (part && part.product && !byCode.has(part.product.pantone)) {
        const p = nearest(part.product.color || '#c8102e');
        part.product = { color: p.screen, pantone: p.code };
      }
      const f = part && part.fill;
      if (!f) return;
      if (f.type === 'linear' && f.stops) {
        f.stops.forEach((s) => { const p = byCode.get(s.pantone) || nearest(s.c); s.c = p.screen; s.pantone = p.code; });
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

  // i18n key for a part surface type (solid when unset)
  const SURFACE_KEYS = { clear: "surface.clear", shimmer: "surface.shimmer", solid: "surface.solid", "solid-gradient": "surface.solidGradient", "clear-gradient": "surface.clearGradient" };
  const oneColour = (f) => !!(f && f.stops && f.stops.every((s) => s.c === f.stops[0].c));
  const surfaceKey = (part) => part && part.surface === 'clear-gradient' && oneColour(part.fill) ? 'surface.clearSolid' : SURFACE_KEYS[(part && part.surface) || "solid"] || "surface.solid";

  CL.pantone = { LIST, byCode, nearest, closest, of, label, describeFill, fillFor, normalizeDesign, surfaceKey };
})(window.CL);
