# Featured Shard Pools Phase 2A Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Phase 2A Featured Shard Pools so projects can attach finite shard boost budgets to featured campaigns, quests, and raids while webapp completions grant auditable base plus boost shards server-side.

**Architecture:** Add `featured_shard_pools` and one SQL RPC that atomically reserves pool budget and inserts shard ledger rows. Keep quest approval and raid confirmation routes intact, but route shard awards through a shared server helper. Portal owns pool management; the webapp only reads pool summaries and spends budget through validated server completion flows.

**Tech Stack:** Supabase Postgres/RLS/RPC, Next.js App Router, React 19, Zustand, TypeScript, Node test runner with `tsx`.

---

## File Structure

Work spans both repos:

- Web/services repo: `D:\VYNTRO\veltrix-services`
- Portal repo: `D:\VYNTRO\crypto-raid-admin-portal`

Create or modify:

- Create: `D:\VYNTRO\veltrix-services\database\migrations\vyntro_featured_shard_pools_phase2a.sql`
  - Adds `featured_shard_pools`, RLS, indexes, and `grant_shards_with_featured_pool`.
- Create: `D:\VYNTRO\veltrix-services\apps\veltrix-web\src\lib\lootboxes\featured-shard-pools.ts`
  - Pure active-pool resolution, deterministic bonus calculation, and display helpers.
- Create: `D:\VYNTRO\veltrix-services\apps\veltrix-web\src\lib\lootboxes\featured-shard-pools.test.ts`
  - Unit coverage for active pool resolution and award math.
- Create: `D:\VYNTRO\veltrix-services\apps\veltrix-web\src\lib\lootboxes\featured-shard-pool-server.ts`
  - Service-client helpers that load pools and call the RPC.
- Modify: `D:\VYNTRO\veltrix-services\apps\veltrix-web\src\lib\lootboxes\shard-server.ts`
  - Extend shard grant response shape if needed.
- Modify: `D:\VYNTRO\veltrix-services\apps\veltrix-web\src\app\api\quests\submissions\[id]\decision\route.ts`
  - Use the pool-aware grant helper for approved submissions.
- Modify: `D:\VYNTRO\veltrix-services\apps\veltrix-web\src\app\api\raids\[id]\confirm\route.ts`
  - Use the pool-aware grant helper for confirmed raids.
- Modify: `D:\VYNTRO\veltrix-services\apps\veltrix-web\src\types\live.ts`
  - Add `LiveFeaturedShardPool` and shard boost fields on live quests/raids where useful.
- Modify: `D:\VYNTRO\veltrix-services\apps\veltrix-web\src\hooks\use-live-user-data.ts`
  - Load active/scheduled pool summaries and expose `featuredShardPools`.
- Modify: `D:\VYNTRO\veltrix-services\apps\veltrix-web\src\components\quests\quests-screen.tsx`
  - Show boost badge, earn range, and remaining meter.
- Modify: `D:\VYNTRO\veltrix-services\apps\veltrix-web\src\components\raids\raid-detail-screen.tsx`
  - Show boost context and total/bonus award in confirmation copy.
- Modify: `D:\VYNTRO\veltrix-services\apps\veltrix-web\src\components\campaigns\campaign-detail-screen.tsx`
  - Show campaign-level boost summary.
- Create: `D:\VYNTRO\crypto-raid-admin-portal\types\entities\featured-shard-pool.ts`
  - Admin-facing pool entity.
- Modify: `D:\VYNTRO\crypto-raid-admin-portal\types\database.ts`
  - Add `DbFeaturedShardPool`.
- Modify: `D:\VYNTRO\crypto-raid-admin-portal\store\ui\useAdminPortalStore.ts`
  - Load/create/update pool rows.
- Create: `D:\VYNTRO\crypto-raid-admin-portal\lib\lootboxes\featured-shard-pool-presets.ts`
  - Portal presets and copy for no boost, base featured, and boost pool.
- Create: `D:\VYNTRO\crypto-raid-admin-portal\lib\lootboxes\featured-shard-pool-presets.test.ts`
  - Preset and payload tests.
- Create: `D:\VYNTRO\crypto-raid-admin-portal\components\forms\campaign\CampaignShardBoostModule.tsx`
  - Compact premium UI for pool selection in campaign creation.
- Modify: `D:\VYNTRO\crypto-raid-admin-portal\app\campaigns\new\page.tsx`
  - Create a campaign-level pool after the campaign is created.
- Modify: `D:\VYNTRO\crypto-raid-admin-portal\app\campaigns\[id]\page.tsx`
  - Show pool status, depletion, and pause/resume controls.

## Task 1: Add Featured Shard Pool Migration And RPC

**Files:**
- Create: `D:\VYNTRO\veltrix-services\database\migrations\vyntro_featured_shard_pools_phase2a.sql`
- Create: `D:\VYNTRO\veltrix-services\apps\veltrix-web\src\lib\lootboxes\featured-shard-pools-migration.test.ts`

- [ ] **Step 1: Write the failing migration contract test**

Create `apps/veltrix-web/src/lib/lootboxes/featured-shard-pools-migration.test.ts`:

```ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const migrationPath = join(
  process.cwd(),
  "database/migrations/vyntro_featured_shard_pools_phase2a.sql"
);

test("featured shard pool migration creates the pool table and atomic grant rpc", () => {
  const source = readFileSync(migrationPath, "utf8");

  assert.match(source, /create table if not exists public\.featured_shard_pools/i);
  assert.match(source, /remaining_shards integer not null/i);
  assert.match(source, /create or replace function public\.grant_shards_with_featured_pool/i);
  assert.match(source, /for update/i);
  assert.match(source, /source_dedupe_key/i);
});
```

- [ ] **Step 2: Run the migration contract test and verify it fails**

Run from `D:\VYNTRO\veltrix-services`:

```powershell
node --import ./scripts/test-env.mjs --import tsx --test apps/veltrix-web/src/lib/lootboxes/featured-shard-pools-migration.test.ts
```

Expected: FAIL because `database/migrations/vyntro_featured_shard_pools_phase2a.sql` does not exist.

- [ ] **Step 3: Create the migration**

Create `database/migrations/vyntro_featured_shard_pools_phase2a.sql`:

```sql
begin;

create table if not exists public.featured_shard_pools (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete cascade,
  quest_id uuid references public.quests(id) on delete cascade,
  raid_id uuid references public.raids(id) on delete cascade,
  label text not null default 'Shard Boost',
  pool_size integer not null,
  remaining_shards integer not null,
  bonus_min integer not null,
  bonus_max integer not null,
  per_user_cap integer,
  starts_at timestamp with time zone,
  ends_at timestamp with time zone,
  status text not null default 'draft',
  created_by_auth_user_id uuid references auth.users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint featured_shard_pools_budget_check check (pool_size >= 0 and remaining_shards >= 0 and remaining_shards <= pool_size),
  constraint featured_shard_pools_bonus_check check (bonus_min > 0 and bonus_max >= bonus_min),
  constraint featured_shard_pools_cap_check check (per_user_cap is null or per_user_cap >= 0),
  constraint featured_shard_pools_status_check check (status in ('draft', 'scheduled', 'active', 'paused', 'ended')),
  constraint featured_shard_pools_target_check check (
    campaign_id is not null or quest_id is not null or raid_id is not null
  )
);

create index if not exists idx_featured_shard_pools_project_status_created
  on public.featured_shard_pools (project_id, status, created_at desc);

create index if not exists idx_featured_shard_pools_campaign_status
  on public.featured_shard_pools (campaign_id, status)
  where campaign_id is not null;

create index if not exists idx_featured_shard_pools_quest_status
  on public.featured_shard_pools (quest_id, status)
  where quest_id is not null;

create index if not exists idx_featured_shard_pools_raid_status
  on public.featured_shard_pools (raid_id, status)
  where raid_id is not null;

create index if not exists idx_featured_shard_pools_ends_at
  on public.featured_shard_pools (ends_at)
  where ends_at is not null;

alter table public.featured_shard_pools enable row level security;

drop policy if exists "featured shard pools select" on public.featured_shard_pools;
create policy "featured shard pools select"
on public.featured_shard_pools
for select
to authenticated
using (
  public.is_super_admin(auth.uid())
  or public.has_project_membership(auth.uid(), project_id)
  or status = 'active'
);

drop policy if exists "featured shard pools mutate" on public.featured_shard_pools;
create policy "featured shard pools mutate"
on public.featured_shard_pools
for all
to authenticated
using (
  public.is_super_admin(auth.uid())
  or public.has_project_role(auth.uid(), project_id, array['owner', 'admin'])
)
with check (
  public.is_super_admin(auth.uid())
  or public.has_project_role(auth.uid(), project_id, array['owner', 'admin'])
);

create or replace function public.grant_shards_with_featured_pool(
  p_auth_user_id uuid,
  p_base_amount integer,
  p_pool_id uuid,
  p_requested_bonus integer,
  p_source_type text,
  p_source_ref text,
  p_action text,
  p_reason text,
  p_metadata jsonb default '{}'::jsonb
)
returns table (
  granted boolean,
  already_granted boolean,
  amount integer,
  base_amount integer,
  bonus_amount integer,
  pool_id uuid,
  remaining_shards integer,
  ledger_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_source_dedupe_key text := p_source_type || ':' || p_source_ref || ':' || p_action;
  v_existing_ledger_id uuid;
  v_pool public.featured_shard_pools%rowtype;
  v_user_pool_bonus integer := 0;
  v_base_amount integer := greatest(coalesce(p_base_amount, 0), 0);
  v_requested_bonus integer := greatest(coalesce(p_requested_bonus, 0), 0);
  v_bonus_amount integer := 0;
  v_total_amount integer := 0;
  v_remaining_shards integer := null;
  v_ledger_id uuid;
begin
  select id
  into v_existing_ledger_id
  from public.shard_ledger
  where auth_user_id = p_auth_user_id
    and source_dedupe_key = v_source_dedupe_key
  limit 1;

  if v_existing_ledger_id is not null then
    return query select false, true, 0, 0, 0, p_pool_id, null::integer, v_existing_ledger_id;
    return;
  end if;

  if p_pool_id is not null and v_requested_bonus > 0 then
    select *
    into v_pool
    from public.featured_shard_pools
    where id = p_pool_id
      and status = 'active'
      and remaining_shards > 0
      and (starts_at is null or starts_at <= now())
      and (ends_at is null or ends_at > now())
    for update;

    if found then
      if v_pool.per_user_cap is not null then
        select coalesce(
          sum(
            case
              when metadata->>'bonusShardAmount' ~ '^[0-9]+$'
                then (metadata->>'bonusShardAmount')::integer
              else 0
            end
          ),
          0
        )
        into v_user_pool_bonus
        from public.shard_ledger
        where auth_user_id = p_auth_user_id
          and metadata->>'featuredShardPoolId' = p_pool_id::text;

        v_requested_bonus := least(v_requested_bonus, greatest(v_pool.per_user_cap - v_user_pool_bonus, 0));
      end if;

      v_bonus_amount := least(v_requested_bonus, v_pool.remaining_shards);

      if v_bonus_amount > 0 then
        update public.featured_shard_pools
        set
          remaining_shards = remaining_shards - v_bonus_amount,
          status = case when remaining_shards - v_bonus_amount <= 0 then 'ended' else status end,
          updated_at = now()
        where id = v_pool.id
        returning remaining_shards into v_remaining_shards;
      else
        v_remaining_shards := v_pool.remaining_shards;
      end if;
    end if;
  end if;

  v_total_amount := v_base_amount + v_bonus_amount;

  if v_total_amount <= 0 then
    return query select false, false, 0, v_base_amount, 0, p_pool_id, v_remaining_shards, null::uuid;
    return;
  end if;

  insert into public.shard_ledger (
    auth_user_id,
    amount,
    source_type,
    source_ref,
    source_dedupe_key,
    reason,
    metadata
  )
  values (
    p_auth_user_id,
    v_total_amount,
    p_source_type,
    p_source_ref,
    v_source_dedupe_key,
    p_reason,
    coalesce(p_metadata, '{}'::jsonb) || jsonb_build_object(
      'featuredShardPoolId', p_pool_id,
      'baseShardAmount', v_base_amount,
      'bonusShardAmount', v_bonus_amount,
      'poolRemainingShards', v_remaining_shards
    )
  )
  returning id into v_ledger_id;

  return query select true, false, v_total_amount, v_base_amount, v_bonus_amount, p_pool_id, v_remaining_shards, v_ledger_id;
exception
  when unique_violation then
    select id
    into v_existing_ledger_id
    from public.shard_ledger
    where auth_user_id = p_auth_user_id
      and source_dedupe_key = v_source_dedupe_key
    limit 1;

    return query select false, true, 0, 0, 0, p_pool_id, null::integer, v_existing_ledger_id;
end;
$$;

commit;
```

- [ ] **Step 4: Run the migration contract test and verify it passes**

Run:

```powershell
node --import ./scripts/test-env.mjs --import tsx --test apps/veltrix-web/src/lib/lootboxes/featured-shard-pools-migration.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit the migration**

Run:

```powershell
git add database/migrations/vyntro_featured_shard_pools_phase2a.sql apps/veltrix-web/src/lib/lootboxes/featured-shard-pools-migration.test.ts
git commit -m "Add featured shard pool schema"
```

## Task 2: Add Pure Featured Shard Pool Helpers

**Files:**
- Create: `D:\VYNTRO\veltrix-services\apps\veltrix-web\src\lib\lootboxes\featured-shard-pools.ts`
- Create: `D:\VYNTRO\veltrix-services\apps\veltrix-web\src\lib\lootboxes\featured-shard-pools.test.ts`

- [ ] **Step 1: Write the failing helper tests**

Create `apps/veltrix-web/src/lib/lootboxes/featured-shard-pools.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateFeaturedShardAward,
  createDeterministicShardBonus,
  resolveBestFeaturedShardPool,
  type FeaturedShardPool,
} from "./featured-shard-pools";

