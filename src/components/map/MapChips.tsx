import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ease } from "../../motion/tokens";

export interface MapChip {
  id: string;
  label: string;
  tone?: "neutral" | "live" | "warn" | "ok";
}

interface MapChipsProps {
  chips: MapChip[];
}

const DOT: Record<NonNullable<MapChip["tone"]>, string> = {
  neutral: "bg-white/45",
  live: "bg-route-cyan",
  warn: "bg-signal-warn",
  ok: "bg-signal-ok",
};

/**
 * Contextual labels on the map.
 *
 * The basemap's own place labels are switched off, and these replace them: the
 * only text over the imagery is text about *this trip*. They change with state
 * so the map itself reports what the assistant is doing — protecting the current
 * booking, comparing fares, holding a stale option — without the dock having to
 * repeat it.
 */
export function MapChips({ chips }: MapChipsProps) {
  const reduced = useReducedMotion();

  return (
    <div
      data-on-dark="true"
      className="pointer-events-none absolute inset-x-0 top-[68px] z-20 flex flex-wrap justify-center gap-1.5 px-4"
    >
      <AnimatePresence initial={false} mode="popLayout">
        {chips.map((chip) => (
          <motion.span
            key={chip.id}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
            transition={{ duration: reduced ? 0.001 : 0.26, ease: [...ease] }}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/14 bg-night/80 px-2.5 py-1.5 text-[11.5px] font-medium tabular text-white/88 backdrop-blur-md"
          >
            <span
              aria-hidden="true"
              className={[
                "h-1.5 w-1.5 shrink-0 rounded-full",
                DOT[chip.tone ?? "neutral"],
              ].join(" ")}
            />
            {chip.label}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}
