/**
 * The composer's deterministic prompt vocabulary.
 *
 * The dock has a real text input, so it has to answer *something* for whatever
 * the reviewer types — but this prototype contains no model. Rather than fake
 * open-ended understanding, every prompt resolves through this table to one
 * concrete product action. Unmatched text is answered honestly ("I can help
 * with these") instead of being silently ignored, which is the failure mode a
 * dead input actually has.
 */

import { alternativeOption, formatINR } from "./scenario";

export type ComposerIntent =
  /** Open the brief for editing. */
  | "adjust_brief"
  /** Show the other flights that were compared. */
  | "show_alternatives"
  /** Switch to the cheaper option outright. */
  | "choose_cheaper"
  /** Abandon the change and keep the existing booking. */
  | "keep_current"
  /** Explain the recommendation. */
  | "explain_choice"
  /** Escalate to a person. */
  | "contact_human"
  /** Nothing matched. */
  | "unrecognised";

export interface ComposerPrompt {
  id: string;
  /** Shown as a tappable suggestion and inserted verbatim when tapped. */
  text: string;
  /** The assistant's reply, spoken before the surface changes. */
  reply: string;
  intent: ComposerIntent;
  /** Lowercase substrings that route free text to this prompt. */
  matches: readonly string[];
}

export const composerPrompts: readonly ComposerPrompt[] = [
  {
    id: "later",
    text: "Something later in the day",
    reply: "Opening your brief. Move the arrival deadline and I'll look again.",
    intent: "adjust_brief",
    matches: ["later", "earlier", "deadline", "change the time", "different time", "adjust", "brief"],
  },
  {
    id: "alternatives",
    text: "Show me the other options",
    reply: "Here's everything I compared, scored against your brief.",
    intent: "show_alternatives",
    matches: ["other option", "alternatives", "what else", "show me the other", "more options"],
  },
  {
    id: "cheaper",
    text: "Find something cheaper",
    reply: `${alternativeOption.flight.flightNo} is ${formatINR(alternativeOption.price.total)}. It lands later, so you keep less margin.`,
    intent: "choose_cheaper",
    matches: ["cheaper", "cheapest", "less money", "lower price", "save"],
  },
  {
    id: "why",
    text: "Why this flight?",
    reply: "It's the earliest nonstop arrival that keeps a non-middle seat within your limit.",
    intent: "explain_choice",
    matches: ["why", "explain", "how did you", "reason"],
  },
  {
    id: "keep",
    text: "Leave my booking alone",
    reply: "Understood. Nothing will be charged and nothing will be cancelled.",
    intent: "keep_current",
    matches: ["leave", "keep", "cancel the change", "don't change", "do not change", "never mind"],
  },
  {
    id: "human",
    text: "Talk to a person",
    reply: "Passing this to a travel specialist with everything already attached.",
    intent: "contact_human",
    matches: ["person", "human", "agent", "specialist", "support", "call", "priya"],
  },
];

/** The suggestions offered above the composer, in priority order. */
export const suggestedPrompts = composerPrompts.slice(0, 3);

const UNRECOGNISED: ComposerPrompt = {
  id: "unrecognised",
  text: "",
  reply:
    "I can only act on this trip in this prototype. Try adjusting the brief, comparing options, or asking for a person.",
  intent: "unrecognised",
  matches: [],
};

/**
 * Resolves typed text to a prompt. Deterministic and order-dependent: the first
 * prompt with a matching substring wins, so the same input always produces the
 * same action across reviews.
 */
export function resolveComposerPrompt(raw: string): ComposerPrompt {
  const text = raw.trim().toLowerCase();
  if (text.length === 0) return UNRECOGNISED;

  const exact = composerPrompts.find(
    (prompt) => prompt.text.toLowerCase() === text,
  );
  if (exact) return exact;

  const matched = composerPrompts.find((prompt) =>
    prompt.matches.some((needle) => text.includes(needle)),
  );
  return matched ?? UNRECOGNISED;
}
