import type { ReactNode } from 'react'

interface AuthSplitLayoutProps {
  title: string
  subtitle: string
  children: ReactNode
}

export function AuthSplitLayout({
  title,
  subtitle,
  children,
}: AuthSplitLayoutProps) {
  return (
    <section className="auth-split h-screen w-full overflow-hidden">
      <div className="grid h-full w-full md:grid-cols-[40fr_60fr]">
        <aside className="relative hidden min-h-0 overflow-hidden md:flex md:flex-col">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: "url('/login-image.png')" }}
          />
          <div className="relative z-10 flex min-h-0 flex-1 flex-col items-start justify-end space-y-3 px-8 pb-12 pt-8 text-left text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
            <p className="auth-banner-enter [font-family:var(--font-display)] text-4xl font-semibold leading-tight tracking-tight">
              Welcome back
            </p>
            <p className="auth-banner-enter max-w-md [font-family:var(--font-body)] text-sm leading-relaxed text-white/95">
              Manage your collections, payouts, and transactions from one
              secure workspace.
            </p>
          </div>
        </aside>

        <div className="flex h-full min-h-0 flex-col overflow-y-auto bg-[#ffffff]">
          <header className="flex shrink-0 items-center border-b border-[#E8E8E8] px-5 py-3 md:px-6">
            <img
              src="/TRANSACTY-LOGO-OBSIDIAN-BROWN.png"
              alt="Transacty"
              width={220}
              height={48}
              className="h-8 w-auto max-w-[140px] object-contain object-left md:h-9 md:max-w-[160px]"
              decoding="async"
            />
          </header>
          <div className="flex min-h-0 flex-1 items-center justify-center px-5 py-6 md:px-8 md:py-8">
            <div className="auth-split-surface auth-form-enter w-full max-w-[400px] space-y-4 rounded-xl border border-[#2d3237]/12 bg-[#f9f8f4] p-5 shadow-[0_8px_30px_-12px_rgba(45,50,55,0.18)] md:p-6">
              <header className="space-y-0.5">
                <p className="[font-family:var(--font-display)] text-2xl font-semibold tracking-tight text-[#2d3237]">
                  {title}
                </p>
                <p className="[font-family:var(--font-body)] text-sm text-[#566167]">
                  {subtitle}
                </p>
              </header>
              {children}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
