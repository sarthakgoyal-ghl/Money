import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import { TripPulse } from "../components/ai/TripPulse";
import {
  DockSegmented,
  DockToggle,
} from "../components/dock/DockControls";
import { DockFlightRow } from "../components/dock/DockFlightRow";
import { DockDisclosure, DockNote } from "../components/dock/DockPrimitives";
import { nightEyebrow } from "../components/dock/night";
import { Button } from "../components/ui/Button";
import type {
  FlightOption,
  SeatPreference,
  TripConstraints,
} from "../data/scenario";
import {
  briefSummary,
  budgetChoices,
  deadlineChoices,
  fitOption,
  formatINR,
  matchingOptions,
  recommendedOption,
} from "../data/scenario";
import { ease, stagger } from "../motion/tokens";

const SEAT_OPTIONS: ReadonlyArray<SeatPreference> = [
  "Window",
  "Aisle",
  "Window or aisle",
  "Any",
];

export interface RefineState {
  draft: TripConstraints;
  searching: boolean;
  showResults: boolean;
  dirty: boolean;
  expectedMatches: number;
}

interface RefinePanelProps {
  constraints: TripConstraints;
  options: FlightOption[];
  selectedFlightId: string;
  /** True when opened straight into results rather than into the controls. */
  startWithResults: boolean;
  onApplyConstraints: (patch: Partial<TripConstraints>) => void;
  onSelectOption: (option: FlightOption) => void;
  /** Publishes internal state so the dock's action area can reflect it. */
  onStateChange: (state: RefineState) => void;
  /** Set by the actions area to trigger a search. */
  searchSignal: number;
}

/**
 * The brief as an editable object, inside the dock.
 *
 * Not a settings screen: the live brief sits above the controls and rewrites
 * itself as values change, the expected match count moves with it, and results
 * replace the lower half of the same panel. Changing a constraint withdraws the
 * previous results rather than leaving stale rows on screen that no longer
 * answer the question being asked.
 */
