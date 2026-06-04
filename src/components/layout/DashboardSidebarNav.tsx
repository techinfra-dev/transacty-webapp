import { Link } from '@tanstack/react-router'
import { Button } from '../ui/Button.tsx'
import type { PortalEnvironment } from '../../types/portalEnvironment.ts'
import { LogoutIcon, SidebarItemIcon } from './SidebarItemIcon.tsx'

export interface DashboardNavItem {
  label: string
  to:
    | '/dashboard'
    | '/dashboard/wallets'
    | '/dashboard/transactions'
    | '/dashboard/customers'
    | '/dashboard/payouts'
    | '/dashboard/settings'
}

interface DashboardNavSection {
  title: string
  items: DashboardNavItem[]
}

export const dashboardMenuSections: DashboardNavSection[] = [
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

export function isDashboardNavItemActive(to: DashboardNavItem['to'], pathname: string) {
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
    <div className={className} role="group" aria-label="Portal environment">
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

export interface DashboardSidebarNavProps {
  pathname: string
  portalEnvironment: PortalEnvironment
  onRequestEnvironment: (next: PortalEnvironment) => void
  isKycVerified: boolean
  onLogout: () => void
  isLoggingOut: boolean
  onNavigate?: () => void
  /** Extra bottom padding when a fixed test-mode banner may overlap (mobile drawer). */
  reserveTestBannerSpace?: boolean
}

export function DashboardSidebarNav({
  pathname,
  portalEnvironment,
  onRequestEnvironment,
  isKycVerified,
  onLogout,
  isLoggingOut,
  onNavigate,
  reserveTestBannerSpace = false,
}: DashboardSidebarNavProps) {
  const footerPadClass =
    reserveTestBannerSpace && portalEnvironment === 'test'
      ? 'pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]'
      : ''

  return (
    <div className="flex min-h-0 flex-1 flex-col px-2.5 py-4">
      <nav className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain">
        {dashboardMenuSections.map((section) => (
          <div key={section.title} className="space-y-1">
            <p className="px-2 [font-family:var(--font-body)] text-[9.5px] font-semibold uppercase tracking-[0.12em] text-(--sidebar-section)">
              {section.title}
            </p>
            <div className="space-y-1.5">
              {section.items.map((item) => {
                const isActive = isDashboardNavItemActive(item.to, pathname)
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    activeOptions={{ exact: item.to === '/dashboard' }}
                    onClick={onNavigate}
                    className={`${sidebarNavLinkClass} ${
                      isActive ? sidebarNavLinkActiveClass : sidebarNavLinkInactiveClass
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

      <div
        className={`mt-4 shrink-0 flex flex-col gap-2.5 border-t border-(--sidebar-border) pt-4 ${footerPadClass}`}
      >
        <PortalEnvironmentSegmentedControl
          portalEnvironment={portalEnvironment}
          onRequestEnvironment={onRequestEnvironment}
          isKycVerified={isKycVerified}
        />
        <Button
          variant="ghost"
          className="h-[38px]! min-h-0! w-full rounded-lg border border-(--sidebar-border) bg-(--color-card) px-3 text-[11.5px]! text-(--sidebar-link)! hover:border-(--color-accent) hover:bg-(--sidebar-segment-hover) hover:text-(--sidebar-link-active)!"
          onClick={onLogout}
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
  )
}

export function DashboardSidebarLogo() {
  return (
    <Link
      to="/dashboard"
      aria-label="Go to dashboard home"
      className="inline-flex w-full max-w-full shrink-0 items-center justify-center rounded-md py-0.5 outline-none transition focus-visible:ring-2 focus-visible:ring-(--color-accent)/40 focus-visible:ring-offset-2 focus-visible:ring-offset-(--sidebar-bg)"
    >
      <img
        src="/TRANSACTY-LOGO-OBSIDIAN-BROWN.png"
        alt="Transacty"
        width={220}
        height={48}
        className="h-10 w-auto max-w-[168px] object-contain object-center"
        decoding="async"
      />
    </Link>
  )
}
