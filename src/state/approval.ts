/**
 * Bounded Confirmation — the approval object.
 *
 * An approval is a snapshot of exactly what the user agreed to. It is not a
 * grant of authority to "manage the trip". If any material field differs at
 * execution time, the approval is void and a fresh, explicit approval is
 * required. There is no path that substitutes another option silently.
 */

import type { Flight, PaymentMethod, PriceBreakdown, SeatKind } from "../data/scenario";
import { formatINR, passenger } from "../data/scenario";

export interface ApprovalObject {
  passengerId: string;
  selectedFlightId: string;
  date: string;
  departureTime: string;
  arrivalTime: string;
  origin: string;
  destination: string;
  seatNumber: string;
  seatType: SeatKind;
  baggageAllowance: number;
  fareClass: string;
  totalAmount: number;
  currency: "INR";
  paymentMethodId: string;
  approvedAt: string;
}

/**
 * Every field above is material. Changing any of them between approval and
 * ticketing voids the approval — this list is the contract, not a heuristic.
 */
export const MATERIAL_FIELDS: ReadonlyArray<keyof ApprovalObject> = [
  "passengerId",
  "selectedFlightId",
  "date",
  "departureTime",
  "arrivalTime",
  "origin",
  "destination",
  "seatNumber",
  "seatType",
  "baggageAllowance",
  "fareClass",
  "totalAmount",
  "currency",
  "paymentMethodId",
];

const FIELD_LABELS: Record<keyof ApprovalObject, string> = {
  passengerId: "Passenger",
  selectedFlightId: "Flight",
  date: "Travel date",
  departureTime: "Departure time",
  arrivalTime: "Arrival time",
  origin: "Origin",
  destination: "Destination",
  seatNumber: "Seat",
  seatType: "Seat type",
  baggageAllowance: "Baggage allowance",
  fareClass: "Fare",
  totalAmount: "Total",
  currency: "Currency",
  paymentMethodId: "Payment method",
  approvedAt: "Approved at",
};

export interface MaterialDifference {
  field: keyof ApprovalObject;
  label: string;
  from: string;
  to: string;
}

export function buildApproval(
  flight: Flight,
  price: PriceBreakdown,
  payment: PaymentMethod,
  approvedAt: string,
): ApprovalObject {
  return {
    passengerId: passenger.id,
    selectedFlightId: flight.id,
    date: flight.dateISO,
    departureTime: flight.departLabel,
    arrivalTime: flight.arriveLabel,
    origin: flight.origin.code,
    destination: flight.destination.code,
    seatNumber: flight.seat.label,
    seatType: flight.seat.kind,
    baggageAllowance: flight.bagKg,
    fareClass: flight.fare,
    totalAmount: price.total,
    currency: "INR",
    paymentMethodId: payment.id,
    approvedAt,
  };
}

function displayValue(
  field: keyof ApprovalObject,
  value: ApprovalObject[keyof ApprovalObject],
): string {
  if (field === "totalAmount" && typeof value === "number") {
    return formatINR(value);
  }
  if (field === "baggageAllowance" && typeof value === "number") {
    return `${value} kg`;
  }
  return String(value);
}

/**
 * Material differences between what was approved and what is now on the table.
 * An empty array means the approval still covers the pending action.
 */
export function materialDifferences(
  approved: ApprovalObject,
  pending: ApprovalObject,
): MaterialDifference[] {
  return MATERIAL_FIELDS.filter(
    (field) => approved[field] !== pending[field],
  ).map((field) => ({
    field,
    label: FIELD_LABELS[field],
    from: displayValue(field, approved[field]),
    to: displayValue(field, pending[field]),
  }));
}

/** True when the approval still authorises the pending action. */
export function approvalCovers(
  approved: ApprovalObject | null,
  pending: ApprovalObject,
): boolean {
  if (!approved) return false;
  return materialDifferences(approved, pending).length === 0;
}
