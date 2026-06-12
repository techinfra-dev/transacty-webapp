import { useEffect, useMemo, useState } from 'react'
import { usePortalEnvironmentStore } from '../../../store/portalEnvironmentStore.ts'
import { useBalanceQuery } from './useBalanceQuery.ts'
import { getActivatedWallets } from '../utils/balanceWalletUtils.ts'
import { useCreatePayoutMutation } from './usePayoutMutations.ts'
import {
  createPayoutPayloadSchema,
  type BeneficiaryAccountInfo,
  type CardHolderInfo,
  type CreatePayoutPayload,
  type CreatePayoutResponse,
} from '../services/payoutsSchemas.ts'
import type { PayoutFormPayload } from '../services/payoutFormTypes.ts'
import { initialPayoutPayload, isPayoutSupportedCurrency, minimumPayoutAmount } from '../components/payouts/payoutConstants.ts'
import { formatPayoutMoney } from '../components/payouts/payoutFormatters.ts'

export function usePayoutFlow() {
  const portalEnvironment = usePortalEnvironmentStore((state) => state.environment)
  const [step, setStep] = useState(1)
  const [clientError, setClientError] = useState<string | null>(null)
  const [createdPayout, setCreatedPayout] = useState<CreatePayoutResponse | null>(null)
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null)
  const [payload, setPayload] = useState<PayoutFormPayload>(initialPayoutPayload)
  const [isLivePayoutConfirmOpen, setIsLivePayoutConfirmOpen] = useState(false)

  const createPayoutMutation = useCreatePayoutMutation()
  const balanceQuery = useBalanceQuery(true)

  const wallets = useMemo(
    () => getActivatedWallets(balanceQuery.data),
    [balanceQuery.data],
  )

  const selectedWallet = useMemo(
    () => wallets.find((wallet) => wallet.id === selectedWalletId) ?? null,
    [wallets, selectedWalletId],
  )

  const currency = selectedWallet?.currency.trim().toUpperCase() ?? ''
  const walletBalance = useMemo(() => {
    if (!selectedWallet) {
      return null
    }
    const amount = Number(
      selectedWallet.availableBalance ?? selectedWallet.balance,
    )
    return Number.isFinite(amount) ? amount : 0
  }, [selectedWallet])

  const payoutLimits = selectedWallet?.limits.payout

  const effectiveMinimumAmount = Math.max(
    minimumPayoutAmount,
    payoutLimits?.min ?? 0,
  )

  const effectiveMaximumAmount = useMemo(() => {
    const limits: number[] = []
    if (payoutLimits?.max) {
      limits.push(payoutLimits.max)
    }
    if (walletBalance !== null) {
      limits.push(walletBalance)
    }
    return limits.length > 0 ? Math.min(...limits) : undefined
  }, [payoutLimits?.max, walletBalance])

  const formattedPreviewAmount = useMemo(
    () => (currency ? formatPayoutMoney(currency, payload.amount) : '—'),
    [currency, payload.amount],
  )

  const formattedWalletBalance = useMemo(
    () =>
      currency && walletBalance !== null
        ? formatPayoutMoney(currency, String(walletBalance))
        : '—',
    [currency, walletBalance],
  )

  const createdTransactionId = createdPayout?.transactionId || createdPayout?.id

  const hasBeneficiaryDetails =
    payload.benificiaryAccountInfo.number.trim().length > 0 ||
    payload.benificiaryAccountInfo.holderName.trim().length > 0

  const hasSenderDetails =
    payload.cardHolderInfo.firstName.trim().length > 0 ||
    payload.cardHolderInfo.lastName.trim().length > 0

  useEffect(() => {
    if (wallets.length === 0) {
      setSelectedWalletId(null)
      return
    }
    if (selectedWalletId && wallets.some((wallet) => wallet.id === selectedWalletId)) {
      return
    }
    const defaultWallet =
      wallets.find((wallet) => isPayoutSupportedCurrency(wallet.currency)) ??
      wallets[0]!
    setSelectedWalletId(defaultWallet.id)
  }, [wallets, selectedWalletId])

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
      if (!selectedWallet) {
        return 'Select a merchant wallet to continue.'
      }
      if (!isPayoutSupportedCurrency(selectedWallet.currency)) {
        return 'Payouts are currently available for BDT wallets only.'
      }
      if (selectedWallet.status.toLowerCase() !== 'active') {
        return 'Selected wallet must be active to send a payout.'
      }
      return null
    }

    if (step === 2) {
      if (!currency) {
        return 'Select a wallet before entering the payout amount.'
      }

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
      if (effectiveMaximumAmount !== undefined && amountNumber > effectiveMaximumAmount) {
        return `Amount cannot exceed ${formatPayoutMoney(
          currency,
          String(effectiveMaximumAmount),
        )}.`
      }
      return null
    }

    if (step === 3) {
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

  function handleCreatePayout() {
    setClientError(null)
    const validationError = validateCurrentStep()
    if (validationError) {
      setClientError(validationError)
      return
    }

    if (portalEnvironment === 'live') {
      setIsLivePayoutConfirmOpen(true)
      return
    }

    void executeCreatePayout()
  }

  async function executeCreatePayout() {
    setIsLivePayoutConfirmOpen(false)

    const normalizedPayload: CreatePayoutPayload = {
      ...payload,
      environment: portalEnvironment,
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
      setStep(5)
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
    setStep((previousStep) => Math.min(previousStep + 1, 4))
  }

  const isSelectedWalletPayoutSupported = selectedWallet
    ? isPayoutSupportedCurrency(selectedWallet.currency)
    : false

  function handleResetFlow() {
    setStep(1)
    setClientError(null)
    setCreatedPayout(null)
    setIsLivePayoutConfirmOpen(false)
    setPayload(initialPayoutPayload)
    setSelectedWalletId(
      wallets.find((wallet) => isPayoutSupportedCurrency(wallet.currency))?.id ??
        wallets[0]?.id ??
        null,
    )
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
    balanceQuery,
    wallets,
    selectedWalletId,
    setSelectedWalletId,
    selectedWallet,
    payoutLimits,
    currency,
    walletBalance,
    formattedWalletBalance,
    effectiveMinimumAmount,
    effectiveMaximumAmount,
    formattedPreviewAmount,
    createdTransactionId,
    hasBeneficiaryDetails,
    hasSenderDetails,
    updateBeneficiaryField,
    updateCardHolderField,
    handleCreatePayout,
    executeCreatePayout,
    isLivePayoutConfirmOpen,
    setIsLivePayoutConfirmOpen,
    handleNextStep,
    handleResetFlow,
    portalEnvironment,
    isSelectedWalletPayoutSupported,
  }
}
