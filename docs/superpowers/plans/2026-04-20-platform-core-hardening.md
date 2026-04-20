# Platform Core Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add explicit lifecycle, access, audit, incident, and override rails so Veltrix is operationally safe before more product depth is layered on top.

**Architecture:** Add a shared platform-core foundation across the database, portal, and runtime. The database will own lifecycle, incident, override, and audit records; `admin-portal` will expose project-private read/write APIs and operator UI primitives; `veltrix-community-bot` will report incident and run-state events into the same foundation so portal and runtime speak one operational language.

**Tech Stack:** Next.js App Router, React, TypeScript, Supabase/Postgres, SQL migrations, `admin-portal`, `veltrix-community-bot`, existing project-community auth helpers, and existing claim/community/on-chain/push workflows.

---

## File Structure

### New database files

- `C:\Users\jordi\OneDrive\Documenten\New project\database\migrations\veltrix_platform_core_hardening.sql`
  - lifecycle, incident, override, and audit tables plus supporting indexes and check constraints

### New portal files

- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\platform\core-lifecycle.ts`
  - shared lifecycle labels, transition guards, and object state helpers
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\platform\core-ops.ts`
  - shared project-private loaders and mutators for incidents, overrides, and audit records
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\platform\LifecycleStatusPill.tsx`
  - shared lifecycle status pill for campaigns, quests, raids, rewards, claims, and automations
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\platform\OpsIncidentPanel.tsx`
  - shared incident card list for failed, blocked, or degraded operations
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\platform\OpsOverridePanel.tsx`
  - shared override UI for pause, resume, retry, dismiss, and mark-resolved flows
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\ops-incidents\route.ts`
  - project-private read API for platform incidents
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\ops-overrides\route.ts`
  - project-private API for creating and updating manual overrides
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\ops-audit\route.ts`
  - project-private read API for lifecycle and operator audit history

### New runtime files

- `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\core\platform\operation-events.ts`
  - shared incident and audit write helpers for bot jobs and provider rails
- `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\core\platform\operation-state.ts`
  - runtime-side shared lifecycle and incident labels

### Modified portal files

- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\community\project-community-auth.ts`
  - expose a more general project access helper that non-community routes can reuse safely
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\project-integrations\route.ts`
  - move onto the shared project access helper and audit critical mutations
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\community-push\dispatch\route.ts`
  - log push failures and resolved retries into platform incidents and audit trails
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\community-bot-settings\route.ts`
  - add audit writes and incident-safe responses
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\community-push-test\route.ts`
  - log failed tests as incidents, successful tests as audit records
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\claims\page.tsx`
  - surface incident and override state for claim processing
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\moderation\page.tsx`
  - surface degraded pipeline state and on-chain incidents
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\[id]\community\page.tsx`
  - surface project-scoped incidents and overrides inside Community OS
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\campaigns\[id]\page.tsx`
  - show lifecycle and operator history for campaign objects
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\quests\[id]\page.tsx`
  - show lifecycle and operator history for quest objects
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\raids\[id]\page.tsx`
  - show lifecycle and operator history for raid objects
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\rewards\[id]\page.tsx`
  - show lifecycle and operator history for reward objects

### Modified runtime files

- `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\http\jobs.ts`
  - report failed job runs and overrides into the platform event model
- `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\http\webhooks.ts`
  - report verification and push ingestion incidents
- `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\providers\telegram\push.ts`
  - emit audit and incident events for provider delivery
- `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\providers\discord\push.ts`
  - emit audit and incident events for provider delivery
- `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\jobs\retry-onchain-ingress.ts`
  - log failed retries and manual recovery events
- `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\jobs\enrich-onchain-events.ts`
  - log enrichment incidents and resolutions

### Test and docs files

- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\docs\superpowers\plans\2026-04-20-platform-core-hardening.md`
  - this plan
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\docs\superpowers\specs\2026-04-20-ops-runbook-outline.md`
  - launch and incident runbook outline for operators
- `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\core\platform\operation-events.test.ts`
  - runtime event helper coverage

---

## Task 1: Add the platform-core schema

**Files:**
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\database\migrations\veltrix_platform_core_hardening.sql`
- Reference: `C:\Users\jordi\OneDrive\Documenten\New project\database\migrations\veltrix_community_os_v5.sql`
- Test: schema review in Supabase SQL editor

- [ ] **Step 1: Write the migration skeleton**

```sql
begin;

