export function TestModeBanner() {
  return (
    <div
      role="status"
      aria-live="polite"
      className=" fixed  bottom-6 left-1/2 z-50  -translate-x-1/2 rounded-lg border border-rose-200/90 bg-[#fff1f2] px-10 py-3 shadow-lg"
    >
      <p className="text-center font-semibold text-rose-900 md:text-md">
        You are currently in Test Mode.
      </p>
    </div>
  )
}
