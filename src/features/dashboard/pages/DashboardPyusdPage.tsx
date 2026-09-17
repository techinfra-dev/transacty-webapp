import { useMemo, useState, type FormEvent } from 'react'
import { Link } from '@tanstack/react-router'
import { QRCodeSVG } from 'qrcode.react'
import { Button } from '../../../components/ui/Button.tsx'
import { Input } from '../../../components/ui/Input.tsx'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner.tsx'
import { usePortalRole } from '../../../hooks/usePortalRole.ts'
import { usePortalEnvironmentStore } from '../../../store/portalEnvironmentStore.ts'
import { useTransactionDetailModalStore } from '../../../store/transactionDetailModalStore.ts'
import {
  useCreatePyusdPaymentIntentMutation,
  usePyusdPaymentIntentQuery,
} from '../hooks/usePyusdPaymentIntentMutations.ts'
import {
  getPyusdPaymentIntentId,
  type PyusdPaymentIntent,
} from '../services/pyusdPaymentIntentSchemas.ts'

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1400)
    } catch {
      // Clipboard may be unavailable.
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      className="dash-btn-outline shrink-0 px-3"
      onClick={() => void handleCopy()}
    >
      {copied ? 'Copied' : label}
    </Button>
  )
}

function DepositPanel({ intent }: { intent: PyusdPaymentIntent }) {
  const openTransactionDetail = useTransactionDetailModalStore(
    (state) => state.openTransactionDetail,
  )
  const depositAddress = intent.depositAddress?.trim() ?? ''
  const amount = intent.amount?.trim() ?? '—'
  const currency = intent.currency?.trim().toUpperCase() || 'PYUSD'
  const settlementLabel =
    intent.settlementCurrencyLabel?.trim() ||
    intent.settlementCurrency?.trim().toUpperCase() ||
    'PYUSD USDC'
  const network = intent.network?.trim() || 'ethereum'
  const status = intent.status?.trim() || 'pending'
  const intentId = getPyusdPaymentIntentId(intent)
  const qrValue = depositAddress || null
  const expiresLabel = useMemo(() => {
    if (!intent.expiresAt) {
      return null
    }
    const date = new Date(intent.expiresAt)
    if (Number.isNaN(date.getTime())) {
      return intent.expiresAt
    }
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }, [intent.expiresAt])

  return (
    <section className="dashboard-card flex flex-col gap-4 p-5">
      <div>
        <p className="dashboard-caption uppercase tracking-wide">Deposit</p>
        <h2 className="dash-page-title text-xl">
          Send {amount} {currency}
        </h2>
        <p className="dash-page-subtitle mt-1">
          Settles to {settlementLabel} on {network}. Status refreshes automatically.
        </p>
      </div>

      <div className="flex flex-wrap items-start gap-4">
        {qrValue ? (
          <div
            role="img"
            aria-label="PYUSD deposit address QR code"
            className="rounded-lg border border-(--dash-border) bg-white p-2"
          >
            <QRCodeSVG value={qrValue} size={168} level="M" />
          </div>
        ) : null}
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="settings-hint">Deposit address</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <code className="min-w-0 break-all rounded-lg border border-(--dash-border) bg-(--dash-surface-2) px-3 py-2 [font-family:ui-monospace,monospace] text-xs">
                {depositAddress || '—'}
              </code>
              {depositAddress ? (
                <CopyButton value={depositAddress} label="Copy address" />
              ) : null}
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <p className="settings-hint">Status</p>
              <p className="[font-family:var(--font-body)] text-sm capitalize text-(--dash-fg)">
                {status}
              </p>
            </div>
            <div>
              <p className="settings-hint">Expires</p>
              <p className="[font-family:var(--font-body)] text-sm text-(--dash-fg)">
                {expiresLabel ?? '—'}
              </p>
            </div>
            <div>
              <p className="settings-hint">Settlement</p>
              <p className="[font-family:var(--font-body)] text-sm text-(--dash-fg)">
                {settlementLabel}
              </p>
            </div>
            <div>
              <p className="settings-hint">Reference</p>
              <p className="[font-family:var(--font-body)] text-sm text-(--dash-fg)">
                {intent.merchantReference?.trim() || '—'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {intentId ? (
          <Button
            type="button"
            className="dash-btn-primary"
            onClick={() => openTransactionDetail(intentId)}
          >
            View transaction
          </Button>
        ) : null}
      </div>
    </section>
  )
}

export function DashboardPyusdPage() {
  const { canWriteMoney } = usePortalRole()
  const portalEnvironment = usePortalEnvironmentStore((state) => state.environment)
  const createMutation = useCreatePyusdPaymentIntentMutation()

  const [amount, setAmount] = useState('')
  const [merchantReference, setMerchantReference] = useState('')
  const [expiresInMinutes, setExpiresInMinutes] = useState('30')
  const [orderId, setOrderId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [activeIntentId, setActiveIntentId] = useState<string | null>(null)

  const intentQuery = usePyusdPaymentIntentQuery(activeIntentId, Boolean(activeIntentId))
  const createdIntent = createMutation.data
  const polledIntent = intentQuery.data
  const activeIntent = polledIntent ?? createdIntent
  const isTestMode = portalEnvironment === 'test'

  async function handleCreate(event: FormEvent) {
    event.preventDefault()
    setError(null)

    if (!canWriteMoney) {
      setError('Your role cannot create money movements.')
      return
    }
    if (isTestMode) {
      setError(
        'PYUSD checkout is live-only. Switch the portal environment to Live, then try again.',
      )
      return
    }

    const trimmedAmount = amount.trim()
    if (!trimmedAmount || Number(trimmedAmount) <= 0) {
      setError('Enter a valid PYUSD amount.')
      return
    }

    const expires = Number(expiresInMinutes)
    try {
      const created = await createMutation.mutateAsync({
        amount: trimmedAmount,
        merchantReference: merchantReference.trim() || undefined,
        expiresInMinutes:
          Number.isFinite(expires) && expires > 0 ? Math.round(expires) : undefined,
        metadata: orderId.trim()
          ? { orderId: orderId.trim() }
          : undefined,
      })
      const id = getPyusdPaymentIntentId(created)
      setActiveIntentId(id || null)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to create PYUSD payment intent.',
      )
    }
  }

  function handleCreateAnother() {
    setAmount('')
    setMerchantReference('')
    setExpiresInMinutes('30')
    setOrderId('')
    setError(null)
    setActiveIntentId(null)
    createMutation.reset()
  }

  return (
    <section className="app-page-enter flex flex-col gap-4">
      <header className="mb-1 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="dash-page-title">PYUSD checkout</h1>
          <p className="dash-page-subtitle">
            PYUSD collects → PYUSD USDC settles. EUR payouts use Europe USDC only.
            Live-only (Tekko has no sandbox).
          </p>
        </div>
        <Link
          to="/dashboard/settings"
          search={{ tab: 'markets' }}
          className="dash-btn-outline inline-flex items-center rounded-lg px-3 [font-family:var(--font-body)] text-xs"
        >
          Markets settings
        </Link>
      </header>

      {isTestMode ? (
        <aside className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 [font-family:var(--font-body)] text-sm text-amber-900">
          Portal is in Test mode. PYUSD payment intents only work in Live —
          switch environment before creating a deposit.
        </aside>
      ) : null}

      {activeIntent ? (
        <>
          {intentQuery.isFetching && !intentQuery.isPending ? (
            <div className="flex items-center gap-2 text-sm text-(--dash-fg-muted)">
              <LoadingSpinner label="Refreshing status…" />
            </div>
          ) : null}
          <DepositPanel intent={activeIntent} />
          <Button
            type="button"
            variant="ghost"
            className="dash-btn-outline self-start"
            onClick={handleCreateAnother}
          >
            Create another intent
          </Button>
        </>
      ) : (
        <form
          className="dashboard-card flex max-w-xl flex-col gap-4 p-5"
          onSubmit={(event) => void handleCreate(event)}
        >
          <div>
            <label className="settings-hint" htmlFor="pyusd-amount">
              Amount (PYUSD)
            </label>
            <Input
              id="pyusd-amount"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="25.00"
              inputMode="decimal"
              className="mt-1"
              disabled={createMutation.isPending || !canWriteMoney}
            />
          </div>
          <div>
            <label className="settings-hint" htmlFor="pyusd-ref">
              Merchant reference
            </label>
            <Input
              id="pyusd-ref"
              value={merchantReference}
              onChange={(event) => setMerchantReference(event.target.value)}
              placeholder="order-4821"
              className="mt-1"
              disabled={createMutation.isPending || !canWriteMoney}
            />
          </div>
          <div>
            <label className="settings-hint" htmlFor="pyusd-order">
              Metadata order ID (optional)
            </label>
            <Input
              id="pyusd-order"
              value={orderId}
              onChange={(event) => setOrderId(event.target.value)}
              placeholder="4821"
              className="mt-1"
              disabled={createMutation.isPending || !canWriteMoney}
            />
          </div>
          <div>
            <label className="settings-hint" htmlFor="pyusd-expires">
              Expires in minutes
            </label>
            <Input
              id="pyusd-expires"
              value={expiresInMinutes}
              onChange={(event) => setExpiresInMinutes(event.target.value)}
              placeholder="30"
              inputMode="numeric"
              className="mt-1"
              disabled={createMutation.isPending || !canWriteMoney}
            />
          </div>

          {error ? (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 [font-family:var(--font-body)] text-sm text-rose-800">
              {error}
            </p>
          ) : null}

          {!canWriteMoney ? (
            <p className="[font-family:var(--font-body)] text-sm text-(--dash-fg-muted)">
              Your role cannot create payment intents.
            </p>
          ) : null}

          <Button
            type="submit"
            className="dash-btn-primary self-start"
            disabled={createMutation.isPending || !canWriteMoney || isTestMode}
          >
            {createMutation.isPending ? 'Creating…' : 'Create payment intent'}
          </Button>
        </form>
      )}
    </section>
  )
}
