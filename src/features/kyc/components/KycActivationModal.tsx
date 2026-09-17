import { useEffect, useMemo, useState, type ComponentType } from 'react'
import { Button } from '../../../components/ui/Button.tsx'
import { Dialog } from '../../../components/ui/Dialog.tsx'
import { DropdownSelect } from '../../../components/ui/DropdownSelect.tsx'
import { FileUploadDropzone } from '../../../components/ui/FileUploadDropzone.tsx'
import { Input } from '../../../components/ui/Input.tsx'
import {
  getResumeStep,
  useKycFlowStore,
  type KycWizardStep,
} from '../../../store/kycFlowStore.ts'
import {
  useAddKycDocumentMutation,
  useAddKycPersonMutation,
  useCreateKycDocumentUploadUrlMutation,
  useSubmitKycMutation,
  useUpsertKycBusinessMutation,
} from '../hooks/useKycMutations.ts'
import { useProfileQuery } from '../../dashboard/hooks/useProfileQuery.ts'
import { useIpCountryCodeQuery } from '../hooks/useIpCountryCodeQuery.ts'
import { useKycDocumentsQuery, useKycPersonsQuery, useKycBusinessQuery } from '../hooks/useKycQueries.ts'
import { uploadDocumentToSignedUrl } from '../services/kycService.ts'
import {
  DOCUMENT_UPLOAD_POLICY,
  validateUpload,
} from '../../../utils/fileUploadPolicy.ts'
import {
  getPersonFormErrorMessage,
  getPersonFormFieldErrors,
  isDuplicatePerson,
} from '../services/kycPersonValidation.ts'
import {
  emptyKycBusinessForm,
  pickRichestBusinessSource,
  readKycBusinessDraft,
  splitContactPhone,
  writeKycBusinessDraft,
} from '../utils/kycBusinessFormUtils.ts'
import {
  KybIconArrowRight,
  KybIconBuilding,
  KybIconCheck,
  KybIconDocument,
  KybIconGlobe,
  KybIconInfo,
  KybIconPeople,
  KybIconPhone,
  KybIconShield,
} from './kycWizardIcons.tsx'

interface KycActivationModalProps {
  isOpen: boolean
  merchantId: string
  onClose: () => void
  kycStatus?: 'pending' | 'verified' | 'rejected'
  businessProfileStatus?: string
}

const stepOrder: KycWizardStep[] = ['business', 'persons', 'documents', 'submit']

const stepMeta: Array<{
  id: KycWizardStep
  label: string
  estimate: string
  Icon: ComponentType<{ className?: string }>
}> = [
  { id: 'business', label: 'Business', estimate: '~4 min', Icon: KybIconBuilding },
  { id: 'persons', label: 'Directors', estimate: '~5 min', Icon: KybIconPeople },
  { id: 'documents', label: 'Documents', estimate: '~3 min', Icon: KybIconDocument },
  { id: 'submit', label: 'Review', estimate: '~1 min', Icon: KybIconCheck },
]

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

