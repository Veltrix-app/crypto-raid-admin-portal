# 2026-04-24 Flagship Redesign Wave 5 Rollout Notes

## Scope
- dossier-style redesign pass for:
  - `/claims`
  - `/claims/[id]`
  - `/submissions`
  - `/submissions/[id]`
  - `/users`
  - `/users/[id]`
- calmer community subpanel pass for:
  - `CommunityOverviewPanel`
  - `CommunityOutcomesPanel`
  - `CommunityCaptainWorkspacePanel`

## What changed
- `Claims` now reads more like a payout command surface:
  - stronger top `Payout command read`
  - metrics and mode switch pulled into one calmer intro zone
  - explicit `Now / Next / Watch` operator guidance
- `Claim detail` now behaves more like a fulfillment dossier:
  - back-to-queue action in the hero
  - dedicated `Claim pressure` read before the heavier metadata
  - less reliance on raw metadata blocks as the first thing an operator sees
- `Submissions` moved away from the queue table wall:
  - queue view now uses dossier cards instead of a dense row grid
  - proof, risk, decision route and review action sit together
  - right rail now answers what is actually slowing moderation
- `Submission detail` now adds a cleaner verification read:
  - back-to-queue action in the hero
  - dedicated `Verification pressure` summary above raw proof
- `Users` now feel more like a premium community roster:
  - roster and risk lanes use openable contributor cards
  - contributor profile action is explicit inside both lanes
- `User detail` now carries a clearer operator read:
  - back-to-roster action in the hero
  - stronger trust posture signal inside the action section
- community overview/outcomes/captain panels now reduce the sense of metric sprawl:
  - grouped decision blocks instead of one endless metric wall
  - clearer command-read intros before the data density begins

## Design direction reinforced
- dark-first premium surface language
- calmer operator density
- less table-wall feeling
- more `dossier + action` structure on review/detail screens
- more grouped decision blocks on community surfaces

## Verification
- `npm run build` in `C:\Users\jordi\OneDrive\Bureaublad\admin-portal`

## Notes
- this wave intentionally favored readability and directional clarity over raw information density
- the next visual tuning pass should happen in a browser preview so spacing, glow intensity and card rhythm can be judged on-screen rather than only from code
