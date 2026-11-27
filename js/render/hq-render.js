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
      const c = await CL.exporter.renderArtCanvas(design, p, { scale: 6, fonts });
      const t = new T.CanvasTexture(c);
      t.colorSpace = T.SRGBColorSpace;
      tex[p] = t;
    }
    return tex;
  }

  async function buildScene(T, design, backdrop, facing = 0) {
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
    add(geometry(T, raw.wiper), mat({ color: new T.Color('#f6f4ee'), roughness: 0.42, sheen: 0.3, sheenColor: new T.Color('#ffffff') })); // milky-white stopper (R04)

    if (I.isClearMaterial(P.base) && P.base.product && P.base.product.color) {
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
    const sweepMesh = new T.Mesh(cyc, mat({ color: new T.Color(backdrop || '#f0f0f0'), roughness: 0.95, side: T.DoubleSide }));
    // the sweep turns with the camera, so its wall is always straight behind the product (never an edge in view)
    sweepMesh.rotation.y = facing;
    scene.add(sweepMesh);
    return { scene, textures: Object.values(tex) };
  }

  /** Phones, tablets and low-memory devices: the render is sized down so their GPU can finish it. */
  const weakDevice = () => matchMedia('(hover: none) and (pointer: coarse)').matches || (navigator.deviceMemory || 8) <= 2;

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

    const { scene, textures } = await buildScene(T, design, opts.backdrop, Math.atan2(dir.x, dir.z));
    const env = studioEnv(T);
    scene.environment = env;
    scene.background = new T.Color(opts.backdrop || '#f2f2f2');

    const pt = new PT.WebGLPathTracer(renderer);
    // phones and other small GPUs: smaller textures and fewer light bounces
    const weak = weakDevice();
    let tiles = weak ? 16 : 12, lost = false; // starts in tiny pieces, then sized by measured speed (see the loop)
    canvas.addEventListener('webglcontextlost', () => { lost = true; });
    pt.tiles.set(tiles, tiles);
    pt.bounces = weak ? 5 : 6;
    pt.transmissiveBounces = weak ? 8 : 10;
    pt.filterGlossyFactor = 0.4;
    pt.renderDelay = 0;
    pt.minSamples = 0;
    pt.fadeDuration = 0;
    pt.rasterizeScene = false;
    pt.textureSize.set(weak ? 1024 : 2048, weak ? 1024 : 2048);
    pt.renderToCanvas = false; // the denoise pass below draws the frame
    pt.setScene(scene, camera);

    const stop = () => opts.signal && opts.signal.aborted;
    // edge-aware denoise, drawn over every frame shown (not only the finished one); keeps outlines and print sharp
    const dn = new Pass.FullScreenQuad(new PT.DenoiseMaterial({ map: pt.target.texture, blending: T.NoBlending }));
    dn.material.kSigma = 1.0;
    // stronger while few passes are in (grainy), down to the fine setting at 256+ passes
    const denoise = () => {
      const k = Math.min(Math.sqrt(256 / Math.max(pt.samples, 1)), 6);
      dn.material.sigma = (opts.denoise ?? 3.2) * Math.min(Math.max(k, 1), 2.6);
      dn.material.threshold = Math.min(0.07 * Math.max(k * k, 1), 0.6);
      renderer.setRenderTarget(null);
      dn.render(renderer);
    };
    try {
      // The picture is traced in small pieces. A batch of pieces goes to the GPU only after the
      // batch before it is really finished (a fence tells us when), with a pause in between, so
      // the GPU never has a queue of render work in front of the page itself. The fence answers
      // about once per screen frame: a batch that fits in one frame grows, one that takes several
      // shrinks. A GPU where even a single piece is too slow (phones) gets smaller pieces.
      // Timers rather than animation frames, so a background tab keeps rendering.
      const gl = renderer.getContext();
      const now = () => performance.now();
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
      const gpuDone = async () => {
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        for (const t0 = now(); !lost && !stop() && now() - t0 < 8000;) {
          await sleep(3);
          if (gl.clientWaitSync(sync, 0, 0) !== gl.TIMEOUT_EXPIRED) break;
        }
        gl.deleteSync(sync);
      };
      let last = -1, shown = 0, batch = 1, slow = 0;
      while (true) {
        if (stop()) throw new DOMException('cancelled', 'AbortError');
        if (lost) throw new Error('WebGL context lost');
        // light: the render runs in the corner while people keep working, so it rests longer
        // between batches and refreshes the shown frame less often
        const light = !!(opts.light && opts.light());
        // a hidden tab only gets a timer about once a second and nobody is looking at it, so
        // there the pieces go out back to back for a quarter of a second, each waited for in place
        const hidden = document.hidden;
        const before = pt.samples, t0 = now();
        let pieces = 0;
        do {
          pt.renderSample(); pieces++;
          if (hidden) gl.finish();
        } while (pt.samples !== before && !Number.isInteger(pt.samples) && (hidden ? now() - t0 < 250 : pieces < batch));
        if (!hidden) await gpuDone();
        const dt = now() - t0;
        const traced = pt.samples !== before; // false while the shader is still compiling
        if (traced && hidden) { if (dt / pieces > 70) slow++; }
        else if (traced) {
          if (dt < 24) batch = Math.min(Math.ceil(batch * 1.5), tiles * tiles);
          else if (dt > 45) batch = Math.max(1, Math.floor(batch * 0.6));
          if (pieces === 1 && dt > 70) slow++;
        }
        const passDone = traced && Number.isInteger(pt.samples);
        if (passDone) {
          if (slow > 2 && tiles < 32) { tiles = Math.min(32, tiles * 2); pt.tiles.set(tiles, tiles); batch = 1; }
          slow = 0;
        }
        if (passDone || now() - shown > (light ? 1500 : 350)) { denoise(); shown = now(); }
        const n = Math.floor(pt.samples);
        if (opts.onProgress && n !== last) { last = n; opts.onProgress(Math.min(n, total), total, canvas); }
        if (n >= total) break;
        await sleep(hidden ? 0 : light ? Math.max(40, dt * 2) : dt * 0.3);
      }
      denoise();
      const out = document.createElement('canvas');
      out.width = W; out.height = H;
      out.getContext('2d').drawImage(canvas, 0, 0);
      return out;
    } finally {
      // The path tracer compiles its shader in the background (three.js polls the program
      // every 10 ms). Disposing in the middle of that leaves the poll with no program
      // ("reading 'isReady'"), so let a pending compile settle first (bounded wait).
      for (let i = 0; i < 300 && pt.isCompiling; i++) await new Promise((r) => setTimeout(r, 20));
      const safe = (fn) => { try { fn(); } catch (e) { /* the library's own clean-up can trip on parts it never built */ } };
      safe(() => dn.material.dispose());
      safe(() => pt.dispose());
      safe(() => env.dispose());
      textures.forEach((t) => safe(() => t.dispose()));
      scene.traverse((o) => { if (o.geometry) safe(() => o.geometry.dispose()); if (o.material) safe(() => o.material.dispose()); });
      safe(() => renderer.dispose());
      safe(() => renderer.forceContextLoss());
    }
  }

  CL.renderHQ = renderHQ;

  /* ---------- Render: one job at a time, shown in a dialog or as a small card in a corner ----------
     Leaving the dialog (outside click, Esc, another page, "Run in background") keeps the render
     going in the corner card; only Cancel stops it. */
  const QUALITIES = () => (weakDevice()
    ? [['draft', t('ui.draft'), 480, 600, 48], ['good', t('ui.good'), 800, 1000, 160], ['studio', 'Studio', 1280, 1600, 320]]
    : [['draft', t('ui.draft'), 640, 800, 64], ['good', t('ui.good'), 1080, 1350, 256], ['studio', 'Studio', 2160, 2700, 512]]);
  let job = null; // { design, cam, q, ctrl, W, H, canvas, result, n, all, t0, state: 'running' | 'done' | 'failed' }
  let mode = null; // 'dialog' | 'dock' | null
  const views = new Set();
  const emit = () => views.forEach((fn) => fn());

  function savePng() {
    if (!job || !job.result) return;
    const a = document.createElement('a');
    a.download = `${(job.design.name || 'COSLAB').replace(/[\\/:*?"<>|]+/g, ' ').trim()} - render.png`;
    a.href = job.result.toDataURL('image/png');
    a.click();
  }

  function statusText() {
    if (!job) return '';
    if (job.state === 'failed') return t('ui.renderFail');
    if (job.state === 'done') return `${t('ui.done')} · ${job.W} × ${job.H}px`;
    if (!job.n) return t('ui.preparing');
    const left = job.n > 2 ? Math.round((((performance.now() - job.t0) / job.n) * (job.all - job.n)) / 1000) : null;
    return t('ui.pass', { n: job.n, all: job.all }) + (left != null ? ' · ' + t('ui.left', { s: left }) : '');
  }
  const progress = () => (!job ? 0 : job.state === 'done' ? 100 : (job.n / job.all) * 100);

  async function start(design, cam, q) {
    if (job && job.ctrl) job.ctrl.abort();
    const [, , W, H, total] = QUALITIES().find(([id]) => id === q);
    const ctrl = new AbortController();
    const me = (job = { design, cam, q, ctrl, W, H, canvas: null, result: null, n: 0, all: total, t0: performance.now(), state: 'running' });
    emit();
    try {
      const out = await renderHQ(design, {
        width: W, height: H, samples: total, camera: cam, signal: ctrl.signal,
        // in the corner card (or a hidden tab) the render gives way to the rest of the page
        light: () => mode !== 'dialog' || document.hidden,
        onProgress: (n, all, canvas) => {
          if (job !== me) return;
          me.n = n; me.all = all; me.canvas = canvas;
          emit();
        },
      });
      if (job !== me) return;
      Object.assign(me, { result: out, canvas: out, state: 'done', ctrl: null });
      emit();
    } catch (e) {
      if (e && e.name === 'AbortError') return;
      console.error(e);
      if (job === me) { Object.assign(me, { state: 'failed', ctrl: null }); emit(); }
    }
  }

  /** Stop (or dismiss) the render and close whatever shows it. */
  function cancel() {
    if (job && job.ctrl) job.ctrl.abort();
    job = null;
    showDialog(false);
    showDock(false);
  }
  /** Leave the dialog: a running or finished render goes on in the corner. */
  function toDock() {
    showDialog(false);
    if (job && job.state !== 'failed') showDock(true);
    else job = null;
  }
  function toDialog() {
    showDock(false);
    showDialog(true);
  }

  /* ---- dialog ---- */
  let dialogEl = null, dialogOpener = null;
  function showDialog(on) {
    const host = document.getElementById('modalHost');
    if (!on) {
      if (dialogEl) {
        views.delete(dialogEl._sync);
        if (dialogEl.isConnected) host.replaceChildren();
        dialogEl = null;
        window.removeEventListener('hashchange', toDock);
        if (dialogOpener && dialogOpener.isConnected) dialogOpener.focus();
      }
      if (mode === 'dialog') mode = null;
      return;
    }
    mode = 'dialog';
    dialogOpener = document.activeElement;
    const stage = CL.h('div.ex-preview.hq-stage');
    const bar = CL.h('i.hq-bar-fill');
    const status = CL.h('p.hq-status', { 'aria-live': 'polite' });
    const saveBtn = CL.h('button.btn.btn-primary', { type: 'button', html: CL.icon('download') + `<span>${t('ui.savePng')}</span>`, onclick: savePng });
    const bgBtn = CL.h('button.btn.btn-outline', { type: 'button', text: t('ui.runInBackground'), onclick: toDock });
    const stopBtn = CL.h('button.btn.btn-ghost', { type: 'button', onclick: cancel });
    const pick = CL.h('div.segmented.block.hq-quality', { role: 'radiogroup', 'aria-label': t('ui.quality') },
      ...QUALITIES().map(([id, label, w, h]) => CL.h('button', {
        type: 'button', role: 'radio', 'data-id': id, title: `${w} × ${h}px`,
        onclick: () => {
          if (!job || job.q === id) return;
          CL.store.saveSettings({ renderQuality: id });
          start(job.design, job.cam, id);
        },
      }, label)));
    const modal = CL.h('div.modal.ex-modal.hq-modal', { role: 'dialog', 'aria-modal': 'true', 'aria-label': t('ui.renderTitle') },
      stage,
      CL.h('div.ex-side', null,
        CL.h('div.ex-head', null,
          CL.h('h3', { text: t('ui.renderTitle') }),
          CL.h('button.icon-btn.sm', { type: 'button', 'aria-label': t('common.close'), title: t('common.close'), html: CL.icon('close'), onclick: toDock })),
        CL.h('p.hq-note', { text: t('ui.renderNote') }),
        pick,
        CL.h('div.hq-bar', null, bar),
        status,
        CL.h('div.modal-actions', null, stopBtn, bgBtn, saveBtn)));
    const bd = CL.h('div.modal-backdrop', { onclick: (e) => { if (e.target === bd) toDock(); } }, modal);
    bd.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Escape') { e.preventDefault(); toDock(); } });
    bd._sync = () => {
      if (!job) return;
      pick.querySelectorAll('button').forEach((b) => { const on = b.dataset.id === job.q; b.classList.toggle('is-active', on); b.setAttribute('aria-checked', String(on)); });
      if (job.canvas && job.canvas.parentNode !== stage) stage.replaceChildren(job.canvas);
      if (!job.canvas) stage.replaceChildren();
      bar.style.width = `${progress()}%`;
      status.textContent = statusText();
      saveBtn.disabled = job.state !== 'done';
      bgBtn.hidden = job.state !== 'running';
      stopBtn.textContent = job.state === 'running' ? t('common.cancel') : t('common.close');
    };
    dialogEl = bd;
    views.add(bd._sync);
    window.addEventListener('hashchange', toDock);
    host.replaceChildren(bd);
    bd._sync();
    (job && job.state === 'done' ? saveBtn : bgBtn).focus();
  }

  /* ---- corner card ---- */
  let dockEl = null;
  function showDock(on) {
    if (!on) {
      if (dockEl) { views.delete(dockEl._sync); dockEl.remove(); dockEl = null; }
      if (mode === 'dock') mode = null;
      return;
    }
    mode = 'dock';
    if (dockEl) { dockEl._sync(); return; }
    const thumb = CL.h('button.hq-dock-thumb', { type: 'button', title: t('ui.openRender'), 'aria-label': t('ui.openRender'), onclick: toDialog });
    const bar = CL.h('i.hq-bar-fill');
    const status = CL.h('span.hq-dock-status', { 'aria-live': 'polite' });
    const saveBtn = CL.h('button.icon-btn.sm', { type: 'button', title: t('ui.savePng'), 'aria-label': t('ui.savePng'), html: CL.icon('download'), onclick: savePng });
    const openBtn = CL.h('button.icon-btn.sm', { type: 'button', title: t('ui.openRender'), 'aria-label': t('ui.openRender'), html: CL.icon('image'), onclick: toDialog });
    const closeBtn = CL.h('button.icon-btn.sm', { type: 'button', html: CL.icon('close'), onclick: cancel });
    const el = CL.h('aside.hq-dock', { 'aria-label': t('ui.renderTitle') },
      thumb,
      CL.h('div.hq-dock-body', null,
        CL.h('div.hq-dock-head', null, CL.h('strong', { text: t('ui.renderTitle') }), openBtn, saveBtn, closeBtn),
        CL.h('div.hq-bar', null, bar),
        status));
    el._sync = () => {
      if (!job) return;
      if (job.canvas && job.canvas.parentNode !== thumb) thumb.replaceChildren(job.canvas);
      bar.style.width = `${progress()}%`;
      status.textContent = statusText();
      saveBtn.hidden = job.state !== 'done';
      const stopLabel = job.state === 'running' ? t('common.cancel') : t('common.close');
      closeBtn.title = stopLabel;
      closeBtn.setAttribute('aria-label', stopLabel);
      el.classList.toggle('is-done', job.state === 'done');
    };
    dockEl = el;
    views.add(el._sync);
    document.body.append(el);
    el._sync();
  }

  /** Render dialog: pick a quality, watch the image clear up, then save the PNG. */
  CL.openRender = function (source, camera) {
    const design = CL.clone(source);
    let q = CL.store.settings.renderQuality || 'good';
    if (!QUALITIES().some(([id]) => id === q)) q = 'good';
    const cam = camera ? { position: camera.position.clone(), quaternion: camera.quaternion.clone(), fov: camera.fov } : null;
    showDock(false);
    start(design, cam, q);
    showDialog(true);
  };
})(window.CL);
