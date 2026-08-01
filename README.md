# Trips — an AI travel assistant, focused on the trust moment

This is a **deterministic simulated prototype**. No real airline, payment,
or personal data is involved. No booking is made and no charge is issued.

## Problem statement

Consumer AI agents are increasingly asked to take *hard-to-reverse actions* on
people's behalf — pay, rebook, cancel, transfer. When those actions succeed,
they feel like magic. When they don't, they can cost money, lose a seat, or
split a party across flights, and they very quickly stop feeling like magic.

The design question is: **at the exact moment the agent is about to act, what
does trust look like on the screen?**

## Domain and exact action

- **Domain:** consumer travel.
- **Product:** *Trips* — a mobile travel application with an embedded AI trip
  assistant.
- **Action modelled:** the agent changes an existing domestic flight for one
  passenger, charges a fare difference, issues a replacement ticket, and
  releases the original flight and seat — in that order.

## Why the action is hard to reverse

- Money moves. A change fee and fare difference are charged the moment ticketing
  succeeds; refunds are slow, partial, or nonexistent.
- Inventory moves. Once the new ticket is issued, releasing the old seat is
  not free — reclaiming it may cost the fare difference again.
- Timing matters. Prices and seats can move between "approved" and "ticketed".
- Failure modes are asymmetric. A duplicate charge is far more expensive to
  recover from than a delayed confirmation.

## Scope and assumptions

- One adult passenger.
- One domestic one-way segment.
- Direct booking with the airline.
- Same airline for current and replacement flight.
- No infant, no special assistance, no visa implications.
- Saved payment method on file.
- Airline API supports a short provisional inventory hold (simulated).

Anything outside this — multi-city, groups, hotel/car changes, general flight
search, signup, loyalty, KYC — is intentionally out of scope.

## Visual concept

> **Map as context, AI as the operating layer, and explicit confirmation as the
> trust boundary.**

There are three surfaces, and only three:

1. **The map** — a persistent, full-screen satellite canvas carrying the BOM→BLR
   route. It is never dismissed, never scrolled away, and never rebuilt. The
   route changes colour to carry meaning: muted when nothing is proposed, blue
   and cyan while the assistant is working or holding a live proposal, amber when
   an option went stale, green once ticketed, lavender when a person has taken
   over.
2. **The assistant dock** — a dark panel anchored to the bottom at one of three
   heights, holding the conversation, the structured answer, and a composer that
   is always in the same place. This is where the product is *operated*.
3. **The two light sheets** — confirmation and the issued boarding pass. Light is
   reserved: it appears exactly twice, at the moment money is committed and the
   moment the outcome exists. That scarcity is what makes it read as "this is
   different".

### One map, mounted once

[`MapboxJourneyCanvas`](src/components/map/MapboxJourneyCanvas.tsx) is mounted at
the app shell and **never unmounted**. Every screen change is a camera move and a
paint update on the same map — which is why the route reads as one continuous
journey rather than eleven separate illustrations, and why no transition pays for
a style parse.

- **Style:** `mapbox://styles/mapbox/standard-satellite` with
  `config.basemap.lightPreset: 'night'`. Every label, road and boundary flag is
  switched off. The only text over the imagery is text about *this trip* —
  nothing on the map can contradict the itinerary.
- **Route layers:** `route-glow`, `route-base`, `route-progress`,
  `route-protected`, `origin-node`, `destination-node`, `plane-marker` — real
  GeoJSON layers in the `top` slot, each with `emissive-strength: 1` so they
  self-illuminate against a night basemap instead of rendering near-black.
- **Progress** is one `setData` on a sliced LineString plus a repositioned
  aircraft, not a restyle of the whole route.
- **Camera presets** per state ([`cameraPresets.ts`](src/components/map/cameraPresets.ts)) —
  wide while considering, tight on the aircraft while ticketing, settled over the
  destination once issued. Padding is computed from the **current dock height**,
  because the visible map is only the band above the dock; centring on the full
  container would put the route behind the panel.
