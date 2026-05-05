# Shard Lootbox Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first working shard currency and lootbox loop: users earn platform-wide shards from validated activity, spend shards on Common/Rare lootboxes, and receive audited inventory outcomes.

**Architecture:** Keep all economy decisions server-side. The webapp owns the member-facing shard balance, shop, and reveal flow; the database owns ledger/open/inventory truth; shared lootbox catalog code owns prices, odds, assets, and eligibility. Portal management remains datamodel-ready, but Phase 1 does not build Lootbox Studio controls.

**Tech Stack:** Next.js 16 App Router, React 19, Supabase Postgres, Supabase JS, Node test runner, TypeScript.

---

## File Structure

Create and modify these files in `D:\VYNTRO\veltrix-services` unless a path explicitly points to the portal repo.
Run all implementation commands from `D:\VYNTRO\veltrix-services` unless a step explicitly says to use `D:\VYNTRO\crypto-raid-admin-portal`.

- Create: `database/migrations/vyntro_shard_lootbox_phase1.sql`
  - Adds ledger, lootbox tier, pool item, open, and inventory tables.
  - Seeds all five tiers and the default VYNTRO Phase 1 pool.
- Create: `apps/veltrix-web/src/lib/lootboxes/lootbox-catalog.ts`
  - Static tier economy, odds, asset paths, earning bands, caps, and eligibility rules.
- Create: `apps/veltrix-web/src/lib/lootboxes/lootbox-catalog.test.ts`
  - Verifies prices, odds totals, requirements, and shard earning ranges.
- Create: `apps/veltrix-web/src/lib/lootboxes/lootbox-engine.ts`
  - Pure functions for balances, source keys, item selection, and eligibility.
- Create: `apps/veltrix-web/src/lib/lootboxes/lootbox-engine.test.ts`
  - Verifies deterministic pick behavior, no empty outcomes, balance math, and lock states.
- Create: `apps/veltrix-web/src/lib/lootboxes/shard-server.ts`
  - Server helpers for reading balance, writing shard ledger entries, loading eligible tiers, opening boxes, and granting inventory.
- Create: `apps/veltrix-web/src/app/api/lootboxes/route.ts`
  - GET endpoint for shop state, shard balance, tier catalog, and inventory.
- Create: `apps/veltrix-web/src/app/api/lootboxes/open/route.ts`
  - POST endpoint that spends shards, resolves the outcome, writes open/inventory rows, and returns the reveal payload.
- Create: `apps/veltrix-web/src/app/api/raids/[id]/confirm/route.ts`
  - Server route replacing direct raid completion writes so shard grants are validated and idempotent.
- Modify: `apps/veltrix-web/src/app/api/quests/submissions/[id]/decision/route.ts`
  - Grant shards on approved quest submissions after existing XP/progress writes succeed.
- Modify: `apps/veltrix-web/src/components/raids/raid-detail-screen.tsx`
  - Call the new raid confirm endpoint and display shard award copy.
- Modify: `apps/veltrix-web/src/hooks/use-live-user-data.ts`
  - Add lootbox datasets, shard balance, inventory, and `openLootbox`.
- Create: `apps/veltrix-web/src/components/ui/shard-badge.tsx`
  - Shared shard display using the shard asset.
- Create: `apps/veltrix-web/src/components/lootboxes/lootbox-card.tsx`
  - Tier card with price, lock state, odds summary, and box asset.
- Create: `apps/veltrix-web/src/components/lootboxes/lootbox-shop-screen.tsx`
  - Main shop and reveal flow.
- Create: `apps/veltrix-web/src/app/lootboxes/page.tsx`
  - Member route for the lootbox shop.
- Modify: `apps/veltrix-web/src/components/rewards/rewards-screen.tsx`
  - Add a compact link to the lootbox shop and current shard balance.
- Copy assets into:
  - `apps/veltrix-web/public/assets/lootboxes/common-lootbox.webp`
  - `apps/veltrix-web/public/assets/lootboxes/rare-lootbox.webp`
  - `apps/veltrix-web/public/assets/lootboxes/epic-lootbox.webp`
  - `apps/veltrix-web/public/assets/lootboxes/legendary-lootbox.webp`
  - `apps/veltrix-web/public/assets/lootboxes/mythic-lootbox.webp`
  - `apps/veltrix-web/public/assets/lootboxes/shard.webp`

## Implementation Tasks

### Task 1: Add Lootbox Assets And Catalog

**Files:**
- Create: `apps/veltrix-web/public/assets/lootboxes/common-lootbox.webp`
- Create: `apps/veltrix-web/public/assets/lootboxes/rare-lootbox.webp`
- Create: `apps/veltrix-web/public/assets/lootboxes/epic-lootbox.webp`
- Create: `apps/veltrix-web/public/assets/lootboxes/legendary-lootbox.webp`
- Create: `apps/veltrix-web/public/assets/lootboxes/mythic-lootbox.webp`
- Create: `apps/veltrix-web/public/assets/lootboxes/shard.webp`
- Create: `apps/veltrix-web/src/lib/lootboxes/lootbox-catalog.ts`
- Create: `apps/veltrix-web/src/lib/lootboxes/lootbox-catalog.test.ts`

- [ ] **Step 1: Copy supplied assets into the webapp public tree**

Run:

```powershell
New-Item -ItemType Directory -Force -Path "D:\VYNTRO\veltrix-services\apps\veltrix-web\public\assets\lootboxes"
Copy-Item -LiteralPath "C:\Users\jordi\Downloads\common lootbox.webp" -Destination "D:\VYNTRO\veltrix-services\apps\veltrix-web\public\assets\lootboxes\common-lootbox.webp"
Copy-Item -LiteralPath "C:\Users\jordi\Downloads\rare lootbox.webp" -Destination "D:\VYNTRO\veltrix-services\apps\veltrix-web\public\assets\lootboxes\rare-lootbox.webp"
Copy-Item -LiteralPath "C:\Users\jordi\Downloads\epic lootbox.webp" -Destination "D:\VYNTRO\veltrix-services\apps\veltrix-web\public\assets\lootboxes\epic-lootbox.webp"
Copy-Item -LiteralPath "C:\Users\jordi\Downloads\legendary lootbox.webp" -Destination "D:\VYNTRO\veltrix-services\apps\veltrix-web\public\assets\lootboxes\legendary-lootbox.webp"
Copy-Item -LiteralPath "C:\Users\jordi\Downloads\mythic lootbox.webp" -Destination "D:\VYNTRO\veltrix-services\apps\veltrix-web\public\assets\lootboxes\mythic-lootbox.webp"
Copy-Item -LiteralPath "C:\Users\jordi\Downloads\shard.webp" -Destination "D:\VYNTRO\veltrix-services\apps\veltrix-web\public\assets\lootboxes\shard.webp"
```

Expected: six files exist in `public/assets/lootboxes`.

- [ ] **Step 2: Write the catalog test**

