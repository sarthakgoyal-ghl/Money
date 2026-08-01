import { useMemo } from "react";
import { BoardingPassSheet } from "../figma/sheets/BoardingPassSheet";
import { ExecutionSheet } from "../figma/sheets/ExecutionSheet";
import { HandoffSheet } from "../figma/sheets/HandoffSheet";
import { MisreadSheet } from "../figma/sheets/MisreadSheet";
import { OtherOptionsSheet } from "../figma/sheets/OtherOptionsSheet";
import { PriceChangeSheet } from "../figma/sheets/PriceChangeSheet";
import { RejectedSheet } from "../figma/sheets/RejectedSheet";
import { ReviewChangeSheet } from "../figma/sheets/ReviewChangeSheet";
import { SuccessSummarySheet } from "../figma/sheets/SuccessSummarySheet";
import { LightMapShell } from "./LightMapShell";
import { MapStatusPill } from "../figma/chrome";
import type { PaymentMethod, TripConstraints } from "../../data/scenario";
import { BLR, BOM, currentBooking, formatINR } from "../../data/scenario";
import type { FlightOption } from "../../data/scenario";
import type { AgentModel } from "../../state/machine";
import { settledTotal } from "../../state/machine";
import type { MisreadChoice } from "../../panels/MisreadPanel";
import { FullMapProposalCard } from "../../screens/FullMapProposalScreen";

interface FigmaMapFlowProps {
  model: AgentModel;
  payment: PaymentMethod;
  mapExpanded: boolean;
  confirmationOpen: boolean;
  boardingPassOpen: boolean;
  refineStartsWithResults: boolean;
  misreadChoice: MisreadChoice | null;
  activeSlug: string | null;
  onDemoSelect: (slug: string) => void;
  onBack: () => void;
  onRouteClick?: () => void;
  onCollapseMap: () => void;
  onReviewChange: () => void;
  onSeeOtherOptions: (withResults: boolean) => void;
  onKeepCurrent: () => void;
  onCloseConfirmation: () => void;
  onApprove: () => void;
  onEditPayment: () => void;
  approveLocked?: boolean;
  onApplyConstraints: (patch: Partial<TripConstraints>) => void;
  onSelectOption: (option: FlightOption) => void;
  onUseOption: (option: FlightOption) => void;
  onCloseSuccessSummary: () => void;
  onViewBoardingPass: () => void;
  onCloseBoardingPass: () => void;
  onAddToWallet: () => void;
  onViewReceipt: () => void;
  onAddToCalendar: () => void;
  onGetHelp: () => void;
  onExecutionTick: () => void;
  onExecutionComplete: () => void;
  onNotifyExecution: () => void;
  onLookAgain: () => void;
  onBackToTrip: () => void;
  onFindAnotherUnderBudget: () => void;
  onReviewRepriced: () => void;
  onMisreadChoose: (choice: MisreadChoice) => void;
  onMisreadApply: () => void;
  onHandoffChat: () => void;
  onHandoffCall: () => void;
  onHandoffCaseDetails: () => void;
}

const MAP_BACKED_STATES = new Set([
  "proposal",
  "alternatives",
  "adjust_request",
  "confirmation",
  "executing",
  "success",
  "rejected",
  "failure_price_changed",
  "failure_misread",
  "escalation_partial_transaction",
]);

/**
 * Light-map presentation for every state after the Assistant thread.
 */
