/* ============================================================
   Qualtech Engineers — Procurement / Material Requests
   Replaces WhatsApp requests with a centralized queue:
   Site engineer raises a request → Purchase manager reviews →
   compare vendor quotes → approve → raise PO → track delivery →
   goods receipt updates stock. Partial deliveries, cancellations
   and overdue tracking included. Reuses items, vendors, locations,
   the stock ledger (addMovement) and projects (jcr.projects).
   ============================================================ */
'use strict';

const MR_LS='qualtech-mr-v1';
const MR_STATUSES=['Submitted','Under Review','Approved','Rejected','PO Raised','Partially Delivered','Delivered','Closed','Cancelled'];
const MR_COLORS={
  'Submitted':['#2563eb','#e0ecff'], 'Under Review':['#7c3aed','#f3e8ff'], 'Approved':['#0369a1','#e0f2fe'],
  'Rejected':['#b91c1c','#fee2e2'], 'PO Raised':['#b45309','#fef3c7'], 'Partially Delivered':['#c2410c','#ffedd5'],
  'Delivered':['#15803d','#dcfce7'], 'Closed':['#475569','#e2e8f0'], 'Cancelled':['#64748b','#f1f5f9']
};
const PRIORITIES=['Normal','Urgent','Critical'];

function mrLoad(){
  try{ const r=localStorage.getItem(MR_LS); if(r){ const d=JSON.parse(r); d.requests=d.requests||[]; d.pos=d.pos||[]; d.audit=d.audit||[]; return d; } }catch{}
  return mrSeed();
}
function mrSave(){ try{ localStorage.setItem(MR_LS, JSON.stringify(MR)); }catch{} }
let MR=mrLoad();
function mrAudit(id,action,detail){ MR.audit.unshift({at:new Date().toISOString(),by:COMPANY.user,id,action,detail}); MR.audit=MR.audit.slice(0,500); }
function mrNextId(){ let m=0; MR.requests.forEach(r=>{ const g=((r.id||'').match(/(\d+)$/)||[])[1]; if(g&&+g>m)m=+g; }); return 'MR-'+String(m+1).padStart(3,'0'); }
function poNextId(){ let m=0; MR.pos.forEach(p=>{ const g=((p.id||'').match(/(\d+)$/)||[])[1]; if(g&&+g>m)m=+g; }); return 'PO-'+String(m+1).padStart(3,'0'); }
function mrLineId(r){ let m=0; (r.lines||[]).forEach(l=>{ const g=((l.id||'').match(/(\d+)$/)||[])[1]; if(g&&+g>m)m=+g; }); return 'L-'+(m+1); }

/* ---------- helpers ---------- */
const projName=id=>{ const p=(typeof jcr!=='undefined'?jcr.projects:[]).find(x=>x.id===id); return p?p.name+' ('+p.jobCode+')':(id||'—'); };
const projOpts=sel=>(typeof jcr!=='undefined'?jcr.projects:[]).filter(p=>!p.archived).map(p=>`<option value="${p.id}" ${p.id===sel?'selected':''}>${esc(p.name)} (${esc(p.jobCode)})</option>`).join('');
function mrBadge(s){ const c=MR_COLORS[s]||['#475569','#e2e8f0']; return `<span class="t-badge" style="color:${c[0]};background:${c[1]}">${esc(s)}</span>`; }
function priTag(p){ const c=p==='Critical'?['#b91c1c','#fee2e2']:p==='Urgent'?['#b45309','#fef3c7']:['#475569','#eef2f7']; return `<span class="t-badge" style="color:${c[0]};background:${c[1]}">${esc(p||'Normal')}</span>`; }
const overdue=d=>d && d < nowDate();
function mrOverdue(r){ return overdue(r.neededBy) && !['Delivered','Closed','Cancelled','Rejected'].includes(r.status); }
// line roll-ups
const reqTot=r=>(r.lines||[]).reduce((s,l)=>s+(+l.qty||0),0);
const apprTot=r=>(r.lines||[]).reduce((s,l)=>s+(l.approvedQty!=null?+l.approvedQty:0),0);
const recdTot=r=>(r.lines||[]).reduce((s,l)=>s+(+l.recdQty||0),0);
const orderedTot=r=>(r.lines||[]).reduce((s,l)=>s+(+l.poQty||0),0);

/* ============================================================ router ============================================================ */
let mrView='queue', curMrId=null, curPoId=null;
const curMR=()=>MR.requests.find(r=>r.id===curMrId);
function goMr(v){ mrView=v; renderView(); window.scrollTo(0,0); }
function openMr(id){ curMrId=id; mrView='request'; renderView(); window.scrollTo(0,0); }
function procureHTML(){
  if(mrView==='request' && curMR()) return mrWorkspace();
  const tab=(v,l)=>`<button class="seg-btn ${mrView===v?'on':''}" onclick="goMr('${v}')">${l}</button>`;
  const head=`<div class="page-top" style="display:flex;align-items:flex-end;justify-content:space-between;flex-wrap:wrap;gap:12px">
      <div><h1>Procurement</h1><p>Material requests, approvals, purchase orders &amp; goods receipt — one centralized queue.</p></div>
      <div style="display:flex;gap:8px;align-items:center"><div class="seg">${tab('queue','Queue')}${tab('requests','All Requests')}${tab('pos','Purchase Orders')}</div>
      <button class="btn" onclick="openNewRequest()">${svg(IC.plus)} New Material Request</button></div></div>`;
  let body;
  if(mrView==='requests') body=mrRequestList();
  else if(mrView==='pos') body=mrPOList();
  else body=mrQueue();
  return head+body;
}

