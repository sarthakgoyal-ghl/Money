import { Check } from "lucide-react";

interface FigSelectionCheckProps {
  selected: boolean;
}

/**
 * Selected-state mark for radio rows (Payment method, Misread, list picks).
 * 20 px circle; filled blue + check when selected, empty ring otherwise.
 */
export function FigSelectionCheck({ selected }: FigSelectionCheckProps) {
  return (
    <span
      aria-hidden="true"
      className={[
        "flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-full border",
        selected
          ? "border-fig-blue bg-fig-blue text-white"
          : "border-fig-line bg-white",
      ].join(" ")}
    >
      {selected ? <Check size={12} strokeWidth={3} /> : null}
    </span>
  );
}

/**
 * Shared selectable-row surface — Payment method is the source of truth.
 * Selected: blue border + `#f5f9ff`. Idle: white, no hover wash.
 */
export function figSelectableRowClass(
  selected: boolean,
  ...extras: Array<string | false | null | undefined>
): string {
  return [
    "flex w-full min-h-[56px] items-center gap-3 rounded-fig-tile p-3.5 text-left focus-ring-fig",
    selected
      ? "border border-fig-blue bg-[#f5f9ff]"
      : "border border-transparent bg-white",
    ...extras,
  ]
    .filter(Boolean)
    .join(" ");
}
