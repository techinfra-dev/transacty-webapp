import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, Outlet, useNavigate } from '@tanstack/react-router'
import { Button } from '../components/ui/Button.tsx'
import { Dialog } from '../components/ui/Dialog.tsx'
import { TestModeBanner } from '../components/ui/TestModeBanner.tsx'
import { logout } from '../features/auth/services/authService.ts'
import { useProfileQuery } from '../features/dashboard/hooks/useProfileQuery.ts'
import { KycActivationModal } from '../features/kyc/components/KycActivationModal.tsx'
import { useKycDialogStore } from '../store/kycDialogStore.ts'
import {
  clearAuthSession,
  getAuthUser,
  subscribeToAuthSessionUpdates,
} from '../features/auth/services/authSession.ts'
import {
  hydratePortalEnvironmentForUser,
  usePortalEnvironmentStore,
} from '../store/portalEnvironmentStore.ts'
import type { PortalEnvironment } from '../types/portalEnvironment.ts'
import { useInactivityLogout } from '../hooks/useInactivityLogout.ts'
import { invalidatePortalQueries } from '../utils/invalidatePortalQueries.ts'

interface MenuItem {
  label: string
  to:
    | '/dashboard'
    | '/dashboard/transactions'
    | '/dashboard/customers'
    | '/dashboard/payouts'
    | '/dashboard/settings'
}

interface MenuSection {
  title: string
  items: MenuItem[]
}

function PortalEnvironmentSegmentedControl({
  portalEnvironment,
  onRequestEnvironment,
  className,
}: {
  portalEnvironment: PortalEnvironment
  onRequestEnvironment: (next: PortalEnvironment) => void
  className?: string
}) {
  return (
    <div
      className={className}
      role="group"
      aria-label="Portal environment"
    >
      <p className="mb-1.5 px-1 [font-family:var(--font-body)] text-xs uppercase tracking-wide text-(--color-background)/60">
        Environment
      </p>
      <div className="grid grid-cols-2 gap-1 rounded-lg border border-(--color-background)/20 p-1">
        <button
          type="button"
          onClick={() => onRequestEnvironment('test')}
          className={`rounded-md px-2 py-2 [font-family:var(--font-body)] text-xs font-semibold transition ${
            portalEnvironment === 'test'
              ? 'bg-(--color-background) text-[#35383F]'
              : 'text-(--color-background)/80 hover:bg-(--color-background)/10'
          }`}
        >
          Test
        </button>
        <button
          type="button"
          onClick={() => onRequestEnvironment('live')}
          className={`rounded-md px-2 py-2 [font-family:var(--font-body)] text-xs font-semibold transition ${
            portalEnvironment === 'live'
              ? 'bg-(--color-background) text-[#35383F]'
              : 'text-(--color-background)/80 hover:bg-(--color-background)/10'
          }`}
        >
          Live
        </button>
      </div>
    </div>
  )
}

const menuSections: MenuSection[] = [
  {
    title: 'Overview',
    items: [{ label: 'Dashboard', to: '/dashboard' }],
  },
  {
    title: 'Payments',
    items: [
      { label: 'Transactions', to: '/dashboard/transactions' },
      { label: 'Payouts', to: '/dashboard/payouts' },
    ],
  },
  {
    title: 'Customers',
    items: [{ label: 'Customers', to: '/dashboard/customers' }],
  },
  {
    title: 'Settings',
    items: [{ label: 'Settings', to: '/dashboard/settings' }],
  },
]

