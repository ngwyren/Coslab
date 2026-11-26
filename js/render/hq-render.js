/* ==========================================================
   COSLAB — High quality render (path tracing in the browser)
   The same container meshes as the live 3D view, traced like an offline renderer
   (Blender Cycles / Cinema 4D style): real refraction through the clear acrylic,
   a lacquered top coat on gloss parts, studio softboxes and soft floor shadows.
   Runs on its own copy of three.js (vendor/pathtracer: three r162, three-mesh-bvh 0.7.8,
   three-gpu-pathtracer 0.0.23, all MIT) so the live view keeps its own version.
   ========================================================== */
(function (CL) {
  let mods = null;
  const load = () => (mods = mods || Promise.all([
    import(new URL('vendor/pathtracer/three.module.js', document.baseURI).href),
    import(new URL('vendor/pathtracer/three-gpu-pathtracer.module.js', document.baseURI).href),
    import(new URL('vendor/pathtracer/Pass.js', document.baseURI).href),
  ]).then(([T, PT, Pass]) => ({ T, PT, Pass })));

  const smooth = (a, b, x) => { const t = CL.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

  /** Studio light as an HDR panorama: soft surround, an overhead panel and two tall front softboxes. */
  function studioEnv(T) {
    const W = 1024, H = 512;
    const data = new Float32Array(W * H * 4);
    const box = (az, el, a0, w, e0, e1, k) => {
      let da = Math.abs(az - a0); if (da > Math.PI) da = Math.PI * 2 - da;
      return k * (1 - smooth(w * 0.55, w, da)) * smooth(e0 - 0.1, e0, el) * (1 - smooth(e1, e1 + 0.1, el));
    };
    for (let y = 0; y < H; y++) {
      const el = (0.5 - (y + 0.5) / H) * Math.PI;
      for (let x = 0; x < W; x++) {
        const az = ((x + 0.5) / W) * Math.PI * 2 - Math.PI;
        let l = el > 0 ? 0.85 + 0.2 * Math.sin(el) : 0.85 + 0.1 * Math.sin(el);
        l += box(az, el, -0.95, 0.22, -0.3, 0.9, 6) + box(az, el, 1.1, 0.14, -0.2, 0.75, 3.5) + (el > 1.05 ? 3 * smooth(1.05, 1.2, el) : 0);
        const i = (y * W + x) * 4;
        data[i] = data[i + 1] = data[i + 2] = l;
        data[i + 3] = 1;
      }
    }
    const tex = new T.DataTexture(data, W, H, T.RGBAFormat, T.FloatType);
    tex.mapping = T.EquirectangularReflectionMapping;
    tex.minFilter = tex.magFilter = T.LinearFilter;
    tex.needsUpdate = true;
    return tex;
  }

  const ACRYLIC = { transmission: 1, ior: 1.49, roughness: 0.03, metalness: 0, thickness: 0.3 };
  const FINISH = {
    gloss: { roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.03 },
    satin: { roughness: 0.42, clearcoat: 0.3, clearcoatRoughness: 0.25 },
    matte: { roughness: 0.85 },
    metallic: { roughness: 0.3, metalness: 0.85 },
  };

  /** Geometry from the raw container data (same format the live view reads). */
  function geometry(T, raw) {
    const g = new T.BufferGeometry();
    const n = raw.q.length / 3;
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3);
    for (let i = 0; i < pos.length; i++) pos[i] = raw.q[i] / 200;
    for (let i = 0; i < n; i++) for (let k = 0; k < 3; k++) nor[i * 3 + k] = raw.n[i * 4 + k] / 127;
    g.setAttribute('position', new T.BufferAttribute(pos, 3));
    g.setAttribute('normal', new T.BufferAttribute(nor, 3));
    g.setIndex(new T.BufferAttribute(Uint32Array.from(raw.x), 1));
    return g;
  }

  /** Vertex colours along the part: the design colours (or the clear tint), with the gradient range. */
  function paint(T, g, part, y0, y1, clear) {
    const I = CL.Preview3D.internals;
    const tint = (c) => (CL.pantone.nearest(c).code === 'Clear' ? '#ffffff' : clear ? CL.color.mix(c, '#ffffff', 0.3) : c);
    const [a, b] = I.colorsOf(part && part.fill).map((c) => new T.Color(tint(c)));
    const grad = clear || (part && (part.surface === 'solid-gradient' || part.surface === 'shimmer'));
    const [ra, rb] = I.rangeOf(part && part.fill);
    const pos = g.attributes.position, out = new Float32Array(pos.count * 4), c = new T.Color();
    for (let i = 0; i < pos.count; i++) {
      const u = grad ? CL.clamp(((pos.getY(i) - y0) / (y1 - y0) - ra) / (rb - ra), 0, 1) : 0;
      c.copy(a).lerp(b, u);
      out.set([c.r, c.g, c.b, 1], i * 4);
    }
    g.setAttribute('color', new T.BufferAttribute(out, 4));
  }

  /** Artwork for cap and base, clipped to the safe zone like the live view. */
  async function artTextures(T, design, L) {
    const fonts = await CL.exporter.fontCSS(design).catch(() => '');
    const tex = {};
    for (const p of ['cap', 'base']) {
      if (!(design.layers || []).some((l) => l.part === p && l.visible !== false)) continue;
      const flat = await CL.exporter.renderFlatCanvas(design, p, { scale: 6, fonts, layersOnly: true });
      const c = flat.canvas, r = L[p], k = c.width / r.w, ctx = c.getContext('2d');
      ctx.globalCompositeOperation = 'destination-in';
      ctx.fillRect((r.safe.x - r.x) * k, (r.safe.y - r.y) * k, r.safe.w * k, r.safe.h * k);
      const t = new T.CanvasTexture(c);
      t.colorSpace = T.SRGBColorSpace;
      tex[p] = t;
    }
    return tex;
  }

  async function buildScene(T, design, backdrop) {
    const I = CL.Preview3D.internals;
    const L = CL.models.layout(design.model);
    const m = L.model;
    const raw = await I.loadModel(m.id);
    const tex = await artTextures(T, design, L);
    const P = design.parts;
    const scene = new T.Scene();
    const tube = new T.Group();
    tube.scale.setScalar(I.TUBE_H / m.h);
    scene.add(tube);
    const mat = (o) => new T.MeshPhysicalMaterial(Object.assign({ color: 0xffffff }, o));
    const add = (geo, material) => { const mesh = new T.Mesh(geo, material); tube.add(mesh); return mesh; };

    add(geometry(T, raw.wand), mat(Object.assign({}, ACRYLIC, { color: 0xf2f5f9 })));
    add(geometry(T, raw.foot), mat({ color: new T.Color('#efe5d2'), roughness: 0.95, sheen: 1, sheenRoughness: 0.6, sheenColor: new T.Color('#ffffff') }));
    add(geometry(T, raw.wiper), mat({ color: 0xf4f5f7, roughness: 0.5, transmission: 0.4, ior: 1.4, thickness: 0.2 }));

    if (I.isClear(P.base) && P.base.product && P.base.product.color) {
      const cav = m.cavity.map(([z, r]) => new T.Vector2(Math.max(r - 0.06, 0.01), z));
      const prof = [new T.Vector2(0, cav[0].y), ...cav, new T.Vector2(0, cav[cav.length - 1].y)];
      add(new T.LatheGeometry(prof, 128), mat({ color: new T.Color(P.base.product.color), roughness: 0.22, clearcoat: 0.5, clearcoatRoughness: 0.1 }));
    }

    [['body', P.base, 'base', 0, m.seam, m.artBody], ['cap', P.cap, 'cap', m.seam, m.h, m.artCap]].forEach(([key, part, texKey, y0, y1, art]) => {
      const geo = geometry(T, raw[key]);
      const clear = I.isClear(part);
      paint(T, geo, part, y0, y1, clear);
      const f = clear ? ACRYLIC : FINISH[(part && part.finish) || 'gloss'] || FINISH.gloss;
      add(geo, mat(Object.assign({ vertexColors: true }, f)));
      if (tex[texKey]) {
        const src = raw['art_' + key];
        const g = geometry(T, src);
        const pos = g.attributes.position, nor = g.attributes.normal;
        const uv = new Float32Array(pos.count * 2);
        for (let i = 0; i < pos.count; i++) {
          uv[i * 2] = pos.getX(i) / m.w + 0.5;
          uv[i * 2 + 1] = (pos.getY(i) - art[0]) / (art[1] - art[0]);
          pos.setXYZ(i, pos.getX(i) + nor.getX(i) * 0.02, pos.getY(i), pos.getZ(i) + nor.getZ(i) * 0.02);
        }
        g.setAttribute('uv', new T.BufferAttribute(uv, 2));
        const front = [];
        for (let i = 0; i < src.x.length; i += 3) {
          const t = [src.x[i], src.x[i + 1], src.x[i + 2]];
          if (t.every((v) => nor.getZ(v) > 0.02)) front.push(...t);
        }
        g.setIndex(front);
        add(g, mat({ map: tex[texKey], transparent: true, roughness: 0.55 }));
      }
    });

    // white sweep floor that catches soft shadows and the coloured bounce
    // photo-studio sweep: the floor curves up into the back wall, so there is no horizon line
    const sweep = [];
    const R = 7, back = -6;
    sweep.push(new T.Vector2(40, 0), new T.Vector2(back, 0));
    for (let i = 1; i <= 24; i++) {
      const a = (i / 24) * Math.PI / 2;
      sweep.push(new T.Vector2(back - Math.sin(a) * R, R - Math.cos(a) * R));
    }
    sweep.push(new T.Vector2(back - R, 60));
    // a ribbon 80 wide following the profile (z, y)
    const vtx = [], idx = [];
    sweep.forEach((p, i) => {
      vtx.push(-40, p.y, p.x, 40, p.y, p.x);
      if (i) { const a = (i - 1) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    });
    const cyc = new T.BufferGeometry();
    cyc.setAttribute('position', new T.Float32BufferAttribute(vtx, 3));
    cyc.setIndex(idx);
    cyc.computeVertexNormals();
    scene.add(new T.Mesh(cyc, mat({ color: new T.Color(backdrop || '#f0f0f0'), roughness: 0.95, side: T.DoubleSide })));
    return { scene, textures: Object.values(tex) };
  }

  /**
   * Render a design. opts: { width, height, samples, camera ({position, quaternion, fov}),
   * onProgress(samples, total, canvas), signal }. Resolves with a 2D canvas of the finished image.
   */
  async function renderHQ(design, opts = {}) {
    const { T, PT, Pass } = await load();
    const W = opts.width || 1080, H = opts.height || 1350, total = opts.samples || 256;

    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const renderer = new T.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true });
    renderer.toneMapping = T.NeutralToneMapping; // keeps Pantone colours, rolls off only the highlights
    renderer.toneMappingExposure = opts.exposure || 1;
    renderer.setPixelRatio(1);
    renderer.setSize(W, H, false);

    const I = CL.Preview3D.internals;
    // product-shot framing: the viewing angle comes from the live view, the distance is set so the
    // container fills about two thirds of the frame height (with air around it), centred
    const camera = new T.PerspectiveCamera(26, W / H, 0.1, 200);
    const ty = I.TUBE_H * 0.5;
    let dir = new T.Vector3(Math.sin(-0.28) * Math.cos(0.09), Math.sin(0.09), Math.cos(-0.28) * Math.cos(0.09));
    if (opts.camera) {
      const p = opts.camera.position;
      dir = new T.Vector3(p.x, p.y - ty, p.z);
      // keep the eye close to level, like a product photo
      dir.y = CL.clamp(dir.y, -0.05 * dir.length(), 0.25 * dir.length());
      dir.normalize();
    }
    const fill = opts.fill || 0.66;
    const D = (I.TUBE_H / fill) / (2 * Math.tan((camera.fov * Math.PI) / 360));
    // lift: raise the subject by this share of the frame height (room for an overlay at the bottom)
    const aim = ty - (opts.lift || 0) * (I.TUBE_H / fill);
    camera.position.set(dir.x * D, aim + dir.y * D, dir.z * D);
    camera.lookAt(0, aim, 0);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();

    const { scene, textures } = await buildScene(T, design, opts.backdrop);
    const env = studioEnv(T);
    scene.environment = env;
    scene.background = new T.Color(opts.backdrop || '#f2f2f2');

    const pt = new PT.WebGLPathTracer(renderer);
    pt.tiles.set(4, 4); // small pieces of GPU work, so the screen keeps drawing between them
    pt.bounces = 6;
    pt.transmissiveBounces = 10;
    pt.filterGlossyFactor = 0.4;
    pt.renderDelay = 0;
    pt.minSamples = 0;
    pt.fadeDuration = 0;
    pt.rasterizeScene = false;
    pt.textureSize.set(2048, 2048);
    pt.setScene(scene, camera);

    const stop = () => opts.signal && opts.signal.aborted;
    try {
      // timers rather than animation frames, so a background tab keeps rendering
      await new Promise((resolve, reject) => {
        let last = -1;
        const tick = () => {
          if (stop()) return reject(new DOMException('cancelled', 'AbortError'));
          pt.renderSample();
          const n = Math.floor(pt.samples);
          if (opts.onProgress && n !== last) { last = n; opts.onProgress(Math.min(n, total), total, canvas); }
          if (n >= total) resolve(); else setTimeout(tick, 12);
        };
        setTimeout(tick, 0);
      });
      // clean up the last grain: edge-aware denoise on the finished image (keeps outlines and print sharp)
      const dn = new Pass.FullScreenQuad(new PT.DenoiseMaterial({ map: pt.target.texture, blending: T.NoBlending }));
      dn.material.sigma = opts.denoise ?? 3.2;
      dn.material.kSigma = 1.0;
      dn.material.threshold = 0.07;
      renderer.setRenderTarget(null);
      dn.render(renderer);
      dn.material.dispose();
      const out = document.createElement('canvas');
      out.width = W; out.height = H;
      out.getContext('2d').drawImage(canvas, 0, 0);
      return out;
    } finally {
      const safe = (fn) => { try { fn(); } catch (e) { /* the library's own clean-up can trip on parts it never built */ } };
      safe(() => pt.dispose());
      safe(() => env.dispose());
      textures.forEach((t) => safe(() => t.dispose()));
      scene.traverse((o) => { if (o.geometry) safe(() => o.geometry.dispose()); if (o.material) safe(() => o.material.dispose()); });
      safe(() => renderer.dispose());
      safe(() => renderer.forceContextLoss());
    }
  }

  CL.renderHQ = renderHQ;

  /** Render dialog: pick a quality, watch the image clear up, then save the PNG. */
  CL.openRender = function (source, camera) {
    const design = CL.clone(source);
    const vi = I18N.lang === 'vi';
    const QUALITY = [
      ['draft', vi ? 'Nháp' : 'Draft', 640, 800, 64],
      ['good', vi ? 'Đẹp' : 'Good', 1080, 1350, 256],
      ['studio', 'Studio', 2160, 2700, 512],
    ];
    let q = CL.store.settings.renderQuality || 'good';
    if (!QUALITY.some(([id]) => id === q)) q = 'good';
    const cam = camera ? { position: camera.position.clone(), quaternion: camera.quaternion.clone(), fov: camera.fov } : null;

    const host = document.getElementById('modalHost');
    const opener = document.activeElement;
    let job = null, result = null, open = true;

    const stage = CL.h('div.ex-preview.hq-stage');
    const bar = CL.h('i.hq-bar-fill');
    const status = CL.h('p.hq-status', { 'aria-live': 'polite' });
    const saveBtn = CL.h('button.btn.btn-primary', {
      type: 'button', disabled: true,
      html: CL.icon('download') + `<span>${vi ? 'Tải PNG' : 'Save PNG'}</span>`,
      onclick: () => {
        if (!result) return;
        const a = document.createElement('a');
        a.download = `${(design.name || 'COSLAB').replace(/[\\/:*?"<>|]+/g, ' ').trim()} - render.png`;
        a.href = result.toDataURL('image/png');
        a.click();
      },
    });
    const pick = CL.h('div.segmented.block.hq-quality', { role: 'radiogroup', 'aria-label': vi ? 'Chất lượng' : 'Quality' },
      ...QUALITY.map(([id, label, w, h]) => CL.h('button', {
        type: 'button', role: 'radio', 'data-id': id, title: `${w} × ${h}px`,
        onclick: () => { if (q !== id) { q = id; CL.store.saveSettings({ renderQuality: q }); start(); } },
      }, label)));

    const close = () => {
      open = false;
      if (job) job.abort();
      host.replaceChildren();
      window.removeEventListener('hashchange', close);
      if (opener && opener.isConnected) opener.focus();
    };

    async function start() {
      if (job) job.abort();
      const ctrl = (job = new AbortController());
      const [, , W, H, total] = QUALITY.find(([id]) => id === q);
      pick.querySelectorAll('button').forEach((b) => { const on = b.dataset.id === q; b.classList.toggle('is-active', on); b.setAttribute('aria-checked', String(on)); });
      result = null;
      saveBtn.disabled = true;
      bar.style.width = '0%';
      status.textContent = vi ? 'Đang chuẩn bị ánh sáng và chất liệu… lần đầu có thể mất khoảng 30 giây.' : 'Preparing light and materials… the first time can take about 30 seconds.';
      const t0 = performance.now();
      try {
        const out = await renderHQ(design, {
          width: W, height: H, samples: total, camera: cam, signal: ctrl.signal,
          onProgress: (n, all, canvas) => {
            if (ctrl !== job || !open) return;
            if (canvas.parentNode !== stage) stage.replaceChildren(canvas);
            bar.style.width = `${(n / all) * 100}%`;
            const left = n > 2 ? Math.round(((performance.now() - t0) / n) * (all - n) / 1000) : null;
            status.textContent = `${vi ? 'Lượt' : 'Pass'} ${n}/${all}` + (left != null ? ` · ${vi ? 'còn khoảng' : 'about'} ${left}s${vi ? '' : ' left'}` : '');
          },
        });
        if (ctrl !== job || !open) return;
        result = out;
        stage.replaceChildren(out);
        bar.style.width = '100%';
        status.textContent = `${vi ? 'Xong' : 'Done'} · ${W} × ${H}px`;
        saveBtn.disabled = false;
        saveBtn.focus();
      } catch (e) {
        if (e && e.name === 'AbortError') return;
        console.error(e);
        if (ctrl === job && open) status.textContent = vi ? 'Máy này chưa render được. Bạn thử lại trên máy tính có card đồ hoạ.' : 'This device could not render it. Try a computer with a graphics card.';
      }
    }

    const modal = CL.h('div.modal.ex-modal.hq-modal', { role: 'dialog', 'aria-modal': 'true', 'aria-label': vi ? 'Render chất lượng cao' : 'High quality render' },
      stage,
      CL.h('div.ex-side', null,
        CL.h('div.ex-head', null,
          CL.h('h3', { text: vi ? 'Render chất lượng cao' : 'High quality render' }),
          CL.h('button.icon-btn.sm', { type: 'button', 'aria-label': t('common.close'), html: CL.icon('close'), onclick: close })),
        CL.h('p.hq-note', { text: vi ? 'Ánh sáng studio, nhựa trong khúc xạ thật và bóng đổ mềm, như render bằng Blender. Ảnh mịn dần qua từng lượt.' : 'Studio light, true refraction through clear plastic and soft shadows, like a Blender render. The image clears up pass by pass.' }),
        pick,
        CL.h('div.hq-bar', null, bar),
        status,
        CL.h('div.modal-actions', null,
          CL.h('button.btn.btn-ghost', { type: 'button', text: t('common.close'), onclick: close }),
          saveBtn))
    );
    const bd = CL.h('div.modal-backdrop', { onclick: (e) => { if (e.target === bd) close(); } }, modal);
    bd.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Escape') { e.preventDefault(); close(); } });
    window.addEventListener('hashchange', close);
    host.replaceChildren(bd);
    start();
  };
})(window.CL);