/* ============================================================ queue / dashboard ============================================================ */
function mrQueue(){
  const rs=MR.requests.filter(r=>r.status!=='Cancelled');
  const by=s=>rs.filter(r=>r.status===s).length;
  const pendingApproval=rs.filter(r=>['Submitted','Under Review'].includes(r.status));
  const awaitingPO=rs.filter(r=>r.status==='Approved');
  const inDelivery=rs.filter(r=>['PO Raised','Partially Delivered'].includes(r.status));
  const overdueReqs=rs.filter(mrOverdue);
  const kpi=(v,l,cls)=>`<div class="kpi"><div class="kmid"><div class="kv" ${cls?`style="color:${cls}"`:''}>${v}</div><div class="kl">${l}</div></div></div>`;
  const queueRow=r=>`<tr class="drill ${mrOverdue(r)?'t-cmp':''}" onclick="openMr('${r.id}')">
    <td class="c">${esc(r.id)}</td><td><b>${esc(projName(r.projectId))}</b><div class="t-cmp-src">${esc(locName(r.site)||'')} · ${esc(r.requestedBy||'')}</div></td>
    <td class="r">${(r.lines||[]).length} item(s)</td><td>${priTag(r.priority)}</td>
    <td class="${mrOverdue(r)?'t-over':''}">${esc(r.neededBy||'—')}${mrOverdue(r)?' ⚠':''}</td><td>${mrBadge(r.status)}</td></tr>`;
  const section=(title,list)=>`<div class="panel" style="margin-top:16px"><div class="inv-head"><h2>${title}</h2><span class="tag" style="margin-left:auto">${list.length}</span></div>
    <div class="tbl-scroll"><table class="jc-tbl"><thead><tr><th>Req ID</th><th>Project / site</th><th class="r">Lines</th><th>Priority</th><th>Needed by</th><th>Status</th></tr></thead>
    <tbody>${list.map(queueRow).join('')||`<tr class="empty-row"><td colspan="6">Nothing here.</td></tr>`}</tbody></table></div></div>`;
  return `
    <div class="page-kpis">
      ${kpi(pendingApproval.length,'Pending approval', pendingApproval.length?'var(--blue)':'')}
      ${kpi(awaitingPO.length,'Approved — awaiting PO')}
      ${kpi(inDelivery.length,'In delivery')}
      ${kpi(overdueReqs.length,'Overdue', overdueReqs.length?'var(--red)':'')}
    </div>
    ${section('Pending approval — action needed', pendingApproval)}
    ${awaitingPO.length?section('Approved — ready to raise PO', awaitingPO):''}
    ${inDelivery.length?section('In delivery', inDelivery):''}`;
}

/* ============================================================ all requests ============================================================ */
let mrQ='', mrStatusF='all';
function mrRequestList(){
  let rs=MR.requests.slice();
  if(mrStatusF!=='all') rs=rs.filter(r=>r.status===mrStatusF);
  const q=mrQ.trim().toLowerCase();
  if(q) rs=rs.filter(r=>[r.id,projName(r.projectId),r.requestedBy].some(x=>String(x||'').toLowerCase().includes(q)));
  rs.sort((a,b)=>(b.date||'').localeCompare(a.date||''));
  const opts=['all',...MR_STATUSES].map(s=>`<option value="${s}" ${mrStatusF===s?'selected':''}>${s==='all'?'All statuses':s}</option>`).join('');
  const rows=rs.map(r=>`<tr class="drill" onclick="openMr('${r.id}')">
    <td class="c">${esc(r.id)}</td><td><b>${esc(projName(r.projectId))}</b></td><td>${esc(locName(r.site)||'—')}</td><td>${esc(r.requestedBy||'—')}</td>
    <td>${esc(r.date||'')}</td><td class="${mrOverdue(r)?'t-over':''}">${esc(r.neededBy||'—')}${mrOverdue(r)?' ⚠':''}</td><td>${priTag(r.priority)}</td>
    <td class="r">${(r.lines||[]).length}</td><td>${mrBadge(r.status)}</td></tr>`).join('')
    ||`<tr class="empty-row"><td colspan="9">No requests. Click “New Material Request”.</td></tr>`;
  return `<div class="panel" style="margin-top:4px"><div class="inv-head"><h2>All Material Requests</h2>
    <div style="margin-left:auto;display:flex;gap:8px;align-items:center">
      <select class="f" style="width:auto;padding:7px 10px" onchange="mrStatusF=this.value;renderView()">${opts}</select>
      <div class="f-search" style="margin:0"><span>${svg(IC.search)}</span><input class="f" id="mr-search" placeholder="Search id, project, requester…" value="${esc(mrQ)}" style="padding-left:34px"></div></div></div>
    <div class="tbl-scroll"><table class="jc-tbl"><thead><tr><th>ID</th><th>Project</th><th>Site</th><th>Requested by</th><th>Date</th><th>Needed by</th><th>Priority</th><th class="r">Lines</th><th>Status</th></tr></thead>
    <tbody>${rows}</tbody></table></div></div>`;
}
function bindProcure(){ const s=document.getElementById('mr-search'); if(s) s.oninput=()=>{ mrQ=s.value; const el=document.getElementById('app'); el.innerHTML=procureHTML(); const n=document.getElementById('mr-search'); if(n){ n.focus(); n.setSelectionRange(n.value.length,n.value.length); bindProcure(); } }; }