- **Gestures are off by default.** Panning a map mid-payment is how people lose
  their place. An explicit "Explore route" control turns them on and pairs with a
  reset, and it only appears when there is a live basemap to explore.

### Nothing depends on the network

If the token is absent, WebGL is unavailable, the style errors, or loading
exceeds 9 s, the stage falls back to
[`MapFallback`](src/components/map/MapFallback.tsx) — the *same* geographic route,
projected through an equirectangular fit with the same dock-aware padding:

```
geoRoute(BOM, BLR)            ← turf: bearing → perpendicular offset → bezierSpline
   │
   ├── Mapbox live   → GeoJSON layers + map camera        (satellite imagery)
   └── No basemap    → fitProjector + SVG                 (stylised outline)
```

The journey visual never shows a void and every state stays reviewable offline.
Append `?basemap=off` to any demo URL to force that path.

Loading is a static local gradient sized identically to the map, faded out over
340 ms — not a spinner. The map arrives in well under a second on a warm cache,
and a spinner over a payment flow reads as "something is wrong".

**Mapbox attribution stays visible**, as their terms require. The map is
full-screen and the dock covers its bottom, so the attribution row floats just
above whatever height the dock is at, tracked through a `--dock-height` custom
property the dock keeps current.

`mapbox-gl` is dynamically imported, so it lands in its own chunk and never
touches the initial load; the app bundle stays ~126 kB gzipped.

### The assistant dock

[`AssistantDock`](src/components/dock/AssistantDock.tsx) sits at 32% / 55% / 82%
of the viewport. It is **not** a modal: it never traps focus and never stops the
map underneath being read. It carries a drag handle *and* an explicit
expand/collapse button, because a drag affordance alone is unreachable by
keyboard and invisible to a screen reader. Scroll position survives a height
change — a user who scrolled to an option and then expanded the dock wants to see
*more of that option*, not to be sent back to the top.

The composer is pinned below the panel and resolves typed text through a fixed
prompt table ([`composerPrompts.ts`](src/data/composerPrompts.ts)). Every prompt
both answers and *does* something; unmatched text says what the assistant can
actually do. This prototype contains no model, and a text field that silently
swallows input is a worse lie than one that admits its limits. The composer is
hidden entirely on the confirmation sheet — a text box beside a payment invites
input that cannot be honoured.

## AI identity — "Trip Pulse"

[`TripPulse`](src/components/ai/TripPulse.tsx) is two restrained rings, a centre
point, and a route spark. It has five states — `idle`, `working`, `resolved`,
`stopped`, `handoff` — and **animates only when the agent is actually doing
something**. Idle is a static mark.

It is not a mascot, not a face, not a magic wand, and not a full-screen orb. It
appears where the agent's involvement is the point: interpreting, searching,
refreshing, resolving into a check on success, stopping on a reprice, and
handing ownership to a person.

## Why this is not designed as a chatbot

The interesting part of an agent that spends money is not the conversation — it
is the moment language becomes a transaction. So the request is a compact
editable prompt capsule rather than a wall of message bubbles, and the agent
replies with **objects**: a flight ticket, a price, a boarding pass, a case.

Concretely:

- No chat bubbles as the layout primitive, and no "AI is typing…" placeholder.
- No character-by-character text animation.
- The agent's work is shown as progressive task completion over the live route
  (reading the booking → checking fare conditions → comparing 18 flights →
  verifying seats and fares), with a recommendation card forming beneath it.
  Completed steps resolve into checks. No hidden chain-of-thought is exposed.
- The interpretation is four editable chips ("Your trip brief"), not a
  full-height checklist.

## How motion communicates state

Motion is only used where it carries information — tokens in
[`src/motion/tokens.ts`](src/motion/tokens.ts):

