import { useState, type ComponentProps } from 'react'
import { Link } from '@tanstack/react-router'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '../../../components/ui/Button.tsx'
import { Input } from '../../../components/ui/Input.tsx'
import { Toast } from '../../../components/ui/Toast.tsx'
import { useSignupMutation } from '../hooks/useAuthMutations.ts'
import {
  getSignupFormErrorMessage,
  signupFormSchema,
} from '../services/authSchemas.ts'
import { getPostAuthNavigateOptions } from '../utils/postAuthNavigation.ts'

export function SignUpPage() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [welcomeSlug, setWelcomeSlug] = useState<string | null>(null)
  const [isSlugCopied, setIsSlugCopied] = useState(false)
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
      confirmPassword: String(formData.get('confirmPassword') ?? ''),
    }
    const parsed = signupFormSchema.safeParse(payload)
    if (!parsed.success) {
      setErrorMessage(getSignupFormErrorMessage(payload, parsed.error))
      return
    }

    try {
      const result = await signupMutation.mutateAsync({
        businessName: parsed.data.businessName,
        email: parsed.data.email,
        password: parsed.data.password,
      })
      if (result.emailVerificationRequired) {
        await navigate({
          to: '/resend-verification',
          search: { email: result.email, sent: '1' },
        })
        return
      }
      const slugFromMerchant =
        'merchant' in result &&
        result.merchant &&
        typeof result.merchant === 'object' &&
        'slug' in result.merchant &&
        typeof result.merchant.slug === 'string'
          ? result.merchant.slug.trim()
          : ''
      const slug =
        ('merchantSlug' in result ? result.merchantSlug?.trim() : '') ||
        slugFromMerchant
      if (slug) {
        setWelcomeSlug(slug)
        return
      }
      await navigate(getPostAuthNavigateOptions())
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to create account right now. Please try again.',
      )
    }
  }

  async function handleCopySlug() {
    if (!welcomeSlug) {
      return
    }
    try {
      await navigator.clipboard.writeText(welcomeSlug)
      setIsSlugCopied(true)
      window.setTimeout(() => setIsSlugCopied(false), 1800)
    } catch {
      setIsSlugCopied(false)
    }
  }

  if (welcomeSlug) {
    return (
      <div className="auth-form-enter space-y-5">
        <div className="space-y-2 text-center">
          <h2 className="[font-family:var(--font-display)] text-xl font-semibold text-[#0F0700]">
            Welcome to Transacty
          </h2>
          <p className="[font-family:var(--font-body)] text-sm text-[#566167]">
            Your merchant id is ready. Keep it handy for support and docs.
          </p>
        </div>

        <div className="rounded-lg border border-[#9D8F82]/40 bg-[#F3E8D6]/40 px-4 py-3 text-center">
          <p className="[font-family:var(--font-body)] text-xs font-semibold uppercase tracking-wide text-[#566167]">
            Merchant id
          </p>
          <code className="mt-1 block [font-family:ui-monospace,monospace] text-lg font-semibold text-[#0F0700]">
            {welcomeSlug}
          </code>
          <button
            type="button"
            className="mt-2 [font-family:var(--font-body)] text-sm font-semibold text-[#c58b6b] transition hover:text-[#a97659]"
            onClick={() => void handleCopySlug()}
          >
            {isSlugCopied ? 'Copied' : 'Copy'}
          </button>
        </div>

        <Button
          type="button"
          className="w-full"
          onClick={() => void navigate(getPostAuthNavigateOptions())}
        >
          Continue to dashboard
        </Button>
      </div>
    )
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
            minLength={10}
            maxLength={128}
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

        <div className="space-y-1.5">
          <label
            htmlFor="confirmPassword"
            className="[font-family:var(--font-body)] text-sm font-semibold text-[#2d3237]"
          >
            Confirm Password
          </label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            minLength={10}
            maxLength={128}
            placeholder="Repeat your password"
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
