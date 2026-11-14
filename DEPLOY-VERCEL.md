# Deploy to Vercel (shared data via Turso)

This hosts the app on Vercel with **one shared database in the cloud**, so the
storekeeper, purchase manager and site manager all read and write the same
records from any device. A single password gates the whole site.

Local development is unchanged — `npm start` still runs the Node + SQLite
server on `localhost:4475`. Vercel uses the files in `api/` + `middleware.ts`
instead of `server/`.

---

## 1. Create the cloud database (Turso) — ~3 min, one time

You can do this straight from Vercel (easiest), or on turso.tech.

**Option A — from the Vercel dashboard (recommended):**
1. Create the project first (step 2 below), then open it.
2. **Storage** tab → **Create Database** → choose **Turso** (Serverless SQLite).
3. Connect it to the project. Vercel adds `TURSO_DATABASE_URL` and
   `TURSO_AUTH_TOKEN` to the project's environment variables automatically.

**Option B — on turso.tech:**
1. Sign up at <https://turso.tech> (free tier is plenty).
2. Create a database (any name, e.g. `qualtech-mtts`), pick a region near you.
3. Copy its **Database URL** (`libsql://….turso.io`) and create an **auth token**.
4. Add both as env vars in Vercel (step 3).

No table setup needed — the app creates its table on first use.

## 2. Create the Vercel project

1. Push this repo to GitHub (already done: `kishore-x/qualtech-OS`).
2. In Vercel → **Add New → Project** → import `kishore-x/qualtech-OS`.
3. Framework preset: **Other** (vercel.json already sets the build command and
   output directory — don't override them).
4. Deploy.

The build runs `npm run build` (compiles `src/ → js/`) and Vercel serves the
static app plus the `/api/stores` functions.

## 3. Set the environment variables

Project → **Settings → Environment Variables** (Production + Preview):

| Name                 | Value                                   | Notes                          |
|----------------------|-----------------------------------------|--------------------------------|
| `TURSO_DATABASE_URL` | `libsql://….turso.io`                   | auto-added if you used 1A      |
| `TURSO_AUTH_TOKEN`   | your Turso token                        | auto-added if you used 1A      |
| `QT_PASSWORD`        | a password for the pilot users          | leave unset = open, no login   |

Redeploy after adding them (Deployments → ⋯ → Redeploy) so they take effect.

## 4. Use it

- Open the Vercel URL. If `QT_PASSWORD` is set, the browser asks for a login —
  **leave the username blank (or type anything)** and enter the password.
- Share the URL + password with the storekeeper, purchase manager and site
  manager. Everyone now works on the same shared data.

---

## Notes / troubleshooting

- **Shared, with overwrite protection.** Every save carries the version it was
  based on. If two people save at once, the second gets "someone else just
  updated this" and reloads the latest copy — no silent overwrites.
- **First load after deploy** uploads whatever seed data the app starts with,
  so everyone begins from the same copy.
- **If the login box reappears even with the right password**, the middleware
  pass-through needs adjusting — tell me and I'll switch it to the
  `@vercel/edge` `next()` form (one small change).
- **Turso free tier** is generous (hundreds of MB, millions of row reads/mo) —
  far more than a single-site pilot needs.
- **Rolling back data**: the local Node server keeps 50 past versions in
  `store_history`; the Turso version keeps only the current copy. Say so if you
  want history on the cloud copy too.
