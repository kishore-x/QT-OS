# QT-OS — Material Transfer & Inventory Tracking System

A lightweight, ledger-driven system to track materials moving from a **Central Store** to a **project Site**, using document references (DC / MTN numbers) and **receiving-site confirmation**. Built for a Phase‑1 pilot: **one Central Store → one Pilot Site**, with an architecture that scales to more sites later.

> **Core rule:** Destination (site) stock **never increases until the receiving site confirms what actually arrived.** Dispatching moves stock from the store into a virtual *In‑Transit* account; receipt moves the *accepted* quantity into the site.

---

## Table of contents
- [What it does](#what-it-does)
- [Key concepts](#key-concepts)
- [Modules](#modules)
- [Roles](#roles)
- [The end-to-end flow](#the-end-to-end-flow)
- [Inventory & ledger logic](#inventory--ledger-logic)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Project structure](#project-structure)
- [Data model](#data-model)
- [Excel / CSV import format](#excel--csv-import-format)
- [Configuration](#configuration)
- [Deployment](#deployment)

---

## What it does

The application answers five questions:

1. **What** materials exist? (Material master)
2. **Where** is each material right now? (Current Stock: store / in‑transit / site)
3. **Which** transfers have happened and in what state?
4. **Which** transfers are awaiting receiving confirmation?
5. **How much** was actually accepted at the destination — and **what was lost** (damaged / short)?

Everything is **ledger-driven**: location balances are *computed* from an immutable movement ledger, never edited directly. This guarantees a full, reconcilable audit trail of every unit.

---

## Key concepts

| Concept | Meaning |
|---|---|
| **Movement ledger** | The single source of truth. Every stock change is an append-only entry. Balances are summed from it. |
| **In‑Transit** | A virtual account holding goods that left the store but aren't yet confirmed at the site. |
| **Dispatch** | Store → In‑Transit. Reduces store stock. Site stock unchanged. |
| **Receipt** | In‑Transit → Site, by the **accepted** quantity only. Confirmed by the site. |
| **Damaged** | Logged separately (In‑Transit → Damaged). A recorded loss; not added to usable site stock. |
| **Short** | Dispatched but didn't arrive. Stays in transit until resolved (kept / written off / returned). |
| **Need More** | On a receipt, the site can request extra — auto-raises a new Material Request to the store. |

---

## Modules

1. **Dashboard** — KPI cards (materials, store stock, site stock, in‑transit, pending receipts, pending requests), recent transfers, low‑stock, and a **Site Requests & Notes** feed.
2. **Master Items** — the master catalog + **starting (opening) quantity** per location. Add items, edit details, set opening stock, and **Excel/CSV import** (items and opening balances) with preview & duplicate checks. Opening numbers are fixed — they don't change as transfers happen.
3. **Current Stock** — the live stock page: per material and location it shows **Initial → Movement → Current**, plus **In‑Transit** and **Total**, auto‑updated by every transfer/receipt. Store Manager can post authorised **stock adjustments**.
4. **Locations** — Central Store + Pilot Site (fixed for the pilot; editable details; built to scale).
5. **Material Requests** — the **site raises an indent**; the **store reviews** (approve / reject / **modify quantities**); approval **auto-creates a linked transfer**.
6. **Material Transfers** — create a multi‑item dispatch document (DC/MTN), dispatch, and track status (Draft → Pending → Partial → Completed).
7. **Receipt Confirmation** — the site confirms **Accepted / Damaged / Short / Need More** (inline on the transfer or on a dedicated screen); partial receipts supported; discrepancy resolution for leftover in‑transit. **Need More** auto‑raises a fresh request to the store.
8. **Resend / Replace** — re-dispatch any quantity (defaults to the damaged amount) as a new linked transfer.
9. **Loss Register** — every damaged / short / written‑off unit, with KPIs, per‑event detail (transfer, material, qty, type, location, by) and a **Loss‑by‑Material** summary.
10. **Reports** — **Daily (1 day) / Weekly (7 days)** reports for **Transfers** and **Losses**, with KPIs, detail tables, a **Qualtech Engineers branded letterhead**, and **Print / PDF**.
11. **Movement History** — the full ledger, searchable; keeps **actual transaction date** and **system entry timestamp** separately (supports delayed data entry).
12. **Notifications** — site receipt remarks surface to the store (sidebar item + bell + dashboard panel), each linking to its transfer.
13. **Settings** — app name, user, low‑stock threshold, demo‑data reset.

---

## Roles

A demo **role toggle** (top‑right) switches between the two primary roles:

| Capability | Store Manager | Site Manager |
|---|---|---|
| View dashboard | ✅ | ✅ |
| Manage materials / locations / opening stock | ✅ | — |
| Review & approve material requests | ✅ | — |
| Create & dispatch transfers | ✅ | — |
| Resend / replace | ✅ | — |
| Raise material requests | — | ✅ |
| Confirm receipts (accepted/damaged/short/need‑more) | — | ✅ |
| View current stock / movement / losses | ✅ | ✅ |

---

## The end-to-end flow

```
Site raises Material Request
        │
        ▼
Store reviews → approve / reject / modify  ──► (approve) auto-creates Transfer (DRAFT)
        │
        ▼
Store confirms Dispatch  ──►  Central Store −qty,  In-Transit +qty   (site unchanged)
        │
        ▼
Site confirms Receipt (Accepted / Damaged / Short / Need More)
        │                         │
        │                         └─ Need More ──► new Material Request to store
        ▼
In-Transit −accepted,  Site +accepted
Damaged → recorded as loss      Short → stays in transit → resolve (keep / write-off / return)
        │
        ▼
Transfer Completed · Movement History + Loss Register + Current Stock updated automatically
```

---

## Inventory & ledger logic

**Stock at a location** = `Opening + Confirmed Inflows − Outflows` (summed from the ledger).

**In‑Transit (per material)** = `Dispatched − Accepted − Damaged − ResolvedShort`.

Worked example — dispatch 20, receive 18:

| Stage | Central | In‑Transit | Site |
|---|---|---|---|
| Before | 100 | 0 | 10 |
| After dispatch (20) | 80 | 20 | 10 |
| After receipt (18 accepted) | 80 | 2 | 28 |
| After resolving 2 (write‑off) | 80 | 0 | 28 |

Guarantees:
- Destination stock never rises before confirmed receipt.
- Stock can't go negative; dispatch is validated against available store stock.
- Nothing is silently deleted — damaged/short/write‑offs are explicit ledger entries.
- Balances always reconcile with the ledger.

---

## Tech stack

- **Zero runtime dependencies** — TypeScript compiled to browser JS, served by a Node HTTP server.
- **Backend:** Node 22+ (`node:http`, `node:sqlite`) — SQLite-backed shared store with optimistic‑concurrency saves (no external DB).
- **Frontend:** plain TypeScript + a single CSS design system (light/dark). No framework, no build tooling beyond `tsc`.
- **Persistence:** SQLite file (`data/mtts.db`); the browser syncs its local state with the server on load and on every save.

---

## Getting started

Requires **Node ≥ 22.18** (for native TypeScript + `node:sqlite`).

```bash
npm install          # dev dependency: typescript
npm run build        # compile src/ -> js/
npm start            # build + run the server (default http://localhost:3000)
```

Run on a specific port:

```bash
PORT=4475 npm start
```

Useful scripts:

```bash
npm run watch        # recompile on change
npm run typecheck    # type-check app + server
npm run dev          # watch + run server with --watch
```

Open the app, then use the **role toggle** (top‑right) to switch between Store Manager and Site Manager. **Settings → Reset Demo Data** restores the seeded sample.

---

## Project structure

```
index.html            App shell (sidebar + topbar + content)
css/styles.css        Design system (light/dark)
src/
  types.d.ts          Domain types (Material, Transfer, Receipt, Request, Movement…)
  data.ts             Seed data (materials, locations, opening balances)
  app.ts              The whole application (views, actions, ledger math)
  sync.ts             Loads server data, loads app scripts, pushes saves
server/
  server.ts           Node HTTP + SQLite server and store validation
js/                   Compiled output (gitignored)
data/                 SQLite database (gitignored)
```

---

## Data model

Single shared store (`mtts-v1`) with these arrays:

- `materials` — master catalog
- `locations` — Central Store + Site (and future sites)
- `requests` — material requests (indents) with per‑item approved quantities
- `transfers` — transfer headers + line items
- `receipts` — receiving confirmations (accepted / damaged / short per item)
- `movements` — **immutable stock ledger** (OPEN / DISPATCH / RECEIPT / DAMAGE / SHORT / ADJUST)
- `settings` — app config + read‑notes tracking

Virtual (non‑physical) ledger accounts: `OPENING`, `TRANSIT`, `DAMAGED`, `LOSS`.

---

## Excel / CSV import format

Materials import accepts a 5‑column layout (header row optional; comma **or** tab separated, so you can paste straight from Excel):

```
Code,Name,Category,Unit,Description
MAT-020,MS Angle 50x50,Steel,kg,5mm thickness
MAT-021,Concrete M25,Concrete,m³,Ready-mix
```

- **Required:** Code (unique), Name, Unit
- **Optional:** Category (defaults to "Other"), Description
- Duplicate/invalid rows are reported and skipped; a downloadable template is provided in the dialog.

---

## Configuration

Server environment variables:

| Var | Default | Purpose |
|---|---|---|
| `PORT` | `3000` | HTTP port |
| `DB_FILE` | `data/mtts.db` | SQLite database path |
| `QT_PASSWORD` | _(unset)_ | If set, every request requires HTTP Basic auth with this password |

---

## Deployment

Any host that can run Node ≥ 22.18 works. Build (`npm run build`) then run the server (`npm start`) behind a reverse proxy; point `DB_FILE` at persistent storage and set `QT_PASSWORD` to protect the instance. Back up the SQLite file to preserve data.

---

*Phase‑1 pilot. Not an ERP — procurement, purchase orders, vendors, accounting, billing and consumption tracking are intentionally out of scope and can be added later.*
