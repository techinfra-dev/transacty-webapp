import type { PayoutFormPayload } from '../../services/payoutFormTypes.ts'
import type { PortalEnvironment } from '../../../../types/portalEnvironment.ts'
import type { MerchantWalletItem } from '../../services/walletsSchemas.ts'
import { getCurrencyFullName } from '../../../../utils/currencyNames.ts'
import { PayoutSummarySkeleton } from './PayoutSummarySkeleton.tsx'

interface PayoutPinnedSummaryProps {
  environment: PortalEnvironment
  selectedWallet: MerchantWalletItem | null
  formattedWalletBalance: string
  payload: PayoutFormPayload
  formattedPreviewAmount: string
  hasBeneficiaryDetails: boolean
  hasSenderDetails: boolean
}

export function PayoutPinnedSummary({
  environment,
  selectedWallet,
  formattedWalletBalance,
  payload,
  formattedPreviewAmount,
  hasBeneficiaryDetails,
  hasSenderDetails,
}: PayoutPinnedSummaryProps) {
  const senderName =
    `${payload.cardHolderInfo.firstName} ${payload.cardHolderInfo.lastName}`.trim() ||
    '—'

  const walletLabel = selectedWallet
    ? getCurrencyFullName(selectedWallet.currency.trim().toUpperCase())
    : null

  return (
    <aside data-payout-pinned className="payout-summary">
      <h2 className="payout-summary-title">Summary</h2>

      <div className="payout-summary-row">
        <p className="payout-summary-label">Environment</p>
        <p className="payout-summary-value uppercase">{environment}</p>
      </div>

      <div className="payout-summary-row">
        <p className="payout-summary-label">Wallet</p>
        {selectedWallet && walletLabel ? (
          <div className="space-y-1">
            <p className="payout-summary-value">{walletLabel}</p>
            <p className="payout-summary-value payout-summary-value--muted">
              {formattedWalletBalance}
            </p>
          </div>
        ) : (
          <p className="payout-summary-value payout-summary-value--placeholder">Not set</p>
        )}
      </div>

      <div className="payout-summary-row">
        <p className="payout-summary-label">Amount</p>
        <p
          className={
            payload.amount.trim()
              ? 'payout-summary-value'
              : 'payout-summary-value payout-summary-value--placeholder'
          }
        >
          {payload.amount.trim() ? formattedPreviewAmount : 'Not set'}
        </p>
      </div>

      <div className="payout-summary-row">
        <p className="payout-summary-label">Beneficiary</p>
        {hasBeneficiaryDetails ? (
          <div className="space-y-1">
            <p className="payout-summary-value">
              {payload.benificiaryAccountInfo.holderName || '—'}
            </p>
            <p className="payout-summary-value payout-summary-value--muted">
              {payload.benificiaryAccountInfo.number || '—'}
            </p>
            <p className="payout-summary-value payout-summary-value--muted">
              {payload.benificiaryAccountInfo.orgName || '—'}
            </p>
          </div>
        ) : (
          <PayoutSummarySkeleton />
        )}
      </div>

      <div className="payout-summary-row">
        <p className="payout-summary-label">Sender</p>
        {hasSenderDetails ? (
          <div className="space-y-1">
            <p className="payout-summary-value">{senderName}</p>
            <p className="payout-summary-value payout-summary-value--muted">
              {payload.cardHolderInfo.email || '—'}
            </p>
            <p className="payout-summary-value payout-summary-value--muted">
              {payload.cardHolderInfo.phone || '—'}
            </p>
          </div>
        ) : (
          <PayoutSummarySkeleton />
        )}
      </div>
    </aside>
  )
}
