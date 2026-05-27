import type { ReactNode } from 'react'

interface SettingsCardProps {
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  className?: string
}

export function SettingsCard({
  title,
  description,
  children,
  footer,
  className,
}: SettingsCardProps) {
  return (
    <article className={`settings-card ${className ?? ''}`.trim()}>
      <header className="settings-card-head">
        <h3 className="settings-card-title">{title}</h3>
        {description ? <p className="settings-card-desc">{description}</p> : null}
      </header>
      <div className="settings-card-divider" aria-hidden />
      <div className="settings-card-body">{children}</div>
      {footer ? (
        <>
          <div className="settings-card-divider" aria-hidden />
          <footer className="settings-card-foot">{footer}</footer>
        </>
      ) : null}
    </article>
  )
}
