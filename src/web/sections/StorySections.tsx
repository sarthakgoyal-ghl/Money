import { useState } from "react";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import {
  DECISIONS,
  SCENARIO,
  SCREENS,
  STATE_LINK_GROUPS,
  STATE_LINKS,
  protoHref,
} from "../webData";
import { ProtoLink, CtaRow } from "../../handover/ProtoLink";
import { Reveal, ScreenFigure, StickyProductStory } from "../../handover/ScreenStory";
import { EASE } from "../../handover/motion";

export function ConfirmationStory() {
  return (
    <section
      id="confirmation"
      className="vx-section vx-tone-blue-soft"
      aria-labelledby="confirmation-heading"
    >
      <Reveal className="vx-section-head">
        <p className="vx-eyebrow">[ approve ]</p>
        <h2 id="confirmation-heading" className="vx-display">
          Approval is an exact contract,
          <br />
          not a vague OK.
        </h2>
        <p className="vx-lede">
          Voyage turns your request into one rebooking you can understand and
          authorise: flight, seat, fare, and payment, with your current ticket
          still protected until the replacement is issued.
        </p>
      </Reveal>

      <Reveal className="vx-seal">
        <blockquote className="vx-seal-quote">
          <p className="vx-seal-kicker">What you authorise</p>
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
          ₹5,000 is your search limit. ₹4,790 is the exact amount approved for
          this transaction. The limit filters eligible options; it does not give
          Voyage authority to spend any amount below ₹5,000.
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
            title: "See the full change before you pay",
            screen: SCREENS.confirmation,
            body: (
              <ul className="vx-anno">
                <li>Current versus replacement is visible side by side</li>
                <li>“Pay ₹4,790 & rebook” names action and consequence</li>
                <li>AI 621 stays active until AI 639 is issued</li>
                <li>You can still keep the current flight</li>
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
                <li>You can return and adjust before committing</li>
                <li>Nothing is charged until you approve the exact total</li>
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
          When automation cannot finish safely,
          <br />
          Voyage stops, with a person who already knows.
        </h2>
        <p className="vx-lede">
          Case {SCENARIO.handoff.caseId} opens when payment is authorised but the
          replacement ticket is not issued. Your current flight stays active.
          Automatic retries pause.
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
            body: `Voyage stops before another attempt can create a duplicate charge or ticket. Case ${SCENARIO.handoff.caseId} captures the full payment and booking status so nothing is guessed.`,
            screen: SCREENS.handoff,
          },
          {
            id: "context",
            eyebrow: "[ 02 · context transferred ]",
            title: "The specialist already has the file",
            body: "Request, constraints, selected flight, approval, payment status, ticket status, and automated attempts travel with the handoff, so support does not start from zero.",
            screen: SCREENS.caseDetails,
          },
          {
            id: "priya",
            eyebrow: `[ 03 · ${SCENARIO.handoff.specialist.toLowerCase()} ]`,
            title: `${SCENARIO.handoff.specialist} already has the case`,
            body: "You pick up a conversation with a person who already knows what happened. No retelling required.",
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
          Voyage may continue when the transaction state is known and no financial
          or booking side effect has occurred. It stops when payment and ticket
          status disagree, the current booking is uncertain, or another automated
          attempt could increase financial harm.
        </p>
      </Reveal>

      <div
        className="vx-handoff-ledger"
        role="group"
        aria-label="When automation continues or stops"
      >
        <Reveal className="vx-handoff-ledger-col is-continue">
          <p className="vx-map-kicker">May stay automated</p>
          <h3>Voyage can still finish</h3>
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
            <li>You explicitly request a person</li>
          </ul>
        </Reveal>
      </div>

      <CtaRow>
        <ProtoLink href={protoHref("handoff")} className="vx-btn vx-btn-primary">
          Open human handoff
        </ProtoLink>
        <ProtoLink href={protoHref("support")} className="vx-btn vx-btn-secondary">
          Open specialist chat
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
        <p className="vx-eyebrow">[ success ]</p>
        <h2 id="execution-heading" className="vx-display">
          When approval holds,
          <br />
          Voyage finishes in a safe order.
        </h2>
        <p className="vx-lede">
          Recheck, secure, issue, then release, so your original ticket is only
          given up after the replacement is real.
        </p>
      </Reveal>

      <ol className="vx-safe-order" aria-label="Safe execution order">
        {[
          { title: "Recheck", detail: "Fare and seat still match what you approved" },
          { title: "Secure", detail: "AI 639 and seat 12A held" },
          { title: "Issue", detail: "Replacement ticket confirmed" },
          {
            title: "Release",
            detail: "AI 621 stays active until issued; released only after success",
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
              Voyage runs the approved change in order, so you can see progress
              without guessing what happened to your seat.
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
              Rebooking complete. Booking {SCENARIO.success.bookingRef}, seat 12A,{" "}
              {SCENARIO.success.charged}, and AI 621 released.
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
              Your new travel object and activity trail, including confirmation
              that the original booking was released.
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
        <p className="vx-eyebrow">[ why this way ]</p>
        <h2 id="decisions-heading" className="vx-display">
          Product choices that
          <br />
          protect the traveller.
        </h2>
        <p className="vx-lede">
          These are the deliberate tradeoffs behind Voyage: not features to
          showcase, but constraints that keep rebooking safe.
        </p>
      </Reveal>

      <div className="vx-accordion">
        {DECISIONS.map((decision, index) => {
          const isOpen = open === index;
          const panelId = `web-decision-panel-${index}`;
          return (
            <div key={decision.title} className={isOpen ? "vx-acc-row is-open" : "vx-acc-row"}>
              <button
                type="button"
                className="vx-acc-trigger"
                aria-expanded={isOpen}
                aria-controls={panelId}
                id={`web-decision-trigger-${index}`}
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
                    aria-labelledby={`web-decision-trigger-${index}`}
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

export function FinalCta() {
  return (
    <div id="scope" className="vx-night-band">
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
          <p className="vx-eyebrow vx-finale-eyebrow">[ ready to try? ]</p>
          <h2 id="cta-heading" className="vx-finale-title">
            Open{" "}
            <span className="vx-finale-accent">Voyage</span> and rebook a flight.
          </h2>
          <p className="vx-finale-lede">
            Try the full flow: exact approval, protected ticket, handoff, and
            success, in the live demo.
          </p>
          <CtaRow className="is-center vx-finale-actions">
            <ProtoLink href={protoHref()} className="vx-btn vx-btn-glass">
              Try Voyage
            </ProtoLink>
            <a href="#hero" className="vx-btn vx-btn-glass">
              Return to top ↑
            </a>
          </CtaRow>
        </Reveal>

        <div className="vx-state-panel">
          <header className="vx-state-panel-head">
            <div>
              <p className="vx-eyebrow vx-finale-eyebrow">[ product states ]</p>
              <h3>Jump to any moment</h3>
              <p>
                Each link opens the live demo in a new tab so you keep your place
                on this page.
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
            Voyage
          </p>
          <p className="vx-footer-name">Designed by Sarthak Goyal</p>
          <p>Senior Product Designer and Design Engineer</p>
        </footer>
      </section>
    </div>
  );
}
