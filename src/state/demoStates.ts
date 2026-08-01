import type { AgentState } from "./machine";

/**
 * An optional surface the slug opens on arrival.
 *
 * Some review URLs point at a *view* of a state rather than a state of its own —
 * `?state=ticket` is the success state with the boarding pass already open. That
 * belongs here rather than in the machine, because it is presentation, not a
 * distinct position in the flow.
 */
export type DemoSurface = "boardingPass" | "specialistChat";

export interface DemoStateLink {
  slug: string;
  agentState: AgentState;
  label: string;
  description: string;
  /** Sheet or panel to open once the state is applied. */
  surface?: DemoSurface;
  /**
   * True when another slug is the canonical URL for this agent state. Variant
   * slugs are reachable and stay in the address bar, but the app never rewrites
   * the URL *to* them.
   */
  variant?: boolean;
}

/**
 * Every deterministic state, reachable from the overflow menu and from a
 * `?state=` URL. The slugs are part of the deliverable — they are the review
 * surface for the whole flow.
 */
export const demoStateLinks: DemoStateLink[] = [
  {
    slug: "interpreting",
    agentState: "interpreting",
    label: "Interpreting the request",
    description: "Progressive agent work over the live route.",
  },
  {
    slug: "proposal",
    agentState: "proposal",
    label: "Proposal",
    description: "Trip brief plus the recommended flight object.",
  },
  {
    slug: "adjust",
    agentState: "adjust_request",
    label: "Adjust the brief",
    description: "Change a constraint before searching again.",
  },
  {
    slug: "alternatives",
    agentState: "alternatives",
    label: "Alternatives",
    description: "Every option compared against the brief.",
  },
  {
    slug: "confirmation",
    agentState: "confirmation",
    label: "Confirmation review",
    description: "Old-to-new change, exact price, explicit approval.",
  },
  {
    slug: "executing",
    agentState: "executing",
    label: "Executing (rebooking)",
    description: "New ticket issued before the original is released.",
  },
  {
    slug: "success",
    agentState: "success",
    label: "Success",
    description: "Boarding pass issued, charge and activity trail.",
  },
  {
    slug: "ticket",
    agentState: "success",
    label: "Boarding pass",
    description: "The issued pass, opened full-screen.",
    surface: "boardingPass",
    variant: true,
  },
  {
    slug: "price-change",
    agentState: "failure_price_changed",
    label: "Failure: price changed",
    description: "Approval voided by a material price change.",
  },
  {
    slug: "misread",
    agentState: "failure_misread",
    label: "Failure: AI misread",
    description: "Repair one constraint without restarting.",
  },
  {
    slug: "handoff",
    agentState: "escalation_partial_transaction",
    label: "Human handoff",
    description: "Partial transaction. Retries paused on purpose.",
  },
  {
    slug: "support",
    agentState: "escalation_partial_transaction",
    label: "Talking to Priya",
    description: "The specialist thread, with context already attached.",
    surface: "specialistChat",
    variant: true,
  },
  {
    slug: "rejected",
    agentState: "rejected",
    label: "Kept current flight",
    description: "Rejection as a first-class outcome.",
  },
];

export const slugToLink: Record<string, DemoStateLink> = demoStateLinks.reduce(
  (accumulator, link) => {
    accumulator[link.slug] = link;
    return accumulator;
  },
  {} as Record<string, DemoStateLink>,
);

export const slugToState: Record<string, AgentState> = demoStateLinks.reduce(
  (accumulator, link) => {
    accumulator[link.slug] = link.agentState;
    return accumulator;
  },
  {} as Record<string, AgentState>,
);

/** The canonical slug for a state — variant slugs are deliberately skipped. */
export function canonicalSlug(state: AgentState): string | null {
  return (
    demoStateLinks.find((link) => link.agentState === state && !link.variant)
      ?.slug ?? null
  );
}

/** The `?state=` slug in the current URL, if it names a known state. */
export function slugFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  const slug = new URLSearchParams(window.location.search).get("state");
  if (!slug) return null;
  return slug in slugToState ? slug : null;
}

export function setStateInUrl(slug: string | null): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (slug) {
    url.searchParams.set("state", slug);
  } else {
    url.searchParams.delete("state");
  }
  window.history.replaceState({}, "", url.toString());
}
