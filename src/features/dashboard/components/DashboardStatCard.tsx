import { Link } from '@tanstack/react-router'

export type DashboardStatIcon = 'wallet' | 'check' | 'clock' | 'bank'

function walletStatusPillClassName(statusRaw: string, onGreen = false): string {
  const s = statusRaw.trim().toLowerCase()
  if (onGreen) {
    if (s === 'active') return 'bg-[#06261B] text-[#D9F99D]'
    if (s === 'pending') return 'bg-[#06261B]/80 text-white'
    return 'bg-white/90 text-[#06261B]'
  }
  if (s === 'active') return 'bg-[#06261B] text-[#D9F99D]'
  if (s === 'pending') return 'bg-[#E8E8E8] text-[#566167]'
  if (s === 'inactive' || s === 'disabled' || s === 'closed')
    return 'bg-[#566167] text-white'
  if (s === 'suspended' || s === 'blocked' || s === 'frozen')
    return 'bg-[#B45309] text-white'
  if (
    s === 'failed' ||
    s.includes('reject') ||
    s.includes('error') ||
    s === 'cancelled' ||
    s === 'canceled'
  )
    return 'bg-[#9f1239] text-white'
  return 'bg-[#F0F0F0] text-[#566167]'
}

interface DashboardStatCardProps {
  title: string
  value: string
  /** Shown before the status pill (e.g. "Merchant pocket"). */
  noteDescriptor: string
  /** Wallet (or pocket) lifecycle status — color-coded like KYC badges. */
  statusLabel: string
  icon: DashboardStatIcon
  /** When set, the whole card links to the dedicated wallet page. */
  walletId?: string
}

function splitMoneyValue(value: string) {
  const trimmed = value.trim()
  const space = trimmed.indexOf(' ')
  if (space === -1) {
    return { currency: '', amount: trimmed }
  }
  return {
    currency: trimmed.slice(0, space),
    amount: trimmed.slice(space + 1),
  }
}

function WalletCardWaves() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      <div className="absolute -right-6 -top-8 h-32 w-32 rounded-full bg-white/25 blur-sm" />
      <div className="absolute -bottom-10 -left-4 h-40 w-40 rounded-full bg-[#BEF264]/50 blur-md" />
      <svg
        className="absolute bottom-0 left-0 w-full opacity-30"
        viewBox="0 0 400 80"
        preserveAspectRatio="none"
      >
        <path
          fill="rgba(255,255,255,0.35)"
          d="M0 48 C80 20 160 60 240 36 S360 52 400 28 L400 80 L0 80 Z"
        />
        <path
          fill="rgba(190,242,100,0.5)"
          d="M0 56 C100 32 200 64 300 40 S380 56 400 44 L400 80 L0 80 Z"
        />
      </svg>
    </div>
  )
}

function WalletIconBadge() {
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/95 text-[#06261B] shadow-[0_2px_6px_rgba(6,38,27,0.1)]">
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden>
        <path
          d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  )
}

function StatIcon({ name }: { name: DashboardStatIcon }) {
  const stroke = '#06261B'
  const common = 'h-5 w-5 shrink-0'
  switch (name) {
    case 'wallet':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden>
          <path
            d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Z"
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M16 12h2M18 10v4"
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      )
    case 'check':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden>
          <circle cx="12" cy="12" r="9" stroke={stroke} strokeWidth="1.5" />
          <path
            d="M8 12.5 10.5 15 16 9"
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
    case 'clock':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden>
          <circle cx="12" cy="12" r="9" stroke={stroke} strokeWidth="1.5" />
          <path
            d="M12 7v5l3 2"
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
    case 'bank':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden>
          <path
            d="M4 10V8l8-4 8 4v2M6 10v8M10 10v8M14 10v8M18 10v8M4 18h16"
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
    default:
      return null
  }
}

const walletShellClass =
  'relative block min-h-[112px] cursor-pointer overflow-hidden rounded-xl border border-[#06261B]/8 bg-[#A3E635] p-3.5 text-inherit no-underline shadow-[0_4px_20px_rgba(6,38,27,0.08)] transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(6,38,27,0.12)] motion-reduce:transform-none motion-reduce:hover:translate-y-0'

const statShellClass =
  'block cursor-pointer rounded-xl border border-[#E8E8E8] bg-white p-3.5 text-inherit no-underline shadow-[0_2px_16px_rgba(15,7,0,0.05)] transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_6px_24px_rgba(15,7,0,0.07)] motion-reduce:transform-none motion-reduce:hover:translate-y-0'

export function DashboardStatCard({
  title,
  value,
  noteDescriptor,
  statusLabel,
  icon,
  walletId,
}: DashboardStatCardProps) {
  const pillClass = walletStatusPillClassName(statusLabel, Boolean(walletId))
  const statusDisplay =
    statusLabel.trim().length > 0
      ? statusLabel.replace(/_/g, ' ')
      : '—'

  const isWalletCard = Boolean(walletId)
  const shellClass = isWalletCard ? walletShellClass : statShellClass
  const { currency, amount } = splitMoneyValue(value)

  const inner = isWalletCard ? (
    <div className="relative flex h-full min-h-[96px] flex-col">
      <WalletCardWaves />
      <div className="relative z-10 flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <p className="[font-family:var(--font-body)] text-xs font-medium text-[#06261B]/75">
            {title}
          </p>
          <WalletIconBadge />
        </div>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
          <p className="[font-family:var(--font-display)] text-lg font-bold tracking-tight text-[#06261B] md:text-xl">
            {amount}
          </p>
          {currency ? (
            <span className="[font-family:var(--font-body)] text-xs font-semibold text-[#06261B]/70">
              {currency}
            </span>
          ) : null}
        </div>
        <div className="mt-auto flex min-w-0 flex-wrap items-center gap-x-1 gap-y-1 pt-2">
          <span className="[font-family:var(--font-body)] text-xs font-medium text-[#06261B]/65">
            {noteDescriptor}
          </span>
          <span className="text-xs text-[#06261B]/40" aria-hidden>
            ·
          </span>
          <span
            className={`inline-flex max-w-full shrink-0 items-center truncate rounded-full px-2 py-0.5 [font-family:var(--font-body)] text-[11px] font-semibold capitalize ${pillClass}`}
          >
            {statusDisplay}
          </span>
        </div>
      </div>
    </div>
  ) : (
    <div className="flex flex-col gap-2">
      <div className="flex shrink-0 justify-start">
        <StatIcon name={icon} />
      </div>
      <div className="min-w-0">
        <p className="[font-family:var(--font-body)] text-xs font-medium text-[#566167]">
          {title}
        </p>
        <p className="mt-1 wrap-break-word [font-family:var(--font-display)] text-base font-bold leading-tight tracking-tight text-[#06261B]">
          {value}
        </p>
        <div className="mt-2 flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1">
          <span className="line-clamp-2 [font-family:var(--font-body)] text-[13px] text-[#566167]">
            {noteDescriptor}
          </span>
          <span className="select-none text-[13px] text-[#9D8F82]" aria-hidden>
            ·
          </span>
          <span
            className={`inline-flex max-w-full shrink-0 items-center truncate rounded-full px-2.5 py-0.5 [font-family:var(--font-body)] text-xs font-semibold capitalize md:text-sm ${pillClass}`}
          >
            {statusDisplay}
          </span>
        </div>
      </div>
    </div>
  )

  if (walletId) {
    return (
      <Link
        to="/dashboard/wallets/$walletId"
        params={{ walletId }}
        className={shellClass}
      >
        {inner}
      </Link>
    )
  }

  return <article className={shellClass}>{inner}</article>
}
