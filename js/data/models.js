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

  /**
   * Outline of a cap or body for the 2D view: the tiny factory corner radii are squared off and
   * every corner is drawn with one even round instead (except the edge at the seam, which stays
   * square so cap and body meet flush).
   */
  function roundedOutline(pts, s, seam) {
    const rmax = Math.max(...pts.map((p) => p[1]));
    const zA = pts[0][0], zB = pts[pts.length - 1][0];
    // an end is "squared" only when it is a plain edge; a real bowl (like CL-SC02's base) keeps its curve
    const plainA = pts[0][1] > rmax - 1, plainB = pts[pts.length - 1][1] > rmax - 1;
    const tidy = pts
      .filter(([z, r], i) => i === 0 || i === pts.length - 1 || r >= rmax - 0.01
        || !((plainA && z - zA <= 1) || (plainB && zB - z <= 1)))
      .map(([z, r], i, arr) => [z, (i === 0 && plainA) || (i === arr.length - 1 && plainB) ? rmax : r]);
    const P = (z, r) => ({ x: SCENE.cx + r * s, y: SCENE.ground - z * s, sharp: Math.abs(z - seam) < 0.01 });
    const ring = [P(tidy[0][0], 0), ...tidy.map(([z, r]) => P(z, r)), P(tidy[tidy.length - 1][0], 0),
      ...tidy.slice().reverse().map(([z, r]) => P(z, -r))];
    // drop the axis points (they lie on the straight top / bottom edge)
    const pts2 = ring.filter((p) => Math.abs(p.x - SCENE.cx) > 0.001);
    const R = 2.2 * s;
    const n = (v) => CL.round(v, 2);
    let d = '';
    pts2.forEach((p, i) => {
      const a = pts2[(i - 1 + pts2.length) % pts2.length], b = pts2[(i + 1) % pts2.length];
      const la = Math.hypot(a.x - p.x, a.y - p.y), lb = Math.hypot(b.x - p.x, b.y - p.y);
      const cut = p.sharp ? 0 : Math.min(R, la / 2, lb / 2);
      if (!cut) { d += `${d ? 'L' : 'M'}${n(p.x)},${n(p.y)} `; return; }
      const p1 = { x: p.x + ((a.x - p.x) / la) * cut, y: p.y + ((a.y - p.y) / la) * cut };
      const p2 = { x: p.x + ((b.x - p.x) / lb) * cut, y: p.y + ((b.y - p.y) / lb) * cut };
      d += `${d ? 'L' : 'M'}${n(p1.x)},${n(p1.y)} Q${n(p.x)},${n(p.y)} ${n(p2.x)},${n(p2.y)} `;
    });
    return d + 'Z';
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
    // The real parts have shallow decorative grooves (about 0.1 mm); in the flat 2D outline they
    // read as dents, so fill any point that sits lower than the outline on both sides of it
    const smooth = (pts) => pts.map(([z, r], i) => {
      const before = Math.max(-Infinity, ...pts.slice(0, i).map((p) => p[1]));
      const after = Math.max(-Infinity, ...pts.slice(i + 1).map((p) => p[1]));
      return [z, Math.max(r, Math.min(before, after))];
    });
    const flush = (pts, seam, side) => {
      const near = (z) => Math.abs(z - seam) < 1.2;
      const rest = pts.filter(([z]) => !near(z));
      const r = Math.max(...pts.map((p) => p[1]));
      return side === 'start' ? [[seam, r], ...rest] : [...rest, [seam, r]];
    };
    const shell = (pts, z0, z1) => Object.assign(rect(z0, z1), { d: roundedOutline(smooth(pts), s, m.seam) });

    const L = {
      model: m,
      scene: SCENE,
      scale: s,
      cap: printArea(m.artCap),
      base: printArea(m.artBody),
      // cap and body meet flush at the seam (square edges there, no rounded gap)
      capShell: shell(flush(m.cap, m.seam, 'start'), m.seam, m.h),
      baseShell: shell(flush(m.body, m.seam, 'end'), 0, m.seam),
      seamY: yOf(m.seam),
      neckPath: profilePath(m.neck, s),
      // the neck as one smooth block (no thread teeth) for the 2D view
      // the neck as one smooth tube (no thread teeth) for the 2D view: its walls line up
      // with the opening of the cavity, so it runs on into the shoulder below the cap
      neckBox: (() => {
        const top = m.cavity.reduce((p, q) => (q[0] > p[0] ? q : p));
        const r = top[1] + 0.9;
        const z1 = Math.max(...m.neck.map((p) => p[0]));
        return { x: cx - r * s, y: yOf(z1), w: 2 * r * s, h: (z1 - top[0]) * s };
      })(),
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
  /** `brief`: only what helps a customer choose (the PDF lists everything). */
  function specRows(m, brief = false) {
    const rows = [
      [t('models.capacity'), m.capacity],
      [t('models.size'), sizeLabel(m)],
      [t('models.structure'), `${t('models.single')} · ${t('models.' + m.shape)}`],
      [t('models.material'), materialLabel(m)],
      [t('models.moq'), `${m.moq.toLocaleString('en-US')} ${t('models.ea')}`],
    ];
    return brief ? rows.slice(0, 2) : rows;
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
