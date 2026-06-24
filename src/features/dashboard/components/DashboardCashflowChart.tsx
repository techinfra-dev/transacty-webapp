import { useMemo, useState } from 'react'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner.tsx'
import { useTransactionsListQuery } from '../hooks/useTransactionsQueries.ts'
import {
  buildTransactionActivityBuckets,
  chartPeakCount,
  formatChartCount,
  shouldShowDayLabel,
  sumBucketCounts,
  type ChartPeriod,
} from '../utils/dashboardChartUtils.ts'
import { TRANSACTIONS_LIST_MAX_LIMIT } from './transactions/transactionConstants.ts'

const CHART_WIDTH = 520
const CHART_HEIGHT = 128
const PAD_X = 28
const PAD_Y = 18

export function DashboardCashflowChart() {
  const [period, setPeriod] = useState<ChartPeriod>(7)
  const transactionsQuery = useTransactionsListQuery({
    limit: TRANSACTIONS_LIST_MAX_LIMIT,
    offset: 0,
  })

  const buckets = useMemo(
    () => buildTransactionActivityBuckets(transactionsQuery.data?.items ?? [], period),
    [period, transactionsQuery.data?.items],
  )

  const totals = useMemo(() => sumBucketCounts(buckets), [buckets])
  const maxValue = useMemo(() => chartPeakCount(buckets), [buckets])

  const plotWidth = CHART_WIDTH - PAD_X * 2
  const plotHeight = CHART_HEIGHT - PAD_Y * 2
  const groupWidth = plotWidth / buckets.length
  const innerGap = 2
  const barWidth = Math.max(4, (groupWidth - innerGap * 3) / 2)

  return (
    <section className="dashboard-card chart-card">
      <div className="dashboard-card-head">
        <div>
          <h2 className="dashboard-card-title">Transaction activity</h2>
          <div className="mt-1.5 flex flex-wrap items-baseline gap-3 [font-family:var(--font-body)] text-sm text-[rgba(15,7,0,0.58)]">
            <span className="inline-flex items-center gap-1.5">
              <i className="inline-block h-2 w-2 rounded-sm bg-[#84CC16]" aria-hidden />
              Successful{' '}
              <b className="font-semibold text-[#0F0700] tabular-nums">
                {formatChartCount(totals.success)}
              </b>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <i
                className="inline-block h-2 w-2 rounded-sm border border-[#b91c1c] bg-[#fee5e2]"
                aria-hidden
              />
              Failed{' '}
              <b className="font-semibold text-[#0F0700] tabular-nums">
                {formatChartCount(totals.failed)}
              </b>
            </span>
            <div className="dashboard-chart-seg" role="group" aria-label="Chart period">
              <button
                type="button"
                data-active={period === 7}
                onClick={() => setPeriod(7)}
              >
                7D
              </button>
              <button
                type="button"
                data-active={period === 30}
                onClick={() => setPeriod(30)}
              >
                30D
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-[18px] pb-[18px] pt-3">
        {transactionsQuery.isPending ? (
          <div className="flex min-h-[128px] items-center justify-center">
            <LoadingSpinner label="Loading chart..." />
          </div>
        ) : transactionsQuery.isError ? (
          <p className="py-8 text-center [font-family:var(--font-body)] text-sm text-[#b91c1c]">
            Unable to load chart data.
          </p>
        ) : (
          <div className="mx-auto max-w-3xl">
            <svg
              viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
              className="block h-auto max-h-[140px] w-full"
              role="img"
              aria-label="Transaction activity bar chart"
              preserveAspectRatio="xMidYMid meet"
            >
              {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
                const y = PAD_Y + plotHeight - tick * plotHeight
                return (
                  <g key={tick}>
                    <line
                      x1={PAD_X}
                      x2={CHART_WIDTH - PAD_X}
                      y1={y}
                      y2={y}
                      stroke="rgba(15,7,0,0.06)"
                      strokeWidth={1}
                    />
                    <text
                      x={PAD_X - 6}
                      y={y + 3}
                      textAnchor="end"
                      className="fill-[rgba(15,7,0,0.4)] [font-family:ui-monospace,monospace] text-[11px]"
                    >
                      {formatChartCount(Math.round(maxValue * tick))}
                    </text>
                  </g>
                )
              })}

              {buckets.map((bucket, index) => {
                const groupX = PAD_X + index * groupWidth + innerGap
                const baseline = PAD_Y + plotHeight
                const successHeight = (bucket.success / maxValue) * plotHeight
                const failedHeight = (bucket.failed / maxValue) * plotHeight
                const successX = groupX
                const failedX = groupX + barWidth + innerGap
                const showLabel = shouldShowDayLabel(period, index, buckets.length)

                return (
                  <g key={bucket.key}>
                    {successHeight > 0 ? (
                      <rect
                        x={successX}
                        y={baseline - successHeight}
                        width={barWidth}
                        height={successHeight}
                        rx={2}
                        fill="#84CC16"
                      />
                    ) : null}
                    {failedHeight > 0 ? (
                      <rect
                        x={failedX}
                        y={baseline - failedHeight}
                        width={barWidth}
                        height={failedHeight}
                        rx={2}
                        fill="#fee5e2"
                        stroke="#b91c1c"
                        strokeWidth={0.5}
                      />
                    ) : null}
                    {showLabel ? (
                      <text
                        x={PAD_X + index * groupWidth + groupWidth / 2}
                        y={CHART_HEIGHT - 4}
                        textAnchor="middle"
                        className="fill-[rgba(15,7,0,0.4)] [font-family:ui-monospace,monospace] text-[11px]"
                      >
                        {bucket.label}
                      </text>
                    ) : null}
                  </g>
                )
              })}
            </svg>
            <p className="mt-1 text-center [font-family:var(--font-body)] text-xs text-[rgba(15,7,0,0.45)]">
              Daily transaction counts (successful vs failed) in the selected period
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
