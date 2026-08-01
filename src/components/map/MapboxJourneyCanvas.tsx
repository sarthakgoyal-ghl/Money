import { useEffect, useMemo, useRef, useState } from "react";
import type { Map as MapboxMap } from "mapbox-gl";
import type { Airport } from "../../data/scenario";
import { assertPublicMapboxToken, mapboxToken } from "../../config/env";
import { expandBounds, geoRoute, positionAlongRoute, routeBounds } from "../journey/geo";
import type { GeoRoute } from "../journey/geo";
import { cameraPresets, paddingForDock } from "./cameraPresets";
import type { CameraPreset } from "./cameraPresets";
import {
  installJourneyLayers,
  setJourneyProgress,
  setProtectedRouteVisible,
  setRoutePaint,
} from "./mapLayers";
import { routeDescription, routePaints } from "./routeStyle";
import type { RouteTone } from "./routeStyle";

export type MapStatus = "loading" | "live" | "unavailable";

export type BasemapLight = "night" | "dawn";

interface MapboxJourneyCanvasProps {
  origin: Airport;
  destination: Airport;
  tone: RouteTone;
  /** 0–1 along the route. Null means no aircraft is in flight. */
  progress: number | null;
  camera: CameraPreset;
  /** Fraction of the viewport the assistant dock currently covers. */
  dockFraction: number;
  light?: BasemapLight;
  showProtectedRoute?: boolean;
  /** Lets the user pan and zoom. Off by default — this is context, not a tool. */
  explorable?: boolean;
  /** Bumping this re-applies the current camera preset. */
  resetSignal?: number;
  onStatus: (status: MapStatus) => void;
}

const STYLE_URL = "mapbox://styles/mapbox/standard-satellite";
const LOAD_TIMEOUT_MS = 9000;

/**
 * The persistent journey map.
 *
 * Mounted once at the shell and never unmounted: constructing a `mapboxgl.Map`
 * parses a style and fetches tiles, which blocks the main thread long enough to
 * visibly stall a state transition. Every screen change is therefore a camera
 * move and a paint update on the *same* map — which is also why the route reads
 * as one continuous journey rather than eleven separate illustrations.
 *
 * All labels, roads and boundaries are switched off. The only text on the canvas
 * comes from the product's own floating controls, so nothing on the map can
 * contradict the itinerary.
 */
export function MapboxJourneyCanvas({
  origin,
  destination,
  tone,
  progress,
  camera,
  dockFraction,
  light = "night",
  showProtectedRoute = false,
  explorable = false,
  resetSignal = 0,
  onStatus,
}: MapboxJourneyCanvasProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const [ready, setReady] = useState(false);

  const route = useMemo(() => geoRoute(origin, destination), [origin, destination]);
  const protectedRoute = useMemo(
    () => geoRoute(origin, destination, -0.1),
    [origin, destination],
  );

  // Camera inputs are read from a ref inside the async setup so the first frame
  // is already correctly framed rather than snapping into place afterwards.
  const framing = useRef({ camera, dockFraction, progress });
  framing.current = { camera, dockFraction, progress };

  const statusRef = useRef(onStatus);
  statusRef.current = onStatus;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let cancelled = false;
    let created: MapboxMap | null = null;

    const build = async () => {
      const token = mapboxToken;
      if (!token) {
        statusRef.current("unavailable");
        return;
      }

      try {
        assertPublicMapboxToken(token);

        // Dynamically imported so mapbox-gl stays out of the initial bundle and
        // the shell can paint its loading state first.
        const mapboxgl = (await import("mapbox-gl")).default;
        if (cancelled) return;

        if (mapboxgl.supported && !mapboxgl.supported()) {
          statusRef.current("unavailable");
          return;
        }

        mapboxgl.accessToken = token;

        const map = new mapboxgl.Map({
          container: host,
          style: STYLE_URL,
          center: [75.25, 16.2],
          zoom: 5.2,
          pitch: 28,
          bearing: -8,
          // Handlers are installed then immediately disabled, so an explicit
          // "explore" affordance can switch them back on without rebuilding
          // the map.
          interactive: true,
          attributionControl: false,
          fadeDuration: 0,
          // Nothing on this map is a data visualisation the user needs to read
          // at an angle, and the extra tiles cost bandwidth on mobile.
          maxPitch: 55,
        });
        created = map;
        mapRef.current = map;

        lockGestures(map);

        map.addControl(
          new mapboxgl.AttributionControl({ compact: true }),
          "bottom-right",
        );

        const loaded = await new Promise<boolean>((resolve) => {
          let settled = false;
          const settle = (value: boolean) => {
            if (settled) return;
            settled = true;
            resolve(value);
          };
          map.on("load", () => settle(true));
          // Non-fatal tile/style noise must not abort the basemap.
          window.setTimeout(() => settle(map.loaded()), LOAD_TIMEOUT_MS);
        });

        if (cancelled) return;
        if (!loaded) {
          statusRef.current("unavailable");
          return;
        }

        quietenBasemap(map, light);
        installJourneyLayers(
          map,
          origin,
          destination,
          route,
          protectedRoute,
          routePaints[tone],
        );

        const current = framing.current;
        setJourneyProgress(map, route, current.progress);
        applyCamera(map, {
          route,
          destination,
          preset: current.camera,
          dockFraction: current.dockFraction,
          progress: current.progress,
          animate: false,
        });

        setReady(true);
        statusRef.current("live");
      } catch (error) {
        // A failed basemap must degrade to the offline route, never to a void.
        if (import.meta.env.DEV) {
          console.warn("[journey-map] basemap unavailable:", error);
        }
        statusRef.current("unavailable");
      }
    };

    void build();

    return () => {
      cancelled = true;
      created?.remove();
      mapRef.current = null;
    };
    // The map is built exactly once for the session. Origin, destination and
    // the initial framing are scenario constants; every later change is applied
    // by the effects below rather than by rebuilding the map.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Route tone.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    setRoutePaint(map, routePaints[tone]);
  }, [tone, ready]);

  // Travelled portion and aircraft.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    setJourneyProgress(map, route, progress);
  }, [progress, route, ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    setProtectedRouteVisible(map, showProtectedRoute);
  }, [showProtectedRoute, ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    quietenBasemap(map, light);
  }, [light, ready]);

  // Camera. Dock height is a camera input, not just a layout value: the visible
  // map is only the band above the dock, so a taller dock must re-frame.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    // The container has already resized by the time this runs; Mapbox needs to
    // be told before it can compute a correct fit.
    map.resize();
    applyCamera(map, {
      route,
      destination,
      preset: camera,
      dockFraction,
      progress,
      animate: true,
    });
    // `progress` deliberately excluded: the aircraft moving must not drag the
    // camera on every execution tick, only on an actual state change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera, dockFraction, route, destination, ready, resetSignal]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    if (explorable) {
      unlockGestures(map);
    } else {
      lockGestures(map);
    }
  }, [explorable, ready]);

  return (
    <div
      ref={hostRef}
      role="img"
      aria-label={routeDescription(origin, destination, tone)}
      className="absolute inset-0 h-full w-full"
      style={{
        opacity: ready ? 1 : 0,
        transition: "opacity 340ms cubic-bezier(0.2,0.7,0.2,1)",
      }}
    />
  );
}

