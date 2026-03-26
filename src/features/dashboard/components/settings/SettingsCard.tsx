import type { ReactNode } from 'react'

interface SettingsCardProps {
  title: string
  children: ReactNode
  className?: string
}

export function SettingsCard({ title, children, className }: SettingsCardProps) {
  return (
    <div
      className={`overflow-hidden rounded-lg border border-[#E0DCD6] bg-white shadow-[0_1px_2px_rgba(15,7,0,0.04)] ${className ?? ''}`}
    >
      <div className="border-b border-[#E8DCC8] bg-[#F3E8D6] px-4 py-2.5">
        <h3 className="[font-family:var(--font-display)] text-sm font-semibold tracking-tight text-[#0F0700]">
          {title}
        </h3>
      </div>
      <div className="space-y-4 p-4 md:p-5">{children}</div>
    </div>
  )
}
