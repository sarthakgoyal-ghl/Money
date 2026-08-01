import { useEffect, useId, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type {
  FlightOption,
  SeatPreference,
  TripConstraints,
} from "../../../data/scenario";
import {
  briefSummary,
  budgetChoices,
  deadlineChoices,
  formatINR,
  matchingOptions,
  recommendationReason,
  recommendedOption,
} from "../../../data/scenario";
import { FigButton, CautionText } from "../FigButton";
import { FigDisclosure } from "../FigDisclosure";
import { FigFlightCard } from "../FigFlightCard";
import { FigSheet, type FigSheetHeight } from "../FigSheet";
import { ease } from "../../../motion/tokens";

const SEAT_OPTIONS: readonly SeatPreference[] = [
  "Window",
  "Aisle",
  "Window or aisle",
  "Any",
];

interface OtherOptionsSheetProps {
  constraints: TripConstraints;
  options: FlightOption[];
  selectedFlightId: string;
  startWithResults: boolean;
  onClose: () => void;
  onApplyConstraints: (patch: Partial<TripConstraints>) => void;
  onSelectOption: (option: FlightOption) => void;
  onUseSelected: (option: FlightOption) => void;
}

/**
 * Other options — Figma `1204:80934` (full glass sheet 820/874) with controls
 * body `1204:80991`. Collapse matches Review: chevron → partial, expand → full.
 *
 * Body order in the file is current brief → filters → divider → results.
 * Seat row is a single Content Switcher, not a 2×2 grid.
 */
export function OtherOptionsSheet({
  constraints,
  options,
  selectedFlightId,
  startWithResults,
  onClose,
  onApplyConstraints,
  onSelectOption,
  onUseSelected,
}: OtherOptionsSheetProps) {
  const reduced = useReducedMotion();
  const [height, setHeight] = useState<FigSheetHeight>("full");
  const [draft, setDraft] = useState(constraints);
  const [showResults, setShowResults] = useState(startWithResults);
  const [searching, setSearching] = useState(false);
  const [whyOpen, setWhyOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const whyId = useId();
  const compareId = useId();

  // Re-enter with the parent's start mode; keep draft in sync with the shared
  // brief without wiping results after a search applies the same draft.
  useEffect(() => {
    setHeight("full");
    setShowResults(startWithResults);
  }, [startWithResults]);

  useEffect(() => {
    setDraft(constraints);
  }, [constraints]);

  const matches = matchingOptions(draft, options);
  const expectedMatches = matches.length;
  const dirty = JSON.stringify(draft) !== JSON.stringify(constraints);
  const selected =
    options.find((option) => option.flight.id === selectedFlightId) ??
    recommendedOption;

  const patch = (next: Partial<TripConstraints>) => {
    setDraft((current: TripConstraints) => ({ ...current, ...next }));
    setShowResults(false);
  };

  /** Persist the draft brief so close/reopen keeps the same constraints object. */
  const commitDraft = () => {
    if (JSON.stringify(draft) !== JSON.stringify(constraints)) {
      onApplyConstraints(draft);
    }
  };

  const handleClose = () => {
    commitDraft();
    onClose();
  };

  const runSearch = () => {
    onApplyConstraints(draft);
    setSearching(true);
    window.setTimeout(() => {
      setSearching(false);
      setShowResults(true);
    }, 700);
  };

  const resultsCurrent = showResults && !dirty && !searching;
  const footer = resultsCurrent ? (
    <FigButton variant="footer" fullWidth onClick={() => onUseSelected(selected)}>
      Use {selected.flight.flightNo} · {formatINR(selected.price.total)}
    </FigButton>
  ) : (
    <FigButton variant="footer" fullWidth onClick={runSearch} disabled={searching}>
      {searching ? "Checking live fares" : "Find updated options"}
    </FigButton>
  );

  return (
    <FigSheet
      height={height}
      expandHeight="full"
      onHeightChange={setHeight}
      showScrim={false}
      showHandle
      chromePadTop={6}
      title="Other options"
      subtitle="Here's everything I compared."
      onClose={handleClose}
      footer={footer}
      contentKey={`${showResults}-${dirty}-${searching}`}
    >
      {/* `1204:80991` — brief → filters → divider → results → divider → disclosures. */}
      <div className="flex flex-col gap-[16px] pb-[8px]">
        {/* `81009` */}
        <div className="flex w-full flex-col items-center justify-center rounded-[14px] bg-white p-[12px]">
          <div className="flex w-full flex-col gap-[4px]">
            <p className="font-ui text-[11px] font-light leading-normal text-[#666]">
              Current brief
            </p>
            <p className="fig-w-semibold text-[15px] leading-[17px] text-fig-900">
              {briefSummary(draft)}
            </p>
            <p className="text-[13px] leading-normal text-fig-900">
              {expectedMatches === 0
                ? "No flights match this brief"
                : `${expectedMatches} of ${options.length} flights match this brief`}
            </p>
          </div>
        </div>

        {/* `80992` — fields at gap 10, label→control gap 4. */}
        <div className="flex flex-col gap-[10px]">
          <FigField label={draft.intent === "arrive_before" ? "Arrive by" : "Depart by"}>
            <FigContentSwitcher
              value={draft.deadlineLabel}
              options={deadlineChoices.map((choice) => ({
                value: choice.value,
                label: choice.label,
              }))}
              onChange={(value) => patch({ deadlineLabel: value })}
            />
          </FigField>

          <FigField label="Maximum extra cost">
            <FigContentSwitcher
              value={String(draft.maxExtraCost)}
              options={budgetChoices.map((choice) => ({
                value: choice.value,
                label: choice.label,
              }))}
              onChange={(value) => patch({ maxExtraCost: Number(value) })}
            />
          </FigField>

          <FigField label="Seat preference">
            <FigContentSwitcher
              value={draft.seatPreference}
              options={SEAT_OPTIONS.map((seat) => ({
                value: seat,
                label: seat,
                // Figma: Window / Window or aisle hug; Aisle / Any fill.
                grow: seat === "Aisle" || seat === "Any",
              }))}
              onChange={(value) => patch({ seatPreference: value as SeatPreference })}
            />
          </FigField>

          <FigField label="Stops">
            <div className="flex items-center gap-[8px] rounded-[14px] bg-white p-[12px]">
              <div className="flex min-w-0 flex-1 flex-col gap-[4px]">
                <p className="fig-w-semibold text-[15px] leading-[15px] text-fig-900">
                  Nonstop only
                </p>
                <p className="text-[13px] leading-normal text-fig-600">
                  Your current flight is nonstop
                </p>
              </div>
              <FigToggle
                checked={draft.nonstopOnly}
                onChange={(checked) => patch({ nonstopOnly: checked })}
                label="Nonstop only"
              />
            </div>
          </FigField>
        </div>

        {searching ? (
          <p role="status" className="text-[13px] text-fig-600">
            Checking live fares and seat availability…
          </p>
        ) : null}

        {showResults && !searching ? (
          <>
            {/* `81014` */}
            <div aria-hidden="true" className="h-px w-full bg-fig-line" />

            {/* `81015` — header + cards at gap 6. */}
            <div className="flex flex-col gap-[6px]">
              <div className="flex flex-col gap-[4px]">
                <p className="fig-w-semibold text-[15px] leading-[15px] text-fig-900">
                  {expectedMatches} of {options.length} match your brief
                </p>
                <p className="text-[13px] leading-normal text-fig-600">
                  Sorted by earliest arrival. Tap one to use it.
                </p>
              </div>

              {matches.map((option, index) => {
                const isSave =
                  !option.recommended &&
                  option.price.total < recommendedOption.price.total;
                return (
                  <motion.div
                    key={option.flight.id}
                    initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: reduced ? 0.001 : 0.28,
                      delay: reduced ? 0 : index * 0.05,
                      ease: [...ease],
                    }}
                  >
                    <FigFlightCard
                      flight={option.flight}
                      kind={
                        option.recommended
                          ? "recommended"
                          : isSave
                            ? "saving"
                            : "plain"
                      }
                      extra={option.price.total}
                      selected={option.flight.id === selectedFlightId}
                      onSelect={() => onSelectOption(option)}
                      eyebrow={
                        option.recommended
                          ? "Recommended"
                          : isSave
                            ? `Save ${formatINR(recommendedOption.price.total - option.price.total)}`
                            : undefined
                      }
                    />
                  </motion.div>
                );
              })}
            </div>

            {/* `81089` + `81090` — disclosures at gap 8. */}
            <div aria-hidden="true" className="h-px w-full bg-fig-line" />

            <div className="flex flex-col gap-[8px]">
              <FigDisclosure
                id={whyId}
                label="Why this one is recommended"
                open={whyOpen}
                onToggle={() => setWhyOpen((value) => !value)}
              >
                {recommendationReason(recommendedOption, draft)}
              </FigDisclosure>

              <FigDisclosure
                id={compareId}
                label="Compare the differences"
                open={compareOpen}
                onToggle={() => setCompareOpen((value) => !value)}
              >
                <CompareTable options={matches.length > 0 ? matches : options} />
              </FigDisclosure>
            </div>
          </>
        ) : null}

        {/* `81099` */}
        <CautionText>
          Simulated fares. Changing the brief never changes your existing booking.
        </CautionText>
      </div>
    </FigSheet>
  );
}

