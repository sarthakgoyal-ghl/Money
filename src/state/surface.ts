/**
 * How each product state presents itself on the map and in the dock.
 *
 * Kept out of the component so there is exactly one table describing "what does
 * this state look like" — camera, route colour, dock height, aircraft position,
 * and the labels floating over the imagery. Adding a state means adding a row
 * here, not editing a switch in three different files.
 */

import type { DockHeight } from "../components/dock/AssistantDock";
import type { CameraPreset } from "../components/map/cameraPresets";
import type { MapChip } from "../components/map/MapChips";
import type { BasemapLight } from "../components/map/MapboxJourneyCanvas";
import type { RouteTone } from "../components/map/routeStyle";
import type { TripPulseState } from "../components/ai/TripPulse";
import { currentBooking, flightsCompared, formatINR } from "../data/scenario";
import type { AgentModel } from "./machine";
import { settledTotal } from "./machine";

export interface Surface {
  camera: CameraPreset;
  tone: RouteTone;
  /** Dock height when the state is entered. The user can still resize it. */
  dockHeight: DockHeight;
  pulse: TripPulseState;
  /** Aircraft position along the route, or null to hide it. */
  progress: number | null;
  showProtectedRoute: boolean;
  light: BasemapLight;
  chips: MapChip[];
}

/** The current booking, present on the map for as long as it is still yours. */
function protectedChip(): MapChip {
  return {
    id: "current",
    tone: "ok",
    label: `${currentBooking.flightNo} · ${currentBooking.departLabel} · ${currentBooking.seat.label}`,
  };
}

export function surfaceFor(model: AgentModel): Surface {
  switch (model.state) {
    case "interpreting":
      return {
        camera: "assistant",
        tone: "searching",
        dockHeight: "compact",
        pulse: "working",
        progress: null,
        showProtectedRoute: true,
        light: "night",
        chips: [
          protectedChip(),
          { id: "search", tone: "live", label: `Comparing ${flightsCompared} flights` },
        ],
      };

    case "proposal":
      return {
        camera: "proposal",
        tone: "active",
        dockHeight: "medium",
        pulse: "resolved",
        progress: 0.46,
        showProtectedRoute: true,
        light: "night",
        chips: [
          protectedChip(),
          {
            id: "proposed",
            tone: "live",
            label: `${model.selectedOption.flight.flightNo} · arrives ${model.selectedOption.flight.arriveLabel}`,
          },
        ],
      };

    case "adjust_request":
    case "alternatives":
      return {
        camera: "proposal",
        tone: "searching",
        dockHeight: "expanded",
        pulse: "idle",
        progress: null,
        showProtectedRoute: true,
        light: "night",
        chips: [protectedChip()],
      };

    case "confirmation":
      return {
        camera: "confirmation",
        tone: "active",
        dockHeight: "compact",
        pulse: "idle",
        progress: 0.46,
        showProtectedRoute: true,
        light: "night",
        chips: [],
      };

    case "executing": {
      const done = model.execution.filter((step) => step.status === "done").length;
      const issued =
        model.execution.find((step) => step.id === "issue")?.status === "done";
      const released =
        model.execution.find((step) => step.id === "release")?.status === "done";

      return {
        camera: "execution",
        tone: issued ? "complete" : "active",
        dockHeight: "compact",
        pulse: issued && released ? "resolved" : "working",
        // The aircraft tracks real transaction progress, so motion reports the
        // work rather than running on a decorative loop.
        progress: Math.max(0.05, done / model.execution.length),
        showProtectedRoute: !released,
        light: "night",
        chips: [
          {
            id: "current",
            tone: released ? "neutral" : "ok",
            label: `${currentBooking.flightNo} ${released ? "released" : "still active"}`,
          },
          {
            id: "issuing",
            tone: issued ? "ok" : "live",
            label: issued
              ? `${model.selectedOption.flight.flightNo} ticket issued`
              : `Rebooking to ${model.selectedOption.flight.flightNo}`,
          },
        ],
      };
    }

    case "success":
      return {
        camera: "success",
        tone: "complete",
        dockHeight: "compact",
        pulse: "resolved",
        progress: 1,
        showProtectedRoute: false,
        // The one deliberate light change in the product: the destination is
        // reached, so the map moves from night to first light. Applied through
        // the style's own config — the map is never remounted for it.
        light: "dawn",
        chips: [
          {
            id: "issued",
            tone: "ok",
            label: `${model.selectedOption.flight.flightNo} · seat ${model.selectedOption.flight.seat.label} · ${formatINR(settledTotal(model))}`,
          },
        ],
      };

    case "rejected":
      return {
        camera: "assistant",
        tone: "idle",
        dockHeight: "medium",
        pulse: "idle",
        progress: null,
        showProtectedRoute: true,
        light: "night",
        chips: [{ ...protectedChip(), label: `${currentBooking.flightNo} unchanged` }],
      };

    case "failure_price_changed":
      return {
        camera: "failure",
        tone: "stale",
        dockHeight: "medium",
        pulse: "stopped",
        progress: null,
        showProtectedRoute: true,
        light: "night",
        chips: [
          protectedChip(),
          { id: "stopped", tone: "warn", label: "Stopped before ticketing" },
        ],
      };

    case "failure_misread":
      return {
        camera: "assistant",
        tone: "idle",
        dockHeight: "expanded",
        pulse: "idle",
        progress: null,
        showProtectedRoute: true,
        light: "night",
        chips: [protectedChip()],
      };

    case "escalation_partial_transaction":
      return {
        camera: "handoff",
        tone: "paused",
        dockHeight: "medium",
        pulse: "handoff",
        progress: null,
        showProtectedRoute: true,
        light: "night",
        chips: [
          protectedChip(),
          { id: "paused", tone: "warn", label: "Retries paused · case open" },
        ],
      };
  }
}
