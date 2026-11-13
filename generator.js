/* DeadlineSF free custom patch: Cal. Civ. Code sec. 3111(a)(1)-(12) disclosure,
 * built in this browser from your answers. Nothing is uploaded: this file makes
 * no network requests, and the site's CSP sets connect-src 'none'.
 * A folder scan only reads files locally to suggest evidence; it never writes
 * disclosure text. Not legal advice. No compliance guarantee. */
(function (root) {
  'use strict';
  var FIELDS = [
    ['ctl-dataset-sources-owners', '(a)(1)', 'Sources or owners of the datasets'],
    ['ctl-purpose-description', '(a)(2)', 'How the datasets further the intended purpose of the system'],
    ['ctl-datapoint-count', '(a)(3)', 'Number of data points (general ranges allowed)'],
    ['ctl-datapoint-types', '(a)(4)', 'Types of data points (label types if labeled; general characteristics if unlabeled)'],
    ['ctl-ip-protected-content', '(a)(5)', 'Copyright, trademark, or patent protected data, or entirely public domain'],
    ['ctl-dataset-licensing', '(a)(6)', 'Whether the datasets were purchased or licensed'],
    ['ctl-personal-information', '(a)(7)', 'Personal information (Civ. Code sec. 1798.140(v))'],
    ['ctl-aggregate-consumer-information', '(a)(8)', 'Aggregate consumer information (Civ. Code sec. 1798.140(b))'],
    ['ctl-cleaning-and-processing', '(a)(9)', 'Cleaning, processing, or other modification, and its intended purpose'],
    ['ctl-collection-period', '(a)(10)', 'Time period of data collection (note if ongoing)'],
    ['ctl-first-use-dates', '(a)(11)', 'Dates the datasets were first used in development'],
    ['ctl-synthetic-data', '(a)(12)', 'Whether the system used or continuously uses synthetic data generation']
  ].map(function (f) { return { id: f[0], sub: f[1], label: f[2] }; });

  var STR = '\\(\\s*["\']([^"\']+)["\']';
  var SIGNALS = [
    ['hf-dataset', new RegExp('\\bload_dataset' + STR, 'g'), ['ctl-dataset-sources-owners', 'ctl-datapoint-types', 'ctl-dataset-licensing']],
    ['base-model', new RegExp('\\.from_pretrained' + STR, 'g'), ['ctl-dataset-sources-owners']],
    ['fine-tune-job', /\b(?:fine_tuning\.jobs\.create|fineTuning\.jobs\.create|FineTune\.create|fine_tunes\.create)\b/g, ['ctl-dataset-sources-owners']],
    ['training-file', /\btraining_file\s*[=:]\s*["']([^"']+)["']/g, ['ctl-dataset-sources-owners']],
    ['trainer', /\b(SFTTrainer|DPOTrainer|RewardTrainer|Seq2SeqTrainer|Trainer)\s*\(/g, ['ctl-cleaning-and-processing']],
    ['adapter-training', /\b(LoraConfig|get_peft_model|prepare_model_for_kbit_training)\s*\(/g, ['ctl-cleaning-and-processing']],
    ['synthetic-data', /\b(synthetic[_-]?data|generate_synthetic\w*|SyntheticDataGenerator)\b/gi, ['ctl-synthetic-data']]
  ];
  var CODE_EXT = /\.(py|ipynb|js|mjs|cjs|ts|tsx|jsx|yaml|yml|toml|json|sh|r|scala|java|go|rs)$/i;
  var DATA_EXT = /\.(jsonl|csv|tsv)$/i;
  var SKIP_DIR = /(^|\/)(node_modules|\.git|\.venv|venv|__pycache__|dist|build)\//;
  var MAX_BYTES = 2 * 1024 * 1024;
  var PLACEHOLDER = /\[\[|\]\]|\b(TBD|TODO|FIXME|lorem ipsum)\b/i;

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function isPlaceholder(v) { return PLACEHOLDER.test(String(v)); }

  function scanText(path, text) {
    var out = [];
    if (SKIP_DIR.test(path)) return out;
    if (DATA_EXT.test(path)) {
      var n = text.split(/\r?\n/).filter(function (l) { return l.trim(); }).length;
      if (/\.(csv|tsv)$/i.test(path) && n) n -= 1;
      out.push({ kind: 'training-data-file', path: path, line: 1, value: n + ' records', items: ['ctl-datapoint-count', 'ctl-datapoint-types', 'ctl-dataset-sources-owners'] });
      return out;
    }
    if (!CODE_EXT.test(path)) return out;
    SIGNALS.forEach(function (s) {
      s[1].lastIndex = 0;
      var m;
      while ((m = s[1].exec(text))) {
        var line = text.slice(0, m.index).split('\n').length;
        out.push({ kind: s[0], path: path, line: line, value: m[1] || m[0], items: s[2] });
      }
    });
    return out;
  }

  function validate(answers) {
    var bad = [];
    FIELDS.forEach(function (f) {
      var v = answers[f.id];
      if (v != null && String(v).trim() && isPlaceholder(v)) bad.push(f.id);
    });
    return bad;
  }

  function render(answers, meta) {
    meta = meta || {};
    var bad = validate(answers);
    if (bad.length) throw new Error('placeholder text in: ' + bad.join(', '));
    var dev = esc(meta.developer || ''), sys = esc(meta.system || '');
    var present = [], omitted = [], rows = [];
    FIELDS.forEach(function (f) {
      var v = answers[f.id];
      if (v == null || !String(v).trim()) { omitted.push(f.id); return; }
      present.push(f.id);
      rows.push('<section data-control="' + f.id + '">\n  <h2>' + esc(f.label) + ' <span class="cite">sec. 3111' + f.sub + '</span></h2>\n  <p>' +
        esc(String(v).trim()).replace(/\r?\n/g, '<br>') + '</p>\n</section>');
    });
    var html = '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
      '<title>Training data' + (sys ? ' · ' + sys : '') + '</title>\n<style>body{max-width:700px;margin:0 auto;padding:48px 24px;font:16px/1.55 Georgia,serif;color:#111}' +
      'h1{font:600 1.6rem/1.25 system-ui,sans-serif}h2{font:600 .85rem/1.3 system-ui,sans-serif;text-transform:uppercase;letter-spacing:.06em;color:#555;border-top:1px solid #ddd;padding-top:16px}' +
      '.cite,.meta,footer{font:12px/1.4 system-ui,sans-serif;color:#777}</style>\n</head>\n<body>\n<h1>Training data</h1>\n' +
      '<p class="meta">' + [dev, sys].filter(Boolean).join(' · ') + '</p>\n' + rows.join('\n') + '\n<footer>Posted under Cal. Civ. Code sec. 3111.' +
      (meta.date ? ' Updated ' + esc(meta.date) + '.' : '') + (meta.contact ? ' Contact ' + esc(meta.contact) + '.' : '') + '</footer>\n</body>\n</html>\n';
    return { html: html, present: present, omitted: omitted, complete: omitted.length === 0 };
  }

  var api = { FIELDS: FIELDS, scanText: scanText, render: render, validate: validate, isPlaceholder: isPlaceholder, esc: esc, MAX_BYTES: MAX_BYTES };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.DSFPatch = api;

  if (typeof document === 'undefined') return;
  function $(id) { return document.getElementById(id); }
  function boot() {
    var form = $('fields');
    FIELDS.forEach(function (f) {
      var w = document.createElement('label');
      w.className = 'f';
      w.innerHTML = '<span>' + esc(f.label) + ' <i>' + f.sub + '</i></span><textarea rows="2" name="' + f.id + '" id="' + f.id + '"></textarea><small class="ev" id="ev-' + f.id + '"></small>';
      form.appendChild(w);
    });
    $('folder').addEventListener('change', function (e) {
      var files = Array.prototype.slice.call(e.target.files || []);
      var found = [], pending = 0;
      var done = function () {
        $('scanned').textContent = files.length + ' files · ' + found.length + ' signals · on this device';
        FIELDS.forEach(function (f) {
          var hits = found.filter(function (h) { return h.items.indexOf(f.id) >= 0; }).slice(0, 4);
          $('ev-' + f.id).textContent = hits.map(function (h) { return h.value + ' — ' + h.path + ':' + h.line; }).join(' · ');
        });
      };
      files.forEach(function (file) {
        var p = file.webkitRelativePath || file.name;
        if (file.size > MAX_BYTES || SKIP_DIR.test(p) || !(CODE_EXT.test(p) || DATA_EXT.test(p))) return;
        pending++;
        file.text().then(function (t) { found = found.concat(scanText(p, t)); }).catch(function () {}).then(function () { if (--pending === 0) done(); });
      });
      if (!pending) done();
    });
    $('make').addEventListener('click', function () {
      var answers = {};
      FIELDS.forEach(function (f) { answers[f.id] = $(f.id).value; });
      var out;
      try {
        out = render(answers, { developer: $('dev').value, system: $('sys').value, date: new Date().toISOString().slice(0, 10), contact: $('contact').value });
      } catch (err) { $('status').textContent = 'Replace placeholder text.'; return; }
      $('status').textContent = out.present.length + '/12' + (out.complete ? '' : ' · missing ' + out.omitted.map(function (id) {
        return FIELDS.filter(function (f) { return f.id === id; })[0].sub; }).join(' '));
      var url = URL.createObjectURL(new Blob([out.html], { type: 'text/html' }));
      var a = document.createElement('a'); a.href = url; a.download = 'training-data.html'; a.click();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})(typeof globalThis !== 'undefined' ? globalThis : this);
