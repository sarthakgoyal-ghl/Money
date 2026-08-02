/**
 * Motion tokens.
 *
 * Motion in this prototype exists to explain state: what the agent is doing,
 * what changed, which option is selected, when an approval stopped being valid,
 * what is safe, and when ownership moved from the agent to a person. Anything
 * that does not carry one of those meanings is not animated.
 */

import type { Transition } from "framer-motion";

/** Durations in seconds (Framer Motion's unit). */
export const duration = {
  press: 0.12,
  sheet: 0.32,
  routeDraw: 0.8,
  morph: 0.36,
  statusStep: 0.36,
  successReveal: 0.6,
} as const;

/** Per-item delay for staggered reveals. */
export const stagger = {
  results: 0.06,
  brief: 0.05,
} as const;

export const spring: Transition = {
  type: "spring",
  stiffness: 340,
  damping: 34,
  mass: 0.9,
};

export const springSoft: Transition = {
  type: "spring",
  stiffness: 260,
  damping: 30,
  mass: 1,
};

/**
 * iOS sheet-stack motion — UISheetPresentationController / Vaul.
 *
 * One shared cubic-bezier for overlay slide, underlay scale/lift, and scrim
 * fade. Springs overshoot and finish out of sync with the dim — that reads as
 * “not smooth.” Apple’s sheet curve decelerates into place with no bounce.
 *
 * Underlay scale ~0.93 on a 402 frame (~14 pt inset).
 */
export const IOS_SHEET_STACK = {
  /** Slightly gentler recess than a hard 14pt inset — still reads as iOS stack. */
  underlayScale: 0.94,
  /** Peek above the overlay without a sharp upward snap. */
  underlayLiftY: -12,
  /** Larger continuous corner when pushed back (WWDC21 stacked corners). */
  underlayRadiusPx: 28,
  /** Dimming between stacked sheets. */
  scrim: "rgba(0, 0, 0, 0.36)",
  /** A touch longer than stock 500ms so the settle feels softer. */
  duration: 0.56,
  /**
   * Soft decelerate into rest. x1→x2 must stay monotonic — a reversed
   * control (e.g. 0.22 → 0.1) made Safari/Framer overshoot so stacked
   * sheets flashed at the top before landing on the bottom.
   */
  ease: [0.22, 1, 0.36, 1] as const,
} as const;

/** Overlay slide + underlay scale/lift — same curve enter and exit. */
export const iosSheetTransition: Transition = {
  type: "tween",
  duration: IOS_SHEET_STACK.duration,
  ease: [...IOS_SHEET_STACK.ease],
};

/** Scrim / underlay veil — identical timing so the stack moves as one. */
export const iosSheetFade: Transition = {
  type: "tween",
  duration: IOS_SHEET_STACK.duration,
  ease: [...IOS_SHEET_STACK.ease],
};

export const ease = [0.2, 0.7, 0.2, 1] as const;

export const tween = (seconds: number): Transition => ({
  type: "tween",
  duration: seconds,
  ease: [...ease],
});

/**
 * Reduced-motion variant of a transition: same end state, no travel.
 * Callers pass the result of `useReducedMotion()`.
 */
export function respectMotion(
  reduced: boolean | null,
  transition: Transition,
): Transition {
  return reduced ? { type: "tween", duration: 0.001 } : transition;
}

/** Standard sheet/list entrance, collapsed to a fade when motion is reduced. */
export function riseIn(reduced: boolean | null, distance = 12) {
  return {
    initial: reduced ? { opacity: 0 } : { opacity: 0, y: distance },
    animate: { opacity: 1, y: 0 },
    exit: reduced ? { opacity: 0 } : { opacity: 0, y: distance * 0.5 },
  };
}