| Moment | What the motion says |
|---|---|
| Camera move between states | where the assistant's attention is — wide while considering, tight on the aircraft while ticketing, settled over the destination once issued |
| Route colour change | the status of the proposal: live, stale, issued, paused |
| Progressive task list | what is done, what is in progress |
| Dock height change | how much attention this step deserves |
| Dock dims behind a sheet | the transaction now has focus |
| Route progress + aircraft | real transaction progress, with the release step visibly held until issuance |
| Night → dawn on success | the destination is reached — applied via `setConfigProperty`, never a remount |
| Price delta ₹4,790 → ₹6,240 | the amount moved, which is *why* the approval died |
| Correction chip replacement | exactly one constraint changed |
| Handoff bridge | ownership transferred — runs once, not looped |
| Success reveal | the pass rising into place, one soft halo, no confetti |

`prefers-reduced-motion` is honoured throughout: `useReducedMotion()` turns
morphs into fades, removes travel and parallax, stops the aircraft animating
along the arc, and keeps every state change immediate. No critical content
exists only inside an animation, and no infinite animation surrounds static
content.

## The Bounded Confirmation model

The user is **not** granting general authority to manage their trip. They are
approving one exact action bounded to:

- One passenger
- One flight
- One arrival time
- One seat
- One total charge
- One set of disclosed consequences

"Bounded Confirmation" is the **internal** name for the pattern. It never
appears on screen — the agent states the contract in plain language instead:

> I'll only rebook AI 639, seat 12A, for a total of ₹4,790. If the flight,
> seat, or price changes, I'll stop and ask again.

### Material-change invalidation

Approval is a typed object, not a boolean —
[`src/state/approval.ts`](src/state/approval.ts):

```ts
{ passengerId, selectedFlightId, date, departureTime, arrivalTime, origin, destination,
  seatNumber, seatType, baggageAllowance, fareClass, totalAmount, currency,
  paymentMethodId, approvedAt }
```

Every field in `MATERIAL_FIELDS` is material. After any action that can move
one, the reducer runs `reconcileApproval()`: if `materialDifferences()` is
non-empty the approval is **set to null** and the specific difference is
recorded for the UI to explain. There is no path that reuses a stale approval
and none that silently substitutes another option.

Demonstrable in the prototype:

- **Reprice** (`?state=price-change`) — total moves ₹4,790 → ₹6,240, approval
  voided. "Review the ₹6,240 option" opens confirmation with the CTA reading
  *Pay ₹6,240 & rebook* and an explicit over-limit notice. The ₹4,790 approval
  is never reused.
- **Payment method** — switching to the second simulated card on the
  confirmation screen voids the approval and says so.
- **Different flight** — selecting AI 647 rebuilds the approval target, and the
  confirmation, execution and success screens all carry ₹3,840 / seat 15C.

All constraint values are derived from one typed scenario object
([`src/data/scenario.ts`](src/data/scenario.ts)) with derived predicates
(`fitOption`, `matchingOptions`, `briefSummary`), so the brief, the match
summary, the price warnings and the case context cannot disagree with each
other.

## State map

Implemented as a typed reducer in [`src/state/machine.ts`](src/state/machine.ts).

```
interpreting
  └─▶ proposal ─────┬───▶ confirmation ──▶ executing ──▶ success
                    │                                └─▶ failure_price_changed ─┐
                    │                                └─▶ escalation_partial_transaction
                    ├───▶ adjust_request ─▶ alternatives ─▶ proposal
                    ├───▶ failure_misread ─▶ proposal (with corrected constraint)
                    └───▶ rejected
```

Transitions are dispatched actions, not effects of animation timing.

## Component architecture

