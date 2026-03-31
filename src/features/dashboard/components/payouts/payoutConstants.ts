import type { BeneficiaryAccountInfo, CardHolderInfo } from '../../services/payoutsSchemas.ts'
import type { PayoutFormPayload } from '../../services/payoutFormTypes.ts'

export const payoutStepItems = [
  { id: 1, label: 'Amount' },
  { id: 2, label: 'Beneficiary' },
  { id: 3, label: 'Sender' },
] as const

export const payoutAccent = '#A67D6A'
export const payoutLineMuted = '#E0DCD6'
export const payoutSurface = '#F7F4F0'

export const payoutFormCardClass =
  'rounded-sm border border-[#E5E0D6] border-b-[3px] border-b-[#A89888] bg-[#FAF8F4] p-4 shadow-[0_1px_3px_rgba(15,7,0,0.07)] md:p-5'

export const payoutFieldLabelClass =
  '[font-family:var(--font-body)] text-[11px] font-semibold text-[#35383F]'

export const payoutInputClass =
  'h-10 border-[#B8B2A8] bg-white text-[13px] text-[#0F0700] placeholder:text-[#566167]/75 focus:border-[#0F0700] focus:ring-2 focus:ring-[#0F0700]/15'

export const payoutOutlineBtnClass =
  'h-9! min-h-0! border! border-solid! border-[#C9C2B8]! bg-white! px-4 text-[11px] font-semibold text-[#0F0700]! hover:border-[#9D8F82]! hover:bg-[#FAF8F4]!'

export const payoutPrimaryBtnClass =
  'h-9! min-h-0! border! border-solid! border-[#0F0700]! bg-[#0F0700]! px-5 text-[11px] font-semibold text-[#F3E8D6]! hover:bg-[#2a241c]!'

export const payoutMethodOptions = ['BKASH', 'NAGAD', 'UPAY'] as const
export const minimumPayoutAmount = 200

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
