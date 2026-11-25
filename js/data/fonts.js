/* ==========================================================
   COSLAB — Lettering fonts, grouped by look.
   All are on Google Fonts; the exporter embeds the used glyphs.
   ========================================================== */
(function (CL) {
  const GROUPS = [
    { id: 'clean', en: 'Clean', vi: 'Gọn', fonts: ['Plus Jakarta Sans', 'Montserrat', 'Be Vietnam Pro', 'Raleway', 'Josefin Sans', 'Quicksand', 'Lexend', 'Nunito', 'Outfit', 'Jost', 'Manrope', 'Poppins'] },
    { id: 'elegant', en: 'Elegant', vi: 'Sang', fonts: ['Playfair Display', 'Cormorant Garamond', 'Cinzel', 'Italiana', 'Instrument Serif', 'Bodoni Moda', 'Lora', 'Prata', 'Marcellus', 'EB Garamond', 'Gilda Display', 'Forum'] },
    { id: 'script', en: 'Script', vi: 'Viết tay', fonts: ['Dancing Script', 'Great Vibes', 'Style Script', 'Charm', 'Pacifico', 'Lobster', 'Allura', 'Parisienne', 'Sacramento', 'Caveat', 'Alex Brush', 'Satisfy'] },
    { id: 'bold', en: 'Bold', vi: 'Đậm', fonts: ['Bebas Neue', 'Oswald', 'Anton', 'Abril Fatface', 'Righteous', 'Paytone One', 'Archivo Black', 'Syne', 'Unbounded', 'Bungee', 'Alfa Slab One', 'Monoton'] },
    { id: 'korean', en: 'Korean', vi: 'Hàn', fonts: ['Noto Sans KR', 'Nanum Myeongjo', 'Gowun Dodum', 'Jua', 'Black Han Sans', 'Nanum Pen Script', 'Nanum Gothic', 'Gowun Batang', 'Do Hyeon', 'Gaegu', 'Song Myung', 'Hi Melody'] },
  ];

  // Fonts not already loaded by index.html
  const EXTRA = [
    'Be+Vietnam+Pro:wght@400;600;700', 'Raleway:wght@400;600;700', 'Josefin+Sans:wght@400;600;700', 'Quicksand:wght@400;600;700',
    'Bodoni+Moda:wght@400;600;700', 'Lora:wght@400;600;700', 'Prata', 'Great+Vibes', 'Style+Script', 'Charm:wght@400;700', 'Pacifico', 'Lobster',
    'Oswald:wght@400;600;700', 'Anton', 'Abril+Fatface', 'Righteous', 'Paytone+One',
    'Lexend:wght@400;600;700', 'Nunito:wght@400;600;700', 'Outfit:wght@400;600;700', 'Jost:wght@400;600;700', 'Manrope:wght@400;600;700', 'Poppins:wght@400;600;700',
    'Marcellus', 'EB+Garamond:wght@400;600;700', 'Gilda+Display', 'Forum', 'Allura', 'Parisienne',
    'Sacramento', 'Caveat:wght@400;600;700', 'Alex+Brush', 'Satisfy', 'Archivo+Black', 'Syne:wght@400;600;700',
    'Unbounded:wght@400;600;700', 'Bungee', 'Alfa+Slab+One', 'Monoton', 'Nanum+Gothic:wght@400;700', 'Gowun+Batang:wght@400;700',
    'Do+Hyeon', 'Gaegu:wght@400;700', 'Song+Myung', 'Hi+Melody',
    'Nanum+Myeongjo:wght@400;700', 'Gowun+Dodum', 'Jua', 'Black+Han+Sans', 'Nanum+Pen+Script',
  ];

  let sheet = null;
  /** Add the extra font styles once (the font files themselves load only when a glyph is drawn). */
  function load() {
    if (!sheet) {
      sheet = new Promise((resolve) => {
        const el = document.createElement('link');
        el.rel = 'stylesheet';
        el.href = 'https://fonts.googleapis.com/css2?family=' + EXTRA.join('&family=') + '&display=swap';
        el.onload = resolve;
        el.onerror = () => { sheet = null; el.remove(); resolve(); };
        document.head.append(el);
      });
    }
    return sheet;
  }

  /** Resolves when `tx.font` can be measured (or could not be loaded). */
  async function ready(tx) {
    await load();
    try {
      await document.fonts.load(`${tx.italic ? 'italic ' : ''}${tx.weight || 400} 20px '${tx.font}'`, tx.content || 'A');
    } catch (e) { /* fallback font is used */ }
  }

  CL.fonts = { GROUPS, load, ready };
})(window.CL);
