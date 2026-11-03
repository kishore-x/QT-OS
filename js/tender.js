/* ============================================================
   Qualtech Engineers — Tendering & Bidding module
   Opportunity lifecycle: Tender → Estimate → Bid → Submit → Won → Project.
   On "Won", converts into a fully-initialized project via app.js initProject()
   (same JCR/JCL/BOQ/overhead structure as a manually-created project).
   Reuses shared masters: cost codes (jcr.costCodes), vendors (state.vendors),
   and historical rates (jcr.entries across all projects).
   ============================================================ */
'use strict';

const T_LS='qualtech-tender-v2';
const T_STATUSES=['Draft','Under Review','Estimation in Progress','Awaiting Approval','Approved for Submission','Submitted','Under Negotiation','Won','Lost','Withdrawn'];
// valid forward transitions (Won is reached only through Convert-to-Project)
const T_TRANSITIONS={
  'Draft':['Under Review','Withdrawn'],
  'Under Review':['Estimation in Progress','Withdrawn'],
  'Estimation in Progress':['Awaiting Approval','Withdrawn'],
  'Awaiting Approval':['Approved for Submission','Estimation in Progress','Withdrawn'],
  'Approved for Submission':['Submitted','Withdrawn'],
  'Submitted':['Under Negotiation','Lost','Withdrawn'],
  'Under Negotiation':['Lost','Withdrawn'],
  'Won':[], 'Lost':['Draft'], 'Withdrawn':['Draft']   // Lost/Withdrawn can be reopened to Draft to re-bid
};
const T_STATUS_COLORS={
  'Draft':['#64748b','#f1f5f9'], 'Under Review':['#7c3aed','#f3e8ff'], 'Estimation in Progress':['#2563eb','#e0ecff'],
  'Awaiting Approval':['#b45309','#fef3c7'], 'Approved for Submission':['#0369a1','#e0f2fe'], 'Submitted':['#0d9488','#ccfbf1'],
  'Under Negotiation':['#c2410c','#ffedd5'], 'Won':['#15803d','#dcfce7'], 'Lost':['#b91c1c','#fee2e2'], 'Withdrawn':['#475569','#e2e8f0']
};

function tLoad(){
  try{ const r=localStorage.getItem(T_LS); if(r){ const d=JSON.parse(r); d.tenders=d.tenders||[]; d.audit=d.audit||[]; return d; } }catch{}
  return { tenders:[tSeedTender(), ...tExtraSeedTenders()], audit:[], counter:4 };
}
function tSave(){ try{ localStorage.setItem(T_LS, JSON.stringify(TDR)); }catch{} }
let TDR=tLoad();
function tAudit(tid, action, detail){ TDR.audit.unshift({ at:new Date().toISOString(), by:COMPANY.user, tid, action, detail }); TDR.audit=TDR.audit.slice(0,400); }
function tNextId(){ let m=0; TDR.tenders.forEach(t=>{ const g=((t.id||'').match(/(\d+)$/)||[])[1]; if(g&&+g>m)m=+g; }); return 'TDR-'+String(m+1).padStart(3,'0'); }
function tLineId(t){ let m=0; (t.boq||[]).forEach(b=>{ const g=((b.id||'').match(/(\d+)$/)||[])[1]; if(g&&+g>m)m=+g; }); return 'TB-'+(m+1); }

/* ---------- one illustrative seed tender so the register isn't empty ---------- */
function tSeedTender(){
  const cc=(typeof jcr!=='undefined'&&jcr.costCodes)?jcr.costCodes:[];
  const pick=(i,d)=>cc[i]?cc[i]:{code:'',desc:d};
  const boq=[
    tBoqLine('1', pick(0,'Excavation'), 'Cum', 1800, {matRate:0,labRate:180,subRate:60}),
    tBoqLine('2', pick(2,'RCC Work'), 'Cum', 950, {matRate:6200,labRate:1400,subRate:0}),
    tBoqLine('3', pick(4,'Brick/Block Work'), 'Cum', 620, {matRate:4100,labRate:1100}),
    tBoqLine('4', pick(6,'Plastering'), 'Sqm', 8600, {matRate:140,labRate:95}),
  ];
  return {
    id:'TDR-001', name:'Coastal Grove Villas — Phase 1', client:'Coastal Grove Estates LLP',
    clientContact:'projects@coastalgrove.in · +91 98400 11223', clientRef:'CGE/TNDR/2026/07',
    desc:'Construction of 12 premium villas with common amenities, Phase 1 civil package.',
    receivedDate:'2026-10-05', deadline:'2026-11-10', owner:COMPANY.user, status:'Estimation in Progress',
    estValue:48000000, siteAddress:'ECR, Kanathur, Chennai', expStart:'2026-12-15', expFinish:'2027-12-31',
    tenderType:'Open — Lump Sum', specialConditions:'LD 0.5%/week, retention 5%, defect liability 12 months.',
    notes:'Strong repeat-client relationship; prioritise competitive RCC rates.',
    boq, quotes:tSeedQuotes(), pricing:{overheadPct:7, contingencyPct:3, markupPct:12, taxPct:18},
    versions:[], submittedValue:null, submittedDate:null,
    docs:[{id:'DOC-1',name:'CGE-Tender-Notice.pdf',type:'Tender notice',at:'2026-10-05T09:00:00Z'},{id:'DOC-2',name:'Architectural-Drawings-R2.pdf',type:'Drawing',at:'2026-10-06T10:00:00Z'},{id:'DOC-3',name:'BOQ-CoastalGrove-R1.xlsx',type:'BOQ',at:'2026-10-06T10:05:00Z'}], approvals:[],
    history:[{at:'2026-10-05T09:00:00Z', by:COMPANY.user, from:'', to:'Draft', note:'Tender received & logged'},
             {at:'2026-10-07T11:00:00Z', by:COMPANY.user, from:'Draft', to:'Under Review', note:'Initial scope review'},
             {at:'2026-10-09T15:00:00Z', by:COMPANY.user, from:'Under Review', to:'Estimation in Progress', note:'BOQ estimation started'}],
    projectId:null, jobCode:null, awardDate:null, acceptedValue:null, archived:false
  };
}
// mock vendor quotations (multiple vendors per item so the comparison view has data)
function tSeedQuotes(){
  return [
    {id:'QT-1', vendorId:'V-01', item:'OPC 53 Cement',          unit:'bag', price:418,   validity:'30 days', delivery:'3 days FOR site', terms:'Net 30', selected:true},
    {id:'QT-2', vendorId:'V-03', item:'OPC 53 Cement',          unit:'bag', price:426,   validity:'15 days', delivery:'5 days',          terms:'Advance 25%', selected:false},
    {id:'QT-3', vendorId:'V-02', item:'TMT Bar 16mm',           unit:'MT',  price:68200, validity:'7 days',  delivery:'10 days',         terms:'Net 15', selected:true},
    {id:'QT-4', vendorId:'V-01', item:'TMT Bar 16mm',           unit:'MT',  price:69500, validity:'7 days',  delivery:'7 days',          terms:'Net 30', selected:false},
    {id:'QT-5', vendorId:'V-03', item:'Ready Mix Concrete M30', unit:'Cum', price:6450,  validity:'30 days', delivery:'On call',         terms:'Net 30', selected:true},
    {id:'QT-6', vendorId:'V-01', item:'Ready Mix Concrete M30', unit:'Cum', price:6680,  validity:'20 days', delivery:'On call',         terms:'Advance 50%', selected:false},
    {id:'QT-7', vendorId:'V-04', item:'Shuttering hire',        unit:'Sqm', price:235,   validity:'Project', delivery:'Immediate',       terms:'Monthly billing', selected:false},
  ];
}
// a few more demo tenders so the register, dashboard & benchmarks have data
function tExtraSeedTenders(){
  const cc=(typeof jcr!=='undefined'&&jcr.costCodes)?jcr.costCodes:[];
  const pick=(i,d)=>cc[i]?cc[i]:{code:'',desc:d};
  const h=(d,from,to,note)=>({at:d, by:COMPANY.user, from, to, note});
  return [
    { id:'TDR-002', name:'Riverside Tech Park — Structural Package', client:'Riverside Infra Developers',
      clientContact:'tenders@riverside.co.in', clientRef:'RIV/2026/ST-14', desc:'RCC frame & structural works for a 2-tower IT park.',
      receivedDate:'2026-09-20', deadline:'2026-10-28', owner:COMPANY.user, status:'Submitted',
      estValue:92000000, siteAddress:'OMR, Navalur, Chennai', expStart:'2026-11-20', expFinish:'2028-03-31',
      tenderType:'Limited — Item Rate', specialConditions:'Retention 7.5%, mobilisation advance 10%.', notes:'Competitive; two other L1 bidders expected.',
      boq:[ tBoqLine('1',pick(2,'RCC Work'),'Cum',4200,{matRate:6300,labRate:1450}), tBoqLine('2',pick(1,'Steel'),'MT',980,{matRate:67500,labRate:3800}), tBoqLine('3',pick(0,'Excavation'),'Cum',6500,{matRate:0,labRate:165,subRate:55}) ],
      quotes:[ {id:'QT-1',vendorId:'V-02',item:'TMT Bar 16mm',unit:'MT',price:67500,validity:'7 days',delivery:'12 days',terms:'Net 15',selected:true},
               {id:'QT-2',vendorId:'V-03',item:'Ready Mix Concrete M30',unit:'Cum',price:6380,validity:'30 days',delivery:'On call',terms:'Net 30',selected:true} ],
      pricing:{overheadPct:8, contingencyPct:2.5, markupPct:11, taxPct:18}, versions:[{ver:1,at:'2026-10-26T12:00:00Z',by:COMPANY.user,direct:0,totalCost:0,bidValue:98500000,profit:0,margin:0,note:'SUBMITTED · Riverside-Bid.pdf'}],
      submittedValue:98500000, submittedDate:'2026-10-26', docs:[{id:'DOC-1',name:'Riverside-Bid.pdf',type:'Submitted proposal',at:'2026-10-26T12:00:00Z'}], approvals:[{at:'2026-10-24T10:00:00Z',by:COMPANY.user,decision:'Approved',note:'Approved at 11% markup'}],
      history:[h('2026-09-20T09:00:00Z','','Draft','Received'),h('2026-10-01T09:00:00Z','Draft','Estimation in Progress','Estimation'),h('2026-10-24T10:00:00Z','Estimation in Progress','Approved for Submission','Approved'),h('2026-10-26T12:00:00Z','Approved for Submission','Submitted','Bid submitted ₹9.85 Cr')],
      projectId:null, jobCode:null, awardDate:null, acceptedValue:null, archived:false },
    { id:'TDR-003', name:'Green Meadows Township — Internal Roads', client:'Green Meadows Housing Society',
      clientContact:'secretary@greenmeadows.org', clientRef:'GM/ROADS/26', desc:'WMM + bituminous roads, storm-water drains, 3.2 km internal network.',
      receivedDate:'2026-10-12', deadline:'2026-11-18', owner:COMPANY.user, status:'Awaiting Approval',
      estValue:36000000, siteAddress:'Sriperumbudur, Kanchipuram', expStart:'2026-12-01', expFinish:'2027-08-31',
      tenderType:'Open — Lump Sum', specialConditions:'Defect liability 24 months on roads.', notes:'Margin-sensitive society client.',
      boq:[ tBoqLine('1',pick(0,'Excavation'),'Cum',3800,{matRate:0,labRate:150,subRate:70}), tBoqLine('2',pick(4,'WMM/Sub-base'),'Cum',2600,{matRate:1850,labRate:240,eqpRate:180}) ],
      quotes:[ {id:'QT-1',vendorId:'V-05',item:'20mm Aggregate',unit:'Cum',price:1480,validity:'30 days',delivery:'5 days',terms:'Net 30',selected:false} ],
      pricing:{overheadPct:6, contingencyPct:4, markupPct:10, taxPct:18}, versions:[],
      submittedValue:null, submittedDate:null, docs:[], approvals:[],
      history:[h('2026-10-12T09:00:00Z','','Draft','Received'),h('2026-10-15T09:00:00Z','Draft','Estimation in Progress','Estimation started'),h('2026-10-22T09:00:00Z','Estimation in Progress','Awaiting Approval','Submitted for approval')],
      projectId:null, jobCode:null, awardDate:null, acceptedValue:null, archived:false },
    { id:'TDR-004', name:'Harbour Logistics Warehouse — Civil', client:'Harbour Logistics Pvt Ltd',
      clientContact:'projects@harbourlog.in', clientRef:'HL/WH/2026', desc:'PEB foundation, flooring & civil works for a 1.2 lakh sqft warehouse.',
      receivedDate:'2026-08-15', deadline:'2026-09-25', owner:COMPANY.user, status:'Lost',
      estValue:54000000, siteAddress:'Ennore Port Road, Chennai', expStart:'', expFinish:'',
      tenderType:'Limited — Item Rate', specialConditions:'', notes:'Lost to L1 by ~4%; revisit relationship.',
      boq:[ tBoqLine('1',pick(2,'RCC Work'),'Cum',2100,{matRate:6150,labRate:1380}), tBoqLine('2',pick(5,'Flooring'),'Sqm',42000,{matRate:780,labRate:160}) ],
      quotes:[], pricing:{overheadPct:7, contingencyPct:3, markupPct:9, taxPct:18},
      versions:[{ver:1,at:'2026-09-24T12:00:00Z',by:COMPANY.user,direct:0,totalCost:0,bidValue:56800000,profit:0,margin:0,note:'SUBMITTED'}],
      submittedValue:56800000, submittedDate:'2026-09-24', docs:[], approvals:[{at:'2026-09-22T10:00:00Z',by:COMPANY.user,decision:'Approved',note:''}],
      history:[h('2026-08-15T09:00:00Z','','Draft','Received'),h('2026-09-24T12:00:00Z','Approved for Submission','Submitted','Bid submitted'),h('2026-10-10T09:00:00Z','Submitted','Lost','Lost to L1 by ~4%')],
      projectId:null, jobCode:null, awardDate:null, acceptedValue:null, archived:false },
  ];
}
function tBoqLine(no, cc, unit, qty, rates){
  const r=Object.assign({matRate:0,labRate:0,subRate:0,eqpRate:0,otherRate:0}, rates||{});
  return Object.assign({ id:'TB-'+no, itemNo:no, desc:cc.desc, code:cc.code, unit, qty }, r);
}

/* ---------- costing math ---------- */
const tLineRate=b=>(+b.matRate||0)+(+b.labRate||0)+(+b.subRate||0)+(+b.eqpRate||0)+(+b.otherRate||0);
const tLineAmt=b=>(+b.qty||0)*tLineRate(b);
function tDirectCost(t){ return (t.boq||[]).reduce((s,b)=>s+tLineAmt(b),0); }
// cost split by category, mirroring the bid build-up (Materials / Labour / Subcontracting & equipment).
// If a manual direct-cost override is set, those figures are used instead of the BOQ-derived ones.
function tCatCosts(t){
  const o=t.directOverride;
  if(o && o.on) return { mat:+o.mat||0, lab:+o.lab||0, subEqp:+o.subEqp||0 };
  let mat=0,lab=0,subEqp=0;
  (t.boq||[]).forEach(b=>{ const q=+b.qty||0; mat+=q*(+b.matRate||0); lab+=q*(+b.labRate||0); subEqp+=q*((+b.subRate||0)+(+b.eqpRate||0)+(+b.otherRate||0)); });
  return {mat,lab,subEqp};
}
function tCostBreak(t){
  const p=t.pricing||{};
  const cat=tCatCosts(t);
  const direct=cat.mat+cat.lab+cat.subEqp;
  const overhead=direct*(+p.overheadPct||0)/100;
  const contingency=direct*(+p.contingencyPct||0)/100;
  const totalCost=direct+overhead+contingency;
  const markup=totalCost*(+p.markupPct||0)/100;
  const bidExTax=totalCost+markup;
  const tax=bidExTax*(+p.taxPct||0)/100;
  const bidValue=bidExTax+tax;
  const profit=markup;                       // profit = markup amount (bid ex-tax − total cost)
  const margin=bidExTax? profit/bidExTax*100 : 0;   // margin on selling price (ex-tax)
  return {direct,overhead,contingency,totalCost,markup,bidExTax,tax,bidValue,profit,margin, matCost:cat.mat, labCost:cat.lab, subEqpCost:cat.subEqp};
}

