import { motion, useReducedMotion } from "framer-motion";
import { Clock3, FileText, Headset, MessageSquare, PauseCircle, Phone } from "lucide-react";
import { TripPulse } from "../components/ai/TripPulse";
import { DockStatusList } from "../components/dock/DockStatusList";
import type { DockStatusRow } from "../components/dock/DockStatusList";
import { nightEyebrow, nightTitle } from "../components/dock/night";
import { Button } from "../components/ui/Button";
import type { PaymentMethod, PriceBreakdown } from "../data/scenario";
import { currentBooking, formatINR, specialist, supportCase } from "../data/scenario";
import { ease } from "../motion/tokens";

interface HandoffPanelProps {
  price: PriceBreakdown;
  payment: PaymentMethod;
}

/**
 * Payment authorised, ticket not issued — the escalation boundary.
 *
 * Deliberately calm rather than alarming: the situation is recoverable, the
 * current ticket is intact, and stopping is the correct behaviour. The three
 * certainty levels are kept visibly distinct, because collapsing "paid",
 * "ticketed" and "still yours" into one status would be the actual failure.
 */
export function HandoffPanel({ price, payment }: HandoffPanelProps) {
  const rows: DockStatusRow[] = [
    {
      label: "Payment",
      value: `${formatINR(price.total)} pending`,
      certainty: "pending",
      note: `Authorised on ${payment.label}, not captured`,
    },
    { label: "New ticket", value: "Not issued", certainty: "pending" },
    {
      label: "Current ticket",
      value: `${currentBooking.flightNo} still active`,
      certainty: "confirmed",
      note: `Seat ${currentBooking.seat.label} confirmed`,
    },
    {
      label: "Automatic retries",
      value: "Paused",
      certainty: "stopped",
      note: "Retrying could create a duplicate charge",
    },
  ];

  return (
    <div className="space-y-4 pt-1">
      <header>
        <h1 className={nightTitle}>{specialist.name} is finishing this safely</h1>
        <p className="mt-1.5 text-[13.5px] leading-snug text-white/78">
          Your payment was authorised, but Air India did not issue the ticket.
          I&apos;ve paused automatic retries to avoid a duplicate charge.
        </p>
      </header>

      <DockStatusList
        title="Transaction status"
        rows={rows}
        footer={
          <p className="flex items-start gap-2 text-[12.5px] leading-snug text-white/68">
            <PauseCircle
              size={14}
              strokeWidth={2}
              aria-hidden="true"
              className="mt-[1px] shrink-0 text-white/52"
            />
            I stop automatically whenever payment status and ticket status
            disagree. Nothing further happens without a person.
          </p>
        }
      />

      <HandoffBridge />

      <section
        aria-labelledby="specialist-heading"
        className="rounded-2xl border border-white/10 bg-white/[0.055] p-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span
              aria-hidden="true"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ai-lavender/22 text-[15px] font-semibold text-ai-lavender"
            >
              {specialist.initials}
            </span>
            <div className="min-w-0">
              <h3
                id="specialist-heading"
                className="text-[16px] font-semibold text-white"
              >
                {specialist.name}
              </h3>
              <p className="text-[12.5px] text-white/68">{specialist.role}</p>
            </div>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/[0.08] px-2.5 py-1 text-[11.5px] text-white/72">
            <Clock3 size={11} strokeWidth={2.25} aria-hidden="true" />
            ~2 min
          </span>
        </div>

        <dl className="mt-3 flex items-baseline gap-2">
          <dt className={nightEyebrow}>Case</dt>
          <dd className="text-[13px] font-semibold tabular text-white">
            {supportCase.id}
          </dd>
        </dl>

        <p className="mt-2.5 text-[13.5px] leading-snug text-white/78">
          I shared your request, selected flight, approved amount, payment
          status, ticket status, and the airline&apos;s responses.{" "}
          {specialist.name} won&apos;t ask you to repeat them.
        </p>
      </section>
    </div>
  );
}

interface HandoffActionsProps {
  onChat: () => void;
  onCall: () => void;
  onCaseDetails: () => void;
}

export function HandoffActions({
  onChat,
  onCall,
  onCaseDetails,
}: HandoffActionsProps) {
  return (
    <div className="space-y-2">
      <Button
        variant="onDark"
        size="lg"
        fullWidth
        leadingIcon={<MessageSquare size={16} strokeWidth={2.25} />}
        onClick={onChat}
      >
        Chat with {specialist.name}
      </Button>
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="ghostOnDark"
          leadingIcon={<Phone size={15} strokeWidth={2.25} />}
          onClick={onCall}
        >
          Call support
        </Button>
        <Button
          variant="ghostOnDark"
          leadingIcon={<FileText size={15} strokeWidth={2.25} />}
          onClick={onCaseDetails}
        >
          Case details
        </Button>
      </div>
    </div>
  );
}

/**
 * The moment ownership moves from the assistant to a person.
 *
 * A single context packet travels from Trip Pulse to {specialist} and stops. It
 * runs once — this communicates a transfer, not activity, so looping it would
 * misrepresent what is happening.
 */
function HandoffBridge() {
  const reduced = useReducedMotion();

  return (
    <div
      role="img"
      aria-label={`The assistant has transferred this case to ${specialist.name}, a travel specialist`}
      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3.5"
    >
      <span className="flex flex-col items-center gap-1.5">
        <TripPulse state="handoff" size={30} />
        <span className="text-[10.5px] font-medium text-white/62">Assistant</span>
      </span>

      <span aria-hidden="true" className="relative mx-1 h-[2px] flex-1">
        <span className="absolute inset-0 rounded bg-white/12" />
        <motion.span
          className="absolute inset-y-0 left-0 rounded bg-gradient-to-r from-ai-lavender to-route-cyan"
          initial={reduced ? { width: "100%" } : { width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: reduced ? 0.001 : 0.7, ease: [...ease] }}
        />
        <motion.span
          className="absolute top-1/2 h-[9px] w-[9px] -translate-y-1/2 rounded-full bg-white shadow-[0_0_0_2px_rgba(156,140,255,0.65)]"
          initial={reduced ? { left: "100%", opacity: 0 } : { left: "0%", opacity: 1 }}
          animate={{ left: "100%", opacity: reduced ? 0 : [1, 1, 0] }}
          transition={{ duration: reduced ? 0.001 : 0.8, ease: [...ease] }}
        />
      </span>

      <span className="flex flex-col items-center gap-1.5">
        <motion.span
          initial={reduced ? { opacity: 1 } : { opacity: 0.35, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: reduced ? 0.001 : 0.36,
            delay: reduced ? 0 : 0.62,
            ease: [...ease],
          }}
          className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-white text-night"
        >
          <Headset size={15} strokeWidth={2.25} aria-hidden="true" />
        </motion.span>
        <span className="text-[10.5px] font-medium text-white/78">
          {specialist.name}
        </span>
      </span>
    </div>
  );
}