```
src/
  App.tsx                   shell: map + top controls + dock + light sheets
  config/env.ts             the only reader of import.meta.env
  data/scenario.ts          single typed source of truth + derived predicates
  data/composerPrompts.ts   the composer's deterministic prompt vocabulary
  data/caseContext.ts       the packet handed to a human specialist
  state/machine.ts          reducer, execution ordering, approval reconciliation
  state/approval.ts         ApprovalObject, MATERIAL_FIELDS, materialDifferences
  state/surface.ts          state → camera, route tone, dock height, map chips
  state/demoStates.ts       slugs ↔ states (incl. variant slugs), URL read/write
  motion/tokens.ts          durations, springs, reduced-motion helpers
  components/
    map/                    MapboxJourneyCanvas (the one persistent map),
                            JourneyStage (live ↔ fallback + loading),
                            MapFallback, mapLayers.ts (GeoJSON sources/layers),
                            cameraPresets.ts, routeStyle.ts, MapChips,
                            MapExploreControl
    dock/                   AssistantDock, DockComposer, DockFlightRow,
                            DockStatusList, DockControls (segmented, choice,
                            toggle), DockPrimitives (card, disclosure, note),
                            night.ts (shared night-surface classes)
    journey/                geo.ts (turf route, slicing, projections),
                            RouteLayer (offline SVG route + markers + aircraft)
    ai/                     TripPulse, AgentProgress, InterpretedBrief
    flight/                 FlightTicket, BoardingPass, TicketPerforation,
                            RouteGlyph
    transaction/            PriceBreakdown, ApprovalSummary, PaymentMethodSheet
    support/                CaseDetailsSheet, SpecialistChatSheet
    shared/                 BottomSheet, Disclosure, DemoStateMenu
    shell/                  AppShell, TopControls, CurrentTripSheet
    domain/                 ConfirmationSheet, SuccessSheet
  panels/                   dock content per state — TripPanel, RefinePanel,
                            ExecutionPanel, MisreadPanel, HandoffPanel,
                            SuccessPanel, OutcomePanels (rejected + reprice)
```

Each panel exports its body *and* its pinned actions from one file, so the
decision about what belongs in the scroll area versus the always-visible footer
lives beside the content it applies to.

`TripPanel` serves `interpreting`, `proposal` **and** `confirmation`: they are one
continuous surface. Keeping the proposal in the dock while the confirmation sheet
is up means closing that sheet returns to exactly the surface it covered, with
focus landing back on the control that opened it.

## Confirmation rationale

Design decisions on the confirmation screen, and why:

- **The amount lives inside the CTA.** "Pay ₹4,790 & rebook" — verb + amount +
  object. Not "Confirm", not "Continue", not "Yes". The number the user is
  approving is the same number they will see on their statement.
- **Old → new as two ticket states, not a table.** The current flight is a
  quieter, compressed ticket; the replacement is dominant and arrives via a
  shared-element morph from the card the user tapped. A directional marker
  connects them. Strikethrough is not the comparison device — the movement is.
  Beneath it, three plain consequences: arrive 6h 25m earlier, window seat
  retained, baggage remains 15 kg.
- **One dominant total.** ₹4,790 at display size with "payable now", fee
  breakdown behind a disclosure, payment method named in full with a **working**
  change action. No hidden fees.
- **Consequence preview as a sequence.** Three compact steps — recheck fare and
  seat → issue AI 639 → release AI 621 — plus one sentence: your current ticket
  stays active until the replacement is issued. This matches the execution
  tracker exactly.
- **The promise, in the agent's voice.** One sentence naming flight, seat and
  total. Not labelled with an internal pattern name.
- **Progressive disclosure of fare rules.** Compact accordion, not a modal
  wall. No required checkbox, no typed confirmation phrase, no fake countdown,
  no artificial urgency.
- **Second CTA is symmetric.** "Keep AI 621" sits directly under the primary.
  Rejection is a first-class outcome with its own reassuring screen, not a
  footnote.
- **Focus is not placed on the payment action.** Opening the sheet focuses the
  dialog container, so a stray Enter cannot approve a charge.

## Failure taxonomy

Two distinct failure states — each with its own repair path — plus one
escalation:

1. **Price changed after approval (`failure_price_changed`).**
   Trigger: the airline reprices between approval and ticketing. The user's
   previous approval is *automatically invalidated* because a material field
   (total) changed. The screen states plainly what happened, that nothing was
   charged, and gives three routes forward: find another under the original
   cap, review the higher-price option (which would require a fresh approval),
   or keep the current flight.

