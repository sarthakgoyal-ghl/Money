import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import {
  getFigmaFileTitle,
  getFigmaUrl,
  toFigmaEmbedUrl,
} from "../config/env";
import { EASE } from "./motion";

interface FigmaButtonProps {
  className?: string;
}

/** Trigger stays in the CTA row; dock portals into `[data-figma-dock-host]`. */
export function FigmaButton({
  className = "vx-btn vx-btn-secondary",
}: FigmaButtonProps) {
  const figmaUrl = getFigmaUrl();
  const [open, setOpen] = useState(false);
  const [host, setHost] = useState<HTMLElement | null>(null);
  const panelId = useId();
  const reduce = useReducedMotion();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const embedUrl = figmaUrl ? toFigmaEmbedUrl(figmaUrl) : null;
  const title = figmaUrl ? getFigmaFileTitle(figmaUrl) : "Figma file";
  const displayTitle = title.replace(/\s*\|\s*/g, " · ");

  useLayoutEffect(() => {
    const section = triggerRef.current?.closest("section");
    setHost(
      section?.querySelector<HTMLElement>("[data-figma-dock-host]") ?? null,
    );
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      if (document.fullscreenElement) {
        void document.exitFullscreen().catch(() => undefined);
      }
    };
  }, [open]);

  if (!figmaUrl || !embedUrl) return null;

  const toggleFullscreen = () => {
    const node = frameRef.current;
    if (!node) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => undefined);
      return;
    }
    void node.requestFullscreen().catch(() => undefined);
  };

  const dock = (
    <AnimatePresence initial={false}>
      {open ? (
        <m.div
          id={panelId}
          className="vx-figma-dock"
          role="region"
          aria-label={title}
          initial={reduce ? false : { opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={reduce ? undefined : { opacity: 0, height: 0 }}
          transition={{ duration: reduce ? 0.01 : 0.35, ease: EASE }}
        >
          <div className="vx-figma-dock-panel">
            <div className="vx-figma-dock-toolbar">
              <div className="vx-figma-dock-brand">
                <FigmaLogo className="vx-figma-dock-logo" />
                <p className="vx-figma-dock-title">{displayTitle}</p>
              </div>
              <div className="vx-figma-dock-actions">
                <a
                  href={figmaUrl}
                  className="vx-figma-open-btn"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open in Figma
                  <ExternalLinkIcon />
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
                <button
                  type="button"
                  className="vx-figma-icon-btn"
                  aria-label="Toggle fullscreen"
                  onClick={toggleFullscreen}
                >
                  <FullscreenIcon />
                </button>
                <button
                  type="button"
                  className="vx-figma-icon-btn"
                  aria-label="Close Figma viewer"
                  onClick={() => setOpen(false)}
                >
                  <CloseIcon />
                </button>
              </div>
            </div>
            <div ref={frameRef} className="vx-figma-dock-frame">
              <iframe
                title={title}
                src={embedUrl}
                className="vx-figma-dock-iframe"
                allowFullScreen
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
          </div>
        </m.div>
      ) : null}
    </AnimatePresence>
  );

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={`${className} vx-figma-trigger`.trim()}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        <FigmaLogo />
        <span>Figma</span>
        <ChevronIcon className="vx-figma-chevron" />
      </button>
      {host
        ? createPortal(dock, host)
        : open
          ? (
              <div className="vx-figma-dock-host vx-figma-dock-host-inline">
                {dock}
              </div>
            )
          : null}
    </>
  );
}

function FigmaLogo({ className }: { className?: string }) {
  return (
    <svg
      className={className ?? "vx-figma-logo"}
      width="12"
      height="18"
      viewBox="0 0 38 57"
      aria-hidden="true"
    >
      <path
        fill="#F24E1E"
        d="M0 9.5C0 4.253 4.253 0 9.5 0H19v19H9.5C4.253 19 0 14.747 0 9.5Z"
      />
      <path
        fill="#A259FF"
        d="M0 28.5C0 23.253 4.253 19 9.5 19H19v19H9.5C4.253 38 0 33.747 0 28.5Z"
      />
      <path
        fill="#0ACF83"
        d="M0 47.5C0 42.253 4.253 38 9.5 38H19v9.5C19 52.747 14.747 57 9.5 57S0 52.747 0 47.5Z"
      />
      <path
        fill="#FF7262"
        d="M19 0v19h9.5c5.247 0 9.5-4.253 9.5-9.5S33.747 0 28.5 0H19Z"
      />
      <path
        fill="#1ABCFE"
        d="M28.5 19C23.253 19 19 23.253 19 28.5S23.253 38 28.5 38 38 33.747 38 28.5 33.747 19 28.5 19Z"
      />
    </svg>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="12"
      height="12"
      viewBox="0 0 12 12"
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        d="M2.2 4.2a.75.75 0 0 1 1.06 0L6 6.94l2.74-2.74a.75.75 0 1 1 1.06 1.06l-3.27 3.27a.75.75 0 0 1-1.06 0L2.2 5.26a.75.75 0 0 1 0-1.06Z"
      />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
      <path
        fill="currentColor"
        d="M4.5 3.25a.75.75 0 0 0 0 1.5h5.69L3.47 11.47a.75.75 0 1 0 1.06 1.06l6.72-6.72v5.69a.75.75 0 0 0 1.5 0v-7.5A.75.75 0 0 0 12 3.25H4.5Z"
      />
    </svg>
  );
}

function FullscreenIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path
        fill="currentColor"
        d="M2 6V2h4v1.5H3.5V6H2Zm8-2.5V2h4v4h-1.5V3.5H10ZM3.5 10H2v4h4v-1.5H3.5V10Zm9 2.5H10V14h4v-4h-1.5v2.5Z"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path
        fill="currentColor"
        d="M3.2 3.2a.75.75 0 0 1 1.06 0L8 6.94l3.74-3.74a.75.75 0 1 1 1.06 1.06L9.06 8l3.74 3.74a.75.75 0 1 1-1.06 1.06L8 9.06l-3.74 3.74a.75.75 0 1 1-1.06-1.06L6.94 8 3.2 4.26a.75.75 0 0 1 0-1.06Z"
      />
    </svg>
  );
}
