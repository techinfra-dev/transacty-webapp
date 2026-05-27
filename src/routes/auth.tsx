import { Outlet, createRoute, useRouterState } from '@tanstack/react-router'
import { ThemeToggle } from '../components/ui/ThemeToggle.tsx'
import { useBrandLogoPath } from '../theme/useBrandLogo.ts'
import { Route as rootRoute } from './__root.tsx'

function resolveAuthHeading(pathname: string) {
  if (pathname === '/signup') {
    return {
      title: 'Create account',
      subtitle: 'Set up your account',
    }
  }
  if (pathname === '/forgot-password') {
    return {
      title: 'Forgot password',
      subtitle: 'Enter your email to receive a reset link',
    }
  }
  if (pathname === '/reset-password') {
    return {
      title: 'Reset password',
      subtitle: 'Choose a new password for your account',
    }
  }
  return {
    title: 'Sign in',
    subtitle: 'Login to your account',
  }
}

function AuthRouteLayout() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const { title, subtitle } = resolveAuthHeading(pathname)
  const logoSrc = useBrandLogoPath()

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

        <div className="flex h-full min-h-0 flex-col overflow-y-auto bg-(--auth-content-bg)">
          <header className="flex shrink-0 items-center justify-between gap-3 border-b border-(--auth-header-border) px-5 py-3 md:px-6">
            <img
              src={logoSrc}
              alt="Transacty"
              width={220}
              height={48}
              className="h-8 w-auto max-w-[140px] object-contain object-left md:h-9 md:max-w-[160px]"
              decoding="async"
            />
            <ThemeToggle />
          </header>
          <div className="flex min-h-0 flex-1 items-center justify-center px-5 py-6 md:px-8 md:py-8">
            <div className="auth-split-surface auth-form-enter w-full max-w-[400px] space-y-4 rounded-xl border border-(--auth-surface-border) bg-(--auth-surface-bg) p-5 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.18)] md:p-6">
              <header className="space-y-0.5">
                <p className="[font-family:var(--font-display)] text-2xl font-semibold tracking-tight text-(--auth-surface-text)">
                  {title}
                </p>
                <p className="[font-family:var(--font-body)] text-sm text-(--auth-surface-muted)">
                  {subtitle}
                </p>
              </header>
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  id: 'auth',
  component: AuthRouteLayout,
})
