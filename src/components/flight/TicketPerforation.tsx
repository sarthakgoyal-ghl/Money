interface TicketPerforationProps {
  /** Background colour of the surface behind the pass, for the notch fill. */
  notchClass?: string;
}

/**
 * The tear line of a ticket object: two punched notches and a dashed rule.
 * Purely structural — it is what makes the pass read as a physical artefact
 * rather than another rounded card.
 */
export function TicketPerforation({
  notchClass = "bg-canvas",
}: TicketPerforationProps) {
  return (
    <div aria-hidden="true" className="relative mt-4 h-4">
      <span
        className={[
          "absolute -left-2 top-0 h-4 w-4 rounded-full",
          notchClass,
        ].join(" ")}
      />
      <span
        className={[
          "absolute -right-2 top-0 h-4 w-4 rounded-full",
          notchClass,
        ].join(" ")}
      />
      <span className="absolute left-4 right-4 top-1/2 block border-t border-dashed border-ink-200" />
    </div>
  );
}
