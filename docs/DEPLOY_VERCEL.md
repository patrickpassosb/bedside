# Deploying Bedside on Vercel

Bedside can be deployed to Vercel as two projects from this monorepo:

1. `bedside-backend`
2. `bedside-frontend`

That is the simplest setup for this codebase. The frontend is a Vite SPA. The backend is a Fastify app that Vercel can deploy as a single function.

## Recommended order

1. Deploy the backend project first.
2. Copy the backend production URL.
3. Deploy the frontend project with `VITE_BACKEND_URL` pointing at that backend URL.

## Frontend project

### Root directory

`bedside-frontend`

### Required environment variables

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_HOSPITAL_ID=
VITE_BACKEND_URL=https://your-backend-project.vercel.app
```

### Notes

- The frontend includes a `vercel.json` rewrite so React Router routes like `/dashboard` and `/patients/:id` resolve to `index.html`.
- If the Supabase env vars are missing, the app falls back to mock data. That is useful for a design/demo deploy, but it is not the live product path.
- If `VITE_BACKEND_URL` is omitted in production, the frontend now defaults to same-origin API paths instead of `http://localhost:3000`.

## Backend project

### Root directory

`bedside-backend`

### Required environment variables

```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
AI_PROVIDER=mistral
AI_API_KEY=
AI_MODEL=
AI_BASE_URL=
EVOLUTION_API_URL=
EVOLUTION_API_KEY=
EVOLUTION_INSTANCE_NAME=
BASE_URL=https://your-backend-project.vercel.app
```

`PORT` is not required on Vercel.

### Notes

- Vercel detects Fastify and deploys this app as a single function from `src/index.ts`.
- After deployment, point Evolution API webhooks to:

```
https://your-backend-project.vercel.app/webhook/evolution
```

## Deploy from the dashboard

Create two separate Vercel projects from the same repository:

1. Import the repository.
2. Set the Root Directory to `bedside-backend`.
3. Add backend environment variables.
4. Deploy.
5. Repeat for `bedside-frontend`.
6. Set the frontend environment variables, especially `VITE_BACKEND_URL`.
7. Redeploy the frontend if you added or changed env vars after the first deploy.

## Deploy from the CLI

Backend:

```bash
vercel --cwd bedside-backend
vercel --cwd bedside-backend --prod
```

Frontend:

```bash
vercel --cwd bedside-frontend
vercel --cwd bedside-frontend --prod
```

You still need to configure the same env vars in Vercel before the production deploy is useful.

## Current caveats

- The backend keeps conversation history and webhook deduplication in memory. That is acceptable for a hackathon demo, but it is not durable across cold starts or parallel instances.
- The webhook route replies immediately and continues processing asynchronously. That is a reasonable demo tradeoff, but if webhook reliability becomes critical, move the backend to a long-running host or push the async work into a durable queue.
- For the demo, Vercel is an excellent fit for the frontend. It is an acceptable fit for the backend, but the backend has more operational risk than the SPA.
