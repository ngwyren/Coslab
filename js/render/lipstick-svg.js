/* ==========================================================
   COSLAB — Liptint SVG Renderer (Real container outlines + Safe Zone)
   Up Liptint (Cap) on top, Button Liptint (Base) at bottom.
   Zero protruding ring/lines; strict Safe Zone clipping & auto-fit text.
   ========================================================== */
(function (CL) {
  const FONT_FALLBACK = "'Noto Sans KR','Noto Serif KR','Noto Sans SC','Noto Sans JP','Noto Naskh Arabic',sans-serif";

  // Soft form shading across the tube, left to right: [offset, opacity]. No light streaks:
  // only a deep tone of the part's own colour (see shadeTone) towards both edges.
  const SHADES = {
    round: {
      matte: [[0, .32], [.12, .15], [.3, .03], [.46, 0], [.64, .03], [.86, .16], [1, .36]],
      satin: [[0, .32], [.12, .14], [.28, .03], [.44, 0], [.64, .03], [.86, .16], [1, .36]],
      gloss: [[0, .32], [.1, .14], [.26, .03], [.44, 0], [.66, .03], [.88, .16], [1, .36]],
      metallic: [[0, .46], [.14, .18], [.32, .03], [.46, 0], [.64, .06], [.86, .24], [1, .5]],
    },
    square: {
      matte: [[0, .18], [.05, .05], [.2, 0], [.75, .02], [.95, .08], [1, .22]],
      satin: [[0, .18], [.05, .05], [.2, 0], [.75, .02], [.95, .08], [1, .22]],
      gloss: [[0, .18], [.05, .05], [.2, 0], [.75, .02], [.95, .08], [1, .22]],
      metallic: [[0, .3], [.06, .1], [.3, 0], [.7, .05], [.94, .14], [1, .32]],
    },
  };

  function gradStops(stops, tone) {
    return stops.map(([o, a]) => `<stop offset="${o}" stop-color="${tone}" stop-opacity="${a}"/>`).join('');
  }

  /** Deep tone of a part's colour for its shadows. */
  function shadeTone(part) {
    const [a, b] = fillColors(part && part.fill);
    const c = CL.color.mix(a, b, 0.5);
    return CL.color.luminance(c) > 0.8 ? CL.color.mix(c, '#4d4852', 0.85) : CL.color.mix(c, '#1a0a10', 0.62);
  }

  function angleToVector(angle) {
    const a = (angle * Math.PI) / 180;
    const dx = Math.sin(a), dy = -Math.cos(a);
    return {
      x1: CL.round(.5 - dx / 2, 4),
      y1: CL.round(.5 - dy / 2, 4),
      x2: CL.round(.5 + dx / 2, 4),
      y2: CL.round(.5 + dy / 2, 4),
    };
  }

  function fillPaint(fill, id) {
    if (!fill || fill.type === 'solid') return { def: '', paint: (fill && fill.color) || '#f0ede6' };
    const v = angleToVector(fill.angle ?? 180);
    const stops = (fill.stops || []).map((s) => `<stop offset="${s.o}" stop-color="${s.c}"/>`).join('');
    return {
      def: `<linearGradient id="${id}" x1="${v.x1}" y1="${v.y1}" x2="${v.x2}" y2="${v.y2}">${stops}</linearGradient>`,
      paint: `url(#${id})`,
    };
  }

  /* Outline of one part: real container profile (rect.d, see models.js) */
  function partShape(r, paint, extra = '') {
    return `<path d="${r.d}" fill="${paint}"${extra}/>`;
  }

  /* Shape markup */
  function shapeMarkup(s) {
    const w = s.w, h = s.h;
    const fill = s.fill && s.fill !== 'none' ? s.fill : 'none';
    const stroke = s.stroke ? ` stroke="${s.stroke}" stroke-width="${s.strokeWidth || 1}" vector-effect="non-scaling-stroke"` : '';
    const P = (pts) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${CL.round(x * w, 2)} ${CL.round(y * h, 2)}`).join(' ') + ' Z';
    switch (s.kind) {
      case 'circle': return `<ellipse cx="0" cy="0" rx="${w / 2}" ry="${h / 2}" fill="${fill}"${stroke}/>`;
      case 'line': return `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" fill="${fill === 'none' ? '#171615' : fill}"/>`;
      case 'diamond': return `<path d="${P([[0, -.5], [.5, 0], [0, .5], [-.5, 0]])}" fill="${fill}"${stroke}/>`;
      case 'star': {
        const pts = [];
        for (let i = 0; i < 10; i++) {
          const r = i % 2 ? .22 : .5;
          const a = -Math.PI / 2 + (i * Math.PI) / 5;
          pts.push([Math.cos(a) * r, Math.sin(a) * r + .03]);
        }
        return `<path d="${P(pts)}" fill="${fill}"${stroke}/>`;
      }
      case 'heart': {
        const X = (v) => CL.round(v * w, 2), Y = (v) => CL.round(v * h, 2);
        return `<path d="M${X(0)} ${Y(.5)} C${X(-.12)} ${Y(.38)} ${X(-.5)} ${Y(.12)} ${X(-.5)} ${Y(-.18)} C${X(-.5)} ${Y(-.42)} ${X(-.3)} ${Y(-.5)} ${X(-.2)} ${Y(-.5)} C${X(-.08)} ${Y(-.5)} ${X(0)} ${Y(-.42)} ${X(0)} ${Y(-.3)} C${X(0)} ${Y(-.42)} ${X(0.08)} ${Y(-.5)} ${X(.2)} ${Y(-.5)} C${X(.3)} ${Y(-.5)} ${X(.5)} ${Y(-.42)} ${X(.5)} ${Y(-.18)} C${X(.5)} ${Y(.12)} ${X(.12)} ${Y(.38)} ${X(0)} ${Y(.5)} Z" fill="${fill}"${stroke}/>`;
      }
      case 'rect':
      default: return `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${s.radius || 0}" fill="${fill}"${stroke}/>`;
    }
  }

  /* Auto-fit text inside Safe Zone smoothly for any rotation angle */
  function textMarkup(tx, rect, rotation = 0) {
    const lines = String(tx.content || '').split('\n');
    const maxChars = Math.max(1, ...lines.map((l) => l.length));
    const safe = rect && rect.safe ? rect.safe : { w: (rect?.w || 110) * 0.72, h: (rect?.h || 220) * 0.74 };
    const rad = ((rotation || 0) * Math.PI) / 180;
    const cosA = Math.abs(Math.cos(rad));
    const sinA = Math.abs(Math.sin(rad));
    const chord = Math.min(cosA > 0.001 ? safe.w / cosA : Infinity, sinA > 0.001 ? safe.h / sinA : Infinity);
    const maxSpan = Math.max(24, chord - 6);

    let size = tx.size || 13;
    let spacing = tx.spacing || 0;
    const estWidth = maxChars * (size * 0.62) + Math.max(0, maxChars - 1) * spacing;
    if (estWidth > maxSpan && estWidth > 0) {
      const ratio = maxSpan / estWidth;
      size = Math.max(7, CL.round(size * ratio, 1));
      spacing = CL.round(spacing * ratio, 1);
    }

    const lh = (tx.lineHeight || 1.2) * size;
    const y0 = -((lines.length - 1) * lh) / 2;
    const anchor = tx.align === 'left' ? 'start' : tx.align === 'right' ? 'end' : 'middle';
    const fam = `'${tx.font}',${FONT_FALLBACK}`;
    const spans = lines.map((ln, i) => `<tspan x="0" y="${CL.round(y0 + i * lh, 2)}">${CL.esc(ln) || ' '}</tspan>`).join('');
    return `<text text-anchor="${anchor}" dominant-baseline="central" font-family="${fam}" font-size="${size}" font-weight="${tx.weight || 400}" font-style="${tx.italic ? 'italic' : 'normal'}" letter-spacing="${spacing}" fill="${tx.color || '#171615'}" xml:space="preserve">${spans}</text>`;
  }

  /* Clamp layer center inside Safe Zone */
  function layerCenter(layer, rect) {
    const safe = rect.safe || { minX: 0.16, maxX: 0.84, minY: 0.14, maxY: 0.86 };
    const cx = CL.clamp(layer.x ?? 0.5, safe.minX, safe.maxX);
    const cy = CL.clamp(layer.y ?? 0.5, safe.minY, safe.maxY);
    return { x: rect.x + cx * rect.w, y: rect.y + cy * rect.h };
  }

  function layerTransform(layer, rect) {
    const c = layerCenter(layer, rect);
    const sx = layer.flipX ? -1 : 1, sy = layer.flipY ? -1 : 1;
    return `translate(${CL.round(c.x, 3)} ${CL.round(c.y, 3)}) rotate(${CL.round(layer.rotation || 0, 3)})${sx < 0 || sy < 0 ? ` scale(${sx} ${sy})` : ''}`;
  }

  function layerMarkup(layer, rect, interactive) {
    if (!layer.visible) return '';
    let inner = '';
    if (layer.type === 'text') inner = textMarkup(layer.text, rect, layer.rotation);
    else if (layer.type === 'image') {
      const im = layer.image;
      const safe = rect.safe || { w: rect.w * 0.7, h: rect.h * 0.7 };
      const maxW = safe.w - 4, maxH = safe.h - 4;
      const scale = Math.min(1, maxW / (im.w || 40), maxH / (im.h || 40));
      const w = CL.round(im.w * scale, 1), h = CL.round(im.h * scale, 1);
      inner = `<image href="${im.src}" xlink:href="${im.src}" x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet"/>`;
    } else if (layer.type === 'shape') {
      inner = shapeMarkup(layer.shape);
    }
    const data = interactive ? ` data-layer="${layer.id}" class="cl-layer${layer.locked ? ' is-locked' : ''}"` : '';
    return `<g transform="${layerTransform(layer, rect)}" opacity="${layer.opacity ?? 1}"${data}>${inner}</g>`;
  }

  /* ---------- Surface types ----------
     solid          plain opaque colour (default)
     solid-gradient opaque 2-colour gradient
     clear          clear shell, coloured tint visible inside
     clear-gradient colour fading into a clear shell
     shimmer        colour with layered glitter inside            */
  const SURFACES = ['clear', 'shimmer', 'solid', 'solid-gradient', 'clear-gradient'];

  function fillColors(fill) {
    if (!fill) return ['#b85c66', '#b85c66'];
    if (fill.type === 'linear' && fill.stops && fill.stops.length) {
      return [fill.stops[0].c, fill.stops[fill.stops.length - 1].c];
    }
    return [fill.color || '#b85c66', fill.color || '#b85c66'];
  }

  // small deterministic PRNG so glitter stays put between renders
  function seeded(seedStr) {
    let h = 2166136261;
    for (let i = 0; i < seedStr.length; i++) { h ^= seedStr.charCodeAt(i); h = Math.imul(h, 16777619); }
    return () => { h += 0x6d2b79f5; let t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }

  function glitter(rect, color, seedKey) {
    const rnd = seeded(`${seedKey}|${color}|${rect.w}x${rect.h}`);
    const area = rect.w * rect.h;
    const px = () => CL.round(rect.x + 3 + rnd() * (rect.w - 6), 2);
    const py = () => CL.round(rect.y + 3 + rnd() * (rect.h - 6), 2);
    const light = CL.color.mix(color, '#ffffff', 0.65);
    let m = '';
    // deep layer: fine, faint specks
    for (let i = 0; i < area / 55; i++) m += `<circle cx="${px()}" cy="${py()}" r="${CL.round(0.35 + rnd() * 0.45, 2)}" fill="#ffffff" opacity="${CL.round(0.25 + rnd() * 0.35, 2)}"/>`;
    // mid layer: tinted flakes
    for (let i = 0; i < area / 160; i++) m += `<circle cx="${px()}" cy="${py()}" r="${CL.round(0.7 + rnd() * 0.9, 2)}" fill="${light}" opacity="${CL.round(0.35 + rnd() * 0.4, 2)}"/>`;
    // top layer: four-point sparkles
    for (let i = 0; i < area / 900; i++) {
      const x = px(), y = py(), s = CL.round(1.6 + rnd() * 2.2, 2);
      m += `<path d="M${x} ${y - s} L${x + s * 0.22} ${y - s * 0.22} L${x + s} ${y} L${x + s * 0.22} ${y + s * 0.22} L${x} ${y + s} L${x - s * 0.22} ${y + s * 0.22} L${x - s} ${y} L${x - s * 0.22} ${y - s * 0.22} Z" fill="#ffffff" opacity="${CL.round(0.7 + rnd() * 0.3, 2)}"/>`;
    }
    return m;
  }

  /**
   * Markup + defs for one part's body according to its surface type.
   * `shape(rect, paint, extra)` draws the outline (cap/base path, or a plain rect for print flats).
   */
  function surfaceBody(partData, rect, shape, id, isCap) {
    const p = partData || {};
    const surface = SURFACES.includes(p.surface) ? p.surface : 'solid';
    const [cA, cB] = fillColors(p.fill);
    const defs = [];
    let m = '';
    const vGrad = (gid, stops) => defs.push(`<linearGradient id="${gid}" x1="0" y1="1" x2="0" y2="0">${stops}</linearGradient>`);

    if (surface === 'clear') {
      // clear acrylic shell + the tint (or wand) visible inside
      m += shape(rect, '#ffffff', ' fill-opacity="0.42"');
      if (isCap) {
        const w = rect.w * 0.26;
        m += `<rect x="${CL.round(rect.x + (rect.w - w) / 2, 2)}" y="${CL.round(rect.y + rect.h * 0.14, 2)}" width="${CL.round(w, 2)}" height="${CL.round(rect.h * 0.86, 2)}" rx="${CL.round(w / 2, 2)}" fill="${cA}" opacity="0.9"/>`;
      } else {
        const ix = 10, iy = 12;
        m += `<rect x="${rect.x + ix}" y="${rect.y + iy}" width="${rect.w - ix * 2}" height="${rect.h - iy * 2}" rx="${Math.max((rect.r || 8) - 4, 3)}" fill="${cA}" opacity="0.92"/>`;
      }
      m += shape(rect, 'none', ' stroke="#ffffff" stroke-opacity="0.8" stroke-width="2.5"');
    } else if (surface === 'clear-gradient') {
      if ([cA, cB].every((c) => CL.pantone.nearest(c).code === 'Clear')) {
        // plain clear plastic: faint cool tint, so the inside stays visible
        vGrad(id, `<stop offset="0" stop-color="#cfd8e2" stop-opacity="0.30"/><stop offset="1" stop-color="#cfd8e2" stop-opacity="0.16"/>`);
        m += shape(rect, `url(#${id})`);
        m += shape(rect, 'none', ' stroke="#8d97a3" stroke-opacity="0.55" stroke-width="1.6"');
      } else {
        vGrad(id, `<stop offset="0" stop-color="${cA}" stop-opacity="0.95"/><stop offset="0.3" stop-color="${CL.color.mix(cA, cB, 0.25)}" stop-opacity="0.8"/><stop offset="0.6" stop-color="${CL.color.mix(cA, cB, 0.65)}" stop-opacity="0.5"/><stop offset="0.85" stop-color="${cB}" stop-opacity="0.26"/><stop offset="1" stop-color="${cB}" stop-opacity="0.18"/>`);
        m += shape(rect, '#ffffff', ' fill-opacity="0.4"');
        m += shape(rect, `url(#${id})`);
        m += shape(rect, 'none', ` stroke="${CL.color.mix(cA, '#ffffff', 0.35)}" stroke-opacity="0.45" stroke-width="1.4"`);
      }
    } else if (surface === 'solid-gradient') {
      vGrad(id, `<stop offset="0.04" stop-color="${cA}"/><stop offset="0.28" stop-color="${CL.color.mix(cA, cB, 0.18)}"/><stop offset="0.5" stop-color="${CL.color.mix(cA, cB, 0.5)}"/><stop offset="0.72" stop-color="${CL.color.mix(cA, cB, 0.82)}"/><stop offset="0.96" stop-color="${cB}"/>`);
      m += shape(rect, `url(#${id})`);
    } else if (surface === 'shimmer') {
      vGrad(id, `<stop offset="0" stop-color="${cA}"/><stop offset="1" stop-color="${CL.color.mix(cB, '#ffffff', 0.18)}"/>`);
      m += shape(rect, `url(#${id})`);
      m += glitter(rect, cA, id.replace(/^[^-]+-/, '') + (isCap ? 'cap' : 'base'));
    } else {
      const f = fillPaint(p.fill, id);
      if (f.def) defs.push(f.def);
      m += shape(rect, f.paint);
    }
    return { defs, markup: m };
  }

  function renderSVG(design, opts = {}) {
    const u = opts.uid || CL.uid('lt');
    const L = CL.models.layout(design.model);
    const sil = L.model.silhouette;
    const P = design.parts;
    const shading = opts.shading !== false;
    const inter = !!opts.interactive;
    const defs = [];

    const sCap = surfaceBody(P.cap, L.capShell, partShape, `${u}-f-cap`, true);
    const sBase = surfaceBody(P.base, L.baseShell, partShape, `${u}-f-base`, false);
    defs.push(...sCap.defs, ...sBase.defs);

    const shadeKey = sil === 'square' ? 'square' : 'round';
    const shadeCapId = `${u}-sh-cap`;
    const shadeBaseId = `${u}-sh-base`;

    defs.push(`<linearGradient id="${shadeCapId}" x1="0" y1="0" x2="1" y2="0">${gradStops((SHADES[shadeKey] || SHADES.round)[P.cap?.finish || 'gloss'], shadeTone(P.cap))}</linearGradient>`);
    defs.push(`<linearGradient id="${shadeBaseId}" x1="0" y1="0" x2="1" y2="0">${gradStops((SHADES[shadeKey] || SHADES.round)[P.base?.finish || 'matte'], shadeTone(P.base))}</linearGradient>`);

    const tCap = shadeTone(P.cap), tBase = shadeTone(P.base);
    defs.push(`<linearGradient id="${u}-v-top" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${tCap}" stop-opacity=".06"/><stop offset=".04" stop-color="${tCap}" stop-opacity="0"/><stop offset=".93" stop-color="${tCap}" stop-opacity="0"/><stop offset=".99" stop-color="${tCap}" stop-opacity=".16"/><stop offset="1" stop-color="${tCap}" stop-opacity=".3"/></linearGradient>`);
    defs.push(`<linearGradient id="${u}-v-bot" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${tBase}" stop-opacity=".18"/><stop offset=".07" stop-color="${tBase}" stop-opacity="0"/><stop offset=".92" stop-color="${tBase}" stop-opacity="0"/><stop offset="1" stop-color="${tBase}" stop-opacity=".2"/></linearGradient>`);

    defs.push(`<radialGradient id="${u}-shadow"><stop offset="0" stop-color="#141312" stop-opacity=".16"/><stop offset=".45" stop-color="#141312" stop-opacity=".06"/><stop offset="1" stop-color="#141312" stop-opacity="0"/></radialGradient>`);

    // Exact shape clip paths + Safe Zone clip paths
    defs.push(`<clipPath id="${u}-clip-cap">${partShape(L.capShell, '#000')}</clipPath>`);
    defs.push(`<clipPath id="${u}-clip-base">${partShape(L.baseShell, '#000')}</clipPath>`);
    defs.push(`<clipPath id="${u}-safe-cap"><rect x="${L.cap.safe.x}" y="${L.cap.safe.y}" width="${L.cap.safe.w}" height="${L.cap.safe.h}" rx="4"/></clipPath>`);
    defs.push(`<clipPath id="${u}-safe-base"><rect x="${L.base.safe.x}" y="${L.base.safe.y}" width="${L.base.safe.w}" height="${L.base.safe.h}" rx="4"/></clipPath>`);

    const layersOf = (part) => (design.layers || []).filter((l) => l.part === part).map((l) => layerMarkup(l, L[part], inter)).join('');

    let body = '';
    if (opts.background) {
      body += `<rect x="-1000" y="-1000" width="3000" height="3000" fill="${opts.background}"/>`;
    }

    if (opts.shadow !== false) {
      body += `<ellipse cx="${L.scene.cx}" cy="${L.scene.ground + 5}" rx="${L.base.w * 0.68}" ry="10" fill="url(#${u}-shadow)"/>`;
    }

    // Inside of clear parts: cavity + wand in the body, threaded neck + wand in the cap
    const isClear = (p) => p && (p.surface === 'clear' || p.surface === 'clear-gradient');
    const line = ` fill="#fff" fill-opacity=".28" stroke="#8d97a3" stroke-opacity=".38" stroke-width=".8"`;
    const W = L.wand, F = L.foot, n2 = (v) => CL.round(v, 2);
    const wandMarkup = `<rect x="${n2(W.x)}" y="${n2(W.y)}" width="${n2(W.w)}" height="${n2(W.h)}" rx="2" fill="#eef1f5" stroke="#8d97a3" stroke-opacity=".35" stroke-width=".7"/>`;
    const footMarkup = `<ellipse cx="${F.cx}" cy="${n2(F.cy)}" rx="${n2(F.rx)}" ry="${n2(F.ry)}" fill="#f6efe0" stroke="#b9ac92" stroke-opacity=".5" stroke-width=".7"/>`;
    const innerBase = isClear(P.base) ? `<path d="${L.cavityPath}"${line}/>${wandMarkup}${footMarkup}` : '';
    const neckFill = isClear(P.base) ? line : ` fill="${fillColors(P.base && P.base.fill)[1]}" fill-opacity=".45"`;
    const innerCap = isClear(P.cap) ? `${wandMarkup}<path d="${L.neckPath}"${neckFill}/>` : '';

    // 1. Base (Thân son)
    const baseAttr = inter ? ` data-part="base" class="cl-part"` : '';
    body += `<g${baseAttr} clip-path="url(#${u}-clip-base)">`;
    body += innerBase + sBase.markup;
    body += `</g>`;

    // Artwork on Base (Strictly inside Safe Zone)
    body += `<g clip-path="url(#${u}-safe-base)"${inter ? ' data-layers="base"' : ''}>${layersOf('base')}</g>`;

    if (shading) {
      body += `<g pointer-events="none" clip-path="url(#${u}-clip-base)">`;
      body += partShape(L.baseShell, `url(#${shadeBaseId})`);
      body += partShape(L.baseShell, `url(#${u}-v-bot)`);
      body += `</g>`;
    }

    // 2. Cap (Nắp son)
    const capAttr = inter ? ` data-part="cap" class="cl-part"` : '';
    body += `<g${capAttr} clip-path="url(#${u}-clip-cap)">`;
    body += innerCap + sCap.markup;
    body += `</g>`;

    // Artwork on Cap (Strictly inside Safe Zone)
    body += `<g clip-path="url(#${u}-safe-cap)"${inter ? ' data-layers="cap"' : ''}>${layersOf('cap')}</g>`;

    if (shading) {
      body += `<g pointer-events="none" clip-path="url(#${u}-clip-cap)">`;
      body += partShape(L.capShell, `url(#${shadeCapId})`);
      body += partShape(L.capShell, `url(#${u}-v-top)`);
      body += `</g>`;
    }

    // Optional Safe Zone visual guide frame when editing Text or Logo
    if (opts.showSafeZone) {
      const sf = opts.showSafeZone === 'cap' ? L.cap.safe : L.base.safe;
      body += `<rect x="${sf.x}" y="${sf.y}" width="${sf.w}" height="${sf.h}" rx="4" fill="none" stroke="rgba(255,255,255,0.65)" stroke-width="1" stroke-dasharray="4 3" pointer-events="none"/>`;
      body += `<rect x="${sf.x}" y="${sf.y}" width="${sf.w}" height="${sf.h}" rx="4" fill="none" stroke="rgba(0,0,0,0.35)" stroke-width="1" stroke-dasharray="4 3" stroke-dashoffset="3.5" pointer-events="none"/>`;
    }

    // Vector die-line: hairline outline paths of cap & base for AI / CAD (Settings → Vector Outline)
    if (opts.dieline) {
      const cut = ` stroke="#ec008c" stroke-width="0.5" vector-effect="non-scaling-stroke"`;
      body += `<g id="dieline" pointer-events="none">${partShape(L.capShell, 'none', cut)}${partShape(L.baseShell, 'none', cut)}</g>`;
    }

    const vb = opts.viewBox || `0 0 ${L.scene.w} ${L.scene.h}`;
    const size = (opts.width ? ` width="${opts.width}"` : '') + (opts.height ? ` height="${opts.height}"` : '');
    const style = opts.fontCSS ? `<style>${opts.fontCSS}</style>` : '';

    return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="${vb}"${size} preserveAspectRatio="${opts.preserveAspectRatio || 'xMidYMid meet'}">${style}<defs>${defs.join('')}</defs>${body}</svg>`;
  }

  function renderPartFlat(design, part, opts = {}) {
    const u = opts.uid || CL.uid('p');
    const L = CL.models.layout(design.model);
    const r = L[part]; // printable area only
    const flatRect = (rr, paint, extra = '') => `<rect x="${rr.x}" y="${rr.y}" width="${rr.w}" height="${rr.h}" fill="${paint}"${extra}/>`;
    const P = design.parts || {};
    const s = surfaceBody(P[part], r, flatRect, `${u}-f`, part === 'cap');
    const layers = (design.layers || []).filter((l) => l.part === part).map((l) => layerMarkup(l, r, false)).join('');
    const scale = opts.scale || 4;
    const style = opts.fontCSS ? `<style>${opts.fontCSS}</style>` : '';

    return {
      svg: `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="${r.x} ${r.y} ${r.w} ${r.h}" width="${r.w * scale}" height="${r.h * scale}">${style}<defs>${s.defs.join('')}</defs>${opts.layersOnly ? '' : s.markup}${layers}</svg>`,
      w: r.w * scale,
      h: r.h * scale,
      rect: r,
    };
  }

  /** renderSVG with a viewBox cropped tight around the tube (the scene itself has lots of empty space). */
  function renderTight(design, opts = {}) {
    const L = CL.models.layout(design.model);
    const padX = 34, padTop = 10, padBottom = 22;
    const S = L.capShell, B = L.baseShell;
    const x = B.x - padX;
    const y = S.y - padTop;
    const vw = B.w + padX * 2;
    const vh = (B.y + B.h) - S.y + padTop + padBottom;
    const w = opts.width || 160;
    return renderSVG(design, Object.assign({ shadow: true }, opts, {
      width: w,
      height: Math.round((w * vh) / vw),
      viewBox: `${x} ${y} ${vw} ${vh}`,
    }));
  }

  /** Very light background tint derived from a design's body colour. */
  function tintOf(design, amount = 0.9) {
    const f = design && design.parts && design.parts.base && design.parts.base.fill;
    const c = f ? (f.type === 'linear' ? (f.stops && f.stops[0] && f.stops[0].c) : f.color) : null;
    // Near-white bodies would vanish on a white page — fall back to a warm neutral.
    if (!c || CL.color.luminance(c) > 0.86) return '#f1eeea';
    return CL.color.mix(c, '#ffffff', amount);
  }

  CL.render = {
    renderSVG,
    renderTight,
    tintOf,
    renderPartFlat,
    layerMarkup,
    layerCenter,
    layerTransform,
    fillPaint,
    FONT_FALLBACK,
  };
})(window.CL);
