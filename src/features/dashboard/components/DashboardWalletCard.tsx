import { Link } from '@tanstack/react-router'
import { CurrencyMarketAvatar } from '../../../components/ui/CurrencyMarketAvatar.tsx'
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
import type { WalletActivationStatus } from '../services/marketSchemas.ts'

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
  activationStatus?: WalletActivationStatus | null
}

function formatAmountOnly(value: number) {
  const safe = Number.isFinite(value) ? value : 0
  return safe.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function activationFooterNote(
  activationStatus: WalletActivationStatus | null | undefined,
  market: string | null | undefined,
  currency: string,
) {
  const code = currency.trim().toUpperCase()
  const marketKey = (market ?? '').trim().toLowerCase()
  const isIndia = marketKey === 'india' || code === 'USDT'

  if (activationStatus === 'not_enabled') {
    return 'Market not enabled'
  }
  if (activationStatus === 'pending_kyb') {
    return 'Verification in progress'
  }
  if (activationStatus === 'suspended') {
    return 'Contact support'
  }
  if (isIndia) {
    return 'USDT settlement · pay-ins via API'
  }
  if (
    marketKey === 'pyusd' ||
    code === 'PYUSD' ||
    code === 'PYUSD-USDC' ||
    code.startsWith('PYUSD')
  ) {
    return 'PYUSD → PYUSD USDC'
  }
  if (code === 'USDC') {
    return 'Europe USDC · EUR payouts'
  }
  if (code === 'BRL' || marketKey === 'brazil') {
    return 'Brazil (PIX)'
  }
  if (code === 'NGN' || marketKey === 'nigeria') {
    return 'Virtual account · bank payouts'
  }
  return 'Merchant pocket'
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
  activationStatus,
}: DashboardWalletCardProps) {
  const code = currency.trim().toUpperCase()
  const symbol = getCurrencySymbol(code)
  const currencyName = getCurrencyFullName(code)
  const walletTitle = displayLabel?.trim() || currencyName
  const badgeLabel = code
  const isPaused = isBangladeshRailPausedForWallet({ currency, market, region })
  const isMuted =
    activationStatus === 'not_enabled' ||
    activationStatus === 'pending_kyb' ||
    activationStatus === 'suspended'
  const statusDisplay = isPaused
    ? 'Unavailable'
    : activationStatus && activationStatus !== 'active'
      ? formatWalletStatusLabel(activationStatus)
      : formatWalletStatusLabel(statusLabel)
  const amountDisplay = areBalancesHidden
    ? '******'
    : formatAmountOnly(amount)
  const ariaLabel = areBalancesHidden
    ? maskWalletMoney(code)
    : formatWalletMoney(code, amount)
  const footerNote = isPaused
    ? 'Temporarily down'
    : activationFooterNote(activationStatus, market, code)

  return (
    <Link
      to="/dashboard/wallets/$walletId"
      params={{ walletId }}
      className={`dashboard-wallet${isSelected ? ' dashboard-wallet--selected' : ''}${isPaused || isMuted ? ' dashboard-wallet--paused' : ''}`}
      aria-current={isSelected ? 'page' : undefined}
      aria-label={`${walletTitle}, ${ariaLabel}${isPaused ? `. ${BANGLADESH_RAIL_PAUSE_COPY}` : ''}`}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <CurrencyMarketAvatar
          currency={code}
          market={market}
          region={region}
          size="md"
        />
        <div className="min-w-0">
          <span className="dashboard-wallet-name truncate block">{walletTitle}</span>
          <span className="dashboard-wallet-code dashboard-wallet-code--inline-meta">
            {badgeLabel}
          </span>
        </div>
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
            isPaused || isMuted
              ? 'dashboard-pill dashboard-pill-neutral'
              : walletStatusPillClass(statusLabel)
          }
        >
          <i aria-hidden />
          <span className="capitalize">{statusDisplay}</span>
        </span>
        <span className="dashboard-wallet-footer-note">{footerNote}</span>
      </div>
    </Link>
  )
}
