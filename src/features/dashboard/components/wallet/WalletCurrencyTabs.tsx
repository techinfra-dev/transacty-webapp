import { Link } from '@tanstack/react-router'
import { FormattedMoney } from '../../../../components/ui/FormattedMoney.tsx'
import { CurrencyMarketAvatar } from '../../../../components/ui/CurrencyMarketAvatar.tsx'
import type { BalanceWalletItem } from '../../services/balanceSchemas.ts'
import { getWalletDisplayLabel } from '../../utils/balanceWalletUtils.ts'
import { isBangladeshRailPausedForWallet } from '../../utils/bangladeshRailPause.ts'
import { AddWalletFolderAvatar } from './AddWalletFolderAvatar.tsx'

type WalletCurrencyTabsProps = {
  wallets: BalanceWalletItem[]
  activeWalletId: string
  areBalancesHidden?: boolean
  showAddWallet?: boolean
  onAddWallet?: () => void
}

export function WalletCurrencyTabs({
  wallets,
  activeWalletId,
  areBalancesHidden = false,
  showAddWallet = false,
  onAddWallet,
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

          const isPaused = isBangladeshRailPausedForWallet(wallet)

          return (
            <Link
              key={wallet.id}
              role="tab"
              aria-selected={isActive}
              to="/dashboard/wallets/$walletId"
              params={{ walletId: wallet.id }}
              search={{}}
              className={`dashboard-wallet-tab ${isActive ? 'dashboard-wallet-tab--active' : ''} ${isPaused ? 'dashboard-wallet-tab--paused' : ''}`}
            >
              <div className="dashboard-wallet-tab-shell">
                <CurrencyMarketAvatar
                  currency={wallet.currency}
                  market={wallet.market}
                  region={wallet.region}
                  size="sm"
                />
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
                  amountOnly={!isActive}
                />
              </div>
            </Link>
          )
        })}

        {showAddWallet ? (
          <button
            type="button"
            className="dashboard-wallet-tab dashboard-wallet-tab--add"
            aria-label="Add wallet"
            onClick={() => onAddWallet?.()}
          >
            <div className="dashboard-wallet-tab-shell">
              <AddWalletFolderAvatar size="sm" />
              <span className="dashboard-wallet-tab-code">Add</span>
              <span className="dashboard-wallet-tab-name" aria-hidden>
                New market pocket
              </span>
              <span className="dashboard-wallet-tab-balance dashboard-wallet-tab-balance--add">
                Wallet
              </span>
            </div>
          </button>
        ) : null}
      </div>
    </div>
  )
}
