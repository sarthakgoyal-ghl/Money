/**
 * Product marketing copy for the /web Voyage microsite.
 * Reuses prototype deep links and screen captures from the handover package.
 *
 * Trimmed spine: Why → Trust → Approve → Handoff → Success → Decisions → Try.
 */

export {
  protoHref,
  SCREENS,
  SCENARIO,
  STATE_LINKS,
  STATE_LINK_GROUPS,
  type ScreenShot,
  type StateLink,
} from "../handover/handoverData";

export const BRAND = {
  name: "Voyage",
  tagline: "Your AI travel agent",
} as const;

/** Chapter map for top nav: only sections present on /web. */
export const NAV_ITEMS = [
  { id: "overview", label: "Why Voyage", number: "01" },
  { id: "principles", label: "Trust", number: "02" },
  { id: "confirmation", label: "Approve", number: "03" },
  { id: "handoff", label: "Handoff", number: "04" },
  { id: "execution", label: "Success", number: "05" },
  { id: "decisions", label: "Why this way", number: "06" },
] as const;

export const PRINCIPLES = [
  {
    title: "Exact approval, not blank cheques",
    body: "You authorise one flight, one seat, one fare, and one payment method, not a vague spend limit. Voyage never gets open-ended permission to act on your trip.",
  },
  {
    title: "Your current ticket stays protected",
    body: "The original booking remains active until the replacement is successfully issued. Voyage never leaves you without a seat while it works.",
  },
  {
    title: "Material changes ask again",
    body: "If the fare, seat, or payment detail drifts from what you approved, Voyage stops and requests a new decision before anything irreversible happens.",
  },
  {
    title: "Stop before money gets messy",
    body: "Voyage can fix misunderstandings and fare changes before payment. When payment and ticket status disagree, automation pauses and a human takes over.",
  },
  {
    title: "Humans arrive with the full file",
    body: "When a specialist steps in, they already have your request, constraints, selected flight, payment status, and every automated attempt, so you never re-explain from scratch.",
  },
] as const;

export const DECISIONS = [
  {
    title: "No general delegation",
    body: "The confirm CTA names one flight, one seat, one payment method, and one exact total. Your search budget filters options; it never becomes blanket spend authority.",
  },
  {
    title: "No automatic retry after a partial transaction",
    body: "If payment is authorised but the new ticket is not issued, Voyage pauses retries. Another automated attempt could duplicate a charge or ticket, so a specialist steps in.",
  },
  {
    title: "No misleading undo",
    body: "Rebooking again may need a new fare, seat, or availability check. Calling that Undo would oversell what airline systems can actually reverse.",
  },
  {
    title: "The current booking stays visible",
    body: "From approval through execution and handoff, your original flight remains on screen until a replacement is issued, so you always know what is still safe.",
  },
  {
    title: "Keeping your flight is a valid outcome",
    body: "Saying no is not failure. Keeping the current booking is an explicit choice that leaves your trip unchanged.",
  },
] as const;

export const PRODUCT_PROMISES = [
  "Exact approval",
  "Original ticket protected",
  "Material change = new decision",
  "Stop before financial harm",
  "Human handoff with context",
  "No blind retries after partial payment",
] as const;
