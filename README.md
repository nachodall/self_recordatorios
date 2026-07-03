# ~/reminders

A minimal, **self-hostable** reminders app with a terminal aesthetic. Write a reminder
with a date, see it on a dashboard, and get a **real push notification on your iPhone**
(installed as a PWA) or desktop when it's due. No App Store, no Apple Developer account.

Each deploy is a **single-user, passcode-protected** instance — you host your own private
reminders. Free to run on Vercel + Neon + GitHub Actions.

```text
  ~/reminders                                   3 pending

  ● notifications on
  ─────────────────────────────────────────────────────
  $ new reminder…
  @ 2026-07-03, 18:30                              [ add ]
  ─────────────────────────────────────────────────────

  ·  [2026-07-03 18:30]  in 3h
     Renew the domain

  ·  [2026-07-04 09:00]  in 1d
     Call the dentist

  — sent —
  ✓  [2026-07-01 12:00]  sent
     Pay rent
```

*Terminal-on-paper UI, automatic light/dark. Swipe a row left to delete.*

---

## Features

- **Terminal aesthetic**, monospace, automatic light/dark (follows the OS).
- **Reminders** = text + date/time, shown on a dashboard (pending / sent).
- **Real push notifications** to an installed iPhone PWA and to desktop browsers.
- **Single-user, passcode-gated** — your instance, your reminders, one password.
- **Zero manual key setup** — Web Push (VAPID) keys are generated automatically.
- **Free to run**: Vercel (hosting) + Neon (Postgres) + GitHub Actions (cron).

## How it works

A Next.js app on Vercel stores reminders in Postgres (Neon). A service worker shows the
notifications; the VAPID keys needed for Web Push are generated on first use and stored in
the database. Because Vercel's free plan only allows a **daily** cron, a **GitHub Action**
pings `/api/cron/check` every 5 minutes to fire any due reminders. The whole app sits
behind a single passcode.

---

## Deploy your own

### 1. Click deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fnachodall%2Fself_recordatorios&env=APP_PASSWORD,CRON_SECRET&envDescription=APP_PASSWORD%20is%20your%20login%20passcode.%20CRON_SECRET%20is%20any%20random%20string%20used%20to%20authenticate%20the%20cron%20trigger.&project-name=reminders&repository-name=reminders)

This clones the repo into your GitHub account and creates a Vercel project. When prompted,
set:

- **`APP_PASSWORD`** — the passcode you'll use to log in (pick something you can type on
  your phone).
- **`CRON_SECRET`** — any random string (e.g. run `openssl rand -hex 16`).

### 2. Add the database

In your new Vercel project → **Storage** → **Create Database** → **Neon (Postgres)** →
connect it to the project. This injects `DATABASE_URL` automatically. Then **redeploy**
(Deployments → ⋯ → Redeploy) so the build runs the schema migration against the new DB.

### 3. Set up the cron (fires the notifications)

The scheduler lives in [`.github/workflows/cron-check.yml`](.github/workflows/cron-check.yml)
and pings your app every 5 minutes. In your forked GitHub repo:

1. **Actions** tab → enable workflows (forks start with Actions disabled).
2. **Settings → Secrets and variables → Actions** → add two repository secrets:
   - **`APP_URL`** → your Vercel URL, e.g. `https://your-app.vercel.app`
   - **`CRON_SECRET`** → the same value you set in Vercel
3. (Optional) Actions tab → *Check reminders* → **Run workflow** to trigger it once.

> Prefer not to use GitHub Actions? Any external cron works — e.g. [cron-job.org](https://cron-job.org)
> making a `POST` to `https://your-app.vercel.app/api/cron/check` with header
> `Authorization: Bearer <CRON_SECRET>`.

### 4. Install on your iPhone (iOS 16.4+)

1. Open your URL in **Safari** and enter your passcode.
2. **Share** → **Add to Home Screen**.
3. Open the app from the new icon → tap **`[ enable notifications ]`** → **Allow**.

> iOS only lets a website request notification permission once it's installed as a PWA,
> so step 2 must come before step 3.

Create a reminder a couple of minutes out and confirm it arrives (it can take up to 5
minutes, depending on the next GitHub Action tick).

---

## Local development

The database is Postgres (Neon) in both dev and prod. Pull the connection string from your
Vercel project:

```bash
git clone https://github.com/nachodall/self_recordatorios reminders
cd reminders
npm install
npx vercel link                 # link to your Vercel project
npx vercel env pull .env.local  # brings DATABASE_URL, APP_PASSWORD, etc.
npm run dev                     # http://localhost:3000
```

In another terminal, run the scheduler (this is what fires notifications locally):

```bash
npm run scheduler
```

Web Push works on `localhost` in **Chrome/Edge desktop**, so you can test the full loop
without an iPhone: log in → `[ enable notifications ]` → create a reminder ~1–2 min out →
wait for the desktop notification. (Safari on `localhost` is unreliable for Web Push.)

> `vercel env pull` returns Sensitive vars (like `APP_PASSWORD`) empty — fill those in
> `.env.local` by hand.

## Environment variables

See [`.env.example`](.env.example).

| Variable | Required | Notes |
| --- | --- | --- |
| `APP_PASSWORD` | ✅ | Login passcode; gates the whole app (page + API). |
| `CRON_SECRET` | ✅ | Authenticates the cron trigger against `/api/cron/check`. |
| `DATABASE_URL`, `DATABASE_URL_UNPOOLED` | auto | Injected by the Neon integration on Vercel. |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` | optional | Auto-generated and stored in the DB if unset. Set only to pin a keypair. |
| `VAPID_SUBJECT` | optional | `mailto:` or URL used in the push payload. |

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run scheduler` | Local loop that checks for due reminders (every 30s) |
| `npm run build` | Production build |
| `npm run db:studio` | Prisma Studio (inspect/edit the database) |

## Tech stack

Next.js 16 (App Router) · Prisma · Postgres (Neon) · Web Push (VAPID) · Tailwind v4 · Geist Mono.

## Architecture

```text
src/app/
  page.tsx                        Dashboard (server: initial load from Prisma)
  login/page.tsx                  Passcode screen
  api/
    auth/login/route.ts           Validates the passcode, sets the session cookie
    reminders/route.ts            GET (list) · POST (create)
    reminders/[id]/route.ts       DELETE
    push/subscribe/route.ts       Saves the browser's push subscription
    push/vapid-public-key/route.ts  Returns the VAPID public key (env or DB)
    cron/check/route.ts           Sends push for due reminders, marks them sent
src/proxy.ts                      Gates the whole app behind the passcode (signed cookie)
src/components/                   Dashboard, Composer, ReminderList, NotificationBar
src/lib/                          prisma, push (env→DB→generate), client-push, session, format
public/sw.js                      Service worker (receives push, shows the notification)
public/manifest.webmanifest       PWA manifest
prisma/schema.prisma              Postgres; Reminder, PushSubscription, AppSecret
vercel.json                       buildCommand: migrate (when DB present) + build
.github/workflows/cron-check.yml  Production cron (every 5 min)
scripts/scheduler.mjs             Local cron for development
```

## License

[MIT](LICENSE)
