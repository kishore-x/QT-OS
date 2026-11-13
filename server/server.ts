/* ============================================================
   Qualtech OS — backend
   Serves the app and stores its data in SQLite so every user
   sees the same records. No dependencies: uses Node's built-in
   http server and node:sqlite. Requires Node 22.18+ (runs .ts
   files directly).

   API
     GET  /api/stores         -> { [key]: { version, data, updatedAt } }
     PUT  /api/stores/:key    body { baseVersion, data }
                              -> 200 { version }  saved
                              -> 409 { version, data }  someone saved first

   Env
     PORT         default 3000
     DB_FILE      default ./data/mtts.db
     QT_PASSWORD  if set, every request needs HTTP Basic auth
                  (any username, this password)
   ============================================================ */
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { readFile, stat } from 'node:fs/promises';
import { mkdirSync } from 'node:fs';
import { dirname, extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { timingSafeEqual } from 'node:crypto';
import { gzip } from 'node:zlib';
import { promisify } from 'node:util';

const gzipAsync = promisify(gzip);

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT) || 3000;
const DB_FILE = resolve(ROOT, process.env.DB_FILE || 'data/mtts.db');
const PASSWORD = process.env.QT_PASSWORD || '';
const MAX_BODY = 25 * 1024 * 1024;

/** The data blocks the app saves, and the array fields each must contain.
    A save is rejected unless it is a plain object with these fields as arrays —
    this stops a malformed or malicious payload from corrupting a shared store
    and breaking the app for every user. Must match the *_LS keys in src/. */
const STORE_SHAPES: Record<string, string[]> = {
  'mtts-v1': ['materials', 'locations', 'requests', 'transfers', 'receipts', 'movements'],  // app.ts
};
const STORE_KEYS = new Set(Object.keys(STORE_SHAPES));

/** True only for a plain {…} object carrying every required array field. */
function validStorePayload(key: string, data: unknown): data is Record<string, unknown> {
  if (data === null || typeof data !== 'object' || Array.isArray(data)) return false;
  const req = STORE_SHAPES[key] || [];
  for (const f of req) if (!Array.isArray((data as Record<string, unknown>)[f])) return false;
  return true;
}

/* ---------- database ---------- */
mkdirSync(dirname(DB_FILE), { recursive: true });
const db = new DatabaseSync(DB_FILE);
db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS stores (
    key        TEXT PRIMARY KEY,
    version    INTEGER NOT NULL,
    data       TEXT    NOT NULL,
    updated_at TEXT    NOT NULL
  );
  CREATE TABLE IF NOT EXISTS store_history (
    key        TEXT    NOT NULL,
    version    INTEGER NOT NULL,
    data       TEXT    NOT NULL,
    saved_at   TEXT    NOT NULL,
    PRIMARY KEY (key, version)
  );
