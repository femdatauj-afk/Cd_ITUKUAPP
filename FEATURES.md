# Feature Inventory

## Available now

- Responsive public landing page
- ItukuApp visual identity and 9-village directory
- Public navigation and early access experience
- Product shell for feed, auth, profile, groups, pages, marketplace, chat, admin, and developer flows
- NestJS backend with Prisma data access, JWT auth, and moderation pathways

## Planned and in-progress

- Accounts and verification
- Profiles and village-based membership
- Feed, stories, reactions and comments
- Pages, groups and wallet-led creation payments
- Marketplace, messaging and notifications
- Administrator and super-administrator tools
- PostgreSQL-backed production runtime configuration
- Redis-backed caching, rate limiting, and session-like controls
- Media storage with object storage and signed URL delivery
- Background jobs for moderation and indexing
- Observability and deployment-focused monitoring

## Product rules captured from the SRD

- Every account belongs to exactly one of the nine villages.
- Page creation costs ₦50, subject to wallet balance.
- Group creation costs ₦30, subject to wallet balance.
- Stories expire after 24 hours.
- Access privileges are role-based.
- Moderation actions must be enforceable at the feature boundary.
- Media delivery must remain secure, fast, and CDN-ready.
