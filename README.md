<h1 align="center">🎴 Taki</h1>

<p align="center">
  <strong>Real-time multiplayer <a href="https://en.wikipedia.org/wiki/Taki_(game)">Taki</a></strong> — the Israeli card game — played live in the browser with friends.
</p>

<p align="center">
  <a href="LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-green?style=flat-square"></a>
  <img alt="Svelte 5" src="https://img.shields.io/badge/Svelte-5-ff3e00?style=flat-square&logo=svelte&logoColor=white">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-3178c6?style=flat-square&logo=typescript&logoColor=white">
  <img alt="Cloud Run" src="https://img.shields.io/badge/GCP-Cloud%20Run-4285f4?style=flat-square&logo=googlecloud&logoColor=white">
</p>

---

## About

Taki is a fast, colorful shedding-type card game. This is a from-scratch **real-time multiplayer** implementation: players create or join a room via a shared link and play against each other live. Turns, draws, special cards, and win state are all resolved authoritatively on the server and streamed to every client over WebSockets.

## Features

- 🌐 **Real-time multiplayer** over WebSockets — every move is broadcast instantly
- 👥 **2–6 players** per room, joinable by link
- 🔤 **Bilingual UI** — Hebrew (RTL) and English
- 🔌 **Reconnection & mid-game join** — refresh, drop, or switch devices without losing your seat
- 🃏 **Full Taki rule set** — Taki runs, Super Taki, +2 / +3 / +4, Stop, Change Direction, Change Color, King
- 😈 **Custom rules** — "No Mercy" mode
- ♿ **Accessible** — full keyboard navigation and screen-reader support

## Tech stack

| Layer | Technology |
| --- | --- |
| **Frontend** | Svelte 5 / SvelteKit · TypeScript · Vite · deployed to **Firebase Hosting** |
| **Backend** | Node.js WebSocket server (`ws`) · TypeScript · Docker · deployed to **GCP Cloud Run** |
| **Shared** | `@taki/shared` workspace package (types shared by both) |
| **Tooling** | pnpm workspaces · ESLint · oxlint · Stylelint |

## Architecture

```
┌──────────────┐        HTTPS          ┌───────────────────────┐
│   Browser    │  ◀──── static ─────    │  Firebase Hosting     │
│  (SvelteKit) │        assets          │  (static site)        │
│              │                        └───────────────────────┘
│              │        WSS (game state, moves)
│              │  ◀──────────────────▶  ┌───────────────────────┐
└──────────────┘                        │  GCP Cloud Run        │
                                        │  ws server            │
                                        │  (taki-backend)       │
                                        └───────────────────────┘
```

The server holds authoritative game state per room; clients send intents (play card / draw) and render the state the server broadcasts back.

## Getting started (local development)

**Prerequisites:** [Node.js](https://nodejs.org) 22+ and [pnpm](https://pnpm.io) 10+.

```sh
# 1. Install dependencies (from the repo root — this is a pnpm workspace)
pnpm install

# 2. Point the frontend at a WebSocket server.
#    For local dev, run the backend and use its local URL:
echo "VITE_WS_URL=ws://localhost:8080" > frontend/.env

# 3. Start the backend (WebSocket server on :8080)
pnpm --filter taki-backend dev

# 4. In a second terminal, start the frontend (Vite on :5174)
pnpm --filter taki dev
```

Open the printed local URL, create a room, and share the link (or open a second tab) to play against yourself.

## Project structure

```
taki/
├── frontend/        SvelteKit app  →  Firebase Hosting
├── backend/         ws server      →  GCP Cloud Run  (Dockerfile, deploy.sh)
├── shared/          @taki/shared   →  types shared by frontend + backend
├── firebase.json    Firebase Hosting config
├── .firebaserc      Firebase project id
└── pnpm-workspace.yaml
```

## Deployment

Both halves deploy independently. See **[CONTRIBUTING.md](CONTRIBUTING.md#deploying)** for the full step-by-step, including one-time **Google Cloud Platform** setup (enabling APIs, `gcloud` auth, Cloud Run, Cloud Build). In short:

```sh
# Backend → GCP Cloud Run (builds a Docker image via Cloud Build, deploys to Cloud Run)
bash backend/deploy.sh

# Frontend → Firebase Hosting (lints, type-checks, builds, deploys)
cd frontend && pnpm run deploy
```

> If the backend's Cloud Run URL changes, update `VITE_WS_URL` in `frontend/.env` and redeploy the frontend.

## Contributing

Contributions are welcome! Please read **[CONTRIBUTING.md](CONTRIBUTING.md)** for the development workflow, code style, and deployment details. Open an issue to discuss larger changes before starting.

## Acknowledgements & credits

- **The game of Taki** — created and published by **[Shafir Games Ltd.](https://www.shafirgames.co.il)** Taki is their registered trademark (see the disclaimer below).
- Built with **[Svelte](https://svelte.dev)** / **[SvelteKit](https://svelte.dev/docs/kit)**, **[Vite](https://vite.dev)**, and the **[`ws`](https://github.com/websockets/ws)** WebSocket library.
- Hosted on **[Firebase Hosting](https://firebase.google.com/products/hosting)** and **[Google Cloud Run](https://cloud.google.com/run)**.

### ⚖️ Trademark disclaimer

> **Taki** is a registered trademark of **Shafir Games Ltd.** This project is an **unofficial, fan-made** implementation created for educational and non-commercial purposes. It is **not affiliated with, authorized, or endorsed by** Shafir Games. The MIT license below applies **only to the source code in this repository** — not to the Taki game, its rules, or its branding. If you are a rights holder and have concerns, please open an issue.

## Funding

If this project is useful to you, consider sponsoring its development — see the **Sponsor** button on GitHub (configured in [`.github/FUNDING.yml`](.github/FUNDING.yml)).

## Author

Built by **[Avi](https://avi12.com)**.

## License

Released under the **[MIT License](LICENSE)** © 2026 **[Avi](https://avi12.com)**.
