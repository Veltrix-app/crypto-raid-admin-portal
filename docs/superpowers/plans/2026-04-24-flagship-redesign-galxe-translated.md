# Flagship Redesign: Galxe-Translated Premium UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a stronger premium product identity for Veltrix by fully redesigning the three flagship screens that define the visual truth of the platform:

- public homepage `/`
- public pricing `/pricing`
- portal overview `/overview`

The redesign should be dark-first, premium, clearer, and more expressive than the current quiet-system pass, while still preserving strong page intent and operator clarity.

**Architecture:** Treat this tranche as a flagship visual reset, not a full-platform rewrite. Build a shared redesign language across public and portal, but apply it with different intensity:

- public = more atmospheric, more expressive, more showroom energy
- portal = calmer, more directional, more command-center clarity

The three flagship screens should establish the new palette, spacing rhythm, visual density, page-header structure, CTA language, and section cadence for the rest of the redesign program.

**Tech Stack:** Next.js App Router, React, TypeScript, existing `veltrix-web` public marketing stack, existing `admin-portal` shell/layout system, Tailwind utility styling, current billing and commercial components, and the approved design spec in `docs/superpowers/specs`.

---

## Scope framing

This plan is intentionally narrower than a full redesign.

It does not attempt to restyle the entire product in one pass.

Instead, it defines the first real flagship redesign tranche that will create the visual standard for later rollout waves.

This tranche includes:

- homepage redesign
- pricing redesign
- portal overview redesign
- only the shared design-family primitives those three screens require

This tranche does **not** include:

- builder redesign
- docs redesign
- deep internal ops redesign
- complete portal-wide component migration

---

## Relationship to earlier planning

This plan executes the approved spec:

- [2026-04-24-flagship-redesign-galxe-translated-design.md](C:\Users\jordi\OneDrive\Bureaublad\admin-portal\docs\superpowers\specs\2026-04-24-flagship-redesign-galxe-translated-design.md)

It should also be read as a more ambitious follow-on to the quieter surface language work already started in:

- [2026-04-24-portal-and-public-ui-quiet-system-rollout-design.md](C:\Users\jordi\OneDrive\Bureaublad\admin-portal\docs\superpowers\specs\2026-04-24-portal-and-public-ui-quiet-system-rollout-design.md)

This redesign tranche is not replacing the quiet-system logic.

It is raising that system into a stronger flagship visual identity.

---

## Working assumptions

- The redesign benchmark is "Galxe-translated", not "Galxe-cloned".
- Public and portal belong to the same design family.
- Public surfaces should be more expressive than portal surfaces.
- Dark-first remains the main visual posture.
- The redesign should improve clarity, not trade clarity for style.
- Existing product logic and route structure should stay intact unless a small layout or composition change is needed.
- Shared component changes should be limited to what homepage, pricing and overview actually need.

## Out of scope for this tranche

- full IA changes
- redesigning every public route
- redesigning every portal route
- rewriting all shared component primitives
- adding brand-new product features
- overhauling data contracts or state flows

---

## Product contract for the flagship redesign v1

### Core UX rule

Each flagship screen must make three things obvious within a few seconds:

- what this page is
- why it matters
- what the user should do next

### Visual contract

The flagship redesign must feel:

- premium
- dark-first
- modern
- web3-native with restraint
- calmer than most web3 products
- clearer than the current Veltrix UI

### Emotional contract

Veltrix should feel like:

- a launch operating system
- not a template SaaS site
- not a noisy quest marketplace
- not a sterile enterprise dashboard

---

## File structure for this tranche

### Public homepage files

- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\page.tsx`
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\components\marketing\public-launch-site.tsx`
- any direct homepage support components required by the redesign

### Public pricing files

- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\pricing\page.tsx`
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\components\billing\pricing-plan-grid.tsx`
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\components\billing\checkout-summary-card.tsx`
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\components\marketing\enterprise-cta-band.tsx`
- any direct pricing support components required by the redesign

### Portal overview files

- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\overview\page.tsx`
- supporting overview components as needed

### Shared visual family files

- targeted shared public layout/section primitives if needed
- targeted shared portal layout/overview primitives if needed

### Rollout notes

- create a dedicated rollout note file for this redesign tranche after implementation

---

## Task 1: Establish the flagship visual family

**Files:**
- Modify only the minimum shared public and portal primitives needed by the three target screens

- [ ] Define the dark-first premium surface rhythm for the flagship screens.
- [ ] Establish a stronger accent posture around lime and cyan without making the UI noisy.
- [ ] Increase visual depth through tonal layers, gradients, and quieter borders instead of heavy card grids.
- [ ] Ensure public and portal visibly belong to the same family while keeping public more expressive and portal more operational.
- [ ] Avoid broad primitive churn that would unintentionally restyle the whole platform before the flagship pages are validated.

## Task 2: Redesign the homepage as the premium product world

**Files:**
- Modify: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\page.tsx`
- Modify: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\components\marketing\public-launch-site.tsx`
- Modify or add direct homepage support components only if needed

- [ ] Rebuild the above-the-fold hero into a premium product statement with clear primary and secondary CTA.
- [ ] Replace any generic landing-page feel with stronger product-world composition and more intentional atmosphere.
- [ ] Introduce large story sections that explain launch, operate, grow, and control in a clearer sequence.
- [ ] Make the page feel more premium and more focused without turning it into a noisy web3 promo surface.
- [ ] Keep the overall reading path obvious and action-led.

## Task 3: Redesign pricing as a premium commercial confidence screen

**Files:**
- Modify: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\pricing\page.tsx`
- Modify any pricing support components used on the page

- [ ] Rebuild pricing so it reads as a flagship commercial page instead of a mostly functional plan list.
- [ ] Rework plan cards so the hierarchy is clearer and Growth reads as the commercial sweet spot.
- [ ] Clarify the self-serve vs enterprise split without making Enterprise feel like an afterthought.
- [ ] Add stronger commercial guidance so users can understand which plan fits them without over-reading.
- [ ] Keep billing trust, upgrade posture, and buyer confidence integrated into the page flow.

## Task 4: Redesign portal overview as a premium launch command center

**Files:**
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\overview\page.tsx`
- Modify supporting overview components only where required

- [ ] Rework the top zone so it clearly communicates workspace state, main priority, and the next operator move.
- [ ] Organize the page around the `Now`, `Next`, and `Watch` reading model.
- [ ] Reduce the sense of equal-weight modules and make the page feel more like a true command center.
- [ ] Increase premium feel without reducing portal clarity or operator speed.
- [ ] Ensure the overview still works across the current admin/operator contexts.

## Task 5: Align the public and portal flagship experience

**Files:**
- Modify only the shared supporting surfaces needed for visual consistency

- [ ] Check the homepage, pricing and portal overview side by side for family resemblance.
- [ ] Ensure color, atmosphere, typography hierarchy, and spacing feel related.
- [ ] Keep portal calmer than public, but clearly part of the same system.
- [ ] Remove any remaining visual contradiction between public premium language and portal operator language.

## Task 6: Verification and rollout notes

**Files:**
- Add rollout notes under `docs/superpowers/specs`

- [ ] Run build verification for `veltrix-web`.
- [ ] Run build verification for `admin-portal`.
- [ ] Write rollout notes with route-specific smoke guidance for homepage, pricing and overview.
- [ ] Document what visual rules were established so later redesign waves can inherit them.

---

## Verification requirements

Before this tranche is considered complete, run:

### `veltrix-web`

```bash
npm run typecheck --workspace veltrix-web
npm run build --workspace veltrix-web -- --webpack
```

### `admin-portal`

```bash
npm run build
```

Executed in:

- `C:\Users\jordi\OneDrive\Documenten\New project`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal`

---

## Smoke pass requirements

After deploy, verify:

### Homepage `/`

- the hero immediately explains what Veltrix is
- the CTA hierarchy is obvious
- the page feels premium and calm rather than generic or noisy
- the story sections read in a clear top-to-bottom flow

### Pricing `/pricing`

- the plans are immediately understandable
- Growth reads as the intended commercial sweet spot
- the self-serve vs enterprise split is obvious
- trust and buyer confidence feel integrated instead of bolted on

### Portal overview `/overview`

- the top zone reads like a command center
- the user can quickly understand what matters now
- the primary next move is more obvious than before
- the page feels more premium without becoming slower to scan

---

## Definition of done

This flagship redesign tranche is complete when:

- homepage feels materially more premium and focused
- pricing feels materially more trustworthy and higher-end
- portal overview feels materially more like a launch command center
- public and portal visibly share the same design family
- the redesign feels closer to Galxe in polish and clarity without becoming derivative
- the implementation is stable, builds cleanly, and is documented for the next redesign wave

---

## Next wave recommendation

If this flagship tranche lands well, the next redesign wave should move into:

- `/start`
- `/trust`
- `/talk-to-sales`
- and then the next portal flagship surfaces such as:
  - `/projects`
  - `/projects/[id]`

That keeps the redesign moving outward from the three flagship anchors into the rest of the public and operator product.
