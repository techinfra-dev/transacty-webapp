import { Link } from '@tanstack/react-router'
import { Button } from '../../../../components/ui/Button.tsx'

interface PayoutFormNavProps {
  step: number
  isSubmitting: boolean
  onPrevious: () => void
  onContinue: () => void
  onSubmit: () => void
}

export function PayoutFormNav({
  step,
  isSubmitting,
  onPrevious,
  onContinue,
  onSubmit,
}: PayoutFormNavProps) {
  return (
    <div className="payout-nav">
      {step <= 1 ? (
        <Link
          to="/dashboard"
          className={`payout-btn-ghost inline-flex h-9 items-center rounded-lg px-4 [font-family:var(--font-body)] text-xs font-semibold no-underline ${isSubmitting ? 'pointer-events-none opacity-50' : ''}`}
        >
          Cancel
        </Link>
      ) : (
        <Button
          type="button"
          variant="ghost"
          className="payout-btn-ghost"
          disabled={isSubmitting}
          onClick={onPrevious}
        >
          Back
        </Button>
      )}

      {step < 4 ? (
        <Button type="button" className="payout-btn-primary" onClick={onContinue}>
          Continue
        </Button>
      ) : (
        <Button
          type="button"
          className="payout-btn-primary"
          onClick={onSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current/30 border-t-current" />
              Submitting…
            </span>
          ) : (
            'Submit payout'
          )}
        </Button>
      )}
    </div>
  )
}
