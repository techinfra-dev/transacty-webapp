import { createRoute, lazyRouteComponent } from '@tanstack/react-router'
import { Route as authRoute } from './auth.tsx'

export const Route = createRoute({
  getParentRoute: () => authRoute,
  path: 'login',
  component: lazyRouteComponent(
    () => import('../features/auth/pages/LoginPage.tsx'),
    'LoginPage',
  ),
})
