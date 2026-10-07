# ALEX.IO

A modern, responsive **gaming web app** (installable PWA) with a Node/Express API.
Plays like a native app on desktop and Android — no app store required.

![stack](https://img.shields.io/badge/stack-React%20%2B%20Vite%20%2B%20Tailwind-10b981)
![api](https://img.shields.io/badge/api-Express%20%2B%20Firebase-0b1220)

## Features

- **Four games** — Coin Flip, Dice Roll, Trade Gamble and Flappy Flight, all server-settled.
- **Wallet** — deposits, withdrawals, bank payouts, and a full transaction history.
- **Profile** — personal details, bank details, and play statistics.
- **Installable PWA** — add to your home screen / desktop and run full-screen, offline-capable shell.
- **Light & responsive** — mobile-first layout with a bottom tab bar on phones and a side nav on desktop.
- **Runs with zero configuration** — local demo mode needs no API keys. Optionally connect Firebase.

## Project structure

```
alex-io/
├─ web/        # Vite + React + TypeScript + Tailwind PWA (the app)
├─ server/     # Express API — demo (JSON) or Firebase backend, plus game logic
├─ package.json# root scripts (dev / build / start)
└─ firebase.json, vercel.json, netlify.toml
```

## Quick start (local demo mode)

Requires Node.js 20+.

```bash
npm run install:all     # install server + web dependencies
npm run build           # build the web app into web/dist
npm start               # serve the API + built app on http://localhost:5000
```

Open **http://localhost:5000**. Sign up with any email and a 6+ character password — you start with
₦1,000. No Firebase, no API keys, no internet required.

> Data is stored locally in `server/data/db.json`. Delete that file to reset everything.

## Development mode (hot reload)

```bash
npm run dev
```

- Web app with hot reload: **http://localhost:5173** (proxies `/api` to the server)
- API: **http://localhost:5000**

## Configuration

Both modes read `.env` files (see `server/.env.example` and `web/.env.example`).

### Backend (`server/.env`)

| Variable | Purpose |
| --- | --- |
| `DEMO_MODE` | `auto` (default), `demo`, or `firebase` |
| `PORT` / `HOST` | API port and bind address (default `5000` / `0.0.0.0`) |
| `JWT_SECRET` | Signs demo-mode session tokens |
| `CORS_ORIGINS` | Comma-separated allowed origins (default: all) |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to a Firebase service-account JSON |
| `FIREBASE_PRIVATE_KEY` / `FIREBASE_CLIENT_EMAIL` | Service-account fields as env vars |
| `PAYSTACK_SECRET_KEY` | Enables real Paystack deposits/payouts |

`DEMO_MODE=auto` uses Firebase when credentials are found, otherwise the local JSON store.

### Frontend (`web/.env.local`)

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | API base URL — leave unset for same-origin `/api` |
| `VITE_PAYSTACK_PUBLIC_KEY` | Enables card deposits (otherwise instant demo deposits) |
| `VITE_FIREBASE_*` | Firebase web config to enable Firebase auth |

## Install as an app (PWA)

Once deployed (or running locally), open the site and use your browser's **Install** / **Add to
Home Screen** action. The app ships a web manifest and service worker, so it launches full-screen
with its own icon.

## API reference

All routes under `/api`. Authenticated routes expect `Authorization: Bearer <token>`.

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/health` | Health + current mode |
| `POST` | `/auth/register` · `/auth/login` | Demo-mode auth (Firebase mode uses the SDK) |
| `GET` | `/user/profile` · `PUT /user/profile` | Read / update profile |
| `GET` | `/user/wallet` | Balance |
| `POST` | `/user/wallet/deposit` · `/withdraw` · `/payout` | Wallet operations |
| `GET` | `/user/transactions` | Transaction history |
| `POST` | `/games/coin-flip` · `/dice-roll` · `/trade-gamble` · `/flappy-bird` | Play a game |

Game outcomes are server-settled with a cryptographically secure RNG.

## Deployment

The build output is a static bundle in `web/dist`. Deploy it to any static host:

- **Firebase Hosting** — `firebase deploy --only hosting` (free tier, custom domain)
- **Vercel** — `npx vercel --prod`
- **Netlify** — `npx netlify-cli deploy --prod --dir=web/dist`

Or run `./deploy.ps1` / `./deploy.sh` for a guided flow. The API itself is a standard Node service —
deploy `server/` to any Node host and point `VITE_API_URL` at it.

## Security note

The previous version committed secrets in `server/.env` (a Paystack secret key and JWT secret) and
hardcoded a Firebase config. Those values are now environment-driven and `.env` is git-ignored.
**Rotate any keys that were previously committed.**

## Scripts

| Command | Description |
| --- | --- |
| `npm run install:all` | Install server + web dependencies |
| `npm run dev` | Run API and web dev servers together |
| `npm run build` | Build the web app |
| `npm start` | Serve API + built web app on one port |
