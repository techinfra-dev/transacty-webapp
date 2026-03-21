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
    <section className="h-screen w-full overflow-hidden">
      <div className="grid h-full w-full md:grid-cols-[2fr_3fr]">
        <aside className="relative hidden md:block">
          <div className="absolute inset-0 bg-linear-to-br from-(--color-primary) via-(--color-muted) to-(--color-secondary)" />
          <div className="absolute inset-0 bg-(--color-background)/10" />
          <div className="relative flex h-full flex-col justify-end p-12 text-(--color-background)">
            <p className="[font-family:var(--font-display)] text-4xl font-semibold leading-tight">
              Welcome back
            </p>
            <p className="mt-3 max-w-md [font-family:var(--font-body)] text-sm text-(--color-background)">
              Manage collections, payouts, and transactions from one secure
              workspace.
            </p>
          </div>
        </aside>

        <div className="flex h-full items-center justify-center bg-(--color-background) px-6 py-6">
          <div className="auth-form-enter w-full max-w-[460px] space-y-5 rounded-2xl border border-(--color-accent)/45 bg-(--color-card) p-6 md:p-8">
            <div className="space-y-1">
              <p className="[font-family:var(--font-display)] text-3xl font-semibold text-(--color-foreground)">
                {title}
              </p>
              <p className="[font-family:var(--font-body)] text-sm text-(--color-secondary)">
                {subtitle}
              </p>
            </div>
            <Outlet />
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
