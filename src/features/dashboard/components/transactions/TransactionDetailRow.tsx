import type { ReactNode } from 'react'

type TransactionDetailRowProps = {
  label: string
  children: ReactNode
}

/** Label / value row — matches transaction detail modal layout app-wide. */
export function TransactionDetailRow({ label, children }: TransactionDetailRowProps) {
  return (
    <div className="border-b border-[#E8E4DE] py-3.5 last:border-b-0">
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <span className="shrink-0 pt-0.5 [font-family:var(--font-body)] text-[11px] font-semibold uppercase tracking-[0.08em] text-[#566167]">
          {label}
        </span>
        <div className="min-w-0 flex-1 text-left [font-family:var(--font-body)] text-sm leading-snug text-[#0F0700] sm:text-right">
          {children}
        </div>
      </div>
    </div>
  )
}
