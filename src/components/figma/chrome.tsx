import { useEffect, useState, type ReactNode } from "react";
import { DemoStateMenu } from "../shared/DemoStateMenu";
import { StatusBarElements } from "./assistant/threadAssets";

/**
 * iOS system chrome and the small floating controls, exactly as measured from
 * Figma through MCP.
 *
 * These are the pieces every screen in the file shares. Sizes are literal Figma
 * values — a 44 px circular button on a 24 px radius, a 54 px status bar, a
 * 134 × 5 home indicator — so they are written as fixed pixels rather than
 * scaled utilities.
 */

/** Status-bar clock in 24h — matches itinerary times across the app. */
function formatStatusBarTime(now = new Date()): string {
  const parts = new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const hour = parts.find((part) => part.type === "hour")?.value ?? "";
  const minute = parts.find((part) => part.type === "minute")?.value ?? "";
  return `${hour}:${minute}`;
}

interface IOSStatusBarProps {
  /** Fixed override for screenshots. Omit for the live local clock. */
  time?: string;
}

/**
 * iOS status bar — Figma `1204:80849`. 54 px tall.
 *
 * Cellular, Wi-Fi and battery are Figma's single exported 78.328 × 13 cluster
 * rather than three redrawn glyphs, so their spacing and the battery's tapered
 * cap stay exactly as designed. The time tracks the device clock and rolls
 * over on the minute, matching real iOS.
 */
export function IOSStatusBar({ time }: IOSStatusBarProps) {
  const [liveTime, setLiveTime] = useState(formatStatusBarTime);

  useEffect(() => {
    if (time != null) return;

    const tick = () => setLiveTime(formatStatusBarTime());
    tick();

    const msToNextMinute = 60_000 - (Date.now() % 60_000) + 50;
    let intervalId = 0;
    const timeoutId = window.setTimeout(() => {
      tick();
      intervalId = window.setInterval(tick, 60_000);
    }, msToNextMinute);

    return () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
    };
  }, [time]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 z-40 flex h-[54px] items-center justify-between pl-[27px] pr-[16px]"
    >
      <span className="text-[17px] font-semibold leading-[22px] tracking-[-0.2px] text-fig-900 tabular-nums">
        {time ?? liveTime}
      </span>
      <StatusBarElements />
    </div>
  );
}

/**
 * iOS home indicator — Figma `1204:78150`.
 * Default 34 px (device chrome). Assistant thread frames use 17 px
 * (`1204:80848` / `1223:78173`) when `embedded`.
 */
export function HomeIndicator({
  height = 34,
  embedded = false,
}: {
  height?: 17 | 21 | 34;
  /** Sit in a flex footer stack instead of absolute device chrome. */
  embedded?: boolean;
} = {}) {
  const heightClass =
    height === 17 ? "h-[17px]" : height === 21 ? "h-[21px]" : "h-[34px]";
  return (
    <div
      aria-hidden="true"
      className={
        embedded
          ? `pointer-events-none relative w-full shrink-0 ${heightClass}`
          : `pointer-events-none absolute inset-x-0 bottom-0 z-40 ${heightClass}`
      }
    >
      <span className="absolute bottom-[8px] left-1/2 block h-[5px] w-[134px] -translate-x-1/2 rounded-[100px] bg-fig-900" />
    </div>
  );
}

/** The scrim that keeps the status bar legible over the map. 170 px tall. */
export function StatusBarScrim({ height = 170 }: { height?: number }) {
  return (
    <div
      aria-hidden="true"
      className="fig-statusbar-scrim pointer-events-none absolute inset-x-0 top-0 z-10"
      style={{ height }}
    />
  );
}

interface CircularIconButtonProps {
  label: string;
  onClick?: () => void;
  children: ReactNode;
  /** Figma marks some of these `opacity-0` in specific frames. */
  hidden?: boolean;
  className?: string;
}

/**
 * The 44 px circular control that floats on the map.
 *
 * Apple frosted glass via `.fig-circle-button` — same material as the route
 * pill and status chips. Figma's color-dodge fill cannot resolve under CSS
 * backdrop roots, so we use saturate + blur instead.
 */
export function CircularIconButton({
  label,
  onClick,
  children,
  hidden = false,
  className = "",
}: CircularIconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={[
        "fig-circle-button flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-fig-circle text-fig-900",
        "focus-ring-fig-map",
        hidden ? "pointer-events-none opacity-0" : "",
        className,
      ].join(" ")}
    >
      <span className="flex h-[24px] w-[24px] items-center justify-center">
        {children}
      </span>
    </button>
  );
}

export type MapPillTone = "current" | "proposed" | "issued" | "warn";

const PILL_DOT: Record<MapPillTone, string> = {
  current: "#12B76A",
  proposed: "#0088FF",
  issued: "#12B76A",
  warn: "#F79009",
};

interface MapStatusPillProps {
  tone: MapPillTone;
  children: ReactNode;
  /** Read out instead of the visible text when the label is terse. */
  spoken?: string;
}

/**
 * A status chip floating on the map — Figma `1204:80924` / `1204:80928`.
 *
 * Apple frosted glass (`.fig-status-pill`) + 6 px tone dot in an 8 px frame.
 * Tone is never colour-only — the label always states current / proposed /
 * issued in words too.
 */
export function MapStatusPill({ tone, children, spoken }: MapStatusPillProps) {
  return (
    <span className="fig-status-pill inline-flex items-center justify-center gap-[4px] rounded-[32px] px-[8px] py-[4px]">
      <span
        aria-hidden="true"
        className="relative size-[8px] shrink-0 overflow-hidden"
      >
        <span
          className="absolute left-px top-px size-[6px] rounded-full"
          style={{ backgroundColor: PILL_DOT[tone] }}
        />
      </span>
      <span className="fig-w-medium whitespace-nowrap text-center text-[13px] leading-[21px] text-fig-900">
        {children}
      </span>
      {spoken ? <span className="sr-only">{spoken}</span> : null}
    </span>
  );
}

