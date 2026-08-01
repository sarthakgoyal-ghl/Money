import { useId, useState } from "react";
import type { ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { ease } from "../../motion/tokens";
import { nightCard, nightEyebrow } from "./night";

interface DockSectionProps {
  /** Small uppercase label above the content. */
  eyebrow?: string;
  children: ReactNode;
  className?: string;
}

/** A labelled block inside the dock. Spacing, not a border, separates sections. */
export function DockSection({ eyebrow, children, className = "" }: DockSectionProps) {
  const headingId = useId();
  if (!eyebrow) return <section className={className}>{children}</section>;

  return (
    <section aria-labelledby={headingId} className={className}>
      <h2 id={headingId} className={nightEyebrow}>
        {eyebrow}
      </h2>
      <div className="mt-2">{children}</div>
    </section>
  );
}

interface DockCardProps {
  children: ReactNode;
  /** Applies the lit treatment used for the current selection. */
  lit?: boolean;
  className?: string;
}

/**
 * A card on the dock.
 *
 * Used sparingly: a card means "this is a distinct object" — a flight, a
 * transaction, a case. Ordinary content sits directly on the dock, which is what
 * keeps the panel from becoming the vertical stack of boxes this redesign exists
 * to replace.
 */
export function DockCard({ children, lit = false, className = "" }: DockCardProps) {
  return (
    <div
      className={[
        lit
          ? "rounded-2xl border border-route-cyan/40 bg-route-cyan/[0.10]"
          : nightCard,
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

interface DockDisclosureProps {
  label: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

/**
 * Progressive disclosure on night.
 *
 * Detail that a careful user will want and a hurried one should not have to
 * scroll past — fare conditions, exactly-what-changed, comparison tables.
 */
export function DockDisclosure({
  label,
  children,
  defaultOpen = false,
}: DockDisclosureProps) {
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={panelId}
        className="-mx-2 flex min-h-[44px] w-full items-center justify-between gap-3 rounded-xl px-2 text-left text-[13px] font-medium text-white/82 hover:bg-white/[0.06] focus-ring-dark"
      >
        {label}
        <motion.span
          aria-hidden="true"
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: reduced ? 0.001 : 0.2, ease: [...ease] }}
          className="shrink-0 text-white/58"
        >
          <ChevronDown size={15} strokeWidth={2.25} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            id={panelId}
            key="panel"
            initial={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={reduced ? { opacity: 1 } : { height: "auto", opacity: 1 }}
            exit={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: reduced ? 0.001 : 0.26, ease: [...ease] }}
            className="overflow-hidden"
          >
            <div className="pb-1 pt-1.5">{children}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

interface DockNoteProps {
  icon?: ReactNode;
  tone?: "neutral" | "ok" | "warn";
  children: ReactNode;
}

/** A short aside — a safety statement, a caveat, a simulation disclaimer. */
export function DockNote({ icon, tone = "neutral", children }: DockNoteProps) {
  const toneClass =
    tone === "ok"
      ? "text-signal-ok"
      : tone === "warn"
        ? "text-signal-warn"
        : "text-white/58";

  return (
    <p className="flex items-start gap-2 text-[12.5px] leading-snug text-white/68">
      {icon ? (
        <span aria-hidden="true" className={`mt-[2px] shrink-0 ${toneClass}`}>
          {icon}
        </span>
      ) : null}
      <span>{children}</span>
    </p>
  );
}
