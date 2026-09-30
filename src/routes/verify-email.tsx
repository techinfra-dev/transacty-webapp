import { createRoute, lazyRouteComponent } from '@tanstack/react-router'
import { Route as authRoute } from './auth.tsx'

export const Route = createRoute({
  getParentRoute: () => authRoute,
  path: 'verify-email',
  validateSearch: (search: Record<string, unknown>): { token?: string } => {
    const token = typeof search.token === 'string' ? search.token : undefined
    return token ? { token } : {}
  },
  component: lazyRouteComponent(
    () => import('../features/auth/pages/VerifyEmailPage.tsx'),
    'VerifyEmailPage',
  ),
})
