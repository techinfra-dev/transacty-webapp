import { useState, type ComponentProps } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Button } from '../../../components/ui/Button.tsx'
import { Input } from '../../../components/ui/Input.tsx'
import { Toast } from '../../../components/ui/Toast.tsx'
import { useLoginMutation } from '../hooks/useAuthMutations.ts'

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const navigate = useNavigate()
  const loginMutation = useLoginMutation()

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
      await loginMutation.mutateAsync({
        email: String(formData.get('email') ?? ''),
        password: String(formData.get('password') ?? ''),
      })
      await navigate({ to: '/dashboard' })
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to login right now. Please try again.',
      )
    }
  }

  return (
    <>
      <form className="space-y-5" onSubmit={handleLogin}>
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
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="[font-family:var(--font-body)] text-sm font-medium">
            Password
          </label>
          <Link
            to="/forgot-password"
            className="[font-family:var(--font-body)] text-xs text-(--color-secondary) transition hover:text-(--color-foreground)"
          >
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your password"
            className="pr-12"
          />
          <Button
            variant="ghost"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute inset-y-0 right-0 h-auto cursor-pointer rounded-none bg-transparent px-3 text-xs hover:bg-transparent"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? 'Hide' : 'Show'}
          </Button>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
        {loginMutation.isPending ? (
          <span className="inline-flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-(--color-background)/40 border-t-(--color-background)" />
            Logging in...
          </span>
        ) : (
          'Login'
        )}
      </Button>

        <p className="pt-1 text-center [font-family:var(--font-body)] text-sm text-(--color-secondary)">
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="font-semibold text-(--color-foreground)">
            Create one
          </Link>
        </p>
      </form>

      {errorMessage ? (
        <Toast message={errorMessage} variant="error" onClose={() => setErrorMessage(null)} />
      ) : null}
    </>
  )
}
