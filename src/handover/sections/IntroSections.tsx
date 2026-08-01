import { m, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { PRINCIPLES, SCENARIO } from "../handoverData";
import { Reveal } from "../ScreenStory";

const TRUST_TRUTHS = [
  "Exact approval",
  "Original ticket protected",
  "Material change = new decision",
  "Repair before side effects",
  "Human handoff with context",
  "No automatic retry after partial transaction",
];

export function TrustStrip() {
  const reduce = useReducedMotion();
  const items = [...TRUST_TRUTHS, ...TRUST_TRUTHS];
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const onVis = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  return (
    <section className="vx-trust-strip" aria-label="Project principles strip">
      {reduce ? (
        <ul className="vx-trust-static">
          {TRUST_TRUTHS.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <div className="vx-marquee" aria-hidden="true">
          <m.div
            className="vx-marquee-track"
            animate={paused ? undefined : { x: ["0%", "-50%"] }}
            transition={{ duration: 36, ease: "linear", repeat: Infinity }}
          >
            {items.map((item, index) => (
              <span key={`${item}-${index}`}>{item}</span>
            ))}
          </m.div>
        </div>
      )}
      <span className="sr-only">{TRUST_TRUTHS.join(". ")}</span>
    </section>
  );
}

export function TensionSection() {
  const reduce = useReducedMotion();

  return (
    <section
      id="overview"
      className="vx-section vx-overview"
      aria-labelledby="overview-heading"
    >
      <div className="vx-overview-sky">
        <Reveal className="vx-section-head is-center">
          <p className="vx-eyebrow">[ the trust problem ]</p>
          <h2 id="overview-heading" className="vx-display">
            Where convenience ends, accountability begins.
          </h2>
          <p className="vx-lede is-center">
            An AI agent becomes valuable and risky at the same moment: when it
            stops suggesting and starts acting. The design problem is finding the
            right amount of friction.
          </p>
        </Reveal>

        <div className="vx-tension-rail vx-overview-rail" aria-hidden="true">
          <span>Too much friction</span>
          <span className="vx-tension-rail-track" />
          <span>Too little friction</span>
        </div>

        <div className="vx-float-stage" aria-label="Trust friction spectrum">
          <m.article
            className="vx-float-card is-left"
            initial={reduce ? false : { opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: reduce ? 0.01 : 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="vx-tension-kicker">Avoid</p>
            <h3>Too much friction</h3>
            <p className="vx-tension-desc">
              The agent feels slower and less useful than booking manually.
            </p>
            <ul className="vx-anno">
              <li>Abandonment</li>
              <li>Loss of confidence</li>
              <li>Slower than manual booking</li>
            </ul>
          </m.article>

          <m.article
            className="vx-float-card is-focus"
            initial={reduce ? false : { opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{
              duration: reduce ? 0.01 : 0.75,
              delay: reduce ? 0 : 0.08,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <p className="vx-tension-kicker">Design target</p>
            <h3>Bounded approval</h3>
            <p className="vx-tension-desc">
              One exact transaction. Clear enough to act. Constrained enough to
              stay safe.
            </p>
            <ul className="vx-anno">
              <li>Exact flight</li>
              <li>Exact seat</li>
              <li>Exact price</li>
              <li>Explicit consequence</li>
            </ul>
          </m.article>

          <m.article
            className="vx-float-card is-right"
            initial={reduce ? false : { opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{
              duration: reduce ? 0.01 : 0.7,
              delay: reduce ? 0 : 0.14,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <p className="vx-tension-kicker">Avoid</p>
            <h3>Too little friction</h3>
            <p className="vx-tension-desc">
              Automation moves money or seats before the user understands the
              consequence.
            </p>
            <ul className="vx-anno">
              <li>Accidental approval</li>
              <li>Unexpected charge</li>
              <li>Loss of original seat</li>
              <li>Financial harm</li>
            </ul>
          </m.article>
        </div>
      </div>

      <Reveal className="vx-overview-request" delay={0.08}>
        <p className="vx-eyebrow">[ the request that creates the moment ]</p>
        <blockquote>
          <p>“{SCENARIO.request}”</p>
        </blockquote>
      </Reveal>
    </section>
  );
}

export function PrinciplesSection() {
  return (
    <section
      id="principles"
      className="vx-section vx-principles"
      aria-labelledby="principles-heading"
    >
      <div className="vx-principles-glow" aria-hidden="true" />

      <Reveal className="vx-principles-intro">
        <p className="vx-eyebrow">[ principles ]</p>
        <h2
          id="principles-heading"
          className="vx-display vx-principles-heading"
          aria-label="Five principles behind every state."
        >
          <span className="vx-principles-count" aria-hidden="true">
            05
          </span>
          <span className="vx-principles-heading-text">
            principles behind
            <br />
            every state.
          </span>
        </h2>
        <p className="vx-principles-lede">
          The interaction system is not a set of screens. It is a contract the
          agent must keep under pressure.
        </p>
      </Reveal>

      <ol className="vx-principles-ledger">
        {PRINCIPLES.map((principle, index) => (
          <li key={principle.title}>
            <Reveal delay={0.05 + index * 0.06}>
              <article className="vx-principle-item">
                <span className="vx-principle-num" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="vx-principle-copy">
                  <h3>{principle.title}</h3>
                  <p>{principle.body}</p>
                </div>
              </article>
            </Reveal>
          </li>
        ))}
      </ol>
    </section>
  );
}
