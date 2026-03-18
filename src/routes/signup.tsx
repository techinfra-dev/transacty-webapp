import { createRoute } from '@tanstack/react-router'
import { SignUpPage } from '../features/auth/pages/SignUpPage.tsx'
import { Route as authRoute } from './auth.tsx'

export const Route = createRoute({
  getParentRoute: () => authRoute,
  path: 'signup',
  component: SignUpPage,
})
