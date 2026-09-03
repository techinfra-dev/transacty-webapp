import { z } from 'zod'

/** Units of currency per 1 USD (e.g. BDT ≈ 122). */
export const fxRatesResponseSchema = z.object({
  base: z.literal('USD'),
  rates: z.record(z.string(), z.number().positive()),
  updatedAt: z.string().optional(),
})

export type FxRatesResponse = z.infer<typeof fxRatesResponseSchema>

/** Stablecoins / dollar pegs — treated as 1 USD. */
export const USD_PEGGED_CURRENCIES = new Set([
  'USD',
  'USDT',
  'USDC',
  'PYUSD',
  'PYUSD-USDC',
])

/** Fallback when the live FX feed is unavailable. */
export const FALLBACK_USD_RATES: Record<string, number> = {
  BDT: 122.5,
  BRL: 5.15,
  EUR: 0.86,
  INR: 95.4,
  NGN: 1550,
  GBP: 0.74,
}
