import { z } from 'zod'
import { PAYOUT_PIN_PATTERN } from './payoutPinSchemas.ts'
import { payoutEnvironmentSchema } from './payoutsSchemas.ts'
import {
  defaultNuvionDestinationType,
  type NuvionPayoutCurrency,
} from '../utils/nuvionMarket.ts'

const amountPattern = /^\d+(\.\d{1,2})?$/

export const nuvionDestinationTypeSchema = z.enum([
  'usd_bank',
  'aed_bank',
  'ghs_bank',
  'ghs_momo',
  'tzs_bank',
  'tzs_momo',
  'mxn_bank',
  'kes_bank',
])

export const nuvionBeneficiaryRelationshipSchema = z.enum([
  'vendor',
  'supplier',
  'customer',
  'employee',
])

export const nuvionUsdSchemeSchema = z.enum(['ach', 'wire', 'rtp'])
export const nuvionUsdAccountTypeSchema = z.enum(['checking', 'savings'])
export const nuvionGhsMomoSchemeSchema = z.enum(['mtn', 'vodafone', 'airtel'])
export const nuvionTzsMomoSchemeSchema = z.enum([
  'halotel',
  'airtel',
  'tigo',
  'vodacom',
])

const nuvionAddressOptionalStateSchema = z.object({
  line1: z.string().trim().min(1, 'Address line is required.'),
  city: z.string().trim().min(1, 'City is required.'),
  state: z.string().trim().optional(),
  postalCode: z.string().trim().optional(),
  countryCode: z
    .string()
    .trim()
    .length(2, 'Use a 2-letter country code.')
    .transform((value) => value.toUpperCase()),
})

const nuvionBeneficiaryAddressSchema = z.object({
  line1: z.string().trim().min(1, 'Beneficiary address is required.'),
  city: z.string().trim().min(1, 'Beneficiary city is required.'),
  countryCode: z
    .string()
    .trim()
    .length(2, 'Use a 2-letter country code.')
    .transform((value) => value.toUpperCase()),
})

export const nuvionBeneficiarySchema = z.object({
  accountHolderName: z.string().trim().min(1, 'Account holder name is required.'),
  email: z.string().trim().email('Enter a valid beneficiary email.'),
  address: nuvionBeneficiaryAddressSchema,
  relationship: nuvionBeneficiaryRelationshipSchema.optional().default('vendor'),
})

const usdBankDestinationSchema = z.object({
  destinationType: z.literal('usd_bank'),
  scheme: nuvionUsdSchemeSchema,
  routingNumber: z
    .string()
    .trim()
    .regex(/^\d{9}$/, 'Routing number must be 9 digits.'),
  accountNumber: z.string().trim().min(4, 'Account number is required.'),
  accountType: nuvionUsdAccountTypeSchema,
  bankName: z.string().trim().min(1, 'Bank name is required.'),
  bankAddress: nuvionAddressOptionalStateSchema,
})

const aedBankDestinationSchema = z.object({
  destinationType: z.literal('aed_bank'),
  iban: z
    .string()
    .trim()
    .transform((value) => value.replace(/\s+/g, '').toUpperCase())
    .refine((value) => /^AE\d{21}$/.test(value), {
      message: 'AED IBAN must be 23 characters (AE + 21 digits).',
    }),
  swiftBic: z
    .string()
    .trim()
    .transform((value) => value.toUpperCase())
    .refine((value) => /^[A-Z0-9]{8}([A-Z0-9]{3})?$/.test(value), {
      message: 'Enter a valid SWIFT/BIC code.',
    }),
  bankName: z.string().trim().min(1, 'Bank name is required.'),
})

const ghsBankDestinationSchema = z.object({
  destinationType: z.literal('ghs_bank'),
  bankCode: z.string().trim().min(1, 'Bank code is required.'),
  accountNumber: z.string().trim().min(1, 'Account number is required.'),
  bankName: z.string().trim().min(1, 'Bank name is required.'),
})

const ghsMomoDestinationSchema = z.object({
  destinationType: z.literal('ghs_momo'),
  momoScheme: nuvionGhsMomoSchemeSchema,
  phoneNumber: z.string().trim().min(8, 'Mobile money number is required.'),
})

const tzsBankDestinationSchema = z.object({
  destinationType: z.literal('tzs_bank'),
  bankCode: z.string().trim().min(1, 'Bank code is required.'),
  accountNumber: z.string().trim().min(1, 'Account number is required.'),
  bankName: z.string().trim().min(1, 'Bank name is required.'),
})

