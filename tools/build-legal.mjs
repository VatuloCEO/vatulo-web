// Renders the legal documents into /privacy/, /terms/, /fr/confidentialite/
// and /fr/conditions/.
//
// The documents are written and reviewed as Markdown, in `legal/`, because that
// is the form a lawyer will hand edits back in. GitHub Pages serves static
// HTML, so this turns one into the other and commits the result — no build runs
// on the server, and the site keeps working even if this script is never run
// again.
//
// It is a deliberately small Markdown subset: headings, paragraphs, bold,
// italic, links, bullet lists, block quotes, horizontal rules and pipe tables.
// That is everything the four documents use, and adding a dependency to a
// static site to support syntax nobody writes would be a poor trade. If a
// lawyer returns a document using something else, this renders it literally
// rather than silently dropping it — visible in the output, which is the
// failure mode to prefer.
//
//   node tools/build-legal.mjs
//
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

const SUPPORT_EMAIL = 'vatulosupport@gmail.com';

// ---------------------------------------------------------------------------
// The documents
//
// `path` is the live URL and decides how deep the page sits, which decides how
// many `../` every asset reference needs. `alternate` is the same document in
// the other language: it feeds both the link in the header and the hreflang
// pair, and a document without one would be invisible to the switcher.
// ---------------------------------------------------------------------------

const DOCUMENTS = [
  {
    source: 'legal/privacy-policy.md',
    out: 'privacy/index.html',
    path: '/privacy/',
    lang: 'en',
    alternate: '/fr/confidentialite/',
    title: 'Privacy Policy — Vatulo',
    description:
      'What Vatulo collects, why, who else can see it, and how to get rid of it. Your location never leaves your phone.',
  },
  {
    source: 'legal/terms-of-service.md',
    out: 'terms/index.html',
    path: '/terms/',
    lang: 'en',
    alternate: '/fr/conditions/',
    title: 'Terms of Service — Vatulo',
    description:
      'The rules for using Vatulo: who may join, what you may not post, how reports are handled, and the limits of what we can promise.',
  },
  {
    source: 'legal/politique-de-confidentialite.md',
    out: 'fr/confidentialite/index.html',
    path: '/fr/confidentialite/',
    lang: 'fr',
    alternate: '/privacy/',
    title: 'Politique de confidentialité — Vatulo',
    description:
      "Ce que Vatulo recueille, pourquoi, qui d'autre peut le voir et comment vous en débarrasser. Votre position ne quitte jamais votre téléphone.",
  },
  {
    source: 'legal/conditions-d-utilisation.md',
    out: 'fr/conditions/index.html',
    path: '/fr/conditions/',
    lang: 'fr',
    alternate: '/terms/',
    title: "Conditions d'utilisation — Vatulo",
    description:
      "Les règles d'utilisation de Vatulo : qui peut s'inscrire, ce que vous ne pouvez pas publier, le traitement des signalements et les limites de ce que nous pouvons promettre.",
  },
];

// ---------------------------------------------------------------------------
// Chrome, in both languages
// ---------------------------------------------------------------------------

const CHROME = {
  en: {
    skip: 'Skip to content',
    home: 'Vatulo — home',
    nav: [
      ['/#how', 'How it works'],
      ['/#safety', 'Safety'],
      ['/privacy/', 'Privacy'],
      ['/terms/', 'Terms'],
    ],
    action: ['/support/', 'Support'],
    switcher: 'Français',
    switcherLabel: 'Lire cette page en français',
    tagline: 'Find your people. Make the night.',
    footer: [
      ['/privacy/', 'Privacy Policy'],
      ['/terms/', 'Terms of Service'],
      ['/support/', 'Support'],
    ],
    contact: 'Contact',
    age: '18+ only',
  },
  fr: {
    skip: 'Aller au contenu',
    home: 'Vatulo — accueil',
    nav: [
      ['/#how', 'Comment ça marche'],
      ['/#safety', 'Sécurité'],
      ['/fr/confidentialite/', 'Confidentialité'],
      ['/fr/conditions/', 'Conditions'],
    ],
    action: ['/support/', 'Aide'],
    switcher: 'English',
    switcherLabel: 'Read this page in English',
    tagline: 'Trouve ton monde. Fais ta soirée.',
    footer: [
      ['/fr/confidentialite/', 'Politique de confidentialité'],
      ['/fr/conditions/', "Conditions d'utilisation"],
      ['/support/', 'Aide'],
    ],
    contact: 'Nous joindre',
    age: '18 ans et plus',
  },
};

// ---------------------------------------------------------------------------
// Markdown
// ---------------------------------------------------------------------------

