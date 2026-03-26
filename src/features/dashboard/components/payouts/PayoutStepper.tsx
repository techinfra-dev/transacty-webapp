import { Fragment } from 'react'
import { payoutAccent, payoutLineMuted, payoutStepItems } from './payoutConstants.ts'

interface PayoutStepperProps {
  step: number
}

export function PayoutStepper({ step }: PayoutStepperProps) {
  return (
    <div className="w-full max-w-xl" role="navigation" aria-label="Payout steps">
      <div className="flex items-center">
        {payoutStepItems.map((item, index) => (
          <Fragment key={item.id}>
            {index > 0 ? (
              <div
                className="mx-1 h-1 min-w-6 flex-1 rounded-full"
                style={{
                  backgroundColor:
                    step > payoutStepItems[index - 1]!.id ? payoutAccent : payoutLineMuted,
                }}
              />
            ) : null}
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
              style={{
                backgroundColor:
                  step >= item.id ? payoutAccent : payoutLineMuted,
                color: step >= item.id ? '#FFFFFF' : '#566167',
              }}
            >
              {step > item.id ? (
                <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" aria-hidden>
                  <path
                    fill="currentColor"
                    d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.2 7.2a1 1 0 0 1-1.4 0l-3.6-3.6a1 1 0 1 1 1.4-1.4l2.9 2.9 6.5-6.5a1 1 0 0 1 1.4 0Z"
                  />
                </svg>
              ) : (
                item.id
              )}
            </div>
          </Fragment>
        ))}
      </div>
      <div className="mt-2 flex justify-between gap-2">
        {payoutStepItems.map((item) => (
          <span
            key={item.id}
            className="[font-family:var(--font-body)] w-0 min-w-0 flex-1 text-center text-[10px] font-medium text-[#566167]"
          >
            {item.id}. {item.label}
          </span>
        ))}
      </div>
    </div>
  )
}
