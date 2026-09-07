import { useState, type FormEvent } from 'react'
import { Button } from '../../../components/ui/Button.tsx'
import { Dialog } from '../../../components/ui/Dialog.tsx'
import { Input } from '../../../components/ui/Input.tsx'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner.tsx'
import { usePortalRole } from '../../../hooks/usePortalRole.ts'
import { usePortalEnvironmentStore } from '../../../store/portalEnvironmentStore.ts'
import {
  useNgnVirtualAccountQuery,
  useProvisionNgnVirtualAccountMutation,
} from '../hooks/useNgnVirtualAccountQueries.ts'
import {
  getNgnVirtualAccountStatus,
  isNgnBvnRequired,
  isNgnVirtualAccountReady,
  type NgnBvnFormPayload,
  type NgnVirtualAccount,
} from '../services/ngnVirtualAccountSchemas.ts'
import {
  NIGERIA_LIVE_ONLY_COPY,
  formatNgnAccountName,
} from '../utils/nigeriaMarket.ts'

const BVN_FORM_ID = 'ngn-bvn-form'

const emptyBvnForm: NgnBvnFormPayload = {
  bvn: '',
  firstName: '',
  lastName: '',
  phoneNumber: '',
  dateOfBirth: '',
  customerEmail: '',
}

type NgnVirtualAccountDialogProps = {
  isOpen: boolean
  onClose: () => void
}

function AccountDetailsPanel({ account }: { account: NgnVirtualAccount }) {
  const [copied, setCopied] = useState<'number' | 'all' | null>(null)

  const accountNumber = account.accountNumber?.trim() ?? ''
  const bankName = account.bankName?.trim() || '—'
  const accountName = formatNgnAccountName(account.accountName) || '—'
  const currency = account.currency?.trim().toUpperCase() || 'NGN'
  const shareText = `${accountName}\n${bankName}\n${accountNumber}`

  async function copy(value: string, key: 'number' | 'all') {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(key)
      window.setTimeout(() => setCopied(null), 1600)
    } catch {
      // Clipboard may be unavailable.
    }
  }

  return (
    <div className="ngn-va">
      <div className="ngn-va-status">
        <span className="dashboard-pill dashboard-pill-succ">
          <i aria-hidden />
          Active
        </span>
        <span className="dashboard-pill dashboard-pill-neutral">
          BVN {account.bvnStatus?.trim() || 'verified'}
        </span>
      </div>

      <section className="ngn-va-hero">
        <span className="ngn-va-eyebrow">Account number</span>
        <p className="ngn-va-number">{accountNumber || '—'}</p>
        <p className="ngn-va-bank">{bankName}</p>

        {accountNumber ? (
          <div className="ngn-va-hero-actions">
            <Button
              type="button"
              className={`dash-btn-primary ngn-va-copy${copied === 'number' ? ' ngn-va-copy--done' : ''}`}
              onClick={() => void copy(accountNumber, 'number')}
            >
              {copied === 'number' ? 'Copied' : 'Copy account number'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="dash-btn-outline ngn-va-copy"
              onClick={() => void copy(shareText, 'all')}
            >
              {copied === 'all' ? 'Copied' : 'Copy all details'}
            </Button>
          </div>
        ) : null}
      </section>

      <div className="ngn-va-grid">
        <div className="ngn-va-field">
          <span className="ngn-va-field-label">Account name</span>
          <p className="ngn-va-field-value">{accountName}</p>
        </div>
        <div className="ngn-va-field">
          <span className="ngn-va-field-label">Currency</span>
          <p className="ngn-va-field-value">{currency}</p>
        </div>
      </div>
    </div>
  )
}

