/**
 * Camera behaviour per product state.
 *
 * The map is one continuous space the whole session moves through, so camera
 * changes carry meaning: pulling back means "considering", tightening on the
 * aircraft means "acting", settling over the destination means "done". Nothing
 * here drifts or animates on a loop — the camera moves only when the state does.
 */

import type { FitPadding } from "../journey/geo";

export type CameraPreset =
  /** Reading the request. Widest framing — nothing decided yet. */
  | "assistant"
  /** A concrete option is on the table. Route centred in the visible band. */
  | "proposal"
  /** Reviewing money. The map recedes; the light sheet owns attention. */
  | "confirmation"
  /** Ticketing. Tighter and closer to the aircraft. */
  | "execution"
  /** Issued. Weighted toward the arrival airport. */
  | "success"
  /** Stopped on purpose. The route is held exactly where it was. */
  | "failure"
  /** Ownership moved to a person. Wide and completely still. */
  | "handoff";

export type CameraFocus = "route" | "destination" | "aircraft";

export interface CameraDefinition {
  focus: CameraFocus;
  pitch: number;
  bearing: number;
  /** Added to the fitted zoom. Positive tightens. */
  zoomBias: number;
  /** Extra lon/lat slack around the route, as a fraction of its own span. */
  slack: number;
  /** How long the move takes, in ms. */
  durationMs: number;
}

export const cameraPresets: Record<CameraPreset, CameraDefinition> = {
  assistant: {
    focus: "route",
    pitch: 24,
    bearing: -8,
    zoomBias: -0.1,
    slack: 0.34,
    durationMs: 1100,
  },
  proposal: {
    focus: "route",
    pitch: 30,
    bearing: -8,
    zoomBias: 0.0,
    slack: 0.18,
    durationMs: 900,
  },
  confirmation: {
    focus: "route",
    pitch: 20,
    bearing: -4,
    zoomBias: -0.2,
    slack: 0.4,
    durationMs: 700,
  },
  execution: {
    focus: "aircraft",
    pitch: 42,
    bearing: 6,
    zoomBias: 0.6,
    slack: 0.14,
    durationMs: 1000,
  },
  success: {
    focus: "destination",
    pitch: 36,
    bearing: 0,
    zoomBias: 0.3,
    slack: 0.2,
    durationMs: 1200,
  },
  failure: {
    focus: "route",
    pitch: 26,
    bearing: -8,
    zoomBias: 0.0,
    slack: 0.24,
    durationMs: 700,
  },
  handoff: {
    focus: "route",
    pitch: 18,
    bearing: -8,
    zoomBias: -0.1,
    slack: 0.34,
    durationMs: 700,
  },
};

/** Room reserved at the top for the context pill and the state chip. */
const TOP_CHROME = 108;
/** Breathing room between the route and the top edge of the dock. */
const DOCK_GAP = 20;
const SIDE_CHROME = 48;

/**
 * Framing padding for the current dock height.
 *
 * The dock is opaque, so the *visible* map is only the band above it. Padding
 * has to account for that or the route ends up centred behind the dock — the
 * single most common way a map-plus-sheet layout goes wrong.
 *
 * At the tallest dock height the remaining band is very short, so the bottom
 * padding is capped: better a slightly loose framing in a sliver of map than a
 * camera zoomed out to a globe trying to satisfy impossible padding.
 */
export function paddingForDock(
  size: { width: number; height: number },
  dockFraction: number,
): FitPadding {
  const dockPixels = size.height * clamp(dockFraction, 0, 0.92);
  const maxBottom = size.height * 0.66;

  const top = Math.min(TOP_CHROME, Math.round(size.height * 0.22));
  const bottom = Math.round(Math.min(dockPixels + DOCK_GAP, maxBottom));
  const side = Math.min(SIDE_CHROME, Math.round(size.width * 0.12));

  return { top, bottom, left: side, right: side };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
