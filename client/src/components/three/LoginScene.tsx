import { useMemo } from 'react'

const PARTICLE_COUNT = 24

interface ParticleStyle {
  width: number
  height: number
  left: string
  top: string
  opacity: number
  animationDelay: string
  animationDuration: string
}

function generateParticles(): ParticleStyle[] {
  return Array.from({ length: PARTICLE_COUNT }, () => ({
    width: 2 + Math.random() * 4,
    height: 2 + Math.random() * 4,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    opacity: 0.15 + Math.random() * 0.35,
    animationDelay: `${Math.random() * 8}s`,
    animationDuration: `${6 + Math.random() * 8}s`,
  }))
}

export default function LoginScene() {
  const particles = useMemo(generateParticles, [])

  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-[#0a1628] to-[#0d1f3c] animate-gradient-shift" />

      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: [
            'linear-gradient(rgba(96,165,250,0.2) 1px, transparent 1px)',
            'linear-gradient(90deg, rgba(96,165,250,0.2) 1px, transparent 1px)',
          ].join(', '),
          backgroundSize: '48px 48px',
        }}
      />

      <svg
        className="absolute inset-0 w-full h-full opacity-[0.04]"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        viewBox="0 0 1440 900"
      >
        <defs>
          <linearGradient id="wave-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(59,130,246,0)" />
            <stop offset="50%" stopColor="rgba(59,130,246,0.5)" />
            <stop offset="100%" stopColor="rgba(59,130,246,0)" />
          </linearGradient>
        </defs>
        <path
          d="M0,500 C240,420 480,580 720,460 C960,340 1200,520 1440,420 L1440,900 L0,900 Z"
          fill="url(#wave-grad)"
          className="animate-wave-slow"
        />
        <path
          d="M0,600 C240,520 480,680 720,540 C960,400 1200,600 1440,500 L1440,900 L0,900 Z"
          fill="url(#wave-grad)"
          className="animate-wave-slower"
          style={{ opacity: 0.6 }}
        />
      </svg>

      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-primary-400/30 animate-particle-float"
          style={{
            width: p.width,
            height: p.height,
            left: p.left,
            top: p.top,
            opacity: p.opacity,
            animationDelay: p.animationDelay,
            animationDuration: p.animationDuration,
          }}
        />
      ))}

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary-500/8 rounded-full blur-[120px]" />
      <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[100px]" />
      <div className="absolute bottom-1/4 left-1/4 w-[350px] h-[350px] bg-blue-500/4 rounded-full blur-[80px]" />
    </div>
  )
}
