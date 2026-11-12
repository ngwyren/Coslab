# COSLAB ATELIER — Bespoke Korean Lip Tint Design Studio

<p align="center">
  <strong>Bespoke Korean Lip Tint Packaging Design & Prototyping Platform (OEM / ODM)</strong>
</p>

<p align="center">
  <a href="https://ngwyren.github.io/Coslab/">
    <img src="https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-black?style=for-the-badge&logo=github" alt="Live Demo" />
  </a>
  <img src="https://img.shields.io/badge/Languages-8%20Supported-black?style=for-the-badge" alt="8 Languages" />
  <img src="https://img.shields.io/badge/Build-Vanilla%20ES6%20%2B%20CSS3-black?style=for-the-badge" alt="Vanilla JS & CSS" />
  <img src="https://img.shields.io/badge/Precision-0.1mm%20Moulding-black?style=for-the-badge" alt="Precision" />
</p>

---

## ✦ Overview

**COSLAB ATELIER** is a high-precision, interactive design studio and digital prototyping suite purpose-built for Korean **Liptint (son tint)** OEM / ODM packaging.

Drawing inspiration from Seoul's architectural minimalism and luxury K-Beauty ateliers (Tamburins, Gentle Monster, Orchard Studio), COSLAB allows cosmetic founders, brand directors, and packaging engineers to rapidly conceive, customize, and export manufacturing-ready lip tint packaging silhouettes in real-time.

