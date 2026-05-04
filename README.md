# Bookbrush Cancellations Dashboard

Internal dashboard for the Bookbrush team. Reads live from the Google Sheet that n8n maintains. Password-protected (single shared password — no Google Cloud or per-user accounts needed).

## What you'll see

- **5 KPI cards**: Cancellations · Resubscriptions · Net change · Win-back rate · Failed payments
- **Time-series chart**: Cancellations vs. resubscriptions per day
- **Plan breakdown** (pie charts): by Plus/Gold/Platinum
- **Date filter**: Last 7 / 30 / 90 days · Year-to-date
- **Needs Review banner**: shows when there are customers requiring manual triage

Auto-refreshes from the sheet every 60 seconds.

---

## Deployment (~10 min, all free)

You need:
- a GitHub account
- a Vercel account (sign up with the GitHub account)

### Step 1 — Make the sheet readable

Open your Google Sheet → **Share** → "General access" → **Anyone with the link** → role: **Viewer** → Done.

(The sheet ID is unguessable so this is reasonably safe for internal data, but anyone with the URL can view it.)

### Step 2 — Push the code to GitHub

In a terminal:

```bash
cd dashboard
git init
git add .
git commit -m "initial dashboard"
```

Then go to https://github.com/new → create a **private** repo named `bookbrush-dashboard`. Copy the commands GitHub shows you (the "push an existing repository" block) and paste them in your terminal. They'll look like:

```bash
git remote add origin https://github.com/YOUR-USERNAME/bookbrush-dashboard.git
git branch -M main
git push -u origin main
```

### Step 3 — Deploy on Vercel

1. Go to https://vercel.com → log in with GitHub.
2. **Add New** → **Project** → import `bookbrush-dashboard` → click **Deploy**.
   (The first build may fail — that's OK, env vars come next.)
3. Project Settings → **Environment Variables** → add these three:

| Name | Value |
|---|---|
| `DASHBOARD_PASSWORD` | a password of your choice (this is what your team types to sign in) |
| `SESSION_SECRET` | run `openssl rand -base64 32` and paste the output, or just type any long random string |
| `GOOGLE_SHEET_ID` | The sheet ID (from your sheet's URL between `/d/` and `/edit`) |

4. **Deployments** → … → **Redeploy**.
5. Open your Vercel URL, type the password, you're in.

---

## Local development

```bash
cd dashboard
cp .env.local.example .env.local   # then edit with real values
npm install
npm run dev
```

Visit http://localhost:3000.

---

## Sharing with teammates

Just give them the Vercel URL + the password. To rotate the password later: change `DASHBOARD_PASSWORD` in Vercel → Redeploy → tell teammates the new password.
