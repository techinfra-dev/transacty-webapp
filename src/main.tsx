import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { applyColorScheme, readStoredColorScheme } from './theme/applyTheme.ts'
import './index.css'
import { registerPortalSecurityInterceptor } from './api/portalSecurityInterceptor.ts'
import { router } from './router.ts'

applyColorScheme(readStoredColorScheme())

registerPortalSecurityInterceptor({
  onMfaSetupRequired: () => {
    void router.navigate({
      to: '/dashboard/settings',
      search: { tab: 'security' },
    })
  },
  onPayoutPinSetupRequired: (adminRequired) => {
    const pathname = router.state.location.pathname
    if (
      pathname.includes('/onboarding/') ||
      pathname.includes('reset-payout-pin') ||
      pathname.includes('forgot-payout-pin')
    ) {
      return
    }
    void router.navigate({
      to: adminRequired
        ? '/dashboard/onboarding/waiting-for-admin'
        : '/dashboard/onboarding/payout-pin',
    })
  },
  onSessionExpired: () => {
    void router.navigate({ to: '/login' })
  },
})

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)
