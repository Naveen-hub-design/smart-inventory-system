import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const panelGeo = new THREE.PlaneGeometry(2.0, 1.4)

const BAR_LABELS = ['Electronics', 'Food', 'Materials', 'Fragile']
const LINE_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function createCanvasTexture() {
  const c = document.createElement('canvas')
  c.width = 640; c.height = 440
  const ctx = c.getContext('2d')!
  ctx.imageSmoothingEnabled = true
  const tex = new THREE.CanvasTexture(c)
  tex.minFilter = THREE.LinearFilter
  tex.magFilter = THREE.LinearFilter
  return { c, ctx, tex }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function draw(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  bars: number[], lineVals: number[], occupancy: number, timer: number,
) {
  ctx.clearRect(0, 0, w, h)

  ctx.fillStyle = 'rgba(8, 18, 38, 0.75)'
  roundRect(ctx, 0, 0, w, h, 10)
  ctx.fill()

  ctx.strokeStyle = 'rgba(68, 136, 255, 0.2)'
  ctx.lineWidth = 2
  roundRect(ctx, 0, 0, w, h, 10)
  ctx.stroke()

  ctx.fillStyle = '#6699ff'
  ctx.font = 'bold 18px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  ctx.fillText('LIVE ANALYTICS', w / 2, 12)

  ctx.strokeStyle = 'rgba(68, 136, 255, 0.08)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(16, 42)
  ctx.lineTo(w - 16, 42)
  ctx.stroke()

  const chartW = (w - 40) / 2
  const chartH = 200

  // Bar chart
  const bx = 16; const by = 52; const bw = chartW; const bh = chartH
  ctx.fillStyle = 'rgba(68, 136, 255, 0.04)'
  roundRect(ctx, bx, by, bw, bh, 6)
  ctx.fill()

  ctx.fillStyle = '#5588cc'
  ctx.font = '12px Arial'
  ctx.textAlign = 'left'
  ctx.fillText('Stock Levels', bx + 10, by + 8)

  const barW = (bw - 32) / bars.length
  const maxBar = Math.max(...bars, 1)
  bars.forEach((val, i) => {
    const barH = (val / maxBar) * (bh - 60)
    const xx = bx + 16 + i * barW + 4
    const yy = by + bh - 30 - barH

    const hue = 200 + i * 25
    ctx.fillStyle = `hsl(${hue}, 70%, ${55 + (val / maxBar) * 25}%)`
    roundRect(ctx, xx, yy, barW - 8, barH, 3)
    ctx.fill()

    ctx.fillStyle = '#8899aa'
    ctx.font = '9px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(BAR_LABELS[i].slice(0, 4), xx + (barW - 8) / 2, by + bh - 20)
  })

  // Line chart
  const lx = bx + bw + 8; const ly = by; const lw = chartW; const lh = chartH
  ctx.fillStyle = 'rgba(68, 136, 255, 0.04)'
  roundRect(ctx, lx, ly, lw, lh, 6)
  ctx.fill()

  ctx.fillStyle = '#5588cc'
  ctx.font = '12px Arial'
  ctx.textAlign = 'left'
  ctx.fillText('Sales Trend', lx + 10, ly + 8)

  const maxLine = Math.max(...lineVals, 1)
  const stepX = (lw - 32) / (lineVals.length - 1)
  const pts = lineVals.map((v, i) => ({
    x: lx + 16 + i * stepX,
    y: ly + lh - 30 - (v / maxLine) * (lh - 60),
  }))

  ctx.beginPath()
  pts.forEach((p, i) => { i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y) })
  ctx.strokeStyle = '#4488ff'
  ctx.lineWidth = 2
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(pts[0].x, ly + lh - 30)
  pts.forEach((p) => ctx.lineTo(p.x, p.y))
  ctx.lineTo(pts[pts.length - 1].x, ly + lh - 30)
  ctx.closePath()
  ctx.fillStyle = 'rgba(68, 136, 255, 0.1)'
  ctx.fill()

  pts.forEach((p, i) => {
    ctx.beginPath()
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2)
    ctx.fillStyle = '#6699ff'
    ctx.fill()
    ctx.fillStyle = '#8899aa'
    ctx.font = '8px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(LINE_LABELS[i], p.x, ly + lh - 14)
  })

  // Occupancy gauge
  const gx = 16; const gy = by + bh + 12; const gw = w - 32; const gh = h - gy - 16
  ctx.fillStyle = 'rgba(68, 136, 255, 0.04)'
  roundRect(ctx, gx, gy, gw, gh, 6)
  ctx.fill()

  ctx.fillStyle = '#5588cc'
  ctx.font = '13px Arial'
  ctx.textAlign = 'left'
  ctx.fillText('Warehouse Occupancy', gx + 12, gy + 10)

  const gaugeCX = gw / 2; const gaugeCY = gy + gh * 0.55; const gaugeR = Math.min(gw, gh) * 0.3
  const angle = (occupancy / 100) * Math.PI * 2 - Math.PI / 2

  ctx.strokeStyle = 'rgba(68, 136, 255, 0.1)'
  ctx.lineWidth = 10
  ctx.beginPath()
  ctx.arc(gaugeCX, gaugeCY, gaugeR, -Math.PI * 0.75, Math.PI * 0.75)
  ctx.stroke()

  ctx.strokeStyle = occupancy > 80 ? '#ff6644' : occupancy > 60 ? '#44cc66' : '#4488ff'
  ctx.lineWidth = 10
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.arc(gaugeCX, gaugeCY, gaugeR, -Math.PI * 0.75, -Math.PI * 0.75 + angle * 0.75)
  ctx.stroke()
  ctx.lineCap = 'butt'

  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 28px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(`${Math.round(occupancy)}%`, gaugeCX, gaugeCY)

  ctx.fillStyle = '#8899aa'
  ctx.font = '11px Arial'
  ctx.fillText('Capacity', gaugeCX, gaugeCY + 30)
}

