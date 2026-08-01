import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { Airport } from "../../data/scenario";
import { duration, ease } from "../../motion/tokens";
import {
  MAP,
  bearingToSvgRotation,
  geoRoute,
  positionAlongRoute,
  projectedLength,
  routePath,
  svgProjector,
} from "./geo";
import type { Point, Projector } from "./geo";

export type RouteState =
  /** Route exists but the agent has not acted on it yet. */
  | "inactive"
  /** Drawing / illuminating while the agent works. */
  | "searching"
  /** Fully lit — a concrete proposed or booked itinerary. */
  | "active"
  /** Amber — the option was repriced or otherwise invalidated. */
  | "warning"
  /** Complete — the ticket has been issued. */
  | "complete";

interface RouteLayerProps {
  idPrefix: string;
  origin: Airport;
  destination: Airport;
  state: RouteState;
  /** 0–1 position of the aircraft along the arc. Omit to hide the aircraft. */
  progress?: number;
  /** Draws the protected original booking behind the active route. */
  showProtectedRoute?: boolean;
  recede?: boolean;
  /**
   * Live projection from the Mapbox basemap. When omitted the layer falls back
   * to its own equirectangular projection over a fixed SVG user space, so the
   * route renders identically with or without a basemap.
   */
  projector?: Projector;
  /** Container pixel size, required when `projector` is supplied. */
  size?: { width: number; height: number };
}

const STROKES: Record<RouteState, { core: string; glow: string; opacity: number }> = {
  inactive: { core: "#5C7A9E", glow: "#5C7A9E", opacity: 0.34 },
  searching: { core: "#61D5FF", glow: "#4F8CFF", opacity: 0.85 },
  active: { core: "#61D5FF", glow: "#4F8CFF", opacity: 1 },
  warning: { core: "#FFC661", glow: "#8F5600", opacity: 1 },
  complete: { core: "#5BE0B0", glow: "#10855D", opacity: 1 },
};

/**
 * The route itself: a curved flight path between two airports, endpoint markers,
 * and an aircraft placed analytically along the curve.
 *
 * This is the one graphic that carries meaning, so it exposes a text alternative
 * describing the route state. It is drawn as SVG on top of whatever basemap is
 * active, which keeps a single implementation for both the Mapbox and offline
 * paths.
 */