const tzsMomoDestinationSchema = z.object({
  destinationType: z.literal('tzs_momo'),
  momoScheme: nuvionTzsMomoSchemeSchema,
  phoneNumber: z.string().trim().min(8, 'Mobile money number is required.'),
})

const mxnBankDestinationSchema = z.object({
  destinationType: z.literal('mxn_bank'),
  accountNumber: z
    .string()
    .trim()
    .regex(/^\d{18}$/, 'Mexican CLABE must be 18 digits.'),
})

const kesBankDestinationSchema = z.object({
  destinationType: z.literal('kes_bank'),
  bankCode: z.string().trim().min(1, 'Bank code is required.'),
  accountNumber: z.string().trim().min(1, 'Account number is required.'),
  bankName: z.string().trim().min(1, 'Bank name is required.'),
})

export const nuvionDestinationSchema = z.discriminatedUnion('destinationType', [
  usdBankDestinationSchema,
  aedBankDestinationSchema,
  ghsBankDestinationSchema,
  ghsMomoDestinationSchema,
  tzsBankDestinationSchema,
  tzsMomoDestinationSchema,
  mxnBankDestinationSchema,
  kesBankDestinationSchema,
])

export const createNuvionPayoutPayloadSchema = z.object({
  environment: payoutEnvironmentSchema,
  amount: z
    .string()
    .min(1, 'Amount is required.')
    .regex(amountPattern, 'Amount must be a valid number with up to 2 decimals.'),
  narration: z
    .string()
    .trim()
    .min(1, 'Narration is required.')
    .max(140, 'Narration must be 140 characters or fewer.'),
  destination: nuvionDestinationSchema,
  beneficiary: nuvionBeneficiarySchema,
  pin: z.string().regex(PAYOUT_PIN_PATTERN).optional(),
})

export const nuvionPayoutInstanceSchema = z
  .object({
    transactionId: z.string().min(1),
    status: z.string().optional(),
    amount: z.string().optional(),
    currency: z.string().optional(),
    environment: payoutEnvironmentSchema.optional(),
    nuvionTransferId: z.string().nullable().optional(),
  })
  .passthrough()

export type NuvionDestinationType = z.infer<typeof nuvionDestinationTypeSchema>
export type NuvionBeneficiaryRelationship = z.infer<
  typeof nuvionBeneficiaryRelationshipSchema
>
export type CreateNuvionPayoutPayload = z.infer<
  typeof createNuvionPayoutPayloadSchema
>
export type NuvionPayoutInstance = z.infer<typeof nuvionPayoutInstanceSchema>
export type NuvionDestination = z.infer<typeof nuvionDestinationSchema>

export type NuvionPayoutFormPayload = {
  amount: string
  narration: string
  currency: NuvionPayoutCurrency | ''
  destinationType: NuvionDestinationType | ''
  /** USD bank */
  scheme: 'ach' | 'wire' | 'rtp'
  routingNumber: string
  accountNumber: string
  accountType: 'checking' | 'savings'
  bankName: string
  bankAddressLine1: string
  bankAddressCity: string
  bankAddressState: string
  bankAddressPostalCode: string
  bankAddressCountryCode: string
  /** AED */
  iban: string
  swiftBic: string
  /** GHS/TZS/KES bank */
  bankCode: string
  /** GHS/TZS momo */
  momoScheme: string
  phoneNumber: string
  /** Beneficiary (always required) */
  accountHolderName: string
  email: string
  beneficiaryLine1: string
  beneficiaryCity: string
  beneficiaryCountryCode: string
  relationship: NuvionBeneficiaryRelationship
}

export const initialNuvionPayoutPayload = (
  currency: NuvionPayoutCurrency | '' = '',
): NuvionPayoutFormPayload => {
  const destinationType = currency
    ? defaultNuvionDestinationType(currency) ?? ''
    : ''
  return {
    amount: '',
    narration: '',
    currency,
    destinationType,
    scheme: 'ach',
    routingNumber: '',
    accountNumber: '',
    accountType: 'checking',
    bankName: '',
    bankAddressLine1: '',
    bankAddressCity: '',
    bankAddressState: '',
    bankAddressPostalCode: '',
    bankAddressCountryCode: currency === 'USD' ? 'US' : '',
    iban: '',
    swiftBic: '',
    bankCode: '',
    momoScheme: currency === 'GHS' ? 'mtn' : currency === 'TZS' ? 'vodacom' : '',
    phoneNumber: '',
    accountHolderName: '',
    email: '',
    beneficiaryLine1: '',
    beneficiaryCity: '',
    beneficiaryCountryCode: '',
    relationship: 'vendor',
  }
}

