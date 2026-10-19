# site/: what claimfreepatch.netlify.app should serve (added 2026-10-19, add-only)

Why the download 404'd: the live site isn't built from this repo. It's a manual CLI deploy (6a9ddab2d0aeb9e88b8eb458, 2026-09-06, "restore-deadlinesf-MISSING_AI_DISCLOSURE-patch") that uploaded only the AI-disclosure patch page. `ab2013-disclosure.html` and `training-data-badge.html` were never uploaded, so `/ab2013-disclosure.html` returned 404. The repo's netlify.toml headers weren't applied either ("No header rules processed").

The fix keeps the live behavior and adds the missing files:
- `index.html`: the live page, byte-for-byte as served on 2026-10-19 (copyable FastAPI AI-disclosure patch, no email, no form).
- `ab2013-disclosure.html`, `training-data-badge.html`: the § 3111 download files, now served at their paths.
- `claim-3111.html`: the repo's § 3111 claim page (download flow), served beside it.

Deploy from the repo root (this applies the root netlify.toml headers): `netlify deploy --dir site --site claimfreepatch` (draft), and add `--prod` only after the owner's OK.
