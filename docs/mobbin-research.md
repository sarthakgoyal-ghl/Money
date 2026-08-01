# Mobbin research notes

## Connection status

The Mobbin MCP server was configured and reachable, but every `search_screens`
call returned the same authentication response:

> "Mobbin MCP requires a paid plan. Upgrade at https://mobbin.com/pricing to
> continue."

Per the assignment brief — **"If Mobbin MCP is unavailable, do not invent
references"** — no screens are cited. The design is therefore driven by the
detailed interaction specification in the brief, augmented by publicly
observable patterns from consumer travel and fintech apps. All principles below
are stated at the pattern level, not attributed to any individual product.

## Patterns considered (no specific screens claimed)

The categories the brief asked me to search for are still the ones this design
targets. Rather than fabricate Mobbin citations, I list the observable pattern
families that shaped each screen and the deliberate decision that followed.

### Amount-in-the-CTA on financial confirmation

- **Pattern family**: Neobanks (Revolut / Wise / Monzo) put the exact amount
  and destination inside the primary button copy on transfer review screens
  ("Send £120.00"). Ride apps do the same for cancellation fees.
- **Adopted**: The confirmation CTA reads **"Pay ₹4,790 & rebook"**, not
  "Confirm" or "Continue". The verb + amount + object is the single most
  important trust signal at the point of no return.
- **Avoided**: A generic "Confirm" that lets the total sit above the fold and
  become psychologically detached from the tap.

### Old-vs-new comparison for date/time change

- **Pattern family**: Airline "manage booking" flows show current and new
  itineraries side by side with the old flight number visibly de-emphasised.
- **Adopted**: Two-column diff, strikethrough on the old flight number, subtle
  well tint on the new column, plus a plain-language "What changes" section
  (arrives 6h 25m earlier, window retained, bag retained). Numbers are
  tabular-lined up for scannability.
- **Avoided**: A boat-load of duplicated fields that make the user hunt for the
  actual delta.

### Progressive disclosure of fare rules

- **Pattern family**: Most airlines dump 2–3 pages of fare rules in a modal.
  Better implementations inline a "View fare conditions" accordion.
- **Adopted**: A compact accordion with the two clauses that actually matter
  in this scenario (change fee applies, hold-release timeline). The rest is
  intentionally out of scope.
- **Avoided**: Modal legal walls, required checkboxes, and typed confirmation
  phrases — all of which slow the tap without adding comprehension.

### Bottom-sheet confirmation for destructive/irreversible actions

- **Pattern family**: Ride-hail cancellation, delivery cancellations, and
  crypto-app transaction confirmations use a full-height bottom sheet with a
  grabber, a specific amount, and two CTAs.
- **Adopted**: `ConfirmationSheet` uses a rounded-top full-height sheet, a
  grabber, a clear title, and two vertically stacked CTAs (primary + reject).
  Focus is trapped, `Escape` closes, and body scroll is locked while open.
- **Avoided**: A tiny confirmation alert with a "Yes/No" pair, which is the
  usual failure mode.

### AI action proposal (not chat bubbles)

- **Pattern family**: Emerging AI-native surfaces (assistant PRs from travel
  and productivity apps) use *structured transactional cards* rather than
  scrolling chat bubbles. When the agent proposes an action, it renders a
  domain artefact (flight card, transfer card) — not a paragraph.
- **Adopted**: A single user bubble at the top for context, then structured
  `ConstraintSummary` + `FlightCard` + rationale card + freshness stamp. This
  reads more like a native app screen than a chat.
- **Avoided**: Long typing animations, unexplained confidence percentages,
  visible chain-of-thought, and large assistant avatars.

### Payment-pending / partial-transaction status

- **Pattern family**: Payment apps and airline booking flows increasingly use
  a status panel with the words "Payment pending", "Booking pending", "Retry
  paused" rather than a single generic error.
- **Adopted**: `StatusPanel` on the handoff screen breaks the failure into four
  rows — Payment, New ticket, Current ticket, Automatic retries — each with a
  tone-coded dot. This lets the user *see* the inconsistency the agent detected.
- **Avoided**: A generic "Something went wrong" screen with a Retry button that
  could compound the harm.

### Case-based human handoff

- **Pattern family**: Better support handoffs (banking, travel) create a
  case ID up front, attach the full context, and preserve wait-time
  transparency.
- **Adopted**: `HumanHandoffCard` shows the case ID (TR-2048), estimated wait,
  and three well-differentiated ways to reach a human (chat / call / details).
  The user is told, in one sentence, that the specialist already has the full
  context.
- **Avoided**: A support widget that asks the user to describe the problem
  again.

### Correction without restart

- **Pattern family**: Better assistants acknowledge misinterpretation, restate
  the wrong assumption, and offer *one* concrete clarification — usually a
  small radio list, not free text.
- **Adopted**: The misread state shows one focused radio group (Depart /
  Arrive / Rewrite) and returns to proposal on selection. No restart, no
  guilt.
- **Avoided**: "Sorry, I didn't understand" followed by a blank text box.

### KYC document capture (Part 2)

- **Pattern family**: Monzo / Revolut / Wise / N26 all follow the same six-step
  document capture flow: prep → document type → live guidance → auto-capture →
  review → targeted retake, with a resume state on failure.
- **Adopted**: This is the redesign recommendation in
  [`docs/part-2-kyc-diagnosis.md`](./part-2-kyc-diagnosis.md). It is *not*
  built inside this travel prototype (out of scope).

## Five design principles this prototype ships against

1. **Structured over conversational.** When the agent is about to act on money
   or a ticket, render a domain artefact (flight card, cost breakdown, status
   panel), not a paragraph in a chat bubble.
2. **The amount lives in the button.** The primary CTA on any hard-to-reverse
   action must name the verb, the object, and the exact charge. If the number
   changes, the CTA must invalidate.
3. **Bounded approval is a stated contract.** The confirmation screen names
   the flight, the seat, and the maximum charge in one sentence, and promises
   the agent will stop and ask again if any of them change.
4. **Order of execution protects the user.** The current booking is never
   released before the new ticket is issued. That order is visible in the
   execution timeline so the user knows their downside is protected.
5. **Automation stops before it doubles down.** When payment and ticket status
   don't match, the agent does not retry. It pauses, opens a case, and hands
   the user off with the full context intact.