2. **AI misread the request (`failure_misread`).**
   Trigger: the user tells the agent it misinterpreted (arrive-by vs
   depart-by). The agent acknowledges the specific error, confirms no side
   effects, and asks *one* focused clarification — a three-option radio, not
   a blank text box. On selection, the constraints update and the flow
   returns to proposal, not to the start.

3. **Escalation — partial transaction (`escalation_partial_transaction`).**
   See below.

## Escalation boundary

> Automation may continue when the transaction state is known and no financial
> or booking side effect has occurred. It stops and hands off when payment and
> ticket status disagree, the current-booking state is uncertain, or another
> automated attempt could create a duplicate authorisation, charge or ticket.

**Automation may repair**

- Misinterpreted request
- Unavailable option before payment
- Price change before payment
- Seat change before payment
- Constraint adjustment
- Known failure with no side effects

**Human handoff is required**

- Payment authorised but ticket not issued (implemented)
- Ticket and payment systems disagree
- Duplicate-charge or duplicate-ticket risk (implemented)
- Current booking status is uncertain (implemented in status panel)
- Repeated automated failure (documented)
- Policy exception requiring judgment (documented)
- User explicitly requests a person (overflow / handoff actions)

The handoff screen states the boundary in consumer language — "A travel
specialist needs to finish this safely" — and separates three certainty levels
rather than collapsing them into one error: **amber** for the genuinely pending
payment, **green** for the confirmed current ticket, **red** reserved for the
deliberately paused retry. Stopping is presented as a decision, not a crash.

The case packet (TR-2048) is built from the live model in
[`src/data/caseContext.ts`](src/data/caseContext.ts), so it cannot disagree with
what the user saw. It contains the original request, the constraints, the
selected flight, the approved amount, payment status, current-ticket status, the
airline's response, the number of automated attempts, and why retries are
paused. Both "Case details" and "Chat with a specialist" open working sheets that
show the packet, so the user can verify nothing is missing before speaking to
anyone. Nothing is retried automatically.

## Execution ordering

The execution order is a safety property, enforced in the reducer rather than in
presentation:

1. Rechecking fare and seat
2. Securing AI 639 and seat 12A
3. Issuing the replacement ticket
4. Releasing AI 621 — starts as **`blocked`**

Step 4 is created in the `blocked` state and `advanceExecution()` only promotes
it to `pending` once step 3 is `done`. Until then it renders with a lock icon
and the line "Waiting for the new ticket to be issued", so no tick order can
show the original as released first. On the canvas, the original booking is
drawn as a protected dashed route and a "still active" pill that only dims after
issuance.

Cancellation is not offered from the executing screen once ticketing has
started — a "Cancel" button there would be *inviting* the exact harm the system
tries to prevent. The screen explains why instead.

## Reference synthesis

The visual language is synthesised from several reference groups — flight/route
apps for the canvas and information density, AI-search products for progressive
work, Wallet-style passes for the ticket object, finance products for total
hierarchy and pending states, and mobile sheet/filter patterns for the controls.
Nothing is copied: no logos, branded assets, illustrations or screenshots from
any reference appear in the application, and every route graphic, ticket and the
AI mark are original.

Six extracted principles, the surface-by-surface mapping, and an explicit list
of what was deliberately avoided are in
[`docs/reference-synthesis.md`](docs/reference-synthesis.md).

The Mobbin MCP was configured but returned "requires a paid plan" for every
query, so no Mobbin citations were invented. Earlier notes are retained in
[`docs/mobbin-research.md`](docs/mobbin-research.md).

## How to run the prototype

```bash
npm install
npm run dev        # dev server on http://localhost:5173
npm run build      # tsc -b && vite build — passes with 0 errors
npm run preview    # serve the production build locally
```

Node 18+ is fine (developed on Node 25). No backend.

### Environment configuration

