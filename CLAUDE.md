# Project Purpose

A real-time multiplayer implementation of Taki, the Israeli card game. Players create or join rooms via shared links and play against each other live. The game supports 2 or more players, Hebrew and English UI, and custom rules (No Mercy mode).

## Architecture

- **Frontend**: Svelte 5 / SvelteKit, TypeScript, deployed to Firebase Hosting
- **Backend**: Node.js WebSocket server (`ws`), TypeScript, containerized and deployed to **GCP Cloud Run** (`taki-backend`, project `studio-1414464010-d19f1`)
- **Shared**: `@taki/shared` workspace package for types shared between frontend and backend
- **Deploy frontend**: `pnpm run deploy` from `frontend/` — lints, type-checks, builds, and pushes to Firebase Hosting
- **Deploy backend**: `bash backend/deploy.sh` from the repo root — builds a Docker image via Cloud Build, pushes to GCR, and deploys to Cloud Run
  - Requires **Cloud Build API** and **Cloud Run API** enabled in GCP project `studio-1414464010-d19f1`
  - After any backend deploy, update `frontend/.env` with the new `VITE_WS_URL` if the service URL changed, then redeploy frontend
  - The root `.npmrc` sets `inject-workspace-packages=true`; after changing it, run `pnpm install` from the repo root to regenerate the lockfile before deploying

---

# Reconnection & Mid-Game Join

Players are identified server-side by a `storageId` (a UUID generated once per browser session and stored in `sessionStorage`). On reconnect the server restores the player's slot, hand, and turn status.

**Reconnect priority:**
1. **By `storageId`** — always tried first; unique per session, survives page refreshes and network drops
2. **By name + disconnected status** — fallback when `storageId` is gone (e.g. tab closed, different device); only applied when **exactly one** disconnected player has that name (avoids ambiguity with two players sharing the same name)
3. **New mid-game joiner** — if neither match succeeds, the player joins as a fresh participant: 8 cards dealt from the deck, seated after the last player. The host can kick them via the existing kick mechanism.

---

# Code Style

- Use `pnpm`.
- Use early returns.
- Use `async`/`await` whenever possible.
- Minimize indentations.
- Use nested CSS wherever applicable.
- No comments. Use self-descriptive variable and function names instead.
- The UI must be fully accessible — tab navigation and screen readers.

---

# Refactoring Rules

- Use DRY with separation of concerns, while retaining maintainability and prioritizing readability.
- Do not use abbreviations in function names or variables — always use full words.
- If a function in Svelte is only used once, inline it.

## Variable Naming

1. Booleans must be prefixed with `is`.
2. Plurals must be pluralized.
3. Indexes must be prefixed with `i`.
4. Elements must be prefixed with `el`.

---

# System Instructions

- After fixing a bug or adding a feature, run the deploy script.
- After any modification, increment the version number in the UI.
