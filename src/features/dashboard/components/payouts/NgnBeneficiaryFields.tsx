import { useMemo, useState } from 'react'
import { Button } from '../../../../components/ui/Button.tsx'
import { DropdownSelect } from '../../../../components/ui/DropdownSelect.tsx'
import { Input } from '../../../../components/ui/Input.tsx'
import {
  useNgnBanksQuery,
  useVerifyNgnAccountMutation,
} from '../../hooks/useNgnPayoutMutations.ts'
import type { NgnPayoutFormPayload } from '../../services/ngnPayoutSchemas.ts'

interface NgnBeneficiaryFieldsProps {
  ngnPayload: NgnPayoutFormPayload
  setNgnPayload: React.Dispatch<React.SetStateAction<NgnPayoutFormPayload>>
}

export function NgnBeneficiaryFields({
  ngnPayload,
  setNgnPayload,
}: NgnBeneficiaryFieldsProps) {
  const banksQuery = useNgnBanksQuery()
  const verifyMutation = useVerifyNgnAccountMutation()
  const [verifyError, setVerifyError] = useState<string | null>(null)

  const bankOptions = useMemo(
    () => [
      {
        label: banksQuery.isPending ? 'Loading banks…' : 'Select bank',
        value: '',
      },
      ...(banksQuery.data ?? []).map((bank) => ({
        label: bank.bankName,
        value: bank.bankCode,
      })),
    ],
    [banksQuery.data, banksQuery.isPending],
  )

  const isAccountNumberComplete = /^\d{10}$/.test(ngnPayload.accountNumber.trim())
  const canVerify =
    Boolean(ngnPayload.bankCode.trim()) &&
    isAccountNumberComplete &&
    !verifyMutation.isPending

  /** Any change to bank or account invalidates a previously resolved name. */
  function resetVerification(patch: Partial<NgnPayoutFormPayload>) {
    setVerifyError(null)
    verifyMutation.reset()
    setNgnPayload((previous) => ({ ...previous, ...patch, accountName: '' }))
  }

  async function handleVerify() {
    setVerifyError(null)
    try {
      const verification = await verifyMutation.mutateAsync({
        accountNumber: ngnPayload.accountNumber.trim(),
        bankCode: ngnPayload.bankCode.trim(),
      })
      const accountName = verification.accountName?.trim() ?? ''
      if (!accountName) {
        setVerifyError(
          'The bank did not return an account name. Check the details and try again.',
        )
        return
      }
      setNgnPayload((previous) => ({
        ...previous,
        accountName,
        bankName: verification.bankName?.trim() || previous.bankName,
      }))
    } catch (error) {
      setVerifyError(
        error instanceof Error
          ? error.message
          : 'Unable to verify this account right now.',
      )
    }
  }

  return (
    <div className="payout-field-grid">
      <h2 className="payout-panel-section-title sm:col-span-2">
        Beneficiary bank account
      </h2>
      <p className="payout-panel-section-desc sm:col-span-2">
        Choose the recipient bank and account number, then verify to confirm the
        account name before sending.
      </p>

      <label className="payout-field sm:col-span-2">
        <span className="payout-field-label">Bank</span>
        <DropdownSelect
          ariaLabel="Select beneficiary bank"
          options={bankOptions}
          value={ngnPayload.bankCode}
          disabled={banksQuery.isPending || banksQuery.isError}
          onChange={(bankCode) => {
            const bank = banksQuery.data?.find(
              (item) => item.bankCode === bankCode,
            )
            resetVerification({
              bankCode,
              bankName: bank?.bankName ?? '',
            })
          }}
          className="payout-field-select w-full max-w-md"
        />
        {banksQuery.isError ? (
          <span className="payout-field-hint">
            Unable to load the bank list. Refresh the page and try again.
          </span>
        ) : null}
      </label>

      <label className="payout-field sm:col-span-2">
        <span className="payout-field-label">Account number</span>
        <Input
          placeholder="0123456789"
          value={ngnPayload.accountNumber}
          inputMode="numeric"
          maxLength={10}
          autoComplete="off"
          onChange={(event) =>
            resetVerification({
              accountNumber: event.target.value.replace(/\D/g, '').slice(0, 10),
            })
          }
          className="payout-field-input max-w-sm font-[ui-monospace,monospace]"
        />
        <span className="payout-field-hint">
          Nigerian NUBAN account numbers are 10 digits.
        </span>
      </label>

      <div className="payout-field sm:col-span-2">
        <Button
          type="button"
          variant="ghost"
          className="dash-btn-outline self-start"
          disabled={!canVerify}
          onClick={() => void handleVerify()}
        >
          {verifyMutation.isPending ? 'Verifying…' : 'Verify account'}
        </Button>
      </div>

      {ngnPayload.accountName ? (
        <div className="payout-field sm:col-span-2">
          <span className="payout-field-label">Account name</span>
          <p className="[font-family:var(--font-body)] text-sm font-semibold text-(--dash-fg)">
            {ngnPayload.accountName}
          </p>
          <span className="payout-field-hint">
            Confirm this matches your intended recipient — bank transfers cannot
            be reversed.
          </span>
        </div>
      ) : null}

      {verifyError ? (
        <p className="payout-alert sm:col-span-2">{verifyError}</p>
      ) : null}

      <label className="payout-field">
        <span className="payout-field-label">Reference (optional)</span>
        <Input
          placeholder="wd-1001"
          value={ngnPayload.merchantReference}
          onChange={(event) =>
            setNgnPayload((previous) => ({
              ...previous,
              merchantReference: event.target.value,
            }))
          }
          className="payout-field-input"
        />
      </label>

      <label className="payout-field">
        <span className="payout-field-label">Description (optional)</span>
        <Input
          placeholder="Supplier payment"
          value={ngnPayload.description}
          onChange={(event) =>
            setNgnPayload((previous) => ({
              ...previous,
              description: event.target.value,
            }))
          }
          className="payout-field-input"
        />
      </label>
    </div>
  )
}
