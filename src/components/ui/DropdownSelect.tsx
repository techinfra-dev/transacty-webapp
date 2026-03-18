import { useEffect, useMemo, useRef, useState } from 'react'

export interface DropdownOption {
  label: string
  value: string
}

interface DropdownSelectProps {
  options: DropdownOption[]
  value: string
  onChange: (nextValue: string) => void
  ariaLabel: string
  className?: string
  menuPlacement?: 'bottom' | 'top'
}

function joinClasses(...classNames: Array<string | undefined>) {
  return classNames.filter(Boolean).join(' ')
}

export function DropdownSelect({
  options,
  value,
  onChange,
  ariaLabel,
  className,
  menuPlacement = 'bottom',
}: DropdownSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value) ?? options[0],
    [options, value],
  )

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!rootRef.current) {
        return
      }
      if (!rootRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    function handleEscapeKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    window.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('keydown', handleEscapeKey)

    return () => {
      window.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('keydown', handleEscapeKey)
    }
  }, [])

  return (
    <div ref={rootRef} className={joinClasses('relative', className)}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="h-10 min-w-40 cursor-pointer rounded-lg border border-(--color-accent)/45 bg-(--color-card) px-3 [font-family:var(--font-body)] text-left text-xs font-semibold text-(--color-foreground) outline-none transition hover:border-(--color-secondary)/55 focus:border-(--color-secondary) focus:ring-2 focus:ring-(--color-secondary)/20"
        onClick={() => setIsOpen((previousValue) => !previousValue)}
      >
        <span className="inline-flex w-full items-center justify-between gap-2">
          <span>{selectedOption.label}</span>
          <span
            className={`inline-flex text-(--color-secondary) transition-transform duration-200 ${
              isOpen ? 'rotate-0' : 'rotate-180'
            }`}
            aria-hidden="true"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4 fill-current">
              <path d="M5.22 12.28a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1-1.06 1.06L10 8.56l-3.72 3.72a.75.75 0 0 1-1.06 0Z" />
            </svg>
          </span>
        </span>
      </button>

      {isOpen ? (
        <div
          role="listbox"
          aria-label={ariaLabel}
          className={`absolute left-0 z-30 w-full min-w-40 overflow-hidden rounded-lg border border-(--color-accent)/45 bg-(--color-card) py-1 ${
            menuPlacement === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'
          }`}
        >
          {options.map((option) => {
            const isSelected = option.value === value

            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                className={`block w-full cursor-pointer px-3 py-2 text-left [font-family:var(--font-body)] text-sm transition ${
                  isSelected
                    ? 'bg-(--color-primary) text-(--color-background)'
                    : 'text-(--color-foreground) hover:bg-(--color-background)'
                }`}
                onClick={() => {
                  onChange(option.value)
                  setIsOpen(false)
                }}
              >
                {option.label}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
