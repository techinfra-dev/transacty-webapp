import { useMemo, useState } from 'react'
import { useBalanceQuery } from './useBalanceQuery.ts'
import { useCreatePayoutMutation } from './usePayoutMutations.ts'
import {
  createPayoutPayloadSchema,
  type BeneficiaryAccountInfo,
  type CardHolderInfo,
  type CreatePayoutPayload,
  type CreatePayoutResponse,
} from '../services/payoutsSchemas.ts'
import { initialPayoutPayload, minimumPayoutAmount } from '../components/payouts/payoutConstants.ts'
import { formatPayoutMoney } from '../components/payouts/payoutFormatters.ts'

export function usePayoutFlow() {
  const [step, setStep] = useState(1)
  const [clientError, setClientError] = useState<string | null>(null)
  const [createdPayout, setCreatedPayout] = useState<CreatePayoutResponse | null>(null)
  const [payload, setPayload] = useState<CreatePayoutPayload>(initialPayoutPayload)
  const createPayoutMutation = useCreatePayoutMutation()
  const balanceQuery = useBalanceQuery(true)

  const payoutLimits = balanceQuery.data?.limits.payout
  const currency = balanceQuery.data?.currency ?? 'BDT'
  const effectiveMinimumAmount = Math.max(
    minimumPayoutAmount,
    payoutLimits?.min ?? 0,
  )

  const formattedPreviewAmount = useMemo(
    () => formatPayoutMoney(currency, payload.amount),
    [currency, payload.amount],
  )
  const createdTransactionId = createdPayout?.transactionId || createdPayout?.id

  const hasBeneficiaryDetails =
    payload.benificiaryAccountInfo.number.trim().length > 0 ||
    payload.benificiaryAccountInfo.holderName.trim().length > 0

  const hasSenderDetails =
    payload.cardHolderInfo.firstName.trim().length > 0 ||
    payload.cardHolderInfo.lastName.trim().length > 0

  function updateBeneficiaryField(
    field: keyof BeneficiaryAccountInfo,
    value: string,
  ) {
    setPayload((previousPayload) => ({
      ...previousPayload,
      benificiaryAccountInfo: {
        ...previousPayload.benificiaryAccountInfo,
        [field]: value,
      },
    }))
  }

  function updateCardHolderField(field: keyof CardHolderInfo, value: string) {
    setPayload((previousPayload) => ({
      ...previousPayload,
      cardHolderInfo: {
        ...previousPayload.cardHolderInfo,
        [field]: value,
      },
    }))
  }

  function validateCurrentStep() {
    if (step === 1) {
      const amountText = payload.amount.trim()
      if (!/^\d+(\.\d{1,2})?$/.test(amountText)) {
        return 'Enter a valid amount (up to 2 decimal places).'
      }
      const amountNumber = Number(amountText)
      if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
        return 'Amount must be greater than 0.'
      }
      if (amountNumber < effectiveMinimumAmount) {
        return `Amount must be at least ${formatPayoutMoney(
          currency,
          String(effectiveMinimumAmount),
        )}.`
      }
      if (payoutLimits) {
        if (amountNumber > payoutLimits.max) {
          return `Amount cannot exceed ${formatPayoutMoney(
            currency,
            String(payoutLimits.max),
          )}.`
        }
      }
      return null
    }

    if (step === 2) {
      const beneficiary = payload.benificiaryAccountInfo
      if (
        beneficiary.number.trim().length === 0 ||
        beneficiary.holderName.trim().length === 0 ||
        beneficiary.orgName.trim().length === 0 ||
        beneficiary.orgCode.trim().length === 0 ||
        beneficiary.orgId.trim().length === 0
      ) {
        return 'Complete all beneficiary account fields to continue.'
      }
      return null
    }

    const cardHolder = payload.cardHolderInfo
    if (
      cardHolder.firstName.trim().length === 0 ||
      cardHolder.lastName.trim().length === 0 ||
      cardHolder.phone.trim().length === 0
    ) {
      return 'Complete all sender identity fields to continue.'
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cardHolder.email.trim())) {
      return 'Enter a valid sender email address.'
    }
    return null
  }

  async function handleCreatePayout() {
    setClientError(null)
    const validationError = validateCurrentStep()
    if (validationError) {
      setClientError(validationError)
      return
    }

    const normalizedPayload: CreatePayoutPayload = {
      ...payload,
      amount: payload.amount.trim(),
      benificiaryAccountInfo: {
        number: payload.benificiaryAccountInfo.number.trim(),
        holderName: payload.benificiaryAccountInfo.holderName.trim(),
        orgName: payload.benificiaryAccountInfo.orgName.trim(),
        orgCode: payload.benificiaryAccountInfo.orgCode.trim(),
        orgId: payload.benificiaryAccountInfo.orgId.trim(),
      },
      cardHolderInfo: {
        firstName: payload.cardHolderInfo.firstName.trim(),
        lastName: payload.cardHolderInfo.lastName.trim(),
        email: payload.cardHolderInfo.email.trim(),
        phone: payload.cardHolderInfo.phone.trim(),
      },
    }

    const parsedPayload = createPayoutPayloadSchema.safeParse(normalizedPayload)
    if (!parsedPayload.success) {
      setClientError(parsedPayload.error.issues[0]?.message || 'Invalid payout request.')
      return
    }

    try {
      const response = await createPayoutMutation.mutateAsync(parsedPayload.data)
      setCreatedPayout(response)
      setStep(4)
    } catch {
      // API error is surfaced via mutation state.
    }
  }

  function handleNextStep() {
    const validationError = validateCurrentStep()
    if (validationError) {
      setClientError(validationError)
      return
    }
    setClientError(null)
    setStep((previousStep) => Math.min(previousStep + 1, 3))
  }

  function handleResetFlow() {
    setStep(1)
    setClientError(null)
    setCreatedPayout(null)
    setPayload(initialPayoutPayload)
  }

  return {
    step,
    setStep,
    clientError,
    setClientError,
    createdPayout,
    payload,
    setPayload,
    createPayoutMutation,
    payoutLimits,
    currency,
    effectiveMinimumAmount,
    formattedPreviewAmount,
    createdTransactionId,
    hasBeneficiaryDetails,
    hasSenderDetails,
    updateBeneficiaryField,
    updateCardHolderField,
    handleCreatePayout,
    handleNextStep,
    handleResetFlow,
  }
}