/* ============================================================ purchase orders ============================================================ */
function poOverdue(po){ return overdue(po.expectedDate) && !['Received','Cancelled'].includes(po.status); }
function poRecd(po){ return (po.lines||[]).reduce((s,l)=>s+(+l.recdQty||0),0); }
function poOrdered(po){ return (po.lines||[]).reduce((s,l)=>s+(+l.qty||0),0); }
function mrPOList(){
  const pos=MR.pos.slice().sort((a,b)=>(b.date||'').localeCompare(a.date||''));
  const rows=pos.map(po=>{ const pct=poOrdered(po)?Math.round(poRecd(po)/poOrdered(po)*100):0; const v=vendor(po.vendorId);
    return `<tr class="drill" onclick="openMr('${po.mrId}')">
      <td class="c">${esc(po.id)}</td><td><b>${esc(v?v.name:po.vendorId)}</b></td><td>${esc(po.mrId||'—')}</td>
      <td class="r">${jcMoney((po.lines||[]).reduce((s,l)=>s+(+l.qty||0)*(+l.rate||0),0))}</td>
      <td class="${poOverdue(po)?'t-over':''}">${esc(po.expectedDate||'—')}${poOverdue(po)?' ⚠':''}</td>
      <td><div class="mr-bar"><span style="width:${pct}%"></span></div><div class="t-cmp-src">${pct}% received</div></td>
      <td>${mrBadge(po.status==='Open'?'PO Raised':po.status==='Partially Received'?'Partially Delivered':po.status==='Received'?'Delivered':po.status)}</td>
      <td><div class="jc-row-acts">${['Received','Cancelled'].includes(po.status)?'':`<button title="Receive goods" onclick="event.stopPropagation();openReceive('${po.id}')">${svg(IC.in)}</button>`}</div></td></tr>`; }).join('')
    ||`<tr class="empty-row"><td colspan="8">No purchase orders yet.</td></tr>`;
  return `<div class="panel" style="margin-top:4px"><div class="inv-head"><h2>Purchase Orders</h2><span class="tag" style="margin-left:auto">${pos.length}</span></div>
    <div class="tbl-scroll"><table class="jc-tbl"><thead><tr><th>PO</th><th>Vendor</th><th>Against</th><th class="r">Value</th><th>Expected</th><th>Delivery</th><th>Status</th><th></th></tr></thead>
    <tbody>${rows}</tbody></table></div>
    <div class="jc-hint" style="padding:12px 20px">${svg(IC.po)} Receiving goods (full or partial) posts a Stock-In movement to the delivery location, so inventory updates automatically.</div></div>`;
}

/* ============================================================ new request (site engineer) ============================================================ */
let mrNewLines=[];
function openNewRequest(){
  mrNewLines=[{code:'',qty:'',note:''}];
  openModal(`<div class="modal wide">${mh('',IC.consume,'New Material Request','Raise a request against a project — goes to the purchase queue')}
    <div class="m-body"><div class="grid2">
      <div class="fld"><label>Project <span class="req">*</span></label><select class="f" id="nr-proj">${projOpts(typeof jcr!=='undefined'?jcr.currentProjectId:'')}</select></div>
      <div class="fld"><label>Deliver to site <span class="req">*</span></label><select class="f" id="nr-site">${siteOptions('')}</select></div>
      <div class="fld"><label>Requested by</label><input class="f" id="nr-by" value="Site Engineer"></div>
      <div class="fld"><label>Needed by <span class="req">*</span></label><input class="f" id="nr-needed" type="date"></div>
      <div class="fld"><label>Priority</label><select class="f" id="nr-pri">${PRIORITIES.map(p=>`<option>${p}</option>`).join('')}</select></div>
      <div class="fld"><label>Date</label><input class="f" id="nr-date" type="date" value="${nowDate()}"></div>
      <div class="fld col2"><label>Notes</label><input class="f" id="nr-notes" placeholder="Work activity / justification"></div>
    </div>
    <label style="margin-top:4px;display:block;font-size:12px;font-weight:600;color:var(--muted)">Items requested</label>
    <div id="nr-lines"></div>
    <button class="btn ghost sm" style="margin-top:6px" onclick="addNrLine()">${svg(IC.plus)} Add item</button>
    </div>
    <div class="m-foot"><button class="btn ghost" onclick="closeModal()">Cancel</button><button class="btn" onclick="submitNewRequest()">Submit request</button></div></div>`);
  renderNrLines();
}
function renderNrLines(){ const w=document.getElementById('nr-lines'); if(!w) return;
  w.innerHTML=mrNewLines.map((l,i)=>`<div class="mr-line">
    <select class="f" onchange="mrNewLines[${i}].code=this.value"><option value="">— select item —</option>${itemOptions(l.code,null)}</select>
    <input class="f" type="number" min="0" placeholder="Qty" value="${l.qty}" oninput="mrNewLines[${i}].qty=this.value">
    <input class="f" placeholder="Note (optional)" value="${esc(l.note||'')}" oninput="mrNewLines[${i}].note=this.value">
    <button class="xrow" onclick="mrNewLines.splice(${i},1);renderNrLines()">×</button></div>`).join('');
}
function addNrLine(){ mrNewLines.push({code:'',qty:'',note:''}); renderNrLines(); }
function submitNewRequest(){
  const proj=val('nr-proj'), site=val('nr-site'), needed=val('nr-needed');
  const lines=mrNewLines.filter(l=>l.code&&(+l.qty)>0).map(l=>{ const it=item(l.code); return { id:'', code:l.code, desc:it?it.name:l.code, unit:it?it.unit:'', qty:+l.qty, approvedQty:null, poQty:0, recdQty:0, note:l.note||'' }; });
  if(!proj||!site||!needed) return toast('Project, site and needed-by date are required');
  if(!lines.length) return toast('Add at least one item with a quantity');
  const id=mrNextId();
  lines.forEach((l,i)=>l.id='L-'+(i+1));
  MR.requests.push({ id, projectId:proj, site, requestedBy:val('nr-by')||'Site Engineer', date:val('nr-date')||nowDate(), neededBy:needed,
    priority:val('nr-pri')||'Normal', status:'Submitted', lines, quotes:[], notes:val('nr-notes'),
    history:[{at:new Date().toISOString(), by:val('nr-by')||'Site Engineer', from:'', to:'Submitted', note:'Request raised'}], poIds:[] });
  mrAudit(id,'create',projName(proj)); mrSave(); closeModal(); toast('Request '+id+' submitted to the queue'); openMr(id);
}

