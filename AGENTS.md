<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:caveman-always-on -->
Terse like caveman. Technical substance exact. Only fluff die.
Drop: articles, filler (just/really/basically), pleasantries, hedging.
Fragments OK. Short synonyms. Code unchanged.
Pattern: [thing] [action] [reason]. [next step].
ACTIVE EVERY RESPONSE. No revert after many turns. No filler drift.
Code/commits/PRs: normal. Off: "stop caveman" / "normal mode".
<!-- END:caveman-always-on -->

<!-- BEGIN:project-core-rules -->
# Project Core Rules — PERMANENT

1. **NO deadlines.** Solutions implemented correctly regardless of time. No rushed patches.
2. **Data flows through backend. ABSOLUTELY NO EXCEPTIONS.** Frontend → Go backend (validate/authorize/sanitize) → Database. NEVER write to DB directly from frontend Server Actions. This includes `supabase.auth.updateUser()`, `supabase.auth.getUser()`, and any other Supabase client calls that mutate data. ALL data mutations go through Go. Before writing any server action that touches Supabase, ask: "Does this go through Go?" If not, stop and fix it.
3. **Consult before implementing.** If unsure about approach, ask the project owner. Bad solutions worse than delayed solutions.
4. **Security over speed.** Every data mutation must have server-side validation, authorization, and sanitization in Go.
5. **NO unauthorized modifications.** Agents MUST ONLY modify files explicitly requested by the project owner. If a task requires touching files outside the stated scope (e.g., router.go, shared configs, unrelated pages), STOP and ASK first. Breaking changes to unrelated code are unacceptable.
6. **Pre-deploy diff review.** Before committing, always review `git diff --stat` to verify ONLY intended files were modified. If unexpected files appear, investigate before committing.
<!-- END:project-core-rules -->

<!-- BEGIN:deployment-guide -->
# Deployment Guide

## Architecture Overview

| Component | Stack | Host | How to deploy |
|---|---|---|---|
| **Frontend** | Next.js 16 (App Router) | Vercel | Auto-deploy from `master` branch |
| **Backend** | Go + Chi | Linode (172.238.217.35) | SSH + Docker rebuild |
| **Database** | PostgreSQL | Supabase | Managed — no deploy needed |

## When to Deploy What

### Frontend changes (`src/`, `prisma/`, `.env` vars like `NEXT_PUBLIC_*`)
- Push to `master` on GitHub → Vercel auto-deploys
- Environment variables: configure in **Vercel Dashboard → Settings → Environment Variables**
- `.env` / `.env.local` are gitignored — never committed

### Backend changes (`backend/`)
- Build Docker image on Linode and restart container
- Environment variables: `/opt/boogie-backend/.env` on Linode server

### Shared changes (affects both)
- Deploy backend first, then push frontend

## Deploy Procedures

### Frontend → Vercel (auto)

```bash
git add <files>
git commit -m "message"
git push origin master
# Vercel picks up automatically
```

### Backend → Linode (manual)

Linode has 1GB RAM — Go compilation OOMs. Use cross-compile + prebuilt Dockerfile:

```bash
# 1. Cross-compile locally (Windows PowerShell)
$env:GOOS="linux"; $env:GOARCH="amd64"; $env:CGO_ENABLED="0"
cd backend && go build -ldflags="-s -w" -o server ./cmd/server

# 2. Upload binary + pull code
scp backend/server root@172.238.217.35:/opt/boogie-repo/backend/server
ssh root@172.238.217.35 "cd /opt/boogie-repo && git pull origin master && chmod +x backend/server"

# 3. Build minimal Docker image (no Go compilation)
ssh root@172.238.217.35 "cd /opt/boogie-repo && docker build -f backend/Dockerfile.prebuilt -t boogie-backend:latest ./backend"

# 4. Restart stack
ssh root@172.238.217.35 "cd /opt/boogie-repo && docker compose up -d --force-recreate api"

# 5. Verify
ssh root@172.238.217.35 "docker exec boogie-backend wget -qO- http://localhost:8080/healthz"
# Expected: {"status":"ok"}
```

CI/CD (GitHub Actions): auto-deploys on push to master with `backend/**` changes.
Uses same cross-compile approach — no Go build on Linode.

## Environment Variables

### Frontend (Vercel Dashboard)
| Variable | Production Value |
|---|---|
| `NEXT_PUBLIC_APP_URL` | `https://www.boogierent.com` |
| `NEXTAUTH_URL` | `https://www.boogierent.com` |
| `NEXT_PUBLIC_SUPABASE_URL` | (Supabase project URL) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (Supabase anon key) |

### Backend (Linode `/opt/boogie-backend/.env`)
| Variable | Production Value |
|---|---|
| `APP_URL` | `https://www.boogierent.com` |
| `PORT` | `8080` |
| `SUPABASE_URL` | (Supabase project URL) |
| `SUPABASE_SECRET_KEY` | (Supabase service role key) |
| `SUPABASE_JWT_SECRET` | (JWT secret) |
| `DATABASE_URL` | (Supabase pooler connection) |

## Pre-Deploy Checklist

1. **Tests pass**: `npm test` (frontend), `cd backend && go test ./...`
2. **Lint clean**: `npm run lint` (frontend)
3. **No secrets committed**: verify `.env*` files are gitignored
4. **Backend .env synced**: if new env vars added, update `/opt/boogie-backend/.env` on Linode
5. **Vercel env synced**: if new `NEXT_PUBLIC_*` or server-side vars added, update Vercel Dashboard

## Rollback

- **Frontend**: Vercel Dashboard → Deployments → Redeploy previous
- **Backend**: `ssh root@172.238.217.35 "docker logs boogie-backend"` → if broken, `cd /opt/boogie-repo && git checkout <previous-commit> && docker build -t boogie-backend:latest ./backend` then restart
<!-- END:deployment-guide -->
