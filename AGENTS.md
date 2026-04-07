<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

### Product overview
Itinera is a Next.js 16 (App Router) + Prisma + PostgreSQL app for sharing and cloning trip/wedding itineraries. See `README.md` for full setup and deploy docs.

### Services
| Service | How to start | Port |
|---------|-------------|------|
| PostgreSQL 16 | `sudo docker compose up -d` (uses `docker-compose.yml` in repo root) | 5432 |
| Next.js dev server | `npm run dev` | 3000 |

### Environment variables
A `.env` file is required (gitignored). Minimum required:
```
DATABASE_URL="postgresql://itinera:itinera@localhost:5432/itinera"
NEXTAUTH_SECRET="<any-random-string>"
NEXTAUTH_URL="http://localhost:3000"
```

### Database
- Docker must be running before starting the app. Start dockerd with `sudo dockerd &>/tmp/dockerd.log &` if not already running.
- Apply migrations: `npx prisma migrate deploy`
- Seed demo data (optional): `npm run db:seed` — creates two demo users (`demo@itinera.local` / `demo1234!`, `sarah@itinera.local` / `demo1234!`) and 3 sample itineraries.
- Prisma Studio: `npm run db:studio`

### Lint / Build / Dev
- Lint: `npm run lint` (ESLint; pre-existing warnings/errors in repo — 2 errors, 2 warnings as of setup)
- Dev: `npm run dev`
- Build: `npm run build`

### Gotchas
- Docker runs nested (container-in-VM). The daemon needs `fuse-overlayfs` storage driver and `iptables-legacy`. These are configured during initial VM setup.
- The `postinstall` script runs `prisma generate` automatically, so the Prisma client is regenerated on every `npm install`.
- Google Places/Maps API keys are optional. Without them, venue search and map features are simply disabled.
- Image uploads fall back to local disk (`/public/uploads`) in dev when `BLOB_READ_WRITE_TOKEN` is not set.