export function RefinePanel({
  constraints,
  options,
  selectedFlightId,
  startWithResults,
  onApplyConstraints,
  onSelectOption,
  onStateChange,
  searchSignal,
}: RefinePanelProps) {
  const reduced = useReducedMotion();
  const [draft, setDraft] = useState<TripConstraints>(constraints);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(startWithResults);
  const resultsRef = useRef<HTMLElement | null>(null);

  // Re-sync only when the panel is entered, so the draft can never drift away
  // from the brief the rest of the flow is using — and so applying the draft
  // (which dispatches a constraint change) does not wipe the results it just
  // produced.
  const entered = useRef(false);
  useEffect(() => {
    if (entered.current) return;
    entered.current = true;
    setDraft(constraints);
    setShowResults(startWithResults);
  }, [constraints, startWithResults]);

  useEffect(() => {
    if (!searching) return;
    const timer = window.setTimeout(() => {
      setSearching(false);
      setShowResults(true);
    }, 700);
    return () => window.clearTimeout(timer);
  }, [searching]);

  // Asking to see the options and landing on a wall of controls with the
  // options below the fold reads as the assistant ignoring the request.
  //
  // Scrolls the dock's own container rather than calling `scrollIntoView`:
  // that walks up to any scrollable ancestor, and here it dragged the whole
  // app shell up by ~80px, leaving a dead strip under the composer.
  useEffect(() => {
    if (!startWithResults) return;
    const timer = window.setTimeout(() => {
      const target = resultsRef.current;
      const scroller = target?.closest<HTMLElement>(".overflow-y-auto");
      if (!target || !scroller) return;

      const offset =
        target.getBoundingClientRect().top -
        scroller.getBoundingClientRect().top +
        scroller.scrollTop;
      scroller.scrollTo({ top: offset, behavior: reduced ? "auto" : "smooth" });
    }, 420);
    return () => window.clearTimeout(timer);
  }, [startWithResults, reduced]);

  // The action lives in the dock's pinned footer, so it signals in rather than
  // calling directly.
  const lastSignal = useRef(searchSignal);
  useEffect(() => {
    if (searchSignal === lastSignal.current) return;
    lastSignal.current = searchSignal;
    onApplyConstraints(draft);
    setSearching(true);
  }, [searchSignal, draft, onApplyConstraints]);

  const expectedMatches = matchingOptions(draft, options).length;
  const dirty = JSON.stringify(draft) !== JSON.stringify(constraints);

  useEffect(() => {
    onStateChange({ draft, searching, showResults, dirty, expectedMatches });
  }, [draft, searching, showResults, dirty, expectedMatches, onStateChange]);

  const patch = (next: Partial<TripConstraints>) => {
    setDraft((current) => {
      const merged = { ...current, ...next };
      // Sync the shared constraints object immediately so reopen preserves the brief.
      onApplyConstraints(next);
      return merged;
    });
    // A changed brief may no longer describe the results on screen, so they are
    // withdrawn until the search is re-run.
    setShowResults(false);
  };

  return (
    <div className="space-y-5 pt-1">
      {/* The live brief — the one readout both halves of the panel share. */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-3.5">
        <p className={nightEyebrow}>Current brief</p>
        <motion.p
          key={briefSummary(draft)}
          initial={reduced ? false : { opacity: 0.45 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.22 }}
          className="mt-1 text-[14px] font-medium leading-snug tabular text-white"
        >
          {briefSummary(draft)}
        </motion.p>
        <p
          role="status"
          aria-live="polite"
          className="mt-1.5 text-[12.5px] text-white/68"
        >
          {expectedMatches === 0
            ? "No flights match this brief"
            : `${expectedMatches} of ${options.length} flights match this brief`}
        </p>
      </div>

      <Field label={draft.intent === "arrive_before" ? "Arrive by" : "Depart by"}>
        <DockSegmented
          name="deadline"
          ariaLabel={draft.intent === "arrive_before" ? "Arrive by" : "Depart by"}
          value={draft.deadlineLabel}
          options={deadlineChoices}
          onChange={(value) => patch({ deadlineLabel: value })}
        />
      </Field>

      <Field label="Maximum extra cost">
        <DockSegmented
          name="budget"
          ariaLabel="Maximum extra cost"
          value={String(draft.maxExtraCost)}
          options={budgetChoices}
          onChange={(value) => patch({ maxExtraCost: Number(value) })}
        />
      </Field>

      <Field label="Seat preference">
        <div
          className="grid grid-cols-2 gap-2"
          role="radiogroup"
          aria-label="Seat preference"
        >
          {SEAT_OPTIONS.map((seat) => {
            const active = draft.seatPreference === seat;
            return (
              <button
                key={seat}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => patch({ seatPreference: seat })}
                className={[
                  "flex h-11 items-center justify-center gap-1.5 rounded-full border text-[13.5px] font-medium focus-ring-dark",
                  active
                    ? "border-white bg-white text-night"
                    : "border-white/16 bg-white/[0.05] text-white/82 hover:bg-white/[0.1]",
                ].join(" ")}
              >
                {active ? (
                  <Check size={12} strokeWidth={3} aria-hidden="true" />
                ) : null}
                {seat}
              </button>
            );
          })}
        </div>
      </Field>

      <Field label="Stops">
        <DockToggle
          checked={draft.nonstopOnly}
          onChange={(value) => patch({ nonstopOnly: value })}
          label="Nonstop only"
          hint="Your current flight is nonstop"
        />
      </Field>

      <AnimatePresence initial={false}>
        {showResults && !searching ? (
          <motion.section
            key="results"
            ref={resultsRef}
            aria-labelledby="refine-results"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0.001 : 0.3, ease: [...ease] }}
            className="border-t border-white/10 pt-4"
          >
            {/* This count must agree with the brief readout above — a header
                claiming N options over rows all marked "outside your brief"
                reads as the assistant contradicting itself. */}
            <h3
              id="refine-results"
              className="text-[13px] font-semibold text-white"
            >
              {expectedMatches === 0
                ? "No option matches this brief"
                : `${expectedMatches} of ${options.length} match your brief`}
            </h3>
            <p className="mt-0.5 text-[12.5px] text-white/68">
              {expectedMatches === 0
                ? "Showing the closest available. Picking one means approving a change outside the limits you set."
                : "Sorted by earliest arrival. Tap one to use it."}
            </p>

            <div
              role="radiogroup"
              aria-label="Available flights"
              className="mt-3 space-y-2.5"
            >
              {options.map((option, index) => (
                <motion.div
                  key={option.flight.id}
                  initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: reduced ? 0.001 : 0.28,
                    delay: reduced ? 0 : index * stagger.results,
                    ease: [...ease],
                  }}
                >
                  <DockFlightRow
                    flight={option.flight}
                    price={option.price.total}
                    statusLabel={option.recommended ? "Recommended" : undefined}
                    fit={fitOption(option, draft)}
                    selected={option.flight.id === selectedFlightId}
                    onSelect={() => onSelectOption(option)}
                    note={savingLabel(option)}
                  />
                </motion.div>
              ))}
            </div>

            <div className="mt-3 space-y-0.5 border-t border-white/10 pt-2">
              <DockDisclosure label="Why this one is recommended">
                <p className="text-[13px] leading-snug text-white/78">
                  {recommendedOption.flight.flightNo} is the earliest nonstop
                  arrival that also holds a {recommendedOption.flight.seat.kind}{" "}
                  seat. The cheaper option saves money but lands later, leaving
                  less margin before your deadline.
                </p>
              </DockDisclosure>
              <DockDisclosure label="Compare the differences">
                <ComparisonTable
                  options={options}
                  constraints={draft}
                  selectedFlightId={selectedFlightId}
                />
              </DockDisclosure>
            </div>
          </motion.section>
        ) : null}
      </AnimatePresence>

      {searching ? (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center gap-2.5 border-t border-white/10 pt-4 text-[13.5px] text-white/82"
        >
          <TripPulse state="working" size={20} />
          Checking live fares and seat availability
        </div>
      ) : null}

      <DockNote>
        Simulated fares. Changing the brief never changes your existing booking.
      </DockNote>
    </div>
  );
}

