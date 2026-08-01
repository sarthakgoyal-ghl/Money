import { useState } from "react";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import {
  DECISIONS,
  FUTURE_TESTS,
  FUNNEL_STEPS,
  SCENARIO,
  SCREENS,
  STATE_LINK_GROUPS,
  STATE_LINKS,
  protoHref,
} from "../handoverData";
import { FigmaButton } from "../FigmaButton";
import { ProtoLink, CtaRow } from "../ProtoLink";
import { Reveal, ScreenFigure, ScrollStack, StickyProductStory } from "../ScreenStory";
import { EASE } from "../motion";

export function ProposalStory() {
  return (
    <section id="proposal" className="vx-section vx-tone-off" aria-labelledby="proposal-heading">
      <Reveal className="vx-section-head">
        <p className="vx-eyebrow">[ proposal ]</p>
        <h2 id="proposal-heading" className="vx-display">
          The agent first shows
          <br />
          what it understood.
        </h2>
      </Reveal>
      <StickyProductStory
        layout="stack"
        steps={[
          {
            id: "interpret",
            label: "step 1 · interpretation",
            title: "What the agent understood",
            screen: SCREENS.assistant,
            body: (
              <p>
                The user’s timing, budget, seat preference, and travel date become
                explicit and editable — so the recommendation can be audited against
                the request.
              </p>
            ),
          },
          {
            id: "recommend",
            label: "step 2 · recommendation",
            title: "Why this option",
            screen: SCREENS.proposal,
            body: (
              <p>
                AI 639 is recommended because it arrives at 16:00, stays ₹210 below
                the limit, keeps a window seat, and is the earliest matching nonstop
                flight — while AI 621 remains booked until the replacement is issued.
              </p>
            ),
          },
          {
            id: "control",
            label: "step 3 · user control",
            title: "Compare, adjust, or keep",
            screen: SCREENS.alternatives,
            body: (
              <p>
                The user can compare another flight, adjust the brief, or keep AI
                621 — without surrendering agency to the recommendation.
              </p>
            ),
          },
        ]}
        footer={
          <CtaRow>
            <ProtoLink href={protoHref("proposal")} className="vx-btn vx-btn-primary">
              Open proposal
            </ProtoLink>
          </CtaRow>
        }
      />
    </section>
  );
}

