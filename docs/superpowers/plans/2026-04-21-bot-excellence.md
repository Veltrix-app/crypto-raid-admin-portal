# Bot Excellence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn Discord and Telegram into premium activation rails that feel like a real extension of Veltrix: sharper commands, better raid and leaderboard delivery, safer captain/member scope handling, stronger deep links back into the webapp and portal, and better operator control when a bot flow fails.

**Architecture:** Keep this phase runtime-first with narrow portal support. Most work lands in `veltrix-community-bot` under the Discord and Telegram providers, shared community command helpers, captain permission resolution, deep-link helpers, and push delivery jobs. The portal only grows where projects need explicit control over bot posture, command scopes, previews, or test actions. Do not widen this phase into member journey redesign or new owner/captain operating-system concepts; consume the already-built Phase 3 and Phase 4 rails instead.

**Tech Stack:** TypeScript, Node.js, `discord.js`, Telegraf, Express routes/jobs in `veltrix-community-bot`, Next.js App Router in `admin-portal`, Supabase/Postgres-backed community settings, existing captain permission models, existing journey deep links, Render, and Vercel.

---

## Scope Guardrails

This plan covers only `Phase 5: Bot Excellence`.

In scope:
- Discord command quality for `link`, `profile`, `rank`, `leaderboard`, `missions`, `raid`, and `captain`
- Telegram command quality and parity where it actually fits the platform
- command-side captain/member permission handling and safe action scope checks
- richer bot delivery templates for leaderboards, raid alerts, mission prompts, and profile/status outputs
- deeper deep-link follow-through into `veltrix-web` and project-private portal surfaces
- project-side bot settings, preview, and test rails needed to control the above
- bot-focused incident visibility and safer fallback behavior

Out of scope for this phase:
- new member journey logic or webapp surface redesign
- Community OS owner/captain scope expansion beyond bot-facing controls
- wider trust, reward, claim, or on-chain hardening
- X verification work or non-community provider expansion

## File Structure

### Runtime Discord rails

- `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\providers\discord\commands.ts`
  - slash command registration and interaction handling
- `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\providers\discord\community.ts`
  - Discord integration loading, identity snapshots, leaderboard rails, raid rails
- `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\providers\discord\ranks.ts`
  - rank rule formatting, next-unlock helpers, role-sync display logic
- `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\providers\discord\push.ts`
  - Discord delivery formatting and push behavior

### Runtime Telegram rails

- `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\providers\telegram\bot.ts`
  - Telegram command registration and message replies
- `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\providers\telegram\community.ts`
  - Telegram integration loading, identity snapshots, mission board and raid board rails
- `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\providers\telegram\push.ts`
  - Telegram delivery formatting and push behavior

### Shared community command and deep-link rails

- `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\core\community\automation-links.ts`
  - shared deep-link builder into webapp and portal
- `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\core\community\journeys.ts`
  - lane-aware prompt shaping and link context
- `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\core\community\captains.ts`
  - captain seat lookup, permission resolution, scope enforcement
- `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\core\community\captain-queue.ts`
  - captain-facing action semantics and labels
- `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\core\community\automations.ts`
  - automation outputs that should stay consistent with stronger bot rails

### Jobs and bot-facing ops routes

- `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\jobs\post-community-leaderboards.ts`
  - scheduled leaderboard delivery quality
- `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\jobs\refresh-community-status-snapshots.ts`
  - community state freshness for command quality
- `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\http\jobs.ts`
  - manual command sync, leaderboard post, raid post, and job entry points
- `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\http\community-ops.ts`
  - community execution hooks used by portal-triggered flows

### Portal controls and settings

- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\[id]\community\page.tsx`
  - project-private control room where bot settings, previews, and test rails should surface
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\community-bot-settings\route.ts`
  - bot settings load/save route
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\discord-command-sync\route.ts`
  - manual Discord sync trigger
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\discord-leaderboard-post\route.ts`
  - manual leaderboard test/post trigger
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community`
  - existing Community OS panels that should gain tighter bot-excellence controls

### Tests and rollout anchors

- `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\core\community\captains.test.ts`
- `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\core\community\model.test.ts`
- `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\providers\discord`
  - add targeted tests for command formatting and permission-aware flows
- `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\providers\telegram`
  - add targeted tests for Telegram parity and safe fallbacks

## Task 1: Extend bot settings and contracts for Phase 5 controls

**Files:**
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\community-bot-settings\route.ts`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\[id]\community\page.tsx`
- Modify: `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\providers\discord\community.ts`
- Modify: `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\providers\telegram\community.ts`
- Optional migrate: `C:\Users\jordi\OneDrive\Documenten\New project\database\migrations\veltrix_bot_excellence_phase5.sql`
- Test:
  - `npm run build` in `admin-portal`
  - `npm run typecheck --workspace veltrix-community-bot`

- [ ] Extend project bot settings so owners can control command posture, captain command scope, richer raid and leaderboard behavior, and platform-specific toggles without bloating the Community OS page.
- [ ] Keep defaults safe so existing projects do not lose working commands after rollout.
- [ ] Only add a SQL migration if current metadata fields cannot safely carry the new settings surface.
- [ ] Run `npm run build` in `admin-portal`.
- [ ] Run `npm run typecheck --workspace veltrix-community-bot`.

## Task 2: Refactor shared bot rendering and deep-link helpers before widening command UX

**Files:**
- Modify: `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\core\community\automation-links.ts`
- Modify: `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\core\community\journeys.ts`
- Modify: `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\core\community\captains.ts`
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\core\community\command-links.ts`
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\core\community\command-scopes.ts`
- Test:
  - `node --import tsx --test "src/core/community/captains.test.ts" "src/core/community/model.test.ts"`

- [ ] Pull common deep-link, lane-label, scope-check, and action-availability logic out of the Discord and Telegram provider files before adding more command behavior.
- [ ] Make command outputs consistently resolve to the correct `Community Home`, `Onboarding`, `Comeback`, `Captain workspace`, or project-private portal action.
- [ ] Centralize captain/member scope checks so Discord and Telegram do not drift in permission behavior.
- [ ] Run the targeted community-core tests.

## Task 3: Deepen Discord into the premium command rail

**Files:**
- Modify: `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\providers\discord\commands.ts`
- Modify: `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\providers\discord\community.ts`
- Modify: `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\providers\discord\ranks.ts`
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\providers\discord\command-renderers.ts`
- Test:
  - `npm run typecheck --workspace veltrix-community-bot`
  - `npm run build --workspace veltrix-community-bot`

- [ ] Add a real Discord `/missions` flow so the command surface matches the stronger member-journey and community-operating system rails.
- [ ] Upgrade `/profile`, `/rank`, `/leaderboard`, `/raid`, and `/captain` so they feel more like high-signal operator/member surfaces and less like raw data dumps.
- [ ] Keep Discord as the richest command rail where embeds, action buttons, and scoped captain affordances are strongest.
- [ ] Make sure command sync continues to behave safely for enabled and disabled guilds.
- [ ] Run `npm run typecheck --workspace veltrix-community-bot`.
- [ ] Run `npm run build --workspace veltrix-community-bot`.

## Task 4: Bring Telegram to strong, platform-correct parity

**Files:**
- Modify: `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\providers\telegram\bot.ts`
- Modify: `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\providers\telegram\community.ts`
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\providers\telegram\message-renderers.ts`
- Test:
  - `npm run typecheck --workspace veltrix-community-bot`

- [ ] Keep Telegram aligned on the commands that matter most for activation: `link`, `profile`, `missions`, `leaderboard`, `raid`, and `captain`.
- [ ] Improve the Telegram message copy, structure, and button follow-through without forcing Discord-style UI patterns onto Telegram.
- [ ] Only add Telegram command parity where it improves clarity or conversion; do not copy every Discord affordance blindly.
- [ ] Run `npm run typecheck --workspace veltrix-community-bot`.

## Task 5: Add permission-aware captain actions and safer member scope handling

**Files:**
- Modify: `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\core\community\captains.ts`
- Modify: `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\core\community\captain-queue.ts`
- Modify: `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\providers\discord\commands.ts`
- Modify: `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\providers\telegram\bot.ts`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\community-captain-permissions\route.ts`
- Test:
  - `node --import tsx --test "src/core/community/captains.test.ts"`