function SidebarItemIcon({
  to,
}: {
  to:
    | '/dashboard'
    | '/dashboard/transactions'
    | '/dashboard/customers'
    | '/dashboard/payouts'
    | '/dashboard/settings'
}) {
  if (to === '/dashboard') {
    return (
      <svg viewBox="0 0 20 20" className="h-4 w-4 fill-current" aria-hidden="true">
        <path d="M3.5 3.5a1 1 0 0 1 1-1h4.5a1 1 0 0 1 1 1V8a1 1 0 0 1-1 1H4.5a1 1 0 0 1-1-1V3.5Zm0 8.5a1 1 0 0 1 1-1h4.5a1 1 0 0 1 1 1v4.5a1 1 0 0 1-1 1H4.5a1 1 0 0 1-1-1V12Zm7.5-8.5a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1V8a1 1 0 0 1-1 1H12.5a1 1 0 0 1-1-1V3.5Zm0 8.5a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1v4.5a1 1 0 0 1-1 1H12.5a1 1 0 0 1-1-1V12Z" />
      </svg>
    )
  }
  if (to === '/dashboard/transactions') {
    return (
      <svg viewBox="0 0 20 20" className="h-4 w-4 fill-current" aria-hidden="true">
        <path d="M4 3.25a1.25 1.25 0 0 0-1.25 1.25v11A1.25 1.25 0 0 0 4 16.75h12a1.25 1.25 0 0 0 1.25-1.25v-11A1.25 1.25 0 0 0 16 3.25H4Zm.75 3a.75.75 0 0 1 .75-.75h9a.75.75 0 0 1 0 1.5h-9a.75.75 0 0 1-.75-.75Zm0 3.75a.75.75 0 0 1 .75-.75h9a.75.75 0 0 1 0 1.5h-9a.75.75 0 0 1-.75-.75Zm.75 3h4.25a.75.75 0 0 1 0 1.5H5.5a.75.75 0 0 1 0-1.5Z" />
      </svg>
    )
  }
  if (to === '/dashboard/payouts') {
    return (
      <svg viewBox="0 0 20 20" className="h-4 w-4 fill-current" aria-hidden="true">
        <path d="M2.75 5A1.25 1.25 0 0 1 4 3.75h12A1.25 1.25 0 0 1 17.25 5v10A1.25 1.25 0 0 1 16 16.25H4A1.25 1.25 0 0 1 2.75 15V5Zm4.5 5a2.75 2.75 0 1 0 5.5 0 2.75 2.75 0 0 0-5.5 0ZM4.5 7.25a.75.75 0 0 0 0 1.5h.75a.75.75 0 0 0 0-1.5H4.5Zm10.25 3.5a.75.75 0 0 0 0 1.5h.75a.75.75 0 0 0 0-1.5h-.75Z" />
      </svg>
    )
  }
  if (to === '/dashboard/customers') {
    return (
      <svg viewBox="0 0 20 20" className="h-4 w-4 fill-current" aria-hidden="true">
        <path d="M10 2.75a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7ZM4.25 14a4.75 4.75 0 1 1 9.5 0v1.25a.75.75 0 0 1-.75.75H5a.75.75 0 0 1-.75-.75V14Zm10.76 1.98a.75.75 0 0 1-.02-1.06A2.85 2.85 0 0 0 15.75 13a2.84 2.84 0 0 0-.76-1.92.75.75 0 1 1 1.08-1.04A4.34 4.34 0 0 1 17.25 13c0 1.1-.41 2.1-1.18 2.98a.75.75 0 0 1-1.06.01Z" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4 fill-current" aria-hidden="true">
      <path d="M7.25 2.75a.75.75 0 0 1 .75.75v1.1a4.91 4.91 0 0 1 4 0V3.5a.75.75 0 0 1 1.5 0v1.99a4.99 4.99 0 0 1 1 1l1.99-.01a.75.75 0 0 1 0 1.5H15.4a4.91 4.91 0 0 1 0 4h1.1a.75.75 0 0 1 0 1.5h-1.99a4.99 4.99 0 0 1-1 1V16.5a.75.75 0 0 1-1.5 0v-1.1a4.91 4.91 0 0 1-4 0v1.1a.75.75 0 0 1-1.5 0v-2a4.99 4.99 0 0 1-1-1H3.5a.75.75 0 0 1 0-1.5h1.1a4.91 4.91 0 0 1 0-4H3.5a.75.75 0 0 1 0-1.5h2a4.99 4.99 0 0 1 1-1V3.5a.75.75 0 0 1 .75-.75ZM10 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
    </svg>
  )
}

export function DashboardLayout() {
  const queryClient = useQueryClient()
  const portalEnvironment = usePortalEnvironmentStore((state) => state.environment)
  const setPortalEnvironment = usePortalEnvironmentStore(
    (state) => state.setEnvironment,
  )
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isLiveSwitchConfirmOpen, setIsLiveSwitchConfirmOpen] = useState(false)
  const [pendingEnvironment, setPendingEnvironment] =
    useState<PortalEnvironment | null>(null)
  const [authUser, setAuthUser] = useState(() => getAuthUser())
  const isKycModalOpen = useKycDialogStore((state) => state.isOpen)
  const openKycDialog = useKycDialogStore((state) => state.openDialog)
  const closeKycDialog = useKycDialogStore((state) => state.closeDialog)
  const navigate = useNavigate()
  const profileQuery = useProfileQuery(Boolean(authUser))
  const hasSubmittedBusinessProfile =
    profileQuery.data?.businessProfile?.status === 'submitted'
  const isKycPending = profileQuery.data?.kycStatus === 'pending'
  const isKycVerified = profileQuery.data?.kycStatus === 'verified'
  const isBusinessVerified = profileQuery.data?.businessProfile?.status === 'verified'
  const isFullyVerified = isKycVerified && isBusinessVerified
  const showKycPendingBanner =
    !isFullyVerified && hasSubmittedBusinessProfile && isKycPending
  const showActivationBanner =
    !isFullyVerified && !showKycPendingBanner && authUser?.needsActivation

  useEffect(() => {
    const unsubscribe = subscribeToAuthSessionUpdates(() => {
      setAuthUser(getAuthUser())
    })
    return unsubscribe
  }, [])

  useLayoutEffect(() => {
    hydratePortalEnvironmentForUser(authUser?.merchantId ?? null)
  }, [authUser?.merchantId])

  function requestPortalEnvironment(next: PortalEnvironment) {
    if (next === 'live' && portalEnvironment === 'test') {
      setPendingEnvironment('live')
      setIsLiveSwitchConfirmOpen(true)
      return
    }
    void applyPortalEnvironment(next)
  }

  async function applyPortalEnvironment(next: PortalEnvironment) {
    setIsLiveSwitchConfirmOpen(false)
    setPendingEnvironment(null)
    setPortalEnvironment(next)
    await invalidatePortalQueries(queryClient)
  }

  const handleLogout = async () => {
    if (isLoggingOut) {
      return
    }

    setIsLoggingOut(true)
    try {
      await logout()
    } catch {
      // Clear local session even if server-side logout fails.
    } finally {
      clearAuthSession()
      await navigate({ to: '/login' })
      setIsLoggingOut(false)
    }
  }

  const handleLogoutRef = useRef(handleLogout)
  handleLogoutRef.current = handleLogout

  const {
    isWarningOpen: isInactivityLogoutWarningOpen,
    secondsLeft: inactivitySecondsLeft,
    cancelWarning: cancelInactivityLogout,
  } = useInactivityLogout({
    enabled: Boolean(authUser) && !isLoggingOut,
    onLogout: () => void handleLogoutRef.current(),
  })

  return (
    <section className="h-screen bg-(--color-background)">
      <div className="grid h-full lg:grid-cols-[260px_1fr]">
        <aside className="hidden h-full border-r border-(--color-accent)/35 bg-[#35383F] text-(--color-background) lg:block">
          <div className="flex h-full flex-col p-5">
            <Link
              to="/dashboard"
              aria-label="Go to dashboard home"
              className="mb-3 inline-flex max-w-full shrink-0 rounded-md outline-none transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-(--color-background)/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#35383F]"
            >
              <img
                src="/TRENSACTY-LOGO-IVORY-DUST.png"
                alt="Transacty"
                width={220}
                height={48}
                className="h-9 w-auto max-w-full object-contain object-left md:h-10"
                decoding="async"
              />
            </Link>

            <nav className="mt-6 space-y-5">
              {menuSections.map((section) => (
                <div key={section.title} className="space-y-1.5">
                  <p className="[font-family:var(--font-body)] px-1 text-xs uppercase tracking-wide text-(--color-background)/60">
                    {section.title}
                  </p>
                  <div className="space-y-1">
                    {section.items.map((item) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        activeOptions={{ exact: item.to === '/dashboard' }}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 [font-family:var(--font-body)] text-sm text-(--color-background)/85 transition hover:bg-(--color-background)/12"
                        activeProps={{
                          className:
                            'bg-(--color-background)/20 font-semibold text-(--color-background)',
                        }}
                      >
                        <span className="inline-flex h-4 w-4 items-center justify-center text-(--color-background)/85">
                          <SidebarItemIcon to={item.to} />
                        </span>
                        <span>{item.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </nav>

            <div className="mt-auto flex flex-col gap-3 pt-5">
              <PortalEnvironmentSegmentedControl
                portalEnvironment={portalEnvironment}
                onRequestEnvironment={requestPortalEnvironment}
              />
              <Button
                variant="ghost"
                className="w-full border border-(--color-background)/25 text-(--color-background)! hover:bg-(--color-background)/12 hover:text-(--color-background)!"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-(--color-background)/40 border-t-(--color-background)" />
                    Logging out...
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <svg
                      viewBox="0 0 20 20"
                      className="h-4 w-4 fill-current"
                      aria-hidden="true"
                    >
                      <path d="M8.75 3.5a.75.75 0 0 1 .75-.75h4A2.75 2.75 0 0 1 16.25 5.5v9A2.75 2.75 0 0 1 13.5 17.25h-4a.75.75 0 0 1 0-1.5h4a1.25 1.25 0 0 0 1.25-1.25v-9A1.25 1.25 0 0 0 13.5 4.25h-4a.75.75 0 0 1-.75-.75Zm.72 3.22a.75.75 0 0 1 1.06 0l2.75 2.75a.75.75 0 0 1 0 1.06l-2.75 2.75a.75.75 0 0 1-1.06-1.06l1.47-1.47H4.5a.75.75 0 0 1 0-1.5h6.44L9.47 7.78a.75.75 0 0 1 0-1.06Z" />
                    </svg>
                    Logout
                  </span>
                )}
              </Button>
            </div>
          </div>
        </aside>

        <main
          className={`h-full min-h-0 overflow-y-auto bg-white p-5 md:p-8 ${portalEnvironment === 'test' ? 'pb-28' : ''}`}
        >
          {showKycPendingBanner ? (
            <section className="mb-4 border border-(--color-accent)/40 bg-(--color-primary) px-4 py-2.5">
              <div className="flex flex-col items-center justify-center gap-y-0.5 [font-family:var(--font-body)] text-[13px] text-(--color-background)/88">
                <span className="inline-flex items-center gap-1 font-semibold text-(--color-background)">
                  <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 fill-amber-400" aria-hidden="true">
                    <path d="M10 2.5a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15Zm0 2.75a.75.75 0 0 1 .75.75v4a.75.75 0 0 1-1.5 0V6a.75.75 0 0 1 .75-.75Zm0 8.25a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z" />
                  </svg>
                  KYC pending verification
                </span>
                <div className="text-center">
                  Your business profile has been submitted and is currently under
                  compliance review.
                </div>
              </div>
            </section>
          ) : showActivationBanner ? (
            <section className="mb-4 border border-(--color-accent)/40 bg-(--color-primary) px-4 py-2.5">
              <div className="flex flex-col items-center justify-center gap-y-0.5 [font-family:var(--font-body)] text-[13px] text-(--color-background)/88">
                <span className="inline-flex items-center gap-1 font-semibold text-(--color-background)">
                  <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 fill-amber-400" aria-hidden="true">
                    <path d="M10 2.5a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15Zm0 2.75a.75.75 0 0 1 .75.75v4a.75.75 0 0 1-1.5 0V6a.75.75 0 0 1 .75-.75Zm0 8.25a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z" />
                  </svg>
                  Urgent: Submit Additional Information
                </span>
                <div className="text-center">
                  <span>
                    To keep your account active, you need to provide additional
                    business information.
                  </span>{' '}
                  <button
                    type="button"
                    className="cursor-pointer font-semibold text-(--color-background) underline underline-offset-2"
                    onClick={openKycDialog}
                  >
                    Continue
                  </button>
                </div>
              </div>
            </section>
          ) : null}
          <Outlet />
        </main>
      </div>
      {authUser ? (
        <KycActivationModal
          isOpen={isKycModalOpen}
          merchantId={authUser.merchantId}
          onClose={closeKycDialog}
        />
      ) : null}

      {portalEnvironment === 'test' ? <TestModeBanner /> : null}

      <Dialog
        isOpen={isInactivityLogoutWarningOpen}
        onClose={cancelInactivityLogout}
        title="Logging out"
        description={`You have been inactive. Signing out in ${inactivitySecondsLeft} second${inactivitySecondsLeft === 1 ? '' : 's'} for your security.`}
        maxWidthClassName="max-w-md"
        showCloseButton={false}
        closeOnBackdrop={false}
        footer={
          <div className="dialog-action-row flex justify-end">
            <Button
              type="button"
              variant="ghost"
              className="h-10 px-4 text-xs"
              onClick={cancelInactivityLogout}
            >
              Stay signed in
            </Button>
          </div>
        }
      />

      <Dialog
        isOpen={isLiveSwitchConfirmOpen}
        onClose={() => {
          setIsLiveSwitchConfirmOpen(false)
          setPendingEnvironment(null)
        }}
        title="Switch to live environment?"
        description="The dashboard will load production data: live balances, customers, and transactions. You can switch back to test anytime."
        maxWidthClassName="max-w-md"
        footer={
          <div className="dialog-action-row grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="ghost"
              className="h-10 w-full px-3 text-xs"
              onClick={() => {
                setIsLiveSwitchConfirmOpen(false)
                setPendingEnvironment(null)
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="h-10 w-full px-3 text-xs"
              onClick={() => {
                if (pendingEnvironment === 'live') {
                  void applyPortalEnvironment('live')
                }
              }}
            >
              Use live data
            </Button>
          </div>
        }
      />
    </section>
  )
}
