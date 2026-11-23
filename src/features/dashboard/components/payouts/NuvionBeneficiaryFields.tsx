import { Input } from '../../../../components/ui/Input.tsx'
import { DropdownSelect } from '../../../../components/ui/DropdownSelect.tsx'
import {
  destinationTypesForCurrency,
  nuvionGhsMomoOptions,
  nuvionRelationshipOptions,
  nuvionTzsMomoOptions,
  nuvionUsdAccountTypeOptions,
  nuvionUsdSchemeOptions,
  type NuvionDestinationType,
  type NuvionPayoutFormPayload,
} from '../../services/nuvionPayoutSchemas.ts'

interface NuvionBeneficiaryFieldsProps {
  nuvionPayload: NuvionPayoutFormPayload
  setNuvionPayload: React.Dispatch<React.SetStateAction<NuvionPayoutFormPayload>>
  /** When true, hide destination-type picker (e.g. KES bank-only path). */
  lockDestinationType?: boolean
}

function destinationTypeLabel(type: NuvionDestinationType) {
  switch (type) {
    case 'usd_bank':
      return 'US bank (ACH / wire / RTP)'
    case 'aed_bank':
      return 'UAE bank (IBAN)'
    case 'ghs_bank':
      return 'Ghana bank'
    case 'ghs_momo':
      return 'Ghana mobile money'
    case 'tzs_bank':
      return 'Tanzania bank'
    case 'tzs_momo':
      return 'Tanzania mobile money'
    case 'mxn_bank':
      return 'Mexico bank (CLABE)'
    case 'kes_bank':
      return 'Kenya bank (EFT)'
    default:
      return type
  }
}

