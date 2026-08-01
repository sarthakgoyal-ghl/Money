import { motion, useReducedMotion } from "framer-motion";
import { Armchair, CalendarDays, Clock3, IndianRupee, Pencil } from "lucide-react";
import type { ReactNode } from "react";
import type { TripConstraints } from "../../data/scenario";
import { formatINR } from "../../data/scenario";
import { ease, spring, stagger } from "../../motion/tokens";

interface InterpretedBriefProps {
  constraints: TripConstraints;
  onEdit?: () => void;
  /** Constraint keys changed since the last render — animated, not re-listed. */
  changedKeys?: ReadonlyArray<BriefKey>;
  tone?: "dark" | "light";
}

export type BriefKey = "deadline" | "budget" | "seat" | "date";

interface BriefItem {
  key: BriefKey;
  icon: ReactNode;
  value: string;
  /** Full sentence for assistive tech, since the chips are terse. */
  spoken: string;
}

/**
 * "Your trip brief" — the agent's interpretation of the request as four
 * compact, editable chips. This replaces a full-height checklist card: the
 * interpretation matters, but it should not consume half the viewport.
 *
 * Values are read from the constraints object only, so the brief can never
 * disagree with what the rest of the flow is using.
 */
export function InterpretedBrief({
  constraints,
  onEdit,
  changedKeys = [],
  tone = "dark",
}: InterpretedBriefProps) {
  const reduced = useReducedMotion();
  const dark = tone === "dark";

  const deadlineVerb =
    constraints.intent === "arrive_before" ? "Arrive by" : "Depart by";
  const deadlineSpoken =
    constraints.intent === "arrive_before"
      ? `Arrive in Bengaluru by ${constraints.deadlineLabel}`
      : `Depart Mumbai by ${constraints.deadlineLabel}`;

  const items: BriefItem[] = [
    {
      key: "deadline",
      icon: <Clock3 size={12} strokeWidth={2.25} />,
      value: `${deadlineVerb} ${constraints.deadlineLabel}`,
      spoken: deadlineSpoken,
    },
    {
      key: "budget",
      icon: <IndianRupee size={12} strokeWidth={2.25} />,
      value: `Up to ${formatINR(constraints.maxExtraCost)}`,
      spoken: `Spend no more than ${formatINR(constraints.maxExtraCost)} extra`,
    },
    {
      key: "seat",
      icon: <Armchair size={12} strokeWidth={2.25} />,
      value:
        constraints.seatPreference === "Window or aisle"
          ? "Window or aisle"
          : `${constraints.seatPreference} seat`,
      spoken:
        constraints.seatPreference === "Window or aisle"
          ? "Window or aisle seat, no middle seat"
          : `${constraints.seatPreference} seat`,
    },
    {
      key: "date",
      icon: <CalendarDays size={12} strokeWidth={2.25} />,
      value: constraints.keepDate ? "Fri, 14 Aug" : "Any date",
      spoken: constraints.keepDate
        ? `Keep the same travel date, ${constraints.dateLong}`
        : "Any travel date",
    },
  ];

  return (
    <section aria-labelledby="brief-heading">
      <div className="flex items-center justify-between gap-2">
        <h2
          id="brief-heading"
          className={[
            "text-[11px] font-semibold uppercase tracking-[0.08em]",
            dark ? "text-white/58" : "text-ink-500",
          ].join(" ")}
        >
          Your trip brief
        </h2>
        {onEdit ? (
          <button
            type="button"
            onClick={onEdit}
            className={[
              "-mr-2 inline-flex h-11 items-center gap-1 rounded-lg px-2.5 text-[13px] font-medium",
              dark
                ? "text-route-cyan hover:bg-white/10 focus-ring-dark"
                : "text-accent-700 hover:bg-accent-50 focus-ring",
            ].join(" ")}
          >
            <Pencil size={12} strokeWidth={2.5} aria-hidden="true" />
            Edit
          </button>
        ) : null}
      </div>

      <ul className="mt-2 flex flex-wrap gap-1.5">
        {items.map((item, index) => {
          const changed = changedKeys.includes(item.key);
          // No `layout` on these items: layout animation on wrapping flex
          // children fights the stagger and the chips visibly scatter before
          // they settle. A plain fade-and-rise is what this needs.
          return (
            <motion.li
              key={item.key}
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: reduced ? 0.001 : 0.22,
                delay: reduced ? 0 : index * stagger.brief,
                ease: [...ease],
              }}
            >
              {/* Only the changed value pulses — the brief is not re-animated
                  wholesale on every edit. */}
              <motion.span
                key={`${item.key}-${item.value}`}
                initial={
                  changed && !reduced
                    ? { scale: 0.92, backgroundColor: "rgba(97,213,255,0.30)" }
                    : false
                }
                animate={{ scale: 1 }}
                transition={spring}
                className={[
                  "inline-flex h-8 items-center gap-1.5 rounded-full border px-2.5 text-[12.5px] font-medium tabular",
                  dark
                    ? changed
                      ? "border-route-cyan/60 bg-route-cyan/16 text-white"
                      : "border-white/16 bg-white/10 text-white/88"
                    : changed
                      ? "border-accent/45 bg-accent-50 text-accent-700"
                      : "border-ink-100 bg-canvas-well text-ink-700",
                ].join(" ")}
              >
                <span
                  aria-hidden="true"
                  className={dark ? "text-route-cyan" : "text-ink-500"}
                >
                  {item.icon}
                </span>
                <span aria-hidden="true">{item.value}</span>
                <span className="sr-only">{item.spoken}</span>
              </motion.span>
            </motion.li>
          );
        })}
      </ul>
    </section>
  );
}
