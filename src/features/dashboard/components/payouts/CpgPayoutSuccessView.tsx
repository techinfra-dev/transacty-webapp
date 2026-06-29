import { Button } from '../../../../components/ui/Button.tsx'
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner.tsx'
import type { CpgPayoutFormPayload } from '../../services/cpgPayoutFormTypes.ts'
import type { CpgPayoutInstance } from '../../services/cpgPayoutSchemas.ts'
import type { PortalEnvironment } from '../../../../types/portalEnvironment.ts'
import { INDIA_PAYOUT_SETTLEMENT_CURRENCY } from './payoutConstants.ts'
import { formatPayoutMoney } from './payoutFormatters.ts'

interface CpgPayoutSuccessViewProps {
  environment: PortalEnvironment
  cpgPayload: CpgPayoutFormPayload
  createdPayout: CpgPayoutInstance
  polledPayout: CpgPayoutInstance | undefined
  isPolling: boolean
  onCreateAnother: () => void
}

function formatOptionalMoney(currency: string, amount: string | undefined) {
  if (!amount?.trim()) {
    return '—'
  }
  return formatPayoutMoney(currency, amount)
}

export function CpgPayoutSuccessView({
  environment,
  cpgPayload,
  createdPayout,
  polledPayout,
  isPolling,
  onCreateAnother,
}: CpgPayoutSuccessViewProps) {
  const payout = polledPayout ?? createdPayout
  const statusLabel = payout.status?.trim() || 'pending'
  const settlementCurrency =
    payout.settlementCurrency?.trim().toUpperCase() || INDIA_PAYOUT_SETTLEMENT_CURRENCY
  const isTerminal =
    statusLabel === 'success' || statusLabel === 'failed'

  return (
    <section className="payout-success">
      <span className="payout-success-badge">USDT payout created</span>
      <h2 className="payout-success-title">
        {isTerminal && statusLabel === 'success'
          ? 'USDT payout sent'
          : isTerminal && statusLabel === 'failed'
            ? 'USDT payout failed'
            : 'India USDT payout in progress'}
      </h2>
      <p className="payout-success-desc">
        {statusLabel === 'pending'
          ? 'Your payout is being processed on-chain. Status refreshes automatically.'
          : statusLabel === 'success'
            ? 'Funds were sent to the beneficiary wallet address.'
            : statusLabel === 'failed'
              ? 'This payout could not be completed. Check transaction details or contact support.'
              : 'Track payout status below.'}
      </p>

      <div className="payout-success-details">
        <div>
          <p className="payout-summary-label">Status</p>
          <p className="payout-summary-value capitalize">{statusLabel}</p>
        </div>
        <div>
          <p className="payout-summary-label">Payout amount</p>
          <p className="payout-summary-value">
            {formatPayoutMoney(settlementCurrency, cpgPayload.amount)}
          </p>
        </div>
        {payout.debitAmount ? (
          <div>
            <p className="payout-summary-label">Total debit</p>
            <p className="payout-summary-value">
              {formatOptionalMoney(settlementCurrency, payout.debitAmount)}
            </p>
          </div>
        ) : null}
        {payout.feeAmount ? (
          <div>
            <p className="payout-summary-label">Fee</p>
            <p className="payout-summary-value">
              {formatOptionalMoney(
                payout.feeCurrency?.trim().toUpperCase() || settlementCurrency,
                payout.feeAmount,
              )}
            </p>
          </div>
        ) : null}
        <div>
          <p className="payout-summary-label">Network</p>
          <p className="payout-summary-value">{cpgPayload.networkSymbol || '—'}</p>
        </div>
        <div>
          <p className="payout-summary-label">Destination address</p>
          <p className="payout-summary-value font-[ui-monospace,monospace] text-xs break-all">
            {cpgPayload.destinationAddress || '—'}
          </p>
        </div>
        <div>
          <p className="payout-summary-label">Beneficiary</p>
          <p className="payout-summary-value">{cpgPayload.beneficiaryName || '—'}</p>
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
        <Button type="button" variant="ghost" className="payout-btn-ghost" onClick={onCreateAnother}>
          Create another payout
        </Button>
      </div>
    </section>
  )
}
