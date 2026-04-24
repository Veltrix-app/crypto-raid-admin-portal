# Phase UI Wave 1 Rollout Notes

## Scope

This first quiet-system pass only touches the portal pilot surfaces:

- `/overview`
- `/projects`
- `/projects/[id]`

The second wave extends that same quiet-system language into the orientation and workspace-flow surfaces:

- `/getting-started`
- `/account`
- `/projects/[id]/launch`
- `/projects/[id]/settings`

It also softens the shared shell and surface primitives those pages depend on:

- `OpsPrimitives`
- `OpsTable`
- `PortalPageFrame`
- `ProjectWorkspaceFrame`
- `DetailPrimitives`

The third wave extends the same quiet-system language into the builder index and builder detail family:

- `/campaigns`
- `/campaigns/[id]`
- `/quests`
- `/quests/[id]`
- `/raids`
- `/raids/[id]`
- `/rewards`
- `/rewards/[id]`

## What Changed

### 1. Shared surface language is calmer

- Borders are now structural instead of decorative.
- Large hero shells and detail surfaces use lighter chrome and less shadow pressure.
- Tables, filters, pills, cards and snapshot rows now read as one quieter family.
- The portal spacing rhythm is more open so sections read top-to-bottom instead of as a wall of boxes.

### 2. `/overview` is more directional

- The mode switch is now a quieter orientation band instead of another heavy panel.
- The first read on the page now answers:
  - what lane should I run from
  - what needs attention first
  - what workspace is currently active
- Priority actions moved higher so the command-center intent is clearer.

### 3. `/projects` is less redundant

- The portfolio page keeps the roster as the primary object.
- The old extra portfolio summary block is removed so the board feels less card-heavy.
- First-project bootstrap now uses the calmer surface language and more restrained field chrome.
- Intake mode still has its own queue, but the portfolio mode stays focused on search, filters and roster navigation.

### 4. `/projects/[id]` is clearer at the top

- Project summary and growth/workspace pulse now share the top read.
- The page opens with project posture first, then queue pressure, then quick actions.
- Quick actions are grouped into primary studios and quieter supporting routes.
- Queue tiles and summary metrics now read as lighter sections instead of dense dashboard cards.

### 5. Orientation pages now carry the same calm directionality

- `/getting-started` now opens with a clearer “what exists / what is next” read instead of only metric tiles.
- `/account` now uses the account layer as a true handoff surface into projects, team and security, instead of feeling like another data board.
- Account onboarding components keep the next action visible higher and use lighter chrome internally.

### 6. Launch and settings flow are quieter

- `/projects/[id]/launch` no longer stacks a second heavy hero inside the project workspace shell.
- Launch now opens with a lighter orientation band, then the setup rail and launch scorecard.
- Launch rails, action lists and support links use softer surfaces with less visual competition.
- `/projects/[id]/settings` no longer wraps the builder in another heavy panel, so the builder can breathe as the main editing surface.
- Settings now uses a calmer top dossier strip before the builder and keeps the danger zone separate.

### 7. Builder index pages now read as workspaces instead of dashboard walls

- `/campaigns`, `/quests`, `/raids` and `/rewards` now open with one clear lane summary instead of a metric wall plus a second mode card cluster.
- Mode switching is now attached to a single orientation panel, so the page explains what changes between the two views before the list starts.
- Filters stay visible, but the reading path is now:
  - current lane
  - key signals
  - filters
  - roster or pressure board
- Each builder index now uses quieter side context panels and softer roster tables, so the tables carry more of the page weight.

### 8. Builder detail pages now read more like dossiers

- `/campaigns/[id]`, `/quests/[id]`, `/raids/[id]` and `/rewards/[id]` now reduce the small readiness-card wall into calmer status rows.
- The first operating read is now:
  - what this object is trying to do
  - what still needs attention
  - which builder or queue should open next
- Operate/configure switchers still exist where needed, but they use lighter chrome so they support the page instead of fighting the hero.
- Next-action surfaces now sit closer to the primary posture read, which makes the intended move much clearer above the fold.

## Verification

Build verification completed:

```bash
npm run build
```

Executed in:

- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal`

## Smoke Pass

After deploy, check:

1. `/overview`
   - top lane selection is clear
   - priority actions read first
   - launch, health and escalations still render correctly

2. `/projects`
   - board header feels calmer
   - portfolio mode goes straight from orientation to filter + roster
   - onboarding mode still shows the intake queue cleanly
   - first-project bootstrap still works visually and functionally

3. `/projects/[id]`
   - top summary reads clearly
   - analytics or workspace pulse renders beside summary
   - queue rail and quick actions feel lighter
   - launchpad and deeper sections still load normally

4. `/getting-started`
   - the first read explains the next move immediately
   - invites/bootstrap/orientation surfaces feel calmer
   - onboarding checklist still points to the right route

5. `/account`
   - account posture and next route are clear above the fold
   - team, activation, security and growth sections still render correctly

6. `/projects/[id]/launch`
   - no hero-in-hero feeling at the top
   - setup vs launch mode is still obvious
   - launch rail, scorecard and next actions still work normally

7. `/projects/[id]/settings`
   - top dossier strip reads cleanly
   - project builder still works end-to-end
   - danger zone remains visible and separate

8. `/campaigns`
   - the page should read as one campaign workspace, not as stacked mode cards
   - the roster should feel like the main object
   - launch mode should make featured and active campaigns easy to pick out

9. `/campaigns/[id]`
   - the first read should explain the campaign posture quickly
   - readiness should feel lighter and more textual
   - next actions should point clearly into quests, raids and rewards

10. `/quests`
   - board mode should read as a quest inventory surface
   - verification mode should surface proof-flow pressure without feeling like a second dashboard

11. `/quests/[id]`
   - verification route should be obvious near the top
   - readiness should feel like a checklist, not a wall of cards
   - configure mode should still keep the builder easy to scan

12. `/raids`
   - board mode should feel calmer and easier to skim by community and campaign
   - live mode should highlight the raids that matter now without over-decorating them

13. `/raids/[id]`
   - the top read should explain target pressure and timing clearly
   - next actions should make it obvious whether to validate the target, open the campaign, or tune instructions

14. `/rewards`
   - catalog mode should feel like a clean inventory surface
   - claims mode should clearly separate fulfillment-heavy rewards from passive catalog items

15. `/rewards/[id]`
   - reward posture should explain scarcity and claim flow quickly
   - next actions should make claims, quest linkage and stock tuning feel obvious

## Next Wave Recommendation

If the builder wave also feels right live, continue directly with:

- public entry surfaces:
  - `/`
  - `/start`
  - `/pricing`
  - `/trust`
  - `/talk-to-sales`

That keeps the quieter system moving from portal orientation and production builders into the public conversion layer before tackling the denser internal ops pages.
