import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  AnimatePresence,
  motion,
  useDragControls,
  useReducedMotion,
} from "framer-motion";
import {
  duration,
  ease,
  iosSheetFade,
  iosSheetTransition,
  IOS_SHEET_STACK,
  spring,
} from "../../motion/tokens";
import { CircularIconButton, XCloseIcon } from "../figma/chrome";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /**
   * @deprecated Prefer `subtitle` for secondary chrome (case id, wait copy).
   * Eyebrow competes with the title and breaks Fig sheet hierarchy.
   */
  eyebrow?: string;
  subtitle?: ReactNode;
  children: ReactNode;
  /** Sticky action area, outside the scroll container. */
  footer?: ReactNode;
  size?: "auto" | "outcome" | "tall" | "full";
  /** Extra node beside the title, e.g. Trip Pulse. */
  adornment?: ReactNode;
  /**
   * Dim map behind the sheet. Defaults off — same as map-backed Fig sheets —
   * so glass reads the route instead of a muddy black wash.
   */
  showScrim?: boolean;
  /**
   * iOS sheet-on-sheet: dark scrim + top inset so the recessed under sheet
   * peeks above this one. Use when opening over another sheet.
   */
  stacked?: boolean;
}

/**
 * Sheet heights.
 *
 * `full` is the confirmation review — the one moment the product takes over the
 * screen, because the decision it is asking for is the hard-to-reverse one.
 * `outcome` is deliberately shorter: the map showing a completed route is part
 * of the reward, so success does not hide it.
 */
const HEIGHTS: Record<NonNullable<BottomSheetProps["size"]>, string> = {
  auto: "max-h-[88%]",
  outcome: "h-[66%]",
  tall: "h-[84%]",
  full: "h-[93%]",
};

/** Drag-down distance / velocity that dismisses the sheet. */
const DISMISS_OFFSET_Y = 88;
const DISMISS_VELOCITY_Y = 720;

/**
 * Elevated content sheet over the travel canvas.
 *
 * Matches `FigSheet` material: light Apple frosted glass. Optional
 * `bg-black/16` scrim (off by default). `stacked` uses a darker scrim and a
 * top inset so a recessed under-sheet can peek — iOS sheet stack. Focus is
 * trapped while open and restored to the invoking control on close.
 */
