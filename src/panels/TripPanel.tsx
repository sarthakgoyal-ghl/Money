import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { RefreshCw, ShieldCheck, Sparkle } from "lucide-react";
import { AgentProgress } from "../components/ai/AgentProgress";
import type { AgentTask } from "../components/ai/AgentProgress";
import { InterpretedBrief } from "../components/ai/InterpretedBrief";
import { DockFlightRow } from "../components/dock/DockFlightRow";
import { DockNote } from "../components/dock/DockPrimitives";
import { nightMuted } from "../components/dock/night";
import { Button } from "../components/ui/Button";
import type { FlightOption, TripConstraints } from "../data/scenario";
import {
  currentBooking,
  fitOption,
  flightsCompared,
  formatDuration,
  formatINR,
} from "../data/scenario";
import { ease, riseIn } from "../motion/tokens";

export type TripPhase = "interpreting" | "proposal";

interface TripPanelProps {
  phase: TripPhase;
  request: string;
  constraints: TripConstraints;
  option: FlightOption;
  freshnessLabel: string;
  searchNonce: number;
  onEditBrief: () => void;
  onRefreshLiveData: () => void;
  onInterpretationComplete: () => void;
  onSeeOtherOptions: () => void;
  onKeepCurrentFlight: () => void;
}

const TASKS: AgentTask[] = [
  { id: "read", label: `Reading ${currentBooking.flightNo}` },
  { id: "rules", label: "Checking fare conditions" },
  { id: "compare", label: `Comparing ${flightsCompared} flights` },
  { id: "verify", label: "Verifying seats and live fares" },
];

const STEP_MS = 460;

/**
 * The request and the answer, as one conversation in the dock.
 *
 * The user's message stays at the top — the map is the context, this is the
 * exchange — and the assistant answers with a structured travel object rather
 * than prose. While it is working the work itself is the content; once it has an
 * answer, the flight leads and the request drops to provenance beneath it.
 */
