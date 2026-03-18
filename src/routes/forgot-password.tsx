import { createRoute } from '@tanstack/react-router'
import { ForgotPasswordPage } from '../features/auth/pages/ForgotPasswordPage.tsx'
import { Route as authRoute } from './auth.tsx'

export const Route = createRoute({
  getParentRoute: () => authRoute,
  path: 'forgot-password',
  component: ForgotPasswordPage,
})
