export type SettingsTabId =
  | 'profile'
  | 'security'
  | 'markets'
  | 'business-preference'
  | 'settlement-accounts'
  | 'team'
  | 'permissions'
  | 'whitelisted-ip-addresses'
  | 'reconciliation-report'
  | 'api-keys'
  | 'webhooks'

export interface SettingsTab {
  id: SettingsTabId
  label: string
}

export const accountTabs: SettingsTab[] = [
  { id: 'profile', label: 'Profile' },
  { id: 'security', label: 'Security' },
  { id: 'markets', label: 'Markets' },
  { id: 'team', label: 'Directors' },
  { id: 'whitelisted-ip-addresses', label: 'Whitelisted IP addresses' },
  { id: 'reconciliation-report', label: 'Reconciliation report' },
]

export const developerTabs: SettingsTab[] = [
  { id: 'api-keys', label: 'API keys' },
  { id: 'webhooks', label: 'Webhooks' },
]

export const tabContent: Record<
  SettingsTabId,
  { title: string; description: string }
> = {
  profile: {
    title: 'Profile',
    description:
      'Manage your business profile details, legal business name, and primary contact email.',
  },
  security: {
    title: 'Security',
    description:
      'Protect your account with multi-factor authentication enrollment and verification controls.',
  },
  markets: {
    title: 'Markets',
    description:
      'Request and manage payment market entitlements for Bangladesh, India, and Europe.',
  },
  'business-preference': {
    title: 'Business preference',
    description:
      'Configure default currency, settlement cycle, and payout preferences for your merchant account.',
  },
  'settlement-accounts': {
    title: 'Settlement accounts',
    description:
      'Connect and manage the bank accounts used for payout settlements and reconciliations.',
  },
  team: {
    title: 'Directors',
    description:
      'Invite teammates, assign workspace access, and control who can operate transactions or settings.',
  },
  permissions: {
    title: 'Permissions',
    description:
      'Create role-based permission policies to control actions across payouts, customers, and API access.',
  },
  'whitelisted-ip-addresses': {
    title: 'Whitelisted IP addresses',
    description:
      'Control which origin IPs can call the merchant API (/v1/*) after HMAC authentication.',
  },
  'reconciliation-report': {
    title: 'Reconciliation report',
    description:
      'Review settlement activity for a date range (max 93 days) and download a CSV export for accounting.',
  },
  'api-keys': {
    title: 'API keys',
    description:
      'Generate, rotate, and revoke API keys used by your backend integration with Transcaty endpoints.',
  },
  webhooks: {
    title: 'Webhooks',
    description:
      'Set callback URLs for payment events and verify payload delivery for transaction notifications.',
  },
}

export const DEVELOPER_DOCS_URL = 'https://docs.transacty.ai'