```bash
cp .env.example .env.local   # then fill in the value
# VITE_MAPBOX_TOKEN=pk....
```

`.env.local` is git-ignored (`*.local`, plus explicit `.env.local` entries). The
value is read in exactly one place —
[`src/config/env.ts`](src/config/env.ts) — via `import.meta.env.VITE_MAPBOX_TOKEN`
and is never written into source.

Two things worth knowing about client-side env values:

- Anything prefixed `VITE_` is **inlined into the browser bundle** by design, so
  it is readable by anyone who loads the page. That is acceptable only for a
  Mapbox *public* (`pk.`) token, which is intended for browser use and should be
  restricted by URL in the Mapbox account. `src/config/env.ts` throws if a secret
  (`sk.`) token is supplied.
- `hasMapboxToken` is false when unset, and the canvas falls back to the
  stylised SVG route rather than failing. **The prototype is fully functional
  with no token at all** — every state and every control works; only the basemap
  underneath changes. `?basemap=off` forces that path on demand.

### Verification scripts

Three Puppeteer scripts drive the running app. They use a locally installed
Chrome (override with `CHROME_PATH`) and default to `http://localhost:5173`
(override with `BASE_URL`).

```bash
node scripts/verify.mjs   # screenshots all 13 slugs at 390×844, 360×640 and desktop;
                          # reports console errors, overflow and sub-44px targets
node scripts/flows.mjs    # 45 behavioural checks across every interactive path
node scripts/a11y.mjs     # computed contrast ratios, keyboard reachability,
                          # focus visibility, live regions, 200% zoom

# Exercise the offline route instead of the Mapbox basemap:
EXTRA_QUERY=basemap=off node scripts/verify.mjs
EXTRA_QUERY=basemap=off node scripts/a11y.mjs
```

The scripts enable software WebGL so the basemap renders headlessly, and treat
basemap tile-fetch failures as environmental rather than as application errors.
`flows.mjs` opens one warm-up page first: a cold dev-server compile plus a
software-WebGL style parse both block the main thread and delay the app's own
`setTimeout`s, and the timing-sensitive checks should measure the product rather
than the harness.

Contrast is **computed from rendered colours**, compositing every translucent
ancestor. Elements floating over the map are marked `data-on-dark` so the audit
resolves them against the night surface rather than against whatever the map
happens to be painting. That constraint is also why the segmented control's
selected fill is a real background on the label rather than an
absolutely-positioned sliding pill — a ratio has to be provable from the DOM, not
just visually true.

## URLs for each demo state

Also accessible from the top-bar overflow menu ("Demo states"). All URLs are
relative to the dev server (default: `http://localhost:5173`).

| State | URL |
|---|---|
| Interpreting the request | `/?state=interpreting` |
| Proposal | `/?state=proposal` |
| Adjust the brief | `/?state=adjust` |
| Alternatives | `/?state=alternatives` |
| Confirmation review | `/?state=confirmation` |
| Executing (rebooking) | `/?state=executing` |
| Success | `/?state=success` |
| Boarding pass | `/?state=ticket` |
| Failure — price changed | `/?state=price-change` |
| Failure — AI misread | `/?state=misread` |
| Human handoff | `/?state=handoff` |
| Talking to Priya | `/?state=support` |
| Kept current flight | `/?state=rejected` |

The default (no `?state=` parameter) runs the happy path from `interpreting`.

Every slug goes through one entry point (`applySlug` in
[`src/App.tsx`](src/App.tsx)) shared by the URL, browser back/forward, and the
demo menu — so a directly-opened state is set up exactly as if reached by using
the product. `price-change` and `handoff` dispatch their triggering actions
rather than merely switching screens, so the invalidation and partial-transaction
data are real in those states.

