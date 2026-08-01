import { Move, RotateCcw } from "lucide-react";

interface MapExploreControlProps {
  explorable: boolean;
  onToggle: () => void;
  onReset: () => void;
}

/**
 * The one place the map becomes a tool instead of context.
 *
 * Gestures are off everywhere else on purpose — panning a map mid-payment is
 * how people lose their place in a flow. This makes exploring an explicit,
 * reversible decision, and pairs it with a reset so there is always a way back
 * to the framing the assistant chose.
 */
export function MapExploreControl({
  explorable,
  onToggle,
  onReset,
}: MapExploreControlProps) {
  return (
    <div
      data-on-dark="true"
      className="absolute right-3 top-[124px] z-20 flex flex-col gap-2"
    >
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={explorable}
        className={[
          "flex h-11 w-11 items-center justify-center rounded-full border backdrop-blur-md focus-ring-map",
          explorable
            ? "border-route-cyan/60 bg-route-cyan/20 text-white"
            : "border-white/14 bg-night/80 text-white/82 hover:bg-night/90",
        ].join(" ")}
      >
        <Move size={16} strokeWidth={2.25} aria-hidden="true" />
        <span className="sr-only">
          {explorable ? "Stop exploring the map" : "Explore the route"}
        </span>
      </button>

      {explorable ? (
        <button
          type="button"
          onClick={onReset}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/14 bg-night/80 text-white/82 backdrop-blur-md hover:bg-night/90 focus-ring-map"
        >
          <RotateCcw size={16} strokeWidth={2.25} aria-hidden="true" />
          <span className="sr-only">Reset the route view</span>
        </button>
      ) : null}
    </div>
  );
}