interface RoutePillProps {
  originCode: string;
  destinationCode: string;
  dateLabel: string;
  onClick?: () => void;
  spoken?: string;
}

/**
 * The BOM → BLR context pill at the top of every map-backed screen.
 *
 * 20 px semibold codes with a 16 px blue arrow between them and the date beneath
 * — the airport codes are the typography on these screens.
 */
export function RoutePill({
  originCode,
  destinationCode,
  dateLabel,
  onClick,
  spoken,
}: RoutePillProps) {
  const content = (
    <>
      <span className="flex items-center gap-[5px]">
        <span className="fig-title text-fig-900">{originCode}</span>
        <span
          aria-hidden="true"
          className="fig-w-medium flex h-[26px] w-[17px] items-center justify-center text-[16px] text-fig-blue-arrow"
        >
          →
        </span>
        <span className="fig-title text-fig-900">{destinationCode}</span>
      </span>
      <span className="fig-w-medium text-[13px] leading-[1.25] text-fig-600">
        {dateLabel}
      </span>
      {spoken ? <span className="sr-only">{spoken}</span> : null}
    </>
  );

  const shell =
    "fig-route-pill flex min-h-[44px] flex-1 flex-col items-center justify-center gap-[2px] rounded-fig-pill p-[8px]";

  if (!onClick) {
    return <div className={shell}>{content}</div>;
  }

  return (
    <button type="button" onClick={onClick} className={`${shell} focus-ring-fig-map`}>
      {content}
    </button>
  );
}

interface RouteHeaderProps {
  originCode: string;
  destinationCode: string;
  dateLabel: string;
  onBack?: () => void;
  onRouteClick?: () => void;
  /** Demo-state jump list on the product ⋯ control. */
  activeSlug?: string | null;
  onDemoSelect?: (slug: string) => void;
  /** Status chips shown under the accessories row. */
  pills?: ReactNode;
  /**
   * When false, back / route / ⋯ stay visible but do nothing — used while a
   * modal sheet covers the map so chrome cannot fire under the overlay.
   */
  interactive?: boolean;
}

/**
 * The floating header on every map-backed screen.
 *
 * 170 px tall with `pt-63 pb-16 px-16` and an 18 px gap, blurred 25 px. Not a
 * bar: three separate floating objects over one continuous map, which is what
 * keeps the canvas from being cut into a header and a body.
 */
export function RouteHeader({
  originCode,
  destinationCode,
  dateLabel,
  onBack,
  onRouteClick,
  activeSlug = null,
  onDemoSelect,
  pills,
  interactive = true,
}: RouteHeaderProps) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex flex-col items-center gap-[18px] px-[16px] pb-[16px] pt-[63px]">
      <div
        className={[
          "flex h-[44px] w-full items-center gap-[16px]",
          interactive ? "pointer-events-auto" : "pointer-events-none",
        ].join(" ")}
        aria-hidden={interactive ? undefined : true}
      >
        {interactive && onBack ? (
          <CircularIconButton label="Back" onClick={onBack}>
            <ChevronLeftIcon />
          </CircularIconButton>
        ) : onBack ? (
          <ChromeGlyph>
            <ChevronLeftIcon />
          </ChromeGlyph>
        ) : (
          <CircularIconButton label="Back" hidden>
            <ChevronLeftIcon />
          </CircularIconButton>
        )}

        <RoutePill
          originCode={originCode}
          destinationCode={destinationCode}
          dateLabel={dateLabel}
          onClick={interactive ? onRouteClick : undefined}
          spoken={`${originCode} to ${destinationCode}, ${dateLabel}`}
        />

        {interactive && onDemoSelect ? (
          <DemoStateMenu activeSlug={activeSlug} onSelect={onDemoSelect} />
        ) : onDemoSelect ? (
          <ChromeGlyph>
            <DotsHorizontalIcon />
          </ChromeGlyph>
        ) : (
          <span aria-hidden="true" className="h-[44px] w-[44px] shrink-0" />
        )}
      </div>

      {pills ? (
        <div
          className={[
            "flex flex-wrap items-center justify-center gap-[6px]",
            interactive ? "pointer-events-auto" : "pointer-events-none",
          ].join(" ")}
          aria-hidden={interactive ? undefined : true}
        >
          {pills}
        </div>
      ) : null}
    </div>
  );
}

/** Non-focusable chrome glyph — keeps layout when overlays lock the header. */
function ChromeGlyph({ children }: { children: ReactNode }) {
  return (
    <span
      aria-hidden="true"
      className="fig-circle-button flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-fig-circle text-fig-900"
    >
      <span className="flex h-[24px] w-[24px] items-center justify-center">
        {children}
      </span>
    </span>
  );
}

/* ------------------------------------------------------------------ *
 * Icons matching the Figma stroke weight (1.67 on a 24 box = 2 at 20) *
 * ------------------------------------------------------------------ */

export function ChevronLeftIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M15 18l-6-6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function DotsHorizontalIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <g fill="currentColor">
        <circle cx="5" cy="12" r="1.75" />
        <circle cx="12" cy="12" r="1.75" />
        <circle cx="19" cy="12" r="1.75" />
      </g>
    </svg>
  );
}

export function XCloseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M18 6L6 18M6 6l12 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ChevronDownIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ChevronUpIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M18 15l-6-6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** The 10 px shield-tick beside every "stays booked" safety note. */
export function ShieldTickIcon({ size = 10 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
    >
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
