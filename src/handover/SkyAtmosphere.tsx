import { useEffect, useRef, useState } from "react";
import {
  useReducedMotion,
  m,
  useScroll,
  useTransform,
  useMotionTemplate,
  useMotionValue,
  type MotionValue,
} from "motion/react";

const CLOUD_SRC = "/figma/cloud-backdrop.jpg";

/**
 * Track scroll progress through a section by id.
 * Missing sections must stay at 0 — never fall through to document scroll
 * (that turns the night galaxy on early on short pages like /web).
 */
function useSectionProgress(sectionId: string) {
  const ref = useRef<HTMLElement | null>(null);
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const bind = () => {
      const el = document.getElementById(sectionId);
      ref.current = el;
      setTarget(el);
    };
    bind();
    const raf = requestAnimationFrame(bind);
    return () => cancelAnimationFrame(raf);
  }, [sectionId]);

  const { scrollYProgress } = useScroll({
    target: target ? ref : undefined,
    offset: ["start end", "end start"],
  });

  return useTransform(scrollYProgress, (value) => (target ? value : 0));
}

/** Hard gate: 1 only while #scope intersects (with a small lead-in). */
function useScopeInView() {
  const visible = useMotionValue(0);

  useEffect(() => {
    const el = document.getElementById("scope");
    if (!el) {
      visible.set(0);
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        visible.set(entry?.isIntersecting ? 1 : 0);
      },
      {
        // Start the night fade slightly before the band fully enters.
        root: null,
        rootMargin: "12% 0px 0px 0px",
        threshold: 0,
      },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [visible]);

  return visible;
}

function useLavenderSky(
  overviewProgress: MotionValue<number>,
  principlesProgress: MotionValue<number>,
  handoffProgress: MotionValue<number>,
  reduce: boolean | null,
) {
  // Peak lavender across overview → principles, then ease out.
  const fromOverview = useTransform(
    overviewProgress,
    [0, 0.25, 0.55, 0.9, 1],
    [0.08, 0.55, 0.78, 0.62, 0.2],
  );
  const fromPrinciples = useTransform(
    principlesProgress,
    [0, 0.18, 0.4, 0.62, 0.82, 1],
    [0.35, 0.9, 1, 0.62, 0.22, 0],
  );
  // Singularity pocket returns on handoff — soft lilac/pink, not night.
  const fromHandoff = useTransform(
    handoffProgress,
    [0, 0.12, 0.35, 0.55, 0.78, 1],
    [0.15, 0.85, 1, 0.95, 0.45, 0.08],
  );
  const strength = useTransform(
    [fromOverview, fromPrinciples, fromHandoff],
    ([a, b, c]: number[]) => Math.max(a ?? 0, b ?? 0, c ?? 0),
  );

  const tintOpacity = useTransform(strength, (v) =>
    reduce ? 0 : 0.18 + v * 0.68,
  );
  const washOpacity = useTransform(strength, (v) =>
    reduce ? 0 : 0.08 + v * 0.4,
  );
  // Long feather into the interaction-system cloud band — no hard white slab.
  const whiteGround = useTransform(
    principlesProgress,
    [0.35, 0.55, 0.78, 1],
    reduce ? [0, 0, 0, 0] : [0, 0.06, 0.16, 0.24],
  );

  const hue = useTransform(strength, [0, 1], [0, 42]);
  const sat = useTransform(strength, [0, 1], [0.82, 1.2]);
  const bright = useTransform(strength, [0, 1], [1.08, 1.02]);
  const cloudFilter = useMotionTemplate`hue-rotate(${hue}deg) saturate(${sat}) brightness(${bright})`;

  return { tintOpacity, washOpacity, whiteGround, cloudFilter, strength };
}

/**
 * Fixed atmospheric stage for /handover and /web:
 * soft sky + continuously drifting / parallax clouds,
 * lavender on overview/principles and again on handoff (Singularity pocket),
 * night galaxy only while the closing #scope band is in view —
 * never driven by page-percent scroll (breaks on short /web).
 */
export function SkyAtmosphere() {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const overviewProgress = useSectionProgress("overview");
  const principlesProgress = useSectionProgress("principles");
  const handoffProgress = useSectionProgress("handoff");
  const scopeProgress = useSectionProgress("scope");
  const scopeInView = useScopeInView();
  const { tintOpacity, washOpacity, whiteGround, cloudFilter } = useLavenderSky(
    overviewProgress,
    principlesProgress,
    handoffProgress,
    reduce,
  );

  const cloudYFar = useTransform(
    scrollYProgress,
    [0, 1],
    reduce ? [0, 0] : [0, 140],
  );
  const cloudYMid = useTransform(
    scrollYProgress,
    [0, 1],
    reduce ? [0, 0] : [0, 240],
  );
  const cloudYNear = useTransform(
    scrollYProgress,
    [0, 1],
    reduce ? [0, 0] : [0, 360],
  );
  const cloudXNear = useTransform(
    scrollYProgress,
    [0, 1],
    reduce ? [0, 0] : [0, -110],
  );

  // Daytime clouds until #scope is actually on screen, then yield to night.
  const cloudOpacity = useTransform(
    [scopeProgress, scopeInView],
    ([progress, inView]: number[]) => {
      if ((inView ?? 0) < 1) return 1;
      const p = progress ?? 0;
      if (p < 0.08) return 1 - (p / 0.08) * 0.65;
      if (p < 0.2) return 0.35 - ((p - 0.08) / 0.12) * 0.3;
      return 0.02;
    },
  );

  // Night ONLY while #scope intersects — no page-percent assist.
  const galaxyOpacity = useTransform(
    [scopeProgress, scopeInView],
    ([progress, inView]: number[]) => {
      if (reduce) return 0;
      if ((inView ?? 0) < 1) return 0;
      const p = progress ?? 0;
      if (p < 0.06) return (p / 0.06) * 0.85;
      if (p < 0.16) return 0.85 + ((p - 0.06) / 0.1) * 0.15;
      return 1;
    },
  );

  const veilOpacity = useTransform(galaxyOpacity, (galaxy) =>
    0.55 * (1 - Math.min(galaxy ?? 0, 1)),
  );

  return (
    <div className="vx-sky" aria-hidden="true">
      <div className="vx-sky-base" />

      {/* Lavender sky wash — peaks on overview / principles */}
      <m.div className="vx-sky-tint" style={{ opacity: tintOpacity }} />
      <m.div className="vx-sky-tint-bloom" style={{ opacity: washOpacity }} />

      <m.div
        className="vx-sky-clouds"
        style={{ opacity: cloudOpacity, filter: cloudFilter }}
      >
        <m.div className="vx-sky-cloud vx-sky-cloud-far" style={{ y: cloudYFar }}>
          <m.div
            className="vx-sky-cloud-drift"
            animate={
              reduce
                ? undefined
                : {
                    x: ["-2%", "3%", "-1.5%"],
                    y: ["0%", "-1.8%", "0.6%"],
                    scale: [1.08, 1.12, 1.08],
                  }
            }
            transition={
              reduce
                ? undefined
                : {
                    duration: 42,
                    ease: "easeInOut",
                    repeat: Infinity,
                    repeatType: "mirror",
                  }
            }
          >
            <img src={CLOUD_SRC} alt="" draggable={false} />
          </m.div>
        </m.div>

        <m.div className="vx-sky-cloud vx-sky-cloud-mid" style={{ y: cloudYMid }}>
          <m.div
            className="vx-sky-cloud-drift"
            animate={
              reduce
                ? undefined
                : {
                    x: ["3%", "-4%", "2%"],
                    y: ["1%", "-1%", "0.5%"],
                    scale: [1.14, 1.1, 1.14],
                  }
            }
            transition={
              reduce
                ? undefined
                : {
                    duration: 56,
                    ease: "easeInOut",
                    repeat: Infinity,
                    repeatType: "mirror",
                    delay: 2,
                  }
            }
          >
            <img src={CLOUD_SRC} alt="" draggable={false} />
          </m.div>
        </m.div>

        <m.div
          className="vx-sky-cloud vx-sky-cloud-near"
          style={{ y: cloudYNear, x: cloudXNear }}
        >
          <m.div
            className="vx-sky-cloud-drift"
            animate={
              reduce
                ? undefined
                : {
                    x: ["-4%", "5%", "-3%"],
                    y: ["0.5%", "-2.5%", "1%"],
                    scale: [1.18, 1.24, 1.18],
                  }
            }
            transition={
              reduce
                ? undefined
                : {
                    duration: 34,
                    ease: "easeInOut",
                    repeat: Infinity,
                    repeatType: "mirror",
                    delay: 0.8,
                  }
            }
          >
            <img src={CLOUD_SRC} alt="" draggable={false} />
          </m.div>
        </m.div>
      </m.div>

      <m.div className="vx-sky-veil" style={{ opacity: veilOpacity }} />
      <m.div className="vx-sky-ground" style={{ opacity: whiteGround }} />

      <m.div className="vx-sky-galaxy" style={{ opacity: galaxyOpacity }}>
        <m.div
          className="vx-sky-nebula"
          animate={
            reduce
              ? undefined
              : {
                  rotate: [0, 4, -2, 0],
                  scale: [1, 1.04, 1.01, 1],
                }
          }
          transition={
            reduce
              ? undefined
              : { duration: 48, ease: "easeInOut", repeat: Infinity }
          }
        />
        <div className="vx-sky-stars vx-sky-stars-a" />
        <div className="vx-sky-stars vx-sky-stars-b" />
      </m.div>
    </div>
  );
}
