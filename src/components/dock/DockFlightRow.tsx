import type { ReactNode } from "react";
import { Check, Minus } from "lucide-react";
import type { Flight, OptionFit } from "../../data/scenario";
import { formatINR } from "../../data/scenario";

interface DockFlightRowProps {
  flight: Flight;
  /** Extra cost of taking this flight. Omit for the existing booking. */
  price?: number;
  /** Small label above the flight number: "Recommended", "Current", "New". */
  statusLabel?: string;
  fit?: OptionFit;
  selected?: boolean;
  onSelect?: () => void;
  /** e.g. "Save ₹950". */
  note?: string;
  footer?: ReactNode;
}

/**
 * A flight as an object, on night.
 *
 * Codes and times are the typography here: they are what the user actually
 * reads, so they carry the weight, and airline, fare class and baggage sit
 * beneath as metadata. When `onSelect` is supplied the whole object is one
 * radio target rather than a card with a button inside it.
 */
export function DockFlightRow({
  flight,
  price,
  statusLabel,
  fit,
  selected = false,
  onSelect,
  note,
  footer,
}: DockFlightRowProps) {
  const interactive = typeof onSelect === "function";

  const body = (
    <>
      <div className="flex items-baseline justify-between gap-3">
        <div className="min-w-0">
          {statusLabel ? (
            <span className="block text-[10.5px] font-semibold uppercase tracking-[0.09em] text-route-cyan">
              {statusLabel}
            </span>
          ) : null}
          <span className="mt-0.5 block text-[13px] font-medium tabular text-white/82">
            {flight.airline} {flight.flightNo}
          </span>
        </div>
        {price !== undefined ? (
          <div className="shrink-0 text-right">
            <span className="block text-[10.5px] font-semibold uppercase tracking-[0.06em] text-white/58">
              Extra
            </span>
            <span className="block text-[17px] font-semibold tabular text-white">
              {formatINR(price)}
            </span>
          </div>
        ) : null}
      </div>

      {/* Departure and arrival, at display size. */}
      <div className="mt-3 grid grid-cols-[auto_1fr_auto] items-center gap-3">
        <Endpoint code={flight.origin.code} time={flight.departLabel} align="left" />
        <span
          aria-hidden="true"
          className="flex flex-col items-center gap-1 text-white/48"
        >
          <span className="text-[10.5px] tabular">{flight.durationLabel}</span>
          <span className="relative block h-[1px] w-full min-w-[36px] bg-white/22">
            <span className="absolute -top-[2px] left-0 h-[5px] w-[5px] rounded-full bg-white/45" />
            <span className="absolute -top-[2px] right-0 h-[5px] w-[5px] rounded-full bg-route-cyan" />
          </span>
          <span className="text-[10.5px]">
            {flight.stops === 0 ? "Nonstop" : `${flight.stops} stop`}
          </span>
        </span>
        <Endpoint
          code={flight.destination.code}
          time={flight.arriveLabel}
          align="right"
        />
      </div>

      <p className="mt-3 text-[12px] tabular text-white/62">
        {flight.dateShort} · Seat {flight.seat.label} ({flight.seat.kind}) ·{" "}
        {flight.bagKg} kg
      </p>

      {note ? (
        <p className="mt-1.5 text-[12px] font-medium text-signal-ok">{note}</p>
      ) : null}

      {fit ? (
        <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5">
          <FitChip ok={fit.meetsDeadline} label="Deadline" />
          <FitChip ok={fit.withinBudget} label="Budget" />
          <FitChip ok={fit.seatMatches} label="Seat" />
          <FitChip ok={fit.nonstopMatches} label="Nonstop" />
        </ul>
      ) : null}

      {footer ? <div className="mt-3 border-t border-white/10 pt-3">{footer}</div> : null}
    </>
  );

  if (!interactive) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4">
        {body}
      </div>
    );
  }

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={[
        "block w-full rounded-2xl border p-4 text-left focus-ring-dark",
        selected
          ? "border-route-cyan/55 bg-route-cyan/[0.10]"
          : "border-white/10 bg-white/[0.045] hover:bg-white/[0.075]",
      ].join(" ")}
    >
      {body}
    </button>
  );
}

function Endpoint({
  code,
  time,
  align,
}: {
  code: string;
  time: string;
  align: "left" | "right";
}) {
  return (
    <div className={align === "right" ? "text-right" : "text-left"}>
      <div className="text-[20px] font-semibold leading-none tabular tracking-[-0.01em] text-white">
        {time}
      </div>
      <div className="mt-1 text-[12px] font-medium tabular tracking-[0.06em] text-white/62">
        {code}
      </div>
    </div>
  );
}

function FitChip({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li
      className={[
        "inline-flex items-center gap-1.5 text-[12px]",
        ok ? "text-white/72" : "text-signal-warn",
      ].join(" ")}
    >
      <span
        aria-hidden="true"
        className={[
          "flex h-3.5 w-3.5 items-center justify-center rounded-full",
          ok ? "bg-signal-ok/24 text-signal-ok" : "bg-signal-warn/24 text-signal-warn",
        ].join(" ")}
      >
        {ok ? <Check size={9} strokeWidth={3} /> : <Minus size={9} strokeWidth={3} />}
      </span>
      {label}
      <span className="sr-only">{ok ? " matches your brief" : " is outside your brief"}</span>
    </li>
  );
}