const escape = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Turns a site-root path into one relative to a page `depth` levels down. */
const rel = (path, depth) => (depth === 0 ? path.replace(/^\//, '') : '../'.repeat(depth) + path.replace(/^\//, ''));

/**
 * Inline formatting. Escaping happens first, so nothing below can inject markup
 * that was not written here.
 */
function inline(text, depth) {
  let out = escape(text);
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');

  // [text](url). Only http(s) and mailto are allowed through — the documents
  // link to their own pages and nothing else, and a scheme this does not
  // recognise should render as the literal text rather than become a link.
  out = out.replace(/\[([^\]]+)\]\(((?:https?:|mailto:)[^)\s]+)\)/g, (_, label, href) => {
    // The Markdown writes these absolutely, because the app links to the same
    // documents and https://vatulo.com/privacy/ is the only form that means
    // anything from a phone. On the site itself that would be a round trip
    // through a domain that does not resolve yet — so a link the site can
    // serve becomes relative, exactly like every other path here.
    const local = href.startsWith('https://vatulo.com/')
      ? rel(href.slice('https://vatulo.com'.length), depth)
      : href;
    return `<a href="${local}">${label}</a>`;
  });

  out = out.replace(
    new RegExp(SUPPORT_EMAIL.replace(/\./g, '\\.'), 'g'),
    `<a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>`,
  );

  return out;
}

/** Splits a pipe-table row into cells, ignoring the leading and trailing pipe. */
const cells = (row) =>
  row.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());

const isTableSeparator = (line) =>
  /^\s*\|?[\s:|-]*-[\s:|-]*\|?\s*$/.test(line) && line.includes('-');

function render(markdown, depth) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const html = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === '') {
      i++;
      continue;
    }

    const heading = line.match(/^(#{1,4})\s+(.*)$/);
    if (heading) {
      html.push(`<h${heading[1].length}>${inline(heading[2].trim(), depth)}</h${heading[1].length}>`);
      i++;
      continue;
    }

    if (/^(\*\s*){3,}$|^(-\s*){3,}$|^(_\s*){3,}$/.test(line.trim())) {
      html.push('<hr>');
      i++;
      continue;
    }

    // Block quote. Collected whole, stripped of its markers, then rendered as
    // its own document so paragraphs inside behave like paragraphs anywhere.
    if (line.startsWith('>')) {
      const quoted = [];
      while (i < lines.length && lines[i].startsWith('>')) {
        quoted.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      html.push(`<blockquote>\n${render(quoted.join('\n'), depth)}\n</blockquote>`);
      continue;
    }

    if (line.trim().startsWith('|') && isTableSeparator(lines[i + 1] ?? '')) {
      const head = cells(lines[i]);
      i += 2;
      const body = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        body.push(cells(lines[i]));
        i++;
      }
      const th = head.map((c) => `<th scope="col">${inline(c, depth)}</th>`).join('');
      const rows = body
        .map((r) => `<tr>${r.map((c) => `<td>${inline(c, depth)}</td>`).join('')}</tr>`)
        .join('\n');
      // Wrapped so a wide table scrolls inside itself rather than pushing the
      // whole page sideways on a phone.
      html.push(
        `<div class="table-scroll">\n<table>\n<thead><tr>${th}</tr></thead>\n<tbody>\n${rows}\n</tbody>\n</table>\n</div>`,
      );
      continue;
    }

    // Bullet list. The documents are hard-wrapped, so a continuation line is
    // any indented line following a bullet, and it belongs to that bullet.
    if (/^[-*]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        let item = lines[i].replace(/^[-*]\s+/, '');
        i++;
        while (i < lines.length && /^\s{2,}\S/.test(lines[i])) {
          item += ' ' + lines[i].trim();
          i++;
        }
        items.push(`<li>${inline(item, depth)}</li>`);
      }
      html.push(`<ul>\n${items.join('\n')}\n</ul>`);
      continue;
    }

    // Paragraph. Consecutive non-blank lines are one wrapped paragraph.
    const paragraph = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !/^#{1,4}\s/.test(lines[i]) &&
      !lines[i].startsWith('>') &&
      !/^[-*]\s+/.test(lines[i]) &&
      !lines[i].trim().startsWith('|')
    ) {
      paragraph.push(lines[i].trim());
      i++;
    }
    html.push(`<p>${inline(paragraph.join(' '), depth)}</p>`);
  }

  return html.join('\n');
}

// ---------------------------------------------------------------------------
// Page chrome — kept in step with index.html and support/index.html by hand.
// A handful of pages is not enough to justify a templating layer.
// ---------------------------------------------------------------------------

