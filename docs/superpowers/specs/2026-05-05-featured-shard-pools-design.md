# Featured Shard Pools Design

Date: 2026-05-05
Owner: VYNTRO product
Scope: Shard Lootbox Phase 2A across portal, webapp, and Supabase

## Summary

Featured Shard Pools turn featured quests and raids into a stronger paid performance product.
Projects can run featured campaigns or priority actions, and VYNTRO can attach a finite shard budget that users visibly hunt while completing those actions.

Phase 2A keeps the default experience simple: a campaign can have one main shard boost pool. Specific quests or raids may optionally receive an override pool when a launch moment needs extra pressure. The server remains the source of truth for budget depletion, award amounts, ledger writes, and idempotency.

## Product Goals

1. Make featured quests and raids more attractive to users by showing real shard earning.
2. Give projects a clear reason to pay for featured placement or boost packages.
3. Keep XP untouched as reputation/progression; shards remain the spendable activity currency.
4. Avoid backend breakage by keeping existing quest approval and raid confirmation routes intact.
5. Make every pool grant auditable through the shard ledger.

## Access Model

Portal users with project `owner` or `admin` role can manage pools for their own project.
`super_admin` can manage pools across all projects.
The webapp can read active pool summaries and can only spend pool budget through server-side validated quest approval or raid confirmation flows.

No client can directly grant shards, decrement pool budget, or mutate ledger rows.

## Recommended Approach

Use a hybrid model:

- Campaign-level pool is the default.
- Optional quest-level or raid-level override pool can be added later or when needed.
- If an override pool exists and is active, it wins over the campaign pool for that action.
- If no active pool exists, the existing Phase 1 featured or normal shard grant remains available.

This gives projects an easy mental model while preserving enough control for high-value launch moments.

## Data Model

Add `featured_shard_pools`:

- `id`
- `project_id`
- `campaign_id`
- `quest_id`
- `raid_id`
- `label`
- `pool_size`
- `remaining_shards`
- `bonus_min`
- `bonus_max`
- `per_user_cap`
- `starts_at`
- `ends_at`
- `status`
- `created_by_auth_user_id`
- `metadata`
- `created_at`
- `updated_at`

Rules:

- `project_id` is required.
- `pool_size` and `remaining_shards` are non-negative.
- `bonus_min` and `bonus_max` are positive and `bonus_max >= bonus_min`.
- `status` is one of `draft`, `scheduled`, `active`, `paused`, `ended`.
- A pool may target a campaign, quest, or raid. Campaign-level pools are the default path.

Useful indexes:

- `project_id, status, created_at desc`
- `campaign_id, status`
- `quest_id, status`
- `raid_id, status`
- `ends_at`

RLS:

- Authenticated portal members can select pools for projects where they have membership.
- Only project `owner`, `admin`, or `super_admin` can insert/update/delete pools.
- The public webapp does not rely on direct client mutation. Server routes use the service client.

## Server Award Flow

Quest approval:

1. Existing reviewer authorization stays unchanged.
2. Existing submission decision and XP award stay unchanged.
3. If approved, server resolves the best active shard pool for the quest:
   - active quest override
   - active campaign pool
   - no pool
4. Server computes award:
   - base award from existing Phase 1 normal/featured earning rule
   - plus pool bonus when budget is available
5. Server writes one shard ledger entry with metadata containing pool id, base amount, bonus amount, pool snapshot, project id, campaign id, and quest id.
6. Server decrements pool budget by the granted bonus amount.

Raid confirmation:

1. Existing raid progress write stays unchanged.
2. Existing raid completion idempotency stays unchanged.
3. Server resolves the best active shard pool for the raid:
   - active raid override
   - active campaign pool
   - no pool
4. Server computes award and decrements budget the same way as quest approval.

Budget rule:

- If remaining budget is lower than the selected bonus, grant only the remaining budget as bonus.
- If remaining budget is zero, grant only the existing base amount.
- The ledger dedupe key must continue preventing duplicate grants per user/action.

Atomicity rule:

