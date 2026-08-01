import type { ReactNode } from "react";

interface FigDisclosureProps {
  id: string;
  label: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}

/**
 * Sheet accordion — Figma Other options `1204:81091`.
 *
 * White 14 px plate, 13 px medium label, 16 px chevron-down that rotates when
 * open. Body sits under a hairline with 12 px padding.
 */
export function FigDisclosure({
  id,
  label,
  open,
  onToggle,
  children,
}: FigDisclosureProps) {
  return (
    <div className="w-full rounded-[14px] bg-white">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-[12px] p-[12px] text-left focus-ring-fig"
      >
        <span className="fig-w-medium text-[13px] leading-normal text-fig-900">
          {label}
        </span>
        <span
          aria-hidden="true"
          className={[
            "relative flex size-[16px] shrink-0 items-center justify-center overflow-hidden transition-transform",
            open ? "rotate-180" : "",
          ].join(" ")}
        >
          <span className="absolute block" style={{ inset: "33.33% 20.83%" }}>
            <img
              src="/figma/assets/disclosure-chevron.svg"
              alt=""
              className="absolute inset-0 block h-full w-full max-w-none"
            />
          </span>
        </span>
      </button>
      {open ? (
        <div
          id={id}
          className="border-t border-fig-line px-[12px] py-[12px] text-[14px] leading-[20px] text-fig-600"
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
