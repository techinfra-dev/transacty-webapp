import { Input } from '../../../../components/ui/Input.tsx'
import { DropdownSelect } from '../../../../components/ui/DropdownSelect.tsx'
import type { BalanceResponse } from '../../services/balanceSchemas.ts'
import type { BeneficiaryAccountInfo, CardHolderInfo } from '../../services/payoutsSchemas.ts'
import type { EurPayoutFormPayload } from '../../services/eurPayoutFormTypes.ts'
import type { EurPayoutUserDetails } from '../../services/eurPayoutSchemas.ts'
import type { PayoutFormPayload } from '../../services/payoutFormTypes.ts'
import {
  EUR_PAYOUT_SETTLEMENT_CURRENCY,
  minimumPayoutAmount,
  payoutMethodOptions,
  type PayoutRail,
} from './payoutConstants.ts'
import { eurPayoutCountryOptionsWithPlaceholder } from '../../utils/eurPayoutCountryOptions.ts'
import { formatPayoutMoney } from './payoutFormatters.ts'

interface PayoutFormStepsProps {
  step: number
  payoutRail: PayoutRail | null
  payload: PayoutFormPayload
  setPayload: React.Dispatch<React.SetStateAction<PayoutFormPayload>>
  eurPayload: EurPayoutFormPayload
  setEurPayload: React.Dispatch<React.SetStateAction<EurPayoutFormPayload>>
  displayCurrency: string
  settlementCurrency: string
  payoutLimits: BalanceResponse['limits']['payout'] | undefined
  effectiveMinimumAmount: number
  effectiveMaximumAmount: number | undefined
  formattedWalletBalance: string
  updateBeneficiaryField: (field: keyof BeneficiaryAccountInfo, value: string) => void
  updateCardHolderField: (field: keyof CardHolderInfo, value: string) => void
  updateEurUserField: (field: keyof EurPayoutUserDetails, value: string) => void
  clientError: string | null
  mutationErrorMessage: string | undefined
}

