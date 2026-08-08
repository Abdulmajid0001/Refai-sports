# RefAI Sports Platform Deployment Guide

## 1. Project overview

RefAI is a production-ready sports operating platform for AI-assisted officiating, live match streaming, commentary, competition management, team registration, viewer experience, moderation, and broadcast graphics.

The platform is designed to support:
- Live football, basketball, volleyball and multi-sport match coverage
- Team and player registration flows
- League owner dashboards and competition management
- Match moderator and referee consoles
- Commentary and live audio updates
- Broadcast graphics overlays and match announcements
- AI referee assistance and basic match intelligence
- Viewer match pages, live stats and timeline systems
- Secure admin access with role-based controls
- Monetization through ads and subscription monetization

This repository is built as a modern web application front end and a modular backend-ready architecture with existing Supabase integration, Netlify serverless functions, and a Vite-based React app.

---

## 2. Product specification summary

### Core platform goals
- Allow leagues to manage competition structure, rules and schedules
- Allow team owners and coaches to manage squads, lineups and player registration
- Support moderators and referees in controlling live match state
- Show live scoreboard, stats, overlays and timeline events to viewers
- Push announcements, VAR updates, cards, goals and match notifications instantly
- Support AI assistance where enabled by moderators or league owners
- Offer a professional broadcast-style experience across mobile, tablet and desktop

### User roles
- Super Admin
- League Owner
- Match Admin / Referee Operator
- Team Manager / Team Owner
- Commentator
- Camera Operator
- Viewer / Guest

### Core modules included or staged in this codebase
- Homepage and landing experience
- League and team registration screens
- Dashboard routes for league, team, viewer, moderator and commentator workflows
- Match viewer experience with live timer and events
- Match moderator and referee dashboards
- Broadcast graphics and overlays
- AI referral logic hooks and dashboard modules
- Ad and media management screens
- Access control and profile-based role gating

### Broadcast and moderation features expected in the full platform
The full business specification includes:
- Multi-camera live support
- Moderator push overlays and graphics
- VAR popup and review logic
- Formation display, team intros, league intros and scoreboard overlays
- Replay engine and clip creation workflow
- Announcement generator for hydration breaks, delays and urgent match updates
- AI feature toggles per match and per league
- Customizable league branding and scoreboard graphics
- Team/player media uploads, jersey photos and short profile videos
- Invite-based team entry into leagues
- Match invitations for moderators, commentators and camera operators

---

## 3. Technologies used

### Frontend
- React
- Vite
- TypeScript
- Tailwind CSS
- TanStack Router
- TanStack Query
- Radix UI components
- Lucide icons

### Backend / services
- Supabase for authentication, database and realtime features
- Netlify Functions for serverless backend actions
- Stripe-ready subscription and payment hooks
- OpenAI-ready AI assistant integration

### Optional production integrations
- Redis for real-time caching or queue work
- WebRTC / LiveKit-ready architecture
- Firebase or another realtime provider in extensions
- Cloud storage for media uploads
- CDN for image and video delivery

---

## 4. Important project structure

Key folders:
- src/ — application frontend
- src/components/ — pages, dashboards, match panels and UI modules
- src/routes/ — route definitions for app navigation
- src/hooks/ — reusable auth and app hooks
- src/lib/ — shared utilities and server-side action stubs
- src/integrations/ — service integrations and Supabase client wiring
- netlify/functions/ — Netlify serverless functions
- db/migrations/ — database migration assets
- public/ — static files and redirects

---

## 5. Local development setup

### Requirements
- Node.js 18 or later
- npm
- Git
- Supabase project access
- Stripe account access for production finance features
- Optional: Netlify CLI

### Install dependencies
```bash
npm install
```

### Run locally
```bash
npm run dev
```

The app is configured to run on:
- http://localhost:5173

### Production build
```bash
npm run build
```

### Preview production build locally
```bash
npm run preview
```

---

## 6. Environment variables

Create a .env file in the project root with values similar to the following:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
VITE_OPENAI_API_KEY=your-openai-key
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxx
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
```

Optional values for future production expansions:
```env
REDIS_URL=redis://localhost:6379
LIVEKIT_URL=wss://your-livekit-host
LIVEKIT_API_KEY=your-livekit-key
LIVEKIT_API_SECRET=your-livekit-secret
NETLIFY_SITE_NAME=refai-platform
```

> The current front-end uses the Supabase client from `src/integrations/supabase/client.ts` and expects the Supabase environment variables to be defined.

---

## 7. Supabase setup

### 1. Create a Supabase project
Create a new project in Supabase and get the project URL and anon key.

### 2. Run migrations
Use the schema files in `db/migrations/` and in `supabase/migrations/` where available.

Recommended flow:
```bash
# if using supabase cli
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

### 3. Auth setup
Enable:
- Email authentication
- Email confirmation
- Password reset

