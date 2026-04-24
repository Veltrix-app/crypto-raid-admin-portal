# 2026-04-24 Flagship Redesign Wave 6 Rollout Notes

## Scope
- internal ops overview redesign pass for:
  - `/business`
  - `/success`
  - `/security`
  - `/growth`
  - `/support`

## What changed
- all five ops overviews now share the same calmer command-center rhythm:
  - top metrics first
  - then a `command read` block
  - then the heavier operational panels below
- each screen now answers the same three questions above the fold:
  - what is moving now
  - what needs the next human move
  - what should stay under watch

## Page-specific notes

### Business
- added a `Commercial command read`
- made the top of the page explicitly about:
  - collections pressure
  - next commercial account
  - activation drift under paid revenue

### Success
- added a `Success command read`
- the page now frames activation, expansion and churn as one operating story before the queue and account links take over

### Security
- added a `Security command read`
- the top of the page now separates:
  - weak posture
  - request pressure
  - incident pressure
- request and incident summaries now read as internal ops panels instead of generic state boxes

### Growth
- added a `Growth command read`
- the page now makes evaluation heat, follow-up timing and conversion context explicit before the lead queue

### Support
- added a `Support command read`
- the page now frames support as:
  - queue ownership
  - escalation pressure
  - incident command
instead of only ticket counts and the queue table

## Design direction reinforced
- dark-first premium control surfaces
- stronger above-the-fold directionality
- less immediate panel sprawl
- more `Now / Next / Watch` logic without flattening the content

## Verification
- `npm run build` in `C:\Users\jordi\OneDrive\Bureaublad\admin-portal`

## Notes
- this wave mostly sharpened hierarchy and reading order rather than deeply changing the underlying data panels
- the next strongest follow-up wave would be the matching detail routes under these ops surfaces so the whole internal system reads as one family end-to-end
