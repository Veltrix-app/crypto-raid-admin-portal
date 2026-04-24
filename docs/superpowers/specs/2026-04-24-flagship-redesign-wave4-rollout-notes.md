# Flagship Redesign Wave 4 Rollout Notes

## Scope
- `/raids`
- `/raids/[id]`
- `/rewards`
- `/rewards/[id]`

## What Changed
- Reworked the raid index into the calmer flagship lane pattern:
  - stronger board vs live framing
  - richer top signal band
  - card-led raid rails instead of the denser roster-table feel
- Strengthened raid detail into a clearer operator workspace:
  - retained the `Operate / Configure` split
  - added a dedicated `Live pressure` section so timing, target and visible load are readable before editing
- Reworked the reward index into the same flagship family:
  - clearer catalog vs claims framing
  - stronger top signal band around visibility, claimability and scarcity
  - card-led reward rails in place of the old catalog-table feel
- Strengthened reward detail into a clearer claim workspace:
  - retained the `Operate / Configure` split
  - added a dedicated `Claim pressure` section so demand, stock and delivery method read as one operator story

## Design Direction Reinforced
- dark-first premium surfaces
- controlled lime/cyan energy
- less spreadsheet-reading
- more curated cards and grouped sections
- stronger `operate vs configure` split on details
- more obvious operator read before builder or metadata depth

## Verification
- `npm run build` in `admin-portal`

## Next Recommended Wave
- deeper community subpanel pass
- `/claims`
- `/claims/[id]`
- `/submissions`
- `/submissions/[id]`
- `/users`
- `/users/[id]`