export function PayoutFormSteps({
  step,
  payoutRail,
  payload,
  setPayload,
  eurPayload,
  setEurPayload,
  displayCurrency,
  settlementCurrency,
  payoutLimits,
  effectiveMinimumAmount,
  effectiveMaximumAmount,
  formattedWalletBalance,
  updateBeneficiaryField,
  updateCardHolderField,
  updateEurUserField,
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
    if (!displayCurrency) {
      return 'Select a wallet to see amount limits.'
    }
    const minLabel = formatPayoutMoney(displayCurrency, String(effectiveMinimumAmount))
    if (payoutRail === 'eur') {
      return `Enter the EUR amount sent to the beneficiary bank account. Your ${EUR_PAYOUT_SETTLEMENT_CURRENCY} wallet (${formattedWalletBalance}) will be debited at the quoted rate when you submit. Minimum ${minLabel}.`
    }
    if (payoutLimits?.max) {
      const maxLabel = formatPayoutMoney(displayCurrency, String(payoutLimits.max))
      return `Allowed range: ${minLabel} – ${maxLabel}. Available: ${formattedWalletBalance}.`
    }
    if (effectiveMaximumAmount !== undefined) {
      const maxLabel = formatPayoutMoney(displayCurrency, String(effectiveMaximumAmount))
      return `Minimum ${minLabel}. Maximum ${maxLabel} (wallet balance).`
    }
    return `Minimum payout amount: ${formatPayoutMoney(displayCurrency, String(minimumPayoutAmount))}.`
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
              {payoutRail === 'eur'
                ? `Enter how much EUR to send to the beneficiary IBAN. Settlement debits your ${settlementCurrency} wallet.`
                : 'Enter how much to send from the selected wallet.'}
            </p>

            <div className="payout-field sm:col-span-2">
              <span className="payout-field-label">Payout currency</span>
              <span className="payout-currency-badge">{displayCurrency || '—'}</span>
              {payoutRail === 'eur' ? (
                <span className="payout-field-hint">
                  Settlement wallet: {settlementCurrency || EUR_PAYOUT_SETTLEMENT_CURRENCY}
                </span>
              ) : null}
            </div>

            <label className="payout-field sm:col-span-2">
              <span className="payout-field-label">Amount</span>
              <Input
                value={payoutRail === 'eur' ? eurPayload.amount : payload.amount}
                onChange={(event) => {
                  const nextAmount = event.target.value
                  if (payoutRail === 'eur') {
                    setEurPayload((previousPayload) => ({
                      ...previousPayload,
                      amount: nextAmount,
                    }))
                    return
                  }
                  setPayload((previousPayload) => ({
                    ...previousPayload,
                    amount: nextAmount,
                  }))
                }}
                placeholder="0.00"
                inputMode="decimal"
                className="payout-field-input max-w-sm"
              />
              <span className="payout-field-hint">{rangeHint}</span>
            </label>
          </div>
        ) : null}

        {step === 3 ? (
          payoutRail === 'eur' ? (
            <div className="payout-field-grid">
              <h2 className="payout-panel-section-title sm:col-span-2">
                Beneficiary bank account
              </h2>
              <p className="payout-panel-section-desc sm:col-span-2">
                Enter the IBAN that will receive this EUR payout.
              </p>

              <label className="payout-field sm:col-span-2">
                <span className="payout-field-label">IBAN</span>
                <Input
                  placeholder="FR76 3000 6000 0112 3456 7890 185"
                  value={eurPayload.iban}
                  onChange={(event) =>
                    setEurPayload((previousPayload) => ({
                      ...previousPayload,
                      iban: event.target.value,
                    }))
                  }
                  className="payout-field-input"
                  autoCapitalize="characters"
                />
              </label>
            </div>
          ) : (
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
          )
        ) : null}

        {step === 4 ? (
          payoutRail === 'eur' ? (
            <div className="payout-field-grid payout-field-grid--two">
              <h2 className="payout-panel-section-title sm:col-span-2">
                Beneficiary identity
              </h2>
              <p className="payout-panel-section-desc sm:col-span-2">
                Required for Europe Open Banking payout compliance.
              </p>

              <label className="payout-field">
                <span className="payout-field-label">First name</span>
                <Input
                  placeholder="Jane"
                  value={eurPayload.userDetails.firstName}
                  onChange={(event) => updateEurUserField('firstName', event.target.value)}
                  className="payout-field-input"
                />
              </label>

              <label className="payout-field">
                <span className="payout-field-label">Last name</span>
                <Input
                  placeholder="Doe"
                  value={eurPayload.userDetails.lastName}
                  onChange={(event) => updateEurUserField('lastName', event.target.value)}
                  className="payout-field-input"
                />
              </label>

              <label className="payout-field sm:col-span-2">
                <span className="payout-field-label">Email</span>
                <Input
                  placeholder="beneficiary@example.com"
                  value={eurPayload.userDetails.email}
                  onChange={(event) => updateEurUserField('email', event.target.value)}
                  className="payout-field-input"
                />
              </label>

              <label className="payout-field">
                <span className="payout-field-label">Country</span>
                <DropdownSelect
                  ariaLabel="Select beneficiary country"
                  options={eurPayoutCountryOptionsWithPlaceholder}
                  value={eurPayload.userDetails.country}
                  onChange={(value) => updateEurUserField('country', value)}
                  className="payout-field-select w-full"
                />
              </label>

              <label className="payout-field">
                <span className="payout-field-label">Date of birth</span>
                <Input
                  type="date"
                  value={eurPayload.userDetails.dob}
                  onChange={(event) => updateEurUserField('dob', event.target.value)}
                  className="payout-field-input"
                />
              </label>
            </div>
          ) : (
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
          )
        ) : null}

        {clientError ? <p className="payout-alert">{clientError}</p> : null}
        {mutationErrorMessage ? (
          <p className="payout-alert">{mutationErrorMessage}</p>
        ) : null}
      </div>
    </div>
  )
}
