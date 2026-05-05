# Shard Lootbox Economy Design

Date: 2026-05-05
Owner: VYNTRO product
Scope: portal, webapp, rewards, featured quests/raids, future user passes

## Summary

VYNTRO will add an earned shard currency and lootbox reward layer that strengthens the featured quest and raid business loop.

Projects can pay for featured placement. VYNTRO attaches shard earning to those featured actions, which motivates users to complete them. Users spend shards on lootboxes containing VYNTRO cosmetics, progression perks, shard refunds, and later curated sponsored rewards. This turns featured placement into a measurable performance product instead of only a visibility slot.

The model is platform-wide, earned-first, and designed to avoid paid gambling mechanics. XP remains reputation and progression. Shards become the activity currency users hunt and spend.

## Current Foundation

The current system already has several useful pieces:

- Rewards exist with rarity, claim state, cost, stock, claim method, delivery config, and funding posture.
- The webapp has reward listing, reward detail, and reward claim flows.
- The portal has a Reward Builder and project reward surfaces.
- Claims and payout safety exist as operational follow-through.
- User progress already has fields for `opened_lootbox_ids` and `unlocked_reward_ids`.

The missing product layer is the actual shard ledger, lootbox catalog, lootbox open endpoint, reward odds engine, inventory, and portal management surfaces.

## Product Principles

1. Shards are earned, not bought directly in Phase 1.
2. XP should not be spent. XP remains status, eligibility, and progression.
3. Lootboxes never return empty outcomes.
4. The best shard earning routes should be featured or sponsored actions.
5. Normal activity can earn shards, but at lower rates and with tighter caps.
6. USDC rewards are future curated reward pools, not a default mystery payout.
7. Every grant, spend, and box open must be server-decided and ledgered.
8. Trust posture can block, hold, or review high-value outcomes.

## Core Loop

1. A project buys featured placement for a quest or raid.
2. VYNTRO attaches a shard reward and optional sponsored shard pool.
3. Users see shard earning on featured quest and raid cards.
4. Users complete the action and receive shards if valid and within caps.
5. Users spend shards in the lootbox shop.
6. Box opens create inventory, claims, cosmetics, perks, or shard refunds.
7. The portal reports lift: completions, pool depletion, shards issued, box opens, and downstream claims.

This loop makes shards a demand engine for paid featured placement.

## Economy V1

Lootbox prices:

| Tier | Price | Requirement |
| --- | ---: | --- |
| Common | 250 shards | None |
| Rare | 750 shards | Level 3 |
| Epic | 2,000 shards | Level 8 or 3 featured completions |
| Legendary | 6,000 shards | Level 15 and clean trust posture |
| Mythic | 18,000 shards | Level 25, clean trust posture, and an active mythic or season window |

Shard earning ranges:

| Source | Base Shards |
| --- | ---: |
| Normal quest | 10-20 |
| Normal raid | 15-30 |
| Featured quest | 50-90 |
| Featured raid | 75-140 |
| Trading, DeFi, or platform event | 40-100 |
| Daily streak | 10 |
| Sponsored boost pool | Extra 25-100 while pool is live |

Weekly caps:

| Source Group | Weekly Cap |
| --- | ---: |
| Normal activity | 250 shards |
| Featured quest and raid activity | 1,200 shards |
| Platform events | 600 shards |
| Sponsored boost pools | Separate cap per pool or campaign |

Design intent:

- Common and Rare boxes should be reachable with regular weekly activity.
- Epic boxes should feel like a focused week-long chase.
- Legendary boxes should require sustained activity across multiple weeks.
- Mythic boxes should feel like season-level events.

## Sponsored Pool Ladder

Featured placement includes a standard shard layer. Projects can optionally buy more urgency through shard boost pools.

Phase 1 product:

| Tier | Pool Size | Bonus Per Valid Completion | Product Role |
| --- | ---: | ---: | --- |
| Base Featured | 10,000 shards | +25-40 | Included in standard featured package |
| Boost | 25,000 shards | +40-70 | Paid add-on with visible "Shard Boost Live" label |

