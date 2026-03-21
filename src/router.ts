import { createRouter } from '@tanstack/react-router'
import { Route as rootRoute } from './routes/__root.tsx'
import { Route as indexRoute } from './routes/index.tsx'
import { Route as authRoute } from './routes/auth.tsx'
import { Route as loginRoute } from './routes/login.tsx'
import { Route as signupRoute } from './routes/signup.tsx'
import { Route as forgotPasswordRoute } from './routes/forgot-password.tsx'
import { Route as resetPasswordRoute } from './routes/reset-password.tsx'
import { Route as dashboardRoute } from './routes/dashboard.tsx'
import { Route as dashboardIndexRoute } from './routes/dashboard.index.tsx'
import { Route as dashboardTransactionsRoute } from './routes/dashboard.transactions.tsx'
import { Route as dashboardCustomersRoute } from './routes/dashboard.customers.tsx'
import { Route as dashboardPayoutsRoute } from './routes/dashboard.payouts.tsx'
import { Route as dashboardSettingsRoute } from './routes/dashboard.settings.tsx'

const dashboardRouteTree = dashboardRoute.addChildren([
  dashboardIndexRoute,
  dashboardTransactionsRoute,
  dashboardCustomersRoute,
  dashboardPayoutsRoute,
  dashboardSettingsRoute,
])

const authRouteTree = authRoute.addChildren([
  loginRoute,
  signupRoute,
  forgotPasswordRoute,
  resetPasswordRoute,
])

const routeTree = rootRoute.addChildren([
  indexRoute,
  authRouteTree,
  dashboardRouteTree,
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
