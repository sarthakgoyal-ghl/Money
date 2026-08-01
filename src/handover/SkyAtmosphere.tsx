import { useEffect, useRef, useState } from "react";
import {
  useReducedMotion,
  m,
  useScroll,
  useTransform,
  useMotionTemplate,
  type MotionValue,
} from "motion/react";

const CLOUD_SRC = "/figma/cloud-backdrop.jpg";

function useSectionProgress(sectionId: string) {
  const ref = useRef<HTMLElement | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    ref.current = document.getElementById(sectionId);
    setReady(Boolean(ref.current));
  }, [sectionId]);

  const { scrollYProgress } = useScroll({
    target: ready ? ref : undefined,
    offset: ["start end", "start 35%", "center center", "end start"],
  });

  return scrollYProgress;
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
 * Fixed atmospheric stage for /handover:
 * soft sky + continuously drifting / parallax clouds,
 * lavender on overview/principles and again on handoff (Singularity pocket),
 * night galaxy only for the closing scope/build band — never over repair/handoff.
 */
export function SkyAtmosphere() {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const overviewProgress = useSectionProgress("overview");
  const principlesProgress = useSectionProgress("principles");
  const handoffProgress = useSectionProgress("handoff");
  const scopeProgress = useSectionProgress("scope");
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
  // Clouds stay present through the story; only yield when scope night band enters.
  const cloudsFromPage = useTransform(
    scrollYProgress,
    [0, 0.88, 0.93, 0.97, 1],
    [1, 1, 0.55, 0.12, 0.08],
  );
  const cloudsFromScope = useTransform(
    scopeProgress,
    [0, 0.08, 0.22, 0.5, 1],
    [1, 0.45, 0.12, 0.08, 0.08],
  );
  const cloudOpacity = useTransform(
    [cloudsFromPage, cloudsFromScope],
    ([page, scope]: number[]) => Math.min(page ?? 1, scope ?? 1),
  );
  const galaxyFromPage = useTransform(
    scrollYProgress,
    [0, 0.9, 0.94, 0.98, 1],
    [0, 0, 0.55, 0.92, 0.95],
  );
  const galaxyFromScope = useTransform(
    scopeProgress,
    [0, 0.05, 0.18, 0.4, 1],
    [0, 0.35, 0.9, 0.96, 0.96],
  );
  const galaxyOpacity = useTransform(
    [galaxyFromPage, galaxyFromScope],
    ([page, scope]: number[]) => Math.max(page ?? 0, scope ?? 0),
  );
  const veilOpacity = useTransform(
    scrollYProgress,
    [0, 0.88, 0.94, 1],
    [0.55, 0.5, 0.22, 0.14],
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
