import { Button } from '../../../../components/ui/Button.tsx'
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner.tsx'
import { useTransactionDetailModalStore } from '../../../../store/transactionDetailModalStore.ts'
import type {
  NgnPayoutFormPayload,
  NgnPayoutInstance,
} from '../../services/ngnPayoutSchemas.ts'
import type { PortalEnvironment } from '../../../../types/portalEnvironment.ts'
import { NIGERIA_PAYOUT_CURRENCY } from './payoutConstants.ts'
import { formatPayoutMoney } from './payoutFormatters.ts'

interface NgnPayoutSuccessViewProps {
  environment: PortalEnvironment
  ngnPayload: NgnPayoutFormPayload
  createdPayout: NgnPayoutInstance
  polledPayout: NgnPayoutInstance | undefined
  isPolling: boolean
  onCreateAnother: () => void
}

function formatOptionalMoney(currency: string, amount: string | null | undefined) {
  if (!amount?.trim()) {
    return '—'
  }
  return formatPayoutMoney(currency, amount)
}

/** Recipients are shown masked — the full account number is never echoed back. */
function maskAccountNumber(accountNumber: string) {
  const digits = accountNumber.trim()
  if (digits.length < 4) {
    return '—'
  }
  return `••••••${digits.slice(-4)}`
}

export function NgnPayoutSuccessView({
  environment,
  ngnPayload,
  createdPayout,
  polledPayout,
  isPolling,
  onCreateAnother,
}: NgnPayoutSuccessViewProps) {
  const payout = polledPayout ?? createdPayout
  const statusLabel = payout.status?.trim().toLowerCase() || 'pending'
  const currency = payout.currency?.trim().toUpperCase() || NIGERIA_PAYOUT_CURRENCY
  const isFailed = statusLabel === 'failed' || statusLabel === 'cancelled'
  const isSent = statusLabel === 'success'
  const openTransactionDetail = useTransactionDetailModalStore(
    (state) => state.openTransactionDetail,
  )
  const maskedRecipient =
    payout.recipient?.masked?.trim() || maskAccountNumber(ngnPayload.accountNumber)

  return (
    <section className="payout-success">
      <span className="payout-success-badge">NGN payout created</span>
      <h2 className="payout-success-title">
        {isSent
          ? 'NGN payout sent'
          : isFailed
            ? 'NGN payout could not be completed'
            : 'Nigeria NGN payout in progress'}
      </h2>
      <p className="payout-success-desc">
        {isSent
          ? 'Funds were sent to the beneficiary bank account.'
          : isFailed
            ? 'This payout did not go through. No further action is needed from you — contact support with the transaction ID if the amount does not return to your wallet.'
            : 'Your payout is being processed by the bank. Status refreshes automatically.'}
      </p>

      <div className="payout-success-details">
        <div>
          <p className="payout-summary-label">Status</p>
          <p className="payout-summary-value capitalize">{statusLabel}</p>
        </div>
        <div>
          <p className="payout-summary-label">Payout amount</p>
          <p className="payout-summary-value">
            {formatPayoutMoney(currency, payout.amount ?? ngnPayload.amount)}
          </p>
        </div>
        {payout.debitAmount ? (
          <div>
            <p className="payout-summary-label">Total debit</p>
            <p className="payout-summary-value">
              {formatOptionalMoney(currency, payout.debitAmount)}
            </p>
          </div>
        ) : null}
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
          <p className="payout-summary-value">{ngnPayload.accountName || '—'}</p>
        </div>
        <div>
          <p className="payout-summary-label">Account</p>
          <p className="payout-summary-value font-[ui-monospace,monospace] text-xs">
            {maskedRecipient}
          </p>
        </div>
        <div>
          <p className="payout-summary-label">Bank</p>
          <p className="payout-summary-value">
            {ngnPayload.bankName || ngnPayload.bankCode || '—'}
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
