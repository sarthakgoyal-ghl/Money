import { useEffect, useMemo, useRef, useState } from "react";
import type { Map as MapboxMap, LngLatBoundsLike, PaddingOptions } from "mapbox-gl";
import type { Airport } from "../../data/scenario";
import { assertPublicMapboxToken, mapboxToken } from "../../config/env";
import { basemapDisabledByUrl } from "../../config/env";
import { loadMapbox } from "../../config/prefetchMapbox";
import {
  expandBounds,
  geoRoute,
  positionAlongRoute,
  routeBounds,
} from "../journey/geo";
import type { GeoRoute } from "../journey/geo";
import { clampCameraPadding, lightCameras } from "./lightCamera";
import type { LightCameraMode } from "./lightCamera";
import {
  installJourneyLayers,
  setJourneyProgress,
  setJourneyVisible,
  setNodeRadii,
  setPlaneOpacity,
  setProtectedRouteVisible,
  setRoutePaint,
} from "./mapLayers";
import { lightRoutePaints } from "./routeStyle";
import type { RouteTone } from "./routeStyle";
import { routeDescription } from "./routeStyle";
import { duration } from "../../motion/tokens";

/** Pin drop settle before the route / plane illuminate. */
const PIN_ENTRANCE_MS = 620;

/**
 * How much of the map the product chrome covers, so the route can be framed
 * into the part that is actually visible.
 */
