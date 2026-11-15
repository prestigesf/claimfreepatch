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

  var CREDIT_HREF = 'https://deadlinesf.net';
  var CREDIT_LABEL = 'Made with DeadlineSF';
  var QR_EC = 'M';
  var QR_QUIET = 4;
  var QR_DARK = '#111111';
  var QR_LIGHT = '#ffffff';
  var QR_PX = 96;
  var LOGO_MAX_BYTES = 512 * 1024;
  var LOGO_TYPES = { 'image/png': 1, 'image/jpeg': 1, 'image/webp': 1, 'image/gif': 1 };
  var LOGO_DATAURL = /^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/]+={0,2}$/;
  var HEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
  var GENERIC_FONTS = {
    serif: 1, 'sans-serif': 1, cursive: 1, fantasy: 1, monospace: 1,
    'system-ui': 1, 'ui-sans-serif': 1, 'ui-serif': 1, 'ui-monospace': 1,
    'ui-rounded': 1, emoji: 1, math: 1, fangsong: 1
  };
  var FONT_PRESETS = {
    'system-sans': 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
    'system-serif': 'ui-serif, Georgia, "Times New Roman", serif',
    georgia: 'Georgia, "Times New Roman", serif',
    times: '"Times New Roman", Times, serif',
    'system-mono': 'ui-monospace, "SF Mono", Menlo, Consolas, monospace'
  };
  var DEFAULT_BRAND = {
    primary: '#111111',
    text: '#111111',
    background: '#ffffff',
    accent: '#444444',
    headingFont: FONT_PRESETS['system-sans'],
    bodyFont: FONT_PRESETS['system-sans']
  };

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

  function normalizeHex(s) {
    if (s == null) return '';
    var t = String(s).trim();
    if (t && t.charAt(0) !== '#') t = '#' + t;
    var m = HEX.exec(t);
    if (!m) return '';
    var h = m[1].toLowerCase();
    if (h.length === 3) h = h.charAt(0) + h.charAt(0) + h.charAt(1) + h.charAt(1) + h.charAt(2) + h.charAt(2);
    return '#' + h;
  }

  function channelLin(c) {
    var s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  }

  function luminance(hex) {
    var h = normalizeHex(hex).slice(1);
    if (h.length !== 6) return 0;
    return 0.2126 * channelLin(parseInt(h.slice(0, 2), 16)) +
      0.7152 * channelLin(parseInt(h.slice(2, 4), 16)) +
      0.0722 * channelLin(parseInt(h.slice(4, 6), 16));
  }

  function contrastRatio(a, b) {
    var l1 = luminance(a), l2 = luminance(b);
    var hi = Math.max(l1, l2), lo = Math.min(l1, l2);
    return (hi + 0.05) / (lo + 0.05);
  }

  function contrastReport(brand) {
    var b = normalizeBrand(brand);
    var pairs = {
      text: contrastRatio(b.text, b.background),
      primary: contrastRatio(b.primary, b.background),
      accent: contrastRatio(b.accent, b.background)
    };
    var min = Math.min(pairs.text, pairs.primary, pairs.accent);
    return { text: pairs.text, primary: pairs.primary, accent: pairs.accent, min: min, pass: min >= 4.5 };
  }

  function sanitizeFontName(name) {
    var n = String(name).trim().replace(/^["']|["']$/g, '').trim();
    if (!n || n.length > 80) return '';
    var lower = n.toLowerCase();
    if (lower === 'inherit' || lower === 'initial' || lower === 'unset' || lower === 'default' || lower === 'revert' || lower === 'revert-layer') return '';
    if (GENERIC_FONTS[lower]) return lower;
    if (lower === '-apple-system') return '-apple-system';
    if (n === 'BlinkMacSystemFont') return 'BlinkMacSystemFont';
    if (!/^-?[A-Za-z][A-Za-z0-9 \-.]*$/.test(n)) return '';
    return '"' + n + '"';
  }

  function sanitizeFont(s) {
    if (s == null) return '';
    var raw = String(s).trim();
    if (!raw || raw.length > 200) return '';
    if (/[{}<>;:@\\]|\/\*|\*\/|!|expression/i.test(raw)) return '';
    var parts = raw.split(',');
    var out = [];
    for (var i = 0; i < parts.length && out.length < 5; i++) {
      var f = sanitizeFontName(parts[i]);
      if (f && out.indexOf(f) < 0) out.push(f);
    }
    return out.join(', ');
  }

  function classifyName(name) {
    var n = String(name).toLowerCase();
    if (/(heading|title|display|headline).*(font|family)|font.*(heading|title|display)/.test(n)) return 'headingFont';
    if (/(body|text|sans|serif).*(font|family)|font.*(body|sans|text)|font-family|font-sans|font-serif/.test(n)) return 'bodyFont';
    if (/accent|link|highlight|secondary/.test(n)) return 'accent';
    if (/background|surface|canvas|paper|(^|-)bg(-|$)/.test(n)) return 'background';
    if (/primary|brand/.test(n)) return 'primary';
    if (/text|ink|foreground|(^|-)fg(-|$)|body/.test(n)) return 'text';
    return '';
  }

  function assignBrandToken(out, name, raw) {
    var key = classifyName(name);
    if (!key) return;
    if (key === 'headingFont' || key === 'bodyFont') {
      var font = sanitizeFont(raw);
      if (font) out[key] = font;
      return;
    }
    var hex = normalizeHex(raw.replace(/[!].*$/, '').trim());
    if (hex) out[key] = hex;
  }

  function parseBrandCss(text) {
    var out = {};
    if (text == null || !String(text).trim()) return out;
    var s = String(text).replace(/@import[^;]+;?/gi, '').replace(/url\s*\([^)]*\)/gi, '');
    var varRe = /--([a-zA-Z0-9_-]+)\s*:\s*([^;}\n]+)/g;
    var m;
    while ((m = varRe.exec(s))) assignBrandToken(out, m[1], m[2].trim());
    var pairRe = /\b(primary|text|background|bg|accent|heading|body|ink|brand|link|foreground|fg|surface|canvas)[-_a-zA-Z0-9]*\s*[:=]\s*([^\s;}\n]+)/g;
    while ((m = pairRe.exec(s))) assignBrandToken(out, m[1], m[2].trim());
    if (!out.background || !out.text) {
      var hexes = s.match(/#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/g) || [];
      var uniq = [];
      hexes.forEach(function (h) {
        var n = normalizeHex(h);
        if (n && uniq.indexOf(n) < 0) uniq.push(n);
      });
      if (uniq.length >= 2) {
        uniq.sort(function (a, b) { return luminance(b) - luminance(a); });
        if (!out.background) out.background = uniq[0];
        if (!out.text) out.text = uniq[uniq.length - 1];
      } else if (uniq.length === 1 && !out.primary) {
        out.primary = uniq[0];
      }
    }
    return out;
  }

  function validateLogo(file) {
    if (!file) return { ok: true, dataUrl: '' };
    if (!LOGO_TYPES[file.type]) return { ok: false, error: 'Use PNG, JPEG, WebP, or GIF' };
    if (file.size > LOGO_MAX_BYTES) return { ok: false, error: 'Use a smaller image' };
    return { ok: true };
  }

  function validateLogoDataUrl(dataUrl, size) {
    if (!dataUrl) return { ok: true, dataUrl: '' };
    var s = String(dataUrl);
    if (!LOGO_DATAURL.test(s)) return { ok: false, error: 'Use PNG, JPEG, WebP, or GIF' };
    if (size != null && size > LOGO_MAX_BYTES) return { ok: false, error: 'Use a smaller image' };
    var b64 = s.split(',')[1] || '';
    var bytes = Math.floor(b64.length * 0.75);
    if (bytes > LOGO_MAX_BYTES) return { ok: false, error: 'Use a smaller image' };
    return { ok: true, dataUrl: s };
  }

  function normalizeBrand(b) {
    b = b || {};
    var logo = validateLogoDataUrl(b.logoDataUrl).ok ? (b.logoDataUrl || '') : '';
    return {
      primary: normalizeHex(b.primary) || DEFAULT_BRAND.primary,
      text: normalizeHex(b.text) || DEFAULT_BRAND.text,
      background: normalizeHex(b.background) || DEFAULT_BRAND.background,
      accent: normalizeHex(b.accent) || DEFAULT_BRAND.accent,
      headingFont: sanitizeFont(b.headingFont) || DEFAULT_BRAND.headingFont,
      bodyFont: sanitizeFont(b.bodyFont) || DEFAULT_BRAND.bodyFont,
      logoDataUrl: logo
    };
  }

  function qrFactory() {
    if (typeof qrcode === 'function') return qrcode;
    if (typeof module !== 'undefined' && module.exports && typeof require === 'function') {
      return require('./vendor/qrcode-generator/qrcode.js');
    }
    return null;
  }

  function makeQr(data) {
    var factory = qrFactory();
    if (!factory) throw new Error('QR library missing');
    var qr = factory(0, QR_EC);
    qr.addData(String(data));
    qr.make();
    return qr;
  }

  function qrSvg(data) {
    var qr = makeQr(data);
    var n = qr.getModuleCount();
    var dim = n + QR_QUIET * 2;
    var d = [];
    var r, c;
    for (r = 0; r < n; r++) {
      for (c = 0; c < n; c++) {
        if (qr.isDark(r, c)) d.push('M' + (c + QR_QUIET) + ' ' + (r + QR_QUIET) + 'h1v1h-1z');
      }
    }
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + dim + ' ' + dim +
      '" width="' + QR_PX + '" height="' + QR_PX + '" class="ab2013-disclosure__qr" role="img" aria-hidden="true" focusable="false">' +
      '<rect width="' + dim + '" height="' + dim + '" fill="' + QR_LIGHT + '"/>' +
      '<path fill="' + QR_DARK + '" d="' + d.join('') + '"/>' +
      '</svg>';
  }

  function creditHtml() {
    return '<div class="ab2013-disclosure__credit">' +
      '<a href="' + CREDIT_HREF + '" rel="noopener noreferrer">' +
      qrSvg(CREDIT_HREF) +
      '<span>' + CREDIT_LABEL + '</span>' +
      '</a></div>';
  }

  function articleInner(answers, meta, brand) {
    var dev = esc(meta.developer || ''), sys = esc(meta.system || '');
    var present = [], omitted = [], rows = [];
    FIELDS.forEach(function (f) {
      var v = answers[f.id];
      if (v == null || !String(v).trim()) { omitted.push(f.id); return; }
      present.push(f.id);
      rows.push('<section data-control="' + f.id + '">\n  <h2>' + esc(f.label) + ' <span class="ab2013-disclosure__cite">sec. 3111' + f.sub + '</span></h2>\n  <p>' +
        esc(String(v).trim()).replace(/\r?\n/g, '<br>') + '</p>\n</section>');
    });
    var logo = '';
    if (brand.logoDataUrl) {
      logo = '<img class="ab2013-disclosure__logo" src="' + brand.logoDataUrl + '" alt="' + (dev || 'Logo') + '">\n';
    }
    var metaLine = [dev, sys].filter(Boolean).join(' · ');
    var legal = 'Posted under Cal. Civ. Code sec. 3111.' +
      (meta.date ? ' Updated ' + esc(meta.date) + '.' : '') +
      (meta.contact ? ' Contact ' + esc(meta.contact) + '.' : '');
    var html = '<article class="ab2013-disclosure" lang="en">\n' +
      '<header>\n' + logo +
      '<h1>Training data</h1>\n' +
      (metaLine ? '<p class="ab2013-disclosure__meta">' + metaLine + '</p>\n' : '') +
      '</header>\n' + rows.join('\n') + '\n' +
      '<footer>\n<p class="ab2013-disclosure__legal">' + legal + '</p>\n' +
      creditHtml() + '\n</footer>\n</article>\n';
    return { html: html, present: present, omitted: omitted, complete: omitted.length === 0 };
  }

  var EMBED_CSS = [
    '.ab2013-disclosure{display:block;max-width:42em;line-height:1.6}',
    '.ab2013-disclosure h1,.ab2013-disclosure h2,.ab2013-disclosure p,.ab2013-disclosure footer,.ab2013-disclosure header{font-family:inherit;color:inherit;background:transparent}',
    '.ab2013-disclosure h1{font-size:1.6em;line-height:1.2;letter-spacing:-0.03em;margin:0 0 0.35em}',
    '.ab2013-disclosure__meta{margin:0 0 1.75em;font-size:0.95em}',
    '.ab2013-disclosure h2{font-size:0.8em;line-height:1.35;letter-spacing:0.06em;text-transform:uppercase;margin:1.6em 0 0.6em;padding-top:1em;border-top:1px solid currentColor}',
    '.ab2013-disclosure__cite{letter-spacing:0.02em;text-transform:none;font-weight:500;margin-left:0.4em;opacity:0.75}',
    '.ab2013-disclosure p{margin:0;overflow-wrap:anywhere}',
    '.ab2013-disclosure__legal{margin:2em 0 0;font-size:0.85em}',
    '.ab2013-disclosure__logo{display:block;max-height:3em;width:auto;max-width:12em;object-fit:contain;margin:0 0 1.4em}',
    '.ab2013-disclosure__credit{margin-top:1.75em}',
    '.ab2013-disclosure__credit a{display:flex;align-items:center;gap:0.75em;width:fit-content;max-width:100%;color:inherit;text-decoration:none;font-size:0.85em}',
    '.ab2013-disclosure__qr{width:6em;height:6em;flex:0 0 6em;display:block}',
    '.ab2013-disclosure__credit a:focus-visible{outline:2px solid currentColor;outline-offset:4px}'
  ].join('');

  function standaloneCss(brand) {
    var scheme = luminance(brand.background) >= 0.5 ? 'light' : 'dark';
    return ':root{color-scheme:' + scheme +
      ';--ab2013-bg:' + brand.background +
      ';--ab2013-text:' + brand.text +
      ';--ab2013-primary:' + brand.primary +
      ';--ab2013-accent:' + brand.accent +
      ';--ab2013-heading:' + brand.headingFont +
      ';--ab2013-body:' + brand.bodyFont +
      '}' +
      '*,*::before,*::after{box-sizing:border-box}' +
      'html,body{margin:0;background:var(--ab2013-bg);color:var(--ab2013-text)}' +
      'body{font-family:var(--ab2013-body);font-size:1.0625rem;line-height:1.6;-webkit-font-smoothing:antialiased}' +
      '.ab2013-disclosure{max-width:42rem;margin:0 auto;padding:3rem 1.5rem 4rem}' +
      '.ab2013-disclosure__logo{display:block;max-height:3.25rem;width:auto;max-width:12rem;object-fit:contain;margin:0 0 1.75rem}' +
      '.ab2013-disclosure h1{font-family:var(--ab2013-heading);font-weight:650;font-size:clamp(1.6rem,4vw,2.15rem);line-height:1.2;letter-spacing:-0.03em;color:var(--ab2013-primary);margin:0 0 0.4rem}' +
      '.ab2013-disclosure__meta{margin:0 0 2.25rem;font-size:0.95rem;color:var(--ab2013-text)}' +
      '.ab2013-disclosure section{margin:0}' +
      '.ab2013-disclosure h2{font-family:var(--ab2013-heading);font-weight:600;font-size:0.78rem;line-height:1.35;letter-spacing:0.08em;text-transform:uppercase;color:var(--ab2013-primary);border-top:1px solid var(--ab2013-accent);margin:1.75rem 0 0.65rem;padding-top:1rem}' +
      '.ab2013-disclosure__cite{letter-spacing:0.04em;text-transform:none;font-weight:500;color:var(--ab2013-accent);margin-left:0.4em}' +
      '.ab2013-disclosure p{margin:0;overflow-wrap:anywhere}' +
      '.ab2013-disclosure__legal{margin:2.5rem 0 0;font-size:0.85rem;color:var(--ab2013-text)}' +
      '.ab2013-disclosure__credit{margin-top:2rem}' +
      '.ab2013-disclosure__credit a{display:flex;align-items:center;gap:0.75em;width:fit-content;max-width:100%;color:var(--ab2013-text);text-decoration:none;font-size:0.8rem}' +
      '.ab2013-disclosure__qr{width:6rem;height:6rem;flex:0 0 6rem;display:block}' +
      '.ab2013-disclosure__credit a:focus-visible{outline:2px solid var(--ab2013-accent);outline-offset:4px}' +
      '@media (max-width:480px){.ab2013-disclosure{padding:2rem 1.15rem 3rem}}' +
      '@media (prefers-reduced-motion:reduce){*,*::before,*::after{transition:none!important}}';
  }

  function render(answers, meta) {
    meta = meta || {};
    var bad = validate(answers);
    if (bad.length) throw new Error('placeholder text in: ' + bad.join(', '));
    var mode = meta.mode === 'standalone' ? 'standalone' : 'embed';
    var brand = normalizeBrand(meta.brand || meta);
    var art = articleInner(answers, meta, brand);
    var css = mode === 'standalone' ? standaloneCss(brand) : EMBED_CSS;
    var fragment = '<style>' + css + '</style>\n' + art.html;
    var html;
    if (mode === 'standalone') {
      var title = 'Training data' + (meta.system ? ' · ' + esc(meta.system) : '');
      html = '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
        '<title>' + title + '</title>\n<style>' + css + '</style>\n</head>\n<body>\n' + art.html + '</body>\n</html>\n';
    } else {
      html = fragment;
    }
    return {
      html: html,
      fragment: art.html,
      css: css,
      mode: mode,
      present: art.present,
      omitted: art.omitted,
      complete: art.complete,
      contrast: contrastReport(brand)
    };
  }

  var api = {
    FIELDS: FIELDS,
    scanText: scanText,
    render: render,
    validate: validate,
    isPlaceholder: isPlaceholder,
    esc: esc,
    MAX_BYTES: MAX_BYTES,
    CREDIT_HREF: CREDIT_HREF,
    CREDIT_LABEL: CREDIT_LABEL,
    FONT_PRESETS: FONT_PRESETS,
    DEFAULT_BRAND: DEFAULT_BRAND,
    LOGO_MAX_BYTES: LOGO_MAX_BYTES,
    LOGO_TYPES: LOGO_TYPES,
    normalizeHex: normalizeHex,
    contrastRatio: contrastRatio,
    contrastReport: contrastReport,
    sanitizeFont: sanitizeFont,
    parseBrandCss: parseBrandCss,
    validateLogo: validateLogo,
    validateLogoDataUrl: validateLogoDataUrl,
    normalizeBrand: normalizeBrand,
    qrSvg: qrSvg,
    makeQr: makeQr
  };
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

    var logoDataUrl = '';

    function colorVal(name) {
      return normalizeHex($('c-' + name + '-hex').value) || normalizeHex($('c-' + name).value) || DEFAULT_BRAND[name === 'bg' ? 'background' : name];
    }

    function fontVal(which) {
      var custom = $('font-' + which + '-custom').value;
      var preset = FONT_PRESETS[$('font-' + which).value];
      return sanitizeFont(custom) || preset || FONT_PRESETS['system-sans'];
    }

    function collect() {
      var answers = {};
      FIELDS.forEach(function (f) { answers[f.id] = $(f.id).value; });
      var modeEl = document.querySelector('input[name="mode"]:checked');
      return {
        answers: answers,
        meta: {
          developer: $('dev').value,
          system: $('sys').value,
          date: new Date().toISOString().slice(0, 10),
          contact: $('contact').value,
          mode: (modeEl && modeEl.value) || 'embed',
          brand: {
            primary: colorVal('primary'),
            text: colorVal('text'),
            background: colorVal('bg'),
            accent: colorVal('accent'),
            headingFont: fontVal('heading'),
            bodyFont: fontVal('body'),
            logoDataUrl: logoDataUrl
          }
        }
      };
    }

    function setPreview(out, brand) {
      var box = $('preview');
      if (!box) return;
      box.setAttribute('data-mode', out.mode);
      if (out.mode === 'standalone') {
        box.style.background = brand.background;
        box.style.color = brand.text;
        box.style.fontFamily = brand.bodyFont;
        box.style.setProperty('--ab2013-bg', brand.background);
        box.style.setProperty('--ab2013-text', brand.text);
        box.style.setProperty('--ab2013-primary', brand.primary);
        box.style.setProperty('--ab2013-accent', brand.accent);
        box.style.setProperty('--ab2013-heading', brand.headingFont);
        box.style.setProperty('--ab2013-body', brand.bodyFont);
      } else {
        box.style.background = '';
        box.style.color = '';
        box.style.fontFamily = '';
        box.style.removeProperty('--ab2013-bg');
        box.style.removeProperty('--ab2013-text');
        box.style.removeProperty('--ab2013-primary');
        box.style.removeProperty('--ab2013-accent');
        box.style.removeProperty('--ab2013-heading');
        box.style.removeProperty('--ab2013-body');
      }
      box.innerHTML = '<style>' + out.css + '</style>' + out.fragment;
    }

    function statusLine(out) {
      return out.present.length + '/12' + (out.complete ? '' : ' · missing ' + out.omitted.map(function (id) {
        return FIELDS.filter(function (f) { return f.id === id; })[0].sub;
      }).join(' '));
    }

    function refresh() {
      var theme = $('theme');
      var col = collect();
      if (theme) theme.hidden = col.meta.mode !== 'standalone';
      var contrast = $('contrast');
      try {
        var out = render(col.answers, col.meta);
        setPreview(out, col.meta.brand);
        if (contrast) {
          if (out.mode === 'standalone' && !out.contrast.pass) {
            contrast.textContent = 'Contrast ' + out.contrast.min.toFixed(1) + ':1 — below 4.5:1';
          } else if (out.mode === 'standalone') {
            contrast.textContent = '';
          } else {
            contrast.textContent = '';
          }
        }
        return out;
      } catch (err) {
        if (contrast) contrast.textContent = '';
        if ($('status')) $('status').textContent = 'Replace placeholder text.';
        return null;
      }
    }

    function download(out) {
      var url = URL.createObjectURL(new Blob([out.html], { type: 'text/html' }));
      var a = document.createElement('a'); a.href = url; a.download = 'training-data.html'; a.click();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
    }

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

    document.querySelectorAll('input[name="mode"]').forEach(function (el) {
      el.addEventListener('change', refresh);
    });

    ['primary', 'text', 'bg', 'accent'].forEach(function (name) {
      var picker = $('c-' + name);
      var hex = $('c-' + name + '-hex');
      if (!picker || !hex) return;
      picker.addEventListener('input', function () {
        hex.value = normalizeHex(picker.value) || hex.value;
        refresh();
      });
      hex.addEventListener('input', function () {
        var n = normalizeHex(hex.value);
        if (n) picker.value = n;
        refresh();
      });
    });

    ['font-heading', 'font-body', 'font-heading-custom', 'font-body-custom', 'dev', 'sys', 'contact'].forEach(function (id) {
      var el = $(id);
      if (el) el.addEventListener('input', refresh);
    });
    form.addEventListener('input', refresh);

    $('css-brand').addEventListener('input', function () {
      var parsed = parseBrandCss($('css-brand').value);
      if (parsed.primary) { $('c-primary').value = parsed.primary; $('c-primary-hex').value = parsed.primary; }
      if (parsed.text) { $('c-text').value = parsed.text; $('c-text-hex').value = parsed.text; }
      if (parsed.background) { $('c-bg').value = parsed.background; $('c-bg-hex').value = parsed.background; }
      if (parsed.accent) { $('c-accent').value = parsed.accent; $('c-accent-hex').value = parsed.accent; }
      if (parsed.headingFont) $('font-heading-custom').value = parsed.headingFont;
      if (parsed.bodyFont) $('font-body-custom').value = parsed.bodyFont;
      refresh();
    });

    $('logo').addEventListener('change', function (e) {
      var file = e.target.files && e.target.files[0];
      logoDataUrl = '';
      var note = $('logo-status');
      if (!file) { if (note) note.textContent = ''; refresh(); return; }
      var v = validateLogo(file);
      if (!v.ok) { if (note) note.textContent = v.error; refresh(); return; }
      var reader = new FileReader();
      reader.onload = function () {
        var d = validateLogoDataUrl(String(reader.result), file.size);
        if (!d.ok) { if (note) note.textContent = d.error; logoDataUrl = ''; refresh(); return; }
        logoDataUrl = d.dataUrl;
        if (note) note.textContent = '';
        refresh();
      };
      reader.readAsDataURL(file);
    });

    $('copy').addEventListener('click', function () {
      var out = refresh();
      if (!out) return;
      var done = function (ok) {
        $('status').textContent = statusLine(out) + (ok ? ' · Copied' : '');
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(out.html).then(function () { done(true); }).catch(function () { download(out); done(false); });
      } else {
        download(out);
        done(false);
      }
    });

    $('make').addEventListener('click', function () {
      var out = refresh();
      if (!out) return;
      download(out);
      $('status').textContent = statusLine(out);
    });

    refresh();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})(typeof globalThis !== 'undefined' ? globalThis : this);