function page({ title, description, path, lang, alternate, body, depth }) {
  const t = CHROME[lang];
  const r = (p) => rel(p, depth);
  const other = lang === 'en' ? 'fr' : 'en';

  const nav = t.nav.map(([href, label]) => `      <a href="${r(href)}">${label}</a>`).join('\n');
  const footer = t.footer.map(([href, label]) => `        <a href="${r(href)}">${label}</a>`).join('\n');

  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="${description}">
<link rel="canonical" href="https://vatulo.com${path}">

<!-- Both languages of this document declare each other, and x-default points
     at French: under the Charter of the French language the French version is
     the one presented first, and a search engine with no language preference
     should land on it. -->
<link rel="alternate" hreflang="${lang}" href="https://vatulo.com${path}">
<link rel="alternate" hreflang="${other}" href="https://vatulo.com${alternate}">
<link rel="alternate" hreflang="x-default" href="https://vatulo.com${lang === 'fr' ? path : alternate}">

<meta property="og:type" content="article">
<meta property="og:site_name" content="Vatulo">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:url" content="https://vatulo.com${path}">
<meta property="og:locale" content="${lang === 'fr' ? 'fr_CA' : 'en_CA'}">
<meta name="theme-color" content="#0a0a0f">

<link rel="icon" href="${r('/assets/img/favicon.png')}" sizes="48x48">
<link rel="apple-touch-icon" href="${r('/assets/img/app-icon.png')}">
<link rel="stylesheet" href="${r('/assets/css/site.css')}">
</head>
<body>

<!-- Generated by tools/build-legal.mjs from the Markdown in legal/. Edit the
     Markdown, re-run the script, and commit both. -->

<a class="skip" href="#main">${t.skip}</a>

<header class="header" id="header">
  <div class="wrap header__inner">
    <a class="wordmark" href="${r('/')}" aria-label="${t.home}">vatulo</a>
    <nav class="nav" aria-label="${lang === 'fr' ? 'Principale' : 'Primary'}">
${nav}
    </nav>
    <div class="header__end">
      <a class="lang" href="${r(alternate)}" hreflang="${other}" lang="${other}" title="${t.switcherLabel}">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3.2 9h17.6M3.2 15h17.6"/><path d="M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18Z"/></svg>
        <span>${t.switcher}</span>
      </a>
      <a class="btn btn--ghost btn--sm" href="${r(t.action[0])}">${t.action[1]}</a>
    </div>
  </div>
</header>

<main id="main" class="wrap page-head">
  <article class="prose">
${body}
  </article>
</main>

<footer class="footer" style="margin-top:72px">
  <div class="wrap">
    <div class="footer__grid">
      <div class="stack stack--tight">
        <span class="wordmark wordmark--lg">vatulo</span>
        <p class="muted">${t.tagline}</p>
      </div>

      <nav class="footer__links" aria-label="${lang === 'fr' ? 'Pied de page' : 'Footer'}">
${footer}
        <a href="mailto:${SUPPORT_EMAIL}">${t.contact}</a>
        <a href="${r(alternate)}" hreflang="${other}" lang="${other}">${t.switcher}</a>
      </nav>
    </div>

    <div class="footer__bottom">
      <span>&copy; 2026 Vatulo · Montréal, Québec, Canada</span>
      <span>${t.age}</span>
    </div>
  </div>
</footer>

<script>
(function () {
  var header = document.getElementById('header');
  var onScroll = function () { header.dataset.scrolled = String(window.scrollY > 8); };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();
</script>

</body>
</html>
`;
}

// ---------------------------------------------------------------------------

let failed = false;

for (const doc of DOCUMENTS) {
  const markdown = readFileSync(doc.source, 'utf8');

  // The address is what makes the rights in these documents exercisable. If a
  // revision drops it, the page still renders and nobody notices for months.
  if (!markdown.includes(SUPPORT_EMAIL)) {
    console.error(`  FAIL  ${doc.source} does not mention ${SUPPORT_EMAIL}`);
    failed = true;
  }

  // /privacy/index.html is one level down, /fr/conditions/index.html is two.
  const depth = doc.out.split('/').length - 1;

  mkdirSync(dirname(doc.out), { recursive: true });
  writeFileSync(doc.out, page({ ...doc, depth, body: render(markdown, depth) }), 'utf8');
  console.log(`  ok    ${doc.source} -> ${doc.out}`);
}

// Every document must be reachable from its counterpart, or the switcher is a
// dead end and the French version is published but unfindable.
const paths = new Set(DOCUMENTS.map((d) => d.path));
for (const doc of DOCUMENTS) {
  if (!paths.has(doc.alternate)) {
    console.error(`  FAIL  ${doc.path} points at ${doc.alternate}, which nothing builds`);
    failed = true;
  }
}

process.exit(failed ? 1 : 0);
