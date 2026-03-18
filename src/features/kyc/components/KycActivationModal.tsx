import { useEffect, useMemo, useState } from 'react'
import { Button } from '../../../components/ui/Button.tsx'
import { Dialog } from '../../../components/ui/Dialog.tsx'
import { DropdownSelect } from '../../../components/ui/DropdownSelect.tsx'
import { Input } from '../../../components/ui/Input.tsx'
import {
  getResumeStep,
  useKycFlowStore,
  type KycWizardStep,
} from '../../../store/kycFlowStore.ts'
import {
  useAddKycDocumentMutation,
  useAddKycPersonMutation,
  useSubmitKycMutation,
  useUpsertKycBusinessMutation,
} from '../hooks/useKycMutations.ts'
import { useIpCountryCodeQuery } from '../hooks/useIpCountryCodeQuery.ts'
import { useKycDocumentsQuery, useKycPersonsQuery } from '../hooks/useKycQueries.ts'

interface KycActivationModalProps {
  isOpen: boolean
  merchantId: string
  onClose: () => void
}

const stepOrder: KycWizardStep[] = ['business', 'persons', 'documents', 'submit']

const businessTypeOptions = [
  { label: 'Private Limited', value: 'private_limited' },
  { label: 'Sole Proprietorship', value: 'sole_proprietorship' },
  { label: 'Partnership', value: 'partnership' },
]

const personRoleOptions = [
  { label: 'Director', value: 'director' },
  { label: 'UBO', value: 'ubo' },
  { label: 'Authorized Signatory', value: 'authorized_signatory' },
]

const idTypeOptions = [
  { label: 'National ID', value: 'nid' },
  { label: 'Passport', value: 'passport' },
]

const documentTypeOptions = [
  { label: 'Registration Certificate', value: 'registration_certificate' },
  { label: 'Trade License', value: 'trade_license' },
  { label: 'NID', value: 'nid' },
  { label: 'Passport', value: 'passport' },
]

const phoneCodeOptions = [
  { label: 'Bangladesh (+880)', value: '+880', countryCode: 'BD' },
  { label: 'Nigeria (+234)', value: '+234', countryCode: 'NG' },
  { label: 'United States (+1)', value: '+1', countryCode: 'US' },
  { label: 'United Kingdom (+44)', value: '+44', countryCode: 'GB' },
  { label: 'India (+91)', value: '+91', countryCode: 'IN' },
  { label: 'Pakistan (+92)', value: '+92', countryCode: 'PK' },
  { label: 'Canada (+1)', value: '+1', countryCode: 'CA' },
  { label: 'United Arab Emirates (+971)', value: '+971', countryCode: 'AE' },
  { label: 'Saudi Arabia (+966)', value: '+966', countryCode: 'SA' },
  { label: 'South Africa (+27)', value: '+27', countryCode: 'ZA' },
  { label: 'Kenya (+254)', value: '+254', countryCode: 'KE' },
  { label: 'Ghana (+233)', value: '+233', countryCode: 'GH' },
]

const phoneCodeDropdownOptions = phoneCodeOptions.map((option) => ({
  label: option.label,
  value: option.value,
}))

function getDialCodeForCountry(countryCode: string) {
  return phoneCodeOptions.find((option) => option.countryCode === countryCode)?.value
}

function toIsoDate(dateValue: string) {
  if (!dateValue) {
    return undefined
  }
  const iso = new Date(dateValue).toISOString()
  return Number.isNaN(new Date(iso).getTime()) ? undefined : iso
}

