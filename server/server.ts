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
     DB_FILE      default ./data/qualtech.db
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

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT) || 3000;
const DB_FILE = resolve(ROOT, process.env.DB_FILE || 'data/qualtech.db');
const PASSWORD = process.env.QT_PASSWORD || '';
const MAX_BODY = 25 * 1024 * 1024;

/** The data blocks the app saves. Must match the *_LS keys in src/. */
const STORE_KEYS = new Set([
  'qualtech-inv-v3',      // inventory  (app.ts)
  'qualtech-jcr-v3',      // job cost   (app.ts)
  'qualtech-tender-v2',   // tenders    (tender.ts)
  'qualtech-mr-v1',       // procurement(procure.ts)
  'qualtech-billing-v2',  // billing    (billing.ts)
]);

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

async function serveStatic(pathname: string, res: ServerResponse) {
  const rel = normalize(decodeURIComponent(pathname)).replace(/^[/\\]+/, '') || 'index.html';
  if (rel.includes('..') || !PUBLIC.some(p => rel === p || rel.startsWith(p))) return send(res, 404, 'Not found', 'text/plain');
  const file = join(ROOT, rel);
  try {
    const s = await stat(file);
    if (!s.isFile()) return send(res, 404, 'Not found', 'text/plain');
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(await readFile(file));
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
      const out: Record<string, { version: number; data: unknown; updatedAt: string }> = {};
      for (const r of qAll.all() as Row[]) out[r.key] = { version: r.version, data: JSON.parse(r.data), updatedAt: r.updated_at };
      return sendJson(res, 200, out);
    }

    const m = path.match(/^\/api\/stores\/([\w-]+)$/);
    if (m && req.method === 'PUT') {
      const key = m[1];
      if (!STORE_KEYS.has(key)) return sendJson(res, 404, { error: 'unknown store' });
      let body: { baseVersion?: unknown; data?: unknown };
      try { body = JSON.parse(await readBody(req)); } catch { return sendJson(res, 400, { error: 'invalid JSON or body too large' }); }
      if (typeof body.baseVersion !== 'number' || body.data == null || typeof body.data !== 'object') {
        return sendJson(res, 400, { error: 'expected { baseVersion: number, data: object }' });
      }
      const r = saveStore(key, body.baseVersion, JSON.stringify(body.data));
      return r.ok ? sendJson(res, 200, { version: r.version })
                  : sendJson(res, 409, { version: r.version, data: JSON.parse(r.data) });
    }

    if (path === '/api/health') return sendJson(res, 200, { ok: true });
    if (path === '/favicon.ico') { res.writeHead(204); return res.end(); }
    if (path.startsWith('/api/')) return sendJson(res, 404, { error: 'not found' });
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method not allowed', 'text/plain');
    return serveStatic(path, res);
  } catch (e) {
    console.error(e);
    if (!res.headersSent) sendJson(res, 500, { error: 'server error' });
  }
});

server.listen(PORT, () => {
  console.log(`Qualtech OS running at http://localhost:${PORT}`);
  console.log(`Database: ${DB_FILE}${PASSWORD ? '  (password protected)' : ''}`);
});
