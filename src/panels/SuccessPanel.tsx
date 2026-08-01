import { Headphones, Ticket } from "lucide-react";
import { DockNote } from "../components/dock/DockPrimitives";
import { nightEyebrow, nightTitleLarge } from "../components/dock/night";
import { Button } from "../components/ui/Button";
import type { Flight, PaymentMethod } from "../data/scenario";
import { currentBooking, formatINR, successBooking } from "../data/scenario";

interface SuccessPanelProps {
  flight: Flight;
  settledTotal: number;
  payment: PaymentMethod;
}

/**
 * What remains after the boarding pass is dismissed.
 *
 * Closing the pass must not leave the user on an empty map wondering whether
 * anything happened, so the dock keeps the outcome: the new flight, the exact
 * amount charged, and a way back to the pass.
 */
export function SuccessPanel({ flight, settledTotal, payment }: SuccessPanelProps) {
  return (
    <div className="space-y-4 pt-1">
      <header>
        <h1 className={nightTitleLarge}>You&apos;re rebooked</h1>
        <p className="mt-1.5 text-[14px] leading-snug text-white/78">
          <span className="font-medium tabular text-white">{flight.flightNo}</span>{" "}
          arrives in {flight.destination.city} at{" "}
          <span className="font-medium tabular text-white">
            {flight.arriveLabel}
          </span>
          .
        </p>
      </header>

      <dl className="grid grid-cols-2 gap-2">
        <Fact label="Booking" value={successBooking.newBookingRef} />
        <Fact label="Seat" value={flight.seat.label} />
        <Fact label="Charged" value={formatINR(settledTotal)} />
        <Fact label="Released" value={currentBooking.flightNo} />
      </dl>

      <p className="text-[13px] leading-snug text-white/72">
        Charged to {payment.label}. A receipt is on its way by email.
      </p>

      <DockNote>
        Simulated booking. No airline or payment system was contacted.
      </DockNote>
    </div>
  );
}

interface SuccessActionsProps {
  onViewBoardingPass: () => void;
  onGetHelp: () => void;
}

export function SuccessActions({
  onViewBoardingPass,
  onGetHelp,
}: SuccessActionsProps) {
  return (
    <div className="space-y-2">
      <Button
        variant="onDark"
        size="lg"
        fullWidth
        onClick={onViewBoardingPass}
        leadingIcon={<Ticket size={16} strokeWidth={2.25} />}
      >
        View boarding pass
      </Button>
      <Button
        variant="ghostOnDark"
        fullWidth
        onClick={onGetHelp}
        leadingIcon={<Headphones size={15} strokeWidth={2.25} />}
      >
        Get help with this trip
      </Button>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2.5">
      <dt className={nightEyebrow}>{label}</dt>
      <dd className="mt-0.5 text-[15px] font-semibold tabular text-white">
        {value}
      </dd>
    </div>
  );
}