export interface MapInset {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export type LightMapVariant =
  /** Small rounded preview inside the assistant's recommendation card. */
  | "mini"
  /** Full-bleed map behind a floating card or sheet. */
  | "full";

interface LightRouteMapProps {
  origin: Airport;
  destination: Airport;
  tone?: RouteTone;
  /** 0–1 along the route; null hides the aircraft. */
  progress?: number | null;
  /**
   * Camera cue for the day map. Moves only on mode / inset change — never on
   * every progress tick — so the aircraft can fly without dragging the view.
   */
  camera?: LightCameraMode;
  variant?: LightMapVariant;
  /** Chrome to frame around, in CSS pixels. */
  inset?: MapInset;
  /** Draws the original booking as a quiet dashed second line. */
  showProtectedRoute?: boolean;
  /**
   * When false, journey layers stay off — stage galaxy / stars only behind
   * the opaque assistant phone.
   */
  showJourney?: boolean;
  /**
   * When true, pan / pinch are unlocked. Off by default — sheets own the
   * gesture surface; unlock only when the map is the primary context.
   */
  explorable?: boolean;
  className?: string;
  /** Re-applies the framing when bumped (relocate control). */
  fitSignal?: number;
  /** Fires when the user pans/zooms away from — or returns to — the framed route. */
  onOffFrameChange?: (offFrame: boolean) => void;
}

/**
 * Mapbox Standard (day) with the vivid `default` color theme for the global
 * route view. Classic streets remains the hard fallback if Standard stalls.
 * Route layers strip Standard-only `slot` / emissive via `addLayerCompat`.
 */
const STYLE_URL = "mapbox://styles/mapbox/standard";
const STYLE_FALLBACK_URL = "mapbox://styles/mapbox/streets-v12";
/** Fail over to streets sooner on slow networks (Vercel / distant Mapbox edge). */
const LOAD_TIMEOUT_MS = 5000;
const PROGRESS_TWEEN_MS = 780;

const DEFAULT_INSET: MapInset = { top: 24, bottom: 24, left: 24, right: 24 };

/**
 * The light travel map, matching the Figma frames.
 *
 * Mapbox Standard with vivid day theming, streets fallback. Progress and
 * camera move with product state (tweened aircraft, eased framing) so the map
 * reports work rather than sitting as a static backdrop.
 */
export function LightRouteMap({
  origin,
  destination,
  tone = "active",
  progress = null,
  camera = "proposal",
  variant = "full",
  inset = DEFAULT_INSET,
  showProtectedRoute = false,
  showJourney = true,
  explorable = false,
  className = "",
  fitSignal = 0,
  onOffFrameChange,
}: LightRouteMapProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(!mapboxToken || basemapDisabledByUrl());

  const route = useMemo(() => geoRoute(origin, destination), [origin, destination]);
  const protectedRoute = useMemo(
    () => geoRoute(origin, destination, -0.1),
    [origin, destination],
  );

  const framing = useRef({ inset, progress, camera });
  framing.current = { inset, progress, camera };

  const displayedProgress = useRef<number | null>(null);
  const progressRaf = useRef<number | null>(null);
  const hasDrawnRoute = useRef(false);
  /** False while pins are dropping — holds the plane until they settle. */
  const pinEntranceReady = useRef(true);
  /** One pin→plane entrance per showJourney session (expand / first reveal). */
  const entranceArmed = useRef(false);
  const [flightEntranceToken, setFlightEntranceToken] = useState(0);
  const programmaticMove = useRef(false);
  const onOffFrameChangeRef = useRef(onOffFrameChange);
  onOffFrameChangeRef.current = onOffFrameChange;

  const setOffFrame = (value: boolean) => {
    onOffFrameChangeRef.current?.(value);
  };

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    if (!mapboxToken || basemapDisabledByUrl()) {
      setFailed(true);
      return;
    }

    const token = mapboxToken;
    if (!token) {
      setFailed(true);
      return;
    }

    let cancelled = false;
    let created: MapboxMap | null = null;

    const build = async () => {
      try {
        assertPublicMapboxToken(token);
        const mapboxgl = (await loadMapbox()).default;
        if (cancelled) return;
        if (mapboxgl.supported && !mapboxgl.supported()) {
          setFailed(true);
          return;
        }
        mapboxgl.accessToken = token;

        const map = new mapboxgl.Map({
          container: host,
          style: STYLE_URL,
          config: {
            basemap: {
              lightPreset: "day",
              // Vivid / full-color Standard theme (not muted `faded`).
              theme: "default",
              showPointOfInterestLabels: false,
              showTransitLabels: false,
              show3dObjects: false,
              showPlaceLabels: variant === "full",
              showRoadLabels: variant === "full",
            },
          },
          center: [75.3, 16.2],
          zoom: variant === "mini" ? 4.2 : 5.1,
          pitch: 0,
          bearing: 0,
          interactive: true,
          attributionControl: false,
          fadeDuration: 0,
          antialias: false,
        });
        created = map;
        mapRef.current = map;
        lockGestures(map);

        map.addControl(
          new mapboxgl.AttributionControl({ compact: true }),
          variant === "mini" ? "bottom-left" : "bottom-right",
        );

        const onMapError = (event: { error?: Error }) => {
          if (import.meta.env.DEV) {
            console.warn("[light-map] map error:", event.error ?? event);
          }
        };
        map.on("error", onMapError);

        let loaded = await waitForMapLoad(map, LOAD_TIMEOUT_MS);
        if (cancelled) return;

        // If Light fails (token scope / network), retry once on streets.
        if (!loaded) {
          if (import.meta.env.DEV) {
            console.warn("[light-map] primary style timed out; trying streets fallback");
          }
          loaded = await new Promise<boolean>((resolve) => {
            let settled = false;
            const settle = (value: boolean) => {
              if (settled) return;
              settled = true;
              resolve(value);
            };
            map.once("style.load", () => settle(true));
            map.setStyle(STYLE_FALLBACK_URL);
            window.setTimeout(() => settle(map.loaded()), LOAD_TIMEOUT_MS);
          });
        }

        if (cancelled) return;
        if (!loaded) {
          map.off("error", onMapError);
          map.remove();
          created = null;
          mapRef.current = null;
          setFailed(true);
          return;
        }

        // Basemap first — never leave the canvas blank if route layers fail.
        setFailed(false);
        map.resize();
        setReady(true);

        try {
          applyLightBasemap(map, variant);
          // Standard may rewrite atmosphere after config — pin fog again on idle.
          applyGlobeGalaxyFog(map);
          map.once("idle", () => {
            if (cancelled || mapRef.current !== map) return;
            applyGlobeGalaxyFog(map);
            // Safari often skips the first paint while the host was covered —
            // resize once idle so tiles/atmosphere composite before reveal.
            map.resize();
            try {
              applyLightCamera(map, {
                route,
                destination,
                mode: framing.current.camera,
                inset: framing.current.inset,
                progress: framing.current.progress,
                animate: false,
                programmaticMove,
              });
            } catch (cameraError) {
              if (import.meta.env.DEV) {
                console.warn("[light-map] idle camera fit skipped:", cameraError);
              }
            }
          });
          installJourneyLayers(
            map,
            origin,
            destination,
            route,
            protectedRoute,
            lightRoutePaints[tone],
          );
          // Pins start collapsed — entrance grows them when the journey shows.
          setNodeRadii(map, 0);
          setPlaneOpacity(map, 0);
          setJourneyVisible(map, showJourney);
          setProtectedRouteVisible(map, showJourney && showProtectedRoute);
          setJourneyProgress(map, route, null);
          displayedProgress.current = null;
          applyLightCamera(map, {
            route,
            destination,
            mode: framing.current.camera,
            inset: framing.current.inset,
            progress: framing.current.progress,
            animate: false,
            programmaticMove,
          });
        } catch (layerError) {
          if (import.meta.env.DEV) {
            console.warn("[light-map] route layers unavailable:", layerError);
          }
        }

        requestAnimationFrame(() => {
          if (cancelled || mapRef.current !== map) return;
          map.resize();
          try {
            applyLightCamera(map, {
              route,
              destination,
              mode: framing.current.camera,
              inset: framing.current.inset,
              progress: framing.current.progress,
              animate: false,
              programmaticMove,
            });
          } catch (cameraError) {
            if (import.meta.env.DEV) {
              console.warn("[light-map] camera fit skipped:", cameraError);
            }
          }
        });
      } catch (error) {
        if (import.meta.env.DEV) {
          console.warn("[light-map] basemap unavailable:", error);
        }
        created?.remove();
        created = null;
        mapRef.current = null;
        setFailed(true);
      }
    };

    void build();

    const ro =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            const map = mapRef.current;
            if (!map) return;
            map.resize();
          })
        : null;
    ro?.observe(host);

    return () => {
      cancelled = true;
      ro?.disconnect();
      if (progressRaf.current !== null) cancelAnimationFrame(progressRaf.current);
      created?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    setRoutePaint(map, lightRoutePaints[tone]);
    // Don't fight the pin-drop entrance with a bloom write.
    if (!pinEntranceReady.current) return;
    if (map.getLayer("destination-node")) {
      map.setPaintProperty(
        "destination-node",
        "circle-radius",
        tone === "complete" ? 7 : 5,
      );
    }
  }, [tone, ready]);

  // Tween aircraft + progress trail. First reveal draws from 0 (route illuminate).
  // Held until pin entrance finishes when expanding to the product map.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    if (!pinEntranceReady.current) return;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;

    if (progressRaf.current !== null) {
      cancelAnimationFrame(progressRaf.current);
      progressRaf.current = null;
    }

    const from =
      displayedProgress.current ??
      (progress === null || hasDrawnRoute.current ? progress : 0);
    const to = progress;

    if (reduced || from === to) {
      setPlaneOpacity(map, to === null ? 0 : 1);
      setJourneyProgress(map, route, to);
      displayedProgress.current = to;
      hasDrawnRoute.current = true;
      return;
    }

    if (to === null) {
      setPlaneOpacity(map, 0);
      setJourneyProgress(map, route, null);
      displayedProgress.current = null;
      hasDrawnRoute.current = true;
      return;
    }

    const start = from ?? 0;
    const firstDraw = !hasDrawnRoute.current;
    const drawMs = firstDraw
      ? Math.round(duration.routeDraw * 1000)
      : PROGRESS_TWEEN_MS;
    const startedAt = performance.now();
    hasDrawnRoute.current = true;

    if (firstDraw) {
      setPlaneOpacity(map, 0);
      setJourneyProgress(map, route, 0);
      // Fade the plane in as it starts moving.
      requestAnimationFrame(() => setPlaneOpacity(map, 1));
    } else {
      setPlaneOpacity(map, 1);
    }

    const tick = (now: number) => {
      const t = Math.min(1, (now - startedAt) / drawMs);
      const eased = easeOutToken(t);
      const value = start + (to - start) * eased;
      setJourneyProgress(map, route, value);
      displayedProgress.current = value;
      if (t < 1) {
        progressRaf.current = requestAnimationFrame(tick);
      } else {
        progressRaf.current = null;
        displayedProgress.current = to;
      }
    };

    progressRaf.current = requestAnimationFrame(tick);

    return () => {
      if (progressRaf.current !== null) {
        cancelAnimationFrame(progressRaf.current);
        progressRaf.current = null;
      }
    };
  }, [progress, route, ready, flightEntranceToken]);

  // Expand / first reveal: pins drop, then unlock the route / plane draw.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    setJourneyVisible(map, showJourney);
    setProtectedRouteVisible(map, showJourney && showProtectedRoute);

    if (!showJourney) {
      entranceArmed.current = false;
      pinEntranceReady.current = true;
      hasDrawnRoute.current = false;
      displayedProgress.current = null;
      setNodeRadii(map, 0);
      setPlaneOpacity(map, 0);
      setJourneyProgress(map, route, null);
      return;
    }

    // Already played for this visible session — keep layers in sync only.
    if (entranceArmed.current) return;
    entranceArmed.current = true;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;

    if (reduced) {
      pinEntranceReady.current = true;
      setNodeRadii(map, tone === "complete" ? 7 : 5);
      setPlaneOpacity(map, 1);
      setFlightEntranceToken((n) => n + 1);
      return;
    }

    // Hold the plane while pins drop.
    pinEntranceReady.current = false;
    if (progressRaf.current !== null) {
      cancelAnimationFrame(progressRaf.current);
      progressRaf.current = null;
    }
    hasDrawnRoute.current = false;
    displayedProgress.current = null;
    setPlaneOpacity(map, 0);
    setJourneyProgress(map, route, null);
    setNodeRadii(map, 0);

    let flightTimer = 0;
    let outerRaf = 0;
    let innerRaf = 0;
    outerRaf = requestAnimationFrame(() => {
      innerRaf = requestAnimationFrame(() => {
        setNodeRadii(map, tone === "complete" ? 7 : 5);
        flightTimer = window.setTimeout(() => {
          pinEntranceReady.current = true;
          setFlightEntranceToken((n) => n + 1);
        }, PIN_ENTRANCE_MS);
      });
    });

    return () => {
      cancelAnimationFrame(outerRaf);
      cancelAnimationFrame(innerRaf);
      window.clearTimeout(flightTimer);
    };
  }, [showJourney, showProtectedRoute, ready, route, tone]);

  // First framing after ready snaps; every later camera/inset change eases.
  const hasFramed = useRef(false);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    map.resize();
    const animate = hasFramed.current;
    hasFramed.current = true;
    applyLightCamera(map, {
      route,
      destination,
      mode: camera,
      inset,
      progress: displayedProgress.current ?? progress,
      animate,
      programmaticMove,
    });
    setOffFrame(false);
    // Progress intentionally omitted — aircraft flight must not drag the camera.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    route,
    destination,
    ready,
    fitSignal,
    camera,
    inset.top,
    inset.bottom,
    inset.left,
    inset.right,
  ]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    if (explorable) unlockGestures(map);
    else {
      lockGestures(map);
      setOffFrame(false);
    }
  }, [explorable, ready]);

  // Any user gesture that moves the camera surfaces the relocate control.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !explorable) return;

    const onMoveEnd = (event: unknown) => {
      if (programmaticMove.current) return;
      const originalEvent =
        event &&
        typeof event === "object" &&
        "originalEvent" in event
          ? (event as { originalEvent?: Event }).originalEvent
          : undefined;
      if (originalEvent) setOffFrame(true);
    };

    map.on("moveend", onMoveEnd);
    map.on("zoomend", onMoveEnd);
    map.on("pitchend", onMoveEnd);
    map.on("rotateend", onMoveEnd);

    return () => {
      map.off("moveend", onMoveEnd);
      map.off("zoomend", onMoveEnd);
      map.off("pitchend", onMoveEnd);
      map.off("rotateend", onMoveEnd);
    };
  }, [explorable, ready]);

  return (
    <div
      data-map-variant={variant}
      className={`relative overflow-hidden ${className}`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, #DCEBF7 0%, #E8F1F6 45%, #EFF2ED 100%)",
          opacity: ready && !failed ? 0 : 1,
          transition: "opacity 320ms cubic-bezier(0.2,0.7,0.2,1)",
        }}
      />

      {/* Host stays opaque — Safari/WebGL often never paints while opacity:0.
          The gradient above covers cold start until ready. */}
      <div
        ref={hostRef}
        role={failed ? undefined : "img"}
        aria-label={failed ? undefined : routeDescription(origin, destination, tone)}
        aria-hidden={failed || !ready}
        className="absolute inset-0 h-full w-full"
        style={{ opacity: failed ? 0 : 1 }}
      />

      {failed ? (
        <LightMapFallback origin={origin} destination={destination} tone={tone} />
      ) : null}
    </div>
  );
}

