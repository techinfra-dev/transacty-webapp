import { Link } from '@tanstack/react-router'
import { Button } from '../../../components/ui/Button.tsx'
import { Input } from '../../../components/ui/Input.tsx'

export function ForgotPasswordPage() {
  return (
    <form className="space-y-5">
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

      <Button className="w-full">Send reset link</Button>

      <p className="pt-1 text-center [font-family:var(--font-body)] text-sm text-(--color-secondary)">
        Remember your password?{' '}
        <Link to="/login" className="font-semibold text-(--color-foreground)">
          Sign in
        </Link>
      </p>
    </form>
  )
}
