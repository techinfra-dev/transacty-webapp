export function RoutePending() {
  return (
    <div
      className="flex min-h-[40vh] items-center justify-center"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="[font-family:var(--font-body)] text-sm text-(--color-muted-foreground)">
        Loading…
      </span>
    </div>
  )
}
