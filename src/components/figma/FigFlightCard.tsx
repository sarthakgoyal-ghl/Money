import type { ReactNode } from "react";
import type { Flight } from "../../data/scenario";
import { formatINR } from "../../data/scenario";

/**
 * The flight object, as designed in the Figma file.
 *
 * Departure and arrival times are the typography — 24 px semibold with the
 * airport code and city beneath — separated by the duration/stops stack. The
 * metadata row underneath carries seat, baggage and fare class as 13 px rows with
 * 10 px icons.
 *
 * One component serves the assistant recommendation, the floating proposal card,
 * the Review sheet's current/new pair and the Other-options results, because the
 * design uses the same object in all four places.
 */

export type FlightCardKind =
  /** Blue "Recommended" eyebrow. */
  | "recommended"
  /** Amber "Current" eyebrow, muted values — the booking being replaced. */
  | "current"
  /** Blue "New" eyebrow. */
  | "new"
  /** Green "Save ₹950" eyebrow. */
  | "saving"
  /** No eyebrow. */
  | "plain";

interface FigFlightCardProps {
  flight: Flight;
  kind?: FlightCardKind;
  /** Extra cost. Omit entirely for the current booking — it has no extra. */
  extra?: number;
  /** Overrides the eyebrow text, e.g. "Save ₹950". */
  eyebrow?: string;
  /** Appends "· Fri, 14 Aug" to the flight line, as the Review cards do. */
  showDateInline?: boolean;
  /** Hides the seat/baggage/class row, as the Review "Current" card does. */
  hideMeta?: boolean;
  /** `wrap` keeps the three meta rows readable inside narrow cards. */
  metaLayout?: "row" | "wrap";
  selected?: boolean;
  onSelect?: () => void;
  footer?: ReactNode;
  className?: string;
}

const EYEBROW: Record<FlightCardKind, { text: string; className: string } | null> = {
  recommended: { text: "Recommended", className: "text-fig-blue" },
  current: { text: "Current", className: "text-[#DC6803]" },
  new: { text: "New", className: "text-fig-blue" },
  saving: { text: "", className: "text-[#039855]" },
  plain: null,
};

export function FigFlightCard({
  flight,
  kind = "plain",
  extra,
  eyebrow,
  showDateInline = false,
  hideMeta = false,
  metaLayout = "row",
  selected = false,
  onSelect,
  footer,
  className = "",
}: FigFlightCardProps) {
  const label = EYEBROW[kind];
  const eyebrowText = eyebrow ?? label?.text ?? "";
  const muted = kind === "current";

  const body = (
    <>
      {/* Figma `81021` — header + schedule + meta at gap 8. */}
      <div className="flex w-full flex-col gap-[8px]">
        <div className="flex items-center justify-between tracking-[-0.15px]">
          <div className="flex min-w-0 flex-col gap-[2px]">
            {eyebrowText ? (
              <span
                className={`text-[13px] leading-normal ${label?.className ?? "text-[#0078ff]"}`}
              >
                {eyebrowText}
              </span>
            ) : null}
            <span
              className={[
                "fig-w-semibold text-[15px] leading-normal",
                muted ? "text-fig-600" : "text-[#666]",
              ].join(" ")}
            >
              {flight.airline} {flight.flightNo}
              {showDateInline ? ` · ${flight.dateShort}` : ""}
            </span>
          </div>

          {extra !== undefined ? (
            <div className="flex shrink-0 flex-col items-end gap-[2px] text-right text-[#666]">
              <span className="text-[13px] leading-normal">Extra</span>
              <span
                className={[
                  "fig-w-semibold text-[15px] leading-normal tabular",
                  muted ? "text-fig-600" : "text-[#666]",
                ].join(" ")}
              >
                {formatINR(extra)}
              </span>
            </div>
          ) : null}
        </div>

        <div className="flex min-w-0 flex-col gap-[8px]">
          <div className="flex w-full min-w-0 items-center gap-[10px]">
            <Endpoint
              time={flight.departLabel}
              code={flight.origin.code}
              city={flight.origin.city}
              muted={muted}
            />
            <DurationStack
              duration={flight.durationLabel}
              stops={flight.stops}
              muted={muted}
            />
            <Endpoint
              time={flight.arriveLabel}
              code={flight.destination.code}
              city={flight.destination.city}
              align="right"
              muted={muted}
            />
          </div>

          {hideMeta ? null : (
            <div
              className={[
                metaLayout === "wrap"
                  ? "flex flex-wrap items-center gap-[6px]"
                  : "flex items-center justify-between",
              ].join(" ")}
            >
              <MetaItem icon={<SeatIcon />} wrap={metaLayout === "wrap"}>
                Seat {flight.seat.label} ·{" "}
                <span className="capitalize">{flight.seat.kind}</span>
              </MetaItem>
              <MetaItem icon={<BagIcon />} wrap={metaLayout === "wrap"}>
                {flight.bagKg}kg checked
              </MetaItem>
              <MetaItem icon={<ClassIcon />} wrap={metaLayout === "wrap"}>
                Economy class
              </MetaItem>
            </div>
          )}
        </div>
      </div>

      {footer}
    </>
  );

  // Figma option cards (`81019` / `81054`): radius 14, pad 12.
  const shell = [
    "w-full rounded-[14px] p-[12px] text-left",
    selected
      ? "border border-[#0078ff] bg-[#f5f8ff]"
      : muted
        ? "border border-transparent bg-white/55"
        : "border border-transparent bg-white",
    className,
  ].join(" ");

  if (!onSelect) return <div className={shell}>{body}</div>;

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`${shell} focus-ring-fig`}
    >
      {body}
    </button>
  );
}

