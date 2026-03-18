import { createRoute } from '@tanstack/react-router'
import { LoginPage } from '../features/auth/pages/LoginPage.tsx'
import { Route as authRoute } from './auth.tsx'

export const Route = createRoute({
  getParentRoute: () => authRoute,
  path: 'login',
  component: LoginPage,
})