const now = new Date("2026-05-06T12:00:00.000Z");

function pool(overrides: Partial<FeaturedShardPool>): FeaturedShardPool {
  return {
    id: "pool-campaign",
    projectId: "project-1",
    campaignId: "campaign-1",
    questId: null,
    raidId: null,
    label: "Shard Boost",
    poolSize: 10000,
    remainingShards: 5000,
    bonusMin: 25,
    bonusMax: 40,
    perUserCap: null,
    startsAt: "2026-05-01T00:00:00.000Z",
    endsAt: "2026-06-01T00:00:00.000Z",
    status: "active",
    ...overrides,
  };
}

test("resolveBestFeaturedShardPool prefers quest override before campaign pool", () => {
  const campaignPool = pool({ id: "pool-campaign" });
  const questPool = pool({ id: "pool-quest", questId: "quest-1", bonusMin: 80, bonusMax: 120 });

  const selected = resolveBestFeaturedShardPool({
    pools: [campaignPool, questPool],
    campaignId: "campaign-1",
    questId: "quest-1",
    now,
  });

  assert.equal(selected?.id, "pool-quest");
});

test("resolveBestFeaturedShardPool ignores expired paused and depleted pools", () => {
  const selected = resolveBestFeaturedShardPool({
    pools: [
      pool({ id: "expired", endsAt: "2026-05-01T00:00:00.000Z" }),
      pool({ id: "paused", status: "paused" }),
      pool({ id: "depleted", remainingShards: 0 }),
      pool({ id: "active" }),
    ],
    campaignId: "campaign-1",
    now,
  });

  assert.equal(selected?.id, "active");
});

test("calculateFeaturedShardAward clamps bonus to remaining budget", () => {
  const selectedPool = pool({ remainingShards: 12, bonusMin: 25, bonusMax: 40 });
  const award = calculateFeaturedShardAward({
    baseAmount: 75,
    pool: selectedPool,
    authUserId: "user-1",
    sourceRef: "raid-1",
  });

  assert.equal(award.baseAmount, 75);
  assert.equal(award.bonusAmount, 12);
  assert.equal(award.totalAmount, 87);
});

test("createDeterministicShardBonus stays inside the inclusive range", () => {
  const values = Array.from({ length: 20 }, (_, index) =>
    createDeterministicShardBonus({
      min: 25,
      max: 40,
      seed: `user-${index}:pool:quest`,
    })
  );

  assert.ok(values.every((value) => value >= 25 && value <= 40));
  assert.ok(new Set(values).size > 1);
});
```

- [ ] **Step 2: Run helper tests and verify they fail**

Run:

```powershell
node --import ./scripts/test-env.mjs --import tsx --test apps/veltrix-web/src/lib/lootboxes/featured-shard-pools.test.ts
```

Expected: FAIL because `featured-shard-pools.ts` does not exist.

- [ ] **Step 3: Implement the pure helper**

Create `apps/veltrix-web/src/lib/lootboxes/featured-shard-pools.ts`:

```ts
export type FeaturedShardPoolStatus = "draft" | "scheduled" | "active" | "paused" | "ended";

export type FeaturedShardPool = {
  id: string;
  projectId: string;
  campaignId: string | null;
  questId: string | null;
  raidId: string | null;
  label: string;
  poolSize: number;
  remainingShards: number;
  bonusMin: number;
  bonusMax: number;
  perUserCap: number | null;
  startsAt: string | null;
  endsAt: string | null;
  status: FeaturedShardPoolStatus;
};

export type FeaturedShardAward = {
  baseAmount: number;
  bonusAmount: number;
  totalAmount: number;
  pool: FeaturedShardPool | null;
};

export function isFeaturedShardPoolActive(pool: FeaturedShardPool, now = new Date()) {
  if (pool.status !== "active" || pool.remainingShards <= 0) {
    return false;
  }

  const startsAt = pool.startsAt ? new Date(pool.startsAt).getTime() : null;
  const endsAt = pool.endsAt ? new Date(pool.endsAt).getTime() : null;
  const nowMs = now.getTime();

  if (startsAt !== null && Number.isFinite(startsAt) && startsAt > nowMs) {
    return false;
  }

  if (endsAt !== null && Number.isFinite(endsAt) && endsAt <= nowMs) {
    return false;
  }

  return true;
}

export function resolveBestFeaturedShardPool(params: {
  pools: FeaturedShardPool[];
  campaignId?: string | null;
  questId?: string | null;
  raidId?: string | null;
  now?: Date;
}) {
  const activePools = params.pools.filter((pool) =>
    isFeaturedShardPoolActive(pool, params.now ?? new Date())
  );

  const questOverride = params.questId
    ? activePools.find((pool) => pool.questId === params.questId)
    : null;
  if (questOverride) return questOverride;

  const raidOverride = params.raidId
    ? activePools.find((pool) => pool.raidId === params.raidId)
    : null;
  if (raidOverride) return raidOverride;

  if (!params.campaignId) {
    return null;
  }

  return activePools.find((pool) => pool.campaignId === params.campaignId && !pool.questId && !pool.raidId) ?? null;
}

export function createDeterministicShardBonus(params: {
  min: number;
  max: number;
  seed: string;
}) {
  const min = Math.max(0, Math.floor(params.min));
  const max = Math.max(min, Math.floor(params.max));
  if (max <= min) {
    return min;
  }

  let hash = 2166136261;
  for (const character of params.seed) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619) >>> 0;
  }

  return min + (hash % (max - min + 1));
}

export function calculateFeaturedShardAward(params: {
  baseAmount: number;
  pool: FeaturedShardPool | null;
  authUserId: string;
  sourceRef: string;
}) {
  const baseAmount = Math.max(0, Math.floor(params.baseAmount));
  if (!params.pool) {
    return {
      baseAmount,
      bonusAmount: 0,
      totalAmount: baseAmount,
      pool: null,
    } satisfies FeaturedShardAward;
  }

  const requestedBonus = createDeterministicShardBonus({
    min: params.pool.bonusMin,
    max: params.pool.bonusMax,
    seed: `${params.authUserId}:${params.pool.id}:${params.sourceRef}`,
  });
  const bonusAmount = Math.min(requestedBonus, Math.max(0, params.pool.remainingShards));

  return {
    baseAmount,
    bonusAmount,
    totalAmount: baseAmount + bonusAmount,
    pool: params.pool,
  } satisfies FeaturedShardAward;
}
```

- [ ] **Step 4: Run helper tests and verify they pass**

Run:

```powershell
node --import ./scripts/test-env.mjs --import tsx --test apps/veltrix-web/src/lib/lootboxes/featured-shard-pools.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit pure helpers**

