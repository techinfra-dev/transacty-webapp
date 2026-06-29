import type { PayoutFormPayload } from '../../services/payoutFormTypes.ts'
import type { EurPayoutFormPayload } from '../../services/eurPayoutFormTypes.ts'
import type { CpgPayoutFormPayload } from '../../services/cpgPayoutFormTypes.ts'
import type { PortalEnvironment } from '../../../../types/portalEnvironment.ts'
import type { BalanceWalletItem } from '../../services/balanceSchemas.ts'
import { getCurrencyFullName } from '../../../../utils/currencyNames.ts'
import {
  EUR_PAYOUT_FIAT_CURRENCY,
  INDIA_PAYOUT_SETTLEMENT_CURRENCY,
  type PayoutRail,
} from './payoutConstants.ts'
import { PayoutSummarySkeleton } from './PayoutSummarySkeleton.tsx'

interface PayoutPinnedSummaryProps {
  environment: PortalEnvironment
  payoutRail: PayoutRail | null
  selectedWallet: BalanceWalletItem | null
  formattedWalletBalance: string
  payload: PayoutFormPayload
  eurPayload: EurPayoutFormPayload
  cpgPayload: CpgPayoutFormPayload
  formattedPreviewAmount: string
  hasBeneficiaryDetails: boolean
  hasSenderDetails: boolean
}

export function PayoutPinnedSummary({
  environment,
  payoutRail,
  selectedWallet,
  formattedWalletBalance,
  payload,
  eurPayload,
  cpgPayload,
  formattedPreviewAmount,
  hasBeneficiaryDetails,
  hasSenderDetails,
}: PayoutPinnedSummaryProps) {
  const senderName =
    payoutRail === 'eur'
      ? `${eurPayload.userDetails.firstName} ${eurPayload.userDetails.lastName}`.trim() ||
        '—'
      : payoutRail === 'cpg'
        ? cpgPayload.beneficiaryName.trim() || '—'
        : `${payload.cardHolderInfo.firstName} ${payload.cardHolderInfo.lastName}`.trim() ||
          '—'

  const walletLabel = selectedWallet
    ? getCurrencyFullName(selectedWallet.currency.trim().toUpperCase())
    : null

  const activeAmount =
    payoutRail === 'eur'
      ? eurPayload.amount
      : payoutRail === 'cpg'
        ? cpgPayload.amount
        : payload.amount

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
        <p className="payout-summary-label">
          {payoutRail === 'eur'
            ? 'Payout amount (EUR)'
            : payoutRail === 'cpg'
              ? `Payout amount (${INDIA_PAYOUT_SETTLEMENT_CURRENCY})`
              : 'Amount'}
        </p>
        <p
          className={
            activeAmount.trim()
              ? 'payout-summary-value'
              : 'payout-summary-value payout-summary-value--placeholder'
          }
        >
          {activeAmount.trim() ? formattedPreviewAmount : 'Not set'}
        </p>
        {payoutRail === 'eur' ? (
          <p className="payout-summary-value payout-summary-value--muted">
            Settlement in {selectedWallet?.currency.trim().toUpperCase() || 'USDC'}
          </p>
        ) : payoutRail === 'cpg' ? (
          <p className="payout-summary-value payout-summary-value--muted">
            On-chain USDT payout
          </p>
        ) : null}
      </div>

      <div className="payout-summary-row">
        <p className="payout-summary-label">Beneficiary</p>
        {hasBeneficiaryDetails ? (
          payoutRail === 'eur' ? (
            <div className="space-y-1">
              <p className="payout-summary-value">{eurPayload.iban || '—'}</p>
              <p className="payout-summary-value payout-summary-value--muted">
                {EUR_PAYOUT_FIAT_CURRENCY} bank transfer
              </p>
            </div>
          ) : payoutRail === 'cpg' ? (
            <div className="space-y-1">
              <p className="payout-summary-value">{cpgPayload.beneficiaryName || '—'}</p>
              <p className="payout-summary-value payout-summary-value--muted break-all font-[ui-monospace,monospace] text-xs">
                {cpgPayload.destinationAddress || '—'}
              </p>
              <p className="payout-summary-value payout-summary-value--muted">
                {cpgPayload.networkSymbol || '—'}
              </p>
            </div>
          ) : (
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
          )
        ) : (
          <PayoutSummarySkeleton />
        )}
      </div>

      <div className="payout-summary-row">
        <p className="payout-summary-label">
          {payoutRail === 'eur'
            ? 'Beneficiary identity'
            : payoutRail === 'cpg'
              ? 'Destination'
              : 'Sender'}
        </p>
        {hasSenderDetails ? (
          payoutRail === 'eur' ? (
            <div className="space-y-1">
              <p className="payout-summary-value">{senderName}</p>
              <p className="payout-summary-value payout-summary-value--muted">
                {eurPayload.userDetails.email || '—'}
              </p>
              <p className="payout-summary-value payout-summary-value--muted">
                {eurPayload.userDetails.country || '—'}
              </p>
            </div>
          ) : payoutRail === 'cpg' ? (
            <div className="space-y-1">
              <p className="payout-summary-value">{cpgPayload.networkSymbol || '—'}</p>
              <p className="payout-summary-value payout-summary-value--muted">
                Crypto wallet transfer
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="payout-summary-value">{senderName}</p>
              <p className="payout-summary-value payout-summary-value--muted">
                {payload.cardHolderInfo.email || '—'}
              </p>
              <p className="payout-summary-value payout-summary-value--muted">
                {payload.cardHolderInfo.phone || '—'}
              </p>
            </div>
          )
        ) : (
          <PayoutSummarySkeleton />
        )}
      </div>
    </aside>
  )
}
