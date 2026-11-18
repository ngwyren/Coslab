/* ==========================================================
   COSLAB — Liptint Models (Korean K-Beauty Packaging Silhouettes)
   Rendered as 1 cohesive liptint tube:
     - cap:  Up Liptint (Nắp trên)
     - base: Button Liptint (Thân dưới)
   No artificial middle ring; includes strict Safe Zone bounds.
   ========================================================== */
(function (CL) {
  const SCENE = { w: 460, h: 640, cx: 230, ground: 590 };

  const MODELS = [
    {
      id: 'velvet-round',
      silhouette: 'round',
      nameKey: 'models.velvetRound',
      descKey: 'models.velvetRoundDesc',
      w: 118,
      capH: 215,
      baseH: 275,
      r: 14,
      style: 'velvet',
    },
    {
      id: 'dewy-crystal',
      silhouette: 'crystal',
      nameKey: 'models.dewyCrystal',
      descKey: 'models.dewyCrystalDesc',
      w: 114,
      capH: 200,
      baseH: 290,
      r: 8,
      style: 'glass',
    },
    {
      id: 'slim-atelier',
      silhouette: 'round',
      nameKey: 'models.slimAtelier',
      descKey: 'models.slimAtelierDesc',
      w: 86,
      capH: 235,
      baseH: 295,
      r: 10,
      style: 'chrome',
    },
    {
      id: 'square-monolith',
      silhouette: 'square',
      nameKey: 'models.squareMonolith',
      descKey: 'models.squareMonolithDesc',
      w: 120,
      capH: 210,
      baseH: 275,
      r: 5,
      style: 'minimal',
    },
    {
      id: 'chubby-pot',
      silhouette: 'round',
      nameKey: 'models.chubbyPot',
      descKey: 'models.chubbyPotDesc',
      w: 136,
      capH: 175,
      baseH: 235,
      r: 22,
      style: 'soft',
    },
  ];

  function getModel(id) {
    return MODELS.find((m) => m.id === id) || MODELS[0];
  }

  function makeSafeZone(rect) {
    const padX = Math.max(14, Math.round(rect.w * 0.16));
    const padY = Math.max(18, Math.round(rect.h * 0.14));
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

  function layout(modelId) {
    const m = getModel(modelId);
    const cx = SCENE.cx;
    const seam = 1.5;
    const totalH = m.capH + seam + m.baseH;
    const topY = SCENE.ground - totalH;

    const cap = {
      x: cx - m.w / 2,
      y: topY,
      w: m.w,
      h: m.capH,
      r: m.r,
    };
    cap.safe = makeSafeZone(cap);

    const ring = {
      x: cx - m.w / 2,
      y: cap.y + cap.h,
      w: m.w,
      h: 0,
      r: 0,
    };

    const base = {
      x: cx - m.w / 2,
      y: cap.y + cap.h + seam,
      w: m.w,
      h: m.baseH,
      r: m.r,
    };
    base.safe = makeSafeZone(base);

    const windowRect = {
      x: base.x + 12,
      y: base.y + 14,
      w: base.w - 24,
      h: base.h - 28,
      r: Math.max(m.r - 4, 3),
    };

    return { model: m, cap, ring, base, windowRect, scene: SCENE };
  }

  CL.models = {
    SCENE,
    MODELS,
    getModel,
    layout,
    PARTS: ['cap', 'base'],
    ART_PARTS: ['cap', 'base'],
  };
})(window.CL);
