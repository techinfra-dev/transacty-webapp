import type { TransactionItem } from '../services/transactionsSchemas.ts'

export type ChartPeriod = 7 | 30

export type ChartDayBucket = {
  key: string
  label: string
  success: number
  failed: number
}

/** Local calendar date key (YYYY-MM-DD) — avoids UTC shift from `toISOString()`. */
export function toLocalDateKey(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function startOfLocalDay(date: Date) {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

function formatDayLabel(date: Date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/** Daily successful vs failed transaction counts for the selected period. */
export function buildTransactionActivityBuckets(
  items: TransactionItem[],
  period: ChartPeriod,
): ChartDayBucket[] {
  const today = startOfLocalDay(new Date())
  const days: ChartDayBucket[] = []

  for (let offset = period - 1; offset >= 0; offset -= 1) {
    const day = new Date(today)
    day.setDate(today.getDate() - offset)
    days.push({
      key: toLocalDateKey(day),
      label: formatDayLabel(day),
      success: 0,
      failed: 0,
    })
  }

  const bucketMap = new Map(days.map((day) => [day.key, day]))

  for (const item of items) {
    const created = new Date(item.createdAt)
    if (Number.isNaN(created.getTime())) continue

    const key = toLocalDateKey(created)
    const bucket = bucketMap.get(key)
    if (!bucket) continue

    if (item.status === 'success') {
      bucket.success += 1
    } else if (item.status === 'failed') {
      bucket.failed += 1
    }
  }

  return days
}

export function sumBucketCounts(buckets: ChartDayBucket[]) {
  return buckets.reduce(
    (acc, bucket) => ({
      success: acc.success + bucket.success,
      failed: acc.failed + bucket.failed,
    }),
    { success: 0, failed: 0 },
  )
}

export function chartPeakCount(buckets: ChartDayBucket[]) {
  return Math.max(...buckets.map((b) => Math.max(b.success, b.failed)), 1)
}

export function formatChartCount(value: number) {
  return value.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

/** Show fewer x-axis labels on 30D to prevent overlap. */
export function shouldShowDayLabel(
  period: ChartPeriod,
  index: number,
  total: number,
) {
  if (period === 7) return true
  if (index === 0 || index === total - 1) return true
  return index % 5 === 0
}
