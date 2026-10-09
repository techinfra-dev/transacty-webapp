import { Button } from '../../../../components/ui/Button.tsx'
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner.tsx'
import { useTransactionDetailModalStore } from '../../../../store/transactionDetailModalStore.ts'
import type {
  CadPayoutFormPayload,
  CadPayoutInstance,
} from '../../services/cadPayoutSchemas.ts'
import type { PortalEnvironment } from '../../../../types/portalEnvironment.ts'
import { CANADA_PAYOUT_CURRENCY } from '../../utils/canadaMarket.ts'
import { formatPayoutMoney } from './payoutFormatters.ts'

interface CadPayoutSuccessViewProps {
  environment: PortalEnvironment
  cadPayload: CadPayoutFormPayload
  createdPayout: CadPayoutInstance
  polledPayout: CadPayoutInstance | undefined
  isPolling: boolean
  onCreateAnother: () => void
}

function formatOptionalMoney(currency: string, amount: string | null | undefined) {
  if (!amount?.trim()) {
    return '—'
  }
  return formatPayoutMoney(currency, amount)
}

function recipientLabel(payload: CadPayoutFormPayload) {
  if (payload.rail === 'bank') {
    return payload.bank.accountName || 'Bank recipient'
  }
  if (payload.rail === 'interac_email') {
    return payload.interac.name || payload.interac.email || 'Interac recipient'
  }
  return payload.bill.billerName || 'Biller'
}

function recipientDetail(payload: CadPayoutFormPayload) {
  if (payload.rail === 'bank') {
    return payload.bank.accountNumber
      ? `••••${payload.bank.accountNumber.slice(-4)}`
      : '—'
  }
  if (payload.rail === 'interac_email') {
    return payload.interac.email || '—'
  }
  return payload.bill.accountNumber || '—'
}

export function CadPayoutSuccessView({
  environment,
  cadPayload,
  createdPayout,
  polledPayout,
  isPolling,
  onCreateAnother,
}: CadPayoutSuccessViewProps) {
  const payout = polledPayout ?? createdPayout
  const statusLabel = payout.status?.trim().toLowerCase() || 'pending'
  const currency = payout.currency?.trim().toUpperCase() || CANADA_PAYOUT_CURRENCY
  const isFailed = statusLabel === 'failed' || statusLabel === 'cancelled'
  const isSent = statusLabel === 'success' || statusLabel === 'settled'
  const openTransactionDetail = useTransactionDetailModalStore(
    (state) => state.openTransactionDetail,
  )

  return (
    <section className="payout-success">
      <span className="payout-success-badge">CAD payout created</span>
      <h2 className="payout-success-title">
        {isSent
          ? 'CAD payout sent'
          : isFailed
            ? 'CAD payout could not be completed'
            : 'Canada CAD payout in progress'}
      </h2>
      <p className="payout-success-desc">
        {isSent
          ? 'Funds were sent to the selected Canadian recipient.'
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
            {formatPayoutMoney(currency, payout.amount ?? cadPayload.amount)}
          </p>
        </div>
        {payout.feeAmount ? (
          <div>
            <p className="payout-summary-label">Fee</p>
            <p className="payout-summary-value">
              {formatOptionalMoney(
                payout.feeCurrency?.trim().toUpperCase() || currency,
                payout.feeAmount,
              )}
            </p>
          </div>
        ) : null}
        <div>
          <p className="payout-summary-label">Recipient</p>
          <p className="payout-summary-value">{recipientLabel(cadPayload)}</p>
        </div>
        <div>
          <p className="payout-summary-label">Destination</p>
          <p className="payout-summary-value font-[ui-monospace,monospace] text-xs">
            {payout.recipient?.masked?.trim() || recipientDetail(cadPayload)}
          </p>
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
