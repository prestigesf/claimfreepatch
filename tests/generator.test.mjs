import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const g = require('../generator.js');
const jsQR = require('./vendor/jsQR/jsQR.js');
const root = new URL('../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');

const ALL = Object.fromEntries(g.FIELDS.map((f, i) => [f.id, `Answer ${i + 1} for ${f.sub}`]));
const CLAIMS = /guarantee|violation|patent pending|statutory audit/i;

test('covers sec. 3111(a)(1)-(12) in statutory order, item (4) included', () => {
  assert.deepEqual(g.FIELDS.map((f) => f.sub), Array.from({ length: 12 }, (_, i) => `(a)(${i + 1})`));
  assert.equal(g.FIELDS[3].id, 'ctl-datapoint-types');
});

test('every answered item gets one data-control marker; complete when all 12 answered', () => {
  const out = g.render(ALL, { developer: 'Acme', system: 'Acme Gen' });
  assert.equal(out.complete, true);
  for (const f of g.FIELDS) assert.equal(out.html.split(`data-control="${f.id}"`).length - 1, 1, f.id);
});

test('unanswered items are left out, not filled', () => {
  const a = { ...ALL, 'ctl-collection-period': '', 'ctl-first-use-dates': '  ' };
  const out = g.render(a, {});
  assert.equal(out.complete, false);
  assert.deepEqual(out.omitted, ['ctl-collection-period', 'ctl-first-use-dates']);
  assert.ok(!out.html.includes('ctl-collection-period'));
});

test('different customers get different bytes', () => {
  const a = g.render(ALL, { developer: 'A' }).html;
  const b = g.render({ ...ALL, 'ctl-datapoint-count': '1-5 million records' }, { developer: 'A' }).html;
  assert.notEqual(a, b);
});

test('placeholder text is rejected', () => {
  for (const bad of ['[[COMPANY]]', 'TBD', 'todo later']) {
    assert.throws(() => g.render({ ...ALL, 'ctl-synthetic-data': bad }, {}), /placeholder/);
  }
});

test('answers are escaped, so they cannot inject markers or script', () => {
  const out = g.render({ ...ALL, 'ctl-synthetic-data': '</p><section data-control="x"><script>alert(1)</script>' }, { developer: '<b>' });
  assert.ok(!out.html.includes('<script>alert'));
  assert.ok(!out.html.includes('data-control="x"'));
  assert.ok(!out.html.includes('<b>'));
});

test('folder scan finds training signals with file and line', () => {
  const py = 'from datasets import load_dataset\n\nds = load_dataset("HuggingFaceH4/Multilingual-Thinking")\nm = AutoModel.from_pretrained("openai/gpt-oss-20b")\ncfg = LoraConfig(r=8)\nt = SFTTrainer(model=m)\n';
  const hits = g.scanText('train.py', py);
  const kinds = hits.map((h) => h.kind);
  assert.deepEqual(kinds.sort(), ['adapter-training', 'base-model', 'hf-dataset', 'trainer']);
  const ds = hits.find((h) => h.kind === 'hf-dataset');
  assert.equal(ds.value, 'HuggingFaceH4/Multilingual-Thinking');
  assert.equal(ds.line, 3);
  const data = g.scanText('data/train.jsonl', '{"a":1}\n{"a":2}\n\n{"a":3}\n');
  assert.equal(data[0].value, '3 records');
  assert.deepEqual(g.scanText('node_modules/x/train.py', py), []);
});

test('scan evidence never becomes disclosure text', () => {
  const out = g.render({}, {});
  assert.equal(out.present.length, 0);
  assert.ok(!out.html.includes('data-control'));
});

test('no network calls in the generator, and the CSP forbids them', () => {
  const src = read('generator.js');
  for (const api of ['fetch(', 'XMLHttpRequest', 'WebSocket', 'sendBeacon', 'EventSource', 'importScripts']) {
    assert.ok(!src.includes(api), api);
  }
  const toml = read('netlify.toml');
  assert.match(toml, /connect-src 'none'/);
  assert.match(toml, /script-src 'self'/);
});