export function buildNuvionDestinationFromForm(
  form: NuvionPayoutFormPayload,
): NuvionDestination | null {
  const type = form.destinationType
  if (!type) {
    return null
  }

  switch (type) {
    case 'usd_bank':
      return {
        destinationType: 'usd_bank',
        scheme: form.scheme,
        routingNumber: form.routingNumber.trim(),
        accountNumber: form.accountNumber.trim(),
        accountType: form.accountType,
        bankName: form.bankName.trim(),
        bankAddress: {
          line1: form.bankAddressLine1.trim(),
          city: form.bankAddressCity.trim(),
          state: form.bankAddressState.trim() || undefined,
          postalCode: form.bankAddressPostalCode.trim() || undefined,
          countryCode: form.bankAddressCountryCode.trim().toUpperCase(),
        },
      }
    case 'aed_bank':
      return {
        destinationType: 'aed_bank',
        iban: form.iban.trim(),
        swiftBic: form.swiftBic.trim(),
        bankName: form.bankName.trim(),
      }
    case 'ghs_bank':
      return {
        destinationType: 'ghs_bank',
        bankCode: form.bankCode.trim(),
        accountNumber: form.accountNumber.trim(),
        bankName: form.bankName.trim(),
      }
    case 'ghs_momo':
      return {
        destinationType: 'ghs_momo',
        momoScheme: form.momoScheme as 'mtn' | 'vodafone' | 'airtel',
        phoneNumber: form.phoneNumber.trim(),
      }
    case 'tzs_bank':
      return {
        destinationType: 'tzs_bank',
        bankCode: form.bankCode.trim(),
        accountNumber: form.accountNumber.trim(),
        bankName: form.bankName.trim(),
      }
    case 'tzs_momo':
      return {
        destinationType: 'tzs_momo',
        momoScheme: form.momoScheme as 'halotel' | 'airtel' | 'tigo' | 'vodacom',
        phoneNumber: form.phoneNumber.trim(),
      }
    case 'mxn_bank':
      return {
        destinationType: 'mxn_bank',
        accountNumber: form.accountNumber.trim(),
      }
    case 'kes_bank':
      return {
        destinationType: 'kes_bank',
        bankCode: form.bankCode.trim(),
        accountNumber: form.accountNumber.trim(),
        bankName: form.bankName.trim(),
      }
    default:
      return null
  }
}

export function destinationTypesForCurrency(currency: string): NuvionDestinationType[] {
  const code = currency.trim().toUpperCase()
  switch (code) {
    case 'USD':
      return ['usd_bank']
    case 'AED':
      return ['aed_bank']
    case 'GHS':
      return ['ghs_bank', 'ghs_momo']
    case 'TZS':
      return ['tzs_bank', 'tzs_momo']
    case 'MXN':
      return ['mxn_bank']
    case 'KES':
      return ['kes_bank']
    default:
      return []
  }
}

export const nuvionRelationshipOptions = [
  { label: 'Vendor', value: 'vendor' },
  { label: 'Supplier', value: 'supplier' },
  { label: 'Customer', value: 'customer' },
  { label: 'Employee', value: 'employee' },
] as const

export const nuvionUsdSchemeOptions = [
  { label: 'ACH', value: 'ach' },
  { label: 'Wire', value: 'wire' },
  { label: 'RTP', value: 'rtp' },
] as const

export const nuvionUsdAccountTypeOptions = [
  { label: 'Checking', value: 'checking' },
  { label: 'Savings', value: 'savings' },
] as const

export const nuvionGhsMomoOptions = [
  { label: 'MTN', value: 'mtn' },
  { label: 'Vodafone', value: 'vodafone' },
  { label: 'Airtel', value: 'airtel' },
] as const

export const nuvionTzsMomoOptions = [
  { label: 'Halotel', value: 'halotel' },
  { label: 'Airtel', value: 'airtel' },
  { label: 'Tigo', value: 'tigo' },
  { label: 'Vodacom', value: 'vodacom' },
] as const
