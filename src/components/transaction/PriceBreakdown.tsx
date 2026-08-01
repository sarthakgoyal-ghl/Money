import { AlertTriangle } from "lucide-react";
import type { PaymentMethod, PriceBreakdown as Price } from "../../data/scenario";
import { formatINR } from "../../data/scenario";
import { Disclosure } from "../shared/Disclosure";

interface PriceBreakdownProps {
  price: Price;
  payment: PaymentMethod;
  onEditPayment: () => void;
  /** Shown when the total exceeds the user's stated limit. */
  overLimitBy?: number;
  limit?: number;
}

/**
 * The money. One dominant total, fee detail behind a disclosure, and the
 * payment method named in full — because the number in the CTA and the number
 * on the statement have to be the same number.
 */
export function PriceBreakdownCard({
  price,
  payment,
  onEditPayment,
  overLimitBy,
  limit,
}: PriceBreakdownProps) {
  const rows = [
    { label: "Fare difference", amount: price.fareDifference },
    { label: "Airline change fee", amount: price.changeFee },
    { label: "Tax difference", amount: price.taxDifference },
  ];

  const overLimit = typeof overLimitBy === "number" && overLimitBy > 0;

  return (
    <section aria-labelledby="price-heading" className="rounded-2xl border border-ink-100 bg-white p-4">
      <h3 id="price-heading" className="sr-only">
        Price
      </h3>

      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[34px] font-semibold leading-none tracking-[-0.03em] tabular text-ink-900">
          {formatINR(price.total)}
        </span>
        <span className="text-[13px] text-ink-500">payable now</span>
      </div>

      {overLimit ? (
        <p className="mt-2.5 flex items-start gap-2 rounded-xl bg-warn-50 px-3 py-2 text-[12.5px] leading-snug text-warn">
          <AlertTriangle
            size={14}
            strokeWidth={2.25}
            aria-hidden="true"
            className="mt-[1px] shrink-0"
          />
          <span className="tabular">
            {formatINR(overLimitBy)} above the {formatINR(limit ?? 0)} limit you
            set. Approving this replaces that limit for this change only.
          </span>
        </p>
      ) : null}

      <div className="mt-3 border-t border-ink-100 pt-1">
        <Disclosure label="View price breakdown">
          <dl className="space-y-2 pt-1">
            {rows.map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between text-[13.5px]"
              >
                <dt className="text-ink-600">{row.label}</dt>
                <dd className="tabular text-ink-900">{formatINR(row.amount)}</dd>
              </div>
            ))}
            <div className="flex items-center justify-between border-t border-ink-100 pt-2 text-[13.5px]">
              <dt className="font-medium text-ink-900">Total</dt>
              <dd className="font-semibold tabular text-ink-900">
                {formatINR(price.total)}
              </dd>
            </div>
          </dl>
        </Disclosure>
      </div>

      <div className="mt-2 flex items-center justify-between gap-3 border-t border-ink-100 pt-3">
        <div className="min-w-0">
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-ink-500">
            Paying with
          </div>
          <div className="mt-0.5 truncate text-[14px] font-medium tabular text-ink-900">
            {payment.label}
          </div>
        </div>
        <button
          type="button"
          onClick={onEditPayment}
          className="h-11 shrink-0 rounded-xl px-3 text-[13.5px] font-medium text-accent-700 hover:bg-accent-50 focus-ring"
        >
          Change
        </button>
      </div>
    </section>
  );
}
