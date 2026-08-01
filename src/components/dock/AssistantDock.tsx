import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { TripPulse } from "../ai/TripPulse";
import type { TripPulseState } from "../ai/TripPulse";
import { springSoft } from "../../motion/tokens";

export type DockHeight = "compact" | "medium" | "expanded";

/**
 * Dock heights as a fraction of the viewport.
 *
 * Compact leaves the map dominant while still showing a complete answer;
 * medium is the working height for comparing options; expanded is for editing
 * the brief, where the map is context the user has stopped consulting.
 */
export const DOCK_FRACTIONS: Record<DockHeight, number> = {
  compact: 0.32,
  medium: 0.55,
  expanded: 0.82,
};

const ORDER: DockHeight[] = ["compact", "medium", "expanded"];

interface AssistantDockProps {
  height: DockHeight;
  onHeightChange: (height: DockHeight) => void;
  pulse: TripPulseState;
  /** One line describing what the assistant is doing or has concluded. */
  statusLine: ReactNode;
  /** Identifies the current panel; a change resets the scroll position. */
  contentKey: string;
  children: ReactNode;
  /** Pinned actions above the composer, outside the scroll area. */
  actions?: ReactNode;
  /** Omit to hide the composer entirely — used where typing would be wrong. */
  composer?: ReactNode;
  /** Dims the dock while a light sheet owns attention. */
  recede?: boolean;
}

/**
 * The assistant dock — the operating layer of the product.
 *
 * Persistent by design: it is the same surface on every screen, at a height that
 * signals how much attention the current step deserves. It is *not* a modal, so
 * it never traps focus and never blocks the map underneath from being read; the
 * one moment the product does take over the screen is the confirmation sheet,
 * which is deliberately a different, lighter material.
 *
 * Scroll position survives height changes, because a user who has scrolled to a
 * flight option and then expands the dock is trying to see *more of that
 * option*, not to be returned to the top.
 */
export function AssistantDock({
  height,
  onHeightChange,
  pulse,
  statusLine,
  contentKey,
  children,
  actions,
  composer,
  recede = false,
}: AssistantDockProps) {
  const reduced = useReducedMotion();
  const scrollRef = useRef<HTMLDivElement>(null);
  const savedScroll = useRef(0);
  const fraction = DOCK_FRACTIONS[height];

  // Publish the height so the Mapbox attribution can float just above the dock
  // at every size rather than being buried behind it.
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.style.setProperty(
      "--dock-height",
      `${Math.round(fraction * 100)}%`,
    );
  }, [fraction]);

  // A new panel is a new subject: start at the top. Resizing the same panel is
  // not, so the offset is restored instead.
  useLayoutEffect(() => {
    savedScroll.current = 0;
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [contentKey]);

  useLayoutEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = savedScroll.current;
  }, [height]);

  const handleScroll = useCallback(() => {
    savedScroll.current = scrollRef.current?.scrollTop ?? 0;
  }, []);

  const cycle = useCallback(() => {
    const next = ORDER[(ORDER.indexOf(height) + 1) % ORDER.length];
    onHeightChange(next);
  }, [height, onHeightChange]);

  const step = useCallback(
    (direction: 1 | -1) => {
      const index = ORDER.indexOf(height);
      const next = ORDER[Math.min(ORDER.length - 1, Math.max(0, index + direction))];
      if (next !== height) onHeightChange(next);
    },
    [height, onHeightChange],
  );

  const atTop = height === "expanded";

  return (
    <motion.section
      data-on-dark="true"
      aria-label="Trip assistant"
      className="absolute inset-x-0 bottom-0 z-20 flex flex-col overflow-hidden rounded-t-[24px] border-t border-white/12 bg-night/[0.965] shadow-dock backdrop-blur-xl"
      initial={false}
      animate={{ height: `${fraction * 100}%`, opacity: recede ? 0.55 : 1 }}
      transition={reduced ? { duration: 0.001 } : springSoft}
    >
      {/* Grab area. Dragging is a shortcut; the buttons are the guaranteed path,
          because a drag handle alone is unreachable by keyboard and invisible to
          a screen reader. */}
      <motion.div
        className="shrink-0 cursor-grab touch-none active:cursor-grabbing"
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.08}
        dragMomentum={false}
        onDragEnd={(_event, info) => {
          if (info.offset.y < -28 || info.velocity.y < -420) step(1);
          else if (info.offset.y > 28 || info.velocity.y > 420) step(-1);
        }}
      >
        {/* The visible handle is a 4px pill, but its hit area is a full 44px —
            a grab affordance you can't reliably hit is decoration. */}
        <div className="-mb-3 flex justify-center">
          <button
            type="button"
            onClick={cycle}
            aria-label={`Assistant panel, ${height} height. Activate to resize.`}
            className="flex h-11 w-20 items-center justify-center rounded-full focus-ring-dark"
          >
            <span
              aria-hidden="true"
              className="block h-1 w-9 rounded-full bg-white/28"
            />
          </button>
        </div>

        <div className="flex items-start gap-2.5 px-4 pb-2.5">
          <TripPulse state={pulse} size={20} className="mt-[1px]" />
          <p
            role="status"
            aria-live="polite"
            className="min-w-0 flex-1 text-[13px] font-medium leading-snug text-white/88"
          >
            {statusLine}
          </p>
          <button
            type="button"
            onClick={() => step(atTop ? -1 : 1)}
            aria-expanded={atTop}
            aria-label={atTop ? "Collapse assistant panel" : "Expand assistant panel"}
            className="-mr-1.5 -mt-1.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white/72 hover:bg-white/10 focus-ring-dark"
          >
            {atTop ? (
              <ChevronDown size={17} strokeWidth={2.25} aria-hidden="true" />
            ) : (
              <ChevronUp size={17} strokeWidth={2.25} aria-hidden="true" />
            )}
          </button>
        </div>
      </motion.div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-3"
      >
        {children}
      </div>

      {actions ? (
        <div className="shrink-0 border-t border-white/10 px-4 pb-2 pt-2.5">
          {actions}
        </div>
      ) : null}

      {composer ? <div className="shrink-0">{composer}</div> : null}
    </motion.section>
  );
}
