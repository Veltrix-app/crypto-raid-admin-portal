# 2026-04-24 Flagship Redesign Rollout Notes

## Tranche

Flagship redesign v1 for the new `Galxe-translated` visual family:

- public homepage `/`
- public pricing `/pricing`
- portal overview `/overview`

## Intent

This tranche is the first real premium redesign pass, not a full platform rewrite.

It establishes the new design family for both public and portal:

- dark-first
- premium
- clearer hierarchy
- calmer surfaces
- controlled web3 energy
- public more atmospheric
- portal more operational

## What changed

### Shared visual family

- stronger dark premium surface language
- softer tonal depth instead of boxy border-first composition
- more intentional lime and cyan accent usage
- stronger glow and gradient atmosphere on flagship surfaces
- shared public and portal feel without making portal too showroom-heavy

### Homepage `/`

- rebuilt the page into a premium product-world composition
- replaced the flatter landing-page feel with a larger hero and product preview surface
- shifted the content flow into clearer story sections:
  - product promise
  - workflow story
  - platform map
  - operating model
  - buyer path
- kept CTA hierarchy obvious:
  - `Start now`
  - `Review pricing`
  - `Talk to sales`

### Pricing `/pricing`

- rebuilt pricing into a commercial confidence screen instead of a mostly functional plan list
- made plan hierarchy more deliberate:
  - `Growth` reads as the commercial sweet spot
  - `Enterprise` reads as a real buyer lane, not an afterthought
- upgraded the selected-plan summary into a stronger buyer/checkout guidance surface
- added clearer self-serve vs enterprise framing above the fold
- integrated trust and upgrade posture more naturally into the page

### Portal overview `/overview`

- redesigned the top zone into a real command-center read:
  - `Now`
  - `Next`
  - `Watch`
- reduced the feeling of equal-weight modules
- made the current workspace and next operator move more obvious
- kept deeper launch/health/escalation boards intact, but placed under a stronger overview hierarchy

## Visual rules now established

These rules should carry into the next redesign waves:

- hero/top zones should create page intent immediately
- premium dark surfaces should rely more on tone and depth than on borders alone
- lime and cyan accents should guide focus, not flood the page
- summary blocks should read directionally, not as equal-weight widgets
- public pages can carry more atmosphere than portal pages
- portal pages should still feel like the same family as public pages

## Verification completed

### `veltrix-web`

- `npm run typecheck --workspace veltrix-web`
- `npm run build --workspace veltrix-web -- --webpack`

### `admin-portal`

- `npm run build`

## Smoke checklist

### Homepage `/`

- hero explains Veltrix in the first read
- CTA hierarchy is obvious
- page feels premium, dark and calmer than before
- story sections read clearly from top to bottom

### Pricing `/pricing`

- plans are easy to compare at a glance
- `Growth` reads as the intended sweet spot
- `Enterprise` feels like a deliberate buyer path
- summary card clearly supports checkout or contact

### Portal overview `/overview`

- top zone reads as command center instead of dashboard wall
- `Now`, `Next` and `Watch` are easy to scan
- current workspace state is visible
- the next operator move is clearer than before

## Next redesign recommendation

If this tranche lands well, the next redesign wave should move into:

- `/start`
- `/trust`
- `/talk-to-sales`
- `/projects`
- `/projects/[id]`

That keeps the redesign expanding outward from the three flagship anchors.
