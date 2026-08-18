# ItukuApp

**One Community. Nine Villages. One Voice.**

ItukuApp is a community-first social platform for the nine villages of Ituku Community. The current repository already contains a working product shell with a Next.js frontend and a NestJS backend, and the goal is to extend that system incrementally rather than replace it.

## Current architecture

- Frontend: Next.js 15 + React 19 + TypeScript
- Backend: NestJS 11 + Prisma + Passport + JWT + Socket.IO
- Database: PostgreSQL as the canonical runtime database, with Prisma as the ORM
- Cache and flow control: Redis for rate limiting, caching, and session-style coordination
- Media: object storage with signed URLs and CDN-ready delivery
- Background jobs: notifications, moderation processing, indexing, and async tasks

## Run locally

1. Install Node.js 20 or later.
2. Start supporting infrastructure:
   - `docker compose up -d postgres redis`
3. Install dependencies:
   - root app: `npm install`
   - server app: `cd server && npm install`
4. Start the backend:
   - `cd server && npm run start:dev`
5. Start the frontend:
   - `npm run dev -- --port 3002`
6. Open `http://localhost:3002`

## Production-oriented extension plan

This app should stay in its current modular structure while the following boundaries are formalized:

- Auth: registration, verification, login, password reset, JWT policies
- Users: profiles, follows, friendships, account states
- Content: posts, comments, reactions, stories, feeds
- Messaging: conversations, read state, attachments, calls
- Moderation: warnings, muting, suspension, bans, reporting
- Media: upload processing, object storage, signed URL exchange, CDN delivery
- Payments: wallet ledger, transfers, withdrawals, marketplace charges
- Observability: logs, metrics, tracing, health checks, error tracking

## Design principles

- Preserve the existing build and extend it incrementally.
- Do not replace the current app with a new stack.
- Use PostgreSQL as the production canonical database.
- Use Redis for transient coordination and rate limiting.
- Use object storage plus signed URLs for media handling.
- Keep feature boundaries clear and module-based.

See [PROJECT_PLAN.md](PROJECT_PLAN.md), [FEATURES.md](FEATURES.md), and [TODO.md](TODO.md).
