import { m, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { PRINCIPLES, PRODUCT_PROMISES, SCENARIO } from "../webData";
import { Reveal } from "../../handover/ScreenStory";

export function TrustStrip() {
  const reduce = useReducedMotion();
  const items = [...PRODUCT_PROMISES, ...PRODUCT_PROMISES];
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const onVis = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  return (
    <section className="vx-trust-strip" aria-label="Voyage product promises">
      {reduce ? (
        <ul className="vx-trust-static">
          {PRODUCT_PROMISES.map((item) => (
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
      <span className="sr-only">{PRODUCT_PROMISES.join(". ")}</span>
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
          <p className="vx-eyebrow">[ why Voyage ]</p>
          <h2 id="overview-heading" className="vx-display">
            Convenience is easy.
            <br />
            Accountability is the product.
          </h2>
          <p className="vx-lede is-center">
            Most AI travel agents fail at the moment that matters: acting on your
            booking. Voyage is built for that moment: fast enough to help, exact
            enough that you stay in control.
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
            <p className="vx-tension-kicker">Voyage</p>
            <h3>Bounded approval</h3>
            <p className="vx-tension-desc">
              One exact rebooking. Clear enough to act. Constrained enough to
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
              Automation moves money or seats before you understand the
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
        <p className="vx-eyebrow">[ the kind of request Voyage finishes ]</p>
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
        <p className="vx-eyebrow">[ trust model ]</p>
        <h2
          id="principles-heading"
          className="vx-display vx-principles-heading"
          aria-label="Five principles behind every Voyage decision."
        >
          <span className="vx-principles-count" aria-hidden="true">
            05
          </span>
          <span className="vx-principles-heading-text">
            principles behind
            <br />
            every decision.
          </span>
        </h2>
        <p className="vx-principles-lede">
          Five rules Voyage must keep from the first approval through success,
          and when it has to hand off to a human.
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
