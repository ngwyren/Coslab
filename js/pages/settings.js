/* ==========================================================
   Settings page: Languages, Theme, Author Credentials
   ========================================================== */
(function (CL) {
  CL.pages = CL.pages || {};

  CL.pages.settings = {
    titleKey: 'nav.settings',
    appMode: false,

    render(container) {
      const root = CL.h('div.page.container', { style: { paddingBottom: '60px' } });

      const head = CL.h('div.page-head', null,
        CL.h('span.eyebrow', { text: 'System Preferences' }),
        CL.h('h1', { text: t('settings.title') }),
        CL.h('p', { text: t('settings.subtitle') })
      );

      const grid = CL.h('div.settings-grid');

      // 1. Languages
      const langSec = CL.h('div.settings-section', null,
        CL.h('div.settings-section-head', null,
          CL.h('h3', { text: t('settings.languages') }),
          CL.h('p', { text: t('settings.languagesDesc') })
        ),
        CL.h('div.lang-selector-grid', null,
          I18N.LANGS.map((l) =>
            CL.h('div.lang-card' + (l.code === I18N.lang ? '.is-active' : ''), {
              onclick: () => {
                CL.setLang(l.code);
              },
            },
              CL.h('span', { text: l.name }),
              CL.h('span.code', { text: l.code })
            )
          )
        )
      );

      // 2. Theme
      const themeSec = CL.h('div.settings-section', null,
        CL.h('div.settings-section-head', null,
          CL.h('h3', { text: t('settings.theme') }),
          CL.h('p', { text: t('settings.themeDesc') })
        ),
        CL.h('div', { style: { display: 'grid', gap: '12px' } },
          CL.h('div.lang-card.is-active', null,
            CL.h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
              CL.icon('sun'),
              CL.h('span', { text: t('settings.themeLight') })
            ),
            CL.h('span.badge', { text: 'Active' })
          ),
          CL.h('div.lang-card', { style: { opacity: '0.6', cursor: 'not-allowed' } },
            CL.h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
              CL.icon('moon'),
              CL.h('span', { text: t('settings.themeDark') })
            ),
            CL.h('span.badge', { text: 'Phase 2' })
          )
        )
      );

      // 3. Author / Brand
      const author = CL.store.settings.author || {};
      const nameIn = CL.h('input.input', { value: author.name || '', placeholder: 'e.g. Elena Rostova' });
      const brandIn = CL.h('input.input', { value: author.brand || '', placeholder: 'e.g. Maison de Rose' });
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
      }

      [nameIn, brandIn, emailIn, phoneIn].forEach((input) => {
        input.addEventListener('change', () => {
          saveAuthor();
          CL.toast(t('settings.savedToast'));
        });
      });

      const authorSec = CL.h('div.settings-section', null,
        CL.h('div.settings-section-head', null,
          CL.h('h3', { text: t('settings.author') }),
          CL.h('p', { text: t('settings.authorDesc') })
        ),
        CL.h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' } },
          CL.h('div.field', null, CL.h('label', { text: t('settings.name') }), nameIn),
          CL.h('div.field', null, CL.h('label', { text: t('settings.brand') }), brandIn),
          CL.h('div.field', null, CL.h('label', { text: t('settings.email') }), emailIn),
          CL.h('div.field', null, CL.h('label', { text: t('settings.phone') }), phoneIn)
        )
      );

      grid.append(langSec, themeSec, authorSec);
      root.append(head, grid);
      container.appendChild(root);

      return () => {};
    },
  };
})(window.CL);
