import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { LightCameraMode } from "../map/lightCamera";
import type { RouteTone } from "../map/routeStyle";

export interface MapInset {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

/** Phone-relative map session published by LightMapShell while map-backed. */
export interface StageMapSession {
  tone: RouteTone;
  progress: number | null;
  camera: LightCameraMode;
  showProtectedRoute: boolean;
  /** Insets relative to the device viewport (same numbers as LightMapShell). */
  phoneInset: MapInset;
  explorable: boolean;
  fitSignal: number;
  onOffFrameChange: (offFrame: boolean) => void;
}

interface StageMapOwnerValue {
  /** Desktop cutout is active — shell must not mount a second Mapbox map. */
  stageOwnsMap: boolean;
  /**
   * Stage backdrop Mapbox has painted at least once. Desktop mini previews
   * should wait on this so Safari does not starve the stage WebGL context.
   */
  stageBasemapReady: boolean;
  notifyStageBasemapReady: () => void;
  session: StageMapSession | null;
  publishSession: (session: StageMapSession | null) => void;
}

const StageMapOwnerContext = createContext<StageMapOwnerValue | null>(null);

/**
 * Lets the desktop stage host one Mapbox map while LightMapShell publishes
 * camera / tone / inset and skips its own canvas.
 */
export function StageMapOwnerProvider({
  stageOwnsMap,
  children,
}: {
  stageOwnsMap: boolean;
  children: ReactNode;
}) {
  const [session, setSession] = useState<StageMapSession | null>(null);
  const [stageBasemapReady, setStageBasemapReady] = useState(false);
  const publishSession = useCallback((next: StageMapSession | null) => {
    setSession((prev) => (sameSession(prev, next) ? prev : next));
  }, []);
  const notifyStageBasemapReady = useCallback(() => {
    setStageBasemapReady(true);
  }, []);

  const value = useMemo(
    () => ({
      stageOwnsMap,
      stageBasemapReady,
      notifyStageBasemapReady,
      session,
      publishSession,
    }),
    [
      stageOwnsMap,
      stageBasemapReady,
      notifyStageBasemapReady,
      session,
      publishSession,
    ],
  );

  return (
    <StageMapOwnerContext.Provider value={value}>
      {children}
    </StageMapOwnerContext.Provider>
  );
}

function sameSession(
  a: StageMapSession | null,
  b: StageMapSession | null,
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    a.tone === b.tone &&
    a.progress === b.progress &&
    a.camera === b.camera &&
    a.showProtectedRoute === b.showProtectedRoute &&
    a.explorable === b.explorable &&
    a.fitSignal === b.fitSignal &&
    a.onOffFrameChange === b.onOffFrameChange &&
    a.phoneInset.top === b.phoneInset.top &&
    a.phoneInset.bottom === b.phoneInset.bottom &&
    a.phoneInset.left === b.phoneInset.left &&
    a.phoneInset.right === b.phoneInset.right
  );
}

export function useStageMapOwner(): StageMapOwnerValue {
  const value = useContext(StageMapOwnerContext);
  if (!value) {
    return {
      stageOwnsMap: false,
      stageBasemapReady: true,
      notifyStageBasemapReady: () => undefined,
      session: null,
      publishSession: () => undefined,
    };
  }
  return value;
}
