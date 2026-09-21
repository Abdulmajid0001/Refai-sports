# RefAI specification audit

Audited against both supplied architecture guides on 2026-09-21. A feature is marked **implemented** only where a route/component and a persisted data path were found. A screen with static controls or an unverified table write is not counted as implemented.

## Working foundation

| Area | Status | Evidence / notes |
| --- | --- | --- |
| Public homepage, match list, live list, league directory | Partial | Routes exist and query matches, leagues, and teams. |
| Public match detail and live viewer | Partial | Routes exist with live event subscriptions. Public queries now exclude internal and unpublished events. |
| League registration | Partial | Registration, Super Admin review, manual provider-reference verification, and operational activation are now connected. A provider checkout/webhook is still not installed. |
| Team and player registration | Partial | Forms persist to registration tables, but are not connected to the public teams and matches model. |
| League owner dashboard | Partial | Routes for teams, matches, wallet, rules, broadcast, and settings exist. |
| Registration-to-live activation | Implemented for the pilot flow | A verified payment is required before Super Admin approval; Super Admin activates an approved league, approved teams enter the operational model, and fixtures write to the canonical matches table. |
| Match moderation | Partial | Event, score, VAR, broadcast, and commentary controls exist. Moderator/referee/commentary routes now have role guards. |
| Match operator authorization | Implemented for the pilot flow | Moderator, referee, and commentator routes require both the correct role and an active match or league-wide staff assignment. |
| Staff invitations | Implemented for the pilot flow | Server-side token creation, email binding, expiry, acceptance, match-staff assignment, audit storage, and a secure prefilled invitation link are present. Invitations are constrained to the league and, when selected, that league's match. |
| Role security | Partial | Client role selection is no longer authoritative for staff roles. Existing tables and legacy role hooks still need consolidation. |
| Event publication routing | Partial | Events now record live, timeline, or internal; public viewer/detail queries filter out internal/unpublished events. Dedicated viewer surfaces for separate live-field and timeline feeds still need completion. |

## Required pages or workflows still missing

These were explicitly described but no dedicated, working route and backend workflow was found:

- Upcoming matches reminders with a delivery channel and broadcast status.
- A payment-provider checkout, signed webhook handler, refunds, and ledger reconciliation. The current verified-reference step is intentionally manual.
- An invitation details page that can disclose league, role, permissions, and expiry without exposing a bearer token.
- Role-token management page, token revocation, activation window administration, and match-level invitation centre.
- Public team directory/profile and public player profile pages.
- Multi-league team selector and per-league team data workflow.
- Fixture generator, standings/table-rule management, and competition scheduling workflow.
- Match-lineup, official assignment, formation approval, and match-level staff assignment UI.
- Camera connection/preview/go-live workflow backed by a streaming provider.
- Commentator microphone permission, audio health, and moderator authorization workflow.
- Replay creation, multi-angle selection, annotation, queue, transition, and viewer playback workflow.
- VAR decision workflow with evidence, decision audit, and controlled viewer publication.
- Broadcast health/failover dashboard backed by actual stream telemetry.
- Payment-provider adapter, checkout, verified webhook handler, refunds, and ledger reconciliation.
- Superadmin pages for approvals, permissions, tokens, feature flags, audit history, CMS, system health, and tenant administration.
- Secure API/integration configuration screens.
- Notification delivery pipeline beyond basic database rows.
- Match archive and legacy vault search workflow.
- A provider-backed AI adapter for detection, commentary, reports, and recommendations.
- Smart-ball, sensor, 3D/digital-stadium, and streaming integration adapters.

## Existing screens that are not production-complete

| Surface | Why it is incomplete |
| --- | --- |
| League match creation | Corrected for the pilot workflow: fixtures are created in the canonical matches table through a guarded RPC. Fixture generation and standings rules still need implementation. |
| League/team ownership | Corrected for the pilot workflow: approved registrations are promoted with traceable operational links. Multi-league team membership still needs a dedicated data model. |
| Moderator console | Correct role and assignment checks now exist in the route and database triggers. It still lacks action locks, score-correction confirmation, rollback, and conflict/version handling. |
| Camera and commentator dashboards | Camera controls now remain disabled until a real streaming provider and assignment are connected. Neither dashboard establishes a media connection yet. |
| Payments | A Super Admin can record a provider reference and the database prevents approval until it is verified. There is no provider checkout/webhook path yet. |
| AI controls | Referee and Help Center assistants call authenticated Netlify functions when the OpenAI and Supabase server environment variables are configured. Other AI controls still need provider adapters. |
| Security | Legacy migrations include permissive authenticated-user policies. These must be replaced table by table with tenant- and assignment-aware policies before launch. |
| Admin functions | Unsafe legacy client-side admin stubs were removed; the remaining Super Admin dashboard uses guarded database operations. |

## Corrections made in this pass

- Public match viewer and match detail queries now omit internal and unpublished events.
- Live notifications ignore non-public events.
- Direct moderator, referee, and commentator match routes now require their appropriate roles and active match assignment.
- Added a Super Admin activation centre and the activation/fixture database bridge. League fixtures are no longer written to the disconnected league_matches table.
- Added protected registration review functions and a payment-verification gate before league approval.
- Added a staff invitation link flow for both new and existing accounts, with email binding, expiry, and match/league assignment validation.
- Added database triggers that reject direct match-event or match-state writes by users who are not assigned to the match.
- Added public teams directory, team profile, and upcoming fixtures routes; regenerated the runtime route manifest.
- Removed legacy client-side administrative stubs that reported unperformed actions; their routes now return to the real Super Admin control center.
- Rewired the referee assistant and Help Center assistant to authenticated Netlify AI functions. They now require `OPENAI_API_KEY`, `SUPABASE_URL`, and `SUPABASE_ANON_KEY` in the server environment.
- Removed false camera-health telemetry and disabled camera operations until a real streaming provider and assignment are connected.
- Added this audit so UI coverage is not confused with working product coverage.

## Release gate

Do not launch this archive as-is. Before a pilot, the following must be completed and verified against a real Supabase project:

1. Unify the registration and operational league/team/match data model.
2. Connect a real payment provider through a signed webhook (the manual verification gate is ready for controlled pilot use, but is not automated billing).
3. Replace permissive RLS policies with server-side tenant, ownership, and match-assignment authorization.
4. Finish the staff invitation/access/assignment flow at match level.
5. Repair all compile failures, missing imports, and stale duplicate source files.
6. Connect streaming, payment, and AI adapters only through server-side secrets and verified webhooks.
7. Run acceptance tests for viewer, league owner, team owner, general moderator, moderator, commentator, camera operator, and superadmin flows.

## Latest verification

- The TanStack route manifest was regenerated after adding the public team and upcoming-fixture routes.
- Route generation, full TypeScript checking, and ESLint all pass.
- A full TypeScript check now passes after repairing the legacy AI, graphics, highlights, camera, viewer, and admin type failures.
- `vite build` cannot run inside this sandbox because esbuild is denied access while resolving the workspace config path, even after read-only access was granted to the drive root. Run the build in a normal local shell or CI after applying migrations and environment variables.
