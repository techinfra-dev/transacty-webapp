/** Abstract arrow + bar motif for the auth split banner (charcoal + terracotta). */
export function AuthBannerGraphic({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 400 320"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        fill="#3a4046"
        d="M48 248h52v52H48zm72-40h52v92h-52zm72-72h52v164h-52z"
      />
      <path
        fill="#4a4f55"
        d="M60 200h36v88H60zm84-56h36v144h-36zm84-84h36v220h-36z"
        opacity="0.85"
      />
      <path
        fill="#c58b6b"
        d="M232 228l118-118v76h40V90H244v40h76L220 232z"
        opacity="0.95"
      />
      <path
        stroke="#c58b6b"
        strokeWidth="18"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M88 252l132-132 48 48"
        opacity="0.55"
      />
    </svg>
  )
}
