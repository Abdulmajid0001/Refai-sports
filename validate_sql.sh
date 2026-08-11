#!/bin/bash
set -e
psql -U postgres -d postgres -f /workspace/validate_schema.sql
for f in /workspace/db/migrations/*.sql; do
  echo "=== $f ==="
  psql -U postgres -d postgres -v ON_ERROR_STOP=1 -f "$f"
done
for f in /workspace/supabase/migrations/*.sql; do
  echo "=== $f ==="
  psql -U postgres -d postgres -v ON_ERROR_STOP=1 -f "$f"
done
