import { useState } from "react";
import { ArrowUp } from "lucide-react";
import { assistantMeta } from "../../data/scenario";
import {
  MicrophoneIcon,
  PlusIcon,
  VoiceListeningIcon,
} from "../figma/assistant/threadAssets";

interface AssistantComposerProps {
  onSubmit: (text: string) => void;
  disabled?: boolean;
}

/**
 * Message Bar — Figma `1213:77758` / `1223:77939`.
 *
 * Empty field shows the voice waveform on the blue control; once the user
 * types, it switches to a send arrow (same pattern as ChatGPT / Claude).
 */
export function AssistantComposer({
  onSubmit,
  disabled = false,
}: AssistantComposerProps) {
  const [value, setValue] = useState("");
  const hasText = value.trim().length > 0;

  const send = (text: string) => {
    const trimmed = text.trim();
    if (trimmed.length === 0 || disabled) return;
    onSubmit(trimmed);
    setValue("");
  };

  return (
    <div className="flex w-full shrink-0 flex-col items-start gap-[6px] pb-[6px] pl-[12px] pr-[16px] pt-[12px]">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          send(value);
        }}
        className="fig-prompt-input flex w-full max-w-[768px] shrink-0 items-center gap-[8px] rounded-[20px] p-[12px]"
      >
        <button
          type="button"
          aria-label="Attach"
          aria-disabled="true"
          tabIndex={-1}
          className="fig-circle-button pointer-events-none flex size-[32px] shrink-0 items-center justify-center rounded-full drop-shadow-[0px_32px_32px_rgba(16,24,40,0.14)]"
        >
          <PlusIcon />
        </button>

        <label htmlFor="assistant-composer" className="sr-only">
          Ask the trip assistant
        </label>
        <input
          id="assistant-composer"
          type="text"
          value={value}
          disabled={disabled}
          onChange={(event) => setValue(event.target.value)}
          placeholder={assistantMeta.composerPlaceholder}
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent font-ui text-[15px] font-medium leading-[22px] text-fig-900 outline-none placeholder:text-fig-400 disabled:opacity-50"
        />

        {!hasText ? (
          <button
            type="button"
            aria-label="Dictate"
            aria-disabled="true"
            tabIndex={-1}
            className="pointer-events-none flex size-[32px] shrink-0 items-center justify-center rounded-[16px]"
          >
            <MicrophoneIcon />
          </button>
        ) : null}

        <button
          type={hasText ? "submit" : "button"}
          aria-label={hasText ? "Send message" : "Voice mode"}
          disabled={disabled}
          className="flex size-[32px] shrink-0 items-center justify-center overflow-hidden rounded-[8px] bg-fig-blue p-[8px] text-white shadow-fig-xs transition-colors hover:bg-[#0079e6] disabled:bg-fig-400 focus-ring-fig"
        >
          {hasText ? (
            <ArrowUp size={18} strokeWidth={2.5} aria-hidden="true" />
          ) : (
            <VoiceListeningIcon />
          )}
        </button>
      </form>
    </div>
  );
}