Run:

```powershell
git add apps/veltrix-web/src/lib/lootboxes/featured-shard-pools.ts apps/veltrix-web/src/lib/lootboxes/featured-shard-pools.test.ts
git commit -m "Add featured shard pool helpers"
```

## Task 3: Add Server Pool Grant Helper

**Files:**
- Create: `D:\VYNTRO\veltrix-services\apps\veltrix-web\src\lib\lootboxes\featured-shard-pool-server.ts`
- Modify: `D:\VYNTRO\veltrix-services\apps\veltrix-web\src\lib\lootboxes\shard-server.ts`

- [ ] **Step 1: Create the server helper**

Create `apps/veltrix-web/src/lib/lootboxes/featured-shard-pool-server.ts`:

```ts
import { LOOTBOX_EARNING_RULES } from "./lootbox-catalog";
import {
  calculateFeaturedShardAward,
  resolveBestFeaturedShardPool,
  type FeaturedShardPool,
} from "./featured-shard-pools";
import {
  getShardBalance,
  grantShards,
  type ServiceSupabase,
  type ShardGrantResult,
} from "./shard-server";

type PoolRow = {
  id: string;
  project_id: string;
  campaign_id: string | null;
  quest_id: string | null;
  raid_id: string | null;
  label: string | null;
  pool_size: number | null;
  remaining_shards: number | null;
  bonus_min: number | null;
  bonus_max: number | null;
  per_user_cap: number | null;
  starts_at: string | null;
  ends_at: string | null;
  status: string | null;
};

export type FeaturedShardGrantResult = ShardGrantResult & {
  baseAmount: number;
  bonusAmount: number;
  poolId: string | null;
  poolRemainingShards: number | null;
};

export async function grantQuestShardsWithFeaturedPool(params: {
  serviceSupabase: ServiceSupabase;
  authUserId: string;
  questId: string;
  questTitle: string;
  projectId: string | null;
  campaignId: string | null;
  featured: boolean;
  submissionId: string;
}) {
  const baseRange = params.featured
    ? LOOTBOX_EARNING_RULES.featuredQuest.range
    : LOOTBOX_EARNING_RULES.normalQuest.range;
  const sourceType = params.featured ? "featured_quest" : "normal_quest";
  const pool = await resolvePoolForAction({
    serviceSupabase: params.serviceSupabase,
    projectId: params.projectId,
    campaignId: params.campaignId,
    questId: params.questId,
  });

  return grantShardsWithFeaturedPool({
    serviceSupabase: params.serviceSupabase,
    authUserId: params.authUserId,
    sourceType,
    sourceRef: params.questId,
    action: "approved",
    reason: params.featured ? "Featured quest approved" : "Quest approved",
    baseAmount: baseRange[0],
    pool,
    metadata: {
      questId: params.questId,
      questTitle: params.questTitle,
      submissionId: params.submissionId,
      projectId: params.projectId,
      campaignId: params.campaignId,
    },
  });
}

export async function grantRaidShardsWithFeaturedPool(params: {
  serviceSupabase: ServiceSupabase;
  authUserId: string;
  raidId: string;
  raidTitle: string;
  projectId: string | null;
  campaignId: string | null;
  featured: boolean;
  community: string | null;
  timer: string | null;
}) {
  const baseRange = params.featured
    ? LOOTBOX_EARNING_RULES.featuredRaid.range
    : LOOTBOX_EARNING_RULES.normalRaid.range;
  const sourceType = params.featured ? "featured_raid" : "normal_raid";
  const pool = await resolvePoolForAction({
    serviceSupabase: params.serviceSupabase,
    projectId: params.projectId,
    campaignId: params.campaignId,
    raidId: params.raidId,
  });

  return grantShardsWithFeaturedPool({
    serviceSupabase: params.serviceSupabase,
    authUserId: params.authUserId,
    sourceType,
    sourceRef: params.raidId,
    action: "confirmed",
    reason: params.featured ? "Featured raid confirmed" : "Raid confirmed",
    baseAmount: baseRange[0],
    pool,
    metadata: {
      raidId: params.raidId,
      raidTitle: params.raidTitle,
      projectId: params.projectId,
      campaignId: params.campaignId,
      community: params.community,
      timer: params.timer,
    },
  });
}

async function resolvePoolForAction(params: {
  serviceSupabase: ServiceSupabase;
  projectId: string | null;
  campaignId: string | null;
  questId?: string | null;
  raidId?: string | null;
}) {
  if (!params.projectId) {
    return null;
  }

  const { data, error } = await params.serviceSupabase
    .from("featured_shard_pools")
    .select(
      "id, project_id, campaign_id, quest_id, raid_id, label, pool_size, remaining_shards, bonus_min, bonus_max, per_user_cap, starts_at, ends_at, status"
    )
    .eq("project_id", params.projectId)
    .eq("status", "active")
    .gt("remaining_shards", 0);

  if (error) {
    return null;
  }

  return resolveBestFeaturedShardPool({
    pools: (data ?? []).map(mapPoolRow),
    campaignId: params.campaignId,
    questId: params.questId,
    raidId: params.raidId,
  });
}

async function grantShardsWithFeaturedPool(params: {
  serviceSupabase: ServiceSupabase;
  authUserId: string;
  sourceType: string;
  sourceRef: string;
  action: string;
  reason: string;
  baseAmount: number;
  pool: FeaturedShardPool | null;
  metadata: Record<string, unknown>;
}): Promise<FeaturedShardGrantResult> {
  const award = calculateFeaturedShardAward({
    baseAmount: params.baseAmount,
    pool: params.pool,
    authUserId: params.authUserId,
    sourceRef: params.sourceRef,
  });

  const { data, error } = await params.serviceSupabase.rpc("grant_shards_with_featured_pool", {
    p_auth_user_id: params.authUserId,
    p_base_amount: award.baseAmount,
    p_pool_id: award.pool?.id ?? null,
    p_requested_bonus: award.bonusAmount,
    p_source_type: params.sourceType,
    p_source_ref: params.sourceRef,
    p_action: params.action,
    p_reason: params.reason,
    p_metadata: {
      ...params.metadata,
      featuredShardPoolId: award.pool?.id ?? null,
      baseShardAmount: award.baseAmount,
      requestedBonusShardAmount: award.bonusAmount,
    },
  });

  if (error) {
    const fallback = await grantShards({
      serviceSupabase: params.serviceSupabase,
      authUserId: params.authUserId,
      amount: award.baseAmount,
      sourceType: params.sourceType,
      sourceRef: params.sourceRef,
      action: params.action,
      reason: params.reason,
      metadata: params.metadata,
    });

    return {
      ...fallback,
      baseAmount: fallback.granted ? award.baseAmount : 0,
      bonusAmount: 0,
      poolId: null,
      poolRemainingShards: null,
    };
  }

  const row = Array.isArray(data) ? data[0] : data;
  const amount = Number(row?.amount ?? 0);
  const balance = await getShardBalance({
    serviceSupabase: params.serviceSupabase,
    authUserId: params.authUserId,
  });

  return {
    granted: Boolean(row?.granted),
    alreadyGranted: Boolean(row?.already_granted),
    amount,
    balance,
    ledgerId: typeof row?.ledger_id === "string" ? row.ledger_id : null,
    baseAmount: Number(row?.base_amount ?? 0),
    bonusAmount: Number(row?.bonus_amount ?? 0),
    poolId: typeof row?.pool_id === "string" ? row.pool_id : null,
    poolRemainingShards:
      typeof row?.remaining_shards === "number" ? Number(row.remaining_shards) : null,
  };
}

function mapPoolRow(row: PoolRow): FeaturedShardPool {
  return {
    id: row.id,
    projectId: row.project_id,
    campaignId: row.campaign_id,
    questId: row.quest_id,
    raidId: row.raid_id,
    label: row.label ?? "Shard Boost",
    poolSize: Number(row.pool_size ?? 0),
    remainingShards: Number(row.remaining_shards ?? 0),
    bonusMin: Number(row.bonus_min ?? 0),
    bonusMax: Number(row.bonus_max ?? 0),
    perUserCap: row.per_user_cap === null ? null : Number(row.per_user_cap),
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    status:
      row.status === "draft" ||
      row.status === "scheduled" ||
      row.status === "active" ||
      row.status === "paused" ||
      row.status === "ended"
        ? row.status
        : "draft",
  };
}
```

