import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { CalendarPlus, FileText, Headphones, Wallet } from "lucide-react";
import { BoardingPass } from "../flight/BoardingPass";
import { BottomSheet } from "../shared/BottomSheet";
import { Disclosure } from "../shared/Disclosure";
import { Button } from "../ui/Button";
import type { Flight, PaymentMethod } from "../../data/scenario";
import type { ActivityTrail } from "../../data/scenario";
import {
  currentBooking,
  formatClock24,
  formatINR,
  successBooking,
  synthesiseActivityTrail,
} from "../../data/scenario";
import { ease } from "../../motion/tokens";

interface SuccessSheetProps {
  open: boolean;
  onClose: () => void;
  flight: Flight;
  /** The amount actually approved and charged — never a live quote. */
  settledTotal: number;
  payment: PaymentMethod;
  activityTrail?: ActivityTrail | null;
  onAddToWallet: () => void;
  onViewReceipt: () => void;
  onAddToCalendar: () => void;
  onGetHelp: () => void;
}

/**
 * The outcome, as an object the user keeps.
 *
 * Kept to two-thirds of the screen so the completed route stays visible behind
 * it: the map finishing the journey is half of what "you're rebooked" means.
 * One restrained reveal — the pass rises and the booking reference settles — and
 * no confetti, because this is still a financial transaction.
 */
export function SuccessSheet({
  open,
  onClose,
  flight,
  settledTotal,
  payment,
  activityTrail = null,
  onAddToWallet,
  onViewReceipt,
  onAddToCalendar,
  onGetHelp,
}: SuccessSheetProps) {
  const reduced = useReducedMotion();
  const [refSettled, setRefSettled] = useState(reduced === true);
  const [fallbackTrail, setFallbackTrail] = useState<ActivityTrail | null>(
    null,
  );

  // The reference resolves from a loading state to the real value, once.
  useEffect(() => {
    if (!open) return;
    if (
      !activityTrail ||
      activityTrail.issuedAt == null ||
      activityTrail.releasedAt == null
    ) {
      setFallbackTrail(synthesiseActivityTrail());
    } else {
      setFallbackTrail(null);
    }
    if (reduced) {
      setRefSettled(true);
      return;
    }
    setRefSettled(false);
    const timer = window.setTimeout(() => setRefSettled(true), 620);
    return () => window.clearTimeout(timer);
  }, [open, reduced, activityTrail]);

  const stamps =
    activityTrail?.issuedAt != null && activityTrail.releasedAt != null
      ? activityTrail
      : (fallbackTrail ?? synthesiseActivityTrail());

  const trail = [
    {
      label: "Request received",
      time: formatClock24(stamps.requestedAt),
    },
    {
      label: "Change approved",
      time: formatClock24(stamps.approvedAt),
    },
    {
      label: `${flight.flightNo} ticket issued`,
      time: formatClock24(stamps.issuedAt ?? stamps.approvedAt),
    },
    {
      label: `${currentBooking.flightNo} booking released`,
      time: formatClock24(stamps.releasedAt ?? stamps.approvedAt),
    },
  ];

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="You're rebooked"
      subtitle={
        <>
          You&apos;ll arrive in {flight.destination.city} at{" "}
          <span className="font-medium tabular text-ink-700">
            {flight.arriveLabel}
          </span>
          .
        </>
      }
      size="outcome"
      footer={
        <div className="flex items-center gap-2">
          <Button
            variant="tertiary"
            size="sm"
            className="flex-1"
            onClick={onViewReceipt}
            leadingIcon={<FileText size={14} strokeWidth={2.25} />}
          >
            Receipt
          </Button>
          <Button
            variant="tertiary"
            size="sm"
            className="flex-1"
            onClick={onAddToCalendar}
            leadingIcon={<CalendarPlus size={14} strokeWidth={2.25} />}
          >
            Calendar
          </Button>
          <Button
            variant="tertiary"
            size="sm"
            className="flex-1"
            onClick={onGetHelp}
            leadingIcon={<Headphones size={14} strokeWidth={2.25} />}
          >
            Help
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* The hero object, with a single soft halo behind it. */}
        <div className="relative">
          <motion.span
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/3 -z-0 aspect-square w-[130%] -translate-x-1/2 -translate-y-1/2"
            style={{
              background:
                "radial-gradient(circle, rgba(40,184,135,0.28) 0%, rgba(40,184,135,0) 66%)",
            }}
            initial={reduced ? { opacity: 0 } : { opacity: 0.9, scale: 0.8 }}
            animate={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: reduced ? 0.001 : 1.5, ease: [...ease] }}
          />
          <div className="relative">
            <BoardingPass
              flight={flight}
              bookingRef={refSettled ? successBooking.newBookingRef : "······"}
              status="issued"
              reveal
            />
          </div>
        </div>

        <Button
          variant="secondary"
          size="lg"
          fullWidth
          onClick={onAddToWallet}
          leadingIcon={<Wallet size={16} strokeWidth={2.25} />}
        >
          Add to Wallet
        </Button>

        {/* One concise transaction summary, not four cards. */}
        <section
          aria-labelledby="charge-heading"
          className="rounded-2xl border border-ink-100 bg-white px-4 py-3.5"
        >
          <h3 id="charge-heading" className="sr-only">
            Transaction summary
          </h3>
          <ul className="space-y-2 text-[13.5px] text-ink-700">
            <li className="flex items-start justify-between gap-3">
              <span>Charged to {payment.label}</span>
              <span className="shrink-0 font-semibold tabular text-ink-900">
                {formatINR(settledTotal)}
              </span>
            </li>
            <li className="flex items-start justify-between gap-3 border-t border-ink-100 pt-2">
              <span className="tabular">{currentBooking.flightNo} released</span>
              <span className="shrink-0 text-ink-500">Seat freed</span>
            </li>
            <li className="flex items-start justify-between gap-3 border-t border-ink-100 pt-2">
              <span>Receipt sent by email</span>
              <span className="shrink-0 text-ink-500">Just now</span>
            </li>
          </ul>
        </section>

        <div className="border-t border-ink-100 pt-1">
          <Disclosure label="View activity">
            <ol className="relative space-y-3 pl-5 pt-1">
              <span
                aria-hidden="true"
                className="absolute bottom-2 left-[5px] top-2 w-[2px] rounded bg-ink-100"
              />
              {trail.map((row) => (
                <li key={row.label} className="relative">
                  <span
                    aria-hidden="true"
                    className="absolute -left-5 top-[5px] h-3 w-3 rounded-full border-2 border-white bg-ok"
                  />
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-[13.5px] tabular text-ink-800">
                      {row.label}
                    </span>
                    <span className="shrink-0 text-[12px] tabular text-ink-500">
                      {row.time}
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          </Disclosure>
        </div>

        <p className="text-[12px] text-ink-500">
          Simulated booking and boarding pass. The barcode is decorative and not
          scannable.
        </p>
      </div>
    </BottomSheet>
  );
}
