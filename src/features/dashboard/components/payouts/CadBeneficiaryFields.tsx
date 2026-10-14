import { useMemo, useState } from 'react'
import { DropdownSelect } from '../../../../components/ui/DropdownSelect.tsx'
import { Input } from '../../../../components/ui/Input.tsx'
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner.tsx'
import {
  useCadBillSearchQuery,
  useCadInstitutionsQuery,
  useVerifyCadBankMutation,
} from '../../hooks/useCadPayoutMutations.ts'
import type {
  CadInstitution,
  CadPayoutFormPayload,
  CadPayoutRail,
} from '../../services/cadPayoutSchemas.ts'

function institutionNumberFor(institution: CadInstitution) {
  const explicit = institution.institutionNumber?.trim() ?? ''
  if (/^\d{3}$/.test(explicit)) {
    return explicit
  }
  const identifier = institution.identifier.trim()
  if (/^\d{1,3}$/.test(identifier)) {
    return identifier.padStart(3, '0')
  }
  return ''
}

const railOptions: { label: string; value: CadPayoutRail }[] = [
  { label: 'Canadian bank account', value: 'bank' },
  { label: 'Interac email', value: 'interac_email' },
  { label: 'Bill pay', value: 'bill' },
]

interface CadBeneficiaryFieldsProps {
  cadPayload: CadPayoutFormPayload
  setCadPayload: React.Dispatch<React.SetStateAction<CadPayoutFormPayload>>
}

