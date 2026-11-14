/* GET /api/stores -> { [key]: { version, data, updatedAt } }
   Returns every shared store. Called once on page load by src/sync.ts. */
import { getAllStores } from './_lib';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }
  try {
    const stores = await getAllStores();
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json(stores);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'server error' });
  }
}
