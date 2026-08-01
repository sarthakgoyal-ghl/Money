import { useEffect, useId, useState, type ReactNode } from "react";
import type { PaymentMethod, PriceBreakdown, TripConstraints } from "../../../data/scenario";
import {
  currentBooking,
  fitOption,
  formatDuration,
  formatINR,
  toMinutes,
} from "../../../data/scenario";
import type { Flight, FlightOption } from "../../../data/scenario";
import { FigButton } from "../FigButton";
import { FigDisclosure } from "../FigDisclosure";
import { FigAlert, FigCard, FigSheet, type FigSheetHeight } from "../FigSheet";
import { RouteConnector } from "../assistant/threadAssets";
import { SeatIcon, BaggageIcon, CabinClassIcon } from "../assistant/threadAssets";

const ASSET = "/figma/assets";

interface ReviewChangeSheetProps {
  open: boolean;
  option: FlightOption;
  price: PriceBreakdown;
  payment: PaymentMethod;
  constraints: TripConstraints;
  onClose: () => void;
  onEditPayment: () => void;
  onApprove: () => void;
  /** Explicit rejection — Keep current flight. Distinct from Close. */
  onKeepCurrent: () => void;
  /** True while approval/execution is in flight — blocks duplicate Pay. */
  approveLocked?: boolean;
}

/**
 * Review flight change — Figma `1204:81405` with scroll body `1204:81465`.
 *
 * Body pieces: Current `81467`, chevron `81490`, New `81491`, benefit tags
 * `81525`/`81529`/`81533`, price card `81537`, next steps `81565`, success
 * alert `81578`, info alert `81590`, fare conditions `81602`.
 */
