import { Button } from '../../../../components/ui/Button.tsx'
import type { CreatePayoutPayload } from '../../services/payoutsSchemas.ts'

interface PayoutSuccessViewProps {
  formattedPreviewAmount: string
  payload: CreatePayoutPayload
  createdTransactionId: string | undefined
  onCreateAnother: () => void
}

export function PayoutSuccessView({
  formattedPreviewAmount,
  payload,
  createdTransactionId,
  onCreateAnother,
}: PayoutSuccessViewProps) {
  return (
    <section className="rounded-2xl border border-emerald-300/70 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.12),rgba(255,255,255,1)_58%)] p-6 md:p-8">
      <div className="space-y-3">
        <span className="inline-flex rounded-full bg-[#9FBA9A] px-3 py-1 [font-family:var(--font-body)] text-xs font-semibold text-black">
          Request created
        </span>
        <h2 className="[font-family:var(--font-display)] text-2xl font-semibold text-(--color-foreground)">
          Payout request submitted successfully
        </h2>
        <p className="[font-family:var(--font-body)] text-sm text-(--color-secondary)">
          Your payout request is now in processing queue.
        </p>
        <div className="grid gap-3 rounded-xl border border-(--color-accent)/40 bg-(--color-card)/90 p-4 sm:grid-cols-2">
          <p className="[font-family:var(--font-body)] text-sm text-(--color-secondary)">
            Amount:{' '}
            <span className="font-semibold text-(--color-foreground)">{formattedPreviewAmount}</span>
          </p>
          <p className="[font-family:var(--font-body)] text-sm text-(--color-secondary)">
            Environment:{' '}
            <span className="font-semibold uppercase text-(--color-foreground)">
              {payload.environment}
            </span>
          </p>
          <p className="[font-family:var(--font-body)] text-sm text-(--color-secondary)">
            Beneficiary:{' '}
            <span className="font-semibold text-(--color-foreground)">
              {payload.benificiaryAccountInfo.holderName}
            </span>
          </p>
          {createdTransactionId ? (
            <p className="[font-family:var(--font-body)] text-sm text-(--color-secondary)">
              Transaction ID:{' '}
              <span className="font-semibold text-(--color-foreground)">
                {createdTransactionId}
              </span>
            </p>
          ) : null}
        </div>
        <Button className="mt-2 h-10 px-4 text-xs" onClick={onCreateAnother}>
          Create another payout
        </Button>
      </div>
    </section>
  )
}
