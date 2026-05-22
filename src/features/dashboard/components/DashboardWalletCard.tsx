import { Link } from '@tanstack/react-router'
import { getCurrencyFullName } from '../../../utils/currencyNames.ts'
import {
  formatWalletStatusLabel,
  splitMoneyDisplay,
  walletStatusPillClass,
} from '../utils/dashboardLedgerStyles.ts'

interface DashboardWalletCardProps {
  walletId: string
  currency: string
  displayValue: string
  statusLabel: string
  isSelected?: boolean
}

export function DashboardWalletCard({
  walletId,
  currency,
  displayValue,
  statusLabel,
  isSelected = false,
}: DashboardWalletCardProps) {
  const { currency: parsedCurrency, amount } = splitMoneyDisplay(displayValue)
  const code = parsedCurrency || currency
  const currencyName = getCurrencyFullName(code)
  const statusDisplay = formatWalletStatusLabel(statusLabel)

  return (
    <Link
      to="/dashboard/wallets/$walletId"
      params={{ walletId }}
      className={`dashboard-wallet ${isSelected ? 'dashboard-wallet--selected ring-2 ring-[#0F0700] ring-offset-2' : ''}`}
      aria-current={isSelected ? 'page' : undefined}
    >
      <div className="flex min-w-0 items-center gap-2">
        <span className="dashboard-wallet-code shrink-0">{code}</span>
        <span className="dashboard-wallet-name truncate">{currencyName}</span>
      </div>

      <div className="flex min-w-0 items-baseline gap-1.5">
        <span className="dashboard-wallet-balance [font-family:var(--font-display)] text-2xl font-semibold tracking-tight text-[#0F0700] tabular-nums">
          {amount}
        </span>
        {code ? (
          <span className="[font-family:var(--font-body)] text-[11px] font-medium text-[rgba(15,7,0,0.4)]">
            {code}
          </span>
        ) : null}
      </div>

      <div className="dashboard-wallet-footer flex items-center gap-2 border-t border-[rgba(15,7,0,0.05)] pt-2">
        <span className={walletStatusPillClass(statusLabel)}>
          <i aria-hidden />
          <span className="capitalize">{statusDisplay}</span>
        </span>
        <span className="ml-auto [font-family:var(--font-body)] text-[11px] text-[rgba(15,7,0,0.4)]">
          Merchant pocket
        </span>
      </div>
    </Link>
  )
}
