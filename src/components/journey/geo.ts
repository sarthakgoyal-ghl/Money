/**
 * Route geometry for the Journey Canvas.
 *
 * The route is computed once in geographic space (lon/lat) with turf, then
 * projected to screen space by whichever projector is active — Mapbox's
 * `map.project` when a basemap is live, or the built-in equirectangular
 * projection for the offline SVG fallback. One route definition, two renderers.
 */

import {
  along as turfAlong,
  bearing as turfBearing,
  bezierSpline,
  destination as turfDestination,
  length as turfLength,
  lineString,
  midpoint as turfMidpoint,
  point as turfPoint,
} from "@turf/turf";
import type { Feature, LineString } from "geojson";
import type { Airport } from "../../data/scenario";

/** SVG user-space size of the map. */
export const MAP = { width: 360, height: 320 } as const;

/**
 * Projection window. Chosen so peninsular India fills the frame with BOM and
 * BLR comfortably apart; the northern edge deliberately runs past the top so
 * the landmass reads as continuing beyond the canvas.
 */
const LON_MIN = 68;
const LON_MAX = 90;
const LAT_MIN = 8;
const LAT_MAX = 26;

const X_LEFT = 30;
const X_RIGHT = 330;
const Y_BOTTOM = 300;
const Y_TOP = 40;

export interface Point {
  x: number;
  y: number;
}

/** Converts a lon/lat pair into container pixel space. */
export type Projector = (lon: number, lat: number) => Point;

export interface GeoRoute {
  /** Smoothed flight path in lon/lat. */
  feature: Feature<LineString>;
  /** Great-circle-ish length in kilometres. */
  km: number;
}

/**
 * A gently curved flight path between two airports, in geographic space.
 *
 * `bow` displaces a control point perpendicular to the origin→destination
 * bearing before smoothing, so the track reads as a flight path rather than a
 * ruler line. Positive bows curve inland (east of a BOM→BLR course); negative
 * bows curve seaward.
 */
export function geoRoute(from: Airport, to: Airport, bow = 0.12): GeoRoute {
  const start = turfPoint([from.lon, from.lat]);
  const end = turfPoint([to.lon, to.lat]);

  const chordKm = turfLength(lineString([start.geometry.coordinates, end.geometry.coordinates]), {
    units: "kilometers",
  });
  const courseBearing = turfBearing(start, end);
  const mid = turfMidpoint(start, end);

  // Offset perpendicular to the course. Sign of `bow` picks the side.
  const control = turfDestination(
    mid,
    Math.abs(bow) * chordKm,
    courseBearing + (bow < 0 ? 90 : -90),
    { units: "kilometers" },
  );

  const spline = bezierSpline(
    lineString([
      start.geometry.coordinates,
      control.geometry.coordinates,
      end.geometry.coordinates,
    ]),
    { resolution: 10000, sharpness: 0.9 },
  );

  return {
    feature: spline as Feature<LineString>,
    km: turfLength(spline, { units: "kilometers" }),
  };
}

export interface RoutePosition {
  lon: number;
  lat: number;
  /** Compass bearing in degrees, for rotating the aircraft glyph. */
  bearing: number;
}

/** Position and heading a fraction (0–1) of the way along a geo route. */
export function positionAlongRoute(route: GeoRoute, fraction: number): RoutePosition {
  const clamped = Math.min(1, Math.max(0, fraction));
  const here = turfAlong(route.feature, route.km * clamped, { units: "kilometers" });
  // Sample slightly ahead (or behind, at the very end) to derive a heading.
  const lookAheadKm = Math.min(route.km, route.km * clamped + Math.max(1, route.km * 0.02));
  const ahead = turfAlong(route.feature, lookAheadKm, { units: "kilometers" });

  const [lon, lat] = here.geometry.coordinates;
  const sameSpot =
    ahead.geometry.coordinates[0] === lon && ahead.geometry.coordinates[1] === lat;

  return {
    lon,
    lat,
    bearing: sameSpot ? turfBearing(here, turfPoint([lon + 0.01, lat])) : turfBearing(here, ahead),
  };
}

