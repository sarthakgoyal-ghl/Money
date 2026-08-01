import type { CaseContextEntry } from "../../data/caseContext";
import { supportCase } from "../../data/scenario";
import { CautionText } from "../figma/FigButton";
import { FigCard } from "../figma/FigSheet";
import { BottomSheet } from "../shared/BottomSheet";

interface CaseDetailsSheetProps {
  open: boolean;
  onClose: () => void;
  entries: CaseContextEntry[];
}

/**
 * Everything the specialist already has, shown to the user verbatim.
 *
 * Chrome + cards follow the Fig sheet language. Case id sits in the subtitle
 * slot (replacing the old uppercase eyebrow).
 */
export function CaseDetailsSheet({ open, onClose, entries }: CaseDetailsSheetProps) {
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="What the specialist has"
      subtitle={`Case ${supportCase.id}`}
      size="tall"
      stacked
    >
      <div className="flex flex-col gap-[16px] pb-[8px]">
        <FigCard className="flex flex-col gap-[12px] rounded-[14px] p-[12px]">
          <dl className="flex flex-col gap-[12px]">
            {entries.map((entry, index) => (
              <div key={entry.label} className="flex flex-col gap-[12px]">
                {index > 0 ? (
                  <div aria-hidden="true" className="h-px w-full bg-fig-line" />
                ) : null}
                {entry.block ? (
                  <div className="flex flex-col gap-[4px]">
                    <dt className="text-[13px] leading-normal text-fig-600">{entry.label}</dt>
                    <dd className="text-[15px] leading-[20px] text-fig-900">{entry.value}</dd>
                  </div>
                ) : (
                  <div className="flex items-baseline justify-between gap-[12px]">
                    <dt className="text-[15px] leading-normal text-fig-600">{entry.label}</dt>
                    <dd className="shrink-0 text-right text-[15px] font-medium tabular leading-normal text-fig-900">
                      {entry.value}
                    </dd>
                  </div>
                )}
              </div>
            ))}
          </dl>
        </FigCard>

        <CautionText>
          Simulated case packet. Nothing is sent to a live airline desk.
        </CautionText>
      </div>
    </BottomSheet>
  );
}
