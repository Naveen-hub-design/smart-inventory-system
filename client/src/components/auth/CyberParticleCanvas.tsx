import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  baseAlpha: number
  alpha: number
  color: string
  pulseSpeed: number
  pulseOffset: number
}

export default function CyberParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth)
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight)

    const mouse = {
      x: width / 2,
      y: height / 2,
      targetX: width / 2,
      targetY: height / 2,
      isHovered: false,
    }

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return
      width = canvas.width = canvas.parentElement.clientWidth
      height = canvas.height = canvas.parentElement.clientHeight
    }

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouse.targetX = e.clientX - rect.left
      mouse.targetY = e.clientY - rect.top
      mouse.isHovered = true
    }

    const handleMouseLeave = () => {
      mouse.isHovered = false
    }

    const parent = canvas.parentElement
    if (parent) {
      parent.addEventListener('mousemove', handleMouseMove)
      parent.addEventListener('mouseleave', handleMouseLeave)
    }
    window.addEventListener('resize', handleResize)

    // Palette of high-tech neon colors
    const colors = ['#38bdf8', '#818cf8', '#c084fc', '#60a5fa', '#34d399']
    const particleCount = Math.min(Math.floor((width * height) / 12000), 75)

    const particles: Particle[] = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      size: Math.random() * 2 + 1,
      baseAlpha: Math.random() * 0.4 + 0.25,
      alpha: Math.random() * 0.4 + 0.25,
      color: colors[Math.floor(Math.random() * colors.length)],
      pulseSpeed: Math.random() * 0.03 + 0.01,
      pulseOffset: Math.random() * Math.PI * 2,
    }))

    let time = 0

    const render = () => {
      time += 0.02
      ctx.clearRect(0, 0, width, height)

      // Smooth mouse interpolation
      mouse.x += (mouse.targetX - mouse.x) * 0.08
      mouse.y += (mouse.targetY - mouse.y) * 0.08

      // Update & draw particles
      particles.forEach((p, i) => {
        p.x += p.vx
        p.y += p.vy

        // Wrap edges
        if (p.x < 0) p.x = width
        if (p.x > width) p.x = 0
        if (p.y < 0) p.y = height
        if (p.y > height) p.y = 0

        // Pulse alpha
        p.alpha = p.baseAlpha + Math.sin(time * p.pulseSpeed + p.pulseOffset) * 0.15

        // Mouse attraction force
        if (mouse.isHovered) {
          const dx = mouse.x - p.x
          const dy = mouse.y - p.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 180) {
            const force = (180 - dist) / 180
            p.x += (dx / dist) * force * 0.8
            p.y += (dy / dist) * force * 0.8
          }
        }

        // Draw particle dot with glow
        ctx.save()
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.globalAlpha = p.alpha
        ctx.shadowColor = p.color
        ctx.shadowBlur = 10
        ctx.fill()
        ctx.restore()

        // Connect nearby particles with glowing laser threads
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j]
          const dx = p.x - p2.x
          const dy = p.y - p2.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          const maxDist = 120

          if (dist < maxDist) {
            const lineAlpha = (1 - dist / maxDist) * 0.25 * p.alpha
            ctx.save()
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.strokeStyle = p.color
            ctx.globalAlpha = lineAlpha
            ctx.lineWidth = 0.8
            ctx.stroke()
            ctx.restore()
          }
        }

        // Connect to mouse cursor with laser beam if close
        if (mouse.isHovered) {
          const dx = mouse.x - p.x
          const dy = mouse.y - p.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 150) {
            const beamAlpha = (1 - dist / 150) * 0.35
            ctx.save()
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(mouse.x, mouse.y)
            ctx.strokeStyle = '#60a5fa'
            ctx.globalAlpha = beamAlpha
            ctx.lineWidth = 1
            ctx.stroke()
            ctx.restore()
          }
        }
      })

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      cancelAnimationFrame(animationFrameId)
      if (parent) {
        parent.removeEventListener('mousemove', handleMouseMove)
        parent.removeEventListener('mouseleave', handleMouseLeave)
      }
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-0 h-full w-full opacity-80"
    />
  )
}
