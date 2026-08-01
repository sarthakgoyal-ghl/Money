import type {
  FlightOption,
  PriceBreakdown,
  TripConstraints,
} from "../data/scenario";
import type { ActivityTrail } from "../data/scenario";
import {
  currentBooking,
  defaultPaymentMethodId,
  findPaymentMethod,
  flightOptions,
  completeActivityTrail,
  formatClock24,
  initialConstraints,
  recommendedOption,
  repricedPrice,
  synthesiseActivityTrail,
} from "../data/scenario";
import type { ApprovalObject } from "./approval";
import { buildApproval, materialDifferences } from "./approval";
import type { MaterialDifference } from "./approval";

export type AgentState =
  | "interpreting"
  | "proposal"
  | "adjust_request"
  | "alternatives"
  | "confirmation"
  | "rejected"
  | "executing"
  | "success"
  | "failure_price_changed"
  | "failure_misread"
  | "escalation_partial_transaction";

export type ExecutionStepStatus = "pending" | "active" | "done" | "blocked";

export interface ExecutionStep {
  id: string;
  label: string;
  status: ExecutionStepStatus;
}

/** Re-exported so screens have one import for the constraint type. */
export type Constraints = TripConstraints;

export interface AgentModel {
  state: AgentState;
  constraints: TripConstraints;
  selectedOption: FlightOption;
  /**
   * The price currently on the table. Normally the option's own price; replaced
   * by the airline's reprice in the price-change scenario.
   */
  activePrice: PriceBreakdown;
  alternatives: FlightOption[];
  paymentMethodId: string;
  execution: ExecutionStep[];
  /** Null whenever no live approval covers the pending action. */
  approval: ApprovalObject | null;
  /** Why a previous approval stopped applying. Empty when none was voided. */
  invalidation: {
    reason: string;
    differences: MaterialDifference[];
  } | null;
  /** Bumped whenever the agent re-runs a search or refreshes live data. */
  searchNonce: number;
  /** Human-readable freshness of fare and seat data. */
  freshnessLabel: string;
  /** Wall-clock activity trail for success / boarding pass. */
  activityTrail: ActivityTrail | null;
}

export type AgentAction =
  | { type: "GO_TO"; state: AgentState }
  | { type: "SELECT_OPTION"; option: FlightOption; goToProposal?: boolean }
  | { type: "UPDATE_CONSTRAINTS"; patch: Partial<TripConstraints> }
  | { type: "SET_INTENT"; intent: TripConstraints["intent"] }
  | { type: "SET_PAYMENT_METHOD"; paymentMethodId: string }
  | { type: "APPROVE" }
  | { type: "TICK_EXECUTION" }
  | { type: "TRIGGER_PRICE_CHANGE" }
  | { type: "REVIEW_REPRICED_OPTION" }
  | { type: "TRIGGER_HANDOFF" }
  | { type: "REFRESH_LIVE_DATA" }
  | { type: "RESET_TO_PROPOSAL" };

/**
 * Execution order is a safety property, not a presentation choice: the
 * replacement ticket must exist before the original is released. The release
 * step is therefore `blocked` — visibly gated — until issuance completes.
 */
function buildExecution(option: FlightOption): ExecutionStep[] {
  const { flight } = option;
  return [
    { id: "recheck", label: "Rechecking fare and seat", status: "pending" },
    {
      id: "secure",
      label: `Securing ${flight.flightNo} and seat ${flight.seat.label}`,
      status: "pending",
    },
    { id: "issue", label: "Issuing the replacement ticket", status: "pending" },
    {
      id: "release",
      label: `Releasing ${currentBooking.flightNo}`,
      status: "blocked",
    },
  ];
}

/** Default landing = full assistant proposal thread (`1204:80683`). */
export const initialModel: AgentModel = {
  state: "proposal",
  constraints: initialConstraints,
  selectedOption: recommendedOption,
  activePrice: recommendedOption.price,
  alternatives: flightOptions,
  paymentMethodId: defaultPaymentMethodId,
  execution: buildExecution(recommendedOption),
  approval: null,
  invalidation: null,
  searchNonce: 0,
  freshnessLabel: "32 seconds ago",
  activityTrail: null,
};

/**
 * Advance one step. The gated release step only unblocks once issuance is
 * `done`, so no tick order can ever show the original as released first.
 */
