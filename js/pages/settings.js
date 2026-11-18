/* ==========================================================
   COSLAB — Settings Page (2-Column Bento Grid Architecture)
   Concise controls, live auto-save, zero prose clutter.
   ========================================================== */
(function (CL) {
  CL.pages = CL.pages || {};

  CL.pages.settings = {
    titleKey: 'nav.settings',
    appMode: false,

    render(container) {
      const s = CL.store.settings;

      const root = CL.h('div.page.container', { style: { paddingBottom: '72px' } });

      // Page Header
      const head = CL.h('div.page-head', null,
        CL.h('div.page-head-row', null,
          CL.h('h1', { text: t('settings.title') }),
          CL.h('span.mono.muted', { text: t('settings.subtitle') })
        )
      );

      const grid = CL.h('div.settings-bento-grid');

      // Helper to build a smart toggle switch
      function createSwitch(initialVal, onChange) {
        let val = !!initialVal;
        const btn = CL.h('button.smart-switch' + (val ? '.is-on' : ''), {
          type: 'button',
          role: 'switch',
          'aria-checked': val ? 'true' : 'false',
          onclick: () => {
            val = !val;
            btn.classList.toggle('is-on', val);
            btn.setAttribute('aria-checked', val ? 'true' : 'false');
            onChange(val);
          },
        });
        return btn;
      }

      // 1. Language Selection (Full-width or top card)
      const langSection = CL.h('div.settings-section.bento-full', null,
        CL.h('div.hero-meta-row', null,
          CL.h('h3.setting-title', { text: '01 / LANGUAGE' }),
          CL.h('span.mono.muted', { text: '8 REGIONS' })
        ),
        CL.h('div.lang-grid-pills', null,
          I18N.LANGS.map((l) =>
            CL.h('button.chip' + (l.code === I18N.lang ? '.is-active' : ''), {
              html: `<span>${l.name}</span> <span class="mono" style="opacity: 0.55; margin-left: 4px;">${l.code.toUpperCase()}</span>`,
              onclick: () => {
                CL.setLang(l.code);
              },
            })
          )
        )
      );

      // 2. 3D Engine Controls (Col 1)
      const engineSection = CL.h('div.settings-section', null,
        CL.h('div.hero-meta-row', null,
          CL.h('h3.setting-title', { text: '02 / 3D ENGINE' }),
          CL.h('span.mono.muted', { text: 'WEBGL PBR' })
        ),
        CL.h('div.setting-list', null,
          CL.h('div.setting-row', null,
            CL.h('div.setting-info', null,
              CL.h('h4', { text: 'Auto-Rotate 360°' }),
              CL.h('span.mono.muted', { text: 'IDLE TURNTABLE' })
            ),
            createSwitch(s.autoRotate3D !== false, (v) => {
              CL.store.saveSettings({ autoRotate3D: v });
              CL.toast(t('settings.savedToast'));
            })
          ),
          CL.h('div.setting-row', null,
            CL.h('div.setting-info', null,
              CL.h('h4', { text: 'PBR Reflections' }),
              CL.h('span.mono.muted', { text: 'MATTE · GLASS · CHROME' })
            ),
            createSwitch(s.highQuality3D !== false, (v) => {
              CL.store.saveSettings({ highQuality3D: v });
              CL.toast(t('settings.savedToast'));
            })
          ),
          CL.h('div.setting-row', null,
            CL.h('div.setting-info', null,
              CL.h('h4', { text: 'Studio Soft Bloom' }),
              CL.h('span.mono.muted', { text: 'AMBIENT DIFFUSION' })
            ),
            createSwitch(s.studioBloom !== false, (v) => {
              CL.store.saveSettings({ studioBloom: v });
              CL.toast(t('settings.savedToast'));
            })
          )
        )
      );

      // 3. Export Specs (Col 2)
      const exportSection = CL.h('div.settings-section', null,
        CL.h('div.hero-meta-row', null,
          CL.h('h3.setting-title', { text: '03 / EXPORT SPECS' }),
          CL.h('span.mono.muted', { text: '1:1 PRINT' })
        ),
        CL.h('div.setting-list', null,
          CL.h('div.setting-row', null,
            CL.h('div.setting-info', null,
              CL.h('h4', { text: 'Resolution (DPI)' }),
              CL.h('span.mono.muted', { text: 'PDF SPEC OUTPUT' })
            ),
            CL.h('div.segmented', null,
              [150, 300, 600].map((dpi) =>
                CL.h('button' + ((s.exportDPI || 300) === dpi ? '.is-active' : ''), {
                  text: `${dpi}`,
                  onclick: (e) => {
                    CL.store.saveSettings({ exportDPI: dpi });
                    e.target.parentElement.querySelectorAll('button').forEach((b) => b.classList.remove('is-active'));
                    e.target.classList.add('is-active');
                    CL.toast(`${dpi} DPI`);
                  },
                })
              )
            )
          ),
          CL.h('div.setting-row', null,
            CL.h('div.setting-info', null,
              CL.h('h4', { text: 'Crop & Bleed Marks' }),
              CL.h('span.mono.muted', { text: 'SILK SCREEN / UV' })
            ),
            createSwitch(s.cropMarks !== false, (v) => {
              CL.store.saveSettings({ cropMarks: v });
              CL.toast(t('settings.savedToast'));
            })
          ),
          CL.h('div.setting-row', null,
            CL.h('div.setting-info', null,
              CL.h('h4', { text: 'Vector Outline' }),
              CL.h('span.mono.muted', { text: 'AI / CAD PATHS' })
            ),
            createSwitch(s.outlineVector !== false, (v) => {
              CL.store.saveSettings({ outlineVector: v });
              CL.toast(t('settings.savedToast'));
            })
          )
        )
      );

      // 4. Brand Credentials & Local Data (Full width 4-col grid)
      const author = s.author || {};
      const statusBadge = CL.h('span.pill-tag', { text: '✓ AUTO-SAVED' });

      const nameIn = CL.h('input.input', { value: author.name || '', placeholder: 'Designer' });
      const brandIn = CL.h('input.input', { value: author.brand || '', placeholder: 'Brand' });
      const emailIn = CL.h('input.input', { type: 'email', value: author.email || '', placeholder: 'contact@brand.com' });
      const phoneIn = CL.h('input.input', { type: 'tel', value: author.phone || '', placeholder: '+84...' });

      function saveAuthor() {
        CL.store.saveSettings({
          author: {
            name: nameIn.value.trim(),
            brand: brandIn.value.trim(),
            email: emailIn.value.trim(),
            phone: phoneIn.value.trim(),
          },
        });
        statusBadge.textContent = '✓ AUTO-SAVED';
      }

      [nameIn, brandIn, emailIn, phoneIn].forEach((inp) => {
        inp.addEventListener('change', () => {
          saveAuthor();
          CL.toast(t('settings.savedToast'));
        });
      });

      const authorSection = CL.h('div.settings-section.bento-full', null,
        CL.h('div.hero-meta-row', null,
          CL.h('h3.setting-title', { text: '04 / BRAND & VAULT' }),
          statusBadge
        ),
        CL.h('div.settings-brand-grid', null,
          CL.h('div.field', null, CL.h('label', { text: t('settings.name') }), nameIn),
          CL.h('div.field', null, CL.h('label', { text: t('settings.brand') }), brandIn),
          CL.h('div.field', null, CL.h('label', { text: t('settings.email') }), emailIn),
          CL.h('div.field', null, CL.h('label', { text: t('settings.phone') }), phoneIn)
        ),
        CL.h('div.settings-vault-actions', null,
          CL.h('button.btn.btn-sm.btn-outline', {
            text: 'Clear Cache',
            onclick: () => {
              CL.store.clearDraft();
              CL.toast(t('settings.savedToast'));
            },
          }),
          CL.h('button.btn.btn-sm.btn-outline', {
            text: 'Export JSON',
            onclick: () => {
              const data = {
                settings: CL.store.settings,
                designs: CL.store.listDesigns(),
                exportedAt: new Date().toISOString(),
              };
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              CL.download(url, 'coslab-vault.json');
              setTimeout(() => URL.revokeObjectURL(url), 2000);
            },
          }),
          CL.h('button.btn.btn-sm.btn-outline', {
            text: 'Import JSON',
            onclick: () => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.json,application/json';
              input.onchange = (e) => {
                const file = e.target.files && e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => {
                  try {
                    const parsed = JSON.parse(ev.target.result);
                    if (parsed.settings) CL.store.saveSettings(parsed.settings);
                    if (parsed.designs && Array.isArray(parsed.designs)) {
                      parsed.designs.forEach((d) => CL.store.saveDesign(d));
                    }
                    setTimeout(() => location.reload(), 300);
                  } catch (err) {}
                };
                reader.readAsText(file);
              };
              input.click();
            },
          }),
          CL.h('button.btn.btn-sm.btn-outline', {
            text: 'Reset',
            style: { color: 'var(--danger)' },
            onclick: async () => {
              const ok = await CL.confirm({
                title: 'Reset?',
                message: 'Restore default studio preferences?',
              });
              if (ok) {
                localStorage.removeItem('coslab.settings');
                setTimeout(() => location.reload(), 200);
              }
            },
          })
        )
      );

      grid.append(langSection, engineSection, exportSection, authorSection);
      root.append(head, grid);
      container.appendChild(root);

      return () => {};
    },
  };
})(window.CL);
