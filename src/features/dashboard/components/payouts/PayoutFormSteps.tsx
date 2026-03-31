import { Input } from '../../../../components/ui/Input.tsx'
import { DropdownSelect } from '../../../../components/ui/DropdownSelect.tsx'
import type { BalanceResponse } from '../../services/balanceSchemas.ts'
import type { BeneficiaryAccountInfo, CardHolderInfo } from '../../services/payoutsSchemas.ts'
import type { PayoutFormPayload } from '../../services/payoutFormTypes.ts'
import {
  minimumPayoutAmount,
  payoutFieldLabelClass,
  payoutFormCardClass,
  payoutInputClass,
  payoutMethodOptions,
} from './payoutConstants.ts'
import { currencyOptionLabel, formatPayoutMoney } from './payoutFormatters.ts'

interface PayoutFormStepsProps {
  step: number
  payload: PayoutFormPayload
  setPayload: React.Dispatch<React.SetStateAction<PayoutFormPayload>>
  currency: string
  payoutLimits: BalanceResponse['limits']['payout'] | undefined
  effectiveMinimumAmount: number
  updateBeneficiaryField: (field: keyof BeneficiaryAccountInfo, value: string) => void
  updateCardHolderField: (field: keyof CardHolderInfo, value: string) => void
  clientError: string | null
  mutationErrorMessage: string | undefined
}

export function PayoutFormSteps({
  step,
  payload,
  setPayload,
  currency,
  payoutLimits,
  effectiveMinimumAmount,
  updateBeneficiaryField,
  updateCardHolderField,
  clientError,
  mutationErrorMessage,
}: PayoutFormStepsProps) {
  const currencyOptions = [{ label: currencyOptionLabel(currency), value: currency }]
  const paymentMethodOptions = payoutMethodOptions.map((methodOption) => ({
    label: methodOption,
    value: methodOption,
  }))
  const paymentMethodOptionsWithPlaceholder = [
    { label: 'Select payment method', value: '' },
    ...paymentMethodOptions,
  ]

  return (
    <div className={payoutFormCardClass}>
      {step === 1 ? (
        <div className="space-y-4">
          <div>
            <h2 className="[font-family:var(--font-display)] text-base font-semibold text-[#0F0700]">
              Payout details
            </h2>
            <div className="mt-2 border-b border-[#C9C2B8]" />
          </div>

          <label className="block space-y-1.5">
            <span className={payoutFieldLabelClass}>Currency</span>
            <DropdownSelect
              ariaLabel="Payout currency (from account)"
              options={currencyOptions}
              disabled
              value={currency}
              onChange={() => {}}
              className="w-full max-w-md"
            />
          </label>

          <label className="block space-y-1.5">
            <span className={payoutFieldLabelClass}>Amount</span>
            <Input
              value={payload.amount}
              onChange={(event) =>
                setPayload((previousPayload) => ({
                  ...previousPayload,
                  amount: event.target.value,
                }))
              }
              placeholder="0.00"
              inputMode="decimal"
              className={payoutInputClass}
            />
          </label>

          <p className="[font-family:var(--font-body)] text-[12px] leading-snug text-[#566167]">
            {payoutLimits
              ? `Allowed range: ${formatPayoutMoney(currency, String(effectiveMinimumAmount))} - ${formatPayoutMoney(currency, String(payoutLimits.max))}`
              : `Minimum payout amount: ${formatPayoutMoney(currency, String(minimumPayoutAmount))}`}
          </p>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-4">
          <div>
            <h2 className="[font-family:var(--font-display)] text-base font-semibold text-[#0F0700]">
              Beneficiary account
            </h2>
            <div className="mt-2 border-b border-[#C9C2B8]" />
          </div>
          <p className="[font-family:var(--font-body)] text-[13px] leading-snug text-[#566167]">
            Enter the recipient account that will receive the payout.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              placeholder="Account number"
              value={payload.benificiaryAccountInfo.number}
              onChange={(event) => updateBeneficiaryField('number', event.target.value)}
              className={payoutInputClass}
            />
            <Input
              placeholder="Holder name"
              value={payload.benificiaryAccountInfo.holderName}
              onChange={(event) => updateBeneficiaryField('holderName', event.target.value)}
              className={payoutInputClass}
            />
            <label className="space-y-1.5 sm:col-span-2">
              <span className={payoutFieldLabelClass}>Payment method</span>
              <DropdownSelect
                ariaLabel="Select payment method"
                options={paymentMethodOptionsWithPlaceholder}
                value={payload.benificiaryAccountInfo.orgCode}
                onChange={(selectedMethod) => {
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
                className="w-full"
              />
            </label>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-4">
          <div>
            <h2 className="[font-family:var(--font-display)] text-base font-semibold text-[#0F0700]">
              Sender identity
            </h2>
            <div className="mt-2 border-b border-[#C9C2B8]" />
          </div>
          <p className="[font-family:var(--font-body)] text-[13px] leading-snug text-[#566167]">
            This information identifies who initiated the payout request.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              placeholder="First name"
              value={payload.cardHolderInfo.firstName}
              onChange={(event) => updateCardHolderField('firstName', event.target.value)}
              className={payoutInputClass}
            />
            <Input
              placeholder="Last name"
              value={payload.cardHolderInfo.lastName}
              onChange={(event) => updateCardHolderField('lastName', event.target.value)}
              className={payoutInputClass}
            />
            <Input
              placeholder="Email"
              value={payload.cardHolderInfo.email}
              onChange={(event) => updateCardHolderField('email', event.target.value)}
              className={`${payoutInputClass} sm:col-span-2`}
            />
            <Input
              placeholder="Phone number"
              value={payload.cardHolderInfo.phone}
              onChange={(event) => updateCardHolderField('phone', event.target.value)}
              className={`${payoutInputClass} sm:col-span-2`}
            />
          </div>
        </div>
      ) : null}

      {clientError ? (
        <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 [font-family:var(--font-body)] text-[13px] text-rose-700">
          {clientError}
        </p>
      ) : null}

      {mutationErrorMessage ? (
        <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 [font-family:var(--font-body)] text-[13px] text-rose-700">
          {mutationErrorMessage}
        </p>
      ) : null}
    </div>
  )
}
