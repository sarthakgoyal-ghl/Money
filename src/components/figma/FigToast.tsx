import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, Check, X } from "lucide-react";
import type { ReactNode } from "react";
import { ease } from "../../motion/tokens";

export type ToastTone = "success" | "warning" | "error";

export interface ToastMessage {
  message: string;
  tone: ToastTone;
}

interface FigToastProps {
  toast: ToastMessage | null;
}

const TONE: Record<
  ToastTone,
  {
    surface: string;
    border: string;
    ink: string;
    iconWrap: string;
    icon: ReactNode;
    live: "polite" | "assertive";
  }
> = {
  success: {
    surface: "bg-fig-ok-50",
    border: "border-fig-ok-200",
    ink: "text-fig-ok-600",
    iconWrap: "bg-fig-ok-500 text-white",
    icon: <Check size={12} strokeWidth={2.75} />,
    live: "polite",
  },
  warning: {
    surface: "bg-fig-warn-50",
    border: "border-fig-warn-200",
    ink: "text-fig-warn-600",
    iconWrap: "bg-warn text-white",
    icon: <AlertTriangle size={12} strokeWidth={2.5} />,
    live: "polite",
  },
  error: {
    surface: "bg-fig-danger-50",
    border: "border-fig-danger-200",
    ink: "text-fig-danger-600",
    iconWrap: "bg-danger text-white",
    icon: <X size={12} strokeWidth={2.75} />,
    live: "assertive",
  },
};

/**
 * Semantic toast — opaque tinted plate so it stays readable over map glass
 * and sheet chrome. Anchored under the 54 px status bar.
 */
export function FigToast({ toast }: FigToastProps) {
  const reduced = useReducedMotion();
  const tone = toast ? TONE[toast.tone] : null;

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-[80]">
      <AnimatePresence>
        {toast && tone ? (
          <motion.div
            key={`${toast.tone}:${toast.message}`}
            role="status"
            aria-live={tone.live}
            initial={
              reduced ? { opacity: 0 } : { opacity: 0, y: -12, scale: 0.98 }
            }
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={
              reduced ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.98 }
            }
            transition={{ duration: reduced ? 0.001 : 0.28, ease: [...ease] }}
            className="flex justify-center px-[16px] pt-[62px]"
          >
            <div
              className={[
                "flex w-full max-w-[340px] items-start gap-[10px]",
                "rounded-[16px] border px-[14px] py-[12px]",
                "shadow-[0_8px_28px_rgba(0,0,0,0.18)]",
                tone.surface,
                tone.border,
              ].join(" ")}
            >
              <span
                aria-hidden="true"
                className={[
                  "mt-[1px] flex size-[20px] shrink-0 items-center justify-center rounded-full",
                  tone.iconWrap,
                ].join(" ")}
              >
                {tone.icon}
              </span>
              <p
                className={[
                  "min-w-0 flex-1 font-sans text-[13px] font-medium leading-[18px] tracking-[-0.15px]",
                  tone.ink,
                ].join(" ")}
              >
                {toast.message}
              </p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
