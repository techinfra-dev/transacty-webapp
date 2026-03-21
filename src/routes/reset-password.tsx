import { createRoute } from '@tanstack/react-router'
import { ResetPasswordPage } from '../features/auth/pages/ResetPasswordPage.tsx'
import { Route as authRoute } from './auth.tsx'

export const Route = createRoute({
  getParentRoute: () => authRoute,
  path: 'reset-password',
  component: ResetPasswordPage,
})
