import type { ButtonHTMLAttributes } from 'react'

interface ToggleSwitchProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  ariaLabel: string
}

function joinClasses(...classNames: Array<string | undefined>) {
  return classNames.filter(Boolean).join(' ')
}

export function ToggleSwitch({
  checked,
  onCheckedChange,
  ariaLabel,
  className,
  disabled,
  ...props
}: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={joinClasses(
        `relative inline-flex h-8 w-14 items-center rounded-full transition focus:outline-none focus:ring-2 focus:ring-(--color-secondary)/30 ${
          checked ? 'bg-lime-500' : 'bg-(--color-accent)/45'
        } ${disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:cursor-pointer'}`,
        className,
      )}
      {...props}
    >
      <span
        className={`inline-block h-6 w-6 rounded-full bg-white shadow-sm transition-transform ${
          checked ? 'translate-x-7' : 'translate-x-1'
        }`}
      />
    </button>
  )
}
