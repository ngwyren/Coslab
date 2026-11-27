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


  /** Lighting looks: real photo-studio panoramas (HDRI, CC0 from Poly Haven). Each render uses one
   *  (opts.look, or one picked at random), so a set of pictures does not repeat the same
   *  highlights. Four different studios, levelled to one tone.
   *  turn: which part of the studio faces the camera (radians); level: fine trim of
   *  its brightness so every look gives the same tone. */
  const LOOKS = {
    studioA: { file: 'studio_small_05', turn: 0, level: 1 },
    studioB: { file: 'studio_small_06', turn: 0, level: 0.68 },
    studioC: { file: 'studio_small_08', turn: 0, level: 1.08 },
    studioD: { file: 'studio_small_09', turn: 0, level: 0.95 },
  };
  const pickLook = (name) => {
    const ids = Object.keys(LOOKS);
    return LOOKS[name] ? name : ids[Math.floor(Math.random() * ids.length)];
  };

  /** Read a Radiance .hdr picture: { w, h, rgb: Float32Array (linear, 3 per pixel) }. */
  function parseHDR(buf) {
    const b = new Uint8Array(buf);
    let p = 0, line = '';
    const next = () => { let s = ''; while (p < b.length && b[p] !== 10) s += String.fromCharCode(b[p++]); p++; return s; };
    if (!/^#\?(RADIANCE|RGBE)/.test(next())) throw new Error('not an HDR file');
    while ((line = next()) !== '') { /* header lines */ }
    const m = /-Y (\d+) \+X (\d+)/.exec(next());
    if (!m) throw new Error('unsupported HDR layout');
    const h = +m[1], w = +m[2], rgb = new Float32Array(w * h * 3), row = new Uint8Array(w * 4);
    for (let y = 0; y < h; y++) {
      if (b[p] !== 2 || b[p + 1] !== 2 || ((b[p + 2] << 8) | b[p + 3]) !== w) throw new Error('unsupported HDR packing');
      p += 4;
      for (let c = 0; c < 4; c++) {
        for (let x = 0; x < w;) {
          let n = b[p++];
          if (n > 128) { n -= 128; const v = b[p++]; while (n--) row[c * w + x++] = v; }
          else while (n--) row[c * w + x++] = b[p++];
        }
      }
      for (let x = 0; x < w; x++) {
        const e = row[3 * w + x], s = e ? Math.pow(2, e - 136) : 0, o = (y * w + x) * 3;
        rgb[o] = row[x] * s; rgb[o + 1] = row[w + x] * s; rgb[o + 2] = row[2 * w + x] * s;
      }
    }
    return { w, h, rgb };
  }

  const hdris = new Map(); // file -> Promise<{ w, h, rgb }>
  const loadHDR = (file) => {
    if (!hdris.has(file)) {
      const job = fetch(new URL(`assets/hdri/${file}.hdr`, document.baseURI).href)
        .then((r) => { if (!r.ok) throw new Error(`HDRI ${r.status}`); return r.arrayBuffer(); })
        .then(parseHDR);
      job.catch(() => hdris.delete(file));
      hdris.set(file, job);
    }
    return hdris.get(file);
  };

  /** How much light a panorama throws on a level floor (1 = an even sky of brightness 1). The
   *  renderer reads the rows from the ground (first) up to straight overhead (last). */
  const floorLight = (data, W, H) => {
    let s = 0;
    for (let y = H >> 1; y < H; y++) {
      const up = ((y + 0.5) / H - 0.5) * Math.PI, k = Math.sin(up) * Math.cos(up);
      for (let x = 0; x < W; x++) { const i = (y * W + x) * 4; s += (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) * k; }
    }
    return (s * 2 * Math.PI) / (W * H);
  };

  const panorama = (T, data, W, H) => {
    const tex = new T.DataTexture(data, W, H, T.RGBAFormat, T.FloatType);
    tex.mapping = T.EquirectangularReflectionMapping;
    tex.minFilter = tex.magFilter = T.LinearFilter;
    tex.needsUpdate = true;
    tex.userData.floor = floorLight(data, W, H);
    return tex;
  };

  /** Plain studio light (no file needed): an even, soft sky, a little brighter overhead. Used when
   *  the studio picture cannot be loaded. */
  function plainEnv(T) {
    const W = 128, H = 64, data = new Float32Array(W * H * 4);
    for (let y = 0; y < H; y++) {
      const up = ((y + 0.5) / H - 0.5) * Math.PI; // rows run from the ground to straight overhead
      const l = 1.12 + 0.12 * Math.sin(Math.max(up, 0));
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        data[i] = data[i + 1] = data[i + 2] = l;
        data[i + 3] = 1;
      }
    }
    return panorama(T, data, W, H);
  }

  /** Studio light for one look, as an HDR panorama turned to keep its place relative to the camera.
   *  The picture is levelled to one overall brightness, its colour cast is mostly taken out (so
   *  Pantone colours stay true) and bare lamps are capped (no sparkle noise).
   *  It is hung upside down on purpose: the file's first row (the studio ceiling) goes in as the
   *  renderer's ground row. The studio's floor, one broad and even bounce, becomes the light from
   *  above, and the lamps end up below the set, where the floor hides them. That is what gives the
   *  soft, streak-free light; the right way up, bare lamps mirror in every glossy cap. */
  async function studioEnv(T, look, facing = 0) {
    let src;
    try { src = await loadHDR(LOOKS[look].file); } catch (e) { console.warn(e); return plainEnv(T); }
    const { w, h, rgb } = src, data = new Float32Array(w * h * 4);
    const lum = new Float32Array(w * h);
    let sum = 0, wt = 0;
    for (let y = 0; y < h; y++) {
      const k = Math.cos((0.5 - (y + 0.5) / h) * Math.PI);
      for (let x = 0; x < w; x++) {
        const o = (y * w + x) * 3, l = 0.2126 * rgb[o] + 0.7152 * rgb[o + 1] + 0.0722 * rgb[o + 2];
        lum[y * w + x] = l; sum += Math.min(l, 50) * k; wt += k;
      }
    }
    // level by the room, not by its lamps: average again with everything far above the first average held down
    const m0 = sum / wt || 1;
    let s2 = 0;
    for (let y = 0; y < h; y++) {
      const k = Math.cos((0.5 - (y + 0.5) / h) * Math.PI);
      for (let x = 0; x < w; x++) s2 += Math.min(lum[y * w + x], m0 * 2) * k;
    }
    const gain = ENV_LEVEL / (s2 / wt || 1), cap = ENV_LEVEL * 14;
    // the camera sits at panorama angle (PI/2 - facing); bring the look's own front there
    const shift = Math.round(((LOOKS[look].turn - (Math.PI / 2 - facing)) / (Math.PI * 2)) * w);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const sx = (((x + shift) % w) + w) % w, o = (y * w + sx) * 3, i = (y * w + x) * 4;
        const l = lum[y * w + sx], s = gain * (l * gain > cap ? cap / (l * gain) : 1);
        for (let c = 0; c < 3; c++) data[i + c] = s * (l * ENV_GREY + rgb[o + c] * (1 - ENV_GREY));
        data[i + 3] = 1;
      }
    }
    // same tone in every studio: scale so the total light of the room, lamps included, is equal
    // (that is what sets the brightness of the backdrop); only highlights and shadow then differ
    let fl = 0, fw = 0;
    for (let y = 0; y < h; y++) {
      const k = Math.cos((0.5 - (y + 0.5) / h) * Math.PI);
      for (let x = 0; x < w; x++) fl += data[(y * w + x) * 4 + 1] * k;
      fw += k * w;
    }
    const tone = (ENV_TONE * (LOOKS[look].level || 1)) / (fl / fw || 1);
    for (let i = 0; i < data.length; i += 4) { data[i] *= tone; data[i + 1] *= tone; data[i + 2] *= tone; }
    return panorama(T, data, w, h);
  }
  const ENV_LEVEL = 0.95; // first rough levelling of a studio picture (sets where lamps are capped)
  const ENV_TONE = 1.0; // average light every look is scaled to: the shared, bright tone
  const ENV_GREY = 0.75; // how much of the studio's own colour cast is removed (a little warmth stays)

  // Backdrop paper gives off its own even light, so wall and floor show exactly one colour under
  // any studio (a sweep that is only lit goes darker up the wall and to one side). PAPER_TONE: its
  // brightness, as a share of the paper colour. PAPER_SHADOW: round the product the floor takes
  // this share of its light from the studio instead, which is what draws the real, soft shadow.
  const PAPER_TONE = 1, PAPER_SHADOW = 0.4;

  /** Two round maps for the floor: how much studio light it takes (all of its share near the
   *  middle, none towards the rim) and how much it glows by itself (the rest, so that open floor
   *  keeps one tone from the product out to the wall). */
  function floorMaps(T, albedo, share) {
    const n = 256;
    const srgb = (v) => Math.round(255 * (v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055));
    const make = (value) => {
      const c = document.createElement('canvas');
      c.width = c.height = n;
      const ctx = c.getContext('2d'), img = ctx.createImageData(n, n);
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
        const r = Math.hypot(x + 0.5 - n / 2, y + 0.5 - n / 2) / (n / 2); // 0 at the product, 1 at the rim
        const t = CL.clamp((r - 0.25) / 0.6, 0, 1), v = srgb(value(1 - t * t * (3 - 2 * t)));
        img.data.set([v, v, v, 255], (y * n + x) * 4);
      }
      ctx.putImageData(img, 0, 0);
      const map = new T.CanvasTexture(c);
      map.colorSpace = T.SRGBColorSpace;
      return map;
    };
    return [make((lit) => albedo * lit), make((lit) => PAPER_TONE - share * lit)];
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

  async function buildScene(T, design, backdrop, facing = 0, sky = 1, size = 1) {
    const I = CL.Preview3D.internals;
    const L = CL.models.layout(design.model);
    const m = L.model;
    const raw = await I.loadModel(m.id);
    const tex = await artTextures(T, design, L);
    const P = design.parts;
    const scene = new T.Scene();
    const tube = new T.Group();
    tube.scale.setScalar((I.TUBE_H / m.h) * size); // size 1: the container fills the frame height it is given
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

    // photo-studio sweep: a round floor that curves up into a wall behind the product (seen from
    // the camera), so there is no horizon line; the front is open to the studio light
    const TH = I.TUBE_H, rad = TH * 5, cove = TH, wallH = TH * 2.5;
    const prof2 = [new T.Vector2(rad - cove, 0)];
    for (let i = 1; i <= 24; i++) {
      const a = (i / 24) * Math.PI / 2;
      prof2.push(new T.Vector2(rad - cove + Math.sin(a) * cove, cove - Math.cos(a) * cove));
    }
    prof2.push(new T.Vector2(rad, wallH));
    const tone = new T.Color(backdrop || '#f0f0f0');
    const wall = mat({ color: 0x000000, emissive: tone, emissiveIntensity: PAPER_TONE, roughness: 1, side: T.DoubleSide });
    const span = Math.PI * 1.1; // a little more than the back half
    scene.add(new T.Mesh(new T.LatheGeometry(prof2, 64, facing + Math.PI - span / 2, span), wall));
    scene.add(new T.Mesh(new T.RingGeometry(rad - cove, rad * 4, 64, 1, facing + Math.PI / 2 + span / 2, Math.PI * 2 - span).rotateX(-Math.PI / 2), wall));
    // the floor round the product: `sky` is the studio light that reaches open floor, so there
    // the lit share and the glow add up to exactly the wall's tone
    const albedo = Math.min(0.9, (PAPER_SHADOW * PAPER_TONE) / Math.max(sky, 0.05));
    [tex.__lit, tex.__glow] = floorMaps(T, albedo, albedo * sky);
    scene.add(new T.Mesh(new T.CircleGeometry(rad - cove, 96).rotateX(-Math.PI / 2),
      mat({ color: tone, map: tex.__lit, emissive: tone, emissiveMap: tex.__glow, roughness: 0.95, side: T.DoubleSide })));
    return { scene, textures: Object.values(tex) };
  }

  /** Backdrop paper chosen from the product: a pale wash of its most colourful part (cap or body),
   *  or the tint inside a clear body), so the set suits the lipstick without competing with it.
   *  Products with next to no colour
   *  (clear, white, black, grey) get a warm neutral. */
  function backdropOf(design) {
    const I = CL.Preview3D.internals;
    let hue = 0, sat = 0, top = 0;
    ['cap', 'base'].forEach((k) => {
      const part = design && design.parts && design.parts[k];
      const cols = I.colorsOf(part && part.fill);
      if (part && part.product && part.product.color) cols.push(part.product.color);
      cols.forEach((c) => {
        const { h, s, v } = CL.color.rgbToHsv(CL.color.hexToRgb(c));
        const score = s * v; // colourful and not dark (a black cap has no say)
        if (score > top) { top = score; hue = h; sat = s; }
      });
    });
    if (top < 0.1) return '#ebe8e3';
    return CL.color.rgbToHex(CL.color.hsvToRgb({ h: hue, s: Math.min(0.07, 0.02 + sat * 0.08), v: 0.93 }));
  }

  /** Phones, tablets and low-memory devices: the render is sized down so their GPU can finish it. */
  const weakDevice = () => matchMedia('(hover: none) and (pointer: coarse)').matches || (navigator.deviceMemory || 8) <= 2;

  /** No real graphics card: no WebGL 2, or WebGL drawn by the processor (SwiftShader, llvmpipe, Basic Render). */
  let gpuless = null;
  function noGpu() {
    if (gpuless !== null) return gpuless;
    try {
      const gl = document.createElement('canvas').getContext('webgl2', { failIfMajorPerformanceCaveat: true });
      if (!gl) return (gpuless = true);
      const info = gl.getExtension('WEBGL_debug_renderer_info');
      const name = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : '';
      gpuless = /swiftshader|llvmpipe|softpipe|software|basic render/i.test(name);
      const lose = gl.getExtension('WEBGL_lose_context');
      if (lose) lose.loseContext();
    } catch (e) {
      gpuless = true;
    }
    return gpuless;
  }

  /**
   * Render a design. opts: { width, height, samples, camera ({position, quaternion, fov}),
   * onProgress(samples, total, canvas), signal, look (a studio from LOOKS, else one at random),
   * onLook(id), backdrop (paper colour, else chosen from the product), fill (share of the frame
   * height the container takes), lift (raise it by this share of the frame), size (0..1: its
   * height as a share of the tallest container, for pictures that are compared side by side) }.
   * Resolves with a 2D canvas of the finished image.
   */
  /** The product angle (radians) a printed design is shot from: the print just right of the middle, like the archive pictures. */
  const PRINT_YAW = -0.28, PRINT_PLAY = 0.04;

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
    // The live view turns by itself, so the moment of the click could show the print from the
    // side or the back: a design with print is always shot with the printed face to the camera.
    if ((design.layers || []).some((l) => l.visible !== false)) {
      const yaw = CL.clamp(Math.atan2(dir.x, dir.z), PRINT_YAW - PRINT_PLAY, PRINT_YAW + PRINT_PLAY), flat = Math.hypot(dir.x, dir.z);
      dir.x = Math.sin(yaw) * flat;
      dir.z = Math.cos(yaw) * flat;
    }
    const fill = opts.fill || 0.66;
    const D = (I.TUBE_H / fill) / (2 * Math.tan((camera.fov * Math.PI) / 360));
    // lift: raise the subject by this share of the frame height (room for an overlay at the bottom)
    const aim = ty - (opts.lift || 0) * (I.TUBE_H / fill);
    // The camera stays level (a shifted lens, as in product photography): it stands a little
    // above the middle of the tube yet looks straight ahead, so the sides of the container stay
    // upright and parallel instead of leaning in; the frame is slid down to keep it centred.
    const flatLen = Math.hypot(dir.x, dir.z) || 1;
    camera.position.set(dir.x * D, aim + dir.y * D, dir.z * D);
    camera.lookAt(0, aim + dir.y * D, 0);
    camera.aspect = W / H;
    camera.setViewOffset(W, H, 0, Math.round(((H / 2) / Math.tan((camera.fov * Math.PI) / 360)) * (dir.y / flatLen)), W, H);
    camera.updateProjectionMatrix();

    const look = pickLook(opts.look);
    if (opts.onLook) opts.onLook(look);
    const backdrop = opts.backdrop || backdropOf(design);
    const env = await studioEnv(T, look, Math.atan2(dir.x, dir.z));
    const { scene, textures } = await buildScene(T, design, backdrop, Math.atan2(dir.x, dir.z), env.userData.floor, opts.size || 1);
    scene.environment = env;
    scene.background = new T.Color(backdrop).multiplyScalar(PAPER_TONE); // same as the wall, should the frame ever look past it

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
    dn.material.kSigma = 1.5;
    // stronger while few passes are in (grainy), down to the fine setting at 256+ passes
    const denoise = () => {
      const k = Math.min(Math.sqrt(256 / Math.max(pt.samples, 1)), 6);
      dn.material.sigma = (opts.denoise ?? 4) * Math.min(Math.max(k, 1), 2.6);
      dn.material.threshold = Math.min(0.12 * Math.max(k * k, 1), 0.6);
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
      // a turn of the event loop without a timer: browsers hold the timers of a tab hidden for
      // minutes back to one a minute, which would freeze the render there
      const tick = () => new Promise((r) => { const c = new MessageChannel(); c.port1.onmessage = () => r(); c.port2.postMessage(0); });
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
        // a dialog or card is animating: leave the GPU to it
        while (opts.pause && opts.pause() && !stop()) await sleep(40);
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
        if (hidden) await tick(); else await sleep(light ? Math.max(40, dt * 2) : dt * 0.3);
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
  CL.renderBackdrop = backdropOf;

  /* ---------- Render: one job at a time, shown in a dialog or as a small card in a corner ----------
     Leaving the dialog (outside click, Esc, another page, "Run in background") keeps the render
     going in the corner card; only Cancel stops it. */
  /** Address of the render worker (js/core/config.js); empty when the site has none. */
  const aiUrl = () => ((window.COSLAB_CONFIG || {}).renderApi || '').trim();
  const QUALITIES = () => [
    // AI: a quick 3D picture from this device, finished (light, reflections, clean-up) by the render worker
    ...(aiUrl() ? [['ai', 'AI', 1024, 1280, 1]] : []),
    ...(weakDevice()
      ? [['draft', t('ui.draft'), 480, 600, 48], ['good', t('ui.good'), 800, 1000, 160], ['studio', 'Studio', 1280, 1600, 320]]
      : [['draft', t('ui.draft'), 640, 800, 64], ['good', t('ui.good'), 1080, 1350, 256], ['studio', 'Studio', 2160, 2700, 512]]),
  ];
  let job = null; // { design, cam, q, ctrl, W, H, canvas, result, n, all, t0, state: 'running' | 'done' | 'failed' }
  let mode = null; // 'dialog' | 'dock' | null
  const views = new Set();
  const emit = () => views.forEach((fn) => fn());

  function savePng() {
    if (!job || !job.result) return;
    const a = document.createElement('a');
    a.download = `${(job.design.name || 'COSLAB').replace(/[\/:*?"<>|]+/g, ' ').trim()} - render.png`;
    a.href = job.result.toDataURL('image/png');
    a.click();
  }

  function statusText() {
    if (!job) return '';
    if (job.state === 'failed') return t(job.q === 'ai' ? 'ui.aiFail' : 'ui.renderFail');
    if (job.state === 'done') return `${t('ui.done')} · ${job.W} × ${job.H}px`;
    if (job.q === 'ai') return t('ui.aiWorking');
    if (!job.n) return t('ui.preparing');
    const left = job.n > 2 ? Math.round((((performance.now() - job.t0) / job.n) * (job.all - job.n)) / 1000) : null;
    return t('ui.pass', { n: job.n, all: job.all }) + (left != null ? ' · ' + t('ui.left', { s: left }) : '');
  }
  const progress = () => (!job ? 0 : job.state === 'done' ? 100 : job.q === 'ai' ? (job.canvas ? 60 : 15) : (job.n / job.all) * 100);

  /** A quick picture of the design from the ordinary (not path traced) 3D view, at the given camera angle. */
  async function snapshot(design, cam, W, H) {
    await CL.loadThree();
    const host = CL.h('div', { 'aria-hidden': 'true', style: { position: 'fixed', left: '-10000px', top: '0', width: `${W / 2}px`, height: `${H / 2}px`, pointerEvents: 'none' } });
    document.body.append(host);
    const view = new CL.Preview3D(host, { autoRotate: false, interactive: false });
    try {
      if (!view.ok || !(await view.setDesign(design))) throw new Error('3D view unavailable');
      cancelAnimationFrame(view._raf); // frames are drawn by hand below, so a hidden tab works too
      if (cam) {
        const d = cam.position.clone().sub(view.target);
        const printed = (design.layers || []).some((l) => l.visible !== false);
        const yaw = Math.atan2(d.x, d.z);
        view.rotY = view.targetRotY = printed ? CL.clamp(yaw, PRINT_YAW - PRINT_PLAY, PRINT_YAW + PRINT_PLAY) : yaw;
        view.rotX = view.targetRotX = CL.clamp(Math.asin(CL.clamp(d.y / (d.length() || 1), -1, 1)), -0.05, 0.25);
      }
      view._resize();
      view._goHome();
      view._loop(0);
      cancelAnimationFrame(view._raf);
      const out = document.createElement('canvas');
      out.width = W; out.height = H;
      const ctx = out.getContext('2d');
      ctx.fillStyle = '#f2f2f2';
      ctx.fillRect(0, 0, W, H);
      ctx.drawImage(view.renderer.domElement, 0, 0, W, H);
      return out;
    } finally {
      view.dispose();
      host.remove();
    }
  }

  /** The finished picture for a quick one, from the render worker. */
  async function aiFinish(base, signal) {
    const res = await fetch(aiUrl(), {
      method: 'POST', signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base.toDataURL('image/jpeg', 0.9) }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body.image) throw new Error(body.error || `render service ${res.status}`);
    const img = new Image();
    img.src = body.image;
    await img.decode();
    const out = document.createElement('canvas');
    out.width = img.naturalWidth; out.height = img.naturalHeight;
    out.getContext('2d').drawImage(img, 0, 0);
    return out;
  }

  /** wait: ms to leave the page alone first (an opening animation), before the heavy set-up starts. */
  async function start(design, cam, q, wait = 0, look = null) {
    if (job && job.ctrl) job.ctrl.abort();
    const [, , W, H, total] = QUALITIES().find(([id]) => id === q);
    const ctrl = new AbortController();
    const me = (job = { design, cam, q, ctrl, W, H, look, canvas: null, result: null, n: 0, all: total, t0: performance.now(), state: 'running' });
    emit();
    try {
      if (wait) { await new Promise((r) => setTimeout(r, wait)); if (job !== me) return; }
      let out;
      if (q === 'ai') {
        const base = await snapshot(design, cam, W, H);
        if (job !== me) return;
        me.canvas = base; // shown while the worker is busy
        emit();
        out = await aiFinish(base, ctrl.signal);
        if (job !== me) return;
        me.W = out.width; me.H = out.height;
      } else {
        out = await renderHQ(design, {
          width: W, height: H, samples: total, camera: cam, signal: ctrl.signal,
          look: look || undefined, onLook: (name) => { me.look = name; },
          // in the corner card (or a hidden tab) the render gives way to the rest of the page
          light: () => mode !== 'dialog' || document.hidden,
          pause: () => performance.now() < busyUntil,
          onProgress: (n, all, canvas) => {
            if (job !== me) return;
            me.n = n; me.all = all; me.canvas = canvas;
            emit();
          },
        });
        if (job !== me) return;
      }
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
  /* The dialog and the corner card are two sizes of the same thing: one shrinks or grows into
     the place of the other, instead of one vanishing and the other popping up. */
  const MORPH_MS = 340;
  let busyUntil = 0; // until then the render loop rests (see renderHQ's pause)
  const busyFor = (ms) => { busyUntil = Math.max(busyUntil, performance.now() + ms + 80); };
  /** A small still of the render, for the view that is leaving (the live canvas moves to the new one). */
  function ghostOf(canvas) {
    if (!canvas || !canvas.width) return null;
    const g = document.createElement('canvas'), k = Math.min(1, 480 / canvas.width);
    g.width = Math.round(canvas.width * k); g.height = Math.round(canvas.height * k);
    try { g.getContext('2d').drawImage(canvas, 0, 0, g.width, g.height); } catch (e) { return null; }
    return g;
  }
  function morph(from, to) {
    if (!from || !to || !from.animate || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const a = from.getBoundingClientRect(), b = to.getBoundingClientRect();
    if (!a.width || !b.width) return;
    const timing = { duration: MORPH_MS, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' };
    busyFor(MORPH_MS);
    from.style.transformOrigin = to.style.transformOrigin = '0 0';
    from.animate([
      { transform: 'none', opacity: 1 },
      { transform: `translate(${b.left - a.left}px, ${b.top - a.top}px) scale(${b.width / a.width}, ${b.height / a.height})`, opacity: 0 },
    ], Object.assign({ fill: 'forwards' }, timing));
    to.animate([
      { transform: `translate(${a.left - b.left}px, ${a.top - b.top}px) scale(${a.width / b.width}, ${a.height / b.height})`, opacity: 0 },
      { transform: 'none', opacity: 1 },
    ], Object.assign({ fill: 'backwards' }, timing));
  }
  /** The dialog opens out of the button that was pressed. */
  function growFrom(opener, el) {
    if (!opener || !el || !el.animate || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const a = opener.getBoundingClientRect(), b = el.getBoundingClientRect();
    if (!a.width || !b.width) return;
    el.style.transformOrigin = '0 0';
    busyFor(420);
    el.animate([
      { transform: `translate(${a.left - b.left}px, ${a.top - b.top}px) scale(${a.width / b.width}, ${a.height / b.height})`, opacity: 0 },
      { opacity: 1, offset: 0.35 },
      { transform: 'none', opacity: 1 },
    ], { duration: 420, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'backwards' });
  }
  /** Leave the dialog: a running or finished render goes on in the corner. */
  function toDock() {
    const from = dialogEl && dialogEl.querySelector('.hq-modal'), stage = from && from.querySelector('.hq-stage');
    const ghost = job && ghostOf(job.canvas);
    showDialog(false);
    if (job && job.state !== 'failed') {
      showDock(true);
      if (stage && ghost) stage.replaceChildren(ghost);
      morph(from, dockEl);
    } else job = null;
  }
  function toDialog() {
    const from = dockEl, thumb = from && from.querySelector('.hq-dock-thumb');
    const ghost = job && ghostOf(job.canvas);
    showDock(false);
    showDialog(true);
    if (thumb && ghost) thumb.replaceChildren(ghost);
    morph(from, dialogEl && dialogEl.querySelector('.hq-modal'));
  }

  /* ---- dialog ---- */
  let dialogEl = null, dialogOpener = null;
  function showDialog(on) {
    const host = document.getElementById('modalHost');
    if (!on) {
      if (dialogEl) {
        views.delete(dialogEl._sync);
        const gone = dialogEl;
        gone.classList.add('is-leaving'); // fades out, then goes
        setTimeout(() => gone.remove(), MORPH_MS);
        dialogEl = null;
        window.removeEventListener('hashchange', toDock);
        if (dialogOpener && dialogOpener.isConnected) dialogOpener.focus();
      }
      if (mode === 'dialog') mode = null;
      CL.Preview3D.hold = false;
      return;
    }
    mode = 'dialog';
    CL.Preview3D.hold = true; // the live 3D view behind the dialog stops drawing
    dialogOpener = document.activeElement;
    const stage = CL.h('div.ex-preview.hq-stage');
    const bar = CL.h('i.hq-bar-fill');
    const status = CL.h('p.hq-status', { 'aria-live': 'polite' });
    const saveBtn = CL.h('button.btn.btn-primary', { type: 'button', html: CL.icon('download') + `<span>${t('ui.savePng')}</span>`, onclick: savePng });
    const note = CL.h('p.hq-note');
    const bgBtn = CL.h('button.btn.btn-outline', { type: 'button', text: t('ui.runInBackground'), onclick: toDock });
    const stopBtn = CL.h('button.btn.btn-ghost', { type: 'button', onclick: cancel });
    const pick = CL.h('div.segmented.block.hq-quality', { role: 'radiogroup', 'aria-label': t('ui.quality') },
      ...QUALITIES().map(([id, label, w, h]) => CL.h('button', {
        type: 'button', role: 'radio', 'data-id': id, title: `${w} × ${h}px`,
        onclick: () => {
          if (!job || job.q === id) return;
          CL.store.saveSettings({ renderPick: id }); // the visitor's own choice wins over the automatic one
          start(job.design, job.cam, id, 0, job.look); // same studio, only the quality changes
        },
      }, label)));
    const modal = CL.h('div.modal.ex-modal.hq-modal', { role: 'dialog', 'aria-modal': 'true', 'aria-label': t('ui.renderTitle') },
      stage,
      CL.h('div.ex-side', null,
        CL.h('div.ex-head', null,
          CL.h('h3', { text: t('ui.renderTitle') }),
          CL.h('button.icon-btn.sm', { type: 'button', 'aria-label': t('common.close'), title: t('common.close'), html: CL.icon('close'), onclick: toDock })),
        note,
        pick,
        CL.h('div.hq-bar', null, bar),
        status,
        CL.h('div.modal-actions', null, stopBtn, bgBtn, saveBtn)));
    const bd = CL.h('div.modal-backdrop', { onclick: (e) => { if (e.target === bd) toDock(); } }, modal);
    bd.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Escape') { e.preventDefault(); toDock(); } });
    bd._sync = () => {
      if (!job) return;
      note.textContent = t(job.q === 'ai' ? 'ui.aiNote' : 'ui.renderNote');
      pick.querySelectorAll('button').forEach((b) => { const on = b.dataset.id === job.q; b.classList.toggle('is-active', on); b.setAttribute('aria-checked', String(on)); });
      if (job.canvas && job.canvas.parentNode !== stage) stage.replaceChildren(job.canvas);
      if (!job.canvas) stage.replaceChildren();
      bar.style.width = `${progress()}%`;
      // which studio lit this picture (one is picked at random for every render)
      status.textContent = statusText() + (job.look && job.q !== 'ai' ? ' · ' + job.look.replace('studio', 'Studio ') : '');
      saveBtn.hidden = job.state !== 'done'; // running: Cancel + Run in background; done: Close + Save
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
      if (dockEl) {
        const gone = dockEl;
        views.delete(gone._sync);
        gone.classList.add('is-leaving'); // slides out, then goes
        setTimeout(() => gone.remove(), MORPH_MS);
        dockEl = null;
      }
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
    // the whole card opens the dialog again, not only the thumbnail
    el.addEventListener('click', (e) => { if (!e.target.closest('button')) toDialog(); });
    dockEl = el;
    views.add(el._sync);
    document.body.append(el);
    el._sync();
  }

  /** Render dialog: pick a quality, watch the image clear up, then save the PNG. */
  CL.openRender = function (source, camera) {
    const design = CL.clone(source);
    const pressed = document.activeElement && document.activeElement.closest && document.activeElement.closest('button, a');
    // Without a choice of their own: devices without a real GPU (or phones) send the work to the
    // render worker, devices with one render here.
    let q = CL.store.settings.renderPick;
    if (!QUALITIES().some(([id]) => id === q)) q = aiUrl() && (noGpu() || weakDevice()) ? 'ai' : 'good';
    const cam = camera ? { position: camera.position.clone(), quaternion: camera.quaternion.clone(), fov: camera.fov } : null;
    showDock(false);
    start(design, cam, q, 460); // the dialog opens first, then the work begins
    showDialog(true);
    growFrom(pressed, dialogEl && dialogEl.querySelector('.hq-modal'));
  };
})(window.CL);
