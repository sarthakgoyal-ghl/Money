import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { FlightOption, TripConstraints } from "../data/scenario";
import {
  activityTrace,
  assistantMeta,
  currentBooking,
  recommendationReasonParts,
  understoodBrief,
} from "../data/scenario";
import { BubbleText, FigBubble } from "../components/figma/assistant/FigBubble";
import { FigRecommendationStack } from "../components/figma/assistant/FigRecommendationStack";
import { FigThreadNav } from "../components/figma/assistant/FigThreadNav";
import { FigUnderstoodCard } from "../components/figma/assistant/FigUnderstoodCard";
import { FigUserBubble } from "../components/figma/assistant/FigUserBubble";
import {
  AutoAwesomeIcon,
  RefreshIcon,
} from "../components/figma/assistant/threadAssets";
import { HomeIndicator, IOSStatusBar } from "../components/figma/chrome";
import { AssistantComposer } from "../components/assistant/AssistantComposer";
import { ease } from "../motion/tokens";

export type AssistantPhase = "interpreting" | "proposal";

interface AssistantScreenProps {
  phase: AssistantPhase;
  request: string;
  option: FlightOption;
  constraints: TripConstraints;
  /** Live fare/seat freshness from the agent model (`REFRESH_LIVE_DATA`). */
  freshnessLabel: string;
  onInterpretationComplete: () => void;
  onExpandMap: () => void;
  onReviewChange: () => void;
  onSeeOtherOptions: () => void;
  onKeepCurrentFlight: () => void;
  onEditBrief: () => void;
  onRefresh: () => void;
  onPrompt: (text: string) => void;
  activeSlug: string | null;
  onDemoSelect: (slug: string) => void;
}

const STEP_MS = 520;

/** `1204:80813` — 123 px: pt-63 + 44 row + pb-16. */
const NAV_HEIGHT_PX = 123;

/**
 * Footer — Thread Input Bar `1223:78147` (~74) + Home Indicator 17
 * (`1204:80848` / `1223:78173`). Glass stays under the composer; thread
 * padding clears the last bubble so nothing is veiled.
 */
const MESSAGE_BAR_PX = 74;
const HOME_INDICATOR_PX = 17;
const CHROME_PX = MESSAGE_BAR_PX + HOME_INDICATOR_PX;

/**
 * The Assistant — Figma `1204:80683` (full thread) / `1213:77618` (scrolled).
 *
 * Fixed chrome at both ends, one scrolling thread. Bubbles stay at 300 px max
 * on a 402 px frame. Ambient blue washes are `#0078ff`→white; the Thread Input
 * Bar is glass over that wash. Review is on the recommendation bubble
 * (`1213:77674`), not a sticky footer CTA.
 */
export function AssistantScreen({
  phase,
  request,
  option,
  constraints,
  freshnessLabel,
  onInterpretationComplete,
  onExpandMap,
  onReviewChange,
  onSeeOtherOptions,
  onKeepCurrentFlight,
  onEditBrief,
  onRefresh,
  onPrompt,
  activeSlug,
  onDemoSelect,
}: AssistantScreenProps) {
  const reduced = useReducedMotion();
  const [completed, setCompleted] = useState(0);
  const working = phase === "interpreting";
  const scrollRef = useRef<HTMLDivElement>(null);
  const answerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!working) return;
    setCompleted(0);
    const timers: number[] = [];
    activityTrace.forEach((_, index) => {
      timers.push(
        window.setTimeout(() => setCompleted(index + 1), STEP_MS * (index + 1)),
      );
    });
    timers.push(
      window.setTimeout(
        onInterpretationComplete,
        STEP_MS * activityTrace.length + 420,
      ),
    );
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [working, onInterpretationComplete]);

  useEffect(() => {
    if (working) return;

    const timers: number[] = [];
    const scrollToAnswer = () => {
      const scroller = scrollRef.current;
      const answer = answerRef.current;
      if (!scroller || !answer || answer.offsetTop <= 0) return false;

      scroller.scrollTop = Math.max(0, answer.offsetTop - NAV_HEIGHT_PX);
      return true;
    };

    const tryScroll = (attempt: number) => {
      if (scrollToAnswer() || attempt >= 8) return;
      timers.push(window.setTimeout(() => tryScroll(attempt + 1), 80));
    };

    timers.push(window.setTimeout(() => tryScroll(0), reduced ? 0 : 120));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [working, reduced, option.flight.id]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-white text-fig-900">
      {/* Top wash `1204:80685` — 92 px under the nav glass. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[92px]"
        style={{
          background: "linear-gradient(180deg, #0078FF 0%, #FFFFFF 100%)",
        }}
      />

      {/* Bottom wash — behind the footer chrome only. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[92px]"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,120,255,0) 0%, rgba(0,120,255,0.22) 50%, rgba(0,120,255,0.45) 100%)",
        }}
      />

      <div
        ref={scrollRef}
        className="no-scrollbar absolute inset-0 z-10 overflow-y-auto overscroll-contain"
      >
        <div
          className="flex flex-col gap-[8px] px-[16px]"
          style={{
            paddingTop: NAV_HEIGHT_PX,
            /* Clear the composer so the last bubble stays fully readable. */
            paddingBottom: CHROME_PX + 16,
          }}
        >
          <Timestamp label={assistantMeta.timestampLabel} />

          <FigUserBubble>{request}</FigUserBubble>

          {/* Recipient run — one gap owns every bubble (no nested gap / pt). */}
          <div className="flex w-full flex-col items-start gap-[1.5px]">
            <FigUnderstoodCard onEdit={onEditBrief} items={understoodBrief} />

            <AnimatePresence mode="wait" initial={false}>
              {working ? (
                <motion.div
                  key="skeleton"
                  initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: reduced ? 0.001 : 0.24, ease: [...ease] }}
                  className="w-full"
                >
                  <RecommendationSkeleton
                    progress={completed / activityTrace.length}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="answer"
                  ref={answerRef}
                  data-assistant-answer=""
                  initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: reduced ? 0.001 : 0.34, ease: [...ease] }}
                  className="flex w-full flex-col items-start gap-[1.5px]"
                >
                  <FigBubble from="recipient">
                    <BubbleText>
                      I found a flight that meets your brief.
                    </BubbleText>
                  </FigBubble>

                  <FigRecommendationStack
                    option={option}
                    currentFlightNo={currentBooking.flightNo}
                    onExpandMap={onExpandMap}
                    onReviewChange={onReviewChange}
                    onSeeOtherOptions={onSeeOtherOptions}
                    onKeepCurrentFlight={onKeepCurrentFlight}
                  />

                  <WhyThisOption
                    option={option}
                    constraints={constraints}
                    freshness={freshnessLabel}
                    onRefresh={onRefresh}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div
        aria-hidden="true"
        className="fig-statusbar-scrim pointer-events-none absolute inset-x-0 top-0 z-20 h-[54px]"
      />

      <FigThreadNav
        title="Trip assistant"
        activeSlug={activeSlug}
        onDemoSelect={onDemoSelect}
      />
      <IOSStatusBar />

      {/* Glass under the prompt only — short soft seam, no veil on chat. */}
      <div className="fig-thread-footer absolute inset-x-0 bottom-0 z-30 flex flex-col">
        <AssistantComposer onSubmit={onPrompt} disabled={working} />
        <HomeIndicator height={17} embedded />
      </div>
    </div>
  );
}

