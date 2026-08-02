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
                The original request becomes an explicit, editable brief: arrive
                before 18:00, keep the extra cost under ₹5,000, and avoid a middle
                seat. Those constraints are what the recommendation will be audited
                against.
              </p>
            ),
          },
          {
            id: "recommend",
            label: "step 2 · recommendation rationale",
            title: "Why this option",
            screen: SCREENS.proposal,
            body: (
              <p>
                AI 639 is recommended because it arrives at 16:00, costs ₹4,790
                extra (₹210 below the ₹5,000 search limit), keeps a window seat, and
                is the earliest matching nonstop. AI 621 remains active until AI 639
                is successfully issued. ₹5,000 is the search limit; ₹4,790 is the
                exact amount proposed for this transaction.
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
                Other Options, constraint adjustment, and comparison stay available.
                The user can keep AI 621. They remain in control throughout the
                decision.
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
          <p className="vx-seal-kicker">Approval boundary</p>
          <p className="vx-seal-utterance">
            <span className="vx-seal-mark" aria-hidden="true">
              “
            </span>
            I’ll only rebook {SCENARIO.recommended.flightNo} for{" "}
            {SCENARIO.passenger}, departing at {SCENARIO.recommended.depart}, with
            seat {SCENARIO.recommended.seat}, for a total of{" "}
            {SCENARIO.recommended.extra} on {SCENARIO.success.payment}. If any
            material booking or payment detail changes, I’ll stop and ask again.
            <span className="vx-seal-mark" aria-hidden="true">
              ”
            </span>
          </p>
        </blockquote>
        <p className="vx-seal-note">
          ₹5,000 is the user’s search limit. ₹4,790 is the exact amount approved for
          this transaction. The search limit helps identify eligible options; it does
          not give the agent authority to spend any amount below ₹5,000. The
          prototype confirmation UI uses a shorter spoken line for the same bound
          approval: passenger, airline, flight, route, date, times, seat, baggage,
          fare class, payable amount, and payment method.
        </p>

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
                <dt>Passenger</dt>
                <dd>{SCENARIO.passenger}</dd>
              </div>
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
                <dd>{SCENARIO.current.flightNo} remains active</dd>
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
                <li>AI 621 remains active until AI 639 is issued</li>
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
                <li>Payment method is an approved attribute</li>
                <li>Changing payment invalidates the previous approval</li>
                <li>User can return and adjust</li>
                <li>Keeping AI 621 remains a valid outcome</li>
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
            <ProtoLink
              href={protoHref("confirmation", "payment-method")}
              className="vx-btn vx-btn-secondary"
            >
              Open payment method
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
            <p className="vx-eyebrow">[ case 01 · interpretation correction ]</p>
            <h3>Repair the smallest possible unit</h3>
            <p>
              The agent interpreted 18:00 as an arrival deadline. The user intended
              it as a departure deadline. That is an interpretation mismatch, not a
              booking failure. The agent acknowledges the mismatch, confirms that no
              booking or payment change occurred, corrects one constraint, preserves
              the remaining brief, and searches again without restarting the
              conversation.
            </p>
            <ul className="vx-anno">
              <li>Acknowledge the mismatch</li>
              <li>Preserve unaffected constraints</li>
              <li>No booking or payment changes</li>
              <li>Search again without restarting</li>
            </ul>
            <ProtoLink href={protoHref("misread")} className="vx-btn vx-btn-secondary">
              Open interpretation correction
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
              The fare changed from ₹4,790 to ₹6,240, so the exact earlier approval
              no longer applies. Nothing was charged. AI 621 remains active while the
              user chooses again.
            </p>
            <ul className="vx-anno">
              <li>The previous approval is invalidated</li>
              <li>Nothing was charged · AI 621 remains active</li>
              <li>Find another, keep AI 621, or approve ₹6,240</li>
            </ul>
            <p className="vx-repair-via">
              Higher-price reconfirmation for ₹6,240 is reached from this repair
              state in the prototype.
            </p>
            <ProtoLink
              href={protoHref("price-change")}
              className="vx-btn vx-btn-secondary"
            >
              Open fare-change repair
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
          Case {SCENARIO.handoff.caseId} opens when payment is authorised but the
          replacement ticket is not issued. AI 621 remains active and automatic
          retries are paused.
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
            title: "Payment authorised, ticket not issued",
            body: `Payment was authorised, but the replacement ticket was not issued. Because another automated attempt could create a duplicate authorisation or duplicate ticket, the agent stops and transfers the case to a specialist. Case ${SCENARIO.handoff.caseId} is created with ₹4,790 authorised on Visa •••• 1842, not captured; AI 639 not issued; and AI 621 still active.`,
            screen: SCREENS.handoff,
          },
          {
            id: "context",
            eyebrow: "[ 02 · context transferred ]",
            title: "The specialist already has the file",
            body: "Original request, constraints, selected flight, approval, payment status, ticket status, and automated attempts travel with the handoff so Priya does not start from zero.",
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
            <li>Interpretation mismatch before payment</li>
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
        <ProtoLink
          href={protoHref("handoff", "case-details")}
          className="vx-btn vx-btn-secondary"
        >
          Open case details
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
          {
            title: "Release",
            detail: "AI 621 remains active until issued; released only after success",
          },
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
          <div className="vx-feature-card-body">
            <p>
              The transaction is currently running: rechecking fare and seat,
              securing AI 639 and seat 12A, issuing the replacement, then releasing
              AI 621.
            </p>
            <ProtoLink
              href={protoHref("executing")}
              className="vx-btn vx-btn-secondary vx-btn-sm"
            >
              Open execution
            </ProtoLink>
          </div>
        </Reveal>
        <Reveal className="vx-feature-card" delay={0.06}>
          <ScreenFigure screen={SCREENS.success} size="card" />
          <h3>Success</h3>
          <div className="vx-feature-card-body">
            <p>
              The rebooking has completed. Booking {SCENARIO.success.bookingRef},
              seat 12A, {SCENARIO.success.charged}, and AI 621 released.
            </p>
            <ProtoLink
              href={protoHref("success")}
              className="vx-btn vx-btn-secondary vx-btn-sm"
            >
              Open success
            </ProtoLink>
          </div>
        </Reveal>
        <Reveal className="vx-feature-card" delay={0.12}>
          <ScreenFigure screen={SCREENS.boarding} size="card" />
          <h3>Boarding pass</h3>
          <div className="vx-feature-card-body">
            <p>
              The issued travel object and activity record are available, including
              original booking released.
            </p>
            <ProtoLink
              href={protoHref("ticket")}
              className="vx-btn vx-btn-secondary vx-btn-sm"
            >
              Open boarding pass
            </ProtoLink>
          </div>
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
          const panelId = `decision-panel-${index}`;
          return (
            <div key={decision.title} className={isOpen ? "vx-acc-row is-open" : "vx-acc-row"}>
              <button
                type="button"
                className="vx-acc-trigger"
                aria-expanded={isOpen}
                aria-controls={panelId}
                id={`decision-trigger-${index}`}
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
                    id={panelId}
                    role="region"
                    aria-labelledby={`decision-trigger-${index}`}
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
                            Open kept-current-flight state
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
          Step 3 creates the
          <br />
          largest loss in the funnel.
        </h2>
      </Reveal>

      <Reveal className="vx-diag">
        <div className="vx-diag-signal">
          <p className="vx-diag-stat">{focusStep?.complete ?? "61%"}</p>
          <div className="vx-diag-signal-copy">
            <h3>{focusStep?.name ?? "ID document upload"}</h3>
            <p>
              {focusStep?.entering ?? "74,600"} users entering · approximately 29,100
              lost
            </p>
            <p className="vx-diag-hypothesis">
              Hypothesis: capture-quality or unsupported-document failures, followed
              by generic rejection, cause repeated attempts and abandonment.
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
            Primary metric: Step 3 completion rate. Directional target: increase
            completion from 61% to approximately 70% to 73%. This is a directional
            target, not a guaranteed result.
          </p>
          <p className="vx-diag-metric is-soft">
            Quality guardrails: manual-review rate, document rejection, fraud
            indicators, false acceptance risk. Downstream activation: first
            transaction within 7 days (38,000 baseline).
          </p>
        </div>
      </Reveal>

      <div className="vx-rationale-panel">
        <button
          type="button"
          className="vx-btn vx-btn-secondary"
          aria-expanded={expanded}
          aria-controls="part-2-diagnosis-detail"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "Hide diagnosis detail" : "Show diagnosis detail"}
        </button>
        {expanded ? (
          <div
            id="part-2-diagnosis-detail"
            className="vx-prose vx-diag-detail"
            role="region"
            aria-label="Part 2 diagnosis detail"
          >
            <header className="vx-diag-detail-head">
              <p className="vx-eyebrow">[ diagnosis detail ]</p>
              <h3>Why Step 3, and what to test</h3>
            </header>

            <div className="vx-diag-detail-grid">
              <article className="vx-diag-detail-block">
                <h4>What the funnel data proves</h4>
                <p>
                  Step 3 · ID document upload completes at only 61% and loses
                  approximately 29,100 of the 74,600 users entering the step. That is
                  the largest percentage and absolute loss in the funnel.
                </p>
              </article>

              <article className="vx-diag-detail-block">
                <h4>Hypothesis</h4>
                <p>
                  The funnel shows where users drop, not why. Treat this as a
                  hypothesis to validate: capture-quality or unsupported-document
                  failures, followed by generic rejection, cause repeated attempts and
                  abandonment.
                </p>
              </article>

              <article className="vx-diag-detail-block">
                <h4>Proposed intervention</h4>
                <ol className="vx-diag-detail-steps">
                  <li>
                    <strong>Document selection</strong>
                    <span>Choose document type before capture.</span>
                  </li>
                  <li>
                    <strong>Preparation guidance</strong>
                    <span>Show lighting, framing, and edge requirements.</span>
                  </li>
                  <li>
                    <strong>Live capture feedback</strong>
                    <span>Guide during capture; auto-capture when readable.</span>
                  </li>
                  <li>
                    <strong>Review and resume</strong>
                    <span>Review before upload, targeted retakes, save and resume.</span>
                  </li>
                </ol>
              </article>

              <article className="vx-diag-detail-block">
                <h4>How we measure</h4>
                <dl className="vx-diag-detail-metrics">
                  <div>
                    <dt>Primary</dt>
                    <dd>
                      Step 3 completion rate. Directional target: approximately 70%
                      to 73% (about 9 to 12 percentage points). Not a guaranteed
                      result.
                    </dd>
                  </div>
                  <div>
                    <dt>Supporting</dt>
                    <dd>
                      First-attempt capture success, retakes per user, median
                      completion time, camera-permission acceptance, save-and-resume
                      usage, server rejection reasons
                    </dd>
                  </div>
                  <div>
                    <dt>Quality guardrails</dt>
                    <dd>
                      Manual-review rate, document rejection rate, fraud indicators,
                      false acceptance risk, selfie-liveness completion
                    </dd>
                  </div>
                  <div>
                    <dt>Downstream activation</dt>
                    <dd>
                      Account creation and first transaction within 7 days (38,000
                      baseline). Used to verify that additional KYC completions lead
                      to meaningful activation, not as the primary measure of the
                      capture redesign.
                    </dd>
                  </div>
                  <div>
                    <dt>Segments</dt>
                    <dd>
                      Operating system, device quality, document type,
                      camera-permission state, failure reason
                    </dd>
                  </div>
                </dl>
              </article>

              <article className="vx-diag-detail-block is-wide">
                <h4>Experiment and attribution</h4>
                <p>
                  Test: user-level 50/50 A/B. Control: current ID-document upload
                  flow. Variant: document selection, preparation guidance, live
                  capture feedback, automatic capture when readable, review before
                  upload, targeted retakes, and save and resume. Hold constant: KYC
                  provider, backend validation rules, eligibility rules, risk logic,
                  traffic eligibility, and document-acceptance policy. Distinguish
                  funnel proof (where loss occurs) from hypothesis, proposed
                  intervention, directional target, and post-launch measurement.
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
            What this prototype demonstrates,
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
          <p className="vx-future-badge">Future tests: no results claimed</p>
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
                Links to prototype states and their entry points. Each opens in a
                new tab so you keep your place here.
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
