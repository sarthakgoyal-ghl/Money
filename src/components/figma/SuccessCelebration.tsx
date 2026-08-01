import { useEffect, useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { playSuccessChime } from "../../audio/successChime";

/** Brand-forward palette — blues + success green + one warm spark. */
const COLORS = ["#0088ff", "#5eb8ff", "#039855", "#a6f4c5", "#fdb022", "#ffffff"] as const;

interface Piece {
  id: number;
  x: number;
  y: number;
  rotate: number;
  color: string;
  delay: number;
  w: number;
  h: number;
  round: boolean;
  /** Slightly longer hang for larger pieces so the burst reads as generous. */
  duration: number;
}

function buildPieces(seed: number): Piece[] {
  // Deterministic enough for a single reveal — avoids SSR/hydration noise.
  let n = seed;
  const rand = () => {
    n = (n * 1664525 + 1013904223) >>> 0;
    return n / 0xffffffff;
  };

  return Array.from({ length: 64 }, (_, id) => {
    const angle = (rand() * 2 - 1) * Math.PI * 0.95;
    const dist = 110 + rand() * 220;
    const large = id % 5 === 0;
    const w = large ? 12 + rand() * 10 : 7 + rand() * 7;
    const h = large ? 8 + rand() * 8 : 4 + rand() * 6;
    return {
      id,
      x: Math.cos(angle) * dist * (0.85 + rand() * 0.35),
      // Bias downward into the sheet so the burst fills the success surface.
      y: 30 + Math.sin(Math.abs(angle)) * dist * 0.75 + rand() * 160,
      rotate: (rand() - 0.5) * 720,
      color: COLORS[id % COLORS.length],
      delay: rand() * 0.18,
      w,
      h,
      round: id % 5 === 0,
      duration: large ? 2.15 : 1.85,
    };
  });
}

interface SuccessCelebrationProps {
  /** Fires the burst while true; regenerates when toggled off→on. */
  active: boolean;
}

/**
 * Booking-complete celebration — a generous seal-centered confetti burst that
 * clears itself, with a soft completion chime. Skips motion and sound when the
 * user prefers reduced motion.
 */
export function SuccessCelebration({ active }: SuccessCelebrationProps) {
  const reduced = useReducedMotion();
  const pieces = useMemo(
    () => (active && !reduced ? buildPieces(63912) : []),
    [active, reduced],
  );

  useEffect(() => {
    if (!active || reduced) return;
    void playSuccessChime();
  }, [active, reduced]);

  if (!active) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-[45] overflow-hidden"
    >
      {/* Soft lift behind the sheet so the map doesn’t feel ignored. */}
      <motion.div
        className="absolute inset-x-0 top-0 h-[55%] bg-gradient-to-b from-[#0088ff]/28 via-[#a6f4c5]/16 to-transparent"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0.55, 0] }}
        transition={{
          duration: reduced ? 0.01 : 2.1,
          times: [0, 0.18, 0.55, 1],
        }}
      />

      {/* Brief radial flash at the seal — gratitude as light, not copy. */}
      {!reduced ? (
        <motion.div
          className="absolute left-1/2 top-[16%] size-[220px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(0,136,255,0.45)_0%,rgba(166,244,197,0.2)_42%,transparent_70%)]"
          initial={{ opacity: 0, scale: 0.35 }}
          animate={{ opacity: [0, 0.9, 0], scale: [0.35, 1.35, 1.55] }}
          transition={{ duration: 1.35, ease: [0.2, 0.7, 0.2, 1] }}
        />
      ) : null}

      {!reduced
        ? pieces.map((piece) => (
            <motion.span
              key={piece.id}
              className="absolute left-1/2 top-[16%] block shadow-[0_0_0_0.5px_rgba(255,255,255,0.25)]"
              style={{
                width: piece.w,
                height: piece.h,
                backgroundColor: piece.color,
                borderRadius: piece.round ? 999 : 2,
              }}
              initial={{
                opacity: 0,
                x: 0,
                y: 0,
                rotate: 0,
                scale: 0.25,
              }}
              animate={{
                opacity: [0, 1, 1, 0],
                x: piece.x,
                y: piece.y,
                rotate: piece.rotate,
                scale: [0.25, 1.15, 1],
              }}
              transition={{
                duration: piece.duration,
                delay: piece.delay,
                ease: [0.16, 0.75, 0.22, 1],
                opacity: {
                  duration: piece.duration,
                  times: [0, 0.1, 0.72, 1],
                },
                scale: {
                  duration: piece.duration * 0.45,
                  times: [0, 0.35, 1],
                },
              }}
            />
          ))
        : null}
    </div>
  );
}

interface SuccessSealProps {
  src: string;
}

/** Seal pops once when success opens — the emotional beat for the hero. */
export function SuccessSeal({ src }: SuccessSealProps) {
  const reduced = useReducedMotion();

  return (
    <motion.img
      src={src}
      alt=""
      aria-hidden="true"
      className="size-[80px] shrink-0 object-contain"
      initial={reduced ? false : { scale: 0.45, opacity: 0, rotate: -10 }}
      animate={{ scale: 1, opacity: 1, rotate: 0 }}
      transition={
        reduced
          ? { duration: 0.01 }
          : { type: "spring", stiffness: 420, damping: 16, mass: 0.65 }
      }
    />
  );
}
