/**
 * Single source of truth for the assignment scenario.
 *
 * Every constraint value, price, time and seat in the prototype is read from
 * here or derived from here — nothing is duplicated in a component. All
 * airline, fare, seat and payment behaviour is simulated; no network call is
 * made and no charge is issued.
 */

export type SeatKind = "window" | "aisle" | "middle";
export type FareClass = "Economy Classic" | "Economy Comfort" | "Business";
export type SeatPreference = "Window" | "Aisle" | "Window or aisle" | "Any";

/** Which clock the user's 18:00 deadline refers to. */
export type DeadlineIntent = "arrive_before" | "depart_before";

export interface Airport {
  code: string;
  city: string;
  /** Real coordinates — projected by `src/components/journey/geo.ts`. */
  lat: number;
  lon: number;
}

export interface Seat {
  label: string;
  kind: SeatKind;
}

export interface Flight {
  id: string;
  airline: string;
  flightNo: string;
  origin: Airport;
  destination: Airport;
  dateISO: string;
  /** "Fri, 14 Aug" */
  dateShort: string;
  /** "Friday, 14 August" */
  dateLong: string;
  departLabel: string;
  arriveLabel: string;
  durationLabel: string;
  stops: number;
  fare: FareClass;
  seat: Seat;
  bagKg: number;
  bookingRef?: string;
}

export interface PriceBreakdown {
  fareDifference: number;
  changeFee: number;
  taxDifference: number;
  total: number;
}

export interface FlightOption {
  flight: Flight;
  price: PriceBreakdown;
  recommended: boolean;
}

export interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  label: string;
  /** Simulated methods the user can actually switch between. */
  available: boolean;
}

/* ------------------------------------------------------------------ *
 * Time helpers — labels are the source of truth, minutes are derived. *
 * ------------------------------------------------------------------ */

/** "14:10" / "18:00" -> minutes past midnight. Throws on malformed input. */
export function toMinutes(label: string): number {
  const match = /^(\d{1,2}):(\d{2})$/.exec(label.trim());
  if (!match) {
    throw new Error(`Unparseable time label: "${label}"`);
  }
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) {
    throw new Error(`Out-of-range time label: "${label}"`);
  }
  return hour * 60 + minute;
}

