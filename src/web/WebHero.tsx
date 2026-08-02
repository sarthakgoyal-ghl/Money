import { m, useReducedMotion } from "motion/react";
import { SCREENS, protoHref } from "./webData";
import { ProtoLink, CtaRow } from "../handover/ProtoLink";
import { ScreenFigure } from "../handover/ScreenStory";
import { EASE } from "../handover/motion";

export function WebHero() {
  const reduce = useReducedMotion();

  return (
    <section id="hero" className="vx-hero" aria-labelledby="hero-title">
      <div className="vx-hero-bg" aria-hidden="true">
        <div className="vx-hero-glow" />
        <div className="vx-hero-grid" />
        <svg className="vx-hero-route" viewBox="0 0 900 420" fill="none">
          <m.path
            d="M70 300 C240 250, 340 140, 460 160 C580 180, 680 90, 820 70"
            stroke="rgba(42,61,82,0.35)"
            strokeWidth="2"
            strokeDasharray="6 10"
            initial={reduce ? false : { pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: reduce ? 0.01 : 1.4, delay: 0.6, ease: EASE }}
          />
          <text x="48" y="330" fill="rgba(58,65,80,0.55)" fontSize="16">
            BOM
          </text>
          <text x="800" y="55" fill="rgba(58,65,80,0.55)" fontSize="16">
            BLR
          </text>
        </svg>
      </div>

      <div className="vx-hero-layout">
        <div className="vx-hero-copy">
          <m.p
            className="vx-eyebrow"
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduce ? 0.01 : 0.5, ease: EASE }}
          >
            [ Voyage · AI travel agent ]
          </m.p>

          <m.h1
            id="hero-title"
            className="vx-hero-title"
            initial={reduce ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduce ? 0.01 : 0.55, ease: EASE, delay: 0.08 }}
          >
            An AI agent that{" "}
            <span className="vx-hero-accent">rebooks for you</span>
            , without taking control away.
          </m.h1>

          <m.p
            className="vx-hero-body"
            initial={reduce ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: reduce ? 0.01 : 0.55,
              delay: reduce ? 0 : 0.45,
              ease: EASE,
            }}
          >
            Voyage finds a better flight, then asks for one exact approval. Your
            current ticket stays protected. If something goes wrong, automation
            stops and a human already has the full case.
          </m.p>

          <m.ul
            className="vx-meta-row"
            aria-label="Product tags"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: reduce ? 0 : 0.55 }}
          >
            <li>Consumer travel</li>
            <li>Agentic AI</li>
            <li>Bounded approval</li>
            <li>Safe handoff</li>
          </m.ul>

          <m.div
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduce ? 0 : 0.62, ease: EASE }}
          >
            <CtaRow>
              <ProtoLink href={protoHref()} className="vx-btn vx-btn-primary">
                Try Voyage
              </ProtoLink>
              <a href="#confirmation" className="vx-text-link">
                See exact approval →
              </a>
            </CtaRow>
            <p className="vx-disclosure">
              Interactive product demo. No real airline, payment, or support
              system is contacted.
            </p>
          </m.div>
        </div>

        <div className="vx-hero-visual">
          <m.div
            className="vx-hero-back-phone"
            initial={reduce ? false : { opacity: 0, x: 40, rotate: 10 }}
            animate={{ opacity: 1, x: 0, rotate: 6 }}
            transition={{
              duration: reduce ? 0.01 : 0.8,
              delay: reduce ? 0 : 0.35,
              ease: EASE,
            }}
          >
            <ScreenFigure
              screen={SCREENS.confirmation}
              size="hero"
              interactive={false}
            />
          </m.div>
          <m.div
            className="vx-hero-front-phone"
            initial={reduce ? false : { opacity: 0, y: 48, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              duration: reduce ? 0.01 : 0.75,
              delay: reduce ? 0 : 0.5,
              ease: EASE,
            }}
          >
            <ScreenFigure screen={SCREENS.proposal} size="hero" priority />
          </m.div>
        </div>
      </div>
    </section>
  );
}
