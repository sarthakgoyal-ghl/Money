import { motion, useReducedMotion } from "framer-motion";
import {
  forwardRef,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Flight, PriceBreakdown } from "../../../data/scenario";
import { formatINR } from "../../../data/scenario";
import type { ExecutionStep } from "../../../state/machine";
import { duration, ease } from "../../../motion/tokens";
import { FigButton } from "../FigButton";
import { FigSheet } from "../FigSheet";

const PROGRESS_TICK = "/figma/assets/progress-tick.png";
const PROGRESS_ACTIVE = "/figma/assets/progress-active-dot.png";
const PROGRESS_PENDING = "/figma/assets/progress-pending-dot.png";

interface ExecutionSheetProps {
  steps: ExecutionStep[];
  flight: Flight;
  price: PriceBreakdown;
  onTick: () => void;
  onComplete: () => void;
  onNotify: () => void;
  totalMs?: number;
}

/**
 * Execution progress — Figma `1204:81611` / sheet `1204:81616`.
 *
 * Map stays fully visible behind glass (no `bg-black/16` scrim). Progress uses
 * the Highrise step track (`81633`) with a soft blue glow (`81632`). Authorising /
 * seat sits on the green gradient plate (`81634`). Notify is the soft blue CTA
 * (`81647`); close and collapse controls stay optically present but hidden.
 */