/** `1204:80696` — "Today at 15:15". Medium day, regular time, 11 px. */
function Timestamp({ label }: { label: string }) {
  const [day, ...rest] = label.split(" ");
  return (
    <p className="flex items-center justify-center gap-[2px] pb-[2px] pt-[10px] text-[11px] leading-[1.25] text-fig-tertiary">
      <span className="fig-w-medium">{day}</span>
      <span>{rest.join(" ")}</span>
    </p>
  );
}

/**
 * "Why this option" — Figma `1204:80786`.
 *
 * Last bubble in the recipient run, so it carries the tail. Sparkle leads the
 * title (screenshot). Body is Inter 14/20 with Medium on the key figures.
 */
function WhyThisOption({
  option,
  constraints,
  freshness,
  onRefresh,
}: {
  option: FlightOption;
  constraints: TripConstraints;
  freshness: string;
  onRefresh: () => void;
}) {
  const parts = recommendationReasonParts(option, constraints);

  return (
    <FigBubble from="recipient" fixedWidth tail>
      <div className="flex w-full flex-col gap-[6px]">
        <div className="flex w-full items-center gap-[8px]">
          <AutoAwesomeIcon />
          <h2 className="min-w-0 flex-1 font-sans text-[16px] font-normal leading-[1.25] tracking-[-0.15px] opacity-90">
            Why this option
          </h2>
        </div>

        <p className="font-ui text-[14px] font-normal leading-[20px] text-fig-900 opacity-90">
          {parts.lead} keeps your {parts.seatPhrase} and stays{" "}
          <span className="font-medium">{parts.headroom}</span> under your limit.
          You arrive <span className="font-medium">{parts.earlier} earlier</span>{" "}
          than {parts.flightNo}.
        </p>

        <div className="flex w-full items-center gap-[2.5px]">
          <p className="min-w-0 flex-1 font-ui text-[10px] font-light leading-[normal] text-fig-note">
            Fare and seat refreshed {freshness}.
          </p>
          <button
            type="button"
            onClick={onRefresh}
            className="flex shrink-0 items-center justify-center gap-[4px] overflow-hidden rounded-[4px] font-ui text-[10px] font-medium leading-[15px] text-fig-blue-ios focus-ring-fig"
          >
            <RefreshIcon />
            Refresh
          </button>
        </div>
      </div>
    </FigBubble>
  );
}

function RecommendationSkeleton({ progress }: { progress: number }) {
  return (
    <div
      aria-hidden="true"
      className="ml-[5.5px] w-[299.5px] overflow-hidden rounded-[16px] bg-fig-bubble pb-[4px]"
    >
      <div className="h-[168px] w-full animate-pulse bg-[linear-gradient(180deg,#DCEBF7_0%,#E8F1F6_50%,#EFF2ED_100%)]" />
      <div className="mt-[6px] flex flex-col gap-[6px] px-[10px] pb-[4px]">
        <div className="flex items-center justify-between">
          <span className="block h-[10px] w-[96px] rounded-full bg-fig-900/[0.08]" />
          <span className="block h-[10px] w-[45px] rounded-full bg-fig-900/[0.08]" />
        </div>
        <div className="flex items-center gap-[14px]">
          <span className="block h-[24px] w-[88.5px] rounded-[6px] bg-fig-900/[0.08]" />
          <span className="block h-[1px] w-[74.5px] bg-fig-900/[0.10]" />
          <span className="block h-[24px] w-[88.5px] rounded-[6px] bg-fig-900/[0.08]" />
        </div>
        <div className="flex items-center justify-between">
          {[0, 1, 2].map((row) => (
            <motion.span
              key={row}
              className="block h-[10px] rounded-full bg-fig-900/[0.08]"
              initial={{ width: 40, opacity: 0.5 }}
              animate={{
                width: progress > row / 3 ? 84 : 40,
                opacity: progress > row / 3 ? 0.9 : 0.5,
              }}
              transition={{ duration: 0.3, delay: row * 0.06 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