create table if not exists public.project_operation_audits (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  object_type text not null,
  object_id text not null,
  action_type text not null,
  actor_auth_user_id uuid,
  actor_role text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  constraint project_operation_audits_object_type_check
    check (object_type in ('campaign', 'quest', 'raid', 'reward', 'claim', 'automation', 'community_run', 'provider_sync')),
  constraint project_operation_audits_action_type_check
    check (action_type in ('created', 'updated', 'published', 'paused', 'resumed', 'retried', 'resolved', 'dismissed', 'archived'))
);
```

- [ ] **Step 2: Add incidents and overrides**

```sql
create table if not exists public.project_operation_incidents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  object_type text not null,
  object_id text not null,
  source_type text not null,
  severity text not null default 'warning',
  status text not null default 'open',
  title text not null,
  summary text,
  metadata jsonb not null default '{}'::jsonb,
  opened_at timestamp with time zone not null default now(),
  resolved_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint project_operation_incidents_source_type_check
    check (source_type in ('provider', 'job', 'manual_test', 'pipeline', 'runtime')),
  constraint project_operation_incidents_severity_check
    check (severity in ('info', 'warning', 'critical')),
  constraint project_operation_incidents_status_check
    check (status in ('open', 'watching', 'resolved', 'dismissed'))
);

create table if not exists public.project_operation_overrides (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  object_type text not null,
  object_id text not null,
  override_type text not null,
  status text not null default 'active',
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_by_auth_user_id uuid,
  resolved_by_auth_user_id uuid,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  resolved_at timestamp with time zone,
  constraint project_operation_overrides_override_type_check
    check (override_type in ('pause', 'manual_retry', 'manual_complete', 'skip', 'mute')),
  constraint project_operation_overrides_status_check
    check (status in ('active', 'resolved', 'canceled'))
);
```

- [ ] **Step 3: Add indexes**

```sql
create index if not exists idx_project_operation_audits_project_id_created_at
  on public.project_operation_audits (project_id, created_at desc);

create index if not exists idx_project_operation_incidents_project_id_status
  on public.project_operation_incidents (project_id, status, updated_at desc);

create index if not exists idx_project_operation_overrides_project_id_status
  on public.project_operation_overrides (project_id, status, updated_at desc);

commit;
```

- [ ] **Step 4: Review migration text before running**

Run: open `C:\Users\jordi\OneDrive\Documenten\New project\database\migrations\veltrix_platform_core_hardening.sql`
Expected: no placeholder checks, no missing `commit`, no unbounded enum-like text fields

- [ ] **Step 5: Commit**

```bash
git add "C:\Users\jordi\OneDrive\Documenten\New project\database\migrations\veltrix_platform_core_hardening.sql"
git commit -m "feat: add platform core hardening schema"
```

## Task 2: Add shared lifecycle and ops helpers in the portal

**Files:**
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\platform\core-lifecycle.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\platform\core-ops.ts`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\community\project-community-auth.ts`
- Test: build-only validation

- [ ] **Step 1: Add shared lifecycle labels**

```ts
export type PlatformLifecycleState =
  | "draft"
  | "ready"
  | "live"
  | "paused"
  | "completed"
  | "archived"
  | "failed";

export const PLATFORM_LIFECYCLE_LABELS: Record<PlatformLifecycleState, string> = {
  draft: "Draft",
  ready: "Ready",
  live: "Live",
  paused: "Paused",
  completed: "Completed",
  archived: "Archived",
  failed: "Failed",
};
```

- [ ] **Step 2: Add transition guards**

```ts
const TRANSITIONS: Record<PlatformLifecycleState, PlatformLifecycleState[]> = {
  draft: ["ready", "archived"],
  ready: ["live", "paused", "archived"],
  live: ["paused", "completed", "failed"],
  paused: ["ready", "live", "archived"],
  completed: ["archived"],
  archived: [],
  failed: ["paused", "ready", "archived"],
};

