import type { ReactNode } from "react";

interface AppShellProps {
  children: ReactNode;
}

/**
 * Presentation frame.
 *
 * On mobile the product fills the viewport edge to edge — a map-first interface
 * loses its point the moment it is boxed in. On desktop it is centred at 420 px
 * against a quiet dark backdrop, with no notch, status bar or decorative phone
 * mockup: reviewers need to reach the demo controls, and a fake device frame
 * would only make a real interface look like a screenshot of one.
 */
export function AppShell({ children }: AppShellProps) {
  return (
    <div className="relative flex h-[100dvh] w-full items-center justify-center overflow-hidden bg-[#05070C]">
      {/* Desktop-only backdrop. Static gradients: nothing here animates. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 hidden md:block"
        style={{
          background:
            "radial-gradient(70% 50% at 50% 0%, #0C1420 0%, #070A11 55%, #04060A 100%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 hidden md:block"
        style={{
          background:
            "radial-gradient(26% 30% at 20% 32%, rgba(38,136,255,0.10) 0%, rgba(38,136,255,0) 70%), radial-gradient(24% 28% at 82% 64%, rgba(156,140,255,0.09) 0%, rgba(156,140,255,0) 70%)",
        }}
      />

      <div
        className={[
          "relative h-full w-full overflow-hidden bg-night",
          "md:h-[860px] md:max-h-[calc(100dvh-40px)] md:w-[420px]",
          "md:rounded-[28px] md:border md:border-white/10",
          "md:shadow-[0_40px_90px_-30px_rgba(0,0,0,0.85)]",
        ].join(" ")}
      >
        {children}
      </div>
    </div>
  );
}
