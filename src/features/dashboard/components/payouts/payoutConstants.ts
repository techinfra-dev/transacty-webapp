import type { BeneficiaryAccountInfo, CardHolderInfo } from '../../services/payoutsSchemas.ts'
import type { PayoutFormPayload } from '../../services/payoutFormTypes.ts'

export const payoutStepItems = [
  { id: 1, label: 'Wallet' },
  { id: 2, label: 'Amount' },
  { id: 3, label: 'Beneficiary' },
  { id: 4, label: 'Sender' },
] as const

export const payoutMethodOptions = ['BKASH', 'NAGAD', 'UPAY'] as const
export const minimumPayoutAmount = 200

/** Payouts are currently supported for Bangladesh (BDT) wallets only. */
export const PAYOUT_SUPPORTED_CURRENCY = 'BDT'

export function isPayoutSupportedCurrency(currency: string) {
  return currency.trim().toUpperCase() === PAYOUT_SUPPORTED_CURRENCY
}

const initialBeneficiaryAccountInfo: BeneficiaryAccountInfo = {
  number: '',
  holderName: '',
  orgName: '',
  orgCode: '',
  orgId: '',
}

const initialCardHolderInfo: CardHolderInfo = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
}

export const initialPayoutPayload: PayoutFormPayload = {
  amount: '',
  benificiaryAccountInfo: initialBeneficiaryAccountInfo,
  cardHolderInfo: initialCardHolderInfo,
}