- [ ] **Step 2: Typecheck the helper**

Run:

```powershell
npm.cmd run typecheck --workspace vyntro-web
```

Expected: PASS.

- [ ] **Step 3: Commit server helper**

Run:

```powershell
git add apps/veltrix-web/src/lib/lootboxes/featured-shard-pool-server.ts
git commit -m "Add featured shard pool server grants"
```

## Task 4: Wire Quest And Raid Shard Grants

**Files:**
- Modify: `D:\VYNTRO\veltrix-services\apps\veltrix-web\src\app\api\quests\submissions\[id]\decision\route.ts`
- Modify: `D:\VYNTRO\veltrix-services\apps\veltrix-web\src\app\api\raids\[id]\confirm\route.ts`

- [ ] **Step 1: Replace quest route shard imports**

In `apps/veltrix-web/src/app/api/quests/submissions/[id]/decision/route.ts`, replace:

```ts
import { LOOTBOX_EARNING_RULES } from "@/lib/lootboxes/lootbox-catalog";
import { grantShards } from "@/lib/lootboxes/shard-server";
```

with:

```ts
import { grantQuestShardsWithFeaturedPool } from "@/lib/lootboxes/featured-shard-pool-server";
```

- [ ] **Step 2: Replace the quest shard award block**

Replace the block that calculates `shardRange` and calls `grantShards` with:

```ts
    const shardAward =
      decisionPlan.decision === "approved"
        ? await grantQuestShardsWithFeaturedPool({
            serviceSupabase,
            authUserId: submission.auth_user_id,
            questId: String(quest.id),
            questTitle: safeString(quest.title) || "Quest",
            projectId: safeString(quest.project_id) || null,
            campaignId: safeString(quest.campaign_id) || null,
            featured: featuredQuest,
            submissionId: submission.id,
          })
        : null;
```

- [ ] **Step 3: Replace raid route imports**

In `apps/veltrix-web/src/app/api/raids/[id]/confirm/route.ts`, replace:

```ts
import { LOOTBOX_EARNING_RULES } from "@/lib/lootboxes/lootbox-catalog";
import { grantShards } from "@/lib/lootboxes/shard-server";
```

with:

```ts
import { grantRaidShardsWithFeaturedPool } from "@/lib/lootboxes/featured-shard-pool-server";
```

- [ ] **Step 4: Replace the raid shard award block**

Replace the block that calculates `range` and calls `grantShards` with:

```ts
    const shardAward = await grantRaidShardsWithFeaturedPool({
      serviceSupabase,
      authUserId: user.id,
      raidId,
      raidTitle: typeof raid.title === "string" ? raid.title : "Raid",
      projectId: typeof raid.project_id === "string" ? raid.project_id : null,
      campaignId: typeof raid.campaign_id === "string" ? raid.campaign_id : null,
      featured: featuredRaid,
      community: typeof raid.community === "string" ? raid.community : null,
      timer: typeof raid.timer === "string" ? raid.timer : null,
    });
```

- [ ] **Step 5: Run focused tests and typecheck**

Run:

```powershell
node --import ./scripts/test-env.mjs --import tsx --test apps/veltrix-web/src/lib/lootboxes/featured-shard-pools.test.ts apps/veltrix-web/src/lib/lootboxes/featured-shard-pools-migration.test.ts
npm.cmd run typecheck --workspace vyntro-web
```

Expected: both commands PASS.

- [ ] **Step 6: Commit route wiring**

Run:

```powershell
git add apps/veltrix-web/src/app/api/quests/submissions/[id]/decision/route.ts apps/veltrix-web/src/app/api/raids/[id]/confirm/route.ts
git commit -m "Wire featured shard pools into completions"
```

## Task 5: Expose Pool Summaries In Webapp Live Data

**Files:**
- Modify: `D:\VYNTRO\veltrix-services\apps\veltrix-web\src\types\live.ts`
- Modify: `D:\VYNTRO\veltrix-services\apps\veltrix-web\src\hooks\use-live-user-data.ts`

- [ ] **Step 1: Add live pool type**

Add this to `apps/veltrix-web/src/types/live.ts`:

```ts
export type LiveFeaturedShardPool = {
  id: string;
  projectId: string;
  campaignId: string | null;
  questId: string | null;
  raidId: string | null;
  label: string;
  poolSize: number;
  remainingShards: number;
  bonusMin: number;
  bonusMax: number;
  startsAt: string | null;
  endsAt: string | null;
  status: string;
};
```

- [ ] **Step 2: Add dataset and state to `use-live-user-data.ts`**

Import `LiveFeaturedShardPool`, add `"featuredShardPools"` to `LiveUserDataDataset`, add `featuredShardPools: LiveFeaturedShardPool[]` to `LiveUserDataCacheEntry`, initialize it to `[]`, add a setter, and return it from the hook.

- [ ] **Step 3: Add the Supabase query**

Inside `reload`, add:

```ts
    const shouldLoadFeaturedShardPools = requestedDatasetSet.has("featuredShardPools");
```

Add a Promise entry:

```ts
      shouldLoadFeaturedShardPools
        ? supabase
            .from("featured_shard_pools")
            .select("*")
            .in("status", ["active", "scheduled"])
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [], error: null }),
```