- [ ] Make captain-only bot actions explicit and safe, with command-side gating that respects seat scopes and allowed permissions.
- [ ] Keep member-facing commands helpful even when the user is not a captain, instead of failing with vague authorization messages.
- [ ] Ensure captain actions always prefer deep-linking into the workspace unless an in-chat action is explicitly safe and permitted.
- [ ] Run the captain permission tests.

## Task 6: Upgrade raid ops, leaderboard delivery, and push formatting quality

**Files:**
- Modify: `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\jobs\post-community-leaderboards.ts`
- Modify: `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\core\community\automations.ts`
- Modify: `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\providers\discord\push.ts`
- Modify: `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\providers\telegram\push.ts`
- Modify: `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\http\jobs.ts`
- Test:
  - `npm run build --workspace veltrix-community-bot`

- [ ] Improve scheduled and manual leaderboard posts so they feel more premium, more contextual, and more clearly tied back to the webapp and project community.
- [ ] Tighten raid alert, reminder, and result-summary formatting so raid ops feel like a real activation system instead of generic announcements.
- [ ] Keep fallback behavior safe: if rich delivery fails, the bot should still surface a clean degraded message and log a usable incident.
- [ ] Run `npm run build --workspace veltrix-community-bot`.

## Task 7: Add tighter project-side bot controls, preview, and manual test rails

**Files:**
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\[id]\community\page.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\community-config.ts`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\community-bot-settings\route.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\community-bot-preview\route.ts`
- Test:
  - `npm run build` in `admin-portal`

- [ ] Give project owners clearer control over how Discord and Telegram behave without burying them in raw metadata.
- [ ] Add preview and test rails for key bot outputs such as profile, leaderboard, mission prompt, and raid alert so projects can understand what they are about to ship.
- [ ] Keep these controls inside the project-private Community OS surface so nothing leaks into global ops.
- [ ] Run `npm run build` in `admin-portal`.

## Task 8: Final verification, sync, and rollout acceptance for Phase 5

**Files:**
- Review all changed Discord, Telegram, portal settings, and shared bot helper files
- Test:
  - `npm run build` in `admin-portal`
  - `npm run typecheck --workspace veltrix-community-bot`
  - `npm run build --workspace veltrix-community-bot`

- [ ] Run the final portal and runtime verification commands.
- [ ] Redeploy `veltrix-community-bot` on Render after the runtime changes are live.
- [ ] Run `Sync Discord commands now` from the portal after deployment if command surfaces changed.
- [ ] Live-check Discord:
  - `/link`
  - `/profile`
  - `/rank`
  - `/missions`
  - `/leaderboard`
  - `/raid`
  - `/captain`
- [ ] Live-check Telegram:
  - `/link`
  - `/profile`
  - `/missions`
  - `/leaderboard`
  - `/raid`
  - `/captain`
- [ ] Verify that deep links land on the correct `veltrix-web` or project-private portal surface.
- [ ] Verify that captain/member scope handling is clear and safe in both platforms.

---

## Self-Review

### Spec coverage

This plan covers the roadmap Phase 5 deliverables:
- richer Discord command quality
- Telegram parity where it makes sense
- command-side captain/member scope handling
- stronger raid ops and leaderboard delivery
- better deep links and follow-through
- safer project-side bot control and preview rails

Intentionally left for later phases:
- trust and on-chain hardening
- wider analytics/observability work beyond bot-specific visibility
- new member journey features in the webapp
- broader Community OS feature expansion beyond bot controls

### Placeholder scan

No `TODO`, `TBD`, or unresolved placeholders remain in the task list.

### Boundary consistency

The plan keeps Phase 5 clean:
- `veltrix-community-bot` owns command UX, delivery, deep links, and safe fallback behavior
- `admin-portal` owns project-private bot settings, preview, and test controls
- `veltrix-web` remains a destination surface, not the implementation target of this phase
- `Phase 6` remains the trust/rewards/on-chain excellence phase
