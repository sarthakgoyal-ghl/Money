import type { ReactNode } from "react";
import { DockComposer } from "../components/dock/DockComposer";
import type { FlightOption, PaymentMethod, TripConstraints } from "../data/scenario";
import { currentBooking, specialist } from "../data/scenario";
import type { AgentModel } from "../state/machine";
import { settledPrice } from "../state/machine";
import { ExecutionActions, ExecutionPanel } from "./ExecutionPanel";
import { HandoffActions, HandoffPanel } from "./HandoffPanel";
import { MisreadActions, MisreadPanel } from "./MisreadPanel";
import type { MisreadChoice } from "./MisreadPanel";
import {
  PriceChangedActions,
  PriceChangedPanel,
  RejectedActions,
  RejectedPanel,
} from "./OutcomePanels";
import { RefineActions, RefinePanel } from "./RefinePanel";
import type { RefineState } from "./RefinePanel";
import { SuccessActions, SuccessPanel } from "./SuccessPanel";
import { TripActions, TripPanel } from "./TripPanel";

/** Everything a panel needs from the shell, in one bag. */
export interface PanelContext {
  model: AgentModel;
  payment: PaymentMethod;
  request: string;
  refineStartsWithResults: boolean;
  refineState: RefineState | null;
  searchSignal: number;
  misreadChoice: MisreadChoice | null;

  onPrompt: (text: string) => void;
  onEditBrief: () => void;
  onSeeOtherOptions: () => void;
  onRefreshLiveData: () => void;
  onInterpretationComplete: () => void;
  onReviewChange: () => void;
  onKeepCurrent: () => void;
  onApplyConstraints: (patch: Partial<TripConstraints>) => void;
  /** Highlight a flight in the results list without leaving the refine surface. */
  onSelectOption: (option: FlightOption) => void;
  /** Commit the highlighted flight and open Review. */
  onUseOption: (option: FlightOption) => void;
  onRefineStateChange: (state: RefineState) => void;
  onSearch: () => void;
  onTick: () => void;
  onExecutionComplete: () => void;
  onNotifyMeLater: () => void;
  onViewBoardingPass: () => void;
  onBackToProposal: () => void;
  onFindAnother: () => void;
  onReviewRepriced: () => void;
  onChooseMisread: (choice: MisreadChoice) => void;
  onApplyMisread: () => void;
  onOpenSpecialistChat: () => void;
  onCallSupport: () => void;
  onOpenCaseDetails: () => void;
}

export interface DockPanel {
  /** One line in the assistant's voice, shown beside Trip Pulse. */
  status: string;
  body: ReactNode;
  /** Pinned above the composer, outside the scroll area. */
  actions?: ReactNode;
  /** Omitted where typing would be wrong. */
  composer?: ReactNode;
}

/**
 * What the dock is showing, for the current state.
 *
 * One table, so adding a state means adding a case here rather than editing a
 * switch in three files — and so the shell stays about wiring the map, the dock
 * and the sheets together rather than about content.
 */