### 4. Role setup
Create or verify a `profiles` table and role values such as:
- super_admin
- league_owner
- team_owner
- moderator
- commentator
- viewer

---

## 8. How to access the super admin page

To access the Super Admin dashboard, the signed-in user must have a profile record with the role set to `super_admin` and the account status approved.

### Recommended method
1. Sign up a user from the app login screen.
2. Confirm the email in Supabase Auth.
3. Update the user profile row in the database.

Example SQL:
```sql
UPDATE profiles
SET role = 'super_admin', account_status = 'approved'
WHERE email = 'admin@yourdomain.com';
```

Then sign in and visit:
```text
/dashboard
```

Or the direct admin route:
```text
/admin
```

If the app requires role checks on routes, the user must also have a valid profile row and a matching upper-level permission state.

---

## 9. Stripe setup

This platform is designed to support subscriptions, league plans and monetization.

### Required Stripe items
- Secret key
- Publishable key
- Webhook secret
- Product and price IDs for subscription tiers

### Recommended steps
1. Create products for league subscription tiers
2. Create recurring prices
3. Add webhook endpoint for `checkout.session.completed`
4. Store payment records in your application database
5. Tie wallet / monetization logic to the payment records

Example webhook paths:
```text
https://your-domain.com/api/stripe-webhook
```

For local testing, use Stripe CLI:
```bash
stripe listen --forward-to localhost:3000/api/stripe-webhook
```

---

## 10. Netlify deployment

### Frontend deploy
This app is ready for Netlify static hosting.

#### Build settings
- Build command:
```bash
npm run build
```
- Publish directory:
```bash
dist
```

### Required Netlify environment variables
Set the same environment variables from `.env` in the Netlify project settings:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `VITE_STRIPE_PUBLISHABLE_KEY`
- `VITE_OPENAI_API_KEY`

### Netlify functions
The project already includes serverless function files under:
- `netlify/functions/`

If additional backend features are required, they can be extended there.

---

## 11. Recommended production architecture

### Recommended deployment split
- Frontend: Netlify or Vercel
- Database and auth: Supabase
- Serverless compute: Netlify Functions
- Storage: Supabase Storage / cloud object storage
- Real-time media: WebRTC or LiveKit-ready layer
- Payments: Stripe
- Search / analytics: optional DB or external analytics

### Production notes
- Set HTTPS and custom domain
- Enable CDN caching for static assets
- Turn on Supabase Row Level Security (RLS) and enforce proper policies
- Store secrets only in environment variables
- Secure admin routes with auth checks and role validation
- Add rate limiting and abuse detection as traffic grows

---

## 12. Security and compliance checklist

Before full production release, ensure:
- RLS policies are active on all sensitive tables
- Admin routes validate the current role
- Secret keys are never exposed to the browser
- Stripe webhooks verify signatures
- Media uploads are validated and scanned if required
- Privacy and cookie policies are added to the site
- Terms and consent flows are displayed at sign-up
- Data retention and backups are configured

---

## 13. Production launch checklist

### Before launch
- [ ] Supabase project created and linked
- [ ] Auth enabled and email confirmation configured
- [ ] Profile role records created
- [ ] Super admin account created
- [ ] Database tables and migrations pushed
- [ ] Environment variables added in hosting
- [ ] Stripe products/prices configured
- [ ] Webhook endpoint configured
- [ ] Ad placements and media settings reviewed
- [ ] League rules and registration flows validated
- [ ] Match moderator and viewer pages tested

### After launch
- [ ] Test sign-up and account approval
- [ ] Test league creation and team registration
- [ ] Test live match pages and announcements
- [ ] Test moderator actions and event logging
- [ ] Test payment and subscription flow
- [ ] Monitor error logs and realtime events
- [ ] Review analytics and platform usage

---

## 14. Notes for future expansion

The platform is designed to evolve toward the full sports operating system described in the project brief, including:
- Broadcast graphics engine
- Instant replay engine
- AI-powered match analysis
- Match vault and archive engine
- Moderator announcement system
- League branding customization
- Custom spectator overlays and score graphics
- AI tactical assistant and predictive features

The current codebase includes a strong app foundation and route structure that is ready to extend safely without rebuilding the whole platform from scratch.

---

## 15. Recommended first production actions

1. Create Supabase project and storage bucket
2. Run all migrations
3. Set environment variables
4. Create super admin account
5. Deploy frontend to Netlify
6. Configure Stripe and webhooks
7. Validate admin workflow and league flows
8. Test live match dashboard and viewer route access
9. Add custom domain and SSL
10. Launch with selected leagues and a limited pilot group

---

## 16. Contact and support

For support, production onboarding or adding the later broadcast and replay modules, the project should be extended in phases:
- Phase 1: production-safe auth, role protection and league workflows
- Phase 2: moderation, match controls and viewer experience
- Phase 3: graphics engine, replay engine and AI layers
- Phase 4: monetization, analytics and scale optimization

This document should be used as the deployment and operations baseline for the platform.