/* ============================================================ request workspace ============================================================ */
function mrWorkspace(){
  const r=curMR(); if(!r) return mrRequestList();
  const canReview=r.status==='Submitted';
  const canApprove=['Submitted','Under Review'].includes(r.status);
  const canPO=['Approved','PO Raised','Partially Delivered'].includes(r.status) && (r.lines||[]).some(l=>(l.approvedQty||0)>(l.poQty||0));
  const canCancel=!['Delivered','Closed','Cancelled','Rejected'].includes(r.status);
  const lineRows=(r.lines||[]).map(l=>`<tr>
    <td><b>${esc(l.desc)}</b><div class="t-cmp-src">${esc(l.code)}${l.note?' · '+esc(l.note):''}</div></td><td>${esc(l.unit||'')}</td>
    <td class="r">${jcNum(l.qty)}</td><td class="r">${l.approvedQty!=null?jcNum(l.approvedQty):'—'}</td>
    <td class="r">${l.poQty?jcNum(l.poQty):'—'}</td><td class="r b">${l.recdQty?jcNum(l.recdQty):'—'}</td>
    <td>${lineState(l)}</td></tr>`).join('');
  const pos=MR.pos.filter(p=>p.mrId===r.id);
  const poRows=pos.map(po=>{ const v=vendor(po.vendorId); const pct=poOrdered(po)?Math.round(poRecd(po)/poOrdered(po)*100):0;
    return `<tr><td class="c">${esc(po.id)}</td><td>${esc(v?v.name:po.vendorId)}</td><td class="r">${jcMoney((po.lines||[]).reduce((s,l)=>s+(+l.qty||0)*(+l.rate||0),0))}</td>
      <td class="${poOverdue(po)?'t-over':''}">${esc(po.expectedDate||'—')}</td><td><div class="mr-bar"><span style="width:${pct}%"></span></div></td><td>${mrBadge(po.status==='Open'?'PO Raised':po.status==='Partially Received'?'Partially Delivered':po.status==='Received'?'Delivered':po.status)}</td>
      <td><div class="jc-row-acts">${['Received','Cancelled'].includes(po.status)?'':`<button title="Receive goods" onclick="openReceive('${po.id}')">${svg(IC.in)}</button><button title="Cancel PO" onclick="cancelPO('${po.id}')">${svg(IC.x)}</button>`}</div></td></tr>`; }).join('')
    ||`<tr class="empty-row"><td colspan="7">No purchase orders raised yet.</td></tr>`;
  const quoteRows=(r.quotes||[]).map(q=>`<tr class="${q.selected?'t-sel':''}"><td>${esc(itemName(q.code))}</td><td><b>${esc(vendor(q.vendorId)?vendor(q.vendorId).name:q.vendorId)}</b></td><td class="r b">${jcMoney(q.rate)}</td><td>${esc(q.validity||'—')}</td>
    <td><div class="jc-row-acts">${q.selected?'<span class="t-pick">Selected</span>':`<button title="Select" onclick="selectMrQuote('${r.id}','${q.id}')">${svg(IC.check)}</button>`}<button title="Remove" onclick="delMrQuote('${r.id}','${q.id}')">${svg(IC.trash)}</button></div></td></tr>`).join('')
    ||`<tr class="empty-row"><td colspan="5">No quotes recorded. Add vendor quotes to compare before approving.</td></tr>`;
  const actions=`<div style="display:flex;gap:8px;flex-wrap:wrap">
    ${canReview?`<button class="btn ghost" onclick="setMrStatus('${r.id}','Under Review','Picked up for review')">${svg(IC.flag)} Start review</button>`:''}
    ${canApprove?`<button class="btn" onclick="openApprove('${r.id}')">${svg(IC.check)} Approve</button><button class="btn danger" onclick="rejectMr('${r.id}')">${svg(IC.x)} Reject</button>`:''}
    ${canPO?`<button class="btn" style="background:var(--green)" onclick="openRaisePO('${r.id}')">${svg(IC.po)} Raise PO</button>`:''}
    ${canCancel?`<button class="btn ghost" onclick="cancelMr('${r.id}')">Cancel request</button>`:''}</div>`;
  return `
  <div class="t-ws-top">
    <button class="t-back" onclick="goMr('queue')">${svg(IC.drill)} Queue</button>
    <div class="t-ws-head">
      <div><div class="t-ws-name">${esc(projName(r.projectId))} ${mrBadge(r.status)} ${mrOverdue(r)?'<span class="t-badge" style="color:var(--red);background:var(--red-bg)">Overdue</span>':''}</div>
        <div class="t-ws-sub"><span class="tag">${esc(r.id)}</span> ${esc(locName(r.site)||'')} · ${esc(r.requestedBy||'')} ${priTag(r.priority)}</div></div>
      ${actions}
    </div>
    <div class="t-ws-meta"><span><b>Raised</b> ${esc(r.date||'—')}</span><span><b>Needed by</b> ${esc(r.neededBy||'—')}</span><span><b>Items</b> ${(r.lines||[]).length}</span><span><b>Qty req</b> ${jcNum(reqTot(r))}</span><span><b>Received</b> ${jcNum(recdTot(r))}/${jcNum(apprTot(r)||reqTot(r))}</span>${r.notes?`<span><b>Note</b> ${esc(r.notes)}</span>`:''}</div>
  </div>
  <div class="t-ov-grid" style="margin-top:16px">
    <div class="panel"><div class="inv-head"><h2>Requested items</h2></div>
      <div class="tbl-scroll"><table class="jc-tbl"><thead><tr><th>Item</th><th>Unit</th><th class="r">Req</th><th class="r">Appr</th><th class="r">Ordered</th><th class="r">Recd</th><th>Line</th></tr></thead><tbody>${lineRows}</tbody></table></div></div>
    <div class="panel"><div class="inv-head"><h2>Vendor quotation comparison</h2>${['Delivered','Closed','Cancelled','Rejected'].includes(r.status)?'':`<button class="btn sm" style="margin-left:auto" onclick="openMrQuote('${r.id}')">${svg(IC.plus)} Add quote</button>`}</div>
      <div class="tbl-scroll"><table class="jc-tbl"><thead><tr><th>Item</th><th>Vendor</th><th class="r">Rate</th><th>Validity</th><th></th></tr></thead><tbody>${quoteRows}</tbody></table></div>
      <div class="jc-hint" style="padding:12px 20px">${svg(IC.vendors)} Add quotes per item and select the best — the selected rate pre-fills the PO.</div></div>
  </div>
  <div class="panel" style="margin-top:16px"><div class="inv-head"><h2>Purchase orders &amp; delivery</h2></div>
    <div class="tbl-scroll"><table class="jc-tbl"><thead><tr><th>PO</th><th>Vendor</th><th class="r">Value</th><th>Expected</th><th>Received</th><th>Status</th><th></th></tr></thead><tbody>${poRows}</tbody></table></div></div>
  <div class="panel" style="margin-top:16px"><div class="inv-head"><h2>Status history</h2></div>
    <div class="tbl-scroll"><table class="jc-tbl"><thead><tr><th>When</th><th>By</th><th>From</th><th>To</th><th>Note</th></tr></thead>
    <tbody>${(r.history||[]).slice().reverse().map(h=>`<tr><td>${esc((h.at||'').replace('T',' ').slice(0,16))}</td><td>${esc(h.by||'')}</td><td>${h.from?mrBadge(h.from):'—'}</td><td>${mrBadge(h.to)}</td><td>${esc(h.note||'')}</td></tr>`).join('')||`<tr class="empty-row"><td colspan="5">No history.</td></tr>`}</tbody></table></div></div>`;
}
function itemName(code){ const it=item(code); return it?it.name:code; }
function lineState(l){ const req=+l.qty||0, ap=l.approvedQty!=null?+l.approvedQty:null, po=+l.poQty||0, rc=+l.recdQty||0;
  if(ap===0) return mrBadge('Rejected');
  if(rc>=(ap||req) && (ap||req)>0) return mrBadge('Delivered');
  if(rc>0) return mrBadge('Partially Delivered');
  if(po>0) return mrBadge('PO Raised');
  if(ap!=null) return mrBadge('Approved');
  return mrBadge('Submitted'); }

