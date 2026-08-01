import type { Flight, PriceBreakdown } from "../../data/scenario";
import { formatINR } from "../../data/scenario";
import { TripPulse } from "../ai/TripPulse";

interface ApprovalSummaryProps {
  flight: Flight;
  price: PriceBreakdown;
}

/**
 * Bounded Confirmation, in the agent's own words.
 *
 * The safety contract itself is unchanged — one flight, one seat, one total, and
 * a hard stop on any material change. What changed is the register: this is the
 * agent making a promise, not the system printing a policy label. The internal
 * name for the pattern lives in the README, not on the screen.
 */
export function ApprovalSummary({ flight, price }: ApprovalSummaryProps) {
  return (
    <section
      aria-label="What the assistant will and will not do"
      className="flex gap-3 rounded-2xl border border-accent/22 bg-accent-50/70 p-4"
    >
      <TripPulse state="idle" size={22} className="mt-0.5" />
      <p className="text-[14px] leading-snug text-ink-800">
        I&apos;ll only rebook{" "}
        <span className="font-semibold tabular text-ink-900">
          {flight.flightNo}
        </span>
        , seat{" "}
        <span className="font-semibold tabular text-ink-900">
          {flight.seat.label}
        </span>
        , for a total of{" "}
        <span className="font-semibold tabular text-ink-900">
          {formatINR(price.total)}
        </span>
        . If the flight, seat, or price changes, I&apos;ll stop and ask again.
      </p>
    </section>
  );
}