Datamodel-ready future tiers:

| Tier | Pool Size | Bonus Per Valid Completion | Product Role |
| --- | ---: | ---: | --- |
| Prime | 60,000 shards | +70-100 | Launch push, stronger placement, countdown, rare-box eligibility boost |
| Mythic Event | 150,000+ shards | +100-180 | Major launch or partner event with a mythic lootbox window |

User-facing guardrails:

- Every sponsored pool shows remaining shards.
- Users can see when a pool is nearly depleted.
- If a user starts an action while the pool is active, the system can grant a short reserve window.
- Sponsored pool caps are separate from normal weekly caps.

## Lootbox Contents

Default VYNTRO reward pool:

- Profile frames
- Profile banners
- Glow effects
- Collectible badge variants
- Titles such as Shard Hunter, Raid Catalyst, and Vault Runner
- Small XP vouchers
- Streak protectors
- Shard refunds around 10-40%
- Early-access perks
- Limited UI themes

Sponsored and project reward pool:

- Allowlist spots
- Discord roles
- Partner access
- NFT or token perks
- Later USDC rewards with explicit budget, odds, eligibility, and audit trail

No empty box rule:

- Every box open returns at least one item, perk, voucher, cosmetic, sponsored reward, or meaningful shard refund.

## Odds V1

| Box Tier | Common | Rare | Epic | Legendary | Mythic |
| --- | ---: | ---: | ---: | ---: | ---: |
| Common | 70% | 22% | 6% | 1.8% | 0.2% |
| Rare | 35% | 45% | 15% | 4.5% | 0.5% |
| Epic | 0% | 35% | 45% | 17% | 3% |
| Legendary | 0% | 0% | 45% | 48% | 7% |
| Mythic | 0% | 0% | 0% | 55% | 45% |

Odds must be visible before opening a lootbox.

## Product Surfaces

Portal surfaces:

- Lootbox Studio: manage tiers, prices, eligibility, season windows, odds, and default pools.
- Shard Pool Manager: attach shard pools to featured quests and raids, set pool size, bonus range, cap, start time, and end time.
- Reward Pool Builder: manage VYNTRO cosmetics, sponsored project rewards, and later USDC reward pools.
- Analytics: track shards issued, shards spent, box opens, pool depletion, featured completion lift, inventory grants, and claims.

Webapp surfaces:

- Shard balance in navigation, profile, and rewards surfaces.
- Lootbox Shop with Common, Rare, Epic, Legendary, and Mythic cards using the supplied box assets.
- Box open flow: select box, confirm shard spend, reveal animation, result screen, inventory or claim route.
- Featured quest and raid cards showing shard earning and pool remaining.
- User inventory for cosmetics, perks, claims, and reward history.

## Data Model

Recommended tables:

- `shard_ledger`: all shard grants, spends, refunds, adjustments, and source references.
- `lootbox_tiers`: tier catalog, price, requirements, season windows, active state, and asset references.
- `lootbox_pools`: reward pools connected to a lootbox tier or event.
- `lootbox_pool_items`: item definitions, rarity, weight, fulfillment type, budget, and stock.
- `lootbox_opens`: each open result, selected item, odds snapshot, shard spend, and audit metadata.
- `user_inventory`: granted cosmetics, perks, vouchers, sponsored rewards, and claim references.
- `featured_shard_pools`: sponsored pool budgets for featured quests and raids.
- `user_passes`: future user subscription/pass entitlements.

The existing `opened_lootbox_ids` and `unlocked_reward_ids` fields can remain as compatibility helpers, but the ledger and open tables become the source of truth.

## Server Rules

Shard grants:

- Server verifies the quest, raid, event, or streak completion.
- Server checks source caps, weekly caps, pool budget, and trust posture.
- Server writes a positive shard ledger entry with source metadata.

Shard spends:

