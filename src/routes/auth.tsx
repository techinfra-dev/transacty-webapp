import { Outlet, createRoute, useRouterState } from '@tanstack/react-router'
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

        <div className="relative h-full overflow-y-auto bg-[#ffffff]">
          <img
            src="/TRANSACTY-LOGO-OBSIDIAN-BROWN.png"
            alt="Transacty"
            width={352}
            height={80}
            className="absolute left-2 top-2 z-10 block h-16 w-auto max-w-[min(90%,440px)] object-contain object-left pointer-events-none md:h-20"
            decoding="async"
          />
          <div className="flex min-h-full items-center justify-center px-6 py-8 md:px-10">
            <div className="auth-split-surface auth-form-enter w-full max-w-[400px] space-y-4 rounded-xl border border-[#2d3237]/12 bg-[#f9f8f4] p-5 shadow-[0_8px_30px_-12px_rgba(45,50,55,0.18)] md:p-6">
              <header className="space-y-0.5">
                <p className="[font-family:var(--font-display)] text-2xl font-semibold tracking-tight text-[#2d3237]">
                  {title}
                </p>
                <p className="[font-family:var(--font-body)] text-sm text-[#566167]">
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
