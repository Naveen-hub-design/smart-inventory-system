import { useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Play, Pause } from 'lucide-react'

export const demoMode = { current: false }

export function useDemoMode() {
  return demoMode.current
}

export default function DemoModeToggle() {
  const [active, setActive] = useState(false)
  const [visible, setVisible] = useState(true)
  const hiddenTimer = useRef<ReturnType<typeof setTimeout>>()
  const btnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
        e.preventDefault()
        toggle()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  function toggle() {
    setActive((prev) => {
      const next = !prev
      demoMode.current = next
      return next
    })
  }

  useEffect(() => {
    const handleMove = () => {
      setVisible(true)
      clearTimeout(hiddenTimer.current)
      hiddenTimer.current = setTimeout(() => setVisible(false), 3000)
    }
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('touchstart', handleMove)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('touchstart', handleMove)
      clearTimeout(hiddenTimer.current)
    }
  }, [])

  return (
    <button
      ref={btnRef}
      onClick={toggle}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggle() }}
      aria-label={active ? 'Disable demo mode' : 'Enable demo mode'}
      aria-pressed={active}
      tabIndex={0}
      className={`fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all duration-300 border ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
      } ${
        active
          ? 'bg-primary-600/30 border-primary-500/40 text-primary-300 shadow-lg shadow-primary-500/10'
          : 'bg-white/5 border-white/10 text-white/50 hover:text-white/70 hover:border-white/20'
      }`}
    >
      {active ? (
        <>
          <Pause className="w-3 h-3" />
          <span>Demo Active</span>
        </>
      ) : (
        <>
          <Play className="w-3 h-3" />
          <span>Demo Mode</span>
        </>
      )}
    </button>
  )
}
