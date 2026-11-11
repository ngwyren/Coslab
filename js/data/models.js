/* ==========================================================
   Lipstick models (packaging geometry)
   All units are SVG user units inside the 520 x 620 scene.
   Parts:
     cap    — "Up" part (nắp son)       → artwork surface
     base   — "Bottom" part (thân son)  → artwork surface
     sleeve — inner metal sleeve
     bullet — the lipstick itself (or applicator for liquid)
   ========================================================== */
(function (CL) {
  const SCENE = { w: 520, h: 620, ground: 584, cxBase: 190, cxCap: 342 };

  const MODELS = [
    {
      id: 'classic', section: 'round',
      base: { w: 112, h: 236, r: 8 }, sleeve: { w: 96, h: 44 }, bullet: { w: 82, h: 112, shape: 'slant' }, cap: { w: 116, h: 246, r: 8 },
    },
    {
      id: 'slim', section: 'round',
      base: { w: 78, h: 272, r: 6 }, sleeve: { w: 66, h: 46 }, bullet: { w: 54, h: 112, shape: 'slant' }, cap: { w: 82, h: 292, r: 6 },
    },
    {
      id: 'square', section: 'square',
      base: { w: 122, h: 226, r: 3 }, sleeve: { w: 102, h: 42 }, bullet: { w: 86, h: 104, shape: 'chisel' }, cap: { w: 126, h: 238, r: 3 },
    },
    {
      id: 'bold', section: 'round',
      base: { w: 136, h: 178, r: 14 }, sleeve: { w: 116, h: 40 }, bullet: { w: 100, h: 96, shape: 'round' }, cap: { w: 140, h: 192, r: 14 },
    },
    {
      id: 'liquid', section: 'round',
      base: { w: 100, h: 250, r: 24 }, sleeve: { w: 44, h: 26 }, bullet: { w: 30, h: 100, shape: 'wand' }, cap: { w: 66, h: 300, r: 12 },
    },
  ];

  function getModel(id) { return MODELS.find((m) => m.id === id) || MODELS[0]; }

  /** Compute absolute rects of each part in the scene. */
  function layout(modelId) {
    const m = getModel(modelId);
    const G = SCENE.ground;
    const base = { x: SCENE.cxBase - m.base.w / 2, y: G - m.base.h, w: m.base.w, h: m.base.h, r: m.base.r };
    const sleeve = { x: SCENE.cxBase - m.sleeve.w / 2, y: base.y - m.sleeve.h, w: m.sleeve.w, h: m.sleeve.h, r: 2 };
    const bullet = { x: SCENE.cxBase - m.bullet.w / 2, y: sleeve.y - m.bullet.h, w: m.bullet.w, h: m.bullet.h, shape: m.bullet.shape };
    const cap = { x: SCENE.cxCap - m.cap.w / 2, y: G - m.cap.h, w: m.cap.w, h: m.cap.h, r: m.cap.r };
    return { model: m, base, sleeve, bullet, cap, scene: SCENE };
  }

  /** SVG path for the bullet in absolute coordinates. */
  function bulletPath(b) {
    const { x, y, w, h } = b;
    const X = (f) => CL.round(x + w * f, 2), Y = (f) => CL.round(y + h * f, 2);
    switch (b.shape) {
      case 'round':
        return `M${X(0)} ${Y(1)} L${X(0)} ${Y(.42)} C${X(0)} ${Y(.08)} ${X(.22)} ${Y(0)} ${X(.5)} ${Y(0)} C${X(.78)} ${Y(0)} ${X(1)} ${Y(.08)} ${X(1)} ${Y(.42)} L${X(1)} ${Y(1)} Z`;
      case 'chisel':
        return `M${X(0)} ${Y(1)} L${X(0)} ${Y(.34)} L${X(.08)} ${Y(.28)} L${X(.9)} ${Y(.02)} Q${X(1)} ${Y(0)} ${X(1)} ${Y(.08)} L${X(1)} ${Y(1)} Z`;
      case 'wand':
        return `M${X(.38)} ${Y(1)} L${X(.38)} ${Y(.5)} C${X(-.05)} ${Y(.46)} ${X(-.05)} ${Y(.04)} ${X(.5)} ${Y(0)} C${X(1.05)} ${Y(.04)} ${X(1.05)} ${Y(.46)} ${X(.62)} ${Y(.5)} L${X(.62)} ${Y(1)} Z`;
      case 'slant':
      default:
        return `M${X(0)} ${Y(1)} L${X(0)} ${Y(.36)} C${X(0)} ${Y(.3)} ${X(.06)} ${Y(.27)} ${X(.16)} ${Y(.24)} L${X(.84)} ${Y(.03)} C${X(.94)} ${Y(0)} ${X(1)} ${Y(.03)} ${X(1)} ${Y(.12)} L${X(1)} ${Y(1)} Z`;
    }
  }

  CL.models = { SCENE, MODELS, getModel, layout, bulletPath, PARTS: ['cap', 'base', 'sleeve', 'bullet'], ART_PARTS: ['cap', 'base'] };
})(window.CL);
