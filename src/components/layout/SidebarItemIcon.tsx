import { useId } from 'react'

type SidebarItemIconProps = {
  to:
    | '/dashboard'
    | '/dashboard/wallets'
    | '/dashboard/transactions'
    | '/dashboard/customers'
    | '/dashboard/payouts'
    | '/dashboard/settings'
  active?: boolean
}

const iconClass = 'block h-4 w-4 shrink-0'

type IconPaths = {
  outline: string | string[]
  solid: string | string[]
  /** Material-style paths that render with fill, not stroke, when inactive */
  outlineUsesFill?: boolean
  outlineStrokeWidth?: number
  /** Same stroke icon for active and inactive (no fill variant) */
  strokeOnly?: boolean
  solidViewBox?: string
  outlineViewBox?: string
  solidCircle?: { cx: number; cy: number; r: number }
}

const sidebarIcons: Record<SidebarItemIconProps['to'], IconPaths> = {
  '/dashboard': {
    outline:
      'M13 8V4q0-.425.288-.712T14 3h6q.425 0 .713.288T21 4v4q0 .425-.288.713T20 9h-6q-.425 0-.712-.288T13 8M3 12V4q0-.425.288-.712T4 3h6q.425 0 .713.288T11 4v8q0 .425-.288.713T10 13H4q-.425 0-.712-.288T3 12m10 8v-8q0-.425.288-.712T14 11h6q.425 0 .713.288T21 12v8q0 .425-.288.713T20 21h-6q-.425 0-.712-.288T13 20M3 20v-4q0-.425.288-.712T4 15h6q.425 0 .713.288T11 16v4q0 .425-.288.713T10 21H4q-.425 0-.712-.288T3 20m2-9h4V5H5zm10 8h4v-6h-4zm0-12h4V5h-4zM5 19h4v-2H5zm4-2',
    outlineUsesFill: true,
    solid:
      'M14 9q-.425 0-.712-.288T13 8V4q0-.425.288-.712T14 3h6q.425 0 .713.288T21 4v4q0 .425-.288.713T20 9zM4 13q-.425 0-.712-.288T3 12V4q0-.425.288-.712T4 3h6q.425 0 .713.288T11 4v8q0 .425-.288.713T10 13zm10 8q-.425 0-.712-.288T13 20v-8q0-.425.288-.712T14 11h6q.425 0 .713.288T21 12v8q0 .425-.288.713T20 21zM4 21q-.425 0-.712-.288T3 20v-4q0-.425.288-.712T4 15h6q.425 0 .713.288T11 16v4q0 .425-.288.713T10 21z',
  },
  '/dashboard/wallets': {
    outline:
      'M3 6.5V17c0 1.886 0 2.828.586 3.414S5.114 21 7 21h12c.943 0 1.414 0 1.707-.293S21 19.943 21 19v-2M3 6.5A2.5 2.5 0 0 0 5.5 9H19c.943 0 1.414 0 1.707.293S21 10.057 21 11v2M3 6.5A2.5 2.5 0 0 1 5.5 4h13.786c.2 0 .299 0 .38.028a.5.5 0 0 1 .306.307c.028.08.028.18.028.38c0 1.196 0 1.795-.168 2.276a3 3 0 0 1-1.841 1.84C17.51 9 16.91 9 15.714 9H15m6 8h-4c-.943 0-1.414 0-1.707-.293S15 15.943 15 15s0-1.414.293-1.707S16.057 13 17 13h4m0 4v-4',
    outlineStrokeWidth: 2,
    solid:
      'M2.273 5.625A4.875 4.875 0 0 1 7.125 2.25h9.75c1.935 0 3.648.902 4.852 2.302l-1.18 1.324a2.875 2.875 0 0 0-2.672 1.524l-.623 1.242a1.125 1.125 0 0 1-1.006.691H15a3 3 0 1 1-6 0H8.649a1.125 1.125 0 0 1-1.006-.691l-.623-1.242A2.875 2.875 0 0 0 4.523 5.302L2.273 5.625ZM2.273 12h19.454c.966 0 1.454.78 1.174 1.67l-1.18 3.924a2.25 2.25 0 0 1-2.154 1.606H4.444a2.25 2.25 0 0 1-2.154-1.606l-1.18-3.924C.819 12.78 1.307 12 2.273 12Z',
  },
  '/dashboard/transactions': {
    outline: 'M2 7h18m-4-5l5 5l-5 5m6 5H4m4-5l-5 5l5 5',
    solid: 'M2 7h18m-4-5l5 5l-5 5m6 5H4m4-5l-5 5l5 5',
    strokeOnly: true,
    outlineStrokeWidth: 2,
  },
  '/dashboard/payouts': {
    outline:
      'M2.25 18.75a60.07 60.07 0 0 0 15.797 2.106c.504 0 .972-.043 1.422-.124M2.25 18.75v-3.375c0-.621.504-1.125 1.125-1.125h19.125c.621 0 1.125.504 1.125 1.125v3.375M2.25 18.75l.003.165a2.25 2.25 0 0 0 2.098 2.127l2.906.253a48.072 48.072 0 0 0 7.74 0l2.906-.253a2.25 2.25 0 0 0 2.098-2.127L21.75 18.75M5.25 6.375c0-.621.504-1.125 1.125-1.125h12.75c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125H6.375c-.621 0-1.125-.504-1.125-1.125v-1.5ZM5.25 9.75h15.75m-15.75 3h15.75',
    solid:
      'M2.25 18.75a60.07 60.07 0 0 0 15.797 2.106c.504 0 .972-.043 1.422-.124M2.25 18.75v-3.375c0-.621.504-1.125 1.125-1.125h19.125c.621 0 1.125.504 1.125 1.125v3.375M2.25 18.75l.003.165a2.25 2.25 0 0 0 2.098 2.127l2.906.253a48.072 48.072 0 0 0 7.74 0l2.906-.253a2.25 2.25 0 0 0 2.098-2.127L21.75 18.75M5.25 6.375c0-.621.504-1.125 1.125-1.125h12.75c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125H6.375c-.621 0-1.125-.504-1.125-1.125v-1.5ZM5.25 9.75h15.75m-15.75 3h15.75',
  },
  '/dashboard/customers': {
    outline:
      'M15 14s1 0 1-1s-1-4-5-4s-5 3-5 4s1 1 1 1zm-7.978-1L7 12.996c.001-.264.167-1.03.76-1.72C8.312 10.629 9.282 10 11 10c1.717 0 2.687.63 3.24 1.276c.593.69.758 1.457.76 1.72l-.008.002l-.014.002zM11 7a2 2 0 1 0 0-4a2 2 0 0 0 0 4m3-2a3 3 0 1 1-6 0a3 3 0 0 1 6 0M6.936 9.28a6 6 0 0 0-1.23-.247A7 7 0 0 0 5 9c-4 0-5 3-5 4q0 1 1 1h4.216A2.24 2.24 0 0 1 5 13c0-1.01.377-2.042 1.09-2.904c.243-.294.526-.569.846-.816M4.92 10A5.5 5.5 0 0 0 4 13H1c0-.26.164-1.03.76-1.724c.545-.636 1.492-1.256 3.16-1.275ZM1.5 5.5a3 3 0 1 1 6 0a3 3 0 0 1-6 0m3-2a2 2 0 1 0 0 4a2 2 0 0 0 0-4',
    outlineViewBox: '0 0 16 16',
    outlineUsesFill: true,
    solid:
      'M7 14s-1 0-1-1s1-4 5-4s5 3 5 4s-1 1-1 1zm4-6a3 3 0 1 0 0-6a3 3 0 0 0 0 6m-5.784 6A2.24 2.24 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A6.3 6.3 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1zM4.5 8a2.5 2.5 0 1 0 0-5a2.5 2.5 0 0 0 0 5',
    solidViewBox: '0 0 16 16',
  },
  '/dashboard/settings': {
    outline:
      'M262.29 192.31a64 64 0 1 0 57.4 57.4a64.13 64.13 0 0 0-57.4-57.4M416.39 256a154 154 0 0 1-1.53 20.79l45.21 35.46a10.81 10.81 0 0 1 2.45 13.75l-42.77 74a10.81 10.81 0 0 1-13.14 4.59l-44.9-18.08a16.11 16.11 0 0 0-15.17 1.75A164.5 164.5 0 0 1 325 400.8a15.94 15.94 0 0 0-8.82 12.14l-6.73 47.89a11.08 11.08 0 0 1-10.68 9.17h-85.54a11.11 11.11 0 0 1-10.69-8.87l-6.72-47.82a16.07 16.07 0 0 0-9-12.22a155 155 0 0 1-21.46-12.57a16 16 0 0 0-15.11-1.71l-44.89 18.07a10.81 10.81 0 0 1-13.14-4.58l-42.77-74a10.8 10.8 0 0 1 2.45-13.75l38.21-30a16.05 16.05 0 0 0 6-14.08c-.36-4.17-.58-8.33-.58-12.5s.21-8.27.58-12.35a16 16 0 0 0-6.07-13.94l-38.19-30A10.81 10.81 0 0 1 49.48 186l42.77-74a10.81 10.81 0 0 1 13.14-4.59l44.9 18.08a16.11 16.11 0 0 0 15.17-1.75A164.5 164.5 0 0 1 187 111.2a15.94 15.94 0 0 0 8.82-12.14l6.73-47.89A11.08 11.08 0 0 1 213.23 42h85.54a11.11 11.11 0 0 1 10.69 8.87l6.72 47.82a16.07 16.07 0 0 0 9 12.22a155 155 0 0 1 21.46 12.57a16 16 0 0 0 15.11 1.71l44.89-18.07a10.81 10.81 0 0 1 13.14 4.58l42.77 74a10.8 10.8 0 0 1-2.45 13.75l-38.21 30a16.05 16.05 0 0 0-6.05 14.08c.33 4.14.55 8.3.55 12.47',
    outlineViewBox: '0 0 512 512',
    outlineStrokeWidth: 32,
    solid:
      'm470.39 300l-.47-.38l-31.56-24.75a16.11 16.11 0 0 1-6.1-13.33v-11.56a16 16 0 0 1 6.11-13.22L469.92 212l.47-.38a26.68 26.68 0 0 0 5.9-34.06l-42.71-73.9a1.6 1.6 0 0 1-.13-.22A26.86 26.86 0 0 0 401 92.14l-.35.13l-37.1 14.93a15.94 15.94 0 0 1-14.47-1.29q-4.92-3.1-10-5.86a15.94 15.94 0 0 1-8.19-11.82l-5.59-39.59l-.12-.72A27.22 27.22 0 0 0 298.76 26h-85.52a26.92 26.92 0 0 0-26.45 22.39l-.09.56l-5.57 39.67a16 16 0 0 1-8.13 11.82a175 175 0 0 0-10 5.82a15.92 15.92 0 0 1-14.43 1.27l-37.13-15l-.35-.14a26.87 26.87 0 0 0-32.48 11.34l-.13.22l-42.77 73.95a26.71 26.71 0 0 0 5.9 34.1l.47.38l31.56 24.75a16.11 16.11 0 0 1 6.1 13.33v11.56a16 16 0 0 1-6.11 13.22L42.08 300l-.47.38a26.68 26.68 0 0 0-5.9 34.06l42.71 73.9a1.6 1.6 0 0 1 .13.22a26.86 26.86 0 0 0 32.45 11.3l.35-.13l37.07-14.93a15.94 15.94 0 0 1 14.47 1.29q4.92 3.11 10 5.86a15.94 15.94 0 0 1 8.19 11.82l5.56 39.59l.12.72A27.22 27.22 0 0 0 213.24 486h85.52a26.92 26.92 0 0 0 26.45-22.39l.09-.56l5.57-39.67a16 16 0 0 1 8.18-11.82c3.42-1.84 6.76-3.79 10-5.82a15.92 15.92 0 0 1 14.43-1.27l37.13 14.95l.35.14a26.85 26.85 0 0 0 32.48-11.34a3 3 0 0 1 .13-.22l42.71-73.89a26.7 26.7 0 0 0-5.89-34.11m-134.48-40.24a80 80 0 1 1-83.66-83.67a80.21 80.21 0 0 1 83.66 83.67',
    solidViewBox: '0 0 512 512',
    solidCircle: { cx: 256, cy: 256, r: 48 },
  },
}