export function TripPanel({
  phase,
  request,
  constraints,
  option,
  freshnessLabel,
  searchNonce,
  onEditBrief,
  onRefreshLiveData,
  onInterpretationComplete,
  onSeeOtherOptions,
  onKeepCurrentFlight,
}: TripPanelProps) {
  const reduced = useReducedMotion();
  const [completed, setCompleted] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const fit = fitOption(option, constraints);

  // Progressive interpretation. Deterministic timers, cleared on unmount so
  // leaving the panel mid-run can never advance state afterwards.
  useEffect(() => {
    if (phase !== "interpreting") return;
    setCompleted(0);

    const timers: number[] = [];
    TASKS.forEach((_, index) => {
      timers.push(
        window.setTimeout(() => setCompleted(index + 1), STEP_MS * (index + 1)),
      );
    });
    timers.push(
      window.setTimeout(onInterpretationComplete, STEP_MS * TASKS.length + 420),
    );

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [phase, onInterpretationComplete]);

  // A re-run after an edit or correction: brief agent activity, same route.
  useEffect(() => {
    if (phase !== "proposal" || searchNonce === 0) return;
    setRefreshing(true);
    const timer = window.setTimeout(() => setRefreshing(false), 620);
    return () => window.clearTimeout(timer);
  }, [phase, searchNonce]);

  const working = phase === "interpreting" || refreshing;

  return (
    <div className="space-y-4 pt-1">
      {/* While the assistant is working the request leads, because it is the
          only thing on screen that is certain. Once there is an answer the
          flight leads and the request drops to provenance at the bottom. */}
      {phase === "interpreting" ? <RequestLine request={request} /> : null}

      {working ? (
        <AgentProgress
          tasks={TASKS}
          completed={phase === "interpreting" ? completed : TASKS.length}
          tone="dark"
        />
      ) : null}

      {/* While interpreting, the brief IS the answer forming, so it leads.
          Once a flight exists the flight leads and the brief becomes the
          reasoning behind it. */}
      {phase === "interpreting" ? (
        <InterpretedBrief
          constraints={constraints}
          onEdit={onEditBrief}
          tone="dark"
        />
      ) : null}

      <AnimatePresence mode="wait" initial={false}>
        {phase === "interpreting" ? (
          <motion.div
            key="skeleton"
            {...riseIn(reduced, 10)}
            transition={{ duration: reduced ? 0.001 : 0.24, ease: [...ease] }}
          >
            <ProposalSkeleton progress={completed / TASKS.length} />
          </motion.div>
        ) : (
          <motion.div
            key="proposal"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduced ? 0.001 : 0.34, ease: [...ease] }}
            className="space-y-3.5"
          >
            <DockFlightRow
              flight={option.flight}
              price={option.price.total}
              statusLabel="Recommended"
              fit={fit}
            />

            {/* Alternatives sit with the option they are alternatives to, which
                keeps the pinned action area down to the one decision that
                actually costs money. */}
            <div className="grid grid-cols-2 gap-2">
              <Button variant="ghostOnDark" size="sm" onClick={onSeeOtherOptions}>
                Other options
              </Button>
              <Button variant="ghostOnDark" size="sm" onClick={onKeepCurrentFlight}>
                Keep {currentBooking.flightNo}
              </Button>
            </div>

            <p className="flex items-start gap-2 text-[13px] leading-snug text-white/78">
              <Sparkle
                size={13}
                strokeWidth={2.25}
                aria-hidden="true"
                className="mt-[2px] shrink-0 text-route-cyan"
              />
              <span>
                <span className="font-medium text-white">Best match:</span>{" "}
                earliest nonstop that keeps your {option.flight.seat.kind}-seat
                preference and stays{" "}
                <span className="font-medium tabular text-white">
                  {formatINR(Math.abs(fit.budgetHeadroom))}
                </span>{" "}
                under your limit. You arrive{" "}
                <span className="font-medium tabular text-white">
                  {formatDuration(fit.minutesEarlierThanCurrent)} earlier
                </span>{" "}
                than {currentBooking.flightNo}.
              </span>
            </p>

            <InterpretedBrief
              constraints={constraints}
              onEdit={onEditBrief}
              tone="dark"
            />

            <FreshnessRow
              label={freshnessLabel}
              refreshing={refreshing}
              onRefresh={onRefreshLiveData}
            />

            <div className="space-y-2.5 border-t border-white/10 pt-3">
              <RequestLine request={request} />
              <DockNote>
                Checked {flightsCompared} flights on {constraints.dateLong}.
                Simulated fares. No real booking or payment occurs.
              </DockNote>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface TripActionsProps {
  option: FlightOption;
  onReviewChange: () => void;
}

/**
 * One pinned action, carrying the exact amount.
 *
 * The alternatives live inline beside the flight they replace, so the only
 * thing permanently occupying the bottom of the dock is the decision that costs
 * money — and it never scrolls out of reach.
 */
export function TripActions({ option, onReviewChange }: TripActionsProps) {
  return (
    <div className="space-y-1.5">
      <Button variant="onDark" size="lg" fullWidth onClick={onReviewChange}>
        Review change · {formatINR(option.price.total)}
      </Button>
      <p className="flex items-center justify-center gap-1.5 text-[11.5px] text-white/58">
        <ShieldCheck size={12} strokeWidth={2.25} aria-hidden="true" />
        {currentBooking.flightNo} stays booked until you approve.
      </p>
    </div>
  );
}

/** The user's own words, never paraphrased. */
function RequestLine({ request }: { request: string }) {
  return (
    <div className="flex justify-end">
      <p className="max-w-[92%] rounded-2xl rounded-br-md border border-white/10 bg-white/[0.08] px-3.5 py-2.5 text-[13.5px] leading-snug text-white/88">
        <span className="sr-only">You said: </span>
        {request}
      </p>
    </div>
  );
}

interface FreshnessRowProps {
  label: string;
  refreshing: boolean;
  onRefresh: () => void;
}

function FreshnessRow({ label, refreshing, onRefresh }: FreshnessRowProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <p className={nightMuted}>
        Fare and seat refreshed <span className="tabular">{label}</span>
      </p>
      <button
        type="button"
        onClick={onRefresh}
        disabled={refreshing}
        className="-mr-2 inline-flex h-11 items-center gap-1.5 rounded-xl px-2.5 text-[12.5px] font-medium text-route-cyan hover:bg-white/[0.08] disabled:opacity-50 focus-ring-dark"
      >
        <RefreshCw
          size={13}
          strokeWidth={2.5}
          aria-hidden="true"
          className={refreshing ? "animate-spin" : ""}
        />
        {refreshing ? "Checking" : "Refresh"}
      </button>
    </div>
  );
}

/** The recommendation forming — structure first, then content. */
function ProposalSkeleton({ progress }: { progress: number }) {
  return (
    <div
      aria-hidden="true"
      className="rounded-2xl border border-white/10 bg-white/[0.045] p-4"
    >
      <div className="flex items-center justify-between">
        <span className="h-2.5 w-24 rounded-full bg-white/12" />
        <span className="h-2.5 w-14 rounded-full bg-white/12" />
      </div>
      <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <span className="block h-6 w-20 rounded-lg bg-white/12" />
        <span className="block h-[1px] w-12 bg-white/12" />
        <span className="ml-auto block h-6 w-20 rounded-lg bg-white/12" />
      </div>
      <div className="mt-4 space-y-2">
        {[0, 1, 2].map((row) => (
          <motion.span
            key={row}
            className="block h-2.5 rounded-full bg-white/12"
            initial={{ opacity: 0.4, width: "40%" }}
            animate={{
              opacity: progress > row / 3 ? 0.85 : 0.4,
              width: progress > row / 3 ? "72%" : "40%",
            }}
            transition={{ duration: 0.3, delay: row * 0.06, ease: [...ease] }}
          />
        ))}
      </div>
    </div>
  );
}
