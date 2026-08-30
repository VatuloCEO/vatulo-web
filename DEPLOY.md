# Deploying vatulo-web

Three stages, in this order. Nothing here is reversible-by-accident, but stage 3
is the one that changes what the world sees at `vatulo.com`, so it is last.

---

## Before anything: what these documents are

The Privacy Policy and Terms have **not been reviewed by a lawyer.** That was a
deliberate call — ship the MVP, get a reviewed version out once there is
traction. They are written to be accurate about what the code actually does and
to cover the requirements that are checkable without counsel: Law 25's named
privacy officer, cross-border disclosure, automated processing, retention and
portability; Apple's mandatory EULA terms; Google Play's account-deletion URL.

Two things that a lawyer would raise and that this cannot substitute for:

- **A French version.** Quebec's Charter of the French language, as amended by
  Bill 96, requires consumer contracts of adhesion to be presented in French
  before an English version can be agreed to. Vatulo is a Montreal consumer app.
  This is the largest open exposure and it is a translation job, not a legal
  one — ask and it can be done.
- **The liability and indemnity sections.** They are drafted conservatively,
  with an explicit savings clause for the Quebec *Consumer Protection Act*
  rather than a broad exclusion that Act would strike down. Conservative is the
  right default without counsel; it is not the same as reviewed.

Nothing below is blocked on either. Deploy when ready.

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

Do this once you are happy with what is live at the github.io URL.

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

Then fill in the store consoles. These four fields are the whole reason the
site had to exist before submission:

| Console | Field | Value |
| --- | --- | --- |
| App Store Connect | Privacy Policy URL | https://vatulo.com/privacy/ |
| App Store Connect | Support URL | https://vatulo.com/support/ |
| Play Console | Privacy policy | https://vatulo.com/privacy/ |
| Play Console | Account deletion URL | https://vatulo.com/support/#delete-account |

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
