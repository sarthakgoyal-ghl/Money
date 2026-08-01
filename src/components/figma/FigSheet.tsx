import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  IOS_SHEET_STACK,
  iosSheetFade,
  iosSheetTransition,
  springSoft,
} from "../../motion/tokens";
import { useUnderlayRecessed } from "../shared/SheetStackContext";
import { ChevronDownIcon, ChevronUpIcon, CircularIconButton, XCloseIcon } from "./chrome";

const SHEET_PRESENT_MS = IOS_SHEET_STACK.duration * 1000 + 40;

/**
 * Sheet heights from the Figma map-backed frames.
 *
 * `partial` — collapsed map-readable height.
 * `expanded` — mid height for lighter overlays.
 * `tall` — boarding-pass style (~90%).
 * `full` — modal sheets `1204:80934` / `1204:81405` at 820 / 874 with a map sliver above.
 */
export type FigSheetHeight = "partial" | "expanded" | "tall" | "full";

export const FIG_SHEET_FRACTIONS: Record<FigSheetHeight, number> = {
  partial: 0.62,
  expanded: 0.79,
  tall: 0.9,
  full: 820 / 874,
};

/**
 * Fill overlay hook — previously rendered Figma's color-dodge layers, which
 * resolved dark under CSS backdrop-filter. Kept as a no-op so call sites stay
 * stable; real glass lives on `.fig-sheet`.
 */
export function FigSheetFill() {
  return null;
}

interface FigSheetProps {
  /** Opening / controlled height. Collapse toggles to `partial` and back here. */
  height: FigSheetHeight;
  onHeightChange?: (height: FigSheetHeight) => void;
  /**
   * Height the chevron expands back to. Defaults to the sheet's opening
   * `height` (or `expanded` when that opening height is already `partial`).
   */
  expandHeight?: FigSheetHeight;
  /**
   * Show the right-side collapse / expand control. Defaults on — every modal
   * sheet shares the Review sheet behaviour unless explicitly opted out.
   */
  collapsible?: boolean;
  /** Shown centred at the top of the sheet. */
  title?: ReactNode;
  subtitle?: ReactNode;
  /**
   * Success seal (or similar). On boarding (`1204:81195`) this sits between
   * the close and chevron controls; elsewhere it stacks above the title.
   */
  hero?: ReactNode;
  /**
   * Where `hero` sits in chrome. `inline` = between X and chevron
   * (`1204:81204`); `stack` = above the title row.
   */
  heroPlacement?: "inline" | "stack";
  onClose?: () => void;
  children: ReactNode;
  /** Sticky footer, outside the scroll container. */
  footer?: ReactNode;
  /** Omit the drag handle where Figma doesn't show one. */
  showHandle?: boolean;
  /**
   * Dim scrim behind the sheet. Off by default — map-backed glass sheets
   * (Success / Rejected / Review / Handoff) read the map through frost, not a
   * black veil. Opt in only for true modal overlays.
   */
  showScrim?: boolean;
  /**
   * Top padding on the chrome column. Other options / Review use 6;
   * boarding pass uses 16 (`1204:81200`).
   */
  chromePadTop?: 6 | 16;
  /** Identifies the content; a change resets the scroll position. */
  contentKey?: string;
  /**
   * Force the iOS underlay recess (scale + lift). Defaults to the sheet-stack
   * context when an overlay BottomSheet is open.
   */
  recessed?: boolean;
  /**
   * Raise above peer Fig sheets (z-40) so this sheet can stack on a recessed
   * underlay — e.g. boarding pass over success summary.
   */
  elevated?: boolean;
  /**
   * iOS sheet-on-sheet presentation: slide up from the bottom with the same
   * curve as BottomSheet (Get help), plus a stack scrim. Parent should wrap
   * with AnimatePresence so exit can slide down. Keep this stable for the
   * whole overlay life — do not tie it to z-index / elevated.
   */
  stacked?: boolean;
  className?: string;
}

