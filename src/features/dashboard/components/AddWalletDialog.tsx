import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Sheet } from '../../../components/ui/Sheet.tsx'
import { Input } from '../../../components/ui/Input.tsx'
import { useKycDialogStore } from '../../../store/kycDialogStore.ts'
import type { BalanceWalletItem } from '../services/balanceSchemas.ts'
import type { PortalMarketRow } from '../services/marketSchemas.ts'
import { useRequestMarketMutation } from '../hooks/useRequestMarketMutation.ts'
import { useProfileQuery } from '../hooks/useProfileQuery.ts'
import {
  getMarketWalletAction,
  getVisibleSettlementCurrencies,
  isWalletActivated,
  type CatalogWalletAction,
} from '../utils/balanceWalletUtils.ts'
import {
  BANGLADESH_RAIL_PAUSE_COPY,
  isBangladeshRailPausedForMarket,
} from '../utils/bangladeshRailPause.ts'
import {
  canRequestMarketAccess,
  getMarketAvatarCode,
  getMarketBrowserFilter,
  getMarketDisplayName,
  getMarketRailSummary,
  isMarketTemporarilyDown,
  sortMarkets,
  type MarketBrowserFilter,
} from '../utils/marketDisplayUtils.ts'
import { CurrencyMarketAvatar } from '../../../components/ui/CurrencyMarketAvatar.tsx'
import { AnimateHeight } from '../../../components/ui/AnimateHeight.tsx'

interface AddWalletDialogProps {
  isOpen: boolean
  onClose: () => void
  markets: PortalMarketRow[]
  catalog: BalanceWalletItem[]
}

type BrowserRow = {
  market: PortalMarketRow
  action: CatalogWalletAction
  filter: Exclude<MarketBrowserFilter, 'all'>
  currencies: string[]
  hasActiveWallet: boolean
}

const FILTER_OPTIONS: Array<{ id: MarketBrowserFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'enabled', label: 'Enabled' },
  { id: 'unavailable', label: 'Unavailable' },
]

function AnimatedCount({ value }: { value: number }) {
  const previous = useRef(value)
  const direction = value >= previous.current ? 'up' : 'down'

  useEffect(() => {
    previous.current = value
  }, [value])

  return (
    <span className="add-wallet-count" aria-label={String(value)}>
      <span
        key={value}
        className={`add-wallet-count-value add-wallet-count-value--${direction}`}
      >
        {value}
      </span>
    </span>
  )
}

function WalletGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 256 256"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M216 64H56a8 8 0 0 1 0-16h136a8 8 0 0 0 0-16H56a24 24 0 0 0-24 24v128a24 24 0 0 0 24 24h160a16 16 0 0 0 16-16V80a16 16 0 0 0-16-16m0 128H56a8 8 0 0 1-8-8V88.81A22.86 22.86 0 0 0 56 96h160Zm-20-52a12 12 0 1 1 12-12a12 12 0 0 1-12 12" />
    </svg>
  )
}

function SearchGlyph() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function InfoGlyph() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function GlobeGlyph() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-6.5 6.375a6.53 6.53 0 0 0 1.95-3.75h2.858a6.997 6.997 0 0 1-4.808 3.75ZM15.308 5.25h-2.858a6.53 6.53 0 0 0-1.95-3.75 6.997 6.997 0 0 1 4.808 3.75ZM4.692 14.625h2.858a6.53 6.53 0 0 0 1.95 3.75 6.997 6.997 0 0 1-4.808-3.75ZM4.692 5.25a6.997 6.997 0 0 1 4.808-3.75 6.53 6.53 0 0 0-1.95 3.75H4.692ZM10 16.5c.96-1.11 1.65-2.705 1.867-4.5H8.133c.217 1.795.907 3.39 1.867 4.5Zm0-13c-.96 1.11-1.65 2.705-1.867 4.5h3.734C11.65 6.205 10.96 4.61 10 3.5ZM3.292 12.375A6.997 6.997 0 0 1 3 10c0-.832.101-1.64.292-2.415h2.858A14.86 14.86 0 0 0 6 10c0 .832.05 1.65.15 2.415H3.292Zm10.558 0c.1-.765.15-1.583.15-2.415 0-.832-.05-1.65-.15-2.415h2.858c.191.775.292 1.583.292 2.415s-.101 1.64-.292 2.415h-2.858Z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function statusTone(filter: BrowserRow['filter']) {
  if (filter === 'enabled') {
    return 'enabled'
  }
  if (filter === 'unavailable') {
    return 'unavailable'
  }
  return 'available'
}

