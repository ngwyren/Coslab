/* ==========================================================
   Templates (sample products). Later: fetched from backend
   so the factory can auto-update the gallery.
   ========================================================== */
(function (CL) {
  const solid = (color) => ({ type: 'solid', color });
  const grad = (a, b, angle = 180) => ({ type: 'linear', angle, stops: [{ o: 0, c: a }, { o: 1, c: b }] });

  let n = 0;
  const base = (o) => Object.assign({ id: 'L' + (++n), x: 0.5, y: 0.5, rotation: 0, opacity: 1, visible: true, locked: false, flipX: false, flipY: false }, o);
  const T = (part, content, o = {}) => base({
    type: 'text', part, name: content, x: o.x, y: o.y, rotation: o.rotation || 0,
    text: { content, font: o.font || 'Inter', size: o.size || 20, weight: o.weight || 600, italic: !!o.italic, color: o.color || '#111111', spacing: o.spacing || 0, align: 'center', lineHeight: 1.2 },
  });
  const S = (part, kind, o = {}) => base({
    type: 'shape', part, name: kind, x: o.x, y: o.y, rotation: o.rotation || 0,
    shape: { kind, w: o.w || 40, h: o.h || 40, fill: o.fill || '#111111', stroke: o.stroke || null, strokeWidth: o.strokeWidth || 0 },
  });

  const TEMPLATES = [
    {
      templateId: 'blank', category: 'minimal',
      parts: { cap: { fill: solid('#f2f2f2'), finish: 'gloss' }, base: { fill: solid('#f2f2f2'), finish: 'gloss' }, sleeve: { fill: solid('#cfcfcf'), finish: 'metallic' }, bullet: { fill: solid('#b3173c'), finish: 'satin' } },
      layers: [],
    },
    {
      templateId: 'noir', category: 'luxury',
      parts: { cap: { fill: solid('#0e0e0e'), finish: 'gloss' }, base: { fill: solid('#0e0e0e'), finish: 'gloss' }, sleeve: { fill: solid('#d7d7d7'), finish: 'metallic' }, bullet: { fill: solid('#8f0f2a'), finish: 'satin' } },
      layers: [
        T('base', 'COSLAB', { y: 0.5, rotation: -90, font: 'Montserrat', weight: 800, size: 24, spacing: 9, color: '#ffffff' }),
        T('cap', 'N°01', { y: 0.86, font: 'Cormorant Garamond', weight: 700, size: 18, color: '#ffffff', spacing: 2 }),
      ],
    },
    {
      templateId: 'ivory', category: 'minimal',
      parts: { cap: { fill: solid('#f3eee7'), finish: 'satin' }, base: { fill: solid('#f3eee7'), finish: 'satin' }, sleeve: { fill: solid('#d9c4a3'), finish: 'metallic' }, bullet: { fill: solid('#c4545e'), finish: 'satin' } },
      layers: [
        T('base', 'Maison', { y: 0.5, rotation: -90, font: 'Great Vibes', weight: 400, size: 44, color: '#1a1a1a' }),
        S('cap', 'line', { y: 0.78, w: 56, h: 1.5, fill: '#1a1a1a' }),
        T('cap', 'COSLAB', { y: 0.86, font: 'Inter', weight: 600, size: 11, spacing: 5, color: '#1a1a1a' }),
      ],
    },
    {
      templateId: 'monogram', category: 'typographic',
      parts: { cap: { fill: solid('#141414'), finish: 'matte' }, base: { fill: solid('#141414'), finish: 'matte' }, sleeve: { fill: solid('#bdbdbd'), finish: 'metallic' }, bullet: { fill: solid('#a3223f'), finish: 'matte' } },
      layers: [
        T('cap', 'CL', { y: 0.5, font: 'Playfair Display', weight: 700, size: 52, color: '#ffffff' }),
        S('cap', 'circle', { y: 0.5, w: 84, h: 84, fill: 'none', stroke: '#ffffff', strokeWidth: 1.2 }),
        T('base', 'PARIS · SEOUL · TOKYO', { y: 0.5, rotation: -90, font: 'Inter', weight: 500, size: 11, spacing: 4, color: '#ffffff' }),
      ],
    },
    {
      templateId: 'sunset', category: 'gradient',
      parts: { cap: { fill: grad('#ffb199', '#ff0844'), finish: 'gloss' }, base: { fill: grad('#ff0844', '#ffb199'), finish: 'gloss' }, sleeve: { fill: solid('#e9e9e9'), finish: 'metallic' }, bullet: { fill: solid('#e0245e'), finish: 'gloss' } },
      layers: [
        T('base', 'Sunset', { y: 0.5, rotation: -90, font: 'Dancing Script', weight: 700, size: 44, color: '#ffffff' }),
        T('cap', 'COSLAB', { y: 0.88, font: 'Montserrat', weight: 800, size: 11, spacing: 5, color: '#ffffff' }),
      ],
    },
    {
      templateId: 'luxe', category: 'luxury',
      parts: { cap: { fill: solid('#c9a24b'), finish: 'metallic' }, base: { fill: solid('#111111'), finish: 'gloss' }, sleeve: { fill: solid('#c9a24b'), finish: 'metallic' }, bullet: { fill: solid('#7a0c22'), finish: 'satin' } },
      layers: [
        T('base', 'LUXE', { y: 0.5, rotation: -90, font: 'Bebas Neue', weight: 400, size: 40, spacing: 12, color: '#c9a24b' }),
        S('cap', 'diamond', { y: 0.5, w: 26, h: 38, fill: '#111111' }),
      ],
    },
    {
      templateId: 'blush', category: 'minimal',
      parts: { cap: { fill: solid('#f5d6d9'), finish: 'satin' }, base: { fill: solid('#f5d6d9'), finish: 'satin' }, sleeve: { fill: solid('#e7c3b5'), finish: 'metallic' }, bullet: { fill: solid('#d26a7f'), finish: 'satin' } },
      layers: [
        T('base', 'blush', { y: 0.5, rotation: -90, font: 'Cormorant Garamond', weight: 400, italic: true, size: 46, color: '#6b2737' }),
        S('cap', 'heart', { y: 0.5, w: 30, h: 28, fill: '#6b2737' }),
      ],
    },
    {
      templateId: 'line', category: 'typographic',
      parts: { cap: { fill: solid('#fafafa'), finish: 'gloss' }, base: { fill: solid('#fafafa'), finish: 'gloss' }, sleeve: { fill: solid('#1a1a1a'), finish: 'gloss' }, bullet: { fill: solid('#c0132f'), finish: 'gloss' } },
      layers: [
        T('base', '01', { y: 0.36, font: 'Inter', weight: 300, size: 54, color: '#111111' }),
        S('base', 'line', { y: 0.6, w: 70, h: 1.5, fill: '#111111' }),
        T('base', 'ROUGE', { y: 0.68, font: 'Inter', weight: 600, size: 11, spacing: 6, color: '#111111' }),
        S('cap', 'rect', { y: 0.5, w: 2, h: 160, fill: '#111111' }),
      ],
    },
  ];

  /** Build a fresh design object from a template id + model id. */
  function createDesign(templateId = 'blank', modelId = 'classic') {
    const tpl = TEMPLATES.find((x) => x.templateId === templateId) || TEMPLATES[0];
    const d = CL.clone(tpl);
    d.layers.forEach((l) => (l.id = CL.uid('ly')));
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

  /** Gallery samples = templates paired with a showcase model. */
  const SAMPLES = [
    ['noir', 'classic'], ['ivory', 'slim'], ['sunset', 'bold'], ['luxe', 'square'],
    ['monogram', 'classic'], ['blush', 'liquid'], ['line', 'slim'], ['luxe', 'classic'],
    ['sunset', 'liquid'], ['noir', 'square'], ['blush', 'bold'], ['ivory', 'classic'],
  ];

  CL.templates = { TEMPLATES, SAMPLES, createDesign, CATEGORIES: ['all', 'minimal', 'luxury', 'gradient', 'typographic'] };
})(window.CL);