function advanceExecution(steps: ExecutionStep[]): ExecutionStep[] {
  const next = steps.map((step) => ({ ...step }));
  const activeIndex = next.findIndex((step) => step.status === "active");

  if (activeIndex !== -1) {
    next[activeIndex].status = "done";
  }

  const issueIndex = next.findIndex((step) => step.id === "issue");
  const releaseIndex = next.findIndex((step) => step.id === "release");
  const ticketIssued = issueIndex !== -1 && next[issueIndex].status === "done";

  if (releaseIndex !== -1 && next[releaseIndex].status === "blocked" && ticketIssued) {
    next[releaseIndex].status = "pending";
  }

  const nextPending = next.findIndex(
    (step, index) => step.status === "pending" && index > activeIndex,
  );
  if (nextPending !== -1) {
    next[nextPending].status = "active";
  }

  return next;
}

/**
 * Snapshot of what is currently on the table, in approval shape — used to test
 * an existing approval against the present state.
 */
function pendingApproval(model: AgentModel): ApprovalObject {
  return buildApproval(
    model.selectedOption.flight,
    model.activePrice,
    findPaymentMethod(model.paymentMethodId),
    model.approval?.approvedAt ?? "",
  );
}

/**
 * Void an approval whose material fields no longer match, and record why.
 * Called after every action that can move a material field.
 */
function reconcileApproval(model: AgentModel, reason: string): AgentModel {
  if (!model.approval) return model;

  const differences = materialDifferences(model.approval, pendingApproval(model));
  if (differences.length === 0) return model;

  return {
    ...model,
    approval: null,
    invalidation: { reason, differences },
  };
}

