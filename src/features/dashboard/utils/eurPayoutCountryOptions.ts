const EUR_PAYOUT_COUNTRIES = [
  'Austria',
  'Belgium',
  'Bulgaria',
  'Croatia',
  'Cyprus',
  'Czech Republic',
  'Denmark',
  'Estonia',
  'Finland',
  'France',
  'Germany',
  'Greece',
  'Hungary',
  'Iceland',
  'Ireland',
  'Italy',
  'Latvia',
  'Liechtenstein',
  'Lithuania',
  'Luxembourg',
  'Malta',
  'Netherlands',
  'Norway',
  'Poland',
  'Portugal',
  'Romania',
  'Slovakia',
  'Slovenia',
  'Spain',
  'Sweden',
  'Switzerland',
  'United Kingdom',
] as const

export const eurPayoutCountryOptions = EUR_PAYOUT_COUNTRIES.map((country) => ({
  label: country,
  value: country,
}))

export const eurPayoutCountryOptionsWithPlaceholder = [
  { label: 'Select country', value: '' },
  ...eurPayoutCountryOptions,
]
