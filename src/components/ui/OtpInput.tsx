import {
  useCallback,
  useEffect,
  useId,
  useRef,
  type ClipboardEvent,
  type CSSProperties,
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
  /** Hides the digits — used for the payout PIN. */
  mask?: boolean
  /** Larger boxes for standalone prompts. */
  size?: 'md' | 'lg'
  /** Marks every box as invalid (e.g. a rejected PIN). */
  hasError?: boolean
  /** Fires once when every box is filled — used to authorize without a second click. */
  onComplete?: (value: string) => void
  /** `stretch` grows the boxes to fill the row — used for the 4-digit payout PIN. */
  align?: 'center' | 'start' | 'stretch'
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
  mask = false,
  size = 'md',
  hasError = false,
  onComplete,
  align = 'center',
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

  const emitIfComplete = useCallback(
    (nextValue: string) => {
      onChange(nextValue)
      if (onComplete && nextValue.length === length) {
        onComplete(nextValue)
      }
    },
    [length, onChange, onComplete],
  )

  const handleChange = useCallback(
    (index: number, raw: string) => {
      const cleaned = digitsOnly(raw, length)

      if (cleaned.length === 0) {
        if (index < value.length) {
          emitIfComplete(value.slice(0, index) + value.slice(index + 1))
        }
        return
      }

      if (cleaned.length === 1) {
        const d = cleaned
        const i = Math.min(index, value.length)
        let next = value
        if (i < value.length) {
          next = value.slice(0, i) + d + value.slice(i + 1)
        } else if (i === value.length && value.length < length) {
          next = value + d
        }
        emitIfComplete(next)
        if (i < length - 1) {
          focusIndex(i + 1)
        }
        return
      }

      const next = cleaned.slice(0, length)
      emitIfComplete(next)
      focusIndex(Math.min(next.length, length) - 1)
    },
    [emitIfComplete, focusIndex, length, value],
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
      const next = pasted.slice(0, length)
      emitIfComplete(next)
      focusIndex(Math.min(next.length, length) - 1)
    },
    [emitIfComplete, focusIndex, length],
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
      <div
        className={joinClasses(
          'otp-row',
          align === 'stretch'
            ? 'otp-row--fill'
            : align === 'start'
              ? 'otp-row--start'
              : 'otp-row--center',
        )}
        style={{ ['--otp-length']: length } as CSSProperties}
      >
        {Array.from({ length }, (_, index) => {
          const digit = index < value.length ? value[index]! : ''
          const inputId = `${groupId}-${index}`

          return (
            <input
              key={index}
              ref={(el) => setInputRef(index, el)}
              id={inputId}
              type={mask ? 'password' : 'text'}
              inputMode="numeric"
              autoComplete={mask ? 'off' : index === 0 ? 'one-time-code' : 'off'}
              maxLength={1}
              disabled={disabled}
              value={digit}
              aria-label={`Digit ${index + 1} of ${length}`}
              className={joinClasses(
                'otp-cell',
                size === 'lg' ? 'otp-cell--lg' : 'otp-cell--md',
                hasError ? 'otp-cell--error' : undefined,
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
