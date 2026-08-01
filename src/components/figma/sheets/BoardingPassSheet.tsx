import { useEffect, useId, useState, type ReactNode } from "react";
import { AnimatePresence } from "framer-motion";
import type {
  ActivityTrail,
  Flight,
  PaymentMethod,
} from "../../../data/scenario";
import {
  currentBooking,
  formatClock24,
  formatINR,
  passenger,
  successBooking,
  synthesiseActivityTrail,
} from "../../../data/scenario";
import { FigButton, CautionText } from "../FigButton";
import { FigDisclosure } from "../FigDisclosure";
import { FigSheet, type FigSheetHeight } from "../FigSheet";
import { useUnderlayRecessed } from "../../shared/SheetStackContext";

const ASSET = "/figma/assets";

function isCompleteTrail(
  trail: ActivityTrail | null | undefined,
): trail is ActivityTrail {
  return (
    trail != null && trail.issuedAt != null && trail.releasedAt != null
  );
}

interface BoardingPassSheetProps {
  open: boolean;
  flight: Flight;
  settledTotal: number;
  payment: PaymentMethod;
  /** Wall-clock stamps from the agent model; synthesised if missing. */
  activityTrail?: ActivityTrail | null;
  /**
   * When true, opens above the success summary like Get help: under sheet
   * recesses, this sheet stays elevated (z-40) and does not recess itself.
   */
  stacked?: boolean;
  onClose: () => void;
  onAddToWallet: () => void;
  onViewReceipt: () => void;
  onAddToCalendar: () => void;
  onGetHelp: () => void;
}

/**
 * Boarding pass — Figma `1204:81195`.
 *
 * Body stack `1204:81274` / `81225`: ticket `81275`, summary `81330`, rule
 * `81342`, activity `81343`, caution `81347`. Map stays readable — no scrim.
 * When `stacked`, opens over the success summary (recessed underlay) with the
 * same slide + scrim presentation as Get help.
 */