interface LightCameraInput {
  route: GeoRoute;
  destination: Airport;
  mode: LightCameraMode;
  inset: MapInset;
  progress: number | null;
  animate: boolean;
  programmaticMove: { current: boolean };
}

function waitForMapLoad(map: MapboxMap, timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false;
    const settle = (value: boolean) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    if (map.loaded()) {
      settle(true);
      return;
    }
    map.once("load", () => settle(true));
    window.setTimeout(() => settle(map.loaded()), timeoutMs);
  });
}

/** Product ease `[0.2, 0.7, 0.2, 1]` as a Mapbox unit-time easing curve. */
function mapboxProductEase(t: number): number {
  // Cubic-bezier approximation of motion token `ease`.
  const clamped = Math.min(1, Math.max(0, t));
  return 1 - Math.pow(1 - clamped, 2.4);
}

/** Frames the route into the visible band with a state-aware ease. */
function applyLightCamera(map: MapboxMap, input: LightCameraInput): void {
  const definition = lightCameras[input.mode];
  const container = map.getContainer();
  const width = container.clientWidth;
  const height = container.clientHeight;
  if (width === 0 || height === 0) return;

  const padding: PaddingOptions = clampCameraPadding(input.inset, width, height);

  const bounds = expandBounds(routeBounds(input.route), definition.slack) as LngLatBoundsLike;
  const fitted = map.cameraForBounds(bounds, {
    padding,
    bearing: definition.bearing,
  });

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
  const duration =
    input.animate && !prefersReducedMotion ? definition.durationMs : 0;

  // Interrupt any in-flight ease so expand→collapse doesn't hitch mid-tween.
  map.stop();

  input.programmaticMove.current = true;

  // Stage: deep pull-back so Earth sits behind the device and Mapbox stars
  // own the margins — same canvas as the product map for seamless expand.
  if (input.mode === "stage") {
    const [[west, south], [east, north]] = routeBounds(input.route);
    const center: [number, number] = [(west + east) / 2, (south + north) / 2];
    const baseZoom = fitted?.zoom ?? 2;
    map.easeTo({
      center,
      zoom: Math.max(0.75, baseZoom + definition.zoomBias),
      pitch: definition.pitch,
      bearing: definition.bearing,
      padding,
      duration,
      easing: mapboxProductEase,
      essential: true,
    });
    map.once("moveend", () => {
      input.programmaticMove.current = false;
    });
    return;
  }

  if (!fitted) {
    map.fitBounds(bounds, {
      padding,
      animate: duration > 0,
      duration,
      easing: mapboxProductEase,
    });
    map.once("moveend", () => {
      input.programmaticMove.current = false;
    });
    return;
  }

  let center = fitted.center;
  if (definition.focus === "destination") {
    center = [input.destination.lon, input.destination.lat];
  } else if (definition.focus === "aircraft" && input.progress !== null) {
    const position = positionAlongRoute(input.route, input.progress);
    center = [position.lon, position.lat];
  }

  map.easeTo({
    center,
    zoom: (fitted.zoom ?? map.getZoom()) + definition.zoomBias,
    pitch: definition.pitch,
    bearing: definition.bearing,
    padding,
    duration,
    easing: mapboxProductEase,
    essential: true,
  });
  map.once("moveend", () => {
    input.programmaticMove.current = false;
  });
}

