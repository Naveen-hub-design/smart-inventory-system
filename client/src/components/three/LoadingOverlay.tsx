import { useState, useEffect, useCallback } from 'react'
import { Package } from 'lucide-react'

const STEPS = [
  { label: 'Loading warehouse', duration: 800 },
  { label: 'Connecting AI', duration: 600 },
  { label: 'Loading Inventory', duration: 700 },
  { label: 'Starting Analytics', duration: 500 },
  { label: 'Synchronizing Warehouse', duration: 600 },
  { label: 'Complete', duration: 400 },
]

interface LoadingOverlayProps {
  onComplete: () => void
}

export default function LoadingOverlay({ onComplete }: LoadingOverlayProps) {
  const [stepIdx, setStepIdx] = useState(0)
  const [subProgress, setSubProgress] = useState(0)
  const [fadeOut, setFadeOut] = useState(false)

  const advance = useCallback(() => {
    setStepIdx((prev) => {
      const next = prev + 1
      if (next >= STEPS.length) {
        setFadeOut(true)
        setTimeout(onComplete, 600)
        return prev
      }
      return next
    })
  }, [onComplete])

  useEffect(() => {
    if (stepIdx >= STEPS.length - 1 && fadeOut) return
    const step = STEPS[Math.min(stepIdx, STEPS.length - 1)]
    const startTime = performance.now()
    let raf: number
    function tick(now: number) {
      const elapsed = now - startTime
      const progress = Math.min(1, elapsed / step.duration)
      setSubProgress(progress)
      if (progress >= 1) {
        advance()
      } else {
        raf = requestAnimationFrame(tick)
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [stepIdx, advance, fadeOut])

  const currentStep = STEPS[Math.min(stepIdx, STEPS.length - 1)]
  const totalProgress = (stepIdx + subProgress) / STEPS.length

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900 transition-opacity duration-700 ${fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      role="progressbar"
      aria-valuenow={Math.round(totalProgress * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Loading"
    >
      <div className="relative mb-8">
        <div className="w-20 h-20 bg-gradient-to-br from-primary-500/20 to-primary-700/20 rounded-2xl flex items-center justify-center border border-primary-500/20">
          <Package className="w-10 h-10 text-primary-400" />
        </div>
        <div className="absolute -inset-4 bg-primary-500/5 blur-2xl rounded-full" />
      </div>

      <h1 className="text-xl font-bold text-white tracking-tight mb-1">
        Smart Inventory
      </h1>
      <p className="text-sm text-primary-300/60 mb-10 font-medium tracking-wide">
        Management System
      </p>

      <div className="w-64 mb-4">
        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full transition-all duration-200 ease-out"
            style={{ width: `${subProgress * 100}%` }}
          />
        </div>
      </div>

      <p className="text-sm text-primary-300/80 font-medium">
        {currentStep.label}
        {currentStep.label !== 'Complete' && (
          <span className="inline-flex ml-1">
            <span className="animate-pulse-soft">.</span>
            <span className="animate-pulse-soft" style={{ animationDelay: '0.2s' }}>.</span>
            <span className="animate-pulse-soft" style={{ animationDelay: '0.4s' }}>.</span>
          </span>
        )}
      </p>

      <p className="text-xs text-white/20 mt-2 tabular-nums">
        {Math.round(totalProgress * 100)}%
      </p>
    </div>
  )
}
