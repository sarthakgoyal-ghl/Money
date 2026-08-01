/**
 * The journey's GeoJSON sources and layers.
 *
 * Kept out of the React component so the map's imperative surface is one
 * testable module: `installJourneyLayers` once, then `setRouteData` /
 * `setRoutePaint` / `setAircraft` on every change. Nothing here re-creates a
 * layer, because restyling costs a paint and re-adding costs a full re-layout.
 */

import type { Feature, LineString, Point as GeoPoint } from "geojson";
import type { Map as MapboxMap } from "mapbox-gl";
import type { Airport } from "../../data/scenario";
import type { GeoRoute } from "../journey/geo";
import { positionAlongRoute, sliceRoute } from "../journey/geo";
import type { RoutePaint } from "./routeStyle";

export const SOURCES = {
  route: "journey-route",
  progress: "journey-progress",
  protectedRoute: "journey-protected",
  endpoints: "journey-endpoints",
  aircraft: "journey-aircraft",
} as const;

export const LAYERS = {
  glow: "route-glow",
  base: "route-base",
  progress: "route-progress",
  protectedRoute: "route-protected",
  origin: "origin-node",
  destination: "destination-node",
  plane: "plane-marker",
} as const;

const PLANE_ICON = "journey-plane";

/**
 * Standard Satellite composites custom layers into named slots. `top` puts the
 * route above the imagery but below any interactive Mapbox controls. Classic
 * styles (`light-v11`, etc.) reject `slot` and emissive paint — those are
 * stripped on retry so the route still mounts.
 */
const SLOT = "top";

/**
 * Layers on a night basemap are lit by the style's light preset, so an
 * unmodified stroke renders almost black. Full emissive strength makes the route
 * self-illuminating — the reason it reads as a lit flight path rather than a
 * pen mark on a dark photo.
 */
const EMISSIVE = 1;

type LayerSpec = {
  id: string;
  type: string;
  source: string;
  slot?: string;
  filter?: unknown;
  layout?: Record<string, unknown>;
  paint?: Record<string, unknown>;
};

