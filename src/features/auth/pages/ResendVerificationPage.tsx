import { useState, type ComponentProps } from 'react'
import { Link } from '@tanstack/react-router'
import { Button } from '../../../components/ui/Button.tsx'
import { Input } from '../../../components/ui/Input.tsx'
import { Toast } from '../../../components/ui/Toast.tsx'
import { Route } from '../../../routes/resend-verification.tsx'
import { useResendVerificationMutation } from '../hooks/useAuthMutations.ts'
import {
  getForgotPasswordFormErrorMessage,
  resendVerificationRequestSchema,
} from '../services/authSchemas.ts'

export function ResendVerificationPage() {
  const search = Route.useSearch()
  const presetEmail = search.email?.trim() ?? ''
  const justSent = search.sent === '1'
  const linkExpired = search.expired === '1'

  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(
    justSent
      ? 'Check your inbox for a verification link. It expires in about an hour.'
      : null,
  )
  const resendMutation = useResendVerificationMutation()

  const handleSubmit: NonNullable<ComponentProps<'form'>['onSubmit']> = async (
    event,
  ) => {
    event.preventDefault()
    if (resendMutation.isPending) {
      return
    }

    setErrorMessage(null)
    setInfoMessage(null)
    const formData = new FormData(event.currentTarget)
    const email = String(formData.get('email') ?? '')
    const parsed = resendVerificationRequestSchema.safeParse({ email })
    if (!parsed.success) {
      setErrorMessage(getForgotPasswordFormErrorMessage(email))
      return
    }

    try {
      const result = await resendMutation.mutateAsync(parsed.data)
      setInfoMessage(result.message)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to send a verification email right now. Please try again.',
      )
    }
  }

  return (
    <>
      <form
        className="auth-form-enter space-y-5"
        onSubmit={handleSubmit}
        noValidate
        aria-busy={resendMutation.isPending}
      >
        <p className="[font-family:var(--font-body)] text-sm leading-6 text-(--color-secondary)">
          {linkExpired
            ? 'This verification link is invalid or has expired. Enter your email to request a new one.'
            : justSent
              ? 'We sent a verification link to your email. Open it to finish creating your account, or request another link below.'
              : 'Verify your email before signing in. If an unverified account exists for this address, we will send a new link.'}
        </p>

        <div className="space-y-1.5">
          <label
            htmlFor="email"
            className="[font-family:var(--font-body)] text-sm font-semibold text-[#2d3237]"
          >
            Email
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            defaultValue={presetEmail}
            placeholder="you@company.com"
          />
        </div>

        <Button type="submit" className="w-full" disabled={resendMutation.isPending}>
          {resendMutation.isPending ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-(--color-background)/40 border-t-(--color-background)" />
              Sending...
            </span>
          ) : (
            'Resend verification email'
          )}
        </Button>

        <p className="pt-1 text-center [font-family:var(--font-body)] text-sm text-[#566167]">
          Already verified?{' '}
          <Link
            to="/login"
            className="font-semibold text-[#c58b6b] transition hover:text-[#a97659]"
          >
            Sign in
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
