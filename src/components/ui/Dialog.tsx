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

  const bodyScrollClasses =
    bodyVariant === 'framed'
      ? joinClasses(
          'min-h-0 flex-1 overflow-y-auto bg-gradient-to-b from-[#FAF8F4] via-[#FFFCF9] to-[#F3E8D6]/[0.22] px-5 py-5',
          contentClassName,
        )
      : joinClasses('min-h-0 flex-1 overflow-y-auto px-5 py-4', contentClassName)

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
        style={{ backgroundColor: 'rgba(15, 7, 0, 0.34)' }}
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
          'dialog-surface relative z-120 flex max-h-[90vh] w-full flex-col rounded-2xl ring-1 ring-[#0F0700]/[0.06]',
          allowOverflow ? 'overflow-visible' : 'overflow-hidden',
          isVisible ? 'dialog-surface-open' : 'dialog-surface-closed',
          maxWidthClassName,
        )}
        style={{
          border: '1px solid #E0D4C4',
          backgroundColor: '#FFFFFF',
          boxShadow:
            '0 4px 6px rgba(15, 7, 0, 0.04), 0 24px 48px rgba(15, 7, 0, 0.14)',
        }}
      >
        {title || description || showCloseButton ? (
          <header
            className={joinClasses(
              'relative flex items-center justify-between gap-3 border-b border-[#E8E4DE] bg-gradient-to-r from-[#F9F6F1] via-[#FFFCF8] to-[#F3E8D6]/35 px-5 py-3',
              headerClassName,
            )}
          >
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-[#9D8F82]/45 to-transparent"
              aria-hidden
            />
            <div className="min-w-0 flex-1 pr-2">
              {title ? (
                <h2
                  className={joinClasses(
                    '[font-family:var(--font-display)] text-lg font-semibold leading-snug tracking-tight text-[#0F0700] sm:text-[1.125rem]',
                    titleClassName,
                  )}
                >
                  {title}
                </h2>
              ) : null}
              {description ? (
                <p className="mt-1 max-w-prose [font-family:var(--font-body)] text-sm leading-relaxed text-[#566167]">
                  {description}
                </p>
              ) : null}
            </div>
            {showCloseButton ? (
              <Button
                variant="ghost"
                data-dialog-close="true"
                className="inline-flex h-9! w-9! min-h-0! shrink-0 items-center justify-center rounded-lg! border border-[#E0D4C4] bg-white! p-0! px-0! text-[#566167] shadow-sm transition hover:border-[#9D8F82] hover:bg-[#F3E8D6] hover:text-[#0F0700]"
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
              <div className="overflow-hidden rounded-xl border border-[#E8E4DE] bg-[#FCFAF7] p-px shadow-[inset_0_1px_0_rgba(255,255,255,0.65),0_1px_2px_rgba(15,7,0,0.05)]">
                <div className="rounded-[11px] bg-white px-4 py-4 sm:px-5 sm:py-5">
                  {children}
                </div>
              </div>
            ) : (
              children
            )}
          </div>
        ) : null}

        {footer ? (
          <footer
            className={joinClasses(
              'border-t border-[#E8E4DE] bg-gradient-to-r from-[#F7F4EF] via-[#F3E8D6]/30 to-[#F7F4EF] px-5 py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]',
              footerClassName,
            )}
          >
            {footer}
          </footer>
        ) : null}
      </article>
    </div>,
    document.body,
  )
}
