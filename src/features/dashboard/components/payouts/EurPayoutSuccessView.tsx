import { Button } from '../../../../components/ui/Button.tsx'
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner.tsx'
import type { EurPayoutFormPayload } from '../../services/eurPayoutFormTypes.ts'
import type { EurPayoutInstance } from '../../services/eurPayoutSchemas.ts'
import type { PortalEnvironment } from '../../../../types/portalEnvironment.ts'
import { EUR_PAYOUT_FIAT_CURRENCY, EUR_PAYOUT_SETTLEMENT_CURRENCY } from './payoutConstants.ts'
import { formatPayoutMoney } from './payoutFormatters.ts'

interface EurPayoutSuccessViewProps {
  environment: PortalEnvironment
  eurPayload: EurPayoutFormPayload
  createdPayout: EurPayoutInstance
  polledPayout: EurPayoutInstance | undefined
  isPolling: boolean
  isApproving: boolean
  approveErrorMessage: string | undefined
  onApprove: () => void
  onCreateAnother: () => void
}

function requiresMerchantApproval(payout: EurPayoutInstance) {
  if (payout.requiresMerchantApproval === true) {
    return true
  }
  const approvalStatus = payout.merchantApprovalStatus?.trim().toLowerCase()
  return approvalStatus === 'pending' || approvalStatus === 'required'
}

function formatOptionalMoney(currency: string, amount: string | undefined) {
  if (!amount?.trim()) {
    return '—'
  }
  return formatPayoutMoney(currency, amount)
}

export function EurPayoutSuccessView({
  environment,
  eurPayload,
  createdPayout,
  polledPayout,
  isPolling,
  isApproving,
  approveErrorMessage,
  onApprove,
  onCreateAnother,
}: EurPayoutSuccessViewProps) {
  const payout = polledPayout ?? createdPayout
  const statusLabel = payout.status?.trim() || 'created'
  const needsApproval = requiresMerchantApproval(payout)
  const checkoutUrl = payout.checkoutUrl?.trim()
  const beneficiaryName =
    `${eurPayload.userDetails.firstName} ${eurPayload.userDetails.lastName}`.trim() ||
    '—'

  return (
    <section className="payout-success">
      <span className="payout-success-badge">EUR payout created</span>
      <h2 className="payout-success-title">Complete your Europe payout</h2>
      <p className="payout-success-desc">
        {needsApproval
          ? 'Approve this payout, then send the beneficiary to Open Banking checkout.'
          : checkoutUrl
            ? 'Continue to Open Banking checkout so the beneficiary can authorize the EUR transfer.'
            : 'Your payout request was created. Track status below while checkout becomes available.'}
      </p>

      <div className="payout-success-details">
        <div>
          <p className="payout-summary-label">Status</p>
          <p className="payout-summary-value capitalize">{statusLabel}</p>
        </div>
        <div>
          <p className="payout-summary-label">Payout amount</p>
          <p className="payout-summary-value">
            {formatPayoutMoney(EUR_PAYOUT_FIAT_CURRENCY, eurPayload.amount)}
          </p>
        </div>
        <div>
          <p className="payout-summary-label">Wallet debit</p>
          <p className="payout-summary-value">
            {formatOptionalMoney(
              payout.settlementCurrency?.trim().toUpperCase() ||
                EUR_PAYOUT_SETTLEMENT_CURRENCY,
              payout.totalWalletDebit ?? payout.cryptoAmount,
            )}
          </p>
        </div>
        <div>
          <p className="payout-summary-label">Rate</p>
          <p className="payout-summary-value">{payout.rate?.trim() || '—'}</p>
        </div>
        <div>
          <p className="payout-summary-label">Beneficiary IBAN</p>
          <p className="payout-summary-value font-[ui-monospace,monospace] text-xs">
            {eurPayload.iban || '—'}
          </p>
        </div>
        <div>
          <p className="payout-summary-label">Beneficiary</p>
          <p className="payout-summary-value">{beneficiaryName}</p>
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

      {approveErrorMessage ? (
        <p className="payout-alert mt-4">{approveErrorMessage}</p>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3">
        {needsApproval ? (
          <Button
            type="button"
            className="payout-btn-primary"
            disabled={isApproving}
            onClick={onApprove}
          >
            {isApproving ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current/30 border-t-current" />
                Approving…
              </span>
            ) : (
              'Approve payout'
            )}
          </Button>
        ) : null}

        {checkoutUrl ? (
          <Button
            type="button"
            className="payout-btn-primary"
            onClick={() => {
              window.open(checkoutUrl, '_blank', 'noopener,noreferrer')
            }}
          >
            Open checkout
          </Button>
        ) : null}

        <Button type="button" variant="ghost" className="payout-btn-ghost" onClick={onCreateAnother}>
          Create another payout
        </Button>
      </div>
    </section>
  )
}
