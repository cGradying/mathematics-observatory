// Dev helper: serve dist/ applying vercel.json headers, cleanUrls, 404.html. Usage: node scripts/serve-dist-with-headers.mjs [port]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const cfg = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
const rules = (cfg.headers || []).map(h => ({ re: new RegExp('^' + h.source + '$'), headers: h.headers }));
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.png': 'image/png', '.jpg': 'image/jpeg', '.txt': 'text/plain', '.xml': 'application/xml' };

function resolveFile(p) {
  const f = path.join(dist, p);
  if (!f.startsWith(dist)) return null;
  const isFile = x => fs.existsSync(x) && fs.statSync(x).isFile();
  if (isFile(f)) return f;
  if (cfg.cleanUrls && isFile(f + '.html')) return f + '.html';
  if (isFile(path.join(f, 'index.html'))) return path.join(f, 'index.html');
  return null;
}

export function createServer() {
  return http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    // cleanUrls: /x.html redirects to /x
    if (cfg.cleanUrls && p.endsWith('.html')) {
      res.writeHead(308, { Location: p.replace(/(\/index)?\.html$/, '') || '/' });
      return res.end();
    }
    if (cfg.trailingSlash === false && p.length > 1 && p.endsWith('/')) {
      res.writeHead(308, { Location: p.slice(0, -1) });
      return res.end();
    }
    let file = resolveFile(p);
    let status = 200;
    if (!file) { file = path.join(dist, '404.html'); status = 404; }
    const headers = { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' };
    for (const r of rules) if (r.re.test(p)) for (const h of r.headers) headers[h.key] = h.value;
    res.writeHead(status, headers);
    fs.createReadStream(file).pipe(res);
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = Number(process.argv[2]) || 4173;
  createServer().listen(port, '127.0.0.1', () => console.log(`http://127.0.0.1:${port}`));
}
