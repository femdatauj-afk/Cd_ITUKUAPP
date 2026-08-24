# ITUKUAPP Production Upgrade - Phase-Based TODO

**Target**: Build a professional Facebook-style social platform for ItukuApp following the 44-point specification.

**Start Date**: 2026-08-17  
 **Status**: Recovery checkpoint recorded; wallet and profile slices validated; broader worktree remains uncommitted

---

## QUICK STATUS

- ✅ Phase 0 Complete: Foundation (auth, seeding, basic API)
- ✅ Phase 1 Complete: Audit & Documentation
- 🔄 Phase 2-14: Continue one scoped slice at a time (see sections below)

## RECOVERY CHECKPOINT - 2026-08-22

- Frontend build passes: 29 routes, including `/wallet`.
- Backend build passes from the `server` directory.
- Wallet history now uses the ledger as its single source and calculates historical balances.
- Backend withdrawals require whole positive coin amounts.
- The worktree contains a broad preserved uncommitted upgrade batch; no reset or destructive cleanup has been performed.
- Do not start another feature slice until the current slice is validated and checkpointed in Git.

## DEVELOPMENT WORKFLOW CHECKPOINT - 2026-08-22

- Root project is the only active frontend; the unused nested `itukuapp` starter app was removed.
- Use `npm run dev:all` from the repository root for the stable local preview.
- Frontend: `http://localhost:3002`; backend API: `http://localhost:4000/api`.
- Frontend and backend builds pass after consolidating the development scripts.

---

## PHASE 1: AUDIT EXISTING APPLICATION

- [x] **1.1** Inspect complete project structure
- [x] **1.2** Verify Next.js 15 setup with App Router
- [x] **1.3** Verify NestJS 11 backend compiles
- [x] **1.4** Confirm PostgreSQL schema complete
- [x] **1.5** Test database connectivity (dev.db)
- [x] **1.6** Verify seeded accounts accessible
- [x] **1.7** Run frontend on port 3002
- [x] **1.8** Run backend on port 4000
- [x] **1.9** Audit Socket.IO setup
- [x] **1.10** Audit WebRTC infrastructure
- [x] **1.11** Identify storage endpoints
- [x] **1.12** Audit component library
- [x] **1.13** List API client functions
- [x] **1.14** Confirm auth flow works
- [x] **1.15** Test wallet display
- [x] **1.16** Test marketplace creation
- [x] **1.17** Test group/page display
- [x] **1.18** Test chat functionality
- [x] **1.19** Test profile viewing
- [x] **1.20** Test community viewing
- [x] **1.21** Confirm migrations complete
- [x] **1.22** Generate audit report ✅
- [x] **1.23** Document code comments ✅
- [x] **1.24** Create PROJECT_ARCHITECTURE.md ✅
- [x] **1.25** Create comprehensive memory ✅

---

## PHASE 2: CORE FIXES & ROUTING

- [x] Fix user profile links in chat
- [x] Create /profile/[username] route
- [x] Create /verification route
- [x] Create /wallet route
- [x] Create /groups/[id] route
- [x] Create /pages/[id] route
- [x] Create /marketplace route
- [x] Create /chat/[conversationId]
- [x] Create admin/moderator dashboard routes
- [x] Dashboard header cleanup
- [x] Error boundary components
- [x] 404 page handling
- [x] Build verification (TypeScript)

---

## PHASE 3: WALLET SYSTEM & ITUKUAPP COIN

- [x] Database models (WalletTransaction, CoinTransaction)
- [x] Backend wallet service (debit, credit, history)
- [x] Backend wallet API routes
- [x] ItukuApp Coin SVG component (xs, sm, md, lg)
- [x] ItukuCoinIcon component
- [x] ItukuCoinAmount component
- [x] ItukuCoinBalance component
- [ ] Frontend wallet pages (/wallet/transactions, /wallet/coin)
- [x] Frontend wallet integration
- [x] Wallet balance in header/nav
- [x] Wallet balance in profile
- [ ] Tests (credit, debit, history, duplicates)
- [x] Wallet build validation and duplicate-history correction
- [x] Shared coin UI and live balance surfaces

## COMMENTS AND MEDIA CHECKPOINT - 2026-08-22

- [x] Generic post comments support replies, reactions, edit, and delete.
- [x] Generic post comments support image and video attachments.
- [x] Feed composer uploads images and MP4/WebM videos to local storage.
- [x] Local database schema updated with threaded comments and comment reactions.
- [x] Shared feed comment component compiled and integrated.
- [x] Group and page posts use persistent threaded comment/reaction routes and shared UI.
- [ ] Community posts still need a persistent post model and the same comment/reaction wiring.
- [x] Preview/API recovery checkpoint: frontend `127.0.0.1:3003`, backend `127.0.0.1:4000`.

---

## PHASE 4: VERIFICATION SYSTEM & BADGE

- [ ] Database models (Verification, VerificationAudit)
- [ ] VerifiedBadge component (SVG, multiple sizes)
- [ ] Add badge to 16+ user display locations
- [ ] Verification page (/verification)
- [ ] Multi-step verification workflow UI
- [ ] Backend verification service
- [ ] Backend verification API routes
- [ ] ItukuApp Bolt verification engine
- [ ] Face verification with consent
- [ ] Security checks and audit logging
- [ ] Tests (workflow, payment, approval, audit)

