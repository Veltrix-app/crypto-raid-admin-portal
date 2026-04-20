# Full Product Roadmap Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish Veltrix as a product-complete community growth and campaign operations system that projects can run daily, members can feel directly in the webapp, and operators can trust under launch pressure.

**Architecture:** Treat the product as six connected layers instead of one backlog: `Platform Core`, `Project OS`, `Community OS`, `Member Journey`, `Bot Activation`, and `Trust/Rewards/Onchain Excellence`, all wrapped by hard permissions, observability, automation control, QA, and launch hygiene. Build in that order so every later surface rests on stable lifecycle, permission, and operator-control rails.

**Tech Stack:** Next.js App Router, React, TypeScript, Supabase/Postgres, SQL migrations, `veltrix-web`, `admin-portal`, `veltrix-community-bot`, Discord and Telegram provider rails, X verification rails, on-chain jobs and AESP processing, Render, Vercel, and existing docs/specs under `docs/superpowers`.

---

## Scope framing

This is a master roadmap, not a single feature plan. It intentionally spans multiple subsystems because the goal is not to ship one more tranche, but to finish the product to the point where:

- projects can set up, launch, operate, and grow communities without leaving Veltrix
- members experience a coherent journey across webapp, quests, rewards, recognition, and bot nudges
- internal operators always have a safe override path when automation or provider rails fail
- the system is still manageable under real launch pressure

This roadmap should be executed as a sequence of focused implementation plans, one stream at a time. Do not try to implement every phase in one coding session.

## Product posture today

Veltrix is already past MVP in several important ways:

- the portal has a much stronger information architecture and project-first workspace model
- Community OS exists and already spans owner, captain, automation, and member-journey direction
- Discord and Telegram are real operational rails, not just afterthought integrations
- quests, campaigns, rewards, claims, trust, and on-chain systems already exist as working product surfaces

The remaining gap is no longer "missing product concept." It is "finish the system so it feels inevitable, trustworthy, and premium in daily use."

## Guiding principles

- `Project-first always`: projects should feel like they are running their own operating system, not renting isolated forms inside an admin tool.
- `Member-facing on the webapp`: personal journeys, recognition, status, onboarding, comeback flows, and next-best-action belong in `veltrix-web`, not in the portal.
- `Bots activate, they do not replace the product`: Discord and Telegram should nudge, coordinate, and deep-link, not become the only place work happens.
- `Every critical flow gets a manual override`: pushes, claims, verification, automations, payouts, rank sync, and on-chain processing must all have operator fallback rails.
- `One lifecycle per object`: every major object needs explicit states, transitions, ownership, and exit criteria.
- `No raw power without guardrails`: if a flow is powerful, it must also be understandable, recoverable, and observable.

## File structure and workstream anchors

### Core reference docs

- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\docs\superpowers\specs\2026-04-19-community-os-v5-design.md`
  - owner/captain/member split and Community OS vision
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\docs\superpowers\plans\2026-04-19-community-management-v5.md`
  - Community OS execution plan
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\docs\superpowers\specs\2026-04-19-portal-ui-reset-design.md`
  - portal information architecture and UI reset direction
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\docs\superpowers\specs\2026-04-20-campaign-and-quest-studio-v3-design.md`
  - studio direction for Campaign Studio and Quest Studio
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\docs\superpowers\plans\2026-04-20-campaign-and-quest-studio-v3.md`
  - studio rollout structure

### Portal surface anchors

- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects`
  - project workspace, project onboarding, community OS, project settings, project campaign board
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\campaigns`
  - Campaign Studio, campaign details, campaign lifecycle
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\quests`
  - Quest Studio, quest detail, verification posture
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\raids`
  - Raid builder and live raid operations
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\rewards`
  - reward inventory, reward lifecycle, reward safety
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\claims`
  - claim queue, finalization, disputes, payout resolution
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\moderation`
  - trust, pipeline, review, suspicious behavior handling
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\analytics`
  - operator and project-facing insight layer

### Webapp anchors

- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app`
  - home, profile, community, onboarding, comeback, notifications
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\components`
  - member journey surfaces, mission lanes, recognition, reward and claim UX
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\hooks`
  - scoped data hooks, journey hooks, cache integrity

