import { motion, useReducedMotion } from "framer-motion";
import { ArrowDown, Check, Luggage, ShieldCheck } from "lucide-react";
import type {
  PaymentMethod,
  PriceBreakdown,
  TripConstraints,
} from "../../data/scenario";
import {
  currentBooking,
  fitOption,
  formatDuration,
  formatINR,
  toMinutes,
} from "../../data/scenario";
import type { FlightOption } from "../../data/scenario";
import { ease } from "../../motion/tokens";
import { FlightTicket } from "../flight/FlightTicket";
import { BottomSheet } from "../shared/BottomSheet";
import { Disclosure } from "../shared/Disclosure";
import { ApprovalSummary } from "../transaction/ApprovalSummary";
import { PriceBreakdownCard } from "../transaction/PriceBreakdown";
import { Button } from "../ui/Button";

interface ConfirmationSheetProps {
  open: boolean;
  onClose: () => void;
  option: FlightOption;
  price: PriceBreakdown;
  payment: PaymentMethod;
  constraints: TripConstraints;
  onEditPayment: () => void;
  onApprove: () => void;
}

/**
 * Review before rebooking — the trust moment.
 *
 * Fast, calm, and exact: the itinerary comparison first, then the money, then
 * the promise, then one action carrying the precise amount. No checkbox, no
 * typed phrase, no countdown, and no "Confirm".
 */
export function ConfirmationSheet({
  open,
  onClose,
  option,
  price,
  payment,
  constraints,
  onEditPayment,
  onApprove,
}: ConfirmationSheetProps) {
  const reduced = useReducedMotion();
  const { flight } = option;
  const fit = fitOption(option, constraints, price);
  const overLimitBy = fit.withinBudget ? 0 : -fit.budgetHeadroom;

  const earlierBy = formatDuration(
    toMinutes(currentBooking.arriveLabel) - toMinutes(flight.arriveLabel),
  );

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Review flight change"
      subtitle="I'll only make the exact change shown below."
      size="full"
      footer={
        <div className="flex flex-col gap-2">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={onApprove}
          >
            Pay {formatINR(price.total)} &amp; rebook
          </Button>
          <Button variant="secondary" size="lg" fullWidth onClick={onClose}>
            Keep {currentBooking.flightNo}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Old → new as two ticket states, connected by direction of travel.
            No strikethrough table: the change is the movement between them. */}
        <section aria-labelledby="change-heading">
          <h3 id="change-heading" className="sr-only">
            Your current flight and the replacement
          </h3>

          <FlightTicket
            flight={currentBooking}
            emphasis="muted"
            statusLabel="Current"
            compact
          />

          <div className="relative flex justify-center py-1">
            <motion.span
              aria-hidden="true"
              initial={reduced ? false : { opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduced ? 0.001 : 0.28, ease: [...ease] }}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-accent/30 bg-accent-50 text-accent-700"
            >
              <ArrowDown size={14} strokeWidth={2.5} />
            </motion.span>
          </div>

          {/* Shared element: this is the same card the user tapped on the
              proposal, expanded in place. */}
          <FlightTicket
            flight={flight}
            layoutId="selected-flight"
            statusLabel="New"
            priceLabel="Extra"
            priceAmount={price.total}
          />
        </section>

        <ul className="space-y-2">
          <ChangeRow
            icon={<Check size={12} strokeWidth={3} />}
            tone="ok"
            text={
              <>
                Arrive{" "}
                <span className="font-semibold tabular">{earlierBy} earlier</span>
              </>
            }
          />
          <ChangeRow
            icon={<Check size={12} strokeWidth={3} />}
            tone="neutral"
            text={
              <>
                <span className="capitalize">{flight.seat.kind}</span> seat
                retained ·{" "}
                <span className="tabular">{flight.seat.label}</span>
              </>
            }
          />
          <ChangeRow
            icon={<Luggage size={12} strokeWidth={2.5} />}
            tone="neutral"
            text={
              <>
                Baggage remains{" "}
                <span className="tabular">{flight.bagKg} kg</span>
              </>
            }
          />
        </ul>

        <PriceBreakdownCard
          price={price}
          payment={payment}
          onEditPayment={onEditPayment}
          overLimitBy={overLimitBy}
          limit={constraints.maxExtraCost}
        />

        {/* What happens next — a sequence, not a numbered legal notice. */}
        <section aria-labelledby="next-heading">
          <h3
            id="next-heading"
            className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-500"
          >
            What happens next
          </h3>
          <ol className="mt-2 flex items-stretch gap-1.5">
            {[
              "Recheck fare and seat",
              `Issue ${flight.flightNo}`,
              `Release ${currentBooking.flightNo}`,
            ].map((step, index) => (
              <li
                key={step}
                className="flex flex-1 flex-col gap-1.5 rounded-xl border border-ink-100 bg-white px-2.5 py-2.5"
              >
                <span
                  aria-hidden="true"
                  className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-canvas-well text-[10.5px] font-semibold tabular text-ink-500"
                >
                  {index + 1}
                </span>
                <span className="text-[12px] leading-snug text-ink-700">
                  {step}
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-2 flex items-start gap-2 text-[12.5px] leading-snug text-ink-600">
            <ShieldCheck
              size={14}
              strokeWidth={2}
              aria-hidden="true"
              className="mt-[1px] shrink-0 text-ok"
            />
            Your current ticket stays active until the replacement is issued.
          </p>
        </section>

        <ApprovalSummary flight={flight} price={price} />

        <div className="border-t border-ink-100 pt-1">
          <Disclosure label="View fare conditions">
            <div className="space-y-2 text-[13px] leading-snug text-ink-600">
              <p>
                {flight.fare} on {flight.airline} permits a date change for a
                per-passenger fee plus any fare difference. Seats{" "}
                <span className="tabular">{flight.seat.label}</span> and{" "}
                <span className="tabular">{currentBooking.seat.label}</span> are
                standard, with no extra legroom charge.
              </p>
              <p>
                Any further change after this one may carry a new fee and fare
                difference.
              </p>
              <p>
                If ticketing does not complete after payment is authorised, the
                authorisation is released and a specialist reconciles the booking.
                Nothing is retried automatically.
              </p>
              <p className="text-ink-500">
                Simulated fare rules for this prototype. No real airline or
                payment system is contacted.
              </p>
            </div>
          </Disclosure>
        </div>
      </div>
    </BottomSheet>
  );
}

interface ChangeRowProps {
  icon: React.ReactNode;
  tone: "ok" | "neutral";
  text: React.ReactNode;
}

function ChangeRow({ icon, tone, text }: ChangeRowProps) {
  return (
    <li className="flex items-start gap-2.5 text-[14px] leading-snug text-ink-800">
      <span
        aria-hidden="true"
        className={[
          "mt-[2px] flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full",
          tone === "ok" ? "bg-ok-50 text-ok" : "bg-canvas-well text-ink-500",
        ].join(" ")}
      >
        {icon}
      </span>
      <span>{text}</span>
    </li>
  );
}
