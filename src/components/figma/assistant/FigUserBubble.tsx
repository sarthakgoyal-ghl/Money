import { BubbleText, FigBubble } from "./FigBubble";

/**
 * The user's request — Figma `1204:80697`.
 *
 * Right-aligned, `#0088ff`, tailed. It is the only sender turn in the thread,
 * so it always carries a tail.
 */
export function FigUserBubble({ children }: { children: React.ReactNode }) {
  return (
    <FigBubble from="sender" tail spokenPrefix="You said: ">
      <BubbleText>{children}</BubbleText>
    </FigBubble>
  );
}
