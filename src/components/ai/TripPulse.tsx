import { motion, useReducedMotion } from "framer-motion";

export type TripPulseState =
  /** Quiet. Present in the layout but not animating. */
  | "idle"
  /** The agent is doing work — interpreting, searching, refreshing. */
  | "working"
  /** The agent finished successfully and resolves into a check. */
  | "resolved"
  /** The agent stopped on purpose. */
  | "stopped"
  /** Ownership is moving to a person. */
  | "handoff";

interface TripPulseProps {
  state?: TripPulseState;
  size?: number;
  /** Announced label. Pass null when an adjacent live region already says it. */
  label?: string | null;
  className?: string;
}

const TONES: Record<TripPulseState, { ring: string; core: string; spark: string }> = {
  idle: { ring: "#4F8CFF", core: "#8FB6E8", spark: "#4F8CFF" },
  working: { ring: "#61D5FF", core: "#EAF6FF", spark: "#A78BFA" },
  resolved: { ring: "#5BE0B0", core: "#EAFFF6", spark: "#5BE0B0" },
  stopped: { ring: "#FFC661", core: "#FFF3DB", spark: "#FFC661" },
  handoff: { ring: "#A78BFA", core: "#F3EEFF", spark: "#61D5FF" },
};

/**
 * Trip Pulse — the agent's visual identity.
 *
 * Two restrained rings, a centre point, and a route spark. It animates only
 * while the agent is actually working, resolving, stopping, or handing off; in
 * `idle` it is a static mark. It is not a mascot, not a face, not a magic wand,
 * and never a full-screen decorative orb.
 */
export function TripPulse({
  state = "idle",
  size = 24,
  label = null,
  className = "",
}: TripPulseProps) {
  const reduced = useReducedMotion();
  const tone = TONES[state];
  const animating = state !== "idle" && !reduced;

  return (
    <span
      className={["relative inline-flex shrink-0", className].join(" ")}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        aria-hidden={label === null ? "true" : undefined}
        role={label === null ? undefined : "img"}
        aria-label={label ?? undefined}
        focusable="false"
      >
        {/* Outer ring — expands outward while working. */}
        <motion.circle
          cx="12"
          cy="12"
          r="10"
          fill="none"
          stroke={tone.ring}
          strokeWidth="1.1"
          initial={false}
          animate={
            animating && (state === "working" || state === "handoff")
              ? { scale: [0.82, 1.06, 0.82], opacity: [0.5, 0.16, 0.5] }
              : { scale: 1, opacity: state === "idle" ? 0.32 : 0.5 }
          }
          transition={
            animating
              ? { duration: 2.1, repeat: Infinity, ease: "easeInOut" }
              : { duration: 0.28 }
          }
          style={{ transformOrigin: "12px 12px" }}
        />

        {/* Inner ring — counter-phase, so the mark reads as a mechanism. */}
        <motion.circle
          cx="12"
          cy="12"
          r="6.4"
          fill="none"
          stroke={tone.ring}
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeDasharray="24 16"
          initial={false}
          animate={
            animating && state !== "stopped"
              ? { rotate: 360 }
              : { rotate: 0 }
          }
          transition={
            animating && state !== "stopped"
              ? { duration: 2.4, repeat: Infinity, ease: "linear" }
              : { duration: 0.28 }
          }
          style={{ transformOrigin: "12px 12px", opacity: 0.9 }}
        />

        {/* Centre point. */}
        <motion.circle
          cx="12"
          cy="12"
          r="2.6"
          fill={tone.core}
          initial={false}
          animate={
            animating && state === "working"
              ? { scale: [1, 1.18, 1] }
              : { scale: 1 }
          }
          transition={
            animating
              ? { duration: 1.4, repeat: Infinity, ease: "easeInOut" }
              : { duration: 0.24 }
          }
          style={{ transformOrigin: "12px 12px" }}
        />

        {/* Route spark — a short arc segment, the travel half of the identity. */}
        <motion.path
          d="M 3.6 16.4 Q 12 6.2 20.4 12.2"
          fill="none"
          stroke={tone.spark}
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeDasharray="7 26"
          initial={false}
          animate={
            animating
              ? { strokeDashoffset: [33, 0], opacity: [0, 1, 0] }
              : { strokeDashoffset: 0, opacity: state === "idle" ? 0 : 0.7 }
          }
          transition={
            animating
              ? { duration: 1.7, repeat: Infinity, ease: "easeInOut" }
              : { duration: 0.24 }
          }
        />

        {state === "resolved" ? (
          <motion.path
            d="M 8 12.2 L 10.9 15 L 16.2 9.4"
            fill="none"
            stroke={tone.ring}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={reduced ? { pathLength: 1 } : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: reduced ? 0.001 : 0.34, ease: "easeOut" }}
          />
        ) : null}
      </svg>
    </span>
  );
}
