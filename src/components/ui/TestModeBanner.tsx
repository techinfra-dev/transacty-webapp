export function TestModeBanner() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="test-mode-banner"
    >
      <p className="test-mode-banner__text">You are currently in Test Mode.</p>
    </div>
  )
}
