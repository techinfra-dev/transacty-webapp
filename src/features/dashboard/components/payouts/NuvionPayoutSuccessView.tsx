import { Button } from '../../../../components/ui/Button.tsx'
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner.tsx'
import { useTransactionDetailModalStore } from '../../../../store/transactionDetailModalStore.ts'
import type {
  NuvionPayoutFormPayload,
  NuvionPayoutInstance,
} from '../../services/nuvionPayoutSchemas.ts'
import type { PortalEnvironment } from '../../../../types/portalEnvironment.ts'
import { formatPayoutMoney } from './payoutFormatters.ts'

interface NuvionPayoutSuccessViewProps {
  environment: PortalEnvironment
  nuvionPayload: NuvionPayoutFormPayload
  createdPayout: NuvionPayoutInstance
  polledPayout: NuvionPayoutInstance | undefined
  isPolling: boolean
  onCreateAnother: () => void
}

export function NuvionPayoutSuccessView({
  environment,
  nuvionPayload,
  createdPayout,
  polledPayout,
  isPolling,
  onCreateAnother,
}: NuvionPayoutSuccessViewProps) {
  const payout = polledPayout ?? createdPayout
  const statusLabel = payout.status?.trim().toLowerCase() || 'pending'
  const currency =
    payout.currency?.trim().toUpperCase() ||
    nuvionPayload.currency ||
    '—'
  const isFailed = statusLabel === 'failed' || statusLabel === 'cancelled'
  const isSent = statusLabel === 'success' || statusLabel === 'settled'
  const openTransactionDetail = useTransactionDetailModalStore(
    (state) => state.openTransactionDetail,
  )

  return (
    <section className="payout-success">
      <span className="payout-success-badge">Nuvion payout created</span>
      <h2 className="payout-success-title">
        {isSent
          ? 'Payout sent'
          : isFailed
            ? 'Payout could not be completed'
            : 'Nuvion payout in progress'}
      </h2>
      <p className="payout-success-desc">
        {isSent
          ? 'Funds were sent to the beneficiary destination.'
          : isFailed
            ? 'This payout did not go through. Contact support with the transaction ID if the amount does not return to your wallet.'
            : 'Your payout is being processed. Status refreshes automatically.'}
      </p>

      <div className="payout-success-details">
        <div>
          <p className="payout-summary-label">Status</p>
          <p className="payout-summary-value capitalize">{statusLabel}</p>
        </div>
        <div>
          <p className="payout-summary-label">Payout amount</p>
          <p className="payout-summary-value">
            {formatPayoutMoney(currency, payout.amount ?? nuvionPayload.amount)}
          </p>
        </div>
        <div>
          <p className="payout-summary-label">Beneficiary</p>
          <p className="payout-summary-value">
            {nuvionPayload.accountHolderName || '—'}
          </p>
        </div>
        <div>
          <p className="payout-summary-label">Destination</p>
          <p className="payout-summary-value">
            {nuvionPayload.destinationType || '—'}
          </p>
        </div>
        {payout.nuvionTransferId ? (
          <div>
            <p className="payout-summary-label">Nuvion transfer</p>
            <p className="payout-summary-value font-[ui-monospace,monospace] text-xs">
              {payout.nuvionTransferId}
            </p>
          </div>
        ) : null}
        <div>
          <p className="payout-summary-label">Environment</p>
          <p className="payout-summary-value uppercase">{environment}</p>
        </div>
        <div>
          <p className="payout-summary-label">Transaction ID</p>
          <p className="payout-summary-value font-[ui-monospace,monospace] text-xs">
            {payout.transactionId}
          </p>
        </div>
      </div>

      {isPolling ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-(--color-secondary)">
          <LoadingSpinner label="Refreshing payout status…" />
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3">
        <Button
          type="button"
          className="payout-btn-primary"
          onClick={() => openTransactionDetail(payout.transactionId)}
        >
          View transaction
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="payout-btn-ghost"
          onClick={onCreateAnother}
        >
          Create another payout
        </Button>
      </div>
    </section>
  )
}
