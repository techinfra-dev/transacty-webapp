import type { MerchantWalletItem } from '../services/walletsSchemas.ts'

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
  percent: number
  color: string
}

export function buildWalletDistributionSlices(
  wallets: MerchantWalletItem[],
): WalletDistributionSlice[] {
  const active = wallets.filter((w) => {
    const balance = Number(w.balance)
    return Number.isFinite(balance) && balance > 0
  })

  const total = active.reduce((sum, w) => sum + Number(w.balance), 0)
  if (total <= 0) {
    return []
  }

  return active.map((wallet, index) => {
    const balance = Number(wallet.balance)
    const currency = wallet.currency.trim().toUpperCase()
    const customLabel = wallet.label?.trim()
    return {
      id: wallet.id,
      currency,
      label: customLabel || `${currency} wallet`,
      balance,
      percent: (balance / total) * 100,
      color: WALLET_DISTRIBUTION_COLORS[index % WALLET_DISTRIBUTION_COLORS.length],
    }
  })
}

/** Minimum share of the ring used for rendering (actual % still shown in legend). */
export const MIN_VISUAL_SLICE_PERCENT = 6

export function computeVisualSlicePercents(slices: WalletDistributionSlice[]) {
  if (slices.length <= 1) {
    return slices.map((slice) => slice.percent)
  }

  const boosted = slices.map((slice) =>
    slice.percent > 0 ? Math.max(slice.percent, MIN_VISUAL_SLICE_PERCENT) : 0,
  )
  const total = boosted.reduce((sum, value) => sum + value, 0)
  if (total <= 0) {
    return slices.map(() => 0)
  }

  return boosted.map((value) => (value / total) * 100)
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
  const ordered = slices
    .map((slice, index) => ({
      slice,
      visualPercent: visualPercents[index] ?? slice.percent,
    }))
    .sort((a, b) => b.visualPercent - a.visualPercent)

  let cursor = 0
  return ordered.map(({ slice, visualPercent }) => {
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
