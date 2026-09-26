import { useEffect, useRef, useState, type ReactNode } from 'react'

/** Fade-and-rise reveal on scroll. Runs once, GPU-friendly, no CSS additions. */
export function Reveal({
  children,
  delay = 0,
  className = '',
}: {
  children: ReactNode
  delay?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          io.disconnect()
        }
      },
      { threshold: 0.12 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`${className} transition-all duration-700 ease-out ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      }`}
    >
      {children}
    </div>
  )
}

/** Observe when an element enters the viewport (once). */
export function useInView<T extends HTMLElement>(threshold = 0.3) {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          io.disconnect()
        }
      },
      { threshold }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [threshold])

  return { ref, inView }
}

/** Subtle ease-out number count-up, starts when `started` becomes true. */
export function useCountUp(target: number, started: boolean, duration = 1400) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!started) return
    let raf = 0
    const t0 = performance.now()
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration)
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [started, target, duration])

  return value
}

export function formatIN(n: number) {
  return n.toLocaleString('en-IN')
}

/** Consistent section heading: numbered eyebrow + title + description. */
export function SectionHeading({
  eyebrow,
  title,
  desc,
  tone = 'light',
  index,
}: {
  eyebrow: string
  title: ReactNode
  desc: string
  tone?: 'light' | 'dark'
  index?: string
}) {
  const dark = tone === 'dark'
  return (
    <Reveal className="mx-auto max-w-2xl text-center">
      <span
        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase ${
          dark
            ? 'text-blue-300 bg-blue-500/10 border border-blue-400/20'
            : 'text-blue-700 bg-blue-50 border border-blue-200'
        }`}
      >
        {index && (
          <span className={`font-bold tabular-nums ${dark ? 'text-indigo-300' : 'text-blue-500'}`}>
            {index}
          </span>
        )}
        {eyebrow}
      </span>
      <h2
        className={`mt-4 text-3xl sm:text-4xl font-bold tracking-tight text-balance ${
          dark ? 'text-white' : 'text-slate-900'
        }`}
      >
        {title}
      </h2>
      <p
        className={`mt-3 text-sm sm:text-base leading-relaxed ${
          dark ? 'text-slate-400' : 'text-slate-600'
        }`}
      >
        {desc}
      </p>
    </Reveal>
  )
}