/**
 * The translucent bottom sheet from the Figma file.
 *
 * Glass is Apple-style frosted material on `.fig-sheet` — light translucent
 * plate, saturate + strong blur — so the map reads through without the muddy
 * color-dodge fill CSS cannot resolve.
 *
 * Scroll lives in the body only, so the sticky footer can never cover content,
 * and the position survives a height change: a user who scrolled to an option
 * and then expanded the sheet wants more of that option, not the top again.
 *
 * Height is controlled when `onHeightChange` is passed; otherwise the sheet
 * owns collapse / expand state internally so every modal gets the chevron.
 */
export function FigSheet({
  height: heightProp,
  onHeightChange,
  expandHeight,
  collapsible = true,
  title,
  subtitle,
  hero,
  heroPlacement = "stack",
  onClose,
  children,
  footer,
  showHandle = true,
  showScrim = false,
  chromePadTop = 6,
  contentKey,
  recessed: recessedProp,
  elevated = false,
  stacked = false,
  className = "",
}: FigSheetProps) {
  const reduced = useReducedMotion();
  const stackedRecessed = useUnderlayRecessed();
  const recessed = recessedProp ?? stackedRecessed;
  const sheetRef = useRef<HTMLElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const savedScroll = useRef(0);
  const titleId = useId();
  const controlled = typeof onHeightChange === "function";
  const [uncontrolledHeight, setUncontrolledHeight] = useState(heightProp);
  const openingHeight = useRef(heightProp);
  /** Freeze blur while recessing / presenting — backdrop-filter + transform stutters. */
  const [stackMotionActive, setStackMotionActive] = useState(false);
  const wasRecessed = useRef(recessed);

  useEffect(() => {
    if (!controlled) setUncontrolledHeight(heightProp);
    openingHeight.current = heightProp;
  }, [heightProp, controlled]);

  useEffect(() => {
    if (wasRecessed.current === recessed) return;
    wasRecessed.current = recessed;
    if (reduced) return;
    setStackMotionActive(true);
    const timer = window.setTimeout(() => setStackMotionActive(false), SHEET_PRESENT_MS);
    return () => window.clearTimeout(timer);
  }, [recessed, reduced]);

  // Match BottomSheet: freeze glass while the stacked sheet slides in.
  useEffect(() => {
    if (!stacked || reduced) return;
    setStackMotionActive(true);
    const timer = window.setTimeout(() => setStackMotionActive(false), SHEET_PRESENT_MS);
    return () => window.clearTimeout(timer);
  }, [stacked, reduced]);

  const height = controlled ? heightProp : uncontrolledHeight;
  // Collapse always lands on `partial`; expand returns to `full` unless a
  // sheet opts into a different target — same contract as Review / Other options.
  const expandTarget =
    expandHeight ??
    (openingHeight.current === "partial" ? "full" : openingHeight.current);
  const fraction = FIG_SHEET_FRACTIONS[height];

  // The sheet covers the bottom of the map, including the Mapbox credit that
  // Mapbox's terms require stay visible. Publishing the covered height lets the
  // credit ride above the sheet instead of hiding behind it.
  useEffect(() => {
    const el = sheetRef.current;
    if (!el) return;
    // Walk to the map shell — stacked presentation wraps the section in slide
    // layers, so parentElement is no longer the shell.
    const shell =
      el.closest<HTMLElement>("[data-map-shell]") ?? el.parentElement;
    if (!shell) return;
    shell.style.setProperty("--dock-height", `${Math.round(fraction * 100)}%`);
    return () => {
      shell.style.removeProperty("--dock-height");
    };
  }, [fraction]);

  useLayoutEffect(() => {
    savedScroll.current = 0;
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [contentKey]);

  useLayoutEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = savedScroll.current;
  }, [height]);

  const handleScroll = useCallback(() => {
    savedScroll.current = scrollRef.current?.scrollTop ?? 0;
  }, []);

  // Escape closes, matching the circular close control.
  useEffect(() => {
    if (!onClose) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const collapsed = height === "partial";
  const setHeight = useCallback(
    (next: FigSheetHeight) => {
      if (controlled) onHeightChange?.(next);
      else setUncontrolledHeight(next);
    },
    [controlled, onHeightChange],
  );
  const toggle = useCallback(
    () => setHeight(collapsed ? expandTarget : "partial"),
    [collapsed, expandTarget, setHeight],
  );

  const onGrabberDragEnd = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: { offset: { y: number }; velocity: { y: number } }) => {
      if (!collapsible) return;
      // Drag up expands; drag down collapses — same thresholds as AssistantDock.
      if (info.offset.y < -28 || info.velocity.y < -420) setHeight(expandTarget);
      else if (info.offset.y > 28 || info.velocity.y > 420) setHeight("partial");
    },
    [collapsible, expandTarget, setHeight],
  );

  const heightPct = `${fraction * 100}%`;
  const sheetTransition = reduced
    ? { duration: 0.001 }
    : {
        height: springSoft,
        scale: iosSheetTransition,
        y: iosSheetTransition,
        borderTopLeftRadius: iosSheetTransition,
        borderTopRightRadius: iosSheetTransition,
      };

  const chrome = (
    <>
      {/* Chrome: `80941` / `81412` / `81202` — pad top, grabber 48×4, gap 6.
          Drag stays on the grabber without inflating its height. */}
      {showHandle || hero || title || onClose || collapsible ? (
        <div
          className={[
            "relative z-[1] flex shrink-0 flex-col items-center gap-[6px] px-[16px] pb-[4px]",
            chromePadTop === 16 ? "pt-[16px]" : "pt-[6px]",
          ].join(" ")}
        >
          {showHandle ? (
            <motion.div
              className={[
                "flex w-full justify-center",
                collapsible ? "cursor-grab touch-none active:cursor-grabbing" : "",
              ].join(" ")}
              drag={collapsible ? "y" : false}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.08}
              dragMomentum={false}
              onDragEnd={onGrabberDragEnd}
            >
              <button
                type="button"
                onClick={collapsible ? toggle : undefined}
                disabled={!collapsible}
                aria-label={
                  collapsed
                    ? "Expand sheet. Drag or activate to resize."
                    : "Collapse sheet. Drag or activate to resize."
                }
                className="flex items-center justify-center focus-ring-fig-map"
              >
                {/* `1204:81413` — 48 × 4 glass grabber. */}
                <span
                  aria-hidden="true"
                  className="block h-[4px] w-[48px] rounded-[4px] bg-black/20 backdrop-blur-[14.5px]"
                />
              </button>
            </motion.div>
          ) : null}

          {hero && heroPlacement === "stack" ? (
            <div className="flex justify-center">{hero}</div>
          ) : null}

          {/* `1204:81202` / `81412` / `81355` — expand left, close right. */}
          {hero && heroPlacement === "inline" ? (
            <div className="flex w-full items-start justify-between">
              <CircularIconButton
                label={collapsed ? "Expand details" : "Collapse details"}
                onClick={collapsible ? toggle : undefined}
                hidden={!collapsible}
              >
                {collapsed ? <ChevronUpIcon /> : <ChevronDownIcon />}
              </CircularIconButton>
              <div className="flex shrink-0 items-center justify-center">{hero}</div>
              <CircularIconButton label="Close" onClick={onClose} hidden={!onClose}>
                <XCloseIcon />
              </CircularIconButton>
            </div>
          ) : null}

          {title || subtitle || (!(hero && heroPlacement === "inline") && (onClose || collapsible)) ? (
            <div
              className={[
                "flex w-full justify-between gap-[12px]",
                // Title-only rows center with the 44px controls; multi-line
                // titles with a subtitle stay top-aligned.
                subtitle ? "items-start" : "items-center",
              ].join(" ")}
            >
              {hero && heroPlacement === "inline" ? (
                <div aria-hidden="true" className="size-[44px] shrink-0" />
              ) : (
                <CircularIconButton
                  label={collapsed ? "Expand details" : "Collapse details"}
                  onClick={collapsible ? toggle : undefined}
                  hidden={!collapsible}
                >
                  {collapsed ? <ChevronUpIcon /> : <ChevronDownIcon />}
                </CircularIconButton>
              )}

              <div className="flex min-w-0 flex-1 flex-col items-center gap-[2px] px-[4px] text-center">
                {title ? (
                  <h2
                    id={titleId}
                    className="fig-title text-balance text-fig-900"
                  >
                    {title}
                  </h2>
                ) : null}
                {subtitle ? (
                  <p className="max-w-[280px] text-[13px] leading-[18px] text-fig-600">
                    {subtitle}
                  </p>
                ) : null}
              </div>

              {hero && heroPlacement === "inline" ? (
                <div aria-hidden="true" className="size-[44px] shrink-0" />
              ) : (
                <CircularIconButton label="Close" onClick={onClose} hidden={!onClose}>
                  <XCloseIcon />
                </CircularIconButton>
              )}
            </div>
          ) : null}
        </div>
      ) : null}

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="relative z-[1] no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-[16px] pt-[16px]"
      >
        {children}
      </div>

      {footer ? (
        <div className="relative z-[1] shrink-0 px-[16px] pb-[28px] pt-[12px]">
          {footer}
        </div>
      ) : (
        <div aria-hidden="true" className="relative z-[1] h-[28px] shrink-0" />
      )}
    </>
  );

  const sheetClass = [
    // `.fig-sheet` = Apple frosted glass over the map.
    // z-35 sits above map chrome (RouteHeader z-30) and below status /
    // home indicator (z-40), matching `1204:81405`. Elevated overlays
    // (boarding on success) match BottomSheet at z-40.
    elevated || stacked
      ? "fig-sheet absolute inset-x-0 bottom-0 z-40 flex flex-col overflow-hidden will-change-transform"
      : "fig-sheet absolute inset-x-0 bottom-0 z-[35] flex flex-col overflow-hidden will-change-transform",
    recessed ? "pointer-events-none" : "",
    stacked ? "shadow-[0_-8px_40px_rgba(0,0,0,0.18)]" : "",
    className,
  ].join(" ");

  const underlayVeil = (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-[3] rounded-[inherit] bg-black/20"
      initial={false}
      animate={{ opacity: recessed ? 1 : 0 }}
      transition={reduced ? { duration: 0.001 } : iosSheetFade}
    />
  );

  // Stacked presentation: outer slide matches BottomSheet; inner sheet owns
  // recess scale/lift so enter/exit and underlay push stay on one curve.
  if (stacked) {
    return (
      <motion.div
        className="absolute inset-0 z-40 pointer-events-auto"
        initial="closed"
        animate="open"
        exit="closed"
        variants={{
          open: {},
          closed: { transition: { when: "afterChildren" } },
        }}
      >
        <motion.div
          aria-hidden="true"
          className="absolute inset-0"
          style={{ background: IOS_SHEET_STACK.scrim }}
          variants={{
            open: { opacity: 1 },
            closed: { opacity: 0 },
          }}
          transition={reduced ? { duration: 0.001 } : iosSheetFade}
          onClick={onClose}
        />
        <motion.div
          className="absolute inset-x-0 bottom-0 will-change-transform"
          variants={{
            open: reduced ? { opacity: 1, y: 0 } : { y: 0 },
            closed: reduced ? { opacity: 0, y: 0 } : { y: "100%" },
          }}
          animate={{ height: heightPct }}
          transition={
            reduced
              ? { duration: 0.001 }
              : { y: iosSheetTransition, opacity: iosSheetFade, height: springSoft }
          }
        >
          <motion.section
            ref={sheetRef}
            aria-labelledby={title ? titleId : undefined}
            aria-label={title ? undefined : "Trip details"}
            aria-hidden={recessed || undefined}
            data-sheet-motion={stackMotionActive ? "active" : undefined}
            className={[
              "fig-sheet absolute inset-0 flex flex-col overflow-hidden will-change-transform",
              recessed ? "pointer-events-none" : "",
              "shadow-[0_-8px_40px_rgba(0,0,0,0.18)]",
              className,
            ].join(" ")}
            style={{ transformOrigin: "top center" }}
            initial={false}
            animate={{
              scale: recessed ? IOS_SHEET_STACK.underlayScale : 1,
              y: recessed ? IOS_SHEET_STACK.underlayLiftY : 0,
              borderTopLeftRadius: recessed
                ? IOS_SHEET_STACK.underlayRadiusPx
                : 24,
              borderTopRightRadius: recessed
                ? IOS_SHEET_STACK.underlayRadiusPx
                : 24,
            }}
            transition={sheetTransition}
          >
            {underlayVeil}
            {chrome}
          </motion.section>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <>
      {showScrim && !recessed ? (
        <div
          aria-hidden="true"
          className="absolute inset-0 z-[34] bg-black/16"
        />
      ) : null}

      <motion.section
        ref={sheetRef}
        aria-labelledby={title ? titleId : undefined}
        aria-label={title ? undefined : "Trip details"}
        aria-hidden={recessed || undefined}
        data-sheet-motion={stackMotionActive ? "active" : undefined}
        className={sheetClass}
        style={{ transformOrigin: "top center" }}
        initial={false}
        animate={{
          height: heightPct,
          // UISheetPresentationController stack: scale + lift + corner grow.
          scale: recessed ? IOS_SHEET_STACK.underlayScale : 1,
          y: recessed ? IOS_SHEET_STACK.underlayLiftY : 0,
          borderTopLeftRadius: recessed
            ? IOS_SHEET_STACK.underlayRadiusPx
            : 24,
          borderTopRightRadius: recessed
            ? IOS_SHEET_STACK.underlayRadiusPx
            : 24,
        }}
        transition={sheetTransition}
      >
        {underlayVeil}
        {chrome}
      </motion.section>
    </>
  );
}