export function BottomSheet({
  open,
  onClose,
  title,
  eyebrow,
  subtitle,
  children,
  footer,
  size = "auto",
  adornment,
  showScrim = false,
  stacked = false,
}: BottomSheetProps) {
  const reduced = useReducedMotion();
  const sheetRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const dragControls = useDragControls();
  const dimBehind = stacked || showScrim;
  /** Freeze blur while the stacked sheet is traveling — blur+transform stutters. */
  const [sheetMotionActive, setSheetMotionActive] = useState(false);
  const prevOpen = useRef(open);

  const onGrabberDragEnd = useCallback(
    (
      _event: MouseEvent | TouchEvent | PointerEvent,
      info: { offset: { y: number }; velocity: { y: number } },
    ) => {
      if (info.offset.y > DISMISS_OFFSET_Y || info.velocity.y > DISMISS_VELOCITY_Y) {
        onClose();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!stacked || reduced) {
      setSheetMotionActive(false);
      prevOpen.current = open;
      return;
    }
    if (prevOpen.current === open) return;
    prevOpen.current = open;
    if (open) setSheetMotionActive(true);
    const timer = window.setTimeout(
      () => setSheetMotionActive(false),
      IOS_SHEET_STACK.duration * 1000 + 40,
    );
    return () => window.clearTimeout(timer);
  }, [open, stacked, reduced]);

  useEffect(() => {
    if (!open) return;

    previouslyFocused.current =
      typeof document !== "undefined"
        ? (document.activeElement as HTMLElement | null)
        : null;

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !sheetRef.current) return;

      const focusables = Array.from(
        sheetRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.offsetParent !== null);

      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKey);

    // Focus the dialog container rather than its first control. Landing focus
    // on the close button paints a stray ring, and landing it on the primary
    // action would put a payment one Enter keypress away from an accidental tap.
    // An explicit `data-autofocus` element still wins if a sheet asks for one.
    const raf = requestAnimationFrame(() => {
      const requested = sheetRef.current?.querySelector<HTMLElement>(
        '[data-autofocus="true"]',
      );
      (requested ?? sheetRef.current)?.focus();
    });

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKey);
      cancelAnimationFrame(raf);
      document.body.style.overflow = originalOverflow;
      previouslyFocused.current?.focus?.();
    };
  }, [open, onClose]);

  const sheetMotion = reduced
    ? { duration: 0.001 }
    : stacked
      ? iosSheetTransition
      : { ...spring, restDelta: 0.5 };

  const scrimMotion = reduced
    ? { duration: 0.001 }
    : stacked
      ? iosSheetFade
      : { duration: 0.22, ease: [...ease] };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="bottom-sheet-layer"
          className="absolute inset-0 z-40 pointer-events-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          initial="closed"
          animate="open"
          exit="closed"
          variants={{
            open: {},
            // Keep the layer mounted until the sheet finishes sliding out.
            closed: {
              transition: { when: "afterChildren" },
            },
          }}
        >
          {dimBehind ? (
            <motion.div
              className="absolute inset-0"
              style={{
                background: stacked
                  ? IOS_SHEET_STACK.scrim
                  : "rgba(0, 0, 0, 0.16)",
              }}
              variants={{
                open: { opacity: 1 },
                closed: { opacity: 0 },
              }}
              transition={scrimMotion}
              onClick={onClose}
            />
          ) : (
            <button
              type="button"
              aria-label="Dismiss sheet"
              className="absolute inset-0 cursor-default bg-transparent"
              onClick={onClose}
            />
          )}

          <motion.div
            ref={sheetRef}
            tabIndex={-1}
            data-sheet-motion={
              stacked && sheetMotionActive ? "active" : undefined
            }
            className={[
              // Same Apple frosted glass as FigSheet — not solid white / night.
              "fig-sheet absolute inset-x-0 bottom-0 flex w-full flex-col overflow-hidden rounded-t-[24px] outline-none",
              stacked && sheetMotionActive ? "will-change-transform" : "",
              // Stacked sheets cast a soft elevation shadow like UIKit cards.
              stacked
                ? "shadow-[0_-8px_40px_rgba(0,0,0,0.18)]"
                : "",
              HEIGHTS[size],
            ].join(" ")}
            variants={{
              open: reduced
                ? { opacity: 1, y: 0 }
                : { y: 0 },
              closed: reduced
                ? { opacity: 0, y: 0 }
                : { y: "100%" },
            }}
            transition={sheetMotion}
            onAnimationComplete={(definition) => {
              if (stacked && !reduced && definition === "open") {
                setSheetMotionActive(false);
              }
            }}
            drag={reduced ? false : "y"}
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.04, bottom: 0.55 }}
            dragMomentum={false}
            onDragEnd={onGrabberDragEnd}
          >
            {/* Match FigSheet chrome: pt 6 → grabber → gap 6 → title row. */}
            <div className="relative z-[1] flex shrink-0 flex-col items-center gap-[6px] px-[16px] pt-[6px]">
              <div
                className="flex w-full cursor-grab touch-none justify-center active:cursor-grabbing"
                onPointerDown={(event) => {
                  if (reduced) return;
                  dragControls.start(event);
                }}
              >
                <button
                  type="button"
                  aria-label="Dismiss sheet. Drag down to close."
                  onClick={onClose}
                  className="flex items-center justify-center focus-ring-fig-map"
                >
                  {/* Same 48×4 glass grabber as FigSheet `1204:81413`. */}
                  <span
                    aria-hidden="true"
                    className="block h-[4px] w-[48px] rounded-[4px] bg-black/20 backdrop-blur-[14.5px]"
                  />
                </button>
              </div>

              {/* Close on the right — same as FigSheet `81412` / `81355`. */}
              <div
                className={[
                  "flex w-full justify-between gap-[12px]",
                  // Title-only (Payment method) centers with the 44px close;
                  // subtitle / eyebrow rows stay top-aligned.
                  subtitle || eyebrow ? "items-start" : "items-center",
                ].join(" ")}
              >
                {adornment ? (
                  <span
                    className={[
                      "flex size-[44px] shrink-0 justify-center",
                      subtitle || eyebrow ? "items-start" : "items-center",
                    ].join(" ")}
                  >
                    {adornment}
                  </span>
                ) : (
                  <span className="size-[44px] shrink-0" aria-hidden="true" />
                )}

                <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-[2px] px-[4px] text-center">
                  {eyebrow ? (
                    <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-fig-600">
                      {eyebrow}
                    </div>
                  ) : null}
                  <h2 id={titleId} className="fig-title w-full text-balance text-center text-fig-900">
                    {title}
                  </h2>
                  {subtitle ? (
                    <p className="max-w-[280px] text-center text-[13px] leading-[18px] text-fig-600">
                      {subtitle}
                    </p>
                  ) : null}
                </div>

                <CircularIconButton label="Close" onClick={onClose}>
                  <XCloseIcon />
                </CircularIconButton>
              </div>
            </div>

            <div
              className={[
                "relative z-[1] no-scrollbar min-h-0 overflow-y-auto overscroll-contain px-[16px] pt-[16px]",
                // Fixed heights grow the body; `auto` must hug content so the
                // footer sits 16 px under the last row — not at the sheet floor.
                size === "auto" ? "shrink-0" : "flex-1",
                footer ? "pb-0" : "pb-[16px]",
              ].join(" ")}
            >
              {children}
            </div>

            {footer ? (
              <motion.div
                initial={
                  reduced || stacked ? { opacity: 1 } : { opacity: 0, y: 10 }
                }
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: reduced || stacked ? 0.001 : duration.sheet,
                  delay: reduced || stacked ? 0 : 0.14,
                  ease: [...ease],
                }}
                className="relative z-[1] shrink-0 px-[16px] pb-[28px] pt-[16px]"
              >
                {footer}
              </motion.div>
            ) : (
              <div aria-hidden="true" className="relative z-[1] h-[28px] shrink-0" />
            )}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