export function NgnVirtualAccountDialog({
  isOpen,
  onClose,
}: NgnVirtualAccountDialogProps) {
  const { canWriteMoney } = usePortalRole()
  const portalEnvironment = usePortalEnvironmentStore((state) => state.environment)
  const isTestMode = portalEnvironment === 'test'

  const accountQuery = useNgnVirtualAccountQuery(isOpen && !isTestMode)
  const provisionMutation = useProvisionNgnVirtualAccountMutation()

  const [form, setForm] = useState<NgnBvnFormPayload>(emptyBvnForm)
  const [error, setError] = useState<string | null>(null)

  const account = accountQuery.data
  const isReady = account ? isNgnVirtualAccountReady(account) : false
  const status = account ? getNgnVirtualAccountStatus(account) : null
  // A failed BVN check keeps the form open so the merchant can correct and resubmit.
  const isProvisioning = status === 'pending' && !isNgnBvnRequired(account)
  const needsBvn = isNgnBvnRequired(account)
  const bvnFailed = account?.bvnStatus?.trim().toLowerCase() === 'failed'
  const showForm =
    !isTestMode &&
    !accountQuery.isPending &&
    !accountQuery.isError &&
    needsBvn &&
    !isProvisioning

  function updateField(field: keyof NgnBvnFormPayload, value: string) {
    setForm((previous) => ({ ...previous, [field]: value }))
  }

  function handleClose() {
    if (provisionMutation.isPending) {
      return
    }
    // Never leave BVN input behind when the dialog is dismissed.
    setForm(emptyBvnForm)
    setError(null)
    provisionMutation.reset()
    onClose()
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    if (!canWriteMoney) {
      setError('Your role cannot provision a virtual account.')
      return
    }
    if (isTestMode) {
      setError(NIGERIA_LIVE_ONLY_COPY)
      return
    }
    if (!/^\d{11}$/.test(form.bvn.trim())) {
      setError('Enter the 11-digit BVN.')
      return
    }
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError('First and last name must match the name on the BVN.')
      return
    }

    try {
      await provisionMutation.mutateAsync({
        bvn: form.bvn.trim(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phoneNumber: form.phoneNumber?.trim() || undefined,
        dateOfBirth: form.dateOfBirth?.trim() || undefined,
        customerEmail: form.customerEmail?.trim() || undefined,
      })
      setForm(emptyBvnForm)
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Unable to provision the virtual account.',
      )
      // Keep the name fields so a failed check can be corrected, but never
      // hold on to the BVN.
      setForm((previous) => ({ ...previous, bvn: '' }))
    } finally {
      // Drops the BVN from React Query's retained mutation variables. The
      // provisioned account itself lives in the virtual-account query.
      provisionMutation.reset()
    }
  }

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      title={isReady ? 'Your NGN bank details' : 'NGN virtual account'}
      description={
        isReady
          ? 'Verified and ready to receive transfers.'
          : 'Verify your BVN once to open a permanent NGN account for inbound transfers.'
      }
      maxWidthClassName="max-w-lg"
      // Plain body: the account hero is the card — avoid nesting it in another frame.
      bodyVariant="plain"
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            variant="ghost"
            className="px-4"
            disabled={provisionMutation.isPending}
            onClick={handleClose}
          >
            {isReady && !showForm ? 'Done' : 'Close'}
          </Button>
          {showForm ? (
            <Button
              type="submit"
              form={BVN_FORM_ID}
              className="px-4"
              disabled={provisionMutation.isPending || !canWriteMoney}
            >
              {provisionMutation.isPending
                ? 'Verifying…'
                : 'Verify and create account'}
            </Button>
          ) : null}
        </div>
      }
    >
      {isTestMode ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 [font-family:var(--font-body)] text-sm text-amber-900">
          {NIGERIA_LIVE_ONLY_COPY}
        </p>
      ) : accountQuery.isPending ? (
        <div className="flex min-h-[160px] items-center justify-center">
          <LoadingSpinner label="Loading virtual account…" />
        </div>
      ) : accountQuery.isError ? (
        <div className="space-y-3">
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 [font-family:var(--font-body)] text-sm text-rose-800">
            {accountQuery.error instanceof Error
              ? accountQuery.error.message
              : 'Unable to load your Nigeria virtual account.'}
          </p>
          <Button
            type="button"
            variant="ghost"
            className="dash-btn-outline"
            onClick={() => void accountQuery.refetch()}
          >
            Try again
          </Button>
        </div>
      ) : showForm ? (
        <form
          id={BVN_FORM_ID}
          className="space-y-3"
          onSubmit={(event) => void handleSubmit(event)}
        >
          {bvnFailed ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 [font-family:var(--font-body)] text-sm text-amber-900">
              The last BVN check did not pass. Confirm the number and that the
              names match your BVN record exactly, then submit again.
            </p>
          ) : null}

          <div>
            <label className="settings-hint" htmlFor="ngn-bvn">
              BVN (11 digits)
            </label>
            <Input
              id="ngn-bvn"
              value={form.bvn}
              onChange={(event) => updateField('bvn', event.target.value)}
              placeholder="22123456789"
              inputMode="numeric"
              maxLength={11}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              className="mt-1"
              disabled={provisionMutation.isPending || !canWriteMoney}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="settings-hint" htmlFor="ngn-first-name">
                First name
              </label>
              <Input
                id="ngn-first-name"
                value={form.firstName}
                onChange={(event) => updateField('firstName', event.target.value)}
                placeholder="Ada"
                autoComplete="off"
                className="mt-1"
                disabled={provisionMutation.isPending || !canWriteMoney}
              />
            </div>
            <div>
              <label className="settings-hint" htmlFor="ngn-last-name">
                Last name
              </label>
              <Input
                id="ngn-last-name"
                value={form.lastName}
                onChange={(event) => updateField('lastName', event.target.value)}
                placeholder="Okafor"
                autoComplete="off"
                className="mt-1"
                disabled={provisionMutation.isPending || !canWriteMoney}
              />
            </div>
          </div>

          <p className="settings-hint">
            Names must match your BVN record exactly.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="settings-hint" htmlFor="ngn-phone">
                Phone number (optional)
              </label>
              <Input
                id="ngn-phone"
                value={form.phoneNumber ?? ''}
                onChange={(event) => updateField('phoneNumber', event.target.value)}
                placeholder="+2348012345678"
                autoComplete="off"
                className="mt-1"
                disabled={provisionMutation.isPending || !canWriteMoney}
              />
            </div>
            <div>
              <label className="settings-hint" htmlFor="ngn-dob">
                Date of birth (optional)
              </label>
              <Input
                id="ngn-dob"
                type="date"
                value={form.dateOfBirth ?? ''}
                onChange={(event) => updateField('dateOfBirth', event.target.value)}
                className="mt-1"
                disabled={provisionMutation.isPending || !canWriteMoney}
              />
            </div>
          </div>

          <div>
            <label className="settings-hint" htmlFor="ngn-email">
              Email (optional)
            </label>
            <Input
              id="ngn-email"
              value={form.customerEmail ?? ''}
              onChange={(event) => updateField('customerEmail', event.target.value)}
              placeholder="ada@example.com"
              autoComplete="off"
              className="mt-1"
              disabled={provisionMutation.isPending || !canWriteMoney}
            />
          </div>

          {error ? (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 [font-family:var(--font-body)] text-sm text-rose-800">
              {error}
            </p>
          ) : null}

          {!canWriteMoney ? (
            <p className="[font-family:var(--font-body)] text-sm text-(--dash-fg-muted)">
              Your role cannot provision a virtual account.
            </p>
          ) : null}
        </form>
      ) : isProvisioning ? (
        <div className="flex min-h-[160px] flex-col items-center justify-center gap-3 text-center">
          <LoadingSpinner label="Provisioning…" />
          <p className="[font-family:var(--font-body)] text-sm text-(--dash-fg-muted)">
            Your BVN check and account creation are still processing. This
            refreshes automatically.
          </p>
        </div>
      ) : account ? (
        <AccountDetailsPanel account={account} />
      ) : null}
    </Dialog>
  )
}
