/**
 * Exported graphics from the Assistant thread — Figma `1204:80683`.
 *
 * Every glyph here is the asset Figma exported, not a redrawn approximation.
 * Each one keeps two boxes: the designed outer frame and the drawn leaf inside
 * it. Figma reports the leaf as an inset, and collapsing the two into a single
 * `width`/`height` is what makes exported icons drift — a 10 px meta icon whose
 * artwork only fills 83 % of its frame stops aligning with the 10 px text beside
 * it. So both are declared, always.
 */

const ASSET = "/figma/assets";

interface FigAssetProps {
  src: string;
  /** The designed outer frame. */
  w: number;
  h: number;
  /** The drawn leaf's inset inside that frame, verbatim from Figma. */
  inset?: string;
  className?: string;
}

function FigAsset({ src, w, h, inset = "0px", className = "" }: FigAssetProps) {
  return (
    <span
      aria-hidden="true"
      className={`relative block shrink-0 ${className}`}
      style={{ width: w, height: h }}
    >
      <span className="absolute block" style={{ inset }}>
        <img
          src={src}
          alt=""
          className="absolute inset-0 block h-full w-full max-w-none"
        />
      </span>
    </span>
  );
}

/* ---------------------------------------------------------------- *
 * Bubble tails                                                      *
 * ---------------------------------------------------------------- */

/**
 * The iMessage tail, 16.5 × 17.
 *
 * Only the last bubble in a run carries one — Figma marks the tails on the
 * stacked bubbles `opacity: 0`, which is the same grouping rule iMessage uses.
 *
 * The exported path draws the tip on the **left**. Sender places the tail to
 * the right of the bubble, so it is flipped on X so the tip points outward.
 * Recipient keeps the native orientation (tip left).
 */
