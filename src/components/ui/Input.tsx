import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

function joinClasses(...classNames: Array<string | undefined>) {
  return classNames.filter(Boolean).join(' ')
}

export function Input({ className, ...props }: InputProps) {
  const baseClassName =
    'h-11 w-full rounded-lg border border-(--color-accent) bg-(--color-background)/35 px-3 [font-family:var(--font-body)] text-sm outline-none transition focus:border-(--color-secondary) focus:ring-2 focus:ring-(--color-secondary)/20'

  return <input className={joinClasses(baseClassName, className)} {...props} />
}