export function canTransitionLifecycle(
  current: PlatformLifecycleState,
  next: PlatformLifecycleState
) {
  return TRANSITIONS[current].includes(next);
}
```

- [ ] **Step 3: Add project access wrapper for platform routes**

```ts
export async function assertProjectAccess(projectId: string) {
  return assertProjectCommunityAccess(projectId);
}
```

- [ ] **Step 4: Add incident and audit helpers**

```ts
export async function listProjectOperationIncidents(projectId: string) {
  const serviceSupabase = getServiceSupabaseClient();
  const { data, error } = await serviceSupabase
    .from("project_operation_incidents")
    .select("*")
    .eq("project_id", projectId)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}
```

- [ ] **Step 5: Run build to verify helper types**

Run: `npm run build`
Workdir: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal`
Expected: build passes without missing import or unresolved type errors

- [ ] **Step 6: Commit**

```bash
git add "C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\platform\core-lifecycle.ts" "C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\platform\core-ops.ts" "C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\community\project-community-auth.ts"
git commit -m "feat: add platform lifecycle and ops helpers"
```

## Task 3: Add project-private platform ops APIs

**Files:**
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\ops-incidents\route.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\ops-overrides\route.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\ops-audit\route.ts`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\project-integrations\route.ts`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\community-push\dispatch\route.ts`
- Test: build-only validation

- [ ] **Step 1: Add the incidents route**

```ts
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    await assertProjectAccess(id);
    const incidents = await listProjectOperationIncidents(id);
    return NextResponse.json({ ok: true, incidents });
  } catch (error) {
    return createProjectCommunityAccessErrorResponse(error, "Failed to load incidents.");
  }
}
```

- [ ] **Step 2: Add the overrides route**

```ts
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const access = await assertProjectAccess(id);
    const body = await request.json();
    const override = await upsertProjectOperationOverride({
      projectId: id,
      actorAuthUserId: access.authUserId,
      objectType: body.objectType,
      objectId: body.objectId,
      overrideType: body.overrideType,
      reason: body.reason ?? "",
    });
    return NextResponse.json({ ok: true, override });
  } catch (error) {
    return createProjectCommunityAccessErrorResponse(error, "Failed to save override.");
  }
}
```

- [ ] **Step 3: Add the audit route**

```ts
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    await assertProjectAccess(id);
    const audits = await listProjectOperationAudits(id);
    return NextResponse.json({ ok: true, audits });
  } catch (error) {
    return createProjectCommunityAccessErrorResponse(error, "Failed to load audit history.");
  }
}
```

- [ ] **Step 4: Write audit records from existing mutations**

```ts
await createProjectOperationAudit({
  projectId,
  objectType: "provider_sync",
  objectId: integrationId,
  actionType: "updated",
  actorAuthUserId: access.authUserId,
  actorRole: access.membershipRole,
  metadata: { provider: "telegram", mutation: "integration_settings" },
});
```

- [ ] **Step 5: Run build to verify route typing**

Run: `npm run build`
Workdir: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal`
Expected: build passes and new API routes compile

- [ ] **Step 6: Commit**

```bash
git add "C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\ops-incidents\route.ts" "C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\ops-overrides\route.ts" "C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\ops-audit\route.ts" "C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\project-integrations\route.ts" "C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\community-push\dispatch\route.ts"
git commit -m "feat: add platform ops APIs"
```

## Task 4: Add runtime event logging for incidents and audits

**Files:**
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\core\platform\operation-state.ts`
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\core\platform\operation-events.ts`
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\core\platform\operation-events.test.ts`
- Modify: `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\providers\telegram\push.ts`
- Modify: `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\providers\discord\push.ts`
- Modify: `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\http\jobs.ts`
- Modify: `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\http\webhooks.ts`
- Test: `node --import tsx --test src/core/platform/operation-events.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { normalizeIncidentSeverity } from "./operation-state";

