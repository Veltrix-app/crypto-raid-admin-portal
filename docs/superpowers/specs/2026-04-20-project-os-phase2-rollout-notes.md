# Project OS Phase 2 Rollout Notes

## Scope shipped in Phase 2

Phase 2 turns the portal project workspace into a cleaner operating system for setup and launch.
The main additions in this tranche are:

- a dedicated project launch workspace at `/projects/[id]/launch`
- shared onboarding and launch-readiness helpers
- a broader starter library for campaign packs, quest kits, raid kits, and playbooks
- lifecycle-safe content actions for `duplicate`, `archive`, `publish`, `pause`, and `resume`
- a true `Raid Studio` that now matches the quality bar of Campaign Studio and Quest Studio
- stronger project-first handoffs from project overview, launch workspace, and campaign board into the studios

## What operators should notice immediately

### Launch workspace

- Projects now have one clear setup and launch rail instead of bouncing between overview, campaigns, and community by guesswork.
- The launch workspace keeps checklist, next actions, starter packs, incidents, and overrides in one project-private surface.
- The flow is now explicit:
  - launch workspace
  - choose starter or blank builder
  - studio
  - detail page
  - launch operation

### Starter library

- Starter packs are no longer only campaign-template flavored.
- The library now groups:
  - campaign starters
  - quest starters
  - raid starters
  - launch/community playbook links
- Starter links preserve project context and, where possible, campaign context.

### Lifecycle actions

- Campaigns, quests, raids, and rewards now share the same lifecycle language:
  - duplicate
  - publish
  - pause
  - resume
  - archive
- Those actions go through the audited project-private route instead of ad-hoc page-local behavior.

### Raid Studio

- The raid builder is no longer a long form with a side checklist.
- Raids now use a guided studio with:
  - action
  - placement
  - verification
  - launch
- The right rail stays tight:
  - member preview
  - verification posture when relevant
  - warnings/watchlist

## Manual rollout checklist

Before Phase 2 goes live:

1. Run the migration:
   - `database/migrations/veltrix_project_os_phase2.sql`
2. Deploy the updated `admin-portal`
3. Verify these routes behind login:
   - `/projects/[id]/launch`
   - `/campaigns/new?projectId=<id>&source=launch`
   - `/quests/new?projectId=<id>&source=launch`
   - `/raids/new?projectId=<id>&source=launch`
   - `/projects/[id]/campaigns`
   - campaign, quest, raid, reward detail pages

## Acceptance checklist

Phase 2 should only be marked done once these are true in production:

- the launch workspace loads project-private readiness data
- starter-library links open the right builders with project context already filled
- quest and raid creation no longer feel like hidden routes
- campaign, quest, raid, and reward detail pages expose the new lifecycle actions clearly
- Raid Studio feels like the same design family as Campaign Studio and Quest Studio
- project teams can understand the creation sequence without knowing raw URLs

## Notes for next phase

Phase 3 should build on this by deepening:

- Community OS execution quality
- member-facing launch and mission journeys in the webapp
- richer bot handoffs and launch-time activation

The main rule going forward is to keep the project flow explicit and calm, not to reintroduce hidden routes or mixed admin dumps.