test('page loads only local scripts and serves a labeled sample disclosure', () => {
  const html = read('index.html');
  const scripts = [...html.matchAll(/<script\b[^>]*>/g)].map((m) => m[0]);
  assert.deepEqual(scripts, [
    '<script src="vendor/qrcode-generator/qrcode.js" defer>',
    '<script src="generator.js" defer>'
  ]);
  assert.ok(!/<script>[^<]/.test(html));
  assert.ok(!html.includes('ab2013-disclosure.html'));
  assert.ok(!/ on[a-z]+="/.test(html));
  const toml = read('netlify.toml');
  assert.doesNotMatch(toml, /from = "\/ab2013-disclosure.html"\s+to = "\/"/);
  assert.match(toml, /from = "\/ab2013-disclosure"\s+to = "\/ab2013-disclosure.html"\s+status = 200/);
  assert.match(toml, /from = "\/training-data"\s+to = "\/ab2013-disclosure.html"\s+status = 200/);
  const sample = read('ab2013-disclosure.html');
  assert.match(sample, /not a real company disclosure/i);
  assert.match(sample, /class="ab2013-disclosure"/);
  assert.match(sample, /data-control="ctl-synthetic-data"/);
});

test('default output is an embed fragment that inherits host styles', () => {
  const out = g.render(ALL, { developer: 'Acme', system: 'Acme Gen' });
  assert.equal(out.mode, 'embed');
  assert.ok(!out.html.includes('<!doctype html>'));
  assert.ok(out.html.includes('class="ab2013-disclosure"'));
  assert.ok(out.css.includes('font-family:inherit'));
  assert.ok(out.css.includes('color:inherit'));
  assert.ok(!/#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})/.test(out.css));
  assert.doesNotMatch(out.css, /font-family:\s*(Georgia|system-ui|ui-sans-serif|serif)/i);
  assert.ok(!out.css.includes('#111'));
  assert.ok(!out.css.includes('#555'));
  assert.ok(!out.css.includes('#777'));
});

test('standalone page applies validated brand colors, fonts, and logo', () => {
  const logo = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  const out = g.render(ALL, {
    mode: 'standalone',
    developer: 'Acme',
    system: 'Acme Gen',
    brand: {
      primary: '#0a2540',
      text: '#102a43',
      background: '#f6f9fc',
      accent: '#0d5c63',
      headingFont: 'Georgia, serif',
      bodyFont: 'Inter, system-ui, sans-serif',
      logoDataUrl: logo
    }
  });
  assert.equal(out.mode, 'standalone');
  assert.match(out.html, /^<!doctype html>/);
  assert.match(out.css, /--ab2013-primary:#0a2540/);
  assert.match(out.css, /--ab2013-text:#102a43/);
  assert.match(out.css, /--ab2013-bg:#f6f9fc/);
  assert.match(out.css, /--ab2013-accent:#0d5c63/);
  assert.match(out.css, /--ab2013-heading:"Georgia", serif/);
  assert.match(out.css, /--ab2013-body:"Inter", system-ui, sans-serif/);
  assert.ok(out.html.includes(logo));
  assert.ok(out.html.includes('alt="Acme"'));
});

test('invalid colors fall back and are not injected; fonts are sanitized', () => {
  const out = g.render(ALL, {
    mode: 'standalone',
    brand: {
      primary: 'red',
      text: 'rgb(0,0,0)',
      background: 'url(https://evil.example/x)',
      accent: '#gggggg',
      headingFont: "Evil'; } </style><script>alert(1)</script>",
      bodyFont: 'Inter, url(https://fonts.example/x)'
    }
  });
  assert.equal(g.normalizeHex('red'), '');
  assert.equal(g.sanitizeFont("Evil'; } </style><script>alert(1)</script>"), '');
  assert.equal(g.sanitizeFont('Inter, url(https://fonts.example/x)'), '');
  assert.match(out.css, /--ab2013-primary:#111111/);
  assert.ok(!out.html.includes('url(https://'));
  assert.ok(!out.html.includes('<script>alert'));
  assert.ok(!out.css.includes("Evil"));
});

test('logo rejects non-image types, SVG, and oversize files', () => {
  assert.equal(g.validateLogo({ type: 'image/svg+xml', size: 100 }).ok, false);
  assert.equal(g.validateLogo({ type: 'application/pdf', size: 100 }).ok, false);
  assert.equal(g.validateLogo({ type: 'image/png', size: g.LOGO_MAX_BYTES + 1 }).ok, false);
  assert.equal(g.validateLogo({ type: 'image/png', size: 12 }).ok, true);
  assert.equal(g.validateLogoDataUrl('data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=').ok, false);
  assert.equal(g.validateLogoDataUrl('data:text/html;base64,PHNjcmlwdD4=').ok, false);
});

test('parseBrandCss maps variables and hex locally, ignoring urls', () => {
  const parsed = g.parseBrandCss(`
    :root {
      --primary: #0a2540;
      --color-text: #102a43;
      --bg: #f6f9fc;
      --accent: #0d5c63;
      --font-heading: "Iowan Old Style", serif;
      --logo: url(https://example.com/logo.png);
    }
    @import url(https://fonts.example/css);
  `);
  assert.equal(parsed.primary, '#0a2540');
  assert.equal(parsed.text, '#102a43');
  assert.equal(parsed.background, '#f6f9fc');
  assert.equal(parsed.accent, '#0d5c63');
  assert.match(parsed.headingFont, /Iowan Old Style/);
  assert.ok(!JSON.stringify(parsed).includes('https://'));
  const loose = g.parseBrandCss('#ffffff #111111');
  assert.equal(loose.background, '#ffffff');
  assert.equal(loose.text, '#111111');
});

test('contrast uses WCAG 2.2 and warns under 4.5:1 without rounding up 4.499', () => {
  assert.equal(g.contrastRatio('#000000', '#ffffff'), 21);
  assert.ok(g.contrastReport({ text: '#111111', primary: '#111111', accent: '#444444', background: '#ffffff' }).pass);
  const fail = g.contrastReport({ text: '#777777', primary: '#777777', accent: '#777777', background: '#ffffff' });
  assert.equal(fail.pass, false);
  assert.ok(fail.min < 4.5);
  // #8a8a8a on #ffffff is about 3.3:1; a near-miss must not pass
  const near = g.contrastRatio('#777777', '#ffffff');
  assert.ok(near < 4.5);
});

test('site copy is short, has brand controls, and avoids banned claims', () => {
  const html = read('index.html');
  assert.match(html, /Embed in my site/);
  assert.match(html, /Standalone page/);
  assert.match(html, /id="c-primary"/);
  assert.match(html, /id="c-text"/);
  assert.match(html, /id="c-bg"/);
  assert.match(html, /id="c-accent"/);
  assert.match(html, /id="font-heading"/);
  assert.match(html, /id="font-body"/);
  assert.match(html, /id="font-heading-custom"/);
  assert.match(html, /id="logo"/);
  assert.match(html, /id="css-brand"/);
  assert.match(html, /id="preview"/);
  assert.doesNotMatch(html, CLAIMS);
  assert.doesNotMatch(read('generator.js').replace(/No compliance guarantee\.?/g, ''), CLAIMS);
  const out = g.render(ALL, { mode: 'standalone', developer: 'Acme' });
  assert.doesNotMatch(out.html, CLAIMS);
});

test('credit link and QR appear in embed and standalone output', () => {
  for (const mode of ['embed', 'standalone']) {
    const out = g.render(ALL, { mode, developer: 'Acme' });
    assert.ok(out.html.includes(g.CREDIT_LABEL));
    assert.ok(out.html.includes(`href="${g.CREDIT_HREF}"`));
    assert.match(out.html, /<svg xmlns="http:\/\/www.w3.org\/2000\/svg"/);
    assert.ok(out.html.includes('class="ab2013-disclosure__qr"'));
    assert.ok(out.html.includes('ab2013-disclosure__credit'));
  }
});

function rasterizeQrSvg(svg, scale = 8) {
  const vb = svg.match(/viewBox="0 0 (\d+) (\d+)"/);
  assert.ok(vb, 'viewBox');
  const dim = Number(vb[1]);
  const path = svg.match(/<path[^>]*\sd="([^"]+)"/);
  assert.ok(path, 'path');
  const dark = new Set();
  const re = /M(\d+) (\d+)h1v1h-1z/g;
  let m;
  while ((m = re.exec(path[1]))) dark.add(`${m[1]},${m[2]}`);
  assert.ok(dark.size > 0);
  const w = dim * scale;
  const h = dim * scale;
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const on = dark.has(`${Math.floor(x / scale)},${Math.floor(y / scale)}`);
      const v = on ? 17 : 255;
      data[i] = v; data[i + 1] = v; data[i + 2] = v; data[i + 3] = 255;
    }
  }
  return { data, width: w, height: h };
}

test('QR SVG decodes to https://deadlinesf.net', () => {
  const out = g.render(ALL, { developer: 'Acme' });
  const svg = out.html.match(/<svg[\s\S]*?<\/svg>/)[0];
  const img = rasterizeQrSvg(svg);
  const code = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' });
  assert.ok(code, 'decoded');
  assert.equal(code.data, g.CREDIT_HREF);
  assert.equal(g.CREDIT_HREF, 'https://deadlinesf.net');
  const qr = g.makeQr(g.CREDIT_HREF);
  assert.ok(qr.getModuleCount() <= 29, 'small module count for a short URL');
});

test('3-digit hex normalizes; contrast of white on white fails', () => {
  assert.equal(g.normalizeHex('#ABC'), '#aabbcc');
  assert.equal(g.normalizeHex('ABC'), '#aabbcc');
  assert.equal(g.normalizeHex('#aabbcc'), '#aabbcc');
  assert.equal(g.normalizeHex('#ffff'), '');
  assert.equal(g.contrastReport({ text: '#ffffff', primary: '#ffffff', accent: '#ffffff', background: '#ffffff' }).pass, false);
});

// 2026-11-18: result page points to the paid Scan; folder button renamed.
import { readFileSync as _rf } from "node:fs";
test("result page has a Scan · $3,500 button to DeadlineSF checkout", () => {
  const h = _rf(new URL("../index.html", import.meta.url), "utf8");
  assert.match(h, /<a class="ghost" id="scan-cta" href="https:\/\/deadlinesf\.net\/checkout\?pkg=scan_3500">Scan · \$3,500<\/a>/);
  assert.equal(h.includes("Scan code folder"), false);
  assert.match(h, /Find evidence in a folder — stays on this device/);
});
