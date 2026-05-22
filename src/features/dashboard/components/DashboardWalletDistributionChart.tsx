import { useMemo } from 'react'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner.tsx'
import { getCurrencyFullName } from '../../../utils/currencyNames.ts'
import { useMerchantWalletsQuery } from '../hooks/useMerchantWalletsQuery.ts'
import { formatWalletMoney } from '../utils/walletFormatters.ts'
import {
  buildDonutArcSegments,
  buildWalletDistributionSlices,
  formatDistributionPercent,
} from '../utils/walletDistributionChart.ts'
import { useUiPreferencesStore } from '../../../store/uiPreferencesStore.ts'

const SIZE = 132
const CX = SIZE / 2
const CY = SIZE / 2
const OUTER_R = 56
const INNER_R = 38

export function DashboardWalletDistributionChart() {
  const areBalancesHidden = useUiPreferencesStore(
    (state) => state.areBalancesHidden,
  )
  const walletsQuery = useMerchantWalletsQuery(true)
  const wallets = walletsQuery.data?.items ?? []

  const slices = useMemo(
    () => buildWalletDistributionSlices(wallets),
    [wallets],
  )

  const walletCount = wallets.length
  const hasPositiveBalance = slices.length > 0

  const arcs = useMemo(
    () => buildDonutArcSegments(slices, CX, CY, OUTER_R, INNER_R),
    [slices],
  )

  return (
    <section className="dashboard-card flex min-w-0 flex-col" aria-label="Wallet balance distribution">
      <div className="dashboard-card-head dashboard-card-head--compact">
        <div>
          <h2 className="dashboard-section-title">Wallet distribution</h2>
          <p className="mt-0.5 [font-family:var(--font-body)] text-[10px] text-[rgba(15,7,0,0.5)]">
            Balance share across pockets
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col px-3 py-3">
        {walletsQuery.isPending ? (
          <div className="flex min-h-[140px] flex-1 items-center justify-center">
            <LoadingSpinner label="Loading distribution..." />
          </div>
        ) : walletsQuery.isError ? (
          <p className="py-8 text-center [font-family:var(--font-body)] text-xs text-[#b91c1c]">
            Unable to load wallet balances.
          </p>
        ) : walletCount === 0 ? (
          <p className="py-8 text-center [font-family:var(--font-body)] text-xs text-[rgba(15,7,0,0.58)]">
            No wallets to display.
          </p>
        ) : !hasPositiveBalance ? (
          <p className="py-8 text-center [font-family:var(--font-body)] text-xs text-[rgba(15,7,0,0.58)]">
            Balances are zero across all pockets.
          </p>
        ) : (
          <>
            <div className="mx-auto flex justify-center">
              <svg
                viewBox={`0 0 ${SIZE} ${SIZE}`}
                className="h-[132px] w-[132px] shrink-0"
                role="img"
                aria-label="Wallet balance donut chart"
              >
                {arcs.map((arc) =>
                  arc.path ? (
                    <path
                      key={arc.slice.id}
                      d={arc.path}
                      fill={arc.slice.color}
                      stroke="#fff"
                      strokeWidth={1.5}
                    />
                  ) : (
                    <circle
                      key={arc.slice.id}
                      cx={CX}
                      cy={CY}
                      r={(OUTER_R + INNER_R) / 2}
                      fill="none"
                      stroke={arc.slice.color}
                      strokeWidth={OUTER_R - INNER_R}
                    />
                  ),
                )}
                <circle cx={CX} cy={CY} r={INNER_R - 2} fill="#fff" />
                <text
                  x={CX}
                  y={CY - 6}
                  textAnchor="middle"
                  className="fill-[rgba(15,7,0,0.45)] [font-family:var(--font-body)] text-[9px]"
                >
                  {walletCount === 1 ? 'Wallet' : 'Wallets'}
                </text>
                <text
                  x={CX}
                  y={CY + 10}
                  textAnchor="middle"
                  className="fill-[#0F0700] [font-family:var(--font-display)] text-[15px] font-semibold"
                >
                  {walletCount}
                </text>
              </svg>
            </div>

            <ul className="mt-3 space-y-1.5">
              {slices.map((slice) => (
                <li
                  key={slice.id}
                  className="flex items-center gap-2 [font-family:var(--font-body)] text-[11px]"
                >
                  <span
                    className="inline-flex min-w-[2.25rem] shrink-0 items-center justify-center rounded px-1 py-0.5 text-[9px] font-semibold text-white"
                    style={{ backgroundColor: slice.color }}
                  >
                    {formatDistributionPercent(slice.percent)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-[#0F0700]">
                      {getCurrencyFullName(slice.currency)}
                    </p>
                  </div>
                  <span className="shrink-0 text-right text-[10px] font-semibold tabular-nums text-[#464644]">
                    {areBalancesHidden
                      ? `${slice.currency} ******`
                      : formatWalletMoney(slice.currency, slice.balance)}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </section>
  )
}