interface CameraInput {
  route: GeoRoute;
  destination: Airport;
  preset: CameraPreset;
  dockFraction: number;
  progress: number | null;
  animate: boolean;
}

function applyCamera(map: MapboxMap, input: CameraInput): void {
  const definition = cameraPresets[input.preset];
  const container = map.getContainer();
  const size = {
    width: container.clientWidth,
    height: container.clientHeight,
  };
  if (size.width === 0 || size.height === 0) return;

  const padding = paddingForDock(size, input.dockFraction);
  const bounds = expandBounds(routeBounds(input.route), definition.slack);

  const fitted = map.cameraForBounds(bounds, {
    padding,
    bearing: definition.bearing,
  });
  if (!fitted) return;

  let center = fitted.center;
  if (definition.focus === "destination") {
    center = [input.destination.lon, input.destination.lat];
  } else if (definition.focus === "aircraft" && input.progress !== null) {
    const position = positionAlongRoute(input.route, input.progress);
    center = [position.lon, position.lat];
  }

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;

  map.easeTo({
    center,
    zoom: (fitted.zoom ?? map.getZoom()) + definition.zoomBias,
    pitch: definition.pitch,
    bearing: definition.bearing,
    padding,
    duration: input.animate && !prefersReducedMotion ? definition.durationMs : 0,
    essential: true,
  });
}

/**
 * Turns the stock satellite style into a quiet travel canvas.
 *
 * Every label, road and boundary is switched off: at this scale they collide
 * with the floating controls, and a neighbourhood name has nothing to do with
 * whether the user should approve a ₹4,790 flight change. Unknown config keys
 * are tolerated so a Mapbox style revision cannot break the whole map.
 */
function quietenBasemap(map: MapboxMap, light: BasemapLight): void {
  const settings: Array<[string, string | boolean]> = [
    ["lightPreset", light],
    ["showPlaceLabels", false],
    ["showRoadLabels", false],
    ["showPointOfInterestLabels", false],
    ["showTransitLabels", false],
    ["showRoadsAndTransit", false],
    ["showAdminBoundaries", false],
  ];

  for (const [key, value] of settings) {
    try {
      map.setConfigProperty("basemap", key, value);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn(`[journey-map] basemap config "${key}" not applied:`, error);
      }
    }
  }
}

/**
 * The map is context for a decision, not a tool to explore mid-transaction —
 * so every gesture is off and the canvas is out of the tab order.
 */
function lockGestures(map: MapboxMap): void {
  map.dragPan.disable();
  map.scrollZoom.disable();
  map.boxZoom.disable();
  map.dragRotate.disable();
  map.keyboard.disable();
  map.doubleClickZoom.disable();
  map.touchZoomRotate.disable();
  map.touchPitch.disable();

  const canvas = map.getCanvas();
  canvas.style.cursor = "default";
  canvas.setAttribute("tabindex", "-1");
}

function unlockGestures(map: MapboxMap): void {
  map.dragPan.enable();
  map.scrollZoom.enable();
  map.keyboard.enable();
  map.doubleClickZoom.enable();
  map.touchZoomRotate.enable();

  const canvas = map.getCanvas();
  canvas.style.cursor = "grab";
  canvas.setAttribute("tabindex", "0");
}