export function NuvionBeneficiaryFields({
  nuvionPayload,
  setNuvionPayload,
  lockDestinationType = false,
}: NuvionBeneficiaryFieldsProps) {
  const destinationOptions = destinationTypesForCurrency(
    nuvionPayload.currency,
  ).map((type) => ({
    label: destinationTypeLabel(type),
    value: type,
  }))

  const destinationType = nuvionPayload.destinationType

  return (
    <div className="payout-field-grid payout-field-grid--two">
      <h2 className="payout-panel-section-title sm:col-span-2">
        Destination & beneficiary
      </h2>
      <p className="payout-panel-section-desc sm:col-span-2">
        Pay out in the same currency as this wallet. Beneficiary details are
        required for every destination type, including mobile money.
      </p>

      {!lockDestinationType && destinationOptions.length > 1 ? (
        <label className="payout-field sm:col-span-2">
          <span className="payout-field-label">Destination type</span>
          <DropdownSelect
            ariaLabel="Select destination type"
            options={[
              { label: 'Select destination', value: '' },
              ...destinationOptions,
            ]}
            value={nuvionPayload.destinationType}
            onChange={(value) =>
              setNuvionPayload((previous) => ({
                ...previous,
                destinationType: value as NuvionDestinationType | '',
                momoScheme:
                  value === 'ghs_momo'
                    ? previous.momoScheme || 'mtn'
                    : value === 'tzs_momo'
                      ? previous.momoScheme || 'vodacom'
                      : previous.momoScheme,
              }))
            }
            className="payout-field-select w-full max-w-md"
          />
        </label>
      ) : null}

      {destinationType === 'usd_bank' ? (
        <>
          <label className="payout-field">
            <span className="payout-field-label">Scheme</span>
            <DropdownSelect
              ariaLabel="Select USD payout scheme"
              options={[...nuvionUsdSchemeOptions]}
              value={nuvionPayload.scheme}
              onChange={(value) =>
                setNuvionPayload((previous) => ({
                  ...previous,
                  scheme: value as NuvionPayoutFormPayload['scheme'],
                }))
              }
              className="payout-field-select w-full"
            />
          </label>
          <label className="payout-field">
            <span className="payout-field-label">Account type</span>
            <DropdownSelect
              ariaLabel="Select account type"
              options={[...nuvionUsdAccountTypeOptions]}
              value={nuvionPayload.accountType}
              onChange={(value) =>
                setNuvionPayload((previous) => ({
                  ...previous,
                  accountType: value as NuvionPayoutFormPayload['accountType'],
                }))
              }
              className="payout-field-select w-full"
            />
          </label>
          <label className="payout-field">
            <span className="payout-field-label">Routing number</span>
            <Input
              placeholder="9 digits"
              inputMode="numeric"
              value={nuvionPayload.routingNumber}
              onChange={(event) =>
                setNuvionPayload((previous) => ({
                  ...previous,
                  routingNumber: event.target.value.replace(/\D/g, '').slice(0, 9),
                }))
              }
            />
          </label>
          <label className="payout-field">
            <span className="payout-field-label">Account number</span>
            <Input
              value={nuvionPayload.accountNumber}
              onChange={(event) =>
                setNuvionPayload((previous) => ({
                  ...previous,
                  accountNumber: event.target.value,
                }))
              }
            />
          </label>
          <label className="payout-field sm:col-span-2">
            <span className="payout-field-label">Bank name</span>
            <Input
              value={nuvionPayload.bankName}
              onChange={(event) =>
                setNuvionPayload((previous) => ({
                  ...previous,
                  bankName: event.target.value,
                }))
              }
            />
          </label>
          <label className="payout-field sm:col-span-2">
            <span className="payout-field-label">Bank address</span>
            <Input
              placeholder="Street address"
              value={nuvionPayload.bankAddressLine1}
              onChange={(event) =>
                setNuvionPayload((previous) => ({
                  ...previous,
                  bankAddressLine1: event.target.value,
                }))
              }
            />
          </label>
          <label className="payout-field">
            <span className="payout-field-label">Bank city</span>
            <Input
              value={nuvionPayload.bankAddressCity}
              onChange={(event) =>
                setNuvionPayload((previous) => ({
                  ...previous,
                  bankAddressCity: event.target.value,
                }))
              }
            />
          </label>
          <label className="payout-field">
            <span className="payout-field-label">Bank state</span>
            <Input
              value={nuvionPayload.bankAddressState}
              onChange={(event) =>
                setNuvionPayload((previous) => ({
                  ...previous,
                  bankAddressState: event.target.value,
                }))
              }
            />
          </label>
          <label className="payout-field">
            <span className="payout-field-label">Bank postal code</span>
            <Input
              value={nuvionPayload.bankAddressPostalCode}
              onChange={(event) =>
                setNuvionPayload((previous) => ({
                  ...previous,
                  bankAddressPostalCode: event.target.value,
                }))
              }
            />
          </label>
          <label className="payout-field">
            <span className="payout-field-label">Bank country</span>
            <Input
              className="uppercase"
              maxLength={2}
              placeholder="US"
              value={nuvionPayload.bankAddressCountryCode}
              onChange={(event) =>
                setNuvionPayload((previous) => ({
                  ...previous,
                  bankAddressCountryCode: event.target.value.toUpperCase(),
                }))
              }
            />
          </label>
        </>
      ) : null}

      {destinationType === 'aed_bank' ? (
        <>
          <label className="payout-field sm:col-span-2">
            <span className="payout-field-label">IBAN</span>
            <Input
              placeholder="AE070331234567890123456"
              value={nuvionPayload.iban}
              onChange={(event) =>
                setNuvionPayload((previous) => ({
                  ...previous,
                  iban: event.target.value,
                }))
              }
            />
          </label>
          <label className="payout-field">
            <span className="payout-field-label">SWIFT / BIC</span>
            <Input
              className="uppercase"
              value={nuvionPayload.swiftBic}
              onChange={(event) =>
                setNuvionPayload((previous) => ({
                  ...previous,
                  swiftBic: event.target.value.toUpperCase(),
                }))
              }
            />
          </label>
          <label className="payout-field">
            <span className="payout-field-label">Bank name</span>
            <Input
              value={nuvionPayload.bankName}
              onChange={(event) =>
                setNuvionPayload((previous) => ({
                  ...previous,
                  bankName: event.target.value,
                }))
              }
            />
          </label>
        </>
      ) : null}

      {destinationType === 'ghs_bank' ||
      destinationType === 'tzs_bank' ||
      destinationType === 'kes_bank' ? (
        <>
          <label className="payout-field">
            <span className="payout-field-label">Bank code</span>
            <Input
              value={nuvionPayload.bankCode}
              onChange={(event) =>
                setNuvionPayload((previous) => ({
                  ...previous,
                  bankCode: event.target.value,
                }))
              }
            />
          </label>
          <label className="payout-field">
            <span className="payout-field-label">Account number</span>
            <Input
              value={nuvionPayload.accountNumber}
              onChange={(event) =>
                setNuvionPayload((previous) => ({
                  ...previous,
                  accountNumber: event.target.value,
                }))
              }
            />
          </label>
          <label className="payout-field sm:col-span-2">
            <span className="payout-field-label">Bank name</span>
            <Input
              value={nuvionPayload.bankName}
              onChange={(event) =>
                setNuvionPayload((previous) => ({
                  ...previous,
                  bankName: event.target.value,
                }))
              }
            />
          </label>
        </>
      ) : null}

      {destinationType === 'ghs_momo' || destinationType === 'tzs_momo' ? (
        <>
          <label className="payout-field">
            <span className="payout-field-label">Mobile money network</span>
            <DropdownSelect
              ariaLabel="Select mobile money network"
              options={[
                ...(destinationType === 'ghs_momo'
                  ? nuvionGhsMomoOptions
                  : nuvionTzsMomoOptions),
              ]}
              value={nuvionPayload.momoScheme}
              onChange={(value) =>
                setNuvionPayload((previous) => ({
                  ...previous,
                  momoScheme: value,
                }))
              }
              className="payout-field-select w-full"
            />
          </label>
          <label className="payout-field">
            <span className="payout-field-label">Phone number</span>
            <Input
              inputMode="tel"
              value={nuvionPayload.phoneNumber}
              onChange={(event) =>
                setNuvionPayload((previous) => ({
                  ...previous,
                  phoneNumber: event.target.value,
                }))
              }
            />
          </label>
        </>
      ) : null}

      {destinationType === 'mxn_bank' ? (
        <label className="payout-field sm:col-span-2">
          <span className="payout-field-label">CLABE (18 digits)</span>
          <Input
            inputMode="numeric"
            maxLength={18}
            value={nuvionPayload.accountNumber}
            onChange={(event) =>
              setNuvionPayload((previous) => ({
                ...previous,
                accountNumber: event.target.value.replace(/\D/g, '').slice(0, 18),
              }))
            }
          />
        </label>
      ) : null}

      <h3 className="payout-panel-section-title sm:col-span-2 mt-2">
        Beneficiary
      </h3>

      <label className="payout-field sm:col-span-2">
        <span className="payout-field-label">Account holder name</span>
        <Input
          value={nuvionPayload.accountHolderName}
          onChange={(event) =>
            setNuvionPayload((previous) => ({
              ...previous,
              accountHolderName: event.target.value,
            }))
          }
        />
      </label>
      <label className="payout-field sm:col-span-2">
        <span className="payout-field-label">Email</span>
        <Input
          type="email"
          value={nuvionPayload.email}
          onChange={(event) =>
            setNuvionPayload((previous) => ({
              ...previous,
              email: event.target.value,
            }))
          }
        />
      </label>
      <label className="payout-field sm:col-span-2">
        <span className="payout-field-label">Address</span>
        <Input
          value={nuvionPayload.beneficiaryLine1}
          onChange={(event) =>
            setNuvionPayload((previous) => ({
              ...previous,
              beneficiaryLine1: event.target.value,
            }))
          }
        />
      </label>
      <label className="payout-field">
        <span className="payout-field-label">City</span>
        <Input
          value={nuvionPayload.beneficiaryCity}
          onChange={(event) =>
            setNuvionPayload((previous) => ({
              ...previous,
              beneficiaryCity: event.target.value,
            }))
          }
        />
      </label>
      <label className="payout-field">
        <span className="payout-field-label">Country</span>
        <Input
          className="uppercase"
          maxLength={2}
          placeholder="US"
          value={nuvionPayload.beneficiaryCountryCode}
          onChange={(event) =>
            setNuvionPayload((previous) => ({
              ...previous,
              beneficiaryCountryCode: event.target.value.toUpperCase(),
            }))
          }
        />
      </label>
      <label className="payout-field sm:col-span-2">
        <span className="payout-field-label">Relationship</span>
        <DropdownSelect
          ariaLabel="Select beneficiary relationship"
          options={[...nuvionRelationshipOptions]}
          value={nuvionPayload.relationship}
          onChange={(value) =>
            setNuvionPayload((previous) => ({
              ...previous,
              relationship:
                value as NuvionPayoutFormPayload['relationship'],
            }))
          }
          className="payout-field-select w-full max-w-md"
        />
      </label>

      <label className="payout-field sm:col-span-2">
        <span className="payout-field-label">Narration</span>
        <Input
          placeholder="Invoice payment INV-2025-001"
          maxLength={140}
          value={nuvionPayload.narration}
          onChange={(event) =>
            setNuvionPayload((previous) => ({
              ...previous,
              narration: event.target.value,
            }))
          }
        />
      </label>
    </div>
  )
}