function getStepLabel(step: KycWizardStep) {
  if (step === 'business') {
    return 'Business'
  }
  if (step === 'persons') {
    return 'Persons'
  }
  if (step === 'documents') {
    return 'Documents'
  }
  return 'Submit'
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

const requiredInputErrorClassName =
  'border-rose-400 focus:border-rose-500 focus:ring-rose-300/40'

function LoadingButtonLabel({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-(--color-background)/40 border-t-(--color-background)" />
      {label}
    </span>
  )
}

export function KycActivationModal({
  isOpen,
  merchantId,
  onClose,
}: KycActivationModalProps) {
  const merchantProgress = useKycFlowStore(
    (state) => state.progressByMerchant[merchantId],
  )
  const markStepSuccessful = useKycFlowStore((state) => state.markStepSuccessful)
  const markSubmitted = useKycFlowStore((state) => state.markSubmitted)

  const [activeStep, setActiveStep] = useState<KycWizardStep>('business')
  const [businessError, setBusinessError] = useState<string | null>(null)
  const [personError, setPersonError] = useState<string | null>(null)
  const [documentError, setDocumentError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [businessFieldErrors, setBusinessFieldErrors] = useState<{
    legalName?: boolean
    registeredAddress?: boolean
    contactPhone?: boolean
    contactEmail?: boolean
  }>({})
  const [personFieldErrors, setPersonFieldErrors] = useState<{
    fullName?: boolean
    nationality?: boolean
    idNumber?: boolean
    address?: boolean
  }>({})
  const [documentFieldErrors, setDocumentFieldErrors] = useState<{
    fileReference?: boolean
  }>({})
  const [selectedPhoneCode, setSelectedPhoneCode] = useState('+880')

  const [businessForm, setBusinessForm] = useState({
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

  const [personForm, setPersonForm] = useState({
    role: 'director',
    fullName: '',
    nationality: 'BD',
    dateOfBirth: '',
    idType: 'nid',
    idNumber: '',
    address: '',
    ownershipPercentage: '',
  })

  const [documentForm, setDocumentForm] = useState({
    documentType: 'registration_certificate',
    fileReference: '',
    documentNumber: '',
    merchantPersonId: '',
  })

  const businessMutation = useUpsertKycBusinessMutation()
  const addPersonMutation = useAddKycPersonMutation()
  const addDocumentMutation = useAddKycDocumentMutation()
  const submitKycMutation = useSubmitKycMutation()
  const personsQuery = useKycPersonsQuery(isOpen)
  const documentsQuery = useKycDocumentsQuery(isOpen)
  const ipCountryCodeQuery = useIpCountryCodeQuery(isOpen)

  useEffect(() => {
    if (!isOpen) {
      return
    }
    setActiveStep(getResumeStep(merchantProgress))
  }, [isOpen, merchantProgress])

  useEffect(() => {
    if (!isOpen) {
      return
    }
    const countryCode = ipCountryCodeQuery.data
    if (!countryCode) {
      return
    }
    const dialCode = getDialCodeForCountry(countryCode)
    if (dialCode) {
      setSelectedPhoneCode(dialCode)
    }
  }, [ipCountryCodeQuery.data, isOpen])

  useEffect(() => {
    if (personsQuery.data && personsQuery.data.items.length > 0) {
      markStepSuccessful(merchantId, 'persons')
    }
  }, [markStepSuccessful, merchantId, personsQuery.data])

  useEffect(() => {
    if (documentsQuery.data && documentsQuery.data.items.length > 0) {
      markStepSuccessful(merchantId, 'documents')
    }
  }, [documentsQuery.data, markStepSuccessful, merchantId])

  const personCount = personsQuery.data?.items.length ?? 0
  const documentCount = documentsQuery.data?.items.length ?? 0

  const isSubmitted =
    merchantProgress?.isSubmitted || submitKycMutation.data?.status === 'submitted'

  const canAccessPersons =
    merchantProgress?.lastSuccessfulStep === 'business' ||
    merchantProgress?.lastSuccessfulStep === 'persons' ||
    merchantProgress?.lastSuccessfulStep === 'documents' ||
    merchantProgress?.lastSuccessfulStep === 'submit' ||
    activeStep === 'persons'
  const canAccessDocuments =
    merchantProgress?.lastSuccessfulStep === 'business' ||
    merchantProgress?.lastSuccessfulStep === 'persons' ||
    merchantProgress?.lastSuccessfulStep === 'documents' ||
    merchantProgress?.lastSuccessfulStep === 'submit' ||
    activeStep === 'documents'
  const canAccessSubmit =
    documentCount > 0 ||
    merchantProgress?.lastSuccessfulStep === 'documents' ||
    merchantProgress?.lastSuccessfulStep === 'submit' ||
    activeStep === 'submit'

  const availableSteps = useMemo(() => {
    return stepOrder.filter((step) => {
      if (step === 'business') {
        return true
      }
      if (step === 'persons') {
        return canAccessPersons
      }
      if (step === 'documents') {
        return canAccessDocuments
      }
      return canAccessSubmit
    })
  }, [canAccessDocuments, canAccessPersons, canAccessSubmit])

  const nextStepIndex = stepOrder.indexOf(activeStep) + 1
  const nextStep = nextStepIndex < stepOrder.length ? stepOrder[nextStepIndex] : null
  const canMoveNext = nextStep ? availableSteps.includes(nextStep) : false

  async function handleBusinessSubmit() {
    setBusinessError(null)
    const nextBusinessFieldErrors = {
      legalName: businessForm.legalName.trim().length === 0,
      registeredAddress: businessForm.registeredAddress.trim().length === 0,
      contactPhone: businessForm.contactPhone.trim().length === 0,
      contactEmail:
        businessForm.contactEmail.trim().length === 0 ||
        !isValidEmail(businessForm.contactEmail.trim()),
    }
    setBusinessFieldErrors(nextBusinessFieldErrors)

    if (Object.values(nextBusinessFieldErrors).some(Boolean)) {
      setBusinessError('Please fill all required business fields correctly.')
      return
    }

    try {
      await businessMutation.mutateAsync({
        legalName: businessForm.legalName.trim(),
        tradingName: businessForm.tradingName.trim() || undefined,
        businessType: businessForm.businessType,
        registrationNumber: businessForm.registrationNumber.trim() || undefined,
        incorporationDate: toIsoDate(businessForm.incorporationDate),
        industry: businessForm.industry.trim() || undefined,
        registeredAddress: businessForm.registeredAddress.trim(),
        operatingAddress: businessForm.operatingAddress.trim() || undefined,
        taxId: businessForm.taxId.trim() || undefined,
        contactPhone: `${selectedPhoneCode}${businessForm.contactPhone.trim()}`,
        contactEmail: businessForm.contactEmail.trim(),
      })
      markStepSuccessful(merchantId, 'business')
      setActiveStep('persons')
    } catch (error) {
      setBusinessError(
        error instanceof Error
          ? error.message
          : 'Unable to save business profile right now.',
      )
    }
  }

  async function handleAddPerson() {
    setPersonError(null)
    const nextPersonFieldErrors = {
      fullName: personForm.fullName.trim().length === 0,
      nationality: personForm.nationality.trim().length === 0,
      idNumber: personForm.idNumber.trim().length === 0,
      address: personForm.address.trim().length === 0,
    }
    setPersonFieldErrors(nextPersonFieldErrors)

    if (Object.values(nextPersonFieldErrors).some(Boolean)) {
      setPersonError('Please fill all required person fields.')
      return
    }

    try {
      await addPersonMutation.mutateAsync({
        role: personForm.role as 'director' | 'ubo' | 'authorized_signatory',
        fullName: personForm.fullName.trim(),
        nationality: personForm.nationality.trim(),
        dateOfBirth: toIsoDate(personForm.dateOfBirth),
        idType: personForm.idType as 'nid' | 'passport',
        idNumber: personForm.idNumber.trim(),
        address: personForm.address.trim(),
        ownershipPercentage: personForm.ownershipPercentage
          ? Number(personForm.ownershipPercentage)
          : undefined,
      })
      markStepSuccessful(merchantId, 'persons')
      setPersonForm((previous) => ({
        ...previous,
        fullName: '',
        dateOfBirth: '',
        idNumber: '',
        address: '',
        ownershipPercentage: '',
      }))
      setPersonFieldErrors({})
    } catch (error) {
      setPersonError(
        error instanceof Error ? error.message : 'Unable to add person right now.',
      )
    }
  }

  async function handleAddDocument() {
    setDocumentError(null)
    const nextDocumentFieldErrors = {
      fileReference: documentForm.fileReference.trim().length === 0,
    }
    setDocumentFieldErrors(nextDocumentFieldErrors)

    if (Object.values(nextDocumentFieldErrors).some(Boolean)) {
      setDocumentError('Please fill all required document fields.')
      return
    }

    try {
      await addDocumentMutation.mutateAsync({
        documentType: documentForm.documentType,
        fileReference: documentForm.fileReference.trim(),
        documentNumber: documentForm.documentNumber.trim() || undefined,
        merchantPersonId: documentForm.merchantPersonId.trim() || undefined,
      })
      markStepSuccessful(merchantId, 'documents')
      setDocumentForm((previous) => ({
        ...previous,
        fileReference: '',
        documentNumber: '',
      }))
      setDocumentFieldErrors({})
    } catch (error) {
      setDocumentError(
        error instanceof Error ? error.message : 'Unable to add document right now.',
      )
    }
  }

  async function handleSubmitKyc() {
    setSubmitError(null)
    if (!merchantProgress?.lastSuccessfulStep) {
      setSubmitError('Complete the business profile step first.')
      return
    }
    if (documentCount <= 0) {
      setSubmitError('Add at least one document before submitting KYC.')
      return
    }
    try {
      await submitKycMutation.mutateAsync()
      markSubmitted(merchantId)
      setActiveStep('submit')
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'Unable to submit KYC right now.',
      )
    }
  }

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Complete KYC verification"
      description="Submit business details, key persons, and supporting documents to verify your account."
      maxWidthClassName="max-w-xl"
      footer={
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => {
              const previousIndex = Math.max(0, stepOrder.indexOf(activeStep) - 1)
              setActiveStep(stepOrder[previousIndex])
            }}
            disabled={activeStep === 'business'}
            className="px-4"
          >
            Back
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={onClose} className="px-4">
              Save and close
            </Button>
            {activeStep === 'business' ? (
              <Button
                onClick={handleBusinessSubmit}
                disabled={businessMutation.isPending}
                className="px-4"
              >
                {businessMutation.isPending ? (
                  <LoadingButtonLabel label="Saving..." />
                ) : (
                  'Save and continue'
                )}
              </Button>
            ) : nextStep ? (
              <Button
                onClick={() => setActiveStep(nextStep)}
                disabled={!canMoveNext}
                className="px-4"
              >
                Next
              </Button>
            ) : null}
          </div>
        </div>
      }
    >
      <div className="border-b border-(--color-accent)/35 pb-3">
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {stepOrder.map((step, index) => {
              const isActive = step === activeStep
              const isDone =
                merchantProgress?.isSubmitted ||
                (merchantProgress?.lastSuccessfulStep
                  ? stepOrder.indexOf(merchantProgress.lastSuccessfulStep) >= index
                  : false)
              const isLocked = !availableSteps.includes(step) && !isActive

              return (
                <button
                  key={step}
                  type="button"
                  onClick={() => {
                    if (!isLocked) {
                      setActiveStep(step)
                    }
                  }}
                  disabled={isLocked}
                  className={`rounded-lg border px-3 py-2 text-left [font-family:var(--font-body)] text-sm transition ${
                    isActive
                      ? 'border-(--color-primary) bg-(--color-primary) text-(--color-background)'
                      : isDone
                        ? 'border-(--color-accent)/60 bg-(--color-card) text-(--color-foreground)'
                        : 'border-(--color-accent)/35 bg-(--color-background)/50 text-(--color-secondary)'
                  } ${isLocked ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
                >
                  <p className="text-xs uppercase tracking-wide opacity-80">
                    Step {index + 1}
                  </p>
                  <p className="mt-1 font-semibold">{getStepLabel(step)}</p>
                </button>
              )
            })}
          </div>
      </div>

      <div className="pt-4">
          {activeStep === 'business' ? (
            <section className="space-y-4">
              <div>
                <h3 className="[font-family:var(--font-display)] text-xl font-semibold text-(--color-foreground)">
                  Business profile
                </h3>
                <p className="mt-1 [font-family:var(--font-body)] text-sm text-(--color-secondary)">
                  Provide official business details exactly as they appear on your
                  registration documents.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-(--color-secondary)">
                    Legal name *
                  </span>
                  <Input
                    value={businessForm.legalName}
                    onChange={(event) =>
                      {
                        setBusinessForm((previous) => ({
                          ...previous,
                          legalName: event.target.value,
                        }))
                        if (businessFieldErrors.legalName) {
                          setBusinessFieldErrors((previous) => ({
                            ...previous,
                            legalName: false,
                          }))
                        }
                      }
                    }
                    className={
                      businessFieldErrors.legalName
                        ? requiredInputErrorClassName
                        : undefined
                    }
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-(--color-secondary)">
                    Trading name
                  </span>
                  <Input
                    value={businessForm.tradingName}
                    onChange={(event) =>
                      setBusinessForm((previous) => ({
                        ...previous,
                        tradingName: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-(--color-secondary)">
                    Business type *
                  </span>
                  <DropdownSelect
                    options={businessTypeOptions}
                    value={businessForm.businessType}
                    onChange={(nextValue) =>
                      setBusinessForm((previous) => ({
                        ...previous,
                        businessType: nextValue,
                      }))
                    }
                    ariaLabel="Business type"
                    className="w-full"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-(--color-secondary)">
                    Registration number
                  </span>
                  <Input
                    value={businessForm.registrationNumber}
                    onChange={(event) =>
                      setBusinessForm((previous) => ({
                        ...previous,
                        registrationNumber: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-(--color-secondary)">
                    Incorporation date
                  </span>
                  <Input
                    type="date"
                    value={businessForm.incorporationDate}
                    onChange={(event) =>
                      setBusinessForm((previous) => ({
                        ...previous,
                        incorporationDate: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-(--color-secondary)">
                    Industry
                  </span>
                  <Input
                    value={businessForm.industry}
                    onChange={(event) =>
                      setBusinessForm((previous) => ({
                        ...previous,
                        industry: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="space-y-1 sm:col-span-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-(--color-secondary)">
                    Registered address *
                  </span>
                  <Input
                    value={businessForm.registeredAddress}
                    onChange={(event) =>
                      {
                        setBusinessForm((previous) => ({
                          ...previous,
                          registeredAddress: event.target.value,
                        }))
                        if (businessFieldErrors.registeredAddress) {
                          setBusinessFieldErrors((previous) => ({
                            ...previous,
                            registeredAddress: false,
                          }))
                        }
                      }
                    }
                    className={
                      businessFieldErrors.registeredAddress
                        ? requiredInputErrorClassName
                        : undefined
                    }
                  />
                </label>
                <label className="space-y-1 sm:col-span-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-(--color-secondary)">
                    Operating address
                  </span>
                  <Input
                    value={businessForm.operatingAddress}
                    onChange={(event) =>
                      setBusinessForm((previous) => ({
                        ...previous,
                        operatingAddress: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-(--color-secondary)">
                    Tax ID
                  </span>
                  <Input
                    value={businessForm.taxId}
                    onChange={(event) =>
                      setBusinessForm((previous) => ({
                        ...previous,
                        taxId: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-(--color-secondary)">
                    Contact phone *
                  </span>
                  <div className="grid gap-2 sm:grid-cols-[200px_1fr]">
                    <DropdownSelect
                      options={phoneCodeDropdownOptions}
                      value={selectedPhoneCode}
                      onChange={setSelectedPhoneCode}
                      ariaLabel="Phone country code"
                      className="w-full"
                    />
                    <Input
                      value={businessForm.contactPhone}
                      onChange={(event) =>
                        {
                          setBusinessForm((previous) => ({
                            ...previous,
                            contactPhone: event.target.value,
                          }))
                          if (businessFieldErrors.contactPhone) {
                            setBusinessFieldErrors((previous) => ({
                              ...previous,
                              contactPhone: false,
                            }))
                          }
                        }
                      }
                      placeholder="Phone number"
                      className={
                        businessFieldErrors.contactPhone
                          ? requiredInputErrorClassName
                          : undefined
                      }
                    />
                  </div>
                </label>
                <label className="space-y-1 sm:col-span-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-(--color-secondary)">
                    Contact email *
                  </span>
                  <Input
                    type="email"
                    value={businessForm.contactEmail}
                    onChange={(event) =>
                      {
                        setBusinessForm((previous) => ({
                          ...previous,
                          contactEmail: event.target.value,
                        }))
                        if (businessFieldErrors.contactEmail) {
                          setBusinessFieldErrors((previous) => ({
                            ...previous,
                            contactEmail: false,
                          }))
                        }
                      }
                    }
                    className={
                      businessFieldErrors.contactEmail
                        ? requiredInputErrorClassName
                        : undefined
                    }
                  />
                </label>
              </div>

              {businessError ? (
                <p className="text-sm text-rose-600">{businessError}</p>
              ) : null}
            </section>
          ) : null}

          {activeStep === 'persons' ? (
            <section className="space-y-4">
              <div>
                <h3 className="[font-family:var(--font-display)] text-xl font-semibold text-(--color-foreground)">
                  Directors and beneficial owners
                </h3>
                <p className="mt-1 [font-family:var(--font-body)] text-sm text-(--color-secondary)">
                  Add key individuals responsible for operations and ownership.
                  This step is optional and can be skipped.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-(--color-secondary)">
                    Role *
                  </span>
                  <DropdownSelect
                    options={personRoleOptions}
                    value={personForm.role}
                    onChange={(nextValue) =>
                      setPersonForm((previous) => ({
                        ...previous,
                        role: nextValue,
                      }))
                    }
                    ariaLabel="Person role"
                    className="w-full"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-(--color-secondary)">
                    Full name *
                  </span>
                  <Input
                    value={personForm.fullName}
                    onChange={(event) =>
                      {
                        setPersonForm((previous) => ({
                          ...previous,
                          fullName: event.target.value,
                        }))
                        if (personFieldErrors.fullName) {
                          setPersonFieldErrors((previous) => ({
                            ...previous,
                            fullName: false,
                          }))
                        }
                      }
                    }
                    className={
                      personFieldErrors.fullName
                        ? requiredInputErrorClassName
                        : undefined
                    }
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-(--color-secondary)">
                    Nationality *
                  </span>
                  <Input
                    value={personForm.nationality}
                    onChange={(event) =>
                      {
                        setPersonForm((previous) => ({
                          ...previous,
                          nationality: event.target.value,
                        }))
                        if (personFieldErrors.nationality) {
                          setPersonFieldErrors((previous) => ({
                            ...previous,
                            nationality: false,
                          }))
                        }
                      }
                    }
                    className={
                      personFieldErrors.nationality
                        ? requiredInputErrorClassName
                        : undefined
                    }
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-(--color-secondary)">
                    Date of birth
                  </span>
                  <Input
                    type="date"
                    value={personForm.dateOfBirth}
                    onChange={(event) =>
                      setPersonForm((previous) => ({
                        ...previous,
                        dateOfBirth: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-(--color-secondary)">
                    ID type *
                  </span>
                  <DropdownSelect
                    options={idTypeOptions}
                    value={personForm.idType}
                    onChange={(nextValue) =>
                      setPersonForm((previous) => ({
                        ...previous,
                        idType: nextValue,
                      }))
                    }
                    ariaLabel="Person ID type"
                    className="w-full"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-(--color-secondary)">
                    ID number *
                  </span>
                  <Input
                    value={personForm.idNumber}
                    onChange={(event) =>
                      {
                        setPersonForm((previous) => ({
                          ...previous,
                          idNumber: event.target.value,
                        }))
                        if (personFieldErrors.idNumber) {
                          setPersonFieldErrors((previous) => ({
                            ...previous,
                            idNumber: false,
                          }))
                        }
                      }
                    }
                    className={
                      personFieldErrors.idNumber
                        ? requiredInputErrorClassName
                        : undefined
                    }
                  />
                </label>
                <label className="space-y-1 sm:col-span-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-(--color-secondary)">
                    Address *
                  </span>
                  <Input
                    value={personForm.address}
                    onChange={(event) =>
                      {
                        setPersonForm((previous) => ({
                          ...previous,
                          address: event.target.value,
                        }))
                        if (personFieldErrors.address) {
                          setPersonFieldErrors((previous) => ({
                            ...previous,
                            address: false,
                          }))
                        }
                      }
                    }
                    className={
                      personFieldErrors.address
                        ? requiredInputErrorClassName
                        : undefined
                    }
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-(--color-secondary)">
                    Ownership %
                  </span>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={personForm.ownershipPercentage}
                    onChange={(event) =>
                      setPersonForm((previous) => ({
                        ...previous,
                        ownershipPercentage: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={handleAddPerson}
                  disabled={addPersonMutation.isPending}
                  className="px-4"
                >
                  {addPersonMutation.isPending ? (
                    <LoadingButtonLabel label="Adding..." />
                  ) : (
                    'Add person'
                  )}
                </Button>
                <span className="text-sm text-(--color-secondary)">
                  {personCount} person{personCount === 1 ? '' : 's'} added
                </span>
              </div>

              {personError ? <p className="text-sm text-rose-600">{personError}</p> : null}

              <div className="rounded-lg border border-(--color-accent)/35 bg-(--color-card)">
                <div className="grid grid-cols-[1.3fr_1fr_0.8fr] gap-2 border-b border-(--color-accent)/35 px-3 py-2 text-xs uppercase tracking-wide text-(--color-secondary)">
                  <p>Name</p>
                  <p>Role</p>
                  <p>Status</p>
                </div>
                <div className="max-h-40 overflow-y-auto">
                  {(personsQuery.data?.items ?? []).map((person) => (
                    <div
                      key={person.id}
                      className="grid grid-cols-[1.3fr_1fr_0.8fr] gap-2 border-b border-(--color-accent)/20 px-3 py-2 text-sm text-(--color-foreground) last:border-b-0"
                    >
                      <p>{person.fullName}</p>
                      <p>{person.role}</p>
                      <p>{person.status}</p>
                    </div>
                  ))}
                  {!personsQuery.isPending && personCount === 0 ? (
                    <p className="px-3 py-3 text-sm text-(--color-secondary)">
                      No persons added yet.
                    </p>
                  ) : null}
                </div>
              </div>
            </section>
          ) : null}

          {activeStep === 'documents' ? (
            <section className="space-y-4">
              <div>
                <h3 className="[font-family:var(--font-display)] text-xl font-semibold text-(--color-foreground)">
                  Supporting documents
                </h3>
                <p className="mt-1 [font-family:var(--font-body)] text-sm text-(--color-secondary)">
                  Upload references to your legal and identity documents. If a
                  document belongs to a person, include their person ID.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-(--color-secondary)">
                    Document type *
                  </span>
                  <DropdownSelect
                    options={documentTypeOptions}
                    value={documentForm.documentType}
                    onChange={(nextValue) =>
                      setDocumentForm((previous) => ({
                        ...previous,
                        documentType: nextValue,
                      }))
                    }
                    ariaLabel="Document type"
                    className="w-full"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-(--color-secondary)">
                    Document number
                  </span>
                  <Input
                    value={documentForm.documentNumber}
                    onChange={(event) =>
                      setDocumentForm((previous) => ({
                        ...previous,
                        documentNumber: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="space-y-1 sm:col-span-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-(--color-secondary)">
                    File reference *
                  </span>
                  <Input
                    placeholder="s3://bucket/path/file.pdf"
                    value={documentForm.fileReference}
                    onChange={(event) =>
                      {
                        setDocumentForm((previous) => ({
                          ...previous,
                          fileReference: event.target.value,
                        }))
                        if (documentFieldErrors.fileReference) {
                          setDocumentFieldErrors((previous) => ({
                            ...previous,
                            fileReference: false,
                          }))
                        }
                      }
                    }
                    className={
                      documentFieldErrors.fileReference
                        ? requiredInputErrorClassName
                        : undefined
                    }
                  />
                </label>
                <label className="space-y-1 sm:col-span-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-(--color-secondary)">
                    Person link (optional)
                  </span>
                  <Input
                    placeholder="merchantPersonId"
                    value={documentForm.merchantPersonId}
                    onChange={(event) =>
                      setDocumentForm((previous) => ({
                        ...previous,
                        merchantPersonId: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={handleAddDocument}
                  disabled={addDocumentMutation.isPending}
                  className="px-4"
                >
                  {addDocumentMutation.isPending ? (
                    <LoadingButtonLabel label="Adding..." />
                  ) : (
                    'Add document'
                  )}
                </Button>
                <span className="text-sm text-(--color-secondary)">
                  {documentCount} document{documentCount === 1 ? '' : 's'} added
                </span>
              </div>

              {documentError ? (
                <p className="text-sm text-rose-600">{documentError}</p>
              ) : null}

              <div className="rounded-lg border border-(--color-accent)/35 bg-(--color-card)">
                <div className="grid grid-cols-[1.2fr_1fr_1fr] gap-2 border-b border-(--color-accent)/35 px-3 py-2 text-xs uppercase tracking-wide text-(--color-secondary)">
                  <p>Type</p>
                  <p>Status</p>
                  <p>Submitted at</p>
                </div>
                <div className="max-h-40 overflow-y-auto">
                  {(documentsQuery.data?.items ?? []).map((document) => (
                    <div
                      key={document.id}
                      className="grid grid-cols-[1.2fr_1fr_1fr] gap-2 border-b border-(--color-accent)/20 px-3 py-2 text-sm text-(--color-foreground) last:border-b-0"
                    >
                      <p>{document.documentType}</p>
                      <p>{document.status}</p>
                      <p>{document.submittedAt ? document.submittedAt : '-'}</p>
                    </div>
                  ))}
                  {!documentsQuery.isPending && documentCount === 0 ? (
                    <p className="px-3 py-3 text-sm text-(--color-secondary)">
                      No documents added yet.
                    </p>
                  ) : null}
                </div>
              </div>
            </section>
          ) : null}

          {activeStep === 'submit' ? (
            <section className="space-y-4">
              <div>
                <h3 className="[font-family:var(--font-display)] text-xl font-semibold text-(--color-foreground)">
                  Submit for verification
                </h3>
                <p className="mt-1 [font-family:var(--font-body)] text-sm text-(--color-secondary)">
                  Final check before submission. Our compliance team will review
                  your KYC package once you submit.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-(--color-accent)/35 bg-(--color-card) p-3">
                  <p className="text-xs uppercase tracking-wide text-(--color-secondary)">
                    Business
                  </p>
                  <p className="mt-1 text-sm font-semibold text-(--color-foreground)">
                    {merchantProgress?.lastSuccessfulStep ? 'Saved' : 'Pending'}
                  </p>
                </div>
                <div className="rounded-lg border border-(--color-accent)/35 bg-(--color-card) p-3">
                  <p className="text-xs uppercase tracking-wide text-(--color-secondary)">
                    Persons
                  </p>
                  <p className="mt-1 text-sm font-semibold text-(--color-foreground)">
                    {personCount} added
                  </p>
                </div>
                <div className="rounded-lg border border-(--color-accent)/35 bg-(--color-card) p-3">
                  <p className="text-xs uppercase tracking-wide text-(--color-secondary)">
                    Documents
                  </p>
                  <p className="mt-1 text-sm font-semibold text-(--color-foreground)">
                    {documentCount} added
                  </p>
                </div>
              </div>

              {isSubmitted ? (
                <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 [font-family:var(--font-body)] text-sm text-amber-800">
                  Pending verification. Your KYC submission is under review.
                </div>
              ) : (
                <Button
                  onClick={handleSubmitKyc}
                  disabled={submitKycMutation.isPending}
                  className="px-4"
                >
                  {submitKycMutation.isPending ? (
                    <LoadingButtonLabel label="Submitting..." />
                  ) : (
                    'Submit KYC'
                  )}
                </Button>
              )}

              {submitError ? <p className="text-sm text-rose-600">{submitError}</p> : null}
            </section>
          ) : null}
      </div>
    </Dialog>
  )
}
