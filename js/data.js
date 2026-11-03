/* ============================================================
   Qualtech Engineers — Inventory seed data
   Everything is ledger-driven: balances are computed from MOVEMENTS,
   never stored directly. Special (non-physical) locations:
     OPENING / VENDOR  -> external sources (stock coming in)
     CONSUMED / OUT    -> sinks (stock leaving)
     TRANSIT           -> dispatched, not yet received
   ============================================================ */

const COMPANY = { name: 'Qualtech Engineers Pvt. Ltd.', tagline: 'Engineering Excellence. Built to Last.', user: 'R. Suresh', role: 'Project Director' };

const CATEGORIES = ['Cement','Steel','Concrete','Block','Shuttering','Scaffolding','Safety Equipment','Aggregate','Electrical','Plumbing','Finishing','Container','Equipment'];

const LOCATIONS = [
  { id:'WH-MAIN',   name:'Main Warehouse',   type:'warehouse', note:'Central Stock Location' },
  { id:'ST-SKCL',   name:'SKCL Square',      type:'site' },
  { id:'ST-NEWRY',  name:'Newry Apartments', type:'site' },
  { id:'ST-ASHOK',  name:'Ashok Leyland',    type:'site' },
  { id:'ST-SASTRA', name:'Sastra University',type:'site' },
  { id:'ST-HEBBAL', name:'Hebbal Residence', type:'site' },
];

// headline "total items" shown on each location card (matches the reference)
const LOC_TOTALS = { 'WH-MAIN':14210, 'ST-SKCL':8234, 'ST-NEWRY':3508, 'ST-ASHOK':2374, 'ST-SASTRA':3603, 'ST-HEBBAL':2251 };

const VENDORS = [
  { id:'V-01', name:'Chettinad Cement',  gstin:'33AAACC1234A1Z5', phone:'+91 98400 11001' },
  { id:'V-02', name:'JSW Steel',         gstin:'33AAACJ5678B1Z2', phone:'+91 98400 11002' },
  { id:'V-03', name:'RDC Concrete',      gstin:'33AAACR9012C1Z8', phone:'+91 98400 11003' },
  { id:'V-04', name:'Supreme Shuttering',gstin:'33AAACS3456D1Z4', phone:'+91 98400 11004' },
  { id:'V-05', name:'Ultra Safety Mart', gstin:'33AAACU7890E1Z1', phone:'+91 98400 11005' },
];

