export type DashboardStatIcon = 'wallet' | 'check' | 'clock' | 'bank'

interface DashboardStatCardProps {
  title: string
  value: string
  note: string
  icon: DashboardStatIcon
}

function StatIcon({ name }: { name: DashboardStatIcon }) {
  const stroke = '#000000'
  const common = 'h-5 w-5 shrink-0'
  switch (name) {
    case 'wallet':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden>
          <path
            d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Z"
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M16 12h2M18 10v4"
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      )
    case 'check':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden>
          <circle cx="12" cy="12" r="9" stroke={stroke} strokeWidth="1.5" />
          <path
            d="M8 12.5 10.5 15 16 9"
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
    case 'clock':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden>
          <circle cx="12" cy="12" r="9" stroke={stroke} strokeWidth="1.5" />
          <path
            d="M12 7v5l3 2"
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
    case 'bank':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden>
          <path
            d="M4 10V8l8-4 8 4v2M6 10v8M10 10v8M14 10v8M18 10v8M4 18h16"
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
    default:
      return null
  }
}

export function DashboardStatCard({
  title,
  value,
  note,
  icon,
}: DashboardStatCardProps) {
  return (
    <article className="rounded-sm border border-[#E5E0D6] border-b-[3px] border-b-[#A89888] bg-[#EFEBE3] p-4 shadow-[0_1px_2px_rgba(15,7,0,0.04)]">
      <div className="flex flex-col gap-2">
        <div className="flex shrink-0 justify-start">
          <StatIcon name={icon} />
        </div>
        <div className="min-w-0">
          <p className="[font-family:var(--font-body)] text-[11px] font-medium text-black md:text-xs">
            {title}
          </p>
          <p className="mt-1.5 wrap-break-word [font-family:var(--font-display)] text-base font-semibold leading-tight text-black md:text-lg">
            {value}
          </p>
          <p className="mt-1 line-clamp-2 [font-family:var(--font-body)] text-[11px] text-black md:text-xs">
            {note}
          </p>
        </div>
      </div>
    </article>
  )
}
