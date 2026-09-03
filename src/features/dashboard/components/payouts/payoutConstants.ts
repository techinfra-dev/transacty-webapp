import type { BeneficiaryAccountInfo, CardHolderInfo } from '../../services/payoutsSchemas.ts'
import type { PayoutFormPayload } from '../../services/payoutFormTypes.ts'
import type { BrPayoutFormPayload } from '../../services/brPayoutFormTypes.ts'
import type { BalanceWalletItem } from '../../services/balanceSchemas.ts'
import type { EurPayoutFormPayload } from '../../services/eurPayoutFormTypes.ts'
import type { CpgPayoutFormPayload } from '../../services/cpgPayoutFormTypes.ts'
import type { NgnPayoutFormPayload } from '../../services/ngnPayoutSchemas.ts'
import type { EurPayoutUserDetails } from '../../services/eurPayoutSchemas.ts'
import { isBangladeshRailPausedForWallet } from '../../utils/bangladeshRailPause.ts'

export const payoutStepItems = [
  { id: 1, label: 'Wallet' },
  { id: 2, label: 'Amount' },
  { id: 3, label: 'Beneficiary' },
  { id: 4, label: 'Sender' },
] as const

export const payoutMethodOptions = ['BKASH', 'NAGAD', 'UPAY'] as const
export const minimumPayoutAmount = 200
export const maximumPixPayoutAmount = 15_000
export const minimumPixPayoutAmount = 10
export const maximumPixPayinAmount = 15_000
export const minimumPixPayinAmount = 10
export const minimumEurPayoutAmount = 1
export const minimumCpgPayoutAmount = 1
export const minimumNgnPayoutAmount = 500
export const maximumNgnPayoutAmount = 5_000_000
export const EUR_PAYOUT_FIAT_CURRENCY = 'EUR'
export const EUR_PAYOUT_SETTLEMENT_CURRENCY = 'USDC'
export const INDIA_PAYOUT_SETTLEMENT_CURRENCY = 'USDT'
export const BRAZIL_PAYOUT_CURRENCY = 'BRL'
export const NIGERIA_PAYOUT_CURRENCY = 'NGN'

export type PayoutRail = 'bdt' | 'eur' | 'cpg' | 'pix' | 'ngn'

/** Bangladesh BDT payouts via POST /portal/me/payouts. */
export const PAYOUT_SUPPORTED_CURRENCY = 'BDT'

export const cpgNetworkOptions = [
  { label: 'TRON (TRX)', value: 'TRX' },
  { label: 'Ethereum (ETH)', value: 'ETH' },
  { label: 'BNB Smart Chain (BSC)', value: 'BSC' },
  { label: 'Polygon (MATIC)', value: 'MATIC' },
] as const

export const cpgNetworkDropdownOptions = [
  { label: 'Select network', value: '' },
  ...cpgNetworkOptions.map((option) => ({
    label: option.label,
    value: option.value,
  })),
]

export function getPayoutRailForWallet(
  wallet: Pick<BalanceWalletItem, 'currency' | 'market' | 'region'>,
): PayoutRail | null {
  const code = wallet.currency.trim().toUpperCase()
  const market = (wallet.market ?? wallet.region ?? '').trim().toLowerCase()
  if (code === PAYOUT_SUPPORTED_CURRENCY) {
    return 'bdt'
  }
  if (code === BRAZIL_PAYOUT_CURRENCY && market === 'brazil') {
    return 'pix'
  }
  if (code === NIGERIA_PAYOUT_CURRENCY) {
    return 'ngn'
  }
  if (code === EUR_PAYOUT_SETTLEMENT_CURRENCY) {
    return market === 'europe' ? 'eur' : null
  }
  if (code === INDIA_PAYOUT_SETTLEMENT_CURRENCY) {
    return market === 'india' ? 'cpg' : null
  }
  return null
}

export function isPayoutSupportedWallet(
  wallet: Pick<BalanceWalletItem, 'currency' | 'market' | 'region'>,
) {
  if (isBangladeshRailPausedForWallet(wallet)) {
    return false
  }
  return getPayoutRailForWallet(wallet) !== null
}

/** @deprecated Use isPayoutSupportedWallet(wallet) instead. */
export function isPayoutSupportedCurrency(currency: string) {
  const code = currency.trim().toUpperCase()
  return (
    code === PAYOUT_SUPPORTED_CURRENCY ||
    code === BRAZIL_PAYOUT_CURRENCY ||
    code === NIGERIA_PAYOUT_CURRENCY ||
    code === EUR_PAYOUT_SETTLEMENT_CURRENCY ||
    code === INDIA_PAYOUT_SETTLEMENT_CURRENCY
  )
}

export function getPayoutReturnUrl() {
  if (typeof window === 'undefined') {
    return 'https://localhost/dashboard/payouts'
  }
  return `${window.location.origin}/dashboard/payouts`
}

export function getDefaultMerchantUrl() {
  if (typeof window === 'undefined') {
    return 'https://localhost'
  }
  return window.location.origin
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

const initialEurUserDetails: EurPayoutUserDetails = {
  firstName: '',
  lastName: '',
  email: '',
  country: '',
  dob: '',
}

export const initialPayoutPayload: PayoutFormPayload = {
  amount: '',
  benificiaryAccountInfo: initialBeneficiaryAccountInfo,
  cardHolderInfo: initialCardHolderInfo,
}

export const initialEurPayoutPayload: EurPayoutFormPayload = {
  amount: '',
  iban: '',
  userDetails: initialEurUserDetails,
  autoMerchantApproval: 1,
}

export const initialCpgPayoutPayload: CpgPayoutFormPayload = {
  amount: '',
  networkSymbol: '',
  destinationAddress: '',
  beneficiaryName: '',
}

export const initialBrPayoutPayload: BrPayoutFormPayload = {
  amount: '',
  benificiaryAccountInfo: initialBeneficiaryAccountInfo,
  cardHolderInfo: initialCardHolderInfo,
}

export const initialNgnPayoutPayload: NgnPayoutFormPayload = {
  amount: '',
  bankCode: '',
  bankName: '',
  accountNumber: '',
  accountName: '',
  merchantReference: '',
  description: '',
}