export function BubbleTail({ side }: { side: "sender" | "recipient" }) {
  const src = side === "sender" ? "tail-sender.svg" : "tail-recipient.svg";
  return (
    <FigAsset
      src={`${ASSET}/${src}`}
      w={16.5}
      h={17}
      className={[
        "relative z-0 shrink-0 self-end",
        side === "sender" ? "-scale-x-100" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    />
  );
}

/* ---------------------------------------------------------------- *
 * Activity disclosure                                               *
 * ---------------------------------------------------------------- */

/** `hourglass_top`, 16 px frame. */
export function HourglassIcon() {
  return (
    <FigAsset
      src={`${ASSET}/hourglass-top.svg`}
      w={16}
      h={16}
      inset="8.33% 25%"
    />
  );
}

/** `expand_less`, 16 px frame — rotated to point down when collapsed. */
export function DisclosureChevron({ open }: { open: boolean }) {
  return (
    <FigAsset
      src={`${ASSET}/chevron-expand.svg`}
      w={16}
      h={16}
      inset="36.28% 26.72%"
      className={open ? "" : "rotate-180"}
    />
  );
}

/* ---------------------------------------------------------------- *
 * What I understood                                                 *
 * ---------------------------------------------------------------- */

/**
 * `iMessage/Color/Thumbs Up` — Figma `1204:76949` / row glyph `1204:80724`.
 *
 * Master art is 99×99; the brief row pins it to **16×16** (Heart Icon frame in
 * the thread), not the 30 px master board size.
 */
export function ThumbsUpEmoji() {
  return <FigAsset src={`${ASSET}/thumbs-up.png`} w={16} h={16} />;
}

/** `edit-05`, 18 px frame. */
export function EditIcon() {
  return (
    <FigAsset
      src={`${ASSET}/edit-05.svg`}
      w={18}
      h={18}
      inset="3.66% 3.66% 4.17% 4.17%"
    />
  );
}

/**
 * The reaction badge that carries the edit affordance — Figma `1204:80706`.
 *
 * A 34 px white disc plus the trailing dots in a 35.72 × 42.87 box. Anchored to
 * the bubble's top-right (`right: -12px`); dots read as attached to the corner.
 */
export function ReactionBadgeArt() {
  return (
    <span aria-hidden="true" className="pointer-events-none absolute inset-0 block">
      <img
        src={`${ASSET}/reaction-ellipse.svg`}
        alt=""
        className="absolute left-[1.72px] top-[0.13px] block h-[34px] w-[34px] max-w-none"
      />
      {/* The leaf needs its own positioned wrapper: an absolutely positioned
          <img> with four offsets *and* a full width is over-constrained, so the
          right offset is dropped and the artwork overflows the badge. */}
      <span
        className="absolute block"
        style={{ inset: "2.64% 2.8% 22.71% 7.62%" }}
      >
        <img
          src={`${ASSET}/reaction-union.svg`}
          alt=""
          className="absolute inset-0 block h-full w-full max-w-none"
        />
      </span>
    </span>
  );
}

/* ---------------------------------------------------------------- *
 * Recommendation card                                               *
 * ---------------------------------------------------------------- */

/** `expand-01`, 20 px frame, inside the 36 px glass control on the map. */
export function ExpandIcon() {
  return (
    <FigAsset src={`${ASSET}/expand-01.svg`} w={20} h={20} inset="8.33%" />
  );
}

/** The three 10 px flight-meta glyphs. */
export function SeatIcon() {
  return (
    <FigAsset
      src={`${ASSET}/meta-seat.svg`}
      w={10}
      h={10}
      inset="9.36% 16.67%"
    />
  );
}

export function BaggageIcon() {
  return (
    <FigAsset src={`${ASSET}/meta-bag.svg`} w={10} h={10} inset="8.33% 16.67%" />
  );
}

export function CabinClassIcon() {
  return (
    <FigAsset
      src={`${ASSET}/meta-class.svg`}
      w={10}
      h={10}
      inset="12.6% 7.15%"
    />
  );
}

/**
 * The origin/destination connector between the two times.
 *
 * Two 8 px terminal dots with a CSS hairline between them. The Figma export
 * was a 0.5 px SVG (`node-line.svg`) — that disappears on mobile/retina, so
 * the stroke is a 1 px CSS rule at the same `#BDBDBD` colour.
 */
export function RouteConnector() {
  return (
    <span
      aria-hidden="true"
      className="flex h-[8px] w-full shrink-0 items-center"
    >
      {/* `1204:80874` / `80876` — 8×8 terminal dots. */}
      <span className="relative size-[8px] shrink-0 overflow-hidden">
        <img
          src={`${ASSET}/node-dot.svg`}
          alt=""
          className="absolute inset-0 block size-full max-w-none"
        />
      </span>
      <span
        aria-hidden="true"
        className="mx-[-1px] h-px min-w-px flex-1 bg-[#BDBDBD]"
      />
      <span className="relative size-[8px] shrink-0 overflow-hidden">
        <img
          src={`${ASSET}/node-dot.svg`}
          alt=""
          className="absolute inset-0 block size-full max-w-none"
        />
      </span>
    </span>
  );
}

/* ---------------------------------------------------------------- *
 * Why this option                                                   *
 * ---------------------------------------------------------------- */

/** `auto_awesome`, 18 px frame. */
export function AutoAwesomeIcon() {
  return (
    <FigAsset
      src={`${ASSET}/auto-awesome.svg`}
      w={18}
      h={18}
      inset="7.11% 8.59%"
    />
  );
}

/** `refresh-cw-02`, 12 px frame. Ships in the design's link blue. */
export function RefreshIcon() {
  return (
    <FigAsset
      src={`${ASSET}/refresh-cw-02.svg`}
      w={12}
      h={12}
      inset="8.33% 4.17%"
    />
  );
}

/** `shield-tick`, 10 px frame, beside the "stays booked" note. */
export function ShieldTickIcon() {
  return (
    <FigAsset
      src={`${ASSET}/shield-tick.svg`}
      w={10}
      h={10}
      inset="4.45% 12.5% 4.74% 12.5%"
    />
  );
}

/* ---------------------------------------------------------------- *
 * Navigation and composer                                           *
 * ---------------------------------------------------------------- */

/** `dots-horizontal`, 24 px frame. */
export function DotsHorizontalIcon() {
  return (
    <FigAsset
      src={`${ASSET}/dots-horizontal.svg`}
      w={24}
      h={24}
      inset="41.67% 12.5%"
    />
  );
}

/** `chevron-left`, 24 px frame. */
export function ChevronLeftIcon() {
  return (
    <FigAsset
      src={`${ASSET}/chevron-left.svg`}
      w={24}
      h={24}
      inset="20.83% 33.33%"
    />
  );
}

/** `plus`, 16 px frame, inside the composer's 32 px glass disc. */
export function PlusIcon() {
  return <FigAsset src={`${ASSET}/plus.svg`} w={16} h={16} inset="16.67%" />;
}

/** `microphone-01`, 18 px frame. */
export function MicrophoneIcon() {
  return (
    <FigAsset
      src={`${ASSET}/microphone-01.svg`}
      w={18}
      h={18}
      inset="4.17% 16.67%"
    />
  );
}

/**
 * The waveform in the composer's send button — Figma `1204:78123`.
 *
 * Five zero-width vectors on an 18 px frame at the exact offsets the component
 * declares, so the bars keep their asymmetric rhythm rather than becoming an
 * evenly stepped equaliser.
 */
interface WaveBar {
  src: string;
  height: number;
  left: number;
  /** Omitted when the bar is vertically centred in the frame. */
  top?: number;
  inset: string;
}

const WAVE_BARS: readonly WaveBar[] = [
  { src: "wave-5.svg", height: 6, left: 3, inset: "-16.67% -1px" },
  { src: "wave-1.svg", height: 13, left: 6, top: 2.5, inset: "-7.69% -1px" },
  { src: "wave-2.svg", height: 8, left: 9, top: 5, inset: "-12.5% -1px" },
  { src: "wave-3.svg", height: 2, left: 12, inset: "-50% -1px" },
  { src: "wave-4.svg", height: 4, left: 15, inset: "-25% -1px" },
];

export function VoiceListeningIcon() {
  return (
    <span
      aria-hidden="true"
      className="relative block h-[18px] w-[18px] shrink-0 overflow-hidden"
    >
      {WAVE_BARS.map((bar) => (
        <span
          key={bar.src}
          className="absolute block w-0"
          style={
            bar.top === undefined
              ? {
                  height: bar.height,
                  left: bar.left,
                  top: "50%",
                  transform: "translateY(-50%)",
                }
              : { height: bar.height, left: bar.left, top: bar.top }
          }
        >
          <span className="absolute block" style={{ inset: bar.inset }}>
            <img
              src={`${ASSET}/${bar.src}`}
              alt=""
              className="absolute inset-0 block h-full w-full max-w-none"
            />
          </span>
        </span>
      ))}
    </span>
  );
}

/* ---------------------------------------------------------------- *
 * iOS status bar                                                    *
 * ---------------------------------------------------------------- */

/** Cellular, Wi-Fi and battery as one exported cluster, 78.328 × 13. */
export function StatusBarElements() {
  return <FigAsset src={`${ASSET}/statusbar-elements.svg`} w={78.328} h={13} />;
}

/** The 6 px location-in-use dot. */
export function StatusIndicatorDot() {
  return <FigAsset src={`${ASSET}/indicator-dot.svg`} w={6} h={6} />;
}
