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
};

/* ---------- state ---------- */
const LS='qualtech-inv-v3';
const clone=o=>JSON.parse(JSON.stringify(o));
function load(): InventoryState { try{ const r=localStorage.getItem(LS); if(r) return JSON.parse(r); }catch{} return clone(SEED); }
function save(){ try{ localStorage.setItem(LS, JSON.stringify(state)); }catch{} syncPush(LS, state); }
function resetData(){ state=clone(SEED); save(); }
let state: InventoryState = load();

const item=c=>state.items.find(i=>i.code===c);
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
function toast(msg){ const t=document.getElementById('toast'); t.innerHTML=svg(IC.check)+'<span>'+msg+'</span>'; t.classList.add('on'); clearTimeout(window._tt); window._tt=setTimeout(()=>t.classList.remove('on'),2600); }

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
  const nav=[['dashboard','Dashboard'],['tracking','Tracking'],['tenders','Bidding'],['projects','Projects'],['procurement','Procurement'],['inventory','Inventory'],['jobcost','Job Costs'],['billing','Connected Documents'],['vendors','Vendors'],['reports','Reports'],['settings','Settings']];
  document.getElementById('sidebar').innerHTML=`
    <div class="logo">${svg(IC.logo,36)}<b>Qualtech<br>Engineers Pvt. Ltd.</b></div>
    <nav class="nav">${nav.map(n=>`<button class="nav-item ${view===n[0]?'active':''}" onclick="go('${n[0]}')">${svg(IC[n[0]]||IC.dashboard)} ${n[1]}</button>`).join('')}</nav>`;
}
function renderTopbar(){
  document.getElementById('topbar').innerHTML=`
    <div class="search">${svg(IC.search)}<input id="topSearch" placeholder="Search material, item code, or location…" value="${esc(qFilter)}" oninput="topSearch(this.value)"></div>
    <div class="tb-right">
      <button class="bell" title="Toggle light / dark" onclick="toggleTheme()">${svg(document.documentElement.getAttribute('data-theme')==='dark'?ICsun:ICmoon)}</button>
      <button class="bell" title="Notifications"><span class="dot"></span>${svg(IC.bell)}</button>
      <div class="user"><div class="avatar">RS</div><div class="u"><b>${COMPANY.user}</b><span>${COMPANY.role}</span></div>${svg(IC.chev)}</div>
    </div>`;
}
function go(v){ view=v; page=1; renderSidebar(); renderView(); window.scrollTo(0,0); }
function topSearch(v){ qFilter=v; page=1; if(view!=='inventory'){ view='inventory'; renderSidebar(); } renderView(); }
function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

