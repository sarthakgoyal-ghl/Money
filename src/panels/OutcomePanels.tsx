import { ShieldCheck } from "lucide-react";
import { DockFlightRow } from "../components/dock/DockFlightRow";
import { DockDisclosure, DockNote } from "../components/dock/DockPrimitives";
import { nightTitleLarge } from "../components/dock/night";
import { Button } from "../components/ui/Button";
import type { MaterialDifference } from "../state/approval";
import type { TripConstraints } from "../data/scenario";
import {
  currentBooking,
  formatINR,
  passenger,
  recommendedOption,
  repricedTotal,
} from "../data/scenario";

/* ------------------------------------------------------------------ *
 * Kept the current flight                                            *
 * ------------------------------------------------------------------ */

/**
 * Rejection as a first-class outcome.
 *
 * Calm and complete: what is still booked, stated plainly, with no guilt, no
 * pressure to reconsider, and no urgency. A product that only feels finished
 * when you say yes is a product that is pushing you.
 */
export function RejectedPanel() {
  return (
    <div className="space-y-4 pt-1">
      <header>
        <h1 className={nightTitleLarge}>No changes made</h1>
        <p className="mt-1.5 text-[14px] leading-snug text-white/72">
          <span className="font-medium tabular text-white">
            {currentBooking.flightNo}
          </span>{" "}
          at{" "}
          <span className="font-medium tabular text-white">
            {currentBooking.departLabel}
          </span>{" "}
          and seat{" "}
          <span className="font-medium tabular text-white">
            {currentBooking.seat.label}
          </span>{" "}
          are still booked.
        </p>
      </header>

      <DockFlightRow
        flight={currentBooking}
        statusLabel="Your flight"
        footer={
          <div className="flex flex-wrap items-center justify-between gap-2 text-[12.5px] text-white/62">
            <span>
              Passenger{" "}
              <span className="font-medium text-white/88">{passenger.fullName}</span>
            </span>
            {currentBooking.bookingRef ? (
              <span className="tabular">
                Booking{" "}
                <span className="font-medium text-white/88">
                  {currentBooking.bookingRef}
                </span>
              </span>
            ) : null}
          </div>
        }
      />

      <p className="flex items-start gap-2 rounded-2xl border border-signal-ok/30 bg-signal-ok/[0.10] px-3.5 py-3 text-[13px] leading-snug text-white/88">
        <ShieldCheck
          size={14}
          strokeWidth={2.25}
          aria-hidden="true"
          className="mt-[2px] shrink-0 text-signal-ok"
        />
        Nothing was charged and nothing was cancelled. Your trip is exactly as it
        was.
      </p>
    </div>
  );
}

interface RejectedActionsProps {
  onLookAgain: () => void;
  onBackToTrip: () => void;
}

export function RejectedActions({ onLookAgain, onBackToTrip }: RejectedActionsProps) {
  return (
    <div className="space-y-2">
      <Button variant="onDark" size="lg" fullWidth onClick={onLookAgain}>
        Look for another option
      </Button>
      <Button variant="ghostOnDark" fullWidth onClick={onBackToTrip}>
        Back to trip
      </Button>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * The airline repriced                                               *
 * ------------------------------------------------------------------ */

interface PriceChangedPanelProps {
  constraints: TripConstraints;
  differences: MaterialDifference[];
}

/**
 * The airline repriced, so the assistant stopped.
 *
 * The total is a material field, so the previous approval is void: the ₹4,790
 * approval cannot be reused for ₹6,240 by any path, including reopening this
 * screen from a URL. The safety anchor sits above the diagnosis, because "was I
 * charged?" is the question the user actually has.
 */
export function PriceChangedPanel({
  constraints,
  differences,
}: PriceChangedPanelProps) {
  const overLimitBy = repricedTotal - constraints.maxExtraCost;

  return (
    <div className="space-y-4 pt-1">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-signal-warn">
          Price changed
        </p>
        <h1 className={`mt-1.5 ${nightTitleLarge}`}>
          The price changed, so I stopped
        </h1>
        <p className="mt-2 text-[14px] leading-snug text-white/78">
          Air India repriced this option from{" "}
          <span className="font-medium tabular text-white">
            {formatINR(recommendedOption.price.total)}
          </span>{" "}
          to{" "}
          <span className="font-medium tabular text-white">
            {formatINR(repricedTotal)}
          </span>
          . That is{" "}
          <span className="font-medium tabular text-white">
            {formatINR(overLimitBy)}
          </span>{" "}
          above your {formatINR(constraints.maxExtraCost)} limit.
        </p>
      </header>

      <div className="rounded-2xl border border-signal-warn/30 bg-signal-warn/[0.10] px-4 py-3.5">
        <div className="flex items-baseline gap-2 text-[18px] font-semibold tabular">
          <span className="text-white/52 line-through">
            {formatINR(recommendedOption.price.total)}
          </span>
          <span aria-hidden="true" className="text-white/52">
            →
          </span>
          <span className="text-signal-warn">{formatINR(repricedTotal)}</span>
        </div>
        <p className="mt-2 text-[12.5px] leading-snug text-white/72">
          Your approval covered the exact earlier amount, so it no longer
          applies.
        </p>
      </div>

      <p className="flex items-start gap-2 rounded-2xl border border-signal-ok/30 bg-signal-ok/[0.10] px-3.5 py-3 text-[13px] leading-snug text-white/88">
        <ShieldCheck
          size={14}
          strokeWidth={2.25}
          aria-hidden="true"
          className="mt-[2px] shrink-0 text-signal-ok"
        />
        Nothing was charged. {currentBooking.flightNo} at{" "}
        <span className="tabular">{currentBooking.departLabel}</span> is still
        yours.
      </p>

      {differences.length > 0 ? (
        <div className="border-t border-white/10 pt-1">
          <DockDisclosure label="What exactly changed">
            <dl className="space-y-2 pt-1">
              {differences.map((difference) => (
                <div
                  key={difference.field}
                  className="flex items-baseline justify-between gap-3 text-[13px]"
                >
                  <dt className="text-white/58">{difference.label}</dt>
                  <dd className="tabular text-white/88">
                    <span className="text-white/52 line-through">
                      {difference.from}
                    </span>{" "}
                    → <span className="font-medium text-white">{difference.to}</span>
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-2.5 text-[12.5px] leading-snug text-white/62">
              Any change to the flight, seat, baggage, fare, payment method or
              total voids an approval. Reviewing the higher price starts a new
              approval. I won't reuse the old one.
            </p>
          </DockDisclosure>
        </div>
      ) : null}
    </div>
  );
}

interface PriceChangedActionsProps {
  constraints: TripConstraints;
  onFindAnother: () => void;
  onReviewRepriced: () => void;
  onKeepCurrent: () => void;
}

export function PriceChangedActions({
  constraints,
  onFindAnother,
  onReviewRepriced,
  onKeepCurrent,
}: PriceChangedActionsProps) {
  return (
    <div className="space-y-2">
      <Button variant="onDark" size="lg" fullWidth onClick={onFindAnother}>
        Find another under {formatINR(constraints.maxExtraCost)}
      </Button>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="ghostOnDark" onClick={onReviewRepriced}>
          Review {formatINR(repricedTotal)}
        </Button>
        <Button variant="ghostOnDark" onClick={onKeepCurrent}>
          Keep {currentBooking.flightNo}
        </Button>
      </div>
      <DockNote>
        Reviewing the higher price starts a new approval.
      </DockNote>
    </div>
  );
}