function statusLabel(
  filter: BrowserRow['filter'],
  market: PortalMarketRow,
  action: CatalogWalletAction,
) {
  if (filter === 'enabled') {
    return 'Enabled'
  }
  if (filter === 'unavailable') {
    return 'Unavailable'
  }
  if (action === 'pending_review' || market.entitlementStatus === 'requested') {
    return 'Requested'
  }
  if (market.entitlementStatus === 'kyb_in_review') {
    return 'Under review'
  }
  if (action === 'complete_kyc') {
    return 'Needs KYC'
  }
  // Available tab: not enabled yet (requestable), not offline.
  return 'Not enabled'
}

function MarketBrowserRow({
  row,
  enterDelayMs = 0,
}: {
  row: BrowserRow
  enterDelayMs?: number
}) {
  const { market, action, filter, currencies } = row
  const requestMutation = useRequestMarketMutation()
  const openKycDialog = useKycDialogStore((state) => state.openDialog)
  const [justRequested, setJustRequested] = useState(false)
  const displayName = getMarketDisplayName(market.market, market.displayName)
  const railSummary = getMarketRailSummary(market.market)
  const currencyLabel = currencies[0] ?? market.settlementCurrencies[0]?.toUpperCase()
  const temporarilyDown = isMarketTemporarilyDown(market)
  const unavailable = filter === 'unavailable' || temporarilyDown

  function handleRequestAccess() {
    if (requestMutation.isPending) {
      return
    }
    requestMutation.mutate(market.market, {
      onSuccess: () => setJustRequested(true),
    })
  }

  function renderAction() {
    if (unavailable) {
      return <span className="add-wallet-row-pill">Temporarily down</span>
    }

    if (action === 'none' || row.hasActiveWallet) {
      return null
    }

    // Request stays available after KYB — any not-enabled market can be requested.
    if (
      action === 'request_access' ||
      canRequestMarketAccess(market) ||
      market.entitlementStatus === 'disabled'
    ) {
      if (
        justRequested ||
        market.entitlementStatus === 'requested' ||
        market.entitlementStatus === 'kyb_in_review'
      ) {
        return <span className="add-wallet-row-pill">Requested</span>
      }
      if (market.entitlementStatus === 'disabled') {
        return (
          <button
            type="button"
            className="dash-btn-primary add-wallet-row-btn"
            onClick={handleRequestAccess}
            disabled={requestMutation.isPending}
            aria-busy={requestMutation.isPending}
          >
            {requestMutation.isPending ? (
              <span className="add-wallet-row-btn-loading">
                <span
                  className="add-wallet-row-btn-spinner animate-spin"
                  aria-hidden
                />
                Requesting…
              </span>
            ) : (
              'Request access'
            )}
          </button>
        )
      }
    }

    if (action === 'pending_review') {
      return <span className="add-wallet-row-pill">Under review</span>
    }

    if (action === 'complete_kyc') {
      return (
        <button
          type="button"
          className="dash-btn-outline add-wallet-row-btn"
          onClick={() => openKycDialog()}
        >
          Complete verification
        </button>
      )
    }

    if (action === 'provisioning') {
      return <span className="add-wallet-row-pill">Setting up</span>
    }

    if (action === 'suspended') {
      return <span className="add-wallet-row-pill">Suspended</span>
    }

    return null
  }

  const canRequest =
    !unavailable &&
    market.entitlementStatus === 'disabled' &&
    !justRequested
  const canCompleteKyc = !unavailable && action === 'complete_kyc'
  const isInteractive = canRequest || canCompleteKyc

  function handleRowActivate() {
    if (canRequest) {
      handleRequestAccess()
      return
    }
    if (canCompleteKyc) {
      openKycDialog()
    }
  }

  return (
    <li
      className={`add-wallet-browser-row${unavailable ? ' add-wallet-browser-row--muted' : ''}${isInteractive ? ' add-wallet-browser-row--interactive' : ''}`}
      style={{ animationDelay: `${enterDelayMs}ms` }}
      aria-disabled={unavailable || undefined}
      onClick={(event) => {
        if (!isInteractive) {
          return
        }
        const target = event.target as HTMLElement
        if (target.closest('button, a')) {
          return
        }
        handleRowActivate()
      }}
      onKeyDown={(event) => {
        if (!isInteractive) {
          return
        }
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          handleRowActivate()
        }
      }}
      tabIndex={isInteractive ? 0 : undefined}
      role={isInteractive ? 'button' : undefined}
    >
      <CurrencyMarketAvatar
        currency={currencyLabel}
        market={market.market}
        size="md"
        className="add-wallet-browser-avatar-wrap"
      />

      <div className="add-wallet-browser-info">
        <p className="add-wallet-browser-title">{displayName}</p>
        <p className="add-wallet-browser-meta">
          {currencyLabel ? (
            <span className="add-wallet-currency-badge">{currencyLabel}</span>
          ) : null}
          <span className="add-wallet-browser-rails">{railSummary}</span>
        </p>
        {temporarilyDown && isBangladeshRailPausedForMarket(market.market) ? (
          <p className="add-wallet-row-note">{BANGLADESH_RAIL_PAUSE_COPY}</p>
        ) : null}
        {requestMutation.isError ? (
          <p className="add-wallet-row-error">
            {requestMutation.error instanceof Error
              ? requestMutation.error.message
              : 'Unable to request market access.'}
          </p>
        ) : null}
      </div>

      <div className="add-wallet-browser-aside">
        <span
          className={`add-wallet-status-pill add-wallet-status-pill--${statusTone(filter)}`}
        >
          <span className="add-wallet-status-dot" aria-hidden />
          {statusLabel(filter, market, action)}
        </span>
        <div className="add-wallet-row-action">{renderAction()}</div>
      </div>
    </li>
  )
}