/* ---------- view state ---------- */
let tView='dashboard', curTenderId=null, tTab='overview';
const curTender=()=>TDR.tenders.find(t=>t.id===curTenderId);
function goTender(v){ tView=v; renderView(); window.scrollTo(0,0); }
function openTender(id){ curTenderId=id; tView='workspace'; tTab='overview'; renderView(); window.scrollTo(0,0); }
function setTTab(t){ tTab=t; renderView(); window.scrollTo(0,0); }
function statusBadge(s){ const c=T_STATUS_COLORS[s]||['#475569','#e2e8f0']; return `<span class="t-badge" style="color:${c[0]};background:${c[1]}">${esc(s)}</span>`; }

/* ============================================================ router ============================================================ */
function tenderHTML(){
  if(tView==='workspace' && curTender()) return tenderWorkspace();
  if(tView!=='list') return tenderDashboard();   // hero dashboard is self-contained
  const tab=(v,l)=>`<button class="seg-btn ${tView===v?'on':''}" onclick="goTender('${v}')">${l}</button>`;
  const head=`<div class="page-top" style="display:flex;align-items:flex-end;justify-content:space-between;flex-wrap:wrap;gap:12px">
      <div><h1>Tendering &amp; Bidding</h1><p>Opportunities, estimation &amp; bids — a won tender auto-initializes a full project.</p></div>
      <div style="display:flex;gap:8px;align-items:center"><div class="seg">${tab('dashboard','Dashboard')}${tab('list','All Tenders')}</div>
      <button class="btn" onclick="openCreateTender()">${svg(IC.plus)} Create New Tender</button></div></div>`;
  return head + tenderList();
}

/* ============================================================ dashboard ============================================================ */
/* icons + sparkline for the hero dashboard */
const TBI={
  file:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
  pencil:'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  hourglass:'<path d="M6 2h12M6 22h12M8 2c0 4 3 5 4 7 1-2 4-3 4-7M8 22c0-4 3-5 4-7 1 2 4 3 4 7"/>',
  send:'<path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4 20-7z"/>',
  handshake:'<path d="M8 11V7a2 2 0 1 1 4 0v4M12 11V5a2 2 0 1 1 4 0v6M16 11V8a2 2 0 1 1 4 0v5a7 7 0 0 1-7 7h-1a6 6 0 0 1-4.3-1.8L3 16"/>',
  trophy:'<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 15v2c0 .6-.5 1-1 1.2C7.9 18.8 7 20.2 7 22M14 15v2c0 .6.5 1 1 1.2 1.1.6 2 2 2 2.8M18 2H6v7a6 6 0 0 0 12 0z"/>',
  xcircle:'<circle cx="12" cy="12" r="9"/><path d="m15 9-6 6M9 9l6 6"/>',
  play:'<polygon points="7 4 20 12 7 20 7 4"/>',
  target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
  coins:'<circle cx="9" cy="9" r="6"/><path d="M18 10.3A6 6 0 1 1 11 18M7 7h1.5v4M15.5 14l.6.6-2.3 2.3"/>',
  bars:'<path d="M3 3v18h18"/><rect x="7" y="12" width="3" height="6" rx="1"/><rect x="12" y="8" width="3" height="10" rx="1"/><rect x="17" y="5" width="3" height="13" rx="1"/>',
  arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>',
  arrowUR:'<path d="M7 17 17 7M8 7h9v9"/>'
};
function tbSpark(){ const hs=[26,42,32,54,46,68,90]; return `<svg class="tb-spk" viewBox="0 0 78 36" preserveAspectRatio="none">${hs.map((h,i)=>`<rect x="${i*11}" y="${36-h/100*36}" width="7" height="${h/100*36}" rx="1.5" opacity="${(0.32+i*0.1).toFixed(2)}"/>`).join('')}</svg>`; }
const TB_HERO_IMG='https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1300&q=70';
/* period toggle for the dashboard (affects the trend chart window) */
let tbPeriod=6;
function setTbPeriod(n){ tbPeriod=n; renderView(); }
function tbFirstName(){ const u=COMPANY.user||'there'; const m=u.replace(/^[A-Z]\.\s*/,'').trim(); return (m||u).split(/\s+/).pop(); }
const TB_MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
// SVG bar chart of submitted bid value (₹ Cr) by month over the last n months
function tbBarChart(months){
  const W=540,H=200,padL=30,padB=26,padT=10,padR=6; const iw=W-padL-padR, ih=H-padB-padT;
  const max=Math.max(1,...months.map(m=>m.value)); const nice=tbNiceMax(max);
  const n=months.length, slot=iw/n, bw=Math.min(40,slot*0.5);
  const ticks=4; let grid='',labels='';
  for(let i=0;i<=ticks;i++){ const v=nice/ticks*i; const y=padT+ih-(v/nice)*ih;
    grid+=`<line x1="${padL}" y1="${y.toFixed(1)}" x2="${W-padR}" y2="${y.toFixed(1)}" stroke="var(--line2)" stroke-width="1"/>`;
    labels+=`<text x="${padL-6}" y="${(y+3).toFixed(1)}" text-anchor="end" class="tb-ax">${(+v.toFixed(v<10?1:0))}</text>`; }
  const bars=months.map((m,i)=>{ const x=padL+slot*i+(slot-bw)/2; const h=(m.value/nice)*ih; const y=padT+ih-h;
    return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(0,h).toFixed(1)}" rx="3" fill="var(--blue)"><title>${m.label}: ₹${m.value} Cr</title></rect>`
      +`<text x="${(x+bw/2).toFixed(1)}" y="${H-8}" text-anchor="middle" class="tb-ax">${m.label}</text>`; }).join('');
  return `<svg viewBox="0 0 ${W} ${H}" class="tb-chart" preserveAspectRatio="xMidYMid meet">${grid}${labels}${bars}</svg>`;
}
function tbNiceMax(v){ if(v<=0) return 1; const p=Math.pow(10,Math.floor(Math.log10(v))); const n=v/p; const s=n<=1?1:n<=2?2:n<=2.5?2.5:n<=5?5:10; return s*p; }
// SVG donut from segments [{label,value,color}]
function tbDonut(segs,total){
  const r=52,sw=18,cx=70,cy=70,C=2*Math.PI*r; let off=0;
  const arcs=segs.filter(s=>s.value>0).map(s=>{ const len=(s.value/total)*C; const el=`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${s.color}" stroke-width="${sw}" stroke-dasharray="${len.toFixed(2)} ${(C-len).toFixed(2)}" stroke-dashoffset="${(-off).toFixed(2)}" transform="rotate(-90 ${cx} ${cy})"/>`; off+=len; return el; }).join('');
  return `<svg viewBox="0 0 140 140" class="tb-donut-svg">${arcs}<text x="70" y="66" text-anchor="middle" class="tb-donut-n">${total}</text><text x="70" y="84" text-anchor="middle" class="tb-donut-l">Total Tenders</text></svg>`;
}
function d3Trend(cur,prev){ if(!cur&&!prev) return `<span class="d3-tr flat">— <small>vs last month</small></span>`; const up=cur>=prev; const pct=prev?Math.round((cur-prev)/prev*100):100; return `<span class="d3-tr ${up?'up':'dn'}">${up?'↑':'↓'} ${Math.abs(pct)}% <small>vs last month</small></span>`; }
function d3TimeAgo(iso){ const s=(Date.now()-new Date(iso))/1000; if(s<0) return 'just now'; if(s<3600) return Math.max(1,Math.round(s/60))+'m ago'; if(s<86400) return Math.round(s/3600)+'h ago'; const d=Math.round(s/86400); return d<30?d+'d ago':Math.round(d/30)+'mo ago'; }
function d3ActLabel(h){ if(h.to==='Submitted') return 'Tender submitted'; if(h.to==='Won') return 'Tender won'; if(h.to==='Lost') return 'Tender lost'; if(h.from==='') return 'Tender created'; return 'Moved to '+h.to; }
const D3_BANNER_IMG='https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1400&q=70';
function tenderDashboard(){
  const ts=TDR.tenders.filter(t=>!t.archived);
  const by=s=>ts.filter(t=>t.status===s).length;
  const estimating=ts.filter(t=>['Under Review','Estimation in Progress'].includes(t.status)).length;
  const submittedVal=ts.filter(t=>t.submittedValue).reduce((s,t)=>s+(+t.submittedValue||0),0);
  const awardedVal=ts.filter(t=>t.status==='Won').reduce((s,t)=>s+(+t.acceptedValue||0),0);
  const won=by('Won'), lost=by('Lost'); const decided=won+lost; const winRate=decided?Math.round(won/decided*100):0;
  const openCount=ts.filter(t=>!['Won','Lost','Withdrawn'].includes(t.status)).length;
  const upcoming=ts.filter(t=>t.deadline && !['Won','Lost','Withdrawn'].includes(t.status))
    .sort((a,b)=>(a.deadline||'').localeCompare(b.deadline||'')).slice(0,5);
  const daysTo=d=>{ const ms=new Date(d)-new Date(nowDate()); return Math.round(ms/864e5); };
  // trend: submitted bid value (₹ Cr) by month over the selected window, ending this month
  const now=new Date(nowDate()); const months=[];
  for(let i=tbPeriod-1;i>=0;i--){ const dt=new Date(now.getFullYear(),now.getMonth()-i,1); const key=dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0');
    const val=ts.filter(t=>(t.submittedDate||'').slice(0,7)===key).reduce((s,t)=>s+(+t.submittedValue||0),0)
            + ts.filter(t=>!t.submittedDate && (t.receivedDate||'').slice(0,7)===key).reduce((s,t)=>s+(+t.estValue||0),0);
    months.push({label:TB_MON[dt.getMonth()], value:+(val/1e7).toFixed(2)}); }
  // donut: status mix
  const donutDefs=[['Draft',by('Draft'),'#1e3a8a'],['Under Estimation',estimating,'#1d4ed8'],['Pending Approval',by('Awaiting Approval'),'#2563eb'],['Approved',by('Approved for Submission'),'#3b82f6'],['Submitted',by('Submitted'),'#60a5fa'],['In Negotiation',by('Under Negotiation'),'#93c5fd'],['Won',won,'#16a34a'],['Lost',lost,'#bfdbfe']].filter(d=>d[1]>0);
  const donutTotal=donutDefs.reduce((s,d)=>s+d[1],0)||1;
  const totT=ts.length||1;
  const kpi=(cls,icon,label,v)=>{ const pct=Math.round((label==='Total Tenders'?totT:v)/totT*100); return `<div class="k2 ${cls}">
    <div class="k2-head"><span class="k2-ic">${svg(icon)}</span><span class="k2-pct">${pct}%</span></div>
    <div class="k2-num">${v}</div><div class="k2-lab">${label}</div>
    <div class="k2-bar"><span style="width:${Math.max(4,pct)}%"></span></div></div>`; };
  const now2=new Date(); const wd=['SUN','MON','TUE','WED','THU','FRI','SAT'][now2.getDay()];
  const perBtn=(n,l)=>`<button class="db-per ${tbPeriod===n?'on':''}" onclick="setTbPeriod(${n})">${l}</button>`;
  // month keys for trend
  const pad=n=>String(n).padStart(2,'0'); const mk=(y,m)=>y+'-'+pad(m+1);
  const thisKey=mk(now.getFullYear(),now.getMonth()); const lmd=new Date(now.getFullYear(),now.getMonth()-1,1); const lastKey=mk(lmd.getFullYear(),lmd.getMonth());
  const mcount=(filt,key)=>ts.filter(t=>filt(t)&&(t.receivedDate||'').slice(0,7)===key).length;
  const metrics=[
    ['Total Tenders',TBI.file,ts.length,()=>true,'all'],
    ['Draft',TBI.pencil,by('Draft'),t=>t.status==='Draft','Draft'],
    ['Under Estimation',TBI.clock,estimating,t=>['Under Review','Estimation in Progress'].includes(t.status),'Under Estimation'],
    ['Pending Approval',TBI.hourglass,by('Awaiting Approval'),t=>t.status==='Awaiting Approval','Pending Approval'],
    ['Submitted',TBI.send,by('Submitted'),t=>t.status==='Submitted','Submitted'],
    ['In Negotiation',TBI.handshake,by('Under Negotiation'),t=>t.status==='Under Negotiation','Under Negotiation'],
    ['Won',TBI.trophy,won,t=>t.status==='Won','Won'],
    ['Lost',TBI.xcircle,lost,t=>t.status==='Lost','Lost'] ];
  // pipeline trend: this window vs previous window
  const monthVal=key=>ts.filter(t=>(t.submittedDate||'').slice(0,7)===key).reduce((s,t)=>s+(+t.submittedValue||0),0)+ts.filter(t=>!t.submittedDate&&(t.receivedDate||'').slice(0,7)===key).reduce((s,t)=>s+(+t.estValue||0),0);
  let curWin=0,prevWin=0;
  for(let i=0;i<tbPeriod;i++){ const dt=new Date(now.getFullYear(),now.getMonth()-i,1); curWin+=monthVal(mk(dt.getFullYear(),dt.getMonth())); }
  for(let i=tbPeriod;i<2*tbPeriod;i++){ const dt=new Date(now.getFullYear(),now.getMonth()-i,1); prevWin+=monthVal(mk(dt.getFullYear(),dt.getMonth())); }
  const pipePct=prevWin?Math.round((curWin-prevWin)/prevWin*100):(curWin?100:0); const pipeUp=curWin>=prevWin;
  // recent activity from tender histories
  const acts=[]; ts.forEach(t=>(t.history||[]).forEach(h=>acts.push({name:t.name,h}))); acts.sort((a,b)=>(b.h.at||'').localeCompare(a.h.at||''));
  const actIcon=to=>to==='Submitted'?TBI.send:to==='Won'?TBI.trophy:to==='Lost'?TBI.xcircle:to==='Awaiting Approval'?TBI.hourglass:TBI.file;
  return `
  <div class="d3-hero">
    <div class="d3-hero-txt">
      <div class="d3-eyebrow">Tendering &amp; Bidding <span class="d3-eb-rule"></span></div>
      <h1 class="d3-h1">Opportunities<br>Today.<br><span>Projects<br>Tomorrow.</span></h1>
      <p class="d3-sub">Track opportunities, create estimates and submit bids — all in one place.</p>
      <div class="d3-cta-row">
        <button class="tb-cta" onclick="openCreateTender()">${svg(IC.plus)} Create New Tender ${svg(TBI.arrow)}</button>
        <button class="tb-how" onclick="goTender('list')"><span class="tb-play">${svg(TBI.play)}</span><span><b>How it works</b><small>Browse all tenders</small></span></button>
      </div>
    </div>
    <div class="d3-media">
      <div class="d3-media-photo" style="background-image:url('${TB_HERO_IMG}')"></div>
      <div class="d3-media-panel"><span class="d3-mp-no">/ 01</span><span class="d3-mp-w">PLAN<br>BID<br>BUILD<br>GROW</span><span class="d3-mp-ar">${svg(TBI.arrowUR)}</span></div>
    </div>
    <div class="d3-rail">
      <div class="d3-date"><span class="d3-wd">${wd}</span><b class="d3-day">${now2.getDate()}</b><span class="d3-mon">${TB_MON[now2.getMonth()].toUpperCase()} ${now2.getFullYear()}</span><small>Dashboard Overview</small></div>
      <div class="db-per-group d3-per-g">${perBtn(1,'This Month')}${perBtn(3,'Last 3 Months')}${perBtn(6,'Last 6 Months')}</div>
    </div>
  </div>

  <div class="d3-strip">
    ${metrics.map(m=>`<div class="d3-metric drill" onclick="tGoList('${m[4]}')" title="View ${esc(m[0])}">
      <div class="d3-m-top"><span class="d3-m-num">${m[2]}</span><span class="d3-m-ic">${svg(m[1])}</span></div>
      <div class="d3-m-lab">${m[0]}</div>${d3Trend(mcount(m[3],thisKey),mcount(m[3],lastKey))}</div>`).join('')}
  </div>

  <div class="d3-main">
    <div class="d3-left">
      <div class="d3-charts">
        <div class="panel db-card">
          <div class="db-ch"><div><div class="db-ch-t"><span class="db-no sm">02</span><span class="db-rule sm"></span>Bid pipeline value</div><div class="db-ch-s">Total submitted bid value and conversion trend.</div></div>
            <div class="tb-pl-sel">Last ${tbPeriod} months ${svg(IC.chev)}</div></div>
          <div class="d3-pl-figure"><div class="db-pl-big">${jcMoney(submittedVal)}</div><div class="d3-pl-trend ${pipeUp?'up':'dn'}">${pipeUp?'↑':'↓'} ${Math.abs(pipePct)}% <small>vs last ${tbPeriod} months</small></div></div>
          ${tbBarChart(months)}
        </div>
        <div class="panel db-card">
          <div class="db-ch"><div><div class="db-ch-t"><span class="db-no sm">03</span><span class="db-rule sm"></span>Bids by stage</div><div class="db-ch-s">Share of tenders across the pipeline.</div></div></div>
          <div class="d3-donut-row">${tbDonut(donutDefs.map(d=>({label:d[0],value:d[1],color:d[2]})),donutTotal)}
            <div class="db-legend">${donutDefs.map(d=>`<div><span class="db-dot" style="background:${d[2]}"></span>${d[0]}<b>${Math.round(d[1]/donutTotal*100)}%</b></div>`).join('')}</div></div>
        </div>
      </div>
      <div class="d3-banner" style="background-image:linear-gradient(90deg,rgba(15,23,41,.94),rgba(15,23,41,.3)),url('${D3_BANNER_IMG}')" onclick="goTender('list')">
        <div class="d3-ban-l"><span class="d3-ban-no">04</span><div class="d3-ban-t">Open opportunities</div><div class="d3-ban-n">${openCount}</div><div class="d3-ban-s">Tenders currently in pipeline</div></div>
        <span class="d3-ban-ar">${svg(IC.arrow)}</span>
      </div>
    </div>
    <div class="d3-right">
      <div class="panel db-card">
        <div class="db-ch"><div class="db-ch-t">Upcoming submission deadlines</div><a class="tb-viewall" onclick="goTender('list')">View all ${svg(TBI.arrow)}</a></div>
        <div class="d3-dl-list">${upcoming.length?upcoming.map(t=>{ const d=daysTo(t.deadline); const dt=new Date(t.deadline); return `<div class="d3-dl drill" onclick="openTender('${t.id}')">
          <div class="d3-datechip"><span>${TB_MON[dt.getMonth()].toUpperCase()}</span><b>${dt.getDate()}</b></div>
          <div class="d3-dl-mid"><div class="d3-dl-name">${esc(t.name)}</div><div class="d3-dl-client">${esc(t.client||'')}</div></div>
          <div class="d3-dl-right"><div class="d3-dl-days ${d<0?'t-over':d<=5?'t-soon':''}">${d<0?(-d)+'d':d+'d'}</div>${statusBadge(t.status)}</div></div>`;}).join(''):'<div class="jc-hint" style="padding:16px 20px">No open deadlines.</div>'}</div>
      </div>
      <div class="panel db-card">
        <div class="db-ch"><div class="db-ch-t">Recent activity</div><a class="tb-viewall" onclick="goTender('list')">View all ${svg(TBI.arrow)}</a></div>
        <div class="d3-act-list">${acts.length?acts.slice(0,5).map(a=>`<div class="d3-act"><span class="d3-act-ic">${svg(actIcon(a.h.to))}</span><div class="d3-act-mid"><div class="d3-act-t">${esc(d3ActLabel(a.h))}</div><div class="d3-act-s">${esc(a.name)}</div></div><span class="d3-act-time">${d3TimeAgo(a.h.at)}</span></div>`).join(''):'<div class="jc-hint" style="padding:16px 20px">No recent activity.</div>'}</div>
      </div>
    </div>
  </div>`;
}