// filler SKUs so the master totals 126 items (realistic construction store)
function buildFiller(){
  const cc={Cement:'CEM',Steel:'STL',Concrete:'CON',Block:'BLK',Shuttering:'SHT',Scaffolding:'SCF','Safety Equipment':'SFT',Aggregate:'AGG',Electrical:'ELE',Plumbing:'PLB',Finishing:'FIN',Equipment:'EQP'};
  const fam=[
    ['TMT Bar','Steel','kg',['10 mm','20 mm','25 mm','28 mm','32 mm'],[67,65,65,64,64],1000],
    ['MS Angle','Steel','kg',['40x40','50x50','65x65','75x75'],[72,72,70,70],800],
    ['MS Flat','Steel','kg',['25x5','40x6','50x6'],[74,73,72],800],
    ['Binding wire','Steel','kg',['18 SWG','20 SWG'],[88,92],500],
    ['Welding rod','Steel','kg',['2.5 mm','3.15 mm'],[92,95],100],
    ['GI Pipe','Plumbing','m',['15 mm','20 mm','25 mm','32 mm','40 mm','50 mm'],[120,160,210,280,360,460],300],
    ['PVC Pipe','Plumbing','m',['1/2"','3/4"','1"','1.5"','2"','3"','4"'],[45,60,85,120,180,260,360],300],
    ['CPVC Fitting','Plumbing','nos',['Elbow','Tee','Coupler','Reducer'],[28,34,22,30],400],
    ['Ball valve','Plumbing','nos',['1/2"','3/4"','1"'],[180,240,340],60],
    ['Gate valve','Plumbing','nos',['1"','1.5"','2"'],[320,460,680],40],
    ['Wire','Electrical','m',['1.0 sqmm','1.5 sqmm','2.5 sqmm','4 sqmm','6 sqmm'],[18,26,40,62,92],500],
    ['MCB','Electrical','nos',['6A','16A','32A','63A'],[210,230,320,520],100],
    ['Modular switch','Electrical','nos',['1-way','2-way','Socket 6A','Socket 16A'],[85,110,95,140],150],
    ['LED light','Electrical','nos',['9W bulb','20W tube','50W flood','100W flood'],[95,230,680,1250],80],
    ['Conduit','Electrical','m',['20 mm','25 mm'],[36,44],500],
    ['Scaffold clamp','Scaffolding','nos',['Fixed','Swivel','Sleeve'],[85,110,70],400],
    ['Base jack','Scaffolding','nos',['Fixed','Adjustable'],[260,340],200],
    ['Cuplock ledger','Scaffolding','nos',['1.2 m','1.8 m','2.5 m'],[480,640,820],150],
    ['Scaffold board','Scaffolding','nos',['3 m'],[640],120],
    ['Shuttering ply','Shuttering','sheet',['8 mm','16 mm'],[1050,1650],40],
    ['Runner','Shuttering','nos',['2 m','3 m'],[380,540],100],
    ['Shuttering oil','Shuttering','ltr',['Drum 20L'],[140],60],
    ['Cement','Cement','bag',['OPC 43','White cement','Rapid hardening'],[405,780,520],150],
    ['Admixture','Concrete','ltr',['Plasticizer','Accelerator','Retarder'],[95,120,110],200],
    ['Curing compound','Concrete','ltr',['Drum 50L'],[160],60],
    ['Cover block','Concrete','nos',['25 mm','40 mm','50 mm'],[3,4,5],2000],
    ['AAC block','Block','nos',['4 inch','6 inch'],[48,62],1000],
    ['Brick','Block','nos',['Red clay','Fly ash'],[8,7],5000],
    ['River sand','Aggregate','cum',['Fine','Coarse'],[1600,1500],60],
    ['Aggregate','Aggregate','cum',['12 mm','40 mm'],[1250,1200],60],
    ['Tile adhesive','Finishing','bag',['Standard','Premium'],[360,520],80],
    ['Primer','Finishing','ltr',['Wall','Metal'],[180,260],80],
    ['Emulsion paint','Finishing','ltr',['Interior','Exterior'],[220,340],100],
    ['Enamel paint','Finishing','ltr',['4 ltr pack'],[720],60],
    ['Safety','Safety Equipment','nos',['Gloves','Goggles','Harness','Jacket'],[60,120,850,240],50],
    ['Cutting disc','Equipment','nos',['4 inch','7 inch'],[45,85],100],
    ['Vibrator needle','Equipment','nos',['40 mm','60 mm'],[3200,3800],2],
    ['Drill machine','Equipment','nos',['13 mm'],[4200],2],
    ['Angle grinder','Equipment','nos',['4 inch'],[2800],2],
    ['Wheelbarrow','Equipment','nos',['Standard'],[2400],3],
  ];
  const seq={}; const out=[];
  fam.forEach(f=>{ const [pfx,cat,unit,vars,rates,reorder]=f; vars.forEach((v,i)=>{
    const c=cc[cat]||'MSC'; seq[c]=(seq[c]||100)+1; const code=c+'-'+seq[c]; const rate=rates[i]||rates[0];
    const type = cat==='Equipment'?'equipment':'material';
    let open; if(rate>3000) open=2+(out.length%4); else if(unit==='cum') open=30+((out.length*7)%50); else if(unit==='bag'||unit==='ltr') open=80+((out.length*11)%180); else if(unit==='sheet') open=40+(out.length%40); else open=150+((out.length*13)%650);
    out.push({code,name:pfx+' '+v,category:cat,unit,rate,reorder,type,open});
  }); });
  return out.slice(0,101);
}

