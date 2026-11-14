/* ============================================================
   Material Transfer & Inventory Tracking System — seed data
   Phase 1 pilot: ONE Central Store + ONE Pilot Site.
   Balances are computed from MOVEMENTS; opening stock is seeded
   as OPENING -> location ledger entries so the demo starts with
   realistic numbers while staying 100% ledger-driven.
   ============================================================ */
'use strict';

const CENTRAL = 'CST-01';
const SITE = 'SITE-01';

const SEED_MATERIALS: Material[] = [
  { code:'MAT-001', name:'TMT Steel Bar 12mm', category:'Steel',    unit:'kg',  active:true },
  { code:'MAT-002', name:'TMT Steel Bar 16mm', category:'Steel',    unit:'kg',  active:true },
  { code:'MAT-003', name:'OPC Cement 53 Grade', category:'Cement',  unit:'bag', active:true },
  { code:'MAT-004', name:'PPC Cement',          category:'Cement',  unit:'bag', active:true },
  { code:'MAT-005', name:'River Sand',          category:'Aggregate',unit:'m³', active:true },
  { code:'MAT-006', name:'20mm Blue Metal',     category:'Aggregate',unit:'m³', active:true },
  { code:'MAT-007', name:'AAC Block 600x200x100',category:'Block',  unit:'nos', active:true },
  { code:'MAT-008', name:'Copper Wire 2.5sqmm', category:'Electrical',unit:'m', active:true },
  { code:'MAT-009', name:'PVC Pipe 4 inch',     category:'Plumbing',unit:'m',   active:true },
  { code:'MAT-010', name:'Binding Wire 18 SWG', category:'Steel',   unit:'kg',  active:true },
  { code:'MAT-011', name:'Shuttering Ply 12mm', category:'Shuttering',unit:'nos',active:true },
  { code:'MAT-012', name:'Safety Helmet',       category:'Safety',  unit:'nos', active:true },
];

const SEED_LOCATIONS: StockLocation[] = [
  { id:CENTRAL, code:'LOC-001', name:'Central Store', type:'store',
    person:'R. Suresh',   contact:'+91 98400 10001', address:'Main Yard, Chennai', active:true },
  { id:SITE,    code:'LOC-002', name:'Pilot Site',    type:'site',
    person:'M. Mariappan', contact:'+91 98400 10002', address:'Project Site 1',    active:true },
];

/* opening balances: material -> [centralQty, siteQty] */
const SEED_OPENING: Record<string, [number, number]> = {
  'MAT-001': [5000, 400], 'MAT-002': [4200, 250], 'MAT-003': [800, 60],
  'MAT-004': [500, 0],    'MAT-005': [120, 8],    'MAT-006': [90, 6],
  'MAT-007': [3200, 150], 'MAT-008': [6000, 300], 'MAT-009': [900, 40],
  'MAT-010': [600, 30],   'MAT-011': [240, 12],   'MAT-012': [150, 20],
};

function buildOpeningMovements(): Movement[] {
  const mv: Movement[] = [];
  let n = 0;
  const d = '2026-11-01';
  for (const code in SEED_OPENING) {
    const [c, s] = SEED_OPENING[code];
    if (c > 0) mv.push({ id:'MV-'+(1000+ ++n), code, qty:c, from:'OPENING', to:CENTRAL, type:'OPEN', ref:'Opening balance', person:'R. Suresh', txnDate:d, date:d, time:'09:00' });
    if (s > 0) mv.push({ id:'MV-'+(1000+ ++n), code, qty:s, from:'OPENING', to:SITE,    type:'OPEN', ref:'Opening balance', person:'R. Suresh', txnDate:d, date:d, time:'09:00' });
  }
  return mv;
}

const SEED: MTState = {
  materials: SEED_MATERIALS,
  locations: SEED_LOCATIONS,
  requests: [],
  transfers: [],
  receipts: [],
  movements: buildOpeningMovements(),
  settings: {
    company: 'Material Transfer & Inventory Tracking',
    user: 'Mariappan',
    role: 'store',
    lowStock: 50,
    readNotes: [],
  },
};
