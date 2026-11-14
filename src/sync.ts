/* ============================================================
   Qualtech OS — server sync (loaded first, before the app)

   1. Asks the backend for the latest data and copies it into
      localStorage, so the app's existing load() functions read
      the shared server copy.
   2. Loads the app scripts in order, then starts the app.
   3. Every save() also calls syncPush(), which sends that data
      block to the server.

   If there is no backend (index.html opened directly, or a
   static host), the app runs exactly as before: data stays in
   this browser only.

   Two people editing at once: each save carries the version it
   was based on. If someone else saved first, the server refuses
   and this page reloads with their latest data instead of
   silently overwriting it.
   ============================================================ */
'use strict';

const SYNC_BUILD = '92';
const SYNC_SCRIPTS = ['data', 'app'];
/** must match the *_LS keys in the app and STORE_KEYS on the server */
const SYNC_KEYS = ['mtts-v1'];

type SyncMode = 'server' | 'local';
type SyncStatus = 'saved' | 'saving' | 'offline' | 'error';

let syncMode: SyncMode = 'local';
const syncVersions: Record<string, number> = {};
const syncInFlight: Record<string, boolean> = {};
/** latest unsent data per key (only the newest copy matters) */
const syncPending: Record<string, unknown> = {};
let syncRetryTimer: ReturnType<typeof setTimeout> | null = null;

window.qtDeferBoot = true;

/* ---------- status pill ---------- */
function syncSetStatus(s: SyncStatus) {
  if (syncMode !== 'server') return;
  let el = document.getElementById('sync-status');
  if (!el) { el = document.createElement('div'); el.id = 'sync-status'; document.body.appendChild(el); }
  const label = { saved: 'All changes saved', saving: 'Saving…', offline: 'Offline — retrying', error: 'Not saved — check connection' }[s];
  el.className = 'sync-' + s;
  el.textContent = label;
  el.title = s === 'saved' ? 'Data is stored on the Qualtech server' : label;
}

/* ---------- push ---------- */
/** Called by every save function in the app. */
function syncPush(key: string, data: unknown) {
  if (syncMode !== 'server') return;
  syncPending[key] = data;
  syncFlush(key);
}

async function syncFlush(key: string) {
  if (syncInFlight[key] || !(key in syncPending)) return;
  const data = syncPending[key];
  delete syncPending[key];
  syncInFlight[key] = true;
  syncSetStatus('saving');
  try {
    const res = await fetch('api/stores/' + encodeURIComponent(key), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ baseVersion: syncVersions[key] || 0, data }),
    });
    if (res.status === 409) {
      // someone else saved first: take their copy and reload
      const latest = await res.json();
      syncVersions[key] = latest.version;
      try { localStorage.setItem(key, JSON.stringify(latest.data)); } catch {}
      for (const k in syncPending) delete syncPending[k];
      if (typeof toast === 'function') toast('Someone else just updated this data — loading the latest copy');
      setTimeout(() => location.reload(), 1800);
      return;
    }
    if (!res.ok) throw new Error('HTTP ' + res.status);
    syncVersions[key] = (await res.json()).version;
  } catch {
    // network or server problem: keep the newest copy and retry
    if (!(key in syncPending)) syncPending[key] = data;
    syncSetStatus('offline');
    if (!syncRetryTimer) syncRetryTimer = setTimeout(() => { syncRetryTimer = null; Object.keys(syncPending).forEach(syncFlush); }, 5000);
    return;
  } finally {
    syncInFlight[key] = false;
  }
  if (key in syncPending) return syncFlush(key);
  if (!Object.keys(syncPending).length && !Object.values(syncInFlight).some(Boolean)) syncSetStatus('saved');
}

window.addEventListener('beforeunload', e => {
  if (syncMode === 'server' && (Object.keys(syncPending).length || Object.values(syncInFlight).some(Boolean))) {
    e.preventDefault();
    e.returnValue = '';
  }
});

/* ---------- start-up ---------- */
async function syncPull(): Promise<boolean> {
  if (location.protocol === 'file:') return false;
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 4000);
  try {
    const res = await fetch('api/stores', { signal: ctl.signal, cache: 'no-store' });
    if (!res.ok || !(res.headers.get('content-type') || '').includes('json')) return false;
    const stores: Record<string, { version: number; data: unknown }> = await res.json();
    for (const key of SYNC_KEYS) {
      const s = stores[key];
      if (s) {
        // server copy wins
        syncVersions[key] = s.version;
        try { localStorage.setItem(key, JSON.stringify(s.data)); } catch {}
      } else {
        // first run: upload whatever this browser already has
        syncVersions[key] = 0;
        let local: string | null = null;
        try { local = localStorage.getItem(key); } catch {}
        if (local) { try { syncPending[key] = JSON.parse(local); } catch {} }
      }
    }
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(t);
  }
}

function syncLoadScripts(done: () => void) {
  SYNC_SCRIPTS.forEach((name, i) => {
    const s = document.createElement('script');
    s.src = 'js/' + name + '.js?b=' + SYNC_BUILD;
    s.async = false; // keep execution order
    if (i === SYNC_SCRIPTS.length - 1) s.onload = done;
    document.body.appendChild(s);
  });
}

/** First run on a new server: upload the data the app just loaded, so everyone starts from the same copy. */
function syncUploadMissing() {
  const live: Record<string, unknown> = { 'mtts-v1': store };
  for (const key of SYNC_KEYS) if (!syncVersions[key] && live[key]) syncPending[key] = live[key];
  Object.keys(syncPending).forEach(syncFlush);
}

syncPull().then(ok => {
  syncMode = ok ? 'server' : 'local';
  syncLoadScripts(() => {
    const start = () => { boot(); syncSetStatus('saved'); if (syncMode === 'server') syncUploadMissing(); };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
  });
});