export function ExecutionSheet({
  steps,
  flight,
  price,
  onTick,
  onComplete,
  onNotify,
  totalMs = 3200,
}: ExecutionSheetProps) {
  useEffect(() => {
    const interval = totalMs / (steps.length + 1);
    const timers: number[] = [];

    for (let index = 0; index < steps.length; index += 1) {
      timers.push(window.setTimeout(() => onTick(), interval * (index + 1)));
    }
    timers.push(
      window.setTimeout(() => onComplete(), interval * (steps.length + 1) + 300),
    );

    return () => timers.forEach((timer) => window.clearTimeout(timer));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <FigSheet
      height="full"
      expandHeight="full"
      collapsible={false}
      showHandle
      showScrim={false}
      title={`Rebooking to ${flight.flightNo}`}
      footer={
        <FigButton
          variant="soft"
          fullWidth
          compact
          leadingIcon={<BellIcon />}
          onClick={onNotify}
        >
          Notify me when it&apos;s done
        </FigButton>
      }
    >
      {/* `1204:81630` — progress → charging → lock note. */}
      <div className="flex flex-col items-center gap-[16px] pb-[8px]">
        <ProgressTrack steps={steps} />

        {/* `1204:81634` */}
        <div className="flex w-full items-center gap-[8px] rounded-[14px] bg-gradient-to-b from-[rgba(166,244,197,0.52)] from-[20%] to-[rgba(255,255,255,0.32)] p-[12px]">
          <div className="flex min-w-0 flex-1 flex-col gap-[6px]">
            <p className="text-[13px] leading-normal text-[#666]">Authorising</p>
            <p className="fig-w-semibold text-[17px] leading-normal tabular text-fig-900">
              {formatINR(price.total)}
            </p>
          </div>
          <div className="flex min-w-0 flex-1 flex-col items-end gap-[6px] text-right">
            <p className="text-[13px] leading-normal text-[#666]">Seat</p>
            <p className="fig-w-semibold text-[17px] leading-normal tabular text-fig-900">
              {flight.seat.label}
            </p>
          </div>
        </div>

        {/* `1204:81641` */}
        <div className="flex w-full items-start justify-center gap-[2.5px]">
          <span className="flex shrink-0 items-center py-px">
            <LockIcon />
          </span>
          <p className="min-w-0 flex-1 text-[13px] leading-[15px] tracking-[0.05px] text-[#909093]">
            Cancelling during ticketing can create a duplicate charge, so I
            don&apos;t offer it here. Simulated booking; no real payment occurs.
          </p>
        </div>
      </div>
    </FigSheet>
  );
}

/** Furthest step the blue wash should cover — active, else last completed. */
function progressFocusIndex(steps: ExecutionStep[]): number {
  const active = steps.findIndex((step) => step.status === "active");
  if (active >= 0) return active;
  let lastDone = -1;
  for (let index = 0; index < steps.length; index += 1) {
    if (steps[index].status === "done") lastDone = index;
  }
  return Math.max(0, lastDone);
}

/** `1204:81631` — progressive glow + Highrise progress steps. */
function ProgressTrack({ steps }: { steps: ExecutionStep[] }) {
  const reduced = useReducedMotion();
  const trackRef = useRef<HTMLDivElement>(null);
  const iconRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const [glowHeight, setGlowHeight] = useState(28);
  const focusIndex = useMemo(() => progressFocusIndex(steps), [steps]);

  useLayoutEffect(() => {
    const track = trackRef.current;
    const icon = iconRefs.current[focusIndex];
    if (!track || !icon) return;

    const trackTop = track.getBoundingClientRect().top;
    const iconBottom = icon.getBoundingClientRect().bottom;
    // Cover through the focused step icon; pad so the pill reads as a capsule.
    setGlowHeight(Math.max(28, Math.round(iconBottom - trackTop + 6)));
  }, [focusIndex, steps]);

  return (
    <div ref={trackRef} className="relative w-full">
      {/* `1204:81632` — soft blue wash grows with the lit steps. */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -left-px top-0 w-[30px] origin-top rounded-full bg-gradient-to-b from-[rgba(0,136,255,0.55)] via-[rgba(0,136,255,0.22)] to-[rgba(0,136,255,0.04)]"
        initial={false}
        animate={{ height: glowHeight }}
        transition={
          reduced
            ? { duration: 0 }
            : { duration: duration.statusStep, ease: [...ease] }
        }
      />
      <ol className="relative flex w-full flex-col" aria-live="polite">
        {steps.map((step, index) => (
          <ProgressStep
            key={step.id}
            step={step}
            index={index}
            total={steps.length}
            isLast={index === steps.length - 1}
            iconRef={(node) => {
              iconRefs.current[index] = node;
            }}
          />
        ))}
      </ol>
    </div>
  );
}

function ProgressStep({
  step,
  index,
  total,
  isLast,
  iconRef,
}: {
  step: ExecutionStep;
  index: number;
  total: number;
  isLast: boolean;
  iconRef: (node: HTMLSpanElement | null) => void;
}) {
  const reduced = useReducedMotion();
  const done = step.status === "done";
  const active = step.status === "active";
  const blocked = step.status === "blocked";
  const pending = step.status === "pending";
  const lineLit = done || active;

  const detail =
    blocked
      ? "Waiting. Held until the replacement ticket exists."
      : active
        ? "In progress"
        : done
          ? "Complete"
          : null;

  return (
    <li className="flex w-full flex-col items-start">
      <div className="flex w-full items-start gap-[8px]">
        <div className="flex w-[28px] shrink-0 flex-col items-center self-stretch">
          <StepIcon
            ref={iconRef}
            done={done}
            active={active}
            reduced={Boolean(reduced)}
          />
          {!isLast ? (
            <span
              aria-hidden="true"
              className={[
                "w-[2px] flex-1 min-h-[8px]",
                lineLit ? "bg-[#08f]" : "bg-[#d0d5dd]",
              ].join(" ")}
            />
          ) : null}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
          <p
            className={[
              "font-ui text-[15px] font-semibold leading-[20px]",
              blocked || pending ? "text-[#667085]" : "text-fig-900",
            ].join(" ")}
          >
            {step.label}
          </p>
          {detail ? (
            <p
              className={[
                "truncate font-ui text-[12px] font-medium leading-[17px]",
                blocked ? "text-[#98a2b3]" : "text-[#667085]",
              ].join(" ")}
            >
              {detail}
            </p>
          ) : null}
          <span className="sr-only">
            Step {index + 1} of {total}
            {done
              ? ", done"
              : active
                ? ", in progress"
                : blocked
                  ? ", blocked until the previous step completes"
                  : ", not started"}
          </span>
        </div>
      </div>

      {!isLast ? (
        <div
          aria-hidden="true"
          className="flex h-[16px] w-[28px] flex-col items-center justify-center"
        >
          <span
            className={[
              "h-full w-[2px]",
              lineLit ? "bg-[#08f]" : "bg-[#d0d5dd]",
            ].join(" ")}
          />
        </div>
      ) : null}
    </li>
  );
}

const StepIcon = forwardRef<
  HTMLSpanElement,
  { done: boolean; active: boolean; reduced: boolean }
>(function StepIcon({ done, active, reduced }, ref) {
  if (done) {
    return (
      <span
        ref={ref}
        className="flex size-[28px] shrink-0 items-center justify-center rounded-full border border-[#08f] bg-white"
      >
        <img
          src={PROGRESS_TICK}
          alt=""
          width={14}
          height={12}
          className="pointer-events-none select-none"
          draggable={false}
        />
      </span>
    );
  }

  if (active) {
    return (
      <span
        ref={ref}
        className="flex size-[28px] shrink-0 items-center justify-center rounded-full border border-[#08f] bg-white"
      >
        <motion.img
          src={PROGRESS_ACTIVE}
          alt=""
          width={10}
          height={10}
          className="pointer-events-none select-none"
          draggable={false}
          animate={reduced ? {} : { opacity: [1, 0.4, 1], scale: [1, 0.92, 1] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: [...ease] }}
        />
      </span>
    );
  }

  return (
    <span
      ref={ref}
      className="flex size-[28px] shrink-0 items-center justify-center rounded-full"
    >
      <img
        src={PROGRESS_PENDING}
        alt=""
        width={10}
        height={10}
        className="pointer-events-none select-none opacity-90"
        draggable={false}
      />
    </span>
  );
});

function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M10 2.4a4.6 4.6 0 0 0-4.6 4.6v1.7c0 .7-.2 1.4-.6 2L3.9 12.4c-.4.5-.1 1.3.6 1.3h11c.7 0 1-.8.6-1.3l-.9-1.7c-.4-.6-.6-1.3-.6-2V7A4.6 4.6 0 0 0 10 2.4Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M8.2 14.8a1.8 1.8 0 0 0 3.6 0"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M5.25 8.25V6a3.75 3.75 0 0 1 7.5 0v2.25"
        stroke="#909093"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <rect
        x="3.75"
        y="8.25"
        width="10.5"
        height="7.5"
        rx="2"
        stroke="#909093"
        strokeWidth="1.4"
      />
    </svg>
  );
}
