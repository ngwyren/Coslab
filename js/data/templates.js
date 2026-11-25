/* ==========================================================
   COSLAB — Liptint Templates (Korean K-Beauty Aesthetics)
   Clean 2-part tubes (Cap + Base), balanced Safe Zone typography.
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
      size: o.size || 13,
      weight: o.weight || 600,
      italic: !!o.italic,
      color: o.color || '#171615',
      spacing: o.spacing || 0,
      align: 'center',
      lineHeight: 1.2,
    },
  });

  // Part helpers: `two` goes from the bottom colour to the top colour
  const part = (fill, surface = 'solid', finish = 'gloss') => ({ fill, finish, surface });
  const one = (c, finish) => part(solid(c), 'solid', finish);
  const two = (surface, bottom, top) => part(grad(bottom, top), surface);
  const jelly = (bottom, top = bottom) => two('clear-gradient', bottom, top);
  const CLEAR = '#fbfaf7';
  const WHITE = '#ffffff';
  const V = (text, o) => T('base', text, Object.assign({ rotation: -90 }, o)); // vertical lettering on the body

  // Archive designs — one per container (Pantone screen colours only)
  const TEMPLATES = [
    {
      templateId: 'cherry-jelly', model: 'cl-sc01', category: 'k-dewy',
      parts: { cap: jelly('#a6192e', '#eab8c3'), base: jelly('#a6192e') },
      layers: [T('base', 'cherry\njelly', { y: 0.6, font: 'Instrument Serif', italic: true, weight: 400, size: 44, color: WHITE })],
    },
    {
      templateId: 'soft-bun', model: 'cl-sc02', category: 'k-velvet',
      parts: { cap: one('#efdbb2', 'matte'), base: one('#efdbb2', 'matte') },
      layers: [V('soft bun', { font: 'Playfair Display', weight: 600, size: 38, color: '#93272c' })],
    },
    {
      templateId: 'red-cap', model: 'cl-sc03', category: 'k-dewy',
      parts: { cap: one('#c8102e'), base: jelly('#e5554f', CLEAR) },
      layers: [V('ROUGE 03', { y: 0.5, font: 'Bebas Neue', weight: 400, size: 50, spacing: 3, color: '#c8102e' })],
    },
    {
      templateId: 'peach-fizz', model: 'cl-sc04', category: 'k-gradient',
      parts: { cap: jelly('#e5554f', CLEAR), base: two('solid-gradient', '#e5554f', '#eab8c3') },
      layers: [V('fizz', { y: 0.55, font: 'Playfair Display', weight: 600, size: 72, color: WHITE })],
    },
    {
      templateId: 'petal-water', model: 'cl-sc05', category: 'k-dewy',
      parts: { cap: jelly(CLEAR), base: jelly('#eab8c3') },
      layers: [V('petal water', { font: 'Italiana', weight: 400, size: 36, spacing: 2, color: '#844551' })],
    },
    {
      templateId: 'mauve-line', model: 'cl-sc06', category: 'k-velvet',
      parts: { cap: one('#844551', 'matte'), base: one('#a56e75', 'matte') },
      layers: [
        V('MAUVE', { y: 0.62, font: 'Montserrat', weight: 700, size: 40, spacing: 5, color: WHITE }),
        T('cap', '06', { font: 'Montserrat', weight: 500, size: 18, color: '#eab8c3' }),
      ],
    },
    {
      templateId: 'noir-cherry', model: 'cl-ss01', category: 'k-luxury',
      parts: { cap: one('#101820'), base: jelly('#97233f') },
      layers: [T('base', 'noir', { y: 0.66, font: 'Playfair Display', weight: 600, size: 46, color: WHITE })],
    },
    {
      templateId: 'porcelain-rose', model: 'cl-ss02', category: 'k-luxury',
      parts: { cap: one('#f4f2ec'), base: one('#f4f2ec') },
      layers: [
        T('base', 'maison\nrosé', { y: 0.5, font: 'Cormorant Garamond', weight: 600, size: 34, color: '#97233f' }),
      ],
    },
    {
      templateId: 'berry-ombre', model: 'cl-ss03', category: 'k-gradient',
      parts: { cap: two('solid-gradient', '#97233f', '#eab8c3'), base: jelly('#97233f', '#eab8c3') },
      layers: [V('BERRY', { y: 0.68, font: 'Montserrat', weight: 700, size: 44, spacing: 4, color: WHITE })],
    },
    {
      templateId: 'sugar-glaze', model: 'cl-ss04', category: 'k-dewy',
      parts: { cap: jelly(CLEAR), base: part(solid('#eab8c3'), 'shimmer') },
      layers: [V('glaze', { font: 'Dancing Script', weight: 700, size: 66, color: '#844551' })],
    },
    {
      templateId: 'cocoa-milk', model: 'cl-ss05', category: 'k-minimal',
      parts: { cap: one('#c09c83', 'matte'), base: one('#e0c6ad', 'matte') },
      layers: [V('cocoa milk', { font: 'Plus Jakarta Sans', weight: 700, size: 40, color: '#93272c' })],
    },
    {
      templateId: 'tangerine-pop', model: 'cl-ss06', category: 'k-gradient',
      parts: { cap: jelly('#e1523d', CLEAR), base: jelly('#e1523d') },
      layers: [V('POP!', { y: 0.72, font: 'Bebas Neue', weight: 400, size: 66, spacing: 2, color: WHITE })],
    },
    {
      templateId: 'cloud-nude', model: 'cl-sc02', category: 'k-minimal',
      parts: { cap: one('#f4f2ec', 'matte'), base: two('solid-gradient', '#e0c6ad', '#f4f2ec') },
      layers: [T('base', 'cloud\nnude', { y: 0.55, font: 'Instrument Serif', italic: true, weight: 400, size: 46, color: '#93272c' })],
    },
    {
      templateId: 'plum-seoul', model: 'cl-sc03', category: 'k-dewy',
      parts: { cap: one('#6a4c6b'), base: jelly('#6a4c6b') },
      layers: [T('base', '자두\n틴트', { y: 0.68, font: 'Noto Sans KR', weight: 700, size: 34, color: WHITE })],
    },
    {
      templateId: 'brick-type', model: 'cl-sc04', category: 'k-velvet',
      parts: { cap: one('#93272c'), base: one('#93272c') },
      layers: [V('BRICK', { font: 'Bebas Neue', weight: 400, size: 88, spacing: 4, color: '#eab8c3' })],
    },
    {
      templateId: 'gold-dust', model: 'cl-sc05', category: 'k-luxury',
      parts: { cap: jelly(CLEAR), base: part(solid('#c09c83'), 'shimmer') },
      layers: [V('gold dust', { font: 'Cormorant Garamond', weight: 600, size: 44, color: WHITE })],
    },
    {
      templateId: 'number-one', model: 'cl-sc06', category: 'k-minimal',
      parts: { cap: one('#c8102e'), base: one('#f4f2ec') },
      layers: [V('NO.1 RED', { font: 'Montserrat', weight: 700, size: 40, spacing: 2, color: '#c8102e' })],
    },
    {
      templateId: 'clear-mono', model: 'cl-ss03', category: 'k-minimal',
      parts: { cap: one('#101820', 'matte'), base: jelly(CLEAR) },
      layers: [V('clear tint', { font: 'Plus Jakarta Sans', weight: 700, size: 34, color: '#101820' })],
    },
    {
      templateId: 'sunset-soda', model: 'cl-ss04', category: 'k-gradient',
      parts: { cap: jelly('#e1523d', '#efdbb2'), base: two('solid-gradient', '#e1523d', '#efdbb2') },
      layers: [V('soda', { y: 0.58, font: 'Playfair Display', weight: 600, size: 66, color: WHITE })],
    },
    {
      templateId: 'lilac-milk', model: 'cl-ss05', category: 'k-gradient',
      parts: { cap: one('#d9e1e2'), base: two('solid-gradient', '#6a4c6b', '#eab8c3') },
      layers: [V('lilac milk', { font: 'Dancing Script', weight: 700, size: 52, color: WHITE })],
    },
    {
      templateId: 'ivory-atelier', model: 'cl-ss06', category: 'k-luxury',
      parts: { cap: one('#c09c83'), base: one('#d6d2c4', 'satin') },
      layers: [V('ATELIER', { font: 'Cinzel', weight: 600, size: 34, spacing: 5, color: '#93272c' })],
    },
    {
      templateId: 'blank-liptint', model: 'cl-sc01', category: 'k-minimal',
      parts: { cap: one('#f4f2ec', 'matte'), base: one('#f4f2ec', 'matte') },
      layers: [],
    },
  ];

  function createDesign(templateId = 'blank-liptint', modelId = 'cl-sc01') {
    const tpl = TEMPLATES.find((x) => x.templateId === templateId) || TEMPLATES[0];
    const d = CL.clone(tpl);
    (d.layers || []).forEach((l) => (l.id = CL.uid('ly')));
    if (CL.pantone) CL.pantone.normalizeDesign(d);

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

  // Every container starts as plain clear plastic
  const clearPart = () => ({ fill: solid('#fbfaf7'), finish: 'gloss', surface: 'clear-gradient' });

  /** A blank design on a container, all clear. */
  function createForModel(modelId) {
    const m = CL.models.getModel(modelId);
    const d = createDesign('blank-liptint', m.id);
    d.parts = { cap: clearPart(), base: clearPart() };
    return CL.pantone.normalizeDesign(d);
  }

  const SAMPLES = TEMPLATES.filter((x) => x.layers.length).map((x) => [x.templateId, x.model]);

  CL.templates = {
    TEMPLATES,
    SAMPLES,
    createDesign,
    createForModel,
  };
})(window.CL);