/** Adds a layer, falling back when Standard-only props are rejected. */
function addLayerCompat(map: MapboxMap, layer: LayerSpec): void {
  const attempts: LayerSpec[] = [layer];
  if (layer.slot) {
    const { slot: _slot, ...withoutSlot } = layer;
    attempts.push(withoutSlot);
  }
  if (layer.paint) {
    const paint = { ...layer.paint };
    let stripped = false;
    for (const key of Object.keys(paint)) {
      if (key.includes("emissive")) {
        delete paint[key];
        stripped = true;
      }
    }
    if (stripped) {
      const { slot: _slot, ...rest } = layer;
      attempts.push({ ...rest, paint });
    }
  }

  let lastError: unknown;
  for (const attempt of attempts) {
    try {
      map.addLayer(attempt as Parameters<MapboxMap["addLayer"]>[0]);
      return;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("Failed to add journey layer");
}

function endpointFeatures(origin: Airport, destination: Airport): Feature<GeoPoint>[] {
  return [
    {
      type: "Feature",
      properties: { role: "origin", code: origin.code },
      geometry: { type: "Point", coordinates: [origin.lon, origin.lat] },
    },
    {
      type: "Feature",
      properties: { role: "destination", code: destination.code },
      geometry: { type: "Point", coordinates: [destination.lon, destination.lat] },
    },
  ];
}

function emptyLine(): Feature<LineString> {
  return {
    type: "Feature",
    properties: {},
    geometry: { type: "LineString", coordinates: [] },
  };
}

/**
 * Aircraft glyph, drawn once into an offscreen canvas and registered as a map
 * image.
 *
 * Deliberately a constant white silhouette with a dark keyline rather than a
 * tinted SDF: the route line already carries state colour, and a white aircraft
 * stays legible over every tone the route can take — including amber, where a
 * tinted glyph would disappear into its own line.
 */
function addPlaneImage(map: MapboxMap): void {
  if (map.hasImage(PLANE_ICON)) return;

  const size = 48;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Drawn nose-up, because `icon-rotate` measures clockwise from north.
  ctx.beginPath();
  ctx.moveTo(24, 5);
  ctx.quadraticCurveTo(27.5, 11, 27.5, 18);
  ctx.lineTo(42, 27.5);
  ctx.lineTo(42, 30.5);
  ctx.lineTo(27.5, 26.5);
  ctx.lineTo(27.5, 33);
  ctx.lineTo(32, 37);
  ctx.lineTo(32, 39.5);
  ctx.lineTo(24, 36.5);
  ctx.lineTo(16, 39.5);
  ctx.lineTo(16, 37);
  ctx.lineTo(20.5, 33);
  ctx.lineTo(20.5, 26.5);
  ctx.lineTo(6, 30.5);
  ctx.lineTo(6, 27.5);
  ctx.lineTo(20.5, 18);
  ctx.quadraticCurveTo(20.5, 11, 24, 5);
  ctx.closePath();

  ctx.fillStyle = "#FFFFFF";
  ctx.strokeStyle = "rgba(7, 11, 18, 0.85)";
  ctx.lineWidth = 1.6;
  ctx.lineJoin = "round";
  ctx.fill();
  ctx.stroke();

  const image = ctx.getImageData(0, 0, size, size);
  map.addImage(PLANE_ICON, {
    width: size,
    height: size,
    data: new Uint8Array(image.data.buffer),
  });
}

/** Adds every source and layer. Safe to call once per map instance. */
export function installJourneyLayers(
  map: MapboxMap,
  origin: Airport,
  destination: Airport,
  route: GeoRoute,
  protectedRoute: GeoRoute,
  paint: RoutePaint,
): void {
  addPlaneImage(map);

  map.addSource(SOURCES.route, { type: "geojson", data: route.feature });
  map.addSource(SOURCES.progress, { type: "geojson", data: emptyLine() });
  map.addSource(SOURCES.protectedRoute, {
    type: "geojson",
    data: protectedRoute.feature,
  });
  map.addSource(SOURCES.endpoints, {
    type: "geojson",
    data: { type: "FeatureCollection", features: endpointFeatures(origin, destination) },
  });
  map.addSource(SOURCES.aircraft, {
    type: "geojson",
    data: { type: "FeatureCollection", features: [] },
  });

  // Wide, low-opacity underlay. Reads as atmospheric light around the track
  // without needing a blur filter, which WebGL would charge per frame for.
  addLayerCompat(map, {
    id: LAYERS.glow,
    type: "line",
    source: SOURCES.route,
    slot: SLOT,
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": paint.glow,
      "line-width": 16,
      "line-blur": 12,
      "line-opacity": paint.glowOpacity,
      "line-emissive-strength": EMISSIVE,
    },
  });

  // The protected original booking. Never removed while the replacement is in
  // flight — its presence on the map is the visual form of "you are still on a
  // flight tonight no matter what happens next".
  addLayerCompat(map, {
    id: LAYERS.protectedRoute,
    type: "line",
    source: SOURCES.protectedRoute,
    slot: SLOT,
    layout: { "line-cap": "round", visibility: "none" },
    paint: {
      "line-color": "#8FB6E8",
      "line-width": 1.4,
      "line-opacity": 0.42,
      "line-dasharray": [2, 3],
      "line-emissive-strength": EMISSIVE,
    },
  });

  addLayerCompat(map, {
    id: LAYERS.base,
    type: "line",
    source: SOURCES.route,
    slot: SLOT,
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": paint.base,
      "line-width": 2.2,
      "line-opacity": 0.55,
      "line-emissive-strength": EMISSIVE,
    },
  });

  // The travelled portion, brighter than the base. One source update moves it;
  // no per-frame restyle of the whole route.
  addLayerCompat(map, {
    id: LAYERS.progress,
    type: "line",
    source: SOURCES.progress,
    slot: SLOT,
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": paint.progress,
      "line-width": 3,
      "line-emissive-strength": EMISSIVE,
    },
  });

  addNodeLayer(map, LAYERS.origin, "origin", paint);
  addNodeLayer(map, LAYERS.destination, "destination", paint);

  // Soft radius transition — pin drop on expand + success bloom.
  map.setPaintProperty(LAYERS.origin, "circle-radius-transition", {
    duration: 520,
    delay: 0,
  });
  map.setPaintProperty(LAYERS.destination, "circle-radius-transition", {
    duration: 520,
    delay: 90,
  });

  addLayerCompat(map, {
    id: LAYERS.plane,
    type: "symbol",
    source: SOURCES.aircraft,
    slot: SLOT,
    layout: {
      "icon-image": PLANE_ICON,
      "icon-size": 0.5,
      "icon-rotate": ["get", "bearing"],
      "icon-rotation-alignment": "map",
      "icon-allow-overlap": true,
      "icon-ignore-placement": true,
    },
    paint: {
      "icon-emissive-strength": EMISSIVE,
      "icon-opacity": 1,
      "icon-opacity-transition": { duration: 280 },
    },
  });
}

