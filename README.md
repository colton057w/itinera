# Itinera

Next.js app for sharing and cloning trip and wedding itineraries (feed, votes, comments, hotel search via Google Places).

## Local development

```bash
npm install
# Start Postgres (Docker): docker compose up -d
npx prisma migrate deploy
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Copy [`.env.example`](./.env.example) to `.env` and adjust.

## Deploy on Vercel

### 1. Database (required)

Vercel cannot reach `localhost`. Use a hosted Postgres:

- [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres), [Neon](https://neon.tech), [Supabase](https://supabase.com), etc.

Create the database, copy the **connection string**, and run migrations **against that URL** once (from your machine or CI):

```bash
set DATABASE_URL="postgresql://..."   # Windows PowerShell: $env:DATABASE_URL="..."
npx prisma migrate deploy
```

### 2. Vercel Blob (required for photo uploads)

Serverless functions have **no persistent disk**. Uploads use [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) when `BLOB_READ_WRITE_TOKEN` is set.

1. In the Vercel project: **Storage** → **Blob** → create store → **Connect** to your app (this adds `BLOB_READ_WRITE_TOKEN` to the project).

Without this token, the app still builds, but **image upload falls back to disk** (works only in local dev).

### 3. Environment variables

In **Vercel → Project → Settings → Environment Variables**, set:

| Name | Notes |
|------|--------|
| `DATABASE_URL` | Production Postgres URL (often **pooled** / `?pgbouncer=true` if your provider splits pool vs direct). |
| `NEXTAUTH_SECRET` | Long random string (`openssl rand -base64 32`). |
| `NEXTAUTH_URL` | Your live site URL, e.g. `https://your-app.vercel.app` (no trailing slash). |
| `BLOB_READ_WRITE_TOKEN` | From Vercel Blob (step 2). |
| `GOOGLE_PLACES_API_KEY` | Optional; enables hotel autocomplete. |

Redeploy after changing env vars.

### 4. Connect Git and deploy

Push this repo to GitHub/GitLab/Bitbucket, import the repo in [Vercel](https://vercel.com/new), and deploy. The default **Build Command** `npm run build` runs `prisma generate` and `next build`.

### 5. Production checks

- Sign up / log in on the production URL.
- Create an itinerary with a **photo** (confirms Blob).
- If auth redirects fail, double-check `NEXTAUTH_URL` matches the browser URL exactly (including `https`).

## Learn More

- [Next.js deployment](https://nextjs.org/docs/app/building-your-application/deploying)
- [Prisma on Vercel](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)
