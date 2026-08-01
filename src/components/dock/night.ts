/**
 * Shared class strings for night surfaces.
 *
 * The dock is the app's primary reading surface, so its type and container
 * treatment has to be consistent across eleven different panels. Centralising
 * the handful of recurring combinations is what stops a "dark theme" drifting
 * into nine slightly different greys — and every value here was picked to clear
 * 4.5:1 against `night` (#070B12) at the size it is used.
 */

/** Body copy. 88% white on night is ~15:1. */
export const nightBody = "text-[14px] leading-snug text-white/88";

/** Secondary copy and metadata. 68% white on night is ~8.6:1. */
export const nightMuted = "text-[12.5px] leading-snug text-white/68";

/** Section eyebrow. */
export const nightEyebrow =
  "text-[10.5px] font-semibold uppercase tracking-[0.09em] text-white/58";

/** Panel headline. */
export const nightTitle =
  "text-[21px] font-semibold leading-tight tracking-[-0.01em] text-white";

/** Large panel headline, for failure and outcome panels. */
export const nightTitleLarge =
  "text-[25px] font-semibold leading-tight tracking-[-0.02em] text-white";

/** A card inside the dock. */
export const nightCard =
  "rounded-2xl border border-white/10 bg-white/[0.055] backdrop-blur-[2px]";

/** A card that carries the current selection or the safe answer. */
export const nightCardLit =
  "rounded-2xl border border-route-cyan/35 bg-route-cyan/[0.09]";

/** Hairline between rows. */
export const nightRule = "border-t border-white/10";

/** Tabular figures on night — money, times, seat numbers. */
export const nightFigure = "tabular text-white";
