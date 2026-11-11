/* ==========================================================
   Local store (localStorage). Will be swapped for the backend
   API later — keep all persistence behind this module.
   ========================================================== */
(function (CL) {
  const K = { settings: 'coslab.settings', designs: 'coslab.designs', draft: 'coslab.draft' };

  function read(key, fallback) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; }
  }
  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (e) { console.warn('[store] write failed', e); return false; }
  }

  function detectLang() {
    const nav = (navigator.languages || [navigator.language || 'vi']).map((l) => l.slice(0, 2).toLowerCase());
    const supported = I18N.LANGS.map((l) => l.code);
    return nav.find((l) => supported.includes(l)) || 'vi';
  }

  const defaults = () => ({
    lang: detectLang(),
    theme: 'light',
    autoRotate3D: true,
    highQuality3D: true,
    cropMarks: true,
    exportDPI: 300,
    author: { name: '', brand: '', email: '', phone: '' },
  });

  CL.store = {
    settings: Object.assign(defaults(), read(K.settings, {})),
    saveSettings(patch) {
      Object.assign(this.settings, patch);
      write(K.settings, this.settings);
    },

    listDesigns() { return read(K.designs, []).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)); },
    getDesign(id) { return read(K.designs, []).find((d) => d.id === id) || null; },
    /** Returns false when storage quota is exceeded. */
    saveDesign(design) {
      const list = read(K.designs, []);
      const now = Date.now();
      const d = CL.clone(design);
      d.updatedAt = now;
      if (!d.id || d.id.startsWith('tpl_')) d.id = CL.uid('dsn');
      if (!d.createdAt) d.createdAt = now;
      const i = list.findIndex((x) => x.id === d.id);
      if (i >= 0) list[i] = d; else list.unshift(d);
      return write(K.designs, list) ? d : false;
    },
    deleteDesign(id) { write(K.designs, read(K.designs, []).filter((d) => d.id !== id)); },
    duplicateDesign(id) {
      const d = this.getDesign(id); if (!d) return null;
      const c = CL.clone(d); c.id = null; c.createdAt = null; c.name = (c.name || '') + ' (copy)';
      return this.saveDesign(c);
    },

    getDraft() { return read(K.draft, null); },
    saveDraft(d) { return write(K.draft, d); },
    clearDraft() { localStorage.removeItem(K.draft); },
  };
})(window.CL);