/** Approximates motion token ease `[0.2, 0.7, 0.2, 1]` for progress tweens. */
function easeOutToken(t: number): number {
  const clamped = Math.min(1, Math.max(0, t));
  return 1 - Math.pow(1 - clamped, 2.6);
}

function applyLightBasemap(map: MapboxMap, variant: LightMapVariant): void {
  const settings: Array<[string, string | boolean]> = [
    ["lightPreset", "day"],
    // Mapbox Standard: `default` is the vivid palette; `faded` washes the globe.
    ["theme", "default"],
    ["showPlaceLabels", variant === "full"],
    ["showRoadLabels", variant === "full"],
    ["showPointOfInterestLabels", false],
    ["showTransitLabels", false],
    ["show3dObjects", false],
  ];

  for (const [key, value] of settings) {
    try {
      map.setConfigProperty("basemap", key, value);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn(`[light-map] basemap config "${key}" not applied:`, error);
      }
    }
  }
}

/**
 * Outside the globe is fog “space”, not the stage plate. Day Standard can
 * suppress stars — pin a starfield that holds through sheet framing zooms
 * and fades only when the camera is tight on the route.
 */
function applyGlobeGalaxyFog(map: MapboxMap): void {
  try {
    map.setFog({
      range: [0.8, 8],
      color: "rgb(186, 210, 235)",
      "high-color": "rgb(36, 92, 223)",
      "horizon-blend": 0.02,
      "space-color": [
        "interpolate",
        ["linear"],
        ["zoom"],
        1,
        "rgb(11, 11, 25)",
        4,
        "rgb(11, 11, 25)",
        7,
        "rgb(54, 122, 185)",
        9,
        "rgb(127, 192, 234)",
      ],
      "star-intensity": [
        "interpolate",
        ["linear"],
        ["zoom"],
        0.5,
        1,
        1.5,
        0.95,
        4,
        0.75,
        6,
        0.3,
        8,
        0,
      ],
    });
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn("[light-map] globe fog not applied:", error);
    }
  }
}