function Endpoint({
  time,
  code,
  city,
  align = "left",
  muted,
}: {
  time: string;
  code: string;
  city: string;
  align?: "left" | "right";
  muted: boolean;
}) {
  return (
    <div
      className={[
        "flex min-w-0 flex-1 flex-col gap-[4px]",
        align === "right" ? "items-end text-right" : "items-start text-left",
      ].join(" ")}
    >
      <div
        className={[
          "fig-w-semibold w-full min-w-0 truncate text-[25px] leading-[24px] tabular",
          muted ? "text-fig-600" : "text-fig-900",
        ].join(" ")}
      >
        {time}
      </div>
      <div
        className={[
          "w-full min-w-0 truncate text-[13px] leading-normal",
          muted ? "text-fig-600" : "text-fig-900",
        ].join(" ")}
        title={`${code} · ${city}`}
      >
        {code} · {city}
      </div>
    </div>
  );
}

/**
 * The duration / stops stack between the two times.
 *
 * Two dots joined by a hairline — the same 8 px dots and 1 px line the design
 * uses, not an icon.
 */
function DurationStack({
  duration,
  stops,
  muted,
}: {
  duration: string;
  stops: number;
  muted: boolean;
}) {
  return (
    <div
      aria-hidden="true"
      className={[
        "flex w-[74.5px] max-w-[28%] min-w-[52px] shrink flex-col items-start",
        muted ? "text-fig-400" : "text-[#666]",
      ].join(" ")}
    >
      <span className="mb-[-2px] w-full text-center font-ui text-[7px] font-light leading-normal">
        {duration}
      </span>
      <span className="mb-[-2px] flex h-[8px] w-full items-center">
        <span className="block size-[8px] shrink-0 rounded-full bg-[#BDBDBD]" />
        <span className="mx-[-1px] h-px min-w-px flex-1 bg-[#BDBDBD]" />
        <span className="block size-[8px] shrink-0 rounded-full bg-[#BDBDBD]" />
      </span>
      <span className="w-full text-center font-ui text-[7px] font-light leading-normal">
        {stops === 0 ? "Nonstop" : stops === 1 ? "1 stop" : `${stops} stops`}
      </span>
    </div>
  );
}

function MetaItem({
  icon,
  children,
  wrap = false,
}: {
  icon: ReactNode;
  children: ReactNode;
  wrap?: boolean;
}) {
  return (
    <span
      className={[
        "flex items-center gap-[2.5px] font-ui text-[11px] font-light leading-normal text-[#666]",
        wrap ? "shrink-0" : "min-w-0",
      ].join(" ")}
    >
      <span aria-hidden="true" className="shrink-0 text-fig-400">
        {icon}
      </span>
      <span className={wrap ? "whitespace-nowrap" : "truncate"}>{children}</span>
    </span>
  );
}

export function SeatIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path
        d="M3 1.5v5m0 0h5.5M3 6.5 2 10.5m6.5-4v4"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function BagIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <rect
        x="2"
        y="4"
        width="8"
        height="6.5"
        rx="1.2"
        stroke="currentColor"
        strokeWidth="1.1"
      />
      <path
        d="M4.5 4V2.6a.6.6 0 0 1 .6-.6h1.8a.6.6 0 0 1 .6.6V4"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ClassIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path
        d="M6 1.2 7.3 4.3l3.3.2-2.5 2.1.8 3.2L6 8.1l-2.9 1.7.8-3.2-2.5-2.1 3.3-.2L6 1.2Z"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  );
}
