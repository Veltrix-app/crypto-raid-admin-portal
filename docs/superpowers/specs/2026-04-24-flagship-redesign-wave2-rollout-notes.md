# 2026-04-24 Flagship Redesign Wave 2 Rollout Notes

## Scope

Second redesign wave built on top of the flagship family:

### Public

- `/start`
- `/trust`
- `/talk-to-sales`

### Portal

- `/projects`
- `/projects/[id]` through shared workspace/detail surface upgrades

## Intent

This wave extends the flagship redesign into the next pages users hit after:

- landing on the site
- evaluating trust
- opening the buyer path
- moving into workspace management

The goal was not to invent a second style, but to prove that the same family can hold:

- public buyer flows
- portal workspace flows

## What changed

### Public start flow

- `/start` now reads as a premium routing page instead of a simple split-choice screen
- new customer vs existing customer paths are clearer and more deliberate
- stronger relationship to the homepage/pricing flagship language

### Public trust center

- `/trust` now feels more integrated with the premium public family
- buyer review routes and public materials are easier to scan
- control cards, documents and subprocessors sit in calmer, stronger surfaces

### Public talk-to-sales

- `/talk-to-sales` now feels like a premium buyer intake surface
- stronger top structure and path guidance
- request form now sits in a higher-trust, more flagship-quality container

### Portal projects board

- `/projects` now reads more like a premium workspace index and less like a utility wall
- stronger `Now / Next / Watch` top-zone language through the board header
- roster feels more aligned with the redesign family

### Portal project workspace

- `/projects/[id]` inherits a more premium workspace shell
- stronger project workspace hero
- calmer detail surfaces and action tiles
- overview helper components now sit more naturally inside the redesign system

## Shared rules reinforced

- public and portal are clearly the same family
- public remains more atmospheric
- portal remains more operational
- top zones should always establish page intent first
- cards should feel like meaningful surfaces, not repeated boxes
- gradients and tonal depth should do more work than borders alone

## Verification completed

### `veltrix-web`

- `npm run typecheck --workspace veltrix-web`
- `npm run build --workspace veltrix-web -- --webpack`

### `admin-portal`

- `npm run build`

## Smoke checklist

### Public

- `/start`
  - route choice is obvious immediately
  - new vs existing customer split feels premium and clear

- `/trust`
  - trust, documents and subprocessors all feel part of one buyer flow
  - trust center feels premium rather than purely utilitarian

- `/talk-to-sales`
  - buyer path feels high-trust and easy to understand
  - form feels premium but still short and action-led

### Portal

- `/projects`
  - top zone reads as portfolio command layer
  - portfolio vs onboarding mode is easier to understand
  - roster is calmer and easier to scan

- `/projects/[id]`
  - project workspace hero feels materially more premium
  - detail surfaces feel less boxy and more intentional
  - overview sections still scan quickly

## Next recommendation

If this wave lands well, the next logical redesign wave is:

- `/community`
- `/campaigns`
- `/campaigns/[id]`
- `/quests`
- `/quests/[id]`

That would extend the redesign from flagship and workspace entry into the core execution surfaces.