Map rows:

```ts
    const nextFeaturedShardPools = (featuredShardPoolsResult.data ?? []).map((row) => ({
      id: row.id,
      projectId: row.project_id,
      campaignId: row.campaign_id ?? null,
      questId: row.quest_id ?? null,
      raidId: row.raid_id ?? null,
      label: row.label ?? "Shard Boost",
      poolSize: row.pool_size ?? 0,
      remainingShards: row.remaining_shards ?? 0,
      bonusMin: row.bonus_min ?? 0,
      bonusMax: row.bonus_max ?? 0,
      startsAt: row.starts_at ?? null,
      endsAt: row.ends_at ?? null,
      status: row.status ?? "draft",
    }));
```

- [ ] **Step 4: Run typecheck**

Run:

```powershell
npm.cmd run typecheck --workspace vyntro-web
```

Expected: PASS.

- [ ] **Step 5: Commit live data**

Run:

```powershell
git add apps/veltrix-web/src/types/live.ts apps/veltrix-web/src/hooks/use-live-user-data.ts
git commit -m "Expose featured shard pools in live data"
```

## Task 6: Add Webapp Boost Surfaces

**Files:**
- Modify: `D:\VYNTRO\veltrix-services\apps\veltrix-web\src\components\quests\quests-screen.tsx`
- Modify: `D:\VYNTRO\veltrix-services\apps\veltrix-web\src\components\raids\raid-detail-screen.tsx`
- Modify: `D:\VYNTRO\veltrix-services\apps\veltrix-web\src\components\campaigns\campaign-detail-screen.tsx`

- [ ] **Step 1: Add pool lookup to quest board**

In `quests-screen.tsx`, request the dataset:

```ts
const { loading, error, quests, campaigns, projects, rewards, featuredShardPools } = useLiveUserData({
  datasets: ["quests", "campaigns", "projects", "rewards", "featuredShardPools"],
});
```

When enriching a quest, find the matching active pool:

```ts
const shardPool =
  featuredShardPools.find((pool) => pool.questId === quest.id && pool.status === "active") ??
  featuredShardPools.find(
    (pool) =>
      pool.campaignId === quest.campaignId &&
      !pool.questId &&
      !pool.raidId &&
      pool.status === "active"
  ) ??
  null;
```

Add `shardPool` to the returned quest.

- [ ] **Step 2: Render boost pill and meter on quest cards**

Inside spotlight and grid card metric rows, add:

```tsx
{quest.shardPool ? (
  <ShardBoostPill
    bonusMin={quest.shardPool.bonusMin}
    bonusMax={quest.shardPool.bonusMax}
    poolSize={quest.shardPool.poolSize}
    remainingShards={quest.shardPool.remainingShards}
  />
) : null}
```

Add local component at the bottom of the file:

```tsx
function ShardBoostPill({
  bonusMin,
  bonusMax,
  poolSize,
  remainingShards,
}: {
  bonusMin: number;
  bonusMax: number;
  poolSize: number;
  remainingShards: number;
}) {
  const percent = poolSize > 0 ? Math.max(0, Math.min(100, Math.round((remainingShards / poolSize) * 100))) : 0;

  return (
    <span className="inline-flex min-w-[132px] flex-col gap-1 rounded-[12px] border border-emerald-300/18 bg-emerald-300/[0.07] px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-emerald-200">
      <span>Shard Boost +{bonusMin}-{bonusMax}</span>
      <span className="h-1 overflow-hidden rounded-full bg-black/40">
        <span className="block h-full rounded-full bg-emerald-300" style={{ width: `${percent}%` }} />
      </span>
    </span>
  );
}
```

- [ ] **Step 3: Add boost context to raid detail**

In `raid-detail-screen.tsx`, include `featuredShardPools` in the hook datasets and compute:

```ts
const activeShardPool =
  featuredShardPools.find((pool) => pool.raidId === currentRaid.id && pool.status === "active") ??
  featuredShardPools.find(
    (pool) =>
      pool.campaignId === currentRaid.campaignId &&
      !pool.questId &&
      !pool.raidId &&
      pool.status === "active"
  ) ??
  null;
```

Show a compact panel above the confirm button:

```tsx
{activeShardPool ? (
  <div className="metric-card rounded-[16px] border-emerald-300/15 bg-emerald-300/[0.06] p-3 text-[11px] leading-5 text-emerald-100">
    Shard Boost Live: +{activeShardPool.bonusMin}-{activeShardPool.bonusMax} bonus shards while the pool has {activeShardPool.remainingShards.toLocaleString("en-US")} shards left.
  </div>
) : null}
```

Update success copy:

```ts
const successText = shardAward?.granted
  ? shardAward.bonusAmount > 0
    ? `Your raid has been confirmed. +${shardAward.amount} shards added, including +${shardAward.bonusAmount} boost shards.`
    : `Your raid has been confirmed. +${shardAward.amount} shards added.`
  : "Your raid has been confirmed.";
```

- [ ] **Step 4: Add campaign detail boost summary**

In `campaign-detail-screen.tsx`, request `featuredShardPools`, find the campaign-level pool, and render a small `Surface`:

```tsx
{campaignShardPool ? (
  <Surface
    eyebrow="Shard Boost"
    title="Boost pool live"
    description={`Users can earn +${campaignShardPool.bonusMin}-${campaignShardPool.bonusMax} bonus shards while this pool has budget.`}
  >
    <div className="grid gap-2 sm:grid-cols-3">
      <MiniStat label="Remaining" value={campaignShardPool.remainingShards.toLocaleString("en-US")} />
      <MiniStat label="Pool" value={campaignShardPool.poolSize.toLocaleString("en-US")} />
      <MiniStat label="Status" value={campaignShardPool.status} />
    </div>
  </Surface>
) : null}
```

- [ ] **Step 5: Verify web UI typecheck/build**

Run:

```powershell
npm.cmd run typecheck --workspace vyntro-web
npm.cmd run build --workspace vyntro-web
```

Expected: both PASS.

- [ ] **Step 6: Commit webapp surfaces**

Run:

```powershell
git add apps/veltrix-web/src/components/quests/quests-screen.tsx apps/veltrix-web/src/components/raids/raid-detail-screen.tsx apps/veltrix-web/src/components/campaigns/campaign-detail-screen.tsx
git commit -m "Show featured shard boosts in webapp"
```

## Task 7: Add Portal Types, Store, And Presets

**Files:**
- Create: `D:\VYNTRO\crypto-raid-admin-portal\types\entities\featured-shard-pool.ts`
- Modify: `D:\VYNTRO\crypto-raid-admin-portal\types\database.ts`
- Modify: `D:\VYNTRO\crypto-raid-admin-portal\store\ui\useAdminPortalStore.ts`
- Create: `D:\VYNTRO\crypto-raid-admin-portal\lib\lootboxes\featured-shard-pool-presets.ts`
- Create: `D:\VYNTRO\crypto-raid-admin-portal\lib\lootboxes\featured-shard-pool-presets.test.ts`

