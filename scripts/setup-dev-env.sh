#!/usr/bin/env bash
# Run this ONCE after filling in the two placeholders below.
# Prerequisites: vercel CLI authenticated (`vercel login`)
#
# Get missing values from:
#   Supabase → beam-dev project → Settings → API
#     → service_role key       → paste in SUPABASE_SERVICE_ROLE_KEY
#   Supabase → beam-dev project → Settings → Database
#     → Transaction pooler (IPv4/IPv6) connection string, port 6543
#     → paste in DATABASE_URL (replace [YOUR-PASSWORD] with your DB password)

set -euo pipefail

TEAM="mohak-agrawals-projects-4c591387"
API_PROJECT="beam-api"
ADMIN_PROJECT="beam-admin"

# ── Known values (already set) ───────────────────────────────────────────────
DEV_SUPABASE_URL="https://bbmjnrtlrxlutafvndkm.supabase.co"
DEV_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJibWpucnRscnhsdXRhZnZuZGttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1MzI4NzIsImV4cCI6MjA5NTEwODg3Mn0.hl_DFYjJMpRDPXhBw7hSASUq_2EoZP72gteeDqs6BvA"
JWT_SECRET="beam-dev-secret-minimum-32-characters-long"

# ── Fill these two in ────────────────────────────────────────────────────────
DATABASE_URL="postgresql://postgres.bbmjnrtlrxlutafvndkm:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres"
SUPABASE_SERVICE_ROLE_KEY="PASTE_SERVICE_ROLE_KEY_HERE"
# ─────────────────────────────────────────────────────────────────────────────

if [[ "$DATABASE_URL" == *"[YOUR-PASSWORD]"* ]] || [[ "$SUPABASE_SERVICE_ROLE_KEY" == "PASTE_SERVICE_ROLE_KEY_HERE" ]]; then
  echo "❌ Fill in DATABASE_URL and SUPABASE_SERVICE_ROLE_KEY in this script first."
  exit 1
fi

set_env() {
  local project=$1 key=$2 value=$3
  echo "$value" | vercel env add "$key" preview --scope "$TEAM" --project "$project" --yes 2>/dev/null \
    || echo "  ⚠️  $key may already exist — skipping (remove it first in Vercel dashboard to update)"
}

echo "→ Setting beam-api Preview env vars..."
set_env "$API_PROJECT" DATABASE_URL              "$DATABASE_URL"
set_env "$API_PROJECT" SUPABASE_URL              "$DEV_SUPABASE_URL"
set_env "$API_PROJECT" SUPABASE_ANON_KEY         "$DEV_SUPABASE_ANON_KEY"
set_env "$API_PROJECT" SUPABASE_SERVICE_ROLE_KEY "$SUPABASE_SERVICE_ROLE_KEY"
set_env "$API_PROJECT" JWT_SECRET                "$JWT_SECRET"
set_env "$API_PROJECT" NODE_ENV                  "development"

echo "→ Setting beam-admin Preview env vars..."
set_env "$ADMIN_PROJECT" NEXT_PUBLIC_SUPABASE_URL      "$DEV_SUPABASE_URL"
set_env "$ADMIN_PROJECT" NEXT_PUBLIC_SUPABASE_ANON_KEY "$DEV_SUPABASE_ANON_KEY"
# NEXT_PUBLIC_API_URL for admin will be the beam-api preview URL.
# Vercel generates it as: https://beam-api-git-dev-mohak-agrawals-projects-4c591387.vercel.app
set_env "$ADMIN_PROJECT" NEXT_PUBLIC_API_URL \
  "https://beam-api-git-dev-mohak-agrawals-projects-4c591387.vercel.app"

echo "✅ Done. Trigger a redeploy of the dev branch to pick up the new vars:"
echo "   vercel --project beam-api  --scope $TEAM redeploy --target preview"
echo "   vercel --project beam-admin --scope $TEAM redeploy --target preview"
