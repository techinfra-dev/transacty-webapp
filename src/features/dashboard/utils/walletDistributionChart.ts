import type { BalanceWalletItem } from '../services/balanceSchemas.ts'
import { USD_PEGGED_CURRENCIES } from '../services/fxRatesSchemas.ts'

export const WALLET_DISTRIBUTION_COLORS = [
  '#06261B',
  '#84CC16',
  '#3D6B4F',
  '#9D8F82',
  '#566167',
  '#D4CFC4',
] as const

export type WalletDistributionSlice = {
  id: string
  currency: string
  label: string
  balance: number
  /** USD-equivalent used for slice weight. */
  usdValue: number
  percent: number
  color: string
}

function normalizeCurrencyCode(currency: string) {
  const code = currency.trim().toUpperCase()
  if (code.startsWith('PYUSD')) {
    return code === 'PYUSD' ? 'PYUSD' : 'PYUSD-USDC'
  }
  return code
}

/** Convert a pocket balance into USD using units-per-USD rates. */
export function balanceToUsd(
  amount: number,
  currency: string,
  ratesPerUsd: Record<string, number> | undefined,
): number {
  if (!Number.isFinite(amount) || amount <= 0) {
    return 0
  }
  const code = normalizeCurrencyCode(currency)
  if (USD_PEGGED_CURRENCIES.has(code) || code.startsWith('PYUSD')) {
    return amount
  }
  const perUsd = ratesPerUsd?.[code]
  if (!perUsd || !Number.isFinite(perUsd) || perUsd <= 0) {
    return 0
  }
  return amount / perUsd
}

export function buildWalletDistributionSlices(
  wallets: BalanceWalletItem[],
  ratesPerUsd?: Record<string, number>,
): WalletDistributionSlice[] {
  const weighted = wallets
    .map((wallet) => {
      const balance = Number(wallet.availableBalance ?? wallet.balance)
      const currency = normalizeCurrencyCode(wallet.currency)
      const usdValue = balanceToUsd(balance, currency, ratesPerUsd)
      const customLabel =
        wallet.displayLabel?.trim() || wallet.label?.trim() || undefined
      return {
        id: wallet.id,
        currency,
        label: customLabel || `${currency} wallet`,
        balance: Number.isFinite(balance) ? balance : 0,
        usdValue,
      }
    })
    .filter((row) => row.balance > 0 && row.usdValue > 0)

  const totalUsd = weighted.reduce((sum, row) => sum + row.usdValue, 0)
  if (totalUsd <= 0) {
    return []
  }

  return weighted
    .map((row, index) => ({
      ...row,
      percent: (row.usdValue / totalUsd) * 100,
      color: WALLET_DISTRIBUTION_COLORS[index % WALLET_DISTRIBUTION_COLORS.length],
    }))
    .sort((a, b) => b.usdValue - a.usdValue)
    .map((row, index) => ({
      ...row,
      color: WALLET_DISTRIBUTION_COLORS[index % WALLET_DISTRIBUTION_COLORS.length],
    }))
}

/** Donut arc angles match USD-equivalent share. */
export function computeVisualSlicePercents(slices: WalletDistributionSlice[]) {
  return slices.map((slice) => slice.percent)
}

export function formatDistributionPercent(value: number) {
  if (value > 0 && value < 10) {
    return `${value.toFixed(1)}%`
  }
  if (value >= 99.5) {
    return `${value.toFixed(1)}%`
  }
  if (value >= 10) {
    return `${Math.round(value)}%`
  }
  return `${value.toFixed(1)}%`
}

export type DonutArcSegment = {
  slice: WalletDistributionSlice
  startAngle: number
  endAngle: number
  path: string | null
}

export function buildDonutArcSegments(
  slices: WalletDistributionSlice[],
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
): DonutArcSegment[] {
  if (slices.length === 0) {
    return []
  }

  if (slices.length === 1) {
    const slice = slices[0]
    return [
      {
        slice,
        startAngle: 0,
        endAngle: 360,
        path: null,
      },
    ]
  }

  const visualPercents = computeVisualSlicePercents(slices)
  let cursor = 0
  return slices.map((slice, index) => {
    const visualPercent = visualPercents[index] ?? slice.percent
    const sweep = (visualPercent / 100) * 360
    const startAngle = cursor
    const endAngle = cursor + sweep
    cursor = endAngle

    return {
      slice,
      startAngle,
      endAngle,
      path: donutSegmentPath(cx, cy, outerR, innerR, startAngle, endAngle),
    }
  })
}

/** SVG donut ring segment from startAngle to endAngle (degrees, clockwise from 12 o'clock). */
export function donutSegmentPath(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  startAngle: number,
  endAngle: number,
) {
  const toRad = (deg: number) => ((deg - 90) * Math.PI) / 180
  const largeArc = endAngle - startAngle > 180 ? 1 : 0

  const x1 = cx + outerR * Math.cos(toRad(startAngle))
  const y1 = cy + outerR * Math.sin(toRad(startAngle))
  const x2 = cx + outerR * Math.cos(toRad(endAngle))
  const y2 = cy + outerR * Math.sin(toRad(endAngle))
  const x3 = cx + innerR * Math.cos(toRad(endAngle))
  const y3 = cy + innerR * Math.sin(toRad(endAngle))
  const x4 = cx + innerR * Math.cos(toRad(startAngle))
  const y4 = cy + innerR * Math.sin(toRad(startAngle))

  return [
    `M ${x1} ${y1}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2}`,
    `L ${x3} ${y3}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${x4} ${y4}`,
    'Z',
  ].join(' ')
}