`ticket` and `support` are **variant slugs**: they point at a *view* of a state
rather than a distinct position in the flow (`success` with the pass already
open; `escalation_partial_transaction` with Priya's thread already open). They are
reachable and stay in the address bar, but the app never rewrites the URL *to*
them — that is what `canonicalSlug()` in
[`src/state/demoStates.ts`](src/state/demoStates.ts) enforces.

## Known limitations

- **Everything is simulated.** All airline, fare, seat, payment and ticketing
  behaviour is fixture-driven. No network request is made, no booking exists and
  no charge is issued. The boarding-pass barcode is a decorative, non-scannable
  pattern and is labelled as such on the pass. Real integrations would need real
  error models and idempotency keys.
- **Two map renderings to maintain.** The Mapbox layers and the offline SVG
  outline share one route definition and one padding function, but they are still
  two visual paths and both need checking after map changes. The suite covers
  both (`EXTRA_QUERY=basemap=off`).
- **Satellite imagery costs bandwidth.** Standard Satellite at night is the right
  material for this product, but it is heavier than a vector style and the first
  load is visible on a cold cache. A production build would consider a lower
  `maxZoom`, a raster fallback on slow connections, and preloading only the
  BOM–BLR corridor.
- **The composer is a lookup table, not a model.** It routes a fixed vocabulary
  to real actions and says so when it cannot match. That is honest for a
  prototype, but it is not the interaction a real assistant would have, and the
  suggestion chips do a lot of work to keep users inside the vocabulary.
- **The offline outline is an abstraction.** A projected, stylised outline of the
  Indian subcontinent with approximate coastal waypoints — enough for the route
  to sit credibly on land, not a survey-grade boundary.
- **The public Mapbox token ships in the bundle.** That is how `VITE_`-prefixed
  values work and is expected for a `pk.` token, but it means the token must be
  URL-restricted in the Mapbox account and rotated if it leaks. A production
  build would proxy tiles through a backend instead.
- **Executing timings** are scripted (~3.2 s total). In production these would be
  event-driven and could last 20 s+; the copy and ordering would hold up but the
  "leave and be notified" affordance would carry more weight.
- **One passenger, one segment only.** Multi-passenger and multi-segment cases
  would need the approval sentence to be plural and to enumerate seats; the
  model still applies.
- **Payment UI is representational.** Two simulated saved cards; adding a card is
  explicitly out of scope rather than a dead control. No real card entry, no 3DS.
- **Notifications** are an in-app toast; the real system would need push, email
  and in-app hooks.
- **Two alternatives only.** With a longer result list, the comparison view would
  need sorting and filtering rather than a fixed difference table.
- **Mobbin citations are absent** because the MCP requires a paid plan; recorded
  explicitly rather than fabricated.

## What I'd test with users next

1. **Comprehension of the bounded promise.** Do users understand that they are
   *not* approving future changes? Ask them what happens if the fare shifts
   by ₹100 between tap and ticketing.
2. **CTA copy hierarchy.** Compare "Pay ₹4,790 & rebook" against "Confirm
   change" and against "Approve ₹4,790". Track abandonment rate and
   post-tap regret survey.
3. **Diff comprehension.** Given the old → new ticket transition, can users
   state the key change (arriving 6h 25m earlier) in one sentence? Does the
   morph help or does it need the strikethrough back?
4. **Price-change repair.** In the invalidated state, do users understand
   that nothing was charged? Do they still trust the agent?
5. **Handoff completeness.** Do users perceive the case as "already
   started" or as "starting over"? Measure time-to-first-message with the
   specialist and specialist's clarifying-question count.
6. **Reject friction.** Is "Keep current flight" too easy to miss? Is it
   over-emphasised? Compare rejection rate against qualitative regret.
7. **Executing screen anxiety.** Do users leave the screen when told they
   can? Do they receive and trust the notification-on-completion promise?
8. **Does the canvas earn its space?** The route reads as credibility, but it
   costs roughly a third of the first viewport. Test the proposal with and
   without it against time-to-decision and perceived trustworthiness.
9. **Is Trip Pulse legible as "the agent"?** Ask users what the mark means and
   when they expect it to move. If it reads as decoration, it should go.
