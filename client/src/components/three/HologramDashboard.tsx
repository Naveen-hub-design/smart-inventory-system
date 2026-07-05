import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const panelGeo = new THREE.PlaneGeometry(2.2, 1.6)

const data = [
  { val: 1218, target: 1218, label: 'Total Products', unit: '' },
  { val: 872, target: 872, label: 'Total Materials', unit: '' },
  { val: 24, target: 24, label: 'Low Stock Items', unit: '' },
  { val: 18, target: 18, label: 'Suppliers', unit: '' },
  { val: 4280, target: 4280, label: 'Sales Today', unit: '$' },
  { val: 36, target: 36, label: 'Purchase Orders', unit: '' },
  { val: 72, target: 72, label: 'Warehouse Util', unit: '%' },
  { val: 12, target: 12, label: 'Pending Deliveries', unit: '' },
]

function createCanvasTexture() {
  const c = document.createElement('canvas')
  c.width = 640; c.height = 480
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

function draw(ctx: CanvasRenderingContext2D, w: number, h: number, vals: number[], timer: number) {
  ctx.clearRect(0, 0, w, h)

  ctx.fillStyle = 'rgba(8, 18, 38, 0.75)'
  roundRect(ctx, 0, 0, w, h, 12)
  ctx.fill()

  ctx.strokeStyle = 'rgba(68, 136, 255, 0.2)'
  ctx.lineWidth = 2
  roundRect(ctx, 0, 0, w, h, 12)
  ctx.stroke()

  ctx.fillStyle = '#6699ff'
  ctx.font = 'bold 22px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  ctx.fillText('AI DIGITAL TWIN', w / 2, 16)

  ctx.strokeStyle = 'rgba(68, 136, 255, 0.1)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(20, 52)
  ctx.lineTo(w - 20, 52)
  ctx.stroke()

  const cols = 2; const rows = 4
  const cw = (w - 48) / cols
  const rh = (h - 72) / rows

  for (let i = 0; i < vals.length; i++) {
    const col = i % cols; const row = Math.floor(i / cols)
    const cx = 24 + col * cw; const cy = 64 + row * rh

    const glow = Math.sin(timer + i * 0.8) * 0.08 + 0.92

    ctx.fillStyle = 'rgba(68, 136, 255, 0.06)'
    roundRect(ctx, cx + 4, cy + 4, cw - 8, rh - 8, 6)
    ctx.fill()

    ctx.fillStyle = '#5588cc'
    ctx.font = '14px Arial'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText(data[i].label, cx + 14, cy + 10)

    const fmt = data[i].unit === '$' ? `$${vals[i].toLocaleString()}` : `${vals[i]}${data[i].unit}`
    ctx.fillStyle = `rgba(255, 255, 255, ${glow})`
    ctx.font = 'bold 24px Arial'
    ctx.textAlign = 'right'
    ctx.fillText(fmt, cx + cw - 14, cy + rh - 48)

    ctx.fillStyle = 'rgba(68, 136, 255, 0.12)'
    ctx.fillRect(cx + 14, cy + rh - 22, cw - 28, 3)
    ctx.fillStyle = 'rgba(68, 136, 255, 0.4)'
    ctx.fillRect(cx + 14, cy + rh - 22, (cw - 28) * ((vals[i] % 100) / 100), 3)
  }
}

export default function HologramDashboard() {
  const { c, ctx, tex } = useMemo(createCanvasTexture, [])
  const timer = useRef(0)
  const changeTimer = useRef(0)
  const lastKey = useRef('')

  useFrame((state, delta) => {
    timer.current += delta * 0.5
    changeTimer.current += delta

    if (changeTimer.current > 4 + Math.random() * 3) {
      changeTimer.current = 0
      data.forEach((d) => {
        d.target = Math.max(1, Math.round(d.val + (Math.random() - 0.5) * d.val * 0.15))
      })
    }

    data.forEach((d) => {
      d.val += (d.target - d.val) * delta * 2
    })

    const key = `${timer.current.toFixed(1)}:${data.map(d => Math.round(d.val)).join(',')}`
    if (key !== lastKey.current) {
      lastKey.current = key
      draw(ctx, c.width, c.height, data.map(d => Math.round(d.val)), timer.current)
      tex.needsUpdate = true
    }
  })

  return (
    <group position={[-12, 5.5, -6]} rotation={[0, 0.85, 0]}>
      <mesh geometry={panelGeo}>
        <meshBasicMaterial map={tex} transparent depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
    </group>
  )
}
