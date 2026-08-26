import type { KycBusinessDetail } from '../services/kycSchemas.ts'

export type KycBusinessFormState = {
  legalName: string
  tradingName: string
  businessType: string
  registrationNumber: string
  incorporationDate: string
  industry: string
  registeredAddress: string
  operatingAddress: string
  taxId: string
  contactPhone: string
  contactEmail: string
}

export const emptyKycBusinessForm = (): KycBusinessFormState => ({
  legalName: '',
  tradingName: '',
  businessType: 'private_limited',
  registrationNumber: '',
  incorporationDate: '',
  industry: '',
  registeredAddress: '',
  operatingAddress: '',
  taxId: '',
  contactPhone: '',
  contactEmail: '',
})

function draftStorageKey(merchantId: string) {
  return `transacty-kyc-business-draft:${merchantId}`
}

export function readKycBusinessDraft(merchantId: string): {
  form: KycBusinessFormState
  phoneCode: string
} | null {
  try {
    const raw = localStorage.getItem(draftStorageKey(merchantId))
    if (!raw) {
      return null
    }
    const parsed = JSON.parse(raw) as {
      form?: Partial<KycBusinessFormState>
      phoneCode?: string
    }
    if (!parsed.form) {
      return null
    }
    return {
      form: { ...emptyKycBusinessForm(), ...parsed.form },
      phoneCode: parsed.phoneCode ?? '+880',
    }
  } catch {
    return null
  }
}

export function writeKycBusinessDraft(
  merchantId: string,
  form: KycBusinessFormState,
  phoneCode: string,
) {
  localStorage.setItem(
    draftStorageKey(merchantId),
    JSON.stringify({ form, phoneCode }),
  )
}

export function toDateInputValue(value: string | null | undefined) {
  if (!value) {
    return ''
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }
  return date.toISOString().slice(0, 10)
}

export function splitContactPhone(
  fullPhone: string,
  dialCodes: string[],
): { phoneCode: string; contactPhone: string } {
  const trimmed = fullPhone.trim()
  const sorted = [...dialCodes].sort((a, b) => b.length - a.length)
  for (const code of sorted) {
    if (trimmed.startsWith(code)) {
      return {
        phoneCode: code,
        contactPhone: trimmed.slice(code.length).trim(),
      }
    }
  }
  return { phoneCode: '+880', contactPhone: trimmed }
}

type BusinessSource = {
  legalName?: string | null
  tradingName?: string | null
  businessType?: string | null
  registrationNumber?: string | null
  incorporationDate?: string | null
  industry?: string | null
  registeredAddress?: string | null
  operatingAddress?: string | null
  taxId?: string | null
  contactPhone?: string | null
  contactEmail?: string | null
}

export function mapBusinessSourceToForm(
  source: BusinessSource,
  fallbackEmail?: string | null,
): KycBusinessFormState {
  return {
    legalName: source.legalName?.trim() ?? '',
    tradingName: source.tradingName?.trim() ?? '',
    businessType: source.businessType?.trim() || 'private_limited',
    registrationNumber: source.registrationNumber?.trim() ?? '',
    incorporationDate: toDateInputValue(source.incorporationDate),
    industry: source.industry?.trim() ?? '',
    registeredAddress: source.registeredAddress?.trim() ?? '',
    operatingAddress: source.operatingAddress?.trim() ?? '',
    taxId: source.taxId?.trim() ?? '',
    contactPhone: '',
    contactEmail:
      source.contactEmail?.trim() || fallbackEmail?.trim() || '',
  }
}

export function pickRichestBusinessSource(params: {
  apiBusiness: KycBusinessDetail | null | undefined
  draft: ReturnType<typeof readKycBusinessDraft>
  profileBusiness: BusinessSource | null | undefined
  profileEmail?: string | null
}): {
  form: KycBusinessFormState
  phoneCode: string
  contactPhoneRaw?: string
} {
  const { apiBusiness, draft, profileBusiness, profileEmail } = params

  const profileForm = profileBusiness?.legalName
    ? mapBusinessSourceToForm(profileBusiness, profileEmail)
    : {
        ...emptyKycBusinessForm(),
        contactEmail: profileEmail?.trim() ?? '',
      }
  const apiForm =
    apiBusiness && (apiBusiness.legalName || apiBusiness.registeredAddress)
      ? mapBusinessSourceToForm(apiBusiness, profileEmail)
      : null

  const merged = emptyKycBusinessForm()
  const layers = [profileForm, draft?.form, apiForm].filter(Boolean) as KycBusinessFormState[]
  for (const layer of layers) {
    for (const key of Object.keys(merged) as Array<keyof KycBusinessFormState>) {
      const value = layer[key]?.trim?.() ? layer[key] : layer[key]
      if (typeof value === 'string' && value.trim().length > 0) {
        merged[key] = value
      }
    }
  }

  return {
    form: merged,
    phoneCode: draft?.phoneCode ?? '+880',
    contactPhoneRaw:
      apiBusiness?.contactPhone?.trim() ||
      profileBusiness?.contactPhone?.trim() ||
      undefined,
  }
}
