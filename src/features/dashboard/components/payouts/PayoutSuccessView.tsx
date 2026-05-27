import { Button } from '../../../../components/ui/Button.tsx'
import type { PayoutFormPayload } from '../../services/payoutFormTypes.ts'
import type { PortalEnvironment } from '../../../../types/portalEnvironment.ts'

interface PayoutSuccessViewProps {
  formattedPreviewAmount: string
  environment: PortalEnvironment
  payload: PayoutFormPayload
  createdTransactionId: string | undefined
  onCreateAnother: () => void
}

export function PayoutSuccessView({
  formattedPreviewAmount,
  environment,
  payload,
  createdTransactionId,
  onCreateAnother,
}: PayoutSuccessViewProps) {
  return (
    <section className="payout-success">
      <span className="payout-success-badge">Request created</span>
      <h2 className="payout-success-title">Payout submitted successfully</h2>
      <p className="payout-success-desc">
        Your payout request is now in the processing queue.
      </p>

      <div className="payout-success-details">
        <div>
          <p className="payout-summary-label">Amount</p>
          <p className="payout-summary-value">{formattedPreviewAmount}</p>
        </div>
        <div>
          <p className="payout-summary-label">Environment</p>
          <p className="payout-summary-value uppercase">{environment}</p>
        </div>
        <div>
          <p className="payout-summary-label">Beneficiary</p>
          <p className="payout-summary-value">
            {payload.benificiaryAccountInfo.holderName || '—'}
          </p>
        </div>
        {createdTransactionId ? (
          <div>
            <p className="payout-summary-label">Transaction ID</p>
            <p className="payout-summary-value font-[ui-monospace,monospace] text-xs">
              {createdTransactionId}
            </p>
          </div>
        ) : null}
      </div>

      <Button type="button" className="payout-btn-primary mt-6" onClick={onCreateAnother}>
        Create another payout
      </Button>
    </section>
  )
}
