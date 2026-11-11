/* ==========================================================
   COSLAB — Liptint Templates (Korean K-Beauty Aesthetics)
   Curated aesthetics: Velvet Blur, Dewy Glow, Cold Chrome,
   Sculpted Ice, and Porcelain MLBB.
   ========================================================== */
(function (CL) {
  const solid = (color) => ({ type: 'solid', color });
  const grad = (a, b, angle = 180) => ({ type: 'linear', angle, stops: [{ o: 0, c: a }, { o: 1, c: b }] });

  let n = 0;
  const base = (o) => Object.assign({
    id: 'L' + (++n),
    x: 0.5,
    y: 0.5,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    flipX: false,
    flipY: false,
  }, o);

  const T = (part, content, o = {}) => base({
    type: 'text',
    part,
    name: content,
    x: o.x ?? 0.5,
    y: o.y ?? 0.5,
    rotation: o.rotation || 0,
    text: {
      content,
      font: o.font || 'Plus Jakarta Sans',
      size: o.size || 18,
      weight: o.weight || 600,
      italic: !!o.italic,
      color: o.color || '#171615',
      spacing: o.spacing || 0,
      align: 'center',
      lineHeight: 1.2,
    },
  });

  const S = (part, kind, o = {}) => base({
    type: 'shape',
    part,
    name: kind,
    x: o.x ?? 0.5,
    y: o.y ?? 0.5,
    rotation: o.rotation || 0,
    shape: {
      kind,
      w: o.w || 36,
      h: o.h || 36,
      fill: o.fill || '#171615',
      stroke: o.stroke || null,
      strokeWidth: o.strokeWidth || 0,
    },
  });

  const TEMPLATES = [
    {
      templateId: 'velvet-rose',
      category: 'k-velvet',
      parts: {
        cap: { fill: solid('#b85c66'), finish: 'matte' },
        ring: { fill: solid('#d4a896'), finish: 'satin' },
        base: { fill: solid('#b85c66'), finish: 'matte' },
      },
      layers: [
        T('base', 'COSLAB VELVET TINT', { y: 0.5, rotation: -90, font: 'Plus Jakarta Sans', weight: 700, size: 14, spacing: 6, color: '#fcfbf9' }),
        T('cap', '01 ROSÉ', { y: 0.8, font: 'Cinzel', weight: 600, size: 13, spacing: 3, color: '#fcfbf9' }),
      ],
    },
    {
      templateId: 'seoul-noir',
      category: 'k-luxury',
      parts: {
        cap: { fill: solid('#121211'), finish: 'gloss' },
        ring: { fill: solid('#c5a367'), finish: 'metallic' },
        base: { fill: solid('#121211'), finish: 'gloss' },
      },
      layers: [
        T('base', 'HERA ATELIER', { y: 0.48, rotation: -90, font: 'Cinzel', weight: 700, size: 16, spacing: 8, color: '#ffffff' }),
        T('cap', 'SEOUL', { y: 0.82, font: 'Plus Jakarta Sans', weight: 600, size: 11, spacing: 5, color: '#c5a367' }),
      ],
    },
    {
      templateId: 'dewy-glass',
      category: 'k-dewy',
      parts: {
        cap: { fill: solid('#fbfaf7'), finish: 'gloss' },
        ring: { fill: solid('#e5e0d8'), finish: 'metallic' },
        base: { fill: solid('#fbfaf7'), finish: 'gloss' },
        tint: { color: '#c94d5b' },
      },
      layers: [
        T('base', 'DEW DROP WATER TINT', { y: 0.52, rotation: -90, font: 'Plus Jakarta Sans', weight: 500, size: 12, spacing: 5, color: '#171615' }),
        S('cap', 'circle', { y: 0.5, w: 48, h: 48, fill: 'none', stroke: '#171615', strokeWidth: 1.2 }),
        T('cap', 'CL', { y: 0.5, font: 'Italiana', weight: 400, size: 24, color: '#171615' }),
      ],
    },
    {
      templateId: 'chrome-minimal',
      category: 'k-tamburins',
      parts: {
        cap: { fill: solid('#d9d9d9'), finish: 'metallic' },
        ring: { fill: solid('#171615'), finish: 'matte' },
        base: { fill: solid('#f6f4ee'), finish: 'matte' },
      },
      layers: [
        T('base', 'TAMBURINS 712', { y: 0.46, rotation: -90, font: 'Plus Jakarta Sans', weight: 700, size: 14, spacing: 6, color: '#171615' }),
        T('base', 'FORMULA ATELIER', { y: 0.78, rotation: -90, font: 'Plus Jakarta Sans', weight: 400, size: 10, spacing: 4, color: '#736e65' }),
        S('cap', 'line', { y: 0.75, w: 40, h: 1.5, fill: '#171615' }),
      ],
    },
    {
      templateId: 'fig-mauve',
      category: 'k-velvet',
      parts: {
        cap: { fill: solid('#8a4c58'), finish: 'satin' },
        ring: { fill: solid('#d8b8a8'), finish: 'metallic' },
        base: { fill: solid('#8a4c58'), finish: 'satin' },
      },
      layers: [
        T('base', 'Muted Fig', { y: 0.5, rotation: -90, font: 'Cormorant Garamond', weight: 600, italic: true, size: 28, color: '#fcfbf9' }),
        T('cap', 'N° 04', { y: 0.8, font: 'Plus Jakarta Sans', weight: 600, size: 12, spacing: 3, color: '#fcfbf9' }),
      ],
    },
    {
      templateId: 'porcelain-ivory',
      category: 'k-luxury',
      parts: {
        cap: { fill: solid('#f5f0e6'), finish: 'satin' },
        ring: { fill: solid('#c5a367'), finish: 'metallic' },
        base: { fill: solid('#f5f0e6'), finish: 'satin' },
      },
      layers: [
        T('base', 'COSLAB KOREA', { y: 0.5, rotation: -90, font: 'Cinzel', weight: 600, size: 15, spacing: 7, color: '#2b2926' }),
        S('cap', 'diamond', { y: 0.5, w: 22, h: 32, fill: '#c5a367' }),
      ],
    },
    {
      templateId: 'chili-gradient',
      category: 'k-gradient',
      parts: {
        cap: { fill: grad('#df705e', '#a63428'), finish: 'gloss' },
        ring: { fill: solid('#e6d5ca'), finish: 'metallic' },
        base: { fill: grad('#a63428', '#df705e'), finish: 'gloss' },
      },
      layers: [
        T('base', 'GLOW SUNSET', { y: 0.5, rotation: -90, font: 'Bebas Neue', weight: 400, size: 30, spacing: 8, color: '#ffffff' }),
        T('cap', 'K-TINT', { y: 0.82, font: 'Plus Jakarta Sans', weight: 800, size: 11, spacing: 5, color: '#ffffff' }),
      ],
    },
    {
      templateId: 'blank-liptint',
      category: 'k-minimal',
      parts: {
        cap: { fill: solid('#f4f2ec'), finish: 'matte' },
        ring: { fill: solid('#ded9ce'), finish: 'satin' },
        base: { fill: solid('#f4f2ec'), finish: 'matte' },
      },
      layers: [],
    },
  ];

  function createDesign(templateId = 'velvet-rose', modelId = 'velvet-round') {
    const tpl = TEMPLATES.find((x) => x.templateId === templateId) || TEMPLATES[0];
    const d = CL.clone(tpl);
    (d.layers || []).forEach((l) => (l.id = CL.uid('ly')));

    return {
      id: null,
      name: '',
      model: modelId,
      templateId: tpl.templateId,
      parts: d.parts,
      layers: d.layers,
      createdAt: null,
      updatedAt: null,
    };
  }

  const SAMPLES = [
    ['velvet-rose', 'velvet-round'],
    ['seoul-noir', 'square-monolith'],
    ['dewy-glass', 'dewy-crystal'],
    ['chrome-minimal', 'slim-atelier'],
    ['fig-mauve', 'chubby-pot'],
    ['porcelain-ivory', 'velvet-round'],
    ['chili-gradient', 'dewy-crystal'],
    ['chrome-minimal', 'square-monolith'],
  ];

  CL.templates = {
    TEMPLATES,
    SAMPLES,
    createDesign,
    CATEGORIES: ['all', 'k-velvet', 'k-dewy', 'k-luxury', 'k-tamburins', 'k-gradient', 'k-minimal'],
  };
})(window.CL);
