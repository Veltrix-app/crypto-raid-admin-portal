# Portal Hierarchy Command Center Design

## Why This Exists

The portal is already functionally strong, but too many pages still feel like a wall of useful modules instead of a guided workspace. Project teams should never ask: "Where do I look first?" Every core page must have one clear job, one primary next move, and at most one secondary rail.

This phase turns the portal into a command-center system: compact, calm, operational, and predictable.

## Primary Goal

Make the portal easier for projects to operate by enforcing one information contract across the most important pages:

1. Page context: small title and intent, never a second large dashboard hero.
2. Command read: one compact Now / Next / Watch block.
3. Primary workspace: the main thing the page exists to do.
4. Secondary rail: optional status, shortcuts, or safety context only.
5. Deep modules: everything else moves behind tabs, subroutes, or collapsed surfaces.

## Non-Goals

- Do not redesign the public webapp in this phase.
- Do not change database schema unless a page truly needs a missing read model.
- Do not remove existing capabilities.
- Do not hide important project actions; relocate them into clearer surfaces.
- Do not turn every route into a new visual style. This is hierarchy first, polish second.

## Page Priority

### 1. Project Workspace Home

Route: `/projects/[id]`

Current issue: this page still mixes project overview, quick actions, queues, edit/config context, public preview, readiness and deeper setup concerns.

New job: "Tell the project what is true right now and where to go next."

Keep on page:

- Compact project identity.
- Command read: Launch state, next move, watch item.
- Primary action lanes: Launch, Community, Campaign Studio, Rewards/Claims, Trust/Safety.
- Snapshot cards: members, campaigns, quests, rewards, open incidents.
- One secondary rail for health/watchpoints.

Move away:

- Full project editing into `/projects/[id]/settings`.
- Deep on-chain configuration into `/projects/[id]/onchain`.
- Payout operations into `/projects/[id]/payouts`.
- Trust operations into `/projects/[id]/trust`.
- Long public preview fields into settings or a compact preview card.

Success state: a project owner can open the page and understand the next best route in under five seconds.

### 2. Community Command Center

Route: `/projects/[id]/community`

Current issue: the page is over 3000 lines and contains overview, commands, automations, tweet-to-raid, captains, members, cohorts, analytics, incidents and playbooks in one surface.

New job: "Operate community growth and delivery from one calm command center."

Top-level surfaces:

- Overview: health, next move, key gaps, recent output.
- Raid Ops: tweet-to-raid, manual raid commands, raid delivery state.
- Automations: active automations, failed jobs, next scheduled runs, owner actions.
- Commands: Telegram/Discord command surfaces, permissions, enabled commands.
- Captains: owner/captain delegation and queue.
- Analytics: cohorts, funnels, outcomes, leaderboards.

Default view: Overview.

Rule: only the active surface should render its deep modules. Other surfaces should be summarized as compact route cards or tabs, not stacked underneath.

Success state: a project can answer: "Are community systems running, what needs attention, and where do I configure it?"

### 3. Automation Center

Primary location: inside Community as a surface first, later promotable to a project-level route if needed.

Current issue: automation is powerful but hidden inside a wide community page. Owners need a reliability command read, not a list of scattered settings.

New job: "Show what runs automatically, what failed, and what the owner must fix."

Core layout:

- Command read: running now, next scheduled, watch/failure.
- Primary workspace: automation table grouped by sequence: launch, raid, comeback, campaign push, always-on.
- Secondary rail: reliability posture, last failure, required setup.
- Deep detail: individual automation config opens inline only after selection.

Success state: owners can see whether automation is safe to trust without reading every configuration card.

### 4. Billing Upgrade Flow

Route: `/settings/billing`

Current issue: billing is important commercially but still reads partly like an ops dashboard.

New job: "Convert a growing workspace into the right plan with confidence."

New hierarchy:

- Commercial command read: current plan, limit pressure, recommended upgrade.
- Upgrade hero: strongest CTA, value proposition, next plan.
- Usage pressure: only the limits that matter now.
- Plan comparison: compact, recommendation-first.
- Billing operations: invoices/payment status below the sale path, not above it.
- Support/enterprise rail: visible but secondary.

Success state: the user understands why to upgrade before seeing operational billing noise.

### 5. Analytics

Route: `/analytics`

Current issue: analytics mixes growth, outcomes, campaign intelligence, verification, execution links and live operational direction.

New job: "Read performance and decide where to investigate next."

Keep:

- One command read.
- One active analytics lens at a time: Growth, Outcomes, Campaigns, Verification.
- Two to three high-signal charts or tables per lens.
- Links to operational pages only as small route recommendations.

Remove from top-level:

- Live triage language that belongs in Overview, Trust, Payouts or On-chain.
- Dense metric walls that compete with the chosen lens.

Success state: analytics feels like reading a business dashboard, not operating a queue.

## Navigation Contract

Main portal nav should remain broad, but project workspace tabs should be calmer:

- Overview
- Launch
- Campaigns
- Community
- Rewards
- Safety
- Settings

Safety groups Trust, Payouts and On-chain conceptually. Existing routes can remain, but the visual tabbar should stop feeling like a cockpit of equal-weight modules.

Internal/super-admin pages can remain available, but should be grouped as Ops/Admin rather than competing with project-owned workflows.

## Shared Component Contract

Use or extend existing primitives before creating new UI:

- `PortalPageFrame` for compact page context.
- `ProjectWorkspaceFrame` for project routes.
- `OpsCommandRead` for Now / Next / Watch.
- `OpsPanel` for one purposeful section.
- `OpsMetricCard` and `OpsSnapshotRow` for compact reads.
- `SegmentToggle` for primary surfaces, not minor filters.

Add a small `PortalSurfaceSwitcher` only if `SegmentToggle` cannot express page-level surfaces clearly enough.

## Implementation Sequence

### Wave 1: Project Workspace Home

Refactor `/projects/[id]` into a true home surface. Remove deep setup/edit blocks from the main canvas and make route cards clearer.

### Wave 2: Community Surface Split

Split `/projects/[id]/community` into active surfaces. Keep data loading intact, but render deep panels only for the selected surface.

### Wave 3: Automation Reliability View

Promote automation inside Community into a clear command surface with grouped automation rows, failures and next run posture.

### Wave 4: Billing Conversion Flow

Reorder `/settings/billing` around upgrade intent, not operations.

### Wave 5: Analytics Readability

Reduce analytics to lens-first reading and route recommendations.

## Risks

- The Community page is large, so the first refactor must avoid changing behavior while changing render hierarchy.
- Some users may rely on old scroll positions. Surface tabs need stable URL hash or query state.
- Portal and webapp are separate repos; changes must be committed and pushed from the portal repo, not the services repo.

## Testing

Run after each implementation wave:

- `npm run typecheck`
- `npm run build`
- `npm run lint`

Manual QA:

- Open `/projects/[id]` and confirm the next action is immediately visible.
- Open `/projects/[id]/community` and switch every surface.
- Confirm existing commands, tweet-to-raid settings, automation settings and captain settings still save.
- Open `/settings/billing` and confirm upgrade CTA is visually primary.
- Open `/analytics` and confirm only one active lens dominates.

## Acceptance Criteria

- Every target page has exactly one primary job.
- Every target page has one command read near the top.
- Deep modules are not stacked by default when they belong to separate mental tasks.
- Existing actions remain reachable.
- Project owners can describe the next action without scanning the whole page.
- Portal production deploys from `crypto-raid-admin-portal` on `main`, not from the services repo.
