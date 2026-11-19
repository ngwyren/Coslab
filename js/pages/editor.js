/* ==========================================================
   COSLAB — Clean Step-by-Step Lipstick Studio (US App Minimal UI)
   4 Turns: 01 Model -> 02 Color -> 03 Text -> 04 Logo
   - Cap & Body selector only appears after Step 1 (Model).
   - Zero middle ring ("Viền").
   - Strict Safe Zone clamping & visual guide for Text and Logo.
   ========================================================== */
(function (CL) {
  CL.pages = CL.pages || {};

  const STEPS = [
    { id: 'model', num: '01', vi: 'Model', en: 'Model' },
    { id: 'colors', num: '02', vi: 'Màu', en: 'Color' },
    { id: 'text', num: '03', vi: 'Chữ', en: 'Text' },
    { id: 'graphics', num: '04', vi: 'Logo', en: 'Logo' },
  ];

  // Curated minimalist K-Beauty & Packaging color grid (17 swatches + 1 custom color button)
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
        let activeStepIdx = queryStep ? Math.max(0, Math.min(3, parseInt(queryStep, 10) - 1)) : (defaultStep || 0);
        let activeView = '2d';
        let activePart = 'base'; // strictly 'base' | 'cap'
        let selectedLayerId = null;
        let zoomLevel = 1.0;
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
          title: 'Undo',
          onclick: undo,
        });
        const redoBtn = CL.h('button.icon-btn.sm#btnRedo', {
          html: CL.icon('redo'),
          title: 'Redo',
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
              href: '#/',
              html: CL.icon('arrowLeft') + '<span>Atelier</span>',
            }),
            CL.h('div.topbar-sep'),
            CL.h('div.editor-title-wrap', null, titleInput),
            undoBtn,
            redoBtn
          ),
          CL.h('div.editor-topbar-center', null, stepperBar),
          CL.h('div.editor-topbar-right', null,
            viewToggle,
            saveBtn,
            exportBtn
          )
        );

        // --- 2. Split Studio Workspace ---
        const workspace = CL.h('div.studio-workspace');

        // Floating Cap / Body Pill Bar — ONLY visible on Steps 2, 3, 4 (after Model is chosen!)
        const partQuickBar = CL.h('div.canvas-part-Quickbar#partQuickBar', {
          style: { display: activeStepIdx > 0 ? 'flex' : 'none' },
        },
          [
            { id: 'base', vi: 'Thân son', en: 'Body' },
            { id: 'cap', vi: 'Nắp son', en: 'Cap' },
          ].map((p) => {
            const pColor = getPartHex(p.id);
            return CL.h('button.canvas-part-chip' + (p.id === activePart ? '.is-active' : ''), {
              type: 'button',
              'data-part-chip': p.id,
              html: `<span class="part-tab-dot" data-dot="${p.id}" style="background:${pColor}"></span><span>${I18N.lang === 'vi' ? p.vi : p.en}</span>`,
              onclick: () => {
                activePart = p.id;
                syncPartChips();
                render2DCanvas();
                renderStepPanel();
              },
            });
          })
        );

        const canvasContainer = CL.h('div.editor-canvas-container', null,
          partQuickBar,
          CL.h('div.canvas-viewport#canvasViewport', null,
            CL.h('div#canvasSvgHolder')
          ),
          CL.h('div.preview-3d-host#preview3dHost', { style: { display: 'none' } },
            CL.h('div.preview-3d-hud', { html: CL.icon('cube') + '<span> Drag 360°</span>' })
          ),
          CL.h('div.canvas-floating-controls#canvasFloatingControls', null,
            CL.h('button.icon-btn.sm', {
              title: 'Zoom Out',
              html: CL.icon('zoomOut'),
              onclick: () => setZoom(zoomLevel - 0.15),
            }),
            CL.h('span.zoom-level-text#zoomLevelText', { text: '100%' }),
            CL.h('button.icon-btn.sm', {
              title: 'Zoom In',
              html: CL.icon('zoomIn'),
              onclick: () => setZoom(zoomLevel + 0.15),
            }),
            CL.h('button.icon-btn.sm', {
              title: 'Reset',
              html: CL.icon('fit'),
              onclick: () => setZoom(1.0),
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

        function getPartHex(pId) {
          const pData = design.parts[pId];
          if (!pData || !pData.fill) return '#b85c66';
          return pData.fill.type === 'linear' ? (pData.fill.stops[0]?.c || '#b85c66') : (pData.fill.color || '#b85c66');
        }

        function syncPartChips() {
          partQuickBar.style.display = activeStepIdx > 0 && activeView === '2d' ? 'flex' : 'none';
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
              preview3DInstance = new CL.Preview3D(p3d, { autoRotate: false, interactive: true });
            }
            if (preview3DInstance) {
              preview3DInstance.setDesign(design);
            }
          }
        }

        function setZoom(val) {
          zoomLevel = CL.clamp(val, 0.5, 2.2);
          document.getElementById('zoomLevelText').textContent = Math.round(zoomLevel * 100) + '%';
          const vp = document.getElementById('canvasViewport');
          if (vp) vp.style.transform = `scale(${zoomLevel})`;
        }

        function updateUndoRedoUI() {
          undoBtn.disabled = historyIdx <= 0;
          redoBtn.disabled = historyIdx >= history.length - 1;
        }

        // --- Render 2D Interactive Lipstick SVG ---
        function render2DCanvas() {
          const holder = document.getElementById('canvasSvgHolder');
          if (!holder) return;

          // Show dashed Safe Zone guide when on Step 3 (Text) or Step 4 (Logo)
          const showSafeZone = (activeStepIdx === 2 || activeStepIdx === 3) ? activePart : null;

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

          // Clicking directly on Cap or Base selects that part (when past Step 1)
          svgEl.querySelectorAll('[data-part]').forEach((el) => {
            el.addEventListener('click', (e) => {
              if (activeStepIdx === 0) return;
              e.stopPropagation();
              const p = el.getAttribute('data-part');
              if (p === 'cap' || p === 'base') {
                activePart = p;
                syncPartChips();
                render2DCanvas();
                renderStepPanel();
              }
            });
          });

          // Interactive On-Surface Transform Gizmo (Move & Continuous Rotation)
          let targetLayer = null;
          if (selectedLayerId) {
            targetLayer = design.layers.find((l) => l.id === selectedLayerId);
          }
          if (!targetLayer) {
            if (activeStepIdx === 2) {
              targetLayer = design.layers.find((l) => l.type === 'text' && l.part === activePart);
            } else if (activeStepIdx === 3) {
              targetLayer = design.layers.find((l) => (l.type === 'image' || l.type === 'shape') && l.part === activePart);
            }
          }

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

              const padX = 8, padY = 5;
              const boxW = Math.round(bW + padX * 2);
              const boxH = Math.round(bH + padY * 2);
              const stemLen = 22;
              const handleY = -boxH / 2 - stemLen;

              const gizmoG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
              gizmoG.setAttribute('class', 'cl-transform-gizmo');
              gizmoG.setAttribute('data-gizmo-layer', targetLayer.id);
              gizmoG.setAttribute('transform', `translate(${CL.round(cx, 2)} ${CL.round(cy, 2)}) rotate(${CL.round(rot, 2)})`);

              gizmoG.innerHTML = `
                <rect class="gizmo-hit" x="${-boxW/2}" y="${-boxH/2}" width="${boxW}" height="${boxH}" fill="rgba(255,255,255,0.01)"/>
                <rect class="gizmo-box-dark" x="${-boxW/2}" y="${-boxH/2}" width="${boxW}" height="${boxH}" rx="3" fill="none"/>
                <rect class="gizmo-box-light" x="${-boxW/2}" y="${-boxH/2}" width="${boxW}" height="${boxH}" rx="3" fill="none"/>
                <line class="gizmo-stem-dark" x1="0" y1="${-boxH/2}" x2="0" y2="${handleY}"/>
                <line class="gizmo-stem-light" x1="0" y1="${-boxH/2}" x2="0" y2="${handleY}"/>
                <rect class="gizmo-corner" x="${-boxW/2 - 3}" y="${-boxH/2 - 3}" width="6" height="6" rx="1"/>
                <rect class="gizmo-corner" x="${boxW/2 - 3}" y="${-boxH/2 - 3}" width="6" height="6" rx="1"/>
                <rect class="gizmo-corner" x="${-boxW/2 - 3}" y="${boxH/2 - 3}" width="6" height="6" rx="1"/>
                <rect class="gizmo-corner" x="${boxW/2 - 3}" y="${boxH/2 - 3}" width="6" height="6" rx="1"/>
                <g class="gizmo-rot-handle" transform="translate(0 ${handleY})">
                  <circle class="gizmo-rot-hit" r="14" fill="transparent"/>
                  <circle class="gizmo-rot-bg" r="8"/>
                  <path d="M -3 -1.2 A 3.6 3.6 0 1 1 -1 3.2 M -4.6 -2.6 L -3.2 -1 L -1.6 -2.4" fill="none" stroke="#171615" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
                  <g class="gizmo-angle-badge" style="display: none;" transform="translate(0 -16)">
                    <rect x="-18" y="-9" width="36" height="18" rx="4"/>
                    <text x="0" y="1">${Math.round(rot)}°</text>
                  </g>
                </g>
              `;

              svgEl.appendChild(gizmoG);

              // 1. Drag to Move (hit rect + layer DOM)
              const bindMove = (hitEl) => {
                hitEl.addEventListener('pointerdown', (e) => {
                  if (targetLayer.locked) return;
                  e.stopPropagation();
                  e.preventDefault();
                  selectedLayerId = targetLayer.id;
                  activePart = targetLayer.part;

                  const startX = e.clientX, startY = e.clientY;
                  const origX = targetLayer.x ?? 0.5, origY = targetLayer.y ?? 0.5;

                  const onMove = (ev) => {
                    const dx = (ev.clientX - startX) / (zoomLevel * (svgEl.clientWidth / 440));
                    const dy = (ev.clientY - startY) / (zoomLevel * (svgEl.clientHeight / 600));
                    targetLayer.x = CL.clamp(origX + dx / partRect.w, safe.minX, safe.maxX);
                    targetLayer.y = CL.clamp(origY + dy / partRect.h, safe.minY, safe.maxY);

                    const liveCx = partRect.x + targetLayer.x * partRect.w;
                    const liveCy = partRect.y + targetLayer.y * partRect.h;
                    const liveRot = targetLayer.rotation || 0;

                    gizmoG.setAttribute('transform', `translate(${CL.round(liveCx, 2)} ${CL.round(liveCy, 2)}) rotate(${CL.round(liveRot, 2)})`);
                    if (domLyr) {
                      domLyr.setAttribute('transform', `translate(${CL.round(liveCx, 2)} ${CL.round(liveCy, 2)}) rotate(${CL.round(liveRot, 2)})`);
                    }
                  };

                  const onUp = () => {
                    window.removeEventListener('pointermove', onMove);
                    window.removeEventListener('pointerup', onUp);
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
              const angleBadge = gizmoG.querySelector('.gizmo-angle-badge');
              const angleText = angleBadge?.querySelector('text');

              if (rotHandle) {
                rotHandle.addEventListener('pointerdown', (e) => {
                  if (targetLayer.locked) return;
                  e.stopPropagation();
                  e.preventDefault();
                  selectedLayerId = targetLayer.id;

                  if (angleBadge) angleBadge.style.display = 'block';
                  rotHandle.style.cursor = 'grabbing';
                  document.body.style.cursor = 'grabbing';

                  const svgRect = svgEl.getBoundingClientRect();
                  const curCenterCx = partRect.x + (targetLayer.x ?? 0.5) * partRect.w;
                  const curCenterCy = partRect.y + (targetLayer.y ?? 0.5) * partRect.h;
                  const screenCx = svgRect.left + (curCenterCx / 440) * svgRect.width;
                  const screenCy = svgRect.top + (curCenterCy / 600) * svgRect.height;

                  const onRotMove = (ev) => {
                    const dx = ev.clientX - screenCx;
                    const dy = ev.clientY - screenCy;
                    let deg = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
                    deg = ((deg % 360) + 540) % 360 - 180;

                    const snapAngles = [0, 45, 90, -90, 180, -180, -45, 135, -135];
                    for (const snap of snapAngles) {
                      if (Math.abs(deg - snap) < (ev.shiftKey ? 8 : 4)) {
                        deg = snap;
                        break;
                      }
                    }
                    const rounded = Math.round(deg);
                    targetLayer.rotation = rounded;

                    gizmoG.setAttribute('transform', `translate(${CL.round(curCenterCx, 2)} ${CL.round(curCenterCy, 2)}) rotate(${rounded})`);
                    if (domLyr) {
                      domLyr.setAttribute('transform', `translate(${CL.round(curCenterCx, 2)} ${CL.round(curCenterCy, 2)}) rotate(${rounded})`);
                    }

                    if (angleText) angleText.textContent = `${rounded}°`;

                    const rotSlider = document.getElementById('studioLayerRotSlider');
                    const rotBadge = document.getElementById('studioLayerRotBadge');
                    if (rotSlider) rotSlider.value = rounded;
                    if (rotBadge) rotBadge.textContent = `${rounded}°`;

                    document.querySelectorAll('.studio-rot-preset-btn').forEach((btn) => {
                      const pDeg = parseInt(btn.dataset.presetDeg, 10);
                      btn.classList.toggle('is-active', pDeg === rounded);
                    });
                  };

                  const onRotUp = () => {
                    window.removeEventListener('pointermove', onRotMove);
                    window.removeEventListener('pointerup', onRotUp);
                    if (angleBadge) angleBadge.style.display = 'none';
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
            }
          }

          // Clicking on any other layer selects that layer
          svgEl.querySelectorAll('[data-layer]').forEach((el) => {
            el.addEventListener('click', (e) => {
              const lid = el.getAttribute('data-layer');
              if (lid && lid !== selectedLayerId) {
                e.stopPropagation();
                selectedLayerId = lid;
                const lyr = design.layers.find((l) => l.id === lid);
                if (lyr) {
                  activePart = lyr.part;
                  syncPartChips();
                  const targetStep = lyr.type === 'text' ? 2 : 3;
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

        // --- Render Clean Guided Step Panel ---
        function renderStepPanel() {
          const step = STEPS[activeStepIdx];
          const isVi = I18N.lang === 'vi';

          const TITLES = {
            model: isVi ? 'Chọn Model' : 'Choose Model',
            colors: isVi ? 'Chọn Màu' : 'Choose Color',
            text: isVi ? 'Chọn Chữ' : 'Custom Text',
            graphics: isVi ? 'Chọn Logo' : 'Add Logo',
          };

          stepHeader.innerHTML = '';
          stepHeader.append(
            CL.h('span.studio-step-eyebrow', { text: `STEP ${step.num} / 04` }),
            CL.h('h2.studio-step-title', { text: TITLES[step.id] })
          );

          stepBody.innerHTML = '';
          if (step.id === 'model') buildModelStep();
          else if (step.id === 'colors') buildColorStep();
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
        // STEP 01: MODEL (CLEAN, PURE 5 SILHOUETTES)
        // ======================================================
        function buildModelStep() {
          const modelGrid = CL.h('div.studio-model-grid', null,
            CL.models.MODELS.map((m) => {
              const active = m.id === design.model;
              const previewDsn = CL.clone(design);
              previewDsn.model = m.id;
              return CL.h('button.studio-model-card' + (active ? '.is-active' : ''), {
                type: 'button',
                onclick: () => {
                  design.model = m.id;
                  pushHistory();
                  render2DCanvas();
                  renderStepPanel();
                },
              },
                CL.h('div.studio-model-thumb', {
                  html: CL.render.renderSVG(previewDsn, { width: 72, height: 102, shadow: false }),
                }),
                CL.h('div.studio-model-meta', null,
                  CL.h('strong', { text: t(m.nameKey) }),
                  CL.h('span', { text: t(m.descKey) })
                )
              );
            })
          );
          stepBody.append(modelGrid);
        }

        // ======================================================
        // STEP 02: COLOR (SUPER SIMPLE: FINISH + 1 CLEAN PALETTE)
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

          // 2. Clean 1-Grid Color Palette + Native Custom Color Circle
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
            CL.h('div.sidebar-section-title', { text: isVi ? 'Chất liệu' : 'Finish' }),
            finishRow,
            CL.h('div.sidebar-section-title', { text: isVi ? 'Bảng màu' : 'Color', style: { marginTop: '14px' } }),
            colorGrid
          );
        }

        // ======================================================
        // STEP 03: TEXT (DIRECT INPUT INSIDE SAFE ZONE)
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
                  size: 12,
                  weight: 600,
                  italic: false,
                  color: '#ffffff',
                  spacing: 4,
                  align: 'center',
                  lineHeight: 1.2,
                },
              };
              design.layers.push(curLayer);
              selectedLayerId = curLayer.id;
            }
            return curLayer;
          }

          const textInput = CL.h('input.input.studio-text-input', {
            value: curLayer ? curLayer.text.content : '',
            placeholder: isVi ? 'Nhập chữ (VD: COSLAB)...' : 'Type text (e.g. COSLAB)...',
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

          // Rotation & Orientation Controls (Continuous Slider + Quick Presets)
          const curRot = curLayer ? (curLayer.rotation || 0) : (targetPart === 'base' ? -90 : 0);
          const rotBadge = CL.h('span.studio-rot-badge#studioLayerRotBadge', { text: `${curRot}°` });

          const rotSlider = CL.h('input.range#studioLayerRotSlider', {
            type: 'range',
            min: '-180',
            max: '180',
            step: '1',
            value: curRot,
            oninput: () => {
              const lyr = ensureTextLayer(textInput.value || 'COSLAB');
              const val = parseInt(rotSlider.value, 10);
              lyr.rotation = val;
              rotBadge.textContent = `${val}°`;
              rotPresets.querySelectorAll('.studio-rot-preset-btn').forEach((btn) => {
                btn.classList.toggle('is-active', parseInt(btn.dataset.presetDeg, 10) === val);
              });
              render2DCanvas();
            },
            onchange: pushHistory,
          });

          const PRESETS = [
            { deg: 0, labelVi: '0° Ngang', labelEn: '0° Horiz' },
            { deg: -90, labelVi: '-90° Dọc', labelEn: '-90° Vert' },
            { deg: 90, labelVi: '90° Dọc', labelEn: '90° Vert' },
            { deg: 180, labelVi: '180° Đảo', labelEn: '180° Flip' },
          ];

          const rotPresets = CL.h('div.studio-rot-presets', null,
            PRESETS.map((p) =>
              CL.h('button.studio-rot-preset-btn' + (curRot === p.deg ? '.is-active' : ''), {
                type: 'button',
                'data-preset-deg': p.deg,
                text: isVi ? p.labelVi : p.labelEn,
                onclick: (e) => {
                  const lyr = ensureTextLayer(textInput.value || 'COSLAB');
                  lyr.rotation = p.deg;
                  rotSlider.value = p.deg;
                  rotBadge.textContent = `${p.deg}°`;
                  rotPresets.querySelectorAll('.studio-rot-preset-btn').forEach((b) => b.classList.remove('is-active'));
                  e.currentTarget.classList.add('is-active');
                  pushHistory();
                  render2DCanvas();
                },
              })
            )
          );

          const resetPosBtn = CL.h('button.studio-reset-btn', {
            type: 'button',
            html: CL.icon('fit') + `<span>${isVi ? 'Đặt lại giữa mặt son' : 'Reset to Center'}</span>`,
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

          const FONTS = [
            { f: 'Plus Jakarta Sans', label: 'Sans' },
            { f: 'Cinzel', label: 'Cinzel' },
            { f: 'Playfair Display', label: 'Playfair' },
            { f: 'Cormorant Garamond', label: 'Classic' },
            { f: 'Montserrat', label: 'Geo' },
            { f: 'Italiana', label: 'Italiana' },
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
                CL.h('span.font-name', { text: item.label })
              )
            )
          );

          const curSize = curLayer ? curLayer.text.size : 12;
          const sizeValLabel = CL.h('span.mono', { text: `${curSize}px` });
          const sizeSlider = CL.h('input.range', {
            type: 'range', min: '8', max: '24', step: '1', value: curSize,
            oninput: () => {
              const lyr = ensureTextLayer(textInput.value || 'COSLAB');
              lyr.text.size = parseInt(sizeSlider.value, 10);
              sizeValLabel.textContent = `${lyr.text.size}px`;
              render2DCanvas();
            },
            onchange: pushHistory,
          });

          const TEXT_COLORS = ['#ffffff', '#171615', '#c5a367', '#e5d5c5', '#d9d9d9', '#f2c6c2'];
          const curTxtColor = (curLayer ? curLayer.text.color : '#ffffff').toLowerCase();
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

          stepBody.append(
            CL.h('div.sidebar-section-title', { text: isVi ? 'Nội dung (Safe Zone)' : 'Text (Safe Zone)' }),
            textInput,
            CL.h('div.sidebar-section-title', { text: isVi ? 'Xoay & Hướng chữ' : 'Rotation & Orientation', style: { marginTop: '12px' } },
              rotBadge
            ),
            rotPresets,
            CL.h('div.studio-rot-slider-wrap', null, rotSlider),
            resetPosBtn,
            CL.h('div.sidebar-section-title', { text: 'Font', style: { marginTop: '12px' } }),
            fontGrid,
            CL.h('div.sidebar-section-title', { style: { marginTop: '12px' } },
              CL.h('span', { text: isVi ? 'Cỡ chữ' : 'Size' }),
              sizeValLabel
            ),
            sizeSlider,
            CL.h('div.sidebar-section-title', { text: isVi ? 'Màu chữ' : 'Color', style: { marginTop: '12px' } }),
            txtColorRow
          );
        }

        // ======================================================
        // STEP 04: LOGO (CLEAN UPLOAD + SAFE ZONE)
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
            CL.h('strong', { text: isVi ? 'Tải ảnh Logo' : 'Upload Logo' }),
            CL.h('span', { text: 'PNG, SVG, JPG' })
          );

          const curGraphic = design.layers.find((l) => l.part === targetPart && (l.type === 'image' || l.type === 'shape'))
            || design.layers.find((l) => l.type === 'image' || l.type === 'shape');

          let graphicControls = null;
          if (curGraphic) {
            selectedLayerId = curGraphic.id;
            const isImg = curGraphic.type === 'image';
            const curScale = isImg ? Math.round(curGraphic.image.w) : Math.round(curGraphic.shape.w);
            const scaleValLabel = CL.h('span.mono', { text: `${curScale}px` });

            const scaleSlider = CL.h('input.range', {
              type: 'range', min: '14', max: '90', step: '2', value: curScale,
              oninput: () => {
                const v = parseInt(scaleSlider.value, 10);
                scaleValLabel.textContent = `${v}px`;
                if (isImg) {
                  const ratio = (curGraphic.image.h || v) / (curGraphic.image.w || v);
                  curGraphic.image.w = v;
                  curGraphic.image.h = Math.round(v * ratio);
                } else {
                  curGraphic.shape.w = v;
                  if (curGraphic.shape.kind !== 'line') curGraphic.shape.h = v;
                }
                render2DCanvas();
              },
              onchange: pushHistory,
            });

            graphicControls = CL.h('div.studio-active-graphic-card', null,
              CL.h('div.sidebar-section-title', null,
                CL.h('span', { text: curGraphic.name }),
                scaleValLabel
              ),
              scaleSlider,
              CL.h('div.sidebar-section-title', { text: isVi ? 'Xoay góc' : 'Rotation', style: { marginTop: '10px' } },
                CL.h('span.studio-rot-badge#studioLayerRotBadge', { text: `${curGraphic.rotation || 0}°` })
              ),
              CL.h('div.studio-rot-slider-wrap', null,
                CL.h('input.range#studioLayerRotSlider', {
                  type: 'range', min: '-180', max: '180', step: '1', value: curGraphic.rotation || 0,
                  oninput: (e) => {
                    const val = parseInt(e.target.value, 10);
                    curGraphic.rotation = val;
                    const b = document.getElementById('studioLayerRotBadge');
                    if (b) b.textContent = `${val}°`;
                    render2DCanvas();
                  },
                  onchange: pushHistory,
                })
              ),
              CL.h('div', { style: { display: 'flex', gap: '8px', marginTop: '10px' } },
                isImg ? CL.h('button.btn.btn-sm.btn-primary', {
                  style: { flex: 1 },
                  text: isVi ? 'AI Xóa nền' : 'AI Remove BG',
                  onclick: async () => {
                    try {
                      curGraphic.image.src = await CL.removeWhiteBackground(curGraphic.image.src, 236, 20);
                      pushHistory();
                      render2DCanvas();
                    } catch (err) {}
                  },
                }) : null,
                CL.h('button.btn.btn-sm.btn-outline', {
                  style: { color: 'var(--danger)' },
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
          const shapesGrid = CL.h('div.studio-accent-grid', { style: { gridTemplateColumns: 'repeat(4, 1fr)' } },
            shapesList.map(({ k, icon }) =>
              CL.h('button.studio-accent-btn', {
                type: 'button',
                style: { justifyContent: 'center' },
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

          stepBody.append(
            uploadBox,
            graphicControls,
            CL.h('div.sidebar-section-title', { text: isVi ? 'Biểu tượng nhanh' : 'Minimal Marks', style: { marginTop: '12px' } }),
            shapesGrid,
            fileIn
          );
        }

        function refreshAll() {
          syncPartChips();
          render2DCanvas();
          renderStepPanel();
        }

        refreshAll();
        updateUndoRedoUI();

        const onKey = (e) => {
          if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
            if (e.shiftKey) redo(); else undo();
            e.preventDefault();
          } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
            redo();
            e.preventDefault();
          }
        };
        window.addEventListener('keydown', onKey);

        return () => {
          window.removeEventListener('keydown', onKey);
          if (preview3DInstance) preview3DInstance.dispose();
        };
      },
    };
  }

  CL.pages.design = createStudioPage(0);
  CL.pages.editor = createStudioPage(0);
})(window.CL);
