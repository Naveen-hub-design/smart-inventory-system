import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const panelGeo = new THREE.PlaneGeometry(1.1, 0.5)

const STATUS_ITEMS = [
  'Warehouse Online',
  'Scanner Active',
  'AI Monitoring',
  'Inventory Sync',
]

function createCanvasTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 256
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingEnabled = true
  const tex = new THREE.CanvasTexture(canvas)
  tex.minFilter = THREE.LinearFilter
  tex.magFilter = THREE.LinearFilter
  return { canvas, ctx, tex }
}

function drawPanel(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  pulsePhase: number,
) {
  ctx.clearRect(0, 0, w, h)

  ctx.fillStyle = 'rgba(8, 18, 38, 0.7)'
  roundRect(ctx, 0, 0, w, h, 10)
  ctx.fill()

  ctx.strokeStyle = 'rgba(68, 255, 136, 0.15)'
  ctx.lineWidth = 1.5
  roundRect(ctx, 0, 0, w, h, 10)
  ctx.stroke()

  ctx.fillStyle = '#44cc66'
  ctx.font = 'bold 17px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  ctx.fillText('SYSTEM STATUS', w / 2, 14)

  ctx.strokeStyle = 'rgba(68, 255, 136, 0.08)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(20, 42)
  ctx.lineTo(w - 20, 42)
  ctx.stroke()

  STATUS_ITEMS.forEach((item, i) => {
    const y = 54 + i * 30

    const glow = 0.5 + Math.sin(pulsePhase + i * 1.2) * 0.15

    ctx.fillStyle = '#44cc66'
    ctx.font = '14px Arial'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText('✓', 24, y)

    ctx.fillStyle = `rgba(180, 220, 180, ${0.6 + glow * 0.4})`
    ctx.font = '14px Arial'
    ctx.fillText(item, 44, y)

    ctx.fillStyle = `rgba(68, 255, 136, ${0.05 + glow * 0.1})`
    ctx.fillRect(24, y + 20, w - 48, 1)
  })
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
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

export default function StatusMonitor() {
  const { canvas, ctx, tex } = useMemo(createCanvasTexture, [])
  const pulsePhase = useRef(0)
  const lastPhase = useRef(-1)

  useFrame((state, delta) => {
    pulsePhase.current += delta * 2
    const intPhase = Math.floor(pulsePhase.current * 10)
    if (intPhase !== lastPhase.current) {
      lastPhase.current = intPhase
      drawPanel(ctx, canvas.width, canvas.height, pulsePhase.current)
      tex.needsUpdate = true
    }
  })

  return (
    <group position={[-2.8, 1.3, 8.2]} rotation={[0, 0.1, 0]}>
      <mesh geometry={panelGeo} position={[0, 0, 0]}>
        <meshBasicMaterial map={tex} transparent depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
    </group>
  )
}
