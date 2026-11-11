/* ==========================================================
   3D preview (three.js r149, UMD build — works on file://)
   The 2D front view is warped onto the cylinder so the front of
   the 3D model matches the 2D editor exactly.
   ========================================================== */
(function (CL) {
  const U = 100; // svg units per 3D unit

  const FINISH = {
    matte: { roughness: 0.82, metalness: 0, clearcoat: 0, clearcoatRoughness: 0.6 },
    satin: { roughness: 0.48, metalness: 0, clearcoat: 0.25, clearcoatRoughness: 0.4 },
    gloss: { roughness: 0.22, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.04 },
    metallic: { roughness: 0.26, metalness: 1, clearcoat: 0.3, clearcoatRoughness: 0.2 },
  };
  const firstColor = (fill) => (fill && fill.type === 'linear' ? fill.stops[0].c : (fill && fill.color) || '#cccccc');

  function makeEnv(renderer) {
    const pm = new THREE.PMREMGenerator(renderer);
    const env = new THREE.Scene();
    env.background = new THREE.Color(0xdedede);
    const box = new THREE.Mesh(new THREE.BoxGeometry(30, 30, 30), new THREE.MeshBasicMaterial({ color: 0xbdbdbd, side: THREE.BackSide }));
    env.add(box);
    const panel = (w, h, x, y, z, ry, intensity) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(intensity, intensity, intensity), side: THREE.DoubleSide }));
      m.position.set(x, y, z); m.rotation.y = ry; m.lookAt(0, 0, 0); env.add(m);
    };
    panel(10, 18, -12, 4, 6, 0, 6);
    panel(8, 16, 12, 2, 4, 0, 3.5);
    panel(20, 4, 0, 13, 0, 0, 2.5);
    panel(6, 14, 0, 3, -13, 0, 2);
    const tex = pm.fromScene(env, 0.04).texture;
    pm.dispose();
    return tex;
  }

  /** Warp the flat front artwork onto a full-circumference texture. */
  function warpTexture(flat, fillOnly, cyl) {
    const W = 2048;
    const H = CL.clamp(Math.round(W * cyl.h / (Math.PI * cyl.w)), 256, 2048);
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const ctx = c.getContext('2d');
    const fw = flat.width, fh = flat.height;
    for (let i = 0; i < W; i++) {
      const u = (i + 0.5) / W;
      const phi = (u - 0.5) * Math.PI * 2;
      const front = Math.abs(phi) <= Math.PI / 2;
      const x2d = 0.5 + Math.sin(phi) / 2;
      const src = front ? flat : fillOnly;
      const sx = CL.clamp(Math.floor(x2d * fw), 0, fw - 1);
      ctx.drawImage(src, sx, 0, 1, fh, i, 0, 1, H);
    }
    return c;
  }

  class Preview3D {
    constructor(container, opts = {}) {
      this.container = container;
      this.opts = Object.assign({ autoRotate: true, interactive: true }, opts);
      this.ok = !!window.THREE;
      if (!this.ok) { container.innerHTML = '<div class="ph" style="height:100%"><span class="ph-label">3D unavailable</span></div>'; return; }

      const r = (this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }));
      r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      r.outputEncoding = THREE.sRGBEncoding;
      r.toneMapping = THREE.ACESFilmicToneMapping;
      r.toneMappingExposure = 1.05;
      r.shadowMap.enabled = true;
      r.shadowMap.type = THREE.PCFSoftShadowMap;
      container.appendChild(r.domElement);
      r.domElement.classList.add('three-canvas');

      this.scene = new THREE.Scene();
      this.scene.environment = makeEnv(r);
      this.camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
      this.target = new THREE.Vector3(0, 2.2, 0);
      this.dist = 12;
      this.rotY = -0.45; this.rotX = 0.12;

      const hemi = new THREE.HemisphereLight(0xffffff, 0xcfcfcf, 0.5); this.scene.add(hemi);
      const key = new THREE.DirectionalLight(0xffffff, 1.1); key.position.set(-4, 8, 6); key.castShadow = true;
      key.shadow.mapSize.set(1024, 1024); key.shadow.camera.left = -5; key.shadow.camera.right = 5; key.shadow.camera.top = 6; key.shadow.camera.bottom = -2; key.shadow.radius = 6;
      this.scene.add(key);
      const rim = new THREE.DirectionalLight(0xffffff, 0.5); rim.position.set(5, 4, -5); this.scene.add(rim);

      const ground = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.ShadowMaterial({ opacity: 0.12 }));
      ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; this.scene.add(ground);

      this.group = new THREE.Group(); this.scene.add(this.group);
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
      el.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY, ry: this.rotY, rx: this.rotX }; el.setPointerCapture(e.pointerId); this.idleAt = performance.now(); el.classList.add('grabbing'); });
      el.addEventListener('pointermove', (e) => {
        if (!drag) return;
        this.rotY = drag.ry + (e.clientX - drag.x) * 0.01;
        this.rotX = CL.clamp(drag.rx + (e.clientY - drag.y) * 0.005, -0.4, 0.6);
        this.idleAt = performance.now();
      });
      const end = () => { drag = null; el.classList.remove('grabbing'); };
      el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
      el.addEventListener('wheel', (e) => { e.preventDefault(); this.dist = CL.clamp(this.dist * (1 + Math.sign(e.deltaY) * 0.08), 6, 22); }, { passive: false });
    }

    _resize() {
      const w = this.container.clientWidth || 300, h = this.container.clientHeight || 300;
      this.renderer.setSize(w, h, false);
      this.renderer.domElement.style.width = '100%'; this.renderer.domElement.style.height = '100%';
      this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
    }

    _loop(ts) {
      this._raf = requestAnimationFrame(this._loop);
      if (this.opts.autoRotate && (!this.idleAt || ts - this.idleAt > 2500)) this.rotY += 0.004;
      const cx = Math.sin(this.rotY) * Math.cos(this.rotX) * this.dist;
      const cz = Math.cos(this.rotY) * Math.cos(this.rotX) * this.dist;
      const cy = Math.sin(this.rotX) * this.dist;
      this.camera.position.set(this.target.x + cx, this.target.y + cy, this.target.z + cz);
      this.camera.lookAt(this.target);
      this.renderer.render(this.scene, this.camera);
    }

    setAutoRotate(v) { this.opts.autoRotate = v; }
    resetView() { this.rotY = -0.45; this.rotX = 0.12; this.dist = 12; }

    _mat(part, map) {
      const f = FINISH[part.finish] || FINISH.gloss;
      const m = new THREE.MeshPhysicalMaterial(Object.assign({ color: map ? 0xffffff : new THREE.Color(firstColor(part.fill)).convertSRGBToLinear(), envMapIntensity: 1 }, f));
      if (map) m.map = map;
      this.disposables.push(m);
      return m;
    }

    _clear() {
      while (this.group.children.length) {
        const o = this.group.children.pop();
        o.traverse && o.traverse((c) => c.geometry && c.geometry.dispose());
      }
      this.disposables.forEach((d) => { if (d.map) d.map.dispose(); d.dispose && d.dispose(); });
      this.disposables = [];
    }

    /** Re-build the model for a design (async because textures rasterise SVG). */
    async setDesign(design) {
      if (!this.ok) return;
      const token = (this._token = Symbol());
      const L = CL.models.layout(design.model);
      const square = L.model.section === 'square';
      const fonts = await CL.exporter.fontCSS(design).catch(() => '');
      const tex = {};
      for (const p of ['cap', 'base']) {
        const flat = await CL.exporter.renderFlatCanvas(design, p, { scale: 4, fonts });
        let canvas = flat.canvas;
        if (!square) {
          const empty = Object.assign({}, design, { layers: [] });
          const fill = await CL.exporter.renderFlatCanvas(empty, p, { scale: 4, fonts: '' });
          canvas = warpTexture(flat.canvas, fill.canvas, L[p]);
        }
        const tx = new THREE.CanvasTexture(canvas);
        tx.encoding = THREE.sRGBEncoding;
        tx.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
        tex[p] = tx;
      }
      if (token !== this._token) { Object.values(tex).forEach((t) => t.dispose()); return; }
      this._clear();
      this._build(design, L, square, tex);
    }

    _build(design, L, square, tex) {
      const P = design.parts;
      const g = this.group;
      const midX = (L.scene.cxBase + L.scene.cxCap) / 2;
      const X = (cx) => (cx - midX) / U;
      const add = (geo, mats, x, y, z = 0) => {
        const m = new THREE.Mesh(geo, mats); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; g.add(m); return m;
      };
      const bx = X(L.scene.cxBase), cx = X(L.scene.cxCap);

      // ---- body (base) / cap
      const tube = (rect, part, map, x) => {
        const w = rect.w / U, h = rect.h / U;
        const side = this._mat(part, map), plain = this._mat(part, null);
        if (square) {
          const geo = new THREE.BoxGeometry(w, h, w);
          return add(geo, [plain, plain, plain, plain, side, plain], x, h / 2);
        }
        const geo = new THREE.CylinderGeometry(w / 2, w / 2, h, 128, 1, false, Math.PI, Math.PI * 2);
        return add(geo, [side, plain, plain], x, h / 2);
      };
      tube(L.base, P.base, tex.base, bx);
      tube(L.cap, P.cap, tex.cap, cx);

      // ---- sleeve
      const sw = L.sleeve.w / U, sh = L.sleeve.h / U, baseH = L.base.h / U;
      const sGeo = square ? new THREE.BoxGeometry(sw, sh, sw) : new THREE.CylinderGeometry(sw / 2, sw / 2, sh, 96);
      add(sGeo, this._mat(P.sleeve, null), bx, baseH + sh / 2);

      // ---- bullet
      const bw = L.bullet.w / U, bh = L.bullet.h / U;
      const y0 = baseH + sh;
      let bGeo;
      const shape = L.bullet.shape;
      if (shape === 'round') {
        const pts = [];
        pts.push(new THREE.Vector2(0.0001, 0));
        pts.push(new THREE.Vector2(bw / 2, 0));
        pts.push(new THREE.Vector2(bw / 2, bh * 0.42));
        for (let i = 1; i <= 16; i++) { const a = (i / 16) * Math.PI / 2; pts.push(new THREE.Vector2(Math.cos(a) * bw / 2, bh * 0.42 + Math.sin(a) * bh * 0.58)); }
        bGeo = new THREE.LatheGeometry(pts, 96);
      } else if (shape === 'wand') {
        const pts = [new THREE.Vector2(0.0001, 0), new THREE.Vector2(bw * 0.12, 0), new THREE.Vector2(bw * 0.12, bh * 0.5)];
        for (let i = 0; i <= 20; i++) { const a = -Math.PI / 2 + (i / 20) * Math.PI; pts.push(new THREE.Vector2(Math.max(0.0001, Math.cos(a) * bw * 0.5), bh * 0.75 + Math.sin(a) * bh * 0.25)); }
        bGeo = new THREE.LatheGeometry(pts, 64);
      } else {
        bGeo = square ? new THREE.BoxGeometry(bw, bh, bw, 8, 8, 8) : new THREE.CylinderGeometry(bw / 2, bw / 2, bh, 96, 8);
        bGeo.translate(0, bh / 2, 0);
        const lo = shape === 'chisel' ? 0.66 : 0.64;
        const pos = bGeo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          const x = pos.getX(i), y = pos.getY(i);
          const frac = lo + ((x + bw / 2) / bw) * (1 - lo);
          pos.setY(i, y * frac);
        }
        pos.needsUpdate = true; bGeo.computeVertexNormals();
      }
      add(bGeo, this._mat(P.bullet, null), bx, y0);

      // frame the camera on the model
      const tallest = Math.max(y0 + bh, L.cap.h / U);
      this.target.set(0, tallest / 2, 0);
      this.baseDist = Math.max(9, tallest * 2.6);
      if (!this._framed) { this.dist = this.baseDist; this._framed = true; }
    }

    snapshot() { return this.ok ? this.renderer.domElement.toDataURL('image/png') : null; }

    dispose() {
      if (!this.ok) return;
      cancelAnimationFrame(this._raf);
      this.ro && this.ro.disconnect();
      this._clear();
      this.scene.environment && this.scene.environment.dispose();
      this.renderer.dispose();
      this.renderer.domElement.remove();
    }
  }

  CL.Preview3D = Preview3D;
})(window.CL);