export function BoardingPassSheet({
  open,
  flight,
  settledTotal,
  payment,
  activityTrail = null,
  stacked = false,
  onClose,
  onAddToWallet,
  onViewReceipt,
  onAddToCalendar,
  onGetHelp,
}: BoardingPassSheetProps) {
  const underlayRecessed = useUnderlayRecessed();
  const [height, setHeight] = useState<FigSheetHeight>("full");
  const [activityOpen, setActivityOpen] = useState(false);
  const activityId = useId();
  const [refSettled, setRefSettled] = useState(false);
  const [fallbackTrail, setFallbackTrail] = useState<ActivityTrail | null>(
    null,
  );

  useEffect(() => {
    if (!open) return;
    setHeight("full");
    setActivityOpen(false);
    setRefSettled(false);
    setFallbackTrail(
      isCompleteTrail(activityTrail) ? null : synthesiseActivityTrail(),
    );
    const timer = window.setTimeout(() => setRefSettled(true), 620);
    return () => window.clearTimeout(timer);
  }, [open, flight.id]);

  useEffect(() => {
    if (isCompleteTrail(activityTrail)) setFallbackTrail(null);
  }, [activityTrail]);

  const stamps = isCompleteTrail(activityTrail)
    ? activityTrail
    : (fallbackTrail ?? synthesiseActivityTrail());

  const trail = [
    {
      label: "Request received",
      time: formatClock24(stamps.requestedAt),
    },
    {
      label: "Change approved",
      time: formatClock24(stamps.approvedAt),
    },
    {
      label: `${flight.flightNo} ticket issued`,
      time: formatClock24(stamps.issuedAt ?? stamps.approvedAt),
    },
    {
      label: `${currentBooking.flightNo} booking released`,
      time: formatClock24(stamps.releasedAt ?? stamps.approvedAt),
    },
  ];

  const subtitle = (
    <>
      <span className="fig-w-semibold text-fig-600">{flight.flightNo}</span>
      {` arrives in ${flight.destination.city} at `}
      <span className="fig-w-semibold tabular text-fig-600">{flight.arriveLabel}</span>.
    </>
  );

  const sheet = open ? (
    <FigSheet
      key="boarding-pass"
      height={height}
      expandHeight="full"
      onHeightChange={setHeight}
      showScrim={false}
      showHandle
      chromePadTop={6}
      stacked={stacked}
      // Over success: elevated. Under Get help / case details: recess via
      // stack context and drop elevation so the third sheet owns the front.
      elevated={stacked && !underlayRecessed}
      heroPlacement="inline"
      title="You're rebooked"
      subtitle={subtitle}
      onClose={onClose}
      hero={
        <img
          src={`${ASSET}/boarding-seal.svg`}
          alt=""
          aria-hidden="true"
          className="size-[80px] shrink-0 object-contain"
        />
      }
      footer={
        <div className="flex w-full flex-col gap-[8px]">
          <FigButton
            variant="primary"
            fullWidth
            compact
            onClick={onAddToWallet}
            leadingIcon={<WalletCtaIcon />}
          >
            Add to Wallet
          </FigButton>
          <div className="flex w-full items-center gap-[8px]">
            <SoftAction
              label="Receipt"
              iconSrc={`${ASSET}/boarding-action-receipt.svg`}
              iconInset="4.17% 12.5%"
              onClick={onViewReceipt}
            />
            <SoftAction
              label="Calendar"
              iconSrc={`${ASSET}/boarding-action-calendar.svg`}
              iconInset="4.17% 8.33%"
              onClick={onAddToCalendar}
            />
            <SoftAction
              label="Help"
              iconSrc={`${ASSET}/boarding-action-help.svg`}
              iconInset="4.17% 12.5%"
              onClick={onGetHelp}
            />
          </div>
        </div>
      }
    >
      {/* `1204:81274` / `81225` — 16px stack. */}
      <div className="flex flex-col gap-[16px] pb-[8px]">
        <FigBoardingPass
          flight={flight}
          bookingRef={refSettled ? successBooking.newBookingRef : "······"}
        />

        {/* `1204:81330` */}
        <div className="flex w-full flex-col gap-[12px] rounded-[14px] bg-white p-[12px]">
          <SummaryRow
            left={payment.label}
            right={formatINR(settledTotal)}
            rightStrong
          />
          <Hairline />
          <SummaryRow
            left={`${currentBooking.flightNo} released`}
            right="Seat freed"
          />
          <Hairline />
          <SummaryRow left="Receipt sent by email" right="Just now" />
        </div>

        {/* `1204:81343` */}
        <FigDisclosure
          id={activityId}
          label="View activity"
          open={activityOpen}
          onToggle={() => setActivityOpen((value) => !value)}
        >
          <ol className="flex flex-col gap-[10px]">
            {trail.map((row) => (
              <li
                key={row.label}
                className="flex items-baseline justify-between gap-[12px] text-[13px] leading-normal"
              >
                <span className="text-fig-900">{row.label}</span>
                <span className="shrink-0 tabular text-fig-600">{row.time}</span>
              </li>
            ))}
          </ol>
        </FigDisclosure>

        {/* `1204:81347` */}
        <CautionText>
          Simulated bookings and boarding pass. The barcode is decorative and
          not scannable.
        </CautionText>
      </div>
    </FigSheet>
  ) : null;

  // Stacked over success: keep AnimatePresence mounted so exit can slide down
  // with the same curve as Get help. Non-stacked deep-links mount instantly.
  if (stacked) {
    return <AnimatePresence>{sheet}</AnimatePresence>;
  }

  return sheet;
}

function Hairline() {
  return <div aria-hidden="true" className="h-px w-full bg-fig-line" />;
}

/** `1204:81229`–`81235` — soft action tiles, 20px icons + 16/24 label. */
function SoftAction({
  label,
  iconSrc,
  iconInset,
  onClick,
}: {
  label: string;
  iconSrc: string;
  iconInset: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-w-0 flex-1 flex-col items-center gap-[4px] rounded-[14px] bg-fig-blue/[0.08] p-[8px] text-fig-blue focus-ring-fig"
    >
      <span className="relative block size-[20px] shrink-0 overflow-hidden">
        <span className="absolute block" style={{ inset: iconInset }}>
          <img
            src={iconSrc}
            alt=""
            className="absolute inset-0 block h-full w-full max-w-none"
          />
        </span>
      </span>
      <span className="w-full text-center font-ui text-[16px] font-semibold leading-[24px]">
        {label}
      </span>
    </button>
  );
}