Create `apps/veltrix-web/src/lib/lootboxes/lootbox-catalog.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import {
  LOOTBOX_EARNING_RULES,
  LOOTBOX_TIERS,
  getLootboxTier,
  getTierOddsTotal,
} from "./lootbox-catalog";

test("lootbox catalog has the balanced chase prices", () => {
  assert.equal(getLootboxTier("common").priceShards, 250);
  assert.equal(getLootboxTier("rare").priceShards, 750);
  assert.equal(getLootboxTier("epic").priceShards, 2000);
  assert.equal(getLootboxTier("legendary").priceShards, 6000);
  assert.equal(getLootboxTier("mythic").priceShards, 18000);
});

test("each tier odds table totals 100 percent", () => {
  for (const tier of LOOTBOX_TIERS) {
    assert.equal(getTierOddsTotal(tier.id), 100);
  }
});

test("earning rules keep featured and sponsored routes strongest", () => {
  assert.deepEqual(LOOTBOX_EARNING_RULES.normalQuest.range, [10, 20]);
  assert.deepEqual(LOOTBOX_EARNING_RULES.normalRaid.range, [15, 30]);
  assert.deepEqual(LOOTBOX_EARNING_RULES.featuredQuest.range, [50, 90]);
  assert.deepEqual(LOOTBOX_EARNING_RULES.featuredRaid.range, [75, 140]);
  assert.deepEqual(LOOTBOX_EARNING_RULES.sponsoredBoost.range, [25, 100]);
  assert.ok(LOOTBOX_EARNING_RULES.featuredRaid.range[0] > LOOTBOX_EARNING_RULES.normalRaid.range[1]);
});
```

- [ ] **Step 3: Run the catalog test and verify it fails**

Run:

```powershell
node --import ./scripts/test-env.mjs --import tsx --test apps/veltrix-web/src/lib/lootboxes/lootbox-catalog.test.ts
```

Expected: FAIL because `lootbox-catalog.ts` does not exist.

- [ ] **Step 4: Implement the catalog**

Create `apps/veltrix-web/src/lib/lootboxes/lootbox-catalog.ts`:

```ts
export type LootboxTierId = "common" | "rare" | "epic" | "legendary" | "mythic";
export type LootboxRarity = LootboxTierId;

export type LootboxTier = {
  id: LootboxTierId;
  label: string;
  priceShards: number;
  assetPath: string;
  minLevel: number;
  featuredCompletionsRequired?: number;
  requiresCleanTrust: boolean;
  requiresSeasonWindow: boolean;
  odds: Record<LootboxRarity, number>;
};

export const LOOTBOX_TIERS: LootboxTier[] = [
  {
    id: "common",
    label: "Common Lootbox",
    priceShards: 250,
    assetPath: "/assets/lootboxes/common-lootbox.webp",
    minLevel: 0,
    requiresCleanTrust: false,
    requiresSeasonWindow: false,
    odds: { common: 70, rare: 22, epic: 6, legendary: 1.8, mythic: 0.2 },
  },
  {
    id: "rare",
    label: "Rare Lootbox",
    priceShards: 750,
    assetPath: "/assets/lootboxes/rare-lootbox.webp",
    minLevel: 3,
    requiresCleanTrust: false,
    requiresSeasonWindow: false,
    odds: { common: 35, rare: 45, epic: 15, legendary: 4.5, mythic: 0.5 },
  },
  {
    id: "epic",
    label: "Epic Lootbox",
    priceShards: 2000,
    assetPath: "/assets/lootboxes/epic-lootbox.webp",
    minLevel: 8,
    featuredCompletionsRequired: 3,
    requiresCleanTrust: false,
    requiresSeasonWindow: false,
    odds: { common: 0, rare: 35, epic: 45, legendary: 17, mythic: 3 },
  },
  {
    id: "legendary",
    label: "Legendary Lootbox",
    priceShards: 6000,
    assetPath: "/assets/lootboxes/legendary-lootbox.webp",
    minLevel: 15,
    requiresCleanTrust: true,
    requiresSeasonWindow: false,
    odds: { common: 0, rare: 0, epic: 45, legendary: 48, mythic: 7 },
  },
  {
    id: "mythic",
    label: "Mythic Lootbox",
    priceShards: 18000,
    assetPath: "/assets/lootboxes/mythic-lootbox.webp",
    minLevel: 25,
    requiresCleanTrust: true,
    requiresSeasonWindow: true,
    odds: { common: 0, rare: 0, epic: 0, legendary: 55, mythic: 45 },
  },
];

export const SHARD_ASSET_PATH = "/assets/lootboxes/shard.webp";

export const LOOTBOX_EARNING_RULES = {
  normalQuest: { range: [10, 20] as const, weeklyCap: 250 },
  normalRaid: { range: [15, 30] as const, weeklyCap: 250 },
  featuredQuest: { range: [50, 90] as const, weeklyCap: 1200 },
  featuredRaid: { range: [75, 140] as const, weeklyCap: 1200 },
  platformEvent: { range: [40, 100] as const, weeklyCap: 600 },
  dailyStreak: { range: [10, 10] as const, weeklyCap: 70 },
  sponsoredBoost: { range: [25, 100] as const, weeklyCap: 1000 },
} as const;

export function getLootboxTier(tierId: LootboxTierId) {
  const tier = LOOTBOX_TIERS.find((item) => item.id === tierId);
  if (!tier) {
    throw new Error(`Unknown lootbox tier: ${tierId}`);
  }
  return tier;
}

export function getTierOddsTotal(tierId: LootboxTierId) {
  const tier = getLootboxTier(tierId);
  return Object.values(tier.odds).reduce((total, value) => total + value, 0);
}
```

- [ ] **Step 5: Run the catalog test and verify it passes**

Run:

```powershell
node --import ./scripts/test-env.mjs --import tsx --test apps/veltrix-web/src/lib/lootboxes/lootbox-catalog.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit catalog and assets**

Run:

```powershell
git add apps/veltrix-web/public/assets/lootboxes apps/veltrix-web/src/lib/lootboxes/lootbox-catalog.ts apps/veltrix-web/src/lib/lootboxes/lootbox-catalog.test.ts
git commit -m "Add lootbox catalog and assets"
```

### Task 2: Add Shard And Lootbox Database Tables

**Files:**
- Create: `database/migrations/vyntro_shard_lootbox_phase1.sql`

- [ ] **Step 1: Create the migration**

Create `database/migrations/vyntro_shard_lootbox_phase1.sql`:

```sql
begin;

create table if not exists public.shard_ledger (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null,
  amount integer not null,
  source_type text not null,
  source_ref text not null,
  source_dedupe_key text not null,
  reason text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  constraint shard_ledger_amount_nonzero check (amount <> 0),
  constraint shard_ledger_source_unique unique (auth_user_id, source_dedupe_key)
);

create index if not exists idx_shard_ledger_auth_created
  on public.shard_ledger (auth_user_id, created_at desc);

create table if not exists public.lootbox_tiers (
  id text primary key,
  label text not null,
  price_shards integer not null,
  asset_path text not null,
  min_level integer not null default 0,
  featured_completions_required integer,
  requires_clean_trust boolean not null default false,
  requires_season_window boolean not null default false,
  odds jsonb not null,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint lootbox_tiers_price_positive check (price_shards > 0)
);

create table if not exists public.lootbox_pool_items (
  id uuid primary key default gen_random_uuid(),
  tier_id text not null references public.lootbox_tiers(id) on delete cascade,
  rarity text not null,
  label text not null,
  item_type text not null,
  weight numeric not null,
  stock integer,
  unlimited_stock boolean not null default true,
  payload jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint lootbox_pool_items_weight_positive check (weight > 0),
  constraint lootbox_pool_items_stock_nonnegative check (stock is null or stock >= 0)
);

create index if not exists idx_lootbox_pool_items_tier_active
  on public.lootbox_pool_items (tier_id, active);

