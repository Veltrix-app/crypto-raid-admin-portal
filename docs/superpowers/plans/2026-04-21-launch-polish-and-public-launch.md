# Launch Polish and Public Launch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish `Phase 8` by turning Veltrix into a real public-launch product across the full scope: a founder-first public site, a premium and coherent operator portal, a polished member-facing webapp, product-native bot surfaces, public legal/support routes, and a final QA sweep that removes caveats before launch.

**Architecture:** Keep all major systems from Phases 1 through 7 intact. Phase 8 adds the final experience and launch layer on top: a public launch surface in `veltrix-web`, shared brand and messaging rules, consistency and polish passes across portal and webapp surfaces, bot copy/output cleanup, legal/support pages, and launch-grade QA. This phase should unify public positioning and in-product experience without opening new major feature streams.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind, `admin-portal`, `apps/veltrix-web`, `veltrix-community-bot`, Vercel, Render, Supabase where already needed, and `docs/superpowers`.

---

## Scope Guardrails

This plan intentionally covers only `Phase 8`:

- public launch site
- shared launch messaging
- portal consistency and polish
- member webapp polish
- bot launch polish
- legal and support surfaces
- final cross-surface QA

In scope:

- root public site and CTA model
- route clarity between public and authenticated surfaces
- copy and empty-state cleanup
- visual polish and hierarchy cleanup
- legal/support pages
- final QA and launch-readiness verification

Out of scope for this tranche:

- new trust systems
- new payout systems
- new on-chain systems
- new community OS systems
- new member-journey subsystems
- pricing engine rebuild
- CMS rollout
- multilingual launch
- case-study system
- net-new backoffice infrastructure unrelated to launch polish

Assumption for this plan:

- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\page.tsx` becomes the public launch site
- the existing authenticated member home/grid moves to a clearer in-product route such as `/home`
- legal/support routes live in `veltrix-web` so the public launch surface stays self-contained

---

## File Structure

### Public site and shared launch messaging

- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\page.tsx`
  - replace current authenticated home landing with the public launch site
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\home\page.tsx`
  - new authenticated home/grid route if needed
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\components\marketing\*`
  - launch-site sections, proof rails, CTA blocks, FAQ, footer
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\lib\marketing\launch-copy.ts`
  - shared launch copy contract and section content

### Public legal and support

- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\privacy\page.tsx`
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\terms\page.tsx`
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\support\page.tsx`
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\rewards\disclaimer\page.tsx`

### Portal polish

- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\overview\page.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\analytics\page.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\claims\page.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\moderation\page.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\onchain\page.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\[id]\community\page.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\[id]\launch\page.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\campaigns\new\page.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\quests\new\page.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\raids\new\page.tsx`
- relevant layout and empty-state primitives under:
  - `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\layout`
  - `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\forms`

### Webapp polish

- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\components\community\*`
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\components\rewards\*`
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\components\notifications\*`
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\components\profile\*`
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\components\home\*`
- webapp root and layout routes under:
  - `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app`

### Bot polish

- `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\providers\discord\*`
- `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\providers\telegram\*`
- `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\core\community\*`

### Launch docs

- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\docs\superpowers\specs\2026-04-21-launch-polish-and-public-launch-design.md`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\docs\superpowers\specs\2026-04-21-operator-runbooks.md`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\docs\superpowers\specs\2026-04-21-deploy-hygiene-checklist.md`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\docs\superpowers\plans\2026-04-21-launch-polish-and-public-launch.md`

---

## Task 1: Establish the launch language and surface routing model

**Files:**
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\lib\marketing\launch-copy.ts`
- Review and update shared surface copy across:
  - `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app`
  - `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\components`
  - `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src`
- Test:
  - copy review
  - route review

- [ ] Define the founder-first public launch messaging and make sure the same product language appears in portal, webapp, and bots.
- [ ] Clean up internal or admin-sounding copy where it weakens the public product experience.
- [ ] Lock the dual CTA posture: `Start now`, `Book demo`, and a lighter `Talk to us` support path.
- [ ] Resolve the route model for the webapp so the public root can become the launch site without leaving hidden authenticated-only assumptions behind.
- [ ] Keep the language consistent for Project OS, Community OS, Member Journey, activation, trust, payouts, on-chain, and support posture.

## Task 2: Build the public launch site