export function reducer(model: AgentModel, action: AgentAction): AgentModel {
  switch (action.type) {
    case "GO_TO": {
      const enteringExecution = action.state === "executing";

      // Reaching success without a live approval can only happen by jumping
      // states directly (demo menu / URL). Synthesise the approval from the
      // selected option's *own* price rather than inheriting whatever fare was
      // last on screen — otherwise a visit to the reprice state leaks ₹6,240
      // into a normal success.
      if (action.state === "success" && !model.approval) {
        const trail = synthesiseActivityTrail();
        return {
          ...model,
          state: "success",
          activePrice: model.selectedOption.price,
          approval: buildApproval(
            model.selectedOption.flight,
            model.selectedOption.price,
            findPaymentMethod(model.paymentMethodId),
            formatClock24(trail.approvedAt),
          ),
          invalidation: null,
          activityTrail: trail,
        };
      }

      const enteringSuccess = action.state === "success";

      return {
        ...model,
        state: action.state,
        execution: enteringExecution
          ? buildExecution(model.selectedOption)
          : model.execution,
        activityTrail: enteringSuccess
          ? completeActivityTrail(model.activityTrail)
          : model.activityTrail,
        // Returning to the proposal clears a stale explanation, but never
        // resurrects an approval — that requires an explicit APPROVE.
        invalidation:
          action.state === "proposal" || action.state === "interpreting"
            ? null
            : model.invalidation,
      };
    }

    case "SELECT_OPTION": {
      const next: AgentModel = {
        ...model,
        selectedOption: action.option,
        activePrice: action.option.price,
        execution: buildExecution(action.option),
        state: action.goToProposal === false ? model.state : "proposal",
        freshnessLabel: "just now",
      };
      return reconcileApproval(next, "You selected a different flight.");
    }

    case "UPDATE_CONSTRAINTS": {
      const constraints = { ...model.constraints, ...action.patch };
      return {
        ...model,
        constraints,
        searchNonce: model.searchNonce + 1,
        freshnessLabel: "just now",
      };
    }

    case "SET_INTENT": {
      // Only the misread constraint changes. Budget, seat and date are
      // deliberately untouched.
      return {
        ...model,
        constraints: { ...model.constraints, intent: action.intent },
        state: "proposal",
        searchNonce: model.searchNonce + 1,
        freshnessLabel: "just now",
        invalidation: null,
        approval: null,
      };
    }

    case "SET_PAYMENT_METHOD": {
      // Payment method is a material field.
      const next: AgentModel = {
        ...model,
        paymentMethodId: action.paymentMethodId,
      };
      return reconcileApproval(next, "You changed the payment method.");
    }

    case "APPROVE": {
      // Idempotent: ignore repeat activations once execution or success has
      // started. Sequential double-dispatches in the same tick also no-op after
      // the first transition into `executing`.
      if (model.state === "executing" || model.state === "success") {
        return model;
      }

      const now = Date.now();
      return {
        ...model,
        approval: buildApproval(
          model.selectedOption.flight,
          model.activePrice,
          findPaymentMethod(model.paymentMethodId),
          formatClock24(now),
        ),
        invalidation: null,
        state: "executing",
        execution: buildExecution(model.selectedOption),
        activityTrail: {
          requestedAt: now - 60_000,
          approvedAt: now,
          issuedAt: null,
          releasedAt: null,
        },
      };
    }

    case "TICK_EXECUTION": {
      const previous = model.execution;
      const execution = advanceExecution(previous);
      const now = Date.now();
      let activityTrail = model.activityTrail;

      const issueJustDone =
        previous.find((step) => step.id === "issue")?.status !== "done" &&
        execution.find((step) => step.id === "issue")?.status === "done";
      const releaseJustDone =
        previous.find((step) => step.id === "release")?.status !== "done" &&
        execution.find((step) => step.id === "release")?.status === "done";

      if (issueJustDone || releaseJustDone) {
        activityTrail = {
          requestedAt: activityTrail?.requestedAt ?? now - 60_000,
          approvedAt: activityTrail?.approvedAt ?? now,
          issuedAt: issueJustDone
            ? now
            : (activityTrail?.issuedAt ?? null),
          releasedAt: releaseJustDone
            ? now
            : (activityTrail?.releasedAt ?? null),
        };
      }

      return { ...model, execution, activityTrail };
    }

    case "TRIGGER_PRICE_CHANGE": {
      // The airline reprices. The total is material, so the approval is void
      // and cannot be reused for the new amount.
      const repriced: AgentModel = {
        ...model,
        state: "failure_price_changed",
        activePrice: repricedPrice,
        freshnessLabel: "just now",
      };
      const reconciled = reconcileApproval(
        repriced,
        "Air India repriced this option after you approved it.",
      );
      return {
        ...reconciled,
        // Guarantee an explanation even if there was no live approval to void
        // (e.g. the state was opened directly from the demo menu).
        invalidation:
          reconciled.invalidation ?? {
            reason: "Air India repriced this option.",
            differences: [
              {
                field: "totalAmount",
                label: "Total",
                from: `₹${recommendedOption.price.total.toLocaleString("en-IN")}`,
                to: `₹${repricedPrice.total.toLocaleString("en-IN")}`,
              },
            ],
          },
      };
    }

    case "REVIEW_REPRICED_OPTION": {
      // Reviewing the higher price is allowed, but it is a brand new decision:
      // the approval stays null until the user approves the new amount.
      return {
        ...model,
        state: "confirmation",
        activePrice: repricedPrice,
        approval: null,
      };
    }

    case "TRIGGER_HANDOFF": {
      // Ensure an approval snapshot exists so specialist context / case details
      // bind to the selected flight and exact amount (authorised, not captured).
      const approval =
        model.approval ??
        buildApproval(
          model.selectedOption.flight,
          model.selectedOption.price,
          findPaymentMethod(model.paymentMethodId),
          formatClock24(Date.now()),
        );
      return {
        ...model,
        state: "escalation_partial_transaction",
        approval,
        activePrice: {
          ...model.selectedOption.price,
          total: approval.totalAmount,
        },
      };
    }

    case "REFRESH_LIVE_DATA": {
      // Deterministic: re-check the same fare/seat; stamp freshness for the UI.
      return {
        ...model,
        freshnessLabel: "just now",
        searchNonce: model.searchNonce + 1,
      };
    }

    case "RESET_TO_PROPOSAL": {
      return {
        ...model,
        state: "proposal",
        selectedOption: recommendedOption,
        activePrice: recommendedOption.price,
        execution: buildExecution(recommendedOption),
        approval: null,
        invalidation: null,
        activityTrail: null,
        searchNonce: model.searchNonce + 1,
        freshnessLabel: "just now",
      };
    }

    default:
      return model;
  }
}

/* ------------------------------------------------------------------ *
 * Selectors                                                          *
 * ------------------------------------------------------------------ */

/**
 * The amount the user actually approved and was charged.
 *
 * Success and receipt surfaces MUST read this rather than `activePrice`.
 * `activePrice` is "what the airline is quoting right now" and legitimately
 * changes on a reprice; reading it after the fact would report a figure the
 * user never agreed to.
 */
export function settledTotal(model: AgentModel): number {
  return model.approval?.totalAmount ?? model.selectedOption.price.total;
}

/** The price breakdown matching `settledTotal`. */
export function settledPrice(model: AgentModel): PriceBreakdown {
  if (!model.approval) return model.selectedOption.price;
  return model.approval.totalAmount === model.activePrice.total
    ? model.activePrice
    : model.selectedOption.price;
}

/** True when a live approval covers exactly what is currently on the table. */
export function hasLiveApproval(model: AgentModel): boolean {
  return model.approval !== null;
}
