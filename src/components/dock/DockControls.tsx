import type { ReactNode } from "react";

import { Check } from "lucide-react";


export interface SegmentOption {
  value: string;
  label: string;
}

interface DockSegmentedProps {
  name: string;
  ariaLabel: string;
  value: string;
  options: readonly SegmentOption[];
  onChange: (value: string) => void;
}

/**
 * Segmented control on night.
 *
 * A native radio group underneath: the selected segment is announced as a radio
 * state, not inferred from a highlight, and arrow keys work the way a screen
 * reader user expects.
 */
export function DockSegmented({
  name,
  ariaLabel,
  value,
  options,
  onChange,
}: DockSegmentedProps) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="flex gap-1 rounded-full border border-white/12 bg-white/[0.05] p-1"
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          // The selected fill is a real background on the label, not an
          // absolutely-positioned sibling pill. A sliding pill animates nicely
          // but leaves the label's contrast uncomputable from the DOM — the
          // ratio has to be provable, not just visually true.
          <label
            key={option.value}
            className={[
              "flex min-h-[40px] flex-1 cursor-pointer items-center justify-center rounded-full",
              "transition-colors duration-150",
              active ? "bg-white" : "hover:bg-white/[0.06]",
            ].join(" ")}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={active}
              onChange={() => onChange(option.value)}
              className="peer sr-only"
            />
            <span
              className={[
                "select-none px-2 text-[13px] font-medium tabular",
                "peer-focus-visible:underline peer-focus-visible:underline-offset-4",
                active ? "text-night" : "text-white/72",
              ].join(" ")}
            >
              {option.label}
            </span>
          </label>
        );
      })}
    </div>
  );
}

interface DockChoiceRowProps {
  selected: boolean;
  onSelect: () => void;
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
}

/** A single-select row on night — used wherever the user picks one of several. */
export function DockChoiceRow({
  selected,
  onSelect,
  title,
  subtitle,
  trailing,
}: DockChoiceRowProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={[
        "flex min-h-[56px] w-full items-start gap-3 rounded-2xl border p-3.5 text-left focus-ring-dark",
        selected
          ? "border-route-cyan/55 bg-route-cyan/[0.11]"
          : "border-white/10 bg-white/[0.045] hover:bg-white/[0.075]",
      ].join(" ")}
    >
      <span
        aria-hidden="true"
        className={[
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
          selected
            ? "border-route-cyan bg-route-cyan text-night"
            : "border-white/32 bg-transparent",
        ].join(" ")}
      >
        {selected ? <Check size={12} strokeWidth={3} /> : null}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14.5px] font-medium tabular text-white">
          {title}
        </span>
        {subtitle ? (
          <span className="mt-0.5 block text-[12.5px] leading-snug text-white/68">
            {subtitle}
          </span>
        ) : null}
      </span>
      {trailing ? <span className="shrink-0">{trailing}</span> : null}
    </button>
  );
}

interface DockToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  hint?: string;
}

export function DockToggle({ checked, onChange, label, hint }: DockToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex min-h-[52px] w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.045] px-3.5 text-left focus-ring-dark"
    >
      <span>
        <span className="block text-[14px] font-medium text-white">{label}</span>
        {hint ? (
          <span className="block text-[12px] text-white/62">{hint}</span>
        ) : null}
      </span>
      <span
        aria-hidden="true"
        className={[
          "relative h-6 w-10 shrink-0 rounded-full transition-colors duration-150",
          checked ? "bg-route-cyan" : "bg-white/20",
        ].join(" ")}
      >
        <span
          className={[
            "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-[left] duration-150",
            checked ? "left-[18px]" : "left-0.5",
          ].join(" ")}
        />
      </span>
    </button>
  );
}