create table if not exists public.lootbox_opens (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null,
  tier_id text not null references public.lootbox_tiers(id),
  pool_item_id uuid references public.lootbox_pool_items(id) on delete set null,
  shard_spend integer not null,
  odds_snapshot jsonb not null,
  result_snapshot jsonb not null,
  status text not null default 'granted',
  created_at timestamp with time zone not null default now(),
  constraint lootbox_opens_spend_positive check (shard_spend > 0),
  constraint lootbox_opens_status_check check (status in ('granted', 'held_for_review'))
);

create index if not exists idx_lootbox_opens_auth_created
  on public.lootbox_opens (auth_user_id, created_at desc);

create table if not exists public.user_inventory (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null,
  lootbox_open_id uuid references public.lootbox_opens(id) on delete set null,
  item_type text not null,
  rarity text not null,
  label text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'owned',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint user_inventory_status_check check (status in ('owned', 'pending_review', 'claimed', 'expired'))
);

create index if not exists idx_user_inventory_auth_created
  on public.user_inventory (auth_user_id, created_at desc);

alter table public.shard_ledger enable row level security;
alter table public.lootbox_tiers enable row level security;
alter table public.lootbox_pool_items enable row level security;
alter table public.lootbox_opens enable row level security;
alter table public.user_inventory enable row level security;

drop policy if exists "members read own shard ledger" on public.shard_ledger;
create policy "members read own shard ledger"
on public.shard_ledger for select to authenticated
using (auth.uid() = auth_user_id);

drop policy if exists "members read lootbox tiers" on public.lootbox_tiers;
create policy "members read lootbox tiers"
on public.lootbox_tiers for select to authenticated
using (active = true);

drop policy if exists "members read active pool items" on public.lootbox_pool_items;
create policy "members read active pool items"
on public.lootbox_pool_items for select to authenticated
using (active = true);

drop policy if exists "members read own lootbox opens" on public.lootbox_opens;
create policy "members read own lootbox opens"
on public.lootbox_opens for select to authenticated
using (auth.uid() = auth_user_id);

drop policy if exists "members read own inventory" on public.user_inventory;
create policy "members read own inventory"
on public.user_inventory for select to authenticated
using (auth.uid() = auth_user_id);

insert into public.lootbox_tiers (
  id,
  label,
  price_shards,
  asset_path,
  min_level,
  featured_completions_required,
  requires_clean_trust,
  requires_season_window,
  odds,
  sort_order
) values
  ('common', 'Common Lootbox', 250, '/assets/lootboxes/common-lootbox.webp', 0, null, false, false, '{"common":70,"rare":22,"epic":6,"legendary":1.8,"mythic":0.2}'::jsonb, 10),
  ('rare', 'Rare Lootbox', 750, '/assets/lootboxes/rare-lootbox.webp', 3, null, false, false, '{"common":35,"rare":45,"epic":15,"legendary":4.5,"mythic":0.5}'::jsonb, 20),
  ('epic', 'Epic Lootbox', 2000, '/assets/lootboxes/epic-lootbox.webp', 8, 3, false, false, '{"common":0,"rare":35,"epic":45,"legendary":17,"mythic":3}'::jsonb, 30),
  ('legendary', 'Legendary Lootbox', 6000, '/assets/lootboxes/legendary-lootbox.webp', 15, null, true, false, '{"common":0,"rare":0,"epic":45,"legendary":48,"mythic":7}'::jsonb, 40),
  ('mythic', 'Mythic Lootbox', 18000, '/assets/lootboxes/mythic-lootbox.webp', 25, null, true, true, '{"common":0,"rare":0,"epic":0,"legendary":55,"mythic":45}'::jsonb, 50)
on conflict (id) do update
set
  label = excluded.label,
  price_shards = excluded.price_shards,
  asset_path = excluded.asset_path,
  min_level = excluded.min_level,
  featured_completions_required = excluded.featured_completions_required,
  requires_clean_trust = excluded.requires_clean_trust,
  requires_season_window = excluded.requires_season_window,
  odds = excluded.odds,
  sort_order = excluded.sort_order,
  active = true,
  updated_at = now();

insert into public.lootbox_pool_items (tier_id, rarity, label, item_type, weight, unlimited_stock, payload) values
  ('common', 'common', 'Shard Hunter Title', 'title', 70, true, '{"title":"Shard Hunter"}'::jsonb),
  ('common', 'rare', '10 Percent Shard Refund', 'shard_refund_percent', 22, true, '{"refundPercent":10}'::jsonb),
  ('common', 'epic', 'Streak Protector', 'streak_protector', 6, true, '{"uses":1}'::jsonb),
  ('common', 'legendary', 'Raid Catalyst Title', 'title', 1.8, true, '{"title":"Raid Catalyst"}'::jsonb),
  ('common', 'mythic', 'Mythic Window Token', 'season_access', 0.2, true, '{"window":"mythic-preview"}'::jsonb),
  ('rare', 'common', 'Shard Hunter Title', 'title', 35, true, '{"title":"Shard Hunter"}'::jsonb),
  ('rare', 'rare', '25 Percent Shard Refund', 'shard_refund_percent', 45, true, '{"refundPercent":25}'::jsonb),
  ('rare', 'epic', 'Vault Runner Title', 'title', 15, true, '{"title":"Vault Runner"}'::jsonb),
  ('rare', 'legendary', 'Profile Glow', 'profile_cosmetic', 4.5, true, '{"cosmetic":"profile-glow-gold"}'::jsonb),
  ('rare', 'mythic', 'Mythic Window Token', 'season_access', 0.5, true, '{"window":"mythic-preview"}'::jsonb)
on conflict do nothing;

commit;
```

- [ ] **Step 2: Verify migration is syntactically readable**

Run:

```powershell
Select-String -Path "database\migrations\vyntro_shard_lootbox_phase1.sql" -Pattern "create table if not exists public.shard_ledger","insert into public.lootbox_tiers","insert into public.lootbox_pool_items"
```

Expected: all three patterns are found.

- [ ] **Step 3: Commit migration**

Run:

```powershell
git add database/migrations/vyntro_shard_lootbox_phase1.sql
git commit -m "Add shard lootbox database schema"
```

### Task 3: Add Pure Lootbox Engine

**Files:**
- Create: `apps/veltrix-web/src/lib/lootboxes/lootbox-engine.ts`
- Create: `apps/veltrix-web/src/lib/lootboxes/lootbox-engine.test.ts`

- [ ] **Step 1: Write engine tests**

Create `apps/veltrix-web/src/lib/lootboxes/lootbox-engine.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { getLootboxTier } from "./lootbox-catalog";
import {
  calculateShardBalance,
  createShardSourceDedupeKey,
  isLootboxTierUnlocked,
  pickLootboxPoolItem,
} from "./lootbox-engine";

test("calculateShardBalance sums positive and negative ledger entries", () => {
  assert.equal(calculateShardBalance([{ amount: 90 }, { amount: -250 }, { amount: 500 }]), 340);
});

test("source dedupe keys are stable per user action", () => {
  assert.equal(
    createShardSourceDedupeKey({ sourceType: "quest", sourceRef: "quest-1", action: "approved" }),
    "quest:quest-1:approved"
  );
});

test("rare requires level 3", () => {
  const tier = getLootboxTier("rare");
  assert.equal(
    isLootboxTierUnlocked({
      tier,
      userLevel: 2,
      featuredCompletions: 0,
      trustClean: true,
      seasonWindowActive: false,
    }).unlocked,
    false
  );
  assert.equal(
    isLootboxTierUnlocked({
      tier,
      userLevel: 3,
      featuredCompletions: 0,
      trustClean: true,
      seasonWindowActive: false,
    }).unlocked,
    true
  );
});

