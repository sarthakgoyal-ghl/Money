import {
  forwardRef,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { BLR, BOM } from "../../data/scenario";
import { LightRouteMap } from "../map/LightRouteMap";
import {
  StageMapOwnerProvider,
  useStageMapOwner,
  type MapInset,
} from "./stageMapOwner";

/** The exact mobile frame from Figma (`1204:80299`). */
export const FIG_VIEWPORT = { width: 402, height: 874 } as const;

interface PrototypeStageProps {
  children: ReactNode;
  /** Reviewer scaffolding — rendered outside the phone frame, never inside product UI. */
  devControls?: ReactNode;
}

/** Framing when the assistant phone is opaque — Earth sits behind the device. */
const BACKDROP_PHONE_INSET: MapInset = {
  top: 72,
  bottom: 72,
  left: 36,
  right: 36,
};

function noopOffFrame(_offFrame: boolean): void {}

/**
 * Desktop presentation — Plan B.
 *
 * One Mapbox map stays mounted for the whole session so expand/collapse is a
 * camera ease on the same galaxy canvas (not a CSS↔WebGL swap). Assistant
 * hides the journey and pulls back to stars; map-backed states cut the phone
 * out and frame the route.
 */
export function PrototypeStage({ children, devControls }: PrototypeStageProps) {
  const isDesktop = useMinWidthMd();
  const stageRef = useRef<HTMLDivElement>(null);
  const deviceRef = useRef<HTMLDivElement>(null);

  return (
    <StageMapOwnerProvider stageOwnsMap={isDesktop}>
      <div
        ref={stageRef}
        className="relative flex h-[100dvh] w-full items-center justify-center overflow-hidden bg-[#080a18] md:p-6"
      >
        <StageMapHost stageRef={stageRef} deviceRef={deviceRef} />
        <DeviceFrame ref={deviceRef}>
          {children}
        </DeviceFrame>
        {devControls ? (
          <div className="pointer-events-none absolute bottom-4 right-4 z-20 hidden md:block">
            <div className="pointer-events-auto">{devControls}</div>
          </div>
        ) : null}
      </div>
    </StageMapOwnerProvider>
  );
}

function StageMapHost({
  stageRef,
  deviceRef,
}: {
  stageRef: RefObject<HTMLDivElement | null>;
  deviceRef: RefObject<HTMLDivElement | null>;
}) {
  const { session } = useStageMapOwner();
  const phoneInset = session?.phoneInset ?? BACKDROP_PHONE_INSET;
  const stageInset = useDeviceStageInset(stageRef, deviceRef, phoneInset);
  const mapBacked = session !== null;

  return (
    <div
      aria-hidden
      className={[
        "absolute inset-0 z-0 hidden overflow-hidden bg-[#080a18] md:block",
        session?.explorable ? "pointer-events-auto" : "pointer-events-none",
      ].join(" ")}
    >
      {stageInset ? (
        <LightRouteMap
          origin={BOM}
          destination={BLR}
          tone={session?.tone ?? "active"}
          progress={mapBacked ? (session?.progress ?? 0.46) : null}
          camera={session?.camera ?? "stage"}
          variant="full"
          showProtectedRoute={session?.showProtectedRoute ?? false}
          showJourney={mapBacked}
          explorable={session?.explorable ?? false}
          fitSignal={session?.fitSignal ?? 0}
          onOffFrameChange={session?.onOffFrameChange ?? noopOffFrame}
          inset={stageInset}
          className="absolute inset-0 h-full w-full"
        />
      ) : null}
    </div>
  );
}

function useDeviceStageInset(
  stageRef: RefObject<HTMLDivElement | null>,
  deviceRef: RefObject<HTMLDivElement | null>,
  phoneInset: MapInset | null,
): MapInset | null {
  const [inset, setInset] = useState<MapInset | null>(null);
  const insetKey = phoneInset
    ? `${phoneInset.top},${phoneInset.bottom},${phoneInset.left},${phoneInset.right}`
    : "";

  useLayoutEffect(() => {
    if (!phoneInset) {
      setInset(null);
      return;
    }

    const measure = () => {
      const stage = stageRef.current;
      const device = deviceRef.current;
      if (!stage || !device) return;

      const stageBox = stage.getBoundingClientRect();
      const deviceBox = device.getBoundingClientRect();
      if (stageBox.width < 1 || deviceBox.width < 1) return;

      setInset({
        top: Math.max(0, deviceBox.top - stageBox.top) + phoneInset.top,
        bottom: Math.max(0, stageBox.bottom - deviceBox.bottom) + phoneInset.bottom,
        left: Math.max(0, deviceBox.left - stageBox.left) + phoneInset.left,
        right: Math.max(0, stageBox.right - deviceBox.right) + phoneInset.right,
      });
    };

    measure();
    const ro =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => measure())
        : null;
    if (stageRef.current) ro?.observe(stageRef.current);
    if (deviceRef.current) ro?.observe(deviceRef.current);
    window.addEventListener("resize", measure);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [stageRef, deviceRef, phoneInset, insetKey]);

  return inset;
}

function useMinWidthMd(): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(min-width: 768px)").matches;
  });

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const onChange = () => setMatches(media.matches);
    onChange();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return matches;
}

interface DeviceFrameProps {
  children: ReactNode;
}

export const DeviceFrame = forwardRef<HTMLDivElement, DeviceFrameProps>(
  function DeviceFrame({ children }, ref) {
    const { stageOwnsMap, session } = useStageMapOwner();
    const cutout = stageOwnsMap && session !== null;

    return (
      <div
        ref={ref}
        className={[
          // Always clip to the phone — overflow-visible lets stacked sheets
          // slide in from outside the device and bleed glass/shadow onto the stage.
          "relative z-10 h-full w-full isolate overflow-hidden",
          cutout ? "bg-transparent md:pointer-events-none" : "bg-white",
          // Soften opaque↔cutout with the map camera ease (~1s).
          "md:transition-colors md:duration-1000 md:ease-[cubic-bezier(0.2,0.7,0.2,1)]",
          "md:h-[874px] md:w-[402px] md:shrink-0",
          "md:rounded-fig-device md:border-10 md:border-white/75",
          "md:max-h-[calc(100dvh-48px)]",
        ].join(" ")}
        style={{ boxSizing: "content-box" }}
      >
        <MobileViewport cutout={cutout}>
          {children}
        </MobileViewport>
      </div>
    );
  },
);

interface MobileViewportProps {
  children: ReactNode;
  cutout?: boolean;
}

export function MobileViewport({
  children,
  cutout = false,
}: MobileViewportProps) {
  return (
    <div
        className={[
        "relative h-full w-full isolate overflow-hidden md:rounded-[30px]",
        cutout ? "bg-transparent" : "bg-white",
        "md:transition-colors md:duration-1000 md:ease-[cubic-bezier(0.2,0.7,0.2,1)]",
      ].join(" ")}
    >
      {children}
    </div>
  );
}