test("normalizeIncidentSeverity falls back to warning", () => {
  assert.equal(normalizeIncidentSeverity("unknown"), "warning");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test src/core/platform/operation-events.test.ts`
Workdir: `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot`
Expected: FAIL because `operation-state.ts` does not exist yet

- [ ] **Step 3: Write minimal runtime lifecycle helpers**

```ts
export type PlatformIncidentSeverity = "info" | "warning" | "critical";

export function normalizeIncidentSeverity(input: string): PlatformIncidentSeverity {
  if (input === "info" || input === "critical") return input;
  return "warning";
}
```

- [ ] **Step 4: Add event write helpers**

```ts
export async function createPlatformIncident(input: {
  projectId: string;
  objectType: string;
  objectId: string;
  sourceType: string;
  severity: PlatformIncidentSeverity;
  title: string;
  summary?: string;
  metadata?: Record<string, unknown>;
}) {
  const supabase = getServiceRoleClient();
  const { error } = await supabase.from("project_operation_incidents").insert({
    project_id: input.projectId,
    object_type: input.objectType,
    object_id: input.objectId,
    source_type: input.sourceType,
    severity: input.severity,
    title: input.title,
    summary: input.summary ?? null,
    metadata: input.metadata ?? {},
  });

  if (error) throw new Error(error.message);
}
```

- [ ] **Step 5: Wire Telegram and Discord push failures**

```ts
await createPlatformIncident({
  projectId,
  objectType: "provider_sync",
  objectId: targetId,
  sourceType: "provider",
  severity: "warning",
  title: "Telegram push failed",
  summary: responseDescription,
  metadata: { provider: "telegram", channelId: targetId },
});
```

- [ ] **Step 6: Run runtime tests**

Run: `node --import tsx --test src/core/platform/operation-events.test.ts`
Workdir: `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot`
Expected: PASS

- [ ] **Step 7: Run runtime build**

Run: `npm run build`
Workdir: `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot`
Expected: build passes

- [ ] **Step 8: Commit**

```bash
git add "C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\core\platform\operation-state.ts" "C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\core\platform\operation-events.ts" "C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\core\platform\operation-events.test.ts" "C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\providers\telegram\push.ts" "C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\providers\discord\push.ts" "C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\http\jobs.ts" "C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\http\webhooks.ts"
git commit -m "feat: log platform incidents from runtime flows"
```

## Task 5: Add shared portal UI primitives for lifecycle, incidents, and overrides

**Files:**
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\platform\LifecycleStatusPill.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\platform\OpsIncidentPanel.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\platform\OpsOverridePanel.tsx`
- Test: build-only validation

- [ ] **Step 1: Add the lifecycle pill**

```tsx
export default function LifecycleStatusPill({
  state,
}: {
  state: PlatformLifecycleState;
}) {
  return (
    <span className={getLifecyclePillClasses(state)}>
      {PLATFORM_LIFECYCLE_LABELS[state]}
    </span>
  );
}
```

- [ ] **Step 2: Add the incidents panel**

```tsx
export default function OpsIncidentPanel({
  incidents,
}: {
  incidents: ProjectOperationIncident[];
}) {
  if (incidents.length === 0) {
    return <StateMessage title="No open incidents" description="This project is running cleanly right now." />;
  }

  return incidents.map((incident) => (
    <div key={incident.id} className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
      <p className="text-sm font-bold text-text">{incident.title}</p>
      <p className="mt-2 text-sm leading-6 text-sub">{incident.summary}</p>
    </div>
  ));
}
```

- [ ] **Step 3: Add the override panel**

```tsx
export default function OpsOverridePanel({
  overrides,
  onCreate,
}: {
  overrides: ProjectOperationOverride[];
  onCreate: (input: CreateOverrideInput) => Promise<void>;
}) {
  return (
    <div className="rounded-[24px] border border-white/8 bg-black/20 p-4">
      <button onClick={() => onCreate({ objectType: "automation", objectId: "leaderboard", overrideType: "pause" })}>
        Pause automation
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Run portal build**

Run: `npm run build`
Workdir: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal`
Expected: build passes and shared platform components compile

- [ ] **Step 5: Commit**

```bash
git add "C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\platform\LifecycleStatusPill.tsx" "C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\platform\OpsIncidentPanel.tsx" "C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\platform\OpsOverridePanel.tsx"
git commit -m "feat: add platform ops UI primitives"
```

## Task 6: Surface incidents and overrides in the highest-risk portal pages

**Files:**
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\claims\page.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\moderation\page.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\[id]\community\page.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\campaigns\[id]\page.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\quests\[id]\page.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\raids\[id]\page.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\rewards\[id]\page.tsx`
- Test: build-only validation

- [ ] **Step 1: Add a shared data fetch pattern**

```ts
const incidentsResponse = await fetch(`/api/projects/${projectId}/ops-incidents`, {
  cache: "no-store",
});
const incidentsPayload = await incidentsResponse.json();
```

- [ ] **Step 2: Surface open incidents where operators already work**

```tsx
<OpsIncidentPanel incidents={openIncidents} />
<OpsOverridePanel overrides={activeOverrides} onCreate={handleCreateOverride} />
```

- [ ] **Step 3: Add lifecycle pills on object detail pages**

```tsx
<LifecycleStatusPill state={campaignLifecycleState} />
```

- [ ] **Step 4: Run portal build**

Run: `npm run build`
Workdir: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal`
Expected: build passes and page surfaces compile cleanly

- [ ] **Step 5: Commit**

```bash
git add "C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\claims\page.tsx" "C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\moderation\page.tsx" "C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\[id]\community\page.tsx" "C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\campaigns\[id]\page.tsx" "C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\quests\[id]\page.tsx" "C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\raids\[id]\page.tsx" "C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\rewards\[id]\page.tsx"
git commit -m "feat: surface platform incidents and lifecycle state"
```

## Task 7: Add operator runbook scaffolding and rollout verification

**Files:**
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\docs\superpowers\specs\2026-04-20-ops-runbook-outline.md`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\docs\superpowers\plans\2026-04-20-platform-core-hardening.md`

- [ ] **Step 1: Write the runbook outline**

```md
# Ops Runbook Outline

## Launch Day
- Check provider health
- Check open incidents
- Check paused overrides

## Push Incident
- Find the incident
- Validate target settings
- Retry or pause
```

- [ ] **Step 2: Record the rollout checklist in this plan**

```md
- Run the SQL migration manually in Supabase
- Redeploy `veltrix-community-bot`
- Wait for `admin-portal` deploy
- Verify incidents and overrides load in portal pages
```

- [ ] **Step 3: Run final verification commands**

Run:

```bash
npm run build
```

Workdir: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal`

Run:

```bash
npm run build
```

Workdir: `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot`

Expected: both builds pass

- [ ] **Step 4: Commit**

```bash
git add "C:\Users\jordi\OneDrive\Bureaublad\admin-portal\docs\superpowers\specs\2026-04-20-ops-runbook-outline.md" "C:\Users\jordi\OneDrive\Bureaublad\admin-portal\docs\superpowers\plans\2026-04-20-platform-core-hardening.md"
git commit -m "docs: add ops runbook outline for platform hardening"
```

---

## Self-review

### Spec coverage

- lifecycle models: covered by Tasks 1, 2, 5, and 6
- permissions and project-private rails: covered by Tasks 2 and 3
- audit trails: covered by Tasks 1, 3, and 4
- incidents and manual overrides: covered by Tasks 1, 3, 4, 5, and 6
- operator recovery posture and rollout notes: covered by Task 7

### Placeholder scan

- no `TODO`, `TBD`, or empty test steps remain
- every task contains exact paths, commands, and concrete snippets

### Type consistency

- shared labels use `PlatformLifecycleState`
- incidents use `project_operation_incidents`
- overrides use `project_operation_overrides`
- audits use `project_operation_audits`

No unresolved naming conflicts found in the plan.

---

## Execution Notes

- Shared platform-core schema is drafted in `veltrix_platform_core_hardening.sql`.
- Portal helper layer, project-private ops APIs, Community OS ops surfacing, and detail-page lifecycle rails are implemented in the `codex/platform-core-hardening` worktrees.
- Claims and Moderation now expose the same incident/override language for the active project.
- Runtime event helpers and webhook-side incident/audit writes are implemented and typechecked.

## Rollout Checklist

- Run the SQL migration manually in Supabase:
  - `C:\Users\jordi\OneDrive\Documenten\New project\database\migrations\veltrix_platform_core_hardening.sql`
- Redeploy `veltrix-community-bot`
- Wait for the new `admin-portal` deploy
- Verify:
  - `/projects/[id]/community` loads project incidents and overrides
  - campaign, quest, raid, and reward detail pages show lifecycle + operator rails
  - Claims and Moderation show the active project's incident/override rail
  - Discord and Telegram test pushes still succeed and produce audit or incident records

## Verification Notes

- `admin-portal`: `npm run build` passes in the hardening worktree
- `veltrix-community-bot`: `node --import tsx --test src/core/platform/operation-events.test.ts` passes
- `veltrix-community-bot`: `tsc -p tsconfig.json --noEmit` passes
- Full runtime emit build may still hit local `ENOSPC` when writing `dist`; current verification proves type safety but not filesystem headroom
