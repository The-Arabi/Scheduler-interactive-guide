# CWRU Weatherhead Course Scheduler — Interactive Guide

Interactive training guide with an embedded **webview** of the live scheduler at [course-scheduler.xlab-cwru.com](https://course-scheduler.xlab-cwru.com/).

## Why a proxy is required

A plain `<iframe src="https://course-scheduler...">` cannot complete CWRU SSO login because of `X-Frame-Options`, CSP, and third-party cookie rules. This app uses a **same-origin reverse proxy** at `/proxy-site/<host>/...` so the scheduler (and `login.case.edu`) load under your app's origin and cookies work.

**GitHub Pages only serves static files** — it cannot run the proxy, so `/proxy-site/...` returns a GitHub 404. Deploy the **full Node app** instead (see below).

## Run locally

**Prerequisites:** Node.js 20+

```bash
npm install
npm run dev
```

Open http://localhost:3000 — the webview loads the scheduler through the proxy automatically.

## Deploy to production (Render recommended)

1. Push this repo to GitHub.
2. In [Render](https://dashboard.render.com) → **New** → **Blueprint** → connect the repo (uses `render.yaml`).
3. After deploy, open your Render URL (e.g. `https://scheduler-interactive-guide.onrender.com`).
4. Optional: add a **Deploy Hook** URL from Render → **Settings** → **Deploy Hook**, then save it as GitHub secret `RENDER_DEPLOY_HOOK` so pushes trigger redeploys.

The production server runs `node dist/server.cjs`, which serves the built UI and the `/proxy-site` proxy on the **same domain**.

## Build commands

| Command        | Description                                      |
|----------------|--------------------------------------------------|
| `npm run dev`  | Dev server with Vite + proxy                     |
| `npm run build`| Production UI + bundled `dist/server.cjs`        |
| `npm start`    | Run production server (after `npm run build`)    |
