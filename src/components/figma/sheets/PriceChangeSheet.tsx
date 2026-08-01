import type { MaterialDifference } from "../../../state/approval";
import type { TripConstraints } from "../../../data/scenario";
import {
  currentBooking,
  formatINR,
  recommendedOption,
  repricedTotal,
} from "../../../data/scenario";
import { FigButton, SafetyNote } from "../FigButton";
import { FigAlert, FigCard, FigSheet } from "../FigSheet";

interface PriceChangeSheetProps {
  constraints: TripConstraints;
  differences: MaterialDifference[];
  onFindAnother: () => void;
  onReviewRepriced: () => void;
  onKeepCurrent: () => void;
  onClose: () => void;
}

/** Price-change failure — inferred from Figma system. */
export function PriceChangeSheet({
  constraints,
  differences,
  onFindAnother,
  onReviewRepriced,
  onKeepCurrent,
  onClose,
}: PriceChangeSheetProps) {
  const overLimitBy = repricedTotal - constraints.maxExtraCost;

  return (
    <FigSheet
      height="full"
      expandHeight="full"
      showScrim={false}
      showHandle
      chromePadTop={6}
      title="The price changed, so I stopped"
      subtitle="Nothing was charged. Your original booking is unchanged."
      onClose={onClose}
      footer={
        /* CTA stack — Figma `1204:80891` (primary · soft pair · SafetyNote). */
        <div className="flex w-full flex-col items-center gap-[6px]">
          <FigButton variant="primary" fullWidth compact onClick={onFindAnother}>
            Find another under {formatINR(constraints.maxExtraCost)}
          </FigButton>

          <div className="flex w-full items-start gap-[6px]">
            <FigButton
              variant="soft"
              compact
              className="min-w-0 flex-1"
              onClick={onReviewRepriced}
            >
              Review {formatINR(repricedTotal)}
            </FigButton>
            <FigButton
              variant="soft"
              compact
              className="min-w-0 flex-1"
              onClick={onKeepCurrent}
            >
              Keep {currentBooking.flightNo}
            </FigButton>
          </div>

          <SafetyNote>
            Reviewing the higher price starts a new approval.
          </SafetyNote>
        </div>
      }
    >
      <div className="flex flex-col gap-[16px] pb-[8px]">
        <FigCard className="border border-fig-warn/30 bg-fig-warn/[0.08] p-[14px]">
          <div className="flex items-baseline gap-[8px] text-[18px] font-semibold tabular text-fig-900">
            <span className="text-fig-400 line-through">
              {formatINR(recommendedOption.price.total)}
            </span>
            <span aria-hidden="true" className="text-fig-400">
              →
            </span>
            <span className="text-fig-warn-600">{formatINR(repricedTotal)}</span>
          </div>
          <p className="mt-[8px] text-[13px] leading-[18px] text-fig-600">
            That is {formatINR(overLimitBy)} above your {formatINR(constraints.maxExtraCost)} limit.
            Your approval covered the exact earlier amount, so it no longer applies.
          </p>
        </FigCard>

        <FigAlert tone="success">
          Nothing was charged. {currentBooking.flightNo} at {currentBooking.departLabel} · seat{" "}
          {currentBooking.seat.label} remains confirmed. No automatic retry.
        </FigAlert>

        {differences.length > 0 ? (
          <FigCard className="p-[14px]">
            <p className="text-[13px] font-semibold text-fig-900">What exactly changed</p>
            <dl className="mt-[10px] space-y-[8px]">
              {differences.map((difference) => (
                <div
                  key={difference.field}
                  className="flex items-baseline justify-between gap-[12px] text-[13px]"
                >
                  <dt className="text-fig-600">{difference.label}</dt>
                  <dd className="tabular text-fig-900">
                    <span className="text-fig-400 line-through">{difference.from}</span> →{" "}
                    <span className="fig-w-medium">{difference.to}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </FigCard>
        ) : null}
      </div>
    </FigSheet>
  );
}
