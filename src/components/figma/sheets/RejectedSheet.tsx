import { useEffect, useState } from "react";
import { currentBooking, passenger } from "../../../data/scenario";
import { FigButton, CautionText } from "../FigButton";
import { FigCurrentBookingCard } from "../FigCurrentBookingCard";
import {
  FigAlert,
  FigSheet,
  FigTile,
  type FigSheetHeight,
} from "../FigSheet";

interface RejectedSheetProps {
  onLookAgain: () => void;
  onBackToTrip: () => void;
  onClose: () => void;
}

/**
 * Kept current flight — sheet chrome matches Success title·subtitle.
 * Body uses a current-booking summary (not a selectable option card, not a
 * boarding pass): route hero + fact tiles.
 */
export function RejectedSheet({
  onLookAgain,
  onBackToTrip,
  onClose,
}: RejectedSheetProps) {
  const [height, setHeight] = useState<FigSheetHeight>("full");

  useEffect(() => {
    setHeight("full");
  }, []);

  const subtitle = (
    <>
      <span className="fig-w-semibold text-fig-600">{currentBooking.flightNo}</span>
      {" at "}
      <span className="fig-w-semibold tabular text-fig-600">
        {currentBooking.departLabel}
      </span>
      {" and seat "}
      <span className="fig-w-semibold tabular text-fig-600">
        {currentBooking.seat.label}
      </span>
      {" are still booked."}
    </>
  );

  return (
    <FigSheet
      height={height}
      expandHeight="full"
      onHeightChange={setHeight}
      showScrim={false}
      showHandle
      chromePadTop={6}
      title="No changes made"
      subtitle={subtitle}
      onClose={onClose}
      footer={
        <div className="flex w-full flex-col gap-[6px]">
          <FigButton variant="primary" fullWidth compact onClick={onLookAgain}>
            Look for another option
          </FigButton>
          <FigButton variant="soft" fullWidth compact onClick={onBackToTrip}>
            Back to trip
          </FigButton>
        </div>
      }
    >
      <div className="flex w-full flex-col gap-[12px] pb-[8px]">
        <FigCurrentBookingCard flight={currentBooking} />

        <div className="flex w-full flex-col gap-[6px]">
          <div className="flex w-full gap-[6px]">
            <FigTile
              label="Booking"
              value={currentBooking.bookingRef ?? "-"}
            />
            <FigTile label="Seat" value={currentBooking.seat.label} />
          </div>
          <div className="flex w-full gap-[6px]">
            <FigTile label="Passenger" value={passenger.fullName} />
            <FigTile label="Date" value={currentBooking.dateShort} />
          </div>
        </div>

        <FigAlert tone="success">
          Nothing was charged and nothing was cancelled. Your trip is exactly as
          it was.
        </FigAlert>

        <CautionText>
          Simulated booking. Your existing reservation was not changed.
        </CautionText>
      </div>
    </FigSheet>
  );
}
