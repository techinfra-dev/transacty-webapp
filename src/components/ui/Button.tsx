import type { ButtonHTMLAttributes } from 'react'

type ButtonVariant = 'primary' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

function joinClasses(...classNames: Array<string | undefined>) {
  return classNames.filter(Boolean).join(' ')
}

export function Button({
  variant = 'primary',
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  const baseClassName =
    'h-11 rounded-lg px-4 cursor-pointer [font-family:var(--font-body)] text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-70'

  const variantClassName =
    variant === 'ghost'
      ? 'bg-transparent text-(--color-secondary) hover:text-(--color-foreground)'
      : 'bg-(--color-primary) text-(--color-background) hover:bg-(--color-muted)'

  return (
    <button
      type={type}
      data-variant={variant}
      className={joinClasses(baseClassName, variantClassName, className)}
      {...props}
    />
  )
}
