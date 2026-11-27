/**
 * COSLAB render worker (Cloudflare Workers).
 *
 * The site sends a quick 3D picture of a design; this worker forwards it to Google's
 * image model with a fixed studio-lighting prompt and returns the finished picture.
 * The API key stays here as a secret and never reaches the browser.
 *
 * Secrets / variables (Worker > Settings > Variables and Secrets):
 *   GEMINI_API_KEY  (secret, required)  key from https://aistudio.google.com/apikey
 *   GEMINI_MODEL    (optional)          defaults to gemini-nano-banana-2.1
 *   ALLOWED_ORIGINS (optional)          comma separated, defaults to https://ngwyren.github.io
 */
const API = 'https://generativelanguage.googleapis.com/v1beta/interactions';
const MAX_BYTES = 3 * 1024 * 1024;

// The prompt is fixed on the server, so the endpoint cannot be used as a general image generator.
const PROMPT = [
  'This is a 3D preview of a cosmetic lip tint container. Turn it into a finished studio product photograph.',
  'Keep the container exactly as it is: same shape, proportions, camera angle, framing, colours, materials,',
  'and every letter, logo and graphic printed on it, in the same position and size. Do not add, remove,',
  'redraw or restyle any text or artwork, and do not add props or other objects.',
  'Improve only the photography: soft diffused studio lighting from a large softbox, gentle realistic',
  'reflections and refraction on glass and clear plastic, a soft contact shadow, a clean seamless light',
  'backdrop, and a noise-free, sharp, high-end commercial finish.',
].join(' ');

const json = (body, status, cors) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...cors } });

/** First image block ({ type: 'image', data }) anywhere in the API answer. */
function findImage(node) {
  if (!node || typeof node !== 'object') return null;
  if (node.type === 'image' && typeof node.data === 'string') return node;
  for (const v of Array.isArray(node) ? node : Object.values(node)) {
    const hit = findImage(v);
    if (hit) return hit;
  }
  return null;
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const allowed = (env.ALLOWED_ORIGINS || 'https://ngwyren.github.io').split(',').map((s) => s.trim());
    const ok = allowed.includes(origin);
    const cors = {
      'Access-Control-Allow-Origin': ok ? origin : allowed[0],
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
      Vary: 'Origin',
    };
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') return json({ error: 'POST only' }, 405, cors);
    if (!ok) return json({ error: 'origin not allowed' }, 403, cors);
    if (!env.GEMINI_API_KEY) return json({ error: 'GEMINI_API_KEY is not set' }, 500, cors);
    if (Number(request.headers.get('Content-Length') || 0) > MAX_BYTES) return json({ error: 'image too large' }, 413, cors);

    let image;
    try {
      const text = await request.text();
      if (text.length > MAX_BYTES) return json({ error: 'image too large' }, 413, cors);
      image = JSON.parse(text).image;
    } catch (e) {
      return json({ error: 'bad request' }, 400, cors);
    }
    const m = /^data:(image\/(?:jpeg|png));base64,([A-Za-z0-9+/=]+)$/.exec(image || '');
    if (!m) return json({ error: 'image must be a JPEG or PNG data URL' }, 400, cors);

    let res, body;
    try {
      res = await fetch(API, {
        method: 'POST',
        headers: { 'x-goog-api-key': env.GEMINI_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: env.GEMINI_MODEL || 'gemini-nano-banana-2.1',
          input: [
            { type: 'text', text: PROMPT },
            { type: 'image', mime_type: m[1], data: m[2] },
          ],
        }),
      });
      body = await res.json();
    } catch (e) {
      return json({ error: 'image service unreachable' }, 502, cors);
    }
    if (!res.ok) return json({ error: (body && body.error && body.error.message) || `image service error ${res.status}` }, 502, cors);

    const out = findImage(body);
    if (!out) return json({ error: 'the image service returned no picture' }, 502, cors);
    return json({ image: `data:${out.mime_type || 'image/png'};base64,${out.data}` }, 200, cors);
  },
};
