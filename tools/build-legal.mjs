// Renders the legal documents into /privacy/ and /terms/.
//
// The Privacy Policy and the Terms are written and reviewed as Markdown, in
// `legal/`, because that is the form a lawyer will hand back edits in. GitHub
// Pages serves static HTML, so this turns one into the other and commits the
// result — no build runs on the server, and the site keeps working even if this
// script is never run again.
//
// It is a deliberately small Markdown subset: headings, paragraphs, bold,
// italic, bullet lists, block quotes and pipe tables. That is everything the
// two documents use, and adding a dependency to a four-page static site to
// support syntax nobody writes would be a poor trade. If a lawyer returns a
// document using something else, this will render it literally rather than
// silently dropping it — visible in the output, which is the failure mode to
// prefer.
//
//   node tools/build-legal.mjs
//
import { readFileSync, writeFileSync } from 'node:fs';

const SUPPORT_EMAIL = 'vatulosupport@gmail.com';

const DOCUMENTS = [
  {
    source: 'legal/privacy-policy.md',
    out: 'privacy/index.html',
    path: '/privacy/',
    title: 'Privacy Policy — Vatulo',
    description:
      'What Vatulo collects, why, who else can see it, and how to get rid of it. Your location never leaves your phone.',
  },
  {
    source: 'legal/terms-of-service.md',
    out: 'terms/index.html',
    path: '/terms/',
    title: 'Terms of Service — Vatulo',
    description:
      'The rules for using Vatulo: who may join, what you may not post, how reports are handled, and the limits of what we can promise.',
  },
];

// ---------------------------------------------------------------------------
// Markdown
// ---------------------------------------------------------------------------

const escape = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * Inline formatting. Escaping happens first, so nothing below can inject markup
 * that was not written here.
 */
function inline(text) {
  let out = escape(text);
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');

  // [text](url). Only http(s) and mailto are allowed through — the documents
  // link to two of their own pages and nothing else, and a scheme this does not
  // recognise should render as the literal text rather than become a link.
  out = out.replace(/\[([^\]]+)\]\(((?:https?:|mailto:)[^)\s]+)\)/g, (_, label, href) => {
    // The Markdown writes these absolutely, because the app links to the same
    // documents and https://vatulo.com/privacy/ is the only form that means
    // anything from a phone. On the site itself that would be a round trip
    // through a domain that does not resolve yet — so a link the site can
    // serve becomes relative, exactly like every other path here.
    const local = href.replace(/^https:\/\/vatulo\.com\//, '../');
    return `<a href="${local}">${label}</a>`;
  });
  // The support address appears in both documents and is the only way to
  // exercise the rights the Privacy Policy grants. It should be one tap.
  out = out.replace(
    new RegExp(SUPPORT_EMAIL.replace(/\./g, '\\.'), 'g'),
    `<a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>`,
  );
  return out;
}

/** Splits a pipe-table row into cells, ignoring the leading and trailing pipe. */
const cells = (row) =>
  row
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((c) => c.trim());

const isTableSeparator = (line) => /^\s*\|?[\s:|-]*-[\s:|-]*\|?\s*$/.test(line) && line.includes('-');

function render(markdown) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const html = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Blank
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Heading
    const heading = line.match(/^(#{1,4})\s+(.*)$/);
    if (heading) {
      const level = heading[1].length;
      html.push(`<h${level}>${inline(heading[2].trim())}</h${level}>`);
      i++;
      continue;
    }

    // Horizontal rule
    if (/^(\*\s*){3,}$|^(-\s*){3,}$|^(_\s*){3,}$/.test(line.trim())) {
      html.push('<hr>');
      i++;
      continue;
    }

    // Block quote — the draft banner at the top of both documents. Collected
    // whole, stripped of its markers, then rendered as its own document so the
    // paragraphs inside it behave like paragraphs anywhere else.
    if (line.startsWith('>')) {
      const quoted = [];
      while (i < lines.length && lines[i].startsWith('>')) {
        quoted.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      html.push(`<blockquote>\n${render(quoted.join('\n'))}\n</blockquote>`);
      continue;
    }

    // Table
    if (line.trim().startsWith('|') && isTableSeparator(lines[i + 1] ?? '')) {
      const head = cells(lines[i]);
      i += 2;
      const body = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        body.push(cells(lines[i]));
        i++;
      }
      const th = head.map((c) => `<th scope="col">${inline(c)}</th>`).join('');
      const rows = body
        .map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`)
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
        items.push(`<li>${inline(item)}</li>`);
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
    html.push(`<p>${inline(paragraph.join(' '))}</p>`);
  }

  return html.join('\n');
}

// ---------------------------------------------------------------------------
// Page chrome — kept in step with index.html and support/index.html by hand.
// Four pages is not enough to justify a templating layer.
// ---------------------------------------------------------------------------

const page = ({ title, description, path, body }) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="${description}">
<link rel="canonical" href="https://vatulo.com${path}">

<meta property="og:type" content="article">
<meta property="og:site_name" content="Vatulo">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:url" content="https://vatulo.com${path}">
<meta name="theme-color" content="#0a0a0f">

<link rel="icon" href="../assets/img/favicon.png" sizes="48x48">
<link rel="apple-touch-icon" href="../assets/img/app-icon.png">
<link rel="stylesheet" href="../assets/css/site.css">
</head>
<body>

<!-- Generated by tools/build-legal.mjs from the Markdown in legal/. Edit the
     Markdown, re-run the script, and commit both. -->

<a class="skip" href="#main">Skip to content</a>

<header class="header" id="header">
  <div class="wrap header__inner">
    <a class="wordmark" href="../" aria-label="Vatulo — home">vatulo</a>
    <nav class="nav" aria-label="Primary">
      <a href="../#how">How it works</a>
      <a href="../#safety">Safety</a>
      <a href="../privacy/">Privacy</a>
      <a href="../terms/">Terms</a>
    </nav>
    <a class="btn btn--ghost btn--sm" href="../support/">Support</a>
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
        <p class="muted">Find your people. Make the night.</p>
      </div>

      <nav class="footer__links" aria-label="Footer">
        <a href="../privacy/">Privacy Policy</a>
        <a href="../terms/">Terms of Service</a>
        <a href="../support/">Support</a>
        <a href="mailto:${SUPPORT_EMAIL}">Contact</a>
      </nav>
    </div>

    <div class="footer__bottom">
      <span>&copy; 2026 Vatulo · Montréal, Québec, Canada</span>
      <span>18+ only</span>
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

  writeFileSync(doc.out, page({ ...doc, body: render(markdown) }), 'utf8');
  console.log(`  ok    ${doc.source} -> ${doc.out}`);
}

process.exit(failed ? 1 : 0);
