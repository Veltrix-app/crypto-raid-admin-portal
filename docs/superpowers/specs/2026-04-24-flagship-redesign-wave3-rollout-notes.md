# Flagship Redesign Wave 3 Rollout Notes

## Scope
- `/projects/[id]/community`
- `/campaigns`
- `/campaigns/[id]`
- `/quests`
- `/quests/[id]`

## What Changed
- Pushed the community workspace header toward a clearer command-deck read:
  - stronger `Community OS` framing
  - clearer owner vs captain stance copy
  - clearer operate/grow/configure mode copy
  - metric-led signal stack for automation, captain pressure, coverage and command posture
  - explicit `Current read` and `Next move` summary rows
- Reworked `/campaigns` away from a dense roster wall into curated launch lanes:
  - stronger portfolio vs launch framing
  - richer top signal band
  - card-led campaign rails instead of the old table-heavy read
- Split `/campaigns/[id]` into a cleaner `Operate / Configure` workspace pattern:
  - operate mode now focuses on readiness, analytics and platform pressure
  - configure mode contains the editor and supporting side surfaces
- Reworked `/quests` into the same calmer flagship family:
  - board vs verification framing is clearer
  - lead quest cards replace the denser roster read
  - verification lane now reads more like an operator surface
- Added a dedicated `Verification pressure` section on `/quests/[id]` so quest detail feels like a mission workspace rather than only a builder shell.

## Design Direction Reinforced
- dark-first premium surfaces
- controlled lime/cyan energy
- less table-wall reading
- more curated cards and grouped sections
- stronger `operate vs configure` split on detail workspaces
- clearer top-of-page direction before deep content

## Verification
- `npm run build` in `admin-portal`

## Next Recommended Wave
- `/projects/[id]/community` deeper panel pass
- `/raids`
- `/raids/[id]`
- `/rewards`
- `/rewards/[id]`
