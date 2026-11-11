/* ==========================================================
   COSLAB — 3D Liptint Preview (Three.js WebGL Engine)
   Renders EXACTLY 1 ASSEMBLED LIPTINT TUBE (Chỉ 1 cây son liptint duy nhất).
   Up Liptint (Cap) seamlessly mounted atop Button Liptint (Base).
   K-Beauty Atelier PBR Lighting & Materials.
   ========================================================== */
(function (CL) {
  const U = 90; // SVG units per 3D unit

  const FINISH = {
    matte: { roughness: 0.82, metalness: 0.05, clearcoat: 0.04, clearcoatRoughness: 0.7 },
    satin: { roughness: 0.44, metalness: 0.08, clearcoat: 0.35, clearcoatRoughness: 0.3 },
    gloss: { roughness: 0.16, metalness: 0.05, clearcoat: 1.0, clearcoatRoughness: 0.03 },
    metallic: { roughness: 0.22, metalness: 0.95, clearcoat: 0.4, clearcoatRoughness: 0.15 },
  };

  const firstColor = (fill) => (fill && fill.type === 'linear' ? fill.stops[0].c : (fill && fill.color) || '#dedad2');

  function makeEnv(renderer) {
    const pm = new THREE.PMREMGenerator(renderer);
    const env = new THREE.Scene();
    env.background = new THREE.Color(0xf6f4ef);

    const box = new THREE.Mesh(
      new THREE.BoxGeometry(30, 30, 30),
      new THREE.MeshBasicMaterial({ color: 0xded8cc, side: THREE.BackSide })
    );
    env.add(box);

    const panel = (w, h, x, y, z, ry, intensity) => {
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(w, h),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(intensity, intensity, intensity), side: THREE.DoubleSide })
      );
      m.position.set(x, y, z);
      m.rotation.y = ry;
      m.lookAt(0, 0, 0);
      env.add(m);
    };

    panel(10, 18, -12, 5, 6, 0, 5.5);
    panel(8, 16, 12, 3, 4, 0, 3.8);
    panel(20, 6, 0, 14, 0, 0, 3.0);
    panel(8, 14, 0, 3, -12, 0, 2.2);

    const tex = pm.fromScene(env, 0.04).texture;
    pm.dispose();
    return tex;
  }

  function warpTexture(flat, fillOnly, cyl) {
    const W = 2048;
    const H = CL.clamp(Math.round(W * cyl.h / (Math.PI * cyl.w)), 256, 2048);
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
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

      if (!this.ok) {
        container.innerHTML = '<div class="ph" style="height:100%"><span class="ph-label">3D WebGL unavailable</span></div>';
        return;
      }

      const r = (this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }));
      r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      r.outputEncoding = THREE.sRGBEncoding;
      r.toneMapping = THREE.ACESFilmicToneMapping;
      r.toneMappingExposure = 1.08;
      r.shadowMap.enabled = true;
      r.shadowMap.type = THREE.PCFSoftShadowMap;

      container.appendChild(r.domElement);
      r.domElement.classList.add('three-canvas');

      this.scene = new THREE.Scene();
      this.scene.environment = makeEnv(r);

      this.camera = new THREE.PerspectiveCamera(26, 1, 0.1, 100);
      this.target = new THREE.Vector3(0, 2.8, 0);
      this.dist = 14;
      this.rotY = -0.35;
      this.rotX = 0.08;

      // K-Beauty Studio Lights
      const hemi = new THREE.HemisphereLight(0xfffaf0, 0xded8cc, 0.6);
      this.scene.add(hemi);

      const key = new THREE.DirectionalLight(0xffffff, 1.2);
      key.position.set(-4, 9, 6);
      key.castShadow = true;
      key.shadow.mapSize.set(1024, 1024);
      key.shadow.camera.left = -5;
      key.shadow.camera.right = 5;
      key.shadow.camera.top = 7;
      key.shadow.camera.bottom = -2;
      key.shadow.radius = 5;
      this.scene.add(key);

      const rim = new THREE.DirectionalLight(0xffffff, 0.65);
      rim.position.set(5, 5, -5);
      this.scene.add(rim);

      // Studio Pedestal / Ground
      const ground = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.ShadowMaterial({ opacity: 0.14 }));
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = 0;
      ground.receiveShadow = true;
      this.scene.add(ground);

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
        drag = { x: e.clientX, y: e.clientY, ry: this.rotY, rx: this.rotX };
        el.setPointerCapture(e.pointerId);
        this.idleAt = performance.now();
        el.classList.add('grabbing');
      });

      el.addEventListener('pointermove', (e) => {
        if (!drag) return;
        this.rotY = drag.ry + (e.clientX - drag.x) * 0.01;
        this.rotX = CL.clamp(drag.rx + (e.clientY - drag.y) * 0.005, -0.35, 0.5);
        this.idleAt = performance.now();
      });

      const end = () => {
        drag = null;
        el.classList.remove('grabbing');
      };

      el.addEventListener('pointerup', end);
      el.addEventListener('pointercancel', end);

      el.addEventListener('wheel', (e) => {
        e.preventDefault();
        this.dist = CL.clamp(this.dist * (1 + Math.sign(e.deltaY) * 0.07), 7, 24);
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
      if (this.opts.autoRotate && (!this.idleAt || ts - this.idleAt > 2000)) {
        this.rotY += 0.0035;
      }

      const cx = Math.sin(this.rotY) * Math.cos(this.rotX) * this.dist;
      const cz = Math.cos(this.rotY) * Math.cos(this.rotX) * this.dist;
      const cy = Math.sin(this.rotX) * this.dist;

      this.camera.position.set(this.target.x + cx, this.target.y + cy, this.target.z + cz);
      this.camera.lookAt(this.target);
      this.renderer.render(this.scene, this.camera);
    }

    _mat(part, map) {
      const f = FINISH[part?.finish] || FINISH.gloss;
      const m = new THREE.MeshPhysicalMaterial(Object.assign({
        color: map ? 0xffffff : new THREE.Color(firstColor(part?.fill)).convertSRGBToLinear(),
        envMapIntensity: 1.15,
      }, f));

      if (map) m.map = map;
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
      if (!this.ok) return;
      const token = (this._token = Symbol());
      const L = CL.models.layout(design.model);
      const isSquare = L.model.silhouette === 'square';
      const fonts = await CL.exporter.fontCSS(design).catch(() => '');

      const tex = {};
      for (const p of ['cap', 'base']) {
        const flat = await CL.exporter.renderFlatCanvas(design, p, { scale: 4, fonts });
        let canvas = flat.canvas;
        if (!isSquare) {
          const empty = Object.assign({}, design, { layers: [] });
          const fill = await CL.exporter.renderFlatCanvas(empty, p, { scale: 4, fonts: '' });
          canvas = warpTexture(flat.canvas, fill.canvas, L[p]);
        }
        const tx = new THREE.CanvasTexture(canvas);
        tx.encoding = THREE.sRGBEncoding;
        tx.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
        tex[p] = tx;
      }

      if (token !== this._token) {
        Object.values(tex).forEach((t) => t.dispose());
        return;
      }

      this._clear();
      this._buildSingleLiptint(design, L, isSquare, tex);
    }

    /**
     * Builds EXACTLY 1 ASSEMBLED LIPTINT TUBE
     * Base (Button Liptint) at bottom + Ring + Cap (Up Liptint) on top.
     */
    _buildSingleLiptint(design, L, isSquare, tex) {
      const P = design.parts;
      const g = this.group;

      const baseW = L.base.w / U;
      const baseH = L.base.h / U;
      const ringH = L.ring.h / U;
      const capH = L.cap.h / U;
      const totalH = baseH + ringH + capH;

      const add = (geo, mats, y) => {
        const m = new THREE.Mesh(geo, mats);
        m.position.set(0, y, 0);
        m.castShadow = true;
        m.receiveShadow = true;
        g.add(m);
        return m;
      };

      // 1. Bottom Tube: Button Liptint (Base)
      const baseSide = this._mat(P.base, tex.base);
      const basePlain = this._mat(P.base, null);

      if (isSquare) {
        const baseGeo = new THREE.BoxGeometry(baseW, baseH, baseW);
        add(baseGeo, [basePlain, basePlain, basePlain, basePlain, baseSide, basePlain], baseH / 2);
      } else {
        const baseGeo = new THREE.CylinderGeometry(baseW / 2, baseW / 2, baseH, 128, 1, false, Math.PI, Math.PI * 2);
        add(baseGeo, [baseSide, basePlain, basePlain], baseH / 2);
      }

      // 2. Middle Divider Ring / Collar
      const ringGeo = isSquare
        ? new THREE.BoxGeometry(baseW * 0.98, ringH, baseW * 0.98)
        : new THREE.CylinderGeometry(baseW * 0.49, baseW * 0.49, ringH, 96);

      const ringMat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(firstColor(P.ring?.fill || { color: '#c5a367' })).convertSRGBToLinear(),
        roughness: 0.22,
        metalness: 0.9,
      });
      this.disposables.push(ringMat);
      add(ringGeo, ringMat, baseH + ringH / 2);

      // 3. Top Tube: Up Liptint (Cap)
      const capSide = this._mat(P.cap, tex.cap);
      const capPlain = this._mat(P.cap, null);
      const capY = baseH + ringH + capH / 2;

      if (isSquare) {
        const capGeo = new THREE.BoxGeometry(baseW, capH, baseW);
        add(capGeo, [capPlain, capPlain, capPlain, capPlain, capSide, capPlain], capY);
      } else {
        const capGeo = new THREE.CylinderGeometry(baseW / 2, baseW / 2, capH, 128, 1, false, Math.PI, Math.PI * 2);
        add(capGeo, [capSide, capPlain, capPlain], capY);
      }

      // Center camera target at the midpoint of the single tube
      this.target.set(0, totalH / 2, 0);
      if (!this._framed) {
        this.dist = Math.max(12, totalH * 2.3);
        this._framed = true;
      }
    }

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
