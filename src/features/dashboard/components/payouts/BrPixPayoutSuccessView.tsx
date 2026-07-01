import { Button } from '../../../../components/ui/Button.tsx'
import type { BrPayoutFormPayload } from '../../services/brPayoutFormTypes.ts'
import type { BrPayoutResponse } from '../../services/brPayoutSchemas.ts'
import type { PortalEnvironment } from '../../../../types/portalEnvironment.ts'
import { BRAZIL_PAYOUT_CURRENCY } from './payoutConstants.ts'
import { formatPayoutMoney } from './payoutFormatters.ts'

interface BrPixPayoutSuccessViewProps {
  environment: PortalEnvironment
  brPayload: BrPayoutFormPayload
  createdPayout: BrPayoutResponse
  formattedPreviewAmount: string
  onCreateAnother: () => void
}

export function BrPixPayoutSuccessView({
  environment,
  brPayload,
  createdPayout,
  formattedPreviewAmount,
  onCreateAnother,
}: BrPixPayoutSuccessViewProps) {
  const transactionId =
    createdPayout.transactionId ?? createdPayout.id ?? createdPayout.reference
  const maskedRecipient = createdPayout.recipient?.masked?.trim()
  const statusLabel = createdPayout.status?.trim() || 'pending'

  return (
    <section className="payout-success">
      <span className="payout-success-badge">PIX payout created</span>
      <h2 className="payout-success-title">Brazil PIX payout submitted</h2>
      <p className="payout-success-desc">
        Your payout request is being processed. BRL will be debited from your Brazil
        wallet and sent via PIX to the recipient.
      </p>

      <div className="payout-success-details">
        <div>
          <p className="payout-summary-label">Status</p>
          <p className="payout-summary-value capitalize">{statusLabel}</p>
        </div>
        <div>
          <p className="payout-summary-label">Amount</p>
          <p className="payout-summary-value">{formattedPreviewAmount}</p>
        </div>
        <div>
          <p className="payout-summary-label">Environment</p>
          <p className="payout-summary-value uppercase">{environment}</p>
        </div>
        <div>
          <p className="payout-summary-label">Recipient</p>
          <p className="payout-summary-value">
            {maskedRecipient ||
              brPayload.benificiaryAccountInfo.holderName ||
              '—'}
          </p>
          {maskedRecipient ? (
            <p className="payout-summary-value payout-summary-value--muted">
              {brPayload.benificiaryAccountInfo.holderName || 'PIX recipient'}
            </p>
          ) : null}
        </div>
        <div>
          <p className="payout-summary-label">PIX key</p>
          <p className="payout-summary-value font-[ui-monospace,monospace] text-xs break-all">
            {brPayload.benificiaryAccountInfo.number || '—'}
          </p>
        </div>
        {createdPayout.reference ? (
          <div>
            <p className="payout-summary-label">Reference</p>
            <p className="payout-summary-value font-[ui-monospace,monospace] text-xs">
              {createdPayout.reference}
            </p>
          </div>
        ) : null}
        {transactionId ? (
          <div>
            <p className="payout-summary-label">Transaction ID</p>
            <p className="payout-summary-value font-[ui-monospace,monospace] text-xs">
              {transactionId}
            </p>
          </div>
        ) : null}
        <div>
          <p className="payout-summary-label">Settlement</p>
          <p className="payout-summary-value">
            {formatPayoutMoney(BRAZIL_PAYOUT_CURRENCY, brPayload.amount)} · PIX
          </p>
        </div>
      </div>

      <Button type="button" className="payout-btn-primary mt-6" onClick={onCreateAnother}>
        Create another payout
      </Button>
    </section>
  )
}