### Runtime and bot anchors

- `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\providers`
  - Discord, Telegram, X, push formatting, commands, role sync, deep links
- `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\jobs`
  - retries, community automations, rank sync, leaderboard posts, on-chain jobs
- `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\core`
  - trust, AESP, captain queue, journeys, outcomes, on-chain processing

### Database and operations anchors

- `C:\Users\jordi\OneDrive\Documenten\New project\database\migrations`
  - lifecycle tables, queue tables, safety tables, audit rails, analytics rollups
- deploy and environment surfaces in Vercel and Render
  - bot secrets, portal secrets, provider URLs, monitoring setup

---

## Phase 1: Platform Core Hardening

**Intent:** Make the system safe, legible, and recoverable before widening the experience layer.

**Why first:** Every later improvement becomes fragile if object lifecycles, permissions, and manual overrides are still soft.

### Deliverables

- [ ] Define explicit lifecycle models for campaigns, quests, raids, rewards, claims, automations, and community runs.
- [ ] Add consistent state transitions for `draft`, `ready`, `live`, `paused`, `completed`, `archived`, and `failed` where relevant.
- [ ] Harden project-private access across all portal APIs and all project-scoped reads and writes.
- [ ] Add audit trails for critical actions such as publish, pause, retry, finalization, role sync, automation run, and manual override.
- [ ] Add manual override rails and kill switches for pushes, automations, claims, rank sync, on-chain jobs, and community playbooks.
- [ ] Add operator-visible incident states instead of silent failures or hidden retries.

### Exit criteria

- [ ] Every major object has a visible lifecycle and an obvious current state.
- [ ] Every critical automation or provider action has a manual retry or manual resolution path.
- [ ] No project-scoped surface leaks cross-project visibility.
- [ ] Operators can answer "what failed, why, and what do I do next?" from inside the product.

## Phase 2: Project OS and Onboarding Excellence

**Intent:** Make project setup and launch orchestration feel like a polished operating system, not a collection of strong but separate pages.

**Why second:** Once the platform is safe, projects need a frictionless way to move from zero setup to first live campaign without confusion.

### Deliverables

- [ ] Build a guided project onboarding flow for integrations, community setup, first campaign, first quest, first raid, first reward, and first push test.
- [ ] Continue pushing Campaign Studio into a premium storyboard-based journey builder.
- [ ] Continue pushing Quest Studio into a premium guided builder with stronger member preview and verification clarity.
- [ ] Design and build `Raid Studio` so raids match the quality level of campaign and quest creation.
- [ ] Add a template library for project playbooks, starter campaign packs, quest kits, and raid kits.
- [ ] Add a project launch checklist surface with readiness scoring and unresolved blockers.
- [ ] Add duplicate, archive, and version-friendly flows for campaigns, quests, raids, and rewards.

### Exit criteria

- [ ] A new project can go from empty state to first live campaign without needing hidden routes or operator handholding.
- [ ] Campaign, quest, and raid creation feel like premium product surfaces rather than admin forms.
- [ ] Project teams can clearly see what is missing before launch and what to do next.

## Phase 3: Community OS Deepening

**Intent:** Turn Community OS into the daily-use operating layer for project owners and captains.

**Why third:** Community OS is already differentiated; now it needs to become indispensable.

### Deliverables

- [ ] Expand owner mode with better automation control, playbook sequencing, funnel health, activation outcomes, and captain coverage.
- [ ] Expand captain mode into a true execution workspace with assigned actions, due state, resolution state, and accountability history.
- [ ] Add project-controlled automations for welcome flows, comeback nudges, leaderboard cadence, mission digest, raid reminders, and activation boards.
- [ ] Add project-level cohort tooling for newcomer, active contributor, reactivation, high-trust, and watchlist segments.
- [ ] Add better community health insights tied to participation, conversion, retention, trust, and reward quality.
- [ ] Add captain-safe permissions and action scopes so captains can do meaningful work without seeing or changing owner-only settings.