test("pickLootboxPoolItem never returns an empty outcome when items exist", () => {
  const item = pickLootboxPoolItem({
    items: [
      { id: "a", rarity: "common", weight: 80 },
      { id: "b", rarity: "rare", weight: 20 },
    ],
    randomValue: 0.99,
  });
  assert.equal(item.id, "b");
});
```

- [ ] **Step 2: Run engine tests and verify they fail**

Run:

```powershell
node --import ./scripts/test-env.mjs --import tsx --test apps/veltrix-web/src/lib/lootboxes/lootbox-engine.test.ts
```

Expected: FAIL because `lootbox-engine.ts` does not exist.

- [ ] **Step 3: Implement engine functions**

Create `apps/veltrix-web/src/lib/lootboxes/lootbox-engine.ts`:

```ts
import type { LootboxTier } from "./lootbox-catalog";

export type ShardLedgerLike = {
  amount: number;
};

export type LootboxPoolItemLike = {
  id: string;
  rarity: string;
  weight: number;
};

export function calculateShardBalance(entries: ShardLedgerLike[]) {
  return entries.reduce((total, entry) => total + entry.amount, 0);
}

export function createShardSourceDedupeKey(params: {
  sourceType: string;
  sourceRef: string;
  action: string;
}) {
  return `${params.sourceType}:${params.sourceRef}:${params.action}`;
}

export function isLootboxTierUnlocked(params: {
  tier: LootboxTier;
  userLevel: number;
  featuredCompletions: number;
  trustClean: boolean;
  seasonWindowActive: boolean;
}) {
  if (params.userLevel < params.tier.minLevel) {
    return { unlocked: false, reason: `Requires level ${params.tier.minLevel}.` };
  }

  if (
    params.tier.featuredCompletionsRequired &&
    params.featuredCompletions < params.tier.featuredCompletionsRequired
  ) {
    return {
      unlocked: false,
      reason: `Requires ${params.tier.featuredCompletionsRequired} featured completions.`,
    };
  }

  if (params.tier.requiresCleanTrust && !params.trustClean) {
    return { unlocked: false, reason: "Requires clean trust posture." };
  }

  if (params.tier.requiresSeasonWindow && !params.seasonWindowActive) {
    return { unlocked: false, reason: "Requires an active mythic window." };
  }

  return { unlocked: true, reason: null };
}

export function pickLootboxPoolItem<T extends LootboxPoolItemLike>(params: {
  items: T[];
  randomValue: number;
}) {
  if (params.items.length === 0) {
    throw new Error("Lootbox pool has no active items.");
  }

  const totalWeight = params.items.reduce((total, item) => total + item.weight, 0);
  if (totalWeight <= 0) {
    throw new Error("Lootbox pool has no positive item weight.");
  }

  const target = Math.min(Math.max(params.randomValue, 0), 0.999999) * totalWeight;
  let cursor = 0;

  for (const item of params.items) {
    cursor += item.weight;
    if (target < cursor) {
      return item;
    }
  }

  return params.items[params.items.length - 1];
}
```

- [ ] **Step 4: Run catalog and engine tests**

Run:

```powershell
node --import ./scripts/test-env.mjs --import tsx --test apps/veltrix-web/src/lib/lootboxes/lootbox-catalog.test.ts apps/veltrix-web/src/lib/lootboxes/lootbox-engine.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit engine**

Run:

```powershell
git add apps/veltrix-web/src/lib/lootboxes/lootbox-engine.ts apps/veltrix-web/src/lib/lootboxes/lootbox-engine.test.ts
git commit -m "Add lootbox economy engine"
```

### Task 4: Add Server Helpers And Lootbox APIs

**Files:**
- Create: `apps/veltrix-web/src/lib/lootboxes/shard-server.ts`
- Create: `apps/veltrix-web/src/app/api/lootboxes/route.ts`
- Create: `apps/veltrix-web/src/app/api/lootboxes/open/route.ts`

- [ ] **Step 1: Create server helper**

Create `apps/veltrix-web/src/lib/lootboxes/shard-server.ts`:

```ts
import type { SupabaseClient } from "@supabase/supabase-js";
import { LOOTBOX_TIERS, type LootboxTierId } from "./lootbox-catalog";
import {
  calculateShardBalance,
  createShardSourceDedupeKey,
  isLootboxTierUnlocked,
  pickLootboxPoolItem,
} from "./lootbox-engine";

type AnySupabase = SupabaseClient<any, "public", any>;

export async function loadShardBalance(supabase: AnySupabase, authUserId: string) {
  const { data, error } = await supabase
    .from("shard_ledger")
    .select("amount")
    .eq("auth_user_id", authUserId);

  if (error) throw new Error(error.message);
  return calculateShardBalance((data ?? []).map((row) => ({ amount: Number(row.amount ?? 0) })));
}

export async function grantShards(params: {
  supabase: AnySupabase;
  authUserId: string;
  amount: number;
  sourceType: string;
  sourceRef: string;
  action: string;
  reason: string;
  metadata?: Record<string, unknown>;
}) {
  const amount = Math.max(0, Math.floor(params.amount));
  if (amount <= 0) {
    return { granted: false, amount: 0, alreadyGranted: false };
  }

  const sourceDedupeKey = createShardSourceDedupeKey({
    sourceType: params.sourceType,
    sourceRef: params.sourceRef,
    action: params.action,
  });

  const { error } = await params.supabase.from("shard_ledger").insert({
    auth_user_id: params.authUserId,
    amount,
    source_type: params.sourceType,
    source_ref: params.sourceRef,
    source_dedupe_key: sourceDedupeKey,
    reason: params.reason,
    metadata: params.metadata ?? {},
  });

  if (error) {
    const duplicate = error.message.toLowerCase().includes("duplicate") || error.message.toLowerCase().includes("unique");
    if (duplicate) {
      return { granted: false, amount: 0, alreadyGranted: true };
    }
    throw new Error(error.message);
  }

  return { granted: true, amount, alreadyGranted: false };
}

export async function loadLootboxShopState(params: {
  supabase: AnySupabase;
  authUserId: string;
  userLevel: number;
  featuredCompletions: number;
  trustClean: boolean;
  seasonWindowActive: boolean;
}) {
  const [balance, inventoryResult, opensResult] = await Promise.all([
    loadShardBalance(params.supabase, params.authUserId),
    params.supabase
      .from("user_inventory")
      .select("id, item_type, rarity, label, payload, status, created_at")
      .eq("auth_user_id", params.authUserId)
      .order("created_at", { ascending: false })
      .limit(30),
    params.supabase
      .from("lootbox_opens")
      .select("id, tier_id, result_snapshot, status, created_at")
      .eq("auth_user_id", params.authUserId)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  if (inventoryResult.error) throw new Error(inventoryResult.error.message);
  if (opensResult.error) throw new Error(opensResult.error.message);

  return {
    balance,
    tiers: LOOTBOX_TIERS.map((tier) => ({
      ...tier,
      eligibility: isLootboxTierUnlocked({
        tier,
        userLevel: params.userLevel,
        featuredCompletions: params.featuredCompletions,
        trustClean: params.trustClean,
        seasonWindowActive: params.seasonWindowActive,
      }),
    })),
    inventory: inventoryResult.data ?? [],
    opens: opensResult.data ?? [],
  };
}

export async function openLootbox(params: {
  supabase: AnySupabase;
  authUserId: string;
  tierId: LootboxTierId;
  userLevel: number;
  featuredCompletions: number;
  trustClean: boolean;
  seasonWindowActive: boolean;
  randomValue?: number;
}) {
  const tier = LOOTBOX_TIERS.find((item) => item.id === params.tierId);
  if (!tier) throw new Error("Unknown lootbox tier.");

  const eligibility = isLootboxTierUnlocked({
    tier,
    userLevel: params.userLevel,
    featuredCompletions: params.featuredCompletions,
    trustClean: params.trustClean,
    seasonWindowActive: params.seasonWindowActive,
  });
  if (!eligibility.unlocked) throw new Error(eligibility.reason ?? "Lootbox tier is locked.");

  const balance = await loadShardBalance(params.supabase, params.authUserId);
  if (balance < tier.priceShards) {
    throw new Error(`You need ${tier.priceShards - balance} more shards to open this box.`);
  }

  const { data: items, error: itemsError } = await params.supabase
    .from("lootbox_pool_items")
    .select("id, rarity, label, item_type, weight, payload")
    .eq("tier_id", tier.id)
    .eq("active", true);

  if (itemsError) throw new Error(itemsError.message);

  const selected = pickLootboxPoolItem({
    items: (items ?? []).map((item) => ({
      id: String(item.id),
      rarity: String(item.rarity),
      label: String(item.label),
      itemType: String(item.item_type),
      weight: Number(item.weight),
      payload: item.payload ?? {},
    })),
    randomValue: params.randomValue ?? Math.random(),
  });

  const openStatus =
    (tier.id === "legendary" || tier.id === "mythic") && !params.trustClean
      ? "held_for_review"
      : "granted";

  const { error: spendError } = await params.supabase.from("shard_ledger").insert({
    auth_user_id: params.authUserId,
    amount: -tier.priceShards,
    source_type: "lootbox",
    source_ref: tier.id,
    source_dedupe_key: `lootbox:${tier.id}:${crypto.randomUUID()}`,
    reason: `Opened ${tier.label}`,
    metadata: { tierId: tier.id },
  });

  if (spendError) throw new Error(spendError.message);

  const { data: openRow, error: openError } = await params.supabase
    .from("lootbox_opens")
    .insert({
      auth_user_id: params.authUserId,
      tier_id: tier.id,
      pool_item_id: selected.id,
      shard_spend: tier.priceShards,
      odds_snapshot: tier.odds,
      result_snapshot: selected,
      status: openStatus,
    })
    .select("id, tier_id, result_snapshot, status, created_at")
    .single();

  if (openError || !openRow) throw new Error(openError?.message ?? "Lootbox open failed.");

  const { data: inventoryRow, error: inventoryError } = await params.supabase
    .from("user_inventory")
    .insert({
      auth_user_id: params.authUserId,
      lootbox_open_id: openRow.id,
      item_type: selected.itemType,
      rarity: selected.rarity,
      label: selected.label,
      payload: selected.payload,
      status: openStatus === "held_for_review" ? "pending_review" : "owned",
    })
    .select("id, item_type, rarity, label, payload, status, created_at")
    .single();

  if (inventoryError || !inventoryRow) {
    throw new Error(inventoryError?.message ?? "Inventory grant failed.");
  }

  return {
    open: openRow,
    inventoryItem: inventoryRow,
    balance: await loadShardBalance(params.supabase, params.authUserId),
  };
}
```

- [ ] **Step 2: Create GET shop endpoint**

Create `apps/veltrix-web/src/app/api/lootboxes/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient, createSupabaseUserServerClient } from "@/lib/supabase/server";
import { loadLootboxShopState } from "@/lib/lootboxes/shard-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getBearerToken(request: NextRequest) {
  const header = request.headers.get("authorization") || "";
  return header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : null;
}

export async function GET(request: NextRequest) {
  const accessToken = getBearerToken(request);
  if (!accessToken) {
    return NextResponse.json({ ok: false, error: "Missing bearer token." }, { status: 401 });
  }

  try {
    const userSupabase = createSupabaseUserServerClient(accessToken);
    const serviceSupabase = createSupabaseServiceClient();
    const {
      data: { user },
      error: userError,
    } = await userSupabase.auth.getUser(accessToken);

    if (userError || !user) {
      return NextResponse.json({ ok: false, error: "Invalid session." }, { status: 401 });
    }

    const { data: profile } = await serviceSupabase
      .from("user_profiles")
      .select("level, status")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    const { data: reputation } = await serviceSupabase
      .from("user_global_reputation")
      .select("trust_score")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    const { count: featuredCompletions } = await serviceSupabase
      .from("shard_ledger")
      .select("id", { count: "exact", head: true })
      .eq("auth_user_id", user.id)
      .in("source_type", ["featured_quest", "featured_raid"]);

    const shop = await loadLootboxShopState({
      supabase: serviceSupabase,
      authUserId: user.id,
      userLevel: Number(profile?.level ?? 0),
      featuredCompletions: featuredCompletions ?? 0,
      trustClean: Number(reputation?.trust_score ?? 100) >= 60,
      seasonWindowActive: false,
    });

    return NextResponse.json({ ok: true, shop });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Lootbox shop failed." },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 3: Create open endpoint**

Create `apps/veltrix-web/src/app/api/lootboxes/open/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient, createSupabaseUserServerClient } from "@/lib/supabase/server";
import { openLootbox } from "@/lib/lootboxes/shard-server";
import type { LootboxTierId } from "@/lib/lootboxes/lootbox-catalog";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getBearerToken(request: NextRequest) {
  const header = request.headers.get("authorization") || "";
  return header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : null;
}

function isLootboxTierId(value: unknown): value is LootboxTierId {
  return ["common", "rare", "epic", "legendary", "mythic"].includes(String(value));
}