export function ConfirmationStory() {
  return (
    <section
      id="confirmation"
      className="vx-section vx-tone-blue-soft"
      aria-labelledby="confirmation-heading"
    >
      <Reveal className="vx-section-head">
        <p className="vx-eyebrow">[ confirmation ]</p>
        <h2 id="confirmation-heading" className="vx-display">
          Approval is an exact contract,
          <br />
          not a generic confirmation.
        </h2>
      </Reveal>

      <Reveal className="vx-seal">
        <blockquote className="vx-seal-quote">
          <p className="vx-seal-kicker">What the agent is allowed to say</p>
          <p className="vx-seal-utterance">
            <span className="vx-seal-mark" aria-hidden="true">
              “
            </span>
            I’ll only rebook {SCENARIO.recommended.flightNo}, seat{" "}
            {SCENARIO.recommended.seat}, for a total of {SCENARIO.recommended.extra}.
            If the flight, seat, or price changes, I’ll stop and ask again.
            <span className="vx-seal-mark" aria-hidden="true">
              ”
            </span>
          </p>
        </blockquote>

        <aside className="vx-seal-ticket" aria-label="Approval object">
          <p className="vx-seal-kicker">Exact approval</p>
          <div className="vx-seal-ticket-body">
            <div className="vx-seal-swap" aria-label="Approved change">
              <div className="vx-seal-leg is-from">
                <span className="vx-seal-flight">{SCENARIO.current.flightNo}</span>
                <span className="vx-seal-meta">
                  {SCENARIO.current.times} · Seat {SCENARIO.current.seat}
                </span>
              </div>
              <span className="vx-seal-arrow" aria-hidden="true">
                →
              </span>
              <div className="vx-seal-leg is-to">
                <span className="vx-seal-flight">{SCENARIO.recommended.flightNo}</span>
                <span className="vx-seal-meta">
                  {SCENARIO.recommended.times} · Seat {SCENARIO.recommended.seat}
                </span>
              </div>
            </div>
            <dl className="vx-seal-terms">
              <div>
                <dt>Payable</dt>
                <dd>{SCENARIO.recommended.extra}</dd>
              </div>
              <div>
                <dt>Payment</dt>
                <dd>{SCENARIO.success.payment}</dd>
              </div>
              <div>
                <dt>Until issue</dt>
                <dd>{SCENARIO.current.flightNo} stays active</dd>
              </div>
            </dl>
          </div>
        </aside>
      </Reveal>

      <StickyProductStory
        layout="stack"
        tone="soft"
        steps={[
          {
            id: "review",
            label: "review the change",
            title: "Exact amount in the CTA",
            screen: SCREENS.confirmation,
            body: (
              <ul className="vx-anno">
                <li>Current versus replacement is visible</li>
                <li>“Pay ₹4,790 & rebook” names action and consequence</li>
                <li>Original ticket stays protected until issuance</li>
                <li>Safe order: recheck → issue → release</li>
              </ul>
            ),
          },
          {
            id: "payment",
            label: "payment and control",
            title: "Payment method is part of the contract",
            screen: SCREENS.payment,
            body: (
              <ul className="vx-anno">
                <li>Payment method is explicit</li>
                <li>Changing payment invalidates approval</li>
                <li>User can return and adjust</li>
                <li>Keep AI 621 remains a valid outcome</li>
              </ul>
            ),
          },
        ]}
        footer={
          <CtaRow>
            <ProtoLink
              href={protoHref("confirmation")}
              className="vx-btn vx-btn-primary"
            >
              Open confirmation
            </ProtoLink>
          </CtaRow>
        }
      />
    </section>
  );
}

export function RepairStory() {
  return (
    <section id="repair" className="vx-section vx-tone-white" aria-labelledby="repair-heading">
      <Reveal className="vx-section-head">
        <p className="vx-eyebrow">[ repair ]</p>
        <h2 id="repair-heading" className="vx-display">
          The AI can be wrong.
          <br />
          The outside world can change.
        </h2>
        <p className="vx-lede">
          Two failure modes, one rule: repair only while the system state is known
          and no financial side effect has occurred.
        </p>
      </Reveal>

      <ScrollStack className="vx-repair-stack">
        <article className="vx-repair-case vx-stack-card">
          <div className="vx-repair-copy">
            <p className="vx-eyebrow">[ case 01 · AI misread ]</p>
            <h3>Repair the smallest possible unit</h3>
            <p>
              When the agent misunderstands a constraint, it should correct that
              unit — not restart the trip or touch booking and payment.
            </p>
            <ul className="vx-anno">
              <li>Acknowledge the error</li>
              <li>Preserve unaffected constraints</li>
              <li>No booking or payment changes</li>
              <li>Search again without restarting</li>
            </ul>
            <ProtoLink href={protoHref("misread")} className="vx-btn vx-btn-secondary">
              Open AI misread
            </ProtoLink>
          </div>
          <div className="vx-repair-visual">
            <ScreenFigure screen={SCREENS.misread} size="story" />
          </div>
        </article>

        <article className="vx-repair-case is-amber vx-stack-card">
          <div className="vx-repair-copy">
            <p className="vx-eyebrow">[ case 02 · fare changed ]</p>
            <h3>A changed price is a new decision</h3>
            <p className="vx-price-shift" aria-label="Fare moved from 4790 to 6240">
              <span>{SCENARIO.priceChange.previous}</span>
              <span aria-hidden="true">→</span>
              <strong>{SCENARIO.priceChange.next}</strong>
            </p>
            <p>
              The previous approval is cleared. Nothing was charged. AI 621 stays
              active while the user chooses again.
            </p>
            <ul className="vx-anno">
              <li>Previous approval is invalidated</li>
              <li>Nothing charged · original ticket protected</li>
              <li>Find another, keep AI 621, or approve ₹6,240</li>
            </ul>
            <ProtoLink
              href={protoHref("price-change")}
              className="vx-btn vx-btn-secondary"
            >
              Open price change
            </ProtoLink>
          </div>
          <div className="vx-repair-visual is-pair" aria-label="Fare-change screens">
            <ScreenFigure screen={SCREENS.priceChanged} size="story" />
            <ScreenFigure screen={SCREENS.higherPrice} size="story" />
          </div>
        </article>
      </ScrollStack>
    </section>
  );
}