/** 385 -> "6h 25m", 120 -> "2h", 45 -> "45m". */
export function formatDuration(minutes: number): string {
  const abs = Math.max(0, Math.round(minutes));
  const hours = Math.floor(abs / 60);
  const mins = abs % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

export const formatINR = (amount: number): string =>
  `₹${Math.round(amount).toLocaleString("en-IN")}`;

/* --------------------- *
 * Static scenario facts *
 * --------------------- */

/**
 * Airport coordinates, not city centres — the route has to terminate at the
 * runways it actually uses. BOM = Chhatrapati Shivaji Maharaj Intl,
 * BLR = Kempegowda Intl (which sits ~35 km north of the city centre).
 */
export const BOM: Airport = {
  code: "BOM",
  city: "Mumbai",
  lat: 19.0887,
  lon: 72.8679,
};

export const BLR: Airport = {
  code: "BLR",
  city: "Bengaluru",
  lat: 13.1979,
  lon: 77.7063,
};

export const passenger = {
  id: "pax-1",
  fullName: "Sarthak G.",
  initials: "SG",
} as const;

export const paymentMethods: PaymentMethod[] = [
  {
    id: "pm-visa-1842",
    brand: "Visa",
    last4: "1842",
    label: "Visa •••• 1842",
    available: true,
  },
  {
    id: "pm-mc-8820",
    brand: "Mastercard",
    last4: "8820",
    label: "Mastercard •••• 8820",
    available: true,
  },
];

export const defaultPaymentMethodId = paymentMethods[0].id;

export function findPaymentMethod(id: string): PaymentMethod {
  const found = paymentMethods.find((m) => m.id === id);
  if (!found) throw new Error(`Unknown simulated payment method: ${id}`);
  return found;
}

/** The user's request, verbatim. Nothing in the UI may restate it differently. */
export const userRequest =
  "My meeting moved. Get me to Bengaluru before 18:00 tomorrow. Keep the extra cost under ₹5,000, and don't give me a middle seat.";

/** The user's follow-up in the misunderstanding scenario. */
export const userCorrection =
  "No. I meant the flight should depart before 18:00, not arrive before 18:00.";

/**
 * What the agent understood, mapped one-to-one onto the request above:
 *   "before 18:00"         -> deadlineLabel 18:00, intent arrive_before
 *   "under ₹5,000"         -> maxExtraCost 5000
 *   "no middle seat"       -> seatPreference "Window or aisle"
 *   "tomorrow" (unchanged) -> keepDate, Friday 14 August
 */
export const interpretation = {
  deadlineLabel: "18:00",
  intent: "arrive_before" as DeadlineIntent,
  maxExtraCost: 5000,
  seatPreference: "Window or aisle" as SeatPreference,
  keepDate: true,
  dateLong: "Friday, 14 August",
} as const;

const DATE_ISO = "2026-08-14";
const DATE_SHORT = "Fri, 14 Aug";
const DATE_LONG = "Friday, 14 August";

export const currentBooking: Flight = {
  id: "AI621",
  airline: "Air India",
  flightNo: "AI 621",
  origin: BOM,
  destination: BLR,
  dateISO: DATE_ISO,
  dateShort: DATE_SHORT,
  dateLong: DATE_LONG,
  departLabel: "20:35",
  arriveLabel: "22:25",
  durationLabel: "1h 50m",
  stops: 0,
  fare: "Economy Classic",
  seat: { label: "14A", kind: "window" },
  bagKg: 15,
  bookingRef: "R7KM4L",
};

const recommendedFlight: Flight = {
  id: "AI639",
  airline: "Air India",
  flightNo: "AI 639",
  origin: BOM,
  destination: BLR,
  dateISO: DATE_ISO,
  dateShort: DATE_SHORT,
  dateLong: DATE_LONG,
  departLabel: "14:10",
  arriveLabel: "16:00",
  durationLabel: "1h 50m",
  stops: 0,
  fare: "Economy Classic",
  seat: { label: "12A", kind: "window" },
  bagKg: 15,
};

const alternativeFlight: Flight = {
  id: "AI647",
  airline: "Air India",
  flightNo: "AI 647",
  origin: BOM,
  destination: BLR,
  dateISO: DATE_ISO,
  dateShort: DATE_SHORT,
  dateLong: DATE_LONG,
  departLabel: "15:20",
  arriveLabel: "17:10",
  durationLabel: "1h 50m",
  stops: 0,
  fare: "Economy Classic",
  seat: { label: "15C", kind: "aisle" },
  bagKg: 15,
};

/** One-stop option — only matches when Nonstop only is off. */
const connectingFlight: Flight = {
  id: "AI673",
  airline: "Air India",
  flightNo: "AI 673",
  origin: BOM,
  destination: BLR,
  dateISO: DATE_ISO,
  dateShort: DATE_SHORT,
  dateLong: DATE_LONG,
  departLabel: "12:40",
  arriveLabel: "17:35",
  durationLabel: "4h 55m",
  stops: 1,
  fare: "Economy Classic",
  seat: { label: "21D", kind: "aisle" },
  bagKg: 15,
};

export const recommendedOption: FlightOption = {
  flight: recommendedFlight,
  price: {
    fareDifference: 1990,
    changeFee: 2500,
    taxDifference: 300,
    total: 4790,
  },
  recommended: true,
};

export const alternativeOption: FlightOption = {
  flight: alternativeFlight,
  price: {
    fareDifference: 1340,
    changeFee: 2500,
    taxDifference: 0,
    total: 3840,
  },
  recommended: false,
};

export const connectingOption: FlightOption = {
  flight: connectingFlight,
  price: {
    fareDifference: 490,
    changeFee: 2500,
    taxDifference: 0,
    total: 2990,
  },
  recommended: false,
};

export const flightOptions: FlightOption[] = [
  recommendedOption,
  alternativeOption,
  connectingOption,
];

/** How many flights the agent searched before proposing. */
export const flightsCompared = 18;

/** The airline's reprice in the price-change failure scenario. */
export const repricedTotal = 6240;

/** How much the airline added: ₹4,790 -> ₹6,240. */
export const repricedIncrease = repricedTotal - recommendedOption.price.total;

/**
 * Only the fare difference moves; the change fee and taxes are unchanged. The
 * breakdown is derived from the total so the rows can never stop summing to it.
 */
export const repricedPrice: PriceBreakdown = {
  fareDifference:
    repricedTotal -
    recommendedOption.price.changeFee -
    recommendedOption.price.taxDifference,
  changeFee: recommendedOption.price.changeFee,
  taxDifference: recommendedOption.price.taxDifference,
  total: repricedTotal,
};

export const successBooking = {
  newBookingRef: "Q8M4LX",
} as const;

export const supportCase = {
  id: "TR-2048",
} as const;

/**
 * The human this case escalates to. Named, because "a specialist" is an
 * abstraction and the point of the handoff is that a specific person now owns
 * the problem. One definition so every surface calls them the same thing.
 */
export const specialist = {
  name: "Priya",
  role: "Air India specialist",
  initials: "P",
} as const;

/**
 * The arrival deadlines offered when adjusting the brief.
 *
 * Centred on 18:00 (what the user asked for), with one option either side —
 * so the control reads as "loosen or tighten what I said" rather than an
 * unrelated set of times.
 */
export const deadlineChoices = [
  { value: "17:00", label: "17:00" },
  { value: "18:00", label: "18:00" },
  { value: "19:00", label: "19:00" },
] as const;

export const budgetChoices = [
  { value: "3000", label: "₹3,000" },
  { value: "5000", label: "₹5,000" },
  { value: "8000", label: "₹8,000" },
] as const;

/** Wall-clock HH:MM in 24h — matches itinerary times across the app. */
export function formatClock24(at: number | Date = Date.now()): string {
  const date = typeof at === "number" ? new Date(at) : at;
  const parts = new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const hour = parts.find((part) => part.type === "hour")?.value ?? "00";
  const minute = parts.find((part) => part.type === "minute")?.value ?? "00";
  return `${hour}:${minute}`;
}

/** Epoch-ms stamps for the success / boarding-pass activity trail. */
export interface ActivityTrail {
  requestedAt: number;
  approvedAt: number;
  issuedAt: number | null;
  releasedAt: number | null;
}

/**
 * Completed trail anchored to wall clock — used when jumping straight to
 * success via the demo menu / URL without a live execution run.
 */
export function synthesiseActivityTrail(now = Date.now()): ActivityTrail {
  return {
    requestedAt: now - 120_000,
    approvedAt: now - 90_000,
    issuedAt: now - 45_000,
    releasedAt: now - 15_000,
  };
}

/** Fill any missing issue/release stamps without shifting earlier events. */
export function completeActivityTrail(
  trail: ActivityTrail | null,
  now = Date.now(),
): ActivityTrail {
  if (!trail) return synthesiseActivityTrail(now);
  return {
    requestedAt: trail.requestedAt,
    approvedAt: trail.approvedAt,
    issuedAt: trail.issuedAt ?? now - 30_000,
    releasedAt: trail.releasedAt ?? now - 10_000,
  };
}

/**
 * Live wall-clock labels for legacy surfaces that still read the old shape.
 * Prefer stamping `ActivityTrail` on the agent model for the boarding pass.
 */
export const activityClock = {
  get requested() {
    return formatClock24(Date.now() - 120_000);
  },
  get approved() {
    return formatClock24(Date.now() - 90_000);
  },
  get issued() {
    return formatClock24(Date.now() - 45_000);
  },
  get released() {
    return formatClock24(Date.now() - 15_000);
  },
};

/* ------------------------------------------------ *
 * Derived values — never recomputed in components. *
 * ------------------------------------------------ */

export interface TripConstraints {
  deadlineLabel: string;
  intent: DeadlineIntent;
  maxExtraCost: number;
  seatPreference: SeatPreference;
  keepDate: boolean;
  dateLong: string;
  /**
   * Nonstop-only. Default brief turns this on so Other Options controls match
   * the interpreted constraints; turning it off admits one-stop options.
   */
  nonstopOnly: boolean;
}

export const initialConstraints: TripConstraints = {
  deadlineLabel: interpretation.deadlineLabel,
  intent: interpretation.intent,
  maxExtraCost: interpretation.maxExtraCost,
  seatPreference: interpretation.seatPreference,
  keepDate: interpretation.keepDate,
  dateLong: interpretation.dateLong,
  nonstopOnly: true,
};

export interface OptionFit {
  /** Meets the deadline on whichever clock the user meant. */
  meetsDeadline: boolean;
  withinBudget: boolean;
  seatMatches: boolean;
  nonstopMatches: boolean;
  matchesAll: boolean;
  /** Minutes of slack against the deadline. Negative when late. */
  minutesBeforeDeadline: number;
  /** `maxExtraCost - total`. Negative when over budget. */
  budgetHeadroom: number;
  /** How much earlier this option arrives than the current booking. */
  minutesEarlierThanCurrent: number;
}

function seatSatisfies(seat: Seat, preference: SeatPreference): boolean {
  switch (preference) {
    case "Window":
      return seat.kind === "window";
    case "Aisle":
      return seat.kind === "aisle";
    case "Window or aisle":
      return seat.kind !== "middle";
    case "Any":
      return true;
  }
}

/**
 * The one place option-versus-constraint questions are answered.
 * `price` is passed separately so a repriced option can be evaluated without
 * mutating the fixture.
 */
export function fitOption(
  option: FlightOption,
  constraints: TripConstraints,
  price: PriceBreakdown = option.price,
): OptionFit {
  const deadline = toMinutes(constraints.deadlineLabel);
  const relevant =
    constraints.intent === "arrive_before"
      ? toMinutes(option.flight.arriveLabel)
      : toMinutes(option.flight.departLabel);

  const minutesBeforeDeadline = deadline - relevant;
  const budgetHeadroom = constraints.maxExtraCost - price.total;
  const meetsDeadline = minutesBeforeDeadline >= 0;
  const withinBudget = budgetHeadroom >= 0;
  const seatMatches = seatSatisfies(option.flight.seat, constraints.seatPreference);
  const nonstopMatches = !constraints.nonstopOnly || option.flight.stops === 0;

  return {
    meetsDeadline,
    withinBudget,
    seatMatches,
    nonstopMatches,
    matchesAll: meetsDeadline && withinBudget && seatMatches && nonstopMatches,
    minutesBeforeDeadline,
    budgetHeadroom,
    minutesEarlierThanCurrent:
      toMinutes(currentBooking.arriveLabel) -
      toMinutes(option.flight.arriveLabel),
  };
}

/** Options that satisfy the current brief — drives the live match count. */
export function matchingOptions(
  constraints: TripConstraints,
  options: FlightOption[] = flightOptions,
): FlightOption[] {
  return options
    .filter((option) => fitOption(option, constraints).matchesAll)
    .sort(
      (a, b) =>
        toMinutes(a.flight.arriveLabel) - toMinutes(b.flight.arriveLabel),
    );
}

/** "Arrive by 18:00" / "Depart by 18:00" */
export function deadlineSentence(constraints: TripConstraints): string {
  const verb = constraints.intent === "arrive_before" ? "Arrive" : "Depart";
  return `${verb} by ${constraints.deadlineLabel}`;
}

/* ------------------------------------------------------------------ *
 * Assistant conversation content.                                     *
 *                                                                     *
 * Only the first screen is conversational, so this is the only place    *
 * chat copy lives.                                                     *
 * ------------------------------------------------------------------ */

export const assistantMeta = {
  /** The date separator above the first message. */
  timestampLabel: "Today at 15:15",
  /** "Thought for 7s" — the collapsed activity disclosure. */
  thoughtSeconds: 7,
  /** How long ago the fare and seat were verified. */
  freshnessLabel: "32 seconds ago",
  composerPlaceholder: "Ask about this trip…",
} as const;

/**
 * What the assistant did, in plain product terms.
 *
 * Deliberately an action trace, not reasoning: expanding the disclosure shows
 * the steps taken against real systems, never model deliberation.
 */
export const activityTrace: readonly string[] = [
  "Read current booking",
  "Checked fare conditions",
  `Compared ${flightsCompared} flights`,
  "Verified seats and prices",
];

/**
 * The interpreted brief, as the four lines the assistant reads back —
 * Figma `1204:80721`…`80731`. Seat line matches `seatPreference`.
 */
export const understoodBrief: readonly string[] = [
  "Arrive in Bengaluru before 18:00",
  "Spend no more than ₹5,000 extra",
  "Window or aisle",
  "Keep the same travel date",
];

/** Structured copy for "Why this option" — Figma `1204:80786` medium spans. */
export interface RecommendationReasonParts {
  lead: string;
  seatPhrase: string;
  headroom: string;
  earlier: string;
  flightNo: string;
}

/** Why the recommended option won, in the assistant's voice. */
export function recommendationReasonParts(
  option: FlightOption,
  constraints: TripConstraints = initialConstraints,
): RecommendationReasonParts {
  const fit = fitOption(option, constraints);
  const seatPhrase =
    option.flight.seat.kind === "window"
      ? "window-seat preference"
      : option.flight.seat.kind === "aisle"
        ? "aisle-seat preference"
        : "seat preference";
  return {
    lead:
      option.flight.stops === 0 ? "Earliest nonstop that" : "Earliest option that",
    seatPhrase,
    headroom: formatINR(Math.abs(fit.budgetHeadroom)),
    earlier: formatDuration(fit.minutesEarlierThanCurrent),
    flightNo: currentBooking.flightNo,
  };
}

/** Plain-string form — disclosures / non-JSX surfaces. */
export function recommendationReason(
  option: FlightOption,
  constraints: TripConstraints = initialConstraints,
): string {
  const parts = recommendationReasonParts(option, constraints);
  return (
    `${parts.lead} keeps your ${parts.seatPhrase} ` +
    `and stays ${parts.headroom} under your limit. You arrive ` +
    `${parts.earlier} earlier than ${parts.flightNo}.`
  );
}

/** Card / route label for stop count. */
export function stopsLabel(stops: number): string {
  if (stops === 0) return "Nonstop";
  if (stops === 1) return "1 stop";
  return `${stops} stops`;
}

/** The long-form brief line used above the refine controls. */
export function briefSummary(constraints: TripConstraints): string {
  return [
    deadlineSentence(constraints),
    `Up to ${formatINR(constraints.maxExtraCost)}`,
    constraints.seatPreference === "Window or aisle"
      ? "Window or aisle"
      : `${constraints.seatPreference} seat`,
  ].join(" · ");
}
