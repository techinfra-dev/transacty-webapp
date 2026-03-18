export type SettingsTabId =
  | 'profile'
  | 'business-preference'
  | 'settlement-accounts'
  | 'team'
  | 'permissions'
  | 'whitelisted-ip-addresses'
  | 'api-keys'
  | 'webhooks'

export interface SettingsTab {
  id: SettingsTabId
  label: string
}

export const accountTabs: SettingsTab[] = [
  { id: 'profile', label: 'Profile' },
  { id: 'team', label: 'Directors' },
  { id: 'whitelisted-ip-addresses', label: 'Whitelisted IP addresses' },
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
    title: 'Team',
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
      'Restrict dashboard and API access by allowing only approved office or server IP addresses.',
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

export const DEVELOPER_DOCS_URL = 'https://docs.transcaty.com'
