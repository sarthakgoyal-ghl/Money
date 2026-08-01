import type { DeadlineIntent, TripConstraints } from "../../../data/scenario";
import {
  briefSummary,
  currentBooking,
  userCorrection,
} from "../../../data/scenario";
import type { MisreadChoice } from "../../../panels/MisreadPanel";
import { CautionText, FigButton } from "../FigButton";
import {
  FigSelectionCheck,
  figSelectableRowClass,
} from "../FigSelectionCheck";
import { FigAlert, FigCard, FigSheet } from "../FigSheet";

interface MisreadSheetProps {
  constraints: TripConstraints;
  choice: MisreadChoice | null;
  onChoose: (choice: MisreadChoice) => void;
  onApply: () => void;
  onClose: () => void;
}

const CHOICES = [
  [
    "depart",
    (deadline: string) => `Depart before ${deadline}`,
    "Leaving Mumbai on time matters most",
  ],
  [
    "arrive",
    (deadline: string) => `Arrive before ${deadline}`,
    "Landing in Bengaluru on time matters most",
  ],
  ["rewrite", () => "Rewrite my request", "Start from a new message instead"],
] as const;

/**
 * Misunderstanding repair — same sheet system as Rejected / Handoff / Price
 * change: short title·subtitle, gap-12 body, white plates, FigAlert, compact CTA.
 *
 * Not a chat replay — one constraint is corrected; budget, seat, and date stay.
 */
export function MisreadSheet({
  constraints,
  choice,
  onChoose,
  onApply,
  onClose,
}: MisreadSheetProps) {
  const previewIntent: DeadlineIntent =
    choice === "depart"
      ? "depart_before"
      : choice === "arrive"
        ? "arrive_before"
        : constraints.intent;

  const previewConstraints: TripConstraints = {
    ...constraints,
    intent: previewIntent,
  };

  // Arrive keeps the existing arrival deadline — never show Arrive → Arrive.
  const correctedLabel =
    choice === "arrive"
      ? "Keep Arrive by 18:00"
      : choice === "rewrite"
        ? "You'll tell me"
        : choice === "depart"
          ? "Depart by 18:00"
          : "…";

  const subtitle = (
    <>
      I treated 18:00 as an arrival deadline.
      <br />
      <span className="fig-w-semibold text-fig-600">{currentBooking.flightNo}</span>
      {" · seat "}
      <span className="fig-w-semibold tabular text-fig-600">
        {currentBooking.seat.label}
      </span>
      {" unchanged."}
    </>
  );

  return (
    <FigSheet
      height="full"
      expandHeight="full"
      showScrim={false}
      showHandle
      chromePadTop={6}
      title="Thanks for correcting that."
      subtitle={subtitle}
      onClose={onClose}
      footer={
        <div className="flex w-full flex-col gap-[6px]">
          <FigButton
            variant="primary"
            fullWidth
            compact
            onClick={onApply}
            disabled={!choice}
          >
            {choice === "rewrite" ? "Rewrite my request" : "Update flight options"}
          </FigButton>
          <CautionText>
            Correcting one constraint re-runs the search. It never restarts the
            conversation.
          </CautionText>
        </div>
      }
    >
      <div className="flex w-full flex-col gap-[16px] pb-[8px]">
        <FigAlert tone="success">
          No booking or payment changes were made.
        </FigAlert>

        <FigCard className="flex flex-col gap-[10px] p-[14px]">
          <div className="flex flex-col gap-[4px]">
            <p className="text-[13px] leading-normal text-fig-600">You said</p>
            <p className="text-[15px] leading-[20px] text-fig-900">
              {userCorrection}
            </p>
          </div>

          <div
            aria-hidden="true"
            className="h-px w-full bg-fig-line"
          />

          <div className="flex flex-col gap-[8px]">
            <p className="text-[13px] leading-normal text-fig-600">
              The constraint I got wrong
            </p>
            <p className="flex flex-wrap items-baseline gap-x-[8px] gap-y-[4px] text-[15px] fig-w-semibold tabular leading-[20px] text-fig-900">
              {choice === "arrive" ? (
                <span className="text-fig-blue">{correctedLabel}</span>
              ) : (
                <>
                  <span className="text-fig-400 line-through">Arrive by 18:00</span>
                  <span aria-hidden="true" className="font-normal text-fig-400">
                    →
                  </span>
                  <span
                    className={
                      choice === "depart" ? "text-fig-blue" : "text-fig-900"
                    }
                  >
                    {correctedLabel}
                  </span>
                </>
              )}
            </p>
          </div>
        </FigCard>

        <div
          role="group"
          aria-labelledby="misread-deadline-label"
          className="flex w-full flex-col gap-[6px]"
        >
          <p
            id="misread-deadline-label"
            className="font-ui text-[13px] font-light leading-normal text-fig-600"
          >
            Which deadline should I use?
          </p>
          <div
            role="radiogroup"
            aria-labelledby="misread-deadline-label"
            className="flex flex-col gap-[6px]"
          >
            {CHOICES.map(([value, titleOf, detail]) => {
              const selected = choice === value;
              const title =
                typeof titleOf === "function"
                  ? titleOf(constraints.deadlineLabel)
                  : titleOf;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => onChoose(value)}
                  className={figSelectableRowClass(selected)}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14.5px] font-medium text-fig-900">
                      {title}
                    </span>
                    <span className="block text-[12px] text-fig-600">
                      {detail}
                    </span>
                  </span>
                  <FigSelectionCheck selected={selected} />
                </button>
              );
            })}
          </div>
        </div>

        {choice && choice !== "rewrite" ? (
          /* Same brief plate as Other options `1204:81009`. */
          <div className="flex w-full flex-col items-center justify-center rounded-[14px] bg-white p-[12px]">
            <div className="flex w-full flex-col gap-[4px]">
              <p className="font-ui text-[11px] font-light leading-normal text-[#666]">
                Updated brief preview
              </p>
              <p className="fig-w-semibold text-[15px] leading-[17px] text-fig-900">
                {briefSummary(previewConstraints)}
              </p>
              <p className="text-[13px] leading-normal text-fig-900">
                Budget, seat preference, and travel date are unchanged.
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </FigSheet>
  );
}
