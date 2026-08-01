import type { ReactNode } from "react";
import { FileText, Headset, MessageSquare, Phone } from "lucide-react";
import type { PaymentMethod, PriceBreakdown } from "../../../data/scenario";
import { currentBooking, formatINR, specialist, supportCase } from "../../../data/scenario";
import { FigButton } from "../FigButton";
import { FigAlert, FigCard, FigSheet, FigTile } from "../FigSheet";

interface HandoffSheetProps {
  price: PriceBreakdown;
  payment: PaymentMethod;
  onChat: () => void;
  onCall: () => void;
  onCaseDetails: () => void;
  onClose: () => void;
}

/**
 * Human handoff — glass sheet over map (no scrim), Success/Rejected chrome,
 * status as FigTiles, soft CTA row from boarding pattern `1204:81226`.
 */
export function HandoffSheet({
  price,
  payment,
  onChat,
  onCall,
  onCaseDetails,
  onClose,
}: HandoffSheetProps) {
  return (
    <FigSheet
      height="full"
      expandHeight="full"
      showScrim={false}
      showHandle
      chromePadTop={6}
      title="A specialist needs to finish this"
      onClose={onClose}
      footer={
        <div className="flex w-full flex-col gap-[8px]">
          <FigButton
            variant="primary"
            fullWidth
            compact
            leadingIcon={
              <MessageSquare size={20} strokeWidth={2} aria-hidden="true" />
            }
            onClick={onChat}
          >
            Chat with {specialist.name}
          </FigButton>
          <div className="flex w-full items-center gap-[8px]">
            <SoftActionTile
              label="Call support"
              onClick={onCall}
              icon={<Phone size={20} strokeWidth={2} aria-hidden="true" />}
            />
            <SoftActionTile
              label="Case details"
              onClick={onCaseDetails}
              icon={<FileText size={20} strokeWidth={2} aria-hidden="true" />}
            />
          </div>
        </div>
      }
    >
      <div className="flex w-full flex-col gap-[12px] pb-[8px]">
        <p className="text-[14px] leading-[20px] text-fig-600">
          Payment authorised on{" "}
          <span className="fig-w-semibold text-fig-900">{payment.label}</span>
          . Ticket not issued.{" "}
          <span className="fig-w-semibold text-fig-900">
            {currentBooking.flightNo}
          </span>{" "}
          still active.
        </p>

        <FigAlert tone="warn">
          Automatic retries are paused so we don&apos;t create a duplicate charge.
        </FigAlert>

        <div className="flex w-full flex-col gap-[6px]">
          <div className="flex w-full gap-[6px]">
            <FigTile label="Payment" value={`${formatINR(price.total)} pending`} />
            <FigTile label="New ticket" value="Not issued" />
          </div>
          <div className="flex w-full gap-[6px]">
            <FigTile
              label="Current ticket"
              value={`${currentBooking.flightNo} · ${currentBooking.seat.label}`}
            />
            <FigTile label="Retries" value="Paused" />
          </div>
        </div>

        <FigCard className="p-[14px]">
          <div className="flex items-center gap-[12px]">
            <span
              aria-hidden="true"
              className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-full bg-fig-blue/[0.12] text-[15px] font-semibold text-fig-blue"
            >
              {specialist.initials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[16px] fig-w-semibold leading-[20px] text-fig-900">
                {specialist.name}
              </p>
              <p className="text-[13px] leading-[18px] text-fig-600">
                {specialist.role} · ~2 min · Case{" "}
                <span className="fig-w-medium tabular text-fig-900">{supportCase.id}</span>
              </p>
            </div>
          </div>
          <p className="mt-[10px] text-[14px] leading-[20px] text-fig-600">
            {formatINR(price.total)} authorised, not captured. New ticket not issued.{" "}
            {currentBooking.flightNo} still active. No automated retry. Your request, selected
            flight, approved amount, and airline responses are already shared.{" "}
            {specialist.name} won&apos;t ask you to repeat them.
          </p>
        </FigCard>

        <FigAlert
          tone="success"
          icon={<Headset size={16} strokeWidth={2.25} aria-hidden="true" />}
        >
          Nothing further happens without a person.
        </FigAlert>
      </div>
    </FigSheet>
  );
}

/** Soft tile — same geometry as `1204:81229`…`81235` (20px icon + 16/24 label). */
function SoftActionTile({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-w-0 flex-1 flex-col items-center gap-[4px] rounded-[14px] bg-fig-blue/[0.08] p-[8px] text-fig-blue focus-ring-fig"
    >
      <span className="flex size-[20px] shrink-0 items-center justify-center">
        {icon}
      </span>
      <span className="w-full text-center font-ui text-[16px] font-semibold leading-[24px]">
        {label}
      </span>
    </button>
  );
}
