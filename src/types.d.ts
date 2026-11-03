/* ============================================================
   Qualtech OS — shared data types
   These describe every record the app stores. They are global
   (no import/export) because the app runs as plain browser
   scripts that share one global scope.
   ============================================================ */

/* ---------- Inventory ---------- */

type ItemType = 'material' | 'equipment';

interface Item {
  code: string;
  name: string;
  category: string;
  unit: string;
  rate: number;
  reorder: number;
  type: ItemType | string;
  /** opening stock used only when seeding */
  open?: number;
}

type LocationType = 'warehouse' | 'site';

interface StockLocation {
  id: string;
  name: string;
  type: LocationType | string;
  note?: string;
}

interface Vendor {
  id: string;
  name: string;
  gstin: string;
  phone: string;
}

type MovementType = 'IN' | 'OUT' | 'TRANSFER' | 'CONSUME' | 'RESERVE';

/** One line of the stock ledger. Balances are always computed from these. */
interface Movement {
  id?: string;
  date?: string;
  time?: string;
  code: string;
  qty: number;
  /** location id, or OPENING / VENDOR / TRANSIT */
  from: string;
  /** location id, or CONSUMED / OUT / TRANSIT */
  to: string;
  type: MovementType | string;
  ref?: string;
  project?: string;
  person?: string;
  source?: string;
  transferTo?: string;
  transferId?: string;
  fromLoc?: string;
  received?: boolean;
  activity?: string;
}

interface Reservation {
  id: string;
  date: string;
  time?: string;
  code: string;
  qty: number;
  location: string;
  project: string;
  person: string;
  status: string;
  note: string;
}

interface StockPOLine { code: string; qty: number; rate: number; }

interface StockPurchaseOrder {
  id: string;
  date: string;
  vendorId: string;
  status: string;
  deliverTo: string;
  lines: StockPOLine[];
}

interface InventoryState {
  movements: Movement[];
  reservations: Reservation[];
  purchaseOrders: StockPurchaseOrder[];
  items: Item[];
  locations: StockLocation[];
  vendors: Vendor[];
}

/* ---------- Job cost (JCR / JCL) ---------- */

interface Project {
  id: string;
  name: string;
  jobCode: string;
  client: string;
  manager: string;
  address: string;
  builtUpArea: number;
  start: string;
  finish: string;
  expected: string;
  originalCV: number;
  revisedCV: number;
  status: string;
  description: string;
  reportingLabel: string;
  archived: boolean;
  origin?: string;
}

interface CostCode { code: string; desc: string; }

type CostCategory = 'Materials' | 'Labour' | 'Consumables' | string;

interface CostEntry {
  id: string;
  projectId: string;
  category: CostCategory;
  date: string;
  billNo?: string;
  pf?: string;
  pt?: string;
  desc: string;
  code: string;
  head: string;
  unit: string;
  qty: number;
  rate: number;
  amount: number;
  source: string;
  archived?: boolean;
  createdBy: string;
  createdAt?: string;
}

interface Consumable {
  projectId: string;
  code: string;
  desc: string;
  unit: string;
  receipt: number;
  rate: number | null;
  recAmt: number;
  issue: number | null;
  issAmt: number;
  stock: number;
  stkAmt: number;
}

interface Overhead {
  projectId: string;
  code: string;
  desc: string;
  uptoLast: number;
  thisMonth: number;
  jsd?: number | null;
  etc: number;
  revised: number;
}

interface BoqLine {
  id: string;
  projectId: string;
  boqNo: string;
  code: string;
  desc: string;
  unit: string;
  boqQty: number | null;
  boqRate: number | null;
  revQty: number | null;
  revRate?: number | null;
  archived: boolean;
}

interface AuditEntry {
  at: string;
  by: string;
  action: string;
  detail: string;
  /** record id the action applies to (procurement) */
  id?: string;
  /** tender id the action applies to */
  tid?: string;
}

interface JobCostState {
  projects: Project[];
  currentProjectId: string;
  costCodes: CostCode[];
  entries: CostEntry[];
  consumables: Consumable[];
  overheads: Overhead[];
  boq: BoqLine[];
  audit: AuditEntry[];
  reporting: string;
}

/* ---------- Tenders ---------- */

type TenderStatus =
  | 'Draft' | 'Under Review' | 'Estimation in Progress' | 'Awaiting Approval'
  | 'Approved for Submission' | 'Submitted' | 'Under Negotiation'
  | 'Won' | 'Lost' | 'Withdrawn';

interface TenderBoqLine {
  id?: string;
  itemNo?: string;
  desc: string;
  code: string;
  unit: string;
  qty: number;
  matRate: number;
  labRate: number;
  subRate: number;
  eqpRate: number;
  otherRate: number;
}

