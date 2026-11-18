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

          // Dragging text / logo strictly clamped inside Safe Zone
          svgEl.querySelectorAll('[data-layer]').forEach((el) => {
            el.addEventListener('pointerdown', (e) => {
              const lid = el.getAttribute('data-layer');
              const lyr = design.layers.find((l) => l.id === lid);
              if (!lyr || lyr.locked) return;

              e.stopPropagation();
              selectedLayerId = lid;
              activePart = lyr.part === 'cap' ? 'cap' : 'base';

              const targetStep = lyr.type === 'text' ? 2 : 3;
              if (activeStepIdx !== targetStep) {
                goToStep(targetStep);
              } else {
                syncPartChips();
                renderStepPanel();
              }

              const layout = CL.models.layout(design.model);
              const rect = layout[lyr.part];
              const safe = rect.safe;
              const startX = e.clientX, startY = e.clientY;
              const origX = lyr.x, origY = lyr.y;

              const onMove = (ev) => {
                const dx = (ev.clientX - startX) / (zoomLevel * (svgEl.clientWidth / 440));
                const dy = (ev.clientY - startY) / (zoomLevel * (svgEl.clientHeight / 600));
                lyr.x = CL.clamp(origX + dx / rect.w, safe.minX, safe.maxX);
                lyr.y = CL.clamp(origY + dy / rect.h, safe.minY, safe.maxY);
                render2DCanvas();
              };

              const onUp = () => {
                window.removeEventListener('pointermove', onMove);
                window.removeEventListener('pointerup', onUp);
                pushHistory();
              };

              window.addEventListener('pointermove', onMove);
              window.addEventListener('pointerup', onUp);
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

          const isVertical = curLayer ? Math.abs(curLayer.rotation || 0) === 90 : (targetPart === 'base');
          const orientRow = CL.h('div.part-selector-segmented', { style: { gridTemplateColumns: '1fr 1fr' } },
            CL.h('button.part-tab-btn' + (isVertical ? '.is-active' : ''), {
              type: 'button',
              text: isVi ? 'Dọc' : 'Vertical',
              onclick: () => {
                const lyr = ensureTextLayer(textInput.value || 'COSLAB');
                lyr.rotation = -90;
                pushHistory();
                render2DCanvas();
                renderStepPanel();
              },
            }),
            CL.h('button.part-tab-btn' + (!isVertical ? '.is-active' : ''), {
              type: 'button',
              text: isVi ? 'Ngang' : 'Horizontal',
              onclick: () => {
                const lyr = ensureTextLayer(textInput.value || 'COSLAB');
                lyr.rotation = 0;
                pushHistory();
                render2DCanvas();
                renderStepPanel();
              },
            })
          );

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
            orientRow,
            CL.h('div.sidebar-section-title', { text: 'Font', style: { marginTop: '10px' } }),
            fontGrid,
            CL.h('div.sidebar-section-title', { style: { marginTop: '10px' } },
              CL.h('span', { text: isVi ? 'Cỡ chữ' : 'Size' }),
              sizeValLabel
            ),
            sizeSlider,
            CL.h('div.sidebar-section-title', { text: isVi ? 'Màu chữ' : 'Color', style: { marginTop: '10px' } }),
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
              CL.h('div', { style: { display: 'flex', gap: '8px', marginTop: '4px' } },
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
