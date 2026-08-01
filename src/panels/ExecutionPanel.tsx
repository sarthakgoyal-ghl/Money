import { useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Bell, Check, Lock } from "lucide-react";
import { DockNote } from "../components/dock/DockPrimitives";
import { Button } from "../components/ui/Button";
import { formatINR } from "../data/scenario";
import type { Flight, PriceBreakdown } from "../data/scenario";
import type { ExecutionStep } from "../state/machine";
import { ease } from "../motion/tokens";

interface ExecutionPanelProps {
  steps: ExecutionStep[];
  flight: Flight;
  price: PriceBreakdown;
  onTick: () => void;
  onComplete: () => void;
  totalMs?: number;
}

/**
 * Rebooking in progress — the map leads, the dock reports.
 *
 * This is the only state where the dock deliberately stays small: the route
 * drawing across the map *is* the progress indicator, and the tracker beneath it
 * names each step so "in progress" never means "unknown". No cancel control is
 * offered once ticketing has started, because offering one would invite exactly
 * the duplicate charge this flow exists to prevent.
 */
export function ExecutionPanel({
  steps,
  flight,
  price,
  onTick,
  onComplete,
  totalMs = 3200,
}: ExecutionPanelProps) {
  useEffect(() => {
    const interval = totalMs / (steps.length + 1);
    const timers: number[] = [];

    for (let index = 0; index < steps.length; index += 1) {
      timers.push(window.setTimeout(() => onTick(), interval * (index + 1)));
    }
    timers.push(
      window.setTimeout(() => onComplete(), interval * (steps.length + 1) + 300),
    );

    return () => timers.forEach((timer) => window.clearTimeout(timer));
    // Deterministic simulation: one scripted run per mount. Timers are cleared
    // on unmount so leaving the panel cannot advance state afterwards.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-3.5 pt-1">
      <ol className="space-y-2">
        {steps.map((step) => (
          <StepRow key={step.id} step={step} />
        ))}
      </ol>

      <dl className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-3">
        <div>
          <dt className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-white/58">
            Authorising
          </dt>
          <dd className="mt-0.5 text-[17px] font-semibold tabular text-white">
            {formatINR(price.total)}
          </dd>
        </div>
        <div className="text-right">
          <dt className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-white/58">
            Seat
          </dt>
          <dd className="mt-0.5 text-[17px] font-semibold tabular text-white">
            {flight.seat.label}
          </dd>
        </div>
      </dl>

      <DockNote icon={<Lock size={13} strokeWidth={2.25} />}>
        Cancelling during ticketing can create a duplicate charge, so I
        don&apos;t offer it here. Simulated booking. No real payment occurs.
      </DockNote>
    </div>
  );
}

interface ExecutionActionsProps {
  onLeave: () => void;
}

export function ExecutionActions({ onLeave }: ExecutionActionsProps) {
  return (
    <Button
      variant="ghostOnDark"
      size="lg"
      fullWidth
      onClick={onLeave}
      leadingIcon={<Bell size={15} strokeWidth={2.25} />}
    >
      Notify me when it&apos;s done
    </Button>
  );
}

/**
 * One step, with `blocked` shown as a distinct state rather than as "pending".
 *
 * The release of the original ticket is gated on the replacement existing — that
 * ordering is a safety property, so the interface shows it being enforced rather
 * than quietly reordering a list.
 */
function StepRow({ step }: { step: ExecutionStep }) {
  const reduced = useReducedMotion();
  const done = step.status === "done";
  const active = step.status === "active";
  const blocked = step.status === "blocked";

  return (
    <li className="flex items-start gap-3">
      <span
        aria-hidden="true"
        className={[
          "mt-[1px] flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border",
          done
            ? "border-signal-ok bg-signal-ok text-night"
            : active
              ? "border-route-cyan bg-route-cyan/20"
              : blocked
                ? "border-white/18 border-dashed bg-transparent"
                : "border-white/18 bg-transparent",
        ].join(" ")}
      >
        {done ? <Check size={11} strokeWidth={3} /> : null}
        {active ? (
          <motion.span
            className="h-1.5 w-1.5 rounded-full bg-route-cyan"
            animate={reduced ? {} : { opacity: [1, 0.35, 1] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: [...ease] }}
          />
        ) : null}
      </span>

      <span className="min-w-0 flex-1">
        <span
          className={[
            "block text-[13.5px] leading-snug",
            done ? "text-white/62" : active ? "text-white" : "text-white/58",
          ].join(" ")}
        >
          {step.label}
        </span>
        {blocked ? (
          <span className="mt-0.5 block text-[11.5px] leading-snug text-white/52">
            Waiting. Held until the replacement ticket exists
          </span>
        ) : null}
        <span className="sr-only">
          {done
            ? ", done"
            : active
              ? ", in progress"
              : blocked
                ? ", blocked until the previous step completes"
                : ", not started"}
        </span>
      </span>
    </li>
  );
}
