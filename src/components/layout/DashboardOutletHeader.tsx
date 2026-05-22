import { Link } from '@tanstack/react-router'
import type { ProfileResponse } from '../../features/dashboard/services/profileSchemas.ts'
import type { AuthSessionUser } from '../../features/auth/services/authSession.ts'

function displayInitials(merchantName: string, email: string) {
  const fromName = merchantName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')

  if (fromName.length >= 2) {
    return fromName
  }
  if (fromName.length === 1) {
    return fromName
  }

  const local = email.split('@')[0] ?? ''
  if (local.length >= 2) {
    return local.slice(0, 2).toUpperCase()
  }
  return local.slice(0, 1).toUpperCase() || '?'
}

function resolveMerchantLabel(
  authUser: AuthSessionUser | null,
  profile: ProfileResponse | undefined,
  isProfilePending: boolean,
) {
  if (profile?.businessName) {
    return profile.businessName
  }
  if (authUser?.merchantName) {
    return authUser.merchantName
  }
  if (isProfilePending) {
    return 'Loading…'
  }
  return 'Merchant'
}

interface DashboardOutletHeaderProps {
  authUser: AuthSessionUser | null
  profile: ProfileResponse | undefined
  isProfilePending: boolean
}

export function DashboardOutletHeader({
  authUser,
  profile,
  isProfilePending,
}: DashboardOutletHeaderProps) {
  const merchantName = resolveMerchantLabel(authUser, profile, isProfilePending)
  const email = profile?.email ?? authUser?.email ?? ''
  const role = profile?.role ?? authUser?.role ?? ''
  const initials = displayInitials(merchantName, email)

  return (
    <header className="sticky top-0 z-10 flex shrink-0 items-center justify-between gap-4 border-b border-(--sidebar-border) bg-(--sidebar-bg) px-4 py-2.5 md:px-5">
      <div className="min-w-0 flex-1" aria-hidden />

      <Link
        to="/dashboard/settings"
        className="flex min-w-0 max-w-[min(100%,280px)] items-center gap-2.5 rounded-lg px-1 py-0.5 text-inherit no-underline outline-none transition hover:bg-[#F6F6F6] focus-visible:ring-2 focus-visible:ring-[#0F0700]/20"
        aria-label={`${merchantName} account settings`}
      >
        <div className="min-w-0 text-right">
          <p className="truncate [font-family:var(--font-body)] text-[15px] font-semibold text-[#0F0700]">
            {merchantName}
          </p>
          <p className="truncate [font-family:var(--font-body)] text-[11.5px] text-[#566167]">
            {email}
            {role ? (
              <span className="text-[#9D8F82]">{` · ${role.replace(/_/g, ' ')}`}</span>
            ) : null}
          </p>
        </div>
        <span
          className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-[#0F0700] [font-family:var(--font-body)] text-[12.5px] font-semibold text-[#F3E8D6]"
          aria-hidden
        >
          {initials}
        </span>
      </Link>
    </header>
  )
}
