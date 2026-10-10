import type { PayoutFormPayload } from '../../services/payoutFormTypes.ts'
import type { EurPayoutFormPayload } from '../../services/eurPayoutFormTypes.ts'
import type { CpgPayoutFormPayload } from '../../services/cpgPayoutFormTypes.ts'
import type { BrPayoutFormPayload } from '../../services/brPayoutFormTypes.ts'
import type { NgnPayoutFormPayload } from '../../services/ngnPayoutSchemas.ts'
import type { CadPayoutFormPayload } from '../../services/cadPayoutSchemas.ts'
import type { KePayoutFormPayload } from '../../services/kePayoutSchemas.ts'
import type { PortalEnvironment } from '../../../../types/portalEnvironment.ts'
import type { BalanceWalletItem } from '../../services/balanceSchemas.ts'
import { getCurrencyFullName } from '../../../../utils/currencyNames.ts'
import {
  EUR_PAYOUT_FIAT_CURRENCY,
  BRAZIL_PAYOUT_CURRENCY,
  INDIA_PAYOUT_SETTLEMENT_CURRENCY,
  CANADA_PAYOUT_CURRENCY,
  KENYA_PAYOUT_CURRENCY,
  NIGERIA_PAYOUT_CURRENCY,
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
  brPayload: BrPayoutFormPayload
  ngnPayload: NgnPayoutFormPayload
  cadPayload: CadPayoutFormPayload
  kePayload: KePayoutFormPayload
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
  brPayload,
  ngnPayload,
  cadPayload,
  kePayload,
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
        : payoutRail === 'pix'
          ? `${brPayload.cardHolderInfo.firstName} ${brPayload.cardHolderInfo.lastName}`.trim() ||
            '—'
          : payoutRail === 'ngn'
            ? ngnPayload.accountName.trim() || '—'
            : payoutRail === 'cad'
              ? cadPayload.rail === 'bank'
                ? cadPayload.bank.accountName.trim() || '—'
                : cadPayload.rail === 'interac_email'
                  ? cadPayload.interac.name.trim() || cadPayload.interac.email.trim() || '—'
                  : cadPayload.bill.billerName.trim() || '—'
              : payoutRail === 'kes'
                ? kePayload.accountName.trim() || '—'
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
        : payoutRail === 'pix'
          ? brPayload.amount
          : payoutRail === 'ngn'
            ? ngnPayload.amount
            : payoutRail === 'cad'
              ? cadPayload.amount
              : payoutRail === 'kes'
                ? kePayload.amount
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
              : payoutRail === 'pix'
                ? `Payout amount (${BRAZIL_PAYOUT_CURRENCY})`
                : payoutRail === 'ngn'
                  ? `Payout amount (${NIGERIA_PAYOUT_CURRENCY})`
                  : payoutRail === 'cad'
                    ? `Payout amount (${CANADA_PAYOUT_CURRENCY})`
                    : payoutRail === 'kes'
                      ? `Payout amount (${KENYA_PAYOUT_CURRENCY})`
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
        ) : payoutRail === 'pix' ? (
          <p className="payout-summary-value payout-summary-value--muted">
            Brazil PIX payout
          </p>
        ) : payoutRail === 'ngn' ? (
          <p className="payout-summary-value payout-summary-value--muted">
            Nigeria bank transfer
          </p>
        ) : payoutRail === 'cad' ? (
          <p className="payout-summary-value payout-summary-value--muted">
            {cadPayload.rail === 'bank'
              ? 'Canada bank transfer'
              : cadPayload.rail === 'interac_email'
                ? 'Canada Interac email'
                : 'Canada bill pay'}
          </p>
        ) : payoutRail === 'kes' ? (
          <p className="payout-summary-value payout-summary-value--muted">
            Kenya M-Pesa payout
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
          ) : payoutRail === 'ngn' ? (
            <div className="space-y-1">
              <p className="payout-summary-value">
                {ngnPayload.accountName || 'Not verified yet'}
              </p>
              <p className="payout-summary-value payout-summary-value--muted font-[ui-monospace,monospace] text-xs">
                {ngnPayload.accountNumber || '—'}
              </p>
              <p className="payout-summary-value payout-summary-value--muted">
                {ngnPayload.bankName || ngnPayload.bankCode || '—'}
              </p>
            </div>
          ) : payoutRail === 'kes' ? (
            <div className="space-y-1">
              <p className="payout-summary-value">
                {kePayload.accountName || '—'}
              </p>
              <p className="payout-summary-value payout-summary-value--muted font-[ui-monospace,monospace] text-xs">
                {kePayload.accountNumber || '—'}
              </p>
              <p className="payout-summary-value payout-summary-value--muted">
                M-Pesa
              </p>
            </div>
          ) : payoutRail === 'cad' ? (
            <div className="space-y-1">
              <p className="payout-summary-value">
                {cadPayload.rail === 'bank'
                  ? cadPayload.bank.accountName || '—'
                  : cadPayload.rail === 'interac_email'
                    ? cadPayload.interac.name || cadPayload.interac.email || '—'
                    : cadPayload.bill.billerName || cadPayload.bill.billerId || '—'}
              </p>
              <p className="payout-summary-value payout-summary-value--muted font-[ui-monospace,monospace] text-xs">
                {cadPayload.rail === 'bank'
                  ? cadPayload.bank.accountNumber || '—'
                  : cadPayload.rail === 'interac_email'
                    ? cadPayload.interac.email || '—'
                    : cadPayload.bill.accountNumber || '—'}
              </p>
              <p className="payout-summary-value payout-summary-value--muted">
                {cadPayload.rail === 'bank'
                  ? `${cadPayload.bank.institutionNumber || '—'} / ${cadPayload.bank.transitNumber || '—'}`
                  : cadPayload.rail === 'interac_email'
                    ? 'Interac email'
                    : 'Bill pay'}
              </p>
            </div>
          ) : payoutRail === 'pix' ? (
            <div className="space-y-1">
              <p className="payout-summary-value">
                {brPayload.benificiaryAccountInfo.holderName || '—'}
              </p>
              <p className="payout-summary-value payout-summary-value--muted font-[ui-monospace,monospace] text-xs break-all">
                {brPayload.benificiaryAccountInfo.number || '—'}
              </p>
              <p className="payout-summary-value payout-summary-value--muted">
                {brPayload.benificiaryAccountInfo.orgName || '—'}
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
              : payoutRail === 'pix'
                ? 'Originator'
                : payoutRail === 'ngn'
                  ? 'Verified recipient'
                  : payoutRail === 'cad'
                    ? 'Recipient'
                    : payoutRail === 'kes'
                      ? 'Recipient'
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
          ) : payoutRail === 'ngn' ? (
            <div className="space-y-1">
              <p className="payout-summary-value">{senderName}</p>
              <p className="payout-summary-value payout-summary-value--muted">
                Name confirmed by the beneficiary bank
              </p>
            </div>
          ) : payoutRail === 'cad' ? (
            <div className="space-y-1">
              <p className="payout-summary-value">{senderName}</p>
              <p className="payout-summary-value payout-summary-value--muted">
                {cadPayload.rail === 'bank'
                  ? 'Canadian bank recipient'
                  : cadPayload.rail === 'interac_email'
                    ? 'Interac email recipient'
                    : 'Canadian biller'}
              </p>
            </div>
          ) : payoutRail === 'kes' ? (
            <div className="space-y-1">
              <p className="payout-summary-value">{senderName}</p>
              <p className="payout-summary-value payout-summary-value--muted">
                M-Pesa recipient
              </p>
            </div>
          ) : payoutRail === 'pix' ? (
            <div className="space-y-1">
              <p className="payout-summary-value">{senderName}</p>
              <p className="payout-summary-value payout-summary-value--muted">
                {brPayload.cardHolderInfo.email || '—'}
              </p>
              <p className="payout-summary-value payout-summary-value--muted">
                {brPayload.cardHolderInfo.phone || '—'}
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
