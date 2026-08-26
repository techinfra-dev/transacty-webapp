import { GLOBAL_BADGE_URL } from '../../../../utils/currencyMarketAvatar.ts'

type AvatarSize = 'sm' | 'md' | 'lg'

type AddWalletFolderAvatarProps = {
  size?: AvatarSize
  className?: string
}

function joinClasses(...classNames: Array<string | undefined | false>) {
  return classNames.filter(Boolean).join(' ')
}

/** Folder-style stacked avatar used for the Add wallet tab. */
export function AddWalletFolderAvatar({
  size = 'sm',
  className,
}: AddWalletFolderAvatarProps) {
  return (
    <span
      className={joinClasses(
        'currency-market-avatar',
        `currency-market-avatar--${size}`,
        'currency-market-avatar--stacked',
        'currency-market-avatar--add',
        className,
      )}
      aria-hidden
      title="Add wallet"
    >
      <span className="currency-market-avatar-surface currency-market-avatar-surface--crypto currency-market-avatar-surface--add">
        <svg
          className="currency-market-avatar-add-plus"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.1"
          strokeLinecap="round"
          aria-hidden
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
      </span>
      <span className="currency-market-avatar-badge">
        <img
          className="currency-market-avatar-badge-img currency-market-avatar-badge-img--global"
          src={GLOBAL_BADGE_URL}
          alt=""
          loading="lazy"
          decoding="async"
        />
      </span>
    </span>
  )
}
