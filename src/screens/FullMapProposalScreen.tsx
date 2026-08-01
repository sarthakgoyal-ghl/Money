import type { FlightOption } from "../data/scenario";
import { currentBooking } from "../data/scenario";
import { FullMapRecommendationCard } from "../components/figma/FullMapRecommendationCard";
import { MapRelocateButton } from "../components/map/MapRelocateButton";

interface FullMapProposalCardProps {
  option: FlightOption;
  onReviewChange: () => void;
  onSeeOtherOptions: () => void;
  onKeepCurrentFlight: () => void;
}

/**
 * Floating recommendation card for the full-map proposal — Figma `1204:80852`.
 *
 * Stack matches Figma: relocate (`1215:77650`) → 8 px gap → sheet (`80855`),
 * docked with `pb-[28px]` above the home indicator.
 */
export function FullMapProposalCard({
  option,
  onReviewChange,
  onSeeOtherOptions,
  onKeepCurrentFlight,
}: FullMapProposalCardProps) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[25] flex flex-col items-stretch justify-end gap-[8px] px-[6px] pb-[28px] pt-[8px]">
      <div className="pointer-events-auto flex w-full items-center justify-end">
        <MapRelocateButton />
      </div>
      <div className="pointer-events-auto w-full">
        <FullMapRecommendationCard
          option={option}
          currentFlightNo={currentBooking.flightNo}
          onReviewChange={onReviewChange}
          onSeeOtherOptions={onSeeOtherOptions}
          onKeepCurrentFlight={onKeepCurrentFlight}
        />
      </div>
    </div>
  );
}