/* ============================================================ register / list ============================================================ */
let tListQ='', tListStatus='all';
// jump from a dashboard metric into the filtered register
function tGoList(f){ tListStatus=f||'all'; tListQ=''; tView='list'; renderView(); window.scrollTo(0,0); }
function tenderList(){
  let ts=TDR.tenders.filter(t=>!t.archived);
  if(tListStatus==='Under Estimation') ts=ts.filter(t=>['Under Review','Estimation in Progress'].includes(t.status));
  else if(tListStatus==='Pending Approval') ts=ts.filter(t=>t.status==='Awaiting Approval');
  else if(tListStatus!=='all') ts=ts.filter(t=>t.status===tListStatus);
  const q=tListQ.trim().toLowerCase();
  if(q) ts=ts.filter(t=>[t.id,t.name,t.client,t.owner].some(x=>String(x||'').toLowerCase().includes(q)));
  const opts=['all','Draft','Under Estimation','Pending Approval','Submitted','Under Negotiation','Won','Lost','Withdrawn','Approved for Submission'].map(s=>`<option value="${s}" ${tListStatus===s?'selected':''}>${s==='all'?'All statuses':s}</option>`).join('');
  const rows=ts.map(t=>{ const c=tCostBreak(t); return `<tr class="drill" onclick="openTender('${t.id}')">
    <td class="c">${esc(t.id)}</td><td><b>${esc(t.name)}</b></td><td>${esc(t.client||'—')}</td><td>${esc(t.owner||'—')}</td>
    <td>${esc(t.deadline||'—')}</td><td class="r">${t.estValue?jcMoney(t.estValue):'—'}</td><td class="r">${c.bidValue?jcMoney(c.bidValue):'—'}</td>
    <td>${statusBadge(t.status)}</td><td>${t.projectId?`<button class="btn ghost sm" onclick="event.stopPropagation();openProjectFromTender('${t.id}')">Open project →</button>`:''}</td></tr>`;}).join('')
    ||`<tr class="empty-row"><td colspan="9">No tenders match. Click “Create New Tender”.</td></tr>`;
  return `<div class="panel">
    <div class="inv-head"><h2>Tender Register</h2>
      <div style="margin-left:auto;display:flex;gap:8px;align-items:center">
        <select class="f" style="width:auto;padding:7px 10px" onchange="tListStatus=this.value;renderView()">${opts}</select>
        <div class="f-search" style="margin:0"><span>${svg(IC.search)}</span><input class="f" id="t-search" placeholder="Search id, name, client, owner…" value="${esc(tListQ)}" style="padding-left:34px"></div>
      </div></div>
    <div class="tbl-scroll"><table class="jc-tbl"><thead><tr><th>ID</th><th>Tender</th><th>Client</th><th>Owner</th><th>Deadline</th><th class="r">Est. value</th><th class="r">Bid value</th><th>Status</th><th></th></tr></thead>
    <tbody>${rows}</tbody></table></div></div>`;
}
function bindTender(){ const s=document.getElementById('t-search'); if(s) s.oninput=()=>{ tListQ=s.value; const ts=TDR.tenders; renderTenderRowsOnly(); }; }
function renderTenderRowsOnly(){ const el=document.getElementById('app'); el.innerHTML=tenderHTML(); const s=document.getElementById('t-search'); if(s){ s.focus(); s.setSelectionRange(s.value.length,s.value.length); bindTender(); } }

/* ============================================================ create tender ============================================================ */
function openCreateTender(){
  openModal(`<div class="modal wide">${mh('',IC.tenders,'Create New Tender','Logs an opportunity — save as Draft and complete details later')}
    <div class="m-body"><div class="grid2">
      <div class="fld"><label>Tender ID</label><input class="f" id="nt-id" value="${tNextId()}" readonly></div>
      <div class="fld"><label>Tender / opportunity name <span class="req">*</span></label><input class="f" id="nt-name" placeholder="e.g. Harbour View Towers — Civil"></div>
      <div class="fld"><label>Client name <span class="req">*</span></label><input class="f" id="nt-client"></div>
      <div class="fld"><label>Client reference no.</label><input class="f" id="nt-ref"></div>
      <div class="fld col2"><label>Client contact details</label><input class="f" id="nt-contact" placeholder="email · phone"></div>
      <div class="fld col2"><label>Project description</label><input class="f" id="nt-desc"></div>
      <div class="fld"><label>Tender received date <span class="req">*</span></label><input class="f" id="nt-recv" type="date" value="${nowDate()}"></div>
      <div class="fld"><label>Bid submission deadline <span class="req">*</span></label><input class="f" id="nt-deadline" type="date"></div>
      <div class="fld"><label>Bid owner / responsible</label><input class="f" id="nt-owner" value="${esc(COMPANY.user)}"></div>
      <div class="fld"><label>Tender type</label><input class="f" id="nt-type" placeholder="Open / Limited / Lump sum…"></div>
      <div class="fld"><label>Estimated contract value (₹)</label><input class="f" id="nt-est" type="number" step="any"></div>
      <div class="fld"><label>Initial status</label><select class="f" id="nt-status"><option>Draft</option><option>Under Review</option><option>Estimation in Progress</option></select></div>
      <div class="fld col2"><label>Project site address</label><input class="f" id="nt-addr"></div>
      <div class="fld"><label>Expected start date</label><input class="f" id="nt-start" type="date"></div>
      <div class="fld"><label>Expected completion</label><input class="f" id="nt-finish" type="date"></div>
      <div class="fld col2"><label>Special conditions</label><input class="f" id="nt-cond"></div>
      <div class="fld col2"><label>Notes / internal remarks</label><input class="f" id="nt-notes"></div>
    </div><div class="hint">${svg(IC.tenders)}<div>Required: name, client, received date, deadline. The tender opens a workspace for BOQ, estimation, quotations, pricing, approval and — once won — one-click project creation.</div></div></div>
    <div class="m-foot"><button class="btn ghost" onclick="closeModal()">Cancel</button><button class="btn" onclick="submitCreateTender()">Create tender</button></div></div>`);
}
function submitCreateTender(){
  const name=val('nt-name'), client=val('nt-client'), recv=val('nt-recv'), deadline=val('nt-deadline');
  if(!name||!client||!recv||!deadline) return toast('Name, client, received date & deadline are required');
  const id=tNextId();
  if(TDR.tenders.some(t=>t.id===id)) return toast('Duplicate tender ID — please retry');
  const status=val('nt-status')||'Draft';
  TDR.tenders.push({ id, name, client, clientContact:val('nt-contact'), clientRef:val('nt-ref'), desc:val('nt-desc'),
    receivedDate:recv, deadline, owner:val('nt-owner')||COMPANY.user, status,
    estValue:parseFloat(val('nt-est'))||0, siteAddress:val('nt-addr'), expStart:val('nt-start'), expFinish:val('nt-finish'),
    tenderType:val('nt-type'), specialConditions:val('nt-cond'), notes:val('nt-notes'),
    boq:[], quotes:[], pricing:{overheadPct:7, contingencyPct:3, markupPct:12, taxPct:18},
    versions:[], submittedValue:null, submittedDate:null, docs:[], approvals:[],
    history:[{at:new Date().toISOString(), by:COMPANY.user, from:'', to:status, note:'Tender created'}],
    projectId:null, jobCode:null, awardDate:null, acceptedValue:null, archived:false });
  tAudit(id,'create-tender', id+' — '+name); tSave();
  closeModal(); toast('Tender '+id+' created'); openTender(id);
}

/* ============================================================ workspace ============================================================ */
function tenderWorkspace(){
  const t=curTender(); if(!t) return tenderList();
  const c=tCostBreak(t);
  const tabs=[['overview','Overview'],['boq','BOQ & Cost Estimation'],['rates','Historical Rates'],['quotes','Vendor Quotations'],['pricing','Bid Pricing & Profitability'],['approval','Approval & Submission'],['docs','Documents'],['history','Activity History']];
  let body='';
  if(tTab==='overview') body=twOverview(t,c);
  else if(tTab==='boq') body=twBoq(t,c);
  else if(tTab==='rates') body=twRates(t);
  else if(tTab==='quotes') body=twQuotes(t);
  else if(tTab==='pricing') body=twPricing(t,c);
  else if(tTab==='approval') body=twApproval(t,c);
  else if(tTab==='docs') body=twDocs(t);
  else if(tTab==='history') body=twHistory(t);
  const canConvert=['Submitted','Under Negotiation'].includes(t.status) && !t.projectId;
  const actions=`<div style="display:flex;gap:8px;flex-wrap:wrap">
    ${t.projectId?`<button class="btn" onclick="openProjectFromTender('${t.id}')">${svg(IC.arrow)} Open Project ${esc(t.jobCode||'')}</button>`:''}
    ${canConvert?`<button class="btn" style="background:var(--green)" onclick="openConvert('${t.id}')">${svg(IC.check)} Mark as Won / Convert to Project</button>`:''}
    ${(T_TRANSITIONS[t.status]||[]).length?`<button class="btn ghost" onclick="openStatus('${t.id}')">${svg(IC.flag)} ${t.status==='Lost'||t.status==='Withdrawn'?'Reopen':'Update Status'}</button>`:''}
    <button class="btn ghost" onclick="openEditTender('${t.id}')">${svg(IC.edit)} Edit</button></div>`;
  return `
  <div class="t-ws-top">
    <button class="t-back" onclick="goTender('list')">${svg(IC.drill)} All Tenders</button>
    <div class="t-ws-head">
      <div><div class="t-ws-name">${esc(t.name)} ${statusBadge(t.status)}</div>
        <div class="t-ws-sub"><span class="tag">${esc(t.id)}</span> ${esc(t.client||'')} ${t.clientRef?'· Ref '+esc(t.clientRef):''} ${t.projectId?'· <b style="color:var(--green)">Project '+esc(t.jobCode)+'</b>':''}</div></div>
      ${actions}
    </div>
    <div class="t-ws-meta">
      <span><b>Deadline</b> ${esc(t.deadline||'—')}</span><span><b>Owner</b> ${esc(t.owner||'—')}</span>
      <span><b>Est. value</b> ${t.estValue?jcMoney(t.estValue):'—'}</span><span><b>Est. cost</b> ${jcMoney(c.totalCost)}</span>
      <span><b>Bid value</b> ${jcMoney(c.bidValue)}</span><span><b>Exp. margin</b> ${c.margin.toFixed(1)}%</span>
    </div>
  </div>
  <div class="seg t-seg">${tabs.map(x=>`<button class="seg-btn ${tTab===x[0]?'on':''}" onclick="setTTab('${x[0]}')">${x[1]}</button>`).join('')}</div>
  <div style="margin-top:14px">${body}</div>`;
}

function twOverview(t,c){
  const row=(l,v)=>`<div class="t-ov"><span>${l}</span><b>${v||'—'}</b></div>`;
  return `<div class="t-ov-grid">
    <div class="panel"><div class="inv-head"><h2>Tender details</h2></div><div style="padding:14px 20px">
      ${row('Description',esc(t.desc))}${row('Client contact',esc(t.clientContact))}${row('Site address',esc(t.siteAddress))}
      ${row('Tender type',esc(t.tenderType))}${row('Received',esc(t.receivedDate))}${row('Deadline',esc(t.deadline))}
      ${row('Expected start',esc(t.expStart))}${row('Expected completion',esc(t.expFinish))}
      ${row('Special conditions',esc(t.specialConditions))}${row('Notes',esc(t.notes))}
    </div></div>
    <div class="panel"><div class="inv-head"><h2>Estimate &amp; bid summary</h2></div><div style="padding:14px 20px">
      ${row('BOQ lines',(t.boq||[]).length)}
      ${row('Materials',jcMoney(c.matCost))}${row('Labour',jcMoney(c.labCost))}${row('Subcontracting &amp; equipment',jcMoney(c.subEqpCost))}
      ${row('Estimated direct cost',jcMoney(c.direct))}${row('Allocated overheads',jcMoney(c.overhead))}
      ${row('Contingency',jcMoney(c.contingency))}${row('Estimated total cost',jcMoney(c.totalCost))}
      ${row('Target profit',jcMoney(c.markup))}${row('Tender price before taxes',jcMoney(c.bidExTax))}
      ${row('Applicable taxes',jcMoney(c.tax))}${row('Proposed bid value',jcMoney(c.bidValue))}
      ${row('Expected margin',c.margin.toFixed(1)+'%')}
      ${t.submittedValue?row('Submitted bid',jcMoney(t.submittedValue)+' · '+esc(t.submittedDate||'')):''}
      ${t.acceptedValue?row('Accepted contract value',jcMoney(t.acceptedValue)):''}
    </div></div></div>`;
}

