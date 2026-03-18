import { useState, type ComponentProps } from 'react'
import { Link } from '@tanstack/react-router'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '../../../components/ui/Button.tsx'
import { Input } from '../../../components/ui/Input.tsx'
import { Toast } from '../../../components/ui/Toast.tsx'
import { useSignupMutation } from '../hooks/useAuthMutations.ts'

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

    try {
      await signupMutation.mutateAsync({
        businessName: String(formData.get('businessName') ?? ''),
        email: String(formData.get('email') ?? ''),
        password: String(formData.get('password') ?? ''),
      })
      await navigate({ to: '/dashboard' })
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
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-1.5">
          <label htmlFor="businessName" className="[font-family:var(--font-body)] text-sm font-medium">
            Business name
          </label>
          <Input
            id="businessName"
            name="businessName"
            type="text"
            placeholder="Acme Inc"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="email" className="[font-family:var(--font-body)] text-sm font-medium">
            Email
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@company.com"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="[font-family:var(--font-body)] text-sm font-medium">
            Password
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="Create password"
          />
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

        <p className="pt-1 text-center [font-family:var(--font-body)] text-sm text-(--color-secondary)">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-(--color-foreground)">
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
