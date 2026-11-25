/* ==========================================================
   COSLAB — 3D preview (Three.js)
   Shows the real container meshes exported from the Blender file
   (assets/models/*.bin, loaded on demand). Colour, gradient and clear
   plastic are driven by the design; artwork is projected on the front.
   ========================================================== */
(function (CL) {
  const TUBE_H = 5.4; // every container is scaled to this height in the scene

  const FINISH = {
    matte: { roughness: 0.85, metalness: 0, specularIntensity: 0.15 },
    satin: { roughness: 0.5, metalness: 0, specularIntensity: 0.3 },
    gloss: { roughness: 0.32, metalness: 0, specularIntensity: 0.4 },
    metallic: { roughness: 0.38, metalness: 0.75 },
  };

  // Keep the product's own colour: the lights only shape it (0 = fully lit, 1 = flat colour)
  const TRUE_COLOR = '0.4';
  const trueColor = (m, key, rim = '0.0') => {
    m.onBeforeCompile = (sh) => {
      sh.fragmentShader = sh.fragmentShader.replace('#include <output_fragment>', `
          outgoingLight = mix(outgoingLight, diffuseColor.rgb, ${TRUE_COLOR});
          float clEdge = 1.0 - abs(dot(normalize(normal), normalize(vViewPosition)));
          outgoingLight *= 1.0 - ${rim} * clEdge * clEdge;
          #include <output_fragment>`);
    };
    m.customProgramCacheKey = () => 'clTrue-' + key;
    return m;
  };

  const MODEL_VERSION = 3;
  const modelCache = new Map();

  /** Load one container: { body, cap, wand, foot, wiper, art_body, art_cap } as raw attributes (mm, y-up). */
  function loadModel(id) {
    if (!modelCache.has(id)) {
      const p = fetch(`assets/models/${id}.bin?v=${MODEL_VERSION}`)
        .then((r) => { if (!r.ok) throw new Error(`model ${id}: HTTP ${r.status}`); return r.arrayBuffer(); })
        .then((buf) => {
          const len = new DataView(buf).getUint32(0, true);
          const head = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 4, len)));
          const off = 4 + len;
          const out = {};
          Object.entries(head).forEach(([k, e]) => {
            out[k] = {
              q: new Int16Array(buf, off + e.p, e.v * 3), // 1/200 mm
              n: new Int8Array(buf, off + e.n, e.v * 4),
              x: e.u32 ? new Uint32Array(buf, off + e.x, e.i) : new Uint16Array(buf, off + e.x, e.i),
              outer: e.o, // first index of the outside skin (inner walls come first)
            };
          });
          return out;
        });
      p.catch(() => modelCache.delete(id)); // allow a retry after a network error
      modelCache.set(id, p);
    }
    return modelCache.get(id);
  }

  function makeGeometry(raw) {
    const g = new THREE.BufferGeometry();
    const n = raw.q.length / 3;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < pos.length; i++) pos[i] = raw.q[i] / 200;
    const nor = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) for (let k = 0; k < 3; k++) nor[i * 3 + k] = raw.n[i * 4 + k] / 127;
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    g.setIndex(new THREE.BufferAttribute(raw.x, 1));
    return g;
  }

  const linear = (hex) => new THREE.Color(hex).convertSRGBToLinear();

  function colorsOf(fill) {
    if (fill && fill.type === 'linear' && fill.stops && fill.stops.length) {
      return [fill.stops[0].c, fill.stops[fill.stops.length - 1].c];
    }
    const c = (fill && fill.color) || '#dedad2';
    return [c, c];
  }

  /** Vertex colours for an opaque part: plain or 2-colour gradient. */
  function paintGeometry(g, part, y0, y1) {
    const [a, b] = colorsOf(part && part.fill).map(linear);
    const surface = (part && part.surface) || 'solid';
    const pos = g.attributes.position;
    const out = new Float32Array(pos.count * 4);
    const mix = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const u = CL.clamp((pos.getY(i) - y0) / (y1 - y0), 0, 1);
      mix.copy(a).lerp(b, surface === 'solid-gradient' || surface === 'shimmer' ? u : 0);
      out.set([mix.r, mix.g, mix.b, 1], i * 4);
    }
    g.setAttribute('color', new THREE.BufferAttribute(out, 4));
  }

  /** Per-pixel version of the clear gradient (the decimated walls have too few vertices for a smooth one). */
  function patchClearGradient(sh, part, y0, y1) {
    const [a, b] = colorsOf(part.fill).map(linear);
    Object.assign(sh.uniforms, { clA: { value: a }, clB: { value: b }, clY: { value: new THREE.Vector2(y0, y1) } });
    sh.vertexShader = 'varying float vClY;\n' + sh.vertexShader.replace('#include <begin_vertex>', 'vClY = position.y;\n#include <begin_vertex>');
    sh.fragmentShader = 'varying float vClY; uniform vec3 clA; uniform vec3 clB; uniform vec2 clY;\n' + sh.fragmentShader.replace('#include <color_fragment>', `
      float clU = clamp((vClY - clY.x) / (clY.y - clY.x), 0.0, 1.0);
      diffuseColor.rgb = mix(clA, clB, min(clU / 0.55, 1.0));
      diffuseColor.a = clU < 0.55 ? mix(0.92, 0.42, clU / 0.55) : mix(0.42, 0.06, (clU - 0.55) / 0.45);`);
  }

  const isClear = (part) => !!part && (part.surface === 'clear' || part.surface === 'clear-gradient');
  const isClearMaterial = (part) => isClear(part) && colorsOf(part.fill).every((c) => CL.pantone.nearest(c).code === 'Clear');

  function makeContactShadowTexture() {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 512;
    const ctx = c.getContext('2d');
    const grad = ctx.createRadialGradient(256, 256, 20, 256, 256, 245);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.35)');
    grad.addColorStop(0.25, 'rgba(0, 0, 0, 0.20)');
    grad.addColorStop(0.55, 'rgba(0, 0, 0, 0.08)');
    grad.addColorStop(0.85, 'rgba(0, 0, 0, 0.02)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);
    const tx = new THREE.CanvasTexture(c);
    return tx;
  }

  /**
   * Daylight beside a large window: bright overhead, softer floor bounce, one broad window lobe
   * on the left and a faint fill on the right. The brightness changes smoothly everywhere, so
   * reflections stay soft (no light strips) and neutral white keeps the product's colour.
   */
  function makeEnv(renderer) {
    const pm = new THREE.PMREMGenerator(renderer);
    const env = new THREE.Scene();
    const geo = new THREE.SphereGeometry(10, 96, 64);
    const pos = geo.attributes.position;
    const rgb = new Float32Array(pos.count * 3);
    const win = new THREE.Vector3(-0.62, 0.5, 0.6).normalize();
    const fill = new THREE.Vector3(0.75, 0.15, 0.6).normalize();
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).normalize();
      const sky = v.y > 0 ? 0.8 + 0.32 * v.y : 0.8 + 0.18 * v.y;
      const l = sky + 0.75 * Math.pow(Math.max(0, v.dot(win)), 4) + 0.22 * Math.pow(Math.max(0, v.dot(fill)), 3);
      rgb.set([l, l, l], i * 3);
    }
    geo.setAttribute('color', new THREE.BufferAttribute(rgb, 3));
    const mat = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, toneMapped: false });
    env.add(new THREE.Mesh(geo, mat));
    const tex = pm.fromScene(env, 0.06).texture;
    geo.dispose();
    mat.dispose();
    pm.dispose();
    return tex;
  }

  class Preview3D {
    constructor(container, opts = {}) {
      this.container = container;
      this.opts = Object.assign({ autoRotate: true, interactive: true, highQuality: true, bloom: true }, opts);
      this.ok = !!window.THREE;

      if (!this.ok) {
        container.innerHTML = '<div class="ph" style="height:100%"><span class="ph-label">3D WebGL unavailable</span></div>';
        return;
      }

      const r = (this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }));
      const hq = this.opts.highQuality;
      r.setPixelRatio(Math.min(window.devicePixelRatio || 1, hq ? 2 : 1));
      r.outputEncoding = THREE.sRGBEncoding;
      // no tone curve: surfaces must stay close to their Pantone screen colour
      r.toneMapping = THREE.NoToneMapping;
      r.shadowMap.enabled = true;
      r.shadowMap.type = THREE.PCFSoftShadowMap;

      container.appendChild(r.domElement);
      r.domElement.classList.add('three-canvas');

      this.scene = new THREE.Scene();
      // "PBR Reflections": environment map drives glass/chrome reflections
      this.scene.environment = hq ? makeEnv(r) : null;

      this.camera = new THREE.PerspectiveCamera(26, 1, 0.1, 100);
      this.target = new THREE.Vector3(0, 2.8, 0);
      this.pan = new THREE.Vector3(); // middle-button move, eased towards targetPan
      this.targetPan = new THREE.Vector3();
      this.dist = 14;
      this.targetDist = 14;
      this.rotY = -0.35;
      this.rotX = 0.08;
      this.targetRotY = -0.35;
      this.targetRotX = 0.08;

      // K-Beauty Studio Lights & Softbox Highlights
      const hemi = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.03);
      this.scene.add(hemi);

      const key = new THREE.DirectionalLight(0xffffff, 0.06);
      key.position.set(-4, 9, 6);
      key.castShadow = true;
      key.shadow.mapSize.set(1024, 1024);
      key.shadow.camera.left = -5;
      key.shadow.camera.right = 5;
      key.shadow.camera.top = 8;
      key.shadow.camera.bottom = -2;
      key.shadow.radius = 4;
      this.scene.add(key);

      // Vertical softbox strip light (creates the iconic specular streak on tube curves)
      const softbox = new THREE.DirectionalLight(0xffffff, 0.02);
      softbox.position.set(6, 4, 3);
      this.scene.add(softbox);

      // Back rim light to separate the silhouette from the white background
      const rim = new THREE.DirectionalLight(0xffffff, 0.03);
      rim.position.set(0, 6, -7);
      this.scene.add(rim);

      // Gentle floor bounce light
      const bounce = new THREE.DirectionalLight(0xffffff, 0.02);
      bounce.position.set(0, -3, 2);
      this.scene.add(bounce);

      // Realistic Soft Radial Contact Shadow
      const shadowTex = makeContactShadowTexture();
      const shadowMat = new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        depthWrite: false,
        opacity: 0.45,
      });
      const shadowPlane = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 4.4), shadowMat);
      shadowPlane.rotation.x = -Math.PI / 2;
      shadowPlane.position.y = 0.005;
      this.scene.add(shadowPlane);

      this.group = new THREE.Group();
      this.scene.add(this.group);

      this.disposables = [];
      this._bind();
      this._resize();
      this._loop = this._loop.bind(this);
      this._raf = requestAnimationFrame(this._loop);
    }

    _bind() {
      const el = this.renderer.domElement;
      this.ro = new ResizeObserver(() => this._resize());
      this.ro.observe(this.container);

      if (!this.opts.interactive) return;

      let drag = null;
      el.addEventListener('pointerdown', (e) => {
        if (e.button !== 0 && e.button !== 1) return;
        e.preventDefault();
        drag = { x: e.clientX, y: e.clientY, ry: this.targetRotY, rx: this.targetRotX, pan: e.button === 1 ? this.targetPan.clone() : null };
        el.setPointerCapture(e.pointerId);
        this.idleAt = performance.now();
        el.classList.add('grabbing');
      });

      el.addEventListener('pointermove', (e) => {
        if (!drag) return;
        if (drag.pan) {
          // middle button: move the view freely, 1:1 with the pointer
          const unit = (2 * this.dist * Math.tan((this.camera.fov * Math.PI) / 360)) / (el.clientHeight || 1);
          const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
          const up = new THREE.Vector3(0, 1, 0).applyQuaternion(this.camera.quaternion);
          this.targetPan.copy(drag.pan)
            .addScaledVector(right, -(e.clientX - drag.x) * unit)
            .addScaledVector(up, (e.clientY - drag.y) * unit)
            .clampLength(0, 6);
          this.idleAt = performance.now();
          return;
        }
        this.targetRotY = drag.ry + (e.clientX - drag.x) * 0.008;
        this.targetRotX = CL.clamp(drag.rx + (e.clientY - drag.y) * 0.004, 0.03, 0.5);
        this.idleAt = performance.now();
      });

      const end = () => {
        drag = null;
        el.classList.remove('grabbing');
      };

      // no browser autoscroll / paste on the middle button; double-click puts the view back
      el.addEventListener('mousedown', (e) => { if (e.button === 1) e.preventDefault(); });
      el.addEventListener('auxclick', (e) => e.preventDefault());
      el.addEventListener('dblclick', () => this.targetPan.set(0, 0, 0));

      el.addEventListener('pointerup', end);
      el.addEventListener('pointercancel', end);

      el.addEventListener('wheel', (e) => {
        e.preventDefault();
        this.targetDist = CL.clamp(this.targetDist * (1 + Math.sign(e.deltaY) * 0.08), 8, 22);
      }, { passive: false });
    }

    _resize() {
      const w = this.container.clientWidth || 300, h = this.container.clientHeight || 300;
      this.renderer.setSize(w, h, false);
      this.renderer.domElement.style.width = '100%';
      this.renderer.domElement.style.height = '100%';
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
    }

    _loop(ts) {
      this._raf = requestAnimationFrame(this._loop);
      if (this.opts.autoRotate && (!this.idleAt || ts - this.idleAt > 1800)) {
        this.targetRotY += 0.0035;
      }

      // Smooth PS5 inertia damping
      this.rotY += (this.targetRotY - this.rotY) * 0.085;
      this.rotX += (this.targetRotX - this.rotX) * 0.085;
      this.dist += (this.targetDist - this.dist) * 0.1;

      const cx = Math.sin(this.rotY) * Math.cos(this.rotX) * this.dist;
      const cz = Math.cos(this.rotY) * Math.cos(this.rotX) * this.dist;
      const cy = Math.sin(this.rotX) * this.dist;

      this.pan.lerp(this.targetPan, 0.25);
      const at = this.target.clone().add(this.pan);
      this.camera.position.set(at.x + cx, at.y + cy, at.z + cz);
      this.camera.lookAt(at);
      this.renderer.render(this.scene, this.camera);
    }

    _opaque(part) {
      const m = new THREE.MeshPhysicalMaterial(Object.assign({ color: 0xffffff, vertexColors: true, envMapIntensity: 0.86 }, FINISH[part && part.finish] || FINISH.gloss));
      trueColor(m, 'solid', '0.24');
      this.disposables.push(m);
      return m;
    }

    /** Clear plastic: alpha from the vertex colours, solid reflections and darker rims. */
    _glass(part, inner, y0, y1) {
      const pure = isClearMaterial(part);
      const m = new THREE.MeshPhysicalMaterial({
        color: 0xffffff, transparent: true, depthWrite: false,
        roughness: 0.22, metalness: 0, envMapIntensity: pure ? 1.0 : 0.86,
      });
      const base = pure ? (inner ? '0.10' : '0.13') : (inner ? 'diffuseColor.a * 0.35' : 'diffuseColor.a');
      m.onBeforeCompile = (sh) => {
        patchClearGradient(sh, part, y0, y1);
        sh.fragmentShader = sh.fragmentShader.replace('#include <output_fragment>', `
          float clFacing = abs(dot(normalize(normal), normalize(vViewPosition)));
          float clRim = pow(1.0 - clFacing, 1.6);
          float clGloss = max(max(totalSpecular.r, totalSpecular.g), totalSpecular.b);
          ${pure ? '' : `outgoingLight = mix(outgoingLight, diffuseColor.rgb, ${TRUE_COLOR});`}
          ${pure ? 'outgoingLight *= vec3(0.74, 0.80, 0.87);' : ''}
          outgoingLight = mix(outgoingLight, diffuseColor.rgb * vec3(0.20, 0.235, 0.28), clRim * 0.85);
          diffuseColor.a = clamp(max(${base}, clRim * ${inner ? '0.50' : '0.72'}) + clGloss * ${inner ? '0.10' : '0.16'}, 0.0, 1.0);
          // flat inner faces (cavity floor, cap ceiling) are seen almost edge-on: without this they
          // turn into solid patches mirroring the studio lights
          float clUp = abs(dot(normalize(normal), normalize((viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz)));
          ${inner ? 'diffuseColor.a *= 1.0 - smoothstep(0.35, 0.8, clUp);' : ''}
          #include <output_fragment>`);
      };
      m.customProgramCacheKey = () => `clGlass-${pure}-${inner}`;
      this.disposables.push(m);
      return m;
    }

    /** Far side of the outside skin, seen through the clear plastic: back edges, bottom and top faces. */
    _glassBack(part, y0, y1) {
      const m = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, depthWrite: false, side: THREE.BackSide, roughness: 1 });
      m.onBeforeCompile = (sh) => {
        patchClearGradient(sh, part, y0, y1);
        sh.fragmentShader = sh.fragmentShader.replace('#include <output_fragment>', `
          float clRim = pow(1.0 - abs(dot(normalize(normal), normalize(vViewPosition))), 2.0);
          float clUp = abs(dot(normalize(normal), normalize((viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz)));
          float clFlat = smoothstep(0.35, 0.8, clUp);
          outgoingLight = diffuseColor.rgb * vec3(0.42, 0.48, 0.56);
          diffuseColor.a = mix(clRim * 0.06, 0.13, clFlat);
          #include <output_fragment>`);
      };
      m.customProgramCacheKey = () => 'clGlassBack';
      this.disposables.push(m);
      return m;
    }

    /** Clean cavity floor that follows the cavity profile (the mesh's own floor is faded out in _glass). */
    _addFloor(tube, m, part) {
      const [z0, r0] = m.cavity[0];
      const rMax = Math.max(...m.cavity.map((p) => p[1]));
      const wall = m.cavity.find((p) => p[1] > rMax * 0.985); // where the floor has become the wall
      const bowl = m.cavity.filter((p) => p[0] <= wall[0]);
      const rounded = r0 < rMax * 0.9;
      const tint = isClearMaterial(part) ? linear('#8fa0b3') : linear(colorsOf(part.fill)[0]).lerp(linear('#8fa0b3'), 0.35);
      const mat = (opts) => {
        const x = new THREE.MeshBasicMaterial(Object.assign({ color: tint, transparent: true, depthWrite: false }, opts));
        this.disposables.push(x);
        return x;
      };
      const add = (geo, material) => {
        const mesh = new THREE.Mesh(geo, material);
        mesh.renderOrder = 0.5;
        tube.add(mesh);
        return mesh;
      };

      const pts = rounded ? [[z0 - 0.35, 0], [z0 - 0.2, r0 * 0.6], ...bowl] : [[z0, 0], [z0, r0]];
      const curve = rounded
        ? new THREE.SplineCurve(pts.map(([z, r]) => new THREE.Vector2(r, z))).getPoints(40)
        : pts.map(([z, r]) => new THREE.Vector2(r, z));
      const geo = new THREE.LatheGeometry(curve, 96);
      const pos = geo.attributes.position;
      const rgba = new Float32Array(pos.count * 4).fill(1);
      for (let i = 0; i < pos.count; i++) {
        const u = Math.hypot(pos.getX(i), pos.getZ(i)) / rMax;
        const up = rounded ? CL.clamp((pos.getY(i) - z0) / (wall[0] - z0), 0, 1) : 0;
        rgba[i * 4 + 3] = (0.4 + 0.6 * u * u) * (1 - up); // light centre, fading into the wall
      }
      geo.setAttribute('color', new THREE.BufferAttribute(rgba, 4));
      add(geo, mat({ vertexColors: true, opacity: rounded ? 0.3 : 0.2, side: THREE.DoubleSide }));
      if (!rounded) {
        const ring = add(new THREE.TorusGeometry(r0, 0.1, 8, 128), mat({ opacity: 0.42 }));
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = z0;
      }
    }

    _plain(color, roughness) {
      const m = new THREE.MeshPhysicalMaterial({ color: linear(color), roughness, envMapIntensity: 0.86 });
      this.disposables.push(m);
      return m;
    }

    _clear() {
      while (this.group.children.length) {
        const o = this.group.children.pop();
        o.traverse && o.traverse((c) => c.geometry && c.geometry.dispose());
      }
      this.disposables.forEach((d) => {
        if (d.map) d.map.dispose();
        d.dispose && d.dispose();
      });
      this.disposables = [];
    }

    async setDesign(design) {
      if (!this.ok) return false;
      const token = (this._token = Symbol());
      const L = CL.models.layout(design.model);
      const fonts = await CL.exporter.fontCSS(design).catch(() => '');

      let raw;
      try {
        raw = await loadModel(L.model.id);
      } catch (e) {
        console.error('[3D]', e);
        return false;
      }

      const tex = {};
      for (const p of ['cap', 'base']) {
        if (!(design.layers || []).some((l) => l.part === p && l.visible !== false)) continue;
        const flat = await CL.exporter.renderFlatCanvas(design, p, { scale: 5, fonts, layersOnly: true });
        // same safe-zone clipping as the 2D view
        const c = flat.canvas, r = L[p], k = c.width / r.w, ctx = c.getContext('2d');
        ctx.globalCompositeOperation = 'destination-in';
        ctx.fillRect((r.safe.x - r.x) * k, (r.safe.y - r.y) * k, r.safe.w * k, r.safe.h * k);
        const tx = new THREE.CanvasTexture(c);
        tx.encoding = THREE.sRGBEncoding;
        tx.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
        tex[p] = tx;
      }

      if (token !== this._token || this._disposed) {
        Object.values(tex).forEach((x) => x.dispose());
        return false;
      }

      this._clear();
      if (this._modelId !== L.model.id) { this._modelId = L.model.id; this.targetPan.set(0, 0, 0); }
      this._buildTube(design, L, raw, tex);
      return true;
    }

    _buildTube(design, L, raw, tex) {
      const m = L.model;
      const P = design.parts;
      const k = TUBE_H / m.h;

      const tube = new THREE.Group();
      tube.scale.setScalar(k);
      tube.position.y = 0.004;
      this.group.add(tube);

      const add = (geo, mat, order, shadow) => {
        const mesh = new THREE.Mesh(geo, mat);
        mesh.renderOrder = order;
        mesh.castShadow = !!shadow;
        tube.add(mesh);
        return mesh;
      };

      add(makeGeometry(raw.wand), this._plain('#e6ebf1', 0.8), 0);
      add(makeGeometry(raw.foot), this._plain('#f4ecdc', 0.9), 0);
      add(makeGeometry(raw.wiper), this._plain('#eceff2', 0.5), 0);

      const parts = [
        ['body', P.base, 'base', 0, m.seam, m.artBody, 1],
        ['cap', P.cap, 'cap', m.seam, m.h, m.artCap, 3],
      ];
      parts.forEach(([key, part, texKey, y0, y1, art, order]) => {
        const src = raw[key];
        const geo = makeGeometry(src);
        if (isClear(part)) {
          geo.addGroup(0, src.outer, 0);
          geo.addGroup(src.outer, src.x.length - src.outer, 1);
          const back = geo.clone();
          back.clearGroups();
          back.addGroup(src.outer, src.x.length - src.outer, 0);
          add(back, [this._glassBack(part, y0, y1)], 0.4);
          if (key === 'body') this._addFloor(tube, m, part);
          add(geo, [this._glass(part, true, y0, y1), this._glass(part, false, y0, y1)], order);
        } else {
          paintGeometry(geo, part, y0, y1);
          add(geo, this._opaque(part), 0, true);
          if (part && part.surface === 'shimmer') this._addGlitter(tube, src, part, m, art);
        }
        if (tex[texKey]) this._addArtwork(tube, raw['art_' + key], tex[texKey], m, art);
      });

      this.target.set(0, TUBE_H * 0.5, 0);
      if (!this._framed) {
        this.dist = this.targetDist = 14;
        this._framed = true;
      }
    }

    /** Front-projected artwork on the printable wall (exactly what the 2D view shows). */
    _addArtwork(tube, src, map, m, art) {
      const geo = makeGeometry(src);
      const pos = geo.attributes.position, nor = geo.attributes.normal;
      const uv = new Float32Array(pos.count * 2);
      for (let i = 0; i < pos.count; i++) {
        uv[i * 2] = pos.getX(i) / m.w + 0.5;
        uv[i * 2 + 1] = (pos.getY(i) - art[0]) / (art[1] - art[0]);
        pos.setXYZ(i, pos.getX(i) + nor.getX(i) * 0.03, pos.getY(i), pos.getZ(i) + nor.getZ(i) * 0.03);
      }
      geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
      const front = [];
      for (let i = 0; i < src.x.length; i += 3) {
        const t = [src.x[i], src.x[i + 1], src.x[i + 2]];
        if (t.every((v) => nor.getZ(v) > 0.02)) front.push(...t);
      }
      geo.setIndex(front);
      const mat = new THREE.MeshPhysicalMaterial({ map, transparent: true, depthWrite: false, roughness: 0.95, specularIntensity: 0.1, envMapIntensity: 0.86 });
      trueColor(mat, 'art');
      this.disposables.push(mat);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.renderOrder = 10;
      tube.add(mesh);
    }

    /** Shimmer surface: light flakes scattered on the outside skin. */
    _addGlitter(tube, src, part, m, art) {
      const N = 2600;
      const pos = new Float32Array(N * 3);
      const tri = (src.x.length - src.outer) / 3;
      const area = [];
      let total = 0;
      const P = (i, c) => src.q[src.x[src.outer + i] * 3 + c] / 200;
      const A = new THREE.Vector3(), B = new THREE.Vector3(), C = new THREE.Vector3();
      const load = (i) => { A.set(P(i * 3, 0), P(i * 3, 1), P(i * 3, 2)); B.set(P(i * 3 + 1, 0), P(i * 3 + 1, 1), P(i * 3 + 1, 2)); C.set(P(i * 3 + 2, 0), P(i * 3 + 2, 1), P(i * 3 + 2, 2)); };
      for (let i = 0; i < tri; i++) {
        load(i);
        total += B.clone().sub(A).cross(C.clone().sub(A)).length();
        area.push(total);
      }
      let seed = 7;
      const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      for (let j = 0; j < N; j++) {
        const r = rnd() * total;
        let lo = 0, hi = tri - 1;
        while (lo < hi) { const mid = (lo + hi) >> 1; if (area[mid] < r) lo = mid + 1; else hi = mid; }
        load(lo);
        let u = rnd(), v = rnd();
        if (u + v > 1) { u = 1 - u; v = 1 - v; }
        const x = A.x + (B.x - A.x) * u + (C.x - A.x) * v;
        const z = A.z + (B.z - A.z) * u + (C.z - A.z) * v;
        pos.set([x * 1.006, A.y + (B.y - A.y) * u + (C.y - A.y) * v, z * 1.006], j * 3);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const mat = new THREE.PointsMaterial({ color: linear(CL.color.mix(colorsOf(part.fill)[0], '#ffffff', 0.75)), size: 0.045, transparent: true, opacity: 0.85, depthWrite: false });
      this.disposables.push(mat);
      const pts = new THREE.Points(g, mat);
      pts.renderOrder = 2;
      tube.add(pts);
    }

    dispose() {
      if (!this.ok) return;
      this._disposed = true;
      cancelAnimationFrame(this._raf);
      this.ro && this.ro.disconnect();
      this._clear();
      this.scene.environment && this.scene.environment.dispose();
      this.renderer.dispose();
      this.renderer.forceContextLoss();
      this.renderer.domElement.remove();
    }
  }

  CL.Preview3D = Preview3D;
})(window.CL);