interface RefineActionsProps {
  state: RefineState | null;
  selectedOption: FlightOption | undefined;
  onSearch: () => void;
  onUseSelected: (option: FlightOption) => void;
}

/**
 * Never a dead disabled button: once results are current, the primary action
 * becomes "use the option you picked" rather than a greyed-out "search again".
 */
export function RefineActions({
  state,
  selectedOption,
  onSearch,
  onUseSelected,
}: RefineActionsProps) {
  const resultsCurrent =
    state?.showResults === true && !state.dirty && !state.searching;

  if (resultsCurrent && selectedOption) {
    return (
      <Button
        variant="onDark"
        size="lg"
        fullWidth
        onClick={() => onUseSelected(selectedOption)}
      >
        Use {selectedOption.flight.flightNo} · {formatINR(selectedOption.price.total)}
      </Button>
    );
  }

  return (
    <Button
      variant="onDark"
      size="lg"
      fullWidth
      onClick={onSearch}
      disabled={state?.searching === true}
    >
      {state?.searching ? "Checking live fares" : "Find updated options"}
    </Button>
  );
}

function savingLabel(option: FlightOption): string | undefined {
  const delta = recommendedOption.price.total - option.price.total;
  return delta > 0 ? `Save ${formatINR(delta)}` : undefined;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className={`mb-2 ${nightEyebrow}`}>{label}</p>
      {children}
    </div>
  );
}

interface ComparisonTableProps {
  options: FlightOption[];
  constraints: TripConstraints;
  selectedFlightId: string;
}

/** Side-by-side differences, so choosing is a comparison rather than a guess. */
function ComparisonTable({
  options,
  constraints,
  selectedFlightId,
}: ComparisonTableProps) {
  const rows = [
    { key: "arrive", label: "Arrives" },
    { key: "extra", label: "Extra cost" },
    { key: "seat", label: "Seat" },
    { key: "margin", label: "Margin" },
  ] as const;

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-[12.5px]">
        <caption className="sr-only">
          The compared flights and how each one fits your brief
        </caption>
        <thead>
          <tr>
            <th scope="col" className="pb-2 pr-3 font-medium text-white/58">
              &nbsp;
            </th>
            {options.map((option) => (
              <th
                key={option.flight.id}
                scope="col"
                className={[
                  "pb-2 pr-3 font-semibold tabular",
                  option.flight.id === selectedFlightId
                    ? "text-route-cyan"
                    : "text-white/82",
                ].join(" ")}
              >
                {option.flight.flightNo}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="border-t border-white/10">
              <th
                scope="row"
                className="py-2 pr-3 font-normal align-top text-white/58"
              >
                {row.label}
              </th>
              {options.map((option) => {
                const fit = fitOption(option, constraints);
                const value =
                  row.key === "arrive"
                    ? option.flight.arriveLabel
                    : row.key === "extra"
                      ? formatINR(option.price.total)
                      : row.key === "seat"
                        ? `${option.flight.seat.label} · ${option.flight.seat.kind}`
                        : fit.minutesBeforeDeadline >= 0
                          ? `${fit.minutesBeforeDeadline} min spare`
                          : `${Math.abs(fit.minutesBeforeDeadline)} min late`;
                return (
                  <td
                    key={option.flight.id}
                    className="py-2 pr-3 align-top tabular capitalize text-white/88"
                  >
                    {value}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
