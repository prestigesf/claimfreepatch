import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const g = require('../generator.js');
const root = new URL('../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');

const ALL = Object.fromEntries(g.FIELDS.map((f, i) => [f.id, `Answer ${i + 1} for ${f.sub}`]));

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
  assert.ok(!out.html.includes('<script>'));
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

test('page loads only the local generator and no longer hands out the static template', () => {
  const html = read('index.html');
  const scripts = [...html.matchAll(/<script\b[^>]*>/g)].map((m) => m[0]);
  assert.deepEqual(scripts, ['<script src="generator.js" defer>']);
  assert.ok(!/<script>[^<]/.test(html));
  assert.ok(!html.includes('ab2013-disclosure.html'));
  assert.ok(!/ on[a-z]+="/.test(html));
  assert.match(read('netlify.toml'), /from = "\/ab2013-disclosure.html"\s+to = "\/"\s+status = 301\s+force = true/);
});