// Item master — unique code per material / container / equipment.
// First 10 match the reference page-1 exactly (order, on-hand, reserved, value).
const ITEMS = [
  { code:'CEM-001', name:'OPC 53 Cement',          category:'Cement',          unit:'bag',   rate:415,    reorder:200, type:'material'  },
  { code:'CEM-002', name:'PPC Cement',             category:'Cement',          unit:'bag',   rate:390,    reorder:150, type:'material'  },
  { code:'STL-008', name:'TMT Bar 8 mm',           category:'Steel',           unit:'kg',    rate:68,     reorder:1000,type:'material'  },
  { code:'STL-012', name:'TMT Bar 12 mm',          category:'Steel',           unit:'kg',    rate:66,     reorder:1000,type:'material'  },
  { code:'BLK-006', name:'Solid block 6"',         category:'Block',           unit:'nos',   rate:156,    reorder:500, type:'material'  },
  { code:'PLY-012', name:'Shuttering ply 12 mm',   category:'Shuttering',      unit:'sheet', rate:297000/70,  reorder:40,  type:'material'  },
  { code:'SCF-003', name:'Cuplock vertical 3 m',   category:'Scaffolding',     unit:'nos',   rate:532000/340, reorder:150, type:'material'  },
  { code:'SFT-001', name:'Safety helmet',          category:'Safety Equipment',unit:'nos',   rate:24200/80,   reorder:50,  type:'material'  },
  { code:'CNR-003', name:'MS Container (20 ft)',   category:'Container',       unit:'nos',   rate:90000,  reorder:3,   type:'container' },
  { code:'EQP-010', name:'Concrete Vibrator',      category:'Equipment',       unit:'nos',   rate:40000,  reorder:1,   type:'equipment' },
  { code:'STL-016', name:'TMT Bar 16 mm',          category:'Steel',           unit:'kg',    rate:65,     reorder:1000,type:'material'  },
  { code:'RMC-025', name:'Ready-mix concrete M25', category:'Concrete',        unit:'cum',   rate:5600,   reorder:50,  type:'material'  },
  { code:'RMC-030', name:'Ready-mix concrete M30', category:'Concrete',        unit:'cum',   rate:5900,   reorder:40,  type:'material'  },
  { code:'BLK-004', name:'Solid block 4"',         category:'Block',           unit:'nos',   rate:42,     reorder:500, type:'material'  },
  { code:'SCF-001', name:'Scaffold pipe 3 m',      category:'Scaffolding',     unit:'nos',   rate:620,    reorder:200, type:'material'  },
  { code:'SFT-002', name:'Safety shoes',           category:'Safety Equipment',unit:'pair',  rate:850,    reorder:40,  type:'material'  },
  { code:'AGG-002', name:'M-Sand',                 category:'Aggregate',       unit:'cum',   rate:1400,   reorder:60,  type:'material'  },
  { code:'AGG-005', name:'20 mm Aggregate',        category:'Aggregate',       unit:'cum',   rate:1250,   reorder:60,  type:'material'  },
  { code:'ELE-014', name:'PVC conduit 25 mm',      category:'Electrical',      unit:'m',     rate:38,     reorder:500, type:'material'  },
  { code:'PLB-009', name:'CPVC pipe 1"',           category:'Plumbing',        unit:'m',     rate:95,     reorder:300, type:'material'  },
  { code:'FIN-003', name:'Wall putty',             category:'Finishing',       unit:'bag',   rate:720,    reorder:80,  type:'material'  },
  { code:'CNR-004', name:'Site office cabin',      category:'Container',       unit:'nos',   rate:125000, reorder:1,   type:'container' },
  { code:'EQP-022', name:'Generator 62.5 KVA',     category:'Equipment',       unit:'nos',   rate:420000, reorder:1,   type:'equipment' },
  { code:'EQP-045', name:'Bar bending machine',    category:'Equipment',       unit:'nos',   rate:85000,  reorder:1,   type:'equipment' },
  { code:'EQP-052', name:'Plate compactor',        category:'Equipment',       unit:'nos',   rate:65000,  reorder:2,   type:'equipment' },
].concat(buildFiller());

// ---- Opening balances → generated as OPENING movements -------------------
// Base qty at Main Warehouse per item + a share pushed to the 5 sites.
// page-1 openings chosen so on-hand (after recent movements) matches the reference exactly:
//   CEM-001 160 (+500 in = 660) · STL-012 2980 (-1000 transfer = 1980) · BLK-006 1100 (-300 out = 800)
const OPENING_WH = {
  'CEM-001':160,'CEM-002':330,'STL-008':1760,'STL-012':2980,'BLK-006':1100,'PLY-012':70,'SCF-003':340,'SFT-001':80,'CNR-003':2,'EQP-010':3,
  'STL-016':2800,'RMC-025':42,'RMC-030':30,'BLK-004':600,'SCF-001':1200,'SFT-002':60,'AGG-002':120,'AGG-005':140,
  'ELE-014':900,'PLB-009':600,'FIN-003':150,'CNR-004':3,'EQP-022':2,'EQP-045':2,'EQP-052':3,
};
// site -> fraction of WH base distributed (keeps sites smaller, Main Warehouse largest)
const SITE_SHARE = { 'ST-SKCL':0.55, 'ST-NEWRY':0.42, 'ST-ASHOK':0.32, 'ST-SASTRA':0.24, 'ST-HEBBAL':0.15 };

function buildOpeningMovements(){
  const ms = []; let n = 1;
  ITEMS.forEach(it=>{
    const base = (OPENING_WH[it.code] != null ? OPENING_WH[it.code] : (it.open || 0));
    if(base>0){ ms.push({ id:'OPN-'+String(n++).padStart(4,'0'), date:'2026-10-01', time:'09:00', code:it.code, qty:base, from:'OPENING', to:'WH-MAIN', type:'IN', ref:'Opening balance', project:'', person:'System' }); }
    if(base<=0) return;
    Object.keys(SITE_SHARE).forEach((site,i)=>{
      // skip a couple of (item, site) combos so the matrix looks real, but never zero out a site
      const skip = (it.code.charCodeAt(5)+i) % 5 === 0;
      if(skip) return;
      const q = Math.max(1, Math.round(base * SITE_SHARE[site]));
      ms.push({ id:'OPN-'+String(n++).padStart(4,'0'), date:'2026-10-01', time:'09:00', code:it.code, qty:q, from:'OPENING', to:site, type:'IN', ref:'Opening balance', project:'', person:'System' });
    });
  });
  return ms;
}

