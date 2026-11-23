import { Input } from '../../../../components/ui/Input.tsx'
import type { KePayoutFormPayload } from '../../services/kePayoutSchemas.ts'
import type { NuvionPayoutFormPayload } from '../../services/nuvionPayoutSchemas.ts'
import { normalizeKenyaMsisdn } from '../../utils/kenyaMarket.ts'
import { NuvionBeneficiaryFields } from './NuvionBeneficiaryFields.tsx'

interface KesBeneficiaryFieldsProps {
  kePayload: KePayoutFormPayload
  setKePayload: React.Dispatch<React.SetStateAction<KePayoutFormPayload>>
  nuvionPayload: NuvionPayoutFormPayload
  setNuvionPayload: React.Dispatch<React.SetStateAction<NuvionPayoutFormPayload>>
  nuvionEntityApproved: boolean
}

export function KesBeneficiaryFields({
  kePayload,
  setKePayload,
  nuvionPayload,
  setNuvionPayload,
  nuvionEntityApproved,
}: KesBeneficiaryFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="payout-field-grid">
        <h2 className="payout-panel-section-title sm:col-span-2">
          Kenya payout method
        </h2>
        <p className="payout-panel-section-desc sm:col-span-2">
          M-Pesa uses the existing Kenya rail. Bank EFT goes through Nuvion once
          your entity is approved.
        </p>

        <div className="sm:col-span-2 flex flex-wrap gap-2">
          <button
            type="button"
            className={`dash-btn-outline ${kePayload.channel === 'momo' ? 'ring-2 ring-(--color-primary)' : ''}`}
            onClick={() =>
              setKePayload((previous) => ({ ...previous, channel: 'momo' }))
            }
          >
            M-Pesa
          </button>
          <button
            type="button"
            className={`dash-btn-outline ${kePayload.channel === 'bank' ? 'ring-2 ring-(--color-primary)' : ''}`}
            onClick={() => {
              setKePayload((previous) => ({ ...previous, channel: 'bank' }))
              setNuvionPayload((previous) => ({
                ...previous,
                currency: 'KES',
                destinationType: 'kes_bank',
                amount: kePayload.amount || previous.amount,
              }))
            }}
          >
            Bank transfer (Nuvion)
          </button>
        </div>
      </div>

      {kePayload.channel === 'bank' ? (
        nuvionEntityApproved ? (
          <NuvionBeneficiaryFields
            nuvionPayload={nuvionPayload}
            setNuvionPayload={setNuvionPayload}
            lockDestinationType
          />
        ) : (
          <p className="payout-alert payout-alert--inline">
            Approve your Nuvion entity in Settings → Markets before sending KES
            bank transfers.
          </p>
        )
      ) : (
        <div className="payout-field-grid">
          <h2 className="payout-panel-section-title sm:col-span-2">
            M-Pesa recipient
          </h2>
          <p className="payout-panel-section-desc sm:col-span-2">
            Send KES to a Kenyan M-Pesa number. Confirm the phone number before
            continuing.
          </p>

          <label className="payout-field sm:col-span-2">
            <span className="payout-field-label">Recipient name</span>
            <Input
              placeholder="Jane Doe"
              value={kePayload.accountName}
              onChange={(event) =>
                setKePayload((previous) => ({
                  ...previous,
                  accountName: event.target.value,
                }))
              }
            />
          </label>

          <label className="payout-field">
            <span className="payout-field-label">M-Pesa number</span>
            <Input
              placeholder="254712345678"
              inputMode="tel"
              autoComplete="tel"
              value={kePayload.accountNumber}
              onChange={(event) =>
                setKePayload((previous) => ({
                  ...previous,
                  accountNumber: event.target.value.replace(/[^\d+]/g, ''),
                }))
              }
              onBlur={() =>
                setKePayload((previous) => ({
                  ...previous,
                  accountNumber: normalizeKenyaMsisdn(previous.accountNumber),
                }))
              }
            />
          </label>

          <label className="payout-field">
            <span className="payout-field-label">Confirm M-Pesa number</span>
            <Input
              placeholder="254712345678"
              inputMode="tel"
              autoComplete="off"
              value={kePayload.confirmAccountNumber}
              onChange={(event) =>
                setKePayload((previous) => ({
                  ...previous,
                  confirmAccountNumber: event.target.value.replace(/[^\d+]/g, ''),
                }))
              }
              onBlur={() =>
                setKePayload((previous) => ({
                  ...previous,
                  confirmAccountNumber: normalizeKenyaMsisdn(
                    previous.confirmAccountNumber,
                  ),
                }))
              }
            />
          </label>

          <label className="payout-field sm:col-span-2">
            <span className="payout-field-label">Description (optional)</span>
            <Input
              placeholder="Supplier payment"
              value={kePayload.description}
              onChange={(event) =>
                setKePayload((previous) => ({
                  ...previous,
                  description: event.target.value,
                }))
              }
            />
          </label>
        </div>
      )}
    </div>
  )
}