/* ---------- status helpers ---------- */
function setMrStatus(id,to,note){ const r=MR.requests.find(x=>x.id===id); if(!r) return; const from=r.status; r.status=to;
  (r.history=r.history||[]).push({at:new Date().toISOString(),by:COMPANY.user,from,to,note:note||''}); mrAudit(id,'status',from+' → '+to); mrSave(); renderView(); toast('Status: '+to); }
function rejectMr(id){ const note=prompt('Reason for rejection (optional):')||''; const r=MR.requests.find(x=>x.id===id); (r.lines||[]).forEach(l=>l.approvedQty=0); setMrStatus(id,'Rejected','Rejected'+(note?': '+note:'')); }
function cancelMr(id){ if(!confirm('Cancel this material request?')) return; setMrStatus(id,'Cancelled','Cancelled by purchase'); }

/* ---------- approval (adjust approved qty) ---------- */
function openApprove(id){ const r=MR.requests.find(x=>x.id===id);
  openModal(`<div class="modal wide">${mh('',IC.check,'Approve request','Confirm or adjust approved quantities')}
    <div class="m-body"><div class="tbl-scroll"><table class="jc-tbl"><thead><tr><th>Item</th><th>Unit</th><th class="r">Requested</th><th class="r">Approve qty</th></tr></thead>
    <tbody>${(r.lines||[]).map(l=>`<tr><td><b>${esc(l.desc)}</b><div class="t-cmp-src">${esc(l.code)}</div></td><td>${esc(l.unit||'')}</td><td class="r">${jcNum(l.qty)}</td>
      <td class="r"><input class="f" style="width:90px;text-align:right" id="ap-${l.id}" type="number" min="0" value="${l.approvedQty!=null?l.approvedQty:l.qty}"></td></tr>`).join('')}</tbody></table></div>
      <div class="hint">${svg(IC.jobcost)}<div>Set a quantity to 0 to reject that line. Approving moves the request to “Approved”, ready to raise a PO.</div></div></div>
    <div class="m-foot"><button class="btn ghost" onclick="closeModal()">Cancel</button><button class="btn" onclick="submitApprove('${id}')">Approve request</button></div></div>`);
}
function submitApprove(id){ const r=MR.requests.find(x=>x.id===id);
  (r.lines||[]).forEach(l=>{ const v=document.getElementById('ap-'+l.id); l.approvedQty=v?Math.max(0,parseFloat(v.value)||0):(+l.qty||0); });
  const any=(r.lines||[]).some(l=>(l.approvedQty||0)>0);
  mrAudit(id,'approve','approved '+apprTot(r)); closeModal();
  setMrStatus(id, any?'Approved':'Rejected', any?'Approved quantities set':'All lines rejected'); }