export function AddWalletDialog({
  isOpen,
  onClose,
  markets,
  catalog,
}: AddWalletDialogProps) {
  const openKycDialog = useKycDialogStore((state) => state.openDialog)
  const profileQuery = useProfileQuery(isOpen)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<MarketBrowserFilter>('all')
  const filtersRef = useRef<HTMLDivElement>(null)
  const filterChipRefs = useRef<
    Partial<Record<MarketBrowserFilter, HTMLButtonElement>>
  >({})
  const [pill, setPill] = useState({ width: 0, x: 0 })

  const rows = useMemo<BrowserRow[]>(() => {
    const mapped = sortMarkets(markets).map((market) => {
      const action = getMarketWalletAction(market, catalog)
      const filterBucket = getMarketBrowserFilter(market)
      const currencies = getVisibleSettlementCurrencies(
        market.market,
        market.settlementCurrencies,
      )
      const hasActiveWallet = catalog.some(
        (wallet) =>
          (wallet.market ?? wallet.region ?? '').trim().toLowerCase() ===
            market.market && isWalletActivated(wallet),
      )
      return {
        market,
        action,
        filter: filterBucket,
        currencies,
        hasActiveWallet,
      }
    })

    // Temporarily down / unavailable markets always sink to the bottom.
    return [...mapped].sort((a, b) => {
      const aDown = a.filter === 'unavailable' ? 1 : 0
      const bDown = b.filter === 'unavailable' ? 1 : 0
      return aDown - bDown
    })
  }, [markets, catalog])

  const counts = useMemo(() => {
    const next = {
      all: rows.length,
      enabled: 0,
      available: 0,
      unavailable: 0,
    }
    for (const row of rows) {
      next[row.filter] += 1
    }
    return next
  }, [rows])

  const filteredRows = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return rows.filter((row) => {
      if (filter !== 'all' && row.filter !== filter) {
        return false
      }
      if (!needle) {
        return true
      }
      const haystack = [
        getMarketDisplayName(row.market.market, row.market.displayName),
        row.market.market,
        getMarketAvatarCode(row.market.market),
        getMarketRailSummary(row.market.market),
        ...row.currencies,
        ...row.market.settlementCurrencies,
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(needle)
    })
  }, [rows, filter, query])

  const needsVerification =
    profileQuery.data?.kycStatus !== undefined &&
    profileQuery.data.kycStatus !== 'verified'

  const localMarketCount = filteredRows.filter(
    (row) => row.market.market !== 'pyusd',
  ).length

  useLayoutEffect(() => {
    if (!isOpen) {
      setPill({ width: 0, x: 0 })
      return
    }

    let cancelled = false
    let frameId = 0
    let attempts = 0
    let observer: ResizeObserver | null = null

    const measure = () => {
      const container = filtersRef.current
      const activeChip = filterChipRefs.current[filter]
      if (!container || !activeChip) {
        return false
      }
      const containerRect = container.getBoundingClientRect()
      const chipRect = activeChip.getBoundingClientRect()
      if (chipRect.width <= 0) {
        return false
      }
      setPill({
        x: chipRect.left - containerRect.left,
        width: chipRect.width,
      })
      return true
    }

    const onResize = () => {
      measure()
    }

    const attach = () => {
      if (cancelled) {
        return
      }
      if (!measure()) {
        // Sheet portals in after a paint — keep trying until chips exist.
        if (attempts < 40) {
          attempts += 1
          frameId = window.requestAnimationFrame(attach)
        }
        return
      }

      const container = filtersRef.current
      const activeChip = filterChipRefs.current[filter]
      if (!container || !activeChip) {
        return
      }

      observer = new ResizeObserver(onResize)
      observer.observe(container)
      observer.observe(activeChip)
      window.addEventListener('resize', onResize)
    }

    attach()

    return () => {
      cancelled = true
      window.cancelAnimationFrame(frameId)
      observer?.disconnect()
      window.removeEventListener('resize', onResize)
    }
  }, [filter, counts, isOpen])

  function handleFinishVerification() {
    onClose()
    openKycDialog()
  }

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      widthClassName="max-w-2xl"
      ariaLabel="Add a wallet"
    >
      <div className="add-wallet-browser add-wallet-browser--sheet">
        <header className="add-wallet-browser-header">
          <div className="add-wallet-browser-header-main">
            <div className="add-wallet-browser-header-icon">
              <WalletGlyph />
            </div>
            <div>
              <h2 className="add-wallet-browser-title-lg">Add a wallet</h2>
              <p className="add-wallet-browser-subtitle">
                Each wallet holds one currency and settles on its own rails. Pick
                the markets you sell into.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="add-wallet-browser-close"
            onClick={onClose}
            aria-label="Close"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              <path d="M5.22 5.22a.75.75 0 0 1 1.06 0L10 8.94l3.72-3.72a.75.75 0 1 1 1.06 1.06L11.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06L10 11.06l-3.72 3.72a.75.75 0 1 1-1.06-1.06L8.94 10 5.22 6.28a.75.75 0 0 1 0-1.06Z" />
            </svg>
          </button>
        </header>

        <div className="add-wallet-browser-toolbar">
          <label className="add-wallet-browser-search">
            <span className="add-wallet-browser-search-icon">
              <SearchGlyph />
            </span>
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by country, currency or rail — try 'Pix' or 'NGN'"
              className="add-wallet-browser-search-input"
              aria-label="Search markets"
            />
          </label>

          <div
            ref={filtersRef}
            className="add-wallet-browser-filters"
            role="tablist"
            aria-label="Filter markets"
          >
            <span
              className="add-wallet-filter-pill"
              style={{
                width: pill.width,
                transform: `translateX(${pill.x}px)`,
                opacity: pill.width > 0 ? 1 : 0,
              }}
              aria-hidden
            />
            {FILTER_OPTIONS.map((option) => {
              const count = counts[option.id]
              const isActive = filter === option.id
              return (
                <button
                  key={option.id}
                  ref={(node) => {
                    filterChipRefs.current[option.id] = node ?? undefined
                  }}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`add-wallet-filter-chip${isActive ? ' add-wallet-filter-chip--active' : ''}`}
                  onClick={() => setFilter(option.id)}
                >
                  <span className="add-wallet-filter-label">{option.label}</span>
                  <AnimatedCount value={count} />
                </button>
              )
            })}
          </div>
        </div>

        <div className="add-wallet-browser-body">
          {needsVerification ? (
            <div className="add-wallet-verify-banner" role="status">
              <InfoGlyph />
              <p>
                Markets switch on when your business is verified. Request them now
                and they&apos;ll go live together with Live mode — usually within 1
                business day.{' '}
                <button
                  type="button"
                  className="add-wallet-verify-link"
                  onClick={handleFinishVerification}
                >
                  Finish verification
                </button>
              </p>
            </div>
          ) : null}

          <div className="add-wallet-section-label">
            <span>
              Local currency markets <AnimatedCount value={localMarketCount} />
            </span>
            <span className="add-wallet-section-rule" aria-hidden />
          </div>

          <AnimateHeight
            dependency={`${filter}:${query.trim().toLowerCase()}:${filteredRows.length}`}
            className="add-wallet-browser-results-shell"
            contentClassName="add-wallet-browser-results"
          >
            {filteredRows.length === 0 ? (
              <p className="add-wallet-empty">
                {rows.length === 0
                  ? 'No payment markets are available yet.'
                  : 'No markets match your search or filter.'}
              </p>
            ) : (
              <ul className="add-wallet-browser-list">
                {filteredRows.map((row, index) => (
                  <MarketBrowserRow
                    key={row.market.market}
                    row={row}
                    enterDelayMs={Math.min(index * 40, 200)}
                  />
                ))}
              </ul>
            )}
          </AnimateHeight>

          <p className="add-wallet-browser-request-market">
            <GlobeGlyph />
            <span>
              Market not listed?{' '}
              <a
                className="add-wallet-verify-link"
                href="mailto:support@n23.io?subject=Market%20request"
              >
                Tell us where you sell
              </a>
            </span>
          </p>
        </div>
      </div>
    </Sheet>
  )
}
