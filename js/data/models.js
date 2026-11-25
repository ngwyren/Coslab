/* ==========================================================
   COSLAB — Container models (12 real containers, see containers.js)
   Each tube = cap (nắp) + base (thân). `layout()` gives:
     - L.cap / L.base            printable area of each part + safe zone
     - L.capShell / L.baseShell  full outline of each part (with path `d`)
   Scene units are derived from mm, so every proportion is true to size.
   ========================================================== */
(function (CL) {
  const SCENE = { w: 460, h: 640, cx: 230, ground: 590 };
  const FIT = { w: 190, h: 530 }; // largest tube size in scene units

  const MODELS = CL.CONTAINERS.map((c) => Object.assign({}, c, { silhouette: c.shape, scale: Math.min(FIT.w / c.w, FIT.h / c.h) }));

  // Silhouettes used before the real containers existed → closest container
  const LEGACY = {
    'velvet-round': 'cl-sc02',
    'dewy-crystal': 'cl-sc05',
    'slim-atelier': 'cl-sc06',
    'square-monolith': 'cl-ss01',
    'chubby-pot': 'cl-sc01',
  };

  function getModel(id) {
    const key = LEGACY[id] || id;
    return MODELS.find((m) => m.id === key) || MODELS[0];
  }

  function makeSafeZone(rect) {
    const padX = Math.max(10, Math.round(rect.w * 0.13));
    const padY = Math.max(8, Math.round(rect.h * 0.06));
    return {
      x: rect.x + padX,
      y: rect.y + padY,
      w: rect.w - padX * 2,
      h: rect.h - padY * 2,
      minX: padX / rect.w,
      maxX: 1 - padX / rect.w,
      minY: padY / rect.h,
      maxY: 1 - padY / rect.h,
    };
  }

  /** Closed SVG path of a [height, half-width] profile (mm), mirrored around the tube axis. */
  function profilePath(pts, s) {
    const n = (v) => CL.round(v, 2);
    const right = pts.map(([z, r]) => `${n(SCENE.cx + r * s)},${n(SCENE.ground - z * s)}`);
    const left = pts.map(([z, r]) => `${n(SCENE.cx - r * s)},${n(SCENE.ground - z * s)}`).reverse();
    return `M${right.concat(left).join(' L')} Z`;
  }

  const cache = new Map();

  function layout(modelId) {
    const m = getModel(modelId);
    if (cache.has(m.id)) return cache.get(m.id);
    const s = m.scale;
    const cx = SCENE.cx;
    const w = m.w * s;
    const yOf = (z) => SCENE.ground - z * s;
    const rect = (z0, z1) => ({ x: cx - w / 2, y: yOf(z1), w, h: (z1 - z0) * s, r: 4 });
    const printArea = ([z0, z1]) => {
      const r = rect(z0, z1);
      r.safe = makeSafeZone(r);
      r.mm = { w: m.w, h: CL.round(z1 - z0, 1) };
      return r;
    };
    const shell = (pts, z0, z1) => Object.assign(rect(z0, z1), { d: profilePath(pts, s) });

    const L = {
      model: m,
      scene: SCENE,
      scale: s,
      cap: printArea(m.artCap),
      base: printArea(m.artBody),
      capShell: shell(m.cap, m.seam, m.h),
      baseShell: shell(m.body, 0, m.seam),
      neckPath: profilePath(m.neck, s),
      cavityPath: profilePath(m.cavity, s),
      wand: { x: cx - 1.1 * s, y: yOf(m.wand[1]), w: 2.2 * s, h: (m.wand[1] - m.foot[1]) * s },
      foot: { cx, cy: yOf((m.foot[0] + m.foot[1]) / 2), rx: 2.25 * s, ry: ((m.foot[1] - m.foot[0]) / 2) * s },
    };
    cache.set(m.id, L);
    return L;
  }

  /** e.g. "Ø26.7 × 60.5 mm" or "20 × 20 × 71 mm" */
  function sizeLabel(m) {
    return m.shape === 'round' ? `Ø${m.w} × ${m.h} mm` : `${m.w} × ${m.w} × ${m.h} mm`;
  }

  function materialLabel(m) {
    return m.capMaterial === m.bodyMaterial
      ? m.bodyMaterial
      : `${t('flow.cap')} ${m.capMaterial} · ${t('flow.body')} ${m.bodyMaterial}`;
  }

  /** Spec rows [label, value] in the order of the container catalogue. */
  function specRows(m) {
    return [
      [t('models.capacity'), m.capacity],
      [t('models.size'), sizeLabel(m)],
      [t('models.structure'), `${t('models.single')} · ${t('models.' + m.shape)}`],
      [t('models.material'), materialLabel(m)],
      [t('models.moq'), `${m.moq.toLocaleString('en-US')} ${t('models.ea')}`],
    ];
  }

  CL.models = {
    SCENE,
    MODELS,
    getModel,
    layout,
    sizeLabel,
    materialLabel,
    specRows,
    PARTS: ['cap', 'base'],
    ART_PARTS: ['cap', 'base'],
  };
})(window.CL);
