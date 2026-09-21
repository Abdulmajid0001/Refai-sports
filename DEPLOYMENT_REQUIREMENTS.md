# RefAI deployment requirements

This archive is source code only. Do not commit `.env`, production secrets, service-role keys, payment secrets, or provider credentials to GitHub.

## Required for the corrected pilot workflow

### 1. Node.js and package installation

- Node.js 20.19 or later.
- Run `npm ci` from the repository root.
- Run `npm run build` in a normal local shell or CI environment.
- Deploy the generated `dist` directory to a static host, or deploy through Netlify using its Vite support.

### 2. Supabase

Create one Supabase project and apply every SQL migration in `db/migrations` in filename order. The 20260921 migrations are required for the corrected registration, payment verification, activation, invitation, and match-operation security flows.

Configure these browser variables in the deployment environment:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Configure these server-only variables for Netlify functions:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

In Supabase Auth, set the production site URL and add the production callback URL:

```text
https://your-domain.example/auth/callback
```

Create the initial Super Admin directly in the secured Supabase administration workflow. Do not expose a public Super Admin signup route.

### 3. OpenAI for the two enabled AI assistants

The referee assistant and Help Center assistant use authenticated Netlify functions. Add these server-only values to Netlify or the chosen function host:

```env
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4o-mini
```

The functions are:

- `netlify/functions/ai-referee.ts`
- `netlify/functions/support-ai.ts`

They require a signed-in Supabase user and send the bearer token to Supabase for verification. Never expose `OPENAI_API_KEY` in a `VITE_` variable.

### 4. Netlify functions

For Netlify deployment, deploy the repository rather than only the static `dist` folder so `netlify/functions/*.ts` is deployed alongside the frontend. Set all server-only values in the Netlify environment-variable settings, not in source files.

## Optional integrations already represented in the project

### Stripe billing

The source includes environment placeholders but does not yet include a completed checkout or signed webhook implementation. A full Stripe rollout needs:

```env
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Implement checkout on a server function and verify webhook signatures before calling any payment-verification or entitlement action. Do not mark payments verified from browser-provided values.

### LiveKit or another streaming provider

Camera and broadcast controls intentionally remain disabled until a provider is connected. For LiveKit, configure:

```env
LIVEKIT_URL=wss://your-livekit-host
LIVEKIT_API_KEY=your-livekit-api-key
LIVEKIT_API_SECRET=your-livekit-api-secret
```

Add server endpoints that issue short-lived room tokens only after checking the staff assignment in the database. Do not place `LIVEKIT_API_SECRET` in browser code.

### Email delivery

Supabase Auth handles account-confirmation emails. For operational email such as staff invitations, payment receipts, and notifications, choose and configure a transactional email provider such as Resend, Postmark, SendGrid, or Amazon SES. The current staff invitation flow safely generates and accepts an invitation link, but it does not send the email itself.

## Production configuration checklist

1. Copy `.env.example` values into the host's environment-variable settings, using real values only there.
2. Apply migrations in chronological filename order to a staging Supabase project, test, then apply to production.
3. Set the Supabase Auth site URL and callback redirect URL.
4. Create and verify one Super Admin account.
5. Test the complete pilot sequence: register league, verify payment, approve, activate league, approve/activate teams, create fixture, invite staff, accept invite, run a match operation, and view the public match.
6. Configure OpenAI only after usage limits and cost controls are in place.
7. Configure a payment provider and signed webhook before accepting automated live payments.
8. Configure streaming before enabling camera controls to users.
9. Run `npm ci`, `npm run lint`, `npx tsc --noEmit`, and `npm run build` in local CI before every deployment.

## Still to be added for full production

- A payment-provider checkout, signed webhook, refund handling, and ledger reconciliation.
- A streaming-provider connection, camera assignment, token issuance, health telemetry, and failover path.
- A transactional email delivery function for staff invitation links and operational notifications.
- Dedicated public player profiles, fixture generation, standings/rules engine, and multi-league team membership.
- Match action locks, score-correction confirmation, rollback/audit UX, and conflict/version handling.
- Replay processing, VAR evidence workflow, and secure viewer publication of decisions.
- A full table-by-table RLS audit against the live Supabase schema and role/tenant acceptance testing.
- End-to-end browser tests against a real Supabase project and production build/preview validation.

See `SPEC_AUDIT.md` for the fuller architecture audit and the exact pilot-flow corrections already made.
