/* PUT /api/stores/:key   body { baseVersion, data }
     -> 200 { version }        saved
     -> 409 { version, data }  someone else saved first (take their copy)
   Called by src/sync.ts on every save.

   Self-contained (no cross-file imports) and loads @libsql/client lazily
   inside the try/catch, so any config/load problem returns a readable
   JSON error instead of a raw Vercel FUNCTION_INVOCATION_FAILED. */

/** The data blocks the app saves, and the array fields each must contain.
    Mirrors STORE_SHAPES in server/server.ts. */
const STORE_SHAPES: Record<string, string[]> = { 'mtts-v1': ['workspaces'] };
const STORE_KEYS = new Set(Object.keys(STORE_SHAPES));

let _client: any = null;
let _ready: Promise<void> | null = null;

async function getClient() {
  if (_client) return _client;
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url) throw new Error('TURSO_DATABASE_URL env var is not set on this Vercel project');
  const { createClient } = await import('@libsql/client/web');
  _client = createClient({ url, authToken });
  return _client;
}

function ensureTable(client: any): Promise<void> {
  if (!_ready) {
    _ready = client
      .execute(
        `CREATE TABLE IF NOT EXISTS stores (
           key TEXT PRIMARY KEY, version INTEGER NOT NULL,
           data TEXT NOT NULL, updated_at TEXT NOT NULL)`
      )
      .then(() => {});
  }
  return _ready;
}

function validStorePayload(key: string, data: unknown): data is Record<string, unknown> {
  if (data === null || typeof data !== 'object' || Array.isArray(data)) return false;
  const req = STORE_SHAPES[key] || [];
  for (const f of req) if (!Array.isArray((data as Record<string, unknown>)[f])) return false;
  return true;
}

async function current(client: any, key: string): Promise<{ version: number; data: unknown } | null> {
  const rs = await client.execute({ sql: 'SELECT version, data FROM stores WHERE key = ?', args: [key] });
  const row = rs.rows[0];
  return row ? { version: Number(row.version), data: JSON.parse(row.data as string) } : null;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'PUT') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }
  const key = req.query?.key;
  if (typeof key !== 'string' || !STORE_KEYS.has(key)) {
    res.status(404).json({ error: 'unknown store' });
    return;
  }

  let body: any = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { res.status(400).json({ error: 'invalid JSON' }); return; }
  }
  if (body === null || typeof body !== 'object' || Array.isArray(body) || typeof body.baseVersion !== 'number') {
    res.status(400).json({ error: 'expected { baseVersion: number, data: object }' });
    return;
  }
  if (!validStorePayload(key, body.data)) {
    res.status(422).json({ error: 'payload does not match the expected shape for ' + key });
    return;
  }

  try {
    const client = await getClient();
    await ensureTable(client);
    const json = JSON.stringify(body.data);
    const now = new Date().toISOString();
    const cur = await current(client, key);
    const curVersion = cur ? cur.version : 0;

    if (curVersion !== body.baseVersion) {
      res.setHeader('Cache-Control', 'no-store');
      res.status(409).json({ version: curVersion, data: cur ? cur.data : null });
      return;
    }

    const newVersion = curVersion + 1;
    if (cur) {
      const u = await client.execute({
        sql: 'UPDATE stores SET version = ?, data = ?, updated_at = ? WHERE key = ? AND version = ?',
        args: [newVersion, json, now, key, curVersion],
      });
      if (!u.rowsAffected) {
        const latest = await current(client, key);
        res.status(409).json({ version: latest ? latest.version : 0, data: latest ? latest.data : null });
        return;
      }
    } else {
      try {
        await client.execute({
          sql: 'INSERT INTO stores (key, version, data, updated_at) VALUES (?, ?, ?, ?)',
          args: [key, newVersion, json, now],
        });
      } catch {
        const latest = await current(client, key);
        res.status(409).json({ version: latest ? latest.version : 0, data: latest ? latest.data : null });
        return;
      }
    }
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({ version: newVersion });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: 'server error', detail: String((e && e.message) || e) });
  }
}
