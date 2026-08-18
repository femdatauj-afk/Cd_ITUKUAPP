# ITUKUAPP Deployment Guide

## Quick Deployment Options

### Option 1: Vercel (Recommended for Frontend)
```bash
npm install -g vercel
vercel
```
- Automatic deployments from GitHub
- Live URL instantly available
- Environment variables through Vercel dashboard

**Limitation**: Backend server must run separately (NestJS on localhost or separate server)

### Option 2: Local Tunneling with ngrok (Test Immediately)
```bash
# Install ngrok
choco install ngrok  # Windows

# Terminal 1: Run frontend dev server
npm run dev

# Terminal 2: Tunnel the dev server
ngrok http 3000
```
- Provides public URL: `https://xxxx-xx-xxxx-xxxx-xx.ngrok.io`
- Lives while ngrok is running
- Perfect for testing/sharing

### Option 3: Full Stack on Railway/Render
1. Push code to GitHub
2. Connect repo to Railway.app or Render.com
3. Deploy both frontend (Next.js) and backend (NestJS) simultaneously
4. Get live URL within minutes

## Current Status

- ✅ Frontend: **Next.js 15.1.2** - Fully buildable
- ✅ Backend: **NestJS 11.0.1** - Fully functional
- ✅ Database: **PostgreSQL 12+** via Prisma ORM
- ✅ All Phases 0-6F: Implemented and verified

## To Deploy Now

### With Vercel (Fastest):
```bash
npm run build    # Verify build
npm install -g vercel
vercel --prod
```

### With ngrok (Immediate Local Testing):
```bash
npm run dev     # Terminal 1
ngrok http 3000 # Terminal 2
# Share the public URL
```

### With Railway (Full Stack):
1. Create Railway account
2. Connect GitHub repo
3. Set environment variables
4. Deploy

## Environment Variables Needed

```
NEXT_PUBLIC_API_URL=http://localhost:3001  # Frontend
NODE_ENV=production                         # Server
PORT=3001                                   # Server
DATABASE_URL=postgresql://user:pass@host/db # Server
JWT_SECRET=your-secret-min-32-chars        # Server
CORS_ORIGINS=https://your-deployed-url     # Server
```

## After Deployment

All routes are live and functional:
- Dashboard: `/feed`
- Chat with profile links: `/chat`  
- User profiles: `/profile/[username]`
- Verification: `/verification`
- Admin dashboard: `/admin`
- Moderator dashboard: `/moderator`
- And 18+ other routes...

## Next Steps

1. Choose deployment option above
2. Run deployment command
3. Share live URL
4. Continue implementing Phase 2.4+ with deployment running