🔗 **Live Experience:** [https://ngwyren.github.io/Coslab/](https://ngwyren.github.io/Coslab/)

---

## ✦ Key Features

- **💄 Specialized Lip Tint Silhouettes**
  - Designed exclusively for lip tint packaging (Caps, Applicator Rods, Reservoir Body, and Dividing Snap Rings).
  - Presets include *Velvet Round*, *Dewy Oval*, *Luxury Square*, *Cold Chrome*, *Porcelain Gold*, and *Dual Chamber*.

- **🎨 Multi-Part & Multi-Finish Customization**
  - Independent surface rendering for **Body (Thân)**, **Cap (Nắp)**, and **Divider Ring (Khớp viền)**.
  - Realistic material finishes: **Velvet Matte** (Nhung lì), **Satin** (Bóng nhẹ), **Dewy Glass** (Pha lê trong suốt), and **Cold Chrome** (Mạ gương lạnh).
  - Solid fills and customizable multi-stop gradients with real-time hue/spectrum pickers.

- **🌸 Curated K-Beauty MLBB Palettes**
  - Handcrafted MLBB (My Lips But Better) color harmonies (Muted Fig, Chilled Mauve, Rosewater, Warm Cinnamon, Brick Red, etc.).
  - Packaging material swatches including warm ivory ceramic, frosted glass, midnight obsidian, and cold anodized chrome.

- **🔤 Vector Typography & AI Logo Processing**
  - Multi-layer text engine with typography tracking, leading, font scaling, and alignment.
  - High-res vector and raster logo upload (SVG, PNG, JPG, AI).
  - Built-in white background isolation for instant transparency.

- **📐 Engineering-Grade Exports**
  - **Vector SVG (AI Ready)**: 1:1 scale unwrapped packaging vector files with trim guides for silk-screen printing, hot stamping, and UV coating.
  - **Bespoke Specification PDF**: Comprehensive factory spec sheets featuring Pantone references, finish tags, and dimensional breakdowns.
  - **High-Res PNG & JPG**: Studio lighting renders on transparent or clean backdrops.

- **🌐 8-Language Internationalization (i18n) & RTL**
  - Fully reactive language switcher supporting **Tiếng Việt**, **English**, **한국어**, **日本語**, **中文**, **Français**, **Español**, and **العربية**.
  - Dynamic bidirectional text rendering (LTR & RTL) with specialized typography hierarchies.

- **⚡ Zero-Framework High-Performance Architecture**
  - 100% Vanilla ES6 and modern CSS custom properties.
  - Ultra-fast first paint, zero build step required, instant deployment, and zero bloat.

---

## ✦ Project Structure

```text
coslab/
├── index.html                 # Main entry point & semantic layout shell
├── README.md                  # Project documentation & release guide
├── css/
│   ├── base.css               # Design tokens, typography, CSS resets, utility classes
│   ├── layout.css             # Floating pill header, dead-center nav, minimal footer
│   ├── pages.css              # Home, Design setup, Gallery, Vault, Settings
│   └── editor.css             # 2D/3D studio workbench, tool panels, layer stack
├── js/
│   ├── app.js                 # SPA client-side router, header bootstrap, i18n binder
│   ├── components/
│   │   └── color-picker.js    # Segmented cosmetic pans, hue bar, and eyedropper
│   ├── core/
│   │   ├── icons.js           # Lightweight SVG icon system
│   │   ├── store.js           # LocalStorage reactive persistence & drafts vault
│   │   ├── ui.js              # Dropdown menus, toast notifications, modals
│   │   └── utils.js           # Vector math, color conversions (HEX/RGB/HSL), canvas helpers
│   ├── data/
│   │   ├── models.js          # Lip tint packaging 3D/2D geometry models
│   │   └── templates.js       # Curated aesthetic starting styles & presets
│   ├── i18n/
│   │   ├── i18n.js            # Core internationalization engine
│   │   ├── vi.js              # Vietnamese (Tiếng Việt)
│   │   ├── en.js              # English
│   │   ├── ko.js              # Korean (한국어)
│   │   ├── ja.js              # Japanese (日本語)
│   │   ├── zh.js              # Chinese (中文)
│   │   ├── fr.js              # French (Français)
│   │   ├── es.js              # Spanish (Español)
│   │   └── ar.js              # Arabic (العربية - RTL)
│   ├── pages/
│   │   ├── home.js            # Editorial home showcase & marquee
│   │   ├── design.js          # Packaging silhouette & template starter
│   │   ├── editor.js          # Studio editor workbench & layer composition
│   │   ├── gallery.js         # Curated packaging library & filter archive
│   │   ├── my-designs.js      # Saved designs vault with local backups
│   │   └── settings.js        # Brand information, author, and locale settings
│   └── render/
│       ├── lipstick-svg.js    # Parametric SVG lip tint packaging renderer
│       ├── preview3d.js       # Canvas PBR lighting, reflection, and material shaders
│       └── exporter.js        # Vector SVG, hi-res canvas, and PDF spec engine
└── vendor/
    └── jspdf.umd.min.js       # Client-side technical specification PDF generator
```

---

## ✦ Getting Started & Local Development

No package manager, compiler, or build step is required! COSLAB runs natively in all modern web browsers.

### 1. Clone or Pull the Repository
```bash
git clone https://github.com/ngwyren/Coslab.git
cd Coslab
```

### 2. Run Locally
You can serve the project using any static file server:

- **VS Code Live Server**: Right-click `index.html` and click **"Open with Live Server"**.
- **Python 3**:
  ```bash
  python -m http.server 8000
  ```
  Open `http://localhost:8000` in your browser.
- **Node.js**:
  ```bash
  npx serve .
  ```
- **PHP**:
  ```bash
  php -S localhost:8000
  ```

---

## ✦ Development Workflow & Git Collaboration

### Pulling the Latest Code
```bash
git checkout main
git pull origin main
```

### Creating Feature Branches
```bash
git checkout -b feature/your-feature-name
# Make your edits...
git add -A
git commit -m "feat: describe your change"
git push origin feature/your-feature-name
```

---

## ✦ Packaging & Manufacturing Specifications

| Parameter | Specification | Notes |
| :--- | :--- | :--- |
| **Product Target** | Lip Tint (Son tint, 틴트) | Liquid & water-gel emulsions |
| **Tooling Tolerance** | ±0.1mm | Precision snap cap closure |
| **Materials** | Acrylic, ABS, PCTG, Aluminum | Cold chrome, frosted & glass effects |
| **Artwork Format** | Unwrapped 1:1 Vector SVG / PDF | AI, CorelDraw, & CAD compatible |
| **Colour Model** | RGB (Canvas preview) / CMYK & Pantone ready | Export-ready color profiles |

---

## ✦ License & Credits

Developed for **COSLAB ATELIER®** — Seoul Bespoke Packaging Studio.  
All brand concepts, packaging models, and vector assets are maintained under the project repository.
