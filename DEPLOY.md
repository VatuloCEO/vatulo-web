# Deploying vatulo-web

Three stages, in this order. Nothing here is reversible-by-accident, but stage 3
is the one that changes what the world sees at `vatulo.com`, so it is last.

---

## Before anything: the draft banner

Both legal documents currently open with:

> **DRAFT — NOT YET REVIEWED BY A LAWYER.** … Do not ship this as-is without
> that review.

That banner is honest and it is correct — the documents genuinely have not been
reviewed. But it will be **publicly visible** at `vatulo.com/privacy`, and it is
the first thing an App Store reviewer reads when they open the Privacy Policy
URL you gave them.

There is no good way to publish a policy that tells its own readers not to trust
it. Resolve this before stage 3:

- **Get the review done** (a Quebec lawyer — Law 25 plus PIPEDA), fold in the
  edits, and delete the banner. This is the real answer.
- Or, if the site must go up first, replace the banner with a plain effective
  date and keep the site off `vatulo.com` until the review lands. The App Store
  submission needs the reviewed version regardless.

Stages 1 and 2 are safe to do now either way — they publish to a
`github.io` URL nobody has been given.

---

## Stage 1 — Create the repository and push

The repository is **public**, which is what free GitHub Pages requires. There is
no application code in it — check `git ls-files` if you want to satisfy yourself
of that before making it public.

```sh
cd "path/to/vatulo-web"

gh repo create vatulo-web \
  --public \
  --source . \
  --description "The official Vatulo website — vatulo.com" \
  --push
```

> **Your action.** `gh` is already authenticated as `VatuloCEO`. If you would
> rather create the repository through the web UI, make it public, do not add a
> README or licence (this repo has its own), then
> `git remote add origin https://github.com/VatuloCEO/vatulo-web.git` and
> `git push -u origin main`.

## Stage 2 — Turn on GitHub Pages

**Your action** — this is a repository setting, not something in the code.

1. `https://github.com/VatuloCEO/vatulo-web` → **Settings** → **Pages**
2. **Source**: *Deploy from a branch*
3. **Branch**: `main`, folder `/ (root)` → **Save**

A minute later the site is live at:

```
https://vatuloceo.github.io/vatulo-web/
```

Every path in the site is relative, so it renders correctly at that URL as well
as at the apex domain later. Check all four pages there before going further.

## Stage 3 — Point vatulo.com at it

Do this only once you are happy with stage 2 and the draft banner is resolved.

### 3a. Porkbun DNS

**Your action.** Porkbun → **Domain Management** → `vatulo.com` → **DNS**.

First, **delete Porkbun's default parking records** — a domain arrives with an
`A` record pointing at Porkbun's holding page and a `www` `ALIAS`/`CNAME`
alongside it. Leaving them in place is the usual reason a new Pages domain
half-works.

Then add:

| Type | Host | Answer | TTL |
| --- | --- | --- | --- |
| A | *(blank)* | `185.199.108.153` | 600 |
| A | *(blank)* | `185.199.109.153` | 600 |
| A | *(blank)* | `185.199.110.153` | 600 |
| A | *(blank)* | `185.199.111.153` | 600 |
| CNAME | `www` | `vatuloceo.github.io` | 600 |

A blank host is the apex — Porkbun shows it as `vatulo.com`. The `CNAME` answer
is the **account** domain (`vatuloceo.github.io`), never the project URL, and it
takes no `/vatulo-web` path and no trailing dot.

Optionally add the four `AAAA` records for IPv6:
`2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`,
`2606:50c0:8003::153`.

Do **not** use Porkbun's URL forwarding for this. It serves a redirect, not the
site, and it will break the HTTPS certificate step below.

Wait for propagation — usually minutes:

```sh
nslookup vatulo.com
```

You want the four `185.199.x.153` addresses back.

### 3b. Tell GitHub about the domain

**Your action.** Repository **Settings** → **Pages** → **Custom domain** →
enter `vatulo.com` → **Save**.

This commits a `CNAME` file to the repository automatically. That is expected —
leave it there, and do not delete it in a later commit. It is deliberately not
committed ahead of time: a `CNAME` file present before DNS resolves takes the
`github.io` URL down without putting anything in its place.

GitHub then runs a DNS check and requests a Let's Encrypt certificate. Once
**Enforce HTTPS** stops being greyed out — anywhere from a few minutes to an
hour — tick it.

### 3c. Check

- `https://vatulo.com` — home
- `https://vatulo.com/privacy` — redirects to `/privacy/` and renders
- `https://vatulo.com/terms`
- `https://vatulo.com/support`
- `https://www.vatulo.com` — redirects to the apex
- `http://vatulo.com` — redirects to `https://`

Then paste the privacy and support URLs into App Store Connect.

---

## Updating the site later

```sh
git add -A && git commit -m "..." && git push
```

Pages redeploys within a minute or so. If you changed anything in `legal/`, run
`node tools/build-legal.mjs` before committing.

## What is *not* in this repository, and should never be

- Application source, from any Vatulo repository
- Supabase keys, project references, or connection strings
- `.env` files of any kind
- EAS or Apple credentials

It is public. Everything committed here is world-readable forever, including
anything later removed — a deleted file stays in the history.
