import { useEffect, useRef, useCallback } from 'react'

interface UseIdleTimerOptions {
  timeoutMinutes: number
  onWarn: () => void
  onExpired: () => void
  enabled?: boolean
}

export function useIdleTimer({ timeoutMinutes, onWarn, onExpired, enabled = true }: UseIdleTimerOptions) {
  const warnCalledRef = useRef(false)
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const warnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearAll = useCallback(() => {
    if (idleTimerRef.current) { clearTimeout(idleTimerRef.current); idleTimerRef.current = null }
    if (warnTimerRef.current) { clearTimeout(warnTimerRef.current); warnTimerRef.current = null }
  }, [])

  const reset = useCallback(() => {
    warnCalledRef.current = false
    clearAll()
    if (!enabled || timeoutMinutes <= 0) return
    const warnMs = Math.max((timeoutMinutes * 60 - 60) * 1000, 10000)
    const expireMs = timeoutMinutes * 60 * 1000
    warnTimerRef.current = setTimeout(() => {
      if (!warnCalledRef.current) {
        warnCalledRef.current = true
        onWarn()
      }
    }, warnMs)
    idleTimerRef.current = setTimeout(() => {
      onExpired()
    }, expireMs)
  }, [timeoutMinutes, enabled, onWarn, onExpired, clearAll])

  useEffect(() => {
    if (!enabled) return
    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click']
    const handler = () => { reset() }
    events.forEach((e) => window.addEventListener(e, handler))
    reset()
    return () => {
      events.forEach((e) => window.removeEventListener(e, handler))
      clearAll()
    }
  }, [enabled, reset, clearAll])

  return { reset }
}
