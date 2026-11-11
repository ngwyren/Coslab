/* ==========================================================
   Artwork Editor: Figma-inspired studio with 2D & 3D real-time,
   Up/Button Liptint, AI background removal (Nano Banana),
   Illustrator-style colors/gradients, Typography & Layers.
   ========================================================== */
(function (CL) {
  CL.pages = CL.pages || {};

  CL.pages.editor = {
    titleKey: 'nav.design',
    appMode: true,

    render(container) {
      // 1. Load or initialise active design draft
      let design = CL.store.getDraft();
      if (!design) {
        design = CL.templates.createDesign('noir', 'classic');
        CL.store.saveDraft(design);
      }

      // History stack for Undo / Redo
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

      // Active state
      let activeView = '2d'; // '2d' | '3d'
      let activePart = 'base'; // 'cap' | 'base' | 'sleeve' | 'bullet'
      let activeTab = 'colors'; // 'model' | 'colors' | 'text' | 'graphics' | 'layers'
      let selectedLayerId = (design.layers[0] && design.layers[0].id) || null;
      let zoomLevel = 1.0;
      let preview3DInstance = null;

      // Root layout
      const root = CL.h('div.editor-layout');

      // ----------------------------------------------------
      // TOPBAR
      // ----------------------------------------------------
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

      // View toggle (2D / 3D segmented)
      const viewToggle = CL.h('div.segmented', null,
        CL.h('button#btnView2D.is-active', {
          html: CL.icon('square') + `<span>${t('editor.view2D')}</span>`,
          onclick: () => switchView('2d'),
        }),
        CL.h('button#btnView3D', {
          html: CL.icon('cube') + `<span>${t('editor.view3D')}</span>`,
          onclick: () => switchView('3d'),
        })
      );

      // Part Quick Select (Up Liptint / Button Liptint)
      const partQuickToggle = CL.h('div.segmented', null,
        CL.h('button#btnPartCap', {
          html: CL.icon('lipstick') + `<span>${t('editor.upPart')}</span>`,
          onclick: () => selectPart('cap'),
        }),
        CL.h('button#btnPartBase.is-active', {
          html: CL.icon('lipstick') + `<span>${t('editor.btnPart')}</span>`,
          onclick: () => selectPart('base'),
        })
      );

      // Save & Export
      const saveBtn = CL.h('button.btn.btn-sm.btn-outline', {
        html: CL.icon('save') + `<span>${t('editor.save')}</span>`,
        onclick: () => {
          const res = CL.store.saveDesign(design);
          if (res) CL.toast(t('editor.saved'));
          else CL.toast(t('editor.quotaWarning'), 'info');
        },
      });

      const exportBtn = CL.h('button.btn.btn-sm.btn-primary', {
        html: CL.icon('download') + `<span>${t('editor.export')}</span>` + CL.icon('chevronDown'),
        onclick: (e) => {
          CL.menu(e.currentTarget, CL.exportMenuItems(() => design), { align: 'end' });
        },
      });

      const topbar = CL.h('header.editor-topbar', null,
        CL.h('div.editor-topbar-left', null,
          CL.h('a.icon-btn.sm', { href: '#/design', title: t('common.back'), html: CL.icon('arrowLeft') }),
          CL.h('div.editor-title-wrap', null, titleInput),
          CL.h('div.topbar-sep'),
          undoBtn,
          redoBtn
        ),
        CL.h('div.editor-topbar-center', null,
          viewToggle,
          CL.h('div.topbar-sep'),
          partQuickToggle
        ),
        CL.h('div.editor-topbar-right', null,
          saveBtn,
          exportBtn
        )
      );

      // ----------------------------------------------------
      // WORKSPACE (Left sidebar, Canvas, Right inspector)
      // ----------------------------------------------------
      const workspace = CL.h('div.editor-workspace');

      // Left Sidebar
      const sidebar = CL.h('aside.editor-sidebar', null,
        CL.h('div.editor-tabs-bar', null,
          ['colors', 'text', 'graphics', 'layers', 'model'].map((tab) =>
            CL.h('button.editor-tab-btn' + (tab === activeTab ? '.is-active' : ''), {
              'data-tab': tab,
              html: CL.icon(
                tab === 'colors' ? 'palette' :
                tab === 'text' ? 'text' :
                tab === 'graphics' ? 'image' :
                tab === 'layers' ? 'layers' : 'lipstick'
              ) + `<span>${t('editor.tabs.' + tab)}</span>`,
              onclick: (e) => {
                activeTab = tab;
                sidebar.querySelectorAll('.editor-tab-btn').forEach((b) => b.classList.toggle('is-active', b.dataset.tab === tab));
                renderTabContent();
              },
            })
          )
        ),
        CL.h('div.editor-tab-content#sidebarTabContent')
      );

      // Center Canvas Container
      const canvasContainer = CL.h('div.editor-canvas-container', null,
        CL.h('div.canvas-viewport#canvasViewport', null,
          CL.h('div#canvasSvgHolder')
        ),
        CL.h('div.preview-3d-host#preview3dHost', { style: { display: 'none' } },
          CL.h('div.preview-3d-hud', { html: CL.icon('cube') + '<span> Drag to rotate 360° · Scroll to zoom</span>' })
        ),
        // Floating zoom controls
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
            title: 'Fit to View',
            html: CL.icon('fit'),
            onclick: () => setZoom(1.0),
          })
        )
      );

      // Right Inspector (Figma-style layer properties)
      const inspector = CL.h('aside.editor-inspector#editorInspector', null,
        CL.h('div.inspector-head', null,
          CL.h('span', { text: 'Layer Properties' }),
          CL.h('span.badge#layerTypeBadge', { text: 'None' })
        ),
        CL.h('div.inspector-body#inspectorBody')
      );

      workspace.append(sidebar, canvasContainer, inspector);
      root.append(topbar, workspace);
      container.appendChild(root);

      // ----------------------------------------------------
      // VIEW & ZOOM LOGIC
      // ----------------------------------------------------
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
        zoomLevel = CL.clamp(val, 0.4, 2.5);
        document.getElementById('zoomLevelText').textContent = Math.round(zoomLevel * 100) + '%';
        const vp = document.getElementById('canvasViewport');
        if (vp) vp.style.transform = `scale(${zoomLevel})`;
      }

      function selectPart(p) {
        activePart = p;
        document.getElementById('btnPartCap').classList.toggle('is-active', p === 'cap');
        document.getElementById('btnPartBase').classList.toggle('is-active', p === 'base');
        renderTabContent();
      }

      function updateUndoRedoUI() {
        undoBtn.disabled = historyIdx <= 0;
        redoBtn.disabled = historyIdx >= history.length - 1;
      }

      // ----------------------------------------------------
      // 2D SVG CANVAS RENDERING & INTERACTION
      // ----------------------------------------------------
      function render2DCanvas() {
        const holder = document.getElementById('canvasSvgHolder');
        if (!holder) return;

        const svg = CL.render.renderSVG(design, {
          interactive: true,
          width: 520,
          height: 620,
          shading: true,
          shadow: true,
        });

        holder.innerHTML = svg;
        const svgEl = holder.querySelector('svg');
        svgEl.classList.add('canvas-svg-root');

        // Part click
        svgEl.querySelectorAll('[data-part]').forEach((el) => {
          el.addEventListener('click', (e) => {
            e.stopPropagation();
            const p = el.getAttribute('data-part');
            selectPart(p);
          });
        });

        // Layer selection & drag
        svgEl.querySelectorAll('[data-layer]').forEach((el) => {
          el.addEventListener('pointerdown', (e) => {
            const lid = el.getAttribute('data-layer');
            const lyr = design.layers.find((l) => l.id === lid);
            if (!lyr || lyr.locked) return;

            e.stopPropagation();
            selectedLayerId = lid;
            renderInspector();
            if (activeTab === 'layers') renderTabContent();

            // Drag setup
            const layout = CL.models.layout(design.model);
            const rect = layout[lyr.part];
            const startX = e.clientX, startY = e.clientY;
            const origX = lyr.x, origY = lyr.y;

            const onMove = (ev) => {
              // Convert client pixel delta to SVG units
              const dx = (ev.clientX - startX) / (zoomLevel * (svgEl.clientWidth / 520));
              const dy = (ev.clientY - startY) / (zoomLevel * (svgEl.clientHeight / 620));
              lyr.x = CL.clamp(origX + dx / rect.w, -0.2, 1.2);
              lyr.y = CL.clamp(origY + dy / rect.h, -0.2, 1.2);
              render2DCanvas();
              renderInspector();
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

      function refreshAll() {
        render2DCanvas();
        renderTabContent();
        renderInspector();
      }

      // ----------------------------------------------------
      // SIDEBAR TABS RENDERING
      // ----------------------------------------------------
      const tabContent = document.getElementById('sidebarTabContent');

      function renderTabContent() {
        tabContent.innerHTML = '';

        if (activeTab === 'colors') {
          renderColorsTab();
        } else if (activeTab === 'text') {
          renderTextTab();
        } else if (activeTab === 'graphics') {
          renderGraphicsTab();
        } else if (activeTab === 'layers') {
          renderLayersTab();
        } else if (activeTab === 'model') {
          renderModelTab();
        }
      }

      // --- 1. Colors & Gradients Tab ---
      function renderColorsTab() {
        const sec = CL.h('div.sidebar-section');

        // Part Selector dropdown/chips
        const partSelect = CL.h('select.select', null,
          ['cap', 'base', 'sleeve', 'bullet'].map((p) =>
            CL.h('option', { value: p, selected: p === activePart, text: t('editor.parts.' + p) })
          )
        );
        partSelect.addEventListener('change', () => {
          activePart = partSelect.value;
          renderColorsTab();
        });

        const curPart = design.parts[activePart] || { fill: { type: 'solid', color: '#111111' }, finish: 'gloss' };

        // Fill style toggle (Solid / Gradient)
        const isGrad = curPart.fill && curPart.fill.type === 'linear';
        const fillToggle = CL.h('div.segmented.block', null,
          CL.h('button' + (!isGrad ? '.is-active' : ''), {
            text: t('editor.colors.solid'),
            onclick: () => {
              curPart.fill = { type: 'solid', color: isGrad ? curPart.fill.stops[0].c : curPart.fill.color };
              pushHistory();
              render2DCanvas();
              renderColorsTab();
            },
          }),
          CL.h('button' + (isGrad ? '.is-active' : ''), {
            text: t('editor.colors.gradient'),
            onclick: () => {
              const c = isGrad ? curPart.fill.stops[0].c : curPart.fill.color;
              curPart.fill = { type: 'linear', angle: 180, stops: [{ o: 0, c }, { o: 1, c: '#ffffff' }] };
              pushHistory();
              render2DCanvas();
              renderColorsTab();
            },
          })
        );

        // Finish Texture (Matte, Satin, Gloss, Metallic)
        const finishWrap = CL.h('div.chips', null,
          ['gloss', 'satin', 'matte', 'metallic'].map((fin) =>
            CL.h('button.chip' + (curPart.finish === fin ? '.is-active' : ''), {
              text: t('editor.colors.' + fin),
              onclick: () => {
                curPart.finish = fin;
                pushHistory();
                render2DCanvas();
                renderColorsTab();
              },
            })
          )
        );

        // Color Picker integration
        const activeColor = isGrad ? curPart.fill.stops[0].c : curPart.fill.color;
        const picker = CL.ColorPicker({
          value: activeColor,
          onChange: (newHex, final) => {
            if (isGrad) curPart.fill.stops[0].c = newHex;
            else curPart.fill.color = newHex;
            render2DCanvas();
            if (final) pushHistory();
          },
        });

        // Gradient secondary stop if linear
        let gradControls = null;
        if (isGrad) {
          const stop2Picker = CL.ColorPicker({
            value: curPart.fill.stops[1].c,
            compact: true,
            onChange: (newHex, final) => {
              curPart.fill.stops[1].c = newHex;
              render2DCanvas();
              if (final) pushHistory();
            },
          });
          const angleRange = CL.h('input.range', {
            type: 'range', min: '0', max: '360', value: curPart.fill.angle ?? 180,
            oninput: () => {
              curPart.fill.angle = parseInt(angleRange.value);
              render2DCanvas();
            },
            onchange: pushHistory,
          });

          gradControls = CL.h('div', { style: { display: 'grid', gap: '8px', marginTop: '12px', borderTop: '1px solid var(--border)', paddingTop: '12px' } },
            CL.h('div.label', { text: 'Gradient Stop 2' }),
            stop2Picker,
            CL.h('div.label', { text: t('editor.colors.angle') + `: ${curPart.fill.angle}°` }),
            angleRange
          );
        }

        sec.append(
          CL.h('div.sidebar-section-title', { text: t('editor.colors.partSelect') }),
          partSelect,
          CL.h('div.sidebar-section-title', { text: t('editor.colors.fillType'), style: { marginTop: '10px' } }),
          fillToggle,
          CL.h('div.sidebar-section-title', { text: t('editor.colors.finish'), style: { marginTop: '10px' } }),
          finishWrap,
          CL.h('div.sidebar-section-title', { text: t('editor.colors.title'), style: { marginTop: '10px' } }),
          picker,
          gradControls || document.createDocumentFragment()
        );

        tabContent.appendChild(sec);
      }

      // --- 2. Typography Tab ---
      function renderTextTab() {
        const sec = CL.h('div.sidebar-section');

        const addTextBtn = CL.h('button.btn.btn-primary.btn-block', {
          html: CL.icon('plus') + `<span>${t('editor.text.addBtn')}</span>`,
          onclick: () => {
            const newLayer = {
              id: CL.uid('ly_txt'),
              type: 'text',
              name: 'Brand Name',
              part: activePart === 'cap' ? 'cap' : 'base',
              x: 0.5,
              y: 0.5,
              rotation: activePart === 'base' ? -90 : 0,
              opacity: 1,
              visible: true,
              locked: false,
              text: {
                content: 'COSLAB',
                font: 'Montserrat',
                size: 22,
                weight: 700,
                italic: false,
                color: '#ffffff',
                spacing: 6,
                align: 'center',
                lineHeight: 1.2,
              },
            };
            design.layers.push(newLayer);
            selectedLayerId = newLayer.id;
            pushHistory();
            render2DCanvas();
            renderInspector();
            renderTextTab();
          },
        });

        // Current active text layer properties
        const curLayer = design.layers.find((l) => l.id === selectedLayerId && l.type === 'text');
        let editBlock = null;

        if (curLayer) {
          const txt = curLayer.text;

          const textIn = CL.h('input.input', {
            value: txt.content,
            placeholder: t('editor.text.inputPh'),
            oninput: () => {
              txt.content = textIn.value;
              curLayer.name = textIn.value || 'Text';
              render2DCanvas();
            },
            onchange: pushHistory,
          });

          // Font Selector
          const FONTS = [
            'Inter', 'Montserrat', 'Playfair Display', 'Instrument Serif',
            'Cormorant Garamond', 'Bebas Neue', 'Great Vibes', 'Dancing Script',
            'Noto Sans SC', 'Noto Sans JP', 'Noto Sans KR', 'Noto Naskh Arabic',
          ];
          const fontSelect = CL.h('select.select', null,
            FONTS.map((f) => CL.h('option', { value: f, selected: txt.font === f, text: f }))
          );
          fontSelect.addEventListener('change', () => {
            txt.font = fontSelect.value;
            render2DCanvas();
            pushHistory();
          });

          // Font Size & Weight
          const sizeIn = CL.h('input.input', {
            type: 'number', min: '8', max: '96', value: txt.size,
            oninput: () => {
              txt.size = parseInt(sizeIn.value) || 16;
              render2DCanvas();
            },
            onchange: pushHistory,
          });

          const weightSelect = CL.h('select.select', null,
            [300, 400, 500, 600, 700, 800].map((w) =>
              CL.h('option', { value: w, selected: (txt.weight || 400) === w, text: w })
            )
          );
          weightSelect.addEventListener('change', () => {
            txt.weight = parseInt(weightSelect.value);
            render2DCanvas();
            pushHistory();
          });

          // Tracking (Spacing)
          const spacingIn = CL.h('input.input', {
            type: 'number', min: '-2', max: '30', value: txt.spacing || 0,
            oninput: () => {
              txt.spacing = parseFloat(spacingIn.value) || 0;
              render2DCanvas();
            },
            onchange: pushHistory,
          });

          // Alignment
          const alignWrap = CL.h('div.segmented', null,
            ['left', 'center', 'right'].map((al) =>
              CL.h('button' + (txt.align === al ? '.is-active' : ''), {
                html: CL.icon(al === 'left' ? 'alignLeft' : al === 'right' ? 'alignRight' : 'alignCenter'),
                onclick: () => {
                  txt.align = al;
                  render2DCanvas();
                  pushHistory();
                  renderTextTab();
                },
              })
            )
          );

          // Color
          const colorPicker = CL.ColorPicker({
            value: txt.color,
            compact: true,
            onChange: (newHex, final) => {
              txt.color = newHex;
              render2DCanvas();
              if (final) pushHistory();
            },
          });

          editBlock = CL.h('div', { style: { display: 'grid', gap: '12px', marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '14px' } },
            CL.h('div.field', null, CL.h('label', { text: 'Text Content' }), textIn),
            CL.h('div.field', null, CL.h('label', { text: t('editor.text.font') }), fontSelect),
            CL.h('div.inspector-row', null,
              CL.h('div.field', null, CL.h('label', { text: t('editor.text.size') }), sizeIn),
              CL.h('div.field', null, CL.h('label', { text: t('editor.text.weight') }), weightSelect)
            ),
            CL.h('div.inspector-row', null,
              CL.h('div.field', null, CL.h('label', { text: t('editor.text.spacing') }), spacingIn),
              CL.h('div.field', null, CL.h('label', { text: t('editor.text.align') }), alignWrap)
            ),
            CL.h('div.field', null, CL.h('label', { text: t('editor.text.color') }), colorPicker)
          );
        }

        sec.append(
          CL.h('div.sidebar-section-title', { text: t('editor.text.title') }),
          addTextBtn,
          editBlock || CL.h('p.muted', { text: 'Select or add a text layer to edit typography.', style: { fontSize: '13px', marginTop: '12px' } })
        );

        tabContent.appendChild(sec);
      }

      // --- 3. Graphics & Logo Tab (with Nano Banana AI background removal) ---
      function renderGraphicsTab() {
        const sec = CL.h('div.sidebar-section');

        // File upload input
        const fileIn = CL.h('input', {
          type: 'file',
          accept: 'image/svg+xml,image/png,image/jpeg,image/webp,application/pdf',
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
                  w: Math.min(80, res.w / 4),
                  h: Math.min(80, res.h / 4),
                },
              };
              design.layers.push(newLayer);
              selectedLayerId = newLayer.id;
              pushHistory();
              render2DCanvas();
              renderInspector();
              renderGraphicsTab();
              CL.toast('Image imported!');
            } catch (err) {
              CL.toast('Failed to load image', 'info');
            }
          },
        });

        const uploadBtn = CL.h('button.btn.btn-outline.btn-block', {
          html: CL.icon('upload') + `<span>${t('editor.graphics.uploadBtn')}</span>`,
          onclick: () => fileIn.click(),
        });

        // AI Background Remover Card (Nano Banana Model)
        const curImgLayer = design.layers.find((l) => l.id === selectedLayerId && l.type === 'image');
        const aiCard = CL.h('div.ai-eraser-card', null,
          CL.h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' } },
            CL.h('span', { text: t('editor.graphics.aiTitle'), style: { fontWeight: '600', fontSize: '13px' } }),
            CL.h('span.ai-badge', { text: 'Nano Banana' })
          ),
          CL.h('p.muted', { text: t('editor.graphics.aiDesc'), style: { fontSize: '12px' } }),
          CL.h('button.btn.btn-sm.btn-primary' + (!curImgLayer ? '.is-disabled' : ''), {
            html: CL.icon('eraser') + `<span>${t('editor.graphics.aiBtn')}</span>`,
            disabled: !curImgLayer,
            onclick: async () => {
              if (!curImgLayer) return;
              CL.toast('AI processing: Nano Banana Model...', 'sparkles');
              try {
                const cleaned = await CL.removeWhiteBackground(curImgLayer.image.src, 236, 20);
                curImgLayer.image.src = cleaned;
                pushHistory();
                render2DCanvas();
                CL.toast('Background removed cleanly!');
              } catch (err) {
                CL.toast('Could not remove background', 'info');
              }
            },
          })
        );

        // Geometric Shapes
        const shapesList = ['rect', 'circle', 'line', 'diamond', 'star', 'heart'];
        const shapesGrid = CL.h('div.chips', null,
          shapesList.map((k) =>
            CL.h('button.chip', {
              text: t('editor.shapes.' + k),
              onclick: () => {
                const newShape = {
                  id: CL.uid('ly_shp'),
                  type: 'shape',
                  name: k,
                  part: activePart === 'cap' ? 'cap' : 'base',
                  x: 0.5,
                  y: 0.5,
                  rotation: 0,
                  opacity: 1,
                  visible: true,
                  locked: false,
                  shape: {
                    kind: k,
                    w: k === 'line' ? 60 : 36,
                    h: k === 'line' ? 2 : 36,
                    fill: k === 'circle' ? 'none' : '#ffffff',
                    stroke: k === 'circle' ? '#ffffff' : null,
                    strokeWidth: k === 'circle' ? 1.5 : 0,
                  },
                };
                design.layers.push(newShape);
                selectedLayerId = newShape.id;
                pushHistory();
                render2DCanvas();
                renderInspector();
              },
            })
          )
        );

        sec.append(
          CL.h('div.sidebar-section-title', { text: t('editor.graphics.title') }),
          uploadBtn,
          CL.h('span.muted', { text: t('editor.graphics.supported'), style: { fontSize: '11px', textAlign: 'center' } }),
          aiCard,
          CL.h('div.sidebar-section-title', { text: t('editor.graphics.addShape'), style: { marginTop: '10px' } }),
          shapesGrid,
          fileIn
        );

        tabContent.appendChild(sec);
      }

      // --- 4. Layers Tab ---
      function renderLayersTab() {
        const sec = CL.h('div.sidebar-section');
        const listEl = CL.h('div.layer-list');

        const partLayers = design.layers.filter((l) => l.part === activePart);

        if (!partLayers.length) {
          listEl.appendChild(CL.h('p.muted', { text: t('editor.layers.empty'), style: { fontSize: '13px', padding: '12px' } }));
        } else {
          partLayers.forEach((l) => {
            const item = CL.h('div.layer-item' + (l.id === selectedLayerId ? '.is-selected' : ''), {
              onclick: () => {
                selectedLayerId = l.id;
                render2DCanvas();
                renderInspector();
                renderLayersTab();
              },
            },
              CL.h('span.layer-type-icon', { html: CL.icon(l.type === 'text' ? 'text' : l.type === 'image' ? 'image' : 'shapes') }),
              CL.h('span.layer-name', { text: l.name }),
              CL.h('div.layer-ctrls', null,
                // Visibility toggle
                CL.h('button.icon-btn.sm', {
                  title: l.visible ? 'Hide' : 'Show',
                  html: CL.icon(l.visible ? 'eye' : 'eyeOff'),
                  onclick: (e) => {
                    e.stopPropagation();
                    l.visible = !l.visible;
                    pushHistory();
                    render2DCanvas();
                    renderLayersTab();
                  },
                }),
                // Lock toggle
                CL.h('button.icon-btn.sm', {
                  title: l.locked ? 'Unlock' : 'Lock',
                  html: CL.icon(l.locked ? 'lock' : 'unlock'),
                  onclick: (e) => {
                    e.stopPropagation();
                    l.locked = !l.locked;
                    pushHistory();
                    renderLayersTab();
                  },
                }),
                // Delete
                CL.h('button.icon-btn.sm', {
                  title: 'Delete',
                  html: CL.icon('trash'),
                  onclick: (e) => {
                    e.stopPropagation();
                    design.layers = design.layers.filter((x) => x.id !== l.id);
                    if (selectedLayerId === l.id) selectedLayerId = null;
                    pushHistory();
                    render2DCanvas();
                    renderInspector();
                    renderLayersTab();
                  },
                })
              )
            );
            listEl.appendChild(item);
          });
        }

        sec.append(
          CL.h('div.sidebar-section-title', { text: t('editor.layers.title') + ` (${t('editor.parts.' + activePart)})` }),
          listEl
        );

        tabContent.appendChild(sec);
      }

      // --- 5. Model Tab ---
      function renderModelTab() {
        const sec = CL.h('div.sidebar-section', null,
          CL.h('div.sidebar-section-title', { text: 'Change Model Silhouette' }),
          CL.h('div', { style: { display: 'grid', gap: '8px' } },
            CL.models.MODELS.map((m) =>
              CL.h('div.lang-card' + (m.id === design.model ? '.is-active' : ''), {
                onclick: () => {
                  design.model = m.id;
                  pushHistory();
                  render2DCanvas();
                  renderModelTab();
                },
              },
                CL.h('span', { text: t('models.' + m.id) }),
                CL.h('span.badge', { text: m.section })
              )
            )
          )
        );
        tabContent.appendChild(sec);
      }

      // ----------------------------------------------------
      // RIGHT INSPECTOR (Layer Position, Scale, Align, Rotate)
      // ----------------------------------------------------
      const inspectorBody = document.getElementById('inspectorBody');

      function renderInspector() {
        inspectorBody.innerHTML = '';
        const curLayer = design.layers.find((l) => l.id === selectedLayerId);

        if (!curLayer) {
          document.getElementById('layerTypeBadge').textContent = 'None';
          inspectorBody.appendChild(CL.h('p.muted', { text: 'Click an element on the canvas to inspect transform properties.', style: { fontSize: '13px' } }));
          return;
        }

        document.getElementById('layerTypeBadge').textContent = curLayer.type.toUpperCase();

        // Alignment row
        const alignRow = CL.h('div.inspector-actions-row', null,
          CL.h('button.icon-btn', {
            title: t('editor.layers.alignCenterH'),
            html: CL.icon('alignH'),
            onclick: () => {
              curLayer.x = 0.5;
              render2DCanvas();
              pushHistory();
              renderInspector();
            },
          }),
          CL.h('button.icon-btn', {
            title: t('editor.layers.alignCenterV'),
            html: CL.icon('alignV'),
            onclick: () => {
              curLayer.y = 0.5;
              render2DCanvas();
              pushHistory();
              renderInspector();
            },
          }),
          CL.h('button.icon-btn', {
            title: t('editor.layers.flipH'),
            html: CL.icon('flipH'),
            onclick: () => {
              curLayer.flipX = !curLayer.flipX;
              render2DCanvas();
              pushHistory();
            },
          }),
          CL.h('button.icon-btn', {
            title: t('editor.layers.flipV'),
            html: CL.icon('flipV'),
            onclick: () => {
              curLayer.flipY = !curLayer.flipY;
              render2DCanvas();
              pushHistory();
            },
          }),
          CL.h('button.icon-btn', {
            title: t('editor.layers.bringForward'),
            html: CL.icon('up'),
            onclick: () => {
              const idx = design.layers.indexOf(curLayer);
              if (idx < design.layers.length - 1) {
                design.layers.splice(idx, 1);
                design.layers.splice(idx + 1, 0, curLayer);
                pushHistory();
                render2DCanvas();
                if (activeTab === 'layers') renderLayersTab();
              }
            },
          }),
          CL.h('button.icon-btn', {
            title: t('editor.layers.sendBackward'),
            html: CL.icon('down'),
            onclick: () => {
              const idx = design.layers.indexOf(curLayer);
              if (idx > 0) {
                design.layers.splice(idx, 1);
                design.layers.splice(idx - 1, 0, curLayer);
                pushHistory();
                render2DCanvas();
                if (activeTab === 'layers') renderLayersTab();
              }
            },
          })
        );

        // Rotation & Opacity
        const rotIn = CL.h('input.input.input-sm', {
          type: 'number', min: '-360', max: '360', value: Math.round(curLayer.rotation || 0),
          oninput: () => {
            curLayer.rotation = parseFloat(rotIn.value) || 0;
            render2DCanvas();
          },
          onchange: pushHistory,
        });

        const opacRange = CL.h('input.range', {
          type: 'range', min: '0', max: '1', step: '0.05', value: curLayer.opacity ?? 1,
          oninput: () => {
            curLayer.opacity = parseFloat(opacRange.value);
            render2DCanvas();
          },
          onchange: pushHistory,
        });

        // Layer removal
        const delBtn = CL.h('button.btn.btn-sm.btn-outline.btn-block', {
          html: CL.icon('trash') + `<span>${t('editor.layers.delete')}</span>`,
          onclick: () => {
            design.layers = design.layers.filter((x) => x.id !== curLayer.id);
            selectedLayerId = null;
            pushHistory();
            render2DCanvas();
            renderInspector();
            if (activeTab === 'layers') renderLayersTab();
          },
        });

        inspectorBody.append(
          CL.h('div.sidebar-section-title', { text: 'Alignment & Ordering' }),
          alignRow,
          CL.h('div.inspector-row', null,
            CL.h('div.field', null, CL.h('label', { text: t('editor.layers.rotation') }), rotIn),
            CL.h('div.field', null, CL.h('label', { text: t('editor.layers.opacity') }), opacRange)
          ),
          CL.h('div', { style: { marginTop: '16px' } }, delBtn)
        );
      }

      // Initial Render
      refreshAll();
      updateUndoRedoUI();

      // Keyboard shortcuts
      const onKey = (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
          if (e.shiftKey) redo(); else undo();
          e.preventDefault();
        } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
          redo();
          e.preventDefault();
        } else if (e.key === 'Delete' || e.key === 'Backspace') {
          if (selectedLayerId && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
            design.layers = design.layers.filter((l) => l.id !== selectedLayerId);
            selectedLayerId = null;
            pushHistory();
            render2DCanvas();
            renderInspector();
            e.preventDefault();
          }
        }
      };
      window.addEventListener('keydown', onKey);

      return () => {
        window.removeEventListener('keydown', onKey);
        if (preview3DInstance) preview3DInstance.dispose();
      };
    },
  };
})(window.CL);
