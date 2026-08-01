import type { ReactNode } from "react";
import type { Flight } from "../../data/scenario";

const ASSET = "/figma/assets";

interface FigCurrentBookingCardProps {
  flight: Flight;
}

/**
 * Read-only itinerary proof — boarding-pass route language without ticket
 * silhouette, barcode, or wallet cues.
 *
 * Shared by Rejected and Current trip so “what’s booked” always reads the same
 * (solid white plate, airline header, arc route, 13 px meta) — not the muted
 * Review comparison card (`FigFlightCard` kind=`current`).
 */
export function FigCurrentBookingCard({ flight }: FigCurrentBookingCardProps) {
  const stopsLabel =
    flight.stops === 0
      ? "Nonstop"
      : flight.stops === 1
        ? "1 stop"
        : `${flight.stops} stops`;

  const seatKind =
    flight.seat.kind === "window"
      ? "Window"
      : flight.seat.kind === "aisle"
        ? "Aisle"
        : "Middle";

  return (
    <article
      aria-label={`Current booking, ${flight.airline} ${flight.flightNo}`}
      className="flex w-full flex-col overflow-hidden rounded-[16px] bg-white"
    >
      <div className="flex items-center gap-[6px] bg-[rgba(0,136,255,0.08)] px-[16px] py-[12px]">
        <span className="relative flex size-[16px] shrink-0 items-center justify-center overflow-hidden">
          <img
            src={`${ASSET}/boarding-airline.svg`}
            alt=""
            aria-hidden="true"
            className="size-full object-contain"
          />
        </span>
        <span className="fig-w-semibold text-[13px] leading-normal text-fig-900">
          {flight.airline}
        </span>
        <span className="fig-w-medium text-[13px] leading-normal text-fig-600">
          {flight.flightNo}
        </span>
        <span className="ml-auto rounded-[6px] bg-white/80 px-[8px] py-[3px] text-[11px] font-medium leading-none text-fig-600">
          Current booking
        </span>
      </div>

      <div className="flex flex-col gap-[16px] px-[16px] py-[16px]">
        <div className="flex w-full min-w-0 items-center gap-[14px]">
          <TimeBlock
            time={flight.departLabel}
            place={`${flight.origin.code} · ${flight.origin.city}`}
            align="left"
          />

          <div className="flex shrink-0 flex-col items-center">
            <div className="relative mb-[-10px] h-[36px] w-[116px]">
              <img
                src={`${ASSET}/boarding-arc.svg`}
                alt=""
                aria-hidden="true"
                className="absolute left-0 top-[8px] h-[28px] w-[116px] max-w-none"
              />
              <span className="absolute left-1/2 top-0 flex size-[16px] -translate-x-1/2 items-center justify-center">
                <span className="flex size-[16px] rotate-90 items-center justify-center">
                  <img
                    src={`${ASSET}/boarding-plane.svg`}
                    alt=""
                    aria-hidden="true"
                    className="block size-[14px] max-w-none"
                  />
                </span>
              </span>
            </div>
            <div className="flex w-full flex-col items-center gap-[2px] text-center text-[11px] leading-normal">
              <span className="text-fig-900">{flight.durationLabel}</span>
              <span className="font-light text-[#666]">{stopsLabel}</span>
            </div>
          </div>

          <TimeBlock
            time={flight.arriveLabel}
            place={`${flight.destination.code} · ${flight.destination.city}`}
            align="right"
          />
        </div>

        <div className="flex flex-wrap items-center gap-x-[12px] gap-y-[8px] text-[13px] leading-normal text-fig-600">
          <MetaInline
            src={`${ASSET}/boarding-meta-seat.svg`}
            inset="9.36% 16.67%"
          >
            Seat {flight.seat.label} · {seatKind}
          </MetaInline>
          <MetaInline
            src={`${ASSET}/boarding-meta-bag.svg`}
            inset="8.33% 16.67%"
          >
            {flight.bagKg}kg checked
          </MetaInline>
          <MetaInline
            src={`${ASSET}/boarding-meta-class.svg`}
            inset="12.6% 7.15%"
          >
            {flight.fare === "Economy Classic" ? "Economy" : flight.fare}
          </MetaInline>
        </div>
      </div>
    </article>
  );
}

function TimeBlock({
  time,
  place,
  align,
}: {
  time: string;
  place: string;
  align: "left" | "right";
}) {
  return (
    <div
      className={[
        "flex min-w-0 flex-1 flex-col gap-[4px] text-fig-900",
        align === "right" ? "items-end text-right" : "items-start text-left",
      ].join(" ")}
    >
      <p className="fig-w-semibold w-full min-w-0 truncate text-[25px] leading-[24px] tabular">
        {time}
      </p>
      <p
        className="w-full min-w-0 truncate text-[13px] leading-normal"
        title={place}
      >
        {place}
      </p>
    </div>
  );
}

function MetaInline({
  src,
  inset,
  children,
}: {
  src: string;
  inset: string;
  children: ReactNode;
}) {
  return (
    <span className="inline-flex min-w-0 items-center gap-[4px]">
      <span className="relative flex size-[14px] shrink-0 items-center justify-center overflow-hidden">
        <span className="absolute block" style={{ inset }}>
          <img
            src={src}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 block h-full w-full max-w-none"
          />
        </span>
      </span>
      <span className="truncate">{children}</span>
    </span>
  );
}
