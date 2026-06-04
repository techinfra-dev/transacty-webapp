import { FormattedMoney } from '../../../../components/ui/FormattedMoney.tsx'
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner.tsx'
import type { BalanceWalletItem } from '../../services/balanceSchemas.ts'
import { getWalletDisplayLabel } from '../../utils/balanceWalletUtils.ts'
import { getCurrencyFullName } from '../../../../utils/currencyNames.ts'

type PayoutWalletStepProps = {
  wallets: BalanceWalletItem[] | undefined
  isLoading: boolean
  isError: boolean
  selectedWalletId: string | null
  onSelectWallet: (walletId: string) => void
}

function walletSubtitle(wallet: BalanceWalletItem) {
  if (wallet.displayLabel?.trim() || wallet.regionLabel?.trim() || wallet.label?.trim()) {
    return getWalletDisplayLabel(wallet)
  }
  return `${getCurrencyFullName(wallet.currency)} merchant pocket`
}

export function PayoutWalletStep({
  wallets,
  isLoading,
  isError,
  selectedWalletId,
  onSelectWallet,
}: PayoutWalletStepProps) {
  if (isLoading) {
    return (
      <div className="payout-wallet-panel-state">
        <LoadingSpinner label="Loading wallets…" />
      </div>
    )
  }

  if (isError || wallets === undefined) {
    return (
      <div className="payout-wallet-panel-state">
        <p className="payout-alert payout-alert--inline">
          Unable to load merchant wallets. Please try again.
        </p>
      </div>
    )
  }

  if (wallets.length === 0) {
    return (
      <div className="payout-wallet-panel-state">
        <p className="payout-field-hint">
          No active merchant wallets are available in this environment.
        </p>
      </div>
    )
  }

  return (
    <div className="payout-wallet-list" role="radiogroup" aria-label="Select payout wallet">
      {wallets.map((wallet) => {
        const isSelected = wallet.id === selectedWalletId
        const balance = Number(wallet.availableBalance ?? wallet.balance)
        const safeBalance = Number.isFinite(balance) ? balance : 0
        const code = wallet.currency.trim().toUpperCase()

        return (
          <button
            key={wallet.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            className={`payout-wallet-row ${isSelected ? 'payout-wallet-row--selected' : ''}`}
            onClick={() => onSelectWallet(wallet.id)}
          >
            <span className="payout-wallet-radio" aria-hidden>
              <span className="payout-wallet-radio-dot" />
            </span>
            <span className="payout-wallet-code">{code}</span>
            <span className="payout-wallet-copy">
              <span className="payout-wallet-name">{getCurrencyFullName(code)}</span>
              <span className="payout-wallet-meta">{walletSubtitle(wallet)}</span>
            </span>
            <span className="payout-wallet-balance">
              <FormattedMoney currency={code} value={safeBalance} />
              <span className="payout-wallet-balance-code">{code}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
