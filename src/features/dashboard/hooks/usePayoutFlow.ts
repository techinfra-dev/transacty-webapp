import { useEffect, useMemo, useState } from 'react'
import { usePortalEnvironmentStore } from '../../../store/portalEnvironmentStore.ts'
import { useBalanceQuery } from './useBalanceQuery.ts'
import { useMarketsQuery } from './useMarketsQuery.ts'
import { getActivatedWallets, getWalletMarket } from '../utils/balanceWalletUtils.ts'
import { useCreatePayoutMutation } from './usePayoutMutations.ts'
import {
  useApproveEurPayoutMutation,
  useCreateEurPayoutMutation,
  useEurPayoutInstanceQuery,
} from './useEurPayoutMutations.ts'
import {
  useCreateCpgPayoutMutation,
  useCpgPayoutRequestQuery,
} from './useCpgPayoutMutations.ts'
import {
  createPayoutPayloadSchema,
  type BeneficiaryAccountInfo,
  type CardHolderInfo,
  type CreatePayoutPayload,
  type CreatePayoutResponse,
} from '../services/payoutsSchemas.ts'
import {
  createEurPayoutPayloadSchema,
  type EurPayoutInstance,
  type EurPayoutUserDetails,
} from '../services/eurPayoutSchemas.ts'
import type { EurPayoutFormPayload } from '../services/eurPayoutFormTypes.ts'
import type { CpgPayoutFormPayload } from '../services/cpgPayoutFormTypes.ts'
import {
  createCpgPayoutPayloadSchema,
  type CpgPayoutInstance,
} from '../services/cpgPayoutSchemas.ts'
import type { PayoutFormPayload } from '../services/payoutFormTypes.ts'
import {
  EUR_PAYOUT_FIAT_CURRENCY,
  EUR_PAYOUT_SETTLEMENT_CURRENCY,
  INDIA_PAYOUT_SETTLEMENT_CURRENCY,
  getDefaultMerchantUrl,
  getPayoutRailForWallet,
  getPayoutReturnUrl,
  initialCpgPayoutPayload,
  initialEurPayoutPayload,
  initialPayoutPayload,
  isPayoutSupportedWallet,
  minimumCpgPayoutAmount,
  minimumEurPayoutAmount,
  minimumPayoutAmount,
  type PayoutRail,
} from '../components/payouts/payoutConstants.ts'
import { formatPayoutMoney } from '../components/payouts/payoutFormatters.ts'

