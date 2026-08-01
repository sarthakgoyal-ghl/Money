/**
 * Static content + prototype deep links for the /handover microsite.
 * Scenario numbers match `src/data/scenario.ts`. Slugs match `demoStates.ts`.
 */

/** Relative prototype URL — never a hardcoded hostname. */
export function protoHref(slug?: string): string {
  return slug ? `/?state=${encodeURIComponent(slug)}` : "/";
}

/** Full chapter map for top nav / chapter index. */
export const NAV_ITEMS = [
  { id: "overview", label: "Problem", number: "01" },
  { id: "principles", label: "Principles", number: "02" },
  { id: "system", label: "System", number: "03" },
  { id: "proposal", label: "Proposal", number: "04" },
  { id: "confirmation", label: "Confirm", number: "05" },
  { id: "repair", label: "Repair", number: "06" },
  { id: "handoff", label: "Handoff", number: "07" },
  { id: "execution", label: "Success", number: "08" },
  { id: "decisions", label: "Decisions", number: "09" },
  { id: "part-2", label: "Funnel", number: "10" },
  { id: "scope", label: "Build", number: "11" },
] as const;

/** Compact labels for mobile chapter bar. */
export const NAV_ITEMS_COMPACT = [
  { id: "overview", label: "Problem" },
  { id: "principles", label: "Principles" },
  { id: "system", label: "System" },
  { id: "confirmation", label: "Confirm" },
  { id: "repair", label: "Repair" },
  { id: "handoff", label: "Handoff" },
  { id: "part-2", label: "Funnel" },
  { id: "scope", label: "Build" },
] as const;

export const SCENARIO = {
  request:
    "My meeting moved. Get me to Bengaluru before 18:00 tomorrow. Keep the extra cost under ₹5,000, and don’t give me a middle seat.",
  current: {
    airline: "Air India",
    flightNo: "AI 621",
    route: "BOM → BLR",
    date: "Friday, 14 August",
    times: "20:35 → 22:25",
    seat: "14A",
    seatKind: "Window",
    bag: "15 kg checked baggage",
    fare: "Economy Classic",
    bookingRef: "R7KM4L",
  },
  recommended: {
    airline: "Air India",
    flightNo: "AI 639",
    route: "BOM → BLR",
    date: "Friday, 14 August",
    times: "14:10 → 16:00",
    seat: "12A",
    seatKind: "Window",
    bag: "15 kg checked baggage",
    fare: "Economy Classic",
    extra: "₹4,790",
  },
  alternative: {
    airline: "Air India",
    flightNo: "AI 647",
    route: "BOM → BLR",
    date: "Friday, 14 August",
    times: "15:20 → 17:10",
    seat: "15C",
    seatKind: "Aisle",
    extra: "₹3,840",
  },
  priceChange: {
    previous: "₹4,790",
    next: "₹6,240",
    increase: "₹1,450",
    overBudget: "₹1,240",
    budget: "₹5,000",
  },
  handoff: {
    payment: "₹4,790 authorised, not captured",
    ticket: "Not issued",
    current: "AI 621 still active",
    retries: "Paused",
    caseId: "TR-2048",
    specialist: "Priya",
  },
  success: {
    bookingRef: "Q8M4LX",
    payment: "Visa •••• 1842",
  },
} as const;

export type ScreenShot = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

/** Device-frame captures from the final implementation (402×874 @2x). */
export const SCREENS: Record<string, ScreenShot> = {
  assistant: {
    src: "/handover/screens/assistant.webp",
    alt: "Assistant interpreting the rebooking request over the BOM to BLR route.",
    width: 844,
    height: 1744,
  },
  proposal: {
    src: "/handover/screens/proposal.webp",
    alt: "Full-map proposal recommending AI 639 arriving at 16:00 for ₹4,790 extra.",
    width: 844,
    height: 1744,
  },
  alternatives: {
    src: "/handover/screens/alternatives.webp",
    alt: "Other Options sheet comparing AI 639 and AI 647 against the trip brief.",
    width: 844,
    height: 1744,
  },
  confirmation: {
    src: "/handover/screens/confirmation.webp",
    alt: "Review flight change sheet showing AI 621 versus AI 639 and Pay ₹4,790 & rebook.",
    width: 844,
    height: 1744,
  },
  payment: {
    src: "/handover/screens/payment-method.webp",
    alt: "Payment method sheet with Visa ending 1842 selected.",
    width: 844,
    height: 1744,
  },
  executing: {
    src: "/handover/screens/executing.webp",
    alt: "Execution progress issuing AI 639 before releasing AI 621.",
    width: 844,
    height: 1744,
  },
  success: {
    src: "/handover/screens/success.webp",
    alt: "Success summary You’re rebooked with booking Q8M4LX and seat 12A.",
    width: 844,
    height: 1744,
  },
  boarding: {
    src: "/handover/screens/boarding-pass.webp",
    alt: "Boarding pass for AI 639 seat 12A with activity trail.",
    width: 844,
    height: 1744,
  },
  priceChanged: {
    src: "/handover/screens/price-changed.webp",
    alt: "Price changed repair explaining the fare moved to ₹6,240 with AI 621 still active.",
    width: 844,
    height: 1744,
  },
  higherPrice: {
    src: "/handover/screens/higher-price-confirmation.webp",
    alt: "Reconfirmation for the new ₹6,240 total after the fare change.",
    width: 844,
    height: 1744,
  },
  misread: {
    src: "/handover/screens/misread.webp",
    alt: "AI misread repair clarifying arrive versus depart before 18:00.",
    width: 844,
    height: 1744,
  },
  handoff: {
    src: "/handover/screens/handoff.webp",
    alt: "Human handoff sheet for case TR-2048 with payment authorised and ticket not issued.",
    width: 844,
    height: 1744,
  },
  specialist: {
    src: "/handover/screens/specialist.webp",
    alt: "Chat with specialist Priya with case context already attached.",
    width: 844,
    height: 1744,
  },
  caseDetails: {
    src: "/handover/screens/case-details.webp",
    alt: "Case details showing payment, ticket, and booking status for TR-2048.",
    width: 844,
    height: 1744,
  },
  kept: {
    src: "/handover/screens/kept-current.webp",
    alt: "Kept current flight outcome confirming AI 621 was not changed.",
    width: 844,
    height: 1744,
  },
};

