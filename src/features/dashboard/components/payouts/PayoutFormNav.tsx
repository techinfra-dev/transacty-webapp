import { Button } from '../../../../components/ui/Button.tsx'
import { payoutOutlineBtnClass, payoutPrimaryBtnClass } from './payoutConstants.ts'

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
    <div className="flex flex-wrap items-center justify-between gap-2">
      <Button
        variant="ghost"
        className={payoutOutlineBtnClass}
        disabled={step <= 1 || isSubmitting}
        onClick={onPrevious}
      >
        Previous
      </Button>

      {step < 3 ? (
        <Button className={payoutPrimaryBtnClass} onClick={onContinue}>
          Continue
        </Button>
      ) : (
        <Button className={payoutPrimaryBtnClass} onClick={onSubmit} disabled={isSubmitting}>
          {isSubmitting ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#F3E8D6]/35 border-t-[#F3E8D6]" />
              Submitting...
            </span>
          ) : (
            'Submit payout'
          )}
        </Button>
      )}
    </div>
  )
}
