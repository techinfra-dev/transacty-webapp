interface LoadingSpinnerProps {
  label?: string
  className?: string
  /** Slightly larger ring for route-level lazy import loading. */
  thick?: boolean
}

function joinClasses(...classNames: Array<string | undefined>) {
  return classNames.filter(Boolean).join(' ')
}

export function LoadingSpinner({
  label = 'Loading...',
  className,
  thick = false,
}: LoadingSpinnerProps) {
  return (
    <div className={joinClasses('inline-flex items-center gap-2.5', className)}>
      <span
        className={joinClasses(
          'animate-spin rounded-full border-(--color-secondary)/35 border-t-(--color-secondary)',
          thick ? 'h-5 w-5 border-[3px]' : 'h-4 w-4 border-2',
        )}
        aria-hidden
      />
      <span className="[font-family:var(--font-body)] text-sm text-(--color-secondary)">
        {label}
      </span>
    </div>
  )
}
