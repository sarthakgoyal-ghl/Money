import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { DotsHorizontalIcon } from "../figma/assistant/threadAssets";
import { demoStateLinks } from "../../state/demoStates";

interface DemoStateMenuProps {
  activeSlug: string | null;
  onSelect: (slug: string) => void;
}

/**
 * Jump list for every deterministic demo state.
 *
 * Lives on the product ⋯ control inside the phone frame — same affordance the
 * designs use for overflow — so reviewers never leave the device chrome to jump
 * states. Also reachable at `?state=…`.
 */
export function DemoStateMenu({ activeSlug, onSelect }: DemoStateMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-label="More options"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="fig-circle-button flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-fig-circle text-fig-900 focus-ring-fig-map"
      >
        <span className="flex h-[24px] w-[24px] items-center justify-center">
          <DotsHorizontalIcon />
        </span>
      </button>

      {open ? (
        <div
          role="menu"
          aria-label="Demo states"
          className="absolute right-0 top-[52px] z-50 w-[266px] rounded-2xl border border-fig-line bg-white p-1.5 shadow-fig-xs"
        >
          <div className="px-3 pb-1 pt-2 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-fig-600">
            Demo states
          </div>
          <ul className="no-scrollbar max-h-[min(52vh,420px)] overflow-y-auto">
            {demoStateLinks.map((link) => {
              const isActive = link.slug === activeSlug;
              return (
                <li key={link.slug}>
                  <button
                    type="button"
                    role="menuitemradio"
                    aria-checked={isActive}
                    onClick={() => {
                      onSelect(link.slug);
                      setOpen(false);
                    }}
                    className={[
                      "flex w-full items-start gap-2.5 rounded-xl px-3 py-2 text-left hover:bg-fig-900/[0.04] focus-ring-fig",
                      isActive ? "bg-fig-900/[0.04]" : "",
                    ].join(" ")}
                  >
                    <span
                      aria-hidden="true"
                      className={[
                        "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full",
                        isActive
                          ? "bg-fig-900 text-white"
                          : "border border-fig-line",
                      ].join(" ")}
                    >
                      {isActive ? <Check size={10} strokeWidth={3} /> : null}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[13.5px] font-medium text-fig-900">
                        {link.label}
                      </span>
                      <span className="block text-[12px] leading-snug text-fig-600">
                        {link.description}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="mt-1.5 border-t border-fig-line px-3 pb-1 pt-1.5 text-[11px] text-fig-600">
            Also reachable at <code className="tabular">?state=…</code>
          </p>
        </div>
      ) : null}
    </div>
  );
}
