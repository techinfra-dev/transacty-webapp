import { createRoute, lazyRouteComponent } from '@tanstack/react-router'
import { Route as authRoute } from './auth.tsx'

export const Route = createRoute({
  getParentRoute: () => authRoute,
  path: 'signup',
  component: lazyRouteComponent(
    () => import('../features/auth/pages/SignUpPage.tsx'),
    'SignUpPage',
  ),
})
