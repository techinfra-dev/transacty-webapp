import { useState, type ComponentProps } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Button } from '../../../components/ui/Button.tsx'
import { Input } from '../../../components/ui/Input.tsx'
import { OtpInput } from '../../../components/ui/OtpInput.tsx'
import { Toast } from '../../../components/ui/Toast.tsx'
import {
  useLoginMutation,
  useMfaVerifyMutation,
} from '../hooks/useAuthMutations.ts'

type LoginStep = 'credentials' | 'mfa'

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [step, setStep] = useState<LoginStep>('credentials')
  const [mfaToken, setMfaToken] = useState<string | null>(null)
  const [mfaEmailHint, setMfaEmailHint] = useState<string | null>(null)
  const [mfaCode, setMfaCode] = useState('')

  const navigate = useNavigate()
  const loginMutation = useLoginMutation()
  const mfaVerifyMutation = useMfaVerifyMutation()

  const handleLogin: NonNullable<ComponentProps<'form'>['onSubmit']> = async (
    event,
  ) => {
    event.preventDefault()
    if (loginMutation.isPending) {
      return
    }

    setErrorMessage(null)
    const formData = new FormData(event.currentTarget)

    try {
      const result = await loginMutation.mutateAsync({
        email: String(formData.get('email') ?? ''),
        password: String(formData.get('password') ?? ''),
      })

      if ('requiresMfa' in result && result.requiresMfa) {
        setMfaToken(result.mfaToken)
        setMfaEmailHint(result.email)
        setMfaCode('')
        setStep('mfa')
        return
      }

      await navigate({ to: '/dashboard' })
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to login right now. Please try again.',
      )
    }
  }

  const handleMfaVerify: NonNullable<ComponentProps<'form'>['onSubmit']> = async (
    event,
  ) => {
    event.preventDefault()
    if (mfaVerifyMutation.isPending || !mfaToken) {
      return
    }

    setErrorMessage(null)

    try {
      await mfaVerifyMutation.mutateAsync({
        mfaToken,
        code: mfaCode,
      })
      await navigate({ to: '/dashboard' })
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to verify your code. Please try again.',
      )
    }
  }

  const isBusy = loginMutation.isPending || mfaVerifyMutation.isPending

  return (
    <>
      {step === 'credentials' ? (
        <form
          key="credentials"
          className="auth-form-enter space-y-5"
          onSubmit={handleLogin}
        >
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
              placeholder="Enter your email"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="[font-family:var(--font-body)] text-sm font-semibold text-[#2d3237]"
              >
                Password
              </label>
              <Link
                to="/forgot-password"
                className="[font-family:var(--font-body)] text-xs font-medium text-[#c58b6b] transition hover:text-[#a97659]"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter your password"
                className="pr-12"
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

          <Button type="submit" className="w-full" disabled={isBusy}>
            {loginMutation.isPending ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-(--color-background)/40 border-t-(--color-background)" />
                Logging in...
              </span>
            ) : (
              'Login'
            )}
          </Button>

          <p className="pt-1 text-center [font-family:var(--font-body)] text-sm text-[#566167]">
            Don&apos;t have an account?{' '}
            <Link
              to="/signup"
              className="font-semibold text-[#c58b6b] transition hover:text-[#a97659]"
            >
              Create one
            </Link>
          </p>
        </form>
      ) : (
        <form
          key="mfa"
          className="auth-form-enter space-y-5"
          onSubmit={handleMfaVerify}
        >
          <div className="space-y-1">
            <p className="[font-family:var(--font-body)] text-sm text-(--color-secondary)">
              Two-factor authentication is enabled for{' '}
              <span className="font-medium text-(--color-foreground)">
                {mfaEmailHint ?? 'your account'}
              </span>
              . Open your authenticator app and enter the 6-digit code.
            </p>
          </div>

          <div className="space-y-3">
            <p className="[font-family:var(--font-body)] text-sm font-medium text-(--color-foreground)">
              Authentication code
            </p>
            <OtpInput
              value={mfaCode}
              onChange={setMfaCode}
              disabled={isBusy}
              autoFocus
              aria-label="6-digit authentication code"
              aria-describedby="mfa-code-hint"
            />
            <p
              id="mfa-code-hint"
              className="[font-family:var(--font-body)] text-xs text-(--color-secondary)"
            >
              Enter the 6-digit code from your authenticator app.
            </p>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isBusy || mfaCode.length !== 6}
          >
            {mfaVerifyMutation.isPending ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-(--color-background)/40 border-t-(--color-background)" />
                Verifying...
              </span>
            ) : (
              'Verify and continue'
            )}
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="w-full"
            disabled={isBusy}
            onClick={() => {
              setStep('credentials')
              setMfaToken(null)
              setMfaEmailHint(null)
              setMfaCode('')
              setErrorMessage(null)
            }}
          >
            Back to sign in
          </Button>
        </form>
      )}

      {errorMessage ? (
        <Toast
          message={errorMessage}
          variant="error"
          onClose={() => setErrorMessage(null)}
        />
      ) : null}
    </>
  )
}
