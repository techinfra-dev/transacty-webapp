import { LoadingSpinner } from './ui/LoadingSpinner.tsx'

export function RoutePending() {
  return (
    <div
      className="route-pending flex min-h-[280px] w-full flex-1 items-center justify-center"
      aria-busy="true"
      aria-live="polite"
    >
      <LoadingSpinner label="Loading…" thick />
    </div>
  )
}
