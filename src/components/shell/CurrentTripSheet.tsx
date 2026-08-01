import { currentBooking, passenger } from "../../data/scenario";
import { CautionText } from "../figma/FigButton";
import { FigCurrentBookingCard } from "../figma/FigCurrentBookingCard";
import { FigAlert, FigTile } from "../figma/FigSheet";
import { BottomSheet } from "../shared/BottomSheet";

interface CurrentTripSheetProps {
  open: boolean;
  onClose: () => void;
}

/**
 * The booking the session is acting on — opened from the route pill.
 *
 * Same proof language as Rejected (`FigCurrentBookingCard` + FigTiles +
 * FigAlert). Not the muted Review comparison card.
 */
export function CurrentTripSheet({ open, onClose }: CurrentTripSheetProps) {
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Your current booking"
      subtitle="Nothing here changes until you approve a change."
      size="tall"
      stacked
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
          This ticket stays active for the whole flow, including if a
          replacement fails midway.
        </FigAlert>

        <CautionText>
          Simulated booking; no airline system is contacted.
        </CautionText>
      </div>
    </BottomSheet>
  );
}
