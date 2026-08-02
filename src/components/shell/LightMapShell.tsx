import { useLayoutEffect, useMemo, useState, type ReactNode } from "react";
import { BLR, BOM } from "../../data/scenario";
import type { Airport } from "../../data/scenario";
import { LightRouteMap } from "../map/LightRouteMap";
import { MapExploreChromeProvider } from "../map/MapRelocateButton";
import type { LightCameraMode } from "../map/lightCamera";
import type { RouteTone } from "../map/routeStyle";
import {
  HomeIndicator,
  IOSStatusBar,
  RouteHeader,
  StatusBarScrim,
} from "../figma/chrome";
import { useStageMapOwner } from "./stageMapOwner";

interface MapInset {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

interface LightMapShellProps {
  origin?: Airport;
  destination?: Airport;
  dateLabel?: string;
  tone?: RouteTone;
  progress?: number | null;
  camera?: LightCameraMode;
  showProtectedRoute?: boolean;
  /** Unlock pan/pinch when the map is the primary surface. */
  explorable?: boolean;
  onBack?: () => void;
  onRouteClick?: () => void;
  activeSlug?: string | null;
  onDemoSelect?: (slug: string) => void;
  pills?: ReactNode;
  /** Padding that keeps the route clear of chrome / floating sheets. */
  mapInset?: MapInset;
  /**
   * When false, RouteHeader controls are inert — modal sheets own the
   * interaction surface and map chrome must not fire underneath.
   */
  chromeInteractive?: boolean;
  /** Content floating above the map — sheet or proposal card. */
  children: ReactNode;
}

const DEFAULT_MAP_INSET: MapInset = {
  top: 212,
  bottom: 240,
  left: 32,
  right: 32,
};

/** Soften only tall modal sheets; keep expand-card pads intact on stage. */
function stageMapInset(inset: MapInset): MapInset {
  if (inset.bottom <= 400) return inset;
  return {
    top: Math.max(inset.top, 150),
    bottom: 300,
    left: inset.left,
    right: inset.right,
  };
}

/**
 * Shared light-map frame used by every Figma map-backed screen after the
 * Assistant thread (`1204:80683`).
 *
 * On desktop Plan B, the Mapbox canvas lives on the stage; this shell only
 * publishes camera/tone/inset and renders chrome + sheets in a transparent
 * cutout.
 */
export function LightMapShell({
  origin = BOM,
  destination = BLR,
  dateLabel = BOM.city === "Mumbai" ? "Fri, 14 Aug" : origin.city,
  tone = "active",
  progress = 0.46,
  camera = "proposal",
  showProtectedRoute = true,
  explorable = false,
  onBack,
  onRouteClick,
  activeSlug = null,
  onDemoSelect,
  pills,
  mapInset = DEFAULT_MAP_INSET,
  chromeInteractive = true,
  children,
}: LightMapShellProps) {
  const { stageOwnsMap, publishSession } = useStageMapOwner();
  const mapExplorable = explorable && chromeInteractive;
  const [offFrame, setOffFrame] = useState(false);
  const [fitSignal, setFitSignal] = useState(0);

  const exploreChrome = useMemo(
    () => ({
      relocateVisible: mapExplorable && offFrame,
      onRelocate: () => setFitSignal((value) => value + 1),
    }),
    [mapExplorable, offFrame],
  );

  useLayoutEffect(() => {
    if (!stageOwnsMap) {
      publishSession(null);
      return;
    }

    publishSession({
      tone,
      progress,
      camera,
      showProtectedRoute,
      // Tall sheet insets (~520 bottom) are phone-relative: they park the route
      // in the sliver above the modal. On the stage-wide canvas that over-zooms
      // into empty globe space (flat black). Soften to expand-view framing.
      phoneInset: stageMapInset(mapInset),
      explorable: mapExplorable,
      fitSignal,
      onOffFrameChange: setOffFrame,
    });

    return () => publishSession(null);
  }, [
    stageOwnsMap,
    publishSession,
    tone,
    progress,
    camera,
    showProtectedRoute,
    mapInset,
    mapExplorable,
    fitSignal,
  ]);

  return (
    <MapExploreChromeProvider value={exploreChrome}>
      <div
        data-map-shell
        data-stage-cutout={stageOwnsMap ? "true" : undefined}
        className={[
          "relative h-full w-full overflow-hidden",
          stageOwnsMap ? "bg-transparent pointer-events-none" : "bg-white",
        ].join(" ")}
      >
        {!stageOwnsMap ? (
          <LightRouteMap
            origin={origin}
            destination={destination}
            tone={tone}
            progress={progress}
            camera={camera}
            variant="full"
            showProtectedRoute={showProtectedRoute}
            explorable={mapExplorable}
            fitSignal={fitSignal}
            onOffFrameChange={setOffFrame}
            inset={mapInset}
            className="absolute inset-0 h-full w-full"
          />
        ) : null}

        <div className={stageOwnsMap ? "pointer-events-none" : undefined}>
          <StatusBarScrim />
          <IOSStatusBar />
        </div>

        <div className={stageOwnsMap ? "pointer-events-auto" : undefined}>
          <RouteHeader
            originCode={origin.code}
            destinationCode={destination.code}
            dateLabel={dateLabel}
            onBack={onBack}
            onRouteClick={onRouteClick}
            activeSlug={activeSlug}
            onDemoSelect={onDemoSelect}
            pills={pills}
            interactive={chromeInteractive}
          />
        </div>

        <div className={stageOwnsMap ? "pointer-events-auto" : undefined}>
          {children}
        </div>

        <div className={stageOwnsMap ? "pointer-events-none" : undefined}>
          <HomeIndicator />
        </div>
      </div>
    </MapExploreChromeProvider>
  );
}
