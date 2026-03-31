import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Button } from './Button.tsx'

interface DialogProps {
  isOpen: boolean
  onClose: () => void
  children?: ReactNode
  title?: string
  description?: string
  footer?: ReactNode
  maxWidthClassName?: string
  contentClassName?: string
  allowOverflow?: boolean
  showCloseButton?: boolean
  closeOnBackdrop?: boolean
}

function joinClasses(...classNames: Array<string | undefined>) {
  return classNames.filter(Boolean).join(' ')
}

const DIALOG_ANIMATION_DURATION_MS = 240

export function Dialog({
  isOpen,
  onClose,
  children,
  title,
  description,
  footer,
  maxWidthClassName = 'max-w-3xl',
  contentClassName,
  allowOverflow = false,
  showCloseButton = true,
  closeOnBackdrop = true,
}: DialogProps) {
  const [isRendered, setIsRendered] = useState(isOpen)
  const [isVisible, setIsVisible] = useState(isOpen)

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true)
      window.requestAnimationFrame(() => {
        setIsVisible(true)
      })
      return
    }

    setIsVisible(false)
    const timeoutId = window.setTimeout(() => {
      setIsRendered(false)
    }, DIALOG_ANIMATION_DURATION_MS)

    return () => window.clearTimeout(timeoutId)
  }, [isOpen])

  useEffect(() => {
    if (!isRendered) {
      return
    }

    const previousBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', onEscape)
    return () => {
      window.removeEventListener('keydown', onEscape)
      document.body.style.overflow = previousBodyOverflow
    }
  }, [isRendered, onClose])

  if (!isRendered) {
    return null
  }

  return createPortal(
    <div
      className={joinClasses(
        'fixed inset-0 z-110 grid place-items-center p-4',
        isVisible ? 'dialog-root-open' : 'dialog-root-closed',
      )}
    >
      <button
        type="button"
        className={joinClasses(
          'dialog-backdrop absolute inset-0',
          isVisible ? 'dialog-backdrop-open' : 'dialog-backdrop-closed',
        )}
        style={{ backgroundColor: 'rgba(15, 7, 0, 0.32)' }}
        aria-label="Close dialog"
        onClick={() => {
          if (closeOnBackdrop) {
            onClose()
          }
        }}
      />
      <article
        role="dialog"
        aria-modal="true"
        className={joinClasses(
          'dialog-surface relative z-120 flex max-h-[90vh] w-full flex-col rounded-2xl',
          allowOverflow ? 'overflow-visible' : 'overflow-hidden',
          isVisible ? 'dialog-surface-open' : 'dialog-surface-closed',
          maxWidthClassName,
        )}
        style={{
          border: '1px solid #E6E7EA',
          backgroundColor: '#FFFFFF',
          boxShadow: '0 24px 60px rgba(15, 7, 0, 0.16)',
        }}
      >
        {title || description || showCloseButton ? (
          <header
            className="flex items-start justify-between gap-4 px-5 py-4"
            style={{ borderBottom: '1px solid #ECEDEF' }}
          >
            <div>
              {title ? (
                <h2
                  className="[font-family:var(--font-display)] text-[22px] leading-tight font-semibold"
                  style={{ color: '#101828' }}
                >
                  {title}
                </h2>
              ) : null}
              {description ? (
                <p
                  className="mt-1 [font-family:var(--font-body)] text-sm"
                  style={{ color: '#667085' }}
                >
                  {description}
                </p>
              ) : null}
            </div>
            {showCloseButton ? (
              <Button
                variant="ghost"
                data-dialog-close="true"
                className="h-8 rounded-md px-2 text-[#667085] hover:bg-[#F2F4F7] hover:text-[#344054]"
                onClick={onClose}
              >
                <span className="sr-only">Close</span>
                <svg
                  viewBox="0 0 20 20"
                  className="h-4 w-4 fill-current"
                  aria-hidden="true"
                >
                  <path d="M5.22 5.22a.75.75 0 0 1 1.06 0L10 8.94l3.72-3.72a.75.75 0 1 1 1.06 1.06L11.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06L10 11.06l-3.72 3.72a.75.75 0 1 1-1.06-1.06L8.94 10 5.22 6.28a.75.75 0 0 1 0-1.06Z" />
                </svg>
              </Button>
            ) : null}
          </header>
        ) : null}

        {children != null ? (
          <div
            className={joinClasses(
              'min-h-0 flex-1 overflow-y-auto px-5 py-4',
              contentClassName,
            )}
          >
            {children}
          </div>
        ) : null}

        {footer ? (
          <footer className="px-5 pb-3 pt-4" style={{ borderTop: '1px solid #ECEDEF' }}>
            {footer}
          </footer>
        ) : null}
      </article>
    </div>,
    document.body,
  )
}
