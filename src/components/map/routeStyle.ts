/**
 * How the route is coloured, per state.
 *
 * Route colour is the map's status readout: it is the only thing on the canvas
 * that changes tone, so it has to mean something every time it does. Amber is
 * reserved for "this option went stale", green for "issued", muted grey-blue for
 * "nothing is being acted on".
 */

export type RouteTone =
  /** No proposal is live. */
  | "idle"
  /** The agent is searching. */
  | "searching"
  /** A concrete option is on the table, or being ticketed. */
  | "active"
  /** Ticket issued. */
  | "complete"
  /** The option was repriced or otherwise invalidated. */
  | "stale"
  /** Deliberately halted, awaiting a person. */
  | "paused";

export interface RoutePaint {
  base: string;
  progress: string;
  glow: string;
  /** Opacity of the wide glow underlay. */
  glowOpacity: number;
  node: string;
  nodeCore: string;
}

/**
 * Values are the night-surface route tokens, not the light-sheet ones — these
 * are strokes over satellite imagery, where the AA-tuned light colours read as
 * mud.
 */
export const routePaints: Record<RouteTone, RoutePaint> = {
  idle: {
    base: "#5C7A9E",
    progress: "#8FB6E8",
    glow: "#2688FF",
    glowOpacity: 0.1,
    node: "#8FB6E8",
    nodeCore: "#D7E4F4",
  },
  searching: {
    base: "#2688FF",
    progress: "#42D6FF",
    glow: "#2688FF",
    glowOpacity: 0.22,
    node: "#42D6FF",
    nodeCore: "#EAF9FF",
  },
  active: {
    base: "#2688FF",
    progress: "#42D6FF",
    glow: "#42D6FF",
    glowOpacity: 0.3,
    node: "#42D6FF",
    nodeCore: "#EAF9FF",
  },
  complete: {
    base: "#1C7F5F",
    progress: "#28B887",
    glow: "#28B887",
    glowOpacity: 0.32,
    node: "#28B887",
    nodeCore: "#E8FFF6",
  },
  stale: {
    base: "#8A6320",
    progress: "#E29A2D",
    glow: "#E29A2D",
    glowOpacity: 0.26,
    node: "#E29A2D",
    nodeCore: "#FFF4E0",
  },
  paused: {
    base: "#5F6A7C",
    progress: "#9C8CFF",
    glow: "#9C8CFF",
    glowOpacity: 0.2,
    node: "#9C8CFF",
    nodeCore: "#F1EEFF",
  },
};

/**
 * Route paints for the **light** Figma map.
 *
 * The night palette above is tuned to self-illuminate over dark satellite
 * imagery; on a faded day basemap those same values read as neon. These are the
 * Figma interaction blue and semantic tones, weighted to stay legible over pale
 * land and water without shouting.
 */
export const lightRoutePaints: Record<RouteTone, RoutePaint> = {
  idle: {
    base: "#98A2B3",
    progress: "#667085",
    glow: "#98A2B3",
    glowOpacity: 0.14,
    node: "#667085",
    nodeCore: "#FFFFFF",
  },
  searching: {
    base: "#0088FF",
    progress: "#0088FF",
    glow: "#0088FF",
    glowOpacity: 0.16,
    node: "#0088FF",
    nodeCore: "#FFFFFF",
  },
  active: {
    base: "#0088FF",
    progress: "#0078FF",
    glow: "#0088FF",
    glowOpacity: 0.2,
    node: "#0088FF",
    nodeCore: "#FFFFFF",
  },
  complete: {
    base: "#12B76A",
    progress: "#039855",
    glow: "#12B76A",
    glowOpacity: 0.2,
    node: "#039855",
    nodeCore: "#FFFFFF",
  },
  stale: {
    base: "#F79009",
    progress: "#B54708",
    glow: "#F79009",
    glowOpacity: 0.18,
    node: "#B54708",
    nodeCore: "#FFFFFF",
  },
  paused: {
    base: "#98A2B3",
    progress: "#667085",
    glow: "#98A2B3",
    glowOpacity: 0.14,
    node: "#667085",
    nodeCore: "#FFFFFF",
  },
};

/** Text alternative for the map, so the route is not information-by-colour. */
export function routeDescription(
  origin: { city: string; code: string },
  destination: { city: string; code: string },
  tone: RouteTone,
): string {
  const leg = `${origin.city} (${origin.code}) to ${destination.city} (${destination.code})`;
  switch (tone) {
    case "idle":
      return `Map: the ${leg} route, no change proposed yet.`;
    case "searching":
      return `Map: the ${leg} route, searching for flights.`;
    case "active":
      return `Map: the ${leg} route, proposed flight highlighted.`;
    case "complete":
      return `Map: the ${leg} route, new ticket issued.`;
    case "stale":
      return `Map: the ${leg} route, this option is no longer valid.`;
    case "paused":
      return `Map: the ${leg} route, paused awaiting a specialist.`;
  }
}
