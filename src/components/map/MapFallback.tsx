import { useEffect, useMemo, useRef, useState } from "react";
import type { Airport } from "../../data/scenario";
import {
  expandBounds,
  fitProjector,
  geoRoute,
  landPathWith,
  routeBounds,
} from "../journey/geo";
import { RouteLayer } from "../journey/RouteLayer";
import type { RouteState } from "../journey/RouteLayer";
import { paddingForDock } from "./cameraPresets";
import type { RouteTone } from "./routeStyle";

interface MapFallbackProps {
  origin: Airport;
  destination: Airport;
  tone: RouteTone;
  progress: number | null;
  dockFraction: number;
  showProtectedRoute?: boolean;
}

const TONE_TO_ROUTE_STATE: Record<RouteTone, RouteState> = {
  idle: "inactive",
  searching: "searching",
  active: "active",
  complete: "complete",
  stale: "warning",
  paused: "warning",
};

/**
 * The journey without a basemap service.
 *
 * Shown when no token is configured, WebGL is unavailable, or Mapbox fails to
 * load — and reachable deliberately at `?basemap=off` so both renderings stay
 * reviewable side by side. It projects the *same* geographic route through an
 * equirectangular fit rather than drawing a second, different picture, so the
 * flight path is identical in both modes and the prototype never depends on a
 * network service being reachable.
 */
export function MapFallback({
  origin,
  destination,
  tone,
  progress,
  dockFraction,
  showProtectedRoute = false,
}: MapFallbackProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const measure = () => {
      const rect = host.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setSize({ width: rect.width, height: rect.height });
      }
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  const route = useMemo(() => geoRoute(origin, destination), [origin, destination]);

  const projector = useMemo(() => {
    if (!size) return null;
    // Framed with the same dock-aware padding the Mapbox camera uses, so the
    // route sits in the visible band above the dock in both renderings.
    return fitProjector(
      expandBounds(routeBounds(route), 1.4),
      size,
      paddingForDock(size, dockFraction),
    );
  }, [route, size, dockFraction]);

  const land = useMemo(
    () => (projector ? landPathWith(projector) : null),
    [projector],
  );

  return (
    <div ref={hostRef} className="absolute inset-0 h-full w-full bg-night">
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 80% at 50% 12%, #0D1A2C 0%, #08111D 46%, #050810 100%)",
        }}
      />

      {projector && land && size ? (
        <>
          <svg
            viewBox={`0 0 ${size.width} ${size.height}`}
            className="absolute inset-0 h-full w-full"
            aria-hidden="true"
            focusable="false"
          >
            {/* Landmass with a lit coastal edge — enough to place the route
                geographically without pretending to be survey data. */}
            <path
              d={land}
              fill="#0C1F36"
              fillOpacity="0.92"
              stroke="#2688FF"
              strokeOpacity="0.45"
              strokeWidth="1"
              strokeLinejoin="round"
            />
            <path
              d={land}
              fill="none"
              stroke="#42D6FF"
              strokeOpacity="0.12"
              strokeWidth="4"
              strokeLinejoin="round"
            />
          </svg>

          <RouteLayer
            idPrefix="fallback"
            origin={origin}
            destination={destination}
            state={TONE_TO_ROUTE_STATE[tone]}
            progress={progress ?? undefined}
            showProtectedRoute={showProtectedRoute}
            projector={projector}
            size={size}
          />
        </>
      ) : null}
    </div>
  );
}
