import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

/**
 * Buttons as specified in the Figma file.
 *
 * `primary`   — `#08f` fill, white Inter Semibold 16/24, radius 14
 * `footer`    — `#0078ff` fill, radius 12, Shadow/xs (the sticky CTA)
 * `soft`      — `rgba(0,136,255,0.08)` fill, `#08f` label, radius 14
 * `outline`   — white fill, 1 px `#e9e9eb`, `#08f` label, radius 14
 * `quiet`     — transparent, `#475467` label
 *
 * All variants keep a 44 px minimum height even though Figma's padding computes
 * to 40 px, because these are the primary touch targets in a payment flow.
 */
type FigVariant = "primary" | "footer" | "soft" | "outline" | "quiet";

interface FigButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: FigVariant;
  leadingIcon?: ReactNode;
  fullWidth?: boolean;
  /** Figma's 40 px rows; use where the design genuinely shows a shorter button. */
  compact?: boolean;
}

const VARIANTS: Record<FigVariant, string> = {
  primary:
    "bg-fig-blue border border-fig-blue text-white hover:bg-[#0079e6] active:bg-[#0071d6] disabled:bg-fig-400 disabled:border-fig-400 rounded-fig-tile",
  footer:
    "bg-fig-blue-ios border border-fig-blue-ios text-white shadow-fig-xs hover:bg-[#006ae6] active:bg-[#0062d6] disabled:bg-fig-400 disabled:border-fig-400 rounded-fig-cta",
  soft:
    "bg-fig-blue/[0.08] text-fig-blue hover:bg-fig-blue/[0.14] active:bg-fig-blue/[0.18] disabled:opacity-50 rounded-fig-tile",
  outline:
    "bg-white border border-fig-line text-fig-blue hover:bg-fig-blue/[0.04] active:bg-fig-blue/[0.08] disabled:opacity-50 rounded-fig-tile",
  quiet:
    "bg-transparent text-fig-600 hover:bg-fig-900/[0.04] active:bg-fig-900/[0.06] disabled:opacity-50 rounded-fig-tile",
};

export const FigButton = forwardRef<HTMLButtonElement, FigButtonProps>(
  (
    {
      variant = "primary",
      leadingIcon,
      fullWidth = false,
      compact = false,
      className = "",
      children,
      type = "button",
      ...rest
    },
    ref,
  ) => (
    <button
      ref={ref}
      type={type}
      className={[
        "inline-flex select-none items-center justify-center gap-[8px] overflow-hidden px-[14px]",
        "font-ui text-[16px] font-semibold leading-[24px] tracking-normal",
        "transition-colors duration-[120ms] disabled:cursor-not-allowed",
        compact ? "min-h-[40px] py-[8px]" : "min-h-[44px] py-[8px]",
        VARIANTS[variant],
        fullWidth ? "w-full" : "",
        "focus-ring-fig",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {leadingIcon ? (
        <span aria-hidden="true" className="flex h-[20px] w-[20px] shrink-0 items-center justify-center">
          {leadingIcon}
        </span>
      ) : null}
      <span className="truncate">{children}</span>
    </button>
  ),
);
FigButton.displayName = "FigButton";

interface SafetyNoteProps {
  children: ReactNode;
}

/**
 * The "AI 621 stays booked until you approve." line under a primary action.
 *
 * Inter Light 10 px `#666` with a 10 px shield-tick. Small by design — it is
 * reassurance, not an instruction — but it is real text, never baked into the
 * button image.
 */
export function SafetyNote({ children }: SafetyNoteProps) {
  return (
    <p className="flex items-center justify-center gap-[2.5px] text-center font-ui text-[10px] font-light leading-normal text-fig-note">
      <span aria-hidden="true" className="shrink-0">
        <ShieldTick />
      </span>
      {children}
    </p>
  );
}

function ShieldTick() {
  return (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
      <path
        d="M6 11S10 9 10 6V2.5L6 1 2 2.5V6c0 3 4 5 4 5Z"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <path
        d="M4.4 6.1 5.5 7.2l2.2-2.3"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface CautionTextProps {
  children: ReactNode;
}

/** The centred simulated-fares disclaimer. SF Pro 13/15 `#909093`. */
export function CautionText({ children }: CautionTextProps) {
  return (
    <p className="text-center text-[13px] leading-[15px] tracking-[0.05px] text-fig-tertiary">
      {children}
    </p>
  );
}
