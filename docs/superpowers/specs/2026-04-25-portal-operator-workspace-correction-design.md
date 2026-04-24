# Portal Operator Workspace Correction Design

## Purpose

Correct the portal after the premium visual pass so it reads as an operator workspace again instead of a showcase surface.

The portal should remain premium, dark, and visually coherent with the public/webapp family, but it must optimize first for:

- navigation clarity
- project management speed
- obvious next actions
- compact workspace density

This pass is not a new redesign. It is a focused usability correction that preserves the stronger visual language while removing the friction introduced by over-styling the operator experience.

## Problem Statement

The current portal drifted too far toward a presentation surface.

The largest regressions are:

- the shell consumes too much cognitive and vertical space
- the left rail is visually cleaner, but too cryptic as a primary navigation aid
- the topbar carries too much descriptive and decorative weight
- `/projects` no longer feels like the primary workbench for active operators
- `/projects/[id]` reads too much like a summary surface and not enough like a command page
- some internal ops pages still feel more “showcase dashboard” than “decision workspace”

The public/webapp can support more browse-oriented, Galxe-translated behavior. The portal cannot. The portal has to be faster, drier, and clearer.

## Chosen Approach

Three approaches were considered:

1. Minimal rollback
2. Operator correction pass
3. Hard split redesign

The chosen approach is `operator correction pass`.

Reasoning:

- it preserves the premium direction that is already working
- it fixes the specific usability regressions without throwing away recent work
- it is small enough to ship quickly
- it re-centers projects and workspaces as the portal’s core job

## Correction Principles

The portal should now follow this rule:

`portal = operator workspace premium`

That means:

- less hero energy
- less shell dominance
- less decorative density
- more direct work surfaces
- more list/row rhythm
- clearer hierarchy around primary actions
- faster project scanning

The portal should not become plain or ugly. It should feel like confident operator software rather than a branded showcase.

## Shell Correction

The shell will be corrected first because all pages inherit its weight and pacing.

### New shell rules

- reduce topbar height
- reduce page-title scale
- reduce description weight to one short support line
- make search compact and secondary
- make workspace switch compact and strictly functional
- reduce account/profile presence on the right side
- keep the thin icon rail, but ensure the active state is clearer and the rail does not compete with content
- return more horizontal and vertical space to the page body

### Intended outcome

The shell should frame work, not compete with it.

A user should feel:

- where am I
- what workspace am I in
- how do I get to the next tool

without feeling like the shell is the most visually important thing on the screen.

## `/projects` Correction

`/projects` is the highest-priority workbench page and should be restored as such.

### New hierarchy

1. compact pagebar
2. small stats row
3. filters + primary create action
4. project roster as the primary surface
5. onboarding/intake as a secondary lane

### Required behavior

- the roster is the main event again
- onboarding cannot visually compete with the main project list
- filters should feel immediate and compact
- project scanning should be possible in a few seconds
- project name, state, chain/context, and likely next action should all be readable in one pass

### Intended outcome

The user should instantly understand:

- what projects exist
- which ones are active or blocked
- which one to open next

## `/projects/[id]` Correction

The project detail route should be corrected into a workspace command page.

### New hierarchy

1. compact workspace header
2. project state + primary action
3. signal row
4. three work lanes:
   - Launch
   - Operate
   - Watch

### Launch

- readiness state
- immediate blocker or next move
- direct route to launch flow

### Operate

- campaigns
- community
- rewards
- direct daily work entries

### Watch

- support
- trust
- billing
- other risks that need monitoring but not constant dominance

### Intended outcome

The user should understand within a few seconds:

- how this project is doing
- what the next operator move is
- where to click to continue working

## Internal Ops Alignment

After shell + project correction, the same lighter operator logic should be applied across:

- Overview
- Business
- Success
- Support
- Security
- Analytics
- Growth

This is not a second redesign. It is a consistency pass.

### Alignment rules

- trim over-large command blocks
- reduce decorative panel weight
- keep priority and action links clear
- keep decision surfaces denser and calmer
- remove remaining old dashboard/showcase hybrids

## Execution Order

The correction pass will be implemented in this order:

1. shell
2. `/projects`
3. `/projects/[id]`
4. portal-wide ops alignment

This order is intentional because:

- shell problems contaminate every page
- `/projects` is the most important operator entry
- `/projects/[id]` is the second most important workspace surface
- the ops alignment should inherit the corrected shell and workspace logic

## Definition of Done

This correction pass is done when:

- the shell feels smaller and less dominant
- the portal feels more like a workspace and less like a showcase
- `/projects` clearly functions as the main project workbench
- `/projects/[id]` clearly functions as a command page
- project management feels faster than before
- the icon rail remains useful without becoming visually noisy
- internal ops pages feel premium but operational

## Non-Goals

This pass does not:

- change routes
- change data flow
- change permissions
- change business logic
- redesign the public/webapp

It is strictly a portal operator correction pass.
