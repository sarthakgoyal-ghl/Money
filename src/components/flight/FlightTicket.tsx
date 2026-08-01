import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Armchair, Luggage } from "lucide-react";
import type { Flight } from "../../data/scenario";
import { formatINR } from "../../data/scenario";
import { RouteGlyph } from "./RouteGlyph";

export type TicketEmphasis =
  /** The flight under consideration — dominant. */
  | "primary"
  /** The existing booking in a comparison — quieter and compressed. */
  | "muted"
  /** Same weight as primary, but on the dark canvas. */
  | "onDark";

interface FlightTicketProps {
  flight: Flight;
  emphasis?: TicketEmphasis;
  /** Corner label, e.g. "Extra". */
  priceLabel?: string;
  priceAmount?: number;
  /** Shown at the top-left instead of the airline name. */
  statusLabel?: string;
  /** Shared-element id so the card can morph between screens. */
  layoutId?: string;
  footer?: ReactNode;
  /** Hides seat/baggage/fare metadata for the tightest comparison rows. */
  compact?: boolean;
}

/**
 * The flight as a travel object rather than a row of fields.
 *
 * Hierarchy is fixed: route and times first, price second, then seat and
 * baggage, then fare class. Anything that is not one of those is a footer.
 */
export function FlightTicket({
  flight,
  emphasis = "primary",
  priceLabel,
  priceAmount,
  statusLabel,
  layoutId,
  footer,
  compact = false,
}: FlightTicketProps) {
  const dark = emphasis === "onDark";
  const muted = emphasis === "muted";

  const container = dark
    ? "border-white/14 bg-white/[0.07] backdrop-blur"
    : muted
      ? "border-ink-100 bg-canvas-well"
      : "border-ink-100 bg-white shadow-card";

  const timeSize = muted || compact ? "text-[24px]" : "text-[32px]";
  const timeColour = dark
    ? "text-white"
    : muted
      ? "text-ink-500"
      : "text-ink-900";
  const metaColour = dark ? "text-white/62" : muted ? "text-ink-500" : "text-ink-500";
  const glyphTone = dark ? "dark" : muted ? "muted" : "light";

  return (
    <motion.article
      layoutId={layoutId}
      className={["rounded-2xl border p-4", container].join(" ")}
    >
      <header className="flex items-start justify-between gap-3">
        <div className={["flex flex-wrap items-baseline gap-x-2 text-[12.5px]", metaColour].join(" ")}>
          <span
            className={[
              "font-semibold",
              dark ? "text-white/88" : muted ? "text-ink-500" : "text-ink-800",
            ].join(" ")}
          >
            {statusLabel ?? flight.airline}
          </span>
          <span aria-hidden="true">·</span>
          <span className="tabular">{flight.flightNo}</span>
          <span aria-hidden="true">·</span>
          <span className="tabular">{flight.dateShort}</span>
        </div>

        {priceLabel && typeof priceAmount === "number" ? (
          <div className="shrink-0 text-right">
            <div
              className={[
                "text-[10.5px] font-semibold uppercase tracking-[0.06em]",
                dark ? "text-white/55" : "text-ink-500",
              ].join(" ")}
            >
              {priceLabel}
            </div>
            <div
              className={[
                "text-[17px] font-semibold tabular leading-tight",
                dark ? "text-white" : "text-ink-900",
              ].join(" ")}
            >
              {formatINR(priceAmount)}
            </div>
          </div>
        ) : null}
      </header>

      <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
        <div className="min-w-0">
          <div
            className={[
              "font-semibold tabular leading-none tracking-[-0.02em] whitespace-nowrap",
              timeSize,
              timeColour,
            ].join(" ")}
          >
            {flight.departLabel}
          </div>
          <div className={["mt-1.5 truncate text-[12px] tabular", metaColour].join(" ")}>
            {flight.origin.code} · {flight.origin.city}
          </div>
        </div>

        <RouteGlyph
          durationLabel={flight.durationLabel}
          stops={flight.stops}
          tone={glyphTone}
          className="w-[74px]"
        />

        <div className="min-w-0 text-right">
          <div
            className={[
              "font-semibold tabular leading-none tracking-[-0.02em] whitespace-nowrap",
              timeSize,
              timeColour,
            ].join(" ")}
          >
            {flight.arriveLabel}
          </div>
          <div className={["mt-1.5 truncate text-[12px] tabular", metaColour].join(" ")}>
            {flight.destination.code} · {flight.destination.city}
          </div>
        </div>
      </div>

      {compact ? null : (
        <div
          className={[
            "mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12.5px]",
            dark ? "text-white/72" : muted ? "text-ink-500" : "text-ink-600",
          ].join(" ")}
        >
          <span className="inline-flex items-center gap-1.5">
            <Armchair size={13} strokeWidth={2} aria-hidden="true" />
            <span className="tabular">{flight.seat.label}</span>
            <span className="capitalize">· {flight.seat.kind}</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Luggage size={13} strokeWidth={2} aria-hidden="true" />
            <span className="tabular">{flight.bagKg} kg</span> checked
          </span>
          <span>{flight.fare}</span>
        </div>
      )}

      {footer ? <div className="mt-3.5">{footer}</div> : null}
    </motion.article>
  );
}
