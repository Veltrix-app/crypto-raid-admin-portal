# Deploy Hygiene Checklist

## Portal
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `COMMUNITY_BOT_URL`
- `COMMUNITY_BOT_WEBHOOK_SECRET`
- `NEXT_PUBLIC_APP_URL`

## Runtime
- Render service deployed after runtime code or env changes
- job endpoints reachable
- webhook secret aligned with portal
- bot health endpoint green

## Acceptance
- `/overview` health and deploy checks load
- `/claims`, `/moderation`, and `/onchain` show the correct queue posture
- `/projects/<id>/community` still shows project incidents and override posture
- metric snapshots refresh and support escalations move when pressure clears
