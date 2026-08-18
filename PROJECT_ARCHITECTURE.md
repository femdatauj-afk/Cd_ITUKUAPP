# ITUKUAPP Project Architecture

## Current System Overview

**ItukuApp** is a Facebook-style social/community platform built for the Ituku community with nine villages. The application is a split-architecture system with a Next.js frontend and a NestJS backend.

### Technology Stack

#### Frontend
- **Framework**: Next.js 15.1.2 with App Router
- **UI Library**: React 19
- **Language**: TypeScript
- **Styling**: CSS-in-JSX (tailwind for utility, inline styles for components)
- **Port**: 3002 (development)
- **Features**: Server Components, Client Components, API integration via `app/lib/api.ts`

#### Backend
- **Framework**: NestJS 11.x
- **Language**: TypeScript
- **Authentication**: JWT + Passport
- **Realtime**: Socket.IO (configured, integration pending)
- **Port**: 4000 (API on /api prefix)
- **Database ORM**: Prisma
- **Database Driver**: PostgreSQL (production), SQLite with better-sqlite3 (local dev)

#### Database
- **Primary**: PostgreSQL (configured in schema)
- **Local Dev**: SQLite (dev.db via better-sqlite3 adapter)
- **Migrations**: Prisma migrations stored in server/prisma/migrations/
- **Schema**: server/prisma/schema.prisma (single source of truth)

### Architecture Diagram

```
Browser (http://localhost:3002)
    ↓
Next.js Frontend (App Router)
    ├── app/page.tsx (home/feed)
    ├── app/chat/page.tsx (messaging)
    ├── app/marketplace/page.tsx (commerce)
    ├── app/communities/page.tsx (communities)
    ├── app/groups/[id]/page.tsx (groups)
    ├── app/profile/page.tsx (profile)
    └── app/lib/api.ts (centralized API client)
    ↓
HTTP REST + WebSocket (http://localhost:4000/api)
    ↓
NestJS Backend
    ├── src/auth/ (JWT, registration, login)
    ├── src/user/ (profile, social graph)
    ├── src/community/ (feed, groups, pages, marketplace)
    ├── src/chat/ (messaging, conversations)
    ├── src/call/ (voice/video call signaling)
    ├── src/moderation/ (moderation actions)
    ├── src/wallet/ (transactions, balance)
    ├── src/verification/ (badge system, approval)
    └── src/prisma/ (database access)
    ↓
PostgreSQL Database
    ├── User (with roles, verification status)
    ├── Wallet (balance + metadata)
    ├── Post (with soft delete for archives)
    ├── Follow (social graph)
    ├── Group, GroupMember, GroupModerator
    ├── Page, PageMember
    ├── MarketplaceListing, MarketplaceImage
    ├── Conversation, Message
    ├── Call (with participants)
    ├── Verification, VerificationAudit
    ├── WalletTransaction (complete ledger)
    ├── ModerationAction (audit trail)
    └── [More models in full schema]
```

## Current Database Models

### User System
- **User**: Core identity (email, username, fullName, village, bio, role, verified status, profile/cover photo)
- **Wallet**: Balance + metadata (1:1 with User)
- **Follow**: Directed social graph (follower → followed)
- **Friendship**: Bidirectional friend requests (status: pending/accepted)

### Community Structure
- **Group**: Collections of users (name, slug, category, createdAt)
- **GroupMember**: Membership with role (admin/member/moderator)
- **Page**: Publisher-owned pages (name, category, follower count)
- **Community**: Implied through groups + village membership

### Content
- **Post**: Status updates (authorId, content, photo, createdAt)
- **Comment**: Replies to posts
- **Like**: Post engagement
- **Share**: Post redistribution
- **Mention**: User tagging in content

### Commerce
- **MarketplaceListing**: Products/services (sellerId, title, description, price, village, status)
- **MarketplaceImage**: Listing media (url, isPrimary)
- **MarketplaceFavourite**: Saved listings
- **MarketplaceReport**: Moderation reports

### Messaging & Calls
- **Conversation**: Group or 1:1 threads (type, participants)
- **ConversationParticipant**: Membership in conversations
- **Message**: Individual messages (senderId, text, audioUrl, createdAt, seen status)
- **Call**: Voice/video sessions (callerId, receiverId, type, duration, status)

### Security & Moderation
- **ModerationAction**: Audit trail (userId, action, reason, moderatorId, status, createdAt)
- **EmailVerification**: Email verification tokens
- **OTP**: One-time passwords for phone verification
- **PasswordReset**: Password reset tokens

### Wallet & Verification (To Enhance)
- **Wallet**: Current simple balance structure
- **WalletTransaction**: (Not yet in schema - needs implementation)
- **Verification**: (Needs expansion from simple isVerified boolean)
- **VerificationAudit**: (Needs creation for audit trail)

