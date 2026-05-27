import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Button } from './Button.tsx'

export type DialogBodyVariant = 'plain' | 'framed'

interface DialogProps {
  isOpen: boolean
  onClose: () => void
  children?: ReactNode
  title?: string
  description?: string
  footer?: ReactNode
  maxWidthClassName?: string
  contentClassName?: string
  /** Default `framed`: warm gradient body + inset card. Use `plain` for custom layouts (e.g. transaction detail). */
  bodyVariant?: DialogBodyVariant
  headerClassName?: string
  titleClassName?: string
  footerClassName?: string
  allowOverflow?: boolean
  showCloseButton?: boolean
  closeOnBackdrop?: boolean
}

function joinClasses(...classNames: Array<string | undefined>) {
  return classNames.filter(Boolean).join(' ')
}

/** Exit opacity/transform duration — keep snapshot UIs in sync when unmounting after close. */
export const DIALOG_EXIT_ANIMATION_MS = 240

export function Dialog({
  isOpen,
  onClose,
  children,
  title,
  description,
  footer,
  maxWidthClassName = 'max-w-3xl',
  contentClassName,
  bodyVariant = 'framed',
  headerClassName,
  titleClassName,
  footerClassName,
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
    }, DIALOG_EXIT_ANIMATION_MS)

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

  const bodyScrollClasses = joinClasses(
    'dialog-surface-body',
    bodyVariant === 'framed' ? 'dialog-surface-body--framed' : undefined,
    contentClassName,
  )

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
          'dialog-surface relative z-120 flex max-h-[90vh] w-full flex-col rounded-2xl ring-1',
          allowOverflow ? 'dialog-surface--allow-overflow overflow-visible' : 'overflow-hidden',
          isVisible ? 'dialog-surface-open' : 'dialog-surface-closed',
          maxWidthClassName,
        )}
      >
        {title || description || showCloseButton ? (
          <header className={joinClasses('dialog-surface-header', headerClassName)}>
            <div className="dialog-surface-header-accent" aria-hidden />
            <div className="min-w-0 flex-1 pr-2">
              {title ? (
                <h2 className={joinClasses('dialog-surface-title', titleClassName)}>
                  {title}
                </h2>
              ) : null}
              {description ? (
                <p className="dialog-surface-description">{description}</p>
              ) : null}
            </div>
            {showCloseButton ? (
              <Button
                variant="ghost"
                data-dialog-close="true"
                className="dialog-surface-close"
                onClick={onClose}
              >
                <span className="sr-only">Close</span>
                <svg
                  viewBox="0 0 20 20"
                  className="block h-4 w-4 shrink-0 fill-current"
                  aria-hidden="true"
                >
                  <path d="M5.22 5.22a.75.75 0 0 1 1.06 0L10 8.94l3.72-3.72a.75.75 0 1 1 1.06 1.06L11.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06L10 11.06l-3.72 3.72a.75.75 0 1 1-1.06-1.06L8.94 10 5.22 6.28a.75.75 0 0 1 0-1.06Z" />
                </svg>
              </Button>
            ) : null}
          </header>
        ) : null}

        {children != null ? (
          <div className={bodyScrollClasses}>
            {bodyVariant === 'framed' ? (
              <div className="dialog-surface-frame">
                <div className="dialog-surface-frame-inner">{children}</div>
              </div>
            ) : (
              children
            )}
          </div>
        ) : null}

        {footer ? (
          <footer className={joinClasses('dialog-surface-footer', footerClassName)}>
            {footer}
          </footer>
        ) : null}
      </article>
    </div>,
    document.body,
  )
}
