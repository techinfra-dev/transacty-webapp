import { Button } from '../../../../components/ui/Button.tsx'
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner.tsx'
import { useTransactionDetailModalStore } from '../../../../store/transactionDetailModalStore.ts'
import type { KePayoutFormPayload } from '../../services/kePayoutSchemas.ts'
import type { KeStablecoinPayoutInstance } from '../../services/keStablecoinPayoutSchemas.ts'
import type { PortalEnvironment } from '../../../../types/portalEnvironment.ts'
import { KENYA_PAYOUT_CURRENCY } from '../../utils/kenyaMarket.ts'
import { formatPayoutMoney } from './payoutFormatters.ts'

interface KesStablecoinPayoutSuccessViewProps {
  environment: PortalEnvironment
  kePayload: KePayoutFormPayload
  createdPayout: KeStablecoinPayoutInstance
  polledPayout: KeStablecoinPayoutInstance | undefined
  isPolling: boolean
  onCreateAnother: () => void
}

export function KesStablecoinPayoutSuccessView({
  environment,
  kePayload,
  createdPayout,
  polledPayout,
  isPolling,
  onCreateAnother,
}: KesStablecoinPayoutSuccessViewProps) {
  const payout = polledPayout ?? createdPayout
  const statusLabel = payout.status?.trim().toLowerCase() || 'processing'
  const needsManualReview = payout.needsManualReview === true
  const isFailed = statusLabel === 'failed' || statusLabel === 'cancelled'
  const isSent = statusLabel === 'success' || statusLabel === 'settled'
  const openTransactionDetail = useTransactionDetailModalStore(
    (state) => state.openTransactionDetail,
  )
  const destinationCurrency =
    payout.destinationCurrency?.trim().toUpperCase() ||
    kePayload.stablecoinCurrency

  return (
    <section className="payout-success">
      <span className="payout-success-badge">KES → stablecoin payout</span>
      <h2 className="payout-success-title">
        {needsManualReview
          ? 'Payout needs support review'
          : isSent
            ? 'Stablecoin payout sent'
            : isFailed
              ? 'Payout could not be completed'
              : 'Stablecoin payout in progress'}
      </h2>
      <p className="payout-success-desc">
        {needsManualReview
          ? 'This transfer needs operations to step in. Contact support with the transaction ID — do not retry the same payout.'
          : isSent
            ? 'KES was converted and sent to the destination address.'
            : isFailed
              ? 'This payout did not go through. Get a fresh quote before trying again.'
              : 'Your payout is being processed. Status refreshes automatically.'}
      </p>

      <div className="payout-success-details">
        <div>
          <p className="payout-summary-label">Status</p>
          <p className="payout-summary-value capitalize">{statusLabel}</p>
        </div>
        {payout.withdrawalStatus ? (
          <div>
            <p className="payout-summary-label">Withdrawal</p>
            <p className="payout-summary-value capitalize">
              {payout.withdrawalStatus}
            </p>
          </div>
        ) : null}
        <div>
          <p className="payout-summary-label">KES debit</p>
          <p className="payout-summary-value">
            {formatPayoutMoney(
              payout.currency?.trim().toUpperCase() || KENYA_PAYOUT_CURRENCY,
              payout.amount ?? kePayload.amount,
            )}
          </p>
        </div>
        <div>
          <p className="payout-summary-label">Destination</p>
          <p className="payout-summary-value">
            {payout.destinationAmountNet ||
              payout.destinationAmountGross ||
              '—'}{' '}
            {destinationCurrency}
          </p>
        </div>
        <div>
          <p className="payout-summary-label">Address</p>
          <p className="payout-summary-value break-all font-[ui-monospace,monospace] text-xs">
            {kePayload.recipientAddress || '—'}
          </p>
        </div>
        <div>
          <p className="payout-summary-label">Beneficiary</p>
          <p className="payout-summary-value">{kePayload.accountName || '—'}</p>
        </div>
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

      {isPolling && !needsManualReview ? (
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
