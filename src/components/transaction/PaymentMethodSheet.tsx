import { useEffect, useState } from "react";
import { CreditCard, Plus } from "lucide-react";
import { paymentMethods } from "../../data/scenario";
import { FigButton } from "../figma/FigButton";
import {
  FigSelectionCheck,
  figSelectableRowClass,
} from "../figma/FigSelectionCheck";
import { BottomSheet } from "../shared/BottomSheet";

interface PaymentMethodSheetProps {
  open: boolean;
  onClose: () => void;
  selectedId: string;
  onSelect: (id: string) => void;
}

/**
 * Simulated payment methods.
 *
 * Choosing a card is selection only — Continue commits it. That matches Other
 * options / Misread: a list pick is not the irreversible step. The caller still
 * clears approval when the method changes, so the user re-approves on Review.
 * "Add a card" stays explicitly out of prototype scope.
 */
export function PaymentMethodSheet({
  open,
  onClose,
  selectedId,
  onSelect,
}: PaymentMethodSheetProps) {
  const [draftId, setDraftId] = useState(selectedId);

  useEffect(() => {
    if (open) setDraftId(selectedId);
  }, [open, selectedId]);

  const draft = paymentMethods.find((method) => method.id === draftId);
  const canContinue = Boolean(draft?.available);

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Payment method"
      stacked
      footer={
        <FigButton
          variant="primary"
          fullWidth
          compact
          disabled={!canContinue}
          onClick={() => {
            if (!draft) return;
            onSelect(draft.id);
            onClose();
          }}
        >
          Continue
        </FigButton>
      }
    >
      <div role="radiogroup" aria-label="Payment method" className="flex flex-col gap-[6px]">
        {paymentMethods.map((method) => {
          const selected = method.id === draftId;
          return (
            <button
              key={method.id}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={!method.available}
              onClick={() => setDraftId(method.id)}
              className={figSelectableRowClass(
                selected,
                !method.available && "opacity-50",
              )}
            >
              <span
                aria-hidden="true"
                className={[
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]",
                  selected
                    ? "bg-fig-blue/[0.12] text-fig-blue"
                    : "bg-fig-blue/[0.08] text-fig-600",
                ].join(" ")}
              >
                <CreditCard size={16} strokeWidth={2.25} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14.5px] font-medium tabular text-fig-900">
                  {method.label}
                </span>
                <span className="block text-[12px] text-fig-600">
                  Simulated card · no real charge
                </span>
              </span>
              <FigSelectionCheck selected={selected} />
            </button>
          );
        })}

        <div className="flex min-h-[56px] items-center gap-3 rounded-fig-tile border border-transparent bg-white/55 p-3.5">
          <span
            aria-hidden="true"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-fig-blue/[0.06] text-fig-400"
          >
            <Plus size={16} strokeWidth={2.25} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[14.5px] font-medium text-fig-600">
              Add a payment method
            </span>
            <span className="block text-[12px] text-fig-600">
              Outside the scope of this prototype
            </span>
          </span>
        </div>
      </div>
    </BottomSheet>
  );
}
