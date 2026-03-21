import { useState, type ComponentProps } from 'react'
import { Link } from '@tanstack/react-router'
import { Button } from '../../../components/ui/Button.tsx'
import { Input } from '../../../components/ui/Input.tsx'
import { Toast } from '../../../components/ui/Toast.tsx'
import { useForgotPasswordMutation } from '../hooks/useAuthMutations.ts'

export function ForgotPasswordPage() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)
  const forgotMutation = useForgotPasswordMutation()

  const handleSubmit: NonNullable<ComponentProps<'form'>['onSubmit']> = async (
    event,
  ) => {
    event.preventDefault()
    if (forgotMutation.isPending) {
      return
    }

    setErrorMessage(null)
    setInfoMessage(null)
    const formData = new FormData(event.currentTarget)

    try {
      const result = await forgotMutation.mutateAsync({
        email: String(formData.get('email') ?? ''),
      })
      setInfoMessage(result.message)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to send reset instructions. Please try again.',
      )
    }
  }

  return (
    <>
      <form className="auth-form-enter space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-1.5">
          <label
            htmlFor="email"
            className="[font-family:var(--font-body)] text-sm font-medium"
          >
            Email
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
          {forgotMutation.isPending ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-(--color-background)/40 border-t-(--color-background)" />
              Sending...
            </span>
          ) : (
            'Send reset link'
          )}
        </Button>

        <p className="pt-1 text-center [font-family:var(--font-body)] text-sm text-(--color-secondary)">
          Remember your password?{' '}
          <Link to="/login" className="font-semibold text-(--color-foreground)">
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
