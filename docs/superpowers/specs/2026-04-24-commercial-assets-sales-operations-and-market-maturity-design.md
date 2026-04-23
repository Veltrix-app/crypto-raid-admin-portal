# Commercial Assets, Sales Operations, And Market Maturity Design

Date: 2026-04-24
Status: Approved design
Scope: Public conversion surfaces, buyer and enterprise intake, internal commercial ops, and buyer-ready docs maturity

## 1. Goal

Build the first complete Veltrix market machine so the platform is not only operationally ready to launch, but also commercially clear, trustworthy, and easy to buy.

Phase 16 should make it possible to answer all of the following from one connected commercial system:

- what Veltrix is and who it is for
- how a new customer should start
- when someone should use `Free`, `Starter`, `Growth`, or `Enterprise`
- how buyers can move from pricing or trust review into signup, demo, or enterprise conversation
- how Veltrix internally tracks high-intent leads, buyer requests, and launch-ready accounts
- how docs support both product understanding and commercial evaluation

## 2. Product Posture

Veltrix already has:

- account and onboarding rails
- billing and plan enforcement
- support and incident operations
- customer success and expansion signals
- analytics, trust, and release discipline

What is still missing is one commercial truth that connects:

- public website conversion
- pricing and plan presentation
- enterprise and buyer evaluation
- request-demo and contact intake
- internal commercial follow-up
- docs as a sales and buyer education surface

Phase 16 should not create a disconnected marketing layer.

It should create one commercial substrate with four views:

- public conversion layer
- buyer and enterprise layer
- internal growth and commercial ops layer
- docs and market maturity layer

## 3. Scope

### 3.1 In Scope

- public website and conversion surface hardening
- pricing and package presentation maturity
- enterprise CTA and buyer intake posture
- request-demo / talk-to-sales / contact flows
- internal commercial ops workspace
- lead truth, notes, follow-up tasks, and intake records
- docs maturity for buyer education and product positioning
- alignment between pricing, trust, docs, support, and signup
- self-serve-first commercial posture with strong enterprise credibility

### 3.2 Out Of Scope

- full CRM replacement
- opportunity management, contracts, or quote automation
- outbound sales automation
- marketing automation platform replacement
- ad attribution vendor migration
- full brand redesign across every product surface

## 4. Recommended Approach

### Option A: Self-serve conversion only

Focus almost entirely on public website, pricing, and signup conversion.

Pros:

- fastest route to cleaner self-serve motion
- simple scope

Cons:

- too weak for enterprise credibility
- no real internal commercial follow-up system

### Option B: Enterprise-first sales posture

Build an enterprise-heavy buyer motion with stronger contact, evaluation, and internal sales flows than self-serve.

Pros:

- strong for enterprise deals
- credible for high-touch buyers

Cons:

- slows launch speed
- can weaken self-serve clarity
- risks over-optimizing for conversations instead of conversions

### Option C: Self-serve first, with enterprise credibility and lightweight internal commercial ops

Build a public conversion layer that is optimized for self-serve, while also supporting serious buyer evaluation and internal lead follow-up.

Pros:

- best launch posture
- fastest path to real traction
- keeps enterprise credible without building a heavy sales machine
- maps cleanly onto existing billing, trust, support, success, and analytics systems

Cons:

- broader than a pure website pass

### Recommendation

Build `Option C`.

This phase should produce one commercial operating layer that serves:

- self-serve customers
- enterprise buyers
- internal Veltrix commercial operators

## 5. Commercial System Model

Phase 16 should be structured as four connected truths.

### 5.1 Public Conversion Truth

Track and present the public commercial posture:

- what Veltrix is
- what outcomes it enables
- where a new customer should start
- what the plans mean
- when to self-serve
- when to talk to Veltrix

### 5.2 Buyer And Enterprise Truth

Track the buyer-evaluation layer:

- trust and pricing review
- enterprise CTA usage
- demo and contact requests
- enterprise requirements or concerns
- security and billing questions that indicate serious intent

### 5.3 Internal Commercial Ops Truth

Track what Veltrix needs to run calmly:

- leads
- lead state
- qualification posture
- owner and follow-up
- notes and next step
- conversion or loss outcome

### 5.4 Docs And Market Maturity Truth

Track the educational and buyer-support layer:

- pricing explainers
- product positioning docs
- workflow explainers
- trust and enterprise references
- launch and onboarding guidance that supports sales, not just product usage

## 6. Buyer Journey Model

Phase 16 should support three commercial journeys.

### 6.1 Self-Serve Journey

Core path:

- visit
- pricing review
- signup or start
- workspace created
- first activation
- paid conversion
- retained account
- expansion

This journey should optimize for:

- speed
- clarity
- low friction
- clear plan understanding

### 6.2 Buyer-Evaluation Journey

Core path:

- public visit
- trust and pricing review
- docs exploration
- demo or contact request
- qualification
- evaluation
- converted or cooled off

This journey should optimize for:

- confidence
- clarity
- enterprise credibility
- direct but bounded human follow-up

### 6.3 Internal Commercial Ops Journey

Core path:

- lead appears
- qualification
- owner assigned
- follow-up
- active evaluation
- converted, cooling off, or lost

This journey should optimize for:

- clear ownership
- next-step discipline
- not relying on memory or scattered inboxes

## 7. Lead States And Signal Model

### 7.1 Lead States

Phase 16 should use a clear v1 lead-state machine:

- `new`
- `qualified`
- `watching`
- `engaged`
- `evaluation`
- `converted`
- `cooling_off`
- `lost`

### 7.2 Signal Types

Commercial signals should be divided into:

#### Intent signals

- pricing deep view
- enterprise CTA
- trust center usage
- repeated visits
- buyer-doc usage
- support or contact before signup

