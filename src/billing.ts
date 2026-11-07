/* ============================================================
   Qualtech Engineers — Quotations, Purchase Orders & Invoices
   A document-style billing module: price works for a client
   (quotation) → invoice accepted/completed work → order from a
   vendor (purchase order). Line items from the works/material
   catalogue, live totals, payment terms, draft/issue + print.
   Reuses clients (projects+tenders), vendors & the item master.
   ============================================================ */
'use strict';

const BILL_LS='qualtech-billing-v2';
const BILL_META={
  quotation:{ title:'quotation', label:'Quotation', plural:'Quotations', h:'New quotation', sub:'Select a client — price the works requested; once accepted it can be invoiced.', num:'QTN', party:'Customer', flow:'A quotation moves Draft → Sent → Accepted, then can be invoiced.', save:'Save & send — print PDF', desc:'Create and send quotations to customers.' },
  cpo:{ title:'customer purchase order', label:'Customer PO', plural:'Customer POs', h:'New customer PO', sub:'Record a purchase order received from a customer against a project.', num:'POC', party:'Customer', flow:'A customer PO is logged, fulfilled, then invoiced.', save:'Save customer PO — print PDF', desc:'Record purchase orders received from customers.' },
  vpo:{ title:'vendor purchase order', label:'Vendor PO', plural:'Vendor POs', h:'New vendor PO', sub:'Order materials or services from a vendor against a project.', num:'POV', party:'Vendor', flow:'A vendor PO is issued; receive goods in Procurement to update stock.', save:'Save & issue — print PDF', desc:'Create purchase orders to send to vendors.' },
  invoice:{ title:'invoice', label:'Invoice', plural:'Invoices', h:'New invoice', sub:'Invoice for completed or accepted work; billed against the client.', num:'INV', party:'Customer', flow:'The invoice is recorded against the client and tracked for payment.', save:'Save invoice & print PDF', desc:'Generate invoices for completed work.' }
};
const BILL_TYPES=['quotation','cpo','vpo','invoice'];
const PAY_TERMS=['100% upfront','50% advance, balance on delivery','30% advance, 40% on progress, 30% on completion','Net 30 days','Net 45 days','On completion'];

function billLoad(){ try{ const r=localStorage.getItem(BILL_LS); if(r){ const d=JSON.parse(r); d.docs=d.docs||[]; return d; } }catch{} return billSeed(); }
function billSave2(){ try{ localStorage.setItem(BILL_LS, JSON.stringify(BILL)); }catch{} syncPush(BILL_LS, BILL); }
let BILL: BillingState = billLoad();
function billNo(type){ const pfx=BILL_META[type].num; let m=0; BILL.docs.forEach(d=>{ if(d.type!==type) return; const g=((d.number||'').match(/(\d+)$/)||[])[1]; if(g&&+g>m)m=+g; }); return pfx+'-'+String(m+1).padStart(4,'0'); }

/* ---------- parties & catalogue ---------- */
function billClients(){ const s=new Set(); (typeof jcr!=='undefined'?jcr.projects:[]).forEach(p=>p.client&&s.add(p.client)); (typeof TDR!=='undefined'?TDR.tenders:[]).forEach(t=>t.client&&s.add(t.client)); return [...s]; }
function billPartyId(type,name){ if(type==='vpo'){ const v=state.vendors.find(x=>x.name===name); return v?v.id:''; } return 'C-'+String(name||'').replace(/[^A-Za-z0-9]/g,'').slice(0,6).toUpperCase(); }
function billParties(type){ return type==='vpo'? state.vendors.map(v=>v.name) : billClients(); }
function billCatalogOpts(type){
  const mats=state.items.filter(i=>i.type!=='equipment').slice(0,90).map(i=>`<option value="m:${i.code}">${esc(i.name)} — ₹${num(i.rate||0)}/${esc(i.unit)}</option>`).join('');
  if(type==='vpo') return `<optgroup label="Materials">${mats}</optgroup>`;
  const svc=(typeof jcr!=='undefined'?jcr.costCodes:[]).map(c=>`<option value="c:${c.code}">${esc(c.code)} — ${esc(c.desc)}</option>`).join('');
  return `<optgroup label="Works / cost codes">${svc}</optgroup><optgroup label="Materials">${mats}</optgroup>`;
}

