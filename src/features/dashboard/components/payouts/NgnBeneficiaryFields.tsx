import { useMemo, useRef, useState } from 'react'
import { DropdownSelect } from '../../../../components/ui/DropdownSelect.tsx'
import { Input } from '../../../../components/ui/Input.tsx'
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner.tsx'
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

  /**
   * Name enquiry fires on every completed account number, so a slow earlier
   * response must never overwrite the current input.
   */
  const requestIdRef = useRef(0)

  async function runVerification(bankCode: string, accountNumber: string) {
    const requestId = (requestIdRef.current += 1)
    setVerifyError(null)
    try {
      const verification = await verifyMutation.mutateAsync({
        accountNumber,
        bankCode,
      })
      if (requestId !== requestIdRef.current) {
        return
      }
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
      if (requestId !== requestIdRef.current) {
        return
      }
      setVerifyError(
        error instanceof Error
          ? error.message
          : 'Unable to verify this account right now.',
      )
    }
  }

  function handleBankChange(bankCode: string) {
    const bank = banksQuery.data?.find((item) => item.bankCode === bankCode)
    requestIdRef.current += 1
    setVerifyError(null)
    setNgnPayload((previous) => ({
      ...previous,
      bankCode,
      bankName: bank?.bankName ?? '',
      accountName: '',
    }))

    const accountNumber = ngnPayload.accountNumber.trim()
    if (bankCode && /^\d{10}$/.test(accountNumber)) {
      void runVerification(bankCode, accountNumber)
    }
  }

  function handleAccountNumberChange(rawValue: string) {
    const accountNumber = rawValue.replace(/\D/g, '').slice(0, 10)
    requestIdRef.current += 1
    setVerifyError(null)
    setNgnPayload((previous) => ({
      ...previous,
      accountNumber,
      accountName: '',
    }))

    const bankCode = ngnPayload.bankCode.trim()
    if (bankCode && accountNumber.length === 10) {
      void runVerification(bankCode, accountNumber)
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
          onChange={handleBankChange}
          searchable
          searchPlaceholder="Search banks…"
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
          onChange={(event) => handleAccountNumberChange(event.target.value)}
          className="payout-field-input max-w-sm font-[ui-monospace,monospace]"
        />
        <span className="payout-field-hint">
          {ngnPayload.bankCode.trim()
            ? 'Enter all 10 digits — we confirm the account name automatically.'
            : 'Select a bank first, then enter the 10-digit NUBAN.'}
        </span>
      </label>

      {verifyMutation.isPending ? (
        <div className="payout-field sm:col-span-2">
          <LoadingSpinner label="Confirming account name…" />
        </div>
      ) : ngnPayload.accountName ? (
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
    </div>
  )
}