const nationalityOptions = phoneCodeOptions.map((option) => ({
  label: option.label.replace(/\s\(\+\d+\)$/, ''),
  value: option.countryCode,
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
    return 'Directors'
  }
  if (step === 'documents') {
    return 'Documents'
  }
  return 'Review'
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function toTitleCaseFromSnake(value: string) {
  return value
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
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

function PrimaryCtaLabel({
  label,
  showArrow,
}: {
  label: string
  showArrow?: boolean
}) {
  return (
    <span className="inline-flex items-center gap-2">
      {label}
      {showArrow ? <KybIconArrowRight className="h-4 w-4" /> : null}
    </span>
  )
}

export function KycActivationModal({
  isOpen,
  merchantId,
  onClose,
  kycStatus,
  businessProfileStatus,
}: KycActivationModalProps) {
  const merchantProgress = useKycFlowStore(
    (state) => state.progressByMerchant[merchantId],
  )
  const markStepSuccessful = useKycFlowStore((state) => state.markStepSuccessful)
  const markSubmitted = useKycFlowStore((state) => state.markSubmitted)
  const resetMerchantProgress = useKycFlowStore(
    (state) => state.resetMerchantProgress,
  )

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
    dateOfBirth?: boolean
    idNumber?: boolean
    address?: boolean
  }>({})
  const [documentFieldErrors, setDocumentFieldErrors] = useState<{
    selectedFile?: boolean
  }>({})
  const [selectedPhoneCode, setSelectedPhoneCode] = useState('+880')
  const [selectedDocumentFile, setSelectedDocumentFile] = useState<File | null>(null)
  const [isUploadingDocument, setIsUploadingDocument] = useState(false)
  const [reviewDocumentNames, setReviewDocumentNames] = useState<string[]>([])

  const [businessForm, setBusinessForm] = useState(emptyKycBusinessForm)
  const [hasHydratedBusiness, setHasHydratedBusiness] = useState(false)

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
    documentNumber: '',
    merchantPersonId: '',
  })

  const businessMutation = useUpsertKycBusinessMutation()
  const addPersonMutation = useAddKycPersonMutation()
  const addDocumentMutation = useAddKycDocumentMutation()
  const createDocumentUploadUrlMutation = useCreateKycDocumentUploadUrlMutation()
  const submitKycMutation = useSubmitKycMutation()
  const profileQuery = useProfileQuery(isOpen)
  const resolvedKycStatus = kycStatus ?? profileQuery.data?.kycStatus
  const resolvedBusinessProfileStatus =
    businessProfileStatus ?? profileQuery.data?.businessProfile?.status
  const isKycOrKybRejected =
    resolvedKycStatus === 'rejected' || resolvedBusinessProfileStatus === 'rejected'
  const personsQuery = useKycPersonsQuery(isOpen)
  const documentsQuery = useKycDocumentsQuery(isOpen)
  const businessQuery = useKycBusinessQuery(isOpen)
  const ipCountryCodeQuery = useIpCountryCodeQuery(isOpen)

  useEffect(() => {
    if (!isOpen) {
      setHasHydratedBusiness(false)
      return
    }
    if (isKycOrKybRejected) {
      resetMerchantProgress(merchantId)
      setActiveStep('business')
      return
    }
    setActiveStep(getResumeStep(merchantProgress))
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only resume step when modal opens
  }, [isOpen, merchantId])

  useEffect(() => {
    if (!isOpen || isKycOrKybRejected) {
      return
    }

    const hasBusiness =
      Boolean(businessQuery.data?.legalName) ||
      Boolean(profileQuery.data?.businessProfile?.legalName) ||
      Boolean(readKycBusinessDraft(merchantId)?.form.legalName)
    const hasPersons =
      (personsQuery.data?.items.length ?? 0) > 0 ||
      (profileQuery.data?.personsCount ?? 0) > 0
    const hasDocuments =
      (documentsQuery.data?.items.length ?? 0) > 0 ||
      (profileQuery.data?.documentsCount ?? 0) > 0

    if (hasBusiness) {
      markStepSuccessful(merchantId, 'business')
    }
    if (hasPersons) {
      markStepSuccessful(merchantId, 'persons')
    }
    if (hasDocuments) {
      markStepSuccessful(merchantId, 'documents')
    }
  }, [
    businessQuery.data,
    documentsQuery.data,
    isKycOrKybRejected,
    isOpen,
    markStepSuccessful,
    merchantId,
    personsQuery.data,
    profileQuery.data?.businessProfile?.legalName,
    profileQuery.data?.documentsCount,
    profileQuery.data?.personsCount,
  ])

  useEffect(() => {
    if (!isOpen) {
      return
    }
    if (hasHydratedBusiness) {
      return
    }
    if (businessQuery.isLoading || profileQuery.isLoading) {
      return
    }
    if (!businessQuery.isFetched || !profileQuery.isFetched) {
      return
    }

    const draft = readKycBusinessDraft(merchantId)
    const picked = pickRichestBusinessSource({
      apiBusiness: businessQuery.data,
      draft,
      profileBusiness: profileQuery.data?.businessProfile,
      profileEmail: profileQuery.data?.email,
    })

    let nextForm = picked.form
    let nextPhoneCode = picked.phoneCode

    if (picked.contactPhoneRaw) {
      const split = splitContactPhone(
        picked.contactPhoneRaw,
        phoneCodeOptions.map((option) => option.value),
      )
      nextPhoneCode = split.phoneCode
      nextForm = {
        ...nextForm,
        contactPhone: split.contactPhone || nextForm.contactPhone,
      }
    }

    setBusinessForm(nextForm)
    setSelectedPhoneCode(nextPhoneCode)
    setHasHydratedBusiness(true)
  }, [
    businessQuery.data,
    businessQuery.isFetched,
    businessQuery.isLoading,
    hasHydratedBusiness,
    isOpen,
    merchantId,
    profileQuery.data?.businessProfile,
    profileQuery.data?.email,
    profileQuery.isFetched,
    profileQuery.isLoading,
  ])

  useEffect(() => {
    if (!isOpen) {
      return
    }
    // Only seed dial code from IP when the user has no saved phone yet.
    if (hasHydratedBusiness && businessForm.contactPhone.trim().length > 0) {
      return
    }
    const countryCode = ipCountryCodeQuery.data
    if (!countryCode) {
      return
    }
    const dialCode = getDialCodeForCountry(countryCode)
    if (dialCode && !businessForm.contactPhone.trim()) {
      setSelectedPhoneCode(dialCode)
    }
  }, [
    businessForm.contactPhone,
    hasHydratedBusiness,
    ipCountryCodeQuery.data,
    isOpen,
  ])

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

  const isPendingVerification =
    !isKycOrKybRejected &&
    (submitKycMutation.data?.status === 'submitted' ||
      (resolvedKycStatus === 'pending' &&
        resolvedBusinessProfileStatus === 'submitted'))

  const canAccessPersons =
    merchantProgress?.lastSuccessfulStep === 'business' ||
    merchantProgress?.lastSuccessfulStep === 'persons' ||
    merchantProgress?.lastSuccessfulStep === 'documents' ||
    merchantProgress?.lastSuccessfulStep === 'submit' ||
    activeStep === 'persons'
  const canAccessDocuments =
    personCount > 0 ||
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

  const stepIndex = stepOrder.indexOf(activeStep)
  const progressPercent = ((stepIndex + 1) / stepOrder.length) * 100
  const nextStepIndex = stepIndex + 1
  const nextStep = nextStepIndex < stepOrder.length ? stepOrder[nextStepIndex] : null
  const canMoveNext = nextStep ? availableSteps.includes(nextStep) : false
  const isAddingDocumentPending =
    addDocumentMutation.isPending ||
    createDocumentUploadUrlMutation.isPending ||
    isUploadingDocument

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
      const payload = {
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
      }
      await businessMutation.mutateAsync(payload)
      writeKycBusinessDraft(merchantId, businessForm, selectedPhoneCode)
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
    const nextPersonFieldErrors = getPersonFormFieldErrors({
      fullName: personForm.fullName,
      nationality: personForm.nationality,
      dateOfBirth: personForm.dateOfBirth,
      idNumber: personForm.idNumber,
      address: personForm.address,
    })
    setPersonFieldErrors(nextPersonFieldErrors)

    const existingPeople = personsQuery.data?.items ?? []
    const isDuplicate = isDuplicatePerson(existingPeople, {
      fullName: personForm.fullName,
      role: personForm.role,
      idNumber: personForm.idNumber,
    })

    const validationMessage = getPersonFormErrorMessage(
      {
        fullName: personForm.fullName,
        nationality: personForm.nationality,
        dateOfBirth: personForm.dateOfBirth,
        idNumber: personForm.idNumber,
        address: personForm.address,
      },
      nextPersonFieldErrors,
      { isDuplicate },
    )
    if (validationMessage) {
      setPersonError(validationMessage)
      return
    }

    try {
      await addPersonMutation.mutateAsync({
        role: personForm.role as 'director' | 'ubo' | 'authorized_signatory',
        fullName: personForm.fullName.trim(),
        nationality: personForm.nationality.trim(),
        dateOfBirth: toIsoDate(personForm.dateOfBirth) as string,
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
      setActiveStep('documents')
    } catch (error) {
      setPersonError(
        error instanceof Error ? error.message : 'Unable to add person right now.',
      )
    }
  }

  async function handleAddDocument() {
    setDocumentError(null)
    const nextDocumentFieldErrors = {
      selectedFile: !selectedDocumentFile,
    }
    setDocumentFieldErrors(nextDocumentFieldErrors)

    if (Object.values(nextDocumentFieldErrors).some(Boolean)) {
      setDocumentError('Please fill all required document fields.')
      return
    }

    if (!selectedDocumentFile) {
      setDocumentError('Please select a file to upload.')
      return
    }

    // Validate the file's actual bytes before anything is uploaded, and send
    // the verified type rather than the browser-reported file.type.
    const validation = await validateUpload(
      selectedDocumentFile,
      DOCUMENT_UPLOAD_POLICY,
    )
    if (!validation.ok) {
      setDocumentError(validation.error)
      setDocumentFieldErrors((previous) => ({ ...previous, selectedFile: true }))
      return
    }

    try {
      const uploadUrlData = await createDocumentUploadUrlMutation.mutateAsync({
        documentType: documentForm.documentType,
        filename: selectedDocumentFile.name,
        contentType: validation.mimeType,
        merchantPersonId: documentForm.merchantPersonId.trim() || undefined,
      })

      setIsUploadingDocument(true)
      await uploadDocumentToSignedUrl({
        bucket: uploadUrlData.bucket,
        path: uploadUrlData.path,
        uploadToken: uploadUrlData.uploadToken,
        file: selectedDocumentFile,
      })
      setIsUploadingDocument(false)

      await addDocumentMutation.mutateAsync({
        documentType: documentForm.documentType,
        fileReference: uploadUrlData.fileReference,
        documentNumber: documentForm.documentNumber.trim() || undefined,
        merchantPersonId: documentForm.merchantPersonId.trim() || undefined,
      })
      setReviewDocumentNames((previous) => [...previous, selectedDocumentFile.name])
      markStepSuccessful(merchantId, 'documents')
      setDocumentForm((previous) => ({
        ...previous,
        documentNumber: '',
      }))
      setSelectedDocumentFile(null)
      setDocumentFieldErrors({})
    } catch (error) {
      setIsUploadingDocument(false)
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
    if (personCount <= 0) {
      setSubmitError('Add at least one person before submitting KYC.')
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

  const reviewPersonNames = (personsQuery.data?.items ?? []).map(
    (person) => person.fullName,
  )
  const reviewDocumentLabels =
    reviewDocumentNames.length > 0
      ? reviewDocumentNames
      : (documentsQuery.data?.items ?? []).map((document) =>
          toTitleCaseFromSnake(document.documentType),
        )

  function renderPrimaryCta() {
    if (activeStep === 'business') {
      return (
        <Button
          onClick={handleBusinessSubmit}
          disabled={businessMutation.isPending}
          className="px-4"
        >
          {businessMutation.isPending ? (
            <LoadingButtonLabel label="Saving..." />
          ) : (
            <PrimaryCtaLabel label="Save and continue" showArrow />
          )}
        </Button>
      )
    }

    if (activeStep === 'submit') {
      if (isPendingVerification) {
        return null
      }
      return (
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
      )
    }

    if (!nextStep) {
      return null
    }

    return (
      <Button
        onClick={() => setActiveStep(nextStep)}
        disabled={!canMoveNext}
        className="px-4"
      >
        <PrimaryCtaLabel label="Continue" showArrow />
      </Button>
    )
  }

  function renderStepActions() {
    const primaryCta = renderPrimaryCta()

    return (
      <div className="kyb-wizard-step-actions">
        <Button variant="ghost" onClick={onClose} className="px-4">
          Save & close
        </Button>
        {primaryCta}
      </div>
    )
  }

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      showCloseButton={false}
      bodyVariant="plain"
      maxWidthClassName="max-w-6xl"
      contentClassName="!p-0 !overflow-hidden"
    >
      <div className="kyb-wizard">
        <div className="kyb-wizard-progress" aria-hidden>
          <div
            className="kyb-wizard-progress-bar"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <header className="kyb-wizard-header">
          <div className="kyb-wizard-header-main">
            <div className="kyb-wizard-header-icon">
              <KybIconShield />
            </div>
            <div>
              <h2 className="kyb-wizard-title">Verify your business</h2>
              <p className="kyb-wizard-subtitle">
                Submit business details, key people, and supporting documents so we
                can activate your account.
              </p>
            </div>
          </div>
          <div className="kyb-wizard-header-actions">
            <button
              type="button"
              className="kyb-wizard-close"
              onClick={onClose}
              aria-label="Close"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M5.22 5.22a.75.75 0 0 1 1.06 0L10 8.94l3.72-3.72a.75.75 0 1 1 1.06 1.06L11.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06L10 11.06l-3.72 3.72a.75.75 0 1 1-1.06-1.06L8.94 10 5.22 6.28a.75.75 0 0 1 0-1.06Z" />
              </svg>
            </button>
          </div>
        </header>

        <div className="kyb-wizard-body">
          <aside className="kyb-wizard-sidebar">
            <nav className="kyb-wizard-steps" aria-label="KYC steps">
              {stepMeta.map((step, index) => {
                const isActive = step.id === activeStep
                const isDone =
                  (isPendingVerification && step.id === 'submit') ||
                  (merchantProgress?.lastSuccessfulStep
                    ? stepOrder.indexOf(merchantProgress.lastSuccessfulStep) >=
                      index
                    : false)
                const isLocked = !availableSteps.includes(step.id) && !isActive
                const StepIcon = step.Icon

                return (
                  <button
                    key={step.id}
                    type="button"
                    className={`kyb-wizard-step${isActive ? ' kyb-wizard-step--active' : ''}${isDone && !isActive ? ' kyb-wizard-step--done' : ''}`}
                    onClick={() => {
                      if (!isLocked) {
                        setActiveStep(step.id)
                      }
                    }}
                    disabled={isLocked}
                  >
                    <span className="kyb-wizard-step-icon">
                      <StepIcon />
                    </span>
                    <span className="kyb-wizard-step-copy">
                      <p className="kyb-wizard-step-title">{step.label}</p>
                      <p className="kyb-wizard-step-meta">{step.estimate}</p>
                    </span>
                  </button>
                )
              })}
            </nav>

            <div className="kyb-wizard-why">
              <p className="kyb-wizard-why-title">
                <KybIconInfo />
                Why we ask
              </p>
              <p className="kyb-wizard-why-copy">
                We verify legal entity, ownership, and documents to meet compliance
                requirements and keep payments secure for everyone.
              </p>
            </div>
          </aside>

          <div className="kyb-wizard-main">
            <div className="kyb-wizard-mobile-steps" aria-label="KYC steps">
              {stepMeta.map((step, index) => {
                const isActive = step.id === activeStep
                const isLocked =
                  !availableSteps.includes(step.id) && !isActive
                const StepIcon = step.Icon

                return (
                  <button
                    key={step.id}
                    type="button"
                    className={`kyb-wizard-mobile-step${isActive ? ' kyb-wizard-mobile-step--active' : ''}`}
                    onClick={() => {
                      if (!isLocked) {
                        setActiveStep(step.id)
                      }
                    }}
                    disabled={isLocked}
                    aria-label={`${getStepLabel(step.id)}, step ${index + 1}`}
                  >
                    <StepIcon />
                    <span>{step.label}</span>
                  </button>
                )
              })}
            </div>

            {activeStep === 'business' ? (
              <>
                {businessForm.legalName.trim() ? (
                  <p className="mb-3 [font-family:var(--font-body)] text-sm text-(--dash-fg-muted)">
                    Showing saved business details for this merchant. Update
                    anything that changed, then continue.
                  </p>
                ) : null}
                <section className="kyb-section">
                  <div className="kyb-section-head">
                    <span className="kyb-section-icon">
                      <KybIconGlobe />
                    </span>
                    <div>
                      <h3 className="kyb-section-title">Legal entity</h3>
                      <p className="kyb-section-desc">
                        Tell us how your business is structured.
                      </p>
                    </div>
                  </div>
                  <div className="kyb-field-grid">
                    <label className="kyb-field">
                      <span className="kyb-field-label">
                        Business type
                        <span className="kyb-req">*</span>
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
                      <p className="kyb-field-hint">
                        <KybIconInfo />
                        Sets which documents and which people we need from you.
                      </p>
                    </label>
                    <label className="kyb-field">
                      <span className="kyb-field-label">Industry optional</span>
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
                  </div>
                </section>

                <section className="kyb-section">
                  <div className="kyb-section-head">
                    <span className="kyb-section-icon">
                      <KybIconDocument />
                    </span>
                    <div>
                      <h3 className="kyb-section-title">Registration details</h3>
                      <p className="kyb-section-desc">
                        Use names and numbers exactly as on official filings.
                      </p>
                    </div>
                  </div>
                  <div className="kyb-field-grid">
                    <label className="kyb-field">
                      <span className="kyb-field-label">
                        Legal name
                        <span className="kyb-req">*</span>
                      </span>
                      <Input
                        value={businessForm.legalName}
                        onChange={(event) => {
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
                        }}
                        className={
                          businessFieldErrors.legalName
                            ? requiredInputErrorClassName
                            : undefined
                        }
                      />
                    </label>
                    <label className="kyb-field">
                      <span className="kyb-field-label">Trading name optional</span>
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
                    <label className="kyb-field">
                      <span className="kyb-field-label">Registration number</span>
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
                    <label className="kyb-field">
                      <span className="kyb-field-label">Incorporation date</span>
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
                  </div>
                </section>

                <section className="kyb-section">
                  <div className="kyb-section-head">
                    <span className="kyb-section-icon">
                      <KybIconBuilding />
                    </span>
                    <div>
                      <h3 className="kyb-section-title">Addresses</h3>
                      <p className="kyb-section-desc">
                        Registered and operating locations for your business.
                      </p>
                    </div>
                  </div>
                  <div className="kyb-field-grid">
                    <label className="kyb-field kyb-field--full">
                      <span className="kyb-field-label">
                        Registered address
                        <span className="kyb-req">*</span>
                      </span>
                      <Input
                        value={businessForm.registeredAddress}
                        onChange={(event) => {
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
                        }}
                        className={
                          businessFieldErrors.registeredAddress
                            ? requiredInputErrorClassName
                            : undefined
                        }
                      />
                    </label>
                    <label className="kyb-field kyb-field--full">
                      <span className="kyb-field-label">
                        Operating address optional
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
                    <label className="kyb-field">
                      <span className="kyb-field-label">Tax ID</span>
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
                  </div>
                </section>

                <section className="kyb-section">
                  <div className="kyb-section-head">
                    <span className="kyb-section-icon">
                      <KybIconPhone />
                    </span>
                    <div>
                      <h3 className="kyb-section-title">Contact</h3>
                      <p className="kyb-section-desc">
                        How we reach someone authorized for this account.
                      </p>
                    </div>
                  </div>
                  <div className="kyb-field-grid">
                    <label className="kyb-field kyb-field--full">
                      <span className="kyb-field-label">
                        Contact phone
                        <span className="kyb-req">*</span>
                      </span>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                        <DropdownSelect
                          options={phoneCodeDropdownOptions}
                          value={selectedPhoneCode}
                          onChange={setSelectedPhoneCode}
                          ariaLabel="Phone country code"
                          className="w-full sm:w-48 sm:shrink-0"
                        />
                        <Input
                          value={businessForm.contactPhone}
                          onChange={(event) => {
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
                          }}
                          placeholder="Phone number"
                          className={
                            businessFieldErrors.contactPhone
                              ? `min-w-0 flex-1 ${requiredInputErrorClassName}`
                              : 'min-w-0 flex-1'
                          }
                        />
                      </div>
                    </label>
                    <label className="kyb-field kyb-field--full">
                      <span className="kyb-field-label">
                        Contact email
                        <span className="kyb-req">*</span>
                      </span>
                      <Input
                        type="email"
                        value={businessForm.contactEmail}
                        onChange={(event) => {
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
                        }}
                        className={
                          businessFieldErrors.contactEmail
                            ? requiredInputErrorClassName
                            : undefined
                        }
                      />
                    </label>
                  </div>
                </section>

                {businessError ? (
                  <p className="text-sm text-rose-600">{businessError}</p>
                ) : null}

                {renderStepActions()}
              </>
            ) : null}

            {activeStep === 'persons' ? (
              <>
                <section className="kyb-section">
                  <div className="kyb-section-head">
                    <span className="kyb-section-icon">
                      <KybIconPeople />
                    </span>
                    <div>
                      <h3 className="kyb-section-title">
                        Directors and beneficial owners
                      </h3>
                      <p className="kyb-section-desc">
                        People already saved for this merchant are listed below.
                        Add another person if needed, or continue to documents.
                      </p>
                    </div>
                  </div>
                  <div className="kyb-field-grid">
                    <label className="kyb-field">
                      <span className="kyb-field-label">
                        Role
                        <span className="kyb-req">*</span>
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
                    <label className="kyb-field">
                      <span className="kyb-field-label">
                        Full name
                        <span className="kyb-req">*</span>
                      </span>
                      <Input
                        value={personForm.fullName}
                        onChange={(event) => {
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
                        }}
                        className={
                          personFieldErrors.fullName
                            ? requiredInputErrorClassName
                            : undefined
                        }
                      />
                    </label>
                    <label className="kyb-field">
                      <span className="kyb-field-label">
                        Nationality
                        <span className="kyb-req">*</span>
                      </span>
                      <DropdownSelect
                        options={nationalityOptions}
                        value={personForm.nationality}
                        onChange={(nextValue) => {
                          setPersonForm((previous) => ({
                            ...previous,
                            nationality: nextValue,
                          }))
                          if (personFieldErrors.nationality) {
                            setPersonFieldErrors((previous) => ({
                              ...previous,
                              nationality: false,
                            }))
                          }
                        }}
                        ariaLabel="Nationality"
                        className="w-full"
                      />
                    </label>
                    <label className="kyb-field">
                      <span className="kyb-field-label">
                        Date of birth
                        <span className="kyb-req">*</span>
                      </span>
                      <Input
                        type="date"
                        max={new Date().toISOString().slice(0, 10)}
                        value={personForm.dateOfBirth}
                        onChange={(event) => {
                          setPersonForm((previous) => ({
                            ...previous,
                            dateOfBirth: event.target.value,
                          }))
                          if (personFieldErrors.dateOfBirth) {
                            setPersonFieldErrors((previous) => ({
                              ...previous,
                              dateOfBirth: false,
                            }))
                          }
                        }}
                        className={
                          personFieldErrors.dateOfBirth
                            ? requiredInputErrorClassName
                            : undefined
                        }
                      />
                    </label>
                    <label className="kyb-field">
                      <span className="kyb-field-label">
                        ID type
                        <span className="kyb-req">*</span>
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
                    <label className="kyb-field">
                      <span className="kyb-field-label">
                        ID number
                        <span className="kyb-req">*</span>
                      </span>
                      <Input
                        value={personForm.idNumber}
                        onChange={(event) => {
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
                        }}
                        className={
                          personFieldErrors.idNumber
                            ? requiredInputErrorClassName
                            : undefined
                        }
                      />
                    </label>
                    <label className="kyb-field kyb-field--full">
                      <span className="kyb-field-label">
                        Address
                        <span className="kyb-req">*</span>
                      </span>
                      <Input
                        value={personForm.address}
                        onChange={(event) => {
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
                        }}
                        className={
                          personFieldErrors.address
                            ? requiredInputErrorClassName
                            : undefined
                        }
                      />
                    </label>
                    <label className="kyb-field">
                      <span className="kyb-field-label">Ownership % optional</span>
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

                  <div className="mt-4 flex flex-wrap items-center gap-3">
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
                    <span className="text-sm text-(--dash-fg-muted)">
                      {personCount} person{personCount === 1 ? '' : 's'} added
                    </span>
                  </div>

                  {personError ? (
                    <p className="mt-3 text-sm text-rose-600">{personError}</p>
                  ) : null}
                </section>

                <div className="kyb-list-card">
                  <div
                    className="kyb-list-card-head"
                    style={{ gridTemplateColumns: '1.3fr 1fr 0.8fr' }}
                  >
                    <p>Name</p>
                    <p>Role</p>
                    <p>Status</p>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {(personsQuery.data?.items ?? []).map((person) => (
                      <div
                        key={person.id}
                        className="kyb-list-card-row"
                        style={{ gridTemplateColumns: '1.3fr 1fr 0.8fr' }}
                      >
                        <p>{person.fullName}</p>
                        <p>{person.role}</p>
                        <p>{person.status}</p>
                      </div>
                    ))}
                    {!personsQuery.isPending && personCount === 0 ? (
                      <p className="kyb-list-card-empty">No persons added yet.</p>
                    ) : null}
                  </div>
                </div>

                {renderStepActions()}
              </>
            ) : null}

            {activeStep === 'documents' ? (
              <>
                <section className="kyb-section">
                  <div className="kyb-section-head">
                    <span className="kyb-section-icon">
                      <KybIconDocument />
                    </span>
                    <div>
                      <h3 className="kyb-section-title">Supporting documents</h3>
                      <p className="kyb-section-desc">
                        Uploaded documents stay listed below after you leave this
                        step. Add another file if needed, then continue to review.
                      </p>
                    </div>
                  </div>
                  <div className="kyb-field-grid">
                    <label className="kyb-field">
                      <span className="kyb-field-label">
                        Document type
                        <span className="kyb-req">*</span>
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
                    <label className="kyb-field">
                      <span className="kyb-field-label">
                        Document number optional
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
                    <label className="kyb-field kyb-field--full">
                      <span className="kyb-field-label">
                        Upload file
                        <span className="kyb-req">*</span>
                      </span>
                      <FileUploadDropzone
                        selectedFile={selectedDocumentFile}
                        onFileChange={(nextFile) => {
                          setSelectedDocumentFile(nextFile)
                          if (documentFieldErrors.selectedFile) {
                            setDocumentFieldErrors((previous) => ({
                              ...previous,
                              selectedFile: false,
                            }))
                          }
                        }}
                        accept={DOCUMENT_UPLOAD_POLICY.accept}
                        error={Boolean(documentFieldErrors.selectedFile)}
                        helperText={`Accepted formats: ${DOCUMENT_UPLOAD_POLICY.label}`}
                      />
                    </label>
                    <label className="kyb-field kyb-field--full">
                      <span className="kyb-field-label">
                        Person link optional
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

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <Button
                      onClick={handleAddDocument}
                      disabled={isAddingDocumentPending}
                      className="px-4"
                    >
                      {isAddingDocumentPending ? (
                        <LoadingButtonLabel
                          label={isUploadingDocument ? 'Uploading...' : 'Adding...'}
                        />
                      ) : (
                        'Add document'
                      )}
                    </Button>
                    <span className="text-sm text-(--dash-fg-muted)">
                      {documentCount} document{documentCount === 1 ? '' : 's'} added
                    </span>
                  </div>

                  {documentError ? (
                    <p className="mt-3 text-sm text-rose-600">{documentError}</p>
                  ) : null}
                </section>

                <div className="kyb-list-card">
                  <div
                    className="kyb-list-card-head"
                    style={{ gridTemplateColumns: '1.2fr 1fr 1fr' }}
                  >
                    <p>Type</p>
                    <p>Status</p>
                    <p>Submitted at</p>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {(documentsQuery.data?.items ?? []).map((document) => (
                      <div
                        key={document.id}
                        className="kyb-list-card-row"
                        style={{ gridTemplateColumns: '1.2fr 1fr 1fr' }}
                      >
                        <p>{document.documentType}</p>
                        <p>{document.status}</p>
                        <p>{document.submittedAt ? document.submittedAt : '-'}</p>
                      </div>
                    ))}
                    {!documentsQuery.isPending && documentCount === 0 ? (
                      <p className="kyb-list-card-empty">No documents added yet.</p>
                    ) : null}
                  </div>
                </div>

                {renderStepActions()}
              </>
            ) : null}

            {activeStep === 'submit' ? (
              <section className="kyb-section">
                <div className="kyb-section-head">
                  <span className="kyb-section-icon">
                    <KybIconCheck />
                  </span>
                  <div>
                    <h3 className="kyb-section-title">Review and submit</h3>
                    <p className="kyb-section-desc">
                      Final check before submission. Our compliance team will review
                      your KYC package once you submit.
                    </p>
                  </div>
                </div>

                <div className="grid gap-3">
                  <div className="kyb-list-card p-3">
                    <p className="kyb-field-label">Persons ({personCount})</p>
                    {reviewPersonNames.length > 0 ? (
                      <ul className="mt-2 max-h-28 space-y-1 overflow-y-auto text-sm text-(--dash-fg)">
                        {reviewPersonNames.map((name, index) => (
                          <li key={`${name}-${index}`} className="truncate">
                            {name}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-sm text-(--dash-fg-muted)">
                        No person added yet.
                      </p>
                    )}
                  </div>

                  <div className="kyb-list-card p-3">
                    <p className="kyb-field-label">Documents ({documentCount})</p>
                    {reviewDocumentLabels.length > 0 ? (
                      <ul className="mt-2 max-h-28 space-y-1 overflow-y-auto text-sm text-(--dash-fg)">
                        {reviewDocumentLabels.map((label, index) => (
                          <li key={`${label}-${index}`} className="truncate">
                            {label}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-sm text-(--dash-fg-muted)">
                        No document added yet.
                      </p>
                    )}
                  </div>
                </div>

                {isKycOrKybRejected ? (
                  <div className="mt-4 rounded-[10px] border border-rose-400/50 bg-rose-50 p-3 text-sm text-rose-800">
                    Your KYC submission was rejected. Review your information below
                    and submit again when ready.
                  </div>
                ) : null}

                {isPendingVerification ? (
                  <div className="mt-4 rounded-[10px] border border-(--dash-border) bg-(--dash-surface-2) p-3 text-sm text-(--dash-fg)">
                    Pending verification. Your KYC submission is under review.
                  </div>
                ) : null}

                {submitError ? (
                  <p className="mt-3 text-sm text-rose-600">{submitError}</p>
                ) : null}

                {renderStepActions()}
              </section>
            ) : null}
          </div>
        </div>
      </div>
    </Dialog>
  )
}