/* ---------- BOQ & estimation ---------- */
function twBoq(t,c){
  const rows=(t.boq||[]).map(b=>`<tr>
    <td class="c">${esc(b.itemNo)}</td><td><b>${esc(b.desc)}</b></td><td class="c">${esc(b.code||'—')}</td><td>${esc(b.unit||'')}</td>
    <td class="r">${jcNum(b.qty)}</td><td class="r">${jcNum(b.matRate)}</td><td class="r">${jcNum(b.labRate)}</td><td class="r">${jcNum(b.subRate)}</td><td class="r">${jcNum(b.eqpRate)}</td><td class="r">${jcNum(b.otherRate)}</td>
    <td class="r b">${jcNum(tLineRate(b))}</td><td class="r b">${jcMoney(tLineAmt(b))}</td>
    <td><div class="jc-row-acts"><button title="Edit" onclick="openTBoq('${t.id}','${b.id}')">${svg(IC.edit)}</button><button title="Remove" onclick="delTBoq('${t.id}','${b.id}')">${svg(IC.trash)}</button></div></td></tr>`).join('')
    ||`<tr class="empty-row"><td colspan="13">No BOQ items yet — add items, start from standard work items, or import from Excel.</td></tr>`;
  const locked=t.status==='Won';   // only an awarded tender's BOQ is frozen (it is the project's baseline)
  return `<div class="panel">
    <div class="inv-head"><h2>BOQ &amp; Cost Estimation</h2>
      <div style="margin-left:auto;display:flex;gap:8px;flex-wrap:wrap">${locked?'<span class="jc-hint" style="padding:6px 10px">Awarded — baseline frozen in the project</span>':`<button class="btn ghost sm" onclick="addStandardItems('${t.id}')">${svg(IC.plus)} Standard work items</button><button class="btn ghost sm" onclick="openImportBoq('${t.id}')">${svg(IC.in)} Import from Excel</button><button class="btn sm" onclick="openTBoq('${t.id}')">${svg(IC.plus)} Add BOQ Item</button>`}<button class="btn ghost sm" onclick="exportTBoq('${t.id}')">Export CSV</button></div></div>
    <div class="tbl-scroll"><table class="jc-tbl"><thead><tr><th>Item</th><th>Description</th><th>Code</th><th>Unit</th><th class="r">Qty</th><th class="r">Material</th><th class="r">Labour</th><th class="r">Sub</th><th class="r">Equip</th><th class="r">Other</th><th class="r">Unit rate</th><th class="r">Amount</th><th></th></tr></thead>
    <tbody>${rows}</tbody>
    <tfoot><tr class="tot"><td colspan="11" class="r">Total estimated direct cost</td><td class="r b">${jcMoney(c.direct)}</td><td></td></tr></tfoot></table></div>
    <div class="jc-hint" style="padding:12px 20px">${svg(IC.jobcost)} Rates follow the JCR/JCL cost structure. Unit rate = Material + Labour + Sub + Equipment + Other. This estimate becomes the project's budget baseline on award.</div></div>`;
}
function openTBoq(tid,bid){
  const t=TDR.tenders.find(x=>x.id===tid); const b=bid?(t.boq||[]).find(x=>x.id===bid):null;
  const ccOpts=`<option value="">— cost code —</option>`+(jcr.costCodes||[]).map(c=>`<option value="${c.code}" ${b&&b.code===c.code?'selected':''}>${c.code} — ${esc(c.desc)}</option>`).join('');
  openModal(`<div class="modal wide">${mh('',IC.jobcost,(b?'Edit':'Add')+' BOQ Item','Per-line rates build up the unit rate & amount')}
    <div class="m-body"><div class="grid2">
      <div class="fld"><label>Item no.</label><input class="f" id="tb-no" value="${b?esc(b.itemNo):String((t.boq||[]).length+1)}"></div>
      <div class="fld"><label>Cost code</label><select class="f" id="tb-code" onchange="tbCodeDesc()">${ccOpts}</select></div>
      <div class="fld col2"><label>Description of work <span class="req">*</span></label><input class="f" id="tb-desc" value="${b?esc(b.desc):''}"></div>
      <div class="fld"><label>Unit</label><input class="f" id="tb-unit" value="${b?esc(b.unit||''):''}" placeholder="Cum, Sqm, Nos"></div>
      <div class="fld"><label>Estimated quantity <span class="req">*</span></label><input class="f" id="tb-qty" type="number" step="any" value="${b?b.qty:''}" oninput="tbPreview()"></div>
      <div class="fld"><label>Material rate</label><input class="f" id="tb-mat" type="number" step="any" value="${b?b.matRate:''}" oninput="tbPreview()"></div>
      <div class="fld"><label>Labour rate</label><input class="f" id="tb-lab" type="number" step="any" value="${b?b.labRate:''}" oninput="tbPreview()"></div>
      <div class="fld"><label>Subcontractor rate</label><input class="f" id="tb-sub" type="number" step="any" value="${b?b.subRate:''}" oninput="tbPreview()"></div>
      <div class="fld"><label>Equipment / hire rate</label><input class="f" id="tb-eqp" type="number" step="any" value="${b?b.eqpRate:''}" oninput="tbPreview()"></div>
      <div class="fld"><label>Other direct rate</label><input class="f" id="tb-oth" type="number" step="any" value="${b?b.otherRate:''}" oninput="tbPreview()"></div>
    </div><div class="hint">${svg(IC.jobcost)}<div>Unit rate <b id="tb-rate">₹0</b> · Line amount <b id="tb-amt">₹0</b></div></div></div>
    <div class="m-foot"><button class="btn ghost" onclick="closeModal()">Cancel</button><button class="btn" onclick="submitTBoq('${tid}','${bid||''}')">${b?'Save':'Add item'}</button></div></div>`);
  tbPreview();
}
function tbCodeDesc(){ const sel=document.getElementById('tb-code'); const d=document.getElementById('tb-desc'); if(sel&&d&&!d.value){ const c=(jcr.costCodes||[]).find(x=>x.code===sel.value); if(c) d.value=c.desc; } }
function tbPreview(){ const g=id=>parseFloat(val(id))||0; const rate=g('tb-mat')+g('tb-lab')+g('tb-sub')+g('tb-eqp')+g('tb-oth'); const amt=g('tb-qty')*rate; const r=document.getElementById('tb-rate'),a=document.getElementById('tb-amt'); if(r)r.textContent=jcMoney(rate); if(a)a.textContent=jcMoney(amt); }
function submitTBoq(tid,bid){
  const t=TDR.tenders.find(x=>x.id===tid); if(!t) return;
  const desc=val('tb-desc'), qty=parseFloat(val('tb-qty'))||0; if(!desc||qty<=0) return toast('Description and a quantity are required');
  const rec={ itemNo:val('tb-no'), desc, code:val('tb-code'), unit:val('tb-unit'),
    qty, matRate:parseFloat(val('tb-mat'))||0, labRate:parseFloat(val('tb-lab'))||0, subRate:parseFloat(val('tb-sub'))||0, eqpRate:parseFloat(val('tb-eqp'))||0, otherRate:parseFloat(val('tb-oth'))||0 };
  if(bid){ const b=t.boq.find(x=>x.id===bid); Object.assign(b,rec); tAudit(tid,'edit-boq',desc); }
  else { rec.id=tLineId(t); t.boq.push(rec); tAudit(tid,'add-boq',desc); }
  tSave(); closeModal(); renderView(); toast('BOQ item saved');
}
function delTBoq(tid,bid){ if(!confirm('Remove this BOQ item?')) return; const t=TDR.tenders.find(x=>x.id===tid); t.boq=t.boq.filter(b=>b.id!==bid); tAudit(tid,'remove-boq',bid); tSave(); renderView(); toast('BOQ item removed'); }
function exportTBoq(tid){ const t=TDR.tenders.find(x=>x.id===tid); const rows=[['Item','Description','Code','Unit','Qty','Material','Labour','Sub','Equip','Other','UnitRate','Amount']];
  (t.boq||[]).forEach(b=>rows.push([b.itemNo,b.desc,b.code,b.unit,b.qty,b.matRate,b.labRate,b.subRate,b.eqpRate,b.otherRate,tLineRate(b),tLineAmt(b)])); tDownloadCSV(t.id+'-BOQ.csv',rows); }

/* ---------- Excel-style import (paste rows) ---------- */
function openImportBoq(tid){
  openModal(`<div class="modal wide">${mh('',IC.in,'Import BOQ','Upload a CSV file or paste rows — columns: Item, Description, Code, Unit, Qty, Material, Labour, Sub, Equip, Other')}
    <div class="m-body">
      <div class="t-upload" onclick="document.getElementById('imp-file').click()">
        <input type="file" id="imp-file" accept=".csv,text/csv" style="display:none" onchange="readCsvFile(this,'imp-data',previewImportBoq)">
        ${svg(IC.in)}<div><b>Upload CSV file</b><span>Click to choose a .csv, or drag it here — then review the preview below</span></div>
        <button class="btn ghost sm" type="button">Choose file</button>
      </div>
      <div style="display:flex;align-items:center;gap:10px;margin:14px 0;color:var(--muted);font-size:12px"><span style="flex:1;height:1px;background:var(--line2)"></span>or paste rows<span style="flex:1;height:1px;background:var(--line2)"></span></div>
      <div class="fld"><label>Paste tab- or comma-separated rows (one BOQ line each)</label>
      <textarea class="f" id="imp-data" rows="6" placeholder="1&#9;Excavation&#9;2000&#9;Cum&#9;1800&#9;0&#9;180&#9;60&#9;0&#9;0" oninput="previewImportBoq()"></textarea></div>
      <div class="hint">${svg(IC.jobcost)}<div>A header row (Item, Description…) is auto-skipped. Rows with a description and a quantity are imported; cost codes are matched to the shared master where they exist. Review the preview before committing.</div></div>
      <div style="display:flex;justify-content:flex-end"><button class="btn ghost sm" onclick="previewImportBoq()">Preview</button></div>
      <div id="imp-preview" style="margin-top:10px"></div>
    </div>
    <div class="m-foot"><button class="btn ghost" onclick="closeModal()">Cancel</button><button class="btn" onclick="commitImportBoq('${tid}')">Import</button></div></div>`);
  setupDrop('imp-file','imp-data',previewImportBoq);
}
/* shared: read a chosen CSV file's text into a target textarea, then run a callback */
function readCsvFile(input, targetId, cb){ const f=input.files&&input.files[0]; if(!f) return;
  if(!/\.csv$/i.test(f.name) && f.type!=='text/csv' && f.type!=='application/vnd.ms-excel'){ toast('Please choose a .csv file'); return; }
  const r=new FileReader(); r.onload=e=>{ const el=document.getElementById(targetId); if(el){ el.value=String(e.target.result||'').trim(); } toast('Loaded '+f.name); if(cb) cb(); };
  r.onerror=()=>toast('Could not read the file'); r.readAsText(f); }
/* optional drag-and-drop onto the upload box */
function setupDrop(inputId, targetId, cb){ const box=document.querySelector('.t-upload'); if(!box) return;
  ['dragover','dragenter'].forEach(ev=>box.addEventListener(ev,e=>{ e.preventDefault(); box.classList.add('drag'); }));
  ['dragleave','drop'].forEach(ev=>box.addEventListener(ev,e=>{ e.preventDefault(); box.classList.remove('drag'); }));
  box.addEventListener('drop',e=>{ const f=e.dataTransfer.files&&e.dataTransfer.files[0]; if(!f) return; const inp=document.getElementById(inputId); try{ const dt=new DataTransfer(); dt.items.add(f); inp.files=dt.files; }catch{} readCsvFile({files:[f]}, targetId, cb); }); }
function stripHeader(lines){ if(!lines.length) return lines; const first=lines[0].toLowerCase(); if(/(^|[,\t])(item|sl|s\.no|description|desc)([,\t]|$)/.test(first) || /description/.test(first)) return lines.slice(1); return lines; }
function parseImportRows(){ const raw=val('imp-data'); if(!raw) return [];
  let lines=raw.split(/\r?\n/).map(l=>l.trim()).filter(Boolean); lines=stripHeader(lines);
  return lines.map(l=>{ const c=csvSplit(l);
    return { itemNo:c[0]||'', desc:c[1]||'', code:c[2]||'', unit:c[3]||'', qty:parseFloat(c[4])||0, matRate:parseFloat(c[5])||0, labRate:parseFloat(c[6])||0, subRate:parseFloat(c[7])||0, eqpRate:parseFloat(c[8])||0, otherRate:parseFloat(c[9])||0 }; })
    .filter(r=>r.desc && r.qty>0); }
/* split a CSV/TSV line, honouring double-quoted fields with embedded commas */
function csvSplit(line){ if(line.indexOf('\t')>=0 && line.indexOf('"')<0) return line.split('\t').map(s=>s.trim());
  const out=[]; let cur='', q=false; for(let i=0;i<line.length;i++){ const ch=line[i];
    if(q){ if(ch==='"'){ if(line[i+1]==='"'){ cur+='"'; i++; } else q=false; } else cur+=ch; }
    else { if(ch==='"') q=true; else if(ch===','){ out.push(cur); cur=''; } else cur+=ch; } }
  out.push(cur); return out.map(s=>s.trim()); }
function previewImportBoq(){ const rows=parseImportRows(); const el=document.getElementById('imp-preview'); if(!rows.length){ el.innerHTML=`<div class="jc-hint">No valid rows detected.</div>`; return; }
  el.innerHTML=`<div class="tbl-scroll" style="max-height:30vh;overflow:auto"><table class="jc-tbl"><thead><tr><th>Item</th><th>Description</th><th>Code</th><th>Unit</th><th class="r">Qty</th><th class="r">Unit rate</th><th class="r">Amount</th></tr></thead><tbody>${rows.map(b=>`<tr><td>${esc(b.itemNo)}</td><td>${esc(b.desc)}</td><td>${esc(b.code||'—')}</td><td>${esc(b.unit)}</td><td class="r">${jcNum(b.qty)}</td><td class="r">${jcNum(tLineRate(b))}</td><td class="r">${jcMoney(tLineAmt(b))}</td></tr>`).join('')}</tbody></table></div><div class="jc-hint">${rows.length} row(s) ready to import.</div>`; }
function commitImportBoq(tid){ const rows=parseImportRows(); if(!rows.length) return toast('No valid rows to import'); const t=TDR.tenders.find(x=>x.id===tid);
  rows.forEach(r=>{ r.id=tLineId(t); if(!r.itemNo) r.itemNo=String((t.boq||[]).length+1); t.boq.push(r); }); tAudit(tid,'import-boq',rows.length+' rows'); tSave(); closeModal(); renderView(); toast('Imported '+rows.length+' BOQ line(s)'); }

