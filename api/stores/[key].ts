/* PUT /api/stores/:key   body { baseVersion, data }
     -> 200 { version }        saved
     -> 409 { version, data }  someone else saved first (take their copy)
   Called by src/sync.ts on every save. */
import { STORE_KEYS, validStorePayload, saveStore } from '../_lib';

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
    const r = await saveStore(key, body.baseVersion, JSON.stringify(body.data));
    res.setHeader('Cache-Control', 'no-store');
    if (r.ok) res.status(200).json({ version: r.version });
    else res.status(409).json({ version: r.version, data: r.data });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'server error' });
  }
}
