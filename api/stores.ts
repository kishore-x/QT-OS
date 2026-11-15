/* GET /api/stores -> { [key]: { version, data, updatedAt } }
   Returns every shared store. Called once on page load by src/sync.ts.

   Self-contained (no cross-file imports) and loads @libsql/client lazily
   inside the try/catch, so any config/load problem returns a readable
   JSON error instead of a raw Vercel FUNCTION_INVOCATION_FAILED. */

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

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }
  try {
    const client = await getClient();
    await ensureTable(client);
    const rs = await client.execute('SELECT key, version, data, updated_at FROM stores');
    const out: Record<string, unknown> = {};
    for (const row of rs.rows) {
      out[row.key as string] = {
        version: Number(row.version),
        data: JSON.parse(row.data as string),
        updatedAt: row.updated_at,
      };
    }
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json(out);
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: 'server error', detail: String((e && e.message) || e) });
  }
}