interface TenderQuote {
  id: string;
  vendorId: string;
  /** free-text vendor name from CSV imports */
  vendorName?: string;
  item: string;
  unit: string;
  price: number;
  validity: string;
  delivery: string;
  terms: string;
  selected: boolean;
}

interface TenderPricing {
  overheadPct: number;
  contingencyPct: number;
  markupPct: number;
  taxPct: number;
}

interface TenderVersion {
  ver: number;
  at: string;
  by: string;
  direct: number;
  totalCost: number;
  bidValue: number;
  profit: number;
  margin: number;
  note: string;
}

interface StatusChange { at: string; by: string; from: string; to: string; note: string; }

interface Tender {
  id: string;
  name: string;
  client: string;
  clientContact: string;
  clientRef: string;
  desc: string;
  receivedDate: string;
  deadline: string;
  owner: string;
  status: TenderStatus | string;
  estValue: number;
  siteAddress: string;
  expStart: string;
  expFinish: string;
  tenderType: string;
  specialConditions: string;
  notes: string;
  boq: TenderBoqLine[];
  quotes: TenderQuote[];
  pricing: TenderPricing;
  versions: TenderVersion[];
  submittedValue: number | null;
  submittedDate: string | null;
  docs: { id: string; name: string; type: string; at: string }[];
  approvals: { at: string; by: string; decision: string; note: string }[];
  history: StatusChange[];
  projectId: string | null;
  jobCode: string | null;
  awardDate: string | null;
  acceptedValue: number | null;
  archived: boolean;
  /** manual direct-cost figure that replaces the BOQ total when set */
  directOverride?: { on: boolean; mat: number; lab: number; subEqp: number } | null;
  /** UI-only flag while the convert-to-project dialog is open */
  _converting?: any;
}

interface TenderState {
  tenders: Tender[];
  audit: AuditEntry[];
  counter: number;
}

/* ---------- Procurement (material requests → POs) ---------- */

type MRStatus =
  | 'Submitted' | 'Under Review' | 'Approved' | 'Rejected' | 'PO Raised'
  | 'Partially Delivered' | 'Delivered' | 'Closed' | 'Cancelled';

interface MRLine {
  id: string;
  code: string;
  desc: string;
  unit: string;
  qty: number;
  approvedQty: number | null;
  poQty: number;
  recdQty: number;
  note: string;
}

interface MRQuote {
  id: string;
  code: string;
  vendorId: string;
  rate: number;
  validity: string;
  selected: boolean;
}

interface MaterialRequest {
  id: string;
  projectId: string;
  site: string;
  requestedBy: string;
  date: string;
  neededBy: string;
  priority: 'Normal' | 'Urgent' | 'Critical' | string;
  status: MRStatus | string;
  lines: MRLine[];
  quotes: MRQuote[];
  notes: string;
  history: StatusChange[];
  poIds: string[];
}

interface POLine {
  code: string;
  desc: string;
  unit: string;
  qty: number;
  rate: number;
  recdQty: number;
}

interface GoodsReceipt {
  at: string;
  by: string;
  grnNo: string;
  date: string;
  lines: { code: string; qty: number; [k: string]: unknown }[];
}

interface PurchaseOrder {
  id: string;
  mrId: string;
  vendorId: string;
  date: string;
  expectedDate: string;
  deliverTo: string;
  status: string;
  lines: POLine[];
  receipts: GoodsReceipt[];
  notes?: string;
}

interface ProcurementState {
  requests: MaterialRequest[];
  pos: PurchaseOrder[];
  audit: AuditEntry[];
}

/* ---------- Billing ---------- */

type BillType = 'quotation' | 'cpo' | 'vpo' | 'invoice';

interface BillLine {
  desc: string;
  cat: string;
  qty: number;
  rate: number;
  tax: number;
  use: boolean;
}

interface BillDoc {
  id: string;
  type: BillType | string;
  number: string;
  party: string;
  partyId: string;
  subject: string;
  poNumber: string;
  /** id of the quotation this document was raised from */
  ref?: string;
  date: string;
  dueDate: string;
  terms: string;
  lines: BillLine[];
  status: string;
  createdAt: string;
  createdBy: string;
}

interface BillingState {
  docs: BillDoc[];
}

/** one row of a CSV export */
type CsvRow = (string | number | null | undefined)[];

/* ---------- browser globals the app stashes on window ---------- */

interface Window {
  _tt?: ReturnType<typeof setTimeout>;
  _histRender?: (...args: any[]) => any;
  _rateRecs?: any[];
  /** set by sync.ts: it starts the app itself once all scripts load */
  qtDeferBoot?: boolean;
}
