/* ==========================================================
   COSLAB — Figma UI3 Inspired Lipstick Design Studio
   4 Turns: 01 Model -> 02 Color -> 03 Text -> 04 Logo
   - Figma-style legible Inspector with scrubbable property inputs
   - Smooth Mouse Wheel Zoom (toward cursor, 35%–350%) & Canvas Pan
   - Interactive Figma Blue Selection Gizmo (Move, Rotate, Corner Resize)
   - Smart Center Alignment Guides & Strict Safe Zone Clamping
   ========================================================== */
(function (CL) {
  CL.pages = CL.pages || {};

  const STEPS = [
    { id: 'colors', num: '01', vi: 'Màu', en: 'Color' },
    { id: 'text', num: '02', vi: 'Chữ', en: 'Text' },
    { id: 'graphics', num: '03', vi: 'Logo', en: 'Logo' },
  ];

  // Curated minimalist K-Beauty & Packaging color grid (17 swatches + 1 custom)
  const PALETTE = [
    { c: '#b85c66', n: 'Velvet Rosé' },
    { c: '#a84d59', n: 'Muted Mauve' },
    { c: '#c94d5b', n: 'Crimson Dew' },
    { c: '#e26b77', n: 'Cherry Berry' },
    { c: '#df705e', n: 'Chili Sunset' },
    { c: '#a63428', n: 'Warm Brick' },
    { c: '#df8b7d', n: 'Peach Mousse' },
    { c: '#e89098', n: 'Baby Pink' },
    { c: '#8a4c58', n: 'Vintage Fig' },
    { c: '#783c47', n: 'Blackberry' },
    { c: '#c98d79', n: 'Almond Beige' },
    { c: '#fbfaf7', n: 'Pure Porcelain' },
    { c: '#eae5da', n: 'Ivory Glaze' },
    { c: '#d9d9d9', n: 'Cold Chrome' },
    { c: '#c5a367', n: '24K Gold' },
    { c: '#3b3834', n: 'Dark Umber' },
    { c: '#171615', n: 'Seoul Noir' },
  ];

  function stepLabel(s) {
    return I18N.lang === 'vi' ? s.vi : s.en;
  }

  /* Reusable Figma-style Scrubbable Numeric Property Box */
  function createFigmaScrubField({
    id,
    prefix,
    title,
    value,
    min,
    max,
    step = 1,
    unit = '',
    scrubScale = 0.5,
    showSteppers = false,
    onInput,
    onCommit,
  }) {
    const field = CL.h('div.fg-field', { title: title || '' });

    const inputEl = CL.h('input.fg-num-input', {
      id: id || '',
      type: 'number',
      min: String(min),
      max: String(max),
      step: String(step),
      value: String(value),
    });

    const clampVal = (v) => {
      const n = Number(v);
      if (Number.isNaN(n)) return value;
      return CL.clamp(Math.round(n / step) * step, min, max);
    };

    inputEl.addEventListener('input', () => {
      if (inputEl.value === '' || inputEl.value === '-') return;
      const v = clampVal(inputEl.value);
      if (onInput) onInput(v);
    });

    inputEl.addEventListener('change', () => {
      const v = clampVal(inputEl.value);
      inputEl.value = String(v);
      if (onInput) onInput(v);
      if (onCommit) onCommit(v);
    });

    const prefixEl = CL.h('span.fg-prefix.is-scrub', {
      text: prefix,
      title: title ? `${title} (Kéo ngang để chỉnh)` : 'Drag horizontally to scrub',
    });

    prefixEl.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      const startX = e.clientX;
      const startVal = parseFloat(inputEl.value) || 0;
      let latestVal = startVal;
      field.classList.add('is-scrubbing');
      document.body.style.cursor = 'ew-resize';

      const onMove = (ev) => {
        const delta = (ev.clientX - startX) * (ev.shiftKey ? scrubScale * 2 : scrubScale);
        latestVal = clampVal(startVal + delta);
        inputEl.value = String(latestVal);
        if (onInput) onInput(latestVal);
      };

      const onUp = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        field.classList.remove('is-scrubbing');
        document.body.style.cursor = '';
        if (latestVal !== startVal && onCommit) onCommit(latestVal);
      };

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    });

    field.append(prefixEl, inputEl);
    if (unit) field.append(CL.h('span.fg-unit', { text: unit }));

    if (showSteppers) {
      const stepWrap = CL.h('div.fg-stepper-btns', null,
        CL.h('button.fg-step-mini', {
          type: 'button',
          text: '−',
          onclick: () => {
            const next = clampVal((parseFloat(inputEl.value) || 0) - step);
            inputEl.value = String(next);
            if (onInput) onInput(next);
            if (onCommit) onCommit(next);
          },
        }),
        CL.h('button.fg-step-mini', {
          type: 'button',
          text: '+',
          onclick: () => {
            const next = clampVal((parseFloat(inputEl.value) || 0) + step);
            inputEl.value = String(next);
            if (onInput) onInput(next);
            if (onCommit) onCommit(next);
          },
        })
      );
      field.append(stepWrap);
    }

    return { el: field, input: inputEl };
  }

  function createStudioPage(defaultStep) {
    return {
      titleKey: 'nav.design',
      appMode: true,

      render(container, ctx = {}) {
        let design = CL.store.getDraft();
        if (!design || !design.model || !design.parts?.cap) {
          design = CL.templates.createDesign('velvet-rose', 'velvet-round');
          CL.store.saveDraft(design);
        }

        const history = [CL.clone(design)];
        let historyIdx = 0;

        function pushHistory() {
          if (historyIdx < history.length - 1) history.splice(historyIdx + 1);
          history.push(CL.clone(design));
          if (history.length > 30) history.shift();
          else historyIdx++;
          CL.store.saveDraft(design);
          updateUndoRedoUI();
        }

        function undo() {
          if (historyIdx > 0) {
            historyIdx--;
            design = CL.clone(history[historyIdx]);
            CL.store.saveDraft(design);
            refreshAll();
            updateUndoRedoUI();
          }
        }

        function redo() {
          if (historyIdx < history.length - 1) {
            historyIdx++;
            design = CL.clone(history[historyIdx]);
            CL.store.saveDraft(design);
            refreshAll();
            updateUndoRedoUI();
          }
        }

        const queryStep = ctx.query && ctx.query.step;
        let activeStepIdx = queryStep ? Math.max(0, Math.min(STEPS.length - 1, parseInt(queryStep, 10) - 1)) : (defaultStep || 0);
        let activeView = '2d';
        let activePart = 'base'; // strictly 'base' | 'cap'
        let selectedLayerId = null;
        let zoomLevel = 1.0;
        let panX = 0;
        let panY = 0;
        let isSpaceDown = false;
        let preview3DInstance = null;

        const root = CL.h('div.editor-layout');

        // --- 1. Clean Topbar ---
        const titleInput = CL.h('input.editor-title-input', {
          value: design.name || t('editor.untitled'),
          placeholder: t('editor.untitled'),
          onchange: () => {
            design.name = titleInput.value.trim() || t('editor.untitled');
            pushHistory();
          },
        });

        const undoBtn = CL.h('button.icon-btn.sm#btnUndo', {
          html: CL.icon('undo'),
          title: 'Undo (Ctrl+Z)',
          onclick: undo,
        });
        const redoBtn = CL.h('button.icon-btn.sm#btnRedo', {
          html: CL.icon('redo'),
          title: 'Redo (Ctrl+Y)',
          onclick: redo,
        });

        const stepperBar = CL.h('nav.studio-stepper', { 'aria-label': 'Steps' },
          STEPS.map((s, idx) =>
            CL.h('button.studio-step-pill' + (idx === activeStepIdx ? '.is-active' : ''), {
              type: 'button',
              'data-step-idx': idx,
              html: `<span class="step-num">${s.num}</span><span class="step-name">${stepLabel(s)}</span>`,
              onclick: () => goToStep(idx),
            })
          )
        );

        const viewToggle = CL.h('div.segmented', null,
          CL.h('button#btnView2D.is-active', {
            html: '<span>2D</span>',
            onclick: () => switchView('2d'),
          }),
          CL.h('button#btnView3D', {
            html: '<span>3D</span>',
            onclick: () => switchView('3d'),
          })
        );

        const saveBtn = CL.h('button.btn.btn-sm.btn-outline', {
          html: CL.icon('save') + `<span>${t('editor.save')}</span>`,
          onclick: () => {
            const res = CL.store.saveDesign(design);
            if (res) CL.toast(t('editor.saved'));
            else CL.toast(t('editor.quotaWarning'), 'info');
          },
        });

        const exportBtn = CL.h('button.btn.btn-sm.btn-primary', {
          html: CL.icon('download') + `<span>${t('editor.export')}</span>`,
          onclick: (e) => {
            CL.menu(e.currentTarget, CL.exportMenuItems(() => design), { align: 'end' });
          },
        });

        const topbar = CL.h('header.editor-topbar', null,
          CL.h('div.editor-topbar-left', null,
            CL.h('a.studio-back-link', {
              href: '#/design',
              html: CL.icon('arrowLeft') + `<span>${t('nav.design')}</span>`,
            }),
            CL.h('div.editor-title-wrap', null, titleInput),
            CL.h('span.topbar-sep'),
            undoBtn,
            redoBtn
          ),
          CL.h('div.editor-topbar-center', null, stepperBar),
          CL.h('div.editor-topbar-right', null, viewToggle, saveBtn, exportBtn)
        );

        // --- 2. Split Workspace: Interactive Stage (Left) + Figma Inspector (Right) ---
        const workspace = CL.h('div.studio-workspace');

        // Floating Cap / Base switcher (Hidden on Step 1 Model; appears on Steps 2, 3, 4)
        const partQuickBar = CL.h('div.canvas-part-Quickbar#canvasPartQuickbar', { style: { display: 'none' } },
          ['base', 'cap'].map((pId) =>
            CL.h('button.canvas-part-chip', {
              type: 'button',
              'data-part-chip': pId,
              onclick: () => {
                activePart = pId;
                selectedLayerId = null;
                syncPartChips();
                render2DCanvas();
                renderStepPanel();
              },
            },
              CL.h('span.part-tab-dot', { 'data-part-dot': pId }),
              CL.h('span', { text: pId === 'base' ? (I18N.lang === 'vi' ? 'Thân son' : 'Body') : (I18N.lang === 'vi' ? 'Nắp son' : 'Cap') })
            )
          )
        );

        const canvasViewport = CL.h('div.canvas-viewport#canvasViewport', null,
          CL.h('div#canvasSvgHolder')
        );

        const canvasContainer = CL.h('div.editor-canvas-container', null,
          partQuickBar,
          canvasViewport,
          CL.h('div.preview-3d-host#preview3dHost', { style: { display: 'none' } },
            CL.h('div.preview-3d-hud', { html: CL.icon('cube') + '<span> Drag 360°</span>' })
          ),
          CL.h('div.canvas-floating-controls#canvasFloatingControls', {
            title: I18N.lang === 'vi' ? 'Lăn chuột để Zoom · Kéo nền để Di chuyển' : 'Scroll to Zoom · Drag canvas to Pan',
          },
            CL.h('button.icon-btn.sm', {
              title: 'Zoom Out (-)',
              html: CL.icon('zoomOut'),
              onclick: () => setZoom(zoomLevel / 1.2, { smooth: true }),
            }),
            CL.h('span.zoom-level-text#zoomLevelText', { text: '100%' }),
            CL.h('button.icon-btn.sm', {
              title: 'Zoom In (+)',
              html: CL.icon('zoomIn'),
              onclick: () => setZoom(zoomLevel * 1.2, { smooth: true }),
            }),
            CL.h('button.icon-btn.sm', {
              title: 'Reset View (100%)',
              html: CL.icon('fit'),
              onclick: () => resetView(),
            })
          )
        );

        const stepHeader = CL.h('div.studio-step-header');
        const stepBody = CL.h('div.studio-step-body#studioStepBody');
        const stepFooter = CL.h('div.studio-step-footer');

        const studioPanel = CL.h('aside.studio-panel', null,
          stepHeader,
          stepBody,
          stepFooter
        );

        workspace.append(canvasContainer, studioPanel);
        root.append(topbar, workspace);
        container.appendChild(root);

        // ======================================================
        // FIGMA-STYLE CANVAS ZOOM (MOUSE WHEEL) & PAN ENGINE
        // ======================================================
        function applyCanvasTransform(smooth = false) {
          const vp = document.getElementById('canvasViewport');
          const txt = document.getElementById('zoomLevelText');
          if (txt) txt.textContent = Math.round(zoomLevel * 100) + '%';
          if (vp) {
            vp.classList.toggle('is-smooth-zoom', !!smooth);
            vp.style.transform = `translate(${CL.round(panX, 1)}px, ${CL.round(panY, 1)}px) scale(${CL.round(zoomLevel, 4)})`;
          }
        }

        function setZoom(nextVal, opts = {}) {
          const prevZoom = zoomLevel;
          zoomLevel = CL.clamp(nextVal, 0.35, 3.5);

          if (opts.clientX !== undefined && opts.clientY !== undefined) {
            // Zoom smoothly toward mouse pointer position (Figma style!)
            const rect = canvasContainer.getBoundingClientRect();
            const mx = opts.clientX - (rect.left + rect.width / 2);
            const my = opts.clientY - (rect.top + rect.height / 2);
            const ratio = zoomLevel / prevZoom;
            panX = mx - (mx - panX) * ratio;
            panY = my - (my - panY) * ratio;
          }

          // Gently pull pan back toward center when zooming out below 100%
          if (zoomLevel <= 1.0 && !opts.keepPan) {
            const damp = Math.max(0, (zoomLevel - 0.5) / 0.5);
            panX *= damp;
            panY *= damp;
          } else {
            const maxPan = 440 * zoomLevel;
            panX = CL.clamp(panX, -maxPan, maxPan);
            panY = CL.clamp(panY, -maxPan, maxPan);
          }

          applyCanvasTransform(opts.smooth);
        }

        function resetView() {
          zoomLevel = 1.0;
          panX = 0;
          panY = 0;
          applyCanvasTransform(true);
        }

        // Mouse Wheel & Trackpad Pinch Zoom on 2D Canvas
        canvasContainer.addEventListener('wheel', (e) => {
          if (activeView !== '2d') return;
          e.preventDefault();
          const sensitivity = e.ctrlKey ? 0.012 : 0.0024;
          const clampedDelta = CL.clamp(e.deltaY, -140, 140);
          const factor = Math.exp(-clampedDelta * sensitivity);
          setZoom(zoomLevel * factor, {
            clientX: e.clientX,
            clientY: e.clientY,
            smooth: false,
          });
        }, { passive: false });

        // Drag Background / Middle Click / Space+Drag to Pan Canvas
        canvasContainer.addEventListener('pointerdown', (e) => {
          if (activeView !== '2d') return;
          const isMiddle = e.button === 1;
          const onHud = e.target.closest('.canvas-part-Quickbar, .canvas-floating-controls');
          const onInteractive = e.target.closest('[data-layer], .cl-transform-gizmo, [data-part]');
          if (onHud) return;
          if (!isMiddle && !isSpaceDown && onInteractive) return;

          e.preventDefault();
          const startX = e.clientX;
          const startY = e.clientY;
          const origPanX = panX;
          const origPanY = panY;
          canvasContainer.classList.add('is-panning');

          const onPanMove = (ev) => {
            const maxPan = 440 * Math.max(1, zoomLevel);
            panX = CL.clamp(origPanX + (ev.clientX - startX), -maxPan, maxPan);
            panY = CL.clamp(origPanY + (ev.clientY - startY), -maxPan, maxPan);
            applyCanvasTransform(false);
          };

          const onPanUp = () => {
            window.removeEventListener('pointermove', onPanMove);
            window.removeEventListener('pointerup', onPanUp);
            canvasContainer.classList.remove('is-panning');
          };

          window.addEventListener('pointermove', onPanMove);
          window.addEventListener('pointerup', onPanUp);
        });

        // Double-click empty canvas stage resets zoom to 100%
        canvasContainer.addEventListener('dblclick', (e) => {
          if (activeView !== '2d') return;
          if (e.target.closest('.canvas-part-Quickbar, .canvas-floating-controls, [data-layer], .cl-transform-gizmo')) return;
          resetView();
        });

        function getPartHex(pId) {
          const pData = design.parts[pId];
          if (!pData || !pData.fill) return '#b85c66';
          return pData.fill.type === 'linear' ? (pData.fill.stops[0]?.c || '#b85c66') : (pData.fill.color || '#b85c66');
        }

        function syncPartChips() {
          partQuickBar.style.display = activeView === '2d' ? 'flex' : 'none';
          partQuickBar.querySelectorAll('.canvas-part-chip').forEach((btn) => {
            const pId = btn.dataset.partChip;
            btn.classList.toggle('is-active', pId === activePart);
            const dot = btn.querySelector('.part-tab-dot');
            if (dot) dot.style.background = getPartHex(pId);
          });
        }

        function goToStep(idx) {
          activeStepIdx = CL.clamp(idx, 0, STEPS.length - 1);
          stepperBar.querySelectorAll('.studio-step-pill').forEach((b, i) => {
            b.classList.toggle('is-active', i === activeStepIdx);
            b.classList.toggle('is-done', i < activeStepIdx);
          });
          syncPartChips();
          render2DCanvas();
          renderStepPanel();
        }

        function switchView(view) {
          activeView = view;
          document.getElementById('btnView2D').classList.toggle('is-active', view === '2d');
          document.getElementById('btnView3D').classList.toggle('is-active', view === '3d');
          document.getElementById('canvasFloatingControls').style.display = view === '2d' ? 'flex' : 'none';
          document.getElementById('canvasViewport').style.display = view === '2d' ? 'block' : 'none';
          syncPartChips();

          const p3d = document.getElementById('preview3dHost');
          p3d.style.display = view === '3d' ? 'block' : 'none';

          if (view === '3d') {
            if (!preview3DInstance && window.THREE) {
              const s = CL.store.settings || {};
              preview3DInstance = new CL.Preview3D(p3d, {
                autoRotate: s.autoRotate3D !== false,
                highQuality: s.highQuality3D !== false,
                bloom: s.studioBloom !== false,
                interactive: true,
              });
            }
            if (preview3DInstance) {
              preview3DInstance.setDesign(design);
            }
          }
        }

        function updateUndoRedoUI() {
          undoBtn.disabled = historyIdx <= 0;
          redoBtn.disabled = historyIdx >= history.length - 1;
        }

        function getActiveTargetLayer() {
          let targetLayer = null;
          if (selectedLayerId) {
            targetLayer = design.layers.find((l) => l.id === selectedLayerId);
          }
          if (!targetLayer) {
            if (STEPS[activeStepIdx].id === 'text') {
              targetLayer = design.layers.find((l) => l.type === 'text' && l.part === activePart);
            } else if (STEPS[activeStepIdx].id === 'graphics') {
              targetLayer = design.layers.find((l) => (l.type === 'image' || l.type === 'shape') && l.part === activePart);
            }
          }
          return targetLayer;
        }

        // ======================================================
        // RENDER 2D LIPSTICK + FIGMA BLUE SELECTION GIZMO
        // ======================================================
        function render2DCanvas() {
          const holder = document.getElementById('canvasSvgHolder');
          if (!holder) return;

          const showSafeZone = STEPS[activeStepIdx].id !== 'colors' ? activePart : null;

          const svg = CL.render.renderSVG(design, {
            interactive: true,
            width: 440,
            height: 600,
            shading: true,
            shadow: true,
            showSafeZone,
          });

          holder.innerHTML = svg;
          const svgEl = holder.querySelector('svg');
          svgEl.classList.add('canvas-svg-root');

          // Clicking Cap or Base selects that part (when past Step 1)
          svgEl.querySelectorAll('[data-part]').forEach((el) => {
            el.addEventListener('click', (e) => {
              if (isSpaceDown) return;
              e.stopPropagation();
              const p = el.getAttribute('data-part');
              if (p === 'cap' || p === 'base') {
                activePart = p;
                selectedLayerId = null;
                syncPartChips();
                render2DCanvas();
                renderStepPanel();
              }
            });
          });

          // Interactive On-Surface Figma Transform Gizmo (Move, Rotate, Corner Resize, Smart Guides)
          const targetLayer = STEPS[activeStepIdx].id !== 'colors' ? getActiveTargetLayer() : null;

          if (targetLayer && targetLayer.visible !== false) {
            const layout = CL.models.layout(design.model);
            const partRect = layout[targetLayer.part];
            if (partRect) {
              const safe = partRect.safe || { minX: 0.16, maxX: 0.84, minY: 0.14, maxY: 0.86 };
              const curX = CL.clamp(targetLayer.x ?? 0.5, safe.minX, safe.maxX);
              const curY = CL.clamp(targetLayer.y ?? 0.5, safe.minY, safe.maxY);
              const cx = partRect.x + curX * partRect.w;
              const cy = partRect.y + curY * partRect.h;
              const rot = targetLayer.rotation || 0;

              // Map SVG user units (viewBox 460×640, fitted + zoomed) to screen px
              const svgToScreen = (x, y) => {
                const m = svgEl.getScreenCTM();
                if (!m) return [x, y];
                return [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f];
              };

              const domLyr = svgEl.querySelector(`[data-layer="${targetLayer.id}"]`);
              let bW = 60, bH = 22;
              if (domLyr) {
                try {
                  const bb = domLyr.getBBox();
                  if (bb && bb.width > 0 && bb.height > 0) {
                    bW = bb.width;
                    bH = bb.height;
                  }
                } catch (err) {}
              } else if (targetLayer.type === 'text') {
                const textContent = (targetLayer.text && targetLayer.text.content) || 'COSLAB';
                const sz = (targetLayer.text && targetLayer.text.size) || 12;
                const sp = (targetLayer.text && targetLayer.text.spacing) || 0;
                bW = Math.max(34, textContent.length * (sz * 0.65) + Math.max(0, textContent.length - 1) * sp);
                bH = Math.max(16, sz * 1.35);
              } else if (targetLayer.type === 'image') {
                bW = (targetLayer.image && targetLayer.image.w) || 40;
                bH = (targetLayer.image && targetLayer.image.h) || 40;
              } else if (targetLayer.type === 'shape') {
                bW = (targetLayer.shape && targetLayer.shape.w) || 30;
                bH = (targetLayer.shape && targetLayer.shape.h) || 30;
              }

              const padX = 8, padY = 6;
              const boxW = Math.round(bW + padX * 2);
              const boxH = Math.round(bH + padY * 2);
              const stemLen = 22;
              const handleY = -boxH / 2 - stemLen;

              // Smart Center Guides (Figma Pink)
              const guideG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
              guideG.setAttribute('class', 'cl-smart-guides');
              const midX = partRect.x + partRect.w * 0.5;
              const midY = partRect.y + partRect.h * 0.5;
              guideG.innerHTML = `
                <line class="cl-smart-guide" id="guideV" x1="${midX}" y1="${safe.y}" x2="${midX}" y2="${safe.y + safe.h}" style="display:none"/>
                <line class="cl-smart-guide" id="guideH" x1="${safe.x}" y1="${midY}" x2="${safe.x + safe.w}" y2="${midY}" style="display:none"/>
              `;
              svgEl.appendChild(guideG);
              const guideV = guideG.querySelector('#guideV');
              const guideH = guideG.querySelector('#guideH');

              const gizmoG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
              gizmoG.setAttribute('class', 'cl-transform-gizmo');
              gizmoG.setAttribute('data-gizmo-layer', targetLayer.id);
              gizmoG.setAttribute('transform', `translate(${CL.round(cx, 2)} ${CL.round(cy, 2)}) rotate(${CL.round(rot, 2)})`);

              const corners = [
                { id: 'nw', x: -boxW / 2, y: -boxH / 2, cur: 'nwse-resize' },
                { id: 'ne', x: boxW / 2, y: -boxH / 2, cur: 'nesw-resize' },
                { id: 'sw', x: -boxW / 2, y: boxH / 2, cur: 'nesw-resize' },
                { id: 'se', x: boxW / 2, y: boxH / 2, cur: 'nwse-resize' },
              ];

              gizmoG.innerHTML = `
                <rect class="gizmo-hit" x="${-boxW / 2}" y="${-boxH / 2}" width="${boxW}" height="${boxH}" fill="rgba(13,153,255,0.03)"/>
                <rect class="gizmo-box-halo" x="${-boxW / 2}" y="${-boxH / 2}" width="${boxW}" height="${boxH}" rx="2" fill="none"/>
                <rect class="gizmo-box-main" x="${-boxW / 2}" y="${-boxH / 2}" width="${boxW}" height="${boxH}" rx="2" fill="none"/>
                <line class="gizmo-stem-halo" x1="0" y1="${-boxH / 2}" x2="0" y2="${handleY}"/>
                <line class="gizmo-stem-main" x1="0" y1="${-boxH / 2}" x2="0" y2="${handleY}"/>
                ${corners.map((c) => `
                  <g class="gizmo-corner-wrap" data-corner="${c.id}" style="cursor:${c.cur}">
                    <circle cx="${c.x}" cy="${c.y}" r="10" fill="transparent"/>
                    <rect class="gizmo-corner" x="${c.x - 4}" y="${c.y - 4}" width="8" height="8" rx="1.5"/>
                  </g>
                `).join('')}
                <g class="gizmo-rot-handle" transform="translate(0 ${handleY})">
                  <circle class="gizmo-rot-hit" r="15" fill="transparent"/>
                  <circle class="gizmo-rot-bg" r="9"/>
                  <path class="gizmo-rot-icon" d="M -3.2 -1.2 A 3.8 3.8 0 1 1 -1 3.4 M -4.8 -2.8 L -3.3 -1 L -1.6 -2.5" fill="none" stroke="#0d99ff" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
                </g>
                <g class="gizmo-hud-pill" style="display: none;" transform="translate(0 ${boxH / 2 + 18})">
                  <rect x="-24" y="-10" width="48" height="20"/>
                  <text x="0" y="0.5">${Math.round(rot)}°</text>
                </g>
              `;

              svgEl.appendChild(gizmoG);

              const hudPill = gizmoG.querySelector('.gizmo-hud-pill');
              const hudRect = hudPill?.querySelector('rect');
              const hudText = hudPill?.querySelector('text');

              function showHud(label) {
                if (!hudPill || !hudText || !hudRect) return;
                hudPill.style.display = 'block';
                hudText.textContent = label;
                const w = Math.max(46, label.length * 7.2 + 14);
                hudRect.setAttribute('width', String(w));
                hudRect.setAttribute('x', String(-w / 2));
              }
              function hideHud() {
                if (hudPill) hudPill.style.display = 'none';
              }

              // 1. Drag to Move (with Figma Smart Center Snapping & 1:1 Zoom-Accurate Delta)
              const bindMove = (hitEl) => {
                hitEl.addEventListener('pointerdown', (e) => {
                  if (targetLayer.locked || isSpaceDown || e.button === 1) return;
                  e.stopPropagation();
                  e.preventDefault();
                  selectedLayerId = targetLayer.id;
                  activePart = targetLayer.part;

                  // Screen px per SVG user unit (accounts for viewBox fit + canvas zoom)
                  const ctm = svgEl.getScreenCTM();
                  const scaleX = ctm ? ctm.a : 1;
                  const scaleY = ctm ? ctm.d : 1;
                  const startX = e.clientX, startY = e.clientY;
                  const origX = targetLayer.x ?? 0.5, origY = targetLayer.y ?? 0.5;

                  const onMove = (ev) => {
                    const dx = (ev.clientX - startX) / scaleX;
                    const dy = (ev.clientY - startY) / scaleY;
                    let nx = CL.clamp(origX + dx / partRect.w, safe.minX, safe.maxX);
                    let ny = CL.clamp(origY + dy / partRect.h, safe.minY, safe.maxY);

                    // Smart snap to center (50%)
                    const snapV = Math.abs(nx - 0.5) < 0.02;
                    const snapH = Math.abs(ny - 0.5) < 0.015;
                    if (snapV) nx = 0.5;
                    if (snapH) ny = 0.5;
                    if (guideV) guideV.style.display = snapV ? 'block' : 'none';
                    if (guideH) guideH.style.display = snapH ? 'block' : 'none';

                    targetLayer.x = nx;
                    targetLayer.y = ny;

                    const liveCx = partRect.x + nx * partRect.w;
                    const liveCy = partRect.y + ny * partRect.h;
                    const liveRot = targetLayer.rotation || 0;

                    gizmoG.setAttribute('transform', `translate(${CL.round(liveCx, 2)} ${CL.round(liveCy, 2)}) rotate(${CL.round(liveRot, 2)})`);
                    if (domLyr) {
                      domLyr.setAttribute('transform', CL.render.layerTransform(targetLayer, partRect));
                    }

                    const pctX = Math.round(nx * 100);
                    const pctY = Math.round(ny * 100);
                    showHud(`${pctX}% · ${pctY}%`);

                    const inX = document.getElementById('fgInputX');
                    const inY = document.getElementById('fgInputY');
                    if (inX) inX.value = String(pctX);
                    if (inY) inY.value = String(pctY);
                  };

                  const onUp = () => {
                    window.removeEventListener('pointermove', onMove);
                    window.removeEventListener('pointerup', onUp);
                    if (guideV) guideV.style.display = 'none';
                    if (guideH) guideH.style.display = 'none';
                    hideHud();
                    pushHistory();
                    render2DCanvas();
                  };

                  window.addEventListener('pointermove', onMove);
                  window.addEventListener('pointerup', onUp);
                });
              };

              const hitRect = gizmoG.querySelector('.gizmo-hit');
              if (hitRect) bindMove(hitRect);
              if (domLyr) bindMove(domLyr);

              // 2. Drag to Rotate Handle
              const rotHandle = gizmoG.querySelector('.gizmo-rot-handle');
              if (rotHandle) {
                rotHandle.addEventListener('pointerdown', (e) => {
                  if (targetLayer.locked) return;
                  e.stopPropagation();
                  e.preventDefault();
                  selectedLayerId = targetLayer.id;

                  rotHandle.style.cursor = 'grabbing';
                  document.body.style.cursor = 'grabbing';

                  const curCenterCx = cx;
                  const curCenterCy = cy;
                  const [screenCx, screenCy] = svgToScreen(cx, cy);

                  const onRotMove = (ev) => {
                    const dx = ev.clientX - screenCx;
                    const dy = ev.clientY - screenCy;
                    let deg = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
                    deg = ((deg % 360) + 540) % 360 - 180;

                    const snapAngles = [0, 45, 90, -90, 180, -180, -45, 135, -135];
                    for (const snap of snapAngles) {
                      if (Math.abs(deg - snap) < (ev.shiftKey ? 9 : 4)) {
                        deg = snap;
                        break;
                      }
                    }
                    const rounded = Math.round(deg);
                    targetLayer.rotation = rounded;

                    gizmoG.setAttribute('transform', `translate(${CL.round(curCenterCx, 2)} ${CL.round(curCenterCy, 2)}) rotate(${rounded})`);
                    if (domLyr) {
                      domLyr.setAttribute('transform', CL.render.layerTransform(targetLayer, partRect));
                    }

                    showHud(`${rounded}°`);

                    const rotInput = document.getElementById('fgInputRot');
                    const rotSlider = document.getElementById('studioLayerRotSlider');
                    if (rotInput) rotInput.value = String(rounded);
                    if (rotSlider) rotSlider.value = String(rounded);

                    document.querySelectorAll('[data-preset-deg]').forEach((btn) => {
                      const pDeg = parseInt(btn.dataset.presetDeg, 10);
                      btn.classList.toggle('is-active', pDeg === rounded);
                    });
                  };

                  const onRotUp = () => {
                    window.removeEventListener('pointermove', onRotMove);
                    window.removeEventListener('pointerup', onRotUp);
                    hideHud();
                    rotHandle.style.cursor = 'grab';
                    document.body.style.cursor = '';
                    pushHistory();
                    render2DCanvas();
                    renderStepPanel();
                  };

                  window.addEventListener('pointermove', onRotMove);
                  window.addEventListener('pointerup', onRotUp);
                });
              }

              // 3. Drag Corner Handles to Resize Text / Logo Directly on Surface!
              gizmoG.querySelectorAll('.gizmo-corner-wrap').forEach((cornerEl) => {
                cornerEl.addEventListener('pointerdown', (e) => {
                  if (targetLayer.locked) return;
                  e.stopPropagation();
                  e.preventDefault();
                  selectedLayerId = targetLayer.id;

                  const [screenCx, screenCy] = svgToScreen(cx, cy);

                  const startDist = Math.max(12, Math.hypot(e.clientX - screenCx, e.clientY - screenCy));
                  const origSize = targetLayer.type === 'text'
                    ? (targetLayer.text.size || 12)
                    : targetLayer.type === 'image'
                      ? (targetLayer.image.w || 40)
                      : (targetLayer.shape.w || 24);
                  const origRatio = targetLayer.type === 'image'
                    ? ((targetLayer.image.h || origSize) / (targetLayer.image.w || origSize))
                    : 1;

                  const onScaleMove = (ev) => {
                    const curDist = Math.max(8, Math.hypot(ev.clientX - screenCx, ev.clientY - screenCy));
                    const factor = curDist / startDist;
                    let hudVal = null;

                    if (targetLayer.type === 'text') {
                      const nextSz = CL.clamp(Math.round(origSize * factor), 8, 36);
                      if (nextSz !== targetLayer.text.size) {
                        targetLayer.text.size = nextSz;
                        const szIn = document.getElementById('fgInputSize');
                        const szSl = document.getElementById('studioLayerSizeSlider');
                        if (szIn) szIn.value = String(nextSz);
                        if (szSl) szSl.value = String(nextSz);
                        render2DCanvas();
                      }
                      hudVal = `${nextSz}px`;
                    } else if (targetLayer.type === 'image') {
                      const nextW = CL.clamp(Math.round(origSize * factor), 14, 96);
                      if (nextW !== targetLayer.image.w) {
                        targetLayer.image.w = nextW;
                        targetLayer.image.h = Math.round(nextW * origRatio);
                        const wIn = document.getElementById('fgInputGraphicW');
                        if (wIn) wIn.value = String(nextW);
                        render2DCanvas();
                      }
                      hudVal = `${nextW}px`;
                    } else if (targetLayer.type === 'shape') {
                      const nextW = CL.clamp(Math.round(origSize * factor), 12, 90);
                      if (nextW !== targetLayer.shape.w) {
                        targetLayer.shape.w = nextW;
                        if (targetLayer.shape.kind !== 'line') targetLayer.shape.h = nextW;
                        const wIn = document.getElementById('fgInputGraphicW');
                        if (wIn) wIn.value = String(nextW);
                        render2DCanvas();
                      }
                      hudVal = `${nextW}px`;
                    }

                    if (hudVal) {
                      const livePill = holder.querySelector('.gizmo-hud-pill');
                      const liveText = livePill?.querySelector('text');
                      const liveRect = livePill?.querySelector('rect');
                      if (livePill && liveText && liveRect) {
                        livePill.style.display = 'block';
                        liveText.textContent = hudVal;
                        const w = Math.max(46, hudVal.length * 7.2 + 14);
                        liveRect.setAttribute('width', String(w));
                        liveRect.setAttribute('x', String(-w / 2));
                      }
                    }
                  };

                  const onScaleUp = () => {
                    window.removeEventListener('pointermove', onScaleMove);
                    window.removeEventListener('pointerup', onScaleUp);
                    pushHistory();
                    render2DCanvas();
                    renderStepPanel();
                  };

                  window.addEventListener('pointermove', onScaleMove);
                  window.addEventListener('pointerup', onScaleUp);
                });
              });
            }
          }

          // Clicking on any other layer switches to it
          svgEl.querySelectorAll('[data-layer]').forEach((el) => {
            el.addEventListener('click', (e) => {
              if (isSpaceDown) return;
              const lid = el.getAttribute('data-layer');
              if (lid && lid !== selectedLayerId) {
                e.stopPropagation();
                selectedLayerId = lid;
                const lyr = design.layers.find((l) => l.id === lid);
                if (lyr) {
                  activePart = lyr.part;
                  syncPartChips();
                  const targetStep = STEPS.findIndex((s) => s.id === (lyr.type === 'text' ? 'text' : 'graphics'));
                  if (activeStepIdx !== targetStep) goToStep(targetStep);
                  else {
                    render2DCanvas();
                    renderStepPanel();
                  }
                }
              }
            });
          });

          if (activeView === '3d' && preview3DInstance) {
            preview3DInstance.setDesign(design);
          }
        }

        // ======================================================
        // RENDER RIGHT PANEL: FIGMA UI3 DESIGN INSPECTOR
        // ======================================================
        function renderStepPanel() {
          const step = STEPS[activeStepIdx];
          const isVi = I18N.lang === 'vi';

          const TITLES = {
            model: isVi ? 'Chọn Model' : 'Choose Model',
            colors: isVi ? 'Chọn Màu' : 'Choose Color',
            text: isVi ? 'Chọn Chữ' : 'Typography',
            graphics: isVi ? 'Chọn Logo' : 'Logo & Marks',
          };

          stepHeader.innerHTML = '';
          stepHeader.append(
            CL.h('h2.studio-step-title', { text: TITLES[step.id] }),
            CL.h('span.studio-step-eyebrow', { text: isVi ? `Bước ${activeStepIdx + 1} / ${STEPS.length}` : `Step ${activeStepIdx + 1} / ${STEPS.length}` })
          );

          stepBody.innerHTML = '';
          if (step.id === 'colors') buildColorStep();
          else if (step.id === 'text') buildTextStep();
          else if (step.id === 'graphics') buildLogoStep();

          // Clean Footer Navigation
          stepFooter.innerHTML = '';
          const backBtn = activeStepIdx > 0
            ? CL.h('button.btn.btn-outline', {
                html: CL.icon('arrowLeft') + `<span>${isVi ? 'Quay lại' : 'Back'}</span>`,
                onclick: () => goToStep(activeStepIdx - 1),
              })
            : null;

          let nextBtn;
          if (activeStepIdx < STEPS.length - 1) {
            const nextStep = STEPS[activeStepIdx + 1];
            nextBtn = CL.h('button.btn.btn-primary.studio-next-btn', {
              html: `<span>${isVi ? 'Tiếp: ' + nextStep.vi : 'Next: ' + nextStep.en}</span>` + CL.icon('arrowRight'),
              onclick: () => goToStep(activeStepIdx + 1),
            });
          } else {
            nextBtn = CL.h('button.btn.btn-primary.studio-next-btn', {
              html: CL.icon('download') + `<span>${isVi ? 'Xuất thiết kế' : 'Export Design'}</span>`,
              onclick: (e) => {
                CL.store.saveDesign(design);
                CL.menu(e.currentTarget, CL.exportMenuItems(() => design), { align: 'end' });
              },
            });
          }

          if (backBtn) stepFooter.append(backBtn);
          stepFooter.append(nextBtn);
        }

        // ======================================================
        // STEP 02: COLOR & FINISH (FIGMA FILL + MATERIAL)
        // ======================================================
        function buildColorStep() {
          const isVi = I18N.lang === 'vi';
          const curPart = design.parts[activePart] || (design.parts[activePart] = { fill: { type: 'solid', color: '#b85c66' }, finish: 'matte' });
          const activeHex = getPartHex(activePart).toLowerCase();

          // 1. Finish Pills
          const FINISH_LIST = [
            { id: 'matte', fallback: 'Velvet' },
            { id: 'gloss', fallback: 'Dewy' },
            { id: 'satin', fallback: 'Satin' },
            { id: 'metallic', fallback: 'Chrome' },
          ];
          const finishRow = CL.h('div.finish-grid', null,
            FINISH_LIST.map((f) =>
              CL.h('button.finish-card-btn' + (curPart.finish === f.id ? '.is-active' : ''), {
                type: 'button',
                text: t('editor.finishesShort.' + f.id) || f.fallback,
                onclick: () => {
                  curPart.finish = f.id;
                  pushHistory();
                  render2DCanvas();
                  renderStepPanel();
                },
              })
            )
          );

          // 2. Figma Fill Bar (Swatch + Hex Input)
          const hexInput = CL.h('input.fg-hex-input', {
            type: 'text',
            value: activeHex.toUpperCase(),
            maxLength: 7,
            onchange: () => {
              let v = hexInput.value.trim();
              if (!v.startsWith('#')) v = '#' + v;
              if (/^#[0-9a-fA-F]{6}$/.test(v)) {
                curPart.fill = { type: 'solid', color: v.toLowerCase() };
                pushHistory();
                syncPartChips();
                render2DCanvas();
                renderStepPanel();
              } else {
                hexInput.value = activeHex.toUpperCase();
              }
            },
          });

          const swatchPreview = CL.h('label.fg-swatch-trigger', {
            style: { background: activeHex },
            title: isVi ? 'Chọn màu tự do' : 'Pick Custom Color',
          },
            CL.h('input', {
              type: 'color',
              value: activeHex.length === 7 ? activeHex : '#b85c66',
              oninput: (e) => {
                const c = e.target.value;
                curPart.fill = { type: 'solid', color: c };
                swatchPreview.style.background = c;
                hexInput.value = c.toUpperCase();
                syncPartChips();
                render2DCanvas();
              },
              onchange: () => {
                pushHistory();
                renderStepPanel();
              },
            })
          );

          const fillBar = CL.h('div.fg-fill-row', null,
            swatchPreview,
            hexInput,
            CL.h('span.fg-badge-pill', { text: activePart === 'base' ? (isVi ? 'Thân' : 'Body') : (isVi ? 'Nắp' : 'Cap') })
          );

          // 3. K-Beauty Swatch Grid
          const customInput = CL.h('input', {
            type: 'color',
            value: activeHex.length === 7 ? activeHex : '#b85c66',
            style: { position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' },
            oninput: () => {
              curPart.fill = { type: 'solid', color: customInput.value };
              syncPartChips();
              render2DCanvas();
            },
            onchange: () => {
              pushHistory();
              renderStepPanel();
            },
          });

          const customCircle = CL.h('label.studio-color-dot.is-custom', {
            title: isVi ? 'Tự chọn màu' : 'Custom Color',
          },
            CL.h('span', { text: '+' }),
            customInput
          );

          const colorGrid = CL.h('div.studio-clean-palette', null,
            PALETTE.map((item) =>
              CL.h('button.studio-color-dot' + (activeHex === item.c.toLowerCase() ? '.is-active' : ''), {
                type: 'button',
                title: item.n,
                style: { background: item.c },
                onclick: () => {
                  curPart.fill = { type: 'solid', color: item.c };
                  pushHistory();
                  syncPartChips();
                  render2DCanvas();
                  renderStepPanel();
                },
              })
            ),
            customCircle
          );

          stepBody.append(
            CL.h('div.fg-section', null,
              CL.h('div.fg-section-head', null,
                CL.h('span.fg-section-title', { text: isVi ? 'Chất liệu bề mặt' : 'Surface Finish' })
              ),
              finishRow
            ),
            CL.h('div.fg-section', null,
              CL.h('div.fg-section-head', null,
                CL.h('span.fg-section-title', { text: isVi ? 'Màu sắc' : 'Fill Color' })
              ),
              fillBar,
              colorGrid
            )
          );
        }

        // ======================================================
        // STEP 03: TEXT — FIGMA UI3 POSITION + TYPOGRAPHY + FILL
        // ======================================================
        function buildTextStep() {
          const isVi = I18N.lang === 'vi';
          const targetPart = activePart === 'cap' ? 'cap' : 'base';

          let curLayer = design.layers.find((l) => l.type === 'text' && l.part === targetPart);
          if (curLayer) selectedLayerId = curLayer.id;

          function ensureTextLayer(initialText) {
            if (!curLayer) {
              const isBase = targetPart === 'base';
              curLayer = {
                id: CL.uid('ly_txt'),
                type: 'text',
                name: initialText || 'COSLAB',
                part: targetPart,
                x: 0.5,
                y: isBase ? 0.5 : 0.72,
                rotation: isBase ? -90 : 0,
                opacity: 1,
                visible: true,
                locked: false,
                text: {
                  content: initialText || 'COSLAB',
                  font: 'Plus Jakarta Sans',
                  size: 13,
                  weight: 600,
                  italic: false,
                  color: '#ffffff',
                  spacing: 3,
                  align: 'center',
                  lineHeight: 1.2,
                },
              };
              design.layers.push(curLayer);
              selectedLayerId = curLayer.id;
            }
            return curLayer;
          }

          // --- SECTION 1: CONTENT ---
          const textInput = CL.h('input.fg-text-input', {
            value: curLayer ? curLayer.text.content : '',
            placeholder: isVi ? 'Nhập nội dung chữ (VD: 01 ROSÉ)...' : 'Enter text (e.g. 01 ROSÉ)...',
            oninput: () => {
              const val = textInput.value;
              if (!val.trim() && curLayer) {
                design.layers = design.layers.filter((l) => l.id !== curLayer.id);
                curLayer = null;
                selectedLayerId = null;
                render2DCanvas();
                return;
              }
              const lyr = ensureTextLayer(val);
              lyr.text.content = val;
              lyr.name = val;
              render2DCanvas();
            },
            onchange: pushHistory,
          });

          const contentSection = CL.h('div.fg-section', null,
            CL.h('div.fg-section-head', null,
              CL.h('span.fg-section-title', { text: isVi ? 'Nội dung' : 'Content' }),
              CL.h('span.fg-badge-pill', { text: 'Safe Zone' })
            ),
            textInput
          );

          // --- SECTION 2: POSITION & ROTATION (FIGMA POSITION BLOCK) ---
          const curPctX = Math.round((curLayer ? (curLayer.x ?? 0.5) : 0.5) * 100);
          const curPctY = Math.round((curLayer ? (curLayer.y ?? 0.5) : (targetPart === 'base' ? 0.5 : 0.72)) * 100);
          const curRot = curLayer ? Math.round(curLayer.rotation || 0) : (targetPart === 'base' ? -90 : 0);

          const xField = createFigmaScrubField({
            id: 'fgInputX',
            prefix: 'X',
            title: isVi ? 'Vị trí ngang (%)' : 'Horizontal Position (%)',
            value: curPctX,
            min: 15,
            max: 85,
            step: 1,
            unit: '%',
            scrubScale: 0.35,
            onInput: (v) => {
              const lyr = ensureTextLayer(textInput.value || 'COSLAB');
              lyr.x = v / 100;
              render2DCanvas();
            },
            onCommit: pushHistory,
          });

          const yField = createFigmaScrubField({
            id: 'fgInputY',
            prefix: 'Y',
            title: isVi ? 'Vị trí dọc (%)' : 'Vertical Position (%)',
            value: curPctY,
            min: 12,
            max: 88,
            step: 1,
            unit: '%',
            scrubScale: 0.35,
            onInput: (v) => {
              const lyr = ensureTextLayer(textInput.value || 'COSLAB');
              lyr.y = v / 100;
              render2DCanvas();
            },
            onCommit: pushHistory,
          });

          const rotSlider = CL.h('input.fg-range#studioLayerRotSlider', {
            type: 'range',
            min: '-180',
            max: '180',
            step: '1',
            value: String(curRot),
            oninput: () => {
              const lyr = ensureTextLayer(textInput.value || 'COSLAB');
              const val = parseInt(rotSlider.value, 10);
              lyr.rotation = val;
              rotField.input.value = String(val);
              syncPresetActive(val);
              render2DCanvas();
            },
            onchange: pushHistory,
          });

          const rotField = createFigmaScrubField({
            id: 'fgInputRot',
            prefix: '∠',
            title: isVi ? 'Góc xoay (°)' : 'Rotation Angle (°)',
            value: curRot,
            min: -180,
            max: 180,
            step: 1,
            unit: '°',
            scrubScale: 0.7,
            onInput: (v) => {
              const lyr = ensureTextLayer(textInput.value || 'COSLAB');
              lyr.rotation = v;
              rotSlider.value = String(v);
              syncPresetActive(v);
              render2DCanvas();
            },
            onCommit: pushHistory,
          });

          const PRESETS = [
            { deg: 0, label: '0°' },
            { deg: -90, label: '-90°' },
            { deg: 90, label: '90°' },
            { deg: 180, label: '180°' },
          ];

          const rotSeg = CL.h('div.fg-seg', { style: { flex: '1.35' } },
            PRESETS.map((p) =>
              CL.h('button.fg-seg-btn' + (curRot === p.deg ? '.is-active' : ''), {
                type: 'button',
                'data-preset-deg': p.deg,
                text: p.label,
                onclick: () => {
                  const lyr = ensureTextLayer(textInput.value || 'COSLAB');
                  lyr.rotation = p.deg;
                  rotField.input.value = String(p.deg);
                  rotSlider.value = String(p.deg);
                  syncPresetActive(p.deg);
                  pushHistory();
                  render2DCanvas();
                },
              })
            )
          );

          function syncPresetActive(deg) {
            rotSeg.querySelectorAll('.fg-seg-btn').forEach((b) => {
              b.classList.toggle('is-active', parseInt(b.dataset.presetDeg, 10) === deg);
            });
          }

          const resetCenterBtn = CL.h('button.fg-action-btn', {
            type: 'button',
            html: CL.icon('fit') + `<span>${isVi ? 'Căn giữa' : 'Center'}</span>`,
            onclick: () => {
              if (curLayer) {
                curLayer.x = 0.5;
                curLayer.y = targetPart === 'base' ? 0.5 : 0.72;
                curLayer.rotation = targetPart === 'base' ? -90 : 0;
                pushHistory();
                render2DCanvas();
                renderStepPanel();
              }
            },
          });

          const positionSection = CL.h('div.fg-section', null,
            CL.h('div.fg-section-head', null,
              CL.h('span.fg-section-title', { text: isVi ? 'Vị trí & Xoay' : 'Position' }),
              resetCenterBtn
            ),
            CL.h('div.fg-grid-2', null, xField.el, yField.el),
            CL.h('div.fg-row', null,
              CL.h('div', { style: { flex: '0.9', minWidth: 0 } }, rotField.el),
              rotSeg
            ),
            rotSlider
          );

          // --- SECTION 3: TYPOGRAPHY (FIGMA TYPOGRAPHY BLOCK) ---
          const FONTS = [
            { f: 'Plus Jakarta Sans', label: 'Jakarta Sans', tag: 'Modern' },
            { f: 'Cinzel', label: 'Cinzel', tag: 'Luxury' },
            { f: 'Playfair Display', label: 'Playfair', tag: 'Editorial' },
            { f: 'Cormorant Garamond', label: 'Cormorant', tag: 'Classic' },
            { f: 'Montserrat', label: 'Montserrat', tag: 'Geometric' },
            { f: 'Italiana', label: 'Italiana', tag: 'Fashion' },
          ];
          const currentFont = curLayer ? curLayer.text.font : 'Plus Jakarta Sans';
          const fontGrid = CL.h('div.studio-font-grid', null,
            FONTS.map((item) =>
              CL.h('button.studio-font-card' + (currentFont === item.f ? '.is-active' : ''), {
                type: 'button',
                onclick: () => {
                  const lyr = ensureTextLayer(textInput.value || 'COSLAB');
                  if (!textInput.value) textInput.value = lyr.text.content;
                  lyr.text.font = item.f;
                  pushHistory();
                  render2DCanvas();
                  renderStepPanel();
                },
              },
                CL.h('span.font-sample', { text: 'Aa', style: { fontFamily: `'${item.f}', sans-serif` } }),
                CL.h('span.font-meta', null,
                  CL.h('span.font-name', { text: item.label }),
                  CL.h('span.font-tag', { text: item.tag })
                )
              )
            )
          );

          const curSize = curLayer ? Math.round(curLayer.text.size || 13) : 13;
          const curSpacing = curLayer ? Math.round(curLayer.text.spacing ?? 3) : 3;

          const sizeSlider = CL.h('input.fg-range#studioLayerSizeSlider', {
            type: 'range',
            min: '8',
            max: '36',
            step: '1',
            value: String(curSize),
            oninput: () => {
              const lyr = ensureTextLayer(textInput.value || 'COSLAB');
              const val = parseInt(sizeSlider.value, 10);
              lyr.text.size = val;
              sizeField.input.value = String(val);
              render2DCanvas();
            },
            onchange: pushHistory,
          });

          const sizeField = createFigmaScrubField({
            id: 'fgInputSize',
            prefix: 'Aa',
            title: isVi ? 'Cỡ chữ (px)' : 'Font Size (px)',
            value: curSize,
            min: 8,
            max: 36,
            step: 1,
            unit: 'px',
            scrubScale: 0.25,
            showSteppers: true,
            onInput: (v) => {
              const lyr = ensureTextLayer(textInput.value || 'COSLAB');
              lyr.text.size = v;
              sizeSlider.value = String(v);
              render2DCanvas();
            },
            onCommit: pushHistory,
          });

          const spacingField = createFigmaScrubField({
            id: 'fgInputSpacing',
            prefix: '↔',
            title: isVi ? 'Giãn chữ (px)' : 'Letter Spacing (px)',
            value: curSpacing,
            min: 0,
            max: 14,
            step: 1,
            unit: 'px',
            scrubScale: 0.18,
            onInput: (v) => {
              const lyr = ensureTextLayer(textInput.value || 'COSLAB');
              lyr.text.spacing = v;
              render2DCanvas();
            },
            onCommit: pushHistory,
          });

          const curWeight = curLayer ? (curLayer.text.weight || 600) : 600;
          const curItalic = !!(curLayer && curLayer.text.italic);
          const styleBar = CL.h('div.fg-row', null,
            CL.h('div.fg-seg', { style: { flex: '1' } },
              [
                { w: 400, label: 'Regular' },
                { w: 600, label: 'SemiBold' },
                { w: 700, label: 'Bold' },
              ].map((wt) =>
                CL.h('button.fg-seg-btn' + (curWeight === wt.w ? '.is-active' : ''), {
                  type: 'button',
                  text: wt.label,
                  onclick: () => {
                    const lyr = ensureTextLayer(textInput.value || 'COSLAB');
                    lyr.text.weight = wt.w;
                    pushHistory();
                    render2DCanvas();
                    renderStepPanel();
                  },
                })
              )
            ),
            CL.h('div.fg-seg', { style: { width: '46px', flex: 'none' } },
              CL.h('button.fg-seg-btn' + (curItalic ? '.is-active' : ''), {
                type: 'button',
                title: 'Italic',
                style: { fontStyle: 'italic', fontFamily: 'serif', fontSize: '15px' },
                text: 'I',
                onclick: () => {
                  const lyr = ensureTextLayer(textInput.value || 'COSLAB');
                  lyr.text.italic = !lyr.text.italic;
                  pushHistory();
                  render2DCanvas();
                  renderStepPanel();
                },
              })
            )
          );

          const typoSection = CL.h('div.fg-section', null,
            CL.h('div.fg-section-head', null,
              CL.h('span.fg-section-title', { text: isVi ? 'Kiểu chữ' : 'Typography' })
            ),
            fontGrid,
            CL.h('div.fg-grid-2', null, sizeField.el, spacingField.el),
            sizeSlider,
            styleBar
          );

          // --- SECTION 4: FILL (FIGMA COLOR + OPACITY BLOCK) ---
          const TEXT_COLORS = ['#ffffff', '#171615', '#c5a367', '#e5d5c5', '#d9d9d9', '#f2c6c2'];
          const curTxtColor = (curLayer ? curLayer.text.color : '#ffffff').toLowerCase();
          const curOpacity = Math.round((curLayer ? (curLayer.opacity ?? 1) : 1) * 100);

          const txtHexInput = CL.h('input.fg-hex-input', {
            type: 'text',
            value: curTxtColor.toUpperCase(),
            maxLength: 7,
            onchange: () => {
              let v = txtHexInput.value.trim();
              if (!v.startsWith('#')) v = '#' + v;
              if (/^#[0-9a-fA-F]{6}$/.test(v)) {
                const lyr = ensureTextLayer(textInput.value || 'COSLAB');
                lyr.text.color = v.toLowerCase();
                pushHistory();
                render2DCanvas();
                renderStepPanel();
              } else {
                txtHexInput.value = curTxtColor.toUpperCase();
              }
            },
          });

          const txtSwatchPreview = CL.h('label.fg-swatch-trigger', {
            style: { background: curTxtColor },
            title: isVi ? 'Chọn màu chữ tự do' : 'Pick Text Color',
          },
            CL.h('input', {
              type: 'color',
              value: curTxtColor.length === 7 ? curTxtColor : '#ffffff',
              oninput: (e) => {
                const lyr = ensureTextLayer(textInput.value || 'COSLAB');
                lyr.text.color = e.target.value;
                txtSwatchPreview.style.background = e.target.value;
                txtHexInput.value = e.target.value.toUpperCase();
                render2DCanvas();
              },
              onchange: () => {
                pushHistory();
                renderStepPanel();
              },
            })
          );

          const opacityInput = CL.h('input.fg-num-input', {
            type: 'number',
            min: '10',
            max: '100',
            step: '5',
            value: String(curOpacity),
            oninput: () => {
              const v = CL.clamp(parseInt(opacityInput.value, 10) || 100, 10, 100);
              const lyr = ensureTextLayer(textInput.value || 'COSLAB');
              lyr.opacity = v / 100;
              render2DCanvas();
            },
            onchange: pushHistory,
          });

          const fillBar = CL.h('div.fg-fill-row', null,
            txtSwatchPreview,
            txtHexInput,
            CL.h('span.fg-fill-sep'),
            CL.h('div.fg-opacity-wrap', { title: isVi ? 'Độ đậm (%)' : 'Opacity (%)' },
              opacityInput,
              CL.h('span.fg-unit', { text: '%' })
            )
          );

          const txtColorRow = CL.h('div.studio-quick-swatches', null,
            TEXT_COLORS.map((hex) =>
              CL.h('button.quick-color-dot' + (curTxtColor === hex ? '.is-active' : ''), {
                type: 'button',
                style: { background: hex },
                onclick: () => {
                  const lyr = ensureTextLayer(textInput.value || 'COSLAB');
                  lyr.text.color = hex;
                  pushHistory();
                  render2DCanvas();
                  renderStepPanel();
                },
              })
            )
          );

          const fillSection = CL.h('div.fg-section', null,
            CL.h('div.fg-section-head', null,
              CL.h('span.fg-section-title', { text: isVi ? 'Màu chữ' : 'Fill' })
            ),
            fillBar,
            txtColorRow
          );

          stepBody.append(contentSection, positionSection, typoSection, fillSection);
        }

        // ======================================================
        // STEP 04: LOGO — FIGMA UPLOAD + TRANSFORM + MARKS
        // ======================================================
        function buildLogoStep() {
          const isVi = I18N.lang === 'vi';
          const targetPart = activePart === 'cap' ? 'cap' : 'base';

          const fileIn = CL.h('input', {
            type: 'file',
            accept: 'image/svg+xml,image/png,image/jpeg,image/webp',
            style: { display: 'none' },
            onchange: async (e) => {
              const file = e.target.files && e.target.files[0];
              if (!file) return;
              try {
                const res = await CL.readImageFile(file, 1600);
                const newLayer = {
                  id: CL.uid('ly_img'),
                  type: 'image',
                  name: file.name.slice(0, 18),
                  part: targetPart,
                  x: 0.5,
                  y: 0.5,
                  rotation: 0,
                  opacity: 1,
                  visible: true,
                  locked: false,
                  image: {
                    src: res.src,
                    w: Math.min(54, res.w / 4),
                    h: Math.min(54, res.h / 4),
                  },
                };
                design.layers.push(newLayer);
                selectedLayerId = newLayer.id;
                pushHistory();
                render2DCanvas();
                renderStepPanel();
              } catch (err) {}
            },
          });

          const uploadBox = CL.h('button.studio-upload-dropzone', {
            type: 'button',
            onclick: () => fileIn.click(),
          },
            CL.h('div.upload-icon-circle', { html: CL.icon('upload') }),
            CL.h('strong', { text: isVi ? 'Tải ảnh Logo lên' : 'Upload Logo' }),
            CL.h('span', { text: 'PNG, SVG, JPG · Tự động căn Safe Zone' })
          );

          const uploadSection = CL.h('div.fg-section', null,
            CL.h('div.fg-section-head', null,
              CL.h('span.fg-section-title', { text: isVi ? 'Logo & Hình ảnh' : 'Brand Logo' })
            ),
            uploadBox,
            fileIn
          );

          const curGraphic = design.layers.find((l) => l.part === targetPart && (l.type === 'image' || l.type === 'shape'))
            || design.layers.find((l) => l.type === 'image' || l.type === 'shape');

          let graphicSection = null;
          if (curGraphic) {
            selectedLayerId = curGraphic.id;
            const isImg = curGraphic.type === 'image';
            const curScale = isImg ? Math.round(curGraphic.image.w) : Math.round(curGraphic.shape.w);
            const curRot = Math.round(curGraphic.rotation || 0);
            const curPctX = Math.round((curGraphic.x ?? 0.5) * 100);
            const curPctY = Math.round((curGraphic.y ?? 0.5) * 100);

            const applyScale = (v) => {
              if (isImg) {
                const ratio = (curGraphic.image.h || v) / (curGraphic.image.w || v);
                curGraphic.image.w = v;
                curGraphic.image.h = Math.round(v * ratio);
              } else {
                curGraphic.shape.w = v;
                if (curGraphic.shape.kind !== 'line') curGraphic.shape.h = v;
              }
              render2DCanvas();
            };

            const gxField = createFigmaScrubField({
              id: 'fgInputX',
              prefix: 'X',
              value: curPctX,
              min: 15,
              max: 85,
              unit: '%',
              scrubScale: 0.35,
              onInput: (v) => { curGraphic.x = v / 100; render2DCanvas(); },
              onCommit: pushHistory,
            });
            const gyField = createFigmaScrubField({
              id: 'fgInputY',
              prefix: 'Y',
              value: curPctY,
              min: 12,
              max: 88,
              unit: '%',
              scrubScale: 0.35,
              onInput: (v) => { curGraphic.y = v / 100; render2DCanvas(); },
              onCommit: pushHistory,
            });
            const gwField = createFigmaScrubField({
              id: 'fgInputGraphicW',
              prefix: 'W',
              value: curScale,
              min: 14,
              max: 96,
              step: 2,
              unit: 'px',
              scrubScale: 0.4,
              showSteppers: true,
              onInput: (v) => {
                scaleSlider.value = String(v);
                applyScale(v);
              },
              onCommit: pushHistory,
            });
            const gRotField = createFigmaScrubField({
              id: 'fgInputRot',
              prefix: '∠',
              value: curRot,
              min: -180,
              max: 180,
              unit: '°',
              scrubScale: 0.7,
              onInput: (v) => {
                curGraphic.rotation = v;
                gRotSlider.value = String(v);
                render2DCanvas();
              },
              onCommit: pushHistory,
            });

            const scaleSlider = CL.h('input.fg-range', {
              type: 'range',
              min: '14',
              max: '96',
              step: '2',
              value: String(curScale),
              oninput: () => {
                const v = parseInt(scaleSlider.value, 10);
                gwField.input.value = String(v);
                applyScale(v);
              },
              onchange: pushHistory,
            });

            const gRotSlider = CL.h('input.fg-range#studioLayerRotSlider', {
              type: 'range',
              min: '-180',
              max: '180',
              step: '1',
              value: String(curRot),
              oninput: () => {
                const v = parseInt(gRotSlider.value, 10);
                curGraphic.rotation = v;
                gRotField.input.value = String(v);
                render2DCanvas();
              },
              onchange: pushHistory,
            });

            graphicSection = CL.h('div.fg-section', null,
              CL.h('div.fg-section-head', null,
                CL.h('span.fg-section-title', { text: curGraphic.name || (isVi ? 'Thuộc tính Logo' : 'Transform') }),
                CL.h('button.fg-action-btn', {
                  type: 'button',
                  html: CL.icon('fit') + `<span>${isVi ? 'Căn giữa' : 'Center'}</span>`,
                  onclick: () => {
                    curGraphic.x = 0.5;
                    curGraphic.y = 0.5;
                    curGraphic.rotation = 0;
                    pushHistory();
                    render2DCanvas();
                    renderStepPanel();
                  },
                })
              ),
              CL.h('div.fg-grid-2', null, gxField.el, gyField.el),
              CL.h('div.fg-grid-2', null, gwField.el, gRotField.el),
              scaleSlider,
              gRotSlider,
              CL.h('div.fg-row', { style: { marginTop: '4px' } },
                isImg ? CL.h('button.btn.btn-primary', {
                  style: { flex: 1, height: '40px', fontSize: '13.5px', borderRadius: '10px' },
                  text: isVi ? 'AI Xóa nền' : 'AI Remove BG',
                  onclick: async () => {
                    try {
                      curGraphic.image.src = await CL.removeWhiteBackground(curGraphic.image.src, 236, 20);
                      pushHistory();
                      render2DCanvas();
                    } catch (err) {}
                  },
                }) : null,
                CL.h('button.btn.btn-outline', {
                  style: { color: 'var(--danger)', height: '40px', fontSize: '13.5px', borderRadius: '10px', flex: isImg ? '0 0 auto' : '1' },
                  html: CL.icon('trash') + `<span>${isVi ? 'Xóa' : 'Remove'}</span>`,
                  onclick: () => {
                    design.layers = design.layers.filter((x) => x.id !== curGraphic.id);
                    selectedLayerId = null;
                    pushHistory();
                    render2DCanvas();
                    renderStepPanel();
                  },
                })
              )
            );
          }

          const shapesList = [
            { k: 'circle', icon: '◯' },
            { k: 'star', icon: '✦' },
            { k: 'heart', icon: '♡' },
            { k: 'diamond', icon: '◇' },
          ];
          const shapesGrid = CL.h('div.studio-accent-grid', null,
            shapesList.map(({ k, icon }) =>
              CL.h('button.studio-accent-btn', {
                type: 'button',
                onclick: () => {
                  const newShape = {
                    id: CL.uid('ly_shp'),
                    type: 'shape',
                    name: k,
                    part: targetPart,
                    x: 0.5,
                    y: 0.5,
                    rotation: 0,
                    opacity: 1,
                    visible: true,
                    locked: false,
                    shape: {
                      kind: k,
                      w: 24,
                      h: 24,
                      fill: k === 'circle' ? 'none' : '#ffffff',
                      stroke: k === 'circle' ? '#ffffff' : null,
                      strokeWidth: k === 'circle' ? 1.5 : 0,
                    },
                  };
                  design.layers.push(newShape);
                  selectedLayerId = newShape.id;
                  pushHistory();
                  render2DCanvas();
                  renderStepPanel();
                },
              },
                CL.h('span.accent-symbol', { text: icon })
              )
            )
          );

          const marksSection = CL.h('div.fg-section', null,
            CL.h('div.fg-section-head', null,
              CL.h('span.fg-section-title', { text: isVi ? 'Biểu tượng nhanh' : 'Minimal Marks' })
            ),
            shapesGrid
          );

          stepBody.append(uploadSection);
          if (graphicSection) stepBody.append(graphicSection);
          stepBody.append(marksSection);
        }

        function refreshAll() {
          syncPartChips();
          render2DCanvas();
          renderStepPanel();
        }

        refreshAll();
        updateUndoRedoUI();

        // Figma Workspace Keyboard Shortcuts (Undo/Redo, Zoom +/-/0, Space Pan, Arrow Nudge)
        let nudgePending = false;
        const onKeyDown = (e) => {
          const ae = document.activeElement;
          const isEditingInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(ae?.tagName) || !!ae?.isContentEditable;

          // Let text fields keep their native undo/redo while typing
          const isTextUndo = (e.ctrlKey || e.metaKey) && ['z', 'y'].includes(e.key.toLowerCase());
          if (isEditingInput && isTextUndo) return;

          if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
            if (e.shiftKey) redo(); else undo();
            e.preventDefault();
            return;
          }
          if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
            redo();
            e.preventDefault();
            return;
          }
          if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '+')) {
            setZoom(zoomLevel * 1.2, { smooth: true });
            e.preventDefault();
            return;
          }
          if ((e.ctrlKey || e.metaKey) && e.key === '-') {
            setZoom(zoomLevel / 1.2, { smooth: true });
            e.preventDefault();
            return;
          }
          if ((e.ctrlKey || e.metaKey) && e.key === '0') {
            resetView();
            e.preventDefault();
            return;
          }

          if (isEditingInput) return;

          if (e.code === 'Space' && !isSpaceDown) {
            isSpaceDown = true;
            canvasContainer.style.cursor = 'grab';
            e.preventDefault();
            return;
          }

          // Arrow nudge active layer
          if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            const lyr = getActiveTargetLayer();
            if (lyr && !lyr.locked) {
              const step = e.shiftKey ? 0.04 : 0.01;
              const layout = CL.models.layout(design.model);
              const safe = layout[lyr.part]?.safe || { minX: 0.16, maxX: 0.84, minY: 0.14, maxY: 0.86 };
              if (e.key === 'ArrowLeft') lyr.x = CL.clamp((lyr.x ?? 0.5) - step, safe.minX, safe.maxX);
              if (e.key === 'ArrowRight') lyr.x = CL.clamp((lyr.x ?? 0.5) + step, safe.minX, safe.maxX);
              if (e.key === 'ArrowUp') lyr.y = CL.clamp((lyr.y ?? 0.5) - step, safe.minY, safe.maxY);
              if (e.key === 'ArrowDown') lyr.y = CL.clamp((lyr.y ?? 0.5) + step, safe.minY, safe.maxY);
              e.preventDefault();
              nudgePending = true;
              render2DCanvas();
              const inX = document.getElementById('fgInputX');
              const inY = document.getElementById('fgInputY');
              if (inX) inX.value = String(Math.round(lyr.x * 100));
              if (inY) inY.value = String(Math.round(lyr.y * 100));
            }
          }
        };

        const onKeyUp = (e) => {
          // Commit arrow-key nudges as one undo step (and persist the draft) once the key is released
          if (nudgePending && e.key.startsWith('Arrow')) {
            nudgePending = false;
            pushHistory();
          }
          if (e.code === 'Space') {
            isSpaceDown = false;
            canvasContainer.style.cursor = '';
          }
        };

        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);

        return () => {
          window.removeEventListener('keydown', onKeyDown);
          window.removeEventListener('keyup', onKeyUp);
          if (preview3DInstance) preview3DInstance.dispose();
        };
      },
    };
  }

  CL.pages.editor = createStudioPage(0);
})(window.CL);