/* ---------- Standard work-item breakdown (civil / steel / concrete / labour / subcontracting) ---------- */
// Illustrative quantities & rates; each line is editable. Costs route to the right category
// (material / labour / sub) so the Materials / Labour / Subcontracting split stays correct.
function standardWorkItems(){
  const code=d=>{ const c=(jcr.costCodes||[]).find(x=>(x.desc||'').toLowerCase().includes(d)); return c?c.code:''; };
  return [
    { desc:'Civil work (masonry, plastering, finishes)', code:code('brick')||code('plaster'), unit:'Sqm', qty:5000,  matRate:620,   labRate:230, subRate:0,      eqpRate:0, otherRate:0 },
    { desc:'Steel reinforcement supply & fixing',         code:code('steel')||code('rcc'),     unit:'MT',   qty:120,   matRate:68000, labRate:4500,subRate:0,      eqpRate:0, otherRate:0 },
    { desc:'Concrete (RMC M30) incl. placing',            code:code('concret')||code('rcc'),   unit:'Cum',  qty:900,   matRate:6200,  labRate:1400,subRate:0,      eqpRate:800, otherRate:0 },
    { desc:'Labour (skilled & unskilled)',                code:'',                              unit:'Man-days', qty:8000, matRate:0, labRate:750, subRate:0,      eqpRate:0, otherRate:0 },
    { desc:'Subcontracting (MEP, waterproofing)',         code:'',                              unit:'LS',   qty:1,     matRate:0,     labRate:0,   subRate:3500000,eqpRate:0, otherRate:0 },
  ];
}
function addStandardItems(tid){
  const t=TDR.tenders.find(x=>x.id===tid); if(!t) return;
  openModal(`<div class="modal wide">${mh('',IC.jobcost,'Add standard work items','Breaks the work into civil, steel, concrete, labour & subcontracting — edit any quantity or rate after')}
    <div class="m-body">
      <div class="tbl-scroll" style="max-height:44vh;overflow:auto"><table class="jc-tbl"><thead><tr><th>Work item</th><th>Unit</th><th class="r">Est. qty</th><th class="r">Material</th><th class="r">Labour</th><th class="r">Sub</th><th class="r">Equip</th><th class="r">Amount</th></tr></thead>
      <tbody>${standardWorkItems().map(w=>`<tr><td><b>${esc(w.desc)}</b></td><td>${esc(w.unit)}</td><td class="r">${jcNum(w.qty)}</td><td class="r">${jcNum(w.matRate)}</td><td class="r">${jcNum(w.labRate)}</td><td class="r">${jcNum(w.subRate)}</td><td class="r">${jcNum(w.eqpRate)}</td><td class="r b">${jcMoney(tLineAmt(w))}</td></tr>`).join('')}</tbody></table></div>
      <div class="hint">${svg(IC.jobcost)}<div>These are <b>illustrative</b> quantities and rates to start the estimate. They are appended to the current BOQ — adjust each quantity and rate to match the actual scope. Costs flow into the Materials / Labour / Subcontracting split automatically.</div></div>
    </div>
    <div class="m-foot"><button class="btn ghost" onclick="closeModal()">Cancel</button><button class="btn" onclick="commitStandardItems('${tid}')">Add these ${standardWorkItems().length} items</button></div></div>`);
}
function commitStandardItems(tid){
  const t=TDR.tenders.find(x=>x.id===tid); if(!t) return;
  standardWorkItems().forEach(w=>{ const rec=Object.assign({},w); rec.id=tLineId(t); rec.itemNo=String((t.boq||[]).length+1); (t.boq=t.boq||[]).push(rec); });
  tAudit(tid,'add-standard-items', standardWorkItems().length+' work items'); tSave(); closeModal(); renderView(); toast('Added standard work items — edit quantities & rates as needed');
}