export async function POST(request: NextRequest) {
  const accessToken = getBearerToken(request);
  if (!accessToken) {
    return NextResponse.json({ ok: false, error: "Missing bearer token." }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => null)) as { tierId?: unknown } | null;
    if (!isLootboxTierId(body?.tierId)) {
      return NextResponse.json({ ok: false, error: "Invalid lootbox tier." }, { status: 400 });
    }

    const userSupabase = createSupabaseUserServerClient(accessToken);
    const serviceSupabase = createSupabaseServiceClient();
    const {
      data: { user },
      error: userError,
    } = await userSupabase.auth.getUser(accessToken);

    if (userError || !user) {
      return NextResponse.json({ ok: false, error: "Invalid session." }, { status: 401 });
    }

    const { data: profile } = await serviceSupabase
      .from("user_profiles")
      .select("level")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    const { data: reputation } = await serviceSupabase
      .from("user_global_reputation")
      .select("trust_score")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    const { count: featuredCompletions } = await serviceSupabase
      .from("shard_ledger")
      .select("id", { count: "exact", head: true })
      .eq("auth_user_id", user.id)
      .in("source_type", ["featured_quest", "featured_raid"]);

    const result = await openLootbox({
      supabase: serviceSupabase,
      authUserId: user.id,
      tierId: body.tierId,
      userLevel: Number(profile?.level ?? 0),
      featuredCompletions: featuredCompletions ?? 0,
      trustClean: Number(reputation?.trust_score ?? 100) >= 60,
      seasonWindowActive: false,
    });

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lootbox open failed.";
    const status = message.includes("more shards") || message.includes("Requires") ? 409 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
```

- [ ] **Step 4: Typecheck the API files**

Run:

```powershell
npm.cmd run typecheck --workspace vyntro-web
```

Expected: PASS. If the generated database types do not know the new tables, use the existing repo pattern for Supabase row casts and keep this task scoped to the new route files.

- [ ] **Step 5: Commit API helpers**

Run:

```powershell
git add apps/veltrix-web/src/lib/lootboxes/shard-server.ts apps/veltrix-web/src/app/api/lootboxes
git commit -m "Add lootbox shop APIs"
```

### Task 5: Add Shard Earning From Quest Approval And Raid Confirmation

**Files:**
- Modify: `apps/veltrix-web/src/app/api/quests/submissions/[id]/decision/route.ts`
- Create: `apps/veltrix-web/src/app/api/raids/[id]/confirm/route.ts`
- Modify: `apps/veltrix-web/src/components/raids/raid-detail-screen.tsx`

- [ ] **Step 1: Add shard grant helper imports to quest decision route**

Modify imports in `apps/veltrix-web/src/app/api/quests/submissions/[id]/decision/route.ts`:

```ts
import { LOOTBOX_EARNING_RULES } from "@/lib/lootboxes/lootbox-catalog";
import { grantShards } from "@/lib/lootboxes/shard-server";
```

- [ ] **Step 2: Grant shards after approved quest decisions**

In the same route, after the existing successful approved decision side effects, add:

```ts
    let shardAward: { granted: boolean; amount: number; alreadyGranted: boolean } | null = null;
    if (decision === "approved") {
      const featured = Boolean((quest as { featured?: boolean | null }).featured);
      const range = featured
        ? LOOTBOX_EARNING_RULES.featuredQuest.range
        : LOOTBOX_EARNING_RULES.normalQuest.range;
      const amount = featured ? range[0] : range[0];
      shardAward = await grantShards({
        supabase: serviceSupabase,
        authUserId: String(submission.auth_user_id),
        amount,
        sourceType: featured ? "featured_quest" : "normal_quest",
        sourceRef: String(quest.id),
        action: "approved",
        reason: featured ? "Featured quest approved" : "Quest approved",
        metadata: {
          questId: quest.id,
          questTitle: quest.title,
          campaignId: quest.campaign_id,
          projectId: quest.project_id,
        },
      });
    }
```

Also include `shardAward` in the JSON response:

```ts
      shardAward,
```

- [ ] **Step 3: Create raid confirm endpoint**

Create `apps/veltrix-web/src/app/api/raids/[id]/confirm/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient, createSupabaseUserServerClient } from "@/lib/supabase/server";
import { LOOTBOX_EARNING_RULES } from "@/lib/lootboxes/lootbox-catalog";
import { grantShards } from "@/lib/lootboxes/shard-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getBearerToken(request: NextRequest) {
  const header = request.headers.get("authorization") || "";
  return header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : null;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const accessToken = getBearerToken(request);
  if (!accessToken) {
    return NextResponse.json({ ok: false, error: "Missing bearer token." }, { status: 401 });
  }

  const { id: raidId } = await context.params;
  if (!raidId) {
    return NextResponse.json({ ok: false, error: "Missing raid id." }, { status: 400 });
  }

  try {
    const userSupabase = createSupabaseUserServerClient(accessToken);
    const serviceSupabase = createSupabaseServiceClient();
    const {
      data: { user },
      error: userError,
    } = await userSupabase.auth.getUser(accessToken);

    if (userError || !user) {
      return NextResponse.json({ ok: false, error: "Invalid session." }, { status: 401 });
    }

    const { data: raid, error: raidError } = await serviceSupabase
      .from("raids")
      .select("id, title, campaign_id, project_id, reward, generated_by")
      .eq("id", raidId)
      .maybeSingle();

    if (raidError) throw new Error(raidError.message);
    if (!raid?.id) {
      return NextResponse.json({ ok: false, error: "Raid not found." }, { status: 404 });
    }

    const { data: existing } = await serviceSupabase
      .from("user_progress")
      .select("id, joined_communities, confirmed_raids, claimed_rewards, opened_lootbox_ids, unlocked_reward_ids, quest_statuses")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    const confirmedRaids = Array.isArray(existing?.confirmed_raids)
      ? [...new Set([...(existing.confirmed_raids as string[]), raidId])]
      : [raidId];

    const { error: progressError } = await serviceSupabase.from("user_progress").upsert({
      auth_user_id: user.id,
      joined_communities: existing?.joined_communities ?? [],
      confirmed_raids: confirmedRaids,
      claimed_rewards: existing?.claimed_rewards ?? [],
      opened_lootbox_ids: existing?.opened_lootbox_ids ?? [],
      unlocked_reward_ids: existing?.unlocked_reward_ids ?? [],
      quest_statuses: existing?.quest_statuses ?? {},
    });

    if (progressError) throw new Error(progressError.message);

    const { error: completionError } = await serviceSupabase.from("raid_completions").insert({
      auth_user_id: user.id,
      raid_id: raidId,
    });

    if (completionError && !completionError.message.toLowerCase().includes("duplicate")) {
      throw new Error(completionError.message);
    }

    const featured = raid.generated_by === "featured" || raid.generated_by === "campaign_studio";
    const range = featured
      ? LOOTBOX_EARNING_RULES.featuredRaid.range
      : LOOTBOX_EARNING_RULES.normalRaid.range;
    const shardAward = await grantShards({
      supabase: serviceSupabase,
      authUserId: user.id,
      amount: range[0],
      sourceType: featured ? "featured_raid" : "normal_raid",
      sourceRef: raidId,
      action: "confirmed",
      reason: featured ? "Featured raid confirmed" : "Raid confirmed",
      metadata: {
        raidId,
        raidTitle: raid.title,
        campaignId: raid.campaign_id,
        projectId: raid.project_id,
      },
    });

    return NextResponse.json({ ok: true, confirmed: true, shardAward });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Raid confirm failed." },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 4: Replace direct raid progress write with API call**

In `apps/veltrix-web/src/components/raids/raid-detail-screen.tsx`, delete `confirmRaidForUser` and add:

```ts
async function confirmRaidForUser(accessToken: string, raidId: string) {
  const response = await fetch(`/api/raids/${raidId}/confirm`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as
    | {
        ok?: boolean;
        error?: string;
        shardAward?: { granted: boolean; amount: number; alreadyGranted: boolean };
      }
    | null;

  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.error ?? "Raid confirmation failed.");
  }

  return payload.shardAward ?? null;
}
```

Then change:

```ts
      await confirmRaidForUser(authUserId, currentRaid.id);
```

to:

```ts
      const shardAward = await confirmRaidForUser(session.access_token, currentRaid.id);
```

And change the success text:

```ts
      const successText = shardAward?.granted
        ? `Your raid has been confirmed. +${shardAward.amount} shards added.`
        : "Your raid has been confirmed.";
```

- [ ] **Step 5: Run focused tests and typecheck**

Run:

```powershell
node --import ./scripts/test-env.mjs --import tsx --test apps/veltrix-web/src/lib/lootboxes/lootbox-catalog.test.ts apps/veltrix-web/src/lib/lootboxes/lootbox-engine.test.ts
npm.cmd run typecheck --workspace vyntro-web
```

Expected: both commands PASS.

- [ ] **Step 6: Commit shard earning hooks**

Run:

```powershell
git add apps/veltrix-web/src/app/api/quests/submissions/[id]/decision/route.ts apps/veltrix-web/src/app/api/raids/[id]/confirm/route.ts apps/veltrix-web/src/components/raids/raid-detail-screen.tsx
git commit -m "Add shard earning from quests and raids"
```

### Task 6: Add Lootbox State To The Webapp Hook

**Files:**
- Modify: `apps/veltrix-web/src/hooks/use-live-user-data.ts`

- [ ] **Step 1: Add lootbox types near the existing live data types**

Add:

```ts
type LiveLootboxShopTier = {
  id: string;
  label: string;
  priceShards: number;
  assetPath: string;
  odds: Record<string, number>;
  eligibility: {
    unlocked: boolean;
    reason: string | null;
  };
};

type LiveInventoryItem = {
  id: string;
  item_type: string;
  rarity: string;
  label: string;
  payload: Record<string, unknown>;
  status: string;
  created_at: string;
};
```

- [ ] **Step 2: Extend dataset union**

Add these dataset keys:

```ts
  | "lootboxes"
  | "inventory";
```

Add them to `ALL_LIVE_USER_DATASETS`:

```ts
  "lootboxes",
  "inventory",
```

- [ ] **Step 3: Add state and API functions**

Add state:

```ts
  const [shardBalance, setShardBalance] = useState(0);
  const [lootboxTiers, setLootboxTiers] = useState<LiveLootboxShopTier[]>([]);
  const [inventory, setInventory] = useState<LiveInventoryItem[]>([]);
```

Add loader inside the existing load function when requested datasets include `lootboxes` or `inventory`:

```ts
    if ((requestedDatasets.includes("lootboxes") || requestedDatasets.includes("inventory")) && session?.access_token) {
      const response = await fetch("/api/lootboxes", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => null)) as
        | {
            ok?: boolean;
            shop?: {
              balance: number;
              tiers: LiveLootboxShopTier[];
              inventory: LiveInventoryItem[];
            };
            error?: string;
          }
        | null;

      if (!response.ok || !payload?.ok || !payload.shop) {
        throw new Error(payload?.error ?? "Lootbox shop failed to load.");
      }

      setShardBalance(payload.shop.balance);
      setLootboxTiers(payload.shop.tiers);
      setInventory(payload.shop.inventory);
    }
```

Add function:

```ts
  async function openLootbox(tierId: string) {
    if (!session?.access_token) {
      return { ok: false, error: "Sign in before opening a lootbox." };
    }

    const response = await fetch("/api/lootboxes/open", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ tierId }),
      cache: "no-store",
    });

    const payload = (await response.json().catch(() => null)) as
      | {
          ok?: boolean;
          result?: {
            balance: number;
            inventoryItem: LiveInventoryItem;
          };
          error?: string;
        }
      | null;

    if (!response.ok || !payload?.ok || !payload.result) {
      return { ok: false, error: payload?.error ?? "Lootbox open failed." };
    }

    setShardBalance(payload.result.balance);
    setInventory((current) => [payload.result!.inventoryItem, ...current]);
    return { ok: true, result: payload.result };
  }
```

Return the new values from the hook:

```ts
    shardBalance,
    lootboxTiers,
    inventory,
    openLootbox,
```

- [ ] **Step 4: Run typecheck**

Run:

```powershell
npm.cmd run typecheck --workspace vyntro-web
```

Expected: PASS.

- [ ] **Step 5: Commit hook update**

Run:

```powershell
git add apps/veltrix-web/src/hooks/use-live-user-data.ts
git commit -m "Expose lootbox state in live user data"
```

### Task 7: Add Lootbox Shop UI

**Files:**
- Create: `apps/veltrix-web/src/components/ui/shard-badge.tsx`
- Create: `apps/veltrix-web/src/components/lootboxes/lootbox-card.tsx`
- Create: `apps/veltrix-web/src/components/lootboxes/lootbox-shop-screen.tsx`
- Create: `apps/veltrix-web/src/app/lootboxes/page.tsx`
- Modify: `apps/veltrix-web/src/components/rewards/rewards-screen.tsx`

- [ ] **Step 1: Create shard badge**

Create `apps/veltrix-web/src/components/ui/shard-badge.tsx`:

```tsx
import Image from "next/image";
import { SHARD_ASSET_PATH } from "@/lib/lootboxes/lootbox-catalog";

export function ShardBadge({
  value,
  label = "shards",
  size = "md",
}: {
  value: number | string;
  label?: string;
  size?: "sm" | "md";
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/18 bg-emerald-300/[0.075] px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-emerald-200">
      <Image
        src={SHARD_ASSET_PATH}
        alt=""
        width={size === "sm" ? 18 : 22}
        height={size === "sm" ? 18 : 22}
        className="object-contain"
      />
      <span>{value}</span>
      <span className="text-emerald-100/70">{label}</span>
    </span>
  );
}
```

- [ ] **Step 2: Create lootbox card**

Create `apps/veltrix-web/src/components/lootboxes/lootbox-card.tsx`:

```tsx
import Image from "next/image";
import { ShardBadge } from "@/components/ui/shard-badge";

export function LootboxCard({
  tier,
  busy,
  onOpen,
}: {
  tier: {
    id: string;
    label: string;
    priceShards: number;
    assetPath: string;
    odds: Record<string, number>;
    eligibility: { unlocked: boolean; reason: string | null };
  };
  busy: boolean;
  onOpen: () => void;
}) {
  const topOdds = Object.entries(tier.odds)
    .filter(([, value]) => value > 0)
    .slice(-2)
    .map(([rarity, value]) => `${rarity} ${value}%`)
    .join(" / ");

  return (
    <article className="relative overflow-hidden rounded-[24px] border border-white/8 bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.12),transparent_36%),linear-gradient(180deg,rgba(14,18,24,0.98),rgba(6,8,12,0.98))] p-4 shadow-[0_20px_58px_rgba(0,0,0,0.28)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-200">
            Lootbox
          </p>
          <h3 className="mt-2 text-[1rem] font-semibold text-white">{tier.label}</h3>
          <p className="mt-1.5 text-[12px] leading-5 text-slate-400">{topOdds}</p>
        </div>
        <ShardBadge value={tier.priceShards} size="sm" />
      </div>

      <div className="mt-4 flex justify-center">
        <Image
          src={tier.assetPath}
          alt={tier.label}
          width={220}
          height={220}
          className="h-36 w-36 object-contain drop-shadow-[0_18px_34px_rgba(0,0,0,0.45)] transition duration-300 hover:scale-105"
        />
      </div>

      <button
        type="button"
        onClick={onOpen}
        disabled={busy || !tier.eligibility.unlocked}
        className="mt-4 w-full rounded-full bg-emerald-300 px-4 py-2.5 text-[12px] font-black uppercase tracking-[0.14em] text-black transition hover:brightness-105 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-slate-500"
      >
        {busy ? "Opening..." : tier.eligibility.unlocked ? "Open box" : "Locked"}
      </button>

      {!tier.eligibility.unlocked ? (
        <p className="mt-2 text-center text-[11px] leading-5 text-slate-500">
          {tier.eligibility.reason}
        </p>
      ) : null}
    </article>
  );
}
```

- [ ] **Step 3: Create shop screen**

Create `apps/veltrix-web/src/components/lootboxes/lootbox-shop-screen.tsx`:

```tsx
"use client";

import { useState } from "react";
import { LootboxCard } from "@/components/lootboxes/lootbox-card";
import { ShardBadge } from "@/components/ui/shard-badge";
import { Surface } from "@/components/ui/surface";
import { useLiveUserData } from "@/hooks/use-live-user-data";

export function LootboxShopScreen() {
  const { loading, error, shardBalance, lootboxTiers, inventory, openLootbox } =
    useLiveUserData({ datasets: ["lootboxes", "inventory"] });
  const [busyTier, setBusyTier] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: "default" | "success" | "error"; text: string } | null>(null);

  async function handleOpen(tierId: string) {
    setBusyTier(tierId);
    setMessage({ tone: "default", text: "Opening lootbox..." });
    const result = await openLootbox(tierId);
    if (!result.ok) {
      setMessage({ tone: "error", text: result.error ?? "Lootbox open failed." });
      setBusyTier(null);
      return;
    }

    setMessage({
      tone: "success",
      text: `Unlocked ${result.result.inventoryItem.label}.`,
    });
    setBusyTier(null);
  }

  if (loading) return <Notice text="Loading lootboxes..." />;
  if (error) return <Notice text={error} tone="error" />;

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[26px] border border-white/8 bg-[radial-gradient(circle_at_10%_0%,rgba(34,197,94,0.14),transparent_30%),linear-gradient(180deg,rgba(11,14,20,0.99),rgba(5,7,11,0.99))] p-5">
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-200">
          Shard Vault
        </p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-[1.35rem] font-semibold tracking-[-0.04em] text-white">
              Hunt shards, open VYNTRO lootboxes
            </h1>
            <p className="mt-2 max-w-2xl text-[13px] leading-5 text-slate-400">
              Shards come from platform activity. Open boxes for cosmetics, perks, refunds and collectible unlocks.
            </p>
          </div>
          <ShardBadge value={shardBalance} />
        </div>
      </section>

      {message ? (
        <div
          className={`rounded-[18px] border px-4 py-3 text-[13px] ${
            message.tone === "success"
              ? "border-emerald-300/20 bg-emerald-300/[0.08] text-emerald-100"
              : message.tone === "error"
                ? "border-rose-300/20 bg-rose-500/[0.08] text-rose-100"
                : "border-white/8 bg-white/[0.03] text-slate-300"
          }`}
        >
          {message.text}
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {lootboxTiers.map((tier) => (
          <LootboxCard
            key={tier.id}
            tier={tier}
            busy={busyTier === tier.id}
            onOpen={() => void handleOpen(tier.id)}
          />
        ))}
      </div>

      <Surface
        eyebrow="Inventory"
        title="Recent unlocks"
        description="Lootbox results land here first before claim or cosmetic routing grows into a fuller inventory."
      >
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {inventory.length ? (
            inventory.slice(0, 9).map((item) => (
              <div key={item.id} className="rounded-[16px] border border-white/8 bg-white/[0.03] p-3">
                <p className="text-[12px] font-semibold text-white">{item.label}</p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-slate-500">
                  {item.rarity} / {item.item_type}
                </p>
              </div>
            ))
          ) : (
            <p className="text-[13px] text-slate-400">No lootbox unlocks yet.</p>
          )}
        </div>
      </Surface>
    </div>
  );
}

function Notice({ text, tone = "default" }: { text: string; tone?: "default" | "error" }) {
  return (
    <div className={`rounded-[18px] border p-4 text-[13px] ${tone === "error" ? "border-rose-300/20 text-rose-100" : "border-white/8 text-slate-300"}`}>
      {text}
    </div>
  );
}
```

- [ ] **Step 4: Create route page**

Create `apps/veltrix-web/src/app/lootboxes/page.tsx`:

```tsx
import { LootboxShopScreen } from "@/components/lootboxes/lootbox-shop-screen";

export default function LootboxesPage() {
  return <LootboxShopScreen />;
}
```

- [ ] **Step 5: Add rewards screen link**

In `apps/veltrix-web/src/components/rewards/rewards-screen.tsx`, include `shardBalance` in the hook destructure:

```ts
    shardBalance,
```

Add this link near the hero action area:

```tsx
          <Link
            href="/lootboxes"
            className="inline-flex items-center rounded-full border border-emerald-300/20 bg-emerald-300/[0.08] px-3.5 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-emerald-100 transition hover:bg-emerald-300/[0.12]"
          >
            Open lootboxes / {shardBalance} shards
          </Link>
```

- [ ] **Step 6: Run web checks**

Run:

```powershell
npm.cmd run typecheck --workspace vyntro-web
npm.cmd run build --workspace vyntro-web
```

Expected: both commands PASS.

- [ ] **Step 7: Commit UI**

Run:

```powershell
git add apps/veltrix-web/src/components/ui/shard-badge.tsx apps/veltrix-web/src/components/lootboxes apps/veltrix-web/src/app/lootboxes apps/veltrix-web/src/components/rewards/rewards-screen.tsx
git commit -m "Add lootbox shop UI"
```

### Task 8: Final Verification And Release Notes

**Files:**
- Modify: `D:\VYNTRO\crypto-raid-admin-portal\docs\superpowers\specs\2026-05-05-shard-lootbox-economy-design.md`

- [ ] **Step 1: Run full focused verification**

Run:

```powershell
node --import ./scripts/test-env.mjs --import tsx --test apps/veltrix-web/src/lib/lootboxes/lootbox-catalog.test.ts apps/veltrix-web/src/lib/lootboxes/lootbox-engine.test.ts
npm.cmd run typecheck --workspace vyntro-web
npm.cmd run build --workspace vyntro-web
```

Expected: all commands PASS.

- [ ] **Step 2: Add Phase 1 implementation note to the approved spec**

Append to `D:\VYNTRO\crypto-raid-admin-portal\docs\superpowers\specs\2026-05-05-shard-lootbox-economy-design.md`:

```md

## Phase 1 Implementation Notes

Phase 1 shipped the earned shard ledger, static tier catalog, basic VYNTRO reward pool, server-side open endpoint, webapp shop, and first earning hooks from approved quests and confirmed raids. Sponsored pool manager, full Lootbox Studio, user passes, and USDC pools remain outside Phase 1 scope.
```

- [ ] **Step 3: Commit release note**

Run in `D:\VYNTRO\crypto-raid-admin-portal`:

```powershell
git add docs/superpowers/specs/2026-05-05-shard-lootbox-economy-design.md
git commit -m "Document shard lootbox phase 1 implementation"
```

- [ ] **Step 4: Check both repos are clean**

Run:

```powershell
git -C D:\VYNTRO\veltrix-services status -sb
git -C D:\VYNTRO\crypto-raid-admin-portal status -sb
```

Expected:

```text
## master...origin/master
## main...origin/main
```

The branch names can show ahead counts until the user asks to push.

## Self-Review

Spec coverage:

- Earned platform-wide shards: Tasks 2, 4, 5, and 6.
- Lootbox catalog and five tier assets: Task 1.
- Common/Rare functional opening with all tiers stored: Tasks 1, 2, 4, and 7.
- Server-side outcomes and ledger truth: Tasks 2, 3, and 4.
- No empty boxes: Task 3 enforces non-empty active pool selection and Task 2 seeds active outcomes.
- Webapp shard balance and shop: Tasks 6 and 7.
- Featured quests/raids as stronger shard routes: Tasks 1 and 5.
- Portal studio and sponsored pool management: intentionally outside Phase 1, preserved as spec-backed next phase.

Implementation order:

1. Add assets and catalog.
2. Add database schema.
3. Add pure engine.
4. Add server helpers and APIs.
5. Add earning hooks.
6. Add hook state.
7. Add UI.
8. Run final checks and document shipped scope.
