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

/* ---------- state ---------- */
const LS='mtts-v1';
const clone=<T,>(o:T):T=>JSON.parse(JSON.stringify(o));
function load(): MTState { try{ const r=localStorage.getItem(LS); if(r){ const s=JSON.parse(r); return migrate(s); } }catch{} return clone(SEED); }
function migrate(s: any): MTState {
  s.materials=s.materials||[]; s.locations=s.locations||[]; s.requests=s.requests||[]; s.transfers=s.transfers||[];
  s.receipts=s.receipts||[]; s.movements=s.movements||[];
  s.settings=s.settings||clone(SEED.settings);
  if(!Array.isArray(s.settings.readNotes)) s.settings.readNotes=[];
  return s as MTState;
}
function save(){ try{ localStorage.setItem(LS, JSON.stringify(state)); }catch{} if(typeof syncPush==='function') syncPush(LS, state); }
function resetData(){ state=clone(SEED); save(); go('dashboard'); toast('Demo data reset'); }
let state: MTState = load();

/* ---------- lookups ---------- */
const material=(c:string)=>state.materials.find(m=>m.code===c);
const matName=(c:string)=>{ const m=material(c); return m?m.name:c; };
const matUnit=(c:string)=>{ const m=material(c); return m?m.unit:''; };
const loc=(id:string)=>state.locations.find(l=>l.id===id);
const VIRTUAL:Record<string,string>={OPENING:'Opening',TRANSIT:'In Transit',DAMAGED:'Damaged',LOSS:'Loss / Short'};
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
    type:mv.type||'ADJUST', ref:mv.ref||'', person:mv.person||state.settings.user,
    txnDate:mv.txnDate||nowDate(), date:nowDate(), time:nowTime() };
  state.movements.push(m);
}
function toast(msg:string){ const t=document.getElementById('toast'); if(!t) return; t.innerHTML=svg(IC.check)+'<span>'+msg+'</span>'; t.classList.add('on'); clearTimeout(window._tt); window._tt=setTimeout(()=>t.classList.remove('on'),2600); }
function esc(s:any){ return String(s==null?'':s).replace(/[&<>"'`]/g,c=>(({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','`':'&#96;'} as any)[c])); }
function jsid(s:any){ return String(s==null?'':s).replace(/[^A-Za-z0-9 _.\/:-]/g,''); }

/* ---------- roles ---------- */
const role=()=>state.settings.role;
const isStore=()=>role()==='store';
const isSite=()=>role()==='site';

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
  const all:[string,string][]=[
    ['dashboard','Dashboard'],['materials','Materials'],['locations','Locations'],
    ['opening','Opening Stock'],['requests','Material Requests'],['transfers','Material Transfers'],['receipts','Receipt Confirmation'],
    ['notes','Notifications'],['stock','Current Stock'],['losses','Loss Register'],['history','Movement History'],['settings','Settings'],
  ];
  if(isSite()) return all.filter(n=>['dashboard','requests','receipts','stock','losses','history'].includes(n[0]));
  return all;
}
function pendingForSite(){ return state.transfers.filter(t=>['PENDING','PARTIAL'].includes(transferStatus(t))).length; }
function pendingRequests(){ return state.requests.filter(r=>r.status==='PENDING').length; }
function openRequestsForSite(){ return state.requests.filter(r=>r.requestedBy===state.settings.user || r.status!=='REJECTED').length; }

function renderSidebar(){
  const nav=navItems();
  const pend=pendingForSite();
  const unread=isStore()?unreadNotes().length:0;
  const preq=isStore()?pendingRequests():0;
  const badge=(k:string)=>{ if(k==='receipts'&&pend) return `<span class="nav-badge">${pend}</span>`; if(k==='notes'&&unread) return `<span class="nav-badge">${unread>9?'9+':unread}</span>`; if(k==='requests'&&preq) return `<span class="nav-badge">${preq}</span>`; return ''; };
  document.getElementById('sidebar')!.innerHTML=`
    <div class="logo">${svg(IC.logo,36)}<b>Material Transfer<br>& Tracking</b></div>
    <nav class="nav">${nav.map(n=>`<button class="nav-item ${view===n[0]?'active':''}" onclick="go('${n[0]}')">${svg(IC[n[0]]||IC.dashboard)} ${n[1]}${badge(n[0])}</button>`).join('')}</nav>
    <div class="side-foot">Phase 1 Pilot · ${esc(central()?central()!.name:'')} → ${esc(sites()[0]?sites()[0].name:'')}</div>`;
}
function renderTopbar(){
  const dark=document.documentElement.getAttribute('data-theme')==='dark';
  const u=state.settings.user, r=isStore()?'Store Manager':'Site Manager';
  document.getElementById('topbar')!.innerHTML=`
    <div class="search">${svg(IC.search)}<input id="topSearch" placeholder="Search material, code or location…" value="${esc(qFilter)}" oninput="topSearch(this.value)"></div>
    <div class="tb-right">
      <button class="role-toggle" title="Switch demo role" onclick="switchRole()">${svg(isStore()?IC.warehouse:IC.locations,16)} <b>${r}</b> ${svg(IC.chev,14)}</button>
      ${isStore()?(()=>{const u=unreadNotes().length;return `<button class="bell" title="Site requests" onclick="openNotes()">${u?`<span class="bell-count">${u>9?'9+':u}</span>`:''}${svg(IC.bell)}</button>`;})():''}
      <button class="bell" title="Toggle light / dark" onclick="toggleTheme()">${svg(dark?ICsun:ICmoon)}</button>
      <div class="user"><div class="avatar">${esc(u.split(' ').map(w=>w[0]).join('').slice(0,2))}</div><div class="u"><b>${esc(u)}</b><span>${r}</span></div></div>
    </div>`;
}
function switchRole(){ state.settings.role = isStore()?'site':'store'; save(); if(!navItems().some(n=>n[0]===view)) view='dashboard'; renderSidebar(); renderTopbar(); renderView(); toast('Now acting as '+(isStore()?'Store Manager':'Site Manager')); }
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
function topSearch(v:string){ qFilter=v; if(!['materials','stock','history','transfers'].includes(view)){ view='stock'; renderSidebar(); } if(_ts) clearTimeout(_ts); _ts=setTimeout(()=>{ _ts=null; renderView(); },180); }

function renderView(){
  const el=document.getElementById('app'); if(!el) return;
  try{
    switch(view){
      case 'dashboard': el.innerHTML=dashboardHTML(); break;
      case 'materials': el.innerHTML=materialsHTML(); break;
      case 'locations': el.innerHTML=locationsHTML(); break;
      case 'opening':   el.innerHTML=openingHTML(); break;
      case 'requests':  el.innerHTML=requestsHTML(); break;
      case 'transfers': el.innerHTML=curTransfer?transferDetailHTML(curTransfer):transfersHTML(); break;
      case 'receipts':  el.innerHTML=curTransfer?receiptConfirmHTML(curTransfer):receiptsHTML(); break;
      case 'notes':     el.innerHTML=notesViewHTML(); markNotesRead(); renderSidebar(); renderTopbar(); break;
      case 'stock':     el.innerHTML=stockHTML(); break;
      case 'losses':    el.innerHTML=lossesHTML(); break;
      case 'history':   el.innerHTML=historyHTML(); break;
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
function dashboardHTML(){
  const cId=CENTRAL_ID(), sId=SITE_ID();
  const pend=state.transfers.filter(t=>transferStatus(t)==='PENDING').length;
  const partial=state.transfers.filter(t=>transferStatus(t)==='PARTIAL').length;
  const low=state.materials.filter(m=>m.active && onHand(m.code,cId)>0 && onHand(m.code,cId)<=state.settings.lowStock);
  const recent=state.transfers.slice().sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).slice(0,6);
  const k=`<div class="kpis">
    ${kpi('Registered Materials', num(state.materials.filter(m=>m.active).length), IC.materials)}
    ${kpi('Central Store Stock', num(Math.round(locationTotal(cId))), IC.warehouse)}
    ${kpi('Pilot Site Stock', num(Math.round(locationTotal(sId))), IC.building)}
    ${kpi('In Transit', num(Math.round(totalTransit())), IC.truck)}
    ${kpi('Pending Receipts', num(pend), IC.receipts)}
    ${isStore()?kpi('Pending Requests', num(pendingRequests()), IC.requests):kpi('Total Transfers', num(state.transfers.length), IC.transfers)}
  </div>`;
  const recentRows=recent.length?recent.map(t=>{
    const st=transferStatus(t);
    return `<tr onclick="openTransfer('${jsid(t.id)}')" style="cursor:pointer">
      <td class="n b">${esc(t.id)}</td><td>${esc(t.docType)}-${esc(t.docNo)}</td>
      <td>${esc(locName(t.from))} → ${esc(locName(t.to))}</td>
      <td class="n">${num(transferDispatched(t))}</td><td>${statusChip(st)}</td><td>${esc(t.txnDate)}</td></tr>`;
  }).join(''):`<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:24px">No transfers yet</td></tr>`;
  const lowRows=low.length?low.map(m=>`<tr><td class="n b">${esc(m.code)}</td><td>${esc(m.name)}</td><td class="n">${num(onHand(m.code,cId))} ${esc(m.unit)}</td></tr>`).join(''):`<tr><td colspan="3" style="text-align:center;color:var(--muted);padding:20px">No low-stock materials</td></tr>`;
  return `${pageTop('Dashboard','Operational status at a glance — '+esc(central()?central()!.name:'')+' → '+esc(sites()[0]?sites()[0].name:''), isStore()?`<button class="btn" onclick="openTransferForm()">${svg(IC.plus)} New Transfer</button>`:'')}
  ${k}
  <div class="dash-grid">
    <div class="panel pad"><div class="panel-h"><b>Recent Transfers</b>${isStore()?`<button class="btn ghost sm" onclick="go('transfers')">View all</button>`:''}</div>
      <table class="mv-table"><thead><tr><th>Transfer</th><th>Document</th><th>Route</th><th class="n">Qty</th><th>Status</th><th>Date</th></tr></thead><tbody>${recentRows}</tbody></table></div>
    <div class="panel pad"><div class="panel-h"><b>Low Stock · Central Store</b></div>
      <table class="mv-table"><thead><tr><th>Code</th><th>Material</th><th class="n">On hand</th></tr></thead><tbody>${lowRows}</tbody></table>
      ${partial?`<div class="note-row">${svg(IC.alert,15)} ${partial} transfer(s) partially received — awaiting reconciliation</div>`:''}
    </div>
  </div>
  ${isStore()?siteRequestsPanel():''}`;
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
  const row=(r:MaterialRequest)=>`<tr onclick="${isStore()&&r.status==='PENDING'?`openReviewRequest('${jsid(r.id)}')`:(r.transferId?`openTransfer('${jsid(r.transferId)}')`:'')}" style="${(isStore()&&r.status==='PENDING')||r.transferId?'cursor:pointer':''}">
      <td class="n b">${esc(r.id)}</td><td>${esc(r.txnDate)}</td><td>${esc(r.requestedBy)}</td>
      <td class="n">${r.items.length}</td><td class="n">${num(reqQty(r))}</td>
      <td>${reqChip(r.status)}</td><td>${r.transferId?`${esc(r.transferId)} ${reqLinkedStatus(r)}`:'<span style="color:var(--muted);font-size:12px">—</span>'}</td>
      <td class="row-act">${isStore()&&r.status==='PENDING'?`<button class="btn sm" onclick="event.stopPropagation();openReviewRequest('${jsid(r.id)}')">Review</button>`:''}</td></tr>`;
  const title=isSite()?'Material Requests':'Material Requests — Approval Inbox';
  const sub=isSite()?'Raise a request for materials you need. The store reviews and approves it.':'Site requests awaiting your approval. Approving creates a dispatch transfer automatically.';
  const action=isSite()?`<button class="btn" onclick="openRequestForm()">${svg(IC.plus)} Request Materials</button>`:'';
  const pend=state.requests.filter(r=>r.status==='PENDING');
  return `${pageTop(title,sub,action)}
  ${isStore()&&pend.length?`<div class="hint">${svg(IC.alert,14)} <b>${pend.length}</b> request(s) awaiting your review.</div>`:''}
  <div class="panel"><table><thead><tr><th>Request</th><th>Date</th><th>Requested By</th><th class="n">Items</th><th class="n">Qty</th><th>Status</th><th>Transfer</th><th></th></tr></thead>
  <tbody>${list.length?list.map(row).join(''):`<tr><td colspan="8" style="text-align:center;color:var(--muted);padding:28px">No requests yet</td></tr>`}</tbody></table></div>`;
}

/* ---- site: raise request ---- */
function openRequestForm(){
  reqDraftItems=[];
  openModal(`<div class="modal wide">${mh(IC.requests,'Request Materials','Ask the Central Store for the materials you need')}
    <div class="m-body">
      <div class="grid2">
        <div class="fld"><label>Request Date</label><input class="f" id="rq-date" type="date" value="${nowDate()}"></div>
        <div class="fld"><label>Requested By</label><input class="f" id="rq-by" value="${esc(state.settings.user)}"></div>
        <div class="fld col2"><label>Remarks / Reason</label><input class="f" id="rq-remarks" placeholder="Needed for slab casting next week…"></div>
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
  const r:MaterialRequest={ id:nextId('REQ-','requests','id'), requestedBy:val('rq-by')||state.settings.user, txnDate:val('rq-date')||nowDate(),
    remarks:val('rq-remarks'), status:'PENDING', items:clone(reqDraftItems), createdAt:nowStamp() };
  state.requests.push(r); reqDraftItems=[]; save(); closeModal(); go('requests'); toast('Request '+r.id+' submitted for approval');
}

/* ---- store: review request ---- */
function openReviewRequest(id:string){
  const r=state.requests.find(x=>x.id===id); if(!r) return;
  const rows=r.items.map(it=>{ const avail=onHand(it.code,CENTRAL_ID());
    return `<tr data-code="${esc(it.code)}"><td class="n b">${esc(it.code)}</td><td>${esc(matName(it.code))}</td>
      <td class="n">${num(it.qty)} ${esc(matUnit(it.code))}</td><td class="n ${avail<it.qty?'':''}" style="${avail<it.qty?'color:var(--red)':''}">${num(avail)}</td>
      <td><input class="f rq-appr" type="number" min="0" max="${avail}" value="${Math.min(it.qty,avail)}" style="width:90px;padding:6px 8px"></td></tr>`; }).join('');
  openModal(`<div class="modal wide">${mh(IC.requests,'Review Request · '+esc(r.id),'From '+esc(r.requestedBy)+' · '+esc(r.txnDate))}
    <div class="m-body">
      ${r.remarks?`<div class="src-note">Reason: ${esc(r.remarks)}</div>`:''}
      <table class="mv-table"><thead><tr><th>Code</th><th>Material</th><th class="n">Requested</th><th class="n">Store Stock</th><th>Approve Qty</th></tr></thead><tbody>${rows}</tbody></table>
      <div class="hint" style="margin-top:12px">${svg(IC.alert,14)} Approving creates a dispatch transfer for the approved quantities. You still confirm the dispatch afterwards. You can reduce quantities to match available stock.</div>
      <div class="fld" style="margin-top:6px"><label>Note (optional)</label><input class="f" id="rv-note" placeholder="Partial approval — balance after next purchase…"></div>
    </div>
    <div class="m-foot"><button class="btn ghost" onclick="closeModal()">Cancel</button><button class="btn danger" onclick="rejectRequest('${jsid(r.id)}')">Reject</button><button class="btn" onclick="approveRequest('${jsid(r.id)}')">${svg(IC.check)} Approve &amp; Create Transfer</button></div></div>`);
}
function rejectRequest(id:string){
  const r=state.requests.find(x=>x.id===id); if(!r) return;
  r.status='REJECTED'; r.reviewedBy=state.settings.user; r.reviewedAt=nowStamp(); r.reviewNote=val('rv-note');
  save(); closeModal(); renderSidebar(); renderView(); toast('Request '+r.id+' rejected');
}
function approveRequest(id:string){
  const r=state.requests.find(x=>x.id===id); if(!r) return;
  const trs=document.querySelectorAll('#layer tr[data-code]'); const items:TransferItem[]=[];
  for(const tr of Array.from(trs)){
    const code=(tr as HTMLElement).dataset.code!; const appr=Number((tr.querySelector('.rq-appr') as HTMLInputElement).value)||0;
    const avail=onHand(code,CENTRAL_ID());
    if(appr>avail) return toast(`${code}: approved ${num(appr)} exceeds store stock ${num(avail)}`);
    const it=r.items.find(x=>x.code===code); if(it) it.approvedQty=appr;
    if(appr>0) items.push({code,qty:appr});
  }
  if(!items.length) return toast('Approve at least one quantity (or Reject)');
  const t:Transfer={ id:nextId('TR-','transfers','id'), docType:'DC', docNo:r.id.replace('REQ-','REQ'), txnDate:nowDate(),
    from:CENTRAL_ID(), to:SITE_ID(), remarks:'Against request '+r.id, status:'DRAFT', items:clone(items),
    createdBy:state.settings.user, createdAt:nowStamp() };
  state.transfers.push(t);
  r.status='APPROVED'; r.reviewedBy=state.settings.user; r.reviewedAt=nowStamp(); r.reviewNote=val('rv-note'); r.transferId=t.id;
  save(); closeModal(); openTransfer(t.id); toast('Approved — transfer '+t.id+' created, ready to dispatch');
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
  return `${pageTop('Material Transfers','Dispatch materials from the Central Store. Site stock updates only after confirmed receipt.', isStore()?`<button class="btn" onclick="openTransferForm()">${svg(IC.plus)} New Transfer</button>`:'')}
  <div class="panel"><table><thead><tr><th>Transfer</th><th>DC / MTN</th><th>Date</th><th>Route</th><th class="n">Items</th><th class="n">Qty</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}
function openTransfer(id:string){ curTransfer=id; view='transfers'; renderSidebar(); renderView(); window.scrollTo(0,0); }

function transferDetailHTML(id:string){
  const t=state.transfers.find(x=>x.id===id); if(!t) return empty(IC.transfers,'Transfer not found');
  const st=transferStatus(t);
  const canDispatch=st==='DRAFT'&&isStore();
  const canCancel=st==='DRAFT'&&isStore();
  const canReceive=(st==='PENDING'||st==='PARTIAL')&&isSite();   // edit receipt inline
  const canResend=isStore()&&['PENDING','PARTIAL','RECEIVED','CLOSED'].includes(st);
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
    <div class="hint">${svg(IC.alert,14)} Enter what actually arrived, directly here. <b>Accepted</b> adds to site stock. <b>Damaged</b> is logged separately. <b>Short</b> stays in transit until resolved (Accepted + Damaged + Short ≤ Outstanding). <b>Need More</b> raises a fresh request to the store.</div>
    <div class="panel pad"><div class="panel-h"><b>Confirm Receipt — Line Items</b></div>
      <table class="mv-table rc-tbl"><thead><tr><th>Code</th><th>Material</th><th class="n">Outstanding</th><th>Accepted</th><th>Damaged</th><th>Short</th><th>Need More</th></tr></thead><tbody>${erows}</tbody></table>
      <div class="grid2" style="margin-top:14px">
        <div class="fld"><label>Receipt Date</label><input class="f" id="rc-date" type="date" value="${nowDate()}"></div>
        <div class="fld"><label>Received By</label><input class="f" id="rc-by" value="${esc(state.settings.user)}"></div>
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
    createdBy:state.settings.user, createdAt:nowStamp() };
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
    remarks:val('t-remarks'), status:'DRAFT', items:clone(draftItems), createdBy:state.settings.user, createdAt:nowStamp() };
  state.transfers.push(t); draftItems=[]; save(); closeModal(); openTransfer(t.id); toast('Draft '+t.id+' created');
}
function dispatchTransfer(id:string){
  const t=state.transfers.find(x=>x.id===id); if(!t||t.status!=='DRAFT') return;
  for(const it of t.items){ const avail=onHand(it.code,t.from); if(it.qty>avail) return toast(`Insufficient stock for ${it.code}: need ${num(it.qty)}, have ${num(avail)}`); }
  for(const it of t.items) addMovement({code:it.code,qty:it.qty,from:t.from,to:'TRANSIT',type:'DISPATCH',ref:t.id,txnDate:t.txnDate});
  t.status='PENDING'; t.dispatchedBy=state.settings.user; t.dispatchedAt=nowStamp();
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
      <td class="row-act">${isSite()?`<button class="btn sm" onclick="event.stopPropagation();openReceipt('${jsid(t.id)}')">Confirm</button>`:'<span style="color:var(--muted);font-size:12px">Site action</span>'}</td></tr>`; };
  return `${pageTop('Receipt Confirmation','Receiving site confirms what actually arrived. Site stock rises only by the accepted quantity.')}
  <div class="panel pad"><div class="panel-h"><b>Pending & Partial</b> <span class="count">${pend.length}</span></div>
    <table class="mv-table"><thead><tr><th>Transfer</th><th>Document</th><th>Route</th><th class="n">In Transit</th><th>Status</th><th></th></tr></thead>
    <tbody>${pend.length?pend.map(row).join(''):`<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:24px">Nothing awaiting receipt</td></tr>`}</tbody></table></div>
  ${done.length?`<div class="panel pad" style="margin-top:16px"><div class="panel-h"><b>Recently Completed</b></div>
    <table class="mv-table"><thead><tr><th>Transfer</th><th>Document</th><th>Route</th><th class="n">Qty</th><th>Status</th><th></th></tr></thead><tbody>${done.map(row).join('')}</tbody></table></div>`:''}`;
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
  <div class="hint">${svg(IC.alert,14)} Enter what actually arrived. <b>Accepted</b> adds to site stock. <b>Damaged</b> is logged separately. <b>Short</b> stays in transit until resolved (Accepted + Damaged + Short ≤ Outstanding). <b>Need More</b> raises a fresh request to the store for additional quantity.</div>
  <div class="panel pad"><table class="mv-table rc-tbl"><thead><tr><th>Code</th><th>Material</th><th class="n">Outstanding</th><th>Accepted</th><th>Damaged</th><th>Short</th><th>Need More</th></tr></thead><tbody>${rows||'<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:20px">Nothing outstanding</td></tr>'}</tbody></table>
    <div class="grid2" style="margin-top:14px">
      <div class="fld"><label>Receipt Date</label><input class="f" id="rc-date" type="date" value="${nowDate()}"></div>
      <div class="fld"><label>Received By</label><input class="f" id="rc-by" value="${esc(state.settings.user)}"></div>
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
  if(!items.length && needMore.length){ raiseNeedMore(t,needMore); return go('receipts'); }
  const r:Receipt={ id:nextId('RC-','receipts','id'), transferId:t.id, receiptNo:'GRN-'+String(state.receipts.length+1).padStart(4,'0'),
    receivedBy:val('rc-by')||state.settings.user, txnDate:val('rc-date')||nowDate(), confirmedAt:nowStamp(), remarks:val('rc-remarks'), items };
  state.receipts.push(r);
  for(const it of items){
    if(it.accepted>0) addMovement({code:it.code,qty:it.accepted,from:'TRANSIT',to:t.to,type:'RECEIPT',ref:t.id,txnDate:r.txnDate,person:r.receivedBy});
    if(it.damaged>0)  addMovement({code:it.code,qty:it.damaged, from:'TRANSIT',to:'DAMAGED',type:'DAMAGE',ref:t.id,txnDate:r.txnDate,person:r.receivedBy});
    // short: no ledger move — stays in TRANSIT as outstanding until resolved
  }
  if(needMore.length) raiseNeedMore(t, needMore, true);
  save();
  const st=transferStatus(t);
  if(st!=='CLOSED' && transferOutstanding(t)>0){ curTransfer=t.id; view='transfers'; renderSidebar(); renderView(); openResolvePrompt(t.id); }
  else { go('receipts'); }
  toast('Receipt confirmed — '+num(total)+' units processed'+(needMore.length?'. Extra request raised to store':''));
}
/** Raise a fresh Material Request to the store for extra quantity the site needs. */
function raiseNeedMore(t:Transfer, needMore:RequestItem[], silent=false){
  const r:MaterialRequest={ id:nextId('REQ-','requests','id'), requestedBy:state.settings.user, txnDate:nowDate(),
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
    if(act==='loss') addMovement({code,qty:out,from:'TRANSIT',to:'LOSS',type:'SHORT',ref:t.id,txnDate:nowDate(),person:state.settings.user});
    if(act==='return') addMovement({code,qty:out,from:'TRANSIT',to:t.from,type:'SHORT',ref:t.id,txnDate:nowDate(),person:state.settings.user});
    n++;
  }
  save(); closeModal(); renderView(); renderSidebar(); toast(n?'Discrepancy resolved':'Kept in transit');
}

/* ===========================================================
   CURRENT STOCK
   =========================================================== */
function stockHTML(){
  const cId=CENTRAL_ID(), sId=SITE_ID(); const q=qFilter.toLowerCase();
  const list=state.materials.filter(m=>!q||m.code.toLowerCase().includes(q)||m.name.toLowerCase().includes(q));
  const rows=list.map(m=>{ const c=onHand(m.code,cId), tr=transitQty(m.code), s=onHand(m.code,sId); const tot=c+tr+s;
    return `<tr><td class="n b">${esc(m.code)}</td><td>${esc(m.name)}</td><td>${esc(m.unit)}</td>
      <td class="n">${num(c)}</td><td class="n">${tr?`<span style="color:var(--amber,#d97706)">${num(tr)}</span>`:'0'}</td><td class="n">${num(s)}</td><td class="n b">${num(tot)}</td></tr>`; }).join('');
  const cId2=central(), sId2=sites()[0];
  return `${pageTop('Current Stock','Where every material is right now — store, in transit, and confirmed at site.')}
  <div class="panel"><table><thead><tr><th>Code</th><th>Material</th><th>Unit</th><th class="n">${esc(cId2?cId2.name:'Central')}</th><th class="n">In Transit</th><th class="n">${esc(sId2?sId2.name:'Site')}</th><th class="n">Total</th></tr></thead><tbody>${rows}</tbody></table></div>`;
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
   MOVEMENT HISTORY
   =========================================================== */
function historyHTML(){
  const q=qFilter.toLowerCase();
  const mv=state.movements.slice().reverse().filter(m=>!q||m.code.toLowerCase().includes(q)||matName(m.code).toLowerCase().includes(q)||(m.ref||'').toLowerCase().includes(q));
  const TYPE_LABEL:Record<string,string>={OPEN:'Opening',DISPATCH:'Dispatch',RECEIPT:'Receipt',DAMAGE:'Damaged',SHORT:'Short/Loss',ADJUST:'Adjustment'};
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
function settingsHTML(){
  return `${pageTop('Settings','Business configuration for the pilot')}
  <div class="panel pad" style="max-width:560px">
    <div class="fld"><label>Application Name</label><input class="f" id="s-company" value="${esc(state.settings.company)}"></div>
    <div class="fld"><label>Current User</label><input class="f" id="s-user" value="${esc(state.settings.user)}"></div>
    <div class="fld"><label>Low-stock Alert Threshold (Central Store)</label><input class="f" id="s-low" type="number" min="0" value="${state.settings.lowStock}"></div>
    <div class="m-foot" style="border:0;padding:12px 0 0"><button class="btn" onclick="saveSettings()">Save Settings</button></div>
  </div>
  <div class="panel pad" style="max-width:560px;margin-top:16px">
    <div class="panel-h"><b>Demo Data</b></div>
    <p style="color:var(--muted);font-size:13px;margin-bottom:12px">Reset all materials, locations, transfers and the ledger back to the seeded pilot sample.</p>
    <button class="btn danger" onclick="if(confirm('Reset all demo data?'))resetData()">${svg(IC.trash)} Reset Demo Data</button>
  </div>`;
}
function saveSettings(){ state.settings.company=val('s-company')||state.settings.company; state.settings.user=val('s-user')||state.settings.user; state.settings.lowStock=numVal('s-low'); save(); renderTopbar(); renderView(); toast('Settings saved'); }

/* ===========================================================
   BOOT
   =========================================================== */
function boot(){
  try{ initTheme(); renderSidebar(); renderTopbar(); renderView(); }
  catch(err){ console.error('boot failed:',err); const el=document.getElementById('app'); if(el) el.innerHTML=renderErrorHTML('startup',err); }
}
if(!window.qtDeferBoot){ if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot(); }