- Budget reservation and ledger creation must be coordinated server-side.
- Phase 2A should add a small SQL RPC such as `grant_shards_with_featured_pool`.
- The RPC receives user id, source fields, base amount, requested pool bonus, pool id, reason, and metadata.
- Inside one database transaction it checks the ledger dedupe key, locks the pool row, clamps bonus to remaining budget, decrements `remaining_shards`, inserts the shard ledger row, and returns the final award.
- If the dedupe key already exists, it returns `alreadyGranted` and does not decrement pool budget.
- If no pool id is provided, the same RPC or fallback helper writes the base ledger entry without a pool decrement.

## Portal UX

Phase 2A should add a compact Shard Boost surface without making campaign creation noisy.

Campaign creation:

- Add a Shard Boost module in the launch/readiness area.
- Default choices:
  - No boost
  - Base Featured Pool: 10,000 shards, +25 to +40 bonus
  - Boost Pool: 25,000 shards, +40 to +70 bonus
- Show estimated user-facing copy before launch.
- Keep advanced fields tucked behind a small edit action.

Campaign detail or campaign board:

- Show pool status, remaining shards, issued shards, linked actions, start/end window, and depletion.
- Allow pause/resume/end.
- Allow creating an override for a specific quest or raid after the campaign exists.

The portal copy should help projects understand what to do:

- "This pool increases user motivation on featured actions."
- "Budget depletes only when verified users complete valid actions."
- "A campaign pool covers all linked actions unless an override exists."

## Webapp UX

Quest cards and quest detail:

- Show `Shard Boost Live` when a pool is active.
- Show earn range like `+50 base +25-40 boost`.
- Show a compact remaining meter for active pools.
- Keep non-boosted quests visually calm.

Raid cards and raid detail:

- Show the same boost badge and remaining meter.
- Confirmation success message should mention total shards and boost amount when awarded.

Campaign detail:

- Show a campaign-level boost summary when a campaign pool is active.
- Link users toward the boosted quests or raids.

## API And Helper Shape

Shared server helpers in webapp:

- `resolveFeaturedShardPoolForQuest`
- `resolveFeaturedShardPoolForRaid`
- `calculateShardAwardWithPool`
- `grantShardsWithFeaturedPool`

These helpers keep budget and ledger behavior centralized so quest and raid routes do not each invent their own pool logic.
`grantShardsWithFeaturedPool` should call the database RPC for the final budget reservation and ledger write.

Portal helper/API shape:

- Store methods can read and mutate `featured_shard_pools`.
- A simple internal API route may be used if direct Supabase access becomes awkward, but Phase 2A should follow existing portal store patterns where possible.

## Analytics V1

For Phase 2A, analytics can be derived from the pool table and shard ledger:

- `pool_size - remaining_shards` = issued boost shards
- ledger count for `metadata.poolId`
- unique users from ledger entries
- linked action count
- depletion percentage

No separate analytics table is needed in Phase 2A.

## Error Handling

- Pool write fails in portal: show a clear inline error and do not block unrelated campaign creation.
- Pool lookup fails during webapp completion: fall back to existing base shard award and include a warning in server logs or route response.
- Pool budget decrement fails: the RPC returns a base-only grant or clear failure before any partial pool mutation is left behind.
- Duplicate completion: existing ledger dedupe returns `alreadyGranted` and does not spend pool budget again.

## Testing

Unit tests:

- Best pool resolution chooses action override before campaign pool.
- Expired, paused, draft, and depleted pools are ignored.
- Award calculation clamps bonus to remaining budget.
- Dedupe prevents double pool depletion.
- SQL/RPC behavior returns `alreadyGranted` without decrementing pool budget.

Route-level tests or focused integration tests:

- Quest approval grants base plus pool bonus.
- Raid confirmation grants base plus pool bonus.
- No active pool preserves Phase 1 grant behavior.

Build checks:

- Webapp typecheck and build.
- Portal typecheck/build.

## Rollout Plan

1. Add database migration for `featured_shard_pools`.
2. Add shared pool calculation and server helper tests.
3. Wire quest approval and raid confirmation through the helper.
4. Add pool summaries to webapp live data and boosted quest/raid cards.
5. Add portal pool types/store methods.
6. Add campaign creation Shard Boost module.
7. Add campaign detail or board pool management.
8. Verify local flows, then deploy webapp and portal.

## Out Of Scope For Phase 2A

- Full Lootbox Studio.
- Odds editing.
- USDC prize pools.
- User subscription passes.
- Complex sponsored package billing.
- Automated fraud review for high-value pools beyond existing trust posture.

These remain Phase 2B+ or later.