/** Airport pin radius (0 collapses the pin for entrance / hide). */
export function setNodeRadii(map: MapboxMap, radius: number): void {
  if (map.getLayer(LAYERS.origin)) {
    map.setPaintProperty(LAYERS.origin, "circle-radius", radius);
  }
  if (map.getLayer(LAYERS.destination)) {
    map.setPaintProperty(LAYERS.destination, "circle-radius", radius);
  }
}

/** Fade the aircraft glyph in/out without clearing its GeoJSON. */
export function setPlaneOpacity(map: MapboxMap, opacity: number): void {
  if (!map.getLayer(LAYERS.plane)) return;
  map.setPaintProperty(LAYERS.plane, "icon-opacity", opacity);
}

function addNodeLayer(
  map: MapboxMap,
  id: string,
  role: string,
  paint: RoutePaint,
): void {
  addLayerCompat(map, {
    id,
    type: "circle",
    source: SOURCES.endpoints,
    slot: SLOT,
    filter: ["==", ["get", "role"], role],
    paint: {
      // Start collapsed; LightRouteMap grows pins on journey entrance.
      "circle-radius": 0,
      "circle-color": paint.nodeCore,
      "circle-stroke-width": 2,
      "circle-stroke-color": paint.node,
      "circle-emissive-strength": EMISSIVE,
      "circle-stroke-opacity": 0.9,
    },
  });
}

interface GeoJsonSourceLike {
  setData(data: unknown): void;
}

/**
 * A GeoJSON source, narrowed by capability rather than by cast.
 *
 * `map.getSource` is typed loosely across source kinds, and a wrong assumption
 * here would be a runtime crash rather than a compile error — so the presence of
 * `setData` is checked before it is used.
 */
function geoJsonSource(map: MapboxMap, id: string): GeoJsonSourceLike | null {
  const source: unknown = map.getSource(id);
  if (
    source !== null &&
    typeof source === "object" &&
    typeof (source as GeoJsonSourceLike).setData === "function"
  ) {
    return source as GeoJsonSourceLike;
  }
  return null;
}

/** Recolours every journey layer. Cheap — no source or layer is rebuilt. */
export function setRoutePaint(map: MapboxMap, paint: RoutePaint): void {
  if (!map.getLayer(LAYERS.base)) return;

  map.setPaintProperty(LAYERS.glow, "line-color", paint.glow);
  map.setPaintProperty(LAYERS.glow, "line-opacity", paint.glowOpacity);
  map.setPaintProperty(LAYERS.base, "line-color", paint.base);
  map.setPaintProperty(LAYERS.progress, "line-color", paint.progress);

  for (const id of [LAYERS.origin, LAYERS.destination]) {
    map.setPaintProperty(id, "circle-color", paint.nodeCore);
    map.setPaintProperty(id, "circle-stroke-color", paint.node);
  }
}

/**
 * Moves the travelled portion and the aircraft.
 *
 * `progress` of null means no aircraft is in flight — the marker is emptied
 * rather than parked at the origin, because a stationary plane on the runway
 * implies a state the flow does not have.
 */
export function setJourneyProgress(
  map: MapboxMap,
  route: GeoRoute,
  progress: number | null,
): void {
  const progressSource = geoJsonSource(map, SOURCES.progress);
  const aircraftSource = geoJsonSource(map, SOURCES.aircraft);
  if (!progressSource || !aircraftSource) return;

  if (progress === null) {
    progressSource.setData(emptyLine());
    aircraftSource.setData({ type: "FeatureCollection", features: [] });
    return;
  }

  progressSource.setData(sliceRoute(route, progress));

  const position = positionAlongRoute(route, progress);
  aircraftSource.setData({
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: { bearing: position.bearing },
        geometry: { type: "Point", coordinates: [position.lon, position.lat] },
      },
    ],
  });
}

export function setProtectedRouteVisible(map: MapboxMap, visible: boolean): void {
  if (!map.getLayer(LAYERS.protectedRoute)) return;
  map.setLayoutProperty(
    LAYERS.protectedRoute,
    "visibility",
    visible ? "visible" : "none",
  );
}

/** Hide/show the full journey stack — used for stage galaxy (stars only). */
export function setJourneyVisible(map: MapboxMap, visible: boolean): void {
  const value = visible ? "visible" : "none";
  for (const layerId of Object.values(LAYERS)) {
    if (!map.getLayer(layerId)) continue;
    map.setLayoutProperty(layerId, "visibility", value);
  }
}
