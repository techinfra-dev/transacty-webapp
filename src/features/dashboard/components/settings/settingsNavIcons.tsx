/**
 * Settings nav icons: unified 24×24 outline set (stroke 1.5, round caps).
 * Matches a clean dashboard sidebar / Lucide-style aesthetic.
 */
const svgProps = {
  viewBox: '0 0 24 24',
  fill: 'none' as const,
  xmlns: 'http://www.w3.org/2000/svg',
  className: 'h-5 w-5 shrink-0',
  'aria-hidden': true,
} as const

const strokeAttrs = {
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export function SettingsIconProfile() {
  return (
    <svg {...svgProps}>
      <circle cx="12" cy="8" r="3.5" {...strokeAttrs} />
      <path d="M5 20v-0.5a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5V20" {...strokeAttrs} />
    </svg>
  )
}

export function SettingsIconSecurity() {
  return (
    <svg {...svgProps}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" {...strokeAttrs} />
      <path d="m9 12 2 2 4-4" {...strokeAttrs} />
    </svg>
  )
}

export function SettingsIconDirectors() {
  return (
    <svg {...svgProps}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" {...strokeAttrs} />
      <circle cx="9" cy="7" r="4" {...strokeAttrs} />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" {...strokeAttrs} />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" {...strokeAttrs} />
    </svg>
  )
}

export function SettingsIconWhitelist() {
  return (
    <svg {...svgProps}>
      <circle cx="12" cy="12" r="10" {...strokeAttrs} />
      <path d="M2 12h20" {...strokeAttrs} />
      <path d="M12 2a10 10 0 0 1 0 20 10 10 0 0 1 0-20" {...strokeAttrs} />
    </svg>
  )
}

export function SettingsIconApiKeys() {
  return (
    <svg {...svgProps}>
      <circle cx="7.5" cy="15.5" r="4" {...strokeAttrs} />
      <path d="m21 2-9.6 9.6" {...strokeAttrs} />
      <path d="m15.5 7.5 3 3L22 7l-3-3" {...strokeAttrs} />
    </svg>
  )
}

/** Branching nodes — reads as “hooks / integrations” in the nav */
export function SettingsIconWebhooks() {
  return (
    <svg {...svgProps}>
      <circle cx="18" cy="5" r="3" {...strokeAttrs} />
      <circle cx="6" cy="12" r="3" {...strokeAttrs} />
      <circle cx="18" cy="19" r="3" {...strokeAttrs} />
      <path d="m8.59 13.51 6.83 3.98" {...strokeAttrs} />
      <path d="m15.41 6.51-6.82 3.98" {...strokeAttrs} />
    </svg>
  )
}

export function SettingsIconDeveloperDocs() {
  return (
    <svg {...svgProps}>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" {...strokeAttrs} />
      <path d="M15 3h6v6" {...strokeAttrs} />
      <path d="M10 14 21 3" {...strokeAttrs} />
    </svg>
  )
}