function normalizePaths(paths: string | string[]) {
  return Array.isArray(paths) ? paths : [paths]
}

function WalletFilledIcon() {
  const maskId = useId()

  return (
    <svg viewBox="0 0 24 24" className={iconClass} aria-hidden="true">
      <mask
        id={maskId}
        width="20"
        height="14"
        x="2"
        y="8"
        fill="#000"
        maskUnits="userSpaceOnUse"
      >
        <path fill="#fff" d="M2 8h20v14H2z" />
        <path d="M19 21H5c-.943 0-1.414 0-1.707-.293S3 19.943 3 19V9h16c.943 0 1.414 0 1.707.293S21 10.057 21 11v1h-3a3 3 0 1 0 0 6h3v1c0 .943 0 1.414-.293 1.707S19.943 21 19 21" />
      </mask>
      <g fill="none">
        <path
          fill="currentColor"
          d="M20 5a1 1 0 1 0 0-2zM5.5 5H20V3H5.5zm0 5h8V8h-8zM4 6.5A1.5 1.5 0 0 1 5.5 5V3A3.5 3.5 0 0 0 2 6.5zm-2 0A3.5 3.5 0 0 0 5.5 10V8A1.5 1.5 0 0 1 4 6.5z"
        />
        <path stroke="currentColor" strokeWidth={2} d="M3 12V6.5" />
        <path
          fill="currentColor"
          d="M19 21H5c-.943 0-1.414 0-1.707-.293S3 19.943 3 19V9h16c.943 0 1.414 0 1.707.293S21 10.057 21 11v1h-3a3 3 0 1 0 0 6h3v1c0 .943 0 1.414-.293 1.707S19.943 21 19 21"
        />
        <path
          stroke="currentColor"
          strokeWidth={2}
          d="M19 21H5c-.943 0-1.414 0-1.707-.293S3 19.943 3 19V9h16c.943 0 1.414 0 1.707.293S21 10.057 21 11v1h-3a3 3 0 1 0 0 6h3v1c0 .943 0 1.414-.293 1.707S19.943 21 19 21Z"
          mask={`url(#${maskId})`}
        />
      </g>
    </svg>
  )
}

