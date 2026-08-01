import type { ReactNode } from "react";
import { CheckCircle2, CircleDashed, OctagonPause } from "lucide-react";

export type Certainty = "confirmed" | "pending" | "stopped";

export interface DockStatusRow {
  label: string;
  value: string;
  certainty: Certainty;
  note?: string;
}

interface DockStatusListProps {
  title: string;
  rows: DockStatusRow[];
  footer?: ReactNode;
}

const TONE: Record<Certainty, { icon: ReactNode; text: string; spoken: string }> = {
  confirmed: {
    icon: <CheckCircle2 size={14} strokeWidth={2.25} />,
    text: "text-signal-ok",
    spoken: "Confirmed",
  },
  pending: {
    icon: <CircleDashed size={14} strokeWidth={2.25} />,
    text: "text-signal-warn",
    spoken: "Pending",
  },
  stopped: {
    icon: <OctagonPause size={14} strokeWidth={2.25} />,
    text: "text-signal-danger",
    spoken: "Stopped",
  },
};

/**
 * Three distinct levels of certainty, on one surface.
 *
 * The whole point of the escalation screen is that "paid", "ticketed" and
 * "still yours" are *different* facts with different confidence — collapsing
 * them into one status would be the lie. Certainty is carried by an icon and a
 * spoken word as well as colour, so it survives being read in greyscale or by a
 * screen reader.
 */
export function DockStatusList({ title, rows, footer }: DockStatusListProps) {
  return (
    <section
      aria-label={title}
      className="rounded-2xl border border-white/10 bg-white/[0.055]"
    >
      <dl className="divide-y divide-white/10">
        {rows.map((row) => {
          const tone = TONE[row.certainty];
          return (
            <div key={row.label} className="flex items-start gap-3 px-4 py-3">
              <span aria-hidden="true" className={`mt-[2px] shrink-0 ${tone.text}`}>
                {tone.icon}
              </span>
              <div className="min-w-0 flex-1">
                <dt className="text-[12px] text-white/62">{row.label}</dt>
                <dd className="mt-0.5 text-[14px] font-medium tabular text-white">
                  {row.value}
                  <span className="sr-only">, {tone.spoken}</span>
                </dd>
                {row.note ? (
                  <p className="mt-0.5 text-[12px] leading-snug text-white/58">
                    {row.note}
                  </p>
                ) : null}
              </div>
            </div>
          );
        })}
      </dl>
      {footer ? (
        <div className="border-t border-white/10 px-4 py-3">{footer}</div>
      ) : null}
    </section>
  );
}
