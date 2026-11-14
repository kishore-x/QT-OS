/* ============================================================
   Material Transfer & Inventory Tracking System
   Phase 1 pilot — Central Store -> Pilot Site

   Core rule: destination stock increases ONLY after the
   receiving site confirms receipt. Dispatch moves stock from
   the store into a virtual TRANSIT account; receipt moves the
   accepted quantity from TRANSIT into the site.

   Everything is ledger-driven: location balances are computed
   from MOVEMENTS, never stored directly.
   ============================================================ */
'use strict';

/* ---------- icons ---------- */
function svg(p: string, w?: number){ return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"${w?` style="width:${w}px;height:${w}px"`:''}>${p}</svg>`; }
const IC: Record<string,string> = {
  dashboard:'<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
  materials:'<path d="M3 7l9-4 9 4-9 4-9-4z"/><path d="M3 7v10l9 4 9-4V7"/><path d="M12 11v10"/>',
  locations:'<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
  opening:'<path d="M12 3v12M7 10l5 5 5-5"/><path d="M4 21h16"/>',
  transfers:'<path d="M7 7h11l-3-3M17 17H6l3 3"/>',
  requests:'<path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/>',
  receipts:'<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
  stock:'<path d="M3 7l9-4 9 4-9 4-9-4z"/><path d="M3 7v10l9 4 9-4V7"/><path d="M12 11v10"/>',
  history:'<path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/><path d="M12 7v5l3 3"/>',
  losses:'<path d="M23 18l-9.5-9.5-5 5L1 6"/><path d="M17 18h6v-6"/>',
  reports:'<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>',
  dots:'<circle cx="12" cy="5" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="12" cy="19" r="1.4"/>',
  user:'<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  users:'<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  office:'<path d="M3 21V7l9-4 9 4v14"/><path d="M3 21h18"/><path d="M9 21v-5h6v5"/><path d="M8 10h.01M12 10h.01M16 10h.01"/>',
  lock:'<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  eye:'<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/>',
  eyeoff:'<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><path d="M1 1l22 22"/>',
  cright:'<path d="m9 18 6-6-6-6"/>',
  logout:'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/>',
  notes:'<path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
  settings:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 6.8 19l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.2 6.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  bell:'<path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
  chev:'<path d="m6 9 6 6 6-6"/>', plus:'<path d="M12 5v14M5 12h14"/>', arrow:'<path d="M5 12h14M12 5l7 7-7 7"/>',
  warehouse:'<path d="M3 21V8l9-4 9 4v13"/><path d="M3 21h18"/><path d="M8 21v-6h8v6"/><path d="M8 12h8"/>',
  building:'<rect x="4" y="2" width="16" height="20" rx="1"/><path d="M9 22v-4h6v4"/>',
  truck:'<path d="M1 3h15v13H1z"/><path d="M16 8h4l3 3v5h-7"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>',
  check:'<path d="M20 6 9 17l-5-5"/>', x:'<path d="M18 6 6 18M6 6l12 12"/>', edit:'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  trash:'<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>',
  upload:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v12"/>',
  alert:'<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>',
  logo:'<path d="M12 2 2 8l10 6 10-6-10-6z" fill="#2563eb" stroke="none"/><path d="M2 8l10 6 10-6" stroke="#93b4fb"/><path d="M12 2v12" stroke="#1e3a8a"/><path d="m7 5 10 6" stroke="#dbe6ff"/>',
};
const ICsun='<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>';
const ICmoon='<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>';

/* ---------- state (multi-site workspaces) ---------- */
const LS='mtts-v1';
const clone=<T,>(o:T):T=>JSON.parse(JSON.stringify(o));
interface Workspace { id:string; name:string; data:MTState }
interface AppUser { id:string; username:string; password:string; name:string; role:Role; allowedSites:string[]|'all' }
interface Store { workspaces:Workspace[]; currentWs:string; users?:AppUser[] }
const ROLE_TITLE:Record<Role,string>={ purchase:'Purchase Manager', store:'Storekeeper', site:'Site Manager' };
function seedUsers(firstWsId:string):AppUser[]{ return [
  { id:'U-PUR', username:'purchase', password:'purchase123', name:'Head Office',  role:'purchase', allowedSites:'all' },
  { id:'U-STO', username:'store',    password:'store123',    name:'R. Suresh',    role:'store',    allowedSites:[firstWsId] },
  { id:'U-SIT', username:'site',     password:'site123',     name:'M. Mariappan', role:'site',     allowedSites:[firstWsId] },
]; }
function migrate(s: any): MTState {
  s.materials=s.materials||[]; s.locations=s.locations||[]; s.requests=s.requests||[]; s.transfers=s.transfers||[];
  s.receipts=s.receipts||[]; s.movements=s.movements||[];
  s.settings=s.settings||clone(SEED.settings);
  if(!Array.isArray(s.settings.readNotes)) s.settings.readNotes=[];
  return s as MTState;
}
function migrateStore(o:any): Store {
  let st:Store;
  if(o && Array.isArray(o.workspaces)){
    o.workspaces.forEach((w:any)=>{ w.data=migrate(w.data||{}); });
    if(!o.currentWs || !o.workspaces.find((w:Workspace)=>w.id===o.currentWs)) o.currentWs=o.workspaces[0]?.id;
    st=o as Store;
  } else {
    // old single-dataset shape → wrap as the first workspace
    st={ workspaces:[{id:'ws-1', name:'Qualtech Pilot', data:migrate(o||{})}], currentWs:'ws-1' };
  }
  if(!Array.isArray(st.users) || !st.users.length) st.users=seedUsers(st.workspaces[0]?.id||'ws-1');
  return st;
}
function loadStore(): Store {
  try{ const r=localStorage.getItem(LS); if(r) return migrateStore(JSON.parse(r)); }catch{}
  return { workspaces:[{id:'ws-1', name:'Qualtech Pilot', data:clone(SEED)}], currentWs:'ws-1', users:seedUsers('ws-1') };
}
let store: Store = loadStore();
const curWs=()=>store.workspaces.find(w=>w.id===store.currentWs)||store.workspaces[0];
const wsName=()=>curWs()?curWs().name:'Site';
let state: MTState = curWs().data;
function save(){ try{ localStorage.setItem(LS, JSON.stringify(store)); }catch{} if(typeof syncPush==='function') syncPush(LS, store); }
function resetData(){ const w=curWs(); w.data=clone(SEED); state=w.data; save(); go('dashboard'); toast('Demo data reset'); }
function switchWs(id:string){ const w=store.workspaces.find(x=>x.id===id); if(!w) return; if(!allowedWsIds().includes(id)) return toast('You do not have access to that site'); store.currentWs=id; state=w.data; save(); view='dashboard'; curTransfer=''; closeModal(); renderSidebar(); renderTopbar(); renderView(); toast('Switched to '+w.name); }
function addSite(siteName:string, centralName:string){
  const id='ws-'+Date.now().toString(36);
  const data:MTState={ materials:[], locations:[
      { id:'CST-01', code:'LOC-001', name:centralName||'Central Store', type:'store', person:'', contact:'', address:'', active:true },
      { id:'SITE-01', code:'LOC-002', name:siteName, type:'site', person:'', contact:'', address:'', active:true },
    ], requests:[], transfers:[], receipts:[], movements:[], settings:clone(SEED.settings) };
  store.workspaces.push({id, name:siteName, data}); store.currentWs=id; state=data;
  // grant the creator access to the new site (purchase already sees all)
  const u=(store.users||[]).find(x=>x.id===session?.userId);
  if(u && u.allowedSites!=='all') u.allowedSites=[...u.allowedSites, id];
  save(); view='master'; curTransfer=''; closeModal(); renderSidebar(); renderTopbar(); renderView();
  toast('New site "'+siteName+'" created — add materials to begin');
}
function openSiteSwitcher(){
  const list=allowedWorkspaces();
  const canDel=(isPurchase()||isStore()) && store.workspaces.length>1;
  const rows=list.map(w=>`<div class="ws-row ${w.id===store.currentWs?'on':''}">
    <button class="ws-pick" onclick="switchWs('${jsid(w.id)}')">${svg(IC.locations,16)} <span class="ws-nm">${esc(w.name)}</span>${w.id===store.currentWs?'<span class="ws-cur">Current</span>':''}</button>
    ${canDel?`<button class="ws-del" title="Delete site" onclick="deleteSiteConfirm('${jsid(w.id)}')">${svg(IC.trash,15)}</button>`:''}
  </div>`).join('');
  const sub=isPurchase()?'All sites — Head Office view':(list.length>1?'You can access '+list.length+' sites':'Switch or add a site');
  openModal(`<div class="modal" style="width:min(400px,92vw)">${mh(IC.locations,'Sites / Projects',sub)}
    <div class="m-body" style="padding:10px">${rows}
      ${(isPurchase()||isStore())?`<button class="menu-row add" onclick="closeModal();openAddSite()">${svg(IC.plus,16)} Add New Site</button>`:''}
    </div></div>`);
}
function deleteSiteConfirm(id:string){ const w=store.workspaces.find(x=>x.id===id); if(!w) return; if(confirm('Delete site "'+w.name+'" and all its data? This cannot be undone.')) deleteSite(id); }
function deleteSite(id:string){
  if(store.workspaces.length<=1) return toast('At least one site is required');
  const w=store.workspaces.find(x=>x.id===id); if(!w) return;
  if(id===store.currentWs){ const other=store.workspaces.find(x=>x.id!==id)!; store.currentWs=other.id; state=other.data; view='dashboard'; curTransfer=''; }
  store.workspaces=store.workspaces.filter(x=>x.id!==id);
  save(); renderSidebar(); renderTopbar(); renderView(); openSiteSwitcher(); toast('Site "'+w.name+'" removed');
}
function openAddSite(){
  openModal(`<div class="modal">${mh(IC.plus,'Add New Site','A fresh, empty site with all the same modules')}
    <div class="m-body"><div class="grid2">
      <div class="fld col2"><label>Site name <span class="req">*</span></label><input class="f" id="ns-site" placeholder="e.g. Site 2 · Chennai Project"></div>
      <div class="fld col2"><label>Central store name</label><input class="f" id="ns-central" value="Central Store"></div>
    </div><div class="hint">${svg(IC.alert,14)} The new site starts empty. Go to <b>Master Items</b> to add materials & opening stock, then begin transfers.</div></div>
    <div class="m-foot"><button class="btn ghost" onclick="closeModal()">Cancel</button><button class="btn" onclick="submitAddSite()">Create Site</button></div></div>`);
}
function submitAddSite(){ const n=val('ns-site'); if(!n) return toast('Enter a site name'); addSite(n, val('ns-central')); }

/* ---------- lookups ---------- */
const material=(c:string)=>state.materials.find(m=>m.code===c);
const matName=(c:string)=>{ const m=material(c); return m?m.name:c; };
const matUnit=(c:string)=>{ const m=material(c); return m?m.unit:''; };
const loc=(id:string)=>state.locations.find(l=>l.id===id);
const VIRTUAL:Record<string,string>={OPENING:'Opening',TRANSIT:'In Transit',DAMAGED:'Damaged',LOSS:'Loss / Short',PURCHASE:'Head Office'};
const locName=(id:string)=>VIRTUAL[id] || (loc(id)?loc(id)!.name:id);
const central=()=>state.locations.find(l=>l.type==='store');
const sites=()=>state.locations.filter(l=>l.type==='site');
const CENTRAL_ID=()=>{ const c=central(); return c?c.id:'CST-01'; };
const SITE_ID=()=>{ const s=sites()[0]; return s?s.id:'SITE-01'; };

/* ---------- ledger math ---------- */
function onHand(code:string, locId:string){ let q=0; for(const m of state.movements){ if(m.code!==code) continue; if(m.to===locId) q+=m.qty; if(m.from===locId) q-=m.qty; } return q; }
function transitQty(code:string){ return onHand(code,'TRANSIT'); }
function locationTotal(locId:string){ return state.materials.reduce((s,m)=>s+Math.max(0,onHand(m.code,locId)),0); }
function totalTransit(){ return state.materials.reduce((s,m)=>s+Math.max(0,transitQty(m.code)),0); }

/* per-transfer reconciliation */
const trReceipts=(id:string)=>state.receipts.filter(r=>r.transferId===id);
function itemAccepted(id:string,code:string){ let q=0; for(const r of trReceipts(id)) for(const it of r.items) if(it.code===code) q+=it.accepted; return q; }
function itemDamaged(id:string,code:string){ let q=0; for(const r of trReceipts(id)) for(const it of r.items) if(it.code===code) q+=it.damaged; return q; }
function itemResolvedShort(id:string,code:string){ let q=0; for(const m of state.movements){ if(m.type==='SHORT'&&m.ref===id&&m.code===code) q+=m.qty; } return q; }
function itemReceived(id:string,code:string){ return itemAccepted(id,code)+itemDamaged(id,code); }
/** still physically in transit for this transfer item (unconfirmed) */
function itemOutstanding(t:Transfer,code:string){
  const disp=t.items.filter(i=>i.code===code).reduce((s,i)=>s+i.qty,0);
  return disp - itemAccepted(t.id,code) - itemDamaged(t.id,code) - itemResolvedShort(t.id,code);
}
function transferOutstanding(t:Transfer){ return t.items.reduce((s,i)=>s+Math.max(0,itemOutstanding(t,i.code)),0); }
function transferDispatched(t:Transfer){ return t.items.reduce((s,i)=>s+i.qty,0); }

function transferStatus(t:Transfer): TransferStatus {
  if(t.status==='DRAFT'||t.status==='CANCELLED') return t.status;
  const out=transferOutstanding(t);
  const received=t.items.some(i=>itemReceived(t.id,i.code)>0);
  if(out<=1e-9) return 'CLOSED';
  return received ? 'PARTIAL' : 'PENDING';
}
const STATUS_META:Record<TransferStatus,{t:string;c:string}>={
  DRAFT:{t:'Draft',c:'c-normal'}, PENDING:{t:'Pending Receipt',c:'c-low'},
  PARTIAL:{t:'Partially Received',c:'c-use'}, RECEIVED:{t:'Received',c:'c-ok'},
  CLOSED:{t:'Completed',c:'c-ok'}, CANCELLED:{t:'Cancelled',c:'c-out'},
};
function statusChip(s:TransferStatus){ const m=STATUS_META[s]; return `<span class="chip ${m.c}"><i></i>${m.t}</span>`; }

/* ---------- helpers ---------- */
const num=(n:number)=>Number(n||0).toLocaleString('en-IN');
function nowDate(){ return new Date().toISOString().slice(0,10); }
function nowTime(){ const d=new Date(); return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0'); }
function nowStamp(){ return nowDate()+' '+nowTime(); }
function nextId(prefix:string, arrKey:'transfers'|'receipts'|'materials'|'locations'|'requests', field='id'){
  let max=0; (state[arrKey] as any[]).forEach(x=>{ const m=String(x[field]||'').match(/(\d+)\s*$/); if(m){ const n=+m[1]; if(n>max)max=n; } });
  return prefix+String(max+1).padStart(4,'0');
}
function addMovement(mv:Partial<Movement>){
  const m:Movement={ id:'MV-'+(1000+state.movements.length+1), code:mv.code!, qty:mv.qty!, from:mv.from!, to:mv.to!,
    type:mv.type||'ADJUST', ref:mv.ref||'', person:mv.person||me(),
    txnDate:mv.txnDate||nowDate(), date:nowDate(), time:nowTime() };
  state.movements.push(m);
}
function toast(msg:string){ const t=document.getElementById('toast'); if(!t) return; t.innerHTML=svg(IC.check)+'<span>'+msg+'</span>'; t.classList.add('on'); clearTimeout(window._tt); window._tt=setTimeout(()=>t.classList.remove('on'),2600); }
function esc(s:any){ return String(s==null?'':s).replace(/[&<>"'`]/g,c=>(({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','`':'&#96;'} as any)[c])); }
function jsid(s:any){ return String(s==null?'':s).replace(/[^A-Za-z0-9 _.\/:-]/g,''); }

/* ---------- auth / sessions / roles (per browser, local) ---------- */
interface Session { userId:string; name:string; role:Role; title:string; allowedSites:string[]|'all'; }
const SESS_LS='mtts-session';
let session: Session|null = (()=>{ try{ const r=localStorage.getItem(SESS_LS); if(r) return JSON.parse(r); }catch{} return null; })();
function saveSession(){ try{ session?localStorage.setItem(SESS_LS,JSON.stringify(session)):localStorage.removeItem(SESS_LS); }catch{} }
function me(){ return session?session.name:(state?state.settings.user:'User'); }
const role=()=>session?session.role:'store';
const isStore=()=>role()==='store';
const isSite=()=>role()==='site';
const isPurchase=()=>role()==='purchase';
const canApprove=()=>isPurchase();                 // Purchase Manager (office) approves & sends
const canRequest=()=>isStore()||isSite();          // Storekeeper raises; Site Manager may also raise
const canSend=()=>isPurchase();                    // Purchase Manager dispatches materials to the storekeeper
const isReceiver=()=>isStore();                    // Storekeeper confirms receipt & records damage
const canManageUsers=()=>isPurchase();
const canManageStock=()=>isStore()||isPurchase();  // add/edit materials, adjust
/** workspace ids this session may access */
function allowedWsIds(){ if(!session) return store.workspaces.map(w=>w.id); return session.allowedSites==='all'?store.workspaces.map(w=>w.id):session.allowedSites; }
function allowedWorkspaces(){ const ids=new Set(allowedWsIds()); return store.workspaces.filter(w=>ids.has(w.id)); }

function doLogin(){
  const u=val('lg-user').toLowerCase(), pw=val('lg-pass');
  const acc=(store.users||[]).find(x=>x.username.toLowerCase()===u && x.password===pw);
  if(!acc) return toast('Invalid username or password');
  loginUser(acc);
}
function loginUser(acc:AppUser){
  session={ userId:acc.id, name:acc.name, role:acc.role, title:ROLE_TITLE[acc.role], allowedSites:acc.allowedSites };
  saveSession();
  // make sure the active site is one this user may access
  const ids=allowedWsIds(); if(!ids.includes(store.currentWs) && ids.length){ store.currentWs=ids[0]; state=curWs().data; }
  view='dashboard'; curTransfer=''; document.body.classList.remove('logged-out'); boot();
  toast('Signed in as '+session.title);
}
function loginAs(r:Role){ const acc=(store.users||[]).find(x=>x.role===r); if(acc) loginUser(acc); }
function logout(){ session=null; saveSession(); view='dashboard'; boot(); }

/* ---------- site notes / notifications (receipt remarks surfaced to the store) ---------- */
interface SiteNote { id:string; transferId:string; label:string; by:string; when:string; text:string; }
function siteNotes(): SiteNote[] {
  return state.receipts.filter(r=>r.remarks && r.remarks.trim())
    .map(r=>{ const t=state.transfers.find(x=>x.id===r.transferId);
      return { id:r.id, transferId:r.transferId, label:(t?`${t.id} · ${t.docType}-${t.docNo}`:r.transferId), by:r.receivedBy, when:r.confirmedAt, text:r.remarks!.trim() }; })
    .sort((a,b)=>b.when.localeCompare(a.when));
}
function unreadNotes(){ const read=state.settings.readNotes||[]; return siteNotes().filter(n=>!read.includes(n.id)); }
function markNotesRead(){ state.settings.readNotes=siteNotes().map(n=>n.id); save(); }

/* ---------- theme ---------- */
const THEME_LS='mtts-theme';
function initTheme(){ let t; try{ t=localStorage.getItem(THEME_LS); }catch{} document.documentElement.setAttribute('data-theme', t||'light'); }
function toggleTheme(){ const cur=document.documentElement.getAttribute('data-theme')==='dark'?'light':'dark'; document.documentElement.setAttribute('data-theme',cur); try{ localStorage.setItem(THEME_LS,cur); }catch{} renderTopbar(); }

/* ---------- view state ---------- */
let view='dashboard', qFilter='', curTransfer='';
let draftItems:TransferItem[]=[];

/* ===========================================================
   SHELL
   =========================================================== */
function navItems(){
  return navGroups().flatMap(g=>g[1]);
}
function navGroups(): [string, [string,string][]][]{
  let groups:[string,[string,string][]][]=[
    ['OVERVIEW', [['dashboard','Dashboard']]],
    ['INVENTORY', [['master','Master Items'],['stock','Current Stock'],['locations','Locations']]],
    ['OPERATIONS', [['requests','Material Requests'],['receipts','Receipt Confirmation']]],
    ['TRACKING', [['notes','Notifications'],['losses','Loss Register'],['reports','Reports'],['history','Movement History']]],
    ['SYSTEM', (canManageUsers()?[['users','User Management'] as [string,string]]:[]).concat([['settings','Settings']])],
  ];
  if(isSite()){
    // Site Manager = overview of everything (read-only) + can raise a request
    const allow=new Set(['dashboard','master','stock','requests','receipts','losses','reports','history']);
    groups=groups.map(([t,items])=>[t, items.filter(n=>allow.has(n[0]))] as [string,[string,string][]]).filter(g=>g[1].length);
  }
  return groups;
}
function pendingForSite(){ return state.transfers.filter(t=>['PENDING','PARTIAL'].includes(transferStatus(t))).length; }
function pendingRequests(){ return state.requests.filter(r=>r.status==='PENDING').length; }
function openRequestsForSite(){ return state.requests.filter(r=>r.requestedBy===me() || r.status!=='REJECTED').length; }

function renderSidebar(){
  const nav=navItems();
  const pend=pendingForSite();
  const unread=isStore()?unreadNotes().length:0;
  const preq=isPurchase()?pendingRequests():0;
  const badge=(k:string)=>{ if(k==='receipts'&&pend) return `<span class="nav-badge">${pend}</span>`; if(k==='notes'&&unread) return `<span class="nav-badge">${unread>9?'9+':unread}</span>`; if(k==='requests'&&preq) return `<span class="nav-badge">${preq}</span>`; return ''; };
  const sections=navGroups().map(([title,items])=>`
    <div class="nav-sec">${esc(title)}</div>
    ${items.map(n=>`<button class="nav-item ${view===n[0]?'active':''}" onclick="go('${n[0]}')">${svg(IC[n[0]]||IC.dashboard)}<span>${n[1]}</span>${badge(n[0])}</button>`).join('')}`).join('');
  document.getElementById('sidebar')!.innerHTML=`
    <div class="logo">${brandLogo(34)}<b class="ql">Qualtech<span>Engineers Pvt. Ltd.</span></b></div>
    ${(isPurchase()||isStore()||allowedWorkspaces().length>1)?`<button class="site-switch" onclick="openSiteSwitcher()" title="Switch / add site"><div class="ss-ic">${svg(IC.locations,16)}</div><div class="ss-t"><span>${isPurchase()?'HEAD OFFICE · SITE':'ACTIVE SITE'}</span><b>${esc(wsName())}</b></div>${svg(IC.chev,16)}</button>`:''}
    <nav class="nav">${sections}</nav>
    <div class="side-foot">v1.0 · Phase 1 Pilot · ${esc(central()?central()!.name:'')} → ${esc(sites()[0]?sites()[0].name:'')}</div>`;
}
function renderTopbar(){
  const dark=document.documentElement.getAttribute('data-theme')==='dark';
  const u=me(), r=session?session.title:ROLE_TITLE[role()];
  const initials=u.split(' ').map(w=>w[0]).join('').slice(0,2);
  document.getElementById('topbar')!.innerHTML=`
    <div class="search">${svg(IC.search)}<input id="topSearch" placeholder="Search material, code or location…" value="${esc(qFilter)}" oninput="topSearch(this.value)"></div>
    <div class="tb-right">
      <button class="icn" title="Toggle light / dark" onclick="toggleTheme()">${svg(dark?ICsun:ICmoon)}</button>
      ${isStore()?(()=>{const n=unreadNotes().length;return `<button class="icn" title="Site requests" onclick="openNotes()">${n?`<span class="icn-dot">${n>9?'9+':n}</span>`:''}${svg(IC.bell)}</button>`;})():`<button class="icn" title="Notifications">${svg(IC.bell)}</button>`}
      <button class="user-chip" title="Sign out" onclick="logout()"><div class="avatar">${esc(initials)}</div><div class="u"><b>${esc(u)}</b><span>${esc(r)}</span></div>${svg(IC.chev,16)}</button>
    </div>`;
}
function switchRole(){ state.settings.role = isStore()?'site':'store'; save(); if(!navItems().some(n=>n[0]===view)) view='dashboard'; renderSidebar(); renderTopbar(); renderView(); toast('Now acting as '+(isStore()?'Storekeeper':'Site Manager')); }
function go(v:string){ if(!navItems().some(n=>n[0]===v)&&v!==v){} view=v; curTransfer=''; renderSidebar(); renderView(); window.scrollTo(0,0); }
function openNotes(){
  const notes=siteNotes(); const read=state.settings.readNotes||[];
  const body=notes.length?notes.map(n=>`<div class="note-item ${read.includes(n.id)?'':'unread'}" onclick="gotoNote('${jsid(n.transferId)}')">
      <div class="note-ic">${svg(IC.bell,15)}</div>
      <div class="note-main"><div class="note-txt">${esc(n.text)}</div>
      <div class="note-meta">${esc(n.label)} · ${esc(n.by)} · ${esc(n.when)}</div></div>
      <div class="note-go">${svg(IC.arrow,15)}</div></div>`).join('')
    :`<div class="draft-empty" style="margin:6px">No site requests yet. Remarks a site enters when confirming receipt will appear here.</div>`;
  openModal(`<div class="modal">${mh(IC.bell,'Site Requests','Notes from the receiving site, newest first')}
    <div class="m-body" style="padding-top:8px">${body}</div></div>`);
  markNotesRead(); renderTopbar(); if(view==='dashboard') document.getElementById('app')!.innerHTML=dashboardHTML();
}
function gotoNote(id:string){ closeModal(); openTransfer(id); }
function notesViewHTML(){
  const notes=siteNotes(); const read=state.settings.readNotes||[]; const unread=unreadNotes().length;
  const rows=notes.length?notes.map(n=>`<div class="note-item ${read.includes(n.id)?'':'unread'}" onclick="openTransfer('${jsid(n.transferId)}')">
      <div class="note-ic">${svg(IC.bell,15)}</div>
      <div class="note-main"><div class="note-txt">${esc(n.text)}</div><div class="note-meta">${esc(n.label)} · ${esc(n.by)} · ${esc(n.when)}</div></div>
      <div class="note-go">${svg(IC.arrow,15)}</div></div>`).join('')
    :empty(IC.bell,'No site requests yet. When the receiving site adds a remark while confirming a receipt, it appears here.');
  return `${pageTop('Notifications','Requests and notes from the receiving site — newest first'+(unread?` · ${unread} new`:''))}
  <div class="panel pad">${rows}</div>`;
}
let _ts:ReturnType<typeof setTimeout>|null=null;
function topSearch(v:string){ qFilter=v; if(!['master','stock','history','transfers'].includes(view)){ view='stock'; renderSidebar(); } if(_ts) clearTimeout(_ts); _ts=setTimeout(()=>{ _ts=null; renderView(); },180); }

function renderView(){
  const el=document.getElementById('app'); if(!el) return;
  try{
    switch(view){
      case 'dashboard': el.innerHTML=dashboardHTML(); break;
      case 'master': case 'materials': case 'opening': el.innerHTML=masterHTML(); break;
      case 'stock':     el.innerHTML=stockHTML(); break;
      case 'locations': el.innerHTML=locationsHTML(); break;
      case 'requests':  el.innerHTML=requestsHTML(); break;
      case 'transfers': view='receipts'; el.innerHTML=curTransfer?receiptConfirmHTML(curTransfer):receiptsHTML(); break; // module removed → route to receipts
      case 'receipts':  el.innerHTML=curTransfer?receiptConfirmHTML(curTransfer):receiptsHTML(); break;
      case 'notes':     el.innerHTML=notesViewHTML(); markNotesRead(); renderSidebar(); renderTopbar(); break;
      case 'losses':    el.innerHTML=lossesHTML(); break;
      case 'reports':   el.innerHTML=reportsHTML(); break;
      case 'history':   el.innerHTML=historyHTML(); break;
      case 'users':     el.innerHTML=usersHTML(); break;
      case 'settings':  el.innerHTML=settingsHTML(); break;
      default: el.innerHTML=dashboardHTML();
    }
  }catch(err){ console.error('renderView failed:',err); el.innerHTML=renderErrorHTML(view,err); }
}
function renderErrorHTML(where:string, err:any){
  const msg=esc((err&&err.message)||String(err));
  return `<div class="page-top"><h1>Something went wrong</h1></div>
  <div class="panel" style="padding:28px;text-align:center">
    <div style="font-size:40px">⚠️</div>
    <div style="font-weight:600;margin:8px 0">Couldn't display "${esc(where)}".</div>
    <div style="color:var(--muted);font-size:13px;margin-bottom:16px">${msg}</div>
    <button class="btn" onclick="go('dashboard')">Go to Dashboard</button>
    <button class="btn ghost" onclick="location.reload()">Reload</button></div>`;
}

/* ---------- modal helpers ---------- */
function openModal(html:string){ const l=document.getElementById('layer')!; l.innerHTML=`<div class="scrim" onclick="closeModal()"></div>${html}`; l.classList.add('on'); }
function closeModal(){ const l=document.getElementById('layer')!; l.classList.remove('on'); l.innerHTML=''; }
function val(id:string){ const e=document.getElementById(id) as HTMLInputElement; return e?e.value.trim():''; }
function numVal(id:string){ return Number(val(id))||0; }
function mh(icon:string,title:string,sub:string){ return `<div class="m-head"><div class="mh-ic" style="background:var(--blue-l);color:var(--blue)">${svg(icon)}</div><div><h3>${title}</h3><p>${sub}</p></div><button class="x" onclick="closeModal()">×</button></div>`; }
function pageTop(title:string, sub:string, actions=''){ return `<div class="page-top" style="display:flex;justify-content:space-between;align-items:flex-end;gap:16px;flex-wrap:wrap"><div><h1>${title}</h1><p>${sub}</p></div><div class="inv-actions" style="display:flex;gap:8px">${actions}</div></div>`; }
function empty(icon:string,msg:string){ return `<div class="panel" style="padding:44px;text-align:center;color:var(--muted)"><div style="opacity:.4;margin-bottom:10px">${svg(icon,34)}</div>${esc(msg)}</div>`; }

/* ===========================================================
   DASHBOARD
   =========================================================== */
function kpi(label:string, value:string, icon:string){ return `<div class="kpi"><div class="k-ic" style="background:var(--blue-l);color:var(--blue)">${svg(icon)}</div><div><div class="kv">${value}</div><div class="kl">${label}</div></div></div>`; }
/* KPI card — minimalist: outline icon + number + label + sub */
function lkpi(value:string, label:string, sub:string, icon:string, go?:string){
  return `<div class="lkpi"${go?` onclick="go('${go}')" style="cursor:pointer"`:''}>
    <div class="lkpi-ic">${svg(icon)}</div>
    <div class="lkpi-txt"><div class="lkpi-n">${value}</div><div class="lkpi-l">${esc(label)}</div><div class="lkpi-sub">${esc(sub)}</div></div></div>`;
}
function secLabel(no:string, title:string, right=''){
  return `<div class="sec-label"><span class="sec-no">${esc(no)}</span><span class="sec-bar"></span><span class="sec-t">${esc(title)}</span>${right?`<div class="sec-right">${right}</div>`:''}</div>`;
}
function heroDate(){
  const d=new Date(nowDate()+'T00:00:00');
  const wd=['SUN','MON','TUE','WED','THU','FRI','SAT'][d.getDay()];
  const mo=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'][d.getMonth()];
  return `<div class="hero-date"><span class="hd-wd">${wd}</span><b class="hd-n">${d.getDate()}</b><span class="hd-m">${mo} ${d.getFullYear()}</span></div>`;
}
function dashboardHTML(){
  const cId=CENTRAL_ID(), sId=SITE_ID();
  const pend=state.transfers.filter(t=>transferStatus(t)==='PENDING').length;
  const partial=state.transfers.filter(t=>transferStatus(t)==='PARTIAL').length;
  const completed=state.transfers.filter(t=>transferStatus(t)==='CLOSED').length;
  const totLoss=lossMovements().reduce((s,m)=>s+m.qty,0);
  const low=state.materials.filter(m=>m.active && onHand(m.code,cId)>0 && onHand(m.code,cId)<=state.settings.lowStock);
  const recent=state.transfers.slice().sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).slice(0,6);
  const name=me().replace(/^[A-Za-z]\.\s+/,'')||me();
  const c=central()?central()!.name:'Central Store', s=sites()[0]?sites()[0].name:'Pilot Site';
  const hero=`<div class="hero">
    <div class="hero-row">
      <div class="hero-left"><div class="eyebrow">Dashboard</div>
        <h1 class="hero-h">Welcome back,<br>${esc(name)}.</h1></div>
      <div class="hero-meta">${heroDate()}
        <div class="route-pills"><span class="pt-pill">${esc(c)} <span class="pt-arrow">${svg(IC.arrow,14)}</span> ${esc(s)}</span><span class="pt-pill soft">Phase 1 Pilot</span></div>
      </div>
    </div>
    <p class="hero-sub">${esc(session?session.title:ROLE_TITLE[role()])} overview — materials, requests, receipts and stock movement.</p>
    <div class="period-toggle"><button class="pt">This Month</button><button class="pt">Last 3 Months</button><button class="pt on">All Time</button></div>
  </div>`;
  const k=`<div class="lkpis">
    ${lkpi(num(state.materials.filter(m=>m.active).length),'Registered Materials','Master items', IC.materials,'master')}
    ${lkpi(num(Math.round(locationTotal(cId))),'Central Store Stock','On hand now', IC.warehouse,'stock')}
    ${lkpi(num(Math.round(locationTotal(sId))),'Pilot Site Stock','Confirmed at site', IC.building,'stock')}
    ${lkpi(num(Math.round(totalTransit())),'In Transit','Dispatched, not received', IC.truck,'receipts')}
    ${lkpi(num(pend),'Pending Receipts','Awaiting confirmation', IC.receipts,'receipts')}
    ${lkpi(num(pendingRequests()),'Material Requests',isPurchase()?'Awaiting your approval':'Awaiting approval', IC.requests,'requests')}
    ${lkpi(num(completed),'Completed Deliveries','Fully reconciled', IC.check,'receipts')}
    ${lkpi(num(totLoss),'Total Loss','Damaged / short units', IC.losses,'losses')}
  </div>`;
  const recentRows=recent.length?recent.map(t=>{
    const st=transferStatus(t);
    return `<tr onclick="openTransfer('${jsid(t.id)}')" style="cursor:pointer">
      <td class="n b">${esc(t.id)}</td><td>${esc(t.docType)}-${esc(t.docNo)}</td>
      <td>${esc(locName(t.from))} → ${esc(locName(t.to))}</td>
      <td class="n">${num(transferDispatched(t))}</td><td>${statusChip(st)}</td><td>${esc(t.txnDate)}</td></tr>`;
  }).join(''):`<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:24px">No transfers yet</td></tr>`;
  const lowPanel=low.length
    ? `<table class="mv-table"><thead><tr><th>Code</th><th>Material</th><th class="n">On hand</th></tr></thead><tbody>${low.map(m=>`<tr><td class="n b">${esc(m.code)}</td><td>${esc(m.name)}</td><td class="n">${num(onHand(m.code,cId))} ${esc(m.unit)}</td></tr>`).join('')}</tbody></table>`
    : `<div class="empty-state">${svg(IC.materials,34)}<b>No low-stock materials</b><span>All materials are within stock limits.</span></div>`;
  return `${hero}
  ${k}
  ${canRequest()?`<div class="xfer-row"><button class="btn dark" onclick="openRequestForm()">${svg(IC.plus)} Request Materials</button></div>`:(canSend()?`<div class="xfer-row"><button class="btn dark" onclick="go('requests')">${svg(IC.requests)} Review Requests</button></div>`:'')}
  <div class="dash-grid">
    <div class="panel pad">
      <div class="panel-h"><span class="sec-accent"></span><b>Recent Deliveries</b><a class="rt-link" onclick="go('receipts')">View All ${svg(IC.arrow,15)}</a></div>
      <table class="mv-table"><thead><tr><th>Transfer</th><th>Document</th><th>Route</th><th class="n">Qty</th><th>Status</th><th>Date</th></tr></thead><tbody>${recentRows}</tbody></table></div>
    <div class="panel pad"><div class="panel-h"><span class="sec-accent"></span><b>Low Stock · Central Store</b></div>
      ${lowPanel}
      ${partial?`<div class="note-row">${svg(IC.alert,15)} ${partial} transfer(s) partially received — awaiting reconciliation</div>`:''}
    </div>
  </div>
  ${isStore()?secLabel('','Site requests')+siteRequestsPanel():''}`;
}
function siteRequestsPanel(){
  const notes=siteNotes().slice(0,6); const read=state.settings.readNotes||[]; const unread=unreadNotes().length;
  const rows=notes.length?notes.map(n=>`<div class="note-item ${read.includes(n.id)?'':'unread'}" onclick="openTransfer('${jsid(n.transferId)}')">
      <div class="note-ic">${svg(IC.bell,15)}</div>
      <div class="note-main"><div class="note-txt">${esc(n.text)}</div><div class="note-meta">${esc(n.label)} · ${esc(n.by)} · ${esc(n.when)}</div></div>
      <div class="note-go">${svg(IC.arrow,15)}</div></div>`).join('')
    :`<div class="draft-empty">No site requests yet. When the site adds a remark while confirming receipt, it shows up here.</div>`;
  return `<div class="panel pad" style="margin-top:16px"><div class="panel-h"><b>Site Requests &amp; Notes</b>${unread?`<span class="count">${unread} new</span>`:''}${notes.length&&unread?`<button class="btn ghost sm" onclick="markNotesRead();renderTopbar();renderView()">Mark all read</button>`:''}</div>${rows}</div>`;
}

/* ===========================================================
   MATERIALS
   =========================================================== */
function mFiltered(){ const q=qFilter.toLowerCase(); return state.materials.filter(m=>!q||m.code.toLowerCase().includes(q)||m.name.toLowerCase().includes(q)||m.category.toLowerCase().includes(q)); }
function materialsHTML(){
  const list=mFiltered();
  const rows=list.map(m=>`<tr>
    <td class="n b">${esc(m.code)}</td><td>${esc(m.name)}</td><td>${esc(m.category)}</td><td>${esc(m.unit)}</td>
    <td class="n">${num(onHand(m.code,CENTRAL_ID()))}</td>
    <td>${m.active?'<span class="chip c-ok"><i></i>Active</span>':'<span class="chip c-out"><i></i>Inactive</span>'}</td>
    <td class="row-act">
      <button class="ic-btn" title="Edit" onclick="openMaterialForm('${jsid(m.code)}')">${svg(IC.edit,15)}</button>
      <button class="ic-btn" title="${m.active?'Deactivate':'Activate'}" onclick="toggleMaterial('${jsid(m.code)}')">${svg(m.active?IC.x:IC.check,15)}</button>
    </td></tr>`).join('');
  const actions=isStore()?`<button class="btn ghost" onclick="openImport()">${svg(IC.upload)} Import Excel/CSV</button><button class="btn" onclick="openMaterialForm()">${svg(IC.plus)} Add Material</button>`:'';
  return `${pageTop('Materials','Master list of all materials — '+num(state.materials.length)+' registered', actions)}
  <div class="panel"><table><thead><tr><th>Code</th><th>Name</th><th>Category</th><th>Unit</th><th class="n">Central Stock</th><th>Status</th><th></th></tr></thead>
  <tbody>${rows||`<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:28px">No materials found</td></tr>`}</tbody></table></div>`;
}
function openMaterialForm(code?:string){
  const m=code?material(code):null;
  const cats=['Steel','Cement','Aggregate','Block','Electrical','Plumbing','Shuttering','Safety','Finishing','Other'];
  openModal(`<div class="modal">${mh(IC.materials, m?'Edit Material':'Add Material', m?'Update material details':'Register a new material')}
    <div class="m-body"><div class="grid2">
      <div class="fld"><label>Material Code <span class="req">*</span></label><input class="f" id="m-code" value="${esc(m?m.code:nextId('MAT-','materials','code'))}" ${m?'disabled':''}></div>
      <div class="fld"><label>Unit of Measure <span class="req">*</span></label><input class="f" id="m-unit" value="${esc(m?m.unit:'')}" placeholder="kg, bag, nos…"></div>
      <div class="fld col2"><label>Material Name <span class="req">*</span></label><input class="f" id="m-name" value="${esc(m?m.name:'')}"></div>
      <div class="fld"><label>Category</label><select class="f" id="m-cat">${cats.map(c=>`<option ${m&&m.category===c?'selected':''}>${c}</option>`).join('')}</select></div>
      <div class="fld"><label>Status</label><select class="f" id="m-active"><option value="1" ${!m||m.active?'selected':''}>Active</option><option value="0" ${m&&!m.active?'selected':''}>Inactive</option></select></div>
      <div class="fld col2"><label>Description</label><input class="f" id="m-desc" value="${esc(m?m.description||'':'')}"></div>
    </div></div>
    <div class="m-foot"><button class="btn ghost" onclick="closeModal()">Cancel</button><button class="btn" onclick="submitMaterial('${jsid(code||'')}')">${m?'Save Changes':'Add Material'}</button></div></div>`);
}
function submitMaterial(code:string){
  const c=val('m-code'), name=val('m-name'), unit=val('m-unit');
  if(!c||!name||!unit) return toast('Code, name and unit are required');
  if(!code && material(c)) return toast('Material code already exists');
  const rec:Material={ code:c, name, category:val('m-cat'), unit, description:val('m-desc'), active:val('m-active')==='1' };
  if(code){ const i=state.materials.findIndex(m=>m.code===code); state.materials[i]={...state.materials[i],...rec,code}; }
  else state.materials.push(rec);
  save(); closeModal(); renderView(); toast('Material '+(code?'updated':'added'));
}
function toggleMaterial(code:string){
  const m=material(code); if(!m) return;
  const used=state.movements.some(mv=>mv.code===code)||state.transfers.some(t=>t.items.some(i=>i.code===code));
  m.active=!m.active; save(); renderView();
  toast(m.active?'Material activated':('Material deactivated'+(used?' (history preserved)':'')));
}
/* ---- Excel/CSV import ---- */
function openImport(){
  openModal(`<div class="modal wide">${mh(IC.upload,'Import Materials','Paste rows from Excel, or upload a CSV file')}
    <div class="m-body">
      <div class="imp-help">Columns: <b>Code, Name, Category, Unit, Description</b>. One material per line. <a href="#" onclick="dlTemplate();return false">Download template</a></div>
      <input type="file" id="imp-file" accept=".csv,.txt" class="f" style="margin-bottom:10px" onchange="impFile(event)">
      <textarea class="f" id="imp-text" rows="8" placeholder="MAT-020, Angle 50x50, Steel, kg, 5mm thickness&#10;MAT-021, Concrete M25, Concrete, m³"></textarea>
      <div id="imp-preview"></div>
    </div>
    <div class="m-foot"><button class="btn ghost" onclick="closeModal()">Cancel</button><button class="btn ghost" onclick="impPreview()">Preview</button><button class="btn" onclick="impCommit()">Import</button></div></div>`);
}
function dlTemplate(){ const csv='Code,Name,Category,Unit,Description\nMAT-100,Example Material,Steel,kg,Sample row\n'; const a=document.createElement('a'); a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv); a.download='material-template.csv'; a.click(); }
function impFile(e:any){ const f=e.target.files[0]; if(!f) return; const r=new FileReader(); r.onload=()=>{ (document.getElementById('imp-text') as HTMLTextAreaElement).value=String(r.result); impPreview(); }; r.readAsText(f); }
function parseImport():{rows:Material[],errors:string[]}{
  const txt=(document.getElementById('imp-text') as HTMLTextAreaElement).value;
  const rows:Material[]=[], errors:string[]=[]; const seen=new Set<string>();
  txt.split(/\r?\n/).forEach((line,i)=>{
    const t=line.trim(); if(!t) return;
    if(/^code\s*,/i.test(t)) return; // header
    const p=t.split(/\t|,/).map(s=>s.trim());
    const [code,name,category,unit,desc]=p;
    if(!code||!name||!unit){ errors.push(`Line ${i+1}: missing code/name/unit`); return; }
    if(seen.has(code)||material(code)){ errors.push(`Line ${i+1}: duplicate code ${code}`); return; }
    seen.add(code);
    rows.push({ code, name, category:category||'Other', unit, description:desc||'', active:true });
  });
  return {rows,errors};
}
function impPreview(){
  const {rows,errors}=parseImport();
  const el=document.getElementById('imp-preview')!;
  el.innerHTML=`<div class="imp-stat"><b>${rows.length}</b> valid · <b style="color:var(--red)">${errors.length}</b> issues</div>
    ${errors.length?`<div class="imp-err">${errors.slice(0,8).map(esc).join('<br>')}</div>`:''}
    ${rows.length?`<table class="mv-table"><thead><tr><th>Code</th><th>Name</th><th>Cat</th><th>Unit</th></tr></thead><tbody>${rows.slice(0,10).map(r=>`<tr><td class="n">${esc(r.code)}</td><td>${esc(r.name)}</td><td>${esc(r.category)}</td><td>${esc(r.unit)}</td></tr>`).join('')}</tbody></table>`:''}`;
}
function impCommit(){
  const {rows,errors}=parseImport();
  if(!rows.length) return toast(errors.length?'Fix the issues first':'Nothing to import');
  rows.forEach(r=>state.materials.push(r));
  save(); closeModal(); renderView(); toast(rows.length+' materials imported'+(errors.length?` (${errors.length} skipped)`:''));
}

/* ===========================================================
   LOCATIONS
   =========================================================== */
function locationsHTML(){
  const rows=state.locations.map(l=>`<tr>
    <td class="n b">${esc(l.code)}</td><td>${esc(l.name)}</td>
    <td><span class="chip ${l.type==='store'?'c-normal':'c-use'}"><i></i>${l.type==='store'?'Central Store':'Site'}</span></td>
    <td>${esc(l.person||'—')}</td><td>${esc(l.contact||'—')}</td><td class="n">${num(Math.round(locationTotal(l.id)))}</td>
    <td>${l.active?'<span class="chip c-ok"><i></i>Active</span>':'<span class="chip c-out"><i></i>Inactive</span>'}</td>
    <td class="row-act"><button class="ic-btn" onclick="openLocationForm('${jsid(l.id)}')">${svg(IC.edit,15)}</button></td></tr>`).join('');
  return `${pageTop('Locations','This pilot runs with one Central Store and one Site. Details are editable; the two locations are fixed.', '')}
  <div class="panel"><table><thead><tr><th>Code</th><th>Name</th><th>Type</th><th>Responsible</th><th>Contact</th><th class="n">Stock Items</th><th>Status</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`;
}
function openLocationForm(id?:string){
  const l=id?loc(id):null;
  openModal(`<div class="modal">${mh(IC.locations,l?'Edit Location':'Add Location',l?'Update location details':'Register a store or site')}
    <div class="m-body"><div class="grid2">
      <div class="fld"><label>Location Code <span class="req">*</span></label><input class="f" id="l-code" value="${esc(l?l.code:nextId('LOC-','locations','code'))}"></div>
      <div class="fld"><label>Type <span class="req">*</span></label><select class="f" id="l-type"><option value="store" ${l&&l.type==='store'?'selected':''}>Central Store</option><option value="site" ${!l||l.type==='site'?'selected':''}>Site</option></select></div>
      <div class="fld col2"><label>Location Name <span class="req">*</span></label><input class="f" id="l-name" value="${esc(l?l.name:'')}"></div>
      <div class="fld"><label>Responsible Person</label><input class="f" id="l-person" value="${esc(l?l.person||'':'')}"></div>
      <div class="fld"><label>Contact</label><input class="f" id="l-contact" value="${esc(l?l.contact||'':'')}"></div>
      <div class="fld col2"><label>Address</label><input class="f" id="l-addr" value="${esc(l?l.address||'':'')}"></div>
      <div class="fld"><label>Status</label><select class="f" id="l-active"><option value="1" ${!l||l.active?'selected':''}>Active</option><option value="0" ${l&&!l.active?'selected':''}>Inactive</option></select></div>
    </div></div>
    <div class="m-foot"><button class="btn ghost" onclick="closeModal()">Cancel</button><button class="btn" onclick="submitLocation('${jsid(id||'')}')">${l?'Save':'Add Location'}</button></div></div>`);
}
function submitLocation(id:string){
  const code=val('l-code'), name=val('l-name'); if(!code||!name) return toast('Code and name required');
  const rec={ code, name, type:val('l-type') as LocType, person:val('l-person'), contact:val('l-contact'), address:val('l-addr'), active:val('l-active')==='1' };
  if(id){ const i=state.locations.findIndex(l=>l.id===id); state.locations[i]={...state.locations[i],...rec,id}; }
  else state.locations.push({ id:nextId('LOC','locations','id').replace('LOC','LOC-'), ...rec });
  save(); closeModal(); renderView(); toast('Location '+(id?'updated':'added'));
}

/* ===========================================================
   OPENING STOCK
   =========================================================== */
function openingHTML(){
  const cId=CENTRAL_ID(), sId=SITE_ID();
  const rows=state.materials.filter(m=>m.active).map(m=>`<tr>
    <td class="n b">${esc(m.code)}</td><td>${esc(m.name)}</td><td>${esc(m.unit)}</td>
    <td class="n">${num(onHand(m.code,cId))}</td><td class="n">${num(onHand(m.code,sId))}</td>
    <td class="row-act"><button class="btn ghost sm" onclick="openAdjust('${jsid(m.code)}')">Adjust</button></td></tr>`).join('');
  return `${pageTop('Opening Stock','Initial balances per location. Posted to the ledger as OPENING entries; corrections use authorised adjustments.', isStore()?`<button class="btn ghost" onclick="openOpeningImport()">${svg(IC.upload)} Import Balances</button>`:'')}
  <div class="panel"><table><thead><tr><th>Code</th><th>Material</th><th>Unit</th><th class="n">${esc(central()?central()!.name:'Central')}</th><th class="n">${esc(sites()[0]?sites()[0].name:'Site')}</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>
  <div class="hint">${svg(IC.alert,14)} Opening balances are captured once. Any later correction is recorded as a dated stock adjustment with a reason, never a silent edit.</div>`;
}
function openAdjust(code:string){
  const m=material(code)!; const cId=CENTRAL_ID(), sId=SITE_ID();
  openModal(`<div class="modal">${mh(IC.opening,'Stock Adjustment','Set / correct the balance for '+esc(m.name))}
    <div class="m-body"><div class="grid2">
      <div class="fld"><label>${esc(central()!.name)} — new qty</label><input class="f" id="a-c" type="number" min="0" value="${onHand(code,cId)}"></div>
      <div class="fld"><label>${esc(sites()[0].name)} — new qty</label><input class="f" id="a-s" type="number" min="0" value="${onHand(code,sId)}"></div>
      <div class="fld col2"><label>Reason <span class="req">*</span></label><input class="f" id="a-reason" placeholder="Opening count, physical verification…"></div>
      <div class="fld"><label>Date</label><input class="f" id="a-date" type="date" value="${nowDate()}"></div>
    </div></div>
    <div class="m-foot"><button class="btn ghost" onclick="closeModal()">Cancel</button><button class="btn" onclick="submitAdjust('${jsid(code)}')">Post Adjustment</button></div></div>`);
}
function submitAdjust(code:string){
  const reason=val('a-reason'); if(!reason) return toast('A reason is required');
  const date=val('a-date')||nowDate();
  const map:[string,number][]=[[CENTRAL_ID(),numVal('a-c')],[SITE_ID(),numVal('a-s')]];
  let n=0;
  for(const [locId,target] of map){
    const cur=onHand(code,locId); const diff=target-cur; if(Math.abs(diff)<1e-9) continue; n++;
    if(diff>0) addMovement({code,qty:diff,from:'OPENING',to:locId,type:'ADJUST',ref:'Adj: '+reason,txnDate:date});
    else addMovement({code,qty:-diff,from:locId,to:'LOSS',type:'ADJUST',ref:'Adj: '+reason,txnDate:date});
  }
  save(); closeModal(); renderView(); toast(n?'Stock adjusted':'No change');
}
function openOpeningImport(){
  openModal(`<div class="modal wide">${mh(IC.upload,'Import Opening Balances','Columns: Material Code, Central Qty, Site Qty')}
    <div class="m-body"><textarea class="f" id="ob-text" rows="8" placeholder="MAT-001, 5000, 400&#10;MAT-003, 800, 60"></textarea></div>
    <div class="m-foot"><button class="btn ghost" onclick="closeModal()">Cancel</button><button class="btn" onclick="obCommit()">Import</button></div></div>`);
}
function obCommit(){
  const txt=(document.getElementById('ob-text') as HTMLTextAreaElement).value; let n=0, skip=0;
  txt.split(/\r?\n/).forEach(line=>{ const t=line.trim(); if(!t||/code/i.test(t.split(/[,\t]/)[0])) return;
    const [code,c,s]=t.split(/\t|,/).map(x=>x.trim()); const m=material(code); if(!m){ skip++; return; }
    const cq=Number(c)||0, sq=Number(s)||0;
    const dc=cq-onHand(code,CENTRAL_ID()); if(dc>0) addMovement({code,qty:dc,from:'OPENING',to:CENTRAL_ID(),type:'OPEN',ref:'Opening import'});
    const ds=sq-onHand(code,SITE_ID()); if(ds>0) addMovement({code,qty:ds,from:'OPENING',to:SITE_ID(),type:'OPEN',ref:'Opening import'});
    n++;
  });
  save(); closeModal(); renderView(); toast(n+' balances imported'+(skip?` (${skip} unknown codes skipped)`:''));
}

/* ===========================================================
   MATERIAL REQUESTS  (site raises -> store approves -> transfer)
   =========================================================== */
const REQ_META:Record<RequestStatus,{t:string;c:string}>={
  PENDING:{t:'Pending Approval',c:'c-low'}, APPROVED:{t:'Approved',c:'c-ok'}, REJECTED:{t:'Rejected',c:'c-out'},
};
function reqChip(s:RequestStatus){ const m=REQ_META[s]; return `<span class="chip ${m.c}"><i></i>${m.t}</span>`; }
const reqQty=(r:MaterialRequest)=>r.items.reduce((s,i)=>s+i.qty,0);
function reqLinkedStatus(r:MaterialRequest){ if(!r.transferId) return ''; const t=state.transfers.find(x=>x.id===r.transferId); return t?statusChip(transferStatus(t)):''; }

let reqDraftItems:RequestItem[]=[];

function requestsHTML(){
  const list=state.requests.slice().sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
  const row=(r:MaterialRequest)=>`<tr onclick="${canApprove()&&r.status==='PENDING'?`openReviewRequest('${jsid(r.id)}')`:''}" style="${canApprove()&&r.status==='PENDING'?'cursor:pointer':''}">
      <td class="n b">${esc(r.id)}</td><td>${esc(r.txnDate)}</td><td>${esc(r.requestedBy)}</td>
      <td class="n">${r.items.length}</td><td class="n">${num(reqQty(r))}</td>
      <td>${reqChip(r.status)}</td><td>${r.reviewedBy?esc(r.reviewedBy)+' · '+esc(r.reviewedAt||''):'<span style="color:var(--muted);font-size:12px">—</span>'}</td>
      <td class="row-act">${canApprove()&&r.status==='PENDING'?`<button class="btn sm" onclick="event.stopPropagation();openReviewRequest('${jsid(r.id)}')">Review</button>`:''}</td></tr>`;
  const inbox=isPurchase();
  const title=inbox?'Material Requests — Approval Inbox':'Material Requests';
  const sub=inbox?'Requests awaiting your approval. Approving dispatches the materials to the storekeeper in one step.':(isSite()?'Raise a request to the Purchase Manager at the office. The storekeeper normally requests; you can raise one too.':'Request materials from the Purchase Manager at the office. Once approved they are sent to you to receive and check.');
  const action=canRequest()?`<button class="btn" onclick="openRequestForm()">${svg(IC.plus)} Request Materials</button>`:'';
  const pend=state.requests.filter(r=>r.status==='PENDING');
  return `${pageTop(title,sub,action)}
  ${inbox&&pend.length?`<div class="hint">${svg(IC.alert,14)} <b>${pend.length}</b> request(s) awaiting your approval.</div>`:''}
  <div class="panel"><table><thead><tr><th>Request</th><th>Date</th><th>Requested By</th><th class="n">Items</th><th class="n">Qty</th><th>Status</th><th>Reviewed</th><th></th></tr></thead>
  <tbody>${list.length?list.map(row).join(''):`<tr><td colspan="8" style="text-align:center;color:var(--muted);padding:28px">No requests yet</td></tr>`}</tbody></table></div>`;
}

/* ---- site: raise request ---- */
function openRequestForm(){
  reqDraftItems=[];
  openModal(`<div class="modal wide">${mh(IC.requests,'Request Materials','Ask Head Office (Purchase Manager) for materials')}
    <div class="m-body">
      <div class="grid2">
        <div class="fld"><label>Request Date</label><input class="f" id="rq-date" type="date" value="${nowDate()}"></div>
        <div class="fld"><label>Requested By</label><input class="f" id="rq-by" value="${esc(me())}"></div>
        <div class="fld col2"><label>Remarks / Reason</label><input class="f" id="rq-remarks" placeholder="Low on cement, needed for next pour…"></div>
      </div>
      <div class="line-add">
        <select class="f" id="rqi-code">${state.materials.filter(m=>m.active).map(m=>`<option value="${m.code}">${esc(m.code)} — ${esc(m.name)}</option>`).join('')}</select>
        <input class="f" id="rqi-qty" type="number" min="0" placeholder="Qty">
        <button class="btn ghost" onclick="addReqItem()">${svg(IC.plus)} Add</button>
      </div>
      <div id="req-lines"></div>
    </div>
    <div class="m-foot"><button class="btn ghost" onclick="closeModal()">Cancel</button><button class="btn" onclick="submitRequest()">Submit Request</button></div></div>`);
  renderReqLines();
}
function addReqItem(){
  const code=val('rqi-code'), qty=numVal('rqi-qty'); if(!code||qty<=0) return toast('Pick a material and quantity');
  const ex=reqDraftItems.find(i=>i.code===code); if(ex) ex.qty+=qty; else reqDraftItems.push({code,qty});
  (document.getElementById('rqi-qty') as HTMLInputElement).value=''; renderReqLines();
}
function removeReqItem(code:string){ reqDraftItems=reqDraftItems.filter(i=>i.code!==code); renderReqLines(); }
function renderReqLines(){
  const el=document.getElementById('req-lines'); if(!el) return;
  if(!reqDraftItems.length){ el.innerHTML=`<div class="draft-empty">No items added yet</div>`; return; }
  el.innerHTML=`<table class="mv-table draft-tbl"><thead><tr><th>Material</th><th class="n">Qty</th><th class="n">At store now</th><th></th></tr></thead><tbody>
    ${reqDraftItems.map(i=>`<tr><td>${esc(matName(i.code))}</td><td class="n">${num(i.qty)} ${esc(matUnit(i.code))}</td><td class="n">${num(onHand(i.code,CENTRAL_ID()))}</td>
      <td class="row-act"><button class="ic-btn" onclick="removeReqItem('${jsid(i.code)}')">${svg(IC.trash,15)}</button></td></tr>`).join('')}</tbody></table>`;
}
function submitRequest(){
  if(!reqDraftItems.length) return toast('Add at least one material');
  const r:MaterialRequest={ id:nextId('REQ-','requests','id'), requestedBy:val('rq-by')||me(), txnDate:val('rq-date')||nowDate(),
    remarks:val('rq-remarks'), status:'PENDING', items:clone(reqDraftItems), createdAt:nowStamp() };
  state.requests.push(r); reqDraftItems=[]; save(); closeModal(); go('requests'); toast('Request '+r.id+' sent to Head Office for approval');
}

/* ---- store: review request ---- */
function openReviewRequest(id:string){
  const r=state.requests.find(x=>x.id===id); if(!r) return;
  const rows=r.items.map(it=>{ const cur=onHand(it.code,CENTRAL_ID());
    return `<tr data-code="${esc(it.code)}"><td class="n b">${esc(it.code)}</td><td>${esc(matName(it.code))}</td>
      <td class="n">${num(cur)}</td><td class="n">${num(it.qty)} ${esc(matUnit(it.code))}</td>
      <td><input class="f rq-appr" type="number" min="0" value="${it.qty}" style="width:90px;padding:6px 8px"></td></tr>`; }).join('');
  openModal(`<div class="modal wide">${mh(IC.requests,'Review Request · '+esc(r.id),'From '+esc(r.requestedBy)+' · '+esc(r.txnDate))}
    <div class="m-body">
      ${r.remarks?`<div class="src-note">Reason: ${esc(r.remarks)}</div>`:''}
      <table class="mv-table"><thead><tr><th>Code</th><th>Material</th><th class="n">At store now</th><th class="n">Requested</th><th>Approve Qty</th></tr></thead><tbody>${rows}</tbody></table>
      <div class="hint" style="margin-top:12px">${svg(IC.alert,14)} Approving dispatches the approved quantity to the storekeeper in one step. It goes into transit; their stock rises only after they confirm receipt. You can change the quantity before approving.</div>
      <div class="fld" style="margin-top:6px"><label>Note (optional)</label><input class="f" id="rv-note" placeholder="Approved — balance after next purchase…"></div>
    </div>
    <div class="m-foot"><button class="btn ghost" onclick="closeModal()">Cancel</button><button class="btn danger" onclick="rejectRequest('${jsid(r.id)}')">Reject</button><button class="btn" onclick="approveRequest('${jsid(r.id)}')">${svg(IC.check)} Approve &amp; Send Back</button></div></div>`);
}
function rejectRequest(id:string){
  const r=state.requests.find(x=>x.id===id); if(!r) return;
  r.status='REJECTED'; r.reviewedBy=me(); r.reviewedAt=nowStamp(); r.reviewNote=val('rv-note');
  save(); closeModal(); renderSidebar(); renderView(); toast('Request '+r.id+' rejected');
}
function approveRequest(id:string){
  const r=state.requests.find(x=>x.id===id); if(!r) return;
  const trs=document.querySelectorAll('#layer tr[data-code]'); let total=0; const items:TransferItem[]=[];
  for(const tr of Array.from(trs)){
    const code=(tr as HTMLElement).dataset.code!; const appr=Number((tr.querySelector('.rq-appr') as HTMLInputElement).value)||0;
    const it=r.items.find(x=>x.code===code); if(it) it.approvedQty=appr;
    if(appr>0){ items.push({code,qty:appr}); total+=appr; }
  }
  if(total<=0) return toast('Approve at least one quantity (or Reject)');
  // Approve & Send in one step: Purchase Manager (office) dispatches the approved
  // materials to the storekeeper. Office procures any shortfall, then the goods go
  // into transit; the storekeeper's stock rises only after they confirm receipt.
  const from=CENTRAL_ID(), to=SITE_ID();
  const t:Transfer={ id:nextId('TR-','transfers','id'), docType:'DC', docNo:r.id.replace('REQ-','REQ'), txnDate:nowDate(),
    from, to, remarks:'Approved from request '+r.id, status:'DRAFT', items:clone(items), createdBy:me(), createdAt:nowStamp() };
  for(const it of items){ const avail=onHand(it.code,from); if(it.qty>avail) addMovement({code:it.code,qty:it.qty-avail,from:'PURCHASE',to:from,type:'PURCHASE',ref:'HO procure '+r.id,person:me()}); }
  for(const it of items){ addMovement({code:it.code,qty:it.qty,from,to:'TRANSIT',type:'DISPATCH',ref:t.id,txnDate:t.txnDate,person:me()}); }
  t.status='PENDING'; t.dispatchedBy=me(); t.dispatchedAt=nowStamp();
  state.transfers.push(t);
  r.status='APPROVED'; r.reviewedBy=me(); r.reviewedAt=nowStamp(); r.reviewNote=val('rv-note'); r.transferId=t.id;
  save(); closeModal(); renderSidebar(); renderView(); toast('Approved & sent — '+num(total)+' units dispatched to '+locName(to)+' ('+t.id+'). Awaiting the storekeeper’s receipt.');
}

/* ===========================================================
   MATERIAL TRANSFERS
   =========================================================== */
function transfersHTML(){
  const list=state.transfers.slice().sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
  const rows=list.length?list.map(t=>{ const st=transferStatus(t);
    return `<tr onclick="openTransfer('${jsid(t.id)}')" style="cursor:pointer">
      <td class="n b">${esc(t.id)}</td><td>${esc(t.docType)}-${esc(t.docNo)}</td><td>${esc(t.txnDate)}</td>
      <td>${esc(locName(t.from))} → ${esc(locName(t.to))}</td>
      <td class="n">${t.items.length}</td><td class="n">${num(transferDispatched(t))}</td>
      <td>${statusChip(st)}</td></tr>`; }).join('')
    :`<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:28px">No transfers yet</td></tr>`;
  return `${pageTop('Material Transfers','Dispatches from the office to the storekeeper. Most are created automatically when the Purchase Manager approves a request; site stock updates only after the storekeeper confirms receipt.', canSend()?`<button class="btn" onclick="openTransferForm()">${svg(IC.plus)} New Transfer</button>`:'')}
  <div class="panel"><table><thead><tr><th>Transfer</th><th>DC / MTN</th><th>Date</th><th>Route</th><th class="n">Items</th><th class="n">Qty</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}
// Material Transfers screen was removed (single-site pilot). Opening a delivery now
// lands on the Receipt Confirmation page, where the storekeeper receives & checks it.
function openTransfer(id:string){ openReceipt(id); }

function transferDetailHTML(id:string){
  const t=state.transfers.find(x=>x.id===id); if(!t) return empty(IC.transfers,'Transfer not found');
  const st=transferStatus(t);
  const canDispatch=st==='DRAFT'&&canSend();
  const canCancel=st==='DRAFT'&&canSend();
  const canReceive=(st==='PENDING'||st==='PARTIAL')&&isReceiver();   // storekeeper edits receipt inline
  const canResend=canSend()&&['PENDING','PARTIAL','RECEIVED','CLOSED'].includes(st);
  const actions=`<button class="btn ghost" onclick="go('transfers')">${svg(IC.arrow)} Back</button>
    ${canCancel?`<button class="btn ghost" onclick="cancelTransfer('${jsid(t.id)}')">Cancel Draft</button>`:''}
    ${canResend?`<button class="btn ghost" onclick="openResend('${jsid(t.id)}')">${svg(IC.transfers)} Resend / Replace</button>`:''}
    ${canDispatch?`<button class="btn" onclick="dispatchTransfer('${jsid(t.id)}')">${svg(IC.truck)} Confirm Dispatch</button>`:''}`;
  const meta=`<div class="detail-meta">
    <div><span>Status</span>${statusChip(st)}</div>
    <div><span>Document</span><b>${esc(t.docType)}-${esc(t.docNo)}</b></div>
    <div><span>Transfer Date</span><b>${esc(t.txnDate)}</b></div>
    <div><span>Created</span><b>${esc(t.createdBy)} · ${esc(t.createdAt)}</b></div>
    ${t.dispatchedAt?`<div><span>Dispatched</span><b>${esc(t.dispatchedBy)} · ${esc(t.dispatchedAt)}</b></div>`:''}
  </div>`;
  const head=pageTop('Transfer '+esc(t.id),esc(t.docType)+'-'+esc(t.docNo)+' · '+esc(locName(t.from))+' → '+esc(locName(t.to)), actions);

  if(canReceive){
    // editable receipt entry, inline on this page
    const erows=t.items.map(it=>{ const out=Math.max(0,itemOutstanding(t,it.code)); if(out<=0) return '';
      return `<tr data-code="${esc(it.code)}">
        <td class="n b">${esc(it.code)}</td><td>${esc(matName(it.code))}</td>
        <td class="n">${num(out)} ${esc(matUnit(it.code))}</td>
        <td><input class="f rc-in" data-f="accepted" type="number" min="0" max="${out}" value="${out}"></td>
        <td><input class="f rc-in" data-f="damaged" type="number" min="0" value="0"></td>
        <td><input class="f rc-in" data-f="short" type="number" min="0" value="0"></td>
        <td><input class="f rc-in rc-need" data-f="needmore" type="number" min="0" value="0"></td></tr>`; }).join('');
    return `${head}${meta}
    <div class="hint">${svg(IC.alert,14)} Enter what actually arrived, directly here. <b>Accepted</b> adds to your stock. <b>Damaged</b> is logged separately. <b>Short</b> stays in transit until resolved (Accepted + Damaged + Short ≤ Outstanding). <b>Need More</b> is noted on the receipt as a follow-up.</div>
    <div class="panel pad"><div class="panel-h"><b>Confirm Receipt — Line Items</b></div>
      <table class="mv-table rc-tbl"><thead><tr><th>Code</th><th>Material</th><th class="n">Outstanding</th><th>Accepted</th><th>Damaged</th><th>Short</th><th>Need More</th></tr></thead><tbody>${erows}</tbody></table>
      <div class="grid2" style="margin-top:14px">
        <div class="fld"><label>Receipt Date</label><input class="f" id="rc-date" type="date" value="${nowDate()}"></div>
        <div class="fld"><label>Received By</label><input class="f" id="rc-by" value="${esc(me())}"></div>
        <div class="fld col2"><label>Remarks</label><input class="f" id="rc-remarks" placeholder="Condition, discrepancy notes…"></div>
      </div>
      <div class="m-foot" style="border:0;padding:0"><button class="btn" onclick="submitReceipt('${jsid(t.id)}')">${svg(IC.check)} Submit Receipt Confirmation</button></div>
    </div>
    ${receiptsPanel(t)}`;
  }

  // read-only view (store, or already completed)
  const rows=t.items.map(it=>{
    const acc=itemAccepted(t.id,it.code), dmg=itemDamaged(t.id,it.code), out=Math.max(0,itemOutstanding(t,it.code));
    return `<tr><td class="n b">${esc(it.code)}</td><td>${esc(matName(it.code))}</td><td class="n">${num(it.qty)} ${esc(matUnit(it.code))}</td>
      <td class="n">${num(acc)}</td><td class="n">${dmg?`<span style="color:var(--red)">${num(dmg)}</span>`:'0'}</td><td class="n">${out?`<span style="color:var(--amber,#d97706)">${num(out)}</span>`:'0'}</td></tr>`;
  }).join('');
  const totDmg=t.items.reduce((s,it)=>s+itemDamaged(t.id,it.code),0);
  return `${head}${meta}
  <div class="panel pad"><div class="panel-h"><b>Line Items</b></div>
    <table class="mv-table"><thead><tr><th>Code</th><th>Material</th><th class="n">Dispatched</th><th class="n">Accepted</th><th class="n">Damaged</th><th class="n">Outstanding</th></tr></thead><tbody>${rows}</tbody></table>
    ${t.remarks?`<div class="rmk">Remarks: ${esc(t.remarks)}</div>`:''}
    ${totDmg>0?`<div class="note-row">${svg(IC.alert,15)} ${num(totDmg)} unit(s) recorded as damaged (logged as loss, not added to site stock).${isStore()?' Use <b>Resend / Replace</b> above to re-dispatch.':''}</div>`:''}
  </div>
  ${receiptsPanel(t)}`;
}

/* ---- resend / replace: re-dispatch quantities (e.g. damaged) as a new transfer ---- */
function openResend(id:string){
  const t=state.transfers.find(x=>x.id===id); if(!t) return;
  const rows=t.items.map(it=>{ const dmg=itemDamaged(t.id,it.code); const avail=onHand(it.code,CENTRAL_ID());
    return `<tr data-code="${esc(it.code)}"><td class="n b">${esc(it.code)}</td><td>${esc(matName(it.code))}</td>
      <td class="n">${dmg?`<span style="color:var(--red)">${num(dmg)}</span>`:'0'}</td><td class="n">${num(avail)}</td>
      <td><input class="f rs-qty" type="number" min="0" max="${avail}" value="${Math.min(dmg,avail)}" style="width:90px;padding:6px 8px"></td></tr>`; }).join('');
  openModal(`<div class="modal wide">${mh(IC.transfers,'Resend / Replace · '+esc(t.id),'Re-dispatch quantities to '+esc(locName(t.to)))}
    <div class="m-body">
      <div class="hint">${svg(IC.alert,14)} Enter how much to resend for each material (defaults to the damaged quantity). This creates a new draft transfer you then dispatch. Set 0 to skip a material.</div>
      <table class="mv-table"><thead><tr><th>Code</th><th>Material</th><th class="n">Damaged</th><th class="n">Store Stock</th><th>Resend Qty</th></tr></thead><tbody>${rows}</tbody></table>
    </div>
    <div class="m-foot"><button class="btn ghost" onclick="closeModal()">Cancel</button><button class="btn" onclick="submitResend('${jsid(t.id)}')">${svg(IC.truck)} Create Replacement Transfer</button></div></div>`);
}
function submitResend(id:string){
  const t=state.transfers.find(x=>x.id===id); if(!t) return;
  const trs=document.querySelectorAll('#layer tr[data-code]'); const items:TransferItem[]=[];
  for(const tr of Array.from(trs)){
    const code=(tr as HTMLElement).dataset.code!; const q=Number((tr.querySelector('.rs-qty') as HTMLInputElement).value)||0;
    if(q<=0) continue; const avail=onHand(code,CENTRAL_ID());
    if(q>avail) return toast(`${code}: resend ${num(q)} exceeds store stock ${num(avail)}`);
    items.push({code,qty:q});
  }
  if(!items.length) return toast('Enter a resend quantity for at least one material');
  const nt:Transfer={ id:nextId('TR-','transfers','id'), docType:t.docType, docNo:t.docNo+'-R', txnDate:nowDate(),
    from:CENTRAL_ID(), to:t.to, remarks:'Replacement for '+t.id, status:'DRAFT', items:clone(items),
    createdBy:me(), createdAt:nowStamp() };
  state.transfers.push(nt); save(); closeModal(); openTransfer(nt.id); toast('Replacement draft '+nt.id+' created — ready to dispatch');
}
function receiptsPanel(t:Transfer){
  const rs=trReceipts(t.id); if(!rs.length) return '';
  return `<div class="panel pad" style="margin-top:16px"><div class="panel-h"><b>Receipts</b></div>
    ${rs.map(r=>`<div class="rcpt">
      <div class="rcpt-h"><b>${esc(r.receiptNo)}</b> · ${esc(r.receivedBy)} · ${esc(r.confirmedAt)}</div>
      <table class="mv-table"><thead><tr><th>Material</th><th class="n">Accepted</th><th class="n">Damaged</th><th class="n">Short</th></tr></thead>
      <tbody>${r.items.map(i=>`<tr><td>${esc(matName(i.code))}</td><td class="n">${num(i.accepted)}</td><td class="n">${num(i.damaged)}</td><td class="n">${num(i.short)}</td></tr>`).join('')}</tbody></table>
      ${r.remarks?`<div class="rmk">${esc(r.remarks)}</div>`:''}</div>`).join('')}</div>`;
}

/* ---- transfer create (multi-item draft) ---- */
function openTransferForm(){
  draftItems=[];
  const c=central(), s=sites()[0];
  openModal(`<div class="modal wide">${mh(IC.transfers,'New Material Transfer','Create a dispatch document from the Central Store')}
    <div class="m-body">
      <div class="grid2">
        <div class="fld"><label>Document Type <span class="req">*</span></label><select class="f" id="t-doctype"><option value="DC">DC (Delivery Challan)</option><option value="MTN">MTN</option></select></div>
        <div class="fld"><label>DC / MTN Number <span class="req">*</span></label><input class="f" id="t-docno" placeholder="e.g. 001"></div>
        <div class="fld"><label>Transfer Date <span class="req">*</span></label><input class="f" id="t-date" type="date" value="${nowDate()}"></div>
        <div class="fld"><label>Destination</label><input class="f" id="t-to" value="${esc(sites()[0]?sites()[0].name:'Site')}" disabled></div>
        <div class="fld col2"><label>Remarks</label><input class="f" id="t-remarks" placeholder="Site requirement…"></div>
      </div>
      <div class="src-note">Source: <b>${esc(c?c.name:'')}</b></div>
      <div class="line-add">
        <select class="f" id="li-code">${state.materials.filter(m=>m.active).map(m=>`<option value="${m.code}">${esc(m.code)} — ${esc(m.name)}</option>`).join('')}</select>
        <input class="f" id="li-qty" type="number" min="0" placeholder="Qty">
        <button class="btn ghost" onclick="addDraftItem()">${svg(IC.plus)} Add</button>
      </div>
      <div id="draft-lines"></div>
    </div>
    <div class="m-foot"><button class="btn ghost" onclick="closeModal()">Cancel</button><button class="btn" onclick="saveTransfer()">Create Draft</button></div></div>`);
  renderDraftLines();
}
function addDraftItem(){
  const code=val('li-code'), qty=numVal('li-qty');
  if(!code||qty<=0) return toast('Pick a material and quantity');
  const avail=onHand(code,CENTRAL_ID());
  const already=draftItems.filter(i=>i.code===code).reduce((s,i)=>s+i.qty,0);
  if(qty+already>avail) return toast(`Only ${num(avail)} ${matUnit(code)} available at the store`);
  const ex=draftItems.find(i=>i.code===code); if(ex) ex.qty+=qty; else draftItems.push({code,qty});
  (document.getElementById('li-qty') as HTMLInputElement).value='';
  renderDraftLines();
}
function removeDraftItem(code:string){ draftItems=draftItems.filter(i=>i.code!==code); renderDraftLines(); }
function renderDraftLines(){
  const el=document.getElementById('draft-lines'); if(!el) return;
  if(!draftItems.length){ el.innerHTML=`<div class="draft-empty">No items added yet</div>`; return; }
  el.innerHTML=`<table class="mv-table draft-tbl"><thead><tr><th>Material</th><th class="n">Qty</th><th class="n">Store avail.</th><th></th></tr></thead><tbody>
    ${draftItems.map(i=>`<tr><td>${esc(matName(i.code))}</td><td class="n">${num(i.qty)} ${esc(matUnit(i.code))}</td><td class="n">${num(onHand(i.code,CENTRAL_ID()))}</td>
      <td class="row-act"><button class="ic-btn" onclick="removeDraftItem('${jsid(i.code)}')">${svg(IC.trash,15)}</button></td></tr>`).join('')}</tbody></table>`;
}
function saveTransfer(){
  const docNo=val('t-docno'); if(!docNo) return toast('Enter the DC / MTN number');
  if(!draftItems.length) return toast('Add at least one material');
  const docType=val('t-doctype') as DocType, to=SITE_ID();
  const dup=state.transfers.find(t=>t.docType===docType&&t.docNo===docNo&&t.status!=='CANCELLED');
  if(dup) return toast(`${docType}-${docNo} already exists (${dup.id})`);
  const from=CENTRAL_ID();
  if(from===to) return toast('Source and destination must differ');
  const t:Transfer={ id:nextId('TR-','transfers','id'), docType, docNo, txnDate:val('t-date')||nowDate(), from, to,
    remarks:val('t-remarks'), status:'DRAFT', items:clone(draftItems), createdBy:me(), createdAt:nowStamp() };
  state.transfers.push(t); draftItems=[]; save(); closeModal(); openTransfer(t.id); toast('Draft '+t.id+' created');
}
function dispatchTransfer(id:string){
  const t=state.transfers.find(x=>x.id===id); if(!t||t.status!=='DRAFT') return;
  for(const it of t.items){ const avail=onHand(it.code,t.from); if(it.qty>avail) return toast(`Insufficient stock for ${it.code}: need ${num(it.qty)}, have ${num(avail)}`); }
  for(const it of t.items) addMovement({code:it.code,qty:it.qty,from:t.from,to:'TRANSIT',type:'DISPATCH',ref:t.id,txnDate:t.txnDate});
  t.status='PENDING'; t.dispatchedBy=me(); t.dispatchedAt=nowStamp();
  save(); renderView(); renderSidebar(); toast('Dispatched — '+num(transferDispatched(t))+' units now in transit');
}
function cancelTransfer(id:string){
  const t=state.transfers.find(x=>x.id===id); if(!t||t.status!=='DRAFT') return;
  t.status='CANCELLED'; save(); go('transfers'); toast('Draft cancelled');
}

/* ===========================================================
   RECEIPT CONFIRMATION
   =========================================================== */
function receiptsHTML(){
  const pend=state.transfers.filter(t=>['PENDING','PARTIAL'].includes(transferStatus(t)));
  const done=state.transfers.filter(t=>transferStatus(t)==='CLOSED').slice(-8).reverse();
  const row=(t:Transfer)=>{ const st=transferStatus(t);
    return `<tr onclick="openTransfer('${jsid(t.id)}')" style="cursor:pointer">
      <td class="n b">${esc(t.id)}</td><td>${esc(t.docType)}-${esc(t.docNo)}</td><td>${esc(locName(t.from))} → ${esc(locName(t.to))}</td>
      <td class="n">${num(transferOutstanding(t))}</td><td>${statusChip(st)}</td>
      <td class="row-act">${isReceiver()?`<button class="btn sm" onclick="event.stopPropagation();openReceipt('${jsid(t.id)}')">Confirm</button>`:'<span style="color:var(--muted);font-size:12px">Storekeeper action</span>'}</td></tr>`; };
  return `${pageTop('Receipt Confirmation','The storekeeper confirms what actually arrived from the office. Site stock rises only by the accepted quantity; damage is logged separately.')}
  <div class="panel pad"><div class="panel-h"><b>Pending & Partial</b> <span class="count">${pend.length}</span></div>
    <table class="mv-table"><thead><tr><th>Delivery</th><th>Document</th><th>Route</th><th class="n">In Transit</th><th>Status</th><th></th></tr></thead>
    <tbody>${pend.length?pend.map(row).join(''):`<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:24px">Nothing awaiting receipt</td></tr>`}</tbody></table></div>
  ${done.length?`<div class="panel pad" style="margin-top:16px"><div class="panel-h"><b>Recently Completed</b></div>
    <table class="mv-table"><thead><tr><th>Delivery</th><th>Document</th><th>Route</th><th class="n">Qty</th><th>Status</th><th></th></tr></thead><tbody>${done.map(row).join('')}</tbody></table></div>`:''}`;
}
function openReceipt(id:string){ curTransfer=id; view='receipts'; renderSidebar(); renderView(); window.scrollTo(0,0); }

function receiptConfirmHTML(id:string){
  const t=state.transfers.find(x=>x.id===id); if(!t) return empty(IC.receipts,'Transfer not found');
  const rows=t.items.map(it=>{ const out=Math.max(0,itemOutstanding(t,it.code)); if(out<=0) return '';
    return `<tr data-code="${esc(it.code)}">
      <td class="n b">${esc(it.code)}</td><td>${esc(matName(it.code))}</td>
      <td class="n">${num(out)} ${esc(matUnit(it.code))}</td>
      <td><input class="f rc-in" data-f="accepted" type="number" min="0" max="${out}" value="${out}"></td>
      <td><input class="f rc-in" data-f="damaged" type="number" min="0" value="0"></td>
      <td><input class="f rc-in" data-f="short" type="number" min="0" value="0"></td>
      <td><input class="f rc-in rc-need" data-f="needmore" type="number" min="0" value="0" placeholder="0"></td></tr>`; }).join('');
  return `${pageTop('Confirm Receipt · '+esc(t.id),esc(t.docType)+'-'+esc(t.docNo)+' from '+esc(locName(t.from)),
    `<button class="btn ghost" onclick="go('receipts')">${svg(IC.arrow)} Back</button>`)}
  <div class="hint">${svg(IC.alert,14)} Enter what actually arrived. <b>Accepted</b> adds to your stock. <b>Damaged</b> is logged separately. <b>Short</b> stays in transit until resolved (Accepted + Damaged + Short ≤ Outstanding). <b>Need More</b> is noted on the receipt as a follow-up.</div>
  <div class="panel pad"><table class="mv-table rc-tbl"><thead><tr><th>Code</th><th>Material</th><th class="n">Outstanding</th><th>Accepted</th><th>Damaged</th><th>Short</th><th>Need More</th></tr></thead><tbody>${rows||'<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:20px">Nothing outstanding</td></tr>'}</tbody></table>
    <div class="grid2" style="margin-top:14px">
      <div class="fld"><label>Receipt Date</label><input class="f" id="rc-date" type="date" value="${nowDate()}"></div>
      <div class="fld"><label>Received By</label><input class="f" id="rc-by" value="${esc(me())}"></div>
      <div class="fld col2"><label>Remarks</label><input class="f" id="rc-remarks" placeholder="Condition, discrepancy notes…"></div>
    </div>
    <div class="m-foot" style="border:0;padding:0"><button class="btn" onclick="submitReceipt('${jsid(t.id)}')">${svg(IC.check)} Submit Receipt Confirmation</button></div>
  </div>`;
}
function submitReceipt(id:string){
  const t=state.transfers.find(x=>x.id===id); if(!t) return;
  const items:ReceiptItem[]=[]; let total=0; const needMore:RequestItem[]=[];
  const trs=document.querySelectorAll('#app tr[data-code]');
  for(const tr of Array.from(trs)){
    const code=(tr as HTMLElement).dataset.code!;
    const get=(f:string)=>Number((tr.querySelector(`[data-f="${f}"]`) as HTMLInputElement).value)||0;
    const accepted=get('accepted'), damaged=get('damaged'), short=get('short'), need=get('needmore');
    if(need>0) needMore.push({code,qty:need});
    const out=Math.max(0,itemOutstanding(t,code));
    if(accepted+damaged+short>out+1e-9) return toast(`${code}: received exceeds outstanding (${num(out)})`);
    if(accepted+damaged+short<=0) continue;
    items.push({code,accepted,damaged,short}); total+=accepted+damaged+short;
  }
  if(!items.length && !needMore.length) return toast('Enter a received quantity or a Need More quantity');
  const needTxt=needMore.map(i=>matName(i.code)+' '+num(i.qty)).join(', ');
  const fullRemark=[val('rc-remarks'), needMore.length?('Need more: '+needTxt):''].filter(Boolean).join(' · ');
  const r:Receipt={ id:nextId('RC-','receipts','id'), transferId:t.id, receiptNo:'GRN-'+String(state.receipts.length+1).padStart(4,'0'),
    receivedBy:val('rc-by')||me(), txnDate:val('rc-date')||nowDate(), confirmedAt:nowStamp(), remarks:fullRemark, items };
  state.receipts.push(r);
  for(const it of items){
    if(it.accepted>0) addMovement({code:it.code,qty:it.accepted,from:'TRANSIT',to:t.to,type:'RECEIPT',ref:t.id,txnDate:r.txnDate,person:r.receivedBy});
    if(it.damaged>0)  addMovement({code:it.code,qty:it.damaged, from:'TRANSIT',to:'DAMAGED',type:'DAMAGE',ref:t.id,txnDate:r.txnDate,person:r.receivedBy});
    // short: no ledger move — stays in TRANSIT as outstanding until resolved
  }
  save();
  const st=transferStatus(t);
  if(st!=='CLOSED' && transferOutstanding(t)>0){ curTransfer=t.id; view='transfers'; renderSidebar(); renderView(); openResolvePrompt(t.id); }
  else { go('receipts'); }
  toast(items.length?('Receipt confirmed — '+num(total)+' units processed'+(needMore.length?'. "Need more" noted for the storekeeper':'')):'“Need more” note sent to the storekeeper');
}
/** Raise a fresh Material Request to the store for extra quantity the site needs. */
function raiseNeedMore(t:Transfer, needMore:RequestItem[], silent=false){
  const r:MaterialRequest={ id:nextId('REQ-','requests','id'), requestedBy:me(), txnDate:nowDate(),
    remarks:'Additional requirement raised at receipt of '+t.id+(val('rc-remarks')?(' — '+val('rc-remarks')):''),
    status:'PENDING', items:clone(needMore), createdAt:nowStamp() };
  state.requests.push(r);
  if(!silent){ save(); toast('Request '+r.id+' raised to the store for '+needMore.length+' item(s)'); }
}
/* ---- discrepancy resolution for leftover in-transit ---- */
function openResolvePrompt(id:string){
  const t=state.transfers.find(x=>x.id===id); if(!t) return; const out=transferOutstanding(t); if(out<=0) return;
  const rows=t.items.map(it=>{ const o=Math.max(0,itemOutstanding(t,it.code)); if(o<=0) return '';
    return `<tr data-code="${esc(it.code)}"><td>${esc(matName(it.code))}</td><td class="n">${num(o)} ${esc(matUnit(it.code))}</td>
      <td><select class="f rs-act"><option value="keep">Keep in transit</option><option value="loss">Write off (verified loss)</option><option value="return">Returned to store</option></select></td></tr>`; }).join('');
  openModal(`<div class="modal">${mh(IC.alert,'Unresolved Quantity',num(out)+' unit(s) still in transit — choose a disposition')}
    <div class="m-body"><table class="mv-table"><thead><tr><th>Material</th><th class="n">Outstanding</th><th>Action</th></tr></thead><tbody>${rows}</tbody></table>
    <div class="fld" style="margin-top:12px"><label>Reason</label><input class="f" id="rs-reason" placeholder="Short supply confirmed with driver…"></div></div>
    <div class="m-foot"><button class="btn ghost" onclick="closeModal()">Decide Later</button><button class="btn" onclick="submitResolve('${jsid(t.id)}')">Apply</button></div></div>`);
}
function submitResolve(id:string){
  const t=state.transfers.find(x=>x.id===id); if(!t) return; const reason=val('rs-reason')||'Discrepancy resolution';
  const trs=document.querySelectorAll('#layer tr[data-code]'); let n=0;
  for(const tr of Array.from(trs)){
    const code=(tr as HTMLElement).dataset.code!; const act=(tr.querySelector('.rs-act') as HTMLSelectElement).value;
    const out=Math.max(0,itemOutstanding(t,code)); if(out<=0||act==='keep') continue;
    if(act==='loss') addMovement({code,qty:out,from:'TRANSIT',to:'LOSS',type:'SHORT',ref:t.id,txnDate:nowDate(),person:me()});
    if(act==='return') addMovement({code,qty:out,from:'TRANSIT',to:t.from,type:'SHORT',ref:t.id,txnDate:nowDate(),person:me()});
    n++;
  }
  save(); closeModal(); renderView(); renderSidebar(); toast(n?'Discrepancy resolved':'Kept in transit');
}

function openingOf(code:string,locId:string){
  // day-1 opening balance = sum of OPENING ledger entries into this location
  return state.movements.filter(m=>m.code===code && m.type==='OPEN' && m.to===locId).reduce((s,m)=>s+m.qty,0);
}
/** The most recent movement (signed) for a material at a location — updates every transfer/receipt. */
function lastMove(code:string, locId:string): {q:number; d:string; ref:string}|null {
  for(let i=state.movements.length-1;i>=0;i--){ const m=state.movements[i];
    if(m.code!==code || m.type==='OPEN') continue;
    if(m.to===locId) return {q:m.qty, d:m.txnDate, ref:m.ref};
    if(m.from===locId) return {q:-m.qty, d:m.txnDate, ref:m.ref};
  }
  return null;
}

/* ===========================================================
   PAGE 1 — MASTER ITEMS (catalog + starting/opening quantity)
   =========================================================== */
function masterHTML(){
  const cId=CENTRAL_ID(), sId=SITE_ID(); const q=qFilter.toLowerCase();
  const cName=central()?central()!.name:'Central', sName=sites()[0]?sites()[0].name:'Site';
  const list=state.materials.filter(m=>!q||m.code.toLowerCase().includes(q)||m.name.toLowerCase().includes(q)||m.category.toLowerCase().includes(q));
  const rows=list.map(m=>{ const oc=openingOf(m.code,cId), os=openingOf(m.code,sId);
    return `<tr>
      <td class="n b">${esc(m.code)}</td><td>${esc(m.name)}</td><td>${esc(m.category)}</td><td>${esc(m.unit)}</td>
      <td class="n">${num(oc)}</td><td class="n">${num(os)}</td><td class="n b">${num(oc+os)}</td>
      <td>${m.active?'<span class="chip c-ok"><i></i>Active</span>':'<span class="chip c-out"><i></i>Inactive</span>'}</td>
      ${isStore()?`<td class="row-act">
        <button class="ic-btn" title="Edit item details" onclick="openMaterialForm('${jsid(m.code)}')">${svg(IC.edit,15)}</button>
        <button class="ic-btn" title="Set opening quantity" onclick="openSetOpening('${jsid(m.code)}')">${svg(IC.opening,15)}</button>
      </td>`:''}</tr>`;
  }).join('');
  const actions=isStore()?`<button class="btn ghost" onclick="openImport()">${svg(IC.upload)} Import Items</button><button class="btn ghost" onclick="openOpeningImport()">${svg(IC.upload)} Import Opening</button><button class="btn" onclick="openMaterialForm()">${svg(IC.plus)} Add Item</button>`:'';
  const colspan=isStore()?9:8;
  return `${pageTop('Master Items','The master list of all materials and their starting (opening) quantity. Add items and set opening stock here; day‑to‑day movement happens in Current Stock.', actions)}
  <div class="panel"><table><thead><tr>
    <th>Code</th><th>Material</th><th>Category</th><th>Unit</th>
    <th class="n">Opening · ${esc(cName)}</th><th class="n">Opening · ${esc(sName)}</th><th class="n">Opening Total</th><th>Status</th>${isStore()?'<th></th>':''}
  </tr></thead><tbody>${rows||`<tr><td colspan="${colspan}" style="text-align:center;color:var(--muted);padding:28px">No items found</td></tr>`}</tbody></table></div>
  <div class="hint">${svg(IC.alert,14)} These are the <b>starting</b> quantities (day 1). They don't change as transfers happen — the live, moving numbers are in <b>Current Stock</b>.</div>`;
}
function openSetOpening(code:string){
  const m=material(code)!; const cId=CENTRAL_ID(), sId=SITE_ID();
  openModal(`<div class="modal">${mh(IC.opening,'Set Opening Quantity','Starting (day‑1) balance for '+esc(m.name))}
    <div class="m-body"><div class="grid2">
      <div class="fld"><label>${esc(central()!.name)} — opening</label><input class="f" id="so-c" type="number" min="0" value="${openingOf(code,cId)}"></div>
      <div class="fld"><label>${esc(sites()[0].name)} — opening</label><input class="f" id="so-s" type="number" min="0" value="${openingOf(code,sId)}"></div>
      <div class="fld col2"><label>Opening date</label><input class="f" id="so-date" type="date" value="2026-11-01"></div>
    </div><div class="hint" style="margin:0">${svg(IC.alert,14)} This sets the master starting quantity. Current Stock shifts by the same amount; all later transfers still apply on top.</div></div>
    <div class="m-foot"><button class="btn ghost" onclick="closeModal()">Cancel</button><button class="btn" onclick="submitSetOpening('${jsid(code)}')">Save Opening</button></div></div>`);
}
function submitSetOpening(code:string){
  const c=numVal('so-c'), s=numVal('so-s'), date=val('so-date')||'2026-11-01';
  state.movements=state.movements.filter(m=>!(m.type==='OPEN'&&m.code===code));
  if(c>0) addMovement({code,qty:c,from:'OPENING',to:CENTRAL_ID(),type:'OPEN',ref:'Opening balance',txnDate:date});
  if(s>0) addMovement({code,qty:s,from:'OPENING',to:SITE_ID(),type:'OPEN',ref:'Opening balance',txnDate:date});
  save(); closeModal(); renderView(); toast('Opening quantity set for '+matName(code));
}

/* ===========================================================
   PAGE 2 — CURRENT STOCK (Initial → Movement → Current, live)
   =========================================================== */
function stockHTML(){
  const cId=CENTRAL_ID(), sId=SITE_ID(); const q=qFilter.toLowerCase();
  const cName=central()?central()!.name:'Central', sName=sites()[0]?sites()[0].name:'Site';
  const list=state.materials.filter(m=>!q||m.code.toLowerCase().includes(q)||m.name.toLowerCase().includes(q)||m.category.toLowerCase().includes(q));
  const moveCell=(mvObj:{q:number;d:string}|null)=>{ if(!mvObj) return '<span style="color:var(--muted)">—</span>';
    const col=mvObj.q>0?'var(--green)':(mvObj.q<0?'var(--red)':'var(--muted)');
    const sign=mvObj.q>0?'+':''; return `<span style="color:${col};font-weight:600">${sign}${num(mvObj.q)}</span><span class="mv-date">${esc(mvObj.d)}</span>`; };
  const rows=list.map(m=>{
    const ci=openingOf(m.code,cId), cc=onHand(m.code,cId); const cmv=lastMove(m.code,cId);
    const si=openingOf(m.code,sId), sc=onHand(m.code,sId); const smv=lastMove(m.code,sId);
    const tr=transitQty(m.code); const tot=cc+tr+sc;
    return `<tr>
      <td class="n b">${esc(m.code)}</td><td>${esc(m.name)}</td><td>${esc(m.unit)}</td>
      <td class="n" style="color:var(--muted)">${num(ci)}</td><td class="n">${moveCell(cmv)}</td><td class="n b">${num(cc)}</td>
      <td class="n">${tr?`<span style="color:var(--amber,#d97706)">${num(tr)}</span>`:'0'}</td>
      <td class="n" style="color:var(--muted)">${num(si)}</td><td class="n">${moveCell(smv)}</td><td class="n b">${num(sc)}</td>
      <td class="n b">${num(tot)}</td>
      ${isStore()?`<td class="row-act"><button class="ic-btn" title="Adjust stock" onclick="openAdjust('${jsid(m.code)}')">${svg(IC.opening,15)}</button></td>`:''}</tr>`;
  }).join('');
  const colspan=isStore()?12:11;
  return `${pageTop('Current Stock','Live balances — what each material started at, how much moved, and where it is now.', isStore()?`<button class="btn ghost" onclick="go('master')">${svg(IC.materials)} Master Items</button>`:'')}
  <div class="panel"><table><thead>
    <tr><th rowspan="2">Code</th><th rowspan="2">Material</th><th rowspan="2">Unit</th>
      <th colspan="3" class="grp">${esc(cName)}</th><th rowspan="2" class="n">In Transit</th>
      <th colspan="3" class="grp">${esc(sName)}</th><th rowspan="2" class="n">Total</th>${isStore()?'<th rowspan="2"></th>':''}</tr>
    <tr><th class="n">Initial</th><th class="n">Latest Move</th><th class="n">Current</th>
        <th class="n">Initial</th><th class="n">Latest Move</th><th class="n">Current</th></tr>
  </thead><tbody>${rows||`<tr><td colspan="${colspan}" style="text-align:center;color:var(--muted);padding:28px">No materials found</td></tr>`}</tbody></table></div>
  <div class="hint">${svg(IC.alert,14)} <b>Initial</b> = opening (from Master Items). <b>Latest Move</b> = the most recent transfer/receipt change — updates every time a transfer happens (− left the store, + arrived at site), with its date. <b>Current</b> = live balance now.</div>`;
}

/* ===========================================================
   LOSS REGISTER  (damaged, short, written-off)
   =========================================================== */
function lossMovements(){ return state.movements.filter(m=>m.to==='DAMAGED'||m.to==='LOSS'); }
function lossKind(m:Movement){ return m.type==='DAMAGE'?'Damaged':(m.type==='SHORT'?'Short / Lost in transit':'Adjustment write-off'); }
function lossLocation(m:Movement){ const t=state.transfers.find(x=>x.id===m.ref); return t?t.to:(m.from==='TRANSIT'?SITE_ID():m.from); }
function lossesHTML(){
  const q=qFilter.toLowerCase();
  const all=lossMovements().slice().reverse()
    .filter(m=>!q||m.code.toLowerCase().includes(q)||matName(m.code).toLowerCase().includes(q)||(m.ref||'').toLowerCase().includes(q));
  const totDamage=lossMovements().filter(m=>m.type==='DAMAGE').reduce((s,m)=>s+m.qty,0);
  const totShort=lossMovements().filter(m=>m.type==='SHORT').reduce((s,m)=>s+m.qty,0);
  const totAdj=lossMovements().filter(m=>m.type==='ADJUST').reduce((s,m)=>s+m.qty,0);
  const events=lossMovements().length;
  const trAffected=new Set(lossMovements().map(m=>m.ref).filter(r=>/^TR-/.test(r))).size;
  const kpis=`<div class="kpis">
    ${kpi('Damaged', num(totDamage), IC.alert)}
    ${kpi('Short / Lost', num(totShort), IC.truck)}
    ${kpi('Adjustment Loss', num(totAdj), IC.opening)}
    ${kpi('Loss Events', num(events), IC.losses)}
    ${kpi('Transfers Affected', num(trAffected), IC.transfers)}
  </div>`;
  // per-material summary
  const byMat:Record<string,number>={};
  for(const m of lossMovements()) byMat[m.code]=(byMat[m.code]||0)+m.qty;
  const matRows=Object.keys(byMat).sort((a,b)=>byMat[b]-byMat[a]).map(c=>`<tr><td class="n b">${esc(c)}</td><td>${esc(matName(c))}</td><td class="n">${num(byMat[c])} ${esc(matUnit(c))}</td></tr>`).join('');
  const rows=all.map(m=>`<tr>
    <td>${esc(m.txnDate)}</td>
    <td>${/^TR-/.test(m.ref)?`<a class="lnk" onclick="openTransfer('${jsid(m.ref)}')">${esc(m.ref)}</a>`:esc(m.ref||'—')}</td>
    <td class="n b">${esc(m.code)}</td><td>${esc(matName(m.code))}</td>
    <td class="n">${num(m.qty)} ${esc(matUnit(m.code))}</td>
    <td><span class="chip ${m.type==='DAMAGE'?'c-out':'c-low'}"><i></i>${lossKind(m)}</span></td>
    <td>${esc(locName(lossLocation(m)))}</td><td>${esc(m.person)}</td></tr>`).join('');
  return `${pageTop('Loss Register','Every damaged, short and written-off unit — what was lost, from which transfer, and where.')}
  ${kpis}
  <div class="dash-grid">
    <div class="panel pad"><div class="panel-h"><b>Loss Events</b> <span class="count">${all.length}</span></div>
      <table class="mv-table"><thead><tr><th>Date</th><th>Transfer</th><th>Code</th><th>Material</th><th class="n">Qty</th><th>Type</th><th>Location</th><th>By</th></tr></thead>
      <tbody>${rows||`<tr><td colspan="8" style="text-align:center;color:var(--muted);padding:26px">No losses recorded 🎉</td></tr>`}</tbody></table></div>
    <div class="panel pad"><div class="panel-h"><b>Loss by Material</b></div>
      <table class="mv-table"><thead><tr><th>Code</th><th>Material</th><th class="n">Total Lost</th></tr></thead>
      <tbody>${matRows||`<tr><td colspan="3" style="text-align:center;color:var(--muted);padding:20px">—</td></tr>`}</tbody></table></div>
  </div>`;
}

/* ===========================================================
   REPORTS — daily (1 day) & weekly (7 days) transfer report
   =========================================================== */
/* ---- Qualtech Engineers branding (used on reports) ---- */
const BRAND = {
  name:'Qualtech Engineers Pvt. Ltd.',
  tagline:'Engineering Excellence. Built to Last.',
  addr:'No.150, Tilak Street, Panneer Nagar, Mogappair West, Chennai – 600 037, INDIA',
  email:'qualtechjai@gmail.com',
  phone:'+91 044-26565206',
};
function brandLogo(size=44){
  return `<svg viewBox="0 0 48 48" style="width:${size}px;height:${size}px" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 2 L29 19 L46 24 L29 29 L24 46 L19 29 L2 24 L19 19 Z" fill="#e23b2e"/>
    <path d="M24 12 L26.5 21.5 L36 24 L26.5 26.5 L24 36 L21.5 26.5 L12 24 L21.5 21.5 Z" fill="#1b4f9b"/>
    <circle cx="24" cy="24" r="2.4" fill="#fff"/></svg>`;
}
function reportLetterhead(title:string){
  return `<div class="letterhead">
    <div class="lh-brand">${brandLogo(46)}<div><div class="lh-name">${esc(BRAND.name)}</div><div class="lh-tag">${esc(BRAND.tagline)}</div></div></div>
    <div class="lh-contact">${esc(BRAND.addr)}<br>${esc(BRAND.email)} · ${esc(BRAND.phone)}</div>
    <div class="lh-meta"><div class="lh-title">${esc(title)}</div><div class="lh-sub">${esc(session?session.title:ROLE_TITLE[role()])} view · Generated ${nowStamp()}</div></div>
  </div>`;
}
/** Sleek company brand strip shown at the top of every module. */
function brandBanner(){
  const c=central()?central()!.name:'Central Store', s=sites()[0]?sites()[0].name:'Site';
  return `<div class="brandbar">
    <div class="bb-left">
      ${brandLogo(34)}
      <b class="bb-ql">Qualtech<span>Engineers Pvt. Ltd.</span></b>
    </div>
    <div class="bb-right">
      <span class="bb-pill">${esc(c)} <span class="bb-arrow">→</span> ${esc(s)}</span>
      <span class="bb-pill soft">Phase 1 Pilot</span>
    </div>
  </div>`;
}
let repPeriod:'day'|'week'='week';
let repType:'transfers'|'losses'='transfers';
let repDate=nowDate();
function repShift(v:string){ repDate=v; renderView(); }
function repSetPeriod(p:'day'|'week'){ repPeriod=p; renderView(); }
function repSetType(t:'transfers'|'losses'){ repType=t; renderView(); }
function dateMinus(d:string, n:number){ const t=new Date(d+'T00:00:00'); t.setDate(t.getDate()-n); return t.toISOString().slice(0,10); }
function fmtRange(from:string,to:string){ return from===to?from:(from+' → '+to); }
const repSum=(arr:number[])=>arr.reduce((s,n)=>s+n,0);
function reportsHTML(){
  const to=repDate, from=repPeriod==='day'?repDate:dateMinus(repDate,6);
  const periodLabel=repPeriod==='day'?'Daily':'Weekly';
  const controls=`<div class="rep-controls no-print">
    <div class="seg"><button class="seg-b ${repType==='transfers'?'on':''}" onclick="repSetType('transfers')">Transfers</button><button class="seg-b ${repType==='losses'?'on':''}" onclick="repSetType('losses')">Losses</button></div>
    <div class="seg"><button class="seg-b ${repPeriod==='day'?'on':''}" onclick="repSetPeriod('day')">Daily (1 day)</button><button class="seg-b ${repPeriod==='week'?'on':''}" onclick="repSetPeriod('week')">Weekly (7 days)</button></div>
    <label class="rep-date">${repPeriod==='day'?'Date':'Week ending'} <input class="f" type="date" value="${repDate}" onchange="repShift(this.value)"></label>
    <button class="btn ghost" onclick="window.print()">${svg(IC.reports)} Print / PDF</button>
  </div>`;
  const kind=repType==='losses'?'Loss':'Material Transfer';
  const title=`${periodLabel} ${kind} Report — ${fmtRange(from,to)}`;
  const sub=repType==='losses'?(`${periodLabel} loss report · ${fmtRange(from,to)}`):(`${periodLabel} transfer report · ${fmtRange(from,to)}`);
  const body=repType==='losses'?reportLossBody(from,to):reportTransferBody(from,to);
  return `${pageTop('Reports', sub, '')}${controls}${reportLetterhead(title)}${body}`;
}
function reportTransferBody(from:string,to:string){
  const inRange=(d:string)=> d>=from && d<=to;
  const trs=state.transfers.filter(t=>t.status!=='CANCELLED' && inRange(t.txnDate)).sort((a,b)=>a.txnDate.localeCompare(b.txnDate));
  const rcs=state.receipts.filter(r=>inRange(r.txnDate));
  const dispatched=repSum(trs.map(transferDispatched));
  const accepted=repSum(rcs.flatMap(r=>r.items.map(i=>i.accepted)));
  const damaged=repSum(rcs.flatMap(r=>r.items.map(i=>i.damaged)));
  const short=repSum(rcs.flatMap(r=>r.items.map(i=>i.short)));
  const completed=trs.filter(t=>transferStatus(t)==='CLOSED').length;
  const pending=trs.filter(t=>['PENDING','PARTIAL'].includes(transferStatus(t))).length;
  const draft=trs.filter(t=>transferStatus(t)==='DRAFT').length;
  const kpis=`<div class="kpis">
    ${kpi('Transfers', num(trs.length), IC.transfers)}
    ${kpi('Dispatched Qty', num(dispatched), IC.truck)}
    ${kpi('Received (Accepted)', num(accepted), IC.receipts)}
    ${kpi('Damaged', num(damaged), IC.alert)}
    ${kpi('Short / Lost', num(short), IC.losses)}
    ${kpi('Completed', num(completed), IC.check)}
  </div>`;
  const rows=trs.length?trs.map(t=>{ const recQ=repSum(trReceipts(t.id).flatMap(r=>r.items.map(i=>i.accepted+i.damaged)));
    return `<tr onclick="openTransfer('${jsid(t.id)}')" style="cursor:pointer">
      <td>${esc(t.txnDate)}</td><td class="n b">${esc(t.id)}</td><td>${esc(t.docType)}-${esc(t.docNo)}</td>
      <td>${esc(locName(t.from))} → ${esc(locName(t.to))}</td>
      <td class="n">${t.items.length}</td><td class="n">${num(transferDispatched(t))}</td>
      <td class="n">${num(recQ)}</td><td>${statusChip(transferStatus(t))}</td><td>${esc(t.createdBy)}</td></tr>`; }).join('')
    :`<tr><td colspan="9" style="text-align:center;color:var(--muted);padding:26px">No transfers in this period</td></tr>`;
  return `${kpis}
  <div class="panel pad"><div class="panel-h"><b>Transfers</b> <span class="count">${trs.length}</span>
    <span style="margin-left:auto;font-size:12px;color:var(--muted)">Completed ${completed} · Pending ${pending} · Draft ${draft}</span></div>
    <table class="mv-table"><thead><tr><th>Date</th><th>Transfer</th><th>Document</th><th>Route</th><th class="n">Items</th><th class="n">Dispatched</th><th class="n">Received</th><th>Status</th><th>By</th></tr></thead>
    <tbody>${rows}</tbody></table></div>`;
}
function reportLossBody(from:string,to:string){
  const inRange=(d:string)=> d>=from && d<=to;
  const ev=lossMovements().filter(m=>inRange(m.txnDate)).slice().reverse();
  const totDamage=repSum(ev.filter(m=>m.type==='DAMAGE').map(m=>m.qty));
  const totShort=repSum(ev.filter(m=>m.type==='SHORT').map(m=>m.qty));
  const totAdj=repSum(ev.filter(m=>m.type==='ADJUST').map(m=>m.qty));
  const trAffected=new Set(ev.map(m=>m.ref).filter(r=>/^TR-/.test(r))).size;
  const kpis=`<div class="kpis">
    ${kpi('Damaged', num(totDamage), IC.alert)}
    ${kpi('Short / Lost', num(totShort), IC.truck)}
    ${kpi('Adjustment Loss', num(totAdj), IC.opening)}
    ${kpi('Loss Events', num(ev.length), IC.losses)}
    ${kpi('Transfers Affected', num(trAffected), IC.transfers)}
  </div>`;
  const byMat:Record<string,number>={}; for(const m of ev) byMat[m.code]=(byMat[m.code]||0)+m.qty;
  const matRows=Object.keys(byMat).sort((a,b)=>byMat[b]-byMat[a]).map(c=>`<tr><td class="n b">${esc(c)}</td><td>${esc(matName(c))}</td><td class="n">${num(byMat[c])} ${esc(matUnit(c))}</td></tr>`).join('');
  const rows=ev.length?ev.map(m=>`<tr>
    <td>${esc(m.txnDate)}</td>
    <td>${/^TR-/.test(m.ref)?`<a class="lnk" onclick="openTransfer('${jsid(m.ref)}')">${esc(m.ref)}</a>`:esc(m.ref||'—')}</td>
    <td class="n b">${esc(m.code)}</td><td>${esc(matName(m.code))}</td>
    <td class="n">${num(m.qty)} ${esc(matUnit(m.code))}</td>
    <td><span class="chip ${m.type==='DAMAGE'?'c-out':'c-low'}"><i></i>${lossKind(m)}</span></td>
    <td>${esc(locName(lossLocation(m)))}</td><td>${esc(m.person)}</td></tr>`).join('')
    :`<tr><td colspan="8" style="text-align:center;color:var(--muted);padding:26px">No losses in this period 🎉</td></tr>`;
  return `${kpis}
  <div class="dash-grid">
    <div class="panel pad"><div class="panel-h"><b>Loss Events</b> <span class="count">${ev.length}</span></div>
      <table class="mv-table"><thead><tr><th>Date</th><th>Transfer</th><th>Code</th><th>Material</th><th class="n">Qty</th><th>Type</th><th>Location</th><th>By</th></tr></thead><tbody>${rows}</tbody></table></div>
    <div class="panel pad"><div class="panel-h"><b>Loss by Material</b></div>
      <table class="mv-table"><thead><tr><th>Code</th><th>Material</th><th class="n">Total Lost</th></tr></thead><tbody>${matRows||`<tr><td colspan="3" style="text-align:center;color:var(--muted);padding:20px">—</td></tr>`}</tbody></table></div>
  </div>`;
}

/* ===========================================================
   MOVEMENT HISTORY
   =========================================================== */
function historyHTML(){
  const q=qFilter.toLowerCase();
  const mv=state.movements.slice().reverse().filter(m=>!q||m.code.toLowerCase().includes(q)||matName(m.code).toLowerCase().includes(q)||(m.ref||'').toLowerCase().includes(q));
  const TYPE_LABEL:Record<string,string>={OPEN:'Opening',DISPATCH:'Dispatch',RECEIPT:'Receipt',DAMAGE:'Damaged',SHORT:'Short/Loss',ADJUST:'Adjustment',PURCHASE:'HO Supply'};
  const rows=mv.slice(0,300).map(m=>`<tr>
    <td>${esc(m.txnDate)}</td><td style="color:var(--muted);font-size:11px">${esc(m.date)} ${esc(m.time)}</td>
    <td>${esc(m.ref||'—')}</td><td class="n b">${esc(m.code)}</td><td>${esc(matName(m.code))}</td>
    <td>${esc(locName(m.from))} → ${esc(locName(m.to))}</td><td class="n">${num(m.qty)}</td>
    <td><span class="chip c-normal"><i></i>${TYPE_LABEL[m.type]||m.type}</span></td><td>${esc(m.person)}</td></tr>`).join('');
  return `${pageTop('Movement History','Every stock movement, with actual transaction date and system entry timestamp recorded separately.')}
  <div class="panel"><table class="mv-table"><thead><tr><th>Txn Date</th><th>Entered</th><th>Reference</th><th>Code</th><th>Material</th><th>Movement</th><th class="n">Qty</th><th>Type</th><th>By</th></tr></thead>
  <tbody>${rows||`<tr><td colspan="9" style="text-align:center;color:var(--muted);padding:28px">No movements</td></tr>`}</tbody></table></div>`;
}

/* ===========================================================
   SETTINGS
   =========================================================== */
/* ===========================================================
   USER MANAGEMENT  (Purchase Manager / Head Office only)
   =========================================================== */
function siteNamesFor(u:AppUser){ if(u.allowedSites==='all') return 'All sites'; return store.workspaces.filter(w=>(u.allowedSites as string[]).includes(w.id)).map(w=>w.name).join(', ')||'—'; }
function usersHTML(){
  if(!canManageUsers()) return empty(IC.users,'Only the Purchase Manager (Head Office) can manage users.');
  const rows=(store.users||[]).map(u=>`<tr>
    <td class="n b">${esc(u.username)}</td><td>${esc(u.name)}</td>
    <td><span class="chip ${u.role==='purchase'?'c-use':u.role==='store'?'c-normal':'c-ok'}"><i></i>${esc(ROLE_TITLE[u.role])}</span></td>
    <td>${esc(siteNamesFor(u))}</td>
    <td class="row-act">
      <button class="ic-btn" title="Edit" onclick="openUserForm('${jsid(u.id)}')">${svg(IC.edit,15)}</button>
      ${u.id!==session!.userId?`<button class="ic-btn" title="Delete" onclick="deleteUser('${jsid(u.id)}')">${svg(IC.trash,15)}</button>`:''}
    </td></tr>`).join('');
  return `${pageTop('User Management','Create logins and control which sites each person can access.', `<button class="btn" onclick="openUserForm()">${svg(IC.plus)} Add User</button>`)}
  <div class="panel"><table><thead><tr><th>Username</th><th>Name</th><th>Role</th><th>Sites</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>
  <div class="hint">${svg(IC.alert,14)} <b>Purchase Manager</b> sees all sites and can approve requests. <b>Storekeeper</b> & <b>Site Manager</b> are limited to the sites you tick — a storekeeper can be given access to two or more sites.</div>`;
}
function openUserForm(id?:string){
  const u=id?(store.users||[]).find(x=>x.id===id):null;
  const chk=(wid:string)=>{ if(!u) return ''; if(u.allowedSites==='all') return 'checked'; return (u.allowedSites as string[]).includes(wid)?'checked':''; };
  const siteBoxes=store.workspaces.map(w=>`<label class="ck"><input type="checkbox" class="u-site" value="${esc(w.id)}" ${chk(w.id)}> ${esc(w.name)}</label>`).join('');
  openModal(`<div class="modal">${mh(IC.users, u?'Edit User':'Add User', u?'Update login & site access':'Create a new login')}
    <div class="m-body"><div class="grid2">
      <div class="fld"><label>Username <span class="req">*</span></label><input class="f" id="u-username" value="${esc(u?u.username:'')}" ${u?'disabled':''}></div>
      <div class="fld"><label>Password <span class="req">*</span></label><input class="f" id="u-password" value="${esc(u?u.password:'')}"></div>
      <div class="fld col2"><label>Full name <span class="req">*</span></label><input class="f" id="u-name" value="${esc(u?u.name:'')}"></div>
      <div class="fld col2"><label>Role</label><select class="f" id="u-role" onchange="userRoleChange()">
        <option value="purchase" ${u&&u.role==='purchase'?'selected':''}>Purchase Manager (Head Office — all sites)</option>
        <option value="store" ${!u||u.role==='store'?'selected':''}>Storekeeper (site store)</option>
        <option value="site" ${u&&u.role==='site'?'selected':''}>Site Manager</option>
      </select></div>
      <div class="fld col2" id="u-sites-wrap"><label>Sites this user can access</label><div class="ck-grid">${siteBoxes}</div></div>
    </div></div>
    <div class="m-foot"><button class="btn ghost" onclick="closeModal()">Cancel</button><button class="btn" onclick="submitUser('${jsid(id||'')}')">${u?'Save':'Add User'}</button></div></div>`);
  userRoleChange();
}
function userRoleChange(){ const r=val('u-role'); const wrap=document.getElementById('u-sites-wrap'); if(wrap) wrap.style.display=r==='purchase'?'none':''; }
function submitUser(id:string){
  const username=val('u-username'), password=val('u-password'), name=val('u-name'), r=val('u-role') as Role;
  if(!username||!password||!name) return toast('Username, password and name are required');
  const sites:string[]=Array.from(document.querySelectorAll('.u-site:checked')).map(e=>(e as HTMLInputElement).value);
  const allowedSites:string[]|'all' = r==='purchase'?'all':sites;
  if(r!=='purchase' && !sites.length) return toast('Tick at least one site for this user');
  store.users=store.users||[];
  if(id){ const i=store.users.findIndex(x=>x.id===id); store.users[i]={...store.users[i], password, name, role:r, allowedSites}; }
  else {
    if(store.users.some(x=>x.username.toLowerCase()===username.toLowerCase())) return toast('Username already exists');
    store.users.push({ id:'U-'+Date.now().toString(36), username, password, name, role:r, allowedSites });
  }
  save(); closeModal(); renderView(); toast('User '+(id?'updated':'added'));
}
function deleteUser(id:string){
  const u=(store.users||[]).find(x=>x.id===id); if(!u) return;
  if((store.users||[]).filter(x=>x.role==='purchase').length<=1 && u.role==='purchase') return toast('Keep at least one Purchase Manager');
  if(!confirm('Delete user "'+u.username+'"?')) return;
  store.users=(store.users||[]).filter(x=>x.id!==id); save(); renderView(); toast('User removed');
}

function settingsHTML(){
  return `${pageTop('Settings','Business configuration for the pilot')}
  <div class="panel pad" style="max-width:560px">
    <div class="fld"><label>Application Name</label><input class="f" id="s-company" value="${esc(state.settings.company)}"></div>
    <div class="fld"><label>Current User</label><input class="f" id="s-user" value="${esc(me())}"></div>
    <div class="fld"><label>Low-stock Alert Threshold (Central Store)</label><input class="f" id="s-low" type="number" min="0" value="${state.settings.lowStock}"></div>
    <div class="m-foot" style="border:0;padding:12px 0 0"><button class="btn" onclick="saveSettings()">Save Settings</button></div>
  </div>
  <div class="panel pad" style="max-width:560px;margin-top:16px">
    <div class="panel-h"><b>Demo Data</b></div>
    <p style="color:var(--muted);font-size:13px;margin-bottom:12px">Reset all materials, locations, transfers and the ledger back to the seeded pilot sample.</p>
    <button class="btn danger" onclick="if(confirm('Reset all demo data?'))resetData()">${svg(IC.trash)} Reset Demo Data</button>
  </div>`;
}
function saveSettings(){ state.settings.company=val('s-company')||state.settings.company; state.settings.lowStock=numVal('s-low'); save(); renderTopbar(); renderView(); toast('Settings saved'); }

/* ===========================================================
   BOOT
   =========================================================== */
function togglePass(){ const i=document.getElementById('lg-pass') as HTMLInputElement; if(!i) return; const show=i.type==='password'; i.type=show?'text':'password'; const b=document.getElementById('lg-eye'); if(b) b.innerHTML=svg(show?IC.eyeoff:IC.eye); }
function loginHTML(){
  return `<div class="login-split">
    <div class="login-hero">
      <div class="lh-band"></div><div class="lh-diagonal"></div>
      <div class="lh-top">
        ${brandLogo(40)}<b class="lh-ql">Qualtech<span>Engineers Pvt. Ltd.</span></b>
        <div class="lh-vdiv"></div>
        <div class="lh-eyebrow">Inventory<br>Transfer<br>Tracking</div>
      </div>
      <div class="lh-inner">
        <div class="lh-accent"></div>
        <h1>Material<br>Transfer &amp;<br>Inventory System</h1>
        <p>Track materials, transfers and stock across locations.</p>
        <div class="lh-feats">
          <div class="lh-feat">${svg(IC.materials)}<span>Inventory<br>Control</span></div>
          <div class="lh-sep"></div>
          <div class="lh-feat">${svg(IC.transfers)}<span>Material<br>Transfers</span></div>
          <div class="lh-sep"></div>
          <div class="lh-feat">${svg(IC.reports)}<span>Stock<br>Visibility</span></div>
        </div>
      </div>
    </div>
    <div class="login-panel"><div class="login-card2">
      <h2>Sign in to continue</h2>
      <p class="login-sub">Material Transfer &amp; Inventory System &nbsp;·&nbsp; Phase 1 Pilot</p>
      <div class="fld"><label>Username</label><div class="inp"><span class="inp-ic">${svg(IC.user)}</span><input class="f" id="lg-user" placeholder="store or site" onkeydown="if(event.key==='Enter')doLogin()"></div></div>
      <div class="fld"><label>Password</label><div class="inp"><span class="inp-ic">${svg(IC.lock)}</span><input class="f" id="lg-pass" type="password" placeholder="••••••••" onkeydown="if(event.key==='Enter')doLogin()"><button class="inp-eye" id="lg-eye" onclick="togglePass()">${svg(IC.eye)}</button></div></div>
      <button class="btn red login-btn" onclick="doLogin()">${svg(IC.logout)} Sign In</button>
      <div class="login-or">OR SIGN IN AS</div>
      <button class="role-card" onclick="loginAs('purchase')"><div class="rc-ic amber">${svg(IC.office)}</div><div class="rc-t"><b>Purchase Manager</b><span>Head Office · All sites</span></div>${svg(IC.cright,18)}</button>
      <button class="role-card" onclick="loginAs('store')"><div class="rc-ic red">${svg(IC.warehouse)}</div><div class="rc-t"><b>Storekeeper</b><span>R. Suresh · Central Store</span></div>${svg(IC.cright,18)}</button>
      <button class="role-card" onclick="loginAs('site')"><div class="rc-ic blue">${svg(IC.locations)}</div><div class="rc-t"><b>Site Manager</b><span>M. Mariappan · Pilot Site</span></div>${svg(IC.cright,18)}</button>
      <div class="login-foot">Demo — <b>purchase</b>/purchase123 · <b>store</b>/store123 · <b>site</b>/site123</div>
    </div></div>
  </div>`;
}
function showLogin(){
  document.body.classList.add('logged-out');
  document.getElementById('sidebar')!.innerHTML=''; document.getElementById('topbar')!.innerHTML='';
  document.getElementById('app')!.innerHTML=loginHTML();
}
function boot(){
  try{
    initTheme();
    if(!session){ showLogin(); return; }
    document.body.classList.remove('logged-out');
    renderSidebar(); renderTopbar(); renderView();
  }
  catch(err){ console.error('boot failed:',err); const el=document.getElementById('app'); if(el) el.innerHTML=renderErrorHTML('startup',err); }
}
if(!window.qtDeferBoot){ if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot(); }
