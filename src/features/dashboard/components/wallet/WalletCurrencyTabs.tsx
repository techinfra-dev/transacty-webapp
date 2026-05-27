import { Link } from '@tanstack/react-router'
import { getCurrencyFullName } from '../../../../utils/currencyNames.ts'
import type { MerchantWalletItem } from '../../services/walletsSchemas.ts'
import { FormattedMoney } from '../../../../components/ui/FormattedMoney.tsx'

type WalletCurrencyTabsProps = {
  wallets: MerchantWalletItem[]
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
      {wallets.map((wallet) => {
        const isActive = wallet.id === activeWalletId
        const currencyName = getCurrencyFullName(wallet.currency)
        const amount = Number(wallet.balance)
        const safeAmount = Number.isFinite(amount) ? amount : 0
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
            <FormattedMoney
              className="dashboard-wallet-tab-balance"
              currency={wallet.currency}
              value={safeAmount}
              masked={areBalancesHidden}
            />
          </Link>
        )
      })}
    </div>
  )
}