export function CadBeneficiaryFields({
  cadPayload,
  setCadPayload,
}: CadBeneficiaryFieldsProps) {
  const institutionsQuery = useCadInstitutionsQuery(cadPayload.rail === 'bank')
  const verifyMutation = useVerifyCadBankMutation()
  const [verifyError, setVerifyError] = useState<string | null>(null)
  const [verifyOk, setVerifyOk] = useState(false)
  const [billQuery, setBillQuery] = useState(cadPayload.bill.billerName)
  const billsQuery = useCadBillSearchQuery(billQuery, cadPayload.rail === 'bill')

  const institutionOptions = useMemo(
    () => [
      {
        label: institutionsQuery.isPending ? 'Loading banks…' : 'Select bank',
        value: '',
      },
      ...(institutionsQuery.data ?? []).map((institution) => ({
        label: institution.name,
        value: institution.identifier,
      })),
    ],
    [institutionsQuery.data, institutionsQuery.isPending],
  )

  const billOptions = useMemo(
    () => [
      { label: billsQuery.isPending ? 'Searching…' : 'Select biller', value: '' },
      ...(billsQuery.data ?? []).map((biller) => ({
        label: biller.name,
        value: biller.billerId,
      })),
    ],
    [billsQuery.data, billsQuery.isPending],
  )

  async function handleVerifyBank() {
    setVerifyError(null)
    setVerifyOk(false)
    try {
      const result = await verifyMutation.mutateAsync({
        institutionIdentifier: cadPayload.bank.institutionIdentifier.trim(),
        accountNumber: cadPayload.bank.accountNumber.trim(),
        sortCode: cadPayload.bank.transitNumber.trim(),
      })
      const accountName = result.accountName?.trim()
      if (accountName) {
        setCadPayload((previous) => ({
          ...previous,
          bank: { ...previous.bank, accountName },
        }))
      }
      if (
        result.verified === false ||
        result.valid === false ||
        result.matched === false
      ) {
        setVerifyError(
          result.message?.trim() ||
            'This account could not be confirmed. Check the details and try again.',
        )
        return
      }
      setVerifyOk(true)
    } catch (error) {
      setVerifyError(
        error instanceof Error
          ? error.message
          : 'Unable to verify this account right now.',
      )
    }
  }

  function updateBank(
    field: keyof CadPayoutFormPayload['bank'],
    value: string,
  ) {
    setVerifyOk(false)
    setVerifyError(null)
    setCadPayload((previous) => ({
      ...previous,
      bank: { ...previous.bank, [field]: value },
    }))
  }

  return (
    <div className="payout-field-grid">
      <h2 className="payout-panel-section-title sm:col-span-2">
        CAD recipient
      </h2>
      <p className="payout-panel-section-desc sm:col-span-2">
        Send CAD to a Canadian bank account, an Interac email, or a biller.
      </p>

      <label className="payout-field sm:col-span-2">
        <span className="payout-field-label">Payout method</span>
        <DropdownSelect
          ariaLabel="Select CAD payout method"
          options={railOptions}
          value={cadPayload.rail}
          onChange={(rail) =>
            setCadPayload((previous) => ({
              ...previous,
              rail: rail as CadPayoutRail,
            }))
          }
          className="payout-field-select w-full max-w-md"
        />
      </label>

      {cadPayload.rail === 'bank' ? (
        <>
          <label className="payout-field sm:col-span-2">
            <span className="payout-field-label">Bank</span>
            <DropdownSelect
              ariaLabel="Select Canadian bank"
              options={institutionOptions}
              value={cadPayload.bank.institutionIdentifier}
              disabled={institutionsQuery.isPending}
              searchable
              searchPlaceholder="Search banks…"
              onChange={(identifier) => {
                const institution = (institutionsQuery.data ?? []).find(
                  (item) => item.identifier === identifier,
                )
                setVerifyOk(false)
                setVerifyError(null)
                setCadPayload((previous) => ({
                  ...previous,
                  bank: {
                    ...previous.bank,
                    institutionIdentifier: identifier,
                    institutionNumber: institution
                      ? institutionNumberFor(institution)
                      : '',
                    accountName: '',
                  },
                }))
              }}
              className="payout-field-select w-full max-w-md"
            />
            {institutionsQuery.isError ? (
              <span className="payout-field-hint">
                Unable to load banks. Refresh and try again.
              </span>
            ) : null}
          </label>
          {cadPayload.bank.institutionIdentifier &&
          !/^\d{3}$/.test(cadPayload.bank.institutionNumber) ? (
            <label className="payout-field">
              <span className="payout-field-label">Institution number</span>
              <Input
                placeholder="001"
                inputMode="numeric"
                maxLength={3}
                autoComplete="off"
                value={cadPayload.bank.institutionNumber}
                onChange={(event) =>
                  updateBank(
                    'institutionNumber',
                    event.target.value.replace(/\D/g, '').slice(0, 3),
                  )
                }
                className="payout-field-input font-[ui-monospace,monospace]"
              />
            </label>
          ) : null}
          <label className="payout-field">
            <span className="payout-field-label">Sort code</span>
            <Input
              placeholder="01102"
              inputMode="numeric"
              maxLength={5}
              autoComplete="off"
              value={cadPayload.bank.transitNumber}
              onChange={(event) =>
                updateBank(
                  'transitNumber',
                  event.target.value.replace(/\D/g, '').slice(0, 5),
                )
              }
              className="payout-field-input font-[ui-monospace,monospace]"
            />
          </label>
          <label className="payout-field sm:col-span-2">
            <span className="payout-field-label">Account number</span>
            <Input
              placeholder="1234567"
              inputMode="numeric"
              maxLength={12}
              autoComplete="off"
              value={cadPayload.bank.accountNumber}
              onChange={(event) =>
                updateBank(
                  'accountNumber',
                  event.target.value.replace(/\D/g, '').slice(0, 12),
                )
              }
              className="payout-field-input max-w-sm font-[ui-monospace,monospace]"
            />
          </label>
          <label className="payout-field sm:col-span-2">
            <span className="payout-field-label">Account name</span>
            <Input
              placeholder="Jane Doe"
              value={cadPayload.bank.accountName}
              onChange={(event) => updateBank('accountName', event.target.value)}
              className="payout-field-input"
            />
          </label>
          <div className="sm:col-span-2">
            <button
              type="button"
              className="dash-btn-outline"
              disabled={
                verifyMutation.isPending ||
                !cadPayload.bank.institutionIdentifier.trim() ||
                !/^\d{5}$/.test(cadPayload.bank.transitNumber.trim()) ||
                cadPayload.bank.accountNumber.trim().length < 5
              }
              onClick={() => void handleVerifyBank()}
            >
              {verifyMutation.isPending ? 'Checking account…' : 'Verify account'}
            </button>
            {verifyOk ? (
              <p className="payout-field-hint mt-2">Account details confirmed.</p>
            ) : null}
            {verifyError ? (
              <p className="payout-alert mt-2">{verifyError}</p>
            ) : null}
          </div>
        </>
      ) : null}

      {cadPayload.rail === 'interac_email' ? (
        <>
          <label className="payout-field sm:col-span-2">
            <span className="payout-field-label">Recipient email</span>
            <Input
              type="email"
              placeholder="recipient@example.com"
              value={cadPayload.interac.email}
              onChange={(event) =>
                setCadPayload((previous) => ({
                  ...previous,
                  interac: { ...previous.interac, email: event.target.value },
                }))
              }
              className="payout-field-input"
            />
          </label>
          <label className="payout-field sm:col-span-2">
            <span className="payout-field-label">Recipient name</span>
            <Input
              placeholder="Jane Doe"
              value={cadPayload.interac.name}
              onChange={(event) =>
                setCadPayload((previous) => ({
                  ...previous,
                  interac: { ...previous.interac, name: event.target.value },
                }))
              }
              className="payout-field-input"
            />
          </label>
          <label className="payout-field">
            <span className="payout-field-label">Security question</span>
            <Input
              placeholder="Invoice number?"
              value={cadPayload.interac.securityQuestion}
              onChange={(event) =>
                setCadPayload((previous) => ({
                  ...previous,
                  interac: {
                    ...previous.interac,
                    securityQuestion: event.target.value,
                  },
                }))
              }
              className="payout-field-input"
            />
          </label>
          <label className="payout-field">
            <span className="payout-field-label">Security answer</span>
            <Input
              placeholder="9001"
              autoComplete="off"
              value={cadPayload.interac.securityAnswer}
              onChange={(event) =>
                setCadPayload((previous) => ({
                  ...previous,
                  interac: {
                    ...previous.interac,
                    securityAnswer: event.target.value,
                  },
                }))
              }
              className="payout-field-input"
            />
          </label>
        </>
      ) : null}

      {cadPayload.rail === 'bill' ? (
        <>
          <label className="payout-field sm:col-span-2">
            <span className="payout-field-label">Search biller</span>
            <Input
              placeholder="Type at least 2 characters"
              value={billQuery}
              onChange={(event) => {
                const nextQuery = event.target.value
                setBillQuery(nextQuery)
                setCadPayload((previous) => ({
                  ...previous,
                  bill: { ...previous.bill, billerId: '', billerName: nextQuery },
                }))
              }}
              className="payout-field-input"
            />
          </label>
          <label className="payout-field sm:col-span-2">
            <span className="payout-field-label">Biller</span>
            <DropdownSelect
              ariaLabel="Select biller"
              options={billOptions}
              value={cadPayload.bill.billerId}
              disabled={billsQuery.isPending || billQuery.trim().length < 2}
              onChange={(billerId) => {
                const biller = (billsQuery.data ?? []).find(
                  (item) => item.billerId === billerId,
                )
                setCadPayload((previous) => ({
                  ...previous,
                  bill: {
                    ...previous.bill,
                    billerId,
                    billerName: biller?.name ?? previous.bill.billerName,
                  },
                }))
              }}
              searchable
              searchPlaceholder="Filter billers…"
              className="payout-field-select w-full max-w-md"
            />
            {billsQuery.isError ? (
              <span className="payout-field-hint">
                Unable to search billers. Try a different query.
              </span>
            ) : null}
            {billsQuery.isPending ? (
              <div className="mt-2">
                <LoadingSpinner label="Searching billers…" />
              </div>
            ) : null}
          </label>
          <label className="payout-field sm:col-span-2">
            <span className="payout-field-label">Biller account number</span>
            <Input
              placeholder="1234567890"
              autoComplete="off"
              value={cadPayload.bill.accountNumber}
              onChange={(event) =>
                setCadPayload((previous) => ({
                  ...previous,
                  bill: { ...previous.bill, accountNumber: event.target.value },
                }))
              }
              className="payout-field-input max-w-sm font-[ui-monospace,monospace]"
            />
          </label>
        </>
      ) : null}
    </div>
  )
}
