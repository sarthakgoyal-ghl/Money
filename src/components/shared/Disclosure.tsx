import { useId, useState } from "react";
import type { ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { ease } from "../../motion/tokens";

interface DisclosureProps {
  label: string;
  children: ReactNode;
  /** Right-aligned summary shown while collapsed, e.g. a total. */
  summary?: ReactNode;
  defaultOpen?: boolean;
  tone?: "plain" | "card";
}

/**
 * Progressive disclosure for secondary detail — fare conditions, fee
 * breakdowns, activity trails. Content is in the DOM only when expanded, and
 * nothing critical is ever hidden behind one.
 */
export function Disclosure({
  label,
  children,
  summary,
  defaultOpen = false,
  tone = "plain",
}: DisclosureProps) {
  const [open, setOpen] = useState(defaultOpen);
  const reduced = useReducedMotion();
  const contentId = useId();

  return (
    <div
      className={
        tone === "card"
          ? "overflow-hidden rounded-2xl border border-ink-100 bg-white"
          : ""
      }
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={contentId}
        onClick={() => setOpen((value) => !value)}
        className={[
          "flex w-full min-h-[44px] items-center justify-between gap-3 rounded-xl text-left focus-ring",
          tone === "card" ? "px-4 py-3" : "py-2",
        ].join(" ")}
      >
        <span className="text-[13.5px] font-medium text-ink-800">{label}</span>
        <span className="flex items-center gap-2">
          {summary && !open ? (
            <span className="text-[13px] tabular text-ink-500">{summary}</span>
          ) : null}
          <ChevronDown
            size={16}
            strokeWidth={2.25}
            aria-hidden="true"
            className={[
              "text-ink-500 transition-transform duration-200",
              open ? "rotate-180" : "",
            ].join(" ")}
          />
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            id={contentId}
            initial={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={
              reduced ? { opacity: 1 } : { height: "auto", opacity: 1 }
            }
            exit={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: reduced ? 0.001 : 0.24, ease: [...ease] }}
            className="overflow-hidden"
          >
            <div className={tone === "card" ? "px-4 pb-4" : "pb-2"}>
              {children}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
