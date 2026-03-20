import { useMemo, useState } from 'react'
import { Button } from '../../../components/ui/Button.tsx'
import { Input } from '../../../components/ui/Input.tsx'
import { useBalanceQuery } from '../hooks/useBalanceQuery.ts'
import { useCreatePayoutMutation } from '../hooks/usePayoutMutations.ts'
import {
  createPayoutPayloadSchema,
  type BeneficiaryAccountInfo,
  type CardHolderInfo,
  type CreatePayoutPayload,
  type CreatePayoutResponse,
} from '../services/payoutsSchemas.ts'

const stepItems = [
  { id: 1, label: 'Amount' },
  { id: 2, label: 'Beneficiary' },
  { id: 3, label: 'Sender' },
]

const payoutMethodOptions = ['BKASH', 'NAGAD', 'UPAY'] as const
const minimumPayoutAmount = 200

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

const initialPayload: CreatePayoutPayload = {
  environment: 'test',
  amount: '',
  benificiaryAccountInfo: initialBeneficiaryAccountInfo,
  cardHolderInfo: initialCardHolderInfo,
}

function formatMoney(currency: string, amountText: string) {
  const amountNumber = Number(amountText)
  const amount = Number.isFinite(amountNumber) ? amountNumber : 0
  return `${currency} ${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export function DashboardPayoutsPage() {
  const [step, setStep] = useState(1)
  const [clientError, setClientError] = useState<string | null>(null)
  const [createdPayout, setCreatedPayout] = useState<CreatePayoutResponse | null>(null)
  const [payload, setPayload] = useState<CreatePayoutPayload>(initialPayload)
  const createPayoutMutation = useCreatePayoutMutation()
  const balanceQuery = useBalanceQuery(true)

  const payoutLimits = balanceQuery.data?.limits.payout
  const currency = balanceQuery.data?.currency ?? 'BDT'
  const effectiveMinimumAmount = Math.max(
    minimumPayoutAmount,
    payoutLimits?.min ?? 0,
  )

  const formattedPreviewAmount = useMemo(
    () => formatMoney(currency, payload.amount),
    [currency, payload.amount],
  )
  const createdTransactionId = createdPayout?.transactionId || createdPayout?.id

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
        return `Amount must be at least ${formatMoney(
          currency,
          String(effectiveMinimumAmount),
        )}.`
      }
      if (payoutLimits) {
        if (amountNumber > payoutLimits.max) {
          return `Amount cannot exceed ${formatMoney(
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
    setPayload(initialPayload)
  }

  return (
    <section className="space-y-5">
      <header className="rounded-2xl border border-(--color-accent)/45 bg-(--color-card) p-5">
        <h1 className="[font-family:var(--font-display)] text-3xl font-semibold text-(--color-foreground)">
          Create Payout
        </h1>
        <p className="mt-1 [font-family:var(--font-body)] text-sm text-(--color-secondary)">
          Build and submit payout requests from your merchant dashboard in a guided flow.
        </p>
      </header>

      {step === 4 ? (
        <section className="rounded-2xl border border-emerald-300/70 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.15),rgba(255,255,255,1)_60%)] p-6">
          <div className="space-y-3">
            <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 [font-family:var(--font-body)] text-xs font-semibold text-emerald-700">
              Request created
            </span>
            <h2 className="[font-family:var(--font-display)] text-2xl font-semibold text-(--color-foreground)">
              Payout request submitted successfully
            </h2>
            <p className="[font-family:var(--font-body)] text-sm text-(--color-secondary)">
              Your payout request is now in processing queue.
            </p>
            <div className="grid gap-3 rounded-xl border border-(--color-accent)/40 bg-(--color-card)/90 p-4 sm:grid-cols-2">
              <p className="[font-family:var(--font-body)] text-sm text-(--color-secondary)">
                Amount:{' '}
                <span className="font-semibold text-(--color-foreground)">{formattedPreviewAmount}</span>
              </p>
              <p className="[font-family:var(--font-body)] text-sm text-(--color-secondary)">
                Environment:{' '}
                <span className="font-semibold uppercase text-(--color-foreground)">
                  {payload.environment}
                </span>
              </p>
              <p className="[font-family:var(--font-body)] text-sm text-(--color-secondary)">
                Beneficiary:{' '}
                <span className="font-semibold text-(--color-foreground)">
                  {payload.benificiaryAccountInfo.holderName}
                </span>
              </p>
              {createdTransactionId ? (
                <p className="[font-family:var(--font-body)] text-sm text-(--color-secondary)">
                  Transaction ID:{' '}
                  <span className="font-semibold text-(--color-foreground)">
                    {createdTransactionId}
                  </span>
                </p>
              ) : null}
            </div>
            <Button className="mt-2 h-10 px-4 text-xs" onClick={handleResetFlow}>
              Create another payout
            </Button>
          </div>
        </section>
      ) : (
        <section className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
          <article className="rounded-2xl border border-(--color-accent)/45 bg-(--color-card) p-5">
            <ol className="mb-5 grid gap-3 sm:grid-cols-3">
              {stepItems.map((stepItem) => {
                const isActive = step === stepItem.id
                const isDone = step > stepItem.id
                return (
                  <li key={stepItem.id} className="relative rounded-xl border border-(--color-accent)/35 p-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex h-7 w-7 items-center justify-center rounded-full [font-family:var(--font-body)] text-xs font-semibold ${
                          isDone
                            ? 'bg-emerald-600 text-white'
                            : isActive
                              ? 'bg-(--color-primary) text-(--color-background)'
                              : 'bg-(--color-background) text-(--color-secondary)'
                        }`}
                      >
                        {isDone ? '✓' : stepItem.id}
                      </span>
                      <span
                        className={`[font-family:var(--font-body)] text-sm font-semibold ${
                          isActive || isDone ? 'text-(--color-foreground)' : 'text-(--color-secondary)'
                        }`}
                      >
                        {stepItem.label}
                      </span>
                    </div>
                  </li>
                )
              })}
            </ol>

            {step === 1 ? (
              <div className="space-y-3">
                <h2 className="[font-family:var(--font-display)] text-xl font-semibold text-(--color-foreground)">
                  Payout details
                </h2>
                <p className="[font-family:var(--font-body)] text-sm text-(--color-secondary)">
                  Choose environment and payout amount.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1">
                    <span className="[font-family:var(--font-body)] text-xs font-semibold text-(--color-secondary)">
                      Environment
                    </span>
                    <select
                      value={payload.environment}
                      onChange={(event) =>
                        setPayload((previousPayload) => ({
                          ...previousPayload,
                          environment:
                            event.target.value === 'live' ? 'live' : 'test',
                        }))
                      }
                      className="h-11 w-full rounded-lg border border-(--color-accent) bg-(--color-background)/35 px-3 [font-family:var(--font-body)] text-sm outline-none transition focus:border-(--color-secondary) focus:ring-2 focus:ring-(--color-secondary)/20"
                    >
                      <option value="test">Test</option>
                      <option value="live">Live</option>
                    </select>
                  </label>
                  <label className="space-y-1">
                    <span className="[font-family:var(--font-body)] text-xs font-semibold text-(--color-secondary)">
                      Amount
                    </span>
                    <Input
                      value={payload.amount}
                      onChange={(event) =>
                        setPayload((previousPayload) => ({
                          ...previousPayload,
                          amount: event.target.value,
                        }))
                      }
                      placeholder="300.00"
                      inputMode="decimal"
                      className="h-11"
                    />
                  </label>
                </div>
                <div className="rounded-lg border border-(--color-accent)/35 bg-(--color-background)/30 p-3">
                  <p className="[font-family:var(--font-body)] text-xs text-(--color-secondary)">
                    {payoutLimits
                      ? `Allowed range: ${formatMoney(currency, String(effectiveMinimumAmount))} - ${formatMoney(currency, String(payoutLimits.max))}`
                      : `Minimum payout amount: ${formatMoney(currency, String(minimumPayoutAmount))}`}
                  </p>
                </div>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="space-y-3">
                <h2 className="[font-family:var(--font-display)] text-xl font-semibold text-(--color-foreground)">
                  Beneficiary account
                </h2>
                <p className="[font-family:var(--font-body)] text-sm text-(--color-secondary)">
                  Enter the recipient account that will receive the payout.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    placeholder="Account number"
                    value={payload.benificiaryAccountInfo.number}
                    onChange={(event) => updateBeneficiaryField('number', event.target.value)}
                  />
                  <Input
                    placeholder="Holder name"
                    value={payload.benificiaryAccountInfo.holderName}
                    onChange={(event) =>
                      updateBeneficiaryField('holderName', event.target.value)
                    }
                  />
                  <label className="space-y-1 sm:col-span-2">
                    <span className="[font-family:var(--font-body)] text-xs font-semibold text-(--color-secondary)">
                      Payment method
                    </span>
                    <select
                      value={payload.benificiaryAccountInfo.orgCode}
                      onChange={(event) => {
                        const selectedMethod = event.target.value
                        setPayload((previousPayload) => ({
                          ...previousPayload,
                          benificiaryAccountInfo: {
                            ...previousPayload.benificiaryAccountInfo,
                            orgName: selectedMethod,
                            orgCode: selectedMethod,
                            orgId: selectedMethod,
                          },
                        }))
                      }}
                      className="h-11 w-full rounded-lg border border-(--color-accent) bg-(--color-background)/35 px-3 [font-family:var(--font-body)] text-sm outline-none transition focus:border-(--color-secondary) focus:ring-2 focus:ring-(--color-secondary)/20"
                    >
                      <option value="" disabled>
                        Select payment method
                      </option>
                      {payoutMethodOptions.map((methodOption) => (
                        <option key={methodOption} value={methodOption}>
                          {methodOption}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="space-y-3">
                <h2 className="[font-family:var(--font-display)] text-xl font-semibold text-(--color-foreground)">
                  Sender identity
                </h2>
                <p className="[font-family:var(--font-body)] text-sm text-(--color-secondary)">
                  This information identifies who initiated the payout request.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    placeholder="First name"
                    value={payload.cardHolderInfo.firstName}
                    onChange={(event) => updateCardHolderField('firstName', event.target.value)}
                  />
                  <Input
                    placeholder="Last name"
                    value={payload.cardHolderInfo.lastName}
                    onChange={(event) => updateCardHolderField('lastName', event.target.value)}
                  />
                  <Input
                    placeholder="Email"
                    value={payload.cardHolderInfo.email}
                    onChange={(event) => updateCardHolderField('email', event.target.value)}
                    className="sm:col-span-2"
                  />
                  <Input
                    placeholder="Phone number"
                    value={payload.cardHolderInfo.phone}
                    onChange={(event) => updateCardHolderField('phone', event.target.value)}
                    className="sm:col-span-2"
                  />
                </div>
              </div>
            ) : null}

            {clientError ? (
              <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 [font-family:var(--font-body)] text-sm text-rose-700">
                {clientError}
              </p>
            ) : null}

            {createPayoutMutation.isError ? (
              <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 [font-family:var(--font-body)] text-sm text-rose-700">
                {createPayoutMutation.error.message}
              </p>
            ) : null}

            <div className="mt-5 flex items-center justify-between gap-2">
              <Button
                variant="ghost"
                className="h-10 border border-(--color-accent)/45 px-3 text-xs"
                disabled={step <= 1 || createPayoutMutation.isPending}
                onClick={() => {
                  setClientError(null)
                  setStep((previousStep) => Math.max(previousStep - 1, 1))
                }}
              >
                Previous
              </Button>

              {step < 3 ? (
                <Button className="h-10 px-3 text-xs" onClick={handleNextStep}>
                  Continue
                </Button>
              ) : (
                <Button
                  className="h-10 px-3 text-xs"
                  onClick={handleCreatePayout}
                  disabled={createPayoutMutation.isPending}
                >
                  {createPayoutMutation.isPending ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-(--color-background)/45 border-t-(--color-background)" />
                      Submitting...
                    </span>
                  ) : (
                    'Submit payout'
                  )}
                </Button>
              )}
            </div>
          </article>

          <aside className="hidden rounded-2xl border border-(--color-accent)/45 bg-[radial-gradient(circle_at_top,rgba(157,143,130,0.25),rgba(255,255,255,1)_62%)] p-5 lg:block">
            <div className="space-y-3">
              <h2 className="[font-family:var(--font-display)] text-xl font-semibold text-(--color-foreground)">
                Review before submit
              </h2>
              <p className="[font-family:var(--font-body)] text-sm text-(--color-secondary)">
                Double-check recipient and sender details before creating this payout.
              </p>
              <div className="rounded-xl border border-(--color-accent)/40 bg-(--color-card)/90 p-4">
                <dl className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <dt className="[font-family:var(--font-body)] text-xs font-semibold uppercase text-(--color-secondary)">
                      Environment
                    </dt>
                    <dd className="[font-family:var(--font-body)] text-sm font-semibold uppercase text-(--color-foreground)">
                      {payload.environment}
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <dt className="[font-family:var(--font-body)] text-xs font-semibold uppercase text-(--color-secondary)">
                      Amount
                    </dt>
                    <dd className="[font-family:var(--font-body)] text-sm font-semibold text-(--color-foreground)">
                      {formattedPreviewAmount}
                    </dd>
                  </div>
                  <div className="border-t border-(--color-accent)/25 pt-2">
                    <dt className="[font-family:var(--font-body)] text-xs font-semibold uppercase text-(--color-secondary)">
                      Beneficiary
                    </dt>
                    <dd className="mt-1 [font-family:var(--font-body)] text-sm text-(--color-foreground)">
                      {payload.benificiaryAccountInfo.holderName || '-'}
                    </dd>
                    <dd className="[font-family:var(--font-body)] text-xs text-(--color-secondary)">
                      {payload.benificiaryAccountInfo.number || 'No account number yet'}
                    </dd>
                    <dd className="[font-family:var(--font-body)] text-xs text-(--color-secondary)">
                      {payload.benificiaryAccountInfo.orgName || 'No organization yet'}
                    </dd>
                  </div>
                  <div className="border-t border-(--color-accent)/25 pt-2">
                    <dt className="[font-family:var(--font-body)] text-xs font-semibold uppercase text-(--color-secondary)">
                      Sender
                    </dt>
                    <dd className="mt-1 [font-family:var(--font-body)] text-sm text-(--color-foreground)">
                      {`${payload.cardHolderInfo.firstName} ${payload.cardHolderInfo.lastName}`.trim() || '-'}
                    </dd>
                    <dd className="[font-family:var(--font-body)] text-xs text-(--color-secondary)">
                      {payload.cardHolderInfo.email || 'No email yet'}
                    </dd>
                    <dd className="[font-family:var(--font-body)] text-xs text-(--color-secondary)">
                      {payload.cardHolderInfo.phone || 'No phone yet'}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </aside>
        </section>
      )}
    </section>
  )
}