- [ ] **Step 1: Write preset test**

Create `lib/lootboxes/featured-shard-pool-presets.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import {
  FEATURED_SHARD_POOL_PRESETS,
  buildFeaturedShardPoolDraft,
} from "./featured-shard-pool-presets";

test("featured shard pool presets include no boost base and boost package", () => {
  assert.deepEqual(
    FEATURED_SHARD_POOL_PRESETS.map((preset) => preset.id),
    ["none", "base_featured", "boost"]
  );
});

test("buildFeaturedShardPoolDraft creates the boost payload", () => {
  const draft = buildFeaturedShardPoolDraft({
    presetId: "boost",
    projectId: "project-1",
    campaignId: "campaign-1",
    createdByAuthUserId: "user-1",
    startsAt: "2026-05-06T00:00:00.000Z",
    endsAt: "2026-05-13T00:00:00.000Z",
  });

  assert.equal(draft?.poolSize, 25000);
  assert.equal(draft?.remainingShards, 25000);
  assert.equal(draft?.bonusMin, 40);
  assert.equal(draft?.bonusMax, 70);
  assert.equal(draft?.status, "active");
});
```

- [ ] **Step 2: Run preset test and verify it fails**

Run from `D:\VYNTRO\crypto-raid-admin-portal`:

```powershell
node --import tsx --test lib/lootboxes/featured-shard-pool-presets.test.ts
```

Expected: FAIL because the preset file does not exist.

- [ ] **Step 3: Add portal entity type**

Create `types/entities/featured-shard-pool.ts`:

```ts
export type AdminFeaturedShardPool = {
  id: string;
  projectId: string;
  campaignId: string | null;
  questId: string | null;
  raidId: string | null;
  label: string;
  poolSize: number;
  remainingShards: number;
  bonusMin: number;
  bonusMax: number;
  perUserCap?: number | null;
  startsAt?: string | null;
  endsAt?: string | null;
  status: "draft" | "scheduled" | "active" | "paused" | "ended";
  createdByAuthUserId?: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};
```

- [ ] **Step 4: Add preset library**

Create `lib/lootboxes/featured-shard-pool-presets.ts`:

```ts
import type { AdminFeaturedShardPool } from "@/types/entities/featured-shard-pool";

export type FeaturedShardPoolPresetId = "none" | "base_featured" | "boost";

export const FEATURED_SHARD_POOL_PRESETS: Array<{
  id: FeaturedShardPoolPresetId;
  label: string;
  description: string;
  poolSize: number;
  bonusMin: number;
  bonusMax: number;
}> = [
  {
    id: "none",
    label: "No boost",
    description: "Launch without extra shard urgency.",
    poolSize: 0,
    bonusMin: 0,
    bonusMax: 0,
  },
  {
    id: "base_featured",
    label: "Base Featured Pool",
    description: "10,000 shards with +25 to +40 boost per verified action.",
    poolSize: 10000,
    bonusMin: 25,
    bonusMax: 40,
  },
  {
    id: "boost",
    label: "Boost Pool",
    description: "25,000 shards with +40 to +70 boost per verified action.",
    poolSize: 25000,
    bonusMin: 40,
    bonusMax: 70,
  },
];

export function buildFeaturedShardPoolDraft(params: {
  presetId: FeaturedShardPoolPresetId;
  projectId: string;
  campaignId: string;
  createdByAuthUserId: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
}): Omit<AdminFeaturedShardPool, "id" | "createdAt" | "updatedAt"> | null {
  const preset = FEATURED_SHARD_POOL_PRESETS.find((item) => item.id === params.presetId);
  if (!preset || preset.id === "none") {
    return null;
  }

  return {
    projectId: params.projectId,
    campaignId: params.campaignId,
    questId: null,
    raidId: null,
    label: preset.label,
    poolSize: preset.poolSize,
    remainingShards: preset.poolSize,
    bonusMin: preset.bonusMin,
    bonusMax: preset.bonusMax,
    perUserCap: null,
    startsAt: params.startsAt || null,
    endsAt: params.endsAt || null,
    status: "active",
    createdByAuthUserId: params.createdByAuthUserId,
    metadata: {
      presetId: preset.id,
      source: "campaign_studio",
    },
  };
}
```

- [ ] **Step 5: Add database type**

In `types/database.ts`, add:

```ts
export type DbFeaturedShardPool = {
  id: string;
  project_id: string;
  campaign_id: string | null;
  quest_id: string | null;
  raid_id: string | null;
  label: string | null;
  pool_size: number | null;
  remaining_shards: number | null;
  bonus_min: number | null;
  bonus_max: number | null;
  per_user_cap: number | null;
  starts_at: string | null;
  ends_at: string | null;
  status: string | null;
  created_by_auth_user_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};
```

- [ ] **Step 6: Extend portal store**

In `useAdminPortalStore.ts`, import the new types, add `featuredShardPools: AdminFeaturedShardPool[]`, and add methods:

```ts
createFeaturedShardPool: (
  input: Omit<AdminFeaturedShardPool, "id" | "createdAt" | "updatedAt">
) => Promise<string>;
updateFeaturedShardPoolStatus: (
  id: string,
  status: AdminFeaturedShardPool["status"]
) => Promise<void>;
```

Add `mapFeaturedShardPool(row: DbFeaturedShardPool): AdminFeaturedShardPool`, load rows in `loadAll`, and implement create/status update with direct Supabase insert/update matching existing store patterns.

- [ ] **Step 7: Run preset test and portal build**

Run:

```powershell
node --import tsx --test lib/lootboxes/featured-shard-pool-presets.test.ts
npm.cmd run build
```

Expected: both PASS. Existing warnings are acceptable if build exits 0.

- [ ] **Step 8: Commit portal data layer**

Run:

```powershell
git add types/entities/featured-shard-pool.ts types/database.ts store/ui/useAdminPortalStore.ts lib/lootboxes/featured-shard-pool-presets.ts lib/lootboxes/featured-shard-pool-presets.test.ts
git commit -m "Add featured shard pool portal data layer"
```

## Task 8: Add Portal Campaign Shard Boost UI

**Files:**
- Create: `D:\VYNTRO\crypto-raid-admin-portal\components\forms\campaign\CampaignShardBoostModule.tsx`
- Modify: `D:\VYNTRO\crypto-raid-admin-portal\app\campaigns\new\page.tsx`
- Modify: `D:\VYNTRO\crypto-raid-admin-portal\app\campaigns\[id]\page.tsx`

- [ ] **Step 1: Create the campaign boost module**

Create `components/forms/campaign/CampaignShardBoostModule.tsx`:

```tsx
"use client";

import { Gem, RadioTower } from "lucide-react";
import {
  FEATURED_SHARD_POOL_PRESETS,
  type FeaturedShardPoolPresetId,
} from "@/lib/lootboxes/featured-shard-pool-presets";

type Props = {
  value: FeaturedShardPoolPresetId;
  onChange: (value: FeaturedShardPoolPresetId) => void;
};

export default function CampaignShardBoostModule({ value, onChange }: Props) {
  return (
    <section className="relative overflow-hidden rounded-[20px] border border-white/[0.035] bg-[radial-gradient(circle_at_0%_0%,rgba(199,255,0,0.09),transparent_32%),linear-gradient(180deg,rgba(13,16,22,0.99),rgba(7,9,13,0.97))] p-3.5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.18em] text-primary">
            <RadioTower size={13} />
            Shard Boost
          </p>
          <h3 className="mt-2 text-[1.02rem] font-semibold tracking-[-0.03em] text-text">
            Add hunt pressure to this campaign
          </h3>
          <p className="mt-1.5 max-w-2xl text-[12px] leading-5 text-sub">
            Boost pools only deplete when verified members complete valid featured actions.
          </p>
        </div>
        <span className="rounded-full border border-primary/[0.18] bg-primary/[0.07] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-primary">
          Optional
        </span>
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-3">
        {FEATURED_SHARD_POOL_PRESETS.map((preset) => {
          const active = value === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onChange(preset.id)}
              className={`rounded-[16px] border p-3 text-left transition ${
                active
                  ? "border-primary/45 bg-primary/[0.1] shadow-[0_0_30px_rgba(199,255,0,0.12)]"
                  : "border-white/[0.035] bg-white/[0.025] hover:border-white/[0.08]"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-[12px] font-semibold text-text">{preset.label}</p>
                <Gem size={14} className={active ? "text-primary" : "text-sub"} />
              </div>
              <p className="mt-2 min-h-[40px] text-[11px] leading-5 text-sub">{preset.description}</p>
              {preset.id !== "none" ? (
                <p className="mt-2 text-[9px] font-black uppercase tracking-[0.14em] text-primary">
                  {preset.poolSize.toLocaleString("en-US")} shards / +{preset.bonusMin}-{preset.bonusMax}
                </p>
              ) : (
                <p className="mt-2 text-[9px] font-black uppercase tracking-[0.14em] text-sub">
                  Standard campaign
                </p>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Wire campaign creation**

In `app/campaigns/new/page.tsx`, import:

```ts
import CampaignShardBoostModule from "@/components/forms/campaign/CampaignShardBoostModule";
import {
  buildFeaturedShardPoolDraft,
  type FeaturedShardPoolPresetId,
} from "@/lib/lootboxes/featured-shard-pool-presets";
```

Add state:

```ts
const [shardBoostPreset, setShardBoostPreset] = useState<FeaturedShardPoolPresetId>("base_featured");
const authUserId = useAdminAuthStore((s) => s.authUserId);
const createFeaturedShardPool = useAdminPortalStore((s) => s.createFeaturedShardPool);
```

Render `<CampaignShardBoostModule value={shardBoostPreset} onChange={setShardBoostPreset} />` near the launch/readiness section before `CampaignForm`.

After `const campaignId = await createCampaign(values);`, add:

```ts
const shardPoolDraft = buildFeaturedShardPoolDraft({
  presetId: shardBoostPreset,
  projectId: values.projectId,
  campaignId,
  createdByAuthUserId: authUserId,
  startsAt: values.startsAt || null,
  endsAt: values.endsAt || null,
});

if (shardPoolDraft) {
  await createFeaturedShardPool(shardPoolDraft);
}
```

- [ ] **Step 3: Add campaign detail pool status**

In `app/campaigns/[id]/page.tsx`, read `featuredShardPools`, find pools for `campaignId`, and render a compact module with status, remaining, issued, and pause/resume buttons that call `updateFeaturedShardPoolStatus`.

Use this status button copy:

```tsx
{pool.status === "active" ? "Pause boost" : "Resume boost"}
```

Switch target status:

```ts
await updateFeaturedShardPoolStatus(pool.id, pool.status === "active" ? "paused" : "active");
```

- [ ] **Step 4: Verify portal build**

Run:

```powershell
npm.cmd run build
```

Expected: PASS with exit 0. Existing warnings are acceptable.

- [ ] **Step 5: Commit portal UI**

Run:

```powershell
git add components/forms/campaign/CampaignShardBoostModule.tsx app/campaigns/new/page.tsx app/campaigns/[id]/page.tsx
git commit -m "Add campaign shard boost controls"
```

## Task 9: Final Verification, SQL Handoff, Push

**Files:**
- No new files unless verification reveals a targeted fix.

- [ ] **Step 1: Run full webapp checks**

Run from `D:\VYNTRO\veltrix-services`:

```powershell
node --import ./scripts/test-env.mjs --import tsx --test apps/veltrix-web/src/lib/lootboxes/featured-shard-pools.test.ts apps/veltrix-web/src/lib/lootboxes/featured-shard-pools-migration.test.ts apps/veltrix-web/src/lib/lootboxes/lootbox-catalog.test.ts apps/veltrix-web/src/lib/lootboxes/lootbox-engine.test.ts
npm.cmd run typecheck --workspace vyntro-web
npm.cmd run build --workspace vyntro-web
```

Expected: all commands PASS.

- [ ] **Step 2: Run portal checks**

Run from `D:\VYNTRO\crypto-raid-admin-portal`:

```powershell
node --import tsx --test lib/lootboxes/featured-shard-pool-presets.test.ts
npm.cmd run build
```

Expected: all commands PASS with exit 0.

- [ ] **Step 3: Confirm git state**

Run in both repos:

```powershell
git status --short
git log --oneline -8
```

Expected: no uncommitted changes. Logs show Phase 2A commits.

- [ ] **Step 4: Ask user to run SQL**

Tell the user to run:

```text
D:\VYNTRO\veltrix-services\database\migrations\vyntro_featured_shard_pools_phase2a.sql
```

Expected: user confirms the SQL ran successfully in Supabase.

- [ ] **Step 5: Push after SQL confirmation**

Run:

```powershell
git -C D:\VYNTRO\veltrix-services push origin master
git -C D:\VYNTRO\crypto-raid-admin-portal push origin main
```

Expected: both push successfully.

- [ ] **Step 6: Production smoke after Vercel deploy**

Run:

```powershell
(Invoke-WebRequest -Uri https://veltrix-web.vercel.app/lootboxes -UseBasicParsing).StatusCode
(Invoke-WebRequest -Uri https://veltrix-web.vercel.app/quests -UseBasicParsing).StatusCode
(Invoke-WebRequest -Uri https://veltrix-web.vercel.app/raids -UseBasicParsing).StatusCode
(Invoke-WebRequest -Uri https://crypto-raid-admin-portal.vercel.app/campaigns/new -UseBasicParsing).StatusCode
```

Expected: all return `200`.