#### Conversion signals

- signup
- workspace creation
- checkout start
- paid conversion
- upgrade

#### Risk signals

- interest without signup
- request with no follow-up
- evaluation open too long
- strong product interest but no activation

#### Expansion signals

- plan pressure
- repeat launches
- team growth
- multi-project growth
- enterprise/security questions from paid accounts

### 7.3 Core Rule

Not every visitor is a lead.

Veltrix should distinguish between:

- traffic
- interested buyer
- qualified lead
- active commercial conversation
- converted customer

## 8. Surface And Route Model

### 8.1 Public Conversion Layer

Public routes:

- `/`
- `/start`
- `/pricing`
- `/trust`
- `/talk-to-sales` or `/contact`
- optional `/enterprise`

These surfaces should explain:

- Veltrix positioning
- product value and launch outcomes
- package meaning
- self-serve vs enterprise posture
- trust and credibility
- next best action

### 8.2 Buyer And Enterprise Layer

Public buyer-facing surfaces should support:

- request-demo
- talk-to-sales
- trust review
- pricing review
- enterprise intake
- clear qualification cues

These may live across:

- `/pricing`
- `/trust`
- `/contact`
- `/enterprise`
- docs buyer pages

### 8.3 Internal Commercial Ops Layer

Internal portal routes:

- `/growth`
- `/growth/leads/[id]`

This surface should let Veltrix operators:

- review leads
- inspect buyer intent and source
- assign follow-up
- record notes
- manage lead state
- see converted and expansion-linked accounts

### 8.4 Docs Maturity Layer

Docs should include:

- product overview pages
- pricing and plan explainers
- launch workflow explainers
- trust and enterprise references
- customer and buyer guidance for how Veltrix fits into real launch operations

## 9. Data Model

Phase 16 should introduce the following core entities.

### 9.1 Lead Truth

- `commercial_leads`
- `commercial_lead_events`

These entities should store:

- contact and company information
- lead source and route
- qualification posture
- assigned owner
- lead state
- conversion linkage if the lead becomes a customer

### 9.2 Internal Follow-Up Truth

- `commercial_lead_notes`
- `commercial_follow_up_tasks`

These entities should store:

- sales or founder notes
- buyer concerns
- follow-up ownership
- due dates
- next-step discipline

### 9.3 Buyer Request Truth

- `demo_requests`
- `enterprise_intake_requests`

These entities should store:

- contact intake
- request type
- use case
- urgency
- team or company context
- enterprise requirements
- link to a qualified lead where appropriate

### 9.4 Derived Commercial Signals

The following may remain derived in v1:

- `commercial_intent_score`
- `enterprise_likelihood`
- `self_serve_likelihood`
- `lead_temperature`
- `expansion_readiness`

## 10. Ownership Model

### 10.1 `veltrix-web`

Owns:

- public conversion surfaces
- pricing
- trust-adjacent buyer handoff
- contact or demo request entry
- self-serve and buyer entry flow

### 10.2 `veltrix-docs`

Owns:

- buyer education layer
- workflow explainers
- pricing and plan explanation docs
- trust and enterprise references

### 10.3 `admin-portal`

Owns:

- internal `/growth`
- lead drilldowns
- internal notes and follow-up tasks
- commercial queue management

### 10.4 Shared Postgres

Owns:

- lead truth
- intake truth
- follow-up truth
- commercial event linkage

## 11. Build Order

### 11.1 Commercial Foundation

- SQL migration
- lead entities and contracts
- request and follow-up entities
- lead state model

### 11.2 Public Conversion Layer

- sharpen homepage
- sharpen `/start`
- polish `/pricing`
- improve commercial CTA structure
- tighten handoff into signup and sales

### 11.3 Buyer And Enterprise Layer

- contact or talk-to-sales surface
- optional `/enterprise`
- stronger enterprise CTA logic
- trust, pricing, and buyer-doc alignment

### 11.4 Internal Growth Workspace

- `/growth`
- `/growth/leads/[id]`
- lead queue
- enterprise requests
- follow-up tasks
- notes and owner posture

### 11.5 Signal Integration

- tie pricing, trust, docs, and contact usage into lead creation
- link converted customers back into lead truth
- surface expansion signals from billing, success, and analytics

### 11.6 Docs Maturity Pass

- product overview docs
- pricing docs
- workflow docs
- buyer-evaluation entry pages

### 11.7 Rollout And Verification

- deploy public surfaces
- verify request intake
- verify lead creation
- verify `/growth`
- verify docs and pricing coherence

## 12. Risks And Mitigations

### 12.1 Turning Phase 16 Into A CRM

Risk:

- scope expands into a heavy sales platform

Mitigation:

- keep v1 to lead truth, intake, notes, and follow-up
- no full opportunity or contract engine

### 12.2 Marketing Drift From Product Reality

Risk:

- public messaging becomes disconnected from the actual product

Mitigation:

- tie every commercial promise to an existing product or ops reality
- keep pricing, trust, support, success, and docs aligned

### 12.3 Enterprise Theater Without Real Signals

Risk:

- enterprise presentation looks strong, but internal follow-up is weak

Mitigation:

- treat buyer requests and enterprise intent as first-class internal objects
- give them an explicit internal queue and owner model

## 13. Definition Of Done

Phase 16 is only complete when:

- Veltrix has a clear public conversion story
- pricing and package presentation are launch-ready
- self-serve and enterprise entry paths are both obvious
- buyer and enterprise requests land in a real system
- internal `/growth` exists as a real commercial ops cockpit
- leads have states, notes, owner, and follow-up posture
- docs help sell and explain the product, not just document it
- trust, pricing, start flow, docs, and sales intake all tell the same commercial story

