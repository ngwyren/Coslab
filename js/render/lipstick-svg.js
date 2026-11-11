/* ==========================================================
   COSLAB — Liptint SVG Renderer
   Renders EXACTLY 1 ASSEMBLED LIPTINT TUBE (Chỉ 1 cây son liptint duy nhất).
   Up Liptint (Cap) on top, divider ring in middle, Button Liptint (Base) at bottom.
   Korean K-Beauty aesthetic (velvet matte, crystal acrylic, dewy water tint, chrome).
   ========================================================== */
(function (CL) {
  const FONT_FALLBACK = "'Noto Sans KR','Noto Serif KR','Noto Sans SC','Noto Sans JP','Noto Naskh Arabic',sans-serif";

  /* Shading overlays (cylindrical highlight & shadow) per finish & silhouette */
  const SHADES = {
    round: {
      matte: [[0, '#000', .24], [.18, '#fff', .06], [.36, '#fff', .18], [.6, '#000', 0], [.88, '#000', .12], [1, '#000', .28]],
      satin: [[0, '#000', .28], [.16, '#fff', .08], [.34, '#fff', .32], [.48, '#fff', .04], [.82, '#000', .10], [1, '#000', .32]],
      gloss: [[0, '#000', .35], [.14, '#000', 0], [.26, '#fff', .68], [.33, '#fff', .15], [.6, '#fff', 0], [.86, '#000', .12], [.93, '#fff', .16], [1, '#000', .40]],
      metallic: [[0, '#000', .45], [.12, '#fff', .6], [.24, '#000', .1], [.38, '#fff', .75], [.54, '#000', .15], [.76, '#fff', .35], [.9, '#000', .18], [1, '#000', .48]],
    },
    square: {
      matte: [[0, '#000', .12], [.06, '#000', .02], [.5, '#fff', .08], [.94, '#000', .04], [1, '#000', .18]],
      satin: [[0, '#000', .14], [.06, '#fff', .06], [.4, '#fff', .18], [.94, '#000', .04], [1, '#000', .20]],
      gloss: [[0, '#000', .18], [.05, '#fff', .35], [.12, '#fff', .06], [.62, '#fff', 0], [.7, '#fff', .25], [.76, '#fff', .03], [1, '#000', .24]],
      metallic: [[0, '#000', .28], [.06, '#fff', .55], [.3, '#000', .06], [.55, '#fff', .5], [.8, '#000', .08], [1, '#000', .30]],
    },
    crystal: {
      matte: [[0, '#000', .18], [.2, '#fff', .2], [.4, '#fff', .45], [.85, '#000', .1], [1, '#000', .25]],
      satin: [[0, '#000', .22], [.2, '#fff', .3], [.4, '#fff', .55], [.85, '#000', .12], [1, '#000', .3]],
      gloss: [[0, '#000', .25], [.15, '#fff', .75], [.3, '#fff', .2], [.65, '#fff', .05], [.8, '#fff', .4], [1, '#000', .35]],
      metallic: [[0, '#000', .4], [.15, '#fff', .75], [.38, '#fff', .85], [.75, '#fff', .4], [1, '#000', .45]],
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

  function textMarkup(tx) {
    const lines = String(tx.content || '').split('\n');
    const lh = (tx.lineHeight || 1.2) * tx.size;
    const y0 = -((lines.length - 1) * lh) / 2;
    const anchor = tx.align === 'left' ? 'start' : tx.align === 'right' ? 'end' : 'middle';
    const fam = `'${tx.font}',${FONT_FALLBACK}`;
    const spans = lines.map((ln, i) => `<tspan x="0" y="${CL.round(y0 + i * lh, 2)}">${CL.esc(ln) || ' '}</tspan>`).join('');
    return `<text text-anchor="${anchor}" dominant-baseline="central" font-family="${fam}" font-size="${tx.size}" font-weight="${tx.weight || 400}" font-style="${tx.italic ? 'italic' : 'normal'}" letter-spacing="${tx.spacing || 0}" fill="${tx.color || '#171615'}" xml:space="preserve">${spans}</text>`;
  }

  function layerCenter(layer, rect) {
    return { x: rect.x + layer.x * rect.w, y: rect.y + layer.y * rect.h };
  }

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
    } else if (layer.type === 'shape') {
      inner = shapeMarkup(layer.shape);
    }
    const data = interactive ? ` data-layer="${layer.id}" class="cl-layer${layer.locked ? ' is-locked' : ''}"` : '';
    return `<g transform="${layerTransform(layer, rect)}" opacity="${layer.opacity ?? 1}"${data}>${inner}</g>`;
  }

  function roundRect(r, paint, extra = '') {
    return `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="${r.r || 0}" fill="${paint}"${extra}/>`;
  }

  /**
   * Render EXACTLY 1 LIPTINT TUBE
   * Options:
   *  - interactive: enables data-part and data-layer hooks for canvas interaction
   *  - shading: realistic light reflection overlay
   *  - shadow: soft ground shadow
   */
  function renderSVG(design, opts = {}) {
    const u = opts.uid || CL.uid('lt');
    const L = CL.models.layout(design.model);
    const sil = L.model.silhouette;
    const P = design.parts;
    const shading = opts.shading !== false;
    const inter = !!opts.interactive;
    const defs = [];

    // Fills for Up Liptint (cap), Button Liptint (base), ring
    const fCap = fillPaint(P.cap && P.cap.fill, `${u}-f-cap`);
    const fBase = fillPaint(P.base && P.base.fill, `${u}-f-base`);
    const fRing = fillPaint((P.ring && P.ring.fill) || { type: 'solid', color: '#dedad2' }, `${u}-f-ring`);

    if (fCap.def) defs.push(fCap.def);
    if (fBase.def) defs.push(fBase.def);
    if (fRing.def) defs.push(fRing.def);

    // Shading gradients
    const shadeKey = (sil === 'square' ? 'square' : sil === 'crystal' ? 'crystal' : 'round');
    const shadeCapId = `${u}-sh-cap`;
    const shadeBaseId = `${u}-sh-base`;

    defs.push(`<linearGradient id="${shadeCapId}" x1="0" y1="0" x2="1" y2="0">${gradStops((SHADES[shadeKey] || SHADES.round)[P.cap?.finish || 'gloss'])}</linearGradient>`);
    defs.push(`<linearGradient id="${shadeBaseId}" x1="0" y1="0" x2="1" y2="0">${gradStops((SHADES[shadeKey] || SHADES.round)[P.base?.finish || 'matte'])}</linearGradient>`);

    // Vertical rim gradients
    defs.push(`<linearGradient id="${u}-v-top" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".3"/><stop offset=".08" stop-color="#fff" stop-opacity="0"/><stop offset=".92" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></linearGradient>`);
    defs.push(`<linearGradient id="${u}-v-bot" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".18"/><stop offset=".08" stop-color="#000" stop-opacity="0"/><stop offset=".9" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".32"/></linearGradient>`);

    // Ground shadow
    defs.push(`<radialGradient id="${u}-shadow"><stop offset="0" stop-color="#141312" stop-opacity=".25"/><stop offset=".4" stop-color="#141312" stop-opacity=".10"/><stop offset="1" stop-color="#141312" stop-opacity="0"/></radialGradient>`);

    // Clip paths for 1 single assembled tube
    defs.push(`<clipPath id="${u}-clip-cap">${roundRect(L.cap, '#000')}</clipPath>`);
    defs.push(`<clipPath id="${u}-clip-base">${roundRect(L.base, '#000')}</clipPath>`);

    const layersOf = (part) => (design.layers || []).filter((l) => l.part === part).map((l) => layerMarkup(l, L[part], inter)).join('');

    let body = '';
    if (opts.background) {
      body += `<rect x="-1000" y="-1000" width="3000" height="3000" fill="${opts.background}"/>`;
    }

    // 1. Ground Shadow (Under exactly 1 liptint tube)
    if (opts.shadow !== false) {
      body += `<ellipse cx="${L.scene.cx}" cy="${L.scene.ground + 4}" rx="${L.base.w * 0.72}" ry="11" fill="url(#${u}-shadow)"/>`;
    }

    // 2. Button Liptint (Base / Body) - Thân son tint dưới
    const baseAttr = inter ? ` data-part="base" class="cl-part"` : '';
    body += `<g${baseAttr}>`;
    body += roundRect(L.base, fBase.paint);
    // Acrylic / Glass tint reservoir indicator if dewy style
    if (L.model.style === 'glass') {
      const tintCol = (P.tint && P.tint.color) || '#b83b48';
      body += `<rect x="${L.windowRect.x}" y="${L.windowRect.y}" width="${L.windowRect.w}" height="${L.windowRect.h}" rx="${L.windowRect.r}" fill="${tintCol}" opacity="0.88"/>`;
      body += `<rect x="${L.windowRect.x}" y="${L.windowRect.y}" width="${L.windowRect.w}" height="${L.windowRect.h}" rx="${L.windowRect.r}" fill="url(#${shadeBaseId})" opacity="0.5" pointer-events="none"/>`;
    }
    body += `</g>`;

    // Artwork on Base (Button Liptint)
    body += `<g clip-path="url(#${u}-clip-base)"${inter ? ' data-layers="base"' : ''}>${layersOf('base')}</g>`;

    // Base Shading overlays
    if (shading) {
      body += `<g pointer-events="none">`;
      body += roundRect(L.base, `url(#${shadeBaseId})`);
      body += roundRect(L.base, `url(#${u}-v-bot)`);
      // subtle bevel lines
      body += `<rect x="${L.base.x}" y="${L.base.y + L.base.h - 6}" width="${L.base.w}" height="1.5" fill="#000" opacity=".18"/>`;
      body += `</g>`;
    }

    // 3. Divider Ring / Collar (Khớp nối giữa Up & Button Liptint)
    body += `<g${inter ? ' data-part="ring" class="cl-part"' : ''}>`;
    body += roundRect(L.ring, fRing.paint);
    if (shading) {
      body += roundRect(L.ring, `url(#${shadeCapId})`, ' pointer-events="none"');
      body += `<rect x="${L.ring.x}" y="${L.ring.y}" width="${L.ring.w}" height="1" fill="#000" opacity=".25" pointer-events="none"/>`;
      body += `<rect x="${L.ring.x}" y="${L.ring.y + L.ring.h - 1}" width="${L.ring.w}" height="1" fill="#fff" opacity=".3" pointer-events="none"/>`;
    }
    body += `</g>`;

    // 4. Up Liptint (Cap) - Nắp son tint trên
    const capAttr = inter ? ` data-part="cap" class="cl-part"` : '';
    body += `<g${capAttr}>`;
    body += roundRect(L.cap, fCap.paint);
    body += `</g>`;

    // Artwork on Cap (Up Liptint)
    body += `<g clip-path="url(#${u}-clip-cap)"${inter ? ' data-layers="cap"' : ''}>${layersOf('cap')}</g>`;

    // Cap Shading overlays
    if (shading) {
      body += `<g pointer-events="none">`;
      body += roundRect(L.cap, `url(#${shadeCapId})`);
      body += roundRect(L.cap, `url(#${u}-v-top)`);
      // subtle top crown highlight & bottom seam
      body += `<rect x="${L.cap.x}" y="${L.cap.y + 6}" width="${L.cap.w}" height="1.5" fill="#fff" opacity=".35"/>`;
      body += `<rect x="${L.cap.x}" y="${L.cap.y + L.cap.h - 2}" width="${L.cap.w}" height="1.5" fill="#000" opacity=".2"/>`;
      body += `</g>`;
    }

    const vb = opts.viewBox || `0 0 ${L.scene.w} ${L.scene.h}`;
    const size = (opts.width ? ` width="${opts.width}"` : '') + (opts.height ? ` height="${opts.height}"` : '');
    const style = opts.fontCSS ? `<style>${opts.fontCSS}</style>` : '';

    return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="${vb}"${size} preserveAspectRatio="xMidYMid meet">${style}<defs>${defs.join('')}</defs>${body}</svg>`;
  }

  /**
   * Render flat artwork for print production & 3D unwrapping
   */
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

  CL.render = {
    renderSVG,
    renderPartFlat,
    layerMarkup,
    layerCenter,
    layerTransform,
    fillPaint,
    FONT_FALLBACK,
  };
})(window.CL);
