/* ==========================================================
   COSLAB — Figma UI3 Inspired Lipstick Design Studio
   3 steps here (02 Color -> 03 Text -> 04 Logo); step 01 Shape is the Design page
   - Figma-style legible Inspector with scrubbable property inputs
   - Smooth Mouse Wheel Zoom (toward cursor, 35%–350%) & Canvas Pan
   - Interactive Figma Blue Selection Gizmo (Move, Rotate, Corner Resize)
   - Smart Center Alignment Guides & Strict Safe Zone Clamping
   ========================================================== */
(function (CL) {
  CL.pages = CL.pages || {};

  // Studio covers steps 2–4 of the customer flow; step 1 (shape) lives on the Design page.
  const STEPS = [
    { id: 'colors', num: '02', key: 'landing.step2' },
    { id: 'text', num: '03', key: 'landing.step3' },
    { id: 'graphics', num: '04', key: 'landing.step4' },
  ];
  const TOTAL_STEPS = STEPS.length + 1;

  function stepLabel(s) {
    return t(s.key);
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
      'aria-label': title || prefix,
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
      title: title ? `${title} (${t('ui.scrubHint')})` : t('ui.scrubHint'),
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
        window.removeEventListener('pointercancel', onUp);
        field.classList.remove('is-scrubbing');
        document.body.style.cursor = '';
        if (latestVal !== startVal && onCommit) onCommit(latestVal);
      };

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);
    });

    field.append(prefixEl, inputEl);
    if (unit) field.append(CL.h('span.fg-unit', { text: unit }));

    if (showSteppers) {
      const stepWrap = CL.h('div.fg-stepper-btns', null,
        CL.h('button.fg-step-mini', {
          type: 'button',
          text: '−',
          'aria-label': (title || prefix) + ' −',
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
          'aria-label': (title || prefix) + ' +',
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
          design = CL.templates.createForModel('cl-sc01');
        }
        design.model = CL.models.getModel(design.model).id; // drafts from before the real containers
        // Older drafts may hold free HEX colours — snap them to Pantone codes
        CL.pantone.normalizeDesign(design);
        // "Clear · tint inside" is no longer offered — move such parts to the closest option
        Object.values(design.parts || {}).forEach((p) => { if (p && p.surface === 'clear') p.surface = 'clear-gradient'; });
        CL.store.saveDraft(design);

        const history = [CL.clone(design)];
        let historyIdx = 0;

        /** Keep the draft in the browser; warn (once until it works again) when storage is full. */
        let draftWarned = false;
        function persistDraft() {
          if (CL.store.saveDraft(design)) { draftWarned = false; return; }
          if (draftWarned) return;
          draftWarned = true;
          CL.toast(t('ui.draftNotSaved'), 'info');
        }

        function pushHistory() {
          if (historyIdx < history.length - 1) history.splice(historyIdx + 1);
          history.push(CL.clone(design));
          if (history.length > 30) history.shift();
          else historyIdx++;
          persistDraft();
          updateUndoRedoUI();
        }

        function undo() {
          if (historyIdx > 0) {
            historyIdx--;
            design = CL.clone(history[historyIdx]);
            persistDraft();
            refreshAll();
            updateUndoRedoUI();
          }
        }

        function redo() {
          if (historyIdx < history.length - 1) {
            historyIdx++;
            design = CL.clone(history[historyIdx]);
            persistDraft();
            refreshAll();
            updateUndoRedoUI();
          }
        }

        const queryStep = ctx.query && ctx.query.step;
        let activeStepIdx = queryStep ? Math.max(0, Math.min(STEPS.length - 1, parseInt(queryStep, 10) - 1)) : (defaultStep || 0);
        let activeView = '2d';
        let activePart = 'base'; // strictly 'base' | 'cap'
        let selectedLayerId = null;
        let deselected = false; // blue frame hidden after a click on empty space
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
          'aria-label': t('ui.undo'),
          title: t('ui.undo') + ' (Ctrl+Z)',
          onclick: undo,
        });
        const redoBtn = CL.h('button.icon-btn.sm#btnRedo', {
          html: CL.icon('redo'),
          'aria-label': t('ui.redo'),
          title: t('ui.redo') + ' (Ctrl+Shift+Z)',
          onclick: redo,
        });

        const stepperBar = CL.h('nav.studio-stepper', { 'aria-label': t('ui.steps') },
          // Step 1 (shape) is already done on the Design page — tap it to go back and change
          CL.h('a.studio-step-pill.is-done', {
            href: '#/design',
            title: t('flow.pickShape'),
            html: `<span class="step-num">01</span><span class="step-name">${t('landing.step1')}</span>`,
          }),
          STEPS.map((s, idx) =>
            CL.h('button.studio-step-pill' + (idx === activeStepIdx ? '.is-active' : idx < activeStepIdx ? '.is-done' : ''), {
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

        /* ---- Unsaved changes: leaving the Studio asks whether to save first ---- */
        const snap = (d) => JSON.stringify(Object.assign({}, d, { updatedAt: 0, createdAt: 0 }));
        // the saved copy goes through the same clean-up as the draft, so only real edits count
        const stored = design.id && CL.clone(CL.store.getDesign(design.id));
        if (stored) {
          stored.model = CL.models.getModel(stored.model).id;
          CL.pantone.normalizeDesign(stored);
          Object.values(stored.parts || {}).forEach((p) => { if (p && p.surface === 'clear') p.surface = 'clear-gradient'; });
        }
        let savedSnap = stored ? snap(stored) : null; // null: not in Saved yet, so leaving always asks
        const isDirty = () => snap(design) !== savedSnap;
        function saveNow() {
          const res = CL.store.saveDesign(design);
          if (res) {
            // keep the saved copy's identity, so saving again updates it instead of adding another
            design.id = res.id;
            design.createdAt = res.createdAt;
            persistDraft();
            savedSnap = snap(design);
          }
          return res;
        }
        /** Resolves 'save', 'discard' or 'stay'. */
        function askLeave() {
          return new Promise((resolve) => {
            const host = document.getElementById('modalHost');
            const close = (v) => {
              document.removeEventListener('keydown', onKey, true);
              bd.classList.add('is-leaving');
              setTimeout(() => bd.remove(), 180);
              resolve(v);
            };
            const onKey = (e) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close('stay'); } };
            const saveB = CL.h('button.btn.btn-primary', { type: 'button', text: t('editor.save'), onclick: () => close('save') });
            const bd = CL.h('div.modal-backdrop', { onclick: (e) => { if (e.target === bd) close('stay'); } },
              CL.h('div.modal', { role: 'dialog', 'aria-modal': 'true', 'aria-label': t('ui.leaveTitle') },
                CL.h('h3', { text: t('ui.leaveTitle') }),
                CL.h('p', { text: t('ui.leaveMsg') }),
                CL.h('div.modal-actions.leave-actions', null,
                  CL.h('button.btn.btn-ghost', { type: 'button', text: t('ui.leaveStay'), onclick: () => close('stay') }),
                  CL.h('button.btn.btn-outline', { type: 'button', text: t('ui.leaveDiscard'), onclick: () => close('discard') }),
                  saveB)));
            host.replaceChildren(bd);
            document.addEventListener('keydown', onKey, true);
            setTimeout(() => saveB.focus(), 30);
          });
        }
        async function leaveStudio(e) {
          if (!isDirty()) return; // nothing to lose: the link works as usual
          e.preventDefault();
          const answer = await askLeave();
          if (answer === 'stay') return;
          if (answer === 'save') {
            if (!saveNow()) { CL.toast(t('editor.quotaWarning'), 'info'); return; }
            CL.toast(t('editor.saved'));
          }
          location.hash = '#/design';
        }

        const saveBtn = CL.h('button.btn.btn-sm.btn-outline', {
          html: CL.icon('save') + `<span>${t('editor.save')}</span>`,
          'aria-label': t('editor.save'),
          onclick: () => {
            const res = saveNow();
            if (res) CL.toast(t('editor.saved'));
            else CL.toast(t('editor.quotaWarning'), 'info');
          },
        });

        const exportBtn = CL.h('button.btn.btn-sm.btn-primary', {
          html: CL.icon('download') + `<span>${t('editor.export')}</span>`,
          'aria-label': t('editor.export'),
          onclick: () => {
            CL.openExport(design);
          },
        });

        const topbar = CL.h('header.editor-topbar', null,
          CL.h('div.editor-topbar-left', null,
            CL.h('a.studio-back-link', {
              href: '#/design',
              onclick: leaveStudio,
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
                deselected = false;
                syncPartChips();
                render2DCanvas();
                renderStepPanel();
              },
            },
              CL.h('span.part-tab-dot', { 'data-part-dot': pId }),
              CL.h('span', { text: pId === 'base' ? (t('ui.body')) : (t('ui.cap')) })
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
            CL.h('div.preview-3d-hud', null,
              CL.h('button.hud-reset', {
                type: 'button',
                title: t('ui.resetView'),
                'aria-label': t('ui.resetView'),
                html: CL.icon('rotate') + `<span>${t('ui.reset')}</span>`,
                onclick: () => preview3DInstance && preview3DInstance.resetView(),
              }),
              CL.h('button.hud-reset.hud-render', {
                type: 'button',
                title: t('ui.renderHint'),
                html: CL.icon('image') + '<span>Render</span>',
                onclick: () => CL.openRender(design, preview3DInstance && preview3DInstance.camera),
              }))
          ),
          CL.h('div.canvas-floating-controls#canvasFloatingControls', {
            title: t('ui.zoomHint'),
          },
            CL.h('button.icon-btn.sm', {
              title: t('ui.zoomOut'),
              html: CL.icon('zoomOut'),
              onclick: () => setZoom(zoomLevel / 1.2, { smooth: true }),
            }),
            CL.h('span.zoom-level-text#zoomLevelText', { text: '100%' }),
            CL.h('button.icon-btn.sm', {
              title: t('ui.zoomIn'),
              html: CL.icon('zoomIn'),
              onclick: () => setZoom(zoomLevel * 1.2, { smooth: true }),
            }),
            CL.h('button.icon-btn.sm', {
              title: t('ui.zoomReset'),
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

        // A plain click beside the text / logo hides its blue frame (dragging to pan does not)
        let emptyDown = null;
        canvasContainer.addEventListener('pointerdown', (e) => {
          const busy = e.button !== 0 || isSpaceDown || e.target.closest('.canvas-part-Quickbar, .canvas-floating-controls, [data-layer], .cl-transform-gizmo');
          emptyDown = busy ? null : { x: e.clientX, y: e.clientY };
        }, true);
        canvasContainer.addEventListener('click', (e) => {
          if (activeView !== '2d' || !emptyDown || Math.hypot(e.clientX - emptyDown.x, e.clientY - emptyDown.y) > 5) return;
          if (deselected) return;
          deselected = true;
          render2DCanvas();
        });
        const reselect = () => {
          if (!deselected) return;
          deselected = false;
          render2DCanvas();
        };

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
          partQuickBar.style.display = 'flex'; // Body / Cap switch in both the 2D and the 3D view
          partQuickBar.querySelectorAll('.canvas-part-chip').forEach((btn) => {
            const pId = btn.dataset.partChip;
            btn.classList.toggle('is-active', pId === activePart);
            const dot = btn.querySelector('.part-tab-dot');
            if (dot) dot.style.background = getPartHex(pId);
          });
        }

        function goToStep(idx) {
          activeStepIdx = CL.clamp(idx, 0, STEPS.length - 1);
          deselected = false;
          stepperBar.querySelectorAll('.studio-step-pill[data-step-idx]').forEach((b, i) => {
            b.classList.toggle('is-active', i === activeStepIdx);
            b.classList.toggle('is-done', i < activeStepIdx);
          });
          syncPartChips();
          render2DCanvas();
          renderStepPanel();
        }

        let viewSeq = 0;
        async function switchView(view) {
          const prev = activeView, seq = ++viewSeq;
          activeView = view;
          document.getElementById('btnView2D').classList.toggle('is-active', view === '2d');
          document.getElementById('btnView3D').classList.toggle('is-active', view === '3d');
          // the view that leaves fades away first, then the other one comes in
          const going = document.getElementById(view === '3d' ? 'canvasViewport' : 'preview3dHost');
          if (prev !== view && going.style.display !== 'none' && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
            going.classList.remove('view-in');
            going.classList.add('view-out');
            await new Promise((r) => setTimeout(r, 170));
            going.classList.remove('view-out');
            if (seq !== viewSeq || !going.isConnected) return; // switched again or left meanwhile
          }
          document.getElementById('canvasFloatingControls').style.display = view === '2d' ? 'flex' : 'none';
          document.getElementById('canvasViewport').style.display = view === '2d' ? 'block' : 'none';
          syncPartChips();

          const p3d = document.getElementById('preview3dHost');
          p3d.style.display = view === '3d' ? 'block' : 'none';
          // the view that comes in fades up instead of popping
          const shown = view === '3d' ? p3d : document.getElementById('canvasViewport');
          shown.classList.remove('view-in');
          void shown.offsetWidth;
          shown.classList.add('view-in');

          if (view === '3d') {
            p3d.classList.toggle('is-loading', !window.THREE);
            try {
              await CL.loadThree();
            } catch (err) {
              CL.toast(t('ui.load3dFail'), 'info');
              if (activeView === '3d') switchView('2d');
              return;
            } finally {
              p3d.classList.remove('is-loading');
            }
            if (activeView !== '3d' || !p3d.isConnected) return; // switched back or left meanwhile
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
          if (deselected) return null;
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

        /* ---------- Simple controls (no design knowledge needed) ---------- */
        const LEVELS = { s: 0.45, m: 0.7, l: 1 };
        let advancedOpen = false;
        let shownStep = null;
        const shownFonts = new Set(); // rows already drawn in their own font
        let fontQuery = '';
        let fontScroll = null; // kept while the panel re-renders
        CL.fonts.load();
        const SCRIPT = CL.fonts.GROUPS.find((g) => g.id === 'script').fonts;
        const measureCtx = document.createElement('canvas').getContext('2d');
        const isVertical = (lyr) => Math.abs(Math.sin(((lyr.rotation || 0) * Math.PI) / 180)) > 0.7;

        /** Size of a text block at font size 1 (letter spacing excluded). */
        function textUnit(tx) {
          const lines = String(tx.content || '').split('\n');
          measureCtx.font = `${tx.italic ? 'italic ' : ''}${tx.weight || 400} 100px '${tx.font}', sans-serif`;
          return {
            // scripts swing past their letter widths, so use whichever is larger and keep a little air
            w: Math.max(0.3, ...lines.map((l) => {
              const m = measureCtx.measureText(l);
              return Math.max(m.width, m.actualBoundingBoxLeft + m.actualBoundingBoxRight) / 100;
            })) * (SCRIPT.includes(tx.font) ? 1.08 : 1),
            h: 1.05 + (lines.length - 1) * (tx.lineHeight || 1.2),
            gaps: Math.max(0, ...lines.map((l) => l.length - 1)),
          };
        }

        /** Largest size that still fits the print area: font size for text, scale factor for a logo. */
        function maxFit(lyr) {
          const safe = CL.models.layout(design.model)[lyr.part].safe;
          const [along, across] = isVertical(lyr) ? [safe.h, safe.w] : [safe.w, safe.h];
          if (lyr.type === 'text') {
            const u = textUnit(lyr.text);
            return Math.max(8, Math.min((along - u.gaps * (lyr.text.spacing || 0)) / u.w, across / u.h));
          }
          const box = lyr[lyr.type];
          return Math.min(along / box.w, across / box.h);
        }

        function applyLevel(lyr, level) {
          lyr.fit = level;
          delete lyr.free; // a size level fits the safe zone again
          const k = maxFit(lyr) * LEVELS[level];
          if (lyr.type === 'text') {
            lyr.text.size = Math.max(8, Math.floor(k));
          } else {
            const box = lyr[lyr.type];
            box.w = Math.max(4, Math.round(box.w * k));
            box.h = Math.max(1, Math.round(box.h * k));
          }
          keepInside(lyr);
        }

        /** Half of the layer's height on the tube, as a share of the part's height. */
        function halfHeight(lyr) {
          const rect = CL.models.layout(design.model)[lyr.part];
          let w, h;
          if (lyr.type === 'text') {
            const u = textUnit(lyr.text);
            w = u.w * lyr.text.size + u.gaps * (lyr.text.spacing || 0);
            h = u.h * lyr.text.size;
          } else ({ w, h } = lyr[lyr.type]);
          return (isVertical(lyr) ? w : h) / 2 / rect.h;
        }

        function yRange(lyr) {
          const safe = CL.models.layout(design.model)[lyr.part].safe;
          const half = halfHeight(lyr);
          const top = safe.minY + half;
          const bottom = safe.maxY - half;
          return top > bottom ? [0.5, 0.5] : [top, bottom];
        }

        function keepInside(lyr) {
          const [top, bottom] = yRange(lyr);
          lyr.y = CL.clamp(lyr.y ?? 0.5, top, bottom);
        }

        function applySpot(lyr, spot) {
          const [top, bottom] = yRange(lyr);
          lyr.x = 0.5;
          lyr.y = spot === 'top' ? top : spot === 'bottom' ? bottom : 0.5;
        }

        function spotOf(lyr) {
          const [top, bottom] = yRange(lyr);
          if (Math.abs((lyr.x ?? 0.5) - 0.5) > 0.01) return null;
          const near = (v) => Math.abs((lyr.y ?? 0.5) - v) < 0.012;
          return near(0.5) ? 'mid' : near(top) ? 'top' : near(bottom) ? 'bottom' : null;
        }

        /** A row of big choice buttons: [[id, label], …]. */
        function choiceRow(label, options, current, onPick) {
          return CL.h('div.easy-row', null,
            CL.h('span.easy-label', { text: label }),
            CL.h('div.fg-seg', { role: 'group', 'aria-label': label },
              options.map(([id, text]) => CL.h('button.fg-seg-btn' + (current === id ? '.is-active' : ''), {
                type: 'button',
                'aria-pressed': String(current === id),
                text,
                onclick: () => {
                  onPick(id);
                  pushHistory();
                  render2DCanvas();
                  renderStepPanel();
                },
              })))
          );
        }

        function sizeRow(lyr) {
          return choiceRow(t('ui.size'), [['s', t('ui.small')], ['m', t('ui.medium')], ['l', t('ui.large')]],
            lyr.fit, (id) => applyLevel(lyr, id));
        }

        function spotRow(lyr) {
          return choiceRow(t('ui.place'), [['top', t('ui.posTop')], ['mid', t('ui.posMiddle')], ['bottom', t('ui.posBottom')]],
            spotOf(lyr), (id) => applySpot(lyr, id));
        }

        /** Exact numbers stay available, folded away. */
        function advancedBox(...children) {
          const box = CL.h('details.easy-advanced', null,
            CL.h('summary', { text: t('ui.fineTuning') }),
            children
          );
          box.open = advancedOpen;
          box.addEventListener('toggle', () => { advancedOpen = box.open; });
          return box;
        }

        function removeLayer(layer) {
          if (!layer || layer.locked) return;
          design.layers = design.layers.filter((l) => l.id !== layer.id);
          selectedLayerId = null;
          pushHistory();
          render2DCanvas();
          renderStepPanel();
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

              // Text: hug the letters themselves (getBBox is the font's em box, with room for
              // accents and descenders that capitals never use)
              let offX = 0, offY = 0; // centre of the box in the layer's own coordinates
              let pad = 8;
              if (targetLayer.type === 'text') {
                const ink = CL.render.textInk(targetLayer.text, partRect, targetLayer.rotation, !!targetLayer.free);
                if (ink && ink.w > 0 && ink.h > 0) {
                  bW = ink.w; bH = ink.h;
                  offX = ink.x + ink.w / 2; offY = ink.y + ink.h / 2;
                  pad = 3;
                }
              }
              const boxW = CL.round(bW + pad * 2, 1);
              const boxH = CL.round(bH + pad * 2, 1);
              const bx = CL.round(offX - boxW / 2, 2), by = CL.round(offY - boxH / 2, 2);
              const stemLen = 22;
              const handleY = by - stemLen;

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
                { id: 'nw', x: bx, y: by, cur: 'nwse-resize' },
                { id: 'ne', x: bx + boxW, y: by, cur: 'nesw-resize' },
                { id: 'sw', x: bx, y: by + boxH, cur: 'nesw-resize' },
                { id: 'se', x: bx + boxW, y: by + boxH, cur: 'nwse-resize' },
              ];

              gizmoG.innerHTML = `
                <rect class="gizmo-hit" x="${bx}" y="${by}" width="${boxW}" height="${boxH}" fill="rgba(13,153,255,0.03)"/>
                <rect class="gizmo-box-halo" x="${bx}" y="${by}" width="${boxW}" height="${boxH}" rx="2" fill="none"/>
                <rect class="gizmo-box-main" x="${bx}" y="${by}" width="${boxW}" height="${boxH}" rx="2" fill="none"/>
                <line class="gizmo-stem-halo" x1="${offX}" y1="${by}" x2="${offX}" y2="${handleY}"/>
                <line class="gizmo-stem-main" x1="${offX}" y1="${by}" x2="${offX}" y2="${handleY}"/>
                ${corners.map((c) => `
                  <g class="gizmo-corner-wrap" data-corner="${c.id}" style="cursor:${c.cur}">
                    <circle cx="${c.x}" cy="${c.y}" r="10" fill="transparent"/>
                    <rect class="gizmo-corner" x="${c.x - 4}" y="${c.y - 4}" width="8" height="8" rx="1.5"/>
                  </g>
                `).join('')}
                <g class="gizmo-rot-handle" transform="translate(${offX} ${handleY})">
                  <circle class="gizmo-rot-hit" r="15" fill="transparent"/>
                  <circle class="gizmo-rot-bg" r="9"/>
                  <path class="gizmo-rot-icon" d="M -3.2 -1.2 A 3.8 3.8 0 1 1 -1 3.4 M -4.8 -2.8 L -3.3 -1 L -1.6 -2.5" fill="none" stroke="#0d99ff" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
                </g>
                <g class="gizmo-hud-pill" style="display: none;" transform="translate(${offX} ${by + boxH + 18})">
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
                  let moved = false;

                  const onMove = (ev) => {
                    if (!moved && Math.hypot(ev.clientX - startX, ev.clientY - startY) < 3) return;
                    moved = true;
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
                    window.removeEventListener('pointercancel', onUp);
                    hideHud();
                    if (!moved) return; // a plain click changes nothing
                    pushHistory();
                    render2DCanvas();
                    renderStepPanel(); // Place / X / Y follow the drag
                  };

                  window.addEventListener('pointermove', onMove);
                  window.addEventListener('pointerup', onUp);
                  window.addEventListener('pointercancel', onUp);
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
                  const startRot = Math.round(targetLayer.rotation || 0);

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
                    window.removeEventListener('pointercancel', onRotUp);
                    hideHud();
                    rotHandle.style.cursor = 'grab';
                    document.body.style.cursor = '';
                    if (Math.round(targetLayer.rotation || 0) === startRot) return; // a plain click changes nothing
                    pushHistory();
                    render2DCanvas();
                    renderStepPanel();
                  };

                  window.addEventListener('pointermove', onRotMove);
                  window.addEventListener('pointerup', onRotUp);
                  window.addEventListener('pointercancel', onRotUp);
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
                      const nextSz = CL.clamp(Math.round(origSize * factor), 8, 100);
                      if (nextSz !== targetLayer.text.size) {
                        targetLayer.text.size = nextSz;
                        delete targetLayer.fit;
                        targetLayer.free = true; // sized by hand: no auto-fit, may fill the print band
                        const szIn = document.getElementById('fgInputSize');
                        const szSl = document.getElementById('studioLayerSizeSlider');
                        if (szIn) szIn.value = String(nextSz);
                        if (szSl) szSl.value = String(nextSz);
                        render2DCanvas();
                      }
                      hudVal = `${nextSz}px`;
                    } else if (targetLayer.type === 'image') {
                      const nextW = CL.clamp(Math.round(origSize * factor), 14, 190);
                      if (nextW !== targetLayer.image.w) {
                        targetLayer.image.w = nextW;
                        delete targetLayer.fit;
                        targetLayer.free = true; // sized by hand: no auto-fit, may fill the print band
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
                        delete targetLayer.fit;
                        targetLayer.free = true; // sized by hand: no auto-fit, may fill the print band
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

                  const sizeNow = () => JSON.stringify(targetLayer[targetLayer.type]);
                  const startSize = sizeNow();
                  const onScaleUp = () => {
                    window.removeEventListener('pointermove', onScaleMove);
                    window.removeEventListener('pointerup', onScaleUp);
                    window.removeEventListener('pointercancel', onScaleUp);
                    if (sizeNow() === startSize) { render2DCanvas(); return; } // a plain click changes nothing
                    pushHistory();
                    render2DCanvas();
                    renderStepPanel();
                  };

                  window.addEventListener('pointermove', onScaleMove);
                  window.addEventListener('pointerup', onScaleUp);
                  window.addEventListener('pointercancel', onScaleUp);
                });
              });
            }
          }

          // Pressing a layer selects it and starts moving it in the same gesture
          svgEl.querySelectorAll('[data-layer]').forEach((el) => {
            const lid = el.getAttribute('data-layer');
            // the whole text block can be grabbed, not only the thin strokes
            try {
              const bb = el.getBBox();
              const hit = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
              ['x', 'y', 'width', 'height'].forEach((k) => hit.setAttribute(k, bb[k]));
              hit.setAttribute('fill', 'transparent');
              el.prepend(hit);
            } catch (err) {}
            el.addEventListener('pointerdown', (e) => {
              if (isSpaceDown || e.button !== 0) return;
              if (!deselected && lid === selectedLayerId && targetLayer) return; // its own move handler runs
              const lyr = design.layers.find((l) => l.id === lid);
              if (!lyr) return;
              e.preventDefault();
              e.stopPropagation();
              const other = lid !== selectedLayerId;
              deselected = false;
              selectedLayerId = lid;
              activePart = lyr.part;
              syncPartChips();
              const step = STEPS.findIndex((x) => x.id === (lyr.type === 'text' ? 'text' : 'graphics'));
              if (activeStepIdx !== step) goToStep(step);
              else {
                render2DCanvas();
                if (other) renderStepPanel();
              }
              // hand the press over to the fresh blue frame so the drag goes on
              const grip = holder.querySelector('.cl-transform-gizmo .gizmo-hit');
              if (grip) grip.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: e.clientX, clientY: e.clientY, button: 0, pointerId: e.pointerId, pointerType: e.pointerType }));
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

          const TITLES = {
            model: t('ui.chooseModel'),
            colors: t('ui.chooseColor'),
            text: t('ui.addText'),
            graphics: t('ui.addLogo'),
          };

          stepHeader.innerHTML = '';
          stepHeader.append(CL.h('h1.sr-only', { text: TITLES[step.id] }));

          // Same step again (a choice was made): swap the content in place — no fade, same scroll position
          const same = shownStep === step.id;
          const keepScroll = same ? stepBody.scrollTop : 0;
          shownStep = step.id;
          stepBody.classList.toggle('is-still', same);
          stepBody.innerHTML = '';
          if (step.id === 'colors') buildColorStep();
          else if (step.id === 'text') buildTextStep();
          else if (step.id === 'graphics') buildLogoStep();
          stepBody.scrollTop = keepScroll;

          // Clean Footer Navigation
          stepFooter.innerHTML = '';
          // Back always exists: on the first Studio step it returns to the shape picker
          const backBtn = CL.h('button.btn.btn-outline', {
            html: CL.icon('arrowLeft'),
            'aria-label': t('common.back'),
            onclick: () => (activeStepIdx > 0 ? goToStep(activeStepIdx - 1) : CL.go('#/design')),
          });

          let nextBtn;
          if (activeStepIdx < STEPS.length - 1) {
            const nextStep = STEPS[activeStepIdx + 1];
            nextBtn = CL.h('button.btn.btn-primary.studio-next-btn', {
              html: `<span>${t('common.next')}</span>`,
              onclick: () => goToStep(activeStepIdx + 1),
            });
          } else {
            nextBtn = CL.h('button.btn.btn-primary.studio-next-btn', {
              html: CL.icon('download') + `<span>${t('ui.exportDesign')}</span>`,
              onclick: () => {
                saveNow();
                CL.openExport(design);
              },
            });
          }

          if (backBtn) stepFooter.append(backBtn);
          stepFooter.append(nextBtn);
        }

        // ======================================================
        // STEP 02: COLOR & FINISH (FIGMA FILL + MATERIAL)
        // ======================================================
        // Which colour of a 2-colour surface the palette edits (kept across panel re-renders)
        let colorSlot = 0;
        // the six looks people pick most: clear tint, classic red, black luxe, nude, cocoa nude, all white
        const COMBOS = ['cherry-jelly', 'red-cap', 'noir-cherry', 'soft-bun', 'cocoa-milk', 'porcelain-rose'];
        const isGradientSurface = (s) => s === 'solid-gradient' || s === 'clear-gradient';
        const stopEntry = (s) => CL.pantone.of({ color: s.c, pantone: s.pantone });

        function buildColorStep() {
          const curPart = design.parts[activePart] || (design.parts[activePart] = { fill: CL.pantone.fillFor(CL.pantone.byCode.get('7418 C')), finish: 'matte' });
          const surface = curPart.surface || 'solid';
          const partName = t(activePart === 'base' ? 'flow.body' : 'flow.cap');

          // Current colour(s) as Pantone entries
          const stops = curPart.fill && curPart.fill.type === 'linear' ? curPart.fill.stops : null;
          const colours = stops ? [stopEntry(stops[0]), stopEntry(stops[stops.length - 1])] : [CL.pantone.of(curPart.fill), CL.pantone.of(curPart.fill)];
          // solid · gradient · clear (clear plastic with no colour at all)
          const allClear = colours[0].code === 'Clear' && colours[1].code === 'Clear';
          const mode = !isGradientSurface(surface) ? 'solid' : surface === 'clear-gradient' && allClear ? 'clear' : 'gradient';
          const twoColour = mode === 'gradient';
          if (!twoColour) colorSlot = 0;
          // Clear body: the palette picks the lip colour that fills it (none = empty)
          const productMode = mode === 'clear' && activePart === 'base';
          const product = productMode && curPart.product ? CL.pantone.of({ color: curPart.product.color, pantone: curPart.product.pantone }) : null;
          const current = productMode ? (product || CL.pantone.byCode.get('Clear')) : colours[colorSlot] || colours[0];

          const toSolid = (p) => CL.pantone.fillFor(p);
          // keeps the blend range the slider set when the colours change
          const range = stops ? [+stops[0].o || 0, stops[stops.length - 1].o == null ? 1 : +stops[stops.length - 1].o] : [0, 1];
          const toLinear = (a, b) => ({ type: 'linear', angle: 180, stops: [{ o: range[0], c: a.screen, pantone: a.code }, { o: range[1], c: b.screen, pantone: b.code }] });
          const commit = () => { pushHistory(); syncPartChips(); render2DCanvas(); renderStepPanel(); };

          // 0. Ready-made colour pairings (cap + body in one tap), taken from the Archive designs
          const same = (a, b) => ['cap', 'base'].every((k) => (a[k].surface || 'solid') === (b[k].surface || 'solid') && CL.pantone.describeFill(a[k].fill) === CL.pantone.describeFill(b[k].fill));
          const comboRow = CL.h('div.combo-grid', null,
            COMBOS.map((id) => {
              const preview = CL.templates.createDesign(id, design.model);
              preview.layers = [];
              const on = same(preview.parts, design.parts);
              return CL.h('button.surface-card' + (on ? '.is-active' : ''), {
                type: 'button',
                title: t('templates.' + id),
                'aria-label': t('templates.' + id),
                'aria-pressed': String(on),
                onclick: () => {
                  design.parts = CL.clone(preview.parts);
                  colorSlot = 0;
                  commit();
                },
              },
                CL.h('span.surface-thumb', { html: CL.render.renderTight(preview, { width: 34, shadow: false }) })
              );
            })
          );

          // Solid or gradient. Clear / shimmer looks come from the ready-made designs and stay
          // until the customer switches kind.
          const visible = colours[0].code === 'Clear' ? colours[1] : colours[0];
          const modeRow = CL.h('div.fg-seg', { role: 'radiogroup', 'aria-label': t('ui.colourStyle') },
            [['solid', t('ui.solid')], ['gradient', t('ui.gradient')]].map(([id, label]) => CL.h('button.fg-seg-btn' + (id === mode ? '.is-active' : ''), {
              type: 'button',
              role: 'radio',
              'aria-checked': String(id === mode),
              text: label,
              onclick: () => {
                if (id === mode) return;
                if (id === 'gradient') {
                  curPart.fill = toLinear(colours[0], CL.pantone.byCode.get(colours[0].code === '7430 C' ? '186 C' : '7430 C'));
                  curPart.surface = 'solid-gradient';
                } else if (id === 'clear') {
                  // clear plastic, no colour
                  const c = CL.pantone.byCode.get('Clear');
                  curPart.fill = toLinear(c, c);
                  curPart.surface = 'clear-gradient';
                } else {
                  curPart.fill = toSolid(visible.code === 'Clear' ? CL.pantone.byCode.get('White') : visible);
                  curPart.surface = 'solid';
                }
                colorSlot = 0;
                commit();
              },
            })));

          // 3. Two colours: named by where they sit on the part, next to a picture of the blend
          const END = [t('ui.bottom'), t('ui.top')];
          // transparent reads as white with a red slash, like a 'no colour' swatch
          const SLASH = 'linear-gradient(135deg, transparent calc(50% - 1px), #e0352b calc(50% - 1px), #e0352b calc(50% + 1px), transparent calc(50% + 1px)), #fff';
          const swatch = (p) => (p && p.code === 'Clear' ? SLASH : p.screen);
          // The blend bar is the slider: drag the two handles to set where the blend starts and ends
          const blendSlider = () => {
            const bar = CL.h('div.blend-bar');
            const handles = [];
            const paint = () => {
              const [a, b] = curPart.fill.stops.map((x) => x.o);
              bar.style.background = `linear-gradient(to top, ${colours[0].screen} ${a * 100}%, ${colours[1].screen} ${b * 100}%)`;
              handles.forEach((h, i) => {
                h.style.bottom = `${curPart.fill.stops[i].o * 100}%`;
                h.setAttribute('aria-valuenow', String(Math.round(curPart.fill.stops[i].o * 100)));
              });
            };
            const set = (i, v) => {
              const st = curPart.fill.stops;
              v = Math.round(CL.clamp(v, 0, 1) * 100) / 100;
              st[i].o = i === 0 ? Math.min(v, st[1].o - 0.05) : Math.max(v, st[0].o + 0.05);
              paint(); syncPartChips(); render2DCanvas();
            };
            [0, 1].forEach((i) => {
              const h = CL.h('span.blend-handle', {
                role: 'slider', tabindex: '0',
                'aria-label': END[i], 'aria-valuemin': '0', 'aria-valuemax': '100',
              });
              h.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                h.setPointerCapture(e.pointerId);
                h.classList.add('is-drag');
                const box = bar.getBoundingClientRect();
                const move = (ev) => set(i, (box.bottom - ev.clientY) / box.height);
                const up = () => { h.removeEventListener('pointermove', move); h.classList.remove('is-drag'); commit(); };
                h.addEventListener('pointermove', move);
                h.addEventListener('pointerup', up, { once: true });
                h.addEventListener('pointercancel', up, { once: true });
              });
              h.addEventListener('keydown', (e) => {
                const d = { ArrowUp: 0.05, ArrowRight: 0.05, ArrowDown: -0.05, ArrowLeft: -0.05 }[e.key];
                if (!d) return;
                e.preventDefault();
                set(i, curPart.fill.stops[i].o + d);
                pushHistory();
              });
              handles.push(h);
            });
            bar.append(...handles);
            paint();
            return bar;
          };
          const slotSwitch = twoColour
            ? CL.h('div.blend', null,
                blendSlider(),
                CL.h('div.blend-ends', { role: 'radiogroup', 'aria-label': t('ui.colourToChange') },
                  [1, 0].map((i) => CL.h('button.colour-slot' + (colorSlot === i ? '.is-active' : ''), {
                    type: 'button',
                    role: 'radio',
                    'aria-checked': String(colorSlot === i),
                    onclick: () => { colorSlot = i; renderStepPanel(); },
                  },
                    CL.h('i', { style: { background: swatch(colours[i]) } }),
                    CL.h('span', { text: END[i] }),
                    CL.h('strong', { text: CL.pantone.label(colours[i]) })
                  ))),
                CL.h('button.icon-btn.sm', {
                  type: 'button',
                  title: t('ui.swap'),
                  'aria-label': t('ui.swap'),
                  html: CL.icon('flipV'),
                  onclick: () => { curPart.fill = toLinear(colours[1], colours[0]); commit(); },
                }))
            : null;
          // 4. Pantone palette (grouped); a chip sets the whole colour, or the active slot of a gradient
          const setColour = (p) => {
            if (twoColour) {
              const next = [colours[0], colours[1]];
              next[colorSlot] = p;
              curPart.fill = toLinear(next[0], next[1]);
              // only a transparent end is see-through: two colours make solid plastic
              if (!next.some((c) => c.code === 'Clear')) curPart.surface = 'solid-gradient';
            } else if (productMode) {
              curPart.product = { color: p.screen, pantone: p.code };
            } else {
              curPart.fill = toSolid(p);
              // a clear cap given a colour is solid plastic again (shimmer stays shimmer)
              if (isGradientSurface(curPart.surface)) curPart.surface = 'solid';
            }
          };
          const pick = (p) => { setColour(p); commit(); };
          const partPicker = CL.PantonePicker({
            value: current,
            onInput: (p) => { setColour(p); syncPartChips(); render2DCanvas(); },
            onCommit: commit,
          });
          const label = (p) => `${CL.pantone.label(p)}${p.name && !p.material ? ' — ' + p.name : ''}`;
          // "No colour" = clear plastic: on a solid part it makes the part clear,
          // on a gradient it makes that end fade into clear
          const CLEAR = CL.pantone.byCode.get('Clear');
          const noneOn = !!(current && current.code === 'Clear');
          const noneDot = CL.h('button.dot.dot-none' + (noneOn ? '.is-active' : ''), {
            type: 'button',
            title: t('ui.transparentLabel'),
            'aria-label': t('ui.transparent'),
            'aria-pressed': String(noneOn),
            onclick: () => {
              if (productMode) {
                delete curPart.product; // empty clear body: the wand shows
              } else if (twoColour) {
                const next = [colours[0], colours[1]];
                next[colorSlot] = CLEAR;
                curPart.fill = toLinear(next[0], next[1]);
                curPart.surface = 'clear-gradient';
              } else {
                if (activePart === 'base') {
                  const keep = ['White', 'Clear'].includes(visible.code) ? null : visible;
                  if (keep) curPart.product = { color: keep.screen, pantone: keep.code };
                  CL.pantone.normalizeDesign(design);
                }
                curPart.fill = toLinear(CLEAR, CLEAR);
                curPart.surface = 'clear-gradient';
              }
              commit();
            },
          });
          const palette = CL.h('div.dots', null, noneDot,
            CL.pantone.LIST.filter((p) => (p.group === 'tint' || p.group === 'pack') && p.code !== 'Clear' && !(productMode && p.material)).map((p) => {
              const on = !!(current && current.code === p.code);
              return CL.h('button.dot' + (on ? '.is-active' : ''), {
                type: 'button', title: label(p), 'aria-label': label(p), 'aria-pressed': String(on),
                style: { '--c': p.screen },
                onclick: () => pick(p),
              });
            }));

          // One quiet line; the full text opens on tap (it is also on the last step and on the PDF)
          const note = CL.h('details.color-note-mini', null,
            CL.h('summary', { text: t('flow.noteTitle') }),
            CL.h('p', { text: t('flow.disclaimer') })
          );

          stepBody.append(
            CL.h('div.fg-section', null,
              comboRow
            ),
            CL.h('div.fg-section', null,
              CL.h('div.fg-section-head', null,
                twoColour ? null : CL.h('span.font-current', { text: CL.pantone.label(current) })
              ),
              modeRow,
              slotSwitch,
              mode === 'clear' && !productMode ? null : palette,
              mode === 'clear' && !productMode ? null : partPicker,
              note
            )
          );
        }

        // ======================================================
        // STEP 03: TEXT — FIGMA UI3 POSITION + TYPOGRAPHY + FILL
        // ======================================================
        function buildTextStep() {
          const targetPart = activePart === 'cap' ? 'cap' : 'base';

          const texts = design.layers.filter((l) => l.type === 'text' && l.part === targetPart);
          let curLayer = texts.find((l) => l.id === selectedLayerId) || texts[0];
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
              // Readable ink on this part's colour, at a size that fits
              const bg = CL.pantone.of(design.parts[targetPart] && design.parts[targetPart].fill);
              const [cr, cg, cb] = [1, 3, 5].map((i) => parseInt((bg ? bg.screen : '#000000').slice(i, i + 2), 16));
              const ink = CL.pantone.byCode.get(cr * 0.299 + cg * 0.587 + cb * 0.114 > 165 ? 'Black 6 C' : 'Opaque White');
              if (ink) Object.assign(curLayer.text, { color: ink.screen, pantone: ink.code });
              applyLevel(curLayer, 'm');
              design.layers.push(curLayer);
              selectedLayerId = curLayer.id;
            }
            return curLayer;
          }

          /** Keep the chosen size level; text sized by hand only shrinks when it no longer fits. */
          function refit(lyr) {
            if (lyr.free) return; // sized by hand: keep exactly that size
            if (lyr.fit) applyLevel(lyr, lyr.fit);
            else if (lyr.text.size > maxFit(lyr)) applyLevel(lyr, 'l');
            else keepInside(lyr);
          }

          // --- SECTION 1: CONTENT ---
          const deleteTextBtn = CL.h('button.fg-action-btn.is-danger', {
            type: 'button',
            title: (t('ui.deleteText')) + ' (Delete)',
            html: CL.icon('trash') + `<span>${t('common.delete')}</span>`,
            onclick: () => removeLayer(curLayer),
          });

          const textInput = CL.h('input.fg-text-input', {
            'aria-label': t('ui.text'),
            value: curLayer ? curLayer.text.content : '',
            placeholder: t('ui.textPlaceholder'),
            oninput: () => {
              const val = textInput.value;
              if (!val.trim() && curLayer) {
                design.layers = design.layers.filter((l) => l.id !== curLayer.id);
                curLayer = null;
                selectedLayerId = null;
                render2DCanvas();
                return;
              }
              const isNew = !curLayer;
              const lyr = ensureTextLayer(val);
              lyr.text.content = val;
              lyr.name = val;
              refit(lyr);
              render2DCanvas();
              if (isNew) {
                // Show the remaining controls without losing the cursor
                renderStepPanel();
                const again = stepBody.querySelector('.fg-text-input');
                again.focus();
                again.setSelectionRange(again.value.length, again.value.length);
              }
            },
            onchange: () => { pushHistory(); renderStepPanel(); },
          });

          const contentSection = CL.h('div.fg-section', null,
            CL.h('div.fg-section-head', null,
              curLayer ? deleteTextBtn : null
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
            title: t('ui.hPos'),
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
            title: t('ui.vPos'),
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
            'aria-label': t('ui.rotation'),
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
            title: t('ui.rotationAngle'),
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

          const layoutSection = curLayer ? CL.h('div.fg-section', null,
            sizeRow(curLayer),
            choiceRow(t('ui.direction'), [['v', t('ui.vertical')], ['h', t('ui.horizontal')]],
              isVertical(curLayer) ? 'v' : 'h', (id) => {
                curLayer.rotation = id === 'v' ? -90 : 0;
                refit(curLayer);
              }),
            spotRow(curLayer)
          ) : null;

          // --- SECTION 3: TYPOGRAPHY (FIGMA TYPOGRAPHY BLOCK) ---
          const currentFont = curLayer ? curLayer.text.font : 'Plus Jakarta Sans';
          // Scrolling font list: name on the left, the customer's own text on the right
          const sample = (curLayer && curLayer.text.content.split('\n')[0].trim().slice(0, 14)) || 'Coslab';
          const pickFont = (font) => {
            const lyr = ensureTextLayer(textInput.value || 'COSLAB');
            lyr.text.font = font;
            refit(lyr);
            pushHistory();
            render2DCanvas();
            renderStepPanel();
            const row = stepBody.querySelector('.font-row.is-active');
            if (row) row.focus({ preventScroll: true });
            // Measure again once the real letter shapes are there
            CL.fonts.ready(lyr.text).then(() => {
              if (!root.isConnected || lyr.text.font !== font || !design.layers.includes(lyr)) return;
              refit(lyr);
              history[historyIdx] = CL.clone(design);
              persistDraft();
              render2DCanvas();
            });
          };
          const fontList = CL.h('div.font-list', { role: 'group', 'aria-label': t('ui.fonts') },
            CL.fonts.GROUPS.map((g) => CL.h('section', null,
              g.fonts.map((font) => CL.h('button.font-row' + (currentFont === font ? '.is-active' : ''), {
                type: 'button',
                'data-font': font,
                'aria-pressed': String(currentFont === font),
                onclick: () => pickFont(font),
              },
                CL.h('span.font-row-name', { text: font }),
                CL.h('span.font-row-sample', { text: sample, 'aria-hidden': 'true' })))
            )),
            CL.h('p.font-none', { text: t('ui.noFont') })
          );
          // Load a font file only when its row comes into view
          const showFont = (row) => { shownFonts.add(row.dataset.font); row.querySelector('.font-row-sample').style.fontFamily = `'${row.dataset.font}', sans-serif`; };
          const rows = [...fontList.querySelectorAll('.font-row')];
          if ('IntersectionObserver' in window) {
            const io = new IntersectionObserver((entries) => {
              entries.forEach((e) => { if (e.isIntersecting) { showFont(e.target); io.unobserve(e.target); } });
            }, { root: fontList, rootMargin: '80px' });
            rows.forEach((row) => (shownFonts.has(row.dataset.font) ? showFont(row) : io.observe(row)));
          } else rows.forEach(showFont);

          const filterFonts = () => {
            const q = fontQuery.trim().toLowerCase();
            let any = false;
            fontList.querySelectorAll('section').forEach((sec) => {
              let hit = false;
              sec.querySelectorAll('.font-row').forEach((row) => {
                const on = row.dataset.font.toLowerCase().includes(q);
                row.hidden = !on;
                hit = hit || on;
              });
              sec.hidden = !hit;
              any = any || hit;
            });
            fontList.classList.toggle('is-empty', !any);
          };
          const fontSearch = CL.h('input.font-search', {
            type: 'search',
            value: fontQuery,
            placeholder: t('ui.searchFonts'),
            'aria-label': t('ui.searchFonts'),
            oninput: () => { fontQuery = fontSearch.value; fontList.scrollTop = 0; filterFonts(); },
          });
          filterFonts();
          fontList.addEventListener('scroll', () => { fontScroll = fontList.scrollTop; }, { passive: true });
          // Up / Down walk through the list instead of nudging the text on the tube
          fontList.addEventListener('keydown', (e) => {
            if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
            e.preventDefault();
            e.stopPropagation();
            const seen = rows.filter((r) => !r.hidden);
            const next = seen[seen.indexOf(document.activeElement) + (e.key === 'ArrowDown' ? 1 : -1)];
            if (next) next.focus();
          });
          const placeFontList = () => {
            if (fontScroll === null) { // first time: bring the current font into view
              const cur = fontList.querySelector('.is-active');
              fontScroll = cur ? Math.max(0, cur.offsetTop - 2 * cur.offsetHeight) : 0;
            }
            fontList.scrollTop = fontScroll;
          };

          const curSize = curLayer ? Math.round(curLayer.text.size || 13) : 13;
          const curSpacing = curLayer ? Math.round(curLayer.text.spacing ?? 3) : 3;

          const sizeSlider = CL.h('input.fg-range#studioLayerSizeSlider', {
            'aria-label': t('ui.fontSize'),
            type: 'range',
            min: '8',
            max: '100',
            step: '1',
            value: String(curSize),
            oninput: () => {
              const lyr = ensureTextLayer(textInput.value || 'COSLAB');
              const val = parseInt(sizeSlider.value, 10);
              lyr.text.size = val;
              delete lyr.fit;
              lyr.free = true;
              sizeField.input.value = String(val);
              render2DCanvas();
            },
            onchange: pushHistory,
          });

          const sizeField = createFigmaScrubField({
            id: 'fgInputSize',
            prefix: 'Aa',
            title: t('ui.fontSizePx'),
            value: curSize,
            min: 8,
            max: 100,
            step: 1,
            unit: 'px',
            scrubScale: 0.25,
            showSteppers: true,
            onInput: (v) => {
              const lyr = ensureTextLayer(textInput.value || 'COSLAB');
              lyr.text.size = v;
              delete lyr.fit;
              lyr.free = true;
              sizeSlider.value = String(v);
              render2DCanvas();
            },
            onCommit: pushHistory,
          });

          const spacingField = createFigmaScrubField({
            id: 'fgInputSpacing',
            prefix: '↔',
            title: t('ui.letterSpacing'),
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
                { w: 400, label: t('ui.wRegular') },
                { w: 600, label: t('ui.wSemiBold') },
                { w: 700, label: t('ui.wBold') },
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
                title: t('editor.text.italic'),
                'aria-label': t('editor.text.italic'),
                'aria-pressed': String(curItalic),
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
            fontSearch,
            fontList
          );

          // --- SECTION 4: TEXT COLOUR — Pantone print colours only (no HEX) ---
          const TEXT_CODES = ['Opaque White', 'Black 6 C', '871 C', '877 C', 'Cool Gray 1 C', '4685 C', '7430 C', '7427 C'];
          const curTxt = CL.pantone.of(curLayer ? { color: curLayer.text.color, pantone: curLayer.text.pantone } : '#ffffff', { ink: true });
          const curOpacity = Math.round((curLayer ? (curLayer.opacity ?? 1) : 1) * 100);

          const opacityInput = CL.h('input.fg-num-input', {
            'aria-label': t('ui.opacity'),
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

          const fillBar = CL.h('div.pt-selected.is-compact', null,
            CL.h('i.pt-selected-swatch', { style: { background: curTxt.screen } }),
            CL.h('div.pt-selected-text', null,
              CL.h('span.pt-selected-label', { text: t('flow.colorCode') }),
              CL.h('strong.pt-selected-code', { text: CL.pantone.label(curTxt) })
            ),
            CL.h('div.fg-opacity-wrap', { title: t('ui.opacity') },
              opacityInput,
              CL.h('span.fg-unit', { text: '%' })
            )
          );

          const txtColorRow = CL.h('div.dots', null,
            TEXT_CODES.map((code) => CL.pantone.byCode.get(code)).filter(Boolean).map((p) =>
              CL.h('button.dot' + (curTxt.code === p.code ? '.is-active' : ''), {
                type: 'button',
                title: `${CL.pantone.label(p)} — ${p.name}`,
                'aria-label': CL.pantone.label(p),
                'aria-pressed': String(curTxt.code === p.code),
                style: { '--c': p.screen },
                onclick: () => {
                  const lyr = ensureTextLayer(textInput.value || 'COSLAB');
                  lyr.text.color = p.screen;
                  lyr.text.pantone = p.code;
                  pushHistory();
                  render2DCanvas();
                  renderStepPanel();
                },
              }))
          );

          const textPicker = CL.PantonePicker({
            value: curTxt,
            ink: true,
            onInput: (p) => {
              const lyr = ensureTextLayer(textInput.value || 'COSLAB');
              lyr.text.color = p.screen;
              lyr.text.pantone = p.code;
              render2DCanvas();
            },
            onCommit: () => { pushHistory(); renderStepPanel(); },
          });

          const fillSection = CL.h('div.fg-section', null,
            CL.h('div.fg-section-head', null,
              CL.h('span.font-current', { text: CL.pantone.label(curTxt) })
            ),
            txtColorRow,
            textPicker
          );

          stepBody.append(contentSection);
          if (!curLayer) {
            return;
          }
          stepBody.append(typoSection, layoutSection, fillSection, advancedBox(
            CL.h('div.fg-grid-2', null, xField.el, yField.el),
            CL.h('div.fg-row', null,
              CL.h('div', { style: { flex: '0.9', minWidth: 0 } }, rotField.el),
              rotSeg
            ),
            rotSlider,
            CL.h('div.fg-grid-2', null, sizeField.el, spacingField.el),
            sizeSlider,
            styleBar,
            fillBar
          ));
          placeFontList();
        }

        // ======================================================
        // STEP 04: LOGO — FIGMA UPLOAD + TRANSFORM + MARKS
        // ======================================================
        function buildLogoStep() {
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
                    w: 54,
                    h: (54 * res.h) / res.w,
                  },
                };
                applyLevel(newLayer, 'm');
                design.layers.push(newLayer);
                selectedLayerId = newLayer.id;
                pushHistory();
                render2DCanvas();
                renderStepPanel();
              } catch (err) {
                console.error(err);
                CL.toast(t('ui.uploadFailed'), 'info');
              } finally {
                fileIn.value = ''; // picking the same file again fires change again
              }
            },
          });

          const uploadBox = CL.h('button.studio-upload-dropzone', {
            type: 'button',
            onclick: () => fileIn.click(),
          },
            CL.h('div.upload-icon-circle', { html: CL.icon('upload') }),
            CL.h('strong', { text: t('ui.uploadLogo') }),
            CL.h('span', { text: t('ui.uploadHint') })
          );

          const uploadSection = CL.h('div.fg-section', null,
            uploadBox,
            fileIn
          );

          // Only a logo on the part being edited (the Cap tab never edits the Body's logo)
          const curGraphic = design.layers.find((l) => l.id === selectedLayerId && l.part === targetPart && l.type !== 'text')
            || design.layers.find((l) => l.part === targetPart && (l.type === 'image' || l.type === 'shape'));

          let graphicSection = null;
          if (curGraphic) {
            selectedLayerId = curGraphic.id;
            const isImg = curGraphic.type === 'image';
            const curScale = isImg ? Math.round(curGraphic.image.w) : Math.round(curGraphic.shape.w);
            const curRot = Math.round(curGraphic.rotation || 0);
            const curPctX = Math.round((curGraphic.x ?? 0.5) * 100);
            const curPctY = Math.round((curGraphic.y ?? 0.5) * 100);

            const applyScale = (v) => {
              delete curGraphic.fit;
              curGraphic.free = true;
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
              max: 190,
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
              'aria-label': t('ui.logoSize'),
              type: 'range',
              min: '14',
              max: '190',
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
              'aria-label': t('ui.rotation'),
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
              sizeRow(curGraphic),
              spotRow(curGraphic),
              advancedBox(
                CL.h('div.fg-grid-2', null, gxField.el, gyField.el),
                CL.h('div.fg-grid-2', null, gwField.el, gRotField.el),
                scaleSlider,
                gRotSlider
              ),
              CL.h('div.fg-row', { style: { marginTop: '4px' } },
                isImg ? CL.h('button.btn.btn-primary', {
                  style: { flex: 1, height: '40px', fontSize: '13.5px', borderRadius: '10px' },
                  text: t('ui.removeBg'),
                  onclick: async () => {
                    try {
                      curGraphic.image.src = await CL.removeWhiteBackground(curGraphic.image.src, 236, 20);
                      pushHistory();
                      render2DCanvas();
                    } catch (err) {
                      console.error(err);
                      CL.toast(t('ui.removeBgFailed'), 'info');
                    }
                  },
                }) : null,
                CL.h('button.btn.btn-outline', {
                  style: { color: 'var(--danger)', height: '40px', fontSize: '13.5px', borderRadius: '10px', flex: isImg ? '0 0 auto' : '1' },
                  html: CL.icon('trash') + `<span>${t('ui.remove')}</span>`,
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

          stepBody.append(uploadSection);
          if (graphicSection) stepBody.append(graphicSection);
          stepBody.append(buildSummarySection());
        }

        // Final-step recap: every colour by Pantone code + the on-screen colour disclaimer
        function buildSummarySection() {
          const m = CL.models.getModel(design.model);
          const partRow = (part) => {
            const p = design.parts[part] || {};
            const pt = CL.pantone.of(p.fill);
            return CL.h('div.flow-summary-row', null,
              CL.h('i', { style: { background: pt ? pt.screen : '#ccc' } }),
              CL.h('span', { text: t(part === 'cap' ? 'flow.cap' : 'flow.body') }),
              CL.h('strong', { text: `${t(CL.pantone.surfaceKey(p))} · ${CL.pantone.describeFill(p.fill)}` })
            );
          };
          const textLayers = (design.layers || []).filter((l) => l.type === 'text' && l.visible !== false);
          const inkCodes = [...new Set(textLayers.map((l) => CL.pantone.label(CL.pantone.of({ color: l.text.color, pantone: l.text.pantone }, { ink: true }))))];

          return CL.h('div.fg-section', null,
            CL.h('div.flow-summary', null,
              CL.h('div.flow-summary-row', null,
                CL.h('span', { text: t('landing.step1') }),
                CL.h('strong', { text: m.name })
              ),
              partRow('cap'),
              partRow('base'),
              inkCodes.length
                ? CL.h('div.flow-summary-row', null,
                    CL.h('span', { text: t('landing.step3') }),
                    CL.h('strong', { text: inkCodes.join(', ') }))
                : null
            ),
            CL.h('div.color-note', { role: 'note' },
              CL.h('strong', { text: t('flow.noteTitle') }),
              CL.h('p', { text: t('flow.disclaimer') })
            )
          );
        }

        function refreshAll() {
          syncPartChips();
          render2DCanvas();
          renderStepPanel();
        }

        refreshAll();
        updateUndoRedoUI();
        // Using the panel selects the text / logo again
        stepBody.addEventListener('pointerdown', reselect);
        stepBody.addEventListener('focusin', reselect);

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

          // Space on a focused button or link presses it; only elsewhere does it start panning
          const onControl = !!ae?.closest?.('button, a[href], summary, [role="slider"], [role="radio"]');
          if (e.code === 'Space' && !isSpaceDown && !onControl) {
            isSpaceDown = true;
            canvasContainer.style.cursor = 'grab';
            e.preventDefault();
            return;
          }

          // Delete the selected text / logo
          if ((e.key === 'Delete' || e.key === 'Backspace') && activeView === '2d' && STEPS[activeStepIdx].id !== 'colors') {
            const lyr = getActiveTargetLayer();
            if (lyr) {
              e.preventDefault();
              removeLayer(lyr);
            }
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
