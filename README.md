# COSLAB ATELIER

**Design your lip tint. We make it.**

An online studio for designing Korean lip tint packaging (OEM / ODM): pick a container, colour it, add your name and logo, then export files a factory can work from.

**Live site: [ngwyren.github.io/Coslab](https://ngwyren.github.io/Coslab/)**

## What you can do

- **Choose a shape** — 12 containers with real dimensions: six round (CL-SC01–06) and six square (CL-SS01–06).
- **Colour it** — cap and body separately, as solid, gradient, shimmer or clear plastic with the tint showing inside. Pantone codes included.
- **Add type and a logo** — set your brand name, or upload a PNG, SVG or JPG that fits itself to the print area.
- **Check it in 2D and 3D** — flat print layout, a 3D view you can turn, and a high-quality studio render.
- **Export** — PNG (transparent), JPG, editable SVG artwork, and a PDF production spec sheet.
- **Start from the Archive** — 36 finished designs you can open and customise.
- **Save your work** — designs stay in your browser, with backup and restore.

Available in Vietnamese, English, Korean, Japanese, Chinese, French, Spanish and Arabic, with light and dark themes.

On-screen colours are a reference only; confirm the final colour against a physical swatch or sample before production.

## Run it locally

No install and no build step. Serve the folder with any static server:

```bash
git clone https://github.com/ngwyren/Coslab.git
cd Coslab
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## What's in the repo

| Path | Contents |
| :--- | :--- |
| `index.html` | The single page the site loads |
| `css/` | Styles, including the dark theme |
| `js/pages/` | Home, Design, Studio editor, Archive, Saved |
| `js/render/` | 2D artwork, 3D preview, high-quality render, exports |
| `js/data/` | Containers, templates, fonts, Pantone colours |
| `js/i18n/` | The eight languages |
| `assets/` | 3D models, lighting, Archive and home images |
| `server/render-worker/` | Optional AI render service (see its README) |

## Contact

COSLAB (주식회사 코스랩) — Incheon, South Korea · CGMP (ISO 22716)

[coslabkorea@gmail.com](mailto:coslabkorea@gmail.com) · +82-32-715-4277 · [coslabkorea.com](https://coslabkorea.com/default/en/index.php)