export function usePayoutFlow() {
  const portalEnvironment = usePortalEnvironmentStore((state) => state.environment)
  const [step, setStep] = useState(1)
  const [clientError, setClientError] = useState<string | null>(null)
  const [createdPayout, setCreatedPayout] = useState<CreatePayoutResponse | null>(null)
  const [createdEurPayout, setCreatedEurPayout] = useState<EurPayoutInstance | null>(null)
  const [createdCpgPayout, setCreatedCpgPayout] = useState<CpgPayoutInstance | null>(null)
  const [approveError, setApproveError] = useState<string | null>(null)
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null)
  const [payload, setPayload] = useState<PayoutFormPayload>(initialPayoutPayload)
  const [eurPayload, setEurPayload] = useState<EurPayoutFormPayload>(initialEurPayoutPayload)
  const [cpgPayload, setCpgPayload] = useState<CpgPayoutFormPayload>(initialCpgPayoutPayload)
  const [isLivePayoutConfirmOpen, setIsLivePayoutConfirmOpen] = useState(false)

  const createPayoutMutation = useCreatePayoutMutation()
  const createEurPayoutMutation = useCreateEurPayoutMutation()
  const createCpgPayoutMutation = useCreateCpgPayoutMutation()
  const approveEurPayoutMutation = useApproveEurPayoutMutation()
  const balanceQuery = useBalanceQuery(true)
  const marketsQuery = useMarketsQuery(true)

  const wallets = useMemo(
    () => getActivatedWallets(balanceQuery.data),
    [balanceQuery.data],
  )

  const selectedWallet = useMemo(
    () => wallets.find((wallet) => wallet.id === selectedWalletId) ?? null,
    [wallets, selectedWalletId],
  )

  const payoutRail: PayoutRail | null = selectedWallet
    ? getPayoutRailForWallet(selectedWallet)
    : null

  const settlementCurrency = selectedWallet?.currency.trim().toUpperCase() ?? ''
  const displayCurrency =
    payoutRail === 'eur'
      ? EUR_PAYOUT_FIAT_CURRENCY
      : payoutRail === 'cpg'
        ? INDIA_PAYOUT_SETTLEMENT_CURRENCY
        : settlementCurrency

  const isEuropeMarketApproved = useMemo(
    () =>
      marketsQuery.data?.some(
        (market) =>
          market.market === 'europe' && market.entitlementStatus === 'approved',
      ) ?? false,
    [marketsQuery.data],
  )

  const isIndiaMarketApproved = useMemo(
    () =>
      marketsQuery.data?.some(
        (market) =>
          market.market === 'india' && market.entitlementStatus === 'approved',
      ) ?? false,
    [marketsQuery.data],
  )

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

  const effectiveMinimumAmount =
    payoutRail === 'eur'
      ? Math.max(minimumEurPayoutAmount, payoutLimits?.min ?? 0)
      : payoutRail === 'cpg'
        ? Math.max(minimumCpgPayoutAmount, payoutLimits?.min ?? 0)
        : Math.max(minimumPayoutAmount, payoutLimits?.min ?? 0)

  const effectiveMaximumAmount = useMemo(() => {
    if (payoutRail === 'eur') {
      return payoutLimits?.max
    }
    const limits: number[] = []
    if (payoutLimits?.max) {
      limits.push(payoutLimits.max)
    }
    if (walletBalance !== null) {
      limits.push(walletBalance)
    }
    return limits.length > 0 ? Math.min(...limits) : undefined
  }, [payoutLimits?.max, payoutRail, walletBalance])

  const activeAmount =
    payoutRail === 'eur'
      ? eurPayload.amount
      : payoutRail === 'cpg'
        ? cpgPayload.amount
        : payload.amount

  const formattedPreviewAmount = useMemo(
    () =>
      displayCurrency ? formatPayoutMoney(displayCurrency, activeAmount) : '—',
    [activeAmount, displayCurrency],
  )

  const formattedWalletBalance = useMemo(
    () =>
      settlementCurrency && walletBalance !== null
        ? formatPayoutMoney(settlementCurrency, String(walletBalance))
        : '—',
    [settlementCurrency, walletBalance],
  )

  const createdTransactionId =
    createdCpgPayout?.transactionId ||
    createdEurPayout?.transactionId ||
    createdPayout?.transactionId ||
    createdPayout?.id

  const eurPayoutStatusQuery = useEurPayoutInstanceQuery(
    createdEurPayout?.transactionId,
    step === 5 && payoutRail === 'eur',
  )

  const cpgPayoutStatusQuery = useCpgPayoutRequestQuery(
    createdCpgPayout?.transactionId,
    step === 5 && payoutRail === 'cpg',
  )

  const hasBeneficiaryDetails =
    payoutRail === 'eur'
      ? eurPayload.iban.trim().length > 0
      : payoutRail === 'cpg'
        ? cpgPayload.destinationAddress.trim().length > 0 ||
          cpgPayload.beneficiaryName.trim().length > 0
        : payload.benificiaryAccountInfo.number.trim().length > 0 ||
          payload.benificiaryAccountInfo.holderName.trim().length > 0

  const hasSenderDetails =
    payoutRail === 'eur'
      ? eurPayload.userDetails.firstName.trim().length > 0 ||
        eurPayload.userDetails.lastName.trim().length > 0
      : payoutRail === 'cpg'
        ? cpgPayload.networkSymbol.trim().length > 0 &&
          cpgPayload.destinationAddress.trim().length > 0 &&
          cpgPayload.beneficiaryName.trim().length > 0
      : payload.cardHolderInfo.firstName.trim().length > 0 ||
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
      wallets.find((wallet) => isPayoutSupportedWallet(wallet)) ?? wallets[0]!
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

  function updateEurUserField(field: keyof EurPayoutUserDetails, value: string) {
    setEurPayload((previousPayload) => ({
      ...previousPayload,
      userDetails: {
        ...previousPayload.userDetails,
        [field]: value,
      },
    }))
  }

  function validateWalletStep() {
    if (!selectedWallet) {
      return 'Select a merchant wallet to continue.'
    }
    if (!isPayoutSupportedWallet(selectedWallet)) {
      return 'Payouts are available for BDT (Bangladesh), USDT (India), and USDC (Europe) wallets only.'
    }
    if (selectedWallet.status.toLowerCase() !== 'active') {
      return 'Selected wallet must be active to send a payout.'
    }
    if (
      getPayoutRailForWallet(selectedWallet) === 'eur' &&
      !isEuropeMarketApproved
    ) {
      return 'Europe market access must be approved before sending EUR payouts.'
    }
    if (
      getPayoutRailForWallet(selectedWallet) === 'cpg' &&
      !isIndiaMarketApproved
    ) {
      return 'India market access must be approved before sending USDT payouts.'
    }
    if (
      getWalletMarket(selectedWallet) === 'europe' &&
      getPayoutRailForWallet(selectedWallet) !== 'eur'
    ) {
      return `Europe payouts debit your ${EUR_PAYOUT_SETTLEMENT_CURRENCY} wallet and send ${EUR_PAYOUT_FIAT_CURRENCY} to an IBAN.`
    }
    return null
  }

  function validateAmountStep() {
    if (!displayCurrency) {
      return 'Select a wallet before entering the payout amount.'
    }

    const amountText = activeAmount.trim()
    if (!/^\d+(\.\d{1,2})?$/.test(amountText)) {
      return 'Enter a valid amount (up to 2 decimal places).'
    }
    const amountNumber = Number(amountText)
    if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
      return 'Amount must be greater than 0.'
    }
    if (amountNumber < effectiveMinimumAmount) {
      return `Amount must be at least ${formatPayoutMoney(
        displayCurrency,
        String(effectiveMinimumAmount),
      )}.`
    }
    if (
      payoutRail !== 'eur' &&
      effectiveMaximumAmount !== undefined &&
      amountNumber > effectiveMaximumAmount
    ) {
      return `Amount cannot exceed ${formatPayoutMoney(
        displayCurrency,
        String(effectiveMaximumAmount),
      )}.`
    }
    if (
      payoutRail === 'eur' &&
      effectiveMaximumAmount !== undefined &&
      amountNumber > effectiveMaximumAmount
    ) {
      return `Amount cannot exceed ${formatPayoutMoney(
        displayCurrency,
        String(effectiveMaximumAmount),
      )}.`
    }
    if (
      payoutRail === 'eur' &&
      portalEnvironment === 'live' &&
      walletBalance !== null &&
      walletBalance <= 0
    ) {
      return 'Your USDC balance is insufficient.'
    }
    return null
  }

  function validateBeneficiaryStep() {
    if (payoutRail === 'eur') {
      const normalizedIban = eurPayload.iban.replace(/\s+/g, '').toUpperCase()
      if (normalizedIban.length < 15) {
        return 'Enter a valid beneficiary IBAN.'
      }
      return null
    }

    if (payoutRail === 'cpg') {
      if (!cpgPayload.networkSymbol.trim()) {
        return 'Select a blockchain network.'
      }
      if (cpgPayload.destinationAddress.trim().length === 0) {
        return 'Enter the beneficiary wallet address.'
      }
      if (cpgPayload.beneficiaryName.trim().length === 0) {
        return 'Enter the beneficiary name.'
      }
      return null
    }

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

  function validateSenderStep() {
    if (payoutRail === 'cpg') {
      return null
    }

    if (payoutRail === 'eur') {
      const user = eurPayload.userDetails
      if (
        user.firstName.trim().length === 0 ||
        user.lastName.trim().length === 0 ||
        user.country.trim().length === 0 ||
        user.dob.trim().length === 0
      ) {
        return 'Complete all beneficiary identity fields to continue.'
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email.trim())) {
        return 'Enter a valid beneficiary email address.'
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(user.dob.trim())) {
        return 'Date of birth must use YYYY-MM-DD format.'
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

  function validateCurrentStep() {
    if (step === 1) {
      return validateWalletStep()
    }
    if (step === 2) {
      return validateAmountStep()
    }
    if (step === 3) {
      return validateBeneficiaryStep()
    }
    return validateSenderStep()
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
    setApproveError(null)

    if (payoutRail === 'eur') {
      const beneficiaryName =
        `${eurPayload.userDetails.firstName.trim()} ${eurPayload.userDetails.lastName.trim()}`.trim()
      const normalizedPayload = {
        environment: portalEnvironment,
        amount: eurPayload.amount.trim(),
        currencySymbol: 'EUR' as const,
        returnUrl: getPayoutReturnUrl(),
        merchantUrl: getDefaultMerchantUrl(),
        userDetails: {
          firstName: eurPayload.userDetails.firstName.trim(),
          lastName: eurPayload.userDetails.lastName.trim(),
          email: eurPayload.userDetails.email.trim(),
          country: eurPayload.userDetails.country.trim(),
          dob: eurPayload.userDetails.dob.trim(),
        },
        payeeDetails: {
          iban: eurPayload.iban,
          name: beneficiaryName || undefined,
          country: eurPayload.userDetails.country.trim() || undefined,
        },
        autoMerchantApproval: eurPayload.autoMerchantApproval,
      }

      const parsedPayload = createEurPayoutPayloadSchema.safeParse(normalizedPayload)
      if (!parsedPayload.success) {
        setClientError(
          parsedPayload.error.issues[0]?.message || 'Invalid EUR payout request.',
        )
        return
      }

      try {
        const response = await createEurPayoutMutation.mutateAsync(parsedPayload.data)
        setCreatedEurPayout(response)
        setStep(5)
      } catch {
        // API error is surfaced via mutation state.
      }
      return
    }

    if (payoutRail === 'cpg') {
      const normalizedPayload = {
        environment: portalEnvironment,
        amount: cpgPayload.amount.trim(),
        settledCurrency: 'USDT' as const,
        networkSymbol: cpgPayload.networkSymbol.trim(),
        destinationDetails: {
          address: cpgPayload.destinationAddress.trim(),
          beneficiaryName: cpgPayload.beneficiaryName.trim(),
        },
      }

      const parsedPayload = createCpgPayoutPayloadSchema.safeParse(normalizedPayload)
      if (!parsedPayload.success) {
        setClientError(
          parsedPayload.error.issues[0]?.message || 'Invalid USDT payout request.',
        )
        return
      }

      try {
        const response = await createCpgPayoutMutation.mutateAsync(parsedPayload.data)
        setCreatedCpgPayout(response)
        setStep(5)
      } catch {
        // API error is surfaced via mutation state.
      }
      return
    }

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

  async function handleApproveEurPayout() {
    if (!createdEurPayout?.transactionId) {
      return
    }
    setApproveError(null)
    try {
      await approveEurPayoutMutation.mutateAsync(createdEurPayout.transactionId)
    } catch (error) {
      setApproveError(
        error instanceof Error
          ? error.message
          : 'Unable to approve EUR payout right now.',
      )
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
    ? isPayoutSupportedWallet(selectedWallet) &&
      (getPayoutRailForWallet(selectedWallet) !== 'eur' || isEuropeMarketApproved) &&
      (getPayoutRailForWallet(selectedWallet) !== 'cpg' || isIndiaMarketApproved)
    : false

  const isSubmitting =
    createPayoutMutation.isPending ||
    createEurPayoutMutation.isPending ||
    createCpgPayoutMutation.isPending

  const mutationErrorMessage =
    payoutRail === 'eur'
      ? createEurPayoutMutation.isError
        ? createEurPayoutMutation.error.message
        : undefined
      : payoutRail === 'cpg'
        ? createCpgPayoutMutation.isError
          ? createCpgPayoutMutation.error.message
          : undefined
        : createPayoutMutation.isError
          ? createPayoutMutation.error.message
          : undefined

  function handleResetFlow() {
    setStep(1)
    setClientError(null)
    setApproveError(null)
    setCreatedPayout(null)
    setCreatedEurPayout(null)
    setCreatedCpgPayout(null)
    setIsLivePayoutConfirmOpen(false)
    setPayload(initialPayoutPayload)
    setEurPayload(initialEurPayoutPayload)
    setCpgPayload(initialCpgPayoutPayload)
    setSelectedWalletId(
      wallets.find((wallet) => isPayoutSupportedWallet(wallet))?.id ??
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
    createdEurPayout,
    createdCpgPayout,
    payload,
    setPayload,
    eurPayload,
    setEurPayload,
    cpgPayload,
    setCpgPayload,
    payoutRail,
    displayCurrency,
    createPayoutMutation,
    createEurPayoutMutation,
    createCpgPayoutMutation,
    approveEurPayoutMutation,
    eurPayoutStatusQuery,
    cpgPayoutStatusQuery,
    balanceQuery,
    marketsQuery,
    wallets,
    selectedWalletId,
    setSelectedWalletId,
    selectedWallet,
    payoutLimits,
    settlementCurrency,
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
    updateEurUserField,
    handleCreatePayout,
    executeCreatePayout,
    handleApproveEurPayout,
    approveError,
    isLivePayoutConfirmOpen,
    setIsLivePayoutConfirmOpen,
    handleNextStep,
    handleResetFlow,
    portalEnvironment,
    isSelectedWalletPayoutSupported,
    isSubmitting,
    mutationErrorMessage,
  }
}
