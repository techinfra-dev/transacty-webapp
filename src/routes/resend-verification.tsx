import { createRoute, lazyRouteComponent } from '@tanstack/react-router'
import { Route as authRoute } from './auth.tsx'

export const Route = createRoute({
  getParentRoute: () => authRoute,
  path: 'resend-verification',
  validateSearch: (
    search: Record<string, unknown>,
  ): { email?: string; sent?: '1'; expired?: '1' } => {
    return {
      email: typeof search.email === 'string' ? search.email : undefined,
      sent: search.sent === '1' ? '1' : undefined,
      expired: search.expired === '1' ? '1' : undefined,
    }
  },
  component: lazyRouteComponent(
    () => import('../features/auth/pages/ResendVerificationPage.tsx'),
    'ResendVerificationPage',
  ),
})