export function RouteLayer({
  idPrefix,
  origin,
  destination,
  state,
  progress,
  showProtectedRoute = false,
  recede = false,
  projector,
  size,
}: RouteLayerProps) {
  const reduced = useReducedMotion();

  const activeProjector = projector ?? svgProjector;
  const viewBox = projector && size
    ? `0 0 ${size.width} ${size.height}`
    : `0 0 ${MAP.width} ${MAP.height}`;
  // With a live projector the SVG shares the basemap's pixel space exactly, so
  // it must not be re-scaled to fit.
  const preserveAspectRatio = projector ? "xMinYMin slice" : "xMidYMid slice";

  // The route is defined once in geographic space; only the projection changes.
  const route = useMemo(() => geoRoute(origin, destination), [origin, destination]);
  const protectedRoute = useMemo(
    () => geoRoute(origin, destination, -0.1),
    [origin, destination],
  );

  const path = useMemo(
    () => routePath(route, activeProjector),
    [route, activeProjector],
  );
  const protectedPath = useMemo(
    () => routePath(protectedRoute, activeProjector),
    [protectedRoute, activeProjector],
  );
  const pathLength = useMemo(
    () => projectedLength(route, activeProjector),
    [route, activeProjector],
  );

  const from = activeProjector(origin.lon, origin.lat);
  const to = activeProjector(destination.lon, destination.lat);

  const stroke = STROKES[state];
  const drawn = state !== "inactive";

  const aircraft = useMemo(() => {
    if (progress === undefined) return null;
    const position = positionAlongRoute(route, progress);
    const screen = activeProjector(position.lon, position.lat);
    return { ...screen, angle: bearingToSvgRotation(position.bearing) };
  }, [route, progress, activeProjector]);

  const gradientId = `${idPrefix}-route`;

  return (
    <svg
      viewBox={viewBox}
      preserveAspectRatio={preserveAspectRatio}
      className="absolute inset-0 h-full w-full"
      role="img"
      aria-label={routeDescription(origin, destination, state)}
      focusable="false"
      style={{
        opacity: recede ? 0.6 : 1,
        transition: "opacity 280ms cubic-bezier(0.2,0.7,0.2,1)",
      }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={stroke.glow} />
          <stop offset="100%" stopColor={stroke.core} />
        </linearGradient>
      </defs>

      {/* Protected original booking — deliberately quiet, never removed while
          the replacement is still in flight. */}
      {showProtectedRoute ? (
        <path
          d={protectedPath}
          fill="none"
          stroke="#8FB6E8"
          strokeOpacity="0.28"
          strokeWidth="1.2"
          strokeDasharray="3 4"
          strokeLinecap="round"
        />
      ) : null}

      {/* Glow underlay. */}
      <motion.path
        d={path}
        fill="none"
        stroke={stroke.glow}
        strokeWidth="7"
        strokeLinecap="round"
        initial={false}
        animate={{ opacity: drawn ? 0.18 : 0 }}
        transition={{ duration: 0.4, ease: [...ease] }}
      />

      {/* Core stroke. Draws with dash-offset the first time it becomes active. */}
      <motion.path
        d={path}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray={pathLength}
        initial={false}
        animate={{
          strokeDashoffset: drawn ? 0 : pathLength,
          opacity: stroke.opacity,
        }}
        transition={
          reduced
            ? { duration: 0.001 }
            : { duration: duration.routeDraw, ease: [...ease] }
        }
      />

      <AirportMarker point={from} code={origin.code} align="start" lit={drawn} />
      <AirportMarker point={to} code={destination.code} align="end" lit={drawn} />

      {aircraft ? (
        <AnimatedPlane
          x={aircraft.x}
          y={aircraft.y}
          angle={aircraft.angle}
          tone={stroke.core}
        />
      ) : null}
    </svg>
  );
}

function routeDescription(
  origin: Airport,
  destination: Airport,
  state: RouteState,
): string {
  const route = `${origin.city} (${origin.code}) to ${destination.city} (${destination.code})`;
  switch (state) {
    case "inactive":
      return `Route map: ${route}, no change proposed yet.`;
    case "searching":
      return `Route map: ${route}, searching for flights.`;
    case "active":
      return `Route map: ${route}, proposed flight highlighted.`;
    case "warning":
      return `Route map: ${route}, this option is no longer valid.`;
    case "complete":
      return `Route map: ${route}, new ticket issued.`;
  }
}

interface AirportMarkerProps {
  point: Point;
  code: string;
  align: "start" | "end";
  lit: boolean;
}

/** Endpoint dot plus airport code. */
export function AirportMarker({ point, code, align, lit }: AirportMarkerProps) {
  const dx = align === "start" ? -12 : 12;
  const anchor = align === "start" ? "end" : "start";
  return (
    <g>
      <circle
        cx={point.x}
        cy={point.y}
        r="7"
        fill={lit ? "#61D5FF" : "#5C7A9E"}
        fillOpacity="0.16"
      />
      <circle
        cx={point.x}
        cy={point.y}
        r="3"
        fill={lit ? "#EAF6FF" : "#B9C8DC"}
        stroke={lit ? "#61D5FF" : "#5C7A9E"}
        strokeWidth="1.4"
      />
      {/* Dark halo so the code stays legible over bright basemap features. */}
      <text
        x={point.x + dx}
        y={point.y + 4}
        textAnchor={anchor}
        fill="#07101F"
        stroke="#07101F"
        strokeWidth="3.5"
        strokeLinejoin="round"
        fontSize="11"
        fontWeight="600"
        letterSpacing="0.6"
        opacity="0.75"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {code}
      </text>
      <text
        x={point.x + dx}
        y={point.y + 4}
        textAnchor={anchor}
        fill={lit ? "#EAF6FF" : "#C3D2E4"}
        fontSize="11"
        fontWeight="600"
        letterSpacing="0.6"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {code}
      </text>
    </g>
  );
}

interface AnimatedPlaneProps {
  x: number;
  y: number;
  angle: number;
  tone: string;
}

/** Aircraft glyph, rotated to the route heading. Original path, not an icon font. */
export function AnimatedPlane({ x, y, angle, tone }: AnimatedPlaneProps) {
  return (
    <g
      transform={`translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${angle.toFixed(2)})`}
      style={{ transition: "transform 220ms linear" }}
    >
      <circle r="9" fill={tone} fillOpacity="0.16" />
      <path
        d="M 8 0 L -4 -4.6 L -2.2 -1.1 L -6.4 -1.1 L -7.6 -2.6 L -8.8 -2.6 L -8 0 L -8.8 2.6 L -7.6 2.6 L -6.4 1.1 L -2.2 1.1 L -4 4.6 Z"
        fill="#FFFFFF"
        stroke={tone}
        strokeWidth="0.6"
      />
    </g>
  );
}