/* ---------- view state ---------- */
let bView='list', bType='quotation', bFilter='all';
let billDraft=null;
function goBill(v){ bView=v; renderView(); window.scrollTo(0,0); }
function openNewDoc(type){ bType=type; billDraft={ party:'', partyId:'', ref:'', subject:'', date:nowDate(), dueDate:'', poNumber:'', projectId:(typeof jcr!=='undefined'?(jcr.currentProjectId||null):null), terms:(type==='quotation')?'':PAY_TERMS[0], lines:[], _selOnly:false }; bView='new'; renderView(); window.scrollTo(0,0); }

/* ============================================================ router ============================================================ */
function billingHTML(){ return bView==='new'? billForm() : billList(); }
function billBind(){ if(bView==='new'){ renderBillLines(); return; } const s=(document.getElementById('bcd-q') as HTMLInputElement); if(s) s.oninput=()=>{ billListQ=s.value; bPage=1; const el=document.getElementById('app'); el.innerHTML=billList(); const n=(document.getElementById('bcd-q') as HTMLInputElement); if(n){ n.focus(); n.setSelectionRange(n.value.length,n.value.length); billBind(); } }; }

/* ============================================================ list ============================================================ */
function billTotals(d){ const ls=(d.lines||[]).filter(l=>l.use!==false); const sub=ls.reduce((s,l)=>s+(+l.qty||0)*(+l.rate||0),0); const tax=ls.reduce((s,l)=>s+(+l.qty||0)*(+l.rate||0)*(+l.tax||0)/100,0); return {sub,tax,total:sub+tax}; }
let bPage=1; const B_PER=8;
const BILL_IMG='https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1100&q=70';
function billTypeBadge(t){ const c={quotation:['#1d4ed8','#e0ecff'],cpo:['#7c3aed','#f3e8ff'],vpo:['#0d9488','#ccfbf1'],invoice:['#b45309','#fef3c7']}[t]||['#475569','#e2e8f0']; return `<span class="t-badge" style="color:${c[0]};background:${c[1]}">${esc(BILL_META[t].label)}</span>`; }
function billList(){
  const docs=BILL.docs.slice().sort((a,b)=>(b.date||b.createdAt||'').localeCompare(a.date||a.createdAt||''));
  const cnt=t=>docs.filter(d=>d.type===t).length;
  const q=(bFilter&&bFilter!=='all')?docs.filter(d=>d.type===bFilter):docs;
  const projLabel=d=>d.projectId?projName(d.projectId):(d.ref||d.poNumber||'—');
  const term=(billListQ||'').trim().toLowerCase();
  const shown=term? q.filter(d=>[d.number,d.party,d.subject,d.poNumber,projLabel(d)].some(x=>String(x||'').toLowerCase().includes(term))) : q;
  const totPages=Math.max(1,Math.ceil(shown.length/B_PER)); if(bPage>totPages) bPage=1;
  const page=shown.slice((bPage-1)*B_PER,bPage*B_PER);
  const st=(t,f)=>docs.filter(d=>d.type===t&&f(d.status)).length;
  const outstanding=docs.filter(d=>d.type==='invoice'&&!['Paid','Draft'].includes(d.status)).reduce((s,d)=>s+billTotals(d).total,0);
  const kpi=(type,icon,v,sub)=>`<div class="bcd-kpi" onclick="bFilter='${jsid(type)}';bPage=1;renderView()"><div class="bcd-k-ic">${svg(icon)}</div><div class="bcd-k-body"><div class="bcd-k-lab">${BILL_META[type].plural.toUpperCase()}</div><div class="bcd-k-v">${v}</div><div class="bcd-k-sub">${sub}</div></div><span class="bcd-k-ar">${svg(IC.arrow)}</span></div>`;
  const create=(type)=>`<div class="bcd-create" onclick="openNewDoc('${jsid(type)}')"><div class="bcd-c-ic">${svg(BILL_META[type].party==='Vendor'?IC.procurement:IC.billing)}</div><div class="bcd-c-body"><div class="bcd-c-t">${svg(IC.plus)} Create ${BILL_META[type].label}</div><div class="bcd-c-s">${esc(BILL_META[type].desc)}</div></div><span class="bcd-k-ar">${svg(IC.arrow)}</span></div>`;
  const ftab=(v,l)=>`<button class="bcd-ftab ${bFilter===v?'on':''}" onclick="bFilter='${jsid(v)}';bPage=1;renderView()">${l}</button>`;
  const rows=page.map(d=>{ const t=billTotals(d); return `<tr class="drill" onclick="billView('${jsid(d.id)}')">
    <td class="c" onclick="event.stopPropagation()"><input type="checkbox"></td>
    <td><a class="bcd-no">${esc(d.number)}</a></td><td>${billTypeBadge(d.type)}</td>
    <td><b>${esc(d.party||'—')}</b></td><td>${esc(projLabel(d))}</td>
    <td>${esc(d.date||'')}</td><td class="r b">${money(t.total)}</td><td>${billBadge(d.status)}</td>
    <td onclick="event.stopPropagation()"><div class="bcd-acts"><button class="btn ghost sm" onclick="billPrint('${jsid(d.id)}')">${svg(IC.billing)} PDF</button><button class="bcd-more">⋯</button></div></td></tr>`;}).join('')
    ||`<tr class="empty-row"><td colspan="9">No documents match.</td></tr>`;
  const pg=[]; for(let i=1;i<=Math.min(totPages,3);i++) pg.push(i); if(totPages>4) pg.push('…'); if(totPages>3) pg.push(totPages);
  return `
  <div class="d3-hero bcd-hero">
    <div class="d3-hero-txt">
      <div class="d3-eyebrow">Commercial Documents <span class="d3-eb-rule"></span></div>
      <h1 class="d3-h1" style="font-size:46px">Quotations, Purchase Orders <span>and Invoices.</span></h1>
      <p class="d3-sub" style="max-width:520px">Create, track and manage all customer and vendor documents in one place.</p>
    </div>
    <div class="d3-media"><div class="d3-media-photo" style="background-image:url('${BILL_IMG}')"></div>
      <div class="d3-media-panel"><span class="d3-mp-w">PLAN<br>PROCURE<br>EXECUTE<br>BILL</span><span class="d3-mp-ar">${svg(TBI?TBI.arrowUR:'')}</span></div></div>
  </div>

  <div class="bcd-kpis">
    ${kpi('quotation',IC.billing,cnt('quotation'),st('quotation',s=>['Draft','Sent'].includes(s))+' pending · '+st('quotation',s=>s==='Accepted')+' approved')}
    ${kpi('cpo',IC.billing,cnt('cpo'),st('cpo',s=>s!=='Closed')+' open · '+st('cpo',s=>s==='Closed')+' closed')}
    ${kpi('vpo',IC.procurement,cnt('vpo'),st('vpo',s=>s!=='Closed')+' open · '+st('vpo',s=>s==='Closed')+' closed')}
    ${kpi('invoice',IC.billing,cnt('invoice'),money(outstanding)+' outstanding')}
  </div>
  <div class="bcd-creates">${create('quotation')}${create('cpo')}${create('vpo')}${create('invoice')}</div>

  <div class="panel bcd-table">
    <div class="bcd-th"><div><div class="bcd-th-t">${svg(IC.billing)} All Commercial Documents</div><div class="cd-sub">View, search and manage quotations, customer POs, vendor POs and invoices.</div></div>
      <div class="bcd-ftabs">${ftab('all','All ('+docs.length+')')}${ftab('quotation','Quotations ('+cnt('quotation')+')')}${ftab('cpo','Customer POs ('+cnt('cpo')+')')}${ftab('vpo','Vendor POs ('+cnt('vpo')+')')}${ftab('invoice','Invoices ('+cnt('invoice')+')')}</div></div>
    <div class="bcd-toolbar">
      <div class="f-search" style="flex:1;min-width:220px"><span>${svg(IC.search)}</span><input class="f" id="bcd-q" placeholder="Search by document no, client, vendor, project…" value="${esc(billListQ||'')}" style="padding-left:34px"></div>
      <div class="bcd-pill">${svg(IC.history)} 01 Oct 2026 – 31 Oct 2026</div>
      <div class="bcd-pill">Status ${svg(IC.chev)}</div>
      <div class="bcd-pill">${svg(IC.reports)} More filters</div>
    </div>
    <div class="tbl-scroll"><table class="jc-tbl bcd-tbl"><thead><tr><th class="c"><input type="checkbox" disabled></th><th>Doc no.</th><th>Type</th><th>Client / Vendor</th><th>Project / Reference</th><th>Date</th><th class="r">Amount</th><th>Status</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table></div>
    <div class="bcd-foot"><span class="cd-sub">Showing ${shown.length?((bPage-1)*B_PER+1):0} – ${Math.min(bPage*B_PER,shown.length)} of ${shown.length} documents</span>
      <div class="bcd-pager"><button class="bcd-pg" onclick="if(bPage>1){bPage--;renderView()}">‹</button>${pg.map(p=>p==='…'?`<span class="bcd-pg dots">…</span>`:`<button class="bcd-pg ${p===bPage?'on':''}" onclick="bPage=${p};renderView()">${p}</button>`).join('')}<button class="bcd-pg" onclick="if(bPage<${totPages}){bPage++;renderView()}">›</button></div></div>
  </div>`;
}
let billListQ='';
function billBadge(s){ const m={Draft:['#64748b','#f1f5f9'],Sent:['#0d9488','#ccfbf1'],Issued:['#0369a1','#e0f2fe'],Open:['#0369a1','#e0f2fe'],Closed:['#475569','#e2e8f0'],Accepted:['#15803d','#dcfce7'],Invoiced:['#4f46e5','#ecebfd'],Paid:['#15803d','#dcfce7'],Overdue:['#b91c1c','#fee2e2']}; const c=m[s]||['#475569','#e2e8f0']; return `<span class="t-badge" style="color:${c[0]};background:${c[1]}">${esc(s||'Draft')}</span>`; }

