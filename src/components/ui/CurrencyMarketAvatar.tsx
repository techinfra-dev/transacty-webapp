import { useState } from 'react'
import {
  GLOBAL_BADGE_URL,
  getFlagCdnUrl,
  resolveCurrencyMarketAvatar,
} from '../../utils/currencyMarketAvatar.ts'

type AvatarSize = 'sm' | 'md' | 'lg'

interface CurrencyMarketAvatarProps {
  currency?: string | null
  market?: string | null
  region?: string | null
  size?: AvatarSize
  className?: string
}

function joinClasses(...classNames: Array<string | undefined | false>) {
  return classNames.filter(Boolean).join(' ')
}

export function CurrencyMarketAvatar({
  currency,
  market,
  region,
  size = 'md',
  className,
}: CurrencyMarketAvatarProps) {
  const model = resolveCurrencyMarketAvatar({ currency, market, region })
  const [primaryFailed, setPrimaryFailed] = useState(false)
  const [badgeFailed, setBadgeFailed] = useState(false)

  if (model.kind === 'fallback' || primaryFailed) {
    return (
      <span
        className={joinClasses(
          'currency-market-avatar',
          `currency-market-avatar--${size}`,
          'currency-market-avatar--fallback',
          className,
        )}
        aria-hidden
        title={model.label}
      >
        <span className="currency-market-avatar-fallback-text">
          {model.kind === 'fallback'
            ? model.label
            : model.kind === 'crypto'
              ? model.cryptoCode.slice(0, 1)
              : model.flagCode.slice(0, 2).toUpperCase()}
        </span>
      </span>
    )
  }

  if (model.kind === 'country') {
    return (
      <span
        className={joinClasses(
          'currency-market-avatar',
          `currency-market-avatar--${size}`,
          'currency-market-avatar--country',
          className,
        )}
        aria-hidden
        title={model.label}
      >
        <span className="currency-market-avatar-surface">
          <img
            className="currency-market-avatar-primary currency-market-avatar-primary--flag"
            src={getFlagCdnUrl(model.flagCode, size === 'lg' ? 160 : 80)}
            alt=""
            loading="lazy"
            decoding="async"
            onError={() => setPrimaryFailed(true)}
          />
        </span>
      </span>
    )
  }

  const badgeSrc =
    model.badge.kind === 'global'
      ? GLOBAL_BADGE_URL
      : getFlagCdnUrl(model.badge.flagCode, 40)

  return (
    <span
      className={joinClasses(
        'currency-market-avatar',
        `currency-market-avatar--${size}`,
        'currency-market-avatar--stacked',
        className,
      )}
      aria-hidden
      title={model.label}
    >
      <span className="currency-market-avatar-surface currency-market-avatar-surface--crypto">
        <img
          className="currency-market-avatar-primary currency-market-avatar-primary--crypto"
          src={model.cryptoLogoUrl}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setPrimaryFailed(true)}
        />
      </span>
      {!badgeFailed ? (
        <span className="currency-market-avatar-badge">
          <img
            className={`currency-market-avatar-badge-img${model.badge.kind === 'global' ? ' currency-market-avatar-badge-img--global' : ''}`}
            src={badgeSrc}
            alt=""
            loading="lazy"
            decoding="async"
            onError={() => setBadgeFailed(true)}
          />
        </span>
      ) : null}
    </span>
  )
}
