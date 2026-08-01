import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { PrototypeStage } from "./components/shell/PrototypeStage";
import { AssistantScreen } from "./screens/AssistantScreen";
import { CurrentTripSheet } from "./components/shell/CurrentTripSheet";
import { FigmaMapFlow } from "./components/shell/FigmaMapFlow";
import { FigToast, type ToastMessage, type ToastTone } from "./components/figma/FigToast";
import { SheetStackProvider } from "./components/shared/SheetStackContext";
import { CaseDetailsSheet } from "./components/support/CaseDetailsSheet";
import { SpecialistChatSheet } from "./components/support/SpecialistChatSheet";
import { PaymentMethodSheet } from "./components/transaction/PaymentMethodSheet";
import type { MisreadChoice } from "./panels/MisreadPanel";
import { buildCaseContext } from "./data/caseContext";
import { resolveComposerPrompt } from "./data/composerPrompts";
import type { FlightOption, TripConstraints } from "./data/scenario";
import { alternativeOption, findPaymentMethod, userRequest } from "./data/scenario";
import { initialModel, reducer } from "./state/machine";
import type { AgentState } from "./state/machine";
import {
  canonicalSlug,
  clearSheetInUrl,
  setStateInUrl,
  sheetFromUrl,
  slugFromUrl,
  slugToLink,
} from "./state/demoStates";

/** How long toast messages stay visible. */
const TOAST_MS = 2800;

/**
 * Seed the reducer from `?state=` so the first paint already matches the deep
 * link. Avoids a Strict Mode race where URL sync rewrote the slug to proposal
 * before `applySlug` could stick.
 */
function modelFromBootUrl(): typeof initialModel {
  if (typeof window === "undefined") return initialModel;
  const slug = slugFromUrl();
  const link = slug ? slugToLink[slug] : null;
  if (!link) return initialModel;

  if (link.agentState === "failure_price_changed") {
    return reducer(initialModel, { type: "TRIGGER_PRICE_CHANGE" });
  }
  if (link.agentState === "escalation_partial_transaction") {
    return reducer(initialModel, { type: "TRIGGER_HANDOFF" });
  }
  return reducer(initialModel, { type: "GO_TO", state: link.agentState });
}

