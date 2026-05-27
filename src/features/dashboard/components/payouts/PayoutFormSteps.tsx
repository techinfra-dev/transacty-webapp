import { Input } from '../../../../components/ui/Input.tsx'
import { DropdownSelect } from '../../../../components/ui/DropdownSelect.tsx'
import type { BalanceResponse } from '../../services/balanceSchemas.ts'
import type { BeneficiaryAccountInfo, CardHolderInfo } from '../../services/payoutsSchemas.ts'
import type { PayoutFormPayload } from '../../services/payoutFormTypes.ts'
import {
  minimumPayoutAmount,
  payoutMethodOptions,
} from './payoutConstants.ts'
import { formatPayoutMoney } from './payoutFormatters.ts'

interface PayoutFormStepsProps {
  step: number
  payload: PayoutFormPayload
  setPayload: React.Dispatch<React.SetStateAction<PayoutFormPayload>>
  currency: string
  payoutLimits: BalanceResponse['limits']['payout'] | undefined
  effectiveMinimumAmount: number
  effectiveMaximumAmount: number | undefined
  formattedWalletBalance: string
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
  effectiveMaximumAmount,
  formattedWalletBalance,
  updateBeneficiaryField,
  updateCardHolderField,
  clientError,
  mutationErrorMessage,
}: PayoutFormStepsProps) {
  const paymentMethodOptions = payoutMethodOptions.map((methodOption) => ({
    label: methodOption,
    value: methodOption,
  }))
  const paymentMethodOptionsWithPlaceholder = [
    { label: 'Select payment method', value: '' },
    ...paymentMethodOptions,
  ]

  const rangeHint = (() => {
    if (!currency) {
      return 'Select a wallet to see amount limits.'
    }
    const minLabel = formatPayoutMoney(currency, String(effectiveMinimumAmount))
    if (payoutLimits?.max) {
      const maxLabel = formatPayoutMoney(currency, String(payoutLimits.max))
      return `Allowed range: ${minLabel} – ${maxLabel}. Available: ${formattedWalletBalance}.`
    }
    if (effectiveMaximumAmount !== undefined) {
      const maxLabel = formatPayoutMoney(currency, String(effectiveMaximumAmount))
      return `Minimum ${minLabel}. Maximum ${maxLabel} (wallet balance).`
    }
    return `Minimum payout amount: ${formatPayoutMoney(currency, String(minimumPayoutAmount))}.`
  })()

  if (step < 2 || step > 4) {
    return null
  }

  return (
    <div className="payout-panel payout-panel--form">
      <div className="payout-panel-body">
        {step === 2 ? (
          <div className="payout-field-grid">
            <h2 className="payout-panel-section-title sm:col-span-2">Payout amount</h2>
            <p className="payout-panel-section-desc sm:col-span-2">
              Enter how much to send from the selected wallet.
            </p>

            <div className="payout-field sm:col-span-2">
              <span className="payout-field-label">Currency</span>
              <span className="payout-currency-badge">{currency || '—'}</span>
            </div>

            <label className="payout-field sm:col-span-2">
              <span className="payout-field-label">Amount</span>
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
                className="payout-field-input max-w-sm"
              />
              <span className="payout-field-hint">{rangeHint}</span>
            </label>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="payout-field-grid payout-field-grid--two">
            <h2 className="payout-panel-section-title sm:col-span-2">Beneficiary account</h2>
            <p className="payout-panel-section-desc sm:col-span-2">
              Enter the recipient account that will receive this payout.
            </p>

            <label className="payout-field">
              <span className="payout-field-label">Account number</span>
              <Input
                placeholder="Account number"
                value={payload.benificiaryAccountInfo.number}
                onChange={(event) => updateBeneficiaryField('number', event.target.value)}
                className="payout-field-input"
              />
            </label>

            <label className="payout-field">
              <span className="payout-field-label">Holder name</span>
              <Input
                placeholder="Account holder name"
                value={payload.benificiaryAccountInfo.holderName}
                onChange={(event) =>
                  updateBeneficiaryField('holderName', event.target.value)
                }
                className="payout-field-input"
              />
            </label>

            <label className="payout-field sm:col-span-2">
              <span className="payout-field-label">Payment method</span>
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
                className="payout-field-select w-full max-w-md"
              />
            </label>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="payout-field-grid payout-field-grid--two">
            <h2 className="payout-panel-section-title sm:col-span-2">Sender identity</h2>
            <p className="payout-panel-section-desc sm:col-span-2">
              This information identifies who initiated the payout request.
            </p>

            <label className="payout-field">
              <span className="payout-field-label">First name</span>
              <Input
                placeholder="First name"
                value={payload.cardHolderInfo.firstName}
                onChange={(event) => updateCardHolderField('firstName', event.target.value)}
                className="payout-field-input"
              />
            </label>

            <label className="payout-field">
              <span className="payout-field-label">Last name</span>
              <Input
                placeholder="Last name"
                value={payload.cardHolderInfo.lastName}
                onChange={(event) => updateCardHolderField('lastName', event.target.value)}
                className="payout-field-input"
              />
            </label>

            <label className="payout-field sm:col-span-2">
              <span className="payout-field-label">Email</span>
              <Input
                placeholder="Email address"
                value={payload.cardHolderInfo.email}
                onChange={(event) => updateCardHolderField('email', event.target.value)}
                className="payout-field-input"
              />
            </label>

            <label className="payout-field sm:col-span-2">
              <span className="payout-field-label">Phone</span>
              <Input
                placeholder="Phone number"
                value={payload.cardHolderInfo.phone}
                onChange={(event) => updateCardHolderField('phone', event.target.value)}
                className="payout-field-input"
              />
            </label>
          </div>
        ) : null}

        {clientError ? <p className="payout-alert">{clientError}</p> : null}
        {mutationErrorMessage ? (
          <p className="payout-alert">{mutationErrorMessage}</p>
        ) : null}
      </div>
    </div>
  )
}