function lockGestures(map: MapboxMap): void {
  map.boxZoom.disable();
  map.scrollZoom.disable();
  map.dragPan.disable();
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
  map.scrollZoom.enable();
  map.dragPan.enable();
  map.touchZoomRotate.enable();
  map.doubleClickZoom.enable();
  map.dragRotate.disable();
  map.keyboard.disable();
  map.boxZoom.disable();
  map.touchPitch.disable();
  const canvas = map.getCanvas();
  canvas.style.cursor = "grab";
  canvas.setAttribute("tabindex", "0");
}


interface LightMapFallbackProps {
  origin: Airport;
  destination: Airport;
  tone: RouteTone;
}

function LightMapFallback({ origin, destination, tone }: LightMapFallbackProps) {
  const paint = lightRoutePaints[tone];

  return (
    <div
      role="img"
      aria-label={routeDescription(origin, destination, tone)}
      className="absolute inset-0"
      style={{
        background: "linear-gradient(180deg, #DCEBF7 0%, #E8F1F6 45%, #EFF2ED 100%)",
      }}
    >
      <svg
        viewBox="0 0 402 400"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="M118 96 Q 214 190 262 306"
          fill="none"
          stroke={paint.base}
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.9"
        />
        <circle cx="118" cy="96" r="6" fill="#fff" stroke={paint.node} strokeWidth="2.5" />
        <circle cx="262" cy="306" r="6" fill="#fff" stroke={paint.node} strokeWidth="2.5" />
        <text x="134" y="94" fontSize="13" fontWeight="600" fill="#101828">
          {origin.code}
        </text>
        <text x="212" y="326" fontSize="13" fontWeight="600" fill="#101828">
          {destination.code}
        </text>
      </svg>
    </div>
  );
}
