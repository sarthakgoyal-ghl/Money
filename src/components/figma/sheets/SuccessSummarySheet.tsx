import { useEffect, useState } from "react";
import type { PaymentMethod } from "../../../data/scenario";
import { currentBooking, formatINR, successBooking } from "../../../data/scenario";
import type { Flight } from "../../../data/scenario";
import { SuccessCelebration, SuccessSeal } from "../SuccessCelebration";
import { FigButton, CautionText } from "../FigButton";
import { FigAlert, FigSheet, FigTile, type FigSheetHeight } from "../FigSheet";

const ASSET = "/figma/assets";

interface SuccessSummarySheetProps {
  open: boolean;
  flight: Flight;
  settledTotal: number;
  payment: PaymentMethod;
  onClose: () => void;
  onViewBoardingPass: () => void;
  onGetHelp: () => void;
  /** Recess under a stacked boarding-pass overlay. */
  recessed?: boolean;
}

/**
 * Success summary — Figma `1204:81101` / sheet `1204:81105`.
 *
 * Same chrome as Review / Other options: grabber, `chromePadTop` 6, open at
 * `full`, chevron collapses to `partial`. Footer CTAs are `1204:81157`.
 * Opening also fires a one-shot celebration (confetti + seal).
 */
export function SuccessSummarySheet({
  open,
  flight,
  settledTotal,
  payment,
  onClose,
  onViewBoardingPass,
  onGetHelp,
  recessed,
}: SuccessSummarySheetProps) {
  const [height, setHeight] = useState<FigSheetHeight>("full");

  useEffect(() => {
    if (open) setHeight("full");
  }, [open]);

  if (!open) return null;

  const subtitle = (
    <>
      <span className="fig-w-semibold text-fig-600">{flight.flightNo}</span>
      {` arrives in ${flight.destination.city} at `}
      <span className="fig-w-semibold tabular text-fig-600">{flight.arriveLabel}</span>.
    </>
  );

  return (
    <>
      <SuccessCelebration active={open} />
      <FigSheet
        height={height}
        expandHeight="full"
        onHeightChange={setHeight}
        showScrim={false}
        showHandle
        chromePadTop={6}
        recessed={recessed}
        hero={<SuccessSeal src="/figma/success-seal.svg" />}
        heroPlacement="inline"
        title="You're rebooked"
        subtitle={subtitle}
        onClose={onClose}
        footer={
          <div className="flex w-full flex-col gap-[6px]">
            <FigButton
              variant="primary"
              fullWidth
              compact
              leadingIcon={<BoardingPassCtaIcon />}
              onClick={onViewBoardingPass}
            >
              View boarding pass
            </FigButton>
            <FigButton
              variant="soft"
              fullWidth
              compact
              leadingIcon={<HeadsetCtaIcon />}
              onClick={onGetHelp}
            >
              Get help with this trip
            </FigButton>
          </div>
        }
      >
        {/* `1204:81123` */}
        <div className="flex w-full flex-col gap-[12px] pb-[8px]">
          <div className="flex w-full flex-col gap-[6px]">
            <div className="flex w-full gap-[6px]">
              <FigTile label="Booking" value={successBooking.newBookingRef} />
              <FigTile label="Seat" value={flight.seat.label} />
            </div>
            <div className="flex w-full gap-[6px]">
              <FigTile label="Charged" value={formatINR(settledTotal)} />
              <FigTile label="Released" value={currentBooking.flightNo} />
            </div>
          </div>

          {/* `1204:81143` */}
          <FigAlert
            tone="success"
            icon={
              <img
                src={`${ASSET}/paid-icon.svg`}
                alt=""
                className="size-[20px]"
              />
            }
          >
            Charged to {payment.label}. A receipt is on its way by email.
          </FigAlert>

          {/* `1204:81156` */}
          <CautionText>
            Simulated bookings. No airline or payment system was contacted.
          </CautionText>
        </div>
      </FigSheet>
    </>
  );
}

/**
 * Figma `1204:81158` — confirmation_number in a 20×20 frame,
 * leaf inset `16.67% 8.33%`. Inline so `currentColor` follows the button.
 */
function BoardingPassCtaIcon() {
  return (
    <span className="relative block size-[20px] shrink-0 overflow-hidden text-current">
      <span className="absolute inset-[16.67%_8.33%]">
        <svg
          viewBox="0 0 16.6667 13.3333"
          className="absolute inset-0 block h-full w-full"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M16.6667 5V1.66667C16.6667 0.741667 15.9167 0 15 0H1.66667C0.75 0 0.00833333 0.741667 0.00833333 1.66667V5C0.925 5 1.66667 5.75 1.66667 6.66667C1.66667 7.58333 0.925 8.33333 0 8.33333V11.6667C0 12.5833 0.75 13.3333 1.66667 13.3333H15C15.9167 13.3333 16.6667 12.5833 16.6667 11.6667V8.33333C15.75 8.33333 15 7.58333 15 6.66667C15 5.75 15.75 5 16.6667 5ZM15 3.78333C14.0083 4.35833 13.3333 5.44167 13.3333 6.66667C13.3333 7.89167 14.0083 8.975 15 9.55V11.6667H1.66667V9.55C2.65833 8.975 3.33333 7.89167 3.33333 6.66667C3.33333 5.43333 2.66667 4.35833 1.675 3.78333L1.66667 1.66667H15V3.78333ZM7.5 9.16667H9.16667V10.8333H7.5V9.16667ZM7.5 5.83333H9.16667V7.5H7.5V5.83333ZM7.5 2.5H9.16667V4.16667H7.5V2.5Z"
            fill="currentColor"
          />
        </svg>
      </span>
    </span>
  );
}

/** Figma `1204:81159` — headset_mic, leaf inset `4.17% 12.5%`. */
function HeadsetCtaIcon() {
  return (
    <span className="relative block size-[20px] shrink-0 overflow-hidden text-current">
      <span className="absolute inset-[4.17%_12.5%]">
        <svg
          viewBox="0 0 15 18.3333"
          className="absolute inset-0 block h-full w-full"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M13.3333 10.8333V14.1667H11.6667V10.8333H13.3333ZM3.33333 10.8333V14.1667H2.5C2.04167 14.1667 1.66667 13.7917 1.66667 13.3333V10.8333H3.33333ZM7.5 0C3.35833 0 0 3.35833 0 7.5V13.3333C0 14.7167 1.11667 15.8333 2.5 15.8333H5V9.16667H1.66667V7.5C1.66667 4.275 4.275 1.66667 7.5 1.66667C10.725 1.66667 13.3333 4.275 13.3333 7.5V9.16667H10V15.8333H13.3333V16.6667H7.5V18.3333H12.5C13.8833 18.3333 15 17.2167 15 15.8333V7.5C15 3.35833 11.6417 0 7.5 0Z"
            fill="currentColor"
          />
        </svg>
      </span>
    </span>
  );
}
