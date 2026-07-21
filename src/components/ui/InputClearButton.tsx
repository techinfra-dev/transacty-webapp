type InputClearButtonProps = {
  label: string
  onClear: () => void
}

export function InputClearButton({ label, onClear }: InputClearButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      className="inline-flex size-5 shrink-0 items-center justify-center rounded text-(--dash-fg-subtle) transition-colors hover:bg-(--dash-surface-3) hover:text-(--dash-fg) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--dash-border-strong)"
      onClick={onClear}
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        aria-hidden
      >
        <path d="M6 6l12 12M18 6 6 18" />
      </svg>
    </button>
  )
}
