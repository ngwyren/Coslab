/* ==========================================================
   COSLAB — Liptint SVG Renderer (Clean 2-Part Tube + Safe Zone)
   Up Liptint (Cap) on top, Button Liptint (Base) at bottom.
   Zero protruding ring/lines; strict Safe Zone clipping & auto-fit text.
   ========================================================== */
(function (CL) {
  const FONT_FALLBACK = "'Noto Sans KR','Noto Serif KR','Noto Sans SC','Noto Sans JP','Noto Naskh Arabic',sans-serif";

  const SHADES = {
    round: {
      matte: [[0, '#000', .22], [.18, '#fff', .06], [.36, '#fff', .16], [.6, '#000', 0], [.88, '#000', .10], [1, '#000', .25]],
      satin: [[0, '#000', .26], [.16, '#fff', .08], [.34, '#fff', .30], [.48, '#fff', .04], [.82, '#000', .10], [1, '#000', .30]],
      gloss: [[0, '#000', .32], [.14, '#000', 0], [.26, '#fff', .62], [.33, '#fff', .14], [.6, '#fff', 0], [.86, '#000', .12], [.93, '#fff', .14], [1, '#000', .36]],
      metallic: [[0, '#000', .42], [.12, '#fff', .58], [.24, '#000', .1], [.38, '#fff', .72], [.54, '#000', .14], [.76, '#fff', .32], [.9, '#000', .16], [1, '#000', .44]],
    },
    square: {
      matte: [[0, '#000', .12], [.06, '#000', .02], [.5, '#fff', .08], [.94, '#000', .04], [1, '#000', .18]],
      satin: [[0, '#000', .14], [.06, '#fff', .06], [.4, '#fff', .18], [.94, '#000', .04], [1, '#000', .20]],
      gloss: [[0, '#000', .18], [.05, '#fff', .35], [.12, '#fff', .06], [.62, '#fff', 0], [.7, '#fff', .25], [.76, '#fff', .03], [1, '#000', .24]],
      metallic: [[0, '#000', .28], [.06, '#fff', .55], [.3, '#000', .06], [.55, '#fff', .5], [.8, '#000', .08], [1, '#000', .30]],
    },
    crystal: {
      matte: [[0, '#000', .18], [.2, '#fff', .2], [.4, '#fff', .42], [.85, '#000', .1], [1, '#000', .24]],
      satin: [[0, '#000', .20], [.2, '#fff', .28], [.4, '#fff', .52], [.85, '#000', .12], [1, '#000', .28]],
      gloss: [[0, '#000', .24], [.15, '#fff', .70], [.3, '#fff', .18], [.65, '#fff', .05], [.8, '#fff', .36], [1, '#000', .32]],
      metallic: [[0, '#000', .38], [.15, '#fff', .72], [.38, '#fff', .82], [.75, '#fff', .38], [1, '#000', .42]],
    },
  };

  function gradStops(stops) {
    return stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join('');
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

  /* Cap Path: Top corners rounded (r), bottom corners crisp seam (2px) */
  function capShape(r, paint, extra = '') {
    const x = r.x, y = r.y, w = r.w, h = r.h;
    const rt = Math.min(r.r || 8, w / 2, h / 2);
    const rb = 2;
    const d = `M${x + rt},${y} H${x + w - rt} A${rt},${rt} 0 0 1 ${x + w},${y + rt} V${y + h - rb} A${rb},${rb} 0 0 1 ${x + w - rb},${y + h} H${x + rb} A${rb},${rb} 0 0 1 ${x},${y + h - rb} V${y + rt} A${rt},${rt} 0 0 1 ${x + rt},${y} Z`;
    return `<path d="${d}" fill="${paint}"${extra}/>`;
  }

  /* Base Path: Top corners crisp seam (2px), bottom corners rounded (r) */
  function baseShape(r, paint, extra = '') {
    const x = r.x, y = r.y, w = r.w, h = r.h;
    const rt = 2;
    const rb = Math.min(r.r || 8, w / 2, h / 2);
    const d = `M${x + rt},${y} H${x + w - rt} A${rt},${rt} 0 0 1 ${x + w},${y + rt} V${y + h - rb} A${rb},${rb} 0 0 1 ${x + w - rb},${y + h} H${x + rb} A${rb},${rb} 0 0 1 ${x},${y + h - rb} V${y + rt} A${rt},${rt} 0 0 1 ${x + rt},${y} Z`;
    return `<path d="${d}" fill="${paint}"${extra}/>`;
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

  function renderSVG(design, opts = {}) {
    const u = opts.uid || CL.uid('lt');
    const L = CL.models.layout(design.model);
    const sil = L.model.silhouette;
    const P = design.parts;
    const shading = opts.shading !== false;
    const inter = !!opts.interactive;
    const defs = [];

    const fCap = fillPaint(P.cap && P.cap.fill, `${u}-f-cap`);
    const fBase = fillPaint(P.base && P.base.fill, `${u}-f-base`);
    if (fCap.def) defs.push(fCap.def);
    if (fBase.def) defs.push(fBase.def);

    const shadeKey = (sil === 'square' ? 'square' : sil === 'crystal' ? 'crystal' : 'round');
    const shadeCapId = `${u}-sh-cap`;
    const shadeBaseId = `${u}-sh-base`;

    defs.push(`<linearGradient id="${shadeCapId}" x1="0" y1="0" x2="1" y2="0">${gradStops((SHADES[shadeKey] || SHADES.round)[P.cap?.finish || 'gloss'])}</linearGradient>`);
    defs.push(`<linearGradient id="${shadeBaseId}" x1="0" y1="0" x2="1" y2="0">${gradStops((SHADES[shadeKey] || SHADES.round)[P.base?.finish || 'matte'])}</linearGradient>`);

    defs.push(`<linearGradient id="${u}-v-top" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".26"/><stop offset=".08" stop-color="#fff" stop-opacity="0"/><stop offset=".94" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".18"/></linearGradient>`);
    defs.push(`<linearGradient id="${u}-v-bot" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".14"/><stop offset=".06" stop-color="#000" stop-opacity="0"/><stop offset=".9" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".26"/></linearGradient>`);

    defs.push(`<radialGradient id="${u}-shadow"><stop offset="0" stop-color="#141312" stop-opacity=".22"/><stop offset=".45" stop-color="#141312" stop-opacity=".08"/><stop offset="1" stop-color="#141312" stop-opacity="0"/></radialGradient>`);

    // Exact shape clip paths + Safe Zone clip paths
    defs.push(`<clipPath id="${u}-clip-cap">${capShape(L.cap, '#000')}</clipPath>`);
    defs.push(`<clipPath id="${u}-clip-base">${baseShape(L.base, '#000')}</clipPath>`);
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

    // 1. Base (Thân son)
    const baseAttr = inter ? ` data-part="base" class="cl-part"` : '';
    body += `<g${baseAttr} clip-path="url(#${u}-clip-base)">`;
    body += baseShape(L.base, fBase.paint);
    if (L.model.style === 'glass') {
      const tintCol = (P.tint && P.tint.color) || '#b83b48';
      body += `<rect x="${L.windowRect.x}" y="${L.windowRect.y}" width="${L.windowRect.w}" height="${L.windowRect.h}" rx="${L.windowRect.r}" fill="${tintCol}" opacity="0.88"/>`;
    }
    body += `</g>`;

    // Artwork on Base (Strictly inside Safe Zone)
    body += `<g clip-path="url(#${u}-safe-base)"${inter ? ' data-layers="base"' : ''}>${layersOf('base')}</g>`;

    if (shading) {
      body += `<g pointer-events="none" clip-path="url(#${u}-clip-base)">`;
      body += baseShape(L.base, `url(#${shadeBaseId})`);
      body += baseShape(L.base, `url(#${u}-v-bot)`);
      body += `</g>`;
    }

    // 2. Cap (Nắp son)
    const capAttr = inter ? ` data-part="cap" class="cl-part"` : '';
    body += `<g${capAttr} clip-path="url(#${u}-clip-cap)">`;
    body += capShape(L.cap, fCap.paint);
    body += `</g>`;

    // Artwork on Cap (Strictly inside Safe Zone)
    body += `<g clip-path="url(#${u}-safe-cap)"${inter ? ' data-layers="cap"' : ''}>${layersOf('cap')}</g>`;

    if (shading) {
      body += `<g pointer-events="none" clip-path="url(#${u}-clip-cap)">`;
      body += capShape(L.cap, `url(#${shadeCapId})`);
      body += capShape(L.cap, `url(#${u}-v-top)`);
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
      body += `<g id="dieline" pointer-events="none">${capShape(L.cap, 'none', cut)}${baseShape(L.base, 'none', cut)}</g>`;
    }

    const vb = opts.viewBox || `0 0 ${L.scene.w} ${L.scene.h}`;
    const size = (opts.width ? ` width="${opts.width}"` : '') + (opts.height ? ` height="${opts.height}"` : '');
    const style = opts.fontCSS ? `<style>${opts.fontCSS}</style>` : '';

    return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="${vb}"${size} preserveAspectRatio="${opts.preserveAspectRatio || 'xMidYMid meet'}">${style}<defs>${defs.join('')}</defs>${body}</svg>`;
  }

  function renderPartFlat(design, part, opts = {}) {
    const u = opts.uid || CL.uid('p');
    const L = CL.models.layout(design.model);
    const r = L[part];
    const f = fillPaint(design.parts[part]?.fill, `${u}-f`);
    const layers = (design.layers || []).filter((l) => l.part === part).map((l) => layerMarkup(l, r, false)).join('');
    const scale = opts.scale || 4;
    const style = opts.fontCSS ? `<style>${opts.fontCSS}</style>` : '';

    return {
      svg: `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="${r.x} ${r.y} ${r.w} ${r.h}" width="${r.w * scale}" height="${r.h * scale}">${style}<defs>${f.def}</defs><rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="${f.paint}"/>${layers}</svg>`,
      w: r.w * scale,
      h: r.h * scale,
      rect: r,
    };
  }

  /** renderSVG with a viewBox cropped tight around the tube (the scene itself has lots of empty space). */
  function renderTight(design, opts = {}) {
    const L = CL.models.layout(design.model);
    const padX = 34, padTop = 10, padBottom = 22;
    const x = L.cap.x - padX;
    const y = L.cap.y - padTop;
    const vw = L.cap.w + padX * 2;
    const vh = (L.base.y + L.base.h) - L.cap.y + padTop + padBottom;
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
