import { Fragment } from 'react'
import { payoutStepItems } from './payoutConstants.ts'

interface PayoutStepperProps {
  step: number
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

export function PayoutStepper({ step }: PayoutStepperProps) {
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
                  {item.label}
                </span>
              </div>
            </Fragment>
          )
        })}
      </div>
    </nav>
  )
}
