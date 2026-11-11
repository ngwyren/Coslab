/* ==========================================================
   COSLAB — Liptint Models (Korean K-Beauty Packaging Silhouettes)
   Rendered as EXACTLY 1 COHESIVE LIPTINT TUBE (Chỉ 1 cây son liptint).
   Components:
     - cap:  Up Liptint (Nắp trên của cây son)
     - base: Button / Bottom Liptint (Thân dưới chứa chất son tint)
     - ring: Khớp nối / viền trang trí phân tách nắp và thân
   ========================================================== */
(function (CL) {
  const SCENE = { w: 460, h: 640, cx: 230, ground: 590 };

  const MODELS = [
    {
      id: 'velvet-round',
      silhouette: 'round',
      nameKey: 'models.velvetRound',
      descKey: 'models.velvetRoundDesc',
      w: 120,
      capH: 220,
      baseH: 270,
      ringH: 4,
      r: 12,
      style: 'velvet', // soft frosted velvet touch (like 3CE / Romand Velvet)
    },
    {
      id: 'dewy-crystal',
      silhouette: 'crystal',
      nameKey: 'models.dewyCrystal',
      descKey: 'models.dewyCrystalDesc',
      w: 114,
      capH: 200,
      baseH: 290,
      ringH: 5,
      r: 6,
      style: 'glass', // clear acrylic double-wall water tint (like Amuse / Romand Glasting)
    },
    {
      id: 'slim-atelier',
      silhouette: 'round',
      nameKey: 'models.slimAtelier',
      descKey: 'models.slimAtelierDesc',
      w: 86,
      capH: 240,
      baseH: 290,
      ringH: 4,
      r: 8,
      style: 'chrome', // architectural slender tube (like Hera Sensual / Tamburins)
    },
    {
      id: 'square-monolith',
      silhouette: 'square',
      nameKey: 'models.squareMonolith',
      descKey: 'models.squareMonolithDesc',
      w: 122,
      capH: 210,
      baseH: 270,
      ringH: 4,
      r: 4,
      style: 'minimal', // clean modern square packaging
    },
    {
      id: 'chubby-pot',
      silhouette: 'round',
      nameKey: 'models.chubbyPot',
      descKey: 'models.chubbyPotDesc',
      w: 138,
      capH: 180,
      baseH: 220,
      ringH: 5,
      r: 22,
      style: 'soft', // chubby sensory tint (like Peripera / Fwee)
    },
  ];

  function getModel(id) {
    return MODELS.find((m) => m.id === id) || MODELS[0];
  }

  /**
   * Layout for exactly ONE assembled liptint tube.
   * Both Up Liptint (cap) and Button Liptint (base) sit on the same vertical axis (cx).
   */
  function layout(modelId) {
    const m = getModel(modelId);
    const cx = SCENE.cx;
    const totalH = m.capH + m.ringH + m.baseH;
    const topY = SCENE.ground - totalH;

    const cap = {
      x: cx - m.w / 2,
      y: topY,
      w: m.w,
      h: m.capH,
      r: m.r,
    };

    const ring = {
      x: cx - (m.w - 4) / 2,
      y: cap.y + cap.h,
      w: m.w - 4,
      h: m.ringH,
      r: 1,
    };

    const base = {
      x: cx - m.w / 2,
      y: ring.y + ring.h,
      w: m.w,
      h: m.baseH,
      r: m.r,
    };

    // Tint window / gradient reservoir inside base
    const windowRect = {
      x: base.x + 12,
      y: base.y + 18,
      w: base.w - 24,
      h: base.h - 36,
      r: Math.max(m.r - 4, 3),
    };

    return { model: m, cap, ring, base, windowRect, scene: SCENE };
  }

  CL.models = {
    SCENE,
    MODELS,
    getModel,
    layout,
    PARTS: ['cap', 'base', 'ring'],
    ART_PARTS: ['cap', 'base'],
  };
})(window.CL);
