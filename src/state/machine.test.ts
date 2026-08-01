import { describe, expect, it } from "vitest";
import {
  alternativeOption,
  currentBooking,
  initialConstraints,
  recommendedOption,
  repricedPrice,
  repricedTotal,
} from "../data/scenario";
import { approvalCovers, buildApproval } from "./approval";
import { initialModel, reducer, settledTotal } from "./machine";
import { findPaymentMethod } from "../data/scenario";

function approve(model = initialModel) {
  return reducer(model, { type: "APPROVE" });
}

describe("normal AI 639 path", () => {
  it("proposal → confirmation → approval ₹4,790 → execution → issue before release → success ₹4,790", () => {
    let model = reducer(initialModel, { type: "GO_TO", state: "proposal" });
    expect(model.selectedOption.flight.id).toBe("AI639");
    expect(model.activePrice.total).toBe(4790);

    model = reducer(model, { type: "GO_TO", state: "confirmation" });
    model = approve(model);
    expect(model.state).toBe("executing");
    expect(model.approval?.totalAmount).toBe(4790);
    expect(model.approval?.selectedFlightId).toBe("AI639");
    expect(model.approval?.seatNumber).toBe("12A");

    const release = model.execution.find((step) => step.id === "release");
    expect(release?.status).toBe("blocked");

    // Advance until issue completes; release must still be blocked until then.
    let issueDone = false;
    for (let i = 0; i < 8 && !issueDone; i += 1) {
      model = reducer(model, { type: "TICK_EXECUTION" });
      issueDone =
        model.execution.find((step) => step.id === "issue")?.status === "done";
      if (!issueDone) {
        expect(
          model.execution.find((step) => step.id === "release")?.status,
        ).toBe("blocked");
      }
    }
    expect(issueDone).toBe(true);
    // Once issued, release may leave `blocked` (pending/active/done) — never before.
    const releaseAfterIssue = model.execution.find((step) => step.id === "release");
    expect(releaseAfterIssue?.status).not.toBe("blocked");

    model = reducer(model, { type: "GO_TO", state: "success" });
    expect(settledTotal(model)).toBe(4790);
    expect(settledTotal(model)).not.toBe(repricedTotal);
  });
});

describe("AI 647 selection", () => {
  it("propagates seat 15C, 17:10, and ₹3,840 through approval and success", () => {
    let model = reducer(initialModel, {
      type: "SELECT_OPTION",
      option: alternativeOption,
      goToProposal: false,
    });
    expect(model.selectedOption.flight.id).toBe("AI647");
    expect(model.selectedOption.flight.seat.label).toBe("15C");
    expect(model.selectedOption.flight.arriveLabel).toBe("17:10");
    expect(model.activePrice.total).toBe(3840);

    model = approve(model);
    expect(model.approval?.selectedFlightId).toBe("AI647");
    expect(model.approval?.seatNumber).toBe("15C");
    expect(model.approval?.arrivalTime).toBe("17:10");
    expect(model.approval?.totalAmount).toBe(3840);

    model = reducer(model, { type: "GO_TO", state: "success" });
    expect(settledTotal(model)).toBe(3840);
    expect(model.selectedOption.flight.seat.label).toBe("15C");
  });
});

describe("rejection", () => {
  it("Keep AI 621 path charges nothing and leaves the original booking", () => {
    const model = reducer(initialModel, { type: "GO_TO", state: "rejected" });
    expect(model.state).toBe("rejected");
    expect(model.approval).toBeNull();
    expect(currentBooking.flightNo).toBe("AI 621");
    expect(currentBooking.seat.label).toBe("14A");
  });
});

describe("price change", () => {
  it("voids ₹4,790 approval, charges nothing, keeps AI 621 active", () => {
    let model = approve(initialModel);
    expect(model.approval?.totalAmount).toBe(4790);

    model = reducer(model, { type: "TRIGGER_PRICE_CHANGE" });
    expect(model.state).toBe("failure_price_changed");
    expect(model.approval).toBeNull();
    expect(model.activePrice.total).toBe(6240);
    expect(model.invalidation).not.toBeNull();
    expect(currentBooking.flightNo).toBe("AI 621");
  });

  it("higher-price review requires a new approval at ₹6,240", () => {
    let model = reducer(approve(initialModel), {
      type: "TRIGGER_PRICE_CHANGE",
    });
    model = reducer(model, { type: "REVIEW_REPRICED_OPTION" });
    expect(model.state).toBe("confirmation");
    expect(model.approval).toBeNull();
    expect(model.activePrice.total).toBe(6240);

    model = approve(model);
    expect(model.approval?.totalAmount).toBe(6240);
    model = reducer(model, { type: "GO_TO", state: "success" });
    expect(settledTotal(model)).toBe(6240);
  });
});

describe("AI misread", () => {
  it("depart constraint preserves budget, seat, and date", () => {
    const model = reducer(initialModel, {
      type: "SET_INTENT",
      intent: "depart_before",
    });
    expect(model.constraints.intent).toBe("depart_before");
    expect(model.constraints.maxExtraCost).toBe(initialConstraints.maxExtraCost);
    expect(model.constraints.seatPreference).toBe(
      initialConstraints.seatPreference,
    );
    expect(model.constraints.dateLong).toBe(initialConstraints.dateLong);
    expect(model.constraints.deadlineLabel).toBe("18:00");
    expect(model.state).toBe("proposal");
  });
});

describe("human handoff", () => {
  it("keeps authorised amount, no ticket, AI 621 active, no auto-retry", () => {
    let model = approve(initialModel);
    model = reducer(model, { type: "TRIGGER_HANDOFF" });
    expect(model.state).toBe("escalation_partial_transaction");
    expect(model.approval?.totalAmount).toBe(4790);
    expect(model.approval?.selectedFlightId).toBe("AI639");
    expect(currentBooking.flightNo).toBe("AI 621");
    // No further execution ticks are dispatched by the handoff transition.
    expect(model.execution.find((step) => step.id === "issue")?.status).not.toBe(
      "done",
    );
  });
});

describe("double submission", () => {
  it("accepts only the first APPROVE", () => {
    const first = approve(initialModel);
    const second = approve(first);
    expect(second).toBe(first);
    expect(second.approval?.totalAmount).toBe(4790);
    expect(second.state).toBe("executing");
  });
});

describe("approval material fields", () => {
  it("covers only an exact match of material fields", () => {
    const payment = findPaymentMethod(initialModel.paymentMethodId);
    const approved = buildApproval(
      recommendedOption.flight,
      recommendedOption.price,
      payment,
      "14:00",
    );
    const pending = buildApproval(
      recommendedOption.flight,
      repricedPrice,
      payment,
      "14:00",
    );
    expect(approvalCovers(approved, pending)).toBe(false);
    expect(approvalCovers(approved, approved)).toBe(true);
  });
});

describe("default brief", () => {
  it("initialises Other Options controls from the interpreted brief", () => {
    expect(initialConstraints.deadlineLabel).toBe("18:00");
    expect(initialConstraints.maxExtraCost).toBe(5000);
    expect(initialConstraints.seatPreference).toBe("Window or aisle");
    expect(initialConstraints.nonstopOnly).toBe(true);
  });
});