- Server checks balance and lootbox eligibility.
- Server writes a negative shard ledger entry.
- Server computes the lootbox result from the active pool odds.
- Server writes `lootbox_opens`.
- Server writes `user_inventory` or a claim record.

High-value outcomes:

- Legendary, Mythic, sponsored, token, NFT, and future USDC outcomes can enter a held or review state when trust signals require it.
- The user should still see a clear state, such as "won, pending review" instead of a silent failure.

## Passes And Future Monetization

Phase 1 does not sell shards directly.

Future $5, $10, and $15 user passes can add:

- Shard earning boosts
- Higher weekly caps
- Bonus daily claim lanes
- Cosmetic rewards
- Better reveal effects
- Season pass progression
- Early access to special windows

Future direct shard grants are possible, but paid-grant shards must be separated from USDC-eligible pools or governed by stricter eligibility rules.

## USDC Reward Rules

USDC rewards are not part of the default Phase 1 economy.

When enabled later:

- USDC pools require a fixed budget.
- Odds and maximum payout exposure must be visible.
- Every USDC result must write an audit trail.
- Trust posture and jurisdiction rules can block or hold payouts.
- Paid shard grants must not directly buy access to USDC chance pools unless the legal and compliance posture explicitly allows it.

## Phase Plan

Phase 1: Earned Shards and Basic Lootboxes

- Add shard ledger.
- Add lootbox tier catalog.
- Add basic VYNTRO reward pool.
- Add webapp shard balance and lootbox shop.
- Add server-side open endpoint.
- Add Common and Rare opening flows first, while storing all tiers.

Phase 2: Featured Shard Pools

- Add portal Shard Pool Manager.
- Attach shard pools to featured quests and raids.
- Add pool meters on webapp cards.
- Add sponsored pool analytics.

Phase 3: Lootbox Studio

- Add odds editing, reward pool editing, and season windows.
- Add inventory management for cosmetics and perks.
- Add Epic, Legendary, and Mythic controls.

Phase 4: Passes and Seasons

- Add user passes.
- Add season pass progression.
- Add pass-related shard boosts and caps.
- Add seasonal Mythic windows.

Phase 5: Sponsored and USDC Pools

- Add curated project-sponsored rewards.
- Add USDC reward pool support when business and compliance posture allow it.
- Add payout review integration and stronger audit reporting.

## Validation

Implementation should verify:

- A user cannot receive shards twice from the same non-repeatable completion.
- Weekly caps work by source group.
- Sponsored pools deplete correctly and never go negative.
- Lootbox outcomes are server-decided and ledgered.
- Shard balance equals ledger sum.
- A user cannot open locked tiers.
- No box can return an empty outcome.
- Trust holds apply to high-value outcomes.
- Portal analytics match ledger and open records.

## Assets

Initial assets supplied by product:

- Common lootbox: `common lootbox.webp`
- Rare lootbox: `rare lootbox.webp`
- Epic lootbox: `epic lootbox.webp`
- Legendary lootbox: `legendary lootbox.webp`
- Mythic lootbox: `mythic lootbox.webp`
- Shard currency: `shard.webp`

These assets should be copied into the webapp public asset tree during implementation and referenced through a shared asset registry.

## Open Decisions Closed In This Spec

- Shards are platform-wide.
- Lootbox economy uses the Balanced Chase model.
- Featured and sponsored routes are the strongest shard earners.
- Normal activity can earn shards, but with lower rewards and weekly caps.
- Boxes never return empty outcomes.
- Default rewards are VYNTRO cosmetics and perks.
- Sponsored rewards and USDC are later layers with explicit budgets and audit.
- Phase 1 starts earned-only, without direct shard sales.

## Phase 1 Implementation Notes

Phase 1 shipped the earned shard ledger, static tier catalog, default VYNTRO reward pool, server-side lootbox open endpoint, webapp shop, and first earning hooks from approved quests and confirmed raids. Sponsored pool manager, full Lootbox Studio, user passes, and USDC pools remain outside Phase 1 scope.
