import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const panelGeo = new THREE.PlaneGeometry(1.4, 0.8)

const RECOMMENDATIONS = [
  { icon: '→', text: 'Restock Product A', detail: 'Electronics', color: '#ffaa44' },
  { icon: '→', text: 'Material X Running Low', detail: 'Storage B-12', color: '#ff6644' },
  { icon: '✓', text: 'Supplier Y Delivered', detail: '48 units', color: '#44cc66' },
  { icon: '↑', text: 'High Sales Today', detail: '+23% vs yesterday', color: '#44cc66' },
  { icon: '⟳', text: 'Inventory Synced', detail: '5s ago', color: '#4488ff' },
  { icon: '→', text: 'Schedule Maintenance', detail: 'Belt motor B', color: '#ffaa44' },
  { icon: '✓', text: 'Quality Check Passed', detail: 'All batches', color: '#44cc66' },
  { icon: '↑', text: 'Shipment Dispatched', detail: 'Route 3', color: '#4488ff' },
]

function createCanvasTexture() {
  const c = document.createElement('canvas')
  c.width = 512; c.height = 300
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

function draw(ctx: CanvasRenderingContext2D, w: number, h: number, recIdx: number, prevIdx: number, transition: number, timer: number) {
  ctx.clearRect(0, 0, w, h)

  ctx.fillStyle = 'rgba(8, 18, 38, 0.75)'
  roundRect(ctx, 0, 0, w, h, 10)
  ctx.fill()

  ctx.strokeStyle = 'rgba(68, 136, 255, 0.2)'
  ctx.lineWidth = 2
  roundRect(ctx, 0, 0, w, h, 10)
  ctx.stroke()

  ctx.fillStyle = '#6699ff'
  ctx.font = 'bold 16px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  ctx.fillText('AI RECOMMENDATIONS', w / 2, 12)

  ctx.strokeStyle = 'rgba(68, 136, 255, 0.08)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(20, 40)
  ctx.lineTo(w - 20, 40)
  ctx.stroke()

  const rec = RECOMMENDATIONS[recIdx]
  const prev = RECOMMENDATIONS[prevIdx]
  const fadeIn = Math.min(1, transition * 3)
  const fadeOut = 1 - Math.min(1, transition * 3)

  if (fadeOut > 0.01) {
    ctx.globalAlpha = fadeOut * 0.3
    ctx.fillStyle = prev.color
    ctx.font = '24px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(prev.icon, 55, h * 0.5 - 16)
    ctx.fillStyle = '#cccccc'
    ctx.font = 'bold 16px Arial'
    ctx.fillText(prev.text, w * 0.5, h * 0.5 - 18)
    ctx.fillStyle = '#8899aa'
    ctx.font = '13px Arial'
    ctx.fillText(prev.detail, w * 0.5, h * 0.5 + 6)
    ctx.globalAlpha = 1
  }

  ctx.globalAlpha = fadeIn
  ctx.fillStyle = rec.color
  ctx.font = '28px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(rec.icon, 55, h * 0.5 - 16)

  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 17px Arial'
  ctx.fillText(rec.text, w * 0.5, h * 0.5 - 18)

  ctx.fillStyle = '#8899aa'
  ctx.font = '13px Arial'
  ctx.fillText(rec.detail, w * 0.5, h * 0.5 + 8)
  ctx.globalAlpha = 1
}

export default function AIRecommendationPanel() {
  const { c, ctx, tex } = useMemo(createCanvasTexture, [])
  const recIdx = useRef(0)
  const prevIdx = useRef(0)
  const timer = useRef(0)
  const transition = useRef(0)
  const lastKey = useRef('')

  useFrame((state, delta) => {
    timer.current += delta
    transition.current += delta

    if (timer.current > 3.5) {
      timer.current = 0
      transition.current = 0
      prevIdx.current = recIdx.current
      recIdx.current = (recIdx.current + 1) % RECOMMENDATIONS.length
    }

    const key = `${recIdx.current}:${Math.floor(transition.current * 10)}`
    if (key !== lastKey.current) {
      lastKey.current = key
      draw(ctx, c.width, c.height, recIdx.current, prevIdx.current, transition.current, timer.current)
      tex.needsUpdate = true
    }
  })

  return (
    <group position={[0, 5.5, -9]} rotation={[0, 0.6, 0]}>
      <mesh geometry={panelGeo}>
        <meshBasicMaterial map={tex} transparent depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
    </group>
  )
}
