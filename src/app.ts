/* ============================================================
   Qualtech Engineers — Inventory module
   Transaction-based: all balances computed from the movement ledger.
   ============================================================ */
'use strict';

/* ---------- icons ---------- */
function svg(p,w?){ return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"${w?` style="width:${w}px;height:${w}px"`:''}>${p}</svg>`; }
const IC = {
  dashboard:'<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
  projects:'<path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/><path d="M9 9v.01M9 12v.01M9 15v.01"/>',
  inventory:'<path d="M3 7l9-4 9 4-9 4-9-4z"/><path d="M3 7v10l9 4 9-4V7"/><path d="M12 11v10"/>',
  vendors:'<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/>',
  reports:'<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>',
  jobcost:'<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
  drill:'<path d="M9 18l6-6-6-6"/>', flag:'<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><path d="M4 22V15"/>',
  tenders:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 13l2 2 4-4"/>',
  procurement:'<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/>',
  billing:'<path d="M5 2v20l2-1.3L9 22l2-1.3L13 22l2-1.3L17 22l2-1.3V2l-2 1.3L15 2l-2 1.3L11 2 9 3.3 7 2 5 3.3z"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  tracking:'<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
  settings:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 6.8 19l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.2 6.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  bell:'<path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
  chev:'<path d="m6 9 6 6 6-6"/>', plus:'<path d="M12 5v14M5 12h14"/>', arrow:'<path d="M5 12h14M12 5l7 7-7 7"/>',
  warehouse:'<path d="M3 21V8l9-4 9 4v13"/><path d="M3 21h18"/><path d="M8 21v-6h8v6"/><path d="M8 12h8"/>',
  building:'<rect x="4" y="2" width="16" height="20" rx="1"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01"/>',
  in:'<path d="M12 3v12M7 10l5 5 5-5"/><path d="M4 21h16"/>', out:'<path d="M12 21V9M7 14l5-5 5 5"/><path d="M4 3h16"/>',
  xfer:'<path d="M7 7h11l-3-3M17 17H6l3 3"/>', reserve:'<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>',
  consume:'<path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>', po:'<path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/>',
  history:'<path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/><path d="M12 7v5l3 3"/>',
  check:'<path d="M20 6 9 17l-5-5"/>', x:'<path d="M18 6 6 18M6 6l12 12"/>', edit:'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  trash:'<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>',
  logo:'<path d="M12 2 2 8l10 6 10-6-10-6z" fill="#2563eb" stroke="none"/><path d="M2 8l10 6 10-6" stroke="#93b4fb"/><path d="M12 2v12" stroke="#1e3a8a"/><path d="m7 5 10 6" stroke="#dbe6ff"/>',
  action:'<path d="M12 2a7 7 0 0 0-7 7c0 5-3 7-3 7h20s-3-2-3-7a7 7 0 0 0-7-7z"/><path d="M10.3 21a2 2 0 0 0 3.4 0"/><circle cx="18" cy="6" r="3" fill="#ef4444" stroke="none"/>',
};

/* ---------- state ---------- */
const LS='qualtech-inv-v3';
const clone=o=>JSON.parse(JSON.stringify(o));
function load(): InventoryState { try{ const r=localStorage.getItem(LS); if(r) return JSON.parse(r); }catch{} return clone(SEED); }
function save(){ try{ localStorage.setItem(LS, JSON.stringify(state)); }catch{} syncPush(LS, state); }
function resetData(){ state=clone(SEED); save(); }
let state: InventoryState = load();

const item=c=>state.items.find(i=>i.code===c);
/* safe label helpers — never throw if an item was removed (e.g. by another user) */
const itemLabel=c=>{ const i=item(c); return i?i.name:c; };
const itemUnit=c=>{ const i=item(c); return i?i.unit:''; };
const loc=id=>state.locations.find(l=>l.id===id);
const vendor=id=>state.vendors.find(v=>v.id===id);
const locName=id=>({OPENING:'Opening',VENDOR:'Vendor',CONSUMED:'Consumed',OUT:'Issued out',TRANSIT:'In transit'}[id]) || (loc(id)?loc(id).name:id);
const sites=()=>state.locations.filter(l=>l.type==='site');

/* ---------- ledger math ---------- */
function onHand(code,locId){ let q=0; for(const m of state.movements){ if(m.code!==code) continue; if(m.to===locId) q+=m.qty; if(m.from===locId) q-=m.qty; } return q; }
function reservedQty(code,locId){ return state.reservations.filter(r=>r.status==='active'&&r.code===code&&r.location===locId).reduce((s,r)=>s+r.qty,0); }
function available(code,locId){ return onHand(code,locId)-reservedQty(code,locId); }
function transitQty(code){ let q=0; for(const m of state.movements){ if(m.code!==code) continue; if(m.to==='TRANSIT') q+=m.qty; if(m.from==='TRANSIT') q-=m.qty; } return q; }
function locationTotalQty(locId){ if(typeof LOC_TOTALS!=='undefined' && LOC_TOTALS[locId]!=null) return LOC_TOTALS[locId]; return state.items.reduce((s,it)=>s+Math.max(0,onHand(it.code,locId)),0); }
function statusOf(it,locId){
  const oh=onHand(it.code,locId), av=available(it.code,locId);
  if(oh<=0) return {k:'out',t:'Out',c:'c-out'};
  if(it.type==='equipment') return av<oh ? {k:'use',t:'In Use',c:'c-use'} : {k:'normal',t:'Normal',c:'c-normal'};
  if(oh<=it.reorder) return {k:'low',t:'Low Stock',c:'c-low'};
  return {k:'normal',t:'Normal',c:'c-normal'};
}
const money=n=>'₹'+Math.round(n).toLocaleString('en-IN');
const num=n=>Number(n).toLocaleString('en-IN');
function nowDate(){ return new Date().toISOString().slice(0,10); }
function nowTime(){ const d=new Date(); return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0'); }
function nextId(prefix,arrKey,field?){ let max=0; (state[arrKey]||[]).forEach(x=>{ const m=((x[field||'id'])||'').match(/(\d+)\s*$/); if(m){ const n=+m[1]; if(n>max)max=n; } }); return prefix+(max+1); }
function addMovement(mv){ mv.id=mv.id||('MV-'+(1000+state.movements.length+1)); mv.date=mv.date||nowDate(); mv.time=mv.time||nowTime(); state.movements.push(mv); }
function toast(msg){ const t=document.getElementById('toast'); if(!t) return; t.innerHTML=svg(IC.check)+'<span>'+msg+'</span>'; t.classList.add('on'); clearTimeout(window._tt); window._tt=setTimeout(()=>t.classList.remove('on'),2600); }

/* ---------- view state ---------- */
let view='dashboard', curLoc='WH-MAIN', curTab='material', qFilter='', catFilter='all', statusFilter='all', page=1, sortKey='', sortDir=1;
let dDoc='all', dProj='all';

/* ---------- theme (light / dark) ---------- */
const THEME_LS='qualtech-theme';
function initTheme(){ let t; try{ t=localStorage.getItem(THEME_LS); }catch{} document.documentElement.setAttribute('data-theme', t||'dark'); }
function toggleTheme(){ const cur=document.documentElement.getAttribute('data-theme')==='dark'?'light':'dark'; document.documentElement.setAttribute('data-theme',cur); try{ localStorage.setItem(THEME_LS,cur); }catch{} renderTopbar(); }
const ICsun='<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>';
const ICmoon='<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>';
function sortItems(list){
  if(!sortKey) return list;
  const v=it=>{ switch(sortKey){
    case 'code':return it.code; case 'name':return it.name.toLowerCase(); case 'category':return it.category.toLowerCase(); case 'unit':return it.unit.toLowerCase();
    case 'onhand':return onHand(it.code,curLoc); case 'reserved':return reservedQty(it.code,curLoc); case 'available':return available(it.code,curLoc); case 'value':return onHand(it.code,curLoc)*it.rate; default:return it.code; } };
  return list.slice().sort((a,b)=>{ const x=v(a),y=v(b); return (typeof x==='number'?x-y:String(x).localeCompare(String(y)))*sortDir; });
}
function sortBy(key){ if(sortKey===key) sortDir=-sortDir; else { sortKey=key; sortDir=1; } page=1; renderView(); }
function sortCaret(k){ return sortKey===k ? `<span class="si on">${sortDir>0?'▲':'▼'}</span>` : `<span class="si">↕</span>`; }
const PER=10;
const TYPE_OF_TAB={material:'material',container:'container',equipment:'equipment',all:'all'};

/* ---------- shell ---------- */
function renderSidebar(){
  const nav=[['dashboard','Dashboard'],['action','Action Center'],['tracking','Tracking'],['tenders','Bidding'],['projects','Projects'],['procurement','Procurement'],['inventory','Inventory'],['jobcost','Job Costs'],['billing','Connected Documents'],['vendors','Vendors'],['reports','Reports'],['settings','Settings']];
  const ac=alertCount();
  document.getElementById('sidebar').innerHTML=`
    <div class="logo">${svg(IC.logo,36)}<b>Qualtech<br>Engineers Pvt. Ltd.</b></div>
    <nav class="nav">${nav.map(n=>`<button class="nav-item ${view===n[0]?'active':''}" onclick="go('${n[0]}')">${svg(IC[n[0]]||IC.dashboard)} ${n[1]}${n[0]==='action'&&ac?`<span class="nav-badge">${ac>99?'99+':ac}</span>`:''}</button>`).join('')}</nav>`;
}
function renderTopbar(){
  document.getElementById('topbar').innerHTML=`
    <div class="search">${svg(IC.search)}<input id="topSearch" placeholder="Search material, item code, or location…" value="${esc(qFilter)}" oninput="topSearch(this.value)"></div>
    <div class="tb-right">
      <button class="bell" title="Toggle light / dark" onclick="toggleTheme()">${svg(document.documentElement.getAttribute('data-theme')==='dark'?ICsun:ICmoon)}</button>
      <button class="bell" title="Action Center" onclick="go('action')">${(()=>{const c=alertCount();return c?`<span class="bell-count">${c>99?'99+':c}</span>`:'';})()}${svg(IC.bell)}</button>
      <div class="user"><div class="avatar">RS</div><div class="u"><b>${COMPANY.user}</b><span>${COMPANY.role}</span></div>${svg(IC.chev)}</div>
    </div>`;
}
function go(v){ view=v; page=1; renderSidebar(); renderView(); window.scrollTo(0,0); }
let _topSearchTimer: ReturnType<typeof setTimeout> | null = null;
function topSearch(v){
  qFilter=v; page=1;
  if(view!=='inventory'){ view='inventory'; renderSidebar(); }
  if(_topSearchTimer) clearTimeout(_topSearchTimer);
  _topSearchTimer=setTimeout(()=>{ _topSearchTimer=null; renderView(); }, 180);
}
function esc(s){ return String(s==null?'':s).replace(/[&<>"'`]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','`':'&#96;'}[c])); }
/* For an id/code embedded in a JS-string argument of an inline handler
   (e.g. onclick="fn('${jsid(code)}')"). Codes/ids are always a safe charset,
   so stripping anything else is lossless for real data and neutralises any
   quote/bracket injection — even from data written straight to the API. */
function jsid(s){ return String(s==null?'':s).replace(/[^A-Za-z0-9 _.\/:-]/g,''); }

/* ---------- router ---------- */
function renderView(){
  const el=document.getElementById('app');
  if(!el) return;
  try{
    if(view==='dashboard'){ el.innerHTML=dashboardHTML(); return; }
    if(view==='action'){ el.innerHTML=actionCenterHTML(); return; }
    if(view==='inventory'){ el.innerHTML=inventoryHTML(); bindInv(); return; }
    if(view==='jobcost'){ el.innerHTML=jobCostHTML(); return; }
    if(view==='projects'){ el.innerHTML=projectsHTML(); return; }
    if(view==='tenders'){ el.innerHTML=tenderHTML(); if(typeof bindTender==='function') bindTender(); return; }
    if(view==='procurement'){ el.innerHTML=procureHTML(); if(typeof bindProcure==='function') bindProcure(); return; }
    if(view==='billing'){ el.innerHTML=billingHTML(); if(typeof billBind==='function') billBind(); return; }
    if(view==='reports'){ el.innerHTML=reportsHTML(); return; }
    if(view==='vendors'){ el.innerHTML=vendorsHTML(); return; }
    el.innerHTML=placeholderHTML(view);
  }catch(err){
    console.error('renderView failed for "'+view+'":', err);
    el.innerHTML=renderErrorHTML(view, err);
  }
}
function renderErrorHTML(where, err){
  const msg=esc((err&&err.message)||String(err||'Unknown error'));
  return `<div class="page-top"><h1>Something went wrong</h1><p>This screen hit an unexpected error, but your data is safe — nothing was lost.</p></div>
  <div class="panel" style="padding:28px;text-align:center">
    <div style="font-size:40px;line-height:1;margin-bottom:12px">⚠️</div>
    <div style="font-weight:600;margin-bottom:6px">Couldn't display “${esc(where)}”.</div>
    <div style="color:var(--muted);font-size:13px;max-width:520px;margin:0 auto 18px">${msg}</div>
    <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">
      <button class="btn" onclick="go('dashboard')">Go to Dashboard</button>
      <button class="btn ghost" onclick="renderView()">Try again</button>
      <button class="btn ghost" onclick="location.reload()">Reload app</button>
    </div>
  </div>`;
}

/* ---------- INVENTORY ---------- */
function filteredItems(){
  return state.items.filter(it=>{
    if(curTab==='container' && it.type!=='container') return false;
    if(curTab==='equipment' && it.type!=='equipment') return false;
    // 'material' and 'all' show every item (matches the reference, where the Materials tab lists all stock)
    if(catFilter!=='all' && it.category!==catFilter) return false;
    if(statusFilter!=='all' && statusOf(it,curLoc).k!==statusFilter) return false;
    if(qFilter){ const q=qFilter.toLowerCase(); if(!(it.code.toLowerCase().includes(q)||it.name.toLowerCase().includes(q)||it.category.toLowerCase().includes(q))) return false; }
    return true;
  });
}
function locCard(l){
  const total=locationTotalQty(l.id);
  const icon = l.type==='warehouse'?IC.warehouse:IC.building;
  return `<div class="loc-card ${curLoc===l.id?'active':''}" onclick="selLoc('${l.id}')">
    <div class="loc-ic">${svg(icon)}</div>
    <div class="lc-txt"><div class="lc-name">${esc(l.name)}</div><div class="lc-items">${num(total)} items</div></div>
  </div>`;
}
function invRow(it){
  const oh=onHand(it.code,curLoc), rv=reservedQty(it.code,curLoc), av=available(it.code,curLoc), st=statusOf(it,curLoc);
  return `<tr>
    <td class="code">${it.code}</td>
    <td class="mat"><b>${esc(it.name)}</b></td>
    <td>${esc(it.category)}</td>
    <td>${it.unit}</td>
    <td class="n b">${num(oh)}</td>
    <td class="n">${num(rv)}</td>
    <td class="n">${num(av)}</td>
    <td class="n">${num(oh*it.rate)}</td>
    <td><span class="chip ${st.c}"><i></i>${st.t}</span></td>
    <td class="r"><div class="row-menu"><button class="kebab" onclick="rowMenu(event,'${it.code}')">⋯</button></div></td>
  </tr>`;
}
function inventoryHTML(){
  const list=sortItems(filteredItems());
  const pages=Math.max(1,Math.ceil(list.length/PER));
  if(page>pages) page=pages;
  const slice=list.slice((page-1)*PER, page*PER);
  const L=loc(curLoc);
  const tabs=[['material','Materials'],['container','Containers'],['equipment','Equipment'],['all','All Items']];
  const pagerBtns=()=>{
    const prev=`<button onclick="pg(${page-1})" ${page<=1?'disabled':''}>‹</button>`;
    const next=`<button onclick="pg(${page+1})" ${page>=pages?'disabled':''}>›</button>`;
    const nums=new Set([1,pages,page-1,page,page+1]);
    if(page<=3){ [1,2,3,4,5].forEach(n=>{ if(n<=pages) nums.add(n); }); }
    else if(page>=pages-2){ [pages-4,pages-3,pages-2,pages-1,pages].forEach(n=>{ if(n>=1) nums.add(n); }); }
    const sorted=[...nums].filter(n=>n>=1&&n<=pages).sort((a,b)=>a-b);
    let out=''; let last=0;
    sorted.forEach(n=>{ if(n-last>1) out+='<button disabled>…</button>'; out+=`<button class="${n===page?'on':''}" onclick="pg(${n})">${n}</button>`; last=n; });
    return prev+out+next;
  };
  const actions=`<div class="inv-actions">
      <button class="btn" onclick="openStockIn()">${svg(IC.in)} Stock In</button>
      <button class="btn ghost" onclick="openStockOut()">${svg(IC.out)} Stock Out</button>
      <button class="btn ghost" onclick="openTransfer()">${svg(IC.xfer)} Transfer</button>
      <button class="btn ghost" onclick="openReserve()">${svg(IC.reserve)} Reserve</button>
      <button class="btn ghost" onclick="openConsume()">${svg(IC.consume)} Consume</button>
      <button class="btn ghost" onclick="openPOList()">${svg(IC.po)} Purchase Order</button>
    </div>`;
  return `
  <div class="page-top"><h1>Inventory</h1><p>Manage stock across the central warehouse and all project sites.</p></div>

  <div class="loc-row">${state.locations.map(locCard).join('')}</div>

  <div class="panel">
    <div class="inv-head">
      <div class="loc-ic sm">${svg(L.type==='warehouse'?IC.warehouse:IC.building)}</div>
      <select class="loc-select" onchange="selLoc(this.value)">${state.locations.map(l=>`<option value="${l.id}" ${l.id===curLoc?'selected':''}>${esc(l.name)}</option>`).join('')}</select>
      ${actions}
    </div>
    <div class="tabs">${tabs.map(t=>`<button class="tab ${curTab===t[0]?'active':''}" onclick="selTab('${t[0]}')">${t[1]}</button>`).join('')}</div>
    <div class="filters">
      <div class="f-search">${svg(IC.search)}<input id="invSearch" placeholder="Search by item code or material name…" value="${esc(qFilter)}" oninput="invSearch(this.value)"></div>
      <select class="f" onchange="catFilter=this.value;page=1;renderView()"><option value="all">All Categories</option>${CATEGORIES.map(c=>`<option ${catFilter===c?'selected':''}>${c}</option>`).join('')}</select>
      <select class="f" onchange="statusFilter=this.value;page=1;renderView()">
        <option value="all" ${statusFilter==='all'?'selected':''}>All Status</option>
        <option value="normal" ${statusFilter==='normal'?'selected':''}>Normal</option>
        <option value="low" ${statusFilter==='low'?'selected':''}>Low Stock</option>
        <option value="out" ${statusFilter==='out'?'selected':''}>Out</option>
        <option value="use" ${statusFilter==='use'?'selected':''}>In Use</option>
      </select>
      <div class="filters-right">
        <button class="btn" onclick="openAddItem()">${svg(IC.plus)} Add Item</button>
        <div class="more-wrap"><button class="kebab lg" onclick="openMore(event)">⋮</button></div>
      </div>
    </div>
    <div class="tbl-scroll"><table>
      <thead><tr>
        <th class="sortable" onclick="sortBy('code')">Code ${sortCaret('code')}</th>
        <th class="sortable" onclick="sortBy('name')">Material ${sortCaret('name')}</th>
        <th class="sortable" onclick="sortBy('category')">Category ${sortCaret('category')}</th>
        <th>Unit</th>
        <th class="sortable" onclick="sortBy('onhand')">On Hand ${sortCaret('onhand')}</th>
        <th class="sortable" onclick="sortBy('reserved')">Reserved ${sortCaret('reserved')}</th>
        <th class="sortable" onclick="sortBy('available')">Available ${sortCaret('available')}</th>
        <th class="sortable" onclick="sortBy('value')">Value (₹) ${sortCaret('value')}</th>
        <th>Status</th><th class="th-more">⋯</th></tr></thead>
      <tbody>${slice.length?slice.map(invRow).join(''):`<tr class="empty-row"><td colspan="10">No items match the current filters.</td></tr>`}</tbody>
    </table></div>
    <div class="tbl-foot"><div class="count">Showing ${slice.length} of ${list.length} items</div><div class="pager">${pagerBtns()}</div></div>
  </div>

  ${pendingTransfersHTML()}

  <div class="panel" style="margin-top:22px">
    <div class="rm-head"><h3>${svg(IC.history)} Recent Movements</h3><a onclick="openHistory()">View All ${svg(IC.arrow)}</a></div>
    <div class="tbl-scroll">${recentMovementsTable()}</div>
  </div>`;
}
function selLoc(id){ curLoc=id; page=1; renderView(); }
function selTab(t){ curTab=t; page=1; renderView(); }
let _invSearchTimer: ReturnType<typeof setTimeout> | null = null;
function invSearch(v){
  qFilter=v; page=1;
  // Re-rendering the whole table on every keystroke lags on large catalogues.
  // Debounce the re-render; the input stays responsive because it isn't replaced between keystrokes.
  if(_invSearchTimer) clearTimeout(_invSearchTimer);
  _invSearchTimer=setTimeout(()=>{
    _invSearchTimer=null;
    renderView();
    const f2=(document.getElementById('invSearch') as HTMLInputElement);
    if(f2){ f2.focus(); f2.setSelectionRange(f2.value.length,f2.value.length); }
  }, 180);
}
function pg(n){ page=n; renderView(); }
function bindInv(){ /* re-focus handled in invSearch */ }

function recentMovementsHTML(){
  const ms=state.movements.slice().sort((a,b)=>(b.date+b.time).localeCompare(a.date+a.time)).slice(0,6);
  const dcls={IN:'d-in',OUT:'d-out',TRANSFER:'d-xfer',CONSUME:'d-cons',RESERVE:'d-resv'};
  const label={IN:'Stock In',OUT:'Stock Out',TRANSFER:'Transfer',CONSUME:'Consumption',RESERVE:'Reservation'};
  return ms.map(m=>{
    const it=item(m.code); const nm=it?it.name:m.code;
    let sub='';
    if(m.type==='IN') sub=(m.from==='VENDOR'?('From: '+(m.ref||'Vendor')):m.ref||'');
    else if(m.type==='TRANSFER') sub=`${locName(m.from==='TRANSIT'?'TRANSIT':m.from)} → ${locName(m.transferTo||m.to)}`;
    else if(m.type==='OUT') sub='To: '+locName(m.to==='OUT'?(m.project||'Issued'):m.to);
    else if(m.type==='CONSUME') sub='Project: '+locName(m.project);
    return `<div class="mv"><span class="md ${dcls[m.type]||'d-in'}"></span>
      <div class="mb"><div class="t">${label[m.type]||m.type}</div><div class="d">${esc(nm)} · ${num(m.qty)} ${it?it.unit:''}</div>${sub?`<div class="s">${esc(sub)}</div>`:''}</div>
      <div class="mt">${fmtWhen(m.date,m.time)}</div></div>`;
  }).join('');
}
function fmtWhen(d,t){ const today=nowDate(); const dd=new Date(nowDate()); dd.setDate(dd.getDate()-1); const y=dd.toISOString().slice(0,10);
  if(d===today) return 'Today, '+to12(t); if(d===y) return 'Yesterday, '+to12(t); return new Date(d+'T00:00').toLocaleDateString('en-GB',{day:'2-digit',month:'short'}); }
function to12(t){ const m=(t||'').match(/^(\d{1,2}):(\d{2})/); if(!m) return t||''; let h=+m[1]; const ap=h>=12?'PM':'AM'; h=h%12||12; return h+':'+m[2]+' '+ap; }
function fullWhen(d,t){ const ds=new Date(d+'T00:00').toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}); return ds+(t?' '+to12(t):''); }

/* full-width Recent Movements table (movements + reservations merged) */
function recentMovementsTable(){
  const rows=[];
  state.movements.forEach(m=>rows.push({...m, sk:(m.date||'')+(m.time||'00:00')}));
  state.reservations.forEach(r=>rows.push({date:r.date,time:r.time||'',sk:(r.date||'')+(r.time||'00:00'),code:r.code,qty:r.qty,type:'RESERVE',from:r.location,to:r.project,project:r.project,ref:r.id,person:r.person}));
  rows.sort((a,b)=>b.sk.localeCompare(a.sk));
  const top=rows.slice(0,6);
  const meta={IN:['Stock In','d-in'],OUT:['Stock Out','d-out'],TRANSFER:['Transfer','d-xfer'],CONSUME:['Consumption','d-cons'],RESERVE:['Reserve','d-resv']};
  const fromTo=m=>{
    if(m.type==='IN') return `${esc(m.source||locName(m.from))} <span class="ar">→</span> ${locName(m.to)}`;
    if(m.type==='TRANSFER') return `${locName(m.from==='TRANSIT'?m.fromLoc:m.from)} <span class="ar">→</span> ${locName(m.transferTo||m.to)}`;
    if(m.type==='OUT') return `${locName(m.from)} <span class="ar">→</span> ${locName(m.to==='OUT'?(m.project||'Issued'):m.to)}`;
    if(m.type==='CONSUME') return `${locName(m.from)} <span class="ar">→</span> ${locName(m.project)}${m.activity?` (${esc(m.activity)})`:''}`;
    if(m.type==='RESERVE') return `${locName(m.from)} <span class="ar">→</span> ${locName(m.to)}`;
    return '';
  };
  const body=top.map(m=>{const it=item(m.code);const mt=meta[m.type]||['—','d-in'];return `<tr>
    <td class="muted nowrap">${fullWhen(m.date,m.time)}</td>
    <td class="mat"><b>${esc(it?it.name:m.code)}</b></td>
    <td><span class="mv-type"><i class="${mt[1]}"></i>${mt[0]}</span></td>
    <td class="qty2 nowrap">${num(m.qty)} ${it?it.unit:''}</td>
    <td class="nowrap">${fromTo(m)}</td>
    <td class="code">${esc(m.ref||'')}</td>
    <td class="muted">${esc(m.person||'')}</td></tr>`;}).join('') || `<tr class="empty-row"><td colspan="7">No movements yet.</td></tr>`;
  return `<table class="rm-table"><thead><tr><th>Date</th><th>Material</th><th>Type</th><th>Qty</th><th>From → To</th><th>Reference</th><th>By</th></tr></thead><tbody>${body}</tbody></table>`;
}

/* overflow menu beside Add Item */
function openMore(e){
  e.stopPropagation(); closeMenus();
  const wrap=e.target.closest('.more-wrap');
  const m=document.createElement('div'); m.className='menu';
  m.innerHTML=`<button onclick="openHistory()">${svg(IC.history)} Movement History</button>
    <button onclick="exportCSV()">${svg(IC.reports)} Export table (CSV)</button>
    <button onclick="openAddItem()">${svg(IC.plus)} Add Item</button>
    <button class="del" onclick="reset()">${svg(IC.history)} Reset demo data</button>`;
  wrap.appendChild(m);
}
document.addEventListener('click',e=>{ if(!(e.target as Element).closest('.more-wrap')) document.querySelectorAll('.more-wrap .menu').forEach(x=>x.remove()); });
function exportCSV(){
  const head=['Code','Material','Category','Unit','On Hand','Reserved','Available','Value','Status','Location'];
  const rows: CsvRow[]=[head];
  filteredItems().forEach(it=>{ const oh=onHand(it.code,curLoc); rows.push([it.code,it.name,it.category,it.unit,oh,reservedQty(it.code,curLoc),available(it.code,curLoc),oh*it.rate,statusOf(it,curLoc).t,loc(curLoc).name]); });
  const csv=rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  const a=document.createElement('a'); a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv); a.download='inventory-'+curLoc+'.csv'; document.body.appendChild(a); a.click(); a.remove();
  toast('Exported '+(rows.length-1)+' rows');
}

function pendingTransfersHTML(){
  const pend=state.movements.filter(m=>m.type==='TRANSFER'&&m.to==='TRANSIT'&&!m.received);
  if(!pend.length) return '';
  return `<div class="panel"><div class="rail-h"><h3>In Transit</h3></div>
    ${pend.map(m=>{const it=item(m.code);return `<div class="mv"><span class="md d-xfer"></span>
      <div class="mb"><div class="t">${esc(it?it.name:m.code)} · ${num(m.qty)} ${it?it.unit:''}</div><div class="s">${locName(m.fromLoc)} → ${locName(m.transferTo)}</div></div>
      <button class="btn sm" onclick="receiveTransfer('${m.id}')">Receive</button></div>`;}).join('')}</div>`;
}
function receiveTransfer(id){
  const m=state.movements.find(x=>x.id===id); if(!m||m.received) return;
  m.received=true;
  addMovement({code:m.code,qty:m.qty,from:'TRANSIT',to:m.transferTo,type:'TRANSFER',ref:(m.transferId||'TRF')+' received',person:COMPANY.user,fromLoc:m.fromLoc,transferId:m.transferId});
  save(); renderView(); toast('Transfer received at '+locName(m.transferTo));
}

/* ---------- row menu ---------- */
function rowMenu(e,code){
  e.stopPropagation(); closeMenus();
  const wrap=e.target.closest('.row-menu');
  const m=document.createElement('div'); m.className='menu';
  const c=jsid(code);
  m.innerHTML=`
    <button onclick="openStockIn('${c}')">${svg(IC.in)} Stock In</button>
    <button onclick="openStockOut('${c}')">${svg(IC.out)} Stock Out</button>
    <button onclick="openTransfer('${c}')">${svg(IC.xfer)} Transfer</button>
    <button onclick="openReserve('${c}')">${svg(IC.reserve)} Reserve</button>
    <button onclick="openConsume('${c}')">${svg(IC.consume)} Consume</button>
    <button onclick="openHistory('${c}')">${svg(IC.history)} Movements</button>
    <button onclick="openEditItem('${c}')">${svg(IC.edit)} Edit item</button>
    <button class="del" onclick="delItem('${c}')">${svg(IC.trash)} Delete item</button>`;
  wrap.appendChild(m);
}
function closeMenus(){ document.querySelectorAll('.menu').forEach(m=>m.remove()); }
document.addEventListener('click',e=>{ if(!(e.target as Element).closest('.row-menu')) closeMenus(); });

/* ---------- modal framework ---------- */
function openModal(html){ const l=document.getElementById('layer'); l.innerHTML=`<div class="scrim" onclick="closeModal()"></div>${html}`; l.classList.add('on'); }
function closeModal(){ const l=document.getElementById('layer'); l.classList.remove('on'); l.innerHTML=''; }
function val(id){ const e=(document.getElementById(id) as HTMLInputElement); return e?e.value.trim():''; }
function numVal(id){ return Number(val(id))||0; }
function itemOptions(sel,filterType){ return state.items.filter(i=>!filterType||i.type===filterType).map(i=>`<option value="${i.code}" ${i.code===sel?'selected':''}>${i.code} — ${esc(i.name)}</option>`).join(''); }
function locOptions(sel){ return state.locations.map(l=>`<option value="${l.id}" ${l.id===sel?'selected':''}>${esc(l.name)}</option>`).join(''); }
function siteOptions(sel?){ return sites().map(l=>`<option value="${l.id}" ${l.id===sel?'selected':''}>${esc(l.name)}</option>`).join(''); }
function mh(icClass,icon,title,sub){ return `<div class="m-head"><div class="mh-ic ${icClass}" style="background:var(--blue-l);color:var(--blue)">${svg(icon)}</div><div><h3>${title}</h3><p>${sub}</p></div><button class="x" onclick="closeModal()">×</button></div>`; }

/* ---------- Stock In ---------- */
function openStockIn(code){
  openModal(`<div class="modal">${mh('',''+IC.in,'Stock In','Record materials received into a location')}
    <div class="m-body"><div class="grid2">
      <div class="fld col2"><label>Item <span class="req">*</span></label><select class="f" id="si-code">${itemOptions(code,null)}</select></div>
      <div class="fld"><label>Quantity <span class="req">*</span></label><input class="f" id="si-qty" type="number" min="0" placeholder="0"></div>
      <div class="fld"><label>Into location <span class="req">*</span></label><select class="f" id="si-loc">${locOptions(curLoc)}</select></div>
      <div class="fld"><label>Date</label><input class="f" id="si-date" type="date" value="${nowDate()}"></div>
      <div class="fld"><label>Source / Reference</label><input class="f" id="si-ref" placeholder="Vendor, invoice no.…"></div>
      <div class="fld col2"><label>Received by</label><input class="f" id="si-person" value="${COMPANY.user}"></div>
    </div></div>
    <div class="m-foot"><button class="btn ghost" onclick="closeModal()">Cancel</button><button class="btn" onclick="submitStockIn()">Record Stock In</button></div></div>`);
}
function submitStockIn(){
  const code=val('si-code'), qty=numVal('si-qty'); if(!code||qty<=0) return toast('Enter a valid quantity');
  addMovement({code,qty,from:'VENDOR',to:val('si-loc'),type:'IN',ref:val('si-ref')||'Stock in',person:val('si-person')||COMPANY.user,date:val('si-date')});
  save(); closeModal(); renderView(); toast(num(qty)+' '+itemUnit(code)+' of '+itemLabel(code)+' added');
}

/* ---------- Stock Out ---------- */
function openStockOut(code){
  openModal(`<div class="modal">${mh('',IC.out,'Stock Out','Issue or write off stock from a location')}
    <div class="m-body"><div class="grid2">
      <div class="fld col2"><label>Item <span class="req">*</span></label><select class="f" id="so-code" onchange="soAvail()">${itemOptions(code,null)}</select></div>
      <div class="fld"><label>Quantity <span class="req">*</span></label><input class="f" id="so-qty" type="number" min="0" placeholder="0"></div>
      <div class="fld"><label>From location <span class="req">*</span></label><select class="f" id="so-loc" onchange="soAvail()">${locOptions(curLoc)}</select></div>
      <div class="fld"><label>Reason</label><select class="f" id="so-reason"><option value="OUT">Issued / Dispatched</option><option value="CONSUMED">Consumed</option><option value="OUT">Damaged / Written off</option></select></div>
      <div class="fld"><label>Date</label><input class="f" id="so-date" type="date" value="${nowDate()}"></div>
      <div class="fld"><label>Reference</label><input class="f" id="so-ref" placeholder="Note / ref"></div>
      <div class="fld col2"><label>Issued by</label><input class="f" id="so-person" value="${COMPANY.user}"></div>
    </div><div class="hint">${svg(IC.inventory)}<div>On hand at selected location: <b id="so-oh">—</b></div></div></div>
    <div class="m-foot"><button class="btn ghost" onclick="closeModal()">Cancel</button><button class="btn danger" onclick="submitStockOut()">Record Stock Out</button></div></div>`);
  soAvail();
}
function soAvail(){ const c=val('so-code'), l=val('so-loc'); const e=document.getElementById('so-oh'); if(e&&c&&l) e.textContent=num(onHand(c,l))+' '+itemUnit(c); }
function submitStockOut(){
  const code=val('so-code'), qty=numVal('so-qty'), l=val('so-loc'); if(!code||qty<=0) return toast('Enter a valid quantity');
  if(qty>onHand(code,l)) return toast('Not enough stock — only '+num(onHand(code,l))+' available');
  addMovement({code,qty,from:l,to:val('so-reason'),type:'OUT',ref:val('so-ref')||'Stock out',person:val('so-person')||COMPANY.user,date:val('so-date')});
  save(); closeModal(); renderView(); toast(num(qty)+' '+itemUnit(code)+' of '+itemLabel(code)+' issued');
}

/* ---------- Transfer ---------- */
function openTransfer(code){
  openModal(`<div class="modal">${mh('',IC.xfer,'Site Transfer','Move stock between any two locations')}
    <div class="m-body"><div class="grid2">
      <div class="fld col2"><label>Item <span class="req">*</span></label><select class="f" id="tr-code" onchange="trAvail()">${itemOptions(code,null)}</select></div>
      <div class="fld"><label>From <span class="req">*</span></label><select class="f" id="tr-from" onchange="trAvail()">${locOptions(curLoc)}</select></div>
      <div class="fld"><label>To <span class="req">*</span></label><select class="f" id="tr-to">${locOptions(curLoc==='WH-MAIN'?'ST-SKCL':'WH-MAIN')}</select></div>
      <div class="fld"><label>Quantity <span class="req">*</span></label><input class="f" id="tr-qty" type="number" min="0" placeholder="0"></div>
      <div class="fld"><label>Date</label><input class="f" id="tr-date" type="date" value="${nowDate()}"></div>
      <div class="fld col2"><label>Dispatched by</label><input class="f" id="tr-person" value="Warehouse"></div>
    </div><div class="hint">${svg(IC.xfer)}<div>On dispatch, stock moves to <b>In Transit</b> until received at the destination. Available at source: <b id="tr-oh">—</b></div></div></div>
    <div class="m-foot"><button class="btn ghost" onclick="closeModal()">Cancel</button><button class="btn" onclick="submitTransfer()">Dispatch Transfer</button></div></div>`);
  trAvail();
}
function trAvail(){ const c=val('tr-code'),l=val('tr-from'); const e=document.getElementById('tr-oh'); if(e&&c&&l) e.textContent=num(onHand(c,l))+' '+itemUnit(c); }
function submitTransfer(){
  const code=val('tr-code'), qty=numVal('tr-qty'), from=val('tr-from'), to=val('tr-to');
  if(!code||qty<=0) return toast('Enter a valid quantity');
  if(from===to) return toast('Pick two different locations');
  if(qty>onHand(code,from)) return toast('Not enough stock at source');
  const tid=nextId('TRF-00','movements','transferId');
  addMovement({code,qty,from,to:'TRANSIT',type:'TRANSFER',ref:tid+' → '+locName(to),person:val('tr-person')||'Warehouse',date:val('tr-date'),transferTo:to,transferId:tid,fromLoc:from,received:false});
  save(); closeModal(); renderView(); toast('Dispatched '+num(qty)+' '+itemUnit(code)+' — in transit to '+locName(to));
}

/* ---------- Reserve ---------- */
function openReserve(code){
  openModal(`<div class="modal">${mh('',IC.reserve,'Reserve Material','Hold available stock for a project')}
    <div class="m-body"><div class="grid2">
      <div class="fld col2"><label>Item <span class="req">*</span></label><select class="f" id="rs-code" onchange="rsAvail()">${itemOptions(code,null)}</select></div>
      <div class="fld"><label>Quantity <span class="req">*</span></label><input class="f" id="rs-qty" type="number" min="0" placeholder="0"></div>
      <div class="fld"><label>At location <span class="req">*</span></label><select class="f" id="rs-loc" onchange="rsAvail()">${locOptions(curLoc)}</select></div>
      <div class="fld col2"><label>For project <span class="req">*</span></label><select class="f" id="rs-proj">${siteOptions()}</select></div>
      <div class="fld"><label>Date</label><input class="f" id="rs-date" type="date" value="${nowDate()}"></div>
      <div class="fld"><label>Reserved by</label><input class="f" id="rs-person" value="${COMPANY.user}"></div>
      <div class="fld col2"><label>Note</label><input class="f" id="rs-note" placeholder="Activity / purpose"></div>
    </div><div class="hint">${svg(IC.reserve)}<div>Available to reserve: <b id="rs-av">—</b></div></div></div>
    <div class="m-foot"><button class="btn ghost" onclick="closeModal()">Cancel</button><button class="btn" onclick="submitReserve()">Reserve</button></div></div>`);
  rsAvail();
}
function rsAvail(){ const c=val('rs-code'),l=val('rs-loc'); const e=document.getElementById('rs-av'); if(e&&c&&l) e.textContent=num(available(c,l))+' '+itemUnit(c); }
function submitReserve(){
  const code=val('rs-code'), qty=numVal('rs-qty'), l=val('rs-loc');
  if(!code||qty<=0) return toast('Enter a valid quantity');
  if(qty>available(code,l)) return toast('Only '+num(available(code,l))+' available to reserve');
  state.reservations.push({id:nextId('RSV-00','reservations'),date:val('rs-date'),code,qty,location:l,project:val('rs-proj'),person:val('rs-person')||COMPANY.user,status:'active',note:val('rs-note')});
  save(); closeModal(); renderView(); toast('Reserved '+num(qty)+' '+itemUnit(code)+' for '+locName(val('rs-proj')));
}

/* ---------- Consume ---------- */
function openConsume(code){
  openModal(`<div class="modal">${mh('',IC.consume,'Record Consumption','Log materials used on site')}
    <div class="m-body"><div class="grid2">
      <div class="fld col2"><label>Item <span class="req">*</span></label><select class="f" id="cs-code" onchange="csAvail()">${itemOptions(code,null)}</select></div>
      <div class="fld"><label>Quantity <span class="req">*</span></label><input class="f" id="cs-qty" type="number" min="0" placeholder="0"></div>
      <div class="fld"><label>At location <span class="req">*</span></label><select class="f" id="cs-loc" onchange="csAvail()">${locOptions(curLoc)}</select></div>
      <div class="fld"><label>Project</label><select class="f" id="cs-proj">${siteOptions(curLoc!=='WH-MAIN'?curLoc:'')}</select></div>
      <div class="fld"><label>Job Cost project</label><select class="f" id="cs-jcproj">${(typeof jcr!=='undefined'?(jcr.projects||[]).filter(p=>!p.archived):[]).map(p=>`<option value="${p.id}" ${p.id===jcr.currentProjectId?'selected':''}>${esc(p.name)} (${esc(p.jobCode)})</option>`).join('')}</select></div>
      <div class="fld"><label>Cost code (Job Cost)</label><select class="f" id="cs-costcode"><option value="">— none —</option>${(typeof jcr!=='undefined'?jcr.costCodes:[]).map(c=>`<option value="${c.code}">${c.code} — ${esc(c.desc)}</option>`).join('')}</select></div>
      <div class="fld"><label>Activity</label><input class="f" id="cs-act" placeholder="e.g. Foundation, Slab"></div>
      <div class="fld"><label>Date</label><input class="f" id="cs-date" type="date" value="${nowDate()}"></div>
      <div class="fld col2"><label>Recorded by</label><input class="f" id="cs-person" value="Site Engineer"></div>
    </div><div class="hint">${svg(IC.consume)}<div>On hand: <b id="cs-oh">—</b> · reduces stock and, with a cost code, posts a Materials entry to the project's Job Cost ledger.</div></div></div>
    <div class="m-foot"><button class="btn ghost" onclick="closeModal()">Cancel</button><button class="btn" onclick="submitConsume()">Record Consumption</button></div></div>`);
  csAvail();
}
function csAvail(){ const c=val('cs-code'),l=val('cs-loc'); const e=document.getElementById('cs-oh'); if(e&&c&&l) e.textContent=num(onHand(c,l))+' '+itemUnit(c); }
function submitConsume(){
  const code=val('cs-code'), qty=numVal('cs-qty'), l=val('cs-loc');
  if(!code||qty<=0) return toast('Enter a valid quantity');
  if(qty>onHand(code,l)) return toast('Not enough stock — only '+num(onHand(code,l))+' on hand');
  const costCode=val('cs-costcode'), act=val('cs-act'), dt=val('cs-date');
  addMovement({code,qty,from:l,to:'CONSUMED',type:'CONSUME',ref:act||'Consumption',person:val('cs-person')||'Site Engineer',date:dt,project:val('cs-proj'),activity:act,costCode});
  // auto-release matching reservation
  let left=qty; state.reservations.filter(r=>r.status==='active'&&r.code===code&&r.location===l&&r.project===val('cs-proj')).forEach(r=>{ if(left<=0)return; const take=Math.min(left,r.qty); r.qty-=take; left-=take; if(r.qty<=0) r.status='released'; });
  // inventory → Job Cost: post a Materials cost entry linked to this consumption (traceable, no double counting of purchases/transfers)
  if(costCode && typeof jcr!=='undefined'){
    const it=item(code), amt=qty*(it.rate||0);
    const jcPid=val('cs-jcproj')||curProject().id;
    jcr.entries.push({ id:jcNextId('CE-',jcr.entries), projectId:jcPid, category:'Materials', date:dt||nowDate(), billNo:'', desc:it.name+' — consumed', code:costCode, head:it.category, unit:it.unit, qty, rate:it.rate||0, amount:amt, source:'Inventory consumption ('+code+')', createdBy:val('cs-person')||'Site Engineer', createdAt:new Date().toISOString() });
    jcAudit('consume→cost', code+' ₹'+Math.round(amt)+' → '+costCode+' ['+jcPid+']'); jcSave();
  }
  save(); closeModal(); renderView(); toast('Consumed '+num(qty)+' '+itemUnit(code)+' of '+itemLabel(code)+(costCode?' · posted to Job Cost '+costCode:''));
}

/* ---------- Add / Edit item ---------- */
function openAddItem(){ itemForm(null); }
function openEditItem(code){ itemForm(item(code)); }
function itemForm(it){
  const types=[['material','Material'],['container','Container'],['equipment','Equipment']];
  openModal(`<div class="modal">${mh('',IC.inventory,it?'Edit Item':'Add Item',it?'Update the item master record':'Create a new item master record')}
    <div class="m-body"><div class="grid2">
      <div class="fld"><label>Item code <span class="req">*</span></label><input class="f" id="it-code" value="${it?esc(it.code):''}" ${it?'readonly':''} placeholder="e.g. CEM-003"></div>
      <div class="fld"><label>Type</label><select class="f" id="it-type">${types.map(t=>`<option value="${t[0]}" ${it&&it.type===t[0]?'selected':''}>${t[1]}</option>`).join('')}</select></div>
      <div class="fld col2"><label>Name <span class="req">*</span></label><input class="f" id="it-name" value="${it?esc(it.name):''}" placeholder="Material / equipment name"></div>
      <div class="fld"><label>Category</label><select class="f" id="it-cat">${CATEGORIES.map(c=>`<option ${it&&it.category===c?'selected':''}>${c}</option>`).join('')}</select></div>
      <div class="fld"><label>Unit</label><input class="f" id="it-unit" value="${it?esc(it.unit):''}" placeholder="bag, kg, nos…"></div>
      <div class="fld"><label>Rate (₹)</label><input class="f" id="it-rate" type="number" min="0" value="${it?it.rate:''}"></div>
      <div class="fld"><label>Reorder level</label><input class="f" id="it-reorder" type="number" min="0" value="${it?it.reorder:''}"></div>
      ${it?'':`<div class="fld"><label>Opening qty</label><input class="f" id="it-open" type="number" min="0" placeholder="0"></div>
      <div class="fld"><label>At location</label><select class="f" id="it-oploc">${locOptions(curLoc)}</select></div>`}
    </div></div>
    <div class="m-foot"><button class="btn ghost" onclick="closeModal()">Cancel</button><button class="btn" onclick="submitItem(${it?`'${jsid(it.code)}'`:'null'})">${it?'Save changes':'Add item'}</button></div></div>`);
}
/** Codes/ids are embedded in inline handlers, so restrict them to a safe charset at entry. */
const CODE_RE=/^[A-Za-z0-9 _.\/-]+$/;
function submitItem(editing){
  const code=val('it-code'), name=val('it-name'); if(!code||!name) return toast('Code and name are required');
  if(!editing && !CODE_RE.test(code)) return toast('Item code can use letters, numbers, spaces and . _ - / only');
  if(!editing && item(code)) return toast('That item code already exists');
  const rec={code,name,category:val('it-cat'),unit:val('it-unit')||'nos',rate:numVal('it-rate'),reorder:numVal('it-reorder'),type:val('it-type')};
  if(editing){ Object.assign(item(editing),rec); toast('Item updated'); }
  else{ state.items.push(rec); const op=numVal('it-open'); if(op>0) addMovement({code,qty:op,from:'OPENING',to:val('it-oploc'),type:'IN',ref:'Opening balance',person:COMPANY.user}); toast('Item '+code+' added'); }
  save(); closeModal(); renderView();
}
function delItem(code){ if(!confirm('Delete item '+code+'? Its movement history stays in the ledger.')) return; state.items=state.items.filter(i=>i.code!==code); save(); renderView(); toast('Item deleted'); }

/* ---------- Purchase Orders ---------- */
let poLineN=0;
function openPOList(){
  const rows=state.purchaseOrders.slice().reverse().map(po=>{
    const v=vendor(po.vendorId); const total=po.lines.reduce((s,l)=>s+l.qty*l.rate,0);
    const sc={Draft:'c-out',Sent:'c-low',Acknowledged:'c-resv',Received:'c-normal'}[po.status]||'c-resv';
    return `<tr><td class="code">${po.id}</td><td class="mat"><b>${esc(v?v.name:'—')}</b><div style="color:var(--muted);font-size:12px">${po.lines.map(l=>item(l.code)?item(l.code).name:l.code).join(', ')}</div></td>
      <td>${new Date(po.date+'T00:00').toLocaleDateString('en-GB',{day:'2-digit',month:'short'})}</td>
      <td class="num">${money(total)}</td><td><span class="chip ${sc}"><i></i>${po.status}</span></td>
      <td class="r">${po.status!=='Received'?`<button class="btn sm" onclick="receivePO('${po.id}')">Receive</button>`:'<span style="color:var(--green);font-weight:700;font-size:12px">Goods received</span>'}</td></tr>`;
  }).join('');
  openModal(`<div class="modal wide">${mh('',IC.po,'Purchase Orders','Vendor orders for externally purchased materials')}
    <div class="m-body" style="padding-top:8px">
      <div style="display:flex;justify-content:flex-end;margin-bottom:12px"><button class="btn" onclick="openPOForm()">${svg(IC.plus)} New Purchase Order</button></div>
      <table class="mv-table"><thead><tr><th>PO No.</th><th>Vendor / Items</th><th>Date</th><th class="r">Value</th><th>Status</th><th></th></tr></thead>
      <tbody>${rows||'<tr class="empty-row"><td colspan="6">No purchase orders yet.</td></tr>'}</tbody></table>
    </div></div>`);
}
function openPOForm(){
  poLineN=0;
  openModal(`<div class="modal wide">${mh('',IC.po,'New Purchase Order','Raise a PO to a vendor')}
    <div class="m-body"><div class="grid2">
      <div class="fld"><label>Vendor <span class="req">*</span></label><select class="f" id="po-vendor">${state.vendors.map(v=>`<option value="${v.id}">${esc(v.name)}</option>`).join('')}</select></div>
      <div class="fld"><label>Deliver to</label><select class="f" id="po-loc">${locOptions('WH-MAIN')}</select></div>
      <div class="fld"><label>Date</label><input class="f" id="po-date" type="date" value="${nowDate()}"></div>
      <div class="fld"><label>Status</label><select class="f" id="po-status"><option>Draft</option><option selected>Sent</option><option>Acknowledged</option></select></div>
    </div>
    <label style="margin-top:4px">Items</label>
    <div id="po-lines"></div>
    <button class="btn ghost sm" onclick="addPOLine()" style="margin-top:4px">${svg(IC.plus)} Add line</button>
    </div>
    <div class="m-foot"><button class="btn ghost" onclick="closeModal()">Cancel</button><button class="btn" onclick="submitPO()">Create PO</button></div></div>`);
  addPOLine();
}
function addPOLine(){
  const i=poLineN++; const wrap=document.getElementById('po-lines');
  const d=document.createElement('div'); d.className='po-line'; d.id='pol-'+i;
  d.innerHTML=`<select id="pol-code-${i}">${itemOptions(null,null)}</select>
    <input id="pol-qty-${i}" type="number" min="0" placeholder="Qty">
    <input id="pol-rate-${i}" type="number" min="0" placeholder="Rate" value="">
    <button class="xrow" onclick="this.parentNode.remove()">×</button>`;
  wrap.appendChild(d);
  const sel=(document.getElementById('pol-code-'+i) as HTMLInputElement); sel.onchange=()=>{ const it=item(sel.value); (document.getElementById('pol-rate-'+i) as HTMLInputElement).value=it?String(it.rate):''; };
  const it0=item(sel.value); (document.getElementById('pol-rate-'+i) as HTMLInputElement).value=it0?String(it0.rate):'';
}
function submitPO(){
  const lines=[];
  document.querySelectorAll('#po-lines .po-line').forEach(row=>{ const i=row.id.split('-')[1]; const code=(document.getElementById('pol-code-'+i) as HTMLInputElement).value; const qty=Number((document.getElementById('pol-qty-'+i) as HTMLInputElement).value)||0; const rate=Number((document.getElementById('pol-rate-'+i) as HTMLInputElement).value)||0; if(code&&qty>0) lines.push({code,qty,rate}); });
  if(!lines.length) return toast('Add at least one item line');
  const id=nextId('PO-2026-0','purchaseOrders');
  state.purchaseOrders.push({id,date:val('po-date'),vendorId:val('po-vendor'),status:val('po-status'),deliverTo:val('po-loc'),lines});
  save(); closeModal(); openPOList(); toast('Purchase order '+id+' created');
}
function receivePO(id){
  const po=state.purchaseOrders.find(p=>p.id===id); if(!po) return;
  const v=vendor(po.vendorId);
  po.lines.forEach(l=>addMovement({code:l.code,qty:l.qty,from:'VENDOR',to:po.deliverTo||'WH-MAIN',type:'IN',ref:po.id+' · '+(v?v.name:''),person:COMPANY.user}));
  po.status='Received'; save(); openPOList(); renderView(); toast('Goods received against '+id);
}

/* ---------- Movement history ---------- */
function openHistory(code){
  const render=(q)=>{
    let ms=state.movements.slice().sort((a,b)=>(b.date+b.time).localeCompare(a.date+a.time));
    if(code) ms=ms.filter(m=>m.code===code);
    if(q){ q=q.toLowerCase(); ms=ms.filter(m=>{ const it=item(m.code); return (m.code+' '+(it?it.name:'')+' '+(m.ref||'')+' '+m.type+' '+locName(m.from)+' '+locName(m.to)).toLowerCase().includes(q); }); }
    const typeLbl={IN:'Stock In',OUT:'Stock Out',TRANSFER:'Transfer',CONSUME:'Consumption'};
    return ms.slice(0,200).map(m=>{ const it=item(m.code); return `<tr>
      <td>${fmtWhen(m.date,m.time)}</td><td class="code">${m.code}</td><td class="mat"><b>${esc(it?it.name:m.code)}</b></td>
      <td class="num qty">${num(m.qty)} ${it?it.unit:''}</td>
      <td>${locName(m.from)} <span style="color:var(--dim)">→</span> ${m.to==='TRANSIT'&&m.transferTo?locName(m.transferTo)+' (transit)':locName(m.to)}</td>
      <td><span class="chip ${({IN:'c-normal',OUT:'c-out',TRANSFER:'c-resv',CONSUME:'c-use'})[m.type]||'c-normal'}"><i></i>${typeLbl[m.type]||m.type}</span></td>
      <td style="color:var(--muted)">${esc(m.ref||'')}</td><td style="color:var(--muted)">${esc(m.person||'')}</td></tr>`; }).join('')
      || '<tr class="empty-row"><td colspan="8">No movements found.</td></tr>';
  };
  openModal(`<div class="modal wide">${mh('',IC.history,'Movement History',(code?itemLabel(code)+' — ':'')+'complete audit trail of every stock change')}
    <div class="m-body" style="padding-top:10px">
      <div class="f-search" style="margin-bottom:12px">${svg(IC.search)}<input class="f" id="hist-q" placeholder="Search item, reference, location, type…" oninput="document.getElementById('hist-body').innerHTML=window._histRender(this.value)" style="padding-left:36px"></div>
      <div style="max-height:52vh;overflow:auto"><table class="mv-table"><thead><tr><th>When</th><th>Code</th><th>Material</th><th class="r">Qty</th><th>Movement</th><th>Type</th><th>Reference</th><th>By</th></tr></thead><tbody id="hist-body">${render('')}</tbody></table></div>
    </div></div>`);
  window._histRender=render;
}

/* ---------- Reports / Vendors / placeholder ---------- */
/* ============================================================
   REPORTS & ANALYSIS — sales, procurement, projects, inventory.
   Every figure is computed live from the stores; each tab exports CSV.
   ============================================================ */
let repTab='monthly';
let repMonth='';   // '' → latest month with activity
let repRange=6;    // trends window, in months
function setRepRange(n){ repRange=n; renderView(); }
/** round a max up to a clean 1/2/5 × 10^k gridline value */
function niceMax(v){ if(v<=0) return 1; const p=Math.pow(10,Math.floor(Math.log10(v))); const r=v/p; const m=r<=1?1:r<=2?2:r<=5?5:10; return m*p; }
/** short money for chart axes: ₹x.x Cr / ₹x.x L / ₹n */
function fmtShort(n){ n=Math.round(n); if(Math.abs(n)>=1e7) return '₹'+(n/1e7).toFixed(1)+'Cr'; if(Math.abs(n)>=1e5) return '₹'+(n/1e5).toFixed(1)+'L'; if(Math.abs(n)>=1e3) return '₹'+(n/1e3).toFixed(0)+'k'; return '₹'+n; }
const _iso=d=>d.toISOString().slice(0,10);
/** time buckets over the last `months` months: weekly for short windows, else monthly */
function repBins(months){
  const end=new Date(nowDate()); const start=new Date(end); start.setMonth(start.getMonth()-months); start.setDate(start.getDate()+1);
  const weekly=months<=2;
  const bins: {from:string;to:string;ym?:string;label:string}[]=[];
  const MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  if(weekly){
    let s=new Date(start);
    while(s<=end){ const e=new Date(s); e.setDate(e.getDate()+6); bins.push({from:_iso(s),to:_iso(e),label:s.getDate()+' '+MON[s.getMonth()]}); s=new Date(e); s.setDate(s.getDate()+1); }
  } else {
    let y=start.getFullYear(), m=start.getMonth(); const ey=end.getFullYear(), em=end.getMonth();
    while(y<ey||(y===ey&&m<=em)){ const ym=y+'-'+String(m+1).padStart(2,'0'); bins.push({from:ym+'-01',to:ym+'-31',ym,label:MON[m]+" '"+String(y).slice(2)}); m++; if(m>11){m=0;y++;} }
  }
  return {bins,weekly};
}
/** sum records into the time bins */
function repBucket(records, dateFn, valFn, bins, weekly){
  const out=bins.map(()=>0);
  (records||[]).forEach(r=>{ const d=dateFn(r); if(!d) return; const ds=String(d).slice(0,10);
    if(weekly){ for(let i=0;i<bins.length;i++){ if(ds>=bins[i].from&&ds<=bins[i].to){ out[i]+=valFn(r)||0; break; } } }
    else { const ym=ds.slice(0,7); const i=bins.findIndex(b=>b.ym===ym); if(i>=0) out[i]+=valFn(r)||0; }
  });
  return out;
}
/** MATLAB-style multi-series line chart (SVG, theme-aware) */
function tsChart(title, labels, series, isMoney){
  const W=760,H=280,padL=66,padR=18,padT=14,padB=46, iw=W-padL-padR, ih=H-padT-padB;
  const nice=niceMax(Math.max(1,...series.flatMap(s=>s.data)));
  const n=labels.length;
  const X=i=>n>1?padL+i*(iw/(n-1)):padL+iw/2;
  const Y=v=>padT+ih-(v/nice)*ih;
  let grid='';
  for(let g=0;g<=4;g++){ const val=nice/4*g, yy=Y(val); grid+=`<line x1="${padL}" y1="${yy.toFixed(1)}" x2="${W-padR}" y2="${yy.toFixed(1)}" stroke="var(--line2)"/><text x="${(padL-8).toFixed(0)}" y="${(yy+4).toFixed(1)}" text-anchor="end" class="ts-ax">${isMoney?fmtShort(val):(+val.toFixed(0))}</text>`; }
  const step=Math.max(1,Math.ceil(n/9)); let xl='';
  labels.forEach((lb,i)=>{ if(i%step===0||i===n-1) xl+=`<text x="${X(i).toFixed(1)}" y="${(H-padB+18).toFixed(0)}" text-anchor="middle" class="ts-ax">${esc(lb)}</text>`; });
  const draw=series.map(s=>{
    const d=s.data.map((v,i)=>(i?'L':'M')+X(i).toFixed(1)+' '+Y(v).toFixed(1)).join(' ');
    const mk=s.data.map((v,i)=>`<circle cx="${X(i).toFixed(1)}" cy="${Y(v).toFixed(1)}" r="2.6" fill="${s.color}"><title>${esc(s.name)} · ${esc(labels[i])}: ${isMoney?money(v):v}</title></circle>`).join('');
    return `<path d="${d}" fill="none" stroke="${s.color}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>${mk}`;
  }).join('');
  const legend=series.map(s=>`<span class="ts-leg"><i style="background:${s.color}"></i>${esc(s.name)}</span>`).join('');
  return `<div class="panel"><div class="inv-head"><h2>${esc(title)}</h2><div class="ts-legend">${legend}</div></div>
    <div style="padding:8px 12px 14px"><svg viewBox="0 0 ${W} ${H}" class="ts-chart" preserveAspectRatio="xMidYMid meet" role="img">
      <line x1="${padL}" y1="${padT}" x2="${padL}" y2="${(padT+ih).toFixed(0)}" stroke="var(--line)"/>${grid}${draw}${xl}</svg></div></div>`;
}
function setRepTab(t){ repTab=t; renderView(); window.scrollTo(0,0); }
function setRepMonth(m){ repMonth=m; renderView(); }
/** step a YYYY-MM back by k months */
function ymMinus(ym,k){ let [y,m]=ym.split('-').map(Number); m-=k; while(m<=0){ m+=12; y--; } return y+'-'+String(m).padStart(2,'0'); }
/** every YYYY-MM that has any dated activity, newest first */
function repMonthsList(){
  const set=new Set<string>();
  const add=d=>{ const ym=String(d||'').slice(0,7); if(/^\d{4}-\d{2}$/.test(ym)) set.add(ym); };
  try{ (typeof BILL!=='undefined'?BILL.docs:[]).forEach(d=>add(d.date)); }catch{}
  try{ if(typeof MR!=='undefined'){ (MR.pos||[]).forEach(p=>add(p.date)); (MR.requests||[]).forEach(r=>add(r.date)); } }catch{}
  try{ if(typeof jcr!=='undefined') (jcr.entries||[]).forEach(e=>add(e.date)); }catch{}
  try{ (state.movements||[]).forEach(m=>add(m.date)); }catch{}
  return [...set].sort().reverse();
}
const repKpi=(v,l,c?)=>`<div class="loc-card" style="cursor:default"><div class="lc-qty"${c?` style="color:${c}"`:''}>${v}</div><div class="lc-sub" style="margin-top:8px">${esc(l)}</div></div>`;
/** horizontal labelled bar for the analysis panels */
function repBar(label,val,max,disp,color){
  color=color||'var(--blue)';
  return `<div style="display:flex;align-items:center;gap:14px;margin-bottom:12px"><div style="width:200px;font-weight:600;color:var(--muted);font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(label)}</div><div style="flex:1;height:12px;background:var(--bg);border-radius:6px;overflow:hidden"><div style="height:100%;width:${Math.max(0,Math.min(100,max?val/max*100:0))}%;background:${color};border-radius:6px"></div></div><div style="width:130px;text-align:right;font-weight:800">${disp}</div></div>`;
}
const MONADS=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const ymLabel=ym=>{ const [y,m]=ym.split('-'); return MONADS[(+m)-1]+" '"+y.slice(2); };

function reportsHTML(){
  const tabs=[['monthly','Monthly Review'],['trends','Trends (charts)'],['sales','Sales & Billing'],['procurement','Procurement'],['projects','Projects & Job Cost'],['inventory','Inventory']];
  let body='';
  if(repTab==='monthly') body=repMonthly();
  else if(repTab==='trends') body=repTrends();
  else if(repTab==='procurement') body=repProcurement();
  else if(repTab==='projects') body=repProjects();
  else if(repTab==='inventory') body=repInventory();
  else body=repSales();
  return `<div class="page-hero"><div class="ph-img"></div><div class="ph-grad"></div><div class="ph-body"><div class="ph-eyebrow">Reports &amp; Analysis</div><h1>Business Analytics</h1><p>Live analysis across sales, procurement, projects and inventory — export any view to CSV.</p></div></div>
    <div class="panel" style="padding:0"><div class="tabs" style="overflow-x:auto;padding:4px 10px">${tabs.map(t=>`<button class="tab ${repTab===t[0]?'active':''}" onclick="setRepTab('${t[0]}')">${t[1]}</button>`).join('')}
      <div style="margin-left:auto;align-self:center;display:flex;gap:8px">
        <button class="btn ghost sm" onclick="repExport()">${svg('<path d="M12 15V3M7 10l5 5 5-5"/><path d="M4 21h16"/>')} Export CSV</button>
        <button class="btn sm" onclick="generateStatsPDF()">${svg(IC.billing)} Statistical report (PDF)</button>
      </div></div></div>
    ${body}`;
}

/* ---- Monthly Review — one month across every module, for the team meeting ---- */
function repMonthly(){
  const months=repMonthsList();
  const ym=(repMonth && months.includes(repMonth)) ? repMonth : (months[0]||nowDate().slice(0,7));
  const inYM=d=>String(d||'').slice(0,7)===ym;
  const docs=(typeof BILL!=='undefined'?BILL.docs:[])||[];
  const T=d=>(typeof billTotals==='function')?billTotals(d).total:0;
  const poValue=p=>(p.lines||[]).reduce((s,l)=>s+(+l.qty||0)*(+l.rate||0),0);
  const mvVal=m=>((item(m.code)||{}).rate||0)*(+m.qty||0);

  // --- Sales / billing this month ---
  const invM=docs.filter(d=>d.type==='invoice'&&inYM(d.date));
  const invVal=invM.reduce((s,d)=>s+T(d),0);
  const collected=docs.filter(d=>d.type==='invoice'&&d.status==='Paid'&&inYM(d.date)).reduce((s,d)=>s+T(d),0);
  const quoM=docs.filter(d=>d.type==='quotation'&&inYM(d.date));
  const quoVal=quoM.reduce((s,d)=>s+T(d),0);
  const quoWon=quoM.filter(d=>d.status==='Accepted').length;

  // --- Procurement this month ---
  const posM=(typeof MR!=='undefined'?MR.pos:[]).filter(p=>inYM(p.date));
  const poVal=posM.reduce((s,p)=>s+poValue(p),0);
  const mrsM=(typeof MR!=='undefined'?MR.requests:[]).filter(r=>inYM(r.date)).length;
  let grnVal=0;
  (typeof MR!=='undefined'?MR.pos:[]).forEach(p=>(p.receipts||[]).forEach(rc=>{ if(inYM(rc.date)) (rc.lines||[]).forEach(rl=>{ const ln=(p.lines||[]).find(l=>l.code===rl.code); grnVal+=(+rl.qty||0)*(ln?+ln.rate||0:0); }); }));
  const byVendor: Record<string,number>={};
  posM.forEach(p=>{ const v=vendor(p.vendorId); const nm=v?v.name:(p.vendorId||'—'); byVendor[nm]=(byVendor[nm]||0)+poValue(p); });
  const vTop=Object.entries(byVendor).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const vMax=Math.max(1,...vTop.map(v=>v[1]));

  // --- Project cost incurred this month ---
  const entM=(typeof jcr!=='undefined'?jcr.entries:[]).filter(e=>!e.archived&&inYM(e.date));
  const costVal=entM.reduce((s,e)=>s+(e.amount||0),0);
  const byCat: Record<string,number>={};
  entM.forEach(e=>{ byCat[e.category||'Other']=(byCat[e.category||'Other']||0)+(e.amount||0); });
  const catRows=Object.entries(byCat).sort((a,b)=>b[1]-a[1]);
  const byProj: Record<string,number>={};
  entM.forEach(e=>{ const nm=(typeof projName==='function')?projName(e.projectId):e.projectId; byProj[nm]=(byProj[nm]||0)+(e.amount||0); });
  const pTop=Object.entries(byProj).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const pMax=Math.max(1,...pTop.map(p=>p[1]));

  // --- Inventory flow this month ---
  const mv=(state.movements||[]).filter(m=>inYM(m.date));
  const inflow=mv.filter(m=>m.type==='IN').reduce((s,m)=>s+mvVal(m),0);
  const consumed=mv.filter(m=>m.type==='CONSUME').reduce((s,m)=>s+mvVal(m),0);
  const issued=mv.filter(m=>m.type==='OUT').reduce((s,m)=>s+mvVal(m),0);

  // --- Tenders this month ---
  const tenders=(typeof TDR!=='undefined'?TDR.tenders:[])||[];
  const tSub=tenders.filter(t=>inYM(t.submittedDate)).length;
  const tWon=tenders.filter(t=>inYM(t.awardDate)).length;
  const tLost=tenders.filter(t=>(t.history||[]).some(h=>h.to==='Lost'&&inYM(h.at))).length;

  // --- 6-month trend ending at the selected month ---
  const trend=[5,4,3,2,1,0].map(k=>ymMinus(ym,k));
  const invOf=m=>docs.filter(d=>d.type==='invoice'&&String(d.date||'').slice(0,7)===m).reduce((s,d)=>s+T(d),0);
  const colOf=m=>docs.filter(d=>d.type==='invoice'&&d.status==='Paid'&&String(d.date||'').slice(0,7)===m).reduce((s,d)=>s+T(d),0);
  const poOf=m=>(typeof MR!=='undefined'?MR.pos:[]).filter(p=>String(p.date||'').slice(0,7)===m).reduce((s,p)=>s+poValue(p),0);
  const costOf=m=>(typeof jcr!=='undefined'?jcr.entries:[]).filter(e=>!e.archived&&String(e.date||'').slice(0,7)===m).reduce((s,e)=>s+(e.amount||0),0);
  const trendRows=trend.map(m=>`<tr${m===ym?' style="background:var(--blue-l);font-weight:700"':''}><td>${ymLabel(m)}</td><td class="r">${money(invOf(m))}</td><td class="r">${money(colOf(m))}</td><td class="r">${money(poOf(m))}</td><td class="r">${money(costOf(m))}</td><td class="r">${money(invOf(m)-costOf(m)-poOf(m))}</td></tr>`).join('');

  const monthOpts=months.map(m=>`<option value="${m}" ${m===ym?'selected':''}>${ymLabel(m)}</option>`).join('')||`<option>${ymLabel(ym)}</option>`;
  const miniPanel=(title,rows,maxv,color)=>`<div class="panel"><div class="inv-head"><h2>${title}</h2></div><div style="padding:16px 20px">${rows.length?rows.map(r=>repBar(r[0],r[1],maxv,money(r[1]),color)).join(''):'<div style="color:var(--muted)">No activity this month.</div>'}</div></div>`;

  return `<div class="panel" style="display:flex;align-items:center;gap:14px;padding:14px 20px;margin-bottom:4px">
      <span style="font-size:12px;font-weight:700;text-transform:uppercase;color:var(--dim)">Reporting month</span>
      <select class="f" style="min-width:170px;font-weight:600" onchange="setRepMonth(this.value)">${monthOpts}</select>
      <span style="color:var(--muted);font-size:13px;margin-left:auto">Snapshot for the team meeting — every figure is for ${ymLabel(ym)}</span></div>

    <div class="loc-row" style="grid-template-columns:repeat(4,1fr)">
      ${repKpi(money(invVal),'Invoiced',' var(--ink)')}${repKpi(money(collected),'Collected','var(--green)')}${repKpi(money(poVal),'Procurement (POs)','#a855f7')}${repKpi(money(costVal),'Project cost incurred','var(--blue)')}</div>
    <div class="loc-row" style="grid-template-columns:repeat(4,1fr)">
      ${repKpi(invM.length,'Invoices raised')}${repKpi(quoM.length+' · '+quoWon+' won','Quotations')}${repKpi(mrsM+' MR · '+posM.length+' PO','Requests / orders')}${repKpi(tSub+' / '+tWon+' / '+tLost,'Tenders sub/won/lost')}</div>

    <div class="panel"><div class="inv-head"><h2>6-month trend (to ${ymLabel(ym)})</h2></div>
      <div class="tbl-scroll"><table class="jc-tbl"><thead><tr><th>Month</th><th class="r">Invoiced</th><th class="r">Collected</th><th class="r">Procurement</th><th class="r">Project cost</th><th class="r">Net</th></tr></thead><tbody>${trendRows}</tbody></table></div>
      <div class="jc-hint" style="padding:10px 20px">Net = Invoiced − Project cost − Procurement spend (indicative cash direction, not accounting profit).</div></div>

    ${miniPanel('Project cost by category',catRows,Math.max(1,...catRows.map(c=>c[1])),'var(--blue)')}
    ${miniPanel('Project cost by project',pTop,pMax,'#34d399')}
    ${miniPanel('Procurement spend by vendor',vTop,vMax,'#a855f7')}

    <div class="panel"><div class="inv-head"><h2>Inventory flow — ${ymLabel(ym)}</h2></div>
      <table class="jc-tbl"><thead><tr><th>Movement</th><th class="r">Value</th></tr></thead><tbody>
        <tr><td><b>Stock received (IN)</b></td><td class="r b" style="color:var(--green)">${money(inflow)}</td></tr>
        <tr><td><b>Consumed on site</b></td><td class="r b">${money(consumed)}</td></tr>
        <tr><td><b>Issued out</b></td><td class="r b">${money(issued)}</td></tr>
        <tr><td>Movements recorded</td><td class="r">${mv.length}</td></tr>
      </tbody></table></div>`;
}

/* ---- Trends — plotted time series across every module, over a chosen window ---- */
function repTrends(){
  const ranges=[[1,'1M'],[2,'2M'],[3,'3M'],[6,'6M'],[12,'12M']];
  const {bins,weekly}=repBins(repRange);
  const labels=bins.map(b=>b.label);
  const docs=(typeof BILL!=='undefined'?BILL.docs:[])||[];
  const T=d=>(typeof billTotals==='function')?billTotals(d).total:0;
  const poValue=p=>(p.lines||[]).reduce((s,l)=>s+(+l.qty||0)*(+l.rate||0),0);
  const mvVal=m=>((item(m.code)||{}).rate||0)*(+m.qty||0);
  const pos=(typeof MR!=='undefined'?MR.pos:[])||[];
  const ents=(typeof jcr!=='undefined'?jcr.entries:[])||[];
  const mvs=(state.movements||[]);
  const tends=(typeof TDR!=='undefined'?TDR.tenders:[])||[];

  const invoiced=repBucket(docs.filter(d=>d.type==='invoice'),d=>d.date,T,bins,weekly);
  const collected=repBucket(docs.filter(d=>d.type==='invoice'&&d.status==='Paid'),d=>d.date,T,bins,weekly);
  const quoted  =repBucket(docs.filter(d=>d.type==='quotation'),d=>d.date,T,bins,weekly);
  const procure =repBucket(pos,p=>p.date,poValue,bins,weekly);
  const projCost=repBucket(ents.filter(e=>!e.archived),e=>e.date,e=>e.amount||0,bins,weekly);
  const received=repBucket(mvs.filter(m=>m.type==='IN'),m=>m.date,mvVal,bins,weekly);
  const consumed=repBucket(mvs.filter(m=>m.type==='CONSUME'),m=>m.date,mvVal,bins,weekly);
  const tSub=repBucket(tends,t=>t.submittedDate,()=>1,bins,weekly);
  const tWon=repBucket(tends,t=>t.awardDate,()=>1,bins,weekly);
  const net=invoiced.map((v,i)=>v-projCost[i]-procure[i]);

  const sum=a=>a.reduce((s,v)=>s+v,0);
  const C={blue:'#2563eb',green:'#16a34a',purple:'#a855f7',amber:'#d97706',red:'#dc2626',teal:'#0d9488'};
  const rangeBtns=ranges.map(r=>`<button class="seg-btn ${repRange===r[0]?'on':''}" onclick="setRepRange(${r[0]})">${r[1]}</button>`).join('');

  return `<div class="panel" style="display:flex;align-items:center;gap:14px;padding:14px 20px;margin-bottom:4px;flex-wrap:wrap">
      <span style="font-size:12px;font-weight:700;text-transform:uppercase;color:var(--dim)">Time window</span>
      <div class="seg">${rangeBtns}</div>
      <span style="color:var(--muted);font-size:13px;margin-left:auto">${weekly?'Weekly':'Monthly'} resolution · ${labels.length} points · last ${repRange} month${repRange===1?'':'s'}</span></div>
    <div class="loc-row" style="grid-template-columns:repeat(4,1fr)">
      ${repKpi(money(sum(invoiced)),'Invoiced (window)')}${repKpi(money(sum(procure)),'Procurement (window)','#a855f7')}${repKpi(money(sum(projCost)),'Project cost (window)','var(--blue)')}${repKpi(money(sum(net)),'Net direction',sum(net)>=0?'var(--green)':'#dc2626')}</div>
    ${tsChart('Revenue — invoiced vs collected',labels,[{name:'Invoiced',color:C.blue,data:invoiced},{name:'Collected',color:C.green,data:collected}],true)}
    ${tsChart('Sales pipeline — quotations raised',labels,[{name:'Quoted',color:C.teal,data:quoted}],true)}
    ${tsChart('Outflow — project cost vs procurement spend',labels,[{name:'Project cost',color:C.blue,data:projCost},{name:'Procurement',color:C.purple,data:procure}],true)}
    ${tsChart('Inventory flow — received vs consumed',labels,[{name:'Received',color:C.green,data:received},{name:'Consumed',color:C.amber,data:consumed}],true)}
    ${tsChart('Net cash direction (invoiced − cost − procurement)',labels,[{name:'Net',color:C.teal,data:net}],true)}
    ${tsChart('Tenders — submitted vs won',labels,[{name:'Submitted',color:C.blue,data:tSub},{name:'Won',color:C.green,data:tWon}],false)}`;
}

/* ---- Sales & Billing analysis (from BILL.docs) ---- */
function repSales(){
  const docs=(typeof BILL!=='undefined'?BILL.docs:[])||[];
  const T=d=>(typeof billTotals==='function')?billTotals(d).total:0;
  const sum=f=>docs.filter(f).reduce((s,d)=>s+T(d),0);
  const quoted=sum(d=>d.type==='quotation');
  const invoiced=sum(d=>d.type==='invoice');
  const paid=sum(d=>d.type==='invoice'&&d.status==='Paid');
  const outstanding=sum(d=>d.type==='invoice'&&!['Paid','Draft'].includes(d.status));
  const quotes=docs.filter(d=>d.type==='quotation');
  const won=quotes.filter(d=>d.status==='Accepted').length;
  const winRate=quotes.length?Math.round(won/quotes.length*100):0;
  // monthly invoiced trend
  const byMonth: Record<string,number>={};
  docs.filter(d=>d.type==='invoice').forEach(d=>{ const ym=(d.date||'').slice(0,7); if(ym) byMonth[ym]=(byMonth[ym]||0)+T(d); });
  const months=Object.keys(byMonth).sort().slice(-8);
  const mMax=Math.max(1,...months.map(m=>byMonth[m]));
  // top clients by invoiced value
  const byClient: Record<string,number>={};
  docs.filter(d=>d.type==='invoice').forEach(d=>{ const c=d.party||'—'; byClient[c]=(byClient[c]||0)+T(d); });
  const clients=Object.entries(byClient).sort((a,b)=>b[1]-a[1]).slice(0,6);
  const cMax=Math.max(1,...clients.map(c=>c[1]));
  const typeRow=(t,lbl)=>{ const ds=docs.filter(d=>d.type===t); return `<tr><td><b>${lbl}</b></td><td class="r">${ds.length}</td><td class="r b">${money(ds.reduce((s,d)=>s+T(d),0))}</td></tr>`; };
  return `<div class="loc-row" style="grid-template-columns:repeat(4,1fr)">
      ${repKpi(money(invoiced),'Total invoiced')}${repKpi(money(paid),'Collected (paid)','var(--green)')}${repKpi(money(outstanding),'Outstanding','#b45309')}${repKpi(winRate+'%','Quote win rate','var(--blue)')}</div>
    <div class="panel"><div class="inv-head"><h2>Invoiced by month</h2></div><div style="padding:18px 22px">
      ${months.length?months.map(m=>repBar(ymLabel(m),byMonth[m],mMax,money(byMonth[m]),'var(--blue)')).join(''):'<div style="color:var(--muted)">No invoices yet.</div>'}</div></div>
    <div class="panel"><div class="inv-head"><h2>Top clients by invoiced value</h2></div><div style="padding:18px 22px">
      ${clients.length?clients.map(c=>repBar(c[0],c[1],cMax,money(c[1]),'#34d399')).join(''):'<div style="color:var(--muted)">No client billing yet.</div>'}</div></div>
    <div class="panel"><div class="inv-head"><h2>By document type</h2></div>
      <table class="jc-tbl"><thead><tr><th>Type</th><th class="r">Count</th><th class="r">Value</th></tr></thead>
      <tbody>${typeRow('quotation','Quotations')}${typeRow('cpo','Customer POs')}${typeRow('vpo','Vendor POs')}${typeRow('invoice','Invoices')}</tbody></table></div>`;
}

/* ---- Procurement analysis (from MR + POs) ---- */
function repProcurement(){
  const reqs=(typeof MR!=='undefined'?MR.requests:[])||[];
  const pos=(typeof MR!=='undefined'?MR.pos:[])||[];
  const poVal=po=>(po.lines||[]).reduce((s,l)=>s+(+l.qty||0)*(+l.rate||0),0);
  const totalPO=pos.reduce((s,p)=>s+poVal(p),0);
  const openMRs=reqs.filter(r=>!['Delivered','Closed','Cancelled','Rejected'].includes(r.status)).length;
  const overdue=reqs.filter(r=>typeof mrOverdue==='function'&&mrOverdue(r)).length;
  // spend by vendor
  const byVendor: Record<string,number>={};
  pos.forEach(p=>{ const v=vendor(p.vendorId); const name=v?v.name:(p.vendorId||'—'); byVendor[name]=(byVendor[name]||0)+poVal(p); });
  const vendors=Object.entries(byVendor).sort((a,b)=>b[1]-a[1]).slice(0,6);
  const vMax=Math.max(1,...vendors.map(v=>v[1]));
  // spend by project (via the MR each PO is against)
  const byProj: Record<string,number>={};
  pos.forEach(p=>{ const r=reqs.find(x=>x.id===p.mrId); const pid=r?r.projectId:'—'; const name=(typeof projName==='function')?projName(pid):pid; byProj[name]=(byProj[name]||0)+poVal(p); });
  const projs=Object.entries(byProj).sort((a,b)=>b[1]-a[1]).slice(0,6);
  const pMax=Math.max(1,...projs.map(p=>p[1]));
  // status mix
  const statuses=[...new Set(reqs.map(r=>r.status))];
  const stRow=statuses.map(s=>`<tr><td><b>${esc(s)}</b></td><td class="r">${reqs.filter(r=>r.status===s).length}</td></tr>`).join('');
  return `<div class="loc-row" style="grid-template-columns:repeat(4,1fr)">
      ${repKpi(reqs.length,'Material requests')}${repKpi(openMRs,'Open requests','var(--blue)')}${repKpi(overdue,'Overdue',overdue?'#b91c1c':'var(--green)')}${repKpi(money(totalPO),'Total PO value')}</div>
    <div class="panel"><div class="inv-head"><h2>Spend by vendor</h2></div><div style="padding:18px 22px">
      ${vendors.length?vendors.map(v=>repBar(v[0],v[1],vMax,money(v[1]),'var(--blue)')).join(''):'<div style="color:var(--muted)">No purchase orders yet.</div>'}</div></div>
    <div class="panel"><div class="inv-head"><h2>Procurement spend by project</h2></div><div style="padding:18px 22px">
      ${projs.length?projs.map(p=>repBar(p[0],p[1],pMax,money(p[1]),'#a855f7')).join(''):'<div style="color:var(--muted)">No purchase orders yet.</div>'}</div></div>
    <div class="panel"><div class="inv-head"><h2>Requests by status</h2></div>
      <table class="jc-tbl"><thead><tr><th>Status</th><th class="r">Requests</th></tr></thead><tbody>${stRow||'<tr class="empty-row"><td colspan="2">No requests.</td></tr>'}</tbody></table></div>`;
}

/* ---- Projects & job-cost analysis (from jcr) ---- */
function repProjects(){
  const projs=(typeof jcr!=='undefined'?jcr.projects:[]).filter(p=>!p.archived);
  const cv=projs.reduce((s,p)=>s+(+p.originalCV||0),0);
  const actual=projs.reduce((s,p)=>s+projActual(p.id),0);
  const margin=cv-actual;
  const over=projs.filter(p=>(+p.originalCV||0) && projActual(p.id)>(+p.originalCV||0)).length;
  const rows=projs.slice().sort((a,b)=>(b.originalCV||0)-(a.originalCV||0)).map(p=>{
    const a=projActual(p.id), c=+p.originalCV||0, m=c-a, pct=c?Math.round(a/c*100):0;
    const col=a>c?'#b91c1c':pct>85?'#b45309':'var(--green)';
    return `<tr><td><b>${esc(p.name)}</b><div class="t-cmp-src">${esc(p.jobCode)} · ${esc(p.status||'')}</div></td>
      <td class="r">${jcMoney(c)}</td><td class="r">${jcMoney(a)}</td><td class="r" style="color:${m<0?'#b91c1c':'var(--green)'}">${jcMoney(m)}</td>
      <td class="r" style="color:${col};font-weight:700">${pct}%</td></tr>`;
  }).join('')||`<tr class="empty-row"><td colspan="5">No projects.</td></tr>`;
  const cMax=Math.max(1,...projs.map(p=>Math.max(+p.originalCV||0,projActual(p.id))));
  return `<div class="loc-row" style="grid-template-columns:repeat(4,1fr)">
      ${repKpi(projs.length,'Active projects')}${repKpi(money(cv),'Contract value')}${repKpi(money(actual),'Actual cost','var(--blue)')}${repKpi(over,'Over budget',over?'#b91c1c':'var(--green)')}</div>
    <div class="panel"><div class="inv-head"><h2>Contract vs actual cost</h2></div><div style="padding:18px 22px">
      ${projs.slice().sort((a,b)=>(b.originalCV||0)-(a.originalCV||0)).map(p=>repBar(p.name+' · contract',(+p.originalCV||0),cMax,jcMoney(+p.originalCV||0),'#bcd2fb')+repBar(p.name+' · actual',projActual(p.id),cMax,jcMoney(projActual(p.id)), projActual(p.id)>(+p.originalCV||0)?'#ef4444':'var(--blue)')).join('')||'<div style="color:var(--muted)">No projects.</div>'}</div></div>
    <div class="panel"><div class="inv-head"><h2>Per-project summary</h2></div>
      <div class="tbl-scroll"><table class="jc-tbl"><thead><tr><th>Project</th><th class="r">Contract</th><th class="r">Actual</th><th class="r">Margin</th><th class="r">Spent %</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
}

/* ---- Inventory analysis (original report, kept) ---- */
function repInventory(){
  const totVal=state.items.reduce((s,it)=>s+state.locations.reduce((a,l)=>a+Math.max(0,onHand(it.code,l.id))*it.rate,0),0);
  const low=state.items.filter(it=>it.type!=='equipment'&&onHand(it.code,'WH-MAIN')>0&&onHand(it.code,'WH-MAIN')<=it.reorder).length;
  const resv=state.reservations.filter(r=>r.status==='active').length;
  const transit=state.movements.filter(m=>m.type==='TRANSFER'&&m.to==='TRANSIT'&&!m.received).length;
  const byLoc=state.locations.map(l=>({name:l.name,v:state.items.reduce((s,it)=>s+Math.max(0,onHand(it.code,l.id))*it.rate,0)}));
  const max=Math.max(1,...byLoc.map(x=>x.v));
  return `<div class="loc-row" style="grid-template-columns:repeat(4,1fr)">${repKpi(money(totVal),'Total stock value')}${repKpi(low,'Low-stock materials',low?'#b45309':'var(--green)')}${repKpi(resv,'Active reservations')}${repKpi(transit,'In-transit transfers')}</div>
    <div class="panel"><div class="inv-head"><h2>Stock value by location</h2></div><div style="padding:18px 22px">
      ${byLoc.map(x=>repBar(x.name,x.v,max,money(x.v),'var(--blue)')).join('')}
    </div></div>`;
}

/* ---- CSV export for the active report tab ---- */
function repExport(){
  const T=d=>(typeof billTotals==='function')?billTotals(d).total:0;
  let rows: CsvRow[]=[]; let name='report.csv';
  if(repTab==='monthly'){
    const months=repMonthsList();
    const ym=(repMonth&&months.includes(repMonth))?repMonth:(months[0]||nowDate().slice(0,7));
    const inYM=d=>String(d||'').slice(0,7)===ym;
    const docs=(typeof BILL!=='undefined'?BILL.docs:[])||[];
    const poValue=p=>(p.lines||[]).reduce((s,l)=>s+(+l.qty||0)*(+l.rate||0),0);
    const invVal=docs.filter(d=>d.type==='invoice'&&inYM(d.date)).reduce((s,d)=>s+T(d),0);
    const collected=docs.filter(d=>d.type==='invoice'&&d.status==='Paid'&&inYM(d.date)).reduce((s,d)=>s+T(d),0);
    const quoVal=docs.filter(d=>d.type==='quotation'&&inYM(d.date)).reduce((s,d)=>s+T(d),0);
    const poVal=(typeof MR!=='undefined'?MR.pos:[]).filter(p=>inYM(p.date)).reduce((s,p)=>s+poValue(p),0);
    const mrsM=(typeof MR!=='undefined'?MR.requests:[]).filter(r=>inYM(r.date)).length;
    const costVal=(typeof jcr!=='undefined'?jcr.entries:[]).filter(e=>!e.archived&&inYM(e.date)).reduce((s,e)=>s+(e.amount||0),0);
    const mv=(state.movements||[]).filter(m=>inYM(m.date));
    const mvVal=m=>((item(m.code)||{}).rate||0)*(+m.qty||0);
    const inflow=mv.filter(m=>m.type==='IN').reduce((s,m)=>s+mvVal(m),0);
    const consumed=mv.filter(m=>m.type==='CONSUME').reduce((s,m)=>s+mvVal(m),0);
    const tenders=(typeof TDR!=='undefined'?TDR.tenders:[])||[];
    name='monthly_review_'+ym+'.csv';
    rows=[['Monthly Review — '+ym],[],['Metric','Value'],
      ['Invoiced',Math.round(invVal)],['Collected',Math.round(collected)],
      ['Quotations raised (value)',Math.round(quoVal)],
      ['Procurement spend (POs raised)',Math.round(poVal)],['Material requests raised',mrsM],
      ['Project cost incurred',Math.round(costVal)],
      ['Stock received (value)',Math.round(inflow)],['Consumed on site (value)',Math.round(consumed)],
      ['Tenders submitted',tenders.filter(t=>inYM(t.submittedDate)).length],
      ['Tenders won',tenders.filter(t=>inYM(t.awardDate)).length]];
  } else if(repTab==='trends'){
    const {bins,weekly}=repBins(repRange);
    const labels=bins.map(b=>b.label);
    const docs=(typeof BILL!=='undefined'?BILL.docs:[])||[];
    const poValue=p=>(p.lines||[]).reduce((s,l)=>s+(+l.qty||0)*(+l.rate||0),0);
    const mvVal=m=>((item(m.code)||{}).rate||0)*(+m.qty||0);
    const inv=repBucket(docs.filter(d=>d.type==='invoice'),d=>d.date,T,bins,weekly);
    const col=repBucket(docs.filter(d=>d.type==='invoice'&&d.status==='Paid'),d=>d.date,T,bins,weekly);
    const quo=repBucket(docs.filter(d=>d.type==='quotation'),d=>d.date,T,bins,weekly);
    const pro=repBucket((typeof MR!=='undefined'?MR.pos:[]),p=>p.date,poValue,bins,weekly);
    const cost=repBucket((typeof jcr!=='undefined'?jcr.entries:[]).filter(e=>!e.archived),e=>e.date,e=>e.amount||0,bins,weekly);
    const rec=repBucket((state.movements||[]).filter(m=>m.type==='IN'),m=>m.date,mvVal,bins,weekly);
    const con=repBucket((state.movements||[]).filter(m=>m.type==='CONSUME'),m=>m.date,mvVal,bins,weekly);
    name='trends_'+repRange+'m.csv';
    rows=[['Period','Invoiced','Collected','Quoted','Procurement','Project cost','Stock received','Consumed','Net']];
    labels.forEach((lb,i)=>rows.push([lb,Math.round(inv[i]),Math.round(col[i]),Math.round(quo[i]),Math.round(pro[i]),Math.round(cost[i]),Math.round(rec[i]),Math.round(con[i]),Math.round(inv[i]-cost[i]-pro[i])]));
  } else if(repTab==='sales'){
    name='sales_report.csv'; rows=[['Number','Type','Party','Project ref','Date','Status','Total']];
    ((typeof BILL!=='undefined'?BILL.docs:[])||[]).forEach(d=>rows.push([d.number,d.type,d.party,(d.projectId||d.poNumber||''),d.date,d.status,Math.round(T(d))]));
  } else if(repTab==='procurement'){
    name='procurement_report.csv'; rows=[['PO','Vendor','Against MR','Project','Value','Expected','Status']];
    const reqs=(typeof MR!=='undefined'?MR.requests:[])||[];
    ((typeof MR!=='undefined'?MR.pos:[])||[]).forEach(p=>{ const v=vendor(p.vendorId); const r=reqs.find(x=>x.id===p.mrId); rows.push([p.id,v?v.name:p.vendorId,p.mrId,(r?projName(r.projectId):''),Math.round((p.lines||[]).reduce((s,l)=>s+(+l.qty||0)*(+l.rate||0),0)),p.expectedDate,p.status]); });
  } else if(repTab==='projects'){
    name='projects_report.csv'; rows=[['Job code','Project','Client','Status','Contract','Actual','Margin','Spent %']];
    (typeof jcr!=='undefined'?jcr.projects:[]).filter(p=>!p.archived).forEach(p=>{ const a=projActual(p.id),c=+p.originalCV||0; rows.push([p.jobCode,p.name,p.client,p.status,Math.round(c),Math.round(a),Math.round(c-a),c?Math.round(a/c*100):0]); });
  } else {
    name='inventory_report.csv'; rows=[['Code','Item','Category','Unit','On hand (all locations)','Rate','Stock value']];
    state.items.forEach(it=>{ let oh=0; state.locations.forEach(l=>oh+=Math.max(0,onHand(it.code,l.id))); rows.push([it.code,it.name,it.category,it.unit,oh,it.rate,Math.round(oh*it.rate)]); });
  }
  downloadCSV(name,rows);
}

/* ============================================================
   STATISTICAL ANALYSIS → PDF (via the browser's print-to-PDF).
   Descriptive statistics, distributions and trends across every
   module. Self-contained document (inline styles) so it prints
   cleanly. No external services.
   ============================================================ */
/** descriptive statistics for an array of numbers */
function statSummary(a){
  const n=a.length;
  if(!n) return {n:0,sum:0,mean:0,median:0,min:0,max:0,sd:0,cv:0};
  const sum=a.reduce((s,v)=>s+v,0), mean=sum/n;
  const sorted=a.slice().sort((x,y)=>x-y);
  const median=n%2?sorted[(n-1)/2]:(sorted[n/2-1]+sorted[n/2])/2;
  const variance=a.reduce((s,v)=>s+(v-mean)*(v-mean),0)/n;
  const sd=Math.sqrt(variance);
  return {n,sum,mean,median,min:sorted[0],max:sorted[n-1],sd,cv:mean?sd/mean*100:0};
}
function generateStatsPDF(){
  const esc2=s=>String(s==null?'':s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
  const M=n=>'₹'+Math.round(n).toLocaleString('en-IN');
  const pct=(a,b)=>b?Math.round(a/b*100):0;
  const docs=(typeof BILL!=='undefined'?BILL.docs:[])||[];
  const T=d=>(typeof billTotals==='function')?billTotals(d).total:0;
  const poValue=p=>(p.lines||[]).reduce((s,l)=>s+(+l.qty||0)*(+l.rate||0),0);
  const pos=(typeof MR!=='undefined'?MR.pos:[])||[];
  const reqs=(typeof MR!=='undefined'?MR.requests:[])||[];
  const ents=((typeof jcr!=='undefined'?jcr.entries:[])||[]).filter(e=>!e.archived);
  const projs=((typeof jcr!=='undefined'?jcr.projects:[])||[]).filter(p=>!p.archived);
  const tends=(typeof TDR!=='undefined'?TDR.tenders:[])||[];
  const mvs=(state.movements||[]);
  const mvVal=m=>((item(m.code)||{}).rate||0)*(+m.qty||0);

  // ---- 12-month series ----
  const {bins}=repBins(12);
  const labels=bins.map(b=>b.label);
  const series: Record<string,number[]>={
    'Invoiced': repBucket(docs.filter(d=>d.type==='invoice'),d=>d.date,T,bins,false),
    'Collected': repBucket(docs.filter(d=>d.type==='invoice'&&d.status==='Paid'),d=>d.date,T,bins,false),
    'Quotations': repBucket(docs.filter(d=>d.type==='quotation'),d=>d.date,T,bins,false),
    'Procurement': repBucket(pos,p=>p.date,poValue,bins,false),
    'Project cost': repBucket(ents,e=>e.date,e=>e.amount||0,bins,false),
    'Stock received': repBucket(mvs.filter(m=>m.type==='IN'),m=>m.date,mvVal,bins,false),
    'Consumed': repBucket(mvs.filter(m=>m.type==='CONSUME'),m=>m.date,mvVal,bins,false),
  };

  // ---- descriptive stats: monthly series ----
  const seriesStatRows=Object.entries(series).map(([k,arr])=>{ const s=statSummary(arr);
    return `<tr><td class="l">${k}</td><td>${M(s.sum)}</td><td>${M(s.mean)}</td><td>${M(s.median)}</td><td>${M(s.min)}</td><td>${M(s.max)}</td><td>${M(s.sd)}</td><td>${s.cv.toFixed(0)}%</td></tr>`;
  }).join('');

  // ---- transaction-level distributions ----
  const invAmts=docs.filter(d=>d.type==='invoice').map(T);
  const poAmts=pos.map(poValue);
  const entAmts=ents.map(e=>e.amount||0);
  const txStat=(lbl,a)=>{ const s=statSummary(a); return `<tr><td class="l">${lbl}</td><td>${s.n}</td><td>${M(s.sum)}</td><td>${M(s.mean)}</td><td>${M(s.median)}</td><td>${M(s.min)}</td><td>${M(s.max)}</td><td>${M(s.sd)}</td></tr>`; };

  // ---- sales ----
  const invTot=invAmts.reduce((s,v)=>s+v,0);
  const collected=docs.filter(d=>d.type==='invoice'&&d.status==='Paid').reduce((s,d)=>s+T(d),0);
  const outstanding=docs.filter(d=>d.type==='invoice'&&!['Paid','Draft'].includes(d.status)).reduce((s,d)=>s+T(d),0);
  const quotes=docs.filter(d=>d.type==='quotation'); const quotesWon=quotes.filter(d=>d.status==='Accepted').length;
  const byClient: Record<string,number>={}; docs.filter(d=>d.type==='invoice').forEach(d=>{ const c=d.party||'—'; byClient[c]=(byClient[c]||0)+T(d); });
  const clientRows=Object.entries(byClient).sort((a,b)=>b[1]-a[1]).map(([c,v])=>`<tr><td class="l">${esc2(c)}</td><td>${M(v)}</td><td>${pct(v,invTot)}%</td></tr>`).join('')||'<tr><td colspan="3" class="l">No invoices.</td></tr>';

  // ---- procurement ----
  const poTot=poAmts.reduce((s,v)=>s+v,0);
  const byVendor: Record<string,number>={}; pos.forEach(p=>{ const v=vendor(p.vendorId); const nm=v?v.name:(p.vendorId||'—'); byVendor[nm]=(byVendor[nm]||0)+poValue(p); });
  const vendorRows=Object.entries(byVendor).sort((a,b)=>b[1]-a[1]).map(([c,v])=>`<tr><td class="l">${esc2(c)}</td><td>${M(v)}</td><td>${pct(v,poTot)}%</td></tr>`).join('')||'<tr><td colspan="3" class="l">No purchase orders.</td></tr>';

  // ---- projects ----
  const projRows=projs.slice().sort((a,b)=>(b.originalCV||0)-(a.originalCV||0)).map(p=>{ const cv=+p.originalCV||0, act=projActual(p.id), m=cv-act; return `<tr><td class="l">${esc2(p.name)} (${esc2(p.jobCode)})</td><td>${M(cv)}</td><td>${M(act)}</td><td>${M(m)}</td><td>${cv?((m/cv)*100).toFixed(1):'0'}%</td><td>${pct(act,cv)}%</td></tr>`; }).join('')||'<tr><td colspan="6" class="l">No projects.</td></tr>';
  const cvTot=projs.reduce((s,p)=>s+(+p.originalCV||0),0), actTot=projs.reduce((s,p)=>s+projActual(p.id),0);
  const marginPcts=projs.filter(p=>+p.originalCV).map(p=>((+p.originalCV-projActual(p.id))/(+p.originalCV))*100);
  const marginStat=statSummary(marginPcts);
  const overBudget=projs.filter(p=>(+p.originalCV||0)&&projActual(p.id)>(+p.originalCV||0)).length;

  // ---- inventory ABC (top items by value share) ----
  const itemVals=state.items.map(it=>{ let oh=0; state.locations.forEach(l=>oh+=Math.max(0,onHand(it.code,l.id))); return {it,val:oh*(it.rate||0),oh}; }).filter(x=>x.val>0).sort((a,b)=>b.val-a.val);
  const invTotVal=itemVals.reduce((s,x)=>s+x.val,0);
  let cum=0; const abcRows=itemVals.slice(0,12).map(x=>{ cum+=x.val; return `<tr><td class="l">${esc2(x.it.name)}</td><td>${esc2(x.it.code)}</td><td>${num(x.oh)}</td><td>${M(x.val)}</td><td>${pct(x.val,invTotVal)}%</td><td>${pct(cum,invTotVal)}%</td></tr>`; }).join('');
  const lowCt=state.items.filter(it=>it.type!=='equipment'&&onHand(it.code,'WH-MAIN')>0&&onHand(it.code,'WH-MAIN')<=it.reorder).length;

  // ---- tenders ----
  const tStatus: Record<string,number>={}; tends.forEach(t=>{ tStatus[t.status]=(tStatus[t.status]||0)+1; });
  const tStatusRows=Object.entries(tStatus).map(([s,c])=>`<tr><td class="l">${esc2(s)}</td><td>${c}</td></tr>`).join('')||'<tr><td colspan="2" class="l">No tenders.</td></tr>';
  const decided=tends.filter(t=>['Won','Lost'].includes(t.status)).length;
  const wonT=tends.filter(t=>t.status==='Won').length;
  const bidStat=statSummary(tends.filter(t=>t.submittedValue).map(t=>+t.submittedValue));

  // ---- monthly series table ----
  const monthCols=labels.map(l=>`<th>${l}</th>`).join('');
  const monthBody=Object.entries(series).map(([k,arr])=>`<tr><td class="l">${k}</td>${arr.map(v=>`<td>${v?M(v):'–'}</td>`).join('')}</tr>`).join('');

  // ---- simple inline bar chart (monthly invoiced) ----
  const invSeries=series['Invoiced']; const invMax=Math.max(1,...invSeries);
  const bars=invSeries.map((v,i)=>`<div style="display:flex;align-items:center;gap:8px;margin:3px 0"><div style="width:52px;font-size:10px;color:#555">${labels[i]}</div><div style="flex:1;background:#eef2f7;height:12px;border-radius:3px;overflow:hidden"><div style="height:100%;width:${v/invMax*100}%;background:#2563eb"></div></div><div style="width:92px;text-align:right;font-size:10px">${v?M(v):'–'}</div></div>`).join('');

  const kpi=(l,v)=>`<div class="kpi"><div class="kv">${v}</div><div class="kl">${l}</div></div>`;
  const now=new Date();
  const html=`<!doctype html><html><head><meta charset="utf-8"><title>Statistical Analysis — ${esc2(COMPANY.name)}</title>
  <style>
  *{font-family:Inter,Arial,sans-serif;box-sizing:border-box}
  body{margin:0;padding:38px 44px;color:#0f172a;font-size:12px;line-height:1.5}
  .top{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #2563eb;padding-bottom:14px;margin-bottom:6px}
  .co{font-size:19px;font-weight:800}.co small{display:block;font-weight:400;color:#64748b;font-size:11px;margin-top:2px}
  .doc{text-align:right}.doc h1{margin:0;font-size:20px}.doc .sub{color:#64748b;font-size:11px;margin-top:4px}
  h2{font-size:14px;margin:26px 0 8px;padding-bottom:5px;border-bottom:1px solid #e2e8f0;color:#1e3a8a}
  h3{font-size:12px;margin:16px 0 6px;color:#334155}
  p.note{color:#64748b;font-size:11px;margin:4px 0 10px}
  table{width:100%;border-collapse:collapse;margin:6px 0 10px}
  th{background:#f1f5f9;text-align:right;padding:6px 8px;font-size:10px;text-transform:uppercase;letter-spacing:.03em;color:#475569;border-bottom:1px solid #e2e8f0}
  td{padding:6px 8px;border-bottom:1px solid #eef2f7;text-align:right;font-variant-numeric:tabular-nums}
  th.l,td.l{text-align:left}
  tr:nth-child(even) td{background:#fafbfc}
  .kpis{display:flex;gap:10px;margin:10px 0 4px;flex-wrap:wrap}
  .kpi{flex:1;min-width:120px;border:1px solid #e2e8f0;border-radius:8px;padding:10px 12px;background:#f8fafc}
  .kv{font-size:17px;font-weight:800}.kl{font-size:10px;color:#64748b;margin-top:2px}
  .ft{margin-top:26px;color:#94a3b8;font-size:10px;border-top:1px solid #eef2f7;padding-top:10px}
  @media print{h2{page-break-after:avoid}table{page-break-inside:avoid}.sec{page-break-inside:avoid}}
  </style></head><body>
  <div class="top"><div class="co">${esc2(COMPANY.name)}<small>${esc2(COMPANY.tagline||'')}</small></div>
    <div class="doc"><h1>Statistical Analysis</h1><div class="sub">Generated ${now.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})} ${now.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})} · by ${esc2(COMPANY.user)}</div></div></div>
  <p class="note">A descriptive statistical report across sales, procurement, projects, inventory and tenders. Figures are computed live from current records; the monthly analysis covers the trailing 12 months.</p>

  <div class="sec"><h2>1. Executive summary</h2>
  <div class="kpis">${kpi('Total invoiced',M(invTot))}${kpi('Collected',M(collected))}${kpi('Outstanding',M(outstanding))}${kpi('Procurement spend',M(poTot))}</div>
  <div class="kpis">${kpi('Contract value',M(cvTot))}${kpi('Actual cost',M(actTot))}${kpi('Portfolio margin',cvTot?(((cvTot-actTot)/cvTot)*100).toFixed(1)+'%':'–')}${kpi('Inventory value',M(invTotVal))}</div>
  <div class="kpis">${kpi('Quote win rate',quotes.length?pct(quotesWon,quotes.length)+'%':'–')}${kpi('Tender win rate',decided?pct(wonT,decided)+'%':'–')}${kpi('Projects over budget',overBudget+' / '+projs.length)}${kpi('Low-stock items',lowCt)}</div></div>

  <div class="sec"><h2>2. Descriptive statistics — monthly series (12 months)</h2>
  <p class="note">n = 12 monthly observations per metric. CV = coefficient of variation (std dev ÷ mean), a measure of volatility.</p>
  <table><thead><tr><th class="l">Metric</th><th>Total</th><th>Mean/mo</th><th>Median</th><th>Min</th><th>Max</th><th>Std dev</th><th>CV</th></tr></thead><tbody>${seriesStatRows}</tbody></table></div>

  <div class="sec"><h2>3. Transaction-level distribution</h2>
  <p class="note">Statistics over individual records, showing typical and extreme transaction sizes.</p>
  <table><thead><tr><th class="l">Population</th><th>Count</th><th>Total</th><th>Mean</th><th>Median</th><th>Min</th><th>Max</th><th>Std dev</th></tr></thead>
  <tbody>${txStat('Invoices',invAmts)}${txStat('Purchase orders',poAmts)}${txStat('Cost entries',entAmts)}</tbody></table></div>

  <div class="sec"><h2>4. Sales &amp; billing</h2>
  <p class="note">Collection rate ${pct(collected,invTot)}% · Quotation win rate ${quotes.length?pct(quotesWon,quotes.length):0}% (${quotesWon} of ${quotes.length}).</p>
  <h3>Revenue concentration by client</h3>
  <table><thead><tr><th class="l">Client</th><th>Invoiced</th><th>Share</th></tr></thead><tbody>${clientRows}</tbody></table></div>

  <div class="sec"><h2>5. Procurement</h2>
  <p class="note">${pos.length} purchase orders · ${reqs.length} material requests · total committed ${M(poTot)}.</p>
  <h3>Spend concentration by vendor</h3>
  <table><thead><tr><th class="l">Vendor</th><th>Spend</th><th>Share</th></tr></thead><tbody>${vendorRows}</tbody></table></div>

  <div class="sec"><h2>6. Projects &amp; job cost</h2>
  <p class="note">Margin % across projects — mean ${marginStat.mean.toFixed(1)}%, median ${marginStat.median.toFixed(1)}%, std dev ${marginStat.sd.toFixed(1)}%. ${overBudget} project(s) over budget.</p>
  <table><thead><tr><th class="l">Project</th><th>Contract</th><th>Actual</th><th>Margin</th><th>Margin %</th><th>Spent %</th></tr></thead><tbody>${projRows}</tbody></table></div>

  <div class="sec"><h2>7. Inventory (ABC — value concentration)</h2>
  <p class="note">Total stock value ${M(invTotVal)} across ${itemVals.length} stocked items. Top items ranked by value, with cumulative share.</p>
  <table><thead><tr><th class="l">Item</th><th class="l">Code</th><th>On hand</th><th>Value</th><th>Share</th><th>Cumulative</th></tr></thead><tbody>${abcRows||'<tr><td colspan="6" class="l">No stock on hand.</td></tr>'}</tbody></table></div>

  <div class="sec"><h2>8. Tenders / bidding</h2>
  <p class="note">Win rate ${decided?pct(wonT,decided):0}% of decided bids. Submitted bid value — mean ${M(bidStat.mean)}, median ${M(bidStat.median)}, std dev ${M(bidStat.sd)}.</p>
  <table><thead><tr><th class="l">Status</th><th>Count</th></tr></thead><tbody>${tStatusRows}</tbody></table></div>

  <div class="sec"><h2>9. Monthly invoiced — trend</h2>${bars}</div>

  <div class="sec"><h2>10. Monthly series (full matrix)</h2>
  <div style="overflow-x:auto"><table style="font-size:10px"><thead><tr><th class="l">Metric</th>${monthCols}</tr></thead><tbody>${monthBody}</tbody></table></div></div>

  <div class="ft">${esc2(COMPANY.name)} · Statistical analysis generated by Qualtech OS · ${now.toISOString().slice(0,10)} · Figures are management information, not audited financial statements.</div>
  <script>window.onload=function(){setTimeout(function(){window.print()},300)}<\/script></body></html>`;

  const w=window.open('','_blank');
  if(!w){ toast('Allow pop-ups to generate the PDF'); return; }
  w.document.write(html); w.document.close();
  toast('Statistical report ready — use “Save as PDF” in the print dialog');
}

/* ============================================================
   VENDORS — list + full per-vendor history (POs across procurement,
   inventory and billing; goods receipts; quotations; items supplied).
   ============================================================ */
let vView='list', curVendorId=null;
function goVendors(v){ vView=v; renderView(); window.scrollTo(0,0); }
function openVendor(id){ curVendorId=id; vView='profile'; renderView(); window.scrollTo(0,0); }
const poValueOf=po=>(po.lines||[]).reduce((s,l)=>s+(+l.qty||0)*(+l.rate||0),0);
/** gather everything linked to one vendor across every module */
function vendorHistory(id){
  const v=vendor(id);
  const name=v?v.name:id;
  const procPOs=(typeof MR!=='undefined'?MR.pos:[]).filter(p=>p.vendorId===id);
  const invPOs=(state.purchaseOrders||[]).filter(p=>p.vendorId===id);
  const billPOs=((typeof BILL!=='undefined'?BILL.docs:[])||[]).filter(d=>d.type==='vpo'&&(d.partyId===id||d.party===name));
  const mrQuotes=[]; (typeof MR!=='undefined'?MR.requests:[]).forEach(r=>(r.quotes||[]).forEach(q=>{ if(q.vendorId===id) mrQuotes.push({r,q}); }));
  const tQuotes=[]; (typeof TDR!=='undefined'?TDR.tenders:[]).forEach(t=>(t.quotes||[]).forEach(q=>{ if(q.vendorId===id) tQuotes.push({t,q}); }));
  const grns=[]; procPOs.forEach(p=>(p.receipts||[]).forEach(rc=>grns.push({p,rc})));
  return {v,name,procPOs,invPOs,billPOs,mrQuotes,tQuotes,grns};
}
/** open a project's full view (job-cost summary + all its tabs incl. Documents) */
function openProjectFull(pid){ if(typeof setCurProject==='function') setCurProject(pid); else { view='jobcost'; renderSidebar(); renderView(); window.scrollTo(0,0); } }
/** group a vendor's supply by project: value, orders and products delivered to each */
function vendorProjectSupply(h){
  const T=d=>(typeof billTotals==='function')?billTotals(d).total:0;
  const reqs=(typeof MR!=='undefined'?MR.requests:[])||[];
  const map: Record<string,{value:number;pos:number;items:Record<string,{qty:number;val:number;name:string}>}>={};
  const ensure=pid=>map[pid]||(map[pid]={value:0,pos:0,items:{}});
  h.procPOs.forEach(p=>{ const r=reqs.find(x=>x.id===p.mrId); const pid=r?r.projectId:null; if(!pid) return; const m=ensure(pid); m.value+=poValueOf(p); m.pos++;
    ((p.lines||[]) as any[]).forEach(l=>{ if(!l.code) return; const it=m.items[l.code]||(m.items[l.code]={qty:0,val:0,name:(item(l.code)||{}).name||l.desc||l.code}); it.qty+=(+l.qty||0); it.val+=(+l.qty||0)*(+l.rate||0); }); });
  const projById=(typeof jcr!=='undefined'?jcr.projects:[])||[];
  h.billPOs.forEach(d=>{ let pid=d.projectId; if(!pid && d.poNumber){ const p=projById.find(x=>x.jobCode===d.poNumber); if(p) pid=p.id; } if(!pid) return; const m=ensure(pid); m.value+=T(d); m.pos++;
    (d.lines||[]).forEach(l=>{ const key='b:'+(l.desc||''); const it=m.items[key]||(m.items[key]={qty:0,val:0,name:l.desc||'—'}); it.qty+=(+l.qty||0); it.val+=(+l.qty||0)*(+l.rate||0); }); });
  return map;
}
function vendorsHTML(){
  if(vView==='profile' && vendor(curVendorId)) return vendorProfileHTML(curVendorId);
  const T=d=>(typeof billTotals==='function')?billTotals(d).total:0;
  const rows=state.vendors.map(v=>{
    const h=vendorHistory(v.id);
    const spend=h.procPOs.reduce((s,p)=>s+poValueOf(p),0)+h.invPOs.reduce((s,p)=>s+poValueOf(p),0)+h.billPOs.reduce((s,d)=>s+T(d),0);
    const poCount=h.procPOs.length+h.invPOs.length+h.billPOs.length;
    const open=h.procPOs.filter(p=>!['Received','Cancelled'].includes(p.status)).length+h.invPOs.filter(p=>p.status!=='Received').length;
    const dates=[...h.procPOs,...h.invPOs,...h.billPOs].map(x=>x.date).filter(Boolean).sort();
    const last=dates.length?dates[dates.length-1]:'—';
    return `<tr class="drill" onclick="openVendor('${jsid(v.id)}')">
      <td class="mat"><b>${esc(v.name)}</b><div class="t-cmp-src">${esc(v.id)}</div></td>
      <td class="code">${esc(v.gstin)}</td><td>${esc(v.phone)}</td>
      <td class="r">${poCount}</td><td class="r">${open?`<span style="color:var(--blue);font-weight:700">${open}</span>`:'0'}</td>
      <td class="r b">${money(spend)}</td><td>${esc(last)}</td>
      <td class="r"><span class="ac-row-go">${svg(IC.arrow)}</span></td></tr>`;
  }).join('');
  return `<div class="page-hero"><div class="ph-img"></div><div class="ph-grad"></div><div class="ph-body"><div class="ph-eyebrow">Vendors</div><h1>Vendors</h1><p>Suppliers across procurement, inventory and billing — click any vendor for their full history.</p></div></div>
    <div class="panel"><div class="inv-head"><h2>All vendors</h2><span class="tag" style="margin-left:auto">${state.vendors.length}</span></div>
    <div class="tbl-scroll"><table class="jc-tbl"><thead><tr><th>Vendor</th><th>GSTIN</th><th>Phone</th><th class="r">POs</th><th class="r">Open</th><th class="r">Total spend</th><th>Last order</th><th></th></tr></thead>
    <tbody>${rows||'<tr class="empty-row"><td colspan="8">No vendors.</td></tr>'}</tbody></table></div></div>`;
}
function vendorProfileHTML(id){
  const T=d=>(typeof billTotals==='function')?billTotals(d).total:0;
  const h=vendorHistory(id); const v=h.v;
  const spend=h.procPOs.reduce((s,p)=>s+poValueOf(p),0)+h.invPOs.reduce((s,p)=>s+poValueOf(p),0)+h.billPOs.reduce((s,d)=>s+T(d),0);
  const poCount=h.procPOs.length+h.invPOs.length+h.billPOs.length;
  const open=h.procPOs.filter(p=>!['Received','Cancelled'].includes(p.status)).length+h.invPOs.filter(p=>p.status!=='Received').length;
  // goods received value
  let grnVal=0; h.procPOs.forEach(p=>(p.receipts||[]).forEach(rc=>(rc.lines||[]).forEach(rl=>{ const ln=(p.lines||[]).find(l=>l.code===rl.code); grnVal+=(+rl.qty||0)*(ln?+ln.rate||0:0); })));
  const quotesGiven=h.mrQuotes.length+h.tQuotes.length;
  const quotesWon=h.mrQuotes.filter(x=>x.q.selected).length+h.tQuotes.filter(x=>x.q.selected).length;
  // items supplied (code-based POs)
  const itemAgg: Record<string,{qty:number;val:number;orders:number;lastRate:number;name:string}>={};
  [...h.procPOs,...h.invPOs].forEach(p=>((p.lines||[]) as any[]).forEach(l=>{ const c=l.code; if(!c) return; const a=itemAgg[c]||(itemAgg[c]={qty:0,val:0,orders:0,lastRate:0,name:(item(c)||{}).name||l.desc||c}); a.qty+=(+l.qty||0); a.val+=(+l.qty||0)*(+l.rate||0); a.orders++; a.lastRate=+l.rate||a.lastRate; }));
  const items=Object.entries(itemAgg).sort((a,b)=>b[1].val-a[1].val);

  const badgeMR=s=>(typeof mrBadge==='function')?mrBadge(s==='Open'?'PO Raised':s==='Partially Received'?'Partially Delivered':s==='Received'?'Delivered':s):esc(s);
  const kpi=(l,v,c?)=>`<div class="loc-card" style="cursor:default"><div class="lc-qty"${c?` style="color:${c}"`:''}>${v}</div><div class="lc-sub" style="margin-top:8px">${esc(l)}</div></div>`;
  const sec=(title,count,inner)=>`<div class="panel" style="margin-top:16px"><div class="inv-head"><h2>${title}</h2><span class="tag" style="margin-left:auto">${count}</span></div>${inner}</div>`;

  const procRows=h.procPOs.slice().sort((a,b)=>(b.date||'').localeCompare(a.date||'')).map(p=>{
    const recd=(p.lines||[]).reduce((s,l)=>s+(+l.recdQty||0),0), ord=(p.lines||[]).reduce((s,l)=>s+(+l.qty||0),0);
    return `<tr class="drill" onclick="go('procurement');openMr('${jsid(p.mrId)}')"><td class="c">${esc(p.id)}</td><td>${esc(p.mrId||'—')}</td><td>${esc(p.date||'')}</td><td class="r">${money(poValueOf(p))}</td><td class="r">${ord?Math.round(recd/ord*100):0}%</td><td>${badgeMR(p.status)}</td></tr>`;
  }).join('')||'<tr class="empty-row"><td colspan="6">No procurement POs.</td></tr>';

  const invRows=h.invPOs.slice().sort((a,b)=>(b.date||'').localeCompare(a.date||'')).map(p=>
    `<tr><td class="c">${esc(p.id)}</td><td>${esc(p.date||'')}</td><td>${esc(locName(p.deliverTo)||'—')}</td><td class="r">${money(poValueOf(p))}</td><td>${esc(p.status)}</td></tr>`
  ).join('')||'<tr class="empty-row"><td colspan="5">No inventory POs.</td></tr>';

  const billRows=h.billPOs.slice().sort((a,b)=>(b.date||'').localeCompare(a.date||'')).map(d=>
    `<tr class="drill" onclick="billPrint('${jsid(d.id)}')"><td><a class="bcd-no">${esc(d.number)}</a></td><td>${esc(d.subject||d.poNumber||'—')}</td><td>${esc(d.date||'')}</td><td class="r b">${money(T(d))}</td><td>${(typeof billBadge==='function')?billBadge(d.status):esc(d.status)}</td></tr>`
  ).join('')||'<tr class="empty-row"><td colspan="5">No vendor POs raised in billing.</td></tr>';

  const grnRows=h.grns.slice().sort((a,b)=>(b.rc.date||'').localeCompare(a.rc.date||'')).map(({p,rc})=>{
    const val=(rc.lines||[]).reduce((s,rl)=>{ const ln=(p.lines||[]).find(l=>l.code===rl.code); return s+(+rl.qty||0)*(ln?+ln.rate||0:0); },0);
    return `<tr><td>${esc(rc.grnNo||'—')}</td><td>${esc(p.id)}</td><td>${esc(rc.date||'')}</td><td class="r">${(rc.lines||[]).reduce((s,l)=>s+(+l.qty||0),0)} unit(s)</td><td class="r b">${money(val)}</td></tr>`;
  }).join('')||'<tr class="empty-row"><td colspan="5">No goods receipts recorded.</td></tr>';

  const quoteRows=[
    ...h.mrQuotes.map(({r,q})=>`<tr><td>Material request</td><td>${esc(r.id)}</td><td class="mat">${esc((item(q.code)||{}).name||q.code)}</td><td class="r">${money(q.rate)}</td><td>${q.selected?'<span class="t-badge" style="color:#15803d;background:#dcfce7">Selected</span>':'—'}</td></tr>`),
    ...h.tQuotes.map(({t,q})=>`<tr><td>Tender</td><td>${esc(t.id)}</td><td class="mat">${esc(q.item)}</td><td class="r">${money(q.price)}</td><td>${q.selected?'<span class="t-badge" style="color:#15803d;background:#dcfce7">Selected</span>':'—'}</td></tr>`)
  ].join('')||'<tr class="empty-row"><td colspan="5">No quotations on record.</td></tr>';

  const itemRows=items.map(([c,a])=>`<tr><td class="mat"><b>${esc(a.name)}</b></td><td class="c">${esc(c)}</td><td class="r">${num(a.qty)}</td><td class="r">${a.orders}</td><td class="r">${money(a.lastRate)}</td><td class="r b">${money(a.val)}</td></tr>`).join('')||'<tr class="empty-row"><td colspan="6">No item-level orders.</td></tr>';

  return `<div style="margin-bottom:14px"><button class="btn ghost sm" onclick="goVendors('list')">${svg('<path d="M15 18l-6-6 6-6"/>')} All vendors</button></div>
    <div class="panel" style="margin-bottom:16px"><div class="jc-proj">
      <div class="jc-ic">${svg(IC.vendors)}</div>
      <div class="jc-pmeta"><div class="jc-pname">${esc(v.name)} <span class="tag">${esc(v.id)}</span></div>
        <div class="jc-pfacts"><span><b>GSTIN</b> ${esc(v.gstin||'—')}</span><span><b>Phone</b> ${esc(v.phone||'—')}</span><span><b>Supplier win rate</b> ${quotesGiven?Math.round(quotesWon/quotesGiven*100):0}%</span></div>
      </div></div></div>
    <div class="loc-row" style="grid-template-columns:repeat(4,1fr)">
      ${kpi('Total spend',money(spend))}${kpi('Purchase orders',poCount)}${kpi('Open POs',open,open?'var(--blue)':'var(--green)')}${kpi('Goods received',money(grnVal),'var(--green)')}</div>

    ${(()=>{ const sup=vendorProjectSupply(h); const ids=Object.keys(sup).sort((a,b)=>sup[b].value-sup[a].value);
      const blocks=ids.map(pid=>{ const p=(typeof jcr!=='undefined'?jcr.projects:[]).find(x=>x.id===pid); const m=sup[pid];
        const itemRows=Object.entries(m.items).sort((a,b)=>b[1].val-a[1].val).map(([k,it])=>`<tr><td class="mat"><b>${esc(it.name)}</b></td><td class="r">${num(it.qty)}</td><td class="r b">${money(it.val)}</td></tr>`).join('')||'<tr class="empty-row"><td colspan="3">—</td></tr>';
        return `<div style="border:1px solid var(--line);border-radius:12px;margin:12px 0;overflow:hidden">
          <div class="drill" onclick="openProjectFull('${jsid(pid)}')" style="display:flex;align-items:center;gap:12px;padding:13px 16px;cursor:pointer">
            <span class="jc-ic" style="width:36px;height:36px;flex:none">${svg(IC.jobcost)}</span>
            <div style="flex:1;min-width:0"><div style="font-weight:700">${esc(p?p.name:pid)} <span class="tag">${esc(p?p.jobCode:'')}</span></div>
              <div class="t-cmp-src">${m.pos} order(s) · ${Object.keys(m.items).length} product(s) supplied · click to open the project</div></div>
            <div style="font-weight:800;flex:none">${money(m.value)}</div><span class="ac-row-go">${svg(IC.arrow)}</span></div>
          <div class="tbl-scroll"><table class="jc-tbl"><thead><tr><th>Product supplied to this project</th><th class="r">Qty</th><th class="r">Value</th></tr></thead><tbody>${itemRows}</tbody></table></div></div>`;
      }).join('')||'<div style="padding:16px 20px;color:var(--muted)">No project-linked supply yet. Procurement POs link via their material request; billing vendor POs link via the project selected on the document.</div>';
      return sec('Projects supplied',ids.length,`<div style="padding:4px 16px 14px">${blocks}</div>`);
    })()}

    ${sec('Procurement purchase orders',h.procPOs.length,`<div class="tbl-scroll"><table class="jc-tbl"><thead><tr><th>PO</th><th>Against MR</th><th>Date</th><th class="r">Value</th><th class="r">Received</th><th>Status</th></tr></thead><tbody>${procRows}</tbody></table></div>`)}
    ${sec('Inventory purchase orders',h.invPOs.length,`<div class="tbl-scroll"><table class="jc-tbl"><thead><tr><th>PO</th><th>Date</th><th>Deliver to</th><th class="r">Value</th><th>Status</th></tr></thead><tbody>${invRows}</tbody></table></div>`)}
    ${sec('Vendor POs (billing)',h.billPOs.length,`<div class="tbl-scroll"><table class="jc-tbl"><thead><tr><th>Doc no.</th><th>Subject</th><th>Date</th><th class="r">Value</th><th>Status</th></tr></thead><tbody>${billRows}</tbody></table></div>`)}
    ${sec('Goods receipts (GRN)',h.grns.length,`<div class="tbl-scroll"><table class="jc-tbl"><thead><tr><th>GRN</th><th>PO</th><th>Date</th><th class="r">Qty</th><th class="r">Value</th></tr></thead><tbody>${grnRows}</tbody></table></div>`)}
    ${sec('Quotations given',quotesGiven,`<div class="tbl-scroll"><table class="jc-tbl"><thead><tr><th>Source</th><th>Ref</th><th>Item</th><th class="r">Quoted rate</th><th>Outcome</th></tr></thead><tbody>${quoteRows}</tbody></table></div>`)}
    ${sec('Items supplied',items.length,`<div class="tbl-scroll"><table class="jc-tbl"><thead><tr><th>Item</th><th>Code</th><th class="r">Total qty</th><th class="r">Orders</th><th class="r">Last rate</th><th class="r">Total value</th></tr></thead><tbody>${itemRows}</tbody></table></div>`)}`;
}
/* ============================================================
   COMPANY DASHBOARD — overview across tenders, projects,
   procurement, inventory & job cost.
   ============================================================ */
function cdShort(name){ let s=String(name||'').replace(/^Mr\.?\s*/i,'').replace(/\s*—.*$/,'').trim(); const w=s.split(/\s+/); const l1=w.slice(0,2).join(' '), l2=w.slice(2).join(' '); return [l1,l2].filter(Boolean); }
function cdGroupBars(data){
  const W=560,H=215,padL=42,padB=42,padT=8,padR=10; const iw=W-padL-padR, ih=H-padB-padT;
  const max=Math.max(1,...data.flatMap(d=>[d.c,d.a])); const nice=(typeof tbNiceMax==='function')?tbNiceMax(max):max;
  let grid='';
  for(let i=0;i<=4;i++){ const v=nice/4*i; const y=padT+ih-(v/nice)*ih; grid+=`<line x1="${padL}" y1="${y.toFixed(1)}" x2="${W-padR}" y2="${y.toFixed(1)}" stroke="var(--line2)"/><text x="${padL-6}" y="${(y+3).toFixed(1)}" text-anchor="end" class="tb-ax">${v?(+v.toFixed(v<10?1:0))+' Cr':'0'}</text>`; }
  const n=data.length||1, slot=iw/n, bw=15, gap=5;
  const bars=data.map((d,i)=>{ const cx=padL+slot*i+slot/2; const ch=(d.c/nice)*ih, ah=(d.a/nice)*ih; const cxC=cx-bw-gap/2, cxA=cx+gap/2;
    const lbl=(d.label||[]).map((ln,k)=>`<text x="${cx.toFixed(1)}" y="${H-24+k*12}" text-anchor="middle" class="tb-ax">${esc(ln)}</text>`).join('');
    return `<rect x="${cxC.toFixed(1)}" y="${(padT+ih-ch).toFixed(1)}" width="${bw}" height="${Math.max(0,ch).toFixed(1)}" rx="3" fill="#bcd2fb"><title>Contract ₹${d.c.toFixed(2)} Cr</title></rect>`
      +`<rect x="${cxA.toFixed(1)}" y="${(padT+ih-ah).toFixed(1)}" width="${bw}" height="${Math.max(0,ah).toFixed(1)}" rx="3" fill="var(--blue)"><title>Actual ₹${d.a.toFixed(2)} Cr</title></rect>`+lbl; }).join('');
  return `<svg viewBox="0 0 ${W} ${H}" class="tb-chart">${grid}${bars}</svg>`;
}
function hjSpark(vals,color){ color=color||'var(--blue)'; const W=120,H=34; const max=Math.max(...vals,1),min=Math.min(...vals,0); const rng=(max-min)||1; const n=vals.length;
  const pts=vals.map((v,i)=>[(n>1?i/(n-1)*W:0),H-((v-min)/rng)*(H-5)-3]);
  const d=pts.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ');
  return `<svg class="hj-spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><path d="${d} L ${W} ${H} L 0 ${H} Z" fill="${color}" opacity="0.08"/><path d="${d}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/></svg>`; }
function hjWiggle(base,n){ const out=[]; base=base||1; for(let i=0;i<n;i++){ out.push(base*(0.55+0.45*Math.abs(Math.sin(i*1.25+(base%7)))*(0.85+0.3*((i*3+base)%4)/4))); } out[n-1]=base; return out; }
function hjRow(label,sub,pct,val,icons,nav){ return `<div class="hj-item" ${nav?`onclick="go('${nav}')"`:''}>
  <div class="hj-item-top"><span class="hj-item-lab">${esc(label)}</span>${sub?`<span class="hj-item-sub">${esc(sub)}</span>`:''}</div>
  <div class="hj-item-line"><div class="hj-item-bar"><span style="width:${Math.max(3,Math.round(pct))}%"></span></div><span class="hj-item-val">${val}</span>${icons||''}</div></div>`; }
/* mini area-sparkline in a given accent colour */
let _sparkN=0;
function miniSpark(s,color){
  const w=132,h=52,pad=4; color=color||'var(--blue)';
  if(!s||s.length<2){ const y=h/2; return `<svg class="ov-spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><path d="M${pad} ${y} L${w-pad} ${y}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" opacity=".6"/></svg>`; }
  const min=Math.min(...s),max=Math.max(...s),rng=(max-min)||1;
  const pts=s.map((v,i)=>[pad+i*(w-2*pad)/(s.length-1), h-pad-(v-min)/rng*(h-2*pad)]);
  const d=pts.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ');
  const area=d+` L ${(w-pad).toFixed(1)} ${h-pad} L ${pad} ${h-pad} Z`;
  const id='sg'+(++_sparkN);
  return `<svg class="ov-spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity=".3"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs><path d="${area}" fill="url(#${id})"/><path d="${d}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

/* ============================================================
   ACTION CENTER — one rules engine over every module. No external
   services: every alert is derived from data already in the app.
   ============================================================ */
/** materials at/below reorder (low) or at zero (out), with on-hand across all locations */
function lowStockScan(){
  const out: {it:Item;oh:number}[]=[], low: {it:Item;oh:number}[]=[];
  (state.items||[]).filter(it=>it.type!=='equipment').forEach(it=>{
    let oh=0; (state.locations||[]).forEach(l=>oh+=Math.max(0,onHand(it.code,l.id)));
    if(oh<=0) out.push({it,oh}); else if(oh<=(it.reorder||0)) low.push({it,oh});
  });
  return {out,low};
}
/** Returns every current alert across modules, each: {sev,cat,title,detail,nav} */
function collectAlerts(){
  const A: {sev:'critical'|'warning'|'info';cat:string;title:string;detail:string;nav:string}[]=[];
  const add=(sev,cat,title,detail,nav)=>A.push({sev,cat,title,detail,nav});
  const today=nowDate();
  const dTo=d=>Math.round((new Date(d).getTime()-new Date(today).getTime())/864e5);
  try{
    const {out,low}=lowStockScan();
    out.forEach(x=>add('critical','Inventory','Out of stock — '+x.it.name, x.it.code+' · 0 on hand (reorder at '+num(x.it.reorder)+')','inventory'));
    low.forEach(x=>add('warning','Inventory','Low stock — '+x.it.name, x.it.code+' · '+num(x.oh)+' on hand, reorder at '+num(x.it.reorder),'inventory'));
  }catch{}
  try{ if(typeof MR!=='undefined'){
    (MR.requests||[]).filter(r=>typeof mrOverdue==='function'&&mrOverdue(r)).forEach(r=>
      add('critical','Procurement','Overdue material request — '+r.id, (projName(r.projectId))+' · needed by '+r.neededBy,'procurement'));
    (MR.pos||[]).filter(p=>typeof poOverdue==='function'&&poOverdue(p)).forEach(p=>
      add('warning','Procurement','Overdue purchase order — '+p.id, 'Expected '+p.expectedDate+' · '+(vendor(p.vendorId)?vendor(p.vendorId).name:p.vendorId),'procurement'));
  }}catch{}
  try{ if(typeof TDR!=='undefined'){
    (TDR.tenders||[]).filter(t=>!t.archived && !['Won','Lost','Withdrawn'].includes(t.status) && t.deadline).forEach(t=>{
      const d=dTo(t.deadline);
      if(d<0) add('critical','Bidding','Tender deadline passed — '+t.name, 'Due '+t.deadline+' · status '+t.status,'tenders');
      else if(d<=7) add('warning','Bidding','Tender due in '+d+' day'+(d===1?'':'s')+' — '+t.name, 'Deadline '+t.deadline+' · '+t.status,'tenders');
    });
  }}catch{}
  try{ if(typeof BILL!=='undefined'){
    (BILL.docs||[]).filter(d=>d.type==='invoice' && d.dueDate && d.status!=='Paid' && d.dueDate<today).forEach(d=>{
      const t=(typeof billTotals==='function')?billTotals(d).total:0;
      add('critical','Billing','Invoice overdue — '+d.number, (d.party||'')+' · '+money(t)+' · due '+d.dueDate,'billing');
    });
  }}catch{}
  try{ if(typeof jcr!=='undefined'){
    (jcr.projects||[]).filter(p=>!p.archived && p.start && p.finish && p.status!=='Completed').forEach(p=>{
      const s=new Date(p.start).getTime(), f=new Date(p.finish).getTime(), n=new Date(today).getTime();
      if(f<=s) return;
      const schedPct=Math.round((n-s)/(f-s)*100);
      const spent=projActual(p.id), cv=+p.originalCV||0;
      const spentPct=cv?Math.round(spent/cv*100):0;
      if(cv && spentPct>schedPct+10) add('warning','Projects','Budget ahead of schedule — '+p.name, spentPct+'% of contract spent vs '+Math.max(0,schedPct)+'% time elapsed','jobcost');
      if(cv && spent>cv) add('critical','Projects','Over budget — '+p.name, money(spent)+' spent vs '+money(cv)+' contract','jobcost');
    });
  }}catch{}
  const rank={critical:0,warning:1,info:2};
  return A.sort((a,b)=>rank[a.sev]-rank[b.sev]);
}
function alertCount(){ try{ return collectAlerts().length; }catch{ return 0; } }

function actionCenterHTML(){
  const alerts=collectAlerts();
  const n=s=>alerts.filter(a=>a.sev===s).length;
  const {out,low}=lowStockScan();
  const reorderCodes=[...out,...low].map(x=>x.it.code);
  const sevMeta={critical:['#b91c1c','#fee2e2','Critical'],warning:['#b45309','#fef3c7','Needs attention'],info:['#0369a1','#e0f2fe','For info']};
  const dot=s=>`<span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${sevMeta[s][0]};flex:none"></span>`;
  const kpi=(v,l,c)=>`<div class="loc-card" style="cursor:default"><div class="lc-qty" style="color:${c}">${v}</div><div class="lc-sub" style="margin-top:8px">${l}</div></div>`;

  const cats=[...new Set(alerts.map(a=>a.cat))];
  const groups=cats.map(cat=>{
    const items=alerts.filter(a=>a.cat===cat);
    const rows=items.map(a=>`<div class="ac-row" onclick="go('${a.nav}')">
      <div class="ac-row-l">${dot(a.sev)}<div><div class="ac-row-title">${esc(a.title)}</div><div class="ac-row-sub">${esc(a.detail)}</div></div></div>
      <span class="ac-row-go">${svg(IC.arrow)}</span></div>`).join('');
    return `<div class="panel" style="margin-top:16px"><div class="inv-head"><h2>${esc(cat)}</h2><span class="tag" style="margin-left:auto">${items.length}</span></div>
      <div class="ac-list">${rows}</div></div>`;
  }).join('');

  const empty=`<div class="panel" style="margin-top:16px;padding:48px;text-align:center">
    <div style="font-size:40px">✅</div><div style="font-weight:700;margin-top:10px">All clear</div>
    <div style="color:var(--muted);font-size:13px;margin-top:4px">No stock, procurement, bidding, billing or budget items need attention right now.</div></div>`;

  const reorderCTA=reorderCodes.length?`<div class="panel" style="margin-top:16px;display:flex;align-items:center;gap:14px;padding:16px 20px">
      <span class="ov-kpi-ic" style="flex:none">${svg(IC.consume)}</span>
      <div style="flex:1"><div style="font-weight:700">${reorderCodes.length} item${reorderCodes.length===1?'':'s'} at or below reorder level</div>
      <div style="color:var(--muted);font-size:13px">Auto-build a material request with suggested quantities to top them back up.</div></div>
      <button class="btn" onclick="actionReorder()">${svg(IC.plus)} Create reorder request</button></div>`:'';

  return `<div class="page-hero"><div class="ph-img"></div><div class="ph-grad"></div><div class="ph-body"><div class="ph-eyebrow">Action Center</div><h1>What needs your attention</h1><p>Live across inventory, procurement, bidding, billing and project budgets — no setup, updates automatically.</p></div></div>
    <div class="loc-row" style="grid-template-columns:repeat(4,1fr)">
      ${kpi(alerts.length,'Open items','var(--ink)')}
      ${kpi(n('critical'),'Critical',sevMeta.critical[0])}
      ${kpi(n('warning'),'Needs attention',sevMeta.warning[0])}
      ${kpi(reorderCodes.length,'To reorder','var(--blue)')}
    </div>
    ${reorderCTA}
    ${alerts.length?groups:empty}`;
}
/** Auto-draft a material request from everything at/below reorder level. */
function actionReorder(){
  const {out,low}=lowStockScan();
  const picks=[...out,...low];
  if(!picks.length) return toast('Nothing to reorder — all stock is above reorder level');
  const lines=picks.map(x=>{ const suggest=Math.max(x.it.reorder||0, (x.it.reorder||0)*2-x.oh); return {code:x.it.code, qty:Math.max(1,Math.round(suggest)), note:'Auto reorder — '+num(x.oh)+' on hand'}; });
  go('procurement');
  if(typeof openReorderRequest==='function') openReorderRequest(lines);
}

function dashboardHTML(){
  const M=n=>'₹'+(n>=1e7?(n/1e7).toFixed(2)+' Cr':n>=1e5?(n/1e5).toFixed(1)+' L':Math.round(n).toLocaleString('en-IN'));
  const projs=(typeof jcr!=='undefined'?jcr.projects:[]).filter(p=>!p.archived);
  const totCV=projs.reduce((s,p)=>s+(+p.originalCV||0),0);
  const locIds=state.locations.map(l=>l.id); let invVal=0; state.items.forEach(it=>{ let oh=0; locIds.forEach(l=>oh+=Math.max(0,onHand(it.code,l))); invVal+=oh*(it.rate||0); });
  const bills=(typeof BILL!=='undefined'?BILL.docs:[]);
  const bT=d=>(typeof billTotals==='function')?billTotals(d).total:0;
  const outstanding=bills.filter(d=>d.type==='invoice'&&!['Paid','Draft'].includes(d.status)).reduce((s,d)=>s+bT(d),0);
  const typeLbl=t=>(typeof BILL_META!=='undefined'&&BILL_META[t])?BILL_META[t].label:t;
  const MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const now=new Date(nowDate());
  /* sparkline shapes (illustrative trend chrome — see note; KPI values above are real) */
  const SP_UP=[0.30,0.40,0.35,0.52,0.58,0.63,0.73,0.85];
  const SP_DN=[0.85,0.74,0.78,0.62,0.66,0.54,0.47,0.40];

  const prog=p=>{ if(!p.start||!p.finish) return 0; const s=new Date(p.start),f=new Date(p.finish),n=new Date(nowDate()); if(f<=s) return 0; return Math.max(2,Math.min(100,Math.round((n.getTime()-s.getTime())/(f.getTime()-s.getTime())*100))); };
  const stCls=s=>({'In Progress':'blue','On Track':'green','Completed':'green','Nearing Completion':'teal','Planning':'amber','Delayed':'red'}[s]||'grey');
  const docCls=s=>({Paid:'green',Accepted:'green',Received:'blue',Sent:'blue',Issued:'blue',Open:'grey',Closed:'grey',Draft:'grey',Pending:'amber',Overdue:'red'}[s]||'grey');
  const badge=(t,c)=>`<span class="ov-badge ${c}">${esc(t||'—')}</span>`;
  const docIc={quotation:IC.tenders,cpo:IC.po,vpo:IC.procurement,invoice:IC.billing};

  // recent commercial documents (filtered by in-panel tab)
  let docsF=bills.slice();
  if(dDoc==='quotation') docsF=docsF.filter(d=>d.type==='quotation');
  else if(dDoc==='invoice') docsF=docsF.filter(d=>d.type==='invoice');
  else if(dDoc==='po') docsF=docsF.filter(d=>d.type==='cpo'||d.type==='vpo');
  docsF=docsF.sort((a,b)=>(b.date||'').localeCompare(a.date||'')).slice(0,5);
  const docTabs=[['all','All'],['quotation','Quotations'],['invoice','Invoices'],['po','Purchase Orders']];

  // project status (filtered by in-panel tab)
  let pstat=projs.slice().sort((a,b)=>(b.originalCV||0)-(a.originalCV||0));
  if(dProj!=='all') pstat=pstat.filter(p=>p.status===dProj);
  pstat=pstat.slice(0,5);
  const projTabs=[['all','All Projects'],['In Progress','In Progress'],['Planning','Planning'],['Completed','Completed']];

  // inventory overview
  const invRows=state.items.filter(it=>it.type==='material').map(it=>{ let oh=0; locIds.forEach(l=>oh+=Math.max(0,onHand(it.code,l))); return {it,oh,val:oh*(it.rate||0)}; })
    .sort((a,b)=>b.val-a.val).slice(0,5);
  const invStat=r=>{ if(r.oh<=0) return ['Out','red']; if(r.oh<=r.it.reorder) return ['Low Stock','red']; if(r.oh<=r.it.reorder*1.5) return ['Reorder Soon','amber']; return ['In Stock','green']; };
  const lastMv=code=>{ let best=''; state.movements.forEach(m=>{ if(m.code===code&&m.date&&m.date>best) best=m.date; }); return best; };
  const fmtFull=d=>{ if(!d) return '—'; const x=new Date(d); return x.getDate()+' '+MON[x.getMonth()]+' '+x.getFullYear(); };
  const fmtDM=d=>{ if(!d) return '—'; const x=new Date(d); return x.getDate()+' '+MON[x.getMonth()]; };

  const WD=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][now.getDay()];
  const dateStr=`${WD}, ${now.getDate()} ${MON[now.getMonth()]} ${now.getFullYear()}`;
  const hh=now.getHours(); const greet=hh<12?'Good morning':hh<17?'Good afternoon':'Good evening';

  const kpi=(icon,label,val,sub,nav,cls,series,color,pct,badgeCls)=>{
    const b=`<span class="ov-delta ${badgeCls}">${pct>=0?'▲':'▼'} ${Math.abs(pct)}%</span>`;
    return `<div class="ov-kpi ${cls}${cls==='k-out'?' amber':''}" onclick="go('${nav}')">
      <div class="ov-kpi-top"><span class="ov-kpi-ic">${svg(icon)}</span><span class="ov-kpi-lab">${label}</span><button class="ov-kpi-kebab" onclick="event.stopPropagation()" title="Card options">⋮</button></div>
      <div class="ov-kpi-v">${val}</div>
      <div class="ov-kpi-foot"><div class="ov-kpi-fl">${b}<span class="ov-kpi-s">${sub}</span></div>${miniSpark(series,color)}</div>
    </div>`;
  };

  return `
  <div class="ov-dash">
  <div class="ov-head2">
    <div class="ov-hphoto"></div>
    <div class="ov-head2-l">
      <div class="ov-eyebrow">Operations Overview</div>
      <h1 class="ov-greet">${greet}, ${esc(COMPANY.user)}</h1>
      <p class="ov-sub">Here's a snapshot of your projects, commercial documents and inventory.</p>
    </div>
    <div class="ov-head2-r">
      <div class="ov-date-big">${dateStr}</div>
      <div class="ov-date-sub">${esc(COMPANY.name)}</div>
    </div>
  </div>

  <div class="ov-kpis">
    ${kpi(IC.projects,'Active Projects',projs.length,'Ongoing construction &amp; fabrication','projects','k-proj',SP_UP,'#4f8cff',20,'up')}
    ${kpi(IC.billing,'Contract Value',M(totCV),'Total awarded value','projects','k-contract',SP_UP,'#34d399',12,'up')}
    ${kpi(IC.inventory,'Inventory Value',M(invVal),'Current stock value','inventory','k-inv',SP_DN,'#a78bfa',-5,'down')}
    ${kpi(IC.billing,'Outstanding',M(outstanding),'Pending receivables','billing','k-out',SP_UP,'#e0a54a',18,'amber')}
  </div>

  <div class="ov-row2">
    <div class="ov-card">
      <div class="ov-card-h"><h2><span class="ov-hic">${svg(IC.billing)}</span>Recent Commercial Documents</h2><a class="ov-link" onclick="go('billing')">View all ${svg(IC.arrow)}</a></div>
      <div class="ov-ptabs">${docTabs.map(t=>`<button class="ov-ptab ${dDoc===t[0]?'on':''}" onclick="setDDoc('${t[0]}')">${t[1]}</button>`).join('')}</div>
      <table class="ov-tbl"><thead><tr><th>Document no.</th><th>Client / project</th><th>Type</th><th class="r">Value</th><th>Status</th><th class="r">Date</th></tr></thead><tbody>
      ${docsF.length?docsF.map(d=>`<tr class="cl" onclick="go('billing')"><td class="b"><span class="ov-rowic sm">${svg(docIc[d.type]||IC.billing)}</span>${esc(d.number)}</td><td>${esc(d.party||d.poNumber||'—')}</td><td class="mut">${esc(typeLbl(d.type))}</td><td class="r b">${M(bT(d))}</td><td>${badge(d.status,docCls(d.status))}</td><td class="r mut">${fmtDM(d.date)}</td></tr>`).join(''):'<tr><td colspan="6" class="ov-empty">No documents match.</td></tr>'}
      </tbody></table>
    </div>
    <div class="ov-card">
      <div class="ov-card-h"><h2><span class="ov-hic">${svg(IC.reports)}</span>Project Status</h2><a class="ov-link" onclick="go('projects')">View all ${svg(IC.arrow)}</a></div>
      <div class="ov-ptabs">${projTabs.map(t=>`<button class="ov-ptab ${dProj===t[0]?'on':''}" onclick="setDProj('${esc(t[0])}')">${t[1]}</button>`).join('')}</div>
      <table class="ov-tbl"><thead><tr><th>Project</th><th>Client</th><th class="r">Value</th><th class="pc">Progress</th><th>Status</th></tr></thead><tbody>
      ${pstat.length?pstat.map(p=>{const pg=prog(p);return `<tr class="cl" onclick="setCurProject('${p.id}')"><td class="b">${esc(p.jobCode||p.name)}</td><td class="mut">${esc(p.client||'—')}</td><td class="r b">${M(p.originalCV||0)}</td><td class="pc"><div class="ov-pctwrap"><div class="ov-bar"><span style="width:${pg}%"></span></div><span class="ov-pctn">${pg}%</span></div></td><td>${badge(p.status,stCls(p.status))}</td></tr>`;}).join(''):'<tr><td colspan="5" class="ov-empty">No projects match.</td></tr>'}
      </tbody></table>
    </div>
  </div>

  <div class="ov-card ov-inv">
    <div class="ov-card-h"><h2><span class="ov-hic">${svg(IC.inventory)}</span>Inventory Overview</h2><a class="ov-link" onclick="go('inventory')">View all ${svg(IC.arrow)}</a></div>
    <table class="ov-tbl"><thead><tr><th>Material</th><th class="r">Stock</th><th>Unit</th><th class="r">Reorder level</th><th>Status</th><th class="r">Last updated</th></tr></thead><tbody>
    ${invRows.length?invRows.map(r=>{const s=invStat(r);return `<tr class="cl" onclick="go('inventory')"><td class="b"><span class="ov-rowic sm">${svg(IC.inventory)}</span>${esc(r.it.name)}</td><td class="r">${num(r.oh)}</td><td class="mut">${esc(r.it.unit)}</td><td class="r mut">${num(r.it.reorder||0)}</td><td><span class="ov-dot ${s[1]}"></span>${s[0]}</td><td class="r mut">${fmtFull(lastMv(r.it.code))}</td></tr>`;}).join(''):'<tr><td colspan="6" class="ov-empty">No materials yet.</td></tr>'}
    </tbody></table>
  </div>

  ${(()=>{ const al=collectAlerts(); const top=al.slice(0,4);
    const sevCls={critical:'red',warning:'amber',info:'blue'};
    const sevLbl={critical:'Critical',warning:'Attention',info:'Info'};
    return `<div class="ov-card ov-ac">
      <div class="ov-card-h"><h2><span class="ov-hic">${svg(IC.bell)}</span>Action Center${al.length?` <span class="ov-count">${al.length}</span>`:''}</h2><a class="ov-link" onclick="go('action')">View all ${svg(IC.arrow)}</a></div>
      <table class="ov-tbl"><thead><tr><th>Needs attention</th><th>Area</th><th>Detail</th><th>Priority</th></tr></thead><tbody>
      ${top.length?top.map(a=>`<tr class="cl" onclick="go('${a.nav}')"><td class="b"><span class="ov-dot ${sevCls[a.sev]}"></span>${esc(a.title)}</td><td class="mut">${esc(a.cat)}</td><td class="mut">${esc(a.detail)}</td><td><span class="ov-badge ${sevCls[a.sev]}">${sevLbl[a.sev]}</span></td></tr>`).join(''):`<tr><td colspan="4" class="ov-empty">All clear — nothing needs attention right now.</td></tr>`}
      </tbody></table>
    </div>`; })()}
  </div>`;
}
function setDDoc(v){ dDoc=v; renderView(); }
function setDProj(v){ dProj=v; renderView(); }

function placeholderHTML(v){
  const titles={dashboard:'Dashboard',projects:'Projects',settings:'Settings',tracking:'Tracking'};
  return `<div class="ph-page"><div class="pc"><div class="pi">${svg(IC[v]||IC.inventory)}</div><h2>${titles[v]||v}</h2><p>This screen is part of the full Qualtech platform. The <b>Inventory</b> module is built out and fully functional — open it from the sidebar.</p><button class="btn" style="margin-top:18px" onclick="go('inventory')">${svg(IC.inventory)} Go to Inventory</button></div></div>`;
}

/* ============================================================
   JOB COST (JCR / JCL) MODULE
   Built from "JCR FOR ERP.xlsx" — project Mr. Bharath Residence (MC 034).
   Cost ledger entries drive the JCL; the JCL rolls up into the JCL Top Sheet
   (FCL vs JCL) and the JCR cost summary. Inventory consumption posts a
   Materials cost entry here, keeping inventory → project cost traceable.
   ============================================================ */
const JCR_CATS = ['Materials','Labour','Sub Agency','Consumables','Tools & Tackles','Fuel & Oil','Hire Charges','Shuttering Hire'];
const JC_PROJECT = { id:'MC034', name:'Mr. Bharath Residence', jobCode:'MC 034', client:'Mr. Bharath', manager:'R. Suresh', address:'Chennai, Tamil Nadu', builtUpArea:9962.96, start:'2026-06-18', finish:'2027-06-30', expected:'2027-06-30', originalCV:200084359.41, revisedCV:200084359.41, status:'In Progress', description:'Construction of residential building', reportingLabel:"August '26", archived:false };
// FCL (Final Cost Limit / budget) per the JCL Top Sheet, for the seeded project's FCL-vs-JCL comparison
const JC_FCL = { 'Materials':89605372, 'Sub Agency':121928513.15, 'Hire Charges':28863069, 'Site Over Heads':28844925.81, grand:269241879.96 };
// standard overhead heads (company template) — a copy is created per project
const OH_TEMPLATE = (JCR_SEED.overheads||[]).map(o=>({code:o.code,desc:o.desc,uptoLast:0,thisMonth:0,etc:0,revised:0}));
const JC_LS='qualtech-jcr-v3';
/* 4 additional demo projects with real cost history — so benchmarks, Projects dashboard
   and historical-rate analysis have variety (5 projects total incl. Mr. Bharath Residence). */
function jcExtraSeed(startN){
  const cc=(JCR_SEED.costCodes||[]); const code=i=>(cc[i]?cc[i].code:'3100');
  // shared item catalogue (base rate); each project scales rates a little so history has spread
  const MAT: [string, string, number, number, string][] = [
    ['OPC 53 Cement','bag',415,2, 'CEM'], ['TMT Bar 16mm','MT',68000,8,'RCC'], ['Ready Mix Concrete M30','Cum',6400,8,'RCC'],
    ['River Sand','Cum',2100,0,'EXC'], ['20mm Aggregate','Cum',1500,0,'EXC'], ['Clay Bricks','Nos',9,5,'BRK'],
    ['Shuttering Ply 12mm','Sqm',820,12,'RCC'], ['Vitrified Tiles 600x600','Sqm',640,20,'FIN'], ['Emulsion Paint','Ltr',285,20,'FIN'],
  ];
  const LAB: [string, string, number, number][] = [ ['Mason','day',1050,6], ['Helper','day',700,6], ['Bar bender','day',1150,8], ['Carpenter','day',1200,12], ['Painter','day',950,20] ];
  const defs=[
    {id:'MC041',name:'Lakeside Commercial Tower',jobCode:'MC 041',client:'Lakeside Developers',manager:'A. Krishnan',address:'OMR, Navalur, Chennai',builtUpArea:48000,originalCV:152000000,status:'In Progress',mul:1.06,month:'2026-07'},
    {id:'MC047',name:'Green Valley Villas',jobCode:'MC 047',client:'Green Valley Estates',manager:'S. Ramesh',address:'Sriperumbudur, Kanchipuram',builtUpArea:26500,originalCV:98500000,status:'In Progress',mul:0.95,month:'2026-08'},
    {id:'MC052',name:'Harbour Logistics Warehouse',jobCode:'MC 052',client:'Harbour Logistics Pvt Ltd',manager:'R. Suresh',address:'Ennore Port Road, Chennai',builtUpArea:120000,originalCV:61000000,status:'In Progress',mul:1.02,month:'2026-09'},
    {id:'MC058',name:'Metro Depot Civil Works',jobCode:'MC 058',client:'City Metro Rail Ltd',manager:'A. Krishnan',address:'Poonamallee, Chennai',builtUpArea:72000,originalCV:187000000,status:'Planning',mul:1.11,month:'2026-09'},
  ];
  const projects=[], entries=[], boq=[], overheads=[]; let n=startN;
  defs.forEach((d,pi)=>{
    projects.push({ id:d.id,name:d.name,jobCode:d.jobCode,client:d.client,manager:d.manager,address:d.address,builtUpArea:d.builtUpArea,
      start:'2026-06-01',finish:'2027-12-31',expected:'2027-12-31',originalCV:d.originalCV,revisedCV:d.originalCV,
      status:d.status,description:'Construction works — '+d.name,reportingLabel:'',archived:false,origin:'seed' });
    MAT.forEach((m,mi)=>{ const rate=Math.round(m[2]*d.mul*(1+((mi%3)-1)*0.02)); const qty=[1200,45,620,900,1400,85000,2600,4200,3800][mi]||100;
      entries.push({id:'CE-'+(n++),projectId:d.id,category:'Materials',date:d.month+'-'+String(5+mi).padStart(2,'0'),billNo:'',desc:m[0],code:code((mi%6)+2),head:m[4],unit:m[1],qty,rate,amount:qty*rate,source:'Cost Materials',createdBy:'Import',createdAt:d.month+'-15'}); });
    LAB.forEach((l,li)=>{ const rate=Math.round(l[2]*d.mul); const qty=[320,480,160,210,140][li]||100;
      entries.push({id:'CE-'+(n++),projectId:d.id,category:'Labour',date:d.month+'-'+String(12+li).padStart(2,'0'),billNo:'',desc:l[0],code:code((li%5)+2),head:'Labour',unit:l[1],qty,rate,amount:qty*rate,source:'Cost Labour',createdBy:'Import',createdAt:d.month+'-15'}); });
    // a couple of sub-agency / hire entries for category variety
    entries.push({id:'CE-'+(n++),projectId:d.id,category:'Sub Agency',date:d.month+'-20',desc:'Waterproofing subcontract',code:code(6),head:'Sub',unit:'Sqm',qty:3200,rate:Math.round(240*d.mul),amount:3200*Math.round(240*d.mul),source:'Sub Agency',createdBy:'Import'});
    entries.push({id:'CE-'+(n++),projectId:d.id,category:'Hire Charges',date:d.month+'-22',desc:'Crane hire',code:code(2),head:'Hire',unit:'Day',qty:30,rate:Math.round(12000*d.mul),amount:30*Math.round(12000*d.mul),source:'Hire',createdBy:'Import'});
    cc.forEach((c,i)=>boq.push({id:'BQ-'+d.id+'-'+(i+1),projectId:d.id,boqNo:String(i+1),code:c.code,desc:c.desc,unit:'',boqQty:null,boqRate:null,revQty:null,archived:false}));
    (JCR_SEED.overheads||[]).forEach(o=>overheads.push(Object.assign({projectId:d.id},{code:o.code,desc:o.desc,uptoLast:0,thisMonth:0,etc:0,revised:0})));
  });
  return {projects,entries,boq,overheads,nextN:n};
}
function jcLoad(): JobCostState {
  try{ const r=localStorage.getItem(JC_LS); if(r){ const d=JSON.parse(r); d.boq=d.boq||[]; d.audit=d.audit||[]; if(!d.currentProjectId) d.currentProjectId=(d.projects[0]||{}).id; return d; } }catch{}
  const entries=[]; let n=1;
  const base={projectId:'MC034', archived:false, createdBy:'Import', createdAt:'2026-08-31'};
  (JCR_SEED.materials||[]).forEach(m=>entries.push(Object.assign({},base,{id:'CE-'+(n++),category:'Materials',date:m.date,billNo:m.billNo,pf:m.pf,pt:m.pt,desc:m.desc,code:m.code,head:m.head,unit:m.unit,qty:m.qty,rate:m.rate,amount:m.amount,source:'Cost Materials'})));
  (JCR_SEED.labour||[]).forEach(m=>entries.push(Object.assign({},base,{id:'CE-'+(n++),category:'Labour',date:m.date,billNo:m.billNo,pf:m.pf,pt:m.pt,desc:m.desc,code:m.code,head:m.head,unit:m.unit,qty:m.qty,rate:m.rate,amount:m.amount,source:'Cost Labour'})));
  (JCR_SEED.consumables||[]).forEach(c=>{ if(c.issAmt) entries.push(Object.assign({},base,{id:'CE-'+(n++),category:'Consumables',date:'2026-08-31',billNo:'',desc:c.desc+' — issued to site',code:c.code,head:'Consumable',unit:c.unit,qty:c.issue,rate:c.rate,amount:c.issAmt,source:'ABSTRACT Consumables'})); });
  const boq=(JCR_SEED.costCodes||[]).map((c,i)=>({id:'BQ-'+(i+1),projectId:'MC034',boqNo:String(i+1),code:c.code,desc:c.desc,unit:'',boqQty:null,boqRate:null,revQty:null,revRate:null,archived:false}));
  const overheads=(JCR_SEED.overheads||[]).map(o=>Object.assign({projectId:'MC034'},o));
  const consumables=(JCR_SEED.consumables||[]).map(c=>Object.assign({projectId:'MC034'},c));
  const ex=jcExtraSeed(n);
  return { projects:[Object.assign({},JC_PROJECT), ...ex.projects], currentProjectId:'MC034', costCodes:JCR_SEED.costCodes.map(c=>Object.assign({},c)), entries:[...entries, ...ex.entries], consumables, overheads:[...overheads, ...ex.overheads], boq:[...boq, ...ex.boq], audit:[], reporting:'2026-08' };
}
let jcr: JobCostState = jcLoad();
function curProject(): Project { return (jcr.projects||[]).find(p=>p.id===jcr.currentProjectId) || (jcr.projects||[])[0] || ({} as Project); }
function fcForProject(cat){ return jcr.currentProjectId==='MC034' ? (JC_FCL[cat]||0) : 0; }
function fcGrand(){ return jcr.currentProjectId==='MC034' ? JC_FCL.grand : 0; }
const projOH=()=>(jcr.overheads||[]).filter(o=>o.projectId===jcr.currentProjectId);
const projBOQ=()=>(jcr.boq||[]).filter(b=>b.projectId===jcr.currentProjectId&&!b.archived);
const projCons=()=>(jcr.consumables||[]).filter(c=>c.projectId===jcr.currentProjectId);
const projEntries=()=>(jcr.entries||[]).filter(e=>e.projectId===jcr.currentProjectId&&!e.archived);
function setCurProject(id){ jcr.currentProjectId=id; jcSave(); view='jobcost'; jcTab='summary'; renderSidebar(); renderView(); window.scrollTo(0,0); }
function jcSave(){ try{ localStorage.setItem(JC_LS, JSON.stringify(jcr)); }catch{} syncPush(JC_LS, jcr); }
function jcAudit(action, detail){ (jcr.audit=jcr.audit||[]).unshift({ at:new Date().toISOString(), by:COMPANY.user, action, detail }); jcr.audit=jcr.audit.slice(0,300); }
function jcNextId(prefix,arr){ let m=0; (arr||[]).forEach(x=>{ const g=((x.id||'').match(/(\d+)$/)||[])[1]; if(g&&+g>m) m=+g; }); return prefix+(m+1); }
const jcMoney=n=>'₹'+Math.round(n||0).toLocaleString('en-IN');
const jcNum=n=>Math.round(n||0).toLocaleString('en-IN');
function jcCodeDesc(code){ const c=(jcr.costCodes||[]).find(x=>x.code===code); return c?c.desc:code; }
function inMonth(d,m){ return (d||'').slice(0,7)===m; }
function beforeMonth(d,m){ return (d||'') < m+'-01'; }
// bucket: 'last' | 'month' | 'this'
function amtBucket(filterFn, bucket){
  return jcr.entries.filter(e=>{ if(e.archived) return false; if(e.projectId!==jcr.currentProjectId) return false; if(!filterFn(e)) return false;
    if(bucket==='month') return inMonth(e.date,jcr.reporting);
    if(bucket==='last') return beforeMonth(e.date,jcr.reporting);
    return true; }).reduce((s,e)=>s+(e.amount||0),0);
}
function codeCat(code,cat,bucket){ return amtBucket(e=>e.code===code&&e.category===cat, bucket); }
function catTotalB(cat,bucket){ return amtBucket(e=>e.category===cat, bucket); }
function codeTotal(code,bucket){ return amtBucket(e=>e.code===code, bucket); }
function grandDirect(bucket){ return JCR_CATS.reduce((s,c)=>s+catTotalB(c,bucket),0); }
function ohTotal(){ return projOH().reduce((s,o)=>s+(Number(o.thisMonth)||0)+(Number(o.uptoLast)||0),0); }

let jcTab='summary', jcBucket='this';
function setJcTab(t){ jcTab=t; renderView(); window.scrollTo(0,0); }
function setJcBucket(b){ jcBucket=b; renderView(); }
function jobCostHTML(){
  const p=curProject();
  const tabs=[['summary','Project Summary'],['jcl','Job Cost Ledger (JCL)'],['jcr','Job Cost Report (JCR)'],['materials','Materials'],['labour','Labour'],['consumables','Consumables'],['overheads','Overheads'],['documents','Documents']];
  let body='';
  if(jcTab==='summary') body=jcSummary();
  else if(jcTab==='jcl') body=jcLedger();
  else if(jcTab==='jcr') body=jcReport();
  else if(jcTab==='materials') body=jcCostLedger('Materials');
  else if(jcTab==='labour') body=jcCostLedger('Labour');
  else if(jcTab==='consumables') body=jcConsumables();
  else if(jcTab==='overheads') body=jcOverheads();
  else if(jcTab==='documents') body=jcDocuments();
  const activeProjects=(jcr.projects||[]).filter(x=>!x.archived);
  return `
  <div class="page-top" style="display:flex;align-items:flex-end;justify-content:space-between;flex-wrap:wrap;gap:12px"><div><h1>Job Cost</h1><p>Project cost reporting (JCR &amp; JCL) linked to inventory consumption.</p></div>
    <div style="display:flex;align-items:center;gap:8px"><label style="font-size:10px;color:var(--dim);font-weight:700;text-transform:uppercase">Project</label>
      <select class="f" style="min-width:230px;font-weight:600" onchange="setCurProject(this.value)">${activeProjects.map(x=>`<option value="${x.id}" ${x.id===jcr.currentProjectId?'selected':''}>${esc(x.name)} (${esc(x.jobCode)})</option>`).join('')}</select>
      <button class="btn sm" onclick="openCreateProject()">${svg(IC.plus)} New Project</button></div>
  </div>
  <div class="panel" style="margin-bottom:16px"><div class="jc-proj">
    <div class="jc-ic">${svg(IC.jobcost)}</div>
    <div class="jc-pmeta">
      <div class="jc-pname">${esc(p.name)} <span class="tag">${esc(p.jobCode)}</span> <span class="tag" style="background:var(--green-bg);color:var(--green)">${esc(p.status||'')}</span></div>
      <div class="jc-pfacts">
        <span><b>Built-up area</b> ${jcNum(p.builtUpArea)} sqft</span>
        <span><b>Start</b> ${p.start}</span>
        <span><b>Finish</b> ${p.finish}</span>
        <span><b>Original CV</b> ${jcMoney(p.originalCV)}</span>
        <span><b>Revised CV</b> ${jcMoney(p.revisedCV)}</span>
      </div>
    </div>
    <div class="jc-phdr-right">
      <label style="font-size:10px;color:var(--dim);font-weight:700;text-transform:uppercase">Reporting month</label>
      <input type="month" class="f" style="padding:7px 10px;font-size:12.5px" value="${jcr.reporting}" onchange="setReporting(this.value)">
      <button class="btn ghost sm" onclick="openAuditTrail()">${svg(IC.history)} Audit trail</button>
    </div>
  </div></div>
  <div class="panel">
    <div class="tabs" style="overflow-x:auto">${tabs.map(t=>`<button class="tab ${jcTab===t[0]?'active':''}" onclick="setJcTab('${t[0]}')">${t[1]}</button>`).join('')}</div>
    ${(jcTab!=='summary'&&jcTab!=='documents')?`<div class="jc-toolbar">${jcActBtns()}</div>`:''}
    <div style="padding:4px 2px">${body}</div>
  </div>`;
}

/* ---- Project Summary = JCR cost summary + JCL Top Sheet (FCL vs JCL) ---- */
function jcSummary(){
  const p=curProject(), bu=p.builtUpArea;
  const direct=grandDirect('this');
  const oh=ohTotal(); const ro=p.originalCV*0.01, ho=p.originalCV*0.02;
  const totalCost=direct+oh+ro+ho; const sales=p.originalCV; const margin=sales-totalCost;
  // ---- project timeline + status ----
  const today=new Date(nowDate()); const sD=new Date(p.start||nowDate()), fD=new Date(p.finish||p.expected||p.start||nowDate());
  const totDays=Math.max(1,Math.round((fD.getTime()-sD.getTime())/864e5));
  const elapsed=Math.max(0,Math.min(totDays,Math.round((today.getTime()-sD.getTime())/864e5)));
  const tPct=Math.round(elapsed/totDays*100), remaining=Math.max(0,totDays-elapsed);
  const spentPct=sales?Math.round(totalCost/sales*100):0;
  const steps=['Planning','In Progress','Nearing Completion','Completed'];
  let cur = p.status==='Completed'?3 : p.status==='Planning'?0 : p.status==='On Hold'?1 : (tPct>=80?2:1);
  const stColor=p.status==='Completed'?['#15803d','#dcfce7']:p.status==='On Hold'?['#b45309','#fef3c7']:['#0369a1','#e0f2fe'];
  const fmtDate=d=>{ const x=new Date(d); return isNaN(x.getTime())?'—':x.getDate()+' '+['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][x.getMonth()]+' '+x.getFullYear(); };
  const timeline=`<div class="jc-tl">
    <div class="jc-tl-top"><div class="jc-tl-title">Project timeline &amp; status <span class="t-badge" style="color:${stColor[0]};background:${stColor[1]}">${esc(p.status||'—')}</span></div>
      <div class="jc-tl-sub">${fmtDate(p.start)} → ${fmtDate(p.finish||p.expected)} · <b>${tPct}%</b> of schedule elapsed</div></div>
    <div class="jc-stepper">${steps.map((s,i)=>`<div class="jc-step ${i<cur?'done':i===cur?'on':''}"><span class="jc-step-dot">${i<cur?svg(IC.check):i+1}</span><span class="jc-step-lab">${s}</span></div>${i<steps.length-1?`<div class="jc-step-line ${i<cur?'done':''}"></div>`:''}`).join('')}</div>
    <div class="jc-tl-bar"><div class="jc-tl-fill" style="width:${tPct}%"></div><div class="jc-tl-today" style="left:${Math.min(99,tPct)}%"><span>Today</span></div></div>
    <div class="jc-tl-stats">
      <div><span>Start</span><b>${fmtDate(p.start)}</b></div>
      <div><span>Expected finish</span><b>${fmtDate(p.finish||p.expected)}</b></div>
      <div><span>Elapsed</span><b>${elapsed} days</b></div>
      <div><span>Remaining</span><b>${remaining} days</b></div>
      <div><span>Schedule elapsed</span><b>${tPct}%</b></div>
      <div><span>Budget spent</span><b class="${spentPct>tPct+10?'jc-over':''}">${spentPct}%</b></div>
    </div></div>`;
  // JCR cost summary
  const summaryRows=[
    ['1','Sales',sales],['2','L + M + P (Direct Cost)',direct],['a','Site Overheads (O-1)',oh],
    ['b','RO Overheads - 1%',ro],['c','HO Overheads - 2%',ho],
  ];
  const jcrSummary=`<div class="jc-sub">JCR Cost Summary — upto ${esc(p.reportingLabel)}</div>
    <table class="jc-tbl"><tbody>
    ${summaryRows.map(r=>`<tr><td class="c">${r[0]}</td><td>${r[1]}</td><td class="r">${jcMoney(r[2])}</td></tr>`).join('')}
    <tr class="tot"><td></td><td>Total Cost</td><td class="r">${jcMoney(totalCost)}</td></tr>
    <tr class="tot"><td></td><td>Margin (Sales − Total Cost)</td><td class="r">${jcMoney(margin)}</td></tr>
    <tr><td></td><td>% Margin</td><td class="r">${sales?((margin/sales)*100).toFixed(2):'0.00'}%</td></tr>
    </tbody></table>`;
  // JCL Top Sheet — FCL vs JCL
  const lsRows=JCR_CATS.map(cat=>{
    const last=catTotalB(cat,'last'), mon=catTotalB(cat,'month'), tot=catTotalB(cat,'this');
    const fcl=fcForProject(cat); return {cat,last,mon,tot,fcl,diff:fcl-tot};
  });
  const totLast=lsRows.reduce((s,r)=>s+r.last,0), totMon=lsRows.reduce((s,r)=>s+r.mon,0), totThis=lsRows.reduce((s,r)=>s+r.tot,0);
  const jclTop=`<div class="jc-sub" style="margin-top:18px">JCL Top Sheet — FCL vs JCL (Direct Cost)</div>
    <div class="tbl-scroll"><table class="jc-tbl wide"><thead><tr><th>Description</th><th class="r">Upto Last Month</th><th class="r">For the Month</th><th class="r">Upto This Month</th><th class="r">Cost / Sqft</th><th class="r">% on Overall</th><th class="r">FCL</th><th class="r">JCL</th><th class="r">Diff (FCL−JCL)</th></tr></thead><tbody>
    ${lsRows.map(r=>`<tr><td>${r.cat}</td><td class="r">${jcMoney(r.last)}</td><td class="r">${jcMoney(r.mon)}</td><td class="r">${jcMoney(r.tot)}</td><td class="r">${bu?(r.tot/bu).toFixed(2):'0'}</td><td class="r">${totThis?((r.tot/totThis)*100).toFixed(1):'0.0'}%</td><td class="r">${r.fcl?jcMoney(r.fcl):'—'}</td><td class="r">${jcMoney(r.tot)}</td><td class="r">${r.fcl?jcMoney(r.diff):'—'}</td></tr>`).join('')}
    <tr class="tot"><td>Total — Direct Cost (A)</td><td class="r">${jcMoney(totLast)}</td><td class="r">${jcMoney(totMon)}</td><td class="r">${jcMoney(totThis)}</td><td class="r">${bu?(totThis/bu).toFixed(2):'0'}</td><td class="r">100%</td><td class="r">${jcMoney(fcGrand())}</td><td class="r">${jcMoney(totThis)}</td><td class="r">${jcMoney(fcGrand()-totThis)}</td></tr>
    </tbody></table></div>
    <div class="jc-flag">${svg(IC.flag)} FCL figures are taken from the workbook's JCL Top Sheet. Some source cells (Abstract Hire, a few JCR Top-sheet totals) contain <b>#REF!</b> / broken external links in the Excel and are flagged rather than guessed.</div>`;
  return timeline+jcrSummary+jclTop;
}

/* ---- Job Cost Ledger (JCL) — cost code × category matrix, drill-down ---- */
function jcLedger(){
  const codes=jcr.costCodes||[];
  const bucketBtns=[['last','Upto Last Month'],['month','For the Month'],['this','Upto This Month']];
  const rows=codes.map(c=>{
    const cells=JCR_CATS.map(cat=>codeCat(c.code,cat,jcBucket));
    const tot=cells.reduce((s,v)=>s+v,0);
    return `<tr class="drill" onclick="jcDrill('${jsid(c.code)}')"><td class="c">${esc(c.code)}</td><td>${esc(c.desc)}</td>${cells.map(v=>`<td class="r">${v?jcNum(v):'—'}</td>`).join('')}<td class="r b">${jcNum(tot)}</td><td class="r" style="width:24px;color:var(--dim)">${svg(IC.drill)}</td></tr>`;
  }).join('');
  const totals=JCR_CATS.map(cat=>catTotalB(cat,jcBucket));
  const grand=totals.reduce((s,v)=>s+v,0);
  return `<div class="jc-bar"><div class="jc-sub">Job Cost Ledger — by cost code &amp; cost head</div>
      <div class="jc-seg">${bucketBtns.map(b=>`<button class="${jcBucket===b[0]?'on':''}" onclick="setJcBucket('${b[0]}')">${b[1]}</button>`).join('')}</div></div>
    <div class="tbl-scroll"><table class="jc-tbl wide"><thead><tr><th>Cost Code</th><th>Description</th>${JCR_CATS.map(c=>`<th class="r">${c}</th>`).join('')}<th class="r">Cum Amount</th><th></th></tr></thead>
    <tbody>${rows}<tr class="tot"><td></td><td>Total</td>${totals.map(v=>`<td class="r">${jcNum(v)}</td>`).join('')}<td class="r">${jcNum(grand)}</td><td></td></tr></tbody></table></div>
    <div class="jc-hint">${svg(IC.drill)} Click any cost-code row to drill down into its underlying cost entries.</div>`;
}
function jcDrill(code){
  const es=jcr.entries.filter(e=>e.code===code&&!e.archived&&e.projectId===jcr.currentProjectId).sort((a,b)=>(a.date||'').localeCompare(b.date||''));
  const rows=es.map(e=>`<tr><td class="nowrap muted">${e.date||''}</td><td><span class="chip ${({Materials:'c-resv',Labour:'c-use',Consumables:'c-normal'})[e.category]||'c-normal'}"><i></i>${e.category}</span></td><td class="mat"><b>${esc(e.desc)}</b></td><td>${esc(e.head||'')}</td><td class="r">${e.qty!=null?jcNum(e.qty):''}</td><td class="r">${e.rate!=null?jcMoney(e.rate):''}</td><td class="r b">${jcMoney(e.amount)}</td><td class="muted" style="font-size:11px">${esc(e.source||'')}</td><td>${jcEntryActs(e)}</td></tr>`).join('')||`<tr class="empty-row"><td colspan="9">No entries.</td></tr>`;
  const total=es.reduce((s,e)=>s+(e.amount||0),0);
  openModal(`<div class="modal wide">${mh('',IC.jobcost,'Cost entries — '+code,esc(jcCodeDesc(code))+' · '+es.length+' entries · '+jcMoney(total))}
    <div class="m-body" style="padding-top:8px"><div style="display:flex;justify-content:flex-end;margin-bottom:10px"><button class="btn sm" onclick="closeModal();openCostEntry(null)">${svg(IC.plus)} Add entry</button></div><div class="tbl-scroll" style="max-height:56vh;overflow:auto"><table class="jc-tbl"><thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Head</th><th class="r">Qty</th><th class="r">Rate</th><th class="r">Amount</th><th>Source</th><th></th></tr></thead><tbody>${rows}</tbody></table></div></div></div>`);
}

/* ---- Materials / Labour cost ledgers ---- */
function jcEntryActs(e){
  return `<div class="jc-row-acts">
    <button title="Edit" onclick="openCostEntry(null,'${jsid(e.id)}')">${svg(IC.edit)}</button>
    <button title="Reverse" onclick="reverseEntry('${jsid(e.id)}')">${svg(IC.xfer)}</button>
    <button title="Archive" class="del" onclick="archiveEntry('${jsid(e.id)}')">${svg(IC.trash)}</button></div>`;
}
function jcCostLedger(category){
  const es=jcr.entries.filter(e=>e.category===category&&!e.archived&&e.projectId===jcr.currentProjectId).sort((a,b)=>(a.date||'').localeCompare(b.date||''));
  let cum=0;
  const rows=es.map(e=>{ cum+=(e.amount||0); return `<tr><td class="nowrap muted">${e.date||''}</td><td>${esc(e.billNo||'')}</td><td class="mat"><b>${esc(e.desc)}</b></td><td class="c">${esc(e.code)}</td><td>${esc(e.head||'')}</td><td>${esc(e.unit||'')}</td><td class="r">${e.qty!=null?jcNum(e.qty):''}</td><td class="r">${e.rate!=null?jcMoney(e.rate):''}</td><td class="r b">${jcMoney(e.amount)}</td><td class="r muted">${jcMoney(cum)}</td><td class="muted" style="font-size:11px">${esc(e.source||'')}</td><td>${jcEntryActs(e)}</td></tr>`; }).join('')||`<tr class="empty-row"><td colspan="12">No ${category.toLowerCase()} entries yet — use “Add ${category} Cost”.</td></tr>`;
  return `<div class="jc-sub">${category} — cost ledger (${es.length} entries · ${jcMoney(cum)})</div>
    <div class="tbl-scroll"><table class="jc-tbl"><thead><tr><th>Date</th><th>Bill No</th><th>Description</th><th>Cost Code</th><th>Head</th><th>Unit</th><th class="r">Qty</th><th class="r">Rate</th><th class="r">Amount</th><th class="r">Cumm Amount</th><th>Source</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

/* ---- Consumables register (receipt / issue / site stock) ---- */
function jcConsumables(){
  const cs=projCons();
  const t=cs.reduce((a,c)=>({rec:a.rec+(c.recAmt||0),iss:a.iss+(c.issAmt||0),stk:a.stk+(c.stkAmt||0)}),{rec:0,iss:0,stk:0});
  const rows=cs.map((c,i)=>`<tr><td class="muted">${i+1}</td><td class="c">${esc(c.code||'')}</td><td class="mat"><b>${esc(c.desc)}</b></td><td>${esc(c.unit||'')}</td><td class="r">${c.receipt!=null?jcNum(c.receipt):''}</td><td class="r">${c.rate!=null?jcMoney(c.rate):''}</td><td class="r">${jcMoney(c.recAmt)}</td><td class="r">${c.issue!=null?jcNum(c.issue):''}</td><td class="r">${jcMoney(c.issAmt)}</td><td class="r">${c.stock!=null?jcNum(c.stock):''}</td><td class="r b">${jcMoney(c.stkAmt)}</td></tr>`).join('');
  return `<div class="jc-sub">Consumables — site register (receipt · issue · stock at site)</div>
    <div class="tbl-scroll"><table class="jc-tbl"><thead><tr><th>Sl</th><th>Cost Code</th><th>Description of Material</th><th>Unit</th><th class="r">Receipt</th><th class="r">Rate</th><th class="r">Amount</th><th class="r">Issue</th><th class="r">Amount</th><th class="r">Stock@Site</th><th class="r">Amount</th></tr></thead>
    <tbody>${rows}<tr class="tot"><td></td><td></td><td>Total</td><td></td><td></td><td></td><td class="r">${jcMoney(t.rec)}</td><td></td><td class="r">${jcMoney(t.iss)}</td><td></td><td class="r">${jcMoney(t.stk)}</td></tr></tbody></table></div>`;
}

/* ---- Overheads abstract ---- */
function jcOverheads(){
  const oh=projOH();
  const t=oh.reduce((a,o)=>({l:a.l+(Number(o.uptoLast)||0),m:a.m+(Number(o.thisMonth)||0),e:a.e+(Number(o.etc)||0),r:a.r+(Number(o.revised)||0)}),{l:0,m:0,e:0,r:0});
  const rows=oh.map(o=>`<tr><td class="c">${esc(o.code)}</td><td class="mat">${esc(o.desc)}</td><td class="r">${jcMoney(o.uptoLast)}</td><td class="r">${jcMoney(o.thisMonth)}</td><td class="r">${jcMoney((Number(o.uptoLast)||0)+(Number(o.thisMonth)||0))}</td><td class="r">${jcMoney(o.etc)}</td><td class="r">${jcMoney(o.revised)}</td><td><div class="jc-row-acts"><button title="Edit" onclick="openOverhead('${jsid(o.code)}')">${svg(IC.edit)}</button></div></td></tr>`).join('');
  return `<div class="jc-sub">Overheads (OH Abstract) — Site Overhead heads</div>
    <div class="tbl-scroll"><table class="jc-tbl"><thead><tr><th>Cost</th><th>Description of Item</th><th class="r">Upto Last Month</th><th class="r">This Month</th><th class="r">JSD (to date)</th><th class="r">Estimate to Complete</th><th class="r">Revised Estimate</th><th></th></tr></thead>
    <tbody>${rows}<tr class="tot"><td></td><td>Total</td><td class="r">${jcMoney(t.l)}</td><td class="r">${jcMoney(t.m)}</td><td class="r">${jcMoney(t.l+t.m)}</td><td class="r">${jcMoney(t.e)}</td><td class="r">${jcMoney(t.r)}</td><td></td></tr></tbody></table></div>`;
}

/* ---- jump into another module from the project's Documents hub ---- */
function docOpenTender(id){ go('tenders'); openTender(id); }
function docOpenMr(id){ go('procurement'); openMr(id); }

/* ---- Documents — every tender, material request, PO & billing doc tied to this project ---- */
function jcDocuments(){
  const p=curProject();
  const tenders=(typeof TDR!=='undefined'?(TDR.tenders||[]):[]).filter(t=>t.projectId===p.id);
  const reqs=(typeof MR!=='undefined'?(MR.requests||[]):[]).filter(r=>r.projectId===p.id);
  const reqIds=new Set(reqs.map(r=>r.id));
  const pos=(typeof MR!=='undefined'?(MR.pos||[]):[]).filter(po=>reqIds.has(po.mrId));
  const bills=(typeof BILL!=='undefined'?(BILL.docs||[]):[]).filter(d=>d.projectId?d.projectId===p.id:d.poNumber===p.jobCode);

  const section=(title,icon,count,addBtn,tableHtml)=>`<div class="panel" style="margin-top:16px">
    <div class="inv-head"><h2>${svg(icon)} ${title}</h2><span class="tag" style="margin-left:8px">${count}</span>
      <div style="margin-left:auto">${addBtn||''}</div></div>
    ${tableHtml}</div>`;

  const tenderRows=tenders.map(t=>`<tr class="drill" onclick="docOpenTender('${t.id}')">
    <td class="c">${esc(t.id)}</td><td><b>${esc(t.name)}</b></td><td>${esc(t.client||'')}</td>
    <td>${statusBadge(t.status)}</td><td class="r">${jcMoney(t.estValue||0)}</td></tr>`).join('')
    ||`<tr class="empty-row"><td colspan="5">No tenders linked to this project.</td></tr>`;

  const reqRows=reqs.map(r=>`<tr class="drill" onclick="docOpenMr('${r.id}')">
    <td class="c">${esc(r.id)}</td><td>${esc(locName(r.site)||'—')}</td><td>${esc(r.requestedBy||'')}</td>
    <td class="r">${(r.lines||[]).length}</td><td>${esc(r.neededBy||'—')}</td><td>${mrBadge(r.status)}</td></tr>`).join('')
    ||`<tr class="empty-row"><td colspan="6">No material requests raised for this project.</td></tr>`;

  const poRows=pos.map(po=>{ const v=vendor(po.vendorId);
    return `<tr class="drill" onclick="docOpenMr('${po.mrId}')">
      <td class="c">${esc(po.id)}</td><td><b>${esc(v?v.name:po.vendorId)}</b></td><td>${esc(po.mrId||'—')}</td>
      <td class="r">${jcMoney((po.lines||[]).reduce((s,l)=>s+(+l.qty||0)*(+l.rate||0),0))}</td>
      <td>${esc(po.expectedDate||'—')}</td><td>${mrBadge(po.status==='Open'?'PO Raised':po.status==='Partially Received'?'Partially Delivered':po.status==='Received'?'Delivered':po.status)}</td></tr>`; }).join('')
    ||`<tr class="empty-row"><td colspan="6">No purchase orders raised against this project.</td></tr>`;

  const billRows=bills.slice().sort((a,b)=>(b.date||b.createdAt||'').localeCompare(a.date||a.createdAt||'')).map(d=>{ const t=billTotals(d);
    return `<tr class="drill" onclick="billPrint('${d.id}')">
      <td><a class="bcd-no">${esc(d.number)}</a></td><td>${billTypeBadge(d.type)}</td><td>${esc(d.party||'—')}</td>
      <td>${esc(d.date||'')}</td><td class="r b">${money(t.total)}</td><td>${billBadge(d.status)}</td></tr>`; }).join('')
    ||`<tr class="empty-row"><td colspan="6">No quotations, POs or invoices linked to this project.</td></tr>`;

  return `<div class="jc-sub">All documents for ${esc(p.name)} (${esc(p.jobCode)})</div>
    ${section('Tenders',IC.tenders,tenders.length,'',
      `<div class="tbl-scroll"><table class="jc-tbl"><thead><tr><th>Tender</th><th>Name</th><th>Client</th><th>Status</th><th class="r">Est. Value</th></tr></thead><tbody>${tenderRows}</tbody></table></div>`)}
    ${section('Material Requests',IC.consume,reqs.length,`<button class="btn ghost sm" onclick="go('procurement');openNewRequest()">${svg(IC.plus)} New Request</button>`,
      `<div class="tbl-scroll"><table class="jc-tbl"><thead><tr><th>Req ID</th><th>Site</th><th>Requested by</th><th class="r">Lines</th><th>Needed by</th><th>Status</th></tr></thead><tbody>${reqRows}</tbody></table></div>`)}
    ${section('Purchase Orders',IC.po,pos.length,'',
      `<div class="tbl-scroll"><table class="jc-tbl"><thead><tr><th>PO</th><th>Vendor</th><th>Against</th><th class="r">Value</th><th>Expected</th><th>Status</th></tr></thead><tbody>${poRows}</tbody></table></div>`)}
    ${section('Quotations, POs &amp; Invoices',IC.billing,bills.length,`<button class="btn ghost sm" onclick="go('billing')">${svg(IC.plus)} New Billing Document</button>`,
      `<div class="tbl-scroll"><table class="jc-tbl"><thead><tr><th>Doc no.</th><th>Type</th><th>Party</th><th>Date</th><th class="r">Amount</th><th>Status</th></tr></thead><tbody>${billRows}</tbody></table></div>`)}`;
}

/* ---- Job Cost Report (JCR) — BOQ-level, actuals from the ledger ---- */
function jcReport(){
  const boq=projBOQ();
  let tBoq=0,tAct=0,anyBoq=false;
  const rows=boq.map(b=>{
    const boqAmt=(b.boqQty!=null&&b.boqRate!=null)?b.boqQty*b.boqRate:null;
    const act=codeTotal(b.code,'this'); const varc=boqAmt!=null?boqAmt-act:null;
    if(boqAmt!=null){ tBoq+=boqAmt; anyBoq=true; } tAct+=act;
    return `<tr><td class="c">${esc(b.boqNo)}</td><td class="c">${esc(b.code)}</td><td class="mat"><b>${esc(b.desc)}</b></td><td>${esc(b.unit||'')}</td><td class="r">${b.boqQty!=null?jcNum(b.boqQty):'—'}</td><td class="r">${b.boqRate!=null?jcMoney(b.boqRate):'—'}</td><td class="r">${boqAmt!=null?jcMoney(boqAmt):'—'}</td><td class="r b">${jcMoney(act)}</td><td class="r" style="color:${varc!=null?(varc>=0?'var(--green)':'var(--red)'):'var(--dim)'}">${varc!=null?jcMoney(varc):'—'}</td><td><div class="jc-row-acts"><button title="Edit BOQ" onclick="openBoq('${jsid(b.id)}')">${svg(IC.edit)}</button><button class="del" title="Archive" onclick="archiveBoq('${jsid(b.id)}')">${svg(IC.trash)}</button></div></td></tr>`;
  }).join('')||`<tr class="empty-row"><td colspan="10">No BOQ items — use “Add BOQ Item” to enter the contract BOQ.</td></tr>`;
  return `<div class="jc-sub">Job Cost Report — BOQ vs actual cost (JSD) by cost code</div>
    <div class="tbl-scroll"><table class="jc-tbl"><thead><tr><th>BOQ No</th><th>Cost Code</th><th>Description (as per BOQ)</th><th>Unit</th><th class="r">BOQ Qty</th><th class="r">BOQ Rate</th><th class="r">BOQ Amount</th><th class="r">Actual (JSD)</th><th class="r">Variance</th><th></th></tr></thead>
    <tbody>${rows}<tr class="tot"><td></td><td></td><td>Total</td><td></td><td></td><td></td><td class="r">${anyBoq?jcMoney(tBoq):'—'}</td><td class="r">${jcMoney(tAct)}</td><td class="r">${anyBoq?jcMoney(tBoq-tAct):'—'}</td><td></td></tr></tbody></table></div>
    ${anyBoq?'':`<div class="jc-flag">${svg(IC.flag)} Enter each line's <b>BOQ Qty &amp; Rate</b> (Edit) to populate BOQ Amount &amp; Variance. The workbook's JCR sheet is for a different site (CES Chennai), so this project's contract BOQ is entered here — actuals are computed live from the cost ledger.</div>`}`;
}

/* ============================================================
   JOB COST — editable layer (CRUD, audit, reversal, export)
   ============================================================ */
/* ---- Cost entry (any category) ---- */
function openCostEntry(category, editId){
  const e = editId ? jcr.entries.find(x=>x.id===editId) : null;
  const cat = e?e.category : (category||'Materials');
  openModal(`<div class="modal wide">${mh('',IC.jobcost, e?'Edit Cost Entry':'Add Cost Entry', 'Posts to the Job Cost Ledger — '+esc(curProject().name))}
    <div class="m-body"><div class="grid2">
      <div class="fld"><label>Category <span class="req">*</span></label><select class="f" id="ce-cat">${JCR_CATS.map(c=>`<option ${cat===c?'selected':''}>${c}</option>`).join('')}</select></div>
      <div class="fld"><label>Cost code <span class="req">*</span></label><select class="f" id="ce-code">${jcr.costCodes.map(c=>`<option value="${c.code}" ${e&&e.code===c.code?'selected':''}>${c.code} — ${esc(c.desc)}</option>`).join('')}</select></div>
      <div class="fld col2"><label>Description <span class="req">*</span></label><input class="f" id="ce-desc" value="${e?esc(e.desc):''}" placeholder="What was the cost for"></div>
      <div class="fld"><label>Head</label><input class="f" id="ce-head" value="${e?esc(e.head||''):''}" placeholder="e.g. M 35, Steel"></div>
      <div class="fld"><label>Unit</label><input class="f" id="ce-unit" value="${e?esc(e.unit||''):''}" placeholder="Cum, kg, Nos"></div>
      <div class="fld"><label>Quantity</label><input class="f" id="ce-qty" type="number" step="any" value="${e&&e.qty!=null?e.qty:''}" oninput="ceAmt()"></div>
      <div class="fld"><label>Rate (₹)</label><input class="f" id="ce-rate" type="number" step="any" value="${e&&e.rate!=null?e.rate:''}" oninput="ceAmt()"></div>
      <div class="fld"><label>Amount (₹) <span class="req">*</span></label><input class="f" id="ce-amt" type="number" step="any" value="${e?e.amount:''}" placeholder="auto = qty × rate"></div>
      <div class="fld"><label>Date <span class="req">*</span></label><input class="f" id="ce-date" type="date" value="${e?e.date:nowDate()}"></div>
      <div class="fld"><label>Bill No</label><input class="f" id="ce-bill" value="${e?esc(e.billNo||''):''}"></div>
    </div></div>
    <div class="m-foot"><button class="btn ghost" onclick="closeModal()">Cancel</button><button class="btn" onclick="submitCostEntry(${e?`'${e.id}'`:'null'})">${e?'Save changes':'Add entry'}</button></div></div>`);
}
function ceAmt(){ const q=parseFloat(val('ce-qty'))||0, r=parseFloat(val('ce-rate'))||0; if(q&&r){ const a=(document.getElementById('ce-amt') as HTMLInputElement); if(a) a.value=String(+(q*r).toFixed(2)); } }
function submitCostEntry(editId){
  const cat=val('ce-cat'), code=val('ce-code'), desc=val('ce-desc'), amt=parseFloat(val('ce-amt'))||0;
  if(!desc) return toast('Description is required');
  if(!amt) return toast('Enter an amount (or qty × rate)');
  const rec={category:cat,code,desc,head:val('ce-head'),unit:val('ce-unit'),qty:parseFloat(val('ce-qty'))||null,rate:parseFloat(val('ce-rate'))||null,amount:amt,date:val('ce-date'),billNo:val('ce-bill')};
  if(editId){ const e=jcr.entries.find(x=>x.id===editId); Object.assign(e,rec,{updatedBy:COMPANY.user,updatedAt:new Date().toISOString()}); jcAudit('edit','Cost entry '+editId+' ('+code+') → '+jcMoney(amt)); toast('Entry updated'); }
  else{ const id=jcNextId('CE-',jcr.entries); jcr.entries.push(Object.assign({id,projectId:curProject().id,source:'Manual entry',archived:false,createdBy:COMPANY.user,createdAt:new Date().toISOString()},rec)); jcAudit('add','Cost entry '+id+' '+cat+'/'+code+' '+jcMoney(amt)); toast('Entry added — totals recalculated'); }
  jcSave(); closeModal(); renderView();
}
function archiveEntry(id){ const e=jcr.entries.find(x=>x.id===id); if(!e) return; if(!confirm((e.archived?'Restore':'Archive')+' entry '+id+'? Archived entries are kept but excluded from totals.')) return; e.archived=!e.archived; jcAudit(e.archived?'archive':'restore','Cost entry '+id); jcSave(); renderView(); toast(e.archived?'Entry archived':'Entry restored'); }
function reverseEntry(id){ const e=jcr.entries.find(x=>x.id===id); if(!e||e.archived) return; if(!confirm('Post a reversing entry for '+id+' ('+jcMoney(e.amount)+')? The original stays for audit.')) return; const nid=jcNextId('CE-',jcr.entries); jcr.entries.push(Object.assign({},e,{id:nid,amount:-e.amount,qty:e.qty!=null?-e.qty:null,desc:'REVERSAL of '+id+' — '+e.desc,source:'Reversal of '+id,createdBy:COMPANY.user,createdAt:new Date().toISOString(),updatedBy:undefined,updatedAt:undefined})); jcAudit('reverse','Reversed '+id+' with '+nid); jcSave(); renderView(); toast('Reversing entry '+nid+' posted'); }

/* ---- BOQ item ---- */
function openBoq(editId){
  const b=editId?jcr.boq.find(x=>x.id===editId):null;
  openModal(`<div class="modal">${mh('',IC.reports,b?'Edit BOQ Item':'Add BOQ Item','Contract BOQ line — '+esc(curProject().jobCode))}
    <div class="m-body"><div class="grid2">
      <div class="fld"><label>BOQ No <span class="req">*</span></label><input class="f" id="bq-no" value="${b?esc(b.boqNo):''}"></div>
      <div class="fld"><label>Cost code</label><select class="f" id="bq-code">${jcr.costCodes.map(c=>`<option value="${c.code}" ${b&&b.code===c.code?'selected':''}>${c.code} — ${esc(c.desc)}</option>`).join('')}</select></div>
      <div class="fld col2"><label>Description <span class="req">*</span></label><input class="f" id="bq-desc" value="${b?esc(b.desc):''}"></div>
      <div class="fld"><label>Unit</label><input class="f" id="bq-unit" value="${b?esc(b.unit||''):''}"></div>
      <div class="fld"><label>BOQ Qty</label><input class="f" id="bq-qty" type="number" step="any" value="${b&&b.boqQty!=null?b.boqQty:''}"></div>
      <div class="fld"><label>BOQ Rate (₹)</label><input class="f" id="bq-rate" type="number" step="any" value="${b&&b.boqRate!=null?b.boqRate:''}"></div>
      <div class="fld"><label>Revised Qty</label><input class="f" id="bq-rqty" type="number" step="any" value="${b&&b.revQty!=null?b.revQty:''}"></div>
    </div></div>
    <div class="m-foot"><button class="btn ghost" onclick="closeModal()">Cancel</button><button class="btn" onclick="submitBoq(${b?`'${b.id}'`:'null'})">${b?'Save':'Add BOQ item'}</button></div></div>`);
}
function submitBoq(editId){ const no=val('bq-no'), desc=val('bq-desc'); if(!no||!desc) return toast('BOQ No and description required'); const rec={boqNo:no,code:val('bq-code'),desc,unit:val('bq-unit'),boqQty:parseFloat(val('bq-qty'))||null,boqRate:parseFloat(val('bq-rate'))||null,revQty:parseFloat(val('bq-rqty'))||null}; if(editId){ const ex=jcr.boq.find(x=>x.id===editId); if(!ex){ closeModal(); renderView(); return toast('That BOQ item no longer exists — it may have been removed elsewhere'); } Object.assign(ex,rec); jcAudit('edit','BOQ '+editId); toast('BOQ updated'); } else { const id=jcNextId('BQ-',jcr.boq); jcr.boq.push(Object.assign({id,projectId:jcr.currentProjectId,archived:false},rec)); jcAudit('add','BOQ '+id); toast('BOQ item added'); } jcSave(); closeModal(); renderView(); }
function archiveBoq(id){ const b=jcr.boq.find(x=>x.id===id); if(!b) return; b.archived=!b.archived; jcAudit(b.archived?'archive':'restore','BOQ '+id); jcSave(); renderView(); }

/* ---- Cost code ---- */
function openCostCode(editCode){
  const c=editCode?jcr.costCodes.find(x=>x.code===editCode):null;
  openModal(`<div class="modal">${mh('',IC.jobcost,c?'Edit Cost Code':'Add Cost Code','Cost codes drive the JCL rows & cost entries')}
    <div class="m-body"><div class="grid2">
      <div class="fld"><label>Code <span class="req">*</span></label><input class="f" id="cc-code" value="${c?esc(c.code):''}" ${c?'readonly':''} placeholder="e.g. 8000"></div>
      <div class="fld col2"><label>Description <span class="req">*</span></label><input class="f" id="cc-desc" value="${c?esc(c.desc):''}"></div>
    </div></div>
    <div class="m-foot"><button class="btn ghost" onclick="closeModal()">Cancel</button><button class="btn" onclick="submitCostCode(${c?`'${jsid(c.code)}'`:'null'})">${c?'Save':'Add cost code'}</button></div></div>`);
}
function submitCostCode(editCode){ const code=val('cc-code'), desc=val('cc-desc'); if(!code||!desc) return toast('Code and description required'); if(!editCode && !CODE_RE.test(code)) return toast('Code can use letters, numbers, spaces and . _ - / only'); if(!editCode && jcr.costCodes.some(x=>x.code===code)) return toast('That code already exists'); if(editCode){ const ex=jcr.costCodes.find(x=>x.code===editCode); if(!ex){ closeModal(); renderView(); return toast('That cost code no longer exists — it may have been removed elsewhere'); } ex.desc=desc; jcAudit('edit','Cost code '+editCode); } else { jcr.costCodes.push({code,desc}); jcAudit('add','Cost code '+code); } jcSave(); closeModal(); renderView(); toast('Cost code saved'); }

/* ---- Overhead head ---- */
function openOverhead(editCode){
  const o=editCode?jcr.overheads.find(x=>x.code===editCode):null;
  openModal(`<div class="modal">${mh('',IC.jobcost,o?'Edit Overhead':'Add Overhead Head','Site overhead expense head')}
    <div class="m-body"><div class="grid2">
      <div class="fld"><label>Code <span class="req">*</span></label><input class="f" id="oh-code" value="${o?esc(o.code):''}" ${o?'readonly':''} placeholder="SOH 120"></div>
      <div class="fld col2"><label>Description <span class="req">*</span></label><input class="f" id="oh-desc" value="${o?esc(o.desc):''}"></div>
      <div class="fld"><label>Upto Last Month</label><input class="f" id="oh-last" type="number" step="any" value="${o&&o.uptoLast!=null?o.uptoLast:''}"></div>
      <div class="fld"><label>This Month</label><input class="f" id="oh-month" type="number" step="any" value="${o&&o.thisMonth!=null?o.thisMonth:''}"></div>
      <div class="fld"><label>Estimate to Complete</label><input class="f" id="oh-etc" type="number" step="any" value="${o&&o.etc!=null?o.etc:''}"></div>
      <div class="fld"><label>Revised Estimate</label><input class="f" id="oh-rev" type="number" step="any" value="${o&&o.revised!=null?o.revised:''}"></div>
    </div></div>
    <div class="m-foot"><button class="btn ghost" onclick="closeModal()">Cancel</button><button class="btn" onclick="submitOverhead(${o?`'${jsid(o.code)}'`:'null'})">${o?'Save':'Add overhead'}</button></div></div>`);
}
function submitOverhead(editCode){ const code=val('oh-code'), desc=val('oh-desc'); if(!code||!desc) return toast('Code and description required'); if(!editCode && !CODE_RE.test(code)) return toast('Code can use letters, numbers, spaces and . _ - / only'); const rec={desc,uptoLast:parseFloat(val('oh-last'))||0,thisMonth:parseFloat(val('oh-month'))||0,etc:parseFloat(val('oh-etc'))||0,revised:parseFloat(val('oh-rev'))||0}; const pid=jcr.currentProjectId; if(editCode){ const ex=jcr.overheads.find(x=>x.code===editCode&&x.projectId===pid); if(!ex){ closeModal(); renderView(); return toast('That overhead no longer exists — it may have been removed elsewhere'); } Object.assign(ex,rec); jcAudit('edit','Overhead '+editCode); } else { if(jcr.overheads.some(x=>x.code===code&&x.projectId===pid)) return toast('Code exists'); jcr.overheads.push(Object.assign({code,projectId:pid},rec)); jcAudit('add','Overhead '+code); } jcSave(); closeModal(); renderView(); toast('Overhead saved'); }

/* ---- reporting period + audit + export ---- */
function setReporting(v){ if(v){ jcr.reporting=v; jcSave(); renderView(); } }
function openAuditTrail(){
  const rows=(jcr.audit||[]).map(a=>`<tr><td class="nowrap muted">${new Date(a.at).toLocaleString('en-GB')}</td><td>${esc(a.by)}</td><td><span class="chip c-resv"><i></i>${esc(a.action)}</span></td><td>${esc(a.detail)}</td></tr>`).join('')||`<tr class="empty-row"><td colspan="4">No changes recorded yet.</td></tr>`;
  openModal(`<div class="modal wide">${mh('',IC.history,'Audit Trail','Who changed what, and when')}
    <div class="m-body" style="padding-top:8px"><div class="tbl-scroll" style="max-height:60vh;overflow:auto"><table class="jc-tbl"><thead><tr><th>When</th><th>By</th><th>Action</th><th>Detail</th></tr></thead><tbody>${rows}</tbody></table></div></div></div>`);
}
function csvEscape(v){ return '"'+String(v==null?'':v).replace(/"/g,'""')+'"'; }
function downloadCSV(name: string, rows: CsvRow[]){ const csv=rows.map(r=>r.map(csvEscape).join(',')).join('\n'); const a=document.createElement('a'); a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv); a.download=name; document.body.appendChild(a); a.click(); a.remove(); toast('Exported '+name); }
function jcExport(){
  if(jcTab==='jcl'){ const rows: CsvRow[]=[['Cost Code','Description',...JCR_CATS,'Cum Amount']]; jcr.costCodes.forEach(c=>{ const cells=JCR_CATS.map(cat=>codeCat(c.code,cat,jcBucket)); rows.push([c.code,c.desc,...cells,cells.reduce((s,v)=>s+v,0)]); }); downloadCSV('JCL_'+curProject().jobCode+'.csv',rows); }
  else if(jcTab==='materials'||jcTab==='labour'){ const cat=jcTab==='materials'?'Materials':'Labour'; const rows: CsvRow[]=[['Date','Bill No','Description','Cost Code','Head','Unit','Qty','Rate','Amount','Source']]; jcr.entries.filter(e=>e.category===cat&&!e.archived&&e.projectId===jcr.currentProjectId).forEach(e=>rows.push([e.date,e.billNo,e.desc,e.code,e.head,e.unit,e.qty,e.rate,e.amount,e.source])); downloadCSV(cat+'_'+curProject().jobCode+'.csv',rows); }
  else if(jcTab==='jcr'){ const rows: CsvRow[]=[['BOQ No','Cost Code','Description','Unit','BOQ Qty','BOQ Rate','BOQ Amount','Actual Cost','Variance']]; projBOQ().forEach(b=>{ const ba=(b.boqQty||0)*(b.boqRate||0); const act=codeTotal(b.code,'this'); rows.push([b.boqNo,b.code,b.desc,b.unit,b.boqQty,b.boqRate,ba,act,ba?ba-act:'']); }); downloadCSV('JCR_'+curProject().jobCode+'.csv',rows); }
  else if(jcTab==='overheads'){ const rows: CsvRow[]=[['Code','Description','Upto Last Month','This Month','JSD','Estimate to Complete','Revised Estimate']]; projOH().forEach(o=>rows.push([o.code,o.desc,o.uptoLast,o.thisMonth,(Number(o.uptoLast)||0)+(Number(o.thisMonth)||0),o.etc,o.revised])); downloadCSV('Overheads_'+curProject().jobCode+'.csv',rows); }
  else if(jcTab==='consumables'){ const rows: CsvRow[]=[['Cost Code','Description','Unit','Receipt','Rate','Rec Amount','Issue','Iss Amount','Stock','Stock Amount']]; projCons().forEach(c=>rows.push([c.code,c.desc,c.unit,c.receipt,c.rate,c.recAmt,c.issue,c.issAmt,c.stock,c.stkAmt])); downloadCSV('Consumables_'+curProject().jobCode+'.csv',rows); }
  else { toast('Nothing to export on this tab'); }
}
function jcActBtns(){
  let add='';
  if(jcTab==='jcl') add=`<button class="btn sm" onclick="openCostEntry()">${svg(IC.plus)} Add Cost Entry</button><button class="btn ghost sm" onclick="openCostCode()">${svg(IC.plus)} Cost Code</button>`;
  else if(jcTab==='materials') add=`<button class="btn sm" onclick="openCostEntry('Materials')">${svg(IC.plus)} Add Material Cost</button>`;
  else if(jcTab==='labour') add=`<button class="btn sm" onclick="openCostEntry('Labour')">${svg(IC.plus)} Add Labour Cost</button>`;
  else if(jcTab==='jcr') add=`<button class="btn sm" onclick="openBoq()">${svg(IC.plus)} Add BOQ Item</button>`;
  else if(jcTab==='overheads') add=`<button class="btn sm" onclick="openOverhead()">${svg(IC.plus)} Add Overhead</button>`;
  const exp = jcTab!=='summary' ? `<button class="btn ghost sm" onclick="jcExport()">${svg('<path d="M12 15V3M7 10l5 5 5-5"/><path d="M4 21h16"/>')} Export CSV</button>` : '';
  return `<div class="jc-acts">${add}${exp}</div>`;
}

/* ============================================================
   PROJECTS MODULE — multi-project dashboard + create workflow
   ============================================================ */
function projActual(pid){ return jcr.entries.filter(e=>e.projectId===pid&&!e.archived).reduce((s,e)=>s+(e.amount||0),0); }
function projCurrent(pid){ return jcr.entries.filter(e=>e.projectId===pid&&!e.archived&&inMonth(e.date,jcr.reporting)).reduce((s,e)=>s+(e.amount||0),0); }
function kpiTile(v,l){ return `<div class="kpi"><div class="kmid"><div class="kv">${v}</div><div class="kl">${l}</div></div></div>`; }
function projectsHTML(){
  const ps=(jcr.projects||[]);
  const active=ps.filter(p=>!p.archived);
  const totCV=active.reduce((s,p)=>s+(p.originalCV||0),0);
  const totAct=active.reduce((s,p)=>s+projActual(p.id),0);
  const rows=ps.map(p=>{ const act=projActual(p.id), cur=projCurrent(p.id); const cv=p.originalCV||0;
    return `<tr class="drill" onclick="setCurProject('${p.id}')">
      <td class="c">${esc(p.jobCode)}</td><td class="mat"><b>${esc(p.name)}</b></td><td>${esc(p.client||'—')}</td><td>${esc(p.manager||'—')}</td>
      <td><span class="chip ${p.status==='Completed'?'c-normal':(p.status==='On Hold'?'c-low':'c-resv')}"><i></i>${esc(p.status||'—')}</span></td>
      <td class="r">${cv?jcMoney(cv):'—'}</td><td class="r b">${jcMoney(act)}</td><td class="r">${jcMoney(cur)}</td><td class="r">${cv?jcMoney(cv-act):'—'}</td>
      <td><div class="jc-row-acts"><button title="Open" onclick="event.stopPropagation();setCurProject('${p.id}')">${svg(IC.drill)}</button></div></td></tr>`; }).join('')||`<tr class="empty-row"><td colspan="10">No projects yet — click “Create New Project”.</td></tr>`;
  return `<div class="page-top" style="display:flex;align-items:flex-end;justify-content:space-between;flex-wrap:wrap;gap:12px"><div><h1>Projects</h1><p>All construction projects — one centralized system, shared masters, per-project costing.</p></div><button class="btn" onclick="openCreateProject()">${svg(IC.plus)} Create New Project</button></div>
    <div class="page-kpis">${kpiTile(active.length,'Active Projects')}${kpiTile(jcMoney(totCV),'Total Contract Value')}${kpiTile(jcMoney(totAct),'Actual Cost to Date')}${kpiTile(jcMoney(totCV-totAct),'Overall Headroom')}</div>
    <div class="panel"><div class="inv-head"><h2>All Projects</h2><div style="margin-left:auto;color:var(--muted);font-size:12px">Click a project to open its JCR / JCL / cost ledgers</div></div>
    <div class="tbl-scroll"><table class="jc-tbl"><thead><tr><th>Job Code</th><th>Project</th><th>Client</th><th>Manager</th><th>Status</th><th class="r">Contract Value</th><th class="r">Actual Cost</th><th class="r">This Period</th><th class="r">Variance</th><th></th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
}
function openCreateProject(){
  openModal(`<div class="modal wide">${mh('',IC.projects,'Create New Project','Initializes JCR, JCL, cost ledgers &amp; BOQ — reusing shared masters')}
    <div class="m-body"><div class="grid2">
      <div class="fld"><label>Project name <span class="req">*</span></label><input class="f" id="np-name" placeholder="e.g. Green Valley Villas"></div>
      <div class="fld"><label>Job code <span class="req">*</span></label><input class="f" id="np-code" placeholder="e.g. MC 041"></div>
      <div class="fld"><label>Client name</label><input class="f" id="np-client"></div>
      <div class="fld"><label>Project manager</label><input class="f" id="np-pm" value="${COMPANY.user}"></div>
      <div class="fld col2"><label>Site address</label><input class="f" id="np-addr"></div>
      <div class="fld"><label>Start date</label><input class="f" id="np-start" type="date" value="${nowDate()}"></div>
      <div class="fld"><label>Expected completion</label><input class="f" id="np-finish" type="date"></div>
      <div class="fld"><label>Contract value (₹)</label><input class="f" id="np-cv" type="number" step="any"></div>
      <div class="fld"><label>Built-up area (sqft)</label><input class="f" id="np-bua" type="number" step="any"></div>
      <div class="fld"><label>Status</label><select class="f" id="np-status"><option>In Progress</option><option>Planning</option><option>On Hold</option><option>Completed</option></select></div>
      <div class="fld col2"><label>Description</label><input class="f" id="np-desc"></div>
    </div><div class="hint">${svg(IC.jobcost)}<div>A new project starts empty and ready for entry: it <b>reuses</b> the shared material master, vendors, cost codes &amp; locations, and gets its own JCR/JCL, cost ledgers, BOQ (one line per cost code) and a copy of the standard overhead heads.</div></div></div>
    <div class="m-foot"><button class="btn ghost" onclick="closeModal()">Cancel</button><button class="btn" onclick="submitCreateProject()">Create project</button></div></div>`);
}
function jobCodeExists(code){ return (jcr.projects||[]).some(p=>(p.jobCode||'').replace(/\s/g,'').toLowerCase()===String(code).replace(/\s/g,'').toLowerCase()); }
/* Reusable project initialization — used by the Projects module AND by Tender→Project conversion.
   proj: a project record (id/name/jobCode/... ). opts.boq: optional BOQ lines carrying budget qty/rate
   (from an awarded tender estimate); otherwise one empty BOQ line per shared cost code. */
function initProject(proj, opts?){
  opts=opts||{};
  jcr.projects.push(proj);
  const lines = (opts.boq && opts.boq.length) ? opts.boq
    : jcr.costCodes.map((c,i)=>({boqNo:String(i+1),code:c.code,desc:c.desc,unit:'',boqQty:null,boqRate:null}));
  lines.forEach((b,i)=>jcr.boq.push({ id:jcNextId('BQ-',jcr.boq), projectId:proj.id, boqNo:b.boqNo||String(i+1), code:b.code, desc:b.desc, unit:b.unit||'', boqQty:(b.boqQty!=null?b.boqQty:null), boqRate:(b.boqRate!=null?b.boqRate:null), revQty:null, archived:false }));
  OH_TEMPLATE.forEach(o=>jcr.overheads.push(Object.assign({projectId:proj.id},o)));
  return proj.id;
}
function submitCreateProject(){
  const name=val('np-name'), code=val('np-code'); if(!name||!code) return toast('Project name and job code are required');
  if(jobCodeExists(code)) return toast('That job code already exists');
  const id='P'+Date.now().toString(36).toUpperCase();
  const cv=parseFloat(val('np-cv'))||0;
  initProject({ id, name, jobCode:code, client:val('np-client'), manager:val('np-pm')||COMPANY.user, address:val('np-addr'), start:val('np-start'), finish:val('np-finish'), expected:val('np-finish'), originalCV:cv, revisedCV:cv, builtUpArea:parseFloat(val('np-bua'))||0, status:val('np-status')||'In Progress', description:val('np-desc'), reportingLabel:'', archived:false, origin:'manual' });
  jcr.currentProjectId=id; jcAudit('create-project', code+' — '+name); jcSave();
  closeModal(); toast('Project '+code+' created — JCR/JCL initialized'); view='jobcost'; jcTab='summary'; renderSidebar(); renderView(); window.scrollTo(0,0);
}

/* ---------- reset ---------- */
function reset(){ if(confirm('Reset all inventory & job-cost demo data to the seed?')){ resetData(); try{ localStorage.removeItem(JC_LS); }catch{} jcr=jcLoad(); jcSave(); renderView(); toast('Demo data reset'); } }

/* ---------- boot ---------- */
/* defer first paint until all module scripts (tender/procure/billing) have defined their globals */
/* ---------- global safety net ---------- */
/* Any uncaught error or rejected promise anywhere in the app surfaces as a
   quiet toast instead of silently breaking a click or leaving a blank screen. */
let _lastErrAt=0;
function reportGlobalError(label, detail){
  const now=Date.now();
  if(now-_lastErrAt<1500) return;   // don't spam if an error repeats
  _lastErrAt=now;
  console.error(label, detail);
  try{ toast('Something didn’t go through — please try again'); }catch{}
}
if(typeof window!=='undefined'){
  window.addEventListener('error', e=>reportGlobalError('Uncaught error:', e.error||e.message));
  window.addEventListener('unhandledrejection', e=>reportGlobalError('Unhandled promise rejection:', e.reason));
}

function boot(){
  try{ initTheme(); renderSidebar(); renderTopbar(); renderView(); }
  catch(err){
    console.error('boot failed:', err);
    const el=document.getElementById('app');
    if(el) el.innerHTML=renderErrorHTML('startup', err);
  }
}
// when sync.ts is in charge it calls boot() after every script has loaded
if(!window.qtDeferBoot){ if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot(); }
