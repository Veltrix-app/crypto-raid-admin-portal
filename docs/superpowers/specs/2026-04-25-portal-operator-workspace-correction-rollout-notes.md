# Portal Operator Workspace Correction Rollout Notes

## What changed

This correction pass pulls the portal back from showcase-heavy presentation into a more reliable operator workspace.

The main changes are:

- smaller, quieter shell
- slimmer topbar with less descriptive weight
- clearer thin icon rail
- more space returned to page content
- `/projects` restored as a roster-first workbench
- `/projects/[id]` restored as a command-first workspace page
- lighter portal-wide hero rhythm through shared shell and `OpsHero` compaction

## Route-by-route review focus

### `/projects`

Check that:

- the roster is the first thing the eye lands on
- filters are immediately usable
- `New project` / `Apply project` is easy to find
- onboarding queue feels secondary, not competing
- project state is legible in one scan

### `/projects/[id]`

Check that:

- the workspace opens with direct action clarity
- `Operate` and `Watch` appear before summary-heavy blocks
- the project tabs feel like quick workspace pivots
- the page still exposes the same actions and data as before

### Shell

Check that:

- the topbar feels compact
- search no longer dominates
- workspace switching is still obvious
- the rail is still fast for power users
- the shell does not visually overpower the page

### Heavier ops pages

Because `OpsHero` and `PortalPageFrame` were compacted, also spot-check:

- `/overview`
- `/business`
- `/support`
- `/success`
- `/security`
- `/analytics`

The goal is not a redesign of each page, but making them inherit a more work-oriented rhythm.

## Verification run

Executed:

```bash
npm run build
```

In:

`C:\Users\jordi\OneDrive\Bureaublad\admin-portal`

Status:

- green

## Design rule locked in by this pass

For the portal, the rule is now:

**premium operator workspace first, showcase second**

That means:

- page content beats shell theatrics
- roster/list rhythm beats decorative cards
- quick routes into work beat summary drama
- supporting signals stay visible, but peripheral

## Next likely follow-up

If review goes well, the next portal follow-up should be:

- deeper correction on project subroutes such as launch and settings
- form/composer density cleanup where screens still feel oversized
- only then additional premium polish
