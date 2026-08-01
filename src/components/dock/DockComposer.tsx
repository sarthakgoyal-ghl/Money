import { useState } from "react";
import { ArrowUp } from "lucide-react";
import { suggestedPrompts } from "../../data/composerPrompts";

interface DockComposerProps {
  onSubmit: (text: string) => void;
  /** Suppressed while the assistant is mid-action. */
  disabled?: boolean;
  placeholder?: string;
  /** Suggestions above the field. Hidden on panels that already list actions. */
  showSuggestions?: boolean;
}

/**
 * The persistent composer.
 *
 * A real input, always in the same place, so the product reads as something you
 * can talk to rather than a wizard you step through. It resolves typed text
 * through a fixed prompt table — this prototype contains no model, and a text
 * box that silently ignores input is worse than one that says what it can do.
 */
export function DockComposer({
  onSubmit,
  disabled = false,
  placeholder = "Ask for a different option…",
  showSuggestions = false,
}: DockComposerProps) {
  const [value, setValue] = useState("");

  const send = (text: string) => {
    const trimmed = text.trim();
    if (trimmed.length === 0 || disabled) return;
    onSubmit(trimmed);
    setValue("");
  };

  return (
    <div className="safe-bottom border-t border-white/10 bg-night/70 px-4 pt-2.5">
      {showSuggestions ? (
        <ul className="no-scrollbar -mx-1 mb-2 flex gap-1.5 overflow-x-auto px-1 pb-0.5">
          {suggestedPrompts.map((prompt) => (
            <li key={prompt.id}>
              <button
                type="button"
                onClick={() => send(prompt.text)}
                disabled={disabled}
                className="inline-flex min-h-[44px] items-center whitespace-nowrap rounded-full border border-white/16 bg-white/[0.07] px-3.5 text-[12.5px] font-medium text-white/82 hover:bg-white/12 disabled:opacity-45 focus-ring-dark"
              >
                {prompt.text}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          send(value);
        }}
        className="flex items-center gap-2"
      >
        <label htmlFor="dock-composer" className="sr-only">
          Ask the trip assistant
        </label>
        <input
          id="dock-composer"
          type="text"
          value={value}
          disabled={disabled}
          onChange={(event) => setValue(event.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          className="h-11 min-w-0 flex-1 rounded-full border border-white/14 bg-white/[0.07] px-4 text-[14px] text-white placeholder:text-white/48 disabled:opacity-50 focus-ring-dark"
        />
        <button
          type="submit"
          disabled={disabled || value.trim().length === 0}
          aria-label="Send message"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-night transition-opacity disabled:bg-white/20 disabled:text-white/45 focus-ring-dark"
        >
          <ArrowUp size={17} strokeWidth={2.5} aria-hidden="true" />
        </button>
      </form>
    </div>
  );
}
