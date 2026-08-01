import { ArrowLeft } from "lucide-react";
import { currentBooking } from "../../data/scenario";
import { DemoStateMenu } from "../shared/DemoStateMenu";

interface TopControlsProps {
  activeSlug: string | null;
  onDemoSelect: (slug: string) => void;
  onOpenTrip: () => void;
  onBack?: () => void;
  showBack?: boolean;
}

/**
 * Controls floating directly on the map.
 *
 * Deliberately three objects and no bar: a header strip would cut the map into
 * a header and a body, and the whole premise here is one continuous canvas. Each
 * control carries its own dark disc so it stays legible over bright coastline or
 * cloud, which a transparent header cannot promise.
 */
export function TopControls({
  activeSlug,
  onDemoSelect,
  onOpenTrip,
  onBack,
  showBack = false,
}: TopControlsProps) {
  return (
    <div
      data-on-dark="true"
      className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start gap-2 px-3 pt-3"
    >
      {showBack ? (
        <button
          type="button"
          aria-label="Back to the proposal"
          onClick={onBack}
          className="pointer-events-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/14 bg-night/80 text-white backdrop-blur-md hover:bg-night/90 focus-ring-map"
        >
          <ArrowLeft size={18} strokeWidth={2.25} aria-hidden="true" />
        </button>
      ) : (
        <span className="h-11 w-11 shrink-0" aria-hidden="true" />
      )}

      {/* The trip this whole session is about, always one tap away. */}
      <button
        type="button"
        onClick={onOpenTrip}
        className="pointer-events-auto flex min-h-[44px] min-w-0 flex-1 flex-col items-center justify-center rounded-2xl border border-white/14 bg-night/80 px-3 py-1.5 backdrop-blur-md hover:bg-night/90 focus-ring-map"
      >
        <span className="flex items-center gap-1.5 text-[13.5px] font-semibold tabular tracking-[0.02em] text-white">
          {currentBooking.origin.code}
          <span aria-hidden="true" className="text-route-cyan">
            →
          </span>
          {currentBooking.destination.code}
        </span>
        <span className="text-[11.5px] tabular text-white/68">
          {currentBooking.dateShort}
        </span>
        <span className="sr-only">
          Mumbai to Bengaluru on {currentBooking.dateLong}. View your current
          booking.
        </span>
      </button>

      <div className="pointer-events-auto">
        <DemoStateMenu activeSlug={activeSlug} onSelect={onDemoSelect} />
      </div>
    </div>
  );
}