## Frontend Structure

```
app/
├── layout.tsx (root layout with shell)
├── page.tsx (home - community feed)
├── globals.css (global styles)
├── about/page.tsx
├── admin/page.tsx (development)
├── auth/
│   ├── login/page.tsx
│   └── register/page.tsx
├── chat/page.tsx (messaging - needs redesign)
├── coins/page.tsx (wallet - needs implementation)
├── communities/page.tsx (village/community list)
│   └── [village]/page.tsx (specific community)
├── developer/page.tsx
├── feed/page.tsx (explicit feed route)
├── groups/page.tsx
│   └── [id]/page.tsx
├── marketplace/page.tsx (listings)
├── pages/page.tsx (published pages)
│   └── [id]/page.tsx
├── profile/page.tsx (current user)
├── components/
│   └── app-shell.tsx (main layout wrapper)
└── lib/
    └── api.ts (centralized API client & helpers)
```

**Key File: `app/lib/api.ts`**
- Centralized API request helper
- Session management (localStorage-based)
- Seeded user data fallback
- Marketplace listing helpers
- Built-in resilience with fallback to local data

## Backend Structure

```
server/
├── src/
│   ├── main.ts (app entry, port 4000)
│   ├── app.module.ts (main module)
│   ├── app.controller.ts
│   ├── app.service.ts
│   ├── auth/
│   │   ├── auth.service.ts (registration, login, JWT)
│   │   ├── auth.controller.ts
│   │   ├── auth.module.ts
│   │   ├── jwt.strategy.ts
│   │   └── jwt-auth.guard.ts
│   ├── user/
│   │   ├── user.service.ts (profiles, social graph, discover)
│   │   ├── user.controller.ts
│   │   └── user.module.ts
│   ├── community/
│   │   ├── community.service.ts (feed, groups, pages, marketplace)
│   │   ├── community.controller.ts
│   │   └── community.module.ts
│   ├── chat/
│   │   ├── chat.service.ts
│   │   ├── chat.gateway.ts (Socket.IO)
│   │   └── chat.module.ts
│   ├── call/
│   │   ├── call.service.ts
│   │   ├── call.gateway.ts (WebRTC signaling)
│   │   └── call.module.ts
│   ├── moderation/
│   │   ├── moderation.service.ts
│   │   ├── moderation.controller.ts
│   │   └── moderation.module.ts
│   ├── wallet/
│   │   ├── wallet.service.ts (balance management)
│   │   ├── wallet.controller.ts
│   │   └── wallet.module.ts
│   ├── verification/
│   │   ├── verification.service.ts (badge logic)
│   │   ├── verification.controller.ts
│   │   └── verification.module.ts
│   ├── prisma/
│   │   ├── prisma.service.ts (database wrapper)
│   │   └── prisma.module.ts
│   └── email/
│       └── email.service.ts (transactional emails)
├── prisma/
│   ├── schema.prisma (data model)
│   └── migrations/
│       └── [timestamp]_init/
│           └── migration.sql
├── seed-developer.ts (idempotent seed for verified accounts)
├── package.json (includes seed:developer script)
└── [config files]
```

## Current Routes (Frontend)

### Authentication
- `GET /` → home (feed)
- `POST /auth/login` → login page
- `POST /auth/register` → register page
- `GET /auth/me` → current user profile

### Social
- `GET /chat` → messaging (needs redesign)
- `GET /communities` → list communities
- `GET /communities/[village]` → village/community
- `GET /groups` → list groups
- `GET /groups/[id]` → group detail (needs dynamic slug)
- `GET /feed` → explicit feed
- `GET /profile` → current user profile
- `GET /profile/[username]` → user profile (needs implementation)

### Content Creation
- `POST /marketplace` → create listing (form exists)
- `POST /groups` → create group (button exists, needs flow)
- `POST /pages` → create page (needs implementation)

### Commerce & Wallet
- `GET /coins` → wallet/coin page (needs implementation)
- `GET /marketplace` → marketplace listings
- `GET /marketplace/[id]` → listing detail (needs implementation)

### Admin/Dev
- `GET /admin` → admin panel (exists)
- `GET /developer` → dev tools (exists)

## Current Routes (Backend API)

### Authentication
- `POST /api/auth/register` → new user account
- `POST /api/auth/login` → JWT token
- `GET /api/auth/me` → current user (JwtAuthGuard)
- `PUT /api/auth/profile` → update profile (JwtAuthGuard)
- `POST /api/auth/wallet/fund` → add balance (JwtAuthGuard)
- `POST /api/auth/send-verification-email` → email verification
- `POST /api/auth/verify-email` → confirm email
- `POST /api/auth/request-otp` → OTP for phone
- `POST /api/auth/verify-otp` → confirm phone
- `POST /api/auth/request-password-reset` → reset flow start
- `POST /api/auth/reset-password` → reset flow complete