/* ---------- Historical rates (from all projects' cost ledgers) ---------- */
let tRateQ='';
function twRates(t){
  const pname=id=>{ const p=(jcr.projects||[]).find(x=>x.id===id); return p?p.name+' ('+p.jobCode+')':id; };
  let recs=(jcr.entries||[]).filter(e=>!e.archived && e.rate).map(e=>({desc:e.desc,code:e.code,cat:e.category,unit:e.unit,rate:e.rate,date:e.date,proj:pname(e.projectId)}));
  const q=tRateQ.trim().toLowerCase(); if(q) recs=recs.filter(r=>[r.desc,r.code,r.cat,r.proj].some(x=>String(x||'').toLowerCase().includes(q)));
  recs=recs.sort((a,b)=>(b.date||'').localeCompare(a.date||'')).slice(0,200);
  window._rateRecs=recs;
  const rows=recs.map((r,i)=>`<tr class="drill" onclick="openRateDetail(${i})"><td><b>${esc(r.desc)}</b></td><td class="c">${esc(r.code||'—')}</td><td>${esc(r.cat)}</td><td>${esc(r.unit||'')}</td><td class="r b">${jcNum(r.rate)}</td><td>${esc(r.date||'')}</td><td>${esc(r.proj)}</td><td class="r" style="width:24px;color:var(--dim)">${svg(IC.drill)}</td></tr>`).join('')
    ||`<tr class="empty-row"><td colspan="8">No historical rate records yet.</td></tr>`;
  return `<div class="panel"><div class="inv-head"><h2>Historical Rate Analysis</h2>
    <div class="f-search" style="margin:0 0 0 auto"><span>${svg(IC.search)}</span><input class="f" placeholder="Search material, labour, cost code, project…" value="${esc(tRateQ)}" oninput="tRateQ=this.value;renderRateRows()" id="t-rateq" style="padding-left:34px"></div></div>
    <div class="tbl-scroll"><table class="jc-tbl"><thead><tr><th>Item</th><th>Code</th><th>Category</th><th>Unit</th><th class="r">Rate</th><th>Date</th><th>Source project</th><th></th></tr></thead><tbody id="t-raterows">${rows}</tbody></table></div>
    <div class="jc-hint" style="padding:12px 20px">${svg(IC.jobcost)} Reference rates drawn from every project's material &amp; labour cost ledgers — click any row for its full rate history. Historical rates are guidance, not guaranteed current prices.</div></div>`;
}
function renderRateRows(){ const el=document.getElementById('app'); const foc=document.activeElement&&document.activeElement.id==='t-rateq'; el.innerHTML=tenderHTML(); if(foc){ const i=document.getElementById('t-rateq'); if(i){ i.focus(); i.setSelectionRange(i.value.length,i.value.length); } } }
// drill-down: full history for one item (all occurrences across projects) + stats + trend
function openRateDetail(i){
  const r=(window._rateRecs||[])[i]; if(!r) return;
  const pname=id=>{ const p=(jcr.projects||[]).find(x=>x.id===id); return p?p.name+' ('+p.jobCode+')':id; };
  const dkey=String(r.desc||'').trim().toLowerCase();
  const recs=(jcr.entries||[]).filter(e=>!e.archived && e.rate && String(e.desc||'').trim().toLowerCase()===dkey)
    .map(e=>({proj:pname(e.projectId), code:e.code, cat:e.category, unit:e.unit, qty:e.qty, rate:e.rate, amount:e.amount, date:e.date, source:e.source, by:e.createdBy}))
    .sort((a,b)=>(b.date||'').localeCompare(a.date||''));
  const rates=recs.map(x=>x.rate).filter(x=>x>0);
  const min=rates.length?Math.min(...rates):0, max=rates.length?Math.max(...rates):0;
  const avg=rates.length?rates.reduce((s,x)=>s+x,0)/rates.length:0;
  const latest=recs[0]?recs[0].rate:0;
  const projs=[...new Set(recs.map(x=>x.proj))];
  const spark=(()=>{ if(rates.length<2||max===min) return ''; const asc=recs.slice().reverse();
    const w=260,h=36,n=asc.length; const pts=asc.map((x,k)=>{ const px=n>1?k/(n-1)*w:0; const py=h-((x.rate-min)/(max-min))*h; return px.toFixed(1)+','+py.toFixed(1); }).join(' ');
    return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" style="width:100%;height:40px;display:block"><polyline points="${pts}" fill="none" stroke="var(--blue)" stroke-width="2"/></svg>`; })();
  const rows=recs.map(x=>`<tr><td>${esc(x.proj)}</td><td class="c">${esc(x.code||'—')}</td><td>${esc(x.cat)}</td><td class="r">${x.qty!=null?jcNum(x.qty):'—'} ${esc(x.unit||'')}</td><td class="r b">${jcNum(x.rate)}</td><td class="r">${x.amount!=null?jcMoney(x.amount):'—'}</td><td>${esc(x.date||'')}</td><td>${esc(x.source||x.by||'—')}</td></tr>`).join('')
    ||`<tr class="empty-row"><td colspan="8">No records.</td></tr>`;
  openModal(`<div class="modal wide">${mh('',IC.history,esc(r.desc),(r.cat||'')+(r.code?' · code '+r.code:'')+' · '+recs.length+' record(s) across '+projs.length+' project(s)')}
    <div class="m-body">
      <div class="t-rate-stats">
        <div><span>Latest rate</span><b>${jcNum(latest)}</b></div>
        <div><span>Average</span><b>${jcNum(avg)}</b></div>
        <div><span>Lowest</span><b style="color:var(--green)">${jcNum(min)}</b></div>
        <div><span>Highest</span><b style="color:var(--red)">${jcNum(max)}</b></div>
        <div><span>Spread</span><b>${min?('±'+(((max-min)/avg*100||0).toFixed(0))+'%'):'—'}</b></div>
      </div>
      ${spark?`<div class="t-cmp-sec" style="padding:0 0 10px"><h3>Rate trend (oldest → latest)</h3>${spark}</div>`:''}
      <div class="tbl-scroll" style="max-height:48vh;overflow:auto"><table class="jc-tbl"><thead><tr><th>Project</th><th>Code</th><th>Category</th><th class="r">Qty</th><th class="r">Rate</th><th class="r">Amount</th><th>Date</th><th>Source</th></tr></thead><tbody>${rows}</tbody></table></div>
      <div class="jc-hint">${svg(IC.jobcost)} Every recorded occurrence of “${esc(r.desc)}” across all projects. Use the spread to judge how stable this rate is before pricing a new bid.</div>
    </div>
    <div class="m-foot"><button class="btn ghost" onclick="closeModal()">Close</button><button class="btn" onclick="rateDetailCSV(${i})">Export CSV</button></div></div>`);
}
function rateDetailCSV(i){ const r=(window._rateRecs||[])[i]; if(!r) return;
  const pname=id=>{ const p=(jcr.projects||[]).find(x=>x.id===id); return p?p.jobCode:id; };
  const dkey=String(r.desc||'').trim().toLowerCase();
  const rows=[['Item','Project','Code','Category','Qty','Unit','Rate','Amount','Date','Source']];
  (jcr.entries||[]).filter(e=>!e.archived&&String(e.desc||'').trim().toLowerCase()===dkey).forEach(e=>rows.push([r.desc,pname(e.projectId),e.code,e.category,e.qty,e.unit,e.rate,e.amount,e.date,e.source||e.createdBy||'']));
  tDownloadCSV((r.desc||'rate').replace(/[^a-z0-9]+/gi,'-')+'-history.csv',rows); }

/* ---------- Vendor quotations (with historical comparison) ---------- */
function vendorLabel(q){ const v=state.vendors.find(x=>x.id===q.vendorId); return v?v.name:(q.vendorName||q.vendorId||'—'); }
let cmpQuoteId=null;
function compareQuote(tid,qid){ cmpQuoteId=(cmpQuoteId===qid?null:qid); renderView(); }
// gather historical records matching a quotation: past project cost rates, previous quotes, inventory master rate
function quoteHistory(cur){
  const STOP=['the','and','for','with','incl','nos','set','per'];
  // generic construction words that shouldn't drive a match on their own (e.g. "bar" → "bar bending machine")
  const GENERIC=['bar','mix','work','works','site','machine','supply','fixing','grade','class','type','material','item','new','old'];
  const key=String(cur.item||'').toLowerCase().replace(/[^a-z0-9 ]/g,' ').split(/\s+/).filter(w=>w.length>2&&!STOP.includes(w));
  let matchKey=key.filter(w=>!GENERIC.includes(w)); if(!matchKey.length) matchKey=key;   // need a distinctive token
  // whole-word match on distinctive tokens (so "cement" doesn't match "reinforcement", "bar" doesn't match "bar bending machine")
  const hit=txt=>{ if(!matchKey.length) return false; const tw=String(txt||'').toLowerCase().replace(/[^a-z0-9 ]/g,' ').split(/\s+/); return matchKey.some(w=>tw.includes(w)); };
  const pname=id=>{ const p=(jcr.projects||[]).find(x=>x.id===id); return p?p.jobCode:id; };
  // comparable = same order of magnitude as the quote (guards unit mismatches, e.g. ₹/kg vs ₹/MT)
  const cmp=r=>r>0 && cur.price>0 && r>=cur.price/20 && r<=cur.price*20;
  const costRates=(jcr.entries||[]).filter(e=>!e.archived && e.rate && hit(e.desc) && cmp(e.rate))
    .map(e=>({src:'Project '+pname(e.projectId), item:e.desc, unit:e.unit, rate:e.rate, date:e.date}))
    .sort((a,b)=>(b.date||'').localeCompare(a.date||'')).slice(0,12);
  const pastQuotes=[];
  TDR.tenders.forEach(t2=>{ (t2.quotes||[]).forEach(q2=>{ if(q2.id===cur.id) return;
    // same item only (exact or distinctive-token match) so the price benchmark stays apples-to-apples
    const sameItem = cur.item && (q2.item===cur.item || hit(q2.item));
    if(sameItem && cmp(q2.price))
      pastQuotes.push({src:t2.name+' ('+t2.id+')', vendor:vendorLabel(q2), item:q2.item, unit:q2.unit, rate:q2.price, selected:q2.selected}); }); });
  let inv=state.items.find(it=>hit(it.name) && (it.unit||'').toLowerCase()===String(cur.unit||'').toLowerCase() && cmp(it.rate))
        || state.items.find(it=>hit(it.name) && cmp(it.rate));
  return { costRates, pastQuotes, inv: inv?{name:inv.name, unit:inv.unit, rate:inv.rate}:null };
}
function deltaCell(cur, ref){ if(!ref||!cur) return '—'; const d=(cur-ref)/ref*100; const up=d>0.5, dn=d<-0.5;
  const c=up?'var(--red)':dn?'var(--green)':'var(--muted)'; const sign=d>0?'+':''; const arr=up?'▲':dn?'▼':'■';
  return `<span style="color:${c};font-weight:700">${arr} ${sign}${d.toFixed(1)}%</span>`; }
function twQuotes(t){
  const rows=(t.quotes||[]).map(q=>`<tr class="drill ${q.selected?'t-sel':''} ${cmpQuoteId===q.id?'t-cmp':''}" onclick="compareQuote('${t.id}','${q.id}')">
    <td><b>${esc(vendorLabel(q))}</b></td><td>${esc(q.item||'—')}</td><td>${esc(q.unit||'')}</td><td class="r b">${jcMoney(q.price)}</td>
    <td><div class="jc-row-acts">${q.selected?'<span class="t-pick">Selected</span>':`<button title="Select for estimate" onclick="event.stopPropagation();selectQuote('${t.id}','${q.id}')">${svg(IC.check)}</button>`}<button title="Remove" onclick="event.stopPropagation();delQuote('${t.id}','${q.id}')">${svg(IC.trash)}</button></div></td></tr>`).join('')
    ||`<tr class="empty-row"><td colspan="5">No quotations yet — import a CSV or record one.</td></tr>`;
  const cur=(t.quotes||[]).find(q=>q.id===cmpQuoteId);
  return `<div class="t-ov-grid t-cmp-grid">
    <div class="panel"><div class="inv-head"><h2>Current quotations</h2>
      <div style="margin-left:auto;display:flex;gap:8px"><button class="btn ghost sm" onclick="openImportQuotes('${t.id}')">${svg(IC.in)} Import CSV</button><button class="btn sm" onclick="openQuote('${t.id}')">${svg(IC.plus)} Record Quotation</button></div></div>
      <div class="tbl-scroll"><table class="jc-tbl"><thead><tr><th>Vendor</th><th>Item</th><th>Unit</th><th class="r">Quoted</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>
      <div class="jc-hint" style="padding:12px 20px">${svg(IC.vendors)} Click a quotation to compare it against historical records on the right. The ✓ flags a quote for the estimate; vendors use the shared master.</div></div>
    ${cur?quoteComparePanel(cur):`<div class="panel t-cmp-empty"><div class="inv-head"><h2>Historical records</h2></div><div class="t-cmp-ph">${svg(IC.history)}<p>Select a quotation on the left to compare its price against past project rates, previous vendor quotes and the inventory master rate.</p></div></div>`}
  </div>`;
}
function quoteComparePanel(cur){
  const h=quoteHistory(cur);
  const allRates=[...h.costRates.map(r=>r.rate), ...h.pastQuotes.map(r=>r.rate), ...(h.inv?[h.inv.rate]:[])].filter(x=>x>0);
  const avg=allRates.length?allRates.reduce((s,x)=>s+x,0)/allRates.length:0;
  const lo=allRates.length?Math.min(...allRates):0, hi=allRates.length?Math.max(...allRates):0;
  const costRows=h.costRates.map(r=>`<tr><td><b>${esc(r.item)}</b><div class="t-cmp-src">${esc(r.src)} · ${esc(r.date||'')}</div></td><td>${esc(r.unit||'')}</td><td class="r b">${jcNum(r.rate)}</td><td class="r">${deltaCell(cur.price,r.rate)}</td></tr>`).join('')
    ||`<tr class="empty-row"><td colspan="4">No matching project cost history.</td></tr>`;
  const pqRows=h.pastQuotes.map(r=>`<tr><td><b>${esc(r.vendor)}</b><div class="t-cmp-src">${esc(r.src)}${r.selected?' · was selected':''}</div></td><td>${esc(r.unit||'')}</td><td class="r b">${jcNum(r.rate)}</td><td class="r">${deltaCell(cur.price,r.rate)}</td></tr>`).join('')
    ||`<tr class="empty-row"><td colspan="4">No earlier quotes for this vendor/item.</td></tr>`;
  return `<div class="panel"><div class="inv-head"><h2>Historical records</h2><span class="tag" style="margin-left:auto">${esc(vendorLabel(cur))} · ${esc(cur.item||'item')}</span></div>
    <div style="padding:14px 20px 0"><div class="t-cmp-head">
      <div><span>This quote</span><b>${jcMoney(cur.price)}</b></div>
      <div><span>Historic avg</span><b>${avg?jcMoney(avg):'—'}</b></div>
      <div><span>vs avg</span><b>${avg?deltaCell(cur.price,avg):'—'}</b></div>
      <div><span>Range</span><b>${lo?jcNum(lo)+'–'+jcNum(hi):'—'}</b></div>
    </div>
    ${avg?`<div class="t-cmp-verdict ${cur.price<=lo?'good':cur.price>=hi?'bad':'mid'}">${cur.price<=lo?'Lowest on record — strong price':cur.price>=hi?'Highest on record — negotiate':'Within the historic range'}</div>`:''}
    </div>
    ${h.inv?`<div class="t-cmp-sec"><h3>Inventory master rate</h3><table class="jc-tbl"><tbody><tr><td><b>${esc(h.inv.name)}</b></td><td>${esc(h.inv.unit||'')}</td><td class="r b">${jcNum(h.inv.rate)}</td><td class="r">${deltaCell(cur.price,h.inv.rate)}</td></tr></tbody></table></div>`:''}
    <div class="t-cmp-sec"><h3>Project cost history</h3><div class="tbl-scroll" style="max-height:26vh;overflow:auto"><table class="jc-tbl"><thead><tr><th>Item · source</th><th>Unit</th><th class="r">Rate</th><th class="r">vs quote</th></tr></thead><tbody>${costRows}</tbody></table></div></div>
    <div class="t-cmp-sec"><h3>Previous quotations</h3><div class="tbl-scroll" style="max-height:22vh;overflow:auto"><table class="jc-tbl"><thead><tr><th>Vendor · tender</th><th>Unit</th><th class="r">Price</th><th class="r">vs quote</th></tr></thead><tbody>${pqRows}</tbody></table></div></div>
  </div>`;
}
function openQuote(tid){
  const vopts=state.vendors.map(v=>`<option value="${v.id}">${esc(v.name)}</option>`).join('');
  const t=TDR.tenders.find(x=>x.id===tid);
  const bopts=`<option value="">— general / material —</option>`+(t.boq||[]).map(b=>`<option value="${esc(b.desc)}">${esc(b.itemNo)}. ${esc(b.desc)}</option>`).join('');
  openModal(`<div class="modal">${mh('',IC.vendors,'Record Vendor Quotation','Associate a quote with a BOQ item or material')}
    <div class="m-body"><div class="grid2">
      <div class="fld col2"><label>Vendor <span class="req">*</span></label><select class="f" id="q-vendor">${vopts}</select></div>
      <div class="fld col2"><label>Against BOQ item / material</label><select class="f" id="q-item">${bopts}</select></div>
      <div class="fld"><label>Quoted price (₹) <span class="req">*</span></label><input class="f" id="q-price" type="number" step="any"></div>
      <div class="fld"><label>Unit</label><input class="f" id="q-unit" placeholder="per Cum, per bag…"></div>
      <div class="fld"><label>Validity</label><input class="f" id="q-valid" placeholder="e.g. 30 days"></div>
      <div class="fld"><label>Delivery terms</label><input class="f" id="q-deliv" placeholder="e.g. 7 days, FOR site"></div>
      <div class="fld col2"><label>Commercial terms</label><input class="f" id="q-terms" placeholder="payment, taxes…"></div>
    </div></div>
    <div class="m-foot"><button class="btn ghost" onclick="closeModal()">Cancel</button><button class="btn" onclick="submitQuote('${tid}')">Save quotation</button></div></div>`);
}
function submitQuote(tid){ const t=TDR.tenders.find(x=>x.id===tid); const price=parseFloat(val('q-price'))||0; if(price<=0) return toast('Enter a quoted price');
  let m=0; (t.quotes||[]).forEach(q=>{ const g=((q.id||'').match(/(\d+)$/)||[])[1]; if(g&&+g>m)m=+g; });
  (t.quotes=t.quotes||[]).push({ id:'QT-'+(m+1), vendorId:val('q-vendor'), item:val('q-item'), price, unit:val('q-unit'), validity:val('q-valid'), delivery:val('q-deliv'), terms:val('q-terms'), selected:false });
  tAudit(tid,'add-quote',val('q-item')||'quote'); tSave(); closeModal(); renderView(); toast('Quotation recorded'); }
function selectQuote(tid,qid){ const t=TDR.tenders.find(x=>x.id===tid); const sel=t.quotes.find(q=>q.id===qid); t.quotes.forEach(q=>{ if(q.item===sel.item) q.selected=(q.id===qid); }); tAudit(tid,'select-quote',qid); tSave(); renderView(); toast('Quotation selected'); }
function delQuote(tid,qid){ const t=TDR.tenders.find(x=>x.id===tid); t.quotes=t.quotes.filter(q=>q.id!==qid); tSave(); renderView(); }
/* ---------- Vendor quotation CSV import ---------- */
function openImportQuotes(tid){
  openModal(`<div class="modal wide">${mh('',IC.in,'Import Quotations from CSV','Columns: Vendor, Item/BOQ ref, Unit, Price, Validity, Delivery, Terms')}
    <div class="m-body">
      <div class="t-upload" onclick="document.getElementById('qimp-file').click()">
        <input type="file" id="qimp-file" accept=".csv,text/csv" style="display:none" onchange="readCsvFile(this,'qimp-data',previewImportQuotes)">
        ${svg(IC.in)}<div><b>Upload CSV file</b><span>Click to choose a .csv, or drag it here</span></div>
        <button class="btn ghost sm" type="button">Choose file</button>
      </div>
      <div style="display:flex;align-items:center;gap:10px;margin:14px 0;color:var(--muted);font-size:12px"><span style="flex:1;height:1px;background:var(--line2)"></span>or paste rows<span style="flex:1;height:1px;background:var(--line2)"></span></div>
      <div class="fld"><label>Paste rows (Vendor, Item, Unit, Price, Validity, Delivery, Terms)</label>
      <textarea class="f" id="qimp-data" rows="6" placeholder="Lakshmi Steels,Steel reinforcement,MT,67500,30 days,7 days FOR,Payment 30 days" oninput="previewImportQuotes()"></textarea></div>
      <div class="hint">${svg(IC.vendors)}<div>Vendor names are matched to the shared <b>Vendor Master</b> (no duplicates created); an unmatched name is kept as typed. A header row is auto-skipped.</div></div>
      <div style="display:flex;justify-content:flex-end"><button class="btn ghost sm" onclick="previewImportQuotes()">Preview</button></div>
      <div id="qimp-preview" style="margin-top:10px"></div>
    </div>
    <div class="m-foot"><button class="btn ghost" onclick="closeModal()">Cancel</button><button class="btn" onclick="commitImportQuotes('${tid}')">Import</button></div></div>`);
  setupDrop('qimp-file','qimp-data',previewImportQuotes);
}
function matchVendor(name){ const n=String(name||'').trim().toLowerCase(); if(!n) return null;
  return state.vendors.find(v=>v.name.toLowerCase()===n) || state.vendors.find(v=>v.name.toLowerCase().includes(n)||n.includes(v.name.toLowerCase())) || null; }
function parseImportQuotes(){ const raw=val('qimp-data'); if(!raw) return [];
  let lines=raw.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
  if(lines.length && /vendor/i.test(lines[0])) lines=lines.slice(1);
  return lines.map(l=>{ const c=csvSplit(l); const v=matchVendor(c[0]);
    return { vendorId:v?v.id:'', vendorName:v?v.name:(c[0]||''), matched:!!v, item:c[1]||'', unit:c[2]||'', price:parseFloat(String(c[3]||'').replace(/[^0-9.]/g,''))||0, validity:c[4]||'', delivery:c[5]||'', terms:c[6]||'' }; })
    .filter(r=>r.vendorName && r.price>0); }
function previewImportQuotes(){ const rows=parseImportQuotes(); const el=document.getElementById('qimp-preview'); if(!el) return;
  if(!rows.length){ el.innerHTML=`<div class="jc-hint">No valid rows detected (need a vendor and a price).</div>`; return; }
  el.innerHTML=`<div class="tbl-scroll" style="max-height:30vh;overflow:auto"><table class="jc-tbl"><thead><tr><th>Vendor</th><th>Match</th><th>Item</th><th>Unit</th><th class="r">Price</th><th>Validity</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r.vendorName)}</td><td>${r.matched?'<span class="t-pick">master</span>':'<span class="t-badge" style="color:#b45309;background:#fef3c7">new name</span>'}</td><td>${esc(r.item||'—')}</td><td>${esc(r.unit)}</td><td class="r">${jcMoney(r.price)}</td><td>${esc(r.validity||'—')}</td></tr>`).join('')}</tbody></table></div><div class="jc-hint">${rows.length} quotation(s) ready · ${rows.filter(r=>r.matched).length} matched to Vendor Master.</div>`; }
function commitImportQuotes(tid){ const rows=parseImportQuotes(); if(!rows.length) return toast('No valid quotations to import'); const t=TDR.tenders.find(x=>x.id===tid);
  let m=0; (t.quotes||[]).forEach(q=>{ const g=((q.id||'').match(/(\d+)$/)||[])[1]; if(g&&+g>m)m=+g; });
  rows.forEach(r=>{ (t.quotes=t.quotes||[]).push({ id:'QT-'+(++m), vendorId:r.vendorId, vendorName:r.vendorName, item:r.item, price:r.price, unit:r.unit, validity:r.validity, delivery:r.delivery, terms:r.terms, selected:false }); });
  tAudit(tid,'import-quotes',rows.length+' quotes'); tSave(); closeModal(); renderView(); toast('Imported '+rows.length+' quotation(s)'); }

/* ---------- Bid pricing & profitability ---------- */
function twPricing(t,c){
  const p=t.pricing||{}; const locked=t.status==='Won';
  const line=(l,v,cls)=>`<tr class="${cls||''}"><td>${l}</td><td class="r b">${v}</td></tr>`;
  const verRows=(t.versions||[]).map(v=>`<tr><td class="c">v${v.ver}</td><td>${esc((v.at||'').slice(0,10))}</td><td>${esc(v.by||'')}</td><td class="r">${jcMoney(v.totalCost)}</td><td class="r b">${jcMoney(v.bidValue)}</td><td class="r">${jcMoney(v.profit)}</td><td class="r">${(v.margin||0).toFixed(1)}%</td><td>${esc(v.note||'')}</td></tr>`).join('')
    ||`<tr class="empty-row"><td colspan="8">No saved versions yet.</td></tr>`;
  const ov=t.directOverride&&t.directOverride.on;
  const catCell=(l,v)=>`<tr><td>${l}${ov?' <span class="t-manual">manual</span>':''}</td><td class="r b">${v}</td></tr>`;
  return `<div class="t-ov-grid">
    <div class="panel"><div class="inv-head"><h2>Bid build-up</h2>${locked?'':`<div style="margin-left:auto;display:flex;gap:8px"><button class="btn ghost sm" onclick="openDirectCosts('${t.id}')">${svg(IC.edit)} Edit direct costs</button><button class="btn sm" onclick="openPricing('${t.id}')">${svg(IC.edit)} Revise &amp; save version</button></div>`}</div>
      <div class="tbl-scroll"><table class="jc-tbl"><tbody>
        ${catCell('Materials',jcMoney(c.matCost))}
        ${catCell('Labour',jcMoney(c.labCost))}
        ${catCell('Subcontracting &amp; equipment',jcMoney(c.subEqpCost))}
        ${line('Estimated direct cost',jcMoney(c.direct),'tot')}
        ${line('Allocated overheads ('+(p.overheadPct||0)+'%)',jcMoney(c.overhead))}
        ${line('Contingency ('+(p.contingencyPct||0)+'%)',jcMoney(c.contingency))}
        ${line('Estimated total cost',jcMoney(c.totalCost),'tot')}
        ${line('Target profit ('+(p.markupPct||0)+'% of estimated cost)',jcMoney(c.markup))}
        ${line('Tender price before applicable taxes',jcMoney(c.bidExTax),'tot')}
        ${line('Applicable taxes ('+(p.taxPct||0)+'%)',jcMoney(c.tax))}
        ${line('Proposed bid value (incl. taxes)',jcMoney(c.bidValue),'tot')}
        ${line('Expected profit',jcMoney(c.profit))}
        ${line('Expected margin (on selling, ex-tax)',c.margin.toFixed(1)+'%')}
      </tbody></table></div>
      <div class="jc-hint" style="padding:12px 20px">${svg(IC.jobcost)} ${ov?'<b>Manual direct-cost entry</b> — Materials/Labour/Sub figures are typed in, not from the BOQ. Use “Edit direct costs” to switch back to the BOQ.':'Direct cost splits into Materials / Labour / Subcontracting &amp; equipment from the BOQ. Use “Edit direct costs” to enter figures manually instead.'} Target profit is applied on estimated cost; taxes are shown separately.</div></div>
    <div style="display:flex;flex-direction:column;gap:16px">
    ${pricingBenchHTML(t,c)}
    <div class="panel"><div class="inv-head"><h2>Bid version history</h2></div>
      <div class="tbl-scroll"><table class="jc-tbl"><thead><tr><th>Ver</th><th>Date</th><th>By</th><th class="r">Cost</th><th class="r">Bid</th><th class="r">Profit</th><th class="r">Margin</th><th>Note</th></tr></thead><tbody>${verRows}</tbody></table></div>
      <div class="jc-hint" style="padding:12px 20px">${svg(IC.history)} Submitted bid versions are preserved — revising pricing never overwrites a previous version.</div></div>
    </div></div>`;
}
/* ---------- historic benchmark & comparison (right side of Pricing) ---------- */
let pricingBench='';
function setPricingBench(v){ pricingBench=v; renderView(); }
// category split of a project's ACTUAL costs (Materials / Labour / everything-else=Sub & equip)
function projCatCosts(pid){ let mat=0,lab=0,sub=0; (jcr.entries||[]).filter(e=>e.projectId===pid&&!e.archived).forEach(e=>{ if(e.category==='Materials')mat+=(e.amount||0); else if(e.category==='Labour')lab+=(e.amount||0); else sub+=(e.amount||0); }); return {mat,lab,subEqp:sub,direct:mat+lab+sub}; }
// category split of another tender's estimate
function tenderCatCosts(t2){ const cc=tCatCosts(t2); return {mat:cc.mat,lab:cc.lab,subEqp:cc.subEqp,direct:cc.mat+cc.lab+cc.subEqp}; }
function pricingBenchHTML(t,c){
  const projOpts=(jcr.projects||[]).map(p=>`<option value="proj:${p.id}" ${pricingBench==='proj:'+p.id?'selected':''}>Project — ${esc(p.name)} (${esc(p.jobCode)})</option>`).join('');
  const tenOpts=TDR.tenders.filter(x=>x.id!==t.id && (x.boq&&x.boq.length)).map(x=>`<option value="tndr:${x.id}" ${pricingBench==='tndr:'+x.id?'selected':''}>Tender — ${esc(x.name)} (${esc(x.id)})</option>`).join('');
  let body;
  if(!pricingBench){
    body=`<div class="t-cmp-ph" style="padding:28px">${svg(IC.history)}<p>Choose a past project (actual cost) or an earlier tender (estimate) to benchmark this bid against — you'll get a line-by-line comparison with variance.</p></div>`;
  } else {
    const [kind,id]=pricingBench.split(':'); let b, label, meta={};
    if(kind==='proj'){ const p=(jcr.projects||[]).find(x=>x.id===id); b=projCatCosts(id); label=(p?p.name:id)+' · actual cost';
      meta={ basis:'Actual cost', headline:'Contract value', headVal:(p&&p.originalCV)||0, area:(p&&p.builtUpArea)||0, pts:(jcr.entries||[]).filter(e=>e.projectId===id&&!e.archived).length, ptsLabel:'cost entries' }; }
    else { const x=TDR.tenders.find(y=>y.id===id); b=tenderCatCosts(x); label=(x?x.name:id)+' · estimate';
      meta={ basis:'Estimate', headline:'Bid value', headVal:x?tCostBreak(x).bidValue:0, area:0, pts:(x&&x.boq?x.boq.length:0), ptsLabel:'BOQ lines' }; }
    const row=(l,cur,ref)=>`<tr><td>${l}</td><td class="r">${jcMoney(cur)}</td><td class="r">${jcMoney(ref)}</td><td class="r">${deltaCell(cur,ref)}</td></tr>`;
    const shr=(v,tot)=>tot? v/tot*100:0;
    const pp=(a,bb)=>{ const d=a-bb; const col=Math.abs(d)<1?'var(--muted)':d>0?'var(--blue)':'var(--muted)'; return `<span style="color:${col};font-weight:700">${d>0?'+':''}${d.toFixed(0)} pp</span>`; };
    const compRow=(l,cur,ref)=>`<tr><td>${l}</td><td class="r">${shr(cur,c.direct).toFixed(0)}%</td><td class="r">${shr(ref,b.direct).toFixed(0)}%</td><td class="r">${pp(shr(cur,c.direct),shr(ref,b.direct))}</td></tr>`;
    const perSqft=meta.area? b.direct/meta.area : 0;
    body=`<div class="tbl-scroll"><table class="jc-tbl">
      <thead><tr><th>Cost head</th><th class="r">This bid</th><th class="r">Benchmark</th><th class="r">Variance</th></tr></thead>
      <tbody>
        ${row('Materials',c.matCost,b.mat)}
        ${row('Labour',c.labCost,b.lab)}
        ${row('Subcontracting &amp; equipment',c.subEqpCost,b.subEqp)}
        <tr class="tot"><td>Direct cost</td><td class="r b">${jcMoney(c.direct)}</td><td class="r b">${jcMoney(b.direct)}</td><td class="r">${deltaCell(c.direct,b.direct)}</td></tr>
      </tbody></table></div>
      <div class="t-cmp-sec" style="padding-top:8px"><div class="t-cmp-head" style="grid-template-columns:repeat(4,1fr)">
        <div><span>This direct cost</span><b>${jcMoney(c.direct)}</b></div>
        <div><span>Benchmark (${esc(meta.basis)})</span><b>${jcMoney(b.direct)}</b></div>
        <div><span>Difference</span><b>${deltaCell(c.direct,b.direct)}</b></div>
        <div><span>${esc(meta.headline)}</span><b>${meta.headVal?jcMoney(meta.headVal):'—'}</b></div>
      </div>
      <div class="t-cmp-verdict ${c.direct<b.direct*0.97?'good':c.direct>b.direct*1.03?'bad':'mid'}">${!b.direct?'Benchmark has no cost data yet.':c.direct<b.direct*0.97?'Your estimate is leaner than the benchmark — check nothing is missed.':c.direct>b.direct*1.03?'Your estimate is higher than the benchmark — review for padding.':'In line with the benchmark.'}</div>
      </div>
      <div class="t-cmp-sec"><h3>Cost composition (share of direct cost)</h3>
        <table class="jc-tbl"><thead><tr><th>Head</th><th class="r">This bid</th><th class="r">Benchmark</th><th class="r">Shift</th></tr></thead><tbody>
        ${compRow('Materials',c.matCost,b.mat)}${compRow('Labour',c.labCost,b.lab)}${compRow('Subcontracting &amp; equipment',c.subEqpCost,b.subEqp)}
        </tbody></table></div>
      <div class="t-cmp-sec"><h3>Benchmark reference points</h3>
        <div class="t-cmp-head" style="grid-template-columns:repeat(3,1fr)">
          <div><span>Data behind it</span><b>${meta.pts} ${esc(meta.ptsLabel)}</b></div>
          <div><span>Built-up area</span><b>${meta.area?num(meta.area)+' sqft':'—'}</b></div>
          <div><span>Cost / sqft</span><b>${perSqft?jcMoney(perSqft):'—'}</b></div>
        </div></div>
      <div class="jc-hint" style="padding:4px 20px 16px">${svg(IC.jobcost)} Benchmark = ${esc(label)}. Compared at direct-cost level (overheads, profit &amp; tax differ per bid). “Shift” shows how your cost mix differs in percentage points.</div>`;
  }
  return `<div class="panel"><div class="inv-head"><h2>Historic benchmark</h2>
    <select class="f" style="width:auto;max-width:280px;margin-left:auto;padding:7px 10px" onchange="setPricingBench(this.value)">
      <option value="">Choose a benchmark…</option>${projOpts}${tenOpts}</select></div>
    ${body}</div>`;
}
function openPricing(tid){ const t=TDR.tenders.find(x=>x.id===tid); const p=t.pricing||{};
  openModal(`<div class="modal">${mh('',IC.jobcost,'Revise pricing','Saves a new bid version — previous versions are kept')}
    <div class="m-body"><div class="grid2">
      <div class="fld"><label>Overhead %</label><input class="f" id="pr-oh" type="number" step="any" value="${p.overheadPct||0}"></div>
      <div class="fld"><label>Contingency %</label><input class="f" id="pr-cont" type="number" step="any" value="${p.contingencyPct||0}"></div>
      <div class="fld"><label>Markup on cost %</label><input class="f" id="pr-mk" type="number" step="any" value="${p.markupPct||0}"></div>
      <div class="fld"><label>Tax %</label><input class="f" id="pr-tax" type="number" step="any" value="${p.taxPct||0}"></div>
      <div class="fld col2"><label>Version note</label><input class="f" id="pr-note" placeholder="e.g. Reduced markup after negotiation"></div>
    </div></div>
    <div class="m-foot"><button class="btn ghost" onclick="closeModal()">Cancel</button><button class="btn" onclick="submitPricing('${tid}')">Save version</button></div></div>`);
}
function submitPricing(tid){ const t=TDR.tenders.find(x=>x.id===tid);
  t.pricing={ overheadPct:parseFloat(val('pr-oh'))||0, contingencyPct:parseFloat(val('pr-cont'))||0, markupPct:parseFloat(val('pr-mk'))||0, taxPct:parseFloat(val('pr-tax'))||0 };
  const c=tCostBreak(t); const ver=(t.versions.length?t.versions[t.versions.length-1].ver:0)+1;
  t.versions.push({ ver, at:new Date().toISOString(), by:COMPANY.user, direct:c.direct, totalCost:c.totalCost, bidValue:c.bidValue, profit:c.profit, margin:c.margin, note:val('pr-note') });
  tAudit(tid,'revise-pricing','v'+ver+' bid '+jcMoney(c.bidValue)); tSave(); closeModal(); renderView(); toast('Pricing saved as v'+ver); }

