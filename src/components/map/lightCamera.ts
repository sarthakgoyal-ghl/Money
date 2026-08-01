/**
 * Day-map camera cues for the Figma light basemap.
 *
 * Pitch stays modest — Standard day reads poorly past ~20° — but bearing and
 * zoom bias still shift with product state so the map feels continuous rather
 * than a static illustration under the sheets.
 */

export type LightCameraMode =
  /** Recommendation on the table. */
  | "proposal"
  /** Comparing alternatives — pull back. */
  | "searching"
  /** Modal sheet covering most of the map — keep route in the top sliver. */
  | "sheet"
  /** Ticketing — lean toward the aircraft. */
  | "execution"
  /** Issued — keep full route readable under success chrome. */
  | "success"
  /** Desktop stage backdrop — wide global framing around the device. */
  | "stage";

export type LightCameraFocus = "route" | "destination" | "aircraft";

export interface LightCameraDefinition {
  focus: LightCameraFocus;
  pitch: number;
  bearing: number;
  zoomBias: number;
  slack: number;
  durationMs: number;
}

export interface CameraInset {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export const lightCameras: Record<LightCameraMode, LightCameraDefinition> = {
  proposal: {
    focus: "route",
    pitch: 10,
    bearing: -6,
    zoomBias: 0,
    slack: 0.22,
    durationMs: 1000,
  },
  searching: {
    focus: "route",
    pitch: 6,
    bearing: -10,
    zoomBias: -0.28,
    slack: 0.38,
    durationMs: 800,
  },
  sheet: {
    focus: "route",
    pitch: 8,
    bearing: -8,
    zoomBias: -0.18,
    slack: 0.34,
    durationMs: 850,
  },
  execution: {
    focus: "aircraft",
    pitch: 16,
    bearing: 5,
    zoomBias: 0.4,
    slack: 0.16,
    durationMs: 1000,
  },
  success: {
    // Keep BOM+BLR in frame; destination-only ease was clipping the origin.
    focus: "route",
    pitch: 12,
    bearing: 0,
    zoomBias: 0.08,
    slack: 0.24,
    durationMs: 1100,
  },
  stage: {
    // Deep galaxy pull-back on the same Mapbox canvas as the product map.
    // Duration matches proposal so expand↔collapse stay one continuous ease.
    focus: "route",
    pitch: 0,
    bearing: -10,
    zoomBias: -2.35,
    slack: 1.15,
    durationMs: 1000,
  },
};

/**
 * Convert chrome/sheet insets into Mapbox padding without destroying stage
 * framing. A hard 20% width cap used to shrink desktop cutout pads and zoom
 * the route into a crop that hid one endpoint inside the phone.
 */
export function clampCameraPadding(
  inset: CameraInset,
  width: number,
  height: number,
): CameraInset {
  const minContent = Math.min(160, Math.round(Math.min(width, height) * 0.35));
  const maxVerticalBudget = height * 0.7;
  const verticalScale =
    inset.top + inset.bottom > maxVerticalBudget
      ? maxVerticalBudget / (inset.top + inset.bottom)
      : 1;

  let top = Math.round(inset.top * verticalScale);
  let bottom = Math.round(inset.bottom * verticalScale);
  let left = Math.round(inset.left);
  let right = Math.round(inset.right);

  const maxPadX = Math.max(0, Math.floor((width - minContent) / 2));
  const maxPadY = Math.max(0, Math.floor((height - minContent) / 2));

  left = Math.min(left, maxPadX);
  right = Math.min(right, maxPadX);
  top = Math.min(top, maxPadY);
  bottom = Math.min(bottom, maxPadY);

  const maxVertical = height - minContent;
  if (top + bottom > maxVertical) {
    const ratio = top / Math.max(1, top + bottom);
    top = Math.round(maxVertical * ratio);
    bottom = maxVertical - top;
  }

  return { top, bottom, left, right };
}
