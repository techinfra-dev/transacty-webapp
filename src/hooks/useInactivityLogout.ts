import { useCallback, useEffect, useRef, useState } from 'react'

const ACTIVITY_THROTTLE_MS = 1000

export const DEFAULT_INACTIVITY_IDLE_MS = 10 * 60 * 1000
export const DEFAULT_INACTIVITY_WARNING_SECONDS = 10

type Phase = 'active' | 'warning'

interface UseInactivityLogoutOptions {
  enabled: boolean
  onLogout: () => void | Promise<void>
  idleMs?: number
  warningSeconds?: number
}

/**
 * Idle logout.
 *
 * Timers alone are not a session deadline: browsers throttle (and in some cases
 * fully freeze) `setTimeout`/`setInterval` in background tabs, so a tab left in
 * the background can outlive its own idle deadline and still be authenticated
 * when the user returns.
 *
 * So the deadline is kept as a wall-clock timestamp. Timers are only an
 * optimisation for the foreground case; whenever the tab becomes visible again
 * the elapsed real time is re-checked and an expired session is terminated
 * immediately.
 */
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
  /** Wall-clock time the idle period expires (warning opens). */
  const idleDeadlineRef = useRef<number>(Number.POSITIVE_INFINITY)
  const hasLoggedOutRef = useRef(false)
  const onLogoutRef = useRef(onLogout)
  useEffect(() => {
    onLogoutRef.current = onLogout
  }, [onLogout])

  const warningMs = warningSeconds * 1000

  const clearIdleTimer = useCallback(() => {
    if (idleTimerRef.current != null) {
      clearTimeout(idleTimerRef.current)
      idleTimerRef.current = null
    }
  }, [])

  const triggerLogout = useCallback(() => {
    if (hasLoggedOutRef.current) {
      return
    }
    hasLoggedOutRef.current = true
    clearIdleTimer()
    void onLogoutRef.current()
  }, [clearIdleTimer])

  const scheduleIdleTimer = useCallback(() => {
    clearIdleTimer()
    if (!enabled) {
      idleDeadlineRef.current = Number.POSITIVE_INFINITY
      return
    }
    // Wall-clock deadline is the source of truth; the timer is best-effort.
    idleDeadlineRef.current = Date.now() + idleMs
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
      idleDeadlineRef.current = Number.POSITIVE_INFINITY
      hasLoggedOutRef.current = false
      setPhase('active')
      return
    }
    hasLoggedOutRef.current = false
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

  /**
   * Re-check the real elapsed time whenever the tab comes back to the
   * foreground. This is what catches a throttled or frozen background tab.
   */
  useEffect(() => {
    if (!enabled) {
      return
    }
    const reconcile = () => {
      if (document.visibilityState !== 'visible') {
        return
      }
      const now = Date.now()
      const idleDeadline = idleDeadlineRef.current
      if (now >= idleDeadline + warningMs) {
        // The whole idle period AND the warning window elapsed while hidden.
        triggerLogout()
        return
      }
      if (now >= idleDeadline) {
        // Idle expired while hidden; show the warning with the time actually left.
        setPhase('warning')
        setSecondsLeft(Math.ceil((idleDeadline + warningMs - now) / 1000))
      }
    }
    document.addEventListener('visibilitychange', reconcile)
    window.addEventListener('focus', reconcile)
    // Also reconcile on mount, in case the tab was restored from bfcache.
    window.addEventListener('pageshow', reconcile)
    return () => {
      document.removeEventListener('visibilitychange', reconcile)
      window.removeEventListener('focus', reconcile)
      window.removeEventListener('pageshow', reconcile)
    }
  }, [enabled, warningMs, triggerLogout])

  /**
   * Warning countdown. Driven off a wall-clock deadline rather than by
   * decrementing a counter, so a throttled interval cannot stretch it.
   */
  useEffect(() => {
    if (!enabled || phase !== 'warning') {
      return
    }
    const logoutDeadline = Math.max(
      idleDeadlineRef.current + warningMs,
      Date.now(),
    )
    const tick = () => {
      const remaining = logoutDeadline - Date.now()
      if (remaining <= 0) {
        window.clearInterval(id)
        triggerLogout()
        return
      }
      setSecondsLeft(Math.ceil(remaining / 1000))
    }
    tick()
    const id = window.setInterval(tick, 250)
    return () => window.clearInterval(id)
  }, [enabled, phase, warningMs, triggerLogout])

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