/** Projects a geo route into an SVG path string using the active projector. */
export function routePath(route: GeoRoute, projector: Projector): string {
  const coordinates = route.feature.geometry.coordinates;
  return coordinates
    .map(([lon, lat], index) => {
      const { x, y } = projector(lon, lat);
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

/** Approximate on-screen length of a projected route, for dash-offset draws. */
export function projectedLength(route: GeoRoute, projector: Projector): number {
  const coordinates = route.feature.geometry.coordinates;
  let total = 0;
  let previous = projector(coordinates[0][0], coordinates[0][1]);
  for (let i = 1; i < coordinates.length; i += 1) {
    const current = projector(coordinates[i][0], coordinates[i][1]);
    total += Math.hypot(current.x - previous.x, current.y - previous.y);
    previous = current;
  }
  return total;
}

/**
 * Compass bearing (0° = north, clockwise) converted to the SVG rotation the
 * aircraft glyph needs (0° = pointing right/east).
 */
export const bearingToSvgRotation = (compassBearing: number): number =>
  compassBearing - 90;

/** Equirectangular projection of a lon/lat pair into SVG user space. */
export function project(lon: number, lat: number): Point {
  const x =
    X_LEFT + ((lon - LON_MIN) / (LON_MAX - LON_MIN)) * (X_RIGHT - X_LEFT);
  const y =
    Y_BOTTOM - ((lat - LAT_MIN) / (LAT_MAX - LAT_MIN)) * (Y_BOTTOM - Y_TOP);
  return { x, y };
}

export const projectAirport = (airport: Airport): Point =>
  project(airport.lon, airport.lat);

/**
 * Stylised outline of the Indian subcontinent, as [lon, lat] waypoints.
 * Coastal points are approximate real positions — enough for the route to sit
 * credibly on the land, not a survey-grade boundary.
 */
const OUTLINE: ReadonlyArray<readonly [number, number]> = [
  // West coast, north to south.
  [68.9, 23.9],
  [70.1, 22.6],
  [69.0, 22.3],
  [69.7, 21.6],
  [71.1, 20.8],
  [72.6, 21.7],
  [72.8, 21.1],
  [72.9, 19.1],
  [73.3, 17.0],
  [73.8, 15.5],
  [74.5, 13.8],
  [74.9, 12.9],
  [75.4, 11.5],
  [76.3, 9.9],
  [77.0, 8.4],
  [77.5, 8.1],
  // East coast, south to north.
  [78.2, 9.0],
  [79.3, 9.3],
  [79.9, 10.3],
  [80.3, 13.1],
  [80.2, 14.6],
  [81.1, 16.2],
  [82.3, 16.9],
  [83.3, 17.7],
  [84.8, 19.1],
  [85.8, 19.9],
  [86.9, 21.0],
  [88.3, 21.7],
  // Northern edge — runs past the top of the frame and is clipped.
  [89.9, 25.6],
  [88.1, 27.4],
  [85.2, 27.6],
  [81.0, 28.6],
  [77.4, 30.4],
  [74.6, 28.9],
  [71.6, 25.4],
  [70.2, 24.4],
];

/** The landmass as an SVG path string. */
export const landPath = (() => {
  const points = OUTLINE.map(([lon, lat]) => project(lon, lat));
  const [first, ...rest] = points;
  return [
    `M ${first.x.toFixed(1)} ${first.y.toFixed(1)}`,
    ...rest.map((p) => `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`),
    "Z",
  ].join(" ");
})();

/** Secondary cities, purely for map texture. Labelled decorative in the DOM. */
export const contextCities: ReadonlyArray<{ name: string; point: Point }> = [
  { name: "Ahmedabad", point: project(72.6, 23.0) },
  { name: "Pune", point: project(73.86, 18.52) },
  { name: "Hyderabad", point: project(78.49, 17.39) },
  { name: "Chennai", point: project(80.27, 13.08) },
  { name: "Kochi", point: project(76.27, 9.93) },
  { name: "Nagpur", point: project(79.09, 21.15) },
];

export interface RouteArcGeometry {
  from: Point;
  to: Point;
  /** Quadratic Bézier control point. */
  control: Point;
  /** `M … Q …` path string. */
  path: string;
  /** Approximate arc length, for dash-offset draw animation. */
  length: number;
}

/**
 * A gentle arc between two projected points. `bow` is the perpendicular offset
 * of the control point as a fraction of the chord length — positive bows the
 * arc to the left of travel, which reads as a flight path rather than a ruler
 * line.
 */
export function routeArc(from: Point, to: Point, bow = 0.22): RouteArcGeometry {
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const chord = Math.hypot(dx, dy) || 1;

  // Perpendicular to the chord, normalised.
  const nx = -dy / chord;
  const ny = dx / chord;
  const offset = chord * bow;

  const control = { x: midX + nx * offset, y: midY + ny * offset };
  const path = [
    `M ${from.x.toFixed(2)} ${from.y.toFixed(2)}`,
    `Q ${control.x.toFixed(2)} ${control.y.toFixed(2)}`,
    `${to.x.toFixed(2)} ${to.y.toFixed(2)}`,
  ].join(" ");

  return { from, to, control, path, length: quadraticLength(from, control, to) };
}

/** Point on a quadratic Bézier at t ∈ [0, 1]. */
export function pointAt(
  geometry: Pick<RouteArcGeometry, "from" | "control" | "to">,
  t: number,
): Point {
  const clamped = Math.min(1, Math.max(0, t));
  const inverse = 1 - clamped;
  const a = inverse * inverse;
  const b = 2 * inverse * clamped;
  const c = clamped * clamped;
  return {
    x: a * geometry.from.x + b * geometry.control.x + c * geometry.to.x,
    y: a * geometry.from.y + b * geometry.control.y + c * geometry.to.y,
  };
}

/** Tangent heading in degrees at t, for rotating the aircraft glyph. */
export function headingAt(
  geometry: Pick<RouteArcGeometry, "from" | "control" | "to">,
  t: number,
): number {
  const clamped = Math.min(1, Math.max(0, t));
  const dx =
    2 * (1 - clamped) * (geometry.control.x - geometry.from.x) +
    2 * clamped * (geometry.to.x - geometry.control.x);
  const dy =
    2 * (1 - clamped) * (geometry.control.y - geometry.from.y) +
    2 * clamped * (geometry.to.y - geometry.control.y);
  return (Math.atan2(dy, dx) * 180) / Math.PI;
}

/** Polyline approximation of arc length — 24 segments is well inside 1px here. */
function quadraticLength(from: Point, control: Point, to: Point): number {
  const segments = 24;
  let total = 0;
  let previous = from;
  for (let i = 1; i <= segments; i += 1) {
    const current = pointAt({ from, control, to }, i / segments);
    total += Math.hypot(current.x - previous.x, current.y - previous.y);
    previous = current;
  }
  return total;
}

/** Default projector for the offline SVG fallback (360×320 user space). */
export const svgProjector: Projector = (lon, lat) => project(lon, lat);

/**
 * The portion of a geo route travelled so far, as its own LineString.
 *
 * Used to drive the Mapbox `route-progress` layer: updating one GeoJSON source
 * is far cheaper than restyling the whole route on every execution step.
 */
export function sliceRoute(route: GeoRoute, fraction: number): Feature<LineString> {
  const clamped = Math.min(1, Math.max(0, fraction));
  const coordinates = route.feature.geometry.coordinates;

  if (clamped <= 0) {
    return lineString([coordinates[0], coordinates[0]]) as Feature<LineString>;
  }
  if (clamped >= 1) return route.feature;

  // Walk the polyline until the target share of total length is reached, then
  // interpolate within the straddling segment so the tip lands exactly.
  const target = totalPlanarLength(coordinates) * clamped;
  let walked = 0;
  const out: number[][] = [coordinates[0]];

  for (let i = 1; i < coordinates.length; i += 1) {
    const [ax, ay] = coordinates[i - 1];
    const [bx, by] = coordinates[i];
    const segment = Math.hypot(bx - ax, by - ay);

    if (walked + segment >= target) {
      const t = segment === 0 ? 0 : (target - walked) / segment;
      out.push([ax + (bx - ax) * t, ay + (by - ay) * t]);
      break;
    }
    walked += segment;
    out.push(coordinates[i]);
  }

  if (out.length < 2) out.push(out[0]);
  return lineString(out) as Feature<LineString>;
}

function totalPlanarLength(coordinates: number[][]): number {
  let total = 0;
  for (let i = 1; i < coordinates.length; i += 1) {
    total += Math.hypot(
      coordinates[i][0] - coordinates[i - 1][0],
      coordinates[i][1] - coordinates[i - 1][1],
    );
  }
  return total;
}

export interface FitPadding {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

/**
 * An equirectangular projector that fits a lon/lat box into a pixel box.
 *
 * This is the offline counterpart to `map.project`: it lets the fallback render
 * the same route into a full-screen container at the correct framing, instead of
 * cropping a fixed 360×320 artboard and pushing the airports off-screen.
 *
 * Aspect ratio is preserved and the box is centred inside the padded area, so
 * the route never stretches when the dock changes height.
 */
export function fitProjector(
  bounds: [[number, number], [number, number]],
  size: { width: number; height: number },
  padding: FitPadding,
): Projector {
  const [[west, south], [east, north]] = bounds;
  const spanLon = Math.max(1e-6, east - west);
  const spanLat = Math.max(1e-6, north - south);

  const usableWidth = Math.max(1, size.width - padding.left - padding.right);
  const usableHeight = Math.max(1, size.height - padding.top - padding.bottom);

  const scale = Math.min(usableWidth / spanLon, usableHeight / spanLat);
  const drawnWidth = spanLon * scale;
  const drawnHeight = spanLat * scale;

  const originX = padding.left + (usableWidth - drawnWidth) / 2;
  const originY = padding.top + (usableHeight - drawnHeight) / 2;

  return (lon, lat) => ({
    x: originX + (lon - west) * scale,
    // Screen y grows downward; latitude grows upward.
    y: originY + (north - lat) * scale,
  });
}

/** Pads a lon/lat box outward by a fraction of its own span. */
export function expandBounds(
  bounds: [[number, number], [number, number]],
  fraction: number,
): [[number, number], [number, number]] {
  const [[west, south], [east, north]] = bounds;
  const padLon = (east - west) * fraction;
  const padLat = (north - south) * fraction;
  return [
    [west - padLon, south - padLat],
    [east + padLon, north + padLat],
  ];
}

/** The stylised landmass outline projected through any projector. */
export function landPathWith(projector: Projector): string {
  const points = OUTLINE.map(([lon, lat]) => projector(lon, lat));
  const [first, ...rest] = points;
  return [
    `M ${first.x.toFixed(1)} ${first.y.toFixed(1)}`,
    ...rest.map((p) => `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`),
    "Z",
  ].join(" ");
}

/** Bounding box of a geo route as [[west, south], [east, north]]. */
export function routeBounds(route: GeoRoute): [[number, number], [number, number]] {
  const coordinates = route.feature.geometry.coordinates;
  let west = Infinity;
  let south = Infinity;
  let east = -Infinity;
  let north = -Infinity;
  for (const [lon, lat] of coordinates) {
    if (lon < west) west = lon;
    if (lon > east) east = lon;
    if (lat < south) south = lat;
    if (lat > north) north = lat;
  }
  return [
    [west, south],
    [east, north],
  ];
}
