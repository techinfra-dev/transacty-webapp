interface DashboardStatCardProps {
  title: string
  value: string
  note: string
}

export function DashboardStatCard({ title, value, note }: DashboardStatCardProps) {
  return (
    <article className="rounded-xl border border-(--color-accent)/45 bg-(--color-card) p-3 md:p-4">
      <p className="[font-family:var(--font-body)] text-[11px] text-(--color-secondary) md:text-xs">
        {title}
      </p>
      <p className="mt-1.5 wrap-break-word [font-family:var(--font-display)] text-[1.1rem] font-semibold leading-tight text-(--color-foreground) md:mt-2 md:text-2xl">
        {value}
      </p>
      <p className="mt-1 [font-family:var(--font-body)] text-[11px] text-(--color-secondary) md:text-xs">
        {note}
      </p>
    </article>
  )
}
