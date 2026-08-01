import type { ReactNode } from "react";
import { BubbleTail } from "./threadAssets";

/**
 * The message bubble geometry shared by every turn in the thread — Figma
 * `1204:80697` (sender) and `1204:80719` / `1204:80736` / `1204:80786`
 * (recipient).
 *
 * Numbers are fixed, not fractional:
 *
 * - **300 px max width** on a 402 px frame.
 * - **5.5 px of tip** past the bubble — Figma pulls the 16.5 px tail under the
 *   corner with an 11 px overlap (`mr-[-11px]` / `ml-[-11px]`).
 * - **12 / 7 padding, 16 px radius.**
 * - Tail is a **sibling** in a flex row. Absolute tails get clipped by the
 *   thread's `overflow-y: auto` (which forces `overflow-x: auto`).
 */

export const BUBBLE_WIDTH = 300;

interface FigBubbleProps {
  from: "sender" | "recipient";
  children: ReactNode;
  /**
   * Only the last bubble in a run has a tail; Figma hides the others. Passing
   * `tail` on every bubble is what makes a grouped answer look like four
   * separate interruptions.
   */
  tail?: boolean;
  /** Recipient cards that Figma pins to the full 300 px rather than hugging. */
  fixedWidth?: boolean;
  className?: string;
  /** Read out before the bubble's text, e.g. "You said: ". */
  spokenPrefix?: string;
}

export function FigBubble({
  from,
  children,
  tail = false,
  fixedWidth = false,
  className = "",
  spokenPrefix,
}: FigBubbleProps) {
  const sender = from === "sender";

  const surface = [
    "relative z-[1] rounded-[16px] px-[12px] py-[7px]",
    // Sender `#08f` / `#0088ff` — Figma `1204:80697`.
    sender ? "bg-[#0088ff] text-white" : "bg-fig-bubble text-fig-900",
    fixedWidth ? "w-[300px]" : "w-fit max-w-[300px]",
    // Tuck the flat edge of the 16.5 px tail under the corner.
    tail && sender ? "mr-[-11px]" : "",
    tail && !sender ? "ml-[-11px]" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={[
        "flex w-full items-end",
        sender ? "justify-end" : "justify-start",
        // Untailed bubbles in a run inset 5.5 px so their edge matches the
        // tailed tip's outer edge (`1204:80719` / `80736`).
        !tail && sender ? "pr-[5.5px]" : "",
        !tail && !sender ? "pl-[5.5px]" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {spokenPrefix ? <span className="sr-only">{spokenPrefix}</span> : null}

      <div className="flex items-end">
        {tail && !sender ? <BubbleTail side="recipient" /> : null}
        <div className={surface}>{children}</div>
        {tail && sender ? <BubbleTail side="sender" /> : null}
      </div>
    </div>
  );
}

/**
 * Bubble body text — Figma Bubble/Standard/Regular: SF Pro 16 / 1.25 at
 * `-0.15` tracking, 90 % opacity.
 */
export function BubbleText({ children }: { children: ReactNode }) {
  return (
    <p className="font-sans text-[16px] font-normal leading-[1.25] tracking-[-0.15px] opacity-90">
      {children}
    </p>
  );
}
