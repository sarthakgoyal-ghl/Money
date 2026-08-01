import { createContext, useContext, type ReactNode } from "react";
import { CircularIconButton } from "../figma/chrome";

interface MapExploreChromeValue {
  /** True once the user has panned/zoomed away from the framed route. */
  relocateVisible: boolean;
  /** Ease the camera back to the product framing. */
  onRelocate: () => void;
}

const MapExploreChromeContext = createContext<MapExploreChromeValue>({
  relocateVisible: false,
  onRelocate: () => undefined,
});

export function MapExploreChromeProvider({
  value,
  children,
}: {
  value: MapExploreChromeValue;
  children: ReactNode;
}) {
  return (
    <MapExploreChromeContext.Provider value={value}>
      {children}
    </MapExploreChromeContext.Provider>
  );
}

export function useMapExploreChrome(): MapExploreChromeValue {
  return useContext(MapExploreChromeContext);
}

/**
 * Glass “return to route” control — Figma `1215:77650`.
 *
 * Parent stacks this 8 px above the recommendation sheet (`1204:80852` gap).
 */
export function MapRelocateButton() {
  const { relocateVisible, onRelocate } = useMapExploreChrome();
  if (!relocateVisible) return null;

  return (
    <CircularIconButton label="Return to route" onClick={onRelocate}>
      <RelocateIcon />
    </CircularIconButton>
  );
}

/** Apple Maps–style “return to framed route” glyph. */
function RelocateIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="3.25" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 3.5v2.75M12 17.75V20.5M3.5 12h2.75M17.75 12H20.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
