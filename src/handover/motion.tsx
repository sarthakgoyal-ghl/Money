import type { ReactNode } from "react";
import {
  LazyMotion,
  MotionConfig,
  domAnimation,
  useReducedMotion,
} from "motion/react";

/** Handover-only Motion provider — LazyMotion + reduced-motion aware. */
export function HandoverMotion({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig
        reducedMotion="user"
        transition={
          reduce
            ? { duration: 0.01 }
            : { duration: 0.55, ease: [0.22, 1, 0.36, 1] }
        }
      >
        {children}
      </MotionConfig>
    </LazyMotion>
  );
}

export const EASE = [0.22, 1, 0.36, 1] as const;

export const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

export const staggerChildren = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