/* ============================================================ create form ============================================================ */
function billForm(){
  const m=BILL_META[bType]; const parties=billParties(bType);
  const partyOpts=`<option value="">Select…</option>`+parties.map(p=>`<option value="${esc(p)}" ${billDraft.party===p?'selected':''}>${esc(p)}</option>`).join('');
  const termSelect=`<select class="f" id="bl-terms" onchange="billDraft.terms=this.value;billRecalc()">${PAY_TERMS.map(t=>`<option ${billDraft.terms===t?'selected':''}>${esc(t)}</option>`).join('')}</select>`;
  const termText=`<input class="f" id="bl-terms" placeholder="e.g. 50% advance, balance on delivery" value="${esc(billDraft.terms||'')}" oninput="billDraft.terms=this.value;billRecalc()">`;
  const fld=(lab,inner,hint?,col2?)=>`<div class="fld ${col2?'col2':''}"><label>${lab}</label>${inner}${hint?`<div class="bl-hint">${hint}</div>`:''}</div>`;
  const projFld=fld('Project',`<select class="f" id="bl-proj" onchange="billDraft.projectId=this.value||null">${billProjectOpts()}</select>`,'Links this document to that project’s Documents tab');
  const party=fld(m.party+' <span class="req">*</span>',`<select class="f" id="bl-party" onchange="billSetParty(this.value)">${partyOpts}</select>`);
  const partyid=fld(m.party+' ID',`<input class="f" id="bl-partyid" placeholder="Auto-filled on selecting ${m.party.toLowerCase()}" value="${esc(billDraft.partyId)}" readonly>`);
  const subject=fld('Subject',`<input class="f" id="bl-subject" placeholder="${bType==='vpo'?'e.g. Steel for MC 041':'e.g. Civil works — Phase 1'}" value="${esc(billDraft.subject)}" oninput="billDraft.subject=this.value">`);
  const poNo=fld(bType==='vpo'?'Our reference':'Customer PO number',`<input class="f" id="bl-po" placeholder="PO/2026/…" value="${esc(billDraft.poNumber)}" oninput="billDraft.poNumber=this.value">`);
  let fields;
  if(bType==='quotation'||bType==='cpo') fields=projFld+party+partyid+subject
    +fld(bType==='cpo'?'Required delivery date':'Required completion date',`<input class="f" id="bl-due" type="date" value="${esc(billDraft.dueDate)}" oninput="billDraft.dueDate=this.value">`,bType==='cpo'?'Blank → 30 days':'Blank → valid 30 days')
    +poNo+fld('Payment terms',bType==='cpo'?termSelect:termText);
  else if(bType==='invoice') fields=projFld+party+partyid
    +fld('Quotation reference',`<select class="f" id="bl-ref" onchange="billDraft.ref=this.value">${billRefOpts()}</select>`)
    +fld('Due date',`<input class="f" id="bl-due" type="date" value="${esc(billDraft.dueDate)}" oninput="billDraft.dueDate=this.value">`,'Blank → 14 days from today')
    +poNo+fld('Payment terms',termSelect)+fld('Subject',`<input class="f" id="bl-subject" placeholder="Construction services" value="${esc(billDraft.subject)}" oninput="billDraft.subject=this.value">`,'',true);
  else fields=projFld+party+partyid+subject
    +fld('Expected delivery',`<input class="f" id="bl-due" type="date" value="${esc(billDraft.dueDate)}" oninput="billDraft.dueDate=this.value">`,'Blank → 14 days from today')
    +poNo+fld('Payment terms',termSelect);
  const svcTitle=bType==='vpo'?'Items to order':bType==='invoice'?'Services to invoice':bType==='cpo'?'Items ordered':'Services to quote';
  const addVerb=bType==='vpo'?'item':'service';
  return `
  <div class="bl-crumb">Commercial Documents / ${m.h}</div>
  <h1 class="bl-h1">${m.h}</h1><div class="bl-accent"></div>
  <p class="bl-sub">${m.sub}</p>
  <div class="bl-grid">
    <div class="bl-main">
      <div class="panel bl-card"><div class="grid2">${fields}</div></div>

      <div class="panel bl-card">
        <div class="inv-head bl-svc-head"><h2>${svcTitle}</h2>
          <div class="bl-svc-tools">
            <label class="bl-chk"><input type="checkbox" id="bl-selonly" ${billDraft._selOnly?'checked':''} onchange="billDraft._selOnly=this.checked;renderBillLines()"> Show selected only</label>
            <span class="bl-selcount" id="bl-selcount">0 of 0 selected</span>
            <button class="btn ghost sm" onclick="billToggleAll()">Select / clear all</button></div></div>
        <div class="tbl-scroll"><table class="jc-tbl bl-lines"><thead><tr><th class="c">Use</th><th>Service &amp; specification</th><th>Discipline</th><th class="r">Qty</th><th class="r">Unit price (₹)</th><th class="r">Tax %</th><th class="r">Amount</th><th></th></tr></thead>
        <tbody id="bl-lines"></tbody></table></div>
        <div class="bl-add">
          <div class="bl-add-row"><h3>Add ${bType==='vpo'?'items':'services'} from the catalog</h3>
            <div class="bl-add-ctl"><select class="f" id="bl-cat"><option value="">Select ${bType==='vpo'?'material':'discipline / parameter'}…</option>${billCatalogOpts(bType)}</select>
              <button class="btn" onclick="billAddCatalog()">${svg(IC.plus)} Add ${addVerb}</button></div></div>
          <a class="bl-custom" onclick="billAddCustom()">+ Add a custom line</a>
          <p class="cd-sub" style="margin-top:8px">Pick a ${bType==='vpo'?'material':'work / material'} — the list rate is preloaded; then edit quantity, price and tax.</p></div>
      </div>
    </div>

    <div class="bl-side"><div class="panel bl-summary" id="bl-summary"></div></div>
  </div>`;
}
function billToggleAll(){ const allOn=billDraft.lines.length>0 && billDraft.lines.every(l=>l.use); billDraft.lines.forEach(l=>l.use=!allOn); renderBillLines(); }
function billRefOpts(){ const q=BILL.docs.filter(d=>d.type==='quotation'); return `<option value="">All stages — none (direct invoice)</option>`+q.map(d=>`<option value="${d.id}" ${billDraft.ref===d.id?'selected':''}>${esc(d.number)} — ${esc(d.party)}</option>`).join(''); }
function billProjectOpts(){ const ps=(typeof jcr!=='undefined'?jcr.projects:[]).filter(p=>!p.archived); return `<option value="">— no project —</option>`+ps.map(p=>`<option value="${p.id}" ${p.id===billDraft.projectId?'selected':''}>${esc(p.name)} (${esc(p.jobCode)})</option>`).join(''); }
function billSetParty(v){ billDraft.party=v; billDraft.partyId=billPartyId(bType,v); const e=(document.getElementById('bl-partyid') as HTMLInputElement); if(e) e.value=billDraft.partyId; billRecalc(); }
function billAddCatalog(){ const v=val('bl-cat'); if(!v) return; let line; if(v.slice(0,2)==='m:'){ const it=item(v.slice(2)); if(!it) return toast('That item is no longer in the catalog'); line={desc:it.name,cat:it.category,qty:1,rate:it.rate||0,tax:18,use:true}; } else { const c=(jcr.costCodes||[]).find(x=>x.code===v.slice(2)); line={desc:(c?c.code+' — '+c.desc:v.slice(2)),cat:'Works',qty:1,rate:0,tax:18,use:true}; } billDraft.lines.push(line); renderBillLines(); }
function billAddCustom(){ billDraft.lines.push({desc:'',cat:'',qty:1,rate:0,tax:18,use:true}); renderBillLines(); }
function renderBillLines(){
  const tb=document.getElementById('bl-lines'); if(!tb) return;
  const view=billDraft.lines.map((l,i)=>({l,i})).filter(x=>!billDraft._selOnly||x.l.use);
  tb.innerHTML=view.map(({l,i})=>`<tr class="${l.use?'':'bl-off'}">
    <td class="c"><input type="checkbox" ${l.use?'checked':''} onchange="billDraft.lines[${i}].use=this.checked;renderBillLines()"></td>
    <td><input class="f" value="${esc(l.desc)}" placeholder="Service & specification" oninput="billDraft.lines[${i}].desc=this.value"></td>
    <td><input class="f" style="width:120px" value="${esc(l.cat||'')}" placeholder="Discipline" oninput="billDraft.lines[${i}].cat=this.value"></td>
    <td class="r"><input class="f r" style="width:58px" type="number" step="any" value="${l.qty}" oninput="billDraft.lines[${i}].qty=+this.value;billRecalc()"></td>
    <td class="r"><input class="f r" style="width:92px" type="number" step="any" value="${l.rate}" oninput="billDraft.lines[${i}].rate=+this.value;billRecalc()"></td>
    <td class="r"><input class="f r" style="width:54px" type="number" step="any" value="${l.tax}" oninput="billDraft.lines[${i}].tax=+this.value;billRecalc()"></td>
    <td class="r b" id="bl-amt-${i}">${money((+l.qty||0)*(+l.rate||0))}</td>
    <td><button class="xrow" onclick="billDraft.lines.splice(${i},1);renderBillLines()">×</button></td></tr>`).join('')
    ||`<tr class="empty-row"><td colspan="8">No ${bType==='vpo'?'items':'services'} yet — add from the catalog below.</td></tr>`;
  billRecalc();
}
function billRecalc(){
  let sub=0,tax=0,used=0;
  billDraft.lines.forEach((l,i)=>{ const amt=(+l.qty||0)*(+l.rate||0); const c=document.getElementById('bl-amt-'+i); if(c) c.textContent=money(amt); if(l.use){ sub+=amt; tax+=amt*(+l.tax||0)/100; used++; } });
  const total=sub+tax; const m=BILL_META[bType];
  const sc=document.getElementById('bl-selcount'); if(sc) sc.textContent=used+' of '+billDraft.lines.length+' selected';
  const upfrontPct=/upfront/i.test(billDraft.terms)?100:/advance/i.test(billDraft.terms)?(parseInt(billDraft.terms)||50):0;
  const up=total*upfrontPct/100, bal=total-up;
  const el=document.getElementById('bl-summary'); if(!el) return;
  el.innerHTML=`<div class="bl-sum-head">${m.party}</div><div class="bl-sum-party">${esc(billDraft.party)||'—'}</div>
    <div class="bl-sum-row"><span>Lines</span><b>${used}</b></div>
    <div class="bl-sum-row"><span>Subtotal</span><b>${money(sub)}</b></div>
    <div class="bl-sum-row"><span>Tax</span><b>${money(tax)}</b></div>
    <div class="bl-sum-row total"><span>Total</span><b>${money(total)}</b></div>
    ${bType==='invoice'?`<div class="bl-sum-row sm"><span>Upfront (${upfrontPct}%)</span><b>${money(up)}</b></div><div class="bl-sum-row sm"><span>Balance</span><b>${money(bal)}</b></div>`:''}
    <button class="btn bl-primary" onclick="billSaveDoc('issue',true)">${m.save}</button>
    <button class="btn ghost bl-w" onclick="billSaveDoc('email',false)">Save &amp; email to ${m.party.toLowerCase()}</button>
    <button class="btn ghost bl-w" onclick="billSaveDoc('draft',false)">Save as draft</button>
    <button class="bl-cancel" onclick="goBill('list')">Cancel</button>
    <div class="bl-note">${m.flow}</div>`;
}
function billSaveDoc(mode,print){
  if(!billDraft.party) return toast('Select a '+BILL_META[bType].party.toLowerCase());
  const used=billDraft.lines.filter(l=>l.use);
  if(!used.length) return toast('Tick “Use” on at least one line');
  const status=mode==='draft'?'Draft':({quotation:'Sent',cpo:'Open',vpo:'Issued',invoice:'Issued'}[bType]||'Sent');
  const saved=JSON.parse(JSON.stringify(billDraft)); saved.lines=JSON.parse(JSON.stringify(used));
  const doc=Object.assign({ id:'D'+Date.now().toString(36).toUpperCase(), type:bType, number:billNo(bType), status, createdAt:new Date().toISOString(), createdBy:COMPANY.user }, saved);
  BILL.docs.push(doc); billSave2();
  toast(BILL_META[bType].num+' '+doc.number+' saved'+(mode==='draft'?' as draft':''));
  if(print) billPrint(doc.id);
  if(mode!=='email') { goBill('list'); } else { toast('Emailed to '+doc.party+' (demo)'); goBill('list'); }
}
function billView(id){ const d=BILL.docs.find(x=>x.id===id); if(d) billPrint(id); }