function FigField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-[4px]">
      <p className="font-ui text-[11px] font-light leading-normal text-fig-600">
        {label}
      </p>
      {children}
    </div>
  );
}

/**
 * Figma Content Switcher — one white pill, 1 px inset, selected cell `#eff4ff`
 * with `#0078ff` type. Items share a hairline, never a gap.
 */
function FigContentSwitcher({
  value,
  options,
  onChange,
}: {
  value: string;
  options: readonly { value: string; label: string; grow?: boolean }[];
  onChange: (value: string) => void;
}) {
  return (
    <div
      role="radiogroup"
      className="flex w-full items-center overflow-hidden rounded-[14px] border border-white bg-white p-[1px]"
    >
      {options.map((option, index) => {
        const active = option.value === value;
        const last = index === options.length - 1;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={[
              "flex h-[36px] items-center justify-center px-[14px] font-ui text-[14px] font-semibold leading-[20px] focus-ring-fig",
              option.grow === false ? "shrink-0" : "min-w-0 flex-1",
              active
                ? "border border-[#eff4ff] bg-[#eff4ff] text-[#0078ff]"
                : [
                    "bg-white text-[#344054]",
                    last ? "" : "border-r border-[#f2f4f7]",
                  ].join(" "),
            ].join(" ")}
          >
            <span className="whitespace-nowrap">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function FigToggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={[
        "relative flex h-[24px] w-[44px] shrink-0 items-center overflow-hidden rounded-[12px] p-[2px] transition-colors focus-ring-fig",
        checked ? "justify-end bg-[#0088ff]" : "justify-start bg-[#d0d5dd]",
      ].join(" ")}
    >
      <span
        aria-hidden="true"
        className="block h-[20px] w-[20px] rounded-full bg-white shadow-[0_1px_2px_rgba(16,24,40,0.16)]"
      />
    </button>
  );
}

function CompareTable({ options }: { options: FlightOption[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-[13px]">
        <thead>
          <tr>
            <th className="pb-2 pr-3 font-normal text-fig-400">&nbsp;</th>
            {options.map((option) => (
              <th
                key={option.flight.id}
                className="pb-2 pr-3 font-semibold text-fig-900"
              >
                {option.flight.flightNo}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[
            {
              key: "arrive",
              label: "Arrives",
              read: (o: FlightOption) => o.flight.arriveLabel,
            },
            {
              key: "extra",
              label: "Extra",
              read: (o: FlightOption) => formatINR(o.price.total),
            },
            {
              key: "seat",
              label: "Seat",
              read: (o: FlightOption) =>
                `${o.flight.seat.label} · ${o.flight.seat.kind}`,
            },
          ].map((row) => (
            <tr key={row.key} className="border-t border-fig-line">
              <th scope="row" className="py-2 pr-3 font-normal text-fig-600">
                {row.label}
              </th>
              {options.map((option) => (
                <td
                  key={option.flight.id}
                  className="py-2 pr-3 capitalize tabular text-fig-900"
                >
                  {row.read(option)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
