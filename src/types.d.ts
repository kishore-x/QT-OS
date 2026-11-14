/* ============================================================
   Material Transfer & Inventory Tracking System — types
   Everything is ledger-driven: location balances are computed
   from MOVEMENTS, never stored directly.

   Non-physical (virtual) locations used in the ledger:
     OPENING  -> source of opening balances (stock coming in)
     TRANSIT  -> dispatched, not yet confirmed at destination
     DAMAGED  -> received but damaged (sink)
     LOSS     -> short / lost in transit, written off on resolution (sink)
   ============================================================ */

type Role = 'purchase' | 'store' | 'site';    // Purchase Manager (HO) / Store Manager / Site Manager
type LocType = 'store' | 'site';
type DocType = 'DC' | 'MTN';
type TransferStatus =
  | 'DRAFT' | 'PENDING' | 'PARTIAL' | 'RECEIVED' | 'CLOSED' | 'CANCELLED';
type MoveType = 'OPEN' | 'DISPATCH' | 'RECEIPT' | 'DAMAGE' | 'SHORT' | 'ADJUST' | 'PURCHASE';

interface Material {
  code: string;            // unique
  name: string;
  category: string;
  unit: string;            // UOM
  description?: string;
  active: boolean;
}

interface StockLocation {
  id: string;              // unique
  code: string;
  name: string;
  type: LocType;
  person?: string;         // responsible person
  contact?: string;
  address?: string;
  active: boolean;
}

/** Immutable stock-ledger entry. One physical unit flow. */
interface Movement {
  id: string;
  code: string;            // material code
  qty: number;
  from: string;            // location id OR virtual (OPENING/TRANSIT/DAMAGED/LOSS)
  to: string;
  type: MoveType;
  ref: string;             // reference (transfer id, "Opening", etc.)
  person: string;          // who entered it
  txnDate: string;         // actual transaction date (user-entered)
  date: string;            // system entry date
  time: string;            // system entry time
}

interface TransferItem {
  code: string;
  qty: number;             // dispatched quantity
  remarks?: string;
}

interface Transfer {
  id: string;              // internal transfer number (TR-xxxx)
  docType: DocType;
  docNo: string;           // customer DC / MTN number
  txnDate: string;         // actual transfer date
  from: string;            // source location id
  to: string;              // destination location id
  remarks?: string;
  status: TransferStatus;  // stored, but always reconciled from receipts on load
  items: TransferItem[];
  createdBy: string;
  createdAt: string;
  dispatchedBy?: string;
  dispatchedAt?: string;
}

interface ReceiptItem {
  code: string;
  accepted: number;
  damaged: number;
  short: number;           // reported not-arrived at this receipt
  remarks?: string;
}

interface Receipt {
  id: string;
  transferId: string;
  receiptNo: string;
  receivedBy: string;
  txnDate: string;         // actual receipt date
  confirmedAt: string;     // system timestamp
  remarks?: string;
  items: ReceiptItem[];
}

type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

interface RequestItem {
  code: string;
  qty: number;             // requested quantity
  approvedQty?: number;    // set by store on approval (may differ)
}

interface MaterialRequest {
  id: string;              // REQ-xxxx
  requestedBy: string;
  txnDate: string;         // request date
  remarks?: string;
  status: RequestStatus;
  items: RequestItem[];
  createdAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNote?: string;
  transferId?: string;     // transfer auto-created on approval
}

interface Settings {
  company: string;
  user: string;
  role: Role;
  lowStock: number;        // low-stock alert threshold
  readNotes?: string[];    // receipt ids whose site remark the store has seen
}

interface MTState {
  materials: Material[];
  locations: StockLocation[];
  requests: MaterialRequest[];
  transfers: Transfer[];
  receipts: Receipt[];
  movements: Movement[];
  settings: Settings;
}

interface Window {
  qtDeferBoot?: boolean;
  _tt?: ReturnType<typeof setTimeout>;
  boot?: () => void;
}