export type StateLink = {
  label: string;
  href: string;
  note?: string;
  group: "primary" | "repair" | "escalation" | "supporting";
};

export const STATE_LINKS: StateLink[] = [
  { label: "Assistant", href: protoHref("interpreting"), group: "primary" },
  { label: "Proposal", href: protoHref("proposal"), group: "primary" },
  { label: "Other Options", href: protoHref("alternatives"), group: "primary" },
  { label: "Confirmation", href: protoHref("confirmation"), group: "primary" },
  {
    label: "Payment Method",
    href: protoHref("confirmation"),
    note: "Opens confirmation — tap the payment row in-product",
    group: "primary",
  },
  { label: "Executing", href: protoHref("executing"), group: "primary" },
  { label: "Success", href: protoHref("success"), group: "primary" },
  { label: "Boarding Pass", href: protoHref("ticket"), group: "primary" },
  { label: "Price Changed", href: protoHref("price-change"), group: "repair" },
  { label: "AI Misread", href: protoHref("misread"), group: "repair" },
  { label: "Human Handoff", href: protoHref("handoff"), group: "escalation" },
  { label: "Priya Conversation", href: protoHref("support"), group: "escalation" },
  {
    label: "Case Details",
    href: protoHref("handoff"),
    note: "Opens handoff — open case details from that sheet",
    group: "escalation",
  },
  {
    label: "Kept Current Flight",
    href: protoHref("rejected"),
    group: "supporting",
  },
];

export const STATE_LINK_GROUPS = [
  { id: "primary", label: "Primary path" },
  { id: "repair", label: "Repair" },
  { id: "escalation", label: "Escalation" },
  { id: "supporting", label: "Supporting states" },
] as const;

export const PRINCIPLES = [
  {
    title: "Exact approval, not broad authority",
    body: "The user approves one flight, one seat, one payment method, and one exact total. The agent does not receive general permission to manage the trip.",
  },
  {
    title: "The original ticket remains the safety anchor",
    body: "AI 621 stays active until the replacement ticket is successfully issued.",
  },
  {
    title: "A material change requires a new decision",
    body: "If the flight, seat, time, fare, baggage, passenger, or payment method changes, the previous approval no longer applies.",
  },
  {
    title: "Repair only while the system state is known",
    body: "The agent may repair interpretation, availability, or fare problems before side effects occur. It stops when payment and ticket status disagree.",
  },
  {
    title: "Context travels with the handoff",
    body: "The specialist receives the original request, constraints, selected flight, approved amount, payment status, ticket status, and previous automated attempts.",
  },
] as const;

export const DECISIONS = [
  {
    title: "No general delegation",
    body: "The user approves one exact transaction rather than allowing the agent to broadly manage the trip.",
  },
  {
    title: "No automatic retry after a partial transaction",
    body: "Once payment and ticketing disagree, speed is less important than preventing a second financial side effect.",
  },
  {
    title: "No fake undo",
    body: "Rebooking again may involve a different fare, seat, fee, or availability check. Calling that an Undo would misrepresent the system.",
  },
  {
    title: "The current booking remains visible",
    body: "The original ticket remains the user’s safety anchor throughout proposal, confirmation, execution, failure, and handoff.",
  },
  {
    title: "Rejection is a successful outcome",
    body: "Keeping AI 621 is not an error or abandonment. It is a valid user decision.",
  },
] as const;

export const FUNNEL_STEPS = [
  { step: 1, name: "Signup start", entering: "100,000", complete: "82%" },
  { step: 2, name: "Phone and OTP", entering: "82,000", complete: "91%" },
  {
    step: 3,
    name: "ID document upload",
    entering: "74,600",
    complete: "61%",
    highlight: true,
    lost: "Approximately 29,100 users lost",
  },
  { step: 4, name: "Selfie liveness", entering: "45,500", complete: "88%" },
  { step: 5, name: "Account created", entering: "40,000", complete: "95%" },
] as const;

export const FUTURE_TESTS = [
  {
    name: "Approval comprehension",
    question:
      "Can users correctly repeat the flight, seat, amount, and consequence before approving?",
  },
  {
    name: "Confirmation efficiency",
    question:
      "How long does the decision take, and where do users hesitate or abandon?",
  },
  {
    name: "Material-change trust",
    question:
      "After the fare changes, do users understand that the old approval no longer applies and that nothing was charged?",
  },
  {
    name: "Repair quality",
    question:
      "Can users correct one misunderstood constraint without feeling that the task restarted?",
  },
  {
    name: "Handoff confidence",
    question:
      "Do users understand what happened, what remains safe, and what the specialist already knows?",
  },
] as const;
