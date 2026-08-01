/**
 * The context packet handed to a human specialist.
 *
 * Built from the live model so the case can never disagree with what the user
 * saw. This is what makes the handoff honest: the specialist starts with the
 * request, the constraints, the exact approved amount, and both sides of the
 * partial transaction — so the user is never asked to retell the story.
 */

import type { Flight, PaymentMethod, PriceBreakdown, TripConstraints } from "./scenario";
import {
  briefSummary,
  currentBooking,
  formatINR,
  passenger,
  userRequest,
} from "./scenario";

export interface CaseContextEntry {
  label: string;
  value: string;
  /** Longer entries render as a block rather than a right-aligned value. */
  block?: boolean;
}

export function buildCaseContext(
  flight: Flight,
  price: PriceBreakdown,
  payment: PaymentMethod,
  constraints: TripConstraints,
): CaseContextEntry[] {
  return [
    { label: "Passenger", value: passenger.fullName },
    { label: "Original request", value: userRequest, block: true },
    { label: "Constraints", value: briefSummary(constraints), block: true },
    {
      label: "Selected flight",
      value: `${flight.airline} ${flight.flightNo} · ${flight.origin.code}→${flight.destination.code} · ${flight.dateShort} · ${flight.departLabel}–${flight.arriveLabel} · Seat ${flight.seat.label}`,
      block: true,
    },
    { label: "Approved amount", value: `${formatINR(price.total)} (exact)` },
    {
      label: "Payment status",
      value: `${formatINR(price.total)} authorised on ${payment.label}, not captured`,
      block: true,
    },
    { label: "New ticket status", value: "Not issued" },
    {
      label: "Current ticket",
      value: `${currentBooking.flightNo} · Seat ${currentBooking.seat.label} · still active`,
      block: true,
    },
    { label: "Retry status", value: "Paused — no automated retry" },
    {
      label: "Airline response",
      value:
        "Air India inventory service returned no ticket number after payment authorisation (timeout on issuance confirmation).",
      block: true,
    },
    { label: "Automated attempts", value: "1 issuance attempt, 0 retries" },
    {
      label: "Why retries are paused",
      value:
        "A second issuance attempt against an authorised payment could produce a duplicate charge and a duplicate ticket. Only a person can safely reconcile this.",
      block: true,
    },
  ];
}