export function ReviewChangeSheet({
  open,
  option,
  price,
  payment,
  constraints,
  onClose,
  onEditPayment,
  onApprove,
  onKeepCurrent,
  approveLocked = false,
}: ReviewChangeSheetProps) {
  const [height, setHeight] = useState<FigSheetHeight>("full");
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const [fareOpen, setFareOpen] = useState(false);
  const breakdownId = useId();
  const fareId = useId();

  useEffect(() => {
    if (open) setHeight("full");
  }, [open]);

  if (!open) return null;

  const { flight } = option;
  const fit = fitOption(option, constraints, price);
  const overLimitBy = fit.withinBudget ? 0 : -fit.budgetHeadroom;
  const earlierBy = formatDuration(
    toMinutes(currentBooking.arriveLabel) - toMinutes(flight.arriveLabel),
  );

  const rows = [
    { label: "Fare difference", amount: price.fareDifference },
    { label: "Airline change fee", amount: price.changeFee },
    { label: "Tax difference", amount: price.taxDifference },
  ];

  return (
    <FigSheet
      height={height}
      expandHeight="full"
      onHeightChange={setHeight}
      showScrim={false}
      showHandle
      chromePadTop={6}
      title="Review flight change"
      onClose={onClose}
      contentKey={`${flight.id}-${price.total}`}
      footer={
        <div className="flex flex-col gap-[6px]">
          <FigButton
            variant="primary"
            fullWidth
            compact
            disabled={approveLocked}
            aria-busy={approveLocked || undefined}
            onClick={onApprove}
          >
            Pay {formatINR(price.total)} &amp; rebook
          </FigButton>
          <FigButton variant="soft" fullWidth compact onClick={onKeepCurrent}>
            Keep {currentBooking.flightNo}
          </FigButton>
        </div>
      }
    >
      <div className="flex flex-col items-center gap-[12px] pb-[8px]">
        {/* Current → New */}
        <div className="flex w-full flex-col items-center gap-[4px]">
          <ReviewFlightBlock
            kind="current"
            flight={currentBooking}
            hideMeta
          />

          <TransitionChevron />

          <ReviewFlightBlock kind="new" flight={flight} extra={price.total} />
        </div>

        {/* `81525` / `81529` / `81533` — benefit tags with green icons. */}
        <ul className="flex w-full flex-wrap content-center items-center gap-[6px]">
          <BenefitChip icon={<BenefitClockIcon />}>
            Arrive <span className="fig-w-semibold">{earlierBy} earlier</span>
          </BenefitChip>
          <BenefitChip icon={<BenefitSeatIcon />}>
            <span className="capitalize">{flight.seat.kind}</span> seat retained ·{" "}
            {flight.seat.label}
          </BenefitChip>
          <BenefitChip icon={<BenefitBagIcon />}>
            Baggage remains {flight.bagKg}kg
          </BenefitChip>
        </ul>

        {/* `81537` — payable now + breakdown + payment. */}
        <FigCard className="flex w-full flex-col gap-[12px] rounded-[14px] p-[12px]">
          <div className="flex items-end justify-between gap-[12px] whitespace-nowrap">
            <span className="fig-w-semibold text-[25px] leading-[24px] tabular text-fig-900">
              {formatINR(price.total)}
            </span>
            <span className="text-[13px] leading-normal text-fig-600">
              payable now
            </span>
          </div>

          {overLimitBy > 0 ? (
            <FigAlert tone="warn">
              {formatINR(overLimitBy)} above the{" "}
              {formatINR(constraints.maxExtraCost)} limit you set.
            </FigAlert>
          ) : null}

          <div aria-hidden="true" className="h-px w-full bg-fig-line" />

          <div className="flex w-full flex-col gap-[8px]">
            <button
              type="button"
              aria-expanded={breakdownOpen}
              aria-controls={breakdownId}
              onClick={() => setBreakdownOpen((value) => !value)}
              className="flex w-full items-center justify-between text-[13px] font-medium text-fig-900 focus-ring-fig"
            >
              View price breakdown
              <ChevronTiny open={breakdownOpen} />
            </button>

            {breakdownOpen ? (
              <>
                <dl id={breakdownId} className="flex flex-col gap-[8px]">
                  {rows.map((row) => (
                    <div
                      key={row.label}
                      className="flex items-center justify-between text-[11px] leading-normal"
                    >
                      <dt className="text-fig-600">{row.label}</dt>
                      <dd className="fig-w-medium tabular text-fig-900 opacity-90">
                        {formatINR(row.amount)}
                      </dd>
                    </div>
                  ))}
                </dl>

                <div aria-hidden="true" className="h-px w-full bg-fig-line" />

                <div className="flex items-center justify-between text-[13px] leading-normal">
                  <span className="font-medium text-fig-600">Total</span>
                  <span className="font-semibold tabular text-fig-900">
                    {formatINR(price.total)}
                  </span>
                </div>
              </>
            ) : null}
          </div>

          <div aria-hidden="true" className="h-px w-full bg-fig-line" />

          <div className="flex items-end justify-between gap-[12px]">
            <div className="flex flex-col gap-[2px]">
              <p className="text-[11px] leading-normal text-fig-600">paying with</p>
              <p className="fig-w-semibold text-[15px] leading-normal text-fig-900">
                {payment.label}
              </p>
            </div>
            <button
              type="button"
              onClick={onEditPayment}
              className="fig-w-medium text-[15px] tracking-[-0.4px] text-[#008bff] focus-ring-fig"
            >
              Change
            </button>
          </div>
        </FigCard>

        {/* `81565` — What happens next. */}
        <section aria-labelledby="next-heading" className="flex w-full flex-col gap-[6px]">
          <h3
            id="next-heading"
            className="font-ui text-[11px] font-light leading-normal text-fig-600"
          >
            What happens next
          </h3>
          <ol className="flex w-full items-stretch gap-[6px]">
            {[
              "Recheck fare and seat",
              `Issue ${flight.flightNo}`,
              `Release ${currentBooking.flightNo}`,
            ].map((step, index) => (
              <li
                key={step}
                className="flex min-w-0 flex-1 flex-col gap-[8px] rounded-[14px] bg-white p-[12px]"
              >
                <span className="flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-[12px] bg-[#f2f4f7] text-[13px] font-medium leading-[18px] text-[#344054]">
                  {index + 1}
                </span>
                <span className="text-[13px] leading-normal text-fig-900">{step}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* `81577` — success + info alerts, gap 6. */}
        <div className="flex w-full flex-col gap-[6px]">
          <FigAlert tone="success" icon={<ReviewShieldIcon />}>
            Your current ticket stays active until the replacement is issued.
          </FigAlert>

          <FigAlert tone="info" icon={<ReviewInfoIcon />}>
            I&apos;ll only rebook{" "}
            <span className="fig-w-semibold">{flight.flightNo}</span>, seat{" "}
            <span className="fig-w-semibold">{flight.seat.label}</span>, for a total of{" "}
            <span className="fig-w-semibold">{formatINR(price.total)}</span>. If the
            flight, seat, or price changes, I&apos;ll stop and ask again.
          </FigAlert>
        </div>

        {/* `81602` — fare conditions; same disclosure as Other options. */}
        <FigDisclosure
          id={fareId}
          label="View fare conditions"
          open={fareOpen}
          onToggle={() => setFareOpen((value) => !value)}
        >
          <div className="flex flex-col gap-[6px] text-[13px] leading-normal text-fig-600">
            <p>
              Economy Classic on Air India permits a date change for a
              per-passenger fee plus any fare difference. Seats{" "}
              {flight.seat.label} and {currentBooking.seat.label} are standard,
              with no extra legroom charge.
            </p>
            <p>
              Any further change after this one may carry a new fee and fare
              difference.
            </p>
            <p>
              If ticketing does not complete after payment is authorised, the
              authorisation is released and a specialist reconciles the
              booking. Nothing is retried automatically.
            </p>
            <p>
              Simulated fare rules for this prototype. No real airline or
              payment system is contacted.
            </p>
          </div>
        </FigDisclosure>
      </div>
    </FigSheet>
  );
}

/** `1204:81467` / `1204:81491` — Current (gradient) and New (white) blocks. */
function ReviewFlightBlock({
  kind,
  flight,
  extra,
  hideMeta = false,
}: {
  kind: "current" | "new";
  flight: Flight;
  /** Replacement cost only — omit for the current ticket (no Extra column). */
  extra?: number;
  hideMeta?: boolean;
}) {
  const current = kind === "current";
  const seatKind =
    flight.seat.kind.charAt(0).toUpperCase() + flight.seat.kind.slice(1);
  const showExtra = extra !== undefined;

  return (
    <div
      className={[
        "flex w-full flex-col items-center justify-center overflow-hidden rounded-[14px] p-[12px]",
        current
          ? "gap-[10px] bg-gradient-to-b from-[#e9e9e9] to-[#fdfdfc]"
          : "gap-[8px] bg-white",
      ].join(" ")}
    >
      {/* `81468` / `81492` — eyebrow + Extra (new flight only). */}
      <div className="flex w-full items-center justify-between tracking-[-0.15px]">
        <div className="flex shrink-0 flex-col items-start justify-center gap-[2px]">
          <p
            className={[
              "w-full text-[13px] leading-normal",
              current ? "text-[#fdb022]" : "text-[#007aff]",
            ].join(" ")}
          >
            {current ? "Current" : "New"}
          </p>
          <p className="fig-w-semibold w-full text-[15px] leading-normal text-[rgba(102,102,102,0.9)]">
            {flight.flightNo} · {flight.dateShort}
          </p>
        </div>
        {showExtra ? (
          <div className="flex shrink-0 flex-col items-end justify-center gap-[2px] text-right text-[rgba(102,102,102,0.9)]">
            <p className="w-full text-[13px] leading-normal">Extra</p>
            <p className="fig-w-semibold w-full text-[15px] leading-normal">
              {formatINR(extra)}
            </p>
          </div>
        ) : null}
      </div>

      <div
        className={[
          "flex w-full flex-col items-start",
          hideMeta ? "" : "gap-[8px]",
        ].join(" ")}
      >
        <div className="flex w-full min-w-0 items-center gap-[10px]">
          {/* `81477` / `81501` — departure. */}
          <ReviewEndpoint
            time={flight.departLabel}
            code={flight.origin.code}
            city={flight.origin.city}
            muted={current}
          />

          <div className="flex w-[74.5px] max-w-[28%] min-w-[52px] shrink flex-col items-start">
            <p className="mb-[-2px] w-full truncate text-center font-ui text-[7px] font-light leading-normal text-[#666]">
              {flight.durationLabel}
            </p>
            <span className="mb-[-2px] w-full">
              <RouteConnector />
            </span>
            <p className="w-full truncate text-center font-ui text-[7px] font-light leading-normal text-[#666]">
              {flight.stops === 0 ? "Nonstop" : `${flight.stops} stop`}
            </p>
          </div>

          {/* `81487` / `81511` — arrival. */}
          <ReviewEndpoint
            time={flight.arriveLabel}
            code={flight.destination.code}
            city={flight.destination.city}
            muted={current}
            align="right"
          />
        </div>

        {/* `81514` — seat / bag / class (New only). */}
        {hideMeta ? null : (
          <ul className="flex w-full items-center justify-between">
            <MetaFact icon={<SeatIcon />}>
              Seat {flight.seat.label} · {seatKind}
            </MetaFact>
            <MetaFact icon={<BaggageIcon />}>{flight.bagKg}kg checked</MetaFact>
            <MetaFact icon={<CabinClassIcon />}>Economy class</MetaFact>
          </ul>
        )}
      </div>
    </div>
  );
}

function ReviewEndpoint({
  time,
  code,
  city,
  muted,
  align = "left",
}: {
  time: string;
  code: string;
  city: string;
  muted: boolean;
  align?: "left" | "right";
}) {
  return (
    <div
      className={[
        "flex min-w-0 flex-1 flex-col justify-center gap-[4px]",
        align === "right" ? "items-end text-right" : "items-start",
        muted ? "text-[#667085]" : "text-fig-900",
      ].join(" ")}
    >
      <p className="fig-w-semibold w-full min-w-0 truncate text-[25px] leading-[24px] tabular">
        {time}
      </p>
      <p
        className="w-full min-w-0 truncate text-[13px] leading-normal"
        title={`${code} · ${city}`}
      >
        {code} · {city}
      </p>
    </div>
  );
}

function MetaFact({
  icon,
  children,
}: {
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <li className="flex shrink-0 items-center gap-[2.5px]">
      <span className="relative flex size-[10px] shrink-0 items-center justify-center overflow-hidden">
        {icon}
      </span>
      <span className="whitespace-nowrap font-ui text-[11px] font-light leading-normal text-[#666]">
        {children}
      </span>
    </li>
  );
}

/**
 * `1204:81490` — SF Symbol chevron.left rotated −90° (points down) in a
 * 26 × 17 frame, `#007aff`.
 */
function TransitionChevron() {
  return (
    <span
      aria-hidden="true"
      className="relative flex h-[17px] w-[26px] shrink-0 items-center justify-center"
    >
      <img
        src={`${ASSET}/review-chevron-left.svg`}
        alt=""
        className="block h-[14px] w-[8px] max-w-none -rotate-90"
      />
    </span>
  );
}

/** `1204:81525` — white pill benefit tag. */
function BenefitChip({
  icon,
  children,
}: {
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <li className="inline-flex items-center justify-center gap-[4px] rounded-[32px] bg-white px-[8px] py-[4px] text-center text-[12px] leading-[21px] text-fig-900">
      {icon}
      <span>{children}</span>
    </li>
  );
}

function BenefitClockIcon() {
  return (
    <BenefitAsset
      src={`${ASSET}/review-clock-check.svg`}
      w={14}
      h={14}
      inset="4.17%"
    />
  );
}

function BenefitSeatIcon() {
  return (
    <BenefitAsset
      src={`${ASSET}/review-seat-green.svg`}
      w={14}
      h={14}
      inset="9.36% 16.67%"
    />
  );
}

function BenefitBagIcon() {
  return (
    <BenefitAsset
      src={`${ASSET}/review-bag-green.svg`}
      w={14}
      h={14}
      inset="8.33% 16.67%"
    />
  );
}

/** `81578` — 20×20 shield-tick frame. */
function ReviewShieldIcon() {
  return (
    <BenefitAsset
      src={`${ASSET}/review-shield-tick.svg`}
      w={20}
      h={20}
      inset="4.45% 12.5% 4.74% 12.5%"
    />
  );
}

/** `81590` — info glyph, designed 18.33 × 24.33. */
function ReviewInfoIcon() {
  return (
    <img
      src={`${ASSET}/review-info.svg`}
      alt=""
      aria-hidden="true"
      className="mt-[-2px] block h-[24px] w-[18px] max-w-none shrink-0"
    />
  );
}

function BenefitAsset({
  src,
  w,
  h,
  inset,
}: {
  src: string;
  w: number;
  h: number;
  inset: string;
}) {
  return (
    <span
      aria-hidden="true"
      className="relative block shrink-0"
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

function ChevronTiny({ open }: { open: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={[
        "flex h-[16px] w-[16px] items-center justify-center text-fig-900 transition-transform",
        open ? "" : "rotate-180",
      ].join(" ")}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
        <path
          d="M6 15l6-6 6 6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
