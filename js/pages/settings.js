/* ==========================================================
   COSLAB — Settings Page (Smart Minimalist K-Beauty Atelier)
   Featuring smart switches, segmented controls, live auto-save,
   language matrix and factory preferences.
   ========================================================== */
(function (CL) {
  CL.pages = CL.pages || {};

  CL.pages.settings = {
    titleKey: 'nav.settings',
    appMode: false,

    render(container) {
      const s = CL.store.settings;

      const root = CL.h('div.page.container', { style: { paddingBottom: '80px', maxWidth: '840px' } });

      // Page Header
      const head = CL.h('div.page-head', null,
        CL.h('div.hero-meta-row', null,
          CL.h('span.pill-tag', { text: 'ATELIER CONFIG' }),
          CL.h('span.index-num', { text: '(SETTINGS)' })
        ),
        CL.h('h1', { text: 'Studio Settings.', style: { fontSize: ' clamp(32px, 4vw, 48px)', fontWeight: '700', letterSpacing: '-0.03em' } })
      );

      const grid = CL.h('div', { style: { display: 'grid', gap: '24px' } });

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

      // 1. Language Selection (Smart Pills)
      const langSection = CL.h('div.settings-section', null,
        CL.h('div.hero-meta-row', { style: { marginBottom: '8px' } },
          CL.h('span.index-num', { text: '[ 01 / LANGUAGE ]' }),
          CL.h('span.mono', { text: '8 REGIONS' })
        ),
        CL.h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '8px' } },
          I18N.LANGS.map((l) =>
            CL.h('button.chip' + (l.code === I18N.lang ? '.is-active' : ''), {
              html: `<span>${l.name}</span> <span class="mono" style="opacity: 0.6; margin-left: 4px;">${l.code.toUpperCase()}</span>`,
              onclick: () => {
                CL.setLang(l.code);
              },
            })
          )
        )
      );

      // 2. 3D Engine & Viewport Controls (Smart Switches)
      const engineSection = CL.h('div.settings-section', null,
        CL.h('div.hero-meta-row', { style: { marginBottom: '6px' } },
          CL.h('span.index-num', { text: '[ 02 / 3D ENGINE ]' }),
          CL.h('span.mono', { text: 'WEBGL PBR' })
        ),
        CL.h('div', null,
          CL.h('div.setting-row', null,
            CL.h('div.setting-info', null,
              CL.h('h4', { text: 'Auto-Rotate 360°' }),
              CL.h('p', { text: 'Tự động quay nhẹ quanh trục khi ở trạng thái nghỉ' })
            ),
            createSwitch(s.autoRotate3D !== false, (v) => {
              CL.store.saveSettings({ autoRotate3D: v });
              CL.toast('Cập nhật tự động xoay 3D');
            })
          ),
          CL.h('div.setting-row', null,
            CL.h('div.setting-info', null,
              CL.h('h4', { text: 'High-Fidelity PBR Shading' }),
              CL.h('p', { text: 'Mô phỏng phản chiếu sương mờ và tráng gương kim loại' })
            ),
            createSwitch(s.highQuality3D !== false, (v) => {
              CL.store.saveSettings({ highQuality3D: v });
              CL.toast('Cập nhật chất lượng đồ họa PBR');
            })
          ),
          CL.h('div.setting-row', null,
            CL.h('div.setting-info', null,
              CL.h('h4', { text: 'Studio Soft Light Bloom' }),
              CL.h('p', { text: 'Hiệu ứng hào quang ánh sáng studio Hàn Quốc' })
            ),
            createSwitch(s.studioBloom !== false, (v) => {
              CL.store.saveSettings({ studioBloom: v });
              CL.toast('Cập nhật hiệu ứng ánh sáng Studio');
            })
          )
        )
      );

      // 3. Manufacturing & Export Preferences
      const exportSection = CL.h('div.settings-section', null,
        CL.h('div.hero-meta-row', { style: { marginBottom: '6px' } },
          CL.h('span.index-num', { text: '[ 03 / EXPORT ]' }),
          CL.h('span.mono', { text: 'FACTORY SPECS' })
        ),
        CL.h('div', null,
          CL.h('div.setting-row', null,
            CL.h('div.setting-info', null,
              CL.h('h4', { text: 'Print Resolution (DPI)' }),
              CL.h('p', { text: 'Độ phân giải tiêu chuẩn xuất file PDF sản xuất' })
            ),
            CL.h('div.segmented', null,
              CL.h('button' + (s.exportDPI === 150 ? '.is-active' : ''), {
                text: '150 DPI',
                onclick: (e) => {
                  CL.store.saveSettings({ exportDPI: 150 });
                  e.target.parentElement.querySelectorAll('button').forEach((b) => b.classList.remove('is-active'));
                  e.target.classList.add('is-active');
                  CL.toast('Độ phân giải 150 DPI (Bản nháp)');
                },
              }),
              CL.h('button' + ((s.exportDPI || 300) === 300 ? '.is-active' : ''), {
                text: '300 DPI',
                onclick: (e) => {
                  CL.store.saveSettings({ exportDPI: 300 });
                  e.target.parentElement.querySelectorAll('button').forEach((b) => b.classList.remove('is-active'));
                  e.target.classList.add('is-active');
                  CL.toast('Độ phân giải 300 DPI (Chuẩn in ấn)');
                },
              }),
              CL.h('button' + (s.exportDPI === 600 ? '.is-active' : ''), {
                text: '600 DPI Ultra',
                onclick: (e) => {
                  CL.store.saveSettings({ exportDPI: 600 });
                  e.target.parentElement.querySelectorAll('button').forEach((b) => b.classList.remove('is-active'));
                  e.target.classList.add('is-active');
                  CL.toast('Độ phân giải 600 DPI Ultra');
                },
              })
            )
          ),
          CL.h('div.setting-row', null,
            CL.h('div.setting-info', null,
              CL.h('h4', { text: 'Crop Marks & Bleed Lines' }),
              CL.h('p', { text: 'Dấu xén định vị vùng cắt cho xưởng in lụa / ép kim 1:1' })
            ),
            createSwitch(s.cropMarks !== false, (v) => {
              CL.store.saveSettings({ cropMarks: v });
              CL.toast('Dấu xén kỹ thuật');
            })
          ),
          CL.h('div.setting-row', null,
            CL.h('div.setting-info', null,
              CL.h('h4', { text: 'Vector Typography Outlining' }),
              CL.h('p', { text: 'Tự động convert font chữ sang vector paths tránh lỗi font xưởng' })
            ),
            createSwitch(s.outlineVector !== false, (v) => {
              CL.store.saveSettings({ outlineVector: v });
              CL.toast('Vector hóa font chữ');
            })
          )
        )
      );

      // 4. Author & Brand Credentials (Auto-Saved)
      const author = s.author || {};
      const statusBadge = CL.h('span.pill-tag', { text: '✓ AUTO-SAVED' });

      const nameIn = CL.h('input.input', { value: author.name || '', placeholder: 'Elena Rostova' });
      const brandIn = CL.h('input.input', { value: author.brand || '', placeholder: 'Maison de Rose' });
      const emailIn = CL.h('input.input', { type: 'email', value: author.email || '', placeholder: 'contact@brand.com' });
      const phoneIn = CL.h('input.input', { type: 'tel', value: author.phone || '', placeholder: '+84 901 234 567' });

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
        statusBadge.style.opacity = '1';
        setTimeout(() => { statusBadge.style.opacity = '0.7'; }, 1500);
      }

      [nameIn, brandIn, emailIn, phoneIn].forEach((inp) => {
        inp.addEventListener('input', () => {
          statusBadge.textContent = 'SAVING...';
        });
        inp.addEventListener('change', () => {
          saveAuthor();
          CL.toast('Đã lưu thông tin thương hiệu');
        });
      });

      const authorSection = CL.h('div.settings-section', null,
        CL.h('div.hero-meta-row', { style: { marginBottom: '8px' } },
          CL.h('span.index-num', { text: '[ 04 / BRAND CREDENTIALS ]' }),
          statusBadge
        ),
        CL.h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' } },
          CL.h('div.field', null, CL.h('label', { text: t('settings.name') }), nameIn),
          CL.h('div.field', null, CL.h('label', { text: t('settings.brand') }), brandIn),
          CL.h('div.field', null, CL.h('label', { text: t('settings.email') }), emailIn),
          CL.h('div.field', null, CL.h('label', { text: t('settings.phone') }), phoneIn)
        )
      );

      // 5. Smart Actions & Maintenance
      const maintenanceSection = CL.h('div.settings-section', null,
        CL.h('div.hero-meta-row', { style: { marginBottom: '8px' } },
          CL.h('span.index-num', { text: '[ 05 / STORAGE ]' }),
          CL.h('span.mono', { text: 'LOCAL VAULT' })
        ),
        CL.h('div', { style: { display: 'flex', gap: '10px', flexWrap: 'wrap' } },
          CL.h('button.btn.btn-sm.btn-outline', {
            text: 'Clear Draft Cache',
            onclick: () => {
              CL.store.clearDraft();
              CL.toast('Đã xóa bản nháp tạm');
            },
          }),
          CL.h('button.btn.btn-sm.btn-outline', {
            text: 'Export Backup JSON',
            onclick: () => {
              const data = {
                settings: CL.store.settings,
                designs: CL.store.listDesigns(),
                exportedAt: new Date().toISOString(),
              };
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              CL.download(url, 'coslab-vault-backup.json');
              setTimeout(() => URL.revokeObjectURL(url), 2000);
              CL.toast('Đã xuất file sao lưu JSON');
            },
          }),
          CL.h('button.btn.btn-sm.btn-outline', {
            text: 'Import Backup',
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
                    CL.toast('Đã phục hồi dữ liệu thành công');
                    setTimeout(() => location.reload(), 500);
                  } catch (err) {
                    CL.toast('File JSON không hợp lệ');
                  }
                };
                reader.readAsText(file);
              };
              input.click();
            },
          }),
          CL.h('button.btn.btn-sm.btn-outline', {
            text: 'Reset Defaults',
            style: { color: 'var(--danger)', borderColor: 'var(--border)' },
            onclick: async () => {
              const ok = await CL.confirm({
                title: 'Khôi phục mặc định?',
                message: 'Toàn bộ cài đặt xưởng sẽ quay về cấu hình gốc.',
              });
              if (ok) {
                localStorage.removeItem('coslab.settings');
                CL.toast('Đã khôi phục mặc định');
                setTimeout(() => location.reload(), 300);
              }
            },
          })
        )
      );

      grid.append(langSection, engineSection, exportSection, authorSection, maintenanceSection);
      root.append(head, grid);
      container.appendChild(root);

      return () => {};
    },
  };
})(window.CL);