interface FigCardProps {
  children: ReactNode;
  /** The pale-blue selected treatment. */
  selected?: boolean;
  className?: string;
}

/** A white card on the sheet. Radius 16, no border unless selected. */
export function FigCard({ children, selected = false, className = "" }: FigCardProps) {
  return (
    <div
      className={[
        "rounded-fig-card",
        selected
          ? "border border-fig-blue bg-[#f5f9ff]"
          : "border border-transparent bg-white",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

interface FigTileProps {
  label: string;
  value: string;
}

/** A 2-up metric tile: 13 px label over a 15 px semibold value. Radius 14. */
export function FigTile({ label, value }: FigTileProps) {
  return (
    <div className="flex flex-1 flex-col gap-[4px] rounded-fig-tile bg-white p-[12px]">
      <span className="text-[13px] leading-normal text-fig-600">{label}</span>
      <span className="fig-w-semibold text-[15px] leading-[15px] text-fig-900">
        {value}
      </span>
    </div>
  );
}

export type FigAlertTone = "success" | "info" | "warn" | "danger";

const ALERT: Record<FigAlertTone, { surface: string; border: string; text: string }> = {
  success: { surface: "bg-[#f6fef9]", border: "border-[#a6f4c5]", text: "text-[#039855]" },
  info: { surface: "bg-[#f5f8ff]", border: "border-[#b2ccff]", text: "text-[#0078ff]" },
  warn: { surface: "bg-fig-warn-50", border: "border-fig-warn-200", text: "text-fig-warn-600" },
  danger: {
    surface: "bg-fig-danger-50",
    border: "border-fig-danger-200",
    text: "text-fig-danger-600",
  },
};

interface FigAlertProps {
  tone: FigAlertTone;
  icon?: ReactNode;
  children: ReactNode;
}

/**
 * The bordered semantic message block. Radius 14, 13 px padding, 14/20 text.
 *
 * Tone is carried by an icon as well as colour, so the meaning survives being
 * read in greyscale.
 */
export function FigAlert({ tone, icon, children }: FigAlertProps) {
  const style = ALERT[tone];
  return (
    <div
      className={[
        "flex w-full items-start gap-[8px] rounded-[14px] border p-[13px]",
        "backdrop-blur-[9px] drop-shadow-[0px_6px_8px_rgba(16,24,40,0.05)]",
        style.surface,
        style.border,
      ].join(" ")}
    >
      {icon ? (
        <span aria-hidden="true" className={`mt-[2px] shrink-0 ${style.text}`}>
          {icon}
        </span>
      ) : null}
      <p className={`flex-1 text-[14px] leading-[20px] ${style.text}`}>{children}</p>
    </div>
  );
}
