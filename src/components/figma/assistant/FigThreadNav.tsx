import { DemoStateMenu } from "../../shared/DemoStateMenu";

interface FigThreadNavProps {
  title: string;
  activeSlug: string | null;
  onDemoSelect: (slug: string) => void;
}

/**
 * Thread navigation bar — Figma `1204:80813`.
 *
 * **123 px** tall: `pt-63` clears the status bar, a 44 px accessory row, then
 * `pb-16`. Earlier builds used `pb-32` (139 px), which over-padded the title and
 * stole thread space the design does not give away.
 *
 * The back button exists in the file at `opacity: 0`, so it is kept as a
 * spacer: it centres the title against the overflow control on the right.
 *
 * The ⋯ control opens the demo-state jump list.
 */
export function FigThreadNav({ title, activeSlug, onDemoSelect }: FigThreadNavProps) {
  return (
    <header className="absolute inset-x-0 top-0 z-30 flex h-[123px] flex-col items-center bg-white/75 px-[16px] pb-[16px] pt-[63px] backdrop-blur-[25px]">
      <div className="flex h-[44px] w-full items-center justify-between">
        <span aria-hidden="true" className="h-[44px] w-[44px] shrink-0" />

        <h1 className="fig-w-semibold max-w-[200px] truncate text-[20px] leading-[normal] tracking-[-0.6px] text-fig-900">
          {title}
        </h1>

        <DemoStateMenu activeSlug={activeSlug} onSelect={onDemoSelect} />
      </div>
    </header>
  );
}
