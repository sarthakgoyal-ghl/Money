import { ArrowRight } from "lucide-react";
import { InterpretedBrief } from "../components/ai/InterpretedBrief";
import { DockChoiceRow } from "../components/dock/DockControls";
import { DockNote } from "../components/dock/DockPrimitives";
import { nightEyebrow, nightTitle } from "../components/dock/night";
import { Button } from "../components/ui/Button";
import type { DeadlineIntent, TripConstraints } from "../data/scenario";
import { userCorrection } from "../data/scenario";

export type MisreadChoice = "depart" | "arrive" | "rewrite";

interface MisreadPanelProps {
  constraints: TripConstraints;
  choice: MisreadChoice | null;
  onChoose: (choice: MisreadChoice) => void;
}

/**
 * The assistant misread one thing, and repairs only that thing.
 *
 * Budget, seat preference and travel date are preserved untouched, and the diff
 * shows a single constraint replacing itself. The conversation is not replayed
 * and the flow does not restart — being wrong about one word should cost one
 * correction, not the whole session.
 */
export function MisreadPanel({ constraints, choice, onChoose }: MisreadPanelProps) {
  const previewIntent: DeadlineIntent =
    choice === "depart"
      ? "depart_before"
      : choice === "arrive"
        ? "arrive_before"
        : constraints.intent;

  const previewConstraints: TripConstraints = {
    ...constraints,
    intent: previewIntent,
  };

  return (
    <div className="space-y-4 pt-1">
      <div className="flex justify-end">
        <p className="max-w-[92%] rounded-2xl rounded-br-md border border-white/10 bg-white/[0.08] px-3.5 py-2.5 text-[13.5px] leading-snug text-white/88">
          <span className="sr-only">You said: </span>
          {userCorrection}
        </p>
      </div>

      <header>
        <h1 className={nightTitle}>Thanks for correcting that.</h1>
        <p className="mt-1 text-[14px] leading-snug text-white/78">
          I treated 18:00 as an arrival deadline.
        </p>
        <p className="mt-1.5 text-[13px] text-signal-ok">
          No booking or payment changes were made.
        </p>
      </header>

      {/* Exactly one constraint, shown replacing itself. */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4">
        <p className={nightEyebrow}>The constraint I got wrong</p>
        <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[14px] font-medium tabular">
          {choice === "arrive" ? (
            <span className="rounded-full border border-route-cyan/55 bg-route-cyan/[0.14] px-3 py-1.5 text-white">
              Keep Arrive by 18:00
            </span>
          ) : (
            <>
              <span className="rounded-full border border-white/12 bg-white/[0.06] px-3 py-1.5 text-white/52 line-through">
                Arrive by 18:00
              </span>
              <ArrowRight
                size={14}
                strokeWidth={2.5}
                aria-hidden="true"
                className="text-white/45"
              />
              <span
                className={[
                  "rounded-full border px-3 py-1.5",
                  choice === "depart"
                    ? "border-route-cyan/55 bg-route-cyan/[0.14] text-white"
                    : "border-white/12 bg-white/[0.06] text-white/72",
                ].join(" ")}
              >
                {choice === "rewrite"
                  ? "You'll tell me"
                  : choice === "depart"
                    ? "Depart by 18:00"
                    : "…"}
              </span>
            </>
          )}
        </div>
      </div>

      <fieldset>
        <legend className="text-[14px] font-semibold text-white">
          Which deadline should I use?
        </legend>
        <div
          role="radiogroup"
          aria-label="Which deadline should I use?"
          className="mt-2.5 space-y-2"
        >
          <DockChoiceRow
            selected={choice === "depart"}
            onSelect={() => onChoose("depart")}
            title={`Depart before ${constraints.deadlineLabel}`}
            subtitle="Leaving Mumbai on time matters most"
          />
          <DockChoiceRow
            selected={choice === "arrive"}
            onSelect={() => onChoose("arrive")}
            title={`Arrive before ${constraints.deadlineLabel}`}
            subtitle="Landing in Bengaluru on time matters most"
          />
          <DockChoiceRow
            selected={choice === "rewrite"}
            onSelect={() => onChoose("rewrite")}
            title="Rewrite my request"
            subtitle="Start from a new message instead"
          />
        </div>
      </fieldset>

      {choice && choice !== "rewrite" ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3.5">
          <InterpretedBrief
            constraints={previewConstraints}
            tone="dark"
            changedKeys={["deadline"]}
          />
          <p className="mt-2.5 text-[12.5px] text-white/62">
            Budget, seat preference, and travel date are unchanged.
          </p>
        </div>
      ) : null}

      <DockNote>
        Correcting one constraint re-runs the search. It never restarts the
        conversation.
      </DockNote>
    </div>
  );
}

interface MisreadActionsProps {
  choice: MisreadChoice | null;
  onApply: () => void;
}

export function MisreadActions({ choice, onApply }: MisreadActionsProps) {
  return (
    <Button
      variant="onDark"
      size="lg"
      fullWidth
      onClick={onApply}
      disabled={!choice}
    >
      {choice === "rewrite" ? "Rewrite my request" : "Update flight options"}
    </Button>
  );
}