---

## PHASE 5: MODERATOR / ADMIN ARCHITECTURE

- [ ] Database models (CommunityModerator, GroupModerator, etc.)
- [ ] Permission helper functions
- [ ] Platform roles (USER, MODERATOR, ADMIN, DEVELOPER)
- [ ] Context-specific roles (CommunityModerator, etc.)
- [ ] Moderator dashboard
- [ ] Admin dashboard
- [ ] Moderator visibility sections (all contexts)
- [ ] Community moderator rule (SPEC 12)
- [ ] Tests (permissions, authorization, roles)

---

## PHASE 6: COMMUNITY POST STORAGE & ARCHIVES

- [ ] Database models (PostArchive, soft delete fields)
- [ ] Backend storage service (archive, restore, delete)
- [ ] Backend archive API routes
- [ ] Frontend archive pages (community, group, page)
- [ ] Archive search and filtering
- [ ] Restore functionality
- [ ] Moderation history display
- [ ] Tests (archive, restore, search)

---

## PHASE 7: CREATION WORKFLOWS

- [ ] Group creation form (/groups/create)
- [ ] Slug generation for groups
- [ ] Wallet debit for group creation
- [ ] Page creation form (/pages/create)
- [ ] Marketplace seller setup (/marketplace/setup)
- [ ] Cost validation on all creations
- [ ] Redirect to created entity
- [ ] Post-creation capabilities
- [ ] Tests (all workflows, cost deduction)

---

## PHASE 8: GROUP DASHBOARD REDESIGN

- [ ] Redesign group header (cover, profile pic, name, desc)
- [ ] Create navigation tabs (Discussion, About, Members, Moderators, Photos, etc.)
- [ ] Responsive layout (desktop, tablet, mobile)
- [ ] Tab switching with URL state
- [ ] All functionality implementation
- [ ] Professional design (Facebook-inspired)

---

## PHASE 9: MARKETPLACE PERSISTENCE & NAVIGATION

- [ ] Audit marketplace implementation
- [ ] Verify data persistence
- [ ] Listing detail pages
- [ ] Seller profile views
- [ ] Buyer-seller messaging
- [ ] Listing management (edit, delete, publish)
- [ ] Search and filtering
- [ ] Fix broken links
- [ ] Media storage verification

---

## PHASE 10: CHAT REDESIGN

- [ ] Professional UI redesign
- [ ] Left sidebar (search, conversations, online users)
- [ ] Main conversation area
- [ ] Message features (text, images, audio, reactions)
- [ ] Composer with attachments
- [ ] Realtime messaging
- [ ] User profile linking fix (from Phase 2)
- [ ] Message persistence (PostgreSQL)
- [ ] Read receipts and typing indicators

---

## PHASE 11: VOICE & VIDEO CALLS

- [ ] Voice call button implementation
- [ ] Microphone permission handling
- [ ] WebRTC peer connection
- [ ] Socket.IO signaling
- [ ] Call states and UI
- [ ] Video call implementation
- [ ] Camera permission handling
- [ ] Video UI components
- [ ] STUN/TURN configuration
- [ ] Error handling
- [ ] Call history

---

## PHASE 12: GROUP CALLS

- [ ] Group call button
- [ ] Multi-participant UI (video grid)
- [ ] Participant management
- [ ] Permission checks
- [ ] Signaling for multiple peers
- [ ] Active speaker indication
- [ ] Call duration tracking
- [ ] Responsive layout

---

## PHASE 13: RESPONSIVE DESIGN & PERFORMANCE

- [ ] Desktop testing (1920, 1440)
- [ ] Laptop testing (1024, 1366)
- [ ] Tablet testing (768, 820)
- [ ] Mobile testing (375, 414, 640)
- [ ] Pagination implementation
- [ ] Lazy loading (images, videos)
- [ ] Virtualized lists
- [ ] Database query optimization (N+1 fixes)
- [ ] Image compression and optimization
- [ ] Media storage verification
- [ ] Loading skeletons
- [ ] Empty states
- [ ] Error states

---

## PHASE 14: TESTING & DEPLOYMENT

- [ ] Database migration testing
- [ ] TypeScript compilation (zero errors)
- [ ] Build verification (frontend and backend)
- [ ] ESLint/lint checks
- [ ] Unit tests (auth, wallet, verification)
- [ ] Integration tests (user journeys)
- [ ] Functional testing (all features)
- [ ] Route testing (all 40+ routes)
- [ ] Security testing (authorization, auth)
- [ ] Browser/device testing
- [ ] Performance metrics
- [ ] Deployment preparation
- [ ] Final verification

---

## IMPLEMENTATION NOTES

See `PROJECT_ARCHITECTURE.md` for:
- Complete system overview
- Database schema details
- Current seeded accounts (10 verified users)
- All existing routes and API endpoints
- Component library inventory
- Known issues by phase

---

**Next Action**: Continue Phase 1 or move to Phase 2 based on priorities
