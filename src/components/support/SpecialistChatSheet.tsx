import { useEffect, useId, useState } from "react";
import type { CaseContextEntry } from "../../data/caseContext";
import {
  currentBooking,
  specialist,
  supportCase,
} from "../../data/scenario";
import { CautionText } from "../figma/FigButton";
import { FigDisclosure } from "../figma/FigDisclosure";
import { FigCard } from "../figma/FigSheet";
import { BottomSheet } from "../shared/BottomSheet";

interface SpecialistChatSheetProps {
  open: boolean;
  onClose: () => void;
  entries: CaseContextEntry[];
}

/**
 * Simulated specialist conversation.
 *
 * Opens with the case summary already in the thread. Chrome matches Fig sheets:
 * case id in the subtitle, white 14px plates, shared disclosure.
 */
export function SpecialistChatSheet({
  open,
  onClose,
  entries,
}: SpecialistChatSheetProps) {
  const [fullOpen, setFullOpen] = useState(false);
  const fullId = useId();

  useEffect(() => {
    if (!open) setFullOpen(false);
  }, [open]);

  const headline = entries.filter((entry) =>
    ["Selected flight", "Approved amount", "Payment status", "New ticket status"].includes(
      entry.label,
    ),
  );

  const approvedAmount =
    entries
      .find((entry) => entry.label === "Approved amount")
      ?.value.replace(" (exact)", "") ?? "the authorised amount";
  const selectedFlight =
    entries.find((entry) => entry.label === "Selected flight")?.value ?? "";
  const selectedFlightNo =
    selectedFlight.match(/\bAI\s?\d+\b/)?.[0] ?? "the selected flight";
  const openingMessage =
    `I can see the ${approvedAmount} authorisation on ${selectedFlightNo} and that no ticket number came back. ` +
    `Your ${currentBooking.flightNo} booking is still active. I'll confirm with the airline before anything is charged.`;

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Travel specialist"
      subtitle={`Case ${supportCase.id}`}
      size="full"
      stacked
      footer={
        <CautionText>Simulated conversation · no message is sent.</CautionText>
      }
    >
      <div className="flex flex-col gap-[16px] pb-[8px]">
        <FigCard className="flex flex-col gap-[12px] rounded-[14px] p-[12px]">
          <p className="fig-w-medium text-[13px] leading-normal text-fig-900">
            Shared with the specialist
          </p>
          <dl className="flex flex-col gap-[10px]">
            {headline.map((entry) => (
              <div
                key={entry.label}
                className="flex items-baseline justify-between gap-[12px]"
              >
                <dt className="text-[13px] leading-normal text-fig-600">{entry.label}</dt>
                <dd className="min-w-0 text-right text-[13px] font-medium tabular leading-normal text-fig-900">
                  {entry.value}
                </dd>
              </div>
            ))}
          </dl>
        </FigCard>

        <FigDisclosure
          id={fullId}
          label="View everything shared"
          open={fullOpen}
          onToggle={() => setFullOpen((value) => !value)}
        >
          <dl className="flex flex-col gap-[10px]">
            {entries.map((entry) => (
              <div key={entry.label} className="flex flex-col gap-[2px]">
                <dt className="text-[12px] leading-normal text-fig-600">{entry.label}</dt>
                <dd className="text-[13px] leading-[18px] text-fig-900">{entry.value}</dd>
              </div>
            ))}
          </dl>
        </FigDisclosure>

        <div className="flex gap-[10px]">
          <span
            aria-hidden="true"
            className="mt-[2px] flex size-[40px] shrink-0 items-center justify-center rounded-full bg-fig-blue/[0.12] text-[15px] font-semibold text-fig-blue"
          >
            {specialist.initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] leading-normal text-fig-600">
              {specialist.name} · {specialist.role}
            </p>
            <div className="mt-[6px] rounded-[14px] rounded-tl-[4px] bg-white px-[14px] py-[12px]">
              <p className="text-[14px] leading-[20px] text-fig-900">
                {openingMessage}
              </p>
            </div>
          </div>
        </div>

        <p className="text-[13px] leading-[18px] text-fig-600">
          You don&apos;t need to explain what happened. Reply only if you want to
          add something.
        </p>
      </div>
    </BottomSheet>
  );
}