### Exit criteria

- [ ] Owners can steer community operations without relying on internal Veltrix operators for normal usage.
- [ ] Captains have a real action queue and know what they are responsible for.
- [ ] Community automations feel deliberate and observable rather than "fire and hope."

## Phase 4: Member Journey Excellence in the Webapp

**Intent:** Make the member experience feel personal, coherent, and motivating instead of just transactional.

**Why fourth:** Once projects and communities are better run, members need to actually feel the value in the webapp.

### Deliverables

- [ ] Finish `Community Home` as the member's hub for status, next-best-action, current lane, and recognition.
- [ ] Finish onboarding journeys that connect linked accounts, wallet verification, first mission, and first reward.
- [ ] Finish comeback journeys for returning members with context-aware nudges and reactivation missions.
- [ ] Add clearer mission lanes with prioritization instead of flat lists.
- [ ] Add recognition systems such as streaks, status levels, journey progress, notable achievements, and "next unlock" framing.
- [ ] Improve reward and claim UX so reward availability, claim readiness, and claim outcomes feel trustworthy.
- [ ] Improve notifications and activity feed deep links so bot nudges and in-product nudges land in the correct experience.

### Exit criteria

- [ ] Members can always tell what matters most right now.
- [ ] The webapp feels like the center of their journey, not just a claim/check surface.
- [ ] Onboarding and comeback journeys are visibly different and intentional.

## Phase 5: Bot Excellence and Community Activation

**Intent:** Make Discord and Telegram feel like elite activation rails instead of just notification endpoints.

**Why fifth:** Once the underlying journeys and community systems are strong, bots can become a true moat.

### Deliverables

- [ ] Deepen Discord command quality for profile, rank, leaderboard, missions, raid, captain, and link flows.
- [ ] Keep Telegram aligned where it makes sense, but respect platform differences instead of forcing parity everywhere.
- [ ] Improve message templates, image handling, fallback safety, and operator visibility for push delivery.
- [ ] Improve rank sync, role mapping, and optional title or nickname logic where safe and platform-appropriate.
- [ ] Add raid operations quality: live alerts, join/check-in flows, reminders, result summaries, top-performer posts.
- [ ] Make all bot outputs deep-link back to the right webapp or portal surface with correct context.
- [ ] Add command-side permission awareness so captains, owners, and members get the right scope of action.

### Exit criteria

- [ ] Discord feels like a real extension of the product, not a side integration.
- [ ] Telegram is reliable, clear, and strong where broadcast and quick interaction matter.
- [ ] Bot interactions create movement back into the webapp and portal instead of trapping users in chat.

## Phase 6: Trust, Rewards, Claims, and On-Chain Excellence

**Intent:** Make the reward and trust machinery robust enough for real volume and real abuse pressure.

**Why sixth:** This is where operational pain tends to hide, and it directly affects project trust.

### Deliverables

- [ ] Deepen contributor quality and suspicious behavior signals.
- [ ] Add clearer review queues and operator playbooks for sybil suspicion, referral abuse, fake engagement, and wallet anomalies.
- [ ] Improve reward inventory safety, stock visibility, claim disputes, and payout retry handling.
- [ ] Add clearer on-chain pipeline observability, ingestion health, and failed-event resolution rails.
- [ ] Add better project-facing visibility into what is blocking reward trust or on-chain trust.
- [ ] Expand fraud and trust models where they improve outcomes, but avoid invisible black-box behavior.

### Exit criteria

- [ ] Operators can resolve claim, payout, and trust issues without guessing.
- [ ] Projects trust that rewards and on-chain signals are not silently drifting.
- [ ] Abuse handling is visible, explainable, and recoverable.

## Phase 7: Analytics, Observability, Runbooks, and Scale Hygiene

**Intent:** Turn the product from "feature complete" into "launch reliable and maintainable."

**Why seventh:** This is the layer that keeps a strong product from collapsing under real usage.

### Deliverables

