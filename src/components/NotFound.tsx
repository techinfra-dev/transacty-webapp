import { Link, useRouter, useRouterState } from '@tanstack/react-router'
import { isAuthenticated } from '../features/auth/services/authSession.ts'

export function NotFound() {
  const router = useRouter()
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const signedIn = isAuthenticated()

  return (
    <section
      className="not-found"
      role="alert"
      aria-labelledby="not-found-title"
    >
      <div className="not-found-card">
        <span className="not-found-eyebrow">Error 404</span>

        <p className="not-found-code" aria-hidden>
          404
        </p>

        <h1 id="not-found-title" className="not-found-title">
          We couldn&rsquo;t find that page
        </h1>

        <p className="not-found-copy">
          The link may be broken, or the page may have moved since you last used
          it. Check the address, or head back to a known page.
        </p>

        <p className="not-found-path" title={pathname}>
          {pathname}
        </p>

        <div className="not-found-actions">
          <Link
            to={signedIn ? '/dashboard' : '/login'}
            className="not-found-btn not-found-btn--primary"
          >
            {signedIn ? 'Back to dashboard' : 'Go to sign in'}
          </Link>

          <button
            type="button"
            className="not-found-btn not-found-btn--ghost"
            onClick={() => router.history.back()}
          >
            Go back
          </button>
        </div>
      </div>
    </section>
  )
}
