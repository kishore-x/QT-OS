# Qualtech OS

Inventory and ERP dashboard for Qualtech Engineers Pvt. Ltd.: inventory, job costs, tenders, procurement and billing.

## Run it

Needs **Node.js 22.18 or newer**.

```bash
npm install
npm start          # builds the app, then serves it at http://localhost:3000
```

Everyone who opens that address shares the same data, which is stored in `data/qualtech.db` (SQLite).

| Command | What it does |
|---|---|
| `npm start` | Build and run the server |
| `npm run dev` | Same, but rebuilds and restarts when you edit files |
| `npm run build` | Compile `src/*.ts` → `js/*.js` |
| `npm run typecheck` | Check types for the app and the server |

### Settings (environment variables)

| Variable | Default | Meaning |
|---|---|---|
| `PORT` | `3000` | Port to listen on |
| `DB_FILE` | `data/qualtech.db` | Where the database lives |
| `QT_PASSWORD` | *(none)* | If set, the browser asks for this password (any username) |

Set `QT_PASSWORD` before you put the server on a shared network. Without it, anyone who can reach the address can see and change the data.

### Without the server

Run `npm run build`, then open `index.html` directly. The app works the same, but data is saved only in that browser.

## Project layout

```
index.html          page shell, loads js/sync.js
css/styles.css
src/                TypeScript source (edit these)
  types.d.ts        shapes of every record: Item, Movement, Project, Tender, PurchaseOrder, BillDoc …
  sync.ts           loads data from the server, loads the app, sends every save back
  data.ts           inventory seed data
  jcr-data.ts       job-cost seed data (from "JCR FOR ERP.xlsx")
  app.ts            shell, dashboard, inventory, projects, job costs, reports
  tender.ts         bidding / tenders
  procure.ts        material requests → purchase orders → goods receipt
  billing.ts        quotations, customer/vendor POs, invoices
js/                 compiled output (generated, not in git)
server/server.ts    backend: static files + /api/stores, SQLite
data/               database (generated, not in git)
```

The files in `src/` are plain browser scripts that share one global scope rather than ES modules. The HTML uses inline handlers like `onclick="go('inventory')"`, which need the functions to be global.

## How saving works

The app has five data blocks: inventory, job cost, tenders, procurement and billing. Each save function writes its block to the browser and calls `syncPush()`, which sends it to the server.

- Each save carries the version it started from. If someone else saved that block first, the server refuses the save (HTTP 409). The page then shows a message and reloads with the latest data, so nobody's work is silently overwritten.
- If the server can't be reached, the page shows "Offline — retrying" and sends the change when the connection is back.
- The server keeps the last 50 versions of each block in the `store_history` table, so mistakes can be recovered.

### API

```
GET /api/stores        → { "<key>": { version, data, updatedAt } }
PUT /api/stores/<key>  { baseVersion, data } → 200 { version } | 409 { version, data }
```