/* ---------- router ---------- */
function renderView(){
  const el=document.getElementById('app');
  if(view==='dashboard'){ el.innerHTML=dashboardHTML(); return; }
  if(view==='inventory'){ el.innerHTML=inventoryHTML(); bindInv(); return; }
  if(view==='jobcost'){ el.innerHTML=jobCostHTML(); return; }
  if(view==='projects'){ el.innerHTML=projectsHTML(); return; }
  if(view==='tenders'){ el.innerHTML=tenderHTML(); if(typeof bindTender==='function') bindTender(); return; }
  if(view==='procurement'){ el.innerHTML=procureHTML(); if(typeof bindProcure==='function') bindProcure(); return; }
  if(view==='billing'){ el.innerHTML=billingHTML(); if(typeof billBind==='function') billBind(); return; }
  if(view==='reports'){ el.innerHTML=reportsHTML(); return; }
  if(view==='vendors'){ el.innerHTML=vendorsHTML(); return; }
  el.innerHTML=placeholderHTML(view);
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
function invSearch(v){ qFilter=v; page=1; const f=document.getElementById('invSearch'); renderView(); const f2=(document.getElementById('invSearch') as HTMLInputElement); if(f2){ f2.focus(); f2.setSelectionRange(v.length,v.length);} }
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
  m.innerHTML=`
    <button onclick="openStockIn('${code}')">${svg(IC.in)} Stock In</button>
    <button onclick="openStockOut('${code}')">${svg(IC.out)} Stock Out</button>
    <button onclick="openTransfer('${code}')">${svg(IC.xfer)} Transfer</button>
    <button onclick="openReserve('${code}')">${svg(IC.reserve)} Reserve</button>
    <button onclick="openConsume('${code}')">${svg(IC.consume)} Consume</button>
    <button onclick="openHistory('${code}')">${svg(IC.history)} Movements</button>
    <button onclick="openEditItem('${code}')">${svg(IC.edit)} Edit item</button>
    <button class="del" onclick="delItem('${code}')">${svg(IC.trash)} Delete item</button>`;
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
  save(); closeModal(); renderView(); toast(num(qty)+' '+item(code).unit+' of '+item(code).name+' added');
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
function soAvail(){ const c=val('so-code'), l=val('so-loc'); const e=document.getElementById('so-oh'); if(e&&c&&l) e.textContent=num(onHand(c,l))+' '+item(c).unit; }
function submitStockOut(){
  const code=val('so-code'), qty=numVal('so-qty'), l=val('so-loc'); if(!code||qty<=0) return toast('Enter a valid quantity');
  if(qty>onHand(code,l)) return toast('Not enough stock — only '+num(onHand(code,l))+' available');
  addMovement({code,qty,from:l,to:val('so-reason'),type:'OUT',ref:val('so-ref')||'Stock out',person:val('so-person')||COMPANY.user,date:val('so-date')});
  save(); closeModal(); renderView(); toast(num(qty)+' '+item(code).unit+' of '+item(code).name+' issued');
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
function trAvail(){ const c=val('tr-code'),l=val('tr-from'); const e=document.getElementById('tr-oh'); if(e&&c&&l) e.textContent=num(onHand(c,l))+' '+item(c).unit; }
function submitTransfer(){
  const code=val('tr-code'), qty=numVal('tr-qty'), from=val('tr-from'), to=val('tr-to');
  if(!code||qty<=0) return toast('Enter a valid quantity');
  if(from===to) return toast('Pick two different locations');
  if(qty>onHand(code,from)) return toast('Not enough stock at source');
  const tid=nextId('TRF-00','movements','transferId');
  addMovement({code,qty,from,to:'TRANSIT',type:'TRANSFER',ref:tid+' → '+locName(to),person:val('tr-person')||'Warehouse',date:val('tr-date'),transferTo:to,transferId:tid,fromLoc:from,received:false});
  save(); closeModal(); renderView(); toast('Dispatched '+num(qty)+' '+item(code).unit+' — in transit to '+locName(to));
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
function rsAvail(){ const c=val('rs-code'),l=val('rs-loc'); const e=document.getElementById('rs-av'); if(e&&c&&l) e.textContent=num(available(c,l))+' '+item(c).unit; }
function submitReserve(){
  const code=val('rs-code'), qty=numVal('rs-qty'), l=val('rs-loc');
  if(!code||qty<=0) return toast('Enter a valid quantity');
  if(qty>available(code,l)) return toast('Only '+num(available(code,l))+' available to reserve');
  state.reservations.push({id:nextId('RSV-00','reservations'),date:val('rs-date'),code,qty,location:l,project:val('rs-proj'),person:val('rs-person')||COMPANY.user,status:'active',note:val('rs-note')});
  save(); closeModal(); renderView(); toast('Reserved '+num(qty)+' '+item(code).unit+' for '+locName(val('rs-proj')));
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
function csAvail(){ const c=val('cs-code'),l=val('cs-loc'); const e=document.getElementById('cs-oh'); if(e&&c&&l) e.textContent=num(onHand(c,l))+' '+item(c).unit; }
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
  save(); closeModal(); renderView(); toast('Consumed '+num(qty)+' '+item(code).unit+' of '+item(code).name+(costCode?' · posted to Job Cost '+costCode:''));
}

/* ---------- Add / Edit item ---------- */
function openAddItem(){ itemForm(null); }
function openEditItem(code){ itemForm(item(code)); }
function itemForm(it){
  const types=[['material','Material'],['container','Container'],['equipment','Equipment']];
  openModal(`<div class="modal">${mh('',IC.inventory,it?'Edit Item':'Add Item',it?'Update the item master record':'Create a new item master record')}
    <div class="m-body"><div class="grid2">
      <div class="fld"><label>Item code <span class="req">*</span></label><input class="f" id="it-code" value="${it?it.code:''}" ${it?'readonly':''} placeholder="e.g. CEM-003"></div>
      <div class="fld"><label>Type</label><select class="f" id="it-type">${types.map(t=>`<option value="${t[0]}" ${it&&it.type===t[0]?'selected':''}>${t[1]}</option>`).join('')}</select></div>
      <div class="fld col2"><label>Name <span class="req">*</span></label><input class="f" id="it-name" value="${it?esc(it.name):''}" placeholder="Material / equipment name"></div>
      <div class="fld"><label>Category</label><select class="f" id="it-cat">${CATEGORIES.map(c=>`<option ${it&&it.category===c?'selected':''}>${c}</option>`).join('')}</select></div>
      <div class="fld"><label>Unit</label><input class="f" id="it-unit" value="${it?it.unit:''}" placeholder="bag, kg, nos…"></div>
      <div class="fld"><label>Rate (₹)</label><input class="f" id="it-rate" type="number" min="0" value="${it?it.rate:''}"></div>
      <div class="fld"><label>Reorder level</label><input class="f" id="it-reorder" type="number" min="0" value="${it?it.reorder:''}"></div>
      ${it?'':`<div class="fld"><label>Opening qty</label><input class="f" id="it-open" type="number" min="0" placeholder="0"></div>
      <div class="fld"><label>At location</label><select class="f" id="it-oploc">${locOptions(curLoc)}</select></div>`}
    </div></div>
    <div class="m-foot"><button class="btn ghost" onclick="closeModal()">Cancel</button><button class="btn" onclick="submitItem(${it?`'${it.code}'`:'null'})">${it?'Save changes':'Add item'}</button></div></div>`);
}
function submitItem(editing){
  const code=val('it-code'), name=val('it-name'); if(!code||!name) return toast('Code and name are required');
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
  openModal(`<div class="modal wide">${mh('',IC.history,'Movement History',(code?item(code).name+' — ':'')+'complete audit trail of every stock change')}
    <div class="m-body" style="padding-top:10px">
      <div class="f-search" style="margin-bottom:12px">${svg(IC.search)}<input class="f" id="hist-q" placeholder="Search item, reference, location, type…" oninput="document.getElementById('hist-body').innerHTML=window._histRender(this.value)" style="padding-left:36px"></div>
      <div style="max-height:52vh;overflow:auto"><table class="mv-table"><thead><tr><th>When</th><th>Code</th><th>Material</th><th class="r">Qty</th><th>Movement</th><th>Type</th><th>Reference</th><th>By</th></tr></thead><tbody id="hist-body">${render('')}</tbody></table></div>
    </div></div>`);
  window._histRender=render;
}

/* ---------- Reports / Vendors / placeholder ---------- */
function reportsHTML(){
  const totVal=state.items.reduce((s,it)=>s+state.locations.reduce((a,l)=>a+Math.max(0,onHand(it.code,l.id))*it.rate,0),0);
  const low=state.items.filter(it=>it.type!=='equipment'&&onHand(it.code,'WH-MAIN')>0&&onHand(it.code,'WH-MAIN')<=it.reorder).length;
  const resv=state.reservations.filter(r=>r.status==='active').length;
  const transit=state.movements.filter(m=>m.type==='TRANSFER'&&m.to==='TRANSIT'&&!m.received).length;
  const byLoc=state.locations.map(l=>({name:l.name,v:state.items.reduce((s,it)=>s+Math.max(0,onHand(it.code,l.id))*it.rate,0)}));
  const max=Math.max(1,...byLoc.map(x=>x.v));
  const kpi=(v,l)=>`<div class="loc-card" style="cursor:default"><div class="lc-qty">${v}</div><div class="lc-sub" style="margin-top:8px">${l}</div></div>`;
  return `<div class="page-hero"><div class="ph-img"></div><div class="ph-grad"></div><div class="ph-body"><div class="ph-eyebrow">Reports</div><h1>Inventory Reports</h1><p>Stock value and movement analytics across all locations.</p></div></div>
    <div class="loc-row" style="grid-template-columns:repeat(4,1fr)">${kpi(money(totVal),'Total stock value')}${kpi(low,'Low-stock materials')}${kpi(resv,'Active reservations')}${kpi(transit,'In-transit transfers')}</div>
    <div class="panel"><div class="inv-head"><h2>Stock value by location</h2></div><div style="padding:18px 22px">
      ${byLoc.map(x=>`<div style="display:flex;align-items:center;gap:14px;margin-bottom:14px"><div style="width:160px;font-weight:600;color:var(--muted);font-size:13px">${esc(x.name)}</div><div style="flex:1;height:12px;background:var(--bg);border-radius:6px;overflow:hidden"><div style="height:100%;width:${x.v/max*100}%;background:var(--blue);border-radius:6px"></div></div><div style="width:120px;text-align:right;font-weight:800">${money(x.v)}</div></div>`).join('')}
    </div></div>`;
}
function vendorsHTML(){
  return `<div class="page-hero"><div class="ph-img"></div><div class="ph-grad"></div><div class="ph-body"><div class="ph-eyebrow">Vendors</div><h1>Vendors</h1><p>Suppliers used for purchase orders.</p></div></div>
    <div class="panel"><table><thead><tr><th>Vendor</th><th>GSTIN</th><th>Phone</th><th class="r">Open POs</th></tr></thead>
    <tbody>${state.vendors.map(v=>{const open=state.purchaseOrders.filter(p=>p.vendorId===v.id&&p.status!=='Received').length;return `<tr><td class="mat"><b>${esc(v.name)}</b></td><td class="code">${v.gstin}</td><td>${v.phone}</td><td class="num">${open}</td></tr>`;}).join('')}</tbody></table></div>`;
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
  const tabs=[['summary','Project Summary'],['jcl','Job Cost Ledger (JCL)'],['jcr','Job Cost Report (JCR)'],['materials','Materials'],['labour','Labour'],['consumables','Consumables'],['overheads','Overheads']];
  let body='';
  if(jcTab==='summary') body=jcSummary();
  else if(jcTab==='jcl') body=jcLedger();
  else if(jcTab==='jcr') body=jcReport();
  else if(jcTab==='materials') body=jcCostLedger('Materials');
  else if(jcTab==='labour') body=jcCostLedger('Labour');
  else if(jcTab==='consumables') body=jcConsumables();
  else if(jcTab==='overheads') body=jcOverheads();
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
    ${jcTab!=='summary'?`<div class="jc-toolbar">${jcActBtns()}</div>`:''}
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
    return `<tr class="drill" onclick="jcDrill('${c.code}')"><td class="c">${esc(c.code)}</td><td>${esc(c.desc)}</td>${cells.map(v=>`<td class="r">${v?jcNum(v):'—'}</td>`).join('')}<td class="r b">${jcNum(tot)}</td><td class="r" style="width:24px;color:var(--dim)">${svg(IC.drill)}</td></tr>`;
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
    <button title="Edit" onclick="openCostEntry(null,'${e.id}')">${svg(IC.edit)}</button>
    <button title="Reverse" onclick="reverseEntry('${e.id}')">${svg(IC.xfer)}</button>
    <button title="Archive" class="del" onclick="archiveEntry('${e.id}')">${svg(IC.trash)}</button></div>`;
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
  const rows=oh.map(o=>`<tr><td class="c">${esc(o.code)}</td><td class="mat">${esc(o.desc)}</td><td class="r">${jcMoney(o.uptoLast)}</td><td class="r">${jcMoney(o.thisMonth)}</td><td class="r">${jcMoney((Number(o.uptoLast)||0)+(Number(o.thisMonth)||0))}</td><td class="r">${jcMoney(o.etc)}</td><td class="r">${jcMoney(o.revised)}</td><td><div class="jc-row-acts"><button title="Edit" onclick="openOverhead('${o.code}')">${svg(IC.edit)}</button></div></td></tr>`).join('');
  return `<div class="jc-sub">Overheads (OH Abstract) — Site Overhead heads</div>
    <div class="tbl-scroll"><table class="jc-tbl"><thead><tr><th>Cost</th><th>Description of Item</th><th class="r">Upto Last Month</th><th class="r">This Month</th><th class="r">JSD (to date)</th><th class="r">Estimate to Complete</th><th class="r">Revised Estimate</th><th></th></tr></thead>
    <tbody>${rows}<tr class="tot"><td></td><td>Total</td><td class="r">${jcMoney(t.l)}</td><td class="r">${jcMoney(t.m)}</td><td class="r">${jcMoney(t.l+t.m)}</td><td class="r">${jcMoney(t.e)}</td><td class="r">${jcMoney(t.r)}</td><td></td></tr></tbody></table></div>`;
}

/* ---- Job Cost Report (JCR) — BOQ-level, actuals from the ledger ---- */
function jcReport(){
  const boq=projBOQ();
  let tBoq=0,tAct=0,anyBoq=false;
  const rows=boq.map(b=>{
    const boqAmt=(b.boqQty!=null&&b.boqRate!=null)?b.boqQty*b.boqRate:null;
    const act=codeTotal(b.code,'this'); const varc=boqAmt!=null?boqAmt-act:null;
    if(boqAmt!=null){ tBoq+=boqAmt; anyBoq=true; } tAct+=act;
    return `<tr><td class="c">${esc(b.boqNo)}</td><td class="c">${esc(b.code)}</td><td class="mat"><b>${esc(b.desc)}</b></td><td>${esc(b.unit||'')}</td><td class="r">${b.boqQty!=null?jcNum(b.boqQty):'—'}</td><td class="r">${b.boqRate!=null?jcMoney(b.boqRate):'—'}</td><td class="r">${boqAmt!=null?jcMoney(boqAmt):'—'}</td><td class="r b">${jcMoney(act)}</td><td class="r" style="color:${varc!=null?(varc>=0?'var(--green)':'var(--red)'):'var(--dim)'}">${varc!=null?jcMoney(varc):'—'}</td><td><div class="jc-row-acts"><button title="Edit BOQ" onclick="openBoq('${b.id}')">${svg(IC.edit)}</button><button class="del" title="Archive" onclick="archiveBoq('${b.id}')">${svg(IC.trash)}</button></div></td></tr>`;
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
function submitBoq(editId){ const no=val('bq-no'), desc=val('bq-desc'); if(!no||!desc) return toast('BOQ No and description required'); const rec={boqNo:no,code:val('bq-code'),desc,unit:val('bq-unit'),boqQty:parseFloat(val('bq-qty'))||null,boqRate:parseFloat(val('bq-rate'))||null,revQty:parseFloat(val('bq-rqty'))||null}; if(editId){ Object.assign(jcr.boq.find(x=>x.id===editId),rec); jcAudit('edit','BOQ '+editId); toast('BOQ updated'); } else { const id=jcNextId('BQ-',jcr.boq); jcr.boq.push(Object.assign({id,projectId:jcr.currentProjectId,archived:false},rec)); jcAudit('add','BOQ '+id); toast('BOQ item added'); } jcSave(); closeModal(); renderView(); }
function archiveBoq(id){ const b=jcr.boq.find(x=>x.id===id); if(!b) return; b.archived=!b.archived; jcAudit(b.archived?'archive':'restore','BOQ '+id); jcSave(); renderView(); }

/* ---- Cost code ---- */
function openCostCode(editCode){
  const c=editCode?jcr.costCodes.find(x=>x.code===editCode):null;
  openModal(`<div class="modal">${mh('',IC.jobcost,c?'Edit Cost Code':'Add Cost Code','Cost codes drive the JCL rows & cost entries')}
    <div class="m-body"><div class="grid2">
      <div class="fld"><label>Code <span class="req">*</span></label><input class="f" id="cc-code" value="${c?esc(c.code):''}" ${c?'readonly':''} placeholder="e.g. 8000"></div>
      <div class="fld col2"><label>Description <span class="req">*</span></label><input class="f" id="cc-desc" value="${c?esc(c.desc):''}"></div>
    </div></div>
    <div class="m-foot"><button class="btn ghost" onclick="closeModal()">Cancel</button><button class="btn" onclick="submitCostCode(${c?`'${c.code}'`:'null'})">${c?'Save':'Add cost code'}</button></div></div>`);
}
function submitCostCode(editCode){ const code=val('cc-code'), desc=val('cc-desc'); if(!code||!desc) return toast('Code and description required'); if(!editCode && jcr.costCodes.some(x=>x.code===code)) return toast('That code already exists'); if(editCode){ jcr.costCodes.find(x=>x.code===editCode).desc=desc; jcAudit('edit','Cost code '+editCode); } else { jcr.costCodes.push({code,desc}); jcAudit('add','Cost code '+code); } jcSave(); closeModal(); renderView(); toast('Cost code saved'); }

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
    <div class="m-foot"><button class="btn ghost" onclick="closeModal()">Cancel</button><button class="btn" onclick="submitOverhead(${o?`'${o.code}'`:'null'})">${o?'Save':'Add overhead'}</button></div></div>`);
}
function submitOverhead(editCode){ const code=val('oh-code'), desc=val('oh-desc'); if(!code||!desc) return toast('Code and description required'); const rec={desc,uptoLast:parseFloat(val('oh-last'))||0,thisMonth:parseFloat(val('oh-month'))||0,etc:parseFloat(val('oh-etc'))||0,revised:parseFloat(val('oh-rev'))||0}; const pid=jcr.currentProjectId; if(editCode){ Object.assign(jcr.overheads.find(x=>x.code===editCode&&x.projectId===pid),rec); jcAudit('edit','Overhead '+editCode); } else { if(jcr.overheads.some(x=>x.code===code&&x.projectId===pid)) return toast('Code exists'); jcr.overheads.push(Object.assign({code,projectId:pid},rec)); jcAudit('add','Overhead '+code); } jcSave(); closeModal(); renderView(); toast('Overhead saved'); }

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
function boot(){ initTheme(); renderSidebar(); renderTopbar(); renderView(); }
// when sync.ts is in charge it calls boot() after every script has loaded
if(!window.qtDeferBoot){ if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot(); }
