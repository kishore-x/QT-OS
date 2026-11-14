/* ============================================================
   Qualtech OS — shared helpers for the Vercel serverless API.

   This replaces the local Node + SQLite server (server/server.ts)
   when the app is hosted on Vercel. The data lives in a Turso
   (libSQL) database in the cloud, so every user — storekeeper,
   purchase manager, site manager — reads and writes the SAME
   records from one shared copy.

   Local development is unchanged: `npm start` still runs the
   Node server against data/mtts.db. These files are only used by
   Vercel.

   Env (set in the Vercel project settings):
     TURSO_DATABASE_URL   libsql://<your-db>.turso.io
     TURSO_AUTH_TOKEN     database auth token
     QT_PASSWORD          (optional) gate the whole site — see middleware.ts
   ============================================================ */
import { createClient, type Client } from '@libsql/client/web';

/** The data blocks the app saves, and the array fields each must contain.
    Mirrors STORE_SHAPES in server/server.ts — a save is rejected unless it
    is a plain object with these fields as arrays, so a malformed payload
    cannot corrupt the shared store for every user. */
export const STORE_SHAPES: Record<string, string[]> = {
  'mtts-v1': ['workspaces'],
};
export const STORE_KEYS = new Set(Object.keys(STORE_SHAPES));

let _client: Client | null = null;
let _ready: Promise<void> | null = null;

function db(): Client {
  if (_client) return _client;
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url) throw new Error('TURSO_DATABASE_URL is not set');
  _client = createClient({ url, authToken });
  return _client;
}

/** Create the table on first use (idempotent). */
function ready(): Promise<void> {
  if (!_ready) {
    _ready = db()
      .execute(
        `CREATE TABLE IF NOT EXISTS stores (
           key        TEXT PRIMARY KEY,
           version    INTEGER NOT NULL,
           data       TEXT    NOT NULL,
           updated_at TEXT    NOT NULL
         )`
      )
      .then(() => {});
  }
  return _ready;
}

/** True only for a plain {…} object carrying every required array field. */
export function validStorePayload(key: string, data: unknown): data is Record<string, unknown> {
  if (data === null || typeof data !== 'object' || Array.isArray(data)) return false;
  const req = STORE_SHAPES[key] || [];
  for (const f of req) if (!Array.isArray((data as Record<string, unknown>)[f])) return false;
  return true;
}

export async function getAllStores(): Promise<Record<string, { version: number; data: unknown; updatedAt: string }>> {
  await ready();
  const rs = await db().execute('SELECT key, version, data, updated_at FROM stores');
  const out: Record<string, { version: number; data: unknown; updatedAt: string }> = {};
  for (const row of rs.rows) {
    out[row.key as string] = {
      version: Number(row.version),
      data: JSON.parse(row.data as string),
      updatedAt: row.updated_at as string,
    };
  }
  return out;
}

async function current(key: string): Promise<{ version: number; data: unknown } | null> {
  const rs = await db().execute({ sql: 'SELECT version, data FROM stores WHERE key = ?', args: [key] });
  const row = rs.rows[0];
  if (!row) return null;
  return { version: Number(row.version), data: JSON.parse(row.data as string) };
}

export type SaveResult =
  | { ok: true; version: number }
  | { ok: false; version: number; data: unknown };

/** Save only if nobody else has saved since `baseVersion` (optimistic
    concurrency). The conditional UPDATE / unique INSERT make the write
    race-safe: a second writer who read the same baseVersion changes 0
    rows (or hits the primary-key), and gets the latest copy back. */
export async function saveStore(key: string, baseVersion: number, json: string): Promise<SaveResult> {
  await ready();
  const now = new Date().toISOString();
  const cur = await current(key);
  const curVersion = cur ? cur.version : 0;

  if (curVersion !== baseVersion) {
    return { ok: false, version: curVersion, data: cur ? cur.data : null };
  }

  const newVersion = curVersion + 1;
  if (cur) {
    // guard against a race between the read above and this write
    const u = await db().execute({
      sql: 'UPDATE stores SET version = ?, data = ?, updated_at = ? WHERE key = ? AND version = ?',
      args: [newVersion, json, now, key, curVersion],
    });
    if (!u.rowsAffected) {
      const latest = await current(key);
      return { ok: false, version: latest ? latest.version : 0, data: latest ? latest.data : null };
    }
  } else {
    try {
      await db().execute({
        sql: 'INSERT INTO stores (key, version, data, updated_at) VALUES (?, ?, ?, ?)',
        args: [key, newVersion, json, now],
      });
    } catch {
      // someone else inserted first (primary-key clash) -> return their copy
      const latest = await current(key);
      return { ok: false, version: latest ? latest.version : 0, data: latest ? latest.data : null };
    }
  }
  return { ok: true, version: newVersion };
}
