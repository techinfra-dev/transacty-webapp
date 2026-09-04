import { useRef, useState, type ComponentProps } from 'react'
import { Link } from '@tanstack/react-router'
import { Button } from '../../../components/ui/Button.tsx'
import { Input } from '../../../components/ui/Input.tsx'
import { Toast } from '../../../components/ui/Toast.tsx'
import { useForgotPayoutPinMutation } from '../hooks/useAuthMutations.ts'
import {
  forgotPayoutPinRequestSchema,
  getForgotPasswordFormErrorMessage,
} from '../services/authSchemas.ts'

export function ForgotPayoutPinPage() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)
  const requestInFlightRef = useRef(false)
  const forgotMutation = useForgotPayoutPinMutation()

  const handleSubmit: NonNullable<ComponentProps<'form'>['onSubmit']> = async (
    event,
  ) => {
    event.preventDefault()
    if (requestInFlightRef.current || forgotMutation.isPending) {
      return
    }

    setErrorMessage(null)
    setInfoMessage(null)
    const formData = new FormData(event.currentTarget)
    const email = String(formData.get('email') ?? '')
    const parsed = forgotPayoutPinRequestSchema.safeParse({ email })
    if (!parsed.success) {
      setErrorMessage(getForgotPasswordFormErrorMessage(email))
      return
    }

    requestInFlightRef.current = true
    try {
      const result = await forgotMutation.mutateAsync(parsed.data)
      setInfoMessage(
        result.message ??
          'If an admin account with a configured payout PIN exists for this email, reset instructions will be sent shortly.',
      )
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to send reset instructions. Please try again.',
      )
    } finally {
      requestInFlightRef.current = false
    }
  }

  return (
    <>
      <form
        className="auth-form-enter space-y-5"
        onSubmit={handleSubmit}
        noValidate
      >
        <p className="[font-family:var(--font-body)] text-sm leading-6 text-(--auth-surface-muted)">
          We’ll email a secure link to your admin address. You’ll need to sign
          in and verify with your authenticator app to choose a new PIN.
        </p>

        <div className="space-y-1.5">
          <label
            htmlFor="email"
            className="[font-family:var(--font-body)] text-sm font-semibold text-[#2d3237]"
          >
            Admin email
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
          />
        </div>

        <Button type="submit" className="w-full" disabled={forgotMutation.isPending}>
          {forgotMutation.isPending ? 'Sending…' : 'Send reset link'}
        </Button>

        <p className="pt-1 text-center [font-family:var(--font-body)] text-sm text-[#566167]">
          <Link
            to="/login"
            className="font-semibold text-[#c58b6b] transition hover:text-[#a97659]"
          >
            Back to sign in
          </Link>
        </p>
      </form>

      {errorMessage ? (
        <Toast
          message={errorMessage}
          variant="error"
          onClose={() => setErrorMessage(null)}
        />
      ) : null}
      {infoMessage ? (
        <Toast
          message={infoMessage}
          variant="success"
          onClose={() => setInfoMessage(null)}
        />
      ) : null}
    </>
  )
}