`);
const HISTORY_KEEP = 50; // previous versions kept per store, for recovery

const qAll = db.prepare('SELECT key, version, data, updated_at FROM stores');
const qOne = db.prepare('SELECT version, data FROM stores WHERE key = ?');
const qUpsert = db.prepare(`
  INSERT INTO stores (key, version, data, updated_at) VALUES (?, ?, ?, ?)
  ON CONFLICT(key) DO UPDATE SET version = excluded.version, data = excluded.data, updated_at = excluded.updated_at`);
const qHist = db.prepare('INSERT OR REPLACE INTO store_history (key, version, data, saved_at) VALUES (?, ?, ?, ?)');
const qPrune = db.prepare('DELETE FROM store_history WHERE key = ? AND version <= ?');

type Row = { key: string; version: number; data: string; updated_at: string };

/** Save if nobody else saved since `baseVersion`. Runs in one transaction. */
function saveStore(key: string, baseVersion: number, json: string):
  { ok: true; version: number } | { ok: false; version: number; data: string } {
  db.exec('BEGIN IMMEDIATE');
  try {
    const cur = qOne.get(key) as { version: number; data: string } | undefined;
    const curVersion = cur ? cur.version : 0;
    if (curVersion !== baseVersion) {
      db.exec('ROLLBACK');
      return { ok: false, version: curVersion, data: cur ? cur.data : 'null' };
    }
    const now = new Date().toISOString();
    if (cur) qHist.run(key, cur.version, cur.data, now);
    const version = curVersion + 1;
    qUpsert.run(key, version, json, now);
    qPrune.run(key, version - 1 - HISTORY_KEEP);
    db.exec('COMMIT');
    return { ok: true, version };
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
}

/* ---------- http helpers ---------- */
function send(res: ServerResponse, status: number, body: string, type = 'application/json; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(body);
}
const sendJson = (res: ServerResponse, status: number, obj: unknown) => send(res, status, JSON.stringify(obj));

/* Compress larger text responses (JS/CSS/JSON) when the client supports it.
   Cuts the ~480KB of app code to ~130KB over the wire — the main win on a
   remote/cloud connection. Tiny responses are sent as-is (not worth the CPU). */
const COMPRESSIBLE = /^(text\/|application\/(json|javascript|xml)|image\/svg)/;
const acceptsGzip = (req: IncomingMessage) => /\bgzip\b/.test(String(req.headers['accept-encoding'] || ''));
async function sendBody(req: IncomingMessage, res: ServerResponse, status: number, body: Buffer, contentType: string, cacheControl: string) {
  const headers: Record<string, string> = { 'Content-Type': contentType, 'Cache-Control': cacheControl, 'Vary': 'Accept-Encoding' };
  if (body.length > 1024 && acceptsGzip(req) && COMPRESSIBLE.test(contentType)) {
    try {
      const gz = await gzipAsync(body);
      headers['Content-Encoding'] = 'gzip';
      res.writeHead(status, headers);
      return res.end(gz);
    } catch { /* fall through to uncompressed */ }
  }
  res.writeHead(status, headers);
  res.end(body);
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((ok, fail) => {
    const chunks: Buffer[] = []; let size = 0;
    req.on('data', (c: Buffer) => {
      size += c.length;
      if (size > MAX_BODY) { fail(new Error('too large')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => ok(Buffer.concat(chunks).toString('utf8')));
    req.on('error', fail);
  });
}

function authorized(req: IncomingMessage): boolean {
  if (!PASSWORD) return true;
  const h = req.headers.authorization || '';
  if (!h.startsWith('Basic ')) return false;
  const pass = Buffer.from(h.slice(6), 'base64').toString('utf8').split(':').slice(1).join(':');
  const a = Buffer.from(pass), b = Buffer.from(PASSWORD);
  return a.length === b.length && timingSafeEqual(a, b);
}

/* ---------- static files ---------- */
const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon',
};
// only these are public; src/, server/, data/ etc. are never served
const PUBLIC = ['index.html', 'css/', 'js/'];

async function serveStatic(req: IncomingMessage, pathname: string, res: ServerResponse) {
  const rel = normalize(decodeURIComponent(pathname)).replace(/^[/\\]+/, '') || 'index.html';
  if (rel.includes('..') || !PUBLIC.some(p => rel === p || rel.startsWith(p))) return send(res, 404, 'Not found', 'text/plain');
  const file = join(ROOT, rel);
  try {
    const s = await stat(file);
    if (!s.isFile()) return send(res, 404, 'Not found', 'text/plain');
    const type = MIME[extname(file)] || 'application/octet-stream';
    // js/ and css/ are cache-busted with ?b=NN in index.html, so they're safe to
    // cache forever: repeat visits re-fetch nothing until the build number changes.
    // index.html itself must revalidate so a new build is always picked up.
    const versioned = rel.startsWith('js/') || rel.startsWith('css/');
    const cache = versioned ? 'public, max-age=31536000, immutable' : 'no-cache';
    await sendBody(req, res, 200, await readFile(file), type, cache);
  } catch {
    send(res, 404, 'Not found', 'text/plain');
  }
}

/* ---------- routes ---------- */
const server = createServer(async (req, res) => {
  try {
    if (!authorized(req)) {
      res.writeHead(401, { 'WWW-Authenticate': 'Basic realm="Qualtech OS"' });
      return res.end('Login required');
    }
    const url = new URL(req.url || '/', 'http://localhost');
    const path = url.pathname;

    if (path === '/api/stores' && req.method === 'GET') {
      // Build the JSON from the already-serialized rows (data is stored as JSON
      // text), so we skip a parse+re-stringify of the whole dataset on every load.
      const parts = (qAll.all() as Row[]).map(r =>
        `${JSON.stringify(r.key)}:{"version":${r.version},"data":${r.data},"updatedAt":${JSON.stringify(r.updated_at)}}`);
      return sendBody(req, res, 200, Buffer.from('{' + parts.join(',') + '}', 'utf8'), 'application/json; charset=utf-8', 'no-store');
    }

    const m = path.match(/^\/api\/stores\/([\w-]+)$/);
    if (m && req.method === 'PUT') {
      const key = m[1];
      if (!STORE_KEYS.has(key)) return sendJson(res, 404, { error: 'unknown store' });
      let body: { baseVersion?: unknown; data?: unknown } | null;
      try { body = JSON.parse(await readBody(req)); } catch { return sendJson(res, 400, { error: 'invalid JSON or body too large' }); }
      if (body === null || typeof body !== 'object' || Array.isArray(body) || typeof body.baseVersion !== 'number') {
        return sendJson(res, 400, { error: 'expected { baseVersion: number, data: object }' });
      }
      if (!validStorePayload(key, body.data)) {
        return sendJson(res, 422, { error: 'payload does not match the expected shape for ' + key });
      }
      const r = saveStore(key, body.baseVersion, JSON.stringify(body.data));
      return r.ok ? sendJson(res, 200, { version: r.version })
                  : sendJson(res, 409, { version: r.version, data: JSON.parse(r.data) });
    }

    if (path === '/api/health') return sendJson(res, 200, { ok: true });
    if (path === '/favicon.ico') { res.writeHead(204); return res.end(); }
    if (path.startsWith('/api/')) return sendJson(res, 404, { error: 'not found' });
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method not allowed', 'text/plain');
    return serveStatic(req, path, res);
  } catch (e) {
    console.error(e);
    if (!res.headersSent) sendJson(res, 500, { error: 'server error' });
  }
});

server.listen(PORT, () => {
  console.log(`Qualtech OS running at http://localhost:${PORT}`);
  console.log(`Database: ${DB_FILE}${PASSWORD ? '  (password protected)' : ''}`);
});
