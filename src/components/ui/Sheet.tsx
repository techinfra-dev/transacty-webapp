import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface SheetProps {
  isOpen: boolean
  onClose: () => void
  children?: ReactNode
  /** Width of the panel, e.g. max-w-xl / max-w-2xl */
  widthClassName?: string
  closeOnBackdrop?: boolean
  /** Accessible name when no visible title is provided inside children. */
  ariaLabel?: string
}

function joinClasses(...classNames: Array<string | undefined | false>) {
  return classNames.filter(Boolean).join(' ')
}

export const SHEET_EXIT_ANIMATION_MS = 320

/**
 * Right-side slide-over sheet (portal). Click backdrop or Escape to close.
 */
export function Sheet({
  isOpen,
  onClose,
  children,
  widthClassName = 'max-w-xl',
  closeOnBackdrop = true,
  ariaLabel = 'Panel',
}: SheetProps) {
  const [isRendered, setIsRendered] = useState(isOpen)
  const [isVisible, setIsVisible] = useState(isOpen)

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true)
      // Double rAF so the closed transform paints before we open — avoids a
      // skipped transition at 100% zoom / fractional device pixels.
      let innerFrame = 0
      const outerFrame = window.requestAnimationFrame(() => {
        innerFrame = window.requestAnimationFrame(() => {
          setIsVisible(true)
        })
      })
      return () => {
        window.cancelAnimationFrame(outerFrame)
        window.cancelAnimationFrame(innerFrame)
      }
    }

    setIsVisible(false)
    const timeoutId = window.setTimeout(() => {
      setIsRendered(false)
    }, SHEET_EXIT_ANIMATION_MS)

    return () => window.clearTimeout(timeoutId)
  }, [isOpen])

  useEffect(() => {
    if (!isRendered) {
      return
    }

    const previousBodyOverflow = document.body.style.overflow
    const previousBodyPaddingRight = document.body.style.paddingRight
    const scrollbarGap =
      window.innerWidth - document.documentElement.clientWidth

    document.body.style.overflow = 'hidden'
    if (scrollbarGap > 0) {
      document.body.style.paddingRight = `${scrollbarGap}px`
    }

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', onEscape)
    return () => {
      window.removeEventListener('keydown', onEscape)
      document.body.style.overflow = previousBodyOverflow
      document.body.style.paddingRight = previousBodyPaddingRight
    }
  }, [isRendered, onClose])

  if (!isRendered) {
    return null
  }

  return createPortal(
    <div
      className={joinClasses(
        'sheet-root',
        isVisible ? 'sheet-root--open' : 'sheet-root--closed',
      )}
    >
      <button
        type="button"
        className={joinClasses(
          'sheet-backdrop',
          isVisible ? 'sheet-backdrop--open' : 'sheet-backdrop--closed',
        )}
        aria-label="Close panel"
        onClick={() => {
          if (closeOnBackdrop) {
            onClose()
          }
        }}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        className={joinClasses(
          'sheet-panel',
          widthClassName,
          isVisible ? 'sheet-panel--open' : 'sheet-panel--closed',
        )}
      >
        {children}
      </aside>
    </div>,
    document.body,
  )
}
