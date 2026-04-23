# Growth, Funnel, Revenue, And Retention Analytics Design

Date: 2026-04-23
Status: Approved design
Scope: Shared internal and customer-facing analytics for growth, attribution, revenue, retention, and benchmarks

## 1. Goal

Build the first complete Veltrix analytics operating layer so the company can measure the full path from traffic to retained revenue while customers can also understand how their own workspaces, projects, and communities are performing.

Phase 13 should make it possible to answer all of the following from one connected system:

- where traffic comes from
- where people leak out before signup, workspace creation, launch, or payment
- which sources create retained customers instead of low-quality traffic
- how workspace and community performance connect to conversion, expansion, and churn
- how a customer is performing versus a relevant peer cohort without exposing other customer data

## 2. Product Posture

Veltrix already has:

- accounts and onboarding
- billing and internal business control
- support and incident operations
- customer success and activation
- internal analytics surfaces with partial product and outcome reads

What is still missing is one analytics truth that connects:

- acquisition
- activation
- product performance
- revenue
- retention
- attribution
- benchmarks

Phase 13 should not create disconnected dashboards.

It should create one analytics machine with multiple views:

- internal founder and growth views
- internal business and success-linked trend views
- customer-facing workspace and project analytics
- benchmark context layered on top of customer-safe metrics

## 3. Scope

### 3.1 In Scope

- shared analytics event model
- shared snapshot and rollup model
- acquisition and commercial funnel analytics
- product and community performance analytics
- revenue and retention analytics
- first-touch, latest-touch, and conversion-touch attribution
- internal analytics workspace expansion
- customer-facing analytics modules and summaries
- benchmark cohorts and safe benchmark presentation
- trend and cohort reads that feed `Business`, `Success`, and customer analytics surfaces

### 3.2 Out of Scope

- external BI warehouse migration
- ad network integrations beyond stored attribution parameters and referrer tracking
- advanced MMM or multi-touch attribution modeling
- raw peer-account comparisons
- customer-visible access to other accounts' data
- custom CSV export tooling
- experimentation platform or A/B test orchestration

## 4. Recommended Approach

### Option A: Internal-only analytics

Build only the internal founder and growth dashboards first and leave customer analytics for later.

Pros:

- fastest
- least risky
- easiest to ship

Cons:

- customers still lack clear performance visibility
- benchmarks would arrive too late to matter
- growth and customer trust stay partially disconnected

### Option B: One analytics truth, multiple views

Build one shared analytics layer that powers:

- internal founder and growth analytics
- business and success trend context
- customer-facing account and project analytics
- benchmark presentation

Pros:

- strongest long-term architecture
- no contradictory metrics between internal and customer-facing surfaces
- lets attribution, revenue, activation, and retention finally read as one system

Cons:

- broader than a dashboard-only tranche

### Option C: BI-heavy analytics platform

Build a very deep slicing and reporting platform immediately.

Pros:

- maximally flexible

Cons:

- too broad for the current tranche
- risks producing a lot of reporting surface without enough operating value

### Recommendation

Build `Option B`.

This phase should produce one shared analytics operating layer with different read models and surfaces for:

- founders and internal operators
- customers
- benchmark-safe comparisons

## 5. Analytics System Model

Phase 13 should be structured as four connected truths.

### 5.1 Acquisition And Funnel Truth

Track the path from public touch to retained customer:

- anonymous visit
- pricing view
- signup started
- signup completed
- workspace created
- first project created
- first provider connected
- first campaign live
- checkout started
- paid converted
- retained
- expanded
- downgraded
- churned

### 5.2 Product And Community Truth

Track what happens after entry:

- time to first project
- time to first provider
- time to first live campaign
- time to first member activity
- repeat launch motion
- quest, reward, and raid performance
- member activation and comeback outcomes

### 5.3 Revenue And Retention Truth

Track the commercial consequences of product usage:

- MRR
- ARR run rate
- new MRR
- expansion MRR
- contraction MRR
- churned MRR
- renewal success
- failed renewal
- grace recovery
- retention by cohort

### 5.4 Benchmark Truth

Track customer-safe peer comparisons using only cohort rollups and range-based presentation.

Benchmarks should help a customer understand:

- how fast they activate versus peers
- how their workspace and campaign performance compares to similar accounts
- whether they are below, within, or above peer range

## 6. Funnel Model

### 6.1 Core Funnel States

The primary commercial funnel should use these normalized states:

- `anonymous_visit`
- `pricing_view`
- `signup_started`
- `signup_completed`
- `workspace_created`
- `first_project_created`
- `first_provider_connected`
- `first_campaign_live`
- `checkout_started`
- `paid_converted`
- `retained_30d`
- `expanded`
- `downgraded`
- `churned`

### 6.2 Core Funnel Metrics

The analytics system should expose at least:

- visit count
- pricing view rate
- signup start rate
- signup completion rate
- workspace creation rate
- first project rate
- first provider rate
- first campaign live rate
- checkout start rate
- paid conversion rate
- trial-to-paid conversion rate where relevant
- 30-day retention rate
- upgrade rate
- downgrade rate
- churn rate

## 7. Product And Community Metrics

### 7.1 Workspace And Project Metrics

- time to first project
- time to first provider
- time to first live campaign
- time to first member activity
- launch readiness score
- project activation rate
- repeat launch rate
- team adoption depth

### 7.2 Member And Community Metrics

- member activation rate
- quest completion rate
- reward claim conversion rate
- comeback recovery rate
- drift rate
- streak formation rate
- active member ratio

### 7.3 Operator Principle

These metrics should not exist as isolated charts.

Every metric should support a decision such as:

- acquisition source quality
- onboarding friction
- product setup bottleneck
- weak conversion path
- retention weakness
- expansion opportunity

## 8. Revenue And Retention Metrics

The revenue and retention layer should expose:

- MRR
- ARR run rate
- new MRR
- expansion MRR
- contraction MRR
- churned MRR
- revenue by plan
- seat growth
- project growth
- renewal success rate
- failed renewal rate
- grace recovery rate
- paid retention by cohort

This layer should connect directly to the billing and success systems instead of living as a separate finance island.

## 9. Attribution Model

Phase 13 should include attribution from day one.

### 9.1 Attribution Dimensions

Store:

- `utm_source`
- `utm_medium`
- `utm_campaign`
- `utm_term`
- `utm_content`
- `referrer`
- `landing_path`

### 9.2 Attribution Perspectives

Track attribution at three levels:

- `first_touch`
- `latest_touch`
- `conversion_touch`

This allows Veltrix to answer:

- where a customer first discovered the product
- which source influenced the final conversion
- which sources produce retained and expanding customers

### 9.3 Attribution Outcome Principle

Attribution should not stop at signup.

The system must make it possible to compare sources by:

- signup quality
- workspace creation quality
- paid conversion quality
- retained revenue quality

## 10. Customer-Facing Analytics

Customers should see their own analytics, not a founder dashboard.

### 10.1 Customer Surfaces

Customer-facing analytics should live inside existing surfaces rather than as a separate analytics app.

Primary surfaces:

- `/account`
- `/projects/[id]`
- existing analytics routes such as:
  - `/analytics/engagement`
  - `/analytics/rewards`
  - `/analytics/users`

### 10.2 Customer Analytics Content

Customers should be able to see:

- account performance snapshot
- project performance snapshot
- activation and launch performance
- member/community performance
- reward and quest performance
- benchmark context where safe

### 10.3 Customer-Safe Principle

Customer-facing analytics must show:

- only the customer's own data
- benchmark labels and ranges
- no raw peer account data
- no cross-customer leakage

## 11. Internal Analytics Surfaces

### 11.1 Internal Routes

Phase 13 should deepen the internal analytics workspace with:

- `/analytics`
- `/analytics/funnel`
- `/analytics/revenue`
- `/analytics/retention`
- `/analytics/attribution`

### 11.2 Relationship To Existing Internal Surfaces

`Business` and `Success` should remain separate operating cockpits:

- `Business` operates cash, billing pressure, and collections
- `Success` operates activation, expansion, and churn posture
- `Analytics` explains why those systems are behaving the way they are

### 11.3 Internal Use Cases

Internal analytics should allow Veltrix to answer:

- which sources are driving the best customers
- where customers leak out before becoming healthy, paid, or retained
- which plan tiers are expanding or contracting
- where activation and revenue problems begin
- whether a retention issue is tied to acquisition quality, onboarding friction, or product underuse

## 12. Benchmarks

### 12.1 Cohort Dimensions

Benchmark cohorts should be built from combinations of:

- plan tier
- account age band
- project category
- chain or ecosystem
- workspace size
- maturity stage

### 12.2 Benchmark Labels

Customer-facing benchmark labels should be:

- `below peer range`
- `within peer range`
- `above peer range`
- `top cohort`

### 12.3 Benchmark Safety Rules

Benchmarks must obey all of the following:

- minimum cohort size before display
- no benchmark for overly narrow cohorts
- only percentile, range, or band presentation
- no raw cross-customer rows
- no customer or project names from peers
- no benchmark language that implies another account's identity

## 13. Data Model

Phase 13 should use events plus snapshots plus benchmark rollups.

### 13.1 Event Layer

Recommended new event truth table:

- `growth_analytics_events`

Each event should store, where relevant:

- `event_type`
- `occurred_at`
- `auth_user_id`
- `customer_account_id`
- `project_id`
- `campaign_id`
- `session_id` or anonymous identifier
- attribution fields
- event payload

### 13.2 Snapshot And Rollup Tables

Recommended rollups:

- `growth_funnel_snapshots`
- `customer_account_growth_snapshots`
- `project_growth_snapshots`
- `retention_cohort_snapshots`
- `benchmark_cohort_snapshots`

### 13.3 Responsibilities

#### `growth_funnel_snapshots`

Stores daily funnel counts and conversion steps.

#### `customer_account_growth_snapshots`

Stores account-level activation, revenue, attribution, and retention posture.

#### `project_growth_snapshots`

Stores project and community performance posture.

#### `retention_cohort_snapshots`

Stores signup and paid retention cohorts by time window.

#### `benchmark_cohort_snapshots`

Stores peer-range rollups for customer-safe comparison.

## 14. Ownership Model

`veltrix-web` should own:

- public touch and pricing touch events
- signup flow events
- member journey and comeback events
- member-facing performance events

`admin-portal` should own:

- workspace and project operating events
- billing and success-linked analytics events
- internal analytics reads and founder/growth surfaces
- customer-facing portal analytics modules

Supabase/Postgres should remain the shared analytics truth across all views.

## 15. Route And Surface Summary

### Internal

- `/analytics`
- `/analytics/funnel`
- `/analytics/revenue`
- `/analytics/retention`
- `/analytics/attribution`

### Customer-facing

- account analytics modules
- project analytics modules
- existing customer analytics surfaces strengthened with benchmark-safe reads

### Benchmarks

Benchmarks should be embedded into customer metric modules rather than exposed as a separate benchmark app.

## 16. Build Order

1. analytics schema foundation
2. attribution capture
3. shared analytics read model
4. internal analytics workspace
5. customer-facing analytics modules
6. benchmark layer
7. rollout and verification

## 17. Definition Of Done

Phase 13 is complete when:

- Veltrix can explain the path from traffic to retained revenue end-to-end
- attribution is captured from public entry through paid conversion and retention
- founders can see funnel leaks, retention pressure, and source quality clearly
- customers can see their own account and project performance clearly
- benchmarks are visible without exposing peer data
- `Business`, `Success`, and `Analytics` read from the same analytics truth instead of disconnected metric islands
