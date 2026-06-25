import type { EurPayoutUserDetails } from './eurPayoutSchemas.ts'

export type EurPayoutFormPayload = {
  amount: string
  iban: string
  userDetails: EurPayoutUserDetails
  autoMerchantApproval: 0 | 1
}
