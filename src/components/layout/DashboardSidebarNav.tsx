import { Link } from '@tanstack/react-router'
import { Button } from '../ui/Button.tsx'
import type { PortalEnvironment } from '../../types/portalEnvironment.ts'
import { useBrandLogoPath } from '../../theme/useBrandLogo.ts'
import { usePortalRole } from '../../hooks/usePortalRole.ts'
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
  'relative flex h-9 items-center gap-3 rounded-lg border border-transparent px-3 [font-family:var(--font-body)] text-[15.5px] tracking-[-0.01em] text-(--sidebar-link) transition-[color,background-color,border-color,font-weight] duration-150'

const sidebarNavLinkActiveClass = 'sidebar-nav-link--active font-bold'

const sidebarNavLinkInactiveClass =
  'font-medium hover:bg-(--sidebar-link-hover-bg) hover:text-(--sidebar-link-hover)'

function PortalEnvironmentSegmentedControl({
  portalEnvironment,
  onRequestEnvironment,
  isKycVerified,
  className,
  collapsed = false,
}: {
  portalEnvironment: PortalEnvironment
  onRequestEnvironment: (next: PortalEnvironment) => void
  isKycVerified: boolean
  className?: string
  collapsed?: boolean
}) {
  const liveSwitchBlocked = !isKycVerified && portalEnvironment !== 'live'
  return (
    <div className={className} role="group" aria-label="Portal environment">
      {!collapsed ? (
        <p className="mb-1 px-1 [font-family:var(--font-body)] text-[9.5px] font-semibold uppercase tracking-[0.12em] text-(--sidebar-section)">
          Environment
        </p>
      ) : null}
      <div
        className={`grid gap-1 rounded-lg border border-(--sidebar-border) bg-(--sidebar-segment-inactive) p-0.5 ${
          collapsed ? 'grid-cols-1' : 'grid-cols-2'
        }`}
      >
        <button
          type="button"
          title="Test environment"
          aria-label="Use test environment"
          onClick={() => onRequestEnvironment('test')}
          className={`rounded-md px-2 py-1.5 [font-family:var(--font-body)] text-[11.5px] font-semibold transition-colors ${
            portalEnvironment === 'test'
              ? 'bg-(--sidebar-segment-active-bg) text-(--sidebar-segment-active-text)'
              : 'bg-transparent text-(--sidebar-segment-inactive-text) hover:bg-(--sidebar-segment-hover)'
          }`}
        >
          {collapsed ? 'T' : 'Test'}
        </button>
        <button
          type="button"
          title={
            liveSwitchBlocked
              ? 'Complete KYC verification to use the live environment'
              : 'Live environment'
          }
          aria-label="Use live environment"
          disabled={liveSwitchBlocked}
          onClick={() => onRequestEnvironment('live')}
          className={`rounded-md px-2 py-1.5 [font-family:var(--font-body)] text-[11px] font-semibold transition-colors ${
            portalEnvironment === 'live'
              ? 'bg-(--sidebar-segment-active-bg) text-(--sidebar-segment-active-text)'
              : 'bg-transparent text-(--sidebar-segment-inactive-text) hover:bg-(--sidebar-segment-hover)'
          } ${liveSwitchBlocked ? 'cursor-not-allowed opacity-45' : ''}`}
        >
          {collapsed ? 'L' : 'Live'}
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
  collapsed?: boolean
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
  collapsed = false,
}: DashboardSidebarNavProps) {
  const { canWriteMoney } = usePortalRole()
  const footerPadClass =
    reserveTestBannerSpace && portalEnvironment === 'test'
      ? 'pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]'
      : ''

  const menuSections = dashboardMenuSections
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) => canWriteMoney || item.to !== '/dashboard/payouts',
      ),
    }))
    .filter((section) => section.items.length > 0)

  return (
    <div
      className={`flex min-h-0 flex-1 flex-col py-4 ${
        collapsed ? 'px-2' : 'px-2.5'
      }`}
    >
      <nav className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain">
        {menuSections.map((section) => (
          <div key={section.title} className="space-y-1">
            {!collapsed ? (
              <p className="px-2.5 pb-0.5 [font-family:var(--font-body)] text-[10px] font-semibold uppercase tracking-[0.14em] text-(--sidebar-section)">
                {section.title}
              </p>
            ) : null}
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = isDashboardNavItemActive(item.to, pathname)
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    activeOptions={{ exact: item.to === '/dashboard' }}
                    onClick={onNavigate}
                    aria-label={collapsed ? item.label : undefined}
                    title={collapsed ? item.label : undefined}
                    className={`${sidebarNavLinkClass} ${
                      collapsed ? 'justify-center gap-0 px-0' : ''
                    } ${
                      isActive ? sidebarNavLinkActiveClass : sidebarNavLinkInactiveClass
                    }`}
                  >
                    <span
                      aria-hidden
                      className={`inline-flex size-[1.125rem] shrink-0 items-center justify-center text-inherit ${
                        isActive ? 'opacity-100' : 'opacity-80'
                      }`}
                    >
                      <SidebarItemIcon to={item.to} active={isActive} />
                    </span>
                    {!collapsed ? (
                      <span className="min-w-0 truncate leading-none">{item.label}</span>
                    ) : null}
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
          collapsed={collapsed}
        />
        <Button
          variant="ghost"
          className={`h-[38px]! min-h-0! w-full rounded-lg border border-(--sidebar-border) bg-(--color-card) text-[11.5px]! text-(--sidebar-link)! hover:border-(--color-accent) hover:bg-(--sidebar-segment-hover) hover:text-(--sidebar-link-active)! ${
            collapsed ? 'px-0!' : 'px-3'
          }`}
          onClick={onLogout}
          disabled={isLoggingOut}
          aria-label={collapsed ? 'Log out' : undefined}
          title={collapsed ? 'Log out' : undefined}
        >
          {isLoggingOut ? (
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-(--sidebar-link)/35 border-t-(--sidebar-link-active)" />
              {!collapsed ? 'Logging out...' : null}
            </span>
          ) : (
            <span className="inline-flex items-center gap-2.5">
              <LogoutIcon />
              {!collapsed ? 'Logout' : null}
            </span>
          )}
        </Button>
      </div>
    </div>
  )
}

export function DashboardSidebarLogo({ collapsed = false }: { collapsed?: boolean }) {
  const logoSrc = useBrandLogoPath()

  return (
    <Link
      to="/dashboard"
      aria-label="Go to dashboard home"
      className={`inline-flex max-w-full shrink-0 items-center rounded-md py-0.5 outline-none transition focus-visible:ring-2 focus-visible:ring-(--color-accent)/40 focus-visible:ring-offset-2 focus-visible:ring-offset-(--sidebar-bg) ${
        collapsed ? 'h-9 w-9 justify-start overflow-hidden' : 'w-full justify-center'
      }`}
    >
      <img
        src={logoSrc}
        alt="Transacty"
        width={220}
        height={48}
        className={`h-8 max-w-none object-contain ${
          collapsed ? 'w-auto shrink-0 object-left' : 'w-auto max-w-[150px] object-center'
        }`}
        decoding="async"
      />
    </Link>
  )
}