/* ---------- edit direct costs (manual Materials / Labour / Sub override) ---------- */
function openDirectCosts(tid){ const t=TDR.tenders.find(x=>x.id===tid); const cat=tCatCosts(t); const ov=t.directOverride&&t.directOverride.on;
  const boqN=(t.boq||[]).length;
  openModal(`<div class="modal">${mh('',IC.jobcost,'Edit direct costs','Enter Materials / Labour / Subcontracting figures directly')}
    <div class="m-body"><div class="grid2">
      <div class="fld"><label>Materials (₹)</label><input class="f" id="dc-mat" type="number" step="any" value="${Math.round(cat.mat)}" oninput="dcPreview()"></div>
      <div class="fld"><label>Labour (₹)</label><input class="f" id="dc-lab" type="number" step="any" value="${Math.round(cat.lab)}" oninput="dcPreview()"></div>
      <div class="fld col2"><label>Subcontracting &amp; equipment (₹)</label><input class="f" id="dc-sub" type="number" step="any" value="${Math.round(cat.subEqp)}" oninput="dcPreview()"></div>
    </div><div class="hint">${svg(IC.jobcost)}<div>Estimated direct cost <b id="dc-total">₹0</b>. ${boqN?`This overrides the figures derived from the ${boqN} BOQ line(s) — your BOQ stays intact.`:`You have no BOQ lines, so these typed figures drive the estimate.`}</div></div></div>
    <div class="m-foot">${ov?`<button class="btn ghost" onclick="clearDirectCosts('${tid}')">Use BOQ instead</button>`:'<span></span>'}<div style="display:flex;gap:8px;margin-left:auto"><button class="btn ghost" onclick="closeModal()">Cancel</button><button class="btn" onclick="submitDirectCosts('${tid}')">Save direct costs</button></div></div></div>`);
  dcPreview();
}
function dcPreview(){ const g=id=>parseFloat(val(id))||0; const el=document.getElementById('dc-total'); if(el) el.textContent=jcMoney(g('dc-mat')+g('dc-lab')+g('dc-sub')); }
function submitDirectCosts(tid){ const t=TDR.tenders.find(x=>x.id===tid);
  t.directOverride={ on:true, mat:parseFloat(val('dc-mat'))||0, lab:parseFloat(val('dc-lab'))||0, subEqp:parseFloat(val('dc-sub'))||0 };
  tAudit(tid,'edit-direct-costs','manual: '+jcMoney(t.directOverride.mat+t.directOverride.lab+t.directOverride.subEqp)); tSave(); closeModal(); renderView(); toast('Direct costs updated'); }
function clearDirectCosts(tid){ const t=TDR.tenders.find(x=>x.id===tid); if(t.directOverride) t.directOverride.on=false; tAudit(tid,'edit-direct-costs','reverted to BOQ'); tSave(); closeModal(); renderView(); toast('Using BOQ-derived direct costs'); }

/* ---------- Approval & submission ---------- */
function twApproval(t,c){
  const appr=(t.approvals||[]).map(a=>`<tr><td>${esc((a.at||'').slice(0,10))}</td><td>${esc(a.by)}</td><td>${statusDecisionBadge(a.decision)}</td><td>${esc(a.note||'')}</td></tr>`).join('')
    ||`<tr class="empty-row"><td colspan="4">No approval records yet.</td></tr>`;
  const canApprove=t.status==='Awaiting Approval';
  const canSubmit=t.status==='Approved for Submission';
  return `<div class="t-ov-grid">
    <div class="panel"><div class="inv-head"><h2>Internal approval</h2></div><div style="padding:14px 20px;display:flex;flex-direction:column;gap:10px">
      <div class="t-ov"><span>Current status</span>${statusBadge(t.status)}</div>
      <div class="t-ov"><span>Proposed bid value</span><b>${jcMoney(c.bidValue)}</b></div>
      <div class="t-ov"><span>Expected margin</span><b>${c.margin.toFixed(1)}%</b></div>
      ${t.status==='Estimation in Progress'?`<button class="btn" onclick="applyStatus('${t.id}','Awaiting Approval','Submitted for internal approval')">Submit estimate for approval</button>`:''}
      ${canApprove?`<div style="display:flex;gap:8px"><button class="btn" onclick="recordApproval('${t.id}','Approved')">${svg(IC.check)} Approve for submission</button><button class="btn danger" onclick="recordApproval('${t.id}','Rejected')">${svg(IC.x)} Reject</button></div>`:''}
    </div></div>
    <div class="panel"><div class="inv-head"><h2>Bid submission</h2></div><div style="padding:14px 20px;display:flex;flex-direction:column;gap:10px">
      ${t.submittedValue?`<div class="t-ov"><span>Submitted bid</span><b>${jcMoney(t.submittedValue)}</b></div><div class="t-ov"><span>Submitted on</span><b>${esc(t.submittedDate||'')}</b></div>`:'<div class="jc-hint">Not yet submitted.</div>'}
      ${canSubmit?`<button class="btn" onclick="openSubmitBid('${t.id}')">${svg(IC.out)} Record bid submission</button>`:''}
      ${t.status==='Submitted'?`<button class="btn ghost" onclick="applyStatus('${t.id}','Under Negotiation','Client negotiation started')">Move to negotiation</button>`:''}
      ${['Submitted','Under Negotiation'].includes(t.status)?`<div style="display:flex;gap:8px"><button class="btn" style="background:var(--green)" onclick="openConvert('${t.id}')">${svg(IC.check)} Mark as Won</button><button class="btn danger" onclick="applyStatus('${t.id}','Lost','')">Mark as Lost</button></div>`:''}
    </div></div>
    <div class="panel" style="grid-column:1/-1"><div class="inv-head"><h2>Approval history</h2></div>
      <div class="tbl-scroll"><table class="jc-tbl"><thead><tr><th>Date</th><th>By</th><th>Decision</th><th>Comment</th></tr></thead><tbody>${appr}</tbody></table></div></div>
  </div>`;
}
function statusDecisionBadge(d){ const c=d==='Approved'?['#15803d','#dcfce7']:d==='Rejected'?['#b91c1c','#fee2e2']:['#475569','#e2e8f0']; return `<span class="t-badge" style="color:${c[0]};background:${c[1]}">${esc(d)}</span>`; }
function recordApproval(tid,decision){ const note=prompt(decision+' — add a comment (optional):')||''; const t=TDR.tenders.find(x=>x.id===tid);
  (t.approvals=t.approvals||[]).push({ at:new Date().toISOString(), by:COMPANY.user, decision, note });
  if(decision==='Approved') applyStatus(tid,'Approved for Submission','Approved: '+note, true);
  else applyStatus(tid,'Estimation in Progress','Rejected: '+note, true);
  tAudit(tid,'approval',decision); tSave(); renderView(); toast('Recorded: '+decision); }