// ---- Recent transactional movements (drive the activity feed) ------------
const RECENT_MOVEMENTS = [
  { id:'MV-1007', date:'2026-10-23', time:'10:45', code:'CEM-001', qty:500, from:'VENDOR',  to:'WH-MAIN',  type:'IN',       source:'Chettinad Cement', ref:'INV/CC/8841', project:'', person:'K. Prakash' },
  { id:'MV-1006', date:'2026-10-23', time:'09:20', code:'STL-012', qty:1000,from:'WH-MAIN', to:'ST-SKCL',  type:'TRANSFER', ref:'TRF-0142', project:'', person:'R. Suresh', transferTo:'ST-SKCL', transferId:'TRF-0142', fromLoc:'WH-MAIN', received:true },
  { id:'MV-1005', date:'2026-10-22', time:'16:15', code:'BLK-006', qty:300, from:'WH-MAIN', to:'ST-NEWRY', type:'OUT',      ref:'ISS-0093', project:'ST-NEWRY', person:'M. Arjun' },
  { id:'MV-1004', date:'2026-10-22', time:'11:30', code:'RMC-025', qty:10,  from:'WH-MAIN', to:'CONSUMED', type:'CONSUME',  ref:'CONS-0081', project:'ST-ASHOK', person:'S. Ganesan', activity:'Foundation' },
];

// ---- Reservations (populate the Reserved column, like the reference) ------
const RESERVATIONS = [
  { id:'RSV-0040', date:'2026-10-22', code:'CEM-001', qty:40,   location:'WH-MAIN', project:'ST-SKCL',   person:'R. Suresh', status:'active', note:'Plaster works' },
  { id:'RSV-0039', date:'2026-10-22', code:'CEM-002', qty:20,   location:'WH-MAIN', project:'ST-NEWRY',  person:'R. Suresh', status:'active', note:'Block work' },
  { id:'RSV-0038', date:'2026-10-21', code:'STL-008', qty:200,  location:'WH-MAIN', project:'ST-ASHOK',  person:'R. Suresh', status:'active', note:'Slab reinforcement' },
  { id:'RSV-0037', date:'2026-10-21', code:'STL-012', qty:300,  location:'WH-MAIN', project:'ST-SKCL',   person:'R. Suresh', status:'active', note:'Beam reinforcement' },
  { id:'RSV-0036', date:'2026-10-20', code:'BLK-006', qty:100,  location:'WH-MAIN', project:'ST-NEWRY',  person:'R. Suresh', status:'active', note:'Partition walls' },
  { id:'RSV-0035', date:'2026-10-20', code:'PLY-012', qty:20,   location:'WH-MAIN', project:'ST-SKCL',   person:'R. Suresh', status:'active', note:'Slab shuttering' },
  { id:'RSV-0034', date:'2026-10-20', code:'SFT-001', qty:5,    location:'WH-MAIN', project:'ST-HEBBAL', person:'R. Suresh', status:'active', note:'New crew' },
  { id:'RSV-0033', date:'2026-10-19', code:'CNR-003', qty:1,    location:'WH-MAIN', project:'ST-SASTRA', person:'R. Suresh', status:'active', note:'Store container' },
  { id:'RSV-0031', date:'2026-10-19', code:'STL-016', qty:2000, location:'WH-MAIN', project:'ST-SASTRA', person:'R. Suresh', status:'active', note:'Column reinforcement' },
  { id:'RSV-0027', date:'2026-10-21', code:'CNR-004', qty:1,    location:'WH-MAIN', project:'ST-HEBBAL', person:'V. Kumar',  status:'active', note:'Site office cabin', time:'15:10' },
];

// ---- Purchase orders -----------------------------------------------------
const PURCHASE_ORDERS = [
  { id:'PO-2026-045', date:'2026-10-22', vendorId:'V-02', status:'Sent',     deliverTo:'WH-MAIN', lines:[{code:'STL-012', qty:5000, rate:66},{code:'STL-016', qty:3000, rate:65}] },
  { id:'PO-2026-044', date:'2026-10-20', vendorId:'V-01', status:'Received', deliverTo:'WH-MAIN', lines:[{code:'CEM-001', qty:500,  rate:415}] },
  { id:'PO-2026-043', date:'2026-10-18', vendorId:'V-03', status:'Draft',    deliverTo:'ST-ASHOK',lines:[{code:'RMC-030', qty:60,   rate:5900}] },
];

const SEED = {
  movements: [].concat(buildOpeningMovements(), RECENT_MOVEMENTS),
  reservations: RESERVATIONS.slice(),
  purchaseOrders: PURCHASE_ORDERS.slice(),
  items: ITEMS.slice(),
  locations: LOCATIONS.slice(),
  vendors: VENDORS.slice(),
};