- [ ] Define the operator metrics that matter: activation rate, completion rate, retention, reward conversion, linked readiness, trust posture, automation health.
- [ ] Build product-visible observability for provider failures, queue backlogs, webhook failures, push failures, and sync failures.
- [ ] Write runbooks for launch day, provider outage, push outage, verification incident, claim incident, and on-chain incident.
- [ ] Build support and escalation surfaces so support actions are consistent and auditable.
- [ ] Add environment and deployment checklists for Vercel, Render, Supabase, provider secrets, and webhook configs.
- [ ] Clean up remaining workspace warnings, deployment footguns, and hidden environment assumptions.

### Exit criteria

- [ ] The team can operate the product calmly during a busy launch.
- [ ] Failures are noticed quickly and have a documented recovery path.
- [ ] "What changed?" and "what broke?" are answerable without tribal knowledge.

## Phase 8: Launch Polish and Brand-Level Product Quality

**Intent:** Finish the experience layer so the product feels premium, inevitable, and ready to be shown proudly.

**Why last:** Brand-level polish matters most once the structural product is already trustworthy.

### Deliverables

- [ ] Final UI consistency pass across portal and webapp spacing, action placement, empty states, helper copy, and responsive behavior.
- [ ] Final copy pass to remove admin-sounding language where it hurts the product experience.
- [ ] Final visual polish on builder surfaces, dashboards, analytics, community flows, and member journeys.
- [ ] Legal and launch hygiene such as privacy policy, terms, reward disclaimers, and support routes.
- [ ] Final cross-surface QA for portal, webapp, bots, claims, rewards, verification, automations, and on-chain flows.

### Exit criteria

- [ ] The product looks and feels intentional at every level.
- [ ] There are no "magic routes," obvious dead ends, or hidden expert-only flows left.
- [ ] The team can ship and demo the product without caveats.

---

## Priority model

### Must build before calling the product complete

- [ ] Phase 1: Platform Core Hardening
- [ ] Phase 2: Project OS and Onboarding Excellence
- [ ] Phase 3: Community OS Deepening
- [ ] Phase 4: Member Journey Excellence
- [ ] Phase 5: Bot Excellence
- [ ] Phase 6: Trust, Rewards, Claims, and On-Chain Excellence
- [ ] Phase 7: Analytics, Observability, Runbooks, and Scale Hygiene
- [ ] Phase 8: Launch Polish and Brand-Level Quality

### Premium moat layers

- [ ] Campaign Studio and Quest Studio becoming visibly stronger than Zealy, TaskOn, Galxe, and Layer3 in project-first flow design
- [ ] Community OS becoming the daily-use operating layer for owners and captains
- [ ] Member journeys making the webapp feel personal rather than transactional
- [ ] Bot activation feeling product-native instead of bolted on

## Recommended execution order

1. `Platform Core Hardening`
2. `Project OS and Onboarding`
3. `Community OS Deepening`
4. `Member Journey Excellence`
5. `Bot Excellence`
6. `Trust/Rewards/On-Chain Excellence`
7. `Observability and Runbooks`
8. `Launch Polish`

This order is the recommendation because it compounds correctly:

- first make the engine safe
- then make project setup excellent
- then make community operations indispensable
- then make the member experience truly felt
- then make bots amplify the system
- then remove risk from trust, claims, and on-chain
- then harden operations and finish the brand layer

## Definition of done for the entire product

Veltrix is "done" at the product level when all of the following are true:

- [ ] a new project can onboard and launch without hidden knowledge
- [ ] a member can understand their path, status, and next action from the webapp alone
- [ ] Discord and Telegram drive meaningful movement, not just message delivery
- [ ] operators have recovery paths for every critical failure mode
- [ ] trust, claims, rewards, and on-chain systems are reliable under pressure
- [ ] the product feels premium, coherent, and daily-usable across portal, webapp, and bots

## Immediate next move

Do not start with another isolated UI flourish. Start by turning this roadmap into the next focused implementation plan:

1. `Platform Core Hardening Plan`
2. then `Project Onboarding and Lifecycle Plan`
3. then the next stream in order

That keeps the build coherent and prevents the product from becoming visually impressive but operationally brittle.
