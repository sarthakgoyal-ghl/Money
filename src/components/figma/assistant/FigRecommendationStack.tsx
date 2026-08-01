import type { FlightOption } from "../../../data/scenario";
import { BLR, BOM, formatINR } from "../../../data/scenario";
import { LightRouteMap } from "../../map/LightRouteMap";
import {
  BaggageIcon,
  CabinClassIcon,
  ExpandIcon,
  RouteConnector,
  SeatIcon,
  ShieldTickIcon,
} from "./threadAssets";

interface FigRecommendationStackProps {
  option: FlightOption;
  currentFlightNo: string;
  onExpandMap: () => void;
  onReviewChange: () => void;
  onSeeOtherOptions: () => void;
  onKeepCurrentFlight: () => void;
  /** The full-map frame already shows the route — omit the mini preview. */
  hideMap?: boolean;
}

/**
 * Recommendation bubble — Figma `1213:77674` / thread `1204:80739`.
 *
 * `#e9e9eb` 16 px radius, ~300 px. Primary Review + soft secondary pair +
 * shield note live on the bubble (`1223:77994`); the sticky footer is only the
 * Thread Input Bar (`1223:78147`).
 */
export function FigRecommendationStack({
  option,
  currentFlightNo,
  onExpandMap,
  onReviewChange,
  onSeeOtherOptions,
  onKeepCurrentFlight,
  hideMap = false,
}: FigRecommendationStackProps) {
  const { flight } = option;

  return (
    <div className="ml-[5.5px] flex w-[299.5px] flex-col gap-[6px] overflow-hidden rounded-[16px] bg-fig-bubble pb-[4px]">
      {hideMap ? null : <MiniMapPreview onExpand={onExpandMap} />}

      {/* `1213:77684` — flight object. */}
      <div className="flex flex-col gap-[6px] overflow-hidden px-[10px] pb-[4px]">
        <div className="flex items-center justify-between tracking-[-0.15px]">
          <div className="flex flex-col gap-[2px]">
            <p className="text-[11px] leading-[normal] text-[#ff9500]">
              Recommended
            </p>
            <p className="fig-w-semibold text-[13px] leading-[normal] text-fig-note/90">
              {flight.airline} {flight.flightNo}
            </p>
          </div>
          <div className="flex flex-col items-end gap-[2px] text-right text-fig-note/90">
            <p className="text-[11px] leading-[normal]">Extra</p>
            <p className="fig-w-semibold text-[13px] leading-[normal]">
              {formatINR(option.price.total)}
            </p>
          </div>
        </div>

        <div className="flex w-full min-w-0 flex-col gap-[6px]">
          <div className="flex w-full min-w-0 items-center gap-[14px]">
            <div className="flex min-w-0 flex-1 flex-col gap-[4px] text-fig-900">
              <p className="fig-w-semibold w-full min-w-0 truncate text-[21px] leading-[24px] tabular">
                {flight.departLabel}
              </p>
              <p
                className="w-full min-w-0 truncate text-[11px] leading-[normal]"
                title={`${flight.origin.code} · ${flight.origin.city}`}
              >
                {flight.origin.code} · {flight.origin.city}
              </p>
            </div>

            <div className="flex w-[74.5px] shrink-0 flex-col">
              <p className="mb-[-2px] truncate text-center font-ui text-[7px] font-light leading-[normal] text-fig-note">
                {flight.durationLabel}
              </p>
              <span className="mb-[-2px] w-full">
                <RouteConnector />
              </span>
              <p className="truncate text-center font-ui text-[7px] font-light leading-[normal] text-fig-note">
                {flight.stops === 0 ? "Nonstop" : `${flight.stops} stop`}
              </p>
            </div>

            <div className="flex min-w-0 flex-1 flex-col items-end gap-[4px] text-right text-fig-900">
              <p className="fig-w-semibold w-full min-w-0 truncate text-[21px] leading-[24px] tabular">
                {flight.arriveLabel}
              </p>
              <p
                className="w-full min-w-0 truncate text-[11px] leading-[normal]"
                title={`${flight.destination.code} · ${flight.destination.city}`}
              >
                {flight.destination.code} · {flight.destination.city}
              </p>
            </div>
          </div>

          <ul className="flex items-center justify-between">
            <MetaFact icon={<SeatIcon />}>
              Seat {flight.seat.label} ·{" "}
              {flight.seat.kind === "window"
                ? "Window"
                : flight.seat.kind === "aisle"
                  ? "Aisle"
                  : "Middle"}
            </MetaFact>
            <MetaFact icon={<BaggageIcon />}>{flight.bagKg}kg checked</MetaFact>
            <MetaFact icon={<CabinClassIcon />}>Economy class</MetaFact>
          </ul>
        </div>
      </div>

      {/* `1223:77994` — Review + soft pair + shield. */}
      <div className="flex w-full flex-col items-center gap-[6px] px-[10px] pb-[4px]">
        <button
          type="button"
          onClick={onReviewChange}
          className="flex h-[32px] w-full items-center justify-center gap-[8px] overflow-hidden rounded-[14px] border border-fig-blue bg-fig-blue px-[14px] py-[8px] font-ui text-[13px] font-semibold leading-[18px] text-white transition-colors hover:bg-[#0079e6] active:bg-[#0071d6] focus-ring-fig"
        >
          Review change · {formatINR(option.price.total)}
        </button>

        <div className="flex w-full items-start gap-[6px]">
          <SoftAction onClick={onSeeOtherOptions}>Other options</SoftAction>
          <SoftAction onClick={onKeepCurrentFlight}>
            Keep {currentFlightNo}
          </SoftAction>
        </div>

        <p className="flex items-center gap-[2.5px] font-sans text-[9px] font-light leading-[normal] text-fig-note">
          <ShieldTickIcon />
          {currentFlightNo} stays booked until you approve.
        </p>
      </div>
    </div>
  );
}

/** `1213:77677` — 168 px live route crop with a 36 px glass expand control. */
function MiniMapPreview({ onExpand }: { onExpand: () => void }) {
  return (
    <div className="relative h-[168px] w-full">
      <LightRouteMap
        origin={BOM}
        destination={BLR}
        variant="mini"
        tone="active"
        progress={0.46}
        camera="proposal"
        inset={{ top: 28, bottom: 28, left: 40, right: 40 }}
        className="h-full w-full"
      />
      <button
        type="button"
        onClick={onExpand}
        aria-label="Expand the route map"
        className="fig-circle-button absolute bottom-[8px] right-[8px] flex size-[36px] items-center justify-center rounded-full drop-shadow-[0px_32px_32px_rgba(16,24,40,0.14)] focus-ring-fig-map"
      >
        <ExpandIcon />
      </button>
    </div>
  );
}

function MetaFact({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <li className="flex h-[12px] items-center gap-[2.5px]">
      {icon}
      <span className="whitespace-nowrap font-ui text-[10px] font-light leading-[normal] text-fig-note">
        {children}
      </span>
    </li>
  );
}

/** Soft secondary — Figma `1223:77997` / `1223:77998`: 32 px, blue wash. */
function SoftAction({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-[32px] min-w-0 flex-1 items-center justify-center overflow-hidden rounded-[14px] bg-fig-blue/[0.08] px-[14px] py-[8px] font-ui text-[13px] font-semibold leading-[18px] text-fig-blue transition-colors hover:bg-fig-blue/[0.14] active:bg-fig-blue/[0.18] focus-ring-fig"
    >
      <span className="truncate">{children}</span>
    </button>
  );
}
