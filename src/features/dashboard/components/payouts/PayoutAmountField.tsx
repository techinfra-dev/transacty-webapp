interface PayoutAmountFieldProps {
  currency: string
  value: string
  onChange: (nextAmount: string) => void
  minimumAmount: number
  maximumAmount: number | undefined
  availableLabel: string
  caption?: string
}

/** Keeps typing to a single well-formed decimal without fighting the caret. */
function sanitizeAmountInput(next: string) {
  const cleaned = next.replace(/[^\d.]/g, '')
  const [whole, ...fractions] = cleaned.split('.')
  if (fractions.length === 0) {
    return whole
  }
  return `${whole}.${fractions.join('').slice(0, 2)}`
}

function formatLimit(amount: number) {
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function PayoutAmountField({
  currency,
  value,
  onChange,
  minimumAmount,
  maximumAmount,
  availableLabel,
  caption,
}: PayoutAmountFieldProps) {
  const canUseMax = maximumAmount !== undefined && maximumAmount > 0

  return (
    <div className="payout-amount">
      <span className="payout-amount-eyebrow">You send</span>

      <div className="payout-amount-entry">
        {/* Mirrors the text so the input grows with the number instead of
            sitting in a fixed-width box. */}
        <span className="payout-amount-sizer" data-value={value || '0.00'}>
          <input
            className="payout-amount-input"
            value={value}
            onChange={(event) => onChange(sanitizeAmountInput(event.target.value))}
            placeholder="0.00"
            inputMode="decimal"
            autoComplete="off"
            aria-label={`Payout amount in ${currency || 'wallet currency'}`}
          />
        </span>
        <span className="payout-amount-currency">{currency || '—'}</span>
      </div>

      {canUseMax ? (
        <button
          type="button"
          className="payout-amount-max"
          onClick={() => onChange(String(maximumAmount))}
        >
          Max
        </button>
      ) : null}

      <p className="payout-amount-limits">
        Min {formatLimit(minimumAmount)}
        {canUseMax ? ` · Max ${formatLimit(maximumAmount)}` : ''}
      </p>

      <p className="payout-amount-available">
        Available <strong>{availableLabel}</strong>
      </p>

      {caption ? <p className="payout-amount-caption">{caption}</p> : null}
    </div>
  )
}