### Users
- `GET /api/users/directory` → discover people (JwtAuthGuard, queryable)
- `GET /api/users/profile/:usernameOrId` → public profile
- `POST /api/users/friend-request/:targetUserId` → send (JwtAuthGuard)
- `POST /api/users/friend-request/:requestId/accept` → accept (JwtAuthGuard)
- `DELETE /api/users/friend-request/:requestId` → decline (JwtAuthGuard)
- `GET /api/users/friend-requests` → pending (JwtAuthGuard)
- `GET /api/users/:userId/friends` → friends list
- `GET /api/users/:userId/mutual-friends` → mutual friends (JwtAuthGuard)

### Community/Content
- `GET /api/community/feed` → posts
- `POST /api/community/posts` → create post (JwtAuthGuard)
- `GET /api/community/villages` → village list
- `GET /api/community/villages/:name` → village detail + posts
- `GET /api/community/groups` → groups list
- `POST /api/community/groups` → create group (JwtAuthGuard)
- `GET /api/community/pages` → pages list
- `POST /api/community/pages` → create page (JwtAuthGuard)
- `GET /api/community/marketplace` → listings
- `POST /api/community/marketplace` → create listing (JwtAuthGuard)

### Chat (WebSocket)
- Socket.IO on `/socket.io` (connected but minimal)
- Message delivery via REST (fallback)

### Calls (WebSocket)
- Call state endpoints exist
- Full WebRTC signaling needs implementation

### Moderation
- Routes exist but need full implementation

### Wallet
- Routes exist but need WalletTransaction model expansion

## Seeded Developer & Moderator Network

All verified and active with wallet balance 1,000,000 ItukuApp Coins:

1. **Henry-Of-Ituku** (Developer)
   - Email: henry4683328@gmail.com
   - Village: Umukulu
   - Bio: Verified founder and lead developer
   - Role: developer
   - Verified: true

2. **AminaEde** (Moderator)
   - Village: Umukulu
   - Bio: Community leader focused on youth growth
   - Role: moderator

3. **TochukwuAgwu** (Moderator)
   - Village: Umukulu
   - Bio: Volunteer mentor and event organizer
   - Role: moderator

4. **NnekaEgbu** (Moderator)
   - Village: Ugwunagbo
   - Bio: Village project coordinator
   - Role: moderator

5. **ChimaOkafor** (Moderator)
   - Village: Okwenachala
   - Bio: Community organizer and local development advocate
   - Role: moderator

6. **AdaOkoye** (Moderator)
   - Village: Ugwunagbo
   - Bio: Youth chairman
   - Role: moderator

7. **IfeomaEze** (Member)
   - Village: Amokolo
   - Bio: Mentor and digital literacy volunteer
   - Role: member

8. **KelechiNnaji** (Member)
   - Village: Amokolo
   - Bio: Community member passionate about local commerce
   - Role: member

9. **RoseNwoko** (Member)
   - Village: Umukulu
   - Bio: Supports family wellbeing and community care
   - Role: member

10. **MusaNwachukwu** (Member)
    - Village: Umukulu
    - Bio: Student and community volunteer
    - Role: member

All new users auto-follow the developer and moderator network on registration for immediate community connection.

## Known Issues & TODO

See TODO.md for complete implementation checklist organized by phase.

### Critical Path Issues
1. ⚠️ Chat user links don't navigate to profiles
2. ⚠️ Dynamic group routes not fully implemented
3. ⚠️ Wallet system needs transaction ledger
4. ⚠️ Verification system needs full flow + badge
5. ⚠️ Voice/video calls not functional
6. ⚠️ Post/content storage/archive system missing
7. ⚠️ Marketplace seller flow incomplete

## Development Workflow

### Starting the Application

**Terminal 1 - Frontend:**
```bash
cd c:\Users\user\Desktop\Cd_ITUKUAPP
npm run dev -- --port 3002
```

Access at: http://localhost:3002

**Terminal 2 - Backend:**
```bash
cd c:\Users\user\Desktop\Cd_ITUKUAPP\server
npm run start:dev
```

Access at: http://localhost:4000/api

### Database Management

**View/edit database:**
```bash
cd server
npx prisma studio
```

**Create migration:**
```bash
cd server
npx prisma migrate dev --name migration_name
```

**Seed verified accounts:**
```bash
cd server
npm run seed:developer
```

**Run tests:**
```bash
cd server
npx jest src/auth/auth.service.spec.ts --runInBand
```

## Next Phase: Production Upgrade

Follow the 44-point specification in TODO.md across 14 phases.

**Immediate focus**: Complete Phase 1 (Audit), then Phase 2 (Core Fixes).

**Target result**: A professional, scalable Facebook-style platform built specifically for ItukuApp.
