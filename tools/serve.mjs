// A local preview of the site, with no dependencies.
//
//   node tools/serve.mjs        -> http://localhost:4321
//   node tools/serve.mjs 8080
//
// You can also just open index.html from the file system — every path in the
// site is relative for exactly that reason. This exists because file:// does
// not resolve a directory to its index.html, so /privacy/ and /terms/ only
// behave the way GitHub Pages will behave when something is actually serving.
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// `fileURLToPath` rather than `.pathname`, which on Windows hands back
// `/C:/Users/Alex%20Anderson/...` — a leading slash and a percent-encoded space,
// both of which make every lookup miss.
const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const PORT = Number(process.argv[2]) || 4321;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);

  // `normalize` collapses any `..`, and the prefix check refuses anything that
  // still climbs out of the site directory.
  const target = join(ROOT, normalize(url));
  if (!target.startsWith(ROOT)) {
    res.writeHead(403).end('Forbidden');
    return;
  }

  // /privacy redirects to /privacy/, as Pages does. Not cosmetic: the site's
  // paths are relative, so `../assets/…` from a URL with no trailing slash
  // resolves one level too high. Serving that 200 locally would hide a break
  // that production never has.
  if (!url.endsWith('/') && existsSync(target) && statSync(target).isDirectory()) {
    res.writeHead(301, { Location: url + '/' }).end();
    return;
  }

  let file = target;
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');

  if (!existsSync(file)) {
    const notFound = join(ROOT, '404.html');
    res.writeHead(404, { 'Content-Type': TYPES['.html'] });
    if (existsSync(notFound)) createReadStream(notFound).pipe(res);
    else res.end('Not found');
    return;
  }

  res.writeHead(200, {
    'Content-Type': TYPES[extname(file).toLowerCase()] ?? 'application/octet-stream',
    'Cache-Control': 'no-cache',
  });
  createReadStream(file).pipe(res);
}).listen(PORT, () => {
  console.log(`\n  vatulo.com preview\n\n  http://localhost:${PORT}\n`);
  console.log(`  /            home`);
  console.log(`  /privacy/    privacy policy`);
  console.log(`  /terms/      terms of service`);
  console.log(`  /support/    support\n`);
});
