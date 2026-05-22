import { Link } from '@tanstack/react-router'
import { getCurrencyFullName } from '../../../../utils/currencyNames.ts'
import type { MerchantWalletItem } from '../../services/walletsSchemas.ts'

type WalletCurrencyTabsProps = {
  wallets: MerchantWalletItem[]
  activeWalletId: string
}

export function WalletCurrencyTabs({
  wallets,
  activeWalletId,
}: WalletCurrencyTabsProps) {
  return (
    <div
      className="dashboard-wallet-tabs"
      role="tablist"
      aria-label="Merchant wallets by currency"
    >
      {wallets.map((wallet) => {
        const isActive = wallet.id === activeWalletId
        const currencyName = getCurrencyFullName(wallet.currency)

        return (
          <Link
            key={wallet.id}
            role="tab"
            aria-selected={isActive}
            to="/dashboard/wallets/$walletId"
            params={{ walletId: wallet.id }}
            className="dashboard-wallet-tab"
          >
            <span className="dashboard-wallet-tab-code">{wallet.currency}</span>
            <span className="dashboard-wallet-tab-name">{currencyName}</span>
          </Link>
        )
      })}
    </div>
  )
}