export function App() {
  const [model, dispatch] = useReducer(reducer, undefined, modelFromBootUrl);
  const [request, setRequest] = useState(userRequest);

  const [confirmationOpen, setConfirmationOpen] = useState(() => {
    const slug = typeof window !== "undefined" ? slugFromUrl() : null;
    return slug ? slugToLink[slug]?.agentState === "confirmation" : false;
  });
  const [boardingPassOpen, setBoardingPassOpen] = useState(() => {
    const slug = typeof window !== "undefined" ? slugFromUrl() : null;
    return slug === "ticket";
  });
  const [tripSheetOpen, setTripSheetOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(() => {
    if (typeof window === "undefined") return false;
    return (
      sheetFromUrl() === "payment-method" && slugFromUrl() === "confirmation"
    );
  });
  const [caseDetailsOpen, setCaseDetailsOpen] = useState(() => {
    if (typeof window === "undefined") return false;
    const slug = slugFromUrl();
    return (
      sheetFromUrl() === "case-details" &&
      (slug === "handoff" || slug === "support")
    );
  });
  const [specialistChatOpen, setSpecialistChatOpen] = useState(() => {
    const slug = typeof window !== "undefined" ? slugFromUrl() : null;
    return slug ? slugToLink[slug]?.surface === "specialistChat" : false;
  });
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = useCallback((message: string, tone: ToastTone) => {
    setToast({ message, tone });
  }, []);

  const [refineStartsWithResults, setRefineStartsWithResults] = useState(() => {
    const slug = typeof window !== "undefined" ? slugFromUrl() : null;
    return slug ? slugToLink[slug]?.agentState === "alternatives" : false;
  });
  const [misreadChoice, setMisreadChoice] = useState<MisreadChoice | null>(null);

  /** True when the assistant's expand control moved to the full-map frame. */
  const [mapExpanded, setMapExpanded] = useState(false);
  /** Set when a variant slug (?state=ticket, ?state=support) opened the state. */
  const bootSlug = typeof window !== "undefined" ? slugFromUrl() : null;
  const variantSlug = useRef<string | null>(
    bootSlug && slugToLink[bootSlug]?.variant ? bootSlug : null,
  );

  const payment = findPaymentMethod(model.paymentMethodId);
  /** Overlay BottomSheets that recess the map-backed Fig sheet underneath. */
  const underlayRecessed =
    tripSheetOpen ||
    caseDetailsOpen ||
    specialistChatOpen ||
    paymentOpen;

  const closeAllSheets = useCallback(() => {
    setConfirmationOpen(false);
    setBoardingPassOpen(false);
    setTripSheetOpen(false);
    setPaymentOpen(false);
    setCaseDetailsOpen(false);
    setSpecialistChatOpen(false);
  }, []);

  /**
   * One entry point for every deterministic state, used by the URL, the
   * back/forward buttons and the demo menu — so a directly-opened state is set
   * up exactly like one reached by using the product.
   */
  const applySlug = useCallback(
    (slug: string) => {
      const link = slugToLink[slug];
      if (!link) return;

      closeAllSheets();
      setMisreadChoice(null);
      setMapExpanded(false);
      variantSlug.current = link.variant ? slug : null;

      if (link.agentState === "failure_price_changed") {
        dispatch({ type: "TRIGGER_PRICE_CHANGE" });
      } else if (link.agentState === "escalation_partial_transaction") {
        dispatch({ type: "TRIGGER_HANDOFF" });
      } else {
        dispatch({ type: "GO_TO", state: link.agentState });
      }

      if (link.agentState === "confirmation") setConfirmationOpen(true);
      if (link.slug === "ticket") setBoardingPassOpen(true);
      if (link.agentState === "success" && link.slug !== "ticket") setBoardingPassOpen(false);
      if (link.agentState === "alternatives") setRefineStartsWithResults(true);
      if (link.agentState === "adjust_request") setRefineStartsWithResults(false);
      if (link.surface === "specialistChat") setSpecialistChatOpen(true);

      const sheet = sheetFromUrl();
      if (sheet === "payment-method" && link.agentState === "confirmation") {
        setPaymentOpen(true);
      }
      if (
        sheet === "case-details" &&
        link.agentState === "escalation_partial_transaction"
      ) {
        setCaseDetailsOpen(true);
      }
    },
    [closeAllSheets],
  );

  // Keep browser back/forward in sync. Initial `?state=` is applied via
  // `modelFromBootUrl` so the first paint is already correct.
  useEffect(() => {
    const handlePop = () => {
      const next = slugFromUrl();
      if (next) applySlug(next);
    };
    window.addEventListener("popstate", handlePop);
    return () => window.removeEventListener("popstate", handlePop);
  }, [applySlug]);

  useEffect(() => {
    if (model.state === "interpreting") return;
    setStateInUrl(variantSlug.current ?? canonicalSlug(model.state));
  }, [model.state]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), TOAST_MS);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const goTo = useCallback((state: AgentState) => {
    variantSlug.current = null;
    dispatch({ type: "GO_TO", state });
  }, []);

  /**
   * Stable identities for the callbacks panels use as effect dependencies.
   *
   * An inline arrow here is recreated on every render, which restarts the
   * interpretation timers mid-run and makes the phase length non-deterministic —
   * the opposite of what a scripted demo needs.
   */
  const handleInterpretationComplete = useCallback(() => {
    goTo("proposal");
  }, [goTo]);

  const handleRefreshLiveData = useCallback(() => {
    dispatch({ type: "REFRESH_LIVE_DATA" });
  }, []);

  const handleApplyConstraints = useCallback(
    (patch: Partial<TripConstraints>) => {
      dispatch({ type: "UPDATE_CONSTRAINTS", patch });
    },
    [],
  );

  const handleOpenRefine = useCallback((withResults: boolean) => {
    variantSlug.current = null;
    setRefineStartsWithResults(withResults);
    dispatch({
      type: "GO_TO",
      state: withResults ? "alternatives" : "adjust_request",
    });
  }, []);

  const handleSelectOption = useCallback((option: FlightOption) => {
    // Selection only — stay on alternatives/adjust so the user can confirm with
    // "Use …". Navigating here would skip the explicit commit step.
    dispatch({ type: "SELECT_OPTION", option, goToProposal: false });
  }, []);

  const handleReviewChange = useCallback(() => {
    setConfirmationOpen(true);
    goTo("confirmation");
  }, [goTo]);

  const handleUseOption = useCallback(
    (option: FlightOption) => {
      handleSelectOption(option);
      handleReviewChange();
    },
    [handleSelectOption, handleReviewChange],
  );

  const handleCloseConfirmation = useCallback(() => {
    setConfirmationOpen(false);
    goTo("proposal");
  }, [goTo]);

  const [approveLocked, setApproveLocked] = useState(false);
  const approveInFlight = useRef(false);

  const handleApprove = useCallback(() => {
    if (approveInFlight.current) return;
    if (model.state === "executing" || model.state === "success") return;
    approveInFlight.current = true;
    setApproveLocked(true);
    setConfirmationOpen(false);
    dispatch({ type: "APPROVE" });
  }, [model.state]);

  useEffect(() => {
    if (model.state !== "executing" && model.state !== "success") {
      approveInFlight.current = false;
      setApproveLocked(false);
    }
  }, [model.state]);

  const handleKeepCurrent = useCallback(() => {
    closeAllSheets();
    goTo("rejected");
  }, [closeAllSheets, goTo]);

  const handleMisreadApply = useCallback(() => {
    if (!misreadChoice) return;
    if (misreadChoice === "rewrite") {
      setRequest(userRequest);
      goTo("interpreting");
      // Focus the existing composer without auto-submitting.
      window.setTimeout(() => {
        document.getElementById("assistant-composer")?.focus();
      }, 120);
      return;
    }
    // Arrive keeps the existing arrival deadline; depart switches the clock.
    dispatch({
      type: "SET_INTENT",
      intent: misreadChoice === "depart" ? "depart_before" : "arrive_before",
    });
  }, [misreadChoice, goTo]);

  /**
   * The composer's one job: turn typed text into a real action.
   *
   * Every prompt both answers and does something, and unmatched text says what
   * the assistant can actually do — a text field that silently swallows input is
   * a worse lie than one that admits its limits.
   */
  const handlePrompt = useCallback(
    (text: string) => {
      const prompt = resolveComposerPrompt(text);

      switch (prompt.intent) {
        case "adjust_brief":
          handleOpenRefine(false);
          break;
        case "show_alternatives":
          handleOpenRefine(true);
          break;
        case "choose_cheaper":
          dispatch({ type: "SELECT_OPTION", option: alternativeOption });
          break;
        case "keep_current":
          handleKeepCurrent();
          break;
        case "contact_human":
          setSpecialistChatOpen(true);
          break;
        case "explain_choice":
          break;
        case "unrecognised":
          showToast(
            "I can only act on this trip in this prototype.",
            "warning",
          );
          break;
      }
    },
    [handleKeepCurrent, handleOpenRefine, showToast],
  );

  const caseEntries = useMemo(
    () =>
      buildCaseContext(
        model.selectedOption.flight,
        model.activePrice,
        payment,
        model.constraints,
      ),
    [model.selectedOption.flight, model.activePrice, payment, model.constraints],
  );

  const activeSlug = variantSlug.current ?? canonicalSlug(model.state);

  const handleBack = useCallback(() => {
    closeAllSheets();
    if (model.state === "alternatives" || model.state === "adjust_request") {
      goTo("proposal");
      return;
    }
    if (model.state === "confirmation") {
      handleCloseConfirmation();
      return;
    }
    goTo("proposal");
  }, [closeAllSheets, goTo, handleCloseConfirmation, model.state]);

  const sharedSheets = (
    <>
      <CurrentTripSheet open={tripSheetOpen} onClose={() => setTripSheetOpen(false)} />

      <PaymentMethodSheet
        open={paymentOpen}
        onClose={() => {
          setPaymentOpen(false);
          clearSheetInUrl();
        }}
        selectedId={model.paymentMethodId}
        onSelect={(id) => {
          dispatch({ type: "SET_PAYMENT_METHOD", paymentMethodId: id });
          showToast(
            "Payment method changed. Approve the change again.",
            "warning",
          );
        }}
      />

      <CaseDetailsSheet
        open={caseDetailsOpen}
        onClose={() => {
          setCaseDetailsOpen(false);
          clearSheetInUrl();
        }}
        entries={caseEntries}
      />

      <SpecialistChatSheet
        open={specialistChatOpen}
        onClose={() => setSpecialistChatOpen(false)}
        entries={caseEntries}
      />
    </>
  );

  // Review / confirm owns a map-backed sheet — leave the assistant thread so the
  // same LightMapShell camera + route motion runs under the scrim.
  const onAssistant =
    (model.state === "interpreting" || model.state === "proposal") &&
    !mapExpanded &&
    !confirmationOpen;

  if (onAssistant) {
    return (
      <PrototypeStage>
        <SheetStackProvider recessed={underlayRecessed}>
          <div className="relative h-full w-full overflow-hidden">
            <AssistantScreen
              phase={model.state === "interpreting" ? "interpreting" : "proposal"}
              request={request}
              option={model.selectedOption}
              constraints={model.constraints}
              freshnessLabel={model.freshnessLabel}
              onInterpretationComplete={handleInterpretationComplete}
              onExpandMap={() => setMapExpanded(true)}
              onReviewChange={handleReviewChange}
              onSeeOtherOptions={() => handleOpenRefine(true)}
              onKeepCurrentFlight={handleKeepCurrent}
              onEditBrief={() => handleOpenRefine(false)}
              onRefresh={handleRefreshLiveData}
              onPrompt={handlePrompt}
              activeSlug={activeSlug}
              onDemoSelect={applySlug}
            />

            {sharedSheets}
            <FigToast toast={toast} />
          </div>
        </SheetStackProvider>
      </PrototypeStage>
    );
  }

  return (
    <PrototypeStage>
      <SheetStackProvider recessed={underlayRecessed}>
        <div className="relative h-full w-full overflow-hidden">
          <FigmaMapFlow
            model={model}
            payment={payment}
            mapExpanded={mapExpanded}
            confirmationOpen={confirmationOpen}
            boardingPassOpen={boardingPassOpen}
            refineStartsWithResults={refineStartsWithResults}
            misreadChoice={misreadChoice}
            activeSlug={activeSlug}
            onDemoSelect={applySlug}
            onBack={handleBack}
            onRouteClick={() => setTripSheetOpen(true)}
            onCollapseMap={() => setMapExpanded(false)}
            onReviewChange={handleReviewChange}
            onSeeOtherOptions={handleOpenRefine}
            onKeepCurrent={handleKeepCurrent}
            onCloseConfirmation={handleCloseConfirmation}
            onApprove={handleApprove}
            approveLocked={approveLocked || model.state === "executing"}
            onEditPayment={() => setPaymentOpen(true)}
            onApplyConstraints={handleApplyConstraints}
            onSelectOption={handleSelectOption}
            onUseOption={handleUseOption}
            onCloseSuccessSummary={() => goTo("proposal")}
            onViewBoardingPass={() => setBoardingPassOpen(true)}
            onCloseBoardingPass={() => setBoardingPassOpen(false)}
            onAddToWallet={() =>
              showToast("Simulated pass added to Wallet.", "success")
            }
            onViewReceipt={() => showToast("Receipt opened.", "success")}
            onAddToCalendar={() =>
              showToast("Added to your calendar.", "success")
            }
            onGetHelp={() => {
              setSpecialistChatOpen(true);
            }}
            onExecutionTick={() => dispatch({ type: "TICK_EXECUTION" })}
            onExecutionComplete={() => goTo("success")}
            onNotifyExecution={() =>
              showToast(
                "I'll notify you as soon as the new ticket is issued.",
                "success",
              )
            }
            onLookAgain={() => {
              dispatch({ type: "RESET_TO_PROPOSAL" });
              handleOpenRefine(true);
            }}
            onBackToTrip={() => goTo("proposal")}
            onFindAnotherUnderBudget={() => {
              dispatch({ type: "RESET_TO_PROPOSAL" });
              handleOpenRefine(true);
            }}
            onReviewRepriced={() => {
              dispatch({ type: "REVIEW_REPRICED_OPTION" });
              setConfirmationOpen(true);
            }}
            onMisreadChoose={setMisreadChoice}
            onMisreadApply={handleMisreadApply}
            onHandoffChat={() => setSpecialistChatOpen(true)}
            onHandoffCall={() =>
              showToast(
                "Calling the travel desk. Your case is already open.",
                "success",
              )
            }
            onHandoffCaseDetails={() => setCaseDetailsOpen(true)}
          />

          {sharedSheets}
          <FigToast toast={toast} />
        </div>
      </SheetStackProvider>
    </PrototypeStage>
  );
}
