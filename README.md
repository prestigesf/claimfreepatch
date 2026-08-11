# claimfreepatch

Free Cal. Civ. Code § 3111 training-data disclosure patch for DeadlineSF.

## Files
- `index.html` — claim page, with the follow-up email capture
- `ab2013-disclosure.html` — the disclosure (required)
- `training-data-badge.html` — optional footer badge

## Email capture

The claim page carries a Netlify Form named `patch-claim`. Submissions land in
this site's **Forms** tab — no backend, no function, no API key.

It is deliberately *not* a gate. The disclosure downloads whether or not an
address is given, because Dee's script promises the patch is theirs either way
and the page must not contradict the agent. The field asks for the follow-up
only.

A hidden `company-website` honeypot catches bots. Netlify detects the form from
the static markup at deploy, so it must stay in `index.html` as real HTML — a
form injected by JavaScript alone is never registered.

## Netlify
Connect this repo to site **claimfreepatch** · branch `main` · publish directory empty.

Live: https://claimfreepatch.netlify.app
