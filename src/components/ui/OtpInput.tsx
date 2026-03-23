import {
  useCallback,
  useEffect,
  useId,
  useRef,
  type ClipboardEvent,
  type KeyboardEvent,
} from 'react'

function joinClasses(...classNames: Array<string | undefined>) {
  return classNames.filter(Boolean).join(' ')
}

function digitsOnly(raw: string, maxLen: number) {
  return raw.replace(/\D/g, '').slice(0, maxLen)
}

export interface OtpInputProps {
  length?: number
  value: string
  onChange: (nextValue: string) => void
  disabled?: boolean
  /** Optional hidden input for native form posts (e.g. `name="code"`). */
  name?: string
  id?: string
  'aria-label'?: string
  'aria-describedby'?: string
  autoFocus?: boolean
  className?: string
}

export function OtpInput({
  length = 6,
  value,
  onChange,
  disabled = false,
  name,
  id: idProp,
  'aria-label': ariaLabel = 'One-time code',
  'aria-describedby': ariaDescribedBy,
  autoFocus = false,
  className,
}: OtpInputProps) {
  const reactId = useId()
  const groupId = idProp ?? `otp-${reactId}`
  const inputsRef = useRef<Array<HTMLInputElement | null>>([])

  const setInputRef = useCallback((index: number, el: HTMLInputElement | null) => {
    inputsRef.current[index] = el
  }, [])

  const focusIndex = useCallback((index: number) => {
    const el = inputsRef.current[index]
    if (el) {
      el.focus()
      el.select()
    }
  }, [])

  useEffect(() => {
    if (autoFocus && !disabled) {
      focusIndex(0)
    }
  }, [autoFocus, disabled, focusIndex])

  const handleChange = useCallback(
    (index: number, raw: string) => {
      const cleaned = digitsOnly(raw, length)

      if (cleaned.length === 0) {
        if (index < value.length) {
          onChange(value.slice(0, index) + value.slice(index + 1))
        }
        return
      }

      if (cleaned.length === 1) {
        const d = cleaned
        const i = Math.min(index, value.length)
        if (i < value.length) {
          onChange(value.slice(0, i) + d + value.slice(i + 1))
        } else if (i === value.length && value.length < length) {
          onChange(value + d)
        }
        if (i < length - 1) {
          focusIndex(i + 1)
        }
        return
      }

      onChange(cleaned.slice(0, length))
      focusIndex(Math.min(cleaned.length, length) - 1)
    },
    [focusIndex, length, onChange, value],
  )

  const handleKeyDown = useCallback(
    (index: number, event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Backspace') {
        if (index < value.length && value[index]) {
          event.preventDefault()
          onChange(value.slice(0, index) + value.slice(index + 1))
          return
        }
        if (index > 0) {
          event.preventDefault()
          onChange(value.slice(0, index - 1) + value.slice(index))
          focusIndex(index - 1)
        }
        return
      }
      if (event.key === 'ArrowLeft' && index > 0) {
        event.preventDefault()
        focusIndex(index - 1)
        return
      }
      if (event.key === 'ArrowRight' && index < length - 1) {
        event.preventDefault()
        focusIndex(index + 1)
      }
    },
    [focusIndex, length, onChange, value],
  )

  const handlePaste = useCallback(
    (event: ClipboardEvent) => {
      event.preventDefault()
      const pasted = digitsOnly(event.clipboardData.getData('text') ?? '', length)
      if (!pasted) {
        return
      }
      onChange(pasted.slice(0, length))
      focusIndex(Math.min(pasted.length, length) - 1)
    },
    [focusIndex, length, onChange],
  )

  return (
    <div
      className={joinClasses('w-full', className)}
      role="group"
      aria-label={ariaLabel}
      {...(ariaDescribedBy ? { 'aria-describedby': ariaDescribedBy } : {})}
      onPaste={handlePaste}
    >
      {name ? (
        <input type="hidden" name={name} value={digitsOnly(value, length)} readOnly />
      ) : null}
      <div className="flex justify-center gap-2 sm:gap-2.5">
        {Array.from({ length }, (_, index) => {
          const digit = index < value.length ? value[index]! : ''
          const inputId = `${groupId}-${index}`

          return (
            <input
              key={index}
              ref={(el) => setInputRef(index, el)}
              id={inputId}
              type="text"
              inputMode="numeric"
              autoComplete={index === 0 ? 'one-time-code' : 'off'}
              maxLength={1}
              disabled={disabled}
              value={digit}
              aria-label={`Digit ${index + 1} of ${length}`}
              className={joinClasses(
                'h-12 w-10 rounded-xl border bg-(--color-card) text-center [font-family:var(--font-body)] text-lg font-semibold tabular-nums text-(--color-foreground) outline-none transition sm:h-14 sm:w-11',
                'border-(--color-accent)/40 shadow-sm',
                'focus:border-(--color-primary) focus:ring-2 focus:ring-(--color-primary)/20',
                'disabled:cursor-not-allowed disabled:opacity-60',
              )}
              onChange={(event) => handleChange(index, event.target.value)}
              onKeyDown={(event) => handleKeyDown(index, event)}
              onFocus={(event) => event.target.select()}
            />
          )
        })}
      </div>
    </div>
  )
}
