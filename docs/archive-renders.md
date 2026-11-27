# Re-rendering the Archive pictures

The cards on the Archive page (`assets/archive/<templateId>.webp`) are made with the Studio's own
renderer (`CL.renderHQ`), all with one fixed camera, so the containers keep their true sizes next
to each other.

## Recipe

- 640 × 800 px, 160 samples, WebP at quality 0.92
- `fill: 0.68`, `lift: 0.08`: the tallest container (107.9 mm) takes 68% of the frame height and
  every container stands on the same line, clear of the name bar on the card
- `size`: the container's height divided by the tallest container's height
- `look`: the four studios in turn, `seq[(i + (i >> 2)) % 4]`, so neighbours differ
- backdrop: left to the renderer (a pale wash of the product's colour)
- `blank-liptint` has no card and is skipped

## How

Open the site (the live one or a local copy served over http), open the browser console and paste
the snippet. Leave the tab in front while it runs; about 30 seconds a picture. Each finished
picture is downloaded as `<templateId>.webp`. Move the files into `assets/archive/`, then raise the
`?v=` number of the image address in `js/pages/gallery.js` and of `gallery.js` in `index.html`, and
commit.

```js
// ids to render; leave empty to render every card
const only = ['butter-cream', 'ruby-glass', 'seoul-blossom', 'graphite-red', 'champagne-toast'];

const T = CL.templates, seq = ['studioA', 'studioB', 'studioC', 'studioD'];
const tallest = Math.max(...CL.models.MODELS.map((m) => m.h));
for (let i = 0; i < T.TEMPLATES.length; i++) {
  const tp = T.TEMPLATES[i];
  if (tp.templateId === 'blank-liptint' || (only.length && !only.includes(tp.templateId))) continue;
  const design = T.createDesign(tp.templateId, tp.model);
  const canvas = await CL.renderHQ(design, {
    width: 640, height: 800, samples: 160, fill: 0.68, lift: 0.08,
    size: CL.models.getModel(design.model).h / tallest,
    look: seq[(i + (i >> 2)) % 4],
  });
  const blob = await new Promise((done) => canvas.toBlob(done, 'image/webp', 0.92));
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `${tp.templateId}.webp` });
  a.click();
  URL.revokeObjectURL(a.href);
  console.log('done', tp.templateId);
}
```

## Status

27 November 2026: 31 of the 36 cards follow this recipe. Still on older pictures (different
framing and light): `butter-cream`, `ruby-glass`, `seoul-blossom`, `graphite-red`,
`champagne-toast`. They are the ids listed in `only` above.
