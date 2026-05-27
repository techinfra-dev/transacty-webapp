interface SettingsKycGateProps {
  title: string
  description: string
  showCta?: boolean
  onCta?: () => void
  ctaLabel?: string
}

export function SettingsKycGate({
  title,
  description,
  showCta = false,
  onCta,
  ctaLabel = 'Complete KYC now',
}: SettingsKycGateProps) {
  return (
    <section className="flex flex-1 items-center justify-center py-8">
      <div className="settings-kyc-gate">
        <div className="settings-kyc-gate-icon" aria-hidden>
          <svg viewBox="0 0 20 20" className="h-7 w-7 fill-current">
            <path d="M10 2.5a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15Zm0 2.75a.75.75 0 0 1 .75.75v4a.75.75 0 0 1-1.5 0V6a.75.75 0 0 1 .75-.75Zm0 8.25a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z" />
          </svg>
        </div>
        <h3 className="settings-kyc-gate-title">{title}</h3>
        <p className="settings-kyc-gate-desc">{description}</p>
        {showCta && onCta ? (
          <div className="mt-5">
            <button type="button" className="settings-btn settings-btn--primary" onClick={onCta}>
              {ctaLabel}
            </button>
          </div>
        ) : null}
      </div>
    </section>
  )
}
