import { useCallback, useEffect, useRef, useState } from 'react'

const ACTIVITY_THROTTLE_MS = 1000

export const DEFAULT_INACTIVITY_IDLE_MS = 0.5 * 60 * 1000
export const DEFAULT_INACTIVITY_WARNING_SECONDS = 10

type Phase = 'active' | 'warning'

interface UseInactivityLogoutOptions {
  enabled: boolean
  onLogout: () => void | Promise<void>
  idleMs?: number
  warningSeconds?: number
}

export function useInactivityLogout({
  enabled,
  onLogout,
  idleMs = DEFAULT_INACTIVITY_IDLE_MS,
  warningSeconds = DEFAULT_INACTIVITY_WARNING_SECONDS,
}: UseInactivityLogoutOptions) {
  const [phase, setPhase] = useState<Phase>('active')
  const [secondsLeft, setSecondsLeft] = useState(warningSeconds)

  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastActivityThrottleRef = useRef(0)
  const onLogoutRef = useRef(onLogout)
  onLogoutRef.current = onLogout

  const clearIdleTimer = useCallback(() => {
    if (idleTimerRef.current != null) {
      clearTimeout(idleTimerRef.current)
      idleTimerRef.current = null
    }
  }, [])

  const scheduleIdleTimer = useCallback(() => {
    clearIdleTimer()
    if (!enabled) {
      return
    }
    idleTimerRef.current = setTimeout(() => {
      idleTimerRef.current = null
      setPhase('warning')
    }, idleMs)
  }, [clearIdleTimer, enabled, idleMs])

  const recordActivity = useCallback(() => {
    if (!enabled || phase === 'warning') {
      return
    }
    const now = Date.now()
    if (now - lastActivityThrottleRef.current < ACTIVITY_THROTTLE_MS) {
      return
    }
    lastActivityThrottleRef.current = now
    scheduleIdleTimer()
  }, [enabled, phase, scheduleIdleTimer])

  const cancelWarning = useCallback(() => {
    setPhase('active')
    scheduleIdleTimer()
  }, [scheduleIdleTimer])

  useEffect(() => {
    if (!enabled) {
      clearIdleTimer()
      setPhase('active')
      return
    }
    scheduleIdleTimer()
    return () => {
      clearIdleTimer()
    }
  }, [enabled, scheduleIdleTimer, clearIdleTimer])

  useEffect(() => {
    if (!enabled) {
      return
    }
    const opts = { capture: true, passive: true } as const
    const events: (keyof WindowEventMap)[] = [
      'mousedown',
      'mousemove',
      'keydown',
      'touchstart',
      'wheel',
      'scroll',
    ]
    const onEvt = () => {
      recordActivity()
    }
    for (const evt of events) {
      window.addEventListener(evt, onEvt, opts)
    }
    return () => {
      for (const evt of events) {
        window.removeEventListener(evt, onEvt, opts)
      }
    }
  }, [enabled, recordActivity])

  useEffect(() => {
    if (!enabled || phase !== 'warning') {
      return
    }
    setSecondsLeft(warningSeconds)
    let remaining = warningSeconds
    const id = window.setInterval(() => {
      remaining -= 1
      setSecondsLeft(remaining)
      if (remaining <= 0) {
        window.clearInterval(id)
        void onLogoutRef.current()
      }
    }, 1000)
    return () => window.clearInterval(id)
  }, [enabled, phase, warningSeconds])

  useEffect(() => {
    if (phase === 'warning') {
      clearIdleTimer()
    }
  }, [phase, clearIdleTimer])

  return {
    isWarningOpen: phase === 'warning',
    secondsLeft,
    cancelWarning,
  }
}
