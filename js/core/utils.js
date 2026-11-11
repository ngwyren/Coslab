/* ==========================================================
   Utilities — global namespace CL
   ========================================================== */
(function (global) {
  const CL = (global.CL = global.CL || {});

  CL.uid = (p = 'id') => p + '_' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);
  CL.clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  CL.round = (v, d = 2) => Math.round(v * 10 ** d) / 10 ** d;
  CL.clone = (o) => JSON.parse(JSON.stringify(o));
  CL.debounce = (fn, ms = 200) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

  CL.esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /** Tiny element helper: h('div.cls#id', {attrs}, children) */
  CL.h = function (tag, attrs, ...children) {
    const m = tag.match(/^([a-z0-9-]+)?((?:[.#][\w-]+)*)$/i);
    const el = document.createElement((m && m[1]) || 'div');
    if (m && m[2]) m[2].replace(/([.#])([\w-]+)/g, (_, s, n) => (s === '.' ? el.classList.add(n) : (el.id = n)));
    if (attrs) {
      for (const [k, v] of Object.entries(attrs)) {
        if (v === undefined || v === null || v === false) continue;
        if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
        else if (k === 'html') el.innerHTML = v;
        else if (k === 'text') el.textContent = v;
        else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
        else el.setAttribute(k, v === true ? '' : v);
      }
    }
    children.flat().forEach((c) => { if (c !== null && c !== undefined && c !== false) el.append(c.nodeType ? c : document.createTextNode(c)); });
    return el;
  };

  CL.formatDate = (ts) => {
    try {
      return new Intl.DateTimeFormat(I18N.meta.locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(ts));
    } catch (e) { return new Date(ts).toLocaleString(); }
  };

  CL.download = (href, filename) => {
    const a = document.createElement('a');
    a.href = href; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
  };

  CL.slug = (s) => (String(s || 'coslab').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'coslab');

  /* ---------- Colour helpers ---------- */
  CL.color = {
    hexToRgb(hex) {
      let h = String(hex).replace('#', '').trim();
      if (h.length === 3) h = h.split('').map((c) => c + c).join('');
      const n = parseInt(h.slice(0, 6), 16);
      if (isNaN(n)) return { r: 0, g: 0, b: 0 };
      return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
    },
    rgbToHex({ r, g, b }) { return '#' + [r, g, b].map((v) => Math.round(CL.clamp(v, 0, 255)).toString(16).padStart(2, '0')).join(''); },
    rgbToHsv({ r, g, b }) {
      r /= 255; g /= 255; b /= 255;
      const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
      let h = 0;
      if (d) {
        if (max === r) h = ((g - b) / d) % 6; else if (max === g) h = (b - r) / d + 2; else h = (r - g) / d + 4;
        h *= 60; if (h < 0) h += 360;
      }
      return { h, s: max ? d / max : 0, v: max };
    },
    hsvToRgb({ h, s, v }) {
      const c = v * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = v - c;
      let r = 0, g = 0, b = 0;
      if (h < 60) [r, g, b] = [c, x, 0]; else if (h < 120) [r, g, b] = [x, c, 0]; else if (h < 180) [r, g, b] = [0, c, x];
      else if (h < 240) [r, g, b] = [0, x, c]; else if (h < 300) [r, g, b] = [x, 0, c]; else [r, g, b] = [c, 0, x];
      return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 };
    },
    isHex(s) { return /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.test(String(s).trim()); },
    normalize(s) { let h = String(s).trim(); if (!h.startsWith('#')) h = '#' + h; return CL.color.rgbToHex(CL.color.hexToRgb(h)); },
    luminance(hex) { const { r, g, b } = CL.color.hexToRgb(hex); return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255; },
    mix(a, b, t) { const A = CL.color.hexToRgb(a), B = CL.color.hexToRgb(b); return CL.color.rgbToHex({ r: A.r + (B.r - A.r) * t, g: A.g + (B.g - A.g) * t, b: A.b + (B.b - A.b) * t }); },
  };

  /** Read a File as data URL; raster images are downscaled to keep storage small. */
  CL.readImageFile = function (file, maxSide = 1400) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        const src = reader.result;
        const img = new Image();
        img.onload = () => {
          let w = img.naturalWidth || 300, h = img.naturalHeight || 300;
          const isSvg = file.type === 'image/svg+xml' || /\.svg$/i.test(file.name);
          if (isSvg) return resolve({ src, w, h });
          const k = Math.min(1, maxSide / Math.max(w, h));
          if (k >= 1 && file.size < 600 * 1024) return resolve({ src, w, h });
          const c = document.createElement('canvas');
          c.width = Math.round(w * k); c.height = Math.round(h * k);
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          resolve({ src: c.toDataURL(file.type === 'image/jpeg' ? 'image/jpeg' : 'image/png', 0.92), w: c.width, h: c.height });
        };
        img.onerror = () => reject(new Error('decode'));
        img.src = src;
      };
      reader.readAsDataURL(file);
    });
  };

  /** Client-side "remove white background": makes near-white pixels transparent. */
  CL.removeWhiteBackground = function (src, threshold = 238, softness = 18) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = img.naturalWidth; c.height = img.naturalHeight;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const d = ctx.getImageData(0, 0, c.width, c.height);
        const p = d.data;
        for (let i = 0; i < p.length; i += 4) {
          const m = Math.min(p[i], p[i + 1], p[i + 2]);
          if (m >= threshold) p[i + 3] = 0;
          else if (m >= threshold - softness) p[i + 3] = Math.round(p[i + 3] * (threshold - m) / softness);
        }
        ctx.putImageData(d, 0, 0);
        resolve(c.toDataURL('image/png'));
      };
      img.onerror = reject;
      img.src = src;
    });
  };
})(window);
