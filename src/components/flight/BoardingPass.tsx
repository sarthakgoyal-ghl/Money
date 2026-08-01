import { motion, useReducedMotion } from "framer-motion";
import { Plane } from "lucide-react";
import type { Flight } from "../../data/scenario";
import { passenger } from "../../data/scenario";
import { duration, spring } from "../../motion/tokens";
import { TicketPerforation } from "./TicketPerforation";

interface BoardingPassProps {
  flight: Flight;
  bookingRef: string;
  /** "Issued" for a live pass, "Released" for the surrendered original. */
  status?: "issued" | "released";
  /** Plays the rise-into-place reveal. */
  reveal?: boolean;
  layoutId?: string;
}

/**
 * The boarding pass — the useful object the journey produces.
 *
 * This is a simulated pass: the barcode band is a decorative pattern, not a
 * scannable code, and the pass is labelled as such. Nothing here can be
 * presented as a genuine travel document.
 */
export function BoardingPass({
  flight,
  bookingRef,
  status = "issued",
  reveal = false,
  layoutId,
}: BoardingPassProps) {
  const reduced = useReducedMotion();
  const released = status === "released";

  return (
    <motion.article
      layoutId={layoutId}
      initial={
        reveal
          ? reduced
            ? { opacity: 0 }
            : { opacity: 0, y: 28, scale: 0.97 }
          : false
      }
      animate={{ opacity: released ? 0.62 : 1, y: 0, scale: 1 }}
      transition={
        reduced
          ? { duration: 0.001 }
          : { ...spring, duration: duration.successReveal }
      }
      className={[
        "relative overflow-hidden rounded-xl3 bg-white",
        released ? "shadow-card" : "shadow-ticket",
      ].join(" ")}
      aria-label={`Simulated boarding pass, ${flight.airline} ${flight.flightNo}`}
    >
      {/* Top band — airline and status. */}
      <div
        className={[
          "flex items-center justify-between px-5 pb-3 pt-4",
          released ? "bg-ink-50" : "bg-ink-900",
        ].join(" ")}
      >
        <span
          className={[
            "inline-flex items-center gap-2 text-[13px] font-semibold",
            released ? "text-ink-500" : "text-white",
          ].join(" ")}
        >
          <Plane size={14} strokeWidth={2.25} aria-hidden="true" />
          {flight.airline}
          <span className="tabular font-normal opacity-70">
            {flight.flightNo}
          </span>
        </span>
        <span
          className={[
            "rounded-full px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.08em]",
            released
              ? "bg-ink-200/70 text-ink-600"
              : "bg-[#5BE0B0]/22 text-[#8FF3CE]",
          ].join(" ")}
        >
          {released ? "Released" : "Issued"}
        </span>
      </div>

      {/* Route — the largest type on the pass. */}
      <div className="px-5 pt-4">
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
          <div className="min-w-0">
            <div className="text-[34px] font-semibold leading-none tracking-[-0.03em] tabular text-ink-900">
              {flight.origin.code}
            </div>
            <div className="mt-1 truncate text-[12px] text-ink-500">
              {flight.origin.city}
            </div>
          </div>

          <div className="flex flex-col items-center px-1">
            <span className="text-[10.5px] tabular text-ink-500">
              {flight.durationLabel}
            </span>
            <span
              aria-hidden="true"
              className="mt-1 flex w-[62px] items-center gap-1"
            >
              <span className="h-[1px] flex-1 bg-ink-200" />
              <Plane
                size={11}
                strokeWidth={2.25}
                className="rotate-90 text-ink-500"
              />
              <span className="h-[1px] flex-1 bg-ink-200" />
            </span>
            <span className="mt-1 text-[10.5px] text-ink-500">
              {flight.stops === 0 ? "Nonstop" : `${flight.stops} stop`}
            </span>
          </div>

          <div className="min-w-0 text-right">
            <div className="text-[34px] font-semibold leading-none tracking-[-0.03em] tabular text-ink-900">
              {flight.destination.code}
            </div>
            <div className="mt-1 truncate text-[12px] text-ink-500">
              {flight.destination.city}
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-baseline justify-between gap-3 border-t border-dashed border-ink-100 pt-3.5">
          <PassField label="Departs" value={flight.departLabel} emphasis />
          <PassField label="Arrives" value={flight.arriveLabel} emphasis align="right" />
        </div>

        <dl className="mt-3.5 grid grid-cols-3 gap-3">
          <PassField label="Date" value={flight.dateShort} />
          <PassField label="Seat" value={flight.seat.label} />
          <PassField label="Class" value={flight.fare.replace("Economy ", "Eco ")} />
        </dl>

        <dl className="mt-3.5 grid grid-cols-2 gap-3">
          <PassField label="Passenger" value={passenger.fullName} />
          <PassField label="Booking" value={bookingRef} align="right" />
        </dl>
      </div>

      <TicketPerforation />

      {/* Decorative barcode band — a pattern, not an encodable symbol. */}
      <div className="px-5 pb-4 pt-3.5">
        <BarcodeTexture muted={released} />
        <p className="mt-2 text-center text-[10.5px] text-ink-500">
          Simulated booking · this pattern is decorative and not scannable
        </p>
      </div>
    </motion.article>
  );
}

interface PassFieldProps {
  label: string;
  value: string;
  emphasis?: boolean;
  align?: "left" | "right";
}

function PassField({
  label,
  value,
  emphasis = false,
  align = "left",
}: PassFieldProps) {
  return (
    <div className={align === "right" ? "text-right" : ""}>
      <dt className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-ink-500">
        {label}
      </dt>
      <dd
        className={[
          "mt-0.5 font-semibold tabular text-ink-900",
          emphasis ? "text-[20px] leading-tight" : "text-[14px]",
        ].join(" ")}
      >
        {value}
      </dd>
    </div>
  );
}

/** 44 deterministic bars — no randomness, so the pass renders identically. */
function BarcodeTexture({ muted }: { muted: boolean }) {
  const bars = Array.from({ length: 44 }, (_, index) => {
    const pattern = [1, 3, 1, 2, 4, 1, 2, 1, 3, 2, 1, 4][index % 12];
    return pattern;
  });

  return (
    <div
      aria-hidden="true"
      className="flex h-11 items-stretch justify-between gap-[2px]"
    >
      {bars.map((weight, index) => (
        <span
          key={index}
          className={muted ? "bg-ink-300" : "bg-ink-900"}
          style={{ width: `${weight}px`, opacity: muted ? 0.4 : 0.86 }}
        />
      ))}
    </div>
  );
}