/* ---------- printable document ---------- */
function billPrint(id){
  const d=BILL.docs.find(x=>x.id===id); if(!d) return; const t=billTotals(d); const m=BILL_META[d.type];
  const rows=(d.lines||[]).map((l,i)=>`<tr><td>${i+1}</td><td>${esc(l.desc)}<div style="color:#64748b;font-size:11px">${esc(l.cat||'')}</div></td><td style="text-align:right">${num(l.qty)}</td><td style="text-align:right">₹${num(l.rate)}</td><td style="text-align:right">${num(l.tax)}%</td><td style="text-align:right">₹${num((+l.qty||0)*(+l.rate||0))}</td></tr>`).join('');
  const html=`<!doctype html><html><head><meta charset="utf-8"><title>${esc(d.number)}</title>
  <style>*{font-family:Inter,Arial,sans-serif;box-sizing:border-box}body{margin:0;padding:40px;color:#0f172a}
  .top{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #2563eb;padding-bottom:16px}
  .co{font-size:20px;font-weight:800}.co small{display:block;font-weight:400;color:#64748b;font-size:12px;margin-top:3px}
  .doc{text-align:right}.doc h1{margin:0;font-size:26px;text-transform:capitalize}.doc .n{color:#2563eb;font-weight:700;margin-top:4px}
  .meta{display:flex;justify-content:space-between;margin:22px 0}.meta div{font-size:13px;line-height:1.7}.meta b{color:#0f172a}
  table{width:100%;border-collapse:collapse;margin-top:10px}th{background:#f1f5f9;text-align:left;padding:9px 10px;font-size:11px;letter-spacing:.04em;text-transform:uppercase;color:#475569}
  td{padding:9px 10px;border-bottom:1px solid #eef2f7;font-size:13px}
  .tot{margin-top:16px;margin-left:auto;width:280px;font-size:13px}.tot div{display:flex;justify-content:space-between;padding:5px 0}.tot .g{border-top:2px solid #0f172a;margin-top:6px;padding-top:9px;font-size:16px;font-weight:800}
  .ft{margin-top:40px;color:#64748b;font-size:12px;border-top:1px solid #eef2f7;padding-top:14px}</style></head>
  <body><div class="top"><div class="co">${esc(COMPANY.name)}<small>${esc(COMPANY.tagline||'')}</small></div>
    <div class="doc"><h1>${m.title}</h1><div class="n">${esc(d.number)}</div><div style="font-size:12px;color:#64748b;margin-top:4px">${esc(d.date||'')}</div></div></div>
  <div class="meta"><div><b>${m.party}</b><br>${esc(d.party||'')}<br>${esc(d.partyId||'')}</div>
    <div style="text-align:right">${d.subject?('<b>Subject</b><br>'+esc(d.subject)+'<br>'):''}${d.poNumber?('<b>Ref</b> '+esc(d.poNumber)+'<br>'):''}${d.dueDate?('<b>'+(d.type==='quotation'?'Completion':'Due')+'</b> '+esc(d.dueDate)+'<br>'):''}<b>Terms</b> ${esc(d.terms||'')}</div></div>
  <table><thead><tr><th>#</th><th>Service / specification</th><th style="text-align:right">Qty</th><th style="text-align:right">Rate</th><th style="text-align:right">Tax</th><th style="text-align:right">Amount</th></tr></thead><tbody>${rows}</tbody></table>
  <div class="tot"><div><span>Subtotal</span><b>₹${num(Math.round(t.sub))}</b></div><div><span>Tax</span><b>₹${num(Math.round(t.tax))}</b></div><div class="g"><span>Total</span><b>₹${num(Math.round(t.total))}</b></div></div>
  <div class="ft">${esc(m.flow)} · Generated by ${esc(COMPANY.name)} · ${esc(COMPANY.user)}</div>
  <script>window.onload=function(){setTimeout(function(){window.print()},250)}<\/script></body></html>`;
  const w=window.open('','_blank'); if(!w){ toast('Allow pop-ups to print'); return; } w.document.write(html); w.document.close();
}