export default function StockAnalytics() {
  const { c, ctx, tex } = useMemo(createCanvasTexture, [])
  const bars = useRef([340, 520, 280, 190])
  const barTargets = useRef([340, 520, 280, 190])
  const lineVals = useRef([320, 380, 360, 420, 450, 410, 480])
  const lineTargets = useRef([320, 380, 360, 420, 450, 410, 480])
  const occupancy = useRef(72)
  const occTarget = useRef(72)
  const changeTimer = useRef(0)
  const timer = useRef(0)
  const lastKey = useRef('')

  useFrame((state, delta) => {
    timer.current += delta * 0.3
    changeTimer.current += delta
    if (changeTimer.current > 3 + Math.random() * 2) {
      changeTimer.current = 0
      barTargets.current = barTargets.current.map(v => Math.max(50, v + (Math.random() - 0.5) * 200))
      lineTargets.current = lineTargets.current.map(v => Math.max(100, v + (Math.random() - 0.5) * 150))
      occTarget.current = Math.max(20, Math.min(98, occTarget.current + (Math.random() - 0.5) * 15))
    }

    bars.current = bars.current.map((v, i) => v + (barTargets.current[i] - v) * delta * 2)
    lineVals.current = lineVals.current.map((v, i) => v + (lineTargets.current[i] - v) * delta * 2)
    occupancy.current += (occTarget.current - occupancy.current) * delta * 2

    const key = `${timer.current.toFixed(0)}:${bars.current.map(v => Math.round(v)).join(',')}:${Math.round(occupancy.current)}`
    if (key !== lastKey.current) {
      lastKey.current = key
      draw(ctx, c.width, c.height, bars.current.map(v => Math.round(v)), lineVals.current.map(v => Math.round(v)), occupancy.current, timer.current)
      tex.needsUpdate = true
    }
  })

  return (
    <group position={[-12, 3.0, -6]} rotation={[0, 0.85, 0]}>
      <mesh geometry={panelGeo}>
        <meshBasicMaterial map={tex} transparent depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
    </group>
  )
}
