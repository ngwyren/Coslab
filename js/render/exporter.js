/* ==========================================================
   COSLAB — Exporter: Font Embedding, Rasterising, PNG/JPG/SVG/PDF
   Tailored for Liptint Production Specifications.
   ========================================================== */
(function (CL) {
  const cssCache = new Map();
  const fileCache = new Map();

  function usedText(design) {
    return (design.layers || [])
      .filter((l) => l.type === 'text' && l.visible)
      .map((l) => l.text.content)
      .join('') + 'COSLAB LIPTINT KOREA ATELIER';
  }

  function fallbackFamilies(text) {
    const fams = [];
    if (/[\uac00-\ud7af\u1100-\u11ff]/.test(text)) fams.push('Noto Serif KR', 'Noto Sans KR');
    if (/[\u4e00-\u9fff\u3400-\u4dbf]/.test(text)) fams.push('Noto Sans SC');
    if (/[\u3040-\u30ff]/.test(text)) fams.push('Noto Sans JP');
    if (/[\u0600-\u06ff\u0750-\u077f]/.test(text)) fams.push('Noto Naskh Arabic');
    return fams;
  }

  function inRanges(cp, ranges) {
    return ranges.some(([a, b]) => cp >= a && cp <= b);
  }

  function parseRanges(s) {
    if (!s) return [[0, 0x10ffff]];
    return s.split(',').map((p) => {
      p = p.trim().replace(/^U\+/i, '');
      if (p.includes('?')) return [parseInt(p.replace(/\?/g, '0'), 16), parseInt(p.replace(/\?/g, 'F'), 16)];
      const [a, b] = p.split('-');
      return [parseInt(a, 16), parseInt(b || a, 16)];
    });
  }

  async function fetchCSS(family, variants) {
    const fam = family.replace(/ /g, '+');
    const v = [...variants].sort((a, b) => a[0] - b[0] || a[1] - b[1]).map(([i, w]) => `${i},${w}`).join(';');
    const urls = [
      `https://fonts.googleapis.com/css2?family=${fam}:ital,wght@${v}&display=swap`,
      `https://fonts.googleapis.com/css2?family=${fam}&display=swap`
    ];
    for (const url of urls) {
      if (cssCache.has(url)) return cssCache.get(url);
      try {
        const r = await fetch(url);
        if (!r.ok) continue;
        const css = await r.text();
        cssCache.set(url, css);
        return css;
      } catch (e) { }
    }
    return '';
  }

  async function toDataURL(url) {
    if (fileCache.has(url)) return fileCache.get(url);
    const r = await fetch(url);
    const b = await r.blob();
    const d = await new Promise((res) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(b); });
    fileCache.set(url, d);
    return d;
  }

  async function fontCSS(design) {
    const text = usedText(design);
    const cps = [...new Set([...text].map((c) => c.codePointAt(0)))];
    const fams = new Map();
    (design.layers || []).filter((l) => l.type === 'text' && l.visible).forEach((l) => {
      const k = l.text.font;
      if (!fams.has(k)) fams.set(k, new Set());
      fams.get(k).add(`${l.text.italic ? 1 : 0}|${l.text.weight || 400}`);
    });
    fallbackFamilies(text).forEach((f) => {
      if (!fams.has(f)) fams.set(f, new Set(['0|400', '0|700']));
    });
    if (!fams.size) return '';

    const out = [];
    for (const [fam, set] of fams) {
      const variants = [...set].map((s) => s.split('|').map(Number));
      const css = await fetchCSS(fam, variants);
      if (!css) continue;
      const blocks = css.match(/@font-face\s*{[^}]*}/g) || [];
      for (const blk of blocks) {
        const ur = (blk.match(/unicode-range:\s*([^;]+);/) || [])[1];
        const ranges = parseRanges(ur);
        if (!cps.some((cp) => inRanges(cp, ranges))) continue;
        const m = blk.match(/url\((https:[^)]+)\)/);
        if (!m) continue;
        try { out.push(blk.replace(m[1], await toDataURL(m[1]))); } catch (e) { }
      }
    }
    return out.join('\n');
  }

  function svgToImage(svg) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(e);
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    });
  }

  async function rasterize(svg, w, h, background) {
    const img = await svgToImage(svg);
    const c = document.createElement('canvas');
    c.width = Math.round(w);
    c.height = Math.round(h);
    const ctx = c.getContext('2d');
    if (background) {
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, c.width, c.height);
    }
    ctx.drawImage(img, 0, 0, c.width, c.height);
    return c;
  }

  async function renderCanvas(design, { scale = 3, background = null, fonts, dieline = false } = {}) {
    const css = fonts !== undefined ? fonts : await fontCSS(design);
    const S = CL.models.SCENE;
    const svg = CL.render.renderSVG(design, { fontCSS: css, width: S.w * scale, height: S.h * scale, dieline });
    return rasterize(svg, S.w * scale, S.h * scale, background);
  }

  async function renderFlatCanvas(design, part, { scale = 4, fonts, layersOnly = false } = {}) {
    const css = fonts !== undefined ? fonts : await fontCSS(design);
    const f = CL.render.renderPartFlat(design, part, { scale, fontCSS: css, layersOnly });
    return { canvas: await rasterize(f.svg, f.w, f.h), rect: f.rect };
  }

  /** Artwork of one part for the 3D views, cut at the safe zone like the 2D view. */
  async function renderArtCanvas(design, part, { scale = 4, fonts } = {}) {
    const r = CL.models.layout(design.model)[part];
    const c = (await renderFlatCanvas(design, part, { scale, fonts, layersOnly: true })).canvas;
    const k = c.width / r.w, ctx = c.getContext('2d');
    ctx.globalCompositeOperation = 'destination-in';
    ctx.fillRect((r.safe.x - r.x) * k, (r.safe.y - r.y) * k, r.safe.w * k, r.safe.h * k);
    return c;
  }

  /** Still picture of the 3D container (front view, slightly turned). */
  async function renderCanvas3D(design, { background = null, pixelRatio = 2 } = {}) {
    await CL.loadThree();
    const host = CL.h('div', { 'aria-hidden': 'true', style: { position: 'fixed', left: '-5000px', top: '0', width: '1000px', height: '1400px', pointerEvents: 'none' } });
    document.body.append(host);
    let view = null;
    try {
      view = new CL.Preview3D(host, { autoRotate: false, interactive: false });
      view.renderer.setPixelRatio(pixelRatio);
      view._resize();
      if (!(await view.setDesign(design))) throw new Error('3D model missing');
      view.rotY = view.targetRotY = -0.3;
      view.rotX = view.targetRotX = 0.08;
      cancelAnimationFrame(view._raf); // draw this frame now, even in a background tab
      view._loop(performance.now());
      const src = view.renderer.domElement;
      const c = document.createElement('canvas');
      c.width = src.width;
      c.height = src.height;
      const ctx = c.getContext('2d');
      if (background) {
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, c.width, c.height);
      }
      ctx.drawImage(src, 0, 0);
      return c;
    } finally {
      if (view) view.dispose();
      host.remove();
    }
  }

  // Colours are specified by Pantone code only (no HEX on customer-facing documents)
  function fillDesc(fill) {
    if (!fill) return '-';
    return CL.pantone.describeFill(fill, true);
  }

  /** Wrap text into lines that fit maxWidth on a canvas context. */
  function wrapLines(ctx, text, maxWidth) {
    const words = String(text).split(/\s+/);
    const lines = [];
    let line = '';
    words.forEach((w) => {
      const test = line ? line + ' ' + w : w;
      if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = w; } else line = test;
    });
    if (line) lines.push(line);
    return lines;
  }

  /** Amber "on-screen colour is reference only" box. */
  function drawColorNote(ctx, x, y, w, UI) {
    ctx.save();
    ctx.font = `500 30px ${UI}`;
    const lines = wrapLines(ctx, t('flow.disclaimer'), w - 80);
    const h = 60 + 40 + lines.length * 42;
    ctx.fillStyle = '#fff7ec';
    roundRectPath(ctx, x, y, w, h, 24);
    ctx.fill();
    ctx.strokeStyle = '#f3dfbf';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#6b4e1f';
    ctx.font = `700 32px ${UI}`;
    ctx.fillText('⚠ ' + t('flow.noteTitle'), x + 40, y + 64);
    ctx.font = `500 30px ${UI}`;
    lines.forEach((ln, i) => ctx.fillText(ln, x + 40, y + 112 + i * 42));
    ctx.restore();
    return h;
  }

  function paintSwatch(ctx, fill, x, y, r) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    if (fill && fill.type === 'linear') {
      const g = ctx.createLinearGradient(x - r, y - r, x + r, y + r);
      fill.stops.forEach((s) => g.addColorStop(s.o, s.c));
      ctx.fillStyle = g;
    } else {
      ctx.fillStyle = (fill && fill.color) || '#ccc';
    }
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#d9d9d9';
    ctx.stroke();
    ctx.restore();
  }

  function roundRectPath(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  async function buildSpecPages(design, view, previewDpi) {
    const fonts = await fontCSS(design);
    const W = 3508, H = 2480; // A4 landscape layout units (@300dpi)
    const settings = CL.store.settings || {};
    const dpi = previewDpi ? previewDpi : [150, 300, 600].includes(settings.exportDPI) ? settings.exportDPI : 300;
    const K = dpi / 300; // canvas pixel scale vs. 300dpi layout units
    const showCropMarks = settings.cropMarks !== false;
    const UI = "'Plus Jakarta Sans', 'Noto Sans KR', 'Noto Serif KR', sans-serif";
    const rtl = I18N.meta.dir === 'rtl';
    const author = CL.store.settings.author || {};
    const name = design.name || t('editor.untitled');

    // Page 1: Product Presentation Sheet
    const c1 = document.createElement('canvas');
    c1.width = Math.round(W * K); c1.height = Math.round(H * K);
    const ctx = c1.getContext('2d');
    ctx.scale(K, K);
    ctx.fillStyle = '#fcfbf9';
    ctx.fillRect(0, 0, W, H);
    ctx.direction = rtl ? 'rtl' : 'ltr';

    // Header
    ctx.fillStyle = '#171615';
    ctx.font = `800 60px ${UI}`;
    ctx.fillText('COSLAB KOREA', 160, 210);
    ctx.font = `500 40px ${UI}`;
    ctx.fillStyle = '#736e65';
    ctx.textAlign = 'right';
    ctx.fillText('LIPTINT MANUFACTURING SPECIFICATION SHEET', W - 160, 210);
    ctx.textAlign = 'left';

    ctx.fillStyle = '#e5dfd5';
    ctx.fillRect(160, 255, W - 320, 2);

    // Single Liptint Tube Render Panel
    ctx.fillStyle = '#f3efe6';
    roundRectPath(ctx, 160, 320, 1400, 1920, 40);
    ctx.fill();

    const prod = view === '3d' ? await renderCanvas3D(design) : await renderCanvas(design, { scale: 3.2 * K, fonts });
    const k = Math.min(1280 / prod.width, 1800 / prod.height);
    ctx.drawImage(prod, 160 + (1400 - prod.width * k) / 2, 320 + (1920 - prod.height * k) / 2, prod.width * k, prod.height * k);

    // Details Column
    let x = 1720, y = 410;
    ctx.fillStyle = '#171615';
    ctx.font = `700 80px ${UI}`;
    ctx.fillText(name, x, y);

    y += 76;
    ctx.font = `400 36px ${UI}`;
    ctx.fillStyle = '#736e65';
    ctx.fillText(`Batch Ref: COSLAB-${CL.models.getModel(design.model).name} · ${CL.formatDate(Date.now())}`, x, y);

    const model = CL.models.getModel(design.model);
    const rows = [
      [t('pdf.model'), model.name],
      ...CL.models.specRows(model),
      [t('pdf.template'), t('templates.' + (design.templateId || 'velvet-rose'))],
      [t('pdf.author'), author.name || '—'],
      [t('pdf.brand'), author.brand || '—'],
    ];

    y += 100;
    rows.forEach(([a, b]) => {
      ctx.fillStyle = '#8a8479';
      ctx.font = `500 36px ${UI}`;
      ctx.fillText(a, x, y);
      ctx.fillStyle = '#171615';
      ctx.font = `600 40px ${UI}`;
      ctx.fillText(b, x + 440, y);
      y += 62;
    });

    y += 10;
    ctx.fillStyle = '#e5dfd5';
    ctx.fillRect(x, y, W - 160 - x, 2);
    y += 80;

    ctx.fillStyle = '#171615';
    ctx.font = `700 44px ${UI}`;
    ctx.fillText('Liptint Components & Finishes', x, y);
    y += 76;

    const partsList = [
      ['cap', t('editor.upPart'), design.parts.cap],
      ['base', t('editor.btnPart'), design.parts.base],
    ].filter(([, , part]) => part);

    partsList.forEach(([pKey, pLabel, part]) => {
      paintSwatch(ctx, part.fill, x + 30, y - 14, 28);
      ctx.fillStyle = '#171615';
      ctx.font = `600 38px ${UI}`;
      ctx.fillText(pLabel, x + 84, y);
      ctx.fillStyle = '#59544c';
      ctx.font = `400 34px ${UI}`;
      ctx.fillText(`${t(CL.pantone.surfaceKey(part))} · ${fillDesc(part.fill)} · ${t('editor.colors.' + (part.finish || 'matte'))}`, x + 620, y, W - 160 - (x + 620));
      y += 80;
    });

    y += 30;
    ctx.fillStyle = '#e5dfd5';
    ctx.fillRect(x, y, W - 160 - x, 2);
    y += 80;

    ctx.fillStyle = '#171615';
    ctx.font = `700 44px ${UI}`;
    ctx.fillText('Typography & Vector Artwork Layers', x, y);
    y += 72;

    const layers = (design.layers || []).filter((l) => l.visible);
    if (!layers.length) {
      ctx.fillStyle = '#8a8479';
      ctx.font = `400 34px ${UI}`;
      ctx.fillText('— No surface artwork applied —', x, y);
    }
    layers.slice(0, 7).forEach((l, i) => {
      ctx.fillStyle = '#9c9589';
      ctx.font = `600 32px ${UI}`;
      ctx.fillText(String(i + 1).padStart(2, '0'), x, y);

      ctx.fillStyle = '#171615';
      ctx.font = `400 34px ${UI}`;
      let label = l.type === 'text'
        ? `“${l.text.content}” · ${l.text.font} ${l.text.size}pt · ${CL.pantone.label(CL.pantone.of({ color: l.text.color, pantone: l.text.pantone }, { ink: true }), true)}`
        : l.type === 'image' ? 'Logo Graphic (Nano Banana Model Cleaned)' : `${t('editor.shapes.' + l.shape.kind)} shape`;

      if (label.length > 74) label = label.slice(0, 72) + '…';
      ctx.fillText(label, x + 80, y);

      ctx.fillStyle = '#8a8479';
      ctx.textAlign = 'right';
      ctx.fillText(l.part === 'cap' ? t('editor.upPart') : t('editor.btnPart'), W - 160, y);
      ctx.textAlign = 'left';
      y += 62;
    });

    // Colour disclaimer at the bottom of the spec column (never above the layer list)
    drawColorNote(ctx, x, Math.max(y + 40, H - 420), W - 160 - x, UI);

    ctx.fillStyle = '#9e978c';
    ctx.font = `400 30px ${UI}`;
    ctx.fillText('COSLAB KOREA · 20, 423 Cheongcheon-dong, Bupyeong District, Incheon · Tel: 032-715-4277', 160, H - 90);

    // Page 2: Unwrapped Print Flats for Cap & Base (1:1 Ratio)
    const c2 = document.createElement('canvas');
    c2.width = Math.round(W * K); c2.height = Math.round(H * K);
    const g = c2.getContext('2d');
    g.scale(K, K);
    g.fillStyle = '#fcfbf9';
    g.fillRect(0, 0, W, H);

    g.fillStyle = '#171615';
    g.font = `800 60px ${UI}`;
    g.fillText('COSLAB KOREA', 160, 210);
    g.font = `500 40px ${UI}`;
    g.fillStyle = '#736e65';
    g.textAlign = 'right';
    g.fillText('LIPTINT PRINT ARTWORK · FRONT AREA', W - 160, 210);
    g.textAlign = 'left';

    g.fillStyle = '#e5dfd5';
    g.fillRect(160, 255, W - 320, 2);

    const flats = [
      await renderFlatCanvas(design, 'cap', { scale: 6 * K, fonts }),
      await renderFlatCanvas(design, 'base', { scale: 6 * K, fonts })
    ];
    const labels = [t('editor.upPart'), t('editor.btnPart')];
    const maxH = 1700, colW = (W - 320) / 2;

    flats.forEach((f, i) => {
      const s = Math.min(maxH / f.canvas.height, (colW - 300) / f.canvas.width);
      const w = f.canvas.width * s, h = f.canvas.height * s;
      const cx = 160 + colW * i + colW / 2;
      const top = 380;

      g.drawImage(f.canvas, cx - w / 2, top, w, h);

      // Crop marks (Settings → Crop & Bleed Marks)
      if (showCropMarks) {
        g.strokeStyle = '#171615';
        g.lineWidth = 3;
        [[cx - w / 2, top], [cx + w / 2, top], [cx - w / 2, top + h], [cx + w / 2, top + h]].forEach(([px, py]) => {
          const dx = px < cx ? -1 : 1, dy = py < top + 1 ? -1 : 1;
          g.beginPath();
          g.moveTo(px + dx * 20, py); g.lineTo(px + dx * 80, py);
          g.moveTo(px, py + dy * 20); g.lineTo(px, py + dy * 80);
          g.stroke();
        });
      }

      g.fillStyle = '#171615';
      g.font = `600 44px ${UI}`;
      g.textAlign = 'center';
      g.fillText(labels[i], cx, top + h + 130);

      g.fillStyle = '#736e65';
      g.font = `400 34px ${UI}`;
      g.fillText(`${f.rect.mm.w} × ${f.rect.mm.h} mm · ${f.canvas.width} × ${f.canvas.height} px`, cx, top + h + 190);
      g.textAlign = 'left';
    });

    g.fillStyle = '#9e978c';
    g.font = `400 30px ${UI}`;
    g.fillText(t('pdf.flatNote'), 160, H - 90);
    g.fillStyle = '#6b4e1f';
    g.font = `500 28px ${UI}`;
    g.fillText('⚠ ' + t('flow.disclaimer'), 160, H - 140, W - 320);

    return [c1, c2];
  }

  /** view: '2d' | '3d' — how the tube is pictured (SVG artwork is always 2D) */
  async function exportDesign(design, fmt, view = '2d') {
    const base = CL.slug(design.name || ('coslab-liptint-' + design.model)) + (view === '3d' && fmt !== 'svg' ? '-3d' : '');
    CL.toast(t('editor.exporting'), 'download');
    try {
      if (fmt === 'svg') {
        const svg = CL.render.renderSVG(design, {
          fontCSS: await fontCSS(design),
          width: 920,
          height: 1280,
          dieline: (CL.store.settings || {}).outlineVector !== false,
        });
        const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
        CL.download(url, base + '.svg');
        setTimeout(() => URL.revokeObjectURL(url), 4000);
      } else if (fmt === 'png' || fmt === 'jpg') {
        const background = fmt === 'jpg' ? '#faf9f6' : null;
        const c = view === '3d' ? await renderCanvas3D(design, { background }) : await renderCanvas(design, { scale: 4, background });
        CL.download(c.toDataURL(fmt === 'jpg' ? 'image/jpeg' : 'image/png', 0.95), `${base}.${fmt}`);
      } else if (fmt === 'pdf') {
        await CL.loadPdf();
        const pages = await buildSpecPages(design, view);
        const JsPDF = window.jspdf && window.jspdf.jsPDF;
        if (!JsPDF) throw new Error('jsPDF missing');
        const pdf = new JsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4', compress: true });
        pages.forEach((c, i) => {
          if (i) pdf.addPage('a4', 'landscape');
          pdf.addImage(c.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, 297, 210);
        });
        pdf.setProperties({ title: design.name || 'COSLAB Liptint Spec', creator: 'COSLAB KOREA Liptint Studio' });
        pdf.save(base + '.pdf');
      }
      CL.toast(t('editor.exported'));
      return true;
    } catch (e) {
      console.error(e);
      CL.toast(t('editor.exportFailed'), 'info');
      return false;
    }
  }

  CL.exporter = {
    fontCSS,
    rasterize,
    renderCanvas,
    renderCanvas3D,
    renderFlatCanvas,
    renderArtCanvas,
    buildSpecPages,
    exportDesign,
  };
})(window.CL);