/* ---------- seed ---------- */
function billSeed(){
  const cl=billClients(); const C=i=>cl[i%Math.max(1,cl.length)]||'Coastal Grove Estates LLP';
  const V=i=>(state.vendors[i%Math.max(1,state.vendors.length)]||{name:'JSW Steel'}).name;
  const L=(desc,cat,qty,rate,tax?)=>({desc,cat,qty,rate,tax:tax==null?18:tax,use:true});
  const d=(type,n,party,proj,date,status,lines,subj)=>({ id:'DS'+type+n, type, number:BILL_META[type].num+'-'+String(n).padStart(4,'0'), party, partyId:billPartyId(type,party), subject:subj||'', poNumber:proj, date, dueDate:'', terms:type==='quotation'?'50% advance, balance on delivery':'Net 30 days', lines, status, createdAt:date+'T09:00:00Z', createdBy:'R. Suresh' });
  const docs=[
    d('quotation',2,'Green Valley Estates','','2026-10-29','Sent',[L('Civil works package','Works',1,0,18)],'Civil works — Green Valley'),
    d('quotation',1,C(0),'','2026-10-18','Accepted',[L('RCC Work','Works',900,6800),L('OPC 53 Cement','Cement',1200,418),L('TMT Bar 16mm','Steel',45,68000)],'Civil works — Phase 1'),
    d('quotation',3,C(1),'','2026-10-12','Draft',[L('Road works','Works',3200,1850)],'Internal roads'),
    d('cpo',21,'Lakeside Developers','MC 041','2026-10-24','Open',[L('Structural works — MC 041','Works',1,6610360)],'Structural package'),
    d('cpo',18,C(2),'MC 047','2026-10-10','Closed',[L('Villa civil works','Works',1,9850000)],'Green Valley villas'),
    d('vpo',105,V(1),'MC 041','2026-10-22','Issued',[L('TMT Bar 16mm','Steel',60,67500),L('TMT Bar 12mm','Steel',40,67800)],'Steel for MC 041'),
    d('vpo',104,V(0),'MC 034','2026-10-18','Sent',[L('OPC 53 Cement','Cement',2400,418),L('PPC Cement','Cement',1800,395)],'Cement supply'),
    d('vpo',101,V(2),'MC 047','2026-10-06','Closed',[L('Ready Mix Concrete M30','Concrete',900,6400)],'RMC supply'),
    d('invoice',1,'Lakeside Developers','MC 041','2026-10-20','Issued',[L('RCC frame — RA1','Works',1,6761153)],'RA Bill 1 — structural works'),
    d('invoice',2,C(1),'MC 052','2026-10-26','Issued',[L('Warehouse civil — RA1','Works',1,4850000),L('Shuttering hire','Hire',3200,235)],'RA Bill 1'),
    d('invoice',3,C(0),'MC 034','2026-09-28','Paid',[L('Residence — final bill','Works',1,1835100)],'Final bill'),
  ];
  return { docs };
}
