import { Fragment } from 'react'
import { payoutStepItems, type PayoutRail } from './payoutConstants.ts'

interface PayoutStepperProps {
  step: number
  payoutRail?: PayoutRail | null
}

/** Rails that verify or review the recipient instead of collecting a sender. */
function getStepLabel(
  item: (typeof payoutStepItems)[number],
  payoutRail: PayoutRail | null | undefined,
) {
  if (item.id === 4 && (payoutRail === 'ngn' || payoutRail === 'cpg')) {
    return 'Review'
  }
  return item.label
}

function StepCheckIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-3 w-3" aria-hidden>
      <path
        fill="currentColor"
        d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.2 7.2a1 1 0 0 1-1.4 0l-3.6-3.6a1 1 0 1 1 1.4-1.4l2.9 2.9 6.5-6.5a1 1 0 0 1 1.4 0Z"
      />
    </svg>
  )
}

export function PayoutStepper({ step, payoutRail }: PayoutStepperProps) {
  return (
    <nav className="payout-stepper" aria-label="Payout steps">
      <div className="payout-stepper-track">
        {payoutStepItems.map((item, index) => {
          const isActive = step === item.id
          const isDone = step > item.id
          const dotClass = [
            'payout-stepper-dot',
            isActive ? 'payout-stepper-dot--active' : '',
            isDone ? 'payout-stepper-dot--done' : '',
          ]
            .filter(Boolean)
            .join(' ')

          return (
            <Fragment key={item.id}>
              {index > 0 ? (
                <div
                  className={`payout-stepper-line ${step > payoutStepItems[index - 1]!.id ? 'payout-stepper-line--done' : ''}`}
                  aria-hidden
                />
              ) : null}
              <div className="payout-stepper-step">
                <span className={dotClass} aria-current={isActive ? 'step' : undefined}>
                  {isDone ? <StepCheckIcon /> : item.id}
                </span>
                <span
                  className={`payout-stepper-label ${isActive || isDone ? 'payout-stepper-label--active' : ''}`}
                >
                  {getStepLabel(item, payoutRail)}
                </span>
              </div>
            </Fragment>
          )
        })}
      </div>
    </nav>
  )
}
