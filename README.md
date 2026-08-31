# vatulo-web

The public marketing site for **Vatulo** — [vatulo.com](https://vatulo.com).

Static HTML and one stylesheet. No framework, no build step, no dependencies,
nothing to install. It is served by GitHub Pages exactly as it sits in this
repository.

**This repository contains no application code.** Vatulo's app lives in a
separate private repository; what is here is marketing copy, the two legal
documents, and the brand assets needed to render them.

## Pages

| Path | File | What it is |
| --- | --- | --- |
| `/` | `index.html` | Landing page |
| `/privacy/` | `privacy/index.html` | Privacy Policy — **generated**, see below |
| `/terms/` | `terms/index.html` | Terms of Service — **generated** |
| `/fr/confidentialite/` | generated | Politique de confidentialité |
| `/fr/conditions/` | generated | Conditions d'utilisation |
| `/support/` | `support/index.html` | Support, and the contact address |
| — | `404.html` | Served by Pages for any miss; self-contained |

`/privacy/` and `/terms/` are the URLs Apple asks for at App Store submission,
and the Privacy Policy URL is a hard requirement in App Store Connect.

## Layout

```
index.html              Landing page
privacy/  terms/        Generated from legal/*.md — do not hand-edit
fr/confidentialite/     The same documents, in French
fr/conditions/
support/                Support page
404.html                Self-contained, because Pages serves it from any depth

legal/
  privacy-policy.md               The documents themselves. Edit these.
  terms-of-service.md
  politique-de-confidentialite.md
  conditions-d-utilisation.md

assets/
  css/site.css          The whole design system, ~700 lines
  fonts/                Inter, self-hosted, latin + latin-ext
  img/                  App icon, favicon, three app screenshots

tools/
  build-legal.mjs       legal/*.md -> privacy/ and terms/
  fetch-fonts.mjs       Re-downloads Inter (rarely needed)
  serve.mjs             Local preview, no dependencies

.nojekyll               Pages serves the files as they are
robots.txt  sitemap.xml
```

## Working on it

```sh
node tools/serve.mjs          # http://localhost:4321
```

Every path in the site is relative, so opening `index.html` from the file system
works too — but `/privacy/` and `/terms/` only resolve to their `index.html`
when something is actually serving, which is what the script is for. It also
mirrors how Pages redirects `/privacy` to `/privacy/`.

### Changing the legal documents

Edit the Markdown in `legal/`, then:

```sh
node tools/build-legal.mjs
```

Commit both the Markdown and the regenerated HTML. The HTML is committed on
purpose — Pages runs nothing, so what is in the repository is what gets served.

The build fails if a document stops mentioning the support address. That address
is the only way to exercise the rights the Privacy Policy grants, and it is the
kind of thing a revision drops silently.

> **These documents are duplicated from the app repository, which is where they
> are authored.** When they change there, copy them here and rebuild. There is
> no automation for this yet; it is two files and it is worth knowing about.

## Brand

Taken from the app's own design tokens, restated as CSS custom properties at the
top of `assets/css/site.css`.

| | |
| --- | --- |
| Ground | `#0a0a0f` — near-black with a faint blue-violet cast, not pure black |
| Surfaces | `#16161f` → `#252533` |
| Accent | `#8b5cf6` violet, for anything you can act on |
| Gradient | `#a855f7` → `#ec4899` → `#f97316` |
| Trust | `#3b82f6` blue — never violet, so safety never reads as decoration |
| Type | Inter, 400–800, tight negative tracking on display sizes |
| Wordmark | lowercase `vatulo` in Quicksand 700, violet→pink |
| Symbol | a V with a dot over it — also a person with their arms up |

**Two typefaces, and the split is the point.** Inter sets the page. Quicksand
sets one word, the wordmark, in one weight. A wordmark in the same neutral
grotesque as the body copy is not a wordmark, it is a heading — so Quicksand
must not spread, and the moment a section heading borrows it the distinction is
gone.

**The symbol and the wordmark are separate marks.** The app header carries the
symbol alone; this site's nav carries the lockup, because a visitor who has just
arrived does not yet know the name. The symbol is declared once per page as an
SVG sprite in `<defs>` and referenced with `<use>` — a gradient is an id,
and an id means one thing per document.

One rule carried over from the app, because a marketing page is exactly where it
gets broken: **the gradient is a brand moment, not a decoration.** It paints the
wordmark and the single call to action that matters. Everything else is solid
violet or a surface. Four gradient buttons on a page means none of them is the
important one.

## Deploying

See [DEPLOY.md](DEPLOY.md). Short version: push to `main`, turn on Pages, then
point DNS at it — in that order, and DNS last.
