import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Outlet, useNavigate, useRouterState } from '@tanstack/react-router'
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
import {
  DashboardSidebarLogo,
  DashboardSidebarNav,
} from '../components/layout/DashboardSidebarNav.tsx'

const MOBILE_NAV_ANIMATION_MS = 280

function MobileNavCloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}

export function DashboardLayout() {
  const queryClient = useQueryClient()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const portalEnvironment = usePortalEnvironmentStore((state) => state.environment)
  const setPortalEnvironment = usePortalEnvironmentStore(
    (state) => state.setEnvironment,
  )
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isMobileNavMounted, setIsMobileNavMounted] = useState(false)
  const [isMobileNavClosing, setIsMobileNavClosing] = useState(false)
  const isMobileNavOpen = isMobileNavMounted && !isMobileNavClosing

  function openMobileNav() {
    setIsMobileNavClosing(false)
    setIsMobileNavMounted(true)
  }

  function closeMobileNav() {
    if (!isMobileNavMounted || isMobileNavClosing) {
      return
    }
    setIsMobileNavClosing(true)
  }
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
  const isKycRejected = profileQuery.data?.kycStatus === 'rejected'
  const isKycVerified = profileQuery.data?.kycStatus === 'verified'
  const isBusinessVerified = profileQuery.data?.businessProfile?.status === 'verified'
  const isFullyVerified = isKycVerified && isBusinessVerified
  const showKycPendingBanner =
    !isFullyVerified && hasSubmittedBusinessProfile && isKycPending
  const showActivationBanner =
    !isFullyVerified &&
    !showKycPendingBanner &&
    (authUser?.needsActivation || isKycRejected)

  useEffect(() => {
    const unsubscribe = subscribeToAuthSessionUpdates(() => {
      setAuthUser(getAuthUser())
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    closeMobileNav()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- close drawer when route changes
  }, [pathname])

  useEffect(() => {
    if (!isMobileNavClosing) {
      return
    }
    const timer = window.setTimeout(() => {
      setIsMobileNavMounted(false)
      setIsMobileNavClosing(false)
    }, MOBILE_NAV_ANIMATION_MS)
    return () => window.clearTimeout(timer)
  }, [isMobileNavClosing])

  useEffect(() => {
    if (!isMobileNavMounted) {
      return
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeMobileNav()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [isMobileNavMounted])

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
          <header className="dashboard-shell-header justify-center px-3">
            <DashboardSidebarLogo />
          </header>
          <DashboardSidebarNav
            pathname={pathname}
            portalEnvironment={portalEnvironment}
            onRequestEnvironment={requestPortalEnvironment}
            isKycVerified={isKycVerified}
            onLogout={() => void handleLogout()}
            isLoggingOut={isLoggingOut}
          />
        </aside>

        {isMobileNavMounted ? (
          <div className="fixed inset-0 z-[60] lg:hidden" role="presentation">
            <button
              type="button"
              className={`dashboard-mobile-nav-scrim absolute inset-0 ${
                isMobileNavClosing
                  ? 'dashboard-mobile-nav-scrim--out'
                  : 'dashboard-mobile-nav-scrim--in'
              }`}
              aria-label="Close navigation menu"
              onClick={closeMobileNav}
            />
            <aside
              id="dashboard-mobile-nav"
              className={`absolute inset-y-0 left-0 flex h-full w-(--sidebar-width) max-w-[min(100vw-3rem,var(--sidebar-width))] flex-col border-r border-(--sidebar-border) bg-(--sidebar-bg) shadow-[4px_0_24px_rgba(15,7,0,0.12)] will-change-transform ${
                isMobileNavClosing
                  ? 'dashboard-mobile-nav--out'
                  : 'dashboard-mobile-nav--in'
              }`}
              aria-label="Main navigation"
              aria-hidden={isMobileNavClosing}
            >
              <header className="dashboard-shell-header gap-2 px-3">
                <div className="flex min-w-0 flex-1 items-center justify-center">
                  <DashboardSidebarLogo />
                </div>
                <button
                  type="button"
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-(--sidebar-border) bg-(--color-card) text-(--color-foreground) transition hover:bg-(--sidebar-segment-hover) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-accent)/40"
                  onClick={closeMobileNav}
                  aria-label="Close navigation menu"
                >
                  <MobileNavCloseIcon />
                </button>
              </header>
              <DashboardSidebarNav
                pathname={pathname}
                portalEnvironment={portalEnvironment}
                onRequestEnvironment={requestPortalEnvironment}
                isKycVerified={isKycVerified}
                onLogout={() => void handleLogout()}
                isLoggingOut={isLoggingOut}
                onNavigate={closeMobileNav}
                reserveTestBannerSpace
              />
            </aside>
          </div>
        ) : null}

        <main className="flex h-full min-h-0 flex-col overflow-hidden bg-(--dashboard-main-bg)">
          <DashboardOutletHeader
            authUser={authUser}
            profile={profileQuery.data}
            isProfilePending={profileQuery.isPending && Boolean(authUser)}
            isMobileNavOpen={isMobileNavOpen}
            onOpenMobileNav={openMobileNav}
          />

          <div
            className={`dashboard-outlet min-h-0 flex-1 overflow-y-auto p-4 md:p-5 ${portalEnvironment === 'test' ? 'pb-32' : ''}`}
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
                  {isKycRejected
                    ? 'Action required: Resubmit KYC verification'
                    : 'Urgent: Submit Additional Information'}
                </span>
                <div className="text-center">
                  <span>
                    {isKycRejected
                      ? 'Your KYC submission was rejected. Please review your details and resubmit.'
                      : 'To keep your account active, you need to provide additional business information.'}
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
          kycStatus={profileQuery.data?.kycStatus}
          businessProfileStatus={profileQuery.data?.businessProfile?.status}
        />
      ) : null}

      {portalEnvironment === 'test' && !isMobileNavMounted ? <TestModeBanner /> : null}

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
