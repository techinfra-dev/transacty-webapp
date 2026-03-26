import { useMemo, useState, type ComponentProps } from 'react'
import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { Button } from '../../../components/ui/Button.tsx'
import { Input } from '../../../components/ui/Input.tsx'
import { Toast } from '../../../components/ui/Toast.tsx'
import { useResetPasswordMutation } from '../hooks/useAuthMutations.ts'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const search = useRouterState({ select: (state) => state.location.search })
  const token = useMemo(
    () => new URLSearchParams(search).get('token') ?? '',
    [search],
  )

  const [showPassword, setShowPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const resetMutation = useResetPasswordMutation()

  const handleSubmit: NonNullable<ComponentProps<'form'>['onSubmit']> = async (
    event,
  ) => {
    event.preventDefault()
    if (resetMutation.isPending || !token) {
      return
    }

    setErrorMessage(null)
    setSuccessMessage(null)
    const formData = new FormData(event.currentTarget)
    const password = String(formData.get('password') ?? '')
    const confirm = String(formData.get('confirmPassword') ?? '')

    if (password !== confirm) {
      setErrorMessage('Passwords do not match.')
      return
    }

    try {
      await resetMutation.mutateAsync({ token, password })
      setSuccessMessage('Your password has been updated. You can sign in now.')
      window.setTimeout(() => {
        void navigate({ to: '/login' })
      }, 1600)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to reset your password. Please try again.',
      )
    }
  }

  if (!token) {
    return (
      <div className="auth-form-enter space-y-5">
        <p className="[font-family:var(--font-body)] text-sm text-(--color-secondary)">
          This reset link is missing a valid token. Request a new link from the
          forgot password page.
        </p>
        <Button
          type="button"
          className="w-full bg-[#2d3237]! text-white! hover:bg-[#3a4046]!"
          onClick={() => void navigate({ to: '/forgot-password' })}
        >
          Forgot password
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
    <>
      <form className="auth-form-enter space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-1.5">
          <label
            htmlFor="password"
            className="[font-family:var(--font-body)] text-sm font-semibold text-[#2d3237]"
          >
            New password
          </label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              minLength={8}
              maxLength={128}
              placeholder="At least 8 characters"
              className="pr-12"
              required
            />
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute inset-y-0 right-0 h-auto cursor-pointer rounded-none bg-transparent px-3 text-xs text-[#566167] hover:bg-transparent hover:text-[#2d3237]"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? 'Hide' : 'Show'}
            </Button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="confirmPassword"
            className="[font-family:var(--font-body)] text-sm font-semibold text-[#2d3237]"
          >
            Confirm new password
          </label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            placeholder="Repeat your password"
            required
          />
        </div>

        <Button type="submit" className="w-full" disabled={resetMutation.isPending}>
          {resetMutation.isPending ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-(--color-background)/40 border-t-(--color-background)" />
              Updating password...
            </span>
          ) : (
            'Reset password'
          )}
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
      {successMessage ? (
        <Toast
          message={successMessage}
          variant="success"
          onClose={() => setSuccessMessage(null)}
        />
      ) : null}
    </>
  )
}
