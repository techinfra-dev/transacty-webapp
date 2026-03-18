import { useEffect } from 'react'
import { createPortal } from 'react-dom'

type ToastVariant = 'error' | 'success' | 'info'

interface ToastProps {
  message: string
  onClose: () => void
  variant?: ToastVariant
  durationMs?: number
}

function variantClassName(variant: ToastVariant) {
  if (variant === 'success') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-800'
  }
  if (variant === 'info') {
    return 'border-sky-200 bg-sky-50 text-sky-800'
  }
  return 'border-rose-200 bg-rose-50 text-rose-800'
}

export function Toast({
  message,
  onClose,
  variant = 'error',
  durationMs = 3500,
}: ToastProps) {
  useEffect(() => {
    const timeout = window.setTimeout(onClose, durationMs)
    return () => window.clearTimeout(timeout)
  }, [onClose, durationMs])

  const toastNode = (
    <div className="pointer-events-none fixed right-4 top-4 z-120 w-[min(92vw,360px)]">
      <div
        className={`toast-enter pointer-events-auto rounded-xl border p-3.5 [font-family:var(--font-body)] text-sm ${variantClassName(
          variant,
        )}`}
        role="alert"
        aria-live="assertive"
      >
        <div className="flex items-start justify-between gap-3">
          <p>{message}</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close notification"
            className="inline-flex h-5 w-5 cursor-pointer items-center justify-center rounded-md opacity-80 transition hover:opacity-100"
          >
            <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 fill-current" aria-hidden="true">
              <path d="M5.22 5.22a.75.75 0 0 1 1.06 0L10 8.94l3.72-3.72a.75.75 0 1 1 1.06 1.06L11.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06L10 11.06l-3.72 3.72a.75.75 0 1 1-1.06-1.06L8.94 10 5.22 6.28a.75.75 0 0 1 0-1.06Z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(toastNode, document.body)
}
