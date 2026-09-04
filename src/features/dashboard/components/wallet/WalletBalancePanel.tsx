import { useId, useMemo, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { FormattedMoney } from '../../../../components/ui/FormattedMoney.tsx'
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner.tsx'
import { useTransactionsListQuery } from '../../hooks/useTransactionsQueries.ts'
import type { BalanceWalletItem } from '../../services/balanceSchemas.ts'
import type { TransactionRailApi } from '../../services/transactionsSchemas.ts'
import { transactionMatchesCurrency } from '../transactions/transactionAmountUtils.ts'
import { TRANSACTIONS_LIST_MAX_LIMIT } from '../transactions/transactionConstants.ts'
import {
  buildSparklineGeometry,
  buildWalletBalanceSparkline,
  sparklineChangePercent,
  type SparklineCoord,
} from '../../utils/walletBalanceSparkline.ts'

const SPARK_W = 560
const SPARK_H = 56

type WalletBalancePanelProps = {
  wallet: BalanceWalletItem
  walletRail: TransactionRailApi | undefined
  areBalancesHidden: boolean
}

function formatChangePercent(value: number | null) {
  if (value == null || !Number.isFinite(value)) return '0.0%'
  const abs = Math.abs(value)
  const rounded = abs >= 10 ? abs.toFixed(0) : abs.toFixed(1)
  return `${rounded}%`
}

function nearestCoord(
  coords: SparklineCoord[],
  pointerX: number,
  width: number,
): SparklineCoord | null {
  if (coords.length === 0 || width <= 0) return null
  const scale = SPARK_W / width
  const svgX = pointerX * scale
  let best = coords[0]!
  let bestDist = Math.abs(best.x - svgX)
  for (let i = 1; i < coords.length; i += 1) {
    const candidate = coords[i]!
    const dist = Math.abs(candidate.x - svgX)
    if (dist < bestDist) {
      best = candidate
      bestDist = dist
    }
  }
  return best
}

export function WalletBalancePanel({
  wallet,
  walletRail,
  areBalancesHidden,
}: WalletBalancePanelProps) {
  const fillId = useId().replace(/:/g, '')
  const sparkRef = useRef<HTMLDivElement>(null)
  const [hover, setHover] = useState<SparklineCoord | null>(null)
  const currency = wallet.currency
  const total = Number(wallet.balance)
  const available = Number(wallet.availableBalance ?? wallet.balance)
  const pending = Number(wallet.pendingBalance)
  const safeTotal = Number.isFinite(total) ? total : 0
  const safeAvailable = Number.isFinite(available) ? available : 0
  const safePending = Number.isFinite(pending) ? pending : 0

  const txQuery = useTransactionsListQuery(
    {
      rail: walletRail,
      limit: TRANSACTIONS_LIST_MAX_LIMIT,
      offset: 0,
    },
    { enabled: Boolean(walletRail) },
  )

  const walletItems = useMemo(() => {
    const items = txQuery.data?.items ?? []
    return items.filter((item) => transactionMatchesCurrency(item, currency))
  }, [currency, txQuery.data?.items])

  const sparkPoints = useMemo(
    () => buildWalletBalanceSparkline(walletItems, safeTotal, 30),
    [safeTotal, walletItems],
  )

  const changePct = useMemo(
    () => sparklineChangePercent(sparkPoints, safeTotal),
    [safeTotal, sparkPoints],
  )

  const geometry = useMemo(
    () => buildSparklineGeometry(sparkPoints, SPARK_W, SPARK_H),
    [sparkPoints],
  )

  const changeUp = (changePct ?? 0) >= 0
  const pendingClearCopy =
    safePending > 0
      ? 'Waiting to clear into available.'
      : 'Nothing waiting to clear.'

  const displayValue = hover && !areBalancesHidden ? hover.point.value : safeTotal
  const displayTrendLabel = hover
    ? hover.point.label
    : `${formatChangePercent(changePct)} in 30 days`

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const rect = sparkRef.current?.getBoundingClientRect()
    if (!rect) return
    const next = nearestCoord(
      geometry.coords,
      event.clientX - rect.left,
      rect.width,
    )
    setHover(next)
  }

  function clearHover() {
    setHover(null)
  }

  const tooltipLeftPct = hover ? (hover.x / SPARK_W) * 100 : 0
  const tooltipFlip = tooltipLeftPct > 72

  return (
    <article className="wallet-balance-panel">
      <div className="wallet-balance-panel-hero">
        <p className="wallet-balance-panel-kicker">
          {hover ? `Balance · ${hover.point.label}` : 'Total balance'}
        </p>
        <p className="wallet-balance-panel-total">
          <FormattedMoney
            currency={currency}
            value={displayValue}
            masked={areBalancesHidden}
          />
        </p>
        <p
          className={`wallet-balance-panel-trend ${
            hover
              ? 'wallet-balance-panel-trend--muted'
              : changeUp
                ? 'wallet-balance-panel-trend--up'
                : 'wallet-balance-panel-trend--down'
          }`}
        >
          {hover ? null : <span aria-hidden>{changeUp ? '↑' : '↓'}</span>}
          {displayTrendLabel}
        </p>
      </div>

      <div
        ref={sparkRef}
        className={`wallet-balance-spark ${geometry.coords.length >= 2 ? 'wallet-balance-spark--interactive' : ''}`}
        onPointerMove={
          geometry.coords.length >= 2 ? handlePointerMove : undefined
        }
        onPointerLeave={geometry.coords.length >= 2 ? clearHover : undefined}
        onPointerCancel={geometry.coords.length >= 2 ? clearHover : undefined}
      >
        {txQuery.isPending ? (
          <div className="flex min-h-[56px] items-center justify-center">
            <LoadingSpinner label="Loading trend…" />
          </div>
        ) : sparkPoints.length >= 2 && geometry.line ? (
          <>
            <svg
              viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}
              className="wallet-balance-spark-svg"
              role="img"
              aria-label="Balance trend over the last 30 days. Hover to inspect daily balances."
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="var(--wallet-spark-stroke)"
                    stopOpacity="0.22"
                  />
                  <stop
                    offset="100%"
                    stopColor="var(--wallet-spark-stroke)"
                    stopOpacity="0.02"
                  />
                </linearGradient>
              </defs>
              <path d={geometry.area} fill={`url(#${fillId})`} />
              <path
                d={geometry.line}
                fill="none"
                stroke="var(--wallet-spark-stroke)"
                strokeWidth="2.25"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>

            {hover ? (
              <>
                <span
                  className="wallet-balance-spark-guide"
                  style={{ left: `${tooltipLeftPct}%` }}
                  aria-hidden
                />
                <span
                  className="wallet-balance-spark-dot"
                  style={{
                    left: `${tooltipLeftPct}%`,
                    top: `${(hover.y / SPARK_H) * 100}%`,
                  }}
                  aria-hidden
                />
                {!areBalancesHidden ? (
                  <div
                    className={`wallet-balance-spark-tip ${tooltipFlip ? 'wallet-balance-spark-tip--flip' : ''}`}
                    style={{ left: `${tooltipLeftPct}%` }}
                    role="status"
                  >
                    <span className="wallet-balance-spark-tip-date">
                      {hover.point.label}
                    </span>
                    <span className="wallet-balance-spark-tip-value">
                      <FormattedMoney
                        currency={currency}
                        value={hover.point.value}
                      />
                    </span>
                  </div>
                ) : null}
              </>
            ) : null}
          </>
        ) : (
          <div className="wallet-balance-spark-empty" />
        )}
      </div>

      <div className="wallet-balance-split">
        <div className="wallet-balance-split-tile">
          <p className="wallet-balance-split-label">Available now</p>
          <p className="wallet-balance-split-value">
            <FormattedMoney
              currency={currency}
              value={safeAvailable}
              masked={areBalancesHidden}
            />
          </p>
          <p className="wallet-balance-split-hint">Ready to pay out or refund.</p>
        </div>
        <div className="wallet-balance-split-tile">
          <p className="wallet-balance-split-label">Pending settlement</p>
          <p className="wallet-balance-split-value">
            <FormattedMoney
              currency={currency}
              value={safePending}
              masked={areBalancesHidden}
            />
          </p>
          <p className="wallet-balance-split-hint">{pendingClearCopy}</p>
        </div>
      </div>
    </article>
  )
}
