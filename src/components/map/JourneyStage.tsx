import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { Airport } from "../../data/scenario";
import { basemapDisabledByUrl, hasMapboxToken } from "../../config/env";
import { MapboxJourneyCanvas } from "./MapboxJourneyCanvas";
import type { BasemapLight, MapStatus } from "./MapboxJourneyCanvas";
import { MapFallback } from "./MapFallback";
import type { CameraPreset } from "./cameraPresets";
import type { RouteTone } from "./routeStyle";

interface JourneyStageProps {
  origin: Airport;
  destination: Airport;
  tone: RouteTone;
  progress: number | null;
  camera: CameraPreset;
  dockFraction: number;
  light?: BasemapLight;
  showProtectedRoute?: boolean;
  explorable?: boolean;
  /** Bumping this re-applies the current camera preset. */
  resetSignal?: number;
  /** Lets the shell hide map-only affordances when there is no live basemap. */
  onStatusChange?: (status: MapStatus) => void;
}

/**
 * The full-screen map layer of the product.
 *
 * Owns exactly one decision — real basemap or offline route — and the loading
 * state between them. The Mapbox canvas is mounted once and kept mounted for the
 * whole session; only this wrapper's opacity changes, so no state transition
 * ever pays for a map rebuild.
 *
 * The placeholder underneath is a static local gradient, not a spinner: the map
 * arrives in under a second on a warm cache, and a spinner over a payment flow
 * reads as "something is wrong" rather than "an image is loading".
 */
export function JourneyStage({
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
  onStatusChange,
}: JourneyStageProps) {
  const reduced = useReducedMotion();
  const basemapAllowed = hasMapboxToken && !basemapDisabledByUrl();
  const [status, setStatus] = useState<MapStatus>(
    basemapAllowed ? "loading" : "unavailable",
  );

  const report = useRef(onStatusChange);
  report.current = onStatusChange;

  const handleStatus = useCallback((next: MapStatus) => {
    setStatus(next);
    report.current?.(next);
  }, []);

  // With no token (or `?basemap=off`) the Mapbox canvas never mounts, so it
  // never reports — the shell still has to be told there is no live map.
  useEffect(() => {
    if (!basemapAllowed) report.current?.("unavailable");
  }, [basemapAllowed]);

  return (
    <div className="absolute inset-0 overflow-hidden bg-night">
      {/* Placeholder. Sized identically to the map, so nothing shifts when the
          tiles arrive. */}
      <motion.div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(110% 70% at 50% 8%, #101C2E 0%, #0A1220 48%, #05080F 100%)",
        }}
        initial={false}
        animate={{ opacity: status === "live" ? 0 : 1 }}
        transition={{ duration: reduced ? 0.001 : 0.32, ease: [0.2, 0.7, 0.2, 1] }}
      />

      {status === "unavailable" ? (
        <MapFallback
          origin={origin}
          destination={destination}
          tone={tone}
          progress={progress}
          dockFraction={dockFraction}
          showProtectedRoute={showProtectedRoute}
        />
      ) : null}

      {basemapAllowed ? (
        <MapboxJourneyCanvas
          origin={origin}
          destination={destination}
          tone={tone}
          progress={progress}
          camera={camera}
          dockFraction={dockFraction}
          light={light}
          showProtectedRoute={showProtectedRoute}
          explorable={explorable}
          resetSignal={resetSignal}
          onStatus={handleStatus}
        />
      ) : null}

      {/* Bottom scrim so the dock's top edge meets the map as a gradient rather
          than a hard seam, and so map detail never competes with dock text. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40"
        style={{
          background:
            "linear-gradient(180deg, rgba(7,11,18,0) 0%, rgba(7,11,18,0.55) 100%)",
        }}
      />
      {/* Top scrim for the floating controls. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-32"
        style={{
          background:
            "linear-gradient(180deg, rgba(7,11,18,0.62) 0%, rgba(7,11,18,0) 100%)",
        }}
      />
    </div>
  );
}