function openSubmitBid(tid){ const t=TDR.tenders.find(x=>x.id===tid); const c=tCostBreak(t);
  openModal(`<div class="modal">${mh('',IC.out,'Record Bid Submission','Saves the submitted value, date & a bid version')}
    <div class="m-body"><div class="grid2">
      <div class="fld"><label>Submitted bid value (₹) <span class="req">*</span></label><input class="f" id="sb-val" type="number" step="any" value="${Math.round(c.bidValue)}"></div>
      <div class="fld"><label>Submission date</label><input class="f" id="sb-date" type="date" value="${nowDate()}"></div>
      <div class="fld col2"><label>Proposal / document reference</label><input class="f" id="sb-doc" placeholder="e.g. Qualtech-Bid-TDR001.pdf"></div>
    </div><div class="hint">${svg(IC.jobcost)}<div>This locks in a submitted bid version for comparison; later pricing revisions won't overwrite it.</div></div></div>
    <div class="m-foot"><button class="btn ghost" onclick="closeModal()">Cancel</button><button class="btn" onclick="submitBid('${tid}')">Submit bid</button></div></div>`);
}
function submitBid(tid){ const t=TDR.tenders.find(x=>x.id===tid); const v=parseFloat(val('sb-val'))||0; if(v<=0) return toast('Enter the submitted bid value');
  t.submittedValue=v; t.submittedDate=val('sb-date')||nowDate(); const c=tCostBreak(t);
  const ver=(t.versions.length?t.versions[t.versions.length-1].ver:0)+1;
  t.versions.push({ ver, at:new Date().toISOString(), by:COMPANY.user, direct:c.direct, totalCost:c.totalCost, bidValue:v, profit:v-c.totalCost, margin:v?(v-c.totalCost)/v*100:0, note:'SUBMITTED'+(val('sb-doc')?' · '+val('sb-doc'):'') });
  if(val('sb-doc')) (t.docs=t.docs||[]).push({ id:'DOC-'+((t.docs||[]).length+1), name:val('sb-doc'), type:'Submitted proposal', at:new Date().toISOString() });
  applyStatus(tid,'Submitted','Bid submitted: '+jcMoney(v), true); tAudit(tid,'submit-bid',jcMoney(v)); tSave(); closeModal(); renderView(); toast('Bid submitted: '+jcMoney(v)); }

/* ---------- Documents ---------- */
function twDocs(t){
  const rows=(t.docs||[]).map(d=>`<tr><td><b>${esc(d.name)}</b></td><td>${esc(d.type||'—')}</td><td>${esc((d.at||'').slice(0,10))}</td><td><div class="jc-row-acts"><button title="Remove" onclick="delDoc('${t.id}','${d.id}')">${svg(IC.trash)}</button></div></td></tr>`).join('')
    ||`<tr class="empty-row"><td colspan="4">No documents recorded.</td></tr>`;
  return `<div class="panel"><div class="inv-head"><h2>Tender Documents</h2><button class="btn sm" style="margin-left:auto" onclick="openDoc('${t.id}')">${svg(IC.plus)} Record Document</button></div>
    <div class="tbl-scroll"><table class="jc-tbl"><thead><tr><th>Document</th><th>Type</th><th>Recorded</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>
    <div class="jc-hint" style="padding:12px 20px">${svg(IC.jobcost)} Document references (drawings, BOQ, proposal, correspondence) are logged here. File storage would attach to each record in a server-backed deployment.</div></div>`;
}
function openDoc(tid){ openModal(`<div class="modal">${mh('',IC.po,'Record Document','Log a tender document reference')}
  <div class="m-body"><div class="grid2">
    <div class="fld col2"><label>Document name <span class="req">*</span></label><input class="f" id="dc-name" placeholder="e.g. BOQ-Rev2.xlsx, Drawings.pdf"></div>
    <div class="fld col2"><label>Type</label><select class="f" id="dc-type"><option>Drawing</option><option>BOQ</option><option>Tender notice</option><option>Submitted proposal</option><option>Correspondence</option><option>Other</option></select></div>
  </div></div>
  <div class="m-foot"><button class="btn ghost" onclick="closeModal()">Cancel</button><button class="btn" onclick="submitDoc('${tid}')">Save</button></div></div>`); }
function submitDoc(tid){ const t=TDR.tenders.find(x=>x.id===tid); const name=val('dc-name'); if(!name) return toast('Document name required');
  (t.docs=t.docs||[]).push({ id:'DOC-'+((t.docs||[]).length+1), name, type:val('dc-type'), at:new Date().toISOString() }); tAudit(tid,'add-doc',name); tSave(); closeModal(); renderView(); toast('Document recorded'); }
function delDoc(tid,did){ const t=TDR.tenders.find(x=>x.id===tid); t.docs=t.docs.filter(d=>d.id!==did); tSave(); renderView(); }

/* ---------- Activity history ---------- */
function twHistory(t){
  const rows=(t.history||[]).slice().reverse().map(h=>`<tr><td>${esc((h.at||'').replace('T',' ').slice(0,16))}</td><td>${esc(h.by||'')}</td><td>${h.from?statusBadge(h.from):'—'}</td><td>${statusBadge(h.to)}</td><td>${esc(h.note||'')}</td></tr>`).join('')
    ||`<tr class="empty-row"><td colspan="5">No activity yet.</td></tr>`;
  return `<div class="panel"><div class="inv-head"><h2>Tender Activity History</h2></div>
    <div class="tbl-scroll"><table class="jc-tbl"><thead><tr><th>When</th><th>By</th><th>From</th><th>To</th><th>Note / reason</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
}

/* ---------- status management ---------- */
function openStatus(tid){ const t=TDR.tenders.find(x=>x.id===tid); const nexts=(T_TRANSITIONS[t.status]||[]);
  if(!nexts.length) return toast('No further status changes from '+t.status);
  openModal(`<div class="modal">${mh('',IC.flag,'Update Tender Status','Current: '+t.status)}
    <div class="m-body"><div class="fld"><label>New status <span class="req">*</span></label><select class="f" id="st-to">${nexts.map(s=>`<option value="${s}">${s}</option>`).join('')}</select></div>
    <div class="fld"><label>Comment / reason</label><input class="f" id="st-note" placeholder="Why this change"></div>
    <div class="hint">${svg(IC.jobcost)}<div>“Won” is set only through <b>Mark as Won / Convert to Project</b>, which also creates the project. It is not available here.</div></div></div>
    <div class="m-foot"><button class="btn ghost" onclick="closeModal()">Cancel</button><button class="btn" onclick="applyStatusFromModal('${tid}')">Update status</button></div></div>`);
}
function applyStatusFromModal(tid){ applyStatus(tid, val('st-to'), val('st-note')); closeModal(); }
function applyStatus(tid, to, note, silent){
  const t=TDR.tenders.find(x=>x.id===tid); if(!t||!to) return;
  if(to==='Won'){ if(!silent) toast('Use Convert to Project to mark Won'); return; }
  const allowed=(T_TRANSITIONS[t.status]||[]);
  if(!silent && !allowed.includes(to)){ return toast('Cannot move from '+t.status+' to '+to); }
  const from=t.status; t.status=to; (t.history=t.history||[]).push({ at:new Date().toISOString(), by:COMPANY.user, from, to, note:note||'' });
  tAudit(tid,'status',from+' → '+to); tSave(); if(!silent){ renderView(); toast('Status: '+to); }
}

/* ============================================================
   CRITICAL: Convert a Won tender into a fully-initialized project
   ============================================================ */
function nextJobCode(){ let m=33; (jcr.projects||[]).forEach(p=>{ const g=((p.jobCode||'').match(/(\d+)/)||[])[1]; if(g&&+g>m)m=+g; }); return 'MC '+String(m+1).padStart(3,'0'); }
function openConvert(tid){
  const t=TDR.tenders.find(x=>x.id===tid); if(!t) return;
  if(t.projectId){ return openProjectFromTender(tid); }   // idempotent: already converted
  if(!['Submitted','Under Negotiation'].includes(t.status)) return toast('Only a submitted/negotiating tender can be awarded');
  const c=tCostBreak(t);
  openModal(`<div class="modal wide">${mh('',IC.check,'Confirm Award & Convert to Project','Creates a fully-initialized project from this awarded tender')}
    <div class="m-body">
      <div class="t-award-summary">
        <div><span>Tender</span><b>${esc(t.id)} — ${esc(t.name)}</b></div><div><span>Client</span><b>${esc(t.client||'—')}</b></div>
        <div><span>Submitted bid</span><b>${t.submittedValue?jcMoney(t.submittedValue):jcMoney(c.bidValue)}</b></div>
        <div><span>Approved estimate (cost baseline)</span><b>${jcMoney(c.totalCost)}</b></div>
        <div><span>BOQ lines carried over</span><b>${(t.boq||[]).length}</b></div>
      </div>
      <div class="grid2" style="margin-top:14px">
        <div class="fld"><label>Accepted contract value (₹) <span class="req">*</span></label><input class="f" id="cv-value" type="number" step="any" value="${Math.round(t.submittedValue||c.bidValue)}"></div>
        <div class="fld"><label>Award / reference</label><input class="f" id="cv-award" placeholder="LOA / award ref"></div>
        <div class="fld"><label>Proposed project code <span class="req">*</span></label><input class="f" id="cv-code" value="${nextJobCode()}"></div>
        <div class="fld"><label>Project manager</label><input class="f" id="cv-pm" value="${esc(t.owner||COMPANY.user)}"></div>
        <div class="fld"><label>Planned start date</label><input class="f" id="cv-start" type="date" value="${esc(t.expStart||nowDate())}"></div>
        <div class="fld"><label>Expected completion</label><input class="f" id="cv-finish" type="date" value="${esc(t.expFinish||'')}"></div>
        <div class="fld col2"><label>Project site address</label><input class="f" id="cv-addr" value="${esc(t.siteAddress||'')}"></div>
      </div>
      <div class="hint">${svg(IC.projects)}<div>On confirm: a project is created in the Projects module with this BOQ as its budget baseline, the full JCR/JCL/overhead structure, and a permanent link back to this tender. The accepted contract value and the submitted bid are kept separately. Winning does <b>not</b> create POs, consumption or expenses — those happen in project execution.</div></div>
    </div>
    <div class="m-foot"><button class="btn ghost" onclick="closeModal()">Cancel</button><button class="btn" style="background:var(--green)" onclick="confirmConvert('${tid}')">Confirm award &amp; create project</button></div></div>`);
}
function confirmConvert(tid){
  const t=TDR.tenders.find(x=>x.id===tid); if(!t) return;
  // ---- idempotency guards ----
  if(t.projectId){ closeModal(); return openProjectFromTender(tid); }
  if(t._converting){ return; } t._converting=true;
  const code=val('cv-code').trim(); const cv=parseFloat(val('cv-value'))||0;
  if(!code||cv<=0){ t._converting=false; return toast('Accepted value and project code are required'); }
  if(jobCodeExists(code)){ t._converting=false; return toast('That project/job code already exists — choose another'); }
  const c=tCostBreak(t);
  const snap=JSON.stringify(jcr);   // transaction-style rollback point
  try{
    const pid='P'+Date.now().toString(36).toUpperCase();
    // carry the tender BOQ as the project's budget baseline (qty + built-up unit rate)
    const boqLines=(t.boq||[]).map((b,i)=>({ boqNo:b.itemNo||String(i+1), code:b.code, desc:b.desc, unit:b.unit||'', boqQty:(+b.qty||0)||null, boqRate:tLineRate(b)||null }));
    initProject({
      id:pid, name:t.name, jobCode:code, client:t.client, manager:val('cv-pm')||t.owner||COMPANY.user,
      address:val('cv-addr')||t.siteAddress||'', start:val('cv-start')||nowDate(), finish:val('cv-finish')||t.expFinish||'',
      expected:val('cv-finish')||t.expFinish||'', originalCV:cv, revisedCV:cv, builtUpArea:0,
      status:'In Progress', description:t.desc||'', reportingLabel:'', archived:false,
      origin:'tender', tenderId:t.id, submittedBid:(t.submittedValue||c.bidValue), baselineEstimate:c.totalCost, awardDate:nowDate()
    }, { boq: boqLines.length?boqLines:null });
    jcr.currentProjectId=pid;
    jcAudit('tender→project', t.id+' → '+code+' ('+t.name+')');
    jcSave();
    // ---- update tender (only after project committed) ----
    t.projectId=pid; t.jobCode=code; t.acceptedValue=cv; t.awardDate=nowDate();
    const from=t.status; t.status='Won';
    (t.history=t.history||[]).push({ at:new Date().toISOString(), by:COMPANY.user, from, to:'Won', note:'Awarded — project '+code+' created (ref '+(val('cv-award')||'—')+')' });
    tAudit(tid,'convert-to-project', code);
    t._converting=false; tSave();
    closeModal(); toast('Tender won — project '+code+' created & initialized');
    openProjectFromTender(tid);
  }catch(err){
    jcr=JSON.parse(snap);   // rollback project side
    t._converting=false;
    toast('Conversion failed — no project was created. '+(err&&err.message?err.message:''));
  }
}
function openProjectFromTender(tid){ const t=TDR.tenders.find(x=>x.id===tid); if(!t||!t.projectId) return toast('No linked project'); setCurProject(t.projectId); }

/* ---------- edit tender ---------- */
function openEditTender(tid){ const t=TDR.tenders.find(x=>x.id===tid);
  openModal(`<div class="modal wide">${mh('',IC.edit,'Edit Tender',esc(t.id))}
    <div class="m-body"><div class="grid2">
      <div class="fld col2"><label>Tender name</label><input class="f" id="et-name" value="${esc(t.name)}"></div>
      <div class="fld"><label>Client</label><input class="f" id="et-client" value="${esc(t.client||'')}"></div>
      <div class="fld"><label>Client reference</label><input class="f" id="et-ref" value="${esc(t.clientRef||'')}"></div>
      <div class="fld col2"><label>Contact details</label><input class="f" id="et-contact" value="${esc(t.clientContact||'')}"></div>
      <div class="fld col2"><label>Description</label><input class="f" id="et-desc" value="${esc(t.desc||'')}"></div>
      <div class="fld"><label>Deadline</label><input class="f" id="et-deadline" type="date" value="${esc(t.deadline||'')}"></div>
      <div class="fld"><label>Owner</label><input class="f" id="et-owner" value="${esc(t.owner||'')}"></div>
      <div class="fld"><label>Estimated value (₹)</label><input class="f" id="et-est" type="number" step="any" value="${t.estValue||0}"></div>
      <div class="fld"><label>Tender type</label><input class="f" id="et-type" value="${esc(t.tenderType||'')}"></div>
      <div class="fld col2"><label>Site address</label><input class="f" id="et-addr" value="${esc(t.siteAddress||'')}"></div>
      <div class="fld"><label>Expected start</label><input class="f" id="et-start" type="date" value="${esc(t.expStart||'')}"></div>
      <div class="fld"><label>Expected completion</label><input class="f" id="et-finish" type="date" value="${esc(t.expFinish||'')}"></div>
      <div class="fld col2"><label>Special conditions</label><input class="f" id="et-cond" value="${esc(t.specialConditions||'')}"></div>
      <div class="fld col2"><label>Notes</label><input class="f" id="et-notes" value="${esc(t.notes||'')}"></div>
    </div></div>
    <div class="m-foot"><button class="btn ghost" onclick="closeModal()">Cancel</button><button class="btn" onclick="submitEditTender('${tid}')">Save</button></div></div>`);
}
function submitEditTender(tid){ const t=TDR.tenders.find(x=>x.id===tid);
  Object.assign(t,{ name:val('et-name')||t.name, client:val('et-client'), clientRef:val('et-ref'), clientContact:val('et-contact'), desc:val('et-desc'),
    deadline:val('et-deadline'), owner:val('et-owner'), estValue:parseFloat(val('et-est'))||0, tenderType:val('et-type'),
    siteAddress:val('et-addr'), expStart:val('et-start'), expFinish:val('et-finish'), specialConditions:val('et-cond'), notes:val('et-notes') });
  tAudit(tid,'edit-tender',t.name); tSave(); closeModal(); renderView(); toast('Tender updated'); }

/* ---------- CSV helper ---------- */
function tDownloadCSV(name, rows){ const esc=v=>{ v=v==null?'':String(v); return /[",\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v; };
  const csv=rows.map(r=>r.map(esc).join(',')).join('\n'); const blob=new Blob([csv],{type:'text/csv'}); const a=document.createElement('a');
  a.href=URL.createObjectURL(blob); a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000); }
