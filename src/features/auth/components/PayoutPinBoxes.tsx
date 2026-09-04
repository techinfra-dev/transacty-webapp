import { OtpInput } from '../../../components/ui/OtpInput.tsx'
import { PAYOUT_PIN_MAX_LENGTH } from '../../dashboard/services/payoutPinSchemas.ts'

type PayoutPinBoxesProps = {
  label: string
  value: string
  onChange: (next: string) => void
  disabled?: boolean
  autoFocus?: boolean
  hasError?: boolean
  hint?: string
}

export function PayoutPinBoxes({
  label,
  value,
  onChange,
  disabled,
  autoFocus,
  hasError,
  hint,
}: PayoutPinBoxesProps) {
  return (
    <div className="payout-pin-form">
      <span className="payout-pin-label">{label}</span>
      <OtpInput
        length={PAYOUT_PIN_MAX_LENGTH}
        value={value}
        onChange={onChange}
        disabled={disabled}
        autoFocus={autoFocus}
        mask
        size="lg"
        hasError={hasError}
        align="start"
        aria-label={label}
      />
      {hint ? <p className="payout-pin-hint">{hint}</p> : null}
    </div>
  )
}
