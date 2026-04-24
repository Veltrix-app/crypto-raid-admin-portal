# Flagship Redesign Wave 8 Rollout Notes

## Scope
- internal ops finish pass for:
  - `/analytics`
  - `/qa`
  - `/releases/[id]`
- public buyer-path polish for:
  - `/trust`
  - `/talk-to-sales`
  - shared request-demo intake

## What changed
- `Analytics` now has a clearer command-read layer above the mode switch, so growth, outcomes, campaign pressure and verification pressure read as decision lanes instead of just view toggles.
- `QA` now has route-level command context with `Now / Next / Watch`, plus stronger release and readiness posture above the board.
- release detail now opens with release pressure and next move, not just raw counts.
- trust now reads more like a buyer checklist and less like a document registry.
- the request-demo flow is more structured, with clearer contact, launch-context and enterprise-posture sections.

## Visual direction
- keep the same dark-first premium family
- keep the same lime/cyan energy accents
- use command-read bands before dense operational detail
- use grouped sections instead of stacked raw panels

## Verification
- `npm run build` in `admin-portal`
- `npm run typecheck --workspace veltrix-web`
- `npm run build --workspace veltrix-web -- --webpack`

## Review focus
- does `Analytics` now feel like a real decision surface?
- does `QA` immediately communicate release pressure and next move?
- does release detail feel clearer before the operator reaches the lower control panels?
- does the trust + talk-to-sales path feel premium and calm enough to sit beside the homepage and pricing redesign?
