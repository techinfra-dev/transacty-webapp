import type { PortalEnvironment } from '../../types/portalEnvironment.ts'

interface PortalEnvironmentBadgeProps {
  environment: PortalEnvironment
  className?: string
}

function joinClasses(...classNames: Array<string | undefined>) {
  return classNames.filter(Boolean).join(' ')
}

export function PortalEnvironmentBadge({
  environment,
  className,
}: PortalEnvironmentBadgeProps) {
  const isLive = environment === 'live'

  return (
    <span
      role="status"
      aria-label={isLive ? 'Live environment' : 'Test environment'}
      className={joinClasses(
        'inline-flex shrink-0 items-center rounded-md border px-2.5 py-1 [font-family:var(--font-body)] text-[11px] font-bold uppercase tracking-wider',
        isLive
          ? 'border-rose-700 bg-rose-600 text-white'
          : 'border-amber-400 bg-amber-100 text-amber-950',
        className,
      )}
    >
      {isLive ? 'Live' : 'Test'}
    </span>
  )
}
