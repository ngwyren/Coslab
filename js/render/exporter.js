/* ==========================================================
   Exporter: font embedding, rasterising, PNG/JPG/SVG/PDF
   ========================================================== */
(function (CL) {
  const cssCache = new Map();   // request url -> css text
  const fileCache = new Map();  // font file url -> data url

  /* ---------- Fonts ---------- */
  function usedText(design) {
    return design.layers.filter((l) => l.type === 'text' && l.visible).map((l) => l.text.content).join('') + 'COSLAB';
  }

  function fallbackFamilies(text) {
    const fams = [];
    if (/[\u4e00-\u9fff\u3400-\u4dbf]/.test(text)) fams.push('Noto Sans SC');
    if (/[\u3040-\u30ff]/.test(text)) fams.push('Noto Sans JP');
    if (/[\uac00-\ud7af\u1100-\u11ff]/.test(text)) fams.push('Noto Sans KR');
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
    const urls = [`https://fonts.googleapis.com/css2?family=${fam}:ital,wght@${v}&display=swap`, `https://fonts.googleapis.com/css2?family=${fam}&display=swap`];
    for (const url of urls) {
      if (cssCache.has(url)) return cssCache.get(url);
      try {
        const r = await fetch(url);
        if (!r.ok) continue;
        const css = await r.text();
        cssCache.set(url, css);
        return css;
      } catch (e) { /* offline */ }
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

  /** Build @font-face CSS (fonts inlined as data URLs) for everything a design uses. */
  async function fontCSS(design) {
    const text = usedText(design);
    const cps = [...new Set([...text].map((c) => c.codePointAt(0)))];
    const fams = new Map();
    design.layers.filter((l) => l.type === 'text' && l.visible).forEach((l) => {
      const k = l.text.font; if (!fams.has(k)) fams.set(k, new Set());
      fams.get(k).add(`${l.text.italic ? 1 : 0}|${l.text.weight || 400}`);
    });
    fallbackFamilies(text).forEach((f) => { if (!fams.has(f)) fams.set(f, new Set(['0|400', '0|700'])); });
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
        try { out.push(blk.replace(m[1], await toDataURL(m[1]))); } catch (e) { /* skip */ }
      }
    }
    return out.join('\n');
  }

  /* ---------- Rasterise ---------- */
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
    c.width = Math.round(w); c.height = Math.round(h);
    const ctx = c.getContext('2d');
    if (background) { ctx.fillStyle = background; ctx.fillRect(0, 0, c.width, c.height); }
    ctx.drawImage(img, 0, 0, c.width, c.height);
    return c;
  }

  /** Full product render as canvas. */
  async function renderCanvas(design, { scale = 3, background = null, fonts } = {}) {
    const css = fonts !== undefined ? fonts : await fontCSS(design);
    const S = CL.models.SCENE;
    const svg = CL.render.renderSVG(design, { fontCSS: css, width: S.w * scale, height: S.h * scale });
    return rasterize(svg, S.w * scale, S.h * scale, background);
  }

  async function renderFlatCanvas(design, part, { scale = 4, fonts } = {}) {
    const css = fonts !== undefined ? fonts : await fontCSS(design);
    const f = CL.render.renderPartFlat(design, part, { scale, fontCSS: css });
    return { canvas: await rasterize(f.svg, f.w, f.h), rect: f.rect };
  }

  /* ---------- PDF specification sheet (drawn on canvas → supports every script) ---------- */
  function fillDesc(fill) {
    if (!fill) return '-';
    if (fill.type === 'solid') return fill.color.toUpperCase();
    return `${t('editor.colors.gradient')} ${fill.angle}° · ${fill.stops.map((s) => s.c.toUpperCase()).join(' → ')}`;
  }
  function paintSwatch(ctx, fill, x, y, r) {
    ctx.save();
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    if (fill && fill.type === 'linear') {
      const g = ctx.createLinearGradient(x - r, y - r, x + r, y + r);
      fill.stops.forEach((s) => g.addColorStop(s.o, s.c));
      ctx.fillStyle = g;
    } else ctx.fillStyle = (fill && fill.color) || '#ccc';
    ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#d9d9d9'; ctx.stroke();
    ctx.restore();
  }

  async function buildSpecPages(design) {
    const fonts = await fontCSS(design);
    const W = 3508, H = 2480; // A4 landscape @300dpi
    const UI = "Inter, 'Noto Sans SC', 'Noto Sans JP', 'Noto Sans KR', 'Noto Naskh Arabic', 'Segoe UI', sans-serif";
    const rtl = I18N.meta.dir === 'rtl';
    const author = CL.store.settings.author || {};
    const name = design.name || t('editor.untitled');

    // ---- Page 1
    const c1 = document.createElement('canvas'); c1.width = W; c1.height = H;
    const ctx = c1.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
    ctx.direction = rtl ? 'rtl' : 'ltr';
    // header
    ctx.fillStyle = '#0b0b0b'; ctx.font = `800 64px ${UI}`; ctx.textBaseline = 'alphabetic';
    ctx.fillText('COSLAB', 160, 220);
    ctx.font = `500 44px ${UI}`; ctx.fillStyle = '#777';
    ctx.textAlign = 'right'; ctx.fillText(t('pdf.title'), W - 160, 220); ctx.textAlign = 'left';
    ctx.fillStyle = '#e6e6e6'; ctx.fillRect(160, 270, W - 320, 3);

    // product render panel
    ctx.fillStyle = '#f4f4f4';
    roundRectPath(ctx, 160, 340, 1500, 1900, 48); ctx.fill();
    const prod = await renderCanvas(design, { scale: 3, fonts });
    const k = Math.min(1400 / prod.width, 1800 / prod.height);
    ctx.drawImage(prod, 160 + (1500 - prod.width * k) / 2, 340 + (1900 - prod.height * k) / 2, prod.width * k, prod.height * k);

    // details
    let x = 1800, y = 430;
    ctx.fillStyle = '#0b0b0b'; ctx.font = `600 84px ${UI}`; ctx.fillText(name, x, y);
    y += 80; ctx.font = `400 38px ${UI}`; ctx.fillStyle = '#777';
    ctx.fillText(CL.formatDate(Date.now()), x, y);

    const rows = [
      [t('pdf.model'), t('models.' + design.model)],
      [t('pdf.template'), t('templates.' + (design.templateId || 'blank'))],
      [t('pdf.author'), author.name || '—'],
      [t('pdf.brand'), author.brand || '—'],
    ];
    y += 110;
    rows.forEach(([a, b]) => {
      ctx.fillStyle = '#777'; ctx.font = `500 36px ${UI}`; ctx.fillText(a, x, y);
      ctx.fillStyle = '#0b0b0b'; ctx.font = `500 40px ${UI}`; ctx.fillText(b, x + 460, y);
      y += 74;
    });

    y += 40; ctx.fillStyle = '#e6e6e6'; ctx.fillRect(x, y, W - 160 - x, 3); y += 90;
    ctx.fillStyle = '#0b0b0b'; ctx.font = `600 46px ${UI}`; ctx.fillText(t('pdf.parts'), x, y); y += 80;
    ['cap', 'base', 'sleeve', 'bullet'].forEach((p) => {
      const part = design.parts[p];
      paintSwatch(ctx, part.fill, x + 30, y - 14, 30);
      ctx.fillStyle = '#0b0b0b'; ctx.font = `500 38px ${UI}`; ctx.fillText(t('editor.parts.' + p), x + 90, y);
      ctx.fillStyle = '#555'; ctx.font = `400 34px ${UI}`;
      ctx.fillText(`${fillDesc(part.fill)}  ·  ${t('editor.colors.' + (part.finish || 'gloss'))}`, x + 620, y);
      y += 84;
    });

    y += 30; ctx.fillStyle = '#e6e6e6'; ctx.fillRect(x, y, W - 160 - x, 3); y += 90;
    ctx.fillStyle = '#0b0b0b'; ctx.font = `600 46px ${UI}`; ctx.fillText(t('pdf.layers'), x, y); y += 76;
    const layers = design.layers.filter((l) => l.visible);
    if (!layers.length) { ctx.fillStyle = '#777'; ctx.font = `400 34px ${UI}`; ctx.fillText('—', x, y); }
    layers.slice(0, 9).forEach((l, i) => {
      ctx.fillStyle = '#999'; ctx.font = `500 32px ${UI}`; ctx.fillText(String(i + 1).padStart(2, '0'), x, y);
      ctx.fillStyle = '#0b0b0b'; ctx.font = `400 34px ${UI}`;
      let label = l.type === 'text' ? `“${l.text.content.replace(/\n/g, ' ')}” — ${l.text.font} ${l.text.size}pt ${l.text.color.toUpperCase()}` : l.type === 'image' ? t('editor.graphics.logo') : `${t('editor.shapes.' + l.shape.kind)} ${l.shape.fill && l.shape.fill !== 'none' ? l.shape.fill.toUpperCase() : ''}`;
      if (label.length > 60) label = label.slice(0, 58) + '…';
      ctx.fillText(label, x + 80, y);
      ctx.fillStyle = '#777'; ctx.textAlign = 'right'; ctx.fillText(t('editor.parts.' + l.part), W - 160, y); ctx.textAlign = 'left';
      y += 62;
    });
    if (layers.length > 9) { ctx.fillStyle = '#777'; ctx.fillText(`+${layers.length - 9}`, x + 80, y); }

    ctx.fillStyle = '#aaa'; ctx.font = `400 30px ${UI}`; ctx.fillText(t('pdf.generatedBy'), 160, H - 110);

    // ---- Page 2: artwork flats
    const c2 = document.createElement('canvas'); c2.width = W; c2.height = H;
    const g = c2.getContext('2d'); g.direction = ctx.direction;
    g.fillStyle = '#fff'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#0b0b0b'; g.font = `800 64px ${UI}`; g.fillText('COSLAB', 160, 220);
    g.font = `500 44px ${UI}`; g.fillStyle = '#777'; g.textAlign = 'right'; g.fillText(t('pdf.artwork'), W - 160, 220); g.textAlign = 'left';
    g.fillStyle = '#e6e6e6'; g.fillRect(160, 270, W - 320, 3);
    const flats = [await renderFlatCanvas(design, 'cap', { scale: 6, fonts }), await renderFlatCanvas(design, 'base', { scale: 6, fonts })];
    const labels = [t('editor.parts.cap'), t('editor.parts.base')];
    const maxH = 1700, colW = (W - 320) / 2;
    flats.forEach((f, i) => {
      const s = Math.min(maxH / f.canvas.height, (colW - 300) / f.canvas.width);
      const w = f.canvas.width * s, h = f.canvas.height * s;
      const cx = 160 + colW * i + colW / 2;
      const top = 420;
      // crop marks
      g.drawImage(f.canvas, cx - w / 2, top, w, h);
      g.strokeStyle = '#0b0b0b'; g.lineWidth = 3;
      [[cx - w / 2, top], [cx + w / 2, top], [cx - w / 2, top + h], [cx + w / 2, top + h]].forEach(([px, py]) => {
        const dx = px < cx ? -1 : 1, dy = py < top + 1 ? -1 : 1;
        g.beginPath(); g.moveTo(px + dx * 20, py); g.lineTo(px + dx * 80, py); g.moveTo(px, py + dy * 20); g.lineTo(px, py + dy * 80); g.stroke();
      });
      g.fillStyle = '#0b0b0b'; g.font = `600 44px ${UI}`; g.textAlign = 'center';
      g.fillText(labels[i], cx, top + h + 140);
      g.fillStyle = '#777'; g.font = `400 34px ${UI}`;
      g.fillText(`${f.canvas.width} × ${f.canvas.height} px · ${t('pdf.ratio')} ${CL.round(f.rect.w / f.rect.h, 3)}`, cx, top + h + 200);
      g.textAlign = 'left';
    });
    g.fillStyle = '#aaa'; g.font = `400 30px ${UI}`; g.fillText(t('pdf.flatNote'), 160, H - 110);
    return [c1, c2];
  }

  function roundRectPath(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  /* ---------- Public export ---------- */
  async function exportDesign(design, fmt) {
    const base = CL.slug(design.name || ('coslab-' + design.model));
    CL.toast(t('editor.exporting'), 'download');
    try {
      if (fmt === 'svg') {
        const svg = CL.render.renderSVG(design, { fontCSS: await fontCSS(design), width: 1040, height: 1240 });
        const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
        CL.download(url, base + '.svg'); setTimeout(() => URL.revokeObjectURL(url), 4000);
      } else if (fmt === 'png' || fmt === 'jpg') {
        const c = await renderCanvas(design, { scale: 4, background: fmt === 'jpg' ? '#ffffff' : null });
        CL.download(c.toDataURL(fmt === 'jpg' ? 'image/jpeg' : 'image/png', 0.95), `${base}.${fmt}`);
      } else if (fmt === 'pdf') {
        const pages = await buildSpecPages(design);
        const JsPDF = window.jspdf && window.jspdf.jsPDF;
        if (!JsPDF) throw new Error('jsPDF missing');
        const pdf = new JsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4', compress: true });
        pages.forEach((c, i) => { if (i) pdf.addPage('a4', 'landscape'); pdf.addImage(c.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, 297, 210); });
        pdf.setProperties({ title: design.name || 'COSLAB design', creator: 'COSLAB Design Studio' });
        pdf.save(base + '.pdf');
      }
      CL.toast(t('editor.exported'));
    } catch (e) {
      console.error(e);
      CL.toast(t('editor.exportFailed'), 'info');
    }
  }

  CL.exporter = { fontCSS, rasterize, renderCanvas, renderFlatCanvas, exportDesign };
})(window.CL);
