/* ==========================================================
   COSLAB — Step-by-Step Lipstick Design Studio (US App Clean UI)
   Guided 4-Step Flow: 01 Model -> 02 Color -> 03 Text -> 04 Logo
   Spacious interactive 2D/3D stage + clean step-by-step control card.
   ========================================================== */
(function (CL) {
  CL.pages = CL.pages || {};

  const STEPS = [
    { id: 'model', num: '01', vi: 'Chọn Model', en: 'Model' },
    { id: 'colors', num: '02', vi: 'Chọn Màu', en: 'Color' },
    { id: 'text', num: '03', vi: 'Chọn Chữ', en: 'Text' },
    { id: 'graphics', num: '04', vi: 'Chọn Logo', en: 'Logo' },
  ];

  function stepLabel(s) {
    return I18N.lang === 'vi' ? s.vi : (t('editor.tabs.' + s.id) || s.en);
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
        let activePart = 'base'; // 'base' | 'cap' | 'ring'
        let selectedLayerId = null;
        let zoomLevel = 1.0;
        let preview3DInstance = null;

        const root = CL.h('div.editor-layout');

        // --- 1. Clean US-App Topbar ---
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

        // Center 4-Step Progress Bar
        const stepperBar = CL.h('nav.studio-stepper', { 'aria-label': 'Design Steps' },
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
            html: '<span>3D 360°</span>',
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

        // --- 2. Split Studio Workspace (Stage Left + Guided Step Card Right) ---
        const workspace = CL.h('div.studio-workspace');

        // Left: Interactive Liptint Stage
        const canvasContainer = CL.h('div.editor-canvas-container', null,
          CL.h('div.canvas-part-Quickbar', null,
            ['base', 'cap', 'ring'].map((pId) =>
              CL.h('button.canvas-part-chip' + (pId === activePart ? '.is-active' : ''), {
                type: 'button',
                'data-part-chip': pId,
                text: t('editor.partsShort.' + pId) || pId,
                onclick: () => {
                  activePart = pId;
                  syncPartChips();
                  if (activeStepIdx === 1 || activeStepIdx === 2 || activeStepIdx === 3) renderStepPanel();
                },
              })
            )
          ),
          CL.h('div.canvas-viewport#canvasViewport', null,
            CL.h('div#canvasSvgHolder')
          ),
          CL.h('div.preview-3d-host#preview3dHost', { style: { display: 'none' } },
            CL.h('div.preview-3d-hud', { html: CL.icon('cube') + '<span> Drag 360° · Scroll to zoom</span>' })
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
              title: 'Reset View',
              html: CL.icon('fit'),
              onclick: () => setZoom(1.0),
            })
          )
        );

        // Right: Guided Step-by-Step Panel
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

        function syncPartChips() {
          canvasContainer.querySelectorAll('.canvas-part-chip').forEach((btn) => {
            btn.classList.toggle('is-active', btn.dataset.partChip === activePart);
          });
        }

        function goToStep(idx) {
          activeStepIdx = CL.clamp(idx, 0, STEPS.length - 1);
          stepperBar.querySelectorAll('.studio-step-pill').forEach((b, i) => {
            b.classList.toggle('is-active', i === activeStepIdx);
            b.classList.toggle('is-done', i < activeStepIdx);
          });
          renderStepPanel();
        }

        function switchView(view) {
          activeView = view;
          document.getElementById('btnView2D').classList.toggle('is-active', view === '2d');
          document.getElementById('btnView3D').classList.toggle('is-active', view === '3d');
          document.getElementById('canvasFloatingControls').style.display = view === '2d' ? 'flex' : 'none';
          document.getElementById('canvasViewport').style.display = view === '2d' ? 'block' : 'none';

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

          const svg = CL.render.renderSVG(design, {
            interactive: true,
            width: 440,
            height: 600,
            shading: true,
            shadow: true,
          });

          holder.innerHTML = svg;
          const svgEl = holder.querySelector('svg');
          svgEl.classList.add('canvas-svg-root');

          svgEl.querySelectorAll('[data-part]').forEach((el) => {
            el.addEventListener('click', (e) => {
              e.stopPropagation();
              const p = el.getAttribute('data-part');
              activePart = p;
              syncPartChips();
              if (activeStepIdx === 1) renderStepPanel();
            });
          });

          svgEl.querySelectorAll('[data-layer]').forEach((el) => {
            el.addEventListener('pointerdown', (e) => {
              const lid = el.getAttribute('data-layer');
              const lyr = design.layers.find((l) => l.id === lid);
              if (!lyr || lyr.locked) return;

              e.stopPropagation();
              selectedLayerId = lid;
              activePart = lyr.part || 'base';
              syncPartChips();

              const targetStep = lyr.type === 'text' ? 2 : 3;
              if (activeStepIdx !== targetStep) {
                goToStep(targetStep);
              } else {
                renderStepPanel();
              }

              const layout = CL.models.layout(design.model);
              const rect = layout[lyr.part];
              const startX = e.clientX, startY = e.clientY;
              const origX = lyr.x, origY = lyr.y;

              const onMove = (ev) => {
                const dx = (ev.clientX - startX) / (zoomLevel * (svgEl.clientWidth / 440));
                const dy = (ev.clientY - startY) / (zoomLevel * (svgEl.clientHeight / 600));
                lyr.x = CL.clamp(origX + dx / rect.w, -0.1, 1.1);
                lyr.y = CL.clamp(origY + dy / rect.h, -0.1, 1.1);
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

        // --- Render Guided Step Panel ---
        function renderStepPanel() {
          const step = STEPS[activeStepIdx];
          const isVi = I18N.lang === 'vi';

          const TITLES = {
            model: isVi ? 'Chọn Dáng Vỏ Son' : 'Choose Silhouette',
            colors: isVi ? 'Chọn Màu & Chất Liệu' : 'Color & Finish',
            text: isVi ? 'Khắc Chữ Lên Son' : 'Custom Typography',
            graphics: isVi ? 'Logo & Họa Tiết' : 'Logo & Accents',
          };
          const SUBS = {
            model: isVi ? 'Bước 1/4 · Chọn phom dáng và tone khởi đầu' : 'Step 1 of 4 · Select form & starter preset',
            colors: isVi ? 'Bước 2/4 · Phối màu Thân, Nắp và Viền son' : 'Step 2 of 4 · Customize Body, Cap & Ring',
            text: isVi ? 'Bước 3/4 · Nhập tên thương hiệu và chọn font' : 'Step 3 of 4 · Type brand name & pick font',
            graphics: isVi ? 'Bước 4/4 · Tải logo hoặc thêm biểu tượng' : 'Step 4 of 4 · Upload logo or add minimal mark',
          };

          stepHeader.innerHTML = '';
          stepHeader.append(
            CL.h('span.studio-step-eyebrow', { text: SUBS[step.id] }),
            CL.h('h2.studio-step-title', { text: TITLES[step.id] })
          );

          stepBody.innerHTML = '';
          if (step.id === 'model') buildModelStep();
          else if (step.id === 'colors') buildColorStep();
          else if (step.id === 'text') buildTextStep();
          else if (step.id === 'graphics') buildLogoStep();

          // Footer Navigation (Back / Next Step)
          stepFooter.innerHTML = '';
          const backBtn = activeStepIdx > 0
            ? CL.h('button.btn.btn-outline', {
                html: CL.icon('arrowLeft') + `<span>${isVi ? 'Quay lại' : 'Back'}</span>`,
                onclick: () => goToStep(activeStepIdx - 1),
              })
            : CL.h('a.btn.btn-outline', {
                href: '#/',
                html: `<span>${isVi ? 'Trang chủ' : 'Atelier'}</span>`,
              });

          let nextBtn;
          if (activeStepIdx < STEPS.length - 1) {
            const nextStep = STEPS[activeStepIdx + 1];
            nextBtn = CL.h('button.btn.btn-primary.studio-next-btn', {
              html: `<span>${isVi ? 'Tiếp: ' + nextStep.vi : 'Next: ' + nextStep.en}</span>` + CL.icon('arrowRight'),
              onclick: () => goToStep(activeStepIdx + 1),
            });
          } else {
            nextBtn = CL.h('button.btn.btn-primary.studio-next-btn', {
              html: CL.icon('download') + `<span>${isVi ? 'Hoàn tất & Xuất file' : 'Finish & Export'}</span>`,
              onclick: (e) => {
                CL.store.saveDesign(design);
                CL.menu(e.currentTarget, CL.exportMenuItems(() => design), { align: 'end' });
              },
            });
          }

          stepFooter.append(backBtn, nextBtn);
        }

        // ======================================================
        // STEP 01: CHOOSE MODEL & STARTER PRESET
        // ======================================================
        function buildModelStep() {
          const isVi = I18N.lang === 'vi';

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
                  html: CL.render.renderSVG(previewDsn, { width: 76, height: 108, shadow: false }),
                }),
                CL.h('div.studio-model-meta', null,
                  CL.h('strong', { text: t(m.nameKey) }),
                  CL.h('span', { text: t(m.descKey) })
                )
              );
            })
          );

          const presetGrid = CL.h('div.studio-preset-grid', null,
            CL.templates.TEMPLATES.map((tpl) => {
              const capColor = tpl.parts.cap.fill.type === 'linear' ? tpl.parts.cap.fill.stops[0].c : tpl.parts.cap.fill.color;
              const baseColor = tpl.parts.base.fill.type === 'linear' ? tpl.parts.base.fill.stops[0].c : tpl.parts.base.fill.color;
              return CL.h('button.studio-preset-pill', {
                type: 'button',
                onclick: () => {
                  const fresh = CL.templates.createDesign(tpl.templateId, design.model);
                  design.parts = fresh.parts;
                  design.layers = fresh.layers;
                  design.name = t('templates.' + tpl.templateId);
                  titleInput.value = design.name;
                  pushHistory();
                  render2DCanvas();
                  renderStepPanel();
                },
              },
                CL.h('span.preset-dual-dot', {
                  style: { background: `linear-gradient(135deg, ${capColor} 50%, ${baseColor} 50%)` },
                }),
                CL.h('span', { text: t('templates.' + tpl.templateId) })
              );
            })
          );

          stepBody.append(
            CL.h('div.sidebar-section-title', { text: isVi ? '1. Phom dáng thỏi son (5 Models)' : '1. Packaging Silhouette' }),
            modelGrid,
            CL.h('div.sidebar-section-title', { text: isVi ? '2. Phối màu gợi ý nhanh (Presets)' : '2. Quick Style Presets', style: { marginTop: '14px' } }),
            presetGrid
          );
        }

        // ======================================================
        // STEP 02: CHOOSE COLOR & FINISH
        // ======================================================
        function buildColorStep() {
          const isVi = I18N.lang === 'vi';

          const partTabs = CL.h('div.part-selector-segmented', null,
            [
              { id: 'base', fallback: 'Body' },
              { id: 'cap', fallback: 'Cap' },
              { id: 'ring', fallback: 'Ring' },
            ].map((p) => {
              const label = t('editor.partsShort.' + p.id) || p.fallback;
              const pData = design.parts[p.id] || { fill: { type: 'solid', color: '#171615' } };
              const pColor = pData.fill && pData.fill.type === 'linear' ? (pData.fill.stops[0]?.c || '#b85c66') : (pData.fill?.color || '#b85c66');
              return CL.h('button.part-tab-btn' + (p.id === activePart ? '.is-active' : ''), {
                type: 'button',
                html: `<span class="part-tab-dot" style="background: ${pColor};"></span><span>${label}</span>`,
                onclick: () => {
                  activePart = p.id;
                  syncPartChips();
                  renderStepPanel();
                },
              });
            })
          );

          const curPart = design.parts[activePart] || { fill: { type: 'solid', color: '#171615' }, finish: 'matte' };

          const FINISH_LIST = [
            { id: 'matte', icon: '◐', fallback: 'Velvet' },
            { id: 'gloss', icon: '✧', fallback: 'Dewy' },
            { id: 'satin', icon: '◯', fallback: 'Satin' },
            { id: 'metallic', icon: '◈', fallback: 'Chrome' },
          ];
          const finishRow = CL.h('div.finish-grid', null,
            FINISH_LIST.map((f) => {
              const name = t('editor.finishesShort.' + f.id) || f.fallback;
              return CL.h('button.finish-card-btn' + (curPart.finish === f.id ? '.is-active' : ''), {
                type: 'button',
                html: `<span class="finish-icon-badge">${f.icon}</span><span>${name}</span>`,
                onclick: (e) => {
                  curPart.finish = f.id;
                  pushHistory();
                  render2DCanvas();
                  finishRow.querySelectorAll('.finish-card-btn').forEach((b) => b.classList.remove('is-active'));
                  e.currentTarget.classList.add('is-active');
                },
              });
            })
          );

          const activeColor = curPart.fill && curPart.fill.type === 'linear' ? curPart.fill.stops[0].c : (curPart.fill?.color || '#b85c66');
          const picker = CL.ColorPicker({
            value: activeColor,
            onChange: (newHex, final) => {
              curPart.fill = { type: 'solid', color: newHex };
              render2DCanvas();
              const activeDot = partTabs.querySelector('.part-tab-btn.is-active .part-tab-dot');
              if (activeDot) activeDot.style.background = newHex;
              if (final) pushHistory();
            },
          });

          stepBody.append(
            CL.h('div.sidebar-section-title', { text: isVi ? '1. Chọn bộ phận cần đổi màu' : '1. Select Component' }),
            partTabs,
            CL.h('div.sidebar-section-title', { text: isVi ? '2. Bề mặt chất liệu (Finish)' : '2. Surface Finish', style: { marginTop: '12px' } }),
            finishRow,
            CL.h('div.sidebar-section-title', { text: isVi ? '3. Bảng màu K-Beauty' : '3. Color Palette', style: { marginTop: '12px' } }),
            picker
          );
        }

        // ======================================================
        // STEP 03: CHOOSE TEXT (DIRECT & SIMPLE)
        // ======================================================
        function buildTextStep() {
          const isVi = I18N.lang === 'vi';
          const targetPart = activePart === 'cap' ? 'cap' : 'base';

          // Find existing text layer on targetPart, or any text layer
          let curLayer = design.layers.find((l) => l.id === selectedLayerId && l.type === 'text')
            || design.layers.find((l) => l.type === 'text' && l.part === targetPart)
            || design.layers.find((l) => l.type === 'text');

          if (curLayer) {
            selectedLayerId = curLayer.id;
            activePart = curLayer.part;
            syncPartChips();
          }

          function ensureTextLayer(initialText) {
            if (!curLayer) {
              const isBase = activePart !== 'cap';
              curLayer = {
                id: CL.uid('ly_txt'),
                type: 'text',
                name: initialText || 'COSLAB',
                part: isBase ? 'base' : 'cap',
                x: 0.5,
                y: 0.5,
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

          // 1. Part & Orientation Row
          const partSwitch = CL.h('div.part-selector-segmented', { style: { gridTemplateColumns: '1fr 1fr' } },
            [
              { id: 'base', label: isVi ? 'Thân son (Body)' : 'Body' },
              { id: 'cap', label: isVi ? 'Nắp son (Cap)' : 'Cap' },
            ].map((p) =>
              CL.h('button.part-tab-btn' + ((curLayer ? curLayer.part : targetPart) === p.id ? '.is-active' : ''), {
                type: 'button',
                text: p.label,
                onclick: () => {
                  activePart = p.id;
                  syncPartChips();
                  if (curLayer) {
                    curLayer.part = p.id;
                    curLayer.x = 0.5;
                    curLayer.y = 0.5;
                    curLayer.rotation = p.id === 'base' ? -90 : 0;
                    pushHistory();
                    render2DCanvas();
                  }
                  renderStepPanel();
                },
              })
            )
          );

          // 2. Direct Text Input
          const textInput = CL.h('input.input.studio-text-input', {
            value: curLayer ? curLayer.text.content : '',
            placeholder: isVi ? 'Nhập chữ khắc lên son (VD: COSLAB)...' : 'Type text on lipstick (e.g. COSLAB)...',
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

          // 3. Visual Font Picker Grid (6 Luxury Fonts)
          const FONTS = [
            { f: 'Plus Jakarta Sans', label: 'Modern Sans' },
            { f: 'Cinzel', label: 'Roman Luxury' },
            { f: 'Playfair Display', label: 'Editorial Serif' },
            { f: 'Cormorant Garamond', label: 'Classic Atelier' },
            { f: 'Montserrat', label: 'Geometric' },
            { f: 'Italiana', label: 'High Fashion' },
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

          // 4. Orientation & Size Controls
          const isVertical = curLayer ? Math.abs(curLayer.rotation || 0) === 90 : true;
          const orientRow = CL.h('div.part-selector-segmented', { style: { gridTemplateColumns: '1fr 1fr' } },
            CL.h('button.part-tab-btn' + (isVertical ? '.is-active' : ''), {
              type: 'button',
              text: isVi ? '↕ Chữ dọc thân' : '↕ Vertical',
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
              text: isVi ? '↔ Chữ ngang' : '↔ Horizontal',
              onclick: () => {
                const lyr = ensureTextLayer(textInput.value || 'COSLAB');
                lyr.rotation = 0;
                pushHistory();
                render2DCanvas();
                renderStepPanel();
              },
            })
          );

          const curSize = curLayer ? curLayer.text.size : 13;
          const sizeValLabel = CL.h('span.mono', { text: `${curSize}px` });
          const sizeSlider = CL.h('input.range', {
            type: 'range', min: '8', max: '28', step: '1', value: curSize,
            oninput: () => {
              const lyr = ensureTextLayer(textInput.value || 'COSLAB');
              lyr.text.size = parseInt(sizeSlider.value, 10);
              sizeValLabel.textContent = `${lyr.text.size}px`;
              render2DCanvas();
            },
            onchange: pushHistory,
          });

          // 5. Quick Text Color Swatches
          const TEXT_COLORS = [
            { c: '#ffffff', n: 'White' },
            { c: '#171615', n: 'Obsidian' },
            { c: '#c5a367', n: '24K Gold' },
            { c: '#e5d5c5', n: 'Champagne' },
            { c: '#d9d9d9', n: 'Silver' },
            { c: '#f2c6c2', n: 'Soft Pink' },
            { c: '#9e5967', n: 'Mauve' },
          ];
          const curTxtColor = (curLayer ? curLayer.text.color : '#ffffff').toLowerCase();
          const txtColorRow = CL.h('div.studio-quick-swatches', null,
            TEXT_COLORS.map((sw) =>
              CL.h('button.quick-color-dot' + (curTxtColor === sw.c.toLowerCase() ? '.is-active' : ''), {
                type: 'button',
                title: sw.n,
                style: { background: sw.c },
                onclick: () => {
                  const lyr = ensureTextLayer(textInput.value || 'COSLAB');
                  lyr.text.color = sw.c;
                  pushHistory();
                  render2DCanvas();
                  renderStepPanel();
                },
              })
            )
          );

          // Add / Clear Text buttons
          const actionsRow = CL.h('div', { style: { display: 'flex', gap: '8px', marginTop: '4px' } },
            CL.h('button.btn.btn-sm.btn-outline', {
              style: { flex: 1 },
              html: CL.icon('plus') + `<span>${isVi ? 'Thêm dòng chữ mới' : 'Add Another Line'}</span>`,
              onclick: () => {
                curLayer = null;
                const lyr = ensureTextLayer('NEW TEXT');
                lyr.y = 0.35;
                pushHistory();
                render2DCanvas();
                renderStepPanel();
              },
            }),
            curLayer ? CL.h('button.btn.btn-sm.btn-outline', {
              style: { color: 'var(--danger)' },
              html: CL.icon('trash') + `<span>${isVi ? 'Xóa chữ' : 'Clear'}</span>`,
              onclick: () => {
                design.layers = design.layers.filter((l) => l.id !== curLayer.id);
                selectedLayerId = null;
                pushHistory();
                render2DCanvas();
                renderStepPanel();
              },
            }) : null
          );

          stepBody.append(
            CL.h('div.sidebar-section-title', { text: isVi ? '1. Nội dung chữ trên son' : '1. Brand Text' }),
            textInput,
            actionsRow,
            CL.h('div.sidebar-section-title', { text: isVi ? '2. Vị trí & Hướng chữ' : '2. Placement & Direction', style: { marginTop: '12px' } }),
            partSwitch,
            orientRow,
            CL.h('div.sidebar-section-title', { text: isVi ? '3. Kiểu chữ (Font)' : '3. Font Style', style: { marginTop: '12px' } }),
            fontGrid,
            CL.h('div.sidebar-section-title', { style: { marginTop: '12px' } },
              CL.h('span', { text: isVi ? '4. Cỡ chữ' : '4. Text Size' }),
              sizeValLabel
            ),
            sizeSlider,
            CL.h('div.sidebar-section-title', { text: isVi ? '5. Màu sắc chữ' : '5. Text Color', style: { marginTop: '12px' } }),
            txtColorRow
          );
        }

        // ======================================================
        // STEP 04: CHOOSE LOGO & ACCENTS
        // ======================================================
        function buildLogoStep() {
          const isVi = I18N.lang === 'vi';

          const fileIn = CL.h('input', {
            type: 'file',
            accept: 'image/svg+xml,image/png,image/jpeg,image/webp',
            style: { display: 'none' },
            onchange: async (e) => {
              const file = e.target.files && e.target.files[0];
              if (!file) return;
              CL.toast(t('common.loading'), 'upload');
              try {
                const res = await CL.readImageFile(file, 1600);
                const newLayer = {
                  id: CL.uid('ly_img'),
                  type: 'image',
                  name: file.name.slice(0, 18),
                  part: activePart === 'cap' ? 'cap' : 'base',
                  x: 0.5,
                  y: 0.5,
                  rotation: 0,
                  opacity: 1,
                  visible: true,
                  locked: false,
                  image: {
                    src: res.src,
                    w: Math.min(64, res.w / 4),
                    h: Math.min(64, res.h / 4),
                  },
                };
                design.layers.push(newLayer);
                selectedLayerId = newLayer.id;
                pushHistory();
                render2DCanvas();
                renderStepPanel();
                CL.toast(isVi ? 'Đã tải logo lên thỏi son!' : 'Logo uploaded!');
              } catch (err) {
                CL.toast('Failed to load image', 'info');
              }
            },
          });

          const uploadBox = CL.h('button.studio-upload-dropzone', {
            type: 'button',
            onclick: () => fileIn.click(),
          },
            CL.h('div.upload-icon-circle', { html: CL.icon('upload') }),
            CL.h('strong', { text: isVi ? 'Tải Logo từ máy tính' : 'Upload Brand Logo' }),
            CL.h('span', { text: 'PNG, SVG, JPG · Kéo thả trực tiếp trên thân son' })
          );

          // Find active image or shape layer
          const curGraphic = design.layers.find((l) => l.id === selectedLayerId && (l.type === 'image' || l.type === 'shape'))
            || design.layers.find((l) => l.type === 'image' || l.type === 'shape');

          let graphicControls = null;
          if (curGraphic) {
            selectedLayerId = curGraphic.id;
            const isImg = curGraphic.type === 'image';
            const curScale = isImg ? Math.round(curGraphic.image.w) : Math.round(curGraphic.shape.w);
            const scaleValLabel = CL.h('span.mono', { text: `${curScale}px` });

            const scaleSlider = CL.h('input.range', {
              type: 'range', min: '12', max: '120', step: '2', value: curScale,
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
              CL.h('div.hero-meta-row', null,
                CL.h('strong', { text: curGraphic.name, style: { fontSize: '12px' } }),
                CL.h('span.pill-tag', { text: curGraphic.part.toUpperCase() })
              ),
              CL.h('div.sidebar-section-title', { style: { marginTop: '4px' } },
                CL.h('span', { text: isVi ? 'Kích thước Logo' : 'Logo Size' }),
                scaleValLabel
              ),
              scaleSlider,
              CL.h('div', { style: { display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' } },
                isImg ? CL.h('button.btn.btn-sm.btn-primary', {
                  style: { flex: 1 },
                  html: CL.icon('eraser') + `<span>${isVi ? 'AI Xóa nền trắng' : 'AI Remove BG'}</span>`,
                  onclick: async () => {
                    try {
                      const cleaned = await CL.removeWhiteBackground(curGraphic.image.src, 236, 20);
                      curGraphic.image.src = cleaned;
                      pushHistory();
                      render2DCanvas();
                      CL.toast(isVi ? 'Đã tách nền trắng!' : 'Background removed!');
                    } catch (err) {}
                  },
                }) : null,
                CL.h('button.btn.btn-sm.btn-outline', {
                  text: isVi ? 'Đổi Nắp/Thân' : 'Move Cap/Body',
                  onclick: () => {
                    curGraphic.part = curGraphic.part === 'cap' ? 'base' : 'cap';
                    curGraphic.x = 0.5;
                    curGraphic.y = 0.5;
                    pushHistory();
                    render2DCanvas();
                    renderStepPanel();
                  },
                }),
                CL.h('button.btn.btn-sm.btn-outline', {
                  style: { color: 'var(--danger)' },
                  html: CL.icon('trash'),
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

          // Minimalist K-Beauty Stamps / Accents
          const shapesList = [
            { k: 'circle', icon: '◯' },
            { k: 'line', icon: '―' },
            { k: 'star', icon: '✦' },
            { k: 'heart', icon: '♡' },
            { k: 'diamond', icon: '◇' },
            { k: 'rect', icon: '▭' },
          ];
          const shapesGrid = CL.h('div.studio-accent-grid', null,
            shapesList.map(({ k, icon }) =>
              CL.h('button.studio-accent-btn', {
                type: 'button',
                onclick: () => {
                  const newShape = {
                    id: CL.uid('ly_shp'),
                    type: 'shape',
                    name: t('editor.shapes.' + k),
                    part: activePart === 'cap' ? 'cap' : 'base',
                    x: 0.5,
                    y: 0.35,
                    rotation: 0,
                    opacity: 1,
                    visible: true,
                    locked: false,
                    shape: {
                      kind: k,
                      w: k === 'line' ? 48 : 28,
                      h: k === 'line' ? 2 : 28,
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
                CL.h('span.accent-symbol', { text: icon }),
                CL.h('span', { text: t('editor.shapes.' + k) })
              )
            )
          );

          stepBody.append(
            CL.h('div.sidebar-section-title', { text: isVi ? '1. Tải Logo thương hiệu' : '1. Upload Brand Logo' }),
            uploadBox,
            graphicControls,
            CL.h('div.sidebar-section-title', { text: isVi ? '2. Biểu tượng tối giản (1-Click)' : '2. Minimal Accents', style: { marginTop: '14px' } }),
            shapesGrid,
            fileIn
          );
        }

        function refreshAll() {
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

  // Both #/design and #/editor open the clean 4-Step Studio seamlessly!
  CL.pages.design = createStudioPage(0);
  CL.pages.editor = createStudioPage(0);
})(window.CL);
