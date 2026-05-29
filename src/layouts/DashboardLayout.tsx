import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, Outlet, useNavigate, useRouterState } from '@tanstack/react-router'
import { Button } from '../components/ui/Button.tsx'
import { Dialog } from '../components/ui/Dialog.tsx'
import { TestModeBanner } from '../components/ui/TestModeBanner.tsx'
import { TransactionDetailDialog } from '../features/dashboard/components/transactions/TransactionDetailDialog.tsx'
import { useTransactionDetailQuery } from '../features/dashboard/hooks/useTransactionsQueries.ts'
import { logout } from '../features/auth/services/authService.ts'
import { useProfileQuery } from '../features/dashboard/hooks/useProfileQuery.ts'
import { KycActivationModal } from '../features/kyc/components/KycActivationModal.tsx'
import { useKycDialogStore } from '../store/kycDialogStore.ts'
import { useTransactionDetailModalStore } from '../store/transactionDetailModalStore.ts'
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
import { DashboardOutletHeader } from '../components/layout/DashboardOutletHeader.tsx'
import { LogoutIcon, SidebarItemIcon } from '../components/layout/SidebarItemIcon.tsx'

interface MenuItem {
  label: string
  to:
    | '/dashboard'
    | '/dashboard/wallets'
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
  isKycVerified,
  className,
}: {
  portalEnvironment: PortalEnvironment
  onRequestEnvironment: (next: PortalEnvironment) => void
  isKycVerified: boolean
  className?: string
}) {
  const liveSwitchBlocked = !isKycVerified && portalEnvironment !== 'live'
  return (
    <div
      className={className}
      role="group"
      aria-label="Portal environment"
    >
      <p className="mb-1 px-1 [font-family:var(--font-body)] text-[9.5px] font-semibold uppercase tracking-[0.12em] text-(--sidebar-section)">
        Environment
      </p>
      <div className="grid grid-cols-2 gap-1 rounded-lg border border-(--sidebar-border) bg-(--sidebar-segment-inactive) p-0.5">
        <button
          type="button"
          onClick={() => onRequestEnvironment('test')}
          className={`rounded-md px-2 py-1.5 [font-family:var(--font-body)] text-[11.5px] font-semibold transition-colors ${
            portalEnvironment === 'test'
              ? 'bg-(--sidebar-segment-active-bg) text-(--sidebar-segment-active-text)'
              : 'bg-transparent text-(--sidebar-segment-inactive-text) hover:bg-(--sidebar-segment-hover)'
          }`}
        >
          Test
        </button>
        <button
          type="button"
          title={
            liveSwitchBlocked
              ? 'Complete KYC verification to use the live environment'
              : undefined
          }
          disabled={liveSwitchBlocked}
          onClick={() => onRequestEnvironment('live')}
          className={`rounded-md px-2 py-1.5 [font-family:var(--font-body)] text-[11px] font-semibold transition-colors ${
            portalEnvironment === 'live'
              ? 'bg-(--sidebar-segment-active-bg) text-(--sidebar-segment-active-text)'
              : 'bg-transparent text-(--sidebar-segment-inactive-text) hover:bg-(--sidebar-segment-hover)'
          } ${liveSwitchBlocked ? 'cursor-not-allowed opacity-45' : ''}`}
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
    items: [
      { label: 'Dashboard', to: '/dashboard' },
      { label: 'Wallets', to: '/dashboard/wallets' },
    ],
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

function isSidebarItemActive(to: MenuItem['to'], pathname: string) {
  if (to === '/dashboard') {
    return pathname === '/dashboard'
  }
  if (to === '/dashboard/wallets') {
    return pathname.startsWith('/dashboard/wallets')
  }
  return pathname === to || pathname.startsWith(`${to}/`)
}

const sidebarNavLinkClass =
  'relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 [font-family:var(--font-body)] text-[12.5px] text-(--sidebar-link) transition-[color,background-color,box-shadow] duration-150'

const sidebarNavLinkActiveClass =
  'bg-(--sidebar-link-active-bg) font-semibold text-(--sidebar-link-active) shadow-[0_1px_4px_rgba(0,0,0,0.14)] ring-1 ring-(--sidebar-link-active-ring)'

const sidebarNavLinkInactiveClass =
  'font-medium hover:bg-(--sidebar-link-hover-bg) hover:text-(--sidebar-link-hover)'

export function DashboardLayout() {
  const queryClient = useQueryClient()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
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
  const selectedTransactionId = useTransactionDetailModalStore(
    (state) => state.selectedTransactionId,
  )
  const closeTransactionDetail = useTransactionDetailModalStore(
    (state) => state.closeTransactionDetail,
  )
  const transactionDetailQuery = useTransactionDetailQuery(selectedTransactionId)

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

  useEffect(() => {
    if (!authUser?.merchantId) {
      return
    }
    if (profileQuery.isPending || profileQuery.isError || !profileQuery.data) {
      return
    }
    if (profileQuery.data.kycStatus === 'verified') {
      return
    }
    if (portalEnvironment !== 'live') {
      return
    }
    setIsLiveSwitchConfirmOpen(false)
    setPendingEnvironment(null)
    setPortalEnvironment('test')
    void invalidatePortalQueries(queryClient)
  }, [
    authUser?.merchantId,
    profileQuery.isPending,
    profileQuery.isError,
    profileQuery.data?.kycStatus,
    portalEnvironment,
    queryClient,
    setPortalEnvironment,
  ])

  function requestPortalEnvironment(next: PortalEnvironment) {
    if (next === 'live' && !isKycVerified) {
      return
    }
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
      <div className="grid h-full lg:grid-cols-[var(--sidebar-width)_1fr]">
        <aside className="hidden h-full w-(--sidebar-width) shrink-0 flex-col border-r border-(--sidebar-border) bg-(--sidebar-bg) lg:flex">
          <header className="flex shrink-0 items-center border-b border-(--sidebar-border) bg-(--sidebar-bg) px-3 py-2.5">
            <Link
              to="/dashboard"
              aria-label="Go to dashboard home"
              className="inline-flex w-full max-w-full shrink-0 items-center justify-center rounded-md bg-[#0F0700] px-2.5 py-2 shadow-[0_2px_6px_rgba(15,7,0,0.18)] ring-1 ring-[#0F0700]/40 outline-none transition hover:bg-[#1a1208] focus-visible:ring-2 focus-visible:ring-(--color-accent)/40 focus-visible:ring-offset-2 focus-visible:ring-offset-(--sidebar-bg)"
            >
              <img
                src="/TRENSACTY-LOGO-IVORY-DUST.png"
                alt="Transacty"
                width={220}
                height={48}
                className="h-7 w-auto max-w-[130px] object-contain object-center"
                decoding="async"
              />
            </Link>
          </header>

          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-2.5 py-4">
            <nav className="space-y-5">
              {menuSections.map((section) => (
                <div key={section.title} className="space-y-1">
                  <p className="px-2 [font-family:var(--font-body)] text-[9.5px] font-semibold uppercase tracking-[0.12em] text-(--sidebar-section)">
                    {section.title}
                  </p>
                  <div className="space-y-1.5">
                    {section.items.map((item) => {
                      const isActive = isSidebarItemActive(item.to, pathname)
                      return (
                        <Link
                          key={item.to}
                          to={item.to}
                          activeOptions={{ exact: item.to === '/dashboard' }}
                          className={`${sidebarNavLinkClass} ${
                            isActive
                              ? sidebarNavLinkActiveClass
                              : sidebarNavLinkInactiveClass
                          }`}
                        >
                          {isActive ? (
                            <span
                              className="sidebar-nav-accent absolute top-1/2 -left-3 h-[70%] w-[3px] -translate-y-1/2 rounded-r-sm bg-(--sidebar-nav-accent)"
                              aria-hidden
                            />
                          ) : null}
                          <span
                            aria-hidden
                            className="inline-flex size-4 shrink-0 items-center justify-center text-inherit"
                          >
                            <SidebarItemIcon to={item.to} active={isActive} />
                          </span>
                          <span>{item.label}</span>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ))}
            </nav>

            <div className="mt-auto flex flex-col gap-2.5 pt-5">
              <PortalEnvironmentSegmentedControl
                portalEnvironment={portalEnvironment}
                onRequestEnvironment={requestPortalEnvironment}
                isKycVerified={isKycVerified}
              />
              <Button
                variant="ghost"
                className="h-[38px]! min-h-0! w-full rounded-lg border border-(--sidebar-border) bg-(--color-card) px-3 text-[11.5px]! text-(--sidebar-link)! hover:border-(--color-accent) hover:bg-(--sidebar-segment-hover) hover:text-(--sidebar-link-active)!"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-(--sidebar-link)/35 border-t-(--sidebar-link-active)" />
                    Logging out...
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5">
                    <LogoutIcon />
                    Logout
                  </span>
                )}
              </Button>
            </div>
          </div>
        </aside>

        <main className="flex h-full min-h-0 flex-col overflow-hidden bg-(--dashboard-main-bg)">
          <DashboardOutletHeader
            authUser={authUser}
            profile={profileQuery.data}
            isProfilePending={profileQuery.isPending && Boolean(authUser)}
          />

          <div
            className={`min-h-0 flex-1 overflow-y-auto p-4 md:p-5 ${portalEnvironment === 'test' ? 'pb-24' : ''}`}
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
          </div>
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

      <TransactionDetailDialog
        selectedTransactionId={selectedTransactionId}
        onClose={closeTransactionDetail}
        detailQuery={transactionDetailQuery}
      />
    </section>
  )
}
