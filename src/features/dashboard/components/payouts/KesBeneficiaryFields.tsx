import { Input } from '../../../../components/ui/Input.tsx'
import type { KePayoutFormPayload } from '../../services/kePayoutSchemas.ts'
import { normalizeKenyaMsisdn } from '../../utils/kenyaMarket.ts'

interface KesBeneficiaryFieldsProps {
  kePayload: KePayoutFormPayload
  setKePayload: React.Dispatch<React.SetStateAction<KePayoutFormPayload>>
}

export function KesBeneficiaryFields({
  kePayload,
  setKePayload,
}: KesBeneficiaryFieldsProps) {
  return (
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
  )
}
