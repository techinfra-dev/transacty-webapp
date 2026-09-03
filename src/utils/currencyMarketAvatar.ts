/** ISO 3166-1 alpha-2 (or `eu`) codes for FlagCDN. */
export const MARKET_FLAG_CODES: Record<string, string> = {
  bangladesh: 'bd',
  india: 'in',
  europe: 'eu',
  brazil: 'br',
  nigeria: 'ng',
}

/** Fiat currencies that map 1:1 to a country flag (no crypto badge). */
export const FIAT_CURRENCY_FLAG_CODES: Record<string, string> = {
  BDT: 'bd',
  BRL: 'br',
  INR: 'in',
  NGN: 'ng',
  EUR: 'eu',
  USD: 'us',
}

/** CoinGecko large asset URLs for settlement cryptos. */
export const CRYPTO_LOGO_URLS: Record<string, string> = {
  USDT: 'https://assets.coingecko.com/coins/images/325/large/Tether.png',
  USDC: 'https://assets.coingecko.com/coins/images/6319/large/usdc.png',
  PYUSD: 'https://assets.coingecko.com/coins/images/31212/large/PYUSD_Logo_%282%29.png',
}

/** Global badge for worldwide assets. */
export const GLOBAL_BADGE_URL = '/globe.png'

const CRYPTO_CODES = new Set(Object.keys(CRYPTO_LOGO_URLS))

export type CurrencyMarketAvatarBadge =
  | { kind: 'flag'; flagCode: string }
  | { kind: 'global' }
  | { kind: 'crypto'; cryptoCode: string; cryptoLogoUrl: string }

export type CurrencyMarketAvatarModel =
  | {
      kind: 'country'
      flagCode: string
      label: string
    }
  | {
      kind: 'crypto'
      cryptoCode: string
      cryptoLogoUrl: string
      badge: CurrencyMarketAvatarBadge
      label: string
    }
  | {
      kind: 'fallback'
      label: string
    }

/** PYUSD settles in its own pocket (currency may be PYUSD or PYUSD-USDC). */
export function isPyusdCurrencyOrMarket(
  currency?: string | null,
  market?: string | null,
) {
  const marketKey = (market ?? '').trim().toLowerCase()
  if (marketKey === 'pyusd') {
    return true
  }
  const currencyKey = (currency ?? '').trim().toUpperCase()
  return (
    currencyKey === 'PYUSD' ||
    currencyKey === 'PYUSD-USDC' ||
    currencyKey.startsWith('PYUSD')
  )
}

export function getFlagCdnUrl(flagCode: string, width = 80) {
  const code = flagCode.trim().toLowerCase()
  return `https://flagcdn.com/w${width}/${code}.png`
}

export function resolveMarketFlagCode(
  market?: string | null,
  currency?: string | null,
): string | null {
  const marketKey = (market ?? '').trim().toLowerCase()
  if (marketKey && MARKET_FLAG_CODES[marketKey]) {
    return MARKET_FLAG_CODES[marketKey]!
  }
  const currencyKey = (currency ?? '').trim().toUpperCase()
  if (currencyKey && FIAT_CURRENCY_FLAG_CODES[currencyKey]) {
    return FIAT_CURRENCY_FLAG_CODES[currencyKey]!
  }
  return null
}

/**
 * Country-only for local fiat (BDT, BRL).
 * Crypto primary + country/global/crypto badge for USDT / USDC / PYUSD.
 * PYUSD pocket: USDC main logo + PYUSD badge (own settlement wallet).
 */
export function resolveCurrencyMarketAvatar(input: {
  currency?: string | null
  market?: string | null
  region?: string | null
}): CurrencyMarketAvatarModel {
  const currency = (input.currency ?? '').trim().toUpperCase()
  const market = (input.market ?? input.region ?? '').trim().toLowerCase()
  const flagCode = resolveMarketFlagCode(market || null, currency || null)

  if (isPyusdCurrencyOrMarket(currency, market)) {
    return {
      kind: 'crypto',
      cryptoCode: 'USDC',
      cryptoLogoUrl: CRYPTO_LOGO_URLS.USDC!,
      badge: {
        kind: 'crypto',
        cryptoCode: 'PYUSD',
        cryptoLogoUrl: CRYPTO_LOGO_URLS.PYUSD!,
      },
      label: 'USDC · PYUSD',
    }
  }

  if (currency && CRYPTO_CODES.has(currency)) {
    const cryptoLogoUrl = CRYPTO_LOGO_URLS[currency]!
    if (flagCode) {
      return {
        kind: 'crypto',
        cryptoCode: currency,
        cryptoLogoUrl,
        badge: { kind: 'flag', flagCode },
        label: `${currency} · ${flagCode.toUpperCase()}`,
      }
    }
    return {
      kind: 'crypto',
      cryptoCode: currency,
      cryptoLogoUrl,
      badge: { kind: 'global' },
      label: currency,
    }
  }

  if (flagCode) {
    return {
      kind: 'country',
      flagCode,
      label: flagCode.toUpperCase(),
    }
  }

  return {
    kind: 'fallback',
    label: currency.slice(0, 2) || market.slice(0, 2).toUpperCase() || '?',
  }
}