/* ---------- vendor quotes ---------- */
function openMrQuote(id){ const r=MR.requests.find(x=>x.id===id);
  const itemOpts=(r.lines||[]).map(l=>`<option value="${l.code}">${esc(l.desc)} (${esc(l.code)})</option>`).join('');
  openModal(`<div class="modal">${mh('',IC.vendors,'Add vendor quote','Record a quoted rate to compare')}
    <div class="m-body"><div class="grid2">
      <div class="fld col2"><label>Item <span class="req">*</span></label><select class="f" id="mq-code">${itemOpts}</select></div>
      <div class="fld col2"><label>Vendor <span class="req">*</span></label><select class="f" id="mq-vendor">${state.vendors.map(v=>`<option value="${v.id}">${esc(v.name)}</option>`).join('')}</select></div>
      <div class="fld"><label>Quoted rate (₹) <span class="req">*</span></label><input class="f" id="mq-rate" type="number" step="any"></div>
      <div class="fld"><label>Validity</label><input class="f" id="mq-valid" placeholder="e.g. 15 days"></div>
    </div></div>
    <div class="m-foot"><button class="btn ghost" onclick="closeModal()">Cancel</button><button class="btn" onclick="submitMrQuote('${id}')">Save quote</button></div></div>`);
}
function submitMrQuote(id){ const r=MR.requests.find(x=>x.id===id); const rate=parseFloat(val('mq-rate'))||0; if(rate<=0) return toast('Enter a rate');
  let m=0; (r.quotes||[]).forEach(q=>{ const g=((q.id||'').match(/(\d+)$/)||[])[1]; if(g&&+g>m)m=+g; });
  (r.quotes=r.quotes||[]).push({id:'Q-'+(m+1),code:val('mq-code'),vendorId:val('mq-vendor'),rate,validity:val('mq-valid'),selected:false});
  mrAudit(id,'quote',val('mq-code')); mrSave(); renderView(); toast('Quote added'); }
function selectMrQuote(id,qid){ const r=MR.requests.find(x=>x.id===id); const sel=r.quotes.find(q=>q.id===qid); r.quotes.forEach(q=>{ if(q.code===sel.code) q.selected=(q.id===qid); }); mrSave(); renderView(); toast('Quote selected'); }
function delMrQuote(id,qid){ const r=MR.requests.find(x=>x.id===id); r.quotes=r.quotes.filter(q=>q.id!==qid); mrSave(); renderView(); }

/* ---------- raise PO ---------- */
function openRaisePO(id){ const r=MR.requests.find(x=>x.id===id);
  const pend=(r.lines||[]).filter(l=>(l.approvedQty||0)>(l.poQty||0));
  if(!pend.length) return toast('Nothing left to order');
  const selRate=code=>{ const q=(r.quotes||[]).find(x=>x.code===code&&x.selected); if(q) return q.rate; const it=item(code); return it?it.rate:0; };
  const selVendor=()=>{ const q=(r.quotes||[]).find(x=>x.selected); return q?q.vendorId:(state.vendors[0]||{}).id; };
  openModal(`<div class="modal wide">${mh('',IC.po,'Raise Purchase Order','Order the approved quantities from a vendor')}
    <div class="m-body"><div class="grid2">
      <div class="fld"><label>Vendor <span class="req">*</span></label><select class="f" id="rp-vendor">${state.vendors.map(v=>`<option value="${v.id}" ${v.id===selVendor()?'selected':''}>${esc(v.name)}</option>`).join('')}</select></div>
      <div class="fld"><label>Deliver to</label><select class="f" id="rp-loc">${locOptions(r.site)}</select></div>
      <div class="fld"><label>PO date</label><input class="f" id="rp-date" type="date" value="${nowDate()}"></div>
      <div class="fld"><label>Expected delivery <span class="req">*</span></label><input class="f" id="rp-exp" type="date" value="${esc(r.neededBy||'')}"></div>
    </div>
    <div class="tbl-scroll"><table class="jc-tbl"><thead><tr><th>Item</th><th>Unit</th><th class="r">Pending</th><th class="r">Order qty</th><th class="r">Rate</th></tr></thead>
    <tbody>${pend.map(l=>{ const pendQty=(l.approvedQty||0)-(l.poQty||0); return `<tr><td><b>${esc(l.desc)}</b><div class="t-cmp-src">${esc(l.code)}</div></td><td>${esc(l.unit||'')}</td><td class="r">${jcNum(pendQty)}</td>
      <td class="r"><input class="f" style="width:80px;text-align:right" id="rpq-${l.id}" type="number" min="0" value="${pendQty}"></td>
      <td class="r"><input class="f" style="width:90px;text-align:right" id="rpr-${l.id}" type="number" step="any" value="${selRate(l.code)}"></td></tr>`; }).join('')}</tbody></table></div>
    <div class="hint">${svg(IC.po)}<div>Order quantities default to the pending approved amount; rates pre-fill from the selected quote. You can raise multiple POs (e.g. split across vendors).</div></div></div>
    <div class="m-foot"><button class="btn ghost" onclick="closeModal()">Cancel</button><button class="btn" onclick="submitRaisePO('${id}')">Create PO</button></div></div>`);
}
function submitRaisePO(id){ const r=MR.requests.find(x=>x.id===id); const exp=val('rp-exp'); if(!exp) return toast('Set an expected delivery date');
  const lines=[]; (r.lines||[]).forEach(l=>{ const qi=document.getElementById('rpq-'+l.id); if(!qi) return; const qty=parseFloat(qi.value)||0; const rate=parseFloat((document.getElementById('rpr-'+l.id)||{}).value)||0;
    if(qty>0){ lines.push({code:l.code,desc:l.desc,unit:l.unit,qty,rate,recdQty:0}); l.poQty=(+l.poQty||0)+qty; } });
  if(!lines.length) return toast('Enter at least one order quantity');
  const poId=poNextId();
  MR.pos.push({ id:poId, mrId:id, vendorId:val('rp-vendor'), date:val('rp-date')||nowDate(), expectedDate:exp, deliverTo:val('rp-loc')||r.site, status:'Open', lines, notes:'', receipts:[] });
  (r.poIds=r.poIds||[]).push(poId);
  mrAudit(id,'raise-po',poId+' → '+(vendor(val('rp-vendor'))||{}).name); closeModal();
  setMrStatus(id,'PO Raised','PO '+poId+' raised, expected '+exp); }

