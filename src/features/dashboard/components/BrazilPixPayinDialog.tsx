import { useMemo, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import DOMPurify from 'dompurify'
import { getSafeHttpsUrl } from '../../../utils/safeUrl.ts'
import { Button } from '../../../components/ui/Button.tsx'
import { Dialog } from '../../../components/ui/Dialog.tsx'
import { Input } from '../../../components/ui/Input.tsx'
import { useCreateBrPixPayinMutation } from '../hooks/useBrPayinMutations.ts'
import type { BrPixPayinResponse } from '../services/brPayinSchemas.ts'
import { useTransactionDetailModalStore } from '../../../store/transactionDetailModalStore.ts'

const PIX_MIN = 10
const PIX_MAX = 15_000

type BrazilPixPayinDialogProps = {
  isOpen: boolean
  onClose: () => void
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <Button
      type="button"
      variant="ghost"
      className="dash-btn-outline shrink-0 px-3"
      onClick={() => {
        void navigator.clipboard.writeText(value).then(() => {
          setCopied(true)
          window.setTimeout(() => setCopied(false), 1400)
        })
      }}
    >
      {copied ? 'Copied' : 'Copy'}
    </Button>
  )
}

function PaymentInfoPanel({ created }: { created: BrPixPayinResponse }) {
  const openTransactionDetail = useTransactionDetailModalStore(
    (state) => state.openTransactionDetail,
  )
  const info = created.paymentInfo
  const content = info?.content?.trim() ?? ''
  const type = (info?.type ?? 'code').toString().toLowerCase()
  const transactionId = created.transactionId ?? created.id
  const qrValue =
    content && (type === 'code' || type === 'json') ? content : null

  // `content` is API-supplied. Enforce https on links so a `javascript:` URL
  // cannot execute, and sanitize HTML before it reaches innerHTML.
  const safeCheckoutUrl = type === 'url' ? getSafeHttpsUrl(content) : null
  const sanitizedHtml = useMemo(
    () =>
      type === 'html' && content
        ? DOMPurify.sanitize(content, { USE_PROFILES: { html: true } })
        : '',
    [type, content],
  )

  const expiresLabel = useMemo(() => {
    if (!created.expiresAt) return null
    const date = new Date(created.expiresAt)
    if (Number.isNaN(date.getTime())) return created.expiresAt
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }, [created.expiresAt])

  return (
    <div className="space-y-4">
      <p className="[font-family:var(--font-body)] text-sm text-(--dash-fg-muted)">
        Status is <span className="capitalize text-(--dash-fg)">{created.status || 'pending'}</span>
        . Money credits after the customer pays — do not treat this as settled yet.
      </p>

      {qrValue ? (
        <div
          role="img"
          aria-label="PIX payment QR code"
          className="rounded-lg border border-(--dash-border) bg-white p-2"
        >
          <QRCodeSVG value={qrValue} size={168} level="M" />
        </div>
      ) : null}

      {type === 'url' && safeCheckoutUrl ? (
        <a
          href={safeCheckoutUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="dashboard-caption-link break-all text-sm"
        >
          Open PIX checkout
        </a>
      ) : null}

      {type === 'html' && sanitizedHtml ? (
        <div
          className="overflow-auto rounded-lg border border-(--dash-border) bg-(--dash-surface-2) p-3 text-sm"
          dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
        />
      ) : null}

      {(type === 'code' || type === 'json' || (!type && content)) && content ? (
        <div>
          <p className="settings-hint">PIX code</p>
          <div className="mt-1 flex flex-wrap items-start gap-2">
            <code className="min-w-0 flex-1 break-all rounded-lg border border-(--dash-border) bg-(--dash-surface-2) px-3 py-2 [font-family:ui-monospace,monospace] text-xs">
              {content}
            </code>
            <CopyButton value={content} />
          </div>
        </div>
      ) : null}

      {!content ? (
        <p className="[font-family:var(--font-body)] text-sm text-(--dash-fg-muted)">
          No payment instructions were returned. Check the transaction detail shortly.
        </p>
      ) : null}

      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <p className="settings-hint">Amount</p>
          <p className="text-sm text-(--dash-fg)">
            {created.amount ?? '—'} {created.currency?.toUpperCase() || 'BRL'}
          </p>
        </div>
        <div>
          <p className="settings-hint">Expires</p>
          <p className="text-sm text-(--dash-fg)">{expiresLabel ?? '—'}</p>
        </div>
      </div>

      {transactionId ? (
        <Button
          type="button"
          className="dash-btn-primary"
          onClick={() => openTransactionDetail(transactionId)}
        >
          View transaction
        </Button>
      ) : null}
    </div>
  )
}

export function BrazilPixPayinDialog({
  isOpen,
  onClose,
}: BrazilPixPayinDialogProps) {
  const createMutation = useCreateBrPixPayinMutation()
  const [amount, setAmount] = useState('')
  const [returnUrl, setReturnUrl] = useState('https://')
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [deviceId, setDeviceId] = useState('')
  const [goodsName, setGoodsName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [created, setCreated] = useState<BrPixPayinResponse | null>(null)

  function resetForm() {
    setAmount('')
    setReturnUrl('https://')
    setCustomerName('')
    setCustomerEmail('')
    setCustomerPhone('')
    setDeviceId('')
    setGoodsName('')
    setError(null)
    setCreated(null)
    createMutation.reset()
  }

  function handleClose() {
    if (createMutation.isPending) return
    resetForm()
    onClose()
  }

  async function handleCreate() {
    setError(null)
    const parsedAmount = Number(amount.trim().replace(/,/g, ''))
    if (!Number.isFinite(parsedAmount) || parsedAmount < PIX_MIN || parsedAmount > PIX_MAX) {
      setError(`Amount must be between R$ ${PIX_MIN.toFixed(2)} and R$ ${PIX_MAX.toLocaleString('en-US')}.`)
      return
    }

    try {
      const response = await createMutation.mutateAsync({
        amount: parsedAmount.toFixed(2),
        returnUrl: returnUrl.trim(),
        customer: {
          name: customerName.trim(),
          email: customerEmail.trim(),
          phone: customerPhone.trim(),
          deviceId: deviceId.trim(),
        },
        goodsInfo: {
          name: goodsName.trim(),
        },
      })
      setCreated(response)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to create PIX pay-in.',
      )
    }
  }

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      title={created ? 'PIX pay-in created' : 'Brazil PIX pay-in'}
      description={
        created
          ? 'Show the PIX code or QR to the customer. Settlement credits the BRL wallet after payment.'
          : 'Create a one-time PIX charge. Limits: R$ 10.00 – R$ 15,000.00.'
      }
      maxWidthClassName="max-w-lg"
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="ghost" className="px-4" onClick={handleClose}>
            {created ? 'Done' : 'Cancel'}
          </Button>
          {!created ? (
            <Button
              className="px-4"
              onClick={() => void handleCreate()}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Creating…' : 'Create PIX pay-in'}
            </Button>
          ) : (
            <Button
              className="px-4"
              onClick={() => {
                setCreated(null)
                createMutation.reset()
              }}
            >
              Create another
            </Button>
          )}
        </div>
      }
    >
      {created ? (
        <PaymentInfoPanel created={created} />
      ) : (
        <div className="space-y-3">
          <div>
            <label className="settings-hint" htmlFor="br-pix-amount">
              Amount (BRL)
            </label>
            <Input
              id="br-pix-amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="100.00"
              inputMode="decimal"
              className="mt-1"
              disabled={createMutation.isPending}
            />
          </div>
          <div>
            <label className="settings-hint" htmlFor="br-pix-goods">
              Goods / order name
            </label>
            <Input
              id="br-pix-goods"
              value={goodsName}
              onChange={(e) => setGoodsName(e.target.value)}
              placeholder="Order #4821"
              className="mt-1"
              disabled={createMutation.isPending}
            />
          </div>
          <div>
            <label className="settings-hint" htmlFor="br-pix-return">
              Return URL
            </label>
            <Input
              id="br-pix-return"
              value={returnUrl}
              onChange={(e) => setReturnUrl(e.target.value)}
              placeholder="https://yourapp.com/checkout/return"
              className="mt-1"
              disabled={createMutation.isPending}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="settings-hint" htmlFor="br-pix-name">
                Customer name
              </label>
              <Input
                id="br-pix-name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="mt-1"
                disabled={createMutation.isPending}
              />
            </div>
            <div>
              <label className="settings-hint" htmlFor="br-pix-email">
                Customer email
              </label>
              <Input
                id="br-pix-email"
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="mt-1"
                disabled={createMutation.isPending}
              />
            </div>
            <div>
              <label className="settings-hint" htmlFor="br-pix-phone">
                Customer phone
              </label>
              <Input
                id="br-pix-phone"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="+5511999999999"
                className="mt-1"
                disabled={createMutation.isPending}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="settings-hint" htmlFor="br-pix-device">
                Device ID
              </label>
              <Input
                id="br-pix-device"
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                placeholder="dev-123"
                className="mt-1"
                disabled={createMutation.isPending}
              />
            </div>
          </div>
          {error ? (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 [font-family:var(--font-body)] text-sm text-rose-800">
              {error}
            </p>
          ) : null}
        </div>
      )}
    </Dialog>
  )
}
