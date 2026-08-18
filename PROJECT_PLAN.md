# ItukuApp Project Plan

## Phase 1 — Foundation and stabilization (current)

- Stabilize the existing Next.js frontend and NestJS backend
- Preserve current functionality while extending it incrementally
- Standardize Prisma + PostgreSQL runtime configuration
- Connect Redis for caching, rate limiting, and flow control
- Document architecture boundaries and shipping responsibilities

## Phase 2 — Identity and trust

- Registration, login, JWT enforcement, password reset
- Email verification, OTP workflows, role rules, village membership
- Admin review and account activation flows

## Phase 3 — Community content

- Feed, posts, comments, likes, shares, saved items, stories
- Media upload processing, object storage, signed URL delivery
- Post indexing and feed ranking via background jobs

## Phase 4 — Communities and monetization

- Groups, pages, marketplace listings, wallet operations
- Paid group/page creation checks with transaction tracking
- Moderation review and violation enforcement infrastructure

## Phase 5 — Messaging and realtime operations

- Direct messaging, group messaging, read receipts, calls
- Socket-based activity updates and session-aware delivery
- Redis-backed presence and coordination

## Phase 6 — Operations, scale, and release

- Background worker pipeline for notifications and indexing
- Observability, health checks, performance metrics, structured logs
- CDN and object storage integration for media delivery
- Deployable production configuration and hardening review

## Delivery principle

Each phase is implemented against the current app without a rewrite. Runtime configuration moves to PostgreSQL and Redis as the canonical production setup, while the feature modules remain intact and explicit.