export function HandoffSection() {
  const reduce = useReducedMotion();
  const status = [
    {
      label: "Payment",
      value: SCENARIO.handoff.payment,
      tone: "warn" as const,
    },
    {
      label: "Replacement",
      value: SCENARIO.handoff.ticket,
      tone: "danger" as const,
    },
    {
      label: "Current ticket",
      value: SCENARIO.handoff.current,
      tone: "safe" as const,
    },
    {
      label: "Retries",
      value: SCENARIO.handoff.retries,
      tone: "paused" as const,
    },
  ];

  return (
    <section
      id="handoff"
      className="vx-section vx-handoff"
      aria-labelledby="handoff-heading"
    >
      <div className="vx-handoff-atmosphere" aria-hidden="true">
        <div className="vx-handoff-sky" />
        <div className="vx-handoff-mist is-top" />
        <div className="vx-handoff-mist is-mid" />
        <div className="vx-handoff-mist is-bottom" />
        <div className="vx-handoff-clouds is-far">
          <img src="/figma/cloud-backdrop.jpg" alt="" draggable={false} />
        </div>
        <div className="vx-handoff-clouds is-near">
          <img src="/figma/cloud-backdrop.jpg" alt="" draggable={false} />
        </div>
      </div>
      <Reveal className="vx-section-head">
        <p className="vx-eyebrow">[ human handoff ]</p>
        <h2 id="handoff-heading" className="vx-display">
          Automation stops
          <br />
          before another attempt
          <br />
          can increase harm.
        </h2>
        <p className="vx-lede">
          Case {SCENARIO.handoff.caseId} opens the moment payment and ticketing
          disagree — with every safe state still intact.
        </p>
      </Reveal>

      <div className="vx-handoff-status" aria-label="Transaction state at handoff">
        {status.map((item) => (
          <div key={item.label} className={`vx-handoff-stat tone-${item.tone}`}>
            <span className="vx-handoff-stat-label">{item.label}</span>
            <span className="vx-handoff-stat-value">{item.value}</span>
          </div>
        ))}
      </div>

      <div className="vx-handoff-gallery" aria-label="Handoff beats">
        {[
          {
            id: "stop",
            eyebrow: "[ 01 · the stop ]",
            title: "Payment and ticketing no longer agree",
            body: `Another automated attempt could produce a duplicate authorisation, charge, or ticket. Case ${SCENARIO.handoff.caseId} is created.`,
            screen: SCREENS.handoff,
          },
          {
            id: "context",
            eyebrow: "[ 02 · context transferred ]",
            title: "The specialist already has the file",
            body: "Original request, constraints, selected flight, approval, payment status, ticket status, and automated attempts travel with the handoff.",
            screen: SCREENS.caseDetails,
          },
          {
            id: "priya",
            eyebrow: `[ 03 · ${SCENARIO.handoff.specialist.toLowerCase()} ]`,
            title: `${SCENARIO.handoff.specialist} already has the case`,
            body: "The user does not need to repeat what happened.",
            screen: SCREENS.specialist,
          },
        ].map((beat, index) => (
          <Reveal
            key={beat.id}
            className={`vx-handoff-shot is-${beat.id}`}
            delay={reduce ? 0 : index * 0.08}
          >
            <div className="vx-handoff-shot-media">
              <ScreenFigure screen={beat.screen} size="story" />
            </div>
            <div className="vx-handoff-shot-copy">
              <p className="vx-eyebrow">{beat.eyebrow}</p>
              <h3>{beat.title}</h3>
              <p>{beat.body}</p>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal className="vx-handoff-rule">
        <p className="vx-map-kicker">Stop condition</p>
        <p className="vx-handoff-rule-text">
          Automation may continue when the transaction state is known and no
          financial or booking side effect has occurred. It stops when payment and
          ticket status disagree, the current booking is uncertain, or another
          automated attempt could increase financial harm.
        </p>
      </Reveal>

      <div
        className="vx-handoff-ledger"
        role="group"
        aria-label="When automation continues or stops"
      >
        <Reveal className="vx-handoff-ledger-col is-continue">
          <p className="vx-map-kicker">May stay automated</p>
          <h3>Automation may repair</h3>
          <ul>
            <li>Misinterpreted request</li>
            <li>Unavailable option before payment</li>
            <li>Fare or seat change before payment</li>
            <li>Known failure with no side effects</li>
          </ul>
        </Reveal>
        <Reveal className="vx-handoff-ledger-col is-stop" delay={0.08}>
          <p className="vx-map-kicker">Must stop</p>
          <h3>Human handoff is required</h3>
          <ul>
            <li>Payment authorised but ticket not issued</li>
            <li>Duplicate-charge or duplicate-ticket risk</li>
            <li>Current-booking state uncertain</li>
            <li>User explicitly requests a person</li>
          </ul>
        </Reveal>
      </div>

      <CtaRow>
        <ProtoLink href={protoHref("handoff")} className="vx-btn vx-btn-primary">
          Open human handoff
        </ProtoLink>
        <ProtoLink href={protoHref("support")} className="vx-btn vx-btn-secondary">
          Open Priya conversation
        </ProtoLink>
      </CtaRow>
    </section>
  );
}

export function ExecutionSection() {
  return (
    <section id="execution" className="vx-section vx-neutral" aria-labelledby="execution-heading">
      <Reveal className="vx-section-head">
        <p className="vx-eyebrow">[ execution & success ]</p>
        <h2 id="execution-heading" className="vx-display">
          The safe order
          <br />
          is part of the interface.
        </h2>
      </Reveal>

      <ol className="vx-safe-order" aria-label="Safe execution order">
        {[
          { title: "Recheck", detail: "Fare and seat still match approval" },
          { title: "Secure", detail: "AI 639 and seat 12A held" },
          { title: "Issue", detail: "Replacement ticket confirmed" },
          { title: "Release", detail: "AI 621 cancelled only after issue" },
        ].map((step, index) => (
          <li key={step.title}>
            <span className="vx-safe-order-num" aria-hidden="true">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div className="vx-safe-order-copy">
              <strong>{step.title}</strong>
              <span>{step.detail}</span>
            </div>
          </li>
        ))}
      </ol>

      <div className="vx-feature-cards">
        <Reveal className="vx-feature-card">
          <ScreenFigure screen={SCREENS.executing} size="card" />
          <h3>Execution</h3>
          <p>The order is visible.</p>
        </Reveal>
        <Reveal className="vx-feature-card" delay={0.06}>
          <ScreenFigure screen={SCREENS.success} size="card" />
          <h3>Success</h3>
          <p>
            Booking {SCENARIO.success.bookingRef}, seat, charge, and released ticket
            are immediately verifiable.
          </p>
        </Reveal>
        <Reveal className="vx-feature-card" delay={0.12}>
          <ScreenFigure screen={SCREENS.boarding} size="card" />
          <h3>Boarding pass</h3>
          <p>The transaction ends with a usable travel object and activity history.</p>
        </Reveal>
      </div>
    </section>
  );
}

export function DecisionsAccordion() {
  const [open, setOpen] = useState<number | null>(0);
  const reduce = useReducedMotion();

  return (
    <section id="decisions" className="vx-section vx-neutral" aria-labelledby="decisions-heading">
      <Reveal className="vx-section-head">
        <p className="vx-eyebrow">[ decisions ]</p>
        <h2 id="decisions-heading" className="vx-display">
          The choices I expect
          <br />
          to be challenged on.
        </h2>
      </Reveal>

      <div className="vx-accordion">
        {DECISIONS.map((decision, index) => {
          const isOpen = open === index;
          return (
            <div key={decision.title} className={isOpen ? "vx-acc-row is-open" : "vx-acc-row"}>
              <button
                type="button"
                className="vx-acc-trigger"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? null : index)}
              >
                <span className="vx-acc-num">{String(index + 1).padStart(3, "0")}</span>
                <span className="vx-acc-title">{decision.title}</span>
                <span className="vx-acc-icon" aria-hidden>
                  {isOpen ? "−" : "+"}
                </span>
              </button>
              <AnimatePresence initial={false}>
                {isOpen ? (
                  <m.div
                    className="vx-acc-panel"
                    initial={reduce ? false : { height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={reduce ? undefined : { height: 0, opacity: 0 }}
                    transition={{ duration: reduce ? 0.01 : 0.35, ease: EASE }}
                  >
                    <div className="vx-acc-inner">
                      <p>{decision.body}</p>
                      {index === 4 ? (
                        <>
                          <ScreenFigure screen={SCREENS.kept} size="compact" />
                          <ProtoLink
                            href={protoHref("rejected")}
                            className="vx-btn vx-btn-primary vx-btn-sm"
                          >
                            Open rejection state
                          </ProtoLink>
                        </>
                      ) : null}
                    </div>
                  </m.div>
                ) : null}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function PartTwoSection() {
  const [expanded, setExpanded] = useState(false);
  const focusStep = FUNNEL_STEPS.find((step) => "highlight" in step && step.highlight);

  return (
    <section id="part-2" className="vx-section vx-neutral" aria-labelledby="part-2-heading">
      <Reveal className="vx-section-head">
        <p className="vx-eyebrow">[ part 2 · funnel diagnosis ]</p>
        <h2 id="part-2-heading" className="vx-display">
          Step 3 is where
          <br />
          the funnel breaks.
        </h2>
      </Reveal>

      <Reveal className="vx-diag">
        <div className="vx-diag-signal">
          <p className="vx-diag-stat">{focusStep?.complete ?? "61%"}</p>
          <div className="vx-diag-signal-copy">
            <h3>{focusStep?.name ?? "ID document upload"}</h3>
            <p>~29,100 of {focusStep?.entering ?? "74,600"} lost</p>
            <p className="vx-diag-hypothesis">
              Hypothesis: first-attempt capture failures.
            </p>
          </div>
        </div>

        <ol className="vx-diag-cascade" aria-label="Signup funnel · completion by step">
          {FUNNEL_STEPS.map((step) => {
            const rate = Number.parseInt(step.complete, 10);
            const isFocus = "highlight" in step && Boolean(step.highlight);
            return (
              <li key={step.step} className={isFocus ? "is-focus" : undefined}>
                <div className="vx-diag-cascade-step">
                  <strong className="vx-diag-cascade-rate">{step.complete}</strong>
                  <span className="vx-diag-cascade-name">{step.name}</span>
                  <div
                    className="vx-diag-cascade-track"
                    role="img"
                    aria-label={`${step.name} completes at ${step.complete}`}
                  >
                    <span style={{ width: `${rate}%` }} />
                  </div>
                </div>
              </li>
            );
          })}
        </ol>

        <div className="vx-diag-plan">
          <ol className="vx-diag-process" aria-label="Proposed capture change">
            {["Select", "Prepare", "Guide", "Retake"].map((label, index) => (
              <li key={label}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{label}</strong>
              </li>
            ))}
          </ol>
          <p className="vx-diag-ab">
            <span>Control · current upload</span>
            <span aria-hidden="true">→</span>
            <span>Variant · guided capture</span>
          </p>
          <p className="vx-diag-metric">
            Primary · Step 3 completion → 70–73%
          </p>
        </div>
      </Reveal>

      <div className="vx-rationale-panel">
        <button
          type="button"
          className="vx-btn vx-btn-secondary"
          aria-expanded={expanded}
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "Hide diagnosis detail" : "Show diagnosis detail"}
        </button>
        {expanded ? (
          <div className="vx-prose vx-diag-detail">
            <header className="vx-diag-detail-head">
              <p className="vx-eyebrow">[ diagnosis detail ]</p>
              <h3>Why Step 3, and what to test</h3>
            </header>

            <div className="vx-diag-detail-grid">
              <article className="vx-diag-detail-block">
                <h4>Focus</h4>
                <p>
                  Step 3 · ID document upload completes at only 61% and loses
                  ~29,100 of the 74,600 users entering the step — the largest
                  percentage and absolute loss in the funnel.
                </p>
              </article>

              <article className="vx-diag-detail-block">
                <h4>Hypothesis</h4>
                <p>
                  The funnel shows where users drop, not why. Treat this as a
                  hypothesis to validate: many users fail first capture from blur,
                  glare, cropping, missing edges, or an unsupported document. A
                  generic rejection after upload forces a full retry; after one or
                  two failures, users abandon.
                </p>
              </article>

              <article className="vx-diag-detail-block">
                <h4>Proposed change</h4>
                <ol className="vx-diag-detail-steps">
                  <li>
                    <strong>Before camera</strong>
                    <span>Select document type and see preparation guidance.</span>
                  </li>
                  <li>
                    <strong>During capture</strong>
                    <span>Live guidance; auto-capture when readable.</span>
                  </li>
                  <li>
                    <strong>After capture</strong>
                    <span>Review before upload; targeted retake on failure.</span>
                  </li>
                  <li>
                    <strong>Progress</strong>
                    <span>Save and resume without repeating OTP.</span>
                  </li>
                </ol>
              </article>

              <article className="vx-diag-detail-block">
                <h4>How we measure</h4>
                <dl className="vx-diag-detail-metrics">
                  <div>
                    <dt>Primary</dt>
                    <dd>Step 3 completion rate · directional target 70–73%</dd>
                  </div>
                  <div>
                    <dt>Supporting</dt>
                    <dd>
                      First-attempt success, retakes per user, median completion
                      time, camera-permission acceptance, save-and-resume usage,
                      server rejection reasons
                    </dd>
                  </div>
                  <div>
                    <dt>Guardrails</dt>
                    <dd>
                      Manual-review rate, document rejection rate, fraud
                      indicators, false acceptance risk, selfie-liveness completion
                    </dd>
                  </div>
                  <div>
                    <dt>Segments</dt>
                    <dd>
                      OS, device quality, document type, camera-permission state,
                      failure reason
                    </dd>
                  </div>
                </dl>
              </article>

              <article className="vx-diag-detail-block is-wide">
                <h4>Test design</h4>
                <p>
                  Run a user-level 50/50 A/B test. Hold constant: KYC provider,
                  validation rules, eligibility, risk logic, traffic eligibility,
                  and document acceptance.
                </p>
              </article>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function ScopeAndCta() {
  return (
    <div className="vx-night-band">
      <section id="scope" className="vx-section vx-tone-black" aria-labelledby="scope-heading">
        <Reveal className="vx-section-head">
          <p className="vx-eyebrow vx-eyebrow-on-dark">[ scope & build ]</p>
          <h2 id="scope-heading" className="vx-display is-on-dark">
            What this prototype proves,
            <br />
            and what it does not.
          </h2>
        </Reveal>

        <div className="vx-scope-pair">
          <article>
            <h3>Scope</h3>
            <ul>
              <li>One adult traveller</li>
              <li>One domestic segment</li>
              <li>Same airline · direct booking</li>
              <li>Saved payment method</li>
              <li>Deterministic simulated APIs</li>
            </ul>
          </article>
          <article>
            <h3>Limitations</h3>
            <ul>
              <li>No real airline inventory</li>
              <li>No real payment</li>
              <li>No multi-passenger / multi-segment</li>
              <li>No loyalty or upgrade logic</li>
              <li>No real specialist integration</li>
            </ul>
          </article>
        </div>

        <div className="vx-future">
          <p className="vx-future-badge">Future tests — no results claimed</p>
          <ul>
            {FUTURE_TESTS.map((test) => (
              <li key={test.name}>
                <strong>{test.name}</strong>
                <span>{test.question}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="vx-impl-bento">
          {[
            {
              title: "Frontend",
              body: "React, TypeScript, component-driven UI, responsive mobile prototype, Mapbox route visualisation.",
            },
            {
              title: "State model",
              body: "Typed fixtures, deterministic state machine, direct state URLs, no random failure triggering.",
            },
            {
              title: "Approval model",
              body: "Binds passenger, flight, route, date, times, seat, baggage, fare class, total, payment. Material change invalidates approval.",
            },
            {
              title: "Safety order",
              body: "AI 621 is released only after the selected replacement ticket is successfully issued.",
            },
            {
              title: "Accessibility",
              body: "Keyboard controls, visible focus, semantic radios/buttons, sheet focus management, reduced motion, colour-independent status.",
            },
            {
              title: "Simulation boundary",
              body: "All airline, payment, notification, wallet, calendar, call, and specialist actions are simulated.",
            },
          ].map((card) => (
            <article key={card.title}>
              <h3>{card.title}</h3>
              <p>{card.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section
        className="vx-section vx-finale vx-final-cta"
        aria-labelledby="cta-heading"
      >
        <div className="vx-finale-atmosphere" aria-hidden="true">
          <div className="vx-finale-night" />
          <div className="vx-finale-stars" />
          <div className="vx-finale-clouds">
            <img src="/figma/cloud-backdrop.jpg" alt="" draggable={false} />
          </div>
        </div>

        <Reveal className="vx-finale-hero">
          <p className="vx-eyebrow vx-finale-eyebrow">[ ready to inspect? ]</p>
          <h2 id="cta-heading" className="vx-finale-title">
            Explore every{" "}
            <span className="vx-finale-accent">trust</span> moment.
          </h2>
          <p className="vx-finale-lede">
            Open the prototype, inspect the state branches, or review the original
            designs.
          </p>
          <CtaRow className="is-center vx-finale-actions">
            <ProtoLink href={protoHref()} className="vx-btn vx-btn-glass">
              Launch prototype
            </ProtoLink>
            <FigmaButton className="vx-btn vx-btn-glass" />
            <a href="#hero" className="vx-btn vx-btn-glass">
              Return to top ↑
            </a>
          </CtaRow>
        </Reveal>

        <div
          className="vx-figma-dock-host"
          data-figma-dock-host
          aria-live="polite"
        />

        <div className="vx-state-panel">
          <header className="vx-state-panel-head">
            <div>
              <p className="vx-eyebrow vx-finale-eyebrow">[ prototype directory ]</p>
              <h3>Jump to any state</h3>
              <p>
                Direct deep links into the working prototype. Each opens in a new
                tab so you keep your place here.
              </p>
            </div>
            <ProtoLink href={protoHref()} className="vx-btn vx-btn-glass vx-btn-sm">
              Start from the beginning
            </ProtoLink>
          </header>

          <div className="vx-state-grid">
            {STATE_LINK_GROUPS.map((group) => {
              const links = STATE_LINKS.filter((l) => l.group === group.id);
              return (
                <div key={group.id} className="vx-state-group">
                  <h4>
                    <span>{group.label}</span>
                    <span className="vx-state-count">{links.length}</span>
                  </h4>
                  <ul>
                    {links.map((link) => (
                      <li key={link.label}>
                        <ProtoLink href={link.href} className="vx-state-link">
                          <span className="vx-state-link-label">{link.label}</span>
                          <span className="vx-state-link-go" aria-hidden="true">
                            →
                          </span>
                          {link.note ? (
                            <span className="vx-state-note">{link.note}</span>
                          ) : null}
                        </ProtoLink>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>

        <footer className="vx-footer vx-finale-footer">
          <p className="vx-finale-mark" aria-hidden="true">
            Trust moment
          </p>
          <p className="vx-footer-name">Sarthak Goyal</p>
          <p>Senior Product Designer and Design Engineer</p>
          <p className="vx-footer-note">
            Designed and built as a deterministic prototype for the
            Jupiter&nbsp;Money
            <br />
            Senior Product Designer, AI-Native Surfaces assignment.
          </p>
        </footer>
      </section>
    </div>
  );
}