function SidebarSvg({
  paths,
  active,
  filledOutline = false,
  strokeOnly = false,
  strokeWidth = 1.5,
  viewBox = '0 0 24 24',
  circle,
}: {
  paths: string | string[]
  active: boolean
  filledOutline?: boolean
  strokeOnly?: boolean
  strokeWidth?: number
  viewBox?: string
  circle?: { cx: number; cy: number; r: number }
}) {
  const d = normalizePaths(paths)

  if (!strokeOnly && (active || filledOutline)) {
    return (
      <svg viewBox={viewBox} className={iconClass} aria-hidden="true">
        {circle ? (
          <circle
            cx={circle.cx}
            cy={circle.cy}
            r={circle.r}
            fill="currentColor"
          />
        ) : null}
        {d.map((pathD) => (
          <path key={pathD} fill="currentColor" d={pathD} />
        ))}
      </svg>
    )
  }

  const scaleStroke = viewBox === '0 0 24 24'

  return (
    <svg viewBox={viewBox} className={iconClass} aria-hidden="true">
      {d.map((pathD) => (
        <path
          key={pathD}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect={scaleStroke ? 'non-scaling-stroke' : undefined}
          d={pathD}
        />
      ))}
    </svg>
  )
}

export function SidebarItemIcon({ to, active = false }: SidebarItemIconProps) {
  const icon = sidebarIcons[to]
  if (!icon) {
    return null
  }

  if (to === '/dashboard/wallets' && active) {
    return <WalletFilledIcon />
  }

  return (
    <SidebarSvg
      paths={active ? icon.solid : icon.outline}
      active={active}
      filledOutline={!active && icon.outlineUsesFill}
      strokeOnly={icon.strokeOnly}
      strokeWidth={icon.outlineStrokeWidth}
      viewBox={
        active
          ? icon.solidViewBox ?? '0 0 24 24'
          : icon.outlineViewBox ?? '0 0 24 24'
      }
      circle={active ? icon.solidCircle : undefined}
    />
  )
}

export function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" className={iconClass} aria-hidden="true">
      <path fill="none" d="M0 0h24v24H0z" />
      <path
        fill="currentColor"
        d="M5 21q-.825 0-1.412-.587T3 19V5q0-.825.588-1.412T5 3h6q.425 0 .713.288T12 4t-.288.713T11 5H5v14h6q.425 0 .713.288T12 20t-.288.713T11 21zm12.175-8H10q-.425 0-.712-.288T9 12t.288-.712T10 11h7.175L15.3 9.125q-.275-.275-.275-.675t.275-.7t.7-.313t.725.288L20.3 11.3q.3.3.3.7t-.3.7l-3.575 3.575q-.3.3-.712.288t-.713-.313q-.275-.3-.262-.712t.287-.688z"
      />
    </svg>
  )
}
