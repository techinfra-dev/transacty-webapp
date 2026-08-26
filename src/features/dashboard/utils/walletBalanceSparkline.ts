import type { TransactionItem } from '../services/transactionsSchemas.ts'
import { toLocalDateKey } from './dashboardChartUtils.ts'

export type WalletSparklinePoint = {
  key: string
  value: number
  label: string
}

function startOfLocalDay(date: Date) {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

function formatSparkDateLabel(date: Date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function signedTxAmount(item: TransactionItem): number {
  const raw = Number(item.netAmount ?? item.amount)
  if (!Number.isFinite(raw) || raw === 0) return 0
  if (item.type === 'payin') return Math.abs(raw)
  if (item.type === 'payout' || item.type === 'refund') return -Math.abs(raw)
  return raw
}

/**
 * Reconstruct a 30-day balance path ending at `currentBalance` using successful txs.
 * Returns an empty array when there is nothing useful to plot.
 */
export function buildWalletBalanceSparkline(
  items: TransactionItem[],
  currentBalance: number,
  periodDays = 30,
): WalletSparklinePoint[] {
  const today = startOfLocalDay(new Date())
  const days: Array<{ key: string; label: string }> = []
  const dailyNet = new Map<string, number>()

  for (let offset = periodDays - 1; offset >= 0; offset -= 1) {
    const day = new Date(today)
    day.setDate(today.getDate() - offset)
    const key = toLocalDateKey(day)
    days.push({ key, label: formatSparkDateLabel(day) })
    dailyNet.set(key, 0)
  }

  let periodNet = 0
  for (const item of items) {
    if (item.status !== 'success') continue
    const created = new Date(item.createdAt)
    if (Number.isNaN(created.getTime())) continue
    const key = toLocalDateKey(created)
    if (!dailyNet.has(key)) continue
    const delta = signedTxAmount(item)
    dailyNet.set(key, (dailyNet.get(key) ?? 0) + delta)
    periodNet += delta
  }

  const safeBalance = Number.isFinite(currentBalance) ? currentBalance : 0
  let running = safeBalance - periodNet
  const points: WalletSparklinePoint[] = []

  for (const day of days) {
    running += dailyNet.get(day.key) ?? 0
    points.push({ key: day.key, label: day.label, value: running })
  }

  return points
}

/** Percent change from first sparkline point to current balance. */
export function sparklineChangePercent(
  points: WalletSparklinePoint[],
  currentBalance: number,
): number | null {
  if (points.length < 2) return null
  const start = points[0]?.value
  if (start == null || !Number.isFinite(start) || start === 0) {
    if (!Number.isFinite(currentBalance) || currentBalance === 0) return 0
    return null
  }
  return ((currentBalance - start) / Math.abs(start)) * 100
}

export type SparklineCoord = {
  x: number
  y: number
  point: WalletSparklinePoint
}

export function buildSparklineGeometry(
  points: WalletSparklinePoint[],
  width: number,
  height: number,
  padY = 4,
): { line: string; area: string; coords: SparklineCoord[] } {
  if (points.length === 0) {
    return { line: '', area: '', coords: [] }
  }

  const values = points.map((p) => p.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = Math.max(max - min, Math.abs(max) * 0.04, 1)
  const plotH = Math.max(height - padY * 2, 1)
  const stepX = points.length <= 1 ? 0 : width / (points.length - 1)

  const coords = points.map((point, index) => {
    const x = index * stepX
    const y = padY + plotH - ((point.value - min) / range) * plotH
    return { x, y, point }
  })

  const line = coords
    .map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(2)},${c.y.toFixed(2)}`)
    .join(' ')

  const last = coords[coords.length - 1]
  const first = coords[0]
  const area =
    first && last
      ? `${line} L${last.x.toFixed(2)},${height} L${first.x.toFixed(2)},${height} Z`
      : ''

  return { line, area, coords }
}

/** @deprecated Prefer buildSparklineGeometry */
export function buildSparklinePath(
  points: WalletSparklinePoint[],
  width: number,
  height: number,
  padY = 4,
): { line: string; area: string } {
  const { line, area } = buildSparklineGeometry(points, width, height, padY)
  return { line, area }
}