/* ---------- goods receipt (partial supported) → stock update ---------- */
function openReceive(poId){ const po=MR.pos.find(p=>p.id===poId); if(!po) return;
  openModal(`<div class="modal wide">${mh('',IC.in,'Goods receipt — '+po.id,'Record received quantities; stock updates automatically')}
    <div class="m-body"><div class="grid2">
      <div class="fld"><label>GRN / invoice no.</label><input class="f" id="gr-no" placeholder="GRN-..."></div>
      <div class="fld"><label>Received date</label><input class="f" id="gr-date" type="date" value="${nowDate()}"></div>
      <div class="fld col2"><label>Deliver to</label><select class="f" id="gr-loc">${locOptions(po.deliverTo)}</select></div>
    </div>
    <div class="tbl-scroll"><table class="jc-tbl"><thead><tr><th>Item</th><th>Unit</th><th class="r">Ordered</th><th class="r">Already recd</th><th class="r">Receive now</th></tr></thead>
    <tbody>${po.lines.map((l,i)=>{ const pend=(+l.qty||0)-(+l.recdQty||0); return `<tr><td><b>${esc(l.desc)}</b><div class="t-cmp-src">${esc(l.code)}</div></td><td>${esc(l.unit||'')}</td><td class="r">${jcNum(l.qty)}</td><td class="r">${jcNum(l.recdQty||0)}</td>
      <td class="r"><input class="f" style="width:90px;text-align:right" id="grq-${i}" type="number" min="0" max="${pend}" value="${pend}"></td></tr>`; }).join('')}</tbody></table></div>
    <div class="hint">${svg(IC.in)}<div>Enter a smaller quantity for a <b>partial delivery</b> — the PO stays open for the balance. Each receipt posts a Stock-In movement.</div></div></div>
    <div class="m-foot"><button class="btn ghost" onclick="closeModal()">Cancel</button><button class="btn" onclick="submitReceive('${poId}')">Receive goods</button></div></div>`);
}
function submitReceive(poId){ const po=MR.pos.find(p=>p.id===poId); if(!po) return; const loc=val('gr-loc')||po.deliverTo||'WH-MAIN'; const v=vendor(po.vendorId);
  const grn=val('gr-no')||('GRN-'+po.id); const dt=val('gr-date')||nowDate(); const recLines=[]; let any=false;
  po.lines.forEach((l,i)=>{ const inp=document.getElementById('grq-'+i); const qty=inp?Math.max(0,parseFloat(inp.value)||0):0; const pend=(+l.qty||0)-(+l.recdQty||0); const take=Math.min(qty,pend);
    if(take>0){ l.recdQty=(+l.recdQty||0)+take; recLines.push({code:l.code,qty:take});
      addMovement({code:l.code,qty:take,from:'VENDOR',to:loc,type:'IN',ref:po.id+' · '+grn+' · '+(v?v.name:''),person:COMPANY.user,date:dt}); any=true; } });
  if(!any){ return toast('Enter a quantity to receive'); }
  po.receipts.push({at:new Date().toISOString(),by:COMPANY.user,grnNo:grn,date:dt,lines:recLines});
  po.status = poRecd(po)>=poOrdered(po) ? 'Received' : 'Partially Received';
  // reflect onto the request lines + request status
  const r=MR.requests.find(x=>x.id===po.mrId);
  if(r){ recLines.forEach(rl=>{ const L=r.lines.find(x=>x.code===rl.code); if(L) L.recdQty=(+L.recdQty||0)+rl.qty; });
    const allRecd=(r.lines||[]).every(l=>(+l.recdQty||0)>=((l.approvedQty!=null?+l.approvedQty:+l.qty)||0));
    const newStatus=allRecd?'Delivered':'Partially Delivered';
    mrAudit(po.mrId,'grn',grn+' @ '+locName(loc));
    setMrStatus(po.mrId,newStatus,'Goods received '+grn+' at '+locName(loc));
  } else { mrSave(); }
  save(); closeModal(); renderView(); toast('Goods received — stock updated at '+locName(loc)); }
