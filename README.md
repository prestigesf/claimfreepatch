# claimfreepatch

Free custom Cal. Civ. Code § 3111 training-data disclosure for DeadlineSF.

- `index.html` + `generator.js`: builds each customer's disclosure in their browser from their answers. An optional folder scan reads files locally to point at evidence (datasets, base models, fine-tune jobs, data-file record counts). Nothing is uploaded: the CSP in `netlify.toml` sets `connect-src 'none'`.
- Unanswered items are left out. Placeholder text (`[[…]]`, TBD, TODO) is rejected.
- `ab2013-disclosure.html` (old static template) is no longer served; it redirects to `/`.
- Tests: `node --test tests/*.mjs`.

Not legal advice. No compliance guarantee.

Netlify site **claimfreepatch**, branch `main`, publish `.`.
