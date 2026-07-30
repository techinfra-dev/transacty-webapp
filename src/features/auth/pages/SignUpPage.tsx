import { useState, type ComponentProps } from 'react'
import { Link } from '@tanstack/react-router'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '../../../components/ui/Button.tsx'
import { Input } from '../../../components/ui/Input.tsx'
import { Toast } from '../../../components/ui/Toast.tsx'
import { useSignupMutation } from '../hooks/useAuthMutations.ts'
import {
  getSignupFormErrorMessage,
  signupRequestSchema,
} from '../services/authSchemas.ts'
import { getPostAuthNavigateOptions } from '../utils/postAuthNavigation.ts'

export function SignUpPage() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const navigate = useNavigate()
  const signupMutation = useSignupMutation()

  const handleSubmit: NonNullable<ComponentProps<'form'>['onSubmit']> = async (
    event,
  ) => {
    event.preventDefault()
    if (signupMutation.isPending) {
      return
    }

    setErrorMessage(null)
    const formData = new FormData(event.currentTarget)
    const payload = {
      businessName: String(formData.get('businessName') ?? ''),
      email: String(formData.get('email') ?? ''),
      password: String(formData.get('password') ?? ''),
    }
    const parsed = signupRequestSchema.safeParse(payload)
    if (!parsed.success) {
      setErrorMessage(getSignupFormErrorMessage(payload, parsed.error))
      return
    }

    try {
      await signupMutation.mutateAsync(parsed.data)
      await navigate(getPostAuthNavigateOptions())
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to create account right now. Please try again.',
      )
    }
  }

  return (
    <>
      <form className="auth-form-enter space-y-5" onSubmit={handleSubmit} noValidate>
        <div className="space-y-1.5">
          <label
            htmlFor="businessName"
            className="[font-family:var(--font-body)] text-sm font-semibold text-[#2d3237]"
          >
            Business name
          </label>
          <Input
            id="businessName"
            name="businessName"
            type="text"
            autoComplete="organization"
            placeholder="Acme Inc"
          />
        </div>

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
            placeholder="you@company.com"
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="password"
            className="[font-family:var(--font-body)] text-sm font-semibold text-[#2d3237]"
          >
            Password
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="Create password"
            aria-describedby="password-requirements"
          />
          <p
            id="password-requirements"
            className="[font-family:var(--font-body)] text-xs leading-5 text-[#566167]"
          >
            At least 10 characters, including a letter and a number. Avoid common
            passwords.
          </p>
        </div>

        <Button type="submit" className="w-full" disabled={signupMutation.isPending}>
          {signupMutation.isPending ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-(--color-background)/40 border-t-(--color-background)" />
              Creating account...
            </span>
          ) : (
            'Create account'
          )}
        </Button>

        <p className="pt-1 text-center [font-family:var(--font-body)] text-sm text-[#566167]">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-semibold text-[#c58b6b] transition hover:text-[#a97659]"
          >
            Sign in
          </Link>
        </p>
      </form>

      {errorMessage ? (
        <Toast message={errorMessage} variant="error" onClose={() => setErrorMessage(null)} />
      ) : null}
    </>
  )
}
