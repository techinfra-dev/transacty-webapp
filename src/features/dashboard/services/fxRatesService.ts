import {
  FALLBACK_USD_RATES,
  fxRatesResponseSchema,
  type FxRatesResponse,
} from './fxRatesSchemas.ts'

/**
 * Public mid-market feed (USD base). Used only for wallet distribution
 * visualization — not for settlement or payouts.
 */
const FX_FEED_URL = 'https://open.er-api.com/v6/latest/USD'

export async function fetchUsdFxRates(): Promise<FxRatesResponse> {
  try {
    const response = await fetch(FX_FEED_URL, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    })
    if (!response.ok) {
      throw new Error(`FX feed HTTP ${response.status}`)
    }
    const payload = (await response.json()) as {
      result?: string
      base_code?: string
      rates?: Record<string, number>
      time_last_update_utc?: string
    }
    if (payload.result !== 'success' || !payload.rates) {
      throw new Error('FX feed returned an unexpected payload')
    }
    return fxRatesResponseSchema.parse({
      base: 'USD',
      rates: payload.rates,
      updatedAt: payload.time_last_update_utc,
    })
  } catch {
    return {
      base: 'USD',
      rates: { USD: 1, ...FALLBACK_USD_RATES },
    }
  }
}
