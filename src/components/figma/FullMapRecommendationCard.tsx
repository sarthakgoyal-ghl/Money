import type { ReactNode } from "react";
import type { FlightOption } from "../../data/scenario";
import { formatINR } from "../../data/scenario";
import { FigButton, SafetyNote } from "./FigButton";
import {
  BaggageIcon,
  CabinClassIcon,
  RouteConnector,
  SeatIcon,
} from "./assistant/threadAssets";

interface FullMapRecommendationCardProps {
  option: FlightOption;
  currentFlightNo: string;
  onReviewChange: () => void;
  onSeeOtherOptions: () => void;
  onKeepCurrentFlight: () => void;
}

/**
 * Floating recommendation sheet on the expanded map — Figma `1204:80855`.
 *
 * Typography: SF Pro (`font-sans`) for header + schedule clocks/cities;
 * Inter (`font-ui`) for connector meta, amenity row, buttons, safety note.
 */
export function FullMapRecommendationCard({
  option,
  currentFlightNo,
  onReviewChange,
  onSeeOtherOptions,
  onKeepCurrentFlight,
}: FullMapRecommendationCardProps) {
  const { flight } = option;
  const seatKind =
    flight.seat.kind.charAt(0).toUpperCase() + flight.seat.kind.slice(1);

  return (
    <section
      aria-label="Recommended flight"
      className="fig-sheet relative flex w-full flex-col gap-[16px] overflow-hidden rounded-[24px] p-[16px]"
    >
      <div className="relative z-[1] flex w-full flex-col gap-[8px] overflow-hidden">
        {/* `1204:80859` — Recommended + Extra (36 px row). */}
        <div className="flex items-center justify-between">
          {/* `1204:80860` — SF Pro stack, gap 2, label 13/16 + value 15/18 */}
          <div className="flex shrink-0 flex-col items-start justify-center gap-[2px] tracking-[-0.15px]">
            <p className="w-full font-sans text-[13px] font-normal leading-[16px] text-[#0078ff]">
              Recommended
            </p>
            <p className="fig-w-semibold w-full font-sans text-[15px] leading-[18px] text-[#666]">
              {flight.airline} {flight.flightNo}
            </p>
          </div>
          {/* `1204:80863` — Extra · price, right-aligned */}
          <div className="flex shrink-0 flex-col items-end justify-center gap-[2px] text-right tracking-[-0.15px] text-[#666]">
            <p className="w-full font-sans text-[13px] font-normal leading-[16px]">
              Extra
            </p>
            <p className="fig-w-semibold w-full font-sans text-[15px] leading-[18px]">
              {formatINR(option.price.total)}
            </p>
          </div>
        </div>

        <div className="flex w-full flex-col gap-[8px]">
          {/* `1204:80867` — departure · duration connector · arrival. */}
          <div className="flex w-full min-w-0 items-center gap-[14px]">
            {/* `1204:80868` */}
            <div className="flex min-w-0 flex-1 flex-col items-start justify-center gap-[4px] text-fig-900">
              {/* `1204:80869` — SF Pro Semibold 25/24 */}
              <p className="fig-w-semibold w-full min-w-0 truncate font-sans text-[25px] leading-[24px] tabular">
                {flight.departLabel}
              </p>
              {/* `1204:80870` — SF Pro Regular 13 */}
              <p
                className="w-full min-w-0 truncate font-sans text-[13px] font-normal leading-normal"
                title={`${flight.origin.code} · ${flight.origin.city}`}
              >
                {flight.origin.code} · {flight.origin.city}
              </p>
            </div>

            {/* `1204:80871` — connector shrinks when endpoints need the width. */}
            <div className="flex w-[100px] max-w-[30%] min-w-[56px] shrink flex-col items-start">
              <p className="w-full truncate text-center font-ui text-[9px] font-light leading-normal text-[#666]">
                {flight.durationLabel}
              </p>
              <RouteConnector />
              <p className="w-full truncate text-center font-ui text-[9px] font-light leading-normal text-[#666]">
                {flight.stops === 0 ? "Nonstop" : `${flight.stops} stop`}
              </p>
            </div>

            {/* `1204:80878` */}
            <div className="flex min-w-0 flex-1 flex-col items-end justify-center gap-[4px] text-right text-fig-900">
              {/* `1204:80879` — SF Pro Semibold 25/24 */}
              <p className="fig-w-semibold w-full min-w-0 truncate font-sans text-[25px] leading-[24px] tabular">
                {flight.arriveLabel}
              </p>
              {/* `1204:80880` — SF Pro Regular 13 */}
              <p
                className="w-full min-w-0 truncate font-sans text-[13px] font-normal leading-normal"
                title={`${flight.destination.code} · ${flight.destination.city}`}
              >
                {flight.destination.code} · {flight.destination.city}
              </p>
            </div>
          </div>

          {/* `1204:80881` — seat / bag / class. Inter Light 11. */}
          <ul className="flex items-center justify-between">
            <MetaFact icon={<SeatIcon />}>
              Seat {flight.seat.label} · {seatKind}
            </MetaFact>
            <MetaFact icon={<BaggageIcon />}>{flight.bagKg}kg checked</MetaFact>
            <MetaFact icon={<CabinClassIcon />}>Economy class</MetaFact>
          </ul>
        </div>
      </div>

      {/* `1204:80891` — primary + soft pair + safety note. */}
      <div className="relative z-[1] flex w-full flex-col items-center gap-[6px]">
        {/* `1204:80892` */}
        <FigButton variant="primary" fullWidth compact onClick={onReviewChange}>
          Review change · {formatINR(option.price.total)}
        </FigButton>

        <div className="flex w-full items-start gap-[6px]">
          {/* Visual order matches Figma after its 180° flip: Other · Keep */}
          <FigButton
            variant="soft"
            compact
            className="min-w-0 flex-1"
            onClick={onSeeOtherOptions}
          >
            Other options
          </FigButton>
          {/* `1204:80894` */}
          <FigButton
            variant="soft"
            compact
            className="min-w-0 flex-1"
            onClick={onKeepCurrentFlight}
          >
            Keep {currentFlightNo}
          </FigButton>
        </div>

        {/* `1204:80898` */}
        <SafetyNote>
          {currentFlightNo} stays booked until you approve.
        </SafetyNote>
      </div>
    </section>
  );
}

function MetaFact({
  icon,
  children,
}: {
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <li className="flex shrink-0 items-center gap-[2.5px]">
      <span className="relative flex size-[10px] shrink-0 items-center justify-center overflow-hidden">
        {icon}
      </span>
      <span className="whitespace-nowrap font-ui text-[11px] font-light leading-normal text-[#666]">
        {children}
      </span>
    </li>
  );
}
