import { EditIcon, ReactionBadgeArt, ThumbsUpEmoji } from "./threadAssets";

interface FigUnderstoodCardProps {
  items: readonly string[];
  onEdit: () => void;
}

/**
 * "What I understood" — Figma `1204:80704`.
 *
 * 300 px recipient bubble. Reaction/edit badge (`1204:80706`, 35.72×42.87) is a
 * sibling anchored to the bubble's top-right with a −12 px overlap and 21 px
 * top pad so it sits on the corner — not the thread column edge.
 *
 * Brief rows: Inter 14/20 with thumbs leading (`1204:80722` visual order —
 * Figma’s rotate wrappers invert DOM order in the export).
 */
export function FigUnderstoodCard({ items, onEdit }: FigUnderstoodCardProps) {
  return (
    <section
      aria-label="What I understood"
      className="relative isolate flex w-full justify-start pl-[5.5px]"
    >
      {/* Width locked to the bubble so `right` is the bubble edge, not the column. */}
      <div className="relative w-[300px] pt-[21px]">
        <button
          type="button"
          onClick={onEdit}
          aria-label="Correct what I understood"
          className="absolute right-[-12px] top-0 z-[2] block h-[42.868px] w-[35.72px] focus-ring-fig"
        >
          <ReactionBadgeArt />
          {/* `1204:80715` — pencil centred in the 34 px disc. */}
          <span className="pointer-events-none absolute left-[calc(50%+1.36px)] top-[calc(50%-4.43px)] block size-[18px] -translate-x-1/2 -translate-y-1/2">
            <EditIcon />
          </span>
        </button>

        <div className="relative z-[1] flex w-[300px] flex-col gap-[6px] rounded-[16px] bg-fig-bubble px-[12px] py-[7px] text-fig-900">
          <p className="font-sans text-[16px] font-normal leading-[1.25] tracking-[-0.15px] opacity-90">
            What I understood
          </p>

          <ul className="flex flex-col gap-[4px]">
            {items.map((item) => (
              <li key={item} className="flex items-center gap-[6px]">
                <ThumbsUpEmoji />
                <span className="min-w-0 flex-1 font-ui text-[14px] font-normal leading-[20px] opacity-90">
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
