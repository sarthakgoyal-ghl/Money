import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant =
  | "primary"
  | "secondary"
  | "tertiary"
  | "destructive"
  /** Filled button on the dark travel canvas. */
  | "onDark"
  /** Low-emphasis button on the dark travel canvas. */
  | "ghostOnDark";

type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  fullWidth?: boolean;
}

const base =
  "inline-flex items-center justify-center gap-2 font-medium select-none transition-[background-color,border-color,opacity] duration-[120ms] disabled:cursor-not-allowed";

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-ink-900 text-white border border-ink-900 hover:bg-ink-800 active:bg-ink-800 disabled:bg-ink-100 disabled:border-ink-100 disabled:text-ink-500 focus-ring",
  secondary:
    "bg-white text-ink-900 border border-ink-200 hover:bg-ink-50 active:bg-ink-100 disabled:opacity-50 focus-ring",
  tertiary:
    "bg-transparent text-ink-700 border border-transparent hover:bg-ink-50 active:bg-ink-100 disabled:opacity-50 focus-ring",
  destructive:
    "bg-white text-danger border border-danger/30 hover:bg-danger-50 active:bg-danger-50 disabled:opacity-50 focus-ring",
  onDark:
    "bg-white text-ink-900 border border-white hover:bg-white/90 active:bg-white/85 disabled:opacity-45 focus-ring-dark",
  ghostOnDark:
    "bg-white/10 text-white border border-white/20 hover:bg-white/16 active:bg-white/20 disabled:opacity-45 focus-ring-dark",
};

const sizeStyles: Record<Size, string> = {
  sm: "text-[13px] leading-none h-11 px-3.5 rounded-xl min-w-[44px]",
  md: "text-[14px] leading-none h-11 px-4 rounded-xl2 min-w-[44px]",
  lg: "text-[15px] leading-none h-[52px] px-5 rounded-xl2 min-w-[44px]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      leadingIcon,
      trailingIcon,
      fullWidth,
      className = "",
      children,
      type = "button",
      ...rest
    },
    ref,
  ) => {
    const classes = [
      base,
      variantStyles[variant],
      sizeStyles[size],
      fullWidth ? "w-full" : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <button ref={ref} type={type} className={classes} {...rest}>
        {leadingIcon ? (
          <span className="shrink-0" aria-hidden="true">
            {leadingIcon}
          </span>
        ) : null}
        <span className="truncate">{children}</span>
        {trailingIcon ? (
          <span className="shrink-0" aria-hidden="true">
            {trailingIcon}
          </span>
        ) : null}
      </button>
    );
  },
);
Button.displayName = "Button";
