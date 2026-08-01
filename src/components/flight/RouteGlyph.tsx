interface RouteGlyphProps {
  durationLabel: string;
  stops: number;
  tone?: "light" | "muted" | "dark";
  className?: string;
}

const LINE: Record<NonNullable<RouteGlyphProps["tone"]>, string> = {
  light: "bg-ink-200",
  muted: "bg-ink-100",
  dark: "bg-white/28",
};

const DOT: Record<NonNullable<RouteGlyphProps["tone"]>, string> = {
  light: "bg-ink-300",
  muted: "bg-ink-200",
  dark: "bg-white/60",
};

// Duration/stop labels are 10.5px, so even the muted tone needs 4.5:1.
const TEXT: Record<NonNullable<RouteGlyphProps["tone"]>, string> = {
  light: "text-ink-500",
  muted: "text-ink-500",
  dark: "text-white/70",
};

/**
 * The small between-times route mark: duration above, a hairline with two
 * endpoint dots and an aircraft notch, stop count below.
 */
export function RouteGlyph({
  durationLabel,
  stops,
  tone = "light",
  className = "",
}: RouteGlyphProps) {
  return (
    <div className={["flex flex-col items-center px-1.5", className].join(" ")}>
      <span className={["text-[10.5px] tabular", TEXT[tone]].join(" ")}>
        {durationLabel}
      </span>
      <div className="relative mt-1 h-[1px] w-full min-w-[52px]">
        <span className={["absolute inset-0 block h-[1px]", LINE[tone]].join(" ")} />
        <span
          aria-hidden="true"
          className={[
            "absolute -top-[2.5px] left-0 h-[6px] w-[6px] rounded-full",
            DOT[tone],
          ].join(" ")}
        />
        <span
          aria-hidden="true"
          className={[
            "absolute -top-[2.5px] right-0 h-[6px] w-[6px] rounded-full",
            DOT[tone],
          ].join(" ")}
        />
      </div>
      <span className={["mt-1 text-[10.5px]", TEXT[tone]].join(" ")}>
        {stops === 0 ? "Nonstop" : `${stops} stop`}
      </span>
    </div>
  );
}