export function selectPanel(context: PanelContext): DockPanel {
  const { model, payment } = context;

  const composer = (showSuggestions: boolean, disabled = false) => (
    <DockComposer
      onSubmit={context.onPrompt}
      showSuggestions={showSuggestions}
      disabled={disabled}
      placeholder={
        disabled ? "Rebooking in progress…" : "Ask for a different option…"
      }
    />
  );

  switch (model.state) {
    // Confirmation keeps the proposal in the dock rather than swapping in a
    // placeholder. The sheet is a layer over the decision, not a replacement for
    // it — so closing it returns to exactly the surface it covered, with focus
    // landing back on the control that opened it.
    case "confirmation":
    case "interpreting":
    case "proposal": {
      const reviewing = model.state === "confirmation";
      const proposing = model.state !== "interpreting";
      return {
        status: reviewing
          ? "Review the exact change before I book it."
          : proposing
            ? "I found a flight that meets your brief."
            : "Reading your request…",
        body: (
          <TripPanel
            phase={proposing ? "proposal" : "interpreting"}
            request={context.request}
            constraints={model.constraints}
            option={model.selectedOption}
            freshnessLabel={model.freshnessLabel}
            searchNonce={model.searchNonce}
            onEditBrief={context.onEditBrief}
            onRefreshLiveData={context.onRefreshLiveData}
            onInterpretationComplete={context.onInterpretationComplete}
            onSeeOtherOptions={context.onSeeOtherOptions}
            onKeepCurrentFlight={context.onKeepCurrent}
          />
        ),
        actions: proposing ? (
          <TripActions
            option={model.selectedOption}
            onReviewChange={context.onReviewChange}
          />
        ) : undefined,
        // No composer while the confirmation sheet is up: this is the trust
        // boundary, and a text field beside a payment invites input the
        // assistant cannot honour.
        composer: reviewing ? undefined : composer(proposing),
      };
    }

    case "adjust_request":
    case "alternatives":
      return {
        status:
          model.state === "alternatives"
            ? "Here's everything I compared."
            : "Change the brief and I'll look again.",
        body: (
          <RefinePanel
            constraints={model.constraints}
            options={model.alternatives}
            selectedFlightId={model.selectedOption.flight.id}
            startWithResults={context.refineStartsWithResults}
            onApplyConstraints={context.onApplyConstraints}
            onSelectOption={context.onSelectOption}
            onStateChange={context.onRefineStateChange}
            searchSignal={context.searchSignal}
          />
        ),
        actions: (
          <RefineActions
            state={context.refineState}
            selectedOption={model.alternatives.find(
              (option) => option.flight.id === model.selectedOption.flight.id,
            )}
            onSearch={context.onSearch}
            onUseSelected={context.onUseOption}
          />
        ),
        composer: composer(false),
      };

    case "executing":
      return {
        status: `Rebooking to ${model.selectedOption.flight.flightNo}.`,
        body: (
          <ExecutionPanel
            steps={model.execution}
            flight={model.selectedOption.flight}
            price={model.activePrice}
            onTick={context.onTick}
            onComplete={context.onExecutionComplete}
          />
        ),
        actions: <ExecutionActions onLeave={context.onNotifyMeLater} />,
        composer: composer(false, true),
      };

    case "success":
      return {
        status: "Your new ticket is issued.",
        body: (
          <SuccessPanel
            flight={model.selectedOption.flight}
            settledTotal={settledPrice(model).total}
            payment={payment}
          />
        ),
        actions: (
          <SuccessActions
            onViewBoardingPass={context.onViewBoardingPass}
            onGetHelp={context.onOpenSpecialistChat}
          />
        ),
        composer: composer(false),
      };

    case "rejected":
      return {
        status: `${currentBooking.flightNo} is unchanged.`,
        body: <RejectedPanel />,
        actions: (
          <RejectedActions
            onLookAgain={context.onSeeOtherOptions}
            onBackToTrip={context.onBackToProposal}
          />
        ),
        composer: composer(true),
      };

    case "failure_price_changed":
      return {
        status: "I stopped before ticketing.",
        body: (
          <PriceChangedPanel
            constraints={model.constraints}
            differences={model.invalidation?.differences ?? []}
          />
        ),
        actions: (
          <PriceChangedActions
            constraints={model.constraints}
            onFindAnother={context.onFindAnother}
            onReviewRepriced={context.onReviewRepriced}
            onKeepCurrent={context.onKeepCurrent}
          />
        ),
        composer: composer(false),
      };

    case "failure_misread":
      return {
        status: "I got one constraint wrong.",
        body: (
          <MisreadPanel
            constraints={model.constraints}
            choice={context.misreadChoice}
            onChoose={context.onChooseMisread}
          />
        ),
        actions: (
          <MisreadActions
            choice={context.misreadChoice}
            onApply={context.onApplyMisread}
          />
        ),
        composer: composer(false),
      };

    case "escalation_partial_transaction":
      return {
        status: `Handing this to ${specialist.name}.`,
        body: <HandoffPanel price={model.activePrice} payment={payment} />,
        actions: (
          <HandoffActions
            onChat={context.onOpenSpecialistChat}
            onCall={context.onCallSupport}
            onCaseDetails={context.onOpenCaseDetails}
          />
        ),
        composer: composer(false),
      };
  }
}