**Files:**
- Modify: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\page.tsx`
- Create:
  - `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\components\marketing\LaunchHero.tsx`
  - `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\components\marketing\WorkflowProof.tsx`
  - `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\components\marketing\ProductArchitectureRail.tsx`
  - `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\components\marketing\LaunchFaq.tsx`
  - `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\components\marketing\LaunchFooter.tsx`
- Create optional authenticated route:
  - `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\home\page.tsx`
- Test:
  - `npm run typecheck --workspace veltrix-web`
  - `npm run build --workspace veltrix-web -- --webpack`

- [ ] Replace the current root page with a real founder-first public launch site.
- [ ] Use workflow proof and system proof instead of fake customer proof.
- [ ] Make the site visually lighter and more editorial while staying clearly part of the same brand as the product.
- [ ] Make self-serve and high-touch entry both obvious and legitimate.
- [ ] Ensure authenticated users still have a clean in-product home after the root page changes.

## Task 3: Polish the admin portal to launch-grade quality

**Files:**
- Modify key portal surfaces under:
  - `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\overview\page.tsx`
  - `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\analytics\page.tsx`
  - `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\claims\page.tsx`
  - `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\moderation\page.tsx`
  - `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\onchain\page.tsx`
  - `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\[id]\community\page.tsx`
  - `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\[id]\launch\page.tsx`
- Modify shared primitives as needed:
  - `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\layout`
  - `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\forms`
- Test:
  - `npm run build` in `C:\Users\jordi\OneDrive\Bureaublad\admin-portal`

- [ ] Run a final copy, hierarchy, spacing, and empty-state pass over the operator portal.
- [ ] Remove any remaining route confusion, hidden create flows, or screens that still feel internal-only.
- [ ] Make the studio, launch, community, and safety consoles feel like one intentional product family.
- [ ] Tighten responsive behavior and action placement on the highest-value operational pages.
- [ ] Keep the portal elite and operator-grade without making it harder to scan.

## Task 4: Polish the member-facing webapp

**Files:**
- Modify:
  - `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\components\community\*`
  - `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\components\rewards\*`
  - `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\components\notifications\*`
  - `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\components\profile\*`
  - `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\components\home\*`
- Test:
  - `npm run typecheck --workspace veltrix-web`
  - `npm run build --workspace veltrix-web -- --webpack`

- [ ] Make Community Home feel personal, premium, and clearly action-oriented.
- [ ] Strengthen onboarding and comeback rails so they motivate instead of merely informing.
- [ ] Refine rewards, notifications, profile, and recognition language so they feel product-native.
- [ ] Improve CTA hierarchy and mobile rhythm on the key member surfaces.
- [ ] Ensure the public site and authenticated product feel intentionally related rather than visually disconnected.

## Task 5: Polish Discord and Telegram for public launch quality

**Files:**
- Modify:
  - `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\providers\discord\*`
  - `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\providers\telegram\*`
  - relevant shared command helpers under `src\core\community`
- Test:
  - `npm run typecheck --workspace veltrix-community-bot`
  - `npm run build --workspace veltrix-community-bot`

- [ ] Refine command responses so they feel like a polished product surface instead of a script output.
- [ ] Tighten failure and fallback copy.
- [ ] Make deep-link language cleaner and more confident.
- [ ] Keep Discord and Telegram consistent without forcing unnatural parity where the medium differs.
- [ ] Review the command set as a public launch experience, not just a technical interface.

## Task 6: Add public legal and support surfaces

**Files:**
- Create:
  - `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\privacy\page.tsx`
  - `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\terms\page.tsx`
  - `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\support\page.tsx`
  - `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\rewards\disclaimer\page.tsx`
- Link from:
  - launch-site footer
  - relevant reward surfaces
- Test:
  - route review
  - `npm run build --workspace veltrix-web -- --webpack`

- [ ] Add privacy, terms, support/contact, and reward participation disclaimers as real public surfaces.
- [ ] Keep the tone clear, serious, and aligned with the rest of the product.
- [ ] Avoid building a complex support backend if a simpler and credible launch path works better.
- [ ] Make support and help routes discoverable from both the public site and relevant in-product places.

## Task 7: Final cross-surface launch QA and acceptance sweep

**Files:**
- Validate all touched portal files under:
  - `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app`
  - `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components`
- Validate all touched webapp files under:
  - `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src`
- Validate bot files under:
  - `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src`

- [ ] Run `npm run build` in `C:\Users\jordi\OneDrive\Bureaublad\admin-portal`.
- [ ] Run `npm run typecheck --workspace veltrix-web`.
- [ ] Run `npm run build --workspace veltrix-web -- --webpack`.
- [ ] Run `npm run typecheck --workspace veltrix-community-bot`.
- [ ] Run `npm run build --workspace veltrix-community-bot`.
- [ ] Validate public launch acceptance on:
  - `/`
  - `/privacy`
  - `/terms`
  - `/support`
- [ ] Validate in-product acceptance on:
  - portal critical routes
  - webapp critical routes
  - Discord and Telegram command flows
- [ ] Confirm there are no dead ends, hidden expert-only flows, obvious copy regressions, or mobile-breakage on launch-critical surfaces.

---

## Exit Criteria

- [ ] The public site explains Veltrix clearly without fake social proof.
- [ ] Public and in-product surfaces feel like one premium brand system.
- [ ] The portal feels coherent, deliberate, and ready for public demos.
- [ ] The member webapp feels personal and polished instead of merely functional.
- [ ] Bot surfaces feel clean, reliable, and product-native.
- [ ] Legal and support surfaces are public-launch ready.
- [ ] The product can be shown, sold, and launched publicly without caveats.
