import { Link } from '@tanstack/react-router'
import { getCurrencyFullName, getCurrencySymbol } from '../../../utils/currencyNames.ts'
import {
  formatWalletMoney,
  maskWalletMoney,
} from '../utils/walletFormatters.ts'
import {
  formatWalletStatusLabel,
  walletStatusPillClass,
} from '../utils/dashboardLedgerStyles.ts'
import {
  BANGLADESH_RAIL_PAUSE_COPY,
  isBangladeshRailPausedForWallet,
} from '../utils/bangladeshRailPause.ts'

interface DashboardWalletCardProps {
  walletId: string
  currency: string
  amount: number
  areBalancesHidden?: boolean
  statusLabel: string
  displayLabel?: string | null
  isSelected?: boolean
  market?: string | null
  region?: string | null
}

function formatAmountOnly(value: number) {
  const safe = Number.isFinite(value) ? value : 0
  return safe.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function DashboardWalletCard({
  walletId,
  currency,
  amount,
  areBalancesHidden = false,
  statusLabel,
  displayLabel,
  isSelected = false,
  market,
  region,
}: DashboardWalletCardProps) {
  const code = currency.trim().toUpperCase()
  const symbol = getCurrencySymbol(code)
  const currencyName = getCurrencyFullName(code)
  const walletTitle = displayLabel?.trim() || currencyName
  const badgeLabel = code
  const isPaused = isBangladeshRailPausedForWallet({ currency, market, region })
  const statusDisplay = isPaused
    ? 'Unavailable'
    : formatWalletStatusLabel(statusLabel)
  const amountDisplay = areBalancesHidden
    ? '******'
    : formatAmountOnly(amount)
  const ariaLabel = areBalancesHidden
    ? maskWalletMoney(code)
    : formatWalletMoney(code, amount)

  return (
    <Link
      to="/dashboard/wallets/$walletId"
      params={{ walletId }}
      className={`dashboard-wallet ${isSelected ? 'dashboard-wallet--selected' : ''} ${isPaused ? 'dashboard-wallet--paused' : ''}`}
      aria-current={isSelected ? 'page' : undefined}
      aria-label={`${walletTitle}, ${ariaLabel}${isPaused ? `. ${BANGLADESH_RAIL_PAUSE_COPY}` : ''}`}
    >
      <div className="flex min-w-0 items-center gap-2">
        <span className="dashboard-wallet-code shrink-0">
          {badgeLabel}
        </span>
        <span className="dashboard-wallet-name truncate">{walletTitle}</span>
      </div>

      <div className="flex min-w-0 items-baseline gap-1.5">
        {symbol ? (
          <span
            className={`dashboard-wallet-currency-symbol shrink-0 ${code === 'BDT' ? 'dashboard-wallet-currency-symbol--bdt' : ''}`}
            aria-hidden
          >
            {symbol}
          </span>
        ) : null}
        <span className="dashboard-wallet-balance truncate">{amountDisplay}</span>
        {code ? <span className="dashboard-wallet-code-inline">{code}</span> : null}
      </div>

      <div className="dashboard-wallet-footer">
        <span
          className={
            isPaused
              ? 'dashboard-pill dashboard-pill-neutral'
              : walletStatusPillClass(statusLabel)
          }
        >
          <i aria-hidden />
          <span className="capitalize">{statusDisplay}</span>
        </span>
        <span className="dashboard-wallet-footer-note">
          {isPaused ? 'Temporarily down' : 'Merchant pocket'}
        </span>
      </div>
    </Link>
  )
}