export function FigmaMapFlow(props: FigmaMapFlowProps) {
  const {
    model,
    payment,
    mapExpanded,
    confirmationOpen,
    boardingPassOpen,
    refineStartsWithResults,
    misreadChoice,
    activeSlug,
    onDemoSelect,
    onBack,
    onRouteClick,
    onCollapseMap,
    onReviewChange,
    onSeeOtherOptions,
    onKeepCurrent,
    onCloseConfirmation,
    onApprove,
    onEditPayment,
    approveLocked = false,
    onApplyConstraints,
    onSelectOption,
    onUseOption,
    onCloseSuccessSummary,
    onViewBoardingPass,
    onCloseBoardingPass,
    onAddToWallet,
    onViewReceipt,
    onAddToCalendar,
    onGetHelp,
    onExecutionTick,
    onExecutionComplete,
    onNotifyExecution,
    onLookAgain,
    onBackToTrip,
    onFindAnotherUnderBudget,
    onReviewRepriced,
    onMisreadChoose,
    onMisreadApply,
    onHandoffChat,
    onHandoffCall,
    onHandoffCaseDetails,
  } = props;

  const mapBacked = MAP_BACKED_STATES.has(model.state);
  const showOptionsSheet =
    model.state === "alternatives" || model.state === "adjust_request";
  const successSummaryOpen = model.state === "success";

  // Modal sheets own the interaction surface. Map chrome (back, route pill, ⋯)
  // must stay inert for every overlay — mouse via the sheet scrim, keyboard via
  // RouteHeader `interactive={false}`.
  const sheetOverlayOpen =
    showOptionsSheet ||
    confirmationOpen ||
    successSummaryOpen ||
    boardingPassOpen ||
    model.state === "executing" ||
    model.state === "rejected" ||
    model.state === "failure_price_changed" ||
    model.state === "failure_misread" ||
    model.state === "escalation_partial_transaction";
  const chromeInteractive = !sheetOverlayOpen;

  // Hooks must run unconditionally — never after an early return.
  const mapTone = useMemo(() => {
    if (model.state === "success") return "complete" as const;
    if (showOptionsSheet) return "searching" as const;
    if (model.state === "executing") return "active" as const;
    return "active" as const;
  }, [model.state, showOptionsSheet]);

  // Aircraft tracks real work during execution; elsewhere a stable mid-route
  // position so motion reports state instead of looping decoratively.
  const mapProgress = useMemo(() => {
    if (model.state === "success") return 1;
    if (model.state === "executing") {
      const done = model.execution.filter((step) => step.status === "done").length;
      const total = Math.max(1, model.execution.length);
      return Math.min(0.96, 0.46 + (done / total) * 0.5);
    }
    if (showOptionsSheet) return 0.38;
    return 0.46;
  }, [model.state, model.execution, showOptionsSheet]);

  const mapCamera = useMemo(() => {
    if (model.state === "success") return "success" as const;
    if (model.state === "executing") return "execution" as const;
    if (showOptionsSheet) return "searching" as const;
    if (sheetOverlayOpen) return "sheet" as const;
    return "proposal" as const;
  }, [model.state, showOptionsSheet, sheetOverlayOpen]);

  // When a tall sheet owns the viewport, keep the route in the visible sliver.
  // Proposal card docks higher, so the open-map framing uses a taller bottom pad.
  const mapInset = useMemo(() => {
    if (sheetOverlayOpen) {
      return { top: 96, bottom: 520, left: 28, right: 28 };
    }
    // RouteHeader: pt 63 + 44 row + gap 18 + pills ~34 + pb 16 ≈ 175 → pad to 212.
    // Expand card: relocate (~44) + gap 8 + sheet 261 + pb 28 ≈ 341.
    if (mapExpanded && model.state === "proposal") {
      return { top: 212, bottom: 348, left: 32, right: 32 };
    }
    return { top: 212, bottom: 240, left: 32, right: 32 };
  }, [sheetOverlayOpen, mapExpanded, model.state]);

  const showProposalCard =
    mapExpanded && model.state === "proposal" && !sheetOverlayOpen;

  const pills = useMemo(() => {
    if (model.state === "success") {
      return (
        <MapStatusPill tone="issued">
          {model.selectedOption.flight.flightNo} · Seat {model.selectedOption.flight.seat.label} ·{" "}
          {formatINR(settledTotal(model))}
        </MapStatusPill>
      );
    }

    const current = (
      <MapStatusPill tone="current">
        {currentBooking.flightNo} · {currentBooking.departLabel} · {currentBooking.seat.label}
      </MapStatusPill>
    );

    if (model.state === "proposal" || model.state === "confirmation" || model.state === "executing") {
      return (
        <>
          {current}
          <MapStatusPill tone="proposed">
            {model.selectedOption.flight.flightNo} · arrives {model.selectedOption.flight.arriveLabel}
          </MapStatusPill>
        </>
      );
    }

    return current;
  }, [model]);

  if (!mapBacked) return null;

  const overlays = (
    <>
      {showOptionsSheet ? (
        <OtherOptionsSheet
          constraints={model.constraints}
          options={model.alternatives}
          selectedFlightId={model.selectedOption.flight.id}
          startWithResults={refineStartsWithResults}
          onClose={onBack}
          onApplyConstraints={onApplyConstraints}
          onSelectOption={onSelectOption}
          onUseSelected={onUseOption}
        />
      ) : null}

      {model.state === "executing" ? (
        <ExecutionSheet
          steps={model.execution}
          flight={model.selectedOption.flight}
          price={model.activePrice}
          onTick={onExecutionTick}
          onComplete={onExecutionComplete}
          onNotify={onNotifyExecution}
        />
      ) : null}

      {model.state === "rejected" ? (
        <RejectedSheet
          onLookAgain={onLookAgain}
          onBackToTrip={onBackToTrip}
          onClose={onBack}
        />
      ) : null}

      {model.state === "failure_price_changed" ? (
        <PriceChangeSheet
          constraints={model.constraints}
          differences={model.invalidation?.differences ?? []}
          onFindAnother={onFindAnotherUnderBudget}
          onReviewRepriced={onReviewRepriced}
          onKeepCurrent={onKeepCurrent}
          onClose={onBack}
        />
      ) : null}

      {model.state === "failure_misread" ? (
        <MisreadSheet
          constraints={model.constraints}
          choice={misreadChoice}
          onChoose={onMisreadChoose}
          onApply={onMisreadApply}
          onClose={onBack}
        />
      ) : null}

      {model.state === "escalation_partial_transaction" ? (
        <HandoffSheet
          price={model.activePrice}
          payment={payment}
          onChat={onHandoffChat}
          onCall={onHandoffCall}
          onCaseDetails={onHandoffCaseDetails}
          onClose={onBack}
        />
      ) : null}

      <ReviewChangeSheet
        open={confirmationOpen}
        option={model.selectedOption}
        price={model.activePrice}
        payment={payment}
        constraints={model.constraints}
        onClose={onCloseConfirmation}
        onEditPayment={onEditPayment}
        onApprove={onApprove}
        onKeepCurrent={onKeepCurrent}
        approveLocked={approveLocked || model.state === "executing"}
      />

      <SuccessSummarySheet
        open={successSummaryOpen}
        flight={model.selectedOption.flight}
        settledTotal={settledTotal(model)}
        payment={payment}
        recessed={boardingPassOpen ? true : undefined}
        onClose={onCloseSuccessSummary}
        onViewBoardingPass={onViewBoardingPass}
        onGetHelp={onGetHelp}
      />

      <BoardingPassSheet
        open={boardingPassOpen}
        flight={model.selectedOption.flight}
        settledTotal={settledTotal(model)}
        payment={payment}
        activityTrail={model.activityTrail}
        stacked={model.state === "success"}
        onClose={onCloseBoardingPass}
        onAddToWallet={onAddToWallet}
        onViewReceipt={onViewReceipt}
        onAddToCalendar={onAddToCalendar}
        onGetHelp={onGetHelp}
      />
    </>
  );

  // One map instance for every map-backed state — proposal card, review scrim,
  // execution, and success all share camera / progress / gesture wiring so the
  // basemap never remounts into a static postcard under a sheet.
  return (
    <LightMapShell
      origin={BOM}
      destination={BLR}
      dateLabel={model.selectedOption.flight.dateShort}
      tone={mapTone}
      progress={mapProgress}
      camera={mapCamera}
      mapInset={mapInset}
      explorable={chromeInteractive}
      showProtectedRoute={model.state !== "success"}
      onBack={mapExpanded && model.state === "proposal" ? onCollapseMap : onBack}
      onRouteClick={onRouteClick}
      activeSlug={activeSlug}
      onDemoSelect={onDemoSelect}
      pills={pills}
      chromeInteractive={chromeInteractive}
    >
      {showProposalCard ? (
        <FullMapProposalCard
          option={model.selectedOption}
          onReviewChange={onReviewChange}
          onSeeOtherOptions={() => onSeeOtherOptions(true)}
          onKeepCurrentFlight={onKeepCurrent}
        />
      ) : null}
      {overlays}
    </LightMapShell>
  );
}