function cancelPO(poId){ if(!confirm('Cancel this purchase order?')) return; const po=MR.pos.find(p=>p.id===poId); if(!po) return;
  po.status='Cancelled'; const r=MR.requests.find(x=>x.id===po.mrId);
  if(r){ po.lines.forEach(l=>{ const L=r.lines.find(x=>x.code===l.code); if(L) L.poQty=Math.max(0,(+L.poQty||0)-((+l.qty||0)-(+l.recdQty||0))); }); }
  mrAudit(po.mrId,'cancel-po',poId); mrSave(); renderView(); toast('PO '+poId+' cancelled'); }

/* ---------- seed ---------- */
function mrSeed(){
  const pj=(typeof jcr!=='undefined'&&jcr.projects&&jcr.projects.length)?jcr.projects:[{id:'MC034'}];
  const p=id=>pj.find(x=>x.jobCode&&x.jobCode.replace(/\s/g,'')===id)||pj[0]||{id:'MC034'};
  const d=(off)=>{ const x=new Date(); x.setDate(x.getDate()+off); return x.toISOString().slice(0,10); };
  const L=(code,qty,ap,po,rc)=>{ const it=(typeof item==='function')?item(code):null; return {id:'',code,desc:it?it.name:code,unit:it?it.unit:'',qty,approvedQty:ap,poQty:po||0,recdQty:rc||0,note:''}; };
  const reqs=[
    { id:'MR-001', projectId:p('MC034').id, site:'ST-SKCL', requestedBy:'K. Prakash', date:d(-6), neededBy:d(-1), priority:'Urgent', status:'Submitted',
      lines:[L('CEM-001',200,null),L('STL-012',3000,null)], quotes:[], notes:'Slab casting next week', history:[{at:new Date(Date.now()-6*864e5).toISOString(),by:'K. Prakash',from:'',to:'Submitted',note:'Request raised'}], poIds:[] },
    { id:'MR-002', projectId:p('MC034').id, site:'ST-NEWRY', requestedBy:'S. Anand', date:d(-4), neededBy:d(5), priority:'Normal', status:'Under Review',
      lines:[L('BLK-006',4000,null),L('CEM-002',120,null)], quotes:[], notes:'Blockwork — 2nd floor', history:[{at:new Date(Date.now()-4*864e5).toISOString(),by:'S. Anand',from:'',to:'Submitted',note:'Request raised'},{at:new Date(Date.now()-3*864e5).toISOString(),by:COMPANY.user,from:'Submitted',to:'Under Review',note:'Reviewing'}], poIds:[] },
    { id:'MR-003', projectId:p('MC041').id, site:'ST-ASHOK', requestedBy:'R. Vel', date:d(-8), neededBy:d(3), priority:'Normal', status:'Approved',
      lines:[L('PLY-012',60,60),L('SCF-003',300,300)], quotes:[{id:'Q-1',code:'PLY-012',vendorId:'V-04',rate:840,validity:'15 days',selected:true},{id:'Q-2',code:'PLY-012',vendorId:'V-03',rate:905,validity:'10 days',selected:false}], notes:'Shuttering set', history:[{at:new Date(Date.now()-8*864e5).toISOString(),by:'R. Vel',from:'',to:'Submitted',note:'Raised'},{at:new Date(Date.now()-6*864e5).toISOString(),by:COMPANY.user,from:'Under Review',to:'Approved',note:'Approved'}], poIds:[] },
  ];
  // MR-004: a PO raised + partially delivered example
  const r4={ id:'MR-004', projectId:p('MC041').id, site:'ST-ASHOK', requestedBy:'R. Vel', date:d(-12), neededBy:d(-2), priority:'Urgent', status:'Partially Delivered',
    lines:[L('CEM-001',300,300,300,180),L('SFT-001',50,50,50,50)], quotes:[], notes:'Foundation pour', history:[{at:new Date(Date.now()-12*864e5).toISOString(),by:'R. Vel',from:'',to:'Submitted',note:'Raised'},{at:new Date(Date.now()-10*864e5).toISOString(),by:COMPANY.user,from:'Approved',to:'PO Raised',note:'PO-001 raised'},{at:new Date(Date.now()-3*864e5).toISOString(),by:COMPANY.user,from:'PO Raised',to:'Partially Delivered',note:'Partial GRN'}], poIds:['PO-001'] };
  reqs.push(r4);
  const pos=[
    { id:'PO-001', mrId:'MR-004', vendorId:'V-01', date:d(-10), expectedDate:d(-2), deliverTo:'ST-ASHOK', status:'Partially Received',
      lines:[{code:'CEM-001',desc:'OPC 53 Cement',unit:'bag',qty:300,rate:418,recdQty:180},{code:'SFT-001',desc:'Safety helmet',unit:'nos',qty:50,rate:240,recdQty:50}],
      receipts:[{at:new Date(Date.now()-3*864e5).toISOString(),by:COMPANY.user,grnNo:'GRN-1007',date:d(-3),lines:[{code:'CEM-001',qty:180},{code:'SFT-001',qty:50}]}] },
  ];
  return { requests:reqs, pos, audit:[] };
}
