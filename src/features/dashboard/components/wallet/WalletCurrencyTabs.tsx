import { Link } from '@tanstack/react-router'
import { FormattedMoney } from '../../../../components/ui/FormattedMoney.tsx'
import type { BalanceWalletItem } from '../../services/balanceSchemas.ts'
import { getWalletDisplayLabel } from '../../utils/balanceWalletUtils.ts'

type WalletCurrencyTabsProps = {
  wallets: BalanceWalletItem[]
  activeWalletId: string
  areBalancesHidden?: boolean
}

export function WalletCurrencyTabs({
  wallets,
  activeWalletId,
  areBalancesHidden = false,
}: WalletCurrencyTabsProps) {
  return (
    <div
      className="dashboard-wallet-tabs"
      role="tablist"
      aria-label="Merchant wallets by currency"
    >
      <div className="dashboard-wallet-tabs-track">
        {wallets.map((wallet) => {
          const isActive = wallet.id === activeWalletId
          const displayName = getWalletDisplayLabel(wallet)
          const code = wallet.currency.trim().toUpperCase()
          const amount = Number(wallet.availableBalance ?? wallet.balance)
          const safeAmount = Number.isFinite(amount) ? amount : 0

          return (
            <Link
              key={wallet.id}
              role="tab"
              aria-selected={isActive}
              to="/dashboard/wallets/$walletId"
              params={{ walletId: wallet.id }}
              className={`dashboard-wallet-tab ${isActive ? 'dashboard-wallet-tab--active' : ''}`}
            >
              <div className="dashboard-wallet-tab-shell">
                <span className="dashboard-wallet-tab-code">{code}</span>
                <span
                  className="dashboard-wallet-tab-name"
                  aria-hidden={!isActive}
                >
                  {displayName}
                </span>
                <FormattedMoney
                  className="dashboard-wallet-tab-balance"
                  currency={wallet.currency}
                  value={safeAmount}
                  masked={areBalancesHidden}
                />
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
