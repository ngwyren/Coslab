/* ==========================================================
   Lipstick SVG renderer
   Single source of truth for: editor canvas, thumbnails,
   gallery, SVG/PNG/JPG/PDF export and 3D textures.
   ========================================================== */
(function (CL) {
  const FONT_FALLBACK = "'Noto Sans SC','Noto Sans JP','Noto Sans KR','Noto Naskh Arabic',sans-serif";

  /* Shading overlays (horizontal gradients) per finish & section */
  const SHADES = {
    round: {
      matte: [[0, '#000', .30], [.18, '#fff', .04], [.36, '#fff', .14], [.6, '#000', 0], [.88, '#000', .14], [1, '#000', .34]],
      satin: [[0, '#000', .34], [.16, '#fff', .04], [.32, '#fff', .3], [.46, '#fff', .02], [.82, '#000', .12], [1, '#000', .38]],
      gloss: [[0, '#000', .40], [.14, '#000', 0], [.24, '#fff', .62], [.31, '#fff', .12], [.6, '#fff', 0], [.86, '#000', .14], [.93, '#fff', .12], [1, '#000', .46]],
      metallic: [[0, '#000', .5], [.1, '#fff', .55], [.22, '#000', .12], [.38, '#fff', .7], [.52, '#000', .18], [.74, '#fff', .3], [.9, '#000', .2], [1, '#000', .55]],
    },
    square: {
      matte: [[0, '#000', .14], [.06, '#000', .02], [.5, '#fff', .06], [.94, '#000', .04], [1, '#000', .2]],
      satin: [[0, '#000', .16], [.06, '#fff', .05], [.4, '#fff', .16], [.94, '#000', .04], [1, '#000', .24]],
      gloss: [[0, '#000', .2], [.05, '#fff', .3], [.12, '#fff', .05], [.62, '#fff', .0], [.7, '#fff', .22], [.76, '#fff', .02], [1, '#000', .26]],
      metallic: [[0, '#000', .3], [.06, '#fff', .5], [.3, '#000', .08], [.55, '#fff', .45], [.8, '#000', .1], [1, '#000', .35]],
    },
  };

  function gradStops(stops) {
    return stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join('');
  }

  function angleToVector(angle) {
    const a = (angle * Math.PI) / 180;
    const dx = Math.sin(a), dy = -Math.cos(a);
    return { x1: CL.round(.5 - dx / 2, 4), y1: CL.round(.5 - dy / 2, 4), x2: CL.round(.5 + dx / 2, 4), y2: CL.round(.5 + dy / 2, 4) };
  }

  /** Returns { def, paint } for a part fill. */
  function fillPaint(fill, id) {
    if (!fill || fill.type === 'solid') return { def: '', paint: (fill && fill.color) || '#cccccc' };
    const v = angleToVector(fill.angle ?? 180);
    const stops = (fill.stops || []).map((s) => `<stop offset="${s.o}" stop-color="${s.c}"/>`).join('');
    return { def: `<linearGradient id="${id}" x1="${v.x1}" y1="${v.y1}" x2="${v.x2}" y2="${v.y2}">${stops}</linearGradient>`, paint: `url(#${id})` };
  }

  /* ---------- Shapes (unit box -0.5..0.5) ---------- */
  function shapeMarkup(s) {
    const w = s.w, h = s.h;
    const fill = s.fill && s.fill !== 'none' ? s.fill : 'none';
    const stroke = s.stroke ? ` stroke="${s.stroke}" stroke-width="${s.strokeWidth || 1}" vector-effect="non-scaling-stroke"` : '';
    const P = (pts) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${CL.round(x * w, 2)} ${CL.round(y * h, 2)}`).join(' ') + ' Z';
    switch (s.kind) {
      case 'circle': return `<ellipse cx="0" cy="0" rx="${w / 2}" ry="${h / 2}" fill="${fill}"${stroke}/>`;
      case 'line': return `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" fill="${fill === 'none' ? '#111' : fill}"/>`;
      case 'diamond': return `<path d="${P([[0, -.5], [.5, 0], [0, .5], [-.5, 0]])}" fill="${fill}"${stroke}/>`;
      case 'star': {
        const pts = [];
        for (let i = 0; i < 10; i++) { const r = i % 2 ? .21 : .5; const a = -Math.PI / 2 + (i * Math.PI) / 5; pts.push([Math.cos(a) * r, Math.sin(a) * r + .04]); }
        return `<path d="${P(pts)}" fill="${fill}"${stroke}/>`;
      }
      case 'heart': {
        const X = (v) => CL.round(v * w, 2), Y = (v) => CL.round(v * h, 2);
        return `<path d="M${X(0)} ${Y(.5)} C${X(-.12)} ${Y(.38)} ${X(-.5)} ${Y(.12)} ${X(-.5)} ${Y(-.18)} C${X(-.5)} ${Y(-.42)} ${X(-.3)} ${Y(-.5)} ${X(-.2)} ${Y(-.5)} C${X(-.08)} ${Y(-.5)} ${X(0)} ${Y(-.42)} ${X(0)} ${Y(-.3)} C${X(0)} ${Y(-.42)} ${X(.08)} ${Y(-.5)} ${X(.2)} ${Y(-.5)} C${X(.3)} ${Y(-.5)} ${X(.5)} ${Y(-.42)} ${X(.5)} ${Y(-.18)} C${X(.5)} ${Y(.12)} ${X(.12)} ${Y(.38)} ${X(0)} ${Y(.5)} Z" fill="${fill}"${stroke}/>`;
      }
      case 'rect':
      default: return `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${s.radius || 0}" fill="${fill}"${stroke}/>`;
    }
  }

  function textMarkup(tx) {
    const lines = String(tx.content || '').split('\n');
    const lh = (tx.lineHeight || 1.2) * tx.size;
    const y0 = -((lines.length - 1) * lh) / 2;
    const anchor = tx.align === 'left' ? 'start' : tx.align === 'right' ? 'end' : 'middle';
    const fam = `'${tx.font}',${FONT_FALLBACK}`;
    const spans = lines.map((ln, i) => `<tspan x="0" y="${CL.round(y0 + i * lh, 2)}">${CL.esc(ln) || ' '}</tspan>`).join('');
    return `<text text-anchor="${anchor}" dominant-baseline="central" font-family="${fam}" font-size="${tx.size}" font-weight="${tx.weight || 400}" font-style="${tx.italic ? 'italic' : 'normal'}" letter-spacing="${tx.spacing || 0}" fill="${tx.color || '#111'}" xml:space="preserve">${spans}</text>`;
  }

  /** Absolute centre of a layer in scene coordinates. */
  function layerCenter(layer, rect) { return { x: rect.x + layer.x * rect.w, y: rect.y + layer.y * rect.h }; }

  function layerTransform(layer, rect) {
    const c = layerCenter(layer, rect);
    const sx = layer.flipX ? -1 : 1, sy = layer.flipY ? -1 : 1;
    return `translate(${CL.round(c.x, 3)} ${CL.round(c.y, 3)}) rotate(${CL.round(layer.rotation || 0, 3)})${sx < 0 || sy < 0 ? ` scale(${sx} ${sy})` : ''}`;
  }

  function layerMarkup(layer, rect, interactive) {
    if (!layer.visible) return '';
    let inner = '';
    if (layer.type === 'text') inner = textMarkup(layer.text);
    else if (layer.type === 'image') {
      const im = layer.image;
      inner = `<image href="${im.src}" xlink:href="${im.src}" x="${-im.w / 2}" y="${-im.h / 2}" width="${im.w}" height="${im.h}" preserveAspectRatio="none"/>`;
    } else if (layer.type === 'shape') inner = shapeMarkup(layer.shape);
    const data = interactive ? ` data-layer="${layer.id}" class="cl-layer${layer.locked ? ' is-locked' : ''}"` : '';
    return `<g transform="${layerTransform(layer, rect)}" opacity="${layer.opacity ?? 1}"${data}>${inner}</g>`;
  }

  function roundRect(r, paint, extra = '') {
    return `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="${r.r || 0}" fill="${paint}"${extra}/>`;
  }

  /**
   * Render a full design.
   * opts: { uid, interactive, shading=true, shadow=true, background, fontCSS, width, height, viewBox }
   */
  function renderSVG(design, opts = {}) {
    const u = opts.uid || CL.uid('s');
    const L = CL.models.layout(design.model);
    const section = L.model.section;
    const P = design.parts;
    const shading = opts.shading !== false;
    const inter = !!opts.interactive;
    const defs = [];

    const fills = {};
    ['cap', 'base', 'sleeve', 'bullet'].forEach((p) => {
      const f = fillPaint(P[p] && P[p].fill, `${u}-f-${p}`);
      if (f.def) defs.push(f.def);
      fills[p] = f.paint;
    });

    const shadeId = (sec, fin) => {
      const id = `${u}-sh-${sec}-${fin}`;
      if (!defs.some((d) => d.includes(`id="${id}"`))) defs.push(`<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="0">${gradStops((SHADES[sec] || SHADES.round)[fin] || SHADES.round.gloss)}</linearGradient>`);
      return `url(#${id})`;
    };
    defs.push(`<linearGradient id="${u}-vt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".18"/><stop offset=".12" stop-color="#fff" stop-opacity="0"/><stop offset=".9" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".18"/></linearGradient>`);
    defs.push(`<radialGradient id="${u}-gs"><stop offset="0" stop-color="#000" stop-opacity=".22"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>`);
    defs.push(`<clipPath id="${u}-clip-cap">${roundRect(L.cap, '#000')}</clipPath>`);
    defs.push(`<clipPath id="${u}-clip-base">${roundRect(L.base, '#000')}</clipPath>`);
    defs.push(`<clipPath id="${u}-clip-bullet"><path d="${CL.models.bulletPath(L.bullet)}"/></clipPath>`);

    const fin = (p) => (P[p] && P[p].finish) || 'gloss';
    const partAttr = (p) => (inter ? ` data-part="${p}" class="cl-part"` : '');
    const layersOf = (p) => design.layers.filter((l) => l.part === p).map((l) => layerMarkup(l, L[p], inter)).join('');

    const G = L.scene.ground;
    let body = '';
    if (opts.background) body += `<rect x="-2000" y="-2000" width="5000" height="5000" fill="${opts.background}"/>`;
    if (opts.shadow !== false) {
      body += `<ellipse cx="${L.scene.cxBase}" cy="${G + 2}" rx="${L.base.w * .8}" ry="9" fill="url(#${u}-gs)"/>`;
      body += `<ellipse cx="${L.scene.cxCap}" cy="${G + 2}" rx="${L.cap.w * .8}" ry="9" fill="url(#${u}-gs)"/>`;
    }

    // Bullet
    const bp = CL.models.bulletPath(L.bullet);
    body += `<g${partAttr('bullet')}><path d="${bp}" fill="${fills.bullet}"/>`;
    if (shading) body += `<g clip-path="url(#${u}-clip-bullet)" pointer-events="none"><rect x="${L.bullet.x}" y="${L.bullet.y}" width="${L.bullet.w}" height="${L.bullet.h}" fill="${shadeId(section === 'square' ? 'square' : 'round', fin('bullet'))}"/></g>`;
    body += `</g>`;
    // Sleeve
    body += `<g${partAttr('sleeve')}>${roundRect(L.sleeve, fills.sleeve)}`;
    if (shading) body += roundRect(L.sleeve, shadeId(section, fin('sleeve')), ' pointer-events="none"');
    body += `</g>`;
    // Base + cap with artwork
    ['base', 'cap'].forEach((p) => {
      const r = L[p];
      body += `<g${partAttr(p)}>${roundRect(r, fills[p])}</g>`;
      body += `<g clip-path="url(#${u}-clip-${p})"${inter ? ` data-layers="${p}"` : ''}>${layersOf(p)}</g>`;
      if (shading) {
        body += `<g pointer-events="none">${roundRect(r, shadeId(section, fin(p)))}${roundRect(r, `url(#${u}-vt)`)}</g>`;
      }
      // subtle split line near the bottom of the base / top of the cap for realism
      if (shading && p === 'base') body += `<rect x="${r.x}" y="${r.y + r.h - 7}" width="${r.w}" height="1" fill="#000" opacity=".12" pointer-events="none"/>`;
      if (shading && p === 'cap') body += `<rect x="${r.x}" y="${r.y + 6}" width="${r.w}" height="1" fill="#fff" opacity=".22" pointer-events="none"/>`;
    });

    const vb = opts.viewBox || `0 0 ${L.scene.w} ${L.scene.h}`;
    const size = (opts.width ? ` width="${opts.width}"` : '') + (opts.height ? ` height="${opts.height}"` : '');
    const style = opts.fontCSS ? `<style>${opts.fontCSS}</style>` : '';
    return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="${vb}"${size} preserveAspectRatio="xMidYMid meet">${style}<defs>${defs.join('')}</defs>${body}</svg>`;
  }

  /** Flat (unwrapped front) artwork of one part — used for 3D textures & print. */
  function renderPartFlat(design, part, opts = {}) {
    const u = opts.uid || CL.uid('p');
    const L = CL.models.layout(design.model);
    const r = L[part];
    const f = fillPaint(design.parts[part].fill, `${u}-f`);
    const layers = design.layers.filter((l) => l.part === part).map((l) => layerMarkup(l, r, false)).join('');
    const scale = opts.scale || 4;
    const style = opts.fontCSS ? `<style>${opts.fontCSS}</style>` : '';
    return {
      svg: `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="${r.x} ${r.y} ${r.w} ${r.h}" width="${r.w * scale}" height="${r.h * scale}">${style}<defs>${f.def}</defs><rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="${f.paint}"/>${layers}</svg>`,
      w: r.w * scale, h: r.h * scale, rect: r,
    };
  }

  /** Approximate layer box (unrotated) — used when DOM measurement is unavailable. */
  function estimateLayerSize(layer) {
    if (layer.type === 'image') return { w: layer.image.w, h: layer.image.h };
    if (layer.type === 'shape') return { w: layer.shape.w, h: Math.max(layer.shape.h, 2) };
    const tx = layer.text; const lines = String(tx.content || '').split('\n');
    const longest = Math.max(...lines.map((l) => l.length), 1);
    return { w: longest * (tx.size * .6 + (tx.spacing || 0)), h: lines.length * tx.size * (tx.lineHeight || 1.2) };
  }

  CL.render = { renderSVG, renderPartFlat, layerMarkup, layerCenter, layerTransform, fillPaint, estimateLayerSize, FONT_FALLBACK };
})(window.CL);
