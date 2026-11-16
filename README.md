# claimfreepatch

Free custom Cal. Civ. Code § 3111 training-data disclosure for DeadlineSF.

- `index.html` + `generator.js`: builds each customer's disclosure in their browser from their answers. Default output is an HTML fragment that inherits the host site's type and color. Standalone page mode applies brand colors, fonts, and an optional logo, all chosen locally. An optional folder scan reads files locally to point at evidence (datasets, base models, fine-tune jobs, data-file record counts). Nothing is uploaded: the CSP in `netlify.toml` sets `connect-src 'none'`.
- Each patch includes a small "Made with DeadlineSF" credit and a locally generated SVG QR code to https://deadlinesf.net (`vendor/qrcode-generator`, MIT).
- Unanswered items are left out. Placeholder text (`[[…]]`, TBD, TODO) is rejected.
- `ab2013-disclosure.html` is a clearly labeled sample disclosure made with the generator (not a real company disclosure). `/ab2013-disclosure` and `/training-data` serve that page. The cite line on the generator links to the official Cal. Civ. Code § 3111 text.
- Tests: `node --test tests/*.mjs`.

Not legal advice. No compliance guarantee.

Netlify site **claimfreepatch**, branch `main`, publish `.`.