function SummaryRow({
  left,
  right,
  rightStrong = false,
}: {
  left: string;
  right: string;
  rightStrong?: boolean;
}) {
  return (
    <div className="flex w-full items-center justify-between gap-[12px] whitespace-nowrap text-[15px] leading-normal">
      <span className="text-fig-600">{left}</span>
      <span
        className={[
          "shrink-0",
          rightStrong ? "font-medium text-fig-900" : "text-fig-600",
        ].join(" ")}
      >
        {right}
      </span>
    </div>
  );
}

/**
 * Ticket card — Figma `1204:81275` (370×280).
 *
 * Absolute layout matches Dev Mode: header → route/meta from y=56 → perforation
 * + barcode from y=202. Silhouette is the rotated ticket shape so side notches
 * cut through to the glass sheet (flex stacking was crushing the barcode).
 */
function FigBoardingPass({
  flight,
  bookingRef,
}: {
  flight: Flight;
  bookingRef: string;
}) {
  const stopsLabel = flight.stops === 0 ? "Nonstop" : `${flight.stops} stop`;

  return (
    <article className="relative mx-auto h-[280px] w-full max-w-[370px]">
      {/* `1204:81277` — white ticket silhouette, notches on the barcode seam. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-visible"
      >
        <img
          src={`${ASSET}/boarding-ticket-shape.svg`}
          alt=""
          className="absolute left-1/2 top-1/2 block h-[370px] w-[280px] max-w-none -translate-x-1/2 -translate-y-1/2 -rotate-90"
        />
      </div>

      {/* `1204:81278` — airline strip. */}
      <div className="absolute left-0 top-0 z-[1] flex w-full items-center gap-[6px] overflow-hidden rounded-tl-[14px] rounded-tr-[14px] bg-[rgba(0,136,255,0.08)] px-[16px] py-[12px]">
        <span className="relative flex size-[16px] shrink-0 items-center justify-center overflow-hidden">
          <img
            src={`${ASSET}/boarding-airline.svg`}
            alt=""
            aria-hidden="true"
            className="size-full object-contain"
          />
        </span>
        <span className="fig-w-semibold whitespace-nowrap text-[13px] leading-normal text-black">
          {flight.airline}
        </span>
        <span className="fig-w-medium whitespace-nowrap text-[13px] leading-normal text-fig-600">
          {flight.flightNo}
        </span>
      </div>

      {/* `1204:81283` — times, solid rule, meta grid. */}
      <div className="absolute left-[16px] top-[56px] z-[1] flex w-[calc(100%-32px)] max-w-[338px] flex-col items-center gap-[12px] pb-[16px]">
        <div className="flex w-full min-w-0 items-center gap-[10px]">
          <div className="flex min-w-0 flex-1 flex-col gap-[4px] text-fig-900">
            <p className="fig-w-semibold whitespace-nowrap text-[25px] leading-[24px] tabular">
              {flight.departLabel}
            </p>
            <p
              className="w-full min-w-0 truncate text-[13px] leading-normal"
              title={`${flight.origin.code} · ${flight.origin.city}`}
            >
              {flight.origin.code} · {flight.origin.city}
            </p>
          </div>

          <div className="flex w-[116px] max-w-[30%] min-w-[56px] shrink flex-col items-center">
            <div className="relative mb-[-10px] h-[36px] w-full">
              <img
                src={`${ASSET}/boarding-arc.svg`}
                alt=""
                aria-hidden="true"
                className="absolute left-0 top-[8px] h-[28px] w-full max-w-none"
              />
              <span className="absolute left-1/2 top-0 flex size-[16px] -translate-x-1/2 items-center justify-center">
                <span className="flex size-[16px] rotate-90 items-center justify-center">
                  <img
                    src={`${ASSET}/boarding-plane.svg`}
                    alt=""
                    aria-hidden="true"
                    className="block size-[14px] max-w-none"
                  />
                </span>
              </span>
            </div>
            <div className="flex w-full flex-col items-center gap-[2px] text-center text-[11px] leading-normal">
              <span className="text-black">{flight.durationLabel}</span>
              <span className="font-light text-[#666]">{stopsLabel}</span>
            </div>
          </div>

          <div className="flex min-w-0 flex-1 flex-col items-end gap-[4px] text-right text-fig-900">
            <p className="fig-w-semibold whitespace-nowrap text-[25px] leading-[24px] tabular">
              {flight.arriveLabel}
            </p>
            <p
              className="w-full min-w-0 truncate text-[13px] leading-normal"
              title={`${flight.destination.code} · ${flight.destination.city}`}
            >
              {flight.destination.code} · {flight.destination.city}
            </p>
          </div>
        </div>

        {/* `1204:81299` — solid hairline. */}
        <img
          src={`${ASSET}/boarding-meta-line.svg`}
          alt=""
          aria-hidden="true"
          className="h-px w-[321px] max-w-full"
        />

        {/* `1204:81300` — 2×3 meta. */}
        <div className="flex w-full flex-col gap-[8px]">
          <div className="flex w-full items-center justify-between">
            <MetaChip
              src={`${ASSET}/boarding-meta-calendar.svg`}
              inset="4.17% 8.33%"
            >
              {flight.dateShort}
            </MetaChip>
            <MetaChip
              src={`${ASSET}/boarding-meta-seat.svg`}
              inset="9.36% 16.67%"
            >
              Seat {flight.seat.label}
            </MetaChip>
            <MetaChip
              src={`${ASSET}/boarding-meta-class.svg`}
              inset="12.6% 7.15%"
            >
              Economy class
            </MetaChip>
          </div>
          <div className="flex w-full items-center justify-between">
            <MetaChip
              src={`${ASSET}/boarding-meta-user.svg`}
              inset="8.33% 11.01%"
            >
              {passenger.fullName}
            </MetaChip>
            <MetaChip
              src={`${ASSET}/boarding-meta-ticket.svg`}
              inset="12.5% 4.17%"
            >
              {bookingRef}
            </MetaChip>
            <MetaChip
              src={`${ASSET}/boarding-meta-bag.svg`}
              inset="8.33% 16.67%"
            >
              {flight.bagKg}kg
            </MetaChip>
          </div>
        </div>
      </div>

      {/* `1204:81321` — dashed perforation + barcode, pinned at y=202. */}
      <div className="absolute left-1/2 top-[202px] z-[1] flex w-[334px] max-w-[calc(100%-36px)] -translate-x-1/2 flex-col items-center gap-[16px]">
        <img
          src={`${ASSET}/boarding-dash.svg`}
          alt=""
          aria-hidden="true"
          className="h-px w-[321px] max-w-full"
        />
        <div className="relative h-[46px] w-full overflow-hidden">
          <img
            src={`${ASSET}/boarding-barcode.svg`}
            alt=""
            aria-hidden="true"
            className="absolute left-1/2 top-0 h-[46px] w-[321px] max-w-none -translate-x-1/2"
          />
        </div>
      </div>
    </article>
  );
}

function MetaChip({
  src,
  inset,
  children,
}: {
  src: string;
  inset: string;
  children: ReactNode;
}) {
  return (
    <div className="flex w-[112px] items-center justify-center gap-[2.5px]">
      <span className="relative flex size-[14px] shrink-0 items-center justify-center overflow-hidden">
        <span className="absolute block" style={{ inset }}>
          <img
            src={src}
            alt=""
            className="absolute inset-0 block h-full w-full max-w-none"
          />
        </span>
      </span>
      <span className="truncate font-ui text-[13px] font-light leading-normal text-[#666]">
        {children}
      </span>
    </div>
  );
}

/** `1204:81227` — wallet-02, 20×20 / inset `6.53% 8.33% 8.33%`. */
function WalletCtaIcon() {
  return (
    <span className="relative block size-[20px] shrink-0 overflow-hidden text-current">
      <span
        className="absolute block"
        style={{ inset: "6.53% 8.33% 8.33% 8.33%" }}
      >
        <img
          src={`${ASSET}/boarding-wallet.svg`}
          alt=""
          className="absolute inset-0 block h-full w-full max-w-none"
        />
      </span>
    </span>
  );
}
