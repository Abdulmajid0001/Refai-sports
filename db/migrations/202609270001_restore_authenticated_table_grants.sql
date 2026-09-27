-- Repair missing Supabase API grants after the pilot migrations.
--
-- This restores the PostgreSQL privileges required by the browser's
-- authenticated JWT role. It deliberately does NOT disable Row Level Security:
-- every enabled RLS policy continues to restrict rows and write operations.
--
-- Run this file once on an existing RefAI database where the consolidated
-- pilot-fix migration has already been applied.

grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- Keep subsequently-created application tables and identity sequences usable
-- through the authenticated Supabase client. RLS still applies to each table.
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant usage, select on sequences to authenticated;
