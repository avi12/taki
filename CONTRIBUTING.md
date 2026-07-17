# Contributing to Taki

Thanks for your interest in improving Taki! This guide covers the development
workflow, code style, and how to deploy the two halves of the app.

> By contributing you agree that your contributions are licensed under the
> project's [MIT License](LICENSE).

## Prerequisites

- [Node.js](https://nodejs.org) 22+
- [pnpm](https://pnpm.io) 10+ (`corepack enable` will provide it)
- For backend deploys: the [`gcloud` CLI](https://cloud.google.com/sdk/docs/install)
- For frontend deploys: the Firebase CLI (bundled as the `firebase-tools` dev dependency)

## Local development

```sh
pnpm install                                   # from the repo root (pnpm workspace)
echo "VITE_WS_URL=ws://localhost:8080" > frontend/.env

pnpm --filter taki-backend dev                 # WebSocket server on :8080
pnpm --filter taki dev                         # Vite dev server on :5174 (second terminal)
```

The three workspace packages:

| Package | Path | Role |
| --- | --- | --- |
| `taki` | `frontend/` | SvelteKit UI |
| `taki-backend` | `backend/` | `ws` game server |
| `@taki/shared` | `shared/` | shared TypeScript types |

If you change `shared/`, rebuild it (`pnpm --filter @taki/shared build`) so the
other packages pick up the new types.

## Code style

The repo enforces a specific style (see [`CLAUDE.md`](CLAUDE.md) for the full list):

- **pnpm** only.
- Early returns; minimize nesting; `async`/`await` over `.then` chains.
- **No comments** — use self-descriptive names instead.
- Booleans prefixed `is`, plurals pluralized, indexes prefixed `i`, elements prefixed `el`.
- No abbreviations in names; inline single-use Svelte functions.
- Nested CSS where applicable; the UI must stay fully keyboard- and screen-reader-accessible.

Lint and type-check before opening a PR:

```sh
pnpm --filter taki check           # svelte-check (type-checks the frontend)
pnpm --filter taki-backend exec tsc --noEmit
pnpm --filter taki lint            # eslint
```

## Deploying

The app deploys as two independent pieces: the **backend** to Google Cloud Run
and the **frontend** to Firebase Hosting. The maintainer's live setup uses GCP
project `studio-1414464010-d19f1` — if you fork this, substitute your own project
throughout.

### One-time Google Cloud Platform setup

1. **Create / pick a GCP project** and note its project ID.

   ```sh
   gcloud projects create my-taki-project        # or use an existing one
   ```

2. **Authenticate and select the project:**

   ```sh
   gcloud auth login
   gcloud config set project <YOUR_PROJECT_ID>
   ```

3. **Enable the required APIs** (billing must be enabled on the project):

   ```sh
   gcloud services enable \
     run.googleapis.com \
     cloudbuild.googleapis.com \
     containerregistry.googleapis.com
   ```

4. **Point the deploy scripts at your project.** Edit the identifiers in:
   - [`backend/deploy.sh`](backend/deploy.sh) — `PROJECT_ID`, `REGION`, `SERVICE_NAME`
   - [`.firebaserc`](.firebaserc) — your Firebase project id (a Firebase project
     is a GCP project with Firebase enabled; you can reuse the same one)

### Backend → Cloud Run

```sh
bash backend/deploy.sh
```

This script (run from the repo root):

1. Uses **Cloud Build** to build the Docker image defined by
   [`backend/Dockerfile`](backend/Dockerfile) (multi-stage: builds all three
   workspace packages, then ships only the backend + its prod deps).
2. Pushes the image to **Container Registry** (`gcr.io/<PROJECT_ID>/taki-backend`).
3. Deploys it to **Cloud Run** in `europe-west1`, `--allow-unauthenticated`, port
   `8080`, with `min/max-instances 1` (a single always-on instance keeps
   in-memory game rooms alive and avoids cold starts).

When it finishes it prints the **Service URL**. If that URL changed, update the
frontend to match (next section).

### Frontend → Firebase Hosting

1. Create your local Firebase Hosting config from the template (the real
   `firebase.json` is gitignored) and set your Hosting **site id**:

   ```sh
   cp firebase.json.example firebase.json   # then edit "site" to your site id
   ```

2. Set the backend WebSocket URL the built app will connect to:

   ```sh
   # frontend/.env  — note wss:// (secure) for the deployed Cloud Run URL
   echo "VITE_WS_URL=wss://<your-cloud-run-service-url>" > frontend/.env
   ```

3. Deploy:

   ```sh
   cd frontend && pnpm run deploy
   ```

   This lints, type-checks, builds the static site, and pushes it to Firebase
   Hosting. The version number shown in the UI is bumped automatically on deploy.

### Deploy checklist

- [ ] Backend deployed; note the Service URL
- [ ] `frontend/.env` `VITE_WS_URL` matches the current backend URL (use `wss://`)
- [ ] Frontend deployed
- [ ] Smoke-test the live site: create a room, join from a second tab, play a card

> **Note:** the repo also contains a [`fly.toml`](fly.toml) from an earlier
> Fly.io setup. Cloud Run is the current, supported backend target.

## Reporting bugs & requesting features

Open a [GitHub issue](../../issues). For bugs, include steps to reproduce, what
you expected, and what happened (a screenshot or the room link helps).
