interface LoadingSpinnerProps {
  label?: string
  className?: string
}

function joinClasses(...classNames: Array<string | undefined>) {
  return classNames.filter(Boolean).join(' ')
}

export function LoadingSpinner({
  label = 'Loading...',
  className,
}: LoadingSpinnerProps) {
  return (
    <div className={joinClasses('inline-flex items-center gap-2', className)}>
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-(--color-secondary)/35 border-t-(--color-secondary)" />
      <span className="[font-family:var(--font-body)] text-sm text-(--color-secondary)">
        {label}
      </span>
    </div>
  )
}
