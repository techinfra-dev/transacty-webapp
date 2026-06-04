import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'

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
  disabled?: boolean
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
  disabled = false,
}: DropdownSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({})
  const rootRef = useRef<HTMLDivElement | null>(null)
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value) ?? options[0],
    [options, value],
  )

  useLayoutEffect(() => {
    if (!isOpen || !buttonRef.current) {
      return
    }

    function updateMenuPosition() {
      const trigger = buttonRef.current
      if (!trigger) {
        return
      }

      const rect = trigger.getBoundingClientRect()
      const viewportPadding = 8

      if (menuPlacement === 'top') {
        setMenuStyle({
          position: 'fixed',
          left: rect.left,
          width: rect.width,
          bottom: window.innerHeight - rect.top + 4,
          maxHeight: Math.max(120, rect.top - viewportPadding),
          zIndex: 140,
        })
        return
      }

      setMenuStyle({
        position: 'fixed',
        left: rect.left,
        width: rect.width,
        top: rect.bottom + 4,
        maxHeight: Math.max(120, window.innerHeight - rect.bottom - viewportPadding),
        zIndex: 140,
      })
    }

    updateMenuPosition()
    window.addEventListener('resize', updateMenuPosition)
    window.addEventListener('scroll', updateMenuPosition, true)

    return () => {
      window.removeEventListener('resize', updateMenuPosition)
      window.removeEventListener('scroll', updateMenuPosition, true)
    }
  }, [isOpen, menuPlacement])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return
      }
      setIsOpen(false)
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

  const menu = isOpen && !disabled ? (
    <div
      ref={menuRef}
      role="listbox"
      aria-label={ariaLabel}
      style={menuStyle}
      className="min-w-40 overflow-y-auto overflow-x-hidden rounded-lg border border-(--color-accent)/45 bg-(--color-card) py-1 shadow-[0_4px_16px_rgba(15,7,0,0.16)]"
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
  ) : null

  return (
    <div ref={rootRef} className={joinClasses('relative', className)}>
      <button
        ref={buttonRef}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        disabled={disabled}
        className={`h-10 min-w-40 rounded-lg border px-3 [font-family:var(--font-body)] text-left text-xs font-semibold outline-none transition ${
          disabled
            ? 'cursor-not-allowed border-(--color-accent)/35 bg-(--color-background) text-(--color-secondary)'
            : 'cursor-pointer border-(--color-accent)/45 bg-(--color-card) text-(--color-foreground) hover:border-(--color-secondary)/55 focus:border-(--color-secondary) focus:ring-2 focus:ring-(--color-secondary)/20'
        }`}
        onClick={() => {
          if (!disabled) {
            setIsOpen((previousValue) => !previousValue)
          }
        }}
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

      {menu ? createPortal(menu, document.body) : null}
    </div>
  )
}
