import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Button } from '../../../components/ui/Button.tsx'
import { Route } from '../../../routes/verify-email.tsx'
import { useVerifyEmailMutation } from '../hooks/useAuthMutations.ts'
import { getPostAuthNavigateOptions } from '../utils/postAuthNavigation.ts'

export function VerifyEmailPage() {
  const navigate = useNavigate()
  const token = Route.useSearch().token ?? ''
  const verifyMutation = useVerifyEmailMutation()
  const startedRef = useRef(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!token || startedRef.current) {
      return
    }
    startedRef.current = true
    void verifyMutation
      .mutateAsync({ token })
      .then(async () => {
        await navigate(getPostAuthNavigateOptions())
      })
      .catch((error: unknown) => {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'This verification link is invalid or has expired.',
        )
      })
    // One-shot POST from the email link; mutation identity is not a trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, token])

  if (!token) {
    return (
      <div className="auth-form-enter space-y-5">
        <p className="[font-family:var(--font-body)] text-sm text-(--color-secondary)">
          This verification link is missing a token. Request a new email from the
          resend page.
        </p>
        <Button
          type="button"
          className="w-full"
          onClick={() => void navigate({ to: '/resend-verification' })}
        >
          Resend verification email
        </Button>
        <p className="text-center [font-family:var(--font-body)] text-sm text-[#566167]">
          <Link
            to="/login"
            className="font-semibold text-[#c58b6b] transition hover:text-[#a97659]"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    )
  }

  if (errorMessage) {
    return (
      <div className="auth-form-enter space-y-5">
        <p className="[font-family:var(--font-body)] text-sm text-(--color-secondary)">
          {errorMessage}
        </p>
        <Button
          type="button"
          className="w-full"
          onClick={() =>
            void navigate({
              to: '/resend-verification',
              search: { expired: '1' },
            })
          }
        >
          Resend verification email
        </Button>
        <p className="text-center [font-family:var(--font-body)] text-sm text-[#566167]">
          <Link
            to="/login"
            className="font-semibold text-[#c58b6b] transition hover:text-[#a97659]"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    )
  }

  return (
    <div className="auth-form-enter space-y-5">
      <p className="[font-family:var(--font-body)] text-sm text-(--color-secondary)">
        Confirming your email address...
      </p>
      <Button type="button" className="w-full" disabled>
        <span className="inline-flex items-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-(--color-background)/40 border-t-(--color-background)" />
          Verifying...
        </span>
      </Button>
    </div>
  )
}
